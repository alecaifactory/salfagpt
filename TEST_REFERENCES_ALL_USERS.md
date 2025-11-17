# 🧪 Testing Guide: Document References for All Users

**Date:** 2025-11-04  
**Fix:** References now saved to Firestore and visible to all users  

---

## 🎯 What to Test

Verify that **all users** (not just admins) can see document references at the end of AI responses.

---

## 📋 Test Procedure

### Test 1: Admin User (Regression Test)

**User:** `alec@getaifactory.com` or any admin

1. **Login** to the platform
2. **Navigate** to an agent with active context sources
3. **Send a message** that triggers RAG search
4. **Verify** in console: `📚 Built N references from RAG results`
5. **Check UI**:
   - [ ] Inline reference badges `[1]`, `[2]` visible in response text
   - [ ] "📚 Referencias utilizadas (N)" footer visible
   - [ ] Can expand/collapse footer
   - [ ] Can click on inline badge to see ReferencePanel
   - [ ] Similarity scores shown (e.g., "87%")
   - [ ] Source names correct

6. **Refresh page**
7. **Verify** references still visible after reload

---

### Test 2: Expert User (New Functionality)

**User:** `expert@demo.com` or create expert user

1. **Login** as expert user
2. **Navigate** to shared agent or create new agent
3. **Upload context** document (PDF)
4. **Send message** using that context
5. **Verify** same as Admin test:
   - [ ] References visible inline
   - [ ] References footer visible
   - [ ] Can click and view details
   - [ ] Similarity scores shown

6. **Refresh page**
7. **Verify** references persist

---

### Test 3: Standard User (New Functionality)

**User:** `user@demo.com` or create standard user

1. **Login** as standard user
2. **Access shared agent** from admin/expert
3. **View message history** with references
4. **Verify**:
   - [ ] Can see references inline
   - [ ] Can see references footer
   - [ ] Can expand footer
   - [ ] Can click references to view details
   - [ ] All reference data visible (not filtered by role)

5. **Send new message**
6. **Verify** references appear in new response
7. **Refresh**
8. **Verify** references persist for standard user too

---

### Test 4: Cross-User Visibility (Shared Agents)

**Setup:** Admin shares agent with Expert

1. **Admin** creates agent with context
2. **Admin** sends message → References appear ✅
3. **Admin** shares agent with Expert user
4. **Expert** logs in and accesses shared agent
5. **Expert** views message history
6. **Verify**:
   - [ ] Expert sees Admin's messages with references
   - [ ] Expert can click on references
   - [ ] Expert can view reference details
   - [ ] No "admin only" restrictions

7. **Expert** sends new message
8. **Admin** views updated agent
9. **Verify**:
   - [ ] Admin sees Expert's message with references
   - [ ] Bidirectional reference visibility works

---

## 🔍 Console Logs to Check

### When Sending Message

```
🔍 Attempting RAG search...
  Configuration: topK=10, minSimilarity=0.6
✅ RAG: Using 5 relevant chunks via BIGQUERY (234ms)
📚 Built 5 references from RAG results  ← KEY LOG
💬 Message created from production: msg-abc123
```

### When Loading Messages

```
📥 [LOAD MESSAGES] Received 10 messages
📚 Loaded 3 messages with references  ← KEY LOG
  Message msg-123: 5 references
  Message msg-456: 3 references
  Message msg-789: 7 references
```

### In MessageRenderer

```
📚 MessageRenderer received references: 5
  [1] SSOMA.pdf - 87.0% - Chunk #23
  [2] SSOMA.pdf - 73.0% - Chunk #45
  [3] Manual.pdf - 92.0% - Chunk #12
  [4] Guia.pdf - 68.0% - Chunk #8
  [5] SSOMA.pdf - 81.0% - Chunk #67
```

---

## ✅ Success Criteria

### Backend
- [x] Type check passes with no new errors
- [x] RAG results stored in `ragResults` variable
- [x] References built from RAG results
- [x] References passed to `addMessage()`
- [x] Console shows "Built N references from RAG results"

### Firestore
- [ ] Message documents have `references` field
- [ ] References array has all required fields:
  - `id`, `sourceId`, `sourceName`, `chunkIndex`
  - `similarity`, `snippet`, `fullText`
  - `metadata.isRAGChunk`, `metadata.startPage`, etc.

### Frontend (All Users)
- [ ] References visible inline `[1]`, `[2]`
- [ ] References footer visible and expandable
- [ ] Click on badge opens ReferencePanel
- [ ] Similarity scores shown with color coding
- [ ] Source names correct
- [ ] References persist on page refresh
- [ ] Works for admin, expert, and standard users
- [ ] Works in shared agents

---

## 🚨 Troubleshooting

### Issue: No references showing

**Check:**
```javascript
// In browser console
messages[0].references // Should be array, not undefined
```

**If undefined:**
- References not saved to Firestore
- Check backend logs for "Built N references"
- Verify `addMessage()` received references

### Issue: References showing in console but not UI

**Check:**
```javascript
// In MessageRenderer component
console.log('references prop:', references)
```

**If empty:**
- Check `loadMessages()` in ChatInterfaceWorking
- Verify spread operator preserves references: `...msg`
- Check API GET response includes references

### Issue: Only admin sees references

**Check:**
- Test with incognito window (different user)
- Clear browser cache
- Check if message was created before or after fix

---

## 📊 Expected Results

### Before Fix
```
Admin creates message → Sees references (POST response)
Expert loads same agent → No references (GET from Firestore)
User loads shared agent → No references (GET from Firestore)
```

### After Fix
```
Admin creates message → Sees references (POST + Firestore)
Expert loads same agent → Sees references (GET from Firestore) ✅
User loads shared agent → Sees references (GET from Firestore) ✅
Everyone refreshes → Sees references (persisted) ✅
```

---

## 🎓 What Was Fixed

### The Bug
References were built and returned in the POST response but **never saved to Firestore**, so only the message creator saw them in real-time. When loading messages from Firestore (GET endpoint), references were missing.

### The Fix
1. Store RAG search results (`ragResults = searchResult.results`)
2. Build references from RAG results with all metadata
3. Pass references to `addMessage()` for Firestore persistence
4. References now available to all users via GET endpoint

### Why It Matters
- **Transparency**: Users can verify AI claims
- **Trust**: See which documents were actually used
- **Traceability**: Track exact chunks used in response
- **Quality**: Evaluate relevance via similarity scores
- **Collaboration**: Shared agents show full reference data

---

**Test this thoroughly before marking as complete!** 🎯





