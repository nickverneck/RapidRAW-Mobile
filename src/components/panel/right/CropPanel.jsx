import { RotateCcw, X, RectangleHorizontal, RectangleVertical, FlipHorizontal, FlipVertical, RotateCw, Ruler } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_ADJUSTMENTS } from '../../../utils/adjustments';
import clsx from 'clsx';

const PRESETS = [
  { name: 'Free', value: null },
  { name: 'Original', value: 'original' },
  { name: '1:1', value: 1 },
  { name: '5:4', value: 5 / 4 },
  { name: '4:3', value: 4 / 3 },
  { name: '3:2', value: 3 / 2 },
  { name: '16:9', value: 16 / 9 },
];

export default function CropPanel({ selectedImage, adjustments, setAdjustments, isStraightenActive, setIsStraightenActive }) {
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');

  const { aspectRatio, rotation = 0, flipHorizontal = false, flipVertical = false, orientationSteps = 0 } = adjustments;

  const getEffectiveOriginalRatio = useCallback(() => {
    if (!selectedImage?.width || !selectedImage?.height) return null;
    const isSwapped = orientationSteps === 1 || orientationSteps === 3;
    const W = isSwapped ? selectedImage.height : selectedImage.width;
    const H = isSwapped ? selectedImage.width : selectedImage.height;
    return W > 0 && H > 0 ? W / H : null;
  }, [selectedImage, orientationSteps]);

  const activePreset = useMemo(() => {
    if (aspectRatio === null) return PRESETS.find(p => p.value === null);

    const numericPresetMatch = PRESETS.find(p =>
      typeof p.value === 'number' &&
      (Math.abs(aspectRatio - p.value) < 0.001 || Math.abs(aspectRatio - (1 / p.value)) < 0.001)
    );
    if (numericPresetMatch) return numericPresetMatch;

    const originalRatio = getEffectiveOriginalRatio();
    if (originalRatio && Math.abs(aspectRatio - originalRatio) < 0.001) {
      return PRESETS.find(p => p.value === 'original');
    }

    return null;
  }, [aspectRatio, getEffectiveOriginalRatio]);

  let orientation = 'horizontal';
  if (activePreset && activePreset.value && activePreset.value !== 1) {
    let baseRatio = activePreset.value;
    if (activePreset.value === 'original') {
      baseRatio = getEffectiveOriginalRatio();
    }
    if (baseRatio && Math.abs(aspectRatio - baseRatio) > 0.001) {
      orientation = 'vertical';
    }
  }

  const isCustomActive = aspectRatio !== null && !activePreset;

  useEffect(() => {
    if (activePreset?.value === 'original') {
      const newOriginalRatio = getEffectiveOriginalRatio();
      if (newOriginalRatio !== null && Math.abs(aspectRatio - newOriginalRatio) > 0.001) {
        setAdjustments(prev => ({ ...prev, aspectRatio: newOriginalRatio, crop: null }));
      }
    }
  }, [orientationSteps, activePreset, aspectRatio, getEffectiveOriginalRatio, setAdjustments]);

  useEffect(() => {
    if (isCustomActive && aspectRatio) {
      const w = Math.abs(aspectRatio * 100).toFixed(1);
      const h = (100).toFixed(1);
      setCustomW(w);
      setCustomH(h);
    } else {
      setCustomW('');
      setCustomH('');
    }
  }, [isCustomActive, aspectRatio]);

  const handleCustomInputChange = (w, h) => {
    setCustomW(w);
    setCustomH(h);
    const numW = parseFloat(w);
    const numH = parseFloat(h);
    if (numW > 0 && numH > 0) {
      const newAspectRatio = numW / numH;
      if (aspectRatio !== newAspectRatio) {
        setAdjustments(prev => ({ ...prev, aspectRatio: newAspectRatio, crop: null }));
      }
    }
  };

  const handlePresetClick = (preset) => {
    if (preset.value === 'original') {
      setAdjustments(prev => ({ ...prev, aspectRatio: getEffectiveOriginalRatio(), crop: null }));
      return;
    }

    let targetRatio = preset.value;

    if (activePreset === preset && targetRatio && targetRatio !== 1) {
      setAdjustments(prev => ({
        ...prev,
        aspectRatio: 1 / prev.aspectRatio,
        crop: null,
      }));
      return;
    }

    const imageRatio = getEffectiveOriginalRatio();
    let newAspectRatio = targetRatio;

    if (targetRatio && imageRatio && imageRatio < 1 && targetRatio > 1) {
      newAspectRatio = 1 / targetRatio;
    }

    setAdjustments(prev => ({ ...prev, aspectRatio: newAspectRatio, crop: null }));
  };

  const handleOrientationToggle = useCallback(() => {
    if (aspectRatio && aspectRatio !== 1) {
      setAdjustments(prev => ({
        ...prev,
        aspectRatio: 1 / prev.aspectRatio,
        crop: null
      }));
    }
  }, [aspectRatio, setAdjustments]);

  const handleReset = () => {
    const originalAspectRatio = selectedImage?.width && selectedImage?.height
      ? selectedImage.width / selectedImage.height
      : null;

    setAdjustments(prev => ({
      ...prev,
      crop: INITIAL_ADJUSTMENTS.crop,
      aspectRatio: originalAspectRatio,
      rotation: INITIAL_ADJUSTMENTS.rotation || 0,
      orientationSteps: INITIAL_ADJUSTMENTS.orientationSteps || 0,
      flipHorizontal: INITIAL_ADJUSTMENTS.flipHorizontal || false,
      flipVertical: INITIAL_ADJUSTMENTS.flipVertical || false,
    }));
  };

  const isPresetActive = (preset) => preset === activePreset;
  const isOrientationToggleDisabled = !aspectRatio || aspectRatio === 1 || activePreset?.value === 'original';

  const fineRotation = useMemo(() => {
    return rotation || 0;
  }, [rotation]);

  const handleFineRotationChange = (e) => {
    const newFineRotation = parseFloat(e.target.value);
    setAdjustments(prev => ({ ...prev, rotation: newFineRotation }));
  };

  const handleStepRotate = (degrees) => {
    const increment = degrees > 0 ? 1 : 3;
    setAdjustments(prev => {
      const newAspectRatio = (prev.aspectRatio && prev.aspectRatio !== 0) ? 1 / prev.aspectRatio : null;
      return {
        ...prev,
        aspectRatio: newAspectRatio,
        orientationSteps: ((prev.orientationSteps || 0) + increment) % 4,
        rotation: 0,
        crop: null,
      };
    });
  };

  const resetFineRotation = () => {
    setAdjustments(prev => ({ ...prev, rotation: 0 }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface">
        <h2 className="text-xl font-bold text-primary text-shadow-shiny">Crop & Transform</h2>
        <button
          onClick={handleReset}
          className="p-2 rounded-full hover:bg-surface transition-colors"
          title="Reset All"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 text-text-secondary space-y-6">
        {selectedImage ? (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm mb-3 font-semibold text-text-primary">Aspect Ratio</p>
                <button
                  onClick={handleOrientationToggle}
                  className="p-1.5 rounded-md hover:bg-surface disabled:text-text-tertiary disabled:cursor-not-allowed"
                  title="Switch Orientation"
                  disabled={isOrientationToggleDisabled}
                >
                  {orientation === 'vertical' ? <RectangleVertical size={16} /> : <RectangleHorizontal size={16} />}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset)}
                    className={clsx('px-2 py-1.5 text-sm rounded-md transition-colors',
                      isPresetActive(preset) ? 'bg-surface text-text-primary' : 'bg-surface hover:bg-card-active'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    const baseRatio = 1.618;
                    const newAspectRatio = orientation === 'vertical' ? 1 / baseRatio : baseRatio;
                    setAdjustments(prev => ({ ...prev, aspectRatio: newAspectRatio, crop: null }))
                  }}
                  className={clsx('w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                    isCustomActive ? 'bg-accent text-white' : 'bg-surface hover:bg-card-active'
                  )}
                >
                  Custom
                </button>
                <div className={clsx('mt-2 bg-surface p-2 rounded-md transition-opacity', isCustomActive ? 'opacity-100' : 'opacity-50 pointer-events-none')}>
                  <div className="flex items-center justify-center gap-2">
                    <input type="number" placeholder="W" value={customW} onChange={(e) => handleCustomInputChange(e.target.value, customH)} className="w-full bg-bg-primary text-center rounded-md p-1 border border-surface focus:border-accent focus:ring-accent" min="1" />
                    <X size={16} className="text-text-tertiary flex-shrink-0" />
                    <input type="number" placeholder="H" value={customH} onChange={(e) => handleCustomInputChange(customW, e.target.value)} className="w-full bg-bg-primary text-center rounded-md p-1 border border-surface focus:border-accent focus:ring-accent" min="1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm mb-3 font-semibold text-text-primary">Rotation</p>
              <div className="flex justify-between items-center">
                <span className="font-mono text-lg text-text-primary">{rotation.toFixed(1)}°</span>
                <button onClick={resetFineRotation} title="Reset Fine Rotation" className="p-1.5 rounded-full hover:bg-surface">
                  <RotateCcw size={14} />
                </button>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="0.1"
                value={fineRotation}
                onChange={handleFineRotationChange}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm mb-3 font-semibold text-text-primary">Tools</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleStepRotate(-90)} className="flex flex-col items-center justify-center p-3 rounded-lg transition-colors bg-surface text-text-secondary hover:bg-card-active hover:text-text-primary">
                  <RotateCcw size={20} className="transition-none" />
                  <span className="text-xs mt-1.5 transition-none">Rotate Left</span>
                </button>
                <button onClick={() => handleStepRotate(90)} className="flex flex-col items-center justify-center p-3 rounded-lg transition-colors bg-surface text-text-secondary hover:bg-card-active hover:text-text-primary">
                  <RotateCw size={20} className="transition-none" />
                  <span className="text-xs mt-1.5 transition-none">Rotate Right</span>
                </button>
                <button onClick={() => setAdjustments(prev => ({ ...prev, flipHorizontal: !prev.flipHorizontal, crop: null }))} className={clsx('flex flex-col items-center justify-center p-3 rounded-lg transition-colors', flipHorizontal ? 'bg-accent text-button-text' : 'bg-surface text-text-secondary hover:bg-card-active hover:text-text-primary')}>
                  <FlipHorizontal size={20} className="transition-none" />
                  <span className="text-xs mt-1.5 transition-none">Flip Horiz</span>
                </button>
                <button onClick={() => setAdjustments(prev => ({ ...prev, flipVertical: !prev.flipVertical }))} className={clsx('flex flex-col items-center justify-center p-3 rounded-lg transition-colors', flipVertical ? 'bg-accent text-button-text' : 'bg-surface text-text-secondary hover:bg-card-active hover:text-text-primary')}>
                  <FlipVertical size={20} className="transition-none" />
                  <span className="text-xs mt-1.5 transition-none">Flip Vert</span>
                </button>
                <button
                  onClick={() => {
                    setIsStraightenActive(s => {
                      const willBeActive = !s;
                      if (willBeActive) {
                        setAdjustments(prev => ({ ...prev, rotation: 0 }));
                      }
                      return willBeActive;
                    });
                  }}
                  className={clsx(
                    'flex flex-col items-center justify-center p-3 rounded-lg transition-colors group',
                    isStraightenActive
                      ? 'bg-accent text-button-text hover:bg-red-500'
                      : 'bg-surface text-text-secondary hover:bg-card-active hover:text-text-primary'
                  )}
                >
                  <Ruler size={20} className="transition-none" />
                  <span className="relative text-xs mt-1.5 h-4 flex items-center justify-center transition-none">
                    <span className={clsx('transition-none', isStraightenActive && 'group-hover:opacity-0')}>
                      Straighten
                    </span>
                    <span className={clsx('absolute left-0 right-0 text-center opacity-0 transition-none', isStraightenActive && 'group-hover:opacity-100')}>
                      Cancel
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-text-tertiary mt-4">No image selected.</p>
        )}
      </div>
    </div>
  );
}