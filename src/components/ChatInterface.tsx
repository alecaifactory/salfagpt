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
                    className={`max-w-3xl rounded-2xl px-6 py-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-900'
                    }`}
                  >
                    {renderMessage(message)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl rounded-2xl px-6 py-4 bg-white border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 bg-white p-4">
              {/* Context Window Display */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() => setShowContextDetails(!showContextDetails)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Info className="w-4 h-4" />
                  <span>Context: {contextWindowUsage.toFixed(1)}%</span>
                  {showContextDetails ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {showContextDetails && (
                  <div className="absolute bottom-24 left-4 right-4 bg-white border border-slate-200 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
                    <h3 className="font-semibold text-slate-900 mb-3">Context Window Details</h3>
                    <div className="space-y-2">
                      {contextSections.map(section => (
                        <div key={section.name} className="border border-slate-200 rounded-lg">
                          <button
                            onClick={() => toggleSection(section.name)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              {expandedSections.has(section.name) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span className="font-medium text-sm">{section.name}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {section.tokenCount.toLocaleString()} tokens
                            </span>
                          </button>
                          {expandedSections.has(section.name) && (
                            <div className="px-3 pb-3 text-sm text-slate-600 border-t border-slate-200 pt-2 mt-2">
                              <pre className="whitespace-pre-wrap">{section.content}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="flex items-end gap-3">
                <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5" />
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
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '200px' }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

