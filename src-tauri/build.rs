use std::env;
use std::fs;
use std::io;
use std::path::Path;

fn are_files_different(path1: &Path, path2: &Path) -> io::Result<bool> {
    let hash1 = hash_file(path1)?;
    let hash2 = hash_file(path2)?;
    Ok(hash1 != hash2)
}

fn hash_file(path: &Path) -> io::Result<String> {
    use sha2::{Digest, Sha256};
    if !path.exists() {
        return Ok("".to_string());
    }
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    io::copy(&mut file, &mut hasher)?;
    let hash = hasher.finalize();
    let hex_hash = format!("{:x}", hash);
    Ok(hex_hash)
}

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let cargo_target_dir = Path::new(&out_dir)
        .ancestors()
        .nth(3)
        .unwrap();

    let lib_name = {
        #[cfg(target_os = "windows")] { "onnxruntime.dll" }
        #[cfg(target_os = "linux")] { "libonnxruntime.so" }
        #[cfg(target_os = "macos")] { "libonnxruntime.dylib" }
    };

    let source_path = cargo_target_dir.join(lib_name);
    let resources_dir = Path::new("resources");
    fs::create_dir_all(&resources_dir).unwrap();
    let dest_path = resources_dir.join(lib_name);

    if source_path.exists() {
        let should_copy = !dest_path.exists() || are_files_different(&source_path, &dest_path).unwrap_or(true);

        if should_copy {
            println!("cargo:warning=Found ONNX Runtime library at: {}", source_path.display());
            fs::copy(&source_path, &dest_path).unwrap();
            println!("cargo:warning=Copied/Updated ONNX Runtime library to: {}", dest_path.display());
        } else {
            println!("cargo:warning=ONNX Runtime library already up-to-date in resources directory.");
        }
    } else {
        println!("cargo:warning=Could not find ONNX Runtime library at: {}. It might be copied on a subsequent build.", source_path.display());
    }

    tauri_build::build()
}
