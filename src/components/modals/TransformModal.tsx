import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Check, 
  RotateCcw, 
  Grid3X3, 
  Eye,
  EyeOff,
  Info,
  LineChart,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import throttle from 'lodash.throttle';
import { Adjustments } from '../../utils/adjustments';
import clsx from 'clsx';

interface GeometryParams {
  distortion: number;
  vertical: number;
  horizontal: number;
  rotate: number;
  aspect: number;
  scale: number;
  x_offset: number;
  y_offset: number;
}

interface TransformModalProps {
  isOpen: boolean;
  onClose(): void;
  onApply(newParams: GeometryParams): void;
  currentAdjustments: Adjustments;
}

const DEFAULT_PARAMS: GeometryParams = {
  distortion: 0,
  vertical: 0,
  horizontal: 0,
  rotate: 0,
  aspect: 0,
  scale: 100,
  x_offset: 0,
  y_offset: 0,
};

export default function TransformModal({ isOpen, onClose, onApply, currentAdjustments }: TransformModalProps) {
  const [params, setParams] = useState<GeometryParams>(DEFAULT_PARAMS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLines, setShowLines] = useState(false);
  const [isCompareActive, setIsCompareActive] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  const [show, setShow] = useState(false);

  const updatePreview = useCallback(
    throttle(async (currentParams: GeometryParams, linesEnabled: boolean) => {
      try {
        const result: string = await invoke('preview_geometry_transform', { 
            params: currentParams,
            jsAdjustments: currentAdjustments,
            showLines: linesEnabled,
        });
        setPreviewUrl(result);
      } catch (e) {
        console.error("Preview transform failed", e);
      }
    }, 30),
    [currentAdjustments]
  );
  
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => setShow(true), 10);
      
      const initParams = {
        distortion: currentAdjustments.transformDistortion ?? 0,
        vertical: currentAdjustments.transformVertical ?? 0,
        horizontal: currentAdjustments.transformHorizontal ?? 0,
        rotate: currentAdjustments.transformRotate ?? 0,
        aspect: currentAdjustments.transformAspect ?? 0,
        scale: currentAdjustments.transformScale ?? 100,
        x_offset: currentAdjustments.transformXOffset ?? 0,
        y_offset: currentAdjustments.transformYOffset ?? 0,
      };
      setParams(initParams);
      setShowLines(false);
      updatePreview(initParams, false);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setPreviewUrl(null);
        setIsApplying(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentAdjustments, updatePreview]);


  const handleChange = (key: keyof GeometryParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    updatePreview(newParams, showLines);
  };

  const handleApply = () => {
    setIsApplying(true);
    try {
      onApply(params);
      onClose();
    } catch (e) {
      console.error("Failed to apply transform", e);
      setIsApplying(false);
    }
  };

  const handleReset = () => {
      setParams(DEFAULT_PARAMS);
      updatePreview(DEFAULT_PARAMS, showLines);
  };

  const handleShowLinesToggle = () => {
    const newShowLines = !showLines;
    setShowLines(newShowLines);
    updatePreview(params, newShowLines);
  };

  const toggleCompare = async (active: boolean) => {
      setIsCompareActive(active);
      if (active) {
          const result: string = await invoke('preview_geometry_transform', { 
            params: DEFAULT_PARAMS,
            jsAdjustments: currentAdjustments,
            showLines: false,
        });
        setPreviewUrl(result);
      } else {
          updatePreview(params, showLines);
      }
  };

  const renderControls = () => (
    <div className="w-80 flex-shrink-0 bg-bg-secondary flex flex-col border-l border-surface h-full">
        <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface">
            <h2 className="text-xl font-bold text-primary text-shadow-shiny">Transform</h2>
            <button 
                onClick={handleReset} 
                title="Reset All" 
                className="p-2 rounded-full hover:bg-surface transition-colors"
            >
              <RotateCcw size={18} />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-6 text-text-secondary">
            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Distortion</p>
                <Slider 
                    label="Amount" 
                    value={params.distortion} 
                    min={-100} max={100} 
                    defaultValue={0}
                    onChange={(e) => handleChange('distortion', Number(e.target.value))} 
                />
            </div>

            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Perspective</p>
                <Slider 
                    label="Vertical" 
                    value={params.vertical} 
                    min={-100} max={100} 
                    defaultValue={0}
                    onChange={(e) => handleChange('vertical', Number(e.target.value))} 
                />
                <Slider 
                    label="Horizontal" 
                    value={params.horizontal} 
                    min={-100} max={100} 
                    defaultValue={0}
                    onChange={(e) => handleChange('horizontal', Number(e.target.value))} 
                />
            </div>

            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Transform</p>
                <Slider 
                    label="Rotate" 
                    value={params.rotate} 
                    min={-45} max={45} step={0.1}
                    defaultValue={0}
                    onChange={(e) => handleChange('rotate', Number(e.target.value))} 
                />
                <Slider 
                    label="Aspect" 
                    value={params.aspect} 
                    min={-100} max={100} 
                    defaultValue={0}
                    onChange={(e) => handleChange('aspect', Number(e.target.value))} 
                />
                <Slider 
                    label="Scale" 
                    value={params.scale} 
                    min={50} max={150} 
                    defaultValue={100}
                    onChange={(e) => handleChange('scale', Number(e.target.value))} 
                />
            </div>

            <div className="space-y-3">
                <p className="text-sm font-semibold text-text-primary">Offset</p>
                <Slider 
                    label="X Axis" 
                    value={params.x_offset} 
                    min={-100} max={100} 
                    defaultValue={0}
                    onChange={(e) => handleChange('x_offset', Number(e.target.value))} 
                />
                <Slider 
                    label="Y Axis" 
                    value={params.y_offset} 
                    min={-100} max={100} 
                    defaultValue={0}
                    onChange={(e) => handleChange('y_offset', Number(e.target.value))} 
                />
            </div>

            <div className="mt-auto pt-4">
                 <div className="p-3 bg-surface rounded-md border border-surface flex gap-3">
                    <Info size={16} className="text-text-secondary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                        Transforming updates base geometry. Existing masks may shift, and AI edits/masks must be regenerated.
                    </p>
                 </div>
            </div>
        </div>
    </div>
  );

  const renderContent = () => (
      <div className="flex flex-row h-full w-full">
         <div className="flex-grow flex items-center justify-center p-4 relative min-h-0 bg-[#0f0f0f] overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
                    backgroundSize: '24px 24px' 
                }}>
            </div>

            {previewUrl && (
                 <div className="relative max-w-full max-h-full">
                    <img 
                        src={previewUrl} 
                        className="max-w-full max-h-full object-contain shadow-2xl ring-1 ring-white/10" 
                        alt="Transform Preview" 
                    />
                    
                     {showGrid && !isCompareActive && (
                        <div className="absolute inset-0 border border-white/40 pointer-events-none shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                            <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30"></div>
                            <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/30"></div>
                        </div>
                    )}
                    
                    {isCompareActive && (
                        <div className="absolute top-4 left-4 bg-accent text-button-text text-xs px-2 py-1 rounded shadow-lg">
                            ORIGINAL
                        </div>
                    )}
                 </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-xl z-20">
                <button 
                    onClick={() => setShowGrid(!showGrid)}
                    className={clsx(
                        "p-2 rounded-full transition-colors",
                        showGrid ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                    title="Toggle Grid"
                >
                    <Grid3X3 size={18} />
                </button>
                 <button 
                    onClick={handleShowLinesToggle}
                    className={clsx(
                        "p-2 rounded-full transition-colors",
                        showLines ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                    title="Toggle Helper Lines"
                >
                    <LineChart size={18} />
                </button>
                <div className="w-px bg-white/20 mx-1 my-1"></div>
                <button 
                    onMouseDown={() => toggleCompare(true)}
                    onMouseUp={() => toggleCompare(false)}
                    onMouseLeave={() => toggleCompare(false)}
                    className={clsx(
                        "p-2 rounded-full transition-colors select-none",
                        isCompareActive ? "bg-accent text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                    title="Hold to Compare"
                >
                    {isCompareActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
            </div>

         </div>
         {renderControls()}
      </div>
  );

  if (!isMounted) return null;

  return (
    <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onMouseDown={onClose}
    >
      <AnimatePresence>
        {show && (
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-surface rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex-grow min-h-0 overflow-hidden">{renderContent()}</div>
                <div className="flex-shrink-0 p-4 flex justify-end gap-3 border-t border-surface bg-bg-secondary">
                     <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-text-secondary hover:bg-surface transition-colors"
                    >
                        Cancel
                    </button>
                    <Button 
                        onClick={handleApply} 
                        disabled={isApplying || !previewUrl}
                    >
                        <Check className="mr-2" size={16} />
                        Apply
                    </Button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}