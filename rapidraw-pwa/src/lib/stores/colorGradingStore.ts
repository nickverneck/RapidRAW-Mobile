import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export interface ColorWheelPoint {
  x: number;
  y: number;
  hue: number;
  saturation: number;
}

export interface ColorGradingPreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string | null;
  tags: string[];
  adjustments: {
    shadows: { red: number; green: number; blue: number };
    midtones: { red: number; green: number; blue: number };
    highlights: { red: number; green: number; blue: number };
  };
  hslAdjustments: {
    red: { hue: number; saturation: number; lightness: number };
    orange: { hue: number; saturation: number; lightness: number };
    yellow: { hue: number; saturation: number; lightness: number };
    green: { hue: number; saturation: number; lightness: number };
    aqua: { hue: number; saturation: number; lightness: number };
    blue: { hue: number; saturation: number; lightness: number };
    purple: { hue: number; saturation: number; lightness: number };
    magenta: { hue: number; saturation: number; lightness: number };
  };
  createdAt: number;
  lastModified: number;
  isBuiltIn: boolean;
}

export interface LUTExportOptions {
  format: 'CUBE' | '3DL' | 'CSP';
  resolution: 17 | 33 | 65;
  title: string;
  description: string;
  domain: {
    min: number;
    max: number;
  };
}

export interface ColorRange {
  name: string;
  hueRange: [number, number];
  color: string;
  isActive: boolean;
}

export interface ColorWheelState {
  shadows: ColorWheelPoint;
  midtones: ColorWheelPoint;
  highlights: ColorWheelPoint;
  activeWheel: 'shadows' | 'midtones' | 'highlights';
}

// Default values
const defaultColorRanges: ColorRange[] = [
  { name: 'red', hueRange: [345, 15], color: '#ff0000', isActive: false },
  { name: 'orange', hueRange: [15, 45], color: '#ff8000', isActive: false },
  { name: 'yellow', hueRange: [45, 75], color: '#ffff00', isActive: false },
  { name: 'green', hueRange: [75, 165], color: '#00ff00', isActive: false },
  { name: 'aqua', hueRange: [165, 195], color: '#00ffff', isActive: false },
  { name: 'blue', hueRange: [195, 255], color: '#0080ff', isActive: false },
  { name: 'purple', hueRange: [255, 285], color: '#8000ff', isActive: false },
  { name: 'magenta', hueRange: [285, 345], color: '#ff00ff', isActive: false }
];

const defaultColorWheelState: ColorWheelState = {
  shadows: { x: 0, y: 0, hue: 0, saturation: 0 },
  midtones: { x: 0, y: 0, hue: 0, saturation: 0 },
  highlights: { x: 0, y: 0, hue: 0, saturation: 0 },
  activeWheel: 'midtones'
};

// Store state
const presets = writable<ColorGradingPreset[]>([]);
const colorRanges = writable<ColorRange[]>(defaultColorRanges);
const colorWheelState = writable<ColorWheelState>(defaultColorWheelState);
const activePresetId = writable<string | null>(null);
const isExporting = writable(false);
const exportProgress = writable(0);
const error = writable<string | null>(null);

// Derived stores
const activePreset = derived(
  [presets, activePresetId],
  ([$presets, $activePresetId]) => {
    return $presets.find(preset => preset.id === $activePresetId) || null;
  }
);

const builtInPresets = derived(presets, ($presets) => {
  return $presets.filter(preset => preset.isBuiltIn);
});

const userPresets = derived(presets, ($presets) => {
  return $presets.filter(preset => !preset.isBuiltIn);
});

const activeColorRanges = derived(colorRanges, ($colorRanges) => {
  return $colorRanges.filter(range => range.isActive);
});

const presetCount = derived(presets, ($presets) => $presets.length);

// Utility functions
function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function hueToRgb(hue: number): { r: number; g: number; b: number } {
  const h = hue / 60;
  const c = 1;
  const x = c * (1 - Math.abs((h % 2) - 1));
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 1) {
    r = c; g = x; b = 0;
  } else if (h >= 1 && h < 2) {
    r = x; g = c; b = 0;
  } else if (h >= 2 && h < 3) {
    r = 0; g = c; b = x;
  } else if (h >= 3 && h < 4) {
    r = 0; g = x; b = c;
  } else if (h >= 4 && h < 5) {
    r = x; g = 0; b = c;
  } else if (h >= 5 && h < 6) {
    r = c; g = 0; b = x;
  }
  
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function polarToCartesian(hue: number, saturation: number, radius: number): { x: number; y: number } {
  const angle = (hue - 90) * (Math.PI / 180);
  const distance = (saturation / 100) * radius;
  
  return {
    x: distance * Math.cos(angle),
    y: distance * Math.sin(angle)
  };
}

function cartesianToPolar(x: number, y: number, radius: number): { hue: number; saturation: number } {
  const distance = Math.sqrt(x * x + y * y);
  const angle = Math.atan2(y, x) * (180 / Math.PI);
  
  const hue = (angle + 90 + 360) % 360;
  const saturation = Math.min((distance / radius) * 100, 100);
  
  return { hue, saturation };
}

// Persistence functions
async function savePresetsToIndexedDB(presetList: ColorGradingPreset[]): Promise<void> {
  if (!browser) return;
  
  try {
    const db = await openColorGradingDB();
    const transaction = db.transaction(['presets'], 'readwrite');
    const store = transaction.objectStore('presets');
    
    // Clear existing presets and add new ones
    await store.clear();
    for (const preset of presetList) {
      await store.add(preset);
    }
  } catch (err) {
    console.warn('Failed to save presets to IndexedDB:', err);
  }
}

async function loadPresetsFromIndexedDB(): Promise<ColorGradingPreset[]> {
  if (!browser) return [];
  
  try {
    const db = await openColorGradingDB();
    const transaction = db.transaction(['presets'], 'readonly');
    const store = transaction.objectStore('presets');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load presets from IndexedDB:', err);
    return [];
  }
}

function openColorGradingDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RapiDrawColorGrading', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('presets')) {
        const store = db.createObjectStore('presets', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Built-in presets
const builtInPresetData: Omit<ColorGradingPreset, 'id' | 'createdAt' | 'lastModified'>[] = [
  {
    name: 'Cinematic',
    description: 'Classic cinematic color grading with teal and orange tones',
    thumbnail: null,
    tags: ['cinematic', 'teal', 'orange', 'film'],
    adjustments: {
      shadows: { red: -10, green: 5, blue: 15 },
      midtones: { red: 0, green: 0, blue: 0 },
      highlights: { red: 15, green: 5, blue: -10 }
    },
    hslAdjustments: {
      red: { hue: 0, saturation: 10, lightness: 0 },
      orange: { hue: -5, saturation: 15, lightness: 5 },
      yellow: { hue: 0, saturation: 0, lightness: 0 },
      green: { hue: 0, saturation: -5, lightness: 0 },
      aqua: { hue: 5, saturation: 20, lightness: -5 },
      blue: { hue: 0, saturation: 10, lightness: -5 },
      purple: { hue: 0, saturation: 0, lightness: 0 },
      magenta: { hue: 0, saturation: 0, lightness: 0 }
    },
    isBuiltIn: true
  },
  {
    name: 'Warm Sunset',
    description: 'Warm, golden hour color grading',
    thumbnail: null,
    tags: ['warm', 'sunset', 'golden', 'cozy'],
    adjustments: {
      shadows: { red: 5, green: 0, blue: -15 },
      midtones: { red: 10, green: 5, blue: -5 },
      highlights: { red: 15, green: 10, blue: 0 }
    },
    hslAdjustments: {
      red: { hue: 0, saturation: 15, lightness: 5 },
      orange: { hue: 0, saturation: 20, lightness: 10 },
      yellow: { hue: -5, saturation: 15, lightness: 5 },
      green: { hue: 0, saturation: -10, lightness: 0 },
      aqua: { hue: 0, saturation: -15, lightness: -5 },
      blue: { hue: 0, saturation: -10, lightness: -10 },
      purple: { hue: 0, saturation: 0, lightness: 0 },
      magenta: { hue: 0, saturation: 0, lightness: 0 }
    },
    isBuiltIn: true
  },
  {
    name: 'Cool Blue',
    description: 'Cool, moody blue color grading',
    thumbnail: null,
    tags: ['cool', 'blue', 'moody', 'winter'],
    adjustments: {
      shadows: { red: -15, green: -5, blue: 10 },
      midtones: { red: -5, green: 0, blue: 5 },
      highlights: { red: 0, green: 5, blue: 15 }
    },
    hslAdjustments: {
      red: { hue: 0, saturation: -10, lightness: 0 },
      orange: { hue: 0, saturation: -15, lightness: -5 },
      yellow: { hue: 0, saturation: -10, lightness: 0 },
      green: { hue: 0, saturation: 0, lightness: 0 },
      aqua: { hue: 0, saturation: 15, lightness: 5 },
      blue: { hue: 0, saturation: 20, lightness: 5 },
      purple: { hue: 0, saturation: 10, lightness: 0 },
      magenta: { hue: 0, saturation: 0, lightness: 0 }
    },
    isBuiltIn: true
  }
];

// Store actions
const colorGradingStore = {
  // Subscriptions
  presets,
  colorRanges,
  colorWheelState,
  activePresetId,
  isExporting,
  exportProgress,
  error,
  activePreset,
  builtInPresets,
  userPresets,
  activeColorRanges,
  presetCount,

  // Actions
  async init(): Promise<void> {
    if (!browser) return;
    
    try {
      // Load saved presets
      const savedPresets = await loadPresetsFromIndexedDB();
      
      // Add built-in presets if they don't exist
      const existingBuiltInIds = savedPresets
        .filter(p => p.isBuiltIn)
        .map(p => p.name);
      
      const newBuiltInPresets = builtInPresetData
        .filter(p => !existingBuiltInIds.includes(p.name))
        .map(p => ({
          ...p,
          id: generatePresetId(),
          createdAt: Date.now(),
          lastModified: Date.now()
        }));
      
      const allPresets = [...savedPresets, ...newBuiltInPresets];
      presets.set(allPresets);
      
      if (newBuiltInPresets.length > 0) {
        await savePresetsToIndexedDB(allPresets);
      }
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to initialize color grading store');
    }
  },

  // Preset management
  async createPreset(
    name: string,
    description: string,
    adjustments: ColorGradingPreset['adjustments'],
    hslAdjustments: ColorGradingPreset['hslAdjustments'],
    tags: string[] = []
  ): Promise<string> {
    const preset: ColorGradingPreset = {
      id: generatePresetId(),
      name,
      description,
      thumbnail: null,
      tags,
      adjustments: JSON.parse(JSON.stringify(adjustments)),
      hslAdjustments: JSON.parse(JSON.stringify(hslAdjustments)),
      createdAt: Date.now(),
      lastModified: Date.now(),
      isBuiltIn: false
    };
    
    presets.update(currentPresets => {
      const newPresets = [...currentPresets, preset];
      savePresetsToIndexedDB(newPresets);
      return newPresets;
    });
    
    return preset.id;
  },

  async updatePreset(
    id: string,
    updates: Partial<Omit<ColorGradingPreset, 'id' | 'createdAt' | 'isBuiltIn'>>
  ): Promise<void> {
    presets.update(currentPresets => {
      const newPresets = currentPresets.map(preset => {
        if (preset.id === id && !preset.isBuiltIn) {
          return {
            ...preset,
            ...updates,
            lastModified: Date.now()
          };
        }
        return preset;
      });
      
      savePresetsToIndexedDB(newPresets);
      return newPresets;
    });
  },

  async deletePreset(id: string): Promise<void> {
    presets.update(currentPresets => {
      const newPresets = currentPresets.filter(preset => 
        preset.id !== id || preset.isBuiltIn
      );
      
      savePresetsToIndexedDB(newPresets);
      return newPresets;
    });
    
    // Clear active preset if it was deleted
    const currentActiveId = get(activePresetId);
    if (currentActiveId === id) {
      activePresetId.set(null);
    }
  },

  async duplicatePreset(id: string): Promise<string> {
    const currentPresets = get(presets);
    const originalPreset = currentPresets.find(p => p.id === id);
    
    if (!originalPreset) {
      throw new Error('Preset not found');
    }
    
    const newPreset: ColorGradingPreset = {
      ...originalPreset,
      id: generatePresetId(),
      name: `${originalPreset.name} Copy`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      isBuiltIn: false
    };
    
    presets.update(currentPresets => {
      const newPresets = [...currentPresets, newPreset];
      savePresetsToIndexedDB(newPresets);
      return newPresets;
    });
    
    return newPreset.id;
  },

  setActivePreset(id: string | null): void {
    activePresetId.set(id);
  },

  // Color range management
  toggleColorRange(rangeName: string): void {
    colorRanges.update(ranges => {
      return ranges.map(range => {
        if (range.name === rangeName) {
          return { ...range, isActive: !range.isActive };
        }
        return range;
      });
    });
  },

  setColorRangeActive(rangeName: string, isActive: boolean): void {
    colorRanges.update(ranges => {
      return ranges.map(range => {
        if (range.name === rangeName) {
          return { ...range, isActive };
        }
        return range;
      });
    });
  },

  clearActiveColorRanges(): void {
    colorRanges.update(ranges => {
      return ranges.map(range => ({ ...range, isActive: false }));
    });
  },

  // Color wheel management
  setActiveColorWheel(wheel: 'shadows' | 'midtones' | 'highlights'): void {
    colorWheelState.update(state => ({
      ...state,
      activeWheel: wheel
    }));
  },

  updateColorWheelPoint(
    wheel: 'shadows' | 'midtones' | 'highlights',
    x: number,
    y: number,
    radius: number
  ): void {
    const { hue, saturation } = cartesianToPolar(x, y, radius);
    
    colorWheelState.update(state => ({
      ...state,
      [wheel]: { x, y, hue, saturation }
    }));
  },

  resetColorWheel(wheel?: 'shadows' | 'midtones' | 'highlights'): void {
    const resetPoint = { x: 0, y: 0, hue: 0, saturation: 0 };
    
    colorWheelState.update(state => {
      if (wheel) {
        return { ...state, [wheel]: resetPoint };
      } else {
        return {
          ...state,
          shadows: resetPoint,
          midtones: resetPoint,
          highlights: resetPoint
        };
      }
    });
  },

  // LUT export
  async exportLUT(
    adjustments: ColorGradingPreset['adjustments'],
    hslAdjustments: ColorGradingPreset['hslAdjustments'],
    options: LUTExportOptions
  ): Promise<string> {
    isExporting.set(true);
    exportProgress.set(0);
    error.set(null);
    
    try {
      const lutData = await generateLUT(adjustments, hslAdjustments, options);
      return lutData;
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Failed to export LUT');
      throw err;
    } finally {
      isExporting.set(false);
      exportProgress.set(0);
    }
  },

  // Utility methods
  getColorRangeByHue(hue: number): ColorRange | null {
    const ranges = get(colorRanges);
    return ranges.find(range => {
      const [min, max] = range.hueRange;
      if (min > max) {
        // Handle wrap-around (e.g., red: 345-15)
        return hue >= min || hue <= max;
      } else {
        return hue >= min && hue <= max;
      }
    }) || null;
  },

  searchPresets(query: string, tags: string[] = []): ColorGradingPreset[] {
    const currentPresets = get(presets);
    const lowerQuery = query.toLowerCase();
    
    return currentPresets.filter(preset => {
      const matchesQuery = !query || 
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery);
      
      const matchesTags = tags.length === 0 ||
        tags.some(tag => preset.tags.includes(tag));
      
      return matchesQuery && matchesTags;
    });
  },

  clearError(): void {
    error.set(null);
  }
};

// LUT generation function
async function generateLUT(
  adjustments: ColorGradingPreset['adjustments'],
  hslAdjustments: ColorGradingPreset['hslAdjustments'],
  options: LUTExportOptions
): Promise<string> {
  const { resolution, format, title, description, domain } = options;
  const size = resolution;
  
  let lutContent = '';
  
  // Generate header based on format
  switch (format) {
    case 'CUBE':
      lutContent += `TITLE "${title}"\n`;
      if (description) {
        lutContent += `# ${description}\n`;
      }
      lutContent += `DOMAIN_MIN ${domain.min} ${domain.min} ${domain.min}\n`;
      lutContent += `DOMAIN_MAX ${domain.max} ${domain.max} ${domain.max}\n`;
      lutContent += `LUT_3D_SIZE ${size}\n\n`;
      break;
      
    case '3DL':
      lutContent += `# ${title}\n`;
      if (description) {
        lutContent += `# ${description}\n`;
      }
      lutContent += `# LUT size: ${size}x${size}x${size}\n\n`;
      break;
      
    case 'CSP':
      lutContent += `CSPLUTV100\n`;
      lutContent += `3D\n`;
      lutContent += `\n`;
      lutContent += `BEGIN METADATA\n`;
      lutContent += `TITLE "${title}"\n`;
      if (description) {
        lutContent += `DESCRIPTION "${description}"\n`;
      }
      lutContent += `END METADATA\n\n`;
      lutContent += `${size} ${size} ${size}\n`;
      break;
  }
  
  // Generate LUT data
  const step = 1 / (size - 1);
  let progress = 0;
  const totalSteps = size * size * size;
  
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const inputR = r * step;
        const inputG = g * step;
        const inputB = b * step;
        
        // Apply color grading transformations
        const { r: outputR, g: outputG, b: outputB } = applyColorGrading(
          inputR, inputG, inputB,
          adjustments,
          hslAdjustments
        );
        
        // Format output based on LUT format
        switch (format) {
          case 'CUBE':
          case '3DL':
            lutContent += `${outputR.toFixed(6)} ${outputG.toFixed(6)} ${outputB.toFixed(6)}\n`;
            break;
            
          case 'CSP':
            const r16 = Math.round(outputR * 65535);
            const g16 = Math.round(outputG * 65535);
            const b16 = Math.round(outputB * 65535);
            lutContent += `${r16} ${g16} ${b16}\n`;
            break;
        }
        
        progress++;
        if (progress % 1000 === 0) {
          exportProgress.set((progress / totalSteps) * 100);
          // Allow UI to update
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
  }
  
  return lutContent;
}

function applyColorGrading(
  r: number, g: number, b: number,
  adjustments: ColorGradingPreset['adjustments'],
  hslAdjustments: ColorGradingPreset['hslAdjustments']
): { r: number; g: number; b: number } {
  // This is a simplified color grading implementation
  // In a real application, this would use proper color science
  
  // Calculate luminance to determine tone range
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // Apply color grading based on tone range
  let adjustedR = r;
  let adjustedG = g;
  let adjustedB = b;
  
  if (luminance < 0.33) {
    // Shadows
    adjustedR += adjustments.shadows.red / 100;
    adjustedG += adjustments.shadows.green / 100;
    adjustedB += adjustments.shadows.blue / 100;
  } else if (luminance < 0.67) {
    // Midtones
    adjustedR += adjustments.midtones.red / 100;
    adjustedG += adjustments.midtones.green / 100;
    adjustedB += adjustments.midtones.blue / 100;
  } else {
    // Highlights
    adjustedR += adjustments.highlights.red / 100;
    adjustedG += adjustments.highlights.green / 100;
    adjustedB += adjustments.highlights.blue / 100;
  }
  
  // Clamp values
  adjustedR = Math.max(0, Math.min(1, adjustedR));
  adjustedG = Math.max(0, Math.min(1, adjustedG));
  adjustedB = Math.max(0, Math.min(1, adjustedB));
  
  return { r: adjustedR, g: adjustedG, b: adjustedB };
}

export default colorGradingStore;