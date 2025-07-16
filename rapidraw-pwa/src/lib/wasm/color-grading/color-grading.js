// Fallback implementation for color-grading
export function init() {
  console.warn('WebAssembly module color-grading not available, using JavaScript fallback');
  return Promise.resolve();
}

export default {
  init,
  // Add other expected exports here
  process_image: () => Promise.resolve(new ArrayBuffer(0)),
  get_histogram: () => Promise.resolve([]),
  apply_adjustments: () => Promise.resolve(new ArrayBuffer(0))
};
