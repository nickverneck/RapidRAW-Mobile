<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import PanelPlaceholder from '$lib/components/layout/PanelPlaceholder.svelte';
	import BottomBar from '$lib/components/panel/BottomBar.svelte';
	import Editor from '$lib/components/panel/Editor.svelte';
	import MainLibrary from '$lib/components/panel/MainLibrary.svelte';
	import type { LibraryImage } from '$lib/types/library';
	import RightPanelSwitcher from '$lib/components/panel/right/RightPanelSwitcher.svelte';
	import { type PanelId } from '$lib/types/panels';

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

	$: isLibraryView = selectedImage === null;
	$: selectedId = selectedImage?.id ?? null;
	$: currentRating = selectedImage ? ratings[selectedImage.id] ?? 0 : 0;
	$: activePanel = isLibraryView ? libraryPanel : editorPanel;

	function handleLibraryList(event: CustomEvent<{ images: LibraryImage[] }>) {
		libraryImages = event.detail.images;
	}

	function handleLibrarySelect(event: CustomEvent<{ image: LibraryImage | null }>) {
		selectedImage = event.detail.image;
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

	function handlePanelSelect(event: CustomEvent<{ id: PanelId }>) {
		if (isLibraryView) {
			libraryPanel = event.detail.id;
		} else {
			editorPanel = event.detail.id;
		}
	}

	const panelCopy: Record<PanelId, { title: string; subtitle: string; body: string; sections: string[] }> = {
		metadata: {
			title: 'Metadata',
			subtitle: 'EXIF, camera, and file details',
			body: 'Inspect capture data, tags, and file metadata.',
			sections: ['Camera', 'Capture Details', 'File Info']
		},
		adjustments: {
			title: 'Adjustments',
			subtitle: 'Exposure, color, and tone',
			body: 'Primary adjustments and tone shaping tools.',
			sections: ['Exposure', 'Color', 'Curves']
		},
		crop: {
			title: 'Crop & Straighten',
			subtitle: 'Framing controls',
			body: 'Crop, rotate, and straighten the image.',
			sections: ['Crop Ratio', 'Rotate', 'Straighten']
		},
		masks: {
			title: 'Masks',
			subtitle: 'Selective adjustments',
			body: 'Create and manage local adjustments.',
			sections: ['Brush', 'Gradients', 'Mask List']
		},
		presets: {
			title: 'Presets',
			subtitle: 'Looks and styles',
			body: 'Apply and manage presets.',
			sections: ['Favorites', 'Recent', 'Library']
		},
		ai: {
			title: 'AI Tools',
			subtitle: 'Smart edits',
			body: 'AI-assisted masks and enhancements.',
			sections: ['Subject', 'Sky', 'Retouch']
		},
		export: {
			title: 'Export',
			subtitle: 'Output settings',
			body: 'Configure export targets and formats.',
			sections: ['Format', 'Sizing', 'Queue']
		}
	};
</script>

<svelte:head>
	<title>RapidRAW</title>
</svelte:head>

<AppShell title="RapidRAW">
	<MainLibrary slot="sidebar" on:list={handleLibraryList} on:select={handleLibrarySelect} />

	<Editor
		{selectedImage}
		{showOriginal}
		{isWaveformVisible}
		{canUndo}
		{canRedo}
		on:back={handleBack}
		on:toggleOriginal={() => (showOriginal = !showOriginal)}
		on:toggleWaveform={() => (isWaveformVisible = !isWaveformVisible)}
		on:toggleFullscreen={() => {}}
		on:undo={() => (canUndo = false)}
		on:redo={() => (canRedo = false)}
	/>

	<PanelPlaceholder
		slot="right"
		title={panelCopy[activePanel].title}
		subtitle={panelCopy[activePanel].subtitle}
		body={panelCopy[activePanel].body}
	>
		<div class="mt-4 flex h-full gap-3">
			<div class="flex h-full flex-col rounded-lg border border-border-color/60 bg-bg-primary/40 p-1">
				<RightPanelSwitcher {activePanel} on:select={handlePanelSelect} />
			</div>
			<div class="flex flex-1 flex-col gap-2">
				{#each panelCopy[activePanel].sections as section}
					<div class="rounded-md border border-border-color px-3 py-2 text-sm text-text-secondary">
						{section}
					</div>
				{/each}
			</div>
		</div>
	</PanelPlaceholder>

	<BottomBar
		slot="bottom"
		images={libraryImages}
		{selectedId}
		rating={currentRating}
		{zoom}
		{isLibraryView}
		filmstripVisible={filmstripVisible}
		on:select={handleFilmstripSelect}
		on:rate={handleRate}
		on:zoom={handleZoom}
		on:toggleFilmstrip={() => (filmstripVisible = !filmstripVisible)}
	/>
</AppShell>
