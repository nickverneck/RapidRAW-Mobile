use wasm_bindgen::prelude::*;
use web_sys::console;
use serde::{Deserialize, Serialize};
use nalgebra::{Matrix3, Vector3};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

macro_rules! log {
    ( $( $t:tt )* ) => {
        console::log_1(&format!( $( $t )* ).into());
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct HSLColor {
    pub hue: f32,        // -180 to +180
    pub saturation: f32, // -100 to +100
    pub lightness: f32,  // -100 to +100
}

#[derive(Serialize, Deserialize)]
pub struct HSLAdjustments {
    pub reds: HSLColor,
    pub oranges: HSLColor,
    pub yellows: HSLColor,
    pub greens: HSLColor,
    pub cyans: HSLColor,
    pub blues: HSLColor,
    pub purples: HSLColor,
    pub magentas: HSLColor,
}

#[derive(Serialize, Deserialize)]
pub struct ColorWheelPoint {
    pub x: f32, // -1 to +1
    pub y: f32, // -1 to +1
    pub intensity: f32, // 0 to 1
}

#[derive(Serialize, Deserialize)]
pub struct ColorWheelAdjustments {
    pub shadows: ColorWheelPoint,
    pub midtones: ColorWheelPoint,
    pub highlights: ColorWheelPoint,
}

#[derive(Serialize, Deserialize)]
pub struct ColorGradingSettings {
    pub hsl: HSLAdjustments,
    pub color_wheels: ColorWheelAdjustments,
    pub global_saturation: f32,
    pub global_vibrance: f32,
}

#[derive(Serialize, Deserialize)]
pub struct LUTSettings {
    pub resolution: u32, // 17, 33, or 65
    pub format: String,  // "cube", "3dl", "csp"
    pub name: String,
    pub description: Option<String>,
}

#[wasm_bindgen]
pub struct ColorGrader {
    current_settings: Option<ColorGradingSettings>,
}

#[wasm_bindgen]
impl ColorGrader {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ColorGrader {
        log!("ColorGrader initialized");
        ColorGrader {
            current_settings: None,
        }
    }

    #[wasm_bindgen]
    pub fn apply_hsl_adjustments(&mut self, image_data: &[u8], hsl_js: &JsValue) -> Result<Vec<u8>, JsValue> {
        let hsl_adjustments: HSLAdjustments = serde_wasm_bindgen::from_value(hsl_js.clone())?;
        
        if image_data.is_empty() {
            return Err(JsValue::from_str("Empty image data"));
        }

        if image_data.len() % 4 != 0 {
            return Err(JsValue::from_str("Invalid image data length (must be RGBA)"));
        }

        log!("Applying HSL adjustments to {} pixels", image_data.len() / 4);

        let mut processed_data = image_data.to_vec();
        
        for chunk in processed_data.chunks_mut(4) {
            let r = chunk[0] as f32 / 255.0;
            let g = chunk[1] as f32 / 255.0;
            let b = chunk[2] as f32 / 255.0;
            
            // Convert RGB to HSL
            let (h, s, l) = rgb_to_hsl(r, g, b);
            
            // Determine which color range this pixel belongs to
            let color_range = get_color_range(h);
            let adjustment = get_hsl_adjustment(&hsl_adjustments, color_range);
            
            // Apply HSL adjustments
            let new_h = (h + adjustment.hue).rem_euclid(360.0);
            let new_s = (s + adjustment.saturation / 100.0).clamp(0.0, 1.0);
            let new_l = (l + adjustment.lightness / 100.0).clamp(0.0, 1.0);
            
            // Convert back to RGB
            let (new_r, new_g, new_b) = hsl_to_rgb(new_h, new_s, new_l);
            
            chunk[0] = (new_r * 255.0).round() as u8;
            chunk[1] = (new_g * 255.0).round() as u8;
            chunk[2] = (new_b * 255.0).round() as u8;
            // Alpha channel unchanged
        }

        Ok(processed_data)
    }

    #[wasm_bindgen]
    pub fn apply_color_wheels(&self, image_data: &[u8], wheels_js: &JsValue) -> Result<Vec<u8>, JsValue> {
        let color_wheels: ColorWheelAdjustments = serde_wasm_bindgen::from_value(wheels_js.clone())?;
        
        if image_data.is_empty() {
            return Err(JsValue::from_str("Empty image data"));
        }

        log!("Applying color wheel adjustments");

        let mut processed_data = image_data.to_vec();
        
        for chunk in processed_data.chunks_mut(4) {
            let r = chunk[0] as f32 / 255.0;
            let g = chunk[1] as f32 / 255.0;
            let b = chunk[2] as f32 / 255.0;
            
            // Calculate luminance to determine shadows/midtones/highlights
            let luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Calculate weights for each tonal range
            let shadow_weight = calculate_shadow_weight(luminance);
            let midtone_weight = calculate_midtone_weight(luminance);
            let highlight_weight = calculate_highlight_weight(luminance);
            
            // Apply color wheel adjustments
            let (mut new_r, mut new_g, mut new_b) = (r, g, b);
            
            // Shadows
            if shadow_weight > 0.0 {
                let (sr, sg, sb) = apply_color_wheel_point(r, g, b, &color_wheels.shadows);
                new_r = mix(new_r, sr, shadow_weight);
                new_g = mix(new_g, sg, shadow_weight);
                new_b = mix(new_b, sb, shadow_weight);
            }
            
            // Midtones
            if midtone_weight > 0.0 {
                let (mr, mg, mb) = apply_color_wheel_point(r, g, b, &color_wheels.midtones);
                new_r = mix(new_r, mr, midtone_weight);
                new_g = mix(new_g, mg, midtone_weight);
                new_b = mix(new_b, mb, midtone_weight);
            }
            
            // Highlights
            if highlight_weight > 0.0 {
                let (hr, hg, hb) = apply_color_wheel_point(r, g, b, &color_wheels.highlights);
                new_r = mix(new_r, hr, highlight_weight);
                new_g = mix(new_g, hg, highlight_weight);
                new_b = mix(new_b, hb, highlight_weight);
            }
            
            chunk[0] = (new_r.clamp(0.0, 1.0) * 255.0).round() as u8;
            chunk[1] = (new_g.clamp(0.0, 1.0) * 255.0).round() as u8;
            chunk[2] = (new_b.clamp(0.0, 1.0) * 255.0).round() as u8;
        }

        Ok(processed_data)
    }

    #[wasm_bindgen]
    pub fn generate_lut(&self, settings_js: &JsValue, resolution: u32) -> Result<Vec<f32>, JsValue> {
        let settings: ColorGradingSettings = serde_wasm_bindgen::from_value(settings_js.clone())?;
        
        if ![17, 33, 65].contains(&resolution) {
            return Err(JsValue::from_str("Invalid LUT resolution. Must be 17, 33, or 65"));
        }

        log!("Generating {}x{}x{} LUT", resolution, resolution, resolution);

        let mut lut_data = Vec::with_capacity((resolution * resolution * resolution * 3) as usize);
        
        for b in 0..resolution {
            for g in 0..resolution {
                for r in 0..resolution {
                    // Normalize coordinates to 0-1 range
                    let r_norm = r as f32 / (resolution - 1) as f32;
                    let g_norm = g as f32 / (resolution - 1) as f32;
                    let b_norm = b as f32 / (resolution - 1) as f32;
                    
                    // Apply color grading to this RGB value
                    let (processed_r, processed_g, processed_b) = 
                        self.apply_color_grading_to_rgb(r_norm, g_norm, b_norm, &settings);
                    
                    lut_data.push(processed_r);
                    lut_data.push(processed_g);
                    lut_data.push(processed_b);
                }
            }
        }

        Ok(lut_data)
    }

    #[wasm_bindgen]
    pub fn export_cube_lut(&self, lut_data: &[f32], resolution: u32, name: &str) -> Result<String, JsValue> {
        if lut_data.len() != (resolution * resolution * resolution * 3) as usize {
            return Err(JsValue::from_str("Invalid LUT data size"));
        }

        log!("Exporting CUBE LUT: {}", name);

        let mut cube_content = String::new();
        
        // CUBE LUT header
        cube_content.push_str(&format!("TITLE \"{}\"\n", name));
        cube_content.push_str(&format!("LUT_3D_SIZE {}\n", resolution));
        cube_content.push_str("DOMAIN_MIN 0.0 0.0 0.0\n");
        cube_content.push_str("DOMAIN_MAX 1.0 1.0 1.0\n");
        cube_content.push_str("\n");
        
        // LUT data
        for chunk in lut_data.chunks(3) {
            cube_content.push_str(&format!("{:.6} {:.6} {:.6}\n", chunk[0], chunk[1], chunk[2]));
        }

        Ok(cube_content)
    }

    #[wasm_bindgen]
    pub fn get_supported_lut_formats(&self) -> Vec<String> {
        vec![
            "cube".to_string(),
            "3dl".to_string(),
            "csp".to_string(),
        ]
    }

    #[wasm_bindgen]
    pub fn validate_color_grading_settings(&self, settings_js: &JsValue) -> Result<bool, JsValue> {
        let settings: ColorGradingSettings = serde_wasm_bindgen::from_value(settings_js.clone())?;
        
        // Validate HSL ranges
        let hsl_colors = [
            &settings.hsl.reds, &settings.hsl.oranges, &settings.hsl.yellows, &settings.hsl.greens,
            &settings.hsl.cyans, &settings.hsl.blues, &settings.hsl.purples, &settings.hsl.magentas
        ];
        
        for color in hsl_colors {
            if color.hue < -180.0 || color.hue > 180.0 {
                return Ok(false);
            }
            if color.saturation < -100.0 || color.saturation > 100.0 {
                return Ok(false);
            }
            if color.lightness < -100.0 || color.lightness > 100.0 {
                return Ok(false);
            }
        }
        
        // Validate color wheel ranges
        let wheel_points = [
            &settings.color_wheels.shadows,
            &settings.color_wheels.midtones,
            &settings.color_wheels.highlights
        ];
        
        for point in wheel_points {
            if point.x < -1.0 || point.x > 1.0 {
                return Ok(false);
            }
            if point.y < -1.0 || point.y > 1.0 {
                return Ok(false);
            }
            if point.intensity < 0.0 || point.intensity > 1.0 {
                return Ok(false);
            }
        }

        Ok(true)
    }
}

impl ColorGrader {
    fn apply_color_grading_to_rgb(&self, r: f32, g: f32, b: f32, settings: &ColorGradingSettings) -> (f32, f32, f32) {
        // Convert to HSL for HSL adjustments
        let (h, s, l) = rgb_to_hsl(r, g, b);
        
        // Apply HSL adjustments
        let color_range = get_color_range(h);
        let adjustment = get_hsl_adjustment(&settings.hsl, color_range);
        
        let new_h = (h + adjustment.hue).rem_euclid(360.0);
        let new_s = (s + adjustment.saturation / 100.0).clamp(0.0, 1.0);
        let new_l = (l + adjustment.lightness / 100.0).clamp(0.0, 1.0);
        
        // Convert back to RGB
        let (mut new_r, mut new_g, mut new_b) = hsl_to_rgb(new_h, new_s, new_l);
        
        // Apply color wheel adjustments
        let luminance = 0.299 * new_r + 0.587 * new_g + 0.114 * new_b;
        
        let shadow_weight = calculate_shadow_weight(luminance);
        let midtone_weight = calculate_midtone_weight(luminance);
        let highlight_weight = calculate_highlight_weight(luminance);
        
        if shadow_weight > 0.0 {
            let (sr, sg, sb) = apply_color_wheel_point(new_r, new_g, new_b, &settings.color_wheels.shadows);
            new_r = mix(new_r, sr, shadow_weight);
            new_g = mix(new_g, sg, shadow_weight);
            new_b = mix(new_b, sb, shadow_weight);
        }
        
        if midtone_weight > 0.0 {
            let (mr, mg, mb) = apply_color_wheel_point(new_r, new_g, new_b, &settings.color_wheels.midtones);
            new_r = mix(new_r, mr, midtone_weight);
            new_g = mix(new_g, mg, midtone_weight);
            new_b = mix(new_b, mb, midtone_weight);
        }
        
        if highlight_weight > 0.0 {
            let (hr, hg, hb) = apply_color_wheel_point(new_r, new_g, new_b, &settings.color_wheels.highlights);
            new_r = mix(new_r, hr, highlight_weight);
            new_g = mix(new_g, hg, highlight_weight);
            new_b = mix(new_b, hb, highlight_weight);
        }
        
        (new_r.clamp(0.0, 1.0), new_g.clamp(0.0, 1.0), new_b.clamp(0.0, 1.0))
    }
}

// Color space conversion functions
fn rgb_to_hsl(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let max = r.max(g.max(b));
    let min = r.min(g.min(b));
    let delta = max - min;
    
    // Lightness
    let l = (max + min) / 2.0;
    
    if delta == 0.0 {
        return (0.0, 0.0, l); // Achromatic
    }
    
    // Saturation
    let s = if l > 0.5 {
        delta / (2.0 - max - min)
    } else {
        delta / (max + min)
    };
    
    // Hue
    let h = if max == r {
        ((g - b) / delta + if g < b { 6.0 } else { 0.0 }) * 60.0
    } else if max == g {
        ((b - r) / delta + 2.0) * 60.0
    } else {
        ((r - g) / delta + 4.0) * 60.0
    };
    
    (h, s, l)
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
    if s == 0.0 {
        return (l, l, l); // Achromatic
    }
    
    let hue_to_rgb = |p: f32, q: f32, mut t: f32| -> f32 {
        if t < 0.0 { t += 1.0; }
        if t > 1.0 { t -= 1.0; }
        if t < 1.0/6.0 { return p + (q - p) * 6.0 * t; }
        if t < 1.0/2.0 { return q; }
        if t < 2.0/3.0 { return p + (q - p) * (2.0/3.0 - t) * 6.0; }
        p
    };
    
    let q = if l < 0.5 {
        l * (1.0 + s)
    } else {
        l + s - l * s
    };
    
    let p = 2.0 * l - q;
    let h_norm = h / 360.0;
    
    let r = hue_to_rgb(p, q, h_norm + 1.0/3.0);
    let g = hue_to_rgb(p, q, h_norm);
    let b = hue_to_rgb(p, q, h_norm - 1.0/3.0);
    
    (r, g, b)
}

fn get_color_range(hue: f32) -> usize {
    let h = hue.rem_euclid(360.0);
    match h {
        h if h >= 345.0 || h < 15.0 => 0,  // Reds
        h if h >= 15.0 && h < 45.0 => 1,   // Oranges
        h if h >= 45.0 && h < 75.0 => 2,   // Yellows
        h if h >= 75.0 && h < 165.0 => 3,  // Greens
        h if h >= 165.0 && h < 195.0 => 4, // Cyans
        h if h >= 195.0 && h < 255.0 => 5, // Blues
        h if h >= 255.0 && h < 285.0 => 6, // Purples
        _ => 7, // Magentas
    }
}

fn get_hsl_adjustment(adjustments: &HSLAdjustments, color_range: usize) -> &HSLColor {
    match color_range {
        0 => &adjustments.reds,
        1 => &adjustments.oranges,
        2 => &adjustments.yellows,
        3 => &adjustments.greens,
        4 => &adjustments.cyans,
        5 => &adjustments.blues,
        6 => &adjustments.purples,
        _ => &adjustments.magentas,
    }
}

fn calculate_shadow_weight(luminance: f32) -> f32 {
    if luminance < 0.33 {
        1.0 - (luminance / 0.33)
    } else {
        0.0
    }
}

fn calculate_midtone_weight(luminance: f32) -> f32 {
    if luminance >= 0.33 && luminance <= 0.67 {
        1.0 - ((luminance - 0.5).abs() / 0.17)
    } else {
        0.0
    }
}

fn calculate_highlight_weight(luminance: f32) -> f32 {
    if luminance > 0.67 {
        (luminance - 0.67) / 0.33
    } else {
        0.0
    }
}

fn apply_color_wheel_point(r: f32, g: f32, b: f32, point: &ColorWheelPoint) -> (f32, f32, f32) {
    // Convert wheel coordinates to color shift
    let shift_r = point.x * point.intensity * 0.1;
    let shift_g = point.y * point.intensity * 0.1;
    let shift_b = -point.x * point.intensity * 0.1; // Opposite of red for color balance
    
    (
        (r + shift_r).clamp(0.0, 1.0),
        (g + shift_g).clamp(0.0, 1.0),
        (b + shift_b).clamp(0.0, 1.0)
    )
}

fn mix(a: f32, b: f32, t: f32) -> f32 {
    a * (1.0 - t) + b * t
}