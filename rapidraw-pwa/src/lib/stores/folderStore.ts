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
	path: string;
	lastModified: number;
	size: number;
}

interface FolderState {
	selectedFolders: FolderItem[];
	currentFolder: FolderItem | null;
	images: ImageFile[];
	isLoading: boolean;
	error: string | null;
	hasPermission: boolean;
}

const initialState: FolderState = {
	selectedFolders: [],
	currentFolder: null,
	images: [],
	isLoading: false,
	error: null,
	hasPermission: false
};

function createFolderStore() {
	const { subscribe, set, update } = writable<FolderState>(initialState);

	// Check if File System Access API is supported (SSR-safe)
	const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

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

				for await (const [name, handle] of (folder.handle as any).entries()) {
					if (handle.kind === 'file') {
						const file = await handle.getFile();
						
						// Check if it's an image file
						if (supportedTypes.includes(file.type) || 
							/\.(jpe?g|png|webp|tiff?|bmp|raw|arw|cr2|nef|dng)$/i.test(name)) {
							
							// Create thumbnail
							const thumbnail = await folderStore.createThumbnail(file);
							
							images.push({
								name,
								handle,
								path: `${folder.path}/${name}`,
								thumbnail,
								lastModified: file.lastModified,
								size: file.size
							});
						}
					}
				}

				// Sort images by name
				images.sort((a, b) => a.name.localeCompare(b.name));

				update(state => ({
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
	($folderStore) => $folderStore.images
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
