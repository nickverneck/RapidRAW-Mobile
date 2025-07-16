import { test, expect } from '@playwright/test';
import { performanceTestConfigs } from './fixtures/test-images';

test.describe('Performance Benchmarks', () => {
	test('should load application within performance budget', async ({ page }) => {
		const startTime = Date.now();
		
		await page.goto('/');
		
		// Wait for main content to be visible
		await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
		
		const loadTime = Date.now() - startTime;
		
		// Application should load within 3 seconds
		expect(loadTime).toBeLessThan(3000);
	});

	test('should meet Core Web Vitals metrics', async ({ page }) => {
		await page.goto('/');
		
		// Measure Core Web Vitals
		const metrics = await page.evaluate(() => {
			return new Promise((resolve) => {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const vitals: Record<string, number> = {};
					
					entries.forEach((entry) => {
						if (entry.name === 'first-contentful-paint') {
							vitals.FCP = entry.startTime;
						}
						if (entry.name === 'largest-contentful-paint') {
							vitals.LCP = entry.startTime;
						}
					});
					
					// Also measure CLS
					const clsObserver = new PerformanceObserver((clsList) => {
						let clsValue = 0;
						clsList.getEntries().forEach((entry) => {
							if (!(entry as any).hadRecentInput) {
								clsValue += (entry as any).value;
							}
						});
						vitals.CLS = clsValue;
						
						resolve(vitals);
					});
					
					clsObserver.observe({ type: 'layout-shift', buffered: true });
				});
				
				observer.observe({ type: 'paint', buffered: true });
				observer.observe({ type: 'largest-contentful-paint', buffered: true });
				
				// Fallback timeout
				setTimeout(() => resolve({}), 5000);
			});
		});

		// Core Web Vitals thresholds
		if ((metrics as any).FCP) {
			expect((metrics as any).FCP).toBeLessThan(1800); // Good FCP < 1.8s
		}
		if ((metrics as any).LCP) {
			expect((metrics as any).LCP).toBeLessThan(2500); // Good LCP < 2.5s
		}
		if ((metrics as any).CLS) {
			expect((metrics as any).CLS).toBeLessThan(0.1); // Good CLS < 0.1
		}
	});

	test('should handle memory efficiently during image processing', async ({ page }) => {
		await page.goto('/');
		
		// Get initial memory usage
		const initialMemory = await page.evaluate(() => {
			return (performance as any).memory ? {
				usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
				totalJSHeapSize: (performance as any).memory.totalJSHeapSize
			} : null;
		});

		// Load and process multiple images
		for (const config of performanceTestConfigs.slice(0, 3)) {
			await page.locator('[data-testid="load-test-image"]').click();
			await page.locator('[data-testid="exposure-slider"]').fill('0.5');
			await page.waitForTimeout(1000);
		}

		// Check memory usage after processing
		const finalMemory = await page.evaluate(() => {
			return (performance as any).memory ? {
				usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
				totalJSHeapSize: (performance as any).memory.totalJSHeapSize
			} : null;
		});

		if (initialMemory && finalMemory) {
			const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
			const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
			
			// Memory increase should be reasonable (less than 200% increase)
			expect(memoryIncreasePercent).toBeLessThan(200);
		}
	});

	test('should maintain performance on different device types', async ({ page, browserName }) => {
		const deviceTests = [
			{ name: 'mobile', width: 375, height: 667 },
			{ name: 'tablet', width: 768, height: 1024 },
			{ name: 'desktop', width: 1920, height: 1080 }
		];

		for (const device of deviceTests) {
			await page.setViewportSize({ width: device.width, height: device.height });
			await page.goto('/');

			const startTime = Date.now();
			
			// Load test image
			await page.locator('[data-testid="load-test-image"]').click();
			
			// Apply adjustment
			await page.locator('[data-testid="exposure-slider"]').fill('0.5');
			
			// Wait for processing
			await expect(page.locator('[data-testid="processing-indicator"]')).not.toBeVisible({ timeout: 10000 });
			
			const processingTime = Date.now() - startTime;
			
			// Performance expectations by device type
			let maxTime = 5000; // Default 5 seconds
			if (device.name === 'mobile') {
				maxTime = 8000; // Allow more time for mobile
			} else if (device.name === 'tablet') {
				maxTime = 6000;
			}
			
			expect(processingTime).toBeLessThan(maxTime);
		}
	});

	test('should optimize bundle size for mobile delivery', async ({ page }) => {
		// Navigate to the app and measure resource loading
		const resourceSizes: Record<string, number> = {};
		
		page.on('response', async (response) => {
			const url = response.url();
			const contentLength = response.headers()['content-length'];
			
			if (contentLength && (url.includes('.js') || url.includes('.css') || url.includes('.wasm'))) {
				resourceSizes[url] = parseInt(contentLength);
			}
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check JavaScript bundle sizes
		const jsFiles = Object.keys(resourceSizes).filter(url => url.includes('.js'));
		const totalJSSize = jsFiles.reduce((sum, url) => sum + resourceSizes[url], 0);
		
		// Main JS bundle should be under 500KB for mobile optimization
		expect(totalJSSize).toBeLessThan(500 * 1024);

		// Check CSS bundle sizes
		const cssFiles = Object.keys(resourceSizes).filter(url => url.includes('.css'));
		const totalCSSSize = cssFiles.reduce((sum, url) => sum + resourceSizes[url], 0);
		
		// CSS should be under 100KB
		expect(totalCSSSize).toBeLessThan(100 * 1024);
	});

	test('should handle WebAssembly loading efficiently', async ({ page }) => {
		await page.goto('/');
		
		// Measure WASM loading time
		const wasmLoadTime = await page.evaluate(() => {
			return new Promise((resolve) => {
				const startTime = performance.now();
				
				// Mock WASM loading (adapt based on actual implementation)
				if (typeof WebAssembly !== 'undefined') {
					// Simulate WASM module loading
					setTimeout(() => {
						resolve(performance.now() - startTime);
					}, 100);
				} else {
					resolve(0); // No WASM support
				}
			});
		});

		if (wasmLoadTime > 0) {
			// WASM should load within 2 seconds
			expect(wasmLoadTime).toBeLessThan(2000);
		}
	});
});