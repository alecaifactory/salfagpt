import { Firestore } from '@google-cloud/firestore';

// BACKWARD COMPATIBLE: Environment-aware Firestore initialization
// Supports multi-tenant deployments with separate GCP projects per environment

// Try to load environment config (if available)
let ENV_CONFIG: any = null;
try {
  // Dynamic import for environment config (may not exist in all deployments)
  const envModule = await import('../../config/environments.js').catch(() => null);
  if (envModule) {
    ENV_CONFIG = envModule.ENV_CONFIG;
  }
} catch (error) {
  // Fallback to original behavior if config doesn't exist
  console.log('📝 Using legacy environment configuration (backward compatible)');
}

// Determine project ID (BACKWARD COMPATIBLE)
// Priority: environment config > process.env > import.meta.env
const PROJECT_ID = ENV_CONFIG?.projectId 
  || process.env.GOOGLE_CLOUD_PROJECT 
  || (typeof import.meta !== 'undefined' && import.meta.env 
      ? import.meta.env.GOOGLE_CLOUD_PROJECT 
      : undefined);

if (!PROJECT_ID) {
  console.error('❌ GOOGLE_CLOUD_PROJECT is not set! Please configure your .env file.');
  console.error('💡 See ENV_VARIABLES_REFERENCE.md for setup instructions.');
}

const ENVIRONMENT_NAME = ENV_CONFIG?.name || process.env.ENVIRONMENT_NAME || 'local';

console.log('🔧 Initializing Firestore client...');
console.log(`📦 Project ID: ${PROJECT_ID || 'NOT SET'}`);
console.log(`🌍 Environment: ${ENVIRONMENT_NAME}`);
console.log(`🏗️  Node ENV: ${process.env.NODE_ENV || 'development'}`);

// Initialize Firestore client
// In production (Cloud Run): Uses Workload Identity automatically
// In local development: Uses Application Default Credentials (gcloud auth application-default login)
export const firestore = new Firestore({
  projectId: PROJECT_ID,
  // No need to specify keyFilename or credentials - ADC handles it automatically
});

console.log('✅ Firestore client initialized successfully');
console.log('💡 Local dev: Ensure you have run "gcloud auth application-default login"');
console.log('💡 Production: Uses Workload Identity automatically');

// Export environment info for debugging
export const CURRENT_ENVIRONMENT = ENVIRONMENT_NAME;
export const CURRENT_PROJECT_ID = PROJECT_ID;

// Helper function to determine source environment
export function getEnvironmentSource(): 'localhost' | 'production' {
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    // Browser context
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'localhost' 
      : 'production';
  }
  
  // Server context - check NODE_ENV and other indicators
  if (process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV === 'dev' ||
      !process.env.K_SERVICE) {  // K_SERVICE is set in Cloud Run
    return 'localhost';
  }
  
  return 'production';
}

// Collections
export const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  FOLDERS: 'folders',
  USER_CONTEXT: 'user_context',
  USERS: 'users',
  GROUPS: 'groups',
  CONTEXT_ACCESS_RULES: 'context_access_rules',
  CONTEXT_SOURCES: 'context_sources',
  USER_SETTINGS: 'user_settings',              // NEW: User global settings
  AGENT_CONFIGS: 'agent_configs',              // NEW: Per-agent configurations
  WORKFLOW_CONFIGS: 'workflow_configs',        // NEW: Workflow configurations
  CONVERSATION_CONTEXT: 'conversation_context', // NEW: Context state per conversation
  USAGE_LOGS: 'usage_logs',                    // NEW: Usage tracking
} as const;

// Types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  source?: 'localhost' | 'production'; // For analytics tracking
  lastMessageAt: Date;
  messageCount: number;
  contextWindowUsage: number; // Percentage 0-100
  agentModel: string; // e.g., "gemini-2.5-pro"
  activeContextSourceIds?: string[]; // IDs of active context sources for this conversation
  status?: 'active' | 'archived'; // Archive status (optional, defaults to 'active')
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
  source?: 'localhost' | 'production'; // For analytics tracking
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

// NEW: User Settings - Global preferences for each user
export interface UserSettings {
  userId: string;                              // Document ID
  preferredModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  systemPrompt: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  source?: 'localhost' | 'production';
}

// NEW: Agent Config - Configuration for each conversation/agent
export interface AgentConfig {
  id: string;                                  // Document ID
  conversationId: string;                      // Which conversation/agent this config belongs to
  userId: string;                              // Owner
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  systemPrompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  createdAt: Date;
  updatedAt: Date;
  source?: 'localhost' | 'production';
}

// NEW: Workflow Config - Configuration for workflows
export interface WorkflowConfig {
  id: string;                                  // Document ID (workflowId)
  userId: string;                              // Owner
  workflowType: string;                        // e.g., 'pdf-extraction', 'csv-import', etc.
  config: {
    maxFileSize?: number;                      // MB
    maxOutputLength?: number;                  // tokens
    language?: string;
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    [key: string]: any;                        // Additional workflow-specific config
  };
  createdAt: Date;
  updatedAt: Date;
  source?: 'localhost' | 'production';
}

// NEW: Conversation Context - Active context sources per conversation
export interface ConversationContext {
  id: string;                                  // Document ID (conversationId)
  conversationId: string;
  userId: string;
  activeContextSourceIds?: string[];           // IDs of enabled context sources (optional)
  contextWindowUsage?: number;                 // Percentage 0-100 (optional)
  lastUsedAt: Date;
  updatedAt: Date;
  source?: 'localhost' | 'production';
}

// NEW: Usage Log - Track usage of features
export interface UsageLog {
  id: string;                                  // Auto-generated
  userId: string;
  conversationId?: string;
  action: string;                              // e.g., 'message_sent', 'context_added', 'workflow_executed'
  details: {
    model?: string;
    tokensUsed?: number;
    contextSourcesUsed?: string[];
    workflowId?: string;
    [key: string]: any;
  };
  timestamp: Date;
  source?: 'localhost' | 'production';
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
    agentModel: 'gemini-2.5-flash',
    source: getEnvironmentSource(), // Track source for analytics
  };

  await conversationRef.set(conversation);
  console.log(`📝 Conversation created from ${conversation.source}:`, conversationRef.id);
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

// Archive conversation (soft delete - keeps data but hides from main view)
export async function archiveConversation(conversationId: string): Promise<void> {
  await updateConversation(conversationId, {
    status: 'archived',
  });
  console.log(`📦 Conversation archived: ${conversationId}`);
}

// Unarchive conversation (restore to active)
export async function unarchiveConversation(conversationId: string): Promise<void> {
  await updateConversation(conversationId, {
    status: 'active',
  });
  console.log(`📂 Conversation unarchived: ${conversationId}`);
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
    ...(contextSections !== undefined && { contextSections }), // Only include if defined
    source: getEnvironmentSource(), // Track source for analytics
  };

  await messageRef.set(message);
  console.log(`💬 Message created from ${message.source}:`, messageRef.id);

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

// ==================== USER MANAGEMENT ====================

import type { User, UserRole, UserPermissions } from '../types/users';
import { ROLE_PERMISSIONS } from '../types/users';

/**
 * Get merged permissions for multiple roles
 */
function getMergedPermissions(roles: UserRole[]): UserPermissions {
  const merged: Partial<UserPermissions> = {};
  roles.forEach(role => {
    const rolePerms = ROLE_PERMISSIONS[role] || {};
    Object.keys(rolePerms).forEach(key => {
      merged[key as keyof UserPermissions] = merged[key as keyof UserPermissions] || rolePerms[key as keyof UserPermissions] || false;
    });
  });
  return merged as UserPermissions;
}

/**
 * Create or update user on login (upsert)
 * Called automatically when user logs in via OAuth
 */
export async function upsertUserOnLogin(email: string, name: string, googleUserId?: string): Promise<User> {
  const userId = email.replace(/[@.]/g, '_');
  const now = new Date();
  
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      // User exists - update last login and userId if provided
      const updateData: any = {
        name, // Update name in case it changed
        lastLoginAt: now,
        updatedAt: now,
      };
      
      // Store numeric userId for mapping context sources
      if (googleUserId) {
        updateData.userId = googleUserId;
      }
      
      await firestore.collection('users').doc(userId).update(updateData);
      
      console.log('✅ User login updated:', email);
      
      const data = userDoc.data();
      return {
        id: userId,
        email: data!.email,
        name,
        role: data!.role || 'user',
        roles: data!.roles || [data!.role || 'user'],
        company: data!.company || extractCompany(email),
        department: data!.department,
        permissions: data!.permissions || getMergedPermissions(['user']),
        createdAt: data!.createdAt?.toDate?.() || now,
        updatedAt: now,
        lastLoginAt: now,
        isActive: data!.isActive ?? true,
        createdBy: data!.createdBy,
      };
    } else {
      // User doesn't exist - create new
      const company = extractCompany(email);
      const initialRoles = getInitialRoles(email);
      const newUser = {
        id: userId,
        email,
        name,
        userId: googleUserId, // Store Google OAuth numeric ID for mapping
        role: initialRoles[0] as UserRole, // Primary role
        roles: initialRoles,
        company,
        department: undefined,
        permissions: getMergedPermissions(initialRoles),
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        isActive: true,
        createdBy: 'oauth-system',
      };
      
      await firestore.collection('users').doc(userId).set({
        ...newUser,
        userId: googleUserId, // Store numeric ID
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
      
      console.log(`✅ New user created: ${email} with roles: ${initialRoles.join(', ')}`);
      
      return newUser;
    }
  } catch (error) {
    console.error('❌ Error upserting user:', error);
    throw error;
  }
}

/**
 * Extract company from email domain
 */
function extractCompany(email: string): string {
  const domain = email.split('@')[1];
  
  // Map known domains to company names
  const domainMap: Record<string, string> = {
    'getaifactory.com': 'GetAI Factory',
    'salfacorp.com': 'Salfa Corp',
    'salfagestion.cl': 'Salfa Gestión',
  };
  
  return domainMap[domain] || domain;
}

/**
 * Determine initial roles for new user based on email
 */
function getInitialRoles(email: string): UserRole[] {
  // SuperAdmin users (hardcoded list)
  const superAdmins = [
    'alec@getaifactory.com',
    'admin@getaifactory.com',
  ];
  
  if (superAdmins.includes(email.toLowerCase())) {
    return ['admin', 'expert', 'context_signoff', 'agent_signoff'];
  }
  
  // Default role for new users
  return ['user'];
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  name: string,
  roles: UserRole[], // Support multiple roles
  company: string,
  createdBy?: string, // Email of creator
  department?: string
): Promise<User> {
  const now = new Date();
  const userId = email.replace(/[@.]/g, '_');
  
  const newUser: Omit<User, 'id'> = {
    email,
    name,
    role: roles[0] || 'user', // Primary role for backward compatibility
    roles, // NEW: Multiple roles support
    permissions: getMergedPermissions(roles),
    company,
    createdBy, // NEW: Track who created this user
    department,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    agentAccessCount: 0, // Will be updated when access granted
    contextAccessCount: 0, // Will be updated when access granted
  };

  // 🔧 Filter out undefined values for Firestore compatibility
  const firestoreData: any = {
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    roles: newUser.roles,
    permissions: newUser.permissions,
    company: newUser.company,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    isActive: newUser.isActive,
    agentAccessCount: newUser.agentAccessCount,
    contextAccessCount: newUser.contextAccessCount,
  };

  // Only add optional fields if they have values
  if (createdBy) {
    firestoreData.createdBy = createdBy;
  }
  if (department) {
    firestoreData.department = department;
  }

  await firestore.collection(COLLECTIONS.USERS).doc(userId).set(firestoreData);

  return {
    id: userId,
    ...newUser,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = email.replace(/[@.]/g, '_');
  const doc = await firestore.collection(COLLECTIONS.USERS).doc(userId).get();
  
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    email: data.email,
    name: data.name,
    role: data.role,
    roles: data.roles || [data.role], // Backward compat: default to single role array
    permissions: data.permissions,
    company: data.company,
    createdBy: data.createdBy,
    department: data.department,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
    isActive: data.isActive,
    avatarUrl: data.avatarUrl,
    agentAccessCount: data.agentAccessCount,
    contextAccessCount: data.contextAccessCount,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const doc = await firestore.collection(COLLECTIONS.USERS).doc(userId).get();
  
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (!data) return null;

  return {
    id: doc.id,
    email: data.email,
    name: data.name,
    role: data.role,
    roles: data.roles || [data.role], // Backward compat: default to single role array
    permissions: data.permissions,
    company: data.company,
    createdBy: data.createdBy,
    department: data.department,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
    isActive: data.isActive,
    avatarUrl: data.avatarUrl,
    agentAccessCount: data.agentAccessCount,
    contextAccessCount: data.contextAccessCount,
  };
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const snapshot = await firestore.collection(COLLECTIONS.USERS).get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      name: data.name,
      role: data.role,
      roles: data.roles || [data.role], // Backward compat: default to single role array
      permissions: data.permissions,
      company: data.company,
      createdBy: data.createdBy,
      department: data.department,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      isActive: data.isActive,
      avatarUrl: data.avatarUrl,
      agentAccessCount: data.agentAccessCount,
      contextAccessCount: data.contextAccessCount,
    };
  });
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  const updateData: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Convert dates to ISO strings
  if (updates.lastLoginAt) {
    updateData.lastLoginAt = updates.lastLoginAt.toISOString();
  }

  await firestore.collection(COLLECTIONS.USERS).doc(userId).update(updateData);
}

/**
 * Update user role (single role - backward compatible)
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  await firestore.collection(COLLECTIONS.USERS).doc(userId).update({
    role,
    roles: [role], // Update roles array too
    permissions: getMergedPermissions([role]),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update user roles (multiple roles - NEW)
 */
export async function updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
  await firestore.collection(COLLECTIONS.USERS).doc(userId).update({
    role: roles[0] || 'user', // Primary role
    roles, // All roles
    permissions: getMergedPermissions(roles),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Create multiple users in bulk
 */
export async function createUsersBulk(
  users: Array<{
    email: string;
    name: string;
    roles: UserRole[];
    company: string;
    department?: string;
  }>,
  createdBy: string
): Promise<{ created: User[]; errors: Array<{ email: string; error: string }> }> {
  const created: User[] = [];
  const errors: Array<{ email: string; error: string }> = [];

  for (const userData of users) {
    try {
      const user = await createUser(
        userData.email,
        userData.name,
        userData.roles,
        userData.company,
        createdBy,
        userData.department
      );
      created.push(user);
    } catch (error) {
      errors.push({
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { created, errors };
}

/**
 * Activate/deactivate user
 */
export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await firestore.collection(COLLECTIONS.USERS).doc(userId).update({
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  await firestore.collection(COLLECTIONS.USERS).doc(userId).delete();
}

/**
 * Update last login time
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await firestore.collection(COLLECTIONS.USERS).doc(userId).update({
    lastLoginAt: new Date().toISOString(),
  });
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === 'admin' || false;
}

/**
 * Save active context sources for a conversation
 */
export async function saveConversationContext(
  conversationId: string,
  activeContextSourceIds: string[]
): Promise<void> {
  // Skip for temporary conversations
  if (conversationId.startsWith('temp-')) {
    console.log('⏭️ Skipping context save for temporary conversation');
    return;
  }

  try {
    await updateConversation(conversationId, {
      activeContextSourceIds,
    });
    console.log('💾 Saved context for conversation:', conversationId, activeContextSourceIds);
  } catch (error) {
    console.error('Error saving conversation context:', error);
    throw error;
  }
}

/**
 * Load active context sources for a conversation
 */
export async function loadConversationContext(
  conversationId: string
): Promise<string[]> {
  // Return empty array for temporary conversations
  if (conversationId.startsWith('temp-')) {
    return [];
  }

  try {
    const conversation = await getConversation(conversationId);
    return conversation?.activeContextSourceIds || [];
  } catch (error) {
    console.error('Error loading conversation context:', error);
    return [];
  }
}

// ===== NEW: USER SETTINGS OPERATIONS =====

/**
 * Get user settings (global preferences)
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.USER_SETTINGS)
      .doc(userId)
      .get();

    if (!doc.exists) {
      console.log('📭 No user settings found for:', userId);
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as UserSettings;
  } catch (error) {
    console.error('❌ Error getting user settings:', error);
    return null;
  }
}

/**
 * Save user settings (global preferences)
 */
export async function saveUserSettings(
  userId: string,
  settings: Omit<UserSettings, 'userId' | 'createdAt' | 'updatedAt' | 'source'>
): Promise<UserSettings> {
  const now = new Date();
  const source = getEnvironmentSource();

  // Check if settings already exist
  const existing = await getUserSettings(userId);

  const userSettings: UserSettings = {
    userId,
    ...settings,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source,
  };

  await firestore
    .collection(COLLECTIONS.USER_SETTINGS)
    .doc(userId)
    .set(userSettings);

  console.log(`✅ User settings saved from ${source}:`, userId);
  return userSettings;
}

// ===== NEW: AGENT CONFIG OPERATIONS =====

/**
 * Get agent config for a specific conversation
 */
export async function getAgentConfig(conversationId: string): Promise<AgentConfig | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.AGENT_CONFIGS)
      .doc(conversationId)
      .get();

    if (!doc.exists) {
      console.log('📭 No agent config found for conversation:', conversationId);
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as AgentConfig;
  } catch (error) {
    console.error('❌ Error getting agent config:', error);
    return null;
  }
}

/**
 * Save agent config for a specific conversation
 */
export async function saveAgentConfig(
  conversationId: string,
  userId: string,
  config: Omit<AgentConfig, 'id' | 'conversationId' | 'userId' | 'createdAt' | 'updatedAt' | 'source'>
): Promise<AgentConfig> {
  const now = new Date();
  const source = getEnvironmentSource();

  // Check if config already exists
  const existing = await getAgentConfig(conversationId);

  const agentConfig: AgentConfig = {
    id: conversationId,
    conversationId,
    userId,
    ...config,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source,
  };

  await firestore
    .collection(COLLECTIONS.AGENT_CONFIGS)
    .doc(conversationId)
    .set(agentConfig);

  console.log(`✅ Agent config saved from ${source}:`, conversationId);
  return agentConfig;
}

// ===== NEW: WORKFLOW CONFIG OPERATIONS =====

/**
 * Get workflow config by ID
 */
export async function getWorkflowConfig(workflowId: string, userId: string): Promise<WorkflowConfig | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.WORKFLOW_CONFIGS)
      .doc(`${userId}_${workflowId}`)
      .get();

    if (!doc.exists) {
      console.log('📭 No workflow config found for:', workflowId);
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as WorkflowConfig;
  } catch (error) {
    console.error('❌ Error getting workflow config:', error);
    return null;
  }
}

/**
 * Save workflow config
 */
export async function saveWorkflowConfig(
  workflowId: string,
  userId: string,
  config: Omit<WorkflowConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'source'>
): Promise<WorkflowConfig> {
  const now = new Date();
  const source = getEnvironmentSource();
  const docId = `${userId}_${workflowId}`;

  // Check if config already exists
  const existing = await getWorkflowConfig(workflowId, userId);

  const workflowConfig: WorkflowConfig = {
    id: workflowId,
    userId,
    ...config,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source,
  };

  await firestore
    .collection(COLLECTIONS.WORKFLOW_CONFIGS)
    .doc(docId)
    .set(workflowConfig);

  console.log(`✅ Workflow config saved from ${source}:`, workflowId);
  return workflowConfig;
}

/**
 * Get all workflow configs for a user
 */
export async function getUserWorkflowConfigs(userId: string): Promise<WorkflowConfig[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.WORKFLOW_CONFIGS)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as WorkflowConfig[];
  } catch (error) {
    console.error('❌ Error getting workflow configs:', error);
    return [];
  }
}

// ===== NEW: CONVERSATION CONTEXT OPERATIONS =====

/**
 * Get conversation context (active sources, usage)
 */
export async function getConversationContext(conversationId: string): Promise<ConversationContext | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.CONVERSATION_CONTEXT)
      .doc(conversationId)
      .get();

    if (!doc.exists) {
      console.log('📭 No conversation context found for:', conversationId);
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    return {
      ...data,
      lastUsedAt: data.lastUsedAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as ConversationContext;
  } catch (error) {
    console.error('❌ Error getting conversation context:', error);
    return null;
  }
}

/**
 * Save conversation context (active sources, usage)
 */
export async function saveConversationContextState(
  conversationId: string,
  data: {
    conversationId: string;
    userId: string;
    activeContextSourceIds?: string[];
    contextWindowUsage?: number;
  }
): Promise<ConversationContext> {
  const now = new Date();
  const source = getEnvironmentSource();

  const conversationContext: ConversationContext = {
    id: conversationId,
    conversationId: data.conversationId,
    userId: data.userId,
    ...(data.activeContextSourceIds !== undefined && { activeContextSourceIds: data.activeContextSourceIds }), // Only include if defined
    ...(data.contextWindowUsage !== undefined && { contextWindowUsage: data.contextWindowUsage }), // Only include if defined
    lastUsedAt: now,
    updatedAt: now,
    source,
  };

  await firestore
    .collection(COLLECTIONS.CONVERSATION_CONTEXT)
    .doc(conversationId)
    .set(conversationContext);

  console.log(`✅ Conversation context saved from ${source}:`, conversationId);
  return conversationContext;
}

// ===== NEW: USAGE LOG OPERATIONS =====

/**
 * Log usage event
 */
export async function logUsage(
  userId: string,
  action: string,
  details: UsageLog['details'],
  conversationId?: string
): Promise<void> {
  const now = new Date();
  const source = getEnvironmentSource();

  const usageLog: UsageLog = {
    id: firestore.collection(COLLECTIONS.USAGE_LOGS).doc().id,
    userId,
    ...(conversationId !== undefined && { conversationId }), // Only include if defined
    action,
    details,
    timestamp: now,
    source,
  };

  await firestore
    .collection(COLLECTIONS.USAGE_LOGS)
    .add(usageLog);

  console.log(`📊 Usage logged from ${source}:`, action);
}

/**
 * Get usage logs for a user
 */
export async function getUserUsageLogs(
  userId: string,
  limit: number = 100
): Promise<UsageLog[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.USAGE_LOGS)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as UsageLog[];
  } catch (error) {
    console.error('❌ Error getting usage logs:', error);
    return [];
  }
}

// ===== CONTEXT SOURCES OPERATIONS =====

export interface ContextSource {
  id: string;
  userId: string;
  name: string;
  type: 'pdf' | 'csv' | 'excel' | 'word' | 'web-url' | 'api' | 'folder';
  enabled: boolean; // Global enabled state (used in UI, not for filtering)
  status: 'active' | 'processing' | 'error' | 'disabled';
  addedAt: Date;
  extractedData?: string;
  assignedToAgents?: string[]; // NEW: List of conversation IDs that can access this source
  
  // Labels and qualification (for expert review)
  labels?: string[]; // User-defined labels (e.g., "CV", "Contrato", "Manual")
  qualityRating?: number; // 1-5 stars
  qualityNotes?: string; // Expert notes on quality
  
  // Expert certification
  certified?: boolean; // Expert has certified this extraction
  certifiedBy?: string; // Email or userId of certifier
  certifiedAt?: Date; // When it was certified
  certificationNotes?: string; // Notes from certifier
  
  metadata?: {
    originalFileName?: string;
    originalFileSize?: number;
    workflowId?: string;
    extractionDate?: Date;
    extractionTime?: number;
    model?: string;
    charactersExtracted?: number;
    tokensEstimate?: number;
    pageCount?: number;
    validated?: boolean;
    validatedBy?: string;
    validatedAt?: Date;
    
    // Token usage (actual from API)
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    
    // Cost breakdown (from official pricing)
    inputCost?: number;
    outputCost?: number;
    totalCost?: number;
    costFormatted?: string;
  };
  error?: {
    message: string;
    details?: string;
    timestamp: Date;
    suggestions?: string[];
  };
  progress?: {
    stage: 'uploading' | 'processing' | 'complete' | 'error';
    percentage: number;
    message: string;
  };
  source?: 'localhost' | 'production';
}

/**
 * Create a context source
 */
export async function createContextSource(
  userId: string,
  data: Partial<ContextSource>
): Promise<ContextSource> {
  const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc();
  
  const contextSource: any = {
    id: sourceRef.id,
    userId,
    name: data.name || 'Unnamed Source',
    type: data.type || 'pdf',
    enabled: data.enabled !== undefined ? data.enabled : true,
    status: data.status || 'active',
    addedAt: new Date(),
    source: getEnvironmentSource(),
  };

  // Only add optional fields if they are defined
  if (data.extractedData !== undefined) {
    contextSource.extractedData = data.extractedData;
  }
  if (data.metadata !== undefined) {
    contextSource.metadata = data.metadata;
  }
  if (data.error !== undefined) {
    contextSource.error = data.error;
  }
  if (data.progress !== undefined) {
    contextSource.progress = data.progress;
  }
  if (data.assignedToAgents !== undefined) {
    contextSource.assignedToAgents = data.assignedToAgents;
  }
  
  // Labels and qualification
  if (data.labels !== undefined) {
    contextSource.labels = data.labels;
  }
  if (data.qualityRating !== undefined) {
    contextSource.qualityRating = data.qualityRating;
  }
  if (data.qualityNotes !== undefined) {
    contextSource.qualityNotes = data.qualityNotes;
  }
  
  // Expert certification
  if (data.certified !== undefined) {
    contextSource.certified = data.certified;
  }
  if (data.certifiedBy !== undefined) {
    contextSource.certifiedBy = data.certifiedBy;
  }
  if (data.certifiedAt !== undefined) {
    contextSource.certifiedAt = data.certifiedAt;
  }
  if (data.certificationNotes !== undefined) {
    contextSource.certificationNotes = data.certificationNotes;
  }

  await sourceRef.set(contextSource);
  console.log(`📄 Context source created from ${contextSource.source}:`, sourceRef.id);
  return contextSource as ContextSource;
}

/**
 * Get all context sources for a user
 */
export async function getContextSource(sourceId: string): Promise<ContextSource | null> {
  try {
    const doc = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .doc(sourceId)
      .get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      addedAt: data?.addedAt?.toDate() || new Date(),
      metadata: data?.metadata ? {
        ...data.metadata,
        extractionDate: data.metadata.extractionDate?.toDate(),
        validatedAt: data.metadata.validatedAt?.toDate(),
      } : undefined,
      certified: data?.certified || false,
      certifiedAt: data?.certifiedAt?.toDate(),
      progress: data?.progress,
      error: data?.error ? {
        ...data.error,
        timestamp: data.error.timestamp?.toDate() || new Date(),
      } : undefined,
      ragMetadata: data?.ragMetadata ? {
        ...data.ragMetadata,
        indexedAt: data.ragMetadata.indexedAt?.toDate(),
      } : undefined,
    } as ContextSource;
  } catch (error) {
    console.error('❌ Error getting context source:', error);
    return null;
  }
}

export async function getContextSources(userId: string): Promise<ContextSource[]> {
  try {
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', userId)
      .orderBy('addedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
      } as ContextSource;
    });
  } catch (error) {
    console.error('❌ Error fetching context sources:', error);
    return [];
  }
}

/**
 * Update a context source
 */
export async function updateContextSource(
  sourceId: string,
  updates: Partial<ContextSource>
): Promise<void> {
  // Filter out undefined values
  const filteredUpdates: any = {};
  Object.keys(updates).forEach(key => {
    const value = (updates as any)[key];
    if (value !== undefined) {
      filteredUpdates[key] = value;
    }
  });

  await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .doc(sourceId)
    .update(filteredUpdates);
  
  console.log(`📝 Context source updated:`, sourceId);
}

/**
 * Remove an agent from a context source's assignedToAgents array
 * If no agents remain, delete the source entirely
 */
export async function removeAgentFromContextSource(
  sourceId: string,
  agentId: string
): Promise<{ deleted: boolean; remainingAgents: number }> {
  try {
    const sourceRef = firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .doc(sourceId);
    
    const sourceDoc = await sourceRef.get();
    
    if (!sourceDoc.exists) {
      console.warn(`⚠️ Context source not found: ${sourceId}`);
      return { deleted: false, remainingAgents: 0 };
    }
    
    const sourceData = sourceDoc.data() as ContextSource;
    const currentAgents = sourceData.assignedToAgents || [];
    
    // Remove this agent from the array
    const updatedAgents = currentAgents.filter(id => id !== agentId);
    
    console.log(`📝 Removing agent ${agentId} from source ${sourceId}:`, {
      before: currentAgents.length,
      after: updatedAgents.length,
    });
    
    // If no agents remain, delete the source entirely
    if (updatedAgents.length === 0 && currentAgents.length > 0) {
      await sourceRef.delete();
      console.log(`🗑️ Context source deleted (no agents remain): ${sourceId}`);
      return { deleted: true, remainingAgents: 0 };
    }
    
    // Otherwise, update the assignedToAgents array
    await sourceRef.update({
      assignedToAgents: updatedAgents,
    });
    
    console.log(`✅ Agent removed from context source: ${sourceId}, ${updatedAgents.length} agents remain`);
    return { deleted: false, remainingAgents: updatedAgents.length };
    
  } catch (error) {
    console.error('❌ Error removing agent from context source:', error);
    throw error;
  }
}

/**
 * Delete a context source completely (admin/owner only)
 */
export async function deleteContextSource(sourceId: string): Promise<void> {
  await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .doc(sourceId)
    .delete();
  
  console.log(`🗑️ Context source deleted:`, sourceId);
}


