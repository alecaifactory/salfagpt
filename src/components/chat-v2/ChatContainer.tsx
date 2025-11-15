/**
 * Chat V2 - Main Container
 * 
 * Clean, modular architecture:
 * - 200 lines vs 7,800+ in v1
 * - Single responsibility
 * - Coordinated loading
 * - No flickering
 * - Feature flag controlled
 */

import React, { useEffect } from 'react';
import { useChatStore } from './core/ChatStore';
import { useCoordinatedLoad } from './hooks/useCoordinatedLoad';

interface ChatContainerProps {
  userId: string; // ✅ ALWAYS usr_xxx format (validated in chat.astro)
  userEmail: string;
  userName: string;
  userRole: string;
}

export default function ChatContainer({ userId, userEmail, userName, userRole }: ChatContainerProps) {
  const { 
    initialize, 
    currentAgentId, 
    loading,
    ui 
  } = useChatStore();
  
  const { loadAgentData } = useCoordinatedLoad();
  
  // ===== INITIALIZATION =====
  useEffect(() => {
    console.log('🎯 [CHAT V2] Initializing...');
    console.log('   UserID:', userId);
    console.log('   Email:', userEmail);
    console.log('   Role:', userRole);
    
    try {
      initialize(userId, userEmail, userName, userRole);
    } catch (error) {
      console.error('❌ [CHAT V2] Initialization failed:', error);
    }
  }, [userId, userEmail, userName, userRole]);
  
  // ===== LOAD AGENT DATA =====
  useEffect(() => {
    if (!currentAgentId) {
      console.log('ℹ️ [CHAT V2] No agent selected');
      return;
    }
    
    console.log('🔄 [CHAT V2] Loading agent data:', currentAgentId);
    loadAgentData(currentAgentId);
    
  }, [currentAgentId]);
  
  // ===== RENDER =====
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* LEFT: Sidebar */}
      <div 
        className="border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col"
        style={{ width: ui.sidebarWidth }}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            SALFAGPT
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chat V2 - Nueva Arquitectura
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sidebar en construcción...
          </p>
          {/* TODO: ChatSidebar component */}
        </div>
      </div>
      
      {/* RIGHT: Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentAgentId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
                Comienza una conversación
              </p>
              <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                Selecciona un agente en el panel izquierdo para empezar a chatear
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Chat area en construcción...
              </p>
              <p className="text-xs text-slate-500">
                Agent ID: {currentAgentId}
              </p>
              {/* TODO: MessagesArea component */}
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {/* Loading Progress Bar */}
          {loading?.isLoading && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {loading.message}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  {loading.progress}%
                </span>
              </div>
              <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loading.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Input Field (Placeholder) */}
          <div className="max-w-4xl mx-auto">
            <textarea
              placeholder="Escribe un mensaje... (Chat V2 en construcción)"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm resize-none"
              disabled
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Chat V2 en desarrollo - Feature flag controlado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

