/**
 * ChatSidebar - Left panel with agents, folders, history
 */

import React from 'react';
import { Bot, FolderOpen, History, Plus } from 'lucide-react';
import type { Conversation } from '../core/types';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onCreateAgent: () => void;
}

export default function ChatSidebar({
  conversations,
  currentAgentId,
  onSelectAgent,
  onCreateAgent
}: ChatSidebarProps) {
  
  // Filter agents (base templates)
  const agents = conversations.filter(c => 
    c.isAgent === true && 
    c.status !== 'archived'
  );
  
  // Filter chats (conversations created from agents)
  const chats = conversations.filter(c =>
    c.isAgent !== true &&
    c.agentId &&
    c.status !== 'archived'
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          SALFAGPT
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Chat V2 - Arquitectura Optimizada
        </p>
      </div>
      
      {/* New Agent Button */}
      <div className="p-3">
        <button
          onClick={onCreateAgent}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Agente
        </button>
      </div>
      
      {/* Agents Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-4">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Bot className="w-4 h-4" />
            <span>Agentes</span>
            <span className="ml-auto px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
              {agents.length}
            </span>
          </div>
          
          <div className="space-y-1 mt-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentAgentId === agent.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <p className="text-sm truncate">{agent.title}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Chats Section (Historial) */}
        {chats.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <History className="w-4 h-4" />
              <span>Historial</span>
              <span className="ml-auto px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                {chats.length}
              </span>
            </div>
            
            <div className="space-y-1 mt-2 max-h-64 overflow-y-auto">
              {chats.slice(0, 20).map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelectAgent(chat.id)}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs truncate"
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* User Info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium truncate">{agents.length} agentes</p>
          <p className="truncate">{chats.length} conversaciones</p>
        </div>
      </div>
    </div>
  );
}

