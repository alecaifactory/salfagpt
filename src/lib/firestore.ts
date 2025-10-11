import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = import.meta.env.GOOGLE_CLOUD_PROJECT;

// Initialize Firestore client
export const firestore = new Firestore({
  projectId: PROJECT_ID,
});

// Collections
export const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  FOLDERS: 'folders',
  USER_CONTEXT: 'user_context',
} as const;

// Types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  contextWindowUsage: number; // Percentage 0-100
  agentModel: string; // e.g., "gemini-2.5-pro"
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  timestamp: Date;
  tokenCount: number;
  contextSections?: ContextSection[];
}

export interface MessageContent {
  type: 'text' | 'image' | 'video' | 'code' | 'audio' | 'mixed';
  text?: string;
  code?: {
    language: string;
    content: string;
  };
  mediaUrl?: string;
  mimeType?: string;
  parts?: Array<{
    type: string;
    content: string | object;
  }>;
}

export interface ContextSection {
  name: string; // e.g., "System Instructions", "Conversation History", "User Context"
  tokenCount: number;
  content: string;
  collapsed: boolean;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  conversationCount: number;
}

export interface UserContext {
  userId: string;
  contextItems: ContextItem[];
  totalTokens: number;
  updatedAt: Date;
}

export interface ContextItem {
  id: string;
  type: 'file' | 'url' | 'note' | 'document';
  name: string;
  content: string;
  tokenCount: number;
  addedAt: Date;
}

// Conversation Operations
export async function createConversation(
  userId: string,
  title: string = 'New Conversation',
  folderId?: string
): Promise<Conversation> {
  const conversationRef = firestore.collection(COLLECTIONS.CONVERSATIONS).doc();
  
  const conversation: Conversation = {
    id: conversationRef.id,
    userId,
    title,
    ...(folderId && { folderId }), // Only include folderId if it's defined
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
    messageCount: 0,
    contextWindowUsage: 0,
    agentModel: 'gemini-2.5-pro',
  };

  await conversationRef.set(conversation);
  return conversation;
}

export async function getConversations(
  userId: string,
  folderId?: string
): Promise<Conversation[]> {
  let query = firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .where('userId', '==', userId);

  if (folderId) {
    query = query.where('folderId', '==', folderId);
  }

  const snapshot = await query.orderBy('lastMessageAt', 'desc').get();
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    lastMessageAt: doc.data().lastMessageAt.toDate(),
  })) as Conversation[];
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const doc = await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;
  
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    lastMessageAt: data.lastMessageAt.toDate(),
  } as Conversation;
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<void> {
  await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .doc(conversationId)
    .update({
      ...updates,
      updatedAt: new Date(),
    });
}

export async function deleteConversation(conversationId: string): Promise<void> {
  // Delete all messages first
  const messages = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .where('conversationId', '==', conversationId)
    .get();

  const batch = firestore.batch();
  messages.docs.forEach(doc => batch.delete(doc.ref));
  
  // Delete the conversation
  batch.delete(firestore.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId));
  
  await batch.commit();
}

// Message Operations
export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: MessageContent,
  tokenCount: number,
  contextSections?: ContextSection[]
): Promise<Message> {
  const messageRef = firestore.collection(COLLECTIONS.MESSAGES).doc();
  
  const message: Message = {
    id: messageRef.id,
    conversationId,
    userId,
    role,
    content,
    timestamp: new Date(),
    tokenCount,
    contextSections,
  };

  await messageRef.set(message);

  // Update conversation
  const conversation = await getConversation(conversationId);
  if (conversation) {
    await updateConversation(conversationId, {
      lastMessageAt: new Date(),
      messageCount: conversation.messageCount + 1,
      updatedAt: new Date(),
    });
  }

  return message;
}

export async function getMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .where('conversationId', '==', conversationId)
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  })) as Message[];
}

// Folder Operations
export async function createFolder(userId: string, name: string): Promise<Folder> {
  const folderRef = firestore.collection(COLLECTIONS.FOLDERS).doc();
  
  const folder: Folder = {
    id: folderRef.id,
    userId,
    name,
    createdAt: new Date(),
    conversationCount: 0,
  };

  await folderRef.set(folder);
  return folder;
}

export async function getFolders(userId: string): Promise<Folder[]> {
  const snapshot = await firestore
    .collection(COLLECTIONS.FOLDERS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Folder[];
}

export async function updateFolder(folderId: string, name: string): Promise<void> {
  await firestore.collection(COLLECTIONS.FOLDERS).doc(folderId).update({ name });
}

export async function deleteFolder(folderId: string): Promise<void> {
  // Move conversations out of folder
  const conversations = await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .where('folderId', '==', folderId)
    .get();

  const batch = firestore.batch();
  conversations.docs.forEach(doc => {
    batch.update(doc.ref, { folderId: null });
  });

  // Delete the folder
  batch.delete(firestore.collection(COLLECTIONS.FOLDERS).doc(folderId));
  
  await batch.commit();
}

// User Context Operations
export async function getUserContext(userId: string): Promise<UserContext | null> {
  const doc = await firestore
    .collection(COLLECTIONS.USER_CONTEXT)
    .doc(userId)
    .get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;
  
  return {
    ...data,
    updatedAt: data.updatedAt.toDate(),
    contextItems: data.contextItems.map((item: any) => ({
      ...item,
      addedAt: item.addedAt.toDate(),
    })),
  } as UserContext;
}

export async function addContextItem(
  userId: string,
  item: Omit<ContextItem, 'id' | 'addedAt'>
): Promise<void> {
  const contextItemId = firestore.collection(COLLECTIONS.USER_CONTEXT).doc().id;
  
  const contextItem: ContextItem = {
    ...item,
    id: contextItemId,
    addedAt: new Date(),
  };

  const userContext = await getUserContext(userId);
  
  if (userContext) {
    const updatedItems = [...userContext.contextItems, contextItem];
    const totalTokens = updatedItems.reduce((sum, item) => sum + item.tokenCount, 0);
    
    await firestore.collection(COLLECTIONS.USER_CONTEXT).doc(userId).update({
      contextItems: updatedItems,
      totalTokens,
      updatedAt: new Date(),
    });
  } else {
    await firestore.collection(COLLECTIONS.USER_CONTEXT).doc(userId).set({
      userId,
      contextItems: [contextItem],
      totalTokens: contextItem.tokenCount,
      updatedAt: new Date(),
    });
  }
}

export async function removeContextItem(userId: string, itemId: string): Promise<void> {
  const userContext = await getUserContext(userId);
  
  if (!userContext) return;

  const updatedItems = userContext.contextItems.filter(item => item.id !== itemId);
  const totalTokens = updatedItems.reduce((sum, item) => sum + item.tokenCount, 0);

  await firestore.collection(COLLECTIONS.USER_CONTEXT).doc(userId).update({
    contextItems: updatedItems,
    totalTokens,
    updatedAt: new Date(),
  });
}

// Context Window Calculation
export async function calculateContextWindowUsage(
  conversationId: string,
  userId: string
): Promise<{ usage: number; sections: ContextSection[] }> {
  const MODEL_CONTEXT_WINDOW = 1000000; // Gemini 2.5-pro has 1M token context window
  
  // Get recent messages
  const messages = await getMessages(conversationId, 50);
  const messageTokens = messages.reduce((sum, msg) => sum + msg.tokenCount, 0);
  
  // Get user context
  const userContext = await getUserContext(userId);
  const contextTokens = userContext?.totalTokens || 0;
  
  // System instructions (estimated)
  const systemTokens = 500;
  
  // Calculate sections
  const sections: ContextSection[] = [
    {
      name: 'System Instructions',
      tokenCount: systemTokens,
      content: 'Agent configuration and system prompts',
      collapsed: true,
    },
    {
      name: 'Conversation History',
      tokenCount: messageTokens,
      content: `${messages.length} messages`,
      collapsed: false,
    },
    {
      name: 'User Context',
      tokenCount: contextTokens,
      content: `${userContext?.contextItems.length || 0} items`,
      collapsed: true,
    },
  ];
  
  const totalTokens = systemTokens + messageTokens + contextTokens;
  const usage = (totalTokens / MODEL_CONTEXT_WINDOW) * 100;
  
  // Update conversation with context window usage
  await updateConversation(conversationId, { contextWindowUsage: usage });
  
  return { usage, sections };
}

// Group conversations by time period
export function groupConversationsByTime(conversations: Conversation[]): {
  today: Conversation[];
  yesterday: Conversation[];
  lastWeek: Conversation[];
  lastMonth: Conversation[];
  older: Conversation[];
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return conversations.reduce((groups, conv) => {
    const convDate = new Date(conv.lastMessageAt);
    
    if (convDate >= today) {
      groups.today.push(conv);
    } else if (convDate >= yesterday) {
      groups.yesterday.push(conv);
    } else if (convDate >= lastWeek) {
      groups.lastWeek.push(conv);
    } else if (convDate >= lastMonth) {
      groups.lastMonth.push(conv);
    } else {
      groups.older.push(conv);
    }
    
    return groups;
  }, {
    today: [] as Conversation[],
    yesterday: [] as Conversation[],
    lastWeek: [] as Conversation[],
    lastMonth: [] as Conversation[],
    older: [] as Conversation[],
  });
}


