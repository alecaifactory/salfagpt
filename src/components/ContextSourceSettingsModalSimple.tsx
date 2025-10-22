import { useState, useEffect } from 'react';
import { X, FileText, RefreshCw, Database, Sparkles, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Eye, Code, Hash, Target } from 'lucide-react';
import type { ContextSource } from '../types/context';
import DocumentTestPanel from './DocumentTestPanel';

interface ContextSourceSettingsModalSimpleProps {
  source: ContextSource | null;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface ProgressState {
  stage: 'downloading' | 'extracting' | 'chunking' | 'embedding' | 'saving' | 'complete';
  progress: number; // 0-100
  message: string;
  dots: number; // For animating ellipsis
}

interface ProgressLog {
  timestamp: Date;
  stage: string;
  message: string;
  progress: number;
}

interface ChunkData {
  id: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: {
    startChar?: number;
    endChar?: number;
    tokenCount?: number;
    startPage?: number;
    endPage?: number;
  };
  createdAt: Date;
}

interface ChunksResponse {
  chunks: ChunkData[];
  stats: {
    totalChunks: number;
    totalTokens: number;
    avgChunkSize: number;
    embeddingDimensions: number;
  };
  sourceId: string;
  sourceName: string;
}

export default function ContextSourceSettingsModalSimple({
  source,
  isOpen,
  onClose,
  userId,
}: ContextSourceSettingsModalSimpleProps) {
  const [isReIndexing, setIsReIndexing] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [showAdvancedLogs, setShowAdvancedLogs] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // NEW: Full source data state (includes extractedData)
  const [fullSource, setFullSource] = useState<ContextSource | null>(null);
  const [loadingFullSource, setLoadingFullSource] = useState(false);
  
  // NEW: Chunk data state
  const [chunksData, setChunksData] = useState<ChunksResponse | null>(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(true); // Always expanded by default
  const [showChunks, setShowChunks] = useState(false);
  // Removed selectedChunk state - chunks are now static display only
  
  // NEW: Interactive testing state
  const [showInteractiveTest, setShowInteractiveTest] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [testQuestion, setTestQuestion] = useState('');
  const [testResult, setTestResult] = useState<{
    question: string;
    response: string;
    references: any[];
    matchedChunk: boolean;
  } | null>(null);
  const [isTestingQuestion, setIsTestingQuestion] = useState(false);

  const addProgressLog = (stage: string, message: string, progress: number) => {
    console.log(`[Re-index Progress] ${progress}% - ${stage}: ${message}`);
    setProgressLogs(prev => [...prev, {
      timestamp: new Date(),
      stage,
      message,
      progress,
    }]);
  };


  // Load full source data (including extractedData) when modal opens
  useEffect(() => {
    if (isOpen && source?.id) {
      loadFullSource();
    }
  }, [isOpen, source?.id]);

  const loadFullSource = async () => {
    if (!source?.id) return;
    
    console.log(`📥 Loading full source data for: ${source.name} (ID: ${source.id})`);
    setLoadingFullSource(true);
    
    try {
      const response = await fetch(`/api/context-sources/${source.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullSource(data.source);
        console.log(`✅ Loaded full source with ${data.source.extractedData?.length || 0} chars of extracted text`);
      } else {
        console.error(`❌ Failed to load full source: ${response.status}`);
        setFullSource(null);
      }
    } catch (error) {
      console.error('❌ Error loading full source:', error);
      setFullSource(null);
    } finally {
      setLoadingFullSource(false);
    }
  };

  // Load chunks when modal opens (always try, even if ragEnabled is false)
  // This allows us to detect if chunks exist but ragEnabled flag is out of sync
  useEffect(() => {
    if (isOpen && source) {
      loadChunks();
    }
  }, [isOpen, source?.id]);

  const loadChunks = async () => {
    if (!source) {
      console.warn('⚠️ loadChunks called but source is null');
      return;
    }
    
    if (!source.id) {
      console.error('❌ source.id is undefined for:', source.name);
      return;
    }
    
    console.log(`📊 Loading chunks for source: ${source.name} (ID: ${source.id})`);
    
    setLoadingChunks(true);
    try {
      const response = await fetch(`/api/context-sources/${source.id}/chunks`);
      if (response.ok) {
        const data: ChunksResponse = await response.json();
        setChunksData(data);
        console.log(`✅ Loaded ${data.stats.totalChunks} chunks for ${source.name}`);
      } else {
        console.error(`❌ Failed to load chunks: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading chunks:', error);
    } finally {
      setLoadingChunks(false);
    }
  };

  // Animate dots for current stage
  useEffect(() => {
    if (!progressState || progressState.stage === 'complete') return;

    const interval = setInterval(() => {
      setProgressState(prev => {
        if (!prev) return null;
        return { ...prev, dots: (prev.dots + 1) % 4 };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [progressState]);

  if (!isOpen || !source) return null;

  const hasCloudStorage = !!(source.metadata as any)?.storagePath || !!(source.metadata as any)?.gcsPath;
  // Check RAG status from multiple sources:
  // 1. source.ragEnabled field
  // 2. chunksData loaded from API (most reliable)
  // 3. metadata.ragEmbeddings > 0
  const hasRAG = !!source.ragEnabled || 
                 (chunksData && chunksData.chunks.length > 0) ||
                 ((source.metadata as any)?.ragEmbeddings || 0) > 0;

  const handleReIndex = async () => {
    if (!source) return;
    
    setIsReIndexing(true);
    setMessage(null);
    setProgressLogs([]);
    setShowAdvancedLogs(false);

    try {
      // Use SSE endpoint for real-time progress
      const response = await fetch(`/api/context-sources/${source.id}/reindex-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start re-indexing');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              // Update progress state
              setProgressState({
                stage: data.stage as any,
                progress: data.progress,
                message: data.message,
                dots: 0,
              });

              // Add to logs
              addProgressLog(data.stage, data.message, data.progress);

              // Check for completion
              if (data.stage === 'complete' && data.chunksCreated) {
                setMessage({
                  type: 'success',
                  text: `✅ Re-indexado exitoso: ${data.chunksCreated} chunks creados`,
                });

                // Immediately reload chunks to show updated state
                console.log('🔄 Re-indexing complete, reloading chunks...');
                
                // Wait a bit for Firestore to propagate, then reload
                setTimeout(async () => {
                  await loadChunks();
                  console.log('✅ Chunks reloaded');
                  
                  // Clear progress state to show the updated RAG section
                  setProgressState(null);
                  setIsReIndexing(false);
                }, 1500);
              }

              // Check for error
              if (data.stage === 'error') {
                throw new Error(data.message);
              }

            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error re-indexing:', error);
      setProgressState(null);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al re-indexar',
      });
      setIsReIndexing(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getSourceTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'pdf': 'PDF',
      'csv': 'CSV',
      'excel': 'Excel',
      'word': 'Word',
      'folder': 'Carpeta',
      'web-url': 'URL Web',
      'api': 'API',
    };
    return labels[type] || type;
  };

  const getStageProgress = (stage: string): number => {
    const stageProgress: Record<string, number> = {
      'downloading': 15,
      'extracting': 25,
      'chunking': 25,  // Most work happens in API
      'embedding': 25,
      'saving': 85,
      'complete': 95,
    };
    return stageProgress[stage] || 0;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="border-b border-slate-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Configuración del Documento</h2>
              <p className="text-xs text-slate-500 truncate max-w-md">{source.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content - 2 Column Layout: LEFT: texto + info extracción, RIGHT: indexación RAG + chunks + archivo original */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            
            {/* LEFT COLUMN - Texto Extraído + Información de Extracción */}
            <div className="space-y-3">
              
              {/* 1. TEXTO EXTRAÍDO - ARRIBA IZQUIERDA */}
              <section className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Texto Extraído
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {fullSource?.extractedData?.length.toLocaleString() || '0'} caracteres
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      ≈ {fullSource?.extractedData ? Math.ceil(fullSource.extractedData.length / 4).toLocaleString() : '0'} tokens
                    </span>
                  </div>
                </div>
                
                <div className="max-h-[280px] overflow-y-auto bg-slate-50 rounded p-2 border border-slate-100">
                  {loadingFullSource ? (
                    <div className="h-24 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs">Cargando texto extraído...</p>
                    </div>
                  ) : fullSource?.extractedData ? (
                    <pre className="text-[11px] text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
{fullSource.extractedData.length > 5000 
  ? fullSource.extractedData.substring(0, 5000) + '\n\n... (texto truncado para vista previa, total: ' + fullSource.extractedData.length.toLocaleString() + ' caracteres)'
  : fullSource.extractedData}
                    </pre>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-slate-400">
                      <p className="text-xs">No hay texto extraído disponible</p>
                    </div>
                  )}
                </div>
              </section>

              {/* 2. INFORMACIÓN DE EXTRACCIÓN - ABAJO IZQUIERDA */}
              <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Información de Extracción
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* Modelo */}
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Modelo:</p>
                    {source.metadata?.model === 'gemini-2.5-pro' ? (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Pro
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Flash
                      </span>
                    )}
                  </div>

                  {/* Tamaño */}
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Tamaño:</p>
                    <p className="text-xs font-medium text-slate-900">
                      {formatFileSize(source.metadata?.originalFileSize)}
                    </p>
                  </div>

                  {/* Caracteres extraídos */}
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Caracteres extraídos:</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {fullSource?.extractedData?.length.toLocaleString() || 
                       source.metadata?.charactersExtracted?.toLocaleString() || 'N/A'}
                    </p>
                  </div>

                  {/* Tokens estimados */}
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Tokens estimados:</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {fullSource?.extractedData 
                        ? Math.ceil(fullSource.extractedData.length / 4).toLocaleString()
                        : source.metadata?.tokensEstimate?.toLocaleString() || 'N/A'}
                    </p>
                  </div>

                  {/* Tiempo */}
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Tiempo de extracción:</p>
                    <p className="text-xs font-medium text-slate-900">
                      {source.metadata?.extractionTime 
                        ? `${(source.metadata.extractionTime / 1000).toFixed(2)}s`
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Costo */}
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Costo de extracción:</p>
                    <p className="text-xs font-semibold text-green-600">
                      {source.metadata?.totalCost 
                        ? `$${source.metadata.totalCost.toFixed(4)}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* File metadata */}
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Archivo original:</span>
                      <p className="font-medium text-slate-900 truncate">
                        {source.metadata?.originalFileName || source.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tipo:</span>
                      <p className="font-medium text-slate-900">
                        {getSourceTypeLabel(source.type)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN - Indexación RAG + Chunks + Archivo Original */}
            <div className="space-y-3">
              
              {/* 3. INDEXACIÓN RAG - ARRIBA DERECHA */}
              <section className="bg-white rounded-lg border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Indexación RAG
                </h3>
                
                {/* Show loading state while fetching chunks */}
                {loadingChunks ? (
                  <div className="flex items-center justify-center py-3 bg-slate-50 rounded-lg">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-slate-600">Cargando información de RAG...</span>
                  </div>
                ) : (chunksData && chunksData.chunks.length > 0) || hasRAG ? (
                  <div className="space-y-2">
                    {/* RAG Status Badge */}
                    <div className="flex items-start gap-2 bg-green-50 rounded p-2 border border-green-200">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          ✅ RAG habilitado
                        </p>
                        <p className="text-xs text-slate-600">
                          Búsqueda inteligente activa con {chunksData?.stats?.totalChunks || (source.metadata as any)?.ragChunks || 0} chunks
                        </p>
                      </div>
                    </div>
                    
                    {/* RAG Statistics */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total de chunks:</span>
                        <span className="font-semibold text-slate-900">
                          {chunksData?.stats?.totalChunks || (source.metadata as any)?.ragChunks || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tokens totales:</span>
                        <span className="font-semibold text-slate-900">
                          {(chunksData?.stats?.totalTokens || (source.metadata as any)?.ragTokens || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tamaño promedio:</span>
                        <span className="font-semibold text-slate-900">
                          {chunksData?.stats?.avgChunkSize || 
                           ((source.metadata as any)?.ragTokens && (source.metadata as any)?.ragChunks 
                             ? Math.round((source.metadata as any).ragTokens / (source.metadata as any).ragChunks)
                             : 0)} tokens
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Dimensiones de embedding:</span>
                        <span className="font-semibold text-slate-900">
                          {chunksData?.stats?.embeddingDimensions || 768}
                        </span>
                      </div>
                      {(chunksData?.chunks?.[0]?.createdAt || (source.metadata as any)?.ragProcessedAt) && (
                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                          <span className="text-slate-600">Indexado:</span>
                          <span className="font-medium text-slate-700">
                            {new Date(
                              chunksData?.chunks?.[0]?.createdAt || (source.metadata as any)?.ragProcessedAt
                            ).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Re-indexar button */}
                    {hasCloudStorage && !progressState && (
                      <button
                        onClick={handleReIndex}
                        disabled={isReIndexing}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Re-indexar con RAG
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 mb-0.5">
                          RAG no indexado
                        </p>
                        <p className="text-xs text-slate-600 mb-2">
                          Este documento aún no tiene indexación RAG. Re-indexa para habilitar búsqueda inteligente y ahorrar tokens.
                        </p>
                        
                        {/* Re-index Button for non-indexed docs */}
                        {hasCloudStorage && !progressState && (
                          <button
                            onClick={handleReIndex}
                            disabled={isReIndexing}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-300 text-xs font-medium"
                          >
                            <Database className="w-3.5 h-3.5" />
                            Indexar con RAG
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Progress Display - Thinking-style */}
                {progressState && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressState.progress}%` }}
                      />
                    </div>
                    
                    {/* Current Stage with animated dots */}
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-700">
                        {progressState.message}{'.'.repeat(progressState.dots)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {progressState.progress}%
                      </p>
                    </div>
                    
                    {/* Stage checklist - More compact */}
                    <div className="space-y-1 text-xs">
                      {[
                        { stage: 'downloading', label: 'Descargando' },
                        { stage: 'extracting', label: 'Procesando' },
                        { stage: 'complete', label: 'Finalizando' },
                      ].map(({ stage, label }) => (
                        <div key={stage} className="flex items-center gap-1.5">
                          {progressState.stage === stage ? (
                            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                          ) : progressState.progress > getStageProgress(stage) ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
                          )}
                          <span className={progressState.stage === stage ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Advanced Logs - Collapsible */}
                    {progressLogs.length > 0 && (
                      <div className="border-t border-slate-200 pt-2">
                        <button
                          onClick={() => setShowAdvancedLogs(!showAdvancedLogs)}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                        >
                          {showAdvancedLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Ver logs ({progressLogs.length})
                        </button>
                        
                        {showAdvancedLogs && (
                          <div className="mt-2 bg-slate-50 rounded p-1.5 max-h-32 overflow-y-auto">
                            <div className="space-y-0.5 font-mono text-[9px]">
                              {progressLogs.map((log, idx) => (
                                <div key={idx} className="text-slate-700">
                                  <span className="text-slate-500">
                                    [{log.timestamp.toLocaleTimeString('es-ES')}]
                                  </span>
                                  {' '}
                                  <span className="text-blue-600">{log.progress}%</span>
                                  {' '}
                                  <span className="font-semibold">{log.stage}:</span>
                                  {' '}
                                  {log.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
              
              {/* 4. CHUNKS - COLLAPSIBLE */}
              {chunksData && chunksData.chunks.length > 0 && (
                <section className="bg-white rounded-lg border border-slate-200">
                  <button
                    onClick={() => setShowChunks(!showChunks)}
                    className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Chunks ({chunksData.chunks.length})
                    </h3>
                    <span className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      {showChunks ? (
                        <>
                          <span>Ocultar</span>
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <span>Mostrar</span>
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </span>
                  </button>

                  {showChunks && (
                    <div className="border-t border-slate-200 px-3 pb-3">
                      <div className="max-h-[300px] overflow-y-auto mt-3 space-y-1.5">
                        {chunksData.chunks.map((chunk, idx) => (
                          <div 
                            key={chunk.id} 
                            className="bg-slate-50 rounded border border-slate-200 p-2"
                          >
                            {/* Chunk Info - Static Display (No interaction) */}
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
                                  Chunk #{chunk.chunkIndex + 1}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {chunk.metadata.tokenCount || 0} tokens
                                </span>
                                {chunk.metadata.startPage && (
                                  <span className="text-[10px] text-slate-500">
                                    Pág. {chunk.metadata.startPage}
                                    {chunk.metadata.endPage && chunk.metadata.endPage !== chunk.metadata.startPage 
                                      ? `-${chunk.metadata.endPage}` 
                                      : ''
                                    }
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chunk Preview - Read Only */}
                            <p className="text-xs text-slate-600 line-clamp-3">
                              {chunk.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
              
              {/* 5. ARCHIVO ORIGINAL - ABAJO DERECHA */}
              <section className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Archivo Original
                </h3>
                
                {hasCloudStorage ? (
                  <div className="space-y-2">
                    {/* Cloud Storage status */}
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-900">
                          Archivo disponible en Cloud Storage
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          El archivo original está guardado y disponible para re-indexar sin necesidad de volver a subirlo.
                        </p>
                      </div>
                    </div>
                    
                    {/* File info with GCS path */}
                    <div className="bg-white border border-slate-200 rounded p-2 text-xs space-y-1.5">
                      {/* GCS Path (clickeable) */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-500 text-[10px]">Ubicación GCS:</span>
                        <a
                          href={`https://console.cloud.google.com/storage/browser/_details/${((source.metadata as any)?.gcsPath || (source.metadata as any)?.storagePath || '').replace('gs://', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[9px] text-blue-600 hover:text-blue-800 hover:underline break-all"
                          title="Click para abrir en Google Cloud Console"
                        >
                          {(source.metadata as any)?.gcsPath || (source.metadata as any)?.storagePath || 'N/A'}
                        </a>
                      </div>
                      
                      {/* Upload source */}
                      {source.metadata?.uploadedVia && (
                        <div className="flex justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500 text-[10px]">Subido vía:</span>
                          <span className="font-semibold text-green-700 text-[10px]">
                            {source.metadata.uploadedVia === 'cli' ? '🖥️ CLI' : '🌐 Webapp'}
                          </span>
                        </div>
                      )}
                      
                      {/* CLI version if uploaded via CLI */}
                      {source.metadata?.cliVersion && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[10px]">CLI Version:</span>
                          <span className="font-mono text-slate-700 text-[10px]">{source.metadata.cliVersion}</span>
                        </div>
                      )}
                    </div>

                    {/* View button */}
                    <button
                      onClick={() => setShowFileViewer(!showFileViewer)}
                      className="w-full px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showFileViewer ? 'Ocultar' : 'Ver archivo'}
                    </button>
                    
                    {/* Integrated PDF viewer - Authenticated */}
                    {showFileViewer && (
                      <div className="border border-slate-300 rounded overflow-hidden bg-slate-100">
                        <div className="bg-slate-700 text-white px-2 py-1.5 text-xs flex items-center justify-between">
                          <span>📄 {source.name}</span>
                          <span className="text-slate-300 text-[10px]">Vista protegida</span>
                        </div>
                        <iframe
                          src={`/api/context-sources/${source.id}/file`}
                          className="w-full h-48 bg-white"
                          title={`Vista previa de ${source.name}`}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-900 mb-0.5">
                        Archivo no guardado
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Este documento fue procesado antes de implementar Cloud Storage. 
                        Para re-indexar, necesitarás volver a subirlo.
                      </p>
                    </div>
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="border-t border-slate-200 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      {/* Interactive Test Panel */}
      {showInteractiveTest && chunksData && (
        <DocumentTestPanel
          sourceId={source?.id || ''}
          sourceName={source?.name || ''}
          chunks={chunksData.chunks}
          userId={userId}
          onClose={() => setShowInteractiveTest(false)}
        />
      )}
    </div>
  );
}

