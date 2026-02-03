# Migration Plan: Tauri/React -> Svelte/WASM PWA

## Overview
This document outlines the tasks required to migrate the RapidRAW application from a Tauri (Rust) + React desktop application to a Svelte PWA powered by Rust (WASM) and Bun.

## Phase 1: Project Initialization
- [ ] **Init Svelte Project:** Create a new Svelte project using Bun as the runtime/package manager.
- [ ] **Configure Vite:** Set up Vite with Svelte plugin and WASM support (`vite-plugin-wasm`, `vite-plugin-top-level-await`).
- [ ] **Setup PWA:** Install and configure `vite-plugin-pwa` for offline capabilities, manifest generation, and service worker registration.
- [ ] **Styling Setup:** Install Tailwind CSS and configure it to match the existing design system.

## Phase 2: Rust Backend to WASM Transformation
The existing Rust code in `src-tauri` relies on system-level APIs (`std::fs`, `tokio` threads, `rayon` thread pools). These need to be adapted for the WebAssembly environment.

- [ ] **Dependency Audit:** Analyze `Cargo.toml` to identify crates incompatible with WASM (e.g., `tauri`, `trash`, `wgpu` native features).
- [ ] **Refactor Core Logic:**
    - [ ] Extract pure logic (image processing, math) into a platform-agnostic `core` library.
    - [ ] Abstract File I/O: Create a trait `FileSystem` with implementations for `StdFileSystem` (Desktop) and `WebFileSystem` (WASM).
    - [ ] Abstract Parallelism: Replace direct `rayon`/`tokio` usage with a concurrency abstraction that supports `wasm-bindgen-rayon` (using Web Workers) or single-threaded fallback.
- [ ] **WGPU on Web:** Ensure `wgpu` initialization handles the WebGPU/WebGL backend correctly for the browser.
- [ ] **AI/ONNX on Web:** Investigate `ort` crate WASM support. Alternatively, switch to `onnxruntime-web` on the frontend and pass tensors to Rust, or use a WASM-compatible inference engine (e.g., `tract`).
- [ ] **WASM Bindings:** Create a new `wasm-lib` crate (or feature flag) that exposes functions via `wasm-bindgen`.
    - [ ] `load_image(data: &[u8])`
    - [ ] `apply_adjustments(...)`
    - [ ] `export_image(...)`
- [ ] **Build Pipeline:** Set up `wasm-pack` to compile the Rust code to a WASM binary targetting `web`.

## Phase 3: Frontend Migration (React -> Svelte)
- [ ] **State Management:**
    - [ ] Convert React Contexts (`ContextMenuContext`, etc.) to Svelte Stores (`writable`, `derived`).
    - [ ] specialized hooks (`useHistoryState`) -> Svelte custom stores or classes.
- [ ] **Component Porting:**
    - [ ] Port `src/components/adjustments/*` (Basic, Color, Curves, etc.) to Svelte components.
    - [ ] Port `src/components/modals/*` to Svelte.
    - [ ] Port generic UI components.
- [ ] **Canvas/Interaction:**
    - [ ] Replace `react-konva` with raw Konva (used inside `onMount`) or a Svelte wrapper (e.g., `svelte-konva`).
    - [ ] Migrate `react-zoom-pan-pinch` logic.
- [ ] **Routing:** If applicable, set up client-side routing (or remove if single view).

## Phase 4: File System Integration (PWA)
The browser cannot access `std::fs`. We must use the File System Access API.

- [ ] **File System Access API Adapter:**
    - [ ] Implement `openDirectory` picker.
    - [ ] Implement reading file content into `Uint8Array`.
    - [ ] Implement saving files back to disk.
- [ ] **Virtual File System:** Since Rust expects paths, map browser file handles to virtual paths (e.g., `vfs://image.raw`) and maintain a registry in JS that Rust can call back into (or pass data directly).

## Phase 5: Testing & Optimization
- [ ] **WASM Performance:** specific tests for image processing speed in WASM vs Native.
- [ ] **Memory Management:** Ensure large image buffers are properly allocated/deallocated between JS and WASM to avoid OOM.
- [ ] **PWA Features:** Test installability, offline load, and cache strategies.

