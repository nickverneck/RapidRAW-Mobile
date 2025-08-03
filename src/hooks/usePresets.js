import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import debounce from 'lodash.debounce';
import { COPYABLE_ADJUSTMENT_KEYS } from '../utils/adjustments';

function arrayMove(array, from, to) {
  const newArray = array.slice();
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}

export function usePresets(currentAdjustments) {
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedPresets = await invoke('load_presets');
      setPresets(loadedPresets);
    } catch (error) {
      console.error('Failed to load presets:', error);
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePresetsToBackend = useCallback(debounce((presetsToSave) => {
    invoke('save_presets', { presets: presetsToSave })
      .catch(err => console.error("Failed to save presets:", err));
  }, 500), []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const addPreset = (name, folderId = null) => {
    const presetAdjustments = {};
    for (const key of COPYABLE_ADJUSTMENT_KEYS) {
      if (currentAdjustments.hasOwnProperty(key)) {
        presetAdjustments[key] = currentAdjustments[key];
      }
    }

    const newPresetData = {
      id: crypto.randomUUID(),
      name,
      adjustments: presetAdjustments,
    };

    let updatedPresets;
    if (folderId) {
      updatedPresets = presets.map(item => {
        if (item.folder && item.folder.id === folderId) {
          return {
            folder: {
              ...item.folder,
              children: [...item.folder.children, newPresetData],
            }
          };
        }
        return item;
      });
    } else {
      updatedPresets = [...presets, { preset: newPresetData }];
    }
    
    setPresets(updatedPresets);
    savePresetsToBackend(updatedPresets);
    return newPresetData;
  };

  const addFolder = (name) => {
    const newFolder = {
      folder: {
        id: crypto.randomUUID(),
        name,
        children: [],
      }
    };
    
    setPresets(currentPresets => {
      const updatedPresets = [...currentPresets];
      const firstPresetIndex = updatedPresets.findIndex(p => p.preset);
      
      if (firstPresetIndex === -1) {
        updatedPresets.push(newFolder);
      } else {
        updatedPresets.splice(firstPresetIndex, 0, newFolder);
      }
      
      savePresetsToBackend(updatedPresets);
      return updatedPresets;
    });
  };

  const deleteItem = (id) => {
    let updatedPresets = presets.filter(item => (item.preset?.id !== id && item.folder?.id !== id));
    updatedPresets = updatedPresets.map(item => {
      if (item.folder) {
        return {
          folder: {
            ...item.folder,
            children: item.folder.children.filter(child => child.id !== id),
          }
        };
      }
      return item;
    });
    setPresets(updatedPresets);
    savePresetsToBackend(updatedPresets);
  };

  const renameItem = (id, newName) => {
    const updatedPresets = presets.map(item => {
      if (item.preset?.id === id) {
        return { preset: { ...item.preset, name: newName } };
      }
      if (item.folder?.id === id) {
        return { folder: { ...item.folder, name: newName } };
      }
      if (item.folder) {
        return {
          folder: {
            ...item.folder,
            children: item.folder.children.map(child => 
              child.id === id ? { ...child, name: newName } : child
            ),
          }
        };
      }
      return item;
    });
    setPresets(updatedPresets);
    savePresetsToBackend(updatedPresets);
  };

  const updatePreset = (id) => {
    const presetAdjustments = {};
    for (const key of COPYABLE_ADJUSTMENT_KEYS) {
      if (currentAdjustments.hasOwnProperty(key)) {
        presetAdjustments[key] = currentAdjustments[key];
      }
    }

    let updatedPreset = null;
    const updatedPresets = presets.map(item => {
      if (item.preset?.id === id) {
        updatedPreset = { ...item.preset, adjustments: presetAdjustments };
        return { preset: updatedPreset };
      }
      if (item.folder) {
        let found = false;
        const newChildren = item.folder.children.map(child => {
          if (child.id === id) {
            found = true;
            updatedPreset = { ...child, adjustments: presetAdjustments };
            return updatedPreset;
          }
          return child;
        });
        if (found) {
          return { folder: { ...item.folder, children: newChildren } };
        }
      }
      return item;
    });
    setPresets(updatedPresets);
    savePresetsToBackend(updatedPresets);
    return updatedPreset;
  };

  const duplicatePreset = useCallback((presetId) => {
    let presetToDuplicate = null;
    let sourceFolderId = null;

    for (const item of presets) {
      if (item.preset?.id === presetId) {
        presetToDuplicate = item.preset;
        break;
      }
      if (item.folder) {
        const found = item.folder.children.find(p => p.id === presetId);
        if (found) {
          presetToDuplicate = found;
          sourceFolderId = item.folder.id;
          break;
        }
      }
    }

    if (!presetToDuplicate) {
      console.error("Preset to duplicate not found");
      return null;
    }

    const newPreset = {
      adjustments: JSON.parse(JSON.stringify(presetToDuplicate.adjustments)),
      id: crypto.randomUUID(),
      name: `${presetToDuplicate.name} Copy`,
    };

    let updatedPresets;
    if (sourceFolderId) {
      updatedPresets = presets.map(item => {
        if (item.folder?.id === sourceFolderId) {
          const originalIndex = item.folder.children.findIndex(p => p.id === presetId);
          const newChildren = [...item.folder.children];
          newChildren.splice(originalIndex + 1, 0, newPreset);
          return { folder: { ...item.folder, children: newChildren } };
        }
        return item;
      });
    } else {
      const originalIndex = presets.findIndex(item => item.preset?.id === presetId);
      updatedPresets = [...presets];
      updatedPresets.splice(originalIndex + 1, 0, { preset: newPreset });
    }

    setPresets(updatedPresets);
    savePresetsToBackend(updatedPresets);
    return newPreset;
  }, [presets, savePresetsToBackend]);

  const movePreset = useCallback((presetId, targetFolderId, overId = null) => {
    let presetToMove = null;
    let sourceFolderId = null;

    for (const item of presets) {
      if (item.preset?.id === presetId) {
        presetToMove = item.preset;
        break;
      }
      if (item.folder) {
        const found = item.folder.children.find(p => p.id === presetId);
        if (found) {
          presetToMove = found;
          sourceFolderId = item.folder.id;
          break;
        }
      }
    }

    if (!presetToMove) return;

    let updatedPresets = [...presets];

    if (sourceFolderId) {
      updatedPresets = updatedPresets.map(item => 
        item.folder?.id === sourceFolderId 
          ? { folder: { ...item.folder, children: item.folder.children.filter(p => p.id !== presetId) } }
          : item
      );
    } else {
      updatedPresets = updatedPresets.filter(item => item.preset?.id !== presetId);
    }

    if (targetFolderId) {
      updatedPresets = updatedPresets.map(item => {
        if (item.folder?.id === targetFolderId) {
          const newChildren = [...item.folder.children];
          if (overId) {
            const overIndex = newChildren.findIndex(p => p.id === overId);
            if (overIndex !== -1) {
              newChildren.splice(overIndex, 0, presetToMove);
            } else {
              newChildren.push(presetToMove);
            }
          } else {
            newChildren.push(presetToMove);
          }
          return { folder: { ...item.folder, children: newChildren } };
        }
        return item;
      });
    } else {
      if (overId) {
        const overIndex = updatedPresets.findIndex(item => (item.preset?.id === overId) || (item.folder?.id === overId));
        if (overIndex !== -1) {
          updatedPresets.splice(overIndex, 0, { preset: presetToMove });
        } else {
          updatedPresets.push({ preset: presetToMove });
        }
      } else {
        updatedPresets.push({ preset: presetToMove });
      }
    }

    setPresets(updatedPresets);
    savePresetsToBackend(updatedPresets);
  }, [presets, savePresetsToBackend]);

  const reorderItems = useCallback((activeId, overId) => {
    setPresets(currentPresets => {
      const getIndex = (arr, id) => arr.findIndex(item => (item.preset?.id === id) || (item.folder?.id === id) || (item.id === id));

      const activeRootIndex = getIndex(currentPresets, activeId);
      const overRootIndex = getIndex(currentPresets, overId);

      if (activeRootIndex !== -1 && overRootIndex !== -1) {
        const newPresets = arrayMove(currentPresets, activeRootIndex, overRootIndex);
        savePresetsToBackend(newPresets);
        return newPresets;
      }

      for (const item of currentPresets) {
        if (item.folder) {
          const activeChildIndex = getIndex(item.folder.children, activeId);
          const overChildIndex = getIndex(item.folder.children, overId);

          if (activeChildIndex !== -1 && overChildIndex !== -1) {
            const newPresets = currentPresets.map(p => {
              if (p.folder?.id === item.folder.id) {
                return {
                  folder: {
                    ...p.folder,
                    children: arrayMove(p.folder.children, activeChildIndex, overChildIndex)
                  }
                };
              }
              return p;
            });
            savePresetsToBackend(newPresets);
            return newPresets;
          }
        }
      }
      
      return currentPresets;
    });
  }, [savePresetsToBackend]);

  const sortAllPresetsAlphabetically = useCallback(() => {
    setPresets(currentPresets => {
      // Deep copy to avoid mutation issues with nested structures
      const newPresets = JSON.parse(JSON.stringify(currentPresets));
      const sortOptions = { numeric: true, sensitivity: 'base' };

      // Sort presets within each folder
      newPresets.forEach(item => {
        if (item.folder && item.folder.children) {
          item.folder.children.sort((a, b) => a.name.localeCompare(b.name, undefined, sortOptions));
        }
      });

      // Separate root items into folders and presets
      const folders = newPresets.filter(item => item.folder);
      const rootPresets = newPresets.filter(item => item.preset);

      // Sort each group alphabetically
      folders.sort((a, b) => a.folder.name.localeCompare(b.folder.name, undefined, sortOptions));
      rootPresets.sort((a, b) => a.preset.name.localeCompare(b.preset.name, undefined, sortOptions));

      // Combine them back, folders first
      const sortedPresets = [...folders, ...rootPresets];

      savePresetsToBackend(sortedPresets);
      return sortedPresets;
    });
  }, [savePresetsToBackend]);

  const importPresetsFromFile = useCallback(async (filePath) => {
    setIsLoading(true);
    try {
      const updatedPresetList = await invoke('handle_import_presets_from_file', { filePath });
      setPresets(updatedPresetList);
    } catch (error) {
      console.error('Failed to import presets from file:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setPresets]);

  const exportPresetsToFile = useCallback(async (presetsToExport, filePath) => {
    try {
      await invoke('handle_export_presets_to_file', { presetsToExport, filePath });
    } catch (error) {
      console.error('Failed to export presets to file:', error);
      throw error;
    }
  }, []);

  return {
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
    refreshPresets: loadPresets,
  };
}