/**
 * MessagesArea - Display messages with empty state
 */

import React, { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import type { Message } from '../core/types';
import MessageBubble from './MessageBubble';

interface MessagesAreaProps {
  messages: Message[];
  agentTitle?: string;
}

export default function MessagesArea({ messages, agentTitle }: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 px-6">
        <Bot className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
          {agentTitle ? `Conversación con ${agentTitle}` : 'Comienza una conversación'}
        </p>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400">
          Escribe un mensaje abajo para empezar a chatear
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto p-6">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

