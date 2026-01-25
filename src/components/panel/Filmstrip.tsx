import React, { useState, useEffect, useRef, useCallback, forwardRef, memo, useMemo } from 'react';
import { Image as ImageIcon, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { VariableSizeList as List, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ImageFile, SelectedImage, ThumbnailAspectRatio } from '../ui/AppProperties';
import { Color, COLOR_LABELS } from '../../utils/adjustments';

const VERTICAL_PADDING = 20; 
const HORIZONTAL_PADDING = 4; 
const ITEM_GAP = 8; 

interface ImageLayer {
  id: string;
  url: string;
  opacity: number;
}

interface ItemData {
  imageList: ImageFile[];
  imageRatings: any;
  selectedPath: string | undefined;
  multiSelectedPaths: string[];
  thumbnails: Record<string, string> | undefined;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  onContextMenu?: (event: any, path: string) => void;
  onImageSelect?: (path: string, event: any) => void;
  itemHeight: number;
  setSize: (index: number, width: number) => void;
  sizeMap: Record<number, number>;
}

const OuterElement = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  const { onWheel, style, ...rest } = props;
  return (
    <div
      ref={ref}
      style={{ 
        ...style, 
        overflowY: 'hidden',
        overflowX: 'auto',
      }}
      onWheel={(e) => {
        if (e.currentTarget.style.scrollBehavior !== 'auto') {
           e.currentTarget.style.scrollBehavior = 'auto';
        }

        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.currentTarget.scrollLeft += e.deltaY;
          e.preventDefault();
        }
        onWheel?.(e);
      }}
      {...rest}
    />
  );
});
OuterElement.displayName = 'OuterElement';

const InnerElement = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ style, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        ...style,
        width: typeof style?.width === 'number' ? style.width + (HORIZONTAL_PADDING * 2) : style?.width,
        height: '100%',
        position: 'relative',
      }}
      {...rest}
    />
  );
});
InnerElement.displayName = 'InnerElement';

const FilmstripThumbnail = memo(({
  imageFile,
  imageRatings,
  isActive,
  isSelected,
  onContextMenu,
  onImageSelect,
  thumbData,
  thumbnailAspectRatio,
  itemHeight,
  index,
  setSize,
  knownWidth
}: {
  imageFile: ImageFile;
  imageRatings: any;
  isActive: boolean;
  isSelected: boolean;
  onContextMenu?: (event: any, path: string) => void;
  onImageSelect?: (path: string, event: any) => void;
  thumbData: string | undefined;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  itemHeight: number;
  index: number;
  setSize: (index: number, width: number) => void;
  knownWidth: number;
}) => {
  const [layers, setLayers] = useState<ImageLayer[]>(() => {
    return thumbData ? [{ id: thumbData, url: thumbData, opacity: 1 }] : [];
  });

  const latestThumbDataRef = useRef<string | undefined>(thumbData);
  
  const isInitialLoad = useRef(true);

  const { path, tags } = imageFile;
  const rating = imageRatings?.[path] || 0;
  const colorTag = tags?.find((t: string) => t.startsWith('color:'))?.substring(6);
  const colorLabel = COLOR_LABELS.find((c: Color) => c.name === colorTag);
  const isVirtualCopy = path.includes('?vc=');

  useEffect(() => {
    if (thumbnailAspectRatio === ThumbnailAspectRatio.Contain && thumbData) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const calculatedWidth = itemHeight * ratio;

        if (Math.abs(calculatedWidth - knownWidth) > 1) {
            setSize(index, calculatedWidth);
        }
        
        if (isInitialLoad.current) {
          setTimeout(() => { isInitialLoad.current = false; }, 50);
        }
      };
      img.src = thumbData;
    } 
  }, [thumbData, thumbnailAspectRatio, itemHeight, index, setSize, knownWidth]);

  useEffect(() => {
    if (!thumbData) {
      setLayers([]);
      latestThumbDataRef.current = undefined;
      return;
    }

    if (thumbData !== latestThumbDataRef.current) {
      latestThumbDataRef.current = thumbData;

      if (layers.length === 0) {
        setLayers([{ id: thumbData, url: thumbData, opacity: 1 }]);
        return;
      }

      const img = new Image();
      img.src = thumbData;
      img.onload = () => {
        if (img.src === latestThumbDataRef.current) {
          setLayers((prev) => {
            if (prev.some((l) => l.id === img.src)) return prev;
            return [...prev, { id: img.src, url: img.src, opacity: 0 }];
          });
        }
      };
      return () => { img.onload = null; };
    }
  }, [thumbData, layers.length]);

  useEffect(() => {
    const layerToFadeIn = layers.find((l) => l.opacity === 0);
    if (layerToFadeIn) {
      const timer = setTimeout(() => {
        setLayers((prev) => prev.map((l) => (l.id === layerToFadeIn.id ? { ...l, opacity: 1 } : l)));
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [layers]);

  const handleTransitionEnd = useCallback((finishedId: string) => {
    setLayers((prev) => {
      const finishedIndex = prev.findIndex((l) => l.id === finishedId);
      if (finishedIndex < 0 || prev.length <= 1) return prev;
      return prev.slice(finishedIndex);
    });
  }, []);

  const ringClass = isActive
    ? 'ring-2 ring-accent shadow-md'
    : isSelected
    ? 'ring-2 ring-gray-400'
    : 'hover:ring-2 hover:ring-hover-color';

  const imageClasses = `w-full h-full group-hover:scale-[1.02] transition-transform duration-300`;

  return (
    <motion.div
      className={clsx(
        'h-full w-full rounded-md overflow-hidden cursor-pointer flex-shrink-0 group relative transition-all duration-150 bg-surface',
        ringClass,
      )}
      onClick={(e: any) => {
        e.stopPropagation();
        onImageSelect?.(path, e);
      }}
      onContextMenu={(e: any) => onContextMenu?.(e, path)}
      style={{
        zIndex: isActive ? 2 : isSelected ? 1 : 'auto',
      }}
      title={path.split(/[\\/]/).pop()}
    >
      {layers.length > 0 ? (
        <div className="absolute inset-0 w-full h-full">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="absolute inset-0 w-full h-full"
              style={{
                opacity: layer.opacity,
                transition: 'opacity 150ms ease-in-out',
                willChange: 'opacity',
              }}
              onTransitionEnd={() => handleTransitionEnd(layer.id)}
            >
              {thumbnailAspectRatio === ThumbnailAspectRatio.Contain && (
                <img alt="" className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-50" src={layer.url} />
              )}
              <img
                alt={path.split(/[\\/]/).pop()}
                className={`${imageClasses} ${
                  thumbnailAspectRatio === ThumbnailAspectRatio.Contain ? 'object-contain' : 'object-cover'
                } relative`}
                loading="lazy"
                decoding="async"
                src={layer.url}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface">
          <ImageIcon size={24} className="text-text-secondary animate-pulse" />
        </div>
      )}
      
      {(colorLabel || rating > 0) && (
        <div className="absolute top-1 right-1 bg-primary rounded-full px-1.5 py-0.5 text-xs text-white flex items-center gap-1 backdrop-blur-sm shadow-sm z-10">
          {colorLabel && (
            <div
              className="w-3 h-3 rounded-full ring-1 ring-black/20"
              style={{ backgroundColor: colorLabel.color }}
              title={`Color: ${colorLabel.name}`}
            />
          )}
          {rating > 0 && (
            <>
              <span>{rating}</span>
              <Star size={10} className="fill-white text-white" />
            </>
          )}
        </div>
      )}
      {isVirtualCopy && (
        <div className="absolute bottom-1 right-1 z-10">
          <div className="bg-bg-primary/70 text-white text-[9px] font-bold px-1 py-0.5 rounded-full backdrop-blur-sm">
            VC
          </div>
        </div>
      )}
    </motion.div>
  );
});

const FilmstripRow = memo(({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const {
    imageList,
    imageRatings,
    selectedPath,
    multiSelectedPaths,
    thumbnails,
    thumbnailAspectRatio,
    onContextMenu,
    onImageSelect,
    itemHeight,
    setSize
  } = data;

  const imageFile = imageList[index];
  const fullWidth = style.width as number;
  const contentWidth = fullWidth - ITEM_GAP;

  return (
    <div 
      style={{ 
        ...style,
        left: (style.left as number) + HORIZONTAL_PADDING,
        height: '100%', 
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'flex-start'
      }}
    >
      <div 
        style={{ 
          width: contentWidth, 
          height: itemHeight
        }}
      >
        <FilmstripThumbnail
          imageFile={imageFile}
          imageRatings={imageRatings}
          isActive={selectedPath === imageFile.path}
          isSelected={multiSelectedPaths.includes(imageFile.path)}
          onContextMenu={onContextMenu}
          onImageSelect={onImageSelect}
          thumbData={thumbnails ? thumbnails[imageFile.path] : undefined}
          thumbnailAspectRatio={thumbnailAspectRatio}
          itemHeight={itemHeight}
          index={index}
          setSize={setSize}
          knownWidth={contentWidth}
        />
      </div>
    </div>
  );
}, areEqual);

const FilmstripList = ({ 
  height, 
  width, 
  data 
}: { 
  height: number; 
  width: number; 
  data: Omit<ItemData, 'itemHeight' | 'setSize' | 'sizeMap' | 'gap'> & { clickTriggeredScroll: React.MutableRefObject<boolean> } 
}) => {
  const listRef = useRef<List>(null);
  const outerRef = useRef<HTMLDivElement>(null); 
  const sizeMap = useRef<Record<number, number>>({});
  const visibleRange = useRef({ start: 0, stop: 0 });
  const prevSelectedPath = useRef<string | null>(null);
  const isReadyForSmooth = useRef(false);
  const resizeEndTimer = useRef<number | null>(null);
  const currentDataRef = useRef(data);
  currentDataRef.current = data;
  const pendingResizeRef = useRef<number | null>(null);
  const lowestPendingIndexRef = useRef<number>(Infinity);
  const isAnimatingScroll = useRef(false);
  const scrollAnimationTimeout = useRef<any>(null);
  const pendingScrollTarget = useRef<number | null>(null);
  const itemHeight = Math.max(20, height - VERTICAL_PADDING);

  const getItemSize = useCallback((index: number) => {
    let w;
    if (data.thumbnailAspectRatio === ThumbnailAspectRatio.Cover) {
      w = itemHeight;
    } else {
      w = sizeMap.current[index] || (itemHeight * 1.5);
    }
    return w + ITEM_GAP;
  }, [data.thumbnailAspectRatio, itemHeight]);

  useEffect(() => {
    isReadyForSmooth.current = false;
    const timer = setTimeout(() => {
        isReadyForSmooth.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReadyForSmooth.current) {
        return;
    }

    if (resizeEndTimer.current) clearTimeout(resizeEndTimer.current);

    resizeEndTimer.current = window.setTimeout(() => {
        const { selectedPath, imageList } = currentDataRef.current;
        if (selectedPath && listRef.current && outerRef.current) {
            const index = imageList.findIndex(img => img.path === selectedPath);
            if (index !== -1) {
                outerRef.current.style.scrollBehavior = 'smooth';
                listRef.current.scrollToItem(index, 'center');
            }
        }
    }, 500);
    
    return () => {
        if (resizeEndTimer.current) clearTimeout(resizeEndTimer.current);
    };
  }, [height]);

  useEffect(() => {
    return () => {
      if (pendingResizeRef.current !== null) {
        cancelAnimationFrame(pendingResizeRef.current);
      }
      if (scrollAnimationTimeout.current) {
        clearTimeout(scrollAnimationTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    sizeMap.current = {}; 
    if (listRef.current) {
      listRef.current.resetAfterIndex(0); 
    }
  }, [height, data.thumbnailAspectRatio]);

  const onItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    visibleRange.current = { start: visibleStartIndex, stop: visibleStopIndex };
  }, []);

  const isItemVisible = useCallback((index: number) => {
    const { start, stop } = visibleRange.current;
    return index > start && index < stop; 
  }, []);

  const performSafeScroll = useCallback((index: number, bypassLock = false) => {
    if (!listRef.current || !outerRef.current) return;

    if (!bypassLock && isAnimatingScroll.current) {
      pendingScrollTarget.current = index;
      return;
    }

    isAnimatingScroll.current = true;
    pendingScrollTarget.current = null; 

    if (!isReadyForSmooth.current) {
        outerRef.current.style.scrollBehavior = 'auto';
    } else {
        outerRef.current.style.scrollBehavior = 'smooth';
    }

    listRef.current.scrollToItem(index, 'center');

    if (scrollAnimationTimeout.current) clearTimeout(scrollAnimationTimeout.current);
    
    scrollAnimationTimeout.current = setTimeout(() => {
        isAnimatingScroll.current = false;

        if (pendingScrollTarget.current !== null && pendingScrollTarget.current !== index) {
             const nextTarget = pendingScrollTarget.current;
             if (!isItemVisible(nextTarget)) {
                 performSafeScroll(nextTarget);
             } else {
                 pendingScrollTarget.current = null;
             }
        }
    }, 250);

  }, [isReadyForSmooth, isItemVisible]);


  useEffect(() => {
    const currentPath = data.selectedPath;

    if (currentPath && listRef.current && outerRef.current) {
      const index = data.imageList.findIndex(img => img.path === currentPath);
      
      if (index !== -1) {
        if (currentPath !== prevSelectedPath.current) {
          const isVisible = isItemVisible(index);

          if (data.clickTriggeredScroll.current) {
              data.clickTriggeredScroll.current = false;
              performSafeScroll(index, true); 
          } else if (!isVisible) {
              performSafeScroll(index);
          }
          prevSelectedPath.current = currentPath;
        } else {
          if (!isItemVisible(index)) {
             performSafeScroll(index, true);
          }
        }
      }
    }
  }, [data.selectedPath, data.imageList, isItemVisible, data.clickTriggeredScroll, performSafeScroll]);

  const setSize = useCallback((index: number, width: number) => {
    if (sizeMap.current[index] !== width) {
      sizeMap.current[index] = width;

      if (index < lowestPendingIndexRef.current) {
        lowestPendingIndexRef.current = index;
      }

      if (pendingResizeRef.current === null) {
        pendingResizeRef.current = requestAnimationFrame(() => {
          if (listRef.current && lowestPendingIndexRef.current !== Infinity) {
            listRef.current.resetAfterIndex(lowestPendingIndexRef.current);
          }
          lowestPendingIndexRef.current = Infinity;
          pendingResizeRef.current = null;
        });
      }
    }
  }, []);

  const itemData = useMemo(() => ({
    ...data,
    itemHeight,
    setSize,
    sizeMap: sizeMap.current
  }), [data, itemHeight, setSize]);

  return (
    <List
      ref={listRef}
      outerRef={outerRef}
      height={height}
      width={width}
      itemCount={data.imageList.length}
      itemSize={getItemSize}
      layout="horizontal"
      outerElementType={OuterElement}
      innerElementType={InnerElement}
      className="custom-scrollbar"
      itemData={itemData}
      onItemsRendered={onItemsRendered}
      overscanCount={16}
    >
      {FilmstripRow}
    </List>
  );
};

interface FilmStripProps {
  imageList: Array<ImageFile>;
  imageRatings: any;
  isLoading: boolean;
  multiSelectedPaths: Array<string>;
  onClearSelection?(): void;
  onContextMenu?(event: any, path: string): void;
  onImageSelect?(path: string, event: any): void;
  selectedImage?: SelectedImage;
  thumbnails: Record<string, string> | undefined;
  thumbnailAspectRatio: ThumbnailAspectRatio;
}

export default function Filmstrip({
  imageList,
  imageRatings,
  isLoading,
  multiSelectedPaths,
  onClearSelection,
  onContextMenu,
  onImageSelect,
  selectedImage,
  thumbnails,
  thumbnailAspectRatio,
}: FilmStripProps) {
  const clickTriggeredScroll = useRef(false);

  const handleImageSelect = (path: string, event: any) => {
    if (path !== selectedImage?.path) {
      clickTriggeredScroll.current = true;
    }
    onImageSelect?.(path, event);
  };

  return (
    <div className="h-full w-full" onClick={onClearSelection}>
      <AutoSizer>
        {({ height, width }) => (
          <FilmstripList 
            height={height} 
            width={width}
            data={{
              imageList,
              imageRatings,
              selectedPath: selectedImage?.path,
              multiSelectedPaths,
              thumbnails,
              thumbnailAspectRatio,
              onContextMenu,
              onImageSelect: handleImageSelect,
              clickTriggeredScroll,
            }} 
          />
        )}
      </AutoSizer>
    </div>
  );
}