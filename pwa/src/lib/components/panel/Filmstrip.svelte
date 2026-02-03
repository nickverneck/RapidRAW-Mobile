<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { LibraryImage } from '$lib/types/library';

	export let images: LibraryImage[] = [];
	export let selectedId: string | null = null;
	export let height = 120;

	const dispatch = createEventDispatcher<{ select: { image: LibraryImage } }>();

	$: thumbSize = Math.max(56, height - 24);

	function handleSelect(image: LibraryImage) {
		dispatch('select', { image });
	}
</script>

<div
	class="flex h-full w-full items-center gap-2 overflow-x-auto rounded-lg border border-border-color/60 bg-bg-secondary px-2 py-2"
>
	{#if images.length === 0}
		<div class="flex w-full items-center justify-center text-xs text-text-secondary">
			No images loaded.
		</div>
	{:else}
		{#each images as image (image.id)}
			<button
				class={`relative flex-shrink-0 overflow-hidden rounded-md border transition ${
					selectedId === image.id
						? 'border-accent shadow-[0_0_0_1px_var(--rr-accent)]'
						: 'border-border-color hover:border-accent/60'
				}`}
				style={`width: ${thumbSize}px; height: ${thumbSize}px;`}
				on:click={() => handleSelect(image)}
				title={image.name}
			>
				{#if image.thumbUrl}
					<img
						src={image.thumbUrl}
						alt={image.name}
						class="h-full w-full object-cover"
						loading="lazy"
						decoding="async"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center text-xs text-text-secondary">
						{image.status === 'loading' ? 'Loading' : '—'}
					</div>
				{/if}
			</button>
		{/each}
	{/if}
</div>
