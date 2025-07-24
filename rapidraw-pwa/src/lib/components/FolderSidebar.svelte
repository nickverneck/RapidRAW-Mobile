<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FolderItem } from '$lib/stores/folderStore';

	interface Props {
		folderStore: any;
		collapsed: boolean;
	}

	let { folderStore, collapsed }: Props = $props();

	const dispatch = createEventDispatcher();

	let folders: FolderItem[] = $state([]);
	let currentFolder: FolderItem | null = $state(null);
	let isLoading = $state(false);

	// Subscribe to store changes
	$effect(() => {
		const unsubscribe = folderStore.subscribe((state: any) => {
			folders = state.selectedFolders;
			currentFolder = state.currentFolder;
			isLoading = state.isLoading;
		});

		return unsubscribe;
	});

	function handleFolderSelect(folder: FolderItem) {
		if (folder.path !== currentFolder?.path) {
			folderStore.switchFolder(folder);
		}
	}

	function handleAddFolder() {
		folderStore.selectFolder();
	}

	function handleRemoveFolder(folder: FolderItem, event: Event) {
		event.stopPropagation();
		folderStore.removeFolder(folder.path);
	}

	function handleToggleSidebar() {
		dispatch('toggle');
	}
</script>

<div class="folder-sidebar glass-sidebar" class:collapsed>
	<!-- Header -->
	<div class="sidebar-header">
		<div class="header-content">
			<h2 class="sidebar-title">Folders</h2>
			<button 
				class="toggle-btn glass-button touch-target"
				on:click={handleToggleSidebar}
				aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			>
				<svg 
					width="20" 
					height="20" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="2"
				>
					{#if collapsed}
						<path d="M9 18l6-6-6-6"/>
					{:else}
						<path d="M15 18l-6-6 6-6"/>
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if !collapsed}
		<!-- Folder List -->
		<div class="folder-list">
			{#if folders.length === 0}
				<div class="empty-state">
					<svg 
						class="empty-icon" 
						width="48" 
						height="48" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="1.5"
					>
						<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
					</svg>
					<p class="empty-text">No folders selected</p>
					<button 
						class="add-folder-btn glass-button touch-target"
						on:click={handleAddFolder}
					>
						<svg 
							width="16" 
							height="16" 
							viewBox="0 0 24 24" 
							fill="none" 
							stroke="currentColor" 
							stroke-width="2"
						>
							<path d="M12 5v14m-7-7h14"/>
						</svg>
						Add Folder
					</button>
				</div>
			{:else}
				{#each folders as folder (folder.path)}
					<div 
						class="folder-item glass-transition"
						class:active={currentFolder?.path === folder.path}
						role="button"
						tabindex="0"
						on:click={() => handleFolderSelect(folder)}
						on:keydown={(e) => e.key === 'Enter' && handleFolderSelect(folder)}
					>
						<div class="folder-info">
							<svg 
								class="folder-icon" 
								width="20" 
								height="20" 
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								stroke-width="2"
							>
								<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
							</svg>
							<div class="folder-details">
								<span class="folder-name">{folder.name}</span>
								<span class="folder-path">{folder.path}</span>
							</div>
						</div>
						
						<button 
							class="remove-btn"
							on:click={(e) => handleRemoveFolder(folder, e)}
							aria-label="Remove folder"
							title="Remove folder"
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
						</button>
					</div>
				{/each}

				<!-- Add Another Folder Button -->
				<button 
					class="add-another-btn glass-button touch-target"
					on:click={handleAddFolder}
					disabled={isLoading}
				>
					<svg 
						width="16" 
						height="16" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						stroke-width="2"
					>
						<path d="M12 5v14m-7-7h14"/>
					</svg>
					Add Another Folder
				</button>
			{/if}
		</div>

		<!-- Footer -->
		<div class="sidebar-footer">
			<div class="folder-stats">
				{#if currentFolder}
					<p class="stats-text">
						<strong>{currentFolder.name}</strong>
					</p>
					<p class="stats-subtext">
						Current folder
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	@import '$lib/styles/glassmorphism.css';

	.folder-sidebar {
		height: 100%;
		display: flex;
		flex-direction: column;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.folder-sidebar.collapsed {
		width: 0;
		border-right: none;
	}

	.sidebar-header {
		flex-shrink: 0;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.sidebar-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: white;
	}

	.toggle-btn {
		padding: 0.5rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border-radius: 6px;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.folder-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem 1rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.empty-icon {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-text {
		margin: 0 0 1.5rem 0;
		font-size: 0.9rem;
	}

	.add-folder-btn,
	.add-another-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		border: none;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		width: 100%;
		justify-content: center;
	}

	.add-folder-btn:hover,
	.add-another-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.add-another-btn {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		padding: 0.5rem 0.75rem;
	}

	.folder-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid transparent;
	}

	.folder-item:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.folder-item.active {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.4);
	}

	.folder-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		flex: 1;
	}

	.folder-icon {
		flex-shrink: 0;
		color: rgba(255, 255, 255, 0.8);
	}

	.folder-details {
		min-width: 0;
		flex: 1;
	}

	.folder-name {
		display: block;
		font-weight: 500;
		color: white;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.folder-path {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 0.125rem;
	}

	.remove-btn {
		flex-shrink: 0;
		padding: 0.25rem;
		border: none;
		background: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.sidebar-footer {
		flex-shrink: 0;
		padding: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.folder-stats {
		text-align: center;
	}

	.stats-text {
		font-size: 0.9rem;
		font-weight: 500;
		color: white;
		margin: 0 0 0.25rem 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stats-subtext {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
	}

	/* Custom scrollbar */
	.folder-list::-webkit-scrollbar {
		width: 6px;
	}

	.folder-list::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}

	.folder-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.folder-list::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.folder-sidebar {
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			width: 280px;
			z-index: 150;
		}

		.sidebar-header {
			padding: 1rem 1rem 1rem 3.5rem; /* Account for mobile toggle button */
		}

		.folder-item {
			padding: 1rem 0.75rem;
		}

		.folder-name {
			font-size: 1rem;
		}

		.folder-path {
			font-size: 0.8rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.folder-item {
			transition: none;
		}
	}
</style>
