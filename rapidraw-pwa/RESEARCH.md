# Research: Rust RAW Image Decoding for WebAssembly

This document outlines the findings of research into Rust libraries suitable for decoding RAW camera image files within a WebAssembly (WASM) environment for the RapidRAW PWA.

## Key Requirements

-   **WASM Compatibility:** The library must be compilable to WASM to run in the browser.
-   **RAW Format Support:** The library should support a wide range of RAW formats from different camera manufacturers (e.g., CR2, NEF, ARW, DNG).
-   **Performance:** The library should be performant enough for a good user experience in a web application.
-   **Pure Rust:** A pure Rust implementation is highly preferred to avoid C/C++ dependencies that complicate the WASM build process.

## Top Candidates

### 1. `quickraw`

`quickraw` appears to be an excellent choice for this project, primarily due to its explicit support for WebAssembly.

*   **Pros:**
    *   **Explicit WASM Support:** The library lists `wasm-bindgen` as an optional dependency and includes a build script for WASM, indicating it's designed with WASM in mind.
    *   **Pure Rust:** No external C/C++ dependencies, which simplifies the build process.
    *   **Performance-focused:** Uses integer arithmetic for faster processing, which is a significant advantage in a resource-constrained environment like a web browser.

*   **Cons:**
    *   **Potential Precision Loss:** The use of integer arithmetic might lead to a minor loss of precision compared to floating-point calculations. This is a trade-off for speed.
    *   **Newer Library:** It might not be as mature or have as wide a user base as `rawloader`.

### 2. `rawloader`

`rawloader` is a more established and comprehensive library for RAW file processing in Rust.

*   **Pros:**
    *   **Extensive Format Support:** It supports a very wide variety of camera RAW formats.
    *   **Mature and Well-regarded:** It is a popular choice in the Rust ecosystem for RAW processing.
    *   **Pure Rust:** No C/C++ dependencies, making it a strong candidate for WASM compilation.

*   **Cons:**
    *   **No Explicit WASM Documentation:** While it's likely to be WASM-compatible due to being pure Rust, it's not explicitly documented. This means some configuration and testing will be required to get it working with `wasm-bindgen`.

## Complementary Libraries

### `photon`

`photon` is a high-performance image processing library built specifically for WebAssembly. It is not a RAW decoder, but it would be an excellent choice for post-decoding image manipulation.

*   **Pros:**
    *   **Designed for WASM:** Optimized for in-browser image processing.
    *   **Rich Feature Set:** Offers a wide range of image manipulation functions (e.g., filters, effects, color adjustments).

*   **Cons:**
    *   **Not a RAW Decoder:** It cannot open RAW files directly. It would need to be used in conjunction with a library like `quickraw` or `rawloader`.

### `image` crate

The `image` crate is the de-facto standard for general image processing in Rust.

*   **Pros:**
    *   **WASM Compatible:** It can be compiled to WASM.
    *   **Widely Used:** It's a foundational crate in the Rust image processing ecosystem.

*   **Cons:**
    *   **Limited RAW Support:** It does not have native support for most proprietary RAW formats. It can handle DNG and some other open formats, but for broad camera support, a specialized library is necessary.

## Recommendation

For the RapidRAW PWA, the recommended approach is to **start with `quickraw`**. Its explicit WASM support and focus on performance make it the most direct path to implementing RAW decoding in the browser.

If `quickraw`'s format support proves to be insufficient, **`rawloader` is the next best option**. It will likely require more initial setup to get it working in a WASM environment, but its extensive format support is a major advantage.

Once the RAW file is decoded into pixel data, **`photon` can be used for high-performance image adjustments and manipulations** in the browser, leveraging its WASM-first design.

This layered approach will provide a robust and performant solution for RAW image editing in the browser.
