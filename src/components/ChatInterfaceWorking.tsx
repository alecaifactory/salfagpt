import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, FileText, Loader2 } from 'lucide-react';

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
  enabled: boolean;
  extractedData: string;
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
      enabled: false,
      extractedData: 'Contenido de ejemplo del PDF para contexto del AI.'
    }
  ]);

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
        <div className="border-t border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Fuentes de Contexto</h3>
          {contextSources.map(source => (
            <div key={source.id} className="flex items-center justify-between p-2 bg-slate-50 rounded mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{source.name}</span>
              </div>
              <button
                onClick={() => toggleContext(source.id)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  source.enabled ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  source.enabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
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
    </div>
  );
}

