<script lang="ts">
	export let title = 'RapidRAW';
</script>

<header class="app-titlebar">
	<div class="flex items-center gap-3">
		<div class="h-2.5 w-2.5 rounded-full bg-red-500/80"></div>
		<div class="h-2.5 w-2.5 rounded-full bg-yellow-400/80"></div>
		<div class="h-2.5 w-2.5 rounded-full bg-green-500/80"></div>
		<span class="text-sm font-semibold text-text-secondary">{title}</span>
	</div>
	<div class="flex items-center gap-2 text-xs text-text-secondary">
		<span class="rounded-full border border-border-color px-2 py-1">PWA</span>
	</div>
</header>
