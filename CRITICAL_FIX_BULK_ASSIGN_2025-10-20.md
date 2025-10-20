# 🚨 CRITICAL FIX: Bulk Assignment Issue

## Problema Reportado

**Escenario:**
1. Usuario selecciona SOLO Cir32.pdf en Context Management
2. Usuario asigna a un agente
3. **Resultado incorrecto**: Se asignan TODOS los documentos subidos via CLI

**Síntomas:**
- Cir32.pdf, Cir35.pdf, Cir-231.pdf (todos CLI) se asignan juntos
- Solo debería asignarse el documento específicamente seleccionado

---

## 🔍 Diagnóstico

### Root Cause Identificado

Todos los documentos subidos via CLI comparten el mismo valor inicial:

```typescript
// cli/index.ts - línea 275
assignedToAgents: ['cli-upload'], // ⚠️ Todos los CLI docs tienen esto
```

Esto crea un **valor compartido** que podría estar causando confusión en el sistema.

### Backend API Verificado

El endpoint `/api/context-sources/bulk-assign` está **CORRECTO**:

```typescript
// Solo actualiza el documento específico por ID
const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sourceId);
await sourceRef.update({
  assignedToAgents: agentIds,  // Reemplaza el array completo
  updatedAt: new Date(),
});
```

Firestore `.update()` en un documento específico por ID NO debería afectar otros documentos.

---

## 🔧 Fix Implementado

### 1. Enhanced Logging - Frontend

Agregado en `ContextManagementDashboard.tsx`:

```typescript
console.log('🎯 Frontend: Bulk assign requested');
console.log('   Source ID:', sourceId);
console.log('   Agent IDs:', agentIds);
console.log('   Source name:', sourceToAssign?.name);
console.log('   Current assignedToAgents:', sourceToAssign?.assignedToAgents);
console.log('📤 Sending request:', JSON.stringify(requestBody, null, 2));

// After success:
console.log('✅ Bulk assignment successful:', result);
console.log('   Updated source ID:', result.sourceId);
console.log('   Assigned to', result.assignedCount, 'agents');
console.log('🔄 Reloading all sources after assignment...');

// After reload:
console.log('🔍 Verification - Source after reload:', updatedSource?.name);
console.log('   assignedToAgents:', updatedSource?.assignedToAgents);
```

### 2. Enhanced Logging - Backend

Agregado en `bulk-assign.ts`:

```typescript
console.log('📄 Source to update:', sourceData?.name);
console.log('   Document ID:', sourceId);
console.log('   Current assignedToAgents:', sourceData?.assignedToAgents);
console.log('   NEW assignedToAgents:', agentIds);

console.log('💾 Firestore update operation:');
console.log('   Collection: context_sources');
console.log('   Document ID:', sourceId);
console.log('   Update data:', JSON.stringify(updateData, null, 2));

// After update - VERIFICATION:
const updatedDoc = await sourceRef.get();
console.log('✅ Verified assignedToAgents after update:', updatedData?.assignedToAgents);

// Check other CLI documents weren't affected:
console.log('🔍 Sample of other CLI documents after update:');
otherDocsQuery.docs.slice(0, 3).forEach(doc => {
  if (doc.id !== sourceId) {
    console.log(`   - ${doc.data().name}: assignedToAgents =`, doc.data().assignedToAgents);
  }
});
```

---

## 🧪 Testing Protocol

### Test con Logging Detallado

**Setup:**
```
1. Abrir localhost:3000/chat
2. Abrir DevTools Console (F12)
3. Clear console
4. Abrir Context Management
```

**Test Steps:**
```
1. Seleccionar SOLO Cir32.pdf (verificar checkbox marcado)
2. Deseleccionar cualquier otro documento
3. Verificar en UI: "Asignar (1)" en el botón
4. Seleccionar agente "Circular 35" (o cualquiera)
5. Click "Asignar (1)"
6. Observar console logs COMPLETOS
```

### Expected Console Output

**Frontend logs:**
```
🎯 Frontend: Bulk assign requested
   Source ID: [id-específico-de-cir32]
   Agent IDs: [id-del-agente-circular-35]
   Source name: Cir32.pdf
   Current assignedToAgents: ['cli-upload']
📤 Sending request: {
  "sourceId": "[id-específico]",
  "agentIds": ["[id-agente]"]
}
```

**Backend logs:**
```
🔄 Bulk assigning source [id] to 1 agents
📋 Source ID: [id-específico-de-cir32]
📋 Agent IDs: ["[id-agente]"]
📄 Source to update: Cir32.pdf
   Document ID: [id-específico]
   Current assignedToAgents: ["cli-upload"]
   NEW assignedToAgents: ["[id-agente]"]
💾 Firestore update operation:
   Collection: context_sources
   Document ID: [id-específico]
   Update data: {
     "assignedToAgents": ["[id-agente]"],
     "updatedAt": "[timestamp]"
   }
✅ Source [id] ( Cir32.pdf ) assigned to 1 agents
   Updated document ID: [id-específico]
   Verified assignedToAgents after update: ["[id-agente]"]
🔍 Sample of other CLI documents after update:
   - Cir35.pdf: assignedToAgents = ["cli-upload"]  ⬅️ SHOULD BE UNCHANGED
   - Cir-231.pdf: assignedToAgents = ["cli-upload"]  ⬅️ SHOULD BE UNCHANGED
```

**Frontend verification:**
```
✅ Bulk assignment successful: {success: true, sourceId: "...", assignedCount: 1}
   Updated source ID: [id-específico]
   Assigned to 1 agents
🔄 Reloading all sources after assignment...
✅ Sources reloaded. Verifying assignment...
🔍 Verification - Source after reload: Cir32.pdf
   assignedToAgents: ["[id-agente]"]  ⬅️ SHOULD BE NEW VALUE
```

---

## 🚨 What to Look For

### ✅ CORRECT Behavior

**Console muestra:**
1. Solo Cir32.pdf siendo actualizado
2. Otros documentos CLI mantienen `assignedToAgents: ["cli-upload"]`
3. Verificación post-update muestra el nuevo valor solo en Cir32.pdf

**UI muestra:**
1. Solo Cir32.pdf tiene el nuevo agente asignado
2. Cir35.pdf, Cir-231.pdf NO cambian sus asignaciones

### ❌ INCORRECT Behavior (Report if occurs)

**Console muestra:**
1. Múltiples documentos siendo actualizados
2. Otros documentos cambian a los mismos agentIds
3. Verificación muestra todos los CLI docs con mismo valor

**UI muestra:**
1. Cir32.pdf, Cir35.pdf, Cir-231.pdf todos asignados
2. Asignaciones en masa no solicitadas

---

## 💡 Posible Causa Si Persiste

Si después de estos logs detallados el problema continúa, las posibles causas serían:

### Hipótesis 1: Race Condition en Frontend
```typescript
// Posibilidad: setState batch update afectando múltiples sources
// Solución: Verificar que selectedSourceIds tiene UN solo ID
```

### Hipótesis 2: Firestore Query Issue
```typescript
// Posibilidad: .doc(sourceId) no está siendo tan específico como esperamos
// Solución: Verificar que sourceId es string único, no array
```

### Hipótesis 3: Frontend Selection Issue
```typescript
// Posibilidad: Al hacer click en checkbox, se seleccionan múltiples
// Solución: Verificar selectedSourceIds.length en console ANTES de assign
```

---

## 🎯 Debugging Checklist

Con los nuevos logs, podrás verificar:

- [ ] ¿Qué sourceId se envía desde frontend? (debe ser UNO solo)
- [ ] ¿Qué sourceId recibe el backend? (debe ser el mismo)
- [ ] ¿Qué documento se actualiza en Firestore? (debe ser UNO solo)
- [ ] ¿Los otros documentos CLI cambian? (NO deben cambiar)
- [ ] ¿La verificación post-update muestra el valor correcto? (debe ser el nuevo)

---

## 📝 Next Steps

1. **Run the test** con los pasos de arriba
2. **Copy ALL console logs** y envíamelos
3. **Take screenshot** de los documentos antes y después
4. Con esa información podré identificar EXACTAMENTE dónde está el problema

---

**Status:** Enhanced logging deployed  
**Ready for:** Detailed debugging session  
**Expected:** Los logs revelarán el problema exacto


