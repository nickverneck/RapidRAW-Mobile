<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { LibraryImage } from '$lib/types/library';
	import { isRawFile } from '$lib/utils/raw';
	import { getWasmModule } from '$lib/wasm/rapidraw';

	type FileHandle = FileSystemFileHandle;
	type ImageEntry = LibraryImage;

	const dispatch = createEventDispatcher<{
		select: { image: LibraryImage | null };
		list: { images: LibraryImage[] };
	}>();

	let activePath: string | null = null;
	let isIndexing = false;
	let isLoading = false;
	let errorMessage = '';
	let images: Array<ImageEntry> = [];
	let selectedId: string | null = null;
	let directoryHandle: FileSystemDirectoryHandle | null = null;

	let searchText = '';
	let viewMode: 'grid' | 'list' = 'grid';
	let rawFilter = 'All Types';
	let ratingFilter = 'Show All';
	let sortBy: 'Date' | 'Name' | 'Size' = 'Date';
	let sortDir: 'asc' | 'desc' = 'desc';
	let thumbnailSize = 180;

	const viewModes = [
		{ id: 'grid', label: 'Grid' },
		{ id: 'list', label: 'List' }
	];
	const thumbnailOptions = [
		{ label: 'Small', value: 120 },
		{ label: 'Medium', value: 180 },
		{ label: 'Large', value: 240 }
	];


	const MAX_CONCURRENT_PREVIEWS = 3;
	let activePreviewCount = 0;
	const previewQueue: Array<ImageEntry> = [];
	const overscanRows = 2;
	let scrollTop = 0;
	let viewportHeight = 0;
	let viewportWidth = 0;

	// WASM module loader is shared in $lib/wasm/rapidraw.

	function revokePreviewUrls() {
		for (const image of images) {
			if (image.thumbUrl) {
				URL.revokeObjectURL(image.thumbUrl);
			}
		}
	}

	function updateEntry(id: string, patch: Partial<ImageEntry>) {
		images = images.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
	}

	function enqueuePreview(entry: ImageEntry) {
		previewQueue.push(entry);
		void processQueue();
	}

	async function processQueue() {
		if (activePreviewCount >= MAX_CONCURRENT_PREVIEWS) return;
		const next = previewQueue.shift();
		if (!next) return;
		activePreviewCount += 1;
		updateEntry(next.id, { status: 'loading' });
		try {
			const file = await next.handle.getFile();
			const buffer = await file.arrayBuffer();
			const wasm = await getWasmModule();
			const bytes = new Uint8Array(buffer);

			let previewBytes: Uint8Array;
			if (typeof wasm.load_image_preview_png === 'function') {
				previewBytes = wasm.load_image_preview_png(bytes, next.name, 640, true, 1.5);
			} else if (typeof wasm.decode_image_preview_png === 'function') {
				previewBytes = wasm.decode_image_preview_png(bytes, next.name, 640);
			} else if (typeof wasm.develop_raw_preview_png === 'function') {
				previewBytes = wasm.develop_raw_preview_png(bytes, 640, true, 1.5);
			} else {
				throw new Error('WASM preview function not available.');
			}

			const blob = new Blob([previewBytes], { type: 'image/png' });
			const url = URL.createObjectURL(blob);
			updateEntry(next.id, { status: 'ready', thumbUrl: url });
		} catch (error) {
			updateEntry(next.id, {
				status: 'error',
				error: error instanceof Error ? error.message : 'Preview failed'
			});
		} finally {
			activePreviewCount -= 1;
			void processQueue();
		}
	}

	async function scanDirectory(handle: FileSystemDirectoryHandle) {
		errorMessage = '';
		try {
			isIndexing = true;
			isLoading = true;
			previewQueue.length = 0;
			activePreviewCount = 0;
			revokePreviewUrls();
			images = [];
			selectedId = null;
			dispatch('select', { image: null });

			const wasm = await getWasmModule();
			const newImages: Array<ImageEntry> = [];

			for await (const entry of handle.values()) {
				if (entry.kind !== 'file') continue;
				if (!wasm.is_supported_image_file(entry.name)) continue;

				const file = await entry.getFile();
				const imageEntry: ImageEntry = {
					id: crypto.randomUUID(),
					name: entry.name,
					handle: entry,
					size: file.size,
					lastModified: file.lastModified,
					status: 'pending'
				};
				newImages.push(imageEntry);
			}

			images = newImages;
			for (const entry of images) {
				enqueuePreview(entry);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to open folder.';
		} finally {
			isIndexing = false;
			isLoading = false;
		}
	}

	async function openFolder() {
		errorMessage = '';
		if (typeof window === 'undefined' || !(window as any).showDirectoryPicker) {
			errorMessage = 'File System Access API is not available in this browser.';
			return;
		}

		try {
			directoryHandle = await (window as any).showDirectoryPicker();
			activePath = directoryHandle?.name ?? null;
			if (directoryHandle) {
				await scanDirectory(directoryHandle);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to open folder.';
		}
	}

	function resetLibrary() {
		previewQueue.length = 0;
		activePreviewCount = 0;
		revokePreviewUrls();
		images = [];
		activePath = null;
		selectedId = null;
		dispatch('select', { image: null });
	}

	function refreshLibrary() {
		if (directoryHandle) {
			void scanDirectory(directoryHandle);
		}
	}

	const lower = (value: string) => value.toLowerCase();
	const isRawName = (name: string) => isRawFile(name);

	const rawFilterOptions = ['All Types', 'RAW Only', 'Non-RAW Only', 'Prefer RAW'];
	const ratingFilterOptions = ['Show All', '1 & up', '2 & up', '3 & up', '4 & up', '5 only'];
	const sortOptions: Array<'Date' | 'Name' | 'Size'> = ['Date', 'Name', 'Size'];

	$: filteredImages = images.filter((entry) => {
		if (!searchText.trim()) return true;
		return lower(entry.name).includes(lower(searchText));
	});

	$: rawFilteredImages = filteredImages.filter((entry) => {
		if (rawFilter === 'RAW Only') return isRawName(entry.name);
		if (rawFilter === 'Non-RAW Only') return !isRawName(entry.name);
		return true;
	});

	$: sortedImages = [...rawFilteredImages].sort((a, b) => {
		if (rawFilter === 'Prefer RAW') {
			const rawDiff = Number(isRawName(b.name)) - Number(isRawName(a.name));
			if (rawDiff !== 0) return rawDiff;
		}
		let result = 0;
		if (sortBy === 'Name') {
			result = a.name.localeCompare(b.name);
		} else if (sortBy === 'Size') {
			result = a.size - b.size;
		} else {
			result = a.lastModified - b.lastModified;
		}
		return sortDir === 'asc' ? result : -result;
	});

	$: imageCount = images.length;

	$: gridCardWidth = thumbnailSize + 120;
	$: gridCardHeight = thumbnailSize + 72;
	$: listRowHeight = Math.max(72, thumbnailSize + 24);
	$: gap = 12;
	$: columns =
		viewMode === 'grid'
			? Math.max(1, Math.floor((viewportWidth + gap) / (gridCardWidth + gap)))
			: 1;
	$: cardWidth = viewMode === 'grid' ? gridCardWidth : Math.max(1, viewportWidth);
	$: cardHeight = viewMode === 'grid' ? gridCardHeight : listRowHeight;
	$: rowStride = cardHeight + gap;
	$: colStride = cardWidth + gap;
	$: totalRows = Math.ceil(sortedImages.length / columns);
	$: totalHeight = totalRows * rowStride;
	$: startRow = Math.max(0, Math.floor(scrollTop / rowStride) - overscanRows);
	$: endRow = Math.min(
		totalRows,
		Math.ceil((scrollTop + viewportHeight) / rowStride) + overscanRows
	);
	$: startIndex = startRow * columns;
	$: endIndex = Math.min(sortedImages.length, endRow * columns);
	$: visibleImages = sortedImages.slice(startIndex, endIndex);
	$: visibleLayout = visibleImages.map((image, localIndex) => {
		const globalIndex = startIndex + localIndex;
		const row = Math.floor(globalIndex / columns);
		const col = globalIndex % columns;
		return {
			image,
			top: row * rowStride,
			left: viewMode === 'grid' ? col * colStride : 0,
			width: viewMode === 'grid' ? gridCardWidth : cardWidth,
			height: cardHeight
		};
	});

	$: dispatch('list', { images });

	function handleSelect(entry: ImageEntry) {
		selectedId = entry.id;
		dispatch('select', { image: entry });
	}

	function handleScroll(event: Event) {
		scrollTop = (event.currentTarget as HTMLElement).scrollTop;
	}
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
				on:click={resetLibrary}
			>
				Home
			</button>
			<button
				class="rounded-md border border-border-color px-3 py-2 text-xs text-text-secondary"
				on:click={refreshLibrary}
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
				on:click={openFolder}
			>
				Open Folder
			</button>
		</div>

		<div class="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
			<label class="flex items-center gap-2 rounded-md border border-border-color px-2 py-1">
				<span>Rating</span>
				<select
					class="bg-transparent text-xs text-text-secondary"
					bind:value={ratingFilter}
				>
					{#each ratingFilterOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</label>
			<label class="flex items-center gap-2 rounded-md border border-border-color px-2 py-1">
				<span>RAW</span>
				<select class="bg-transparent text-xs text-text-secondary" bind:value={rawFilter}>
					{#each rawFilterOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</label>
			<label class="flex items-center gap-2 rounded-md border border-border-color px-2 py-1">
				<span>Sort</span>
				<select class="bg-transparent text-xs text-text-secondary" bind:value={sortBy}>
					{#each sortOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<button
					class="rounded-md border border-border-color px-2 py-1 text-[10px]"
					on:click={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}
				>
					{sortDir.toUpperCase()}
				</button>
			</label>
			<label class="flex items-center gap-2 rounded-md border border-border-color px-2 py-1">
				<span>Thumb</span>
				<select
					class="bg-transparent text-xs text-text-secondary"
					on:change={(event) => {
						const value = Number((event.target as HTMLSelectElement).value);
						thumbnailSize = Number.isFinite(value) ? value : thumbnailSize;
					}}
				>
					{#each thumbnailOptions as option}
						<option value={option.value} selected={option.value === thumbnailSize}>
							{option.label}
						</option>
					{/each}
				</select>
			</label>
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

	<div
		class="flex-1 overflow-auto rounded-lg border border-dashed border-border-color/60 p-2"
		on:scroll={handleScroll}
		bind:clientHeight={viewportHeight}
		bind:clientWidth={viewportWidth}
	>
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
			<div class="relative" style={`height: ${totalHeight}px;`}>
				{#each visibleLayout as item (item.image.id)}
					<button
						class={`absolute rounded-md border border-border-color text-left ${
							selectedId === item.image.id ? 'bg-card-active' : 'bg-transparent'
						}`}
						style={`top: ${item.top}px; left: ${item.left}px; width: ${item.width}px; height: ${item.height}px;`}
						on:click={() => handleSelect(item.image)}
					>
						{#if viewMode === 'grid'}
							<div class="flex h-full flex-col gap-2 p-2">
								{#if item.image.thumbUrl}
									<img
										class="h-full max-h-[calc(100%-48px)] w-full rounded-md border border-border-color object-cover"
										src={item.image.thumbUrl}
										alt={item.image.name}
									/>
								{:else}
									<div class="flex flex-1 items-center justify-center rounded-md border border-border-color text-xs text-text-secondary">
										{item.image.status === 'loading' ? 'Loading' : '—'}
									</div>
								{/if}
								<div>
									<p class="truncate text-xs text-text-primary">{item.image.name}</p>
								</div>
							</div>
						{:else}
							<div class="flex items-center gap-3 p-2">
								{#if item.image.thumbUrl}
									<img
										class="h-16 w-16 rounded-md border border-border-color object-cover"
										src={item.image.thumbUrl}
										alt={item.image.name}
									/>
								{:else}
									<div class="flex h-16 w-16 items-center justify-center rounded-md border border-border-color text-xs text-text-secondary">
										{item.image.status === 'loading' ? 'Loading' : '—'}
									</div>
								{/if}
								<div class="flex-1">
									<p class="text-sm text-text-primary">{item.image.name}</p>
									<p class="text-xs text-text-secondary">
										{Math.round(item.image.size / 1024)} KB · {new Date(item.image.lastModified).toLocaleDateString()}
									</p>
									{#if item.image.error}
										<p class="text-xs text-red-300">{item.image.error}</p>
									{/if}
								</div>
							</div>
						{/if}
					</button>
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

	{#if errorMessage}
		<p class="text-xs text-red-300">{errorMessage}</p>
	{/if}
</div>
