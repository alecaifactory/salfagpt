# Queue System for Agent Conversations

**Date:** 2025-10-31  
**Status:** 🎯 Design Complete  
**Version:** 1.0.0  
**Backward Compatible:** ✅ Yes

---

## 🎯 Purpose

Enable users to **queue multiple prompts/tasks** for an agent, which execute sequentially or on-demand. This allows:
- Planning multi-step workflows
- Batching research questions
- Scheduling tasks for later execution
- Building complex agent interactions

---

## 🏗️ Architecture

### Queue Item States

```typescript
type QueueItemStatus = 
  | 'pending'      // Not started yet
  | 'processing'   // Currently executing
  | 'completed'    // Successfully finished
  | 'failed'       // Execution failed
  | 'cancelled'    // User cancelled
  | 'paused';      // Execution paused (waiting for dependency)
```

### Queue Execution Modes

```typescript
type QueueExecutionMode =
  | 'auto'         // Execute automatically one by one
  | 'manual'       // User triggers each item
  | 'scheduled';   // Execute at specific times (future)
```

---

## 📊 Data Schema

### Firestore Collection: `message_queue`

**Collection Path:** `message_queue/{queueItemId}`

```typescript
interface MessageQueueItem {
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
  
  // Metadata
  createdAt: Date;                    // When added to queue
  updatedAt: Date;                    // Last status update
  startedAt?: Date;                   // When execution started
  completedAt?: Date;                 // When execution finished
  executionTimeMs?: number;           // How long it took
  
  // Context
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
```

**Indexes Required:**
```
- userId ASC, conversationId ASC, position ASC
- userId ASC, status ASC, createdAt DESC
- conversationId ASC, status ASC, position ASC
```

---

### Queue Configuration: `queue_configs/{conversationId}`

**Collection Path:** `queue_configs/{conversationId}`

```typescript
interface QueueConfig {
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
```

**Defaults:**
```typescript
{
  executionMode: 'manual',
  autoExecute: false,
  concurrentLimit: 1,
  retryOnError: false,
  maxRetries: 3,
  pauseOnError: true,
  pauseOnFeedback: true,
  notifyOnComplete: true,
}
```

---

## 🎨 UI Components

### 1. Queue Panel (Sidebar - Below Context)

```typescript
<div className="border-t border-slate-200 p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <ListTodo className="w-4 h-4 text-slate-600" />
      <h3 className="text-sm font-semibold text-slate-700">Cola de Tareas</h3>
      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
        {queueItems.filter(i => i.status === 'pending').length}
      </span>
    </div>
    
    <div className="flex items-center gap-2">
      {/* Execution Mode Toggle */}
      <button
        onClick={() => toggleExecutionMode()}
        className={`p-1.5 rounded hover:bg-slate-100 ${
          queueConfig.autoExecute ? 'text-green-600' : 'text-slate-400'
        }`}
        title={queueConfig.autoExecute ? 'Auto-ejecución ON' : 'Auto-ejecución OFF'}
      >
        {queueConfig.autoExecute ? <Play className="w-4 h-4" /> : <StopCircle className="w-4 h-4" />}
      </button>
      
      {/* Add to Queue Button */}
      <button
        onClick={() => setShowAddToQueue(true)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
        title="Agregar a cola"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
  
  {/* Queue Items List */}
  <div className="space-y-2 max-h-60 overflow-y-auto">
    {queueItems.length === 0 ? (
      <div className="text-center py-4 text-slate-400 text-xs">
        <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay tareas en cola</p>
        <p className="text-[10px] mt-1">Agrega prompts para ejecutar después</p>
      </div>
    ) : (
      queueItems.map((item, index) => (
        <QueueItemCard
          key={item.id}
          item={item}
          index={index}
          onExecute={() => executeQueueItem(item.id)}
          onCancel={() => cancelQueueItem(item.id)}
          onEdit={() => editQueueItem(item.id)}
          onMoveUp={() => moveQueueItem(item.id, 'up')}
          onMoveDown={() => moveQueueItem(item.id, 'down')}
        />
      ))
    )}
  </div>
  
  {/* Queue Controls (if items exist) */}
  {queueItems.length > 0 && (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={executeAllPending}
        disabled={!hasPendingItems}
        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:bg-slate-300 flex items-center justify-center gap-1.5"
      >
        <Play className="w-3.5 h-3.5" />
        Ejecutar Todo
      </button>
      
      <button
        onClick={clearCompleted}
        disabled={!hasCompletedItems}
        className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-50 disabled:text-slate-400"
      >
        Limpiar
      </button>
    </div>
  )}
</div>
```

---

### 2. Queue Item Card

```typescript
interface QueueItemCardProps {
  item: MessageQueueItem;
  index: number;
  onExecute: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QueueItemCard({ item, index, onExecute, onCancel, onEdit, onMoveUp, onMoveDown }: QueueItemCardProps) {
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
  
  return (
    <div className={`
      border rounded-lg p-2 transition-all
      ${item.status === 'processing' ? 'border-blue-400 bg-blue-50' :
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
          
          {/* Title or Message Preview */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">
              {item.title || item.message.substring(0, 40) + '...'}
            </p>
            {item.title && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {item.message.substring(0, 50)}...
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
      
      {/* Dependencies (if any) */}
      {item.dependsOn && item.dependsOn.length > 0 && (
        <div className="mb-2 flex items-center gap-1 text-[10px] text-slate-500">
          <Link2 className="w-3 h-3" />
          <span>Depende de {item.dependsOn.length} tarea(s)</span>
        </div>
      )}
      
      {/* Progress (if processing) */}
      {item.status === 'processing' && item.startedAt && (
        <div className="mb-2 text-[10px] text-blue-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Procesando: {formatDuration(Date.now() - item.startedAt.getTime())}</span>
        </div>
      )}
      
      {/* Error (if failed) */}
      {item.status === 'failed' && item.errorMessage && (
        <div className="mb-2 p-2 bg-red-100 border border-red-200 rounded text-[10px] text-red-800">
          <p className="font-medium">Error:</p>
          <p>{item.errorMessage}</p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between gap-2 mt-2">
        {/* Left side - Execution actions */}
        <div className="flex items-center gap-1">
          {item.status === 'pending' && (
            <>
              <button
                onClick={onExecute}
                className="px-2 py-1 bg-green-600 text-white rounded text-[10px] font-medium hover:bg-green-700 flex items-center gap-1"
                title="Ejecutar ahora"
              >
                <Play className="w-3 h-3" />
                Ejecutar
              </button>
              
              <button
                onClick={onEdit}
                className="px-2 py-1 border border-slate-300 rounded text-[10px] hover:bg-slate-50"
                title="Editar"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </>
          )}
          
          {item.status === 'processing' && (
            <button
              onClick={onCancel}
              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-medium hover:bg-red-700 flex items-center gap-1"
              title="Cancelar"
            >
              <StopCircle className="w-3 h-3" />
              Cancelar
            </button>
          )}
          
          {item.status === 'completed' && (
            <button
              onClick={() => navigateToMessage(item.assistantMessageId)}
              className="px-2 py-1 border border-green-300 text-green-700 rounded text-[10px] hover:bg-green-50 flex items-center gap-1"
              title="Ver respuesta"
            >
              <Eye className="w-3 h-3" />
              Ver
            </button>
          )}
          
          {item.status === 'failed' && (
            <button
              onClick={onExecute}
              className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-medium hover:bg-blue-700 flex items-center gap-1"
              title="Reintentar"
            >
              <RotateCw className="w-3 h-3" />
              Reintentar
            </button>
          )}
        </div>
        
        {/* Right side - Position & delete */}
        <div className="flex items-center gap-1">
          {item.status === 'pending' && (
            <>
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-1 text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                title="Subir"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={onMoveDown}
                className="p-1 text-slate-500 hover:text-slate-700"
                title="Bajar"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          
          <button
            onClick={onCancel}
            className="p-1 text-red-500 hover:text-red-700"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Add to Queue Modal

```typescript
interface AddToQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  onAdd: (item: Partial<MessageQueueItem>) => void;
}

function AddToQueueModal({ isOpen, onClose, conversationId, userId, onAdd }: AddToQueueModalProps) {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(5);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [captureContext, setCaptureContext] = useState(true);
  
  const handleSubmit = () => {
    const queueItem: Partial<MessageQueueItem> = {
      userId,
      conversationId,
      message,
      title: title || undefined,
      description: description || undefined,
      status: 'pending',
      executionMode: queueConfig.executionMode,
      priority,
      dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
      position: existingQueueItems.length, // Add to end
      
      // Capture current context if requested
      contextSnapshot: captureContext ? {
        activeSourceIds: contextSources.filter(s => s.enabled).map(s => s.id),
        model: userConfig.model,
        systemPrompt: userConfig.systemPrompt,
      } : undefined,
    };
    
    onAdd(queueItem);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar a Cola de Tareas">
      <div className="space-y-4">
        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pregunta/Tarea <span className="text-red-600">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="¿Qué deseas que el agente procese?"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>
        
        {/* Optional Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Título (Opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Analizar documento legal"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Optional Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Descripción (Opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas adicionales sobre esta tarea"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
        
        {/* Priority Slider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
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
        
        {/* Capture Context Option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="captureContext"
            checked={captureContext}
            onChange={(e) => setCaptureContext(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="captureContext" className="text-sm text-slate-700">
            Capturar contexto actual (fuentes, modelo, prompt)
          </label>
        </div>
        
        {captureContext && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-slate-700">
            <p className="font-medium mb-2">Contexto que se capturará:</p>
            <ul className="space-y-1">
              <li>• Modelo: <span className="font-semibold">{userConfig.model}</span></li>
              <li>• Fuentes activas: <span className="font-semibold">
                {contextSources.filter(s => s.enabled).length}
              </span></li>
              <li>• System prompt: <span className="font-semibold">
                {userConfig.systemPrompt.substring(0, 30)}...
              </span></li>
            </ul>
          </div>
        )}
        
        {/* Dependencies (Advanced - Collapsible) */}
        {existingQueueItems.length > 0 && (
          <details className="border border-slate-200 rounded-lg">
            <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50">
              Dependencias (Avanzado)
            </summary>
            <div className="p-3 border-t border-slate-200 space-y-2">
              <p className="text-xs text-slate-600 mb-2">
                Esta tarea se ejecutará solo después de que se completen las siguientes:
              </p>
              {existingQueueItems.filter(i => i.status !== 'completed').map(existingItem => (
                <label key={existingItem.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dependsOn.includes(existingItem.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDependsOn([...dependsOn, existingItem.id]);
                      } else {
                        setDependsOn(dependsOn.filter(id => id !== existingItem.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-xs text-slate-700">
                    {existingItem.title || existingItem.message.substring(0, 40)}...
                  </span>
                </label>
              ))}
            </div>
          </details>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancelar
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar a Cola
        </button>
      </div>
    </Modal>
  );
}
```

---

### 4. Queue Settings (in Agent Configuration Modal)

Add a new tab in `AgentConfigurationModal`:

```typescript
{/* Queue Settings Tab */}
<TabPanel>
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-800 mb-4">
      Configuración de Cola
    </h3>
    
    {/* Auto-Execute Toggle */}
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
      <div>
        <p className="font-medium text-slate-800">Auto-ejecución</p>
        <p className="text-xs text-slate-600">
          Ejecutar automáticamente tareas pendientes una por una
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={queueConfig.autoExecute}
          onChange={(e) => updateQueueConfig({ autoExecute: e.target.checked })}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-checked:bg-green-600 rounded-full"></div>
      </label>
    </div>
    
    {/* Concurrent Limit */}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Límite de ejecución concurrente
      </label>
      <select
        value={queueConfig.concurrentLimit}
        onChange={(e) => updateQueueConfig({ concurrentLimit: Number(e.target.value) })}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
      >
        <option value="1">1 tarea a la vez (secuencial)</option>
        <option value="2">2 tareas simultáneas</option>
        <option value="3">3 tareas simultáneas</option>
        <option value="5">5 tareas simultáneas</option>
      </select>
      <p className="text-xs text-slate-500 mt-1">
        ⚠️ Más de 1 puede consumir tokens más rápido
      </p>
    </div>
    
    {/* Error Handling */}
    <div>
      <p className="font-medium text-slate-800 mb-2">Manejo de errores</p>
      
      <label className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={queueConfig.pauseOnError}
          onChange={(e) => updateQueueConfig({ pauseOnError: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-slate-700">
          Pausar cola si una tarea falla
        </span>
      </label>
      
      <label className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={queueConfig.retryOnError}
          onChange={(e) => updateQueueConfig({ retryOnError: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-slate-700">
          Reintentar automáticamente tareas fallidas
        </span>
      </label>
      
      {queueConfig.retryOnError && (
        <div className="ml-6 mt-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Máximo de reintentos
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={queueConfig.maxRetries}
            onChange={(e) => updateQueueConfig({ maxRetries: Number(e.target.value) })}
            className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
          />
        </div>
      )}
    </div>
    
    {/* Feedback Handling */}
    <div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={queueConfig.pauseOnFeedback}
          onChange={(e) => updateQueueConfig({ pauseOnFeedback: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-slate-700">
          Pausar cola si el AI solicita más información
        </span>
      </label>
    </div>
    
    {/* Notifications */}
    <div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={queueConfig.notifyOnComplete}
          onChange={(e) => updateQueueConfig({ notifyOnComplete: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-slate-700">
          Notificar cuando la cola termine
        </span>
      </label>
    </div>
  </div>
</TabPanel>
```

---

## 🔄 Queue Execution Logic

### Queue Processor

```typescript
class QueueProcessor {
  private conversationId: string;
  private userId: string;
  private config: QueueConfig;
  private processing = new Set<string>(); // Currently processing item IDs
  
  constructor(conversationId: string, userId: string, config: QueueConfig) {
    this.conversationId = conversationId;
    this.userId = userId;
    this.config = config;
  }
  
  /**
   * Main queue processing loop
   * Runs continuously when auto-execute is enabled
   */
  async processQueue() {
    if (!this.config.autoExecute) {
      console.log('⏸️ Queue auto-execute disabled');
      return;
    }
    
    while (true) {
      // Get next items to execute
      const nextItems = await this.getNextExecutableItems();
      
      if (nextItems.length === 0) {
        console.log('✅ Queue empty or all items blocked');
        break;
      }
      
      // Execute items (respecting concurrent limit)
      const itemsToExecute = nextItems.slice(0, this.config.concurrentLimit);
      
      console.log(`🚀 Executing ${itemsToExecute.length} queue items`);
      
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
    }
    
    // Queue finished
    if (this.config.notifyOnComplete) {
      this.notifyQueueComplete();
    }
  }
  
  /**
   * Get items that can be executed right now
   * Considers: status, dependencies, scheduled time
   */
  async getNextExecutableItems(): Promise<MessageQueueItem[]> {
    // Query Firestore for pending items in this conversation
    const snapshot = await firestore
      .collection('message_queue')
      .where('conversationId', '==', this.conversationId)
      .where('status', '==', 'pending')
      .orderBy('priority', 'desc')  // Higher priority first
      .orderBy('position', 'asc')   // Then by position
      .get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MessageQueueItem[];
    
    // Filter out items with unmet dependencies
    const executable = items.filter(item => {
      // Check if all dependencies are completed
      if (item.dependsOn && item.dependsOn.length > 0) {
        return item.dependsOn.every(depId => 
          this.isItemCompleted(depId)
        );
      }
      
      // Check scheduled time (future feature)
      if (item.scheduledFor && item.scheduledFor > new Date()) {
        return false;
      }
      
      return true;
    });
    
    return executable;
  }
  
  /**
   * Execute a single queue item
   */
  async executeItem(item: MessageQueueItem): Promise<void> {
    const itemId = item.id;
    
    try {
      // Mark as processing
      this.processing.add(itemId);
      await this.updateItemStatus(itemId, 'processing', {
        startedAt: new Date()
      });
      
      console.log(`⚙️ Executing queue item: ${itemId}`);
      
      // Use captured context or current context
      const contextToUse = item.contextSnapshot || {
        activeSourceIds: [], // Current active sources
        model: userConfig.model,
        systemPrompt: userConfig.systemPrompt,
      };
      
      // Send message to agent API
      const response = await fetch(
        `/api/conversations/${this.conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.userId,
            message: item.message,
            model: contextToUse.model,
            systemPrompt: contextToUse.systemPrompt,
            activeSourceIds: contextToUse.activeSourceIds,
            queueItemId: itemId, // Tag message as from queue
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Check if AI requested feedback
      const needsFeedback = this.detectFeedbackRequest(result.assistantMessage.content);
      
      if (needsFeedback && this.config.pauseOnFeedback) {
        console.log('⚠️ Queue paused - AI requested feedback');
        await this.pauseQueue();
      }
      
      // Mark as completed
      await this.updateItemStatus(itemId, 'completed', {
        completedAt: new Date(),
        executionTimeMs: Date.now() - item.startedAt!.getTime(),
        userMessageId: result.userMessage.id,
        assistantMessageId: result.assistantMessage.id,
      });
      
      console.log(`✅ Queue item completed: ${itemId}`);
      
    } catch (error) {
      console.error(`❌ Queue item failed: ${itemId}`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if should retry
      if (this.config.retryOnError && (item.retryCount || 0) < this.config.maxRetries) {
        // Retry
        await this.updateItemStatus(itemId, 'pending', {
          retryCount: (item.retryCount || 0) + 1,
          lastError: errorMessage,
        });
      } else {
        // Mark as failed
        await this.updateItemStatus(itemId, 'failed', {
          completedAt: new Date(),
          errorMessage,
        });
      }
      
      throw error; // Re-throw for Promise.allSettled
      
    } finally {
      this.processing.delete(itemId);
    }
  }
  
  /**
   * Update queue item status
   */
  async updateItemStatus(
    itemId: string, 
    status: QueueItemStatus, 
    updates: Partial<MessageQueueItem> = {}
  ) {
    await firestore
      .collection('message_queue')
      .doc(itemId)
      .update({
        status,
        updatedAt: new Date(),
        ...updates,
      });
  }
  
  /**
   * Check if item is completed
   */
  async isItemCompleted(itemId: string): Promise<boolean> {
    const doc = await firestore
      .collection('message_queue')
      .doc(itemId)
      .get();
    
    return doc.exists && doc.data()?.status === 'completed';
  }
  
  /**
   * Detect if AI response requests feedback
   */
  detectFeedbackRequest(content: string): boolean {
    const feedbackKeywords = [
      'necesito más información',
      'por favor proporciona',
      'podrías aclarar',
      'could you provide',
      'please provide',
      'more information needed',
    ];
    
    const lowerContent = content.toLowerCase();
    return feedbackKeywords.some(keyword => lowerContent.includes(keyword));
  }
  
  /**
   * Pause queue execution
   */
  async pauseQueue() {
    await firestore
      .collection('queue_configs')
      .doc(this.conversationId)
      .update({
        autoExecute: false,
        updatedAt: new Date(),
      });
  }
  
  /**
   * Notify user queue is complete
   */
  notifyQueueComplete() {
    playNotificationSound();
    showToast('Cola de tareas completada', 'success');
  }
}
```

---

## 🌐 API Endpoints

### 1. GET /api/queue?conversationId={id}

**Purpose:** List all queue items for a conversation

```typescript
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');
  const userId = url.searchParams.get('userId');
  
  if (!conversationId || !userId) {
    return new Response(
      JSON.stringify({ error: 'conversationId and userId required' }),
      { status: 400 }
    );
  }
  
  // Get queue items
  const snapshot = await firestore
    .collection('message_queue')
    .where('conversationId', '==', conversationId)
    .where('userId', '==', userId)
    .orderBy('position', 'asc')
    .get();
  
  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    startedAt: doc.data().startedAt?.toDate(),
    completedAt: doc.data().completedAt?.toDate(),
  }));
  
  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

### 2. POST /api/queue

**Purpose:** Add item to queue

```typescript
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const {
    userId,
    conversationId,
    message,
    title,
    description,
    priority = 5,
    dependsOn,
    contextSnapshot,
  } = body;
  
  if (!userId || !conversationId || !message) {
    return new Response(
      JSON.stringify({ error: 'userId, conversationId, and message required' }),
      { status: 400 }
    );
  }
  
  // Get current queue length to determine position
  const existingSnapshot = await firestore
    .collection('message_queue')
    .where('conversationId', '==', conversationId)
    .where('userId', '==', userId)
    .get();
  
  const position = existingSnapshot.size;
  
  // Create queue item
  const queueItem: Omit<MessageQueueItem, 'id'> = {
    userId,
    conversationId,
    message,
    title: title || undefined,
    description: description || undefined,
    status: 'pending',
    executionMode: 'auto', // Will use queue config
    position,
    priority,
    dependsOn: dependsOn || undefined,
    contextSnapshot: contextSnapshot || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: getEnvironmentSource(),
  };
  
  const docRef = await firestore
    .collection('message_queue')
    .add(queueItem);
  
  console.log('✅ Queue item added:', docRef.id);
  
  // Trigger queue processing if auto-execute enabled
  const queueConfig = await getQueueConfig(conversationId);
  if (queueConfig?.autoExecute) {
    // Non-blocking - process in background
    processQueue(conversationId, userId, queueConfig).catch(console.error);
  }
  
  return new Response(
    JSON.stringify({ id: docRef.id, ...queueItem }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3. PUT /api/queue/:id

**Purpose:** Update queue item (edit message, change priority, reorder)

```typescript
export const PUT: APIRoute = async ({ params, request }) => {
  const itemId = params.id;
  const updates = await request.json();
  
  // Only allow updating certain fields
  const allowedUpdates = {
    message: updates.message,
    title: updates.title,
    description: updates.description,
    priority: updates.priority,
    position: updates.position,
    dependsOn: updates.dependsOn,
    status: updates.status,
    updatedAt: new Date(),
  };
  
  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
  );
  
  await firestore
    .collection('message_queue')
    .doc(itemId)
    .update(cleanUpdates);
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 4. DELETE /api/queue/:id

**Purpose:** Remove item from queue

```typescript
export const DELETE: APIRoute = async ({ params }) => {
  const itemId = params.id;
  
  await firestore
    .collection('message_queue')
    .doc(itemId)
    .delete();
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 5. POST /api/queue/:id/execute

**Purpose:** Execute a specific queue item immediately

```typescript
export const POST: APIRoute = async ({ params, request }) => {
  const itemId = params.id;
  const { userId } = await request.json();
  
  // Get queue item
  const doc = await firestore
    .collection('message_queue')
    .doc(itemId)
    .get();
  
  if (!doc.exists) {
    return new Response(
      JSON.stringify({ error: 'Queue item not found' }),
      { status: 404 }
    );
  }
  
  const item = { id: doc.id, ...doc.data() } as MessageQueueItem;
  
  // Check dependencies
  if (item.dependsOn && item.dependsOn.length > 0) {
    const unmetDeps = await checkUnmetDependencies(item.dependsOn);
    if (unmetDeps.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Dependencies not met',
          unmetDependencies: unmetDeps 
        }),
        { status: 400 }
      );
    }
  }
  
  // Execute item
  const processor = new QueueProcessor(
    item.conversationId,
    userId,
    await getQueueConfig(item.conversationId)
  );
  
  await processor.executeItem(item);
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 6. GET /api/queue/config?conversationId={id}

**Purpose:** Get queue configuration

```typescript
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get('conversationId');
  
  if (!conversationId) {
    return new Response(
      JSON.stringify({ error: 'conversationId required' }),
      { status: 400 }
    );
  }
  
  const config = await getQueueConfig(conversationId);
  
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

### 7. PUT /api/queue/config

**Purpose:** Update queue configuration

```typescript
export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { conversationId, ...configUpdates } = body;
  
  if (!conversationId) {
    return new Response(
      JSON.stringify({ error: 'conversationId required' }),
      { status: 400 }
    );
  }
  
  await firestore
    .collection('queue_configs')
    .doc(conversationId)
    .set({
      ...configUpdates,
      updatedAt: new Date(),
    }, { merge: true });
  
  // If auto-execute was enabled, trigger processing
  if (configUpdates.autoExecute) {
    const config = await getQueueConfig(conversationId);
    processQueue(conversationId, body.userId, config).catch(console.error);
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

## 📈 Queue Analytics

### Track Queue Metrics

```typescript
interface QueueMetrics {
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
```

### Update Metrics on Each Execution

```typescript
async function updateQueueMetrics(conversationId: string, item: MessageQueueItem) {
  const metricsRef = firestore
    .collection('queue_metrics')
    .doc(conversationId);
  
  const doc = await metricsRef.get();
  const current = doc.data() || {};
  
  const updates = {
    totalItemsQueued: (current.totalItemsQueued || 0) + 1,
    completedItems: item.status === 'completed' 
      ? (current.completedItems || 0) + 1 
      : current.completedItems,
    failedItems: item.status === 'failed'
      ? (current.failedItems || 0) + 1
      : current.failedItems,
    lastExecutedAt: item.completedAt,
    updatedAt: new Date(),
  };
  
  await metricsRef.set(updates, { merge: true });
}
```

---

## 🎮 User Workflows

### Workflow 1: Research Planning

```
User opens Agent "Research Assistant"
  ↓
Clicks "+" in Queue Panel
  ↓
Adds 5 prompts:
  1. "Analiza tendencias de IA en 2025" [Prioridad: 8]
  2. "Compara GPT-4 vs Claude 3" [Prioridad: 7]
  3. "Resume papers de NeurIPS 2024" [Prioridad: 6]
  4. "Identifica startups emergentes" [Prioridad: 5]
  5. "Crea informe ejecutivo" [Prioridad: 10, Depende de: 1,2,3,4]
  ↓
Enables auto-execute
  ↓
Queue processes:
  - Starts with #5 (priority 10) but PAUSES (dependencies)
  - Executes #1 (priority 8) [🔔 completes]
  - Executes #2 (priority 7) [🔔 completes]
  - Executes #3 (priority 6) [🔔 completes]
  - Executes #4 (priority 5) [🔔 completes]
  - NOW executes #5 (all dependencies met) [🔔 completes]
  ↓
User receives notification: "Cola completada - 5 tareas ejecutadas"
```

---

### Workflow 2: Batch Question Processing

```
User has 20 questions from a document
  ↓
Opens "Add to Queue"
  ↓
Pastes all 20 questions (one per line)
  ↓
System detects multi-line input:
  "¿Crear 20 tareas en cola?"
  ↓
User confirms
  ↓
20 queue items created automatically
  ↓
User sets: Auto-execute ON, Concurrent: 3
  ↓
Queue processes 3 at a time:
  - Items 1,2,3 start simultaneously
  - Item 1 finishes [🔔]
  - Item 4 starts (maintaining 3 concurrent)
  - Items 2,3 finish [🔔🔔]
  - Items 5,6 start
  - ... continues until all 20 complete
  ↓
All questions answered in ~10 minutes
(vs 30+ minutes if sequential)
```

---

### Workflow 3: Manual Step-by-Step

```
User planning complex analysis
  ↓
Adds 10 tasks to queue
  ↓
Sets: Auto-execute OFF (manual mode)
  ↓
Reviews queue items
  ↓
Clicks "Ejecutar" on item #1
  ↓
Reviews AI response
  ↓
If satisfactory: Clicks "Ejecutar" on item #2
If needs refinement: Edits item #2, then executes
  ↓
Continues manually through queue
  ↓
Full control over each step
```

---

## 💡 Advanced Features

### Queue Templates

```typescript
interface QueueTemplate {
  id: string;
  name: string;
  description: string;
  items: Array<{
    message: string;
    title?: string;
    priority: number;
    dependsOn?: number[]; // Indices of dependent items
  }>;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
}

// Example templates:
- "Análisis Competitivo" (5 preguntas estándar)
- "Revisión de Documento Legal" (10 pasos)
- "Research de Mercado" (15 preguntas)
```

**Usage:**
```
User clicks "Plantillas de Cola"
  ↓
Selects "Análisis Competitivo"
  ↓
5 items added to queue instantly
  ↓
User can customize before executing
```

---

### Bulk Import from Text

```typescript
function parseBulkQuestions(text: string): Array<{ message: string }> {
  // Split by newlines
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Each line becomes a queue item
  return lines.map((line, index) => ({
    message: line,
    priority: 5,
    position: index,
  }));
}

// In Add to Queue Modal:
<textarea
  placeholder="Pega múltiples preguntas (una por línea)"
  onChange={(e) => {
    const lines = e.target.value.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      setBulkMode(true);
      setBulkCount(lines.length);
    }
  }}
/>

{bulkMode && (
  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
    <p className="text-sm font-medium text-blue-800">
      📋 Modo bulk detectado: {bulkCount} tareas
    </p>
    <p className="text-xs text-blue-600 mt-1">
      Se crearán {bulkCount} items en la cola
    </p>
  </div>
)}
```

---

### Export Queue Results

```typescript
async function exportQueueResults(conversationId: string) {
  // Get completed queue items
  const snapshot = await firestore
    .collection('message_queue')
    .where('conversationId', '==', conversationId)
    .where('status', '==', 'completed')
    .orderBy('completedAt', 'desc')
    .get();
  
  const items = snapshot.docs.map(doc => doc.data());
  
  // Get associated messages
  const messageIds = items
    .map(item => [item.userMessageId, item.assistantMessageId])
    .flat()
    .filter(Boolean);
  
  const messages = await getMessagesByIds(messageIds);
  
  // Format as Markdown
  const markdown = formatQueueResultsAsMarkdown(items, messages);
  
  // Download
  downloadAsFile(markdown, `queue-results-${conversationId}.md`);
}

function formatQueueResultsAsMarkdown(items, messages): string {
  let md = `# Queue Results - ${new Date().toLocaleDateString()}\n\n`;
  
  items.forEach((item, index) => {
    md += `## ${index + 1}. ${item.title || 'Query'}\n\n`;
    md += `**Question:** ${item.message}\n\n`;
    
    const response = messages.find(m => m.id === item.assistantMessageId);
    if (response) {
      md += `**Answer:**\n${response.content.text}\n\n`;
    }
    
    md += `**Executed:** ${item.completedAt?.toLocaleString()}\n`;
    md += `**Duration:** ${item.executionTimeMs}ms\n\n`;
    md += `---\n\n`;
  });
  
  return md;
}
```

---

## 🔔 Notifications & Alerts

### Queue Events

```typescript
type QueueEvent =
  | 'item_added'
  | 'item_started'
  | 'item_completed'
  | 'item_failed'
  | 'queue_completed'
  | 'queue_paused'
  | 'dependency_met';

interface QueueNotification {
  event: QueueEvent;
  conversationId: string;
  itemId?: string;
  message: string;
  timestamp: Date;
}
```

### Notification UI

```typescript
// Toast notification
function showQueueNotification(notification: QueueNotification) {
  const config = {
    item_added: { icon: Plus, color: 'blue', sound: false },
    item_started: { icon: Play, color: 'blue', sound: false },
    item_completed: { icon: CheckCircle, color: 'green', sound: true },
    item_failed: { icon: XCircle, color: 'red', sound: true },
    queue_completed: { icon: CheckCircle, color: 'green', sound: true },
    queue_paused: { icon: Pause, color: 'yellow', sound: true },
    dependency_met: { icon: Link2, color: 'blue', sound: false },
  };
  
  const { icon: Icon, color, sound } = config[notification.event];
  
  if (sound) {
    playNotificationSound();
  }
  
  showToast(
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 text-${color}-600`} />
      <span>{notification.message}</span>
    </div>,
    color
  );
}
```

---

## 📊 Queue Status Dashboard

### Visual Queue Overview

```typescript
<div className="p-4 bg-white border border-slate-200 rounded-lg">
  <h3 className="text-lg font-bold text-slate-800 mb-4">Estado de Cola</h3>
  
  {/* Summary Cards */}
  <div className="grid grid-cols-3 gap-4 mb-4">
    <div className="p-3 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-600">Pendientes</p>
      <p className="text-2xl font-bold text-slate-800">
        {queueMetrics.currentQueueDepth}
      </p>
    </div>
    
    <div className="p-3 bg-blue-50 rounded-lg">
      <p className="text-xs text-blue-600">Procesando</p>
      <p className="text-2xl font-bold text-blue-800">
        {queueItems.filter(i => i.status === 'processing').length}
      </p>
    </div>
    
    <div className="p-3 bg-green-50 rounded-lg">
      <p className="text-xs text-green-600">Completadas</p>
      <p className="text-2xl font-bold text-green-800">
        {queueMetrics.completedItems}
      </p>
    </div>
  </div>
  
  {/* Progress Bar */}
  {queueItems.length > 0 && (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600">Progreso General</span>
        <span className="font-semibold text-slate-800">
          {Math.round((queueMetrics.completedItems / queueMetrics.totalItemsQueued) * 100)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(queueMetrics.completedItems / queueMetrics.totalItemsQueued) * 100}%` }}
        />
      </div>
    </div>
  )}
  
  {/* Success Rate */}
  <div className="flex items-center justify-between text-xs text-slate-600">
    <span>Tasa de éxito:</span>
    <span className={`font-semibold ${
      queueMetrics.successRate > 90 ? 'text-green-600' :
      queueMetrics.successRate > 75 ? 'text-yellow-600' :
      'text-red-600'
    }`}>
      {queueMetrics.successRate.toFixed(1)}%
    </span>
  </div>
  
  {/* Average Execution Time */}
  <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
    <span>Tiempo promedio:</span>
    <span className="font-semibold text-slate-800">
      {formatDuration(queueMetrics.averageExecutionTime)}
    </span>
  </div>
</div>
```

---

## 🚀 Quick Actions

### Add Current Input to Queue

In the main chat input area:

```typescript
<div className="flex gap-2">
  <textarea
    value={input}
    onChange={handleInputChange}
    placeholder="Escribe tu mensaje..."
    className="flex-1 px-4 py-3 border rounded-lg"
  />
  
  <div className="flex flex-col gap-2">
    {/* Send Now */}
    <button
      onClick={handleSend}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      <Send className="w-5 h-5" />
    </button>
    
    {/* Add to Queue */}
    <button
      onClick={() => addCurrentInputToQueue()}
      disabled={!input.trim()}
      className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:text-slate-300"
      title="Agregar a cola"
    >
      <ListTodo className="w-5 h-5" />
    </button>
  </div>
</div>
```

---

## 🔒 Security & Privacy

### User Isolation

```typescript
// ALWAYS filter queue by userId
const queueItems = await firestore
  .collection('message_queue')
  .where('conversationId', '==', conversationId)
  .where('userId', '==', userId) // CRITICAL: User isolation
  .orderBy('position', 'asc')
  .get();
```

### Queue Access Control

```typescript
// Verify user owns conversation before accessing queue
const conversation = await getConversation(conversationId);
if (conversation.userId !== userId) {
  return new Response(
    JSON.stringify({ error: 'Forbidden' }),
    { status: 403 }
  );
}
```

---

## 📋 Implementation Checklist

### Phase 1: Core Queue System (Week 1)
- [ ] Create Firestore collections (`message_queue`, `queue_configs`)
- [ ] Create TypeScript interfaces
- [ ] Implement CRUD API endpoints
- [ ] Build Queue Panel UI component
- [ ] Build Add to Queue Modal
- [ ] Implement Queue Item Card
- [ ] Basic execution logic (manual mode)

### Phase 2: Auto-Execution (Week 2)
- [ ] Implement QueueProcessor class
- [ ] Add dependency resolution
- [ ] Add concurrent execution
- [ ] Add retry logic
- [ ] Add pause/resume functionality
- [ ] Integration with existing message API

### Phase 3: Advanced Features (Week 3)
- [ ] Queue templates
- [ ] Bulk import from text
- [ ] Export queue results
- [ ] Queue analytics dashboard
- [ ] Queue metrics tracking
- [ ] Notifications system

### Phase 4: Polish & Testing (Week 4)
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] User guide
- [ ] Performance optimization
- [ ] Error handling edge cases
- [ ] Migration script (if needed)

---

## 🎯 Success Metrics

**User Experience:**
- ✅ Users can queue 10+ prompts in <1 minute
- ✅ Clear visual feedback on queue status
- ✅ Zero confusion about execution order
- ✅ Easy to reorder/edit queue items

**Technical:**
- ✅ Queue processing handles 100+ items
- ✅ Concurrent execution works reliably
- ✅ Dependency resolution is correct
- ✅ Error handling prevents queue corruption
- ✅ All operations logged for debugging

**Business:**
- ✅ Increases user productivity (batch work)
- ✅ Reduces context switching
- ✅ Professional feature (vs competitors)
- ✅ Enables complex workflows

---

## 🔮 Future Enhancements

### Scheduled Execution
```typescript
scheduledFor: new Date('2025-11-01 09:00:00')
// Execute this item at specific time
```

### Recurring Tasks
```typescript
recurrence: {
  frequency: 'daily' | 'weekly' | 'monthly',
  interval: number,
  endDate?: Date,
}
```

### Multi-Agent Queues
```typescript
// Send same prompt to multiple agents
agentIds: ['agent-1', 'agent-2', 'agent-3']
// Compare responses
```

### Queue Sharing
```typescript
// Share queue template with team
sharedWith: ['user-a', 'user-b']
accessLevel: 'view' | 'edit'
```

---

## 📚 References

### Internal Rules
- `.cursor/rules/alignment.mdc` - Data persistence, user experience
- `.cursor/rules/data.mdc` - Schema design, Firestore patterns
- `.cursor/rules/agents.mdc` - Agent architecture
- `.cursor/rules/privacy.mdc` - User data isolation

### Related Features
- `PARALLEL_AGENTS_COMPLETE_2025-10-15.md` - Parallel execution foundation
- `docs/features/context-management-2025-10-13.md` - Context snapshot pattern

### External Resources
- [Task Queue Patterns](https://cloud.google.com/tasks/docs/queue-yaml)
- [Priority Queue Algorithm](https://en.wikipedia.org/wiki/Priority_queue)

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Status:** 🎯 Design Complete - Ready for Implementation  
**Backward Compatible:** ✅ Yes (all new collections/fields)  
**Aligned With:** alignment.mdc, data.mdc, agents.mdc, privacy.mdc

---

**Remember:** A queue system should feel invisible when not needed, powerful when used. Start simple (manual execution), then add auto-execution, then advanced features based on user feedback.










