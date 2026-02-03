// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface FileSystemFileHandle {
		kind: 'file';
		name: string;
		getFile(): Promise<File>;
	}

	interface FileSystemDirectoryHandle {
		kind: 'directory';
		name: string;
		values(): AsyncIterable<FileSystemHandle>;
	}

	type FileSystemHandle = FileSystemFileHandle | FileSystemDirectoryHandle;

	interface Window {
		showDirectoryPicker?: (options?: any) => Promise<FileSystemDirectoryHandle>;
	}
}

export {};
