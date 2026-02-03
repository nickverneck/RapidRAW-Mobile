<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Filmstrip from './Filmstrip.svelte';
	import type { LibraryImage } from '$lib/types/library';

	export let images: LibraryImage[] = [];
	export let selectedId: string | null = null;
	export let rating = 0;
	export let zoom = 1;
	export let isLibraryView = false;
	export let isLoading = false;
	export let filmstripVisible = true;
	export let filmstripHeight = 120;
	export let isCopied = false;
	export let isPasted = false;
	export let isCopyDisabled = false;
	export let isPasteDisabled = false;
	export let isExportDisabled = false;
	export let isResetDisabled = false;

	const dispatch = createEventDispatcher<{
		select: { image: LibraryImage };
		rate: { rating: number };
		zoom: { value: number; fit: boolean };
		toggleFilmstrip: {};
		copy: {};
		paste: {};
		settings: {};
		reset: {};
		export: {};
	}>();

	const ratingSteps = [1, 2, 3, 4, 5];

	$: displayZoom = zoom > 0 ? Math.round(zoom * 100) : 100;

	function handleRate(value: number) {
		dispatch('rate', { rating: value === rating ? 0 : value });
	}

	function handleZoomInput(event: Event) {
		const value = Number((event.target as HTMLInputElement).value);
		if (Number.isFinite(value)) {
			dispatch('zoom', { value, fit: false });
		}
	}

	function handleResetZoom() {
		dispatch('zoom', { value: 0, fit: true });
	}
</script>

<div class="flex-shrink-0 rounded-lg bg-bg-secondary">
	{#if !isLibraryView}
		<div
			class={`overflow-hidden ${filmstripVisible ? 'transition-all duration-300 ease-in-out' : ''}`}
			style={`height: ${filmstripVisible ? filmstripHeight : 0}px;`}
		>
			<div class="w-full p-2" style={`height: ${filmstripHeight}px;`}>
				<Filmstrip
					{images}
					{selectedId}
					height={filmstripHeight - 16}
					on:select={(event) => dispatch('select', event.detail)}
				/>
			</div>
		</div>
	{/if}

	<div
		class={`flex h-10 items-center justify-between px-3 ${
			!isLibraryView ? 'border-t border-transparent' : ''
		}`}
	>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-1">
				{#each ratingSteps as value}
					<button
						class={`rounded px-1 text-xs ${
							value <= rating
								? 'bg-accent text-button-text'
								: 'text-text-secondary hover:text-text-primary'
						}`}
						disabled={isLibraryView ? false : false}
						on:click={() => handleRate(value)}
						title={`Rate ${value}`}
					>
						{value}
					</button>
				{/each}
			</div>
			<div class="h-5 w-px bg-surface"></div>
			<div class="flex items-center gap-2">
				<button
					class="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text-primary disabled:opacity-40"
					disabled={isCopyDisabled}
					on:click={() => dispatch('copy', {})}
				>
					{isCopied ? 'Copied' : 'Copy'}
				</button>
				<button
					class="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text-primary disabled:opacity-40"
					disabled={isPasteDisabled}
					on:click={() => dispatch('paste', {})}
				>
					{isPasted ? 'Pasted' : 'Paste'}
				</button>
				<button
					class="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text-primary"
					on:click={() => dispatch('settings', {})}
				>
					Settings
				</button>
			</div>
		</div>
		<div class="flex-grow" />
		{#if isLibraryView}
			<div class="flex items-center gap-2">
				<button
					class="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text-primary disabled:opacity-40"
					disabled={isResetDisabled}
					on:click={() => dispatch('reset', {})}
				>
					Reset
				</button>
				<button
					class="rounded-md bg-accent px-2 py-1 text-xs text-button-text disabled:opacity-40"
					disabled={isExportDisabled}
					on:click={() => dispatch('export', {})}
				>
					Export
				</button>
			</div>
		{:else}
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<button
						class="rounded-md px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
						on:click={handleResetZoom}
					>
						Zoom
					</button>
					<div class="relative h-5 w-32">
						<div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-surface" />
						<input
							class="slider-input absolute top-1/2 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent"
							type="range"
							min={0.1}
							max={2.0}
							step={0.05}
							value={zoom === 0 ? 1 : zoom}
							on:input={handleZoomInput}
						/>
					</div>
					<span class="w-10 text-right text-xs text-text-secondary">{displayZoom}%</span>
				</div>
				<div class="h-5 w-px bg-surface"></div>
				<button
					class="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface hover:text-text-primary"
					on:click={() => dispatch('toggleFilmstrip', {})}
				>
					{filmstripVisible ? 'Hide' : 'Show'} Filmstrip
				</button>
			</div>
		{/if}
	</div>
</div>
