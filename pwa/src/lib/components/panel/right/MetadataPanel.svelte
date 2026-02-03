<script lang="ts">
	import type { LibraryImage } from '$lib/types/library';

	export let selectedImage: LibraryImage | null = null;
	export let metadata: Record<string, unknown> | null = null;
	export let isLoading = false;
	export let errorMessage = '';

	const keyOrder = ['FNumber', 'ExposureTime', 'PhotographicSensitivity', 'ISO', 'FocalLengthIn35mmFilm', 'LensModel'];
	const labelMap: Record<string, string> = {
		FNumber: 'Aperture',
		ExposureTime: 'Shutter Speed',
		PhotographicSensitivity: 'ISO',
		ISO: 'ISO',
		FocalLengthIn35mmFilm: 'Focal Length',
		LensModel: 'Lens'
	};

	function formatTag(tag: string) {
		return tag.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
	}

	function formatValue(value: unknown) {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : '—';
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}
</script>

<div class="flex h-full flex-col">
	<div class="border-b border-border-color/60 pb-3">
		<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Metadata</p>
		<h3 class="text-base font-semibold text-text-primary">Capture Details</h3>
	</div>

	<div class="flex-1 overflow-y-auto pt-3 text-sm text-text-secondary">
		{#if !selectedImage}
			<p class="text-center">No image selected.</p>
		{:else if isLoading}
			<p class="text-center">Loading metadata…</p>
		{:else if errorMessage}
			<p class="text-center text-red-300">{errorMessage}</p>
		{:else}
			<div class="flex flex-col gap-4">
				<div class="rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
					<p class="text-xs font-semibold text-text-primary">File Properties</p>
					<div class="mt-2 grid gap-1 text-xs">
						<div class="flex items-center justify-between">
							<span>Filename</span>
							<span class="text-text-primary">{selectedImage.name}</span>
						</div>
						<div class="flex items-center justify-between">
							<span>Size</span>
							<span class="text-text-primary">{Math.round(selectedImage.size / 1024)} KB</span>
						</div>
						<div class="flex items-center justify-between">
							<span>Modified</span>
							<span class="text-text-primary">
								{new Date(selectedImage.lastModified).toLocaleString()}
							</span>
						</div>
					</div>
				</div>

				{#if metadata}
					<div class="rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
						<p class="text-xs font-semibold text-text-primary">Key Camera Settings</p>
						<div class="mt-2 grid gap-1 text-xs">
							{#each keyOrder as key}
								{#if metadata[key] !== undefined}
									<div class="flex items-center justify-between">
										<span>{labelMap[key] ?? key}</span>
										<span class="text-text-primary">{formatValue(metadata[key])}</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>

					<div class="rounded-lg border border-border-color/60 bg-bg-primary/40 p-3">
						<p class="text-xs font-semibold text-text-primary">All EXIF Entries</p>
						<div class="mt-2 max-h-64 overflow-y-auto text-xs">
							{#each Object.entries(metadata).sort((a, b) => a[0].localeCompare(b[0])) as [key, value]}
								<div class="grid grid-cols-[1fr,1fr] gap-2 border-b border-border-color/30 py-1 last:border-none">
									<span class="truncate">{formatTag(key)}</span>
									<span class="truncate text-text-primary" title={formatValue(value)}>
										{formatValue(value)}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-center text-xs text-text-secondary">No EXIF data found.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
