import { describe, it, expect } from 'vitest';
import { 
	createMockWasmModule, 
	generateTestImageData, 
	generateTestAdjustments,
	WasmPerformanceTester 
} from '../test-utils/wasm-test-utils';

describe('WASM Test Utils', () => {
	it('should create mock WASM module', () => {
		const mockModule = createMockWasmModule({
			test_function: () => 42
		});

		expect(mockModule.memory).toBeDefined();
		expect(mockModule.exports.test_function).toBeDefined();
		expect(mockModule.exports.test_function()).toBe(42);
	});

	it('should generate test image data', () => {
		const imageData = generateTestImageData(100, 100);
		
		expect(imageData).toBeInstanceOf(Uint8Array);
		expect(imageData.length).toBe(100 * 100 * 4); // RGBA
		
		// Check that alpha channel is set to 255
		for (let i = 3; i < imageData.length; i += 4) {
			expect(imageData[i]).toBe(255);
		}
	});

	it('should generate test adjustments', () => {
		const adjustments = generateTestAdjustments();
		
		expect(adjustments).toHaveProperty('exposure');
		expect(adjustments).toHaveProperty('contrast');
		expect(adjustments).toHaveProperty('temperature');
		expect(adjustments).toHaveProperty('saturation');
		
		expect(typeof adjustments.exposure).toBe('number');
		expect(typeof adjustments.contrast).toBe('number');
	});

	it('should measure performance', () => {
		const tester = new WasmPerformanceTester();
		
		const result = tester.measure(() => {
			// Simulate some work
			let sum = 0;
			for (let i = 0; i < 1000; i++) {
				sum += i;
			}
			return sum;
		});
		
		expect(result.result).toBe(499500); // Sum of 0 to 999
		expect(result.duration).toBeGreaterThan(0);
	});

	it('should measure async performance', async () => {
		const tester = new WasmPerformanceTester();
		
		const result = await tester.measureAsync(async () => {
			await new Promise(resolve => setTimeout(resolve, 10));
			return 'done';
		});
		
		expect(result.result).toBe('done');
		expect(result.duration).toBeGreaterThanOrEqual(10);
	});
});