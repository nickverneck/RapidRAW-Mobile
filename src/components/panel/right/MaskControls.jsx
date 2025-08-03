import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Copy, ClipboardPaste, Circle, TriangleRight, Brush, Droplet, Sparkles, User,
  Trash2, Eye, EyeOff, Plus, Minus
} from 'lucide-react';

import CollapsibleSection from '../../ui/CollapsibleSection';
import Switch from '../../ui/Switch';
import Slider from '../../ui/Slider';
import BasicAdjustments from '../../adjustments/Basic';
import CurveGraph from '../../adjustments/Curves';
import ColorPanel from '../../adjustments/Color';
import DetailsPanel from '../../adjustments/Details';
import EffectsPanel from '../../adjustments/Effects';

import { INITIAL_MASK_ADJUSTMENTS, ADJUSTMENT_SECTIONS } from '../../../utils/adjustments';
import { useContextMenu } from '../../../context/ContextMenuContext';

const MASK_TYPES = [
  { id: 'ai-subject', name: 'Subject', icon: Sparkles, type: 'ai-subject', disabled: false },
  { id: 'ai-foreground', name: 'Foreground', icon: User, type: 'ai-foreground', disabled: false },
  { id: 'brush', name: 'Brush', icon: Brush, type: 'brush', disabled: false },
  { id: 'linear', name: 'Linear', icon: TriangleRight, type: 'linear', disabled: false },
  { id: 'radial', name: 'Radial', icon: Circle, type: 'radial', disabled: false },
  { id: 'color', name: 'Color', icon: Droplet, type: 'color', disabled: true },
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
  color: { parameters: [] },
  luminance: { parameters: [] },
  'ai-subject': { parameters: [] },
  'ai-foreground': { parameters: [] },
};

const BrushTools = ({ settings, onSettingsChange }) => (
  <div className="space-y-4 pt-4 border-t border-surface mt-4">
    <Slider label="Brush Size" value={settings.size} onChange={(e) => onSettingsChange(s => ({ ...s, size: Number(e.target.value) }))} min="1" max="200" step="1" defaultValue="100" />
    <Slider label="Brush Feather" value={settings.feather} onChange={(e) => onSettingsChange(s => ({ ...s, feather: Number(e.target.value) }))} min="0" max="100" step="1" defaultValue="50" />
    <div className="grid grid-cols-2 gap-2 pt-2">
      <button onClick={() => onSettingsChange(s => ({ ...s, tool: 'brush' }))} className={`p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${settings.tool === 'brush' ? 'text-primary bg-surface' : 'bg-surface text-text-secondary hover:bg-card-active'}`}>Brush</button>
      <button onClick={() => onSettingsChange(s => ({ ...s, tool: 'eraser' }))} className={`p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${settings.tool === 'eraser' ? 'text-primary bg-surface' : 'bg-surface text-text-secondary hover:bg-card-active'}`}>Eraser</button>
    </div>
  </div>
);

export default function MaskControls({
  editingMask, activeSubMask, updateMask, updateSubMask,
  brushSettings, setBrushSettings, histogram, isGeneratingAiMask, aiModelDownloadStatus,
  setAdjustments, selectedImage, onSelectMask, activeMaskId, onGenerateAiForegroundMask,
  setIsMaskControlHovered
}) {
  const { showContextMenu } = useContextMenu();
  const [isSettingsSectionOpen, setSettingsSectionOpen] = useState(true);
  const [copiedSectionAdjustments, setCopiedSectionAdjustments] = useState(null);
  const [collapsibleState, setCollapsibleState] = useState({ basic: true, curves: false, color: false, details: false, effects: false });
  const [showAnalyzingMessage, setShowAnalyzingMessage] = useState(false);
  const analyzingTimeoutRef = useRef(null);
  const [deletingItemId, setDeletingItemId] = useState(null);

  useEffect(() => {
    setCollapsibleState({ basic: true, curves: false, color: false, details: false, effects: false });
  }, [editingMask?.id]);

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
      masks: prev.masks.map(c =>
        c.id === containerId ? { ...c, subMasks: [...c.subMasks, subMask] } : c
      )
    }));
    onSelectMask(subMask.id);
    if (type === 'ai-foreground') {
      onGenerateAiForegroundMask(subMask.id);
    }
  };

  const handleDeleteSubMask = (containerId, subMaskId) => {
    setDeletingItemId(subMaskId);
    setTimeout(() => {
      if (activeMaskId === subMaskId) onSelectMask(null);
      setAdjustments(prev => ({
        ...prev,
        masks: prev.masks.map(c =>
          c.id === containerId ? { ...c, subMasks: c.subMasks.filter(sm => sm.id !== subMaskId) } : c
        )
      }));
      setDeletingItemId(null);
    }, 200);
  };

  const handleDeselectSubMask = () => onSelectMask(null);

  const handleSubMaskContextMenu = (event, subMask) => {
    event.preventDefault();
    event.stopPropagation();
    const options = [
      {
        label: 'Delete Component',
        icon: Trash2,
        isDestructive: true,
        onClick: () => handleDeleteSubMask(editingMask.id, subMask.id)
      },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  if (!editingMask) return null;

  const subMaskConfig = activeSubMask ? SUB_MASK_CONFIG[activeSubMask.type] || {} : {};

  const setMaskContainerAdjustments = (updater) => {
    const currentAdjustments = editingMask.adjustments;
    const newAdjustments = typeof updater === 'function' ? updater(currentAdjustments) : updater;
    updateMask(editingMask.id, { adjustments: newAdjustments });
  };

  const handleToggleSection = (section) => setCollapsibleState(prev => ({ ...prev, [section]: !prev[section] }));

  const handleToggleVisibility = (sectionName) => {
    const currentAdjustments = editingMask.adjustments;
    const currentVisibility = currentAdjustments.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility;
    const newAdjustments = { ...currentAdjustments, sectionVisibility: { ...currentVisibility, [sectionName]: !currentVisibility[sectionName] } };
    updateMask(editingMask.id, { adjustments: newAdjustments });
  };

  const handleSubMaskParameterChange = (key, value) => {
    if (!activeSubMask) return;
    updateSubMask(activeSubMask.id, { parameters: { ...activeSubMask.parameters, [key]: value } });
  };

  const handleMaskPropertyChange = (key, value) => updateMask(editingMask.id, { [key]: value });

  const handleSectionContextMenu = (event, sectionName) => {
    event.preventDefault();
    event.stopPropagation();
    const sectionKeys = ADJUSTMENT_SECTIONS[sectionName];
    if (!sectionKeys) return;
    const handleCopy = () => {
      const adjustmentsToCopy = {};
      for (const key of sectionKeys) {
        if (editingMask.adjustments.hasOwnProperty(key)) {
          adjustmentsToCopy[key] = JSON.parse(JSON.stringify(editingMask.adjustments[key]));
        }
      }
      setCopiedSectionAdjustments({ section: sectionName, values: adjustmentsToCopy });
    };
    const handlePaste = () => {
      if (!copiedSectionAdjustments || copiedSectionAdjustments.section !== sectionName) return;
      setMaskContainerAdjustments(prev => ({ ...prev, ...copiedSectionAdjustments.values, sectionVisibility: { ...(prev.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility), [sectionName]: true } }));
    };
    const handleReset = () => {
      const resetValues = {};
      for (const key of sectionKeys) {
        resetValues[key] = JSON.parse(JSON.stringify(INITIAL_MASK_ADJUSTMENTS[key]));
      }
      setMaskContainerAdjustments(prev => ({ ...prev, ...resetValues, sectionVisibility: { ...(prev.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility), [sectionName]: true } }));
    };
    const isPasteAllowed = copiedSectionAdjustments && copiedSectionAdjustments.section === sectionName;
    const pasteLabel = copiedSectionAdjustments ? `Paste ${copiedSectionAdjustments.section.charAt(0).toUpperCase() + copiedSectionAdjustments.section.slice(1)} Settings` : 'Paste Settings';
    const options = [
      { label: `Copy ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Settings`, icon: Copy, onClick: handleCopy },
      { label: pasteLabel, icon: ClipboardPaste, onClick: handlePaste, disabled: !isPasteAllowed },
      { type: 'separator' },
      { label: `Reset ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Settings`, icon: RotateCcw, onClick: handleReset },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const isAiMask = activeSubMask && (activeSubMask.type === 'ai-subject' || activeSubMask.type === 'ai-foreground');
  const sectionVisibility = editingMask.adjustments.sectionVisibility || INITIAL_MASK_ADJUSTMENTS.sectionVisibility;

  return (
    <>
      <div className="p-4 border-b border-surface">
        <p className="text-sm mb-3 font-semibold text-text-primary">Add Component</p>
        <div className="grid grid-cols-3 gap-2">
          {MASK_TYPES.map(maskType => (
            <button
              key={maskType.id}
              onClick={() => handleAddSubMask(editingMask.id, maskType.type)}
              disabled={maskType.disabled || isGeneratingAiMask}
              className={`bg-surface text-text-primary rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 aspect-square transition-colors ${maskType.disabled || isGeneratingAiMask ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card-active'}`}
              title={`Add ${maskType.name} component`}
            >
              <maskType.icon size={24} />
              <span className="text-xs">{maskType.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2" onClick={handleDeselectSubMask}>
        <p className="text-sm mb-3 font-semibold text-text-primary">Mask Components</p>
        {editingMask.subMasks.length === 0 ? (
          <div className="text-center text-sm text-text-secondary py-6 px-4 bg-surface rounded-lg">
            <p className="font-medium">This mask is empty.</p>
            <p className="mt-1">Select a component type above to begin building your mask.</p>
          </div>
        ) : (
          <AnimatePresence>
            {editingMask.subMasks.filter(sm => sm.id !== deletingItemId).map((subMask) => {
              const MaskIcon = MASK_TYPES.find(mt => mt.type === subMask.type)?.icon || Circle;
              return (
                <motion.div
                  key={subMask.id}
                  layout
                  exit={{ opacity: 0, x: -15, transition: { duration: 0.2 } }}
                  onClick={(e) => { e.stopPropagation(); onSelectMask(subMask.id); }}
                  onContextMenu={(e) => handleSubMaskContextMenu(e, subMask)}
                  className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 ${activeMaskId === subMask.id ? 'bg-accent/20' : 'bg-surface hover:bg-card-active'} ${!subMask.visible ? 'opacity-60' : 'opacity-100'}`}
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
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSubMask(editingMask.id, subMask.id); }} className="p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 border-t border-surface">
        <CollapsibleSection title="Mask Properties" isOpen={isSettingsSectionOpen} onToggle={() => setSettingsSectionOpen(prev => !prev)} isContentVisible={true} canToggleVisibility={false}>
          <div className="space-y-4">
            <Switch label="Invert Mask" checked={!!editingMask.invert} onChange={(checked) => handleMaskPropertyChange('invert', checked)} />
            <Slider
              label="Mask Transparency"
              value={editingMask.opacity ?? 100}
              onChange={(e) => handleMaskPropertyChange('opacity', Number(e.target.value))}
              min="0"
              max="100"
              step="1"
              defaultValue="100"
            />
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

        <div
          className="flex flex-col gap-2"
          onMouseEnter={() => setIsMaskControlHovered(true)}
          onMouseLeave={() => setIsMaskControlHovered(false)}
        >
          {Object.keys(ADJUSTMENT_SECTIONS).map(sectionName => {
            const SectionComponent = { basic: BasicAdjustments, curves: CurveGraph, color: ColorPanel, details: DetailsPanel, effects: EffectsPanel }[sectionName];
            const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
            return (
              <CollapsibleSection key={sectionName} title={title} isOpen={collapsibleState[sectionName]} onToggle={() => handleToggleSection(sectionName)} onContextMenu={(e) => handleSectionContextMenu(e, sectionName)} isContentVisible={sectionVisibility[sectionName]} onToggleVisibility={() => handleToggleVisibility(sectionName)}>
                <SectionComponent adjustments={editingMask.adjustments} setAdjustments={setMaskContainerAdjustments} histogram={histogram} isForMask={sectionName === 'effects'} />
              </CollapsibleSection>
            );
          })}
        </div>
      </div>
    </>
  );
}