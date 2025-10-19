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
          {/* Metadata del chunk y similitud */}
          <div className="space-y-2">
            {reference.similarity !== undefined && (
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                <span className="text-sm font-medium text-slate-700">
                  Similitud
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white rounded-full h-2 overflow-hidden border border-blue-200">
                    <div 
                      className={`h-full transition-all ${
                        reference.similarity >= 0.8 ? 'bg-green-500' :
                        reference.similarity >= 0.6 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${reference.similarity * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${
                    reference.similarity >= 0.8 ? 'text-green-600' :
                    reference.similarity >= 0.6 ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>
                    {(reference.similarity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            
            {reference.chunkIndex !== undefined && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="bg-slate-100 px-2 py-1 rounded font-mono">
                  Chunk #{reference.chunkIndex + 1}
                </span>
                {reference.metadata?.tokenCount && (
                  <span className="text-slate-500">
                    • {reference.metadata.tokenCount} tokens
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Ubicación (si está disponible) */}
          {(reference.location || reference.metadata) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
              {reference.location?.page && (
                <span className="flex items-center gap-1">
                  📄 Página {reference.location.page}
                </span>
              )}
              {reference.location?.section && (
                <span className="flex items-center gap-1">
                  📍 {reference.location.section}
                </span>
              )}
              {reference.metadata?.startPage && (
                <span className="flex items-center gap-1">
                  📄 Páginas {reference.metadata.startPage}
                  {reference.metadata.endPage && reference.metadata.endPage !== reference.metadata.startPage 
                    ? `-${reference.metadata.endPage}` 
                    : ''}
                </span>
              )}
            </div>
          )}

          {/* Extracto completo del chunk */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Texto del chunk utilizado:
            </h4>
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm max-h-96 overflow-y-auto">
              {/* Contexto anterior (si existe) */}
              {reference.context?.before && (
                <p className="text-slate-400 italic">
                  ...{reference.context.before}
                </p>
              )}
              
              {/* Full chunk text (destacado) */}
              <div className="bg-yellow-100 border-l-4 border-yellow-500 -mx-2 px-3 py-2 rounded">
                <p className="text-slate-900 leading-relaxed">
                  {reference.fullText || reference.snippet}
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

