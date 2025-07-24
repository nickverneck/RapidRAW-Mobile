<script lang="ts">
	import { writable } from 'svelte/store';
	import type { ImageFile } from '$lib/stores/folderStore';
	import uiStore from '$lib/stores/uiStore';
	import ToolbarButton from './ui/ToolbarButton.svelte';

	interface Props {
		selectedImage: ImageFile | null;
		mobile?: boolean;
	}

	let { selectedImage, mobile = false }: Props = $props();

	// Toolbar state
	const activePanel = writable<string | null>(null);
	const { toolbarCollapsed } = uiStore;

	// Tool panels
	const tools = [
		{
			id: 'metadata',
			name: 'Metadata',
			icon: 'info',
			description: 'View image information and EXIF data'
		},
		{
			id: 'adjustments',
			name: 'Adjustments',
			icon: 'sliders',
			description: 'Basic color and exposure adjustments'
		},
		{
			id: 'crop',
			name: 'Crop & Transform',
			icon: 'crop',
			description: 'Crop, rotate, and transform image'
		},
		{
			id: 'masking',
			name: 'Masking',
			icon: 'layers',
			description: 'Create and edit masks'
		},
		{
			id: 'presets',
			name: 'Presets',
			icon: 'palette',
			description: 'Apply preset styles and filters'
		},
		{
			id: 'ai-tools',
			name: 'AI Tools',
			icon: 'brain',
			description: 'AI-powered enhancement tools'
		},
		{
			id: 'export',
			name: 'Export',
			icon: 'download',
			description: 'Export and save your image'
		}
	];

	function handleToolSelect(toolId: string) {
		activePanel.update(current => current === toolId ? null : toolId);
	}

	function toggleCollapse() {
		toolbarCollapsed.update(collapsed => !collapsed);
		if ($toolbarCollapsed) {
			activePanel.set(null);
		}
	}

	function getIconSvg(iconName: string): string {
		const icons: Record<string, string> = {
			info: '<circle cx="12" cy="12" r="10"/><path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/>',
			sliders: '<path d="M4 21v-7m0 0V3m0 11l1.5-1.5L7 15"/><path d="M14 21v-2m0-16v11m0-11l1.5 1.5L17 7"/><path d="M20 21v-7m0 0V3m0 11l1.5-1.5L23 15"/>',
			crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 6H8a2 2 0 0 0-2 2v10"/>',
			layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
			palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
			brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/>',
			download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/>',
			chevronLeft: '<path d="m15 18-6-6 6-6"/>',
			chevronRight: '<path d="m9 18 6-6-6-6"/>',
			menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>'
		};
		return icons[iconName] || '';
	}
</script>

<div class="toolbar" class:mobile class:collapsed={$toolbarCollapsed}>
	<!-- Toolbar Header -->
	<div class="toolbar-header">
		<div class="header-content">
			{#if !$toolbarCollapsed}
				<h3 class="toolbar-title">
					{#if mobile}
						Tools
					{:else}
						Editing Tools
					{/if}
				</h3>
			{/if}
			
			{#if !mobile}
				<button 
					class="collapse-btn glass-button touch-target"
					on:click={toggleCollapse}
					aria-label={$toolbarCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
				>
					<svg 
						width="16" 
						height="16" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2"
					>
						{@html getIconSvg($toolbarCollapsed ? 'chevronRight' : 'chevronLeft')}
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Tool Buttons -->
	<div class="tool-buttons" class:mobile-grid={mobile}>
		{#each tools as tool (tool.id)}
			<ToolbarButton 
				{tool}
				active={$activePanel === tool.id}
				disabled={!selectedImage}
				collapsed={$toolbarCollapsed}
				onclick={() => selectedImage && handleToolSelect(tool.id)}
			/>
		{/each}
	</div>

	<!-- Active Panel Content -->
	{#if !$toolbarCollapsed && $activePanel && selectedImage}
			<div class="panel-content glass-panel">
				{#if $activePanel === 'metadata'}
					<div class="metadata-panel">
						<h4 class="panel-title">Image Information</h4>
						<div class="metadata-grid">
							<div class="metadata-item">
								<span class="label">Name:</span>
								<span class="value">{selectedImage.name}</span>
							</div>
							<div class="metadata-item">
								<span class="label">Size:</span>
								<span class="value">{Math.round(selectedImage.size / 1024)} KB</span>
							</div>
							<div class="metadata-item">
								<span class="label">Modified:</span>
								<span class="value">{new Date(selectedImage.lastModified).toLocaleDateString()}</span>
							</div>
						</div>
					</div>
				{:else if $activePanel === 'adjustments'}
					<div class="adjustments-panel">
						<h4 class="panel-title">Basic Adjustments</h4>
						<div class="adjustment-controls">
							<div class="control-group">
								<label class="control-label">Exposure</label>
								<input type="range" class="glass-input" min="-2" max="2" step="0.1" value="0">
							</div>
							<div class="control-group">
								<label class="control-label">Contrast</label>
								<input type="range" class="glass-input" min="-100" max="100" step="1" value="0">
							</div>
							<div class="control-group">
								<label class="control-label">Highlights</label>
								<input type="range" class="glass-input" min="-100" max="100" step="1" value="0">
							</div>
							<div class="control-group">
								<label class="control-label">Shadows</label>
								<input type="range" class="glass-input" min="-100" max="100" step="1" value="0">
							</div>
						</div>
					</div>
				{:else if $activePanel === 'crop'}
					<div class="crop-panel">
						<h4 class="panel-title">Crop & Transform</h4>
						<div class="crop-controls">
							<button class="action-btn glass-button">Reset Crop</button>
							<button class="action-btn glass-button">Rotate 90°</button>
							<button class="action-btn glass-button">Flip Horizontal</button>
							<button class="action-btn glass-button">Flip Vertical</button>
						</div>
					</div>
				{:else if $activePanel === 'export'}
					<div class="export-panel">
						<h4 class="panel-title">Export Options</h4>
						<div class="export-controls">
							<div class="control-group">
								<label class="control-label">Format</label>
								<select class="glass-input">
									<option value="jpeg">JPEG</option>
									<option value="png">PNG</option>
									<option value="webp">WebP</option>
								</select>
							</div>
							<div class="control-group">
								<label class="control-label">Quality</label>
								<input type="range" class="glass-input" min="1" max="100" step="1" value="90">
							</div>
							<button class="export-btn glass-button">Export Image</button>
						</div>
					</div>
				{:else}
					<div class="placeholder-panel">
						<h4 class="panel-title">{tools.find(t => t.id === $activePanel)?.name}</h4>
						<p class="placeholder-text">This tool is coming soon!</p>
					</div>
				{/if}
			</div>
		{:else if !selectedImage}
			<div class="no-image-panel glass-panel">
				<svg 
					class="no-image-icon" 
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
				<p class="no-image-text">Select an image to use editing tools</p>
			</div>
		{/if}
	</div>

<style>


	.toolbar {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--glass-bg-color);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
		transition: width 0.3s ease;
	}

	.toolbar.collapsed {
		width: 60px;
	}

	.toolbar.mobile {
		border-left: none;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		height: auto;
		max-height: 50vh;
	}

	.toolbar-header {
		flex-shrink: 0;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.toolbar-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: white;
		margin: 0;
	}

	.collapse-btn {
		padding: 0.5rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border-radius: 6px;
	}

	.collapse-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.tool-buttons {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tool-buttons.mobile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.tool-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: none;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
		border-radius: 8px;
		text-align: left;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.tool-btn:hover:not(.disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transform: translateY(-1px);
	}

	.tool-btn.active {
		background: rgba(59, 130, 246, 0.3);
		border: 1px solid rgba(59, 130, 246, 0.5);
		color: white;
	}

	.tool-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tool-btn.disabled:hover {
		transform: none;
		background: rgba(255, 255, 255, 0.05);
	}

	.mobile-grid .tool-btn {
		flex-direction: column;
		text-align: center;
		gap: 0.5rem;
		padding: 1rem 0.5rem;
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

	.mobile-grid .tool-name {
		font-size: 0.8rem;
		white-space: normal;
		text-align: center;
		line-height: 1.2;
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.panel-title {
		font-size: 1rem;
		font-weight: 600;
		color: white;
		margin: 0 0 1rem 0;
	}

	.metadata-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.metadata-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.metadata-item:last-child {
		border-bottom: none;
	}

	.label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.value {
		font-size: 0.9rem;
		color: white;
		text-align: right;
		word-break: break-all;
	}

	.adjustment-controls,
	.crop-controls,
	.export-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.glass-input {
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		font-size: 0.9rem;
	}

	.glass-input:focus {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(59, 130, 246, 0.5);
		outline: none;
	}

	input[type="range"].glass-input {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		border: none;
		padding: 0;
	}

	input[type="range"].glass-input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
	}

	input[type="range"].glass-input::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: #3b82f6;
		border-radius: 50%;
		border: none;
		cursor: pointer;
	}

	.action-btn,
	.export-btn {
		padding: 0.75rem 1rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover,
	.export-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	.export-btn {
		background: rgba(59, 130, 246, 0.3);
		border: 1px solid rgba(59, 130, 246, 0.5);
		margin-top: 0.5rem;
	}

	.export-btn:hover {
		background: rgba(59, 130, 246, 0.4);
	}

	.placeholder-panel,
	.no-image-panel {
		text-align: center;
		padding: 2rem 1rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.no-image-icon {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.no-image-text,
	.placeholder-text {
		font-size: 0.9rem;
		margin: 0;
	}

	/* Custom scrollbar */
	.panel-content::-webkit-scrollbar {
		width: 6px;
	}

	.panel-content::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}

	.panel-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.panel-content::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.toolbar-header {
			padding: 0.75rem 1rem;
		}

		.toolbar-title {
			font-size: 1rem;
		}

		.tool-buttons {
			padding: 0.75rem 1rem;
		}

		.panel-content {
			max-height: 30vh;
			padding: 0.75rem 1rem;
		}

		.tool-btn {
			padding: 1rem 0.75rem;
		}

		.tool-name {
			font-size: 0.8rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.tool-btn,
		.action-btn,
		.export-btn {
			transition: none;
		}

		.tool-btn:hover:not(.disabled),
		.action-btn:hover,
		.export-btn:hover {
			transform: none;
		}
	}
</style>
