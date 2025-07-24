<script lang="ts">
	import { folderStore, currentImages, isLoadingImages } from '$lib/stores/folderStore';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import uiStore from '$lib/stores/uiStore';
	const { toolbarCollapsed } = uiStore;
	import FolderSidebar from './FolderSidebar.svelte';
	import ImageViewer from './ImageViewer.svelte';
	import ThumbnailBar from './ThumbnailBar.svelte';
	import Toolbar from './Toolbar.svelte';
	import type { ImageFile } from '$lib/stores/folderStore';

	// Gallery state
	const selectedImage = writable<ImageFile | null>(null);
	const sidebarCollapsed = writable(false);
	const isMobile = writable(false);

	let galleryContainer: HTMLElement;

	onMount(() => {
		// Check if we're on mobile
		const checkMobile = () => {
			isMobile.set(window.innerWidth < 768);
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Auto-collapse sidebar on mobile
		const unsubscribeMobile = isMobile.subscribe(mobile => {
			if (mobile) {
				sidebarCollapsed.set(true);
			}
		});

		// Select first image when images load
		const unsubscribeImages = currentImages.subscribe(images => {
			if (images.length > 0 && !$selectedImage) {
				selectedImage.set(images[0]);
			}
		});

		return () => {
			window.removeEventListener('resize', checkMobile);
			unsubscribeMobile();
			unsubscribeImages();
		};
	});

	function handleImageSelect(image: ImageFile) {
		selectedImage.set(image);
	}

	function handlePreviousImage() {
		const images = $currentImages;
		const current = $selectedImage;
		if (!current || images.length === 0) return;

		const currentIndex = images.findIndex(img => img.path === current.path);
		const previousIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
		selectedImage.set(images[previousIndex]);
	}

	function handleNextImage() {
		const images = $currentImages;
		const current = $selectedImage;
		if (!current || images.length === 0) return;

		const currentIndex = images.findIndex(img => img.path === current.path);
		const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
		selectedImage.set(images[nextIndex]);
	}

	function toggleSidebar() {
		sidebarCollapsed.update(collapsed => !collapsed);
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.target instanceof HTMLInputElement) return;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				handlePreviousImage();
				break;
			case 'ArrowRight':
				event.preventDefault();
				handleNextImage();
				break;
			case 'Escape':
				if (!$sidebarCollapsed) {
					sidebarCollapsed.set(true);
				}
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="gallery-layout" bind:this={galleryContainer}>
	<!-- Loading Overlay -->
	{#if $isLoadingImages}
		<div class="loading-overlay glass-modal">
			<div class="loading-content">
				<div class="loading-spinner"></div>
				<p>Loading images...</p>
			</div>
		</div>
	{/if}

	<!-- Sidebar -->
	<div class="sidebar-container" class:collapsed={$sidebarCollapsed}>
		<FolderSidebar 
			{folderStore}
			collapsed={$sidebarCollapsed}
			on:toggle={toggleSidebar}
		/>
	</div>

	<!-- Main Content Area -->
	<div class="main-content" class:sidebar-collapsed={$sidebarCollapsed}>
		<!-- Top Section: Image Viewer -->
		<div class="image-viewer-container">
			<ImageViewer 
				image={$selectedImage}
				on:previous={handlePreviousImage}
				on:next={handleNextImage}
				showNavigation={$currentImages.length > 1}
			/>
		</div>

		<!-- Bottom Section: Thumbnails -->
		<div class="thumbnails-container">
			<ThumbnailBar 
				images={$currentImages}
				selectedImage={$selectedImage}
				on:select={(event) => handleImageSelect(event.detail)}
			/>
		</div>
	</div>

	<!-- Toolbar -->
	<div class="toolbar-container" class:mobile={$isMobile} class:collapsed={$toolbarCollapsed}>
		<Toolbar 
			selectedImage={$selectedImage}
			mobile={$isMobile}
		/>
	</div>

	<!-- Mobile Sidebar Toggle Button -->
	{#if $isMobile}
		<button 
			class="mobile-sidebar-toggle glass-button touch-target"
			on:click={toggleSidebar}
			aria-label={$sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
		>
			<svg 
				width="24" 
				height="24" 
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2"
			>
				{#if $sidebarCollapsed}
					<path d="M3 12h18m-9-9l9 9-9 9"/>
				{:else}
					<path d="M21 12H3m18-9l-9 9 9 9"/>
				{/if}
			</svg>
		</button>
	{/if}
</div>

<style>


	.gallery-layout {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: 1fr auto;
		grid-template-areas: 
			"sidebar main toolbar"
			"sidebar thumbnails toolbar";
		height: 100vh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		color: white;
		overflow: hidden;
		position: relative;
	}

	.sidebar-container {
		grid-area: sidebar;
		width: 280px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 100;
	}

	.sidebar-container.collapsed {
		width: 60px;
		overflow: visible;
	}

	.main-content {
		grid-area: main / main / thumbnails / toolbar;
		display: flex;
		flex-direction: column;
		min-width: 0;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.image-viewer-container {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.thumbnails-container {
		height: 120px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.toolbar-container {
		grid-area: toolbar;
		width: 320px;
		background: rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		transition: width 0.3s ease;
	}

	.toolbar-container.collapsed {
		width: 60px;
	}

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.5);
	}

	.loading-content {
		text-align: center;
		padding: 2rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top: 4px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.mobile-sidebar-toggle {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 200;
		padding: 0.75rem;
		border: none;
		color: white;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	/* Mobile Layout */
	@media (max-width: 768px) {
		.gallery-layout {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr auto auto;
			grid-template-areas: 
				"main"
				"thumbnails"
				"toolbar";
		}

		.sidebar-container {
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			width: 280px;
			z-index: 150;
			background: rgba(0, 0, 0, 0.9);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			transform: translateX(-100%);
		}

		.sidebar-container:not(.collapsed) {
			transform: translateX(0);
		}

		.main-content {
			grid-area: main;
		}

		.thumbnails-container {
			grid-area: thumbnails;
			height: 100px;
		}

		.toolbar-container {
			grid-area: toolbar;
			width: 100%;
			height: auto;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
		}

		.toolbar-container.mobile {
			background: rgba(0, 0, 0, 0.2);
		}

		.image-viewer-container {
			padding: 0.5rem;
		}
	}

	/* Tablet Layout */
	@media (min-width: 769px) and (max-width: 1024px) {
		.gallery-layout {
			grid-template-columns: auto 1fr;
			grid-template-rows: 1fr auto auto;
			grid-template-areas: 
				"sidebar main"
				"sidebar thumbnails"
				"toolbar toolbar";
		}

		.sidebar-container {
			width: 250px;
		}

		.toolbar-container {
			grid-area: toolbar;
			width: 100%;
			height: auto;
			border-left: none;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
			display: flex;
			justify-content: center;
		}

		.thumbnails-container {
			height: 100px;
		}
	}

	/* Large screens */
	@media (min-width: 1400px) {
		.sidebar-container {
			width: 320px;
		}

		.toolbar-container {
			width: 360px;
		}

		.thumbnails-container {
			height: 140px;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.gallery-layout {
			background: #000;
		}

		.thumbnails-container,
		.toolbar-container {
			border-color: #fff;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.sidebar-container,
		.main-content {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}
</style>
