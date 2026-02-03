<div class="app-shell">
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
