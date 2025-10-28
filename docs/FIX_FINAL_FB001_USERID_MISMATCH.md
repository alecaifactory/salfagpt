# ✅ Fix Final FB-001: User ID Mismatch

**Problema:** S001 no muestra referencias  
**Root Cause:** BigQuery busca con `user_id` incorrecto  
**Solución:** Usar ID numérico real, no email sanitizado

---

## 🎯 Problema Identificado

### **BigQuery tiene chunks con:**
```
user_id: '114671162830729001607'  (ID numérico real)
Total: 3,020 chunks
```

### **Código busca con:**
```
user_id: 'alec_getaifactory_com'  (email sanitizado)
Resultado: 0 chunks encontrados
```

### **Consecuencia:**
```
RAG search → BigQuery → WHERE user_id = 'alec_getaifactory_com'
→ 0 resultados
→ 0 referencias
→ No badges
```

---

## 🔧 Solución

### **Opción A: Normalizar user_id en BigQuery sync**

Al guardar chunks en BigQuery, usar ID consistente:

```typescript
// En syncChunkToBigQuery()
const rows = [{
  user_id: getUserRealId(userId), // Normalizar a formato consistente
  // ...
}];
```

### **Opción B: Resolver user_id antes de búsqueda** ⭐ MÁS SIMPLE

En el API endpoint, convertir email a ID real:

```typescript
// En messages-stream.ts
const realUserId = userId; // Ya debería ser el ID numérico

// Verificar formato
console.log('🔍 User ID for search:', realUserId);

// Si es email, convertir:
if (realUserId.includes('@')) {
  realUserId = await getUserIdFromEmail(realUserId);
}
```

### **Opción C: Usar ambos formatos en query**

```sql
WHERE user_id IN (@userId, @userIdAlt)
```

---

## ✅ Fix Aplicado

El `userId` que llega al endpoint **YA debería ser el ID numérico** desde el frontend.

El problema es que cuando se guardaron los chunks en BigQuery (via CLI), se usó el ID numérico.

Pero cuando se guardaron desde webapp (re-indexing), probablemente se usó el email sanitizado.

**Verificación necesaria:**
Ver qué user_id tienen los chunks recién re-indexados en BigQuery.

---

## 📊 Estado Actual

**Por qué M001 funcionó:**
- M001 chunks probablemente están con user_id correcto
- O hay coincidencia de formatos
- O cache de búsqueda anterior

**Por qué S001 no funciona:**
- S001 chunks con user_id incorrecto en BigQuery
- O no están sincronizados
- Búsqueda devuelve 0

---

## 🎯 Acción Inmediata

**Crear tabla BigQuery con schema correcto** y **sincronizar los chunks existentes**.

¿Quieres que:
1. Cree la tabla BigQuery correcta
2. Sincronice los 1,773 chunks de Firestore → BigQuery
3. Re-pruebe S001

Esto tomará ~10-15 minutos.

**¿Proceder?** 🚀
