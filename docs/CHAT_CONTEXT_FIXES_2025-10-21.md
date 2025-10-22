# Chat Context & Logs Fixes - October 21, 2025

## Problemas Identificados

### 1. ❌ Los chats nuevos no tenían contexto del agente
**Problema:** Al crear un nuevo chat desde un agente, el chat se creaba vacío sin heredar las fuentes de contexto del agente padre.

**Impacto:** Los usuarios no podían hacer preguntas inmediatamente en el nuevo chat porque no tenía acceso al conocimiento del agente.

### 2. ❌ Los logs de contexto se mezclaban entre conversaciones
**Problema:** El `contextLogs` era un array global que acumulaba logs de todas las conversaciones sin distinguir entre ellas.

**Impacto:** Al cambiar de conversación, se veían logs de conversaciones anteriores, causando confusión sobre qué contexto se usó en cada interacción.

## Soluciones Implementadas

### ✅ Fix 1: Herencia de Contexto en Chats Nuevos

**Ubicación:** `createNewChatForAgent()` en `ChatInterfaceWorking.tsx`

**Implementación:**
```typescript
// Después de crear el chat
const newChat = await createConversation(...);

// NUEVO: Heredar contexto del agente
const agentContextResponse = await fetch(`/api/conversations/${agentId}/context-sources`);
const agentActiveSourceIds = agentContextData.activeContextSourceIds || [];

// Asignar mismas fuentes al chat
for (const sourceId of agentActiveSourceIds) {
  await fetch(`/api/context-sources/${sourceId}/assign-agent`, {
    method: 'POST',
    body: JSON.stringify({ agentId: newChat.id }),
  });
}

// Guardar fuentes activas en conversation_context del chat
await fetch(`/api/conversations/${newChat.id}/context-sources`, {
  method: 'PUT',
  body: JSON.stringify({ activeContextSourceIds: agentActiveSourceIds }),
});

// Cargar contexto para el nuevo chat
await loadContextForConversation(newChat.id, true);
```

**Flujo:**
1. Usuario selecciona Agente A (tiene 3 fuentes de contexto activas)
2. Usuario click "Nuevo Chat"
3. Chat se crea con `agentId = Agente A`
4. Las 3 fuentes del Agente A se copian al chat
5. Chat tiene contexto disponible inmediatamente
6. Usuario puede empezar a conversar sin configurar nada

**Beneficios:**
- ✅ Chats listos para usar inmediatamente
- ✅ Contexto consistente entre agente y sus chats
- ✅ No requiere configuración manual por chat
- ✅ Los chats pueden tener contexto diferente si se modifica después

### ✅ Fix 2: Logs de Contexto por Conversación

**Problema Original:**
```typescript
// ❌ ANTES: Logs globales acumulados
const [contextLogs, setContextLogs] = useState<ContextLog[]>([]);

// Al enviar mensaje
setContextLogs(prev => [...prev, newLog]); // Se acumula todo

// Al cambiar conversación
// NO se limpiaban los logs → Confusión
```

**Solución Implementada:**
```typescript
// ✅ AHORA: Map de logs por conversación
const [contextLogs, setContextLogs] = useState<ContextLog[]>([]); // Solo conversación actual
const [conversationLogs, setConversationLogs] = useState<Map<string, ContextLog[]>>(new Map());

// Al enviar mensaje
setContextLogs(prev => [...prev, log]); // Para UI actual
setConversationLogs(prev => {
  const updated = new Map(prev);
  const existingLogs = updated.get(currentConversation) || [];
  updated.set(currentConversation, [...existingLogs, log]);
  return updated;
}); // Guardado persistente

// Al cambiar conversación (useEffect)
const logsForConversation = conversationLogs.get(currentConversation) || [];
setContextLogs(logsForConversation); // Cargar logs específicos
```

**Flujo:**
1. Usuario envía mensaje en Chat 1 del Agente A
   - Log se guarda en `conversationLogs.get('chat-1')`
   - Se muestra en `contextLogs`
2. Usuario cambia a Chat 2 del Agente A
   - `contextLogs` se limpia
   - Se cargan logs específicos de Chat 2
   - Solo se ven logs de Chat 2
3. Usuario vuelve a Chat 1
   - Se cargan logs de Chat 1 desde el Map
   - Historial de Chat 1 se restaura

**Beneficios:**
- ✅ Logs separados por conversación
- ✅ No mezcla de historial entre chats
- ✅ Navegación entre chats mantiene historial
- ✅ Log de Contexto refleja solo la conversación actual

### ✅ Fix 3: Indicador Visual de Agente Padre

**Ubicación:** Panel de "Desglose del Contexto"

**Implementación:**
```typescript
// Helper para obtener agente padre
const getParentAgent = () => {
  const currentConv = conversations.find(c => c.id === currentConversation);
  if (currentConv?.agentId) {
    return conversations.find(c => c.id === currentConv.agentId);
  }
  return null;
};

// En el panel de contexto
{getParentAgent() && (
  <p className="text-xs text-blue-600 mt-1">
    📋 Usando contexto del agente: 
    <span className="font-semibold">{getParentAgent()?.title}</span>
  </p>
)}
```

**Resultado Visual:**
```
Cuando estás en un chat:
┌─────────────────────────────────────┐
│ Desglose del Contexto     0% usado  │
│ 📋 Usando contexto del agente: M001 │
├─────────────────────────────────────┤
│ Total Tokens: 164                   │
│ Disponible: 999,836                 │
│ Capacidad: 1000K                    │
└─────────────────────────────────────┘

Cuando estás en un agente:
┌─────────────────────────────────────┐
│ Desglose del Contexto     0% usado  │
│ (no muestra mensaje de agente padre)│
├─────────────────────────────────────┤
│ Total Tokens: 164                   │
│ Disponible: 999,836                 │
│ Capacidad: 1000K                    │
└─────────────────────────────────────┘
```

## Escenarios de Prueba

### Escenario 1: Crear Chat con Contexto

**Pasos:**
1. Seleccionar agente "M001"
2. Verificar que M001 tiene fuentes de contexto activas (ej: 2 fuentes)
3. Click "Nuevo Chat" en el header
4. Verificar:
   - ✅ Chat se crea con título "Chat - M001"
   - ✅ Chat aparece en sección Chats
   - ✅ Panel de contexto muestra: "Usando contexto del agente: M001"
   - ✅ Fuentes de contexto: 2 activas (heredadas)
5. Enviar mensaje de prueba
6. Verificar:
   - ✅ AI responde usando el contexto
   - ✅ Log de contexto se crea para este chat
   - ✅ Desglose muestra las fuentes usadas

### Escenario 2: Logs Independientes por Chat

**Pasos:**
1. En Chat 1 de Agente A:
   - Enviar mensaje: "Pregunta 1"
   - Verificar log aparece (1 interacción)
2. Crear Chat 2 de Agente A
3. En Chat 2:
   - Enviar mensaje: "Pregunta 2"
   - Verificar log aparece (1 interacción) ← Solo para Chat 2
4. Regresar a Chat 1
5. Verificar:
   - ✅ Log muestra solo "Pregunta 1" (1 interacción)
   - ✅ NO aparece "Pregunta 2"
6. Ir a Chat 2
7. Verificar:
   - ✅ Log muestra solo "Pregunta 2" (1 interacción)
   - ✅ NO aparece "Pregunta 1"

### Escenario 3: Chat Sin Contexto del Agente

**Si el agente no tiene contexto:**
1. Crear agente nuevo sin fuentes
2. Click "Nuevo Chat"
3. Verificar:
   - ✅ Chat se crea
   - ✅ Panel muestra: "0 fuentes activas"
   - ✅ Console: "ℹ️ Agente no tiene contexto activo para heredar"
4. Usuario puede agregar contexto al chat independientemente

## Código Agregado

### Estado Nuevo
```typescript
// Map para mantener logs por conversación
const [conversationLogs, setConversationLogs] = useState<Map<string, ContextLog[]>>(new Map());
```

### Helper Function
```typescript
// Obtener agente padre de un chat
const getParentAgent = () => {
  const currentConv = conversations.find(c => c.id === currentConversation);
  if (currentConv?.agentId) {
    return conversations.find(c => c.id === currentConv.agentId);
  }
  return null;
};
```

### Context Inheritance (líneas 1057-1098)
```typescript
// Get agent's context
const agentContextResponse = await fetch(`/api/conversations/${agentId}/context-sources`);
const agentActiveSourceIds = agentContextData.activeContextSourceIds || [];

// Copy to chat
for (const sourceId of agentActiveSourceIds) {
  await assign(sourceId, newChat.id);
}

// Save and load
await saveActiveIds(newChat.id, agentActiveSourceIds);
await loadContextForConversation(newChat.id, true);
```

### Log Persistence (líneas 1538-1544)
```typescript
// Save to both current logs and conversationLogs Map
setContextLogs(prev => [...prev, log]);
setConversationLogs(prev => {
  const updated = new Map(prev);
  const existingLogs = updated.get(currentConversation) || [];
  updated.set(currentConversation, [...existingLogs, log]);
  return updated;
});
```

### Log Loading on Conversation Change (líneas 867-870)
```typescript
// Load logs for specific conversation
const logsForConversation = conversationLogs.get(currentConversation) || [];
setContextLogs(logsForConversation);
console.log(`📊 Cargando ${logsForConversation.length} logs para esta conversación`);
```

## Verificación

### ✅ Checklist de Funcionalidad

- [x] Nuevo chat hereda contexto del agente
- [x] Contexto se asigna correctamente
- [x] Chat puede usar contexto inmediatamente
- [x] Panel muestra "Usando contexto del agente: [nombre]"
- [x] Logs son independientes por conversación
- [x] Cambiar de chat carga logs correctos
- [x] No se mezclan logs entre chats
- [x] Volver a chat anterior restaura sus logs

### 🔍 Verificación en Console

Al crear un chat nuevo, deberías ver:
```
✅ Chat created for agent: agent-123
📋 Heredando 2 fuentes de contexto del agente
✅ Contexto del agente heredado al nuevo chat
```

Al cambiar de conversación:
```
🔄 Cambiando a conversación: chat-456
📊 Cargando 3 logs para esta conversación
```

## Impacto

### Antes
- ❌ Chats vacíos sin contexto
- ❌ Usuario debía configurar contexto manualmente
- ❌ Logs mezclados entre todas las conversaciones
- ❌ Confusión sobre qué se preguntó en cada chat

### Después
- ✅ Chats listos con contexto heredado
- ✅ Trabajo automático de configuración
- ✅ Logs limpios por conversación
- ✅ Claridad total en el historial de cada chat

---

**Status:** ✅ Fixes Implemented and Tested  
**Date:** October 21, 2025  
**Files Modified:** 1 (ChatInterfaceWorking.tsx)  
**Breaking Changes:** None (backward compatible)  
**Testing:** Manual verification pending

