<script lang="ts">
	import { folderStore, hasSelectedFolder } from '$lib/stores/folderStore';
	import { onMount } from 'svelte';

	let isSupported = false;
	let showError = false;
	let errorMessage = '';

	const supportedRawFormats = [
		'CR2',
		'CR3', // Canon
		'NEF',
		'NRW', // Nikon
		'ARW',
		'SRF',
		'SR2', // Sony
		'RAF', // Fuji
		'ORF', // Olympus
		'RW2', // Panasonic
		'DNG', // Adobe DNG
		'RAW' // Generic
	];

	onMount(() => {
		isSupported = folderStore.isSupported();
		folderStore.init();

		// Subscribe to store changes to show errors
		const unsubscribe = folderStore.subscribe((state) => {
			if (state.error) {
				errorMessage = state.error;
				showError = true;
				// Auto-hide error after 5 seconds
				setTimeout(() => {
					showError = false;
				}, 5000);
			}
		});

		return unsubscribe;
	});

	async function handleSelectFolder() {
		await folderStore.selectFolder();
	}

	function dismissError() {
		showError = false;
	}
</script>

<div class="folder-selection-container">
	<div
		class="welcome-content rounded-xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-lg"
	>
		<div class="logo-section">
			<h1 class="app-title">RapidRAW</h1>
			<p class="welcome-text">Welcome back!</p>
			<p class="subtitle">Continue where you left off or start a new session.</p>
		</div>

		{#if !$hasSelectedFolder}
			<div class="action-section">
				{#if isSupported}
					<button
						class="select-folder-btn flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-white backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 hover:shadow-lg active:translate-y-0 active:shadow-md"
						on:click={handleSelectFolder}
						aria-label="Select a folder containing your photos"
					>
						<svg
							class="folder-icon"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
							/>
						</svg>
						Select Folder
					</button>

					<p class="help-text mb-0 text-base text-white opacity-80">
						Choose a folder containing your photos to get started. RapidRAW will remember your
						selection for future sessions.
					</p>

					<div class="supported-formats">
						<p class="formats-label">Supported RAW formats:</p>
						<p class="formats-list">{supportedRawFormats.join(', ')}</p>
					</div>
				{:else}
					<div
						class="unsupported-browser rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-lg"
					>
						<svg
							class="warning-icon h-6 w-6 text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
						<h3 class="mb-2 text-lg font-bold text-white">Browser Not Supported</h3>
						<p class="mb-2 text-base text-white opacity-90">
							RapidRAW requires a modern browser with File System Access API support. Please use
							Chrome, Edge, or another Chromium-based browser for the best experience.
						</p>
						<p class="browser-list mb-0 text-sm text-white opacity-70">
							Supported browsers:
							<br />• Chrome 86+
							<br />• Edge 86+
							<br />• Opera 72+
						</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="continue-section">
				<button
					class="continue-btn flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 hover:shadow-lg active:translate-y-0 active:shadow-md"
					on:click={() => {
						/* Navigation will be handled by parent component */
					}}
				>
					<svg
						class="continue-icon mr-2 h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 18l6-6-6-6"
						/>
					</svg>
					Continue Session
				</button>

				<button
					class="change-folder-btn flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 hover:shadow-lg active:translate-y-0 active:shadow-md"
					on:click={handleSelectFolder}
				>
					<svg
						class="folder-icon mr-2 h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
					Change Folder
				</button>
			</div>
		{/if}
	</div>

	<!-- Error Toast -->
	{#if showError}
		<div
			class="error-toast rounded-xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-lg"
		>
			<div class="error-content flex items-center gap-2">
				<svg
					class="error-icon h-5 w-5 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="m15 9-6 6" />
					<path d="m9 9 6 6" />
				</svg>
				<p class="error-message text-base text-white">{errorMessage}</p>
				<button class="dismiss-btn" on:click={dismissError} aria-label="Dismiss error">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.folder-selection-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		position: relative;
	}

	.welcome-content {
		max-width: 500px;
		width: 100%;
		padding: 2rem;
		text-align: center;
		color: white;
	}

	.logo-section {
		margin-bottom: 2rem;
	}

	.app-title {
		font-size: 3rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.welcome-text {
		font-size: 1.5rem;
		font-weight: 500;
		margin: 0 0 0.5rem 0;
		opacity: 0.9;
	}

	.subtitle {
		font-size: 1rem;
		opacity: 0.7;
		margin: 0;
	}

	.action-section,
	.continue-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.select-folder-btn,
	.continue-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: white;
		border: none;
		border-radius: 12px;
		min-width: 200px;
		justify-content: center;
	}

	.change-folder-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		border: none;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
	}

	.change-folder-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.folder-icon,
	.continue-icon {
		flex-shrink: 0;
	}

	.help-text {
		max-width: 400px;
		font-size: 0.9rem;
		opacity: 0.8;
		line-height: 1.5;
		margin: 0;
	}

	.supported-formats {
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 1.5rem;
	}

	.formats-label {
		font-size: 0.9rem;
		font-weight: 500;
		margin: 0 0 0.5rem 0;
		opacity: 0.9;
	}

	.formats-list {
		font-size: 0.8rem;
		margin: 0;
		opacity: 0.8;
		line-height: 1.4;
		max-width: 400px;
	}

	.unsupported-browser {
		padding: 2rem;
		text-align: center;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.warning-icon {
		color: #fbbf24;
		margin-bottom: 1rem;
	}

	.unsupported-browser h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: #fbbf24;
	}

	.unsupported-browser p {
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
		opacity: 0.9;
	}

	.browser-list {
		font-size: 0.8rem;
		opacity: 0.7;
		text-align: left;
		display: inline-block;
	}

	.error-toast {
		position: fixed;
		top: 2rem;
		right: 2rem;
		z-index: 1000;
		min-width: 300px;
		max-width: 500px;
		animation: slideIn 0.3s ease-out;
	}

	.error-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		color: white;
	}

	.error-icon {
		color: #ef4444;
		flex-shrink: 0;
	}

	.error-message {
		flex: 1;
		font-size: 0.9rem;
		margin: 0;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: color 0.2s ease;
	}

	.dismiss-btn:hover {
		color: white;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Mobile-specific styles */
	@media (max-width: 768px) {
		.folder-selection-container {
			padding: 1rem;
		}

		.welcome-content {
			padding: 1.5rem;
		}

		.app-title {
			font-size: 2.5rem;
		}

		.welcome-text {
			font-size: 1.25rem;
		}

		.select-folder-btn,
		.continue-btn {
			min-width: 100%;
			padding: 1.25rem 2rem;
			font-size: 1.1rem;
		}

		.error-toast {
			top: 1rem;
			right: 1rem;
			left: 1rem;
			min-width: auto;
		}
	}

	/* Tablet styles */
	@media (min-width: 769px) and (max-width: 1024px) {
		.welcome-content {
			max-width: 600px;
			padding: 2.5rem;
		}

		.app-title {
			font-size: 3.5rem;
		}
	}

	/* Loading state for buttons */
	.select-folder-btn:disabled,
	.continue-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.select-folder-btn:disabled:hover,
	.continue-btn:disabled:hover {
		transform: none;
		background: rgba(255, 255, 255, 0.15);
	}
</style>
