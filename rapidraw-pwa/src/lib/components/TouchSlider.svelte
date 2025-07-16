<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		label?: string;
		id?: string;
		hapticFeedback?: boolean;
		showValue?: boolean;
		variant?: 'primary' | 'secondary' | 'accent';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		value = $bindable(50),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		label = '',
		id = '',
		hapticFeedback = true,
		showValue = true,
		variant = 'primary',
		size = 'md',
		class: className = ''
	}: Props = $props();

	const dispatch = createEventDispatcher();

	let sliderElement: HTMLInputElement;
	let isDragging = $state(false);
	let lastHapticValue = 0;
	let touchStartX = 0;
	let touchStartValue = 0;

	// Computed classes
	let sliderClasses = $derived(`
		touch-slider
		touch-slider--${variant}
		touch-slider--${size}
		${disabled ? 'touch-slider--disabled' : ''}
		${isDragging ? 'touch-slider--dragging' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	// Percentage for visual representation
	let percentage = $derived(((value - min) / (max - min)) * 100);

	// Handle input change
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		
		if (newValue !== value) {
			value = newValue;
			dispatch('change', { value: newValue });
			
			// Trigger haptic feedback on value change
			if (hapticFeedback && Math.abs(newValue - lastHapticValue) >= step) {
				triggerHapticFeedback('light');
				lastHapticValue = newValue;
			}
		}
	}

	// Handle touch start
	function handleTouchStart(event: TouchEvent) {
		if (disabled) return;
		
		isDragging = true;
		touchStartX = event.touches[0].clientX;
		touchStartValue = value;
		
		// Trigger haptic feedback on touch start
		if (hapticFeedback) {
			triggerHapticFeedback('medium');
		}
		
		dispatch('dragstart', { value });
		
		// Prevent default to avoid scrolling
		event.preventDefault();
	}

	// Handle touch move
	function handleTouchMove(event: TouchEvent) {
		if (!isDragging || disabled) return;
		
		const touch = event.touches[0];
		const rect = sliderElement.getBoundingClientRect();
		const deltaX = touch.clientX - touchStartX;
		const sliderWidth = rect.width;
		const valueRange = max - min;
		
		// Calculate new value based on touch movement
		const deltaValue = (deltaX / sliderWidth) * valueRange;
		let newValue = touchStartValue + deltaValue;
		
		// Clamp to min/max
		newValue = Math.max(min, Math.min(max, newValue));
		
		// Round to step
		newValue = Math.round(newValue / step) * step;
		
		if (newValue !== value) {
			value = newValue;
			dispatch('change', { value: newValue });
			dispatch('drag', { value: newValue });
			
			// Trigger haptic feedback on significant value change
			if (hapticFeedback && Math.abs(newValue - lastHapticValue) >= step * 2) {
				triggerHapticFeedback('light');
				lastHapticValue = newValue;
			}
		}
		
		event.preventDefault();
	}

	// Handle touch end
	function handleTouchEnd(event: TouchEvent) {
		if (!isDragging) return;
		
		isDragging = false;
		
		// Trigger haptic feedback on release
		if (hapticFeedback) {
			triggerHapticFeedback('medium');
		}
		
		dispatch('dragend', { value });
		
		event.preventDefault();
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;
		
		let newValue = value;
		const largeStep = step * 10;
		
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowDown':
				newValue = Math.max(min, value - step);
				break;
			case 'ArrowRight':
			case 'ArrowUp':
				newValue = Math.min(max, value + step);
				break;
			case 'PageDown':
				newValue = Math.max(min, value - largeStep);
				break;
			case 'PageUp':
				newValue = Math.min(max, value + largeStep);
				break;
			case 'Home':
				newValue = min;
				break;
			case 'End':
				newValue = max;
				break;
			default:
				return;
		}
		
		if (newValue !== value) {
			value = newValue;
			dispatch('change', { value: newValue });
			
			if (hapticFeedback) {
				triggerHapticFeedback('light');
			}
		}
		
		event.preventDefault();
	}

	// Trigger haptic feedback
	function triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light') {
		if (!hapticFeedback || typeof navigator === 'undefined') return;
		
		// Use Vibration API if available
		if ('vibrate' in navigator) {
			const patterns = {
				light: 25,
				medium: 50,
				heavy: 100
			};
			navigator.vibrate(patterns[intensity]);
		}
		
		// Use Haptic Feedback API if available (iOS Safari)
		if ('hapticFeedback' in navigator) {
			const feedbackTypes = {
				light: 'impactLight',
				medium: 'impactMedium',
				heavy: 'impactHeavy'
			};
			(navigator as any).hapticFeedback(feedbackTypes[intensity]);
		}
	}

	// Format value for display
	function formatValue(val: number): string {
		if (step < 1) {
			return val.toFixed(1);
		}
		return Math.round(val).toString();
	}

	onMount(() => {
		// Add touch event listeners with passive: false to allow preventDefault
		sliderElement.addEventListener('touchstart', handleTouchStart, { passive: false });
		sliderElement.addEventListener('touchmove', handleTouchMove, { passive: false });
		sliderElement.addEventListener('touchend', handleTouchEnd, { passive: false });
		
		return () => {
			sliderElement.removeEventListener('touchstart', handleTouchStart);
			sliderElement.removeEventListener('touchmove', handleTouchMove);
			sliderElement.removeEventListener('touchend', handleTouchEnd);
		};
	});
</script>

<div class="touch-slider-container">
	{#if label}
		<label for={id} class="touch-slider-label">
			{label}
			{#if showValue}
				<span class="touch-slider-value">{formatValue(value)}</span>
			{/if}
		</label>
	{/if}
	
	<div class="touch-slider-wrapper">
		<input
			bind:this={sliderElement}
			{id}
			type="range"
			{min}
			{max}
			{step}
			{disabled}
			bind:value
			class={sliderClasses}
			data-testid="touch-slider"
			aria-valuenow={value}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-label={label || 'Slider'}
			on:input={handleInput}
			on:keydown={handleKeydown}
		/>
		
		<!-- Visual track and thumb -->
		<div class="touch-slider-track">
			<div 
				class="touch-slider-fill" 
				style="width: {percentage}%"
			></div>
			<div 
				class="touch-slider-thumb" 
				style="left: {percentage}%"
				class:dragging={isDragging}
			></div>
		</div>
	</div>
</div>

<style>
	.touch-slider-container {
		width: 100%;
		margin-bottom: 1rem;
	}

	.touch-slider-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, rgba(255, 255, 255, 0.8));
	}

	.touch-slider-value {
		font-weight: 600;
		color: var(--text-primary, white);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		min-width: 2rem;
		text-align: center;
	}

	.touch-slider-wrapper {
		position: relative;
		width: 100%;
	}

	/* Base slider styles */
	.touch-slider {
		width: 100%;
		height: 44px;
		background: transparent;
		border: none;
		outline: none;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
		position: relative;
		z-index: 2;
	}

	/* Hide default slider appearance */
	.touch-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 0;
		height: 0;
		background: transparent;
	}

	.touch-slider::-moz-range-thumb {
		width: 0;
		height: 0;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.touch-slider::-webkit-slider-track {
		background: transparent;
		height: 44px;
	}

	.touch-slider::-moz-range-track {
		background: transparent;
		height: 44px;
		border: none;
	}

	/* Custom visual track */
	.touch-slider-track {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		transform: translateY(-50%);
		pointer-events: none;
		overflow: hidden;
	}

	.touch-slider-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6, #1e40af);
		border-radius: 4px;
		transition: width 0.1s ease;
	}

	.touch-slider-thumb {
		position: absolute;
		top: 50%;
		width: 24px;
		height: 24px;
		background: white;
		border: 2px solid #3b82f6;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
		pointer-events: none;
	}

	.touch-slider-thumb.dragging {
		transform: translate(-50%, -50%) scale(1.2);
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
	}

	/* Variant styles */
	.touch-slider--primary .touch-slider-fill {
		background: linear-gradient(90deg, #3b82f6, #1e40af);
	}

	.touch-slider--primary .touch-slider-thumb {
		border-color: #3b82f6;
	}

	.touch-slider--secondary .touch-slider-fill {
		background: linear-gradient(90deg, #6b7280, #374151);
	}

	.touch-slider--secondary .touch-slider-thumb {
		border-color: #6b7280;
	}

	.touch-slider--accent .touch-slider-fill {
		background: linear-gradient(90deg, #10b981, #059669);
	}

	.touch-slider--accent .touch-slider-thumb {
		border-color: #10b981;
	}

	/* Size variants */
	.touch-slider--sm {
		height: 36px;
	}

	.touch-slider--sm + .touch-slider-track {
		height: 6px;
	}

	.touch-slider--sm + .touch-slider-track .touch-slider-thumb {
		width: 18px;
		height: 18px;
	}

	.touch-slider--lg {
		height: 52px;
	}

	.touch-slider--lg + .touch-slider-track {
		height: 10px;
	}

	.touch-slider--lg + .touch-slider-track .touch-slider-thumb {
		width: 28px;
		height: 28px;
	}

	/* Disabled state */
	.touch-slider--disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.touch-slider--disabled .touch-slider-fill {
		background: rgba(255, 255, 255, 0.2);
	}

	.touch-slider--disabled .touch-slider-thumb {
		background: rgba(255, 255, 255, 0.5);
		border-color: rgba(255, 255, 255, 0.3);
	}

	/* Focus styles */
	.touch-slider:focus + .touch-slider-track .touch-slider-thumb {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Active/dragging state */
	.touch-slider--dragging .touch-slider-track {
		background: rgba(255, 255, 255, 0.15);
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.touch-slider-track {
			background: rgba(255, 255, 255, 0.3);
			border: 1px solid rgba(255, 255, 255, 0.5);
		}
		
		.touch-slider-thumb {
			border-width: 3px;
		}
		
		.touch-slider:focus + .touch-slider-track .touch-slider-thumb {
			outline-width: 3px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.touch-slider-fill,
		.touch-slider-thumb {
			transition: none;
		}
		
		.touch-slider-thumb.dragging {
			transform: translate(-50%, -50%);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.touch-slider {
			height: 48px; /* Larger touch target on mobile */
		}
		
		.touch-slider-thumb {
			width: 28px;
			height: 28px;
		}
		
		.touch-slider-track {
			height: 10px;
		}
	}

	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.touch-slider-track {
			background: rgba(255, 255, 255, 0.08);
		}
	}

	/* Light mode adjustments */
	@media (prefers-color-scheme: light) {
		.touch-slider-track {
			background: rgba(0, 0, 0, 0.1);
		}
		
		.touch-slider-thumb {
			background: white;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		}
		
		.touch-slider-value {
			background: rgba(0, 0, 0, 0.1);
			color: #1e293b;
		}
	}
</style>