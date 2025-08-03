import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import debounce from 'lodash.debounce';
import { centerCrop, makeAspectCrop } from 'react-image-crop';
import clsx from 'clsx';
import { Copy, ClipboardPaste, RotateCcw, Star, Trash2, Folder, Edit, Check, X, Undo, Redo, FolderPlus, FileEdit, CopyPlus, Aperture, Tag, FolderInput } from 'lucide-react';
import TitleBar from './window/TitleBar';
import MainLibrary from './components/panel/MainLibrary';
import FolderTree from './components/panel/FolderTree';
import Editor from './components/panel/Editor';
import Controls from './components/panel/right/ControlsPanel';
import { useThumbnails } from './hooks/useThumbnails';
import RightPanelSwitcher from './components/panel/right/RightPanelSwitcher';
import MetadataPanel from './components/panel/right/MetadataPanel';
import CropPanel from './components/panel/right/CropPanel';
import PresetsPanel from './components/panel/right/PresetsPanel';
import AIPanel from './components/panel/right/AIPanel';
import ExportPanel from './components/panel/right/ExportPanel';
import LibraryExportPanel from './components/panel/right/LibraryExportPanel';
import MasksPanel from './components/panel/right/MasksPanel';
import BottomBar from './components/panel/BottomBar';
import { ContextMenuProvider, useContextMenu } from './context/ContextMenuContext';
import CreateFolderModal from './components/modals/CreateFolderModal';
import RenameFolderModal from './components/modals/RenameFolderModal';
import ConfirmModal from './components/modals/ConfirmModal';
import ImportSettingsModal from './components/modals/ImportSettingsModal';
import RenameFileModal from './components/modals/RenameFileModal';
import { useHistoryState } from './hooks/useHistoryState';
import Resizer from './components/ui/Resizer';
import { INITIAL_ADJUSTMENTS, COPYABLE_ADJUSTMENT_KEYS, normalizeLoadedAdjustments } from './utils/adjustments';
import { generatePaletteFromImage } from './utils/palette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { THEMES, DEFAULT_THEME_ID } from './utils/themes';

const DEBUG = false;

const COLOR_LABELS = [
  { name: 'red', color: '#ef4444' },
  { name: 'yellow', color: '#facc15' },
  { name: 'green', color: '#4ade80' },
  { name: 'blue', color: '#60a5fa' },
  { name: 'purple', color: '#a78bfa' },
];

function App() {
  const [rootPath, setRootPath] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [isWindowFullScreen, setIsWindowFullScreen] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [folderTree, setFolderTree] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [imageRatings, setImageRatings] = useState({});
  const [sortCriteria, setSortCriteria] = useState({ key: 'name', order: 'asc' });
  const [filterCriteria, setFilterCriteria] = useState({ 
    rating: 0, 
    rawStatus: 'all',
    colors: [],
  });
  const [supportedTypes, setSupportedTypes] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [multiSelectedPaths, setMultiSelectedPaths] = useState([]);
  const [libraryActivePath, setLibraryActivePath] = useState(null);
  const [libraryActiveAdjustments, setLibraryActiveAdjustments] = useState(INITIAL_ADJUSTMENTS);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState(null);
  const [uncroppedAdjustedPreviewUrl, setUncroppedAdjustedPreviewUrl] = useState(null);
  const { state: historyAdjustments, setState: setHistoryAdjustments, undo: undoAdjustments, redo: redoAdjustments, canUndo, canRedo, resetHistory: resetAdjustmentsHistory } = useHistoryState(INITIAL_ADJUSTMENTS);
  const [adjustments, setLiveAdjustments] = useState(INITIAL_ADJUSTMENTS);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [histogram, setHistogram] = useState(null);
  const [waveform, setWaveform] = useState(null);
  const [isWaveformVisible, setIsWaveformVisible] = useState(false);
  const [uiVisibility, setUiVisibility] = useState({
    folderTree: true,
    filmstrip: true,
  });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false);
  const [fullScreenUrl, setFullScreenUrl] = useState(null);
  const [theme, setTheme] = useState(DEFAULT_THEME_ID);
  const [adaptivePalette, setAdaptivePalette] = useState(null);
  const [activeRightPanel, setActiveRightPanel] = useState('adjustments');
  const [activeMaskContainerId, setActiveMaskContainerId] = useState(null);
  const [activeMaskId, setActiveMaskId] = useState(null);
  const [activeAiPatchContainerId, setActiveAiPatchContainerId] = useState(null);
  const [activeAiSubMaskId, setActiveAiSubMaskId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [renderedRightPanel, setRenderedRightPanel] = useState(activeRightPanel);
  const [collapsibleSectionsState, setCollapsibleSectionsState] = useState({ basic: true, curves: true, color: false, details: false, effects: false });
  const [isLibraryExportPanelVisible, setIsLibraryExportPanelVisible] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(256);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(144);
  const [isResizing, setIsResizing] = useState(false);
  const [thumbnailSize, setThumbnailSize] = useState('medium');
  const [copiedAdjustments, setCopiedAdjustments] = useState(null);
  const [isStraightenActive, setIsStraightenActive] = useState(false);
  const [copiedFilePaths, setCopiedFilePaths] = useState([]);
  const [aiModelDownloadStatus, setAiModelDownloadStatus] = useState(null);
  const [copiedSectionAdjustments, setCopiedSectionAdjustments] = useState(null);
  const [copiedMask, setCopiedMask] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPasted, setIsPasted] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState({ current: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [brushSettings, setBrushSettings] = useState({ size: 50, feather: 50, tool: 'brush' });
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isRenameFolderModalOpen, setIsRenameFolderModalOpen] = useState(false);
  const [isRenameFileModalOpen, setIsRenameFileModalOpen] = useState(false);
  const [renameTargetPaths, setRenameTargetPaths] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetFolder, setImportTargetFolder] = useState(null);
  const [importSourcePaths, setImportSourcePaths] = useState([]);
  const [folderActionTarget, setFolderActionTarget] = useState(null);
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false });
  const [customEscapeHandler, setCustomEscapeHandler] = useState(null);
  const [isGeneratingAiMask, setIsGeneratingAiMask] = useState(false);
  const [isComfyUiConnected, setIsComfyUiConnected] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isMaskControlHovered, setIsMaskControlHovered] = useState(false);
  const { showContextMenu } = useContextMenu();
  const [thumbnails, setThumbnails] = useState({});
  useThumbnails(imageList, setThumbnails);
  const loaderTimeoutRef = useRef(null);
  const transformWrapperRef = useRef(null);
  const isProgrammaticZoom = useRef(false);
  const isInitialMount = useRef(true);
  const currentFolderPathRef = useRef(currentFolderPath);
  useEffect(() => {
    currentFolderPathRef.current = currentFolderPath;
  }, [currentFolderPath]);
  const [libraryScrollOffset, setLibraryScrollOffset] = useState(0);

  const [exportState, setExportState] = useState({
    status: 'idle',
    progress: { current: 0, total: 0 },
    errorMessage: '',
  });

  const [importState, setImportState] = useState({
    status: 'idle',
    progress: { current: 0, total: 0 },
    path: '',
    errorMessage: '',
  });

  useEffect(() => { if (!isCopied) return; const timer = setTimeout(() => setIsCopied(false), 1000); return () => clearTimeout(timer); }, [isCopied]);
  useEffect(() => { if (!isPasted) return; const timer = setTimeout(() => setIsPasted(false), 1000); return () => clearTimeout(timer); }, [isPasted]);

  const debouncedSetHistory = useCallback(debounce((newAdjustments) => setHistoryAdjustments(newAdjustments), 300), [setHistoryAdjustments]);

  const handleLibraryScroll = useCallback(({ scrollTop }) => {
      setLibraryScrollOffset(scrollTop);
  }, []);

  const setAdjustments = useCallback((value) => {
    setLiveAdjustments(prevAdjustments => {
      const newAdjustments = typeof value === 'function' ? value(prevAdjustments) : value;
      debouncedSetHistory(newAdjustments);
      return newAdjustments;
    });
  }, [debouncedSetHistory]);

  const handleStraighten = useCallback((angleCorrection) => {
    setAdjustments(prev => {
      const newRotation = (prev.rotation || 0) + angleCorrection;
      return { ...prev, rotation: newRotation, crop: null };
    });
    setIsStraightenActive(false);
  }, [setAdjustments]);

  useEffect(() => { setLiveAdjustments(historyAdjustments); }, [historyAdjustments]);

  useEffect(() => {
    if (activeRightPanel !== 'masks' || !activeMaskContainerId) {
      if (activeRightPanel !== 'ai' || !activeAiPatchContainerId) {
        setIsMaskControlHovered(false);
      }
    }
  }, [activeRightPanel, activeMaskContainerId, activeAiPatchContainerId]);

  const undo = useCallback(() => { if (canUndo) { undoAdjustments(); debouncedSetHistory.cancel(); } }, [canUndo, undoAdjustments, debouncedSetHistory]);
  const redo = useCallback(() => { if (canRedo) { redoAdjustments(); debouncedSetHistory.cancel(); } }, [canRedo, redoAdjustments, debouncedSetHistory]);

  useEffect(() => {
    const unlisten = listen('comfyui-status-update', (event) => {
      setIsComfyUiConnected(event.payload.connected);
    });
    invoke('check_comfyui_status');
    const interval = setInterval(() => invoke('check_comfyui_status'), 3000);
    return () => {
      clearInterval(interval);
      unlisten.then(f => f());
    };
  }, []);

  const updateSubMask = (subMaskId, updatedData) => {
    setAdjustments(prev => ({
      ...prev,
      masks: prev.masks.map(c => ({
        ...c,
        subMasks: c.subMasks.map(sm => sm.id === subMaskId ? { ...sm, ...updatedData } : sm)
      })),
      aiPatches: (prev.aiPatches || []).map(p => ({
        ...p,
        subMasks: p.subMasks.map(sm => sm.id === subMaskId ? { ...sm, ...updatedData } : sm)
      }))
    }));
  };

  const handleGenerativeReplace = useCallback(async (patchId, prompt) => {
    if (!selectedImage?.path || isGeneratingAi) return;

    const patch = adjustments.aiPatches.find(p => p.id === patchId);
    if (!patch) {
      console.error("Could not find AI patch to generate for:", patchId);
      return;
    }

    const patchDefinition = { ...patch, prompt };

    setAdjustments(prev => ({
      ...prev,
      aiPatches: prev.aiPatches.map(p => p.id === patchId ? { ...p, isLoading: true, prompt } : p)
    }));
    setIsGeneratingAi(true);

    try {
      const newPatchBase64 = await invoke('invoke_generative_replace_with_mask_def', {
        path: selectedImage.path,
        patchDefinition: patchDefinition,
        currentAdjustments: adjustments,
      });

      setAdjustments(prev => ({
        ...prev,
        aiPatches: prev.aiPatches.map(p =>
          p.id === patchId
            ? {
                ...p,
                patchDataBase64: newPatchBase64,
                isLoading: false,
                name: (prompt && prompt.trim()) ? prompt.trim() : p.name,
              }
            : p
        )
      }));
      setActiveAiPatchContainerId(null);
      setActiveAiSubMaskId(null);

    } catch (err) {
      console.error("Generative replace failed:", err);
      setError(`AI Replace Failed: ${err}`);
      setAdjustments(prev => ({
        ...prev,
        aiPatches: prev.aiPatches.map(p => p.id === patchId ? { ...p, isLoading: false } : p)
      }));
    } finally {
      setIsGeneratingAi(false);
    }
  }, [selectedImage?.path, isGeneratingAi, adjustments, setAdjustments, setActiveAiPatchContainerId, setActiveAiSubMaskId]);

  const handleDeleteAiPatch = useCallback((patchId) => {
    setAdjustments(prev => ({
      ...prev,
      aiPatches: (prev.aiPatches || []).filter(p => p.id !== patchId)
    }));
    if (activeAiPatchContainerId === patchId) {
      setActiveAiPatchContainerId(null);
      setActiveAiSubMaskId(null);
    }
  }, [setAdjustments, activeAiPatchContainerId]);

  const handleToggleAiPatchVisibility = useCallback((patchId) => {
    setAdjustments(prev => ({
      ...prev,
      aiPatches: (prev.aiPatches || []).map(p => 
        p.id === patchId ? { ...p, visible: !p.visible } : p
      )
    }));
  }, [setAdjustments]);

  const handleGenerateAiMask = async (subMaskId, startPoint, endPoint) => {
    if (!selectedImage?.path) {
      console.error("Cannot generate AI mask: No image selected.");
      return;
    }
    setIsGeneratingAiMask(true);
    try {
      const newParameters = await invoke('generate_ai_subject_mask', {
        path: selectedImage.path,
        startPoint: [startPoint.x, startPoint.y],
        endPoint: [endPoint.x, endPoint.y],
        rotation: adjustments.rotation,
        flipHorizontal: adjustments.flipHorizontal,
        flipVertical: adjustments.flipVertical,
        orientationSteps: adjustments.orientationSteps,
      });

      updateSubMask(subMaskId, { parameters: newParameters });

    } catch (error) {
      console.error("Failed to generate AI subject mask:", error);
      setError(`AI Mask Failed: ${error}`);
    } finally {
      setIsGeneratingAiMask(false);
    }
  };

  const handleGenerateAiForegroundMask = async (subMaskId) => {
    if (!selectedImage?.path) {
      console.error("Cannot generate AI mask: No image selected.");
      return;
    }
    setIsGeneratingAiMask(true);
    try {
      const newParameters = await invoke('generate_ai_foreground_mask', {
        rotation: adjustments.rotation,
        flipHorizontal: adjustments.flipHorizontal,
        flipVertical: adjustments.flipVertical,
        orientationSteps: adjustments.orientationSteps,
      });

      updateSubMask(subMaskId, { parameters: newParameters });

    } catch (error) {
      console.error("Failed to generate AI foreground mask:", error);
      setError(`AI Mask Failed: ${error}`);
    } finally {
      setIsGeneratingAiMask(false);
    }
  };

  const sortedImageList = useMemo(() => {
    const filteredList = imageList.filter(image => {
      if (filterCriteria.rating > 0) {
        const rating = imageRatings[image.path] || 0;
        if (filterCriteria.rating === 5) {
          if (rating !== 5) return false;
        } else {
          if (rating < filterCriteria.rating) return false;
        }
      }

      if (filterCriteria.rawStatus && filterCriteria.rawStatus !== 'all' && supportedTypes) {
        const extension = image.path.split('.').pop()?.toLowerCase() || '';
        const isRaw = supportedTypes.raw.includes(extension);
        
        if (filterCriteria.rawStatus === 'rawOnly' && !isRaw) {
          return false;
        }
        if (filterCriteria.rawStatus === 'nonRawOnly' && isRaw) {
          return false;
        }
      }

      if (filterCriteria.colors && filterCriteria.colors.length > 0) {
        const imageColor = (image.tags || [])
          .find(tag => tag.startsWith('color:'))
          ?.substring(6);

        const hasMatchingColor = imageColor && filterCriteria.colors.includes(imageColor);
        const matchesNone = !imageColor && filterCriteria.colors.includes('none');

        if (!hasMatchingColor && !matchesNone) {
          return false;
        }
      }

      return true;
    });

    const filteredBySearch = searchQuery.trim() === ''
      ? filteredList
      : filteredList.filter(image => 
          image.tags && image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const list = [...filteredBySearch];
    list.sort((a, b) => {
        const { key, order } = sortCriteria;
        let comparison = 0;
        if (key === 'date') comparison = a.modified - b.modified;
        else if (key === 'rating') comparison = (imageRatings[a.path] || 0) - (imageRatings[b.path] || 0);
        else comparison = a.path.localeCompare(b.path);
        return order === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [imageList, sortCriteria, imageRatings, filterCriteria, supportedTypes, searchQuery]);

  const applyAdjustments = useCallback(debounce((currentAdjustments) => {
    if (!selectedImage?.isReady) return;
    setIsAdjusting(true);
    setError(null);
    invoke('apply_adjustments', { jsAdjustments: currentAdjustments }).catch(err => {
      console.error("Failed to invoke apply_adjustments:", err);
      setError(`Processing failed: ${err}`);
      setIsAdjusting(false);
    });
  }, 50), [selectedImage?.isReady]);

  const debouncedGenerateUncroppedPreview = useCallback(debounce((currentAdjustments) => {
    if (!selectedImage?.isReady) return;
    invoke('generate_uncropped_preview', { jsAdjustments: currentAdjustments }).catch(err => console.error("Failed to generate uncropped preview:", err));
  }, 50), [selectedImage?.isReady]);

  const debouncedSave = useCallback(debounce((path, adjustmentsToSave) => {
    invoke('save_metadata_and_update_thumbnail', { path, adjustments: adjustmentsToSave }).catch(err => {
        console.error("Auto-save failed:", err);
        setError(`Failed to save changes: ${err}`);
    });
  }, 300), []);

  const createResizeHandler = useCallback((setter, startSize) => (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const doDrag = (moveEvent) => {
        if (setter === setLeftPanelWidth) setter(Math.max(200, Math.min(startSize + (moveEvent.clientX - startX), 500)));
        else if (setter === setRightPanelWidth) setter(Math.max(280, Math.min(startSize - (moveEvent.clientX - startX), 600)));
        else if (setter === setBottomPanelHeight) setter(Math.max(100, Math.min(startSize - (moveEvent.clientY - startY), 400)));
    };
    const stopDrag = () => {
        document.documentElement.style.cursor = '';
        window.removeEventListener('mousemove', doDrag);
        window.removeEventListener('mouseup', stopDrag);
        setIsResizing(false);
    };
    document.documentElement.style.cursor = setter === setBottomPanelHeight ? 'row-resize' : 'col-resize';
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  }, []);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    const checkFullscreen = async () => {
      setIsWindowFullScreen(await appWindow.isFullscreen());
    };
    checkFullscreen();

    const unlistenPromise = appWindow.onResized(checkFullscreen);

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  const handleRightPanelSelect = useCallback((panelId) => {
    if (panelId === activeRightPanel) {
      setActiveRightPanel(null);
    } else {
      setActiveRightPanel(panelId);
      setRenderedRightPanel(panelId);
    }
    setActiveMaskId(null);
    setActiveAiSubMaskId(null);
  }, [activeRightPanel]);

  const handleSettingsChange = useCallback((newSettings) => {
      if (!newSettings) {
        console.error("handleSettingsChange was called with null settings. Aborting save operation.");
        return;
      }
      if (newSettings.theme && newSettings.theme !== theme) {
        setTheme(newSettings.theme);
      }
      setAppSettings(newSettings);
      invoke('save_settings', { settings: newSettings }).catch(err => {
          console.error("Failed to save settings:", err)
      });
  }, [theme]);

  useEffect(() => {
    invoke('load_settings')
      .then(settings => {
        setAppSettings(settings);
        if (settings?.sortCriteria) setSortCriteria(settings.sortCriteria);
        if (settings?.filterCriteria) {
          setFilterCriteria(prev => ({
            ...prev,
            ...settings.filterCriteria,
            rawStatus: settings.filterCriteria.rawStatus || 'all',
            colors: settings.filterCriteria.colors || [],
          }));
        }
        if (settings?.theme) {
          setTheme(settings.theme);
        }
        if (settings?.uiVisibility) {
          setUiVisibility(prev => ({ ...prev, ...settings.uiVisibility }));
        }
        if (settings?.thumbnailSize) {
          setThumbnailSize(settings.thumbnailSize);
        }
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setAppSettings({ lastRootPath: null, theme: DEFAULT_THEME_ID });
      })
      .finally(() => { isInitialMount.current = false; });
  }, []);

  useEffect(() => {
    if (isInitialMount.current || !appSettings) return;
    if (JSON.stringify(appSettings.uiVisibility) !== JSON.stringify(uiVisibility)) {
        handleSettingsChange({ ...appSettings, uiVisibility });
    }
  }, [uiVisibility, appSettings, handleSettingsChange]);

  useEffect(() => {
    if (isInitialMount.current || !appSettings) return;
    if (appSettings.thumbnailSize !== thumbnailSize) {
        handleSettingsChange({ ...appSettings, thumbnailSize });
    }
  }, [thumbnailSize, appSettings, handleSettingsChange]);

  useEffect(() => {
    invoke('get_supported_file_types')
      .then(types => setSupportedTypes(types))
      .catch(err => console.error('Failed to load supported file types:', err));
  }, []);

  useEffect(() => {
    if (isInitialMount.current || !appSettings) return;
    if (JSON.stringify(appSettings.sortCriteria) !== JSON.stringify(sortCriteria)) {
        handleSettingsChange({ ...appSettings, sortCriteria });
    }
  }, [sortCriteria, appSettings, handleSettingsChange]);

  useEffect(() => {
    if (isInitialMount.current || !appSettings) return;
    if (JSON.stringify(appSettings.filterCriteria) !== JSON.stringify(filterCriteria)) {
        handleSettingsChange({ ...appSettings, filterCriteria });
    }
  }, [filterCriteria, appSettings, handleSettingsChange]);

  useEffect(() => {
    if (appSettings?.adaptiveEditorTheme && selectedImage && finalPreviewUrl) {
      generatePaletteFromImage(finalPreviewUrl)
        .then(setAdaptivePalette)
        .catch(err => {
          const darkTheme = THEMES.find(t => t.id === 'dark');
          setAdaptivePalette(darkTheme ? darkTheme.cssVariables : null);
        });
    } else if (!appSettings?.adaptiveEditorTheme || !selectedImage) {
      setAdaptivePalette(null);
    }
  }, [appSettings?.adaptiveEditorTheme, selectedImage, finalPreviewUrl]);

  useEffect(() => {
    const root = document.documentElement;
    const currentThemeId = theme || DEFAULT_THEME_ID;
    
    const baseTheme = THEMES.find(t => t.id === currentThemeId) || THEMES.find(t => t.id === DEFAULT_THEME_ID);
    if (!baseTheme) return;

    let finalCssVariables = { ...baseTheme.cssVariables };
    let effectThemeForWindow = baseTheme.id;

    if (adaptivePalette) {
        finalCssVariables = { ...finalCssVariables, ...adaptivePalette };
    }

    Object.entries(finalCssVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    const isLight = ['light', 'snow', 'arctic'].includes(effectThemeForWindow);
    invoke('update_window_effect', { theme: isLight ? 'light' : 'dark' });

  }, [theme, adaptivePalette]);

  const handleRefreshFolderTree = useCallback(async () => {
    if (!rootPath) return;
    try {
      const treeData = await invoke('get_folder_tree', { path: rootPath });
      setFolderTree(treeData);
    } catch (err) {
      console.error("Failed to refresh folder tree:", err);
      setError(`Failed to refresh folder tree: ${err}.`);
    }
  }, [rootPath]);

  const handleSelectSubfolder = useCallback(async (path, isNewRoot = false) => {
    setIsViewLoading(true);
    setSearchQuery('');
    setLibraryScrollOffset(0);
    try {
      setCurrentFolderPath(path);

      if (isNewRoot) {
        setExpandedFolders(new Set([path]));
      } else if (rootPath && path !== rootPath) {
          setExpandedFolders(prev => {
              const newSet = new Set(prev);
              let current = path;
              const separator = current.includes('/') ? '/' : '\\';

              const lastSeparatorIndex = current.lastIndexOf(separator);
              if (lastSeparatorIndex > -1 && lastSeparatorIndex >= rootPath.length) {
                  current = current.substring(0, lastSeparatorIndex);
              } else {
                  current = null;
              }

              while (current && current.startsWith(rootPath) && current !== rootPath) {
                  newSet.add(current);
                  const parentSeparatorIndex = current.lastIndexOf(separator);
                  if (parentSeparatorIndex === -1 || parentSeparatorIndex < rootPath.length) break;
                  current = current.substring(0, parentSeparatorIndex);
              }
              newSet.add(rootPath);
              return newSet;
          });
      }

      const imageListPromise = invoke('list_images_in_dir', { path });
      if (isNewRoot) {
        setIsTreeLoading(true);
        handleSettingsChange({ ...appSettings, lastRootPath: path });
        try {
          const treeData = await invoke('get_folder_tree', { path });
          setFolderTree(treeData);
        } catch (err) {
          console.error("Failed to load folder tree:", err);
          setError(`Failed to load folder tree: ${err}. Some sub-folders might be inaccessible.`);
        } finally {
          setIsTreeLoading(false);
        }
      }
      const [files] = await Promise.all([imageListPromise]);
      setImageList(files);
      setImageRatings({});
      setMultiSelectedPaths([]);
      setLibraryActivePath(null);
      if (selectedImage) {
        setSelectedImage(null);
        setFinalPreviewUrl(null);
        setUncroppedAdjustedPreviewUrl(null);
        setHistogram(null);
      }
      invoke('start_background_indexing', { folderPath: path }).catch(err => {
        console.error("Failed to start background indexing:", err);
      });
    } catch (err) {
      console.error("Failed to load folder contents:", err);
      setError("Failed to load images from the selected folder.");
      setIsTreeLoading(false);
    } finally {
      setIsViewLoading(false);
    }
  }, [appSettings, handleSettingsChange, selectedImage, rootPath]);

  const handleLibraryRefresh = useCallback(() => {
    if (currentFolderPath) handleSelectSubfolder(currentFolderPath, false);
  }, [currentFolderPath, handleSelectSubfolder]);

  const handleToggleFolder = useCallback((path) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
      if (isInitialMount.current || !appSettings || !rootPath) return;

      const newFolderState = {
          currentFolderPath,
          expandedFolders: Array.from(expandedFolders),
      };

      if (JSON.stringify(appSettings.lastFolderState) === JSON.stringify(newFolderState)) {
          return;
      }

      handleSettingsChange({ ...appSettings, lastFolderState: newFolderState });
  }, [currentFolderPath, expandedFolders, rootPath, appSettings, handleSettingsChange]);

  useEffect(() => {
    const handleGlobalContextMenu = (event) => { if (!DEBUG) event.preventDefault(); };
    window.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => window.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  const handleBackToLibrary = useCallback(() => {
    const lastActivePath = selectedImage?.path;
    setSelectedImage(null);
    setFinalPreviewUrl(null);
    setUncroppedAdjustedPreviewUrl(null);
    setHistogram(null);
    setWaveform(null);
    setIsWaveformVisible(false);
    setActiveMaskId(null);
    setActiveMaskContainerId(null);
    setActiveAiPatchContainerId(null);
    setActiveAiSubMaskId(null);
    setLibraryActivePath(lastActivePath);
  }, [selectedImage?.path]);

  const executeDelete = useCallback(async (pathsToDelete, options = { includeAssociated: false }) => {
    if (!pathsToDelete || pathsToDelete.length === 0) return;
    try {
        const command = options.includeAssociated ? 'delete_files_with_associated' : 'delete_files_from_disk';
        await invoke(command, { paths: pathsToDelete });

        handleLibraryRefresh();
        if (selectedImage && pathsToDelete.some(p => selectedImage.path.startsWith(p.substring(0, p.lastIndexOf('.'))))) {
            handleBackToLibrary();
        }
        setMultiSelectedPaths([]);
        if (libraryActivePath && pathsToDelete.includes(libraryActivePath)) {
            setLibraryActivePath(null);
        }
    } catch (err) {
        console.error("Failed to delete files:", err);
        setError(`Failed to delete files: ${err}`);
    }
  }, [handleLibraryRefresh, selectedImage, handleBackToLibrary, libraryActivePath]);

  const handleDeleteSelected = useCallback(() => {
    const pathsToDelete = multiSelectedPaths;
    if (pathsToDelete.length === 0) return;
    const isSingle = pathsToDelete.length === 1;
    setConfirmModalState({
        isOpen: true,
        title: 'Confirm Delete',
        message: `Are you sure you want to permanently delete ${isSingle ? 'this image' : `${pathsToDelete.length} images`}? This action cannot be undone. Right-click for more options (e.g., deleting associated RAW/JPEG files).`,
        confirmText: 'Delete Selected Only',
        confirmVariant: 'destructive',
        onConfirm: () => executeDelete(pathsToDelete, { includeAssociated: false })
    });
  }, [multiSelectedPaths, executeDelete]);

  const handleToggleFullScreen = useCallback(() => {
    if (isFullScreen) {
      setIsFullScreen(false);
      setFullScreenUrl(null);
    } else {
      if (!selectedImage) return;
      setIsFullScreen(true);
    }
  }, [isFullScreen, selectedImage]);

  useEffect(() => {
    if (!isFullScreen || !selectedImage?.isReady) {
      return;
    }

    const generate = async () => {
      setIsFullScreenLoading(true);
      try {
        const url = await invoke('generate_fullscreen_preview', { jsAdjustments: adjustments });
        setFullScreenUrl(url);
      } catch (e) {
        console.error("Failed to generate fullscreen preview:", e);
        setError("Failed to generate full screen preview.");
      } finally {
        setIsFullScreenLoading(false);
      }
    };
    generate();
  }, [isFullScreen, selectedImage?.path, selectedImage?.isReady, adjustments]);

  const handleCopyAdjustments = useCallback(() => {
    const sourceAdjustments = selectedImage ? adjustments : libraryActiveAdjustments;
    const adjustmentsToCopy = {};
    for (const key of COPYABLE_ADJUSTMENT_KEYS) {
      if (sourceAdjustments.hasOwnProperty(key)) adjustmentsToCopy[key] = sourceAdjustments[key];
    }
    setCopiedAdjustments(adjustmentsToCopy);
    setIsCopied(true);
  }, [selectedImage, adjustments, libraryActiveAdjustments]);

  const handlePasteAdjustments = useCallback((paths) => {
    if (!copiedAdjustments) return;
    const pathsToUpdate = paths || (multiSelectedPaths.length > 0 ? multiSelectedPaths : (selectedImage ? [selectedImage.path] : []));
    if (pathsToUpdate.length === 0) return;
    
    if (selectedImage && pathsToUpdate.includes(selectedImage.path)) {
      const newAdjustments = { ...adjustments, ...copiedAdjustments };
      setAdjustments(newAdjustments);
    }

    invoke('apply_adjustments_to_paths', { paths: pathsToUpdate, adjustments: copiedAdjustments })
      .catch(err => {
        console.error("Failed to paste adjustments to multiple images:", err);
        setError(`Failed to paste adjustments: ${err}`);
      });
    setIsPasted(true);
  }, [copiedAdjustments, multiSelectedPaths, selectedImage, adjustments, setAdjustments]);

  const handleAutoAdjustments = async () => {
    if (!selectedImage) return;
    try {
      const autoAdjustments = await invoke('calculate_auto_adjustments');
      setAdjustments(prev => {
        const newAdjustments = { ...prev, ...autoAdjustments };
        newAdjustments.sectionVisibility = {
          ...prev.sectionVisibility,
          ...autoAdjustments.sectionVisibility,
        };

        return newAdjustments;
      });
    } catch (err) {
      console.error("Failed to calculate auto adjustments:", err);
      setError(`Failed to apply auto adjustments: ${err}`);
    }
  };

  const handleRate = useCallback((newRating, paths) => {
    const pathsToRate = paths || (multiSelectedPaths.length > 0 ? multiSelectedPaths : (selectedImage ? [selectedImage.path] : []));
    if (pathsToRate.length === 0) return;

    let currentRating = 0;
    if (selectedImage && pathsToRate.includes(selectedImage.path)) {
        currentRating = adjustments.rating;
    } else if (libraryActivePath && pathsToRate.includes(libraryActivePath)) {
        currentRating = libraryActiveAdjustments.rating;
    }

    const finalRating = newRating === currentRating ? 0 : newRating;

    setImageRatings(prev => {
      const newRatings = { ...prev };
      pathsToRate.forEach(path => { newRatings[path] = finalRating; });
      return newRatings;
    });

    if (selectedImage && pathsToRate.includes(selectedImage.path)) {
      setAdjustments(prev => ({ ...prev, rating: finalRating }));
    }

    if (libraryActivePath && pathsToRate.includes(libraryActivePath)) {
      setLibraryActiveAdjustments(prev => ({ ...prev, rating: finalRating }));
    }

    invoke('apply_adjustments_to_paths', { paths: pathsToRate, adjustments: { rating: finalRating } })
      .catch(err => {
        console.error("Failed to apply rating to paths:", err);
        setError(`Failed to apply rating: ${err}`);
      });
  }, [multiSelectedPaths, selectedImage, libraryActivePath, adjustments.rating, libraryActiveAdjustments.rating, setAdjustments]);

const handleSetColorLabel = useCallback(async (color, paths) => {
    const pathsToUpdate = paths || (multiSelectedPaths.length > 0 ? multiSelectedPaths : (selectedImage ? [selectedImage.path] : []));
    if (pathsToUpdate.length === 0) return;
    const primaryPath = selectedImage?.path || libraryActivePath;
    const primaryImage = imageList.find(img => img.path === primaryPath);
    let currentColor = null;
    if (primaryImage && primaryImage.tags) {
      const colorTag = primaryImage.tags.find(tag => tag.startsWith('color:'));
      if (colorTag) {
        currentColor = colorTag.substring(6);
      }
    }
    const finalColor = color !== null && color === currentColor ? null : color;
    try {
      await invoke('set_color_label_for_paths', { paths: pathsToUpdate, color: finalColor });
      
      setImageList(prevList => prevList.map(image => {
        if (pathsToUpdate.includes(image.path)) {
          const otherTags = (image.tags || []).filter(t => !t.startsWith('color:'));
          const newTags = finalColor ? [...otherTags, `color:${finalColor}`] : otherTags;
          return { ...image, tags: newTags };
        }
        return image;
      }));
    } catch (err) {
      console.error("Failed to set color label:", err);
      setError(`Failed to set color label: ${err}`);
    }
  }, [multiSelectedPaths, selectedImage, libraryActivePath, imageList]);

  const closeConfirmModal = () => setConfirmModalState({ ...confirmModalState, isOpen: false });

  const handlePasteFiles = useCallback(async (mode = 'copy') => {
    if (copiedFilePaths.length === 0 || !currentFolderPath) return;
    try {
        if (mode === 'copy') await invoke('copy_files', { sourcePaths: copiedFilePaths, destinationFolder: currentFolderPath });
        else { await invoke('move_files', { sourcePaths: copiedFilePaths, destinationFolder: currentFolderPath }); setCopiedFilePaths([]); }
        handleLibraryRefresh();
    } catch (err) {
        setError(`Failed to ${mode} files: ${err}`);
    }
  }, [copiedFilePaths, currentFolderPath, handleLibraryRefresh]);

  const handleZoomChange = useCallback((newZoomValue) => {
    isProgrammaticZoom.current = true;
    setZoom(newZoomValue);
  }, []);

  const handleUserTransform = useCallback((transformState) => {
    if (isProgrammaticZoom.current) {
      isProgrammaticZoom.current = false;
      return;
    }

    setZoom(transformState.scale);
  }, []);

  const handleImageSelect = useCallback((path) => {
    if (selectedImage?.path === path) return;
    applyAdjustments.cancel();
    debouncedSave.cancel();
    setSelectedImage({ path, thumbnailUrl: thumbnails[path], isReady: false, originalUrl: null, width: 0, height: 0, metadata: null, exif: null, isRaw: false });
    setMultiSelectedPaths([path]);
    setLibraryActivePath(null);
    setIsViewLoading(true);
    setError(null);
    setHistogram(null);
    setFinalPreviewUrl(null);
    setUncroppedAdjustedPreviewUrl(null);
    setFullScreenUrl(null);
    setLiveAdjustments(INITIAL_ADJUSTMENTS);
    resetAdjustmentsHistory(INITIAL_ADJUSTMENTS);
    setShowOriginal(false);
    setActiveMaskId(null);
    setActiveMaskContainerId(null);
    setActiveAiPatchContainerId(null);
    setActiveAiSubMaskId(null);
    if (transformWrapperRef.current) transformWrapperRef.current.resetTransform(0);
    setZoom(1);
    setIsLibraryExportPanelVisible(false);
  }, [selectedImage?.path, applyAdjustments, debouncedSave, thumbnails, resetAdjustmentsHistory]);

  useKeyboardShortcuts({
    selectedImage,
    isViewLoading,
    sortedImageList,
    multiSelectedPaths,
    libraryActivePath,
    zoom,
    canUndo,
    canRedo,
    activeRightPanel,
    isFullScreen,
    activeMaskId,
    customEscapeHandler,
    copiedFilePaths,
    handleImageSelect,
    isStraightenActive,
    setIsStraightenActive,
    setLibraryActivePath,
    setMultiSelectedPaths,
    handleRate,
    handleSetColorLabel,
    handleDeleteSelected,
    handleCopyAdjustments,
    handlePasteAdjustments,
    handlePasteFiles,
    setCopiedFilePaths,
    undo,
    redo,
    handleBackToLibrary,
    handleToggleFullScreen,
    setShowOriginal,
    handleRightPanelSelect,
    setIsWaveformVisible,
    handleZoomChange,
    setActiveMaskId,
    activeAiSubMaskId,
    setActiveAiSubMaskId,
  });

  useEffect(() => {
    let isEffectActive = true;
    const listeners = [
      listen('preview-update-final', (event) => { if (isEffectActive) { setFinalPreviewUrl(event.payload); setIsAdjusting(false); } }),
      listen('preview-update-uncropped', (event) => { if (isEffectActive) setUncroppedAdjustedPreviewUrl(event.payload); }),
      listen('histogram-update', (event) => { if (isEffectActive) setHistogram(event.payload); }),
      listen('waveform-update', (event) => { if (isEffectActive) setWaveform(event.payload); }),
      listen('thumbnail-generated', (event) => {
        if (isEffectActive) {
          const { path, data, rating } = event.payload;
          if (data) {
            setThumbnails(prev => ({ ...prev, [path]: data }));
          }
          if (rating !== undefined) {
            setImageRatings(prev => ({ ...prev, [path]: rating }));
          }
        }
      }),
      listen('ai-model-download-start', (event) => { if (isEffectActive) setAiModelDownloadStatus(event.payload); }),
      listen('ai-model-download-finish', () => { if (isEffectActive) setAiModelDownloadStatus(null); }),
      listen('indexing-started', () => { 
        if (isEffectActive) { 
          setIsIndexing(true); 
          setIndexingProgress({ current: 0, total: 0 });
        } 
      }),
      listen('indexing-progress', (event) => {
        if (isEffectActive) {
          setIndexingProgress(event.payload);
        }
      }),
      listen('indexing-finished', () => {
        if (isEffectActive) {
          setIsIndexing(false);
          setIndexingProgress({ current: 0, total: 0 });
          if (currentFolderPathRef.current) {
            invoke('list_images_in_dir', { path: currentFolderPathRef.current })
              .then(setImageList)
              .catch(err => console.error("Failed to refresh after indexing:", err));
          }
        }
      }),
      listen('batch-export-progress', (event) => {
        if (isEffectActive) {
          setExportState(prev => ({ ...prev, progress: event.payload }));
        }
      }),
      listen('export-complete', () => {
        if (isEffectActive) {
          setExportState(prev => ({ ...prev, status: 'success' }));
        }
      }),
      listen('export-error', (event) => {
        if (isEffectActive) {
          setExportState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: typeof event.payload === 'string' ? event.payload : 'An unknown export error occurred.'
          }));
        }
      }),
      listen('export-cancelled', () => {
        if (isEffectActive) {
          setExportState(prev => ({ ...prev, status: 'cancelled' }));
        }
      }),
      listen('import-start', (event) => {
        if (isEffectActive) {
          setImportState({ status: 'importing', progress: { current: 0, total: event.payload.total }, path: '', errorMessage: '' });
        }
      }),
      listen('import-progress', (event) => {
        if (isEffectActive) {
          setImportState(prev => ({ ...prev, progress: { current: event.payload.current, total: event.payload.total }, path: event.payload.path }));
        }
      }),
      listen('import-complete', () => {
        if (isEffectActive) {
          setImportState(prev => ({ ...prev, status: 'success' }));
          handleRefreshFolderTree();
          if (currentFolderPathRef.current) {
            handleSelectSubfolder(currentFolderPathRef.current, false);
          }
        }
      }),
      listen('import-error', (event) => {
        if (isEffectActive) {
          setImportState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: typeof event.payload === 'string' ? event.payload : 'An unknown import error occurred.'
          }));
        }
      }),
    ];
    return () => { isEffectActive = false; listeners.forEach(p => p.then(unlisten => unlisten())); if (loaderTimeoutRef.current) clearTimeout(loaderTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (['success', 'error', 'cancelled'].includes(exportState.status)) {
      const timer = setTimeout(() => {
        setExportState({ status: 'idle', progress: { current: 0, total: 0 }, errorMessage: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [exportState.status]);

  useEffect(() => {
    if (['success', 'error'].includes(importState.status)) {
      const timer = setTimeout(() => {
        setImportState({ status: 'idle', progress: { current: 0, total: 0 }, path: '', errorMessage: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [importState.status]);

  useEffect(() => {
    if (libraryActivePath) {
      invoke('load_metadata', { path: libraryActivePath })
        .then(metadata => {
          if (metadata.adjustments && !metadata.adjustments.is_null) {
            const normalized = normalizeLoadedAdjustments(metadata.adjustments);
            setLibraryActiveAdjustments(normalized);
          } else {
            setLibraryActiveAdjustments(INITIAL_ADJUSTMENTS);
          }
        })
        .catch(err => { console.error("Failed to load metadata for library active image", err); setLibraryActiveAdjustments(INITIAL_ADJUSTMENTS); });
    } else {
      setLibraryActiveAdjustments(INITIAL_ADJUSTMENTS);
    }
  }, [libraryActivePath]);

  useEffect(() => {
    if (selectedImage?.isReady) { applyAdjustments(adjustments); debouncedSave(selectedImage.path, adjustments); }
    return () => { applyAdjustments.cancel(); debouncedSave.cancel(); }
  }, [adjustments, selectedImage?.path, selectedImage?.isReady, applyAdjustments, debouncedSave]);

  useEffect(() => {
    if (activeRightPanel === 'crop' && selectedImage?.isReady) debouncedGenerateUncroppedPreview(adjustments);
    return () => debouncedGenerateUncroppedPreview.cancel();
  }, [adjustments, activeRightPanel, selectedImage?.isReady, debouncedGenerateUncroppedPreview]);

  const handleOpenFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, defaultPath: await homeDir() });
      if (typeof selected === 'string') { setRootPath(selected); await handleSelectSubfolder(selected, true); }
    } catch (err) { console.error("Failed to open directory dialog:", err); setError("Failed to open folder selection dialog."); }
  };

  const handleContinueSession = () => {
    const restore = async () => {
      if (!appSettings?.lastRootPath) return;

      const root = appSettings.lastRootPath;
      const folderState = appSettings.lastFolderState;
      const pathToSelect = folderState?.currentFolderPath && folderState.currentFolderPath.startsWith(root)
          ? folderState.currentFolderPath
          : root;

      setRootPath(root);

      if (folderState?.expandedFolders) {
          const newExpandedFolders = new Set(folderState.expandedFolders);
          newExpandedFolders.add(root);
          setExpandedFolders(newExpandedFolders);
      } else {
          setExpandedFolders(new Set([root]));
      }

      setIsTreeLoading(true);
      try {
          const treeData = await invoke('get_folder_tree', { path: root });
          setFolderTree(treeData);
      } catch (err) {
          console.error("Failed to load folder tree:", err);
          setError(`Failed to load folder tree: ${err}.`);
      } finally {
          setIsTreeLoading(false);
      }

      await handleSelectSubfolder(pathToSelect, false);
    };
    restore().catch(err => {
        console.error("Failed to restore session:", err);
        setError("Failed to restore session.");
    });
  };

  const handleGoHome = () => {
    setRootPath(null); setCurrentFolderPath(null); setImageList([]); setImageRatings({}); setFolderTree(null); setMultiSelectedPaths([]); setLibraryActivePath(null); setIsLibraryExportPanelVisible(false);
    setExpandedFolders(new Set());
  };

  const handleMultiSelectClick = (path, event, options) => {
    const { ctrlKey, metaKey, shiftKey } = event;
    const isCtrlPressed = ctrlKey || metaKey;
    const { shiftAnchor, onSimpleClick, updateLibraryActivePath } = options;
    if (shiftKey && shiftAnchor) {
      const lastIndex = sortedImageList.findIndex(f => f.path === shiftAnchor);
      const currentIndex = sortedImageList.findIndex(f => f.path === path);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const range = sortedImageList.slice(start, end + 1).map(f => f.path);
        const baseSelection = isCtrlPressed ? multiSelectedPaths : [shiftAnchor];
        const newSelection = Array.from(new Set([...baseSelection, ...range]));
        setMultiSelectedPaths(newSelection);
        if (updateLibraryActivePath) setLibraryActivePath(path);
      }
    } else if (isCtrlPressed) {
      const newSelection = new Set(multiSelectedPaths);
      if (newSelection.has(path)) newSelection.delete(path); else newSelection.add(path);
      const newSelectionArray = Array.from(newSelection);
      setMultiSelectedPaths(newSelectionArray);
      if (updateLibraryActivePath) {
        if (newSelectionArray.includes(path)) setLibraryActivePath(path);
        else if (newSelectionArray.length > 0) setLibraryActivePath(newSelectionArray[newSelectionArray.length - 1]);
        else setLibraryActivePath(null);
      }
    } else onSimpleClick(path);
  };

  const handleLibraryImageSingleClick = (path, event) => {
    handleMultiSelectClick(path, event, { shiftAnchor: libraryActivePath, updateLibraryActivePath: true, onSimpleClick: (p) => { setMultiSelectedPaths([p]); setLibraryActivePath(p); } });
  };

  const handleImageClick = (path, event) => {
    const inEditor = !!selectedImage;
    handleMultiSelectClick(path, event, { shiftAnchor: inEditor ? selectedImage.path : libraryActivePath, updateLibraryActivePath: !inEditor, onSimpleClick: handleImageSelect });
  };

  useEffect(() => {
    if (isWaveformVisible && selectedImage?.isReady && !waveform) {
      invoke('image_processing::generate_waveform')
        .then(setWaveform)
        .catch(err => console.error("Failed to generate waveform:", err));
    }
  }, [isWaveformVisible, selectedImage?.isReady, waveform]);

  useEffect(() => {
    if (selectedImage && !selectedImage.isReady && selectedImage.path) {
      let isEffectActive = true;
      const loadFullImageData = async () => {
        try {
          const loadImageResult = await invoke('load_image', { path: selectedImage.path });
          if (!isEffectActive) return;
          const histData = await invoke('generate_histogram');
          if (!isEffectActive) return;
          setSelectedImage(currentSelected => {
            if (currentSelected && currentSelected.path === selectedImage.path) return { ...currentSelected, originalUrl: loadImageResult.original_base64, width: loadImageResult.width, height: loadImageResult.height, metadata: loadImageResult.metadata, exif: loadImageResult.exif, isRaw: loadImageResult.is_raw, isReady: true };
            return currentSelected;
          });
          
          let initialAdjusts;
          if (loadImageResult.metadata.adjustments && !loadImageResult.metadata.adjustments.is_null) {
            initialAdjusts = normalizeLoadedAdjustments(loadImageResult.metadata.adjustments);
          } else {
            initialAdjusts = {
              ...INITIAL_ADJUSTMENTS,
              aspectRatio: loadImageResult.width / loadImageResult.height,
            };
          }
          if (loadImageResult.metadata.adjustments && !loadImageResult.metadata.adjustments.is_null) {
            initialAdjusts = normalizeLoadedAdjustments(loadImageResult.metadata.adjustments);
          }
          setLiveAdjustments(initialAdjusts);
          resetAdjustmentsHistory(initialAdjusts);
          setHistogram(histData);
        } catch (err) {
          if (isEffectActive) { console.error("Failed to load image:", err); setError(`Failed to load image: ${err}`); setSelectedImage(null); }
        } finally {
          if (isEffectActive) setIsViewLoading(false);
        }
      };
      loadFullImageData();
      return () => { isEffectActive = false; };
    }
  }, [selectedImage?.path, selectedImage?.isReady, resetAdjustmentsHistory]);

  const handleClearSelection = () => {
    if (selectedImage) setMultiSelectedPaths([selectedImage.path]);
    else { setMultiSelectedPaths([]); setLibraryActivePath(null); }
  };

  const handleRenameFiles = useCallback(async (paths) => {
    if (paths && paths.length > 0) {
      setRenameTargetPaths(paths);
      setIsRenameFileModalOpen(true);
    }
  }, []);

  const handleSaveRename = useCallback(async (nameTemplate) => {
    if (renameTargetPaths.length > 0 && nameTemplate) {
      try {
        const newPaths = await invoke('rename_files', {
          paths: renameTargetPaths,
          nameTemplate,
        });

        handleLibraryRefresh();

        if (selectedImage && renameTargetPaths.includes(selectedImage.path)) {
          const oldPathIndex = renameTargetPaths.indexOf(selectedImage.path);
          if (newPaths[oldPathIndex]) {
            handleImageSelect(newPaths[oldPathIndex]);
          } else {
            handleBackToLibrary();
          }
        }
        if (libraryActivePath && renameTargetPaths.includes(libraryActivePath)) {
          const oldPathIndex = renameTargetPaths.indexOf(libraryActivePath);
          if (newPaths[oldPathIndex]) {
            setLibraryActivePath(newPaths[oldPathIndex]);
          } else {
            setLibraryActivePath(null);
          }
        }
        setMultiSelectedPaths(newPaths);

      } catch (err) {
        setError(`Failed to rename files: ${err}`);
      }
    }
    setRenameTargetPaths([]);
  }, [renameTargetPaths, handleLibraryRefresh, selectedImage, libraryActivePath, handleImageSelect, handleBackToLibrary]);

  const handleStartImport = async (settings) => {
    if (importSourcePaths.length > 0 && importTargetFolder) {
      invoke('import_files', {
        sourcePaths: importSourcePaths,
        destinationFolder: importTargetFolder,
        settings: settings,
      }).catch(err => {
        console.error("Failed to start import:", err);
        setImportState({ status: 'error', errorMessage: `Failed to start import: ${err}` });
      });
    }
  };

  const handleResetAdjustments = useCallback((paths) => {
    const pathsToReset = paths || multiSelectedPaths;
    if (pathsToReset.length === 0) return;
    
    invoke('reset_adjustments_for_paths', { paths: pathsToReset })
      .then(() => { 
        if (pathsToReset.includes(libraryActivePath)) {
          setLibraryActiveAdjustments(prev => ({ ...INITIAL_ADJUSTMENTS, rating: prev.rating }));
        }
        if (selectedImage && pathsToReset.includes(selectedImage.path)) {
          setAdjustments(prev => ({ ...INITIAL_ADJUSTMENTS, rating: prev.rating, aiPatches: [] }));
        }
      })
      .catch(err => { 
        console.error("Failed to reset adjustments:", err); 
        setError(`Failed to reset adjustments: ${err}`); 
      });
  }, [multiSelectedPaths, libraryActivePath, selectedImage, setAdjustments]);

  const handleImportClick = useCallback(async (targetPath) => {

    try {
      const allImageExtensions = [...supportedTypes.nonRaw, ...supportedTypes.raw];
      const selected = await open({
        multiple: true,
        title: 'Select files to import',
        filters: [
          {
            name: 'All Supported Images',
            extensions: allImageExtensions,
          },
          {
            name: 'RAW Images',
            extensions: supportedTypes.raw,
          },
          {
            name: 'Standard Images (JPEG, PNG, etc.)',
            extensions: supportedTypes.nonRaw,
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ]
      });
      if (Array.isArray(selected) && selected.length > 0) {
        setImportSourcePaths(selected);
        setImportTargetFolder(targetPath);
        setIsImportModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to open file dialog for import:", err);
    }
  }, [supportedTypes]);

  const handleEditorContextMenu = (event) => {
    event.preventDefault(); event.stopPropagation();
    const options = [
      { label: 'Undo', icon: Undo, onClick: undo, disabled: !canUndo },
      { label: 'Redo', icon: Redo, onClick: redo, disabled: !canRedo },
      { type: 'separator' },
      { label: 'Copy Adjustments', icon: Copy, onClick: handleCopyAdjustments },
      { label: 'Paste Adjustments', icon: ClipboardPaste, onClick: () => handlePasteAdjustments(), disabled: copiedAdjustments === null },
      { type: 'separator' },
      { label: 'Auto Adjust', icon: Aperture, onClick: handleAutoAdjustments },
      { label: 'Set Rating', icon: Star, submenu: [0, 1, 2, 3, 4, 5].map(rating => ({ label: rating === 0 ? 'No Rating' : `${rating} Star${rating !== 1 ? 's' : ''}`, onClick: () => handleRate(rating) })) },
      { 
        label: 'Set Color Label', 
        icon: Tag, 
        submenu: [
          { label: 'No Label', onClick: () => handleSetColorLabel(null) },
          ...COLOR_LABELS.map(label => ({
            label: label.name.charAt(0).toUpperCase() + label.name.slice(1),
            color: label.color,
            onClick: () => handleSetColorLabel(label.name)
          }))
        ]
      },
      { type: 'separator' },
      { label: 'Reset Adjustments', icon: RotateCcw, onClick: () => setAdjustments(prev => ({ ...INITIAL_ADJUSTMENTS, rating: prev.rating, aiPatches: [] })) },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const handleThumbnailContextMenu = (event, path) => {
    event.preventDefault();
    event.stopPropagation();

    const isTargetInSelection = multiSelectedPaths.includes(path);
    let finalSelection;

    if (!isTargetInSelection) {
      finalSelection = [path];
      setMultiSelectedPaths([path]);
      if (!selectedImage) {
        setLibraryActivePath(path);
      }
    } else {
      finalSelection = multiSelectedPaths;
    }

    const selectionCount = finalSelection.length;
    const isSingleSelection = selectionCount === 1;
    const isEditingThisImage = selectedImage?.path === path;
    const pasteLabel = isSingleSelection ? 'Paste Adjustments' : `Paste Adjustments to ${selectionCount} Images`;
    const resetLabel = isSingleSelection ? 'Reset Adjustments' : `Reset Adjustments on ${selectionCount} Images`;
    const deleteLabel = isSingleSelection ? 'Delete Image' : `Delete ${selectionCount} Images`;
    const copyLabel = isSingleSelection ? 'Copy Image' : `Copy ${selectionCount} Images`;
    const autoAdjustLabel = isSingleSelection ? 'Auto Adjust Image' : `Auto Adjust ${selectionCount} Images`;
    const renameLabel = isSingleSelection ? 'Rename File' : `Rename ${selectionCount} Files`;

    const handleApplyAutoAdjustmentsToSelection = () => {
      if (finalSelection.length === 0) return;

      invoke('apply_auto_adjustments_to_paths', { paths: finalSelection })
        .then(() => {
          if (selectedImage && finalSelection.includes(selectedImage.path)) {
            invoke('load_metadata', { path: selectedImage.path })
              .then(metadata => {
                if (metadata.adjustments && !metadata.adjustments.is_null) {
                  const normalized = normalizeLoadedAdjustments(metadata.adjustments);
                  setLiveAdjustments(normalized);
                  resetAdjustmentsHistory(normalized);
                }
              });
          }
          if (libraryActivePath && finalSelection.includes(libraryActivePath)) {
            invoke('load_metadata', { path: libraryActivePath })
              .then(metadata => {
                if (metadata.adjustments && !metadata.adjustments.is_null) {
                  const normalized = normalizeLoadedAdjustments(metadata.adjustments);
                  setLibraryActiveAdjustments(normalized);
                }
              });
          }
        })
        .catch(err => { console.error("Failed to apply auto adjustments to paths:", err); setError(`Failed to apply auto adjustments: ${err}`); });
    };

    const options = [
      ...(!isEditingThisImage ? [{ label: 'Edit Photo', icon: Edit, disabled: !isSingleSelection, onClick: () => handleImageSelect(finalSelection[0]) }, { type: 'separator' }] : []),
      { label: 'Copy Adjustments', icon: Copy, disabled: !isSingleSelection, onClick: async () => {
          try {
            const metadata = await invoke('load_metadata', { path: finalSelection[0] });
            const sourceAdjustments = (metadata.adjustments && !metadata.adjustments.is_null) ? { ...INITIAL_ADJUSTMENTS, ...metadata.adjustments } : INITIAL_ADJUSTMENTS;
            const adjustmentsToCopy = {};
            for (const key of COPYABLE_ADJUSTMENT_KEYS) { if (sourceAdjustments.hasOwnProperty(key)) adjustmentsToCopy[key] = sourceAdjustments[key]; }
            setCopiedAdjustments(adjustmentsToCopy); setIsCopied(true);
          } catch (err) { console.error("Failed to load metadata for copy:", err); setError(`Failed to copy adjustments: ${err}`); }
        },
      },
      { label: pasteLabel, icon: ClipboardPaste, disabled: copiedAdjustments === null, onClick: () => handlePasteAdjustments(finalSelection) },
      { label: autoAdjustLabel, icon: Aperture, onClick: handleApplyAutoAdjustmentsToSelection },
      { type: 'separator' },
      { label: copyLabel, icon: Copy, onClick: () => { setCopiedFilePaths(finalSelection); setIsCopied(true); } },
      { label: 'Duplicate Image', icon: CopyPlus, disabled: !isSingleSelection, onClick: async () => { try { await invoke('duplicate_file', { path: finalSelection[0] }); handleLibraryRefresh(); } catch (err) { console.error("Failed to duplicate file:", err); setError(`Failed to duplicate file: ${err}`); } } },
      { label: renameLabel, icon: FileEdit, onClick: () => handleRenameFiles(finalSelection) },
      { type: 'separator' },
      { label: 'Set Rating', icon: Star, submenu: [0, 1, 2, 3, 4, 5].map(rating => ({ label: rating === 0 ? 'No Rating' : `${rating} Star${rating !== 1 ? 's' : ''}`, onClick: () => handleRate(rating, finalSelection) })) },
      { 
        label: 'Set Color Label', 
        icon: Tag, 
        submenu: [
          { label: 'No Label', onClick: () => handleSetColorLabel(null, finalSelection) },
          ...COLOR_LABELS.map(label => ({
            label: label.name.charAt(0).toUpperCase() + label.name.slice(1),
            color: label.color,
            onClick: () => handleSetColorLabel(label.name, finalSelection)
          }))
        ]
      },
      { type: 'separator' },
      { label: 'Show in File Explorer', icon: Folder, disabled: !isSingleSelection, onClick: () => { invoke('show_in_finder', { path: finalSelection[0] }).catch(err => setError(`Could not show file in explorer: ${err}`)); } },
      { label: resetLabel, icon: RotateCcw, onClick: () => handleResetAdjustments(finalSelection) },
      { label: deleteLabel, icon: Trash2, isDestructive: true, submenu: [
          { label: 'Cancel', icon: X, onClick: () => {} },
          {
            label: 'Delete Selected Only',
            icon: Check,
            isDestructive: true,
            onClick: () => executeDelete(finalSelection, { includeAssociated: false }),
          },
          {
            label: 'Delete + Associated (RAW/JPEG)',
            icon: Check,
            isDestructive: true,
            onClick: () => executeDelete(finalSelection, { includeAssociated: true }),
          },
        ],
      },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const handleCreateFolder = async (folderName) => {
    if (folderName && folderName.trim() !== '' && folderActionTarget) {
      try { await invoke('create_folder', { path: `${folderActionTarget}/${folderName.trim()}` }); handleRefreshFolderTree(); }
      catch (err) { setError(`Failed to create folder: ${err}`); }
    }
  };

  const handleRenameFolder = async (newName) => {
    if (newName && newName.trim() !== '' && folderActionTarget) {
      try {
        await invoke('rename_folder', { path: folderActionTarget, newName: newName.trim() });
        if (rootPath === folderActionTarget) {
          const newRootPath = folderActionTarget.substring(0, folderActionTarget.lastIndexOf('/') + 1) + newName.trim();
          setRootPath(newRootPath);
          handleSettingsChange({ ...appSettings, lastRootPath: newRootPath });
        }
        if (currentFolderPath.startsWith(folderActionTarget)) {
          const newCurrentPath = currentFolderPath.replace(folderActionTarget, folderActionTarget.substring(0, folderActionTarget.lastIndexOf('/') + 1) + newName.trim());
          setCurrentFolderPath(newCurrentPath);
        }
        handleRefreshFolderTree();
      } catch (err) { setError(`Failed to rename folder: ${err}`); }
    }
  };

  const handleFolderTreeContextMenu = (event, path) => {
    event.preventDefault(); event.stopPropagation();
    const targetPath = path || rootPath;
    if (!targetPath) return;
    const isRoot = targetPath === rootPath;
    const numCopied = copiedFilePaths.length;
    const copyPastedLabel = numCopied === 1 ? 'Copy image here' : `Copy ${numCopied} images here`;
    const movePastedLabel = numCopied === 1 ? 'Move image here' : `Move ${numCopied} images here`;

    const options = [
      { label: 'New Folder', icon: FolderPlus, onClick: () => { setFolderActionTarget(targetPath); setIsCreateFolderModalOpen(true); } },
      { label: 'Rename Folder', icon: FileEdit, disabled: isRoot, onClick: () => { setFolderActionTarget(targetPath); setIsRenameFolderModalOpen(true); } },
      { type: 'separator' },
      { label: 'Paste', icon: ClipboardPaste, disabled: copiedFilePaths.length === 0, submenu: [
          { label: copyPastedLabel, onClick: async () => { try { await invoke('copy_files', { sourcePaths: copiedFilePaths, destinationFolder: targetPath }); if (targetPath === currentFolderPath) handleLibraryRefresh(); } catch (err) { setError(`Failed to copy files: ${err}`); } } },
          { label: movePastedLabel, onClick: async () => { try { await invoke('move_files', { sourcePaths: copiedFilePaths, destinationFolder: targetPath }); setCopiedFilePaths([]); setMultiSelectedPaths([]); handleRefreshFolderTree(); handleLibraryRefresh(); } catch (err) { setError(`Failed to move files: ${err}`); } } },
        ],
      },
      { label: 'Import Images', icon: FolderInput, onClick: () => handleImportClick(targetPath) },
      { type: 'separator' },
      { label: 'Show in File Explorer', icon: Folder, onClick: () => invoke('show_in_finder', { path: targetPath }).catch(err => setError(`Could not show folder: ${err}`)) },
      ...(path ? [{ label: 'Delete Folder', icon: Trash2, isDestructive: true, disabled: isRoot, submenu: [
          { label: 'Cancel', icon: X, onClick: () => {} },
          { label: 'Confirm', icon: Check, isDestructive: true, onClick: async () => {
              try { await invoke('delete_folder', { path: targetPath }); if (currentFolderPath.startsWith(targetPath)) await handleSelectSubfolder(rootPath); handleRefreshFolderTree(); }
              catch (err) { setError(`Failed to delete folder: ${err}`); }
            },
          },
        ],
      }] : []),
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const handleMainLibraryContextMenu = (event) => {
    event.preventDefault(); event.stopPropagation();
    const numCopied = copiedFilePaths.length;
    const copyPastedLabel = numCopied === 1 ? 'Copy image here' : `Copy ${numCopied} images here`;
    const movePastedLabel = numCopied === 1 ? 'Move image here' : `Move ${numCopied} images here`;

    const options = [
      { label: 'Paste', icon: ClipboardPaste, disabled: copiedFilePaths.length === 0, submenu: [
          { label: copyPastedLabel, onClick: async () => { try { await invoke('copy_files', { sourcePaths: copiedFilePaths, destinationFolder: currentFolderPath }); handleLibraryRefresh(); } catch (err) { setError(`Failed to copy files: ${err}`); } } },
          { label: movePastedLabel, onClick: async () => { try { await invoke('move_files', { sourcePaths: copiedFilePaths, destinationFolder: currentFolderPath }); setCopiedFilePaths([]); setMultiSelectedPaths([]); handleRefreshFolderTree(); handleLibraryRefresh(); } catch (err) { setError(`Failed to move files: ${err}`); } } },
        ],
      },
      { label: 'Import Images', icon: FolderInput, onClick: () => handleImportClick(currentFolderPath) },
    ];
    showContextMenu(event.clientX, event.clientY, options);
  };

  const renderMainView = () => {
    if (selectedImage) {
      return (
        <div className="flex flex-row flex-grow h-full min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <Editor
              selectedImage={selectedImage}
              finalPreviewUrl={finalPreviewUrl}
              uncroppedAdjustedPreviewUrl={uncroppedAdjustedPreviewUrl}
              showOriginal={showOriginal}
              setShowOriginal={setShowOriginal}
              isAdjusting={isAdjusting}
              waveform={waveform}
              isWaveformVisible={isWaveformVisible}
              onCloseWaveform={() => setIsWaveformVisible(false)}
              onBackToLibrary={handleBackToLibrary}
              isLoading={isViewLoading}
              isFullScreen={isFullScreen}
              isFullScreenLoading={isFullScreenLoading}
              fullScreenUrl={fullScreenUrl}
              onToggleFullScreen={handleToggleFullScreen}
              activeRightPanel={activeRightPanel}
              renderedRightPanel={renderedRightPanel}
              adjustments={adjustments}
              setAdjustments={setAdjustments}
              thumbnails={thumbnails}
              activeMaskId={activeMaskId}
              activeMaskContainerId={activeMaskContainerId}
              onSelectMask={setActiveMaskId}
              activeAiPatchContainerId={activeAiPatchContainerId}
              activeAiSubMaskId={activeAiSubMaskId}
              onSelectAiSubMask={setActiveAiSubMaskId}
              updateSubMask={updateSubMask}
              transformWrapperRef={transformWrapperRef}
              onZoomed={handleUserTransform}
              targetZoom={zoom}
              onContextMenu={handleEditorContextMenu}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              isStraightenActive={isStraightenActive}
              onStraighten={handleStraighten}
              brushSettings={brushSettings}
              onGenerateAiMask={handleGenerateAiMask}
              isMaskControlHovered={isMaskControlHovered}
            />
            <Resizer onMouseDown={createResizeHandler(setBottomPanelHeight, bottomPanelHeight)} direction="horizontal" />
            <BottomBar
              rating={adjustments.rating || 0}
              onRate={handleRate}
              isRatingDisabled={!selectedImage}
              onCopy={handleCopyAdjustments}
              isCopyDisabled={!selectedImage}
              onPaste={() => handlePasteAdjustments()}
              isCopied={isCopied}
              isPasted={isPasted}
              isPasteDisabled={copiedAdjustments === null}
              zoom={zoom}
              onZoomChange={handleZoomChange}
              minZoom={0.7}
              maxZoom={10}
              imageList={sortedImageList}
              selectedImage={selectedImage}
              onImageSelect={handleImageClick}
              onContextMenu={handleThumbnailContextMenu}
              multiSelectedPaths={multiSelectedPaths}
              thumbnails={thumbnails}
              imageRatings={imageRatings}
              isFilmstripVisible={uiVisibility.filmstrip}
              setIsFilmstripVisible={(value) => setUiVisibility(prev => ({ ...prev, filmstrip: value }))}
              isLoading={isViewLoading}
              onClearSelection={handleClearSelection}
              filmstripHeight={bottomPanelHeight}
              isResizing={isResizing}
            />
          </div>

          <Resizer onMouseDown={createResizeHandler(setRightPanelWidth, rightPanelWidth)} direction="vertical" />
          <div className="flex bg-bg-secondary rounded-lg h-full">
            <div
              className={clsx('h-full overflow-hidden', !isResizing && 'transition-all duration-300 ease-in-out')}
              style={{ width: activeRightPanel ? `${rightPanelWidth}px` : '0px' }}
            >
              <div style={{ width: `${rightPanelWidth}px` }} className="h-full">
                {renderedRightPanel === 'adjustments' && <Controls theme={theme} adjustments={adjustments} setAdjustments={setAdjustments} selectedImage={selectedImage} histogram={histogram} collapsibleState={collapsibleSectionsState} setCollapsibleState={setCollapsibleSectionsState} copiedSectionAdjustments={copiedSectionAdjustments} setCopiedSectionAdjustments={setCopiedSectionAdjustments} handleAutoAdjustments={handleAutoAdjustments} />}
                {renderedRightPanel === 'metadata' && <MetadataPanel selectedImage={selectedImage} />}
                {renderedRightPanel === 'crop' && <CropPanel selectedImage={selectedImage} adjustments={adjustments} setAdjustments={setAdjustments} isStraightenActive={isStraightenActive} setIsStraightenActive={setIsStraightenActive} />}
                {renderedRightPanel === 'masks' && <MasksPanel 
                  adjustments={adjustments} 
                  setAdjustments={setAdjustments} 
                  selectedImage={selectedImage} 
                  onSelectMask={setActiveMaskId} 
                  activeMaskId={activeMaskId}
                  activeMaskContainerId={activeMaskContainerId}
                  onSelectContainer={setActiveMaskContainerId}
                  brushSettings={brushSettings} 
                  setBrushSettings={setBrushSettings} 
                  copiedMask={copiedMask} 
                  setCopiedMask={setCopiedMask} 
                  setCustomEscapeHandler={setCustomEscapeHandler} 
                  histogram={histogram} 
                  isGeneratingAiMask={isGeneratingAiMask} 
                  aiModelDownloadStatus={aiModelDownloadStatus} 
                  onGenerateAiForegroundMask={handleGenerateAiForegroundMask} 
                  setIsMaskControlHovered={setIsMaskControlHovered}
                />}
                {renderedRightPanel === 'presets' && <PresetsPanel adjustments={adjustments} setAdjustments={setAdjustments} selectedImage={selectedImage} activePanel={activeRightPanel} />}
                {renderedRightPanel === 'export' && <ExportPanel selectedImage={selectedImage} adjustments={adjustments} multiSelectedPaths={multiSelectedPaths} exportState={exportState} setExportState={setExportState} />}
                {renderedRightPanel === 'ai' && <AIPanel 
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  selectedImage={selectedImage}
                  isComfyUiConnected={isComfyUiConnected}
                  isGeneratingAi={isGeneratingAi}
                  onGenerativeReplace={handleGenerativeReplace}
                  onDeletePatch={handleDeleteAiPatch}
                  onTogglePatchVisibility={handleToggleAiPatchVisibility}
                  activePatchContainerId={activeAiPatchContainerId}
                  onSelectPatchContainer={setActiveAiPatchContainerId}
                  activeSubMaskId={activeAiSubMaskId}
                  onSelectSubMask={setActiveAiSubMaskId}
                  brushSettings={brushSettings}
                  setBrushSettings={setBrushSettings}
                  isGeneratingAiMask={isGeneratingAiMask}
                  aiModelDownloadStatus={aiModelDownloadStatus}
                  onGenerateAiForegroundMask={handleGenerateAiForegroundMask}
                  setCustomEscapeHandler={setCustomEscapeHandler}
                />}
              </div>
            </div>
            <div className={clsx('h-full border-l transition-colors', activeRightPanel ? 'border-surface' : 'border-transparent')}>
              <RightPanelSwitcher activePanel={activeRightPanel} onPanelSelect={handleRightPanelSelect} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-row flex-grow h-full min-h-0">
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          <MainLibrary
            imageList={sortedImageList}
            onImageClick={handleLibraryImageSingleClick}
            onImageDoubleClick={handleImageSelect}
            onContextMenu={handleThumbnailContextMenu}
            onEmptyAreaContextMenu={handleMainLibraryContextMenu}
            multiSelectedPaths={multiSelectedPaths}
            activePath={libraryActivePath}
            rootPath={rootPath}
            currentFolderPath={currentFolderPath}
            onOpenFolder={handleOpenFolder}
            isTreeLoading={isTreeLoading}
            isLoading={isViewLoading}
            thumbnails={thumbnails}
            imageRatings={imageRatings}
            appSettings={appSettings}
            onContinueSession={handleContinueSession}
            onGoHome={handleGoHome}
            onClearSelection={handleClearSelection}
            sortCriteria={sortCriteria}
            setSortCriteria={setSortCriteria}
            filterCriteria={filterCriteria}
            setFilterCriteria={setFilterCriteria}
            onSettingsChange={handleSettingsChange}
            isIndexing={isIndexing}
            indexingProgress={indexingProgress}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLibraryRefresh={handleLibraryRefresh}
            theme={theme}
            initialScrollOffset={libraryScrollOffset}
            onScroll={handleLibraryScroll}
            aiModelDownloadStatus={aiModelDownloadStatus}
            importState={importState}
            thumbnailSize={thumbnailSize}
            onThumbnailSizeChange={setThumbnailSize}
          />
          {rootPath && <BottomBar
            isLibraryView={true}
            rating={libraryActiveAdjustments.rating || 0}
            onRate={handleRate}
            isRatingDisabled={multiSelectedPaths.length === 0}
            onCopy={handleCopyAdjustments}
            isCopyDisabled={multiSelectedPaths.length !== 1}
            onPaste={() => handlePasteAdjustments()}
            isCopied={isCopied}
            isPasted={isPasted}
            isPasteDisabled={copiedAdjustments === null || multiSelectedPaths.length === 0}
            onReset={() => handleResetAdjustments()}
            isResetDisabled={multiSelectedPaths.length === 0}
            onExportClick={() => setIsLibraryExportPanelVisible(prev => !prev)}
            isExportDisabled={multiSelectedPaths.length === 0}
          />}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary font-sans text-text-primary overflow-hidden select-none">
      { appSettings?.decorations || (!isWindowFullScreen && <TitleBar />) }
      <div className={clsx(
        "flex-1 flex flex-col min-h-0",
        [
          rootPath && "p-2 gap-2",
          !appSettings?.decorations && rootPath && !isWindowFullScreen && "pt-12",
        ]
      )}>
        {error && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold hover:text-gray-200">×</button>
          </div>
        )}
        <div className="flex flex-row flex-grow h-full min-h-0">
          {rootPath && (
            <>
              <FolderTree
                tree={folderTree}
                onFolderSelect={handleSelectSubfolder}
                selectedPath={currentFolderPath}
                isLoading={isTreeLoading}
                isVisible={uiVisibility.folderTree}
                setIsVisible={(value) => setUiVisibility(prev => ({ ...prev, folderTree: value }))}
                style={{ width: uiVisibility.folderTree ? `${leftPanelWidth}px` : '32px' }}
                isResizing={isResizing}
                onContextMenu={handleFolderTreeContextMenu}
                expandedFolders={expandedFolders}
                onToggleFolder={handleToggleFolder}
              />
              <Resizer onMouseDown={createResizeHandler(setLeftPanelWidth, leftPanelWidth)} direction="vertical" />
            </>
          )}
          <div className="flex-1 flex flex-col min-w-0">
            {renderMainView()}
          </div>
          {!selectedImage && isLibraryExportPanelVisible && (
            <Resizer onMouseDown={createResizeHandler(setRightPanelWidth, rightPanelWidth)} direction="vertical" />
          )}
          <div 
            className={clsx('flex-shrink-0 overflow-hidden', !isResizing && 'transition-all duration-300 ease-in-out')}
            style={{ width: isLibraryExportPanelVisible ? `${rightPanelWidth}px` : '0px' }}
          >
            <LibraryExportPanel
              isVisible={isLibraryExportPanelVisible}
              onClose={() => setIsLibraryExportPanelVisible(false)}
              multiSelectedPaths={multiSelectedPaths}
              exportState={exportState}
              setExportState={setExportState}
            />
          </div>
        </div>
      </div>
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSave={handleCreateFolder}
      />
      <RenameFolderModal
        isOpen={isRenameFolderModalOpen}
        onClose={() => setIsRenameFolderModalOpen(false)}
        onSave={handleRenameFolder}
        currentName={folderActionTarget ? folderActionTarget.split(/[\\/]/).pop() : ''}
      />
      <RenameFileModal
        isOpen={isRenameFileModalOpen}
        onClose={() => setIsRenameFileModalOpen(false)}
        onSave={handleSaveRename}
        filesToRename={renameTargetPaths}
      />
      <ConfirmModal
        {...confirmModalState}
        onClose={closeConfirmModal}
      />
      <ImportSettingsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSave={handleStartImport}
        fileCount={importSourcePaths.length}
      />
    </div>
  );
}

const AppWrapper = () => (
  <ContextMenuProvider>
    <App />
  </ContextMenuProvider>
);

export default AppWrapper;