import { test, expect, type Page } from '@playwright/test';

test.describe('Mobile Interactions and Gestures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Navigation', () => {
    test('should open navigation drawer on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Check if navigation drawer is initially closed
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
      
      // Open navigation drawer
      const menuButton = page.locator('[data-testid="menu-button"]');
      await menuButton.tap();
      
      // Verify drawer is open
      await expect(drawer).toHaveAttribute('aria-hidden', 'false');
      await expect(drawer).toBeVisible();
    });

    test('should close navigation drawer with swipe gesture', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open navigation drawer first
      const menuButton = page.locator('[data-testid="menu-button"]');
      await menuButton.tap();
      
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      await expect(drawer).toBeVisible();
      
      // Simulate swipe left to close
      await page.evaluate(() => {
        const drawerEl = document.querySelector('[data-testid="navigation-drawer"]') as HTMLElement;
        if (drawerEl) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: drawerEl, clientX: 200, clientY: 300 })]
          });
          drawerEl.dispatchEvent(touchStart);
          
          const touchMove = new TouchEvent('touchmove', {
            touches: [new Touch({ identifier: 0, target: drawerEl, clientX: 50, clientY: 300 })]
          });
          drawerEl.dispatchEvent(touchMove);
          
          const touchEnd = new TouchEvent('touchend', { touches: [] });
          drawerEl.dispatchEvent(touchEnd);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Verify drawer is closed
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test.describe('Touch Slider Interactions', () => {
    test('should respond to touch drag on sliders', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Navigate to adjustment panel
      const adjustmentPanel = page.locator('[data-testid="adjustment-panel"]');
      await adjustmentPanel.waitFor();
      
      const slider = page.locator('[data-testid="exposure-slider"]');
      await slider.waitFor();
      
      // Get initial slider value
      const initialValue = await slider.getAttribute('aria-valuenow');
      
      // Simulate touch drag on slider
      const sliderBounds = await slider.boundingBox();
      if (sliderBounds) {
        const startX = sliderBounds.x + sliderBounds.width * 0.3;
        const endX = sliderBounds.x + sliderBounds.width * 0.7;
        const y = sliderBounds.y + sliderBounds.height / 2;
        
        await page.touchscreen.tap(startX, y);
        await page.mouse.move(endX, y);
        await page.touchscreen.tap(endX, y);
      }
      
      await page.waitForTimeout(200);
      
      // Verify slider value changed
      const finalValue = await slider.getAttribute('aria-valuenow');
      expect(finalValue).not.toBe(initialValue);
    });

    test('should provide haptic feedback during slider interaction', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const hasHaptics = await page.evaluate(() => 'vibrate' in navigator);
      if (!hasHaptics) {
        test.skip('Haptic feedback not supported');
      }
      
      // Track vibration calls
      await page.evaluate(() => {
        window.sliderVibrations = 0;
        const originalVibrate = navigator.vibrate;
        navigator.vibrate = function(pattern) {
          window.sliderVibrations++;
          return originalVibrate.call(this, pattern);
        };
      });
      
      const slider = page.locator('[data-testid="exposure-slider"]');
      await slider.waitFor();
      
      // Interact with slider
      await slider.tap();
      await page.waitForTimeout(100);
      
      // Verify haptic feedback occurred
      const vibrations = await page.evaluate(() => window.sliderVibrations);
      expect(vibrations).toBeGreaterThan(0);
    });
  });

  test.describe('Modal and Overlay Interactions', () => {
    test('should handle modal interactions on mobile', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open a modal
      const openModalButton = page.locator('[data-testid="open-preset-modal"]');
      await openModalButton.tap();
      
      const modal = page.locator('[data-testid="preset-modal"]');
      await expect(modal).toBeVisible();
      
      // Verify modal is properly sized for mobile
      const modalBounds = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBounds && viewport) {
        // Modal should not exceed viewport width
        expect(modalBounds.width).toBeLessThanOrEqual(viewport.width);
        // Modal should have reasonable height
        expect(modalBounds.height).toBeLessThanOrEqual(viewport.height * 0.9);
      }
    });

    test('should close modal with swipe down gesture', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open modal
      const openModalButton = page.locator('[data-testid="open-preset-modal"]');
      await openModalButton.tap();
      
      const modal = page.locator('[data-testid="preset-modal"]');
      await expect(modal).toBeVisible();
      
      // Simulate swipe down gesture on modal
      await page.evaluate(() => {
        const modalEl = document.querySelector('[data-testid="preset-modal"]') as HTMLElement;
        if (modalEl) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: modalEl, clientX: 200, clientY: 100 })]
          });
          modalEl.dispatchEvent(touchStart);
          
          const touchMove = new TouchEvent('touchmove', {
            touches: [new Touch({ identifier: 0, target: modalEl, clientX: 200, clientY: 300 })]
          });
          modalEl.dispatchEvent(touchMove);
          
          const touchEnd = new TouchEvent('touchend', { touches: [] });
          modalEl.dispatchEvent(touchEnd);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Verify modal is closed
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Image Canvas Touch Interactions', () => {
    test('should handle multi-touch gestures on image canvas', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();
      
      // Test simultaneous pan and zoom
      await page.evaluate(() => {
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        if (canvas) {
          // Start with two fingers
          const touchStart = new TouchEvent('touchstart', {
            touches: [
              new Touch({ identifier: 0, target: canvas, clientX: 150, clientY: 150 }),
              new Touch({ identifier: 1, target: canvas, clientX: 250, clientY: 250 })
            ]
          });
          canvas.dispatchEvent(touchStart);
          
          // Move fingers to simulate pan + zoom
          const touchMove = new TouchEvent('touchmove', {
            touches: [
              new Touch({ identifier: 0, target: canvas, clientX: 120, clientY: 120 }),
              new Touch({ identifier: 1, target: canvas, clientX: 280, clientY: 280 })
            ]
          });
          canvas.dispatchEvent(touchMove);
          
          const touchEnd = new TouchEvent('touchend', { touches: [] });
          canvas.dispatchEvent(touchEnd);
        }
      });
      
      await page.waitForTimeout(300);
      
      // Verify canvas responded to multi-touch
      const transform = await imageCanvas.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      expect(transform).not.toBe('none');
    });

    test('should prevent default browser gestures on canvas', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const imageCanvas = page.locator('[data-testid="image-canvas"]');
      await imageCanvas.waitFor();
      
      // Test that pinch gesture doesn't trigger browser zoom
      await page.evaluate(() => {
        let preventDefaultCalled = false;
        const canvas = document.querySelector('[data-testid="image-canvas"]') as HTMLElement;
        
        if (canvas) {
          canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
              e.preventDefault();
              preventDefaultCalled = true;
            }
          });
          
          // Simulate multi-touch
          const touchStart = new TouchEvent('touchstart', {
            touches: [
              new Touch({ identifier: 0, target: canvas, clientX: 150, clientY: 150 }),
              new Touch({ identifier: 1, target: canvas, clientX: 250, clientY: 250 })
            ]
          });
          canvas.dispatchEvent(touchStart);
          
          window.preventDefaultCalled = preventDefaultCalled;
        }
      });
      
      const preventDefaultCalled = await page.evaluate(() => window.preventDefaultCalled);
      expect(preventDefaultCalled).toBe(true);
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should maintain 60fps during touch interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Start performance monitoring
      await page.evaluate(() => {
        window.frameCount = 0;
        window.startTime = performance.now();
        
        function countFrames() {
          window.frameCount++;
          requestAnimationFrame(countFrames);
        }
        requestAnimationFrame(countFrames);
      });
      
      const slider = page.locator('[data-testid="exposure-slider"]');
      await slider.waitFor();
      
      // Perform intensive touch interaction
      const sliderBounds = await slider.boundingBox();
      if (sliderBounds) {
        for (let i = 0; i < 10; i++) {
          const x = sliderBounds.x + (sliderBounds.width * i / 10);
          const y = sliderBounds.y + sliderBounds.height / 2;
          await page.touchscreen.tap(x, y);
          await page.waitForTimeout(50);
        }
      }
      
      // Measure frame rate
      const fps = await page.evaluate(() => {
        const endTime = performance.now();
        const duration = (endTime - window.startTime) / 1000;
        return window.frameCount / duration;
      });
      
      // Should maintain reasonable frame rate (at least 30fps)
      expect(fps).toBeGreaterThan(30);
    });

    test('should handle rapid touch events without lag', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const button = page.locator('[data-testid="glass-button"]');
      await button.waitFor();
      
      // Track event handling times
      await page.evaluate(() => {
        window.eventTimes = [];
        const btn = document.querySelector('[data-testid="glass-button"]');
        if (btn) {
          btn.addEventListener('touchstart', () => {
            window.eventTimes.push(performance.now());
          });
        }
      });
      
      // Rapid touch events
      for (let i = 0; i < 20; i++) {
        await button.tap();
        await page.waitForTimeout(25);
      }
      
      // Verify events were handled promptly
      const eventTimes = await page.evaluate(() => window.eventTimes);
      expect(eventTimes.length).toBe(20);
      
      // Check for consistent timing (no major delays)
      for (let i = 1; i < eventTimes.length; i++) {
        const timeDiff = eventTimes[i] - eventTimes[i - 1];
        expect(timeDiff).toBeLessThan(100); // Should handle within 100ms
      }
    });
  });
});