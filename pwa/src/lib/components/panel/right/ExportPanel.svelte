<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ExportSettings } from '$lib/types/editor';

	export let settings: ExportSettings;
	export let disabled = false;

	const dispatch = createEventDispatcher<{
		change: { settings: ExportSettings };
		export: {};
	}>();

	const formatOptions: ExportSettings['format'][] = ['jpg', 'png', 'tiff'];

	function update(patch: Partial<ExportSettings>) {
		dispatch('change', { settings: { ...settings, ...patch } });
	}
</script>

<div class="flex h-full flex-col">
	<div class="border-b border-border-color/60 pb-3">
		<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Export</p>
		<h3 class="text-base font-semibold text-text-primary">Output Settings</h3>
	</div>

	<div class="flex-1 overflow-y-auto pt-3">
		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Format</p>
			<div class="mt-2 flex gap-2">
				{#each formatOptions as option}
					<button
						class={`rounded-md px-2 py-1 text-xs ${
							settings.format === option
								? 'bg-accent text-button-text'
								: 'border border-border-color text-text-secondary hover:text-text-primary'
						}`}
						disabled={disabled}
						on:click={() => update({ format: option })}
					>
						{option.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>

		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Quality</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={50}
					max={100}
					step={1}
					value={settings.quality}
					disabled={disabled || settings.format === 'png'}
					on:input={(event) =>
						update({ quality: Number((event.target as HTMLInputElement).value) })
					}
				/>
				<span class="w-10 text-right">{settings.quality}</span>
			</div>
			{#if settings.format === 'png'}
				<p class="mt-2 text-xs text-text-secondary">PNG uses lossless compression.</p>
			{/if}
		</div>

		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Resize</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={1024}
					max={8192}
					step={256}
					value={settings.maxEdge}
					disabled={disabled}
					on:input={(event) =>
						update({ maxEdge: Number((event.target as HTMLInputElement).value) })
					}
				/>
				<span class="w-12 text-right">{settings.maxEdge}px</span>
			</div>
		</div>

		<div class="rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<label class="flex items-center gap-2 text-xs text-text-secondary">
				<input
					type="checkbox"
					checked={settings.includeMetadata}
					disabled={disabled}
					on:change={(event) =>
						update({ includeMetadata: (event.target as HTMLInputElement).checked })
					}
				/>
				Include metadata
			</label>
		</div>

		<div class="mt-4 flex justify-end">
			<button
				class="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-button-text disabled:opacity-40"
				disabled={disabled}
				on:click={() => dispatch('export', {})}
			>
				Export Preview
			</button>
		</div>
	</div>
</div>
