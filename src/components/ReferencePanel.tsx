import React, { useEffect } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import type { SourceReference } from '../lib/gemini';

interface ReferencePanelProps {
  reference: SourceReference;
  onClose: () => void;
  onViewFullDocument?: (sourceId: string) => void;
}

export default function ReferencePanel({ 
  reference, 
  onClose,
  onViewFullDocument 
}: ReferencePanelProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop - Click to close */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel derecho */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                Referencia [{reference.id}]
              </h3>
              {reference.sourceName && (
                <p className="text-xs text-slate-500 truncate" title={reference.sourceName}>
                  {reference.sourceName}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Ubicación (si está disponible) */}
          {reference.location && (
            <div className="flex items-center gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
              {reference.location.page && (
                <span className="flex items-center gap-1">
                  📄 Página {reference.location.page}
                </span>
              )}
              {reference.location.section && (
                <span className="flex items-center gap-1">
                  📍 {reference.location.section}
                </span>
              )}
            </div>
          )}

          {/* Extracto con contexto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Extracto del documento:
            </h4>
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              {/* Contexto anterior (si existe) */}
              {reference.context?.before && (
                <p className="text-slate-400 italic">
                  ...{reference.context.before}
                </p>
              )}
              
              {/* Snippet exacto (destacado) */}
              <div className="bg-yellow-100 border-l-4 border-yellow-500 -mx-2 px-3 py-2 rounded">
                <p className="text-slate-900 font-medium">
                  {reference.snippet}
                </p>
              </div>
              
              {/* Contexto posterior (si existe) */}
              {reference.context?.after && (
                <p className="text-slate-400 italic">
                  {reference.context.after}...
                </p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">💡 Nota:</span> Este extracto fue utilizado por el AI para generar la respuesta. 
              El texto destacado es la cita exacta del documento fuente.
            </p>
          </div>

          {/* Acción: Ver documento completo */}
          {reference.sourceId && onViewFullDocument && (
            <button
              onClick={() => onViewFullDocument(reference.sourceId)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver documento completo
            </button>
          )}
        </div>

        {/* Footer con instrucciones */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-3">
          <p className="text-xs text-slate-500 text-center">
            Presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">ESC</kbd> o 
            haz click afuera para cerrar
          </p>
        </div>
      </div>
    </>
  );
}

