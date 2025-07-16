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