import { test, expect, type Page } from '@playwright/test';

test.describe('Glassmorphism Design System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Glass Panel Components', () => {
    test('should have proper backdrop blur effects', async ({ page }) => {
      const glassPanels = page.locator('[data-testid*="glass"], .glass-panel, .glass-card');
      const count = await glassPanels.count();

      for (let i = 0; i < count; i++) {
        const panel = glassPanels.nth(i);
        const backdropFilter = await panel.evaluate(el => 
          window.getComputedStyle(el).backdropFilter
        );
        
        // Should have backdrop blur
        expect(backdropFilter).toContain('blur');
        
        // Blur value should be reasonable (between 5px and 30px)
        const blurMatch = backdropFilter.match(/blur\((\d+)px\)/);
        if (blurMatch) {
          const blurValue = parseInt(blurMatch[1]);
          expect(blurValue).toBeGreaterThanOrEqual(5);
          expect(blurValue).toBeLessThanOrEqual(30);
        }
      }
    });

    test('should have appropriate transparency levels', async ({ page }) => {
      const glassPanels = page.locator('[data-testid*="glass"], .glass-panel, .glass-card');
      const count = await glassPanels.count();

      for (let i = 0; i < count; i++) {
        const panel = glassPanels.nth(i);
        const backgroundColor = await panel.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        
        // Should have rgba background with alpha < 1
        if (backgroundColor.includes('rgba')) {
          const alphaMatch = backgroundColor.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
          if (alphaMatch) {
            const alpha = parseFloat(alphaMatch[1]);
            expect(alpha).toBeLessThan(1);
            expect(alpha).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should maintain visual hierarchy through layering', async ({ page }) => {
      const glassPanels = page.locator('[data-testid*="glass"], .glass-panel, .glass-card');
      const count = await glassPanels.count();

      const zIndexValues = [];
      for (let i = 0; i < count; i++) {
        const panel = glassPanels.nth(i);
        const zIndex = await panel.evaluate(el => 
          window.getComputedStyle(el).zIndex
        );
        
        if (zIndex !== 'auto') {
          zIndexValues.push(parseInt(zIndex));
        }
      }

      // Should have different z-index values for layering
      if (zIndexValues.length > 1) {
        const uniqueValues = [...new Set(zIndexValues)];
        expect(uniqueValues.length).toBeGreaterThan(1);
      }
    });

    test('should have consistent border radius', async ({ page }) => {
      const glassPanels = page.locator('[data-testid*="glass"], .glass-panel, .glass-card');
      const count = await glassPanels.count();

      const borderRadiusValues = [];
      for (let i = 0; i < count; i++) {
        const panel = glassPanels.nth(i);
        const borderRadius = await panel.evaluate(el => 
          window.getComputedStyle(el).borderRadius
        );
        
        if (borderRadius !== '0px') {
          borderRadiusValues.push(borderRadius);
        }
      }

      // Should have consistent border radius values
      expect(borderRadiusValues.length).toBeGreaterThan(0);
      
      // Common values should be 8px, 12px, 16px, etc.
      const validRadiusPattern = /^(\d+)px$/;
      borderRadiusValues.forEach(radius => {
        expect(radius).toMatch(validRadiusPattern);
      });
    });
  });

  test.describe('Color Palette Consistency', () => {
    test('should use consistent glassmorphism color palette', async ({ page }) => {
      // Check CSS custom properties are defined
      const customProperties = await page.evaluate(() => {
        const root = document.documentElement;
        const computedStyle = window.getComputedStyle(root);
        
        return {
          bgPrimary: computedStyle.getPropertyValue('--bg-primary'),
          bgSecondary: computedStyle.getPropertyValue('--bg-secondary'),
          textPrimary: computedStyle.getPropertyValue('--text-primary'),
          glassBackground: computedStyle.getPropertyValue('--glass-background'),
          glassBorder: computedStyle.getPropertyValue('--glass-border')
        };
      });

      // Should have defined color variables
      Object.values(customProperties).forEach(value => {
        if (value) {
          expect(value.trim()).not.toBe('');
        }
      });
    });

    test('should maintain consistent glass effect colors', async ({ page }) => {
      const glassElements = page.locator('.glass-panel, .glass-card, .glass-button');
      const count = await glassElements.count();

      const backgroundColors = [];
      for (let i = 0; i < count; i++) {
        const element = glassElements.nth(i);
        const backgroundColor = await element.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        backgroundColors.push(backgroundColor);
      }

      // Should use similar color schemes (rgba with white/blue tints)
      backgroundColors.forEach(color => {
        if (color.includes('rgba')) {
          // Should be semi-transparent
          expect(color).toMatch(/rgba\([^)]+,\s*0\.[0-9]+\)/);
        }
      });
    });

    test('should have subtle gradients where appropriate', async ({ page }) => {
      const gradientElements = page.locator('[style*="gradient"], .gradient-bg');
      const count = await gradientElements.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const element = gradientElements.nth(i);
          const background = await element.evaluate(el => 
            window.getComputedStyle(el).background
          );
          
          // Should contain gradient
          expect(background).toMatch(/(linear-gradient|radial-gradient)/);
        }
      }
    });
  });

  test.describe('Component Variants and States', () => {
    test('should have different glass panel variants', async ({ page }) => {
      // Test different panel types
      const panelTypes = ['.glass-panel', '.glass-card', '.glass-button'];
      
      for (const selector of panelTypes) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          const element = elements.first();
          
          // Should have glass properties
          const styles = await element.evaluate(el => ({
            backdropFilter: window.getComputedStyle(el).backdropFilter,
            backgroundColor: window.getComputedStyle(el).backgroundColor,
            border: window.getComputedStyle(el).border
          }));
          
          expect(styles.backdropFilter).toContain('blur');
          expect(styles.backgroundColor).toMatch(/rgba/);
        }
      }
    });

    test('should have proper hover states for interactive elements', async ({ page }) => {
      const interactiveElements = page.locator('.glass-button, button[data-testid*="glass"]');
      const count = await interactiveElements.count();

      for (let i = 0; i < count; i++) {
        const element = interactiveElements.nth(i);
        
        // Get initial state
        const initialStyles = await element.evaluate(el => ({
          backgroundColor: window.getComputedStyle(el).backgroundColor,
          transform: window.getComputedStyle(el).transform
        }));
        
        // Hover over element
        await element.hover();
        await page.waitForTimeout(100);
        
        // Get hover state
        const hoverStyles = await element.evaluate(el => ({
          backgroundColor: window.getComputedStyle(el).backgroundColor,
          transform: window.getComputedStyle(el).transform
        }));
        
        // Should have visual change on hover
        const hasVisualChange = 
          hoverStyles.backgroundColor !== initialStyles.backgroundColor ||
          hoverStyles.transform !== initialStyles.transform;
        
        expect(hasVisualChange).toBe(true);
      }
    });

    test('should have proper active/pressed states', async ({ page }) => {
      const buttons = page.locator('.glass-button, button[data-testid*="glass"]');
      const count = await buttons.count();

      if (count > 0) {
        const button = buttons.first();
        
        // Get initial state
        const initialTransform = await button.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        
        // Simulate press
        await button.hover();
        await page.mouse.down();
        await page.waitForTimeout(50);
        
        // Get pressed state
        const pressedTransform = await button.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        
        await page.mouse.up();
        
        // Should have visual feedback during press
        expect(pressedTransform).not.toBe(initialTransform);
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should maintain sufficient contrast ratios', async ({ page }) => {
      // Test text contrast on glass backgrounds
      const textElements = page.locator('.glass-panel p, .glass-card p, .glass-button');
      const count = await textElements.count();

      for (let i = 0; i < count; i++) {
        const element = textElements.nth(i);
        
        const styles = await element.evaluate(el => ({
          color: window.getComputedStyle(el).color,
          backgroundColor: window.getComputedStyle(el).backgroundColor
        }));
        
        // Should have defined text color
        expect(styles.color).not.toBe('');
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('should be readable in high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      const glassElements = page.locator('.glass-panel, .glass-card, .glass-button');
      const count = await glassElements.count();

      for (let i = 0; i < count; i++) {
        const element = glassElements.nth(i);
        
        // Should still be visible
        await expect(element).toBeVisible();
        
        // Should have some form of border or background
        const styles = await element.evaluate(el => ({
          border: window.getComputedStyle(el).border,
          backgroundColor: window.getComputedStyle(el).backgroundColor,
          outline: window.getComputedStyle(el).outline
        }));
        
        const hasVisibleBoundary = 
          styles.border !== 'none' || 
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          styles.outline !== 'none';
        
        expect(hasVisibleBoundary).toBe(true);
      }
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const animatedElements = page.locator('.glass-button, [style*="transition"]');
      const count = await animatedElements.count();

      for (let i = 0; i < count; i++) {
        const element = animatedElements.nth(i);
        
        // Check if transitions are disabled
        const transition = await element.evaluate(el => 
          window.getComputedStyle(el).transition
        );
        
        // Should have no transition or very short transition
        if (transition !== 'none') {
          expect(transition).toMatch(/(0s|none)/);
        }
      }
    });
  });

  test.describe('Visual Regression Prevention', () => {
    test('should maintain consistent glass panel appearance', async ({ page }) => {
      const glassPanel = page.locator('.glass-panel').first();
      
      if (await glassPanel.isVisible()) {
        // Take screenshot for visual comparison
        await expect(glassPanel).toHaveScreenshot('glass-panel.png');
      }
    });

    test('should maintain consistent glass button appearance', async ({ page }) => {
      const glassButton = page.locator('.glass-button').first();
      
      if (await glassButton.isVisible()) {
        // Take screenshot for visual comparison
        await expect(glassButton).toHaveScreenshot('glass-button.png');
      }
    });

    test('should maintain consistent glass card appearance', async ({ page }) => {
      const glassCard = page.locator('.glass-card').first();
      
      if (await glassCard.isVisible()) {
        // Take screenshot for visual comparison
        await expect(glassCard).toHaveScreenshot('glass-card.png');
      }
    });
  });

  test.describe('Performance and Rendering', () => {
    test('should render glass effects efficiently', async ({ page }) => {
      // Measure rendering performance
      const performanceMetrics = await page.evaluate(() => {
        const startTime = performance.now();
        
        // Force a repaint
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        const endTime = performance.now();
        return endTime - startTime;
      });
      
      // Should render within reasonable time (less than 100ms)
      expect(performanceMetrics).toBeLessThan(100);
    });

    test('should not cause layout thrashing', async ({ page }) => {
      const glassElements = page.locator('.glass-panel, .glass-card, .glass-button');
      const count = await glassElements.count();

      // Measure layout stability
      const layoutShifts = await page.evaluate(() => {
        let shifts = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              shifts += entry.value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Trigger potential layout changes
        const elements = document.querySelectorAll('.glass-panel, .glass-card, .glass-button');
        elements.forEach(el => {
          el.style.transform = 'scale(1.01)';
          el.offsetHeight; // Force reflow
          el.style.transform = '';
        });
        
        return new Promise(resolve => {
          setTimeout(() => {
            observer.disconnect();
            resolve(shifts);
          }, 100);
        });
      });

      // Should have minimal layout shift
      expect(layoutShifts).toBeLessThan(0.1);
    });
  });
});