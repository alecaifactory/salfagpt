import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Grid,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  DollarSign,
  Database,
  Eye,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  AlertCircle,
  Info
} from 'lucide-react';
import type { PipelineLog, ContextSource } from '../types/context';

interface PipelineDetailViewProps {
  source: ContextSource;
  userId?: string;
  onClose?: () => void;
}

interface DocumentChunk {
  id: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: {
    startChar: number;
    endChar: number;
    tokenCount: number;
    startPage?: number;
    endPage?: number;
  };
}

export default function PipelineDetailView({ source, userId }: PipelineDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'extracted' | 'chunks'>('pipeline');
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<string[]>(['extract', 'chunk', 'embed']);
  const [viewingChunk, setViewingChunk] = useState<DocumentChunk | null>(null);
  
  // NEW: On-demand loading of extracted data
  const [extractedData, setExtractedData] = useState<string | null>(source.extractedData || null);
  const [loadingExtractedData, setLoadingExtractedData] = useState(false);

  // 🔧 FIX: Clear chunks when source changes
  useEffect(() => {
    console.log('🔄 Source changed, clearing chunks for:', source.id);
    setChunks([]);
    setActiveTab('pipeline'); // Reset to pipeline tab
  }, [source.id]);
  
  // Load extracted data when "Extracted Text" tab is opened
  useEffect(() => {
    if (activeTab === 'extracted' && !extractedData && !loadingExtractedData) {
      loadExtractedData();
    }
  }, [activeTab]);

  const loadExtractedData = async () => {
    console.log('📄 Loading extracted data for source:', source.id);
    setLoadingExtractedData(true);
    
    try {
      const response = await fetch(`/api/context-sources/${source.id}/extracted-data`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Extracted data loaded:', data.charactersExtracted, 'characters');
        setExtractedData(data.extractedData || null);
      } else {
        console.error('❌ Failed to load extracted data');
        setExtractedData(null);
      }
    } catch (error) {
      console.error('❌ Error loading extracted data:', error);
      setExtractedData(null);
    } finally {
      setLoadingExtractedData(false);
    }
  };

  const loadChunks = async () => {
    console.log('🚀 loadChunks called');
    console.log('   userId:', userId);
    console.log('   source.id:', source.id);
    console.log('   source.ragEnabled:', source.ragEnabled);
    
    if (!userId) {
      console.error('❌ userId is required to load chunks');
      alert('Error: userId no disponible. Recarga la página.');
      return;
    }
    
    console.log('📊 Loading chunks for source:', source.id, 'User:', userId);
    console.log('   Source name:', source.name);
    console.log('   RAG enabled:', source.ragEnabled);
    console.log('   RAG metadata:', source.ragMetadata);
    
    setLoadingChunks(true);
    try {
      const url = `/api/context-sources/${source.id}/chunks?userId=${userId}`;
      console.log('🔍 Fetching chunks from:', url);
      
      const response = await fetch(url, {
        credentials: 'include' // Include cookies for authentication
      });
      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Chunks loaded:', data.chunks?.length || 0);
        console.log('   Stats:', data.stats);
        console.log('   Data:', data);
        setChunks(data.chunks || []);
        
        if (!data.chunks || data.chunks.length === 0) {
          console.warn('⚠️ No chunks returned from API');
          alert('No se encontraron chunks para este documento. Verifica que RAG esté habilitado correctamente.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to load chunks:', errorData);
        alert(`Error cargando chunks: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error loading chunks:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingChunks(false);
    }
  };

  const pipelineSteps = [
    { key: 'upload', label: 'Upload to Cloud Storage', icon: Upload, color: 'blue' },
    { key: 'extract', label: 'Extract with Gemini AI', icon: FileText, color: 'purple' },
    { key: 'chunk', label: 'Chunk for RAG', icon: Grid, color: 'indigo' },
    { key: 'embed', label: 'Generate Embeddings', icon: Zap, color: 'yellow' },
    { key: 'complete', label: 'Ready for Use', icon: CheckCircle, color: 'green' },
  ];

  const getStepLog = (stepKey: string): PipelineLog | undefined => {
    return source.pipelineLogs?.find(log => log.step === stepKey);
  };

  const getStepStatus = (stepKey: string): 'pending' | 'in_progress' | 'success' | 'error' => {
    const log = getStepLog(stepKey);
    return log?.status || 'pending';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const toggleStepExpanded = (stepKey: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepKey) 
        ? prev.filter(k => k !== stepKey)
        : [...prev, stepKey]
    );
  };

  const downloadExtractedText = () => {
    if (!extractedData) return;
    
    const blob = new Blob([extractedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source.name}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPipelineTime = source.pipelineLogs?.reduce((acc, log) => acc + (log.duration || 0), 0) || 0;
  const totalCost = source.pipelineLogs?.reduce((acc, log) => acc + (log.details?.cost || 0), 0) || 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{source.name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {source.metadata?.originalFileSize ? 
                  `${(source.metadata.originalFileSize / 1024 / 1024).toFixed(2)} MB` : 
                  'Size unknown'}
              </span>
              {source.metadata?.pageCount && (
                <span>{source.metadata.pageCount} páginas</span>
              )}
              {source.ragEnabled && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                  RAG Enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'pipeline'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Database className="w-4 h-4" />
              Pipeline Details
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('extracted')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'extracted'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Extracted Text
            </div>
          </button>
          
          <button
            onClick={() => {
              console.log('🔘 RAG Chunks tab clicked');
              console.log('   Source ID:', source.id);
              console.log('   RAG enabled:', source.ragEnabled);
              console.log('   Current chunks loaded:', chunks.length);
              
              setActiveTab('chunks');
              
              // 🔧 FIX: Always reload chunks when tab is clicked (on-demand)
              if (source.ragEnabled && userId) {
                console.log('✅ Loading chunks on-demand for source:', source.id);
                loadChunks();
              } else {
                console.warn('⚠️ Cannot load chunks:', {
                  ragEnabled: source.ragEnabled,
                  userId: !!userId
                });
              }
            }}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'chunks'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            disabled={!source.ragEnabled}
          >
            <div className="flex items-center justify-center gap-2">
              <Grid className="w-4 h-4" />
              RAG Chunks {source.ragMetadata?.chunkCount ? `(${source.ragMetadata.chunkCount})` : ''}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="p-6 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Tiempo Total</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {formatDuration(totalPipelineTime)}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Costo Total</span>
                </div>
                <p className="text-lg font-bold text-green-900">
                  ${totalCost.toFixed(6)}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Estado</span>
                </div>
                <p className="text-sm font-bold text-purple-900">
                  {source.status === 'active' ? '✅ Activo' : 
                   source.status === 'processing' ? '🔄 Procesando' : 
                   source.status === 'error' ? '❌ Error' : 'Desactivado'}
                </p>
              </div>
            </div>

            {/* Pipeline Steps */}
            <div className="space-y-3 mt-6">
              {pipelineSteps.map((step, index) => {
                const log = getStepLog(step.key);
                const status = getStepStatus(step.key);
                const StepIcon = step.icon;
                const isExpanded = expandedSteps.includes(step.key);

                return (
                  <div key={step.key} className="relative">
                    {/* Connecting line */}
                    {index < pipelineSteps.length - 1 && (
                      <div className={`absolute left-[26px] top-16 w-0.5 h-full ${
                        status === 'success' ? 'bg-green-500' :
                        status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`} style={{ height: 'calc(100% + 12px)' }} />
                    )}

                    {/* Step card */}
                    <div className={`border-2 rounded-lg transition-all ${
                      status === 'success' ? 'border-green-500 bg-green-50' :
                      status === 'error' ? 'border-red-500 bg-red-50' :
                      status === 'in_progress' ? 'border-blue-500 bg-blue-50 animate-pulse' :
                      'border-gray-300 bg-gray-50'
                    }`}>
                      {/* Step header - clickable */}
                      <button
                        onClick={() => toggleStepExpanded(step.key)}
                        className="w-full p-4 flex items-start gap-3 hover:bg-white/50 transition-colors"
                      >
                        {/* Status indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(status)}
                        </div>

                        {/* Step info */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <StepIcon className={`w-4 h-4 text-${step.color}-600`} />
                              <h5 className="text-sm font-semibold text-gray-900">{step.label}</h5>
                            </div>
                            <div className="flex items-center gap-2">
                              {log?.duration && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDuration(log.duration)}
                                </div>
                              )}
                              {isExpanded ? 
                                <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              }
                            </div>
                          </div>

                          {/* Status message */}
                          {log && (
                            <p className="text-xs text-gray-700">{log.message}</p>
                          )}
                        </div>
                      </button>

                      {/* Expandable details */}
                      {isExpanded && log && (
                        <div className="px-4 pb-4 border-t border-gray-200/50">
                        
                          {/* Upload Step Details */}
                          {step.key === 'upload' && log.details && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                {log.details.fileSize && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Tamaño del Archivo</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {(log.details.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                )}
                                {log.details.storagePath && (
                                  <div className="p-3 bg-white rounded border border-gray-200 col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">Cloud Storage Path</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-mono text-gray-700 truncate flex-1">
                                        {log.details.storagePath}
                                      </p>
                                      {source.originalFileUrl && (
                                        <a
                                          href={source.originalFileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex-shrink-0 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                          title="Ver archivo original"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <div className="flex items-center gap-2 text-xs text-green-800">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="font-medium">
                                    Archivo subido correctamente a Google Cloud Storage
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Extract Step Details */}
                          {step.key === 'extract' && log.details && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                {log.details.model && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Modelo IA</p>
                                    <p className={`text-sm font-bold ${
                                      log.details.model === 'gemini-2.5-pro' ? 'text-purple-700' : 'text-green-700'
                                    }`}>
                                      {log.details.model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
                                    </p>
                                  </div>
                                )}
                                
                                {log.details.charactersExtracted && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Caracteres Extraídos</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {log.details.charactersExtracted.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                
                                {log.details.inputTokens && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Input Tokens</p>
                                    <p className="text-sm font-mono font-bold text-gray-900">
                                      {log.details.inputTokens.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                
                                {log.details.outputTokens && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Output Tokens</p>
                                    <p className="text-sm font-mono font-bold text-gray-900">
                                      {log.details.outputTokens.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                                
                                {log.details.cost && (
                                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded border border-green-200 col-span-2">
                                    <p className="text-xs text-green-700 mb-1">Costo de Extracción</p>
                                    <p className="text-lg font-bold text-green-900">
                                      ${log.details.cost.toFixed(6)}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                <div className="flex items-start gap-2 text-xs text-purple-800">
                                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium mb-1">Texto extraído con IA</p>
                                    <p className="text-purple-700">
                                      Gemini procesó el PDF completo, extrayendo texto, tablas e información estructurada.
                                      Haz clic en la pestaña "Extracted Text" para ver el contenido completo.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Chunk Step Details */}
                          {step.key === 'chunk' && log.details && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                {log.details.chunkCount && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Total Chunks</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {log.details.chunkCount}
                                    </p>
                                  </div>
                                )}
                                
                                {log.details.avgChunkSize && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Tamaño Promedio</p>
                                    <p className="text-sm font-mono font-bold text-gray-900">
                                      {log.details.avgChunkSize} tokens
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
                                <div className="flex items-start gap-2 text-xs text-indigo-800">
                                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium mb-1">Documento fragmentado para RAG</p>
                                    <p className="text-indigo-700">
                                      El texto extraído fue dividido en {log.details.chunkCount} fragmentos (~500 tokens cada uno) 
                                      para búsqueda semántica eficiente.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Embed Step Details */}
                          {step.key === 'embed' && log.details && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                {log.details.embeddingCount && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Embeddings Generados</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {log.details.embeddingCount}
                                    </p>
                                  </div>
                                )}
                                
                                {log.details.embeddingModel && (
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Modelo Embedding</p>
                                    <p className="text-xs font-mono font-bold text-gray-900">
                                      {log.details.embeddingModel}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="flex items-start gap-2 text-xs text-yellow-800">
                                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium mb-1">Vectores semánticos generados</p>
                                    <p className="text-yellow-700">
                                      Cada chunk fue convertido a un vector de 768 dimensiones usando el modelo de embeddings de Google.
                                      Estos permiten búsqueda semántica inteligente.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Complete Step */}
                          {step.key === 'complete' && status === 'success' && (
                            <div className="mt-3">
                              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <h5 className="text-sm font-bold text-green-900">¡Documento Listo!</h5>
                                </div>
                                <p className="text-xs text-green-800 leading-relaxed">
                                  El documento ha sido procesado completamente y está disponible para usar en tus agentes.
                                  Puedes asignarlo a agentes específicos y elegir entre usar el texto completo o búsqueda RAG.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Error details */}
                          {status === 'error' && log?.details?.error && (
                            <div className="mt-3 p-4 bg-red-100 border border-red-300 rounded">
                              <p className="text-xs text-red-900 font-semibold mb-2">{log.details.error}</p>
                              {log.details.suggestions && log.details.suggestions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-800 font-medium mb-1">Sugerencias:</p>
                                  <ul className="space-y-1">
                                    {log.details.suggestions.map((suggestion, idx) => (
                                      <li key={idx} className="text-xs text-red-700 flex items-start gap-1">
                                        <span className="text-red-500">•</span>
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extracted Text Tab */}
        {activeTab === 'extracted' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Texto Extraído</h4>
                  <p className="text-xs text-gray-600">
                    {loadingExtractedData ? 'Cargando...' :
                     extractedData ? 
                      `${extractedData.length.toLocaleString()} caracteres` : 
                      'No disponible'}
                  </p>
                </div>
              </div>
              
              {extractedData && !loadingExtractedData && (
                <button
                  onClick={downloadExtractedText}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Descargar .txt
                </button>
              )}
            </div>

            {loadingExtractedData ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Cargando texto extraído...</p>
              </div>
            ) : extractedData ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {extractedData}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No hay texto extraído disponible</p>
              </div>
            )}
          </div>
        )}

        {/* RAG Chunks Tab */}
        {activeTab === 'chunks' && (
          <div className="p-6">
            {!source.ragEnabled ? (
              <div className="text-center py-12">
                <Grid className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">RAG no está habilitado para este documento</p>
                <p className="text-xs text-gray-500">
                  Habilita RAG para fragmentar el documento y generar embeddings
                </p>
              </div>
            ) : loadingChunks ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Cargando chunks...</p>
              </div>
            ) : chunks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">No hay chunks disponibles</p>
                <button
                  onClick={loadChunks}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Reintentar Carga
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Total Chunks</p>
                    <p className="text-2xl font-bold text-blue-900">{chunks.length}</p>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-700 mb-1">Tamaño Promedio</p>
                    <p className="text-2xl font-bold text-indigo-900">
                      {Math.round(chunks.reduce((sum, c) => sum + c.metadata.tokenCount, 0) / chunks.length)} 
                      <span className="text-sm ml-1">tokens</span>
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 mb-1">Dimensiones</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {chunks[0]?.embedding?.length || 768}
                    </p>
                  </div>
                </div>

                {/* Chunks list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-semibold text-gray-900">Document Chunks</h5>
                    <p className="text-xs text-gray-500">Click para ver detalles</p>
                  </div>
                  
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {chunks.map((chunk) => (
                      <button
                        key={chunk.id}
                        onClick={() => setViewingChunk(chunk)}
                        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-semibold text-gray-500">
                                Chunk #{chunk.chunkIndex + 1}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600">
                                {chunk.metadata.tokenCount} tokens
                              </span>
                              {chunk.metadata.startPage && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-600">
                                    Pág. {chunk.metadata.startPage}
                                    {chunk.metadata.endPage && chunk.metadata.endPage !== chunk.metadata.startPage && 
                                      `-${chunk.metadata.endPage}`}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-2">
                              {chunk.text}
                            </p>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chunk Detail Modal */}
      {viewingChunk && (() => {
        const chunk = viewingChunk; // Type narrowing
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Chunk #{chunk.chunkIndex + 1}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                    <span>{chunk.metadata.tokenCount} tokens</span>
                    <span>•</span>
                    <span>Chars {chunk.metadata.startChar}-{chunk.metadata.endChar}</span>
                    {chunk.metadata.startPage && (
                      <>
                        <span>•</span>
                        <span>Pág. {chunk.metadata.startPage}
                          {chunk.metadata.endPage && chunk.metadata.endPage !== chunk.metadata.startPage && 
                            `-${chunk.metadata.endPage}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingChunk(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Chunk Text */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Texto del Chunk</h5>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                      {chunk.text}
                    </pre>
                  </div>
                </div>

                {/* Embedding Preview */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">
                    Embedding Vector ({chunk.embedding.length} dimensiones)
                  </h5>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {chunk.embedding.slice(0, 100).map((val, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-mono text-gray-600 bg-white px-1 py-0.5 rounded border border-gray-200"
                        >
                          {val.toFixed(4)}
                        </span>
                      ))}
                      {chunk.embedding.length > 100 && (
                        <span className="text-xs text-gray-500 italic">
                          ... y {chunk.embedding.length - 100} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setViewingChunk(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

