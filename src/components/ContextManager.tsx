import React, { useState } from 'react';
import { Plus, Trash2, ShieldCheck, Settings } from 'lucide-react';
import type { ContextSource } from '../types/context';
import type { SourceValidation } from '../types/sharing';

interface ContextManagerProps {
  sources: ContextSource[];
  validations: Map<string, SourceValidation>;
  onAddSource: () => void;
  onToggleSource: (sourceId: string) => void;
  onRemoveSource: (sourceId: string) => void;
  onSourceClick: (sourceId: string) => void;
  onSourceSettings: (sourceId: string) => void;
}

export default function ContextManager({
  sources,
  validations,
  onAddSource,
  onToggleSource,
  onRemoveSource,
  onSourceClick,
  onSourceSettings,
}: ContextManagerProps) {
  const [collapsed, setCollapsed] = useState(false);

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
            {sources.map((source) => {
              const validation = validations.get(source.id);
              const isValidated = validation?.validated || false;
              
              return (
                <div
                  key={source.id}
                  onClick={() => onSourceClick(source.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                    source.enabled
                      ? isValidated
                        ? 'bg-green-50 border-green-300 shadow-sm hover:shadow-md'
                        : 'bg-white border-blue-200 shadow-sm hover:shadow-md'
                      : 'bg-slate-100 border-slate-200 opacity-60 hover:opacity-80'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSource(source.id);
                    }}
                    className="flex-shrink-0 relative inline-flex items-center"
                    title={source.enabled ? 'Desactivar fuente' : 'Activar fuente'}
                  >
                    {/* Toggle Switch */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                        source.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          source.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {source.name}
                      </p>
                      {isValidated && (
                        <span title="Documento Validado">
                          <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                        </span>
                      )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onSourceSettings(source.id);
                    }}
                    className="flex-shrink-0 p-1 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Configurar extracción"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSource(source.id);
                    }}
                    className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar fuente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
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

