import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Stage, Layer, Ellipse, Line, Transformer, Group, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import clsx from 'clsx';

function linesIntersect(eraserLine, drawnLine) {
  const threshold = (eraserLine.brushSize / 2) + (drawnLine.brushSize / 2);
  for (const p1 of eraserLine.points) {
    for (const p2 of drawnLine.points) {
      const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      if (distance < threshold) return true;
    }
  }
  return false;
}

const MaskOverlay = memo(({ subMask, scale, onUpdate, isSelected, onSelect, onMaskMouseEnter, onMaskMouseLeave, adjustments }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  const crop = adjustments.crop;
  const cropX = crop ? crop.x : 0;
  const cropY = crop ? crop.y : 0;

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleRadialDrag = useCallback((e) => {
    onUpdate(subMask.id, {
      parameters: {
        ...subMask.parameters,
        centerX: (e.target.x() / scale) + cropX,
        centerY: (e.target.y() / scale) + cropY
      },
    });
  }, [subMask.id, subMask.parameters, onUpdate, scale, cropX, cropY]);

  const handleRadialTransform = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    onUpdate(subMask.id, {
      parameters: {
        ...subMask.parameters,
        centerX: (node.x() / scale) + cropX,
        centerY: (node.y() / scale) + cropY,
        radiusX: (node.radiusX() * node.scaleX()) / scale,
        radiusY: (node.radiusY() * node.scaleY()) / scale,
        rotation: node.rotation(),
      },
    });
  }, [subMask.id, subMask.parameters, onUpdate, scale, cropX, cropY]);

  const handleRadialTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onUpdate(subMask.id, {
      parameters: {
        ...subMask.parameters,
        centerX: (node.x() / scale) + cropX,
        centerY: (node.y() / scale) + cropY,
        radiusX: (node.radiusX() * scaleX) / scale,
        radiusY: (node.radiusY() * scaleY) / scale,
        rotation: node.rotation(),
      },
    });
  }, [subMask.id, subMask.parameters, onUpdate, scale, cropX, cropY]);

  const handleGroupDragEnd = (e) => {
    const group = e.target;
    const { startX, startY, endX, endY } = subMask.parameters;
    const dx = endX - startX;
    const dy = endY - startY;
    const centerX = startX + dx / 2;
    const centerY = startY + dy / 2;
    const groupX = (centerX - cropX) * scale;
    const groupY = (centerY - cropY) * scale;
    const moveX = group.x() - groupX;
    const moveY = group.y() - groupY;
    onUpdate(subMask.id, {
      parameters: {
        ...subMask.parameters,
        startX: startX + moveX / scale,
        startY: startY + moveY / scale,
        endX: endX + moveX / scale,
        endY: endY + moveY / scale,
      }
    });
  };

  const handlePointDrag = (e, point) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const newX = (pointerPos.x / scale) + cropX;
    const newY = (pointerPos.y / scale) + cropY;

    const newParams = { ...subMask.parameters };
    if (point === 'start') {
      newParams.startX = newX;
      newParams.startY = newY;
    } else {
      newParams.endX = newX;
      newParams.endY = newY;
    }
    onUpdate(subMask.id, { parameters: newParams });
  };

  const handleRangeDrag = (e) => {
    const newRange = Math.abs(e.target.y() / scale);
    onUpdate(subMask.id, {
      parameters: { ...subMask.parameters, range: newRange }
    });
  };

  if (!subMask.visible) {
    return null;
  }

  const commonProps = {
    onClick: onSelect,
    onTap: onSelect,
    stroke: isSelected ? '#0ea5e9' : (subMask.mode === 'subtractive' ? '#f43f5e' : 'white'),
    strokeWidth: isSelected ? 3 : 2,
    strokeScaleEnabled: false,
    dash: [4, 4],
    opacity: isSelected ? 1 : 0.7,
  };

  if (subMask.type === 'ai-subject') {
    const { startX, startY, endX, endY } = subMask.parameters;
    if (endX > startX && endY > startY) {
      return (
        <Rect
          x={(startX - cropX) * scale}
          y={(startY - cropY) * scale}
          width={(endX - startX) * scale}
          height={(endY - startY) * scale}
          onMouseEnter={onMaskMouseEnter}
          onMouseLeave={onMaskMouseLeave}
          {...commonProps}
        />
      );
    }
    return null;
  }

  if (subMask.type === 'brush') {
    const { lines = [] } = subMask.parameters;
    return (
      <Group onClick={onSelect} onTap={onSelect}>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points.flatMap(p => [(p.x - cropX) * scale, (p.y - cropY) * scale])}
            stroke={isSelected ? '#0ea5e9' : (subMask.mode === 'subtractive' ? '#f43f5e' : 'white')}
            strokeWidth={isSelected ? 3 : 2}
            dash={[4, 4]}
            opacity={isSelected ? 1 : 0.7}
            hitStrokeWidth={line.brushSize * scale}
            strokeScaleEnabled={false}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </Group>
    );
  }

  if (subMask.type === 'radial') {
    const { centerX, centerY, radiusX, radiusY, rotation } = subMask.parameters;
    return (
      <>
        <Ellipse
          ref={shapeRef}
          x={(centerX - cropX) * scale}
          y={(centerY - cropY) * scale}
          radiusX={radiusX * scale}
          radiusY={radiusY * scale}
          rotation={rotation}
          draggable
          onDragMove={handleRadialDrag}
          onDragEnd={handleRadialDrag}
          onTransform={handleRadialTransform}
          onTransformEnd={handleRadialTransformEnd}
          onMouseEnter={onMaskMouseEnter}
          onMouseLeave={onMaskMouseLeave}
          {...commonProps}
        />
        {isSelected && (
          <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} onMouseEnter={onMaskMouseEnter} onMouseLeave={onMaskMouseLeave} />
        )}
      </>
    );
  }

  if (subMask.type === 'linear') {
    const { startX, startY, endX, endY, range = 50 } = subMask.parameters;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = startX + dx / 2;
    const centerY = startY + dy / 2;
    const groupX = (centerX - cropX) * scale;
    const groupY = (centerY - cropY) * scale;
    const scaledLen = len * scale;
    const r = range * scale;

    const lineProps = {
      ...commonProps,
      strokeWidth: isSelected ? 2.5 : 2,
      dash: [6, 6],
      hitStrokeWidth: 20,
    };

    const perpendicularDragBoundFunc = function(pos) {
      const group = this.getParent();
      const transform = group.getAbsoluteTransform().copy();
      transform.invert();
      const localPos = transform.point(pos);
      const constrainedLocalPos = { x: 0, y: localPos.y };
      return group.getAbsoluteTransform().point(constrainedLocalPos);
    };

    return (
      <Group
        x={groupX}
        y={groupY}
        rotation={angle * 180 / Math.PI}
        draggable={isSelected}
        onDragEnd={handleGroupDragEnd}
        onMouseEnter={(e) => {
          onMaskMouseEnter();
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'move';
        }}
        onMouseLeave={(e) => {
          onMaskMouseLeave();
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'default';
        }}
        onClick={onSelect}
        onTap={onSelect}
      >
        <Line points={[-5000, 0, 5000, 0]} {...lineProps} dash={[2, 3]} />
        <Line
          y={-r}
          points={[-scaledLen / 2, 0, scaledLen / 2, 0]}
          {...lineProps}
          draggable={isSelected}
          onDragMove={handleRangeDrag}
          onDragEnd={(e) => { handleRangeDrag(e); e.cancelBubble = true; }}
          dragBoundFunc={perpendicularDragBoundFunc}
          onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'row-resize'; onMaskMouseEnter(); }}
          onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'move'; onMaskMouseLeave(); }}
        />
        <Line
          y={r}
          points={[-scaledLen / 2, 0, scaledLen / 2, 0]}
          {...lineProps}
          draggable={isSelected}
          onDragMove={handleRangeDrag}
          onDragEnd={(e) => { handleRangeDrag(e); e.cancelBubble = true; }}
          dragBoundFunc={perpendicularDragBoundFunc}
          onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'row-resize'; onMaskMouseEnter(); }}
          onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'move'; onMaskMouseLeave(); }}
        />
        {isSelected && (
          <>
            <Circle
              x={-scaledLen / 2}
              y={0}
              radius={8}
              fill="#0ea5e9"
              stroke="white"
              strokeWidth={2}
              draggable
              onDragMove={(e) => handlePointDrag(e, 'start')}
              onDragEnd={(e) => { handlePointDrag(e, 'start'); e.cancelBubble = true; }}
              onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'grab'; onMaskMouseEnter(); }}
              onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'move'; onMaskMouseLeave(); }}
            />
            <Circle
              x={scaledLen / 2}
              y={0}
              radius={8}
              fill="#0ea5e9"
              stroke="white"
              strokeWidth={2}
              draggable
              onDragMove={(e) => handlePointDrag(e, 'end')}
              onDragEnd={(e) => { handlePointDrag(e, 'end'); e.cancelBubble = true; }}
              onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'grab'; onMaskMouseEnter(); }}
              onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'move'; onMaskMouseLeave(); }}
            />
          </>
        )}
      </Group>
    );
  }
  return null;
});

const ImageCanvas = memo(({
  isCropping, crop, setCrop, handleCropComplete, adjustments, selectedImage,
  isMasking, imageRenderSize, showOriginal, finalPreviewUrl, isAdjusting,
  uncroppedAdjustedPreviewUrl, maskOverlayUrl,
  onSelectMask, activeMaskId, activeMaskContainerId,
  updateSubMask, setIsMaskHovered, isMaskControlHovered,
  brushSettings, onGenerateAiMask, isStraightenActive, onStraighten,
  isAiEditing, activeAiPatchContainerId, activeAiSubMaskId, onSelectAiSubMask
}) => {
  const [isCropViewVisible, setIsCropViewVisible] = useState(false);
  const imagePathRef = useRef(null);
  const latestEditedUrlRef = useRef(null);
  const [layers, setLayers] = useState([]);
  const cropImageRef = useRef(null);
  const prevTransformPropsRef = useRef(null);

  const isDrawing = useRef(false);
  const currentLine = useRef(null);
  const [previewLine, setPreviewLine] = useState(null);
  const [straightenLine, setStraightenLine] = useState(null);
  const isStraightening = useRef(false);
  const [cursorPreview, setCursorPreview] = useState({ x: 0, y: 0, visible: false });

  const activeContainer = useMemo(() => {
    if (isMasking) {
      return adjustments.masks.find(c => c.id === activeMaskContainerId);
    }
    if (isAiEditing) {
      return adjustments.aiPatches.find(p => p.id === activeAiPatchContainerId);
    }
    return null;
  }, [adjustments.masks, adjustments.aiPatches, activeMaskContainerId, activeAiPatchContainerId, isMasking, isAiEditing]);

  const activeSubMask = useMemo(() => {
    if (!activeContainer) return null;
    if (isMasking) {
      return activeContainer.subMasks.find(m => m.id === activeMaskId);
    }
    if (isAiEditing) {
      return activeContainer.subMasks.find(m => m.id === activeAiSubMaskId);
    }
    return null;
  }, [activeContainer, activeMaskId, activeAiSubMaskId, isMasking, isAiEditing]);

  const isBrushActive = (isMasking || isAiEditing) && activeSubMask?.type === 'brush';
  const isAiSubjectActive = (isMasking || isAiEditing) && activeSubMask?.type === 'ai-subject';

  const sortedSubMasks = useMemo(() => {
    if (!activeContainer) return [];
    const activeId = isMasking ? activeMaskId : activeAiSubMaskId;
    const selectedMask = activeContainer.subMasks.find(m => m.id === activeId);
    const otherMasks = activeContainer.subMasks.filter(m => m.id !== activeId);
    return selectedMask ? [...otherMasks, selectedMask] : activeContainer.subMasks;
  }, [activeContainer, activeMaskId, activeAiSubMaskId, isMasking, isAiEditing]);

  useEffect(() => {
    const { path: currentImagePath, originalUrl, thumbnailUrl } = selectedImage;
    const topLayer = layers[layers.length - 1];

    const imageChanged = currentImagePath !== imagePathRef.current;

    const rotationChanged = !imageChanged && prevTransformPropsRef.current && prevTransformPropsRef.current.rotation !== adjustments.rotation;
    const aspectRatioChanged = !imageChanged && prevTransformPropsRef.current && prevTransformPropsRef.current.aspectRatio !== adjustments.aspectRatio;

    if (imageChanged || rotationChanged || aspectRatioChanged) {
        imagePathRef.current = currentImagePath;
        prevTransformPropsRef.current = {
            rotation: adjustments.rotation,
            aspectRatio: adjustments.aspectRatio,
        };
        latestEditedUrlRef.current = null;

        const initialUrl = thumbnailUrl || originalUrl;
        if (initialUrl) {
            setLayers([{ id: initialUrl, url: initialUrl, opacity: 1 }]);
        } else {
            setLayers([]);
        }
        return;
    }

    if (showOriginal && topLayer?.id !== 'original') {
      setLayers(prev => [...prev, { id: 'original', url: originalUrl, opacity: 0 }]);
      return;
    }
    if (!showOriginal && topLayer?.id === 'original') {
      const urlToShow = latestEditedUrlRef.current || finalPreviewUrl || originalUrl || thumbnailUrl;
      if (urlToShow) {
          setLayers(prev => [...prev, { id: urlToShow, url: urlToShow, opacity: 0 }]);
      }
      return;
    }

    if (finalPreviewUrl && finalPreviewUrl !== latestEditedUrlRef.current) {
      latestEditedUrlRef.current = finalPreviewUrl;
      const img = new Image();
      img.src = finalPreviewUrl;
      img.onload = () => {
        if (img.src === latestEditedUrlRef.current) {
          if (layers.length === 0) {
            setLayers([{ id: img.src, url: img.src, opacity: 1 }]);
          } else {
            setLayers(prev => [...prev, { id: img.src, url: img.src, opacity: 0 }]);
          }
        }
      };
      return () => { img.onload = null; };
    }

    if (layers.length === 0 && !finalPreviewUrl) {
        const initialUrl = originalUrl || thumbnailUrl;
        if (initialUrl && initialUrl !== latestEditedUrlRef.current) {
            latestEditedUrlRef.current = initialUrl;
            setLayers([{ id: initialUrl, url: initialUrl, opacity: 1 }]);
        }
    }
  }, [selectedImage, finalPreviewUrl, showOriginal, layers, adjustments.rotation, adjustments.aspectRatio]);

  useEffect(() => {
    const layerToFadeIn = layers.find(l => l.opacity === 0);
    if (layerToFadeIn) {
      const timer = setTimeout(() => {
        setLayers(prev =>
          prev.map(l => (l.id === layerToFadeIn.id ? { ...l, opacity: 1 } : l))
        );
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [layers]);

  const handleTransitionEnd = useCallback((finishedId) => {
    setLayers(prev => prev.length > 1 ? prev.filter(l => l.id === finishedId) : prev);
  }, []);

  useEffect(() => {
    if (isCropping) {
      const timer = setTimeout(() => setIsCropViewVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsCropViewVisible(false);
    }
  }, [isCropping]);

  const handleMouseDown = useCallback((e) => {
    const toolActive = isBrushActive || isAiSubjectActive;
    if (toolActive) {
      e.evt.preventDefault();
      isDrawing.current = true;
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      let toolType = 'brush';
      if (isAiSubjectActive) toolType = 'ai-selector';

      const newLine = {
        tool: toolType,
        brushSize: isBrushActive ? brushSettings.size : 2,
        points: [pos]
      };
      currentLine.current = newLine;
      setPreviewLine(newLine);
    } else {
      if (e.target === e.target.getStage()) {
        if (isMasking) onSelectMask(null);
        if (isAiEditing) onSelectAiSubMask(null);
      }
    }
  }, [isBrushActive, isAiSubjectActive, brushSettings, onSelectMask, onSelectAiSubMask, isMasking, isAiEditing]);

  const handleMouseMove = useCallback((e) => {
    const toolActive = isBrushActive || isAiSubjectActive;
    if (toolActive) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (pos) {
        setCursorPreview({ x: pos.x, y: pos.y, visible: true });
      } else {
        setCursorPreview(p => ({ ...p, visible: false }));
      }
    }

    if (!isDrawing.current || !toolActive) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const updatedLine = {
      ...currentLine.current,
      points: [...currentLine.current.points, pos]
    };
    currentLine.current = updatedLine;
    setPreviewLine(updatedLine);
  }, [isBrushActive, isAiSubjectActive]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current || !currentLine.current) return;

    const wasDrawing = isDrawing.current;
    isDrawing.current = false;
    const line = currentLine.current;
    currentLine.current = null;
    setPreviewLine(null);

    if (!wasDrawing || !line) return;

    const { scale } = imageRenderSize;
    const cropX = adjustments.crop?.x || 0;
    const cropY = adjustments.crop?.y || 0;

    const activeId = isMasking ? activeMaskId : activeAiSubMaskId;

    if (isAiSubjectActive) {
      const points = line.points;
      if (points.length > 1) {
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const startPoint = { x: minX / scale + cropX, y: minY / scale + cropY };
        const endPoint = { x: maxX / scale + cropX, y: maxY / scale + cropY };

        if (onGenerateAiMask) {
            onGenerateAiMask(activeId, startPoint, endPoint);
        }
      }
    } else if (isBrushActive) {
      const imageSpaceLine = {
        tool: brushSettings.tool,
        brushSize: brushSettings.size / scale,
        feather: brushSettings.feather / 100,
        points: line.points.map(p => ({
          x: p.x / scale + cropX,
          y: p.y / scale + cropY,
        }))
      };

      const existingLines = activeSubMask.parameters.lines || [];

      if (brushSettings.tool === 'eraser') {
        const remainingLines = existingLines.filter(
          drawnLine => !linesIntersect(imageSpaceLine, drawnLine)
        );
        if (remainingLines.length !== existingLines.length) {
          updateSubMask(activeId, {
            parameters: { ...activeSubMask.parameters, lines: remainingLines }
          });
        }
      } else {
        updateSubMask(activeId, {
          parameters: {
            ...activeSubMask.parameters,
            lines: [...existingLines, imageSpaceLine]
          }
        });
      }
    }
  }, [isBrushActive, isAiSubjectActive, activeSubMask, activeMaskId, activeAiSubMaskId, updateSubMask, adjustments.crop, imageRenderSize.scale, brushSettings, onGenerateAiMask, isMasking, isAiEditing]);

  const handleMouseEnter = useCallback(() => {
    if (isBrushActive || isAiSubjectActive) {
      setCursorPreview(p => ({ ...p, visible: true }));
    }
  }, [isBrushActive, isAiSubjectActive]);

  const handleMouseLeave = useCallback(() => {
    setCursorPreview(p => ({ ...p, visible: false }));
    if (isDrawing.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  const handleStraightenMouseDown = (e) => {
    if (e.evt.button !== 0) return;
    isStraightening.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setStraightenLine({ start: pos, end: pos });
  };

  const handleStraightenMouseMove = (e) => {
    if (!isStraightening.current) return;
    const pos = e.target.getStage().getPointerPosition();
    setStraightenLine(prev => ({ ...prev, end: pos }));
  };

  const handleStraightenMouseUp = () => {
    if (!isStraightening.current) return;
    isStraightening.current = false;

    if (!straightenLine || (straightenLine.start.x === straightenLine.end.x && straightenLine.start.y === straightenLine.start.y)) {
      setStraightenLine(null);
      return;
    }

    const { start, end } = straightenLine;

    const { rotation = 0 } = adjustments;
    const theta_rad = rotation * Math.PI / 180;
    const cos_t = Math.cos(theta_rad);
    const sin_t = Math.sin(theta_rad);

    const { width, height } = uncroppedImageRenderSize;
    const cx = width / 2;
    const cy = height / 2;

    const unrotate = (p) => {
      const x = p.x - cx;
      const y = p.y - cy;
      return {
        x: cx + x * cos_t + y * sin_t,
        y: cy - x * sin_t + y * cos_t,
      };
    };

    const start_unrotated = unrotate(start);
    const end_unrotated = unrotate(end);

    const dx = end_unrotated.x - start_unrotated.x;
    const dy = end_unrotated.y - start_unrotated.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    let targetAngle;
    if (angle > -45 && angle <= 45) targetAngle = 0;
    else if (angle > 45 && angle <= 135) targetAngle = 90;
    else if (angle > 135 || angle <= -135) targetAngle = 180;
    else targetAngle = -90;

    let correction = targetAngle - angle;
    if (correction > 180) correction -= 360;
    if (correction < -180) correction += 360;

    onStraighten(correction);
    setStraightenLine(null);
  };

  const handleStraightenMouseLeave = () => { if (isStraightening.current) { isStraightening.current = false; setStraightenLine(null); } };

  const cropPreviewUrl = uncroppedAdjustedPreviewUrl || selectedImage.originalUrl;
  const isContentReady = layers.length > 0 || selectedImage.thumbnailUrl;

  const uncroppedImageRenderSize = useMemo(() => {
    if (!selectedImage?.width || !selectedImage?.height || !imageRenderSize?.width || !imageRenderSize?.height) {
      return null;
    }

    const viewportWidth = imageRenderSize.width + 2 * imageRenderSize.offsetX;
    const viewportHeight = imageRenderSize.height + 2 * imageRenderSize.offsetY;

    let uncroppedEffectiveWidth = selectedImage.width;
    let uncroppedEffectiveHeight = selectedImage.height;
    const orientationSteps = adjustments.orientationSteps || 0;
    if (orientationSteps === 1 || orientationSteps === 3) {
        [uncroppedEffectiveWidth, uncroppedEffectiveHeight] = [uncroppedEffectiveHeight, uncroppedEffectiveWidth];
    }

    if (uncroppedEffectiveWidth <= 0 || uncroppedEffectiveHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
        return null;
    }

    const scale = Math.min(
        viewportWidth / uncroppedEffectiveWidth,
        viewportHeight / uncroppedEffectiveHeight
    );

    const renderWidth = uncroppedEffectiveWidth * scale;
    const renderHeight = uncroppedEffectiveHeight * scale;

    return { width: renderWidth, height: renderHeight };
  }, [selectedImage?.width, selectedImage?.height, imageRenderSize, adjustments.orientationSteps]);

  const cropImageTransforms = useMemo(() => {
    const transforms = [`rotate(${adjustments.rotation || 0}deg)`];
    if (adjustments.flipHorizontal) transforms.push('scaleX(-1)');
    if (adjustments.flipVertical) transforms.push('scaleY(-1)');
    return transforms.join(' ');
  }, [adjustments.rotation, adjustments.flipHorizontal, adjustments.flipVertical]);

  return (
    <div className="relative" style={{ width: '100%', height: '100%' }}>
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-200 flex items-center justify-center"
        style={{
          opacity: isCropViewVisible ? 0 : 1,
          pointerEvents: isCropViewVisible ? 'none' : 'auto',
        }}
      >
        <div
          className={clsx(
            "transition-opacity duration-300",
            isAdjusting && !showOriginal ? 'opacity-70' : 'opacity-100'
          )}
          style={{
            opacity: isContentReady ? 1 : 0,
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        >
          <div className="absolute inset-0 w-full h-full">
            {layers.map(layer => (
              <img
                key={layer.id}
                src={layer.url}
                alt={layer.id === 'original' ? 'Original' : 'Edited'}
                onTransitionEnd={() => handleTransitionEnd(layer.id)}
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  opacity: layer.opacity,
                  transition: 'opacity 150ms ease-in-out',
                }}
              />
            ))}
            {(isMasking || isAiEditing) && maskOverlayUrl && (
              <img
                src={maskOverlayUrl}
                alt="Mask Overlay"
                className="absolute object-contain pointer-events-none"
                style={{
                  width: `${imageRenderSize.width}px`,
                  height: `${imageRenderSize.height}px`,
                  left: `${imageRenderSize.offsetX}px`,
                  top: `${imageRenderSize.offsetY}px`,
                  opacity: (showOriginal || isMaskControlHovered) ? 0 : 1,
                  transition: 'opacity 150ms ease-in-out',
                }}
              />
            )}
          </div>
        </div>

        <Stage
          width={imageRenderSize.width}
          height={imageRenderSize.height}
          className="transition-opacity duration-300"
          style={{
            position: 'absolute',
            left: `${imageRenderSize.offsetX}px`,
            top: `${imageRenderSize.offsetY}px`,
            zIndex: 4,
            opacity: showOriginal ? 0 : 1,
            pointerEvents: showOriginal ? 'none' : 'auto',
            cursor: (isBrushActive || isAiSubjectActive) ? 'crosshair' : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Layer>
            {(isMasking || isAiEditing) && activeContainer && sortedSubMasks.map(subMask => (
              <MaskOverlay
                key={subMask.id}
                subMask={subMask}
                scale={imageRenderSize.scale}
                onUpdate={updateSubMask}
                isSelected={subMask.id === (isMasking ? activeMaskId : activeAiSubMaskId)}
                onSelect={() => (isMasking ? onSelectMask(subMask.id) : onSelectAiSubMask(subMask.id))}
                onMaskMouseEnter={() => !(isBrushActive || isAiSubjectActive) && setIsMaskHovered(true)}
                onMaskMouseLeave={() => !(isBrushActive || isAiSubjectActive) && setIsMaskHovered(false)}
                adjustments={adjustments}
              />
            ))}
            {previewLine && (
              <Line
                points={previewLine.points.flatMap(p => [p.x, p.y])}
                stroke={
                  previewLine.tool === 'eraser' ? '#f43f5e' : '#0ea5e9'
                }
                strokeWidth={
                  previewLine.tool === 'ai-selector' ? 2 : previewLine.brushSize
                }
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                opacity={0.8}
                listening={false}
                dash={
                  previewLine.tool === 'ai-selector' ? [4, 4] : undefined
                }
              />
            )}
            {isBrushActive && cursorPreview.visible && (
              <Circle
                x={cursorPreview.x}
                y={cursorPreview.y}
                radius={brushSettings.size / 2}
                stroke={
                  brushSettings.tool === 'eraser' ? '#f43f5e' : '#0ea5e9'
                }
                strokeWidth={1}
                listening={false}
                perfectDrawEnabled={false}
              />
            )}
          </Layer>
        </Stage>
      </div>

      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-200"
        style={{
          opacity: isCropViewVisible ? 1 : 0,
          pointerEvents: isCropViewVisible ? 'auto' : 'none',
        }}
      >
        {cropPreviewUrl && uncroppedImageRenderSize && (
          <div style={{ position: 'relative', width: uncroppedImageRenderSize.width, height: uncroppedImageRenderSize.height }}>
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={handleCropComplete}
              aspect={adjustments.aspectRatio}
              ruleOfThirds={!isStraightenActive}
            >
              <img
                ref={cropImageRef}
                alt="Crop preview"
                src={cropPreviewUrl}
                style={{
                  display: 'block',
                  width: `${uncroppedImageRenderSize.width}px`,
                  height: `${uncroppedImageRenderSize.height}px`,
                  objectFit: 'contain',
                  transform: cropImageTransforms,
                }}
              />
            </ReactCrop>
            {isStraightenActive && (
              <Stage
                width={uncroppedImageRenderSize.width}
                height={uncroppedImageRenderSize.height}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, cursor: 'crosshair' }}
                onMouseDown={handleStraightenMouseDown}
                onMouseMove={handleStraightenMouseMove}
                onMouseUp={handleStraightenMouseUp}
                onMouseLeave={handleStraightenMouseLeave}
              >
                <Layer>
                  {straightenLine && <Line points={[straightenLine.start.x, straightenLine.start.y, straightenLine.end.x, straightenLine.end.y]} stroke="#0ea5e9" strokeWidth={2} dash={[4, 4]} listening={false} />}
                </Layer>
              </Stage>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ImageCanvas;