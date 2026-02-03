<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { LibraryImage } from '$lib/types/library';
	import EditorToolbar from './editor/EditorToolbar.svelte';

	export let selectedImage: LibraryImage | null = null;
	export let isLoading = false;
	export let showOriginal = false;
	export let isWaveformVisible = false;
	export let canUndo = false;
	export let canRedo = false;

	const dispatch = createEventDispatcher<{
		back: {};
		toggleOriginal: {};
		toggleWaveform: {};
		toggleFullscreen: {};
		undo: {};
		redo: {};
	}>();

	$: detail = selectedImage ? `${Math.round(selectedImage.size / 1024)} KB` : '';
</script>

<div class="flex h-full flex-col">
	<EditorToolbar
		fileName={selectedImage ? selectedImage.name : 'No image selected'}
		{detail}
		{isLoading}
		{showOriginal}
		{isWaveformVisible}
		{canUndo}
		{canRedo}
		on:back={() => dispatch('back', {})}
		on:toggleOriginal={() => dispatch('toggleOriginal', {})}
		on:toggleWaveform={() => dispatch('toggleWaveform', {})}
		on:toggleFullscreen={() => dispatch('toggleFullscreen', {})}
		on:undo={() => dispatch('undo', {})}
		on:redo={() => dispatch('redo', {})}
	/>

	<div class="flex-1 overflow-hidden p-4">
		<div class="flex h-full flex-col gap-4 rounded-lg border border-dashed border-border-color/60 bg-bg-secondary/60 p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Editor</p>
					<h2 class="text-lg font-semibold text-text-primary">
						{selectedImage ? selectedImage.name : 'Select an image'}
					</h2>
					<p class="text-xs text-text-secondary">
						{#if selectedImage}
							Preview canvas ready.
						{:else}
							Choose a file from the library to start editing.
						{/if}
					</p>
				</div>
				{#if selectedImage}
					<button
						class="rounded-md border border-border-color px-3 py-2 text-xs text-text-secondary hover:text-text-primary"
						on:click={() => dispatch('back', {})}
					>
						Back to Library
					</button>
				{/if}
			</div>

			<div class="flex-1 overflow-hidden rounded-lg border border-border-color bg-bg-primary/40 p-4">
				{#if selectedImage}
					{#if selectedImage.thumbUrl}
						<div class="flex h-full items-center justify-center">
							<img
								src={selectedImage.thumbUrl}
								alt={selectedImage.name}
								class="max-h-full max-w-full rounded-md border border-border-color object-contain"
							/>
						</div>
					{:else}
						<div class="flex h-full items-center justify-center text-sm text-text-secondary">
							{isLoading ? 'Rendering preview…' : 'Preview unavailable.'}
						</div>
					{/if}
				{:else}
					<div class="flex h-full flex-col items-center justify-center gap-2 text-center text-text-secondary">
						<p class="text-sm">Canvas Preview</p>
						<p class="text-xs">Select an image to begin editing.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
