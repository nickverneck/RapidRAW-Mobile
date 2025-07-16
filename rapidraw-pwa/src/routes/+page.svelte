<div class="editor-container" data-testid="image-editor">
	<div class="editor-content">
		<div class="image-canvas-container">
			<div class="image-canvas" data-testid="image-canvas">
				<div class="placeholder-content">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
						<circle cx="8.5" cy="8.5" r="1.5"/>
						<polyline points="21,15 16,10 5,21"/>
					</svg>
					<p>Drop an image here to start editing</p>
				</div>
			</div>
		</div>
		
		<div class="adjustment-panel" data-testid="adjustment-panel">
			<h3>Basic Adjustments</h3>
			<div class="slider-group">
				<label for="exposure">Exposure</label>
				<input 
					type="range" 
					id="exposure" 
					data-testid="exposure-slider"
					aria-valuenow="0"
					min="-2" 
					max="2" 
					step="0.1" 
					value="0"
				/>
			</div>
			<div class="slider-group">
				<label for="contrast">Contrast</label>
				<input 
					type="range" 
					id="contrast" 
					data-testid="contrast-slider"
					aria-valuenow="0"
					min="-100" 
					max="100" 
					step="1" 
					value="0"
				/>
			</div>
		</div>

		<!-- Touch-optimized components for testing -->
		<div class="touch-controls">
			<button class="glass-button" data-testid="glass-button">
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
		</div>

		<!-- Modal trigger for testing -->
		<button class="preset-button" data-testid="open-preset-modal">
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

	let touchSliderValue = 50;

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