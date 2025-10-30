import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, FileText, Loader2, User, Settings, Settings as SettingsIcon, LogOut, Play, CheckCircle, XCircle, Sparkles, Pencil, Check, X as XIcon, Database, Users, UserCog, AlertCircle, Globe, Archive, ArchiveRestore, DollarSign, StopCircle, Award, BarChart3, Folder, FolderPlus, Share2, Copy, Building2, Bot, Target, TestTube, Star, ListTodo, Wand2 } from 'lucide-react';
import ContextManager from './ContextManager';
import AddSourceModal from './AddSourceModal';
import WorkflowConfigModal from './WorkflowConfigModal';
import UserSettingsModal, { type UserSettings } from './UserSettingsModal';
import ContextSourceSettingsModal from './ContextSourceSettingsModalSimple';
import ContextManagementDashboard from './ContextManagementDashboard';
import AgentManagementDashboard from './AgentManagementDashboard';
import AgentConfigurationModal from './AgentConfigurationModal';
import AgentEvaluationDashboard from './AgentEvaluationDashboard';
import EvaluationPanel from './EvaluationPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import { AgentSharingModal } from './AgentSharingModal';
import SalfaAnalyticsDashboard from './SalfaAnalyticsDashboard';
import UserManagementPanel from './UserManagementPanel';
import AgentContextModal from './AgentContextModal';
import DomainManagementModal from './DomainManagementModal';
import ProviderManagementDashboard from './ProviderManagementDashboard';
import RAGConfigPanel from './RAGConfigPanel';
import RAGModeControl from './RAGModeControl';
import MessageRenderer from './MessageRenderer';
import ReferencePanel from './ReferencePanel';
import StellaMarkerTool from './StellaMarkerTool_v2';
import StellaSidebarChat from './StellaSidebarChat';
import DomainPromptModal from './DomainPromptModal'; // ✅ NEW
import AgentPromptModal from './AgentPromptModal'; // ✅ NEW
import RoadmapModal from './RoadmapModal'; // ✅ NEW: Roadmap system
import ExpertFeedbackPanel from './ExpertFeedbackPanel'; // ✅ Feedback system
import UserFeedbackPanel from './UserFeedbackPanel'; // ✅ Feedback system
import MyFeedbackView from './MyFeedbackView'; // ✅ User's own feedback tracking
import { combineDomainAndAgentPrompts } from '../lib/prompt-utils'; // ✅ FIXED: Client-safe utility
import type { Workflow, SourceType, WorkflowConfig, ContextSource } from '../types/context';
import { DEFAULT_WORKFLOWS } from '../types/context';
import type { User as UserType } from '../types/users';
import type { AgentConfiguration } from '../types/agent-config';
import type { SourceReference } from '../lib/gemini';
import type { MessageFeedback } from '../types/feedback';

// ===== SAMPLE QUESTIONS FOR AGENTS =====
// Expert-validated sample questions for each agent
const AGENT_SAMPLE_QUESTIONS: Record<string, string[]> = {
  // M001 - Asistente Legal Territorial RDI (10 sample questions)
  'M001': [
    '¿Me puedes decir la diferencia entre un Loteo DFL2 y un Loteo con Construcción Simultánea?',
    '¿Cuál es la diferencia entre condominio tipo A y tipo B?',
    '¿Qué requisitos se necesitan para aprobar un permiso de edificios?',
    '¿Es posible aprobar una fusión de terrenos que no se encuentran urbanizados?',
    '¿Es posible aprobar un condominio tipo B dentro de un permiso de edificación acogido a conjunto armónico?',
    '¿Qué pasa si el PRC permite un uso de suelo y el Plan Regulador Metropolitano de Santiago lo restringe?',
    '¿Se puede edificar sobre una franja de riesgo declarada por el MINVU si se presenta un estudio geotécnico?',
    '¿Cómo se calcula la densidad bruta en un proyecto que abarca varios roles con diferentes normas urbanísticas?',
    '¿Cuál es el procedimiento para regularizar una construcción antigua en zona no edificable?',
    '¿Qué documentos necesito presentar para solicitar un permiso de edificación en un terreno afecto a declaratoria de utilidad pública?',
  ],
  
  // S001 - GESTION BODEGAS GPT (10 sample questions)
  'S001': [
    '¿Dónde busco los códigos de materiales?',
    '¿Cómo hago un pedido de convenio?',
    '¿Cómo genero el informe de consumo de petróleo?',
    '¿Cuándo debo enviar el informe de consumo de petróleo?',
    '¿Cómo genero una guía de despacho?',
    '¿Cómo hago una solicitud de transporte?',
    '¿Qué es una ST?',
    '¿Qué es una SIM?',
    '¿Cómo se realiza un traspaso de bodega?',
    '¿Cómo puedo descargar un inventario de sistema SAP?',
  ],
};

// ===== PERFORMANCE: Context Sources Cache =====
// Cache fuentes de contexto por agente para evitar queries repetidos de 16s
interface AgentSourcesCache {
  sources: ContextSource[];
  activeIds: string[];
  timestamp: number;
}

const agentSourcesCache = new Map<string, AgentSourcesCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCachedSources(agentId: string): AgentSourcesCache | null {
  const cached = agentSourcesCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`⚡⚡⚡ CACHE HIT for agent ${agentId} - NO API call needed`);
    return cached;
  }
  return null;
}

function setCachedSources(agentId: string, sources: ContextSource[], activeIds: string[]) {
  agentSourcesCache.set(agentId, {
    sources,
    activeIds,
    timestamp: Date.now(),
  });
  console.log(`💾 Cached ${sources.length} sources for agent ${agentId}`);
}

function invalidateCache(agentId: string) {
  agentSourcesCache.delete(agentId);
  console.log(`🗑️ Cache invalidated for agent: ${agentId}`);
}

// ===== SAMPLE QUESTIONS HELPERS =====
function getAgentCode(agentTitle: string | undefined): string | null {
  if (!agentTitle) return null;
  
  // Extract agent code from title (e.g., "GESTION BODEGAS GPT (S001)" -> "S001")
  const match = agentTitle.match(/\(([MS]\d{3})\)/);
  return match ? match[1] : null;
}

function getSampleQuestions(agentCode: string | null): string[] {
  if (!agentCode) return [];
  return AGENT_SAMPLE_QUESTIONS[agentCode] || [];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinkingSteps?: ThinkingStep[];
  responseTime?: number; // Time in milliseconds to generate response
  isStreaming?: boolean; // Whether message is currently streaming
  references?: Array<{
    id: number;
    sourceId: string;
    sourceName: string;
    snippet: string;
    fullText?: string; // Full chunk text
    chunkIndex?: number; // Which chunk
    similarity?: number; // RAG similarity score (0-1)
    context?: {
      before?: string;
      after?: string;
    };
    location?: {
      page?: number;
      section?: string;
    };
    metadata?: {
      startChar?: number;
      endChar?: number;
      tokenCount?: number;
      startPage?: number;
      endPage?: number;
      isRAGChunk?: boolean; // NEW: Whether this is a RAG chunk (vs full document)
      isFullDocument?: boolean; // NEW: Whether this is the full document
    };
  }>;
}

interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
  timestamp: Date;
  dots?: number; // For animating ellipsis (0, 1, 2, 3)
}

interface ContextLog {
  id: string;
  timestamp: Date;
  userMessage: string;
  model: string;
  systemPrompt: string;
  contextSources: Array<{
    name: string;
    tokens: number;
    mode?: 'rag' | 'full-text'; // NEW: Actual mode used
  }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  contextWindowUsed: number;
  contextWindowAvailable: number;
  contextWindowCapacity: number;
  aiResponse: string;
  // NEW: RAG configuration details
  ragConfiguration?: {
    enabled: boolean;
    actuallyUsed: boolean; // Did RAG actually run?
    hadFallback: boolean; // Did it fall back to full-text?
    topK?: number;
    minSimilarity?: number;
    stats?: {
      totalChunks: number;
      totalTokens: number;
      avgSimilarity: number;
      sources: Array<{
        id: string;
        name: string;
        chunkCount: number;
        tokens: number;
      }>;
    };
  };
  // NEW: Chunk references used in response
  references?: Array<{
    id: number;
    sourceId: string;
    sourceName: string;
    chunkIndex: number;
    similarity: number;
    snippet: string;
    fullText?: string;
    metadata?: {
      startChar?: number;
      endChar?: number;
      tokenCount?: number;
      startPage?: number;
      endPage?: number;
    };
  }>;
}

interface Conversation {
  id: string;
  title: string;
  userId: string; // Owner user ID
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  contextWindowUsage: number;
  agentModel: string;
  status?: 'active' | 'archived';
  hasBeenRenamed?: boolean; // Track if user has manually renamed this agent
  agentId?: string; // NEW: Reference to parent agent (for agent-specific chats)
  folderId?: string; // NEW: Reference to project/folder
  isAgent?: boolean; // NEW: True if this is an agent, false if it's a chat
  isShared?: boolean; // NEW: True if this agent was shared with the current user
  sharedAccessLevel?: 'view' | 'edit' | 'admin'; // NEW: Access level if shared
}

interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  conversationCount: number;
}

interface ChatInterfaceWorkingProps {
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string; // ✅ NEW: User role from JWT session
}

export default function ChatInterfaceWorking({ userId, userEmail, userName, userRole }: ChatInterfaceWorkingProps) {
  // Core state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextLogs, setContextLogs] = useState<ContextLog[]>([]); // Logs for current conversation only
  const [conversationLogs, setConversationLogs] = useState<Map<string, ContextLog[]>>(new Map()); // All logs by conversation ID
  const [input, setInput] = useState('');
  const [thinkingMessageId, setThinkingMessageId] = useState<string | null>(null);
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<ThinkingStep[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); // Track which message was copied
  const [selectedReference, setSelectedReference] = useState<SourceReference | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    conversationId: string;
    conversationTitle: string;
  } | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  
  // Per-agent processing state
  const [agentProcessing, setAgentProcessing] = useState<Record<string, {
    isProcessing: boolean;
    startTime?: number;
    needsFeedback?: boolean;
  }>>({});
  
  // NEW: Left pane organization state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAgentsSection, setShowAgentsSection] = useState(false);
  const [showProjectsSection, setShowProjectsSection] = useState(false);
  const [showChatsSection, setShowChatsSection] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showAgentContextModal, setShowAgentContextModal] = useState(false);
  const [agentForContextConfig, setAgentForContextConfig] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); // Track which folders are expanded
  
  // Multi-select state for agent context modal
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  
  // NEW: Agent sharing state
  const [showAgentSharingModal, setShowAgentSharingModal] = useState(false);
  const [agentToShare, setAgentToShare] = useState<Conversation | null>(null);
  
  // ✅ NEW: Domain and Agent Prompt modals
  const [showDomainPromptModal, setShowDomainPromptModal] = useState(false);
  const [showAgentPromptModal, setShowAgentPromptModal] = useState(false);
  const [currentDomainPrompt, setCurrentDomainPrompt] = useState<string>('');
  const [currentAgentPrompt, setCurrentAgentPrompt] = useState<string>('');
  
  // Context state
  const [contextSources, setContextSources] = useState<ContextSource[]>([]);
  const [contextStats, setContextStats] = useState<{
    totalCount: number;
    activeCount: number;
  } | null>(null); // NEW: Minimal stats for display (no metadata needed!)
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [sampleQuestionIndex, setSampleQuestionIndex] = useState(0); // NEW: Carousel index
  
  // NEW: Ref to store fragment mapping for current streaming response
  const fragmentMappingRef = useRef<Array<{
    refId: number;
    chunkIndex: number;
    sourceName: string;
    similarity: number;
    tokens: number;
  }> | null>(null);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [preSelectedSourceType, setPreSelectedSourceType] = useState<SourceType | undefined>(undefined);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showContextManagement, setShowContextManagement] = useState(false);
  const [showSalfaAnalytics, setShowSalfaAnalytics] = useState(false);
  const [settingsSource, setSettingsSource] = useState<ContextSource | null>(null);
  
  // ✅ NEW: Feedback system state
  const [showExpertFeedback, setShowExpertFeedback] = useState(false);
  const [showUserFeedback, setShowUserFeedback] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [showMyFeedback, setShowMyFeedback] = useState(false);
  const [highlightTicketId, setHighlightTicketId] = useState<string | null>(null);
  
  // User Management state (SuperAdmin only)
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAgentManagement, setShowAgentManagement] = useState(false);
  const [showAgentConfiguration, setShowAgentConfiguration] = useState(false);
  const [showAgentEvaluation, setShowAgentEvaluation] = useState(false);
  const [showEvaluationSystem, setShowEvaluationSystem] = useState(false); // NEW: Full evaluation system
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false); // NEW: Roadmap modal
  const [showDomainManagement, setShowDomainManagement] = useState(false);
  const [showProviderManagement, setShowProviderManagement] = useState(false);
  const [showRAGConfig, setShowRAGConfig] = useState(false); // NEW: RAG configuration panel
  const [showStellaSidebar, setShowStellaSidebar] = useState(false); // NEW: Stella sidebar chat
  // DISABLED FULL-TEXT MODE: RAG is now the ONLY option
  // const [agentRAGMode, setAgentRAGMode] = useState<'full-text' | 'rag'>('rag'); // NEW: RAG mode per agent
  const agentRAGMode = 'rag'; // HARDCODED: Always use RAG mode
  const [ragTopK, setRagTopK] = useState(10); // Top 10 chunks (better coverage for technical docs)
  const [ragMinSimilarity, setRagMinSimilarity] = useState(0.6); // 60% similarity threshold (production setting)
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<UserType | null>(null);
  const [originalUserId, setOriginalUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  
  // Edit conversation state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Archive state
  const [showArchivedConversations, setShowArchivedConversations] = useState(false);
  const [showArchivedSection, setShowArchivedSection] = useState(false);
  const [expandedArchivedAgents, setExpandedArchivedAgents] = useState(false); // Agents folder collapsed by default
  const [expandedArchivedChats, setExpandedArchivedChats] = useState(false); // Chats folder collapsed by default
  
  // Timer state
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // User settings state
  const [globalUserSettings, setGlobalUserSettings] = useState<UserSettings>({
    preferredModel: 'gemini-2.5-flash',
    systemPrompt: 'Eres un asistente útil y profesional. Responde de manera clara y concisa.',
    language: 'es',
    theme: 'light', // Default theme
  });

  // Agent-specific config state (overrides global settings)
  const [currentAgentConfig, setCurrentAgentConfig] = useState<Partial<UserSettings> | null>(null);
  
  // Agent model selector state
  const [showAgentModelSelector, setShowAgentModelSelector] = useState(false);
  
  // Workflows state
  const [workflows, setWorkflows] = useState<Workflow[]>(
    DEFAULT_WORKFLOWS.map((w, i) => ({
      ...w,
      id: `workflow-${i}`,
      status: 'available' as const
    }))
  );
  const [configWorkflow, setConfigWorkflow] = useState<Workflow | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false); // Hidden by default

  // Panel resizing state
  const [leftPanelWidth, setLeftPanelWidth] = useState(420); // Increased from 320px to 420px for better visibility
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global ESC key handler - closes any open modal/menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close modals/menus in priority order (most specific to least specific)
        if (showExpertFeedback) setShowExpertFeedback(false);
        else if (showUserFeedback) setShowUserFeedback(false);
        else if (showMyFeedback) setShowMyFeedback(false);
        else if (showAddSourceModal) setShowAddSourceModal(false);
        else if (showUserSettings) setShowUserSettings(false);
        else if (showContextManagement) setShowContextManagement(false);
        else if (showSalfaAnalytics) setShowSalfaAnalytics(false);
        else if (showUserManagement) setShowUserManagement(false);
        else if (showAgentManagement) setShowAgentManagement(false);
        else if (showAgentConfiguration) setShowAgentConfiguration(false);
        else if (showAgentEvaluation) setShowAgentEvaluation(false);
        else if (showEvaluationSystem) setShowEvaluationSystem(false);
        else if (showAnalytics) setShowAnalytics(false);
        else if (showDomainManagement) setShowDomainManagement(false);
        else if (showProviderManagement) setShowProviderManagement(false);
        else if (showRAGConfig) setShowRAGConfig(false);
        else if (showAgentContextModal) setShowAgentContextModal(false);
        else if (showAgentSharingModal) setShowAgentSharingModal(false);
        else if (showUserMenu) setShowUserMenu(false);
        else if (showContextPanel) setShowContextPanel(false);
        else if (settingsSource) setSettingsSource(null);
        else if (selectedAgent) setSelectedAgent(null); // ✅ NEW: Deselect agent filter
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [
    showExpertFeedback,
    showUserFeedback,
    showMyFeedback,
    showAddSourceModal,
    showUserSettings,
    showContextManagement,
    showSalfaAnalytics,
    showUserManagement,
    showAgentManagement,
    showAgentConfiguration,
    showAgentEvaluation,
    showEvaluationSystem,
    showAnalytics,
    showDomainManagement,
    showProviderManagement,
    showRAGConfig,
    showAgentContextModal,
    showAgentSharingModal,
    showUserMenu,
    showContextPanel,
    settingsSource,
    selectedAgent, // ✅ NEW: Add selectedAgent to dependencies
  ]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadFolders(); // Also load folders on mount
  }, [userId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
      loadContextForConversation(currentConversation);
    }
  }, [currentConversation]);

  // AgentContextModal handles its own data loading with pagination
  // No need to pre-load context sources here

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update timer every second for active processing agents
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(250, Math.min(600, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight]);

  // NEW: Load folders from Firestore
  const loadFolders = async () => {
    try {
      console.log('📥 Cargando proyectos desde Firestore...');
      const response = await fetch(`/api/folders?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const foldersWithDates = (data.folders || []).map((f: { id: string; name: string; createdAt: string | Date; conversationCount?: number }) => ({
          id: f.id,
          name: f.name,
          createdAt: new Date(f.createdAt),
          conversationCount: f.conversationCount || 0,
        }));
        setFolders(foldersWithDates);
        
        if (foldersWithDates.length > 0) {
          console.log(`✅ ${foldersWithDates.length} proyectos cargados desde Firestore`);
          console.log('📁 Proyectos:', foldersWithDates.map((f: { name: string }) => f.name).join(', '));
        } else {
          console.log('ℹ️ No hay proyectos guardados');
        }
      }
    } catch (error) {
      console.error('❌ Error loading folders:', error);
      setFolders([]);
    }
  };

  const loadConversations = async () => {
    try {
      console.log('📥 Cargando conversaciones desde Firestore...');
      const response = await fetch(`/api/conversations?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.groups && data.groups.length > 0) {
          // Flatten all groups into a single conversation list
          const allConversations: Conversation[] = [];
          data.groups.forEach((group: any) => {
            group.conversations.forEach((conv: any) => {
              allConversations.push({
                id: conv.id,
                title: conv.title,
                userId: conv.userId || userId,
                createdAt: new Date(conv.createdAt || Date.now()),
                updatedAt: new Date(conv.updatedAt || Date.now()),
                lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt),
                messageCount: conv.messageCount || 0,
                contextWindowUsage: conv.contextWindowUsage || 0,
                agentModel: conv.agentModel || 'gemini-2.5-flash',
                status: conv.status || 'active',
                hasBeenRenamed: conv.hasBeenRenamed || false,
                isAgent: conv.isAgent !== false,
                agentId: conv.agentId,
                folderId: conv.folderId,
              });
            });
          });
          
          // NEW: Load shared agents
          try {
            console.log('🔍 Loading shared agents for userId:', userId, 'email:', userEmail);
            // ✅ Pass userEmail for backward compatibility with both ID formats
            const sharedResponse = await fetch(`/api/agents/shared?userId=${userId}&userEmail=${encodeURIComponent(userEmail || '')}`);
            console.log('   Response status:', sharedResponse.status);
            
            if (sharedResponse.ok) {
              const sharedData = await sharedResponse.json();
              console.log('   Shared agents data:', sharedData);
              
              const sharedAgents = (sharedData.agents || []).map((conv: any) => ({
                ...conv,
                isShared: true,
                hasBeenRenamed: conv.hasBeenRenamed || false,
                createdAt: new Date(conv.createdAt || Date.now()),
                updatedAt: new Date(conv.updatedAt || Date.now()),
                lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt),
              }));
              
              console.log('   Processed shared agents:', sharedAgents.length);
              sharedAgents.forEach((agent: any) => {
                console.log('     - ', agent.title, '(id:', agent.id, ')');
              });
              
              // Combine own agents with shared agents
              setConversations([...allConversations, ...sharedAgents]);
              console.log(`✅ ${allConversations.length} propios + ${sharedAgents.length} compartidos = ${allConversations.length + sharedAgents.length} total`);
            } else {
              const errorText = await sharedResponse.text();
              console.warn('   Shared agents API failed:', errorText);
              setConversations(allConversations);
            }
          } catch (sharedError) {
            console.error('Could not load shared agents:', sharedError);
            setConversations(allConversations);
          }
          
          // ✅ REMOVED: Don't auto-select - keep canvas clean on first load
          // Let user choose which agent/conversation to start with
          
          console.log(`✅ ${allConversations.length} conversaciones cargadas desde Firestore`);
          console.log(`📋 Agentes: ${allConversations.filter(c => c.isAgent !== false && c.status !== 'archived').length}`);
          console.log(`📋 Chats: ${allConversations.filter(c => c.isAgent === false && c.status !== 'archived').length}`);
        } else {
          console.log('ℹ️ No hay conversaciones guardadas');
          setConversations([]);
        }
        
        if (data.warning) {
          console.warn('⚠️', data.warning);
        }
      } else {
        console.error('❌ Error al cargar conversaciones:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error al cargar conversaciones:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('📥 [LOAD MESSAGES] Loading messages for conversation:', conversationId);
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 [LOAD MESSAGES] Received', data.messages?.length || 0, 'messages');
        
        // Transform messages: extract text from MessageContent object
        const transformedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string' 
            ? msg.content 
            : msg.content?.text || String(msg.content),
          timestamp: new Date(msg.timestamp)
        }));
        
        // Debug: Check message content lengths
        if (transformedMessages.length > 0) {
          const lastMsg = transformedMessages[transformedMessages.length - 1];
          console.log('📥 [LOAD MESSAGES] Last message role:', lastMsg.role);
          console.log('📥 [LOAD MESSAGES] Last message content length:', lastMsg.content?.length);
          console.log('📥 [LOAD MESSAGES] Last message preview:', lastMsg.content?.substring(0, 200));
        }
        
        // Debug: Check for references in loaded messages
        const messagesWithRefs = transformedMessages.filter((m: Message) => m.references && m.references.length > 0);
        if (messagesWithRefs.length > 0) {
          console.log(`📚 Loaded ${messagesWithRefs.length} messages with references`);
          messagesWithRefs.forEach((m: Message) => {
            console.log(`  Message ${m.id}: ${m.references?.length} references`);
          });
        } else {
          console.log('📚 No messages with references found in loaded history');
        }
        
        console.log('📥 [LOAD MESSAGES] Setting', transformedMessages.length, 'messages to state');
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadContextForConversation = async (conversationId: string, skipRAGVerification = true) => {
    try {
      // ✅ MINIMAL: For RAG with BigQuery, we only need IDs (not full metadata!)
      // BigQuery handles finding relevant chunks by agentId
      console.log('⚡ Loading minimal context stats (IDs only - BigQuery handles search)...');
      
      const response = await fetch(`/api/agents/${conversationId}/context-stats`);
      if (!response.ok) {
        console.warn('⚠️ Could not load context stats');
        setContextSources([]); // Clear sources - not needed for agent search
        return;
      }
      
      const data = await response.json();
      
      console.log(`✅ Context stats loaded:`, {
        totalCount: data.totalCount,
        activeCount: data.activeCount,
        activeSourceIds: data.activeContextSourceIds?.length || 0,
        loadTime: data.loadTime + 'ms',
        agentId: conversationId
      });
      
      // ✅ FIX: Create minimal ContextSource objects with just IDs and enabled flag
      // This is needed for sendMessage to build activeSourceIds array
      // We don't load extractedData (heavy) - only metadata needed for references
      const minimalSources: ContextSource[] = (data.activeContextSourceIds || []).map((id: string) => ({
        id,
        userId: userId, // ✅ FIX: Use userId from component props, not undefined session
        name: `Source ${id.substring(0, 8)}`, // Placeholder name
        type: 'pdf' as const,
        enabled: true, // All returned IDs are active
        status: 'active' as const,
        addedAt: new Date(),
        // NO extractedData - not needed for RAG references!
      }));
      
      setContextSources(minimalSources); // Minimal objects for sendMessage
      
      // ✅ NEW: Set stats for UI display
      const newStats = {
        totalCount: data.totalCount || 0,
        activeCount: data.activeCount || 0
      };
      setContextStats(newStats);
      
      console.log(`✅ Minimal context loaded: ${minimalSources.length} active sources (${data.loadTime}ms)`);
      console.log(`   IDs ready for references, BigQuery handles chunk search`);
      console.log(`   UI will show: ${data.activeCount} activas / ${data.totalCount} asignadas`);
      console.log(`   🎯 contextStats setState called with:`, newStats);
      
    } catch (error) {
      console.error('Error loading context:', error);
      setContextSources([]); // Clear on error
      setContextStats(null); // Clear stats on error
    }
  };

  const saveContextForConversation = async (conversationId: string, activeIds: string[]) => {
    try {
      await fetch(`/api/conversations/${conversationId}/context-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeContextSourceIds: activeIds })
      });
    } catch (error) {
      console.error('Error saving context:', error);
    }
  };

  /**
   * Load full context source including extractedData (on-demand)
   * Use this when you need the actual content, not just metadata
   */
  const loadFullContextSource = async (sourceId: string): Promise<ContextSource | null> => {
    try {
      const response = await fetch(`/api/context-sources/${sourceId}`);
      if (!response.ok) {
        console.error('Failed to load full context source:', sourceId);
        return null;
      }
      
      const data = await response.json();
      return data.source || null;
    } catch (error) {
      console.error('Error loading full context source:', error);
      return null;
    }
  };

  /**
   * Load full extractedData for multiple sources (used when sending messages)
   * Only loads data for sources that don't already have it
   */
  const loadFullContextSources = async (sources: ContextSource[]): Promise<ContextSource[]> => {
    console.log('📥 Loading full context data for', sources.length, 'sources...');
    
    const fullSources = await Promise.all(
      sources.map(async (source) => {
        // If already has extractedData, return as-is
        if (source.extractedData) {
          return source;
        }
        
        // Otherwise, load it
        const fullSource = await loadFullContextSource(source.id);
        return fullSource || source;
      })
    );
    
    console.log('✅ Loaded full context data');
    return fullSources;
  };

  // NEW: Load agent config for conversation
  const loadAgentConfig = async (conversationId: string) => {
    try {
      console.log('⚙️ Cargando configuración del agente para conversación:', conversationId);
      const response = await fetch(`/api/agent-config?conversationId=${conversationId}`);
      
      if (response.ok) {
        const config = await response.json();
        // Update user settings with agent-specific config (if exists)
        if (config.model || config.systemPrompt) {
          setCurrentAgentConfig({
            preferredModel: config.model || globalUserSettings.preferredModel,
            systemPrompt: config.systemPrompt || globalUserSettings.systemPrompt,
          });
          console.log('✅ Configuración del agente cargada:', config.model);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración del agente:', error);
    }
  };

  // NEW: Change model for current agent
  const changeAgentModel = async (newModel: 'gemini-2.5-flash' | 'gemini-2.5-pro') => {
    if (!currentConversation || currentConversation.startsWith('temp-')) {
      console.warn('⚠️ No se puede cambiar modelo de conversación temporal');
      return;
    }

    try {
      console.log('🔄 Cambiando modelo del agente a:', newModel);
      
      // Update local state immediately (optimistic update)
      setCurrentAgentConfig(prev => ({
        ...prev,
        preferredModel: newModel,
      }));
      
      // Save to Firestore
      const response = await fetch('/api/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation,
          userId,
          model: newModel,
          systemPrompt: currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt,
        }),
      });

      if (response.ok) {
        console.log('✅ Modelo del agente actualizado en Firestore');
      } else {
        console.error('❌ Error al guardar modelo del agente');
        // Revert on error
        setCurrentAgentConfig(prev => ({
          ...prev,
          preferredModel: prev?.preferredModel || globalUserSettings.preferredModel,
        }));
      }
    } catch (error) {
      console.error('❌ Error al cambiar modelo del agente:', error);
      // Revert on error
      setCurrentAgentConfig(prev => ({
        ...prev,
        preferredModel: prev?.preferredModel || globalUserSettings.preferredModel,
      }));
    } finally {
      setShowAgentModelSelector(false);
    }
  };

  // Load current user's roles to check for admin access (NEW)
  useEffect(() => {
    if (userEmail) {
      fetch(`/api/users?requesterEmail=${encodeURIComponent(userEmail)}`)
        .then(res => res.json())
        .then(data => {
          const foundUser = data.users?.find((u: UserType) => u.email === userEmail);
          if (foundUser) {
            setCurrentUser(foundUser);
            setCurrentUserRoles(foundUser.roles || [foundUser.role]);
            console.log('👤 Current user roles:', foundUser.roles);
          }
        })
        .catch(err => console.error('Error loading user roles:', err));
    }
  }, [userEmail]);

  // Close model selector dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAgentModelSelector) {
        setShowAgentModelSelector(false);
      }
    };

    if (showAgentModelSelector) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAgentModelSelector]);

  // Impersonation handlers (NEW)
  function handleImpersonate(user: UserType) {
    const confirmed = confirm(
      `¿Actuar como ${user.name} (${user.roles?.join(', ')})?\n\n` +
      `Verás la interfaz con los permisos de este usuario.\n` +
      `Podrás volver a tu sesión de admin en cualquier momento.`
    );

    if (!confirmed) return;

    // Store original state
    setOriginalUserId(userId);
    setIsImpersonating(true);
    setImpersonatedUser(user);
    setShowUserManagement(false);

    console.log('🎭 Impersonating user:', user.email);
    // Reload with impersonation
    window.location.href = `/chat?impersonate=${encodeURIComponent(user.email)}`;
  }

  function stopImpersonation() {
    if (!originalUserId) return;

    setIsImpersonating(false);
    setImpersonatedUser(null);
    setOriginalUserId(null);

    console.log('✅ Stopped impersonation');
    window.location.href = '/chat'; // Reload as original user
  }

  // REMOVED: Duplicate loadConversations useEffect
  // The main loadConversations is already called in the useEffect at line ~284

  // NEW: Load user settings from Firestore on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        console.log('⚙️ Cargando configuración del usuario desde Firestore...');
        const response = await fetch(`/api/user-settings?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setGlobalUserSettings(data);
          console.log('✅ Configuración del usuario cargada:', data.preferredModel);
          
          // Apply theme from Firestore (with fallback to 'light')
          const theme = data.theme || 'light';
          console.log(`🎨 Aplicando tema desde Firestore: ${theme}`);
          
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          // Sync to localStorage for consistency
          localStorage.setItem('theme', theme);
        } else {
          console.warn('⚠️ No se pudo cargar configuración del usuario, usando defaults');
          // Apply default light theme
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      } catch (error) {
        console.error('❌ Error al cargar configuración del usuario:', error);
        // Apply default light theme on error
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };
    
    loadUserSettings();
  }, [userId]);

  // NEW: Load context sources from Firestore on mount
  // Don't set contextSources here - wait until conversation is selected
  // This prevents showing all sources before filtering
  useEffect(() => {
    // Context sources will be loaded when conversation is selected
    // This prevents the "flash" of showing all sources before filtering
  }, [userId]);

  // Effect: Handle conversation change - load messages and context
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      setContextLogs([]);
      return;
    }

    // Don't load messages for temporary conversations
    if (currentConversation.startsWith('temp-')) {
      console.log('⏭️ Conversación temporal - no cargando mensajes de Firestore');
      setMessages([]);
      setContextLogs([]);
      return;
    }

    console.log('🔄 Cambiando a conversación:', currentConversation);
    
    // Load logs for this specific conversation from Map
    const logsForConversation = conversationLogs.get(currentConversation) || [];
    setContextLogs(logsForConversation);
    console.log(`📊 Cargando ${logsForConversation.length} logs para esta conversación`);
    
    // Load messages for this conversation
    loadMessages(currentConversation);
    
    // Load context configuration for this conversation
    // If this is a chat (has agentId), load parent agent's context instead
    const currentConv = conversations.find(c => c.id === currentConversation);
    if (currentConv?.agentId) {
      console.log(`🔗 Este es un chat del agente ${currentConv.agentId}, cargando contexto del agente padre`);
      
      // ✅ OPTIMIZED: Load parent agent's context (uses cache if available)
      loadContextForConversation(currentConv.agentId);
      
      // ✅ REMOVED: Auto-fix loop that assigned sources one by one (caused 90s delay)
      // New architecture: Chat inherits sources via agentId link in backend
      // Backend's context-sources-metadata endpoint uses effectiveAgentId = conv.agentId || convId
      // This means chat automatically sees parent agent's sources WITHOUT needing assignments
    } else {
      // Agent (no parent) - load own context
      loadContextForConversation(currentConversation);
    }
    
    // NEW: Load agent config for this conversation
    loadAgentConfig(currentConversation);
    
    // Reset input
    setInput('');
    
  }, [currentConversation, conversations]);

  // Helper: Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGS57OihUBELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsIGGi56+mjUhELTKXh8bllHgU2jdXvxHUnBSl+zPLaizsI');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play sound:', e));
    } catch (e) {
      console.log('Sound notification not available:', e);
    }
  };

  // Helper: Detect if AI response needs feedback
  const detectFeedbackNeeded = (content: string): boolean => {
    const feedbackKeywords = [
      'necesito más información',
      'podrías proporcionar',
      'por favor proporciona',
      'necesito que',
      'could you provide',
      'please provide',
      'i need',
      'more information',
      'clarify',
      'aclarar',
      'especificar',
      'detallar',
    ];
    
    const lowerContent = content.toLowerCase();
    return feedbackKeywords.some(keyword => lowerContent.includes(keyword));
  };

  // Helper: Format elapsed time
  const formatElapsedTime = (startTime: number): string => {
    const elapsed = Math.floor((currentTime - startTime) / 1000);
    
    if (elapsed < 60) {
      return `${elapsed}s`;
    } else if (elapsed < 3600) {
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Helper: Format response time from milliseconds
  const formatResponseTime = (ms: number): string => {
    const seconds = ms / 1000;
    
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Helper: Get parent agent for current conversation (if it's a chat)
  const getParentAgent = () => {
    if (!currentConversation) return null;
    const currentConv = conversations.find(c => c.id === currentConversation);
    if (!currentConv) return null;
    
    // If this is a chat (has agentId), return the parent agent
    if (currentConv.agentId) {
      return conversations.find(c => c.id === currentConv.agentId) || null;
    }
    
    // If this is an agent itself, return null (no parent)
    return null;
  };

  // Helper: Copy message content in Markdown format
  const copyMessageAsMarkdown = async (messageContent: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedMessageId(messageId);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      
      console.log('✅ Mensaje copiado en formato Markdown');
    } catch (error) {
      console.error('❌ Error al copiar mensaje:', error);
    }
  };

  // ✅ NEW: Submit feedback (Expert or User)
  const handleSubmitFeedback = async (feedback: Omit<MessageFeedback, 'id' | 'timestamp' | 'source'>) => {
    try {
      console.log('📝 Submitting feedback:', {
        type: feedback.feedbackType,
        messageId: feedback.messageId,
        userId: feedback.userId,
      });
      
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Feedback submitted successfully:', result);

      // Close feedback input modals
      setShowExpertFeedback(false);
      setShowUserFeedback(false);
      setFeedbackMessageId(null);

      // Show success with ticket info
      const ticketInfo = result.ticketId 
        ? `\n\n🎫 Ticket ID: ${result.ticketId.substring(0, 12)}...\n\n✨ Abriendo tu seguimiento de feedback...`
        : '';
      
      alert(`✅ ¡Feedback enviado exitosamente!${ticketInfo}`);
      
      // Open "My Feedback" view with highlighted ticket
      if (result.ticketId) {
        setHighlightTicketId(result.ticketId);
        setShowMyFeedback(true);
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al enviar feedback:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`);
    }
  };

  // NEW: Folder management functions
  const createNewFolder = async (name: string) => {
    try {
      console.log('🚀 Starting createNewFolder with name:', name);
      console.log('📋 userId:', userId);
      
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name }),
      });

      console.log('📡 API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Proyecto creado en Firestore:', data.folder.id, 'Name:', data.folder.name);
        console.log('📦 Folder data:', JSON.stringify(data.folder, null, 2));
        
        // Ensure Projects section is expanded
        setShowProjectsSection(true);
        
        // CRITICAL: Reload from Firestore to ensure persistence
        console.log('🔄 Recargando proyectos desde Firestore para verificar persistencia...');
        await loadFolders();
        console.log('✅ Proyecto creado y lista recargada desde Firestore');
      } else {
        const errorData = await response.json();
        console.error('❌ API error:', response.status, errorData);
        alert(`Error al crear proyecto: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      alert(`Error al crear proyecto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
        setEditingFolderId(null);
        setEditingFolderName('');
        console.log('✅ Folder renamed:', folderId);
      }
    } catch (error) {
      console.error('❌ Error renaming folder:', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('¿Eliminar este proyecto? Las conversaciones se moverán a Sin Proyecto.')) return;
    
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        // Update conversations to remove folderId
        setConversations(prev => prev.map(c => 
          c.folderId === folderId ? { ...c, folderId: undefined } : c
        ));
        console.log('✅ Folder deleted:', folderId);
      }
    } catch (error) {
      console.error('❌ Error deleting folder:', error);
    }
  };

  const moveChatToFolder = async (chatId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/conversations/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });

      if (response.ok) {
        setConversations(prev => prev.map(c => 
          c.id === chatId ? { ...c, folderId: folderId || undefined } : c
        ));
        console.log('✅ Chat moved to folder:', chatId, folderId);
      }
    } catch (error) {
      console.error('❌ Error moving chat to folder:', error);
    }
  };

  // NEW: Create new chat for a specific agent (inherits agent's context)
  const createNewChatForAgent = async (agentId: string) => {
    try {
      const agent = conversations.find(c => c.id === agentId);
      if (!agent) {
        console.error('❌ Agent not found:', agentId);
        return;
      }

      // Optimistic UI: Create chat placeholder immediately
      const optimisticId = `optimistic-chat-${Date.now()}`;
      const now = new Date();
      const optimisticChat: Conversation = {
        id: optimisticId,
        title: 'Nuevo Chat',
        userId: userId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        messageCount: 0,
        contextWindowUsage: 0,
        agentModel: agent.agentModel || 'gemini-2.5-flash',
        isAgent: false,
        agentId: agentId,
        status: 'active',
        hasBeenRenamed: false,
      };
      
      // Add optimistic chat to list immediately
      setConversations(prev => [optimisticChat, ...prev]);
      setCurrentConversation(optimisticId);
      setMessages([]);
      
      console.log('⚡ Chat optimista creado para agente:', agentId);

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Nuevo Chat', // Simple title, agent shown as tag
          agentId, // Link to parent agent
          isAgent: false, // Mark as chat
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newChatId = data.conversation.id;
        
        console.log('✅ Chat creado en Firestore:', newChatId, 'para agente:', agentId);
        
        // ✅ CRITICAL FIX: Update currentConversation IMMEDIATELY to prevent race condition
        // This ensures any pending messages use the real ID, not optimistic ID
        setCurrentConversation(newChatId);
        
        // ✅ OPTIMIZED INHERITANCE: Just copy activeContextSourceIds from agent to chat
        // NO need to re-assign sources - chat inherits them from parent agent via agentId link
        try {
          console.log('🔄 Heredando contexto del agente:', agentId);
          
          // Get agent's active sources (which ones are toggled ON)
          const agentContextResponse = await fetch(`/api/conversations/${agentId}/context-sources`);
          const agentContextData = agentContextResponse.ok 
            ? await agentContextResponse.json() 
            : { activeContextSourceIds: [] };
          
          const agentActiveSourceIds = agentContextData.activeContextSourceIds || [];
          
          console.log(`🎯 Fuentes activas en el agente: ${agentActiveSourceIds.length}`);
          
          // Determine which sources to activate in the new chat
          let sourcesToActivate: string[];
          
          if (agentActiveSourceIds.length > 0) {
            // Agent has sources active → inherit those
            sourcesToActivate = agentActiveSourceIds;
            console.log(`📋 Heredando ${sourcesToActivate.length} fuentes ACTIVAS del agente`);
          } else if (contextSources.length > 0) {
            // Agent has NO active sources but has assigned sources → auto-activate all
            sourcesToActivate = contextSources.map(s => s.id);
            console.log(`⚡ Auto-activando ${sourcesToActivate.length} fuentes del agente`);
          } else {
            sourcesToActivate = [];
            console.log('ℹ️ Agente sin fuentes asignadas');
          }
          
          if (sourcesToActivate.length > 0) {
            // ✅ INSTANT: Just save activeContextSourceIds (NO assignments needed)
            await fetch(`/api/conversations/${newChatId}/context-sources`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activeContextSourceIds: sourcesToActivate }),
            });
            
            console.log(`✅ ${sourcesToActivate.length} fuentes activadas (heredadas del agente)`);
            
            // ✅ Update local state immediately
            setContextSources(prev => prev.map(source => ({
              ...source,
              enabled: sourcesToActivate.includes(source.id)
            })));
            
            console.log('🔄 Listo para enviar mensajes con contexto');
          }
        } catch (contextError) {
          console.warn('⚠️ Error heredando contexto:', contextError);
        }
        
        // Get the current optimistic chat (may have been edited by user)
        const optimisticChat = conversations.find(c => c.id === optimisticId);
        const userEditedTitle = optimisticChat?.title !== 'Nuevo Chat';
        const editedTitle = optimisticChat?.title || 'Nuevo Chat';
        
        // Replace optimistic chat with real one from Firestore
        setConversations(prev => 
          prev.map(conv => conv.id === optimisticId 
            ? { ...data.conversation, 
                createdAt: new Date(data.conversation.createdAt),
                updatedAt: new Date(data.conversation.updatedAt),
                lastMessageAt: new Date(data.conversation.lastMessageAt),
                isAgent: false,
                agentId: agentId,
                title: editedTitle, // Use edited title if user changed it
                hasBeenRenamed: userEditedTitle, // Mark if user renamed
              }
            : conv
          )
        );
        
        // If user edited the title while optimistic, save it to Firestore
        if (userEditedTitle) {
          console.log(`📝 Usuario editó título mientras era optimista: "${editedTitle}"`);
          try {
            await fetch(`/api/conversations/${newChatId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                title: editedTitle,
                hasBeenRenamed: true
              })
            });
            console.log('✅ Título editado guardado en Firestore');
          } catch (titleError) {
            console.warn('⚠️ Failed to save edited title:', titleError);
          }
        }
        
        // ℹ️ currentConversation already updated at the top (line 1268) to prevent race condition
        
        // ✅ PERFORMANCE: Don't reload context - we already have it from parent agent
        // Just update cache with new chatId pointing to same sources
        const agentCache = getCachedSources(agentId);
        if (agentCache) {
          // Chat inherits agent's sources - copy cache entry
          // Use agentCache.activeIds since we inherited those from parent
          setCachedSources(newChatId, agentCache.sources, agentCache.activeIds);
          console.log(`⚡ Chat ${newChatId} heredó cache del agente ${agentId} (${agentCache.sources.length} fuentes)`);
        }
        
        console.log('✅ Chat confirmado y actualizado con ID real:', newChatId);
      } else {
        // Handle API error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error al crear chat (API):', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Remove optimistic chat since creation failed
        setConversations(prev => prev.filter(conv => conv.id !== optimisticId));
        
        // If authentication error, show user-friendly message
        if (response.status === 401) {
          alert('Sesión expirada. Por favor, recarga la página y vuelve a iniciar sesión.');
          return;
        }
        
        // For other errors, convert optimistic to temporary
        const tempId = `temp-chat-${Date.now()}`;
        const tempChat: Conversation = {
          id: tempId,
          title: 'Nuevo Chat',
          userId: userId,
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now,
          messageCount: 0,
          contextWindowUsage: 0,
          agentModel: agent.agentModel || 'gemini-2.5-flash',
          isAgent: false,
          agentId: agentId,
          status: 'active',
          hasBeenRenamed: false,
        };
        
        setConversations(prev => [tempChat, ...prev]);
        setCurrentConversation(tempId);
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      console.warn('⚠️ Chat temporal creado (no persistente)');
    }
  };

  // NEW: Create new agent (root conversation) - Complete implementation
  const createNewAgent = async () => {
    try {
      // Optimistic UI: Create a placeholder immediately
      const optimisticId = `optimistic-${Date.now()}`;
      const now = new Date();
      const optimisticAgent: Conversation = {
        id: optimisticId,
        title: 'Nuevo Agente',
        userId: userId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: now,
        messageCount: 0,
        contextWindowUsage: 0,
        agentModel: 'gemini-2.5-flash',
        isAgent: true,
        status: 'active',
        hasBeenRenamed: false,
      };
      
      // Add optimistic agent to list immediately
      setConversations(prev => [optimisticAgent, ...prev]);
      setCurrentConversation(optimisticId);
      setSelectedAgent(optimisticId);
      setMessages([]);
      
      console.log('⚡ Agente optimista creado (esperando confirmación de Firestore)');
      
      // Call API to create conversation in Firestore
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Nuevo Agente',
          isAgent: true, // Mark as agent
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newConvId = data.conversation.id;
        
        console.log('✅ Agente creado en Firestore:', newConvId);
        
        // Save initial agent config
        const initialModel = 'gemini-2.5-flash';
        await fetch('/api/agent-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: newConvId,
            userId,
            model: initialModel,
            systemPrompt: globalUserSettings.systemPrompt,
          }),
        });

        // Auto-assign PUBLIC sources
        const publicSources = contextSources.filter(s => s.tags?.includes('PUBLIC'));
        if (publicSources.length > 0) {
          const publicSourceIds = publicSources.map(s => s.id);
          
          for (const sourceId of publicSourceIds) {
            try {
              await fetch(`/api/context-sources/${sourceId}/assign-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: newConvId }),
              });
            } catch (error) {
              console.warn('⚠️ Failed to auto-assign PUBLIC source:', sourceId, error);
            }
          }
          
          await fetch(`/api/conversations/${newConvId}/context-sources`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeContextSourceIds: publicSourceIds }),
          });
        }

        // Get the current optimistic agent (may have been edited by user)
        const optimisticAgent = conversations.find(c => c.id === optimisticId);
        const userEditedTitle = optimisticAgent?.title !== 'Nuevo Agente';
        const editedTitle = optimisticAgent?.title || 'Nuevo Agente';
        
        // Replace optimistic agent with real one from Firestore
        setConversations(prev => 
          prev.map(conv => conv.id === optimisticId 
            ? { ...data.conversation, 
                createdAt: new Date(data.conversation.createdAt),
                updatedAt: new Date(data.conversation.updatedAt),
                lastMessageAt: new Date(data.conversation.lastMessageAt),
                isAgent: true,
                title: editedTitle, // Use edited title if user changed it
                hasBeenRenamed: userEditedTitle, // Mark if user renamed
              }
            : conv
          )
        );
        
        // If user edited the title while optimistic, save it to Firestore
        if (userEditedTitle) {
          console.log(`📝 Usuario editó título mientras era optimista: "${editedTitle}"`);
          try {
            await fetch(`/api/conversations/${newConvId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                title: editedTitle,
                hasBeenRenamed: true
              })
            });
            console.log('✅ Título editado guardado en Firestore');
          } catch (titleError) {
            console.warn('⚠️ Failed to save edited title:', titleError);
          }
        }
        
        // Update references to use real ID
        setCurrentConversation(newConvId);
        setSelectedAgent(newConvId);

        setCurrentAgentConfig({
          preferredModel: initialModel,
          systemPrompt: globalUserSettings.systemPrompt,
        });
        
        console.log('✅ Agente confirmado y actualizado con ID real:', newConvId);
      } else {
        // Handle API error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error al crear agente (API):', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Remove optimistic agent since creation failed
        setConversations(prev => prev.filter(conv => conv.id !== optimisticId));
        
        // If authentication error, show user-friendly message
        if (response.status === 401) {
          alert('Sesión expirada. Por favor, recarga la página y vuelve a iniciar sesión.');
          return;
        }
        
        // For other errors, convert optimistic to temporary
        const tempId = `temp-${Date.now()}`;
        const tempConv: Conversation = {
          id: tempId,
          title: 'Nuevo Agente',
          userId: userId,
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now,
          messageCount: 0,
          contextWindowUsage: 0,
          agentModel: 'gemini-2.5-flash',
          isAgent: true,
          status: 'active',
          hasBeenRenamed: false,
        };
        
        setConversations(prev => [tempConv, ...prev]);
        setCurrentConversation(tempId);
        setSelectedAgent(tempId);
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      console.warn('⚠️ Agente temporal creado (no persistente)');
    }
  };

  // NEW: Backwards compatibility - keep old function name
  const createNewConversation = createNewAgent;

  // ===== SAMPLE QUESTIONS CAROUSEL HANDLERS =====
  const handleSampleQuestionClick = (question: string) => {
    setInput(question);
    // Optionally auto-send the question
    // sendMessage();
  };

  const nextSampleQuestion = () => {
    // Get agent for this conversation (same logic as carousel display)
    const currentConv = conversations.find(c => c.id === currentConversation);
    const parentAgent = getParentAgent();
    const agentToUse = parentAgent || currentConv;
    const agentCode = getAgentCode(agentToUse?.title);
    const questions = getSampleQuestions(agentCode);
    
    if (questions.length > 0) {
      setSampleQuestionIndex((prev) => (prev + 1) % questions.length);
    }
  };

  const prevSampleQuestion = () => {
    // Get agent for this conversation (same logic as carousel display)
    const currentConv = conversations.find(c => c.id === currentConversation);
    const parentAgent = getParentAgent();
    const agentToUse = parentAgent || currentConv;
    const agentCode = getAgentCode(agentToUse?.title);
    const questions = getSampleQuestions(agentCode);
    
    if (questions.length > 0) {
      setSampleQuestionIndex((prev) => (prev - 1 + questions.length) % questions.length);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation) return;

    const requestStartTime = Date.now(); // Track request start time

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    
    // Track processing for this agent
    const agentId = currentConversation;
    // Clear previous fragment mapping for new message
    fragmentMappingRef.current = null;
    
    setAgentProcessing(prev => ({
      ...prev,
      [agentId]: {
        isProcessing: true,
        startTime: Date.now(),
        needsFeedback: false,
      }
    }));

    // Create streaming message (empty, will fill progressively)
    const streamingId = `streaming-${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      // ✅ SHOW STATUS IMMEDIATELY: Initialize thinking steps BEFORE heavy operations
      const stepLabels = {
        thinking: 'Pensando...',
        searching: 'Buscando Contexto Relevante...',
        selecting: 'Seleccionando Chunks...',
        generating: 'Generando Respuesta...'
      };

      const initialSteps: ThinkingStep[] = Object.entries(stepLabels).map(([key, label]) => ({
        id: key,
        label,
        status: key === 'thinking' ? 'active' as const : 'pending' as const,
        timestamp: new Date(),
        dots: 0
      }));

      setCurrentThinkingSteps(initialSteps);
      
      // Update streaming message with initial thinking steps
      setMessages(prev => prev.map(msg => 
        msg.id === streamingId 
          ? { ...msg, thinkingSteps: initialSteps }
          : msg
      ));
      
      // ✅ OPTIMAL: Use agent-based search - NO need to load or send source IDs!
      // BigQuery queries by agentId directly and finds relevant chunks
      
      console.log(`📊 Sending message with agent-based RAG search:`, {
        agentId: currentConversation,
        useAgentSearch: true,
        note: 'Backend queries BigQuery by agentId - no source loading needed!'
      });
      
      // Update to "searching" status (now instant - no loading needed!)
      setCurrentThinkingSteps(prev => prev.map(step => 
        step.id === 'thinking' 
          ? { ...step, status: 'complete' as const }
          : step.id === 'searching'
          ? { ...step, status: 'active' as const, timestamp: new Date() }
          : step
      ));

      // ✅ FIX: Get active source IDs for this agent (needed for references)
      const activeSourceIds = contextSources
        .filter(s => s.enabled)
        .map(s => s.id);
      
      console.log(`📊 Active sources for this agent:`, {
        count: activeSourceIds.length,
        sources: contextSources.filter(s => s.enabled).map(s => s.name)
      });
      
      // ✅ NEW: Combine domain and agent prompts
      const finalSystemPrompt = combineDomainAndAgentPrompts(
        currentDomainPrompt,
        currentAgentPrompt || currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt
      );
      
      console.log('🔗 Using combined prompt:', {
        hasDomain: !!currentDomainPrompt,
        hasAgent: !!currentAgentPrompt,
        finalLength: finalSystemPrompt.length
      });
      
      // Use streaming endpoint
      const response = await fetch(`/api/conversations/${currentConversation}/messages-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: messageToSend,
          model: currentAgentConfig?.preferredModel || globalUserSettings.preferredModel,
          systemPrompt: finalSystemPrompt, // ✅ UPDATED: Use combined prompt
          useAgentSearch: true, // ✅ OPTIMAL: Backend queries BigQuery by agentId!
          activeSourceIds: activeSourceIds, // ✅ FIX: Send for reference creation & legacy fallback
          ragEnabled: true,
          ragTopK: ragTopK,
          ragMinSimilarity: ragMinSimilarity
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let finalMessageId = '';
      let finalUserMessageId = '';

      if (reader) {
        // ✅ Thinking steps already initialized above (lines 1442-1478)
        // Just start the ellipsis animation
        const dotsInterval = setInterval(() => {
          setCurrentThinkingSteps(prev => prev.map(step => ({
            ...step,
            dots: step.status === 'active' ? ((step.dots || 0) + 1) % 4 : step.dots || 0
          })));
        }, 500);

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            clearInterval(dotsInterval);
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'thinking') {
                  // Update thinking step status
                  setCurrentThinkingSteps(prev => {
                    const updated = prev.map(step => 
                      step.id === data.step 
                        ? { ...step, status: data.status, timestamp: new Date(data.timestamp) }
                        : step
                    );
                    
                    // Immediately update the streaming message with the new steps
                    setMessages(prevMsgs => prevMsgs.map(msg => 
                      msg.id === streamingId 
                        ? { ...msg, thinkingSteps: updated }
                        : msg
                    ));
                    
                    return updated;
                  });
                } else if (data.type === 'chunks') {
                  // Store chunk information for later display
                  console.log('📊 Chunks seleccionados:', data.chunks);
                } else if (data.type === 'fragmentMapping') {
                  // NEW: Store fragment mapping for validation
                  console.log('🗺️ Fragment mapping received:', data.mapping);
                  fragmentMappingRef.current = data.mapping;
                  
                  // Log expected citations
                  const expectedCitations = data.mapping.map((m: any) => `[${m.refId}]`).join(', ');
                  console.log(`📋 Expected citations in response: ${expectedCitations}`);
                  data.mapping.forEach((m: any) => {
                    console.log(`  [${m.refId}] → Fragmento ${m.chunkIndex} (${m.sourceName}) - ${(m.similarity * 100).toFixed(1)}%`);
                  });
                } else if (data.type === 'chunk') {
                  // Append chunk to accumulated content
                  accumulatedContent += data.content;
                  
                  // Update streaming message with new content
                  setMessages(prev => prev.map(msg => 
                    msg.id === streamingId 
                      ? { ...msg, content: accumulatedContent, thinkingSteps: undefined }
                      : msg
                  ));
                } else if (data.type === 'complete') {
                  // Streaming complete
                  finalMessageId = data.messageId;
                  finalUserMessageId = data.userMessageId;
                  
                  // Debug: Check if references were received
                  console.log('✅ Message complete event received');
                  console.log('🔍 [STREAM COMPLETE] Accumulated content length:', accumulatedContent.length);
                  console.log('🔍 [STREAM COMPLETE] Content preview:', accumulatedContent.substring(0, 200));
                  console.log('📚 References in completion:', data.references?.length || 0);
                  if (data.references && data.references.length > 0) {
                    console.log('📚 Reference details:', data.references);
                  }
                  
                  // NEW: Validate citations if we have fragment mapping
                  if (fragmentMappingRef.current && fragmentMappingRef.current.length > 0) {
                    const expectedCitations = fragmentMappingRef.current.map(m => `[${m.refId}]`);
                    const foundCitations: string[] = [];
                    
                    for (const citation of expectedCitations) {
                      if (accumulatedContent.includes(citation)) {
                        foundCitations.push(citation);
                      }
                    }
                    
                    console.log('📋 Citation validation:');
                    console.log(`  Expected: ${expectedCitations.join(', ')}`);
                    console.log(`  Found in text: ${foundCitations.join(', ')}`);
                    console.log(`  Coverage: ${foundCitations.length}/${expectedCitations.length} (${(foundCitations.length / expectedCitations.length * 100).toFixed(0)}%)`);
                    
                    if (foundCitations.length === 0) {
                      console.warn('⚠️ WARNING: AI did not include any inline citations [1], [2], etc.');
                      console.warn('   The AI may not have followed the RAG citation instructions.');
                      console.warn('   References will still be shown below the message.');
                    } else if (foundCitations.length < expectedCitations.length) {
                      console.warn(`⚠️ WARNING: AI only cited ${foundCitations.length}/${expectedCitations.length} fragments.`);
                      console.warn(`   Missing: ${expectedCitations.filter((c: string) => !foundCitations.includes(c)).join(', ')}`);
                    } else {
                      console.log('✅ All fragments were cited correctly by the AI!');
                    }
                  }
                  
                  // Mark message as no longer streaming and add references
                  console.log('🔄 [STREAM COMPLETE] Updating message state with final content');
                  console.log('🔍 [STREAM COMPLETE] Final message ID:', finalMessageId);
                  console.log('🔍 [STREAM COMPLETE] Final content length:', accumulatedContent.length);
                  console.log('🔍 [STREAM COMPLETE] Final content (first 300 chars):', accumulatedContent.substring(0, 300));
                  
                  setMessages(prev => {
                    const updated = prev.map(msg => 
                      msg.id === streamingId 
                        ? { 
                            ...msg, 
                            id: finalMessageId,
                            isStreaming: false,
                            content: accumulatedContent,
                            references: data.references, // RAG chunk references with real similarity
                            thinkingSteps: undefined
                          }
                        : msg
                    );
                    
                    console.log('🔍 [STREAM COMPLETE] Updated messages count:', updated.length);
                    console.log('🔍 [STREAM COMPLETE] Last message content length:', updated[updated.length - 1]?.content?.length);
                    
                    return updated;
                  });

                  // Calculate response time
                  const responseTime = Date.now() - requestStartTime;

                  // Check if response needs feedback
                  const needsFeedback = detectFeedbackNeeded(accumulatedContent);

                  // Clear thinking steps
                  setCurrentThinkingSteps([]);

                  // Update agent processing state
                  setAgentProcessing(prev => ({
                    ...prev,
                    [agentId]: {
                      isProcessing: false,
                      needsFeedback,
                    }
                  }));

                  // Play sound notification
                  playNotificationSound();

                  // Log references for debugging
                  if (data.references && data.references.length > 0) {
                    console.log('📚 Message saved with references:', data.references.length);
                    data.references.forEach((ref: any) => {
                      console.log(`  [${ref.id}] ${ref.sourceName} - Chunk #${ref.chunkIndex + 1} - ${(ref.similarity * 100).toFixed(1)}%`);
                    });
                  }

                  // NEW: Create context log with ACTUAL RAG configuration used
                  const ragConfig = data.ragConfiguration;
                  const ragActuallyUsed = ragConfig?.actuallyUsed || false;
                  
                  // ✅ FIX: Build context sources for log from RAG stats (backend knows the truth)
                  let contextSourcesWithMode: Array<{ name: string; tokens: number; mode: 'rag' | 'full-text' }> = [];
                  
                  if (ragActuallyUsed && ragConfig?.stats?.sources) {
                    // Use actual RAG stats from backend (source of truth)
                    contextSourcesWithMode = ragConfig.stats.sources.map((sourceStats: any) => ({
                      name: sourceStats.name || `Source ${sourceStats.id?.substring(0, 8)}`,
                      tokens: sourceStats.tokens, // REAL tokens from RAG chunks
                      mode: 'rag' as const,
                    }));
                  } else if (contextSources.length > 0) {
                    // Fallback: Use contextSources if available (should have minimal metadata)
                    contextSourcesWithMode = contextSources
                      .filter(s => s.enabled)
                      .map(s => ({
                        name: s.name,
                        tokens: Math.ceil((s.extractedData?.length || 0) / 4), // Estimate if no extractedData
                        mode: 'full-text' as const,
                      }));
                  }
                  
                  const log: ContextLog = {
                    id: `log-${Date.now()}`,
                    timestamp: new Date(),
                    userMessage: messageToSend,
                    model: currentAgentConfig?.preferredModel || globalUserSettings.preferredModel || 'gemini-2.5-flash',
                    systemPrompt: currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt || '',
                    contextSources: contextSourcesWithMode, // NOW includes mode and real tokens
                    totalInputTokens: Math.ceil(messageToSend.length / 4),
                    totalOutputTokens: Math.ceil(accumulatedContent.length / 4),
                    contextWindowUsed: Math.ceil((messageToSend.length + accumulatedContent.length) / 4),
                    contextWindowAvailable: 1000000 - Math.ceil((messageToSend.length + accumulatedContent.length) / 4),
                    contextWindowCapacity: 1000000,
                    aiResponse: accumulatedContent,
                    // NEW: Complete RAG audit trail
                    ragConfiguration: ragConfig,
                    references: data.references, // Add chunk references to log
                  };
                  
                  // Save log to current conversation's logs
                  setContextLogs(prev => [...prev, log]);
                  
                  // Also save to conversationLogs Map for persistence
                  setConversationLogs(prev => {
                    const updated = new Map(prev);
                    const existingLogs = updated.get(currentConversation) || [];
                    updated.set(currentConversation, [...existingLogs, log]);
                    return updated;
                  });

                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove streaming message
      setMessages(prev => prev.filter(msg => msg.id !== streamingId));
      
      // Update agent processing state on error
      setAgentProcessing(prev => ({
        ...prev,
        [agentId]: {
          isProcessing: false,
          needsFeedback: false,
        }
      }));
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const stopProcessing = () => {
    if (!currentConversation) return;
    
    // Cancel processing for current agent
    setAgentProcessing(prev => ({
      ...prev,
      [currentConversation]: {
        isProcessing: false,
        needsFeedback: false,
      }
    }));
    
    // Add cancelled message
    const cancelledMessage: Message = {
      id: `cancelled-${Date.now()}`,
      role: 'assistant',
      content: '_Procesamiento detenido por el usuario._',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelledMessage]);
    
    console.log('⏹️ Procesamiento detenido para agente:', currentConversation);
  };

  const toggleContext = async (sourceId: string) => {
    console.log('🔄 Toggle context called for source:', sourceId);
    console.log('📚 Current sources state:', contextSources.map(s => ({ id: s.id, name: s.name, enabled: s.enabled })));
    
    // Get current enabled state
    const source = contextSources.find(s => s.id === sourceId);
    if (!source) {
      console.warn('⚠️ Source not found:', sourceId);
      return;
    }
    
    const newEnabledState = !source.enabled;
    console.log(`📝 Toggling ${source.name} (ID: ${sourceId}): ${source.enabled} → ${newEnabledState}`);
    
    // Calculate new state immediately
    const updatedSources = contextSources.map(s => 
      s.id === sourceId 
        ? { ...s, enabled: newEnabledState }
        : s
    );
    
    // Update local state
    setContextSources(updatedSources);

    // Update enabled state in Firestore
    try {
      await fetch(`/api/context-sources/${sourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabledState })
      });
      console.log(`✅ Context source enabled state updated in Firestore: ${sourceId} → ${newEnabledState}`);
    } catch (error) {
      console.error('❌ Error updating context source enabled state:', error);
    }

    // Save active sources for current conversation using updated state
    if (currentConversation) {
      const newActiveIds = updatedSources
        .filter(s => s.enabled)
        .map(s => s.id);
      console.log('💾 Saving active IDs for conversation:', newActiveIds);
      saveContextForConversation(currentConversation, newActiveIds);
      
      // ✅ CACHE: Update cache with new toggle state
      setCachedSources(currentConversation, updatedSources, newActiveIds);
    }
  };

  const handleAddSource = async (
    type: SourceType,
    file?: File,
    url?: string,
    config?: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro', apiEndpoint?: string, tags?: string[] }
  ) => {
    const startTime = Date.now(); // Track start time
    
    // Determine which agent to assign to
    const targetAgent = agentForContextConfig || selectedAgent || currentConversation;
    
    const newSource: ContextSource = {
      id: `source-${Date.now()}`,
      name: file?.name || url || config?.apiEndpoint || 'Nueva Fuente',
      type,
      enabled: true,
      status: 'processing',
      extractedData: '',
      addedAt: new Date(),
      tags: config?.tags, // Include tags from config
      assignedToAgents: targetAgent && !config?.tags?.includes('PUBLIC') ? [targetAgent] : [], // Assign to current agent unless PUBLIC
      progress: {
        stage: 'uploading',
        percentage: 0,
        message: 'Iniciando...',
        startTime,
        elapsedSeconds: 0
      }
    };

    setContextSources(prev => [...prev, newSource]);
    
    // Close the modal immediately - show progress in context panel
    setShowAddSourceModal(false);
    setPreSelectedSourceType(undefined);

    // Calculate estimated cost based on file size
    const fileSizeMB = file ? file.size / (1024 * 1024) : 1;
    const estimatedPages = Math.max(1, Math.ceil(fileSizeMB / 0.1));
    const model = config?.model || 'gemini-2.5-pro';
    const costPerPage = model === 'gemini-2.5-pro' ? 0.0015 : 0.00002;
    const estimatedCost = estimatedPages * costPerPage;

    // Start progress timer
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setContextSources(prev => prev.map(s => 
        s.id === newSource.id && s.progress
          ? { 
              ...s, 
              progress: { 
                ...s.progress, 
                elapsedSeconds: elapsed
              } 
            }
          : s
      ));
    }, 1000);

    try {
      // Update progress: processing (50%)
      setContextSources(prev => prev.map(s => 
        s.id === newSource.id
          ? { 
              ...s, 
              progress: { 
                stage: 'processing', 
                percentage: 50, 
                message: 'Extrayendo contenido...',
                startTime,
                elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
                estimatedCost
              } 
            }
          : s
      ));

      // Call extraction API
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
        formData.append('type', type);
        formData.append('model', 'gemini-2.5-pro'); // Use Pro for better extraction quality
        formData.append('extractionMethod', 'vision-api'); // ✅ Use Vision API for PDFs

        console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) with Gemini Pro`);

        const response = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Extract API error:', errorData);
          throw new Error(errorData.error || 'Failed to extract document');
        }

        const data = await response.json();
        
        if (!data.success) {
          console.error('❌ Extraction failed:', data);
          throw new Error(data.error || 'Extraction failed');
        }

        console.log(`✅ Extraction successful: ${data.extractedText?.length || 0} characters extracted`);
        
        // Log token usage and cost
        if (data.metadata?.totalTokens) {
          console.log(`📊 Tokens: ${data.metadata.inputTokens?.toLocaleString()} input + ${data.metadata.outputTokens?.toLocaleString()} output = ${data.metadata.totalTokens.toLocaleString()} total`);
          console.log(`💰 Cost: ${data.metadata.costFormatted} (Input: $${data.metadata.inputCost?.toFixed(4)}, Output: $${data.metadata.outputCost?.toFixed(4)})`);
        }

        // Save to Firestore - Assign to current agent (or all agents if PUBLIC)
        // 🎯 IMPORTANT: Only assign to AGENTS, not chats
        const allAgents = conversations.filter(c => c.isAgent !== false);
        const assignedTo = config?.tags?.includes('PUBLIC') 
          ? allAgents.map(a => a.id) // Assign to ALL agents if PUBLIC (not chats)
          : currentConversation ? [currentConversation] : []; // Assign to current agent only
        
        const savedSource = await fetch('/api/context-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: file.name,
            type,
            enabled: true,
            status: 'active',
            extractedData: data.extractedText || '',
            assignedToAgents: assignedTo,
            tags: config?.tags, // Include tags
            metadata: {
              originalFileName: file.name,
              originalFileSize: file.size,
              pageCount: data.metadata?.pageCount,
              model: config?.model || 'gemini-2.5-pro',
              charactersExtracted: data.metadata?.characters,
              extractionDate: new Date(),
              extractionTime: data.metadata?.extractionTime,
              
              // Token usage
              inputTokens: data.metadata?.inputTokens,
              outputTokens: data.metadata?.outputTokens,
              totalTokens: data.metadata?.totalTokens,
              
              // Cost breakdown
              inputCost: data.metadata?.inputCost,
              outputCost: data.metadata?.outputCost,
              totalCost: data.metadata?.totalCost,
              costFormatted: data.metadata?.costFormatted,
            }
          })
        });

        if (!savedSource.ok) {
          throw new Error('Failed to save context source to Firestore');
        }

        const savedData = await savedSource.json();
        const sourceId = savedData.source.id;

        // Clear progress interval
        clearInterval(progressInterval);

        // Calculate final metrics
        const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
        const totalCost = data.metadata?.totalCost || 0;
        const timeDisplay = totalElapsed < 60 
          ? `${totalElapsed}s` 
          : `${Math.floor(totalElapsed / 60)}m ${totalElapsed % 60}s`;

        // Update local state with Firestore ID and enabled=true
        setContextSources(prev => prev.map(s => 
          s.id === newSource.id
            ? {
                ...savedData.source,
                addedAt: new Date(savedData.source.addedAt),
                enabled: true, // Activate toggle by default
                originalFile: file, // Keep original file for viewer
                progress: {
                  stage: 'complete',
                  percentage: 100,
                  message: `✓ Completado en ${timeDisplay} - ${data.metadata?.costFormatted || '$0.00'}`,
                  startTime,
                  elapsedSeconds: totalElapsed,
                  estimatedCost: totalCost
                }
              }
            : s
        ));

        console.log('✅ Fuente de contexto guardada en Firestore:', sourceId);

        // Auto-activate in current conversation
        if (currentConversation) {
          const currentActiveIds = contextSources
            .filter(s => s.enabled)
            .map(s => s.id);
          const newActiveIds = [...currentActiveIds, sourceId];
          
          await saveContextForConversation(currentConversation, newActiveIds);
          console.log(`✅ Fuente activada automáticamente para agente ${currentConversation}`);
        }

        // AUTO-INDEX WITH RAG (NEW - Automatic)
        if (data.extractedText && data.extractedText.length > 100) {
          console.log('🔍 Auto-indexing with RAG...');
          
          try {
            // Update UI to show indexing started
            setContextSources(prev => prev.map(s => 
              s.id === sourceId
                ? {
                    ...s,
                    progress: {
                      stage: 'processing',
                      percentage: 75,
                      message: 'Indexando con RAG...',
                      startTime,
                      elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
                    }
                  }
                : s
            ));

            const indexResponse = await fetch('/api/reindex-source', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceId,
                userId,
              }),
            });

            if (indexResponse.ok) {
              const indexData = await indexResponse.json();
              console.log(`✅ RAG indexing complete: ${indexData.chunksCreated} chunks created`);
              
              // Reload context sources to show RAG metadata (force verification since we just indexed)
              if (currentConversation) {
                await loadContextForConversation(currentConversation, false); // Force RAG verification
              }
            } else {
              console.warn('⚠️ RAG indexing failed, document still usable in full-text mode');
            }
          } catch (indexError) {
            console.warn('⚠️ RAG indexing error (non-critical):', indexError);
            // Continue - document is still usable without RAG
          }
        }
      }
    } catch (error) {
      // Clear progress interval on error
      clearInterval(progressInterval);
      
      console.error('❌ Error adding source:', error);
      
      let errorMessage = 'Error al procesar el documento';
      let errorDetails = error instanceof Error ? error.message : 'Error desconocido';
      let suggestions: string[] = [];
      
      // Parse error for better user feedback
      if (errorDetails.includes('API key') || errorDetails.includes('GEMINI')) {
        errorMessage = 'Error de configuración de Gemini AI';
        suggestions = [
          'Verifica que GOOGLE_AI_API_KEY esté configurada',
          'Reinicia el servidor después de agregar la key'
        ];
      } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
        errorMessage = 'Error de conexión';
        suggestions = ['Verifica tu conexión a internet', 'Intenta de nuevo'];
      } else if (errorDetails.includes('quota') || errorDetails.includes('rate limit')) {
        errorMessage = 'Límite de API alcanzado';
        suggestions = ['Espera unos minutos', 'Intenta con modelo Flash'];
      }
      
      const failedElapsed = Math.floor((Date.now() - startTime) / 1000);
      const failedTimeDisplay = failedElapsed < 60 ? `${failedElapsed}s` : `${Math.floor(failedElapsed / 60)}m ${failedElapsed % 60}s`;
      
      setContextSources(prev => prev.map(s => 
        s.id === newSource.id
          ? {
              ...s,
              status: 'error',
              progress: undefined,
              error: {
                message: errorMessage,
                details: `${errorDetails} (falló después de ${failedTimeDisplay})`,
                timestamp: new Date(),
                suggestions
              }
            }
          : s
      ));
      
      // Show alert to user
      alert(`❌ ${errorMessage}\n\n${errorDetails}\n\n${suggestions.length > 0 ? '\n' + suggestions.join('\n') : ''}`);
    }
  };

  const handleSaveWorkflowConfig = (workflowId: string, config: WorkflowConfig) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, config } : w
    ));
    console.log('✅ Workflow config saved:', workflowId, config);
  };

  const handleSaveUserSettings = async (settings: UserSettings) => {
    try {
      console.log('💾 Guardando configuración del usuario en Firestore...');
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...settings }),
      });

      if (response.ok) {
        const savedSettings = await response.json();
        setGlobalUserSettings(savedSettings);
        console.log('✅ Configuración del usuario guardada en Firestore:', savedSettings.preferredModel);
        
        // Apply theme if it was changed
        if (savedSettings.theme) {
          console.log(`🎨 Aplicando tema guardado: ${savedSettings.theme}`);
          if (savedSettings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('theme', savedSettings.theme);
        }
      } else {
        console.error('❌ Error al guardar configuración del usuario');
      }
    } catch (error) {
      console.error('❌ Error al guardar configuración del usuario:', error);
    }

    // Update the local currentAgentConfig state immediately
    if (currentConversation) {
      setCurrentAgentConfig(settings);
    }

    // Save agent-specific config for the current conversation if applicable
    if (currentConversation && !currentConversation.startsWith('temp-')) {
      try {
        console.log('💾 Guardando configuración del agente para conversación en Firestore...', currentConversation);
        await fetch('/api/agent-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: currentConversation,
            userId,
            model: settings.preferredModel,
            systemPrompt: settings.systemPrompt,
          }),
        });
        console.log('✅ Configuración del agente para conversación guardada en Firestore.');
      } catch (error) {
        console.error('❌ Error al guardar configuración del agente para conversación:', error);
      }
    }
  };

  // ✅ NEW: Handle domain prompt save
  const handleSaveDomainPrompt = async (domainPrompt: string) => {
    try {
      // For now, we'll use a default organization ID
      // In future, user.organizationId would come from user settings
      const organizationId = 'default-org';
      
      await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mi Organización', // TODO: Get from org settings
          domainPrompt,
        }),
      });
      
      setCurrentDomainPrompt(domainPrompt);
      console.log('✅ Domain prompt saved');
    } catch (error) {
      console.error('❌ Error saving domain prompt:', error);
      throw error;
    }
  };

  // ✅ NEW: Handle agent prompt save
  const handleSaveAgentPrompt = async (agentPrompt: string) => {
    if (!currentConversation) return;
    
    try {
      // 🔑 CRITICAL: Get parent agent ID if this is a chat
      const currentConv = conversations.find(c => c.id === currentConversation);
      const agentIdToSave = currentConv?.agentId || currentConversation;
      
      console.log('💾 [FRONTEND] Guardando agent prompt...');
      console.log('🔍 [FRONTEND] Current conversation ID:', currentConversation);
      console.log('🔍 [FRONTEND] Is chat with parent agent:', !!currentConv?.agentId);
      console.log('🔍 [FRONTEND] Agent ID to save to:', agentIdToSave);
      console.log('🔍 [FRONTEND] Agent prompt length:', agentPrompt.length);
      console.log('🔍 [FRONTEND] Agent prompt (first 200 chars):', agentPrompt.substring(0, 200));
      console.log('🔍 [FRONTEND] Full agent prompt:', agentPrompt);
      
      const response = await fetch(`/api/conversations/${agentIdToSave}/prompt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentPrompt,
          userId,
          model: currentAgentConfig?.preferredModel || globalUserSettings.preferredModel,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [FRONTEND] Agent prompt saved, response:', result);
      console.log('🔍 [FRONTEND] Saved prompt length:', result.agentPrompt?.length);
      console.log('🔍 [FRONTEND] Saved prompt:', result.agentPrompt);
      
      setCurrentAgentPrompt(agentPrompt);
      console.log('✅ Agent prompt saved');
    } catch (error) {
      console.error('❌ Error saving agent prompt:', error);
      throw error;
    }
  };

  // ✅ NEW: Load domain and agent prompts when selecting agent
  const loadPromptsForAgent = async (conversationId: string) => {
    try {
      // 🔑 CRITICAL: Get parent agent ID if this is a chat
      const currentConv = conversations.find(c => c.id === conversationId);
      const agentIdToLoad = currentConv?.agentId || conversationId;
      
      console.log('📥 [LOAD PROMPTS] Loading prompts for conversation:', conversationId);
      console.log('🔍 [LOAD PROMPTS] Is chat with parent agent:', !!currentConv?.agentId);
      console.log('🔍 [LOAD PROMPTS] Agent ID to load from:', agentIdToLoad);
      
      // Load organization domain prompt
      // For now using default-org, in future would be from user.organizationId
      const orgResponse = await fetch('/api/organizations/default-org');
      if (orgResponse.ok) {
        const org = await orgResponse.json();
        setCurrentDomainPrompt(org.domainPrompt || '');
      }
      
      // Load agent prompt from the AGENT (not the chat)
      const agentResponse = await fetch(`/api/conversations/${agentIdToLoad}/prompt`);
      if (agentResponse.ok) {
        const promptData = await agentResponse.json();
        console.log('📥 [LOAD PROMPTS] Prompt data received:', promptData);
        console.log('🔍 [LOAD PROMPTS] Agent prompt length:', promptData.agentPrompt?.length);
        setCurrentAgentPrompt(promptData.agentPrompt || '');
      }
    } catch (error) {
      console.error('❌ Error loading prompts:', error);
    }
  };

  // ✅ NEW: Load all conversation data (including prompts)
  const selectConversation = async (conversationId: string) => {
    setCurrentConversation(conversationId);
    await loadPromptsForAgent(conversationId);
  };

  const handleAgentConfigSaved = async (config: AgentConfiguration) => {
    if (!currentConversation) {
      console.warn('⚠️ No current conversation to save config');
      return;
    }
    
    console.log('💾 Guardando configuración extraída del agente:', currentConversation, config);
    console.log('🔍 [SAVE FULL] ALL CONFIG KEYS:', Object.keys(config));
    console.log('🔍 [SAVE FULL] FULL CONFIG:', JSON.stringify(config, null, 2));
    console.log('🔍 [SAVE FULL] expectedInputExamples:', config.expectedInputExamples);
    console.log('🔍 [SAVE FULL] expectedInputExamples count:', config.expectedInputExamples?.length);
    
    // Validate and correct model name (fix gemini-1.5-* -> gemini-2.5-*)
    let validatedModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-flash';
    const modelStr = String(config.recommendedModel || 'gemini-2.5-flash');
    
    if (modelStr === 'gemini-1.5-pro' || modelStr === 'gemini-pro' || modelStr === 'gemini-2.5-pro') {
      if (modelStr !== 'gemini-2.5-pro') {
        console.log(`🔧 Correcting invalid model: ${modelStr} -> gemini-2.5-pro`);
      }
      validatedModel = 'gemini-2.5-pro';
    } else if (modelStr === 'gemini-1.5-flash' || modelStr === 'gemini-flash' || modelStr === 'gemini-2.5-flash') {
      if (modelStr !== 'gemini-2.5-flash') {
        console.log(`🔧 Correcting invalid model: ${modelStr} -> gemini-2.5-flash`);
      }
      validatedModel = 'gemini-2.5-flash';
    }
    
    // Update ONLY current agent config (not global)
    setCurrentAgentConfig({
      preferredModel: validatedModel,
      systemPrompt: config.systemPrompt,
    });
    
    // Save to Firestore for THIS agent only
    try {
      await fetch('/api/agent-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation,
          userId,
          model: validatedModel, // Use validated model name
          systemPrompt: config.systemPrompt,
          // Store full config for future use (with corrected model)
          fullConfig: {
            ...config,
            recommendedModel: validatedModel
          },
        }),
      });
      console.log('✅ Configuración guardada en Firestore para agente:', currentConversation);
      
      // Also save to agent_setup_docs for evaluation system
      console.log('💾 [SAVE SETUP] Guardando en agent_setup_docs...');
      console.log('💾 [SAVE SETUP] expectedInputExamples:', config.expectedInputExamples);
      
      // Generate test examples - try expectedInputExamples first, fallback to criteria
      let inputExamples: any[] = [];
      let correctOutputs: any[] = [];
      
      // Method 1: Use expectedInputExamples if exists
      if (config.expectedInputExamples && Array.isArray(config.expectedInputExamples) && config.expectedInputExamples.length > 0) {
        console.log('💾 [SAVE SETUP] Using expectedInputExamples from config');
        inputExamples = config.expectedInputExamples.map((ex: any) => ({
          question: ex.question || ex.example || '',
          category: ex.category || 'General'
        }));
        
        if (config.expectedOutputExamples && Array.isArray(config.expectedOutputExamples)) {
          correctOutputs = config.expectedOutputExamples.map((ex: any) => ({
            example: ex.example || '',
            criteria: ex.successCriteria || 'Apropiada'
          }));
        }
      } 
      // Method 2: Generate from acceptanceCriteria and qualityCriteria
      else {
        console.log('💾 [SAVE SETUP] No expectedInputExamples, generating from criteria');
        
        // Use acceptanceCriteria as test cases
        if (config.acceptanceCriteria && Array.isArray(config.acceptanceCriteria)) {
          config.acceptanceCriteria.forEach((criteria: any) => {
            inputExamples.push({
              question: criteria.howToTest || criteria.description || '',
              category: criteria.criterion || 'General'
            });
            correctOutputs.push({
              example: `Respuesta apropiada según: ${criteria.description}`,
              criteria: criteria.description || ''
            });
          });
        }
        
        // Also use qualityCriteria
        if (config.qualityCriteria && Array.isArray(config.qualityCriteria)) {
          config.qualityCriteria.forEach((criteria: any) => {
            if (!inputExamples.some((ex: any) => ex.category === criteria.criterion)) {
              inputExamples.push({
                question: `Test para: ${criteria.description}`,
                category: criteria.criterion || 'General'
              });
              correctOutputs.push({
                example: `Respuesta que demuestre: ${criteria.description}`,
                criteria: criteria.description || ''
              });
            }
          });
        }
      }
      
      console.log('💾 [SAVE SETUP] Final inputExamples:', inputExamples);
      console.log('💾 [SAVE SETUP] inputExamples count:', inputExamples.length);
      
      const setupDocData = {
        agentId: currentConversation,
        fileName: 'Configuración extraída',
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        // Core fields
        agentName: config.agentName || '',
        agentPurpose: config.agentPurpose || '',
        setupInstructions: config.systemPrompt || '',
        // User fields
        targetAudience: config.targetAudience || [],
        pilotUsers: config.pilotUsers || [], // ✅ ADDED - was missing
        // Input/Output examples
        inputExamples,
        correctOutputs,
        incorrectOutputs: (config.undesirableOutputs || []).map((ex: any) => ({
          example: ex.example || '',
          reason: ex.reason || ''
        })),
        // Behavior configuration
        recommendedModel: validatedModel, // Use validated model
        systemPrompt: config.systemPrompt || '',
        tone: config.tone || '',
        expectedInputTypes: config.expectedInputTypes || [],
        expectedOutputFormat: config.expectedOutputFormat || '',
        expectedOutputExamples: config.expectedOutputExamples || [],
        responseRequirements: config.responseRequirements || {},
        // Context sources
        requiredContextSources: config.requiredContextSources || [],
        recommendedContextSources: config.recommendedContextSources || [],
        // Domain expert
        domainExpert: config.domainExpert || { name: 'Unknown' },
        // Optional/legacy fields
        businessCase: config.businessCase || {},
        qualityCriteria: config.qualityCriteria || [],
        undesirableOutputs: config.undesirableOutputs || [],
        acceptanceCriteria: config.acceptanceCriteria || [],
        evaluationCriteria: config.evaluationCriteria || [],
        successMetrics: config.successMetrics || []
      };
      
      console.log('💾 [SAVE SETUP] inputExamples mapeados:', setupDocData.inputExamples);
      console.log('💾 [SAVE SETUP] inputExamples count:', setupDocData.inputExamples.length);
      console.log('💾 [SAVE SETUP] pilotUsers count:', setupDocData.pilotUsers?.length || 0);
      console.log('💾 [SAVE SETUP] targetAudience count:', setupDocData.targetAudience?.length || 0);
      console.log('💾 [SAVE SETUP] tone:', setupDocData.tone || 'N/A');
      console.log('💾 [SAVE SETUP] recommendedModel:', setupDocData.recommendedModel || 'N/A');
      console.log('💾 [SAVE SETUP] domainExpert:', setupDocData.domainExpert);
      
      await fetch('/api/agent-setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupDocData)
      });
      
      console.log('✅ [SAVE SETUP] Configuración guardada en agent_setup_docs');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
    }
    
    // Auto-rename conversation to match agent name (ONLY if not manually renamed before)
    const currentConv = conversations.find(c => c.id === currentConversation);
    if (config.agentName && !currentConv?.hasBeenRenamed) {
      console.log('🔄 Auto-renaming agent to:', config.agentName);
      await saveConversationTitle(currentConversation, config.agentName, false); // false = auto-rename, not manual
      
      // Force UI update by re-loading conversations to ensure name change is visible
      console.log('🔄 Reloading conversations to reflect name change...');
      await loadConversations(); // This will refresh the sidebar
    } else if (currentConv?.hasBeenRenamed) {
      console.log('ℹ️ Agent already renamed by user, preserving name:', currentConv.title);
    }
    
    console.log('✅ Configuración del agente aplicada solo a este agente');
  };

  const handleSourceSettings = (sourceId: string) => {
    const source = contextSources.find(s => s.id === sourceId);
    if (source) {
      setSettingsSource(source);
    }
  };

  const startEditingConversation = (conv: Conversation) => {
    setEditingConversationId(conv.id);
    setEditingTitle(conv.title);
  };

  const cancelEditingConversation = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const saveConversationTitle = async (conversationId: string, newTitle: string, isManualRename: boolean = true) => {
    if (!newTitle.trim()) {
      cancelEditingConversation();
      return;
    }

    // Check if this is an optimistic ID (not yet confirmed by Firestore)
    const isOptimistic = conversationId.startsWith('optimistic-');
    const isTemporary = conversationId.startsWith('temp-');

    try {
      // Optimistic UI: Update local state immediately for better UX
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, title: newTitle.trim(), hasBeenRenamed: isManualRename } 
          : c
      ));
      
      console.log(`⚡ Título actualizado localmente: "${newTitle.trim()}" (${conversationId})`);
      cancelEditingConversation();

      // If optimistic or temporary, only update locally (don't call API yet)
      if (isOptimistic || isTemporary) {
        console.log(`ℹ️ Chat ${isOptimistic ? 'optimista' : 'temporal'} - título se guardará cuando se confirme en Firestore`);
        return;
      }

      // For confirmed chats, update in Firestore
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTitle.trim(),
          hasBeenRenamed: isManualRename // Mark if user manually renamed
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error al actualizar título en API:', {
          conversationId,
          status: response.status,
          error: errorData
        });
        
        // Revert local state if API fails
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          setConversations(prev => prev.map(c => 
            c.id === conversationId 
              ? { ...c, title: conversation.title } // Revert to old title
              : c
          ));
        }
        
        throw new Error(errorData.error || 'Failed to update title');
      }

      const renameType = isManualRename ? 'manual' : 'auto';
      console.log(`✅ Título actualizado en Firestore (${renameType}):`, conversationId, '→', newTitle.trim());
      
    } catch (error) {
      console.error('❌ Error al actualizar título:', error);
      alert('Error al guardar el título. Por favor, intenta de nuevo.');
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      // Update in Firestore
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });

      if (!response.ok) {
        throw new Error('Failed to archive conversation');
      }

      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, status: 'archived' as const } : c
      ));

      // If we archived the current conversation, clear selection
      if (currentConversation === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      console.log('📦 Agente archivado:', conversationId);
    } catch (error) {
      console.error('❌ Error al archivar agente:', error);
    }
  };

  const unarchiveConversation = async (conversationId: string) => {
    try {
      // Update in Firestore
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      if (!response.ok) {
        throw new Error('Failed to unarchive conversation');
      }

      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, status: 'active' as const } : c
      ));

      console.log('📂 Agente restaurado:', conversationId);
    } catch (error) {
      console.error('❌ Error al restaurar agente:', error);
    }
  };

  // Admin-only: Open delete confirmation modal
  const openDeleteConfirmation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    setDeleteConfirmation({
      conversationId: conversation.id,
      conversationTitle: conversation.title,
    });
    setDeleteConfirmationInput('');
  };

  // Admin-only: Delete conversation permanently
  const deleteConversationPermanently = async () => {
    if (!deleteConfirmation) return;
    
    // Double-check user typed the exact name
    if (deleteConfirmationInput !== deleteConfirmation.conversationTitle) {
      alert('El nombre no coincide. Por favor, escribe el nombre exacto del agente.');
      return;
    }

    try {
      // Call DELETE endpoint
      const response = await fetch(`/api/conversations/${deleteConfirmation.conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete conversation');
      }

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== deleteConfirmation.conversationId));

      // If we deleted the current conversation, clear selection
      if (currentConversation === deleteConfirmation.conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      console.log('🗑️ Agente eliminado permanentemente:', deleteConfirmation.conversationId);
      
      // Close modal
      setDeleteConfirmation(null);
      setDeleteConfirmationInput('');
    } catch (error) {
      console.error('❌ Error al eliminar agente:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'No se pudo eliminar el agente'}`);
    }
  };

  const handleReExtract = async (sourceId: string, newConfig: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro' }) => {
    console.log('Re-extracting source:', sourceId, 'with config:', newConfig);
    
    // Find the source
    const source = contextSources.find(s => s.id === sourceId);
    if (!source || !source.originalFile) {
      console.error('Cannot re-extract: source or original file not found');
      return;
    }

    // Update source to show it's processing
    setContextSources(prev => prev.map(s =>
      s.id === sourceId
        ? {
            ...s,
            status: 'processing' as const,
            progress: {
              stage: 'processing' as const,
              percentage: 0,
              message: 'Re-extrayendo contenido...',
            },
            error: undefined,
          }
        : s
    ));

    // Close settings modal
    setSettingsSource(null);

    try {
      // Re-extract using the same logic as handleAddSource
      const formData = new FormData();
      formData.append('file', source.originalFile);
      formData.append('model', newConfig.model || 'gemini-2.5-pro'); // Default to Pro for quality

      // Update progress
      setContextSources(prev => prev.map(s =>
        s.id === sourceId
          ? {
              ...s,
              progress: {
                stage: 'processing' as const,
                percentage: 50,
                message: 'Procesando con ' + (newConfig.model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash') + '...',
              },
            }
          : s
      ));

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update source with new extracted data
      setContextSources(prev => prev.map(s =>
        s.id === sourceId
          ? {
              ...s,
              extractedData: result.extractedText,
              status: 'active' as const,
              metadata: {
                ...s.metadata,
                ...result.metadata,
                model: newConfig.model || 'gemini-2.5-flash',
                extractedAt: result.metadata.extractedAt,
              },
              progress: {
                stage: 'complete' as const,
                percentage: 100,
                message: '✓ Re-extracción completada',
              },
              error: undefined,
            }
          : s
      ));

      console.log('✅ Re-extraction successful:', sourceId);
    } catch (error) {
      console.error('❌ Re-extraction failed:', error);
      
      setContextSources(prev => prev.map(s =>
        s.id === sourceId
          ? {
              ...s,
              status: 'error' as const,
              progress: undefined,
              error: {
                message: 'Error al re-extraer contenido',
                details: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
              },
            }
          : s
      ));
    }
  };

  const calculateContextUsage = () => {
    // Context window sizes for each model
    const contextWindows = {
      'gemini-2.5-flash': 1000000, // 1M tokens
      'gemini-2.5-pro': 2000000,   // 2M tokens
    };

    const modelWindow = contextWindows[globalUserSettings.preferredModel];

    // Calculate total tokens considering RAG modes:
    // 1. System prompt tokens - 🔑 CRITICAL: Use combined hierarchical prompt
    const finalSystemPrompt = combineDomainAndAgentPrompts(
      currentDomainPrompt,
      currentAgentPrompt || currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt
    );
    const systemTokens = Math.ceil(finalSystemPrompt.length / 4);
    
    // 2. Messages tokens
    const messageTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
    
    // 3. Active context sources - CONSIDERING RAG MODE PER DOCUMENT
    const contextTokens = contextSources
      .filter(s => s.enabled)
      .reduce((sum, s) => {
        const fullTextTokens = Math.ceil((s.extractedData?.length || 0) / 4);
        
        // Check if this source uses RAG mode
        const sourceUseRAG = (s as any).useRAGMode !== false && s.ragEnabled;
        
        if (sourceUseRAG && s.ragMetadata) {
          // RAG mode: estimate ~5 chunks @ ~500 tokens each = ~2500 tokens
          return sum + Math.min(2500, fullTextTokens);
        }
        
        // Full-text mode: use complete document
        return sum + fullTextTokens;
      }, 0);

    const estimatedTokens = systemTokens + messageTokens + contextTokens;
    const usagePercent = ((estimatedTokens / modelWindow) * 100).toFixed(1);

    return {
      systemTokens,
      messageTokens,
      contextTokens,
      estimatedTokens,
      usagePercent: parseFloat(usagePercent),
      modelWindow,
      // NEW: Breakdown by mode
      ragSources: contextSources.filter(s => s.enabled && (s as any).useRAGMode !== false && s.ragEnabled).length,
      fullTextSources: contextSources.filter(s => s.enabled && ((s as any).useRAGMode === false || !s.ragEnabled)).length,
    };
  };

  const getWorkflowStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Play className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Left Sidebar - Conversations */}
      <div 
        className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col relative"
        style={{ width: `${leftPanelWidth}px` }}
      >
        {/* Header with Salfacorp Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
          {/* Salfacorp Logo and Brand */}
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">SALFAGPT</h1>
            <img 
              src="/images/Logo Salfacorp.png" 
              alt="Salfacorp" 
              className="w-10 h-10 object-contain"
            />
          </div>
          
          {/* New Agent Button - HIDDEN FOR USER ROLE */}
          {userRole !== 'user' && (
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Nuevo Agente
            </button>
          )}
        </div>

        {/* NEW: Reorganized Sidebar with Collapsible Sections */}
        <div className="flex-1 overflow-y-auto p-2 dark:bg-slate-800 space-y-2">
          
          {/* 1. AGENTES Section - Collapsible */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <button
              onClick={() => setShowAgentsSection(!showAgentsSection)}
              className="w-full px-3 py-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`transform transition-transform ${showAgentsSection ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <Bot className="w-4 h-4" />
                <span>Agentes</span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                  {conversations.filter(c => c.isAgent !== false && c.status !== 'archived').length}
                </span>
              </div>
            </button>
            
            {showAgentsSection && (
              <div className="px-2 pb-2 space-y-1">
                {conversations
                  .filter(c => c.isAgent !== false && c.status !== 'archived')
                  .map(agent => (
                    <div
                      key={agent.id}
                      className={`w-full p-2 rounded-lg transition-colors group ${
                        selectedAgent === agent.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
              {editingConversationId === agent.id ? (
                // Edit mode
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveConversationTitle(agent.id, editingTitle);
                      } else if (e.key === 'Escape') {
                        cancelEditingConversation();
                      }
                    }}
                    onBlur={() => saveConversationTitle(agent.id, editingTitle)}
                    className="flex-1 text-sm font-medium text-slate-700 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                    autoFocus
                  />
                  <button
                    onClick={() => saveConversationTitle(agent.id, editingTitle)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Guardar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEditingConversation}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Cancelar"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div
                    onClick={async () => {
                      setSelectedAgent(agent.id);
                      // ✅ AUTO-CREATE: Create new chat instead of using agent as conversation
                      await createNewChatForAgent(agent.id);
                      // ✅ NEW: Load prompts for this agent
                      await loadPromptsForAgent(agent.id);
                    }}
                    className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                    style={{ maxWidth: '90%' }}
                  >
                    <span className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">
                      {agent.title}
                    </span>
                    {agent.isShared && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] rounded-full font-semibold whitespace-nowrap">
                        Compartido
                      </span>
                    )}
                  </div>
                  
                  {/* Agent actions - HIDDEN FOR USER ROLE */}
                  {userRole !== 'user' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Settings icon - opens context configuration modal */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAgentForContextConfig(agent.id);
                          setShowAgentContextModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                        title="Configurar Contexto"
                      >
                        <SettingsIcon className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* NEW: Share icon - opens sharing modal */}
                      {!agent.isShared && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAgentToShare(agent);
                            setShowAgentSharingModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                          title="Compartir Agente"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Edit icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingConversation(agent);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                        title="Editar nombre"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Admin-only: Archive button */}
                      {userRole === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveConversation(agent.id);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900 rounded"
                          title="Archivar (solo admin)"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Admin-only: Delete button */}
                      {userRole === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirmation(agent.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          title="Eliminar permanentemente (solo admin)"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* NEW: New chat icon - creates a chat for this agent (LAST position) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createNewChatForAgent(agent.id);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                        title="Nuevo chat"
                      >
                        <div className="relative">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <Plus className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-white dark:bg-slate-800 rounded-full" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
              </div>
            )}
          </div>
          
          {/* 2. PROYECTOS Section - Collapsible */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <div className="w-full px-3 py-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
              <button
                onClick={() => setShowProjectsSection(!showProjectsSection)}
                className="flex-1 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors py-1 -my-1 rounded-lg"
              >
                <span className={`transform transition-transform ${showProjectsSection ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <FileText className="w-4 h-4" />
                <span>Proyectos</span>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                  {folders.length}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const name = prompt('Nombre del nuevo proyecto:');
                  if (name && name.trim()) {
                    console.log('📝 Creating project with name:', name.trim());
                    createNewFolder(name.trim());
                  } else if (name !== null) {
                    // User clicked OK but entered empty name
                    alert('Por favor ingresa un nombre para el proyecto');
                  }
                }}
                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                title="Nuevo Proyecto"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {showProjectsSection && (
              <div className="px-2 pb-2 space-y-1">
                {folders.map(folder => {
                  const folderChats = conversations.filter(c => c.folderId === folder.id && c.status !== 'archived');
                  const isExpanded = expandedFolders.has(folder.id);
                  
                  return (
                    <div
                      key={folder.id}
                      className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden"
                    >
                      {/* Folder Header with Drag & Drop */}
                      <div
                        className="p-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 group transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-green-100', 'dark:bg-green-900/20', 'border-green-400');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('bg-green-100', 'dark:bg-green-900/20', 'border-green-400');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-green-100', 'dark:bg-green-900/20', 'border-green-400');
                          const chatId = e.dataTransfer.getData('chatId');
                          if (chatId) {
                            moveChatToFolder(chatId, folder.id);
                            // Auto-expand folder when chat is dropped
                            setExpandedFolders(prev => new Set([...prev, folder.id]));
                          }
                        }}
                      >
                        {editingFolderId === folder.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  renameFolder(folder.id, editingFolderName);
                                } else if (e.key === 'Escape') {
                                  setEditingFolderId(null);
                                  setEditingFolderName('');
                                }
                              }}
                              onBlur={() => renameFolder(folder.id, editingFolderName)}
                              className="flex-1 text-sm px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-slate-200"
                              autoFocus
                            />
                            <button
                              onClick={() => renameFolder(folder.id, editingFolderName)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingFolderId(null);
                                setEditingFolderName('');
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setExpandedFolders(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(folder.id)) {
                                    newSet.delete(folder.id);
                                  } else {
                                    newSet.add(folder.id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="flex items-center gap-2 flex-1 text-left"
                              style={{ maxWidth: '90%' }}
                            >
                              <span className={`transform transition-transform text-slate-500 dark:text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}>
                                ▶
                              </span>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                {folder.name}
                              </span>
                              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-[10px] font-semibold whitespace-nowrap">
                                {folderChats.length}
                              </span>
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingFolderId(folder.id);
                                  setEditingFolderName(folder.name);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                                title="Renombrar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteFolder(folder.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                                title="Eliminar"
                              >
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Chats under this folder - Collapsible */}
                      {isExpanded && folderChats.length > 0 && (
                        <div className="px-2 py-2 space-y-1 bg-white dark:bg-slate-800">
                          {folderChats.map(chat => (
                            <div
                              key={chat.id}
                              className={`w-full p-2 rounded-lg transition-colors group ${
                                currentConversation === chat.id
                                  ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                              onClick={() => setCurrentConversation(chat.id)}
                            >
                              <div className="flex flex-col gap-2">
                                {/* Agent Tag */}
                                {chat.agentId && (
                                  <div className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1">
                                      <MessageSquare className="w-2.5 h-2.5" />
                                      {conversations.find(c => c.id === chat.agentId)?.title || 'Agente'}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Chat Title and Actions */}
                                <div className="flex items-center justify-between">
                                  <div className="flex-1" style={{ maxWidth: '90%' }}>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">
                                      {chat.title}
                                    </span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      {chat.lastMessageAt instanceof Date 
                                        ? chat.lastMessageAt.toLocaleDateString()
                                        : new Date(chat.lastMessageAt).toLocaleDateString()
                                      }
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingConversation(chat);
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                                      title="Editar nombre"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Remove from folder (move back to Chats section)
                                        moveChatToFolder(chat.id, null);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900 rounded"
                                      title="Quitar de proyecto"
                                    >
                                      <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Empty state when folder is expanded but has no chats */}
                      {isExpanded && folderChats.length === 0 && (
                        <div className="px-3 py-2 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                          Arrastra chats aquí
                        </div>
                      )}
                    </div>
                  );
                })}
                {folders.length === 0 && (
                  <div className="px-2 py-3 text-center text-xs text-slate-500">
                    No hay proyectos creados
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 3. CHATS Section - Collapsible, shows chats for selected agent */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <button
              onClick={() => setShowChatsSection(!showChatsSection)}
              className="w-full px-3 py-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`transform transition-transform ${showChatsSection ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <MessageSquare className="w-4 h-4" />
                <span>Chats</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                  {selectedAgent 
                    ? conversations.filter(c => c.agentId === selectedAgent && c.status !== 'archived').length
                    : conversations.filter(c => c.status !== 'archived' && c.isAgent === false).length
                  }
                </span>
                {selectedAgent && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    (filtrado)
                  </span>
                )}
              </div>
            </button>
            
            {showChatsSection && (
              <div className="px-2 pb-2 space-y-1">
                {(() => {
                  // Filter chats based on selectedAgent AND exclude chats that are in folders
                  // ✅ NEW: When no agent selected, show ALL chats (from all agents)
                  const filteredChats = selectedAgent 
                    ? conversations.filter(c => c.agentId === selectedAgent && c.status !== 'archived' && !c.folderId)
                    : conversations.filter(c => c.isAgent === false && c.status !== 'archived' && !c.folderId); // All chats not in folders
                  
                  if (filteredChats.length === 0) {
                    return (
                      <div className="px-2 py-3 text-center text-xs text-slate-500">
                        {selectedAgent ? 'No hay chats para este agente' : 'No hay chats sin proyecto'}
                      </div>
                    );
                  }
                  
                  return filteredChats.map(chat => (
                      <div
                        key={chat.id}
                        className={`w-full p-2 rounded-lg transition-colors group ${
                          currentConversation === chat.id
                            ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('chatId', chat.id);
                        }}
                      >
                        {editingConversationId === chat.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveConversationTitle(chat.id, editingTitle);
                                } else if (e.key === 'Escape') {
                                  cancelEditingConversation();
                                }
                              }}
                              onBlur={() => saveConversationTitle(chat.id, editingTitle)}
                              className="flex-1 text-sm font-medium text-slate-700 px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-slate-200"
                              autoFocus
                            />
                            <button
                              onClick={() => saveConversationTitle(chat.id, editingTitle)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditingConversation}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {/* Agent Tag - Always show for chats */}
                            {chat.agentId && (
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold flex items-center gap-1">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  {conversations.find(c => c.id === chat.agentId)?.title || 'Agente'}
                                </span>
                              </div>
                            )}
                            
                            {/* Chat info - clickable area */}
                            <div className="flex items-center justify-between">
                              <div
                                onClick={() => setCurrentConversation(chat.id)}
                                className="flex-1 text-left cursor-pointer"
                                style={{ maxWidth: '90%' }}
                              >
                                <span className="text-sm font-medium truncate text-slate-700 dark:text-slate-200 block">
                                  {chat.title}
                                </span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {chat.lastMessageAt instanceof Date 
                                    ? chat.lastMessageAt.toLocaleDateString()
                                    : new Date(chat.lastMessageAt).toLocaleDateString()
                                  }
                                </p>
                              </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingConversation(chat);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                                title="Editar nombre"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveConversation(chat.id);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900 rounded"
                                title="Archivar"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Archived Section - Collapsible with Folders */}
        {conversations.filter(c => c.status === 'archived').length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setShowArchivedSection(!showArchivedSection)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                <span className="font-medium">Archivados</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                  {conversations.filter(c => c.status === 'archived').length}
                </span>
              </div>
              <span className={`transform transition-transform ${showArchivedSection ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {/* Expanded archived section with folders */}
            {showArchivedSection && (
              <div className="px-2 pb-2 space-y-2">
                {/* Agentes Folder */}
                {conversations.filter(c => c.status === 'archived' && c.isAgent).length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedArchivedAgents(!expandedArchivedAgents)}
                      className="w-full px-3 py-2 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-slate-700">Agentes</span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                          {conversations.filter(c => c.status === 'archived' && c.isAgent).length}
                        </span>
                      </div>
                      <span className={`transform transition-transform text-slate-400 text-xs ${expandedArchivedAgents ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {expandedArchivedAgents && (
                      <div className="p-1 space-y-1">
                        {conversations
                          .filter(c => c.status === 'archived' && c.isAgent)
                          .slice(0, 3)
                          .map(conv => (
                            <div
                              key={conv.id}
                              className={`w-full p-2 rounded transition-colors bg-blue-50/50 hover:bg-blue-50 border border-blue-200/50 ${
                                currentConversation === conv.id ? 'ring-2 ring-blue-400' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 group">
                                <button
                                  onClick={() => setCurrentConversation(conv.id)}
                                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                                  <span className="text-xs font-medium truncate text-blue-700">
                                    {conv.title}
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unarchiveConversation(conv.id);
                                  }}
                                  className="p-1 rounded text-green-600 hover:text-green-700 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  title="Restaurar"
                                >
                                  <ArchiveRestore className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        
                        {/* Show more if there are more than 3 agents */}
                        {conversations.filter(c => c.status === 'archived' && c.isAgent).length > 3 && (
                          <div className="text-center pt-1">
                            <button
                              onClick={() => setShowArchivedConversations(true)}
                              className="text-[10px] text-blue-600 hover:text-blue-700"
                            >
                              +{conversations.filter(c => c.status === 'archived' && c.isAgent).length - 3} más
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Conversaciones Folder */}
                {conversations.filter(c => c.status === 'archived' && !c.isAgent).length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedArchivedChats(!expandedArchivedChats)}
                      className="w-full px-3 py-2 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-semibold text-slate-700">Conversaciones</span>
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-semibold">
                          {conversations.filter(c => c.status === 'archived' && !c.isAgent).length}
                        </span>
                      </div>
                      <span className={`transform transition-transform text-slate-400 text-xs ${expandedArchivedChats ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {expandedArchivedChats && (
                      <div className="p-1 space-y-1">
                        {conversations
                          .filter(c => c.status === 'archived' && !c.isAgent)
                          .slice(0, 3)
                          .map(conv => (
                            <div
                              key={conv.id}
                              className={`w-full p-2 rounded transition-colors bg-purple-50/50 hover:bg-purple-50 border border-purple-200/50 ${
                                currentConversation === conv.id ? 'ring-2 ring-purple-400' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 group">
                                <button
                                  onClick={() => setCurrentConversation(conv.id)}
                                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" />
                                  <span className="text-xs font-medium truncate text-purple-700">
                                    {conv.title}
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unarchiveConversation(conv.id);
                                  }}
                                  className="p-1 rounded text-green-600 hover:text-green-700 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  title="Restaurar"
                                >
                                  <ArchiveRestore className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        
                        {/* Show more if there are more than 3 conversations */}
                        {conversations.filter(c => c.status === 'archived' && !c.isAgent).length > 3 && (
                          <div className="text-center pt-1">
                            <button
                              onClick={() => setShowArchivedConversations(true)}
                              className="text-[10px] text-purple-600 hover:text-purple-700"
                            >
                              +{conversations.filter(c => c.status === 'archived' && !c.isAgent).length - 3} más
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Show all archived link at bottom */}
                <button
                  onClick={() => setShowArchivedConversations(true)}
                  className="w-full px-3 py-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded font-medium"
                >
                  Ver todos los archivados ({conversations.filter(c => c.status === 'archived').length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Context Sources moved to Agent Configuration Modal */}

        {/* User Menu */}
        <div className="border-t border-slate-200 p-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {userName || userEmail || userId}
                </p>
                {userName && userEmail && (
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div 
                className="absolute bottom-full left-0 mb-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-300 dark:border-slate-600 py-2 min-w-[380px] z-50">
                {/* Context Management - Superadmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setShowContextManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Gestión de Contexto</span>
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-600 my-2" />
                  </>
                )}
                
                {/* Agent Evaluation - Experts and Admins */}
                {userEmail && (userEmail === 'alec@getaifactory.com' || userEmail.includes('expert') || userEmail.includes('agent_')) && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowAgentEvaluation(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Award className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Evaluación Rápida</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowEvaluationSystem(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <TestTube className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Sistema de Evaluaciones</span>
                    </button>
                    <div className="border-t border-slate-200 my-2" />
                  </>
                )}
                
                {/* Agent Management - Superadmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowAgentManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <MessageSquare className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Gestión de Agentes</span>
                    </button>
                    <div className="border-t border-slate-200 my-2" />
                  </>
                )}
                
                {/* User Management - SuperAdmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowUserManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Users className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Gestión de Usuarios</span>
                    </button>
                    <div className="h-px bg-slate-200 my-2" />
                  </>
                )}
                
                {/* RAG Configuration - SuperAdmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors rounded-lg group"
                      onClick={() => {
                        setShowRAGConfig(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Database className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Configuración RAG</span>
                    </button>
                    <div className="h-px bg-slate-200 my-2" />
                  </>
                )}

                {/* Provider Management - SuperAdmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowProviderManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <DollarSign className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Gestión de Proveedores</span>
                    </button>
                    <div className="h-px bg-slate-200 my-2" />
                  </>
                )}
                
                {/* Domain Management - SuperAdmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setShowDomainManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Globe className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Gestión de Dominios</span>
                    </button>
                    <div className="h-px bg-slate-200 dark:border-slate-600 my-2" />
                  </>
                )}
                
                {/* Roadmap & Backlog - SuperAdmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      onClick={() => {
                        setShowRoadmap(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1 text-left">
                        <span className="font-medium">Roadmap & Backlog</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kanban + Rudy AI</p>
                      </div>
                    </button>
                    <div className="h-px bg-slate-200 dark:border-slate-600 my-2" />
                  </>
                )}
                
                {/* Analytics - SuperAdmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setShowAnalytics(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Analíticas</span>
                    </button>
                    <div className="h-px bg-slate-200 dark:border-slate-600 my-2" />
                  </>
                )}
                
                {/* ✅ NEW: My Feedback - FOR ALL USERS */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => {
                    setShowMyFeedback(true);
                    setShowUserMenu(false);
                  }}
                >
                  <ListTodo className="w-5 h-5 text-violet-600" />
                  <span className="font-medium">Mi Feedback</span>
                </button>
                
                <div className="h-px bg-slate-200 dark:border-slate-600 my-2" />
                
                {/* Settings and Analytics - HIDDEN FOR USER ROLE */}
                {userRole !== 'user' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setShowUserSettings(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Configuración</span>
                    </button>
                    
                    {/* ✅ NEW: Domain Prompt Button */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setShowDomainPromptModal(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Prompt de Dominio</span>
                    </button>
                    
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setShowSalfaAnalytics(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Analíticas SalfaGPT</span>
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                  </>
                )}
                
                {/* Logout - ALWAYS VISIBLE */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={async () => {
                    try {
                      // Call server-side logout to clear session
                      await fetch('/auth/logout', { method: 'GET' });
                      // Redirect to landing page
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                      // Fallback: clear cookie manually and redirect
                      document.cookie = 'flow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                      window.location.href = '/';
                    }
                  }}
                >
                  <LogOut className="w-4 h-4 text-slate-600" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resize Divider */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
          onMouseDown={() => setIsResizingLeft(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div 
        className="flex-1 flex flex-col"
        onClick={() => {
          // ✅ NEW: Deselect agent filter when clicking in main area
          if (selectedAgent) {
            setSelectedAgent(null);
          }
        }}
      >
        {/* Top Bar - Always visible */}
        <div 
          className="border-b border-slate-200 dark:border-slate-700 px-6 py-3 bg-white dark:bg-slate-800 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()} // ✅ Prevent deselecting when clicking header
        >
          <div className="flex items-center gap-3">
            {currentConversation ? (
              <>
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {conversations.find(c => c.id === currentConversation)?.title || 'Agente'}
                  </h2>
                {/* Agent Tag - Shows which agent is being used for this chat */}
                {getParentAgent() && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Agente: {getParentAgent()?.title}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Model Selector with Dropdown - Only visible for admin role */}
              {userRole === 'admin' && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAgentModelSelector(!showAgentModelSelector);
                    }}
                    disabled={currentConversation?.startsWith('temp-')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      currentAgentConfig?.preferredModel === 'gemini-2.5-pro'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } ${currentConversation?.startsWith('temp-') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Click para cambiar modelo del agente"
                  >
                    <Sparkles className="w-3 h-3" />
                    {currentAgentConfig?.preferredModel === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
                    <span className="text-[10px]">▼</span>
                  </button>
                  
                  {/* Model Selector Dropdown */}
                  {showAgentModelSelector && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-50 min-w-[280px]"
                    >
                      <div className="p-3 border-b border-slate-200 dark:border-slate-600">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Modelo del Agente</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Solo afecta a este agente
                        </p>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        {/* Flash Option */}
                        <button
                          onClick={() => changeAgentModel('gemini-2.5-flash')}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            currentAgentConfig?.preferredModel === 'gemini-2.5-flash'
                              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-slate-800 dark:text-white">Gemini 2.5 Flash</span>
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                              Rápido
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 ml-6">
                            Respuestas rápidas y económicas • 94% más barato
                          </p>
                        </button>
                        
                        {/* Pro Option */}
                        <button
                          onClick={() => changeAgentModel('gemini-2.5-pro')}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            currentAgentConfig?.preferredModel === 'gemini-2.5-pro'
                              ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-slate-800 dark:text-white">Gemini 2.5 Pro</span>
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                              Avanzado
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 ml-6">
                            Mayor precisión y análisis profundo • Tareas complejas
                          </p>
                        </button>
                      </div>
                      
                      <div className="p-2 border-t border-slate-200 dark:border-slate-600">
                        <button
                          onClick={() => setShowAgentModelSelector(false)}
                          className="w-full px-3 py-1.5 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    SalfaGPT
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selecciona un agente o chat para comenzar
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {/* Nuevo Chat Button - Only show when agent is selected - Moved to right */}
            {selectedAgent && (
              <button
                onClick={() => createNewChatForAgent(selectedAgent)}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nuevo Chat
              </button>
            )}
            
            {/* Launch Stella Button - Opens sidebar */}
            <button
              onClick={() => setShowStellaSidebar(true)}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 rounded-lg transition-all flex items-center gap-2 font-semibold shadow-sm"
            >
              <Wand2 className="w-4 h-4" />
              Launch Stella
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()} // ✅ Prevent deselecting when clicking messages
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p>Comienza una conversación...</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                {msg.role === 'user' ? (
                  <div className="inline-block max-w-2xl rounded-lg bg-blue-600 text-white">
                    <div className="px-4 pt-3 pb-2 border-b border-blue-500 flex items-center justify-between">
                      <span className="text-sm font-semibold">Tú:</span>
                      <button
                        onClick={() => copyMessageAsMarkdown(msg.content, msg.id)}
                        className="p-1.5 rounded hover:bg-blue-700 transition-colors"
                        title="Copiar en formato Markdown"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-4 h-4 text-green-300" />
                        ) : (
                          <Copy className="w-4 h-4 text-blue-200" />
                        )}
                      </button>
                    </div>
                    <div className="px-4 pb-4 pt-2">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="inline-block max-w-3xl rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">SalfaGPT:</span>
                      <div className="flex items-center gap-2">
                        {/* Copy button */}
                        <button
                          onClick={() => copyMessageAsMarkdown(msg.content, msg.id)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Copiar en formato Markdown"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          )}
                        </button>
                        {/* Show response time if available */}
                        {msg.responseTime && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {formatResponseTime(msg.responseTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      {/* Show thinking steps if present */}
                      {msg.thinkingSteps && msg.thinkingSteps.length > 0 ? (
                        <div className="space-y-3 min-w-[320px]">
                          {msg.thinkingSteps.map((step, index) => {
                            // Generate ellipsis based on dots count (1, 2, or 3)
                            // dots cycles: 0, 1, 2, 3 → display: ".", "..", "...", "."
                            let ellipsis = '';
                            if (step.status === 'active') {
                              const dotCount = (step.dots || 0) % 3 + 1; // Convert 0,1,2,3 → 1,2,3,1
                              ellipsis = '.'.repeat(dotCount);
                            }
                            
                            // Remove existing ellipsis from label if present, then add animated one
                            const baseLabel = step.label.replace(/\.\.\.?$/, '');
                            const displayLabel = step.status === 'active' 
                              ? `${baseLabel}${ellipsis}`
                              : step.label;
                            
                            return (
                              <div
                                key={step.id}
                                className={`flex items-center gap-3 transition-all duration-300 ${
                                  step.status === 'complete' ? 'opacity-50' : 
                                  step.status === 'active' ? 'opacity-100' : 
                                  'opacity-30'
                                }`}
                              >
                                {step.status === 'complete' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                ) : step.status === 'active' ? (
                                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                )}
                                <span className={`text-sm min-w-[280px] ${
                                  step.status === 'active' ? 'font-semibold text-slate-800 dark:text-slate-100' : 
                                  'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {displayLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Show actual message content */
                        <div className="relative">
                          <MessageRenderer 
                            content={msg.content}
                            contextSources={contextSources
                              .filter(s => s.enabled)
                              .map(s => ({
                                id: s.id,
                                name: s.name,
                                validated: s.metadata?.validated || false,
                              }))
                            }
                            references={msg.references} // Pass references for this message
                            onReferenceClick={(reference) => {
                              console.log('🔍 Opening reference panel:', reference);
                              setSelectedReference(reference);
                            }}
                            onSourceClick={(sourceId) => {
                              const source = contextSources.find(s => s.id === sourceId);
                              if (source) {
                                setSettingsSource(source);
                              }
                            }}
                          />
                          {/* Streaming cursor indicator */}
                          {msg.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-blue-600 animate-pulse" 
                                  style={{ animation: 'blink 1s step-end infinite' }} />
                          )}
                          
                          {/* Feedback Buttons - Only for assistant messages that are not streaming */}
                          {!msg.isStreaming && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                ¿Te fue útil esta respuesta?
                              </span>
                              
                              {/* Expert Feedback (purple) - Only for admin, expert, superadmin */}
                              {['admin', 'expert', 'superadmin'].includes(userRole || '') && (
                                <button
                                  onClick={() => {
                                    setFeedbackMessageId(msg.id);
                                    setShowExpertFeedback(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors text-xs font-medium"
                                  title="Feedback Experto"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  Experto
                                </button>
                              )}
                              
                              {/* User Feedback (violet-yellow gradient) - For all users */}
                              <button
                                onClick={() => {
                                  setFeedbackMessageId(msg.id);
                                  setShowUserFeedback(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-yellow-100 hover:from-violet-200 hover:to-yellow-200 text-violet-700 rounded-lg transition-colors text-xs font-medium"
                                title="Tu Opinión"
                              >
                                <Star className="w-3.5 h-3.5" />
                                Calificar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div 
          className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
          onClick={(e) => e.stopPropagation()} // ✅ Prevent deselecting when clicking input area
        >
          <div className="max-w-4xl mx-auto">
            {/* Context Button */}
            <div className="mb-3 flex justify-center">
              <button
                onClick={() => setShowContextPanel(!showContextPanel)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              >
                <span className="font-medium">Contexto:</span>
                <span className={`${
                  calculateContextUsage().usagePercent > 80 ? 'text-red-600' : 
                  calculateContextUsage().usagePercent > 50 ? 'text-yellow-600' : 
                  'text-green-600'
                } font-semibold`}>
                  {calculateContextUsage().usagePercent}%
                </span>
                <span className="text-slate-400">•</span>
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">
                  {globalUserSettings.preferredModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-600" title={`contextStats: ${contextStats ? JSON.stringify(contextStats) : 'null'}`}>
                  {contextStats ? contextStats.activeCount : 0} fuentes
                </span>
              </button>
            </div>

            {/* Context Panel */}
            {showContextPanel && (
              <div className="mb-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Header with stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Desglose del Contexto</h4>
                      {getParentAgent() && (
                        <p className="text-xs text-blue-600 mt-1">
                          📋 Usando contexto del agente: <span className="font-semibold">{getParentAgent()?.title}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        calculateContextUsage().usagePercent > 80 ? 'bg-red-100 text-red-700' :
                        calculateContextUsage().usagePercent > 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {calculateContextUsage().usagePercent}% usado
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                    <div className="bg-white rounded p-2">
                      <p className="text-slate-500 mb-1">Total Tokens</p>
                      <p className="font-bold text-slate-800">
                        {calculateContextUsage().estimatedTokens.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-slate-500 mb-1">Disponible</p>
                      <p className="font-bold text-slate-800">
                        {(calculateContextUsage().modelWindow - calculateContextUsage().estimatedTokens).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-slate-500 mb-1">Capacidad</p>
                      <p className="font-bold text-slate-800">
                        {(calculateContextUsage().modelWindow / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                  
                  {/* Context Breakdown by Component - NUEVO */}
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-slate-700 mb-2">📊 Desglose Detallado</h5>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">System Prompt:</span>
                        <span className="font-semibold text-slate-700">
                          {calculateContextUsage().systemTokens.toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Historial ({messages.length} mensajes):</span>
                        <span className="font-semibold text-slate-700">
                          {calculateContextUsage().messageTokens.toLocaleString()} tokens
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-1.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 text-xs font-medium">Contexto de Fuentes:</span>
                            {calculateContextUsage().ragSources > 0 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold flex items-center gap-1">
                                🔍 {calculateContextUsage().ragSources} RAG
                              </span>
                            )}
                            {calculateContextUsage().fullTextSources > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold flex items-center gap-1">
                                📝 {calculateContextUsage().fullTextSources} Full
                              </span>
                            )}
                          </div>
                          <span className={`font-bold ${
                            calculateContextUsage().ragSources > 0 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {calculateContextUsage().contextTokens.toLocaleString()} tokens
                          </span>
                        </div>
                        
                        {/* RAG Status Indicator - NEW: More visible */}
                        {calculateContextUsage().ragSources > 0 && (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-2 py-1">
                            <span className="text-[9px] text-green-700 font-medium">
                              ✅ RAG Optimizado Activo
                            </span>
                            <span className="text-[9px] text-green-600 font-bold">
                              {(() => {
                                const totalChunksAvailable = contextSources
                                  .filter(s => s.enabled && s.ragEnabled)
                                  .reduce((sum, s) => sum + (s.ragMetadata?.chunkCount || 0), 0);
                                return `${totalChunksAvailable} chunks indexados`;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Savings indicator */}
                      {calculateContextUsage().ragSources > 0 && (() => {
                        const fullTextEstimate = contextSources.filter(s => s.enabled).reduce((sum, s) => 
                          sum + Math.ceil((s.extractedData?.length || 0) / 4), 0
                        );
                        const saved = fullTextEstimate - calculateContextUsage().contextTokens;
                        const percent = (saved / fullTextEstimate * 100).toFixed(0);
                        
                        return saved > 0 && (
                          <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded px-2 py-1 mt-1.5">
                            <span className="text-green-700 font-semibold">💰 Ahorro vs Full-Text:</span>
                            <span className="font-bold text-green-600">
                              -{saved.toLocaleString()} tokens ({percent}%)
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Content breakdown */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {/* System Prompt - 🔑 HIERARCHICAL: Domain + Agent */}
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold text-slate-700">System Prompt</h5>
                      <span className="text-xs text-slate-500">
                        ~{(() => {
                          const finalPrompt = combineDomainAndAgentPrompts(
                            currentDomainPrompt,
                            currentAgentPrompt || currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt
                          );
                          return Math.ceil(finalPrompt.length / 4);
                        })()} tokens
                      </span>
                    </div>
                    {/* Show hierarchical structure */}
                    <div className="space-y-2">
                      {currentDomainPrompt && (
                        <div className="text-xs bg-blue-50 border border-blue-200 p-2 rounded">
                          <p className="font-semibold text-blue-800 mb-1">📋 Domain Prompt:</p>
                          <p className="text-slate-700">
                            {currentDomainPrompt.substring(0, 100)}
                            {currentDomainPrompt.length > 100 && '...'}
                          </p>
                        </div>
                      )}
                      <div className="text-xs bg-slate-50 p-2 rounded">
                        <p className="font-semibold text-slate-700 mb-1">
                          {currentDomainPrompt ? '✨ Agent Prompt:' : 'System Prompt:'}
                        </p>
                        <p className="text-slate-600">
                          {(() => {
                            const agentPrompt = currentAgentPrompt || currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt;
                            return agentPrompt.substring(0, 150) + (agentPrompt.length > 150 ? '...' : '');
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  {messages.length > 0 && (
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-slate-700">Historial de Conversación</h5>
                        <span className="text-xs text-slate-500">
                          {messages.length} mensajes • ~{Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4)} tokens
                        </span>
                      </div>
                      <div className="space-y-1">
                        {messages.slice(-3).map((msg, idx) => (
                          <div key={msg.id} className="text-xs bg-slate-50 p-2 rounded">
                            <span className={`font-semibold ${msg.role === 'user' ? 'text-blue-600' : 'text-purple-600'}`}>
                              {msg.role === 'user' ? '👤 Usuario' : '🤖 Asistente'}:
                            </span>
                            <span className="text-slate-600 ml-2">
                              {msg.content.substring(0, 80)}{msg.content.length > 80 && '...'}
                            </span>
                          </div>
                        ))}
                        {messages.length > 3 && (
                          <p className="text-xs text-slate-500 text-center pt-1">
                            ...y {messages.length - 3} mensajes más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Context Sources with RAG Controls - HIDDEN FOR USER ROLE */}
                  {userRole !== 'user' && (
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold text-slate-700">Fuentes de Contexto</h5>
                      <span className="text-xs text-slate-500">
                        {contextStats ? (
                          <>
                            <span className="font-semibold text-green-600">{contextStats.activeCount} activas</span>
                            {' / '}
                            <span>{contextStats.totalCount} asignadas</span>
                            {' • '}
                            <span className="text-blue-600">BigQuery RAG</span>
                          </>
                        ) : (
                          'Cargando...'
                        )}
                      </span>
                    </div>
                    
                    {/* RAG Bulk Actions - NUEVO - More Evident */}
                    {contextSources.filter(s => s.enabled && s.ragEnabled).length > 0 && (
                      <div className="mb-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">⚙️ Modo de Búsqueda</span>
                            <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                              Aplicar a todos
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              // Enable RAG for all sources that have it available
                              setContextSources(prev => prev.map(s => 
                                s.enabled && s.ragEnabled ? { ...s, useRAGMode: true } : s
                              ));
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                          >
                            🔍 Todos RAG
                            <span className="text-[10px] opacity-90">(Optimizado)</span>
                          </button>
                          <button
                            onClick={() => {
                              // Disable RAG for all (use full-text)
                              setContextSources(prev => prev.map(s => 
                                s.enabled ? { ...s, useRAGMode: false } : s
                              ));
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                          >
                            📝 Todos Full-Text
                            <span className="text-[10px] opacity-90">(Completo)</span>
                          </button>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-[9px] text-slate-600">
                            Ahorro estimado con RAG: 
                            <span className="font-bold text-green-600 ml-1">
                              ~{(() => {
                                const full = contextSources.filter(s => s.enabled).reduce((sum, s) => 
                                  sum + Math.floor((s.extractedData?.length || 0) / 4), 0
                                );
                                const rag = contextSources.filter(s => s.enabled && s.ragEnabled).length * 2500;
                                return ((full - rag) / full * 100).toFixed(0);
                              })()}%
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {/* ✅ NEW: Show stats-based display (no source list needed for BigQuery RAG) */}
                    {contextStats && contextStats.activeCount > 0 ? (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-bold text-green-800">
                            BigQuery RAG Activo
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mb-2">
                          <span className="font-bold text-green-600">{contextStats.activeCount} fuentes</span> indexadas con embeddings semánticos.
                        </p>
                        <div className="bg-white/50 rounded p-2 text-[10px] text-slate-600">
                          <p className="flex items-center gap-1 mb-1">
                            <span>⚡</span>
                            <span>BigQuery busca fragmentos relevantes automáticamente</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <span>📊</span>
                            <span>Referencias se cargan dinámicamente en cada respuesta</span>
                          </p>
                        </div>
                      </div>
                    ) : contextStats && contextStats.totalCount > 0 ? (
                      <p className="text-xs text-slate-500 bg-yellow-50 border border-yellow-200 p-3 rounded text-center">
                        <span className="font-semibold">{contextStats.totalCount} fuentes asignadas</span>, pero ninguna activa.
                        <br />
                        <button 
                          onClick={() => {
                            setShowAgentContextModal(true);
                            setAgentForContextConfig(currentConversation);
                          }}
                          className="text-blue-600 hover:underline mt-2 inline-block font-medium"
                        >
                          → Activar fuentes
                        </button>
                      </p>
                    ) : contextStats ? (
                      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded text-center">
                        No hay fuentes asignadas a este agente.
                        <br />
                        <button 
                          onClick={() => {
                            setShowAgentContextModal(true);
                            setAgentForContextConfig(currentConversation);
                          }}
                          className="text-blue-600 hover:underline mt-2 inline-block font-medium"
                        >
                          → Configurar fuentes
                        </button>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 bg-slate-50 p-2 rounded text-center animate-pulse">
                        Cargando estado de fuentes...
                      </p>
                    )}
                    
                    {/* OLD: Source list hidden - BigQuery handles RAG automatically */}
                    {false && contextSources.length > 0 && (
                      <div className="space-y-2 max-h-96 overflow-y-auto hidden">
                        {contextSources.map(source => {
                          // Calculate tokens for this source
                          const fullTextTokens = Math.floor((source.extractedData?.length || 0) / 4);
                          const ragTokens = source.ragEnabled && source.ragMetadata 
                            ? (source.ragMetadata.chunkCount || 100) * 25  // ~25 tokens per chunk on average for top 5
                            : fullTextTokens;
                          
                          // Get current mode for this source (user preference, not whether RAG is available)
                          const sourceRAGMode = (source as any).useRAGMode !== false;  // Default to true (RAG preferred)
                          
                          return (
                          <div
                            key={source.id}
                            className={`w-full border rounded p-2 transition-all ${
                              source.enabled 
                                ? 'bg-green-50 border-green-200 shadow-sm'
                                : 'bg-slate-50 border-slate-200 opacity-50'
                            }`}
                          >
                            {/* Header: Name and badges only (NO toggle here - está en sidebar) */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${source.enabled ? 'text-green-600' : 'text-slate-400'}`} />
                                <p className={`text-xs font-semibold truncate ${source.enabled ? 'text-slate-800' : 'text-slate-500'}`}>
                                  {source.name}
                                </p>
                                {/* Estado de activación badge */}
                                {!source.enabled && (
                                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] rounded-full font-semibold flex-shrink-0">
                                    ○ Inactiva
                                  </span>
                                )}
                                {(source.labels?.includes('PUBLIC') || source.labels?.includes('public')) && (
                                  <span className="px-1.5 py-0.5 bg-slate-800 text-white text-[9px] rounded-full font-semibold flex-shrink-0">
                                    🌐 PUBLIC
                                  </span>
                                )}
                                {source.metadata?.validated && (
                                  <span className="px-1.5 py-0.5 bg-green-600 text-white text-[9px] rounded-full font-semibold flex-shrink-0">
                                    ✓ Validado
                                  </span>
                                )}
                                {source.ragEnabled && source.ragMetadata && (
                                  <span 
                                    className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] rounded-full font-semibold flex-shrink-0 flex items-center gap-1"
                                    title={`RAG Indexado: ${source.ragMetadata.chunkCount} chunks de ~${source.ragMetadata.avgChunkSize || 500} tokens c/u. Embeddings generados el ${source.ragMetadata.indexedAt ? new Date(source.ragMetadata.indexedAt).toLocaleDateString() : 'N/A'}`}
                                  >
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                                    🔍 {source.ragMetadata.chunkCount} chunks
                                  </span>
                                )}
                              </div>
                              
                              {/* CLI Tag - Show if uploaded via CLI */}
                              {source.tags?.includes('cli') && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded flex-shrink-0">
                                  🔷 CLI
                                </span>
                              )}
                              
                              {/* RAG/Full Toggle Switch - Like ON/OFF toggle */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] font-medium text-slate-600">
                                  {sourceRAGMode ? '🔍 RAG' : '📝 Full'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Toggle between RAG and Full-Text
                                    setContextSources(prev => prev.map(s => 
                                      s.id === source.id ? { ...s, useRAGMode: !sourceRAGMode } : s
                                    ));
                                    // Recalculate context usage immediately
                                    setTimeout(() => calculateContextUsage(), 100);
                                  }}
                                  className="flex-shrink-0"
                                  title={sourceRAGMode ? 'Cambiar a Full-Text' : 'Cambiar a RAG'}
                                >
                                  <div
                                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                                      sourceRAGMode ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                        sourceRAGMode ? 'translate-x-5' : 'translate-x-0.5'
                                      } mt-0.5`}
                                    />
                                  </div>
                                </button>
                              </div>
                            </div>
                            
                            {/* Warning if RAG not indexed */}
                            {!source.ragEnabled && sourceRAGMode && (
                              <div className="mt-1 text-center bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                                <span className="text-[9px] text-yellow-700 font-medium">
                                  ⚠️ RAG no indexado - usará Full-Text
                                </span>
                                {' '}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSettingsSource(source);
                                  }}
                                  className="text-[9px] text-yellow-800 hover:underline font-semibold"
                                >
                                  Re-extraer
                                </button>
                              </div>
                            )}
                            
                            {/* RAG Stats - Show when RAG enabled and using RAG mode */}
                            {source.ragEnabled && sourceRAGMode && source.ragMetadata && (
                              <div className="mt-2 bg-purple-50 border border-purple-200 rounded px-2 py-1.5 space-y-0.5">
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-purple-700 font-medium">✅ Indexado con RAG</span>
                                  <span className="text-purple-600 font-bold">{source.ragMetadata.chunkCount} chunks</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-purple-600">Estimado por consulta:</span>
                                  <span className="text-purple-700 font-mono">~2,500 tokens</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-purple-600">Full-text sería:</span>
                                  <span className="text-slate-500 font-mono line-through">{fullTextTokens.toLocaleString()} tokens</span>
                                </div>
                                <div className="flex items-center justify-center pt-1 border-t border-purple-200">
                                  <span className="text-[9px] text-green-700 font-bold">
                                    💰 Ahorro: ~{Math.max(0, Math.round((1 - 2500 / fullTextTokens) * 100))}%
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Full-text mode indicator */}
                            {!source.ragEnabled && !sourceRAGMode && (
                              <div className="mt-1 text-center">
                                <span className="text-[9px] text-slate-500">
                                  📝 {fullTextTokens.toLocaleString()} tokens (documento completo)
                                </span>
                              </div>
                            )}
                            
                            {/* Preview text - only if not showing RAG stats */}
                            {!source.ragEnabled && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {source.extractedData?.substring(0, 100)}
                                {(source.extractedData?.length || 0) > 100 && '...'}
                              </p>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Context Logs - New Section */}
                  {contextLogs.length > 0 && (
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-slate-700">📊 Log de Contexto por Interacción</h5>
                        <span className="text-xs text-slate-500">
                          {contextLogs.length} interacciones registradas
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="px-2 py-1 text-left font-semibold text-slate-700">Hora</th>
                              <th className="px-2 py-1 text-left font-semibold text-slate-700">Pregunta</th>
                              <th className="px-2 py-1 text-left font-semibold text-slate-700">Modelo</th>
                              <th className="px-2 py-1 text-center font-semibold text-slate-700">Modo</th>
                              <th className="px-2 py-1 text-right font-semibold text-slate-700">Input</th>
                              <th className="px-2 py-1 text-right font-semibold text-slate-700">Output</th>
                              <th className="px-2 py-1 text-right font-semibold text-slate-700">Total</th>
                              <th className="px-2 py-1 text-right font-semibold text-slate-700">Disponible</th>
                              <th className="px-2 py-1 text-center font-semibold text-slate-700">Uso%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contextLogs.map((log, idx) => {
                              const usagePercent = ((log.contextWindowUsed / log.contextWindowCapacity) * 100).toFixed(2);
                              return (
                                <tr 
                                  key={log.id} 
                                  className={`border-b border-slate-100 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                >
                                  <td className="px-2 py-2 text-slate-600">
                                    {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-2 py-2 text-slate-800">
                                    <div className="max-w-xs truncate" title={log.userMessage}>
                                      {log.userMessage}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                      log.model === 'gemini-2.5-pro' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {log.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    {log.ragConfiguration ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span 
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                            log.ragConfiguration.actuallyUsed
                                              ? 'bg-green-100 text-green-700' 
                                              : log.ragConfiguration.hadFallback
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-blue-100 text-blue-700'
                                          }`}
                                          title={
                                            log.ragConfiguration.actuallyUsed 
                                              ? `RAG Optimizado: ${log.ragConfiguration.stats?.totalChunks || 0} chunks relevantes con ${((log.ragConfiguration.stats?.avgSimilarity || 0) * 100).toFixed(1)}% de similaridad promedio` 
                                              : log.ragConfiguration.hadFallback
                                              ? 'RAG habilitado pero sin chunks encontrados - usando documento completo'
                                              : 'Modo Full-Text - documento completo enviado'
                                          }
                                        >
                                          {log.ragConfiguration.actuallyUsed ? '🔍 RAG' : log.ragConfiguration.hadFallback ? '⚠️ Full' : '📝 Full'}
                                        </span>
                                        {log.ragConfiguration.actuallyUsed && log.ragConfiguration.stats && (
                                          <span className="text-[8px] text-green-600 font-medium">
                                            {log.ragConfiguration.stats.totalChunks} chunks
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                                        N/A
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-right font-mono text-slate-700">
                                    {log.totalInputTokens.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-2 text-right font-mono text-slate-700">
                                    {log.totalOutputTokens.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-2 text-right font-mono font-semibold text-slate-800">
                                    {log.contextWindowUsed.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-2 text-right font-mono text-slate-600">
                                    {log.contextWindowAvailable.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                      parseFloat(usagePercent) > 80 ? 'bg-red-100 text-red-700' :
                                      parseFloat(usagePercent) > 50 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {usagePercent}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Expandable details on click */}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Ver detalles completos de cada interacción
                        </summary>
                        <div className="mt-2 space-y-2">
                          {contextLogs.map((log, idx) => (
                            <div key={log.id} className="border border-slate-200 rounded p-2 bg-white">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <p className="font-semibold text-slate-700 mb-1">#{idx + 1} - {new Date(log.timestamp).toLocaleTimeString()}</p>
                                  <p className="text-slate-600"><strong>Pregunta:</strong> {log.userMessage}</p>
                                  <p className="text-slate-600"><strong>Modelo:</strong> {log.model}</p>
                                  <p className="text-slate-600"><strong>System Prompt:</strong> {log.systemPrompt.substring(0, 100)}...</p>
                                </div>
                                <div>
                                  <p className="text-slate-600"><strong>Fuentes activas:</strong></p>
                                  <ul className="ml-4 list-disc">
                                    {log.contextSources.length > 0 ? (
                                      log.contextSources.map((source, sidx) => (
                                        <li key={sidx} className="text-slate-600">
                                          {source.mode === 'rag' ? '🔍' : '📝'} {source.name} ({source.tokens.toLocaleString()} tokens)
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-slate-500 italic">Ninguna</li>
                                    )}
                                  </ul>
                                  
                                  {/* NEW: RAG Configuration Details */}
                                  {log.ragConfiguration && (
                                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                                      <p className="font-semibold text-slate-700 mb-1">🔍 Configuración RAG:</p>
                                      <div className="space-y-0.5 text-[9px]">
                                        <p>
                                          <strong>Habilitado:</strong> {log.ragConfiguration.enabled ? 'Sí' : 'No'}
                                        </p>
                                        <p>
                                          <strong>Realmente usado:</strong>{' '}
                                          <span className={log.ragConfiguration.actuallyUsed ? 'text-green-600' : 'text-yellow-600'}>
                                            {log.ragConfiguration.actuallyUsed ? 'Sí ✓' : 'No (fallback)'}
                                          </span>
                                        </p>
                                        {log.ragConfiguration.actuallyUsed && log.ragConfiguration.stats && (
                                          <>
                                            <p><strong>Chunks usados:</strong> {log.ragConfiguration.stats.totalChunks}</p>
                                            <p><strong>Tokens RAG:</strong> {log.ragConfiguration.stats.totalTokens.toLocaleString()}</p>
                                            <p><strong>Similaridad promedio:</strong> {(log.ragConfiguration.stats.avgSimilarity * 100).toFixed(1)}%</p>
                                            <p><strong>TopK:</strong> {log.ragConfiguration.topK}</p>
                                            <p><strong>Min Similaridad:</strong> {log.ragConfiguration.minSimilarity}</p>
                                            
                                            {log.ragConfiguration.stats.sources && log.ragConfiguration.stats.sources.length > 0 && (
                                              <div className="mt-1">
                                                <strong>Por documento:</strong>
                                                <ul className="ml-2 mt-0.5">
                                                  {log.ragConfiguration.stats.sources.map((src: any, i: number) => (
                                                    <li key={i}>
                                                      {src.name}: {src.chunkCount} chunks, {src.tokens.toLocaleString()} tokens
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {log.ragConfiguration.hadFallback && (
                                          <p className="text-yellow-600">
                                            <strong>⚠️ Fallback:</strong> RAG no encontró chunks relevantes, usó documentos completos
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-[10px]">
                                <p className="text-slate-600"><strong>Respuesta:</strong></p>
                                <p className="text-slate-700 bg-slate-50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                                  {log.aiResponse}
                                </p>
                              </div>
                              
                              {/* NEW: Display chunk references used in response */}
                              {log.references && log.references.length > 0 && (
                                <div className="mt-2 text-[10px]">
                                  <p className="text-slate-600 font-semibold mb-1">
                                    📚 Referencias utilizadas ({log.references.length} chunks):
                                  </p>
                                  <div className="space-y-1">
                                    {log.references.map(ref => (
                                      <button
                                        key={ref.id}
                                        onClick={() => {
                                          console.log('🔍 Opening reference from context log:', ref);
                                          setSelectedReference(ref);
                                        }}
                                        className="w-full text-left bg-blue-50 border border-blue-200 rounded p-2 hover:bg-blue-100 transition-colors"
                                      >
                                        <div className="flex items-start gap-2">
                                          <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[9px] border border-blue-300 flex-shrink-0">
                                            [{ref.id}]
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                              <p className="text-[9px] font-semibold text-slate-800 truncate">
                                                {ref.sourceName}
                                              </p>
                                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                                ref.similarity >= 0.8 ? 'bg-green-100 text-green-700' :
                                                ref.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-orange-100 text-orange-700'
                                              }`}>
                                                {(ref.similarity * 100).toFixed(1)}%
                                              </span>
                                            </div>
                                            <p className="text-[9px] text-slate-600 line-clamp-2">
                                              {ref.snippet}
                                            </p>
                                            <p className="text-[8px] text-slate-500 mt-0.5">
                                              Chunk #{ref.chunkIndex + 1}
                                              {ref.metadata?.tokenCount && ` • ${ref.metadata.tokenCount} tokens`}
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sample Questions Carousel */}
            {(() => {
              // Get agent for this conversation (direct agent or parent agent for chats)
              const currentConv = conversations.find(c => c.id === currentConversation);
              const parentAgent = getParentAgent();
              const agentToUse = parentAgent || currentConv; // Use parent agent if chat, otherwise use conversation
              const agentCode = getAgentCode(agentToUse?.title);
              const sampleQuestions = getSampleQuestions(agentCode);
              
              // Only show if agent has sample questions and messages is empty or minimal
              if (sampleQuestions.length === 0 || messages.length > 2) return null;
              
              // Calculate visible questions (3 at a time)
              const visibleStart = sampleQuestionIndex;
              const visibleQuestions = [
                sampleQuestions[visibleStart],
                sampleQuestions[(visibleStart + 1) % sampleQuestions.length],
                sampleQuestions[(visibleStart + 2) % sampleQuestions.length],
              ];
              
              // Calculate progress: starts at 3 (showing first 3 questions)
              // Takes 7 clicks to complete the full cycle (see all 10 questions)
              // Index 0: showing Q1,Q2,Q3 → progress 3/10 (30%)
              // Index 1: showing Q2,Q3,Q4 → progress 4/10 (40%) - saw 1 new
              // Index 2: showing Q3,Q4,Q5 → progress 5/10 (50%) - saw 2 new
              // ...
              // Index 7: showing Q8,Q9,Q10 → progress 10/10 (100%) - saw all
              // Index 8+: wraps back to start → progress 3/10 again
              const calculateProgress = () => {
                if (sampleQuestions.length === 0) return 0;
                
                // After index 7, we've seen all questions, so wrap back to 3
                if (sampleQuestionIndex >= sampleQuestions.length - 2) {
                  // At the end of the list, back to showing 3
                  return 3 + (sampleQuestionIndex - (sampleQuestions.length - 2));
                }
                
                // Normal progression: 3 + index (0-7 = 3-10)
                return 3 + sampleQuestionIndex;
              };
              
              const progressCount = calculateProgress();
              const progressPercent = (progressCount / sampleQuestions.length) * 100;
              
              return (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      💡 Preguntas de ejemplo
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Mostrando {Math.min(3, sampleQuestions.length)} de {sampleQuestions.length} preguntas
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={prevSampleQuestion}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Pregunta anterior"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Questions */}
                    <div className="flex-1 grid grid-cols-3 gap-2 overflow-hidden">
                      {visibleQuestions.map((question, idx) => (
                        <button
                          key={`${visibleStart + idx}-${question}`}
                          onClick={() => handleSampleQuestionClick(question)}
                          className="group relative px-3 py-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 border border-blue-200 dark:border-slate-500 rounded-lg hover:shadow-md hover:scale-[1.02] transition-all text-left"
                          title={question}
                        >
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium line-clamp-2 leading-snug">
                            {question}
                          </p>
                          <div className="absolute inset-0 bg-blue-600 dark:bg-blue-500 opacity-0 group-hover:opacity-5 rounded-lg transition-opacity" />
                        </button>
                      ))}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={nextSampleQuestion}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Siguiente pregunta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Progress Bar - Shows how many questions have been seen */}
                  <div className="mt-2 px-11">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                        {progressCount}/{sampleQuestions.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  const currentAgentLoading = currentConversation && agentProcessing[currentConversation]?.isProcessing;
                  if (e.key === 'Enter' && !currentAgentLoading && input.trim()) {
                    sendMessage();
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={currentConversation ? agentProcessing[currentConversation]?.isProcessing : false}
              />
              {currentConversation && agentProcessing[currentConversation]?.isProcessing ? (
                <button
                  onClick={stopProcessing}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <StopCircle className="w-5 h-5" />
                  Detener
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              SalfaGPT puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Workflows */}
      {showRightPanel && (
        <div 
          className="bg-white border-l border-slate-200 flex flex-col relative"
          style={{ width: `${rightPanelWidth}px` }}
        >
          {/* Resize Divider */}
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-10"
            onMouseDown={() => setIsResizingRight(true)}
          />

          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Workflows</h3>
            <p className="text-xs text-slate-500 mt-1">Procesa documentos y APIs</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => console.log('Open workflow:', workflow.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{workflow.icon}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{workflow.name}</h4>
                      <p className="text-xs text-slate-500">{workflow.description}</p>
                    </div>
                  </div>
                  {getWorkflowStatusIcon(workflow.status)}
                </div>

                {/* Workflow Config Preview */}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Max: {workflow.config.maxFileSize} MB</span>
                    {workflow.config.model && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {workflow.config.model === 'gemini-2.5-flash' ? 'Flash' : 'Pro'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreSelectedSourceType(workflow.sourceType);
                      setShowAddSourceModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Ejecutar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfigWorkflow(workflow);
                    }}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs rounded hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>

                {/* Workflow Output Preview */}
                {workflow.status === 'completed' && workflow.output && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    <p className="font-medium">✓ Completado</p>
                    <p className="mt-1 text-[10px] text-green-700">
                      {workflow.output.substring(0, 80)}...
                    </p>
                  </div>
                )}

                {workflow.status === 'failed' && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    <p className="font-medium">✗ Error</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Toggle Panel Button */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => setShowRightPanel(false)}
              className="w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors"
            >
              Ocultar Panel →
            </button>
          </div>
        </div>
      )}

      {/* Show Panel Button (when hidden) - HIDDEN FOR NOW */}
      {false && !showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 px-2 py-4 bg-blue-600 text-white rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          ← Workflows
        </button>
      )}

      {/* Add Source Modal */}
      {/* View All Archived Modal */}
      {showArchivedConversations && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <Archive className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-bold text-slate-800">Archivados</h2>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                  {conversations.filter(c => c.status === 'archived').length}
                </span>
              </div>
              <button
                onClick={() => setShowArchivedConversations(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Archived list with folders */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {/* Agentes Archivados Folder */}
                {conversations.filter(c => c.status === 'archived' && c.isAgent).length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Folder Header */}
                    <button
                      onClick={() => setExpandedArchivedAgents(!expandedArchivedAgents)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-800">Agentes</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {conversations.filter(c => c.status === 'archived' && c.isAgent).length}
                        </span>
                      </div>
                      <span className={`transform transition-transform text-slate-500 ${expandedArchivedAgents ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {/* Folder Content */}
                    {expandedArchivedAgents && (
                      <div className="p-2 space-y-2">
                        {conversations
                          .filter(c => c.status === 'archived' && c.isAgent)
                          .map(conv => (
                            <div
                              key={conv.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                currentConversation === conv.id
                                  ? 'bg-blue-50 border-blue-400'
                                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => {
                                    setCurrentConversation(conv.id);
                                    setShowArchivedConversations(false);
                                  }}
                                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                                >
                                  <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800 truncate">{conv.title}</p>
                                    <p className="text-xs text-slate-500">
                                      Última actividad: {new Date(conv.lastMessageAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unarchiveConversation(conv.id);
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  Restaurar
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conversaciones Archivadas Folder */}
                {conversations.filter(c => c.status === 'archived' && !c.isAgent).length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Folder Header */}
                    <button
                      onClick={() => setExpandedArchivedChats(!expandedArchivedChats)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-slate-800">Conversaciones</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          {conversations.filter(c => c.status === 'archived' && !c.isAgent).length}
                        </span>
                      </div>
                      <span className={`transform transition-transform text-slate-500 ${expandedArchivedChats ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {/* Folder Content */}
                    {expandedArchivedChats && (
                      <div className="p-2 space-y-2">
                        {conversations
                          .filter(c => c.status === 'archived' && !c.isAgent)
                          .map(conv => (
                            <div
                              key={conv.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                currentConversation === conv.id
                                  ? 'bg-purple-50 border-purple-400'
                                  : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => {
                                    setCurrentConversation(conv.id);
                                    setShowArchivedConversations(false);
                                  }}
                                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                                >
                                  <MessageSquare className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800 truncate">{conv.title}</p>
                                    <p className="text-xs text-slate-500">
                                      Última actividad: {new Date(conv.lastMessageAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    unarchiveConversation(conv.id);
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  Restaurar
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state if no archived items */}
                {conversations.filter(c => c.status === 'archived').length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Archive className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No hay elementos archivados</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Context Configuration Modal - Optimized with Pagination */}
      {showAgentContextModal && agentForContextConfig && (
        <AgentContextModal
          isOpen={showAgentContextModal}
          onClose={() => {
            setShowAgentContextModal(false);
            setAgentForContextConfig(null);
            // Refresh context after modal closes
            if (currentConversation) {
              loadContextForConversation(currentConversation, true);
            }
          }}
          agentId={agentForContextConfig}
          agentName={conversations.find(c => c.id === agentForContextConfig)?.title || 'Agente'}
          userId={userId}
          onEditPrompt={() => {
            // Close context modal and open agent prompt modal
            setShowAgentContextModal(false);
            setShowAgentPromptModal(true);
            // Load current agent prompt
            loadPromptsForAgent(agentForContextConfig);
          }}
        />
      )}


      <AddSourceModal
        isOpen={showAddSourceModal}
        onClose={() => {
          setShowAddSourceModal(false);
          setPreSelectedSourceType(undefined); // Reset on close
        }}
        onAddSource={handleAddSource}
        preSelectedType={preSelectedSourceType}
      />

      {/* Workflow Config Modal */}
      <WorkflowConfigModal
        workflow={configWorkflow}
        isOpen={configWorkflow !== null}
        onClose={() => setConfigWorkflow(null)}
        onSave={handleSaveWorkflowConfig}
      />

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        onSave={handleSaveUserSettings}
        currentSettings={globalUserSettings}
        userName={userName}
        userEmail={userEmail}
      />

      {/* ✅ NEW: Domain Prompt Modal */}
      <DomainPromptModal
        isOpen={showDomainPromptModal}
        onClose={() => setShowDomainPromptModal(false)}
        organizationId="default-org"
        organizationName="Mi Organización"
        currentDomainPrompt={currentDomainPrompt}
        onSave={handleSaveDomainPrompt}
      />

      {/* ✅ NEW: Agent Prompt Modal */}
      <AgentPromptModal
        isOpen={showAgentPromptModal}
        onClose={() => setShowAgentPromptModal(false)}
        agentId={(() => {
          // 🔑 CRITICAL: Use parent agent ID if this is a chat
          const currentConv = conversations.find(c => c.id === currentConversation);
          return currentConv?.agentId || currentConversation || '';
        })()}
        agentName={(() => {
          // Get name from parent agent if this is a chat
          const currentConv = conversations.find(c => c.id === currentConversation);
          const agentId = currentConv?.agentId || currentConversation;
          return conversations.find(c => c.id === agentId)?.title || 'Agente';
        })()}
        currentAgentPrompt={currentAgentPrompt}
        domainPrompt={currentDomainPrompt}
        onSave={handleSaveAgentPrompt}
      />

      {/* ✅ NEW: Expert Feedback Panel */}
      {showExpertFeedback && feedbackMessageId && userId && userEmail && (
        <ExpertFeedbackPanel
          messageId={feedbackMessageId}
          conversationId={currentConversation || ''}
          userId={userId}
          userEmail={userEmail}
          userRole={userRole || 'user'}
          onClose={() => {
            setShowExpertFeedback(false);
            setFeedbackMessageId(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}

      {/* ✅ NEW: User Feedback Panel */}
      {showUserFeedback && feedbackMessageId && userId && userEmail && (
        <UserFeedbackPanel
          messageId={feedbackMessageId}
          conversationId={currentConversation || ''}
          userId={userId}
          userEmail={userEmail}
          userRole={userRole || 'user'}
          onClose={() => {
            setShowUserFeedback(false);
            setFeedbackMessageId(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}

      {/* Context Source Settings Modal - Simplified */}
      <ContextSourceSettingsModal
        source={settingsSource}
        isOpen={settingsSource !== null}
        onClose={() => {
          setSettingsSource(null);
          // ✅ PERFORMANCE: Lightweight refresh after settings modal (just RAG toggle changed)
          if (currentConversation) {
            loadContextForConversation(currentConversation, true); // skipRAGVerification = true
          }
        }}
        userId={userId}
      />

      {/* Context Management Dashboard - Superadmin Only */}
      <ContextManagementDashboard
        isOpen={showContextManagement}
        onClose={() => setShowContextManagement(false)}
        userId={userId}
        userEmail={userEmail}
        conversations={conversations}
        onSourcesUpdated={() => {
          // ✅ PERFORMANCE: Lightweight metadata-only refresh (no RAG verification)
          // Only reload the metadata to show updated assignments in left panel
          if (currentConversation) {
            console.log('⚡ Lightweight context refresh after modal close:', currentConversation);
            loadContextForConversation(currentConversation, true); // skipRAGVerification = true
          } else {
            console.warn('⚠️ No current conversation - skipping context reload');
          }
        }}
      />
      
      {/* Agent Management Dashboard - Superadmin Only */}
      {showAgentManagement && (
        <AgentManagementDashboard
          userId={userId}
          onClose={() => setShowAgentManagement(false)}
        />
      )}
      
      {/* Agent Configuration Modal */}
      <AgentConfigurationModal
        isOpen={showAgentConfiguration}
        onClose={() => setShowAgentConfiguration(false)}
        agentId={currentConversation || undefined}
        agentName={conversations.find(c => c.id === currentConversation)?.title}
        onConfigSaved={handleAgentConfigSaved}
      />
      
      {/* User Management Panel - SuperAdmin Only */}
      {showUserManagement && userEmail && (
        <UserManagementPanel
          currentUserEmail={userEmail}
          onClose={() => setShowUserManagement(false)}
          onImpersonate={handleImpersonate}
        />
      )}
      
      {/* Domain Management Modal - SuperAdmin Only */}
      {showDomainManagement && userEmail && (
        <DomainManagementModal
          isOpen={showDomainManagement}
          onClose={() => setShowDomainManagement(false)}
          currentUserEmail={userEmail}
        />
      )}

      {/* Provider Management Dashboard - SuperAdmin Only */}
      {showProviderManagement && (
        <ProviderManagementDashboard
          onClose={() => setShowProviderManagement(false)}
          currentUser={{ id: userId, email: userEmail, name: userName }}
        />
      )}

      {/* RAG Configuration Panel - SuperAdmin Only */}
      {showRAGConfig && (
        <RAGConfigPanel
          isOpen={showRAGConfig}
          onClose={() => setShowRAGConfig(false)}
          isAdmin={userEmail === 'alec@getaifactory.com'}
        />
      )}
      
      {/* Agent Evaluation Dashboard */}
      <AgentEvaluationDashboard
        isOpen={showAgentEvaluation}
        onClose={() => setShowAgentEvaluation(false)}
        userEmail={userEmail || ''}
        userRole="admin" // TODO: Get from user profile
        conversations={conversations}
        onNavigateToAgent={(agentId: string) => {
          setCurrentConversation(agentId);
          setShowAgentEvaluation(false);
          setShowAgentConfiguration(true);
        }}
      />

      {/* NEW: Comprehensive Evaluation System */}
      {showEvaluationSystem && (
        <EvaluationPanel
          currentUserId={userId}
          currentUserEmail={userEmail || ''}
          currentUserRole={currentUser?.role || 'user'}
          onClose={() => setShowEvaluationSystem(false)}
        />
      )}
      
      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        conversations={conversations}
      />

      {/* SalfaGPT Analytics Dashboard */}
      <SalfaAnalyticsDashboard
        isOpen={showSalfaAnalytics}
        onClose={() => setShowSalfaAnalytics(false)}
        userId={userId || ''}
        userEmail={userEmail || ''}
        userRole={currentUser?.role || 'user'}
      />

      {/* ✅ NEW: My Feedback View (All users can see their own feedback) */}
      {userId && userEmail && (
        <MyFeedbackView
          userId={userId}
          userEmail={userEmail}
          isOpen={showMyFeedback}
          onClose={() => {
            setShowMyFeedback(false);
            setHighlightTicketId(null);
          }}
          highlightTicketId={highlightTicketId}
        />
      )}
      
      {/* ✅ NEW: Roadmap Modal with Rudy AI - SuperAdmin Only */}
      {showRoadmap && userEmail === 'alec@getaifactory.com' && (
        <RoadmapModal
          isOpen={showRoadmap}
          onClose={() => setShowRoadmap(false)}
          companyId="aifactory"
          userEmail={userEmail}
        />
      )}

      {/* Agent Sharing Modal */}
      {showAgentSharingModal && agentToShare && currentUser && (
        <AgentSharingModal
          agent={agentToShare}
          currentUser={currentUser}
          onClose={() => {
            setShowAgentSharingModal(false);
            setAgentToShare(null);
          }}
          onShareUpdated={() => {
            // Reload conversations to reflect share changes
            loadConversations();
          }}
        />
      )}

      {/* Impersonation Banner */}
      {isImpersonating && impersonatedUser && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <div>
              <span className="font-bold">Impersonando: </span>
              <span className="font-medium">{impersonatedUser.name} ({impersonatedUser.email})</span>
              <span className="ml-3 text-sm opacity-90">
                Roles: {impersonatedUser.roles?.join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={stopImpersonation}
            className="px-4 py-1.5 bg-white text-orange-700 rounded-lg hover:bg-orange-50 text-sm font-medium transition-colors"
          >
            Detener Impersonación
          </button>
        </div>
      )}

      {/* Reference Panel - Opens when clicking on reference badges in messages */}
      {selectedReference && (
        <ReferencePanel
          reference={selectedReference}
          onClose={() => setSelectedReference(null)}
          onViewFullDocument={async (sourceId) => {
            console.log('📄 Attempting to load full document for reference:', sourceId);
            
            // ✅ FIX: Always fetch full source from API, don't rely on contextSources array
            // The contextSources array might only have metadata or be filtered
            const fullSource = await loadFullContextSource(sourceId);
            
            if (fullSource) {
              console.log('✅ Loaded full source, opening settings modal:', fullSource.name);
              setSettingsSource(fullSource);
              setSelectedReference(null); // Close reference panel when opening full document
            } else {
              console.error('❌ Could not load full source for:', sourceId);
              // Show user-friendly error
              alert('No se pudo cargar el documento completo. Por favor, intenta nuevamente.');
            }
          }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-red-600 p-6 rounded-t-xl">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">⚠️ Eliminar Agente</h2>
                  <p className="text-sm text-red-100">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Estás a punto de <strong>eliminar permanentemente</strong> el agente:
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="font-bold text-red-900 dark:text-red-300 text-lg text-center">
                  {deleteConfirmation.conversationTitle}
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>⚠️ Advertencia:</strong> Se eliminarán todos los mensajes, contexto y configuración asociados. Esta acción es irreversible.
                </p>
              </div>
              
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Para confirmar, escribe el nombre exacto del agente:
              </p>
              
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder={deleteConfirmation.conversationTitle}
                className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                autoFocus
              />
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Escribe exactamente: <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-xs">{deleteConfirmation.conversationTitle}</code>
              </p>
            </div>
            
            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmation(null);
                  setDeleteConfirmationInput('');
                }}
                className="flex-1 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              
              <button
                onClick={deleteConversationPermanently}
                disabled={deleteConfirmationInput !== deleteConfirmation.conversationTitle}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
              >
                <XIcon className="w-5 h-5" />
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stella Sidebar Chat - Right sidebar chatbot */}
      {currentUser && (
        <StellaSidebarChat
          isOpen={showStellaSidebar}
          onClose={() => setShowStellaSidebar(false)}
          userId={currentUser.id}
          userEmail={currentUser.email}
          userName={currentUser.name}
          currentPageContext={{
            pageUrl: window.location.href,
            agentId: selectedAgent || undefined,
            conversationId: currentConversation || undefined,
          }}
        />
      )}
    </div>
  );
}

