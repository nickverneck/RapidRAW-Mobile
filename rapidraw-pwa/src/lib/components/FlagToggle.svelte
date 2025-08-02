<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		flagged: boolean;
		size?: 'small' | 'medium' | 'large';
	}

	let { flagged = false, size = 'medium' }: Props = $props();

	const dispatch = createEventDispatcher();

	function handleToggle() {
		dispatch('toggle', !flagged);
	}

	function getIconSize() {
		switch (size) {
			case 'small': return 16;
			case 'large': return 24;
			default: return 20;
		}
	}
</script>

<button
	class="flag-toggle touch-target"
	class:flagged
	class:size-small={size === 'small'}
	class:size-medium={size === 'medium'}
	class:size-large={size === 'large'}
	onclick={handleToggle}
	aria-label={flagged ? 'Remove flag from image' : 'Flag this image'}
	aria-pressed={flagged}
	title={flagged ? 'Remove flag' : 'Flag image'}
>
	<svg 
		class="flag-icon"
		width={getIconSize()} 
		height={getIconSize()} 
		viewBox="0 0 24 24" 
		fill={flagged ? "currentColor" : "none"}
		stroke="currentColor" 
		stroke-width="2"
	>
		<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
		<line x1="4" y1="22" x2="4" y2="15"/>
	</svg>
</button>

<style>
	.flag-toggle {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		padding: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.flag-toggle:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
		transform: translateY(-1px);
	}

	.flag-toggle.flagged {
		background: rgba(34, 197, 94, 0.3);
		border-color: rgba(34, 197, 94, 0.6);
	}

	.flag-toggle.flagged:hover {
		background: rgba(34, 197, 94, 0.4);
		border-color: rgba(34, 197, 94, 0.7);
	}

	.flag-icon {
		color: rgba(255, 255, 255, 0.7);
		transition: color 0.2s ease;
	}

	.flag-toggle:hover .flag-icon {
		color: white;
	}

	.flag-toggle.flagged .flag-icon {
		color: #4ade80;
	}

	.flag-toggle.flagged:hover .flag-icon {
		color: #6ee7b7;
	}

	/* Size variants */
	.size-small {
		padding: 4px;
	}

	.size-large {
		padding: 8px;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.flag-toggle {
			padding: 8px;
			min-width: 36px;
			min-height: 36px;
		}

		.size-small {
			padding: 6px;
			min-width: 28px;
			min-height: 28px;
		}

		.size-large {
			padding: 10px;
			min-width: 44px;
			min-height: 44px;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.flag-toggle {
			border-width: 2px;
		}

		.flag-toggle.flagged {
			background: rgba(34, 197, 94, 0.5);
		}

		.flag-icon {
			stroke-width: 2.5;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.flag-toggle,
		.flag-icon {
			transition: none;
		}

		.flag-toggle:hover {
			transform: none;
		}
	}

	/* Focus styles for accessibility */
	.flag-toggle:focus {
		outline: 2px solid rgba(34, 197, 94, 0.8);
		outline-offset: 2px;
	}
</style>