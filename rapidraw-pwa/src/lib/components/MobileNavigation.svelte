<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let { open = $bindable(false) } = $props();

	const dispatch = createEventDispatcher();

	// Navigation items
	const navItems = [
		{ id: 'editor', label: 'Editor', icon: 'edit', href: '/' },
		{ id: 'library', label: 'Library', icon: 'folder', href: '/library' },
		{ id: 'presets', label: 'Presets', icon: 'palette', href: '/presets' },
		{ id: 'export', label: 'Export', icon: 'download', href: '/export' },
		{ id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' }
	];

	function closeDrawer() {
		open = false;
		dispatch('close');
	}

	function handleOverlayClick() {
		closeDrawer();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDrawer();
		}
	}

	// Handle swipe to close
	let touchStartX = 0;

	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event: TouchEvent) {
		const touchEndX = event.changedTouches[0].clientX;
		const deltaX = touchEndX - touchStartX;

		// Swipe left to close (minimum 100px swipe)
		if (deltaX < -100) {
			closeDrawer();
		}
	}

	function getIconSvg(iconName: string) {
		const icons = {
			edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5-3 3L22 12l-5.5-5.5z"></path>',
			folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
			palette: '<circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>',
			download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
			settings: '<circle cx="12" cy="12" r="3"></circle><path d="m12 1 2.09 3.26L18 4l-1 3.73L21 9l-3.26 2.09L18 15l-3.73-1L12 18l-2.09-3.26L6 15l1-3.73L3 9l3.26-2.09L6 3l3.73 1L12 1z"></path>'
		};
		return icons[iconName] || '';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Navigation Drawer -->
<nav 
	class="navigation-drawer"
	class:open
	data-testid="navigation-drawer"
	aria-hidden={!open}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
>
	<div class="drawer-content" data-testid="mobile-navigation">
		<!-- Drawer Header -->
		<div class="drawer-header">
			<h2 class="drawer-title">RapiDraw</h2>
			<button 
				class="close-button"
				on:click={closeDrawer}
				aria-label="Close navigation"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>

		<!-- Navigation Items -->
		<ul class="nav-list">
			{#each navItems as item}
				<li class="nav-item">
					<a 
						href={item.href}
						class="nav-link"
						data-testid="nav-item"
						on:click={closeDrawer}
					>
						<svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							{@html getIconSvg(item.icon)}
						</svg>
						<span class="nav-label">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<!-- Drawer Footer -->
		<div class="drawer-footer">
			<div class="app-version">v1.0.0</div>
		</div>
	</div>
</nav>

<!-- Overlay -->
{#if open}
	<div 
		class="drawer-overlay"
		data-testid="drawer-overlay"
		on:click={handleOverlayClick}
		on:keydown={(e) => e.key === 'Enter' && handleOverlayClick()}
		role="button"
		tabindex="0"
		aria-label="Close navigation"
	></div>
{/if}

<style>
	.navigation-drawer {
		position: fixed;
		top: 0;
		left: 0;
		width: 280px;
		height: 100vh;
		background: rgba(15, 15, 35, 0.95);
		backdrop-filter: blur(20px);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		transform: translateX(-100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1000;
		overflow-y: auto;
		padding-top: var(--safe-area-inset-top);
		padding-bottom: var(--safe-area-inset-bottom);
		padding-left: var(--safe-area-inset-left);
	}

	.navigation-drawer.open {
		transform: translateX(0);
	}

	.drawer-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 1rem;
	}

	.drawer-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: white;
	}

	.close-button {
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

	.close-button:hover,
	.close-button:focus {
		background: rgba(255, 255, 255, 0.1);
	}

	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		flex: 1;
	}

	.nav-item {
		margin-bottom: 0.5rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		padding: 1rem;
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		border-radius: 12px;
		transition: all 0.2s ease;
		min-height: 44px;
		font-weight: 500;
	}

	.nav-link:hover,
	.nav-link:focus {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transform: translateX(4px);
	}

	.nav-link:active {
		background: rgba(255, 255, 255, 0.2);
		transform: translateX(2px) scale(0.98);
	}

	.nav-icon {
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.nav-label {
		font-size: 1rem;
	}

	.drawer-footer {
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.app-version {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.875rem;
	}

	.drawer-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		cursor: pointer;
	}

	/* Smooth scrolling for drawer content */
	.navigation-drawer {
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.navigation-drawer::-webkit-scrollbar {
		display: none;
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.navigation-drawer {
			border-right-width: 2px;
		}
		
		.nav-link {
			border: 1px solid transparent;
		}
		
		.nav-link:focus {
			border-color: currentColor;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.navigation-drawer,
		.nav-link {
			transition: none;
		}
	}

	/* Landscape orientation adjustments */
	@media (orientation: landscape) and (max-height: 500px) {
		.drawer-content {
			padding: 0.5rem;
		}
		
		.nav-link {
			padding: 0.75rem;
		}
	}
</style>