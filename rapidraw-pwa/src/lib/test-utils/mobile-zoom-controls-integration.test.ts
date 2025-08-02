import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import uiStore from '$lib/stores/uiStore';

// Mock browser environment
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 375, // Mobile width
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 667, // Mobile height
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Mobile Zoom Controls Integration', () => {
  beforeEach(() => {
    // Reset window size to mobile
    window.innerWidth = 375;
    window.innerHeight = 667;
  });

  it('should detect mobile viewport correctly after initialization', () => {
    // Initialize the uiStore
    uiStore.init();
    
    // Get the viewport state
    const viewport = get(uiStore.viewport);
    
    // Should detect mobile viewport
    expect(viewport.isMobile).toBe(true);
    expect(viewport.isTablet).toBe(false);
    expect(viewport.isDesktop).toBe(false);
    expect(viewport.width).toBe(375);
    expect(viewport.height).toBe(667);
  });

  it('should detect desktop viewport correctly', () => {
    // Change to desktop size
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    
    // Initialize the uiStore
    uiStore.init();
    
    // Get the viewport state
    const viewport = get(uiStore.viewport);
    
    // Should detect desktop viewport
    expect(viewport.isMobile).toBe(false);
    expect(viewport.isTablet).toBe(false);
    expect(viewport.isDesktop).toBe(true);
    expect(viewport.width).toBe(1920);
    expect(viewport.height).toBe(1080);
  });

  it('should detect tablet viewport correctly', () => {
    // Change to tablet size
    window.innerWidth = 768;
    window.innerHeight = 1024;
    
    // Initialize the uiStore
    uiStore.init();
    
    // Get the viewport state
    const viewport = get(uiStore.viewport);
    
    // Should detect tablet viewport
    expect(viewport.isMobile).toBe(false);
    expect(viewport.isTablet).toBe(true);
    expect(viewport.isDesktop).toBe(false);
    expect(viewport.width).toBe(768);
    expect(viewport.height).toBe(1024);
  });

  it('should update viewport on window resize', () => {
    // Start with mobile
    window.innerWidth = 375;
    window.innerHeight = 667;
    
    // Initialize the uiStore
    uiStore.init();
    
    // Verify initial mobile state
    let viewport = get(uiStore.viewport);
    expect(viewport.isMobile).toBe(true);
    
    // Simulate resize to desktop
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Check updated state
    viewport = get(uiStore.viewport);
    expect(viewport.isMobile).toBe(false);
    expect(viewport.isDesktop).toBe(true);
  });
});