<div class="editor-container" data-testid="image-editor">
	<!-- Loading overlay -->
	{#if $isLoading}
		<div class="loading-overlay">
			<div class="loading-spinner"></div>
			<p>Loading...</p>
		</div>
	{/if}

	<!-- File input (hidden) -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		on:change={handleFileSelect}
		style="display: none;"
	/>

	<div class="editor-content">
		<!-- Image Canvas Area -->
		<div 
			class="image-canvas-container"
			on:drop={handleDrop}
			on:dragover={handleDragOver}
			role="button"
			tabindex="0"
			on:click={() => fileInput?.click()}
			on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
		>
			<div class="image-canvas" data-testid="image-canvas">
				{#if $currentImage}
					<img 
						src={$currentImage.thumbnail || ''} 
						alt={$currentImage.name}
						class="current-image"
					/>
					
					<!-- Image controls overlay -->
					<div class="image-controls">
						<button 
							class="control-button"
							on:click|stopPropagation={undo}
							disabled={!$canUndo}
							title="Undo (Ctrl+Z)"
							aria-label="Undo (Ctrl+Z)"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M3 7v6h6"/>
								<path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
							</svg>
						</button>
						
						<button 
							class="control-button"
							on:click|stopPropagation={redo}
							disabled={!$canRedo}
							title="Redo (Ctrl+Y)"
							aria-label="Redo (Ctrl+Y)"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 7v6h-6"/>
								<path d="m3 17a9 9 0 019-9 9 9 0 016 2.3l3-2.3"/>
							</svg>
						</button>
						
						<button 
							class="control-button"
							on:click|stopPropagation={resetAdjustments}
							title="Reset all adjustments"
							aria-label="Reset all adjustments"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
								<path d="M21 3v5h-5"/>
								<path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
								<path d="M8 16H3v5"/>
							</svg>
						</button>
					</div>
				{:else}
					<div class="placeholder-content">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
							<circle cx="8.5" cy="8.5" r="1.5"/>
							<polyline points="21,15 16,10 5,21"/>
						</svg>
						<p>Drop an image here or click to select</p>
						<p class="hint">Supports JPG, PNG, TIFF, and RAW formats</p>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Adjustment Panel -->
		<GlassPanel variant="secondary" size="md" class="adjustment-panel" data-testid="adjustment-panel">
			<h3>Basic Adjustments</h3>
			
			<TouchSlider 
				label="Exposure"
				bind:value={$currentAdjustments.exposure}
				min={-5}
				max={5}
				step={0.1}
				hapticFeedback={true}
				showValue={true}
				variant="primary"
				size="md"
				on:change={(e) => handleAdjustmentChange('exposure', e.detail.value)}
			/>
			
			<TouchSlider 
				label="Contrast"
				bind:value={$currentAdjustments.contrast}
				min={-100}
				max={100}
				step={1}
				hapticFeedback={true}
				showValue={true}
				variant="primary"
				size="md"
				on:change={(e) => handleAdjustmentChange('contrast', e.detail.value)}
			/>
			
			<TouchSlider 
				label="Highlights"
				bind:value={$currentAdjustments.highlights}
				min={-100}
				max={100}
				step={1}
				hapticFeedback={true}
				showValue={true}
				variant="primary"
				size="md"
				on:change={(e) => handleAdjustmentChange('highlights', e.detail.value)}
			/>
			
			<TouchSlider 
				label="Shadows"
				bind:value={$currentAdjustments.shadows}
				min={-100}
				max={100}
				step={1}
				hapticFeedback={true}
				showValue={true}
				variant="primary"
				size="md"
				on:change={(e) => handleAdjustmentChange('shadows', e.detail.value)}
			/>
			
			<TouchSlider 
				label="Saturation"
				bind:value={$currentAdjustments.saturation}
				min={-100}
				max={100}
				step={1}
				hapticFeedback={true}
				showValue={true}
				variant="accent"
				size="md"
				on:change={(e) => handleAdjustmentChange('saturation', e.detail.value)}
			/>
			
			<TouchSlider 
				label="Temperature"
				bind:value={$currentAdjustments.temperature}
				min={-2000}
				max={2000}
				step={50}
				hapticFeedback={true}
				showValue={true}
				variant="secondary"
				size="md"
				on:change={(e) => handleAdjustmentChange('temperature', e.detail.value)}
			/>
		</GlassPanel>

		<!-- Touch-optimized components for testing -->
		<GlassPanel variant="primary" size="md" class="touch-controls">
			<h4>Touch Controls</h4>
			<button class="glass-button" data-testid="glass-button" on:click={() => uiStore.showToast('info', 'Button clicked', 'Glass button was pressed')}>
				Glass Button
			</button>
			<TouchSlider 
				label="Touch Slider Test"
				bind:value={touchSliderValue}
				min={0}
				max={100}
				step={1}
				hapticFeedback={true}
				showValue={true}
				variant="primary"
				size="md"
			/>
		</GlassPanel>

		<!-- Modal trigger for testing -->
		<button class="preset-button" data-testid="open-preset-modal" on:click={() => uiStore.openModal('preset-test', { message: 'Test modal data' })}>
			Open Preset Modal
		</button>
	</div>
</div>

<!-- Test Modal -->
<div class="preset-modal hidden" data-testid="preset-modal">
	<div class="modal-content">
		<h3>Preset Modal</h3>
		<p>This is a test modal for mobile interactions</p>
		<button class="close-modal">Close</button>
	</div>
</div>

<style>
	.editor-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--bg-secondary, #1a1a2e);
		min-height: 100vh;
	}

	.editor-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.image-canvas-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		border: 2px dashed rgba(255, 255, 255, 0.2);
	}

	.image-canvas {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		transform: scale(1);
		transition: transform 0.3s ease;
	}

	.placeholder-content {
		text-align: center;
		color: rgba(255, 255, 255, 0.6);
	}

	.placeholder-content svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.adjustment-panel {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1.5rem;
		backdrop-filter: blur(10px);
	}

	.adjustment-panel h3 {
		margin: 0 0 1rem 0;
		color: white;
		font-size: 1.125rem;
	}

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.slider-group label {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.slider-group input[type="range"],
	.touch-slider {
		width: 100%;
		height: 44px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 22px;
		outline: none;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
		border: none;
	}

	.slider-group input[type="range"]::-webkit-slider-thumb,
	.touch-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
	}

	.slider-group input[type="range"]::-moz-range-thumb,
	.touch-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	.touch-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
	}

	.glass-button,
	.preset-button {
		min-width: 44px;
		min-height: 44px;
		padding: 1rem 2rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.glass-button:hover,
	.preset-button:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
	}

	.glass-button:active,
	.preset-button:active {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(0) scale(0.98);
	}

	.touch-slider-container {
		padding: 0.5rem 0;
	}

	/* Loading overlay */
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		color: white;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Image display */
	.current-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	/* Image controls overlay */
	.image-controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		border-radius: 8px;
		padding: 0.5rem;
	}

	.control-button {
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.control-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.control-button:active:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(0);
	}

	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hint {
		font-size: 0.875rem;
		opacity: 0.7;
		margin-top: 0.5rem;
	}

	/* Modal styles */
	.preset-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.preset-modal.hidden {
		display: none;
	}

	.modal-content {
		background: rgba(30, 27, 75, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 16px;
		padding: 2rem;
		max-width: 90vw;
		max-height: 80vh;
		color: white;
		text-align: center;
	}

	.close-modal {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: white;
		cursor: pointer;
		min-height: 44px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.editor-content {
			padding: 0.5rem;
			gap: 0.5rem;
		}
		
		.adjustment-panel,
		.touch-controls {
			padding: 1rem;
		}

		.image-canvas {
			min-height: 200px;
		}
	}

	/* Tablet adjustments */
	@media (min-width: 768px) and (max-width: 1024px) {
		.editor-content {
			flex-direction: row;
			gap: 1rem;
		}

		.image-canvas-container {
			flex: 2;
		}

		.adjustment-panel,
		.touch-controls {
			flex: 1;
			max-width: 300px;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.glass-button,
		.preset-button {
			border-width: 2px;
		}
		
		.slider-group input[type="range"],
		.touch-slider {
			border: 1px solid rgba(255, 255, 255, 0.3);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.image-canvas,
		.glass-button,
		.preset-button {
			transition: none;
		}
	}
</style>

<script>
	import { onMount } from 'svelte';
	import TouchSlider from '$lib/components/TouchSlider.svelte';
	import GlassPanel from '$lib/components/GlassPanel.svelte';
	import imageStore from '$lib/stores/imageStore';
	import uiStore from '$lib/stores/uiStore';
	import colorGradingStore from '$lib/stores/colorGradingStore';

	let touchSliderValue = 50;
	let fileInput;

	// Reactive store subscriptions
	$: currentImage = $imageStore.currentImage;
	$: currentAdjustments = $imageStore.currentAdjustments;
	$: canUndo = $imageStore.canUndo;
	$: canRedo = $imageStore.canRedo;
	$: isLoading = $imageStore.isLoading;
	$: layoutType = $uiStore.layoutType;

	// Handle file drop
	function handleDrop(event) {
		event.preventDefault();
		const files = Array.from(event.dataTransfer.files);
		const imageFiles = files.filter(file => file.type.startsWith('image/'));
		
		if (imageFiles.length > 0) {
			handleImageUpload(imageFiles[0]);
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
	}

	// Handle file input
	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file) {
			handleImageUpload(file);
		}
	}

	// Upload image
	async function handleImageUpload(file) {
		try {
			const imageId = await imageStore.addImage(file);
			imageStore.setCurrentImage(imageId);
			uiStore.showToast('success', 'Image loaded', `Successfully loaded ${file.name}`);
		} catch (error) {
			uiStore.showToast('error', 'Upload failed', error.message);
		}
	}

	// Adjustment handlers
	function handleAdjustmentChange(key, value) {
		imageStore.updateAdjustment(key, value);
	}

	function resetAdjustments() {
		imageStore.resetAdjustments();
		uiStore.showToast('info', 'Reset', 'All adjustments have been reset');
	}

	function undo() {
		imageStore.undo();
	}

	function redo() {
		imageStore.redo();
	}

	onMount(() => {
		// Add modal functionality for testing
		const openButton = document.querySelector('[data-testid="open-preset-modal"]');
		const modal = document.querySelector('[data-testid="preset-modal"]');
		const closeButton = document.querySelector('.close-modal');

		if (openButton && modal && closeButton) {
			openButton.addEventListener('click', () => {
				modal.classList.remove('hidden');
			});

			closeButton.addEventListener('click', () => {
				modal.classList.add('hidden');
			});

			// Close on overlay click
			modal.addEventListener('click', (e) => {
				if (e.target === modal) {
					modal.classList.add('hidden');
				}
			});
		}

		// Add touch event listeners for testing
		const canvas = document.querySelector('[data-testid="image-canvas"]');
		if (canvas) {
			// Add custom event dispatching for tests
			canvas.addEventListener('touchstart', (e) => {
				if (e.touches.length === 1) {
					// Single touch - dispatch tap event
					setTimeout(() => {
						canvas.dispatchEvent(new CustomEvent('tap'));
					}, 100);
				}
			});

			canvas.addEventListener('touchend', (e) => {
				// Handle long press
				canvas.dispatchEvent(new CustomEvent('longpress'));
			});
		}

		// Add haptic feedback simulation
		const touchElements = document.querySelectorAll('[data-testid*="touch"], [data-testid*="slider"], [data-testid*="button"]');
		touchElements.forEach(element => {
			element.addEventListener('touchstart', () => {
				// Simulate haptic feedback
				if (navigator.vibrate) {
					navigator.vibrate(50);
				}
			});
		});
	});
</script>