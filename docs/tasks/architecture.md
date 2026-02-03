# Target Architecture: Svelte PWA + Rust WASM

## High-Level Diagram

```mermaid
graph TD
    User[User] -->|Interacts| UI[Svelte UI (Bun/Vite)]
    UI -->|Reads/Writes| FSA[Browser File System Access API]
    UI -->|Calls| WASM[Rust WebAssembly Module]
    
    subgraph "Rust WASM Core"
        API[wasm-bindgen API]
        ImgProc[Image Processing (image-rs)]
        GPU[GPU Acceleration (wgpu -> WebGPU/WebGL)]
        AI[AI Inference (ort/tract)]
    end

    WASM -->|Computes| GPU
    WASM -->|Inference| AI
```

## Key Components

### 1. Frontend: Svelte 5 + Bun
- **Framework:** Svelte 5 (Runes for reactivity).
- **Bundler:** Vite (via Bun).
- **PWA:** `vite-plugin-pwa` for Service Worker and Manifest.
- **Styling:** Tailwind CSS.

### 2. Backend: Rust (WASM)
- **Compilation Target:** `wasm32-unknown-unknown`.
- **Interop:** `wasm-bindgen` for communicating with JavaScript.
- **Concurrency:** `wasm-bindgen-rayon` (Web Workers) for multi-threaded image processing.
- **GPU:** `wgpu` targeting WebGPU (primary) or WebGL2 (fallback).

### 3. Data Storage & IO
- **Local Files:** File System Access API (`window.showDirectoryPicker`, `FileSystemFileHandle`).
- **Large Files:** Passed to WASM as `Uint8Array` (or `SharedArrayBuffer` for zero-copy if headers permit).
- **Settings:** `localStorage` or `IndexedDB`.

## Data Flow (Example: Load Image)
1. **User** clicks "Open Folder".
2. **Svelte** calls `window.showDirectoryPicker()`.
3. **Svelte** gets `FileSystemDirectoryHandle`.
4. **Svelte** reads a file -> `ArrayBuffer` -> `Uint8Array`.
5. **Svelte** calls `wasm_module.load_image(bytes)`.
6. **Rust** parses image, processes preview.
7. **Rust** returns preview bytes (JPEG/PNG).
8. **Svelte** creates `Blob` URL and displays it.
