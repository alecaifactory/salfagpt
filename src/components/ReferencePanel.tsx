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
        <div className="p-6 space-y-5">
          {/* Similarity Score - PROMINENT */}
          {reference.similarity !== undefined && (
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-blue-300 shadow-md">
              <div className="text-center mb-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Similitud Semántica
                </p>
                <div className={`text-5xl font-black mb-2 ${
                  reference.similarity >= 0.8 ? 'text-green-600' :
                  reference.similarity >= 0.6 ? 'text-yellow-600' :
                  'text-orange-600'
                }`}>
                  {(reference.similarity * 100).toFixed(1)}%
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                  <div 
                    className={`h-full transition-all ${
                      reference.similarity >= 0.8 ? 'bg-green-500' :
                      reference.similarity >= 0.6 ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${reference.similarity * 100}%` }}
                  />
                </div>
              </div>
              <div className={`text-xs text-center p-2 rounded-lg ${
                reference.similarity >= 0.8 ? 'bg-green-100 text-green-800' :
                reference.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                <span className="font-bold">
                  {reference.similarity >= 0.8 ? '✅ Alta relevancia' :
                   reference.similarity >= 0.6 ? '⚠️ Relevancia moderada' :
                   '⚠️ Baja relevancia'}
                </span>
                <span className="font-normal"> - Este fragmento fue seleccionado por búsqueda vectorial RAG</span>
              </div>
            </div>
          )}
          
          {/* Chunk Index Info */}
          {reference.chunkIndex !== undefined && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className={`px-2 py-1 rounded font-mono ${
                reference.metadata?.isRAGChunk 
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {reference.chunkIndex >= 0 ? `Fragmento ${reference.chunkIndex}` : 'Documento Completo'}
              </span>
              {reference.metadata?.tokenCount && (
                <span className="text-slate-500">
                  • {reference.metadata.tokenCount.toLocaleString()} tokens
                </span>
              )}
              {reference.metadata?.isRAGChunk && (
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  🔍 RAG Chunk
                </span>
              )}
              {reference.metadata?.isFullDocument && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                  📝 Full-Text Mode
                </span>
              )}
            </div>
          )}

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

          {/* Extracto completo del chunk o documento - ENHANCED */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {reference.chunkIndex !== undefined && reference.chunkIndex >= 0
                  ? '📄 Texto del fragmento utilizado' 
                  : '📝 Contenido del documento'}
              </h4>
              {reference.metadata?.tokenCount && (
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                  {reference.metadata.tokenCount.toLocaleString()} tokens
                </span>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 space-y-3 text-sm max-h-[500px] overflow-y-auto border-2 border-slate-200 shadow-inner">
              {/* Contexto anterior (si existe) */}
              {reference.context?.before && (
                <div className="pb-3 border-b border-slate-300">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    ⬆️ Contexto anterior
                  </p>
                  <p className="text-slate-500 italic leading-relaxed">
                    ...{reference.context.before}
                  </p>
                </div>
              )}
              
              {/* Full chunk text (destacado) - PROMINENT */}
              <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-l-4 border-yellow-600 -mx-2 px-4 py-4 rounded-r-lg shadow-md">
                <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
                  Texto exacto utilizado por el AI
                </p>
                <p className="text-slate-900 leading-relaxed font-medium">
                  {reference.fullText || reference.snippet}
                </p>
              </div>
              
              {/* Contexto posterior (si existe) */}
              {reference.context?.after && (
                <div className="pt-3 border-t border-slate-300">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    ⬇️ Contexto posterior
                  </p>
                  <p className="text-slate-500 italic leading-relaxed">
                    {reference.context.after}...
                  </p>
                </div>
              )}
            </div>
            
            {/* Trust indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <span className="font-bold">🔒 Verificación de confianza:</span> Este fragmento es el texto exacto que el AI utilizó del documento. 
                {reference.metadata?.isRAGChunk && reference.similarity && reference.similarity >= 0.8 && (
                  <span className="font-semibold text-green-700"> La alta similitud semántica ({(reference.similarity * 100).toFixed(1)}%) indica que este fragmento es muy relevante para tu pregunta.</span>
                )}
                {reference.metadata?.isRAGChunk && reference.similarity && reference.similarity < 0.8 && reference.similarity >= 0.6 && (
                  <span className="font-semibold text-yellow-700"> La similitud moderada ({(reference.similarity * 100).toFixed(1)}%) sugiere relevancia parcial - verifica si responde completamente tu pregunta.</span>
                )}
                {reference.metadata?.isRAGChunk && reference.similarity && reference.similarity < 0.6 && (
                  <span className="font-semibold text-orange-700"> La similitud baja ({(reference.similarity * 100).toFixed(1)}%) indica que este fragmento puede no ser completamente relevante - verifica la información cuidadosamente.</span>
                )}
              </p>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* Chunk Info */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">📊 Información del fragmento</p>
              <div className="space-y-1 text-xs text-slate-700">
                {reference.chunkIndex !== undefined && (
                  <p>
                    <span className="font-medium">Posición:</span> Fragmento {reference.chunkIndex >= 0 ? reference.chunkIndex : 'completo'}
                  </p>
                )}
                {reference.metadata?.tokenCount && (
                  <p>
                    <span className="font-medium">Tokens:</span> {reference.metadata.tokenCount.toLocaleString()}
                  </p>
                )}
                {reference.metadata?.startPage !== undefined && (
                  <p>
                    <span className="font-medium">Páginas:</span> {reference.metadata.startPage}
                    {reference.metadata.endPage && reference.metadata.endPage !== reference.metadata.startPage 
                      ? `-${reference.metadata.endPage}` 
                      : ''}
                  </p>
                )}
                {reference.metadata?.startChar !== undefined && (
                  <p>
                    <span className="font-medium">Caracteres:</span> {reference.metadata.startChar}-{reference.metadata.endChar}
                  </p>
                )}
              </div>
            </div>

            {/* RAG Status */}
            <div className={`border rounded-lg p-3 ${
              reference.metadata?.isRAGChunk 
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                {reference.metadata?.isRAGChunk ? '🔍 Modo RAG' : '📝 Modo Full-Text'}
              </p>
              <div className="space-y-1 text-xs">
                <p className={reference.metadata?.isRAGChunk ? 'text-green-800' : 'text-blue-800'}>
                  {reference.metadata?.isRAGChunk
                    ? `Fragmento seleccionado por búsqueda semántica`
                    : 'Documento completo analizado'}
                </p>
                {reference.similarity !== undefined && (
                  <p className="font-semibold">
                    Relevancia: {reference.similarity >= 0.8 ? 'Alta' : reference.similarity >= 0.6 ? 'Media' : 'Baja'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información adicional - Enhanced trust builder */}
          <div className={`border-2 rounded-xl p-4 ${
            reference.metadata?.isRAGChunk 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
          }`}>
            <p className={`text-xs font-semibold mb-2 flex items-center gap-2 ${
              reference.metadata?.isRAGChunk ? 'text-green-800' : 'text-blue-800'
            }`}>
              <span className="text-base">🔒</span>
              <span>Verificación de Confianza</span>
            </p>
            <p className={`text-xs leading-relaxed ${
              reference.metadata?.isRAGChunk ? 'text-green-900' : 'text-blue-900'
            }`}>
              {reference.metadata?.isRAGChunk
                ? (
                  <>
                    Este fragmento fue <span className="font-bold">seleccionado automáticamente</span> por el sistema de búsqueda vectorial RAG usando inteligencia artificial. 
                    {reference.similarity && reference.similarity >= 0.8 && (
                      <> La <span className="font-bold text-green-700">alta similitud semántica de {(reference.similarity * 100).toFixed(1)}%</span> indica que este fragmento es <span className="font-bold">altamente relevante</span> para tu pregunta y el AI basó su respuesta en esta información específica.</>
                    )}
                    {reference.similarity && reference.similarity < 0.8 && reference.similarity >= 0.6 && (
                      <> La <span className="font-bold text-yellow-700">similitud moderada de {(reference.similarity * 100).toFixed(1)}%</span> sugiere <span className="font-bold">relevancia parcial</span> - el fragmento contiene información relacionada pero puede no responder completamente tu pregunta. Verifica cuidadosamente.</>
                    )}
                    {reference.similarity && reference.similarity < 0.6 && (
                      <> La <span className="font-bold text-orange-700">similitud baja de {(reference.similarity * 100).toFixed(1)}%</span> indica que este fragmento puede <span className="font-bold">no ser completamente relevante</span> - el sistema lo seleccionó entre las opciones disponibles pero verifica la información con cuidado.</>
                    )}
                  </>
                )
                : reference.chunkIndex !== undefined && reference.chunkIndex >= 0
                ? `Este fragmento específico fue identificado como relevante por el sistema RAG y utilizado por el AI para generar la respuesta. El texto mostrado arriba es el contenido exacto del fragmento.`
                : `El AI tuvo acceso al <span className="font-bold">documento completo</span> para generar la respuesta (modo Full-Text). Este modo se usa cuando la búsqueda RAG no está disponible o no encuentra fragmentos relevantes suficientes.`}
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

