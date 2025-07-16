use wasm_bindgen::prelude::*;
use web_sys::console;
use serde::{Deserialize, Serialize};

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

#[derive(Serialize, Deserialize)]
pub struct RawMetadata {
    pub camera_make: String,
    pub camera_model: String,
    pub lens_model: Option<String>,
    pub iso: u32,
    pub aperture: f32,
    pub shutter_speed: String,
    pub focal_length: Option<f32>,
    pub white_balance: u32,
    pub color_space: String,
    pub width: u32,
    pub height: u32,
    pub orientation: u32,
    pub timestamp: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct RawProcessingSettings {
    pub white_balance: Option<(f32, f32)>, // (temperature, tint)
    pub exposure_compensation: f32,
    pub highlight_recovery: f32,
    pub shadow_recovery: f32,
    pub color_matrix: Option<Vec<f32>>, // 3x3 matrix
    pub gamma: f32,
    pub output_color_space: String,
}

#[wasm_bindgen]
pub struct RawProcessor {
    current_metadata: Option<RawMetadata>,
}

#[wasm_bindgen]
impl RawProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> RawProcessor {
        log!("RawProcessor initialized");
        RawProcessor {
            current_metadata: None,
        }
    }

    #[wasm_bindgen]
    pub fn decode_raw(&mut self, raw_data: &[u8], format: &str) -> Result<Vec<u8>, JsValue> {
        if raw_data.is_empty() {
            return Err(JsValue::from_str("Empty RAW data"));
        }

        log!("Decoding RAW file, format: {}, size: {} bytes", format, raw_data.len());

        // For now, we'll create a mock implementation since rawler integration
        // would require more complex setup. In a real implementation, this would
        // use rawler to decode the actual RAW file.
        
        match format.to_uppercase().as_str() {
            "CR2" | "CR3" => self.decode_canon_raw(raw_data),
            "NEF" | "NRW" => self.decode_nikon_raw(raw_data),
            "ARW" | "SRF" | "SR2" => self.decode_sony_raw(raw_data),
            "RAF" => self.decode_fuji_raw(raw_data),
            "ORF" => self.decode_olympus_raw(raw_data),
            "RW2" => self.decode_panasonic_raw(raw_data),
            "DNG" => self.decode_dng_raw(raw_data),
            _ => Err(JsValue::from_str(&format!("Unsupported RAW format: {}", format))),
        }
    }

    #[wasm_bindgen]
    pub fn get_metadata(&self, raw_data: &[u8]) -> Result<JsValue, JsValue> {
        if raw_data.is_empty() {
            return Err(JsValue::from_str("Empty RAW data"));
        }

        // Mock metadata extraction - in real implementation would parse EXIF/TIFF data
        let metadata = self.extract_mock_metadata(raw_data);
        serde_wasm_bindgen::to_value(&metadata).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn process_raw(&self, raw_data: &[u8], settings_js: &JsValue) -> Result<Vec<u8>, JsValue> {
        let settings: RawProcessingSettings = serde_wasm_bindgen::from_value(settings_js.clone())?;
        
        if raw_data.is_empty() {
            return Err(JsValue::from_str("Empty RAW data"));
        }

        log!("Processing RAW with settings: exposure={}, gamma={}", 
             settings.exposure_compensation, settings.gamma);

        // Mock RAW processing pipeline
        self.apply_raw_processing(raw_data, &settings)
    }

    #[wasm_bindgen]
    pub fn get_supported_formats(&self) -> Vec<String> {
        vec![
            "CR2".to_string(), "CR3".to_string(), // Canon
            "NEF".to_string(), "NRW".to_string(), // Nikon
            "ARW".to_string(), "SRF".to_string(), "SR2".to_string(), // Sony
            "RAF".to_string(), // Fuji
            "ORF".to_string(), // Olympus
            "RW2".to_string(), // Panasonic
            "DNG".to_string(), // Adobe DNG
        ]
    }

    #[wasm_bindgen]
    pub fn validate_raw_file(&self, raw_data: &[u8]) -> bool {
        if raw_data.len() < 16 {
            return false;
        }

        // Check for common RAW file signatures
        let header = &raw_data[0..16];
        
        // Canon CR2/CR3 signatures
        if header.starts_with(b"II*\0") || header.starts_with(b"MM\0*") {
            return true;
        }
        
        // Check for other format signatures
        if header.starts_with(b"FUJIFILMCCD-RAW") {
            return true; // Fuji RAF
        }
        
        // DNG signature
        if raw_data.len() > 8 && &raw_data[4..8] == b"ftypcrx" {
            return true; // Canon CR3
        }

        // More signature checks would go here for other formats
        false
    }
}

impl RawProcessor {
    fn decode_canon_raw(&mut self, raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding Canon RAW file");
        
        // Mock Canon RAW decoding
        // In real implementation, this would use rawler to decode CR2/CR3 files
        let width = 1920u32;
        let height = 1080u32;
        let channels = 4u32; // RGBA
        
        let mut decoded_data = vec![0u8; (width * height * channels) as usize];
        
        // Generate mock image data based on RAW data
        for (i, chunk) in decoded_data.chunks_mut(4).enumerate() {
            let seed = (raw_data[i % raw_data.len()] as u32 + i as u32) % 256;
            chunk[0] = ((seed * 123) % 256) as u8; // R
            chunk[1] = ((seed * 456) % 256) as u8; // G
            chunk[2] = ((seed * 789) % 256) as u8; // B
            chunk[3] = 255; // A
        }
        
        // Store mock metadata
        self.current_metadata = Some(RawMetadata {
            camera_make: "Canon".to_string(),
            camera_model: "EOS R5".to_string(),
            lens_model: Some("RF 24-70mm f/2.8L IS USM".to_string()),
            iso: 800,
            aperture: 2.8,
            shutter_speed: "1/125".to_string(),
            focal_length: Some(50.0),
            white_balance: 5600,
            color_space: "sRGB".to_string(),
            width,
            height,
            orientation: 1,
            timestamp: Some("2024-01-15T10:30:00Z".to_string()),
        });
        
        Ok(decoded_data)
    }

    fn decode_nikon_raw(&mut self, raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding Nikon RAW file");
        
        let width = 1920u32;
        let height = 1080u32;
        let channels = 4u32;
        
        let mut decoded_data = vec![0u8; (width * height * channels) as usize];
        
        for (i, chunk) in decoded_data.chunks_mut(4).enumerate() {
            let seed = (raw_data[i % raw_data.len()] as u32 + i as u32) % 256;
            chunk[0] = ((seed * 234) % 256) as u8;
            chunk[1] = ((seed * 567) % 256) as u8;
            chunk[2] = ((seed * 890) % 256) as u8;
            chunk[3] = 255;
        }
        
        self.current_metadata = Some(RawMetadata {
            camera_make: "Nikon".to_string(),
            camera_model: "D850".to_string(),
            lens_model: Some("AF-S NIKKOR 24-70mm f/2.8E ED VR".to_string()),
            iso: 400,
            aperture: 4.0,
            shutter_speed: "1/60".to_string(),
            focal_length: Some(35.0),
            white_balance: 5200,
            color_space: "Adobe RGB".to_string(),
            width,
            height,
            orientation: 1,
            timestamp: Some("2024-01-15T14:20:00Z".to_string()),
        });
        
        Ok(decoded_data)
    }

    fn decode_sony_raw(&mut self, raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding Sony RAW file");
        
        let width = 1920u32;
        let height = 1080u32;
        let channels = 4u32;
        
        let mut decoded_data = vec![0u8; (width * height * channels) as usize];
        
        for (i, chunk) in decoded_data.chunks_mut(4).enumerate() {
            let seed = (raw_data[i % raw_data.len()] as u32 + i as u32) % 256;
            chunk[0] = ((seed * 345) % 256) as u8;
            chunk[1] = ((seed * 678) % 256) as u8;
            chunk[2] = ((seed * 901) % 256) as u8;
            chunk[3] = 255;
        }
        
        self.current_metadata = Some(RawMetadata {
            camera_make: "Sony".to_string(),
            camera_model: "α7R IV".to_string(),
            lens_model: Some("FE 24-70mm F2.8 GM".to_string()),
            iso: 1600,
            aperture: 2.8,
            shutter_speed: "1/250".to_string(),
            focal_length: Some(70.0),
            white_balance: 6500,
            color_space: "sRGB".to_string(),
            width,
            height,
            orientation: 1,
            timestamp: Some("2024-01-15T16:45:00Z".to_string()),
        });
        
        Ok(decoded_data)
    }

    fn decode_fuji_raw(&mut self, _raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding Fuji RAW file");
        Err(JsValue::from_str("Fuji RAW decoding not yet implemented"))
    }

    fn decode_olympus_raw(&mut self, _raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding Olympus RAW file");
        Err(JsValue::from_str("Olympus RAW decoding not yet implemented"))
    }

    fn decode_panasonic_raw(&mut self, _raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding Panasonic RAW file");
        Err(JsValue::from_str("Panasonic RAW decoding not yet implemented"))
    }

    fn decode_dng_raw(&mut self, raw_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        log!("Decoding DNG RAW file");
        
        // DNG is a standardized format, so this would be more straightforward
        let width = 1920u32;
        let height = 1080u32;
        let channels = 4u32;
        
        let mut decoded_data = vec![0u8; (width * height * channels) as usize];
        
        for (i, chunk) in decoded_data.chunks_mut(4).enumerate() {
            let seed = (raw_data[i % raw_data.len()] as u32 + i as u32) % 256;
            chunk[0] = ((seed * 111) % 256) as u8;
            chunk[1] = ((seed * 222) % 256) as u8;
            chunk[2] = ((seed * 333) % 256) as u8;
            chunk[3] = 255;
        }
        
        self.current_metadata = Some(RawMetadata {
            camera_make: "Adobe".to_string(),
            camera_model: "DNG Converter".to_string(),
            lens_model: None,
            iso: 100,
            aperture: 5.6,
            shutter_speed: "1/30".to_string(),
            focal_length: None,
            white_balance: 5500,
            color_space: "ProPhoto RGB".to_string(),
            width,
            height,
            orientation: 1,
            timestamp: Some("2024-01-15T12:00:00Z".to_string()),
        });
        
        Ok(decoded_data)
    }

    fn extract_mock_metadata(&self, raw_data: &[u8]) -> RawMetadata {
        // In a real implementation, this would parse EXIF/TIFF data from the RAW file
        let seed = raw_data[0] as u32;
        
        RawMetadata {
            camera_make: "Unknown".to_string(),
            camera_model: "Unknown".to_string(),
            lens_model: None,
            iso: 100 + (seed % 6400),
            aperture: 1.4 + (seed as f32 % 10.0),
            shutter_speed: "1/60".to_string(),
            focal_length: Some(24.0 + (seed as f32 % 200.0)),
            white_balance: 5000 + (seed % 2000),
            color_space: "sRGB".to_string(),
            width: 1920,
            height: 1080,
            orientation: 1,
            timestamp: Some("2024-01-15T12:00:00Z".to_string()),
        }
    }

    fn apply_raw_processing(&self, raw_data: &[u8], settings: &RawProcessingSettings) -> Result<Vec<u8>, JsValue> {
        // Mock RAW processing pipeline
        let width = 1920u32;
        let height = 1080u32;
        let channels = 4u32;
        
        let mut processed_data = vec![0u8; (width * height * channels) as usize];
        
        // Apply basic processing based on settings
        for (i, chunk) in processed_data.chunks_mut(4).enumerate() {
            let seed = (raw_data[i % raw_data.len()] as u32 + i as u32) % 256;
            
            // Apply exposure compensation
            let exposure_factor = 2.0_f32.powf(settings.exposure_compensation);
            
            // Apply gamma correction
            let gamma_correction = |x: f32| x.powf(1.0 / settings.gamma);
            
            let mut r = (seed * 123) % 256;
            let mut g = (seed * 456) % 256;
            let mut b = (seed * 789) % 256;
            
            // Apply exposure
            r = ((r as f32 * exposure_factor).min(255.0)) as u32;
            g = ((g as f32 * exposure_factor).min(255.0)) as u32;
            b = ((b as f32 * exposure_factor).min(255.0)) as u32;
            
            // Apply gamma
            chunk[0] = (gamma_correction(r as f32 / 255.0) * 255.0) as u8;
            chunk[1] = (gamma_correction(g as f32 / 255.0) * 255.0) as u8;
            chunk[2] = (gamma_correction(b as f32 / 255.0) * 255.0) as u8;
            chunk[3] = 255;
        }
        
        Ok(processed_data)
    }
}