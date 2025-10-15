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
  AlertCircle,
  Tag
} from 'lucide-react';
import type { ContextSource } from '../types/context';
import { useModalClose } from '../hooks/useModalClose';

interface ContextManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  conversations: Array<{ id: string; title: string }>;
  onSourcesUpdated: () => void;
}

interface EnrichedContextSource extends ContextSource {
  userId?: string; // Add userId field
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
  tags?: string[]; // Tags for this upload
}

export default function ContextManagementDashboard({
  isOpen,
  onClose,
  userId,
  userEmail,
  conversations,
  onSourcesUpdated
}: ContextManagementDashboardProps) {
  
  // 🔑 Hook para cerrar con ESC
  useModalClose(isOpen, onClose);
  const [sources, setSources] = useState<EnrichedContextSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Agent assignment state
  const [pendingAgentIds, setPendingAgentIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Tag management state
  const [uploadTags, setUploadTags] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Upload staging state
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [stagedTags, setStagedTags] = useState<string[]>([]);
  const [showUploadStaging, setShowUploadStaging] = useState(false);
  
  // Multi-select state for sources
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const selectedSource = selectedSourceIds.length === 1 
    ? sources.find(s => s.id === selectedSourceIds[0]) || null
    : null;

  // Load all context sources
  useEffect(() => {
    if (isOpen) {
      loadAllSources();
    }
  }, [isOpen]);

  // Initialize pending assignments when sources are selected
  useEffect(() => {
    if (selectedSourceIds.length === 1) {
      // Single source - show its current assignments
      const source = sources.find(s => s.id === selectedSourceIds[0]);
      if (source) {
        const currentAgents = source.assignedToAgents || [];
        const currentIds = currentAgents.map((a: any) => typeof a === 'string' ? a : a.id);
        setPendingAgentIds(currentIds);
      }
    } else if (selectedSourceIds.length > 1) {
      // Multiple sources - find common agents
      const allSources = sources.filter(s => selectedSourceIds.includes(s.id));
      const agentSets = allSources.map(s => {
        const agents = s.assignedToAgents || [];
        return agents.map((a: any) => typeof a === 'string' ? a : a.id);
      });
      
      // Find agents common to ALL selected sources
      if (agentSets.length > 0) {
        const commonAgents = agentSets[0].filter(agentId =>
          agentSets.every(set => set.includes(agentId))
        );
        setPendingAgentIds(commonAgents);
      }
    } else {
      setPendingAgentIds([]);
    }
  }, [selectedSourceIds, sources]);

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
        
        // Extract all unique tags
        const tagsSet = new Set<string>();
        data.sources?.forEach((source: ContextSource) => {
          source.labels?.forEach(tag => tagsSet.add(tag));
        });
        setAllTags(Array.from(tagsSet).sort());
        
        console.log('✅ Loaded', data.sources?.length || 0, 'context sources');
        console.log('✅ Found', tagsSet.size, 'unique tags');
        
        // Debug: Log assignment counts
        const sourcesWithAssignments = data.sources?.filter((s: any) => 
          (s.assignedToAgents?.length || 0) > 0
        );
        console.log('📊 Sources with assignments:', sourcesWithAssignments?.length || 0);
        if (sourcesWithAssignments?.length > 0) {
          console.log('📋 Sample assignments:', {
            source: sourcesWithAssignments[0].name,
            assignedToAgents: sourcesWithAssignments[0].assignedToAgents,
            assignedAgents: sourcesWithAssignments[0].assignedAgents,
          });
        }
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

    // Stage files for review and tagging
    setStagedFiles(Array.from(files));
    setShowUploadStaging(true);
    setStagedTags([]);
    setUploadTags(''); // Clear input for fresh tags
  };

  const checkForDuplicates = (fileName: string): ContextSource | null => {
    return sources.find(s => s.name === fileName) || null;
  };

  const handleSubmitUpload = async () => {
    if (stagedFiles.length === 0) return;

    // Parse tags from input
    const tags = uploadTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Check for duplicates
    const duplicates: Array<{ file: File; existing: ContextSource }> = [];
    const newFiles: File[] = [];

    for (const file of stagedFiles) {
      const existing = checkForDuplicates(file.name);
      if (existing) {
        duplicates.push({ file, existing });
      } else {
        newFiles.push(file);
      }
    }

    // Handle duplicates if found
    if (duplicates.length > 0) {
      const action = await handleDuplicates(duplicates);
      
      if (action === 'cancel') {
        return; // User cancelled
      } else if (action === 'replace') {
        // Delete existing sources and upload with same names
        for (const dup of duplicates) {
          await deleteSourceInternal(dup.existing.id);
          newFiles.push(dup.file);
        }
      } else if (action === 'keep-both') {
        // Rename new files with version suffix
        const renamedFiles = duplicates.map(dup => {
          const baseName = dup.file.name.replace(/\.pdf$/i, '');
          const version = getNextVersion(baseName);
          const newName = `${baseName}-v${version}.pdf`;
          const renamedFile = new File([dup.file], newName, { type: dup.file.type });
          return renamedFile;
        });
        newFiles.push(...renamedFiles);
      }
    }

    // Create upload queue items
    const newItems: UploadQueueItem[] = newFiles.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'queued',
      progress: 0,
      tags: tags.length > 0 ? tags : undefined,
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    processQueue(newItems);
    
    // Close staging
    setShowUploadStaging(false);
    setStagedFiles([]);
    setStagedTags([]);
    setUploadTags('');
  };

  const handleDuplicates = async (duplicates: Array<{ file: File; existing: ContextSource }>): Promise<'replace' | 'keep-both' | 'cancel'> => {
    const fileNames = duplicates.map(d => d.file.name).join(', ');
    const message = `The following file(s) already exist:\n\n${fileNames}\n\nWhat would you like to do?`;
    
    // Create custom dialog
    const choice = await new Promise<string>((resolve) => {
      const dialog = document.createElement('div');
      dialog.innerHTML = `
        <div class="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-3">Duplicate Files Detected</h3>
            <p class="text-sm text-gray-700 mb-4 whitespace-pre-wrap">${message}</p>
            <div class="space-y-2">
              <button data-action="replace" class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
                Replace existing files
              </button>
              <button data-action="keep-both" class="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors">
                Keep both (add -v1, -v2, etc.)
              </button>
              <button data-action="cancel" class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Cancel upload
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      dialog.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');
        if (action) {
          document.body.removeChild(dialog);
          resolve(action);
        }
      });
    });
    
    return choice as 'replace' | 'keep-both' | 'cancel';
  };

  const getNextVersion = (baseName: string): number => {
    const existingVersions = sources
      .filter(s => s.name.startsWith(baseName))
      .map(s => {
        const match = s.name.match(/-v(\d+)\.pdf$/);
        return match ? parseInt(match[1]) : 0;
      });
    
    return existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
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
        formData.append('model', 'gemini-2.5-pro'); // Default to Pro for quality
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
        
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Extraction failed');
        }
        
        // Update to processing
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'processing', progress: 70 } : i
        ));

        // Create source in Firestore with extracted data
        const createResponse = await fetch('/api/context-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: item.file.name,
            type: 'pdf', // Determine from file extension
            enabled: true,
            status: 'active',
            extractedData: uploadData.extractedText || '',
            assignedToAgents: [], // Not assigned to any agent initially (admin upload)
            labels: item.tags || [], // Add tags
            metadata: uploadData.metadata || {}
          })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to save context source');
        }

        const savedData = await createResponse.json();
        const sourceId = savedData.source?.id;

        // Mark as complete
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'complete', progress: 100, sourceId } : i
        ));

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

  // DEPRECATED: No longer needed - extraction now happens synchronously
  // Kept for reference but not used anymore
  /*
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
  */

  const handleBulkAssign = async (sourceId: string, agentIds: string[]) => {
    setIsAssigning(true);
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
        alert('Error al asignar a agentes');
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      alert('Error al asignar a agentes');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignClick = async () => {
    if (selectedSourceIds.length === 0) return;
    
    setIsAssigning(true);
    try {
      // Assign all selected sources to pending agents
      for (const sourceId of selectedSourceIds) {
        await handleBulkAssign(sourceId, pendingAgentIds);
      }
      
      if (selectedSourceIds.length > 1) {
        alert(`✅ Assigned ${selectedSourceIds.length} sources to ${pendingAgentIds.length} agent(s)`);
      }
    } catch (error) {
      console.error('Bulk assign failed:', error);
      alert('Error during bulk assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setPendingAgentIds(prev => 
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const selectAllFilteredSources = () => {
    const filteredIds = filteredSources.map(s => s.id);
    setSelectedSourceIds(filteredIds);
  };

  const clearSourceSelection = () => {
    setSelectedSourceIds([]);
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const bulkSelectByTags = () => {
    if (selectedTags.length === 0) return;
    
    // Find all sources that have ANY of the selected tags
    const sourcesWithTags = sources.filter(source => 
      source.labels?.some(label => selectedTags.includes(label))
    );
    
    // Get all agent IDs from these sources
    const agentIds = new Set<string>();
    sourcesWithTags.forEach(source => {
      source.assignedToAgents?.forEach((a: any) => {
        const id = typeof a === 'string' ? a : a.id;
        agentIds.add(id);
      });
    });
    
    setPendingAgentIds(Array.from(agentIds));
  };

  // Filter sources by selected tags
  const filteredSources = selectedTags.length > 0
    ? sources.filter(source => 
        source.labels?.some(label => selectedTags.includes(label))
      )
    : sources;

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

  const deleteSourceInternal = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/context-sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAllSources();
        onSourcesUpdated();
        // Remove from selection if selected
        setSelectedSourceIds(prev => prev.filter(id => id !== sourceId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting source:', error);
      return false;
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('¿Eliminar esta fuente de contexto? Esta acción no se puede deshacer.')) {
      return;
    }

    await deleteSourceInternal(sourceId);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900">Context Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Sources List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Upload Zone */}
            <div className="p-4 border-b border-gray-200">
              {!showUploadStaging ? (
                // File selection zone
                <div>
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">
                      Drag & drop PDFs here or click to upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Multiple files supported • Review before upload
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
              ) : (
                // Upload staging area
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Review Upload ({stagedFiles.length} file{stagedFiles.length !== 1 ? 's' : ''})
                    </h4>
                    <button
                      onClick={() => {
                        setShowUploadStaging(false);
                        setStagedFiles([]);
                        setUploadTags('');
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Files preview */}
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {stagedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                        <span className="flex-1 truncate font-medium text-gray-900">{file.name}</span>
                        <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>

                  {/* Tags Input */}
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                      <Tag className="w-3.5 h-3.5 text-gray-500" />
                      Add Tags (comma-separated, optional)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g., LEGAL-1, PROJECT-X, CONFIDENTIAL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitUpload}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                    >
                      Upload Files
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadStaging(false);
                        setStagedFiles([]);
                        setUploadTags('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Queue */}
            {uploadQueue.length > 0 && (
              <div className="p-4 border-b border-gray-200 max-h-48 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Upload Queue ({uploadQueue.length})</h3>
                <div className="space-y-2">
                  {uploadQueue.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.status === 'complete' && <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                          {item.status === 'failed' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                          {(item.status === 'uploading' || item.status === 'processing') && <Loader2 className="w-4 h-4 text-gray-600 animate-spin flex-shrink-0" />}
                          {item.status === 'queued' && <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          <span className="text-xs font-medium text-gray-900 truncate">{item.file.name}</span>
                        </div>
                        {item.status === 'failed' && (
                          <button
                            onClick={() => handleReupload(item.id)}
                            className="text-gray-700 hover:text-gray-900 text-xs flex items-center gap-1 flex-shrink-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            item.status === 'complete' ? 'bg-gray-600' :
                            item.status === 'failed' ? 'bg-red-600' :
                            'bg-gray-800'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      {item.status === 'failed' && item.error && (
                        <p className="text-xs text-red-600 mt-1">{item.error}</p>
                      )}

                      {/* Show tags on upload item */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium border border-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tag Filter Section */}
            {allTags.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Filter by Tags</h4>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    const count = sources.filter(s => s.labels?.includes(tag)).length;
                    
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTagFilter(tag)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {tag} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Context Sources ({filteredSources.length}{selectedTags.length > 0 ? ` of ${sources.length}` : ''})
                  </h3>
                  {selectedSourceIds.length > 0 && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {selectedSourceIds.length} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {filteredSources.length > 0 && (
                    <>
                      {selectedSourceIds.length > 0 ? (
                        <button
                          onClick={clearSourceSelection}
                          className="text-gray-600 hover:text-gray-900 text-xs transition-colors"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={selectAllFilteredSources}
                          className="text-gray-600 hover:text-gray-900 text-xs transition-colors"
                        >
                          Select All
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={loadAllSources}
                    className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1 transition-colors"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                </div>
              )}

              {!loading && sources.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No context sources found</p>
                </div>
              )}

              {!loading && filteredSources.length === 0 && sources.length > 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sources match the selected tags</p>
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-gray-700 hover:text-gray-900 mt-2 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {!loading && filteredSources.length > 0 && (
                <div className="space-y-3">
                  {filteredSources.map(source => {
                    const isSelected = selectedSourceIds.includes(source.id);
                    
                    return (
                      <div
                        key={source.id}
                        onClick={() => toggleSourceSelection(source.id)}
                        className={`w-full text-left border rounded-lg p-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSourceSelection(source.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 flex-shrink-0"
                            />
                            <FileText className="w-4 h-4 text-gray-700 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {source.name}
                            </span>
                            {(source.labels?.includes('PUBLIC') || source.labels?.includes('public')) && (
                              <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full flex-shrink-0">
                                🌐 PUBLIC
                              </span>
                            )}
                            {source.metadata?.validated && (
                              <span className="px-2 py-0.5 bg-gray-800 text-white text-xs rounded-full flex-shrink-0">
                                ✓ Validado
                              </span>
                            )}
                          </div>
                          {source.status === 'active' && <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                          {source.status === 'error' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                          {source.status === 'processing' && <Loader2 className="w-4 h-4 text-gray-600 animate-spin flex-shrink-0" />}
                        </div>

                      <div className="space-y-1 text-xs text-gray-600">
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

                      {/* Tags */}
                      {source.labels && source.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {source.labels.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {source.extractedData?.substring(0, 120)}...
                      </p>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Source Details & Agent Assignment */}
          <div className="w-1/2 flex flex-col">
            {selectedSourceIds.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select sources to assign to agents</p>
                  <p className="text-xs mt-2">Click checkboxes or cards to select</p>
                </div>
              </div>
            ) : selectedSourceIds.length === 1 && selectedSource ? (
              <>
                {/* Source Details Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedSource.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                          selectedSource.status === 'active' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          selectedSource.status === 'error' ? 'bg-red-50 text-red-700 border-red-300' :
                          'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {selectedSource.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          Uploaded by {selectedSource.uploaderEmail || selectedSource.userId}
                        </span>
                      </div>
                      
                      {/* Tags in source details */}
                      {selectedSource.labels && selectedSource.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedSource.labels.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSource(selectedSource.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Metadata */}
                  {selectedSource.metadata && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {selectedSource.metadata.pageCount && (
                        <div>
                          <span className="text-gray-500">Pages:</span>
                          <span className="ml-2 font-medium text-gray-900">{selectedSource.metadata.pageCount}</span>
                        </div>
                      )}
                      {selectedSource.metadata.model && (
                        <div>
                          <span className="text-gray-500">Model:</span>
                          <span className="ml-2 font-medium text-gray-900">{selectedSource.metadata.model}</span>
                        </div>
                      )}
                      {selectedSource.metadata.charactersExtracted && (
                        <div>
                          <span className="text-gray-500">Characters:</span>
                          <span className="ml-2 font-medium text-gray-900">{selectedSource.metadata.charactersExtracted.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedSource.metadata.tokensEstimate && (
                        <div>
                          <span className="text-gray-500">Tokens:</span>
                          <span className="ml-2 font-medium text-gray-900">{selectedSource.metadata.tokensEstimate.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Agent Assignment */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Assign to Agents</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {pendingAgentIds.length} agent{pendingAgentIds.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={handleAssignClick}
                        disabled={isAssigning || pendingAgentIds.length === 0}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>Assign to Agents</>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Bulk Assign by Tags */}
                  {selectedTags.length > 0 && (
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Bulk Assign by Tags</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {filteredSources.length} source(s) with selected tags
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            if (pendingAgentIds.length === 0) {
                              alert('Please select at least one agent first');
                              return;
                            }
                            
                            setIsAssigning(true);
                            try {
                              // Assign all tagged sources to selected agents
                              for (const source of filteredSources) {
                                await handleBulkAssign(source.id, pendingAgentIds);
                              }
                              alert(`✅ Assigned ${filteredSources.length} sources to ${pendingAgentIds.length} agent(s)`);
                            } catch (error) {
                              console.error('Bulk assign failed:', error);
                              alert('Error during bulk assignment');
                            } finally {
                              setIsAssigning(false);
                            }
                          }}
                          disabled={isAssigning || pendingAgentIds.length === 0}
                          className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                        >
                          Assign All Tagged
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-800 text-white rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {conversations.map(agent => {
                      const isSelected = pendingAgentIds.includes(agent.id);
                      
                      return (
                        <label
                          key={agent.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAgentSelection(agent.id)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <MessageSquare className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900 flex-1 truncate">
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
                    <h4 className="text-sm font-semibold text-gray-900">Extracted Data</h4>
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
                        className="text-gray-700 hover:text-gray-900 text-xs flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </div>
                  
                  {selectedSource.extractedData ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                        {selectedSource.extractedData}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No extracted data available</p>
                      {selectedSource.status === 'processing' && (
                        <p className="text-xs mt-2">Processing in progress...</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Multiple Sources Selected - Bulk Assignment View */
              <div className="flex flex-col h-full">
                {/* Bulk Selection Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Bulk Assignment
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedSourceIds.length} source{selectedSourceIds.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                    <button
                      onClick={clearSourceSelection}
                      className="text-gray-600 hover:text-gray-900 text-xs transition-colors"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>

                {/* Selected Sources Summary */}
                <div className="p-6 border-b border-gray-200 max-h-64 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Selected Sources</h4>
                  <div className="space-y-2">
                    {sources.filter(s => selectedSourceIds.includes(s.id)).map(source => (
                      <div key={source.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <FileText className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{source.name}</p>
                          {source.labels && source.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {source.labels.map(tag => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium border border-gray-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSourceSelection(source.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bulk Agent Assignment */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Assign to Agents</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {pendingAgentIds.length} agent{pendingAgentIds.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={handleAssignClick}
                        disabled={isAssigning || pendingAgentIds.length === 0}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>Assign {selectedSourceIds.length} Source{selectedSourceIds.length !== 1 ? 's' : ''}</>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {conversations.map(agent => {
                      const isSelected = pendingAgentIds.includes(agent.id);
                      
                      return (
                        <label
                          key={agent.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAgentSelection(agent.id)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <MessageSquare className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                            {agent.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment Summary</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{selectedSourceIds.length}</p>
                          <p className="text-xs text-gray-600 mt-1">Source{selectedSourceIds.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{pendingAgentIds.length}</p>
                          <p className="text-xs text-gray-600 mt-1">Agent{pendingAgentIds.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                    
                    {pendingAgentIds.length > 0 && selectedSourceIds.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-700 mb-2">
                          This will assign:
                        </p>
                        <ul className="space-y-1 text-xs text-gray-600">
                          {sources.filter(s => selectedSourceIds.includes(s.id)).slice(0, 3).map(source => (
                            <li key={source.id} className="flex items-center gap-1">
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{source.name}</span>
                            </li>
                          ))}
                          {selectedSourceIds.length > 3 && (
                            <li className="text-gray-500 italic">
                              ... and {selectedSourceIds.length - 3} more
                            </li>
                          )}
                        </ul>
                        <p className="text-xs text-gray-700 mt-3 mb-2">
                          To {pendingAgentIds.length} agent{pendingAgentIds.length !== 1 ? 's' : ''}:
                        </p>
                        <ul className="space-y-1 text-xs text-gray-600">
                          {conversations.filter(c => pendingAgentIds.includes(c.id)).slice(0, 3).map(agent => (
                            <li key={agent.id} className="flex items-center gap-1">
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{agent.title}</span>
                            </li>
                          ))}
                          {pendingAgentIds.length > 3 && (
                            <li className="text-gray-500 italic">
                              ... and {pendingAgentIds.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {sources.length} total sources • {uploadQueue.filter(i => i.status === 'complete').length} uploads completed
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
