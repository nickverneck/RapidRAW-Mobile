/**
 * JavaScript fallback implementation for image processing
 * Used when WebAssembly is not supported
 */

export interface ImageAdjustments {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
}

export interface HistogramData {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
}

export class JavaScriptImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = ctx;
  }

  async processImage(
    imageData: Uint8Array,
    width: number,
    height: number,
    adjustments: ImageAdjustments
  ): Promise<Uint8Array> {
    console.warn('Using JavaScript fallback for image processing');
    
    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Create ImageData object
    const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
    
    // Apply adjustments
    const processedData = this.applyAdjustments(imgData.data, adjustments);
    
    return new Uint8Array(processedData);
  }

  async generateHistogram(imageData: Uint8Array, width: number, height: number): Promise<HistogramData> {
    console.warn('Using JavaScript fallback for histogram generation');
    
    const red = new Array(256).fill(0);
    const green = new Array(256).fill(0);
    const blue = new Array(256).fill(0);
    const luminance = new Array(256).fill(0);

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      
      red[r]++;
      green[g]++;
      blue[b]++;
      
      // Calculate luminance using standard weights
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      luminance[Math.min(lum, 255)]++;
    }

    return { red, green, blue, luminance };
  }

  private applyAdjustments(data: Uint8ClampedArray, adjustments: ImageAdjustments): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data);
    
    for (let i = 0; i < result.length; i += 4) {
      let r = result[i] / 255;
      let g = result[i + 1] / 255;
      let b = result[i + 2] / 255;
      
      // Apply exposure
      const exposureFactor = Math.pow(2, adjustments.exposure);
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;
      
      // Apply contrast
      const contrastFactor = (259 * (adjustments.contrast * 255 + 255)) / (255 * (259 - adjustments.contrast * 255));
      r = contrastFactor * (r - 0.5) + 0.5;
      g = contrastFactor * (g - 0.5) + 0.5;
      b = contrastFactor * (b - 0.5) + 0.5;
      
      // Apply highlights/shadows (simplified)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 0.5) {
        // Highlights
        const highlightFactor = 1 + adjustments.highlights * (luminance - 0.5) * 2;
        r *= highlightFactor;
        g *= highlightFactor;
        b *= highlightFactor;
      } else {
        // Shadows
        const shadowFactor = 1 + adjustments.shadows * (0.5 - luminance) * 2;
        r *= shadowFactor;
        g *= shadowFactor;
        b *= shadowFactor;
      }
      
      // Apply temperature/tint (simplified)
      const tempFactor = adjustments.temperature / 100;
      const tintFactor = adjustments.tint / 100;
      
      r *= (1 + tempFactor * 0.3);
      g *= (1 + tintFactor * 0.2);
      b *= (1 - tempFactor * 0.3);
      
      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const satFactor = 1 + adjustments.saturation;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
      
      // Clamp values
      result[i] = Math.round(Math.max(0, Math.min(255, r * 255)));
      result[i + 1] = Math.round(Math.max(0, Math.min(255, g * 255)));
      result[i + 2] = Math.round(Math.max(0, Math.min(255, b * 255)));
      // Alpha channel unchanged
    }
    
    return result;
  }

  dispose(): void {
    // No cleanup needed for JavaScript implementation
  }
}