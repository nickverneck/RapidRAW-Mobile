import { useState, useEffect, useCallback, useRef } from 'react';

const FILENAME_VARIABLES = [
  '{original_filename}',
  '{sequence}',
  '{YYYY}',
  '{MM}',
  '{DD}',
  '{hh}',
  '{mm}',
];

export default function RenameFileModal({ isOpen, onClose, onSave, filesToRename }) {
  const [nameTemplate, setNameTemplate] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [show, setShow] = useState(false);
  const nameInputRef = useRef(null);

  const fileCount = filesToRename.length;
  const isSingleFile = fileCount === 1;

  useEffect(() => {
    if (isOpen) {
      if (isSingleFile && filesToRename[0]) {
        const fileName = filesToRename[0].split(/[\\/]/).pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        setNameTemplate(nameWithoutExt);
      } else {
        setNameTemplate('{original_filename}');
      }
      setIsMounted(true);
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setNameTemplate('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, filesToRename, isSingleFile]);

  const handleSave = useCallback(() => {
    if (nameTemplate.trim()) {
      let finalTemplate = nameTemplate.trim();
      if (!isSingleFile && !finalTemplate.includes('{sequence}') && !finalTemplate.includes('{original_filename}')) {
        finalTemplate = `${finalTemplate}_{sequence}`;
      }
      onSave(finalTemplate);
    }
    onClose();
  }, [nameTemplate, onSave, onClose, isSingleFile]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSave, onClose]);

  const handleVariableClick = (variable) => {
    if (!nameInputRef.current) return;
    const input = nameInputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = input.value;
    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
    setNameTemplate(newValue);
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
        <h3 className="text-lg font-semibold text-text-primary mb-6">
          {isSingleFile ? 'Rename File' : `Rename ${fileCount} Files`}
        </h3>
        
        <div className="space-y-6 text-sm">
          <div>
            <label className="font-semibold text-text-primary block mb-2">
              {isSingleFile ? 'New Name' : 'File Naming Template'}
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={nameTemplate}
              onChange={(e) => setNameTemplate(e.target.value)}
              autoFocus
              className="w-full bg-bg-primary border border-surface rounded-md p-2 text-sm text-text-primary focus:ring-accent focus:border-accent"
            />
            {!isSingleFile && (
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
            disabled={!nameTemplate.trim()}
            className="px-4 py-2 rounded-md bg-accent shadow-shiny text-button-text font-semibold hover:bg-accent-hover disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}