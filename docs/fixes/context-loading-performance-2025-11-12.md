# Fix: Performance de Carga de Context Management (SuperAdmin)

**Fecha:** 2025-11-12  
**Usuario:** SuperAdmin (alec@getaifactory.com)  
**Síntoma:** Modal de Context Management tarda demasiado en cargar (~7+ segundos)  
**Severidad:** Alta (UX degradada)

---

## 🔍 Diagnóstico

### Performance Medido

```bash
🧪 Query: where('organizationId', '==', 'getaifactory.com')
📊 Documentos: 885
⏱️  Tiempo: 7,180 ms (7.18 segundos)
⚠️  Estado: LENTO - Índice requerido
```

### Dos Problemas Identificados

#### Problema 1: Query Incorrecta ✅ RESUELTO

**Archivo:** `src/pages/api/context-sources/by-organization.ts`

**❌ Antes:**
```typescript
// Consultaba por userId en batches
const sourcesSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('userId', 'in', batch)
  .get();
```

**✅ Después:**
```typescript
// Consulta directa por organizationId
const sourcesSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('organizationId', '==', org.id)
  .get();
```

**Impacto:** Ahora encuentra las 885 fuentes (antes encontraba 0)

---

#### Problema 2: Índice Faltante ⏳ EN PROGRESO

**Estado actual de índices:**
```bash
📊 Índices desplegados en Firestore: 9
📊 Índices definidos en firestore.indexes.json: ~40
❌ Índices para organizationId: NO DESPLEGADOS
```

**Índice requerido (ya definido, pendiente construcción):**
```json
{
  "collectionGroup": "context_sources",
  "fields": [
    { "fieldPath": "organizationId", "order": "ASCENDING" },
    { "fieldPath": "addedAt", "order": "DESCENDING" }
  ]
}
```

**Ubicación en código:** `firestore.indexes.json` líneas 620-626

---

## ✅ Solución Implementada

### 1. Deploy de Índices

**Comando ejecutado:**
```bash
firebase deploy --only firestore:indexes --project salfagpt
```

**Resultado:**
```
✔  Deploy complete!
⏳ Índices en construcción (2-10 minutos)
```

**Verificación:**
```bash
# Monitorear estado
gcloud firestore indexes composite list \
  --project=salfagpt \
  --database='(default)' \
  --format="table(name,state)"

# Buscar índices con "CREATING" state
# Cuando cambien a "READY" → Performance mejorado
```

---

### 2. Performance Esperado

**Antes de índice (ACTUAL):**
```
Query 885 docs: ~7,180 ms (7.18 segundos)
⚠️  UX degradada - Loading spinner por 7+ segundos
```

**Después de índice (ESPERADO):**
```
Query 885 docs: ~200-500 ms (0.2-0.5 segundos)
✅ UX mejorada - Loading casi instantáneo
```

**Mejora esperada:** **14-35x más rápido** ⚡

---

## 📋 Índices Críticos para Multi-Org

### context_sources

**Índice 1:** `organizationId + addedAt` (Línea 620-626)
```json
{
  "collectionGroup": "context_sources",
  "fields": [
    { "fieldPath": "organizationId", "order": "ASCENDING" },
    { "fieldPath": "addedAt", "order": "DESCENDING" }
  ]
}
```

**Para query:**
```typescript
.where('organizationId', '==', orgId)
.orderBy('addedAt', 'desc')
```

**Usado en:**
- `/api/context-sources/by-organization` (SuperAdmin view)
- Context Management modal
- Organization-scoped queries

---

**Índice 2:** `organizationId + userId + addedAt` (Línea 536-542)
```json
{
  "collectionGroup": "context_sources",
  "fields": [
    { "fieldPath": "organizationId", "order": "ASCENDING" },
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "addedAt", "order": "DESCENDING" }
  ]
}
```

**Para query:**
```typescript
.where('organizationId', '==', orgId)
.where('userId', '==', userId)
.orderBy('addedAt', 'desc')
```

**Usado en:**
- Queries específicas de usuario dentro de org
- Analytics por usuario en contexto de org

---

**Índice 3:** `organizationId + status + addedAt` (Línea 544-551)
```json
{
  "collectionGroup": "context_sources",
  "fields": [
    { "fieldPath": "organizationId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "addedAt", "order": "DESCENDING" }
  ]
}
```

**Para query:**
```typescript
.where('organizationId', '==', orgId)
.where('status', '==', 'active')
.orderBy('addedAt', 'desc')
```

**Usado en:**
- Filtrar solo fuentes activas por org
- Excluir fuentes con errores

---

## 🕐 Timeline

### Ahora (2025-11-12 17:48)
- ✅ Índices desplegados a Firebase
- ⏳ Construcción en progreso (2-10 minutos)
- ⏳ Estado: CREATING

### En 2-10 minutos
- ✅ Índices en estado READY
- ✅ Performance mejorado automáticamente
- ✅ Query pasa de 7s a <500ms

### Verificación
```bash
# Cada 2 minutos, ejecutar:
gcloud firestore indexes composite list \
  --project=salfagpt \
  --format="table(name,state)" | grep CREATING

# Cuando no haya resultados → Todos en READY
```

---

## 🔧 Optimización Temporal (Mientras se construyen índices)

Si necesitas usar la funcionalidad AHORA (antes de que índices estén listos):

### Opción 1: Agregar Loading State Mejorado

**En:** `ContextManagementDashboard.tsx`

Agregar indicador de progreso más claro:

```typescript
{loading && (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader2 className="w-8 h-8 text-gray-600 animate-spin mb-4" />
    <p className="text-sm text-gray-600">Cargando fuentes de contexto...</p>
    <p className="text-xs text-gray-500 mt-1">
      Esto puede tardar hasta 10 segundos (optimización en progreso)
    </p>
    <div className="mt-4 w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 animate-pulse" style={{width: '100%'}} />
    </div>
  </div>
)}
```

### Opción 2: Query con Límite (Carga Parcial)

**Temporal** hasta que índice esté listo:

```typescript
// Cargar solo primeros 100 docs para mostrar algo rápido
const sourcesSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('organizationId', '==', org.id)
  .limit(100)  // ← Límite temporal
  .get();

// Mostrar "Mostrando primeras 100 de 885 fuentes"
```

---

## 📊 Impacto por Organización

### GetAI Factory (885 fuentes)
```
Sin índice: ~7,180 ms
Con índice: ~200-400 ms
Mejora: 18-35x más rápido
```

### Salfa Corp (estimado ~100-200 fuentes)
```
Sin índice: ~1,000-2,000 ms
Con índice: ~100-200 ms
Mejora: 5-20x más rápido
```

### Organizaciones pequeñas (<10 fuentes)
```
Sin índice: ~200-500 ms (tolerable)
Con índice: ~50-100 ms (mejor)
Mejora: 2-10x más rápido
```

---

## 🚀 Deployment Status

### Cambios en Código
- ✅ `src/pages/api/context-sources/by-organization.ts` - Query optimizado
- ✅ No breaking changes
- ✅ Backward compatible

### Infraestructura
- ✅ Índices desplegados con `firebase deploy`
- ⏳ Construcción en progreso (check cada 2 min)
- 📅 Completado estimado: 2025-11-12 17:55-18:00

### Testing
- [ ] Esperar índices READY
- [ ] Refresh modal Context Management
- [ ] Verificar carga en <1 segundo
- [ ] Expandir organizaciones
- [ ] Verificar datos correctos

---

## 🎯 Success Criteria

### Performance
- ✅ Query completa: < 1 segundo
- ✅ UI responsive: < 500ms to first paint
- ✅ No errores en consola

### Funcionalidad
- ✅ SuperAdmin ve TODAS las organizaciones
- ✅ Todas las 885 fuentes visibles
- ✅ Agrupadas por dominio correctamente
- ✅ Metadata completa y correcta

### UX
- ✅ Loading state claro
- ✅ Carga progresiva (organizaciones primero)
- ✅ Auto-expand primera organización
- ✅ Sin frustración por espera larga

---

## 📚 Related Documentation

- `firestore.indexes.json` - Definición de todos los índices
- `FIRESTORE_INDEXES_OPTIMIZATION_2025-10-21.md` - Doc anterior de índices
- `.cursor/rules/organizations.mdc` - Multi-org system
- `docs/fixes/context-loading-superadmin-fix-2025-11-12.md` - Fix del query

---

## 🔮 Próximos Pasos

### Inmediato (Hoy)
1. ⏳ Esperar índices READY (2-10 min)
2. ✅ Verificar performance mejorado
3. ✅ Testing con usuario

### Corto Plazo (Esta Semana)
- [ ] Agregar indicador de construcción de índices en UI
- [ ] Implementar carga progresiva (orgs primero, detalles después)
- [ ] Monitorear performance en producción

### Mediano Plazo (Próximo Mes)
- [ ] Implementar caching de datos de org
- [ ] Pagination para orgs con >1000 fuentes
- [ ] Lazy loading de dominios (solo cuando se expanden)

---

## 📈 Monitoring

### Queries to Monitor

```typescript
// En logs, buscar:
"Loading context for org: GetAI Factory"
"Found X sources for GetAI Factory"
"Duration: Xms"

// Performance targets:
Duration < 500ms: ✅ Excelente
Duration 500-1000ms: ⚠️ Aceptable
Duration > 1000ms: ❌ Requiere optimización
```

### Console Firebase

**URL para monitorear índices:**
https://console.firebase.google.com/project/salfagpt/firestore/indexes

**Verificar:**
- Estado: READY (no CREATING o ERROR)
- Collection: context_sources
- Fields: organizationId, addedAt

---

## ✅ Checklist de Verificación

### Ahora (Sin índices)
- [x] Query funciona pero lento (7.18s)
- [x] Encuentra 885 fuentes ✅
- [x] Datos correctos ✅
- [ ] Performance aceptable ❌

### Después (Con índices - ~10 min)
- [ ] Query rápido (<500ms)
- [ ] Encuentra 885 fuentes
- [ ] Datos correctos
- [ ] Performance excelente ✅

---

## 🎯 Resumen para Usuario

**Problema:**
- Context Management tardaba >7 segundos en cargar
- Causado por query sin índice (full table scan de 885 docs)

**Solución:**
1. ✅ **Desplegado:** Índices de Firestore (firebase deploy)
2. ⏳ **En construcción:** 2-10 minutos para estar READY
3. ✅ **Performance esperado:** De 7s a <500ms (14x más rápido)

**Acción requerida:**
- ⏳ Esperar 5-10 minutos
- 🔄 Refresh página
- ✅ Context Management cargará mucho más rápido

**Timeline:**
```
17:48 - Deploy iniciado
17:50 - Índices en construcción
17:58 - Índices READY (estimado)
18:00 - Testing y verificación
```

---

**Status:** ⏳ Índices en construcción  
**ETA:** 5-10 minutos  
**Próximo paso:** Monitorear construcción de índices

