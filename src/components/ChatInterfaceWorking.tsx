import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, FileText, Loader2, User, Settings, LogOut, Play, CheckCircle, XCircle } from 'lucide-react';
import ContextManager from './ContextManager';
import type { Workflow } from '../types/context';
import { DEFAULT_WORKFLOWS } from '../types/context';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: Date;
}

interface ContextSource {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'excel' | 'word' | 'folder' | 'web-url' | 'api';
  enabled: boolean;
  status: 'processing' | 'active' | 'error' | 'disabled';
  extractedData: string;
  addedAt: Date;
  metadata?: {
    originalFileSize?: number;
    pageCount?: number;
  };
}

export default function ChatInterfaceWorking({ userId }: { userId: string }) {
  // Core state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Context state
  const [contextSources, setContextSources] = useState<ContextSource[]>([
    {
      id: 'demo-1',
      name: 'Documento Demo.pdf',
      type: 'pdf',
      enabled: false,
      status: 'active',
      extractedData: 'Contenido de ejemplo del PDF para contexto del AI.',
      addedAt: new Date(),
      metadata: {
        originalFileSize: 1024 * 500, // 500 KB
        pageCount: 5
      }
    }
  ]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  
  // Workflows state
  const [workflows, setWorkflows] = useState<Workflow[]>(
    DEFAULT_WORKFLOWS.map((w, i) => ({
      ...w,
      id: `workflow-${i}`,
      status: 'available' as const
    }))
  );
  const [showRightPanel, setShowRightPanel] = useState(true);

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
      // Fallback: create temp conversation
      createNewConversation();
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadContextForConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/context-sources`);
      if (response.ok) {
        const data = await response.json();
        const activeIds = data.activeContextSourceIds || [];
        
        // Update context sources enabled state
        setContextSources(prev => 
          prev.map(source => ({
            ...source,
            enabled: activeIds.includes(source.id)
          }))
        );
      }
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

  const createNewConversation = async () => {
    const tempId = `temp-${Date.now()}`;
    const newConv: Conversation = {
      id: tempId,
      title: 'Nuevo Agente',
      lastMessageAt: new Date()
    };
    
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(tempId);
    setMessages([]);
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
          model: 'gemini-2.5-flash',
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

  const toggleContext = (sourceId: string) => {
    setContextSources(prev => 
      prev.map(source => 
        source.id === sourceId 
          ? { ...source, enabled: !source.enabled }
          : source
      )
    );

    // Save to backend
    if (currentConversation) {
      const newActiveIds = contextSources
        .map(s => s.id === sourceId ? { ...s, enabled: !s.enabled } : s)
        .filter(s => s.enabled)
        .map(s => s.id);
      saveContextForConversation(currentConversation, newActiveIds);
    }
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
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
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
            <button
              key={conv.id}
              onClick={() => setCurrentConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                currentConversation === conv.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{conv.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Context Sources */}
        <ContextManager
          sources={contextSources}
          validations={new Map()}
          onAddSource={() => console.log('Add source')}
          onToggleSource={toggleContext}
          onRemoveSource={(id) => {
            setContextSources(prev => prev.filter(s => s.id !== id));
          }}
          onSourceClick={setSelectedSourceId}
          onSourceSettings={(id) => console.log('Settings for', id)}
        />

        {/* User Menu */}
        <div className="border-t border-slate-200 p-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{userId}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => console.log('Settings')}
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
                <div
                  className={`inline-block max-w-2xl p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
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
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span className="font-medium">Contexto:</span>
                <span className="text-blue-600">{contextSources.filter(s => s.enabled).length} activas</span>
                <span className="text-slate-400">•</span>
                <span>{contextSources.filter(s => s.enabled).reduce((sum, s) => sum + (s.extractedData?.length || 0), 0)} chars</span>
              </button>
            </div>

            {/* Context Panel */}
            {showContextPanel && (
              <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Fuentes Activas</h4>
                {contextSources.filter(s => s.enabled).length === 0 ? (
                  <p className="text-sm text-slate-500">No hay fuentes activas</p>
                ) : (
                  <div className="space-y-2">
                    {contextSources.filter(s => s.enabled).map(source => (
                      <div key={source.id} className="p-3 bg-white rounded border border-slate-200">
                        <p className="text-sm font-medium text-slate-800">{source.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {source.extractedData.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
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
                      console.log('Run workflow:', workflow.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Ejecutar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Configure workflow:', workflow.id);
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
    </div>
  );
}

