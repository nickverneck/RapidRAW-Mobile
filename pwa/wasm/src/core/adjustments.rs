use image::DynamicImage;
use serde::Deserialize;

#[derive(Debug, Clone, Copy, Default, Deserialize)]
#[serde(default)]
pub struct SimpleAdjustments {
    pub exposure: f32,
    pub contrast: f32,
    pub highlights: f32,
    pub shadows: f32,
    pub temperature: f32,
    pub tint: f32,
    pub vibrance: f32,
    pub saturation: f32,
    pub clarity: f32,
    pub sharpness: f32,
    pub vignette: f32,
}

#[inline(always)]
fn clamp01(value: f32) -> f32 {
    value.max(0.0).min(1.0)
}

pub fn parse_adjustments(json: &str) -> SimpleAdjustments {
    serde_json::from_str::<SimpleAdjustments>(json).unwrap_or_default()
}

pub fn apply_basic_adjustments(image: &mut DynamicImage, adjustments: &SimpleAdjustments) {
    let mut buffer = image.to_rgb32f();
    let (width, height) = buffer.dimensions();
    let data = buffer.as_mut();

    if width == 0 || height == 0 {
        return;
    }

    let exposure_mult = 2.0_f32.powf(adjustments.exposure);
    let contrast_factor = 1.0_f32 + adjustments.contrast * 1.4_f32;
    let saturation_factor = 1.0_f32 + adjustments.saturation;
    let vibrance = adjustments.vibrance;
    let temperature = adjustments.temperature * 0.1_f32;
    let tint = adjustments.tint * 0.1_f32;
    let clarity = adjustments.clarity;
    let sharpness = adjustments.sharpness.max(0.0);
    let vignette = adjustments.vignette;

    let inv_w = 1.0_f32 / (width as f32 - 1.0_f32).max(1.0_f32);
    let inv_h = 1.0_f32 / (height as f32 - 1.0_f32).max(1.0_f32);
    let vignette_strength = vignette.clamp(-1.0, 1.0);

    for y in 0..height {
        let y_norm = (y as f32 * inv_h - 0.5) * 2.0;
        for x in 0..width {
            let idx = ((y * width + x) * 3) as usize;
            let mut r = data[idx] * exposure_mult;
            let mut g = data[idx + 1] * exposure_mult;
            let mut b = data[idx + 2] * exposure_mult;

            let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            let mut new_luma = luma;

            if adjustments.highlights.abs() > 0.001 && luma > 0.5 {
                let t = ((luma - 0.5_f32) * 2.0_f32).min(1.0_f32);
                new_luma += adjustments.highlights * t * (1.0_f32 - luma);
            }

            if adjustments.shadows.abs() > 0.001 && luma < 0.5 {
                let t = ((0.5_f32 - luma) * 2.0_f32).min(1.0_f32);
                new_luma += adjustments.shadows * t * (0.5_f32 - luma);
            }

            let luma_shift = new_luma - luma;
            r += luma_shift;
            g += luma_shift;
            b += luma_shift;

            r = (r - 0.5_f32) * contrast_factor + 0.5_f32;
            g = (g - 0.5_f32) * contrast_factor + 0.5_f32;
            b = (b - 0.5_f32) * contrast_factor + 0.5_f32;

            r += temperature - tint * 0.05_f32;
            b -= temperature - tint * 0.05_f32;
            g += tint * 0.1_f32;

            let luma2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            let mut sat_scale = saturation_factor;

            if vibrance.abs() > 0.001 {
                let max_c = r.max(g).max(b);
                let min_c = r.min(g).min(b);
                let sat = if max_c > 1e-6_f32 {
                    (max_c - min_c) / max_c
                } else {
                    0.0_f32
                };
                sat_scale *= 1.0_f32 + vibrance * (1.0_f32 - sat);
            }

            r = luma2 + (r - luma2) * sat_scale;
            g = luma2 + (g - luma2) * sat_scale;
            b = luma2 + (b - luma2) * sat_scale;

            if clarity.abs() > 0.001 {
                let mid = 1.0_f32 - ((luma2 - 0.5_f32).abs() * 2.0_f32).min(1.0_f32);
                let clarity_factor = 1.0_f32 + clarity * 0.6_f32 * mid;
                r = (r - 0.5_f32) * clarity_factor + 0.5_f32;
                g = (g - 0.5_f32) * clarity_factor + 0.5_f32;
                b = (b - 0.5_f32) * clarity_factor + 0.5_f32;
            }

            if sharpness > 0.0 {
                let sharp_factor = 1.0_f32 + sharpness * 0.2_f32;
                r = (r - luma2) * sharp_factor + luma2;
                g = (g - luma2) * sharp_factor + luma2;
                b = (b - luma2) * sharp_factor + luma2;
            }

            if vignette_strength.abs() > 0.001 {
                let x_norm = (x as f32 * inv_w - 0.5) * 2.0;
                let dist = ((x_norm * x_norm + y_norm * y_norm).sqrt() * 0.7071_f32).min(1.0_f32);
                let factor = 1.0_f32 - vignette_strength * dist * dist;
                r *= factor;
                g *= factor;
                b *= factor;
            }

            data[idx] = clamp01(r);
            data[idx + 1] = clamp01(g);
            data[idx + 2] = clamp01(b);
        }
    }

    *image = DynamicImage::ImageRgb32F(buffer);
}
