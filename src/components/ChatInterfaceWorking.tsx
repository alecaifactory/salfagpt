import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, FileText, Loader2, User, Settings, LogOut, Play, CheckCircle, XCircle, Sparkles, Pencil, Check, X as XIcon, Database } from 'lucide-react';
import ContextManager from './ContextManager';
import AddSourceModal from './AddSourceModal';
import WorkflowConfigModal from './WorkflowConfigModal';
import UserSettingsModal, { type UserSettings } from './UserSettingsModal';
import ContextSourceSettingsModal from './ContextSourceSettingsModal';
import ContextManagementDashboard from './ContextManagementDashboard';
import MessageRenderer from './MessageRenderer';
import type { Workflow, SourceType, WorkflowConfig, ContextSource } from '../types/context';
import { DEFAULT_WORKFLOWS } from '../types/context';

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
  const [loading, setLoading] = useState(false);
  
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
  
  // Edit conversation state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
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
  const [showRightPanel, setShowRightPanel] = useState(true);

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
      
      // Filter sources assigned to this agent and set enabled state
      const filteredSources = allSources
        .filter((source: any) => {
          // Show if assigned to this agent, or no assignment (backward compat)
          return !source.assignedToAgents || 
                 source.assignedToAgents.length === 0 ||
                 source.assignedToAgents.includes(conversationId);
        })
        .map((source: any) => ({
          ...source,
          enabled: activeIds.includes(source.id),
          addedAt: new Date(source.addedAt)
        }));
      
      setContextSources(filteredSources);
      console.log(`🎯 ${activeIds.length} fuentes activas de ${filteredSources.length} asignadas para agente ${conversationId}`);
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
                  lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt)
                });
              });
            });
            
            setConversations(allConversations);
            console.log(`✅ ${allConversations.length} conversaciones cargadas desde Firestore`);
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
  useEffect(() => {
    const loadContextSources = async () => {
      try {
        console.log('📚 Cargando fuentes de contexto desde Firestore...');
        const response = await fetch(`/api/context-sources?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.sources && data.sources.length > 0) {
            // Store all sources globally (filtering happens per-agent)
            setContextSources(data.sources.map((s: any) => ({
              ...s,
              enabled: false, // Will be set by loadContextForConversation
              addedAt: new Date(s.addedAt)
            })));
            console.log(`✅ ${data.sources.length} fuentes de contexto cargadas desde Firestore`);
          } else {
            console.log('ℹ️ No hay fuentes de contexto guardadas');
          }
        } else {
          console.warn('⚠️ No se pudieron cargar fuentes de contexto');
        }
      } catch (error) {
        console.error('❌ Error al cargar fuentes de contexto:', error);
      }
    };
    
    loadContextSources();
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
    setInput('');
    setLoading(true);

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

        // Create context log if tokenStats are available
        if (data.tokenStats) {
          const log: ContextLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            userMessage: input,
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
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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
    config?: { model?: 'gemini-2.5-flash' | 'gemini-2.5-pro', apiEndpoint?: string }
  ) => {
    const newSource: ContextSource = {
      id: `source-${Date.now()}`,
      name: file?.name || url || config?.apiEndpoint || 'Nueva Fuente',
      type,
      enabled: true,
      status: 'processing',
      extractedData: '',
      addedAt: new Date(),
      progress: {
        stage: 'uploading',
        percentage: 10,
        message: 'Subiendo archivo...'
      }
    };

    setContextSources(prev => [...prev, newSource]);

    try {
      // Update progress: processing
      setContextSources(prev => prev.map(s => 
        s.id === newSource.id
          ? { ...s, progress: { stage: 'processing', percentage: 50, message: 'Extrayendo contenido...' } }
          : s
      ));

      // Call extraction API
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
        formData.append('type', type);
        formData.append('model', config?.model || 'gemini-2.5-flash');

        const response = await fetch('/api/extract-document', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to extract document');
        }

        const data = await response.json();

        // Save to Firestore - Assign to current agent only
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
            assignedToAgents: currentConversation ? [currentConversation] : [], // Assign to current agent
            metadata: {
              originalFileName: file.name,
              originalFileSize: file.size,
              pageCount: data.metadata?.pageCount,
              model: config?.model || 'gemini-2.5-flash',
              charactersExtracted: data.metadata?.characters,
              extractionDate: new Date(),
            }
          })
        });

        if (!savedSource.ok) {
          throw new Error('Failed to save context source to Firestore');
        }

        const savedData = await savedSource.json();
        const sourceId = savedData.source.id;

        // Update local state with Firestore ID and enabled=true
        setContextSources(prev => prev.map(s => 
          s.id === newSource.id
            ? {
                ...savedData.source,
                addedAt: new Date(savedData.source.addedAt),
                enabled: true, // Activate toggle by default
                progress: {
                  stage: 'complete',
                  percentage: 100,
                  message: 'Completado'
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
      console.error('Error adding source:', error);
      setContextSources(prev => prev.map(s => 
        s.id === newSource.id
          ? {
              ...s,
              status: 'error',
              error: {
                message: 'Error al procesar el documento',
                details: error instanceof Error ? error.message : 'Error desconocido',
                timestamp: new Date()
              }
            }
          : s
      ));
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
      formData.append('model', newConfig.model || 'gemini-2.5-flash');

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
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Agente
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`w-full p-3 rounded-lg mb-1 transition-colors ${
                currentConversation === conv.id
                  ? 'bg-blue-50 border border-blue-200'
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
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={() => setCurrentConversation(conv.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{conv.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingConversation(conv);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Editar nombre"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Context Sources */}
        <ContextManager
          sources={contextSources}
          validations={new Map()}
          onAddSource={() => setShowAddSourceModal(true)}
          onToggleSource={toggleContext}
          onRemoveSource={(id) => {
            setContextSources(prev => prev.filter(s => s.id !== id));
          }}
          onSourceClick={setSelectedSourceId}
          onSourceSettings={handleSourceSettings}
        />

        {/* User Menu */}
        <div className="border-t border-slate-200 p-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {userName || userEmail || userId}
                  </p>
                  {userName && userEmail && (
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  )}
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                {/* Context Management - Superadmin Only */}
                {userEmail === 'alec@getaifactory.com' && (
                  <>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowContextManagement(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <Database className="w-4 h-4" />
                      Context Management
                    </button>
                    <div className="border-t border-slate-200 my-1" />
                  </>
                )}
                
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setShowUserSettings(true);
                    setShowUserMenu(false);
                  }}
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    document.cookie = 'flow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                    window.location.href = '/auth/login';
                  }}
                >
                  <LogOut className="w-4 h-4" />
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
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-green-600" />
                                <p className="text-xs font-semibold text-slate-800">{source.name}</p>
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
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
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
    </div>
  );
}

