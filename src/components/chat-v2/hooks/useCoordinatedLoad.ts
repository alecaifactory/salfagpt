/**
 * useCoordinatedLoad Hook
 * 
 * Orchestrates loading all agent data in parallel with progress tracking
 * - Prevents flickering (single atomic update)
 * - Shows progress to user
 * - Handles errors gracefully
 * - Cancels previous loads
 */

import { useRef } from 'react';
import { useChatStore } from '../core/ChatStore';
import type { AgentData } from '../core/ChatStore';
import { getAgentCode, getSampleQuestions } from '../core/sampleQuestions';

export function useCoordinatedLoad() {
  const { setLoading, updateAgentCache, getAgentFromCache } = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const loadAgentData = async (agentId: string): Promise<AgentData | null> => {
    try {
      // ✅ CACHE CHECK: Return cached data if available and fresh
      const cached = getAgentFromCache(agentId);
      if (cached) {
        console.log('⚡ [COORDINATED] Using cached agent data');
        return cached;
      }
      
      // ✅ CANCEL PREVIOUS: Abort any ongoing load
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 [COORDINATED] Cancelled previous load');
      }
      
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      console.log('🎬 [COORDINATED] Starting coordinated load for agent:', agentId);
      const startTime = Date.now();
      
      // STAGE 1: Context (0-33%)
      setLoading({
        isLoading: true,
        stage: 'context',
        progress: 0,
        message: 'Cargando contexto...'
      });
      
      // ✅ PARALLEL: Load all data simultaneously
      const [contextRes, promptRes] = await Promise.allSettled([
        fetch(`/api/agents/${agentId}/context-stats`, { signal })
          .then(r => r.ok ? r.json() : null),
        fetch(`/api/conversations/${agentId}/prompt`, { signal })
          .then(r => r.ok ? r.json() : null)
      ]);
      
      // Update progress
      setLoading({
        isLoading: true,
        stage: 'context',
        progress: 33,
        message: 'Contexto cargado'
      });
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // STAGE 2: Questions (33-66%)
      setLoading({
        isLoading: true,
        stage: 'questions',
        progress: 33,
        message: 'Cargando preguntas...'
      });
      
      // Parse results
      const contextData = contextRes.status === 'fulfilled' ? contextRes.value : null;
      const promptData = promptRes.status === 'fulfilled' ? promptRes.value : null;
      
      // Get sample questions (synchronous)
      // TODO: Get agent title to extract code
      const agentCode = null; // Will be set when we have agent title
      const sampleQuestions = getSampleQuestions(agentCode);
      
      setLoading({
        isLoading: true,
        stage: 'questions',
        progress: 66,
        message: 'Preguntas cargadas'
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // STAGE 3: Complete (66-100%)
      setLoading({
        isLoading: true,
        stage: 'prompts',
        progress: 66,
        message: 'Finalizando...'
      });
      
      // ✅ ATOMIC: Build complete agent data object
      const agentData: AgentData = {
        id: agentId,
        title: '', // TODO: Get from conversations list
        contextStats: {
          totalCount: contextData?.totalCount || 0,
          activeCount: contextData?.activeCount || 0,
        },
        sampleQuestions,
        prompt: promptData?.agentPrompt || '',
        model: promptData?.model || 'gemini-2.5-flash',
        loadedAt: Date.now(),
      };
      
      setLoading({
        isLoading: true,
        stage: 'complete',
        progress: 100,
        message: 'Completo'
      });
      
      // Update cache
      updateAgentCache(agentId, agentData);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ [COORDINATED] All data loaded in ${elapsed}ms`);
      console.log(`   - Context: ${agentData.contextStats.activeCount} fuentes`);
      console.log(`   - Questions: ${agentData.sampleQuestions.length} disponibles`);
      console.log(`   - Prompt: ${agentData.prompt.length} chars`);
      
      // Clear loading after short delay (smooth UX)
      setTimeout(() => {
        setLoading(null);
      }, 500);
      
      return agentData;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⏭️ [COORDINATED] Load cancelled (new agent selected)');
        return null;
      }
      
      console.error('❌ [COORDINATED] Load error:', error);
      setLoading(null);
      return null;
    }
  };
  
  return { loadAgentData };
}

