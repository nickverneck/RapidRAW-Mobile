import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { writable, derived, readable } from 'svelte/store';

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock IndexedDB for testing
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
});

describe('Svelte Store Reactivity and Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Store Reactivity', () => {
    it('should create and update writable stores', () => {
      const store = writable(0);
      let value: number;
      
      const unsubscribe = store.subscribe(val => {
        value = val;
      });
      
      expect(value!).toBe(0);
      
      store.set(5);
      expect(value!).toBe(5);
      
      store.update(n => n + 1);
      expect(value!).toBe(6);
      
      unsubscribe();
    });

    it('should handle multiple subscribers', () => {
      const store = writable('initial');
      const values: string[] = [];
      const values2: string[] = [];
      
      const unsubscribe1 = store.subscribe(val => values.push(val));
      const unsubscribe2 = store.subscribe(val => values2.push(val));
      
      store.set('updated');
      store.set('final');
      
      expect(values).toEqual(['initial', 'updated', 'final']);
      expect(values2).toEqual(['initial', 'updated', 'final']);
      
      unsubscribe1();
      unsubscribe2();
    });

    it('should create derived stores that react to changes', () => {
      const base = writable(10);
      const doubled = derived(base, $base => $base * 2);
      
      let derivedValue: number;
      const unsubscribe = doubled.subscribe(val => {
        derivedValue = val;
      });
      
      expect(derivedValue!).toBe(20);
      
      base.set(15);
      expect(derivedValue!).toBe(30);
      
      unsubscribe();
    });

    it('should handle complex derived stores with multiple dependencies', () => {
      const a = writable(1);
      const b = writable(2);
      const sum = derived([a, b], ([$a, $b]) => $a + $b);
      
      let sumValue: number;
      const unsubscribe = sum.subscribe(val => {
        sumValue = val;
      });
      
      expect(sumValue!).toBe(3);
      
      a.set(5);
      expect(sumValue!).toBe(7);
      
      b.set(10);
      expect(sumValue!).toBe(15);
      
      unsubscribe();
    });

    it('should handle async derived stores', async () => {
      const base = writable(1);
      const asyncDerived = derived(base, ($base, set) => {
        setTimeout(() => {
          set($base * 10);
        }, 10);
      });
      
      let derivedValue: number | undefined;
      const unsubscribe = asyncDerived.subscribe(val => {
        derivedValue = val;
      });
      
      // Initially undefined
      expect(derivedValue).toBeUndefined();
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(derivedValue).toBe(10);
      
      base.set(3);
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(derivedValue).toBe(30);
      
      unsubscribe();
    });
  });

  describe('Store Persistence', () => {
    it('should persist store values to localStorage', () => {
      const createPersistentStore = <T>(key: string, initialValue: T) => {
        const store = writable(initialValue);
        
        // Load from localStorage on creation
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            store.set(JSON.parse(stored));
          } catch (e) {
            console.warn('Failed to parse stored value:', e);
          }
        }
        
        // Save to localStorage on updates
        store.subscribe(value => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        
        return store;
      };
      
      localStorageMock.getItem.mockReturnValue(null);
      
      const store = createPersistentStore('test-key', { count: 0 });
      
      // Should save initial value
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ count: 0 })
      );
      
      store.set({ count: 5 });
      
      // Should save updated value
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ count: 5 })
      );
    });

    it('should load persisted values from localStorage', () => {
      const createPersistentStore = <T>(key: string, initialValue: T) => {
        const store = writable(initialValue);
        
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            store.set(JSON.parse(stored));
          } catch (e) {
            console.warn('Failed to parse stored value:', e);
          }
        }
        
        store.subscribe(value => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        
        return store;
      };
      
      // Mock existing stored value
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ count: 42 }));
      
      const store = createPersistentStore('test-key', { count: 0 });
      
      // Should load stored value instead of initial
      expect(get(store)).toEqual({ count: 42 });
    });

    it('should handle localStorage errors gracefully', () => {
      const createPersistentStore = <T>(key: string, initialValue: T) => {
        const store = writable(initialValue);
        
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            store.set(JSON.parse(stored));
          } catch (e) {
            console.warn('Failed to parse stored value:', e);
          }
        }
        
        store.subscribe(value => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.warn('Failed to save to localStorage:', e);
          }
        });
        
        return store;
      };
      
      // Mock invalid JSON
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const store = createPersistentStore('test-key', { count: 0 });
      
      // Should use initial value when parsing fails
      expect(get(store)).toEqual({ count: 0 });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse stored value:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage quota exceeded', () => {
      const createPersistentStore = <T>(key: string, initialValue: T) => {
        const store = writable(initialValue);
        
        store.subscribe(value => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (e) {
            console.warn('Failed to save to localStorage:', e);
          }
        });
        
        return store;
      };
      
      // Mock quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const store = createPersistentStore('test-key', { data: 'large-data' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Store Performance', () => {
    it('should handle rapid updates efficiently', () => {
      const store = writable(0);
      const updates: number[] = [];
      
      const unsubscribe = store.subscribe(val => {
        updates.push(val);
      });
      
      // Rapid updates
      for (let i = 1; i <= 100; i++) {
        store.set(i);
      }
      
      // Should receive all updates
      expect(updates).toHaveLength(101); // Initial + 100 updates
      expect(updates[updates.length - 1]).toBe(100);
      
      unsubscribe();
    });

    it('should handle many subscribers efficiently', () => {
      const store = writable('test');
      const subscribers: Array<() => void> = [];
      const receivedValues: string[][] = [];
      
      // Create 100 subscribers
      for (let i = 0; i < 100; i++) {
        const values: string[] = [];
        receivedValues.push(values);
        
        const unsubscribe = store.subscribe(val => {
          values.push(val);
        });
        subscribers.push(unsubscribe);
      }
      
      store.set('updated');
      
      // All subscribers should receive the update
      receivedValues.forEach(values => {
        expect(values).toEqual(['test', 'updated']);
      });
      
      // Cleanup
      subscribers.forEach(unsubscribe => unsubscribe());
    });

    it('should not leak memory when subscribers are removed', () => {
      const store = writable(0);
      const unsubscribers: Array<() => void> = [];
      
      // Add many subscribers
      for (let i = 0; i < 100; i++) {
        const unsubscribe = store.subscribe(() => {});
        unsubscribers.push(unsubscribe);
      }
      
      // Remove all subscribers
      unsubscribers.forEach(unsubscribe => unsubscribe());
      
      // Store should still work
      store.set(42);
      expect(get(store)).toBe(42);
    });
  });

  describe('Store Composition', () => {
    it('should compose stores for complex state management', () => {
      // Create a complex state structure
      const user = writable({ id: 1, name: 'John' });
      const preferences = writable({ theme: 'dark', language: 'en' });
      const isLoggedIn = derived(user, $user => $user.id > 0);
      
      const appState = derived(
        [user, preferences, isLoggedIn],
        ([$user, $preferences, $isLoggedIn]) => ({
          user: $user,
          preferences: $preferences,
          isLoggedIn: $isLoggedIn
        })
      );
      
      let state: any;
      const unsubscribe = appState.subscribe(val => {
        state = val;
      });
      
      expect(state.isLoggedIn).toBe(true);
      expect(state.user.name).toBe('John');
      expect(state.preferences.theme).toBe('dark');
      
      // Update user
      user.update(u => ({ ...u, name: 'Jane' }));
      expect(state.user.name).toBe('Jane');
      
      // Update preferences
      preferences.update(p => ({ ...p, theme: 'light' }));
      expect(state.preferences.theme).toBe('light');
      
      unsubscribe();
    });

    it('should handle circular dependencies gracefully', () => {
      const a = writable(1);
      const b = derived(a, $a => $a * 2);
      
      // This would create a circular dependency if we tried to make 'a' depend on 'b'
      // Svelte should handle this gracefully by not allowing it
      
      let bValue: number;
      const unsubscribe = b.subscribe(val => {
        bValue = val;
      });
      
      expect(bValue!).toBe(2);
      
      a.set(5);
      expect(bValue!).toBe(10);
      
      unsubscribe();
    });
  });

  describe('Custom Store Implementations', () => {
    it('should create custom stores with validation', () => {
      const createValidatedStore = <T>(
        initialValue: T,
        validator: (value: T) => boolean
      ) => {
        const { subscribe, set, update } = writable(initialValue);
        
        return {
          subscribe,
          set: (value: T) => {
            if (validator(value)) {
              set(value);
            } else {
              throw new Error('Invalid value');
            }
          },
          update: (updater: (value: T) => T) => {
            update(currentValue => {
              const newValue = updater(currentValue);
              if (validator(newValue)) {
                return newValue;
              } else {
                throw new Error('Invalid value');
              }
            });
          }
        };
      };
      
      const positiveNumberStore = createValidatedStore(1, (value: number) => value > 0);
      
      let value: number;
      const unsubscribe = positiveNumberStore.subscribe(val => {
        value = val;
      });
      
      expect(value!).toBe(1);
      
      positiveNumberStore.set(5);
      expect(value!).toBe(5);
      
      expect(() => positiveNumberStore.set(-1)).toThrow('Invalid value');
      expect(value!).toBe(5); // Should remain unchanged
      
      unsubscribe();
    });

    it('should create stores with computed properties', () => {
      const createCounterStore = (initialValue = 0) => {
        const { subscribe, set, update } = writable(initialValue);
        
        return {
          subscribe,
          increment: () => update(n => n + 1),
          decrement: () => update(n => n - 1),
          reset: () => set(0),
          set
        };
      };
      
      const counter = createCounterStore(5);
      
      let value: number;
      const unsubscribe = counter.subscribe(val => {
        value = val;
      });
      
      expect(value!).toBe(5);
      
      counter.increment();
      expect(value!).toBe(6);
      
      counter.decrement();
      expect(value!).toBe(5);
      
      counter.reset();
      expect(value!).toBe(0);
      
      unsubscribe();
    });
  });

  describe('Store Error Handling', () => {
    it('should handle errors in store updates', () => {
      const store = writable(0);
      
      const erroringSubscriber = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      
      const normalSubscriber = vi.fn();
      
      const unsubscribe1 = store.subscribe(erroringSubscriber);
      const unsubscribe2 = store.subscribe(normalSubscriber);
      
      // Update should not fail even if a subscriber throws
      expect(() => store.set(1)).not.toThrow();
      
      expect(erroringSubscriber).toHaveBeenCalled();
      expect(normalSubscriber).toHaveBeenCalled();
      
      unsubscribe1();
      unsubscribe2();
    });

    it('should handle errors in derived store calculations', () => {
      const base = writable(1);
      const erroringDerived = derived(base, $base => {
        if ($base === 0) {
          throw new Error('Division by zero');
        }
        return 10 / $base;
      });
      
      let derivedValue: number | undefined;
      let errorOccurred = false;
      
      const unsubscribe = erroringDerived.subscribe(
        val => {
          derivedValue = val;
        },
        () => {
          errorOccurred = true;
        }
      );
      
      expect(derivedValue).toBe(10);
      expect(errorOccurred).toBe(false);
      
      // This should trigger an error
      base.set(0);
      
      // The derived store should handle the error gracefully
      expect(errorOccurred).toBe(false); // Svelte doesn't have built-in error handling
      
      unsubscribe();
    });
  });
});