# Queue System Testing Guide

**Date:** 2025-10-31  
**Version:** 1.0.0  
**Status:** 🧪 Testing Ready

---

## 🎯 Purpose

This guide provides step-by-step testing procedures for the queue system, covering all features and edge cases.

---

## 📋 Pre-Testing Setup

### 1. Start Development Server

```bash
# Ensure on main branch
git status

# Start server
npm run dev

# Verify running on port 3000
curl http://localhost:3000
```

### 2. Login as Test User

```bash
# Open browser
open http://localhost:3000/chat

# Login with test account
# Email: alec@getaifactory.com
```

### 3. Create Test Agent

```
1. Click "+ Nuevo Agente"
2. Rename to "Test Queue Agent"
3. Ready to test queue ✅
```

---

## 🧪 Test Cases

### Test 1: Basic Queue Operations

**Objective:** Verify basic CRUD operations work

**Steps:**
```
1. Open "Test Queue Agent"
2. Scroll to "Cola de Tareas" section (below context)
3. Verify empty state shows:
   - "No hay tareas en cola"
   - "Agrega prompts para ejecutar después"

4. Click "+" (Add to Queue)
5. Enter message: "¿Qué es inteligencia artificial?"
6. Click "Agregar a Cola"
7. ✅ Item appears in queue with:
   - Position #1
   - Status: Pendiente
   - Priority: 5 (default)

8. Click "Ejecutar" on the item
9. ✅ Status changes to "Procesando"
10. ✅ Timer appears: "Procesando: 2s... 5s..."
11. ✅ When complete:
    - Status: Completado
    - "Ver" button appears
    - Execution time shown

12. Click "Ver"
13. ✅ Scrolls to AI response in chat
```

**Expected:**
- ✅ Queue item created
- ✅ Manual execution works
- ✅ Status updates correctly
- ✅ Navigation to message works

---

### Test 2: Bulk Import

**Objective:** Verify bulk import from multi-line text

**Steps:**
```
1. Click "+" (Add to Queue)
2. In message field, paste:
   ¿Qué es machine learning?
   ¿Qué es deep learning?
   ¿Qué es neural network?
   ¿Qué es transfer learning?
   ¿Qué es reinforcement learning?

3. ✅ Blue banner appears:
   "📋 Modo bulk detectado: 5 tareas"

4. Click "Agregar 5 Tareas"
5. ✅ 5 items appear in queue
6. ✅ Each has position 1-5
7. ✅ All status: Pendiente
```

**Expected:**
- ✅ Bulk mode detected
- ✅ 5 separate items created
- ✅ Correct positioning
- ✅ All ready to execute

---

### Test 3: Auto-Execute Mode

**Objective:** Verify automatic queue processing

**Steps:**
```
1. Add 3 items to queue (see Test 2)
2. Verify all status: Pendiente
3. Click Play icon (Auto-execute toggle)
4. ✅ Icon changes to green
5. ✅ First item starts processing automatically
6. ✅ When it completes, second item starts
7. ✅ When second completes, third item starts
8. ✅ All three complete sequentially

9. Add a new item while queue is processing
10. ✅ New item automatically starts after current finishes
```

**Expected:**
- ✅ Auto-execute enables
- ✅ Items process one by one
- ✅ No manual intervention needed
- ✅ New items auto-queue

---

### Test 4: Concurrent Execution

**Objective:** Verify parallel processing with concurrentLimit > 1

**Steps:**
```
1. Open Agent Configuration Modal
2. Go to "Queue" tab (new)
3. Set "Límite de ejecución concurrente" to 3
4. Click "Guardar"

5. Add 5 items to queue
6. Enable auto-execute
7. ✅ 3 items start simultaneously
8. ✅ All 3 show timers
9. ✅ When one completes, 4th item starts
10. ✅ When another completes, 5th item starts
11. ✅ All 5 complete efficiently
```

**Expected:**
- ✅ Config saves correctly
- ✅ 3 items process in parallel
- ✅ Queue fills available slots
- ✅ Faster overall completion

---

### Test 5: Priority Ordering

**Objective:** Verify high-priority items execute first

**Steps:**
```
1. Add items with different priorities:
   - "Low priority task" - Priority: 2
   - "Medium priority task" - Priority: 5
   - "High priority task" - Priority: 9
   - "Critical task" - Priority: 10

2. Enable auto-execute
3. ✅ Order of execution:
   1st: "Critical task" (priority 10)
   2nd: "High priority task" (priority 9)
   3rd: "Medium priority task" (priority 5)
   4th: "Low priority task" (priority 2)
```

**Expected:**
- ✅ Higher priority executes first
- ✅ Position is secondary sort

---

### Test 6: Dependencies

**Objective:** Verify dependency resolution works

**Steps:**
```
1. Click "+" to add first item:
   Message: "Analiza el documento X"
   Priority: 5
   No dependencies
   
2. Click "+" to add second item:
   Message: "Resume los hallazgos clave"
   Priority: 10 (higher!)
   Dependencies: Select "Analiza el documento X"

3. Enable auto-execute
4. ✅ First item executes (even though lower priority)
5. ✅ Second item waits
6. ✅ When first completes, second executes
7. ✅ Both complete in correct order
```

**Expected:**
- ✅ Dependencies block execution
- ✅ Priority respected within constraints
- ✅ Correct execution order

---

### Test 7: Context Snapshot

**Objective:** Verify context is captured and used

**Steps:**
```
1. Upload PDF to agent
2. Enable PDF (toggle ON)
3. Select model: Pro

4. Add to queue:
   Message: "Resume el PDF"
   Capture context: ON ✅
   
5. Verify blue box shows:
   - Modelo: gemini-2.5-pro
   - Fuentes activas: 1

6. Now DISABLE the PDF (toggle OFF)
7. Change model to Flash

8. Execute queue item
9. ✅ Uses Pro model (captured)
10. ✅ Uses PDF context (captured)
11. ✅ Ignores current settings
```

**Expected:**
- ✅ Context captured at creation time
- ✅ Execution uses captured context
- ✅ Independent of current state

---

### Test 8: Error Handling

**Objective:** Verify errors are handled gracefully

**Steps:**
```
1. Add item with invalid message (empty or corrupted)
2. Execute item
3. ✅ Status: Fallido
4. ✅ Error message displayed
5. ✅ "Reintentar" button appears

6. Enable "Pausar cola si una tarea falla"
7. Add 3 more items
8. Make first item fail (disconnect network)
9. Enable auto-execute
10. ✅ First item fails
11. ✅ Queue pauses
12. ✅ Other items remain pending
```

**Expected:**
- ✅ Errors don't crash queue
- ✅ Failed items can retry
- ✅ pauseOnError works

---

### Test 9: Reordering

**Objective:** Verify queue items can be reordered

**Steps:**
```
1. Add 5 items to queue
2. All status: Pendiente
3. Click ↑ (up) on item #3
4. ✅ Item #3 becomes #2
5. ✅ Previous #2 becomes #3

6. Click ↓ (down) on item #1
7. ✅ Item #1 becomes #2
8. ✅ Previous #2 becomes #1

9. Enable auto-execute
10. ✅ Items execute in new order
```

**Expected:**
- ✅ Reordering works visually
- ✅ Positions saved to Firestore
- ✅ Execution respects new order

---

### Test 10: Clear Completed

**Objective:** Verify cleanup of finished items

**Steps:**
```
1. Execute 5 queue items
2. All status: Completado
3. Queue shows "Limpiar (5)" button
4. Click "Limpiar"
5. ✅ All completed items removed
6. ✅ Queue empty state shown
```

**Expected:**
- ✅ Completed items deleted
- ✅ Clean UI state
- ✅ No data corruption

---

### Test 11: Pause on Feedback

**Objective:** Verify queue pauses when AI needs clarification

**Steps:**
```
1. Enable "Pausar cola si el AI solicita más información"
2. Add 3 items:
   - "¿Qué es X?" (vague - will request clarification)
   - "Define Y clearly"
   - "Explain Z"

3. Enable auto-execute
4. ✅ First item executes
5. ✅ AI responds with: "Necesito más información sobre X..."
6. ✅ Queue auto-pauses
7. ✅ Items 2 and 3 remain pending
8. ✅ Auto-execute toggle turns OFF
```

**Expected:**
- ✅ Feedback detection works
- ✅ Queue pauses automatically
- ✅ Remaining items preserved

---

### Test 12: Multi-Agent Queue Independence

**Objective:** Verify each agent has independent queue

**Steps:**
```
1. Open Agent A
2. Add 3 items to queue
3. Enable auto-execute

4. Switch to Agent B (while A processes)
5. ✅ Agent B queue is empty
6. Add 2 items to Agent B queue
7. Enable auto-execute

8. ✅ Both agents process independently
9. ✅ Agent A: 3 items
10. ✅ Agent B: 2 items
11. ✅ No interference
```

**Expected:**
- ✅ Queues are per-agent
- ✅ Complete isolation
- ✅ Parallel execution across agents

---

## 🐛 Edge Cases to Test

### Edge Case 1: Circular Dependencies

```
Item A depends on Item B
Item B depends on Item A

Expected: Neither executes (blocked)
System should detect and warn user
```

### Edge Case 2: Deleted Dependency

```
Item A depends on Item B
Delete Item B

Expected: Item A remains blocked
Or: Dependency removed automatically
```

### Edge Case 3: Agent Deleted While Queue Processing

```
Queue has 5 pending items
Delete agent

Expected: Queue items deleted (cascade)
Or: Orphaned items cleaned up
```

### Edge Case 4: Network Failure During Execution

```
Item starts processing
Network disconnects
Item fails

Expected: Status: Fallido
Error message shown
Can retry when network restored
```

### Edge Case 5: Rapid Re-ordering

```
User clicks ↑ ↓ ↑ ↓ very fast

Expected: No race conditions
Final order is consistent
Firestore updates complete
```

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Queue load time | < 500ms | Time from mount to items displayed |
| Add item latency | < 200ms | Time from click to item appears |
| Execute item latency | < 3s | Time to start AI processing |
| Bulk import (100 items) | < 2s | Time to create all items |
| Reorder latency | < 100ms | Time for visual update |
| Auto-execute startup | < 1s | Time to start first item |

### Measuring Performance

```javascript
// In browser console
console.time('queueLoad');
// Click on agent with queue
console.timeEnd('queueLoad');

console.time('addItem');
// Click "+" and submit
console.timeEnd('addItem');

console.time('bulkImport');
// Paste 100 lines and submit
console.timeEnd('bulkImport');
```

---

## 🔍 Debug Checklist

### Console Logs to Monitor

```
✅ Good logs:
  📋 Loading queue items: {conversationId, userId}
  ✅ Loaded X queue items
  ➕ Adding item to queue
  ✅ Item added to queue: {id}
  ⚙️ Executing queue item: {id}
  ✅ Queue item executed: {id} (Xms)
  🚀 Auto-executing X queue items
  ✅ Queue processing complete

❌ Error logs (investigate):
  ❌ Error loading queue items
  ❌ Error adding to queue
  ❌ Queue item execution failed
  ⏸️ Queue paused due to error
```

### Network Tab Monitoring

```
Expected API calls:

1. GET /api/queue?conversationId=X&userId=Y
   → Returns: { items: [...] }

2. GET /api/queue/config?conversationId=X&userId=Y
   → Returns: { autoExecute: false, ... }

3. POST /api/queue
   → Body: { userId, conversationId, message, ... }
   → Returns: { id, ... }

4. POST /api/queue/{id}/execute
   → Body: { userId }
   → Returns: { success: true, executionTimeMs, ... }

5. PUT /api/queue/{id}
   → Body: { position: 2 }
   → Returns: { success: true }

6. DELETE /api/queue/{id}
   → Returns: { success: true }
```

---

## ✅ Acceptance Criteria

### Must Pass All:

- [ ] Queue loads for each agent independently
- [ ] Items can be added (single and bulk)
- [ ] Items can be executed (manual and auto)
- [ ] Items can be reordered
- [ ] Items can be deleted
- [ ] Dependencies are respected
- [ ] Priority ordering works
- [ ] Context snapshot works
- [ ] Errors are handled gracefully
- [ ] Auto-execute can be toggled
- [ ] Queue config persists
- [ ] Completed items can be cleared
- [ ] Multi-agent isolation works
- [ ] Performance meets targets
- [ ] No console errors
- [ ] No TypeScript errors

---

## 📸 Visual Regression Testing

### Screenshot Checklist

Take screenshots of:

1. **Empty queue state**
   - Should show empty icon and helpful text

2. **Queue with pending items**
   - Position badges visible
   - Priority visible (or inferred from order)
   - Status badges clear

3. **Item processing**
   - Timer visible
   - "Procesando" status
   - Cancel button available

4. **Item completed**
   - Green "Completado" badge
   - "Ver" button
   - Execution time shown

5. **Item failed**
   - Red "Fallido" badge
   - Error message visible
   - "Reintentar" button

6. **Auto-execute enabled**
   - Green Play icon
   - Items executing automatically

7. **Bulk import modal**
   - Multiple lines detected
   - Count shown correctly
   - Context capture option

---

## 🚀 Production Readiness Checklist

### Before Deploying to Production:

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance benchmarks met
- [ ] Firestore indexes created
- [ ] API endpoints secured (userId verification)
- [ ] Error handling comprehensive
- [ ] User documentation written
- [ ] Notification system works
- [ ] Backward compatible (existing agents unaffected)
- [ ] Mobile responsive
- [ ] Accessibility tested (keyboard navigation)

---

## 🎓 Known Issues & Limitations

### Current Limitations (v1.0.0)

1. **No scheduled execution** - Future feature
2. **No recurring tasks** - Future feature
3. **No queue templates** - Future feature
4. **No multi-agent queues** - Future feature (send same prompt to multiple agents)
5. **Max 500 items per queue** - Firestore batch limit

### Workarounds

1. **For scheduled execution:** Use manual mode, execute when ready
2. **For recurring tasks:** Duplicate completed items
3. **For templates:** Copy queue to new agent manually
4. **For multi-agent:** Create queue in each agent separately

---

## 📚 Troubleshooting

### Issue: Queue doesn't load

**Symptoms:**
- Empty state shown even after adding items
- "Cargando cola..." forever

**Diagnosis:**
```javascript
// Check API response
fetch('/api/queue?conversationId=X&userId=Y')
  .then(r => r.json())
  .then(console.log)

// Check Firestore
// Firebase Console → message_queue collection
```

**Solution:**
- Verify conversationId and userId are correct
- Check Firestore indexes exist
- Check network tab for errors

---

### Issue: Auto-execute doesn't start

**Symptoms:**
- Items remain "Pendiente"
- Auto-execute toggle is ON
- No execution happening

**Diagnosis:**
```javascript
// Check config
fetch('/api/queue/config?conversationId=X&userId=Y')
  .then(r => r.json())
  .then(console.log)

// Should show: autoExecute: true
```

**Solution:**
- Verify queue config saved correctly
- Check browser console for errors
- Reload page to reset processor

---

### Issue: Dependencies not working

**Symptoms:**
- Dependent item executes before dependency completes
- Item blocked even though dependency completed

**Diagnosis:**
```javascript
// Check item data
queueItems.forEach(item => {
  console.log(item.id, item.status, item.dependsOn);
});
```

**Solution:**
- Verify dependency IDs are correct
- Check dependency status is "completed"
- Reload queue to refresh state

---

### Issue: Items execute out of order

**Symptoms:**
- Lower priority items execute first
- Position order not respected

**Diagnosis:**
- Check priority values
- Check position values
- Check sorting logic

**Solution:**
- Verify priority and position are set correctly
- Check getExecutableItems() sorting logic
- Verify Firestore query ordering

---

## 🎯 Success Criteria Summary

**User Experience:**
- ✅ Intuitive queue interface
- ✅ Clear status feedback
- ✅ Easy to add/remove items
- ✅ Flexible execution (auto/manual)
- ✅ No confusion about order/status

**Technical:**
- ✅ All CRUD operations work
- ✅ Auto-execution reliable
- ✅ Dependencies resolved correctly
- ✅ Error handling comprehensive
- ✅ Performance acceptable

**Business:**
- ✅ Increases productivity (batch work)
- ✅ Reduces context switching
- ✅ Professional feature
- ✅ Competitive differentiation

---

## 📖 Related Documentation

- `docs/features/queue-system-2025-10-31.md` - Complete feature spec
- `src/types/queue.ts` - TypeScript definitions
- `src/components/QueuePanel.tsx` - Main UI component
- `src/lib/queue-processor.ts` - Execution logic
- `.cursor/rules/data.mdc` - Data schema (updated)

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Status:** 🧪 Ready for Testing  
**Estimated Testing Time:** 1-2 hours for complete coverage

---

**Remember:** Test thoroughly before deploying. Queue execution affects user workflow - bugs here will be very visible!







