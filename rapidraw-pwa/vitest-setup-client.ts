/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebAssembly for testing
global.WebAssembly = {
	instantiate: vi.fn(),
	instantiateStreaming: vi.fn(),
	compile: vi.fn(),
	compileStreaming: vi.fn(),
	validate: vi.fn(),
	Module: vi.fn(),
	Instance: vi.fn(),
	Memory: vi.fn(),
	Table: vi.fn(),
	CompileError: Error,
	RuntimeError: Error,
	LinkError: Error
} as any;

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
	value: {
		register: vi.fn(() => Promise.resolve()),
		ready: Promise.resolve({
			waiting: null,
			installing: null,
			active: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		}),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		controller: null
	},
	writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
	fillRect: vi.fn(),
	clearRect: vi.fn(),
	getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
	putImageData: vi.fn(),
	createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
	setTransform: vi.fn(),
	drawImage: vi.fn(),
	save: vi.fn(),
	restore: vi.fn(),
	beginPath: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	closePath: vi.fn(),
	stroke: vi.fn(),
	fill: vi.fn(),
});

// Mock File API
global.File = class MockFile {
	constructor(public chunks: any[], public name: string, public options?: any) {}
	get size() { return 1024; }
	get type() { return 'image/png'; }
	get lastModified() { return Date.now(); }
	arrayBuffer() { return Promise.resolve(new ArrayBuffer(1024)); }
	text() { return Promise.resolve(''); }
	stream() { return new ReadableStream(); }
	slice() { return new MockFile([], this.name); }
} as any;

// Mock FileReader
global.FileReader = class MockFileReader {
	result: any = null;
	error: any = null;
	readyState: number = 0;
	onload: any = null;
	onerror: any = null;
	onabort: any = null;
	onloadstart: any = null;
	onloadend: any = null;
	onprogress: any = null;
	
	readAsArrayBuffer() { this.result = new ArrayBuffer(1024); this.onload?.(); }
	readAsDataURL() { this.result = 'data:image/png;base64,'; this.onload?.(); }
	readAsText() { this.result = ''; this.onload?.(); }
	abort() {}
	addEventListener() {}
	removeEventListener() {}
	dispatchEvent() { return true; }
} as any;
