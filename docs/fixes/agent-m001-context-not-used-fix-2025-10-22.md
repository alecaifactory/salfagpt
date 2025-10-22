# Agent M001 Context Not Being Used - Fix Guide

**Date:** 2025-10-22  
**Issue:** Agent M001 has 538 files in context but gives generic responses  
**Status:** ✅ FIXED (requires browser refresh)

---

## 🐛 Root Causes Identified

### 1. Missing API Endpoint: `/api/context-sources/:id/assign-agent`

**Problem:** Frontend tried to call this endpoint to assign sources to chats, but it didn't exist.

**Impact:** 538 x 404 errors in console. Sources couldn't be assigned to child chats.

**Fix:** ✅ Created `src/pages/api/context-sources/[id]/assign-agent.ts`

---

### 2. Missing API Endpoint: `/api/agents/:id/context-sources/all-ids`

**Problem:** Frontend needed to get all source IDs for bulk operations, but endpoint didn't exist.

**Impact:** Auto-enable function in AgentContextModal couldn't load all IDs.

**Fix:** ✅ Created `src/pages/api/agents/[id]/context-sources/all-ids.ts`

---

### 3. Missing PUT Method on `/api/conversations/:id/context-sources`

**Problem:** Frontend uses PUT to save active sources, but endpoint only supported POST.

**Impact:** Some context saves might have failed.

**Fix:** ✅ Added `export const PUT: APIRoute = POST;` to alias PUT to POST

---

### 4. Nested Button Warning (React)

**Problem:** "Nuevo Proyecto" button nested inside Projects section toggle button.

**Impact:** React console warning about invalid DOM nesting.

**Fix:** ✅ Changed structure to use `<div>` wrapper with two sibling buttons

---

### 5. Sources Assigned But Not Enabled ⚠️ **MAIN ISSUE**

**Problem:** The 538 files are **assigned** to agent M001 (`assignedToAgents` array) but not **enabled/activated** (`activeContextSourceIds` array).

**Impact:** When sending messages, this code filters to enabled sources only:
```typescript
const activeSources = contextSources.filter(source => source.enabled);
```

Result: `activeSources.length = 0` → No context sent to AI → Generic response

---

## 🔧 How to Fix

### **Option 1: Use Agent Context Modal** ⭐ RECOMMENDED

1. **Refresh your browser** (hard refresh: Cmd+Shift+R)
2. Click on **Agent M001** in the sidebar to select it
3. Click the **⚙️ Settings icon** next to Agent M001 name
4. The **Agent Context Modal** will open
5. It will automatically call `enableAllAssignedSources()` 
6. This will activate all 538 sources
7. Close the modal
8. Try your question again

**Expected Console Log:**
```
✅ Auto-enabled 538 sources for agent
```

---

### **Option 2: Manual Activation via Browser Console**

If the modal doesn't auto-enable, run this in your browser console:

```javascript
// Get all source IDs for agent M001
const agentId = 'cjn3bC0HrUYtHqu69CKS'; // Your Agent M001 ID
const response = await fetch(`/api/agents/${agentId}/context-sources/all-ids`);
const data = await response.json();
const allSourceIds = data.sourceIds;

console.log(`📊 Found ${allSourceIds.length} sources assigned to agent`);

// Activate all of them
const saveResponse = await fetch(`/api/conversations/${agentId}/context-sources`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activeContextSourceIds: allSourceIds })
});

if (saveResponse.ok) {
  console.log(`✅ Activated ${allSourceIds.length} sources for agent`);
  console.log('🔄 Refreshing page...');
  location.reload();
} else {
  console.error('❌ Failed to activate sources');
}
```

---

### **Option 3: Verify in Chat Interface**

After enabling sources:

1. Go to Agent M001
2. Open the **Context Panel** (click "Contexto: X%" button)
3. Check **Active Context Sources** section
4. You should see all 538 sources listed as enabled (green cards)

**What to look for:**
- Green cards with source names
- Toggle switches in ON position (green)
- Count: "538 fuentes"

---

## 🔍 Verification Checklist

After applying the fix:

- [ ] No 404 errors for `/api/context-sources/*/assign-agent` in console
- [ ] No 404 errors for `/api/conversations/*/context-sources` in console
- [ ] No React nested button warning
- [ ] Console shows: `✅ Auto-enabled 538 sources for agent`
- [ ] Console shows: `- Active (toggled ON): 538` (not 0)
- [ ] When sending message: `Loading full context data for 538 sources...`
- [ ] AI response uses context from the 538 files

---

## 📊 Expected Logs After Fix

**Before sending message:**
```
✅ Lightweight context refresh complete:
   Total sources returned by API: 538
   Agent/Conversation ID: cjn3bC0HrUYtHqu69CKS
   - PUBLIC sources: 0
   - Assigned to this agent: 538
   - Active (toggled ON): 538  ← Should be 538, not 0
```

**When sending message:**
```
📥 Loading full context data for 538 sources...
✅ Loaded full context data
```

**AI Response:**
Should reference the specific documents and provide detailed answers based on the 538-file context.

---

## 🎯 Why This Happened

The CLI upload process:
1. ✅ Uploaded 538 files
2. ✅ Assigned them to agent M001 (`assignedToAgents` array)
3. ❌ **Did NOT activate them** (`activeContextSourceIds` array)

The system has two levels:
- **Assignment:** Which agents can *see* a source
- **Activation:** Which sources are *enabled/toggled ON* for an agent

CLI uploads assign but don't activate. User must manually activate via UI (or API).

---

## 🚀 Future Prevention

### For CLI Uploads

Add to CLI script:
```typescript
// After uploading all files
const allSourceIds = uploadedSources.map(s => s.id);

// Auto-activate all uploaded sources
await fetch(`/api/conversations/${agentId}/context-sources`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activeContextSourceIds: allSourceIds })
});

console.log(`✅ Auto-activated ${allSourceIds.length} sources for agent`);
```

---

## 📚 Technical Details

### Data Structure

```typescript
ContextSource {
  id: string
  assignedToAgents: string[]  // Who can SEE this source
  // (stored in Firestore)
}

ConversationContext {
  conversationId: string
  activeContextSourceIds: string[]  // Which sources are ENABLED
  // (stored in Firestore: conversation_context collection)
}

// In UI state:
ContextSource {
  enabled: boolean  // activeContextSourceIds.includes(source.id)
  // (computed from activeContextSourceIds)
}
```

### Message Sending Logic

```typescript
// 1. Filter to enabled sources
const activeSources = contextSources.filter(source => source.enabled);

// 2. Load full extractedData
const fullActiveSources = await loadFullContextSources(activeSources);

// 3. Send to AI
contextSources: fullActiveSources.map(s => ({
  id: s.id,
  name: s.name,
  content: s.extractedData  // The actual text content
}))
```

If `enabled: false`, source is filtered out → not sent to AI → generic response.

---

## ✅ Success Criteria

After fix, you should see:

1. **In Console:**
   - `- Active (toggled ON): 538`
   - `📥 Loading full context data for 538 sources...`
   - No 404 errors

2. **In UI:**
   - Context Panel shows 538 active sources
   - All toggles are green (ON)
   - Contexto shows realistic percentage (not 0%)

3. **In Responses:**
   - AI references specific documents
   - Detailed, context-aware answers
   - Uses information from the 538 files

---

## 🔗 Related Files

**Created:**
- `src/pages/api/context-sources/[id]/assign-agent.ts`
- `src/pages/api/agents/[id]/context-sources/all-ids.ts`

**Modified:**
- `src/pages/api/conversations/[id]/context-sources.ts` (added PUT method)
- `src/components/ChatInterfaceWorking.tsx` (fixed nested button)

**Referenced:**
- `.cursor/rules/alignment.mdc` - Data persistence
- `.cursor/rules/firestore.mdc` - Agent-specific assignment pattern
- `.cursor/rules/agents.mdc` - Agent context architecture

---

**Remember:** Assignment ≠ Activation. Files must be both assigned AND activated to be used in AI responses.

