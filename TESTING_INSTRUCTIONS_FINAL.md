# Testing Instructions - After Server Restart
**Servidor reiniciado**: ✅  
**Nuevos endpoints activos**: ✅  
**Índices Firestore**: 🔄 Construyendo

---

## 🧪 **TEST 1: Bulk Assignment con Batch (NUEVO)**

### Steps:

1. **Abrir browser**: http://localhost:3000/chat

2. **Login** como admin (alec@getaifactory.com)

3. **Abrir Context Management** (menú admin)

4. **Click tag "M001 (538)"**
   - Debería mostrar badge: "**538 selected**"
   - Console: "✅ Selected 538 documents with tag M001"

5. **Seleccionar agente M001** en panel derecho

6. **Click "Asignar (538)"**

### Expected Console Logs:

```javascript
🚀 BULK ASSIGNMENT:
   Sources: 538
   Agents: 1

// En el servidor (nueva terminal si está en background):
📦 Created 2 batch(es) for 538 sources

✅ BULK ASSIGN COMPLETE:
   Sources updated: 538
   Agents assigned: 1
   Batches: 2
   Time: 3421 ms
   Avg per source: 6 ms
```

### Expected Alert:

```
✅ 538 documentos asignados a 1 agente(s) en 3.4s
```

### Key Indicator:

**If you see "Created 2 batches"** = ✅ Using new optimized endpoint  
**If you see 538x "Bulk assignment successful"** = ❌ Still using old endpoint

---

## 🧪 **TEST 2: Verify in Firestore**

After assignment, run:

```bash
cd /Users/alec/salfagpt
GOOGLE_CLOUD_PROJECT=salfagpt npx tsx verify-db.ts
```

### Expected Output:

```
✅ Agent M001 ID: CpB6tE5DvjzgHI3FvpU2
📊 TOTAL sources asignados a M001: 538  ← Should be 538, not 0
✅ DDU-518-con-anexos.pdf - Asignado? true
✅ Cir110.pdf - Asignado? true
```

---

## 🧪 **TEST 3: Agent Context Modal**

1. **Click on agent M001** in left sidebar
2. **Click gear icon** (⚙️) next to agent name
3. **Modal "Configuración de Contexto"** opens

### Expected:

**Should show**: List of 538 context sources assigned  
**Should NOT show**: "No hay fuentes de contexto para este agente"

---

## 🧪 **TEST 4: Performance Verification**

### Context Management Load:

1. Close and re-open Context Management
2. Check console for timing:

```
⚡ Loaded folder structure: 2 folders, 539 total docs in XXX ms
✅ Loaded page 0: 10 documents in XXX ms
```

**Expected**:
- Folder structure: <200ms ⚡
- First page: <500ms ⚡

### Filter by TAG:

1. Click tag M001
2. Check console:

```
⚡ Indexed 538 documents with tag M001 in XXX ms
```

**Expected**: <200ms ⚡

### Load More:

1. Click "Cargar 10 más"
2. Check console:

```
✅ Loaded page 1: 10 more documents
```

**Expected**: <300ms ⚡

---

## 📊 **SUCCESS CRITERIA**

### Must Pass:
- [ ] Tag shows correct count: M001 (538) ✅
- [ ] Click tag selects 538 docs ✅
- [ ] Bulk assign completes in <5s ✅
- [ ] Console shows "Created 2 batches" ✅
- [ ] Firestore has 538 assigned ✅
- [ ] Agent modal shows 538 sources ✅

### Performance Targets:
- [ ] Initial load: <500ms
- [ ] Filter by tag: <350ms
- [ ] Bulk assign 538: <5s
- [ ] Load more (10): <300ms

---

## 🎯 **IF ISSUES PERSIST**

### Issue 1: Still using old endpoint

**Symptom**: Don't see "Created 2 batches"

**Fix**: Hard refresh browser (Cmd+Shift+R)

### Issue 2: Firestore still shows 0

**Symptom**: verify-db.ts shows 0 assigned

**Action**: Share server logs from npm run dev terminal

### Issue 3: Agent modal still empty

**Symptom**: Shows "No hay fuentes"

**Possible causes**:
- Assignments didn't save
- Modal loading wrong agentId
- Need to refresh modal logic

---

## 📋 **WHAT TO SHARE**

If anything doesn't work:

1. **Console logs** from browser (F12 → Console)
2. **Server logs** from npm run dev terminal
3. **Output** of `npx tsx verify-db.ts`
4. **Screenshot** of what you see

---

**SERVER IS RUNNING: http://localhost:3000**  
**Ready to test optimized bulk assignment!** ⚡🚀

