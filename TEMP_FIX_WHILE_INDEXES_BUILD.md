# Temporary Fix - While Indexes Build
**Fecha**: 2025-10-21  
**Status**: ⚠️ Temporal (hasta que índices estén READY)

## 🎯 Problema

Los índices de Firestore están construyéndose (5-15 min). Mientras tanto, queries que dependen de ellos fallarán con:
- ERROR: "The query requires an index"
- 500 Internal Server Error

---

## ✅ Fix Temporal Aplicado

He modificado `/api/context-sources/paginated` para que:

### **Mientras índices construyen**: Client-Side Filtering

```typescript
// Load ALL docs (sin filtro de TAG en query)
query = query.orderBy('addedAt', 'desc');

// Filter client-side por TAG
if (tag) {
  docs = docs.filter(doc => doc.data().labels?.includes(tag));
}
```

**Performance**:
- Más lento que con índices (~1-2s)
- Pero **FUNCIONA** sin esperar índices
- Sin ERROR 500

---

### **Después de índices READY**: Server-Side Filtering

```typescript
// Use indexed query
query = query
  .where('labels', 'array-contains', tag)
  .orderBy('addedAt', 'desc');
```

**Performance**:
- <300ms con índices
- Optimal

---

## 📊 Performance Comparison

| State | Query Strategy | Time | Works? |
|---|---|---|---|
| **Índices CREATING** | Client-side filter | 1-2s | ✅ Sí |
| **Índices READY** | Server-side indexed | <300ms | ✅ Sí |

---

## ⏰ Timeline

```
⏱️ NOW:
   • Deploy exitoso ✅
   • Fix temporal aplicado ✅
   • Endpoint funciona (lento) ✅
   
⏱️ 5-15 MIN:
   • Índices construyendo...
   • Queries lentas pero funcionan
   
⏱️ 15-20 MIN:
   • Índices READY ✅
   • Cambiar a queries indexadas
   • Performance óptima
```

---

## 🔧 Revertir Fix Temporal

**Cuando índices estén READY**, cambiar de vuelta a queries optimizadas:

```typescript
// In /api/context-sources/paginated.ts

// Remove this (temporary):
query = query.orderBy('addedAt', 'desc');

// Restore this (optimal):
if (tag) {
  if (tag === 'General') {
    query = query.orderBy('addedAt', 'desc');
  } else {
    query = query
      .where('labels', 'array-contains', tag) // Uses index!
      .orderBy('addedAt', 'desc');
  }
} else {
  query = query.orderBy('addedAt', 'desc');
}

// Remove client-side filtering
// docs.filter(...) ← Remove this line
```

---

## ✅ Testing Now (With Temp Fix)

**Should work**:
- ✅ Abrir Context Management
- ✅ Ver carpetas y documentos
- ✅ Click "Cargar 10 más" → Funciona (lento)
- ✅ Filter por TAG → Funciona (lento)
- ✅ No ERROR 500

**Performance**:
- ~1-2s (temporal, mientras construyen)
- Cuando READY: <300ms ⚡

---

**El botón "Cargar 10 más" ahora debería funcionar!** 🎯

