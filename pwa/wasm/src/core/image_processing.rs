use image::DynamicImage;
use rayon::prelude::*;
use rawler::decoders::Orientation;

pub fn apply_orientation(image: DynamicImage, orientation: Orientation) -> DynamicImage {
    match orientation {
        Orientation::Normal | Orientation::Unknown => image,
        Orientation::HorizontalFlip => image.fliph(),
        Orientation::Rotate180 => image.rotate180(),
        Orientation::VerticalFlip => image.flipv(),
        Orientation::Transpose => image.rotate90().flipv(),
        Orientation::Rotate90 => image.rotate90(),
        Orientation::Transverse => image.rotate90().fliph(),
        Orientation::Rotate270 => image.rotate270(),
    }
}

pub fn apply_coarse_rotation(image: DynamicImage, orientation_steps: u8) -> DynamicImage {
    match orientation_steps {
        1 => image.rotate90(),
        2 => image.rotate180(),
        3 => image.rotate270(),
        _ => image,
    }
}

#[inline(always)]
fn rgb_to_yc_only(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let y = 0.299 * r + 0.587 * g + 0.114 * b;
    let cb = -0.168736 * r - 0.331264 * g + 0.5 * b;
    let cr = 0.5 * r - 0.418688 * g - 0.081312 * b;
    (y, cb, cr)
}

#[inline(always)]
fn yc_to_rgb(y: f32, cb: f32, cr: f32) -> (f32, f32, f32) {
    let r = y + 1.402 * cr;
    let g = y - 0.344136 * cb - 0.714136 * cr;
    let b = y + 1.772 * cb;
    (r, g, b)
}

pub fn remove_raw_artifacts_and_enhance(image: &mut DynamicImage) {
    let mut buffer = image.to_rgb32f();
    let w = buffer.width() as usize;
    let h = buffer.height() as usize;

    let mut ycbcr_buffer = vec![0.0f32; w * h * 3];

    let src = buffer.as_raw();

    ycbcr_buffer
        .par_chunks_mut(3)
        .zip(src.par_chunks(3))
        .for_each(|(dest, pixel)| {
            let (y, cb, cr) = rgb_to_yc_only(pixel[0], pixel[1], pixel[2]);
            dest[0] = y;
            dest[1] = cb;
            dest[2] = cr;
        });

    const BASE_INV_SIGMA: f32 = 14.0;
    const OFFSETS: [isize; 3] = [-5, -1, 3];
    const OFFSET_SQUARES: [f32; 3] = [25.0, 1.0, 9.0];

    buffer
        .par_chunks_mut(w * 3)
        .enumerate()
        .for_each(|(y, row)| {
            let row_offset = y * w;
            let h_isize = h as isize;
            let w_isize = w as isize;
            let y_isize = y as isize;

            for x in 0..w {
                let center_idx = (row_offset + x) * 3;

                let cy = ycbcr_buffer[center_idx];
                let ccb = ycbcr_buffer[center_idx + 1];
                let ccr = ycbcr_buffer[center_idx + 2];

                let mut cb_sum = 0.0;
                let mut cr_sum = 0.0;
                let mut w_sum = 0.0;

                for (ki, &ky) in OFFSETS.iter().enumerate() {
                    let sy = y_isize + ky as isize;
                    if sy < 0 || sy >= h_isize {
                        continue;
                    }

                    let neighbor_row_idx = (sy as usize) * w;
                    let ky_sq_div_50 = OFFSET_SQUARES[ki] * 0.02;

                    for (kj, &kx) in OFFSETS.iter().enumerate() {
                        let sx = (x as isize) + kx as isize;
                        if sx < 0 || sx >= w_isize {
                            continue;
                        }

                        let neighbor_idx = (neighbor_row_idx + sx as usize) * 3;

                        let neighbor_y = ycbcr_buffer[neighbor_idx];
                        let y_diff = (cy - neighbor_y).abs();

                        let val = y_diff * BASE_INV_SIGMA;
                        let spatial_penalty = OFFSET_SQUARES[kj] * 0.02 + ky_sq_div_50;

                        let weight = 1.0 / (1.0 + val * val + spatial_penalty);

                        cb_sum += ycbcr_buffer[neighbor_idx + 1] * weight;
                        cr_sum += ycbcr_buffer[neighbor_idx + 2] * weight;
                        w_sum += weight;
                    }
                }

                let (out_cb, out_cr) = if w_sum > 1e-4 {
                    let inv_w_sum = 1.0 / w_sum;
                    let filtered_cb = cb_sum * inv_w_sum;
                    let filtered_cr = cr_sum * inv_w_sum;

                    let orig_mag_sq = ccb * ccb + ccr * ccr;
                    let filt_mag_sq = filtered_cb * filtered_cb + filtered_cr * filtered_cr;

                    if filt_mag_sq > orig_mag_sq && orig_mag_sq > 1e-12 {
                        let scale = (orig_mag_sq / filt_mag_sq).sqrt();
                        (filtered_cb * scale, filtered_cr * scale)
                    } else {
                        (filtered_cb, filtered_cr)
                    }
                } else {
                    (ccb, ccr)
                };

                let (r, g, b) = yc_to_rgb(cy, out_cb, out_cr);
                let out_idx = x * 3;
                row[out_idx] = r;
                row[out_idx + 1] = g;
                row[out_idx + 2] = b;
            }
        });

    *image = DynamicImage::ImageRgb32F(buffer);
}
