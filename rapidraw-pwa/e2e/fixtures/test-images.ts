/**
 * Test image fixtures for image processing workflow tests
 */

export interface TestImage {
	name: string;
	width: number;
	height: number;
	format: string;
	data: Uint8Array;
}

/**
 * Generate a test image with specified dimensions and color
 */
export function generateTestImage(
	width: number, 
	height: number, 
	color: [number, number, number] = [128, 128, 128]
): TestImage {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
	ctx.fillRect(0, 0, width, height);
	
	// Add some pattern for testing
	ctx.fillStyle = 'white';
	ctx.fillRect(width / 4, height / 4, width / 2, height / 2);
	
	// Convert to ImageData
	const imageData = ctx.getImageData(0, 0, width, height);
	
	return {
		name: `test-${width}x${height}.png`,
		width,
		height,
		format: 'png',
		data: new Uint8Array(imageData.data.buffer)
	};
}

/**
 * Create a mock RAW file for testing
 */
export function generateMockRawImage(): TestImage {
	// Create a simple mock RAW file structure
	const width = 1920;
	const height = 1080;
	const data = new Uint8Array(width * height * 3);
	
	// Fill with gradient pattern
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 3;
			data[index] = (x / width) * 255;     // R
			data[index + 1] = (y / height) * 255; // G
			data[index + 2] = 128;                // B
		}
	}
	
	return {
		name: 'test-raw.cr2',
		width,
		height,
		format: 'cr2',
		data
	};
}

/**
 * Test adjustment presets
 */
export const testAdjustments = {
	basic: {
		exposure: 0.5,
		contrast: 0.2,
		highlights: -0.3,
		shadows: 0.4,
		whites: 0.1,
		blacks: -0.1
	},
	colorGrading: {
		temperature: 100,
		tint: -50,
		saturation: 0.2,
		vibrance: 0.3,
		hsl: {
			reds: { hue: 10, saturation: 20, lightness: 5 },
			oranges: { hue: 0, saturation: 0, lightness: 0 },
			yellows: { hue: -5, saturation: 15, lightness: 10 },
			greens: { hue: 0, saturation: 0, lightness: 0 },
			cyans: { hue: 0, saturation: 0, lightness: 0 },
			blues: { hue: 5, saturation: -10, lightness: -5 },
			purples: { hue: 0, saturation: 0, lightness: 0 },
			magentas: { hue: 0, saturation: 0, lightness: 0 }
		}
	}
};

/**
 * Performance test configurations
 */
export const performanceTestConfigs = [
	{ name: 'small', width: 800, height: 600 },
	{ name: 'medium', width: 1920, height: 1080 },
	{ name: 'large', width: 3840, height: 2160 },
	{ name: 'mobile', width: 375, height: 667 }
];