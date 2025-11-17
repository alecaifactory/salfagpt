/**
 * Queue Panel Component
 * 
 * Displays and manages the message queue for an agent.
 * Allows users to queue prompts/tasks for sequential or parallel execution.
 * 
 * @version 1.0.0
 * @date 2025-10-31
 */

import { useState, useEffect } from 'react';
import { 
  ListTodo, Plus, Play, StopCircle, Trash2, Settings,
  Clock, CheckCircle, XCircle, Loader2, Pause, RotateCw,
  ChevronUp, ChevronDown, Eye, Pencil, Link2, AlertCircle
} from 'lucide-react';
import type { MessageQueueItem, QueueConfig, QueueConfigUpdate } from '../types/queue';
import { DEFAULT_QUEUE_CONFIG } from '../types/queue';

interface QueuePanelProps {
  conversationId: string;
  userId: string;
  currentContext: {
    activeSourceIds: string[];
    model: string;
    systemPrompt: string;
  };
  onMessageNavigate?: (messageId: string) => void;
}

export default function QueuePanel({ 
  conversationId, 
  userId, 
  currentContext,
  onMessageNavigate 
}: QueuePanelProps) {
  const [queueItems, setQueueItems] = useState<MessageQueueItem[]>([]);
  const [queueConfig, setQueueConfig] = useState<QueueConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  
  // Load queue items and config
  useEffect(() => {
    if (conversationId && userId) {
      loadQueue();
    }
  }, [conversationId, userId]);
  
  // Auto-process queue if enabled
  useEffect(() => {
    if (queueConfig?.autoExecute && queueItems.some(i => i.status === 'pending')) {
      processNextItems();
    }
  }, [queueConfig, queueItems]);
  
  async function loadQueue() {
    setLoading(true);
    try {
      // Load items and config in parallel
      const [itemsResponse, configResponse] = await Promise.all([
        fetch(`/api/queue?conversationId=${conversationId}&userId=${userId}`),
        fetch(`/api/queue/config?conversationId=${conversationId}&userId=${userId}`),
      ]);
      
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setQueueItems(itemsData.items || []);
      }
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setQueueConfig(configData);
      } else {
        // Use default config
        setQueueConfig({
          id: conversationId,
          conversationId,
          userId,
          ...DEFAULT_QUEUE_CONFIG,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'localhost',
        });
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function addToQueue(item: Partial<MessageQueueItem>) {
    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversationId,
          ...item,
        }),
      });
      
      if (response.ok) {
        const newItem = await response.json();
        setQueueItems(prev => [...prev, newItem]);
        console.log('✅ Item added to queue:', newItem.id);
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }
  
  async function executeItem(itemId: string) {
    try {
      setProcessingItems(prev => new Set(prev).add(itemId));
      
      const response = await fetch(`/api/queue/${itemId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update item status
        setQueueItems(prev => prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                status: 'completed',
                completedAt: new Date(),
                executionTimeMs: result.executionTimeMs,
                userMessageId: result.userMessageId,
                assistantMessageId: result.assistantMessageId,
              }
            : item
        ));
        
        // Play notification
        playNotificationSound();
        
        console.log('✅ Queue item executed:', itemId);
      } else {
        const error = await response.json();
        throw new Error(error.details || error.error);
      }
    } catch (error) {
      console.error('Error executing queue item:', error);
      
      // Mark as failed
      setQueueItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : String(error),
            }
          : item
      ));
    } finally {
      setProcessingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }
  
  async function processNextItems() {
    if (!queueConfig?.autoExecute) return;
    
    // Get pending items that can execute
    const executable = queueItems.filter(item => {
      // Must be pending
      if (item.status !== 'pending') return false;
      
      // Check dependencies
      if (item.dependsOn && item.dependsOn.length > 0) {
        const allDepsMet = item.dependsOn.every(depId =>
          queueItems.find(i => i.id === depId)?.status === 'completed'
        );
        if (!allDepsMet) return false;
      }
      
      // Not already processing
      if (processingItems.has(item.id)) return false;
      
      return true;
    });
    
    // Sort by priority (high to low), then position (low to high)
    const sorted = executable.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.position - b.position; // Lower position first
    });
    
    // Execute up to concurrent limit
    const toExecute = sorted.slice(0, queueConfig.concurrentLimit);
    
    if (toExecute.length > 0) {
      console.log(`🚀 Auto-executing ${toExecute.length} queue items`);
      
      // Execute in parallel
      await Promise.allSettled(
        toExecute.map(item => executeItem(item.id))
      );
    }
  }
  
  async function cancelItem(itemId: string) {
    try {
      await fetch(`/api/queue/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      
      setQueueItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: 'cancelled' } : item
      ));
    } catch (error) {
      console.error('Error cancelling item:', error);
    }
  }
  
  async function deleteItem(itemId: string) {
    try {
      await fetch(`/api/queue/${itemId}`, {
        method: 'DELETE',
      });
      
      setQueueItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }
  
  async function moveItem(itemId: string, direction: 'up' | 'down') {
    const index = queueItems.findIndex(i => i.id === itemId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= queueItems.length) return;
    
    // Swap positions
    const newItems = [...queueItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Update positions
    const updates = newItems.map((item, idx) => ({
      id: item.id,
      position: idx,
    }));
    
    // Update locally first (optimistic)
    setQueueItems(newItems.map((item, idx) => ({ ...item, position: idx })));
    
    // Update in Firestore
    try {
      await Promise.all(
        updates.map(update =>
          fetch(`/api/queue/${update.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: update.position }),
          })
        )
      );
    } catch (error) {
      console.error('Error reordering items:', error);
      // Reload to get correct state
      loadQueue();
    }
  }
  
  async function toggleAutoExecute() {
    if (!queueConfig) return;
    
    const newAutoExecute = !queueConfig.autoExecute;
    
    try {
      await fetch('/api/queue/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId,
          autoExecute: newAutoExecute,
        }),
      });
      
      setQueueConfig(prev => prev ? { ...prev, autoExecute: newAutoExecute } : null);
      
      console.log(`${newAutoExecute ? '▶️' : '⏸️'} Auto-execute ${newAutoExecute ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling auto-execute:', error);
    }
  }
  
  async function executeAllPending() {
    const pending = queueItems.filter(i => i.status === 'pending');
    
    if (pending.length === 0) return;
    
    console.log(`🚀 Executing all ${pending.length} pending items`);
    
    // Execute in parallel (respecting concurrent limit)
    const limit = queueConfig?.concurrentLimit || 1;
    
    for (let i = 0; i < pending.length; i += limit) {
      const batch = pending.slice(i, i + limit);
      await Promise.allSettled(
        batch.map(item => executeItem(item.id))
      );
    }
  }
  
  async function clearCompleted() {
    const completed = queueItems.filter(i => 
      i.status === 'completed' || i.status === 'cancelled'
    );
    
    if (completed.length === 0) return;
    
    try {
      await Promise.all(
        completed.map(item => deleteItem(item.id))
      );
      
      console.log(`🗑️ Cleared ${completed.length} completed items`);
    } catch (error) {
      console.error('Error clearing completed items:', error);
    }
  }
  
  function playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGi77eeeTRAMUKbj8LdjHAY4kdXzzHksBSR3yPDdkUAKFFyz6eunVRQKR5/g8r9vIgUrgc7y2Ik2CBhpt+3nn00QDFA=');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Silent fail
    } catch (error) {
      // Silent fail - notifications not critical
    }
  }
  
  // Computed values
  const pendingCount = queueItems.filter(i => i.status === 'pending').length;
  const processingCount = queueItems.filter(i => i.status === 'processing').length;
  const completedCount = queueItems.filter(i => i.status === 'completed').length;
  const hasPendingItems = pendingCount > 0;
  const hasCompletedItems = completedCount > 0;
  
  if (loading) {
    return (
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Cargando cola...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border-t border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Cola de Tareas</h3>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              {pendingCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Auto-execute toggle */}
          <button
            onClick={toggleAutoExecute}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
              queueConfig?.autoExecute ? 'text-green-600' : 'text-slate-400'
            }`}
            title={queueConfig?.autoExecute ? 'Auto-ejecución ON' : 'Auto-ejecución OFF'}
          >
            {queueConfig?.autoExecute ? (
              <Play className="w-4 h-4" />
            ) : (
              <StopCircle className="w-4 h-4" />
            )}
          </button>
          
          {/* Add to queue */}
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Agregar a cola"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Queue Items */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {queueItems.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No hay tareas en cola</p>
            <p className="text-[10px] mt-1">Agrega prompts para ejecutar después</p>
          </div>
        ) : (
          queueItems.map((item, index) => (
            <QueueItemCard
              key={item.id}
              item={item}
              index={index}
              totalItems={queueItems.length}
              isProcessing={processingItems.has(item.id)}
              onExecute={() => executeItem(item.id)}
              onCancel={() => cancelItem(item.id)}
              onDelete={() => deleteItem(item.id)}
              onMoveUp={() => moveItem(item.id, 'up')}
              onMoveDown={() => moveItem(item.id, 'down')}
              onNavigateToMessage={onMessageNavigate}
            />
          ))
        )}
      </div>
      
      {/* Queue Controls */}
      {queueItems.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={executeAllPending}
            disabled={!hasPendingItems}
            className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            Ejecutar Todo ({pendingCount})
          </button>
          
          <button
            onClick={clearCompleted}
            disabled={!hasCompletedItems}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            Limpiar ({completedCount})
          </button>
        </div>
      )}
      
      {/* Queue Stats */}
      {queueItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Pendientes: <strong className="text-blue-600">{pendingCount}</strong></span>
            <span>Procesando: <strong className="text-amber-600">{processingCount}</strong></span>
            <span>Completadas: <strong className="text-green-600">{completedCount}</strong></span>
          </div>
          
          {queueConfig?.autoExecute && (
            <div className="flex items-center gap-1 text-green-600">
              <Play className="w-3 h-3" />
              <span>Auto</span>
            </div>
          )}
        </div>
      )}
      
      {/* Add to Queue Modal */}
      {showAddModal && (
        <AddToQueueModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          conversationId={conversationId}
          userId={userId}
          currentContext={currentContext}
          existingQueueItems={queueItems}
          onAdd={(item) => {
            addToQueue(item);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// ===== QUEUE ITEM CARD =====

interface QueueItemCardProps {
  item: MessageQueueItem;
  index: number;
  totalItems: number;
  isProcessing: boolean;
  onExecute: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onNavigateToMessage?: (messageId: string) => void;
}

function QueueItemCard({
  item,
  index,
  totalItems,
  isProcessing,
  onExecute,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown,
  onNavigateToMessage,
}: QueueItemCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Update elapsed time for processing items
  useEffect(() => {
    if (item.status === 'processing' && item.startedAt) {
      const timer = setInterval(() => {
        setElapsedTime(Date.now() - item.startedAt!.getTime());
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [item.status, item.startedAt]);
  
  const statusConfig = {
    pending: { color: 'slate', icon: Clock, label: 'Pendiente' },
    processing: { color: 'blue', icon: Loader2, label: 'Procesando', spin: true },
    completed: { color: 'green', icon: CheckCircle, label: 'Completado' },
    failed: { color: 'red', icon: XCircle, label: 'Fallido' },
    cancelled: { color: 'amber', icon: StopCircle, label: 'Cancelado' },
    paused: { color: 'yellow', icon: Pause, label: 'Pausado' },
  };
  
  const config = statusConfig[item.status];
  const StatusIcon = config.icon;
  
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  return (
    <div className={`
      border rounded-lg p-2 transition-all
      ${item.status === 'processing' ? 'border-blue-400 bg-blue-50 shadow-sm' :
        item.status === 'completed' ? 'border-green-300 bg-green-50' :
        item.status === 'failed' ? 'border-red-300 bg-red-50' :
        'border-slate-200 bg-white hover:border-slate-300'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Position Badge */}
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
            {index + 1}
          </span>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 line-clamp-2">
              {item.title || item.message}
            </p>
            {item.title && (
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {item.message.substring(0, 60)}...
              </p>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`
          flex-shrink-0 px-2 py-0.5 bg-${config.color}-100 text-${config.color}-700 
          rounded-full text-[9px] font-semibold flex items-center gap-1
        `}>
          <StatusIcon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
          {config.label}
        </span>
      </div>
      
      {/* Dependencies */}
      {item.dependsOn && item.dependsOn.length > 0 && (
        <div className="mb-2 flex items-center gap-1 text-[10px] text-slate-500">
          <Link2 className="w-3 h-3" />
          <span>Depende de {item.dependsOn.length} tarea(s)</span>
        </div>
      )}
      
      {/* Processing Timer */}
      {item.status === 'processing' && (
        <div className="mb-2 text-[10px] text-blue-600 flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3" />
          <span>Procesando: {formatDuration(elapsedTime)}</span>
        </div>
      )}
      
      {/* Error Message */}
      {item.status === 'failed' && item.errorMessage && (
        <div className="mb-2 p-2 bg-red-100 border border-red-200 rounded text-[10px] text-red-800">
          <p className="font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Error:
          </p>
          <p className="mt-1">{item.errorMessage}</p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between gap-2 mt-2">
        {/* Left - Execution actions */}
        <div className="flex items-center gap-1">
          {item.status === 'pending' && (
            <>
              <button
                onClick={onExecute}
                disabled={isProcessing}
                className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-medium hover:bg-green-700 disabled:bg-slate-300 flex items-center gap-1 transition-colors"
                title="Ejecutar ahora"
              >
                <Play className="w-3 h-3" />
                Ejecutar
              </button>
            </>
          )}
          
          {item.status === 'processing' && (
            <button
              onClick={onCancel}
              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-medium hover:bg-red-700 flex items-center gap-1 transition-colors"
              title="Cancelar"
            >
              <StopCircle className="w-3 h-3" />
              Cancelar
            </button>
          )}
          
          {item.status === 'completed' && item.assistantMessageId && (
            <button
              onClick={() => onNavigateToMessage?.(item.assistantMessageId!)}
              className="px-2 py-1 border border-green-300 text-green-700 rounded text-[10px] hover:bg-green-50 flex items-center gap-1 transition-colors"
              title="Ver respuesta"
            >
              <Eye className="w-3 h-3" />
              Ver
            </button>
          )}
          
          {item.status === 'failed' && (
            <button
              onClick={onExecute}
              className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-medium hover:bg-blue-700 flex items-center gap-1 transition-colors"
              title="Reintentar"
            >
              <RotateCw className="w-3 h-3" />
              Reintentar
            </button>
          )}
        </div>
        
        {/* Right - Reorder & delete */}
        <div className="flex items-center gap-1">
          {item.status === 'pending' && (
            <>
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-1 text-slate-500 hover:text-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                title="Subir"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={onMoveDown}
                disabled={index === totalItems - 1}
                className="p-1 text-slate-500 hover:text-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                title="Bajar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          
          <button
            onClick={onDelete}
            className="p-1 text-red-500 hover:text-red-700 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Execution Time (for completed) */}
      {item.status === 'completed' && item.executionTimeMs && (
        <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Tiempo: {formatDuration(item.executionTimeMs)}</span>
        </div>
      )}
    </div>
  );
}

// ===== ADD TO QUEUE MODAL =====

interface AddToQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  currentContext: {
    activeSourceIds: string[];
    model: string;
    systemPrompt: string;
  };
  existingQueueItems: MessageQueueItem[];
  onAdd: (item: Partial<MessageQueueItem>) => void;
}

function AddToQueueModal({
  isOpen,
  onClose,
  conversationId,
  userId,
  currentContext,
  existingQueueItems,
  onAdd,
}: AddToQueueModalProps) {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(5);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [captureContext, setCaptureContext] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);
  
  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    // Detect bulk mode (multiple lines)
    const lines = value.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 1) {
      setBulkMode(true);
      setBulkCount(lines.length);
    } else {
      setBulkMode(false);
      setBulkCount(0);
    }
  };
  
  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    if (bulkMode) {
      // Bulk add
      const response = await fetch('/api/queue/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversationId,
          bulkText: message,
          basePriority: priority,
          captureContext,
          contextSnapshot: captureContext ? currentContext : undefined,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Bulk added ${result.itemsCreated} items`);
        // Reload queue
        window.location.reload(); // Simple reload to show all new items
      }
    } else {
      // Single add
      const queueItem: Partial<MessageQueueItem> = {
        userId,
        conversationId,
        message,
        title: title || undefined,
        description: description || undefined,
        status: 'pending',
        priority,
        dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
        contextSnapshot: captureContext ? currentContext : undefined,
      };
      
      onAdd(queueItem);
    }
    
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Agregar a Cola</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Message/Task Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pregunta/Tarea <span className="text-red-600">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="¿Qué deseas que el agente procese?&#10;&#10;💡 Pega múltiples preguntas (una por línea) para bulk import"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={6}
            />
            
            {bulkMode && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Modo bulk detectado: {bulkCount} tareas
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Se crearán {bulkCount} items en la cola automáticamente
                </p>
              </div>
            )}
          </div>
          
          {!bulkMode && (
            <>
              {/* Title (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título (Opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Analizar documento legal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prioridad: <span className="text-blue-600 font-semibold">{priority}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Baja (1)</span>
                  <span>Media (5)</span>
                  <span>Alta (10)</span>
                </div>
              </div>
            </>
          )}
          
          {/* Capture Context */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="captureContext"
              checked={captureContext}
              onChange={(e) => setCaptureContext(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div className="flex-1">
              <label htmlFor="captureContext" className="text-sm text-slate-700 cursor-pointer">
                Capturar contexto actual
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Guarda fuentes activas, modelo y prompt para usar al ejecutar
              </p>
            </div>
          </div>
          
          {captureContext && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-slate-700">
              <p className="font-medium mb-2">Contexto que se capturará:</p>
              <ul className="space-y-1">
                <li>• Modelo: <span className="font-semibold">{currentContext.model}</span></li>
                <li>• Fuentes activas: <span className="font-semibold">
                  {currentContext.activeSourceIds.length}
                </span></li>
                <li>• System prompt: <span className="font-semibold">
                  {currentContext.systemPrompt.substring(0, 30)}...
                </span></li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {bulkMode ? `Agregar ${bulkCount} Tareas` : 'Agregar a Cola'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Import for X icon
import { X as XIcon } from 'lucide-react';











