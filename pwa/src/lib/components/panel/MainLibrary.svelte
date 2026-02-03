<script lang="ts">
	export let activePath: string | null = null;
	export let isIndexing = false;
	export let imageCount = 0;
	export let isLoading = false;

	export let onOpenFolder: () => void = () => {};
	export let onGoHome: () => void = () => {};
	export let onRefresh: () => void = () => {};

	let searchText = '';
	let viewMode: 'grid' | 'list' = 'grid';
	let rawFilter = 'All Types';
	let ratingFilter = 'Show All';
	let sortBy = 'Date';
	let sortDir: 'asc' | 'desc' = 'desc';

	const viewModes = [
		{ id: 'grid', label: 'Grid' },
		{ id: 'list', label: 'List' }
	];
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">Library</p>
			<h2 class="text-lg font-semibold text-text-primary">Main Library</h2>
			<p class="text-xs text-text-secondary">
				{#if activePath}{activePath}{:else}No folder selected{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="rounded-md border border-border-color px-3 py-2 text-xs text-text-secondary"
				on:click={onGoHome}
			>
				Home
			</button>
			<button
				class="rounded-md border border-border-color px-3 py-2 text-xs text-text-secondary"
				on:click={onRefresh}
			>
				Refresh
			</button>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<input
				class="flex-1 rounded-md border border-border-color bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary"
				type="text"
				placeholder="Search by filename, tag, or note"
				bind:value={searchText}
			/>
			<button
				class="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-button-text"
				on:click={onOpenFolder}
			>
				Open Folder
			</button>
		</div>

		<div class="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
			<div class="rounded-md border border-border-color px-2 py-1">
				Rating: {ratingFilter}
			</div>
			<div class="rounded-md border border-border-color px-2 py-1">
				RAW: {rawFilter}
			</div>
			<div class="rounded-md border border-border-color px-2 py-1">
				Sort: {sortBy} ({sortDir})
			</div>
			<div class="ml-auto flex items-center gap-1">
				{#each viewModes as mode}
					<button
						class={`rounded-md px-2 py-1 ${
							viewMode === mode.id
								? 'bg-card-active text-text-primary'
								: 'border border-border-color text-text-secondary'
						}`}
						on:click={() => (viewMode = mode.id as 'grid' | 'list')}
					>
						{mode.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="flex-1 overflow-auto rounded-lg border border-dashed border-border-color/60 p-4">
		{#if isLoading}
			<p class="text-sm text-text-secondary">Loading library…</p>
		{:else if imageCount === 0}
			<div class="flex h-full flex-col items-center justify-center gap-2 text-center">
				<p class="text-sm text-text-secondary">No images loaded yet.</p>
				<p class="text-xs text-text-secondary">
					Use “Open Folder” to start indexing your library.
				</p>
			</div>
		{:else}
			<div class={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'flex flex-col gap-2'}>
				{#each Array(Math.min(imageCount, 6)) as _, index}
					<div class="rounded-md border border-border-color p-3">
						<p class="text-sm text-text-primary">Image {index + 1}</p>
						<p class="text-xs text-text-secondary">Preview placeholder</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-between text-xs text-text-secondary">
		<div>
			{#if isIndexing}
				Indexing library…
			{:else}
				{imageCount} images
			{/if}
		</div>
		<div>Search: {searchText || '—'}</div>
	</div>
</div>
