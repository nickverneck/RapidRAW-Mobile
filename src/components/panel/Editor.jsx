import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { invoke } from '@tauri-apps/api/core';
import debounce from 'lodash.debounce';
import { AnimatePresence } from 'framer-motion';

import { useImageRenderSize } from '../../hooks/useImageRenderSize';

import FullScreenViewer from './editor/FullScreenViewer';
import EditorToolbar from './editor/EditorToolbar';
import ImageCanvas from './editor/ImageCanvas';
import Waveform from './editor/Waveform';

export default function Editor({
  selectedImage, finalPreviewUrl, uncroppedAdjustedPreviewUrl,
  showOriginal, setShowOriginal, isAdjusting, onBackToLibrary, isLoading, isFullScreen,
  isFullScreenLoading, fullScreenUrl, onToggleFullScreen, activeRightPanel,
  adjustments, setAdjustments, thumbnails, activeMaskId, activeMaskContainerId,
  activeAiPatchContainerId, activeAiSubMaskId,
  onSelectMask, onSelectAiSubMask, updateSubMask, transformWrapperRef, onZoomed, onContextMenu,
  onUndo, onRedo, canUndo, canRedo, brushSettings,
  onGenerateAiMask, isMaskControlHovered,
  targetZoom, waveform, isWaveformVisible, onCloseWaveform, isStraightenActive, onStraighten,
}) {
  const [crop, setCrop] = useState();
  const prevCropParams = useRef(null);
  const [isMaskHovered, setIsMaskHovered] = useState(false);
  const [isLoaderVisible, setIsLoaderVisible] = useState(false);
  const [maskOverlayUrl, setMaskOverlayUrl] = useState(null);
  const [transformState, setTransformState] = useState({ scale: 1, positionX: 0, positionY: 0 });
  const imageContainerRef = useRef(null);
  const isInitialMount = useRef(true);
  const transformStateRef = useRef(transformState);
  transformStateRef.current = transformState;

  useEffect(() => {
    if (!transformWrapperRef.current) {
      return;
    }

    const wrapperInstance = transformWrapperRef.current;
    const { zoomIn, zoomOut } = wrapperInstance;
    const currentScale = transformStateRef.current.scale;

    if (Math.abs(currentScale - targetZoom) < 0.001) {
      return;
    }

    const animationTime = 200;
    const animationType = 'easeOut';
    const factor = Math.log(targetZoom / currentScale);

    if (targetZoom > currentScale) {
      zoomIn(factor, animationTime, animationType);
    } else {
      zoomOut(-factor, animationTime, animationType);
    }
  }, [targetZoom, transformWrapperRef]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (showOriginal) {
      setShowOriginal(false);
    }
  }, [finalPreviewUrl, setShowOriginal]);

  const isCropping = activeRightPanel === 'crop';
  const isMasking = activeRightPanel === 'masks';
  const isAiEditing = activeRightPanel === 'ai';
  
  const hasDisplayableImage = finalPreviewUrl || selectedImage.originalUrl || selectedImage.thumbnailUrl;
  const showSpinner = isLoading && !hasDisplayableImage;

  const croppedDimensions = useMemo(() => {
    if (adjustments.crop) {
        return { width: adjustments.crop.width, height: adjustments.crop.height };
    }
    if (selectedImage) {
        const orientationSteps = adjustments.orientationSteps || 0;
        const isSwapped = orientationSteps === 1 || orientationSteps === 3;
        const width = isSwapped ? selectedImage.height : selectedImage.width;
        const height = isSwapped ? selectedImage.width : selectedImage.height;
        return { width, height };
    }
    return null;
  }, [selectedImage, adjustments.crop, adjustments.orientationSteps]);

  const imageRenderSize = useImageRenderSize(imageContainerRef, croppedDimensions);

  const debouncedGenerateMaskOverlay = useCallback(debounce(async (maskDef, renderSize) => {
    if (!maskDef || !maskDef.visible || renderSize.width === 0) {
      setMaskOverlayUrl(null);
      return;
    }
    try {
      const cropOffset = [adjustments.crop?.x || 0, adjustments.crop?.y || 0];
      const url = await invoke('generate_mask_overlay', {
        maskDef,
        width: Math.round(renderSize.width),
        height: Math.round(renderSize.height),
        scale: renderSize.scale,
        cropOffset,
      });
      setMaskOverlayUrl(url);
    } catch (e) {
      console.error("Failed to generate mask overlay:", e);
      setMaskOverlayUrl(null);
    }
  }, 100), [adjustments.crop]);

  useEffect(() => {
    let maskDefForOverlay = null;

    if (activeRightPanel === 'masks' && activeMaskContainerId) {
      maskDefForOverlay = adjustments.masks.find(c => c.id === activeMaskContainerId);
    } else if (activeRightPanel === 'ai' && activeAiPatchContainerId) {
      const activePatch = adjustments.aiPatches.find(p => p.id === activeAiPatchContainerId);
      if (activePatch) {
        maskDefForOverlay = {
          ...activePatch,
          adjustments: {},
          opacity: 100,
        };
      }
    }

    debouncedGenerateMaskOverlay(maskDefForOverlay, imageRenderSize);
    
    return () => debouncedGenerateMaskOverlay.cancel();
  }, [activeRightPanel, activeMaskContainerId, activeAiPatchContainerId, adjustments.masks, adjustments.aiPatches, imageRenderSize, debouncedGenerateMaskOverlay]);


  useEffect(() => {
    let timer;
    if (showSpinner) {
      setIsLoaderVisible(true);
    } else {
      timer = setTimeout(() => setIsLoaderVisible(false), 300);
    }
    return () => clearTimeout(timer);
  }, [showSpinner]);

  useEffect(() => {
    if (!isCropping || !selectedImage?.width) {
      return;
    }
  
    const { rotation = 0, aspectRatio, orientationSteps = 0, crop } = adjustments;
    const needsRecalc = crop === null ||
      prevCropParams.current?.rotation !== rotation ||
      prevCropParams.current?.aspectRatio !== aspectRatio ||
      prevCropParams.current?.orientationSteps !== orientationSteps;
  
    if (needsRecalc) {
      const { width: imgWidth, height: imgHeight } = selectedImage;
      const isSwapped = orientationSteps === 1 || orientationSteps === 3;
      const W = isSwapped ? imgHeight : imgWidth;
      const H = isSwapped ? imgWidth : imgHeight;
      const A = aspectRatio || W / H;
      if (isNaN(A) || A <= 0) return;
  
      const angle = Math.abs(rotation);
      const rad = (angle % 180) * Math.PI / 180;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
  
      const h_c = Math.min(H / (A * sin + cos), W / (A * cos + sin));
      const w_c = A * h_c;
  
      const maxPixelCrop = {
        x: Math.round((W - w_c) / 2),
        y: Math.round((H - h_c) / 2),
        width: Math.round(w_c),
        height: Math.round(h_c),
      };
  
      prevCropParams.current = { rotation, aspectRatio, orientationSteps };
      if (JSON.stringify(crop) !== JSON.stringify(maxPixelCrop)) {
        setAdjustments(prev => ({ ...prev, crop: maxPixelCrop }));
      }
    }
  }, [isCropping, adjustments.rotation, adjustments.aspectRatio, adjustments.orientationSteps, adjustments.crop, selectedImage, setAdjustments]);

  useEffect(() => {
    if (!isCropping || !selectedImage?.width) {
      setCrop(undefined);
      return;
    }
    
    const orientationSteps = adjustments.orientationSteps || 0;
    const isSwapped = orientationSteps === 1 || orientationSteps === 3;
    const cropBaseWidth = isSwapped ? selectedImage.height : selectedImage.width;
    const cropBaseHeight = isSwapped ? selectedImage.width : selectedImage.height;

    const { crop: pixelCrop } = adjustments;

    if (pixelCrop) {
      setCrop({
        unit: '%',
        x: (pixelCrop.x / cropBaseWidth) * 100,
        y: (pixelCrop.y / cropBaseHeight) * 100,
        width: (pixelCrop.width / cropBaseWidth) * 100,
        height: (pixelCrop.height / cropBaseHeight) * 100,
      });
    }
  }, [isCropping, adjustments.crop, adjustments.orientationSteps, selectedImage]);

  const handleCropChange = useCallback((pixelCrop, percentCrop) => {
    setCrop(percentCrop);
  }, []);

  const handleCropComplete = useCallback((_, pc) => {
    if (!pc.width || !pc.height || !selectedImage?.width) return;

    const orientationSteps = adjustments.orientationSteps || 0;
    const isSwapped = orientationSteps === 1 || orientationSteps === 3;
    
    const cropBaseWidth = isSwapped ? selectedImage.height : selectedImage.width;
    const cropBaseHeight = isSwapped ? selectedImage.width : selectedImage.height;
    
    const newPixelCrop = {
      x: Math.round((pc.x / 100) * cropBaseWidth),
      y: Math.round((pc.y / 100) * cropBaseHeight),
      width: Math.round((pc.width / 100) * cropBaseWidth),
      height: Math.round((pc.height / 100) * cropBaseHeight),
    };

    if (JSON.stringify(newPixelCrop) !== JSON.stringify(adjustments.crop)) {
      setAdjustments(prev => ({ ...prev, crop: newPixelCrop }));
    }
  }, [selectedImage, adjustments.crop, adjustments.orientationSteps, setAdjustments]);

  const toggleShowOriginal = useCallback(() => setShowOriginal(prev => !prev), [setShowOriginal]);

  const doubleClickProps = useMemo(() => {
    if (isCropping || isMasking || isAiEditing) {
      return { 
        disabled: true,
      };
    }
    return {
      mode: transformState.scale >= 2 ? 'reset' : 'zoomIn',
      animationTime: 200,
      animationType: 'easeOut',
    };
  }, [isCropping, isMasking, isAiEditing, transformState.scale]);  

  if (!selectedImage) {
    return (
      <div className="flex-1 bg-bg-secondary rounded-lg flex items-center justify-center text-text-secondary">
        <p>Select an image from the library to begin editing.</p>
      </div>
    );
  }

  const activeSubMask = useMemo(() => {
    if (isMasking && activeMaskId) {
      const container = adjustments.masks.find(c => c.subMasks.some(sm => sm.id === activeMaskId));
      return container?.subMasks.find(sm => sm.id === activeMaskId);
    }
    if (isAiEditing && activeAiSubMaskId) {
      const container = adjustments.aiPatches.find(c => c.subMasks.some(sm => sm.id === activeAiSubMaskId));
      return container?.subMasks.find(sm => sm.id === activeAiSubMaskId);
    }
    return null;
  }, [adjustments.masks, adjustments.aiPatches, activeMaskId, activeAiSubMaskId, isMasking, isAiEditing]);

  const isPanningDisabled = isMaskHovered || isCropping || (isMasking && (activeSubMask?.type === 'brush' || activeSubMask?.type === 'ai-subject')) || (isAiEditing && (activeSubMask?.type === 'brush' || activeSubMask?.type === 'ai-subject'));

  return (
    <>
      <FullScreenViewer
        isOpen={isFullScreen}
        url={fullScreenUrl}
        onClose={onToggleFullScreen}
        thumbnailUrl={thumbnails[selectedImage.path] || selectedImage.thumbnailUrl}
        transformState={transformState}
        onTransformChange={setTransformState}
      />

      <div className="flex-1 bg-bg-secondary rounded-lg flex flex-col relative overflow-hidden p-2 gap-2 min-h-0">
        <AnimatePresence>
          {isWaveformVisible && <Waveform waveformData={waveform} onClose={onCloseWaveform} />}
        </AnimatePresence>
        <EditorToolbar
          onBackToLibrary={onBackToLibrary}
          selectedImage={selectedImage}
          isLoading={isLoading}
          onToggleShowOriginal={toggleShowOriginal}
          showOriginal={showOriginal}
          onToggleFullScreen={onToggleFullScreen}
          isFullScreenLoading={isFullScreenLoading}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div 
          className="flex-1 relative overflow-hidden rounded-lg" 
          ref={imageContainerRef}
          onContextMenu={onContextMenu}
        >
          {showSpinner && (
            <div className={clsx(
              "absolute inset-0 bg-bg-secondary/80 flex items-center justify-center z-50 transition-opacity duration-300",
              isLoaderVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}>
              <Loader2 size={48} className="animate-spin text-accent" />
            </div>
          )}

          <TransformWrapper
            key={selectedImage.path}
            ref={transformWrapperRef}
            minScale={0.7}
            maxScale={10}
            limitToBounds={true}
            centerZoomedOut={true}
            doubleClick={doubleClickProps}
            panning={{ disabled: isPanningDisabled }}
            onTransformed={(_, state) => {
              setTransformState(state);
              onZoomed(state);
            }}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageCanvas
                isCropping={isCropping}
                crop={crop}
                setCrop={handleCropChange}
                handleCropComplete={handleCropComplete}
                adjustments={adjustments}
                selectedImage={selectedImage}
                isMasking={isMasking}
                imageRenderSize={imageRenderSize}
                showOriginal={showOriginal}
                finalPreviewUrl={finalPreviewUrl}
                isAdjusting={isAdjusting}
                uncroppedAdjustedPreviewUrl={uncroppedAdjustedPreviewUrl}
                maskOverlayUrl={maskOverlayUrl}
                onSelectMask={onSelectMask}
                activeMaskId={activeMaskId}
                activeMaskContainerId={activeMaskContainerId}
                updateSubMask={updateSubMask}
                isMaskHovered={isMaskHovered}
                setIsMaskHovered={setIsMaskHovered}
                brushSettings={brushSettings}
                onGenerateAiMask={onGenerateAiMask}
                isMaskControlHovered={isMaskControlHovered}
                isAiEditing={isAiEditing}
                activeAiPatchContainerId={activeAiPatchContainerId}
                activeAiSubMaskId={activeAiSubMaskId}
                onSelectAiSubMask={onSelectAiSubMask}
                isStraightenActive={isStraightenActive}
                onStraighten={onStraighten}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>
    </>
  );
}