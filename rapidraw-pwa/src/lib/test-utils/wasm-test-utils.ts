/**
 * WebAssembly testing utilities
 */

import { vi } from 'vitest';

export interface MockWasmModule {
	memory: WebAssembly.Memory;
	exports: Record<string, any>;
}

/**
 * Create a mock WebAssembly module for testing
 */
export function createMockWasmModule(exports: Record<string, any> = {}): MockWasmModule {
	const memory = new WebAssembly.Memory({ initial: 1 });
	
	return {
		memory,
		exports: {
			memory,
			...exports
		}
	};
}

/**
 * Mock WebAssembly instantiation
 */
export function mockWasmInstantiate(mockModule: MockWasmModule) {
	vi.mocked(WebAssembly.instantiate).mockResolvedValue({
		instance: {
			exports: mockModule.exports
		},
		module: {} as WebAssembly.Module
	});
}

/**
 * Create mock image processing functions
 */
export function createMockImageProcessingWasm() {
	return createMockWasmModule({
		process_image: vi.fn((imagePtr: number, width: number, height: number, adjustments: number) => {
			// Mock image processing - return success
			return 1;
		}),
		generate_histogram: vi.fn((imagePtr: number, width: number, height: number) => {
			// Mock histogram generation - return pointer to histogram data
			return 1000;
		}),
		apply_color_grading: vi.fn((imagePtr: number, width: number, height: number, hslPtr: number) => {
			// Mock color grading - return success
			return 1;
		}),
		malloc: vi.fn((size: number) => {
			// Mock memory allocation - return mock pointer
			return 1000 + size;
		}),
		free: vi.fn((ptr: number) => {
			// Mock memory deallocation
		}),
		get_last_error: vi.fn(() => {
			// Mock error retrieval - return no error
			return 0;
		})
	});
}

/**
 * Create mock RAW processing functions
 */
export function createMockRawProcessingWasm() {
	return createMockWasmModule({
		decode_raw: vi.fn((rawPtr: number, rawSize: number, format: number) => {
			// Mock RAW decoding - return pointer to decoded image
			return 2000;
		}),
		get_metadata: vi.fn((rawPtr: number, rawSize: number) => {
			// Mock metadata extraction - return pointer to metadata
			return 3000;
		}),
		get_image_dimensions: vi.fn((imagePtr: number) => {
			// Mock dimension retrieval - return packed width/height
			return (1920 << 16) | 1080; // 1920x1080
		}),
		malloc: vi.fn((size: number) => 1000 + size),
		free: vi.fn((ptr: number) => {}),
		get_last_error: vi.fn(() => 0)
	});
}

/**
 * Create mock color grading functions
 */
export function createMockColorGradingWasm() {
	return createMockWasmModule({
		apply_hsl_adjustments: vi.fn((imagePtr: number, width: number, height: number, hslPtr: number) => {
			return 1;
		}),
		generate_lut: vi.fn((adjustmentsPtr: number, resolution: number) => {
			// Mock LUT generation - return pointer to LUT data
			return 4000;
		}),
		export_cube_lut: vi.fn((lutPtr: number, resolution: number, outputPtr: number) => {
			// Mock CUBE LUT export - return success
			return 1;
		}),
		apply_color_wheel: vi.fn((imagePtr: number, width: number, height: number, wheelPtr: number) => {
			return 1;
		}),
		malloc: vi.fn((size: number) => 1000 + size),
		free: vi.fn((ptr: number) => {}),
		get_last_error: vi.fn(() => 0)
	});
}

/**
 * Mock WebAssembly memory operations
 */
export class MockWasmMemory {
	private buffer: ArrayBuffer;
	private view: DataView;

	constructor(size: number = 1024 * 1024) {
		this.buffer = new ArrayBuffer(size);
		this.view = new DataView(this.buffer);
	}

	getUint8Array(offset: number, length: number): Uint8Array {
		return new Uint8Array(this.buffer, offset, length);
	}

	getFloat32Array(offset: number, length: number): Float32Array {
		return new Float32Array(this.buffer, offset, length);
	}

	writeUint8Array(offset: number, data: Uint8Array): void {
		const target = new Uint8Array(this.buffer, offset, data.length);
		target.set(data);
	}

	writeFloat32Array(offset: number, data: Float32Array): void {
		const target = new Float32Array(this.buffer, offset, data.length);
		target.set(data);
	}

	readUint32(offset: number): number {
		return this.view.getUint32(offset, true);
	}

	writeUint32(offset: number, value: number): void {
		this.view.setUint32(offset, value, true);
	}

	readFloat32(offset: number): number {
		return this.view.getFloat32(offset, true);
	}

	writeFloat32(offset: number, value: number): void {
		this.view.setFloat32(offset, value, true);
	}
}

/**
 * Performance testing utilities for WebAssembly
 */
export class WasmPerformanceTester {
	private startTime: number = 0;
	private endTime: number = 0;

	start(): void {
		this.startTime = performance.now();
	}

	end(): number {
		this.endTime = performance.now();
		return this.endTime - this.startTime;
	}

	async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
		this.start();
		const result = await fn();
		const duration = this.end();
		return { result, duration };
	}

	measure<T>(fn: () => T): { result: T; duration: number } {
		this.start();
		const result = fn();
		const duration = this.end();
		return { result, duration };
	}
}

/**
 * Test data generators
 */
export function generateTestImageData(width: number, height: number): Uint8Array {
	const data = new Uint8Array(width * height * 4);
	
	for (let i = 0; i < data.length; i += 4) {
		data[i] = Math.floor(Math.random() * 256);     // R
		data[i + 1] = Math.floor(Math.random() * 256); // G
		data[i + 2] = Math.floor(Math.random() * 256); // B
		data[i + 3] = 255;                             // A
	}
	
	return data;
}

export function generateTestAdjustments() {
	return {
		exposure: 0.5,
		contrast: 0.2,
		highlights: -0.3,
		shadows: 0.4,
		whites: 0.1,
		blacks: -0.1,
		temperature: 100,
		tint: -50,
		saturation: 0.2,
		vibrance: 0.3
	};
}

export function generateTestHSLAdjustments() {
	return {
		reds: { hue: 10, saturation: 20, lightness: 5 },
		oranges: { hue: 0, saturation: 0, lightness: 0 },
		yellows: { hue: -5, saturation: 15, lightness: 10 },
		greens: { hue: 0, saturation: 0, lightness: 0 },
		cyans: { hue: 0, saturation: 0, lightness: 0 },
		blues: { hue: 5, saturation: -10, lightness: -5 },
		purples: { hue: 0, saturation: 0, lightness: 0 },
		magentas: { hue: 0, saturation: 0, lightness: 0 }
	};
}
/**

 * Additional test utilities for image processing workflow tests
 */

export function createTestImage(width: number, height: number): Uint8Array {
	return generateTestImageData(width, height);
}

export function createTestRAWData(): Uint8Array {
	// Create mock RAW file header and data
	const headerSize = 1024;
	const imageDataSize = 1920 * 1080 * 2; // 16-bit per pixel
	const totalSize = headerSize + imageDataSize;
	
	const rawData = new Uint8Array(totalSize);
	
	// Mock RAW file header (simplified)
	const header = new TextEncoder().encode('MOCK_RAW_HEADER');
	rawData.set(header, 0);
	
	// Fill with mock sensor data
	for (let i = headerSize; i < totalSize; i += 2) {
		const value = Math.floor(Math.random() * 65536);
		rawData[i] = value & 0xFF;
		rawData[i + 1] = (value >> 8) & 0xFF;
	}
	
	return rawData;
}

export function mockWebGPU() {
	const mockAdapter = {
		requestDevice: vi.fn().mockResolvedValue({
			createBuffer: vi.fn(),
			createTexture: vi.fn(),
			createShaderModule: vi.fn(),
			createComputePipeline: vi.fn(),
			createCommandEncoder: vi.fn(),
			queue: {
				submit: vi.fn(),
				writeBuffer: vi.fn(),
				writeTexture: vi.fn()
			}
		})
	};

	return {
		requestAdapter: vi.fn().mockResolvedValue(mockAdapter)
	};
}

export function mockWebGL() {
	const canvas = document.createElement('canvas');
	const mockContext = {
		canvas,
		createShader: vi.fn(),
		createProgram: vi.fn(),
		createBuffer: vi.fn(),
		createTexture: vi.fn(),
		createFramebuffer: vi.fn(),
		shaderSource: vi.fn(),
		compileShader: vi.fn(),
		attachShader: vi.fn(),
		linkProgram: vi.fn(),
		useProgram: vi.fn(),
		bindBuffer: vi.fn(),
		bindTexture: vi.fn(),
		bindFramebuffer: vi.fn(),
		bufferData: vi.fn(),
		texImage2D: vi.fn(),
		texParameteri: vi.fn(),
		viewport: vi.fn(),
		drawArrays: vi.fn(),
		drawElements: vi.fn(),
		getUniformLocation: vi.fn(),
		getAttribLocation: vi.fn(),
		uniform1f: vi.fn(),
		uniform2f: vi.fn(),
		uniform3f: vi.fn(),
		uniform4f: vi.fn(),
		uniformMatrix4fv: vi.fn(),
		enableVertexAttribArray: vi.fn(),
		vertexAttribPointer: vi.fn(),
		readPixels: vi.fn(),
		getError: vi.fn().mockReturnValue(0), // GL_NO_ERROR
		VERTEX_SHADER: 35633,
		FRAGMENT_SHADER: 35632,
		ARRAY_BUFFER: 34962,
		ELEMENT_ARRAY_BUFFER: 34963,
		TEXTURE_2D: 3553,
		FRAMEBUFFER: 36160,
		RGBA: 6408,
		UNSIGNED_BYTE: 5121,
		FLOAT: 5126,
		TRIANGLES: 4,
		STATIC_DRAW: 35044
	};

	// Add event listener support for context loss
	canvas.addEventListener = vi.fn();
	canvas.removeEventListener = vi.fn();
	canvas.dispatchEvent = vi.fn();

	return mockContext;
}

export function measureMemoryUsage(): Promise<number> {
	return new Promise((resolve) => {
		if ('memory' in performance) {
			resolve((performance as any).memory.usedJSHeapSize);
		} else {
			resolve(0);
		}
	});
}

export interface BenchmarkResult {
	wasmTime: number;
	jsTime: number;
	speedup: number;
	memoryUsage: number;
}

export async function benchmarkProcessing(
	wasmFn: () => Promise<any>,
	jsFn: () => Promise<any>,
	iterations: number = 10
): Promise<BenchmarkResult> {
	// Benchmark WebAssembly implementation
	const wasmTimes: number[] = [];
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		await wasmFn();
		wasmTimes.push(performance.now() - start);
	}

	// Benchmark JavaScript implementation
	const jsTimes: number[] = [];
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		await jsFn();
		jsTimes.push(performance.now() - start);
	}

	const wasmTime = wasmTimes.reduce((sum, time) => sum + time, 0) / wasmTimes.length;
	const jsTime = jsTimes.reduce((sum, time) => sum + time, 0) / jsTimes.length;

	return {
		wasmTime,
		jsTime,
		speedup: jsTime / wasmTime,
		memoryUsage: await measureMemoryUsage()
	};
}

export function createMemoryLeakDetector() {
	let initialMemory = 0;
	let samples: number[] = [];

	return {
		start: async () => {
			initialMemory = await measureMemoryUsage();
			samples = [];
		},
		
		sample: async () => {
			const currentMemory = await measureMemoryUsage();
			samples.push(currentMemory);
		},
		
		detect: () => {
			if (samples.length < 2) return false;
			
			// Check for consistent memory growth
			let growthCount = 0;
			for (let i = 1; i < samples.length; i++) {
				if (samples[i] > samples[i - 1]) {
					growthCount++;
				}
			}
			
			// If memory grows in more than 70% of samples, likely a leak
			return growthCount / (samples.length - 1) > 0.7;
		},
		
		getMemoryGrowth: () => {
			if (samples.length === 0) return 0;
			return Math.max(...samples) - initialMemory;
		}
	};
}