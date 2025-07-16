import { test, expect } from '@playwright/test';

test.describe('PWA Installation Flow', () => {
	test('should have valid web app manifest', async ({ page }) => {
		await page.goto('/');
		
		// Check manifest link exists
		const manifestLink = page.locator('link[rel="manifest"]');
		await expect(manifestLink).toHaveCount(1);
		
		// Get manifest URL and fetch it
		const manifestHref = await manifestLink.getAttribute('href');
		expect(manifestHref).toBeTruthy();
		
		const manifestResponse = await page.request.get(manifestHref!);
		expect(manifestResponse.status()).toBe(200);
		
		const manifest = await manifestResponse.json();
		
		// Validate required manifest fields
		expect(manifest.name).toBe('RapiDraw PWA');
		expect(manifest.short_name).toBe('RapiDraw');
		expect(manifest.description).toContain('photo editing');
		expect(manifest.display).toBe('standalone');
		expect(manifest.start_url).toBe('/');
		expect(manifest.theme_color).toBeTruthy();
		expect(manifest.background_color).toBeTruthy();
		
		// Validate icons
		expect(manifest.icons).toHaveLength(3);
		expect(manifest.icons[0].sizes).toBe('192x192');
		expect(manifest.icons[1].sizes).toBe('512x512');
		expect(manifest.icons[2].purpose).toBe('any maskable');
	});

	test('should register service worker successfully', async ({ page }) => {
		await page.goto('/');
		
		// Wait for service worker registration
		const swRegistered = await page.evaluate(async () => {
			if ('serviceWorker' in navigator) {
				try {
					const registration = await navigator.serviceWorker.ready;
					return !!registration;
				} catch (error) {
					return false;
				}
			}
			return false;
		});
		
		expect(swRegistered).toBe(true);
	});

	test('should show install prompt on supported browsers', async ({ page, browserName }) => {
		// Skip on browsers that don't support PWA installation
		if (browserName === 'webkit') {
			test.skip('Safari does not support PWA installation prompts');
		}
		
		await page.goto('/');
		
		// Simulate beforeinstallprompt event
		await page.evaluate(() => {
			const event = new Event('beforeinstallprompt');
			(event as any).prompt = () => Promise.resolve({ outcome: 'accepted' });
			window.dispatchEvent(event);
		});
		
		// Check if install button appears
		const installButton = page.locator('[data-testid="install-pwa-button"]');
		await expect(installButton).toBeVisible({ timeout: 5000 });
		
		// Test install button click
		await installButton.click();
		
		// Verify install prompt was triggered
		const installTriggered = await page.evaluate(() => {
			return (window as any).installPromptTriggered === true;
		});
		
		expect(installTriggered).toBe(true);
	});

	test('should handle PWA installation across different platforms', async ({ page, browserName }) => {
		await page.goto('/');
		
		// Test platform-specific installation hints
		const userAgent = await page.evaluate(() => navigator.userAgent);
		
		if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
			// iOS Safari installation instructions
			const iosInstructions = page.locator('[data-testid="ios-install-instructions"]');
			await expect(iosInstructions).toBeVisible();
			
			// Check for "Add to Home Screen" instructions
			await expect(iosInstructions).toContainText('Add to Home Screen');
		} else if (userAgent.includes('Android')) {
			// Android Chrome installation
			const androidInstructions = page.locator('[data-testid="android-install-instructions"]');
			await expect(androidInstructions).toBeVisible();
		}
	});

	test('should update PWA when new version is available', async ({ page }) => {
		await page.goto('/');
		
		// Simulate service worker update
		await page.evaluate(() => {
			// Mock service worker update event
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.addEventListener('controllerchange', () => {
					(window as any).swUpdated = true;
				});
				
				// Simulate update
				const event = new Event('controllerchange');
				navigator.serviceWorker.dispatchEvent(event);
			}
		});
		
		// Check for update notification
		const updateNotification = page.locator('[data-testid="pwa-update-notification"]');
		await expect(updateNotification).toBeVisible({ timeout: 5000 });
		
		// Test update button
		const updateButton = page.locator('[data-testid="pwa-update-button"]');
		await updateButton.click();
		
		// Verify page reloads after update
		await page.waitForLoadState('networkidle');
		await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
	});
});