<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'accent' | 'subtle';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const dispatch = createEventDispatcher();

	// Computed classes following glassmorphism design
	let buttonClasses = $derived(`
		glass-button
		glass-button--${variant}
		glass-button--${size}
		${disabled ? 'glass-button--disabled' : ''}
		${loading ? 'glass-button--loading' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	function handleClick(event: MouseEvent) {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		dispatch('click', event);
	}

	// Haptic feedback for mobile devices
	function triggerHapticFeedback() {
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(25);
		}
	}

	function handleTouchStart() {
		if (!disabled && !loading) {
			triggerHapticFeedback();
		}
	}
</script>

<button
	class={buttonClasses}
	{disabled}
	aria-disabled={disabled || loading}
	aria-busy={loading}
	onclick={handleClick}
	ontouchstart={handleTouchStart}
	{...restProps}
>
	{#if loading}
		<svg
			class="loading-spinner"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle
				class="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{@render children?.()}
</button>

<style>
	/* Glass Button Base Styles */
	.glass-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		user-select: none;
		
		/* Glassmorphism base */
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		
		/* Text styling */
		color: var(--text-primary, white);
		text-decoration: none;
		
		/* Focus styles */
		outline: none;
	}

	.glass-button:focus-visible {
		outline: 2px solid rgba(59, 130, 246, 0.5);
		outline-offset: 2px;
	}

	/* Size Variants */
	.glass-button--sm {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		border-radius: 8px;
		min-height: 36px;
	}

	.glass-button--md {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border-radius: 12px;
		min-height: 44px;
	}

	.glass-button--lg {
		padding: 1rem 2rem;
		font-size: 1.125rem;
		border-radius: 16px;
		min-height: 52px;
	}

	/* Variant Styles */
	.glass-button--primary {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.glass-button--primary:hover:not(.glass-button--disabled) {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	}

	.glass-button--primary:active:not(.glass-button--disabled) {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(0) scale(0.98);
	}

	.glass-button--secondary {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glass-button--secondary:hover:not(.glass-button--disabled) {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.glass-button--secondary:active:not(.glass-button--disabled) {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(0) scale(0.98);
	}

	.glass-button--accent {
		background: rgba(59, 130, 246, 0.15);
		border-color: rgba(59, 130, 246, 0.3);
		color: #60a5fa;
	}

	.glass-button--accent:hover:not(.glass-button--disabled) {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.4);
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
	}

	.glass-button--accent:active:not(.glass-button--disabled) {
		background: rgba(59, 130, 246, 0.25);
		transform: translateY(0) scale(0.98);
	}

	.glass-button--subtle {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.glass-button--subtle:hover:not(.glass-button--disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glass-button--subtle:active:not(.glass-button--disabled) {
		background: rgba(255, 255, 255, 0.12);
		transform: scale(0.98);
	}

	/* Disabled State */
	.glass-button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Loading State */
	.glass-button--loading {
		cursor: wait;
		pointer-events: none;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.glass-button--sm {
			min-height: 44px; /* Larger touch targets on mobile */
			padding: 0.75rem 1.25rem;
		}
		
		.glass-button--md {
			min-height: 48px;
			padding: 1rem 1.75rem;
		}
		
		.glass-button--lg {
			min-height: 56px;
			padding: 1.25rem 2.25rem;
		}
		
		/* Disable hover effects on touch devices */
		.glass-button:hover {
			transform: none;
		}
		
		/* Enhanced active state for touch feedback */
		.glass-button:active:not(.glass-button--disabled) {
			transform: scale(0.95);
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.glass-button {
			border-width: 2px;
			background: rgba(255, 255, 255, 0.15);
		}
		
		.glass-button:focus-visible {
			outline-width: 3px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.glass-button {
			transition: none;
		}
		
		.glass-button:hover,
		.glass-button:active {
			transform: none;
		}
		
		.loading-spinner {
			animation: none;
		}
	}

	/* Light Mode Adjustments */
	@media (prefers-color-scheme: light) {
		.glass-button--primary {
			background: rgba(255, 255, 255, 0.7);
			border-color: rgba(0, 0, 0, 0.1);
			color: #1e293b;
		}
		
		.glass-button--secondary {
			background: rgba(255, 255, 255, 0.5);
			border-color: rgba(0, 0, 0, 0.05);
			color: #1e293b;
		}
		
		.glass-button--accent {
			background: rgba(59, 130, 246, 0.1);
			border-color: rgba(59, 130, 246, 0.2);
			color: #2563eb;
		}
		
		.glass-button--subtle {
			background: rgba(255, 255, 255, 0.3);
			border-color: rgba(0, 0, 0, 0.05);
			color: #1e293b;
		}
	}

	/* Fallback for browsers without backdrop-filter support */
	@supports not (backdrop-filter: blur(1px)) {
		.glass-button--primary {
			background: rgba(30, 27, 75, 0.9);
		}
		
		.glass-button--secondary {
			background: rgba(20, 20, 40, 0.9);
		}
		
		.glass-button--accent {
			background: rgba(59, 130, 246, 0.2);
		}
		
		.glass-button--subtle {
			background: rgba(255, 255, 255, 0.05);
		}
	}
</style>