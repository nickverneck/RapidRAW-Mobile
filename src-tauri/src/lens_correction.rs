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
    #[serde(rename = "@real-focal")]
    pub real_focal: Option<f32>,
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
pub struct Tca {
    #[serde(rename = "@model")]
    pub model: String,
    #[serde(rename = "@focal")]
    pub focal: f32,
    #[serde(rename = "@vr")]
    pub vr: Option<f32>,
    #[serde(rename = "@vb")]
    pub vb: Option<f32>,
    #[serde(rename = "@cr")]
    pub cr: Option<f32>,
    #[serde(rename = "@cb")]
    pub cb: Option<f32>,
    #[serde(rename = "@br")]
    pub br: Option<f32>,
    #[serde(rename = "@bb")]
    pub bb: Option<f32>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct Vignetting {
    #[serde(rename = "@model")]
    pub model: String,
    #[serde(rename = "@focal")]
    pub focal: f32,
    #[serde(rename = "@aperture")]
    pub aperture: f32,
    #[serde(rename = "@distance")]
    pub distance: Option<f32>,
    #[serde(rename = "@k1")]
    pub k1: Option<f32>,
    #[serde(rename = "@k2")]
    pub k2: Option<f32>,
    #[serde(rename = "@k3")]
    pub k3: Option<f32>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum CalibrationElement {
    Distortion(Distortion),
    Tca(Tca),
    Vignetting(Vignetting),
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct Calibration {
    #[serde(rename = "$value", default)]
    pub elements: Vec<CalibrationElement>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct Focal {
    #[serde(rename = "@value")]
    pub value: Option<f32>,
    #[serde(rename = "@min")]
    pub min: Option<f32>,
    #[serde(rename = "@max")]
    pub max: Option<f32>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct Aperture {
    #[serde(rename = "@min")]
    pub min: Option<f32>,
    #[serde(rename = "@max")]
    pub max: Option<f32>,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub struct Lens {
    #[serde(default)]
    pub maker: Vec<MultiName>,
    #[serde(default)]
    pub model: Vec<MultiName>,
    #[serde(default)]
    pub mount: Vec<String>,
    pub cropfactor: Option<f32>,
    pub calibration: Option<Calibration>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub focal: Option<Focal>,
    pub aspect_ratio: Option<String>,
    pub center: Option<String>,
    pub compat: Option<String>,
    pub notes: Option<String>,
    pub aperture: Option<Aperture>,
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
    tca_vr: f64,
    tca_vb: f64,
    vig_k1: f64,
    vig_k2: f64,
    vig_k3: f64,
}

impl Lens {
    pub fn get_full_model_name(&self) -> String {
        self.model.iter()
            .find(|m| m.lang.as_deref() == Some("en"))
            .or_else(|| self.model.first())
            .map(|m| m.value.clone())
            .unwrap_or_else(|| "Unknown Model".to_string())
    }

    pub fn get_name(&self) -> String {
        let raw_name = self.get_full_model_name();
        let maker = self.get_maker();

        if raw_name.to_lowercase().starts_with(&maker.to_lowercase()) {
            let stripped = raw_name[maker.len()..].trim();
            if !stripped.is_empty() {
                return stripped.to_string();
            }
        }

        raw_name
    }

    pub fn get_maker(&self) -> String {
        self.maker.iter()
            .find(|m| m.lang.as_deref() == Some("en"))
            .or_else(|| self.maker.first())
            .map(|m| m.value.clone())
            .unwrap_or_else(|| "Misc".to_string())
    }

    pub fn get_distortion_params(&self, focal_length: f32, aperture: Option<f32>, distance: Option<f32>) -> Option<LensDistortionParams> {
        let cal = self.calibration.as_ref()?;

        let mut distortions: Vec<Distortion> = cal.elements.iter()
            .filter_map(|e| if let CalibrationElement::Distortion(d) = e { Some(d.clone()) } else { None })
            .collect();

        let mut tcas: Vec<Tca> = cal.elements.iter()
            .filter_map(|e| if let CalibrationElement::Tca(t) = e { Some(t.clone()) } else { None })
            .collect();

        let mut vignettings: Vec<Vignetting> = cal.elements.iter()
            .filter_map(|e| if let CalibrationElement::Vignetting(v) = e { Some(v.clone()) } else { None })
            .collect();

        let (k1, k2, k3, model) = if distortions.is_empty() {
            (0.0, 0.0, 0.0, 0)
        } else {
            distortions.sort_by(|a, b| a.focal.partial_cmp(&b.focal).unwrap());
            
            if let Some(exact) = distortions.iter().find(|d| (d.focal - focal_length).abs() < 1e-5) {
                extract_dist_params(exact)
            } else if focal_length < distortions[0].focal {
                extract_dist_params(&distortions[0])
            } else if focal_length > distortions.last().unwrap().focal {
                extract_dist_params(distortions.last().unwrap())
            } else {
                let mut res = (0.0, 0.0, 0.0, 0);
                for i in 0..distortions.len() - 1 {
                    let d1 = &distortions[i];
                    let d2 = &distortions[i + 1];

                    if focal_length >= d1.focal && focal_length <= d2.focal {
                        let p1 = extract_dist_params(d1);
                        let p2 = extract_dist_params(d2);

                        let range = d2.focal - d1.focal;
                        if range.abs() < 1e-5 || p1.3 != p2.3 {
                            res = p1;
                        } else {
                            let t = (focal_length - d1.focal) / range;
                            res = (
                                p1.0 + t as f64 * (p2.0 - p1.0),
                                p1.1 + t as f64 * (p2.1 - p1.1),
                                p1.2 + t as f64 * (p2.2 - p1.2),
                                p1.3
                            );
                        }
                        break;
                    }
                }
                res
            }
        };

        let (tca_vr, tca_vb) = if tcas.is_empty() {
            (1.0, 1.0)
        } else {
             tcas.sort_by(|a, b| a.focal.partial_cmp(&b.focal).unwrap());
             
             if let Some(exact) = tcas.iter().find(|d| (d.focal - focal_length).abs() < 1e-5) {
                 extract_tca_params(exact)
             } else if focal_length < tcas[0].focal {
                 extract_tca_params(&tcas[0])
             } else if focal_length > tcas.last().unwrap().focal {
                 extract_tca_params(tcas.last().unwrap())
             } else {
                 let mut res = (1.0, 1.0);
                 for i in 0..tcas.len() - 1 {
                     let d1 = &tcas[i];
                     let d2 = &tcas[i + 1];
                     if focal_length >= d1.focal && focal_length <= d2.focal {
                         let p1 = extract_tca_params(d1);
                         let p2 = extract_tca_params(d2);

                         let range = d2.focal - d1.focal;
                         if range.abs() < 1e-5 {
                             res = p1;
                         } else {
                             let t = (focal_length - d1.focal) / range;
                             res = (
                                 p1.0 + t as f64 * (p2.0 - p1.0),
                                 p1.1 + t as f64 * (p2.1 - p1.1)
                             );
                         }
                         break;
                     }
                 }
                 res
             }
        };

        let (vig_k1, vig_k2, vig_k3) = if vignettings.is_empty() {
            (0.0, 0.0, 0.0)
        } else {
            let target_aperture = aperture.unwrap_or(3.5);
            let target_distance = distance.unwrap_or(1000.0);

            vignettings.sort_by(|a, b| a.focal.partial_cmp(&b.focal).unwrap());

            let find_best_vig = |items: &[Vignetting]| -> (f64, f64, f64) {
                 let best_aperture_item = items.iter().min_by(|a, b| {
                     (a.aperture - target_aperture).abs().partial_cmp(&(b.aperture - target_aperture).abs()).unwrap()
                 });
                 if let Some(best_ap) = best_aperture_item {
                    let candidates: Vec<&Vignetting> = items.iter().filter(|x| (x.aperture - best_ap.aperture).abs() < 0.01).collect();
                    let best_dist = candidates.into_iter().min_by(|a, b| {
                         let da = a.distance.unwrap_or(1000.0);
                         let db = b.distance.unwrap_or(1000.0);
                         (da - target_distance).abs().partial_cmp(&(db - target_distance).abs()).unwrap()
                    });
                    extract_vig_params(best_dist.unwrap_or(best_ap))
                 } else { (0.0, 0.0, 0.0) }
            };

            if focal_length <= vignettings[0].focal + 0.01 {
                let group: Vec<Vignetting> = vignettings.iter().filter(|x| (x.focal - vignettings[0].focal).abs() < 0.01).cloned().collect();
                find_best_vig(&group)
            } else if focal_length >= vignettings.last().unwrap().focal - 0.01 {
                let last_focal = vignettings.last().unwrap().focal;
                let group: Vec<Vignetting> = vignettings.iter().filter(|x| (x.focal - last_focal).abs() < 0.01).cloned().collect();
                find_best_vig(&group)
            } else {
                let mut res = (0.0, 0.0, 0.0);
                for i in 0..vignettings.len() - 1 {
                    let d1 = &vignettings[i];
                    let d2 = &vignettings[i+1];
                    if (d1.focal - d2.focal).abs() < 0.01 { continue; }

                    if focal_length >= d1.focal && focal_length <= d2.focal {
                        let group1: Vec<Vignetting> = vignettings.iter().filter(|x| (x.focal - d1.focal).abs() < 0.01).cloned().collect();
                        let group2: Vec<Vignetting> = vignettings.iter().filter(|x| (x.focal - d2.focal).abs() < 0.01).cloned().collect();

                        let p1 = find_best_vig(&group1);
                        let p2 = find_best_vig(&group2);

                        let range = d2.focal - d1.focal;
                        if range.abs() > 0.01 {
                            let t = (focal_length - d1.focal) / range;
                             res = (
                                p1.0 + t as f64 * (p2.0 - p1.0),
                                p1.1 + t as f64 * (p2.1 - p1.1),
                                p1.2 + t as f64 * (p2.2 - p1.2),
                            );
                        } else {
                            res = p1;
                        }
                        break;
                    }
                }
                res
            }
        };

        Some(LensDistortionParams {
            k1, k2, k3, model,
            tca_vr, tca_vb,
            vig_k1, vig_k2, vig_k3
        })
    }
}

fn extract_dist_params(dist: &Distortion) -> (f64, f64, f64, u32) {
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

fn extract_tca_params(tca: &Tca) -> (f64, f64) {
    (tca.vr.unwrap_or(1.0) as f64, tca.vb.unwrap_or(1.0) as f64)
}

fn extract_vig_params(vig: &Vignetting) -> (f64, f64, f64) {
    (
        vig.k1.unwrap_or(0.0) as f64,
        vig.k2.unwrap_or(0.0) as f64,
        vig.k3.unwrap_or(0.0) as f64,
    )
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
        log::info!("Processing file: {:?}", path);
        match fs::read_to_string(path) {
            Ok(xml_content) => {
                match quick_xml::de::from_str::<LensDatabase>(&xml_content) {
                    Ok(mut db) => {
                        combined_db.cameras.append(&mut db.cameras);
                        combined_db.lenses.append(&mut db.lenses);
                    }
                    Err(e) => {
                        eprintln!("\n\n[FATAL PARSE ERROR] Failed to parse Lensfun XML file {:?}: {}\n\n", path, e);
                        log::error!("Failed to parse Lensfun XML file {:?}: {}", path, e);
                    },
                }
            }
            Err(e) => log::error!("Failed to read Lensfun XML file {:?}: {}", path, e),
        }
    }

    log::info!("Loaded {} lenses and {} cameras from Lensfun database.", combined_db.lenses.len(), combined_db.cameras.len());
    combined_db
}

#[tauri::command]
pub fn get_lensfun_makers(state: State<AppState>) -> Result<Vec<String>, String> {
    if let Some(db) = &*state.lens_db.lock().unwrap() {
        let mut makers: Vec<String> = db
            .lenses
            .iter()
            .map(|lens| lens.get_maker())
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
            .map(|lens| lens.get_name())
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
                .filter_map(|lens| {
                    let lens_name = lens.get_full_model_name(); 
                    matcher.fuzzy_match(&lens_name, &clean_model).map(|score| {
                        let length_penalty = (lens_name.len() as i64 - clean_model.len() as i64).max(0) / 2;
                        let adjusted_score = score - length_penalty;
                        (adjusted_score, lens)
                    })
                })
                .max_by_key(|(score, _)| *score)
                .map(|(_, lens)| (lens.get_maker(), lens.get_name()));

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
                matcher.fuzzy_match(&lens.get_full_model_name(), &clean_model)
                    .map(|score| (score, lens))
            })
            .max_by_key(|(score, _): &(i64, _)| *score)
            .map(|(score, lens)| {
                log::info!("[Attempt 2] Found best fallback match with score {}: '{} {}'", score, lens.get_maker(), lens.get_name());
                (lens.get_maker(), lens.get_name())
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
pub fn get_lens_distortion_params(
    maker: String, 
    model: String, 
    focal_length: f32, 
    aperture: Option<f32>, 
    distance: Option<f32>, 
    state: State<AppState>
) -> Result<Option<LensDistortionParams>, String> {
    if let Some(db) = &*state.lens_db.lock().unwrap() {
        if let Some(lens) = db.lenses.iter().find(|l| l.get_maker() == maker && l.get_name() == model) {
            return Ok(lens.get_distortion_params(focal_length, aperture, distance));
        }
    }
    Ok(None)
}