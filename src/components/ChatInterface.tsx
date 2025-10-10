import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Folder, 
  Clock,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  Code,
  Info
} from 'lucide-react';

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
  const [contextWindowUsage, setContextWindowUsage] = useState(2.3);
  const [contextSections, setContextSections] = useState<ContextSection[]>([
    {
      name: 'System Instructions',
      tokenCount: 500,
      content: 'You are a helpful AI assistant powered by Gemini 2.5-pro.',
      collapsed: true,
    },
    {
      name: 'Conversation History',
      tokenCount: 1500,
      content: 'Current conversation messages',
      collapsed: false,
    },
    {
      name: 'User Context',
      tokenCount: 0,
      content: 'No additional context',
      collapsed: true,
    },
  ]);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [useMockData, setUseMockData] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (useMockData) {
      // Mock data for development
      setConversations([
        {
          label: 'Today',
          conversations: [
            {
              id: 'conv-1',
              title: 'Getting Started with AI',
              lastMessageAt: new Date(),
              messageCount: 5,
            },
          ],
        },
        {
          label: 'Yesterday',
          conversations: [
            {
              id: 'conv-2',
              title: 'Python Programming Help',
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

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);
      const data = await response.json();
      setConversations(data.groups);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setUseMockData(true);
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

  const loadContextInfo = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/context`);
      const data = await response.json();
      setContextWindowUsage(data.usage);
      setContextSections(data.sections);
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
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      setCurrentConversation(data.conversation.id);
      loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
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
            text: `I'm a mock AI response to: "${currentInput}"\n\nThis is the full ChatInterface with:\n✅ Left sidebar with conversations\n✅ Context window tracking (${contextWindowUsage.toFixed(1)}%)\n✅ Multi-modal support ready\n✅ Professional UI\n\nTo enable real AI responses, configure your Google AI API key in the environment variables.`,
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

    return <p>Unsupported content type</p>;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">New Conversation</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                          {conv.messageCount} messages
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
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
                        <span className="text-xs font-semibold">AI Assistant</span>
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
                        <span className="text-sm ml-2">Thinking...</span>
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
                  <span>Context: {contextWindowUsage.toFixed(1)}%</span>
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                      style={{ width: `${contextWindowUsage}%` }}
                    />
                  </div>
                  {showContextDetails ? (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  )}
                </button>

                {showContextDetails && (
                  <div className="absolute bottom-32 left-8 right-8 bg-white border border-slate-300 rounded-2xl shadow-2xl p-6 max-h-96 overflow-y-auto z-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 text-lg">Context Window Details</h3>
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
                    placeholder="Type your message... (Shift+Enter for new line)"
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-110 transition-transform">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to SalfaGPT!</h2>
              <p className="text-lg text-slate-600 mb-6">Select a conversation or start a new one</p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 inline-block mr-2" />
                Start Chatting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

