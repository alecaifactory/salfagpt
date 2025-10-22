# Context Loading - Visual Flow Diagram

**Date**: 2025-10-21  
**Type**: Architecture Diagram  
**Status**: Reference Documentation

---

## 🎨 Before Optimization (Heavy & Slow)

```
┌─────────────────────────────────────────────────────────┐
│  USER ASSIGNS DOCUMENT TO AGENTS                        │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/bulk-assign                                   │
│  Time: ~500ms                                            │
│  Data: 1KB                                               │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  loadAllSources() - Reload ALL metadata                 │
│  Time: ~1s                                               │
│  Data: ~100KB                                            │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  onSourcesUpdated() → loadContextForConversation()      │
│  Time: ~2-4s                                             │
│  Data: ~500KB-2MB                                        │
│  ├─ Fetch all metadata again                            │
│  ├─ Filter by agent                                     │
│  └─ Verify RAG chunks for EACH source (5-10 calls)      │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  UI UPDATES (finally!)                                   │
│  Total Time: 3-5s ❌                                     │
│  Total Calls: 15-20                                      │
│  Total Data: 600KB-2.1MB                                 │
└─────────────────────────────────────────────────────────┘
```

**User sees**: Loading spinner for 3-5 seconds ❌

---

## ✅ After Optimization (Fast & Lightweight)

```
┌─────────────────────────────────────────────────────────┐
│  USER ASSIGNS DOCUMENT TO AGENTS                        │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/bulk-assign                                   │
│  Time: ~100ms                                            │
│  Data: 1KB                                               │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  Update Local State (Optimistic)                        │
│  Time: ~50ms                                             │
│  Data: 0 (in-memory)                                     │
│  setSources(prev => prev.map(...))                       │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  UI UPDATES INSTANTLY ⚡                                 │
│  Total Time: ~100ms ✅                                   │
│  Total Calls: 1                                          │
│  Total Data: 1KB                                         │
└─────────────────────────────────────────────────────────┘

... later when modal closes ...

┌─────────────────────────────────────────────────────────┐
│  USER CLOSES MODAL                                       │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  GET /api/conversations/:id/context-sources-metadata    │
│  Time: ~200ms                                            │
│  Data: ~10KB                                             │
│  • Pre-filtered by agent (PUBLIC + assigned)            │
│  • Includes toggle state                                │
│  • NO RAG verification                                  │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  UI UPDATES (left panel)                                │
│  Total Time: ~200ms ✅                                   │
│  Total Calls: 1                                          │
│  Total Data: 10KB                                        │
└─────────────────────────────────────────────────────────┘
```

**User sees**: Instant updates, no loading spinners ✅

**Combined total**: ~300ms (15-25x faster than before)

---

## 🎯 Tier Comparison Visual

### Tier 1: Optimistic (Instant)

```
Assignment
    ↓
Update Memory [⚡ 50ms]
    ↓
UI Update [Instant]

No network calls during update!
```

### Tier 2: Lightweight (Fast)

```
Modal Close
    ↓
Single API Call [📡 200ms]
  ├─ Filtered by agent
  ├─ Metadata only
  └─ No RAG verification
    ↓
UI Update [⚡ Fast]

1 call, minimal data
```

### Tier 3: Full Load (Accurate)

```
Agent Switch
    ↓
Metadata API [📡 500ms]
    ↓
Filter Sources [⚡ 50ms]
    ↓
Verify RAG for Each [📡 1-4s]
  ├─ Source 1 → chunks [200ms]
  ├─ Source 2 → chunks [200ms]
  ├─ Source 3 → chunks [200ms]
  └─ Source N → chunks [200ms]
    ↓
UI Update [⚡ 100ms]

Multiple calls, complete accuracy
```

---

## 📊 Data Size Comparison

### Metadata Only vs Full Source

**Metadata** (Tier 1 & 2):
```json
{
  "id": "source-123",
  "name": "Document.pdf",
  "type": "pdf",
  "assignedToAgents": ["agent-1", "agent-2"],
  "enabled": true,
  "labels": ["PUBLIC"],
  "metadata": {
    "pageCount": 42,
    "tokensEstimate": 25000
  },
  "ragEnabled": true,
  "ragMetadata": {
    "chunkCount": 58,
    "avgChunkSize": 450
  }
}
```
**Size**: ~500 bytes per source

---

**Full Source** (Never loaded in frontend):
```json
{
  ... (metadata above) ...
  "extractedData": "Full text content of 42-page PDF document with all paragraphs, tables, images described... (25,000 tokens / ~100KB of text)"
}
```
**Size**: ~100KB per source

**Savings**: 200x less data (500 bytes vs 100KB)

---

## 🔍 Network Traffic Visualization

### Before (Heavy)

```
Assignment Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
│ Assignment │ Load All │ Load Context │ RAG×5 │
│   500ms    │   1s     │    500ms     │  2s   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 4s

Modal Close Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ Load Context │ RAG×5 │
│    500ms     │  2s   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 2.5s

COMBINED: 6.5s ❌
```

### After (Lightweight)

```
Assignment Flow:
━━━━━━━━━━━
│ Assign │
│  100ms │
━━━━━━━━━━━
Total: 100ms

Modal Close Flow:
━━━━━━━━━━━━━━━
│ Lightweight │
│    200ms    │
━━━━━━━━━━━━━━━
Total: 200ms

COMBINED: 300ms ✅
```

**Visual Comparison**:
```
Before: ████████████████████████████████ (6.5s)
After:  █ (0.3s)

21x faster!
```

---

## 🎓 Key Takeaways

1. **Measure First**: We identified the bottleneck (RAG verification cascade)
2. **Optimize Smartly**: Different tiers for different needs
3. **User-Centric**: Optimize the 80% case, accept slower for 20%
4. **Network is Slow**: Minimize calls, minimize data
5. **Trust When Safe**: Don't verify unnecessarily

---

## 📝 Usage Guide

### For Developers

**Adding new context operation?**

Ask:
1. Does user need instant feedback? → Tier 1 (optimistic)
2. Does user need current assignments? → Tier 2 (lightweight)
3. Does user need verified RAG state? → Tier 3 (full)
4. Does user need content? → Lazy load on-demand

**Default**: Start with Tier 2, upgrade to Tier 3 only if needed.

### For QA Testing

**Check performance**:
1. Open DevTools → Network tab
2. Perform assignment
3. Count API calls (should be 1)
4. Measure time (should be <200ms)
5. Close modal
6. Measure time (should be <300ms)

**Red flags**:
- 🚩 More than 2 API calls total
- 🚩 Any operation > 1s
- 🚩 Loading spinners during assignment
- 🚩 Delays when closing modal

---

**Performance is architecture. Design for speed from the start.** ⚡🏗️

---

**Last Updated**: 2025-10-21  
**Version**: 1.0.0  
**Status**: ✅ Reference Documentation

