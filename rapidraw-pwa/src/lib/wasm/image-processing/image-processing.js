// Fallback implementation for image-processing
export function init() {
  console.warn('WebAssembly module image-processing not available, using JavaScript fallback');
  return Promise.resolve();
}

export default {
  init,
  // Add other expected exports here
  process_image: () => Promise.resolve(new ArrayBuffer(0)),
  get_histogram: () => Promise.resolve([]),
  apply_adjustments: () => Promise.resolve(new ArrayBuffer(0))
};
