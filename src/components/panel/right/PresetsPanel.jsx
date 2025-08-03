import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { usePresets } from '../../../hooks/usePresets';
import { useContextMenu } from '../../../context/ContextMenuContext';
import { Plus, Loader2, FileUp, FileDown, Edit, Trash2, CopyPlus, RefreshCw, FolderPlus, Folder as FolderIcon, FolderOpen, SortAsc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddPresetModal from '../../modals/AddPresetModal';
import RenamePresetModal from '../../modals/RenamePresetModal';
import CreateFolderModal from '../../modals/CreateFolderModal';
import RenameFolderModal from '../../modals/RenameFolderModal';
import { INITIAL_ADJUSTMENTS } from '../../../utils/adjustments';

function PresetItemDisplay({ preset, previewUrl, isGeneratingPreviews }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface cursor-grabbing">
      <div className="w-20 h-14 bg-bg-tertiary rounded-md flex items-center justify-center flex-shrink-0">
        {isGeneratingPreviews && !previewUrl ? (
          <Loader2 size={20} className="animate-spin text-text-secondary" />
        ) : previewUrl ? (
          <img src={previewUrl} alt={`${preset.name} preview`} className="w-full h-full object-cover rounded-md" />
        ) : (
          <Loader2 size={20} className="animate-spin text-text-secondary" />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-medium truncate">{preset.name}</p>
      </div>
    </div>
  );
}

function FolderItemDisplay({ folder }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface cursor-grabbing w-full">
      <div className="p-1">
        <FolderIcon size={18} />
      </div>
      <p className="font-normal flex-grow truncate select-none">{folder.name}</p>
      <span className="text-text-secondary text-sm ml-auto pr-1">{folder.children?.length || 0}</span>
    </div>
  );
}

function DraggablePresetItem({ preset, onApply, onContextMenu, previewUrl, isGeneratingPreviews }) {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: preset.id,
    data: { type: 'preset', preset },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: preset.id,
    data: { type: 'preset', preset },
  });

  const setCombinedRef = useCallback(node => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  }, [setDraggableNodeRef, setDroppableNodeRef]);

  const style = {
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
    outline: isOver ? '2px solid var(--color-primary)' : '2px solid transparent',
    outlineOffset: '-2px',
    borderRadius: '10px',
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      onClick={() => onApply(preset)}
      onContextMenu={(e) => onContextMenu(e, { preset })}
    >
      <div {...listeners} {...attributes} className="cursor-grab">
        <PresetItemDisplay preset={preset} previewUrl={previewUrl} isGeneratingPreviews={isGeneratingPreviews} />
      </div>
    </div>
  );
}

function DroppableFolderItem({ folder, onContextMenu, children, onToggle, isExpanded }) {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: folder.id,
    data: { type: 'folder', folder },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: 'folder', folder },
  });

  const style = {
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div
      ref={setDroppableNodeRef}
      style={style}
      className={`rounded-lg transition-colors ${isOver ? 'bg-surface-hover' : ''}`}
    >
      <div
        onContextMenu={(e) => onContextMenu(e, { folder })}
        className="flex items-center gap-2 p-2 rounded-lg bg-surface cursor-pointer"
      >
        <div className="p-1 cursor-grab" {...listeners} {...attributes}>
          {isExpanded ? (
            <FolderOpen size={18} onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }} className="text-primary" />
          ) : (
            <FolderIcon size={18} onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }} className="text-text-secondary" />
          )}
        </div>
        <p className="font-normal flex-grow truncate select-none" onClick={() => onToggle(folder.id)}>{folder.name}</p>
        <span className="text-text-secondary text-sm ml-auto pr-1">{folder.children?.length || 0}</span>
      </div>
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-6 space-y-2 overflow-hidden pt-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, delay: i * 0.05 },
  }),
  exit: { opacity: 0, x: -15, transition: { duration: 0.2 } },
};

export default function PresetsPanel({ adjustments, setAdjustments, selectedImage, activePanel }) {
  const { 
    presets, 
    isLoading, 
    addPreset,
    addFolder,
    deleteItem,
    renameItem,
    updatePreset,
    duplicatePreset,
    movePreset,
    reorderItems,
    sortAllPresetsAlphabetically,
    importPresetsFromFile,
    exportPresetsToFile,
  } = usePresets(adjustments);

  const { showContextMenu } = useContextMenu();
  const [previews, setPreviews] = useState({});
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [renamePresetState, setRenamePresetState] = useState({ isOpen: false, preset: null });
  const [renameFolderState, setRenameFolderState] = useState({ isOpen: false, folder: null });
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [activeItem, setActiveItem] = useState(null);
  const [folderPreviewsGenerated, setFolderPreviewsGenerated] = useState(new Set());
  const [deletingItemId, setDeletingItemId] = useState(null);
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const { setNodeRef: setRootNodeRef, isOver: isRootOver } = useDroppable({ id: 'root' });

  const allItemsMap = useMemo(() => {
    const map = new Map();
    presets.forEach(item => {
      if (item.preset) {
        map.set(item.preset.id, { type: 'preset', data: item.preset });
      } else if (item.folder) {
        map.set(item.folder.id, { type: 'folder', data: item.folder });
        item.folder.children.forEach(p => map.set(p.id, { type: 'preset', data: p }));
      }
    });
    return map;
  }, [presets]);

  const itemParentMap = useMemo(() => {
    const map = new Map();
    presets.forEach(item => {
      if (item.preset) {
        map.set(item.preset.id, null);
      } else if (item.folder) {
        map.set(item.folder.id, null);
        item.folder.children.forEach(p => map.set(p.id, item.folder.id));
      }
    });
    return map;
  }, [presets]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
        if (!folderPreviewsGenerated.has(folderId)) {
          generateFolderPreviews(folderId);
        }
      }
      return newSet;
    });
  };

  const generateSinglePreview = useCallback(async (preset) => {
    if (!selectedImage?.isReady || !preset) return;

    setIsGeneratingPreviews(true);
    try {
      const fullPresetAdjustments = { ...INITIAL_ADJUSTMENTS, ...preset.adjustments };
      const previewUrl = await invoke('generate_preset_preview', { jsAdjustments: fullPresetAdjustments });
      setPreviews(prev => ({ ...prev, [preset.id]: previewUrl }));
    } catch (error) {
      console.error(`Failed to generate preview for preset ${preset.name}:`, error);
      setPreviews(prev => ({ ...prev, [preset.id]: null }));
    } finally {
      setIsGeneratingPreviews(false);
    }
  }, [selectedImage?.isReady]);

  const generateFolderPreviews = useCallback(async (folderId) => {
    if (!selectedImage?.isReady) return;

    const folder = presets.find(item => item.folder && item.folder.id === folderId);
    if (!folder?.folder?.children?.length) return;

    const presetsToGenerate = folder.folder.children.filter(p => !previewsRef.current[p.id]);
    if (presetsToGenerate.length === 0) {
      setFolderPreviewsGenerated(prev => new Set(prev).add(folderId));
      return;
    }

    setIsGeneratingPreviews(true);
    try {
      const newPreviews = {};
      await Promise.all(presetsToGenerate.map(async (preset) => {
        try {
          const fullPresetAdjustments = { ...INITIAL_ADJUSTMENTS, ...preset.adjustments };
          const previewUrl = await invoke('generate_preset_preview', { jsAdjustments: fullPresetAdjustments });
          newPreviews[preset.id] = previewUrl;
        } catch (error) {
          console.error(`Failed to generate preview for preset ${preset.name}:`, error);
          newPreviews[preset.id] = null;
        }
      }));

      setPreviews(prev => ({ ...prev, ...newPreviews }));
      setFolderPreviewsGenerated(prev => new Set(prev).add(folderId));
    } finally {
      setIsGeneratingPreviews(false);
    }
  }, [selectedImage?.isReady, presets]);

  const generateRootPreviews = useCallback(async () => {
    if (!selectedImage?.isReady) return;
    
    const rootPresets = presets.filter(item => item.preset).map(item => item.preset);
    const presetsToGenerate = rootPresets.filter(p => !previewsRef.current[p.id]);

    if (presetsToGenerate.length === 0) return;

    setIsGeneratingPreviews(true);
    try {
      const newPreviews = {};
      await Promise.all(presetsToGenerate.map(async (preset) => {
        try {
          const fullPresetAdjustments = { ...INITIAL_ADJUSTMENTS, ...preset.adjustments };
          const previewUrl = await invoke('generate_preset_preview', { jsAdjustments: fullPresetAdjustments });
          newPreviews[preset.id] = previewUrl;
        } catch (error) {
          console.error(`Failed to generate preview for preset ${preset.name}:`, error);
          newPreviews[preset.id] = null;
        }
      }));
      setPreviews(prev => ({ ...prev, ...newPreviews }));
    } finally {
      setIsGeneratingPreviews(false);
    }
  }, [selectedImage?.isReady, presets]);

  useEffect(() => {
    if (activePanel === 'presets' && selectedImage?.isReady && presets.length > 0) {
      generateRootPreviews();
      expandedFolders.forEach(folderId => {
        generateFolderPreviews(folderId);
      });
    } else if (!selectedImage?.isReady) {
      setPreviews({});
      setFolderPreviewsGenerated(new Set());
    }
  }, [activePanel, selectedImage?.isReady, presets.length, generateRootPreviews, generateFolderPreviews, expandedFolders]);

  const handleApplyPreset = (preset) => {
    setAdjustments(prevAdjustments => ({
      ...prevAdjustments,
      ...preset.adjustments,
    }));
  };

  const handleSaveCurrentSettingsAsPreset = async (name) => {
    const newPreset = addPreset(name);
    setIsAddModalOpen(false);
    if (newPreset) {
      await generateSinglePreview(newPreset);
    }
  };

  const handleAddFolder = (name) => {
    addFolder(name);
    setIsAddFolderModalOpen(false);
  };

  const handleRenamePresetSave = (newName) => {
    if (renamePresetState.preset) {
      renameItem(renamePresetState.preset.id, newName);
    }
    setRenamePresetState({ isOpen: false, preset: null });
  };

  const handleRenameFolderSave = (newName) => {
    if (renameFolderState.folder) {
      renameItem(renameFolderState.folder.id, newName);
    }
    setRenameFolderState({ isOpen: false, folder: null });
  };

  const handleDeleteItem = (id, isFolder = false) => {
    setDeletingItemId(id);
    setTimeout(() => {
      deleteItem(id);
      if (isFolder) {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        setFolderPreviewsGenerated(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    }, 300);
  };

  const handleDragStart = (event) => {
    setActiveItem(allItemsMap.get(event.active.id) || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);

    const activeId = active.id;
    const activeParentId = itemParentMap.get(activeId);
    const activeType = active.data.current?.type;

    if (!over) {
      if (activeParentId !== null) {
        movePreset(activeId, null, null);
      }
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const overId = over.id;
    const overParentId = itemParentMap.get(overId);
    const overType = over.data.current?.type;

    const targetFolderId = overType === 'folder' ? overId : overParentId;

    if (activeType === 'preset' && targetFolderId) {
      if (activeParentId !== targetFolderId) {
        movePreset(activeId, targetFolderId);
        setExpandedFolders(prev => new Set(prev).add(targetFolderId));
        if (!folderPreviewsGenerated.has(targetFolderId)) {
          generateFolderPreviews(targetFolderId);
        }
      } else {
        reorderItems(activeId, overId);
      }
      return;
    }

    if (activeParentId !== null && !targetFolderId) {
      movePreset(activeId, null, overId);
      return;
    }

    if (activeParentId === null && !targetFolderId) {
      reorderItems(activeId, overId);
      return;
    }
  };

  const handleImportPresets = async () => {
    try {
      const selectedPath = await openDialog({
        multiple: false,
        filters: [{ name: 'Preset File', extensions: ['rrpreset'] }],
        title: 'Import Presets',
      });

      if (typeof selectedPath === 'string') {
        await importPresetsFromFile(selectedPath);
        setFolderPreviewsGenerated(new Set());
        setPreviews({});
      }
    } catch (error) {
      console.error('Failed to import presets:', error);
    }
  };

  const handleExport = async (item) => {
    const isFolder = !!item.folder;
    const name = isFolder ? item.folder.name : item.preset.name;
    const itemsToExport = [item];

    try {
      const filePath = await saveDialog({
        defaultPath: `${name}.rrpreset`.replace(/[<>:"/\\|?*]/g, '_'),
        filters: [{ name: 'Preset File', extensions: ['rrpreset'] }],
        title: `Export ${isFolder ? 'Folder' : 'Preset'}`,
      });

      if (filePath) {
        await exportPresetsToFile(itemsToExport, filePath);
      }
    } catch (error) {
      console.error(`Failed to export ${isFolder ? 'folder' : 'preset'}:`, error);
    }
  };

  const handleExportAllPresets = async () => {
    if (presets.length === 0) return;
    try {
      const filePath = await saveDialog({
        defaultPath: 'all_presets.rrpreset',
        filters: [{ name: 'Preset File', extensions: ['rrpreset'] }],
        title: 'Export All Presets',
      });

      if (filePath) {
        await exportPresetsToFile(presets, filePath);
      }
    } catch (error) {
      console.error('Failed to export all presets:', error);
    }
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    
    const isFolder = !!item.folder;
    const data = isFolder ? item.folder : item.preset;

    let options = [];
    if (isFolder) {
      options = [
        {
          label: 'Rename Folder',
          icon: Edit,
          onClick: () => setRenameFolderState({ isOpen: true, folder: data }),
        },
        {
          label: 'Export Folder',
          icon: FileDown,
          onClick: () => handleExport(item),
        },
        { type: 'separator' },
        {
          label: 'Delete Folder',
          icon: Trash2,
          isDestructive: true,
          onClick: () => handleDeleteItem(data.id, true),
        },
      ];
    } else {
      options = [
        {
          label: 'Overwrite Preset',
          icon: RefreshCw,
          onClick: async () => {
            const updated = updatePreset(data.id);
            if (updated) {
              await generateSinglePreview(updated);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Rename Preset',
          icon: Edit,
          onClick: () => setRenamePresetState({ isOpen: true, preset: data }),
        },
        {
          label: 'Duplicate Preset',
          icon: CopyPlus,
          onClick: async () => {
            const duplicated = duplicatePreset(data.id);
            if (duplicated) {
              await generateSinglePreview(duplicated);
            }
          },
        },
        {
          label: 'Export Preset',
          icon: FileDown,
          onClick: () => handleExport(item),
        },
        { type: 'separator' },
        {
          label: 'Delete Preset',
          icon: Trash2,
          isDestructive: true,
          onClick: () => handleDeleteItem(data.id, false),
        },
      ];
    }
    
    showContextMenu(event.clientX, event.clientY, options);
  };

  const handleBackgroundContextMenu = (event) => {
    if (!event.currentTarget.contains(event.target)) {
      return;
    }    
    event.preventDefault();
    const options = [
      {
        label: 'New Preset',
        icon: Plus,
        onClick: () => setIsAddModalOpen(true),
      },
      {
        label: 'New Folder',
        icon: FolderPlus,
        onClick: () => setIsAddFolderModalOpen(true),
      },
      { type: 'separator' },
      {
        label: 'Sort All Alphabetically',
        icon: SortAsc,
        onClick: sortAllPresetsAlphabetically,
        disabled: presets.length === 0,
      },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const folders = useMemo(() => 
    presets.filter(item => item.folder), 
    [presets]
  );
  const rootPresets = useMemo(() => presets.filter(item => item.preset), [presets]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface">
          <h2 className="text-xl font-bold text-primary text-shadow-shiny">Presets</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleImportPresets}
              title="Import presets from .rrpreset file" 
              className="p-2 rounded-full hover:bg-surface transition-colors"
              disabled={isLoading}
            >
              <FileUp size={18} />
            </button>
            <button 
              onClick={handleExportAllPresets}
              title="Export all presets to .rrpreset file" 
              className="p-2 rounded-full hover:bg-surface transition-colors"
              disabled={presets.length === 0 || isLoading}
            >
              <FileDown size={18} />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              title="Save current settings as new preset" 
              className="p-2 rounded-full hover:bg-surface transition-colors"
              disabled={isLoading}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div 
          ref={setRootNodeRef}
          onContextMenu={handleBackgroundContextMenu}
          className={`flex-grow overflow-y-auto p-4 space-y-2 rounded-lg transition-colors ${isRootOver ? 'bg-surface-hover' : ''}`}
        >
          {isLoading && presets.length === 0 && (
            <div className="text-center text-text-secondary py-2">
              <Loader2 size={16} className="animate-spin inline-block mr-2" /> Loading Presets...
            </div>
          )}
          {!isLoading && presets.length === 0 ? (
            <div className="text-center text-text-secondary py-8">
              No presets saved yet. Right-click to create a preset or folder, or import from a file.
            </div>
          ) : (
            <>
              <AnimatePresence>
                {folders
                  .filter(item => item.folder.id !== deletingItemId)
                  .map((item, index) => (
                    <motion.div
                      key={item.folder.id}
                      layout="position"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={index}
                    >
                      <DroppableFolderItem
                        folder={item.folder}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onToggle={toggleFolder}
                        isExpanded={expandedFolders.has(item.folder.id)}
                      >
                        <AnimatePresence>
                          {item.folder.children
                            .filter(preset => preset.id !== deletingItemId)
                            .map(preset => (
                              <motion.div
                                key={preset.id}
                                layout="position"
                                exit={{ opacity: 0, x: -15, transition: { duration: 0.2 } }}
                              >
                                <DraggablePresetItem
                                  preset={preset}
                                  onApply={handleApplyPreset}
                                  onContextMenu={(e) => handleContextMenu(e, { preset })}
                                  previewUrl={previews[preset.id]}
                                  isGeneratingPreviews={isGeneratingPreviews}
                                />
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </DroppableFolderItem>
                    </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {rootPresets
                  .filter(item => item.preset.id !== deletingItemId)
                  .map((item, index) => (
                    <motion.div
                      key={item.preset.id}
                      layout="position"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      custom={folders.length + index}
                    >
                      <DraggablePresetItem
                        preset={item.preset}
                        onApply={handleApplyPreset}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        previewUrl={previews[item.preset.id]}
                        isGeneratingPreviews={isGeneratingPreviews}
                      />
                    </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
        
        <AddPresetModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveCurrentSettingsAsPreset}
        />
        <CreateFolderModal
          isOpen={isAddFolderModalOpen}
          onClose={() => setIsAddFolderModalOpen(false)}
          onSave={handleAddFolder}
        />
        <RenamePresetModal
          isOpen={renamePresetState.isOpen}
          onClose={() => setRenamePresetState({ isOpen: false, preset: null })}
          onSave={handleRenamePresetSave}
          currentName={renamePresetState.preset?.name}
        />
        <RenameFolderModal
          isOpen={renameFolderState.isOpen}
          onClose={() => setRenameFolderState({ isOpen: false, folder: null })}
          onSave={handleRenameFolderSave}
          currentName={renameFolderState.folder?.name}
        />
      </div>
      <DragOverlay>
        {activeItem ? (
          activeItem.type === 'preset' ? (
            <PresetItemDisplay
              preset={activeItem.data}
              previewUrl={previews[activeItem.data.id]}
              isGeneratingPreviews={false}
            />
          ) : (
            <FolderItemDisplay folder={activeItem.data} />
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}