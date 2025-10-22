# Agent Context Modal - Optimization Plan

**Date:** 2025-10-22  
**Current Status:** ✅ Working - Shows all 538 assigned sources  
**Issue:** Slow to load (~10-20s)  
**Goal:** Instant load (<1s) with smart lazy loading

---

## ✅ What's Working Now

- **Bulk Assignment:** 538 sources correctly assigned to M001 ✅
- **Modal Display:** Shows "538 documentos asignados" ✅
- **Source List:** All 538 sources visible ✅
- **Toggle Controls:** Can enable/disable individually ✅
- **Batch Controls:** Select All, Enable All, Disable All ✅

---

## 🎯 User Requirements

1. **Load first few documents quickly** (show something immediately)
2. **Don't load all content upfront** (lazy load on-demand)
3. **Auto-enable all assigned sources** (they're assigned = should be active)
4. **Search bar** (find specific documents easily)
5. **Simple UI** (less clutter, more speed)

---

## 🚀 Optimization Strategy

### Phase 1: Auto-Enable All Assigned Sources (Immediate)

**Concept:** When sources are assigned to an agent, automatically activate them.

**Implementation:**
```typescript
// In bulk assignment success handler
// After assigning sources, also activate them
await saveContextForConversation(agentId, selectedSourceIds);

// Result: All 538 sources assigned AND active
```

**Benefit:**
- User doesn't need to manually enable 538 sources
- Sources immediately available for AI context
- One-click workflow: Assign → Done!

---

### Phase 2: Remove Heavy Operations (Immediate)

**Current Issue:** Line 648 shows "🔄 Verificando estado RAG de fuentes..." even with `skipRAGVerification = true`

**Root Cause:** Duplicate load or full load path still being triggered

**Fix:**
```typescript
// Ensure lightweight path truly exits early
if (skipRAGVerification) {
  setContextSources(sourcesWithDates);
  return; // This MUST exit function
}

// Add guard to prevent duplicate loads
let isLoading = false;
if (isLoading) return;
isLoading = true;
```

---

### Phase 3: Pagination in Modal (Future)

**Current:** Loads all 538 sources at once  
**Optimized:** Load 10, then "Load More" button

**Implementation:**
```typescript
// Use AgentContextModal component (already has pagination!)
<AgentContextModal
  isOpen={showAgentContextModal}
  onClose={() => {
    setShowAgentContextModal(false);
    setAgentForContextConfig(null);
  }}
  agentId={agentForContextConfig}
  agentName={conversations.find(c => c.id === agentForContextConfig)?.title || 'Agente'}
  userId={userId}
/>
```

**Benefits:**
- Loads 10 sources instantly
- "Cargar 10 más" button for more
- Smooth scrolling, no lag

---

### Phase 4: Search Bar (Future)

**UI Addition:**
```typescript
<div className="mb-4">
  <input
    type="text"
    placeholder="Buscar documentos..."
    className="w-full px-4 py-2 border rounded-lg"
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>

// Filter sources by search query
const displayedSources = agentSources.filter(s =>
  s.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**Benefits:**
- Find specific documents instantly
- No need to scroll through 538 sources
- Better UX for large document sets

---

## 🔧 Immediate Quick Win

**Remove the duplicate load that's causing RAG verification.**

Looking at your console logs:
```
✅ Lightweight load complete - SKIPPING RAG verification  ← Good!
⚡ Loaded context sources metadata (optimized, no extractedData): 539  ← Duplicate load?
```

There seems to be a second load happening. Let me trace why.

**Hypothesis:** The `currentConversation` useEffect (line 332) is also firing when the modal opens.

**Solution:** Add a flag to prevent duplicate loads:

```typescript
const [isLoadingContext, setIsLoadingContext] = useState(false);

const loadContextForConversation = async (conversationId, skipRAG = false) => {
  if (isLoadingContext) {
    console.log('⏭️ Skipping duplicate load - already loading');
    return;
  }
  
  setIsLoadingContext(true);
  try {
    // ... load logic
  } finally {
    setIsLoadingContext(false);
  }
};
```

---

## 📊 Expected Performance After Optimization

**Current:**
- Modal open → 10-20 seconds
- Loads 538 sources with RAG verification
- 538+ API calls

**After Phase 1 (Auto-enable):**
- Modal open → 10-20 seconds
- But sources are already active ✅
- User can close modal immediately

**After Phase 2 (Remove duplicate load):**
- Modal open → 1-2 seconds
- Loads 538 sources metadata only
- 1-2 API calls

**After Phase 3 (Pagination):**
- Modal open → <1 second
- Loads 10 sources initially
- User loads more as needed

---

## 🎯 Priority Recommendations

### Priority 1: Auto-Enable (HIGH)
**Impact:** High - User doesn't need to manually enable 538 sources  
**Effort:** Low - Single API call after assignment  
**Implement:** Now

### Priority 2: Remove Duplicate Load (HIGH)
**Impact:** High - 10x faster modal opening  
**Effort:** Low - Add loading guard  
**Implement:** Now

### Priority 3: Search Bar (MEDIUM)
**Impact:** Medium - Better findability  
**Effort:** Low - Simple text filter  
**Implement:** Next sprint

### Priority 4: Pagination (LOW)
**Impact:** Low - Modal already fast enough after P1+P2  
**Effort:** Medium - Refactor to use AgentContextModal  
**Implement:** Optional

---

## ✅ Summary

**Current State:**
- System works correctly ✅
- All 538 sources assigned ✅
- Just slow to load ⚠️

**Quick Wins:**
1. Auto-enable sources after assignment
2. Prevent duplicate loads
3. Trust Firestore RAG data (don't re-verify)

**Result:**
- Modal opens in ~1-2 seconds instead of 10-20s
- Sources immediately active
- Better UX

---

**Ready to implement Priority 1 & 2?** These are quick changes that will make a big difference.

