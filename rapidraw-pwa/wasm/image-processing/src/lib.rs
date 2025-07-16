use wasm_bindgen::prelude::*;
use web_sys::console;
use serde::{Deserialize, Serialize};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Set up panic hook for better error messages
#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Logging macro for debugging
macro_rules! log {
    ( $( $t:tt )* ) => {
        console::log_1(&format!( $( $t )* ).into());
    }
}

#[derive(Serialize, Deserialize)]
pub struct ImageAdjustments {
    pub exposure: f32,
    pub contrast: f32,
    pub highlights: f32,
    pub shadows: f32,
    pub whites: f32,
    pub blacks: f32,
    pub temperature: f32,
    pub tint: f32,
    pub saturation: f32,
    pub vibrance: f32,
}

#[derive(Serialize, Deserialize)]
pub struct HistogramData {
    pub red: Vec<u32>,
    pub green: Vec<u32>,
    pub blue: Vec<u32>,
    pub luminance: Vec<u32>,
}

#[derive(Serialize, Deserialize)]
pub struct ImageMetadata {
    pub width: u32,
    pub height: u32,
    pub channels: u32,
    pub bit_depth: u32,
}

#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    channels: u32,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ImageProcessor {
        log!("ImageProcessor initialized");
        ImageProcessor {
            width: 0,
            height: 0,
            channels: 4, // RGBA
        }
    }

    #[wasm_bindgen]
    pub fn set_image_info(&mut self, width: u32, height: u32, channels: u32) {
        self.width = width;
        self.height = height;
        self.channels = channels;
        log!("Image info set: {}x{}, {} channels", width, height, channels);
    }

    #[wasm_bindgen]
    pub fn process_image(&self, image_data: &[u8], adjustments_js: &JsValue) -> Result<Vec<u8>, JsValue> {
        let adjustments: ImageAdjustments = serde_wasm_bindgen::from_value(adjustments_js.clone())?;
        
        if image_data.is_empty() {
            return Err(JsValue::from_str("Empty image data"));
        }

        if self.width == 0 || self.height == 0 {
            return Err(JsValue::from_str("Invalid image dimensions"));
        }

        let expected_size = (self.width * self.height * self.channels) as usize;
        if image_data.len() != expected_size {
            return Err(JsValue::from_str(&format!(
                "Image data size mismatch. Expected: {}, Got: {}", 
                expected_size, 
                image_data.len()
            )));
        }

        log!("Processing image with adjustments: exposure={}, contrast={}", 
             adjustments.exposure, adjustments.contrast);

        let mut processed_data = image_data.to_vec();
        
        // Apply basic adjustments
        self.apply_exposure(&mut processed_data, adjustments.exposure);
        self.apply_contrast(&mut processed_data, adjustments.contrast);
        self.apply_highlights_shadows(&mut processed_data, adjustments.highlights, adjustments.shadows);
        self.apply_whites_blacks(&mut processed_data, adjustments.whites, adjustments.blacks);
        self.apply_temperature_tint(&mut processed_data, adjustments.temperature, adjustments.tint);
        self.apply_saturation_vibrance(&mut processed_data, adjustments.saturation, adjustments.vibrance);

        Ok(processed_data)
    }

    #[wasm_bindgen]
    pub fn generate_histogram(&self, image_data: &[u8]) -> Result<JsValue, JsValue> {
        if image_data.is_empty() {
            return Err(JsValue::from_str("Empty image data"));
        }

        let mut red_hist = vec![0u32; 256];
        let mut green_hist = vec![0u32; 256];
        let mut blue_hist = vec![0u32; 256];
        let mut lum_hist = vec![0u32; 256];

        // Process pixels in chunks of 4 (RGBA)
        for chunk in image_data.chunks_exact(4) {
            let r = chunk[0] as usize;
            let g = chunk[1] as usize;
            let b = chunk[2] as usize;
            
            red_hist[r] += 1;
            green_hist[g] += 1;
            blue_hist[b] += 1;
            
            // Calculate luminance using standard weights
            let luminance = ((0.299 * r as f32) + (0.587 * g as f32) + (0.114 * b as f32)) as usize;
            lum_hist[luminance.min(255)] += 1;
        }

        let histogram = HistogramData {
            red: red_hist,
            green: green_hist,
            blue: blue_hist,
            luminance: lum_hist,
        };

        serde_wasm_bindgen::to_value(&histogram).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn get_image_metadata(&self) -> Result<JsValue, JsValue> {
        let metadata = ImageMetadata {
            width: self.width,
            height: self.height,
            channels: self.channels,
            bit_depth: 8, // Assuming 8-bit per channel
        };

        serde_wasm_bindgen::to_value(&metadata).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

impl ImageProcessor {
    fn apply_exposure(&self, data: &mut [u8], exposure: f32) {
        let factor = 2.0_f32.powf(exposure);
        
        for chunk in data.chunks_exact_mut(4) {
            chunk[0] = ((chunk[0] as f32 * factor).min(255.0)) as u8;
            chunk[1] = ((chunk[1] as f32 * factor).min(255.0)) as u8;
            chunk[2] = ((chunk[2] as f32 * factor).min(255.0)) as u8;
            // Alpha channel unchanged
        }
    }

    fn apply_contrast(&self, data: &mut [u8], contrast: f32) {
        let factor = (259.0 * (contrast * 255.0 + 255.0)) / (255.0 * (259.0 - contrast * 255.0));
        
        for chunk in data.chunks_exact_mut(4) {
            chunk[0] = ((factor * (chunk[0] as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
            chunk[1] = ((factor * (chunk[1] as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
            chunk[2] = ((factor * (chunk[2] as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
        }
    }

    fn apply_highlights_shadows(&self, data: &mut [u8], highlights: f32, shadows: f32) {
        for chunk in data.chunks_exact_mut(4) {
            let r = chunk[0] as f32 / 255.0;
            let g = chunk[1] as f32 / 255.0;
            let b = chunk[2] as f32 / 255.0;
            
            // Calculate luminance
            let lum = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply highlights/shadows based on luminance
            let highlight_factor = if lum > 0.5 { 1.0 + highlights * (lum - 0.5) * 2.0 } else { 1.0 };
            let shadow_factor = if lum < 0.5 { 1.0 + shadows * (0.5 - lum) * 2.0 } else { 1.0 };
            
            chunk[0] = ((r * highlight_factor * shadow_factor * 255.0).clamp(0.0, 255.0)) as u8;
            chunk[1] = ((g * highlight_factor * shadow_factor * 255.0).clamp(0.0, 255.0)) as u8;
            chunk[2] = ((b * highlight_factor * shadow_factor * 255.0).clamp(0.0, 255.0)) as u8;
        }
    }

    fn apply_whites_blacks(&self, data: &mut [u8], whites: f32, blacks: f32) {
        for chunk in data.chunks_exact_mut(4) {
            let r = chunk[0] as f32 / 255.0;
            let g = chunk[1] as f32 / 255.0;
            let b = chunk[2] as f32 / 255.0;
            
            // Apply whites adjustment (affects bright areas)
            let white_factor = 1.0 + whites * r;
            // Apply blacks adjustment (affects dark areas)
            let black_factor = 1.0 + blacks * (1.0 - r);
            
            chunk[0] = ((r * white_factor * black_factor * 255.0).clamp(0.0, 255.0)) as u8;
            chunk[1] = ((g * white_factor * black_factor * 255.0).clamp(0.0, 255.0)) as u8;
            chunk[2] = ((b * white_factor * black_factor * 255.0).clamp(0.0, 255.0)) as u8;
        }
    }

    fn apply_temperature_tint(&self, data: &mut [u8], temperature: f32, tint: f32) {
        // Temperature adjustment (blue-orange axis)
        let temp_factor = temperature / 100.0;
        let red_temp = if temp_factor > 0.0 { 1.0 + temp_factor * 0.3 } else { 1.0 };
        let blue_temp = if temp_factor < 0.0 { 1.0 - temp_factor * 0.3 } else { 1.0 };
        
        // Tint adjustment (green-magenta axis)
        let tint_factor = tint / 100.0;
        let green_tint = if tint_factor > 0.0 { 1.0 + tint_factor * 0.2 } else { 1.0 };
        let magenta_tint = if tint_factor < 0.0 { 1.0 - tint_factor * 0.2 } else { 1.0 };
        
        for chunk in data.chunks_exact_mut(4) {
            chunk[0] = ((chunk[0] as f32 * red_temp * magenta_tint).clamp(0.0, 255.0)) as u8;
            chunk[1] = ((chunk[1] as f32 * green_tint).clamp(0.0, 255.0)) as u8;
            chunk[2] = ((chunk[2] as f32 * blue_temp * magenta_tint).clamp(0.0, 255.0)) as u8;
        }
    }

    fn apply_saturation_vibrance(&self, data: &mut [u8], saturation: f32, vibrance: f32) {
        for chunk in data.chunks_exact_mut(4) {
            let r = chunk[0] as f32 / 255.0;
            let g = chunk[1] as f32 / 255.0;
            let b = chunk[2] as f32 / 255.0;
            
            // Calculate luminance
            let lum = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Apply saturation
            let sat_factor = 1.0 + saturation;
            let r_sat = lum + (r - lum) * sat_factor;
            let g_sat = lum + (g - lum) * sat_factor;
            let b_sat = lum + (b - lum) * sat_factor;
            
            // Apply vibrance (affects less saturated colors more)
            let current_sat = (r_sat - lum).abs().max((g_sat - lum).abs()).max((b_sat - lum).abs());
            let vib_factor = 1.0 + vibrance * (1.0 - current_sat);
            
            chunk[0] = ((lum + (r_sat - lum) * vib_factor).clamp(0.0, 1.0) * 255.0) as u8;
            chunk[1] = ((lum + (g_sat - lum) * vib_factor).clamp(0.0, 1.0) * 255.0) as u8;
            chunk[2] = ((lum + (b_sat - lum) * vib_factor).clamp(0.0, 1.0) * 255.0) as u8;
        }
    }
}