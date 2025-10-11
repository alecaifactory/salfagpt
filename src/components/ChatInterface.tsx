import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Folder, 
  FolderPlus,
  X,
  Clock,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  Code,
  Info,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Building2,
  Sparkles,
  Shield
} from 'lucide-react';
import ContextManager from './ContextManager';
import WorkflowsPanel from './WorkflowsPanel';
import AddSourceModal from './AddSourceModal';
import WorkflowConfigModal from './WorkflowConfigModal';
import SourceDetailPanel from './SourceDetailPanel';
import ShareSourceModal from './ShareSourceModal';
import ContextManagementDashboard from './ContextManagementDashboard';
import type { ContextSource, Workflow, WorkflowConfig, SourceType } from '../types/context';
import { DEFAULT_WORKFLOWS } from '../types/context';
import type { SourceValidation, JobRole, EmailTemplate } from '../types/sharing';
import * as extractors from '../lib/workflowExtractors';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  timestamp: Date;
}

interface MessageContent {
  type: 'text' | 'image' | 'video' | 'code' | 'mixed';
  text?: string;
  code?: {
    language: string;
    content: string;
  };
  parts?: Array<{
    type: string;
    content: string | object;
  }>;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  messageCount: number;
  folderId?: string;
}

interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

interface ContextSection {
  name: string;
  tokenCount: number;
  content: string;
  collapsed: boolean;
}

export default function ChatInterface({ userId }: { userId: string }) {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextWindowUsage, setContextWindowUsage] = useState(0);
  const [userConfig, setUserConfig] = useState<{
    model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
    systemPrompt: string;
  }>({
    model: 'gemini-2.5-flash',
    systemPrompt: 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
  });
  const [contextSections, setContextSections] = useState<ContextSection[]>([
    {
      name: 'Instrucciones del Sistema',
      tokenCount: 500,
      content: 'Eres un asistente de IA útil impulsado por Gemini 2.5-pro.',
      collapsed: true,
    },
    {
      name: 'Historial de Conversación',
      tokenCount: 1500,
      content: 'Mensajes de conversación actuales',
      collapsed: false,
    },
    {
      name: 'Contexto del Usuario',
      tokenCount: 0,
      content: 'Sin contexto adicional',
      collapsed: true,
    },
  ]);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [useMockData, setUseMockData] = useState(false); // Real API responses enabled
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'contextManagement'>('chat');
  const [userInfo, setUserInfo] = useState({
    name: 'Alec Dickinson',
    email: 'alec@getaifactory.com',
    company: 'AI Factory LLC'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Context and Workflows state
  const [contextSources, setContextSources] = useState<ContextSource[]>([
    {
      id: `source-demo-${Date.now()}`,
      name: 'Documento de Prueba.pdf',
      type: 'pdf-text',
      addedAt: new Date(),
      metadata: {
        fileSize: 125000,
      },
      extractedData: `Contenido extraído del PDF:

Sección 1: Introducción
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Sección 2: Desarrollo
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Sección 3: Conclusión
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Este es un documento de ejemplo para demostrar la funcionalidad de fuentes de contexto.`,
      enabled: true,
      status: 'active'
    }
  ]);
  const [workflows, setWorkflows] = useState<Workflow[]>(
    DEFAULT_WORKFLOWS.map((w, i) => ({
      ...w,
      id: `workflow-${i}`,
      status: 'available' as const,
    }))
  );
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showWorkflowConfigModal, setShowWorkflowConfigModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // Source validation and sharing state
  const [sourceValidations, setSourceValidations] = useState<Map<string, SourceValidation>>(new Map());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sourceToShare, setSourceToShare] = useState<ContextSource | null>(null);

  // Load conversations on mount
  useEffect(() => {
    if (useMockData) {
      // Mock data for development
      setConversations([
        {
          label: 'Hoy',
          conversations: [
            {
              id: 'conv-1',
              title: 'Comenzando con IA',
              lastMessageAt: new Date(),
              messageCount: 5,
            },
          ],
        },
        {
          label: 'Ayer',
          conversations: [
            {
              id: 'conv-2',
              title: 'Ayuda con Programación Python',
              lastMessageAt: new Date(Date.now() - 86400000),
              messageCount: 12,
            },
          ],
        },
      ]);
    } else {
      loadConversations();
    }
  }, [userId, useMockData]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      if (useMockData) {
        setMessages([]);
      } else {
        loadMessages(currentConversation);
        loadContextInfo(currentConversation);
      }
    }
  }, [currentConversation, useMockData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Calculate local context for temporary conversations when messages or config change
  useEffect(() => {
    if (currentConversation && currentConversation.startsWith('temp-')) {
      calculateLocalContext();
    }
  }, [messages, userConfig]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      if (!response.ok) {
        console.warn('⚠️ Conversations API error, using empty state');
        setConversations([]);
        return;
      }
      const data = await response.json();
      setConversations(data.groups || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]); // Set empty array to prevent undefined errors
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const calculateLocalContext = () => {
    // Calculate context window usage locally for temporary conversations
    const MODEL_CONTEXT_WINDOW = 1000000; // Gemini 2.5 has 1M token context window
    
    // System prompt tokens
    const systemPrompt = userConfig.systemPrompt;
    const systemTokens = Math.ceil(systemPrompt.length / 4);
    
    // Message tokens (rough estimate: 4 chars = 1 token)
    const messageTokens = messages.reduce((sum, msg) => {
      const text = msg.content.text || JSON.stringify(msg.content);
      return sum + Math.ceil(text.length / 4);
    }, 0);
    
    // Build conversation history content
    const conversationHistoryContent = messages
      .map((msg, index) => {
        const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
        const text = msg.content.text || JSON.stringify(msg.content);
        const timestamp = msg.timestamp instanceof Date 
          ? msg.timestamp.toLocaleString() 
          : new Date(msg.timestamp).toLocaleString();
        return `[${index + 1}] ${role} (${timestamp}):\n${text}`;
      })
      .join('\n\n---\n\n');
    
    // Build context sections
    const sections = [
      {
        name: 'Instrucciones del Sistema',
        tokenCount: systemTokens,
        content: `Modelo: ${userConfig.model}\n\nPrompt del Sistema:\n${systemPrompt}`,
        collapsed: true,
      },
      {
        name: 'Historial de Conversación',
        tokenCount: messageTokens,
        content: conversationHistoryContent || 'Aún no hay mensajes',
        collapsed: false,
      },
      {
        name: 'Contexto del Usuario',
        tokenCount: 0, // Local calculation doesn't have user context items
        content: 'Sin elementos de contexto',
        collapsed: true,
      },
    ];
    
    const totalTokens = systemTokens + messageTokens;
    const usage = (totalTokens / MODEL_CONTEXT_WINDOW) * 100;
    
    setContextWindowUsage(usage);
    setContextSections(sections);
  };

  const loadContextInfo = async (conversationId: string) => {
    // For temporary conversations, calculate context locally
    if (conversationId.startsWith('temp-')) {
      calculateLocalContext();
      return;
    }
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/context?userId=${userId}`);
      const data = await response.json();
      setContextWindowUsage(data.usage || 0);
      setContextSections(data.sections || []);
    } catch (error) {
      console.error('Error loading context info:', error);
    }
  };

  const createNewConversation = async () => {
    if (useMockData) {
      const newConvId = `conv-${Date.now()}`;
      setCurrentConversation(newConvId);
      setMessages([]);
      return;
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title: 'Nuevo Agente' }),
      });
      const data = await response.json();
      setCurrentConversation(data.conversation.id);
      loadConversations();
    } catch (error) {
      console.error('Error al crear conversación:', error);
      setUseMockData(true);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: { type: 'text', text: inputMessage },
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    if (useMockData) {
      // Mock AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: {
            type: 'text',
            text: `Soy una respuesta simulada de IA para: "${currentInput}"\n\nEsta es la interfaz completa de Chat con:\n✅ Barra lateral izquierda con conversaciones\n✅ Seguimiento de ventana de contexto (${contextWindowUsage.toFixed(1)}%)\n✅ Soporte multi-modal listo\n✅ Interfaz profesional\n\nPara habilitar respuestas reales de IA, configura tu clave API de Google AI en las variables de entorno.`,
          },
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setContextWindowUsage(prev => Math.min(prev + 0.5, 100));
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${currentConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: currentInput,
          model: userConfig.model,              // ✅ Pass selected model
          systemPrompt: userConfig.systemPrompt // ✅ Pass selected system prompt
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: data.message.id,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setContextWindowUsage(data.contextUsage);
      setContextSections(data.contextSections);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/auth/logout', { method: 'POST' });
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: still redirect
      window.location.href = '/';
    }
  };

  const handleConfiguration = () => {
    // TODO: Implement configuration page navigation
    console.log('Abriendo configuración...');
  };

  const handleHelp = () => {
    // TODO: Implement help page navigation
    console.log('Abriendo ayuda...');
  };

  const handleContextManagement = () => {
    setCurrentView(currentView === 'chat' ? 'contextManagement' : 'chat');
    setShowUserMenu(false);
  };

  // Context and Workflows handlers
  const handleAddSource = async (type: SourceType, file?: File, url?: string, apiConfig?: any) => {
    const newSource: ContextSource = {
      id: `source-${Date.now()}`,
      name: file ? file.name : url || apiConfig?.apiEndpoint || 'Nueva Fuente',
      type,
      enabled: true,
      status: 'processing',
      addedAt: new Date(),
      metadata: file ? { fileSize: file.size } : url ? { url } : { apiEndpoint: apiConfig?.apiEndpoint },
    };

    setContextSources(prev => [...prev, newSource]);

    // Process the source based on type
    try {
      let extractedData = '';
      const workflow = workflows.find(w => w.sourceType === type);
      const config = {
        ...(workflow?.config || { maxFileSize: 50, maxOutputLength: 10000 }),
        model: apiConfig?.model || 'gemini-2.5-flash' // Use model from config or default to Flash
      };

      if (type === 'pdf-text' && file) {
        extractedData = await extractors.extractPdfText(file, config);
      } else if (type === 'pdf-images' && file) {
        extractedData = await extractors.extractPdfWithImages(file, config);
      } else if (type === 'pdf-tables' && file) {
        extractedData = await extractors.extractPdfTables(file, config);
      } else if (type === 'csv' && file) {
        extractedData = await extractors.extractCsv(file, config);
      } else if (type === 'excel' && file) {
        extractedData = await extractors.extractExcel(file, config);
      } else if (type === 'word' && file) {
        extractedData = await extractors.extractWord(file, config);
      } else if (type === 'web-url' && url) {
        extractedData = await extractors.extractFromUrl(url, config);
      } else if (type === 'api' && apiConfig) {
        extractedData = await extractors.extractFromApi(apiConfig.endpoint, config);
      }

      // Update source with extracted data
      setContextSources(prev =>
        prev.map(s =>
          s.id === newSource.id
            ? { ...s, status: 'active', extractedData }
            : s
        )
      );

      // Update context sections
      const tokensEstimate = Math.floor(extractedData.length / 4);
      setContextSections(prev => [
        ...prev.filter(s => s.name !== `Fuente: ${newSource.name}`),
        {
          name: `Fuente: ${newSource.name}`,
          tokenCount: tokensEstimate,
          content: extractedData,
          collapsed: true,
        },
      ]);
    } catch (error) {
      console.error('Error processing source:', error);
      setContextSources(prev =>
        prev.map(s =>
          s.id === newSource.id ? { ...s, status: 'error' } : s
        )
      );
    }
  };

  const handleToggleSource = (sourceId: string) => {
    setContextSources(prev =>
      prev.map(s =>
        s.id === sourceId ? { ...s, enabled: !s.enabled } : s
      )
    );

    // Update context sections visibility
    const source = contextSources.find(s => s.id === sourceId);
    if (source) {
      if (source.enabled) {
        // Removing from context
        setContextSections(prev =>
          prev.filter(s => s.name !== `Fuente: ${source.name}`)
        );
      } else {
        // Adding to context
        const tokensEstimate = Math.floor((source.extractedData?.length || 0) / 4);
        setContextSections(prev => [
          ...prev,
          {
            name: `Fuente: ${source.name}`,
            tokenCount: tokensEstimate,
            content: source.extractedData || '',
            collapsed: true,
          },
        ]);
      }
    }
  };

  const handleRemoveSource = (sourceId: string) => {
    const source = contextSources.find(s => s.id === sourceId);
    setContextSources(prev => prev.filter(s => s.id !== sourceId));
    
    if (source) {
      setContextSections(prev =>
        prev.filter(s => s.name !== `Fuente: ${source.name}`)
      );
    }
  };

  const handleRunWorkflow = (workflowId: string) => {
    setWorkflows(prev =>
      prev.map(w =>
        w.id === workflowId ? { ...w, status: 'running', startedAt: new Date() } : w
      )
    );

    // Open file picker based on workflow type
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setShowAddSourceModal(true);
    }
  };

  const handleConfigureWorkflow = (workflowId: string) => {
    console.log('⚙️ Configure workflow clicked:', workflowId);
    const workflow = workflows.find(w => w.id === workflowId);
    console.log('🔍 Found workflow:', workflow?.name);
    setSelectedWorkflow(workflow || null);
    setShowWorkflowConfigModal(true);
    console.log('✅ Modal state set to open');
  };

  const handleSaveWorkflowConfig = (workflowId: string, config: WorkflowConfig) => {
    setWorkflows(prev =>
      prev.map(w => (w.id === workflowId ? { ...w, config } : w))
    );
  };

  const handleSaveTemplate = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      // TODO: Implement template saving to localStorage or backend
      console.log('Guardando plantilla:', workflow);
      alert(`Plantilla "${workflow.name}" guardada exitosamente!`);
    }
  };

  // Source validation and sharing handlers
  const handleSourceClick = (sourceId: string) => {
    setSelectedSourceId(sourceId);
  };

  const handleValidateSource = (sourceId: string, comments: string) => {
    const validation: SourceValidation = {
      validated: true,
      validatedBy: userInfo.name,
      validatedAt: new Date(),
      comments,
    };
    
    setSourceValidations(prev => new Map(prev).set(sourceId, validation));
    
    // Log validation
    console.log('📝 Documento validado:', {
      sourceId,
      validatedBy: userInfo.name,
      comments,
      timestamp: new Date().toISOString(),
    });
  };

  const handleShareSource = (sourceId: string) => {
    const source = contextSources.find(s => s.id === sourceId);
    if (source) {
      setSourceToShare(source);
      setShowShareModal(true);
      setSelectedSourceId(null); // Close detail panel
    }
  };

  const handleGenerateShareEmail = async (
    sourceId: string,
    role: JobRole,
    userComments: string,
    personalizedRequest: string
  ): Promise<EmailTemplate> => {
    // Simulate AI email generation
    return new Promise((resolve) => {
      setTimeout(() => {
        const source = contextSources.find(s => s.id === sourceId);
        const summary = source?.extractedData?.substring(0, 200) + '...' || 'Resumen no disponible';
        
        const subject = `📄 ${source?.name} - Documento compartido para ${role.name}`;
        
        const body = `Hola,

Te comparto este documento que considero puede ser de gran valor para tu rol como ${role.name}.

📋 RESUMEN DEL DOCUMENTO:
${summary}

💬 MIS COMENTARIOS:
${userComments || 'Este documento contiene información relevante para nuestro trabajo.'}

🎯 CONTEXTO DE TU ROL:
Como ${role.name}, este contenido puede ayudarte con tus objetivos:
${role.okrs.map((okr, i) => `${i + 1}. ${okr}`).join('\n')}

${personalizedRequest ? `\n🤝 SOLICITUD:\n${personalizedRequest}\n` : ''}

Por favor revisa el documento y déjame saber tus comentarios o si tienes alguna pregunta.

Saludos,
${userInfo.name}
${userInfo.company}`;

        resolve({
          subject,
          body,
          summary,
          userComments,
          personalizedRequest,
        });
      }, 1500);
    });
  };

  const renderMessage = (message: Message) => {
    if (message.content.type === 'text') {
      return <p className="whitespace-pre-wrap">{message.content.text}</p>;
    }

    if (message.content.type === 'code' && message.content.code) {
      return (
        <div className="bg-slate-900 rounded-lg p-4 my-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">{message.content.code.language}</span>
            <Code className="w-4 h-4 text-slate-400" />
          </div>
          <pre className="text-sm text-slate-100 overflow-x-auto">
            <code>{message.content.code.content}</code>
          </pre>
        </div>
      );
    }

    if (message.content.type === 'mixed' && message.content.parts) {
      return (
        <div className="space-y-2">
          {message.content.parts.map((part, idx) => (
            <div key={idx}>
              {part.type === 'text' && <p className="whitespace-pre-wrap">{part.content as string}</p>}
              {part.type === 'code' && (
                <div className="bg-slate-900 rounded-lg p-4 my-2">
                  <pre className="text-sm text-slate-100 overflow-x-auto">
                    <code>{(part.content as any).code}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <p>Tipo de contenido no soportado</p>;
  };

  // Show Context Management Dashboard if selected
  if (currentView === 'contextManagement') {
    return (
      <ContextManagementDashboard 
        currentUserId={userInfo.email} 
        currentUserName={userInfo.name}
        onBackToChat={() => setCurrentView('chat')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left Sidebar - Conversations & Context */}
      <div className={`${selectedSourceId ? 'w-[600px]' : 'w-[440px]'} bg-white border-r border-slate-200 flex flex-col shadow-xl relative transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">Nuevo Agente</span>
          </button>
        </div>

        {/* Conversations List - Limited height to give more space to Context */}
        <div className={`flex-none ${selectedSourceId ? 'h-48' : 'h-64'} overflow-y-auto p-4 space-y-4 transition-all duration-300`}>
          {conversations.map(group => (
            <div key={group.label}>
              <h3 className="text-xs font-bold text-slate-600 uppercase mb-3 tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setCurrentConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all transform ${
                      currentConversation === conv.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                        : 'hover:bg-slate-100 text-slate-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        currentConversation === conv.id ? 'text-white' : 'text-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{conv.title}</p>
                        <p className={`text-xs ${
                          currentConversation === conv.id ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {conv.messageCount} mensajes
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Context Section - Expands to fill remaining vertical space */}
        <div className="flex-1 flex overflow-hidden border-t border-slate-200">
          {!selectedSourceId ? (
            /* Context Manager - List of sources */
            <div className="flex-1 flex flex-col">
              <ContextManager
                sources={contextSources}
                validations={sourceValidations}
                onAddSource={() => setShowAddSourceModal(true)}
                onToggleSource={handleToggleSource}
                onRemoveSource={handleRemoveSource}
                onSourceClick={handleSourceClick}
              />
            </div>
          ) : (
            /* Source Detail Panel - Full view of selected source */
            selectedSourceId && contextSources.find(s => s.id === selectedSourceId) && (
              <div className="flex-1 flex flex-col">
                <SourceDetailPanel
                  source={contextSources.find(s => s.id === selectedSourceId)!}
                  validation={sourceValidations.get(selectedSourceId)}
                  onClose={() => setSelectedSourceId(null)}
                  onValidate={handleValidateSource}
                  onShare={handleShareSource}
                />
              </div>
            )
          )}
        </div>

        {/* User Menu */}
        <div className="border-t border-slate-200 bg-gradient-to-br from-white to-slate-50">
          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="p-2 space-y-1">
              <button
                onClick={handleContextManagement}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 rounded-lg transition-all transform hover:scale-[1.02]"
              >
                <Shield className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Gestión de Contexto</span>
              </button>

              <button
                onClick={handleConfiguration}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 rounded-lg transition-all transform hover:scale-[1.02]"
              >
                <Settings className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Configuración</span>
              </button>

              <button
                onClick={handleHelp}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-100 rounded-lg transition-all transform hover:scale-[1.02]"
              >
                <HelpCircle className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Ayuda</span>
              </button>

              <div className="h-px bg-slate-200 my-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-all transform hover:scale-[1.02] group"
              >
                <LogOut className="w-5 h-5 text-red-600 group-hover:text-red-700" />
                <span className="text-sm font-medium text-red-600 group-hover:text-red-700">Cerrar Sesión</span>
              </button>
            </div>
          )}

          {/* User Info Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full p-4 flex items-center gap-3 hover:bg-slate-100 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              {userInfo.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{userInfo.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{userInfo.company}</span>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
              showUserMenu ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-6 py-4 transition-all transform hover:scale-[1.02] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-white border border-slate-200 text-slate-900 shadow-md'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-semibold">Asistente IA</span>
                      </div>
                    )}
                    {renderMessage(message)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl rounded-2xl px-6 py-4 bg-white border border-slate-200 shadow-md">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-blue-500 animate-pulse" />
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                        <span className="text-sm ml-2">Pensando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-2xl">
              {/* Context Window Display */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowContextDetails(!showContextDetails)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  <Info className="w-4 h-4" />
                  <span>Contexto: {contextWindowUsage.toFixed(1)}%</span>
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                      style={{ width: `${contextWindowUsage}%` }}
                    />
                  </div>
                  <span className="mx-2 text-slate-400">•</span>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {userConfig.model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
                  </span>
                  {showContextDetails ? (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  )}
                </button>

                {showContextDetails && (
                  <div className="absolute bottom-32 left-8 right-8 bg-white border border-slate-300 rounded-2xl shadow-2xl p-6 max-h-96 overflow-y-auto z-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 text-lg">Detalles de Ventana de Contexto</h3>
                      <button
                        onClick={() => setShowContextDetails(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {contextSections.map(section => (
                        <div key={section.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <button
                            onClick={() => toggleSection(section.name)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {expandedSections.has(section.name) ? (
                                <ChevronDown className="w-5 h-5 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
                              <span className="font-semibold text-sm text-slate-900">{section.name}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                              {section.tokenCount.toLocaleString()} tokens
                            </span>
                          </button>
                          {expandedSections.has(section.name) && (
                            <div className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-200 bg-slate-50">
                              <pre className="whitespace-pre-wrap pt-3">{section.content}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold">Total:</span> {contextSections.reduce((sum, s) => sum + s.tokenCount, 0).toLocaleString()} / 1,000,000 tokens
                        <span className="ml-2 text-xs text-slate-500">({contextWindowUsage.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="space-y-3">
                <div className="flex items-end gap-4">
                  <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md">
                    <Paperclip className="w-6 h-6" />
                  </button>
                  
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Escribe tu mensaje... (Shift+Enter para nueva línea)"
                      className="w-full px-5 py-4 border-2 border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm hover:shadow-md transition-all"
                      rows={1}
                      style={{ minHeight: '56px', maxHeight: '200px' }}
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>

                {/* Disclaimer */}
                <div className="text-center text-xs text-slate-500 px-4">
                  Flow puede cometer errores. Ante cualquier duda, consulta las respuestas con un experto antes de tomar decisiones críticas.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-110 transition-transform">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Bienvenido a Flow!</h2>
              <p className="text-lg text-slate-600 mb-6">Selecciona una conversación o inicia una nueva</p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 inline-block mr-2" />
                Comenzar a Chatear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Workflows */}
      <WorkflowsPanel
        workflows={workflows}
        onRunWorkflow={handleRunWorkflow}
        onConfigureWorkflow={handleConfigureWorkflow}
        onSaveTemplate={handleSaveTemplate}
      />

      {/* Modals */}
      <AddSourceModal
        isOpen={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
        onAddSource={handleAddSource}
      />

      <WorkflowConfigModal
        workflow={selectedWorkflow}
        isOpen={showWorkflowConfigModal}
        onClose={() => {
          setShowWorkflowConfigModal(false);
          setSelectedWorkflow(null);
        }}
        onSave={handleSaveWorkflowConfig}
      />

      <ShareSourceModal
        source={sourceToShare!}
        isOpen={showShareModal && sourceToShare !== null}
        onClose={() => {
          setShowShareModal(false);
          setSourceToShare(null);
        }}
        onGenerateEmail={handleGenerateShareEmail}
      />
    </div>
  );
}

