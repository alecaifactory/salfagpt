# Testing Guide: Lazy Loading Context Sources

## 🎯 Goal
Verify that context sources now load 10-50x faster by excluding `extractedData` from initial queries.

---

## 🧪 Test Setup

### Prerequisites
1. ✅ Dev server running: `npm run dev`
2. ✅ Browser with DevTools (Chrome/Firefox/Safari)
3. ✅ User account with context sources uploaded
4. ✅ At least 2-3 agents with different context sources

---

## 📊 Performance Testing

### Test 1: Measure Initial Load Time

**Before Starting:**
1. Open browser
2. Open DevTools (F12 or Cmd+Opt+I)
3. Go to **Network** tab
4. Check "Disable cache" option
5. Filter by **Fetch/XHR**

**Steps:**
1. Navigate to `http://localhost:3000/chat`
2. Login with your account
3. Watch the Network tab for requests

**What to Look For:**

#### OLD Behavior (if still using old endpoint):
```
Request: /api/context-sources?userId=...
Size: 400-500KB ❌
Time: 1-3 seconds ❌
```

#### NEW Behavior (with optimization):
```
Request: /api/context-sources-metadata?userId=...
Size: 10-20KB ✅ (50x smaller!)
Time: 200-500ms ✅ (10x faster!)
```

**How to Check:**
- Click on the request in Network tab
- Look at **"Size"** column
- Look at **"Time"** column
- Click **"Response"** tab to see payload

**Expected Response Structure:**
```json
{
  "sources": [
    {
      "id": "abc123",
      "name": "Manual.pdf",
      "type": "pdf",
      "enabled": true,
      "metadata": {
        "pageCount": 25,
        "tokensEstimate": 12500
      }
      // ✅ NO extractedData field
    }
  ]
}
```

**✅ Success Criteria:**
- Response size: < 50KB (should be ~10-20KB)
- Response time: < 500ms
- No `extractedData` field in response

---

### Test 2: Verify List View Still Works

**Steps:**
1. Look at the left sidebar "Fuentes de Contexto" section
2. Verify all your context sources are listed
3. Check that each source shows:
   - ✅ Name
   - ✅ Type badge (PDF, CSV, etc.)
   - ✅ Model badge (Flash/Pro)
   - ✅ Validation badge (if validated)
   - ✅ RAG badge (if indexed)
   - ✅ Toggle switch
   - ✅ Settings icon

**What Should NOT Show:**
- ❌ Full extracted text content (that's OK!)
- ❌ Content preview (we'll add this later if needed)

**✅ Success Criteria:**
- All sources visible
- All metadata displays correctly
- No errors in console

---

### Test 3: Test Agent Switching Speed

**Setup:**
- Have at least 2 agents with different context sources

**Steps:**
1. Select Agent A
2. Note the context sources shown
3. Open DevTools → Performance tab
4. Click "Record"
5. Switch to Agent B
6. Stop recording
7. Look at the timeline

**What to Measure:**
- Time from click to sources displayed
- Network requests size
- JavaScript execution time

**Expected:**
- Switch time: < 500ms (vs 2-5s before)
- No long running tasks
- Smooth transition

**✅ Success Criteria:**
- Agent switch feels instant
- No UI lag or freezing
- Sources update immediately

---

### Test 4: Verify Sending Messages Still Works

**This is CRITICAL - we must ensure context is still included!**

**Steps:**
1. Select an agent
2. Toggle ON a context source
3. Open DevTools → Console tab
4. Send a message: "Summarize the document"
5. Watch console logs

**Expected Console Output:**
```
📥 Loading full context data for 1 sources...
✅ Loaded full context data
[Streaming message from AI...]
```

**Verify:**
1. AI response shows it has the context
2. Response is contextually relevant
3. No errors in console

**Example Test:**
- If you have a PDF about "Product Specifications"
- Ask: "What are the key specifications?"
- AI should answer based on the PDF content

**✅ Success Criteria:**
- Full `extractedData` loads before sending (on-demand)
- AI response includes context-specific information
- No degradation in AI quality

---

### Test 5: Check Network Payload Size

**Steps:**
1. Open DevTools → Network tab
2. Clear network log (trash icon)
3. Reload page (Cmd+R)
4. Wait for page to fully load
5. Look at bottom of Network tab

**What to Check:**
```
Before:
- Transferred: 1.5 MB ❌
- Resources: 500KB for context-sources ❌

After:
- Transferred: ~200 KB ✅
- Resources: ~15KB for context-sources-metadata ✅
```

**✅ Success Criteria:**
- Total page size reduced by 50-80%
- context-sources-metadata < 50KB
- Faster page load overall

---

### Test 6: Test Context Management Dashboard (Admin)

**Only if you're logged in as superadmin (alec@getaifactory.com)**

**Steps:**
1. Open user menu (bottom-left)
2. Click "Context Management"
3. Watch Network tab

**Expected:**
```
Request: /api/context-sources/all-metadata
Size: 20-100KB (depends on total sources)
Time: < 1 second
```

**Verify:**
- All sources load quickly
- Table displays correctly
- Can select sources
- Can assign to agents

**✅ Success Criteria:**
- Dashboard loads in < 1 second
- All sources visible
- All metadata correct
- No extractedData in initial load

---

## 🔍 Console Log Verification

### What You Should See

**On Page Load:**
```javascript
⚡ Loaded context sources metadata (optimized, no extractedData): 10
📊 RAG Status: [...]
✅ Context sources for agent abc123: { total: 5, public: 2, assigned: 3, active: 2 }
```

**When Switching Agents:**
```javascript
⚡ Loaded context sources metadata (optimized, no extractedData): 10
✅ Context sources for agent xyz789: { total: 3, public: 2, assigned: 1, active: 1 }
```

**When Sending Message:**
```javascript
📥 Loading full context data for 2 sources...
✅ Loaded full context data
[Streaming response starts...]
```

**What You Should NOT See:**
```javascript
❌ Loading all sources with extractedData... (old behavior)
❌ Response size: 500KB (old behavior)
```

---

## 🐛 Troubleshooting

### Issue 1: "Unauthorized" Error

**Symptom:** API returns 401 Unauthorized

**Solution:**
- Make sure you're logged in
- Check cookie `flow_session` exists
- Refresh the page

---

### Issue 2: Sources Not Loading

**Symptom:** Empty context sources list

**Check Console:**
```javascript
// Should see:
⚡ Loaded context sources metadata (optimized, no extractedData): N

// If you see error:
❌ Error fetching context sources metadata: [error]
```

**Solution:**
- Check Network tab for failed request
- Verify userId is correct
- Check Firestore connection

---

### Issue 3: AI Responses Missing Context

**Symptom:** AI doesn't seem to know about toggled sources

**Check Console:**
```javascript
// Should see before sending:
📥 Loading full context data for N sources...
✅ Loaded full context data

// If missing, extractedData not loading!
```

**Solution:**
- Verify `loadFullContextSources()` is called in `sendMessage()`
- Check `/api/context-sources/[id]` endpoint works
- Test manually:
  ```javascript
  // In browser console:
  fetch('/api/context-sources/YOUR_SOURCE_ID')
    .then(r => r.json())
    .then(data => console.log('Has extractedData:', !!data.source.extractedData))
  ```

---

### Issue 4: Still Slow Loading

**Symptom:** No performance improvement

**Diagnosis:**
1. Open Network tab
2. Find the context-sources request
3. Check which endpoint it's using

**If still using old endpoint:**
```
/api/context-sources?userId=... ❌ (old, slow)
```

**Should be using new endpoint:**
```
/api/context-sources-metadata?userId=... ✅ (new, fast)
```

**Solution:**
- Verify ChatInterfaceWorking.tsx was updated
- Hard refresh: Cmd+Shift+R
- Clear cache and reload

---

## 📈 Performance Comparison

### Real-World Example

**Scenario:** User with 10 PDFs (avg 50KB each)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load Size | 500KB | 10KB | **50x smaller** |
| Load Time | 2-5s | 0.2-0.5s | **10x faster** |
| Memory Usage | 500KB | 10KB | **50x less** |
| Agent Switch | 2-5s | 0.2-0.5s | **10x faster** |

**User Experience:**
- Before: Noticeable lag, feels slow ❌
- After: Instant, responsive ✅

---

## 🎯 Quick Visual Test

**Easiest way to verify:**

1. **Open browser with DevTools**
2. **Go to Network tab**
3. **Navigate to /chat**
4. **Look for this request:**
   ```
   context-sources-metadata?userId=...
   ```
5. **Click on it**
6. **Check Response tab:**
   - Should be small (~10-20KB)
   - Should NOT have `extractedData` fields
7. **Check Size column:**
   - Should show KB (not MB)
   - Should be < 50KB

**If you see those things → Optimization is working! ✅**

---

## 📱 Browser Testing Instructions

### Step-by-Step Visual Test

1. **Open:** http://localhost:3000/chat

2. **Login** with your account

3. **Open DevTools:**
   - Mac: Cmd+Opt+I
   - Windows: F12

4. **Go to Network Tab**

5. **Filter:** Click "Fetch/XHR" button

6. **Reload Page:** Cmd+R (or F5)

7. **Look for:** `context-sources-metadata` in the request list

8. **Click on it** and check:
   - **Headers tab:** Should show `/api/context-sources-metadata?userId=...`
   - **Response tab:** Should show JSON without `extractedData`
   - **Timing tab:** Should be < 500ms
   - **Size:** Should be < 50KB

9. **Test Sending Message:**
   - Toggle a source ON
   - Type: "What's in this document?"
   - Click Send
   - Watch Console tab for:
     ```
     📥 Loading full context data for 1 sources...
     ✅ Loaded full context data
     ```

10. **Verify AI Response:**
    - Should reference the document
    - Should answer based on content
    - Should work exactly as before

---

## ✅ Success Checklist

After testing, verify:

- [ ] ⚡ Page loads noticeably faster
- [ ] 📦 Network payload is 10-50KB (not 500KB)
- [ ] 🎯 All sources visible in sidebar
- [ ] 🔄 Toggles work correctly
- [ ] 💬 Sending messages still includes context
- [ ] 🤖 AI responses are contextually relevant
- [ ] 🔀 Agent switching is instant
- [ ] 📊 Admin dashboard loads quickly
- [ ] ❌ No errors in console
- [ ] ✅ All features work as before

---

## 📊 Performance Metrics to Record

If you want to measure precisely:

### Using Chrome DevTools Performance Tab

1. Open DevTools → Performance
2. Click Record (circle icon)
3. Navigate to /chat and login
4. Stop recording
5. Look for:
   - "context-sources-metadata" network request
   - Time to render sources list
   - Total page load time

### Using Network Tab

1. Clear network log
2. Reload page
3. Check bottom status bar:
   ```
   Before: "23 requests | 1.2 MB transferred | 3.5s finish"
   After:  "23 requests | 200 KB transferred | 1.2s finish"
   ```

---

## 🎉 What Success Looks Like

**You'll know it's working when:**

1. **Page loads feel instant** - No waiting for sources
2. **Agent switching is smooth** - No lag between agents
3. **Network tab shows small payloads** - KB not MB
4. **Console shows optimization logs:**
   ```
   ⚡ Loaded context sources metadata (optimized, no extractedData): 10
   ```
5. **AI still has context** - Responses are relevant

---

## 📝 Report Results

After testing, please report:

1. **Load Time:**
   - Before: ___ seconds
   - After: ___ seconds
   - Improvement: ___x faster

2. **Network Size:**
   - Before: ___ KB
   - After: ___ KB
   - Reduction: ___x smaller

3. **User Experience:**
   - Feels faster: Yes/No
   - Any issues: List any problems

4. **Features Working:**
   - List view: ✅/❌
   - Send message: ✅/❌
   - AI context: ✅/❌
   - Agent switch: ✅/❌

---

**Created:** 2025-10-21  
**Status:** Ready for Testing  
**Expected Result:** 10x faster page loads

