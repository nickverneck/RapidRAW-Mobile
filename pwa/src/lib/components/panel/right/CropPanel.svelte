<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CropState } from '$lib/types/editor';
	import { DEFAULT_CROP_STATE } from '$lib/types/editor';

	export let crop: CropState = { ...DEFAULT_CROP_STATE };
	export let disabled = false;

	const dispatch = createEventDispatcher<{ change: { crop: CropState } }>();

	const aspectOptions = ['Original', '1:1', '4:3', '3:2', '16:9', 'Free'];

	function update(patch: Partial<CropState>) {
		dispatch('change', { crop: { ...crop, ...patch } });
	}

	function handleReset() {
		dispatch('change', { crop: { ...DEFAULT_CROP_STATE } });
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-border-color/60 pb-3">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Crop</p>
			<h3 class="text-base font-semibold text-text-primary">Frame & Straighten</h3>
		</div>
		<button
			class="rounded-md border border-border-color px-2 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
			disabled={disabled}
			on:click={handleReset}
		>
			Reset
		</button>
	</div>

	<div class="flex-1 overflow-y-auto pt-3">
		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Aspect Ratio</p>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each aspectOptions as option}
					<button
						class={`rounded-md px-2 py-1 text-xs ${
							crop.aspect === option
								? 'bg-accent text-button-text'
								: 'border border-border-color text-text-secondary hover:text-text-primary'
						}`}
						disabled={disabled}
						on:click={() => update({ aspect: option })}
					>
						{option}
					</button>
				{/each}
			</div>
		</div>

		<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Rotate</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={-45}
					max={45}
					step={0.1}
					value={crop.rotate}
					disabled={disabled}
					on:input={(event) => update({ rotate: Number((event.target as HTMLInputElement).value) })}
				/>
				<span class="w-12 text-right">{crop.rotate.toFixed(1)}°</span>
			</div>
		</div>

		<div class="rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			<p class="text-xs font-semibold text-text-primary">Straighten</p>
			<div class="mt-2 flex items-center gap-3 text-xs text-text-secondary">
				<input
					class="slider-input flex-1"
					type="range"
					min={-10}
					max={10}
					step={0.1}
					value={crop.straighten}
					disabled={disabled}
					on:input={(event) =>
						update({ straighten: Number((event.target as HTMLInputElement).value) })
					}
				/>
				<span class="w-12 text-right">{crop.straighten.toFixed(1)}°</span>
			</div>
		</div>
	</div>
</div>
