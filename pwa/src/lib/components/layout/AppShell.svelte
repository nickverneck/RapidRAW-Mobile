<script lang="ts">
	export let layout: 'entry' | 'library' | 'editor' = 'entry';
	export let showSidebar = false;
	export let showRight = false;
	export let showBottom = true;
</script>

<div class="app-shell" data-layout={layout}>
	<div class="app-body" data-layout={layout}>
		{#if showSidebar}
			<aside class="app-sidebar">
				<slot name="sidebar" />
			</aside>
		{/if}
		<main class="app-main">
			<slot />
		</main>
		{#if showRight}
			<aside class="app-right">
				<slot name="right" />
			</aside>
		{/if}
	</div>
	{#if showBottom}
		<footer class="app-bottom">
			<slot name="bottom" />
		</footer>
	{/if}
</div>
