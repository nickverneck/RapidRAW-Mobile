import { useState, useEffect, useCallback, useRef } from 'react';
import Switch from '../ui/Switch';

const FILENAME_VARIABLES = [
  '{original_filename}',
  '{sequence}',
  '{YYYY}',
  '{MM}',
  '{DD}',
  '{hh}',
  '{mm}',
];

export default function ImportSettingsModal({ isOpen, onClose, onSave, fileCount }) {
  const [isMounted, setIsMounted] = useState(false);
  const [show, setShow] = useState(false);

  const [filenameTemplate, setFilenameTemplate] = useState('{original_filename}');
  const [organizeByDate, setOrganizeByDate] = useState(false);
  const [dateFolderFormat, setDateFolderFormat] = useState('YYYY/MM-DD');
  const [deleteAfterImport, setDeleteAfterImport] = useState(false);
  const filenameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSave = useCallback(() => {
    let finalFilenameTemplate = filenameTemplate;
    if (fileCount > 1 && !filenameTemplate.includes('{sequence}') && !filenameTemplate.includes('{original_filename}')) {
      finalFilenameTemplate = `${filenameTemplate}_{sequence}`;
    }

    onSave({
      filenameTemplate: finalFilenameTemplate,
      organizeByDate,
      dateFolderFormat,
      deleteAfterImport,
    });
    onClose();
  }, [onSave, onClose, filenameTemplate, organizeByDate, dateFolderFormat, deleteAfterImport, fileCount]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

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

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-surface rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 ease-out ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-6">Import Settings</h3>
        
        <div className="space-y-6 text-sm">
          <div>
            <label className="font-semibold text-text-primary block mb-2">File Naming</label>
            <input
              ref={filenameInputRef}
              type="text"
              value={filenameTemplate}
              onChange={(e) => setFilenameTemplate(e.target.value)}
              autoFocus
              className="w-full bg-bg-primary border border-surface rounded-md p-2 text-sm text-text-primary focus:ring-accent focus:border-accent"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {FILENAME_VARIABLES.map(variable => (
                <button
                  key={variable}
                  onClick={() => handleVariableClick(variable)}
                  className="px-2 py-1 bg-surface text-text-secondary text-xs rounded-md hover:bg-card-active transition-colors"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-text-primary block mb-2">Folder Organization</label>
            <Switch
              label="Organize into subfolders by date"
              checked={organizeByDate}
              onChange={setOrganizeByDate}
            />
            {organizeByDate && (
              <div className="mt-3">
                <label className="text-xs text-text-secondary block mb-1">Date Format</label>
                <input
                  type="text"
                  value={dateFolderFormat}
                  onChange={(e) => setDateFolderFormat(e.target.value)}
                  placeholder="e.g., YYYY/MM-DD"
                  className="w-full bg-bg-primary border border-surface rounded-md p-2 text-xs text-text-primary focus:ring-accent focus:border-accent"
                />
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-text-primary block mb-2">Source Files</label>
            <Switch
              label="Delete originals after successful import"
              checked={deleteAfterImport}
              onChange={setDeleteAfterImport}
            />
            {deleteAfterImport && (
              <p className="text-xs text-text-secondary mt-1">Files will be moved to the system trash.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-text-secondary hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-accent shadow-shiny text-button-text font-semibold hover:bg-accent-hover transition-colors"
          >
            Start Import
          </button>
        </div>
      </div>
    </div>
  );
}