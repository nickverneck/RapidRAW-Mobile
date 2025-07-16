<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let showUpdateNotification = false;
	let updateAvailable = false;

	onMount(() => {
		if (!browser) return;

		// Listen for service worker updates
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				// New service worker has taken control
				showUpdateNotification = true;
				updateAvailable = true;
			});

			// Check for waiting service worker
			navigator.serviceWorker.ready.then((registration) => {
				if (registration.waiting) {
					showUpdateNotification = true;
					updateAvailable = true;
				}

				// Listen for new service worker installing
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing;
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								showUpdateNotification = true;
								updateAvailable = true;
							}
						});
					}
				});
			});
		}
	});

	async function handleUpdate() {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.ready;
			
			if (registration.waiting) {
				// Tell the waiting service worker to skip waiting
				registration.waiting.postMessage({ type: 'SKIP_WAITING' });
			}
			
			// Reload the page to get the new version
			window.location.reload();
		}
	}

	function dismissUpdate() {
		showUpdateNotification = false;
	}
</script>

{#if showUpdateNotification}
	<div 
		class="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg z-50"
		data-testid="pwa-update-notification"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<svg class="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="text-white font-semibold text-sm">Update Available</h3>
				<p class="text-white/80 text-xs mt-1">
					A new version of RapiDraw is available with improvements and bug fixes.
				</p>
			</div>
			<button 
				on:click={dismissUpdate}
				class="flex-shrink-0 text-white/60 hover:text-white"
				aria-label="Dismiss update notification"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
		<div class="mt-3 flex gap-2">
			<button 
				on:click={handleUpdate}
				class="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
				data-testid="pwa-update-button"
			>
				Update Now
			</button>
			<button 
				on:click={dismissUpdate}
				class="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
			>
				Later
			</button>
		</div>
	</div>
{/if}

<style>
	/* Glassmorphism styling */
	div {
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}
</style>