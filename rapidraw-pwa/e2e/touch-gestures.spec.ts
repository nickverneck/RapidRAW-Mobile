import { test, expect, type Page } from '@playwright/test';

test.describe('Touch Gestures and Mobile Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Pinch-to-Zoom Functionality', () => {
    test('should support pinch-to-zoom with momentum on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      // Navigate to image editor
      await page.locator('[data-testid="image-editor"]').waitFor();

      // Simulate pinch gesture
      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Get initial transform state
      const initialTransform = await imageCanvas.evaluate(el =>
        window.getComputedStyle(el).transform
      );

      // Simulate pinch-to-zoom gesture
      await page.touchscreen.tap(200, 200);
      await page.touchscreen.tap(300, 300);

      // Use touch events to simulate pinch
      await page.evaluate(() => {
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        if (canvas) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [
              new Touch({ identifier: 0, target: canvas, clientX: 200, clientY: 200 }),
              new Touch({ identifier: 1, target: canvas, clientX: 300, clientY: 300 })
            ]
          });
          canvas.dispatchEvent(touchStart);

          // Simulate pinch out (zoom in)
          const touchMove = new TouchEvent('touchmove', {
            touches: [
              new Touch({ identifier: 0, target: canvas, clientX: 150, clientY: 150 }),
              new Touch({ identifier: 1, target: canvas, clientX: 350, clientY: 350 })
            ]
          });
          canvas.dispatchEvent(touchMove);

          const touchEnd = new TouchEvent('touchend', { touches: [] });
          canvas.dispatchEvent(touchEnd);
        }
      });

      // Wait for zoom animation to complete
      await page.waitForTimeout(500);

      // Verify zoom level changed
      const finalTransform = await imageCanvas.evaluate(el =>
        window.getComputedStyle(el).transform
      );

      expect(finalTransform).not.toBe(initialTransform);
    });

    test('should maintain zoom boundaries and prevent over-zoom', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Simulate extreme pinch-out gesture
      await page.evaluate(() => {
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        if (canvas) {
          // Simulate very large pinch gesture
          for (let i = 0; i < 10; i++) {
            const touchStart = new TouchEvent('touchstart', {
              touches: [
                new Touch({ identifier: 0, target: canvas, clientX: 200, clientY: 200 }),
                new Touch({ identifier: 1, target: canvas, clientX: 300, clientY: 300 })
              ]
            });
            canvas.dispatchEvent(touchStart);

            const touchMove = new TouchEvent('touchmove', {
              touches: [
                new Touch({ identifier: 0, target: canvas, clientX: 100 - i * 10, clientY: 100 - i * 10 }),
                new Touch({ identifier: 1, target: canvas, clientX: 400 + i * 10, clientY: 400 + i * 10 })
              ]
            });
            canvas.dispatchEvent(touchMove);

            const touchEnd = new TouchEvent('touchend', { touches: [] });
            canvas.dispatchEvent(touchEnd);
          }
        }
      });

      // Verify zoom is within reasonable bounds
      const transform = await imageCanvas.evaluate(el => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(parseFloat);
          return { scaleX: values[0], scaleY: values[3] };
        }
        return { scaleX: 1, scaleY: 1 };
      });

      // Zoom should be limited (e.g., max 5x)
      expect(transform.scaleX).toBeLessThanOrEqual(5);
      expect(transform.scaleY).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Pan Gestures with Boundary Constraints', () => {
    test('should support pan gestures with smooth movement', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Get initial position
      const initialPosition = await imageCanvas.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      });

      // Simulate pan gesture
      await page.evaluate(() => {
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        if (canvas) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: canvas, clientX: 200, clientY: 200 })]
          });
          canvas.dispatchEvent(touchStart);

          const touchMove = new TouchEvent('touchmove', {
            touches: [new Touch({ identifier: 0, target: canvas, clientX: 300, clientY: 250 })]
          });
          canvas.dispatchEvent(touchMove);

          const touchEnd = new TouchEvent('touchend', { touches: [] });
          canvas.dispatchEvent(touchEnd);
        }
      });

      await page.waitForTimeout(300);

      // Verify position changed
      const finalPosition = await imageCanvas.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      });

      expect(finalPosition.x).not.toBe(initialPosition.x);
    });

    test('should respect boundary constraints during pan', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Simulate extreme pan gesture beyond boundaries
      await page.evaluate(() => {
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        if (canvas) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: canvas, clientX: 200, clientY: 200 })]
          });
          canvas.dispatchEvent(touchStart);

          // Try to pan way beyond screen boundaries
          const touchMove = new TouchEvent('touchmove', {
            touches: [new Touch({ identifier: 0, target: canvas, clientX: 2000, clientY: 2000 })]
          });
          canvas.dispatchEvent(touchMove);

          const touchEnd = new TouchEvent('touchend', { touches: [] });
          canvas.dispatchEvent(touchEnd);
        }
      });

      await page.waitForTimeout(300);

      // Verify image stays within viewport bounds
      const position = await imageCanvas.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        return {
          x: rect.left,
          y: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          viewport
        };
      });

      // Image should not be completely outside viewport
      expect(position.right).toBeGreaterThan(0);
      expect(position.bottom).toBeGreaterThan(0);
      expect(position.x).toBeLessThan(position.viewport.width);
      expect(position.y).toBeLessThan(position.viewport.height);
    });
  });

  test.describe('Tap, Double-Tap, and Long-Press Recognition', () => {
    test('should recognize single tap gestures', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Listen for tap events
      await page.evaluate(() => {
        window.tapEventFired = false;
        const canvas = document.querySelector('[data-testid="image-canvas"]');
        if (canvas) {
          canvas.addEventListener('tap', () => {
            window.tapEventFired = true;
          });
        }
      });

      // Simulate single tap
      await page.touchscreen.tap(200, 200);
      await page.waitForTimeout(100);

      // Verify tap event was recognized
      const tapFired = await page.evaluate(() => window.tapEventFired);
      expect(tapFired).toBe(true);
    });

    test('should recognize double-tap gestures for zoom', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Get initial zoom level
      const initialZoom = await imageCanvas.evaluate(el => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform.match(/matrix\(([^)]+)\)/);
        return matrix ? parseFloat(matrix[1].split(',')[0]) : 1;
      });

      // Simulate double-tap
      await page.touchscreen.tap(200, 200);
      await page.waitForTimeout(50);
      await page.touchscreen.tap(200, 200);
      await page.waitForTimeout(300);

      // Verify zoom changed
      const finalZoom = await imageCanvas.evaluate(el => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform.match(/matrix\(([^)]+)\)/);
        return matrix ? parseFloat(matrix[1].split(',')[0]) : 1;
      });

      expect(finalZoom).not.toBe(initialZoom);
    });

    test('should recognize long-press gestures for context menu', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();

      // Listen for long-press events
      await page.evaluate(() => {
        window.longPressEventFired = false;
        const canvas = document.querySelector('[data-testid="image-canvas"]');
        if (canvas) {
          canvas.addEventListener('longpress', () => {
            window.longPressEventFired = true;
          });
        }
      });

      // Simulate long press (touch and hold)
      await page.evaluate(() => {
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        if (canvas) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: canvas, clientX: 200, clientY: 200 })]
          });
          canvas.dispatchEvent(touchStart);

          // Hold for long press duration
          setTimeout(() => {
            const touchEnd = new TouchEvent('touchend', { touches: [] });
            canvas.dispatchEvent(touchEnd);
          }, 800);
        }
      });

      await page.waitForTimeout(1000);

      // Verify long-press was recognized
      const longPressFired = await page.evaluate(() => window.longPressEventFired);
      expect(longPressFired).toBe(true);
    });
  });

  test.describe('Haptic Feedback Integration', () => {
    test('should trigger haptic feedback on supported devices', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      // Check if haptic feedback is available
      const hasHaptics = await page.evaluate(() => {
        return 'vibrate' in navigator || 'hapticFeedback' in navigator;
      });

      if (!hasHaptics) {
        test.skip('Haptic feedback not supported on this device');
      }

      const slider = page.locator('[data-testid="touch-slider"]');
      await slider.waitFor();

      // Listen for vibration calls
      await page.evaluate(() => {
        window.vibrationCalled = false;
        const originalVibrate = navigator.vibrate;
        navigator.vibrate = function (pattern) {
          window.vibrationCalled = true;
          return originalVibrate.call(this, pattern);
        };
      });

      // Interact with slider to trigger haptic feedback
      await slider.tap();
      await page.waitForTimeout(100);

      // Verify haptic feedback was triggered
      const vibrationCalled = await page.evaluate(() => window.vibrationCalled);
      expect(vibrationCalled).toBe(true);
    });

    test('should provide different haptic patterns for different interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const hasHaptics = await page.evaluate(() => 'vibrate' in navigator);
      if (!hasHaptics) {
        test.skip('Haptic feedback not supported on this device');
      }

      // Track vibration patterns
      await page.evaluate(() => {
        window.vibrationPatterns = [];
        const originalVibrate = navigator.vibrate;
        navigator.vibrate = function (pattern) {
          window.vibrationPatterns.push(pattern);
          return originalVibrate.call(this, pattern);
        };
      });

      // Test different interactions
      const button = page.locator('[data-testid="glass-button"]');
      await button.tap(); // Should trigger button haptic

      const slider = page.locator('[data-testid="touch-slider"]');
      await slider.tap(); // Should trigger slider haptic

      await page.waitForTimeout(200);

      // Verify different patterns were used
      const patterns = await page.evaluate(() => window.vibrationPatterns);
      expect(patterns.length).toBeGreaterThan(0);

      // Different interactions should have different patterns
      if (patterns.length > 1) {
        expect(patterns[0]).not.toEqual(patterns[1]);
      }
    });
  });

  test.describe('Touch Target Accessibility', () => {
    test('should have minimum 44px touch targets', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      // Check all interactive elements have minimum touch target size
      const touchTargets = await page.locator('[data-testid*="touch"], button, [role="button"]').all();

      for (const target of touchTargets) {
        const boundingBox = await target.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should provide visual feedback for touch interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');

      const button = page.locator('[data-testid="glass-button"]').first();
      await button.waitFor();

      // Get initial state
      const initialState = await button.evaluate(el => ({
        opacity: window.getComputedStyle(el).opacity,
        transform: window.getComputedStyle(el).transform
      }));

      // Simulate touch start
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="glass-button"]') as HTMLElement;
        if (btn) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: btn, clientX: 100, clientY: 100 })]
          });
          btn.dispatchEvent(touchStart);
        }
      });

      await page.waitForTimeout(100);

      // Check for visual feedback during touch
      const touchState = await button.evaluate(el => ({
        opacity: window.getComputedStyle(el).opacity,
        transform: window.getComputedStyle(el).transform
      }));

      // Should have some visual change during touch
      const hasVisualFeedback =
        touchState.opacity !== initialState.opacity ||
        touchState.transform !== initialState.transform;

      expect(hasVisualFeedback).toBe(true);
    });
  });
});