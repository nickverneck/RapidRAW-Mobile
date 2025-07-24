<script lang="ts">
	interface Props {
		tool: {
			id: string;
			name: string;
			icon: string;
			description: string;
		};
		active?: boolean;
		disabled?: boolean;
		collapsed?: boolean;
		onclick?: () => void;
	}

	let { tool, active = false, disabled = false, collapsed = false, onclick }: Props = $props();

	function getIconSvg(iconName: string): string {
		const icons: Record<string, string> = {
			metadata: '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>',
			adjustments: '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/>',
			crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 6H8a2 2 0 0 0-2 2v10"/>',
			masking: '<path d="M12 2l3.09 6.26L22 9l-5.91 5.91L22 22l-6.74-1.09L12 22l-3.26-1.09L2 22l5.91-7.09L2 9l6.91-.74L12 2z"/>',
			presets: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
			ai: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
			export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>'
		};
		return icons[iconName] || '';
	}
</script>

<button 
	class="tool-btn glass-button touch-target"
	class:active
	class:disabled
	class:collapsed
	{disabled}
	onclick={onclick}
	aria-label={tool.description}
	title={collapsed ? tool.name : tool.description}
>
	<div class="tool-icon">
		<svg 
			width="20" 
			height="20" 
			viewBox="0 0 24 24" 
			fill="none" 
			stroke="currentColor" 
			stroke-width="2"
		>
			{@html getIconSvg(tool.icon)}
		</svg>
	</div>
	{#if !collapsed}
		<span class="tool-name">{tool.name}</span>
	{/if}
</button>

<style>
	.tool-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: none;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		border-radius: 8px;
		transition: all 0.2s ease;
		cursor: pointer;
		text-align: left;
		width: 100%;
		min-height: 44px;
	}

	.tool-btn:hover:not(.disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transform: translateY(-1px);
	}

	.tool-btn.active {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.tool-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tool-btn.collapsed {
		justify-content: center;
		padding: 0.75rem;
		gap: 0;
	}

	.tool-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tool-name {
		font-size: 0.9rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.collapsed .tool-name {
		display: none;
	}
</style>
