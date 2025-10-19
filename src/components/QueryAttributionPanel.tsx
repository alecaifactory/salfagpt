/**
 * Query Attribution Panel
 * 
 * Shows which chunks/sources contributed to an AI response
 * Provides complete transparency and traceability
 */

import React, { useState } from 'react';
import { FileText, Search, TrendingUp, DollarSign, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface RAGStats {
  sourcesUsed: number;
  chunksRetrieved: number;
  totalTokens: number;
  avgSimilarity: number;
  sources: Array<{
    id: string;
    name: string;
    chunkCount: number;
    tokens: number;
  }>;
}

interface ChunkDetail {
  chunkIndex: number;
  similarity: number;
  text: string;
  tokens: number;
  sourceId: string;
  sourceName: string;
}

interface QueryAttributionPanelProps {
  ragStats: RAGStats | null;
  chunks?: ChunkDetail[];
  tokensSaved?: number;
  costSaved?: number;
  mode: 'full-text' | 'rag';
  onChunkClick?: (chunk: ChunkDetail) => void;
  onSourceClick?: (sourceId: string) => void;
}

export default function QueryAttributionPanel({
  ragStats,
  chunks = [],
  tokensSaved = 0,
  costSaved = 0,
  mode,
  onChunkClick,
  onSourceClick
}: QueryAttributionPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (mode === 'full-text') {
    return (
      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <FileText className="w-4 h-4" />
          <span>Modo: Documento completo (sin RAG)</span>
        </div>
      </div>
    );
  }

  if (!ragStats) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              Búsqueda Vectorial Activa
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar' : 'Ver detalles'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-slate-600 dark:text-slate-400">Chunks</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {ragStats.chunksRetrieved}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-slate-600 dark:text-slate-400">Relevancia</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {(ragStats.avgSimilarity * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-slate-600 dark:text-slate-400">Tokens</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {ragStats.totalTokens.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-slate-600 dark:text-slate-400">Ahorro</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {tokensSaved > 0 ? `${((tokensSaved / (tokensSaved + ragStats.totalTokens)) * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed View */}
      {expanded && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Fragmentos Utilizados
          </h4>

          {/* Group by source */}
          {ragStats.sources.map((source, idx) => (
            <div key={source.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSourceClick?.(source.id)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  {source.name}
                  <ExternalLink className="w-3 h-3" />
                </button>
                <span className="text-xs text-slate-500">
                  {source.chunkCount} chunks · {source.tokens} tokens
                </span>
              </div>

              {/* Show chunks for this source */}
              <div className="space-y-2 pl-6">
                {chunks
                  .filter(c => c.sourceId === source.id)
                  .map((chunk, cidx) => (
                    <button
                      key={cidx}
                      onClick={() => onChunkClick?.(chunk)}
                      className="w-full text-left p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                          Chunk {chunk.chunkIndex}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {chunk.tokens} tokens
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            chunk.similarity >= 0.8 ? 'bg-green-100 text-green-700' :
                            chunk.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {(chunk.similarity * 100).toFixed(1)}% relevante
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {chunk.text}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ))}

          {/* Cost Savings */}
          {costSaved > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Tokens ahorrados vs documento completo:
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {tokensSaved.toLocaleString()} tokens (${costSaved.toFixed(4)})
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

