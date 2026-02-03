<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { PANEL_OPTIONS, type PanelId } from '$lib/types/panels';

	export let activePanel: PanelId = 'adjustments';

	const dispatch = createEventDispatcher<{ select: { id: PanelId } }>();
</script>

<div class="flex h-full flex-col gap-1 p-1">
	{#each PANEL_OPTIONS as option}
		<button
			class={`rounded-md px-2 py-2 text-xs transition-colors ${
				activePanel === option.id
					? 'bg-surface text-text-primary'
					: 'text-text-secondary hover:bg-surface hover:text-text-primary'
			}`}
			on:click={() => dispatch('select', { id: option.id })}
			title={option.label}
		>
			{option.label}
		</button>
	{/each}
</div>
