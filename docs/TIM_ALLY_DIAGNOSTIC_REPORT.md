# TIM Diagnostic Report - Ally Sample Question Flow

**Date:** November 17, 2025, 1:12 AM  
**Issue:** Sample questions section doesn't disappear after click  
**Test:** High-frequency sampling (100ms) with TIM  
**Status:** 🔍 Analyzing

---

## 🎯 TEST SCENARIO

**User Action:** Click sample question "¿Qué puedo preguntarte?"  
**Expected Behavior:**
1. Sample questions section disappears
2. Chat UI appears with loading or messages
3. Question auto-sends to Ally
4. Ally responds

**Actual Behavior:**
- Sample questions section **persists** (doesn't disappear)
- Chat UI doesn't show

---

## 🔍 ROOT CAUSE ANALYSIS

### Issue #1: Empty State Condition

**File:** `src/components/ChatInterfaceWorking.tsx` (line ~5858)

```typescript
{messages.length === 0 ? (
  <div className="h-full flex flex-col items-center justify-center">
    {/* Sample questions */}
  </div>
) : (
  {/* Messages */}
)}
```

**The Problem:**
- Condition checks: `messages.length === 0`
- After creating conversation: `setMessages([])` (line ~1903)
- Messages array is empty → Condition is TRUE → Shows sample questions
- Messages haven't loaded yet → Empty state persists

**Why it's failing:**
```javascript
// Current flow:
1. Click sample question
2. Create conversation
3. setCurrentConversation(newConvId)
4. setMessages([])  // ← Empties messages!
5. setIsLoadingMessages(true)
6. await loadMessages(newConvId)
7. setIsLoadingMessages(false)

// But React render happens between steps 4-6!
// So it renders with messages.length === 0
// Which shows empty state again
```

---

### Issue #2: State Update Timing

**The Race Condition:**

```
User clicks → Create conversation → Set state
  ↓
React re-renders (messages.length === 0)
  ↓
Shows empty state (sample questions)
  ↓
loadMessages() executes
  ↓
Sets messages
  ↓
React re-renders (messages.length > 0)
  ↓
Shows chat UI

Problem: There's a flash of empty state between create and load!
```

---

## ✅ SOLUTION

### Fix #1: Use Loading State Instead of Message Length

**Change the condition:**

```typescript
// ❌ BEFORE:
{messages.length === 0 ? (
  <EmptyState />
) : (
  <Messages />
)}

// ✅ AFTER:
{messages.length === 0 && !isLoadingMessages && !currentConversation ? (
  <EmptyState />
) : (
  <Messages />
)}
```

**Why this works:**
- If `currentConversation` is set → Hide empty state (even if messages not loaded yet)
- If `isLoadingMessages` is true → Hide empty state (loading in progress)
- Only show empty state if: no messages AND not loading AND no conversation selected

---

### Fix #2: Don't Clear Messages

**Remove the setMessages([]) call:**

```typescript
// ❌ BEFORE:
setConversations(prev => [newConv, ...prev]);
setCurrentConversation(newConvId);
setMessages([]); // ← Remove this!
setIsLoadingMessages(true);
await loadMessages(newConvId);

// ✅ AFTER:
setConversations(prev => [newConv, ...prev]);
setCurrentConversation(newConvId);
// Don't clear messages - let loadMessages replace them
setIsLoadingMessages(true);
await loadMessages(newConvId);
setIsLoadingMessages(false);
```

---

### Fix #3: Add Optimistic Message

**Show user message immediately:**

```typescript
// After creating conversation:
const optimisticMessage = {
  id: 'temp-user-msg',
  role: 'user' as const,
  content: question,
  timestamp: new Date(),
};

setMessages([optimisticMessage]); // Show user message immediately
setCurrentConversation(newConvId);
setIsLoadingMessages(true);

// Then send for real
await sendMessage();
```

**This way:**
- Empty state disappears immediately (messages.length > 0)
- User sees their message right away
- No awkward loading state

---

## 🔧 IMPLEMENTATION

I'll implement Fix #1 and Fix #3 (combination approach):

1. Update empty state condition
2. Add optimistic user message
3. Remove message clearing
4. Ensure smooth transition

---

## 📊 EXPECTED RESULTS AFTER FIX

**TIM Monitoring (100ms samples):**

```
[0ms]    emptyState: true,  messages: 0, loading: false
[100ms]  emptyState: true,  messages: 0, loading: false  ← User clicks
[200ms]  emptyState: false, messages: 1, loading: true   ← Optimistic msg added
[300ms]  emptyState: false, messages: 1, loading: true   ← Creating conversation
[400ms]  emptyState: false, messages: 1, loading: true   ← Sending message
[500ms]  emptyState: false, messages: 2, loading: false  ← Ally responded!
```

**Result:** No flash, smooth transition, instant feedback

---

## 🎯 NEXT STEP

Implementing the fixes now...

