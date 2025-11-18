# Queue System Quick Reference

**Version:** 1.0.0  
**Last Updated:** 2025-10-31

---

## 🚀 Quick Start

### Add Queue to Agent (One Line)

```typescript
import QueuePanel from './QueuePanel';

// In ChatInterfaceWorking.tsx, after ContextManager:
<QueuePanel
  conversationId={currentConversation}
  userId={currentUser.id}
  currentContext={{ activeSourceIds, model, systemPrompt }}
  onMessageNavigate={(id) => document.getElementById(`message-${id}`)?.scrollIntoView()}
/>
```

---

## 📡 API Cheat Sheet

```bash
# List queue items
GET /api/queue?conversationId={id}&userId={userId}

# Add single item
POST /api/queue
Body: { userId, conversationId, message, priority?, title? }

# Bulk add (paste multi-line text)
POST /api/queue/bulk-add
Body: { userId, conversationId, bulkText, basePriority? }

# Execute item
POST /api/queue/{id}/execute
Body: { userId }

# Update item
PUT /api/queue/{id}
Body: { message?, priority?, position?, status? }

# Delete item
DELETE /api/queue/{id}

# Get config
GET /api/queue/config?conversationId={id}&userId={userId}

# Update config
PUT /api/queue/config
Body: { conversationId, userId, autoExecute?, concurrentLimit? }

# Get metrics
GET /api/queue/metrics?conversationId={id}&userId={userId}
```

---

## 🗄️ Data Structures

### Queue Item (Minimal)

```typescript
{
  userId: string,
  conversationId: string,
  message: string,
  status: 'pending',
  position: 0,
  priority: 5,
}
```

### Queue Item (Full)

```typescript
{
  id: string,
  userId: string,
  conversationId: string,
  message: string,
  title?: string,
  description?: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  position: number,
  priority: number, // 1-10
  dependsOn?: string[], // Item IDs
  contextSnapshot?: {
    activeSourceIds: string[],
    model: string,
    systemPrompt: string,
  },
  userMessageId?: string,
  assistantMessageId?: string,
  errorMessage?: string,
  createdAt: Date,
  startedAt?: Date,
  completedAt?: Date,
  executionTimeMs?: number,
}
```

### Queue Config (Default)

```typescript
{
  conversationId: string,
  userId: string,
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

### QueuePanel Props

```typescript
<QueuePanel
  conversationId={string}           // Agent ID
  userId={string}                   // Current user
  currentContext={{                 // Current agent context
    activeSourceIds: string[],
    model: string,
    systemPrompt: string,
  }}
  onMessageNavigate={(id) => void} // Scroll to message
/>
```

---

## ⚙️ Queue Processor

### Manual Usage

```typescript
import { QueueProcessor } from '../lib/queue-processor';

const processor = new QueueProcessor(conversationId, userId, queueConfig);

// Process all executable items
await processor.processQueue(queueItems);

// Get stats
const stats = processor.getStats(queueItems);
// → { pending, processing, completed, failed, successRate, ... }
```

### React Hook

```typescript
import { useQueueProcessor } from '../lib/queue-processor';

const { processQueue, getStats } = useQueueProcessor(
  conversationId,
  userId,
  queueConfig
);

// Use in component
await processQueue(queueItems);
const stats = getStats(queueItems);
```

---

## 🔧 Common Operations

### Add Item Programmatically

```typescript
const response = await fetch('/api/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    conversationId: currentConversation,
    message: "Analyze this document",
    title: "Document Analysis",
    priority: 8,
    contextSnapshot: {
      activeSourceIds: ['source-1', 'source-2'],
      model: 'gemini-2.5-pro',
      systemPrompt: 'You are an expert analyst...',
    },
  })
});

const item = await response.json();
console.log('Added:', item.id);
```

---

### Execute Item Programmatically

```typescript
const response = await fetch(`/api/queue/${itemId}/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: currentUser.id })
});

const result = await response.json();
console.log('Executed:', result.success);
console.log('Time:', result.executionTimeMs, 'ms');
console.log('Response:', result.assistantMessageId);
```

---

### Bulk Add from Array

```typescript
const questions = [
  "What is AI?",
  "What is ML?",
  "What is DL?",
];

const response = await fetch('/api/queue/bulk-add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    conversationId: currentConversation,
    bulkText: questions.join('\n'),
    basePriority: 5,
    captureContext: true,
    contextSnapshot: currentContext,
  })
});

const result = await response.json();
console.log('Created:', result.itemsCreated, 'items');
```

---

### Enable Auto-Execute

```typescript
await fetch('/api/queue/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId,
    userId,
    autoExecute: true,
    concurrentLimit: 3, // Process 3 at once
  })
});
```

---

## 🔍 Debugging

### Check Queue Status

```javascript
// Browser console
async function checkQueue(conversationId, userId) {
  const response = await fetch(`/api/queue?conversationId=${conversationId}&userId=${userId}`);
  const data = await response.json();
  
  console.table(data.items.map(i => ({
    position: i.position,
    status: i.status,
    message: i.message.substring(0, 40),
    priority: i.priority,
  })));
  
  return data.items;
}
```

---

### View Firestore Data

```bash
# Firebase Console
open https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fmessage_queue

# Or via gcloud
gcloud firestore documents list message_queue --limit 10 --project gen-lang-client-0986191192
```

---

### Monitor Execution

```javascript
// Watch queue process in real-time
async function watchQueue(conversationId, userId) {
  while (true) {
    const items = await checkQueue(conversationId, userId);
    const processing = items.filter(i => i.status === 'processing');
    
    console.log(`⚙️ Processing: ${processing.length} items`);
    
    if (processing.length === 0 && items.every(i => i.status !== 'pending')) {
      console.log('✅ Queue complete!');
      break;
    }
    
    await new Promise(r => setTimeout(r, 2000)); // Check every 2s
  }
}
```

---

## 🐛 Common Issues

### Issue: Index Required

```
Error: 9 FAILED_PRECONDITION: The query requires an index
```

**Fix:**
```bash
firebase deploy --only firestore:indexes --project gen-lang-client-0986191192
```

---

### Issue: Queue Not Loading

**Check:**
1. conversationId is correct
2. userId is correct
3. Network tab shows 200 OK
4. Console shows "✅ Loaded X queue items"

**Fix:** Verify parameters, check auth

---

### Issue: Auto-Execute Not Starting

**Check:**
1. Config autoExecute: true
2. Items have status: pending
3. No unmet dependencies
4. QueueProcessor instantiated

**Fix:** Check config, reload page

---

## 📚 File Locations

```
Types:
  src/types/queue.ts

Backend:
  src/pages/api/queue/index.ts
  src/pages/api/queue/[id].ts
  src/pages/api/queue/[id]/execute.ts
  src/pages/api/queue/config.ts
  src/pages/api/queue/bulk-add.ts
  src/pages/api/queue/metrics.ts

Frontend:
  src/components/QueuePanel.tsx
  src/lib/queue-processor.ts

Database:
  firestore.indexes.json (lines 141-176)

Docs:
  docs/features/queue-system-2025-10-31.md
  docs/QUEUE_SYSTEM_TESTING_GUIDE.md
  docs/QUEUE_SYSTEM_INTEGRATION.md
  docs/QUEUE_SYSTEM_IMPLEMENTATION_SUMMARY.md
  docs/QUEUE_SYSTEM_COMPLETE.md
  docs/QUEUE_QUICK_REFERENCE.md (this file)

Rules:
  .cursor/rules/data.mdc (sections 15-17)
```

---

## 🎯 Status Badges

```typescript
// Use in UI to show queue status
const badges = {
  pending:    '⏰ Pendiente',
  processing: '🔄 Procesando',
  completed:  '✅ Completado',
  failed:     '❌ Fallido',
  cancelled:  '⏸️ Cancelado',
  paused:     '⏸️ Pausado',
};
```

---

## 🔢 Priority Levels

```
1-3:   Low priority (background tasks)
4-6:   Normal priority (default: 5)
7-9:   High priority (important)
10:    Critical (execute ASAP)
```

**Execution order:**
1. Priority (higher first)
2. Position (lower first)

---

## 🎨 Color Scheme

```typescript
const queueColors = {
  pending:    'slate',  // Gray
  processing: 'blue',   // Blue
  completed:  'green',  // Green
  failed:     'red',    // Red
  cancelled:  'amber',  // Amber
  paused:     'yellow', // Yellow
};
```

---

## ⌨️ Keyboard Shortcuts (Future)

```
Planned for v1.1:

Ctrl/Cmd + Q       Open add to queue modal
Ctrl/Cmd + Enter   Add to queue and close
Ctrl/Cmd + ↑       Move item up
Ctrl/Cmd + ↓       Move item down
Ctrl/Cmd + Del     Delete item
Ctrl/Cmd + E       Execute selected item
Ctrl/Cmd + A       Execute all
```

---

## 📞 Support

**Issues?** Check:
1. `docs/QUEUE_SYSTEM_TESTING_GUIDE.md` - Troubleshooting section
2. `docs/QUEUE_SYSTEM_INTEGRATION.md` - Common issues
3. Browser console for errors
4. Network tab for failed requests

**Questions?** Read:
1. `docs/features/queue-system-2025-10-31.md` - Complete spec
2. `.cursor/rules/data.mdc` - Schema reference

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Print this:** Tape to monitor for quick reference 📌














