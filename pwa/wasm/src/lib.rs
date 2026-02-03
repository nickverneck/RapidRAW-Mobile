use wasm_bindgen::prelude::*;

mod core;

#[wasm_bindgen]
pub fn version() -> String {
	"rapidraw-wasm 0.1.0".to_string()
}

#[wasm_bindgen]
pub fn load_image(data: &[u8]) -> usize {
	// Placeholder: replace with real decoding once core logic is extracted.
	data.len()
}

#[wasm_bindgen]
pub fn is_supported_image_file(path: &str) -> bool {
	core::formats::is_supported_image_file(path)
}

#[wasm_bindgen]
pub fn default_image_metadata_json() -> String {
	let metadata = core::metadata::ImageMetadata::default();
	serde_json::to_string(&metadata).unwrap_or_else(|_| "{}".to_string())
}

#[wasm_bindgen]
pub fn geometry_from_adjustments(adjustments_json: &str) -> String {
	let adjustments: serde_json::Value =
		serde_json::from_str(adjustments_json).unwrap_or(serde_json::Value::Null);
	let params = core::geometry::get_geometry_params_from_json(&adjustments);
	serde_json::to_string(&params).unwrap_or_else(|_| "{}".to_string())
}

#[wasm_bindgen]
pub fn apply_adjustments() -> Result<(), JsValue> {
	// Placeholder: wire to core processing pipeline.
	Ok(())
}

#[wasm_bindgen]
pub fn export_image() -> Vec<u8> {
	// Placeholder: return encoded image bytes from the pipeline.
	Vec::new()
}
