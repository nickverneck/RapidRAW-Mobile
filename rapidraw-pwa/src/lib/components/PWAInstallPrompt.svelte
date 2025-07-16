<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let showInstallPrompt = false;
	let deferredPrompt: any = null;
	let isIOS = false;
	let isAndroid = false;
	let isInstalled = false;

	onMount(() => {
		if (!browser) return;

		// Detect platform
		const userAgent = navigator.userAgent.toLowerCase();
		isIOS = /iphone|ipad|ipod/.test(userAgent);
		isAndroid = /android/.test(userAgent);

		// Check if already installed
		isInstalled = window.matchMedia('(display-mode: standalone)').matches;

		// Listen for beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			showInstallPrompt = true;
		});

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			showInstallPrompt = false;
			isInstalled = true;
			console.log('PWA was installed');
		});
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		
		if (outcome === 'accepted') {
			console.log('User accepted the install prompt');
		} else {
			console.log('User dismissed the install prompt');
		}
		
		deferredPrompt = null;
		showInstallPrompt = false;
	}

	function dismissPrompt() {
		showInstallPrompt = false;
	}
</script>

{#if showInstallPrompt && !isInstalled}
	<div 
		class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg z-50"
		data-testid="install-pwa-prompt"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<svg class="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="text-white font-semibold text-sm">Install RapiDraw</h3>
				<p class="text-white/80 text-xs mt-1">
					Install our app for a better experience and offline access.
				</p>
			</div>
			<button 
				on:click={dismissPrompt}
				class="flex-shrink-0 text-white/60 hover:text-white"
				aria-label="Dismiss install prompt"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
		<div class="mt-3 flex gap-2">
			<button 
				on:click={handleInstall}
				class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
				data-testid="install-pwa-button"
			>
				Install App
			</button>
			<button 
				on:click={dismissPrompt}
				class="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
			>
				Not Now
			</button>
		</div>
	</div>
{/if}

{#if isIOS && !isInstalled}
	<div 
		class="fixed bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg z-50"
		data-testid="ios-install-instructions"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<svg class="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
					<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
					<path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="text-white font-semibold text-sm">Install on iOS</h3>
				<p class="text-white/80 text-xs mt-1">
					Tap the share button <svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg> 
					then "Add to Home Screen"
				</p>
			</div>
		</div>
	</div>
{/if}

{#if isAndroid && !isInstalled && !showInstallPrompt}
	<div 
		class="fixed bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg z-50"
		data-testid="android-install-instructions"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<svg class="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="text-white font-semibold text-sm">Install on Android</h3>
				<p class="text-white/80 text-xs mt-1">
					Tap the menu button (⋮) then "Add to Home screen" or "Install app"
				</p>
			</div>
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