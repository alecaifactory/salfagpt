# Test Minimal Context Loading - NOW!

## 🧪 **Quick Test**

### **1. Restart dev server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### **2. Test agent selection**

1. Open: http://localhost:3000/chat
2. Select "SSOMA" agent
3. **Check terminal logs:**

**Expected (< 1 second):**
```
⚡ Loading minimal context stats (count only - BigQuery handles search)...
✅ Context stats loaded: { totalCount: 89, activeCount: 89, loadTime: '450ms' }
✅ Minimal context stats loaded: 89 sources (450ms)
   Agent-based search enabled - no source metadata needed!
```

**NOT expected (slow):**
```
❌ "📦 Batch 1: loaded 100..." (this means old code is running)
❌ "⚡ Complete: 89 sources in 48436ms" (old slow loading)
```

### **3. Send message IMMEDIATELY**

Don't wait! Send right away:

**Question:** "¿Qué hacer si aparecen mantos de arena durante una excavación?"

**Check terminal logs:**

**Expected:**
```
📊 Sending message with agent-based RAG search: { agentId: '...', useAgentSearch: true }
📋 RAG Configuration: { useAgentSearch: true, approach: 'AGENT_SEARCH (optimal)' }
🚀 Using agent-based BigQuery search (OPTIMAL)...
  ✓ Found 89 sources for agent (200ms)
  ✓ BigQuery search complete (400ms)
✅ Agent search: 5 chunks found
✅ RAG: Using 5 relevant chunks
```

**NOT expected:**
```
❌ "📋 Active sources for RAG: 0 IDs" (means no sources loaded)
❌ "Built references from full documents (fallback mode): 0" (no RAG)
```

### **4. Check response**

**Expected:**
- ✅ AI response with [1] [2] [3] [4] [5] references
- ✅ References show source names with similarity %
- ✅ Clickable references work
- ✅ Response quality is good

### **5. Send second message**

**Question:** "¿Cuáles son los EPP requeridos?"

**Expected:**
- ⚡ Even faster (BigQuery warm)
- ✅ 5 new relevant references
- ✅ Total time: ~1.5 seconds

---

## 📊 **Performance Metrics to Check**

### **Agent Selection:**
| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Load time | 48s | ? | <1s ✅ |
| Data transferred | MBs | bytes | <1 KB ✅ |
| Logs | "8 batches" | "stats loaded" | Minimal ✅ |

### **Message Send:**
| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Can send after | 48s | 0s | Instant ✅ |
| Request size | 4.5 MB | ~1 KB | Minimal ✅ |
| Active sources sent | 89 IDs | 0 (agentId) | None ✅ |

### **RAG Search:**
| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Search method | Firestore | Agent-BigQuery | BigQuery ✅ |
| Search time | 2.6s | ~700ms | <1s ✅ |
| Results | 5 chunks | 5 chunks | Same ✅ |

---

## 🚨 **If Something Goes Wrong**

### **Issue: Context stats endpoint returns 404**

**Check:**
```bash
# Is the endpoint file created?
ls -la src/pages/api/agents/[id]/context-stats.ts

# Test endpoint directly
curl "http://localhost:3000/api/agents/YOUR_AGENT_ID/context-stats"
```

**Fix:** Restart dev server

---

### **Issue: Still seeing "📦 Batch 1..." in logs**

**Cause:** Old code still being called somewhere

**Check:** Search for other calls to `loadContextForConversation`

**Fix:** Make sure all calls pass `skipRAGVerification = true` (default)

---

### **Issue: Agent search returns 0 results**

**Check terminal logs for:**
```
✓ Found X sources for agent
```

**If X = 0:**
- Sources aren't assigned to agent properly
- Check assignedToAgents field in Firestore

**If X > 0 but results = 0:**
- BigQuery query might be failing
- Check for error messages
- Falls back to Firestore automatically

---

### **Issue: Response has no references**

**Check:**
- Did agent search run? (Look for "Agent search: X chunks found")
- Did results get built? (Look for "Built RAG references from chunks")

**If yes but still no references:**
- Front end issue (not backend)
- References should be in response data

---

## ✅ **Success Indicators**

### **In Terminal:**
```
✅ "Minimal context stats loaded: 89 sources (450ms)"
✅ "Agent-based search enabled"
✅ "Using agent-based BigQuery search (OPTIMAL)"
✅ "Found 89 sources for agent (200ms)"
✅ "BigQuery search complete (400ms)"
✅ "Agent search: 5 chunks found"
```

### **In Browser Console:**
```
✅ "Context stats loaded: { totalCount: 89, loadTime: '450ms' }"
✅ "Sending message with agent-based RAG search"
✅ Message complete with 5 references
```

### **In UI:**
- ✅ Agent selection is instant
- ✅ Can send message immediately
- ✅ Response has 5 clickable references
- ✅ No loading spinners
- ✅ Fast responses

---

## 🎯 **What You Should See**

### **Timeline (New):**
```
0s:   Select SSOMA agent
0.5s: Stats loaded (89 sources)
0.5s: Can send message! ⚡
      
0.5s: User types and sends message
1.5s: Embedding generated
2.2s: BigQuery search complete (5 chunks)
2.5s: AI response streaming
5s:   Complete response with 5 references ✅
```

### **Timeline (Old):**
```
0s:   Select SSOMA agent
48s:  Sources loaded (after 8 batches) ⏱️
48s:  Can send message
      
48s:  User sends message
52s:  Firestore search complete
57s:  AI response complete
```

**Improvement: 57s → 5s (11x faster total!)** 🚀

---

**Ready to test?** Just restart dev server and select an agent!

