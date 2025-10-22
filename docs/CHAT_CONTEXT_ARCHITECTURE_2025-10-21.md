# Chat Context Architecture - October 21, 2025

## 🎯 Arquitectura de Contexto para Chats

### Principio Fundamental

**Un chat debe tener acceso SOLO a:**
1. ✅ **Contexto del agente padre** (fuentes de contexto/documentos)
2. ✅ **Historial de ESA conversación** (mensajes previos de ese chat)

**Un chat NO debe tener acceso a:**
- ❌ Mensajes de otros chats del mismo agente
- ❌ Contexto de otros chats
- ❌ Configuraciones de otros chats

## 📊 Diagrama de Contexto

### Para un Agente (Conversación Raíz)

```
┌─────────────────────────────────────┐
│ Agente M001                         │
├─────────────────────────────────────┤
│ Contexto:                           │
│  • Documento Manual.pdf             │ ← Fuentes de contexto
│  • Guía Seguridad.pdf               │
│                                     │
│ Historial:                          │
│  • Mensaje 1 del agente             │ ← Solo mensajes de M001
│  • Mensaje 2 del agente             │
│  • Mensaje 3 del agente             │
└─────────────────────────────────────┘
```

### Para un Chat del Agente

```
┌─────────────────────────────────────┐
│ Chat: "Aprendizaje"                 │
│ Agente Padre: M001                  │
├─────────────────────────────────────┤
│ Contexto (heredado de M001):        │
│  • Documento Manual.pdf             │ ← Del agente M001
│  • Guía Seguridad.pdf               │
│                                     │
│ Historial (propio):                 │
│  • Msg 1 de "Aprendizaje"           │ ← SOLO de este chat
│  • Msg 2 de "Aprendizaje"           │
│  • Msg 3 de "Aprendizaje"           │
│                                     │
│ NO incluye:                         │
│  ❌ Mensajes de otros chats de M001 │
│  ❌ Contexto de otros chats         │
└─────────────────────────────────────┘
```

## 🔧 Implementación Técnica

### 1. Carga de Contexto (useEffect)

```typescript
// Líneas 924-986
const currentConv = conversations.find(c => c.id === currentConversation);

if (currentConv?.agentId) {
  // Es un chat - cargar contexto del agente padre
  loadContextForConversation(currentConv.agentId); // ← Contexto del AGENTE
  
  // Auto-fix si el chat no tiene contexto asignado
  // (heredar fuentes del agente)
} else {
  // Es un agente - cargar su propio contexto
  loadContextForConversation(currentConversation);
}
```

### 2. Carga de Mensajes

```typescript
// Líneas 920-921
loadMessages(currentConversation); // ← Solo mensajes de ESTA conversación
```

**API Call:**
```typescript
// Línea 416
const response = await fetch(`/api/conversations/${conversationId}/messages`);
```

El backend devuelve solo mensajes donde `conversationId === chatId` - **NUNCA** mezcla mensajes de otros chats.

### 3. Envío de Mensaje

```typescript
// Líneas 1425-1437
const response = await fetch(`/api/conversations/${currentConversation}/messages-stream`, {
  body: JSON.stringify({
    userId,
    message: messageToSend,
    model: currentAgentConfig.preferredModel,
    systemPrompt: currentAgentConfig.systemPrompt,
    contextSources: activeContextSources, // ← Fuentes del agente padre
    ragEnabled: agentRAGMode === 'rag',
  })
});
```

**Contexto enviado:**
- `contextSources` viene del state `contextSources`
- Este state fue cargado con `loadContextForConversation(agentId)` del agente padre
- Solo incluye fuentes del agente, NO de otros chats

## 🔒 Garantías de Aislamiento

### Garantía 1: Mensajes Aislados por Conversación

**Backend API:** `/api/conversations/:id/messages`

```typescript
// Query en Firestore
.where('conversationId', '==', conversationId)
```

**Resultado:** Solo devuelve mensajes donde `conversationId` coincide exactamente.

**Ejemplo:**
- Chat "Aprendizaje" (ID: chat-123)
  - Mensajes: Solo donde `conversationId === 'chat-123'`
- Chat "Resumen" (ID: chat-456)  
  - Mensajes: Solo donde `conversationId === 'chat-456'`
- **NO hay mezcla** ✅

### Garantía 2: Contexto Heredado del Agente Padre

**Lógica:**
```typescript
if (currentConv?.agentId) {
  // Cargar contexto del agente padre
  loadContextForConversation(currentConv.agentId); // ID del AGENTE
} else {
  // Cargar contexto propio
  loadContextForConversation(currentConversation); // ID del AGENTE MISMO
}
```

**Resultado:**
- Chat "Aprendizaje" (agentId: M001)
  - Contexto: Fuentes de M001
- Chat "Resumen" (agentId: M001)
  - Contexto: Fuentes de M001 (mismas que "Aprendizaje")
- **Contexto compartido del agente** ✅
- **Mensajes NO compartidos** ✅

### Garantía 3: Logs Separados por Conversación

**Implementación:**
```typescript
// Map de logs por conversación
const [conversationLogs, setConversationLogs] = useState<Map<string, ContextLog[]>>(new Map());

// Al cambiar conversación
const logsForConversation = conversationLogs.get(currentConversation) || [];
setContextLogs(logsForConversation); // Solo logs de ESTA conversación
```

**Resultado:**
- Chat "Aprendizaje": Logs solo de "Aprendizaje"
- Chat "Resumen": Logs solo de "Resumen"
- **NO hay mezcla** ✅

## 🧪 Verificación en Console

### Al Abrir Chat "Aprendizaje"

```
🔄 Cambiando a conversación: aprendizaje-id
📊 Cargando 0 logs para esta conversación ← Logs solo de este chat
🔗 Este es un chat del agente M001, cargando contexto del agente padre
🔧 Chat sin contexto detectado, heredando del agente padre...
✅ Auto-fix: 1 fuentes heredadas del agente al chat
🔄 Recargando contexto completo para mostrar fuentes en UI...
⚡ Loaded context sources metadata: 538
✅ Context sources for agent M001: { ... } ← Contexto de M001
```

### Al Enviar Mensaje

```
📤 Sending message to: /api/conversations/aprendizaje-id/messages-stream
📋 Context sources: 1 active
  - Manual.pdf (from M001)
🤖 AI processing with M001's context...
✅ Response generated using M001's documents
```

## ✅ Checklist de Verificación

### Contexto del Agente Padre
- [x] Chat carga fuentes de contexto del agente padre
- [x] Auto-fix hereda fuentes si el chat no las tiene
- [x] UI muestra "Usando contexto del agente: M001"
- [x] Panel muestra fuentes del agente activas
- [x] Envío de mensaje usa fuentes del agente

### Historial Propio del Chat
- [x] `loadMessages(chatId)` solo carga mensajes de ese chat
- [x] API filtra por `conversationId === chatId`
- [x] Logs separados por conversación
- [x] No mezcla con otros chats del mismo agente

### Aislamiento entre Chats
- [x] Chat A: Mensajes solo de Chat A
- [x] Chat B: Mensajes solo de Chat B
- [x] Ambos usan contexto de M001
- [x] Logs independientes
- [x] Sin contaminación cruzada

## 🔍 Debugging

### Si un chat no tiene contexto:

**1. Verifica en console:**
```javascript
// Debería ver:
🔧 Chat sin contexto detectado, heredando del agente padre...
✅ Auto-fix: X fuentes heredadas del agente al chat
```

**2. Verifica en UI:**
- Panel de contexto debe mostrar: "X fuentes" activas
- Panel debe mostrar: "Usando contexto del agente: [nombre]"

**3. Si aún no funciona:**
- Abre DevTools → Network
- Busca: `GET /api/conversations/{chatId}/context-sources`
- Verifica response: `activeContextSourceIds` debe tener IDs
- Busca: `GET /api/conversations/{agentId}/context-sources`  
- Verifica response: Agent debe tener fuentes activas

### Forzar Re-herencia Manual

Si el auto-fix no funciona, puedes:
1. Ir al agente M001
2. Click ⚙️ (configurar contexto)
3. Verificar que tiene fuentes activas
4. Cerrar modal
5. Ir al chat "Aprendizaje"
6. Auto-fix debería ejecutarse automáticamente

O crear un nuevo chat (heredará correctamente).

## 📝 Resumen

**Arquitectura garantizada:**

```
Chat = {
  Contexto: Fuentes del Agente Padre,
  Historial: Mensajes propios ÚNICAMENTE,
  Logs: Interacciones propias ÚNICAMENTE
}
```

**No hay contaminación cruzada entre chats.**  
**Cada chat es independiente excepto por el contexto compartido del agente.**

---

**Status:** ✅ Implemented & Auto-Fix Added  
**Date:** October 21, 2025  
**Type:** Context Architecture  
**Isolation:** Guaranteed  
**Testing:** Verificar con chat "Aprendizaje"

