import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Circle, TriangleRight, Brush, Sparkles, User,
  Trash2, Eye, EyeOff, Plus, Minus, Loader2, Send
} from 'lucide-react';

import CollapsibleSection from '../../ui/CollapsibleSection';
import Switch from '../../ui/Switch';
import Slider from '../../ui/Slider';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { useContextMenu } from '../../../context/ContextMenuContext';

const MASK_TYPES = [
  { id: 'ai-subject', name: 'Subject', icon: Sparkles, type: 'ai-subject', disabled: false },
  { id: 'ai-foreground', name: 'Foreground', icon: User, type: 'ai-foreground', disabled: false },
  { id: 'brush', name: 'Brush', icon: Brush, type: 'brush', disabled: false },
  { id: 'linear', name: 'Linear', icon: TriangleRight, type: 'linear', disabled: false },
  { id: 'radial', name: 'Radial', icon: Circle, type: 'radial', disabled: false },
];

function formatMaskTypeName(type) {
  if (type === 'ai-subject') return 'AI Subject';
  if (type === 'ai-foreground') return 'AI Foreground';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const SUB_MASK_CONFIG = {
  radial: { parameters: [{ key: 'feather', label: 'Feather', min: 0, max: 100, step: 1, multiplier: 100, defaultValue: 50 }] },
  brush: { showBrushTools: true },
  linear: { parameters: [] },
  'ai-subject': { parameters: [] },
  'ai-foreground': { parameters: [] },
};

const BrushTools = ({ settings, onSettingsChange }) => (
  <div className="space-y-4 pt-4 border-t border-surface mt-4">
    <Slider label="Brush Size" value={settings.size} onChange={(e) => onSettingsChange(s => ({ ...s, size: Number(e.target.value) }))} min="1" max="200" step="1" defaultValue="100" />
    <Slider label="Brush Feather" value={settings.feather} onChange={(e) => onSettingsChange(s => ({ ...s, feather: Number(e.target.value) }))} min="0" max="100" step="1" defaultValue="50" />
    <div className="grid grid-cols-2 gap-2 pt-2">
      <button onClick={() => onSettingsChange(s => ({ ...s, tool: 'brush' }))} className={`p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${settings.tool === 'brush' ? 'text-primary bg-surface' : 'bg-surface text-text-secondary hover:bg-card-active'}`}>Add</button>
      <button onClick={() => onSettingsChange(s => ({ ...s, tool: 'eraser' }))} className={`p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${settings.tool === 'eraser' ? 'text-primary bg-surface' : 'bg-surface text-text-secondary hover:bg-card-active'}`}>Erase</button>
    </div>
  </div>
);

export default function AIControls({
  editingPatch,
  activeSubMask,
  updatePatch,
  updateSubMask,
  brushSettings,
  setBrushSettings,
  isGeneratingAi,
  isGeneratingAiMask,
  aiModelDownloadStatus,
  setAdjustments,
  selectedImage,
  onSelectSubMask,
  activeSubMaskId,
  onGenerateAiForegroundMask,
  onGenerativeReplace,
}) {
  const { showContextMenu } = useContextMenu();
  const [isSettingsSectionOpen, setSettingsSectionOpen] = useState(true);
  const [showAnalyzingMessage, setShowAnalyzingMessage] = useState(false);
  const analyzingTimeoutRef = useRef(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [prompt, setPrompt] = useState(editingPatch?.prompt || '');

  useEffect(() => {
    setPrompt(editingPatch?.prompt || '');
  }, [editingPatch?.id, editingPatch?.prompt]);

  useEffect(() => {
    if (isGeneratingAiMask) {
      analyzingTimeoutRef.current = setTimeout(() => setShowAnalyzingMessage(true), 1000);
    } else {
      if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
      setShowAnalyzingMessage(false);
    }
    return () => { if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current); };
  }, [isGeneratingAiMask]);

  const createSubMask = (type) => {
    const { width, height } = selectedImage;
    const common = { id: uuidv4(), visible: true, mode: 'additive', type };
    switch (type) {
      case 'radial': return { ...common, parameters: { centerX: width / 2, centerY: height / 2, radiusX: width / 4, radiusY: width / 4, rotation: 0, feather: 0.5 } };
      case 'linear': return { ...common, parameters: { startX: width * 0.25, startY: height / 2, endX: width * 0.75, endY: height / 2, range: 50 } };
      case 'brush': return { ...common, parameters: { lines: [] } };
      case 'ai-subject': return { ...common, parameters: { startX: 0, startY: 0, endX: 0, endY: 0, maskDataBase64: null } };
      case 'ai-foreground': return { ...common, parameters: { maskDataBase64: null } };
      default: return { ...common, parameters: {} };
    }
  };

  const handleAddSubMask = (containerId, type) => {
    const subMask = createSubMask(type);
    setAdjustments(prev => ({
      ...prev,
      aiPatches: prev.aiPatches.map(p =>
        p.id === containerId ? { ...p, subMasks: [...p.subMasks, subMask] } : p
      )
    }));
    onSelectSubMask(subMask.id);
    if (type === 'ai-foreground') {
      onGenerateAiForegroundMask(subMask.id);
    }
  };

  const handleDeleteSubMask = (containerId, subMaskId) => {
    setDeletingItemId(subMaskId);
    setTimeout(() => {
      if (activeSubMaskId === subMaskId) onSelectSubMask(null);
      setAdjustments(prev => ({
        ...prev,
        aiPatches: prev.aiPatches.map(p =>
          p.id === containerId ? { ...p, subMasks: p.subMasks.filter(sm => sm.id !== subMaskId) } : p
        )
      }));
      setDeletingItemId(null);
    }, 200);
  };

  const handleDeselectSubMask = () => onSelectSubMask(null);

  const handleSubMaskContextMenu = (event, subMask) => {
    event.preventDefault();
    event.stopPropagation();
    const options = [
      {
        label: 'Delete Component',
        icon: Trash2,
        isDestructive: true,
        onClick: () => handleDeleteSubMask(editingPatch.id, subMask.id)
      },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const handleGenerateClick = () => {
    onGenerativeReplace(editingPatch.id, prompt);
  };

  if (!editingPatch) return null;

  const subMaskConfig = activeSubMask ? SUB_MASK_CONFIG[activeSubMask.type] || {} : {};

  const handleSubMaskParameterChange = (key, value) => {
    if (!activeSubMask) return;
    updateSubMask(activeSubMask.id, { parameters: { ...activeSubMask.parameters, [key]: value } });
  };

  const handlePatchPropertyChange = (key, value) => updatePatch(editingPatch.id, { [key]: value });

  const isAiMask = activeSubMask && (activeSubMask.type === 'ai-subject' || activeSubMask.type === 'ai-foreground');

  return (
    <>
      <div className="p-4 border-b border-surface">
        <p className="text-sm mb-3 font-semibold text-text-primary">Add Component to Selection</p>
        <div className="grid grid-cols-3 gap-2">
          {MASK_TYPES.map(maskType => (
            <button
              key={maskType.id}
              onClick={() => handleAddSubMask(editingPatch.id, maskType.type)}
              disabled={maskType.disabled || isGeneratingAiMask || isGeneratingAi}
              className={`bg-surface text-text-primary rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 aspect-square transition-colors ${maskType.disabled || isGeneratingAiMask || isGeneratingAi ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card-active'}`}
              title={`Add ${maskType.name} component`}
            >
              <maskType.icon size={24} />
              <span className="text-xs">{maskType.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2" onClick={handleDeselectSubMask}>
        <p className="text-sm mb-3 font-semibold text-text-primary">Selection Components</p>
        {editingPatch.subMasks.length === 0 ? (
          <div className="text-center text-sm text-text-secondary py-6 px-4 bg-surface rounded-lg">
            <p className="font-medium">This AI edit has no selection.</p>
            <p className="mt-1">Select a component type above to define the area to edit.</p>
          </div>
        ) : (
          <AnimatePresence>
            {editingPatch.subMasks.filter(sm => sm.id !== deletingItemId).map((subMask) => {
              const MaskIcon = MASK_TYPES.find(mt => mt.type === subMask.type)?.icon || Circle;
              return (
                <motion.div
                  key={subMask.id}
                  layout
                  exit={{ opacity: 0, x: -15, transition: { duration: 0.2 } }}
                  onClick={(e) => { e.stopPropagation(); onSelectSubMask(subMask.id); }}
                  onContextMenu={(e) => handleSubMaskContextMenu(e, subMask)}
                  className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 ${activeSubMaskId === subMask.id ? 'bg-accent/20' : 'bg-surface hover:bg-card-active'} ${!subMask.visible ? 'opacity-60' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <MaskIcon size={16} className="text-text-secondary" />
                    <span className="font-medium text-sm text-text-primary capitalize">
                      {formatMaskTypeName(subMask.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); updateSubMask(subMask.id, { mode: subMask.mode === 'additive' ? 'subtractive' : 'additive' }); }} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-primary" title={subMask.mode === 'additive' ? 'Set to Subtract' : 'Set to Add'}>
                      {subMask.mode === 'additive' ? <Plus size={14} /> : <Minus size={14} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); updateSubMask(subMask.id, { visible: !subMask.visible }); }} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-primary" title={subMask.visible ? "Hide" : "Show"}>
                      {subMask.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSubMask(editingPatch.id, subMask.id); }} className="p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4 border-t border-surface mt-auto">
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Generative Replace</h3>
            <p className="text-xs text-text-secondary -mt-2">Describe what you want to generate in the selected area.</p>
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="e.g., a field of flowers"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-grow"
                    disabled={isGeneratingAi}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateClick(); }}
                />
                <Button onClick={handleGenerateClick} disabled={isGeneratingAi || editingPatch.subMasks.length === 0} size="icon">
                    {isGeneratingAi ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
            </div>
        </div>

        <CollapsibleSection title="Selection Properties" isOpen={isSettingsSectionOpen} onToggle={() => setSettingsSectionOpen(prev => !prev)} isContentVisible={true} canToggleVisibility={false}>
          <div className="space-y-4">
            <Switch label="Invert Selection" checked={!!editingPatch.invert} onChange={(checked) => handlePatchPropertyChange('invert', checked)} />
            {activeSubMask && (
              <>
                {isAiMask && (
                  <>
                    {aiModelDownloadStatus && <div className="text-sm text-text-secondary p-2 bg-surface rounded-md text-center">Downloading AI Model ({aiModelDownloadStatus})...</div>}
                    {showAnalyzingMessage && !aiModelDownloadStatus && <div className="text-sm text-text-secondary p-2 bg-surface rounded-md text-center animate-pulse">Analyzing Image...</div>}
                  </>
                )}
                {subMaskConfig.parameters?.map(param => (
                  <Slider key={param.key} label={param.label} value={(activeSubMask.parameters[param.key] || 0) * (param.multiplier || 1)} onChange={(e) => handleSubMaskParameterChange(param.key, parseFloat(e.target.value) / (param.multiplier || 1))} min={param.min} max={param.max} step={param.step} defaultValue={param.defaultValue} />
                ))}
                {subMaskConfig.showBrushTools && brushSettings && setBrushSettings && (
                  <BrushTools settings={brushSettings} onSettingsChange={setBrushSettings} />
                )}
              </>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </>
  );
}
