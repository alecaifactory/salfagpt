/**
 * Queue Processor
 * 
 * Handles automatic execution of queue items, dependency resolution,
 * and queue management logic.
 * 
 * @version 1.0.0
 * @date 2025-10-31
 */

import type { MessageQueueItem, QueueConfig } from '../types/queue';

export class QueueProcessor {
  private conversationId: string;
  private userId: string;
  private config: QueueConfig;
  private processing = new Set<string>(); // Currently processing item IDs
  private isRunning = false;
  
  constructor(conversationId: string, userId: string, config: QueueConfig) {
    this.conversationId = conversationId;
    this.userId = userId;
    this.config = config;
  }
  
  /**
   * Main queue processing loop
   * Runs continuously when auto-execute is enabled
   */
  async processQueue(items: MessageQueueItem[]): Promise<void> {
    if (!this.config.autoExecute) {
      console.log('⏸️ Queue auto-execute disabled');
      return;
    }
    
    if (this.isRunning) {
      console.log('⏸️ Queue processor already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Starting queue processor');
    
    try {
      while (true) {
        // Get next items to execute
        const nextItems = this.getExecutableItems(items);
        
        if (nextItems.length === 0) {
          console.log('✅ Queue empty or all items blocked');
          break;
        }
        
        // Execute items (respecting concurrent limit)
        const itemsToExecute = nextItems.slice(0, this.config.concurrentLimit);
        
        console.log(`⚙️ Executing ${itemsToExecute.length} queue items`);
        
        const results = await Promise.allSettled(
          itemsToExecute.map(item => this.executeItem(item))
        );
        
        // Check for errors
        const failures = results.filter(r => r.status === 'rejected');
        
        if (failures.length > 0 && this.config.pauseOnError) {
          console.log('❌ Queue paused due to error');
          await this.pauseQueue();
          break;
        }
        
        // Small delay before next iteration
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reload items to get updated statuses
        const updatedItems = await this.loadQueueItems();
        items = updatedItems;
      }
      
      console.log('✅ Queue processing complete');
      
      // Notify user if configured
      if (this.config.notifyOnComplete) {
        this.notifyQueueComplete();
      }
      
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Get items that can be executed right now
   * Considers: status, dependencies, concurrent limit
   */
  getExecutableItems(items: MessageQueueItem[]): MessageQueueItem[] {
    const executable = items.filter(item => {
      // Must be pending
      if (item.status !== 'pending') return false;
      
      // Not already processing
      if (this.processing.has(item.id)) return false;
      
      // Check dependencies
      if (item.dependsOn && item.dependsOn.length > 0) {
        const allDepsMet = item.dependsOn.every(depId =>
          items.find(i => i.id === depId)?.status === 'completed'
        );
        
        if (!allDepsMet) {
          return false;
        }
      }
      
      // Check scheduled time (if applicable)
      if (item.scheduledFor && item.scheduledFor > new Date()) {
        return false;
      }
      
      return true;
    });
    
    // Sort by priority (high to low), then position (low to high)
    return executable.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.position - b.position; // Lower position first
    });
  }
  
  /**
   * Execute a single queue item
   */
  async executeItem(item: MessageQueueItem): Promise<void> {
    const itemId = item.id;
    
    try {
      this.processing.add(itemId);
      console.log(`⚙️ Executing queue item: ${itemId}`);
      
      // Call execution API
      const response = await fetch(`/api/queue/${itemId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error);
      }
      
      const result = await response.json();
      
      // Check if AI requested feedback
      if (result.needsFeedback && this.config.pauseOnFeedback) {
        console.log('⚠️ Queue paused - AI requested feedback');
        await this.pauseQueue();
      }
      
      console.log(`✅ Queue item completed: ${itemId}`);
      
    } catch (error) {
      console.error(`❌ Queue item failed: ${itemId}`, error);
      
      // Check if should retry
      if (this.config.retryOnError && (item.retryCount || 0) < this.config.maxRetries) {
        console.log(`🔄 Retrying queue item: ${itemId} (attempt ${(item.retryCount || 0) + 1}/${this.config.maxRetries})`);
        
        // Re-add to pending (API already handles retry count increment)
        // The next iteration will pick it up
      }
      
      throw error; // Re-throw for Promise.allSettled
      
    } finally {
      this.processing.delete(itemId);
    }
  }
  
  /**
   * Load current queue items
   */
  async loadQueueItems(): Promise<MessageQueueItem[]> {
    try {
      const response = await fetch(
        `/api/queue?conversationId=${this.conversationId}&userId=${this.userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading queue items:', error);
      return [];
    }
  }
  
  /**
   * Pause queue execution
   */
  async pauseQueue() {
    try {
      await fetch('/api/queue/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.conversationId,
          userId: this.userId,
          autoExecute: false,
        }),
      });
      
      this.config.autoExecute = false;
      console.log('⏸️ Queue paused');
    } catch (error) {
      console.error('Error pausing queue:', error);
    }
  }
  
  /**
   * Notify user queue is complete
   */
  notifyQueueComplete() {
    try {
      // Play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77eeeTRAMUKbj8LdjHAY4kdXzzHksBSR3yPDdkUAKFFyz6eunVRQKR5/g8r9vIgUrgc7y2Ik2CBhpt+3nn00QDFA=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
      
      // Show toast notification
      if (typeof window !== 'undefined') {
        // You can integrate with your existing toast system here
        console.log('🎉 Queue completed - all tasks processed!');
      }
    } catch (error) {
      // Silent fail - notifications not critical
    }
  }
  
  /**
   * Get queue statistics
   */
  getStats(items: MessageQueueItem[]) {
    const pending = items.filter(i => i.status === 'pending').length;
    const processing = items.filter(i => i.status === 'processing').length;
    const completed = items.filter(i => i.status === 'completed').length;
    const failed = items.filter(i => i.status === 'failed').length;
    const cancelled = items.filter(i => i.status === 'cancelled').length;
    
    const totalExecuted = completed + failed;
    const successRate = totalExecuted > 0 
      ? (completed / totalExecuted) * 100 
      : 100;
    
    const completedItems = items.filter(i => i.status === 'completed' && i.executionTimeMs);
    const avgExecutionTime = completedItems.length > 0
      ? completedItems.reduce((sum, i) => sum + (i.executionTimeMs || 0), 0) / completedItems.length
      : 0;
    
    return {
      pending,
      processing,
      completed,
      failed,
      cancelled,
      total: items.length,
      successRate,
      avgExecutionTime,
    };
  }
}

/**
 * Hook for using queue processor in React components
 */
export function useQueueProcessor(
  conversationId: string,
  userId: string,
  queueConfig: QueueConfig | null
) {
  const processorRef = useRef<QueueProcessor | null>(null);
  
  useEffect(() => {
    if (queueConfig) {
      processorRef.current = new QueueProcessor(conversationId, userId, queueConfig);
    }
  }, [conversationId, userId, queueConfig]);
  
  const processQueue = async (items: MessageQueueItem[]) => {
    if (processorRef.current) {
      await processorRef.current.processQueue(items);
    }
  };
  
  const getStats = (items: MessageQueueItem[]) => {
    if (processorRef.current) {
      return processorRef.current.getStats(items);
    }
    return null;
  };
  
  return { processQueue, getStats };
}

// Import useRef
import { useRef } from 'react';











