<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import RightPanelSwitcher from './RightPanelSwitcher.svelte';
	import AdjustmentsPanel from './AdjustmentsPanel.svelte';
	import MetadataPanel from './MetadataPanel.svelte';
	import CropPanel from './CropPanel.svelte';
	import MasksPanel from './MasksPanel.svelte';
	import AIPanel from './AIPanel.svelte';
	import PresetsPanel, { type Preset } from './PresetsPanel.svelte';
	import ExportPanel from './ExportPanel.svelte';
	import type { LibraryImage } from '$lib/types/library';
	import type { PanelId } from '$lib/types/panels';
	import type { Adjustments, CropState, MaskSettings, ExportSettings } from '$lib/types/editor';

	export let activePanel: PanelId = 'adjustments';
	export let selectedImage: LibraryImage | null = null;
	export let adjustments: Adjustments;
	export let crop: CropState;
	export let maskSettings: MaskSettings;
	export let exportSettings: ExportSettings;
	export let presets: Preset[] = [];
	export let metadata: Record<string, unknown> | null = null;
	export let isMetadataLoading = false;
	export let metadataError = '';

	const disabled = !selectedImage;

	const dispatch = createEventDispatcher<{
		select: { id: PanelId };
		adjustmentsChange: { adjustments: Adjustments };
		cropChange: { crop: CropState };
		maskChange: { settings: MaskSettings };
		exportChange: { settings: ExportSettings };
		apply: { preset: Preset };
		generate: { target: 'subject' | 'sky' };
		export: {};
	}>();
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex flex-1 gap-3">
		<div class="flex h-full flex-col rounded-lg border border-border-color/60 bg-bg-primary/40 p-1">
			<RightPanelSwitcher {activePanel} on:select={(event) => dispatch('select', event.detail)} />
		</div>
		<div class="flex flex-1 flex-col overflow-hidden rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
			{#if activePanel === 'metadata'}
				<MetadataPanel {selectedImage} {metadata} isLoading={isMetadataLoading} errorMessage={metadataError} />
			{:else if activePanel === 'adjustments'}
				<AdjustmentsPanel
					{adjustments}
					{disabled}
					on:change={(event) => dispatch('adjustmentsChange', event.detail)}
				/>
			{:else if activePanel === 'crop'}
				<CropPanel {crop} {disabled} on:change={(event) => dispatch('cropChange', event.detail)} />
			{:else if activePanel === 'masks'}
				<MasksPanel
					settings={maskSettings}
					{disabled}
					on:change={(event) => dispatch('maskChange', event.detail)}
				/>
			{:else if activePanel === 'presets'}
				<PresetsPanel {presets} {disabled} on:apply={(event) => dispatch('apply', event.detail)} />
			{:else if activePanel === 'ai'}
				<AIPanel
					settings={maskSettings}
					{disabled}
					on:change={(event) => dispatch('maskChange', event.detail)}
					on:generate={(event) => dispatch('generate', event.detail)}
				/>
			{:else if activePanel === 'export'}
				<ExportPanel
					settings={exportSettings}
					{disabled}
					on:change={(event) => dispatch('exportChange', event.detail)}
					on:export={() => dispatch('export', {})}
				/>
			{/if}
		</div>
	</div>
</div>
