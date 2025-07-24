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
		{#if tool.icon === 'info'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<path d="M12 16v-4"/>
				<path d="M12 8h.01"/>
			</svg>
		{:else if tool.icon === 'sliders'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="4" x2="4" y1="21" y2="14"/>
				<line x1="4" x2="4" y1="10" y2="3"/>
				<line x1="12" x2="12" y1="21" y2="12"/>
				<line x1="12" x2="12" y1="8" y2="3"/>
				<line x1="20" x2="20" y1="21" y2="16"/>
				<line x1="20" x2="20" y1="12" y2="3"/>
				<line x1="1" x2="7" y1="14" y2="14"/>
				<line x1="9" x2="15" y1="8" y2="8"/>
				<line x1="17" x2="23" y1="16" y2="16"/>
			</svg>
		{:else if tool.icon === 'crop'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M6 2v14a2 2 0 0 0 2 2h14"/>
				<path d="M18 6H8a2 2 0 0 0-2 2v10"/>
			</svg>
		{:else if tool.icon === 'layers'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polygon points="12,2 2,7 12,12 22,7"/>
				<polyline points="2,17 12,22 22,17"/>
				<polyline points="2,12 12,17 22,12"/>
			</svg>
		{:else if tool.icon === 'palette'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="13.5" cy="6.5" r=".5"/>
				<circle cx="17.5" cy="10.5" r=".5"/>
				<circle cx="8.5" cy="7.5" r=".5"/>
				<circle cx="6.5" cy="12.5" r=".5"/>
				<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
			</svg>
		{:else if tool.icon === 'brain'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
				<path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
			</svg>
		{:else if tool.icon === 'download'}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
				<polyline points="7,10 12,15 17,10"/>
				<line x1="12" y1="15" x2="12" y2="3"/>
			</svg>
		{:else}
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
			</svg>
		{/if}
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
