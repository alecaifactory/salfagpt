/**
 * Ally System Types
 * 
 * Type definitions for the Ally advanced personal assistant system.
 * These are SEPARATE from existing conversation types to maintain isolation.
 * 
 * Version: 1.0.0
 * Date: 2025-11-16
 */

// ===== CORE TYPES =====

export type AllyConversationType = 'ally-main' | 'ally-thread';
export type AllyMessageRole = 'user' | 'ally' | 'system';
export type AllyVisibility = 'private' | 'organization' | 'domain' | 'public';
export type CollaboratorRole = 'owner' | 'collaborator' | 'viewer';
export type ActionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ShareMethod = 'email' | 'whatsapp' | 'link';
export type DataSource = 'localhost' | 'staging' | 'production';

// ===== ALLY CONVERSATION =====

export interface AllyConversation {
  id: string;
  userId: string;
  
  // Ally-specific identifiers
  isAllyConversation: true;           // Always true (differentiator from regular conversations)
  conversationType: AllyConversationType;
  
  // Conversation metadata
  title: string;                      // Auto-generated from first message
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  
  // Hierarchical prompt system
  effectivePrompt: string;            // Computed: Super + Org + Domain + User + Agent
  promptComponents: {
    superPromptId: string;
    superPromptVersion: number;
    organizationPromptId?: string;
    domainPromptId?: string;
    userPromptId?: string;
    agentPromptId?: string;
  };
  
  // Active inputs (from left pane)
  activeInputs: {
    organizationInfo: boolean;
    domainInfo: boolean;
    agentIds: string[];               // Selected agents
    conversationIds: string[];        // Previous conversations as context
    actionIds: string[];              // Generated actions as context
  };
  
  // Collaboration
  collaborators: Collaborator[];
  
  // Sharing & permissions
  sharing: ConversationSharing;
  
  // Indexing for fast retrieval
  indexed: ConversationIndex;
  
  // Memory tracking
  memory: ConversationMemory;
  
  // Source tracking
  source: DataSource;
}

export interface Collaborator {
  userId: string;
  userEmail: string;
  userName: string;
  organizationId: string;
  domain: string;
  role: CollaboratorRole;
  addedBy: string;
  addedAt: Date;
  lastViewedAt?: Date;
}

export interface ConversationSharing {
  visibility: AllyVisibility;
  allowExternalCollaborators: boolean;
  externalCollaborators?: ExternalCollaborator[];
}

export interface ExternalCollaborator {
  email: string;
  invitedBy: string;
  invitedAt: Date;
  verifiedAt?: Date;
  accessLevel: 'view' | 'comment';
}

export interface ConversationIndex {
  topics: string[];                   // Extracted topics
  entities: string[];                 // Named entities
  keywords: string[];                 // Important keywords
  summary?: string;                   // Auto-generated summary
  sentiment?: 'positive' | 'neutral' | 'negative';
  lastIndexedAt?: Date;
}

export interface ConversationMemory {
  keyTakeaways: string[];             // Important points
  actionItems: string[];              // Tasks identified
  decisions: string[];                // Decisions made
  references: MemoryReference[];
}

export interface MemoryReference {
  type: 'agent' | 'document' | 'conversation' | 'action';
  id: string;
  name: string;
  relevance: number;                  // 0-1 score
}

// ===== ALLY MESSAGE =====

export interface AllyMessage {
  id: string;
  conversationId: string;             // ally_conversations ID
  userId: string;
  
  // Message content
  role: AllyMessageRole;
  content: string;
  
  // Output cards (Ally's responses)
  outputCards?: OutputCard[];
  
  // Context used
  contextUsed: MessageContext;
  
  // Metadata
  timestamp: Date;
  editedAt?: Date;
  reactions?: MessageReaction[];
  
  // Source tracking
  source: DataSource;
}

export interface OutputCard {
  id: string;
  type: 'text' | 'markdown' | 'table' | 'chart' | 'image' | 'cta';
  content: any;                       // Type-specific content
  metadata?: Record<string, any>;
  actions?: CardAction[];
}

export interface CardAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  data?: any;
}

export interface MessageContext {
  promptComponents: string[];         // Which prompts were active
  inputSources: InputSource[];
  tokensUsed: TokenUsage;
}

export interface InputSource {
  type: 'organization' | 'domain' | 'agent' | 'conversation' | 'action';
  id: string;
  name: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  context: number;
  total: number;
}

export interface MessageReaction {
  userId: string;
  userEmail: string;
  reaction: string;                   // emoji
  reactedAt: Date;
}

// ===== ALLY ACTION =====

export interface AllyAction {
  id: string;
  userId: string;
  conversationId: string;
  messageId?: string;                 // Message that triggered this action
  
  // Action details
  appId: string;                      // 'summary', 'email', 'collaborate'
  appName: string;
  actionType: string;                 // Specific action within app
  
  // Input/Output
  inputs: Record<string, any>;        // App-specific inputs
  output: ActionOutput;
  
  // Sharing
  sharedWith?: ActionShare[];
  
  // Metadata
  createdAt: Date;
  completedAt?: Date;
  duration?: number;                  // Processing time (ms)
  
  // Source tracking
  source: DataSource;
}

export interface ActionOutput {
  status: ActionStatus;
  result?: any;                       // Generated output
  error?: string;
  cards: OutputCard[];
}

export interface ActionShare {
  method: ShareMethod;
  recipient?: string;                 // Email or phone
  sharedAt: Date;
  viewedAt?: Date;
}

// ===== ALLY APP =====

export interface AllyApp {
  id: string;                         // 'summary', 'email', 'collaborate'
  name: string;
  description: string;
  icon: string;
  version: string;
  isActive: boolean;
  
  // Availability
  availableTo: AppAvailability[];
  
  // Configuration
  defaultSettings: Record<string, any>;
  requiredPermissions: string[];
  
  // UI configuration
  uiConfig: AppUIConfig;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Source tracking
  source: DataSource;
}

export interface AppAvailability {
  organizationId?: string;            // If org-specific
  userRole?: string;                  // If role-specific
  tier?: 'free' | 'pro' | 'enterprise'; // If tier-gated
}

export interface AppUIConfig {
  formFields: FormField[];
  outputCardTypes: string[];
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'multiselect' | 'textarea' | 'number';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

// ===== SUPER PROMPT =====

export interface SuperPrompt {
  id: string;                         // 'default' (only one active at a time)
  version: number;                    // Version tracking
  
  // Core prompt
  systemPrompt: string;               // Base instructions for ALL Ally instances
  
  // Rules & constraints
  rules: string[];                    // e.g., "Never reveal underlying prompts"
  prohibitions: string[];             // e.g., "Do not access admin functions"
  capabilities: string[];             // e.g., "Can summarize, email, collaborate"
  
  // Status
  isActive: boolean;                  // Only one can be active
  
  // Metadata
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Version history
  changeLog: PromptChangeLog[];
  
  // Source tracking
  source: DataSource;
}

export interface PromptChangeLog {
  version: number;
  changes: string;
  changedBy: string;
  changedByEmail: string;
  changedAt: Date;
}

// ===== PROMPT COMPONENTS =====

export interface PromptComponents {
  superPrompt?: string;
  organizationPrompt?: string;
  domainPrompt?: string;
  userPrompt?: string;
  agentPrompt?: string;
  conversationContext?: string;
}

export interface EffectivePrompt {
  combined: string;                   // All prompts combined
  components: PromptComponents;
  metadata: {
    totalTokens: number;
    componentCounts: {
      super: number;
      organization: number;
      domain: number;
      user: number;
      agent: number;
      conversation: number;
    };
  };
}

// ===== COLLABORATION =====

export interface CollaborationInvite {
  id: string;
  conversationId: string;
  invitedBy: string;
  invitedByEmail: string;
  
  // Recipient
  recipientEmail: string;
  recipientPhone?: string;
  
  // Invitation details
  message?: string;                   // Custom message
  accessLevel: 'view' | 'comment' | 'edit';
  method: ShareMethod;
  
  // Status
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
  sentAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  expiresAt?: Date;
  
  // Verification (for external users)
  verificationToken?: string;
  verifiedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ===== FEATURE FLAGS =====

export interface FeatureFlags {
  allyBetaAccess: boolean;
}

export interface UserFeatureAccess {
  userId: string;
  features: {
    allyBeta?: {
      enabled: boolean;
      enabledAt: Date;
      enabledBy: string;              // SuperAdmin who granted access
    };
  };
}

// ===== ANALYTICS =====

export interface AllyUsageMetrics {
  userId: string;
  userEmail: string;
  organizationId?: string;
  domain: string;
  
  // Usage counts
  conversationCount: number;
  messageCount: number;
  actionCount: number;
  collaborationCount: number;
  
  // App usage
  appUsage: Record<string, number>;   // { 'summary': 15, 'email': 8, ... }
  
  // Performance
  avgTimeToFirstMessage: number;      // seconds
  avgSessionLength: number;           // seconds
  avgMessagesPerConversation: number;
  
  // Satisfaction
  userSatisfaction?: number;          // 1-5 rating
  feedbackComments?: string[];
  
  // Computed metrics
  agentDiscoveryRate: number;         // agents discovered / total agents
  collaborationRate: number;          // conversations with collaborators / total conversations
  
  // Timestamp
  periodStart: Date;
  periodEnd: Date;
  lastUpdated: Date;
}

// ===== COMPARISON METRICS =====

export interface ComparisonMetrics {
  classic: SystemMetrics;
  ally: AllySystemMetrics;
  improvement: ImprovementMetrics;
  verdict: 'GO' | 'NO-GO' | 'NEEDS-IMPROVEMENT';
  verdictReasons: string[];
}

export interface SystemMetrics {
  conversationCount: number;
  messageCount: number;
  avgTimeToFirstMessage: number;
  avgSessionLength: number;
  agentDiscoveryRate: number;
  userSatisfaction: number;
}

export interface AllySystemMetrics extends SystemMetrics {
  appUsageCount: number;
  collaborationCount: number;
  promptEffectiveness: number;
}

export interface ImprovementMetrics {
  timeToFirstMessage: string;         // e.g., "-60%"
  sessionLength: string;              // e.g., "+50%"
  agentDiscovery: string;             // e.g., "+122%"
  satisfaction: string;               // e.g., "+20%"
}

