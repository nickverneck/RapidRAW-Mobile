<script lang="ts">
	import TitleBar from './TitleBar.svelte';

	export let title = 'RapidRAW';
	export let showTitleBar = true;
</script>

<div class="app-shell">
	{#if showTitleBar}
		<TitleBar {title} />
	{/if}
	<div class="app-body">
		<aside class="app-sidebar">
			<slot name="sidebar" />
		</aside>
		<main class="app-main">
			<slot />
		</main>
		<aside class="app-right">
			<slot name="right" />
		</aside>
	</div>
	<footer class="app-bottom">
		<slot name="bottom" />
	</footer>
</div>
