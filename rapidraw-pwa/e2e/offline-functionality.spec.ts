import { test, expect } from '@playwright/test';

test.describe('Offline Functionality', () => {
	test('should cache essential resources for offline use', async ({ page }) => {
		await page.goto('/');
		
		// Wait for service worker to cache resources
		await page.waitForLoadState('networkidle');
		
		// Check that service worker has cached essential files
		const cachedResources = await page.evaluate(async () => {
			if ('caches' in window) {
				const cacheNames = await caches.keys();
				const cache = await caches.open(cacheNames[0]);
				const cachedRequests = await cache.keys();
				return cachedRequests.map(req => req.url);
			}
			return [];
		});
		
		// Verify essential resources are cached
		const essentialResources = ['.js', '.css', '.html'];
		const hasCachedEssentials = essentialResources.some(ext => 
			cachedResources.some(url => url.includes(ext))
		);
		
		expect(hasCachedEssentials).toBe(true);
	});

	test('should work offline with basic functionality', async ({ page, context }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Go offline
		await context.setOffline(true);
		
		// Reload page to test offline functionality
		await page.reload();
		
		// Verify main content loads offline
		await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
		
		// Test basic UI interactions work offline
		const menuButton = page.locator('[data-testid="menu-button"]');
		if (await menuButton.isVisible()) {
			await menuButton.click();
			const menu = page.locator('[data-testid="main-menu"]');
			await expect(menu).toBeVisible();
		}
		
		// Verify offline indicator is shown
		const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
		await expect(offlineIndicator).toBeVisible();
	});

	test('should handle image processing offline', async ({ page, context }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Load a test image while online
		await page.locator('[data-testid="load-test-image"]').click();
		await expect(page.locator('[data-testid="image-canvas"]')).toBeVisible();
		
		// Go offline
		await context.setOffline(true);
		
		// Test that basic adjustments still work offline
		const exposureSlider = page.locator('[data-testid="exposure-slider"]');
		await exposureSlider.fill('0.5');
		
		// Verify processing works (using cached WebAssembly modules)
		await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
		await expect(page.locator('[data-testid="processing-indicator"]')).not.toBeVisible({ timeout: 10000 });
		
		// Check that adjustment was applied
		const adjustmentValue = await exposureSlider.inputValue();
		expect(parseFloat(adjustmentValue)).toBe(0.5);
	});

	test('should save edits locally when offline', async ({ page, context }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Load test image
		await page.locator('[data-testid="load-test-image"]').click();
		
		// Go offline
		await context.setOffline(true);
		
		// Make adjustments
		await page.locator('[data-testid="exposure-slider"]').fill('0.3');
		await page.locator('[data-testid="contrast-slider"]').fill('0.2');
		
		// Save edits
		const saveButton = page.locator('[data-testid="save-edits"]');
		await saveButton.click();
		
		// Verify save confirmation
		const saveConfirmation = page.locator('[data-testid="save-confirmation"]');
		await expect(saveConfirmation).toBeVisible();
		await expect(saveConfirmation).toContainText('saved locally');
		
		// Reload page and verify edits persist
		await page.reload();
		await page.locator('[data-testid="load-saved-edits"]').click();
		
		const exposureValue = await page.locator('[data-testid="exposure-slider"]').inputValue();
		const contrastValue = await page.locator('[data-testid="contrast-slider"]').inputValue();
		
		expect(parseFloat(exposureValue)).toBe(0.3);
		expect(parseFloat(contrastValue)).toBe(0.2);
	});

	test('should sync data when coming back online', async ({ page, context }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Go offline
		await context.setOffline(true);
		
		// Make changes while offline
		await page.locator('[data-testid="load-test-image"]').click();
		await page.locator('[data-testid="exposure-slider"]').fill('0.4');
		await page.locator('[data-testid="save-edits"]').click();
		
		// Come back online
		await context.setOffline(false);
		
		// Trigger sync
		await page.locator('[data-testid="sync-button"]').click();
		
		// Verify sync status
		const syncStatus = page.locator('[data-testid="sync-status"]');
		await expect(syncStatus).toContainText('synced');
		
		// Verify offline indicator is hidden
		const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
		await expect(offlineIndicator).not.toBeVisible();
	});

	test('should handle service worker caching strategies', async ({ page }) => {
		await page.goto('/');
		
		// Test different caching strategies
		const cacheStrategies = await page.evaluate(async () => {
			if ('serviceWorker' in navigator && 'caches' in window) {
				const cacheNames = await caches.keys();
				const strategies: Record<string, string[]> = {};
				
				for (const cacheName of cacheNames) {
					const cache = await caches.open(cacheName);
					const requests = await cache.keys();
					strategies[cacheName] = requests.map(req => req.url);
				}
				
				return strategies;
			}
			return {};
		});
		
		// Verify different cache types exist
		const cacheKeys = Object.keys(cacheStrategies);
		expect(cacheKeys.length).toBeGreaterThan(0);
		
		// Check for runtime and precache strategies
		const hasRuntimeCache = cacheKeys.some(key => key.includes('runtime'));
		const hasPrecache = cacheKeys.some(key => key.includes('precache'));
		
		expect(hasRuntimeCache || hasPrecache).toBe(true);
	});

	test('should handle background sync for pending operations', async ({ page, context }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		
		// Go offline
		await context.setOffline(true);
		
		// Perform operation that requires sync
		await page.locator('[data-testid="export-image"]').click();
		
		// Verify operation is queued
		const queuedOperations = page.locator('[data-testid="queued-operations"]');
		await expect(queuedOperations).toBeVisible();
		await expect(queuedOperations).toContainText('1 operation pending');
		
		// Come back online
		await context.setOffline(false);
		
		// Wait for background sync
		await page.waitForTimeout(2000);
		
		// Verify operation completed
		await expect(queuedOperations).toContainText('0 operations pending');
	});
});