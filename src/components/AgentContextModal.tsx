import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  ChevronRight, 
  Loader2, 
  Database,
  Grid,
  Download,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react';
import { useModalClose } from '../hooks/useModalClose';
import type { ContextSource } from '../types/context';

interface AgentContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  userId: string;
}

export default function AgentContextModal({
  isOpen,
  onClose,
  agentId,
  agentName,
  userId
}: AgentContextModalProps) {
  
  const [sources, setSources] = useState<ContextSource[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Selected document for detail view
  const [selectedDocument, setSelectedDocument] = useState<ContextSource | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 🔑 Hook para cerrar con ESC y click fuera
  const modalRef = useModalClose(isOpen, onClose, true, true, true);
  
  // Load first page when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFirstPage();
    } else {
      // Reset when closing
      setSources([]);
      setCurrentPage(0);
      setSelectedDocument(null);
    }
  }, [isOpen, agentId]);
  
  const loadFirstPage = async () => {
    setLoading(true);
    setSources([]);
    setCurrentPage(0);
    
    try {
      console.log('📥 Loading context sources for agent:', agentId);
      
      // Load ONLY metadata, no extractedData, no chunks
      const response = await fetch(`/api/agents/${agentId}/context-sources?page=0&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
        setTotalCount(data.total || 0);
        setHasMore(data.hasMore || false);
        
        console.log('✅ Loaded page 0:', data.sources?.length || 0, 'of', data.total || 0, 'sources');
      } else {
        console.error('Failed to load context sources');
      }
    } catch (error) {
      console.error('Error loading context sources:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadNextPage = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const response = await fetch(`/api/agents/${agentId}/context-sources?page=${nextPage}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setSources(prev => [...prev, ...(data.sources || [])]);
        setHasMore(data.hasMore || false);
        setCurrentPage(nextPage);
        
        console.log('✅ Loaded page', nextPage, ':', data.sources?.length || 0, 'more sources');
      }
    } catch (error) {
      console.error('Error loading next page:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  const loadDocumentDetails = async (sourceId: string) => {
    setLoadingDetails(true);
    
    try {
      console.log('📥 Loading full details for:', sourceId);
      
      // Load FULL source with extractedData
      const response = await fetch(`/api/context-sources/${sourceId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSelectedDocument(data.source);
        
        console.log('✅ Loaded full source:', data.source.name);
      }
    } catch (error) {
      console.error('Error loading document details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Configuración de Contexto
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {agentName} • {totalCount} documentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Agent Info */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">Agente ID:</p>
          <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{agentId}</p>
        </div>

        {/* Content - Split View */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Document List */}
          <div className="w-1/2 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Fuentes de Contexto
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {sources.length} loaded of {totalCount} total
                  </p>
                </div>
                <button
                  onClick={() => { /* TODO: Add source */ }}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1"
                >
                  + Agregar
                </button>
              </div>
            </div>
            
            {/* Document List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && sources.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  <span className="ml-3 text-sm text-gray-600">Cargando...</span>
                </div>
              )}
              
              {!loading && sources.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay fuentes de contexto</p>
                  <p className="text-xs mt-1">Haz click en "Agregar" para empezar</p>
                </div>
              )}
              
              {sources.length > 0 && (
                <div className="space-y-2">
                  {sources.map(source => (
                    <button
                      key={source.id}
                      onClick={() => loadDocumentDetails(source.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedDocument?.id === source.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {source.name}
                        </span>
                        {source.ragEnabled && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded-full">
                            RAG
                          </span>
                        )}
                      </div>
                      
                      {/* Compact metadata */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {source.metadata?.pageCount && (
                          <span>{source.metadata.pageCount}p</span>
                        )}
                        {source.ragMetadata?.chunkCount && (
                          <span>• {source.ragMetadata.chunkCount} chunks</span>
                        )}
                        {source.metadata?.tokensEstimate && (
                          <span>• ~{Math.round(source.metadata.tokensEstimate / 1000)}k tokens</span>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {/* Load More */}
                  {hasMore && (
                    <button
                      onClick={loadNextPage}
                      disabled={loadingMore}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Cargar 10 más
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Document Details (On-Demand) */}
          <div className="w-1/2 flex flex-col bg-gray-50">
            {!selectedDocument ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Grid className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecciona un documento para ver detalles</p>
                  <p className="text-xs mt-1">Click en cualquier documento de la lista</p>
                </div>
              </div>
            ) : loadingDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                <span className="ml-3 text-sm text-gray-600">Cargando detalles...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{selectedDocument.name}</h3>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Document Details */}
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Páginas:</p>
                        <p className="font-semibold">{selectedDocument.metadata?.pageCount || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Caracteres:</p>
                        <p className="font-semibold">{selectedDocument.metadata?.charactersExtracted?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tokens:</p>
                        <p className="font-semibold">{selectedDocument.metadata?.tokensEstimate?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">RAG:</p>
                        <p className="font-semibold">{selectedDocument.ragEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Extracted Text Preview */}
                  {selectedDocument.extractedData && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Extracted Text (Preview)</h4>
                      <div className="text-xs text-gray-700 max-h-64 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-200 font-mono whitespace-pre-wrap">
                        {selectedDocument.extractedData.substring(0, 1000)}
                        {selectedDocument.extractedData.length > 1000 && '\n\n... (truncated)'}
                      </div>
                    </div>
                  )}
                  
                  {/* RAG Chunks Info (Don't load chunks automatically) */}
                  {selectedDocument.ragEnabled && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">RAG Information</h4>
                      <p className="text-sm text-gray-700">
                        Chunks: {selectedDocument.ragMetadata?.chunkCount || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Click "Ver Detalles" en Context Management para ver chunks completos
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // TODO: Open full source settings modal
                        console.log('Open settings for:', selectedDocument.id);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Ver Detalles Completos
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('¿Quitar esta fuente del agente?')) {
                          // TODO: Implement remove
                          console.log('Remove:', selectedDocument.id);
                        }
                      }}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {totalCount} total documentos asignados
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

