import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Database, 
  Upload, 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User as UserIcon,
  MessageSquare,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react';
import type { ContextSource } from '../types/context';

interface ContextManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  conversations: Array<{ id: string; title: string }>;
  onSourcesUpdated: () => void;
}

interface EnrichedContextSource extends ContextSource {
  uploaderEmail?: string;
  assignedAgents?: Array<{ id: string; title: string }>;
}

interface UploadQueueItem {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'processing' | 'complete' | 'failed';
  progress: number;
  error?: string;
  sourceId?: string;
}

export default function ContextManagementDashboard({
  isOpen,
  onClose,
  userId,
  userEmail,
  conversations,
  onSourcesUpdated
}: ContextManagementDashboardProps) {
  const [sources, setSources] = useState<EnrichedContextSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EnrichedContextSource | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load all context sources
  useEffect(() => {
    if (isOpen) {
      loadAllSources();
    }
  }, [isOpen]);

  const loadAllSources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/context-sources/all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
        console.log('✅ Loaded', data.sources?.length || 0, 'context sources');
      } else {
        console.error('Failed to load context sources');
      }
    } catch (error) {
      console.error('Error loading context sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = Array.from(files).map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'queued',
      progress: 0,
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    processQueue(newItems);
  };

  const processQueue = async (items: UploadQueueItem[]) => {
    setIsUploading(true);

    for (const item of items) {
      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'uploading', progress: 10 } : i
        ));

        // Create FormData
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('userId', userId);
        formData.append('name', item.file.name);
        formData.append('model', 'gemini-2.5-flash'); // Default model
        // No assignedToAgents - will be assigned later

        // Upload
        const uploadResponse = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadResponse.json();
        
        // Update to processing
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'processing', progress: 50 } : i
        ));

        // Poll for completion (extraction happens async)
        await pollForCompletion(item.id, uploadData.sourceId);

      } catch (error) {
        console.error('Upload failed:', item.file.name, error);
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : i
        ));
      }
    }

    setIsUploading(false);
    await loadAllSources(); // Reload sources
  };

  const pollForCompletion = async (queueId: string, sourceId: string, attempts = 0): Promise<void> => {
    if (attempts > 30) { // Max 30 attempts (30 seconds)
      setUploadQueue(prev => prev.map(i => 
        i.id === queueId ? { ...i, status: 'failed', error: 'Processing timeout' } : i
      ));
      return;
    }

    try {
      const response = await fetch(`/api/context-sources/${sourceId}`);
      if (response.ok) {
        const source = await response.json();
        
        if (source.status === 'active' && source.extractedData) {
          // Complete!
          setUploadQueue(prev => prev.map(i => 
            i.id === queueId ? { ...i, status: 'complete', progress: 100, sourceId } : i
          ));
          return;
        } else if (source.status === 'error') {
          setUploadQueue(prev => prev.map(i => 
            i.id === queueId ? { ...i, status: 'failed', error: source.error?.message || 'Processing error' } : i
          ));
          return;
        }
      }

      // Still processing, poll again
      setTimeout(() => pollForCompletion(queueId, sourceId, attempts + 1), 1000);
      
      // Update progress
      const progress = Math.min(50 + attempts * 1.5, 95);
      setUploadQueue(prev => prev.map(i => 
        i.id === queueId ? { ...i, progress } : i
      ));

    } catch (error) {
      console.error('Polling error:', error);
      setTimeout(() => pollForCompletion(queueId, sourceId, attempts + 1), 1000);
    }
  };

  const handleBulkAssign = async (sourceId: string, agentIds: string[]) => {
    try {
      const response = await fetch('/api/context-sources/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, agentIds }),
      });

      if (response.ok) {
        console.log('✅ Bulk assignment successful');
        await loadAllSources();
        onSourcesUpdated();
      } else {
        console.error('Bulk assignment failed');
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
    }
  };

  const handleReupload = (queueItemId: string) => {
    const item = uploadQueue.find(i => i.id === queueItemId);
    if (item) {
      const newItem: UploadQueueItem = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: item.file,
        status: 'queued',
        progress: 0,
      };
      setUploadQueue(prev => [...prev.filter(i => i.id !== queueItemId), newItem]);
      processQueue([newItem]);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('¿Eliminar esta fuente de contexto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/context-sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAllSources();
        onSourcesUpdated();
        if (selectedSource?.id === sourceId) {
          setSelectedSource(null);
        }
      }
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  if (!isOpen) return null;

  // Only allow alec@getaifactory.com
  if (userEmail !== 'alec@getaifactory.com') {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Context Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Sources List */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col">
            {/* Upload Zone */}
            <div className="p-4 border-b border-slate-200">
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Drag & drop PDFs here or click to upload
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Multiple files supported • Not assigned to any agent initially
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Upload Queue */}
            {uploadQueue.length > 0 && (
              <div className="p-4 border-b border-slate-200 max-h-48 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Upload Queue ({uploadQueue.length})</h3>
                <div className="space-y-2">
                  {uploadQueue.map(item => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                          {(item.status === 'uploading' || item.status === 'processing') && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
                          {item.status === 'queued' && <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                          <span className="text-xs font-medium text-slate-800 truncate">{item.file.name}</span>
                        </div>
                        {item.status === 'failed' && (
                          <button
                            onClick={() => handleReupload(item.id)}
                            className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 flex-shrink-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            item.status === 'complete' ? 'bg-green-600' :
                            item.status === 'failed' ? 'bg-red-600' :
                            'bg-blue-600'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      {item.status === 'failed' && item.error && (
                        <p className="text-xs text-red-600 mt-1">{item.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  All Context Sources ({sources.length})
                </h3>
                <button
                  onClick={loadAllSources}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}

              {!loading && sources.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No context sources found</p>
                </div>
              )}

              {!loading && sources.length > 0 && (
                <div className="space-y-3">
                  {sources.map(source => (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSource(source)}
                      className={`w-full text-left border rounded-lg p-4 transition-all ${
                        selectedSource?.id === source.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {source.name}
                          </span>
                          {source.metadata?.validated && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full flex-shrink-0">
                              ✓ Validado
                            </span>
                          )}
                        </div>
                        {source.status === 'active' && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                        {source.status === 'error' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        {source.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3 h-3" />
                          <span>Uploaded by: {source.uploaderEmail || source.userId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3 h-3" />
                          <span>
                            {source.assignedAgents?.length || 0} agent(s) using this
                          </span>
                        </div>
                        {source.metadata?.pageCount && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            <span>{source.metadata.pageCount} pages</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {source.extractedData?.substring(0, 120)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Source Details & Agent Assignment */}
          <div className="w-1/2 flex flex-col">
            {!selectedSource ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a source to view details</p>
                </div>
              </div>
            ) : (
              <>
                {/* Source Details Header */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{selectedSource.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          selectedSource.status === 'active' ? 'bg-green-100 text-green-700' :
                          selectedSource.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedSource.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          Uploaded by {selectedSource.uploaderEmail || selectedSource.userId}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSource(selectedSource.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Metadata */}
                  {selectedSource.metadata && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {selectedSource.metadata.pageCount && (
                        <div>
                          <span className="text-slate-500">Pages:</span>
                          <span className="ml-2 font-medium">{selectedSource.metadata.pageCount}</span>
                        </div>
                      )}
                      {selectedSource.metadata.model && (
                        <div>
                          <span className="text-slate-500">Model:</span>
                          <span className="ml-2 font-medium">{selectedSource.metadata.model}</span>
                        </div>
                      )}
                      {selectedSource.metadata.charactersExtracted && (
                        <div>
                          <span className="text-slate-500">Characters:</span>
                          <span className="ml-2 font-medium">{selectedSource.metadata.charactersExtracted.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedSource.metadata.tokensEstimate && (
                        <div>
                          <span className="text-slate-500">Tokens:</span>
                          <span className="ml-2 font-medium">{selectedSource.metadata.tokensEstimate.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Agent Assignment */}
                <div className="p-6 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Assign to Agents</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {conversations.map(agent => {
                      const isAssigned = selectedSource.assignedToAgents?.some(a => a.id === agent.id) || 
                                        selectedSource.assignedToAgents?.includes(agent.id as any);
                      
                      return (
                        <label
                          key={agent.id}
                          className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={async (e) => {
                              const currentAgents = selectedSource.assignedToAgents || [];
                              const currentIds = currentAgents.map(a => typeof a === 'string' ? a : a.id);
                              const newIds = e.target.checked
                                ? [...currentIds, agent.id]
                                : currentIds.filter(id => id !== agent.id);
                              
                              await handleBulkAssign(selectedSource.id, newIds);
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <MessageSquare className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                            {agent.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Extracted Data Preview */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Extracted Data</h4>
                    {selectedSource.extractedData && (
                      <button
                        onClick={() => {
                          const blob = new Blob([selectedSource.extractedData!], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedSource.name}-extracted.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
                  
                  {selectedSource.extractedData ? (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                        {selectedSource.extractedData}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">No extracted data available</p>
                      {selectedSource.status === 'processing' && (
                        <p className="text-xs mt-2">Processing in progress...</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="text-sm text-slate-600">
            {sources.length} total sources • {uploadQueue.filter(i => i.status === 'complete').length} uploads completed
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
