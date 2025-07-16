import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export interface ImageMetadata {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  focalLength?: number;
  dateTime?: string;
  width: number;
  height: number;
  colorSpace?: string;
  [key: string]: any;
}

export interface ImageAdjustments {
  // Basic adjustments
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  
  // Color adjustments
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  
  // Advanced adjustments
  clarity: number;
  dehaze: number;
  vignette: number;
  
  // HSL adjustments for 8 color ranges
  hsl: {
    red: { hue: number; saturation: number; lightness: number };
    orange: { hue: number; saturation: number; lightness: number };
    yellow: { hue: number; saturation: number; lightness: number };
    green: { hue: number; saturation: number; lightness: number };
    aqua: { hue: number; saturation: number; lightness: number };
    blue: { hue: number; saturation: number; lightness: number };
    purple: { hue: number; saturation: number; lightness: number };
    magenta: { hue: number; saturation: number; lightness: number };
  };
  
  // Color grading
  colorGrading: {
    shadows: { red: number; green: number; blue: number };
    midtones: { red: number; green: number; blue: number };
    highlights: { red: number; green: number; blue: number };
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  adjustments: ImageAdjustments;
  description: string;
}

export interface ImageData {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  data: ArrayBuffer | null;
  thumbnail: string | null;
  metadata: ImageMetadata;
  adjustments: ImageAdjustments;
  history: HistoryEntry[];
  currentHistoryIndex: number;
  isProcessing: boolean;
  lastModified: number;
}

// Default values
const defaultAdjustments: ImageAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  clarity: 0,
  dehaze: 0,
  vignette: 0,
  hsl: {
    red: { hue: 0, saturation: 0, lightness: 0 },
    orange: { hue: 0, saturation: 0, lightness: 0 },
    yellow: { hue: 0, saturation: 0, lightness: 0 },
    green: { hue: 0, saturation: 0, lightness: 0 },
    aqua: { hue: 0, saturation: 0, lightness: 0 },
    blue: { hue: 0, saturation: 0, lightness: 0 },
    purple: { hue: 0, saturation: 0, lightness: 0 },
    magenta: { hue: 0, saturation: 0, lightness: 0 }
  },
  colorGrading: {
    shadows: { red: 0, green: 0, blue: 0 },
    midtones: { red: 0, green: 0, blue: 0 },
    highlights: { red: 0, green: 0, blue: 0 }
  }
};

// Store state
const images = writable<ImageData[]>([]);
const currentImageId = writable<string | null>(null);
const isLoading = writable(false);
const error = writable<string | null>(null);

// Derived stores
const currentImage = derived(
  [images, currentImageId],
  ([$images, $currentImageId]) => {
    return $images.find(img => img.id === $currentImageId) || null;
  }
);

const currentAdjustments = derived(
  currentImage,
  ($currentImage) => {
    return $currentImage?.adjustments || defaultAdjustments;
  }
);

const canUndo = derived(
  currentImage,
  ($currentImage) => {
    return $currentImage ? $currentImage.currentHistoryIndex > 0 : false;
  }
);

const canRedo = derived(
  currentImage,
  ($currentImage) => {
    return $currentImage 
      ? $currentImage.currentHistoryIndex < $currentImage.history.length - 1 
      : false;
  }
);

const imageCount = derived(images, ($images) => $images.length);

const hasUnsavedChanges = derived(
  currentImage,
  ($currentImage) => {
    if (!$currentImage) return false;
    return $currentImage.currentHistoryIndex > 0;
  }
);

// Utility functions
function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createHistoryEntry(adjustments: ImageAdjustments, description: string): HistoryEntry {
  return {
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    adjustments: JSON.parse(JSON.stringify(adjustments)), // Deep clone
    description
  };
}

// Persistence functions
async function saveToIndexedDB(imageData: ImageData): Promise<void> {
  if (!browser) return;
  
  try {
    const db = await openImageDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    // Don't store the actual image data in IndexedDB for performance
    const dataToStore = {
      ...imageData,
      data: null // Store image data separately or in memory only
    };
    
    await store.put(dataToStore);
  } catch (err) {
    console.warn('Failed to save image to IndexedDB:', err);
  }
}

async function loadFromIndexedDB(): Promise<ImageData[]> {
  if (!browser) return [];
  
  try {
    const db = await openImageDB();
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load images from IndexedDB:', err);
    return [];
  }
}

function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RapiDrawImages', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('images')) {
        const store = db.createObjectStore('images', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
  });
}

// Store actions
const imageStore = {
  // Subscriptions
  subscribe: images.subscribe,
  currentImage,
  currentAdjustments,
  currentImageId,
  isLoading,
  error,
  canUndo,
  canRedo,
  imageCount,
  hasUnsavedChanges,

  // Actions
  async loadImages(): Promise<void> {
    if (!browser) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      const savedImages = await loadFromIndexedDB();
      images.set(savedImages);
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      isLoading.set(false);
    }
  },

  async addImage(file: File): Promise<string> {
    isLoading.set(true);
    error.set(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const metadata = await extractMetadata(file, arrayBuffer);
      const thumbnail = await generateThumbnail(file);
      
      const imageData: ImageData = {
        id: generateId(),
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        data: arrayBuffer,
        thumbnail,
        metadata,
        adjustments: JSON.parse(JSON.stringify(defaultAdjustments)),
        history: [createHistoryEntry(defaultAdjustments, 'Original')],
        currentHistoryIndex: 0,
        isProcessing: false,
        lastModified: Date.now()
      };
      
      images.update(imgs => [...imgs, imageData]);
      await saveToIndexedDB(imageData);
      
      return imageData.id;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to add image');
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  removeImage(id: string): void {
    images.update(imgs => imgs.filter(img => img.id !== id));
    
    // Clear current image if it was removed
    const currentId = get(currentImageId);
    if (currentId === id) {
      currentImageId.set(null);
    }
    
    // Remove from IndexedDB
    if (browser) {
      openImageDB().then(db => {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.delete(id);
      }).catch(err => {
        console.warn('Failed to remove image from IndexedDB:', err);
      });
    }
  },

  setCurrentImage(id: string | null): void {
    currentImageId.set(id);
  },

  updateAdjustment<K extends keyof ImageAdjustments>(
    key: K,
    value: ImageAdjustments[K],
    description?: string
  ): void {
    const currentImg = get(currentImage);
    if (!currentImg) return;
    
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === currentImg.id) {
          const newAdjustments = { ...img.adjustments, [key]: value };
          const historyEntry = createHistoryEntry(
            newAdjustments,
            description || `Adjusted ${key}`
          );
          
          // Remove any history entries after current index (for branching)
          const newHistory = img.history.slice(0, img.currentHistoryIndex + 1);
          newHistory.push(historyEntry);
          
          const updatedImg = {
            ...img,
            adjustments: newAdjustments,
            history: newHistory,
            currentHistoryIndex: newHistory.length - 1,
            lastModified: Date.now()
          };
          
          // Save to IndexedDB
          saveToIndexedDB(updatedImg);
          
          return updatedImg;
        }
        return img;
      });
    });
  },

  updateHSLAdjustment(
    colorRange: keyof ImageAdjustments['hsl'],
    property: 'hue' | 'saturation' | 'lightness',
    value: number
  ): void {
    const currentImg = get(currentImage);
    if (!currentImg) return;
    
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === currentImg.id) {
          const newAdjustments = {
            ...img.adjustments,
            hsl: {
              ...img.adjustments.hsl,
              [colorRange]: {
                ...img.adjustments.hsl[colorRange],
                [property]: value
              }
            }
          };
          
          const historyEntry = createHistoryEntry(
            newAdjustments,
            `Adjusted ${colorRange} ${property}`
          );
          
          const newHistory = img.history.slice(0, img.currentHistoryIndex + 1);
          newHistory.push(historyEntry);
          
          const updatedImg = {
            ...img,
            adjustments: newAdjustments,
            history: newHistory,
            currentHistoryIndex: newHistory.length - 1,
            lastModified: Date.now()
          };
          
          saveToIndexedDB(updatedImg);
          return updatedImg;
        }
        return img;
      });
    });
  },

  updateColorGrading(
    toneRange: 'shadows' | 'midtones' | 'highlights',
    color: 'red' | 'green' | 'blue',
    value: number
  ): void {
    const currentImg = get(currentImage);
    if (!currentImg) return;
    
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === currentImg.id) {
          const newAdjustments = {
            ...img.adjustments,
            colorGrading: {
              ...img.adjustments.colorGrading,
              [toneRange]: {
                ...img.adjustments.colorGrading[toneRange],
                [color]: value
              }
            }
          };
          
          const historyEntry = createHistoryEntry(
            newAdjustments,
            `Adjusted ${toneRange} ${color}`
          );
          
          const newHistory = img.history.slice(0, img.currentHistoryIndex + 1);
          newHistory.push(historyEntry);
          
          const updatedImg = {
            ...img,
            adjustments: newAdjustments,
            history: newHistory,
            currentHistoryIndex: newHistory.length - 1,
            lastModified: Date.now()
          };
          
          saveToIndexedDB(updatedImg);
          return updatedImg;
        }
        return img;
      });
    });
  },

  resetAdjustments(): void {
    const currentImg = get(currentImage);
    if (!currentImg) return;
    
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === currentImg.id) {
          const historyEntry = createHistoryEntry(defaultAdjustments, 'Reset all adjustments');
          const newHistory = img.history.slice(0, img.currentHistoryIndex + 1);
          newHistory.push(historyEntry);
          
          const updatedImg = {
            ...img,
            adjustments: JSON.parse(JSON.stringify(defaultAdjustments)),
            history: newHistory,
            currentHistoryIndex: newHistory.length - 1,
            lastModified: Date.now()
          };
          
          saveToIndexedDB(updatedImg);
          return updatedImg;
        }
        return img;
      });
    });
  },

  undo(): void {
    const currentImg = get(currentImage);
    if (!currentImg || currentImg.currentHistoryIndex <= 0) return;
    
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === currentImg.id) {
          const newIndex = img.currentHistoryIndex - 1;
          const historyEntry = img.history[newIndex];
          
          const updatedImg = {
            ...img,
            adjustments: JSON.parse(JSON.stringify(historyEntry.adjustments)),
            currentHistoryIndex: newIndex,
            lastModified: Date.now()
          };
          
          saveToIndexedDB(updatedImg);
          return updatedImg;
        }
        return img;
      });
    });
  },

  redo(): void {
    const currentImg = get(currentImage);
    if (!currentImg || currentImg.currentHistoryIndex >= currentImg.history.length - 1) return;
    
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === currentImg.id) {
          const newIndex = img.currentHistoryIndex + 1;
          const historyEntry = img.history[newIndex];
          
          const updatedImg = {
            ...img,
            adjustments: JSON.parse(JSON.stringify(historyEntry.adjustments)),
            currentHistoryIndex: newIndex,
            lastModified: Date.now()
          };
          
          saveToIndexedDB(updatedImg);
          return updatedImg;
        }
        return img;
      });
    });
  },

  setProcessing(id: string, isProcessing: boolean): void {
    images.update(imgs => {
      return imgs.map(img => {
        if (img.id === id) {
          return { ...img, isProcessing };
        }
        return img;
      });
    });
  },

  clearError(): void {
    error.set(null);
  }
};

// Helper functions
async function extractMetadata(file: File, arrayBuffer: ArrayBuffer): Promise<ImageMetadata> {
  // Basic metadata extraction
  const metadata: ImageMetadata = {
    width: 0,
    height: 0
  };
  
  // Create image to get dimensions
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      metadata.width = img.width;
      metadata.height = img.height;
      resolve(metadata);
    };
    img.onerror = () => {
      resolve(metadata);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const maxSize = 200;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

export default imageStore;