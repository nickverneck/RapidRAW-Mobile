export type Adjustments = {
	exposure: number;
	contrast: number;
	highlights: number;
	shadows: number;
	temperature: number;
	tint: number;
	vibrance: number;
	saturation: number;
	clarity: number;
	sharpness: number;
	vignette: number;
};

export const DEFAULT_ADJUSTMENTS: Adjustments = {
	exposure: 0,
	contrast: 0,
	highlights: 0,
	shadows: 0,
	temperature: 0,
	tint: 0,
	vibrance: 0,
	saturation: 0,
	clarity: 0,
	sharpness: 0,
	vignette: 0
};

export type CropState = {
	aspect: string;
	rotate: number;
	straighten: number;
};

export const DEFAULT_CROP_STATE: CropState = {
	aspect: 'Original',
	rotate: 0,
	straighten: 0
};

export type MaskSettings = {
	tool: 'brush' | 'eraser';
	size: number;
	feather: number;
	opacity: number;
};

export const DEFAULT_MASK_SETTINGS: MaskSettings = {
	tool: 'brush',
	size: 32,
	feather: 24,
	opacity: 0.85
};

export type ExportSettings = {
	format: 'jpg' | 'png' | 'tiff';
	quality: number;
	maxEdge: number;
	includeMetadata: boolean;
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
	format: 'jpg',
	quality: 90,
	maxEdge: 4096,
	includeMetadata: true
};
