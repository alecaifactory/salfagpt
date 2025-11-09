/**
 * Mobile Chat Interface
 * Optimized lightweight UI for mobile devices with on-demand loading
 */

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, Menu, ThumbsUp, ThumbsDown, Camera, X, Loader2, FolderOpen, ChevronRight } from 'lucide-react';
import MessageRenderer from './MessageRenderer';
import type { SourceReference } from '../lib/gemini';

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
  messageCount: number;
  agentModel?: string;
  conversationType?: string;
  isAgent?: boolean;
  isProject?: boolean;
  agentId?: string;  // ✅ Parent agent ID (for conversations/chats)
  folderId?: string;
  status?: string;
}

interface Folder {
  id: string;
  name: string;
  conversationCount: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: SourceReference[];
}

interface MobileChatInterfaceProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

export default function MobileChatInterface({ userId, userEmail, userName, userRole }: MobileChatInterfaceProps) {
  // Core state - minimal for performance
  const [showSidebar, setShowSidebar] = useState(false);
  const [agents, setAgents] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Sidebar sections
  const [showAgentsSection, setShowAgentsSection] = useState(false); // ✅ Collapsed by default
  const [showConversationsSection, setShowConversationsSection] = useState(true); // ✅ Expanded by default
  const [showFoldersSection, setShowFoldersSection] = useState(false);
  
  // Feedback state
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load agents and folders on mount
  useEffect(() => {
    loadAgents();
    loadFolders();
  }, [userId]);

  // ✅ STEP 2: Don't auto-load messages - start with blank chat
  // Messages will load only when user sends first message or explicitly requests history

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        
        console.log('📱 [MOBILE] API response:', data);
        
        // Extract agents from grouped response
        const allConvs = [
          ...(data.groups?.[0]?.conversations || []),
          ...(data.groups?.[1]?.conversations || []),
          ...(data.groups?.[2]?.conversations || []),
        ];
        
        console.log('📱 [MOBILE] All conversations before filter:', allConvs.length);
        console.log('📱 [MOBILE] Archived count:', allConvs.filter(c => c.status === 'archived').length);
        
        // ✅ CRITICAL: Filter active agents only (not archived)
        const activeAgents = allConvs.filter((conv: Conversation) => {
          const isArchived = conv.status === 'archived';
          if (isArchived) {
            console.log('📱 [MOBILE] Filtering out archived:', conv.title);
          }
          return !isArchived;
        });
        
        console.log('📱 [MOBILE] Active agents after filter:', activeAgents.length);
        setAgents(activeAgents);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch(`/api/folders?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadMessages = async (agentId: string) => {
    try {
      const response = await fetch(`/api/conversations/${agentId}/messages`);
      if (response.ok) {
        const data = await response.json();
        
        // ✅ CRITICAL: Transform MessageContent object to string
        // Firestore stores content as { type: 'text', text: '...' }
        // But React expects a string
        const transformedMessages = (data.messages || []).map((msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string' 
            ? msg.content 
            : msg.content?.text || String(msg.content || ''),
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentAgent || isSending) return;

    const userMessage = input.trim();
    setInput(''); // Clear input immediately
    setIsSending(true);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch(`/api/conversations/${currentAgent}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: userMessage,
          model: 'gemini-2.5-flash', // Mobile defaults to Flash for speed
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // ✅ CRITICAL: Transform MessageContent objects to strings
        const transformMessage = (msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string' 
            ? msg.content 
            : msg.content?.text || String(msg.content || ''),
          timestamp: new Date(msg.timestamp)
        });
        
        // Replace temp message with real messages
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempId);
          return [
            ...withoutTemp, 
            transformMessage(data.userMessage), 
            transformMessage(data.assistantMessage)
          ];
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const submitFeedback = async (messageId: string, rating: 'positive' | 'negative', screenshot?: string) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId: currentAgent,
          userId,
          rating,
          screenshot,
          timestamp: new Date(),
        }),
      });
      setFeedbackMessageId(null);
      setShowCamera(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const captureScreenshot = async () => {
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (feedbackMessageId) {
        submitFeedback(feedbackMessageId, 'negative', base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectAgent = (agentId: string) => {
    setCurrentAgent(agentId);
    setShowSidebar(false); // Close sidebar when selecting agent
    setMessages([]); // ✅ STEP 2: Start with blank chat
  };
  
  // Current agent info
  const currentAgentInfo = agents.find(a => a.id === currentAgent);
  
  // Sample questions by agent (defined once)
  const AGENT_SAMPLE_QUESTIONS: Record<string, string[]> = {
    'M001': [
      '¿Diferencia entre Loteo DFL2 y Construcción Simultánea?',
      '¿Diferencia entre condominio tipo A y tipo B?',
      '¿Requisitos para aprobar permiso de edificios?',
    ],
    'S001': [
      '¿Dónde busco los códigos de materiales?',
      '¿Cómo hago un pedido de convenio?',
      '¿Cómo genero informe de consumo de petróleo?',
    ],
    'S002': [
      '¿Pasos para mantención de grúa Grove RT765E?',
      '¿Cómo cambio filtro de aire motor Cummins?',
      '¿Qué significa código de falla CF103 Scania?',
    ],
    'M003': [
      '¿Qué procedimientos asociados al plan de calidad?',
      '¿Qué planilla para controlar pérdidas de hormigón?',
      '¿Transacción SAP para flujo de materiales?',
    ],
  };
  
  // Get sample questions for current agent
  const getSampleQuestions = (): string[] => {
    if (!currentAgentInfo) {
      console.log('📱 No current agent info');
      return [];
    }
    
    console.log('📱 Getting samples for:', currentAgentInfo.title);
    
    // Try to match agent code in title (M001, S001, S002, M003)
    const agentKey = Object.keys(AGENT_SAMPLE_QUESTIONS).find(key => 
      currentAgentInfo.title.toUpperCase().includes(key)
    );
    
    console.log('📱 Matched agent key:', agentKey);
    
    const questions = agentKey ? AGENT_SAMPLE_QUESTIONS[agentKey] : [];
    console.log('📱 Sample questions:', questions.length);
    
    return questions;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ CRITICAL: Separate AGENTS from CONVERSATIONS (chats)
  // Agents = Base templates (M001, S001, S002, M003)
  // Conversations = Chats created from agents (have agentId field)
  
  const baseAgents = agents.filter(conv => 
    conv.status !== 'archived' && 
    conv.isAgent === true  // Only actual agents, not chats
  );
  
  const userConversations = agents.filter(conv => 
    conv.status !== 'archived' && 
    conv.agentId !== undefined  // Has parent agent = is a conversation/chat
  );
  
  const conversationGroups = {
    agents: baseAgents,
    conversations: userConversations,
    projects: agents.filter(conv => 
      conv.status !== 'archived' && 
      conv.isProject === true
    ),
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Hamburger Sidebar - Slides from left */}
      <div
        className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 z-50 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">SALFAGPT</h1>
              <img 
                src="/images/Logo Salfacorp.png" 
                alt="Salfacorp" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {/* User info */}
          <div className="text-sm text-slate-600">
            {userName}
          </div>
        </div>

        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Folders Section */}
          <div>
            <button
              onClick={() => setShowFoldersSection(!showFoldersSection)}
              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FolderOpen className="w-4 h-4" />
                <span>Carpetas</span>
                <span className="text-xs text-slate-500">({folders.length})</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showFoldersSection ? 'rotate-90' : ''
                }`}
              />
            </button>
            
            {showFoldersSection && folders.length > 0 && (
              <div className="mt-2 space-y-1 pl-6">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    className="p-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
                  >
                    {folder.name} ({folder.conversationCount})
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agents Section */}
          <div>
            <button
              onClick={() => setShowAgentsSection(!showAgentsSection)}
              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Bot className="w-4 h-4" />
                <span>Agentes</span>
                <span className="text-xs text-slate-500">({conversationGroups.agents.length})</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showAgentsSection ? 'rotate-90' : ''
                }`}
              />
            </button>
            
            {showAgentsSection && (
              <div className="mt-2 space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                ) : conversationGroups.agents.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">
                    No hay agentes
                  </div>
                ) : (
                  conversationGroups.agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => selectAgent(agent.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentAgent === agent.id
                          ? 'bg-blue-100 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-800 truncate mb-1">
                        {agent.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MessageSquare className="w-3 h-3" />
                        <span>{agent.messageCount || 0} mensajes</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ✅ Conversaciones Section - Chats created from agents */}
          <div>
            <button
              onClick={() => setShowConversationsSection(!showConversationsSection)}
              className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageSquare className="w-4 h-4" />
                <span>Conversaciones</span>
                <span className="text-xs text-slate-500">
                  ({conversationGroups.conversations.length})
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showConversationsSection ? 'rotate-90' : ''
                }`}
              />
            </button>
            
            {showConversationsSection && (
              <div className="mt-2 space-y-2">
                {conversationGroups.conversations.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">
                    No hay conversaciones activas
                  </div>
                ) : (
                  conversationGroups.conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => selectAgent(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentAgent === conv.id
                          ? 'bg-blue-100 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-800 truncate mb-1">
                        {conv.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MessageSquare className="w-3 h-3" />
                        <span>{conv.messageCount || 0} mensajes</span>
                        {conv.agentModel && (
                          <>
                            <span>•</span>
                            <span className="text-[10px]">
                              {conv.agentModel.includes('pro') ? '✨ Pro' : '⚡ Flash'}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop when sidebar open */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col h-screen flex-1">
        {/* Mobile Chat Header */}
        <div className="bg-blue-600 text-white p-4 shadow-lg safe-area-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center active:bg-blue-700 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{currentAgentInfo?.title || 'SalfaGPT'}</h2>
              {currentAgentInfo && (
                <p className="text-xs text-blue-100">
                  {currentAgentInfo.agentModel === 'gemini-2.5-pro' ? 'Gemini Pro' : 'Gemini Flash'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {!currentAgent ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Menu className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg mb-2">Selecciona un agente</p>
                <p className="text-sm">Toca el menú (☰) para ver tus agentes</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 p-6">
              <div className="text-center max-w-sm">
                <Bot className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {currentAgentInfo?.title || 'Agente'}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {currentAgentInfo?.agentModel === 'gemini-2.5-pro' ? '✨ Gemini Pro' : '⚡ Gemini Flash'}
                </p>
                <p className="text-sm text-slate-600">
                  Haz una pregunta o selecciona una sugerencia abajo 👇
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-800 shadow-sm border border-slate-200'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>
                        <MessageRenderer
                          content={msg.content}
                          contextSources={[]}
                          onSourceClick={() => {}}
                        />
                        
                        {/* Feedback buttons - Big tap targets for mobile */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => submitFeedback(msg.id, 'positive')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg active:bg-green-100 border border-green-200"
                          >
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-medium">Útil</span>
                          </button>
                          <button
                            onClick={() => {
                              setFeedbackMessageId(msg.id);
                              setShowCamera(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg active:bg-red-100 border border-red-200"
                          >
                            <ThumbsDown className="w-5 h-5" />
                            <span className="text-sm font-medium">Mejorar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed bottom with large tap target */}
        <div className="border-t border-slate-200 bg-white p-4 safe-area-bottom">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              rows={1}
              disabled={!currentAgent}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base disabled:bg-slate-100 disabled:text-slate-400"
              style={{ minHeight: '48px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending || !currentAgent}
              className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-xl disabled:bg-slate-300 disabled:text-slate-500 active:bg-blue-700 flex items-center justify-center shadow-lg"
            >
              {isSending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {/* ✅ STEP 3: Sample Questions Carousel - Mobile optimized with swipe */}
          {currentAgent && messages.length === 0 && getSampleQuestions().length > 0 && (
            <div className="mt-3 mb-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {getSampleQuestions().map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(question);
                      sendMessage();
                    }}
                    className="flex-shrink-0 snap-start px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium active:bg-blue-100 border border-blue-200 whitespace-nowrap max-w-[85%]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Disclaimer - Compact for mobile */}
          <p className="text-xs text-slate-500 text-center mt-2">
            SalfaGPT puede cometer errores. Consulta con un experto antes de tomar decisiones críticas.
          </p>
        </div>
      </div>

      {/* Screenshot capture modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Agregar Captura</h3>
              <button
                onClick={() => {
                  setShowCamera(false);
                  setFeedbackMessageId(null);
                }}
                className="text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Adjunta una captura de pantalla para ayudarnos a mejorar esta respuesta
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            
            <div className="space-y-2">
              <button
                onClick={captureScreenshot}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg active:bg-blue-700"
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">Tomar Foto</span>
              </button>
              
              <button
                onClick={() => {
                  if (feedbackMessageId) {
                    submitFeedback(feedbackMessageId, 'negative');
                  }
                }}
                className="w-full px-6 py-3 text-sm text-slate-600 active:bg-slate-100 rounded-lg"
              >
                Enviar sin captura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

