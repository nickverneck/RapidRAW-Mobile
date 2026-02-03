use anyhow::Result;
use exif::Reader as ExifReader;
use std::collections::HashMap;
use std::io::Cursor;

pub fn extract_non_raw_metadata(bytes: &[u8]) -> Result<HashMap<String, String>> {
    let mut exif_data = HashMap::new();
    let exif_reader = ExifReader::new();
    if let Ok(exif) = exif_reader.read_from_container(&mut Cursor::new(bytes)) {
        for field in exif.fields() {
            exif_data.insert(
                field.tag.to_string(),
                field.display_value().with_unit(&exif).to_string(),
            );
        }
    }
    Ok(exif_data)
}
