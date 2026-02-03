use anyhow::Result;
use rawler::rawsource::RawSource;
use std::collections::HashMap;

fn normalize_date_string(value: String) -> String {
    let clean = value.replace('"', "").trim().to_string();
    let bytes = clean.as_bytes();
    if bytes.len() >= 10 && bytes.get(4) == Some(&b':') && bytes.get(7) == Some(&b':') {
        let mut chars: Vec<char> = clean.chars().collect();
        if chars.len() > 7 {
            chars[4] = '-';
            chars[7] = '-';
            return chars.into_iter().collect();
        }
    }
    clean
}

pub fn extract_raw_metadata(bytes: &[u8]) -> Result<HashMap<String, String>> {
    let mut map = HashMap::new();

    let loader = rawler::RawLoader::new();
    let raw_source = RawSource::new_from_slice(bytes);
    let decoder = loader.get_decoder(&raw_source)?;
    let metadata = decoder.raw_metadata(&raw_source, &Default::default())?;
    let exif = metadata.exif;

    let fmt_rat = |r: &rawler::formats::tiff::Rational| -> f32 {
        if r.d == 0 { 0.0 } else { r.n as f32 / r.d as f32 }
    };

    let fmt_srat = |r: &rawler::formats::tiff::SRational| -> f32 {
        if r.d == 0 { 0.0 } else { r.n as f32 / r.d as f32 }
    };

    let mut insert_if_present = |key: &str, val: String| {
        let trimmed = val.trim();
        if !trimmed.is_empty() {
            map.insert(key.to_string(), val);
        }
    };

    insert_if_present("Make", metadata.make);
    insert_if_present("Model", metadata.model);

    if let Some(v) = exif.artist { insert_if_present("Artist", v); }
    if let Some(v) = exif.copyright { insert_if_present("Copyright", v); }
    if let Some(v) = exif.owner_name { insert_if_present("OwnerName", v); }
    if let Some(v) = exif.serial_number { insert_if_present("SerialNumber", v); }
    if let Some(v) = exif.image_number { insert_if_present("ImageNumber", v.to_string()); }
    if let Some(v) = exif.user_comment { insert_if_present("UserComment", v); }

    if let Some(v) = exif.date_time_original { insert_if_present("DateTimeOriginal", normalize_date_string(v)); }
    if let Some(v) = exif.create_date { insert_if_present("CreateDate", normalize_date_string(v)); }
    if let Some(v) = exif.modify_date { insert_if_present("ModifyDate", normalize_date_string(v)); }

    if let Some(v) = exif.offset_time { insert_if_present("OffsetTime", v); }
    if let Some(v) = exif.offset_time_original { insert_if_present("OffsetTimeOriginal", v); }
    if let Some(v) = exif.offset_time_digitized { insert_if_present("OffsetTimeDigitized", v); }
    if let Some(v) = exif.sub_sec_time { insert_if_present("SubSecTime", v); }
    if let Some(v) = exif.sub_sec_time_original { insert_if_present("SubSecTimeOriginal", v); }
    if let Some(v) = exif.sub_sec_time_digitized { insert_if_present("SubSecTimeDigitized", v); }

    if let Some(v) = exif.lens_model {
        insert_if_present("LensModel", v);
    } else if let Some(lens_desc) = &metadata.lens {
        insert_if_present("LensModel", lens_desc.lens_model.clone());
    }

    if let Some(v) = exif.lens_make {
        insert_if_present("LensMake", v);
    } else if let Some(lens_desc) = &metadata.lens {
        insert_if_present("LensMake", lens_desc.lens_make.clone());
    }

    if let Some(v) = exif.lens_serial_number { insert_if_present("LensSerialNumber", v); }
    if let Some(v) = exif.orientation { insert_if_present("Orientation", v.to_string()); }

    if let Some(r) = exif.fnumber {
        let val = fmt_rat(&r);
        insert_if_present("FNumber", format!("f/{}", val));
    }

    if let Some(r) = exif.aperture_value {
        let val = fmt_rat(&r);
        insert_if_present("ApertureValue", format!("f/{}", val));
    }

    if let Some(r) = exif.max_aperture_value {
        insert_if_present("MaxApertureValue", fmt_rat(&r).to_string());
    }

    if let Some(r) = exif.exposure_time {
        if r.n == 1 && r.d > 1 {
            insert_if_present("ExposureTime", format!("1/{} s", r.d));
        } else {
            let val = fmt_rat(&r);
            if val < 1.0 && val > 0.0 {
                insert_if_present("ExposureTime", format!("1/{} s", (1.0 / val).round()));
            } else {
                insert_if_present("ExposureTime", format!("{} s", val));
            }
        }
    }

    if let Some(r) = exif.shutter_speed_value {
        insert_if_present("ShutterSpeedValue", fmt_srat(&r).to_string());
    }

    if let Some(v) = exif.iso_speed {
        insert_if_present("PhotographicSensitivity", v.to_string());
        insert_if_present("ISOSpeed", v.to_string());
    } else if let Some(v) = exif.iso_speed_ratings {
        insert_if_present("PhotographicSensitivity", v.to_string());
        insert_if_present("ISOSpeedRatings", v.to_string());
    }

    if let Some(v) = exif.recommended_exposure_index {
        insert_if_present("RecommendedExposureIndex", v.to_string());
    }
    if let Some(v) = exif.sensitivity_type {
        insert_if_present("SensitivityType", v.to_string());
    }

    if let Some(r) = exif.focal_length {
        let val = fmt_rat(&r);
        insert_if_present("FocalLength", val.to_string());
        insert_if_present("FocalLengthIn35mmFilm", val.to_string());
    }

    if let Some(r) = exif.exposure_bias {
        insert_if_present("ExposureBiasValue", fmt_srat(&r).to_string());
    }

    if let Some(v) = exif.metering_mode { insert_if_present("MeteringMode", v.to_string()); }
    if let Some(v) = exif.light_source { insert_if_present("LightSource", v.to_string()); }
    if let Some(v) = exif.flash { insert_if_present("Flash", v.to_string()); }
    if let Some(v) = exif.white_balance { insert_if_present("WhiteBalance", v.to_string()); }
    if let Some(v) = exif.exposure_program { insert_if_present("ExposureProgram", v.to_string()); }
    if let Some(v) = exif.exposure_mode { insert_if_present("ExposureMode", v.to_string()); }
    if let Some(v) = exif.scene_capture_type { insert_if_present("SceneCaptureType", v.to_string()); }
    if let Some(v) = exif.color_space { insert_if_present("ColorSpace", v.to_string()); }
    if let Some(r) = exif.flash_energy { insert_if_present("FlashEnergy", fmt_rat(&r).to_string()); }
    if let Some(r) = exif.brightness_value { insert_if_present("BrightnessValue", fmt_srat(&r).to_string()); }

    if let Some(r) = exif.subject_distance { insert_if_present("SubjectDistance", fmt_rat(&r).to_string()); }
    if let Some(v) = exif.subject_distance_range { insert_if_present("SubjectDistanceRange", v.to_string()); }

    if let Some(gps) = exif.gps {
        let fmt_gps_coord = |coords: &[rawler::formats::tiff::Rational; 3]| -> String {
            format!(
                "{} deg {} min {} sec",
                fmt_rat(&coords[0]),
                fmt_rat(&coords[1]),
                fmt_rat(&coords[2])
            )
        };

        if let Some(lat) = gps.gps_latitude {
            insert_if_present("GPSLatitude", fmt_gps_coord(&lat));
        }
        if let Some(lat_ref) = gps.gps_latitude_ref {
            insert_if_present("GPSLatitudeRef", lat_ref);
        }
        if let Some(lon) = gps.gps_longitude {
            insert_if_present("GPSLongitude", fmt_gps_coord(&lon));
        }
        if let Some(lon_ref) = gps.gps_longitude_ref {
            insert_if_present("GPSLongitudeRef", lon_ref);
        }
        if let Some(alt) = gps.gps_altitude {
            insert_if_present("GPSAltitude", fmt_rat(&alt).to_string());
        }
        if let Some(alt_ref) = gps.gps_altitude_ref {
            insert_if_present("GPSAltitudeRef", alt_ref.to_string());
        }
        if let Some(v) = gps.gps_img_direction { insert_if_present("GPSImgDirection", fmt_rat(&v).to_string()); }
        if let Some(v) = gps.gps_img_direction_ref { insert_if_present("GPSImgDirectionRef", v); }
        if let Some(v) = gps.gps_speed { insert_if_present("GPSSpeed", fmt_rat(&v).to_string()); }
        if let Some(v) = gps.gps_speed_ref { insert_if_present("GPSSpeedRef", v); }
        if let Some(v) = gps.gps_status { insert_if_present("GPSStatus", v); }
        if let Some(v) = gps.gps_measure_mode { insert_if_present("GPSMeasureMode", v); }
        if let Some(v) = gps.gps_dop { insert_if_present("GPSDOP", fmt_rat(&v).to_string()); }
        if let Some(v) = gps.gps_map_datum { insert_if_present("GPSMapDatum", v); }
    }

    Ok(map)
}
