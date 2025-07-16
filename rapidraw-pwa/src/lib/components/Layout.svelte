<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import MobileNavigation from './MobileNavigation.svelte';
	import TabletLayout from './TabletLayout.svelte';
	import DesktopNavigation from './DesktopNavigation.svelte';

	let { children } = $props();

	// Reactive breakpoint detection
	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let navigationOpen = $state(false);

	// Breakpoint definitions
	const breakpoints = {
		mobile: 768,
		tablet: 1024,
		desktop: 1280
	};

	// Computed layout type
	let layoutType = $derived.by(() => {
		if (innerWidth < breakpoints.mobile) return 'mobile';
		if (innerWidth < breakpoints.tablet) return 'tablet';
		return 'desktop';
	});

	let isMobile = $derived(layoutType === 'mobile');
	let isTablet = $derived(layoutType === 'tablet');
	let isDesktop = $derived(layoutType === 'desktop');

	// Handle navigation toggle
	function toggleNavigation() {
		navigationOpen = !navigationOpen;
	}

	function closeNavigation() {
		navigationOpen = false;
	}

	// Handle escape key to close navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && navigationOpen) {
			closeNavigation();
		}
	}

	// Handle swipe gestures for navigation
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	}

	function handleTouchEnd(event: TouchEvent) {
		if (!event.changedTouches[0]) return;
		
		const touchEndX = event.changedTouches[0].clientX;
		const touchEndY = event.changedTouches[0].clientY;
		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		// Only handle horizontal swipes
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
			if (deltaX > 0 && touchStartX < 50 && !navigationOpen) {
				// Swipe right from left edge - open navigation
				navigationOpen = true;
			} else if (deltaX < 0 && navigationOpen) {
				// Swipe left - close navigation
				navigationOpen = false;
			}
		}
	}

	onMount(() => {
		// Set up CSS custom properties for safe area insets
		const root = document.documentElement;
		root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
		root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
		root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
		root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
	});
</script>

<svelte:window 
	bind:innerWidth 
	bind:innerHeight 
	on:keydown={handleKeydown}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
/>

<div 
	class="main-layout responsive {layoutType}"
	data-testid="main-layout"
	class:navigation-open={navigationOpen}
>
	<!-- Mobile Layout -->
	{#if isMobile}
		<div class="mobile-layout" data-testid="mobile-layout">
			<!-- Mobile Header -->
			<header class="mobile-header">
				<button 
					class="menu-button"
					data-testid="menu-button"
					on:click={toggleNavigation}
					aria-label="Toggle navigation menu"
					aria-expanded={navigationOpen}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
				<h1 class="app-title">RapiDraw</h1>
			</header>

			<!-- Mobile Navigation Drawer -->
			<MobileNavigation 
				bind:open={navigationOpen}
				on:close={closeNavigation}
			/>

			<!-- Mobile Content -->
			<main class="mobile-content" data-testid="mobile-content">
				{@render children()}
			</main>
		</div>

	<!-- Tablet Layout -->
	{:else if isTablet}
		<div class="tablet-layout" data-testid="tablet-layout">
			<TabletLayout>
				{@render children()}
			</TabletLayout>
		</div>

	<!-- Desktop Layout -->
	{:else}
		<div class="desktop-layout" data-testid="desktop-layout">
			<!-- Desktop Navigation -->
			<DesktopNavigation />

			<!-- Desktop Content -->
			<main class="desktop-content" data-testid="desktop-content">
				{@render children()}
			</main>
		</div>
	{/if}

	<!-- Essential elements that should always be visible -->
	<div class="essential-elements" data-testid="essential-element">
		<!-- Core functionality indicators -->
	</div>

	<!-- Decorative elements hidden on small screens -->
	{#if !isMobile}
		<div class="decorative-elements" data-testid="decorative-element">
			<!-- Visual enhancements for larger screens -->
		</div>
	{/if}
</div>

<style>
	.main-layout {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: relative;
		background: var(--bg-primary, #0f0f23);
		color: var(--text-primary, #ffffff);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	/* Mobile Layout */
	.mobile-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding-top: var(--safe-area-inset-top);
		padding-bottom: var(--safe-area-inset-bottom);
		padding-left: var(--safe-area-inset-left);
		padding-right: var(--safe-area-inset-right);
	}

	.mobile-header {
		display: flex;
		align-items: center;
		padding: 1rem;
		background: rgba(30, 27, 75, 0.8);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 100;
	}

	.menu-button {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: white;
		cursor: pointer;
		border-radius: 8px;
		transition: background-color 0.2s ease;
	}

	.menu-button:hover,
	.menu-button:focus {
		background: rgba(255, 255, 255, 0.1);
	}

	.menu-button:active {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(0.95);
	}

	.app-title {
		margin-left: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.mobile-content {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	/* Tablet Layout */
	.tablet-layout {
		width: 100%;
		height: 100%;
	}

	/* Desktop Layout */
	.desktop-layout {
		display: flex;
		height: 100%;
	}

	.desktop-content {
		flex: 1;
		overflow: hidden;
	}

	/* Responsive utilities */
	.responsive {
		box-sizing: border-box;
	}

	.responsive *,
	.responsive *::before,
	.responsive *::after {
		box-sizing: inherit;
	}

	/* Prevent horizontal scrolling */
	.main-layout {
		overflow-x: hidden;
		max-width: 100vw;
	}

	/* Essential elements always visible */
	.essential-elements {
		position: absolute;
		top: 0;
		right: 1rem;
		z-index: 1000;
		pointer-events: none;
	}

	/* Decorative elements hidden on mobile */
	.decorative-elements {
		position: absolute;
		bottom: 2rem;
		right: 2rem;
		opacity: 0.3;
		pointer-events: none;
	}

	/* Breakpoint-specific styles */
	.mobile {
		--content-padding: 1rem;
		--panel-gap: 0.5rem;
	}

	.tablet {
		--content-padding: 1.5rem;
		--panel-gap: 1rem;
	}

	.desktop {
		--content-padding: 2rem;
		--panel-gap: 1.5rem;
	}

	/* Navigation open state */
	.navigation-open .mobile-content {
		pointer-events: none;
	}

	/* Smooth transitions */
	.main-layout {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.mobile-header {
			border-bottom-width: 2px;
		}
		
		.menu-button {
			border: 1px solid currentColor;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.main-layout,
		.menu-button {
			transition: none;
		}
	}

	/* Print styles */
	@media print {
		.mobile-header,
		.menu-button,
		.decorative-elements {
			display: none;
		}
	}
</style>