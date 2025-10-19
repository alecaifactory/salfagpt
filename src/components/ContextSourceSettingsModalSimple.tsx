import { useState, useEffect } from 'react';
import { X, FileText, RefreshCw, Database, Sparkles, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import type { ContextSource } from '../types/context';

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

  const addProgressLog = (stage: string, message: string, progress: number) => {
    console.log(`[Re-index Progress] ${progress}% - ${stage}: ${message}`);
    setProgressLogs(prev => [...prev, {
      timestamp: new Date(),
      stage,
      message,
      progress,
    }]);
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

                // Reload page after 2 seconds
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
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
    } finally {
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
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Extraction Info */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Información de Extracción</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Modelo:</span>
                <span className="font-medium text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  {source.metadata?.model || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tamaño:</span>
                <span className="font-medium text-slate-900">
                  {formatFileSize(source.metadata?.originalFileSize)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Caracteres extraídos:</span>
                <span className="font-medium text-slate-900">
                  {source.metadata?.charactersExtracted?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tokens estimados:</span>
                <span className="font-medium text-slate-900">
                  {source.metadata?.tokensEstimate?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </section>

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

          {/* RAG Indexing Section */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Indexación RAG</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {hasRAG ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      RAG habilitado
                    </p>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Chunks: {source.ragMetadata?.chunkCount || 'N/A'}</p>
                      <p>Indexado: {source.ragMetadata?.indexedAt ? new Date(source.ragMetadata.indexedAt).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      RAG no indexado
                    </p>
                    <p className="text-xs text-slate-600">
                      Este documento aún no tiene indexación RAG. Re-indexa para habilitar búsqueda inteligente y ahorrar tokens.
                    </p>
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

              {/* Re-index Button */}
              {hasCloudStorage && !progressState && (
                <button
                  onClick={handleReIndex}
                  disabled={isReIndexing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Database className="w-4 h-4" />
                  {hasRAG ? 'Re-indexar' : 'Indexar con RAG'}
                </button>
              )}

              {!hasCloudStorage && (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500">
                    Re-indexar no disponible sin archivo original
                  </p>
                </div>
              )}
            </div>
          </section>

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
    </div>
  );
}

