/**
 * MessagesArea - Display messages with tabs (Chat / Mindmap)
 */

import React, { useRef, useEffect, useState } from 'react';
import { Bot, MessageSquare, Network } from 'lucide-react';
import type { Message } from '../core/types';
import MessageBubble from './MessageBubble';
import ConversationMindmap from './ConversationMindmap';

interface MessagesAreaProps {
  messages: Message[];
  agentTitle?: string;
  userRole?: string; // For feature flag check
  contextSources?: Array<{
    id: string;
    name: string;
    type: string;
    enabled: boolean;
  }>;
}

type ViewTab = 'chat' | 'mindmap';

export default function MessagesArea({ 
  messages, 
  agentTitle,
  userRole = 'user',
  contextSources = []
}: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('chat');
  
  // Feature flag: Only SuperAdmin can see mindmap tab
  const isSuperAdmin = userRole === 'superadmin';
  
  // Auto-scroll to bottom (only in chat view)
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);
  
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Tabs - even when empty, show for consistency */}
        {isSuperAdmin && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'mindmap'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Network className="w-4 h-4" />
              Mapa Mental
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full font-semibold">
                SuperAdmin
              </span>
            </button>
          </div>
        )}
        
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-6">
          <Bot className="w-16 h-16 mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
            {agentTitle ? `Conversación con ${agentTitle}` : 'Comienza una conversación'}
          </p>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Escribe un mensaje abajo para empezar a chatear
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      {isSuperAdmin && (
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
            {messages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                {messages.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'mindmap'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Network className="w-4 h-4" />
            Mapa Mental
            <span className="ml-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full font-semibold">
              SA
            </span>
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full overflow-y-auto p-6">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <ConversationMindmap 
            messages={messages}
            agentTitle={agentTitle}
            contextSources={contextSources}
          />
        )}
      </div>
    </div>
  );
}


