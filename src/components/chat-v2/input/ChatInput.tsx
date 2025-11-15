/**
 * ChatInput - Input area with send functionality
 */

import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import type { AgentData, LoadingState } from '../core/ChatStore';

interface ChatInputProps {
  agentData: AgentData | null;
  loading: LoadingState | null;
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ agentData, loading, onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleSend = async () => {
    if (!input.trim() || sending || disabled) return;
    
    setSending(true);
    try {
      await onSend(input);
      setInput(''); // Clear input after send
    } catch (error) {
      console.error('Error sending:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Loading Progress */}
        {loading?.isLoading && (
          <div className="mb-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {loading.message}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {loading.progress}%
              </span>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-900 rounded-full h-1.5">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${loading.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Context Info (collapsed by default) */}
        {!loading?.isLoading && agentData && (
          <div className="mb-2 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-600 dark:text-slate-400">
                {agentData.contextStats.activeCount} fuentes
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-400">
                {agentData.model === 'gemini-2.5-pro' ? 'Pro' : 'Flash'}
              </span>
            </div>
          </div>
        )}
        
        {/* Input Field */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje... (Shift+Enter para nueva línea)"
            rows={3}
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm resize-none"
            disabled={disabled || sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium self-end"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm">Enviar</span>
          </button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
          SalfaGPT puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}

