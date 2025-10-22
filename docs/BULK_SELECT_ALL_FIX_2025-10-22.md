# Bulk Select All Fix - Context Management

**Date:** October 22, 2025  
**Component:** `ContextManagementDashboard.tsx`  
**Issue:** "Select All" only selected 9-10 documents instead of all 538 documents with tag M001  
**Status:** ✅ Fixed

---

## 🎯 Problem

When filtering by tag "M001" (538 documents):
1. User clicks tag filter "M001 (538)"
2. UI loads first 10 documents (pagination)
3. User clicks "Select All"
4. **Expected:** All 538 documents selected
5. **Actual:** Only 9 documents selected (currently loaded in UI)

**Root Cause:**

```typescript
// ❌ OLD CODE: Only selected from currently loaded sources
const selectAllFilteredSources = () => {
  const filteredIds = filteredSources.map(s => s.id);
  setSelectedSourceIds(filteredIds);
};

// filteredSources = sources.filter(...) 
// sources = only 10 documents loaded (pagination)
```

**Why This Happened:**
- Context sources are paginated (10 at a time) for performance
- `selectAllFilteredSources()` only looked at `filteredSources`
- `filteredSources` is a client-side filter of the `sources` array
- `sources` array only contains currently loaded documents
- To select all 538, user would need to click "Cargar 10 más" 53 times first!

---

## ✅ Solution Implemented

### 1. Created Backend API Endpoint

**New File:** `src/pages/api/context-sources/ids-by-tags.ts`

**Purpose:** Return ALL source IDs matching given tags (server-side query)

**Query:**
```typescript
GET /api/context-sources/ids-by-tags?tags=M001

Response:
{
  sourceIds: string[],  // All 538 IDs
  count: 538,
  tags: ['M001']
}
```

**Implementation:**
```typescript
// Query Firestore for ALL sources with matching tags
const sourcesSnapshot = await firestore
  .collection('context_sources')
  .where('userId', '==', session.id)           // ✅ User isolation
  .where('labels', 'array-contains-any', tags) // ✅ Tag filter
  .select('__name__')                          // ✅ Only IDs (efficient)
  .get();

const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
```

**Key Features:**
- ✅ Efficient: Only fetches document IDs, not full documents
- ✅ Secure: Filters by userId (privacy)
- ✅ Fast: Single query for all matching documents
- ✅ Scalable: Works with any number of documents

---

### 2. Updated Frontend Select All Functions

**File:** `src/components/ContextManagementDashboard.tsx`

There are TWO "Select All" buttons that needed fixing:

#### A. Top-Level "Select All" Button (line 795)

**Old Code:**
```typescript
const selectAllFilteredSources = () => {
  const filteredIds = filteredSources.map(s => s.id);
  setSelectedSourceIds(filteredIds);
};
```

#### B. Folder-Level "Select All" Button (line 909)

**Old Code:**
```typescript
const selectAllInFolder = (folderName: string, event: React.MouseEvent) => {
  event.stopPropagation();
  const folderSources = sourcesByTag.get(folderName) || [];
  const folderIds = folderSources.map(s => s.id);
  setSelectedSourceIds(prev => {
    const combined = new Set([...prev, ...folderIds]);
    return Array.from(combined);
  });
};
```

#### A. New Code (Top-Level):
```typescript
const selectAllFilteredSources = async () => {
  // If tag filter is active, load ALL matching source IDs from backend
  if (selectedTags.length > 0) {
    setLoading(true);
    try {
      const tagsParam = selectedTags.join(',');
      const response = await fetch(`/api/context-sources/ids-by-tags?tags=${tagsParam}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const allMatchingIds = data.sourceIds || [];
        console.log(`✅ Selecting ALL ${allMatchingIds.length} sources matching tags:`, selectedTags);
        setSelectedSourceIds(allMatchingIds);
      } else {
        console.error('❌ Failed to load all source IDs:', response.status);
        // Fallback to current loaded sources
        const filteredIds = filteredSources.map(s => s.id);
        setSelectedSourceIds(filteredIds);
      }
    } catch (error) {
      console.error('Error loading all source IDs:', error);
      // Fallback to current loaded sources
      const filteredIds = filteredSources.map(s => s.id);
      setSelectedSourceIds(filteredIds);
    } finally {
      setLoading(false);
    }
  } else {
    // No filter active - select all currently loaded sources
    const filteredIds = filteredSources.map(s => s.id);
    setSelectedSourceIds(filteredIds);
  }
};
```

**Behavior:**
- ✅ Tag filter active → Queries backend for ALL matching IDs
- ✅ No tag filter → Selects currently loaded sources (old behavior)
- ✅ Fallback → If API fails, selects loaded sources
- ✅ Loading indicator → Shows spinner during fetch

#### B. New Code (Folder-Level):
```typescript
const selectAllInFolder = async (folderName: string, event: React.MouseEvent) => {
  event.stopPropagation();
  
  // Fetch ALL source IDs for this folder/tag from backend
  setLoading(true);
  try {
    const response = await fetch(`/api/context-sources/ids-by-tags?tags=${folderName}`, {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      const allFolderIds = data.sourceIds || [];
      console.log(`✅ Selecting ALL ${allFolderIds.length} sources in folder "${folderName}"`);
      
      // Add to existing selection
      setSelectedSourceIds(prev => {
        const combined = new Set([...prev, ...allFolderIds]);
        return Array.from(combined);
      });
    } else {
      // Fallback to currently loaded sources
      const folderSources = sourcesByTag.get(folderName) || [];
      const folderIds = folderSources.map(s => s.id);
      setSelectedSourceIds(prev => {
        const combined = new Set([...prev, ...folderIds]);
        return Array.from(combined);
      });
    }
  } catch (error) {
    // Fallback to currently loaded sources
    const folderSources = sourcesByTag.get(folderName) || [];
    const folderIds = folderSources.map(s => s.id);
    setSelectedSourceIds(prev => {
      const combined = new Set([...prev, ...folderIds]);
      return Array.from(combined);
    });
  } finally {
    setLoading(false);
  }
};
```

**Behavior:**
- ✅ Always queries backend for ALL folder sources
- ✅ Adds to existing selection (doesn't replace)
- ✅ Fallback to loaded sources if API fails
- ✅ Loading indicator during fetch

---

### 3. Enhanced UI Feedback

**Updated "Select All" Button:**

```typescript
<button
  onClick={selectAllFilteredSources}
  disabled={loading}
  className="text-gray-600 hover:text-gray-900 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
>
  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
  Select All
  {selectedTags.length > 0 && (
    <span className="text-blue-600 font-semibold">
      ({folderStructure.find(f => selectedTags.includes(f.name))?.count || '?'})
    </span>
  )}
</button>
```

**New Features:**
- ✅ Shows spinner during loading
- ✅ Disabled during loading
- ✅ Shows total count next to button when tag filter active
- ✅ Example: "Select All (538)" when M001 tag is selected

---

## 🧪 Testing Procedure

### Test 1: Select All in Folder (Main Issue - Folder Button)

1. Open Context Management Dashboard
2. Expand folder "M001 (538 documentos)"
3. Click "Select All" button next to folder name
4. Wait for loading spinner (~0.5s)
5. **Expected:** Console shows "✅ Selecting ALL 538 sources in folder 'M001'"
6. **Expected:** "538 sources selected" appears at top
7. **Expected:** Bulk Assignment panel shows all 538 sources

### Test 2: Select All with Tag Filter (Top-Level Button)

1. Open Context Management Dashboard
2. Click tag filter "M001 (538)" at top
3. Verify only 10 documents shown in UI (pagination)
4. Click "Select All (538)" button at top-right
5. Wait for loading spinner
6. **Expected:** "538 sources selected" appears
7. **Expected:** Bulk Assignment panel shows all 538 sources

### Test 3: Assign to Agent M001

1. After selecting all 538 sources (Test 1 or Test 2)
2. In "Assign to Agents" section, check "M001"
3. Click "Assign 538 Sources" button
4. Confirm assignment
5. **Expected:** All 538 documents assigned to M001 agent
6. **Expected:** Success message shows "538 documentos asignados en Xs"

### Test 4: Select All without Filter (Existing Behavior)

1. Clear tag filter (click "Clear" or deselect M001)
2. Verify 10 documents visible
3. Click "Select All"
4. **Expected:** 10 sources selected (current loaded sources)
5. **Expected:** No backend API call (instant selection)

### Test 5: Error Handling

1. Disconnect network (simulate API failure)
2. Filter by tag M001
3. Click "Select All"
4. **Expected:** Falls back to selecting 10 currently loaded sources
5. **Expected:** Console shows error but doesn't crash

---

## 📊 Performance Impact

**Before:**
- Select All: Instant (client-side only)
- Limited to: Currently loaded documents (~10)
- User workaround: Click "Cargar 10 más" 53+ times

**After:**
- Select All (no filter): Instant (client-side)
- Select All (with filter): ~500ms (backend query)
- Can select: ALL matching documents (538+)
- User workaround: None needed ✅

**Backend Query Performance:**
```sql
-- Firestore query (estimated)
SELECT __name__ 
FROM context_sources 
WHERE userId = 'xxx' 
  AND labels ARRAY_CONTAINS_ANY ['M001']

-- Results: 538 document IDs
-- Time: ~200-500ms
-- Cost: Minimal (only fetching IDs, not full documents)
```

---

## 🔐 Security

**Verification:**
- ✅ Requires authentication (`getSession`)
- ✅ Filters by `userId` (user isolation)
- ✅ Only returns document IDs (not sensitive data)
- ✅ No risk of data leakage

---

## 🚀 Deployment

**Files Modified:**
1. `src/components/ContextManagementDashboard.tsx`
   - Updated `selectAllFilteredSources()` function (line 795) - Top-level "Select All"
   - Updated `selectAllInFolder()` function (line 909) - Folder-level "Select All"
   - Enhanced both "Select All" buttons UI (lines 1475, 1615)

2. `src/pages/api/context-sources/ids-by-tags.ts` (NEW - 94 lines)
   - Backend API endpoint for fetching all matching source IDs by tag

**Deployment Steps:**
1. Type check: `npm run type-check` ✅
2. Test locally: Test all 5 scenarios above
3. Commit changes
4. Deploy to production

**Backward Compatibility:**
- ✅ No breaking changes
- ✅ Existing behavior preserved (no tag filter)
- ✅ Additive only (new API endpoint)
- ✅ Graceful degradation (fallback if API fails)

---

## 📈 Expected Results

**Scenario:** User has 538 documents tagged "M001"

**Before Fix:**
1. Filter by M001
2. Click "Select All"
3. Result: 9 sources selected ❌

**After Fix:**
1. Filter by M001
2. Click "Select All (538)"
3. Loading spinner shows ~0.5s
4. Result: 538 sources selected ✅
5. Click "Assign 538 Sources" to M001 agent
6. All 538 documents assigned in batch ✅

---

## 🎯 Success Criteria

- [x] API endpoint created (`ids-by-tags.ts`)
- [x] Frontend function updated (`selectAllFilteredSources`)
- [x] UI shows total count in button
- [x] Loading indicator during fetch
- [x] Fallback to local sources if API fails
- [x] Type check passes (0 errors)
- [x] Backward compatible
- [ ] Manual testing completed (pending user verification)

---

**Last Updated:** 2025-10-22  
**Status:** ✅ Ready for Testing  
**Impact:** Critical - Enables bulk assignment of 538 documents  
**Breaking Changes:** None

