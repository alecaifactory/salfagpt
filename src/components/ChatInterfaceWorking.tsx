import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, FileText, Loader2, User, Settings, LogOut, Play, CheckCircle, XCircle, Sparkles, Pencil, Check, X as XIcon, Database, Users, UserCog, AlertCircle, Globe, Archive, ArchiveRestore, DollarSign, StopCircle } from 'lucide-react';
import ContextManager from './ContextManager';
import AddSourceModal from './AddSourceModal';
import WorkflowConfigModal from './WorkflowConfigModal';
import UserSettingsModal, { type UserSettings } from './UserSettingsModal';
import ContextSourceSettingsModal from './ContextSourceSettingsModal';
import ContextManagementDashboard from './ContextManagementDashboard';
import AgentManagementDashboard from './AgentManagementDashboard';
import UserManagementPanel from './UserManagementPanel';
import DomainManagementModal from './DomainManagementModal';
import ProviderManagementDashboard from './ProviderManagementDashboard';
import MessageRenderer from './MessageRenderer';
import type { Workflow, SourceType, WorkflowConfig, ContextSource } from '../types/context';
import { DEFAULT_WORKFLOWS } from '../types/context';
import type { User as UserType } from '../types/users';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  contextWindowUsed: number;
  contextWindowAvailable: number;
  contextWindowCapacity: number;
  aiResponse: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  status?: 'active' | 'archived';
}

interface ChatInterfaceWorkingProps {
  userId: string;
  userEmail?: string;
  userName?: string;
}

export default function ChatInterfaceWorking({ userId, userEmail, userName }: ChatInterfaceWorkingProps) {
  // Core state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextLogs, setContextLogs] = useState<ContextLog[]>([]);
  const [input, setInput] = useState('');
  
  // Per-agent processing state
  const [agentProcessing, setAgentProcessing] = useState<Record<string, {
    isProcessing: boolean;
    startTime?: number;
    needsFeedback?: boolean;
  }>>({});
  
  // Context state
  const [contextSources, setContextSources] = useState<ContextSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [preSelectedSourceType, setPreSelectedSourceType] = useState<SourceType | undefined>(undefined);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showContextManagement, setShowContextManagement] = useState(false);
  const [settingsSource, setSettingsSource] = useState<ContextSource | null>(null);
  
  // User Management state (SuperAdmin only)
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAgentManagement, setShowAgentManagement] = useState(false);
  const [showDomainManagement, setShowDomainManagement] = useState(false);
  const [showProviderManagement, setShowProviderManagement] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<UserType | null>(null);
  const [originalUserId, setOriginalUserId] = useState<string | null>(null);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  
  // Edit conversation state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Archive state
  const [showArchivedConversations, setShowArchivedConversations] = useState(false);
  const [showArchivedSection, setShowArchivedSection] = useState(false);
  
  // Timer state
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // User settings state
  const [globalUserSettings, setGlobalUserSettings] = useState<UserSettings>({
    preferredModel: 'gemini-2.5-flash',
    systemPrompt: 'Eres un asistente útil y profesional. Responde de manera clara y concisa.',
    language: 'es',
  });

  // Agent-specific config state (overrides global settings)
  const [currentAgentConfig, setCurrentAgentConfig] = useState<Partial<UserSettings> | null>(null);
  
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
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
      loadContextForConversation(currentConversation);
    }
  }, [currentConversation]);

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

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const allConvs = data.groups?.flatMap((g: any) => g.conversations) || [];
        setConversations(allConvs);
        
        // Auto-select first conversation or create one
        if (allConvs.length > 0) {
          setCurrentConversation(allConvs[0].id);
        } else {
          createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback: do nothing if conversations can't be loaded, let user create one
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // Transform messages: extract text from MessageContent object
        const transformedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string' 
            ? msg.content 
            : msg.content?.text || String(msg.content),
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadContextForConversation = async (conversationId: string) => {
    try {
      // Reload all sources for this user
      const sourcesResponse = await fetch(`/api/context-sources?userId=${userId}`);
      if (!sourcesResponse.ok) {
        console.warn('⚠️ No se pudieron cargar fuentes de contexto');
        return;
      }
      
      const sourcesData = await sourcesResponse.json();
      const allSources = sourcesData.sources || [];
      
      // Get active source IDs for this conversation
      const contextResponse = await fetch(`/api/conversations/${conversationId}/context-sources`);
      const contextData = contextResponse.ok ? await contextResponse.json() : { activeContextSourceIds: [] };
      const activeIds = contextData.activeContextSourceIds || [];
      
      // Filter sources assigned to this agent BEFORE setting state
      // This prevents showing all sources momentarily before filtering
      const filteredSources = allSources
        .filter((source: any) => {
          // Show if:
          // 1. Source has PUBLIC tag/label (visible to all agents)
          // 2. Assigned to this agent specifically
          // Note: Removed backward compat to prevent private docs from appearing in new agents
          const hasPublicTag = source.labels?.includes('PUBLIC') || source.labels?.includes('public');
          const isAssignedToThisAgent = source.assignedToAgents?.includes(conversationId);
          
          return hasPublicTag || isAssignedToThisAgent;
        })
        .map((source: any) => ({
          ...source,
          enabled: activeIds.includes(source.id),
          addedAt: new Date(source.addedAt),
          metadata: source.metadata ? {
            ...source.metadata,
            extractionDate: source.metadata.extractionDate ? new Date(source.metadata.extractionDate) : undefined,
            validatedAt: source.metadata.validatedAt ? new Date(source.metadata.validatedAt) : undefined,
          } : undefined
        }));
      
      // ONLY set state after filtering - prevents flash of wrong content
      setContextSources(filteredSources);
      
      // Log filtering details
      const publicSources = filteredSources.filter((s: any) => s.labels?.includes('PUBLIC') || s.labels?.includes('public'));
      const assignedSources = filteredSources.filter((s: any) => s.assignedToAgents?.includes(conversationId));
      
      console.log(`✅ Context sources for agent ${conversationId}:`, {
        total: filteredSources.length,
        public: publicSources.length,
        assigned: assignedSources.length,
        active: activeIds.length,
      });
    } catch (error) {
      console.error('Error loading context:', error);
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

  // Load current user's roles to check for admin access (NEW)
  useEffect(() => {
    if (userEmail) {
      fetch(`/api/users?requesterEmail=${encodeURIComponent(userEmail)}`)
        .then(res => res.json())
        .then(data => {
          const currentUser = data.users?.find((u: UserType) => u.email === userEmail);
          if (currentUser) {
            setCurrentUserRoles(currentUser.roles || [currentUser.role]);
            console.log('👤 Current user roles:', currentUser.roles);
          }
        })
        .catch(err => console.error('Error loading user roles:', err));
    }
  }, [userEmail]);

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

  // Load conversations from Firestore on mount
  useEffect(() => {
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
                  lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt),
                  status: conv.status || 'active' // Default to active if not set
                });
              });
            });
            
            setConversations(allConversations);
            console.log(`✅ ${allConversations.length} conversaciones cargadas desde Firestore`);
            console.log(`📋 Conversaciones activas: ${allConversations.filter(c => c.status !== 'archived').length}`);
            console.log(`🔍 Primera conversación:`, allConversations[0]);
            console.log(`🔍 Estado conversations después de setear:`, allConversations.length);
          } else {
            console.log('ℹ️ No hay conversaciones guardadas');
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
    
    loadConversations();
  }, [userId]);

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
        } else {
          console.warn('⚠️ No se pudo cargar configuración del usuario, usando defaults');
        }
      } catch (error) {
        console.error('❌ Error al cargar configuración del usuario:', error);
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
    
    // Load messages for this conversation
    loadMessages(currentConversation);
    
    // Load context configuration for this conversation
    loadContextForConversation(currentConversation);
    
    // NEW: Load agent config for this conversation
    loadAgentConfig(currentConversation);
    
    // Reset input
    setInput('');
    
  }, [currentConversation]);

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

  const createNewConversation = async () => {
    try {
      // Call API to create conversation in Firestore
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: 'Nuevo Agente',
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newConv: Conversation = {
          id: data.conversation.id,
          title: data.conversation.title,
          lastMessageAt: new Date(data.conversation.lastMessageAt || data.conversation.createdAt)
        };
        
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversation(newConv.id);
        setMessages([]);
        
        console.log('✅ Conversación creada en Firestore:', newConv.id);
        
        // Save initial agent config for the new conversation
        await fetch('/api/agent-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: newConv.id,
            userId,
            model: globalUserSettings.preferredModel,
            systemPrompt: globalUserSettings.systemPrompt,
          }),
        });
        console.log('✅ Configuración inicial del agente guardada para:', newConv.id);

        // Auto-assign PUBLIC tagged context sources to new agent
        const publicSources = contextSources.filter(s => s.tags?.includes('PUBLIC'));
        if (publicSources.length > 0) {
          const publicSourceIds = publicSources.map(s => s.id);
          
          // Assign PUBLIC sources to new agent
          for (const sourceId of publicSourceIds) {
            try {
              await fetch(`/api/context-sources/${sourceId}/assign-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: newConv.id }),
              });
            } catch (error) {
              console.warn('⚠️ Failed to auto-assign PUBLIC source:', sourceId, error);
            }
          }
          
          // Update local context sources to include new agent
          setContextSources(prev => prev.map(s => {
            if (s.tags?.includes('PUBLIC')) {
              return {
                ...s,
                assignedToAgents: [...(s.assignedToAgents || []), newConv.id],
                enabled: true, // Enable by default
              };
            }
            return s;
          }));
          
          // Save active PUBLIC sources to conversation context
          await fetch(`/api/conversations/${newConv.id}/context-sources`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeContextSourceIds: publicSourceIds }),
          });
          
          console.log(`✅ ${publicSources.length} fuentes PUBLIC asignadas automáticamente al nuevo agente`);
        } else {
          console.log('ℹ️ No hay fuentes PUBLIC - nuevo agente sin contexto predeterminado');
        }

        // Also set the current agent config locally
        setCurrentAgentConfig({
          preferredModel: globalUserSettings.preferredModel,
          systemPrompt: globalUserSettings.systemPrompt,
        });

        if (data.warning) {
          console.warn('⚠️', data.warning);
        }
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      
      // Fallback: create temporary conversation in memory
      const tempId = `temp-${Date.now()}`;
      const newConv: Conversation = {
        id: tempId,
        title: 'Nuevo Agente',
        lastMessageAt: new Date()
      };
      
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(tempId);
      setMessages([]);
      setContextLogs([]); // Clear context logs for temporary conversation
      
      console.warn('⚠️ Conversación temporal creada (no persistente)');
      console.warn('💡 Para persistencia, configura Firestore credentials');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation) return;

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
    setAgentProcessing(prev => ({
      ...prev,
      [agentId]: {
        isProcessing: true,
        startTime: Date.now(),
        needsFeedback: false,
      }
    }));

    try {
      // Get active context sources
      const activeContextSources = contextSources
        .filter(source => source.enabled)
        .map(source => ({
          id: source.id,
          name: source.name,
          type: 'pdf',
          content: source.extractedData
        }));

      const response = await fetch(`/api/conversations/${currentConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: input,
          model: currentAgentConfig?.preferredModel || globalUserSettings.preferredModel,
          systemPrompt: currentAgentConfig?.systemPrompt || globalUserSettings.systemPrompt,
          contextSources: activeContextSources
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content.text || data.message.content,
          timestamp: new Date(data.message.timestamp)
        };
        setMessages(prev => [...prev, aiMessage]);

        // Check if response needs feedback
        const needsFeedback = detectFeedbackNeeded(aiMessage.content);

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

        // Create context log if tokenStats are available
        if (data.tokenStats) {
          const log: ContextLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            userMessage: messageToSend,
            model: data.tokenStats.model,
            systemPrompt: data.tokenStats.systemPrompt,
            contextSources: activeContextSources.map(s => ({
              name: s.name,
              tokens: Math.ceil((s.content?.length || 0) / 4),
            })),
            totalInputTokens: data.tokenStats.totalInputTokens,
            totalOutputTokens: data.tokenStats.totalOutputTokens,
            contextWindowUsed: data.tokenStats.contextWindowUsed,
            contextWindowAvailable: data.tokenStats.contextWindowAvailable,
            contextWindowCapacity: data.tokenStats.contextWindowCapacity,
            aiResponse: aiMessage.content,
          };
          setContextLogs(prev => [...prev, log]);
          console.log('📊 Context log created:', log);
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
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
    // Note: agentProcessing state is updated in try/catch blocks above
    // No need for finally block with setLoading
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
    // Get current enabled state
    const source = contextSources.find(s => s.id === sourceId);
    if (!source) return;
    
    const newEnabledState = !source.enabled;
    
    // Update local state
    setContextSources(prev => 
      prev.map(s => 
        s.id === sourceId 
          ? { ...s, enabled: newEnabledState }
          : s
      )
    );

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

    // Save active sources for current conversation
    if (currentConversation) {
      const newActiveIds = contextSources
        .map(s => s.id === sourceId ? { ...s, enabled: newEnabledState } : s)
        .filter(s => s.enabled)
        .map(s => s.id);
      saveContextForConversation(currentConversation, newActiveIds);
    }
  };

  const handleAddSource = async (
    type: SourceType,
    file?: File,
    url?: string,
    config?: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro', apiEndpoint?: string, tags?: string[] }
  ) => {
    const startTime = Date.now(); // Track start time
    
    const newSource: ContextSource = {
      id: `source-${Date.now()}`,
      name: file?.name || url || config?.apiEndpoint || 'Nueva Fuente',
      type,
      enabled: true,
      status: 'processing',
      extractedData: '',
      addedAt: new Date(),
      tags: config?.tags, // Include tags from config
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
        formData.append('model', config?.model || 'gemini-2.5-pro'); // Default to Pro for best quality

        console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) with model: ${config?.model || 'gemini-2.5-pro'}`);

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
        const assignedTo = config?.tags?.includes('PUBLIC') 
          ? conversations.map(c => c.id) // Assign to ALL agents if PUBLIC
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

  const saveConversationTitle = async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      cancelEditingConversation();
      return;
    }

    try {
      // Update in Firestore
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation title');
      }

      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: newTitle.trim() } : c
      ));

      console.log('✅ Título del agente actualizado en Firestore:', conversationId);
      cancelEditingConversation();
    } catch (error) {
      console.error('❌ Error al actualizar título del agente:', error);
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

    // Calculate total characters from:
    // 1. System prompt
    const systemChars = globalUserSettings.systemPrompt.length;
    
    // 2. Messages (rough estimate: 4 chars = 1 token)
    const messageChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    
    // 3. Active context sources
    const contextChars = contextSources
      .filter(s => s.enabled)
      .reduce((sum, s) => sum + (s.extractedData?.length || 0), 0);

    const totalChars = systemChars + messageChars + contextChars;
    const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimate
    const usagePercent = ((estimatedTokens / modelWindow) * 100).toFixed(1);

    return {
      totalChars,
      estimatedTokens,
      usagePercent: parseFloat(usagePercent),
      modelWindow,
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
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Conversations */}
      <div 
        className="bg-white border-r border-slate-200 flex flex-col relative"
        style={{ width: `${leftPanelWidth}px` }}
      >
        {/* Header with Salfacorp Logo */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          {/* Salfacorp Logo and Brand */}
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">SALFAGPT</h1>
            <img 
              src="/images/Logo Salfacorp.png" 
              alt="Salfacorp" 
              className="w-10 h-10 object-contain"
            />
          </div>
          
          {/* New Agent Button */}
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Agente
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-sm">
              <p>No hay conversaciones</p>
              <p className="text-xs mt-1">Haz click en "Nuevo Agente" para empezar</p>
            </div>
          )}
          {conversations.length > 0 && conversations.filter(conv => conv.status !== 'archived').length === 0 && (
            <div className="p-4 text-center text-slate-500 text-sm">
              <p>Todas las conversaciones están archivadas</p>
              <p className="text-xs mt-1">Haz click en "Nuevo Agente" para crear una nueva</p>
            </div>
          )}
          {conversations
            .filter(conv => conv.status !== 'archived')
            .map(conv => (
            <div
              key={conv.id}
              className={`w-full p-3 rounded-lg mb-1 transition-colors relative ${
                currentConversation === conv.id
                  ? 'bg-blue-50 border border-blue-200'
                  : conv.status === 'archived'
                  ? 'bg-amber-50/50 hover:bg-amber-50 border border-amber-200/50'
                  : 'hover:bg-slate-50'
              }`}
            >
              {editingConversationId === conv.id ? (
                // Edit mode
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveConversationTitle(conv.id, editingTitle);
                      } else if (e.key === 'Escape') {
                        cancelEditingConversation();
                      }
                    }}
                    onBlur={() => saveConversationTitle(conv.id, editingTitle)}
                    className="flex-1 text-sm font-medium text-slate-700 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => saveConversationTitle(conv.id, editingTitle)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Guardar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEditingConversation}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Cancelar"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex items-center gap-2 group">
                    <button
                      onClick={() => setCurrentConversation(conv.id)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${conv.status === 'archived' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium truncate ${conv.status === 'archived' ? 'text-amber-700 italic' : 'text-slate-700'}`}>
                        {conv.title}
                      </span>
                      {agentProcessing[conv.id]?.needsFeedback && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-semibold rounded-full flex-shrink-0">
                          ⚠️ Feedback
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingConversation(conv);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Editar nombre"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (conv.status === 'archived') {
                          unarchiveConversation(conv.id);
                        } else {
                          archiveConversation(conv.id);
                        }
                      }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                        conv.status === 'archived'
                          ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={conv.status === 'archived' ? 'Restaurar' : 'Archivar'}
                    >
                      {conv.status === 'archived' ? (
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Processing indicator with timer */}
                  {agentProcessing[conv.id]?.isProcessing && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Procesando...</span>
                      {agentProcessing[conv.id]?.startTime && (
                        <span className="font-mono font-semibold">
                          {formatElapsedTime(agentProcessing[conv.id].startTime!)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Archived Section - Collapsible */}
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
            
            {/* Expanded archived list - shows last 3 */}
            {showArchivedSection && (
              <div className="px-2 pb-2 space-y-1">
                {conversations
                  .filter(c => c.status === 'archived')
                  .slice(0, 3)
                  .map(conv => (
                    <div
                      key={conv.id}
                      className={`w-full p-3 rounded-lg transition-colors bg-amber-50/50 hover:bg-amber-50 border border-amber-200/50 ${
                        currentConversation === conv.id ? 'ring-2 ring-amber-400' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 group">
                        <button
                          onClick={() => setCurrentConversation(conv.id)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0"
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0 text-amber-400" />
                          <span className="text-sm font-medium truncate text-amber-700 italic">
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
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                
                {/* Show all archived link if more than 3 */}
                {conversations.filter(c => c.status === 'archived').length > 3 && (
                  <button
                    onClick={() => setShowArchivedConversations(true)}
                    className="w-full px-3 py-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                  >
                    Ver todos los archivados ({conversations.filter(c => c.status === 'archived').length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Context Sources */}
        <ContextManager
          sources={contextSources}
          validations={new Map()}
          onAddSource={() => setShowAddSourceModal(true)}
          onToggleSource={toggleContext}
          onRemoveSource={async (sourceId) => {
            if (!currentConversation) {
              console.warn('⚠️ No current conversation for removing source');
              return;
            }

            try {
              console.log(`🗑️ Removing source ${sourceId} from agent ${currentConversation}`);
              
              // Call API to remove agent from source's assignedToAgents
              const response = await fetch(`/api/context-sources/${sourceId}/remove-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: currentConversation }),
              });

              if (!response.ok) {
                throw new Error('Failed to remove source from agent');
              }

              const result = await response.json();
              console.log(`✅ ${result.message}`);

              // Update local state immediately
              setContextSources(prev => prev.filter(s => s.id !== sourceId));
              
              // Also update active context sources for this conversation
              const activeSourceIds = contextSources
                .filter(s => s.enabled && s.id !== sourceId)
                .map(s => s.id);
              
              // Save updated active sources to conversation_context
              try {
                await fetch(`/api/conversations/${currentConversation}/context-sources`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ activeContextSourceIds: activeSourceIds }),
                });
              } catch (contextError) {
                console.warn('⚠️ Failed to update conversation context:', contextError);
              }
              
            } catch (error) {
              console.error('❌ Error removing source:', error);
              alert('Error al eliminar fuente. Por favor, intenta nuevamente.');
            }
          }}
          onSourceClick={setSelectedSourceId}
          onSourceSettings={handleSourceSettings}
        />

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
              <div className="absolute bottom-full left-0 mb-3 bg-white rounded-xl shadow-2xl border-2 border-slate-300 py-2 min-w-[380px] z-50">
                {/* Context Management - Superadmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowContextManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Database className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Gestión de Contexto</span>
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
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setShowDomainManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Globe className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Gestión de Dominios</span>
                    </button>
                    <div className="h-px bg-slate-200 my-2" />
                  </>
                )}
                
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => {
                    setShowUserSettings(true);
                    setShowUserMenu(false);
                  }}
                >
                  <Settings className="w-5 h-5 text-slate-600" />
                  <span className="font-medium">Configuración</span>
                </button>
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
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
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
                  <div className="inline-block max-w-2xl p-4 rounded-lg bg-blue-600 text-white">
                    {msg.content}
                  </div>
                ) : (
                  <div className="inline-block max-w-3xl p-5 rounded-lg bg-white text-slate-800 border border-slate-200 shadow-sm">
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
                      onSourceClick={(sourceId) => {
                        const source = contextSources.find(s => s.id === sourceId);
                        if (source) {
                          setSettingsSource(source);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
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
                <span className="text-blue-600">{contextSources.filter(s => s.enabled).length} fuentes</span>
              </button>
            </div>

            {/* Context Panel */}
            {showContextPanel && (
              <div className="mb-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Header with stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">Desglose del Contexto</h4>
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
                  
                  <div className="grid grid-cols-3 gap-3 text-xs">
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
                </div>

                {/* Content breakdown */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {/* System Prompt */}
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold text-slate-700">System Prompt</h5>
                      <span className="text-xs text-slate-500">
                        ~{Math.ceil(globalUserSettings.systemPrompt.length / 4)} tokens
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      {globalUserSettings.systemPrompt.substring(0, 150)}
                      {globalUserSettings.systemPrompt.length > 150 && '...'}
                    </p>
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

                  {/* Context Sources */}
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold text-slate-700">Fuentes de Contexto</h5>
                      <span className="text-xs text-slate-500">
                        {contextSources.filter(s => s.enabled).length} activas • ~{Math.ceil(
                          contextSources.filter(s => s.enabled).reduce((sum, s) => sum + (s.extractedData?.length || 0), 0) / 4
                        )} tokens
                      </span>
                    </div>
                    {contextSources.filter(s => s.enabled).length === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded text-center">
                        No hay fuentes activas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {contextSources.filter(s => s.enabled).map(source => (
                          <button
                            key={source.id}
                            onClick={() => {
                              setSettingsSource(source);
                            }}
                            className="w-full bg-green-50 border border-green-200 rounded p-2 hover:bg-green-100 transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <FileText className="w-3.5 h-3.5 text-green-600" />
                                <p className="text-xs font-semibold text-slate-800">{source.name}</p>
                                {(source.labels?.includes('PUBLIC') || source.labels?.includes('public')) && (
                                  <span className="px-1.5 py-0.5 bg-slate-800 text-white text-[9px] rounded-full font-semibold">
                                    🌐 PUBLIC
                                  </span>
                                )}
                                {source.metadata?.validated && (
                                  <span className="px-1.5 py-0.5 bg-green-600 text-white text-[9px] rounded-full font-semibold">
                                    ✓ Validado
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {source.metadata?.pageCount && `${source.metadata.pageCount} págs`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {source.extractedData?.substring(0, 100)}
                              {(source.extractedData?.length || 0) > 100 && '...'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

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
                                          {source.name} ({source.tokens} tokens)
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-slate-500 italic">Ninguna</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                              <div className="mt-2 text-[10px]">
                                <p className="text-slate-600"><strong>Respuesta:</strong></p>
                                <p className="text-slate-700 bg-slate-50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                                  {log.aiResponse}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <p className="text-xs text-slate-500 text-center mt-2">
              Flow puede cometer errores. Verifica la información importante.
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

      {/* Show Panel Button (when hidden) */}
      {!showRightPanel && (
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
                <h2 className="text-xl font-bold text-slate-800">Agentes Archivados</h2>
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
            
            {/* Archived list */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {conversations
                  .filter(c => c.status === 'archived')
                  .map(conv => (
                    <div
                      key={conv.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        currentConversation === conv.id
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setCurrentConversation(conv.id);
                            setShowArchivedConversations(false);
                          }}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <MessageSquare className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="font-semibold text-amber-900">{conv.title}</p>
                            <p className="text-xs text-amber-600">
                              Última actividad: {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            unarchiveConversation(conv.id);
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                          Restaurar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
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

      {/* Context Source Settings Modal */}
      <ContextSourceSettingsModal
        source={settingsSource}
        isOpen={settingsSource !== null}
        onClose={() => setSettingsSource(null)}
        onReExtract={handleReExtract}
        userId={userId}
        onTagsChanged={() => {
          // Reload context sources to reflect PUBLIC tag changes
          if (currentConversation) {
            loadContextForConversation(currentConversation);
          }
        }}
      />

      {/* Context Management Dashboard - Superadmin Only */}
      <ContextManagementDashboard
        isOpen={showContextManagement}
        onClose={() => setShowContextManagement(false)}
        userId={userId}
        userEmail={userEmail}
        conversations={conversations}
        onSourcesUpdated={() => {
          // Reload context sources when changes are made
          const loadContextSources = async () => {
            try {
              const response = await fetch(`/api/context-sources?userId=${userId}`);
              if (response.ok) {
                const data = await response.json();
                setContextSources(data.sources.map((s: any) => ({
                  ...s,
                  addedAt: new Date(s.addedAt),
                  metadata: {
                    ...s.metadata,
                    extractionDate: s.metadata?.extractionDate ? new Date(s.metadata.extractionDate) : undefined,
                    validatedAt: s.metadata?.validatedAt ? new Date(s.metadata.validatedAt) : undefined,
                  },
                })));
              }
            } catch (error) {
              console.error('Error reloading context sources:', error);
            }
          };
          loadContextSources();
        }}
      />
      
      {/* Agent Management Dashboard - Superadmin Only */}
      {showAgentManagement && (
        <AgentManagementDashboard
          userId={userId}
          onClose={() => setShowAgentManagement(false)}
        />
      )}
      
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
    </div>
  );
}

