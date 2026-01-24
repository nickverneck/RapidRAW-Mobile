use crate::AppState;
use fuzzy_matcher::FuzzyMatcher;
use log;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{Manager, State};
use walkdir::WalkDir;

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct Distortion {
    #[serde(rename = "@model")]
    pub model: String,
    #[serde(rename = "@focal")]
    pub focal: f32,
    #[serde(rename = "@k1")]
    pub k1: Option<f32>,
    #[serde(rename = "@k2")]
    pub k2: Option<f32>,
    #[serde(rename = "@k3")]
    pub k3: Option<f32>,
    #[serde(rename = "@a")]
    pub a: Option<f32>,
    #[serde(rename = "@b")]
    pub b: Option<f32>,
    #[serde(rename = "@c")]
    pub c: Option<f32>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct Calibration {
    #[serde(rename = "distortion", default)]
    pub distortions: Vec<Distortion>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct Lens {
    pub maker: Vec<MultiName>,
    pub model: Vec<MultiName>,
    pub mount: Vec<String>,
    pub cropfactor: Option<f32>,
    pub calibration: Option<Calibration>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct Camera {
    pub maker: Vec<MultiName>,
    pub model: Vec<MultiName>,
    pub mount: String,
    pub cropfactor: f32,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct LensDatabase {
    #[serde(rename = "camera", default)]
    pub cameras: Vec<Camera>,
    #[serde(rename = "lens", default)]
    pub lenses: Vec<Lens>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct MultiName {
    #[serde(rename = "@lang")]
    lang: Option<String>,
    #[serde(rename = "$value")]
    value: String,
}

#[derive(Serialize)]
pub struct LensDistortionParams {
    k1: f64,
    k2: f64,
    k3: f64,
    model: u32,
}

impl Lens {
    pub fn get_name(&self) -> &str {
        &self.model[0].value
    }

    pub fn get_maker(&self) -> &str {
        &self.maker[0].value
    }
}

pub fn load_lensfun_db(app_handle: &tauri::AppHandle) -> LensDatabase {
    let mut combined_db = LensDatabase {
        cameras: Vec::new(),
        lenses: Vec::new(),
    };

    let resource_path = app_handle
        .path()
        .resolve("lensfun_db", tauri::path::BaseDirectory::Resource)
        .expect("failed to resolve lensfun_db directory");

    if !resource_path.exists() {
        log::error!("Lensfun DB directory not found at: {:?}", resource_path);
        return combined_db;
    }

    for entry in WalkDir::new(resource_path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "xml"))
    {
        let path = entry.path();
        match fs::read_to_string(path) {
            Ok(xml_content) => {
                match quick_xml::de::from_str::<LensDatabase>(&xml_content) {
                    Ok(mut db) => {
                        combined_db.cameras.append(&mut db.cameras);
                        combined_db.lenses.append(&mut db.lenses);
                    }
                    Err(e) => log::error!("Failed to parse Lensfun XML file {:?}: {}", path, e),
                }
            }
            Err(e) => log::error!("Failed to read Lensfun XML file {:?}: {}", path, e),
        }
    }

    log::info!("Loaded {} lenses and {} cameras from Lensfun database.", combined_db.lenses.len(), combined_db.cameras.len());
    combined_db
}

impl Lens {
    pub fn get_distortion_params(&self, focal_length: f32) -> Option<(f64, f64, f64, u32)> {
        let distortions = self.calibration.as_ref()?.distortions.as_slice();
        if distortions.is_empty() { return None; }

        let mut sorted_distortions = distortions.to_vec();
        sorted_distortions.sort_by(|a, b| a.focal.partial_cmp(&b.focal).unwrap());

        if let Some(exact_match) = sorted_distortions.iter().find(|d| (d.focal - focal_length).abs() < 1e-5) {
            return Some(extract_params(exact_match));
        }

        if focal_length < sorted_distortions.first().unwrap().focal {
            return Some(extract_params(&sorted_distortions[0]));
        }
        if focal_length > sorted_distortions.last().unwrap().focal {
            return Some(extract_params(sorted_distortions.last().unwrap()));
        }

        for i in 0..sorted_distortions.len() - 1 {
            let d1 = &sorted_distortions[i];
            let d2 = &sorted_distortions[i + 1];

            if focal_length >= d1.focal && focal_length <= d2.focal {
                let p1 = extract_params(d1);
                let p2 = extract_params(d2);

                if p1.3 != p2.3 {
                    return Some(p1);
                }

                let t = (focal_length - d1.focal) / (d2.focal - d1.focal);
                
                let k1 = p1.0 + t as f64 * (p2.0 - p1.0);
                let k2 = p1.1 + t as f64 * (p2.1 - p1.1);
                let k3 = p1.2 + t as f64 * (p2.2 - p1.2);

                return Some((k1, k2, k3, p1.3));
            }
        }
        
        None
    }
}

fn extract_params(dist: &Distortion) -> (f64, f64, f64, u32) {
    match dist.model.as_str() {
        "poly3" | "poly5" => (
            dist.k1.unwrap_or(0.0) as f64, 
            dist.k2.unwrap_or(0.0) as f64, 
            dist.k3.unwrap_or(0.0) as f64, 
            0
        ),
        "ptlens" => {
            let a = dist.a.unwrap_or(0.0) as f64;
            let b = dist.b.unwrap_or(0.0) as f64;
            let c = dist.c.unwrap_or(0.0) as f64;
            (a, b, c, 1)
        }
        _ => (0.0, 0.0, 0.0, 0),
    }
}

#[tauri::command]
pub fn get_lensfun_makers(state: State<AppState>) -> Result<Vec<String>, String> {
    if let Some(db) = &*state.lens_db.lock().unwrap() {
        let mut makers: Vec<String> = db
            .lenses
            .iter()
            .map(|lens| lens.get_maker().to_string())
            .collect();
        makers.sort_unstable();
        makers.dedup();
        Ok(makers)
    } else {
        Err("Lens database not loaded".to_string())
    }
}

#[tauri::command]
pub fn get_lensfun_lenses_for_maker(maker: String, state: State<AppState>) -> Result<Vec<String>, String> {
    if let Some(db) = &*state.lens_db.lock().unwrap() {
        let mut models: Vec<String> = db
            .lenses
            .iter()
            .filter(|lens| lens.get_maker() == maker)
            .map(|lens| lens.get_name().to_string())
            .collect();
        models.sort_unstable();
        Ok(models)
    } else {
        Err("Lens database not loaded".to_string())
    }
}

#[tauri::command]
pub fn autodetect_lens(maker: String, model: String, state: State<AppState>) -> Result<Option<(String, String)>, String> {
    let clean_maker = maker.trim().trim_matches('"').to_string();
    let clean_model = model.trim().trim_matches('"').to_string();

    log::info!("Attempting to autodetect lens. Cleaned Maker: '{}', Cleaned Model: '{}'", clean_maker, clean_model);

    if let Some(db) = &*state.lens_db.lock().unwrap() {
        let matcher = fuzzy_matcher::skim::SkimMatcherV2::default().ignore_case();

        log::info!("[Attempt 1] Searching for lenses from maker: '{}'", clean_maker);

        let lenses_from_maker: Vec<_> = db
            .lenses
            .iter()
            .filter(|lens| lens.get_maker().eq_ignore_ascii_case(&clean_maker))
            .collect();

        if !lenses_from_maker.is_empty() {
            let best_match = lenses_from_maker
                .into_iter()
                .filter_map(|lens| matcher.fuzzy_match(lens.get_name(), &clean_model).map(|score| (score, lens)))
                .max_by_key(|(score, _)| *score)
                .map(|(_, lens)| (lens.get_maker().to_string(), lens.get_name().to_string()));

            if best_match.is_some() {
                log::info!("[Attempt 1] Success! Found best match: {:?}", best_match);
                return Ok(best_match);
            }
        }

        log::warn!("[Attempt 1] Failed. Could not find a match for model '{}' from maker '{}'.", clean_model, clean_maker);
        log::info!("[Attempt 2] Falling back to searching model name against ALL lens makers.");

        let best_match_fallback = db
            .lenses
            .iter()
            .filter_map(|lens| {
                matcher.fuzzy_match(lens.get_name(), &clean_model)
                    .map(|score| (score, lens))
            })
            .max_by_key(|(score, _): &(i64, _)| *score)
            .map(|(score, lens)| {
                log::info!("[Attempt 2] Found best fallback match with score {}: '{} {}'", score, lens.get_maker(), lens.get_name());
                (lens.get_maker().to_string(), lens.get_name().to_string())
            });
        
        if best_match_fallback.is_none() {
            log::warn!("[Attempt 2] Fallback failed. No suitable lens found in the entire database.");
        }
        
        Ok(best_match_fallback)

    } else {
        log::warn!("Lens database not loaded. Cannot perform autodetect.");
        Ok(None)
    }
}

#[tauri::command]
pub fn get_lens_distortion_params(maker: String, model: String, focal_length: f32, state: State<AppState>) -> Result<Option<LensDistortionParams>, String> {
    if let Some(db) = &*state.lens_db.lock().unwrap() {
        if let Some(lens) = db.lenses.iter().find(|l| l.get_maker() == maker && l.get_name() == model) {
            if let Some((k1, k2, k3, model)) = lens.get_distortion_params(focal_length) {
                return Ok(Some(LensDistortionParams { k1, k2, k3, model }));
            }
        }
    }
    Ok(None)
}