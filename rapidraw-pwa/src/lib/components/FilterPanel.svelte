<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		minStarRating: number;
		showFlagged: boolean;
		isActive: boolean;
	}

	let { minStarRating = 0, showFlagged = false, isActive = false }: Props = $props();

	const dispatch = createEventDispatcher();

	function handleStarFilter(rating: number) {
		dispatch('starFilter', rating);
	}

	function handleFlagFilter() {
		dispatch('flagFilter', !showFlagged);
	}

	function clearFilters() {
		dispatch('clearFilters');
	}
</script>

<div class="filter-panel">
	<div class="filter-header">
		<h3 class="filter-title">Filters</h3>
		{#if isActive}
			<button 
				class="clear-filters-btn glass-button touch-target"
				onclick={clearFilters}
				aria-label="Clear all filters"
			>
				<svg 
					width="16" 
					height="16" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2"
				>
					<path d="m18 6-12 12"/>
					<path d="m6 6 12 12"/>
				</svg>
				Clear
			</button>
		{/if}
	</div>

	<!-- Star Rating Filter -->
	<div class="filter-section">
		<label class="filter-label">Minimum Stars</label>
		<div class="star-filter">
			{#each [0, 1, 2, 3, 4, 5] as rating}
				<button
					class="star-btn touch-target"
					class:active={minStarRating === rating}
					onclick={() => handleStarFilter(rating)}
					aria-label="{rating} stars or higher"
				>
					<div class="star-display">
						{#each Array(5) as _, index}
							<svg 
								class="star-icon"
								class:filled={index < rating}
								class:active-filter={index < minStarRating}
								width="16" 
								height="16" 
								viewBox="0 0 24 24" 
								fill={index < rating ? "currentColor" : "none"}
								stroke="currentColor" 
								stroke-width="2"
							>
								<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
							</svg>
						{/each}
					</div>
					<span class="star-label">{rating === 0 ? 'All' : `${rating}+`}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Flag Filter -->
	<div class="filter-section">
		<label class="filter-label">Show Only</label>
		<button
			class="flag-filter-btn glass-button touch-target"
			class:active={showFlagged}
			onclick={handleFlagFilter}
			aria-label="Show only flagged images"
		>
			<svg 
				class="flag-icon"
				class:filled={showFlagged}
				width="18" 
				height="18" 
				viewBox="0 0 24 24" 
				fill={showFlagged ? "currentColor" : "none"}
				stroke="currentColor" 
				stroke-width="2"
			>
				<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
				<line x1="4" y1="22" x2="4" y2="15"/>
			</svg>
			Flagged Images
		</button>
	</div>

	{#if isActive}
		<div class="active-filters">
			<p class="active-filters-text">
				{#if minStarRating > 0 && showFlagged}
					Showing flagged images with {minStarRating}+ stars
				{:else if minStarRating > 0}
					Showing images with {minStarRating}+ stars
				{:else if showFlagged}
					Showing flagged images only
				{/if}
			</p>
		</div>
	{/if}
</div>

<style>
	.filter-panel {
		padding: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.02);
	}

	.filter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.filter-title {
		font-size: 1rem;
		font-weight: 600;
		color: white;
		margin: 0;
	}

	.clear-filters-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 4px;
	}

	.clear-filters-btn:hover {
		background: rgba(239, 68, 68, 0.3);
		color: #f87171;
	}

	.filter-section {
		margin-bottom: 1rem;
	}

	.filter-label {
		display: block;
		font-size: 0.8rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 0.5rem;
	}

	.star-filter {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.25rem;
	}

	.star-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.25rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.star-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.star-btn.active {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.6);
	}

	.star-display {
		display: flex;
		gap: 1px;
	}

	.star-icon {
		color: rgba(255, 255, 255, 0.3);
		transition: color 0.2s ease;
	}

	.star-icon.filled {
		color: #fbbf24;
	}

	.star-icon.active-filter {
		color: #fbbf24;
	}

	.star-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.flag-filter-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		width: 100%;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border-radius: 6px;
		font-size: 0.9rem;
		justify-content: center;
	}

	.flag-filter-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.flag-filter-btn.active {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.6);
		color: #4ade80;
	}

	.flag-icon {
		color: rgba(255, 255, 255, 0.6);
		transition: color 0.2s ease;
	}

	.flag-icon.filled {
		color: #4ade80;
	}

	.active-filters {
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 6px;
	}

	.active-filters-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
		text-align: center;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.filter-panel {
			padding: 0.75rem;
		}

		.star-filter {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
		}

		.star-btn {
			padding: 0.75rem 0.5rem;
		}

		.star-display {
			gap: 2px;
		}

		.star-icon {
			width: 14px;
			height: 14px;
		}

		.flag-filter-btn {
			padding: 1rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.star-btn,
		.flag-filter-btn,
		.star-icon {
			transition: none;
		}
	}
</style>