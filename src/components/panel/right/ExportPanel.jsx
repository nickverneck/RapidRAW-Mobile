import { useState, useEffect, useRef } from 'react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Save, CheckCircle, XCircle, Loader, Ban } from 'lucide-react';
import Switch from '../../ui/Switch';

const FILE_FORMATS = [
  { id: 'jpeg', name: 'JPEG', extensions: ['jpg', 'jpeg'] },
  { id: 'png', name: 'PNG', extensions: ['png'] },
  { id: 'tiff', name: 'TIFF', extensions: ['tiff'] },
];

const FILENAME_VARIABLES = [
  '{original_filename}',
  '{sequence}',
  '{YYYY}',
  '{MM}',
  '{DD}',
  '{hh}',
  '{mm}',
];

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3 border-b border-surface pb-2">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function ExportPanel({ selectedImage, adjustments, multiSelectedPaths, exportState, setExportState }) {
  const [fileFormat, setFileFormat] = useState('jpeg');
  const [jpegQuality, setJpegQuality] = useState(90);
  const [enableResize, setEnableResize] = useState(false);
  const [resizeMode, setResizeMode] = useState('longEdge');
  const [resizeValue, setResizeValue] = useState(2048);
  const [dontEnlarge, setDontEnlarge] = useState(true);
  const [keepMetadata, setKeepMetadata] = useState(true);
  const [stripGps, setStripGps] = useState(true);
  const [filenameTemplate, setFilenameTemplate] = useState('{original_filename}_edited');
  const filenameInputRef = useRef(null);

  const { status, progress, errorMessage } = exportState;
  const isExporting = status === 'exporting';

  const isEditorContext = !!selectedImage;
  const pathsToExport = isEditorContext
    ? (multiSelectedPaths.length > 0 ? multiSelectedPaths : (selectedImage ? [selectedImage.path] : []))
    : multiSelectedPaths;
  const numImages = pathsToExport.length;
  const isBatchMode = numImages > 1;

  useEffect(() => {
    if (!isExporting) {
      setExportState({ status: 'idle', progress: { current: 0, total: 0 }, errorMessage: '' });
    }
  }, [selectedImage, multiSelectedPaths, isExporting, setExportState]);

  const handleVariableClick = (variable) => {
    if (!filenameInputRef.current) return;

    const input = filenameInputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = input.value;

    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    setFilenameTemplate(newValue);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + variable.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleExport = async () => {
    if (numImages === 0 || isExporting) return;

    setExportState({ status: 'exporting', progress: { current: 0, total: numImages }, errorMessage: '' });

    let finalFilenameTemplate = filenameTemplate;
    if (isBatchMode && !filenameTemplate.includes('{sequence}') && !filenameTemplate.includes('{original_filename}')) {
      finalFilenameTemplate = `${filenameTemplate}_{sequence}`;
      setFilenameTemplate(finalFilenameTemplate);
    }

    const exportSettings = {
      jpegQuality: parseInt(jpegQuality, 10),
      resize: enableResize ? { mode: resizeMode, value: parseInt(resizeValue, 10), dontEnlarge } : null,
      keepMetadata,
      stripGps,
      filenameTemplate: finalFilenameTemplate,
    };

    try {
      if (isBatchMode || !isEditorContext) {
        const outputFolder = await open({ title: `Select Folder to Export ${numImages} Image(s)`, directory: true });
        if (outputFolder) {
          await invoke('batch_export_images', {
            outputFolder,
            paths: pathsToExport,
            exportSettings,
            outputFormat: FILE_FORMATS.find(f => f.id === fileFormat).extensions[0],
          });
        } else {
          setExportState(prev => ({ ...prev, status: 'idle' }));
        }
      } else {
        const selectedFormat = FILE_FORMATS.find(f => f.id === fileFormat);
        const originalFilename = selectedImage.path.split(/[\\/]/).pop();
        const [name] = originalFilename.split('.');
        const filePath = await save({
          title: "Save Edited Image",
          defaultPath: `${name}_edited.${selectedFormat.extensions[0]}`,
          filters: FILE_FORMATS.map(f => ({ name: f.name, extensions: f.extensions })),
        });
        if (filePath) {
          await invoke('export_image', {
            originalPath: selectedImage.path,
            outputPath: filePath,
            jsAdjustments: adjustments,
            exportSettings,
          });
        } else {
          setExportState(prev => ({ ...prev, status: 'idle' }));
        }
      }
    } catch (error) {
      console.error('Failed to start export:', error);
      setExportState({ status: 'error', progress, errorMessage: typeof error === 'string' ? error : 'Failed to start export.' });
    }
  };

  const handleCancel = async () => {
    try {
      await invoke('cancel_export');
    } catch (error) {
      console.error("Failed to send cancel request:", error);
    }
  };

  const canExport = numImages > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-surface">
        <h2 className="text-xl font-bold text-primary text-shadow-shiny">
          Export {numImages > 1 ? `(${numImages})` : ''}
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto p-4 text-text-secondary space-y-6">
        {canExport ? (
          <>
            <Section title="File Settings">
              <div className="grid grid-cols-3 gap-2">
                {FILE_FORMATS.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setFileFormat(format.id)}
                    disabled={isExporting}
                    className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                      fileFormat === format.id
                        ? 'bg-surface text-white'
                        : 'bg-surface hover:bg-card-active'
                    } disabled:opacity-50`}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
              {fileFormat === 'jpeg' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm w-20">Quality</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(e.target.value)}
                    disabled={isExporting}
                    className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <span className="text-sm font-mono w-12 text-right">{jpegQuality}</span>
                </div>
              )}
            </Section>

            {isBatchMode && (
              <Section title="File Naming">
                <input
                  ref={filenameInputRef}
                  type="text"
                  value={filenameTemplate}
                  onChange={(e) => setFilenameTemplate(e.target.value)}
                  disabled={isExporting}
                  className="w-full bg-bg-primary border border-surface rounded-md p-2 text-sm text-text-primary focus:ring-accent focus:border-accent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {FILENAME_VARIABLES.map(variable => (
                    <button
                      key={variable}
                      onClick={() => handleVariableClick(variable)}
                      disabled={isExporting}
                      className="px-2 py-1 bg-surface text-text-secondary text-xs rounded-md hover:bg-card-active transition-colors disabled:opacity-50"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Image Sizing">
              <Switch
                label="Resize to Fit"
                checked={enableResize}
                onChange={setEnableResize}
                disabled={isExporting}
              />
              {enableResize && (
                <div className="space-y-4 pl-2 border-l-2 border-surface">
                  <div className="flex items-center gap-2">
                    <select
                      value={resizeMode}
                      onChange={(e) => setResizeMode(e.target.value)}
                      disabled={isExporting}
                      className="w-full bg-bg-primary border border-surface rounded-md p-2 text-sm text-text-primary focus:ring-accent focus:border-accent"
                    >
                      <option value="longEdge">Long Edge</option>
                      <option value="width">Width</option>
                      <option value="height">Height</option>
                    </select>
                    <input
                      type="number"
                      value={resizeValue}
                      onChange={(e) => setResizeValue(e.target.value)}
                      disabled={isExporting}
                      className="w-24 bg-bg-primary text-center rounded-md p-2 border border-surface focus:border-accent focus:ring-accent"
                      min="1"
                    />
                    <span className="text-sm">pixels</span>
                  </div>
                  <Switch
                    label="Don't Enlarge"
                    checked={dontEnlarge}
                    onChange={setDontEnlarge}
                    disabled={isExporting}
                  />
                </div>
              )}
            </Section>

            <Section title="Metadata">
              <Switch
                label="Keep Original Metadata"
                checked={keepMetadata}
                onChange={setKeepMetadata}
                disabled={isExporting}
              />
              {keepMetadata && (
                <div className="pl-2 border-l-2 border-surface">
                  <Switch
                    label="Remove GPS Data"
                    checked={stripGps}
                    onChange={setStripGps}
                    disabled={isExporting}
                  />
                </div>
              )}
            </Section>
          </>
        ) : (
          <p className="text-center text-text-tertiary mt-4">No image selected for export.</p>
        )}
      </div>

      <div className="p-4 border-t border-surface flex-shrink-0 space-y-3">
        {isExporting ? (
          <button
            onClick={handleCancel}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/80 text-white font-bold rounded-lg hover:bg-red-600 transition-all"
          >
            <Ban size={18} />
            Cancel Export
          </button>
        ) : (
          <button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface text-white font-bold rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save size={18} />
            Export {numImages > 1 ? `${numImages} Images` : 'Image'}
          </button>
        )}

        {status === 'exporting' && (
          <div className="flex items-center gap-2 text-accent mt-3 text-sm justify-center">
            <Loader size={16} className="animate-spin" />
            <span>{`Exporting... (${progress.current}/${progress.total})`}</span>
          </div>
        )}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 mt-3 text-sm justify-center">
            <CheckCircle size={16} />
            <span>Export successful!</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 mt-3 text-sm justify-center text-center">
            <XCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {status === 'cancelled' && (
          <div className="flex items-center gap-2 text-yellow-400 mt-3 text-sm justify-center">
            <Ban size={16} />
            <span>Export cancelled.</span>
          </div>
        )}
      </div>
    </div>
  );
}