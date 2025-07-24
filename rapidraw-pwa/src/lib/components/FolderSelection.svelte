<script lang="ts">
	import { folderStore, hasSelectedFolder } from '$lib/stores/folderStore';
	import { onMount } from 'svelte';

	let isSupported = false;
	let showError = false;
	let errorMessage = '';

	onMount(() => {
		isSupported = folderStore.isSupported();
		folderStore.init();

		// Subscribe to store changes to show errors
		const unsubscribe = folderStore.subscribe(state => {
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
	<div class="welcome-content glass-panel">
		<div class="logo-section">
			<h1 class="app-title">RapidRAW</h1>
			<p class="welcome-text">Welcome back!</p>
			<p class="subtitle">Continue where you left off or start a new session.</p>
		</div>

		{#if !$hasSelectedFolder}
			<div class="action-section">
				{#if isSupported}
					<button 
						class="select-folder-btn glass-button touch-target"
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
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
						</svg>
						Select Folder
					</button>
					
					<p class="help-text">
						Choose a folder containing your photos to get started. 
						RapidRAW will remember your selection for future sessions.
					</p>
				{:else}
					<div class="unsupported-browser glass-panel">
						<svg 
							class="warning-icon" 
							width="48" 
							height="48" 
							viewBox="0 0 24 24" 
							fill="none" 
							stroke="currentColor" 
							stroke-width="2"
						>
							<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
							<path d="M12 9v4"/>
							<path d="m12 17 .01 0"/>
						</svg>
						<h3>Browser Not Supported</h3>
						<p>
							RapidRAW requires a modern browser with File System Access API support. 
							Please use Chrome, Edge, or another Chromium-based browser for the best experience.
						</p>
						<p class="browser-list">
							Supported browsers:
							<br>• Chrome 86+
							<br>• Edge 86+
							<br>• Opera 72+
						</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="continue-section">
				<button 
					class="continue-btn glass-button touch-target"
					on:click={() => {/* Navigation will be handled by parent component */}}
				>
					<svg 
						class="continue-icon" 
						width="24" 
						height="24" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2"
					>
						<path d="M9 18l6-6-6-6"/>
					</svg>
					Continue Session
				</button>
				
				<button 
					class="change-folder-btn glass-button touch-target secondary"
					on:click={handleSelectFolder}
				>
					<svg 
						class="folder-icon" 
						width="20" 
						height="20" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2"
					>
						<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
					</svg>
					Change Folder
				</button>
			</div>
		{/if}
	</div>

	<!-- Error Toast -->
	{#if showError}
		<div class="error-toast glass-modal" role="alert">
			<div class="error-content">
				<svg 
					class="error-icon" 
					width="20" 
					height="20" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10"/>
					<path d="m15 9-6 6"/>
					<path d="m9 9 6 6"/>
				</svg>
				<p class="error-message">{errorMessage}</p>
				<button 
					class="dismiss-btn"
					on:click={dismissError}
					aria-label="Dismiss error"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="m18 6-12 12"/>
						<path d="m6 6 12 12"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	@import '$lib/styles/glassmorphism.css';

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
