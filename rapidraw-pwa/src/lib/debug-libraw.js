// Simple debug script for libraw-wasm
// This can be copy-pasted into the browser console

async function debugLibrawWasm() {
    console.log('🔧 Starting libraw-wasm debug...');
    
    try {
        // Step 1: Test import
        console.log('📋 Step 1: Testing libraw-wasm import...');
        const LibRaw = (await import('libraw-wasm')).default;
        console.log('✅ libraw-wasm imported successfully');
        
        // Step 2: Test instantiation
        console.log('📋 Step 2: Testing LibRaw instantiation...');
        const libraw = new LibRaw();
        console.log('✅ LibRaw instance created successfully');
        console.log('📊 LibRaw instance:', libraw);
        
        // Step 3: Test with minimal data (this should fail gracefully)
        console.log('📋 Step 3: Testing with minimal data...');
        const testData = new Uint8Array([0x49, 0x49, 0x2A, 0x00]); // TIFF header
        
        try {
            console.log('🔧 Attempting to open minimal test data...');
            await libraw.open(testData, {});
            console.log('✅ libraw.open() completed (unexpected success)');
        } catch (error) {
            console.log('✅ libraw.open() failed as expected:', error.message);
        }
        
        console.log('🎉 libraw-wasm debug completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ libraw-wasm debug failed:', error);
        return false;
    }
}

// Make it available globally
window.debugLibrawWasm = debugLibrawWasm;

console.log('🔧 Debug function loaded. Run: debugLibrawWasm()');