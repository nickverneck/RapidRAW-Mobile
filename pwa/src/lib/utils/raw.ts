export const RAW_EXTENSIONS = new Set([
	'dng',
	'pro',
	'ari',
	'crw',
	'cr2',
	'cr3',
	'bay',
	'raw',
	'erf',
	'raf',
	'3fr',
	'fff',
	'iiq',
	'kdc',
	'k25',
	'dcs',
	'dcr',
	'mos',
	'rwl',
	'mef',
	'mrw',
	'nef',
	'nrw',
	'orf',
	'rw2',
	'pef',
	'ptx',
	'srw',
	'x3f',
	'arw',
	'srf',
	'sr2'
]);

export function getExtension(name: string): string {
	return name.split('.').pop()?.toLowerCase() ?? '';
}

export function isRawFile(name: string): boolean {
	return RAW_EXTENSIONS.has(getExtension(name));
}
