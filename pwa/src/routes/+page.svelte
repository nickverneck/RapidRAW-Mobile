<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import BottomBar from '$lib/components/panel/BottomBar.svelte';
	import Editor from '$lib/components/panel/Editor.svelte';
	import MainLibrary from '$lib/components/panel/MainLibrary.svelte';
	import type { LibraryImage } from '$lib/types/library';
	import RightPanel from '$lib/components/panel/right/RightPanel.svelte';
	import type { Preset } from '$lib/components/panel/right/PresetsPanel.svelte';
	import { type PanelId } from '$lib/types/panels';
	import {
		DEFAULT_ADJUSTMENTS,
		DEFAULT_CROP_STATE,
		DEFAULT_EXPORT_SETTINGS,
		DEFAULT_MASK_SETTINGS,
		type Adjustments,
		type CropState,
		type ExportSettings,
		type MaskSettings
	} from '$lib/types/editor';
	import { getWasmModule } from '$lib/wasm/rapidraw';
	import { isRawFile } from '$lib/utils/raw';

	let libraryImages: LibraryImage[] = [];
	let selectedImage: LibraryImage | null = null;
	let filmstripVisible = true;
	let zoom = 1;
	let ratings: Record<string, number> = {};
	let showOriginal = false;
	let isWaveformVisible = false;
	let canUndo = false;
	let canRedo = false;
	let editorPanel: PanelId = 'adjustments';
	let libraryPanel: PanelId = 'export';
	let activePanel: PanelId = 'adjustments';
	let adjustments: Adjustments = { ...DEFAULT_ADJUSTMENTS };
	let crop: CropState = { ...DEFAULT_CROP_STATE };
	let maskSettings: MaskSettings = { ...DEFAULT_MASK_SETTINGS };
	let exportSettings: ExportSettings = { ...DEFAULT_EXPORT_SETTINGS };
	let metadata: Record<string, unknown> | null = null;
	let metadataError = '';
	let isMetadataLoading = false;
	let metadataRequestId = 0;
	let previewUrl: string | null = null;
	let isPreviewLoading = false;
	let previewRequestId = 0;
	let previewTimer: number | null = null;
	let libraryPath: string | null = null;
	let viewMode: 'entry' | 'library' | 'editor' = 'entry';

	const presets: Preset[] = [
		{
			id: 'cinematic',
			name: 'Cinematic Warm',
			description: 'Warm highlights with gentle contrast.',
			adjustments: { exposure: 0.15, contrast: 0.2, temperature: 0.25, vibrance: 0.2 }
		},
		{
			id: 'moody',
			name: 'Moody Matte',
			description: 'Lifted shadows with muted color.',
			adjustments: { exposure: -0.1, contrast: -0.05, shadows: 0.35, saturation: -0.2 }
		},
		{
			id: 'bw',
			name: 'B&W Clean',
			description: 'High contrast monochrome.',
			adjustments: { contrast: 0.35, saturation: -1, clarity: 0.2 }
		}
	];

	$: isLibraryView = selectedImage === null;
	$: selectedId = selectedImage?.id ?? null;
	$: currentRating = selectedImage ? ratings[selectedImage.id] ?? 0 : 0;
	$: activePanel = isLibraryView ? libraryPanel : editorPanel;
	$: viewMode = selectedImage ? 'editor' : libraryPath ? 'library' : 'entry';

	function handleLibraryList(event: CustomEvent<{ images: LibraryImage[] }>) {
		libraryImages = event.detail.images;
	}

	function handleLibrarySelect(event: CustomEvent<{ image: LibraryImage | null }>) {
		selectedImage = event.detail.image;
	}

	function handleLibraryStatus(event: CustomEvent<{ activePath: string | null }>) {
		libraryPath = event.detail.activePath;
	}

	function handleBack() {
		selectedImage = null;
	}

	function handleRate(event: CustomEvent<{ rating: number }>) {
		if (!selectedImage) return;
		ratings = { ...ratings, [selectedImage.id]: event.detail.rating };
	}

	function handleZoom(event: CustomEvent<{ value: number; fit: boolean }>) {
		zoom = event.detail.fit ? 0 : event.detail.value;
	}

	function handleFilmstripSelect(event: CustomEvent<{ image: LibraryImage }>) {
		selectedImage = event.detail.image;
	}

	function handlePresetApply(event: CustomEvent<{ preset: Preset }>) {
		adjustments = { ...adjustments, ...event.detail.preset.adjustments };
	}

	function handlePanelSelect(event: CustomEvent<{ id: PanelId }>) {
		if (isLibraryView) {
			libraryPanel = event.detail.id;
		} else {
			editorPanel = event.detail.id;
		}
		activePanel = event.detail.id;
	}

	async function handleExport() {
		if (!selectedImage) return;
		try {
			const file = await selectedImage.handle.getFile();
			const buffer = await file.arrayBuffer();
			const wasm = await getWasmModule();
			const bytes = new Uint8Array(buffer);
			let previewBytes: Uint8Array | undefined;

			if (typeof wasm.load_image_preview_png === 'function') {
				previewBytes = wasm.load_image_preview_png(bytes, selectedImage.name, exportSettings.maxEdge, false, 1.5);
			} else if (typeof wasm.decode_image_preview_png === 'function') {
				previewBytes = wasm.decode_image_preview_png(bytes, selectedImage.name, exportSettings.maxEdge);
			}

			if (!previewBytes && selectedImage.thumbUrl) {
				const link = document.createElement('a');
				link.href = selectedImage.thumbUrl;
				link.download = `${selectedImage.name}-preview.png`;
				link.click();
				return;
			}

			if (previewBytes) {
				const blob = new Blob([previewBytes], { type: 'image/png' });
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${selectedImage.name}-preview.png`;
				link.click();
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error('Export failed', error);
		}
	}

	function clearPreviewUrl() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
	}

	function schedulePreviewRender() {
		if (previewTimer) {
			clearTimeout(previewTimer);
		}
		previewTimer = window.setTimeout(() => {
			void renderPreview();
		}, 150);
	}

	async function renderPreview() {
		if (!selectedImage) {
			clearPreviewUrl();
			return;
		}

		const requestId = ++previewRequestId;
		isPreviewLoading = true;

		try {
			const file = await selectedImage.handle.getFile();
			const buffer = await file.arrayBuffer();
			const wasm = await getWasmModule();
			const bytes = new Uint8Array(buffer);
			const adjustmentsJson = JSON.stringify(showOriginal ? DEFAULT_ADJUSTMENTS : adjustments);

			let previewBytes: Uint8Array | undefined;
			if (typeof wasm.load_image_preview_with_adjustments_png === 'function') {
				previewBytes = wasm.load_image_preview_with_adjustments_png(
					bytes,
					selectedImage.name,
					1440,
					adjustmentsJson,
					true,
					1.5
				);
			} else if (typeof wasm.load_image_preview_png === 'function') {
				previewBytes = wasm.load_image_preview_png(bytes, selectedImage.name, 1440, true, 1.5);
			}

			if (requestId !== previewRequestId || !previewBytes) return;

			const blob = new Blob([previewBytes], { type: 'image/png' });
			const url = URL.createObjectURL(blob);
			clearPreviewUrl();
			previewUrl = url;
		} catch (error) {
			console.error('Preview render failed', error);
		} finally {
			if (requestId === previewRequestId) {
				isPreviewLoading = false;
			}
		}
	}

	async function loadMetadata(image: LibraryImage) {
		if (typeof window === 'undefined') return;
		const requestId = ++metadataRequestId;
		isMetadataLoading = true;
		metadataError = '';
		try {
			const file = await image.handle.getFile();
			const buffer = await file.arrayBuffer();
			const wasm = await getWasmModule();
			const bytes = new Uint8Array(buffer);
			let json = '';
			if (isRawFile(image.name) && typeof wasm.raw_metadata_json === 'function') {
				json = wasm.raw_metadata_json(bytes);
			} else if (typeof wasm.non_raw_metadata_json === 'function') {
				json = wasm.non_raw_metadata_json(bytes);
			}
			if (requestId !== metadataRequestId) return;
			metadata = json ? JSON.parse(json) : {};
		} catch (error) {
			if (requestId !== metadataRequestId) return;
			metadataError = error instanceof Error ? error.message : 'Failed to read metadata.';
			metadata = null;
		} finally {
			if (requestId === metadataRequestId) {
				isMetadataLoading = false;
			}
		}
	}

	$: if (selectedImage) {
		void loadMetadata(selectedImage);
	} else {
		metadata = null;
		metadataError = '';
		isMetadataLoading = false;
		metadataRequestId += 1;
		isPreviewLoading = false;
		previewRequestId += 1;
		if (previewTimer) clearTimeout(previewTimer);
		clearPreviewUrl();
	}

	$: if (selectedImage) {
		adjustments;
		crop;
		maskSettings;
		showOriginal;
		if (typeof window !== 'undefined') {
			schedulePreviewRender();
		}
	}
</script>

<svelte:head>
	<title>RapidRAW</title>
</svelte:head>

<AppShell
	layout={viewMode}
	showRight={viewMode === 'editor'}
	showBottom={viewMode !== 'entry'}
>
	{#if viewMode === 'editor'}
		<Editor
			{selectedImage}
			{previewUrl}
			{showOriginal}
			{isWaveformVisible}
			{canUndo}
			{canRedo}
			{isPreviewLoading}
			on:back={handleBack}
			on:toggleOriginal={() => (showOriginal = !showOriginal)}
			on:toggleWaveform={() => (isWaveformVisible = !isWaveformVisible)}
			on:toggleFullscreen={() => {}}
			on:undo={() => (canUndo = false)}
			on:redo={() => (canRedo = false)}
		/>
	{:else}
		<MainLibrary
			on:list={handleLibraryList}
			on:select={handleLibrarySelect}
			on:status={handleLibraryStatus}
		/>
	{/if}

	<svelte:fragment slot="right">
		{#if viewMode === 'editor'}
			<div class="h-full">
				<RightPanel
					{activePanel}
					{selectedImage}
					{adjustments}
					{crop}
					maskSettings={maskSettings}
					exportSettings={exportSettings}
					{presets}
					{metadata}
					{isMetadataLoading}
					metadataError={metadataError}
					on:select={handlePanelSelect}
					on:adjustmentsChange={(event) => (adjustments = event.detail.adjustments)}
					on:cropChange={(event) => (crop = event.detail.crop)}
					on:maskChange={(event) => (maskSettings = event.detail.settings)}
					on:exportChange={(event) => (exportSettings = event.detail.settings)}
					on:apply={handlePresetApply}
					on:generate={(event) => console.log('AI generate', event.detail)}
					on:export={handleExport}
				/>
			</div>
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="bottom">
		{#if viewMode !== 'entry'}
			<BottomBar
				images={libraryImages}
				{selectedId}
				rating={currentRating}
				{zoom}
				isLibraryView={viewMode === 'library'}
				filmstripVisible={filmstripVisible}
				on:select={handleFilmstripSelect}
				on:rate={handleRate}
				on:zoom={handleZoom}
				on:toggleFilmstrip={() => (filmstripVisible = !filmstripVisible)}
				on:export={handleExport}
			/>
		{/if}
	</svelte:fragment>
</AppShell>
