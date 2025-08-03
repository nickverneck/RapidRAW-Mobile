/**
 * TypeScript wrapper for libraw-wasm library
 */
import LibRaw from 'libraw-wasm';

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
    bright?: number;
    threshold?: number;
    autoBrightThr?: number;
    adjustMaximumThr?: number;
    expShift?: number;
    expPreser?: number;
    halfSize?: boolean;
    fourColorRgb?: boolean;
    highlight?: number;
    useAutoWb?: boolean;
    useCameraWb?: boolean;
    useCameraMatrix?: number;
    outputColor?: number;
    outputBps?: number;
    outputTiff?: boolean;
    outputFlags?: number;
    userFlip?: number;
    userQual?: number;
    userBlack?: number;
    userCblack?: number[];
    userSat?: number;
    medPasses?: number;
    noAutoBright?: boolean;
    useFujiRotate?: number;
    greenMatching?: boolean;
    dcbIterations?: number;
    dcbEnhanceFl?: boolean;
    fbddNoiserd?: number;
    expCorrec?: boolean;
    noAutoScale?: boolean;
    noInterpolation?: boolean;
    greybox?: number[] | null;
    cropbox?: number[] | null;
    aber?: number[] | null;
    gamm?: number[] | null;
    userMul?: number[] | null;
    outputProfile?: string | null;
    cameraProfile?: string | null;
    badPixels?: string | null;
    darkFrame?: string | null;
}

export class RawProcessorWrapper {
    private libraw: LibRaw | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('🔧 Attempting to instantiate LibRaw...');
            // Instantiate LibRaw
            this.libraw = new LibRaw();
            console.log('🔧 LibRaw instance created successfully');

            this.isInitialized = true;

            console.log('✅ libraw-wasm initialized successfully');
            console.log('🎯 Using libraw-wasm for comprehensive RAW file support');

            // Test basic functionality
            console.log('🔧 Testing LibRaw basic functionality...');
            const testLibraw = new LibRaw();
            console.log('✅ LibRaw test instance created successfully');

        } catch (error) {
            console.error('❌ Failed to initialize libraw-wasm:', error);
            console.error('❌ Error details:', error);
            throw new Error(`Failed to initialize libraw-wasm: ${error}`);
        }
    }

    async decodeRaw(rawData: Uint8Array, format?: string, settings?: RawProcessingSettings): Promise<Uint8Array> {
        try {
            console.log(`🔧 Creating LibRaw instance for decoding...`);

            // Import LibRaw dynamically to ensure it's loaded
            const LibRaw = (await import('libraw-wasm')).default;
            const libraw = new LibRaw();

            console.log(`🔧 Decoding RAW file (${rawData.length} bytes) with settings:`, settings);

            // Use minimal settings to start with
            const minimalSettings = {
                outputBps: 8,
                outputColor: 1,
                userQual: 0,
                halfSize: false,
                ...settings
            };

            console.log(`🔧 Using settings:`, minimalSettings);

            console.log(`🔧 Opening RAW file for decoding... (this may take a while for large files)`);
            await libraw.open(rawData, minimalSettings);
            console.log(`✅ RAW file opened successfully for decoding`);

            console.log(`🔧 Extracting image data... (this may take a while for large files)`);
            const imageData = await libraw.imageData();

            console.log('✅ Successfully decoded RAW file with libraw-wasm');
            console.log(`📊 Image data length: ${imageData.length} bytes`);
            console.log(`📊 Image data type:`, typeof imageData);
            console.log(`📊 Image data constructor:`, imageData.constructor.name);
            console.log(`📊 Is Uint8Array:`, imageData instanceof Uint8Array);
            console.log(`📊 Expected RGB data for image processing`);

            return imageData;
        } catch (error) {
            console.error('❌ Error decoding RAW file with libraw-wasm:', error);
            console.error('❌ Error details:', error);
            console.error('❌ Error stack:', error.stack);
            throw new Error(`RAW decoding failed: ${error}`);
        }
    }

    async getMetadata(rawData: Uint8Array): Promise<RawMetadata> {
        try {
            console.log(`🔧 Creating LibRaw instance for metadata extraction...`);

            // Import LibRaw dynamically to ensure it's loaded
            const LibRaw = (await import('libraw-wasm')).default;
            console.log(`🔧 LibRaw imported successfully`);

            const libraw = new LibRaw();
            console.log(`🔧 LibRaw instance created successfully`);

            // Log some info about the instance
            console.log(`🔧 LibRaw instance type:`, typeof libraw);
            console.log(`🔧 LibRaw instance methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(libraw)));

            console.log(`🔧 Opening RAW file (${rawData.length} bytes) for metadata...`);
            console.log(`🔧 First 20 bytes of RAW data:`, Array.from(rawData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));

            // Try with absolute minimal settings and check if it's a timeout issue
            console.log(`🔧 Attempting libraw.open() with absolute minimal settings...`);
            console.log(`🔧 This may take up to 60 seconds for large ARW files...`);

            const openPromise = libraw.open(rawData, {
                outputBps: 8
            });

            // Add progress indicators but no timeout - let it take as long as needed
            const progressInterval = setInterval(() => {
                console.log(`🔄 Still processing RAW file... (this can take time for large ARW files)`);
            }, 5000);

            try {
                await openPromise;
                clearInterval(progressInterval);
                console.log(`✅ RAW file opened successfully for metadata`);
            } catch (error) {
                clearInterval(progressInterval);
                throw error;
            }
            console.log(`✅ RAW file opened successfully for metadata`);

            console.log(`🔧 Fetching metadata...`);
            const meta = await libraw.metadata(false);

            console.log('✅ Successfully extracted metadata with libraw-wasm');
            console.log('📊 Raw metadata object:', meta);
            console.log('📊 Metadata keys:', Object.keys(meta));
            console.log('📊 Camera make:', meta.make);
            console.log('📊 Camera model:', meta.model);
            console.log('📊 Image dimensions:', meta.width, 'x', meta.height);
            console.log('📊 ISO:', meta.iso);
            console.log('📊 Aperture:', meta.aperture);
            console.log('📊 Shutter speed:', meta.shutter);

            // Map libraw metadata to our interface
            const mappedMetadata = {
                camera_make: meta.make || 'Unknown',
                camera_model: meta.model || 'Unknown',
                lens_model: meta.lens || undefined,
                iso: meta.iso || 0,
                aperture: meta.aperture || 0,
                shutter_speed: meta.shutter ? `1/${Math.round(1 / meta.shutter)}` : 'Unknown',
                focal_length: meta.focal_len || undefined,
                white_balance: meta.cam_mul?.[0] || 1,
                color_space: 'sRGB',
                width: meta.width || 0,
                height: meta.height || 0,
                orientation: meta.flip || 0,
                timestamp: meta.timestamp || undefined
            };

            console.log('📊 Mapped metadata:', mappedMetadata);
            return mappedMetadata;

        } catch (error) {
            console.error('❌ Error extracting RAW metadata with libraw-wasm:', error);
            console.error('❌ Error details:', error);
            console.error('❌ Error stack:', error.stack);
            throw new Error(`RAW metadata extraction failed: ${error}`);
        }
    }

    async processRaw(rawData: Uint8Array, settings: RawProcessingSettings): Promise<Uint8Array> {
        return this.decodeRaw(rawData, undefined, settings);
    }

    getSupportedFormats(): string[] {
        // libraw-wasm supports a comprehensive list of RAW formats
        return [
            'CR2', 'CR3', 'CRW', // Canon
            'NEF', 'NRW', // Nikon
            'ARW', 'SRF', 'SR2', // Sony
            'RAF', // Fujifilm
            'ORF', // Olympus
            'RW2', // Panasonic
            'DNG', // Adobe
            'PEF', 'PTX', // Pentax
            'X3F', // Sigma
            'ERF', // Epson
            'MRW', // Minolta
            'DCR', 'KDC', // Kodak
            '3FR', // Hasselblad
            'FFF', // Imacon
            'MEF', // Mamiya
            'MOS', // Leaf
            'RAW', // Generic
            'RWL' // Leica
        ];
    }

    validateRawFile(rawData: Uint8Array): boolean {
        // Basic validation - check for common RAW file signatures
        if (rawData.length < 100) return false;

        // Check for common RAW file headers
        const header = Array.from(rawData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join('');

        // Common RAW file signatures
        const rawSignatures = [
            '49492a00', // TIFF-based (CR2, NEF, etc.)
            '4d4d002a', // TIFF big-endian
            '49494949', // Some Canon formats
            'ffd8ffe1', // JPEG-based RAW with EXIF
        ];

        return rawSignatures.some(sig => header.toLowerCase().includes(sig));
    }

    isReady(): boolean {
        return this.isInitialized && this.libraw !== null;
    }

    dispose(): void {
        if (this.libraw) {
            // libraw-wasm handles cleanup automatically
            this.libraw = null;
        }
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
    const supportedFormats = [
        'CR2', 'CR3', 'CRW', // Canon
        'NEF', 'NRW', // Nikon
        'ARW', 'SRF', 'SR2', // Sony
        'RAF', // Fujifilm
        'ORF', // Olympus
        'RW2', // Panasonic
        'DNG', // Adobe
        'PEF', 'PTX', // Pentax
        'X3F', // Sigma
        'ERF', // Epson
        'MRW', // Minolta
        'DCR', 'KDC', // Kodak
        '3FR', // Hasselblad
        'FFF', // Imacon
        'MEF', // Mamiya
        'MOS', // Leaf
        'RAW', // Generic
        'RWL' // Leica
    ];

    return supportedFormats.includes(extension || '') ? extension! : null;
}

// Utility function to check if a file is a RAW file
export function isRawFile(filename: string): boolean {
    return detectRawFormat(filename) !== null;
}

// Utility function to try extracting JPEG preview from RAW file using libraw-wasm
export async function tryExtractJpegPreview(rawData: Uint8Array): Promise<Uint8Array | null> {
    try {
        console.log(`🔍 Attempting to extract JPEG preview using libraw-wasm from ${rawData.length} bytes...`);

        // First try manual JPEG extraction as it's faster and more reliable for previews
        const manualJpeg = extractJPEGManually(rawData);
        if (manualJpeg) {
            console.log(`✅ Successfully extracted JPEG preview manually: ${manualJpeg.length} bytes`);
            return manualJpeg;
        }

        // Fallback to libraw-wasm processing
        const libraw = new LibRaw();

        try {
            // Open the RAW file with minimal processing for preview extraction
            await libraw.open(rawData, {
                halfSize: true, // Use half-size for preview
                outputBps: 8,   // 8-bit output
                outputColor: 1, // sRGB
                noInterpolation: false,
                userQual: 0     // Fastest interpolation
            });

            // Get the processed image data (this will be RGB data)
            const imageData = await libraw.imageData();
            const metadata = await libraw.metadata(false);

            if (imageData && imageData.length > 0) {
                console.log(`✅ Successfully extracted preview using libraw-wasm: ${imageData.length} bytes`);
                console.log(`📊 Preview dimensions: ${metadata.width}x${metadata.height}`);

                // Convert RGB data to JPEG using canvas
                return await convertRGBToJPEG(imageData, metadata.width, metadata.height);
            }
        } catch (librawError) {
            console.warn('⚠️ libraw-wasm preview extraction failed:', librawError);
        }

        return null;
    } catch (error) {
        console.warn('❌ Failed to extract JPEG preview:', error);
        return null;
    }
}

// Helper function to convert RGB data to JPEG using canvas
async function convertRGBToJPEG(rgbData: Uint8Array, width: number, height: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            canvas.width = width;
            canvas.height = height;

            // Convert RGB data to RGBA format (ImageData expects RGBA)
            const rgbaData = new Uint8ClampedArray(width * height * 4);
            for (let i = 0; i < width * height; i++) {
                const rgbIndex = i * 3;
                const rgbaIndex = i * 4;

                rgbaData[rgbaIndex] = rgbData[rgbIndex];         // R
                rgbaData[rgbaIndex + 1] = rgbData[rgbIndex + 1]; // G
                rgbaData[rgbaIndex + 2] = rgbData[rgbIndex + 2]; // B
                rgbaData[rgbaIndex + 3] = 255;                   // A (fully opaque)
            }

            // Create ImageData from RGBA data
            const imageData = new ImageData(rgbaData, width, height);
            ctx.putImageData(imageData, 0, 0);

            // Convert to JPEG blob
            canvas.toBlob((blob) => {
                if (blob) {
                    blob.arrayBuffer().then(buffer => {
                        resolve(new Uint8Array(buffer));
                    }).catch(reject);
                } else {
                    reject(new Error('Failed to create JPEG blob'));
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            reject(error);
        }
    });
}

// Fallback manual JPEG extraction
function extractJPEGManually(rawData: Uint8Array): Uint8Array | null {
    try {
        // Look for JPEG markers in the RAW data
        const jpegStart = new Uint8Array([0xFF, 0xD8]); // JPEG SOI marker
        const jpegEnd = new Uint8Array([0xFF, 0xD9]);   // JPEG EOI marker

        let startIndex = -1;
        let endIndex = -1;

        console.log(`🔍 Manual JPEG search in ${rawData.length} bytes of RAW data...`);

        // Find JPEG start marker
        for (let i = 0; i < rawData.length - 1; i++) {
            if (rawData[i] === jpegStart[0] && rawData[i + 1] === jpegStart[1]) {
                startIndex = i;
                console.log(`📍 Found JPEG start marker at byte ${startIndex}`);
                break;
            }
        }

        if (startIndex === -1) {
            console.log('❌ No JPEG start marker found');
            return null;
        }

        // Find JPEG end marker after the start
        for (let i = startIndex + 2; i < rawData.length - 1; i++) {
            if (rawData[i] === jpegEnd[0] && rawData[i + 1] === jpegEnd[1]) {
                endIndex = i + 2;
                console.log(`📍 Found JPEG end marker at byte ${endIndex}`);
                break;
            }
        }

        if (endIndex === -1) {
            console.log('❌ No JPEG end marker found');
            return null;
        }

        // Extract the JPEG data
        const jpegData = rawData.slice(startIndex, endIndex);

        // Validate it's a reasonable size (at least 1KB, less than 50MB)
        if (jpegData.length < 1024) {
            console.log(`❌ JPEG preview too small: ${jpegData.length} bytes`);
            return null;
        }

        if (jpegData.length > 50 * 1024 * 1024) {
            console.log(`❌ JPEG preview too large: ${jpegData.length} bytes`);
            return null;
        }

        console.log(`✅ Successfully extracted JPEG preview manually: ${jpegData.length} bytes (${Math.round(jpegData.length / 1024)}KB)`);
        return jpegData;
    } catch (error) {
        console.warn('❌ Manual JPEG extraction failed:', error);
        return null;
    }
}