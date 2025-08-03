import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useThumbnails(imageList, setThumbnails) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const processedImageListKey = useRef(null);

  useEffect(() => {
    const newKey = imageList && imageList.length > 0
      ? JSON.stringify(imageList.map(img => img.path).sort())
      : '';

    if (newKey === processedImageListKey.current) {
      return;
    }

    processedImageListKey.current = newKey;
    setThumbnails({});

    if (!imageList || imageList.length === 0) {
      setLoading(false);
      setProgress({ completed: 0, total: 0 });
      return;
    }

    const imagePaths = imageList.map(img => img.path);

    let unlistenComplete;
    let unlistenProgress;

    const setupListenersAndInvoke = async () => {
      setLoading(true);
      setProgress({ completed: 0, total: imagePaths.length });
      
      unlistenProgress = await listen('thumbnail-progress', (event) => {
        const { completed, total } = event.payload;
        setProgress({ completed, total });
      });

      unlistenComplete = await listen('thumbnail-generation-complete', () => {
        setLoading(false);
      });

      try {
        await invoke('generate_thumbnails_progressive', { paths: imagePaths });
      } catch (error) {
        console.error("Failed to invoke thumbnail generation:", error);
        setLoading(false);
      }
    };

    setupListenersAndInvoke();

    return () => {
      if (unlistenComplete) unlistenComplete();
      if (unlistenProgress) unlistenProgress();
    };
  }, [imageList, setThumbnails]);

  return { loading, progress };
}