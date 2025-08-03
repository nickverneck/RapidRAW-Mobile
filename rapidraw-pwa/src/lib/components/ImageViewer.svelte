<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ImageFile } from '$lib/stores/folderStore';
	import { folderStore } from '$lib/stores/folderStore';
	import uiStore from '$lib/stores/uiStore';
	import StarRating from './StarRating.svelte';
	import FlagToggle from './FlagToggle.svelte';

	interface Props {
		image: ImageFile | null;
		showNavigation: boolean;
	}

	let { image, showNavigation = false }: Props = $props();

	const dispatch = createEventDispatcher();
	const { toolbarCollapsed, viewport, mobileToolState } = uiStore;

	let imageElement: HTMLImageElement;
	let containerElement: HTMLElement;
	let isLoading = $state(true);
	let hasError = $state(false);
	let scale = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);
	let isDragging = $state(false);
	let lastTouchDistance = $state(0);

	// Reset transform when image changes
	$effect(() => {
		if (image) {
			scale = 1;
			translateX = 0;
			translateY = 0;
			isLoading = true;
			hasError = false;
		}
	});

	function handleImageLoad() {
		isLoading = false;
		hasError = false;
	}

	function handleImageError() {
		isLoading = false;
		hasError = true;
	}

	function handlePrevious() {
		dispatch('previous');
	}

	function handleNext() {
		dispatch('next');
	}

	// Zoom functionality
	function handleWheel(event: WheelEvent) {
		event.preventDefault();

		const delta = event.deltaY > 0 ? -0.1 : 0.1;
		const newScale = Math.max(0.1, Math.min(5, scale + delta));

		if (newScale !== scale) {
			scale = newScale;
		}
	}

	function handleDoubleClick(event: MouseEvent) {
		event.preventDefault();

		if (scale === 1) {
			scale = 2;
			// Center zoom on click point
			const rect = containerElement.getBoundingClientRect();
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;
			const clickX = event.clientX - rect.left;
			const clickY = event.clientY - rect.top;

			translateX = (centerX - clickX) * scale;
			translateY = (centerY - clickY) * scale;
		} else {
			scale = 1;
			translateX = 0;
			translateY = 0;
		}
	}

	// Pan functionality
	let startX = 0;
	let startY = 0;
	let startTranslateX = 0;
	let startTranslateY = 0;

	function handleMouseDown(event: MouseEvent) {
		if (scale <= 1) return;

		isDragging = true;
		startX = event.clientX;
		startY = event.clientY;
		startTranslateX = translateX;
		startTranslateY = translateY;

		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || scale <= 1) return;

		const deltaX = event.clientX - startX;
		const deltaY = event.clientY - startY;

		translateX = startTranslateX + deltaX;
		translateY = startTranslateY + deltaY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Touch support for mobile
	function handleTouchStart(event: TouchEvent) {
		if (event.touches.length === 1) {
			const touch = event.touches[0];
			startX = touch.clientX;
			startY = touch.clientY;

			if (scale > 1) {
				// Single touch for panning when zoomed
				startTranslateX = translateX;
				startTranslateY = translateY;
				isDragging = true;
			}
		} else if (event.touches.length === 2) {
			// Two touches for pinch zoom
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const distance = Math.sqrt(
				Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
			);
			lastTouchDistance = distance;
		}

		event.preventDefault();
	}

	function handleTouchMove(event: TouchEvent) {
		if (event.touches.length === 1 && isDragging && scale > 1) {
			// Single touch panning
			const touch = event.touches[0];
			const deltaX = touch.clientX - startX;
			const deltaY = touch.clientY - startY;

			translateX = startTranslateX + deltaX;
			translateY = startTranslateY + deltaY;
		} else if (event.touches.length === 2) {
			// Pinch zoom
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			const distance = Math.sqrt(
				Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
			);

			if (lastTouchDistance > 0) {
				const scaleChange = distance / lastTouchDistance;
				const newScale = Math.max(0.1, Math.min(5, scale * scaleChange));
				scale = newScale;
			}

			lastTouchDistance = distance;
		}

		event.preventDefault();
	}

	function handleTouchEnd(event: TouchEvent) {
		if (event.changedTouches.length === 1 && scale === 1) {
			// Handle swipe navigation when not zoomed
			const touch = event.changedTouches[0];
			const deltaX = touch.clientX - startX;
			const deltaY = touch.clientY - startY;

			// Check if it's a horizontal swipe (more horizontal than vertical movement)
			const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50;

			if (isHorizontalSwipe) {
				if (deltaX > 0) {
					// Swipe right - go to previous image
					handlePrevious();
				} else {
					// Swipe left - go to next image
					handleNext();
				}
			}
		}

		isDragging = false;
		lastTouchDistance = 0;
	}

	function resetZoom() {
		scale = 1;
		translateX = 0;
		translateY = 0;
	}

	function zoomIn() {
		scale = Math.min(5, scale * 1.2);
	}

	function zoomOut() {
		scale = Math.max(0.1, scale / 1.2);
	}

	// Rating and flag handlers
	function handleRatingChange(event: CustomEvent<number>) {
		if (image) {
			folderStore.setImageRating(image.path, event.detail);
		}
	}

	function handleFlagToggle(event: CustomEvent<boolean>) {
		if (image) {
			folderStore.toggleImageFlag(image.path);
		}
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div
	class="image-viewer"
	bind:this={containerElement}
	onwheel={handleWheel}
	ondblclick={handleDoubleClick}
	onmousedown={handleMouseDown}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="img"
	tabindex="0"
>
	{#if image}
		<!-- Image Container -->
		<div
			class="image-container"
			style="transform: translate({translateX}px, {translateY}px) scale({scale})"
		>
			{#if isLoading}
				<div class="image-loading glass-loading">
					<div class="loading-spinner"></div>
				</div>
			{/if}

			{#if hasError}
				<div class="image-error glass-panel">
					<svg
						class="error-icon"
						width="48"
						height="48"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<circle cx="9" cy="9" r="2" />
						<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
					</svg>
					<p class="error-text">Failed to load image</p>
					<p class="error-subtext">{image.name}</p>
				</div>
			{:else}
				<img
					bind:this={imageElement}
					src={image.thumbnail}
					alt={image.name}
					class="main-image"
					onload={handleImageLoad}
					onerror={handleImageError}
					draggable="false"
				/>
			{/if}
		</div>

		<!-- Navigation Controls - Hidden on mobile, users can swipe to navigate -->
		{#if showNavigation && !$viewport.isMobile}
			<button
				class="nav-btn nav-prev glass-button touch-target"
				onclick={handlePrevious}
				aria-label="Previous image"
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="m15 18-6-6 6-6" />
				</svg>
			</button>

			<button
				class="nav-btn nav-next glass-button touch-target"
				class:toolbar-collapsed={$toolbarCollapsed}
				onclick={handleNext}
				aria-label="Next image"
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="m9 18 6-6-6-6" />
				</svg>
			</button>
		{/if}

		<!-- Zoom Controls - Hidden on mobile, users can use pinch-to-zoom -->
		<div class="zoom-controls glass-panel" class:mobile-hidden={$viewport.isMobile}>
			<button
				class="zoom-btn glass-button touch-target"
				onclick={zoomOut}
				disabled={scale <= 0.1}
				aria-label="Zoom out"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
					<path d="M8 11h6" />
				</svg>
			</button>

			<span class="zoom-level">{Math.round(scale * 100)}%</span>

			<button
				class="zoom-btn glass-button touch-target"
				onclick={zoomIn}
				disabled={scale >= 5}
				aria-label="Zoom in"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
					<path d="M11 8v6" />
					<path d="M8 11h6" />
				</svg>
			</button>

			{#if scale !== 1}
				<button
					class="reset-btn glass-button touch-target"
					onclick={resetZoom}
					aria-label="Reset zoom"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
						<path d="M21 3v5h-5" />
						<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
						<path d="M8 16H3v5" />
					</svg>
				</button>
			{/if}
		</div>

		<!-- Image Info -->
		<div
			class="image-info glass-panel"
			class:mobile-tool-hidden={$viewport.isMobile && $mobileToolState.isToolActive}
		>
			<div class="image-header">
				<h3 class="image-name">{image.name}</h3>
				<div class="image-controls">
					<StarRating rating={image.rating} size="small" on:ratingChange={handleRatingChange} />
					<FlagToggle flagged={image.flagged} size="small" on:toggle={handleFlagToggle} />
				</div>
			</div>
			{#if !$viewport.isMobile}
				<p class="image-details">
					{Math.round(image.size / 1024)} KB
				</p>
			{/if}
		</div>
	{:else}
		<!-- No Image Selected -->
		<div class="no-image glass-panel">
			<svg
				class="no-image-icon"
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
			<p class="no-image-text">Select an image to view</p>
		</div>
	{/if}
</div>

<style>
	.image-viewer {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		cursor: grab;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 12px;
	}

	.image-viewer:active {
		cursor: grabbing;
	}

	.image-container {
		position: relative;
		transition: transform 0.2s ease-out;
		transform-origin: center;
	}

	.main-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		user-select: none;
		-webkit-user-drag: none;
	}

	.image-loading {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.image-error {
		padding: 2rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.8);
	}

	.error-icon {
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.error-text {
		font-size: 1.1rem;
		font-weight: 500;
		margin: 0 0 0.5rem 0;
	}

	.error-subtext {
		font-size: 0.9rem;
		opacity: 0.7;
		margin: 0;
	}

	.no-image {
		padding: 3rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.6);
	}

	.no-image-icon {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-image-text {
		font-size: 1.1rem;
		margin: 0;
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		padding: 1rem;
		border: none;
		color: white;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		z-index: 10;
	}

	.nav-prev {
		left: 1rem;
	}

	.nav-next {
		/* Default position when toolbar is expanded (260px width) - moved further left */
		right: calc(260px + 2rem);
		transition: right 0.3s ease;
	}

	.nav-next.toolbar-collapsed {
		/* When toolbar is collapsed, position relative to 60px collapsed width - moved further left */
		right: calc(60px + 2rem);
	}

	.nav-btn:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	.zoom-controls {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		border-radius: 24px;
		z-index: 10;
	}

	.zoom-btn,
	.reset-btn {
		padding: 0.5rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zoom-btn:hover,
	.reset-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.zoom-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.zoom-level {
		font-size: 0.9rem;
		font-weight: 500;
		color: white;
		min-width: 50px;
		text-align: center;
	}

	.image-info {
		position: absolute;
		top: 1rem;
		left: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		border-radius: 8px;
		z-index: 10;
		max-width: 350px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		transform: translateY(0);
		opacity: 1;
	}

	.image-info.mobile-tool-hidden {
		transform: translateY(-100%);
		opacity: 0;
		pointer-events: none;
	}

	.image-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.image-name {
		font-size: 1rem;
		font-weight: 600;
		color: white;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.image-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.image-details {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
	}

	/* Hide zoom controls on mobile */
	.mobile-hidden {
		display: none !important;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		/* Hide zoom controls and navigation buttons on mobile as fallback */
		.zoom-controls,
		.nav-btn {
			display: none !important;
		}

		.nav-btn {
			padding: 0.75rem;
		}

		.nav-prev {
			left: 0.5rem;
		}

		.nav-next {
			right: 0.5rem;
		}

		.image-info {
			top: 0.5rem;
			left: 0.5rem;
			right: 0.5rem;
			max-width: none;
		}

		.image-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.image-name {
			font-size: 0.9rem;
		}

		.image-controls {
			align-self: flex-end;
		}

		.image-details {
			font-size: 0.75rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.image-container {
			transition: none;
		}

		.loading-spinner {
			animation: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.nav-btn,
		.zoom-controls,
		.image-info {
			background: rgba(0, 0, 0, 0.9);
			border: 1px solid white;
		}
	}
</style>
