<script lang="ts">
	// Desktop navigation items
	const navItems = [
		{ id: 'editor', label: 'Editor', icon: 'edit', href: '/' },
		{ id: 'library', label: 'Library', icon: 'folder', href: '/library' },
		{ id: 'presets', label: 'Presets', icon: 'palette', href: '/presets' },
		{ id: 'export', label: 'Export', icon: 'download', href: '/export' },
		{ id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' }
	];

	let activeItem = $state('editor');

	function setActiveItem(itemId: string) {
		activeItem = itemId;
	}

	function getIconSvg(iconName: string) {
		const icons = {
			edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5-3 3L22 12l-5.5-5.5z"></path>',
			folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
			palette: '<circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>',
			download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
			settings: '<circle cx="12" cy="12" r="3"></circle><path d="m12 1 2.09 3.26L18 4l-1 3.73L21 9l-3.26 2.09L18 15l-3.73-1L12 18l-2.09-3.26L6 15l1-3.73L3 9l3.26-2.09L6 3l3.73 1L12 1z"></path>'
		};
		return icons[iconName] || '';
	}
</script>

<nav class="desktop-navigation" data-testid="desktop-navigation">
	<div class="nav-header">
		<div class="app-logo">
			<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
				<rect width="32" height="32" rx="8" fill="url(#gradient)" />
				<path d="M8 12h16v8H8z" fill="white" opacity="0.9" />
				<path d="M12 8v16M20 8v16" stroke="white" stroke-width="2" opacity="0.7" />
				<defs>
					<linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
						<stop offset="0%" stop-color="#3b82f6" />
						<stop offset="100%" stop-color="#1e40af" />
					</linearGradient>
				</defs>
			</svg>
		</div>
		<h1 class="app-title">RapiDraw</h1>
	</div>

	<ul class="nav-list">
		{#each navItems as item}
			<li class="nav-item">
				<a
					href={item.href}
					class="nav-link"
					class:active={activeItem === item.id}
					data-testid="nav-item"
					on:click={() => setActiveItem(item.id)}
				>
					<svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						{@html getIconSvg(item.icon)}
					</svg>
					<span class="nav-label">{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>

	<div class="nav-footer">
		<div class="user-info">
			<div class="user-avatar">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
					<circle cx="12" cy="7" r="4"></circle>
				</svg>
			</div>
			<div class="user-details">
				<div class="user-name">User</div>
				<div class="user-status">Online</div>
			</div>
		</div>
	</div>
</nav>

<style>
	.desktop-navigation {
		width: 280px;
		height: 100vh;
		background: rgba(20, 20, 40, 0.95);
		backdrop-filter: blur(20px);
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		flex-shrink: 0;
	}

	/* Navigation Header */
	.nav-header {
		padding: 2rem 1.5rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.app-logo {
		flex-shrink: 0;
	}

	.app-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: white;
		background: linear-gradient(135deg, #3b82f6, #1e40af);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* Navigation List */
	.nav-list {
		list-style: none;
		padding: 1.5rem 1rem;
		margin: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.nav-item {
		margin: 0;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		border-radius: 12px;
		transition: all 0.2s ease;
		font-weight: 500;
		position: relative;
		overflow: hidden;
	}

	.nav-link::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 64, 175, 0.1));
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.nav-link:hover::before {
		opacity: 1;
	}

	.nav-link:hover {
		color: white;
		transform: translateX(4px);
	}

	.nav-link.active {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(30, 64, 175, 0.2));
		color: white;
		border-left: 3px solid #3b82f6;
	}

	.nav-link.active::before {
		opacity: 1;
	}

	.nav-icon {
		flex-shrink: 0;
		z-index: 1;
		position: relative;
	}

	.nav-label {
		font-size: 1rem;
		z-index: 1;
		position: relative;
	}

	/* Navigation Footer */
	.nav-footer {
		padding: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: auto;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		transition: background-color 0.2s ease;
	}

	.user-info:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #3b82f6, #1e40af);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.user-details {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-weight: 600;
		color: white;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	.user-status {
		font-size: 0.75rem;
		color: rgba(34, 197, 94, 0.8);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.user-status::before {
		content: '';
		width: 6px;
		height: 6px;
		background: #22c55e;
		border-radius: 50%;
		display: inline-block;
	}

	/* Scrollbar styling */
	.desktop-navigation {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}

	.desktop-navigation::-webkit-scrollbar {
		width: 6px;
	}

	.desktop-navigation::-webkit-scrollbar-track {
		background: transparent;
	}

	.desktop-navigation::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.desktop-navigation::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.nav-link {
			border: 1px solid transparent;
		}
		
		.nav-link:focus,
		.nav-link.active {
			border-color: currentColor;
		}
		
		.user-info {
			border: 1px solid rgba(255, 255, 255, 0.3);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.nav-link,
		.user-info {
			transition: none;
		}
		
		.nav-link:hover {
			transform: none;
		}
	}

	/* Compact mode for smaller desktop screens */
	@media (max-width: 1440px) {
		.desktop-navigation {
			width: 240px;
		}
		
		.nav-header {
			padding: 1.5rem 1rem 1rem;
		}
		
		.app-title {
			font-size: 1.25rem;
		}
		
		.nav-link {
			padding: 0.875rem 1rem;
		}
	}

	/* Focus styles for accessibility */
	.nav-link:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.user-info:focus-within {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>