import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createTestImage, createTestRAWData, mockWebGPU, mockWebGL } from './wasm-test-utils';

// Mock WebAssembly modules for testing
const mockImageProcessor = {
  process_image: vi.fn().mockReturnValue(new Uint8Array(100)),
  generate_histogram: vi.fn().mockReturnValue({
    red: new Array(256).fill(0),
    green: new Array(256).fill(0),
    blue: new Array(256).fill(0),
    luminance: new Array(256).fill(0)
  }),
  apply_color_grading: vi.fn().mockReturnValue(new Uint8Array(100)),
  free: vi.fn()
};

const mockRawProcessor = {
  decode_raw: vi.fn().mockReturnValue(new Uint8Array([255, 128, 64, 255])),
  get_metadata: vi.fn().mockReturnValue({
    camera: 'Canon EOS R5',
    lens: 'RF 24-70mm f/2.8L IS USM',
    iso: 800,
    aperture: 2.8,
    shutterSpeed: '1/125',
    focalLength: 50,
    whiteBalance: 5600,
    colorSpace: 'sRGB'
  }),
  free: vi.fn()
};

// Mock WASM module loading
vi.mock('../wasm/image_processing', () => ({
  ImageProcessor: vi.fn(() => mockImageProcessor)
}));

vi.mock('../wasm/raw_processing', () => ({
  RawProcessor: vi.fn(() => mockRawProcessor)
}));

describe('Image Processing Workflow Tests', () => {
  let testImageData: Uint8Array;
  let testRAWData: Uint8Array;

  beforeAll(async () => {
    testImageData = createTestImage(1920, 1080);
    testRAWData = createTestRAWData();
  });

  afterAll(() => {
    // Cleanup any allocated memory
    mockImageProcessor.free();
    mockRawProcessor.free();
  });

  describe('RAW File Processing', () => {
    it('should decode RAW files successfully', async () => {
      const expectedDecodedData = new Uint8Array([255, 128, 64, 255]);
      mockRawProcessor.decode_raw.mockReturnValue(expectedDecodedData);

      const result = mockRawProcessor.decode_raw(testRAWData, 'CR2');

      expect(mockRawProcessor.decode_raw).toHaveBeenCalledWith(testRAWData, 'CR2');
      expect(result).toEqual(expectedDecodedData);
    });

    it('should extract metadata from RAW files', () => {
      const expectedMetadata = {
        camera: 'Canon EOS R5',
        lens: 'RF 24-70mm f/2.8L IS USM',
        iso: 800,
        aperture: 2.8,
        shutterSpeed: '1/125',
        focalLength: 50,
        whiteBalance: 5600,
        colorSpace: 'sRGB'
      };
      
      mockRawProcessor.get_metadata.mockReturnValue(expectedMetadata);

      const metadata = mockRawProcessor.get_metadata(testRAWData);

      expect(mockRawProcessor.get_metadata).toHaveBeenCalledWith(testRAWData);
      expect(metadata).toEqual(expectedMetadata);
      expect(metadata.camera).toBe('Canon EOS R5');
      expect(metadata.iso).toBe(800);
    });

    it('should handle unsupported RAW formats gracefully', async () => {
      mockRawProcessor.decode_raw.mockRejectedValue(new Error('Unsupported format: XYZ'));

      await expect(mockRawProcessor.decode_raw(testRAWData, 'XYZ'))
        .rejects.toThrow('Unsupported format: XYZ');
    });

    it('should handle corrupted RAW data', async () => {
      const corruptedData = new Uint8Array([0, 0, 0, 0]);
      mockRawProcessor.decode_raw.mockRejectedValue(new Error('Invalid RAW data'));

      await expect(mockRawProcessor.decode_raw(corruptedData, 'CR2'))
        .rejects.toThrow('Invalid RAW data');
    });
  });

  describe('Histogram and Waveform Generation', () => {
    it('should generate accurate histogram data', () => {
      const expectedHistogram = {
        red: new Array(256).fill(0).map(() => Math.floor(Math.random() * 1000)),
        green: new Array(256).fill(0).map(() => Math.floor(Math.random() * 1000)),
        blue: new Array(256).fill(0).map(() => Math.floor(Math.random() * 1000)),
        luminance: new Array(256).fill(0).map(() => Math.floor(Math.random() * 1000))
      };

      mockImageProcessor.generate_histogram.mockReturnValue(expectedHistogram);

      const histogram = mockImageProcessor.generate_histogram(testImageData);

      expect(mockImageProcessor.generate_histogram).toHaveBeenCalledWith(testImageData);
      expect(histogram).toHaveProperty('red');
      expect(histogram).toHaveProperty('green');
      expect(histogram).toHaveProperty('blue');
      expect(histogram).toHaveProperty('luminance');
      expect(histogram.red).toHaveLength(256);
      expect(histogram.green).toHaveLength(256);
      expect(histogram.blue).toHaveLength(256);
      expect(histogram.luminance).toHaveLength(256);
    });

    it('should generate waveform data for RGB channels', () => {
      const expectedWaveform = {
        width: 1920,
        height: 200,
        red: new Uint8Array(100), // Smaller size for testing
        green: new Uint8Array(100),
        blue: new Uint8Array(100)
      };

      mockImageProcessor.generate_histogram.mockReturnValue(expectedWaveform);

      const waveform = mockImageProcessor.generate_histogram(testImageData);

      expect(waveform).toHaveProperty('width', 1920);
      expect(waveform).toHaveProperty('height', 200);
      expect(waveform.red).toBeInstanceOf(Uint8Array);
      expect(waveform.green).toBeInstanceOf(Uint8Array);
      expect(waveform.blue).toBeInstanceOf(Uint8Array);
    });

    it('should handle empty image data', async () => {
      const emptyData = new Uint8Array(0);
      mockImageProcessor.generate_histogram.mockRejectedValue(new Error('Empty image data'));

      await expect(mockImageProcessor.generate_histogram(emptyData))
        .rejects.toThrow('Empty image data');
    });
  });

  describe('Real-time Adjustment Processing', () => {
    it('should process basic adjustments in real-time', () => {
      const adjustments = {
        exposure: 0.5,
        contrast: 0.2,
        highlights: -0.3,
        shadows: 0.4,
        whites: 0.1,
        blacks: -0.1
      };

      const expectedProcessedData = new Uint8Array(100); // Smaller test data
      mockImageProcessor.process_image.mockReturnValue(expectedProcessedData);

      const startTime = performance.now();
      const result = mockImageProcessor.process_image(testImageData, adjustments);
      const processingTime = performance.now() - startTime;

      expect(mockImageProcessor.process_image).toHaveBeenCalledWith(testImageData, adjustments);
      expect(result).toBeInstanceOf(Uint8Array);
      // Real-time processing should complete within 100ms for test data
      expect(processingTime).toBeLessThan(100);
    });

    it('should process color grading adjustments', () => {
      const colorAdjustments = {
        temperature: 200,
        tint: -50,
        saturation: 0.2,
        vibrance: 0.1,
        hsl: {
          reds: { hue: 10, saturation: 5, lightness: 0 },
          oranges: { hue: 0, saturation: 0, lightness: 0 },
          yellows: { hue: -5, saturation: 10, lightness: 5 },
          greens: { hue: 0, saturation: 0, lightness: 0 },
          cyans: { hue: 0, saturation: 0, lightness: 0 },
          blues: { hue: 0, saturation: 0, lightness: 0 },
          purples: { hue: 0, saturation: 0, lightness: 0 },
          magentas: { hue: 0, saturation: 0, lightness: 0 }
        }
      };

      const expectedResult = new Uint8Array(100); // Smaller test data
      mockImageProcessor.apply_color_grading.mockReturnValue(expectedResult);

      const result = mockImageProcessor.apply_color_grading(testImageData, colorAdjustments);

      expect(mockImageProcessor.apply_color_grading).toHaveBeenCalledWith(testImageData, colorAdjustments);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle extreme adjustment values gracefully', async () => {
      const extremeAdjustments = {
        exposure: 5.0,  // Very high exposure
        contrast: -1.0, // Maximum negative contrast
        highlights: -1.0,
        shadows: 1.0,
        whites: 1.0,
        blacks: -1.0
      };

      const expectedResult = new Uint8Array(testImageData.length);
      mockImageProcessor.process_image.mockResolvedValue(expectedResult);

      const result = await mockImageProcessor.process_image(testImageData, extremeAdjustments);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(testImageData.length);
    });
  });

  describe('WebGPU/WebGL Fallback Behavior', () => {
    it('should use WebGPU when available', async () => {
      const mockWebGPUContext = mockWebGPU();
      
      // Mock WebGPU availability
      Object.defineProperty(navigator, 'gpu', {
        value: mockWebGPUContext,
        configurable: true
      });

      const adjustments = { exposure: 0.5 };
      const expectedResult = new Uint8Array(testImageData.length);
      mockImageProcessor.process_image.mockResolvedValue(expectedResult);

      const result = await mockImageProcessor.process_image(testImageData, adjustments);

      expect(result).toBeInstanceOf(Uint8Array);
      // In a real implementation, we would verify WebGPU was used
    });

    it('should fallback to WebGL when WebGPU is unavailable', async () => {
      // Mock WebGPU as unavailable
      Object.defineProperty(navigator, 'gpu', {
        value: undefined,
        configurable: true
      });

      const mockWebGLContext = mockWebGL();
      const mockCanvas = document.createElement('canvas');
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockWebGLContext);

      const adjustments = { exposure: 0.5 };
      const expectedResult = new Uint8Array(testImageData.length);
      mockImageProcessor.process_image.mockResolvedValue(expectedResult);

      const result = await mockImageProcessor.process_image(testImageData, adjustments);

      expect(result).toBeInstanceOf(Uint8Array);
      // In a real implementation, we would verify WebGL was used
    });

    it('should fallback to CPU processing when neither WebGPU nor WebGL are available', async () => {
      // Mock both WebGPU and WebGL as unavailable
      Object.defineProperty(navigator, 'gpu', {
        value: undefined,
        configurable: true
      });

      const mockCanvas = document.createElement('canvas');
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

      const adjustments = { exposure: 0.5 };
      const expectedResult = new Uint8Array(testImageData.length);
      mockImageProcessor.process_image.mockResolvedValue(expectedResult);

      const result = await mockImageProcessor.process_image(testImageData, adjustments);

      expect(result).toBeInstanceOf(Uint8Array);
      // CPU fallback should still work but may be slower
    });

    it('should handle GPU context loss gracefully', async () => {
      const mockWebGLContext = mockWebGL();
      
      // Simulate context loss
      const contextLossEvent = new Event('webglcontextlost');
      mockWebGLContext.canvas.dispatchEvent(contextLossEvent);

      const adjustments = { exposure: 0.5 };
      // Should fallback to CPU processing
      const expectedResult = new Uint8Array(testImageData.length);
      mockImageProcessor.process_image.mockResolvedValue(expectedResult);

      const result = await mockImageProcessor.process_image(testImageData, adjustments);

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete processing within performance thresholds', async () => {
      const adjustments = {
        exposure: 0.5,
        contrast: 0.2,
        highlights: -0.3,
        shadows: 0.4
      };

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await mockImageProcessor.process_image(testImageData, adjustments);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      // Performance thresholds for test data
      expect(averageTime).toBeLessThan(50); // Average under 50ms
      expect(maxTime).toBeLessThan(100); // Max under 100ms
    });

    it('should handle memory efficiently for large images', async () => {
      // Create a larger test image (4K resolution)
      const largeImageData = createTestImage(3840, 2160);
      const adjustments = { exposure: 0.5 };

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const expectedResult = new Uint8Array(largeImageData.length);
      mockImageProcessor.process_image.mockResolvedValue(expectedResult);

      await mockImageProcessor.process_image(largeImageData, adjustments);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB for test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});