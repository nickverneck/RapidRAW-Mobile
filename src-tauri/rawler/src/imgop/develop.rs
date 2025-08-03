// SPDX-License-Identifier: LGPL-2.1
// Copyright 2021 Daniel Vogelbacher <daniel@chaospixel.com>

use std::io;
use image::{DynamicImage, ImageBuffer};

use crate::{
  decoders::RawMetadata,
  formats::tiff::{DirectoryWriter, TiffWriter},
  pixarray::{Color2D, PixF32},
  rawimage::{RawImage, RawPhotometricInterpretation},
  tags::{ExifTag, TiffCommonTag},
};

use super::{
  convert_from_f32_scaled_u16,
  raw::{map_3ch_to_rgb, map_4ch_to_rgb},
  sensor::bayer::{
    bilinear::Bilinear4Channel, ppg::PPGDemosaic, superpixel::{Superpixel4Channel, SuperpixelQuarterRes3Channel}, Demosaic,
  },
  sensor::xtrans::demosaic::{XTransDemosaic, XTransSuperpixelDemosaic},
  xyz::Illuminant,
  Dim2, Rect,
};

#[derive(PartialEq, Eq, Debug, Clone, Copy)]
pub enum ProcessingStep {
  Rescale,
  Demosaic,
  CropActiveArea,
  WhiteBalance,
  Calibrate,
  CropDefault,
  SRgb,
}

/// The demosaicing algorithm to use.
#[derive(PartialEq, Eq, Debug, Clone, Copy, Default)]
pub enum DemosaicAlgorithm {
  /// High-quality demosaicing (PPG for Bayer, Full-Res for X-Trans).
  #[default]
  Quality,
  /// High-speed demosaicing using a superpixel algorithm (e.g. for thumbnails).
  Speed,
}

pub struct RawDevelopBuilder {}

#[derive(Clone)]
pub enum Intermediate {
  Monochrome(PixF32),
  ThreeColor(Color2D<f32, 3>),
  FourColor(Color2D<f32, 4>),
}

impl Intermediate {
  pub fn dim(&self) -> Dim2 {
    match self {
      Intermediate::Monochrome(pixels) => pixels.dim(),
      Intermediate::ThreeColor(pixels) => pixels.dim(),
      Intermediate::FourColor(pixels) => pixels.dim(),
    }
  }

  pub fn rect(&self) -> Rect {
    match self {
      Intermediate::Monochrome(pixels) => pixels.rect(),
      Intermediate::ThreeColor(pixels) => pixels.rect(),
      Intermediate::FourColor(pixels) => pixels.rect(),
    }
  }

  pub fn to_dynamic_image(self) -> Option<DynamicImage> {
    Some(match self {
      Intermediate::Monochrome(pixels) => {
        let data = convert_from_f32_scaled_u16(&pixels.data, 0, u16::MAX);
        DynamicImage::ImageLuma16(ImageBuffer::from_raw(pixels.dim().w as u32, pixels.dim().h as u32, data)?)
      }
      Intermediate::ThreeColor(pixels) => {
        let data = convert_from_f32_scaled_u16(&pixels.flatten(), 0, u16::MAX);
        DynamicImage::ImageRgb16(ImageBuffer::from_raw(pixels.dim().w as u32, pixels.dim().h as u32, data)?)
      }
      Intermediate::FourColor(pixels) => {
        let data = convert_from_f32_scaled_u16(&pixels.flatten(), 0, u16::MAX);
        DynamicImage::ImageRgba16(ImageBuffer::from_raw(pixels.dim().w as u32, pixels.dim().h as u32, data)?)
      }
    })
  }
}

#[derive(Clone)]
pub struct RawDevelop {
  pub steps: Vec<ProcessingStep>,
  pub demosaic_algorithm: DemosaicAlgorithm,
}

impl Default for RawDevelop {
  fn default() -> Self {
    Self {
      steps: vec![
        ProcessingStep::Rescale,
        ProcessingStep::Demosaic,
        ProcessingStep::CropActiveArea,
        ProcessingStep::WhiteBalance,
        ProcessingStep::Calibrate,
        ProcessingStep::CropDefault,
        ProcessingStep::SRgb,
      ],
      demosaic_algorithm: DemosaicAlgorithm::default(),
    }
  }
}

impl RawDevelop {
  /*
  pub fn linearize(rawimage: &RawImage) -> crate::Result<RgbF32> {
    todo!()
  }

  pub fn develop_monochrome_image(&self, rawimage: &RawImage) -> crate::Result<PixF32> {
    todo!()
  }

  pub fn develop_rgb_image(&self, rawimage: &RawImage) -> crate::Result<RgbF32> {
    todo!()
  }
   */

  /// Develop raw image and write result into TIFF.
  /// If demosaic is disabled or camera raw is monochrome, the TIFF
  /// has only one color channel.
  pub fn develop_intermediate(&self, rawimage: &RawImage) -> crate::Result<Intermediate> {
    let mut rawimage = rawimage.clone();
    if self.steps.contains(&ProcessingStep::Rescale) {
      rawimage.apply_scaling()?;
    }

    let mut intermediate = match rawimage.cpp {
      1 => Intermediate::Monochrome(PixF32::new_with(rawimage.data.as_f32().into_owned(), rawimage.width, rawimage.height)),
      3 => Intermediate::ThreeColor(Color2D::<f32, 3>::new_with(
        rawimage.data.as_f32().chunks_exact(3).map(|x| [x[0], x[1], x[2]]).collect(),
        rawimage.width,
        rawimage.height,
      )),
      4 => Intermediate::FourColor(Color2D::<f32, 4>::new_with(
        rawimage.data.as_f32().chunks_exact(4).map(|x| [x[0], x[1], x[2], x[3]]).collect(),
        rawimage.width,
        rawimage.height,
      )),
      _ => todo!(),
    };

    if self.steps.contains(&ProcessingStep::Demosaic) {
      intermediate = match &rawimage.photometric {
        RawPhotometricInterpretation::Cfa(config) => {
          println!(
              "INFO: Demosaicing check for '{} {}': CFA name='{}', width={}, height={}, is_rgb={}",
              rawimage.clean_make,
              rawimage.clean_model,
              config.cfa.name,
              config.cfa.width,
              config.cfa.height,
              config.cfa.is_rgb()
          );

          match intermediate {
            Intermediate::Monochrome(pixels) => {
              let roi = if self.steps.contains(&ProcessingStep::CropActiveArea) {
                rawimage.active_area.unwrap_or(pixels.rect())
              } else {
                pixels.rect()
              };

              if config.cfa.is_rgb() {
                if config.cfa.width == 6 && config.cfa.height == 6 {
                    println!("INFO: X-Trans pattern (6x6) detected. Applying X-Trans demosaicing ({:?}).", self.demosaic_algorithm);
                    match self.demosaic_algorithm {
                        DemosaicAlgorithm::Quality => {
                            let xtrans_demosaic = XTransDemosaic::new();
                            Intermediate::ThreeColor(xtrans_demosaic.demosaic(&pixels, &config.cfa, &config.colors, roi))
                        }
                        DemosaicAlgorithm::Speed => {
                            let xtrans_demosaic = XTransSuperpixelDemosaic::new();
                            Intermediate::ThreeColor(xtrans_demosaic.demosaic(&pixels, &config.cfa, &config.colors, roi))
                        }
                    }
                } else {
                    println!("INFO: RGB Bayer-like pattern detected. Applying Bayer demosaicing.");
                    match self.demosaic_algorithm {
                        DemosaicAlgorithm::Quality => {
                            let ppg = PPGDemosaic::new();
                            Intermediate::ThreeColor(ppg.demosaic(&pixels, &config.cfa, &config.colors, roi))
                        }
                        DemosaicAlgorithm::Speed => {
                            let superpixel = SuperpixelQuarterRes3Channel::new();
                            Intermediate::ThreeColor(superpixel.demosaic(&pixels, &config.cfa, &config.colors, roi))
                        }
                    }
                }
              } else if config.cfa.unique_colors() == 4 {
                  println!("INFO: 4-Color pattern detected. Applying 4-channel demosaicing.");
                  match self.demosaic_algorithm {
                      DemosaicAlgorithm::Quality => {
                          let linear = Bilinear4Channel::new();
                          Intermediate::FourColor(linear.demosaic(&pixels, &config.cfa, &config.colors, roi))
                      }
                      DemosaicAlgorithm::Speed => {
                          let superpixel = Superpixel4Channel::new();
                          Intermediate::FourColor(superpixel.demosaic(&pixels, &config.cfa, &config.colors, roi))
                      }
                  }
              } else {
                  println!("WARN: Unsupported CFA pattern '{}' for demosaicing. Passing through without demosaicing.", config.cfa.name);
                  Intermediate::Monochrome(pixels)
              }
            }
            val => val,
          }
        }
        _ => intermediate,
      };
    }

    if self.steps.contains(&ProcessingStep::Calibrate) {
      let mut wb = rawimage.wb_coeffs;

      for c in wb.iter_mut() {
        if c.is_nan() {
          *c = 1.0;
        }
      }

      if !self.steps.contains(&ProcessingStep::WhiteBalance) {
        wb = [1.0, 1.0, 1.0, 1.0];
      }

      let color_matrix = rawimage
        .color_matrix
        .iter()
        .find(|(illuminant, _m)| **illuminant == Illuminant::D65)
        .map(|(_, m)| m) // We only need the matrix slice, not the illuminant type
        .ok_or("Calibration failed: Color matrix for D65 illuminant not found")?;

      let mut xyz2cam = [[0.0; 3]; 4];

      for (i, chunk) in color_matrix.chunks_exact(3).enumerate() {
        if i < xyz2cam.len() {
          xyz2cam[i] = [chunk[0], chunk[1], chunk[2]];
        }
      }
      println!("DEBUG: Applying calibration with wb: {:?}, xyz2cam: {:?}", wb, xyz2cam);
      intermediate = match intermediate {
        Intermediate::Monochrome(_) => intermediate,
        Intermediate::ThreeColor(pixels) => Intermediate::ThreeColor(map_3ch_to_rgb(&pixels, &wb, xyz2cam)),
        Intermediate::FourColor(pixels) => Intermediate::ThreeColor(map_4ch_to_rgb(&pixels, &wb, xyz2cam)),
      };
    }

    if self.steps.contains(&ProcessingStep::CropDefault) {
      if let Some(mut crop) = rawimage.crop_area {
        if self.steps.contains(&ProcessingStep::Demosaic) && self.steps.contains(&ProcessingStep::CropActiveArea) {
          if let Some(active_area) = rawimage.active_area {
            let intersection = crop.intersection(&active_area);
            crop = intersection.adapt(&active_area);
          }
        }
        let original_width = rawimage.active_area.map(|area| area.d.w).unwrap_or(rawimage.dim().w);
        if original_width > 0 {
            let scale_factor = intermediate.dim().w as f32 / original_width as f32;
            if (scale_factor - 1.0).abs() > 1e-6 {
                crop.scale(scale_factor);
            }
        }
        if !crop.is_empty() && crop.d != intermediate.dim() {
          println!("DEBUG: crop: {:?}, intermediate dim: {:?}, rawimage: {:?}", crop, intermediate.dim(), rawimage.dim());
          intermediate = match intermediate {
            Intermediate::Monochrome(pixels) => Intermediate::Monochrome(pixels.crop(crop)),
            Intermediate::ThreeColor(pixels) => Intermediate::ThreeColor(pixels.crop(crop)),
            Intermediate::FourColor(pixels) => Intermediate::FourColor(pixels.crop(crop)),
          };
        }
      }
    }

    if self.steps.contains(&ProcessingStep::SRgb) {
      match &mut intermediate {
        Intermediate::Monochrome(pixels) => pixels.for_each(super::srgb::srgb_apply_gamma),
        Intermediate::ThreeColor(pixels) => pixels.for_each(super::srgb::srgb_apply_gamma_n),
        Intermediate::FourColor(pixels) => pixels.for_each(super::srgb::srgb_apply_gamma_n),
      };
    }

    Ok(intermediate)
  }

  /// Develop raw image and write result into TIFF.
  /// If demosaic is disabled or camera raw is monochrome, the TIFF
  /// has only one color channel.
  pub fn develop<W>(&self, rawimage: &RawImage, md: &RawMetadata, writer: W) -> crate::Result<()>
  where
    W: io::Write + io::Seek,
  {
    let intermediate = self.develop_intermediate(rawimage)?;

    let mut tiff = TiffWriter::new(writer)?;
    let mut root_ifd = DirectoryWriter::new();
    let mut exif_ifd = DirectoryWriter::new();

    // Add EXIF version 0220
    exif_ifd.add_tag_undefined(ExifTag::ExifVersion, vec![48, 50, 50, 48]);

    md.write_exif_tags(&mut tiff, &mut root_ifd, &mut exif_ifd)?;
    root_ifd.add_tag(TiffCommonTag::Make, rawimage.clean_make.as_str());
    root_ifd.add_tag(TiffCommonTag::Model, rawimage.clean_model.as_str());

    let exif_offset = exif_ifd.build(&mut tiff)?;

    root_ifd.add_tag(TiffCommonTag::ExifIFDPointer, exif_offset);

    match intermediate {
      Intermediate::Monochrome(pixels) => {
        let data = convert_from_f32_scaled_u16(&pixels.data, 0, u16::MAX);
        let (strip_rows, strips) = tiff.write_strips_lzw(&data, 1, pixels.dim(), 0)?;
        let strip_offsets: Vec<u32> = strips.iter().map(|(offset, _)| *offset).collect();
        let strip_bytes: Vec<u32> = strips.iter().map(|(_, bytes)| *bytes).collect();
        root_ifd.add_tag(TiffCommonTag::Compression, 5);
        root_ifd.add_tag(TiffCommonTag::Predictor, 1);
        root_ifd.add_tag(TiffCommonTag::StripOffsets, &strip_offsets);
        root_ifd.add_tag(TiffCommonTag::StripByteCounts, &strip_bytes);
        root_ifd.add_tag(TiffCommonTag::BitsPerSample, [16_u16]);
        root_ifd.add_tag(TiffCommonTag::SamplesPerPixel, [1_u16]);
        root_ifd.add_tag(TiffCommonTag::PhotometricInt, [1_u16]);
        root_ifd.add_tag(TiffCommonTag::RowsPerStrip, strip_rows);
        root_ifd.add_tag(TiffCommonTag::ImageWidth, pixels.width as u16);
        root_ifd.add_tag(TiffCommonTag::ImageLength, pixels.height as u16);
      }
      Intermediate::ThreeColor(pixels) => {
        let data = convert_from_f32_scaled_u16(&pixels.flatten(), 0, u16::MAX);
        let (strip_rows, strips) = tiff.write_strips_lzw(&data, 3, pixels.dim(), 0)?;
        let strip_offsets: Vec<u32> = strips.iter().map(|(offset, _)| *offset).collect();
        let strip_bytes: Vec<u32> = strips.iter().map(|(_, bytes)| *bytes).collect();
        root_ifd.add_tag(TiffCommonTag::Compression, 5);
        root_ifd.add_tag(TiffCommonTag::Predictor, 1);
        root_ifd.add_tag(TiffCommonTag::StripOffsets, &strip_offsets);
        root_ifd.add_tag(TiffCommonTag::StripByteCounts, &strip_bytes);
        root_ifd.add_tag(TiffCommonTag::BitsPerSample, [16_u16, 16, 16]);
        root_ifd.add_tag(TiffCommonTag::SamplesPerPixel, [3_u16]);
        root_ifd.add_tag(TiffCommonTag::PhotometricInt, [2_u16]);
        root_ifd.add_tag(TiffCommonTag::RowsPerStrip, strip_rows);
        root_ifd.add_tag(TiffCommonTag::ImageWidth, pixels.width as u16);
        root_ifd.add_tag(TiffCommonTag::ImageLength, pixels.height as u16);
      }
      Intermediate::FourColor(pixels) => {
        let data = convert_from_f32_scaled_u16(&pixels.flatten(), 0, u16::MAX);
        let (strip_rows, strips) = tiff.write_strips_lzw(&data, 4, pixels.dim(), 0)?;
        let strip_offsets: Vec<u32> = strips.iter().map(|(offset, _)| *offset).collect();
        let strip_bytes: Vec<u32> = strips.iter().map(|(_, bytes)| *bytes).collect();
        root_ifd.add_tag(TiffCommonTag::Compression, 5);
        root_ifd.add_tag(TiffCommonTag::Predictor, 1);
        root_ifd.add_tag(TiffCommonTag::StripOffsets, &strip_offsets);
        root_ifd.add_tag(TiffCommonTag::StripByteCounts, &strip_bytes);
        root_ifd.add_tag(TiffCommonTag::BitsPerSample, [16_u16, 16, 16, 16]); // Extra-channel, even if PhotometricInt is RGB!
        root_ifd.add_tag(TiffCommonTag::SamplesPerPixel, [4_u16]);
        root_ifd.add_tag(TiffCommonTag::PhotometricInt, [2_u16]);
        root_ifd.add_tag(TiffCommonTag::RowsPerStrip, strip_rows);
        root_ifd.add_tag(TiffCommonTag::ImageWidth, pixels.width as u16);
        root_ifd.add_tag(TiffCommonTag::ImageLength, pixels.height as u16);
      }
    }

    tiff.build(root_ifd)?;

    Ok(())
  }
}