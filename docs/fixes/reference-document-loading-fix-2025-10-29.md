# 🔧 Fix: Reference Document Loading - 2025-10-29

## 🎯 Problem

When clicking "Ver documento completo" in the Reference Panel (panel derecho), the system showed an error message saying the document wasn't in context, even though it should be available.

### Root Cause

The `onViewFullDocument` callback in `ChatInterfaceWorking.tsx` (line ~5589) was trying to find the source in the `contextSources` array:

```typescript
// ❌ BEFORE (BROKEN)
onViewFullDocument={(sourceId) => {
  const source = contextSources.find(s => s.id === sourceId);
  if (source) {
    setSettingsSource(source);
    setSelectedReference(null);
  }
}}
```

**Why this failed:**
1. The `contextSources` array only contains sources **currently loaded in the context panel**
2. This array might be filtered by agent (only shows sources assigned to current agent)
3. The array might only contain **metadata** without `extractedData`
4. When clicking a reference from an old message, that source might not be in the current context

---

## ✅ Solution

Changed the callback to **always fetch the full source from the API** using the existing `loadFullContextSource` function:

```typescript
// ✅ AFTER (FIXED)
onViewFullDocument={async (sourceId) => {
  console.log('📄 Attempting to load full document for reference:', sourceId);
  
  // ✅ FIX: Always fetch full source from API, don't rely on contextSources array
  const fullSource = await loadFullContextSource(sourceId);
  
  if (fullSource) {
    console.log('✅ Loaded full source, opening settings modal:', fullSource.name);
    setSettingsSource(fullSource);
    setSelectedReference(null);
  } else {
    console.error('❌ Could not load full source for:', sourceId);
    alert('No se pudo cargar el documento completo. Por favor, intenta nuevamente.');
  }
}}
```

### What Changed

1. **Made async**: The callback is now `async` to allow API call
2. **Uses API endpoint**: Calls `/api/context-sources/${sourceId}` to get full data
3. **Always gets full data**: The API endpoint returns the complete source including `extractedData`
4. **Better error handling**: Shows user-friendly alert if loading fails
5. **Console logging**: Added logs to help debug issues

---

## 🔍 How It Works Now

### Complete Flow

```
1. User clicks reference badge [1] in message
   ↓
2. ReferencePanel opens (right side)
   Shows: snippet, similarity score, source name
   ↓
3. User clicks "Ver documento completo"
   ↓
4. System calls: GET /api/context-sources/{sourceId}
   ↓
5. API endpoint (src/pages/api/context-sources/[id].ts):
   - Verifies authentication
   - Loads FULL source from Firestore (including extractedData)
   - Verifies ownership
   - Returns complete source
   ↓
6. Frontend receives full source with:
   - id, name, type
   - extractedData (full text)
   - metadata (extraction info)
   - ragMetadata (if indexed)
   - chunks (if RAG enabled)
   ↓
7. Opens ContextSourceSettingsModal with full source
   ↓
8. Modal displays:
   ✅ Texto Extraído (full or truncated with count)
   ✅ Información de Extracción (model, time, cost)
   ✅ Indexación RAG (chunks if available)
   ✅ Archivo Original (storage location if available)
```

---

## 🧪 How to Test

### Test Case 1: Recent Document (With Cloud Storage)

1. Upload a new PDF document
2. Send a message that uses that document
3. Click on a reference badge [1], [2], etc.
4. ReferencePanel opens → Click "Ver documento completo"
5. **Expected**: 
   - ✅ Modal opens instantly
   - ✅ "Texto Extraído" section shows full content
   - ✅ "Archivo Original" section shows storage location
   - ✅ Can view/download original file

### Test Case 2: Old Document (No Cloud Storage)

1. Find a message with references to an old document (like "MAQ$A®")
2. Click on a reference badge
3. ReferencePanel opens → Click "Ver documento completo"
4. **Expected**:
   - ✅ Modal opens
   - ✅ "Texto Extraído" section shows full content (63,936 characters for MAQ$A®)
   - ⚠️ "Archivo Original" section shows "Archivo no disponible" 
   - ✅ Can still see all extracted text and use the document

### Test Case 3: Error Handling

1. Click "Ver documento completo" on a reference
2. Disconnect internet before modal loads
3. **Expected**:
   - ❌ Loading fails
   - ✅ User sees alert: "No se pudo cargar el documento completo"
   - ✅ Reference panel stays open (doesn't close on error)

---

## 📝 Technical Details

### API Endpoint: GET /api/context-sources/[id]

**File**: `src/pages/api/context-sources/[id].ts`

**Purpose**: Get a single context source with FULL data (includes extractedData)

**Authentication**: ✅ Required
**Authorization**: ✅ Verifies ownership (userId match)

**Response**:
```typescript
{
  source: {
    id: string;
    userId: string;
    name: string;
    type: string;
    extractedData: string; // ← This is the key field
    metadata: {
      originalFileName: string;
      originalFileSize: number;
      model: string;
      extractionTime: number;
      totalCost: number;
      // ... more fields
    };
    ragMetadata?: {
      chunkCount: number;
      avgChunkSize: number;
      indexedAt: Date;
      // ... more fields
    };
  }
}
```

### Security

**Ownership Verification**:
```typescript
// Only owner can access their sources
if (source.userId !== session.id && session.email !== 'alec@getaifactory.com') {
  return 403 Forbidden
}
```

**Superadmin Exception**: `alec@getaifactory.com` can access all sources (for debugging/support)

---

## 🔐 Backward Compatibility

✅ **Fully backward compatible**

- Documents uploaded **before** Cloud Storage implementation (before Oct 12, 2025):
  - ✅ Have `extractedData` (text was extracted and saved to Firestore)
  - ❌ Don't have `originalFile` blob or `storagePath` (not saved at that time)
  - ✅ Can still view extracted text in modal
  - ⚠️ Can't view/download original file (shows "Archivo no disponible")

- Documents uploaded **after** Cloud Storage implementation:
  - ✅ Have `extractedData`
  - ✅ Have `storagePath` and `bucketName` in metadata
  - ✅ Can view extracted text
  - ✅ Can view/download original file from Cloud Storage

---

## 💡 Why This Fix Works

### Problem Analysis

The previous implementation had a **data availability mismatch**:

1. **Reference created during message generation**: Contains `sourceId` from RAG chunk
2. **contextSources array**: Only contains sources currently loaded for this agent
3. **Mismatch**: A reference might point to a source that:
   - Was used in a previous message but not currently active
   - Is assigned to a different agent
   - Has only metadata loaded (no extractedData)

### Solution Benefits

1. **Always fetches fresh data**: API call ensures we get the source, regardless of local state
2. **Gets complete data**: API endpoint returns `extractedData` and all metadata
3. **Works across agents**: Can open documents from references even if not in current agent
4. **Works for old messages**: Can open documents from historical messages
5. **Proper error handling**: User gets clear feedback if something goes wrong

---

## 🎯 User Experience Improvements

### Before Fix
- ❌ Click "Ver documento completo" → Nothing happens or error
- ❌ No feedback to user
- ❌ Couldn't see document text
- ❌ Frustrating experience

### After Fix
- ✅ Click "Ver documento completo" → Modal opens with full content
- ✅ Console logs show what's happening
- ✅ Can read full extracted text (63K+ characters)
- ✅ Can see extraction metadata
- ✅ Can see RAG chunks if available
- ✅ Clear error message if something fails
- ✅ Professional, reliable experience

---

## 📊 Monitoring & Debugging

### Console Logs Added

When clicking "Ver documento completo", you'll see:
```
📄 Attempting to load full document for reference: jLPKvaD1
✅ Loaded full context source: jLPKvaD1 (63936 chars)
✅ Loaded full source, opening settings modal: MAQ$A®
```

If there's an error:
```
❌ Could not load full source for: jLPKvaD1
Error loading full context source: <error details>
```

### Debug Checklist

If the modal still doesn't open:

1. **Check console for errors**:
   - Look for "❌ Could not load full source"
   - Look for network errors

2. **Verify API endpoint works**:
   ```bash
   curl http://localhost:3000/api/context-sources/jLPKvaD1 \
     -H "Cookie: flow_session=YOUR_SESSION_TOKEN"
   ```

3. **Check Firestore**:
   - Verify document exists in `context_sources` collection
   - Verify it has `extractedData` field
   - Verify `userId` matches authenticated user

4. **Check authentication**:
   - Verify user is logged in
   - Verify session cookie is valid
   - Check for 401/403 errors in network tab

---

## 📋 Files Modified

### Changed Files
- ✅ `src/components/ChatInterfaceWorking.tsx` (lines 5585-5607)
  - Changed `onViewFullDocument` callback from sync to async
  - Changed from using `contextSources.find()` to `loadFullContextSource()`
  - Added error handling with user-friendly alert
  - Added console logging for debugging

### No Breaking Changes
- ✅ Uses existing API endpoint (no changes needed)
- ✅ Uses existing function `loadFullContextSource` (no new code)
- ✅ Modal component unchanged (ContextSourceSettingsModal)
- ✅ ReferencePanel component unchanged
- ✅ No database schema changes
- ✅ No new dependencies

---

## ✅ Testing Checklist

- [ ] Open a conversation with references
- [ ] Click on a reference badge [1]
- [ ] Reference panel opens on the right
- [ ] Click "Ver documento completo"
- [ ] Modal opens showing:
  - [ ] Document name in header
  - [ ] Full extracted text in "Texto Extraído" section
  - [ ] Extraction metadata (model, time, cost)
  - [ ] RAG chunks if available
  - [ ] Original file location (if available)
- [ ] Close modal and test with another reference
- [ ] Test with document from different agent
- [ ] Test with old document (no storage) - should still show text
- [ ] Test with new document (with storage) - should show everything

---

## 🎓 Lessons Learned

### 1. Don't Rely on Filtered Arrays
When dealing with references that could span multiple contexts/agents, always fetch fresh data from the source of truth (API/Database) rather than relying on a filtered in-memory array.

### 2. Always Load Full Data When Needed
The `contextSources` array intentionally contains minimal metadata for performance. When user wants details, fetch the full data.

### 3. Separate Concerns
- **Context panel** (left): Shows what's currently active for THIS agent
- **Reference panel** (right): Shows what was used in THIS message (might be from any source)
- **Settings modal**: Shows FULL details of ANY source (fetched on demand)

### 4. Async Callbacks Are OK
React is fine with async callbacks, just make sure error handling is in place.

---

## 🚀 Next Steps (Optional Improvements)

### Future Enhancements

1. **Loading State**: Show spinner while fetching full source
2. **Cache**: Cache loaded sources to avoid repeated API calls
3. **Offline Support**: Store recently viewed sources in IndexedDB
4. **Preview**: Show quick preview before loading full modal
5. **Breadcrumb**: Show path from reference → chunk → source → modal

But these are optimizations - the current fix solves the core issue! ✅

---

**Status**: ✅ Implemented and ready to test  
**Breaking Changes**: None  
**Backward Compatible**: Yes  
**Performance Impact**: Minimal (one API call per "Ver documento completo" click)  
**User Impact**: Major improvement (feature now works as expected)




