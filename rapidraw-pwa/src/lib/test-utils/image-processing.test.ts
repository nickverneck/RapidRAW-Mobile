import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { writable, derived } from 'svelte/store';

// Mock image data structure
interface ImageData {
  id: string;
  name: string;
  width: number;
  height: number;
  data: ArrayBuffer | null;
  metadata: Record<string, any>;
}

interface ImageAdjustments {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  adjustments: ImageAdjustments;
  description: string;
}

// Mock WebAssembly module
const mockWasmModule = {
  process_image: vi.fn(),
  get_histogram: vi.fn(),
  apply_adjustments: vi.fn(),
};

// Mock file reading
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  result: null,
  onload: null,
  onerror: null,
};

Object.defineProperty(window, 'FileReader', {
  value: vi.fn(() => mockFileReader)
});

describe('Image Data State Management and History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Image Store Management', () => {
    it('should create and manage image store', () => {
      const createImageStore = () => {
        const images = writable<ImageData[]>([]);
        const currentImageId = writable<string | null>(null);
        
        const currentImage = derived(
          [images, currentImageId],
          ([$images, $currentImageId]) => {
            return $images.find(img => img.id === $currentImageId) || null;
          }
        );
        
        return {
          images,
          currentImageId,
          currentImage,
          addImage: (image: ImageData) => {
            images.update(imgs => [...imgs, image]);
          },
          removeImage: (id: string) => {
            images.update(imgs => imgs.filter(img => img.id !== id));
            currentImageId.update(currentId => currentId === id ? null : currentId);
          },
          setCurrentImage: (id: string) => {
            currentImageId.set(id);
          }
        };
      };
      
      const imageStore = createImageStore();
      
      const testImage: ImageData = {
        id: 'test-1',
        name: 'test.jpg',
        width: 1920,
        height: 1080,
        data: new ArrayBuffer(1024),
        metadata: { camera: 'Canon EOS R5' }
      };
      
      // Add image
      imageStore.addImage(testImage);
      
      const images = get(imageStore.images);
      expect(images).toHaveLength(1);
      expect(images[0]).toEqual(testImage);
      
      // Set current image
      imageStore.setCurrentImage('test-1');
      
      const currentImage = get(imageStore.currentImage);
      expect(currentImage).toEqual(testImage);
      
      // Remove image
      imageStore.removeImage('test-1');
      
      const imagesAfterRemoval = get(imageStore.images);
      const currentImageAfterRemoval = get(imageStore.currentImage);
      
      expect(imagesAfterRemoval).toHaveLength(0);
      expect(currentImageAfterRemoval).toBeNull();
    });

    it('should handle multiple images', () => {
      const createImageStore = () => {
        const images = writable<ImageData[]>([]);
        const currentImageId = writable<string | null>(null);
        
        return {
          images,
          currentImageId,
          addImage: (image: ImageData) => {
            images.update(imgs => [...imgs, image]);
          },
          setCurrentImage: (id: string) => {
            currentImageId.set(id);
          }
        };
      };
      
      const imageStore = createImageStore();
      
      const images = [
        { id: '1', name: 'img1.jpg', width: 1920, height: 1080, data: null, metadata: {} },
        { id: '2', name: 'img2.jpg', width: 3840, height: 2160, data: null, metadata: {} },
        { id: '3', name: 'img3.jpg', width: 2560, height: 1440, data: null, metadata: {} }
      ];
      
      images.forEach(img => imageStore.addImage(img));
      
      const storedImages = get(imageStore.images);
      expect(storedImages).toHaveLength(3);
      expect(storedImages.map(img => img.id)).toEqual(['1', '2', '3']);
    });

    it('should validate image data', () => {
      const createImageStore = () => {
        const images = writable<ImageData[]>([]);
        
        const validateImage = (image: ImageData): boolean => {
          return !!(
            image.id &&
            image.name &&
            image.width > 0 &&
            image.height > 0
          );
        };
        
        return {
          images,
          addImage: (image: ImageData) => {
            if (!validateImage(image)) {
              throw new Error('Invalid image data');
            }
            images.update(imgs => [...imgs, image]);
          }
        };
      };
      
      const imageStore = createImageStore();
      
      const validImage: ImageData = {
        id: 'valid',
        name: 'valid.jpg',
        width: 1920,
        height: 1080,
        data: null,
        metadata: {}
      };
      
      const invalidImage: ImageData = {
        id: '',
        name: '',
        width: 0,
        height: 0,
        data: null,
        metadata: {}
      };
      
      expect(() => imageStore.addImage(validImage)).not.toThrow();
      expect(() => imageStore.addImage(invalidImage)).toThrow('Invalid image data');
    });
  });

  describe('Image Adjustments Management', () => {
    it('should manage image adjustments state', () => {
      const createAdjustmentsStore = () => {
        const adjustments = writable<ImageAdjustments>({
          exposure: 0,
          contrast: 0,
          highlights: 0,
          shadows: 0,
          whites: 0,
          blacks: 0,
          saturation: 0,
          vibrance: 0,
          temperature: 0,
          tint: 0
        });
        
        return {
          adjustments,
          updateAdjustment: <K extends keyof ImageAdjustments>(
            key: K,
            value: ImageAdjustments[K]
          ) => {
            adjustments.update(adj => ({ ...adj, [key]: value }));
          },
          resetAdjustments: () => {
            adjustments.set({
              exposure: 0,
              contrast: 0,
              highlights: 0,
              shadows: 0,
              whites: 0,
              blacks: 0,
              saturation: 0,
              vibrance: 0,
              temperature: 0,
              tint: 0
            });
          }
        };
      };
      
      const adjustmentsStore = createAdjustmentsStore();
      
      // Update single adjustment
      adjustmentsStore.updateAdjustment('exposure', 1.5);
      
      let currentAdjustments = get(adjustmentsStore.adjustments);
      expect(currentAdjustments.exposure).toBe(1.5);
      expect(currentAdjustments.contrast).toBe(0);
      
      // Update multiple adjustments
      adjustmentsStore.updateAdjustment('contrast', 25);
      adjustmentsStore.updateAdjustment('saturation', 10);
      
      currentAdjustments = get(adjustmentsStore.adjustments);
      expect(currentAdjustments.exposure).toBe(1.5);
      expect(currentAdjustments.contrast).toBe(25);
      expect(currentAdjustments.saturation).toBe(10);
      
      // Reset adjustments
      adjustmentsStore.resetAdjustments();
      
      currentAdjustments = get(adjustmentsStore.adjustments);
      expect(currentAdjustments.exposure).toBe(0);
      expect(currentAdjustments.contrast).toBe(0);
      expect(currentAdjustments.saturation).toBe(0);
    });

    it('should validate adjustment values', () => {
      const createAdjustmentsStore = () => {
        const adjustments = writable<ImageAdjustments>({
          exposure: 0,
          contrast: 0,
          highlights: 0,
          shadows: 0,
          whites: 0,
          blacks: 0,
          saturation: 0,
          vibrance: 0,
          temperature: 0,
          tint: 0
        });
        
        const validateAdjustment = (key: keyof ImageAdjustments, value: number): boolean => {
          const ranges: Record<keyof ImageAdjustments, [number, number]> = {
            exposure: [-5, 5],
            contrast: [-100, 100],
            highlights: [-100, 100],
            shadows: [-100, 100],
            whites: [-100, 100],
            blacks: [-100, 100],
            saturation: [-100, 100],
            vibrance: [-100, 100],
            temperature: [-2000, 2000],
            tint: [-100, 100]
          };
          
          const [min, max] = ranges[key];
          return value >= min && value <= max;
        };
        
        return {
          adjustments,
          updateAdjustment: <K extends keyof ImageAdjustments>(
            key: K,
            value: ImageAdjustments[K]
          ) => {
            if (!validateAdjustment(key, value)) {
              throw new Error(`Invalid ${key} value: ${value}`);
            }
            adjustments.update(adj => ({ ...adj, [key]: value }));
          }
        };
      };
      
      const adjustmentsStore = createAdjustmentsStore();
      
      // Valid values
      expect(() => adjustmentsStore.updateAdjustment('exposure', 2.5)).not.toThrow();
      expect(() => adjustmentsStore.updateAdjustment('contrast', 50)).not.toThrow();
      
      // Invalid values
      expect(() => adjustmentsStore.updateAdjustment('exposure', 10)).toThrow();
      expect(() => adjustmentsStore.updateAdjustment('contrast', 150)).toThrow();
    });
  });

  describe('History Management', () => {
    it('should manage adjustment history', () => {
      const createHistoryStore = () => {
        const history = writable<HistoryEntry[]>([]);
        const currentIndex = writable(-1);
        
        const canUndo = derived(currentIndex, $index => $index > 0);
        const canRedo = derived(
          [history, currentIndex],
          ([$history, $index]) => $index < $history.length - 1
        );
        
        return {
          history,
          currentIndex,
          canUndo,
          canRedo,
          addEntry: (adjustments: ImageAdjustments, description: string) => {
            const entry: HistoryEntry = {
              id: `entry-${Date.now()}`,
              timestamp: Date.now(),
              adjustments: { ...adjustments },
              description
            };
            
            history.update(hist => {
              const currentIdx = get(currentIndex);
              // Remove any entries after current index (for branching history)
              const newHistory = hist.slice(0, currentIdx + 1);
              return [...newHistory, entry];
            });
            
            currentIndex.update(idx => idx + 1);
          },
          undo: () => {
            currentIndex.update(idx => Math.max(0, idx - 1));
          },
          redo: () => {
            const hist = get(history);
            currentIndex.update(idx => Math.min(hist.length - 1, idx + 1));
          },
          getCurrentEntry: () => {
            const hist = get(history);
            const idx = get(currentIndex);
            return hist[idx] || null;
          }
        };
      };
      
      const historyStore = createHistoryStore();
      
      const baseAdjustments: ImageAdjustments = {
        exposure: 0, contrast: 0, highlights: 0, shadows: 0,
        whites: 0, blacks: 0, saturation: 0, vibrance: 0,
        temperature: 0, tint: 0
      };
      
      // Add initial entry
      historyStore.addEntry(baseAdjustments, 'Initial state');
      
      expect(get(historyStore.canUndo)).toBe(false);
      expect(get(historyStore.canRedo)).toBe(false);
      
      // Add adjustment
      const adjustedState = { ...baseAdjustments, exposure: 1.5 };
      historyStore.addEntry(adjustedState, 'Increased exposure');
      
      expect(get(historyStore.canUndo)).toBe(true);
      expect(get(historyStore.canRedo)).toBe(false);
      
      // Add another adjustment
      const furtherAdjusted = { ...adjustedState, contrast: 25 };
      historyStore.addEntry(furtherAdjusted, 'Increased contrast');
      
      // Test undo
      historyStore.undo();
      let currentEntry = historyStore.getCurrentEntry();
      expect(currentEntry?.adjustments.exposure).toBe(1.5);
      expect(currentEntry?.adjustments.contrast).toBe(0);
      expect(get(historyStore.canRedo)).toBe(true);
      
      // Test redo
      historyStore.redo();
      currentEntry = historyStore.getCurrentEntry();
      expect(currentEntry?.adjustments.contrast).toBe(25);
      expect(get(historyStore.canRedo)).toBe(false);
    });

    it('should handle history branching', () => {
      const createHistoryStore = () => {
        const history = writable<HistoryEntry[]>([]);
        const currentIndex = writable(-1);
        
        return {
          history,
          currentIndex,
          addEntry: (adjustments: ImageAdjustments, description: string) => {
            const entry: HistoryEntry = {
              id: `entry-${Date.now()}`,
              timestamp: Date.now(),
              adjustments: { ...adjustments },
              description
            };
            
            history.update(hist => {
              const currentIdx = get(currentIndex);
              // Remove any entries after current index (for branching history)
              const newHistory = hist.slice(0, currentIdx + 1);
              return [...newHistory, entry];
            });
            
            currentIndex.update(idx => idx + 1);
          },
          undo: () => {
            currentIndex.update(idx => Math.max(0, idx - 1));
          }
        };
      };
      
      const historyStore = createHistoryStore();
      
      const baseAdjustments: ImageAdjustments = {
        exposure: 0, contrast: 0, highlights: 0, shadows: 0,
        whites: 0, blacks: 0, saturation: 0, vibrance: 0,
        temperature: 0, tint: 0
      };
      
      // Create initial history
      historyStore.addEntry(baseAdjustments, 'Initial');
      historyStore.addEntry({ ...baseAdjustments, exposure: 1 }, 'Exposure +1');
      historyStore.addEntry({ ...baseAdjustments, exposure: 1, contrast: 20 }, 'Contrast +20');
      
      expect(get(historyStore.history)).toHaveLength(3);
      
      // Undo to middle state
      historyStore.undo();
      
      // Add new branch
      historyStore.addEntry({ ...baseAdjustments, exposure: 1, saturation: 15 }, 'Saturation +15');
      
      // History should be truncated and new entry added
      const history = get(historyStore.history);
      expect(history).toHaveLength(3);
      expect(history[2].description).toBe('Saturation +15');
      expect(history[2].adjustments.saturation).toBe(15);
    });

    it('should limit history size', () => {
      const createHistoryStore = (maxSize = 50) => {
        const history = writable<HistoryEntry[]>([]);
        const currentIndex = writable(-1);
        
        return {
          history,
          currentIndex,
          addEntry: (adjustments: ImageAdjustments, description: string) => {
            const entry: HistoryEntry = {
              id: `entry-${Date.now()}`,
              timestamp: Date.now(),
              adjustments: { ...adjustments },
              description
            };
            
            history.update(hist => {
              const currentIdx = get(currentIndex);
              let newHistory = hist.slice(0, currentIdx + 1);
              newHistory.push(entry);
              
              // Limit history size
              if (newHistory.length > maxSize) {
                newHistory = newHistory.slice(-maxSize);
                currentIndex.set(maxSize - 1);
              } else {
                currentIndex.update(idx => idx + 1);
              }
              
              return newHistory;
            });
          }
        };
      };
      
      const historyStore = createHistoryStore(3);
      
      const baseAdjustments: ImageAdjustments = {
        exposure: 0, contrast: 0, highlights: 0, shadows: 0,
        whites: 0, blacks: 0, saturation: 0, vibrance: 0,
        temperature: 0, tint: 0
      };
      
      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        historyStore.addEntry(
          { ...baseAdjustments, exposure: i },
          `Entry ${i}`
        );
      }
      
      const history = get(historyStore.history);
      expect(history).toHaveLength(3);
      expect(history[0].description).toBe('Entry 2');
      expect(history[2].description).toBe('Entry 4');
    });
  });

  describe('Image Processing Integration', () => {
    it('should integrate with WebAssembly processing', async () => {
      mockWasmModule.apply_adjustments.mockResolvedValue(new ArrayBuffer(1024));
      
      const createImageProcessor = () => {
        const isProcessing = writable(false);
        const processedImageData = writable<ArrayBuffer | null>(null);
        
        return {
          isProcessing,
          processedImageData,
          processImage: async (imageData: ArrayBuffer, adjustments: ImageAdjustments) => {
            isProcessing.set(true);
            
            try {
              const result = await mockWasmModule.apply_adjustments(imageData, adjustments);
              processedImageData.set(result);
              return result;
            } finally {
              isProcessing.set(false);
            }
          }
        };
      };
      
      const processor = createImageProcessor();
      
      const testImageData = new ArrayBuffer(2048);
      const testAdjustments: ImageAdjustments = {
        exposure: 1.5, contrast: 25, highlights: 0, shadows: 0,
        whites: 0, blacks: 0, saturation: 10, vibrance: 0,
        temperature: 0, tint: 0
      };
      
      expect(get(processor.isProcessing)).toBe(false);
      
      const resultPromise = processor.processImage(testImageData, testAdjustments);
      
      expect(get(processor.isProcessing)).toBe(true);
      
      const result = await resultPromise;
      
      expect(get(processor.isProcessing)).toBe(false);
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(get(processor.processedImageData)).toBe(result);
      expect(mockWasmModule.apply_adjustments).toHaveBeenCalledWith(
        testImageData,
        testAdjustments
      );
    });

    it('should handle processing errors', async () => {
      mockWasmModule.apply_adjustments.mockRejectedValue(new Error('Processing failed'));
      
      const createImageProcessor = () => {
        const isProcessing = writable(false);
        const error = writable<string | null>(null);
        
        return {
          isProcessing,
          error,
          processImage: async (imageData: ArrayBuffer, adjustments: ImageAdjustments) => {
            isProcessing.set(true);
            error.set(null);
            
            try {
              const result = await mockWasmModule.apply_adjustments(imageData, adjustments);
              return result;
            } catch (err) {
              error.set(err instanceof Error ? err.message : 'Unknown error');
              throw err;
            } finally {
              isProcessing.set(false);
            }
          }
        };
      };
      
      const processor = createImageProcessor();
      
      const testImageData = new ArrayBuffer(2048);
      const testAdjustments: ImageAdjustments = {
        exposure: 0, contrast: 0, highlights: 0, shadows: 0,
        whites: 0, blacks: 0, saturation: 0, vibrance: 0,
        temperature: 0, tint: 0
      };
      
      await expect(
        processor.processImage(testImageData, testAdjustments)
      ).rejects.toThrow('Processing failed');
      
      expect(get(processor.isProcessing)).toBe(false);
      expect(get(processor.error)).toBe('Processing failed');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large image data efficiently', () => {
      const createImageStore = () => {
        const images = writable<ImageData[]>([]);
        
        return {
          images,
          addImage: (image: ImageData) => {
            images.update(imgs => {
              // Limit number of images in memory
              const maxImages = 10;
              const newImages = [...imgs, image];
              
              if (newImages.length > maxImages) {
                // Remove oldest images
                return newImages.slice(-maxImages);
              }
              
              return newImages;
            });
          }
        };
      };
      
      const imageStore = createImageStore();
      
      // Add many large images
      for (let i = 0; i < 15; i++) {
        const largeImage: ImageData = {
          id: `large-${i}`,
          name: `large-${i}.jpg`,
          width: 8000,
          height: 6000,
          data: new ArrayBuffer(8000 * 6000 * 4), // Simulated large image
          metadata: {}
        };
        
        imageStore.addImage(largeImage);
      }
      
      const images = get(imageStore.images);
      expect(images).toHaveLength(10);
      expect(images[0].id).toBe('large-5'); // Oldest kept
      expect(images[9].id).toBe('large-14'); // Newest
    });

    it('should clean up resources when images are removed', () => {
      const createImageStore = () => {
        const images = writable<ImageData[]>([]);
        const cleanupCallbacks = new Map<string, () => void>();
        
        return {
          images,
          addImage: (image: ImageData, cleanup?: () => void) => {
            images.update(imgs => [...imgs, image]);
            if (cleanup) {
              cleanupCallbacks.set(image.id, cleanup);
            }
          },
          removeImage: (id: string) => {
            images.update(imgs => imgs.filter(img => img.id !== id));
            
            // Call cleanup callback
            const cleanup = cleanupCallbacks.get(id);
            if (cleanup) {
              cleanup();
              cleanupCallbacks.delete(id);
            }
          }
        };
      };
      
      const imageStore = createImageStore();
      const cleanupSpy = vi.fn();
      
      const testImage: ImageData = {
        id: 'test',
        name: 'test.jpg',
        width: 1920,
        height: 1080,
        data: new ArrayBuffer(1024),
        metadata: {}
      };
      
      imageStore.addImage(testImage, cleanupSpy);
      imageStore.removeImage('test');
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});