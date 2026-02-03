use wasm_bindgen::prelude::*;
use js_sys::Promise;

mod core;

fn decode_image_from_bytes(
	data: &[u8],
	path: &str,
	use_fast_raw_dev: bool,
	highlight_compression: f32,
) -> Result<image::DynamicImage, JsValue> {
	let is_raw = core::formats::is_raw_file(path);
	if is_raw {
		#[cfg(feature = "raw-processing")]
		{
			let mut img = core::raw_processing::develop_raw_image(
				data,
				use_fast_raw_dev,
				highlight_compression,
				None,
			)
			.map_err(|err| JsValue::from_str(&format!("raw decode failed: {err}")))?;
			if !use_fast_raw_dev {
				core::image_processing::remove_raw_artifacts_and_enhance(&mut img);
			}
			Ok(img)
		}
		#[cfg(not(feature = "raw-processing"))]
		{
			Err(JsValue::from_str("RAW decoding is not enabled in this build."))
		}
	} else {
		#[cfg(feature = "image-decoding")]
		{
			let decoded = core::image_loader::load_non_raw_image_from_bytes(data, path)
				.map_err(|err| JsValue::from_str(&format!("image decode failed: {err}")))?;
			Ok(decoded)
		}
		#[cfg(not(feature = "image-decoding"))]
		{
			Err(JsValue::from_str("Image decoding is not enabled in this build."))
		}
	}
}

fn encode_png(image: &image::DynamicImage) -> Result<Vec<u8>, JsValue> {
	let rgba = image.to_rgba8();
	let mut bytes = Vec::new();
	image::DynamicImage::ImageRgba8(rgba)
		.write_to(&mut std::io::Cursor::new(&mut bytes), image::ImageFormat::Png)
		.map_err(|err| JsValue::from_str(&format!("png encode failed: {err}")))?;
	Ok(bytes)
}

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

#[wasm_bindgen]
pub fn load_image_preview_png(
	data: &[u8],
	path: &str,
	max_edge: u32,
	use_fast_raw_dev: bool,
	highlight_compression: f32,
) -> Result<Vec<u8>, JsValue> {
	let image = decode_image_from_bytes(data, path, use_fast_raw_dev, highlight_compression)?;

	let image = if max_edge > 0 {
		core::image_utils::downscale_f32_image(&image, max_edge, max_edge)
	} else {
		image
	};

	encode_png(&image)
}

#[wasm_bindgen]
pub fn load_image_preview_with_adjustments_png(
	data: &[u8],
	path: &str,
	max_edge: u32,
	adjustments_json: &str,
	use_fast_raw_dev: bool,
	highlight_compression: f32,
) -> Result<Vec<u8>, JsValue> {
	let mut image = decode_image_from_bytes(data, path, use_fast_raw_dev, highlight_compression)?;
	let adjustments = core::adjustments::parse_adjustments(adjustments_json);
	core::adjustments::apply_basic_adjustments(&mut image, &adjustments);

	let image = if max_edge > 0 {
		core::image_utils::downscale_f32_image(&image, max_edge, max_edge)
	} else {
		image
	};

	encode_png(&image)
}

#[cfg(feature = "image-decoding")]
#[wasm_bindgen]
pub fn non_raw_metadata_json(data: &[u8]) -> Result<String, JsValue> {
	let map = core::non_raw_metadata::extract_non_raw_metadata(data)
		.map_err(|err| JsValue::from_str(&format!("metadata failed: {err}")))?;
	serde_json::to_string(&map).map_err(|err| JsValue::from_str(&format!("serialize failed: {err}")))
}

#[cfg(feature = "raw-processing")]
#[wasm_bindgen]
pub fn raw_metadata_json(data: &[u8]) -> Result<String, JsValue> {
	let map = core::raw_metadata::extract_raw_metadata(data)
		.map_err(|err| JsValue::from_str(&format!("raw metadata failed: {err}")))?;
	serde_json::to_string(&map).map_err(|err| JsValue::from_str(&format!("serialize failed: {err}")))
}

#[cfg(feature = "image-decoding")]
#[wasm_bindgen]
pub fn decode_image_preview_png(
	data: &[u8],
	path: &str,
	max_edge: u32,
) -> Result<Vec<u8>, JsValue> {
	load_image_preview_png(data, path, max_edge, true, 1.5)
}

#[cfg(feature = "raw-processing-threads")]
#[wasm_bindgen]
pub fn init_thread_pool(num_threads: usize) -> Promise {
	wasm_bindgen_rayon::init_thread_pool(num_threads)
}

#[cfg(not(feature = "raw-processing-threads"))]
#[wasm_bindgen]
pub fn init_thread_pool(_num_threads: usize) -> Promise {
	Promise::reject(&JsValue::from_str(
		"Thread pool not enabled in this WASM build.",
	))
}

#[cfg(feature = "raw-processing")]
#[wasm_bindgen]
pub fn develop_raw_preview_png(
	data: &[u8],
	max_edge: u32,
	fast_demosaic: bool,
	highlight_compression: f32,
) -> Result<Vec<u8>, JsValue> {
	let image = core::raw_processing::develop_raw_image(
		data,
		fast_demosaic,
		highlight_compression,
		None,
	)
	.map_err(|err| JsValue::from_str(&format!("raw decode failed: {err}")))?;

	let image = if max_edge > 0 {
		core::image_utils::downscale_f32_image(&image, max_edge, max_edge)
	} else {
		image
	};

	encode_png(&image)
}
