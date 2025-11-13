# Streaming Fix Verification Guide

**Date:** 2025-11-13  
**Fixes:** UI flickering + 50% similarity bug  
**Tester:** Run these tests to verify fixes work

---

## 🧪 Test Suite

### Test 1: No UI Flickering (Critical UX Fix)

**Purpose:** Verify message stays visible after streaming completes

**Steps:**
1. Navigate to http://localhost:3000/chat
2. Login with any user
3. Select an agent with active sources (e.g., "GOP GPT M3")
4. Send a question: "¿Qué procedimientos están asociados al plan de calidad?"
5. **Watch carefully** as the response streams

**Expected Behavior:**
- ✅ Response appears character by character (streaming)
- ✅ "Pensando..." → "Buscando Contexto..." → "Seleccionando Chunks..." → "Generando Respuesta..."
- ✅ **When streaming completes, text STAYS VISIBLE** (no disappear/reappear)
- ✅ References appear below smoothly
- ✅ No flicker, no reload, no blank space

**Failure Indicators:**
- ❌ Message disappears briefly after streaming
- ❌ Screen flashes or reloads
- ❌ Blank space appears then content returns

---

### Test 2: Real Similarity Values (Accuracy Fix)

**Purpose:** Verify references show real similarity, not fake 50%

**Steps:**
1. Same setup as Test 1
2. After response completes, check references below
3. Click "Ver más" on any reference badge
4. Check similarity percentage

**Expected Behavior:**
- ✅ Similarity values vary: 65.4%, 72.3%, 68.9%, 85.1%, etc.
- ✅ NOT all 50%
- ✅ Higher similarity = more relevant content
- ✅ Modal shows same similarity value

**Failure Indicators:**
- ❌ All references show 50%
- ❌ No variation in similarity
- ❌ Modal shows different value than badge

---

### Test 3: Agent Search Works

**Purpose:** Verify sources are found via agent-based search (not fallback)

**Steps:**
1. Send a message
2. Check browser console
3. Look for search method logs

**Expected Logs:**
```
🔍 BigQuery Agent Search starting...
  2/4 Getting sources assigned to agent...
  ✓ Found 28 sources from Firestore (assigned to agent)
✅ Agent search: 8 chunks found
```

**Failure Indicators:**
```
⚠️ No sources assigned to this agent
⚠️ Agent search returned 0 results, trying legacy method...
⚠️ No chunks exist - loading full documents as EMERGENCY FALLBACK
```

---

### Test 4: All User Roles

**Purpose:** Verify fix works for all user types

**Test Users:**
- SuperAdmin: alec@getaifactory.com
- User: alecdickinson@gmail.com
- Admin: (any admin user)

**For Each User:**
1. Login
2. Send a message
3. Verify no flicker
4. Verify real similarity

**Expected:** All users have same smooth experience ✅

---

## 📊 Before & After Comparison

### UI Experience

| Aspect | Before | After |
|--------|--------|-------|
| Streaming appears | ✅ Yes | ✅ Yes |
| Streaming smooth | ✅ Yes | ✅ Yes |
| Completes smoothly | ❌ Flickers | ✅ Stays visible |
| References appear | ✅ Yes | ✅ Yes |
| Overall UX | ⚠️ Feels broken | ✅ Professional |

### Data Accuracy

| Metric | Before | After |
|--------|--------|-------|
| Similarity values | ❌ All 50% | ✅ Real 65-90% |
| Agent search | ❌ 0 sources | ✅ 28 sources |
| Search method | ❌ Emergency fallback | ✅ Agent-based |
| Search time | ❌ 48+ seconds | ✅ <500ms |

---

## 🔍 Console Verification

### Success Pattern (After Fix)
Look for these logs in console:

```
📋 RAG Configuration: {approach: 'AGENT_SEARCH (optimal)'}
🔍 BigQuery Agent Search starting...
  ✓ Found 28 sources from Firestore
✅ Agent search: 8 chunks found
📚 Built RAG references (consolidated by source):
  [1] Manual_GOP_M3.pdf - 85.1% avg (3 chunks) - 1247 tokens
  [2] Procedimientos_Calidad.pdf - 72.3% avg (2 chunks) - 892 tokens
```

### Failure Pattern (If Regression)
```
⚠️ No sources assigned to this agent
⚠️ Agent search returned 0 results
⚠️ BigQuery returned no results, falling back to Firestore...
⚠️ No chunks exist - loading full documents as EMERGENCY FALLBACK
📚 Loaded 10 full documents (193298 chars)
📚 Created 10 references from full documents (emergency fallback)
  [1] Document - Full Document - 50.0%  ← WRONG!
```

---

## 🚨 If Tests Fail

### UI Still Flickers
1. Check browser console for errors
2. Hard refresh (Cmd+Shift+R)
3. Clear cache
4. Check React version in package.json

### Still Showing 50%
1. Check migration ran: `npx tsx scripts/migrate-assigned-to-agents.ts`
2. Verify assignedToAgents field exists on sources in Firestore
3. Check agent-based search logs
4. Verify conversation has activeContextSourceIds

### ReferenceError Still Occurs
1. Check shouldShowNoDocsMessage declared at line 121
2. Restart dev server: `./restart-dev.sh`
3. Clear node_modules and reinstall

---

## 📚 Related Documentation

- `docs/fixes/streaming-complete-fix-2025-11-13.md` - Fix summary
- `docs/SOLUCION_EXITOSA_SIMILITUD_2025-11-13.md` - Similarity fix history
- `scripts/migrate-assigned-to-agents.ts` - Migration script

---

**Last Updated:** 2025-11-13  
**Tested By:** (Your name here after verification)  
**Status:** ✅ Ready for verification

