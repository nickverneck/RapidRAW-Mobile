import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface NavigationState {
  isDrawerOpen: boolean;
  activeTab: string;
  activePanel: string;
  breadcrumbs: Array<{ label: string; href: string }>;
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: any;
  canClose: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number;
  actions?: Array<{ label: string; action: () => void }>;
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  showTooltips: boolean;
  enableAnimations: boolean;
  enableHapticFeedback: boolean;
  panelLayout: 'default' | 'compact' | 'expanded';
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right';
}

export interface KeyboardShortcuts {
  [key: string]: () => void;
}

// Default values
const defaultPreferences: UIPreferences = {
  theme: 'auto',
  language: 'en',
  showTooltips: true,
  enableAnimations: true,
  enableHapticFeedback: true,
  panelLayout: 'default',
  toolbarPosition: 'top'
};

const defaultViewport: ViewportInfo = {
  width: 1920,
  height: 1080,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  orientation: 'landscape'
};

const defaultNavigation: NavigationState = {
  isDrawerOpen: false,
  activeTab: 'editor',
  activePanel: 'adjustments',
  breadcrumbs: []
};

// Store state
const viewport = writable<ViewportInfo>(defaultViewport);
const navigation = writable<NavigationState>(defaultNavigation);
const modal = writable<ModalState>({ isOpen: false, type: null, data: null, canClose: true });
const toasts = writable<ToastMessage[]>([]);
const preferences = writable<UIPreferences>(defaultPreferences);
const isLoading = writable(false);
const keyboardShortcuts = writable<KeyboardShortcuts>({});
const toolbarCollapsed = writable(false);

// Derived stores
const breakpoint = derived(viewport, ($viewport) => {
  if ($viewport.width < 768) return 'mobile';
  if ($viewport.width < 1024) return 'tablet';
  if ($viewport.width < 1440) return 'desktop';
  return 'large';
});

const layoutType = derived(viewport, ($viewport) => {
  if ($viewport.isMobile) return 'mobile';
  if ($viewport.isTablet) return 'tablet';
  return 'desktop';
});

const effectiveTheme = derived(preferences, ($preferences) => {
  if ($preferences.theme === 'auto') {
    if (browser && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return $preferences.theme;
});

const shouldReduceMotion = derived(preferences, ($preferences) => {
  if (!$preferences.enableAnimations) return true;
  if (browser && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
});

const canUseHaptics = derived(preferences, ($preferences) => {
  return $preferences.enableHapticFeedback && 
         browser && 
         ('vibrate' in navigator || 'hapticFeedback' in navigator);
});

// Utility functions
function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function updateViewportInfo(): ViewportInfo {
  if (!browser) return defaultViewport;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const orientation = width > height ? 'landscape' : 'portrait';
  
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    orientation
  };
}

// Persistence functions
function savePreferences(prefs: UIPreferences): void {
  if (!browser) return;
  
  try {
    localStorage.setItem('rapidraw-ui-preferences', JSON.stringify(prefs));
  } catch (err) {
    console.warn('Failed to save UI preferences:', err);
  }
}

function loadPreferences(): UIPreferences {
  if (!browser) return defaultPreferences;
  
  try {
    const saved = localStorage.getItem('rapidraw-ui-preferences');
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Failed to load UI preferences:', err);
  }
  
  return defaultPreferences;
}

// Store actions
const uiStore = {
  // Subscriptions
  viewport,
  navigation,
  modal,
  toasts,
  preferences,
  isLoading,
  keyboardShortcuts,
  toolbarCollapsed,
  breakpoint,
  layoutType,
  effectiveTheme,
  shouldReduceMotion,
  canUseHaptics,

  // Actions
  init(): (() => void) | void {
    if (!browser) return;
    
    // Load saved preferences
    const savedPrefs = loadPreferences();
    preferences.set(savedPrefs);
    
    // Update viewport info
    viewport.set(updateViewportInfo());
    
    // Listen for viewport changes
    const handleResize = () => {
      viewport.set(updateViewportInfo());
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      // Trigger reactivity for auto theme
      preferences.update(prefs => ({ ...prefs }));
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  },

  // Navigation actions
  toggleDrawer(): void {
    navigation.update(nav => ({
      ...nav,
      isDrawerOpen: !nav.isDrawerOpen
    }));
  },

  openDrawer(): void {
    navigation.update(nav => ({
      ...nav,
      isDrawerOpen: true
    }));
  },

  closeDrawer(): void {
    navigation.update(nav => ({
      ...nav,
      isDrawerOpen: false
    }));
  },

  setActiveTab(tab: string): void {
    navigation.update(nav => ({
      ...nav,
      activeTab: tab
    }));
  },

  setActivePanel(panel: string): void {
    navigation.update(nav => ({
      ...nav,
      activePanel: panel
    }));
  },

  setBreadcrumbs(breadcrumbs: Array<{ label: string; href: string }>): void {
    navigation.update(nav => ({
      ...nav,
      breadcrumbs
    }));
  },

  // Modal actions
  openModal(type: string, data: any = null, canClose: boolean = true): void {
    modal.set({
      isOpen: true,
      type,
      data,
      canClose
    });
  },

  closeModal(): void {
    const currentModal = get(modal);
    if (currentModal.canClose) {
      modal.set({
        isOpen: false,
        type: null,
        data: null,
        canClose: true
      });
    }
  },

  // Toast actions
  showToast(
    type: ToastMessage['type'],
    title: string,
    message: string,
    duration: number = 5000,
    actions?: ToastMessage['actions']
  ): string {
    const id = generateToastId();
    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration,
      actions
    };
    
    toasts.update(currentToasts => [...currentToasts, toast]);
    
    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
    
    return id;
  },

  removeToast(id: string): void {
    toasts.update(currentToasts => currentToasts.filter(toast => toast.id !== id));
  },

  clearAllToasts(): void {
    toasts.set([]);
  },

  // Preference actions
  updatePreference<K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ): void {
    preferences.update(prefs => {
      const newPrefs = { ...prefs, [key]: value };
      savePreferences(newPrefs);
      return newPrefs;
    });
  },

  resetPreferences(): void {
    preferences.set(defaultPreferences);
    savePreferences(defaultPreferences);
  },

  // Keyboard shortcut actions
  registerShortcut(key: string, action: () => void): void {
    keyboardShortcuts.update(shortcuts => ({
      ...shortcuts,
      [key]: action
    }));
  },

  unregisterShortcut(key: string): void {
    keyboardShortcuts.update(shortcuts => {
      const newShortcuts = { ...shortcuts };
      delete newShortcuts[key];
      return newShortcuts;
    });
  },

  handleKeydown(event: KeyboardEvent): boolean {
    const shortcuts = get(keyboardShortcuts);
    const key = [
      event.ctrlKey && 'ctrl',
      event.metaKey && 'meta',
      event.altKey && 'alt',
      event.shiftKey && 'shift',
      event.key.toLowerCase()
    ].filter(Boolean).join('+');
    
    const action = shortcuts[key];
    if (action) {
      event.preventDefault();
      action();
      return true;
    }
    
    return false;
  },

  // Utility actions
  setLoading(loading: boolean): void {
    isLoading.set(loading);
  },

  triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    const canUse = get(canUseHaptics);
    if (!canUse) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: 25,
        medium: 50,
        heavy: 100
      };
      navigator.vibrate(patterns[intensity]);
    }
    
    if ('hapticFeedback' in navigator) {
      const feedbackTypes = {
        light: 'impactLight',
        medium: 'impactMedium',
        heavy: 'impactHeavy'
      };
      (navigator as any).hapticFeedback(feedbackTypes[intensity]);
    }
  },

  // Responsive helpers
  isMobileViewport(): boolean {
    return get(viewport).isMobile;
  },

  isTabletViewport(): boolean {
    return get(viewport).isTablet;
  },

  isDesktopViewport(): boolean {
    return get(viewport).isDesktop;
  },

  getCurrentBreakpoint(): string {
    return get(breakpoint);
  },

  // Theme helpers
  isDarkTheme(): boolean {
    return get(effectiveTheme) === 'dark';
  },

  isLightTheme(): boolean {
    return get(effectiveTheme) === 'light';
  },

  // Animation helpers
  shouldAnimate(): boolean {
    return !get(shouldReduceMotion);
  },

  // Accessibility helpers
  announceToScreenReader(message: string): void {
    if (!browser) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Focus management
  trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }
};

export default uiStore;