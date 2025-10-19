import React, { useState, useEffect, useRef } from 'react';
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
  Tag,
  Globe,
  Grid,
  Zap
} from 'lucide-react';
import type { ContextSource } from '../types/context';
import { useModalClose } from '../hooks/useModalClose';
import PipelineStatusPanel from './PipelineStatusPanel';

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
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro'; // Model to use for extraction
  startTime?: number; // NEW: Timestamp when upload started
  elapsedTime?: number; // NEW: Elapsed time in milliseconds
}

// Helper function to format elapsed time with smooth millisecond updates
function formatElapsedTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    // Show with 1 decimal for smooth updates (23.5s format)
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    // For times over 1 minute, show minutes and seconds with 1 decimal
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
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
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-2.5-pro'>('gemini-2.5-flash'); // Default to Flash
  
  // Multi-select state for sources
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const selectedSource = selectedSourceIds.length === 1 
    ? sources.find(s => s.id === selectedSourceIds[0]) || null
    : null;
  
  // Drag & Drop visual state
  const [isDragging, setIsDragging] = useState(false);

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
    setSelectedModel('gemini-2.5-flash'); // Reset to default
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

    // Create upload queue items with selected model
    const newItems: UploadQueueItem[] = newFiles.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'queued',
      progress: 0,
      tags: tags.length > 0 ? tags : undefined,
      model: selectedModel, // Include selected model
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    processQueue(newItems);
    
    // Close staging
    setShowUploadStaging(false);
    setStagedFiles([]);
    setStagedTags([]);
    setUploadTags('');
    setSelectedModel('gemini-2.5-flash'); // Reset to default
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
      const startTime = Date.now();
      let elapsedTimeInterval: NodeJS.Timeout | null = null;
      let smoothProgressInterval: NodeJS.Timeout | null = null;

      try {
        // Start with initial state
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'uploading', 
            progress: 0,
            startTime,
            elapsedTime: 0
          } : i
        ));

        // Start elapsed time tracker - update every 100ms for smooth animation
        elapsedTimeInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, elapsedTime: elapsed } : i
          ));
        }, 100); // Update every 100ms for smooth millisecond increments

        // ✨ NEW: Smooth incremental progress through ALL stages
        let currentProgress = 0;
        smoothProgressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(i => {
            if (i.id !== item.id) return i;
            
            // Increment progress smoothly (0.5% per second)
            const newProgress = Math.min(i.progress + 0.5, 97); // Cap at 97%, API will finish it
            
            return { ...i, progress: newProgress };
          }));
        }, 500); // Update every 500ms

        // Create FormData
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('userId', userId);
        formData.append('name', item.file.name);
        formData.append('model', item.model || 'gemini-2.5-flash');

        // Upload stage (0-25%)
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'uploading', progress: 5 } : i
        ));

        // Call API (this takes the real time)
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

        // Clear smooth progress - API done, move to RAG phase
        if (smoothProgressInterval) {
          clearInterval(smoothProgressInterval);
          smoothProgressInterval = null;
        }
        
        // Extract complete (50%)
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'processing', progress: 50 } : i
        ));

        // Create source in Firestore with extracted data and pipeline logs
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
            metadata: {
              ...uploadData.metadata,
              model: item.model || 'gemini-2.5-flash', // Save model used
            },
            pipelineLogs: uploadData.pipelineLogs || [], // ✅ Save pipeline execution logs
          })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to save context source');
        }

        const savedData = await createResponse.json();
        const sourceId = savedData.source?.id;

        // ✅ Auto-trigger RAG pipeline (Chunk → Embed) with progress
        if (sourceId && uploadData.extractedText) {
          console.log('🔍 Auto-triggering RAG pipeline for sourceId:', sourceId);
          
          // Chunk stage (50-75%)
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress: 55 } : i
          ));
          
          // Restart smooth progress for RAG phase (50-97%)
          currentProgress = 55;
          smoothProgressInterval = setInterval(() => {
            setUploadQueue(prev => prev.map(i => {
              if (i.id !== item.id) return i;
              const newProgress = Math.min(i.progress + 0.5, 97);
              return { ...i, progress: newProgress };
            }));
          }, 500);
          
          try {
            const ragResponse = await fetch(`/api/context-sources/${sourceId}/enable-rag`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                chunkSize: 500,
                overlap: 50,
              }),
            });

            if (ragResponse.ok) {
              const ragData = await ragResponse.json();
              console.log('✅ RAG pipeline completed:', ragData);
              
              // Stop smooth progress
              if (smoothProgressInterval) {
                clearInterval(smoothProgressInterval);
                smoothProgressInterval = null;
              }
              
              // Embed complete (99%)
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: 99 } : i
              ));
            } else {
              console.warn('⚠️ RAG pipeline failed, but extraction was successful');
            }
          } catch (error) {
            console.warn('⚠️ RAG auto-trigger failed:', error);
            // Don't fail the upload, RAG can be enabled manually later
          }
        }

        // Final completion
        if (smoothProgressInterval) clearInterval(smoothProgressInterval);
        if (elapsedTimeInterval) clearInterval(elapsedTimeInterval);
        
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'complete', 
            progress: 100, 
            sourceId,
            elapsedTime: Date.now() - startTime
          } : i
        ));

      } catch (error) {
        console.error('Upload failed:', item.file.name, error);
        if (smoothProgressInterval) clearInterval(smoothProgressInterval);
        if (elapsedTimeInterval) clearInterval(elapsedTimeInterval);
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Upload failed',
            elapsedTime: Date.now() - startTime
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
        model: item.model, // Preserve model selection
        tags: item.tags, // Preserve tags
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

  // Drag and drop handlers with visual feedback
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
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
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={`w-10 h-10 mx-auto mb-3 transition-all ${
                      isDragging ? 'text-blue-600 scale-110' : 'text-gray-600'
                    }`} />
                    <p className={`text-sm font-semibold mb-1 ${
                      isDragging ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {isDragging ? '¡Suelta los archivos aquí!' : 'Arrastra PDFs aquí o haz click'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Múltiples archivos • Automático: Extract → Chunk → Embed
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full">
                        ⚡ Flash
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-[10px] text-gray-600">Pipeline automático</span>
                    </div>
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

                  {/* Model Selection */}
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-2">
                      AI Model for Extraction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedModel('gemini-2.5-flash')}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedModel === 'gemini-2.5-flash'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedModel === 'gemini-2.5-flash'
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedModel === 'gemini-2.5-flash' && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">Flash</span>
                        </div>
                        <p className="text-xs text-gray-600">Rápido y económico</p>
                        <p className="text-xs text-green-600 font-medium mt-1">94% más barato</p>
                      </button>

                      <button
                        onClick={() => setSelectedModel('gemini-2.5-pro')}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedModel === 'gemini-2.5-pro'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedModel === 'gemini-2.5-pro'
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedModel === 'gemini-2.5-pro' && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">Pro</span>
                        </div>
                        <p className="text-xs text-gray-600">Máxima precisión</p>
                        <p className="text-xs text-purple-600 font-medium mt-1">Mayor calidad</p>
                      </button>
                    </div>
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
                        setSelectedModel('gemini-2.5-flash');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Queue - Pipeline Visual */}
            {uploadQueue.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Pipeline de Procesamiento ({uploadQueue.length})
                </h3>
                <div className="space-y-4">
                  {uploadQueue.map(item => {
                    // Define stage thresholds - sequential and clear
                    const stages = [
                      { key: 'upload', label: 'Upload', icon: Upload, startProgress: 0, endProgress: 25 },
                      { key: 'extract', label: 'Extract', icon: FileText, startProgress: 25, endProgress: 50 },
                      { key: 'chunk', label: 'Chunk', icon: Grid, startProgress: 50, endProgress: 75 },
                      { key: 'embed', label: 'Embed', icon: Zap, startProgress: 75, endProgress: 100 },
                    ];

                    // Determine current stage based on progress
                    const getCurrentStageIndex = () => {
                      if (item.status === 'queued') return -1;
                      if (item.status === 'complete') return stages.length;
                      
                      // Find the stage we're in
                      for (let i = 0; i < stages.length; i++) {
                        if (item.progress >= stages[i].startProgress && item.progress < stages[i].endProgress) {
                          return i;
                        }
                      }
                      return stages.length - 1; // Last stage
                    };
                    
                    const currentStageIndex = getCurrentStageIndex();

                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        {/* Header: File name, model, time */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-gray-700 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {item.file.name}
                            </span>
                            {item.model && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                                item.model === 'gemini-2.5-pro'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {item.model === 'gemini-2.5-pro' ? '✨ Pro' : '⚡ Flash'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {item.elapsedTime !== undefined && (
                              <span className={`text-xs font-mono ${
                                item.status === 'complete' ? 'text-green-600 font-bold' : 'text-blue-600'
                              }`}>
                                {item.status === 'complete' ? '✓ ' : ''}
                                {formatElapsedTime(item.elapsedTime)}
                              </span>
                            )}
                            {item.status === 'failed' && (
                              <button
                                onClick={() => handleReupload(item.id)}
                                className="text-gray-700 hover:text-gray-900 text-xs flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retry
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Pipeline Stages - Sequential Horizontal Flow */}
                        {item.status !== 'failed' && (
                          <div className="relative">
                            <div className="flex items-center justify-between">
                              {stages.map((stage, idx) => {
                                const isComplete = idx < currentStageIndex;
                                const isActive = idx === currentStageIndex;
                                const isPending = idx > currentStageIndex;
                                const StageIcon = stage.icon;
                                
                                // Calculate stage-specific progress (0-100% within this stage)
                                const stageProgress = isActive 
                                  ? Math.min(100, Math.max(0, ((item.progress - stage.startProgress) / (stage.endProgress - stage.startProgress)) * 100))
                                  : 0;

                                return (
                                  <React.Fragment key={stage.key}>
                                    {/* Stage Circle */}
                                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                                        isComplete 
                                          ? 'bg-green-600 text-white shadow-lg scale-100' 
                                          : isActive 
                                          ? 'bg-blue-600 text-white shadow-lg scale-110 ring-4 ring-blue-200' 
                                          : 'bg-gray-100 text-gray-400 scale-95'
                                      }`}>
                                        {isComplete ? (
                                          <CheckCircle className="w-6 h-6" />
                                        ) : isActive ? (
                                          <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                          <StageIcon className="w-5 h-5" />
                                        )}
                                      </div>
                                      
                                      {/* Stage label */}
                                      <span className={`text-[10px] font-semibold transition-colors ${
                                        isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-500'
                                      }`}>
                                        {stage.label}
                                      </span>
                                      
                                      {/* Stage progress indicator (for active stage) */}
                                      {isActive && (
                                        <span className="text-[9px] font-mono text-blue-600">
                                          {Math.round(stageProgress)}%
                                        </span>
                                      )}
                                    </div>

                                    {/* Connector with animated fill */}
                                    {idx < stages.length - 1 && (
                                      <div className="flex-1 h-1 mx-1 bg-gray-200 rounded-full overflow-hidden relative">
                                        <div 
                                          className={`h-full transition-all duration-500 rounded-full ${
                                            isComplete ? 'bg-green-600 w-full' : 
                                            isActive ? 'bg-blue-600' : 
                                            'bg-gray-200 w-0'
                                          }`}
                                          style={isActive ? { width: `${stageProgress}%` } : undefined}
                                        />
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Error Display */}
                        {item.status === 'failed' && item.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-red-800 mb-1">Error en procesamiento</p>
                                <p className="text-xs text-red-700">{item.error}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <Tag className="w-3 h-3 text-gray-500" />
                            {item.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

                      {/* Compact metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                        {source.metadata?.pageCount && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {source.metadata.pageCount}p
                          </span>
                        )}
                        {(source.assignedAgents?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {source.assignedAgents?.length ?? 0}
                          </span>
                        )}
                        {source.metadata?.tokensEstimate && (
                          <span className="flex items-center gap-1 font-mono">
                            ~{Math.round(source.metadata.tokensEstimate / 1000)}k tokens
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {source.labels && source.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {source.labels.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
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

                {/* PUBLIC Tag Management */}
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Configuración de Visibilidad</h4>
                  
                  <button
                    onClick={async () => {
                      const newLabels = selectedSource.labels?.includes('PUBLIC')
                        ? selectedSource.labels.filter(l => l !== 'PUBLIC')
                        : [...(selectedSource.labels || []), 'PUBLIC'];
                      
                      // Update in API
                      await fetch(`/api/context-sources/${selectedSource.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          labels: newLabels,
                          tags: newLabels,
                        }),
                      });
                      
                      // If marking as PUBLIC, assign to all agents
                      if (newLabels.includes('PUBLIC')) {
                        const allConversationIds = conversations.map(c => c.id);
                        for (const agentId of allConversationIds) {
                          try {
                            await fetch(`/api/context-sources/${selectedSource.id}/assign-agent`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ agentId }),
                            });
                          } catch (error) {
                            console.warn('Failed to assign to agent:', agentId);
                          }
                        }
                        console.log(`✅ PUBLIC: asignado a ${allConversationIds.length} agentes`);
                      }
                      
                      // Reload
                      await loadAllSources();
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all ${
                      selectedSource.labels?.includes('PUBLIC')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        selectedSource.labels?.includes('PUBLIC')
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {selectedSource.labels?.includes('PUBLIC') && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-900">PUBLIC</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Se asigna automáticamente a todos los nuevos agentes
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {selectedSource.labels?.includes('PUBLIC') && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      ℹ️ Este contexto está disponible para todos los agentes (nuevos y existentes)
                    </div>
                  )}
                </div>

                {/* Agent Assignment */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Asignar a Agentes Específicos</h4>
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

                {/* Pipeline Status - Show processing details */}
                {selectedSource.pipelineLogs && selectedSource.pipelineLogs.length > 0 && (
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-slate-50 to-blue-50">
                    <PipelineStatusPanel 
                      logs={selectedSource.pipelineLogs}
                      sourceName={selectedSource.name}
                    />
                  </div>
                )}

                {/* Extracted Data Preview */}
                <div className="flex-1 flex flex-col p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-700" />
                      <h4 className="text-sm font-semibold text-gray-900">Texto Extraído</h4>
                      {selectedSource.extractedData && (
                        <span className="text-xs text-gray-500">
                          ({selectedSource.metadata?.charactersExtracted?.toLocaleString() || selectedSource.extractedData.length.toLocaleString()} caracteres)
                        </span>
                      )}
                    </div>
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
                        className="text-gray-700 hover:text-gray-900 text-xs flex items-center gap-1 transition-colors px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                    )}
                  </div>
                  
                  {selectedSource.extractedData ? (
                    <div className="flex-1 bg-white rounded-lg border-2 border-gray-200 overflow-hidden flex flex-col">
                      {/* Content with better formatting */}
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {selectedSource.extractedData}
                        </div>
                      </div>
                      
                      {/* Bottom stats bar */}
                      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-600">
                          <div className="flex items-center gap-4">
                            {selectedSource.metadata?.pageCount && (
                              <span>📄 {selectedSource.metadata.pageCount} páginas</span>
                            )}
                            {selectedSource.metadata?.tokensEstimate && (
                              <span>🔢 ~{selectedSource.metadata.tokensEstimate.toLocaleString()} tokens</span>
                            )}
                          </div>
                          {selectedSource.metadata?.extractionDate && (
                            <span className="text-gray-500">
                              Extraído: {new Date(selectedSource.metadata.extractionDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No hay texto extraído</p>
                        {selectedSource.status === 'processing' && (
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <p className="text-xs text-blue-600">Procesando documento...</p>
                          </div>
                        )}
                      </div>
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
