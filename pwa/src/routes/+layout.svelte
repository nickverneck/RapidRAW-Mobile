<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/icons/icon-192.png" /></svelte:head>
{@render children()}
