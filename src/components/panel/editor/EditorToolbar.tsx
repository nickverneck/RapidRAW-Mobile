import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, ArrowLeft, Maximize, Loader2, Undo, Redo, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { SelectedImage } from '../../ui/AppProperties';
import { IconAperture, IconCalendar, IconClock, IconFocalLength, IconIso, IconShutter } from './ExifIcons';

interface EditorToolbarProps {
  canRedo: boolean;
  canUndo: boolean;
  isFullScreenLoading: boolean;
  isWaveformVisible: boolean;
  isLoading: boolean;
  isLoadingFullRes?: boolean;
  onBackToLibrary(): void;
  onRedo(): void;
  onToggleFullScreen(): void;
  onToggleShowOriginal(): void;
  onToggleWaveform(): void;
  onUndo(): void;
  selectedImage: SelectedImage;
  showOriginal: boolean;
  showDateView: boolean;
  onToggleDateView(): void;
}

const EditorToolbar = memo(
  ({
    canRedo,
    canUndo,
    isFullScreenLoading,
    isLoading,
    isLoadingFullRes,
    isWaveformVisible,
    onBackToLibrary,
    onRedo,
    onToggleFullScreen,
    onToggleShowOriginal,
    onToggleWaveform,
    onUndo,
    selectedImage,
    showOriginal,
    showDateView,
    onToggleDateView,
  }: EditorToolbarProps) => {
    const isAnyLoading = isLoading || !!isLoadingFullRes || isFullScreenLoading;
    const [isLoaderVisible, setIsLoaderVisible] = useState(false);
    const [disableLoaderTransition, setDisableLoaderTransition] = useState(false);
    const hideTimeoutRef = useRef<number | null>(null);
    const prevIsLoadingRef = useRef(isLoading);
    const [isVcHovered, setIsVcHovered] = useState(false);
    const [isInfoHovered, setIsInfoHovered] = useState(false);

    const showResolution = selectedImage.width > 0 && selectedImage.height > 0;
    const [displayedResolution, setDisplayedResolution] = useState('');

    const { baseName, isVirtualCopy, vcId, exifData, hasExif } = useMemo(() => {
      const path = selectedImage.path;
      const parts = path.split('?vc=');
      const fullFileName = parts[0].split(/[\/\\]/).pop() || '';

      const exif = selectedImage.exif || {};

      let fNum = exif.FNumber;
      if (fNum) {
        const fStr = String(fNum);
        fNum = fStr.toLowerCase().startsWith('f') ? fStr : `f/${fStr}`;
      }

      let captureDate = null;
      let captureTime = null;

      if (exif.DateTimeOriginal) {
        const dateTimeParts = exif.DateTimeOriginal.split(' ');
        captureDate = dateTimeParts[0]?.replace(/:/g, '-') || null;
        if (dateTimeParts[1]) {
          const timeParts = dateTimeParts[1].split(':');
          captureTime = `${timeParts[0]}:${timeParts[1]}`;
        }
      }

      const data = {
        iso: exif.PhotographicSensitivity || exif.ISO,
        fNumber: fNum,
        shutter: exif.ExposureTime,
        focal: exif.FocalLengthIn35mmFilm,
        captureDate: captureDate,
        captureTime: captureTime,
      };

      const hasData = !!(data.iso || data.fNumber || data.shutter || data.focal || data.captureDate);

      return {
        baseName: fullFileName,
        isVirtualCopy: parts.length > 1,
        vcId: parts.length > 1 ? parts[1] : null,
        exifData: data,
        hasExif: hasData,
      };
    }, [selectedImage.path, selectedImage.exif]);

    useEffect(() => {
      if (showResolution) {
        setDisplayedResolution(` - ${selectedImage.width} × ${selectedImage.height}`);
      }
    }, [showResolution, selectedImage.width, selectedImage.height]);

    useEffect(() => {
      const wasLoadingResolution = prevIsLoadingRef.current && !isLoading;

      if (isAnyLoading) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setDisableLoaderTransition(false);
        setIsLoaderVisible(true);
      } else if (isLoaderVisible) {
        if (wasLoadingResolution) {
          setDisableLoaderTransition(true);
          setIsLoaderVisible(false);
        } else {
          setDisableLoaderTransition(false);
          hideTimeoutRef.current = window.setTimeout(() => {
            setIsLoaderVisible(false);
          }, 300);
        }
      }

      prevIsLoadingRef.current = isLoading;

      return () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, [isAnyLoading, isLoading, isLoaderVisible]);

    const isExpanded = isInfoHovered && (hasExif || isLoading);

    return (
      <div className="relative flex-shrink-0 flex items-center justify-between px-4 h-14 gap-4 z-40">
        <div className="flex items-center gap-2 flex-shrink-0 z-40">
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors flex-shrink-0"
            onClick={onBackToLibrary}
            title="Back to Library"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="hidden 2xl:flex items-center gap-2" aria-hidden="true">
            <div className="p-2 invisible pointer-events-none">
              <Undo size={20} />
            </div>
            <div className="p-2 invisible pointer-events-none">
              <Undo size={20} />
            </div>
            <div className="p-2 invisible pointer-events-none">
              <Undo size={20} />
            </div>
            <div className="p-2 invisible pointer-events-none">
              <Undo size={20} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center min-w-0 relative h-full">
          <div
            className={clsx(
              'bg-surface text-text-secondary flex flex-col items-center overflow-hidden transition-all duration-200 ease-out pt-2',
              isExpanded
                ? 'h-[4.5rem] px-8 rounded-2xl absolute min-w-[340px] whitespace-nowrap shadow-2xl shadow-black/50'
                : 'h-9 px-4 rounded-[18px] absolute min-w-0 w-auto max-w-full shadow-none',
            )}
            onMouseEnter={() => setIsInfoHovered(true)}
            onMouseLeave={() => setIsInfoHovered(false)}
            style={{
              top: '10px',
              transform: 'translateX(-50%)',
              left: '50%',
              zIndex: isExpanded ? 50 : 0,
            }}
          >
            <div className="flex items-center justify-center max-w-full h-5 shrink-0">
              <span className="font-medium text-text-primary truncate min-w-0 shrink text-xs">{baseName}</span>

              {isVirtualCopy && (
                <div
                  className="ml-2 flex-shrink-0 bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-full flex items-center overflow-hidden cursor-default"
                  onMouseEnter={() => setIsVcHovered(true)}
                  onMouseLeave={() => setIsVcHovered(false)}
                >
                  <span>VC</span>
                  <div
                    className={clsx(
                      'transition-all duration-300 ease-out overflow-hidden whitespace-nowrap',
                      isVcHovered ? 'max-w-20 opacity-100' : 'max-w-0 opacity-0',
                    )}
                  >
                    <span>-{vcId}</span>
                  </div>
                </div>
              )}

              <div
                className={clsx(
                  'transition-all duration-300 ease-out overflow-hidden whitespace-nowrap flex-shrink-0',
                  showResolution ? 'max-w-[10rem] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0',
                )}
              >
                <span
                  className={clsx(
                    'block transition-transform duration-200 delay-100 text-xs',
                    showResolution ? 'scale-100' : 'scale-95',
                  )}
                >
                  {displayedResolution}
                </span>
              </div>

              <div
                className={clsx(
                  'overflow-hidden flex-shrink-0',
                  isLoaderVisible ? 'max-w-[1rem] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0',
                  disableLoaderTransition ? 'transition-none' : 'transition-all duration-300',
                )}
              >
                <Loader2 size={12} className="animate-spin" />
              </div>
            </div>

            <div
              className={clsx(
                'relative mt-2 w-full flex-grow justify-center border-t border-text-secondary/10 pt-2 transition-opacity duration-200',
                isExpanded ? 'opacity-100 delay-75' : 'opacity-0 hidden',
                hasExif && 'cursor-pointer',
              )}
              onClick={() => hasExif && onToggleDateView()}
            >
              <div
                className={clsx(
                  'absolute inset-0 flex items-center justify-center gap-6 text-xs font-medium transition-opacity duration-200',
                  showDateView ? 'opacity-0 pointer-events-none' : 'opacity-100',
                )}
              >
                {exifData.shutter && (
                  <div className="flex items-center gap-1.5" title="Shutter Speed">
                    <span className="text-text-secondary">
                      <IconShutter />
                    </span>
                    <span className="text-text-primary">{exifData.shutter}</span>
                  </div>
                )}
                {exifData.fNumber && (
                  <div className="flex items-center gap-1.5" title="Aperture">
                    <span className="text-text-secondary">
                      <IconAperture />
                    </span>
                    <span className="text-text-primary">{exifData.fNumber}</span>
                  </div>
                )}
                {exifData.iso && (
                  <div className="flex items-center gap-1.5" title="ISO">
                    <span className="text-text-secondary">
                      <IconIso />
                    </span>
                    <span className="text-text-primary">{exifData.iso}</span>
                  </div>
                )}
                {exifData.focal && (
                  <div className="flex items-center gap-1.5" title="Focal Length">
                    <span className="text-text-secondary">
                      <IconFocalLength />
                    </span>
                    <span className="text-text-primary">
                      {String(exifData.focal).endsWith('mm') ? exifData.focal : `${exifData.focal}mm`}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={clsx(
                  'absolute inset-0 flex items-center justify-center gap-6 text-xs font-medium transition-opacity duration-200',
                  showDateView ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
              >
                {exifData.captureDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">
                      <IconCalendar />
                    </span>
                    <span className="text-text-primary">{exifData.captureDate}</span>
                  </div>
                )}
                {exifData.captureTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">
                      <IconClock />
                    </span>
                    <span className="text-text-primary">{exifData.captureTime}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 z-40">
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={20} />
          </button>
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={20} />
          </button>
          <button
            className={clsx(
              'p-2 rounded-full transition-colors',
              isWaveformVisible
                ? 'bg-accent text-button-text hover:bg-accent/90 hover:text-button-text'
                : 'bg-surface hover:bg-card-active text-text-primary',
            )}
            onClick={onToggleWaveform}
            title="Toggle Waveform (W)"
          >
            <Waves size={20} />
          </button>

          <button
            className={clsx(
              'p-2 rounded-full transition-colors',
              showOriginal
                ? 'bg-accent text-button-text hover:bg-accent/90 hover:text-button-text'
                : 'bg-surface hover:bg-card-active text-text-primary',
            )}
            onClick={onToggleShowOriginal}
            title={showOriginal ? 'Show Edited (.)' : 'Show Original (.)'}
          >
            {showOriginal ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button
            className="bg-surface text-text-primary p-2 rounded-full hover:bg-card-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            disabled={isFullScreenLoading}
            onClick={onToggleFullScreen}
            title="Toggle Fullscreen (F)"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {isFullScreenLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute"
                  >
                    <Loader2 size={20} className="animate-spin text-accent" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="maximize"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute"
                  >
                    <Maximize size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>
      </div>
    );
  },
);

export default EditorToolbar;