<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Adjustments } from '$lib/types/editor';

	export type Preset = {
		id: string;
		name: string;
		description: string;
		adjustments: Partial<Adjustments>;
	};

	export let presets: Preset[] = [];
	export let disabled = false;

	const dispatch = createEventDispatcher<{ apply: { preset: Preset } }>();
</script>

<div class="flex h-full flex-col">
	<div class="border-b border-border-color/60 pb-3">
		<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Presets</p>
		<h3 class="text-base font-semibold text-text-primary">Looks & Styles</h3>
	</div>

	<div class="flex-1 overflow-y-auto pt-3">
		{#if presets.length === 0}
			<p class="text-center text-sm text-text-secondary">No presets available.</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each presets as preset}
					<button
						class="rounded-lg border border-border-color/60 bg-bg-primary/40 px-3 py-2 text-left text-sm text-text-primary hover:border-accent/60 disabled:opacity-40"
						disabled={disabled}
						on:click={() => dispatch('apply', { preset })}
					>
						<p class="text-sm font-semibold">{preset.name}</p>
						<p class="text-xs text-text-secondary">{preset.description}</p>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
