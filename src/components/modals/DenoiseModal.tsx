import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Save, Wand2, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface DenoiseModalProps {
  isOpen: boolean;
  onClose(): void;
  onDenoise(intensity: number): void;
  onSave(): Promise<string>;
  onOpenFile(path: string): void;
  error: string | null;
  previewBase64: string | null;
  isProcessing: boolean;
  progressMessage: string | null;
}

export default function DenoiseModal({
  isOpen,
  onClose,
  onDenoise,
  onSave,
  onOpenFile,
  error,
  previewBase64,
  isProcessing,
  progressMessage,
}: DenoiseModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [intensity, setIntensity] = useState<number>(0.5);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setSavedPath(null);
        setIsSaving(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isProcessing || isSaving) return;
    onClose();
  }, [onClose, isProcessing, isSaving]);

  const handleRunDenoise = () => {
    setSavedPath(null);
    onDenoise(intensity);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const path = await onSave();
      setSavedPath(path);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpen = () => {
    if (savedPath) {
      onOpenFile(savedPath);
      handleClose();
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-surface rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${
          show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-semibold text-text-primary">Denoise</h2>
        </div>

        <div className="flex-1 min-h-[300px] bg-bg-secondary rounded-lg border border-surface relative overflow-hidden flex items-center justify-center mb-6">
          {error ? (
            <div className="flex flex-col items-center p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-text-primary font-medium">Processing Failed</p>
              <p className="text-text-secondary text-sm mt-2">{error}</p>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center z-10">
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <p className="text-text-primary font-medium animate-pulse">
                {progressMessage || 'Initializing...'}
              </p>
            </div>
          ) : previewBase64 ? (
            <>
              {savedPath && (
                <div className="absolute top-4 right-4 z-10 bg-green-500/90 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={14} /> Saved
                </div>
              )}
              <img
                src={previewBase64}
                alt="Denoise Result"
                className="max-w-full max-h-[60vh] object-contain shadow-sm"
              />
            </>
          ) : (
            <div className="text-text-secondary flex flex-col items-center">
              <Wand2 className="w-12 h-12 mb-3 opacity-20" />
              <p>Adjust intensity and click Denoise to start.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-bg-secondary p-4 rounded-lg border border-surface">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">Denoise Intensity</span>
              <span className="text-sm font-mono text-accent">{(intensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              disabled={isProcessing || isSaving}
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accent-hover transition-all"
            />
            <div className="flex justify-between mt-1 text-xs text-text-secondary opacity-60">
              <span>Gentle</span>
              <span>Strong</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-md text-text-secondary hover:bg-card-active transition-colors"
            >
              {savedPath ? 'Close' : 'Cancel'}
            </button>

            {savedPath ? (
              <Button onClick={handleOpen}>Open in Editor</Button>
            ) : (
              <>
                <Button
                  onClick={handleRunDenoise}
                  disabled={isProcessing}
                  variant={previewBase64 ? 'secondary' : 'primary'}
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : previewBase64 ? (
                    <RefreshCw className="mr-2" size={16} />
                  ) : (
                    <Wand2 className="mr-2" size={16} />
                  )}
                  {previewBase64 ? 'Retry' : 'Denoise'}
                </Button>

                {previewBase64 && (
                  <Button onClick={handleSave} disabled={isSaving || isProcessing}>
                    {isSaving ? (
                      <Loader2 className="animate-spin mr-2" size={16} />
                    ) : (
                      <Save className="mr-2" size={16} />
                    )}
                    Save Result
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}