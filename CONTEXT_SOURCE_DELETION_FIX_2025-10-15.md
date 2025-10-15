# 🔧 Fix: Borrado de Fuentes de Contexto por Agente

**Fecha:** 2025-10-15  
**Prioridad:** 🔴 ALTA  
**Estado:** ✅ Implementado

---

## 🎯 Problema Identificado

### Comportamiento Incorrecto
- ❌ Al borrar un documento del contexto de un agente y refrescar, **el documento vuelve a aparecer**
- ❌ El borrado solo afectaba el estado local de React, **no persistía en Firestore**
- ❌ No distinguía entre "borrar del agente" vs "borrar completamente"

**Impacto:**
- Confusión del usuario
- Datos inconsistentes
- No respeta el patrón `assignedToAgents` de firestore.mdc

---

## ✅ Solución Implementada

### Concepto: Borrado Inteligente

**Lógica:**
```
Si documento está en Agente A y Agente B:
  - Usuario borra de Agente A
  - Documento se remueve de assignedToAgents[A]
  - Documento PERMANECE en assignedToAgents[B]
  - Documento sigue visible en Agente B ✅

Si documento solo está en Agente A:
  - Usuario borra de Agente A
  - assignedToAgents queda vacío []
  - Documento se ELIMINA completamente de Firestore ✅
```

---

### Implementación

#### 1. **Nueva Función en firestore.ts**

```typescript
export async function removeAgentFromContextSource(
  sourceId: string,
  agentId: string
): Promise<{ deleted: boolean; remainingAgents: number }>
```

**Lógica:**
1. Lee el documento de Firestore
2. Obtiene `assignedToAgents` actual
3. Remueve `agentId` del array
4. Si array queda vacío → **ELIMINA** documento
5. Si array tiene otros agentes → **ACTUALIZA** assignedToAgents
6. Retorna: si fue eliminado y cuántos agentes quedan

**Archivo:** `src/lib/firestore.ts` líneas 1468-1514

---

#### 2. **Nuevo Endpoint API**

```
POST /api/context-sources/:id/remove-agent
Body: { agentId: string }
```

**Funcionalidad:**
- ✅ Autenticación requerida
- ✅ Llama a `removeAgentFromContextSource`
- ✅ Retorna resultado con mensaje claro
- ✅ Logging de operación

**Archivo:** `src/pages/api/context-sources/[id]/remove-agent.ts`

---

#### 3. **Actualización en ChatInterfaceWorking.tsx**

**Antes:**
```typescript
onRemoveSource={(id) => {
  setContextSources(prev => prev.filter(s => s.id !== id));
  // ❌ Solo local, no persiste
}}
```

**Después:**
```typescript
onRemoveSource={async (sourceId) => {
  // 1. Llama API para remover agente
  const response = await fetch(`/api/context-sources/${sourceId}/remove-agent`, {
    method: 'POST',
    body: JSON.stringify({ agentId: currentConversation }),
  });

  // 2. Actualiza estado local
  setContextSources(prev => prev.filter(s => s.id !== sourceId));
  
  // 3. Actualiza active context sources
  await fetch(`/api/conversations/${currentConversation}/context-sources`, {
    method: 'PUT',
    body: JSON.stringify({ activeContextSourceIds: updatedIds }),
  });
}}
```

**Archivo:** `src/components/ChatInterfaceWorking.tsx` líneas 1113-1159

---

## 🔄 Flujo Completo

### Caso 1: Documento en 2 Agentes

```
Estado Inicial:
  - Documento: "CV.pdf"
  - assignedToAgents: ["agent-A", "agent-B"]
  
Usuario en Agente A:
  1. Click en 🗑️ de "CV.pdf"
     ↓
  2. Frontend llama: POST /api/context-sources/cv-123/remove-agent
     Body: { agentId: "agent-A" }
     ↓
  3. Backend:
     - Lee assignedToAgents: ["agent-A", "agent-B"]
     - Remueve "agent-A"
     - Actualiza assignedToAgents: ["agent-B"]
     - Retorna: { deleted: false, remainingAgents: 1 }
     ↓
  4. Frontend:
     - Actualiza estado local (remueve de lista)
     - Actualiza conversation_context
     ↓
  5. Usuario refresca página:
     - loadContextForConversation filtra por agentId
     - "CV.pdf" NO aparece en Agente A ✅
     
Usuario cambia a Agente B:
  - loadContextForConversation filtra por "agent-B"
  - "CV.pdf" SÍ aparece en Agente B ✅
```

---

### Caso 2: Documento en 1 Solo Agente

```
Estado Inicial:
  - Documento: "Informe.pdf"
  - assignedToAgents: ["agent-A"]
  
Usuario en Agente A:
  1. Click en 🗑️ de "Informe.pdf"
     ↓
  2. Backend:
     - Lee assignedToAgents: ["agent-A"]
     - Remueve "agent-A"
     - Array queda vacío: []
     - ELIMINA documento completamente
     - Retorna: { deleted: true, remainingAgents: 0 }
     ↓
  3. Usuario refresca:
     - Documento no existe en Firestore
     - No aparece en ningún agente ✅
```

---

## 🧪 Testing

### Test Manual Requerido

#### Setup:
1. **Crea Agente A** ("Test Agent A")
2. **Sube documento** "Test.pdf" en Agente A
3. **Crea Agente B** ("Test Agent B")
4. **Sube documento** "Test.pdf" en Agente B (mismo archivo)

#### Test 1: Borrar de Agente A
```
Pasos:
1. En Agente A, borrar "Test.pdf"
2. Verificar que desaparece de la lista
3. Refrescar página
4. Verificar que NO reaparece en Agente A ✅

5. Cambiar a Agente B
6. Verificar que "Test.pdf" SIGUE en Agente B ✅
```

#### Test 2: Borrar de Agente B
```
Pasos:
1. En Agente B, borrar "Test.pdf"
2. Verificar que desaparece
3. Refrescar página
4. Verificar que NO reaparece ✅
5. Documento eliminado completamente ✅
```

#### Test 3: Documento en 1 Solo Agente
```
Pasos:
1. Crear Agente C
2. Subir "Unique.pdf" solo en Agente C
3. Borrar "Unique.pdf"
4. Refrescar
5. Verificar que NO reaparece ✅
6. Documento eliminado completamente ✅
```

---

## 📊 Logs Esperados

### Al Borrar de Agente (Queda en Otros)
```bash
🗑️ Removing source abc123 from agent agent-A
📝 Removing agent agent-A from source abc123: { before: 2, after: 1 }
✅ Agent removed from context source: abc123, 1 agents remain
✅ Fuente removida del agente (1 agente(s) restante(s))
```

### Al Borrar de Último Agente (Eliminación Completa)
```bash
🗑️ Removing source abc123 from agent agent-B
📝 Removing agent agent-B from source abc123: { before: 1, after: 0 }
🗑️ Context source deleted (no agents remain): abc123
✅ Fuente eliminada completamente (sin agentes asignados)
```

---

## 🔍 Verificación en Firestore

### Antes del Fix:
```javascript
// Documento en Firestore
{
  id: "source-123",
  userId: "user-abc",
  name: "CV.pdf",
  assignedToAgents: ["agent-A", "agent-B"]
}

// Usuario borra de Agente A
// ❌ Estado local actualizado, Firestore NO
// Al refrescar → vuelve a aparecer
```

### Después del Fix:
```javascript
// Documento en Firestore ANTES
{
  id: "source-123",
  userId: "user-abc",
  name: "CV.pdf",
  assignedToAgents: ["agent-A", "agent-B"]
}

// Usuario borra de Agente A
// ✅ Firestore actualizado
{
  id: "source-123",
  userId: "user-abc",
  name: "CV.pdf",
  assignedToAgents: ["agent-B"] // ✅ Solo agent-B queda
}

// Al refrescar Agente A → NO aparece ✅
// Al cargar Agente B → SÍ aparece ✅
```

---

## 📁 Archivos Modificados

### Nuevos:
1. ✅ `src/pages/api/context-sources/[id]/remove-agent.ts`
   - Endpoint para remover agente del contexto

### Modificados:
1. ✅ `src/lib/firestore.ts`
   - Nueva función: `removeAgentFromContextSource`
   
2. ✅ `src/components/ChatInterfaceWorking.tsx`
   - `onRemoveSource` ahora persiste en Firestore

---

## 🔒 Alineación con Reglas

### firestore.mdc ✅
- ✅ Usa patrón `assignedToAgents`
- ✅ Elimina solo cuando array vacío
- ✅ Preserva para otros agentes

### privacy.mdc ✅
- ✅ Solo el owner puede borrar
- ✅ Autenticación requerida
- ✅ userId verificado

### alignment.mdc ✅
- ✅ Data Persistence First (persiste cambios)
- ✅ Type Safety (0 errores)
- ✅ Backward Compatible (sí)

---

## ✅ Checklist de Implementación

### Backend ✅
- [x] Función `removeAgentFromContextSource` en firestore.ts
- [x] Endpoint `/api/context-sources/:id/remove-agent`
- [x] Autenticación y validación
- [x] Logging de operaciones

### Frontend ✅
- [x] `onRemoveSource` llama al endpoint
- [x] Actualiza estado local
- [x] Actualiza conversation_context
- [x] Error handling

### Testing 🧪
- [ ] Manual: Borrar de agente con múltiples asignaciones
- [ ] Manual: Borrar de último agente
- [ ] Manual: Verificar después de refresh
- [ ] Manual: Verificar en otro agente

---

## 🚀 Próximos Pasos

### Inmediato:
1. **Ejecutar tests manuales** (ver arriba)
2. **Verificar que persiste** después de refresh
3. **Confirmar funcionamiento**

### Si funciona:
```bash
git add .
git commit -m "fix: Persist context source deletion per agent

Problem: Deleting a context source from an agent would reappear on refresh
because deletion was only in local React state, not persisted to Firestore.

Solution:
- New function: removeAgentFromContextSource()
- Updates assignedToAgents array in Firestore
- Only deletes document if no agents remain
- Updates conversation_context to reflect change

Implementation:
- src/lib/firestore.ts: removeAgentFromContextSource()
- src/pages/api/context-sources/[id]/remove-agent.ts: New endpoint
- src/components/ChatInterfaceWorking.tsx: Call endpoint on delete

Testing:
- Document in multiple agents → removes from one, stays in others
- Document in single agent → removes completely
- Changes persist after page refresh

Follows: firestore.mdc (assignedToAgents pattern), privacy.mdc
Backward Compatible: Yes
Breaking Changes: None"
```

---

## 📊 Impacto

### Antes:
- ❌ Borrado solo local
- ❌ Reaparece al refrescar
- ❌ No respeta assignedToAgents
- ❌ Confusión del usuario

### Después:
- ✅ Borrado persiste en Firestore
- ✅ NO reaparece al refrescar
- ✅ Respeta assignedToAgents
- ✅ Comportamiento predecible
- ✅ Documentos compartidos entre agentes funcionan correctamente

---

**Estado:** ✅ Listo para testing  
**Backward Compatible:** Sí (documentos existentes sin assignedToAgents siguen funcionando)  
**Breaking Changes:** Ninguno

---

**Siguiente paso:** Testing manual para confirmar funcionamiento antes de commit.

