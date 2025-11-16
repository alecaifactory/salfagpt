/**
 * Ally Workspace Component
 * 
 * Minimal 3-column workspace for Ally personal assistant.
 * Completely isolated from ChatInterfaceWorking.tsx
 * 
 * Version: 1.0.0 (MVP)
 * Date: 2025-11-16
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Loader2,
  AlertCircle,
  User,
  Building2,
  Globe,
  MessageCircle,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AllyWorkspaceProps {
  userId: string;
  userEmail: string;
  userDomain: string;
  organizationId?: string;
  userRole: string;
}

interface AllyMessage {
  id: string;
  role: 'user' | 'ally' | 'system';
  content: string;
  timestamp: Date;
}

export default function AllyWorkspace({
  userId,
  userEmail,
  userDomain,
  organizationId,
  userRole,
}: AllyWorkspaceProps) {
  
  const [allyConversationId, setAllyConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AllyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load Ally on mount
  useEffect(() => {
    loadAlly();
  }, [userId]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  async function loadAlly() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🤖 [ALLY WORKSPACE] Loading Ally...');
      
      // Get or create Ally conversation
      const response = await fetch(
        `/api/ally?userId=${userId}&userEmail=${encodeURIComponent(userEmail)}&userDomain=${userDomain}${organizationId ? `&organizationId=${organizationId}` : ''}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setAllyConversationId(data.allyId);
      
      console.log('✅ [ALLY WORKSPACE] Ally loaded:', data.allyId);
      
      // Load messages
      await loadMessages(data.allyId);
      
    } catch (error) {
      console.error('❌ [ALLY WORKSPACE] Failed to load Ally:', error);
      setError(error instanceof Error ? error.message : 'Failed to load Ally');
    } finally {
      setLoading(false);
    }
  }
  
  async function loadMessages(conversationId: string) {
    try {
      console.log('📨 [ALLY WORKSPACE] Loading messages...');
      
      const response = await fetch(`/api/ally/messages?conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform messages
      const transformedMessages: AllyMessage[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));
      
      setMessages(transformedMessages);
      
      console.log(`✅ [ALLY WORKSPACE] Loaded ${transformedMessages.length} messages`);
      
    } catch (error) {
      console.error('❌ [ALLY WORKSPACE] Failed to load messages:', error);
    }
  }
  
  async function sendMessage() {
    if (!inputValue.trim() || !allyConversationId) return;
    
    try {
      setSending(true);
      
      console.log('📤 [ALLY WORKSPACE] Sending message...');
      
      const response = await fetch('/api/ally/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: allyConversationId,
          userId,
          message: inputValue,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add both user message and Ally response to UI
      setMessages(prev => [
        ...prev,
        {
          id: data.userMessage.id,
          role: 'user',
          content: data.userMessage.content,
          timestamp: new Date(data.userMessage.timestamp),
        },
        {
          id: data.allyResponse.id,
          role: 'ally',
          content: data.allyResponse.content,
          timestamp: new Date(data.allyResponse.timestamp),
        },
      ]);
      
      // Clear input
      setInputValue('');
      
      console.log('✅ [ALLY WORKSPACE] Message sent successfully');
      
    } catch (error) {
      console.error('❌ [ALLY WORKSPACE] Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-slate-900">Loading Ally...</p>
          <p className="text-sm text-slate-600 mt-1">Your personal assistant is starting up</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && !allyConversationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900 mb-2">Failed to load Ally</p>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={loadAlly}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Main workspace (MVP: 2-column layout - Conversation + minimal input info)
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left: Input Info (Simplified for MVP) */}
      <div className="w-[280px] border-r border-slate-200 bg-white flex flex-col">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Ally Workspace</h2>
              <p className="text-xs text-slate-600">Beta v1.0</p>
            </div>
          </div>
        </div>
        
        {/* Context Inputs (MVP: Simple info display) */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {/* Organization Info */}
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Building2 className="w-4 h-4" />
                <span>Organization</span>
              </div>
              <p className="text-xs text-slate-600">
                {organizationId || 'Not set'}
              </p>
            </div>
            
            {/* Domain Info */}
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Globe className="w-4 h-4" />
                <span>Domain</span>
              </div>
              <p className="text-xs text-slate-600">
                {userDomain}
              </p>
            </div>
            
            {/* Conversation Info */}
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MessageCircle className="w-4 h-4" />
                <span>This Conversation</span>
              </div>
              <p className="text-xs text-slate-600">
                {messages.length} messages
              </p>
            </div>
          </div>
          
          {/* Coming Soon */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Coming Soon:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Agent selection</li>
              <li>• Conversation history</li>
              <li>• Action history</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Middle: Conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ally - Personal Assistant</h2>
              <p className="text-sm text-slate-500">
                Always here to help • {messages.length} messages
              </p>
            </div>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
              BETA
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'ally' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 border border-blue-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center ml-3 flex-shrink-0">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Ally Memory Indicator */}
        <div className="border-t border-blue-200 bg-blue-50 px-6 py-2">
          <p className="text-xs text-blue-900">
            🧠 <span className="font-semibold">Ally Memory:</span> Learning your preferences as we chat
          </p>
        </div>
        
        {/* Input Area */}
        <div className="border-t border-slate-200 px-6 py-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Ally... (Shift+Enter for new line)"
                disabled={sending}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                rows={3}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || sending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-[84px]"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-slate-500 mt-2 text-center">
            Ally Beta • Experimental feature • SuperAdmin access only
          </p>
        </div>
      </div>
      
      {/* Right: Actions Panel (Placeholder for MVP) */}
      <div className="w-[320px] border-l border-slate-200 bg-white flex flex-col">
        <div className="border-b border-slate-200 px-4 py-4">
          <h3 className="font-semibold text-slate-900">Ally Apps</h3>
          <p className="text-xs text-slate-600 mt-1">Coming in Phase 2</p>
        </div>
        
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {/* Placeholder apps */}
            {['Summary', 'Email', 'Collaborate'].map((app) => (
              <div
                key={app}
                className="border border-slate-200 rounded-lg p-3 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{app}</p>
                    <p className="text-xs text-slate-500">Phase 2</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs font-semibold text-purple-900 mb-2">Phase 2 Features:</p>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• Summarize conversations</li>
              <li>• Send AI-generated emails</li>
              <li>• Collaborate with team</li>
              <li>• Export and share</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

