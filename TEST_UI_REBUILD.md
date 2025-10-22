# Test Guide - UI Rebuild
**Date**: October 22, 2025  
**Server**: http://localhost:3000 ✅ Running

---

## 🧪 Quick Test Steps

### 1. Open Context Management
```
1. Navigate to http://localhost:3000/chat
2. Login with your account
3. Click "Context Management" or database icon
```

**Expected**:
- ✅ Modal opens
- ✅ Loading state appears briefly
- ✅ Folders appear (collapsed by default)

---

### 2. Test Folder View
```
1. Observe folder structure
2. Count visible documents (should be ~15-30 for 5 folders)
3. Click on a folder header
4. Observe expansion
5. Scroll within expanded folder
```

**Expected**:
- ✅ Folders show: "X documentos"
- ✅ Each folder shows first 3 documents
- ✅ Chevron points right (➡️) when collapsed
- ✅ Click → Chevron rotates down (⬇️)
- ✅ Click → Shows all documents in folder
- ✅ Independent scroll if >3 documents
- ✅ "+ X más documentos" appears when collapsed

---

### 3. Test Expand/Collapse All
```
1. Find "Expand All" button (top of list)
2. Click it
3. Observe all folders expand
4. Click "Collapse All"
5. Observe all folders collapse
```

**Expected**:
- ✅ "Expand All" / "Collapse All" visible if 2+ folders
- ✅ Expand All → All chevrons rotate, all docs visible
- ✅ Collapse All → All chevrons reset, only 3 docs per folder

---

### 4. Test Select All in Folder
```
1. Expand a folder with many docs (e.g., M001 with 99 docs)
2. Click "Select All" in that folder's header
3. Observe checkboxes
4. Check counter in header
```

**Expected**:
- ✅ All documents in folder get checked
- ✅ Blue background on selected docs
- ✅ Header shows "99 documentos • 99 seleccionados"
- ✅ Selection persists when collapsing/expanding

---

### 5. Test Pagination (Load More)
```
1. Scroll to bottom of source list
2. Look for "Cargar 10 más" button
3. Click it
4. Observe loading state
5. Observe new sources appear
```

**Expected**:
- ✅ Button visible if more sources exist
- ✅ Click → Shows "Cargando..." with spinner
- ✅ Next 10 sources appear
- ✅ Button updates or disappears if no more
- ✅ New sources appear in correct folders

---

### 6. Test Bulk Assignment (Performance)
```
1. Click "Select All" (global, in header)
2. All 539 sources should be selected
3. Select 1 agent in right panel
4. Click "Assign" button
5. Start timer when clicked
6. Observe completion time
```

**Expected**:
- ✅ All sources selected (checkbox states)
- ✅ Assignment completes in <2s ⚡
- ✅ Alert shows: "✅ 539 documentos asignados en 1.2s"
- ✅ No browser freeze
- ✅ No console errors

---

## 🔍 What to Look For

### Console Logs
```
✅ "🎯 Filtered agents: N" - Agent filtering working
✅ "✅ Loaded first page: 10 sources" - Pagination working
✅ "📊 Total count: 539" - Total count loaded
✅ "📁 Folders: N" - Folder structure loaded
✅ "✅ Loaded page 1: 10 sources" - Next page working
```

### Visual Indicators
- ✅ Chevron transitions smoothly
- ✅ Hover effects on folders
- ✅ Selection states clear (blue background)
- ✅ Loading spinners during operations
- ✅ No layout jumps or flashes

### Performance
- ✅ Initial render: <100ms (vs 2-3s before)
- ✅ Folder expand: <50ms (smooth)
- ✅ Bulk assign: <2s (vs 30-60s before)
- ✅ Pagination: <500ms per page

---

## ❌ Common Issues & Solutions

### Issue 1: API Endpoints Not Found

**Symptom**: Console error "404 Not Found" for `/api/context-sources/paginated`

**Solution**: API endpoints need to be created. The frontend is ready, but backend needs:
- `/api/context-sources/folder-structure.ts`
- `/api/context-sources/paginated.ts`
- `/api/context-sources/bulk-assign-multiple.ts`

**Action**: Create these endpoints or modify existing ones.

---

### Issue 2: No Folders Visible

**Symptom**: Empty state shown even with sources

**Diagnosis**:
- Check if `folderStructure` is empty
- Check if `sourcesByTag` has entries
- Console should show folder count

**Solution**:
- Verify `/api/context-sources/folder-structure` returns correct data
- Check that sources have `labels` field

---

### Issue 3: Bulk Assign Still Slow

**Symptom**: Assignment takes >10s for 539 sources

**Diagnosis**:
- Check if bulk endpoint exists
- Check if it's doing batch operations

**Solution**:
- Verify `/api/context-sources/bulk-assign-multiple` uses Firestore batch
- Should complete in <2s for 539 sources

---

## ✅ Success Indicators

If all tests pass, you should see:

1. ✅ **Fast initial load** (<100ms, not 2-3s)
2. ✅ **Folders collapsed** (shows ~15 docs, not 539)
3. ✅ **Smooth interactions** (expand/collapse instant)
4. ✅ **Pagination working** (load 10 more on demand)
5. ✅ **Bulk assign fast** (<2s for 539 docs)
6. ✅ **No console errors**
7. ✅ **Clean UI** (no layout shifts, smooth transitions)

---

## 📝 Notes

**What Changed**:
- UI reorganized into folder view
- Pagination added (10 per page)
- Bulk operations optimized

**What Stayed the Same**:
- Data structure unchanged
- Selection logic unchanged
- Assignment logic unchanged (just API call)

**Backward Compatible**: ✅ Yes
- Existing sources still work
- No data migration needed
- Falls back gracefully if new endpoints missing

---

**Ready to test!** Open http://localhost:3000/chat and try the Context Management modal. 🚀

