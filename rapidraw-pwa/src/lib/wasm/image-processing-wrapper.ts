/**
 * TypeScript wrapper for the image processing WebAssembly module
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

export interface ImageMetadata {
  width: number;
  height: number;
  channels: number;
  bit_depth: number;
}

export class ImageProcessorWrapper {
  private wasmModule: any = null;
  private processor: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import of the WASM module
      const wasmModule = await import('@wasm/image-processing/image_processing.js');
      await wasmModule.default();
      
      this.wasmModule = wasmModule;
      this.processor = new wasmModule.ImageProcessor();
      this.isInitialized = true;
      
      console.log('✅ Image processing WASM module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize image processing WASM module:', error);
      throw new Error(`Failed to initialize WebAssembly module: ${error}`);
    }
  }

  async processImage(
    imageData: Uint8Array,
    width: number,
    height: number,
    adjustments: ImageAdjustments
  ): Promise<Uint8Array> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.processor.set_image_info(width, height, 4); // RGBA
      const result = this.processor.process_image(imageData, adjustments);
      return new Uint8Array(result);
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Image processing failed: ${error}`);
    }
  }

  async generateHistogram(imageData: Uint8Array, width: number, height: number): Promise<HistogramData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.processor.set_image_info(width, height, 4);
      const result = this.processor.generate_histogram(imageData);
      return result as HistogramData;
    } catch (error) {
      console.error('Error generating histogram:', error);
      throw new Error(`Histogram generation failed: ${error}`);
    }
  }

  async getImageMetadata(): Promise<ImageMetadata> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = this.processor.get_image_metadata();
      return result as ImageMetadata;
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw new Error(`Metadata retrieval failed: ${error}`);
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.processor !== null;
  }

  dispose(): void {
    if (this.processor) {
      // WASM cleanup would go here if needed
      this.processor = null;
    }
    this.wasmModule = null;
    this.isInitialized = false;
  }
}

// Singleton instance for global use
let globalImageProcessor: ImageProcessorWrapper | null = null;

export async function getImageProcessor(): Promise<ImageProcessorWrapper> {
  if (!globalImageProcessor) {
    globalImageProcessor = new ImageProcessorWrapper();
    await globalImageProcessor.initialize();
  }
  return globalImageProcessor;
}

// Fallback JavaScript implementation for browsers without WASM support
export class JavaScriptImageProcessor {
  async processImage(
    imageData: Uint8Array,
    width: number,
    height: number,
    adjustments: ImageAdjustments
  ): Promise<Uint8Array> {
    console.warn('Using JavaScript fallback for image processing');
    
    const result = new Uint8Array(imageData);
    
    // Basic exposure adjustment as fallback
    const exposureFactor = Math.pow(2, adjustments.exposure);
    
    for (let i = 0; i < result.length; i += 4) {
      result[i] = Math.min(255, result[i] * exposureFactor);     // R
      result[i + 1] = Math.min(255, result[i + 1] * exposureFactor); // G
      result[i + 2] = Math.min(255, result[i + 2] * exposureFactor); // B
      // Alpha channel unchanged
    }
    
    return result;
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
      
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      luminance[Math.min(lum, 255)]++;
    }

    return { red, green, blue, luminance };
  }

  async getImageMetadata(): Promise<ImageMetadata> {
    return {
      width: 0,
      height: 0,
      channels: 4,
      bit_depth: 8
    };
  }

  isReady(): boolean {
    return true;
  }

  dispose(): void {
    // No cleanup needed for JavaScript implementation
  }
}

// Feature detection and processor selection
export async function createImageProcessor(): Promise<ImageProcessorWrapper | JavaScriptImageProcessor> {
  // Check if WebAssembly is supported
  if (typeof WebAssembly === 'undefined') {
    console.warn('WebAssembly not supported, using JavaScript fallback');
    return new JavaScriptImageProcessor();
  }

  try {
    const processor = new ImageProcessorWrapper();
    await processor.initialize();
    return processor;
  } catch (error) {
    console.warn('Failed to initialize WASM processor, using JavaScript fallback:', error);
    return new JavaScriptImageProcessor();
  }
}