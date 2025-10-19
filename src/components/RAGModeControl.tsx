/**
 * RAG Mode Control Component
 * 
 * Simple toggle for RAG vs Full-Text mode per agent
 * Shows real-time token and cost savings
 */

import React from 'react';
import { Search, FileText, TrendingDown, Zap } from 'lucide-react';

interface RAGModeControlProps {
  agentId: string | null;
  sources: Array<{
    id: string;
    name: string;
    extractedData?: string;
    ragEnabled?: boolean;
    ragMetadata?: {
      totalChunks: number;
      chunkSize?: number;
    };
  }>;
  currentMode: 'full-text' | 'rag';
  onModeChange: (mode: 'full-text' | 'rag') => void;
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
}

export default function RAGModeControl({
  agentId,
  sources,
  currentMode,
  onModeChange,
  model = 'gemini-2.5-flash'
}: RAGModeControlProps) {
  // Calculate token estimates
  const activeSources = sources.filter(s => s.extractedData);
  
  // Full-text tokens (all sources, complete)
  const fullTextTokens = activeSources.reduce((sum, s) => 
    sum + Math.floor((s.extractedData?.length || 0) / 4), 0
  );
  
  // RAG tokens (only sources with RAG enabled, estimated 5 chunks @ ~500 tokens each)
  const ragEnabledSources = activeSources.filter(s => s.ragEnabled);
  const ragTokens = ragEnabledSources.length > 0
    ? ragEnabledSources.length * 5 * 500  // 5 chunks * 500 tokens per chunk per source
    : fullTextTokens; // If no RAG sources, same as full-text
  
  // Savings calculation
  const tokensSaved = fullTextTokens - ragTokens;
  const savingsPercent = fullTextTokens > 0 ? (tokensSaved / fullTextTokens) * 100 : 0;
  
  // Cost calculation (Flash: $0.075/1M input, Pro: $1.25/1M input)
  const costPerMillion = model === 'gemini-2.5-pro' ? 1.25 : 0.075;
  const costFullText = (fullTextTokens / 1_000_000) * costPerMillion;
  const costRAG = (ragTokens / 1_000_000) * costPerMillion;
  const costSaved = costFullText - costRAG;
  
  // Speed estimate
  const speedFullText = 4.2; // seconds
  const speedRAG = 1.8; // seconds
  
  const hasRAGSources = ragEnabledSources.length > 0;

  if (activeSources.length === 0) {
    return null; // No sources, no need to show
  }

  return (
    <div className="px-3 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">Modo de Búsqueda</span>
        </div>
        {hasRAGSources && (
          <span className="text-[9px] text-green-600 font-semibold px-2 py-0.5 bg-green-100 rounded-full">
            {ragEnabledSources.length}/{activeSources.length} con RAG
          </span>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => onModeChange('full-text')}
          className={`p-2 rounded-lg border-2 transition-all ${
            currentMode === 'full-text'
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className={`w-4 h-4 ${
              currentMode === 'full-text' ? 'text-blue-600' : 'text-slate-400'
            }`} />
            <span className={`text-xs font-semibold ${
              currentMode === 'full-text' ? 'text-blue-700' : 'text-slate-600'
            }`}>
              Documento Completo
            </span>
          </div>
          <p className="text-[10px] text-slate-600">
            {fullTextTokens.toLocaleString()} tokens
          </p>
        </button>

        <button
          onClick={() => hasRAGSources ? onModeChange('rag') : null}
          disabled={!hasRAGSources}
          className={`p-2 rounded-lg border-2 transition-all ${
            currentMode === 'rag'
              ? 'border-green-500 bg-green-50 shadow-sm'
              : hasRAGSources
                ? 'border-slate-200 bg-white hover:border-green-300'
                : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Search className={`w-4 h-4 ${
              currentMode === 'rag' ? 'text-green-600' : hasRAGSources ? 'text-slate-400' : 'text-slate-300'
            }`} />
            <span className={`text-xs font-semibold ${
              currentMode === 'rag' ? 'text-green-700' : hasRAGSources ? 'text-slate-600' : 'text-slate-400'
            }`}>
              RAG Optimizado
            </span>
          </div>
          <p className={`text-[10px] ${hasRAGSources ? 'text-slate-600' : 'text-slate-400'}`}>
            ~{ragTokens.toLocaleString()} tokens
          </p>
        </button>
      </div>

      {/* Savings Display - Only show if RAG mode and has RAG sources */}
      {currentMode === 'rag' && hasRAGSources && savingsPercent > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[10px] font-semibold text-green-700">Ahorro Estimado por Query:</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div>
              <p className="text-slate-600">Tokens</p>
              <p className="font-bold text-green-600">-{tokensSaved.toLocaleString()}</p>
              <p className="text-slate-500">({savingsPercent.toFixed(1)}%)</p>
            </div>
            <div>
              <p className="text-slate-600">Costo</p>
              <p className="font-bold text-green-600">-${costSaved.toFixed(3)}</p>
              <p className="text-slate-500">({savingsPercent.toFixed(1)}%)</p>
            </div>
            <div>
              <p className="text-slate-600">Velocidad</p>
              <p className="font-bold text-green-600">-{(speedFullText - speedRAG).toFixed(1)}s</p>
              <p className="text-slate-500">{((speedFullText - speedRAG) / speedFullText * 100).toFixed(0)}% faster</p>
            </div>
          </div>
        </div>
      )}

      {/* No RAG Warning */}
      {currentMode === 'rag' && !hasRAGSources && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-[10px] text-yellow-700">
            ⚠️ Ningún documento tiene RAG habilitado aún. 
            Habilita RAG en Context Management para optimizar.
          </p>
        </div>
      )}
      
      {/* Speed indicator */}
      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>
            Velocidad estimada: 
            {currentMode === 'rag' && hasRAGSources ? ` ~${speedRAG}s` : ` ~${speedFullText}s`}
          </span>
        </div>
        <span>
          {activeSources.length} documento{activeSources.length !== 1 ? 's' : ''} activo{activeSources.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

