<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MaskSettings } from '$lib/types/editor';
	import { DEFAULT_MASK_SETTINGS } from '$lib/types/editor';

	export let settings: MaskSettings = { ...DEFAULT_MASK_SETTINGS };
	export let disabled = false;

	const dispatch = createEventDispatcher<{ change: { settings: MaskSettings } }>();

	function update(patch: Partial<MaskSettings>) {
		dispatch('change', { settings: { ...settings, ...patch } });
	}
</script>

<div class="flex h-full flex-col">
	<div class="border-b border-border-color/60 pb-3">
		<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Masks</p>
		<h3 class="text-base font-semibold text-text-primary">Local Adjustments</h3>
	</div>

	<div class="flex-1 overflow-y-auto pt-3">
		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Tool</p>
			<div class="mt-2 flex gap-2">
				<button
					class={`rounded-md px-3 py-1 text-xs ${
						settings.tool === 'brush'
							? 'bg-accent text-button-text'
							: 'border border-border-color text-text-secondary hover:text-text-primary'
					}`}
					disabled={disabled}
					on:click={() => update({ tool: 'brush' })}
				>
					Brush
				</button>
				<button
					class={`rounded-md px-3 py-1 text-xs ${
						settings.tool === 'eraser'
							? 'bg-accent text-button-text'
							: 'border border-border-color text-text-secondary hover:text-text-primary'
					}`}
					disabled={disabled}
					on:click={() => update({ tool: 'eraser' })}
				>
					Eraser
				</button>
			</div>
		</div>

		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Brush Size</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={4}
					max={160}
					step={1}
					value={settings.size}
					disabled={disabled}
					on:input={(event) => update({ size: Number((event.target as HTMLInputElement).value) })}
				/>
				<span class="w-10 text-right">{settings.size}</span>
			</div>
		</div>

		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Feather</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={0}
					max={100}
					step={1}
					value={settings.feather}
					disabled={disabled}
					on:input={(event) =>
						update({ feather: Number((event.target as HTMLInputElement).value) })
					}
				/>
				<span class="w-10 text-right">{settings.feather}</span>
			</div>
		</div>

		<div class="rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Opacity</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={0.1}
					max={1}
					step={0.05}
					value={settings.opacity}
					disabled={disabled}
					on:input={(event) =>
						update({ opacity: Number((event.target as HTMLInputElement).value) })
					}
				/>
				<span class="w-10 text-right">{settings.opacity.toFixed(2)}</span>
			</div>
		</div>
	</div>
</div>
