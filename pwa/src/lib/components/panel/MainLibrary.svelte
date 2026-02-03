<script lang="ts">
	type FileHandle = FileSystemFileHandle;
	type ImageEntry = {
		id: string;
		name: string;
		handle: FileHandle;
		size: number;
		lastModified: number;
		status: 'pending' | 'loading' | 'ready' | 'error';
		thumbUrl?: string;
		error?: string;
	};

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

	const viewModes = [
		{ id: 'grid', label: 'Grid' },
		{ id: 'list', label: 'List' }
	];

	const MAX_CONCURRENT_PREVIEWS = 3;
	let activePreviewCount = 0;
	const previewQueue: Array<ImageEntry> = [];

	type WasmModule = {
		default: () => Promise<void>;
		is_supported_image_file: (path: string) => boolean;
		load_image_preview_png?: (
			data: Uint8Array,
			path: string,
			maxEdge: number,
			use_fast_raw_dev: boolean,
			highlightCompression: number
		) => Uint8Array;
		decode_image_preview_png?: (data: Uint8Array, path: string, maxEdge: number) => Uint8Array;
		develop_raw_preview_png?: (
			data: Uint8Array,
			maxEdge: number,
			fastDemosaic: boolean,
			highlightCompression: number
		) => Uint8Array;
	};

	let wasmModulePromise: Promise<WasmModule> | null = null;

	function getWasmModule() {
		if (wasmModulePromise) return wasmModulePromise;
		wasmModulePromise = (async () => {
			const wantsThreads = window.crossOriginIsolated;
			const threadModuleUrl = new URL(
				'/wasm-threads/rapidraw_wasm.js',
				window.location.origin
			).toString();
			const singleModuleUrl = new URL(
				'/wasm/rapidraw_wasm.js',
				window.location.origin
			).toString();
			const primaryUrl = wantsThreads ? threadModuleUrl : singleModuleUrl;
			const fallbackUrl = wantsThreads ? singleModuleUrl : threadModuleUrl;

			try {
				const mod = await import(/* @vite-ignore */ primaryUrl);
				await mod.default();
				return mod as WasmModule;
			} catch (error) {
				const mod = await import(/* @vite-ignore */ fallbackUrl);
				await mod.default();
				return mod as WasmModule;
			}
		})();
		return wasmModulePromise;
	}

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
			revokePreviewUrls();
			images = [];

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
		revokePreviewUrls();
		images = [];
		activePath = null;
		selectedId = null;
	}

	function refreshLibrary() {
		if (directoryHandle) {
			void scanDirectory(directoryHandle);
		}
	}

	const lower = (value: string) => value.toLowerCase();

	$: filteredImages = images.filter((entry) => {
		if (!searchText.trim()) return true;
		return lower(entry.name).includes(lower(searchText));
	});

	$: sortedImages = [...filteredImages].sort((a, b) => {
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
				{#each sortedImages as image}
					<button
						class={`rounded-md border border-border-color p-3 text-left ${
							selectedId === image.id ? 'bg-card-active' : 'bg-transparent'
						}`}
						on:click={() => (selectedId = image.id)}
					>
						<div class="flex items-center gap-3">
							{#if image.thumbUrl}
								<img
									class="h-16 w-16 rounded-md border border-border-color object-cover"
									src={image.thumbUrl}
									alt={image.name}
								/>
							{:else}
								<div class="flex h-16 w-16 items-center justify-center rounded-md border border-border-color text-xs text-text-secondary">
									{image.status === 'loading' ? 'Loading' : '—'}
								</div>
							{/if}
							<div class="flex-1">
								<p class="text-sm text-text-primary">{image.name}</p>
								<p class="text-xs text-text-secondary">
									{Math.round(image.size / 1024)} KB · {new Date(image.lastModified).toLocaleDateString()}
								</p>
								{#if image.error}
									<p class="text-xs text-red-300">{image.error}</p>
								{/if}
							</div>
						</div>
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
