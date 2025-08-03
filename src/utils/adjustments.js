import { v4 as uuidv4 } from 'uuid';

const INITIAL_COLOR_GRADING = {
  shadows: { h: 0, s: 0, lum: 0 },
  midtones: { h: 0, s: 0, lum: 0 },
  highlights: { h: 0, s: 0, lum: 0 },
  blending: 50,
  balance: 0,
};

export const INITIAL_MASK_ADJUSTMENTS = {
  exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  saturation: 0, temperature: 0, tint: 0, vibrance: 0,
  sharpness: 0, lumaNoiseReduction: 0, colorNoiseReduction: 0,
  clarity: 0, dehaze: 0, structure: 0,
  colorGrading: { ...INITIAL_COLOR_GRADING },
  hsl: {
    reds: { hue: 0, saturation: 0, luminance: 0 }, oranges: { hue: 0, saturation: 0, luminance: 0 },
    yellows: { hue: 0, saturation: 0, luminance: 0 }, greens: { hue: 0, saturation: 0, luminance: 0 },
    aquas: { hue: 0, saturation: 0, luminance: 0 }, blues: { hue: 0, saturation: 0, luminance: 0 },
    purples: { hue: 0, saturation: 0, luminance: 0 }, magentas: { hue: 0, saturation: 0, luminance: 0 },
  },
  curves: {
    luma: [{ x: 0, y: 0 }, { x: 255, y: 255 }], red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    green: [{ x: 0, y: 0 }, { x: 255, y: 255 }], blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  },
  sectionVisibility: {
    basic: true,
    curves: true,
    color: true,
    details: true,
    effects: true,
  },
};

export const INITIAL_MASK_CONTAINER = {
  name: 'New Mask',
  visible: true,
  invert: false,
  opacity: 100,
  adjustments: INITIAL_MASK_ADJUSTMENTS,
  subMasks: [],
};

export const INITIAL_ADJUSTMENTS = {
  rating: 0,
  exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  saturation: 0, temperature: 0, tint: 0, vibrance: 0,
  sharpness: 0, lumaNoiseReduction: 0, colorNoiseReduction: 0,
  clarity: 0, dehaze: 0, structure: 0,
  vignetteAmount: 0, vignetteMidpoint: 50, vignetteRoundness: 0, vignetteFeather: 50,
  grainAmount: 0, grainSize: 25, grainRoughness: 50,
  enableNegativeConversion: false,
  filmBaseColor: '#ff8800',
  negativeRedBalance: 0,
  negativeGreenBalance: 0,
  negativeBlueBalance: 0,
  colorGrading: { ...INITIAL_COLOR_GRADING },
  hsl: {
    reds: { hue: 0, saturation: 0, luminance: 0 }, oranges: { hue: 0, saturation: 0, luminance: 0 },
    yellows: { hue: 0, saturation: 0, luminance: 0 }, greens: { hue: 0, saturation: 0, luminance: 0 },
    aquas: { hue: 0, saturation: 0, luminance: 0 }, blues: { hue: 0, saturation: 0, luminance: 0 },
    purples: { hue: 0, saturation: 0, luminance: 0 }, magentas: { hue: 0, saturation: 0, luminance: 0 },
  },
  curves: {
    luma: [{ x: 0, y: 0 }, { x: 255, y: 255 }], red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    green: [{ x: 0, y: 0 }, { x: 255, y: 255 }], blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  },
  crop: null, aspectRatio: null, rotation: 0, flipHorizontal: false, flipVertical: false, orientationSteps: 0,
  masks: [],
  aiPatches: [],
  sectionVisibility: {
    basic: true,
    curves: true,
    color: true,
    details: true,
    effects: true,
  },
};

export const normalizeLoadedAdjustments = (loadedAdjustments) => {
  if (!loadedAdjustments) return INITIAL_ADJUSTMENTS;

  const normalizedMasks = (loadedAdjustments.masks || []).map(maskContainer => {
    const containerAdjustments = maskContainer.adjustments || {};
    const normalizedSubMasks = (maskContainer.subMasks || []).map(subMask => ({
      visible: true,
      mode: 'additive',
      ...subMask,
    }));

    return {
      ...INITIAL_MASK_CONTAINER,
      id: maskContainer.id || uuidv4(),
      ...maskContainer,
      adjustments: {
        ...INITIAL_MASK_ADJUSTMENTS,
        ...containerAdjustments,
        colorGrading: { ...INITIAL_MASK_ADJUSTMENTS.colorGrading, ...(containerAdjustments.colorGrading || {}) },
        hsl: { ...INITIAL_MASK_ADJUSTMENTS.hsl, ...(containerAdjustments.hsl || {}) },
        curves: { ...INITIAL_MASK_ADJUSTMENTS.curves, ...(containerAdjustments.curves || {}) },
        sectionVisibility: {
          ...INITIAL_MASK_ADJUSTMENTS.sectionVisibility,
          ...(containerAdjustments.sectionVisibility || {})
        },
      },
      subMasks: normalizedSubMasks,
    };
  });

  const normalizedAiPatches = (loadedAdjustments.aiPatches || []).map(patch => ({
    visible: true,
    ...patch,
  }));

  return {
    ...INITIAL_ADJUSTMENTS,
    ...loadedAdjustments,
    colorGrading: { ...INITIAL_ADJUSTMENTS.colorGrading, ...(loadedAdjustments.colorGrading || {}) },
    hsl: { ...INITIAL_ADJUSTMENTS.hsl, ...(loadedAdjustments.hsl || {}) },
    curves: { ...INITIAL_ADJUSTMENTS.curves, ...(loadedAdjustments.curves || {}) },
    masks: normalizedMasks,
    aiPatches: normalizedAiPatches,
    sectionVisibility: {
      ...INITIAL_ADJUSTMENTS.sectionVisibility,
      ...(loadedAdjustments.sectionVisibility || {})
    },
  };
};

export const COPYABLE_ADJUSTMENT_KEYS = [
  'exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks',
  'saturation', 'temperature', 'tint', 'vibrance',
  'sharpness', 'lumaNoiseReduction', 'colorNoiseReduction',
  'clarity', 'dehaze', 'structure',
  'vignetteAmount', 'vignetteMidpoint', 'vignetteRoundness', 'vignetteFeather',
  'grainAmount', 'grainSize', 'grainRoughness',
  'enableNegativeConversion', 'filmBaseColor', 'negativeRedBalance', 'negativeGreenBalance', 'negativeBlueBalance',
  'hsl', 'curves', 'colorGrading', 'sectionVisibility',
];

export const ADJUSTMENT_SECTIONS = {
  basic: ['exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks'],
  curves: ['curves'],
  color: ['saturation', 'temperature', 'tint', 'vibrance', 'hsl', 'colorGrading'],
  details: ['sharpness', 'lumaNoiseReduction', 'colorNoiseReduction'],
  effects: [
    'clarity', 'dehaze', 'structure',
    'vignetteAmount', 'vignetteMidpoint', 'vignetteRoundness', 'vignetteFeather',
    'grainAmount', 'grainSize', 'grainRoughness',
    'enableNegativeConversion', 'filmBaseColor', 'negativeRedBalance', 'negativeGreenBalance', 'negativeBlueBalance'
  ],
};