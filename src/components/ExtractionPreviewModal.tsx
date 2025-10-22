/**
 * Extraction Preview Modal
 * 
 * Shows extracted content in markdown format for verification
 */

import React, { useState } from 'react';
import { X, CheckCircle, RefreshCw, AlertTriangle, FileText, Eye, Code } from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';
import MessageRenderer from './MessageRenderer';

interface ExtractionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedText: string;
  metadata: {
    originalFileName: string;
    characters: number;
    extractionTime: number;
    model: string;
    pageCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
    hasASCIIVisuals?: boolean;
  };
  onApprove?: () => void;
  onReExtract?: () => void;
  onEnableRAG?: () => void;
}

export default function ExtractionPreviewModal({
  isOpen,
  onClose,
  extractedText,
  metadata,
  onApprove,
  onReExtract,
  onEnableRAG
}: ExtractionPreviewModalProps) {
  const [viewMode, setViewMode] = useState<'markdown' | 'raw'>('markdown');
  const [qualityScore, setQualityScore] = useState<number | null>(null);

  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);

  // Calculate extraction quality score
  React.useEffect(() => {
    if (isOpen && extractedText) {
      const score = calculateExtractionQuality(extractedText, metadata);
      setQualityScore(score);
    }
  }, [isOpen, extractedText, metadata]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Vista Previa de Extracción
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {metadata.originalFileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Quality Score */}
        {qualityScore !== null && (
          <div className={`p-4 border-b ${
            qualityScore >= 90 ? 'bg-green-50 border-green-200' :
            qualityScore >= 70 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {qualityScore >= 90 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : qualityScore >= 70 ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className={`font-semibold ${
                    qualityScore >= 90 ? 'text-green-700' :
                    qualityScore >= 70 ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    Calidad de Extracción: {qualityScore}%
                  </p>
                  <p className="text-xs text-slate-600">
                    {qualityScore >= 90 && 'Excelente extracción - Listo para usar'}
                    {qualityScore >= 70 && qualityScore < 90 && 'Buena extracción - Puede mejorarse'}
                    {qualityScore < 70 && 'Extracción subóptima - Re-extraer con Pro recomendado'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-center">
                  <p className="text-slate-600">Caracteres</p>
                  <p className="font-bold text-slate-800">{metadata.characters.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-600">Tiempo</p>
                  <p className="font-bold text-slate-800">{(metadata.extractionTime / 1000).toFixed(1)}s</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-600">Modelo</p>
                  <p className={`font-bold ${
                    metadata.model === 'gemini-2.5-pro' ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    {metadata.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('markdown')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'markdown'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Markdown
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'raw'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Texto Crudo
          </button>
          
          <div className="flex-1" />
          
          {/* Metadata indicators */}
          <div className="flex items-center gap-2 text-xs">
            {metadata.hasASCIIVisuals && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                ✓ ASCII Visuals
              </span>
            )}
            {metadata.hasTables && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                ✓ Tablas
              </span>
            )}
            {metadata.hasImages && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                ✓ Imágenes
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'markdown' ? (
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <MessageRenderer
                content={extractedText}
                contextSources={[]}
                onSourceClick={() => {}}
              />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              {extractedText}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {metadata.pageCount && (
              <span>{metadata.pageCount} páginas · </span>
            )}
            {metadata.characters.toLocaleString()} caracteres · 
            Extraído con {metadata.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
          </div>
          
          <div className="flex gap-3">
            {onReExtract && qualityScore && qualityScore < 90 && (
              <button
                onClick={() => {
                  onReExtract();
                  onClose();
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Re-extraer con Pro
              </button>
            )}
            
            {onEnableRAG && (
              <button
                onClick={() => {
                  onEnableRAG();
                  onClose();
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                🔍 Habilitar RAG
              </button>
            )}
            
            {onApprove && (
              <button
                onClick={() => {
                  onApprove();
                  onClose();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar y Usar
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate extraction quality score
 */
function calculateExtractionQuality(
  extractedText: string,
  metadata: any
): number {
  let score = 100;
  
  // Check for minimum length
  if (extractedText.length < 100) {
    score -= 50; // Very poor extraction
  } else if (extractedText.length < 1000) {
    score -= 20; // Short extraction
  }
  
  // Check for markdown structure
  const hasHeadings = /^#{1,6}\s/m.test(extractedText);
  if (!hasHeadings) score -= 10;
  
  // Check for tables
  const hasTables = /\|.*\|.*\|/m.test(extractedText);
  if (metadata.hasTables && !hasTables) score -= 15;
  
  // Check for ASCII visuals
  const hasASCII = /```[\s\S]*?[┤┴┬┼╭╮╰╯─│├┐└┘][\s\S]*?```/.test(extractedText);
  if (metadata.hasImages && !hasASCII) score -= 10;
  
  // Check for image descriptions
  const hasImageDescriptions = /\*\*Descripci[oó]n:\*\*/.test(extractedText);
  if (metadata.hasImages && !hasImageDescriptions) score -= 10;
  
  // Bonus for comprehensive extraction
  if (hasHeadings && hasTables && hasASCII && hasImageDescriptions) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

