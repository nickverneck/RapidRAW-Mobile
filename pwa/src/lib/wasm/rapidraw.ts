export type WasmModule = {
	default: () => Promise<void>;
	is_supported_image_file: (path: string) => boolean;
	load_image_preview_png?: (
		data: Uint8Array,
		path: string,
		maxEdge: number,
		use_fast_raw_dev: boolean,
		highlightCompression: number
	) => Uint8Array;
	load_image_preview_with_adjustments_png?: (
		data: Uint8Array,
		path: string,
		maxEdge: number,
		adjustmentsJson: string,
		use_fast_raw_dev: boolean,
		highlightCompression: number
	) => Uint8Array;
	decode_image_preview_png?: (data: Uint8Array, path: string, maxEdge: number) => Uint8Array;
	develop_raw_preview_png?: (
		data: Uint8Array,
		maxEdge: number,
		fastDemosaic: boolean,
		highlightCompression: number
	) => Uint8Array;
	raw_metadata_json?: (data: Uint8Array) => string;
	non_raw_metadata_json?: (data: Uint8Array) => string;
	init_thread_pool?: (threads: number) => Promise<void>;
};

let wasmModulePromise: Promise<WasmModule> | null = null;

export function getWasmModule(): Promise<WasmModule> {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('WASM module is only available in the browser.'));
	}
	if (wasmModulePromise) return wasmModulePromise;
	wasmModulePromise = (async () => {
		const wantsThreads = window.crossOriginIsolated;
		const threadModuleUrl = new URL('/wasm-threads/rapidraw_wasm.js', window.location.origin).toString();
		const singleModuleUrl = new URL('/wasm/rapidraw_wasm.js', window.location.origin).toString();
		const primaryUrl = wantsThreads ? threadModuleUrl : singleModuleUrl;
		const fallbackUrl = wantsThreads ? singleModuleUrl : threadModuleUrl;

		const loadModule = async (url: string) => {
			const mod = await import(/* @vite-ignore */ url);
			await mod.default();
			if (wantsThreads && typeof mod.init_thread_pool === 'function') {
				const threads = Math.min(8, navigator.hardwareConcurrency || 4);
				await mod.init_thread_pool(threads);
			}
			return mod as WasmModule;
		};

		try {
			return await loadModule(primaryUrl);
		} catch (error) {
			return await loadModule(fallbackUrl);
		}
	})();
	return wasmModulePromise;
}
