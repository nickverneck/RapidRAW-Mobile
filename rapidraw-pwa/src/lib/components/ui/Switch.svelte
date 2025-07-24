<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { spring } from 'svelte/motion';

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		label?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
		hapticFeedback?: boolean;
		class?: string;
		id?: string;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		label = '',
		description = '',
		size = 'md',
		variant = 'primary',
		hapticFeedback = true,
		class: className = '',
		id = ''
	}: Props = $props();

	const dispatch = createEventDispatcher();

	// Spring animation for smooth thumb movement
	const thumbPosition = spring(checked ? 1 : 0, {
		stiffness: 0.3,
		damping: 0.8
	});

	// Update spring when checked state changes
	$effect(() => {
		thumbPosition.set(checked ? 1 : 0);
	});

	// Generate unique ID if not provided
	let uniqueId = $derived(id || `switch-${label.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`);

	// Computed classes following glassmorphism design
	let switchClasses = $derived(`
		glass-switch
		glass-switch--${variant}
		glass-switch--${size}
		${checked ? 'glass-switch--checked' : ''}
		${disabled ? 'glass-switch--disabled' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	function handleToggle() {
		if (disabled) return;
		
		checked = !checked;
		
		// Trigger haptic feedback
		if (hapticFeedback) {
			triggerHapticFeedback(checked ? 'medium' : 'light');
		}
		
		dispatch('change', { checked });
		dispatch('toggle', { checked });
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;
		
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handleToggle();
		}
	}

	function triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
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

	function handleTouchStart() {
		if (!disabled && hapticFeedback) {
			triggerHapticFeedback('light');
		}
	}
</script>

<div class="glass-switch-container {className}">
	<label 
		for={uniqueId}
		class="glass-switch-label {disabled ? 'glass-switch-label--disabled' : ''}"
	>
		{#if label || description}
			<div class="glass-switch-text">
				{#if label}
					<span class="glass-switch-title">
						{label}
					</span>
				{/if}
				{#if description}
					<span class="glass-switch-description">
						{description}
					</span>
				{/if}
			</div>
		{/if}
		
		<div class="glass-switch-track-container">
			<input
				id={uniqueId}
				type="checkbox"
				class="glass-switch-input"
				bind:checked
				{disabled}
				onchange={handleToggle}
				onkeydown={handleKeydown}
				ontouchstart={handleTouchStart}
				aria-describedby={description ? `${uniqueId}-description` : undefined}
			/>
			
			<div class={switchClasses}>
				<div 
					class="glass-switch-thumb"
					style="transform: translateX({$thumbPosition * 1.5}rem);"
				></div>
			</div>
		</div>
	</label>
	
	{#if description}
		<div id="{uniqueId}-description" class="sr-only">
			{description}
		</div>
	{/if}
</div>

<style>
	/* Glass Switch Container */
	.glass-switch-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
	}

	/* Glass Switch Label */
	.glass-switch-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		cursor: pointer;
		transition: opacity 0.2s ease;
		min-height: 44px;
		padding: 0.5rem 0;
	}

	.glass-switch-label--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Glass Switch Text */
	.glass-switch-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
	}

	.glass-switch-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, rgba(255, 255, 255, 0.8));
		line-height: 1.25;
		user-select: none;
	}

	.glass-switch-description {
		font-size: 0.75rem;
		color: var(--text-secondary, rgba(255, 255, 255, 0.6));
		line-height: 1.25;
		user-select: none;
	}

	/* Glass Switch Track Container */
	.glass-switch-track-container {
		position: relative;
		flex-shrink: 0;
	}

	/* Hidden Input */
	.glass-switch-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
		opacity: 0;
	}

	/* Glass Switch Base */
	.glass-switch {
		position: relative;
		width: 3rem;
		height: 1.75rem;
		border-radius: 9999px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		
		/* Glassmorphism base */
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
		
		/* Inner shadow for depth */
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Size Variants */
	.glass-switch--sm {
		width: 2.25rem;
		height: 1.25rem;
	}

	.glass-switch--md {
		width: 3rem;
		height: 1.75rem;
	}

	.glass-switch--lg {
		width: 3.75rem;
		height: 2.25rem;
	}

	/* Variant Colors - Inactive State */
	.glass-switch--primary {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glass-switch--accent {
		background: rgba(16, 185, 129, 0.05);
		border-color: rgba(16, 185, 129, 0.1);
	}

	.glass-switch--success {
		background: rgba(34, 197, 94, 0.05);
		border-color: rgba(34, 197, 94, 0.1);
	}

	.glass-switch--warning {
		background: rgba(245, 158, 11, 0.05);
		border-color: rgba(245, 158, 11, 0.1);
	}

	.glass-switch--danger {
		background: rgba(239, 68, 68, 0.05);
		border-color: rgba(239, 68, 68, 0.1);
	}

	/* Checked State */
	.glass-switch--checked.glass-switch--primary {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.4);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
	}

	.glass-switch--checked.glass-switch--accent {
		background: rgba(16, 185, 129, 0.2);
		border-color: rgba(16, 185, 129, 0.4);
		box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
	}

	.glass-switch--checked.glass-switch--success {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.4);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
	}

	.glass-switch--checked.glass-switch--warning {
		background: rgba(245, 158, 11, 0.2);
		border-color: rgba(245, 158, 11, 0.4);
		box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
	}

	.glass-switch--checked.glass-switch--danger {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
	}

	/* Glass Switch Thumb */
	.glass-switch-thumb {
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.5rem;
		height: 1.5rem;
		background: white;
		border-radius: 50%;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		
		/* Glassmorphism effect */
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	/* Thumb size variants */
	.glass-switch--sm .glass-switch-thumb {
		width: 1rem;
		height: 1rem;
	}

	.glass-switch--lg .glass-switch-thumb {
		width: 2rem;
		height: 2rem;
	}

	/* Disabled State */
	.glass-switch--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.glass-switch--disabled .glass-switch-thumb {
		background: rgba(255, 255, 255, 0.5);
		border-color: rgba(255, 255, 255, 0.2);
	}

	/* Hover Effects */
	.glass-switch-label:not(.glass-switch-label--disabled):hover .glass-switch:not(.glass-switch--disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		transform: scale(1.02);
	}

	.glass-switch-label:not(.glass-switch-label--disabled):hover .glass-switch--checked:not(.glass-switch--disabled) {
		transform: scale(1.02);
	}

	.glass-switch-label:not(.glass-switch-label--disabled):hover .glass-switch-thumb {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		transform: translateX(var(--thumb-translate, 0)) scale(1.05);
	}

	/* Active/Pressed State */
	.glass-switch-label:not(.glass-switch-label--disabled):active .glass-switch-thumb {
		transform: translateX(var(--thumb-translate, 0)) scale(0.95);
	}

	/* Focus Styles */
	.glass-switch-input:focus-visible + .glass-switch {
		outline: 2px solid rgba(59, 130, 246, 0.5);
		outline-offset: 2px;
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.glass-switch-label {
			min-height: 48px; /* Larger touch target */
			padding: 0.75rem 0;
		}
		
		.glass-switch {
			/* Slightly larger on mobile for easier interaction */
			transform: scale(1.1);
		}
		
		/* Disable hover effects on touch devices */
		.glass-switch-label:hover .glass-switch {
			transform: scale(1.1);
		}
		
		.glass-switch-label:hover .glass-switch-thumb {
			transform: translateX(var(--thumb-translate, 0));
		}
		
		/* Enhanced active state for touch feedback */
		.glass-switch-label:active .glass-switch {
			transform: scale(1.05);
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.glass-switch {
			border-width: 2px;
			background: rgba(255, 255, 255, 0.1);
		}
		
		.glass-switch-thumb {
			border-width: 2px;
			border-color: currentColor;
		}
		
		.glass-switch-input:focus-visible + .glass-switch {
			outline-width: 3px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.glass-switch,
		.glass-switch-thumb {
			transition: none;
		}
		
		.glass-switch-label:hover .glass-switch,
		.glass-switch-label:hover .glass-switch-thumb,
		.glass-switch-label:active .glass-switch-thumb {
			transform: none;
		}
	}

	/* Light Mode Adjustments */
	@media (prefers-color-scheme: light) {
		.glass-switch-title {
			color: #374151;
		}
		
		.glass-switch-description {
			color: #6b7280;
		}
		
		.glass-switch--primary {
			background: rgba(255, 255, 255, 0.7);
			border-color: rgba(0, 0, 0, 0.1);
		}
		
		.glass-switch--checked.glass-switch--primary {
			background: rgba(59, 130, 246, 0.1);
			border-color: rgba(59, 130, 246, 0.3);
		}
		
		.glass-switch-thumb {
			background: white;
			border-color: rgba(0, 0, 0, 0.1);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		}
	}

	/* Fallback for browsers without backdrop-filter support */
	@supports not (backdrop-filter: blur(1px)) {
		.glass-switch--primary {
			background: rgba(30, 27, 75, 0.9);
		}
		
		.glass-switch--checked.glass-switch--primary {
			background: rgba(59, 130, 246, 0.3);
		}
		
		.glass-switch-thumb {
			background: rgba(255, 255, 255, 0.95);
		}
	}

	/* Screen reader only class */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>