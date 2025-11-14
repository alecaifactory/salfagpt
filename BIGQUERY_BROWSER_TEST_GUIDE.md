# 🧪 BigQuery GREEN vs BLUE - Browser Testing Guide

**Test Agent:** GESTION BODEGAS GPT (S001)  
**Agent ID:** AjtQZEIMQvFnPRJRjl4y ✅ (Found)  
**Status:** Ready to test in browser

---

## 🚀 **How to Run the Test**

### **Step 1: Ensure Dev Server Running**

```bash
# Check if running
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/chat

# If not 302, start it:
npm run dev
```

**Server should be on:** http://localhost:3000

---

### **Step 2: Open Browser Test**

1. **Open:** http://localhost:3000/chat
2. **Login** with your account
3. **Find agent:** "GESTION BODEGAS GPT (S001)"
4. **Click** to open that agent

---

### **Step 3: Test Query with GREEN (Automatic)**

**Since you're on localhost, router will automatically use GREEN!**

**Send this message:**
```
¿Cuál es el procedimiento para inventario de existencias MB52?
```

**Watch the browser console (F12 → Console):**

**Expected logs (GREEN):**
```
🔀 BigQuery Routing Decision:
  Origin: http://localhost:3000
  Selected: GREEN (optimized) ✅

[OPTIMIZED] BigQuery Vector Search starting...
  [1/4] Generating query embedding...
  ✓ Embedding ready (800-1000ms)
  [2/4] Loading sources assigned to agent...
  ✓ Found X sources (100-200ms)
  [3/4] Executing BigQuery vector search...
  ✓ Search complete (400-500ms)
  ✓ Found X chunks
  [4/4] Loading source names...
  ✓ Names loaded (50ms)

✅ [OPTIMIZED] Search complete (1,400-1,800ms) ← Should be <2s!
  Results: X chunks
  Avg similarity: XX%
```

---

### **Step 4: Verify Performance**

**Measure total response time:**
```
From: Click Send
To: First text appears
Target: <8 seconds total
  - Thinking: <1s to appear
  - Searching: <2s  (GREEN target)
  - Streaming: 2-3s
```

**Check similarity scores in references:**
```
Should show: 70-95% (real scores)
Not: 50% (dummy fallback scores)
```

---

### **Step 5: Compare with BLUE (Manual Switch)**

**To test BLUE for comparison:**

```bash
# Terminal (where server is running):
# Stop server: Ctrl+C

# Set flag to force BLUE
export USE_OPTIMIZED_BIGQUERY=false

# Restart
npm run dev
```

**Then repeat same test:**
- Same agent
- Same query
- Compare performance

**Expected logs (BLUE):**
```
🔀 BigQuery Routing Decision:
  Origin: http://localhost:3000
  Override: Force BLUE (env var) ✅

BigQuery Agent Search starting...
  (BLUE implementation logs)
  ...
  
Might see:
  ⚠️ Falling back to Firestore (if BLUE has issues)
  (Then 120s delay)
```

---

## 📊 **What to Measure**

### **Performance Metrics:**

| Metric | GREEN Target | BLUE Current | Pass/Fail |
|--------|-------------|--------------|-----------|
| **Thinking appears** | <1s | Variable | ? |
| **RAG search time** | <2s | 400ms - 120s | ? |
| **Total response** | <8s | 10s - 130s | ? |
| **Results found** | >0 | Variable | ? |
| **Avg similarity** | 70-95% | Variable | ? |

### **User Experience:**

| Aspect | GREEN Expected | BLUE Current | Better? |
|--------|---------------|--------------|---------|
| **Wait time** | <8s | 10-130s | ? |
| **Visual feedback** | Immediate | Delayed | ? |
| **Result quality** | High (70-95%) | Variable | ? |
| **Feeling** | "Professional" | "Slow/Broken" | ? |

---

## 🎯 **Success Criteria**

### **GREEN Passes If:**
- [ ] Router logs show "Selected: GREEN"
- [ ] Search completes in <2s
- [ ] Returns >0 results
- [ ] Similarity scores 70-95%
- [ ] Total response <8s
- [ ] No Firestore fallback
- [ ] You say "This is fast!"

### **GREEN Needs Work If:**
- [ ] Search takes 2-5s (acceptable but not optimal)
- [ ] Returns 0 results (agent assignment issue)
- [ ] Similarity scores 50-70% (acceptable quality)
- [ ] Total response 8-15s (could be better)

### **GREEN Fails If:**
- [ ] Errors in console
- [ ] Falls back to Firestore (120s)
- [ ] Returns 0 results consistently
- [ ] Performance >5s

---

## 🔍 **Troubleshooting**

### **If "0 sources found":**
```
Possible causes:
1. Agent has no sources assigned (check assignedToAgents field)
2. Sources exist but for different userId  
3. Query logic issue

Solution:
- Try different agent
- Check Firestore: context_sources collection
- Verify assignedToAgents array includes this agentId
```

### **If "Falling back to Firestore":**
```
Possible causes:
1. GREEN table query failed
2. GREEN returned 0 (genuine no matches)
3. userId format mismatch

Solution:
- Check GREEN table has data (we verified it does ✅)
- Check userId in query matches table data
- Review console error logs
```

### **If Performance >2s:**
```
Possible causes:
1. Embedding generation slow (800-1000ms - normal)
2. BigQuery cold start (first query only)
3. No vector index (each query recalculates)

Solution:
- Accept embedding time (can't optimize much)
- Wait for subsequent queries (will be faster)
- Create vector index (optional, helps cold-start)
```

---

## 📊 **Expected Benchmark Results**

### **GREEN (Optimized):**
```
Performance:
├─ Embedding: 800-1,000ms
├─ Source lookup: 100-200ms  
├─ Vector search: 400-500ms
├─ Name loading: 50-100ms
└─ TOTAL: 1,400-1,800ms ✅ (<2s target)

Quality:
├─ Results: 5-8 chunks
├─ Similarity: 70-95%
└─ Relevant: High

UX:
├─ Thinking: Appears immediately
├─ Response: <8s total
└─ Feeling: "Professional and fast"
```

### **BLUE (Current - if works):**
```
Performance:
├─ Embedding: 800-1,000ms
├─ Source lookup: 100-200ms
├─ Vector search: 400-500ms (if no fallback)
├─ OR Firestore fallback: 120,000ms (if returns 0)
└─ TOTAL: 1,400ms or 120s (inconsistent)

Quality:
├─ Results: 5-8 chunks (when works)
├─ Similarity: Variable or 50% (fallback)
└─ Relevant: Variable

UX:
├─ Thinking: May appear late
├─ Response: 8s or 130s (unpredictable)
└─ Feeling: "Fast or broken" (inconsistent)
```

---

## 🎯 **What We're Looking For**

### **GREEN Success Indicators:**
```
Console logs:
✅ "Routing to: OPTIMIZED BigQuery"
✅ "[OPTIMIZED] Search complete (450ms)"
✅ "Found 8 chunks"
✅ "Avg similarity: 82%"
✅ "TOTAL: 1,550ms"

UI experience:
✅ Response in <8s
✅ Thinking appears <1s
✅ References with real scores
✅ No long pauses
```

### **BLUE Issues (What We're Fixing):**
```
Console logs:
⚠️ "BigQuery search found 0 chunks"
⚠️ "Falling back to Firestore"
❌ (118 seconds of processing)
⚠️ "Created emergency references"

UI experience:
❌ 10-20s silence
❌ Response in 120s
❌ References with 50% dummy scores
❌ User thinks it crashed
```

---

## 🚀 **Quick Test Commands**

### **Test GREEN (localhost automatic):**
```bash
# Just open browser - no config needed
open http://localhost:3000/chat

# Router uses GREEN automatically because:
# origin = "http://localhost:3000" → GREEN
```

### **Force BLUE (for comparison):**
```bash
# Stop server
# Set flag
export USE_OPTIMIZED_BIGQUERY=false

# Restart
npm run dev

# Now localhost uses BLUE
# (Env var overrides domain routing)
```

### **Back to AUTO (domain-based):**
```bash
# Stop server
# Remove flag
unset USE_OPTIMIZED_BIGQUERY

# Restart
npm run dev

# localhost → GREEN (automatic)
# production → BLUE (automatic)
```

---

## 📋 **Testing Checklist**

```
Preparation:
├─ [ ] Dev server running (http://localhost:3000)
├─ [ ] Browser open
├─ [ ] Logged in
├─ [ ] Console open (F12)
└─ [ ] Agent selected: GESTION BODEGAS GPT (S001)

Test GREEN (default on localhost):
├─ [ ] Send query: "¿Procedimiento inventario MB52?"
├─ [ ] Console shows: "Selected: GREEN"
├─ [ ] Search completes: <2s
├─ [ ] Results found: >0
├─ [ ] Similarity: >70%
├─ [ ] Total response: <8s
└─ [ ] No errors

Test BLUE (for comparison):
├─ [ ] export USE_OPTIMIZED_BIGQUERY=false
├─ [ ] Restart server
├─ [ ] Same query
├─ [ ] Console shows: "Using BLUE"
├─ [ ] Compare performance
└─ [ ] Document differences

Comparison:
├─ [ ] GREEN faster than BLUE?
├─ [ ] GREEN more results?
├─ [ ] GREEN better similarity?
├─ [ ] GREEN better UX?
└─ [ ] GREEN ready for production?
```

---

## 💡 **Pro Tips**

1. **Clear console between tests** - Easier to see routing decision
2. **Use same query** - Fair comparison
3. **Test 2-3 queries** - Verify consistency
4. **Note first vs subsequent** - Cold start vs warm
5. **Check similarity scores** - 70-95% = good, 50% = fallback

---

## 🎊 **What Success Looks Like**

### **GREEN Test Passing:**
```
You: Ask question
  ↓ (Immediate)
Console: "Routing to: GREEN"
  ↓ (<1s)
Console: "Search complete (450ms)"
  ↓ (<2s)
Console: "Found 8 chunks, 82% similarity"
  ↓ (2-3s)
UI: Response starts streaming
  ↓ (<8s total)
You: "Wow, this is fast!" ✅
```

**Then you know:** GREEN works, ready for production when you approve.

---

##Ready for Browser Test**

**Everything is set up:**
- ✅ GREEN table populated (8,403 chunks)
- ✅ Domain routing ready (localhost → GREEN)
- ✅ Server running (http://localhost:3000)
- ✅ Agent identified (GESTION BODEGAS S001)
- ✅ Test query prepared

**Just open the browser and test!**

**Or tell me:**
- "Test it for me" - I'll guide you through
- "Skip testing, looks good" - I'll document ready for production
- "Need more info" - I'll explain anything

**Your production is 100% safe. GREEN is ready. Just needs your validation.** 🎯✨

