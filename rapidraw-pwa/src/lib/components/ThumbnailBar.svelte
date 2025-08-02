<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ImageFile } from '$lib/stores/folderStore';
	import uiStore from '$lib/stores/uiStore';
	import './ThumbnailBar.css';

	interface Props {
		images: ImageFile[];
		selectedImage: ImageFile | null;
	}

	let { images, selectedImage }: Props = $props();

	const dispatch = createEventDispatcher();
	const { toolbarCollapsed, viewport } = uiStore;

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
						{#if !$viewport.isMobile}
							<span class="thumbnail-size">{formatFileSize(image.size)}</span>
						{/if}
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

		<!-- Scroll indicators - hidden on mobile -->
		{#if !$viewport.isMobile}
			<div class="scroll-indicators">
				<button 
					class="scroll-btn scroll-left glass-button"
					onclick={() => scrollContainer.scrollBy({ left: -200, behavior: 'smooth' })}
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
					class:toolbar-collapsed={$toolbarCollapsed}
					onclick={() => scrollContainer.scrollBy({ left: 200, behavior: 'smooth' })}
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
	{/if}
</div>
