/**
 * TypeScript wrapper for the RAW processing WebAssembly module
 */

export interface RawMetadata {
  camera_make: string;
  camera_model: string;
  lens_model?: string;
  iso: number;
  aperture: number;
  shutter_speed: string;
  focal_length?: number;
  white_balance: number;
  color_space: string;
  width: number;
  height: number;
  orientation: number;
  timestamp?: string;
}

export interface RawProcessingSettings {
  white_balance?: [number, number]; // [temperature, tint]
  exposure_compensation: number;
  highlight_recovery: number;
  shadow_recovery: number;
  color_matrix?: number[]; // 3x3 matrix
  gamma: number;
  output_color_space: string;
}

export class RawProcessorWrapper {
  private wasmModule: any = null;
  private processor: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import of the WASM module
      const wasmModule = await import('@wasm/raw-processing/raw_processing.js');
      await wasmModule.default();
      
      this.wasmModule = wasmModule;
      this.processor = new wasmModule.RawProcessor();
      this.isInitialized = true;
      
      console.log('✅ RAW processing WASM module initialized');
    } catch (error) {
      console.error('❌ Failed to initialize RAW processing WASM module:', error);
      throw new Error(`Failed to initialize RAW WebAssembly module: ${error}`);
    }
  }

  async decodeRaw(rawData: Uint8Array, format: string): Promise<Uint8Array> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = this.processor.decode_raw(rawData, format);
      return new Uint8Array(result);
    } catch (error) {
      console.error('Error decoding RAW file:', error);
      throw new Error(`RAW decoding failed: ${error}`);
    }
  }

  async getMetadata(rawData: Uint8Array): Promise<RawMetadata> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = this.processor.get_metadata(rawData);
      return result as RawMetadata;
    } catch (error) {
      console.error('Error extracting RAW metadata:', error);
      throw new Error(`RAW metadata extraction failed: ${error}`);
    }
  }

  async processRaw(rawData: Uint8Array, settings: RawProcessingSettings): Promise<Uint8Array> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = this.processor.process_raw(rawData, settings);
      return new Uint8Array(result);
    } catch (error) {
      console.error('Error processing RAW file:', error);
      throw new Error(`RAW processing failed: ${error}`);
    }
  }

  getSupportedFormats(): string[] {
    if (!this.isInitialized) {
      return ['CR2', 'CR3', 'NEF', 'NRW', 'ARW', 'SRF', 'SR2', 'RAF', 'ORF', 'RW2', 'DNG'];
    }

    try {
      return this.processor.get_supported_formats();
    } catch (error) {
      console.error('Error getting supported formats:', error);
      return ['CR2', 'CR3', 'NEF', 'NRW', 'ARW', 'SRF', 'SR2', 'RAF', 'ORF', 'RW2', 'DNG'];
    }
  }

  validateRawFile(rawData: Uint8Array): boolean {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return this.processor.validate_raw_file(rawData);
    } catch (error) {
      console.error('Error validating RAW file:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.processor !== null;
  }

  dispose(): void {
    if (this.processor) {
      this.processor = null;
    }
    this.wasmModule = null;
    this.isInitialized = false;
  }
}

// Singleton instance for global use
let globalRawProcessor: RawProcessorWrapper | null = null;

export async function getRawProcessor(): Promise<RawProcessorWrapper> {
  if (!globalRawProcessor) {
    globalRawProcessor = new RawProcessorWrapper();
    await globalRawProcessor.initialize();
  }
  return globalRawProcessor;
}

// Utility function to detect RAW file format from filename
export function detectRawFormat(filename: string): string | null {
  const extension = filename.split('.').pop()?.toUpperCase();
  const supportedFormats = ['CR2', 'CR3', 'NEF', 'NRW', 'ARW', 'SRF', 'SR2', 'RAF', 'ORF', 'RW2', 'DNG'];
  
  return supportedFormats.includes(extension || '') ? extension! : null;
}

// Utility function to check if a file is a RAW file
export function isRawFile(filename: string): boolean {
  return detectRawFormat(filename) !== null;
}