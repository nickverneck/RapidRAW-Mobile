use image::{DynamicImage, GenericImageView, Rgb32FImage};

pub fn downscale_f32_image(image: &DynamicImage, nwidth: u32, nheight: u32) -> DynamicImage {
    let (width, height) = image.dimensions();
    if nwidth == 0 || nheight == 0 {
        return image.clone();
    }
    if nwidth >= width && nheight >= height {
        return image.clone();
    }

    let ratio = (nwidth as f32 / width as f32).min(nheight as f32 / height as f32);
    let new_w = (width as f32 * ratio).round() as u32;
    let new_h = (height as f32 * ratio).round() as u32;

    if new_w == 0 || new_h == 0 {
        return image.clone();
    }

    let img = image.to_rgb32f();
    let mut out = Rgb32FImage::new(new_w, new_h);

    let x_ratio = width as f32 / new_w as f32;
    let y_ratio = height as f32 / new_h as f32;

    for y_out in 0..new_h {
        for x_out in 0..new_w {
            let x_start = (x_out as f32 * x_ratio).floor() as u32;
            let y_start = (y_out as f32 * y_ratio).floor() as u32;
            let x_end = ((x_out + 1) as f32 * x_ratio).ceil() as u32;
            let y_end = ((y_out + 1) as f32 * y_ratio).ceil() as u32;

            let mut r_sum = 0.0;
            let mut g_sum = 0.0;
            let mut b_sum = 0.0;
            let mut count = 0.0;

            for y_in in y_start..y_end.min(height) {
                for x_in in x_start..x_end.min(width) {
                    let pixel = img.get_pixel(x_in, y_in);
                    r_sum += pixel[0];
                    g_sum += pixel[1];
                    b_sum += pixel[2];
                    count += 1.0;
                }
            }

            if count > 0.0 {
                out.put_pixel(
                    x_out,
                    y_out,
                    image::Rgb([r_sum / count, g_sum / count, b_sum / count]),
                );
            }
        }
    }

    DynamicImage::ImageRgb32F(out)
}
