use crate::image_processing::apply_orientation;
use anyhow::Result;
use image::DynamicImage;
use rawler::{
    decoders::{Orientation, RawDecodeParams},
    imgop::develop::{DemosaicAlgorithm, ProcessingStep, RawDevelop},
    rawimage::RawImage,
    rawsource::RawSource,
};

pub fn develop_raw_image(file_bytes: &[u8], fast_demosaic: bool) -> Result<DynamicImage> {
    let (developed_image, orientation) = develop_internal(file_bytes, fast_demosaic)?;
    Ok(apply_orientation(developed_image, orientation))
}

fn develop_internal(file_bytes: &[u8], fast_demosaic: bool) -> Result<(DynamicImage, Orientation)> {
    let source = RawSource::new_from_slice(file_bytes);
    let decoder = rawler::get_decoder(&source)?;
    let raw_image: RawImage = decoder.raw_image(&source, &RawDecodeParams::default(), false)?;
    let metadata = decoder.raw_metadata(&source, &RawDecodeParams::default())?;
    let orientation = metadata
        .exif
        .orientation
        .map(Orientation::from_u16)
        .unwrap_or(Orientation::Normal);
    let mut developer = RawDevelop::default();
    if fast_demosaic {
        developer.demosaic_algorithm = DemosaicAlgorithm::Speed;
    }
    developer.steps.retain(|&step| step != ProcessingStep::SRgb);
    let developed_intermediate = developer.develop_intermediate(&raw_image)?;
    let dynamic_image = developed_intermediate
        .to_dynamic_image()
        .ok_or_else(|| anyhow::anyhow!("Failed to convert developed image to DynamicImage"))?;
    Ok((dynamic_image, orientation))
}