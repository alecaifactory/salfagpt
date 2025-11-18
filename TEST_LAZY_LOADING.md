# Test Lazy Loading Optimization

**Date:** 2025-11-18  
**Feature:** Document count lazy loading  
**URL:** http://localhost:3000

---

## ✅ How to Test

### Step 1: Open Context Management Dashboard

1. Go to: http://localhost:3000/chat
2. Login (if not already logged in)
3. Click the gear icon (⚙️) in the top-right to open Context Management Dashboard

---

### Step 2: Verify Fast Count Load

**What to observe:**

1. **Immediate count display** (should appear in <1 second):
   ```
   884 documentos disponibles
   ```
   
2. **"Cargar Documentos" button** should appear with the count badge

3. **Check browser console:**
   ```
   📊 Loading document counts only (fast mode)...
   ✅ Counts loaded: { organizations: X, totalSources: 884, duration: "XXXms" }
   ```

**Expected:**
- ✅ Count shows in <500ms
- ✅ No loading spinner stuck for 10 seconds
- ✅ Button is clickable immediately

---

### Step 3: Load Documents on Demand

1. **Click "Cargar Documentos" button**

2. **Observe:**
   - Loading spinner appears
   - "Cargando documentos..." message shows
   
3. **After 3-5 seconds:**
   - Documents appear grouped by organization/domain
   - Full document list with all details

4. **Check browser console:**
   ```
   📥 Loading actual documents (user requested)...
   ✅ Documents loaded: { sources: 884, organizations: X, duration: "XXXms" }
   ```

---

### Step 4: Verify Existing Features Still Work

**After documents are loaded:**

1. ✅ **Search/filter** - Works
2. ✅ **Sort** - Works
3. ✅ **Select sources** - Works
4. ✅ **Assign to agents** - Works
5. ✅ **Upload new document** - Works (auto-reloads)
6. ✅ **Delete document** - Works (auto-reloads)
7. ✅ **Refresh button** - Works (reloads documents)

---

### Step 5: Test Close and Reopen

1. Close dashboard (X button or ESC)
2. Reopen dashboard (gear icon)
3. **Verify:**
   - Count loads fast again
   - Documents NOT loaded automatically
   - Must click "Cargar Documentos" again
   - ✅ State resets correctly

---

## 📊 Performance Benchmarks

**Record these timings in browser DevTools Network tab:**

### Before Changes (baseline)
- Dashboard open → Count displayed: ~5-10 seconds
- Data transferred: ~5-10 MB

### After Changes (optimized)
- Dashboard open → Count displayed: Should be <500ms
- Data transferred (initial): Should be ~5-10 KB
- Click "Cargar Documentos" → Documents loaded: ~3-5 seconds
- Data transferred (full load): ~5-10 MB (same as before)

**Key metric: Time to count**
- Before: 5-10 seconds
- After: <500ms
- **Improvement: 10-50x faster**

---

## 🐛 What to Check For

### Potential Issues

1. **Count stuck at 0:**
   - Check console for errors
   - Verify `/api/context-sources/count-by-organization` endpoint exists
   - Check user permissions (SuperAdmin or Admin)

2. **Button doesn't load documents:**
   - Click button
   - Check console for errors
   - Verify `/api/context-sources/by-organization` endpoint works

3. **Documents disappear after reopen:**
   - Expected behavior! ✅
   - Documents only load on button click
   - This is the lazy loading feature working correctly

---

## ✅ Success Criteria

- ✅ Count displays in <500ms
- ✅ "Cargar Documentos" button appears
- ✅ Button shows correct count badge
- ✅ Clicking button loads documents in 3-5 seconds
- ✅ All existing features work after loading
- ✅ State resets on close/reopen
- ✅ No console errors
- ✅ No type errors

---

## 🎯 Expected Console Output

### On Dashboard Open (fast!)
```
📊 Loading document counts only (fast mode)...
🏢 Loading organizations for upload dropdown...
✅ Counts loaded: { organizations: 2, totalSources: 884, duration: "347ms" }
✅ Loaded 2 organizations for upload dropdown
```

### On "Cargar Documentos" Click
```
📥 Loading actual documents (user requested)...
✅ Documents loaded: { sources: 884, organizations: 2, duration: "4234ms" }
```

---

## 📸 Visual Reference

### Initial State (fast load)
```
┌─────────────────────────────────────┐
│  Configuración de Contexto       [X]│
├─────────────────────────────────────┤
│                                     │
│         [Database Icon]             │
│                                     │
│    884 documentos disponibles       │
│                                     │
│     ┌─────────────────────┐         │
│     │ 📥 Cargar Documentos│         │
│     │        (884)        │         │
│     └─────────────────────┘         │
│                                     │
│  Los documentos se cargarán solo    │
│     cuando los necesites            │
│                                     │
└─────────────────────────────────────┘
```

### After Loading (3-5 sec after click)
```
┌─────────────────────────────────────┐
│  Configuración de Contexto       [X]│
├─────────────────────────────────────┤
│ [Organization 1] 567 docs        ▼ │
│   ├─ [Domain A] 234 docs         ▼ │
│   │   ├─ Document 1               │
│   │   ├─ Document 2               │
│   │   └─ ...                      │
│   └─ [Domain B] 333 docs          │
│                                     │
│ [Organization 2] 317 docs          │
│   └─ [Domain C] 317 docs          │
│                                     │
└─────────────────────────────────────┘
```

---

**Ready to test! Open http://localhost:3000 and follow the steps above.** ✅

