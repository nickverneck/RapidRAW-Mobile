<script lang="ts">
	let { children } = $props();

	// Tab navigation items
	const tabItems = [
		{ id: 'editor', label: 'Editor', icon: 'edit' },
		{ id: 'library', label: 'Library', icon: 'folder' },
		{ id: 'presets', label: 'Presets', icon: 'palette' },
		{ id: 'export', label: 'Export', icon: 'download' }
	];

	let activeTab = $state('editor');

	function setActiveTab(tabId: string) {
		activeTab = tabId;
	}

	function getIconSvg(iconName: string) {
		const icons = {
			edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5-3 3L22 12l-5.5-5.5z"></path>',
			folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
			palette: '<circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>',
			download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'
		};
		return icons[iconName] || '';
	}
</script>

<div class="tablet-container">
	<!-- Tab Navigation -->
	<nav class="tab-navigation" data-testid="tab-navigation">
		<div class="tab-list" role="tablist">
			{#each tabItems as tab}
				<button
					class="tab-button"
					class:active={activeTab === tab.id}
					data-testid="nav-tab"
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-controls="panel-{tab.id}"
					on:click={() => setActiveTab(tab.id)}
				>
					<svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						{@html getIconSvg(tab.icon)}
					</svg>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</div>
	</nav>

	<!-- Main Content Area -->
	<div class="content-area">
		<!-- Left Panel -->
		<aside class="left-panel" data-testid="left-panel">
			<div class="panel-content">
				<h3 class="panel-title">Tools</h3>
				<div class="tool-list">
					<!-- Tool items would go here -->
					<div class="tool-item">Basic Adjustments</div>
					<div class="tool-item">Color Grading</div>
					<div class="tool-item">Curves</div>
					<div class="tool-item">Masking</div>
				</div>
			</div>
		</aside>

		<!-- Center Panel (Main Content) -->
		<main class="center-panel">
			<div class="main-content">
				{@render children()}
			</div>
		</main>

		<!-- Right Panel -->
		<aside class="right-panel" data-testid="right-panel">
			<div class="panel-content">
				<h3 class="panel-title">Properties</h3>
				<div class="properties-content">
					<!-- Properties content would go here -->
					<div class="property-group">
						<label>Exposure</label>
						<input type="range" min="-2" max="2" step="0.1" value="0" />
					</div>
					<div class="property-group">
						<label>Contrast</label>
						<input type="range" min="-100" max="100" step="1" value="0" />
					</div>
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	.tablet-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--bg-primary, #0f0f23);
	}

	/* Tab Navigation */
	.tab-navigation {
		background: rgba(30, 27, 75, 0.8);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0 1rem;
	}

	.tab-list {
		display: flex;
		gap: 0.5rem;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.tab-list::-webkit-scrollbar {
		display: none;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		border-radius: 12px 12px 0 0;
		transition: all 0.2s ease;
		min-width: 120px;
		min-height: 44px;
		white-space: nowrap;
		font-weight: 500;
	}

	.tab-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
	}

	.tab-button.active {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border-bottom: 2px solid #3b82f6;
	}

	.tab-icon {
		flex-shrink: 0;
	}

	.tab-label {
		font-size: 0.875rem;
	}

	/* Content Area */
	.content-area {
		display: flex;
		flex: 1;
		overflow: hidden;
		gap: 1px;
	}

	/* Panels */
	.left-panel,
	.right-panel {
		width: 280px;
		background: rgba(20, 20, 40, 0.8);
		backdrop-filter: blur(20px);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		overflow-y: auto;
		flex-shrink: 0;
	}

	.right-panel {
		border-right: none;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
	}

	.center-panel {
		flex: 1;
		background: rgba(10, 10, 25, 0.9);
		overflow: hidden;
		position: relative;
	}

	.panel-content {
		padding: 1.5rem;
	}

	.panel-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: white;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 0.5rem;
	}

	/* Tool List */
	.tool-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tool-item {
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.tool-item:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transform: translateX(4px);
	}

	/* Properties */
	.properties-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.property-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.property-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
	}

	.property-group input[type="range"] {
		width: 100%;
		height: 44px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 22px;
		outline: none;
		cursor: pointer;
	}

	.main-content {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.6);
	}

	/* Responsive adjustments for tablet */
	@media (max-width: 1024px) and (orientation: portrait) {
		.content-area {
			flex-direction: column;
		}
		
		.left-panel,
		.right-panel {
			width: 100%;
			height: 200px;
			border-right: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}
		
		.center-panel {
			flex: 1;
		}
	}

	/* Landscape tablet optimizations */
	@media (orientation: landscape) and (max-height: 800px) {
		.panel-content {
			padding: 1rem;
		}
		
		.tab-button {
			padding: 0.75rem 1rem;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.tab-button.active {
			border-bottom-width: 3px;
		}
		
		.tool-item,
		.property-group input {
			border: 1px solid rgba(255, 255, 255, 0.3);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.tab-button,
		.tool-item {
			transition: none;
		}
	}

	/* Smooth scrolling */
	.left-panel,
	.right-panel {
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}

	.left-panel::-webkit-scrollbar,
	.right-panel::-webkit-scrollbar {
		width: 6px;
	}

	.left-panel::-webkit-scrollbar-track,
	.right-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.left-panel::-webkit-scrollbar-thumb,
	.right-panel::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}
</style>