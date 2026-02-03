export type PanelId =
	| 'metadata'
	| 'adjustments'
	| 'crop'
	| 'masks'
	| 'presets'
	| 'ai'
	| 'export';

export const PANEL_OPTIONS: Array<{ id: PanelId; label: string }> = [
	{ id: 'metadata', label: 'Metadata' },
	{ id: 'adjustments', label: 'Adjust' },
	{ id: 'crop', label: 'Crop' },
	{ id: 'masks', label: 'Masks' },
	{ id: 'presets', label: 'Presets' },
	{ id: 'ai', label: 'AI Tools' },
	{ id: 'export', label: 'Export' }
];
