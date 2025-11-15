/**
 * useMessages - Load and send messages
 */

import { useState, useEffect } from 'react';
import type { Message } from '../core/types';

export function useMessages(conversationId: string | null, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    loadMessages();
  }, [conversationId]);
  
  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      
      if (!response.ok) {
        console.warn('Could not load messages');
        return;
      }
      
      const data = await response.json();
      const msgs = (data.messages || []).map((m: any) => ({
        ...m,
        // ✅ FIX: Transform MessageContent object to string
        content: typeof m.content === 'string' 
          ? m.content 
          : m.content?.text || JSON.stringify(m.content),
        timestamp: new Date(m.timestamp),
      }));
      
      setMessages(msgs);
      console.log('✅ [V2] Loaded', msgs.length, 'messages');
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return;
    
    try {
      // Optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Send to API
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: content,
          model: 'gemini-2.5-flash',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send');
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      const streamingId = `streaming-${Date.now()}`;
      
      // Add streaming message
      const streamingMessage: Message = {
        id: streamingId,
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      
      setMessages(prev => [...prev, streamingMessage]);
      
      // Stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'chunk') {
              accumulatedContent += data.content;
              setMessages(prev => prev.map(m =>
                m.id === streamingId
                  ? { ...m, content: accumulatedContent }
                  : m
              ));
            } else if (data.type === 'complete') {
              setMessages(prev => prev.map(m =>
                m.id === streamingId
                  ? { ...m, isStreaming: false, id: data.messageId || streamingId }
                  : m
              ));
            }
          } catch (err) {
            // Ignore parse errors
          }
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    }
  };
  
  return { messages, loading, sendMessage, reload: loadMessages };
}

