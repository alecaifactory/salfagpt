import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ContextSource, ContentChunk } from '../types/context';

interface ContextDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: ContextSource | null;
  highlightedChunkId?: string;
}

export default function ContextDetailModal({ isOpen, onClose, source, highlightedChunkId }: ContextDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && highlightedChunkId && contentRef.current) {
      setTimeout(() => {
        const highlightedElement = contentRef.current?.querySelector(`[data-chunk-id="${highlightedChunkId}"]`);
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen, highlightedChunkId]);

  if (!isOpen || !source) return null;

  const renderContent = () => {
    if (source.chunks && source.chunks.length > 0) {
      return source.chunks.map((chunk: ContentChunk) => (
        <div
          key={chunk.id}
          data-chunk-id={chunk.id}
          className={`mb-3 p-3 rounded-lg transition-all duration-300 ${
            highlightedChunkId === chunk.id 
              ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {chunk.content}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
            Líneas {chunk.startLine + 1} - {chunk.endLine + 1} • ~{chunk.tokenEstimate} tokens
          </div>
        </div>
      ));
    }
    
    const content = source.fullText || source.extractedData;
    if (content) {
      return (
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
            {content}
          </pre>
        </div>
      );
    }
    
    return <p className="text-slate-500 italic">No hay contenido disponible</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 truncate">
              {source.name}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
              <span>Tipo: {source.type}</span>
              {source.chunks && source.chunks.length > 0 && (
                <>
                  <span>•</span>
                  <span>{source.chunks.length} secciones</span>
                </>
              )}
              {source.metadata?.charactersExtracted && (
                <>
                  <span>•</span>
                  <span>{source.metadata.charactersExtracted.toLocaleString()} caracteres</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-6 bg-slate-50" 
          ref={contentRef}
        >
          {renderContent()}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {highlightedChunkId && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                Sección resaltada
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
