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
      
      {/* Panel derecho - SIMPLIFIED */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                Referencia [{reference.id}]
              </h3>
              <p className="text-xs text-slate-500 truncate" title={reference.sourceName}>
                {reference.sourceName}
              </p>
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

        {/* Content - SIMPLIFIED: Solo 3 secciones esenciales */}
        <div className="p-6 space-y-5">
          
          {/* 1. SIMILITUD - Qué tan relevante es */}
          {reference.similarity !== undefined && (
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-blue-300">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide text-center mb-2">
                Similitud Semántica
              </p>
              <div className={`text-5xl font-black text-center mb-3 ${
                reference.similarity >= 0.8 ? 'text-green-600' :
                reference.similarity >= 0.6 ? 'text-yellow-600' :
                'text-orange-600'
              }`}>
                {(reference.similarity * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300 mb-3">
                <div 
                  className={`h-full transition-all ${
                    reference.similarity >= 0.8 ? 'bg-green-500' :
                    reference.similarity >= 0.6 ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${reference.similarity * 100}%` }}
                />
              </div>
              <p className={`text-xs text-center font-semibold ${
                reference.similarity >= 0.8 ? 'text-green-700' :
                reference.similarity >= 0.6 ? 'text-yellow-700' :
                'text-orange-700'
              }`}>
                {reference.similarity >= 0.8 ? '✅ Alta relevancia para tu pregunta' :
                 reference.similarity >= 0.6 ? '⚠️ Relevancia moderada' :
                 '⚠️ Relevancia baja - verifica con documento completo'}
              </p>
            </div>
          )}
          
          {/* 2. TEXTO UTILIZADO - Lo que el AI leyó */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-800">
              📄 Texto utilizado por el AI
            </h4>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4 max-h-[400px] overflow-y-auto">
              <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                {reference.fullText || reference.snippet}
              </p>
            </div>
            
            <p className="text-xs text-slate-500 italic">
              Este es el texto exacto que el AI utilizó para generar la respuesta.
            </p>
          </div>

          {/* 3. REFERENCIA AL DOCUMENTO - Para construir confianza */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800">
              📚 Referencia al documento
            </h4>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
              <div>
                <p className="text-xs text-slate-600 mb-1">Documento:</p>
                <p className="text-sm font-medium text-slate-800">{reference.sourceName}</p>
              </div>
              
              {reference.chunkIndex !== undefined && reference.chunkIndex >= 0 && (
                <div>
                  <p className="text-xs text-slate-600">
                    Fragmento #{reference.chunkIndex} • {reference.metadata?.tokenCount?.toLocaleString() || 0} tokens
                  </p>
                </div>
              )}
            </div>

            {/* Botón para ver documento completo */}
            {reference.sourceId && onViewFullDocument && (
              <button
                onClick={() => onViewFullDocument(reference.sourceId)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver documento completo
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
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
