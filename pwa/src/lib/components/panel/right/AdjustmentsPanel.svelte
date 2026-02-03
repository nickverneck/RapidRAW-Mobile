<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Adjustments } from '$lib/types/editor';
	import { DEFAULT_ADJUSTMENTS } from '$lib/types/editor';

	export let adjustments: Adjustments = { ...DEFAULT_ADJUSTMENTS };
	export let disabled = false;

	const dispatch = createEventDispatcher<{ change: { adjustments: Adjustments } }>();

	type SliderItem = { key: keyof Adjustments; label: string; min: number; max: number; step: number };
	const sections: { title: string; items: SliderItem[] }[] = [
		{
			title: 'Basic',
			items: [
				{ key: 'exposure', label: 'Exposure', min: -2, max: 2, step: 0.05 },
				{ key: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.05 },
				{ key: 'highlights', label: 'Highlights', min: -1, max: 1, step: 0.05 },
				{ key: 'shadows', label: 'Shadows', min: -1, max: 1, step: 0.05 }
			]
		},
		{
			title: 'Color',
			items: [
				{ key: 'temperature', label: 'Temperature', min: -1, max: 1, step: 0.05 },
				{ key: 'tint', label: 'Tint', min: -1, max: 1, step: 0.05 },
				{ key: 'vibrance', label: 'Vibrance', min: -1, max: 1, step: 0.05 },
				{ key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.05 }
			]
		},
		{
			title: 'Details',
			items: [
				{ key: 'clarity', label: 'Clarity', min: -1, max: 1, step: 0.05 },
				{ key: 'sharpness', label: 'Sharpness', min: 0, max: 1, step: 0.05 }
			]
		},
		{
			title: 'Effects',
			items: [{ key: 'vignette', label: 'Vignette', min: -1, max: 1, step: 0.05 }]
		}
	];

	function updateValue(key: keyof Adjustments, value: number) {
		dispatch('change', { adjustments: { ...adjustments, [key]: value } });
	}

	function handleReset() {
		dispatch('change', { adjustments: { ...DEFAULT_ADJUSTMENTS } });
	}

	function handleAuto() {
		dispatch('change', {
			adjustments: {
				...adjustments,
				exposure: Math.max(adjustments.exposure, 0.15),
				contrast: Math.max(adjustments.contrast, 0.1),
				highlights: Math.min(adjustments.highlights, -0.1),
				shadows: Math.max(adjustments.shadows, 0.15)
			}
		});
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-border-color/60 pb-3">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Adjustments</p>
			<h3 class="text-base font-semibold text-text-primary">Global Controls</h3>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="rounded-md border border-border-color px-2 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
				disabled={disabled}
				on:click={handleAuto}
			>
				Auto
			</button>
			<button
				class="rounded-md border border-border-color px-2 py-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
				disabled={disabled}
				on:click={handleReset}
			>
				Reset
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto pt-3">
		{#each sections as section}
			<div class="mb-4 rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
				<p class="text-xs font-semibold text-text-primary">{section.title}</p>
				<div class="mt-2 flex flex-col gap-2">
					{#each section.items as item}
						<div class="flex items-center gap-3 text-xs text-text-secondary">
							<span class="w-20">{item.label}</span>
							<input
								class="slider-input flex-1"
								type="range"
								min={item.min}
								max={item.max}
								step={item.step}
								value={adjustments[item.key]}
								disabled={disabled}
								on:input={(event) =>
									updateValue(item.key, Number((event.target as HTMLInputElement).value))
								}
							/>
							<span class="w-12 text-right text-text-secondary">
								{adjustments[item.key].toFixed(2)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
