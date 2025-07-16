<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import uiStore from '$lib/stores/uiStore';
	import imageStore from '$lib/stores/imageStore';
	import colorGradingStore from '$lib/stores/colorGradingStore';

	let { children } = $props();

	onMount(() => {
		// Initialize stores
		const cleanupUI = uiStore.init();
		imageStore.loadImages();
		colorGradingStore.init();

		// Register global keyboard shortcuts
		uiStore.registerShortcut('ctrl+z', () => imageStore.undo());
		uiStore.registerShortcut('ctrl+y', () => imageStore.redo());
		uiStore.registerShortcut('ctrl+shift+z', () => imageStore.redo());
		uiStore.registerShortcut('escape', () => uiStore.closeModal());

		// Global keydown handler
		const handleKeydown = (event: KeyboardEvent) => {
			uiStore.handleKeydown(event);
		};

		document.addEventListener('keydown', handleKeydown);

		return () => {
			cleanupUI?.();
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<Layout>
	{@render children()}
</Layout>
