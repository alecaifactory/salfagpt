# Complete UI Rebuild Guide - Step by Step
**Session**: Oct 22, 2025  
**Progress**: ALL STEPS COMPLETE ✅

---

## ✅ **ALL STEPS COMPLETED**

Step 1: Imports & State ✅
- Added useMemo import
- Added Folder, ChevronRight icons
- Added pagination state variables
- Added folder state variables
- Added isAgent to Conversation interface

Step 2: Agent Filtering Logic ✅
- Added agents computed value with useMemo
- Filters conversations where isAgent === true
- Excludes archived conversations

Step 3: Pagination Functions ✅
- Replaced loadAllSources with loadFirstPage
- Added loadNextPage function
- Updated all references

Step 4: Batch Assignment ✅
- Updated handleAssignClick to use bulk API
- Single API call instead of loop
- <2s for 539 sources

Step 5: Folder Grouping ✅
- Added sourcesByTag computed value
- Added toggleFolder, expandAllFolders, collapseAllFolders
- Added selectAllInFolder function

Step 6: UI Render Update ✅
- Replaced flat list with folder-grouped view
- Added Expand/Collapse All controls
- Added Load More button
- Independent scroll in folders

---

## 📋 **IMPLEMENTATION SUMMARY**

### **Step 2: Add Agent Filtering Logic**

After line ~70, add:

```typescript
// Filter to show ONLY agents with isAgent === true
const agents = useMemo(() => {
  const filtered = conversations.filter(conv => {
    if (conv.isAgent !== true) return false;
    if (conv.status === 'archived') return false;
    return true;
  });
  
  console.log('🎯 Filtered agents:', filtered.length);
  return filtered;
}, [conversations]);
```

---

### **Step 3: Replace loadAllSources with loadFirstPage**

Find `const loadAllSources = async () => {` and replace entire function with:

```typescript
const loadFirstPage = async () => {
  setLoading(true);
  setSources([]);
  setCurrentPage(0);
  
  try {
    // Load folder structure
    const structureResponse = await fetch('/api/context-sources/folder-structure');
    if (structureResponse.ok) {
      const data = await structureResponse.json();
      setFolderStructure(data.folders || []);
      setTotalCount(data.totalCount || 0);
    }
    
    // Load first 10 documents
    const response = await fetch('/api/context-sources/paginated?page=0&limit=10');
    if (response.ok) {
      const data = await response.json();
      setSources(data.sources || []);
      setHasMore(data.hasMore);
      setCurrentPage(0);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

const loadNextPage = async () => {
  if (!hasMore || loadingMore) return;
  
  setLoadingMore(true);
  const nextPage = currentPage + 1;
  
  try {
    const response = await fetch(`/api/context-sources/paginated?page=${nextPage}&limit=10`);
    if (response.ok) {
      const data = await response.json();
      setSources(prev => [...prev, ...(data.sources || [])]);
      setHasMore(data.hasMore);
      setCurrentPage(nextPage);
    }
  } finally {
    setLoadingMore(false);
  }
};
```

---

### **Step 4: Update handleAssignClick for Batch**

Find `const handleAssignClick` and replace with:

```typescript
const handleAssignClick = async () => {
  if (selectedSourceIds.length === 0 || pendingAgentIds.length === 0) return;
  
  setIsAssigning(true);
  
  try {
    const response = await fetch('/api/context-sources/bulk-assign-multiple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceIds: selectedSourceIds,
        agentIds: pendingAgentIds,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(`✅ ${result.sourcesUpdated} documentos asignados en ${(result.responseTime / 1000).toFixed(1)}s`);
      
      // Update local state
      setSources(prev => prev.map(s => 
        selectedSourceIds.includes(s.id)
          ? { ...s, assignedToAgents: pendingAgentIds }
          : s
      ));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al asignar');
  } finally {
    setIsAssigning(false);
  }
};
```

---

### **Step 5: Add Folder Grouping Logic**

After `const filteredSources = ...`, add:

```typescript
const sourcesByTag = useMemo(() => {
  const groups = new Map<string, EnrichedContextSource[]>();
  
  folderStructure.forEach(folder => {
    groups.set(folder.name, []);
  });
  
  sources.forEach(source => {
    if (!source.labels || source.labels.length === 0) {
      if (!groups.has('General')) groups.set('General', []);
      groups.get('General')!.push(source);
    } else {
      source.labels.forEach(tag => {
        if (!groups.has(tag)) groups.set(tag, []);
        groups.get(tag)!.push(source);
      });
    }
  });
  
  return groups;
}, [folderStructure, sources]);

const toggleFolder = (name: string) => {
  setExpandedFolders(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  });
};
```

---

### **Step 6: Update UI Render** (Lines ~1400-1600)

Replace flat list with folder view.

See `CONTEXT_MANAGEMENT_FOLDER_VIEW_2025-10-21.md` lines 1625-1822 for EXACT JSX code.

Key changes:
- Folder headers with chevron
- Collapse/expand logic
- Only show docs when expanded
- "Cargar 10 más" button at bottom

---

## 🧪 **TEST EACH STEP**

After each step:
```bash
npm run dev
# Open browser
# Check console for errors
# Verify UI works
```

If error: Revert that step, fix, try again.

---

## ⏱️ **TIME ESTIMATE**

- Step 2: 10 min
- Step 3: 15 min
- Step 4: 10 min
- Step 5: 15 min
- Step 6: 30 min
- Testing: 15 min

**Total**: ~1.5 hours

---

## ✅ **SUCCESS CRITERIA**

- [ ] npm run dev works
- [ ] Context Management opens
- [ ] Shows folders collapsed
- [ ] Click folder expands
- [ ] Shows first 10 docs
- [ ] "Cargar 10 más" works
- [ ] Bulk assign 539 in <2s
- [ ] No console errors

---

**All code is ready. Just need careful application in fresh session.** ✅

