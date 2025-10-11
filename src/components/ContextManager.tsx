import React, { useState } from 'react';
import { Plus, Trash2, Power, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { ContextSource } from '../types/context';

interface ContextManagerProps {
  sources: ContextSource[];
  onAddSource: () => void;
  onToggleSource: (sourceId: string) => void;
  onRemoveSource: (sourceId: string) => void;
}

export default function ContextManager({
  sources,
  onAddSource,
  onToggleSource,
  onRemoveSource,
}: ContextManagerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const getStatusIcon = (status: ContextSource['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Power className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSourceTypeLabel = (type: ContextSource['type']): string => {
    const labels: Record<ContextSource['type'], string> = {
      'pdf-text': 'PDF Texto',
      'pdf-images': 'PDF Imágenes',
      'pdf-tables': 'PDF Tablas',
      'csv': 'CSV',
      'excel': 'Excel',
      'word': 'Word',
      'folder': 'Carpeta',
      'web-url': 'URL Web',
      'api': 'API',
    };
    return labels[type];
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Fuentes de Contexto</h3>
          <button
            onClick={onAddSource}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            <p>No hay fuentes de contexto</p>
            <p className="text-xs mt-1">Agrega archivos, URLs o APIs</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                  source.enabled
                    ? 'bg-white border-blue-200 shadow-sm'
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <button
                  onClick={() => onToggleSource(source.id)}
                  className="flex-shrink-0"
                >
                  {getStatusIcon(source.status)}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {source.name}
                    </p>
                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                      {getSourceTypeLabel(source.type)}
                    </span>
                  </div>
                  {source.metadata && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {source.metadata.fileSize && `${(source.metadata.fileSize / 1024 / 1024).toFixed(1)} MB`}
                      {source.metadata.pageCount && ` • ${source.metadata.pageCount} páginas`}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{sources.filter(s => s.enabled).length} activas</span>
              <span>{sources.length} fuentes totales</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

