import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RotateCcw, ArrowLeft, Eye, EyeOff, Edit, FileEdit, Sparkles, User, Brush,
  TriangleRight, Circle, Wand2, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import AIControls from './AIControls';
import { useContextMenu } from '../../../context/ContextMenuContext';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const MASK_TYPES = [
  { id: 'ai-subject', name: 'Subject', icon: Sparkles, type: 'ai-subject', disabled: false },
  { id: 'ai-foreground', name: 'Foreground', icon: User, type: 'ai-foreground', disabled: false },
  { id: 'brush', name: 'Brush', icon: Brush, type: 'brush', disabled: false },
  { id: 'linear', name: 'Linear', icon: TriangleRight, type: 'linear', disabled: false },
  { id: 'radial', name: 'Radial', icon: Circle, type: 'radial', disabled: false },
];

const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, delay: i * 0.05 },
  }),
  exit: { opacity: 0, x: -15, transition: { duration: 0.2 } },
};

const ConnectionStatus = ({ isConnected }) => (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg mb-4">
      <div className={clsx('w-2.5 h-2.5 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} />
      <span className="text-sm font-medium text-text-secondary">
        ComfyUI Backend:
      </span>
      <span className={clsx('text-sm font-bold', isConnected ? 'text-green-400' : 'text-red-400')}>
        {isConnected ? 'Connected' : 'Not Detected'}
      </span>
    </div>
);

export default function AIPanel({
  adjustments,
  setAdjustments,
  selectedImage,
  isComfyUiConnected,
  isGeneratingAi,
  onGenerativeReplace,
  onDeletePatch,
  onTogglePatchVisibility,
  onStyleShift,
  onUpscale,
  activePatchContainerId,
  onSelectPatchContainer,
  activeSubMaskId,
  onSelectSubMask,
  brushSettings,
  setBrushSettings,
  isGeneratingAiMask,
  aiModelDownloadStatus,
  onGenerateAiForegroundMask,
  setCustomEscapeHandler,
}) {
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [renamingContainerId, setRenamingContainerId] = useState(null);
  const [tempName, setTempName] = useState('');
  const { showContextMenu } = useContextMenu();
  const isInitialRender = useRef(true);
  const [styleShiftPrompt, setStyleShiftPrompt] = useState('');

  const handleResetAllAiEdits = () => {
    if (isGeneratingAi) return;
    onSelectPatchContainer(null);
    onSelectSubMask(null);
    setAdjustments(prev => ({ ...prev, aiPatches: [] }));
  };

  const handleBackToList = useCallback(() => {
    onSelectPatchContainer(null);
    onSelectSubMask(null);
  }, [onSelectPatchContainer, onSelectSubMask]);

  const updatePatch = (patchId, updatedData) => {
    setAdjustments(prev => ({
      ...prev,
      aiPatches: (prev.aiPatches || []).map(p =>
        p.id === patchId ? { ...p, ...updatedData } : p
      ),
    }));
  };

  const updateSubMask = (subMaskId, updatedData) => {
    setAdjustments(prev => ({
      ...prev,
      aiPatches: prev.aiPatches.map(p => ({
        ...p,
        subMasks: p.subMasks.map(sm => sm.id === subMaskId ? { ...sm, ...updatedData } : sm)
      }))
    }));
  };

  const handleFinishRename = () => {
    if (renamingContainerId && tempName.trim()) {
      updatePatch(renamingContainerId, { name: tempName.trim() });
    }
    setRenamingContainerId(null);
    setTempName('');
  };

  useEffect(() => {
    const escapeHandler = () => {
      if (renamingContainerId) {
        handleFinishRename();
      } else if (activePatchContainerId) {
        handleBackToList();
      }
    };
    
    if (activePatchContainerId) {
      setCustomEscapeHandler(() => escapeHandler);
    } else {
      setCustomEscapeHandler(null);
    }

    return () => setCustomEscapeHandler(null);
  }, [activePatchContainerId, renamingContainerId, handleBackToList]);

  useEffect(() => { isInitialRender.current = false; }, []);

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

  const handleAddAiPatchContainer = (type) => {
    const subMask = createSubMask(type);
    const newContainer = {
      id: uuidv4(),
      name: `AI Edit ${adjustments.aiPatches.length + 1}`,
      visible: true,
      invert: false,
      prompt: '',
      isLoading: false,
      patchDataBase64: null,
      subMasks: [subMask],
    };
    setAdjustments(prev => ({ ...prev, aiPatches: [...(prev.aiPatches || []), newContainer] }));
    onSelectPatchContainer(newContainer.id);
    onSelectSubMask(subMask.id);
    if (type === 'ai-foreground') {
      onGenerateAiForegroundMask(subMask.id);
    }
  };

  const handleDeleteContainer = (id) => {
    setDeletingItemId(id);
    setTimeout(() => {
      if (activePatchContainerId === id) onSelectPatchContainer(null);
      const container = adjustments.aiPatches.find(c => c.id === id);
      if (container && container.subMasks.some(sm => sm.id === activeSubMaskId)) {
        onSelectSubMask(null);
      }
      onDeletePatch(id);
      setDeletingItemId(null);
    }, 200);
  };

  const handleToggleContainerVisibility = (id) => {
    onTogglePatchVisibility(id);
  };

  const handleOpenContainerForEditing = (container) => {
    onSelectPatchContainer(container.id);
    onSelectSubMask(null);
  };

  const handleDeselect = () => onSelectSubMask(null);

  const handleStartRename = (container) => {
    setRenamingContainerId(container.id);
    setTempName(container.name);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') handleFinishRename();
    else if (e.key === 'Escape') {
      setRenamingContainerId(null);
      setTempName('');
    }
  };

  const handleContainerContextMenu = (event, container) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: 'Edit AI Selection', icon: Edit, onClick: () => handleOpenContainerForEditing(container) },
      { label: 'Rename', icon: FileEdit, onClick: () => handleStartRename(container) },
      { type: 'separator' },
      { label: 'Delete', icon: Trash2, isDestructive: true, onClick: () => handleDeleteContainer(container.id) },
    ]);
  };

  const handleApplyStyleShift = () => {
    if (!styleShiftPrompt || !onStyleShift) return;
    onStyleShift(styleShiftPrompt);
  };

  const editingPatch = adjustments.aiPatches?.find(p => p.id === activePatchContainerId);

  if (editingPatch) {
    const activeSubMask = editingPatch.subMasks.find(sm => sm.id === activeSubMaskId);
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface h-[69px]">
          <button onClick={handleBackToList} className="p-2 rounded-full hover:bg-surface transition-colors flex-shrink-0" title="Back to AI Edit List">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-grow min-w-0 text-center px-2">
            {renamingContainerId === editingPatch.id ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent w-full text-xl font-bold text-primary text-shadow-shiny focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 py-1 text-center"
                autoFocus
              />
            ) : (
              <h2
                onClick={() => handleStartRename(editingPatch)}
                className="text-xl font-bold text-primary text-shadow-shiny truncate cursor-pointer px-4 py-4"
                title="Click to rename"
              >
                {editingPatch.name}
              </h2>
            )}
          </div>
          <button onClick={() => updatePatch(editingPatch.id, { subMasks: [] })} className="p-2 rounded-full hover:bg-surface transition-colors flex-shrink-0" title="Reset Selection">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <AIControls
            editingPatch={editingPatch}
            activeSubMask={activeSubMask}
            updatePatch={updatePatch}
            updateSubMask={updateSubMask}
            brushSettings={brushSettings}
            setBrushSettings={setBrushSettings}
            isGeneratingAi={isGeneratingAi || editingPatch.isLoading}
            isGeneratingAiMask={isGeneratingAiMask}
            aiModelDownloadStatus={aiModelDownloadStatus}
            setAdjustments={setAdjustments}
            selectedImage={selectedImage}
            onSelectSubMask={onSelectSubMask}
            activeSubMaskId={activeSubMaskId}
            onGenerateAiForegroundMask={onGenerateAiForegroundMask}
            onGenerativeReplace={onGenerativeReplace}
          />
        </div>
      </div>
    );
  }

  const aiPatches = adjustments?.aiPatches || [];
  const hasAiEdits = aiPatches.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface h-[69px]">
        <h2 className="text-xl font-bold text-primary text-shadow-shiny">AI Tools</h2>
        <button
          onClick={handleResetAllAiEdits}
          className="p-2 rounded-full hover:bg-surface transition-colors"
          title="Reset All AI Edits"
          disabled={!hasAiEdits || isGeneratingAi}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 text-text-secondary space-y-6" onClick={handleDeselect}>
        {!selectedImage ? (
          <p className="text-center text-text-tertiary mt-4">No image selected.</p>
        ) : (
          <>
            <ConnectionStatus isConnected={isComfyUiConnected} />

            <div className={clsx("space-y-6", !isComfyUiConnected && 'opacity-40 pointer-events-none')} onClick={(e) => e.stopPropagation()}>
              <div>
                {aiModelDownloadStatus && <div className="p-2 text-center text-xs text-text-secondary bg-surface rounded-md mb-4">Downloading AI Model: {aiModelDownloadStatus}</div>}
                <p className="text-sm mb-3 font-semibold text-text-primary">Create New Generative Edit</p>
                <div className="grid grid-cols-3 gap-2">
                  {MASK_TYPES.map(maskType => (
                    <button key={maskType.id} onClick={() => handleAddAiPatchContainer(maskType.type)} disabled={maskType.disabled || isGeneratingAiMask || isGeneratingAi} className={`bg-surface text-text-primary rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 aspect-square transition-colors ${maskType.disabled || isGeneratingAiMask || isGeneratingAi ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card-active'}`} title={maskType.disabled ? `${maskType.name} (Coming Soon)` : `Add ${maskType.name} Edit`}>
                      <maskType.icon size={24} />
                      <span className="text-xs">{maskType.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {hasAiEdits && (
                <div>
                  <p className="text-sm mb-3 font-semibold text-text-primary">Generative Edits ({aiPatches.length})</p>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {aiPatches.filter(p => p.id !== deletingItemId).map((patch, index) => (
                        <motion.div
                          key={patch.id}
                          layout
                          variants={itemVariants}
                          initial={isInitialRender.current ? "hidden" : false}
                          animate="visible"
                          exit="exit"
                          custom={index}
                          onClick={() => handleOpenContainerForEditing(patch)}
                          onContextMenu={(e) => handleContainerContextMenu(e, patch)}
                          className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 ${activePatchContainerId === patch.id ? 'bg-accent/20' : 'bg-surface hover:bg-card-active'} ${!patch.visible ? 'opacity-60' : 'opacity-100'}`}
                        >
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            {patch.isLoading ? (
                                <Loader2 size={16} className="text-accent animate-spin" />
                            ) : (
                                <Wand2 size={16} className="text-text-secondary" />
                            )}
                            {renamingContainerId === patch.id ? (
                              <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleFinishRename}
                                onKeyDown={handleRenameKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                onContextMenu={(e) => e.stopPropagation()}
                                className="bg-transparent w-full text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1"
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium text-sm text-text-primary truncate">{patch.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); handleToggleContainerVisibility(patch.id); }} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-primary" title={patch.visible ? "Hide Edit" : "Show Edit"}>
                              {patch.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteContainer(patch.id); }} className="p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10" title="Delete Edit">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div className="border-t border-surface pt-4 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">Style Shift</h3>
                  <p className="text-xs text-text-secondary -mt-2">Transform the entire image with a new artistic style.</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="e.g., cinematic, Van Gogh painting"
                      value={styleShiftPrompt}
                      onChange={(e) => setStyleShiftPrompt(e.target.value)}
                      disabled={isGeneratingAi}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyStyleShift(); }}
                    />
                    <Button onClick={handleApplyStyleShift} disabled={!styleShiftPrompt || isGeneratingAi}>
                      Apply
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">Upscale</h3>
                  <p className="text-xs text-text-secondary -mt-2">Increase the image resolution using AI.</p>
                  <div className="grid grid-cols-3 gap-2">
                      <Button variant="secondary" onClick={() => onUpscale && onUpscale(2)} disabled={isGeneratingAi}>2x</Button>
                      <Button variant="secondary" onClick={() => onUpscale && onUpscale(3)} disabled={isGeneratingAi}>3x</Button>
                      <Button variant="secondary" onClick={() => onUpscale && onUpscale(4)} disabled={isGeneratingAi}>4x</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
