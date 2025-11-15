/**
 * Chat V2 - Complete Rebuild
 * Clean, modular, no flickering
 */

import React, { useEffect } from 'react';
import { useChatStore } from './core/ChatStore';
import { useConversations } from './hooks/useConversations';
import { useCoordinatedLoad } from './hooks/useCoordinatedLoad';
import { useMessages } from './hooks/useMessages';
import ChatSidebar from './sidebar/ChatSidebar';
import MessagesArea from './messages/MessagesArea';
import ChatInput from './input/ChatInput';

interface ChatContainerProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

export default function ChatContainer({ userId, userEmail, userName, userRole }: ChatContainerProps) {
  const {
    initialize,
    currentAgentId,
    selectAgent,
    loading,
    agentCache,
    getAgentFromCache,
  } = useChatStore();
  
  const { conversations, loading: convsLoading } = useConversations(userId);
  const { loadAgentData } = useCoordinatedLoad();
  const messagesHook = useMessages(currentAgentId, userId);
  
  // Initialize store
  useEffect(() => {
    console.log('🚀 [CHAT V2] Initializing...');
    try {
      initialize(userId, userEmail, userName, userRole);
    } catch (error) {
      console.error('❌ [V2] Init failed:', error);
    }
  }, [userId]);
  
  // Load agent data when selection changes
  useEffect(() => {
    if (!currentAgentId) return;
    
    console.log('🔄 [V2] Loading agent:', currentAgentId);
    loadAgentData(currentAgentId);
  }, [currentAgentId]);
  
  const handleCreateAgent = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: `Nuevo Agente ${new Date().toLocaleString('es-CL')}`,
        }),
      });
      
      if (response.ok) {
        const newAgent = await response.json();
        selectAgent(newAgent.id);
        // Reload conversations to show new one
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };
  
  const agentData = currentAgentId ? getAgentFromCache(currentAgentId) : null;
  const currentAgent = conversations.find(c => c.id === currentAgentId);
  
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <ChatSidebar
          conversations={conversations}
          currentAgentId={currentAgentId}
          onSelectAgent={selectAgent}
          onCreateAgent={handleCreateAgent}
        />
      </div>
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1">
          <MessagesArea
            messages={messagesHook.messages}
            agentTitle={currentAgent?.title}
          />
        </div>
        
        {/* Input */}
        <ChatInput
          agentData={agentData}
          loading={loading}
          onSend={messagesHook.sendMessage}
          disabled={!currentAgentId}
        />
      </div>
    </div>
  );
}

