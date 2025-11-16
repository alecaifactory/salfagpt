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
  Folder,
  Play,
  RotateCw
} from 'lucide-react';
import type { ContextSource } from '../types/context';
import { useModalClose } from '../hooks/useModalClose';
import PipelineStatusPanel from './PipelineStatusPanel';
import PipelineDetailView from './PipelineDetailView';
import UploadProgressDetailView from './UploadProgressDetailView';

interface ContextManagementDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  userRole?: string; // NEW: To determine access level
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
  startTime?: number; // Timestamp when upload started
  elapsedTime?: number; // Elapsed time in milliseconds
  pipelineLogs?: PipelineLog[]; // Real-time pipeline execution logs
  embeddingDetails?: {
    stage: 'initializing' | 'generating' | 'embedding' | 'finalizing';
    chunksToEmbed?: number;
    currentChunk?: number;
    totalChunks?: number;
    totalTokens?: number;
    estimatedTimeSeconds?: number;
    message?: string;
  };
}

// ✅ Default concurrency limit for parallel uploads
const MAX_CONCURRENT_UPLOADS = 5; // Process 5 files simultaneously

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
  userRole,
  conversations,
  onSourcesUpdated
}: ContextManagementDashboardProps) {
  
  // 🔑 Hook para cerrar con ESC (dashboard de pantalla completa)
  const modalRef = useModalClose(isOpen, onClose, false, true, false); // No close on outside click for dashboards
  
  // Determine access level
  const SUPERADMIN_EMAILS = ['alec@getaifactory.com', 'aleclara@gmail.com'];
  const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail?.toLowerCase() || '') || userRole === 'superadmin';
  const isAdmin = userRole === 'admin';
  const isOrgScoped = isSuperAdmin || isAdmin;
  
  const [sources, setSources] = useState<EnrichedContextSource[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Organization-scoped data (for admins and superadmins)
  const [organizationsData, setOrganizationsData] = useState<any[]>([]);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  
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
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-2.5-pro'>('gemini-2.5-flash');
  const [skippedFileNames, setSkippedFileNames] = useState<Set<string>>(new Set());
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(0); // ✅ NEW: Pagination for review
  
  // ✅ NEW: Organization and domain selection for SuperAdmin uploads
  const [selectedOrgForUpload, setSelectedOrgForUpload] = useState<string>('');
  const [selectedDomainForUpload, setSelectedDomainForUpload] = useState<string>('');
  
  // ✅ NEW: Filtering and sorting controls
  const [filterByOrg, setFilterByOrg] = useState<string>(''); // SuperAdmin: filter by specific org
  const [filterByDomain, setFilterByDomain] = useState<string>(''); // Admin/SuperAdmin: filter by domain
  const [filterByTag, setFilterByTag] = useState<string>(''); // Filter by tag
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date'); // Sort order
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sort direction
  
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

  // ✅ NEW: Load organizations separately for upload dropdown
  // This ensures the "Target Organization" dropdown is populated
  // even if context sources haven't been loaded yet
  const loadOrganizationsForUpload = React.useCallback(async () => {
    try {
      console.log('🏢 Loading organizations for upload dropdown...');
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const orgs = data.organizations || [];
        
        console.log('📊 Organizations API returned:', {
          count: orgs.length,
          orgs: orgs.map((o: any) => ({ id: o.id, name: o.name }))
        });
        
        // Always update organizationsData to ensure dropdown has fresh data
        // Create basic structure that will be enriched when context sources load
        const basicOrgsData = orgs.map((org: any) => ({
          id: org.id,
          name: org.name,
          slug: org.slug || org.id, // Fallback to id if slug missing
          domains: org.domains || [], // Include domains from API if available
          totalSources: 0 // Will be counted when context sources load
        }));
        
        setOrganizationsData(prevData => {
          // If we already have context data, merge intelligently
          if (prevData.length > 0 && prevData.some(org => org.domains?.length > 0)) {
            console.log('✅ Merging with existing context data...');
            return basicOrgsData.map(newOrg => {
              const existing = prevData.find(existingOrg => existingOrg.id === newOrg.id);
              return existing && existing.domains?.length > 0 ? existing : newOrg;
            });
          }
          // Fresh load
          return basicOrgsData;
        });
        
        console.log(`✅ Loaded ${orgs.length} organizations for upload dropdown`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to load organizations:', errorData);
      }
    } catch (error) {
      console.error('❌ Error loading organizations for upload:', error);
    }
  }, []); // No dependencies - safe to call anytime

  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      loadOrganizationsForUpload();
    }
  }, [isOpen, isSuperAdmin, loadOrganizationsForUpload]);

  // ✅ NEW: Filtered and sorted organizations data
  const filteredOrganizationsData = useMemo(() => {
    if (!isOrgScoped || organizationsData.length === 0) return [];
    
    let filtered = [...organizationsData];
    
    // Filter by organization (SuperAdmin only)
    if (filterByOrg) {
      filtered = filtered.filter(org => org.id === filterByOrg);
    }
    
    // Filter by domain
    if (filterByDomain) {
      filtered = filtered.map(org => ({
        ...org,
        domains: org.domains.filter((d: any) => d.domainId === filterByDomain)
      })).filter(org => org.domains.length > 0);
    }
    
    // Filter by tag (filter sources within domains)
    // ✅ FIX: Only filter if domains have sources array
    if (filterByTag) {
      filtered = filtered.map(org => ({
        ...org,
        domains: org.domains.map((domain: any) => {
          // Skip if domain doesn't have sources yet
          if (!domain.sources || !Array.isArray(domain.sources)) {
            return { ...domain, sources: [], sourceCount: 0 };
          }
          
          return {
            ...domain,
            sources: domain.sources.filter((s: any) => 
              s.labels && s.labels.includes(filterByTag)
            ),
            sourceCount: domain.sources.filter((s: any) => 
              s.labels && s.labels.includes(filterByTag)
            ).length
          };
        }).filter((d: any) => d.sourceCount > 0),
        totalSources: org.domains.reduce((sum: number, d: any) => 
          sum + (d.sources?.filter((s: any) => s.labels && s.labels.includes(filterByTag)).length || 0), 0
        )
      })).filter(org => org.totalSources > 0);
    }
    
    // Sort sources within each domain
    // ✅ FIX: Only process domains that have sources array (context data loaded)
    filtered = filtered.map(org => ({
      ...org,
      domains: org.domains.map((domain: any) => {
        // If domain doesn't have sources array yet (basic org data only), skip sorting
        if (!domain.sources || !Array.isArray(domain.sources)) {
          return domain;
        }
        
        const sortedSources = [...domain.sources].sort((a: any, b: any) => {
          let comparison = 0;
          
          switch (sortBy) {
            case 'date':
              const dateA = a.addedAt instanceof Date ? a.addedAt : new Date(a.addedAt);
              const dateB = b.addedAt instanceof Date ? b.addedAt : new Date(b.addedAt);
              comparison = dateB.getTime() - dateA.getTime();
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'size':
              const sizeA = a.metadata?.originalFileSize || 0;
              const sizeB = b.metadata?.originalFileSize || 0;
              comparison = sizeB - sizeA;
              break;
          }
          
          return sortDirection === 'asc' ? -comparison : comparison;
        });
        
        return { ...domain, sources: sortedSources };
      })
    }));
    
    return filtered;
  }, [organizationsData, filterByOrg, filterByDomain, filterByTag, sortBy, sortDirection, isOrgScoped]);

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
    setOrganizationsData([]);
    setCurrentPage(0);
    
    try {
      // Check if we should load organization-scoped data
      if (isOrgScoped) {
        console.log('🏢 Loading organization-scoped context sources...');
        const response = await fetch('/api/context-sources/by-organization', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrganizationsData(data.organizations || []);
          setTotalCount(data.metadata?.totalSources || 0);
          
          console.log('✅ Loaded context for', data.organizations?.length || 0, 'organizations');
          console.log('📊 Total sources:', data.metadata?.totalSources || 0);
          
          // Extract all unique tags from sources across all orgs
          const tagsSet = new Set<string>();
          data.organizations?.forEach((org: any) => {
            org.domains?.forEach((domain: any) => {
              domain.sources?.forEach((source: any) => {
                if (source.labels && Array.isArray(source.labels)) {
                  source.labels.forEach((tag: string) => tagsSet.add(tag));
                }
              });
            });
          });
          setAllTags(Array.from(tagsSet).sort());
          console.log('🏷️ Found', tagsSet.size, 'unique tags across all organizations');
          
          // Auto-expand first organization for better UX
          if (data.organizations && data.organizations.length > 0) {
            setExpandedOrgs(new Set([data.organizations[0].id]));
          }
        } else {
          console.error('❌ Failed to load organization context:', response.status);
        }
      } else {
        // Regular user: Load their own context sources
        console.log('👤 Loading user context sources...');
        
        // Load folder structure
        const structureResponse = await fetch('/api/context-sources/folder-structure', {
          credentials: 'include',
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
          credentials: 'include',
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

  // ✅ NEW: Double approval dialog for files >100MB (defined before handleFileSelect)
  const handleHugeFileApproval = async (hugeFiles: File[]): Promise<boolean> => {
    const totalSizeMB = hugeFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    const fileList = hugeFiles.map(f => `  • ${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join('\n');
    
    return new Promise<boolean>((resolve) => {
      const dialog = document.createElement('div');
      
      // First approval dialog
      const showFirstDialog = () => {
        dialog.innerHTML = `
          <div class="fixed inset-0 z-[70] bg-black bg-opacity-60 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-4 border-red-500">
              <!-- Header with strong warning -->
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-red-600">⚠️ EXCESSIVE FILE SIZE WARNING</h3>
                  <p class="text-sm text-gray-600 font-medium">Files exceed recommended 100MB limit</p>
                </div>
              </div>
              
              <!-- File list -->
              <div class="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p class="text-sm font-semibold text-red-800 mb-2">
                  ${hugeFiles.length} file(s) - Total: ${totalSizeMB.toFixed(1)} MB
                </p>
                <div class="text-xs text-red-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">${fileList}</div>
              </div>
              
              <!-- Warnings -->
              <div class="space-y-3 mb-6">
                <div class="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="text-xs text-yellow-800">
                    <p class="font-semibold mb-1">Processing Time</p>
                    <p>These files may take 5-15 minutes EACH to process</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <div class="text-xs text-yellow-800">
                    <p class="font-semibold mb-1">Resource Usage</p>
                    <p>High memory and CPU usage - may slow down browser</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div class="text-xs text-yellow-800">
                    <p class="font-semibold mb-1">Cost Impact</p>
                    <p>Large files consume more AI tokens - higher processing cost</p>
                  </div>
                </div>
              </div>
              
              <!-- Recommendation -->
              <div class="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <p class="text-sm font-bold text-blue-800 mb-2">💡 Recommended Alternative:</p>
                <ul class="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                  <li>Compress PDF using Adobe Acrobat or online tools</li>
                  <li>Split large manual into chapters/sections</li>
                  <li>Remove unnecessary scanned images</li>
                  <li>Target: <100MB for optimal performance</li>
                </ul>
              </div>
              
              <!-- Action buttons - DOUBLE APPROVAL -->
              <div class="space-y-2">
                <!-- First approval: Strong warning button -->
                <button 
                  data-action="approve-step-1"
                  class="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-bold transition-colors border-2 border-yellow-700"
                >
                  ⚠️ I Understand the Risks - Proceed to Final Approval
                </button>
                
                <!-- Cancel (default) -->
                <button 
                  data-action="cancel"
                  class="w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-semibold transition-colors"
                >
                  Cancel - I'll compress these files first (recommended)
                </button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(dialog);
      };
      
      // Second approval dialog
      const showSecondDialog = () => {
        dialog.innerHTML = `
          <div class="fixed inset-0 z-[70] bg-black bg-opacity-60 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-4 border-red-600 animate-pulse-border">
              <!-- Final confirmation header -->
              <div class="text-center mb-6">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 class="text-2xl font-bold text-red-600 mb-2">FINAL CONFIRMATION</h3>
                <p class="text-sm text-gray-700 font-medium">Are you absolutely sure?</p>
              </div>
              
              <!-- Summary -->
              <div class="mb-6 p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <p class="text-sm font-bold text-gray-900 mb-2">You are about to process:</p>
                <ul class="text-xs text-gray-700 space-y-1">
                  <li>📊 <strong>${hugeFiles.length} file(s)</strong> exceeding 100MB</li>
                  <li>💾 <strong>Total size:</strong> ${totalSizeMB.toFixed(1)} MB</li>
                  <li>⏱️ <strong>Est. time:</strong> ${(hugeFiles.length * 10).toFixed(0)}-${(hugeFiles.length * 15).toFixed(0)} minutes</li>
                  <li>💰 <strong>Est. cost:</strong> Higher than normal</li>
                </ul>
              </div>
              
              <!-- Final warning -->
              <div class="mb-6 p-3 bg-red-50 border-2 border-red-300 rounded">
                <p class="text-xs text-red-800 font-semibold text-center">
                  ⚠️ This action cannot be cancelled once started ⚠️
                </p>
              </div>
              
              <!-- Final approval button -->
              <div class="space-y-2">
                <button 
                  data-action="final-approve"
                  class="w-full px-4 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 text-base font-bold transition-colors shadow-lg border-2 border-red-700"
                >
                  ✅ APPROVE >100MB FILE PROCESSING
                </button>
                
                <button 
                  data-action="cancel"
                  class="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        `;
      };
      
      // Event handler
      const handleClick = (e: Event) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action') || target.closest('button')?.getAttribute('data-action');
        
        if (action === 'cancel') {
          document.body.removeChild(dialog);
          resolve(false);
        } else if (action === 'approve-step-1') {
          showSecondDialog();
        } else if (action === 'final-approve') {
          document.body.removeChild(dialog);
          console.log('🚨 USER APPROVED EXCESSIVE FILE SIZE PROCESSING');
          console.log(`   Files: ${hugeFiles.map(f => f.name).join(', ')}`);
          console.log(`   Total size: ${totalSizeMB.toFixed(1)} MB`);
          resolve(true);
        }
      };
      
      showFirstDialog();
      dialog.addEventListener('click', handleClick);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // ✅ IMPROVED: Filter out previously skipped files before processing
    let filesArray = Array.from(files);
    
    // Remove files that user previously skipped
    if (skippedFileNames.size > 0) {
      const beforeCount = filesArray.length;
      filesArray = filesArray.filter(f => !skippedFileNames.has(f.name));
      const filtered = beforeCount - filesArray.length;
      
      if (filtered > 0) {
        console.log(`🚫 Filtered ${filtered} previously skipped file(s) from selection`);
        console.log(`   These files were skipped in a previous upload and won't appear again`);
      }
    }
    
    if (filesArray.length === 0) {
      console.log('ℹ️ All selected files were previously skipped - nothing to upload');
      return; // Exit early
    }
    
    // ✅ Check file sizes with smart limits
    const largeFiles = filesArray.filter(f => f.size > 50 * 1024 * 1024); // >50MB
    const hugeFiles = filesArray.filter(f => f.size > 100 * 1024 * 1024); // >100MB (require approval)
    const excessiveFiles = filesArray.filter(f => f.size > 500 * 1024 * 1024); // >500MB (absolute reject)
    
    // ✅ Absolute reject: Files >500MB
    if (excessiveFiles.length > 0) {
      const fileList = excessiveFiles.map(f => `  • ${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join('\n');
      alert(`🚫 ${excessiveFiles.length} file(s) exceed 500MB absolute limit:\n\n${fileList}\n\nThese files are too large to process. Please compress or split them.\n\nRecommended: Compress to <100MB for optimal performance.`);
      
      // Filter out excessive files
      const validFiles = filesArray.filter(f => f.size <= 500 * 1024 * 1024);
      if (validFiles.length === 0) return; // All files too large
      
      // Continue with remaining files
      return handleFileSelect(validFiles as any); // Recursive call with valid files
    }
    
    // ✅ Double approval: Files >100MB but <=500MB
    if (hugeFiles.length > 0) {
      const approved = await handleHugeFileApproval(hugeFiles);
      
      if (!approved) {
        // User declined - filter out huge files
        const validFiles = filesArray.filter(f => f.size <= 100 * 1024 * 1024);
        if (validFiles.length === 0) return; // All files too large, nothing to upload
        
        console.log(`⚠️ User declined ${hugeFiles.length} files >100MB`);
        console.log(`✅ Proceeding with ${validFiles.length} files <=100MB`);
        setStagedFiles(validFiles);
      } else {
        // User approved - allow all files including huge ones
        console.log(`✅ User approved processing ${hugeFiles.length} files >100MB`);
        console.log(`⚠️ This may take significant time and resources`);
        setStagedFiles(filesArray);
      }
    } else if (largeFiles.length > 0) {
      const fileList = largeFiles.map(f => `  • ${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join('\n');
      console.warn(`💡 ${largeFiles.length} large file(s) detected (>50MB):\n${fileList}`);
      console.warn('   These will use Gemini extraction (slower but more robust for large files)');
      console.warn('   Tip: Consider using Pro model for better quality');
      setStagedFiles(filesArray);
    } else {
      setStagedFiles(filesArray);
    }
    
    setShowUploadStaging(true);
    setStagedTags([]);
    setUploadTags(''); // Clear input for fresh tags
    setSelectedModel('gemini-2.5-flash'); // Reset to default
  };

  // ✅ OPTIMIZED: Batch duplicate check (all files at once)
  const checkForDuplicatesInFirestore = async (fileNames: string[]): Promise<Map<string, ContextSource>> => {
    try {
      const response = await fetch(
        `/api/context-sources/check-duplicates-batch`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, fileNames }),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Batch API response received:', {
          hasDuplicates: !!data.duplicates,
          hasNewFiles: !!data.newFiles,
          hasStats: !!data.stats,
        });
        console.log('📥 Raw response data:', data);
        
        // Convert array of {fileName, existingSource} to Map
        const map = new Map<string, ContextSource>();
        if (data.duplicates && Array.isArray(data.duplicates)) {
          console.log(`📋 Processing ${data.duplicates.length} duplicates from API...`);
          data.duplicates.forEach((dup: any) => {
            if (dup.fileName && dup.existingSource) {
              map.set(dup.fileName, dup.existingSource);
              console.log(`  ✅ Added duplicate: ${dup.fileName} → ${dup.existingSource.id}`);
            } else {
              console.warn(`  ⚠️ Invalid duplicate entry:`, dup);
            }
          });
        } else {
          console.warn('⚠️ No duplicates array in response or not an array:', typeof data.duplicates);
        }
        
        console.log(`📊 Created duplicate map with ${map.size} entries`);
        return map;
      } else {
        console.error(`❌ Batch API returned ${response.status}`);
        const errorText = await response.text();
        console.error(`   Error response:`, errorText);
      }
      
      console.warn('⚠️ Batch API returned non-OK status:', response.status);
      return new Map();
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      return new Map();
    }
  };

  const handleSubmitUpload = async () => {
    if (stagedFiles.length === 0) return;

    // Parse tags from input
    const tags = uploadTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // ✅ OPTIMIZED: Batch duplicate check (all at once instead of sequential)
    const totalFiles = stagedFiles.length;
    console.log(`🔍 Checking ${totalFiles} files for duplicates in Firestore (batch)...`);
    
    // Show loading state in UI
    setLoading(true);
    
    // Declare outside try block so they're accessible later
    const duplicates: Array<{ file: File; existing: ContextSource }> = [];
    let newFiles: File[] = [];

    // Filter out previously skipped files first
    const filesToCheck = stagedFiles.filter(f => !skippedFileNames.has(f.name));
    if (filesToCheck.length !== stagedFiles.length) {
      const skippedCount = stagedFiles.length - filesToCheck.length;
      console.log(`⏭️ Auto-skipping ${skippedCount} previously skipped files`);
    }
    
    try {
      console.log(`📊 Checking ${filesToCheck.length} files against database...`);
      const checkStartTime = Date.now();
      
      const fileNames = filesToCheck.map(f => f.name);
      const duplicateMap = await checkForDuplicatesInFirestore(fileNames);
      
      const checkDuration = Date.now() - checkStartTime;
      console.log(`✅ Duplicate check completed in ${checkDuration}ms`);

      for (const file of filesToCheck) {
        const existing = duplicateMap.get(file.name);
      if (existing) {
          console.log(`⚠️ Duplicate found: ${file.name} (existing ID: ${existing.id})`);
        duplicates.push({ file, existing });
      } else {
        newFiles.push(file);
      }
      }
      
      if (newFiles.length > 0) {
        console.log(`✅ ${newFiles.length} new files ready to upload`);
      }
      console.log(`📊 Duplicate check complete: ${duplicates.length} duplicates, ${newFiles.length} new files`);
    } catch (error) {
      console.error('❌ Duplicate check error:', error);
      // On error, treat all as new files (safe default)
      newFiles = [...filesToCheck];
    } finally {
      // Clear loading state
      setLoading(false);
    }

    // Handle duplicates if found
    if (duplicates.length > 0) {
      const action = await handleDuplicates(duplicates);
      
      if (action === 'cancel') {
        return; // User cancelled entire upload
      } 
      else if (action === 'skip') {
        // ✅ IMPROVED: Skip duplicates and remember them
        console.log(`⏭️ Skipping ${duplicates.length} duplicate file(s):`, 
          duplicates.map(d => d.file.name)
        );
        
        // Remember skipped files so they don't appear in future uploads
        const newSkipped = new Set(skippedFileNames);
        duplicates.forEach(dup => newSkipped.add(dup.file.name));
        setSkippedFileNames(newSkipped);
        
        console.log(`📝 Skipped files saved to memory (won't show in future uploads)`);
        console.log(`✅ Will proceed with ${newFiles.length} new files ONLY`);
        console.log(`🚫 The ${duplicates.length} skipped files will NOT be in the upload queue`);
        
        // Continue with only non-duplicate files
        // (newFiles already has non-duplicates from earlier filtering)
      } 
      else if (action === 'replace') {
        // Delete existing sources and upload with same names
        console.log(`🔄 Replacing ${duplicates.length} existing file(s)...`);
        
        for (const dup of duplicates) {
          await deleteSourceInternal(dup.existing.id);
          newFiles.push(dup.file);
        }
      } 
      else if (action === 'keep-both') {
        // Rename new files with version suffix
        console.log(`📋 Keeping both versions for ${duplicates.length} file(s)...`);
        
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

    // ✅ Show summary of what will be uploaded
    if (newFiles.length > 0) {
      console.log(`📤 Uploading ${newFiles.length} file(s):`, newFiles.map(f => f.name));
      console.log(`✅ These ${newFiles.length} files will be added to the upload queue`);
      console.log(`🚫 Skipped files will NOT appear in the queue`);
    } else {
      console.log('ℹ️ No files to upload (all duplicates were skipped)');
      
      // Close staging area
      setShowUploadStaging(false);
      setStagedFiles([]);
      setStagedTags([]);
      setUploadTags('');
      return; // Exit early
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

    // ✅ VERIFICATION: Log exactly what's being added to queue
    console.log(`➕ Adding ${newItems.length} items to upload queue`);
    console.log(`   Queue before: ${uploadQueue.length} items`);
    console.log(`   New items being added:`, newItems.map(i => i.file.name));
    
    setUploadQueue(prev => {
      const updated = [...prev, ...newItems];
      console.log(`   Queue after: ${updated.length} items`);
      console.log(`   All queued files:`, updated.map(i => i.file.name));
      return updated;
    });
    
    console.log(`🚀 Starting processQueue with ${newItems.length} new items`);
    console.log(`   Items to process:`, newItems.map(i => i.file.name));
    processQueue(newItems);
    
    // Close staging
    setShowUploadStaging(false);
    setStagedFiles([]);
    setStagedTags([]);
    setUploadTags('');
    setSelectedModel('gemini-2.5-flash'); // Reset to default
  };

  const handleDuplicates = async (duplicates: Array<{ file: File; existing: ContextSource }>): Promise<'replace' | 'keep-both' | 'skip' | 'cancel'> => {
    const count = duplicates.length;
    
    // Create custom dialog with pagination
    const choice = await new Promise<string>((resolve) => {
      let currentPage = 0;
      const itemsPerPage = 10;
      const totalPages = Math.ceil(count / itemsPerPage);
      
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4';
      
      const updateContent = () => {
        const start = currentPage * itemsPerPage;
        const end = Math.min(start + itemsPerPage, count);
        const pageItems = duplicates.slice(start, end);
        
        const filesList = pageItems.map((d, idx) => {
          const globalIdx = start + idx;
          const uploadDate = d.existing.metadata?.extractionDate 
            ? new Date(d.existing.metadata.extractionDate).toLocaleDateString()
            : 'Unknown date';
          const sizeMB = (d.file.size / 1024 / 1024).toFixed(1);
          return `<div class="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs border border-gray-200">
            <span class="text-gray-400 font-mono">${globalIdx + 1}</span>
            <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">${d.file.name}</p>
              <p class="text-gray-500">${sizeMB} MB · Uploaded: ${uploadDate}</p>
            </div>
          </div>`;
        }).join('');
        
        const paginationTop = totalPages > 1 ? `
          <div class="flex items-center justify-between px-2 py-1 bg-blue-50 rounded text-xs mb-2">
            <span class="text-blue-700 font-medium">
              Showing ${start + 1}-${end} of ${count}
            </span>
            <div class="flex items-center gap-2">
              <button 
                data-nav="prev" 
                ${currentPage === 0 ? 'disabled' : ''}
                class="px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span class="text-blue-700 font-semibold">
                Page ${currentPage + 1}/${totalPages}
              </span>
              <button 
                data-nav="next"
                ${currentPage === totalPages - 1 ? 'disabled' : ''}
                class="px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        ` : '';
        
        const pageButtons = totalPages > 1 && totalPages <= 10 ? `
          <div class="flex items-center justify-center gap-1 mt-2">
            ${Array.from({ length: totalPages }, (_, i) => `
              <button
                data-page="${i}"
                class="w-6 h-6 rounded text-xs font-semibold transition-colors ${
                  currentPage === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                }"
              >
                ${i + 1}
              </button>
            `).join('')}
          </div>
        ` : '';
        
      dialog.innerHTML = `
          <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="flex items-center gap-3 p-6 pb-4 border-b border-gray-200 flex-shrink-0">
              <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900">Duplicate Files Detected</h3>
                <p class="text-xs text-gray-600 mt-0.5">${count} file${count > 1 ? 's' : ''} already exist${count > 1 ? '' : 's'}</p>
              </div>
            </div>
            
            <!-- Files List - Scrollable -->
            <div class="flex-1 overflow-y-auto p-6 pt-3">
              ${paginationTop}
              <div class="space-y-1">
                ${filesList}
              </div>
              ${pageButtons}
            </div>
            
            <!-- Actions - Fixed at Bottom -->
            <div class="p-6 pt-4 border-t border-gray-200 space-y-2 bg-gray-50 flex-shrink-0">
              <button 
                data-action="skip" 
                class="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                Skip duplicates (recommended)
              </button>
              
              <button 
                data-action="replace" 
                class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Replace with new version
              </button>
              
              <button 
                data-action="keep-both" 
                class="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Keep both (add -v${count})
              </button>
              
              <button 
                data-action="cancel" 
                class="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Cancel upload
              </button>
            
              <!-- Info Tip -->
              <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Skipping duplicates will only upload new files, saving time and avoiding re-processing.
              </p>
            </div>
          </div>
        </div>
      `;
      };
      
      updateContent();
      document.body.appendChild(dialog);
      
      dialog.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        // Handle navigation
        const nav = target.getAttribute('data-nav') || target.closest('button')?.getAttribute('data-nav');
        if (nav === 'prev' && currentPage > 0) {
          currentPage--;
          updateContent();
          return;
        }
        if (nav === 'next' && currentPage < totalPages - 1) {
          currentPage++;
          updateContent();
          return;
        }
        
        // Handle page number clicks
        const pageNum = target.getAttribute('data-page') || target.closest('button')?.getAttribute('data-page');
        if (pageNum !== null) {
          currentPage = parseInt(pageNum);
          updateContent();
          return;
        }
        
        // Handle action buttons
        const action = target.getAttribute('data-action') || target.closest('button')?.getAttribute('data-action');
        if (action) {
          document.body.removeChild(dialog);
          resolve(action);
        }
      });
    });
    
    return choice as 'replace' | 'keep-both' | 'skip' | 'cancel';
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

  // ✅ NEW: Extract processing logic into separate function for parallel execution
  const processItem = async (item: UploadQueueItem) => {
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

      // ✨ Smooth incremental progress through ALL stages
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
      formData.append('model', selectedModel); // ✅ Use selected model (Flash or Pro)
      formData.append('extractionMethod', 'vision-api'); // ✅ Use Vision API for PDFs
      
      // ✅ NEW: Include organization and domain for SuperAdmin uploads
      if (selectedOrgForUpload) {
        formData.append('organizationId', selectedOrgForUpload);
        console.log(`   📍 Uploading to organization: ${selectedOrgForUpload}`);
      }
      if (selectedDomainForUpload) {
        formData.append('domainId', selectedDomainForUpload);
        console.log(`   📍 Uploading to domain: ${selectedDomainForUpload}`);
      }

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
        // ✅ IMPROVED: Capture actual error message from API
        let errorMessage = 'Upload failed';
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // Add helpful context
          if (errorMessage.includes('too large')) {
            const fileSizeMB = (item.file.size / (1024 * 1024)).toFixed(1);
            errorMessage = `File too large: ${fileSizeMB} MB. ${errorMessage}`;
          }
          
          console.error(`❌ API error for ${item.file.name}:`, errorData);
        } catch (e) {
          console.error(`❌ HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`);
        }
        throw new Error(errorMessage);
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Extraction failed');
      }

      // ✅ Capture pipeline logs from API response
      const pipelineLogs = uploadData.pipelineLogs || [];
      console.log(`📋 Captured ${pipelineLogs.length} pipeline logs for ${item.file.name}`);

      // API complete! Transition smoothly to next stage
      // First jump to end of Extract stage
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id ? { 
          ...i, 
          status: 'processing', 
          progress: 48,
          pipelineLogs // ✅ Store logs in upload item
        } : i
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
          organizationId: selectedOrgForUpload || undefined, // ✅ NEW: Organization for SuperAdmin uploads
          domainId: selectedDomainForUpload || undefined, // ✅ NEW: Domain for SuperAdmin uploads
          metadata: {
            ...uploadData.metadata,
            model: item.model || 'gemini-2.5-flash', // Save model used
            uploaderEmail: userEmail, // ✅ Track who uploaded
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
              chunkSize: 2000, // Optimal for technical procedures (keeps sections together)
              overlap: 500,    // Maximum context continuity (prevents information loss at boundaries)
            }),
          });

          const ragData = await ragResponse.json();
          
          if (ragResponse.ok && ragData.success) {
            console.log('✅ RAG pipeline completed successfully:', ragData);
            console.log(`   Chunks created: ${ragData.chunksCreated || ragData.chunksCount}`);
            console.log(`   Total tokens: ${ragData.totalTokens}`);
            console.log(`   Indexing time: ${ragData.indexingTime}ms`);
            
            // ✅ Append RAG pipeline logs to existing logs
            const ragPipelineLogs = ragData.pipelineLogs || [];
            console.log(`📋 Appending ${ragPipelineLogs.length} RAG pipeline logs`);
            
            // ✅ ENHANCED: Highly detailed embedding progress feedback
            const chunksToEmbed = ragData.chunksCreated || ragData.chunksCount;
            const totalTokens = ragData.totalTokens;
            
            console.log(`🔍 Embedding stage starting for: ${item.file.name}`);
            console.log(`   Chunks to embed: ${chunksToEmbed}`);
            console.log(`   Total tokens: ${totalTokens?.toLocaleString()}`);
            console.log(`   Estimated time: ${Math.ceil(chunksToEmbed * 2)}s (${chunksToEmbed} chunks × ~2s each)`);
            
            // Chunk complete, moving to Embed (75%)
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { 
                ...i, 
                progress: 75,
                pipelineLogs: [...(i.pipelineLogs || []), ...ragPipelineLogs], // ✅ Merge RAG logs
                embeddingDetails: {
                  stage: 'initializing',
                  chunksToEmbed,
                  totalTokens,
                  estimatedTimeSeconds: chunksToEmbed * 2
                }
              } : i
            ));
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // ✅ Micro-progress: Embedding initialization (77-85%)
            console.log(`  🔄 Initializing embedding service...`);
            for (let p = 77; p <= 85; p += 2) {
              await new Promise(resolve => setTimeout(resolve, 200));
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { 
                  ...i, 
                  progress: p,
                  embeddingDetails: {
                    ...i.embeddingDetails,
                    stage: 'initializing'
                  }
                } : i
              ));
            }
            
            console.log(`  ⏳ Embedding in progress... (may take ${chunksToEmbed * 2}s for ${chunksToEmbed} chunks)`);
            
            // ✅ Micro-progress: Generating vectors (85-92%)
            console.log(`  🔄 Generating embedding vectors...`);
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { 
                ...i, 
                embeddingDetails: {
                  ...i.embeddingDetails,
                  stage: 'generating'
                }
              } : i
            ));
            
            for (let p = 86; p <= 92; p += 1) {
              await new Promise(resolve => setTimeout(resolve, 400));
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { 
                  ...i, 
                  progress: p,
                  embeddingDetails: {
                    ...i.embeddingDetails,
                    stage: 'generating'
                  }
                } : i
              ));
            }
            
            // ✅ CRITICAL: Detailed micro-progress for 92-98% (where users see "stuck")
            console.log(`  🔍 Embedding vectors for ${chunksToEmbed} chunks...`);
            
            // Simulate chunk-by-chunk embedding progress
            const progressPerChunk = 6 / chunksToEmbed; // 6% total (92% to 98%)
            
            for (let chunk = 0; chunk < chunksToEmbed; chunk++) {
              const currentProgress = 92 + (chunk * progressPerChunk);
              
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { 
                  ...i, 
                  progress: Math.min(currentProgress, 97.9),
                  embeddingDetails: {
                    ...i.embeddingDetails,
                    stage: 'embedding',
                    currentChunk: chunk + 1,
                    totalChunks: chunksToEmbed,
                    message: `Embedding chunk ${chunk + 1}/${chunksToEmbed}`
                  }
                } : i
              ));
              
              // Log every 5th chunk or last chunk
              if (chunk % 5 === 0 || chunk === chunksToEmbed - 1) {
                console.log(`    📦 Embedding chunk ${chunk + 1}/${chunksToEmbed} (${currentProgress.toFixed(1)}%)`);
              }
              
              // Faster updates for small chunks, slower for many chunks
              const delayMs = chunksToEmbed > 20 ? 100 : 200;
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            
            console.log(`  ⏳ Finalizing embeddings...`);
            
            // Final embedding step (98-99%)
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { 
                ...i, 
                progress: 98,
                embeddingDetails: {
                  ...i.embeddingDetails,
                  stage: 'finalizing'
                }
              } : i
            ));
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { ...i, progress: 99 } : i
            ));
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
              console.log(`✅ Embedding complete for: ${item.file.name}`);
            } else {
              console.warn('⚠️ RAG pipeline failed or returned error:', ragData);
              console.warn('   Error:', ragData.error || ragData.message);
              console.warn('   Response status:', ragResponse.status);
              console.warn('   ℹ️ Document will be available in Full-text mode only');
              
              // Update error message in UI so user knows
              setUploadQueue(prev => prev.map(i => 
                i.id === item.id ? { 
                  ...i, 
                  progress: 95,
                  error: `⚠️ RAG indexing failed: ${ragData.error || ragData.message || 'Unknown error'}. Document saved in full-text mode.`
                } : i
              ));
            }
          } catch (error) {
            console.error('❌ RAG auto-trigger exception:', error);
            console.warn('   ℹ️ Document will be available in Full-text mode only');
            console.warn('   ℹ️ Users can manually trigger RAG indexing later from Context Management');
            
            // Update error message in UI
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id ? { 
                ...i, 
                progress: 95,
                error: `⚠️ RAG indexing exception: ${error instanceof Error ? error.message : 'Unknown'}. Document saved in full-text mode.`
              } : i
            ));
          }
        } else {
          // No RAG, skip to 95%
          console.log('ℹ️ RAG auto-indexing skipped (no extracted text or sourceId)');
          setUploadQueue(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress: 95 } : i
          ));
        }

      // ✅ CRITICAL FIX: Always complete to 100% regardless of embedding success
      // This prevents UI from getting stuck at 92-95%
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
      
      // ✅ Reload sources list so completed upload appears immediately
      console.log('✅ Upload complete, reloading sources list...');
      await loadFirstPage();

    } catch (error) {
      console.error('Upload failed:', item.file.name, error);
      if (smoothProgressInterval) clearInterval(smoothProgressInterval);
      if (elapsedTimeInterval) clearInterval(elapsedTimeInterval);
      
      // ✅ Preserve pipelineLogs for debugging failed uploads
      setUploadQueue(prev => prev.map(i => {
        if (i.id === item.id) {
          // Keep existing logs and add failure log
          const existingLogs = i.pipelineLogs || [];
          const failureLog = {
            step: 'error',
            status: 'error',
            message: error instanceof Error ? error.message : 'Upload failed',
            timestamp: new Date(),
            details: error
          };
          
          return {
            ...i, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Upload failed',
            elapsedTime: Date.now() - startTime,
            pipelineLogs: [...existingLogs, failureLog] // ✅ Preserve logs + add error
          };
        }
        return i;
      }));
    }
  };

  // ✅ NEW: Process queue with parallel batches
  const processQueue = async (items: UploadQueueItem[]) => {
    setIsUploading(true);

    // Process in batches of MAX_CONCURRENT_UPLOADS
    for (let i = 0; i < items.length; i += MAX_CONCURRENT_UPLOADS) {
      const batch = items.slice(i, i + MAX_CONCURRENT_UPLOADS);
      
      const batchNum = Math.floor(i / MAX_CONCURRENT_UPLOADS) + 1;
      const totalBatches = Math.ceil(items.length / MAX_CONCURRENT_UPLOADS);
      
      console.log(`🚀 Processing batch ${batchNum}/${totalBatches}: ${batch.length} files in parallel`);
      console.log(`   Files: ${batch.map(b => b.file.name).join(', ')}`);
      
      // ✅ PARALLEL: All files in this batch process simultaneously
      await Promise.allSettled(
        batch.map(item => processItem(item))
      );
      
      console.log(`✅ Batch ${batchNum}/${totalBatches} complete`);
    }
    
    setIsUploading(false);
    await loadFirstPage(); // Reload sources
    
    const completed = uploadQueue.filter(i => i.status === 'complete').length;
    const failed = uploadQueue.filter(i => i.status === 'failed').length;
    console.log(`✅ All uploads complete! Success: ${completed}, Failed: ${failed}`);
  };

  // ✅ NEW: Force start a queued item
  const handleForceStart = async (itemId: string) => {
    const item = uploadQueue.find(i => i.id === itemId);
    if (!item || item.status !== 'queued') return;
    
    console.log(`⚡ Force starting upload for: ${item.file.name}`);
    await processItem(item);
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
          
          // ✅ Reload sources list so completed upload appears immediately
          console.log('✅ Upload complete (polling), reloading sources list...');
          await loadFirstPage();
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

  const handleReupload = async (queueItemId: string, resumeFromCheckpoint: boolean = true) => {
    const item = uploadQueue.find(i => i.id === queueItemId);
    if (!item) return;
    
    // ✅ NEW: Check for checkpoint before retrying
    if (resumeFromCheckpoint) {
      try {
        const checkpointResponse = await fetch(
          `/api/context-sources/check-checkpoint?userId=${userId}&fileName=${encodeURIComponent(item.file.name)}`,
          { credentials: 'include' }
        );
        
        if (checkpointResponse.ok) {
          const checkpointInfo = await checkpointResponse.json();
          
          if (checkpointInfo.exists && checkpointInfo.resumable) {
            console.log('💾 CHECKPOINT AVAILABLE FOR RESUME');
            console.log(`   Progress: ${checkpointInfo.completedSections}/${checkpointInfo.totalSections} sections (${checkpointInfo.progress}%)`);
            console.log(`   Time saved: ~${checkpointInfo.timeSaved}s`);
            console.log(`   Cost saved: ~$${checkpointInfo.costSaved.toFixed(2)}`);
            console.log('   🚀 Will resume from checkpoint...\n');
            
            // Show user-friendly message
            const confirmResume = confirm(
              `Checkpoint detectado! 🎉\n\n` +
              `Progreso guardado: ${checkpointInfo.completedSections}/${checkpointInfo.totalSections} secciones (${checkpointInfo.progress.toFixed(1)}%)\n\n` +
              `Al reanudar ahorrarás:\n` +
              `⏱️ Tiempo: ~${checkpointInfo.timeSaved}s\n` +
              `💰 Costo: ~$${checkpointInfo.costSaved.toFixed(2)}\n\n` +
              `¿Reanudar desde el checkpoint?`
            );
            
            if (!confirmResume) {
              console.log('   User chose to start fresh (ignore checkpoint)');
              resumeFromCheckpoint = false; // Start from scratch
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not check for checkpoint, proceeding with normal retry:', error);
      }
    }
    
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
                        setReviewPage(0); // Reset pagination
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Files preview - PAGINATED */}
                  <div className="space-y-2">
                    {/* Pagination controls - Top */}
                    {stagedFiles.length > 10 && (
                      <div className="flex items-center justify-between px-2 py-1 bg-blue-50 rounded text-xs">
                        <span className="text-blue-700 font-medium">
                          Showing {reviewPage * 10 + 1}-{Math.min((reviewPage + 1) * 10, stagedFiles.length)} of {stagedFiles.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                            disabled={reviewPage === 0}
                            className="px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            ← Prev
                          </button>
                          <span className="text-blue-700 font-semibold">
                            Page {reviewPage + 1}/{Math.ceil(stagedFiles.length / 10)}
                          </span>
                          <button
                            onClick={() => setReviewPage(Math.min(Math.ceil(stagedFiles.length / 10) - 1, reviewPage + 1))}
                            disabled={(reviewPage + 1) * 10 >= stagedFiles.length}
                            className="px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Files list - Max 10 per page */}
                    <div className="max-h-96 overflow-y-auto space-y-1">
                      {stagedFiles
                        .slice(reviewPage * 10, (reviewPage + 1) * 10)
                        .map((file, idx) => {
                          const globalIdx = reviewPage * 10 + idx;
                          return (
                            <div key={globalIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                              <span className="text-gray-400 font-mono">{globalIdx + 1}</span>
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                        <span className="flex-1 truncate font-medium text-gray-900">{file.name}</span>
                              <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                          );
                        })}
                    </div>
                    
                    {/* Pagination controls - Bottom */}
                    {stagedFiles.length > 10 && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {Array.from({ length: Math.ceil(stagedFiles.length / 10) }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setReviewPage(i)}
                            className={`w-6 h-6 rounded text-xs font-semibold transition-colors ${
                              reviewPage === i
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Organization Selection (SuperAdmin only) */}
                  {isSuperAdmin && organizationsData.length > 0 && (
                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        Target Organization <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedOrgForUpload}
                        onChange={(e) => {
                          setSelectedOrgForUpload(e.target.value);
                          setSelectedDomainForUpload(''); // Reset domain when org changes
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                      >
                        <option value="">Select organization...</option>
                        {organizationsData.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.totalSources} sources)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Domain Selection (SuperAdmin only, shown when org selected) */}
                  {isSuperAdmin && selectedOrgForUpload && (
                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                        <Folder className="w-3.5 h-3.5 text-gray-600" />
                        Target Domain <span className="text-xs text-gray-500">(optional)</span>
                      </label>
                      <select
                        value={selectedDomainForUpload}
                        onChange={(e) => setSelectedDomainForUpload(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
                      >
                        <option value="">Auto-assign by uploader email</option>
                        {(() => {
                          const org = organizationsData.find(o => o.id === selectedOrgForUpload);
                          const domains = org?.domains || [];
                          return domains.map((domain: any) => (
                            <option key={domain.domainId} value={domain.domainId}>
                              {domain.domainName} ({domain.sourceCount} sources)
                            </option>
                          ));
                        })()}
                      </select>
                      {!selectedDomainForUpload && (
                        <p className="text-xs text-gray-500 mt-1">
                          Will use your email domain ({userEmail?.split('@')[1]}) or org primary domain
                        </p>
                      )}
                    </div>
                  )}

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
                      disabled={isSuperAdmin && !selectedOrgForUpload}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Upload Files
                      {isSuperAdmin && !selectedOrgForUpload && (
                        <span className="ml-2 text-xs">(Select org first)</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadStaging(false);
                        setStagedFiles([]);
                        setUploadTags('');
                        setSelectedModel('gemini-2.5-flash');
                        setSelectedOrgForUpload('');
                        setSelectedDomainForUpload('');
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Pipeline de Procesamiento ({uploadQueue.length})
                      </h3>
                      
                      {/* ✅ NEW: Status counters */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          ✓ {uploadQueue.filter(i => i.status === 'complete').length}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                          ✗ {uploadQueue.filter(i => i.status === 'failed').length}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          ⏳ {uploadQueue.filter(i => i.status === 'uploading' || i.status === 'processing').length}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold">
                          ⏸ {uploadQueue.filter(i => i.status === 'queued').length}
                        </span>
                      </div>
                    </div>
                    
                    {/* ✅ NEW: Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Retry All Failed */}
                      {uploadQueue.some(i => i.status === 'failed') && (
                        <button
                          onClick={() => {
                            const failed = uploadQueue.filter(i => i.status === 'failed');
                            console.log(`🔄 Retrying ${failed.length} failed uploads`);
                            processQueue(failed);
                          }}
                          className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                          title="Retry all failed uploads"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          Retry All Failed
                        </button>
                      )}
                      
                      {/* Start All Queued (Bulk Process) */}
                      {uploadQueue.some(i => i.status === 'queued') && (
                        <button
                          onClick={() => {
                            const queued = uploadQueue.filter(i => i.status === 'queued');
                            console.log(`⚡ Bulk starting ${queued.length} queued uploads in parallel`);
                            processQueue(queued);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                          title="Start all queued uploads in parallel"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start All ({uploadQueue.filter(i => i.status === 'queued').length})
                        </button>
                      )}
                    </div>
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
                      <div
                        key={item.id}
                        onClick={async () => {
                          // ✅ If uploading, processing, OR failed - show detail view in right panel
                          if (item.status === 'uploading' || item.status === 'processing' || item.status === 'failed') {
                            setSelectedUploadId(item.id);
                            setSelectedSourceIds([]); // Clear source selection
                            return;
                          }
                          
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
                          item.status === 'complete' ? 'hover:border-blue-400 hover:shadow-md cursor-pointer' : ''
                        } ${
                          item.status === 'failed' ? 'hover:border-red-400 hover:shadow-md cursor-pointer border-red-200' : ''
                        } ${
                          (item.status === 'uploading' || item.status === 'processing') ? 'hover:border-blue-300 cursor-pointer' : ''
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
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* ✅ NEW: Force Start button for queued items */}
                            {item.status === 'queued' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleForceStart(item.id);
                                }}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                                title="Force start this upload now"
                              >
                                <Play className="w-3 h-3" />
                                Start
                              </button>
                            )}
                            
                            {/* Elapsed time display */}
                            {item.elapsedTime !== undefined && item.status !== 'queued' && (
                              <span className={`text-xs font-mono ${
                                item.status === 'complete' ? 'text-green-600 font-bold' : 'text-blue-600'
                              }`}>
                                {item.status === 'complete' ? '✓ ' : ''}
                                {formatElapsedTime(item.elapsedTime)}
                              </span>
                            )}
                            
                            {/* ✅ NEW: Retry button for failed items */}
                            {item.status === 'failed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  processQueue([item]);
                                }}
                                className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700 transition-colors flex items-center gap-1"
                                title="Retry this upload"
                              >
                                <RotateCw className="w-3 h-3" />
                                Retry
                              </button>
                            )}
                            
                            {/* Queued badge */}
                            {item.status === 'queued' && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">
                                Queued
                              </span>
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
                                    {/* Stage Circle - with hover group for tooltip */}
                                    <div className="flex flex-col items-center gap-1.5 relative z-10 group">
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
                                      
                                      {/* Stage progress indicator (for active stage) - show decimals for >90% */}
                                      {isActive && (
                                        <span className="text-[9px] font-mono text-blue-600">
                                          {item.progress >= 90 ? item.progress.toFixed(1) : Math.round(stageProgress)}%
                                        </span>
                                      )}
                                      
                                      {/* ✅ NEW: Tooltip for Embed stage showing details */}
                                      {isActive && stage.key === 'embed' && item.embeddingDetails && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                          <div className="bg-gray-900 text-white text-[10px] rounded-lg p-2 shadow-lg whitespace-nowrap">
                                            <div className="font-bold mb-1">🔮 Embedding Progress</div>
                                            {item.embeddingDetails.currentChunk && (
                                              <div>Chunk {item.embeddingDetails.currentChunk}/{item.embeddingDetails.totalChunks}</div>
                                            )}
                                            {item.embeddingDetails.totalTokens && (
                                              <div>📊 {item.embeddingDetails.totalTokens.toLocaleString()} tokens</div>
                                            )}
                                            {item.embeddingDetails.message && (
                                              <div className="text-blue-300 mt-1">{item.embeddingDetails.message}</div>
                                            )}
                                          </div>
                                        </div>
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

                        {/* ✅ NEW: Detailed embedding progress (shown when >90%) */}
                        {item.progress >= 90 && item.progress < 100 && item.embeddingDetails && (item.status === 'uploading' || item.status === 'processing') && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                            <div className="flex items-start gap-2">
                              <Loader2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-xs font-bold text-blue-800">
                                  🔄 Embedding in Progress...
                                </p>
                                
                                {/* Current chunk being embedded */}
                                {item.embeddingDetails.currentChunk && item.embeddingDetails.totalChunks && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-blue-700">
                                      Chunk {item.embeddingDetails.currentChunk} of {item.embeddingDetails.totalChunks}
                                    </span>
                                    <span className="font-mono text-blue-600">
                                      {Math.round((item.embeddingDetails.currentChunk / item.embeddingDetails.totalChunks) * 100)}% embeddings
                                    </span>
                                  </div>
                                )}
                                
                                {/* Total tokens being embedded */}
                                {item.embeddingDetails.totalTokens && (
                                  <div className="text-[10px] text-blue-600">
                                    📊 {item.embeddingDetails.totalTokens.toLocaleString()} tokens total
                                  </div>
                                )}
                                
                                {/* Estimated time remaining */}
                                {item.embeddingDetails.estimatedTimeSeconds && item.embeddingDetails.currentChunk && (
                                  <div className="text-[10px] text-blue-700 font-medium">
                                    ⏱️ Est. {Math.ceil((item.embeddingDetails.totalChunks! - item.embeddingDetails.currentChunk) * 2)}s remaining
                                  </div>
                                )}
                                
                                {/* Stage-specific message */}
                                {item.embeddingDetails.message && (
                                  <div className="text-[10px] text-blue-600 italic mt-1">
                                    {item.embeddingDetails.message}
                                  </div>
                                )}
                                
                                {/* Heartbeat indicator */}
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-[9px] text-green-600 font-medium">System active</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Error/Warning Display */}
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
                        
                        {/* ✅ NEW: Warning display for partial completion */}
                        {item.status === 'complete' && item.error && item.error.includes('⚠️') && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-yellow-800 mb-1">Completado con advertencia</p>
                                <p className="text-xs text-yellow-700">{item.error}</p>
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

            {/* Filters Bar (SuperAdmin & Admin) */}
            {isOrgScoped && organizationsData.length > 0 && (
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Organization Filter (SuperAdmin only) */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700">Org:</label>
                      <select
                        value={filterByOrg}
                        onChange={(e) => {
                          setFilterByOrg(e.target.value);
                          setFilterByDomain(''); // Reset domain when org changes
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="">All Organizations</option>
                        {organizationsData.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Domain Filter (appears when org selected or for Admins) */}
                  {(filterByOrg || isAdmin) && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700">Domain:</label>
                      <select
                        value={filterByDomain}
                        onChange={(e) => setFilterByDomain(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-gray-600"
                      >
                        <option value="">All Domains</option>
                        {(() => {
                          const org = organizationsData.find(o => o.id === filterByOrg || (isAdmin && o.id));
                          const domains = org?.domains || [];
                          return domains.map((domain: any) => (
                            <option key={domain.domainId} value={domain.domainId}>
                              {domain.domainName} ({domain.sourceCount})
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                  )}
                  
                  {/* Tag Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700">Tag:</label>
                    <select
                      value={filterByTag}
                      onChange={(e) => setFilterByTag(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-green-600"
                    >
                      <option value="">All Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Sort By */}
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-xs font-medium text-gray-700">Sort:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="date">Upload Date</option>
                      <option value="name">Name</option>
                      <option value="size">File Size</option>
                    </select>
                    <button
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 transition-colors"
                      title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                    
                    {/* Clear Filters */}
                    {(filterByOrg || filterByDomain || filterByTag) && (
                      <button
                        onClick={() => {
                          setFilterByOrg('');
                          setFilterByDomain('');
                          setFilterByTag('');
                        }}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
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

              {!loading && sources.length === 0 && !isOrgScoped && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No context sources found</p>
                </div>
              )}
              
              {!loading && isOrgScoped && organizationsData.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No organizations found</p>
                  <p className="text-xs text-gray-400 mt-2">Contact system administrator</p>
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

              {/* Organization-Scoped View (SuperAdmins & Admins) */}
              {!loading && isOrgScoped && filteredOrganizationsData.length > 0 && (
                <div className="space-y-4">
                  <div className="px-1 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">
                      🏢 {isSuperAdmin ? 'SuperAdmin' : 'Admin'} View - Showing {filteredOrganizationsData.length} of {organizationsData.length} organization(s)
                      {(filterByOrg || filterByDomain || filterByTag) && (
                        <span className="ml-2 text-blue-600">
                          (Filtered)
                        </span>
                      )}
                    </p>
                  </div>

                  {filteredOrganizationsData.map(org => {
                    const isOrgExpanded = expandedOrgs.has(org.id);
                    
                    return (
                      <div key={org.id} className="border-2 border-blue-300 rounded-lg overflow-hidden">
                        {/* Organization Header - Enhanced with Details */}
                        <div
                          onClick={() => {
                            const newExpanded = new Set(expandedOrgs);
                            if (isOrgExpanded) {
                              newExpanded.delete(org.id);
                            } else {
                              newExpanded.add(org.id);
                            }
                            setExpandedOrgs(newExpanded);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 px-4 py-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <ChevronRight 
                                className={`w-5 h-5 text-blue-700 transition-transform ${isOrgExpanded ? 'rotate-90' : ''}`}
                              />
                              <Globe className="w-5 h-5 text-blue-700" />
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-base font-bold text-blue-900">{org.name}</span>
                                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                    {org.totalSources}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-blue-700">
                                    {org.domainCount} domain{org.domainCount !== 1 ? 's' : ''}
                                  </span>
                                  {/* Show domain breakdown when collapsed */}
                                  {!isOrgExpanded && org.domains && org.domains.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600">
                                      <Folder className="w-3 h-3" />
                                      {org.domains.slice(0, 3).map((d: any, idx: number) => (
                                        <span key={d.domainId}>
                                          {d.domainName} ({d.sourceCount})
                                          {idx < Math.min(2, org.domains.length - 1) && ', '}
                                        </span>
                                      ))}
                                      {org.domains.length > 3 && (
                                        <span className="text-blue-500">+{org.domains.length - 3} more</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Organization Content (Domains) */}
                        {isOrgExpanded && (
                          <div className="bg-white">
                            {org.domains.map((domain: any) => {
                              const domainKey = `${org.id}-${domain.domainId}`;
                              const isDomainExpanded = expandedDomains.has(domainKey);
                              
                              return (
                                <div key={domainKey} className="border-t border-blue-200">
                                  {/* Domain Header - Enhanced with Preview */}
                                  <div
                                    onClick={() => {
                                      const newExpanded = new Set(expandedDomains);
                                      if (isDomainExpanded) {
                                        newExpanded.delete(domainKey);
                                      } else {
                                        newExpanded.add(domainKey);
                                      }
                                      setExpandedDomains(newExpanded);
                                    }}
                                    className="bg-gray-50 hover:bg-gray-100 px-6 py-2 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-1">
                                        <ChevronRight 
                                          className={`w-4 h-4 text-gray-600 transition-transform ${isDomainExpanded ? 'rotate-90' : ''}`}
                                        />
                                        <Folder className="w-4 h-4 text-gray-700" />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">{domain.domainName}</span>
                                            <span className="px-1.5 py-0.5 bg-gray-600 text-white text-xs rounded-full font-semibold">
                                              {domain.sourceCount}
                                            </span>
                                          </div>
                                          {/* Show source preview when collapsed */}
                                          {!isDomainExpanded && domain.sources && domain.sources.length > 0 && (
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                              <FileText className="w-3 h-3" />
                                              {domain.sources.slice(0, 2).map((s: any, idx: number) => (
                                                <span key={s.id} className="truncate max-w-[150px]">
                                                  {s.name}
                                                  {idx < Math.min(1, domain.sources.length - 1) && ', '}
                                                </span>
                                              ))}
                                              {domain.sources.length > 2 && (
                                                <span className="text-gray-500">
                                                  +{domain.sources.length - 2} more
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Domain Content (Sources) */}
                                  {isDomainExpanded && (
                                    <div className="p-3 space-y-2 bg-white">
                                      {domain.sources.map((source: any) => {
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
                                              {source.metadata?.uploaderEmail && (
                                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                  {source.metadata.uploaderEmail}
                                                </span>
                                              )}
                                            </div>

                                            {/* Tags */}
                                            {source.labels && source.labels.length > 0 && (
                                              <div className="mt-2 flex flex-wrap gap-1">
                                                {source.labels.map((tag: string) => (
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
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tag-Based View (Regular Users) */}
              {!loading && !isOrgScoped && sources.length > 0 && (
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
            {selectedUploadId ? (
              /* Upload in Progress Selected - Show Live Processing Detail */
              <UploadProgressDetailView
                isOpen={true}
                onClose={() => setSelectedUploadId(null)}
                uploadItem={uploadQueue.find(item => item.id === selectedUploadId)!}
                pipelineLogs={uploadQueue.find(item => item.id === selectedUploadId)?.pipelineLogs || []} // ✅ Pass actual pipeline logs
                onRetryStage={(stage) => {
                  console.log('Retry stage:', stage);
                }}
              />
            ) : selectedSourceIds.length === 0 ? (
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
