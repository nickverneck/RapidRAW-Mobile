import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RotateCcw, ArrowLeft, Eye, EyeOff, Edit, Copy, ClipboardPaste, PlusSquare,
  ChevronsRight, FileEdit, Sparkles, User, Brush, TriangleRight, Circle, Droplet
} from 'lucide-react';
import MaskControls from './MaskControls';
import { INITIAL_MASK_ADJUSTMENTS, INITIAL_MASK_CONTAINER } from '../../../utils/adjustments';
import { useContextMenu } from '../../../context/ContextMenuContext';

const MASK_TYPES = [
  { id: 'ai-subject', name: 'Subject', icon: Sparkles, type: 'ai-subject', disabled: false },
  { id: 'ai-foreground', name: 'Foreground', icon: User, type: 'ai-foreground', disabled: false },
  { id: 'brush', name: 'Brush', icon: Brush, type: 'brush', disabled: false },
  { id: 'linear', name: 'Linear', icon: TriangleRight, type: 'linear', disabled: false },
  { id: 'radial', name: 'Radial', icon: Circle, type: 'radial', disabled: false },
  { id: 'color', name: 'Color', icon: Droplet, type: 'color', disabled: true },
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

export default function MasksPanel({
  adjustments, setAdjustments, selectedImage, onSelectMask, activeMaskId,
  activeMaskContainerId, onSelectContainer, setIsMaskControlHovered,
  brushSettings, setBrushSettings, copiedMask, setCopiedMask, histogram,
  setCustomEscapeHandler, isGeneratingAiMask, aiModelDownloadStatus, onGenerateAiForegroundMask
}) {
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [renamingContainerId, setRenamingContainerId] = useState(null);
  const [tempName, setTempName] = useState('');
  const { showContextMenu } = useContextMenu();
  const isInitialRender = useRef(true);

  const handleBackToList = useCallback(() => {
    onSelectContainer(null);
    onSelectMask(null);
  }, [onSelectContainer, onSelectMask]);

  const handleFinishRename = () => {
    if (renamingContainerId && tempName.trim()) {
      updateContainer(renamingContainerId, { name: tempName.trim() });
    }
    setRenamingContainerId(null);
    setTempName('');
  };

  useEffect(() => {
    const escapeHandler = () => {
      if (renamingContainerId) {
        handleFinishRename();
      } else if (activeMaskContainerId) {
        handleBackToList();
      }
    };
    
    if (activeMaskContainerId) {
      setCustomEscapeHandler(() => escapeHandler);
    } else {
      setCustomEscapeHandler(null);
    }

    return () => setCustomEscapeHandler(null);
  }, [activeMaskContainerId, renamingContainerId, handleBackToList]);

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

  const handleAddMaskContainer = (type) => {
    const subMask = createSubMask(type);
    const newContainer = {
      ...INITIAL_MASK_CONTAINER,
      id: uuidv4(),
      name: `Mask ${adjustments.masks.length + 1}`,
      subMasks: [subMask],
    };
    setAdjustments(prev => ({ ...prev, masks: [...(prev.masks || []), newContainer] }));
    onSelectContainer(newContainer.id);
    onSelectMask(subMask.id);
    if (type === 'ai-foreground') {
      onGenerateAiForegroundMask(subMask.id);
    }
  };

  const handleDeleteContainer = (id) => {
    setDeletingItemId(id);
    setTimeout(() => {
      if (activeMaskContainerId === id) onSelectContainer(null);
      const container = adjustments.masks.find(c => c.id === id);
      if (container && container.subMasks.some(sm => sm.id === activeMaskId)) {
        onSelectMask(null);
      }
      setAdjustments(prev => ({ ...prev, masks: (prev.masks || []).filter(c => c.id !== id) }));
      setDeletingItemId(null);
    }, 200);
  };

  const handleToggleContainerVisibility = (id) => {
    setAdjustments(prev => ({
      ...prev,
      masks: prev.masks.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
    }));
  };

  const updateContainer = (containerId, updatedData) => {
    setAdjustments(prev => ({
      ...prev,
      masks: (prev.masks || []).map(c =>
        c.id === containerId ? { ...c, ...updatedData } : c
      ),
    }));
  };

  const updateSubMask = (subMaskId, updatedData) => {
    setAdjustments(prev => ({
      ...prev,
      masks: prev.masks.map(c => ({
        ...c,
        subMasks: c.subMasks.map(sm => sm.id === subMaskId ? { ...sm, ...updatedData } : sm)
      }))
    }));
  };

  const handleResetAllMasks = () => {
    onSelectContainer(null);
    onSelectMask(null);
    setAdjustments(prev => ({ ...prev, masks: [] }));
  };

  const handleOpenContainerForEditing = (container) => {
    onSelectContainer(container.id);
    onSelectMask(null);
  };

  const handleDeselect = () => onSelectMask(null);

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

  const handleDuplicateContainer = (containerToDuplicate) => {
    const newContainer = JSON.parse(JSON.stringify(containerToDuplicate));
    newContainer.id = uuidv4();
    newContainer.name = `${containerToDuplicate.name} Copy`;
    newContainer.subMasks = newContainer.subMasks.map(sm => ({ ...sm, id: uuidv4() }));
    setAdjustments(prev => ({ ...prev, masks: [...(prev.masks || []), newContainer] }));
  };

  const handlePasteContainer = () => {
    if (!copiedMask) return;
    const newContainer = JSON.parse(JSON.stringify(copiedMask));
    newContainer.id = uuidv4();
    newContainer.subMasks = newContainer.subMasks.map(sm => ({ ...sm, id: uuidv4() }));
    setAdjustments(prev => ({ ...prev, masks: [...(prev.masks || []), newContainer] }));
  };

  const handlePasteContainerAdjustments = (targetContainerId) => {
    if (!copiedMask) return;
    setAdjustments(prev => ({
      ...prev,
      masks: prev.masks.map(c =>
        c.id === targetContainerId
          ? { ...c, adjustments: JSON.parse(JSON.stringify(copiedMask.adjustments)) }
          : c
      )
    }));
  };

  const handleContainerContextMenu = (event, container) => {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: 'Edit Mask', icon: Edit, onClick: () => handleOpenContainerForEditing(container) },
      { label: 'Rename Mask', icon: FileEdit, onClick: () => handleStartRename(container) },
      { label: 'Duplicate Mask', icon: PlusSquare, onClick: () => handleDuplicateContainer(container) },
      { type: 'separator' },
      { label: 'Copy Mask', icon: Copy, onClick: () => setCopiedMask(container) },
      { label: 'Paste Adjustments', icon: ClipboardPaste, disabled: !copiedMask, onClick: () => handlePasteContainerAdjustments(container.id) },
      { type: 'separator' },
      { label: 'Delete Mask', icon: Trash2, isDestructive: true, onClick: () => handleDeleteContainer(container.id) },
    ]);
  };

  const handlePanelContextMenu = (event) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: 'Paste Mask', icon: ClipboardPaste, disabled: !copiedMask, onClick: handlePasteContainer },
    ]);
  };

  const editingContainer = adjustments.masks.find(m => m.id === activeMaskContainerId);

  if (editingContainer) {
    const activeSubMask = editingContainer.subMasks.find(sm => sm.id === activeMaskId);
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface h-[69px]">
          <button onClick={handleBackToList} className="p-2 rounded-full hover:bg-surface transition-colors flex-shrink-0" title="Back to Mask List">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-grow min-w-0 text-center px-2">
            {renamingContainerId === editingContainer.id ? (
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
                onClick={() => handleStartRename(editingContainer)}
                className="text-xl font-bold text-primary text-shadow-shiny truncate cursor-pointer px-4 py-4"
                title="Click to rename"
              >
                {editingContainer.name}
              </h2>
            )}
          </div>
          <button onClick={() => updateContainer(editingContainer.id, { adjustments: { ...INITIAL_MASK_ADJUSTMENTS } })} className="p-2 rounded-full hover:bg-surface transition-colors flex-shrink-0" title="Reset Mask Adjustments">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <MaskControls
            editingMask={editingContainer}
            activeSubMask={activeSubMask}
            updateMask={updateContainer}
            updateSubMask={updateSubMask}
            brushSettings={brushSettings}
            setBrushSettings={setBrushSettings}
            histogram={histogram}
            isGeneratingAiMask={isGeneratingAiMask}
            aiModelDownloadStatus={aiModelDownloadStatus}
            setAdjustments={setAdjustments}
            selectedImage={selectedImage}
            onSelectMask={onSelectMask}
            activeMaskId={activeMaskId}
            onGenerateAiForegroundMask={onGenerateAiForegroundMask}
            setIsMaskControlHovered={setIsMaskControlHovered}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface h-[69px]">
        <h2 className="text-xl font-bold text-primary text-shadow-shiny">Masking</h2>
        <button onClick={handleResetAllMasks} className="p-2 rounded-full hover:bg-surface transition-colors" title="Reset All Masks" disabled={adjustments.masks.length === 0}>
          <RotateCcw size={18} />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 text-text-secondary space-y-6" onClick={handleDeselect} onContextMenu={handlePanelContextMenu}>
        <div onClick={(e) => e.stopPropagation()}>
          {aiModelDownloadStatus && <div className="p-2 text-center text-xs text-text-secondary bg-surface rounded-md mb-4">Downloading AI Model: {aiModelDownloadStatus}</div>}
          <p className="text-sm mb-3 font-semibold text-text-primary">Create New Mask</p>
          <div className="grid grid-cols-3 gap-2">
            {MASK_TYPES.map(maskType => (
              <button key={maskType.id} onClick={() => handleAddMaskContainer(maskType.type)} disabled={maskType.disabled || isGeneratingAiMask} className={`bg-surface text-text-primary rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 aspect-square transition-colors ${maskType.disabled || isGeneratingAiMask ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card-active'}`} title={maskType.disabled ? `${maskType.name} (Coming Soon)` : `Add ${maskType.name} Mask`}>
                <maskType.icon size={24} />
                <span className="text-xs">{maskType.name}</span>
              </button>
            ))}
          </div>
        </div>
        {adjustments.masks.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <p className="text-sm mb-3 font-semibold text-text-primary">Masks ({adjustments.masks.length})</p>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {adjustments.masks.filter(c => c.id !== deletingItemId).map((container, index) => (
                  <motion.div
                    key={container.id}
                    layout
                    variants={itemVariants}
                    initial={isInitialRender.current ? "hidden" : false}
                    animate="visible"
                    exit="exit"
                    custom={index}
                    onClick={() => handleOpenContainerForEditing(container)}
                    onContextMenu={(e) => handleContainerContextMenu(e, container)}
                    className={`group p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200 ${activeMaskContainerId === container.id ? 'bg-accent/20' : 'bg-surface hover:bg-card-active'} ${!container.visible ? 'opacity-60' : 'opacity-100'}`}
                  >
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <ChevronsRight size={16} className="text-text-secondary flex-shrink-0" />
                      {renamingContainerId === container.id ? (
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
                        <span className="font-medium text-sm text-text-primary truncate">{container.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleContainerVisibility(container.id); }} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-primary" title={container.visible ? "Hide Mask" : "Show Mask"}>
                        {container.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteContainer(container.id); }} className="p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10" title="Delete Mask">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}