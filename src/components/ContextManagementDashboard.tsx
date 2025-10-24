import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Zap,
  ChevronRight,
  Folder
} from 'lucide-react';
import type { ContextSource } from '../types/context';
import { useModalClose } from '../hooks/useModalClose';
import PipelineStatusPanel from './PipelineStatusPanel';
import PipelineDetailView from './PipelineDetailView';

interface ContextManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  conversations: Array<{ 
    id: string; 
    title: string;
    isAgent?: boolean;  // true = agent, false = chat, undefined = legacy (treat as agent)
    status?: 'active' | 'archived';  // Filter out archived agents
  }>;
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
  
  // 🔑 Hook para cerrar con ESC (dashboard de pantalla completa)
  const modalRef = useModalClose(isOpen, onClose, false, true, false); // No close on outside click for dashboards
  
  const [sources, setSources] = useState<EnrichedContextSource[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Folder state  
  const [folderStructure, setFolderStructure] = useState<Array<{name: string; count: number}>>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
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

  // Load first page of context sources
  useEffect(() => {
    if (isOpen) {
      loadFirstPage();
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
        
        // 🔧 FIX: Filter out CLI placeholder assignments ("cli-upload")
        // These are default values from CLI and should not be pre-selected
        const actualAgentIds = currentIds.filter(id => 
          id !== 'cli-upload' && // Remove CLI placeholder
          conversations.some(conv => conv.id === id) // Only include actual conversation IDs
        );
        
        console.log('🔍 Initializing agent selection for source:', source.name);
        console.log('   All assignedToAgents:', currentIds);
        console.log('   Filtered (actual agents only):', actualAgentIds);
        
        setPendingAgentIds(actualAgentIds);
      }
    } else if (selectedSourceIds.length > 1) {
      // Multiple sources - find common agents
      const allSources = sources.filter(s => selectedSourceIds.includes(s.id));
      const agentSets = allSources.map(s => {
        const agents = s.assignedToAgents || [];
        const agentIds = agents.map((a: any) => typeof a === 'string' ? a : a.id);
        // Filter out CLI placeholders
        return agentIds.filter(id => 
          id !== 'cli-upload' &&
          conversations.some(conv => conv.id === id)
        );
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
  }, [selectedSourceIds, sources, conversations]);

  const loadFirstPage = async () => {
    setLoading(true);
    setSources([]);
    setCurrentPage(0);
    
    try {
      // Load folder structure
      const structureResponse = await fetch('/api/context-sources/folder-structure', {
        credentials: 'include', // ✅ FIX: Include cookies for authentication
      });
      if (structureResponse.ok) {
        const data = await structureResponse.json();
        setFolderStructure(data.folders || []);
        setTotalCount(data.totalCount || 0);
        
        // Extract all unique tags from folder structure
        const tagsSet = new Set<string>();
        data.folders?.forEach((folder: any) => {
          if (folder.name) tagsSet.add(folder.name);
        });
        setAllTags(Array.from(tagsSet).sort());
      } else {
        console.error('❌ Failed to load folder structure:', structureResponse.status);
      }
      
      // Load first 10 documents
      const response = await fetch('/api/context-sources/paginated?page=0&limit=10', {
        credentials: 'include', // ✅ FIX: Include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
        setHasMore(data.hasMore);
        setCurrentPage(0);
        
        console.log('✅ Loaded first page:', data.sources?.length || 0, 'sources');
        console.log('📊 Total count:', data.totalCount || 0);
        console.log('📁 Folders:', data.folders?.length || 0);
      } else {
        console.error('❌ Failed to load sources:', response.status);
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
      const response = await fetch(`/api/context-sources/paginated?page=${nextPage}&limit=10`, {
        credentials: 'include', // ✅ FIX: Include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setSources(prev => [...prev, ...(data.sources || [])]);
        setHasMore(data.hasMore);
        setCurrentPage(nextPage);
        
        console.log('✅ Loaded page', nextPage, ':', data.sources?.length || 0, 'sources');
      } else {
        console.error('❌ Failed to load page:', response.status);
      }
    } catch (error) {
      console.error('Error loading next page:', error);
    } finally {
      setLoadingMore(false);
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
        smoothProgressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(i => {
            if (i.id !== item.id) return i;
            
            // Dynamic increment based on current stage
            let increment = 0.5; // Default: 0.5% per 500ms (1% per second)
            
            // Speed up during long-running stages
            if (i.progress >= 25 && i.progress < 50) {
              // Extract stage - slower increment (API is working)
              increment = 0.3;
            } else if (i.progress >= 50 && i.progress < 75) {
              // Chunk stage - medium speed
              increment = 0.8;
            } else if (i.progress >= 75) {
              // Embed stage - faster (we want to reach completion)
              increment = 1.0;
            }
            
            // Cap at 98% before final completion
            const newProgress = Math.min(i.progress + increment, 98);
            
            return { ...i, progress: newProgress };
          }));
        }, 500); // Update every 500ms

        // Create FormData
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('userId', userId);
        formData.append('name', item.file.name);
        formData.append('model', item.model || 'gemini-2.5-flash');
        formData.append('extractionMethod', 'vision-api'); // Use Vision API for better OCR

        // Upload stage (0-25%)
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'uploading', progress: 5 } : i
        ));

        // Call API (this takes the real time)
        const uploadResponse = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData,
          credentials: 'include', // ✅ FIX: Include cookies for authentication
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadResponse.json();
        
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Extraction failed');
        }

        // API complete! Transition smoothly to next stage
        // First jump to end of Extract stage
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'processing', progress: 48 } : i
        ));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Complete Extract stage (50%)
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, progress: 50 } : i
        ));

        // Create source in Firestore with extracted data and pipeline logs
        const createResponse = await fetch('/api/context-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // ✅ FIX: Include cookies for authentication
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

        // Transition to Chunk stage
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id ? { ...i, progress: 52 } : i
        ));

        // ✅ Auto-trigger RAG pipeline (Chunk → Embed) with progress
        if (sourceId && uploadData.extractedText) {
          console.log('🔍 Auto-triggering RAG pipeline for sourceId:', sourceId);
          
          try {
            // Chunk stage starting (55%)
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { ...i, progress: 55 } : i
            ));
            
            const ragResponse = await fetch(`/api/context-sources/${sourceId}/enable-rag`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // ✅ FIX: Include cookies for authentication
              body: JSON.stringify({
                userId,
                chunkSize: 1000, // Updated for better technical doc chunking
                overlap: 250,    // Maximum context preservation
              }),
            });

            const ragData = await ragResponse.json();
            
            if (ragResponse.ok && ragData.success) {
              console.log('✅ RAG pipeline completed:', ragData);
              console.log(`   Chunks created: ${ragData.chunksCreated}`);
              console.log(`   Total tokens: ${ragData.totalTokens}`);
              
              // Chunk complete, moving to Embed (75%)
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: 75 } : i
              ));
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Embed progressing (85%)
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: 85 } : i
              ));
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Embed almost done (95%)
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: 95 } : i
              ));
            } else {
              console.error('❌ RAG pipeline failed:', ragData);
              console.error('   Error:', ragData.error || ragData.message);
              console.error('   Response status:', ragResponse.status);
              
              // Show warning but still complete
              alert(`⚠️ RAG indexing falló: ${ragData.error || ragData.message}\n\nEl documento está disponible en modo Full-text.`);
              
              // Still advance to completion
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { ...i, progress: 95 } : i
              ));
            }
          } catch (error) {
            console.error('❌ RAG auto-trigger exception:', error);
            
            // Show error
            alert(`⚠️ Error indexando con RAG: ${error instanceof Error ? error.message : 'Unknown error'}\n\nEl documento está disponible en modo Full-text.`);
            
            // Still advance to completion
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { ...i, progress: 95 } : i
            ));
          }
        } else {
          // No RAG, skip to 95%
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress: 95 } : i
          ));
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
    await loadFirstPage(); // Reload sources
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
    
    console.log('🎯 Frontend: Bulk assign requested');
    console.log('   Source ID:', sourceId);
    console.log('   Agent IDs:', agentIds);
    
    // Find the source to log its name
    const sourceToAssign = sources.find(s => s.id === sourceId);
    console.log('   Source name:', sourceToAssign?.name);
    console.log('   Current assignedToAgents:', sourceToAssign?.assignedToAgents);
    
    try {
      const requestBody = { sourceId, agentIds };
      console.log('📤 Sending request:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/context-sources/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ FIX: Include cookies for authentication
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Bulk assignment successful:', result);
        console.log('   Updated source ID:', result.sourceId);
        console.log('   Assigned to', result.assignedCount, 'agents');
        
        // Reload sources from backend
        console.log('🔄 Reloading all sources after assignment...');
        await loadFirstPage();
        onSourcesUpdated();
        
        console.log('✅ Sources reloaded. Verifying assignment...');
        // After reload, check if the assignment stuck
        setTimeout(() => {
          const updatedSource = sources.find(s => s.id === sourceId);
          console.log('🔍 Verification - Source after reload:', updatedSource?.name);
          console.log('   assignedToAgents:', updatedSource?.assignedToAgents);
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Bulk assignment failed:', errorData);
        alert('Error al asignar a agentes');
      }
    } catch (error) {
      console.error('❌ Error in bulk assignment:', error);
      alert('Error al asignar a agentes');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignClick = async () => {
    console.log('🎯 ASSIGN BUTTON CLICKED!');
    console.log('   Selected sources:', selectedSourceIds.length);
    console.log('   Selected agents:', pendingAgentIds.length);
    console.log('   Source IDs:', selectedSourceIds.slice(0, 5));
    console.log('   Agent IDs:', pendingAgentIds);
    
    if (selectedSourceIds.length === 0 || pendingAgentIds.length === 0) {
      console.warn('⚠️ Assignment blocked - missing sources or agents');
      return;
    }
    
    setIsAssigning(true);
    
    try {
      console.log('📤 Sending bulk assignment request...');
      const response = await fetch('/api/context-sources/bulk-assign-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ FIX: Include cookies for authentication
        body: JSON.stringify({
          sourceIds: selectedSourceIds,
          agentIds: pendingAgentIds,
        }),
      });

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Assignment successful:', result);
        alert(`✅ ${result.sourcesUpdated} documentos asignados en ${(result.responseTime / 1000).toFixed(1)}s`);
        
        // Update local state
        console.log('🔄 Updating local state...');
        setSources(prev => prev.map(s => 
          selectedSourceIds.includes(s.id)
            ? { ...s, assignedToAgents: pendingAgentIds }
            : s
        ));
        
        // Clear selection
        console.log('🧹 Clearing selection...');
        setSelectedSourceIds([]);
        setPendingAgentIds([]);
        console.log('✅ Assignment flow complete');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Assignment failed:', response.status, errorData);
        alert('Error al asignar documentos');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar');
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

  const selectAllFilteredSources = async () => {
    // If tag filter is active, load ALL matching source IDs from backend
    if (selectedTags.length > 0) {
      setLoading(true);
      try {
        const tagsParam = selectedTags.join(',');
        const response = await fetch(`/api/context-sources/ids-by-tags?tags=${tagsParam}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          const allMatchingIds = data.sourceIds || [];
          console.log(`✅ Selecting ALL ${allMatchingIds.length} sources matching tags:`, selectedTags);
          setSelectedSourceIds(allMatchingIds);
        } else {
          console.error('❌ Failed to load all source IDs:', response.status);
          // Fallback to current loaded sources
          const filteredIds = filteredSources.map(s => s.id);
          setSelectedSourceIds(filteredIds);
        }
      } catch (error) {
        console.error('Error loading all source IDs:', error);
        // Fallback to current loaded sources
        const filteredIds = filteredSources.map(s => s.id);
        setSelectedSourceIds(filteredIds);
      } finally {
        setLoading(false);
      }
    } else {
      // No filter active - select all currently loaded sources
      const filteredIds = filteredSources.map(s => s.id);
      setSelectedSourceIds(filteredIds);
    }
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

  const sourcesByTag = useMemo(() => {
    const groups = new Map<string, EnrichedContextSource[]>();
    
    folderStructure.forEach(folder => {
      groups.set(folder.name, []);
    });
    
    sources.forEach(source => {
      if (!source.labels || source.labels.length === 0) {
        if (!groups.has('General')) groups.set('General', []);
        groups.get('General')!.push(source);
      } else {
        source.labels.forEach(tag => {
          if (!groups.has(tag)) groups.set(tag, []);
          groups.get(tag)!.push(source);
        });
      }
    });
    
    return groups;
  }, [folderStructure, sources]);

  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const expandAllFolders = () => {
    setExpandedFolders(new Set(Array.from(sourcesByTag.keys())));
  };

  const collapseAllFolders = () => {
    setExpandedFolders(new Set());
  };

  const selectAllInFolder = async (folderName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent folder toggle
    
    // Fetch ALL source IDs for this folder/tag from backend
    setLoading(true);
    try {
      const response = await fetch(`/api/context-sources/ids-by-tags?tags=${folderName}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const allFolderIds = data.sourceIds || [];
        console.log(`✅ Selecting ALL ${allFolderIds.length} sources in folder "${folderName}"`);
        
        // Add to existing selection
        setSelectedSourceIds(prev => {
          const combined = new Set([...prev, ...allFolderIds]);
          return Array.from(combined);
        });
      } else {
        console.error('❌ Failed to load folder source IDs:', response.status);
        // Fallback to currently loaded sources in folder
        const folderSources = sourcesByTag.get(folderName) || [];
        const folderIds = folderSources.map(s => s.id);
        setSelectedSourceIds(prev => {
          const combined = new Set([...prev, ...folderIds]);
          return Array.from(combined);
        });
      }
    } catch (error) {
      console.error('Error loading folder source IDs:', error);
      // Fallback to currently loaded sources in folder
      const folderSources = sourcesByTag.get(folderName) || [];
      const folderIds = folderSources.map(s => s.id);
      setSelectedSourceIds(prev => {
        const combined = new Set([...prev, ...folderIds]);
        return Array.from(combined);
      });
    } finally {
      setLoading(false);
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
        credentials: 'include', // ✅ FIX: Include cookies for authentication
      });

      if (response.ok) {
        await loadFirstPage();
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
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col"
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
          {/* Left: Sources List with Scrollable Pipeline */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Upload Zone - Fixed at top */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
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

            {/* Upload Queue - Pipeline Visual - Scrollable */}
            {uploadQueue.length > 0 && (
              <div className="flex-shrink-0 border-b border-gray-200 flex flex-col" style={{ maxHeight: '50vh' }}>
                <div className="flex-shrink-0 p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Pipeline de Procesamiento ({uploadQueue.length})
                    </h3>
                    <span className="text-xs text-gray-500">
                      {uploadQueue.filter(i => i.status === 'complete').length} completados
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
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
                      <button
                        key={item.id}
                        onClick={async () => {
                          // If complete, find the source and select it
                          if (item.status === 'complete' && item.sourceId) {
                            console.log('🔍 Pipeline card clicked, sourceId:', item.sourceId);
                            
                            // First check if source is in current list
                            let source = sources.find(s => s.id === item.sourceId);
                            
                            // If not found, reload sources (might be newly created)
                            if (!source) {
                              console.log('⟳ Source not in list, reloading...');
                              await loadFirstPage();
                              source = sources.find(s => s.id === item.sourceId);
                            }
                            
                            if (source) {
                              console.log('✅ Found source, selecting:', source.name);
                              setSelectedSourceIds([item.sourceId]);
                              // Clear any tag filters to ensure source is visible
                              setSelectedTags([]);
                            } else {
                              console.error('❌ Source not found after reload:', item.sourceId);
                              alert('Documento no encontrado. Por favor, refresca la página.');
                            }
                          }
                        }}
                        className={`w-full border border-gray-200 rounded-lg p-4 bg-white shadow-sm text-left transition-all ${
                          item.status === 'complete' ? 'hover:border-blue-400 hover:shadow-md cursor-pointer' : 'cursor-default'
                        }`}
                      >
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
                        
                        {/* Clickable indicator for completed items */}
                        {item.status === 'complete' && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              Click para ver detalles completos
                            </span>
                          </div>
                        )}
                      </button>
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
                    // ✅ Get ACTUAL count from folderStructure (from Firestore total count)
                    const totalCount = folderStructure.find(f => f.name === tag)?.count || 0;
                    
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
                        {tag} ({totalCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sources List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Context Sources ({totalCount})
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
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-900 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                          Select All
                          {selectedTags.length > 0 && (
                            <span className="text-blue-600 font-semibold">
                              ({folderStructure.find(f => selectedTags.includes(f.name))?.count || '?'})
                            </span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={loadFirstPage}
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

              {!loading && sources.length > 0 && (
                <div className="space-y-4">
                  {/* Expand/Collapse All Controls */}
                  {sourcesByTag.size > 1 && (
                    <div className="flex items-center gap-2 px-1">
                      <button
                        onClick={expandAllFolders}
                        className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Expand All
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={collapseAllFolders}
                        className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Collapse All
                      </button>
                    </div>
                  )}

                  {/* Folder-Grouped Sources */}
                  {Array.from(sourcesByTag.entries()).map(([folderName, folderSources]) => {
                    const isExpanded = expandedFolders.has(folderName);
                    const sourcesToShow = isExpanded ? folderSources : folderSources.slice(0, 3);
                    const hasMore = folderSources.length > 3;
                    const selectedInFolder = folderSources.filter(s => selectedSourceIds.includes(s.id)).length;
                    
                    // ✅ Get ACTUAL count from folderStructure (from Firestore total count)
                    const totalCountInFolder = folderStructure.find(f => f.name === folderName)?.count || folderSources.length;
                    
                    return (
                      <div key={folderName} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Folder Header */}
                        <div
                          onClick={() => toggleFolder(folderName)}
                          className="bg-gray-50 hover:bg-gray-100 px-4 py-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <ChevronRight 
                                className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                              <Folder className="w-4 h-4 text-gray-700" />
                              <span className="text-sm font-semibold text-gray-900">{folderName}</span>
                              <span className="text-xs text-gray-600">
                                {totalCountInFolder} documento{totalCountInFolder !== 1 ? 's' : ''}
                                {selectedInFolder > 0 && (
                                  <> • <span className="text-blue-600 font-medium">{selectedInFolder} seleccionado{selectedInFolder !== 1 ? 's' : ''}</span></>
                                )}
                              </span>
                            </div>
                            <button
                              onClick={(e) => selectAllInFolder(folderName, e)}
                              disabled={loading}
                              className="px-3 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                              Select All
                            </button>
                          </div>
                        </div>

                        {/* Folder Content */}
                        <div className={`${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
                          <div className="p-3 space-y-2">
                            {sourcesToShow.map(source => {
                              const isSelected = selectedSourceIds.includes(source.id);
                              
                              return (
                                <div
                                  key={source.id}
                                  onClick={() => toggleSourceSelection(source.id)}
                                  className={`w-full text-left border rounded-lg p-3 transition-all cursor-pointer ${
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
                        </div>

                        {/* Show More Indicator */}
                        {!isExpanded && hasMore && (
                          <div
                            onClick={() => toggleFolder(folderName)}
                            className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-xs text-gray-600 hover:text-gray-900">
                              + {folderSources.length - 3} más documento{folderSources.length - 3 !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center pt-2">
                      <button
                        onClick={loadNextPage}
                        disabled={loadingMore}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors text-sm font-medium inline-flex items-center gap-2"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          <>Cargar 10 más</>
                        )}
                      </button>
                    </div>
                  )}
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
              /* Single Source Selected - Show Comprehensive Pipeline Detail View */
              <div className="flex flex-col h-full">
                {/* Header with Actions */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={clearSourceSelection}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="Volver a la lista"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Vista Detallada</h3>
                        <p className="text-xs text-gray-600">Pipeline completo y contenido</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSource(selectedSource.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar fuente"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* PUBLIC Tag Management - Compact */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200">
                  <button
                    onClick={async () => {
                      const newLabels = selectedSource.labels?.includes('PUBLIC')
                        ? selectedSource.labels.filter(l => l !== 'PUBLIC')
                        : [...(selectedSource.labels || []), 'PUBLIC'];
                      
                      // Update in API
                      await fetch(`/api/context-sources/${selectedSource.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include', // ✅ FIX: Include cookies for authentication
                        body: JSON.stringify({ 
                          labels: newLabels,
                          tags: newLabels,
                        }),
                      });
                      
                      // If marking as PUBLIC, assign to all agents (only active agents, not chats or archived)
                      if (newLabels.includes('PUBLIC')) {
                        const activeAgents = conversations.filter(conv => {
                          // Exclude chats
                          if (conv.isAgent === false) return false;
                          // Exclude archived
                          if (conv.status === 'archived') return false;
                          // Include agents
                          return true;
                        });
                        const allAgentIds = activeAgents.map(a => a.id);
                        for (const agentId of allAgentIds) {
                          try {
                            await fetch(`/api/context-sources/${selectedSource.id}/assign-agent`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include', // ✅ FIX: Include cookies for authentication
                              body: JSON.stringify({ agentId }),
                            });
                          } catch (error) {
                            console.warn('Failed to assign to agent:', agentId);
                          }
                        }
                        console.log(`✅ PUBLIC: asignado a ${allAgentIds.length} agentes`);
                      }
                      
                      // Reload
                      await loadFirstPage();
                    }}
                    className={`w-full p-2 rounded-lg border transition-all text-left ${
                      selectedSource.labels?.includes('PUBLIC')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        selectedSource.labels?.includes('PUBLIC')
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedSource.labels?.includes('PUBLIC') && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">PUBLIC</span>
                      <span className="text-xs text-gray-600 ml-auto">Auto-assign a nuevos agentes</span>
                    </div>
                  </button>
                </div>

                {/* Agent Assignment - Compact */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-900">Asignar a Agentes</h4>
                    <button
                      onClick={handleAssignClick}
                      disabled={isAssigning || pendingAgentIds.length < 1 || selectedSourceIds.length < 1}
                      className="px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                    >
                      {isAssigning ? 'Asignando...' : `Asignar (${selectedSourceIds.length})`}
                    </button>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {(() => {
                      // Filter to only show active agents (not chats, not archived)
                      const activeAgents = conversations.filter(conv => {
                        // Exclude chats
                        if (conv.isAgent === false) return false;
                        // Exclude archived
                        if (conv.status === 'archived') return false;
                        // Include agents (isAgent === true or undefined for legacy)
                        return true;
                      });
                      
                      if (activeAgents.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 text-center py-3">
                            No hay agentes activos. Crea un agente primero.
                          </p>
                        );
                      }
                      
                      return (
                        <>
                          {activeAgents.slice(0, 5).map(agent => (
                            <label
                              key={agent.id}
                              className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={pendingAgentIds.includes(agent.id)}
                                onChange={() => toggleAgentSelection(agent.id)}
                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                              <MessageSquare className="w-3 h-3 text-gray-600" />
                              <span className="font-medium text-gray-900 flex-1 truncate">{agent.title}</span>
                            </label>
                          ))}
                          {activeAgents.length > 5 && (
                            <p className="text-xs text-gray-500 text-center py-1">
                              +{activeAgents.length - 5} más agentes
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* MAIN: Pipeline Detail View */}
                <div className="flex-1 overflow-hidden">
                  <PipelineDetailView 
                    source={selectedSource}
                    userId={userId}
                  />
                </div>
              </div>
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
                    {(() => {
                      // Filter to only show active agents (not chats, not archived)
                      const activeAgents = conversations.filter(conv => {
                        // Exclude chats
                        if (conv.isAgent === false) return false;
                        // Exclude archived
                        if (conv.status === 'archived') return false;
                        // Include agents
                        return true;
                      });
                      
                      if (activeAgents.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 text-center py-4">
                            No hay agentes activos. Crea un agente primero.
                          </p>
                        );
                      }
                      
                      return activeAgents.map(agent => {
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
                      });
                    })()}
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
                          {(() => {
                            // Filter to only show active agents (not chats, not archived)
                            const activeAgents = conversations.filter(conv => {
                              // Only include if in pendingAgentIds
                              if (!pendingAgentIds.includes(conv.id)) return false;
                              // Exclude chats
                              if (conv.isAgent === false) return false;
                              // Exclude archived
                              if (conv.status === 'archived') return false;
                              // Include agents
                              return true;
                            });
                            
                            return (
                              <>
                                {activeAgents.slice(0, 3).map(agent => (
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
                              </>
                            );
                          })()}
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
