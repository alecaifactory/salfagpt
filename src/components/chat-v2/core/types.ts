/**
 * Chat V2 - Shared TypeScript Types
 */

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  agentId?: string;
  isAgent?: boolean;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount?: number;
  folderId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: Reference[];
  isStreaming?: boolean;
  thinkingSteps?: ThinkingStep[];
}

export interface Reference {
  id: number;
  sourceId: string;
  sourceName: string;
  snippet: string;
  similarity?: number;
  chunkIndex?: number;
}

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
  duration?: number;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

export interface ContextSource {
  id: string;
  userId: string;
  name: string;
  type: string;
  enabled: boolean;
  status: string;
  extractedData?: string;
  metadata?: any;
}

