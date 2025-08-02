<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		rating: number; // 0-5
		size?: 'small' | 'medium' | 'large';
		interactive?: boolean;
		showCount?: boolean;
	}

	let { 
		rating = 0, 
		size = 'medium', 
		interactive = true, 
		showCount = false 
	}: Props = $props();

	const dispatch = createEventDispatcher();

	let hoveredRating = $state(0);
	let isHovering = $state(false);

	function handleStarClick(starRating: number) {
		if (!interactive) return;
		
		// If clicking the same star that's already selected, set to 0
		const newRating = rating === starRating ? 0 : starRating;
		dispatch('ratingChange', newRating);
	}

	function handleStarHover(starRating: number) {
		if (!interactive) return;
		hoveredRating = starRating;
		isHovering = true;
	}

	function handleMouseLeave() {
		if (!interactive) return;
		isHovering = false;
		hoveredRating = 0;
	}

	function getStarSize() {
		switch (size) {
			case 'small': return 16;
			case 'large': return 24;
			default: return 20;
		}
	}

	function shouldStarBeFilled(starIndex: number): boolean {
		if (isHovering && interactive) {
			return starIndex <= hoveredRating;
		}
		return starIndex <= rating;
	}
</script>

<div 
	class="star-rating"
	class:interactive
	class:size-small={size === 'small'}
	class:size-medium={size === 'medium'}
	class:size-large={size === 'large'}
	onmouseleave={handleMouseLeave}
	role={interactive ? 'radiogroup' : 'img'}
	aria-label={interactive ? 'Rate this image' : `Rated ${rating} out of 5 stars`}
>
	{#each [1, 2, 3, 4, 5] as starIndex}
		<button
			class="star-button touch-target"
			class:filled={shouldStarBeFilled(starIndex)}
			class:hovered={isHovering && starIndex <= hoveredRating}
			disabled={!interactive}
			onclick={() => handleStarClick(starIndex)}
			onmouseenter={() => handleStarHover(starIndex)}
			aria-label="{starIndex} star{starIndex !== 1 ? 's' : ''}"
			role={interactive ? 'radio' : 'presentation'}
			aria-checked={interactive ? rating === starIndex : undefined}
		>
			<svg 
				class="star-icon"
				width={getStarSize()} 
				height={getStarSize()} 
				viewBox="0 0 24 24" 
				fill={shouldStarBeFilled(starIndex) ? "currentColor" : "none"}
				stroke="currentColor" 
				stroke-width="2"
			>
				<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
			</svg>
		</button>
	{/each}

	{#if showCount && rating > 0}
		<span class="rating-count">({rating})</span>
	{/if}
</div>

<style>
	.star-rating {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.star-rating.interactive {
		cursor: pointer;
	}

	.star-button {
		background: none;
		border: none;
		padding: 2px;
		cursor: pointer;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.star-button:disabled {
		cursor: default;
	}

	.star-button:not(:disabled):hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	.star-icon {
		color: rgba(255, 255, 255, 0.3);
		transition: color 0.2s ease;
	}

	.star-button.filled .star-icon {
		color: #fbbf24;
	}

	.star-button.hovered .star-icon {
		color: #fcd34d;
	}

	.rating-count {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		margin-left: 0.25rem;
		font-weight: 500;
	}

	/* Size variants */
	.size-small .star-button {
		padding: 1px;
	}

	.size-small .rating-count {
		font-size: 0.7rem;
	}

	.size-large .star-button {
		padding: 4px;
	}

	.size-large .rating-count {
		font-size: 0.9rem;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.star-rating {
			gap: 4px;
		}

		.star-button {
			padding: 4px;
			min-width: 32px;
			min-height: 32px;
		}

		.size-small .star-button {
			padding: 2px;
			min-width: 24px;
			min-height: 24px;
		}

		.size-large .star-button {
			padding: 6px;
			min-width: 40px;
			min-height: 40px;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.star-icon {
			stroke-width: 2.5;
		}

		.star-button.filled .star-icon {
			color: #f59e0b;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.star-button,
		.star-icon {
			transition: none;
		}

		.star-button:not(:disabled):hover {
			transform: none;
		}
	}

	/* Focus styles for accessibility */
	.star-button:focus {
		outline: 2px solid rgba(251, 191, 36, 0.8);
		outline-offset: 2px;
	}
</style>