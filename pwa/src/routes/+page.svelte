<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import PanelPlaceholder from '$lib/components/layout/PanelPlaceholder.svelte';
	import MainLibrary from '$lib/components/panel/MainLibrary.svelte';
</script>

<svelte:head>
	<title>RapidRAW</title>
</svelte:head>

<AppShell title="RapidRAW">
	<MainLibrary slot="sidebar" imageCount={0} />

	<PanelPlaceholder
		title="Editor"
		subtitle="Select an image to begin"
		body="The main canvas and tool panels will live here."
	>
		<div class="mt-6 flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-color bg-bg-secondary/60">
			<p class="text-sm text-text-secondary">Canvas Preview</p>
		</div>
	</PanelPlaceholder>

	<PanelPlaceholder
		slot="right"
		title="Controls"
		subtitle="Adjustments & presets"
		body="This panel will host exposure, color, curves, and AI tools."
	>
		<div class="mt-4 grid gap-2">
			<div class="rounded-md border border-border-color px-3 py-2 text-sm text-text-secondary">
				Exposure
			</div>
			<div class="rounded-md border border-border-color px-3 py-2 text-sm text-text-secondary">
				Color
			</div>
			<div class="rounded-md border border-border-color px-3 py-2 text-sm text-text-secondary">
				Curves
			</div>
		</div>
	</PanelPlaceholder>

	<div slot="bottom" class="flex w-full items-center justify-between text-sm text-text-secondary">
		<div class="flex items-center gap-4">
			<span>Zoom: 100%</span>
			<span>Rating: —</span>
		</div>
		<div class="flex items-center gap-2">
			<button class="rounded-md border border-border-color px-3 py-2">Copy</button>
			<button class="rounded-md border border-border-color px-3 py-2">Paste</button>
			<button class="rounded-md bg-accent px-3 py-2 text-button-text">Export</button>
		</div>
	</div>
</AppShell>
