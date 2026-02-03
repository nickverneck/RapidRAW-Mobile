use anyhow::{anyhow, Context, Result};
use exif::{Reader as ExifReader, Tag};
use exr::image::pixel_vec::PixelVec;
use exr::prelude::*;
use image::{DynamicImage, ImageReader};
use qoi::Channels;
use std::io::Cursor;

fn apply_exif_orientation(image: DynamicImage, orientation: u16) -> DynamicImage {
    match orientation {
        2 => image.fliph(),
        3 => image.rotate180(),
        4 => image.flipv(),
        5 => image.rotate90().flipv(),
        6 => image.rotate90(),
        7 => image.rotate90().fliph(),
        8 => image.rotate270(),
        _ => image,
    }
}

fn load_exr_from_bytes(bytes: &[u8]) -> Result<DynamicImage> {
    let cursor = Cursor::new(bytes);
    let buffered_reader = std::io::BufReader::new(cursor);

    let exr_image_result = read()
        .no_deep_data()
        .largest_resolution_level()
        .rgba_channels(
            PixelVec::<(f32, f32, f32, f32)>::constructor,
            PixelVec::set_pixel,
        )
        .first_valid_layer()
        .all_attributes()
        .from_buffered(buffered_reader);

    let exr_image = exr_image_result.context("Failed to read EXR image data")?;

    let layer = exr_image.layer_data;
    let resolution = layer.size;
    let width = resolution.x() as u32;
    let height = resolution.y() as u32;
    let pixels = layer.channel_data.pixels;

    let mut rgb_image = image::Rgb32FImage::new(width, height);

    for (index, (r, g, b, _a)) in pixels.pixels.into_iter().enumerate() {
        let x = (index % width as usize) as u32;
        let y = (index / width as usize) as u32;
        rgb_image.put_pixel(x, y, image::Rgb([r, g, b]));
    }

    Ok(DynamicImage::ImageRgb32F(rgb_image))
}

fn load_qoi_from_bytes(bytes: &[u8]) -> Result<DynamicImage> {
    let (qoi_header, qoi_image) =
        qoi::decode_to_vec(bytes).context("Failed to decode QOI image")?;

    match qoi_header.channels {
        Channels::Rgb => {
            let img_buffer =
                image::RgbImage::from_raw(qoi_header.width, qoi_header.height, qoi_image)
                    .context("Failed to create RGB image from QOI data")?;
            Ok(DynamicImage::ImageRgb8(img_buffer))
        }
        Channels::Rgba => {
            let img_buffer =
                image::RgbaImage::from_raw(qoi_header.width, qoi_header.height, qoi_image)
                    .context("Failed to create RGBA image from QOI data")?;
            Ok(DynamicImage::ImageRgba8(img_buffer))
        }
    }
}

pub fn load_image_with_orientation(bytes: &[u8]) -> Result<DynamicImage> {
    let cursor = Cursor::new(bytes);
    let mut reader = ImageReader::new(cursor.clone())
        .with_guessed_format()
        .context("Failed to guess image format")?;

    reader.no_limits();

    let image = reader.decode().context("Failed to decode image")?;

    let oriented_image = {
        let exif_reader = ExifReader::new();
        if let Ok(exif) = exif_reader.read_from_container(&mut cursor.clone()) {
            if let Some(orientation) = exif
                .get_field(Tag::Orientation, exif::In::PRIMARY)
                .and_then(|f| f.value.get_uint(0))
            {
                apply_exif_orientation(image, orientation as u16)
            } else {
                image
            }
        } else {
            image
        }
    };

    Ok(DynamicImage::ImageRgb32F(oriented_image.to_rgb32f()))
}

pub fn load_non_raw_image_from_bytes(bytes: &[u8], path_for_ext_check: &str) -> Result<DynamicImage> {
    let path = std::path::Path::new(path_for_ext_check);
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");

    if ext.eq_ignore_ascii_case("exr") {
        return load_exr_from_bytes(bytes);
    }

    if ext.eq_ignore_ascii_case("qoi") {
        return load_qoi_from_bytes(bytes);
    }

    load_image_with_orientation(bytes)
        .map_err(|err| anyhow!("Failed to load image '{}': {err}", path_for_ext_check))
}
