<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let fileName = 'No image selected';
	export let detail = '';
	export let isLoading = false;
	export let showOriginal = false;
	export let isWaveformVisible = false;
	export let canUndo = false;
	export let canRedo = false;

	const dispatch = createEventDispatcher<{
		back: {};
		undo: {};
		redo: {};
		toggleWaveform: {};
		toggleOriginal: {};
		toggleFullscreen: {};
	}>();
</script>

<div class="flex h-14 items-center justify-between gap-4 px-4">
	<div class="flex items-center gap-2">
		<button
			class="rounded-full bg-surface px-3 py-2 text-xs text-text-primary hover:bg-card-active"
			on:click={() => dispatch('back', {})}
			title="Back to Library"
		>
			Back
		</button>
	</div>

	<div class="flex min-w-0 flex-1 justify-center">
		<div
			class="flex min-w-0 items-center gap-2 rounded-full bg-surface px-4 py-1 text-xs text-text-secondary"
		>
			<span class="truncate text-text-primary">{fileName}</span>
			{#if detail}
				<span class="hidden text-text-secondary sm:inline">• {detail}</span>
			{/if}
			{#if isLoading}
				<span class="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-text-secondary border-t-transparent"></span>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-2">
		<button
			class="rounded-full bg-surface px-3 py-2 text-xs text-text-primary hover:bg-card-active disabled:opacity-40"
			disabled={!canUndo}
			on:click={() => dispatch('undo', {})}
			title="Undo"
		>
			Undo
		</button>
		<button
			class="rounded-full bg-surface px-3 py-2 text-xs text-text-primary hover:bg-card-active disabled:opacity-40"
			disabled={!canRedo}
			on:click={() => dispatch('redo', {})}
			title="Redo"
		>
			Redo
		</button>
		<button
			class={`rounded-full px-3 py-2 text-xs ${
				isWaveformVisible
					? 'bg-accent text-button-text'
					: 'bg-surface text-text-primary hover:bg-card-active'
			}`}
			on:click={() => dispatch('toggleWaveform', {})}
			title="Waveform"
		>
			Wave
		</button>
		<button
			class={`rounded-full px-3 py-2 text-xs ${
				showOriginal
					? 'bg-accent text-button-text'
					: 'bg-surface text-text-primary hover:bg-card-active'
			}`}
			on:click={() => dispatch('toggleOriginal', {})}
			title="Show Original"
		>
			{showOriginal ? 'Edited' : 'Original'}
		</button>
		<button
			class="rounded-full bg-surface px-3 py-2 text-xs text-text-primary hover:bg-card-active"
			on:click={() => dispatch('toggleFullscreen', {})}
			title="Fullscreen"
		>
			Full
		</button>
	</div>
</div>
