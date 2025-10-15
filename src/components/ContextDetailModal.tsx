import React, { useRef } from 'react';
import { X, Tag, Star, CheckCircle, FileText, Calendar, Sparkles, AlertTriangle } from 'lucide-react';
import type { ContextSource } from '../types/context';
import { useModalClose } from '../hooks/useModalClose';

interface ContextDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: ContextSource | null;
}

export default function ContextDetailModal({ isOpen, onClose, source }: ContextDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // 🔑 Hook para cerrar con ESC
  useModalClose(isOpen, onClose);

  if (!isOpen || !source) return null;

  const renderContent = () => {
    const content = source.extractedData;
    
    if (content) {
      return (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
            {content}
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 text-lg font-medium">No hay contenido disponible</p>
        <p className="text-slate-400 text-sm mt-2">El documento puede estar procesándose o hubo un error en la extracción</p>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-800 truncate">
                {source.name}
              </h2>
              {source.certified && (
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Certificado
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-600 flex-wrap">
              <span>Tipo: {source.type}</span>
              {source.extractedData && (
                <>
                  <span>•</span>
                  <span>{source.extractedData.length.toLocaleString()} caracteres</span>
                </>
              )}
              {source.metadata?.model && (
                <>
                  <span>•</span>
                  <span 
                    className={`font-bold px-2 py-1 rounded-full flex items-center gap-1 text-xs ${
                      source.metadata.model === 'gemini-2.5-pro'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {source.metadata.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
                  </span>
                </>
              )}
            </div>
            
            {/* Flash Warning - Recommend Pro for important documents */}
            {source.metadata?.model === 'gemini-2.5-flash' && !source.certified && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold">Extraído con Flash (modelo económico)</p>
                  <p className="mt-0.5">Para documentos críticos, considera re-extraer con Pro para mayor precisión en tablas y términos técnicos.</p>
                </div>
              </div>
            )}
            
            {/* Labels */}
            {source.labels && source.labels.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                {source.labels.map((label, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Quality Rating */}
            {source.qualityRating && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= source.qualityRating!
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600">Calidad de extracción</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        
        {/* Certification Info */}
        {source.certified && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">
                  Certificado por {source.certifiedBy}
                </p>
                {source.certifiedAt && (
                  <p className="text-xs text-green-700 mt-0.5">
                    {new Date(source.certifiedAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                {source.certificationNotes && (
                  <p className="text-sm text-green-800 mt-2 italic">
                    "{source.certificationNotes}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        {source.metadata && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {source.metadata.originalFileName && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">Archivo: <span className="font-medium text-slate-800">{source.metadata.originalFileName}</span></span>
                </div>
              )}
              {source.metadata.originalFileSize && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Tamaño: <span className="font-medium text-slate-800">{(source.metadata.originalFileSize / 1024 / 1024).toFixed(2)} MB</span></span>
                </div>
              )}
              {source.metadata.extractionDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">Extraído: <span className="font-medium text-slate-800">{new Date(source.metadata.extractionDate).toLocaleDateString('es-ES')}</span></span>
                </div>
              )}
              {source.metadata.pageCount && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Páginas: <span className="font-medium text-slate-800">{source.metadata.pageCount}</span></span>
                </div>
              )}
            </div>
            
            {/* Token Usage & Cost */}
            {(source.metadata as any).totalTokens && (
              <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700">📊 Uso de Tokens y Costo</h4>
                  {source.metadata?.model && (
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        source.metadata.model === 'gemini-2.5-pro'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      Modelo: {source.metadata.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-600">Tokens Input</p>
                    <p className="text-base font-bold text-blue-600">{((source.metadata as any).inputTokens || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Tokens Output</p>
                    <p className="text-base font-bold text-green-600">{((source.metadata as any).outputTokens || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Total Tokens</p>
                    <p className="text-base font-bold text-slate-800">{((source.metadata as any).totalTokens || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Costo Total</p>
                    <p className={`text-base font-bold ${
                      source.metadata?.model === 'gemini-2.5-pro' ? 'text-purple-600' : 'text-green-600'
                    }`}>
                      {(source.metadata as any).costFormatted || '$0.000'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                  <p>Input: {(source.metadata as any).inputCost ? `$${((source.metadata as any).inputCost).toFixed(4)}` : '$0.000'} • Output: {(source.metadata as any).outputCost ? `$${((source.metadata as any).outputCost).toFixed(4)}` : '$0.000'}</p>
                </div>
                
                {/* Flash Cost Comparison */}
                {source.metadata?.model === 'gemini-2.5-flash' && (source.metadata as any).totalTokens && (
                  <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-[10px]">
                    <p className="font-semibold text-purple-800 mb-1">💡 Comparación con Pro:</p>
                    <p className="text-purple-700">
                      Con Pro: ~$
                      {(
                        ((source.metadata as any).inputTokens / 1_000_000 * 1.25) +
                        ((source.metadata as any).outputTokens / 1_000_000 * 10.00)
                      ).toFixed(4)}
                      {' '}({(
                        (((source.metadata as any).inputTokens / 1_000_000 * 1.25) +
                        ((source.metadata as any).outputTokens / 1_000_000 * 10.00)) /
                        ((source.metadata as any).totalCost || 0.001)
                      ).toFixed(1)}x más caro, mejor calidad)
                    </p>
                  </div>
                )}
                
                {/* Pro Quality Notice */}
                {source.metadata?.model === 'gemini-2.5-pro' && (
                  <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-[10px]">
                    <p className="text-purple-800">
                      <span className="font-semibold">✨ Calidad Premium:</span> Extraído con el modelo más avanzado para máxima precisión.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Quality Notes */}
            {source.qualityNotes && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-1">📝 Notas de Calidad</p>
                <p className="text-sm text-blue-900">{source.qualityNotes}</p>
              </div>
            )}
          </div>
        )}
        
        <div 
          className="flex-1 overflow-y-auto p-6 bg-white" 
          ref={contentRef}
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contenido Extraído
          </h3>
          {renderContent()}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {source.extractedData && (
              <span className="text-slate-600">
                {source.extractedData.length.toLocaleString()} caracteres extraídos
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
