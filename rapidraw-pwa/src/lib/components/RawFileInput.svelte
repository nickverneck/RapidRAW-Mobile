<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import imageStore from '$lib/stores/imageStore';

	const dispatch = createEventDispatcher();

	let fileInput: HTMLInputElement;
	let isLoading = $state(false);

	const supportedRawFormats = [
		'.cr2', '.cr3', // Canon
		'.nef', '.nrw', // Nikon
		'.arw', '.srf', '.sr2', // Sony
		'.raf', // Fuji
		'.orf', // Olympus
		'.rw2', // Panasonic
		'.dng', // Adobe DNG
		'.raw' // Generic
	];

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		
		if (!files || files.length === 0) return;

		isLoading = true;
		
		try {
			for (const file of Array.from(files)) {
				console.log(`Loading file: ${file.name}, size: ${file.size} bytes`);
				const imageId = await imageStore.addImage(file);
				console.log(`Successfully loaded image with ID: ${imageId}`);
				
				// Set as current image if it's the first one
				if (files.length === 1) {
					imageStore.setCurrentImage(imageId);
				}
			}
			
			dispatch('filesLoaded', { count: files.length });
		} catch (error) {
			console.error('Failed to load files:', error);
			dispatch('error', { message: error instanceof Error ? error.message : 'Failed to load files' });
		} finally {
			isLoading = false;
			// Reset the input
			target.value = '';
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}
</script>

<div class="raw-file-input">
	<input
		bind:this={fileInput}
		type="file"
		accept="{supportedRawFormats.join(',')},image/*"
		multiple
		onchange={handleFileSelect}
		style="display: none;"
	/>
	
	<button
		class="upload-button glass-button"
		onclick={openFileDialog}
		disabled={isLoading}
		aria-label="Upload RAW files"
	>
		{#if isLoading}
			<div class="loading-spinner"></div>
			<span>Processing...</span>
		{:else}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17,8 12,3 7,8" />
				<line x1="12" y1="3" x2="12" y2="15" />
			</svg>
			<span>Import RAW Files</span>
		{/if}
	</button>
	
	<div class="supported-formats">
		<p class="formats-label">Supported formats:</p>
		<p class="formats-list">CR2, CR3, NEF, ARW, RAF, ORF, RW2, DNG, and more</p>
	</div>
</div>

<style>
	.raw-file-input {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
	}

	.upload-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		color: white;
		background: rgba(59, 130, 246, 0.8);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 12px;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 200px;
		justify-content: center;
	}

	.upload-button:hover:not(:disabled) {
		background: rgba(59, 130, 246, 1);
		border-color: rgba(59, 130, 246, 0.5);
		transform: translateY(-1px);
		box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
	}

	.upload-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.supported-formats {
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
	}

	.formats-label {
		font-size: 0.9rem;
		font-weight: 500;
		margin: 0 0 0.25rem 0;
	}

	.formats-list {
		font-size: 0.8rem;
		margin: 0;
		opacity: 0.8;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.raw-file-input {
			padding: 1rem;
		}

		.upload-button {
			padding: 0.875rem 1.5rem;
			font-size: 0.9rem;
			min-width: 180px;
		}

		.formats-label {
			font-size: 0.8rem;
		}

		.formats-list {
			font-size: 0.75rem;
		}
	}
</style>