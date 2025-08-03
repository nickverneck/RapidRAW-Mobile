import { writable, derived } from 'svelte/store';

export interface FolderItem {
	name: string;
	handle: FileSystemDirectoryHandle;
	path: string;
}

export interface ImageFile {
	name: string;
	handle: FileSystemFileHandle;
	thumbnail?: string;
	fullResolutionUrl?: string;
	path: string;
	lastModified: number;
	size: number;
	rating: number; // 0-5 stars
	flagged: boolean;
	isRaw?: boolean;
	rawFormat?: string;
}

export interface FilterState {
	minStarRating: number; // 0-5, shows images with this rating or higher
	showFlagged: boolean; // true = only flagged, false = all
	isActive: boolean; // true when any filters are applied
}

interface FolderState {
	selectedFolders: FolderItem[];
	currentFolder: FolderItem | null;
	images: ImageFile[];
	filteredImages: ImageFile[];
	isLoading: boolean;
	error: string | null;
	hasPermission: boolean;
	filterState: FilterState;
}

const initialState: FolderState = {
	selectedFolders: [],
	currentFolder: null,
	images: [],
	filteredImages: [],
	isLoading: false,
	error: null,
	hasPermission: false,
	filterState: {
		minStarRating: 0,
		showFlagged: false,
		isActive: false
	}
};

function createFolderStore() {
	const { subscribe, set, update } = writable<FolderState>(initialState);

	// Check if File System Access API is supported (SSR-safe)
	const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

	// Rating and filtering helper functions
	function loadImageRatings(): Map<string, { rating: number; flagged: boolean }> {
		if (typeof window === 'undefined') return new Map();
		
		try {
			const saved = localStorage.getItem('rapidraw-image-ratings');
			if (saved) {
				const data = JSON.parse(saved);
				return new Map(Object.entries(data));
			}
		} catch (error) {
			console.error('Failed to load image ratings:', error);
		}
		
		return new Map();
	}

	function saveImageRatings(ratings: Map<string, { rating: number; flagged: boolean }>) {
		if (typeof window === 'undefined') return;
		
		try {
			const data = Object.fromEntries(ratings);
			localStorage.setItem('rapidraw-image-ratings', JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save image ratings:', error);
		}
	}

	function applyFilters(images: ImageFile[], filterState: FilterState): ImageFile[] {
		if (!filterState.isActive) return images;

		return images.filter(image => {
			// Star rating filter
			if (filterState.minStarRating > 0 && image.rating < filterState.minStarRating) {
				return false;
			}

			// Flag filter
			if (filterState.showFlagged && !image.flagged) {
				return false;
			}

			return true;
		});
	}

	function updateFilterState(state: FolderState): FolderState {
		const isActive = state.filterState.minStarRating > 0 || state.filterState.showFlagged;
		const filteredImages = applyFilters(state.images, { ...state.filterState, isActive });
		
		return {
			...state,
			filterState: { ...state.filterState, isActive },
			filteredImages
		};
	}

	return {
		subscribe,
		
		// Check if user has previously selected folders (from localStorage)
		init: () => {
			if (typeof window !== 'undefined') {
				const savedFolders = localStorage.getItem('rapidraw-folders');
				if (savedFolders) {
					try {
						const folders = JSON.parse(savedFolders);
						update(state => ({
							...state,
							selectedFolders: folders,
							currentFolder: folders[0] || null,
							hasPermission: folders.length > 0
						}));
						
						// Load images from the first folder if available
						if (folders.length > 0) {
							folderStore.loadImagesFromFolder(folders[0]);
						}
					} catch (error) {
						console.error('Failed to load saved folders:', error);
					}
				}
			}
		},

		// Select a new folder using File System Access API
		selectFolder: async () => {
			if (!isSupported || typeof window === 'undefined') {
				update(state => ({ ...state, error: 'File System Access API not supported in this browser' }));
				return;
			}

			try {
				update(state => ({ ...state, isLoading: true, error: null }));

				const dirHandle = await (window as any).showDirectoryPicker({
					mode: 'read'
				});

				const folderItem: FolderItem = {
					name: dirHandle.name,
					handle: dirHandle,
					path: dirHandle.name
				};

				update(state => {
					const newFolders = [...state.selectedFolders, folderItem];
					const newState = {
						...state,
						selectedFolders: newFolders,
						currentFolder: folderItem,
						hasPermission: true,
						isLoading: false
					};

					// Save to localStorage
					if (typeof window !== 'undefined') {
						localStorage.setItem('rapidraw-folders', JSON.stringify(newFolders.map(f => ({
							name: f.name,
							path: f.path
						}))));
					}

					return newState;
				});

				// Load images from the selected folder
				await folderStore.loadImagesFromFolder(folderItem);

			} catch (error: any) {
				update(state => ({
					...state,
					isLoading: false,
					error: error.name === 'AbortError' ? null : `Failed to select folder: ${error.message}`
				}));
			}
		},

		// Load images from a specific folder
		loadImagesFromFolder: async (folder: FolderItem) => {
			try {
				update(state => ({ ...state, isLoading: true, error: null }));

				const images: ImageFile[] = [];
				const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
				const rawExtensions = /\.(cr2|cr3|nef|nrw|arw|srf|sr2|raf|orf|rw2|dng|raw)$/i;
				const ratings = loadImageRatings();

				for await (const [name, handle] of (folder.handle as any).entries()) {
					if (handle.kind === 'file') {
						const file = await handle.getFile();
						
						// Check if it's an image file (including RAW formats)
						if (supportedTypes.includes(file.type) || 
							/\.(jpe?g|png|webp|tiff?|bmp)$/i.test(name) ||
							rawExtensions.test(name)) {
							
							console.log(`📁 Processing file: ${name}, type: ${file.type}, isRAW: ${rawExtensions.test(name)}`);
							
							// Create thumbnail
							let thumbnail: string;
							try {
								thumbnail = await folderStore.createThumbnail(file);
								console.log(`🖼️ Thumbnail created for ${name}: SUCCESS`);
							} catch (error) {
								console.error(`❌ Thumbnail creation failed for ${name}:`, error);
								// Use a fallback placeholder thumbnail
								thumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNDQ0Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPlJBVzwvdGV4dD4KPC9zdmc+';
							}
							const imagePath = `${folder.path}/${name}`;
							const ratingData = ratings.get(imagePath) || { rating: 0, flagged: false };
							const isRawFile = rawExtensions.test(name);
							
							let fullResolutionUrl: string | undefined;
							let rawFormat: string | undefined;
							
							if (isRawFile) {
								// For RAW files, we'll generate the full resolution URL when needed
								rawFormat = name.split('.').pop()?.toUpperCase();
								// We'll generate the full resolution URL lazily when the image is selected
							} else {
								// For regular images, create a blob URL for full resolution
								fullResolutionUrl = URL.createObjectURL(file);
							}
							
							images.push({
								name,
								handle,
								path: imagePath,
								thumbnail,
								fullResolutionUrl,
								lastModified: file.lastModified,
								size: file.size,
								rating: ratingData.rating,
								flagged: ratingData.flagged,
								isRaw: isRawFile,
								rawFormat
							});
							
							console.log(`✅ Added ${name} to images array (total: ${images.length})`);
						}
					}
				}

				// Sort images by name
				images.sort((a, b) => a.name.localeCompare(b.name));

				console.log(`📊 Final image count: ${images.length}`);
				console.log(`📊 RAW files: ${images.filter(img => img.isRaw).length}`);
				console.log(`📊 Regular files: ${images.filter(img => !img.isRaw).length}`);

				update(state => updateFilterState({
					...state,
					images,
					currentFolder: folder,
					isLoading: false
				}));

			} catch (error: any) {
				update(state => ({
					...state,
					isLoading: false,
					error: `Failed to load images: ${error.message}`
				}));
			}
		},

		// Create thumbnail for an image file
		createThumbnail: async (file: File): Promise<string> => {
			const rawExtensions = /\.(cr2|cr3|nef|nrw|arw|srf|sr2|raf|orf|rw2|dng|raw)$/i;
			
			// Check if it's a RAW file
			if (rawExtensions.test(file.name)) {
				try {
					// Import RAW processing wrapper dynamically to avoid SSR issues
					const { getRawProcessor, detectRawFormat, tryExtractJpegPreview } = await import('$lib/wasm/raw-processing-wrapper');
					
					const rawFormat = detectRawFormat(file.name);
					if (!rawFormat) {
						throw new Error('Unsupported RAW format');
					}
					
					const arrayBuffer = await file.arrayBuffer();
					const rawData = new Uint8Array(arrayBuffer);
					
					console.log('🖼️ Creating thumbnail - JPEG preview is fine for memory efficiency');
					
					// PRIORITY 1 for thumbnails: Extract JPEG preview (saves memory)
					const jpegPreview = await tryExtractJpegPreview(rawData);
					if (jpegPreview) {
						console.log('✅ Using extracted JPEG preview for thumbnail');
						const blob = new Blob([jpegPreview], { type: 'image/jpeg' });
						const url = URL.createObjectURL(blob);
						
						// Create thumbnail from the JPEG preview
						return new Promise((resolve, reject) => {
							const img = new Image();
							img.onload = () => {
								const canvas = document.createElement('canvas');
								const ctx = canvas.getContext('2d');
								
								if (!ctx) {
									reject(new Error('Failed to get canvas context'));
									return;
								}
								
								// Calculate thumbnail dimensions
								const maxSize = 200;
								let width = img.width;
								let height = img.height;
								
								if (width > height) {
									if (width > maxSize) {
										height = (height * maxSize) / width;
										width = maxSize;
									}
								} else {
									if (height > maxSize) {
										width = (width * maxSize) / height;
										height = maxSize;
									}
								}
								
								canvas.width = width;
								canvas.height = height;
								ctx.drawImage(img, 0, 0, width, height);
								
								URL.revokeObjectURL(url); // Clean up
								resolve(canvas.toDataURL('image/jpeg', 0.8));
							};
							img.onerror = () => {
								URL.revokeObjectURL(url);
								reject(new Error('Failed to load JPEG preview'));
							};
							img.src = url;
						});
					}
					
					console.log('⚠️ No JPEG preview found for thumbnail, falling back to libraw-wasm');
					
					// FALLBACK for thumbnails: Use libraw-wasm if no JPEG preview
					const rawProcessor = await getRawProcessor();
					const metadata = await rawProcessor.getMetadata(rawData);
					const processedData = await rawProcessor.decodeRaw(rawData, rawFormat, {
						halfSize: true, // Use half-size for thumbnails to save memory
						outputBps: 8,   // 8-bit output
						outputColor: 1, // sRGB
						userQual: 0     // Fastest interpolation for thumbnails
					});
					
					// Create thumbnail from processed data
					return new Promise((resolve, reject) => {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						
						if (!ctx) {
							reject(new Error('Failed to get canvas context'));
							return;
						}
						
						// Convert RGB data to RGBA format (ImageData expects RGBA)
						const rgbaData = new Uint8ClampedArray(metadata.width * metadata.height * 4);
						for (let i = 0; i < metadata.width * metadata.height; i++) {
							const rgbIndex = i * 3;
							const rgbaIndex = i * 4;
							
							rgbaData[rgbaIndex] = processedData[rgbIndex];         // R
							rgbaData[rgbaIndex + 1] = processedData[rgbIndex + 1]; // G
							rgbaData[rgbaIndex + 2] = processedData[rgbIndex + 2]; // B
							rgbaData[rgbaIndex + 3] = 255;                         // A (fully opaque)
						}
						
						// Create ImageData from RGBA data
						const fullImageData = new ImageData(rgbaData, metadata.width, metadata.height);
						
						// Calculate thumbnail dimensions
						const maxSize = 200;
						let width = metadata.width;
						let height = metadata.height;
						
						if (width > height) {
							if (width > maxSize) {
								height = (height * maxSize) / width;
								width = maxSize;
							}
						} else {
							if (height > maxSize) {
								width = (width * maxSize) / height;
								height = maxSize;
							}
						}
						
						// Create temporary canvas for full image
						const tempCanvas = document.createElement('canvas');
						const tempCtx = tempCanvas.getContext('2d');
						
						if (!tempCtx) {
							reject(new Error('Failed to get temporary canvas context'));
							return;
						}
						
						tempCanvas.width = metadata.width;
						tempCanvas.height = metadata.height;
						tempCtx.putImageData(fullImageData, 0, 0);
						
						// Draw scaled version to thumbnail canvas
						canvas.width = width;
						canvas.height = height;
						ctx.drawImage(tempCanvas, 0, 0, metadata.width, metadata.height, 0, 0, width, height);
						
						resolve(canvas.toDataURL('image/jpeg', 0.8));
					});
				} catch (error) {
					console.error('Failed to create RAW thumbnail:', error);
					// Fallback to a generic RAW file icon or placeholder
					return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNDQ0Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPkNSMjwvdGV4dD4KPC9zdmc+';
				}
			} else {
				// Handle regular image files
				return new Promise((resolve, reject) => {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					const img = new Image();

					img.onload = () => {
						// Set thumbnail size
						const maxSize = 200;
						let { width, height } = img;

						if (width > height) {
							if (width > maxSize) {
								height = (height * maxSize) / width;
								width = maxSize;
							}
						} else {
							if (height > maxSize) {
								width = (width * maxSize) / height;
								height = maxSize;
							}
						}

						canvas.width = width;
						canvas.height = height;

						ctx?.drawImage(img, 0, 0, width, height);
						resolve(canvas.toDataURL('image/jpeg', 0.8));
					};

					img.onerror = () => reject(new Error('Failed to create thumbnail'));
					img.src = URL.createObjectURL(file);
				});
			}
		},

		// Switch to a different folder
		switchFolder: (folder: FolderItem) => {
			update(state => ({ ...state, currentFolder: folder }));
			folderStore.loadImagesFromFolder(folder);
		},

		// Remove a folder from the list
		removeFolder: (folderPath: string) => {
			update(state => {
				const newFolders = state.selectedFolders.filter(f => f.path !== folderPath);
				const newCurrentFolder = newFolders.length > 0 ? newFolders[0] : null;
				
				// Update localStorage
				if (typeof window !== 'undefined') {
					localStorage.setItem('rapidraw-folders', JSON.stringify(newFolders.map(f => ({
						name: f.name,
						path: f.path
					}))));
				}

				return {
					...state,
					selectedFolders: newFolders,
					currentFolder: newCurrentFolder,
					images: newCurrentFolder ? state.images : [],
					hasPermission: newFolders.length > 0
				};
			});

			// Load images from new current folder if available
			const state = get(folderStore);
			if (state.currentFolder) {
				folderStore.loadImagesFromFolder(state.currentFolder);
			}
		},

		// Clear all data
		reset: () => {
			set(initialState);
			if (typeof window !== 'undefined') {
				localStorage.removeItem('rapidraw-folders');
			}
		},

		// Generate full resolution URL for RAW files
		generateFullResolutionUrl: async (imageFile: ImageFile): Promise<string> => {
			console.log(`🎯 generateFullResolutionUrl called for: ${imageFile.name}, isRaw: ${imageFile.isRaw}`);
			
			if (!imageFile.isRaw) {
				console.log(`↩️ Not a RAW file, returning existing URL or thumbnail for ${imageFile.name}`);
				return imageFile.fullResolutionUrl || imageFile.thumbnail || '';
			}

			if (imageFile.fullResolutionUrl) {
				console.log(`↩️ Full resolution URL already exists for ${imageFile.name}`);
				return imageFile.fullResolutionUrl;
			}

			try {
				// Import RAW processing wrapper dynamically
				const { getRawProcessor, detectRawFormat, tryExtractJpegPreview } = await import('$lib/wasm/raw-processing-wrapper');
				
				const rawFormat = detectRawFormat(imageFile.name);
				if (!rawFormat) {
					console.error(`❌ Unsupported RAW format for ${imageFile.name}`);
					return imageFile.thumbnail || '';
				}
				
				const file = await imageFile.handle.getFile();
				const arrayBuffer = await file.arrayBuffer();
				const rawData = new Uint8Array(arrayBuffer);
				
				// Create a copy of the raw data to avoid ArrayBuffer detachment issues
				const rawDataCopy = new Uint8Array(rawData);
				
				console.log('🎯 Generating FULL RESOLUTION for image viewer - using libraw-wasm processing');
				
				// PRIORITY 1: Use libraw-wasm for actual RAW processing (full resolution)
				const rawProcessor = await getRawProcessor();
				try {
					console.log(`🔧 Getting metadata for ${imageFile.name}...`);
					const metadata = await rawProcessor.getMetadata(rawDataCopy);
					console.log(`📊 Metadata extracted: ${metadata.width}x${metadata.height}`);
					
					console.log(`🔧 Decoding RAW data for ${imageFile.name}...`);
					const processedData = await rawProcessor.decodeRaw(new Uint8Array(rawData), rawFormat, {
						// Full resolution settings
						outputBps: 8,      // 8-bit output
						outputColor: 1,    // sRGB
						userQual: 3,       // High quality interpolation
						useCameraWb: true, // Use camera white balance
						noAutoBright: false // Allow auto brightness
					});
					console.log(`🔧 RAW decoding complete, got ${processedData.length} bytes`);
					
					console.log('✅ Successfully processed RAW with libraw-wasm for full resolution');
					console.log(`📊 Full resolution dimensions: ${metadata.width}x${metadata.height}`);
					console.log(`📊 Processed data size: ${processedData.length} bytes`);
					
					// Create a canvas with the processed RAW data
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					
					if (!ctx) {
						throw new Error('Failed to get canvas context');
					}
					
					canvas.width = metadata.width;
					canvas.height = metadata.height;
					
					// libraw-wasm returns RGB data, convert to RGBA for ImageData
					const pixelCount = metadata.width * metadata.height;
					const rgbaData = new Uint8ClampedArray(pixelCount * 4);
					
					// Convert RGB to RGBA (following the example pattern)
					for (let i = 0; i < pixelCount; i++) {
						const rgbIndex = i * 3;
						const rgbaIndex = i * 4;
						
						rgbaData[rgbaIndex] = processedData[rgbIndex];         // R
						rgbaData[rgbaIndex + 1] = processedData[rgbIndex + 1]; // G
						rgbaData[rgbaIndex + 2] = processedData[rgbIndex + 2]; // B
						rgbaData[rgbaIndex + 3] = 255;                         // A (fully opaque)
					}
					
					// Create ImageData and put it on canvas
					const imageData = new ImageData(rgbaData, metadata.width, metadata.height);
					canvas.width = metadata.width;
					canvas.height = metadata.height;
					ctx.putImageData(imageData, 0, 0);
					
					// Create a blob URL from canvas (better for large images)
					return new Promise<string>((resolve, reject) => {
						canvas.toBlob((blob) => {
							if (blob) {
								const url = URL.createObjectURL(blob);
								
								// Update the image file with the full resolution URL
								update(state => ({
									...state,
									images: state.images.map(img => 
										img.path === imageFile.path 
											? { ...img, fullResolutionUrl: url }
											: img
									)
								}));
								
								console.log('🎯 Full resolution RAW processing complete - using blob URL');
								resolve(url);
							} else {
								reject(new Error('Failed to create blob from canvas'));
							}
						}, 'image/png'); // Use PNG for lossless quality
					});
				} catch (rawProcessingError) {
					console.warn('⚠️ libraw-wasm failed for full resolution, falling back to JPEG preview:', rawProcessingError);
					
					// FALLBACK: Use JPEG preview only if libraw-wasm fails
					const jpegPreview = await tryExtractJpegPreview(new Uint8Array(rawData));
					if (jpegPreview) {
						console.log('📸 Using JPEG preview as fallback for full resolution');
						const blob = new Blob([jpegPreview], { type: 'image/jpeg' });
						const url = URL.createObjectURL(blob);
						
						// Update the image file with the full resolution URL
						update(state => ({
							...state,
							images: state.images.map(img => 
								img.path === imageFile.path 
									? { ...img, fullResolutionUrl: url }
									: img
							)
						}));
						
						return url;
					} else {
						throw new Error('Both libraw-wasm and JPEG preview extraction failed');
					}
				}
			} catch (error) {
				console.error('❌ Failed to generate full resolution URL for RAW file:', error);
				console.log('🔄 Falling back to thumbnail for display');
				
				// Return thumbnail as fallback, but ensure it's a valid string
				const fallbackUrl = imageFile.thumbnail || '';
				if (!fallbackUrl) {
					console.error('❌ No thumbnail available as fallback');
					return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNDQ0Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPkVSUk9SPC90ZXh0Pgo8L3N2Zz4=';
				}
				return fallbackUrl;
			}
		},

		// Rating and flagging methods
		setImageRating: (imagePath: string, rating: number) => {
			const ratings = loadImageRatings();
			const existing = ratings.get(imagePath) || { rating: 0, flagged: false };
			ratings.set(imagePath, { ...existing, rating });
			saveImageRatings(ratings);

			update(state => {
				const updatedImages = state.images.map(img => 
					img.path === imagePath ? { ...img, rating } : img
				);
				return updateFilterState({ ...state, images: updatedImages });
			});
		},

		toggleImageFlag: (imagePath: string) => {
			const ratings = loadImageRatings();
			const existing = ratings.get(imagePath) || { rating: 0, flagged: false };
			const newFlagged = !existing.flagged;
			ratings.set(imagePath, { ...existing, flagged: newFlagged });
			saveImageRatings(ratings);

			update(state => {
				const updatedImages = state.images.map(img => 
					img.path === imagePath ? { ...img, flagged: newFlagged } : img
				);
				return updateFilterState({ ...state, images: updatedImages });
			});
		},

		// Filtering methods
		setStarFilter: (minRating: number) => {
			update(state => updateFilterState({
				...state,
				filterState: { ...state.filterState, minStarRating: minRating }
			}));
		},

		setFlagFilter: (showFlagged: boolean) => {
			update(state => updateFilterState({
				...state,
				filterState: { ...state.filterState, showFlagged }
			}));
		},

		clearFilters: () => {
			update(state => updateFilterState({
				...state,
				filterState: { minStarRating: 0, showFlagged: false, isActive: false }
			}));
		},

		// Getters
		get: () => get({ subscribe }),
		isSupported: () => isSupported
	};
}

export const folderStore = createFolderStore();

// Derived stores for easier component usage
export const hasSelectedFolder = derived(
	folderStore,
	($folderStore) => $folderStore.hasPermission && $folderStore.selectedFolders.length > 0
);

export const currentImages = derived(
	folderStore,
	($folderStore) => $folderStore.filteredImages
);

export const allImages = derived(
	folderStore,
	($folderStore) => $folderStore.images
);

export const filterState = derived(
	folderStore,
	($folderStore) => $folderStore.filterState
);

export const isLoadingImages = derived(
	folderStore,
	($folderStore) => $folderStore.isLoading
);

// Helper function to get store value
function get(store: any) {
	let value: any;
	store.subscribe((v: any) => value = v)();
	return value;
}
