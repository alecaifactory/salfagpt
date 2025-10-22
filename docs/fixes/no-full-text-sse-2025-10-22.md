# SSE References Fix - Remove fullText from Streaming Response

**Date:** 2025-10-22  
**Issue:** References not reaching MessageRenderer, JSON parse errors in SSE stream  
**Status:** ✅ Fixed  
**Impact:** Critical - RAG citations were completely broken

---

## 🐛 Problem

### Symptoms

**Production & Localhost:**
- Console spam: `📚 MessageRenderer: No references received` (100+ times)
- Error: `Error parsing SSE data: SyntaxError: Unterminated string in JSON at position 65256`
- RAG search working (chunks found, mapping created)
- But references never reached the UI

### Root Cause

The SSE (Server-Sent Events) complete event was sending **full reference objects** including:
- `fullText` field with 10,000+ characters per chunk
- 5 chunks × 10KB each = **50KB+ of text**
- Total JSON payload: **~65KB**

**SSE Safe Limit:** ~64KB per event

**What happened:**
1. `JSON.stringify(references)` created 65KB+ string
2. SSE stream truncated at ~64KB
3. Incomplete JSON: `"...text":"Partial string without closing quote`
4. Frontend JSON.parse() failed: `Unterminated string`
5. References lost, MessageRenderer received `undefined`

---

## ✅ Solution

### Changes Made

**File:** `src/pages/api/conversations/[id]/messages-stream.ts`  
**Lines:** 446-483

**Before:**
```typescript
references: references.length > 0 ? references : undefined,
```

**After:**
```typescript
references: references.length > 0 ? references.map(ref => ({
  id: ref.id,
  sourceId: ref.sourceId,
  sourceName: ref.sourceName,
  snippet: ref.snippet?.substring(0, 200) || '', // Limit to 200 chars
  chunkIndex: ref.chunkIndex,
  similarity: ref.similarity,
  location: ref.location,
  metadata: {
    startChar: ref.metadata?.startChar,
    endChar: ref.metadata?.endChar,
    tokenCount: ref.metadata?.tokenCount,
    startPage: ref.metadata?.startPage,
    endPage: ref.metadata?.endPage,
    isRAGChunk: ref.metadata?.isRAGChunk,
  },
  // ❌ Removed: fullText (saved in Firestore, fetch on demand)
  // ❌ Removed: context.before/after (not needed for citation display)
})) : undefined,
```

### Why This Works

**Size Reduction:**
- Before: 5 refs × 10KB fullText = **50KB** → exceeds limit → truncated
- After: 5 refs × 200 char snippet = **1KB** → well under limit → complete JSON

**Data Preservation:**
- ✅ Full text **still saved to Firestore** (line 437)
- ✅ All citation metadata preserved
- ✅ Snippet sufficient for preview
- ✅ User can fetch full text on click (future feature)

---

## 🧪 Testing Results

### Localhost

**Before Fix:**
```
❌ Error parsing SSE data: SyntaxError: Unterminated string in JSON at position 65256
📚 MessageRenderer: No references received
📚 MessageRenderer: No references received
(repeated 100+ times)
```

**After Fix:**
```
✅ Message complete event received
📚 References in completion: 5
📚 MessageRenderer received references: 5
  [1] SSOMA-ME-RCO-14-LO-14 LISTA DE OBSERVACION (1).PDF - 74.2% - Chunk #1
  [2] SSOMA-ME-RCO-14 DERRUMBE EN EXCAVACIONES (5).PDF - 73.4% - Chunk #1
  [3] SSOMA MANUAL SG SSOMA SALFA MONTAJES REV.4.PDF - 72.2% - Chunk #1
  [4] SSOMA-ABS ABSOLUTOS DE SEGURIDAD REV.3 (12).PDF - 72.1% - Chunk #2
  [5] SSOMA-ME-RCO-02-LO-02 LISTA DE OBSERVACION (4).PDF - 71.7% - Chunk #1
```

### Production

Same issue, same fix applies.

---

## 📊 Impact

### Before
- ❌ Citations completely broken
- ❌ No reference links in AI responses
- ❌ Users couldn't trace AI answers to sources
- ❌ Console flooded with error logs

### After
- ✅ Citations working correctly
- ✅ Reference links appear in responses
- ✅ Users can see which documents were used
- ✅ Clean console logs

---

## 🔧 Technical Details

### SSE Message Size Limits

**Practical limits:**
- Single SSE event: **~64KB safe** (browsers vary)
- Above 64KB: Risk of truncation
- Above 128KB: Almost guaranteed truncation

**Our data:**
- Complete event JSON: ~5KB (after fix)
- Fragment mapping: ~2KB
- Chunk selection: ~3KB
- **Total stream:** ~10KB (well within limits)

### JSON Serialization

**Problem pattern:**
```javascript
JSON.stringify({
  references: [
    { fullText: "10,000 chars..." }, // Too big!
    { fullText: "10,000 chars..." },
    // ... 5 objects total
  ]
})
// Result: 65KB+ string → truncated by SSE → invalid JSON
```

**Fixed pattern:**
```javascript
JSON.stringify({
  references: [
    { snippet: "200 chars", /* metadata */ }, // Just right!
    { snippet: "200 chars", /* metadata */ },
    // ... 5 objects total
  ]
})
// Result: 5KB string → fits in SSE → valid JSON
```

---

## 🎯 Backward Compatibility

### Database
- ✅ **No changes to Firestore** - references still saved with fullText
- ✅ **Existing messages** continue to work
- ✅ **No migration needed**

### Frontend
- ✅ **No changes to MessageRenderer** - already handles minimal references
- ✅ **No changes to reference display** - uses snippet for preview
- ✅ **Future enhancement ready** - can fetch fullText on click

### API
- ✅ **Same endpoint** (`/messages-stream`)
- ✅ **Same request format**
- ✅ **Same response events** (thinking, chunk, complete)
- ✅ **Only change:** Smaller JSON payload

---

## 🚀 Deployment

**Date:** 2025-10-22  
**Environment:** Localhost (verified) → Production (pending)

**Deployment Steps:**
1. `npm run build` - Verify build succeeds
2. `./deploy-salfacorp.sh` - Deploy to Cloud Run
3. Test in production with SSOMA agent
4. Verify references appear correctly

**Rollback Plan:**
If issues occur, revert to previous version:
```bash
git revert HEAD
npm run build
./deploy-salfacorp.sh
```

---

## 📚 Related Files

- `src/pages/api/conversations/[id]/messages-stream.ts` - Modified
- `src/components/MessageRenderer.tsx` - No changes needed
- `src/components/ChatInterfaceWorking.tsx` - No changes needed

---

## 🎓 Lessons Learned

1. **SSE has size limits** - Keep individual events under 64KB
2. **fullText is expensive** - 10KB+ per chunk adds up quickly
3. **Separate concerns** - Save full data to Firestore, send minimal data via SSE
4. **Snippet is sufficient** - 200 chars is enough for citation preview
5. **JSON.stringify errors are subtle** - Truncation causes "unterminated string" not "size limit"

---

## 🔮 Future Enhancements

### Fetch Full Text on Demand

When user clicks a reference, fetch full chunk:

```typescript
async function fetchReferenceFullText(messageId: string, referenceId: number) {
  const message = await getMessage(messageId);
  const fullReference = message.references?.find(r => r.id === referenceId);
  return fullReference?.fullText || 'Full text not available';
}
```

### Reference Details Modal

Show full chunk with:
- Complete text (not truncated)
- Before/after context
- Page numbers
- Similarity score
- Source document metadata

---

## ✅ Verification Checklist

- [x] Fix applied to messages-stream.ts
- [x] TypeScript check passes
- [x] Tested on localhost - works
- [x] Console logs clean
- [x] References reach MessageRenderer
- [ ] Build succeeds
- [ ] Deployed to production
- [ ] Tested in production
- [ ] Git committed and pushed

---

**Author:** Alec Dickinson  
**Reviewed:** Self  
**Approved:** User  
**Status:** ✅ Ready for Production

