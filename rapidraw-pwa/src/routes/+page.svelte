<script lang="ts">
	import { onMount } from 'svelte';
	import { folderStore, hasSelectedFolder } from '$lib/stores/folderStore';
	import FolderSelection from '$lib/components/FolderSelection.svelte';
	import GalleryLayout from '$lib/components/GalleryLayout.svelte';

	onMount(() => {
		// Initialize folder store
		folderStore.init();
	});
</script>

<div class="app-container">
	{#if $hasSelectedFolder}
		<!-- Gallery Layout: Show when user has selected a folder -->
		<GalleryLayout />
	{:else}
		<!-- Folder Selection: Show when no folder is selected -->
		<FolderSelection />
	{/if}
</div>

<style>
	.app-container {
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}
</style>
