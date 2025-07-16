import { test, expect } from '@playwright/test';

test.describe('Glassmorphism UI Components', () => {
	test('should render glass panels with proper styling', async ({ page }) => {
		await page.goto('/');

		// Check for glass panel elements
		const glassPanels = page.locator('[data-testid="glass-panel"]');
		await expect(glassPanels.first()).toBeVisible();

		// Verify backdrop blur is applied
		const glassPanel = glassPanels.first();
		const styles = await glassPanel.evaluate((el) => {
			const computed = window.getComputedStyle(el);
			return {
				backdropFilter: computed.backdropFilter,
				background: computed.background,
				borderRadius: computed.borderRadius,
				border: computed.border
			};
		});

		// Check for backdrop blur effect
		expect(styles.backdropFilter).toContain('blur');
		
		// Check for translucent background
		expect(styles.background).toMatch(/rgba?\(.*,\s*0\.[0-9]+\)/);
		
		// Check for rounded corners
		expect(parseFloat(styles.borderRadius)).toBeGreaterThan(0);
	});

	test('should maintain visual hierarchy with transparency', async ({ page }) => {
		await page.goto('/');

		const overlayElements = page.locator('[data-testid*="overlay"]');
		const count = await overlayElements.count();

		for (let i = 0; i < count; i++) {
			const element = overlayElements.nth(i);
			const opacity = await element.evaluate((el) => {
				return window.getComputedStyle(el).opacity;
			});
			
			// Ensure elements have appropriate transparency
			expect(parseFloat(opacity)).toBeLessThan(1);
			expect(parseFloat(opacity)).toBeGreaterThan(0);
		}
	});

	test('should have sufficient contrast ratios for accessibility', async ({ page }) => {
		await page.goto('/');

		// Test text contrast on glass backgrounds
		const textElements = page.locator('[data-testid="glass-panel"] *:has-text("")');
		const count = await textElements.count();

		for (let i = 0; i < Math.min(count, 5); i++) {
			const element = textElements.nth(i);
			const isVisible = await element.isVisible();
			
			if (isVisible) {
				const styles = await element.evaluate((el) => {
					const computed = window.getComputedStyle(el);
					return {
						color: computed.color,
						backgroundColor: computed.backgroundColor
					};
				});

				// Basic check that text has color (not transparent)
				expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
			}
		}
	});

	test('should animate smoothly with glassmorphism effects', async ({ page }) => {
		await page.goto('/');

		// Test hover animations on glass elements
		const interactiveGlassElements = page.locator('[data-testid*="glass-button"], [data-testid*="glass-card"]');
		
		if (await interactiveGlassElements.count() > 0) {
			const element = interactiveGlassElements.first();
			
			// Get initial styles
			const initialStyles = await element.evaluate((el) => {
				const computed = window.getComputedStyle(el);
				return {
					transform: computed.transform,
					opacity: computed.opacity
				};
			});

			// Hover over element
			await element.hover();
			
			// Wait for potential animation
			await page.waitForTimeout(300);
			
			// Check if styles changed (indicating animation)
			const hoverStyles = await element.evaluate((el) => {
				const computed = window.getComputedStyle(el);
				return {
					transform: computed.transform,
					opacity: computed.opacity
				};
			});

			// At least one property should change on hover
			const hasChanged = initialStyles.transform !== hoverStyles.transform || 
							 initialStyles.opacity !== hoverStyles.opacity;
			
			expect(hasChanged).toBeTruthy();
		}
	});
});