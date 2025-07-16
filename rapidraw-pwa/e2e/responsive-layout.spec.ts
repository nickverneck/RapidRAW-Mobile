import { test, expect } from '@playwright/test';

test.describe('Responsive Layout Tests', () => {
	test('should adapt layout for mobile devices', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		// Check that mobile navigation is present
		const mobileNav = page.locator('[data-testid="mobile-navigation"]');
		await expect(mobileNav).toBeVisible();

		// Check that desktop navigation is hidden on mobile
		const desktopNav = page.locator('[data-testid="desktop-navigation"]');
		await expect(desktopNav).not.toBeVisible();

		// Verify touch targets are appropriately sized (minimum 44px)
		const touchTargets = page.locator('[data-testid*="touch-target"]');
		const count = await touchTargets.count();
		
		for (let i = 0; i < count; i++) {
			const element = touchTargets.nth(i);
			const box = await element.boundingBox();
			if (box) {
				expect(box.width).toBeGreaterThanOrEqual(44);
				expect(box.height).toBeGreaterThanOrEqual(44);
			}
		}
	});

	test('should adapt layout for tablet devices', async ({ page }) => {
		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto('/');

		// Check that tablet layout utilizes larger screen space
		const mainContent = page.locator('[data-testid="main-content"]');
		await expect(mainContent).toBeVisible();

		// Verify side-by-side panel layout on tablet
		const leftPanel = page.locator('[data-testid="left-panel"]');
		const rightPanel = page.locator('[data-testid="right-panel"]');
		
		await expect(leftPanel).toBeVisible();
		await expect(rightPanel).toBeVisible();

		// Check that panels are positioned side by side
		const leftBox = await leftPanel.boundingBox();
		const rightBox = await rightPanel.boundingBox();
		
		if (leftBox && rightBox) {
			expect(leftBox.x + leftBox.width).toBeLessThanOrEqual(rightBox.x);
		}
	});

	test('should handle orientation changes', async ({ page }) => {
		await page.goto('/');

		// Test portrait orientation
		await page.setViewportSize({ width: 375, height: 667 });
		const portraitLayout = page.locator('[data-testid="layout-container"]');
		await expect(portraitLayout).toHaveClass(/portrait/);

		// Test landscape orientation
		await page.setViewportSize({ width: 667, height: 375 });
		await expect(portraitLayout).toHaveClass(/landscape/);
	});

	test('should provide accessible navigation on all devices', async ({ page }) => {
		const viewports = [
			{ width: 375, height: 667, name: 'mobile' },
			{ width: 768, height: 1024, name: 'tablet' },
			{ width: 1920, height: 1080, name: 'desktop' }
		];

		for (const viewport of viewports) {
			await page.setViewportSize(viewport);
			await page.goto('/');

			// Check for skip links
			const skipLink = page.locator('[data-testid="skip-to-main"]');
			await expect(skipLink).toBeInViewport();

			// Verify keyboard navigation works
			await page.keyboard.press('Tab');
			const focusedElement = page.locator(':focus');
			await expect(focusedElement).toBeVisible();

			// Check ARIA labels are present
			const navElements = page.locator('nav[aria-label]');
			await expect(navElements).toHaveCount(1);
		}
	});
});