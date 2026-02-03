<script lang="ts">
	import { onMount } from 'svelte';

	let wasmStatus = 'Not loaded';
	let wasmVersion = '';
	let wasmError = '';
	let wasmBytes = 0;
	let supportsRaw = false;
	let geometryJson = '';
	let metadataJson = '';

	onMount(async () => {
		try {
			wasmStatus = 'Loading...';
			const wasmModuleUrl = new URL('/wasm/rapidraw_wasm.js', window.location.origin).toString();
			const mod = await import(/* @vite-ignore */ wasmModuleUrl);
			await mod.default();
			wasmVersion = mod.version();
			wasmBytes = mod.load_image(new Uint8Array([1, 2, 3, 4]));
			supportsRaw = mod.is_supported_image_file('sample.nef');
			metadataJson = mod.default_image_metadata_json();
			geometryJson = mod.geometry_from_adjustments(
				JSON.stringify({ transformScale: 110, transformRotate: 2.5 })
			);
			wasmStatus = 'Ready';
		} catch (error) {
			wasmStatus = 'Unavailable';
			wasmError =
				error instanceof Error
					? error.message
					: 'Unknown error loading WASM module.';
		}
	});
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
</main>
