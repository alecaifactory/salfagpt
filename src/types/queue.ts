/**
 * Queue System Type Definitions
 * 
 * Defines types for the message queue system that allows users to
 * queue prompts/tasks for agents to execute sequentially or on-demand.
 * 
 * @version 1.0.0
 * @date 2025-10-31
 */

// ===== QUEUE ITEM STATUS =====

export type QueueItemStatus = 
  | 'pending'      // Not started yet
  | 'processing'   // Currently executing
  | 'completed'    // Successfully finished
  | 'failed'       // Execution failed
  | 'cancelled'    // User cancelled
  | 'paused';      // Execution paused (waiting for dependency)

// ===== QUEUE EXECUTION MODE =====

export type QueueExecutionMode =
  | 'auto'         // Execute automatically one by one
  | 'manual'       // User triggers each item
  | 'scheduled';   // Execute at specific times (future)

// ===== QUEUE ITEM =====

export interface MessageQueueItem {
  // Identity
  id: string;                         // Document ID
  userId: string;                     // Owner (indexed)
  conversationId: string;             // Agent/conversation (indexed)
  
  // Content
  message: string;                    // The prompt/question
  title?: string;                     // Optional short title
  description?: string;               // Optional description
  
  // Execution
  status: QueueItemStatus;            // Current status (indexed)
  executionMode: QueueExecutionMode;  // How to execute
  position: number;                   // Order in queue (0-based)
  priority: number;                   // Priority (1-10, higher = first)
  
  // Dependencies
  dependsOn?: string[];               // Queue item IDs that must complete first
  blockedBy?: string[];               // Items blocking this one (computed)
  
  // Scheduling (future)
  scheduledFor?: Date;                // When to execute (if scheduled)
  executeAfter?: Date;                // Don't execute before this time
  
  // Results
  userMessageId?: string;             // ID of user message (when executed)
  assistantMessageId?: string;        // ID of AI response (when completed)
  errorMessage?: string;              // Error details (if failed)
  retryCount?: number;                // Number of retry attempts
  lastError?: string;                 // Last error message
  
  // Metadata
  createdAt: Date;                    // When added to queue
  updatedAt: Date;                    // Last status update
  startedAt?: Date;                   // When execution started
  completedAt?: Date;                 // When execution finished
  executionTimeMs?: number;           // How long it took
  
  // Context Snapshot
  contextSnapshot?: {                 // Context at time of creation
    activeSourceIds: string[];
    model: string;
    systemPrompt: string;
  };
  
  // Metadata
  tags?: string[];                    // For categorization
  notes?: string;                     // User notes
  source: 'localhost' | 'production'; // Data origin
}

// ===== QUEUE CONFIGURATION =====

export interface QueueConfig {
  id: string;                         // Document ID (conversationId)
  conversationId: string;             // Agent ID
  userId: string;                     // Owner
  
  // Execution Settings
  executionMode: QueueExecutionMode;  // Default execution mode
  autoExecute: boolean;               // Auto-execute pending items
  concurrentLimit: number;            // Max items processing at once (default: 1)
  retryOnError: boolean;              // Auto-retry failed items
  maxRetries: number;                 // Max retry attempts (default: 3)
  
  // Behavior
  pauseOnError: boolean;              // Stop queue if item fails
  pauseOnFeedback: boolean;           // Stop if AI requests feedback
  notifyOnComplete: boolean;          // Notify when queue finishes
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}

// ===== DEFAULT QUEUE CONFIG =====

export const DEFAULT_QUEUE_CONFIG: Omit<QueueConfig, 'id' | 'conversationId' | 'userId' | 'createdAt' | 'updatedAt' | 'source'> = {
  executionMode: 'manual',
  autoExecute: false,
  concurrentLimit: 1,
  retryOnError: false,
  maxRetries: 3,
  pauseOnError: true,
  pauseOnFeedback: true,
  notifyOnComplete: true,
};

// ===== QUEUE METRICS =====

export interface QueueMetrics {
  conversationId: string;
  totalItemsQueued: number;
  completedItems: number;
  failedItems: number;
  cancelledItems: number;
  averageExecutionTime: number;      // ms
  averageWaitTime: number;           // ms from creation to execution
  successRate: number;               // percentage
  currentQueueDepth: number;         // pending items
  peakQueueDepth: number;            // max pending at once
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== QUEUE EVENTS =====

export type QueueEvent =
  | 'item_added'
  | 'item_started'
  | 'item_completed'
  | 'item_failed'
  | 'queue_completed'
  | 'queue_paused'
  | 'queue_resumed'
  | 'dependency_met';

export interface QueueNotification {
  event: QueueEvent;
  conversationId: string;
  itemId?: string;
  itemTitle?: string;
  message: string;
  timestamp: Date;
}

// ===== QUEUE TEMPLATE =====

export interface QueueTemplate {
  id: string;
  name: string;
  description: string;
  category: string;                   // 'research', 'analysis', 'review', etc.
  items: Array<{
    message: string;
    title?: string;
    description?: string;
    priority: number;
    dependsOn?: number[];             // Indices of dependent items
    tags?: string[];
  }>;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  rating: number;                     // Average rating
  createdAt: Date;
  updatedAt: Date;
}

// ===== BULK IMPORT =====

export interface BulkImportResult {
  itemsCreated: number;
  items: MessageQueueItem[];
  errors?: Array<{
    line: number;
    message: string;
    error: string;
  }>;
}

// ===== QUEUE STATISTICS =====

export interface QueueStatistics {
  totalQueues: number;
  activeQueues: number;
  totalItemsProcessed: number;
  averageQueueDepth: number;
  mostUsedTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
  }>;
  topPerformingAgents: Array<{
    conversationId: string;
    agentName: string;
    completionRate: number;
  }>;
}

// ===== HELPER TYPES =====

export interface QueueItemUpdate {
  message?: string;
  title?: string;
  description?: string;
  priority?: number;
  position?: number;
  dependsOn?: string[];
  status?: QueueItemStatus;
  tags?: string[];
  notes?: string;
}

export interface QueueConfigUpdate {
  executionMode?: QueueExecutionMode;
  autoExecute?: boolean;
  concurrentLimit?: number;
  retryOnError?: boolean;
  maxRetries?: number;
  pauseOnError?: boolean;
  pauseOnFeedback?: boolean;
  notifyOnComplete?: boolean;
}

// ===== COMPONENT PROPS =====

export interface QueuePanelProps {
  conversationId: string;
  userId: string;
  queueItems: MessageQueueItem[];
  queueConfig: QueueConfig;
  onAddItem: () => void;
  onExecuteItem: (itemId: string) => void;
  onCancelItem: (itemId: string) => void;
  onEditItem: (itemId: string) => void;
  onReorderItem: (itemId: string, direction: 'up' | 'down') => void;
  onUpdateConfig: (updates: QueueConfigUpdate) => void;
}

export interface QueueItemCardProps {
  item: MessageQueueItem;
  index: number;
  totalItems: number;
  onExecute: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export interface AddToQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  existingQueueItems: MessageQueueItem[];
  currentContext: {
    activeSourceIds: string[];
    model: string;
    systemPrompt: string;
  };
  onAdd: (item: Partial<MessageQueueItem>) => void;
}

export interface QueueSettingsProps {
  conversationId: string;
  config: QueueConfig;
  onUpdate: (updates: QueueConfigUpdate) => void;
}

export interface QueueStatsProps {
  metrics: QueueMetrics;
  items: MessageQueueItem[];
}

// ===== QUEUE OPERATIONS =====

export interface QueueOperations {
  // CRUD
  addItem: (item: Partial<MessageQueueItem>) => Promise<MessageQueueItem>;
  updateItem: (itemId: string, updates: QueueItemUpdate) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  
  // Execution
  executeItem: (itemId: string) => Promise<void>;
  executeAll: () => Promise<void>;
  cancelItem: (itemId: string) => Promise<void>;
  pauseQueue: () => Promise<void>;
  resumeQueue: () => Promise<void>;
  
  // Reordering
  moveUp: (itemId: string) => Promise<void>;
  moveDown: (itemId: string) => Promise<void>;
  reorder: (itemIds: string[]) => Promise<void>;
  
  // Bulk
  bulkAdd: (items: Array<Partial<MessageQueueItem>>) => Promise<BulkImportResult>;
  clearCompleted: () => Promise<void>;
  
  // Templates
  saveAsTemplate: (name: string, description: string) => Promise<string>;
  loadTemplate: (templateId: string) => Promise<void>;
  
  // Export
  exportResults: (format: 'markdown' | 'json' | 'csv') => Promise<void>;
}

// ===== FIRESTORE COLLECTION NAMES =====

export const QUEUE_COLLECTIONS = {
  MESSAGE_QUEUE: 'message_queue',
  QUEUE_CONFIGS: 'queue_configs',
  QUEUE_METRICS: 'queue_metrics',
  QUEUE_TEMPLATES: 'queue_templates',
} as const;











