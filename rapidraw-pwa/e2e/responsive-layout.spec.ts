import { test, expect, type Page } from '@playwright/test';

test.describe('Responsive Layout Foundation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile-First Responsive Design', () => {
    test('should display mobile layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      // Check mobile-specific elements are visible
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      await expect(mobileNav).toBeVisible();
      
      const menuButton = page.locator('[data-testid="menu-button"]');
      await expect(menuButton).toBeVisible();
      
      // Desktop navigation should be hidden
      const desktopNav = page.locator('[data-testid="desktop-navigation"]');
      await expect(desktopNav).not.toBeVisible();
    });

    test('should adapt layout for tablet screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      
      // Check tablet-specific layout
      const tabletLayout = page.locator('[data-testid="tablet-layout"]');
      await expect(tabletLayout).toBeVisible();
      
      // Should show side-by-side panels
      const leftPanel = page.locator('[data-testid="left-panel"]');
      const rightPanel = page.locator('[data-testid="right-panel"]');
      
      await expect(leftPanel).toBeVisible();
      await expect(rightPanel).toBeVisible();
      
      // Panels should be side by side
      const leftBounds = await leftPanel.boundingBox();
      const rightBounds = await rightPanel.boundingBox();
      
      if (leftBounds && rightBounds) {
        expect(leftBounds.x + leftBounds.width).toBeLessThanOrEqual(rightBounds.x + 10);
      }
    });

    test('should display desktop layout on large screens', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      
      // Desktop navigation should be visible
      const desktopNav = page.locator('[data-testid="desktop-navigation"]');
      await expect(desktopNav).toBeVisible();
      
      // Mobile menu button should be hidden
      const menuButton = page.locator('[data-testid="menu-button"]');
      await expect(menuButton).not.toBeVisible();
      
      // Should show full desktop layout
      const desktopLayout = page.locator('[data-testid="desktop-layout"]');
      await expect(desktopLayout).toBeVisible();
    });
  });

  test.describe('Breakpoint System', () => {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'tablet-large', width: 1024, height: 768 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'desktop-large', width: 1920, height: 1080 }
    ];

    for (const breakpoint of breakpoints) {
      test(`should adapt layout at ${breakpoint.name} breakpoint`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        
        // Check that layout adapts appropriately
        const layout = page.locator('[data-testid="main-layout"]');
        await expect(layout).toBeVisible();
        
        // Verify responsive classes are applied
        const layoutClasses = await layout.getAttribute('class');
        expect(layoutClasses).toContain('responsive');
        
        // Check that content fits within viewport
        const layoutBounds = await layout.boundingBox();
        if (layoutBounds) {
          expect(layoutBounds.width).toBeLessThanOrEqual(breakpoint.width);
          expect(layoutBounds.height).toBeLessThanOrEqual(breakpoint.height);
        }
      });
    }

    test('should handle orientation changes smoothly', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      
      const layout = page.locator('[data-testid="main-layout"]');
      const portraitClasses = await layout.getAttribute('class');
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(300); // Allow for transition
      
      const landscapeClasses = await layout.getAttribute('class');
      
      // Classes should reflect orientation change
      expect(landscapeClasses).not.toBe(portraitClasses);
      
      // Layout should still be functional
      await expect(layout).toBeVisible();
    });
  });

  test.describe('Adaptive Navigation', () => {
    test('should show hamburger menu on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const menuButton = page.locator('[data-testid="menu-button"]');
      await expect(menuButton).toBeVisible();
      
      // Menu button should be properly sized for touch
      const buttonBounds = await menuButton.boundingBox();
      if (buttonBounds) {
        expect(buttonBounds.width).toBeGreaterThanOrEqual(44);
        expect(buttonBounds.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should expand navigation drawer on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const menuButton = page.locator('[data-testid="menu-button"]');
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      
      // Initially drawer should be closed
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
      
      // Open drawer
      await menuButton.tap();
      
      // Drawer should be open and visible
      await expect(drawer).toHaveAttribute('aria-hidden', 'false');
      await expect(drawer).toBeVisible();
      
      // Drawer should cover appropriate portion of screen
      const drawerBounds = await drawer.boundingBox();
      const viewport = page.viewportSize();
      
      if (drawerBounds && viewport) {
        expect(drawerBounds.width).toBeGreaterThan(viewport.width * 0.6);
        expect(drawerBounds.width).toBeLessThan(viewport.width * 0.9);
      }
    });

    test('should show tab navigation on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const tabNavigation = page.locator('[data-testid="tab-navigation"]');
      await expect(tabNavigation).toBeVisible();
      
      // Tabs should be properly spaced
      const tabs = page.locator('[data-testid="nav-tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabBounds = await tab.boundingBox();
        
        if (tabBounds) {
          expect(tabBounds.width).toBeGreaterThanOrEqual(44);
          expect(tabBounds.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should show full navigation on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      
      const desktopNav = page.locator('[data-testid="desktop-navigation"]');
      await expect(desktopNav).toBeVisible();
      
      // All navigation items should be visible
      const navItems = page.locator('[data-testid="nav-item"]');
      const itemCount = await navItems.count();
      
      for (let i = 0; i < itemCount; i++) {
        await expect(navItems.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('Touch-Friendly Navigation Drawer', () => {
    test('should open drawer with swipe gesture', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
      
      // Simulate swipe from left edge
      await page.evaluate(() => {
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({ identifier: 0, target: document.body, clientX: 10, clientY: 300 })]
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

    test('should close drawer with swipe gesture', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
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

    test('should close drawer when tapping overlay', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open drawer
      const menuButton = page.locator('[data-testid="menu-button"]');
      await menuButton.tap();
      
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      await expect(drawer).toBeVisible();
      
      // Tap on overlay
      const overlay = page.locator('[data-testid="drawer-overlay"]');
      await overlay.tap();
      
      // Drawer should be closed
      await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });

    test('should have smooth drawer animations', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const drawer = page.locator('[data-testid="navigation-drawer"]');
      
      // Check initial state
      const initialTransform = await drawer.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Open drawer
      const menuButton = page.locator('[data-testid="menu-button"]');
      await menuButton.tap();
      
      // Wait for animation
      await page.waitForTimeout(100);
      
      // Check that transform changed (animation in progress)
      const midTransform = await drawer.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      expect(midTransform).not.toBe(initialTransform);
      
      // Wait for animation to complete
      await page.waitForTimeout(400);
      
      // Final state should be different from initial
      const finalTransform = await drawer.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      expect(finalTransform).not.toBe(initialTransform);
    });
  });

  test.describe('Viewport Meta Tags and Responsive Setup', () => {
    test('should have proper viewport meta tag', async ({ page }) => {
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      
      expect(viewportMeta).toContain('width=device-width');
      expect(viewportMeta).toContain('initial-scale=1');
      
      // Should prevent zoom on mobile
      expect(viewportMeta).toContain('user-scalable=no');
    });

    test('should handle safe area insets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
      
      // Check that safe area CSS variables are used
      const safeAreaStyles = await page.evaluate(() => {
        const computedStyle = window.getComputedStyle(document.documentElement);
        return {
          paddingTop: computedStyle.getPropertyValue('--safe-area-inset-top'),
          paddingBottom: computedStyle.getPropertyValue('--safe-area-inset-bottom')
        };
      });
      
      // Safe area variables should be defined
      expect(safeAreaStyles.paddingTop).toBeDefined();
      expect(safeAreaStyles.paddingBottom).toBeDefined();
    });

    test('should prevent horizontal scrolling on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that body doesn't have horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        return {
          overflowX: bodyStyle.overflowX,
          width: bodyStyle.width,
          maxWidth: bodyStyle.maxWidth
        };
      });
      
      expect(bodyOverflow.overflowX).toBe('hidden');
    });
  });

  test.describe('Content Adaptation', () => {
    test('should stack panels vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const leftPanel = page.locator('[data-testid="left-panel"]');
      const rightPanel = page.locator('[data-testid="right-panel"]');
      
      if (await leftPanel.isVisible() && await rightPanel.isVisible()) {
        const leftBounds = await leftPanel.boundingBox();
        const rightBounds = await rightPanel.boundingBox();
        
        if (leftBounds && rightBounds) {
          // Panels should be stacked vertically (right panel below left)
          expect(rightBounds.y).toBeGreaterThan(leftBounds.y + leftBounds.height - 10);
        }
      }
    });

    test('should arrange panels side-by-side on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const leftPanel = page.locator('[data-testid="left-panel"]');
      const rightPanel = page.locator('[data-testid="right-panel"]');
      
      await expect(leftPanel).toBeVisible();
      await expect(rightPanel).toBeVisible();
      
      const leftBounds = await leftPanel.boundingBox();
      const rightBounds = await rightPanel.boundingBox();
      
      if (leftBounds && rightBounds) {
        // Panels should be side by side
        expect(leftBounds.x + leftBounds.width).toBeLessThanOrEqual(rightBounds.x + 20);
        // Should be roughly at same vertical level
        expect(Math.abs(leftBounds.y - rightBounds.y)).toBeLessThan(50);
      }
    });

    test('should hide non-essential elements on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone 5
      
      // Non-essential elements should be hidden
      const decorativeElements = page.locator('[data-testid="decorative-element"]');
      const count = await decorativeElements.count();
      
      for (let i = 0; i < count; i++) {
        await expect(decorativeElements.nth(i)).not.toBeVisible();
      }
      
      // Essential elements should remain visible
      const essentialElements = page.locator('[data-testid="essential-element"]');
      const essentialCount = await essentialElements.count();
      
      for (let i = 0; i < essentialCount; i++) {
        await expect(essentialElements.nth(i)).toBeVisible();
      }
    });
  });
});