export type ImageStatus = 'pending' | 'loading' | 'ready' | 'error';

export type LibraryImage = {
	id: string;
	name: string;
	handle: FileSystemFileHandle;
	size: number;
	lastModified: number;
	status: ImageStatus;
	thumbUrl?: string;
	error?: string;
};
