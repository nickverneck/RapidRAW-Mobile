<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FolderItem } from '$lib/stores/folderStore';
	import { filterState } from '$lib/stores/folderStore';
	import FilterPanel from './FilterPanel.svelte';
	import './FolderSidebar.css';

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

	// Filter event handlers
	function handleStarFilter(event: CustomEvent<number>) {
		folderStore.setStarFilter(event.detail);
	}

	function handleFlagFilter(event: CustomEvent<boolean>) {
		folderStore.setFlagFilter(event.detail);
	}

	function handleClearFilters() {
		folderStore.clearFilters();
	}

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
	{#if collapsed}
		<!-- Collapsed floating folder icon -->
		<div class="collapsed-icon">
			<button 
				class="expand-btn glass-button touch-target"
				onclick={handleToggleSidebar}
				aria-label="Expand folders"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"/>
				</svg>
			</button>
		</div>
	{:else}
		<!-- Header -->
		<div class="sidebar-header">
			<div class="header-content">
				<h2 class="sidebar-title">Folders</h2>
				<button 
					class="toggle-btn glass-button touch-target"
					onclick={handleToggleSidebar}
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
						<path d="M15 18l-6-6 6-6"/>
					</svg>
				</button>
			</div>
		</div>

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
						onclick={handleAddFolder}
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
						onclick={() => handleFolderSelect(folder)}
						onkeydown={(e) => e.key === 'Enter' && handleFolderSelect(folder)}
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
							onclick={(e) => handleRemoveFolder(folder, e)}
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
					onclick={handleAddFolder}
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

		<!-- Filter Panel -->
		{#if folders.length > 0}
			<FilterPanel 
				minStarRating={$filterState.minStarRating}
				showFlagged={$filterState.showFlagged}
				isActive={$filterState.isActive}
				on:starFilter={handleStarFilter}
				on:flagFilter={handleFlagFilter}
				on:clearFilters={handleClearFilters}
			/>
		{/if}

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
