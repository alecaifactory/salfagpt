/**
 * Chat V2 - Zustand Store
 * Single source of truth for all chat state
 * 
 * Benefits:
 * - No prop drilling
 * - Minimal re-renders
 * - Persistence built-in
 * - Easy debugging
 * - Type-safe
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ===== TYPES =====

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  agentId?: string;
  isAgent?: boolean;
  status?: string;
  createdAt: Date;
  lastMessageAt: Date;
}

export interface AgentData {
  id: string; // ✅ ALWAYS usr_xxx format
  title: string;
  contextStats: {
    totalCount: number;
    activeCount: number;
  };
  sampleQuestions: string[];
  prompt: string;
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  loadedAt: number; // Timestamp
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: any[];
  isStreaming?: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  stage: 'context' | 'questions' | 'prompts' | 'complete';
  progress: number; // 0-100
  message: string;
}

// ===== STORE =====

interface ChatStore {
  // ===== USER =====
  userId: string; // ✅ ALWAYS usr_xxx format - validated on init
  userEmail: string;
  userName: string;
  userRole: string;
  
  // ===== CURRENT STATE =====
  currentAgentId: string | null;
  currentChatId: string | null;
  
  // ===== CACHED DATA =====
  agentCache: Map<string, AgentData>; // agentId → cached agent data
  messageCache: Map<string, Message[]>; // chatId → cached messages
  
  // ===== UI STATE =====
  ui: {
    sidebarWidth: number;
    expandedSections: Set<'agents' | 'folders' | 'historial'>;
    showContextBar: boolean;
    showSampleQuestions: boolean;
    showContextPanel: boolean;
  };
  
  // ===== LOADING STATE =====
  loading: LoadingState | null;
  
  // ===== ACTIONS =====
  
  // Initialize store with user data
  initialize: (userId: string, userEmail: string, userName: string, userRole: string) => void;
  
  // Agent selection
  selectAgent: (agentId: string) => void;
  selectChat: (chatId: string) => void;
  
  // Cache management
  updateAgentCache: (agentId: string, data: AgentData) => void;
  getAgentFromCache: (agentId: string) => AgentData | null;
  updateMessageCache: (chatId: string, messages: Message[]) => void;
  getMessagesFromCache: (chatId: string) => Message[] | null;
  
  // Loading state
  setLoading: (state: LoadingState | null) => void;
  
  // UI state
  toggleSection: (section: 'agents' | 'folders' | 'historial') => void;
  setSidebarWidth: (width: number) => void;
  setShowContextBar: (show: boolean) => void;
  setShowSampleQuestions: (show: boolean) => void;
  setShowContextPanel: (show: boolean) => void;
}

// ===== IMPLEMENTATION =====

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // ===== INITIAL STATE =====
      userId: '',
      userEmail: '',
      userName: '',
      userRole: '',
      currentAgentId: null,
      currentChatId: null,
      agentCache: new Map(),
      messageCache: new Map(),
      ui: {
        sidebarWidth: 320,
        expandedSections: new Set(['agents']), // Agents open by default
        showContextBar: false,
        showSampleQuestions: false,
        showContextPanel: false,
      },
      loading: null,
      
      // ===== ACTIONS =====
      
      initialize: (userId, userEmail, userName, userRole) => {
        // ✅ CRITICAL: Validate userId format
        if (!userId.startsWith('usr_')) {
          console.error('❌ [CHAT V2] Invalid userId format:', userId);
          console.error('   Chat V2 requires normalized userId (usr_xxx format)');
          throw new Error('ChatStore requires normalized userId (usr_xxx format)');
        }
        
        set({ userId, userEmail, userName, userRole });
        console.log('✅ [CHAT V2] Store initialized:', { userId, userEmail, userRole });
      },
      
      selectAgent: (agentId) => {
        console.log('📌 [CHAT V2] Agent selected:', agentId);
        set({ currentAgentId: agentId, currentChatId: null });
      },
      
      selectChat: (chatId) => {
        console.log('📌 [CHAT V2] Chat selected:', chatId);
        set({ currentChatId: chatId });
      },
      
      updateAgentCache: (agentId, data) => {
        const newCache = new Map(get().agentCache);
        newCache.set(agentId, data);
        set({ agentCache: newCache });
        console.log('💾 [CHAT V2] Agent cached:', agentId);
      },
      
      getAgentFromCache: (agentId) => {
        const cached = get().agentCache.get(agentId);
        if (cached) {
          const age = Date.now() - cached.loadedAt;
          if (age < 30000) { // 30 second TTL
            console.log('⚡ [CHAT V2] Using cached agent data (age:', Math.round(age/1000), 'seconds)');
            return cached;
          }
        }
        return null;
      },
      
      updateMessageCache: (chatId, messages) => {
        const newCache = new Map(get().messageCache);
        newCache.set(chatId, messages);
        set({ messageCache: newCache });
      },
      
      getMessagesFromCache: (chatId) => {
        return get().messageCache.get(chatId) || null;
      },
      
      setLoading: (state) => {
        set({ loading: state });
      },
      
      toggleSection: (section) => {
        const newSections = new Set(get().ui.expandedSections);
        if (newSections.has(section)) {
          newSections.delete(section);
        } else {
          newSections.add(section);
        }
        set((state) => ({
          ui: { ...state.ui, expandedSections: newSections }
        }));
      },
      
      setSidebarWidth: (width) => {
        set((state) => ({
          ui: { ...state.ui, sidebarWidth: width }
        }));
      },
      
      setShowContextBar: (show) => {
        set((state) => ({
          ui: { ...state.ui, showContextBar: show }
        }));
      },
      
      setShowSampleQuestions: (show) => {
        set((state) => ({
          ui: { ...state.ui, showSampleQuestions: show }
        }));
      },
      
      setShowContextPanel: (show) => {
        set((state) => ({
          ui: { ...state.ui, showContextPanel: show }
        }));
      },
    }),
    {
      name: 'chat-v2-store',
      partialize: (state) => ({
        ui: state.ui, // Only persist UI preferences
        // Don't persist: userId, agentId, chatId, caches (reload on mount)
      }),
    }
  )
);

