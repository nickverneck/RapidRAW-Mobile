<script lang="ts">
	export let title: string;
	export let subtitle = '';
	export let body = '';
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div>
		<p class="text-xs uppercase tracking-[0.2em] text-text-secondary">RapidRAW</p>
		<h2 class="text-lg font-semibold text-text-primary">{title}</h2>
		{#if subtitle}
			<p class="text-sm text-text-secondary">{subtitle}</p>
		{/if}
	</div>
	{#if body}
		<p class="text-sm text-text-secondary">{body}</p>
	{/if}
	<slot />
</div>
