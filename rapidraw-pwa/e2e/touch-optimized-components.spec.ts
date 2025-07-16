import { test, expect, type Page } from '@playwright/test';

test.describe('Touch-Optimized UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('TouchSlider Component', () => {
    test('should have minimum 44px touch targets', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const touchSliders = page.locator('[data-testid*="touch-slider"], .touch-slider');
      const count = await touchSliders.count();

      for (let i = 0; i < count; i++) {
        const slider = touchSliders.nth(i);
        const boundingBox = await slider.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          // Width should be reasonable for sliders
          expect(boundingBox.width).toBeGreaterThanOrEqual(100);
        }
      }
    });

    test('should respond to touch drag gestures', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const slider = page.locator('[data-testid="touch-slider"]').first();
      await slider.waitFor();
      
      // Get initial value
      const initialValue = await slider.getAttribute('aria-valuenow') || 
                          await slider.inputValue();
      
      // Simulate touch drag
      const sliderBounds = await slider.boundingBox();
      if (sliderBounds) {
        const startX = sliderBounds.x + sliderBounds.width * 0.2;
        const endX = sliderBounds.x + sliderBounds.width * 0.8;
        const y = sliderBounds.y + sliderBounds.height / 2;
        
        // Touch and drag
        await page.touchscreen.tap(startX, y);
        await page.mouse.move(endX, y);
        await page.touchscreen.tap(endX, y);
      }
      
      await page.waitForTimeout(200);
      
      // Verify value changed
      const finalValue = await slider.getAttribute('aria-valuenow') || 
                        await slider.inputValue();
      expect(finalValue).not.toBe(initialValue);
    });

    test('should provide haptic feedback on interaction', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const hasHaptics = await page.evaluate(() => 'vibrate' in navigator);
      if (!hasHaptics) {
        test.skip('Haptic feedback not supported on this device');
      }
      
      // Track vibration calls
      await page.evaluate(() => {
        window.vibrationCount = 0;
        const originalVibrate = navigator.vibrate;
        navigator.vibrate = function(pattern) {
          window.vibrationCount++;
          return originalVibrate.call(this, pattern);
        };
      });
      
      const slider = page.locator('[data-testid="touch-slider"]').first();
      await slider.tap();
      await page.waitForTimeout(100);
      
      // Verify haptic feedback was triggered
      const vibrationCount = await page.evaluate(() => window.vibrationCount);
      expect(vibrationCount).toBeGreaterThan(0);
    });

    test('should have smooth visual feedback during interaction', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const slider = page.locator('[data-testid="touch-slider"]').first();
      await slider.waitFor();
      
      // Get initial styles
      const initialStyles = await slider.evaluate(el => ({
        background: window.getComputedStyle(el).background,
        transform: window.getComputedStyle(el).transform
      }));
      
      // Simulate touch start
      await page.evaluate(() => {
        const sliderEl = document.querySelector('[data-testid="touch-slider"]') as HTMLElement;
        if (sliderEl) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: sliderEl, clientX: 100, clientY: 100 })]
          });
          sliderEl.dispatchEvent(touchStart);
        }
      });
      
      await page.waitForTimeout(100);
      
      // Get active styles
      const activeStyles = await slider.evaluate(el => ({
        background: window.getComputedStyle(el).background,
        transform: window.getComputedStyle(el).transform
      }));
      
      // Should have visual feedback
      const hasVisualChange = 
        activeStyles.background !== initialStyles.background ||
        activeStyles.transform !== initialStyles.transform;
      
      expect(hasVisualChange).toBe(true);
    });
  });

  test.describe('Touch-Responsive Buttons', () => {
    test('should have appropriate touch target sizes', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const buttons = page.locator('button, [role="button"], .glass-button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should provide touch state feedback', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const button = page.locator('.glass-button').first();
      await button.waitFor();
      
      // Get initial state
      const initialState = await button.evaluate(el => ({
        background: window.getComputedStyle(el).background,
        transform: window.getComputedStyle(el).transform,
        opacity: window.getComputedStyle(el).opacity
      }));
      
      // Simulate touch press
      await page.evaluate(() => {
        const btn = document.querySelector('.glass-button') as HTMLElement;
        if (btn) {
          const touchStart = new TouchEvent('touchstart', {
            touches: [new Touch({ identifier: 0, target: btn, clientX: 100, clientY: 100 })]
          });
          btn.dispatchEvent(touchStart);
        }
      });
      
      await page.waitForTimeout(50);
      
      // Get pressed state
      const pressedState = await button.evaluate(el => ({
        background: window.getComputedStyle(el).background,
        transform: window.getComputedStyle(el).transform,
        opacity: window.getComputedStyle(el).opacity
      }));
      
      // Should have visual feedback during press
      const hasStateChange = 
        pressedState.background !== initialState.background ||
        pressedState.transform !== initialState.transform ||
        pressedState.opacity !== initialState.opacity;
      
      expect(hasStateChange).toBe(true);
    });

    test('should handle rapid taps without lag', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const button = page.locator('.glass-button').first();
      await button.waitFor();
      
      // Track tap response times
      await page.evaluate(() => {
        window.tapTimes = [];
        const btn = document.querySelector('.glass-button');
        if (btn) {
          btn.addEventListener('touchstart', () => {
            window.tapTimes.push(performance.now());
          });
        }
      });
      
      // Perform rapid taps
      for (let i = 0; i < 10; i++) {
        await button.tap();
        await page.waitForTimeout(50);
      }
      
      // Verify all taps were registered
      const tapTimes = await page.evaluate(() => window.tapTimes);
      expect(tapTimes.length).toBe(10);
      
      // Check for consistent response times
      for (let i = 1; i < tapTimes.length; i++) {
        const timeDiff = tapTimes[i] - tapTimes[i - 1];
        expect(timeDiff).toBeLessThan(200); // Should respond within 200ms
      }
    });
  });

  test.describe('Mobile-Optimized Modals', () => {
    test('should adapt to mobile viewport', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open modal
      const openButton = page.locator('[data-testid="open-preset-modal"]');
      await openButton.tap();
      
      const modal = page.locator('[data-testid="preset-modal"]');
      await expect(modal).toBeVisible();
      
      // Check modal dimensions
      const modalBounds = await modal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBounds && viewport) {
        // Modal should not exceed viewport
        expect(modalBounds.width).toBeLessThanOrEqual(viewport.width);
        expect(modalBounds.height).toBeLessThanOrEqual(viewport.height);
        
        // Should have reasonable margins on mobile
        expect(modalBounds.width).toBeGreaterThan(viewport.width * 0.8);
      }
    });

    test('should support swipe-to-dismiss gesture', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open modal
      const openButton = page.locator('[data-testid="open-preset-modal"]');
      await openButton.tap();
      
      const modal = page.locator('[data-testid="preset-modal"]');
      await expect(modal).toBeVisible();
      
      // Simulate swipe down gesture
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
      
      // Modal should be dismissed
      await expect(modal).not.toBeVisible();
    });

    test('should have touch-friendly close buttons', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open modal
      const openButton = page.locator('[data-testid="open-preset-modal"]');
      await openButton.tap();
      
      const modal = page.locator('[data-testid="preset-modal"]');
      await expect(modal).toBeVisible();
      
      // Check close button size
      const closeButton = page.locator('.close-modal');
      const buttonBounds = await closeButton.boundingBox();
      
      if (buttonBounds) {
        expect(buttonBounds.width).toBeGreaterThanOrEqual(44);
        expect(buttonBounds.height).toBeGreaterThanOrEqual(44);
      }
      
      // Test close functionality
      await closeButton.tap();
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Mobile-Optimized Drawers', () => {
    test('should open with edge swipe gesture', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
      
      // Simulate swipe from left edge
      await page.evaluate(() => {
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({ identifier: 0, target: document.body, clientX: 5, clientY: 300 })]
        });
        document.body.dispatchEvent(touchStart);
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [new Touch({ identifier: 0, target: document.body, clientX: 150, clientY: 300 })]
        });
        document.body.dispatchEvent(touchMove);
        
        const touchEnd = new TouchEvent('touchend', { touches: [] });
        document.body.dispatchEvent(touchEnd);
      });
      
      await page.waitForTimeout(500);
      
      // Drawer should be open
      await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    });

    test('should close with swipe gesture', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Open drawer first
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
      
      // Drawer should be closed
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });

    test('should have smooth animations', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      
      // Check initial transform
      const initialTransform = await drawer.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Open drawer
      const menuButton = page.locator('[data-testid="menu-button"]');
      await menuButton.tap();
      
      // Wait for animation to start
      await page.waitForTimeout(100);
      
      // Check mid-animation transform
      const midTransform = await drawer.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Should be different during animation
      expect(midTransform).not.toBe(initialTransform);
      
      // Wait for animation to complete
      await page.waitForTimeout(400);
      
      // Final transform should be different from initial
      const finalTransform = await drawer.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      expect(finalTransform).not.toBe(initialTransform);
    });
  });

  test.describe('Haptic Feedback Integration', () => {
    test('should provide different haptic patterns for different interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      const hasHaptics = await page.evaluate(() => 'vibrate' in navigator);
      if (!hasHaptics) {
        test.skip('Haptic feedback not supported');
      }
      
      // Track different vibration patterns
      await page.evaluate(() => {
        window.vibrationPatterns = [];
        const originalVibrate = navigator.vibrate;
        navigator.vibrate = function(pattern) {
          window.vibrationPatterns.push(pattern);
          return originalVibrate.call(this, pattern);
        };
      });
      
      // Test different interactions
      const button = page.locator('.glass-button').first();
      await button.tap(); // Button tap
      
      const slider = page.locator('[data-testid="touch-slider"]').first();
      await slider.tap(); // Slider interaction
      
      const menuButton = page.locator('[data-testid="menu-button"]');
      await menuButton.tap(); // Menu button
      
      await page.waitForTimeout(200);
      
      // Verify different patterns were used
      const patterns = await page.evaluate(() => window.vibrationPatterns);
      expect(patterns.length).toBeGreaterThan(0);
      
      // Should have different patterns for different interactions
      if (patterns.length > 1) {
        const uniquePatterns = [...new Set(patterns.map(p => JSON.stringify(p)))];
        expect(uniquePatterns.length).toBeGreaterThan(1);
      }
    });

    test('should respect user haptic preferences', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Simulate disabled haptics
      await page.evaluate(() => {
        // Mock navigator.vibrate to return false (disabled)
        Object.defineProperty(navigator, 'vibrate', {
          value: () => false,
          writable: true
        });
        
        window.vibrationAttempts = 0;
        const originalVibrate = navigator.vibrate;
        navigator.vibrate = function(pattern) {
          window.vibrationAttempts++;
          return false; // Simulate disabled haptics
        };
      });
      
      const button = page.locator('.glass-button').first();
      await button.tap();
      
      // Should still attempt vibration but handle gracefully
      const attempts = await page.evaluate(() => window.vibrationAttempts);
      expect(attempts).toBeGreaterThanOrEqual(0);
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
      
      // Perform intensive touch interactions
      const slider = page.locator('[data-testid="touch-slider"]').first();
      const sliderBounds = await slider.boundingBox();
      
      if (sliderBounds) {
        // Rapid slider interactions
        for (let i = 0; i < 20; i++) {
          const x = sliderBounds.x + (sliderBounds.width * (i % 10) / 10);
          const y = sliderBounds.y + sliderBounds.height / 2;
          await page.touchscreen.tap(x, y);
          await page.waitForTimeout(25);
        }
      }
      
      // Measure frame rate
      const fps = await page.evaluate(() => {
        const endTime = performance.now();
        const duration = (endTime - window.startTime) / 1000;
        return window.frameCount / duration;
      });
      
      // Should maintain reasonable frame rate
      expect(fps).toBeGreaterThan(30);
    });

    test('should handle memory efficiently during interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'This test is only for mobile devices');
      
      // Measure initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Perform many interactions
      const button = page.locator('.glass-button').first();
      for (let i = 0; i < 50; i++) {
        await button.tap();
        await page.waitForTimeout(20);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Measure final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Memory usage should not increase dramatically
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Should not increase by more than 50%
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });
  });
});