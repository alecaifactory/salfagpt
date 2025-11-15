/**
 * useConversations - Load and manage conversations
 */

import { useState, useEffect } from 'react';
import type { Conversation } from '../core/types';

export function useConversations(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!userId) return;
    
    loadConversations();
  }, [userId]);
  
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/conversations?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parse conversations from API response
      const allConversations = data.groups?.flatMap((g: any) => g.conversations || []) || [];
      
      // Convert dates
      const parsed = allConversations.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        lastMessageAt: new Date(c.lastMessageAt),
      }));
      
      setConversations(parsed);
      console.log('✅ [V2] Loaded', parsed.length, 'conversations');
      
    } catch (err) {
      console.error('❌ [V2] Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  return { conversations, loading, error, reload: loadConversations };
}

