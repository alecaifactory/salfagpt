import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { ContentChunk } from '../types/context';

interface ContextReferenceCardProps {
  sourceName: string;
  sourceId: string;
  chunk: ContentChunk;
  relevanceScore: number; // 0-100
  onOpenSource: (sourceId: string, chunkId: string) => void;
}

export default function ContextReferenceCard({
  sourceName,
  sourceId,
  chunk,
  relevanceScore,
  onOpenSource,
}: ContextReferenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine color based on relevance score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const scoreColor = getScoreColor(relevanceScore);

  // Truncate content for preview
  const previewLength = 150;
  const preview = chunk.content.length > previewLength 
    ? chunk.content.substring(0, previewLength) + '...' 
    : chunk.content;

  return (
    <div className={`border-2 rounded-lg p-3 transition-all ${scoreColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">{sourceName}</span>
        </div>
        
        {/* Relevance Score Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="px-2 py-1 rounded-full text-xs font-bold">
            {relevanceScore}% relevante
          </div>
          <button
            onClick={() => onOpenSource(sourceId, chunk.id)}
            className="p-1 hover:bg-white rounded transition-colors"
            title="Abrir en contexto"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview or Full Content */}
      <div className="space-y-2">
        <p className="text-xs leading-relaxed whitespace-pre-wrap">
          {isExpanded ? chunk.content : preview}
        </p>

        {chunk.content.length > previewLength && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium hover:underline"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Ver más
              </>
            )}
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2 pt-2 border-t border-current opacity-60">
        <p className="text-[10px]">
          Líneas {chunk.startLine + 1} - {chunk.endLine + 1} • ~{chunk.tokenEstimate} tokens
        </p>
      </div>
    </div>
  );
}

