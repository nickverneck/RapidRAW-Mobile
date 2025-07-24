<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		title: string;
		isOpen?: boolean;
		isContentVisible?: boolean;
		canToggleVisibility?: boolean;
		variant?: 'primary' | 'secondary' | 'subtle';
		class?: string;
	}

	let {
		title,
		isOpen = $bindable(false),
		isContentVisible = $bindable(true),
		canToggleVisibility = true,
		variant = 'primary',
		class: className = '',
		children
	}: Props = $props();

	const dispatch = createEventDispatcher();

	let isHovering = $state(false);
	let hoverTimeout: number | null = null;
	let contentElement: HTMLDivElement;

	// Computed classes following glassmorphism design
	let sectionClasses = $derived(`
		glass-collapsible-section
		glass-collapsible-section--${variant}
		${isOpen ? 'glass-collapsible-section--open' : ''}
		${className}
	`.trim().replace(/\s+/g, ' '));

	function handleToggle() {
		isOpen = !isOpen;
		dispatch('toggle', { isOpen });
		
		// Haptic feedback on mobile
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(25);
		}
	}

	function handleVisibilityToggle(event: MouseEvent) {
		event.stopPropagation();
		isContentVisible = !isContentVisible;
		dispatch('visibilityToggle', { isContentVisible });
		
		// Haptic feedback on mobile
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(50);
		}
	}

	function handleMouseEnter() {
		if (!canToggleVisibility) return;
		hoverTimeout = window.setTimeout(() => {
			isHovering = true;
		}, 500);
	}

	function handleMouseLeave() {
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
		isHovering = false;
	}

	function handleContextMenu(event: MouseEvent) {
		dispatch('contextmenu', event);
	}

	// Cleanup timeout on unmount
	onMount(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
		};
	});

	// Icon components
	function ChevronDownIcon() {
		return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="m6 9 6 6 6-6"/>
		</svg>`;
	}

	function EyeIcon() {
		return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
			<circle cx="12" cy="12" r="3"/>
		</svg>`;
	}

	function EyeOffIcon() {
		return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
			<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
			<path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
			<line x1="2" x2="22" y1="2" y2="22"/>
		</svg>`;
	}
</script>

<div
	class={sectionClasses}
	oncontextmenu={handleContextMenu}
	role="region"
	aria-labelledby="section-header"
>
	<div
		class="glass-section-header"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		role="presentation"
	>
		<button
			id="section-header"
			class="glass-section-toggle"
			onclick={handleToggle}
			aria-expanded={isOpen}
			aria-controls="section-content"
		>
			<h3 class="glass-section-title">{title}</h3>
			<div 
				class="glass-section-chevron {isOpen ? 'glass-section-chevron--open' : ''}"
			>
				{@html ChevronDownIcon()}
			</div>
		</button>
		
		{#if canToggleVisibility}
			<div class="glass-visibility-container">
				<button
					class="glass-visibility-toggle {(isHovering || !isContentVisible) ? 'glass-visibility-toggle--visible' : 'glass-visibility-toggle--hidden'}"
					title={isContentVisible ? 'Preview disabled section' : 'Enable section'}
					onclick={handleVisibilityToggle}
					tabindex={isHovering || !isContentVisible ? 0 : -1}
				>
					{@html isContentVisible ? EyeIcon() : EyeOffIcon()}
				</button>
			</div>
		{/if}
	</div>
	
	{#if isOpen}
		<div
			id="section-content"
			class="glass-section-content {!isContentVisible ? 'glass-section-content--disabled' : ''}"
			bind:this={contentElement}
			transition:slide={{ duration: 300, easing: quintOut }}
		>
			<div class="glass-section-inner">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Glass Collapsible Section */
	.glass-collapsible-section {
		border-radius: 16px;
		overflow: hidden;
		flex-shrink: 0;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		
		/* Glassmorphism base */
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Variant Styles */
	.glass-collapsible-section--primary {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.glass-collapsible-section--secondary {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.glass-collapsible-section--subtle {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	/* Open State */
	.glass-collapsible-section--open {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	/* Glass Section Header */
	.glass-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		transition: background-color 0.2s ease;
		min-height: 52px;
		
		/* Touch optimization */
		touch-action: manipulation;
	}

	.glass-section-header:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	/* Glass Section Toggle Button */
	.glass-section-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		padding: 0;
		color: inherit;
		
		/* Focus styles */
		outline: none;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.glass-section-toggle:focus-visible {
		outline: 2px solid rgba(59, 130, 246, 0.5);
		outline-offset: 2px;
	}

	.glass-section-toggle:hover {
		background: rgba(255, 255, 255, 0.03);
		padding: 0.5rem;
		margin: -0.5rem;
		border-radius: 8px;
	}

	/* Glass Section Title */
	.glass-section-title {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--text-primary, white);
		margin: 0;
		flex: 1;
		
		/* Text shadow for glassmorphism effect */
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Glass Section Chevron */
	.glass-section-chevron {
		margin-left: 1rem;
		color: rgba(59, 130, 246, 0.8);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.glass-section-chevron--open {
		transform: rotate(180deg);
	}

	/* Glass Visibility Container */
	.glass-visibility-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		margin-left: 0.5rem;
		flex-shrink: 0;
	}

	/* Glass Visibility Toggle */
	.glass-visibility-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--text-secondary, rgba(255, 255, 255, 0.6));
		
		/* Focus styles */
		outline: none;
	}

	.glass-visibility-toggle:focus-visible {
		outline: 2px solid rgba(59, 130, 246, 0.5);
		outline-offset: 2px;
	}

	.glass-visibility-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		color: var(--text-primary, white);
		transform: scale(1.05);
	}

	.glass-visibility-toggle:active {
		transform: scale(0.95);
	}

	/* Visibility States */
	.glass-visibility-toggle--visible {
		opacity: 1;
		pointer-events: auto;
	}

	.glass-visibility-toggle--hidden {
		opacity: 0;
		pointer-events: none;
	}

	/* Glass Section Content */
	.glass-section-content {
		transition: opacity 0.3s ease;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	.glass-section-content--disabled {
		opacity: 0.3;
		pointer-events: none;
	}

	/* Glass Section Inner */
	.glass-section-inner {
		padding: 1.5rem;
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.glass-section-header {
			min-height: 56px; /* Larger touch target on mobile */
			padding: 1rem;
		}
		
		.glass-section-inner {
			padding: 1rem;
		}
		
		.glass-section-toggle:hover {
			background: transparent;
			padding: 0;
			margin: 0;
		}
		
		.glass-visibility-toggle {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		/* Disable hover effects on touch devices */
		.glass-section-header:hover {
			background: transparent;
		}
		
		/* Enhanced active state for touch feedback */
		.glass-section-toggle:active {
			background: rgba(255, 255, 255, 0.05);
			transform: scale(0.98);
		}
		
		.glass-visibility-toggle:active {
			background: rgba(255, 255, 255, 0.15);
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.glass-collapsible-section {
			border-width: 2px;
			background: rgba(255, 255, 255, 0.1);
		}
		
		.glass-section-header:hover {
			background: rgba(255, 255, 255, 0.15);
		}
		
		.glass-section-toggle:focus-visible {
			outline-width: 3px;
		}
		
		.glass-visibility-toggle {
			border-width: 2px;
		}
		
		.glass-visibility-toggle:focus-visible {
			outline-width: 3px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.glass-collapsible-section,
		.glass-section-header,
		.glass-section-toggle,
		.glass-section-chevron,
		.glass-section-content,
		.glass-visibility-toggle {
			transition: none;
		}
		
		.glass-section-chevron--open {
			transform: rotate(180deg);
		}
		
		.glass-section-toggle:hover,
		.glass-visibility-toggle:hover,
		.glass-visibility-toggle:active {
			transform: none;
		}
	}

	/* Light Mode Adjustments */
	@media (prefers-color-scheme: light) {
		.glass-collapsible-section--primary {
			background: rgba(255, 255, 255, 0.7);
			border-color: rgba(0, 0, 0, 0.1);
		}
		
		.glass-collapsible-section--secondary {
			background: rgba(255, 255, 255, 0.5);
			border-color: rgba(0, 0, 0, 0.08);
		}
		
		.glass-collapsible-section--subtle {
			background: rgba(255, 255, 255, 0.3);
			border-color: rgba(0, 0, 0, 0.05);
		}
		
		.glass-section-title {
			color: #1e293b;
			text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
		}
		
		.glass-section-chevron {
			color: #2563eb;
		}
		
		.glass-section-header:hover {
			background: rgba(0, 0, 0, 0.03);
		}
		
		.glass-section-toggle:hover {
			background: rgba(0, 0, 0, 0.02);
		}
		
		.glass-visibility-toggle {
			background: rgba(255, 255, 255, 0.7);
			border-color: rgba(0, 0, 0, 0.1);
			color: #6b7280;
		}
		
		.glass-visibility-toggle:hover {
			background: rgba(255, 255, 255, 0.9);
			border-color: rgba(0, 0, 0, 0.2);
			color: #1e293b;
		}
		
		.glass-section-content {
			border-top-color: rgba(0, 0, 0, 0.05);
		}
	}

	/* Fallback for browsers without backdrop-filter support */
	@supports not (backdrop-filter: blur(1px)) {
		.glass-collapsible-section--primary {
			background: rgba(30, 27, 75, 0.9);
		}
		
		.glass-collapsible-section--secondary {
			background: rgba(20, 20, 40, 0.9);
		}
		
		.glass-collapsible-section--subtle {
			background: rgba(255, 255, 255, 0.05);
		}
		
		.glass-visibility-toggle {
			background: rgba(30, 27, 75, 0.8);
		}
	}
</style>