/**
 * Test file to verify libraw-wasm integration
 */
import { getRawProcessor, detectRawFormat, isRawFile, tryExtractJpegPreview } from '$lib/wasm/raw-processing-wrapper';

export async function testLibrawIntegration() {
    console.log('🧪 Testing libraw-wasm integration...');
    
    try {
        // Test 1: Check if we can initialize the processor
        console.log('📋 Test 1: Initializing RAW processor...');
        const processor = await getRawProcessor();
        console.log('✅ RAW processor initialized successfully');
        
        // Test 2: Check supported formats
        console.log('📋 Test 2: Getting supported formats...');
        const formats = processor.getSupportedFormats();
        console.log(`✅ Supported formats (${formats.length}):`, formats);
        
        // Test 3: Test format detection
        console.log('📋 Test 3: Testing format detection...');
        const testFiles = ['test.CR2', 'test.NEF', 'test.ARW', 'test.DNG', 'test.jpg'];
        testFiles.forEach(filename => {
            const format = detectRawFormat(filename);
            const isRaw = isRawFile(filename);
            console.log(`  ${filename}: format=${format}, isRaw=${isRaw}`);
        });
        
        // Test 4: Processor readiness
        console.log('📋 Test 4: Checking processor readiness...');
        const isReady = processor.isReady();
        console.log(`✅ Processor ready: ${isReady}`);
        
        console.log('🎉 All libraw-wasm integration tests passed!');
        return true;
    } catch (error) {
        console.error('❌ libraw-wasm integration test failed:', error);
        return false;
    }
}

// Test function specifically for RAW file processing
export async function testRawFileProcessing(rawData: Uint8Array, filename: string) {
    console.log(`🧪 Testing RAW file processing for ${filename}...`);
    
    try {
        const processor = await getRawProcessor();
        
        // Test metadata extraction
        console.log('📋 Testing metadata extraction...');
        const metadata = await processor.getMetadata(rawData);
        console.log('✅ Metadata extracted:', metadata);
        
        // Test RAW decoding
        console.log('📋 Testing RAW decoding...');
        const processedData = await processor.decodeRaw(rawData, detectRawFormat(filename)!, {
            outputBps: 8,
            outputColor: 1,
            userQual: 1, // Fast quality for testing
            halfSize: true // Half size for testing
        });
        console.log(`✅ RAW decoded successfully: ${processedData.length} bytes`);
        
        return { metadata, processedData };
    } catch (error) {
        console.error('❌ RAW file processing test failed:', error);
        throw error;
    }
}

// Simple test to verify libraw-wasm can be imported and instantiated
export async function testLibrawBasic() {
    console.log('🧪 Testing basic libraw-wasm functionality...');
    
    try {
        // Test import
        console.log('📋 Testing libraw-wasm import...');
        const LibRaw = (await import('libraw-wasm')).default;
        console.log('✅ libraw-wasm imported successfully');
        
        // Test instantiation
        console.log('📋 Testing LibRaw instantiation...');
        const libraw = new LibRaw();
        console.log('✅ LibRaw instance created successfully');
        
        console.log('🎉 Basic libraw-wasm test passed!');
        return true;
    } catch (error) {
        console.error('❌ Basic libraw-wasm test failed:', error);
        return false;
    }
}

// Make test functions available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).testLibrawIntegration = testLibrawIntegration;
    (window as any).testRawFileProcessing = testRawFileProcessing;
    (window as any).testLibrawBasic = testLibrawBasic;
}

// Export for use in components or dev tools
export { testLibrawIntegration as default };