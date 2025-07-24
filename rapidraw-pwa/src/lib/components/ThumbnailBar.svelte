<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ImageFile } from '$lib/stores/folderStore';

	interface Props {
		images: ImageFile[];
		selectedImage: ImageFile | null;
	}

	let { images, selectedImage }: Props = $props();

	const dispatch = createEventDispatcher();

	let scrollContainer: HTMLElement;
	let isDragging = $state(false);
	let startX = $state(0);
	let scrollLeft = $state(0);

	function handleImageSelect(image: ImageFile) {
		dispatch('select', image);
		
		// Scroll selected thumbnail into view
		setTimeout(() => {
			const selectedThumbnail = scrollContainer?.querySelector('.thumbnail.selected') as HTMLElement;
			if (selectedThumbnail && scrollContainer) {
				const containerRect = scrollContainer.getBoundingClientRect();
				const thumbnailRect = selectedThumbnail.getBoundingClientRect();
				
				if (thumbnailRect.left < containerRect.left || thumbnailRect.right > containerRect.right) {
					selectedThumbnail.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'nearest', 
						inline: 'center' 
					});
				}
			}
		}, 100);
	}

	// Mouse drag scrolling
	function handleMouseDown(event: MouseEvent) {
		isDragging = true;
		startX = event.pageX - scrollContainer.offsetLeft;
		scrollLeft = scrollContainer.scrollLeft;
		scrollContainer.style.cursor = 'grabbing';
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		event.preventDefault();
		const x = event.pageX - scrollContainer.offsetLeft;
		const walk = (x - startX) * 2;
		scrollContainer.scrollLeft = scrollLeft - walk;
	}

	function handleMouseUp() {
		isDragging = false;
		if (scrollContainer) {
			scrollContainer.style.cursor = 'grab';
		}
	}

	function handleMouseLeave() {
		isDragging = false;
		if (scrollContainer) {
			scrollContainer.style.cursor = 'grab';
		}
	}

	// Touch scrolling support
	let touchStartX = 0;
	let touchScrollLeft = 0;

	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.touches[0].clientX;
		touchScrollLeft = scrollContainer.scrollLeft;
	}

	function handleTouchMove(event: TouchEvent) {
		const touchX = event.touches[0].clientX;
		const walk = (touchStartX - touchX) * 2;
		scrollContainer.scrollLeft = touchScrollLeft + walk;
	}

	// Scroll with arrow keys
	function handleKeydown(event: KeyboardEvent) {
		if (!selectedImage || images.length === 0) return;

		const currentIndex = images.findIndex(img => img.path === selectedImage.path);
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
				break;
			case 'ArrowRight':
				event.preventDefault();
				newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = images.length - 1;
				break;
		}

		if (newIndex !== currentIndex) {
			handleImageSelect(images[newIndex]);
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
		return Math.round(bytes / (1024 * 1024)) + ' MB';
	}
</script>

<svelte:window 
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:keydown={handleKeydown}
/>

<div class="thumbnail-bar">
	{#if images.length === 0}
		<div class="empty-thumbnails">
			<svg 
				class="empty-icon" 
				width="32" 
				height="32" 
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="1.5"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
				<circle cx="9" cy="9" r="2"/>
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
			</svg>
			<p class="empty-text">No images found in this folder</p>
		</div>
	{:else}
		<div 
			class="thumbnails-scroll"
			bind:this={scrollContainer}
			on:mousedown={handleMouseDown}
			on:mouseleave={handleMouseLeave}
			on:touchstart={handleTouchStart}
			on:touchmove={handleTouchMove}
			role="listbox"
			aria-label="Image thumbnails"
			tabindex="0"
		>
			{#each images as image, index (image.path)}
				<div 
					class="thumbnail glass-thumbnail"
					class:selected={selectedImage?.path === image.path}
					role="option"
					aria-selected={selectedImage?.path === image.path}
					tabindex="0"
					on:click={() => handleImageSelect(image)}
					on:keydown={(e) => e.key === 'Enter' && handleImageSelect(image)}
				>
					<div class="thumbnail-image-container">
						{#if image.thumbnail}
							<img 
								src={image.thumbnail} 
								alt={image.name}
								class="thumbnail-image"
								loading="lazy"
								draggable="false"
							/>
						{:else}
							<div class="thumbnail-placeholder">
								<svg 
									width="24" 
									height="24" 
									viewBox="0 0 24 24" 
									fill="none" 
									stroke="currentColor" 
									stroke-width="2"
								>
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
									<circle cx="9" cy="9" r="2"/>
									<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
								</svg>
							</div>
						{/if}
					</div>
					
					<div class="thumbnail-info">
						<span class="thumbnail-name">{image.name}</span>
						<span class="thumbnail-size">{formatFileSize(image.size)}</span>
					</div>

					<!-- Selection indicator -->
					{#if selectedImage?.path === image.path}
						<div class="selection-indicator">
							<svg 
								width="16" 
								height="16" 
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								stroke-width="3"
							>
								<path d="m9 12 2 2 4-4"/>
							</svg>
						</div>
					{/if}

					<!-- Image index -->
					<div class="thumbnail-index">
						{index + 1}
					</div>
				</div>
			{/each}
		</div>

		<!-- Scroll indicators -->
		<div class="scroll-indicators">
			<button 
				class="scroll-btn scroll-left glass-button"
				on:click={() => scrollContainer.scrollBy({ left: -200, behavior: 'smooth' })}
				aria-label="Scroll left"
			>
				<svg 
					width="16" 
					height="16" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2"
				>
					<path d="m15 18-6-6 6-6"/>
				</svg>
			</button>

			<div class="image-counter">
				{#if selectedImage}
					{images.findIndex(img => img.path === selectedImage.path) + 1} of {images.length}
				{:else}
					{images.length} images
				{/if}
			</div>

			<button 
				class="scroll-btn scroll-right glass-button"
				on:click={() => scrollContainer.scrollBy({ left: 200, behavior: 'smooth' })}
				aria-label="Scroll right"
			>
				<svg 
					width="16" 
					height="16" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2"
				>
					<path d="m9 18 6-6-6-6"/>
				</svg>
			</button>
		</div>
	{/if}
</div>

<style>
	@import '$lib/styles/glassmorphism.css';

	.thumbnail-bar {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.2);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.empty-thumbnails {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.6);
		text-align: center;
		padding: 2rem;
	}

	.empty-icon {
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 0.9rem;
		margin: 0;
	}

	.thumbnails-scroll {
		flex: 1;
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		overflow-x: auto;
		overflow-y: hidden;
		cursor: grab;
		scroll-behavior: smooth;
	}

	.thumbnails-scroll:active {
		cursor: grabbing;
	}

	.thumbnail {
		position: relative;
		flex-shrink: 0;
		width: 80px;
		height: 80px;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.thumbnail:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.05);
	}

	.thumbnail.selected {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
		transform: scale(1.1);
	}

	.thumbnail-image-container {
		width: 100%;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 6px 6px 0 0;
		background: rgba(0, 0, 0, 0.2);
	}

	.thumbnail-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
		-webkit-user-drag: none;
	}

	.thumbnail-placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.thumbnail-info {
		padding: 0.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		height: 20px;
		overflow: hidden;
	}

	.thumbnail-name {
		font-size: 0.7rem;
		font-weight: 500;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		line-height: 1;
	}

	.thumbnail-size {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1;
		margin-top: 0.125rem;
	}

	.selection-indicator {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		width: 20px;
		height: 20px;
		background: rgba(59, 130, 246, 0.9);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.thumbnail-index {
		position: absolute;
		top: 0.25rem;
		left: 0.25rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 0.6rem;
		font-weight: 600;
		padding: 0.125rem 0.25rem;
		border-radius: 4px;
		line-height: 1;
	}

	.scroll-indicators {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.scroll-btn {
		padding: 0.5rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.scroll-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.image-counter {
		font-size: 0.8rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
	}

	/* Custom scrollbar */
	.thumbnails-scroll::-webkit-scrollbar {
		height: 4px;
	}

	.thumbnails-scroll::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.thumbnails-scroll::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
	}

	.thumbnails-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.thumbnail {
			width: 70px;
			height: 70px;
		}

		.thumbnail-image-container {
			height: 50px;
		}

		.thumbnails-scroll {
			padding: 0.5rem;
			gap: 0.375rem;
		}

		.scroll-indicators {
			padding: 0.375rem 0.5rem;
		}

		.image-counter {
			font-size: 0.75rem;
		}

		.scroll-btn {
			padding: 0.375rem;
		}

		.thumbnail-name {
			font-size: 0.65rem;
		}

		.thumbnail-size {
			font-size: 0.55rem;
		}
	}

	/* Tablet styles */
	@media (min-width: 769px) and (max-width: 1024px) {
		.thumbnail {
			width: 90px;
			height: 90px;
		}

		.thumbnail-image-container {
			height: 70px;
		}
	}

	/* Large screens */
	@media (min-width: 1400px) {
		.thumbnail {
			width: 100px;
			height: 100px;
		}

		.thumbnail-image-container {
			height: 80px;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.thumbnail {
			border: 2px solid rgba(255, 255, 255, 0.5);
		}

		.thumbnail.selected {
			border-color: #3b82f6;
		}

		.scroll-indicators {
			border-top-color: white;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.thumbnail {
			transition: none;
		}

		.thumbnails-scroll {
			scroll-behavior: auto;
		}
	}

	/* Focus styles for accessibility */
	.thumbnail:focus {
		outline: 2px solid rgba(59, 130, 246, 0.8);
		outline-offset: 2px;
	}

	.thumbnails-scroll:focus {
		outline: 2px solid rgba(59, 130, 246, 0.8);
		outline-offset: -2px;
	}
</style>
