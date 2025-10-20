import { useState, useEffect } from 'react';
import { X, RefreshCw, FileText, Clock, HardDrive, Zap, Info, Settings, CheckCircle, AlertCircle, User, Globe, Tag, Sparkles, Eye } from 'lucide-react';
import type { ContextSource, WorkflowConfig } from '../types/context';
import { useModalClose } from '../hooks/useModalClose';

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

interface ContextSourceSettingsModalProps {
  source: ContextSource | null;
  isOpen: boolean;
  onClose: () => void;
  onReExtract: (sourceId: string, newConfig: WorkflowConfig) => Promise<void>;
  onTagsChanged?: () => void;
  userId: string;
}

export default function ContextSourceSettingsModal({
  source,
  isOpen,
  onClose,
  onReExtract,
  onTagsChanged,
  userId,
}: ContextSourceSettingsModalProps) {
  const [config, setConfig] = useState<WorkflowConfig>({});
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [showModelTooltip, setShowModelTooltip] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isSavingTags, setIsSavingTags] = useState(false);
  
  // Chunks display
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunksError, setChunksError] = useState<string | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);

  // 🔑 Hook para cerrar con ESC
  useModalClose(isOpen, onClose);

  useEffect(() => {
    if (source?.metadata?.extractionConfig) {
      setConfig(source.metadata.extractionConfig);
    }
    if (source?.tags) {
      setTags(source.tags);
    } else {
      setTags([]);
    }
    
    // Load chunks if RAG is enabled
    if (source?.ragMetadata && source.ragEnabled) {
      loadChunks();
    } else {
      setChunks([]);
      setChunksError(null);
    }
  }, [source]);
  
  const loadChunks = async () => {
    if (!source?.id) return;
    
    setLoadingChunks(true);
    setChunksError(null);
    
    try {
      const response = await fetch(`/api/context-sources/${source.id}/chunks`);
      
      if (!response.ok) {
        throw new Error('Failed to load chunks');
      }
      
      const data: ChunksResponse = await response.json();
      setChunks(data.chunks || []);
      console.log(`✅ Loaded ${data.chunks?.length || 0} chunks for ${source.name}`);
    } catch (error) {
      console.error('❌ Error loading chunks:', error);
      setChunksError(error instanceof Error ? error.message : 'Error desconocido');
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  if (!isOpen || !source) return null;

  const handleReExtract = async () => {
    setIsReExtracting(true);
    try {
      await onReExtract(source.id, config);
      onClose();
    } catch (error) {
      console.error('Error re-extracting:', error);
    } finally {
      setIsReExtracting(false);
    }
  };

  const handleSaveTags = async () => {
    if (!source) return;
    
    setIsSavingTags(true);
    try {
      // 1. Save tags to API
      const response = await fetch(`/api/context-sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tags,
          labels: tags, // Also save as labels for compatibility
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save tags');
      }
      
      console.log('✅ Tags guardados:', tags);
      
      // 2. If PUBLIC tag added, assign to all agents
      if (tags.includes('PUBLIC')) {
        // Get all conversations and assign this source to them
        const convsResponse = await fetch(`/api/conversations?userId=${userId}`);
        if (convsResponse.ok) {
          const convsData = await convsResponse.json();
          const allConversationIds = convsData.groups.flatMap((g: any) => 
            g.conversations.map((c: any) => c.id)
          );
          
          // Assign to all agents
          for (const agentId of allConversationIds) {
            try {
              await fetch(`/api/context-sources/${source.id}/assign-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId }),
              });
            } catch (error) {
              console.warn('⚠️ Failed to assign to agent:', agentId, error);
            }
          }
          
          console.log(`✅ Source PUBLIC: asignada a ${allConversationIds.length} agentes`);
        }
      }
      
      // 3. Notify parent to reload
      if (onTagsChanged) {
        onTagsChanged();
      }
    } catch (error) {
      console.error('❌ Error al guardar tags:', error);
    } finally {
      setIsSavingTags(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const getSourceTypeLabel = (type: string) => {
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-ES');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold">Configuración de Extracción</h2>
              <p className="text-xs text-blue-100">{source.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert - Prominent if status is error */}
        {source.status === 'error' && source.error && (
          <div className="mx-4 mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-800 mb-2">
                  ❌ Error al Procesar el Documento
                </h3>
                <div className="bg-white rounded-lg p-3 border border-red-200 mb-3">
                  <p className="text-sm font-semibold text-red-700 mb-1">Mensaje de error:</p>
                  <p className="text-sm text-red-600">{source.error.message}</p>
                  {source.error.details && (
                    <>
                      <p className="text-sm font-semibold text-red-700 mt-2 mb-1">Detalles técnicos:</p>
                      <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                        {source.error.details}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-slate-600 mt-2">
                    <strong>Timestamp:</strong> {source.error.timestamp ? formatDate(source.error.timestamp) : 'N/A'}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-2">💡 Posibles soluciones:</p>
                  {source.error?.suggestions && source.error.suggestions.length > 0 ? (
                    <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc">
                      {source.error.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc">
                      <li>Verifica que el archivo no esté corrupto</li>
                      <li>Intenta con un modelo diferente (Flash → Pro o viceversa)</li>
                      <li>Asegúrate de que el archivo sea del tipo correcto ({getSourceTypeLabel(source.type)})</li>
                      <li>Si el archivo es muy grande, intenta con uno más pequeño</li>
                      <li>Revisa que tengas conexión a internet y acceso a Gemini AI</li>
                    </ul>
                  )}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Acción sugerida:</strong> Cambia la configuración abajo y haz click en "Re-extraer" para intentar nuevamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content - New Layout: Top-left: extracted text, below: extraction info, top-right: chunking history, below: original file */}
        <div className="p-4 flex-1 grid grid-cols-2 gap-4 overflow-y-auto">
          {/* Left Column */}
          <div className="space-y-3 flex flex-col">
            {/* Extracted Text Preview - Top Priority */}
            <section className="bg-white rounded-lg border border-slate-300 p-3 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Texto Extraído
              </h3>
              <div className="flex-1 overflow-y-auto">
                {source.extractedData ? (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                    {source.extractedData.length > 2000 
                      ? source.extractedData.substring(0, 2000) + '\n\n... (texto truncado, total: ' + source.extractedData.length.toLocaleString() + ' caracteres)'
                      : source.extractedData}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p className="text-xs">No hay texto extraído disponible</p>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {source.extractedData 
                    ? `${source.extractedData.length.toLocaleString()} caracteres` 
                    : 'N/A'}
                </span>
                <span>
                  {source.extractedData 
                    ? `≈ ${Math.ceil(source.extractedData.length / 4).toLocaleString()} tokens` 
                    : 'N/A'}
                </span>
              </div>
            </section>

            {/* Extraction Information - Below extracted text */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600" />
                Información de Extracción
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-slate-500 mb-1">Modelo:</p>
                  {source.metadata?.model === 'gemini-2.5-pro' ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Pro
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Flash
                    </span>
                  )}
                </div>
                
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-slate-500 mb-1">Tamaño:</p>
                  <p className="font-medium text-slate-800">{formatFileSize(source.metadata?.originalFileSize)}</p>
                </div>

                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-slate-500 mb-1">Caracteres extraídos:</p>
                  <p className="font-medium text-slate-800">
                    {source.extractedData?.length.toLocaleString() || 'N/A'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-slate-500 mb-1">Tokens estimados:</p>
                  <p className="font-medium text-slate-800">
                    {source.extractedData 
                      ? Math.ceil(source.extractedData.length / 4).toLocaleString() 
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-slate-500 mb-1">Tiempo de extracción:</p>
                  <p className="font-medium text-slate-800">
                    {source.metadata?.extractionTime 
                      ? `${(source.metadata.extractionTime / 1000).toFixed(2)}s`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-slate-500 mb-1">Costo de extracción:</p>
                  <p className="font-medium text-green-600">
                    {source.metadata?.totalCost 
                      ? `$${source.metadata.totalCost.toFixed(4)}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* File info */}
              <div className="mt-3 pt-3 border-t border-blue-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Archivo original:</span>
                  <span className="font-medium text-slate-800 truncate ml-2">
                    {source.metadata?.originalFileName || source.name}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Tipo:</span>
                  <span className="font-medium text-slate-800">{getSourceTypeLabel(source.type)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-3 flex flex-col">
            {/* Indexación RAG - Chunking History */}
            <section className="bg-white rounded-lg border border-slate-300 p-3 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                Indexación RAG
              </h3>
              
              {/* RAG Status */}
              {source.ragMetadata ? (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">RAG Indexado</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {source.ragMetadata.chunkCount} chunks
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-slate-500">Tamaño promedio:</p>
                        <p className="font-medium text-slate-800">
                          {source.ragMetadata.avgChunkSize?.toLocaleString() || 'N/A'} caracteres
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Indexado:</p>
                        <p className="font-medium text-slate-800">
                          {formatDate(source.ragMetadata.indexedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chunking History Table */}
                  {source.metadata?.chunkingHistory && source.metadata.chunkingHistory.length > 0 && (
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Historial de Procesamiento:</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Fecha</th>
                              <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Método</th>
                              <th className="px-2 py-1.5 text-right font-semibold text-slate-700">Chunks</th>
                              <th className="px-2 py-1.5 text-right font-semibold text-slate-700">Modelo</th>
                              <th className="px-2 py-1.5 text-right font-semibold text-slate-700">Duración</th>
                              <th className="px-2 py-1.5 text-center font-semibold text-slate-700">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {source.metadata.chunkingHistory.map((entry, idx) => (
                              <tr 
                                key={idx}
                                className={`border-b border-slate-100 hover:bg-slate-50 ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                }`}
                              >
                                <td className="px-2 py-2 text-slate-600">
                                  {formatDate(entry.timestamp)}
                                </td>
                                <td className="px-2 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                    entry.method === 'initial' ? 'bg-blue-100 text-blue-700' :
                                    entry.method === 'reindex' ? 'bg-purple-100 text-purple-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {entry.method === 'initial' ? 'Inicial' :
                                     entry.method === 'reindex' ? 'Re-index' : 'Auto'}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-right font-mono font-semibold text-slate-800">
                                  {entry.chunksCreated}
                                </td>
                                <td className="px-2 py-2 text-right text-slate-600">
                                  {entry.embeddingModel?.includes('pro') ? 'Pro' : 'Flash'}
                                </td>
                                <td className="px-2 py-2 text-right font-mono text-slate-600">
                                  {(entry.duration / 1000).toFixed(2)}s
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {entry.success ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 inline" />
                                  ) : (
                                    <AlertCircle className="w-3.5 h-3.5 text-red-600 inline" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Re-index Button */}
                  <button
                    onClick={handleReExtract}
                    disabled={isReExtracting}
                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-xs font-semibold"
                  >
                    {isReExtracting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Re-indexando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Re-indexar con RAG
                      </>
                    )}
                  </button>
                  
                  {/* Chunks Display Section */}
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Fragmentos (Chunks) del Último Índice
                    </h4>
                    
                    {loadingChunks ? (
                      <div className="flex items-center justify-center py-8">
                        <Clock className="w-5 h-5 animate-spin text-indigo-600" />
                        <span className="ml-2 text-xs text-slate-600">Cargando chunks...</span>
                      </div>
                    ) : chunksError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <AlertCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                        <p className="text-xs text-red-700">{chunksError}</p>
                      </div>
                    ) : chunks.length > 0 ? (
                      <div className="space-y-2">
                        {/* Stats Summary */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[10px] text-slate-500">Total</p>
                            <p className="text-sm font-bold text-indigo-700">{chunks.length}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Tokens</p>
                            <p className="text-sm font-bold text-indigo-700">
                              {chunks.reduce((sum, c) => sum + (c.metadata.tokenCount || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Promedio</p>
                            <p className="text-sm font-bold text-indigo-700">
                              {Math.round(chunks.reduce((sum, c) => sum + (c.metadata.tokenCount || 0), 0) / chunks.length)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Chunks List - Scrollable */}
                        <div className="max-h-64 overflow-y-auto space-y-1.5">
                          {chunks.map((chunk, idx) => (
                            <button
                              key={chunk.id}
                              onClick={() => setSelectedChunk(chunk)}
                              className="w-full text-left bg-white border border-slate-200 rounded-lg p-2.5 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                                    #{idx}
                                  </span>
                                  {chunk.metadata.startPage && (
                                    <span className="text-[9px] text-slate-500">
                                      Pág {chunk.metadata.startPage}{chunk.metadata.endPage && chunk.metadata.endPage !== chunk.metadata.startPage ? `-${chunk.metadata.endPage}` : ''}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {chunk.metadata.tokenCount || 0} tokens
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-3 group-hover:text-slate-900">
                                {chunk.text}
                              </p>
                              <div className="mt-1.5 text-[9px] text-slate-400 flex items-center justify-between">
                                <span>Chars: {chunk.text.length.toLocaleString()}</span>
                                <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click para ver completo →
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                        <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-600">No hay chunks disponibles</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Re-indexa el documento para generar chunks
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">RAG no indexado</p>
                  <p className="text-[10px] text-slate-500 mb-3 max-w-xs">
                    Este documento aún no tiene indexación RAG. Re-indexa para habilitar búsqueda inteligente y ahorrar tokens.
                  </p>
                  <button
                    onClick={handleReExtract}
                    disabled={isReExtracting}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs font-semibold"
                  >
                    {isReExtracting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Indexando...
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-4 h-4" />
                        Indexar con RAG
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>

            {/* Original File Viewer - Below RAG section */}
            <section className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                Archivo Original
              </h3>
              
              {/* Check for GCS path (CLI uploads) OR blob in memory (webapp uploads) */}
              {(source.metadata as any)?.gcsPath || source.originalFile ? (
                <div className="space-y-2">
                  {/* File info */}
                  <div className="bg-white rounded-lg p-2 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Archivo:</span>
                      <span className="font-medium text-slate-800 truncate ml-2">
                        {source.metadata?.originalFileName || source.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tipo:</span>
                      <span className="font-medium text-slate-800">{getSourceTypeLabel(source.type)}</span>
                    </div>
                    
                    {/* GCS Path for CLI uploads */}
                    {(source.metadata as any)?.gcsPath && (
                      <>
                        <div className="flex justify-between items-start pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Origen:</span>
                          <span className="text-[10px] text-green-700 font-semibold">CLI Upload</span>
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="text-slate-500">Ubicación GCS:</span>
                          <a
                            href={`https://console.cloud.google.com/storage/browser/_details/${(source.metadata as any).gcsPath.replace('gs://', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[9px] text-blue-600 hover:text-blue-800 hover:underline break-all"
                            title="Click para abrir en Google Cloud Console"
                          >
                            {(source.metadata as any).gcsPath}
                          </a>
                        </div>
                        {source.metadata?.uploadedVia && (
                          <div className="flex justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Vía:</span>
                            <span className="font-medium text-slate-700">{source.metadata.uploadedVia}</span>
                          </div>
                        )}
                        {source.metadata?.cliVersion && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">CLI Version:</span>
                            <span className="font-mono text-slate-700">{source.metadata.cliVersion}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* View/Download buttons */}
                  {source.originalFile ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(source.originalFile!);
                          window.open(url, '_blank');
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver archivo
                      </button>
                      <a
                        href={URL.createObjectURL(source.originalFile)}
                        download={source.metadata?.originalFileName || source.name}
                        className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Descargar
                      </a>
                    </div>
                  ) : (source.metadata as any)?.gcsPath ? (
                    <div className="flex gap-2">
                      <a
                        href={`https://console.cloud.google.com/storage/browser/_details/${(source.metadata as any).gcsPath.replace('gs://', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver en GCS
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs text-amber-700 font-medium">Archivo no disponible</p>
                  <p className="text-[10px] text-amber-600 mt-1">
                    El archivo original no está en memoria ni en Cloud Storage
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="border-t border-slate-200 p-2.5 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-200 rounded transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      {/* Chunk Detail Modal */}
      {selectedChunk && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
          onClick={() => setSelectedChunk(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-white/20 rounded-lg">
                  <span className="text-sm font-bold">Chunk #{selectedChunk.chunkIndex}</span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{source.name}</p>
                  <p className="text-xs text-indigo-100">
                    {selectedChunk.metadata.tokenCount || 0} tokens · {selectedChunk.text.length.toLocaleString()} caracteres
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChunk(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Metadata */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Índice:</p>
                      <p className="font-semibold text-slate-800">#{selectedChunk.chunkIndex}</p>
                    </div>
                    {selectedChunk.metadata.startPage && (
                      <div>
                        <p className="text-slate-500">Páginas:</p>
                        <p className="font-semibold text-slate-800">
                          {selectedChunk.metadata.startPage}
                          {selectedChunk.metadata.endPage && selectedChunk.metadata.endPage !== selectedChunk.metadata.startPage 
                            ? ` - ${selectedChunk.metadata.endPage}` 
                            : ''}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500">Posición en texto:</p>
                      <p className="font-mono text-slate-800">
                        {selectedChunk.metadata.startChar?.toLocaleString() || 0} - {selectedChunk.metadata.endChar?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tokens:</p>
                      <p className="font-semibold text-slate-800">{selectedChunk.metadata.tokenCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Dimensiones embedding:</p>
                      <p className="font-mono text-slate-800">{selectedChunk.embedding?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Creado:</p>
                      <p className="text-slate-800">{formatDate(selectedChunk.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Full Text */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Texto Completo</h4>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedChunk.text}
                    </p>
                  </div>
                </div>
                
                {/* Embedding Preview */}
                {selectedChunk.embedding && selectedChunk.embedding.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">
                      Embedding Vector (Primeros 20 valores)
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="grid grid-cols-5 gap-2 text-[10px] font-mono">
                        {selectedChunk.embedding.slice(0, 20).map((val, idx) => (
                          <div key={idx} className="text-center">
                            <p className="text-slate-400">[{idx}]</p>
                            <p className="text-slate-700 font-semibold">{val.toFixed(4)}</p>
                          </div>
                        ))}
                      </div>
                      {selectedChunk.embedding.length > 20 && (
                        <p className="text-center text-[10px] text-slate-500 mt-2">
                          ... y {selectedChunk.embedding.length - 20} valores más
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedChunk(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

