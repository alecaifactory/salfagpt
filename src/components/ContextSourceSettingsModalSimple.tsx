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
  
  // NEW: Chunk data state
  const [chunksData, setChunksData] = useState<ChunksResponse | null>(null);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(true); // Always expanded by default
  const [showChunks, setShowChunks] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);
  
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

  // Load chunks when modal opens (always try, even if ragEnabled is false)
  // This allows us to detect if chunks exist but ragEnabled flag is out of sync
  useEffect(() => {
    if (isOpen && source) {
      loadChunks();
    }
  }, [isOpen, source?.id]);

  const loadChunks = async () => {
    if (!source) return;
    
    setLoadingChunks(true);
    try {
      const response = await fetch(`/api/context-sources/${source.id}/chunks`);
      if (response.ok) {
        const data: ChunksResponse = await response.json();
        setChunksData(data);
        console.log(`✅ Loaded ${data.stats.totalChunks} chunks for ${source.name}`);
      }
    } catch (error) {
      console.error('Error loading chunks:', error);
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

  const hasCloudStorage = !!(source.metadata as any)?.storagePath;
  const hasRAG = !!source.ragEnabled;

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
        {/* Header - Simple */}
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Configuración del Documento</h2>
              <p className="text-sm text-slate-500 truncate max-w-md">{source.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content - 2 Column Layout: LEFT: texto + info extracción, RIGHT: historial chunks + archivo original */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            
            {/* LEFT COLUMN - Texto Extraído + Información de Extracción */}
            <div className="space-y-4 flex flex-col">
              
              {/* 1. TEXTO EXTRAÍDO - ARRIBA IZQUIERDA */}
              <section className="bg-white rounded-lg border border-slate-300 p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Texto Extraído
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {source.extractedData?.length.toLocaleString() || '0'} caracteres
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      ≈ {source.extractedData ? Math.ceil(source.extractedData.length / 4).toLocaleString() : '0'} tokens
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-3">
                  {source.extractedData ? (
                    <pre className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
{source.extractedData.length > 3000 
  ? source.extractedData.substring(0, 3000) + '\n\n... (texto truncado para vista previa, total: ' + source.extractedData.length.toLocaleString() + ' caracteres)'
  : source.extractedData}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <p className="text-xs">No hay texto extraído disponible</p>
                    </div>
                  )}
                </div>
              </section>

              {/* 2. INFORMACIÓN DE EXTRACCIÓN - DEBAJO */}
              <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Información de Extracción
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Modelo */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Modelo:</p>
                    {source.metadata?.model === 'gemini-2.5-pro' ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Pro
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Flash
                      </span>
                    )}
                  </div>

                  {/* Tamaño */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Tamaño:</p>
                    <p className="text-xs font-medium text-slate-900">
                      {formatFileSize(source.metadata?.originalFileSize)}
                    </p>
                  </div>

                  {/* Caracteres extraídos - COHERENTE con texto mostrado */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Caracteres extraídos:</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {source.extractedData?.length.toLocaleString() || 
                       source.metadata?.charactersExtracted?.toLocaleString() || 'N/A'}
                    </p>
                  </div>

                  {/* Tokens estimados - COHERENTE con caracteres */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Tokens estimados:</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {source.extractedData 
                        ? Math.ceil(source.extractedData.length / 4).toLocaleString()
                        : source.metadata?.tokensEstimate?.toLocaleString() || 'N/A'}
                    </p>
                  </div>

                  {/* Tiempo */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Tiempo de extracción:</p>
                    <p className="text-xs font-medium text-slate-900">
                      {source.metadata?.extractionTime 
                        ? `${(source.metadata.extractionTime / 1000).toFixed(2)}s`
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Costo */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-500 mb-1">Costo de extracción:</p>
                    <p className="text-xs font-semibold text-green-600">
                      {source.metadata?.totalCost 
                        ? `$${source.metadata.totalCost.toFixed(4)}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* File metadata */}
                <div className="mt-3 pt-3 border-t border-blue-200">
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

              {/* Processing History */}
              {source.pipelineLogs && source.pipelineLogs.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Historia de Procesamiento</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    {source.pipelineLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        {log.status === 'success' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : log.status === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : log.status === 'in_progress' ? (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-slate-900 capitalize">
                              {log.step === 'upload' ? 'Subida' :
                               log.step === 'extract' ? 'Extracción' :
                               log.step === 'chunk' ? 'Chunking' :
                               log.step === 'embed' ? 'Embeddings' :
                               'Completado'}
                            </span>
                            {log.duration && (
                              <span className="text-[10px] text-slate-500">
                                {(log.duration / 1000).toFixed(2)}s
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600">{log.message}</p>
                          
                          {/* Step-specific details */}
                          {log.details && (
                            <div className="mt-1 text-[10px] text-slate-500 space-y-0.5">
                              {log.step === 'upload' && log.details.fileSize && (
                                <p>Tamaño: {formatFileSize(log.details.fileSize)}</p>
                              )}
                              {log.step === 'extract' && (
                                <>
                                  {log.details.model && <p>Modelo: {log.details.model}</p>}
                                  {log.details.charactersExtracted && (
                                    <p>Caracteres: {log.details.charactersExtracted.toLocaleString()}</p>
                                  )}
                                  {log.details.cost && (
                                    <p>Costo: ${log.details.cost.toFixed(4)}</p>
                                  )}
                                </>
                              )}
                              {log.step === 'chunk' && log.details.chunkCount && (
                                <p>Chunks creados: {log.details.chunkCount}</p>
                              )}
                              {log.step === 'embed' && log.details.embeddingCount && (
                                <p>Embeddings: {log.details.embeddingCount}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Cloud Storage Status */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Archivo Original</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  {hasCloudStorage ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 mb-1">
                            Archivo disponible en Cloud Storage
                          </p>
                          <p className="text-xs text-slate-600 mb-2">
                            El archivo original está guardado y disponible para re-indexar sin necesidad de volver a subirlo.
                          </p>
                        </div>
                      </div>
                      
                      {/* File viewer */}
                      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-500 mb-1">Ruta de almacenamiento:</p>
                            <p className="font-mono text-[10px] text-slate-700 truncate">
                              {(source.metadata as any)?.storagePath || 'N/A'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowFileViewer(!showFileViewer)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium whitespace-nowrap flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            {showFileViewer ? 'Ocultar' : 'Ver archivo'}
                          </button>
                        </div>
                        
                        {/* Integrated PDF viewer - Authenticated */}
                        {showFileViewer && hasCloudStorage && (
                          <div className="mt-2 border border-slate-300 rounded overflow-hidden bg-slate-100">
                            <div className="bg-slate-700 text-white px-3 py-2 text-xs flex items-center justify-between">
                              <span>📄 {source.name}</span>
                              <span className="text-slate-300">Vista protegida</span>
                            </div>
                            <iframe
                              src={`/api/context-sources/${source.id}/file`}
                              className="w-full h-96 bg-white"
                              title={`Vista previa de ${source.name}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 mb-1">
                          Archivo no guardado
                        </p>
                        <p className="text-xs text-slate-600">
                          Este documento fue procesado antes de implementar Cloud Storage. 
                          Para re-indexar, necesitarás volver a subirlo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* RAG section moved to right column */}

              {/* Success/Error Message */}
              {message && (
                <div className={`rounded-lg p-4 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                  {message.type === 'success' && (
                    <p className="text-xs text-slate-600 mt-1">
                      Recargando página...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Historial Chunkings + Archivo Original */}
            <div className="space-y-4 flex flex-col">
              
              {/* 3. HISTORIAL DE CHUNKINGS - ARRIBA DERECHA */}
              <section className="bg-white rounded-lg border border-slate-300 p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Indexación RAG
                </h3>
                
                {/* Show loading state while fetching chunks */}
                {loadingChunks ? (
                  <div className="flex items-center justify-center py-4 bg-slate-50 rounded-lg">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-slate-600">Cargando información de RAG...</span>
                  </div>
                ) : chunksData && chunksData.chunks.length > 0 ? (
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    {/* RAG is active with chunks */}
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 mb-1">
                          ✅ RAG habilitado
                        </p>
                        <p className="text-xs text-slate-600">
                          Búsqueda inteligente activa con {chunksData.stats.totalChunks} chunks
                        </p>
                      </div>
                    </div>
                    
                    {/* RAG Statistics from actual chunks */}
                    <div className="bg-white border border-slate-200 rounded p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total de chunks:</span>
                        <span className="font-semibold text-slate-900">{chunksData.stats.totalChunks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tokens totales:</span>
                        <span className="font-semibold text-slate-900">{chunksData.stats.totalTokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tamaño promedio:</span>
                        <span className="font-semibold text-slate-900">{chunksData.stats.avgChunkSize} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Dimensiones de embedding:</span>
                        <span className="font-semibold text-slate-900">{chunksData.stats.embeddingDimensions}</span>
                      </div>
                      {chunksData.chunks[0]?.createdAt && (
                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                          <span className="text-slate-600">Indexado:</span>
                          <span className="font-medium text-slate-700">
                            {new Date(chunksData.chunks[0].createdAt).toLocaleDateString('es-ES', {
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
                    
                    {/* Indexing History - ALWAYS EXPANDED */}
                    {source.indexingHistory && source.indexingHistory.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2">
                          📋 Historial de Indexaciones ({source.indexingHistory.length})
                        </h4>
                        <div className="space-y-2">
                          {source.indexingHistory.slice().reverse().map((entry, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded p-3 text-xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  entry.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {entry.method === 'initial' ? '📄 Inicial' : 
                                   entry.method === 'reindex' ? '🔄 Re-indexado' : 
                                   '🤖 Automático'}
                                </span>
                                <span className="text-slate-500 font-medium">
                                  {new Date(entry.timestamp).toLocaleDateString('es-ES', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-600">Usuario:</span>
                                  <p className="text-slate-900 font-medium truncate">{entry.userName || entry.userId}</p>
                                </div>
                                <div>
                                  <span className="text-slate-600">Chunks:</span>
                                  <p className="text-slate-900 font-semibold">{entry.chunksCreated}</p>
                                </div>
                                <div>
                                  <span className="text-slate-600">Modelo:</span>
                                  <p className="text-slate-900 font-mono text-[10px]">{entry.embeddingModel}</p>
                                </div>
                                <div>
                                  <span className="text-slate-600">Duración:</span>
                                  <p className="text-slate-900 font-semibold">{(entry.duration / 1000).toFixed(2)}s</p>
                                </div>
                              </div>
                              {entry.error && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-700 text-xs">{entry.error}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {/* Re-index Button */}
                      {hasCloudStorage && !progressState && (
                        <>
                          <button
                            onClick={handleReIndex}
                            disabled={isReIndexing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            <Database className="w-4 h-4" />
                            {hasRAG ? 'Re-indexar' : 'Indexar con RAG'}
                          </button>
                          
                          {/* Interactive Test Button */}
                          <button
                            onClick={() => setShowInteractiveTest(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md"
                          >
                            <Target className="w-4 h-4" />
                            <span>Probar Documento Interactivamente</span>
                            <Sparkles className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {!hasCloudStorage && (
                        <div className="text-center py-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-xs text-amber-700">
                            Re-indexar no disponible sin archivo original
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 mb-1">
                          RAG no indexado
                        </p>
                        <p className="text-xs text-slate-600 mb-3">
                          Este documento aún no tiene indexación RAG. Re-indexa para habilitar búsqueda inteligente y ahorrar tokens.
                        </p>
                        
                        {/* Re-index Button for non-indexed docs */}
                        {hasCloudStorage && !progressState && (
                          <button
                            onClick={handleReIndex}
                            disabled={isReIndexing}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 text-sm font-medium"
                          >
                            <Database className="w-4 h-4" />
                            Indexar con RAG
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Progress Display - Thinking-style */}
                {progressState && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressState.progress}%` }}
                      />
                    </div>
                    
                    {/* Current Stage with animated dots */}
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">
                        {progressState.message}{'.'.repeat(progressState.dots)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {progressState.progress}%
                      </p>
                    </div>
                    
                    {/* Stage checklist */}
                    <div className="space-y-1.5 text-xs">
                      {[
                        { stage: 'downloading', label: 'Descargando archivo' },
                        { stage: 'extracting', label: 'Procesando con API (chunking + embeddings)' },
                        { stage: 'complete', label: 'Finalizando' },
                      ].map(({ stage, label }) => (
                        <div key={stage} className="flex items-center gap-2">
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
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <button
                          onClick={() => setShowAdvancedLogs(!showAdvancedLogs)}
                          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
                        >
                          {showAdvancedLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Ver logs detallados ({progressLogs.length})
                        </button>
                        
                        {showAdvancedLogs && (
                          <div className="mt-2 bg-slate-50 rounded p-2 max-h-40 overflow-y-auto">
                            <div className="space-y-1 font-mono text-[10px]">
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
              
              {/* Extracted Text Section - Always Expanded */}
              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Texto Extraído</h3>
                </div>

                {source.extractedData ? (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-700 text-white px-3 py-2 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        <span className="font-semibold">
                          {source.metadata?.charactersExtracted?.toLocaleString() || source.extractedData.length.toLocaleString()} caracteres
                        </span>
                        <span className="text-slate-400">•</span>
                        <Hash className="w-3 h-3" />
                        <span className="font-semibold">
                          {source.metadata?.tokensEstimate?.toLocaleString() || Math.ceil(source.extractedData.length / 4).toLocaleString()} tokens
                        </span>
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(source.extractedData || '');
                          setMessage({ type: 'success', text: 'Texto copiado al portapapeles' });
                          setTimeout(() => setMessage(null), 2000);
                        }}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-[10px] font-medium"
                      >
                        Copiar
                      </button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {source.extractedData}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500">No hay texto extraído disponible</p>
                  </div>
                )}
              </section>

              {/* Chunks Viewer */}
              {chunksData && chunksData.chunks.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Chunks ({chunksData.chunks.length})
                    </h3>
                    <button
                      onClick={() => setShowChunks(!showChunks)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {showChunks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showChunks ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  {showChunks && (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden max-h-[500px] overflow-y-auto">
                      <div className="divide-y divide-slate-200">
                        {chunksData.chunks.map((chunk, idx) => (
                          <div key={chunk.id} className="p-3 hover:bg-white transition-colors">
                            <button
                              onClick={() => setSelectedChunk(selectedChunk?.id === chunk.id ? null : chunk)}
                              className="w-full text-left"
                            >
                              {/* Chunk Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
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
                                {selectedChunk?.id === chunk.id ? (
                                  <ChevronUp className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-slate-400" />
                                )}
                              </div>

                              {/* Chunk Preview */}
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {chunk.text}
                              </p>
                            </button>

                            {/* Expanded Chunk Details */}
                            {selectedChunk?.id === chunk.id && (
                              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                {/* Full Text */}
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-1">Texto completo:</p>
                                  <div className="bg-white rounded p-2 border border-slate-200 max-h-40 overflow-y-auto">
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap">
                                      {chunk.text}
                                    </p>
                                  </div>
                                </div>

                                {/* Embedding Preview */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <Hash className="w-3 h-3" />
                                      Vector de embedding ({chunk.embedding.length} dimensiones)
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(JSON.stringify(chunk.embedding));
                                        setMessage({ type: 'success', text: 'Vector copiado' });
                                        setTimeout(() => setMessage(null), 2000);
                                      }}
                                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[9px] text-slate-700"
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                  <div className="bg-white rounded p-2 border border-slate-200 max-h-24 overflow-y-auto">
                                    <p className="text-[9px] text-slate-600 font-mono break-all">
                                      [{chunk.embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}, ...]
                                    </p>
                                  </div>
                                </div>

                                {/* Chunk Metadata */}
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="bg-white rounded p-2 border border-slate-200">
                                    <span className="text-slate-500">Posición:</span>
                                    <span className="ml-1 font-medium text-slate-700">
                                      {chunk.metadata.startChar || 0} - {chunk.metadata.endChar || 0}
                                    </span>
                                  </div>
                                  <div className="bg-white rounded p-2 border border-slate-200">
                                    <span className="text-slate-500">Creado:</span>
                                    <span className="ml-1 font-medium text-slate-700">
                                      {chunk.createdAt.toLocaleDateString('es-ES')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
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

