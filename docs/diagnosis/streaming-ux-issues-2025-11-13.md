# Comprehensive Diagnosis: Streaming UX Issues

**Date:** 2025-11-13  
**Issue:** Multiple UX problems in streaming response  
**Status:** 🔍 Diagnosing

---

## 🐛 Problems Observed (From Screenshots)

### 1. References Show 50.0% (All 10 references)
**Screenshot Evidence:** All references display "50.0% Similitud semántica"

**Expected:** Varying percentages (70-90%)

**Current Behavior:** Hardcoded 50% from emergency fallback

---

### 2. UI Flickering After Streaming
**User Report:** Message disappears briefly, then reappears

**Expected:** Smooth transition, text stays visible

---

### 3. References Show During "Cargando referencias..."
**Screenshot Evidence:** Shows "Cargando referencias..." status but references are already visible

**Expected:** References hidden until streaming complete

---

## 🔍 Root Cause Analysis

### Why 50% Similarity?

**Trace:**
1. ✅ Migration ran successfully (577 conversations updated)
2. ✅ `assignedToAgents` field now exists on sources
3. ❓ **BUT** - Is the agent search finding them?

**Hypothesis:** 
- Agent search still returning 0 sources
- Falling back to emergency mode
- Emergency mode loads full documents with `similarity: 0.5`

**Need to verify:**
- What sources does agent search find?
- Is the query using correct userId/agentId?
- Are assignedToAgents arrays populated correctly?

---

### Why Flickering?

**Current Code (line 2370-2377):**
```typescript
msg.id === streamingId 
  ? { 
      ...msg, 
      firestoreId: finalMessageId, // Added
      isStreaming: false,
      content: accumulatedContent,
      references: data.references,
      thinkingSteps: undefined
    }
```

**Hypothesis:**
- Even though we keep streaming ID, the message might be reloading from Firestore
- useEffect on line 622-627 triggers loadMessages when conversation changes
- This causes a fetch and replace of all messages

---

## 🎯 Fix Strategy

### Fix 1: Prevent Message Reload During Streaming

**Problem:** `loadMessages()` called from useEffect might be replacing streaming message

**Solution:** Add guard to skip reload if streaming active

---

### Fix 2: Debug Agent Search

**Problem:** Not finding sources even after migration

**Solution:** 
1. Log actual agent ID used in search
2. Verify assignedToAgents array in Firestore
3. Check if migration actually wrote the field

---

### Fix 3: Ensure References Hidden During Streaming

**Problem:** UI might be showing references too early

**Solution:** Verify `isLoadingReferences` prop is correctly set

---

## 🔬 Diagnostic Commands

### Check if assignedToAgents was actually set:
```bash
# Check a specific source from GOP GPT M3
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const doc = await firestore.collection('context_sources').doc('0wKs54A12DqZcTsXil8R').get();
console.log('assignedToAgents:', doc.data()?.assignedToAgents);
process.exit(0);
"
```

### Check conversation's activeContextSourceIds:
```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const doc = await firestore.collection('conversations').doc('5aNwSMgff2BRKrrVRypF').get();
console.log('activeContextSourceIds:', doc.data()?.activeContextSourceIds?.length);
process.exit(0);
"
```

---

## ✅ Next Actions

1. Run diagnostic commands to verify migration worked
2. Add detailed logging to agent search
3. Fix UI flicker with proper state management
4. Verify references hidden during streaming
5. Test end-to-end

---

**Status:** Ready for systematic fixes

