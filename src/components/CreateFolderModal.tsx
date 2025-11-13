import React, { useState, useEffect } from 'react';
import { X, Folder, FolderPlus } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
  parentFolderName?: string;
  folderLevel: number;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  parentFolderName,
  folderLevel,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const levelLabel = folderLevel === 0 ? 'carpeta' : folderLevel === 1 ? 'subcarpeta' : 'sub-subcarpeta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {folderLevel === 0 ? (
              <Folder className="w-6 h-6 text-green-600" />
            ) : (
              <FolderPlus className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Nueva {levelLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Parent folder indicator */}
          {parentFolderName && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Se creará dentro de:
              </p>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mt-1">
                <Folder className="w-4 h-4" />
                {parentFolderName}
              </p>
            </div>
          )}

          {/* Folder name input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre de la {levelLabel}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ej: ${folderLevel === 0 ? 'Marketing' : folderLevel === 1 ? 'Campañas Digitales' : 'Q1 2025'}`}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
              autoFocus
            />
          </div>

          {/* Level indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Nivel {folderLevel + 1} de 3</span>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${folderLevel >= 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
              <div className={`w-2 h-2 rounded-full ${folderLevel >= 1 ? 'bg-green-500' : 'bg-slate-300'}`} />
              <div className={`w-2 h-2 rounded-full ${folderLevel >= 2 ? 'bg-green-500' : 'bg-slate-300'}`} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {folderLevel === 0 ? <Folder className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
              Crear {levelLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

