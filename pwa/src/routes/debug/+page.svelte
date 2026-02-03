<script lang="ts">
	import { onMount } from 'svelte';

	let wasmStatus = 'Not loaded';
	let wasmVersion = '';
	let wasmError = '';
	let wasmBytes = 0;
	let supportsRaw = false;
	let geometryJson = '';
	let metadataJson = '';
	let rawPreviewUrl = '';
	let rawStatus = 'Idle';
	let rawError = '';
	let rawFileName = '';
	let rawEnabled = false;
	let threadStatus = 'Not initialized';
	let rawMetadata: Array<[string, string]> = [];
	let nonRawPreviewUrl = '';
	let nonRawStatus = 'Idle';
	let nonRawError = '';
	let nonRawFileName = '';
	let nonRawMetadata: Array<[string, string]> = [];
	let wasmFlavor = 'single';
	let wasmModule: null | {
		default: () => Promise<void>;
		version: () => string;
		load_image: (data: Uint8Array) => number;
		is_supported_image_file: (path: string) => boolean;
		default_image_metadata_json: () => string;
		geometry_from_adjustments: (json: string) => string;
		init_thread_pool?: (threads: number) => Promise<void>;
		load_image_preview_png?: (
			data: Uint8Array,
			path: string,
			maxEdge: number,
			use_fast_raw_dev: boolean,
			highlightCompression: number
		) => Uint8Array;
		develop_raw_preview_png?: (
			data: Uint8Array,
			maxEdge: number,
			fastDemosaic: boolean,
			highlightCompression: number
		) => Uint8Array;
		raw_metadata_json?: (data: Uint8Array) => string;
		non_raw_metadata_json?: (data: Uint8Array) => string;
		decode_image_preview_png?: (
			data: Uint8Array,
			path: string,
			maxEdge: number
		) => Uint8Array;
	} = null;

	function toMetadataEntries(payload: string | null): Array<[string, string]> {
		if (!payload) return [];
		try {
			const parsed = JSON.parse(payload) as Record<string, string>;
			return Object.entries(parsed).sort(([a], [b]) => a.localeCompare(b));
		} catch {
			return [];
		}
	}

	async function loadWasmModule() {
		if (typeof window === 'undefined') {
			throw new Error('WASM module can only be loaded in the browser.');
		}
		const threadModuleUrl = new URL(
			'/wasm-threads/rapidraw_wasm.js',
			window.location.origin
		).toString();
		const singleModuleUrl = new URL('/wasm/rapidraw_wasm.js', window.location.origin).toString();
		const wantsThreads = window.crossOriginIsolated;
		const primaryUrl = wantsThreads ? threadModuleUrl : singleModuleUrl;
		const fallbackUrl = wantsThreads ? singleModuleUrl : threadModuleUrl;

		try {
			const mod = await import(/* @vite-ignore */ primaryUrl);
			await mod.default();
			wasmFlavor = wantsThreads ? 'threads' : 'single';
			return mod;
		} catch (error) {
			const mod = await import(/* @vite-ignore */ fallbackUrl);
			await mod.default();
			wasmFlavor = wantsThreads ? 'single (fallback)' : 'threads (fallback)';
			return mod;
		}
	}

	onMount(async () => {
		try {
			wasmStatus = 'Loading...';
			wasmModule = await loadWasmModule();
			wasmVersion = wasmModule.version();
			wasmBytes = wasmModule.load_image(new Uint8Array([1, 2, 3, 4]));
			supportsRaw = wasmModule.is_supported_image_file('sample.nef');
			metadataJson = wasmModule.default_image_metadata_json();
			geometryJson = wasmModule.geometry_from_adjustments(
				JSON.stringify({ transformScale: 110, transformRotate: 2.5 })
			);
			rawEnabled =
				typeof wasmModule.raw_metadata_json === 'function' ||
				typeof wasmModule.develop_raw_preview_png === 'function';
			if (typeof wasmModule.init_thread_pool === 'function' && window.crossOriginIsolated) {
				threadStatus = 'Initializing...';
				const threads = Math.max(1, navigator.hardwareConcurrency ?? 4);
				await wasmModule.init_thread_pool(threads);
				threadStatus = `Ready (${threads} threads)`;
			} else if (!window.crossOriginIsolated) {
				threadStatus = 'Unavailable (missing COOP/COEP headers)';
			} else {
				threadStatus = 'Unavailable';
			}
			wasmStatus = 'Ready';
		} catch (error) {
			wasmStatus = 'Unavailable';
			wasmError =
				error instanceof Error
					? error.message
					: 'Unknown error loading WASM module.';
		}
	});

	async function handleRawFile(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target?.files || target.files.length === 0) return;
		rawError = '';
		rawStatus = 'Reading file...';
		const file = target.files[0];
		rawFileName = file.name;

		try {
			const buffer = await file.arrayBuffer();
			rawStatus = 'Decoding RAW...';
			if (!wasmModule) {
				wasmModule = await loadWasmModule();
			}
			if (
				typeof wasmModule.load_image_preview_png !== 'function' &&
				typeof wasmModule.develop_raw_preview_png !== 'function'
			) {
				throw new Error('RAW processing is not enabled in the current WASM build.');
			}
			const pngBytes: Uint8Array =
				typeof wasmModule.load_image_preview_png === 'function'
					? wasmModule.load_image_preview_png(new Uint8Array(buffer), file.name, 2048, true, 1.5)
					: wasmModule.develop_raw_preview_png!(
							new Uint8Array(buffer),
							2048,
							true,
							1.5
						);
			if (typeof wasmModule.raw_metadata_json === 'function') {
				rawMetadata = toMetadataEntries(
					wasmModule.raw_metadata_json(new Uint8Array(buffer))
				);
			} else {
				rawMetadata = [];
			}
			const blob = new Blob([pngBytes], { type: 'image/png' });
			if (rawPreviewUrl) {
				URL.revokeObjectURL(rawPreviewUrl);
			}
			rawPreviewUrl = URL.createObjectURL(blob);
			rawStatus = 'Ready';
		} catch (error) {
			rawStatus = 'Failed';
			rawError = error instanceof Error ? error.message : 'RAW decode failed.';
			rawMetadata = [];
		}
	}

	async function handleNonRawFile(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target?.files || target.files.length === 0) return;
		nonRawError = '';
		nonRawStatus = 'Reading file...';
		const file = target.files[0];
		nonRawFileName = file.name;

		try {
			const buffer = await file.arrayBuffer();
			nonRawStatus = 'Decoding...';
			if (!wasmModule) {
				wasmModule = await loadWasmModule();
			}
			if (
				typeof wasmModule.load_image_preview_png !== 'function' &&
				typeof wasmModule.decode_image_preview_png !== 'function'
			) {
				throw new Error('Non-RAW decoding is not enabled in the current WASM build.');
			}
			const pngBytes: Uint8Array =
				typeof wasmModule.load_image_preview_png === 'function'
					? wasmModule.load_image_preview_png(new Uint8Array(buffer), file.name, 2048, true, 1.5)
					: wasmModule.decode_image_preview_png!(
							new Uint8Array(buffer),
							file.name,
							2048
						);
			if (typeof wasmModule.non_raw_metadata_json === 'function') {
				nonRawMetadata = toMetadataEntries(
					wasmModule.non_raw_metadata_json(new Uint8Array(buffer))
				);
			} else {
				nonRawMetadata = [];
			}
			const blob = new Blob([pngBytes], { type: 'image/png' });
			if (nonRawPreviewUrl) {
				URL.revokeObjectURL(nonRawPreviewUrl);
			}
			nonRawPreviewUrl = URL.createObjectURL(blob);
			nonRawStatus = 'Ready';
		} catch (error) {
			nonRawStatus = 'Failed';
			nonRawError = error instanceof Error ? error.message : 'Decode failed.';
			nonRawMetadata = [];
		}
	}
</script>

<svelte:head>
	<title>RapidRAW PWA</title>
</svelte:head>

<main class="page">
	<header class="hero">
		<p class="eyebrow">RapidRAW</p>
		<h1>RapidRAW PWA</h1>
		<p class="lead">Scaffold ready: PWA + WASM toolchain wired.</p>
	</header>

	<section class="panel">
		<h2>WASM Status</h2>
		<p class="status">{wasmStatus}</p>
		{#if wasmVersion}
			<p class="detail">Version: {wasmVersion}</p>
			<p class="detail">Build: {wasmFlavor}</p>
			<p class="detail">load_image sample bytes: {wasmBytes}</p>
			<p class="detail">supports .nef RAW: {supportsRaw ? 'yes' : 'no'}</p>
			<p class="detail">default metadata: {metadataJson}</p>
			<p class="detail">geometry params: {geometryJson}</p>
		{/if}
		{#if wasmError}
			<p class="error">Error: {wasmError}</p>
			<p class="hint">Run <code>bun run wasm:build</code> to generate the module.</p>
		{/if}
	</section>

	<section class="panel">
		<h2>RAW Preview</h2>
		<p class="detail">RAW processing enabled: {rawEnabled ? 'yes' : 'no'}</p>
		<p class="detail">Thread pool: {threadStatus}</p>
		<input
			type="file"
			accept=".dng,.nef,.cr2,.cr3,.arw,.raf,.orf,.rw2,.srw,.x3f,.pef"
			on:change={handleRawFile}
		/>
		{#if rawFileName}
			<p class="detail">File: {rawFileName}</p>
			<p class="detail">Status: {rawStatus}</p>
		{/if}
		{#if rawError}
			<p class="error">Error: {rawError}</p>
			<p class="hint">Build with <code>bun run wasm:build:raw</code>.</p>
		{/if}
		{#if rawPreviewUrl}
			<img class="preview" src={rawPreviewUrl} alt="RAW preview" />
		{/if}
		{#if rawMetadata.length}
			<div class="metadata">
				{#each rawMetadata as [key, value]}
					<div class="metadata-row">
						<span class="metadata-key">{key}</span>
						<span class="metadata-value">{value}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<section class="panel">
		<h2>Non-RAW Preview</h2>
		<input
			type="file"
			accept=".jpg,.jpeg,.png,.gif,.bmp,.tif,.tiff,.exr,.qoi,.webp"
			on:change={handleNonRawFile}
		/>
		{#if nonRawFileName}
			<p class="detail">File: {nonRawFileName}</p>
			<p class="detail">Status: {nonRawStatus}</p>
		{/if}
		{#if nonRawError}
			<p class="error">Error: {nonRawError}</p>
		{/if}
		{#if nonRawPreviewUrl}
			<img class="preview" src={nonRawPreviewUrl} alt="Non-RAW preview" />
		{/if}
		{#if nonRawMetadata.length}
			<div class="metadata">
				{#each nonRawMetadata as [key, value]}
					<div class="metadata-row">
						<span class="metadata-key">{key}</span>
						<span class="metadata-value">{value}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</main>
