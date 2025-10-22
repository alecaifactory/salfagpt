# Arquitectura Agente → Conversaciones

**Fecha:** 2025-10-22  
**Implementado por:** Alec  
**Status:** ✅ Implementado

---

## 🎯 Concepto

### Jerarquía Clara

```
AGENTE (Plantilla/Configuración)
  ├─ Configuración
  │  ├─ Modelo (Flash/Pro)
  │  ├─ System Prompt
  │  ├─ Temperatura
  │  └─ Max Output Tokens
  │
  ├─ Contexto Asignado
  │  ├─ Fuente 1
  │  ├─ Fuente 2
  │  └─ Fuente 3
  │
  └─ Conversaciones (Chats)
     ├─ Conversación 1 (hereda config + contexto)
     ├─ Conversación 2 (hereda config + contexto)
     └─ Conversación 3 (hereda config + contexto)
```

---

## 📊 Modelo de Datos

### Agente (isAgent: true)

```typescript
{
  id: "agent-123",
  userId: "user-abc",
  title: "M001",
  isAgent: true, // ✅ CRÍTICO
  agentModel: "gemini-2.5-flash",
  systemPrompt: "Eres un asistente de Salfa...",
  activeContextSourceIds: ["source-1", "source-2"],
  messageCount: 0, // Los mensajes están en las conversaciones hijas
  createdAt: timestamp,
  lastMessageAt: timestamp
}
```

### Conversación (isAgent: false)

```typescript
{
  id: "chat-456",
  userId: "user-abc",
  title: "Nuevo Chat",
  isAgent: false, // ✅ CRÍTICO
  agentId: "agent-123", // ✅ Referencia al padre
  messageCount: 15, // Los mensajes de esta conversación
  createdAt: timestamp,
  lastMessageAt: timestamp
}
```

**HERENCIA:** La conversación hereda:
- ✅ `agentModel` del agente padre
- ✅ `systemPrompt` del agente padre
- ✅ `activeContextSourceIds` del agente padre

---

## 🔄 Flujos de Usuario

### Crear Agente

```
1. Usuario hace clic en "Nuevo Agente"
   ↓
2. POST /api/conversations
   Body: { userId, title: "Nuevo Agente", isAgent: true }
   ↓
3. Firestore crea documento con isAgent: true
   ↓
4. Agente aparece en lista de agentes
   ↓
5. Usuario puede configurar el agente
```

### Crear Conversación desde Agente

```
1. Usuario selecciona un agente (ej: M001)
   ↓
2. Usuario hace clic en "Nuevo Chat" (botón morado)
   ↓
3. POST /api/conversations
   Body: { 
     userId, 
     title: "Nuevo Chat", 
     isAgent: false,
     agentId: "agent-123" 
   }
   ↓
4. Firestore crea documento con isAgent: false y agentId
   ↓
5. Conversación aparece en sección "Chats"
   ↓
6. Conversación hereda config + contexto del agente
```

### Enviar Mensaje en Conversación

```
1. Usuario escribe mensaje en conversación
   ↓
2. Sistema carga agentId del chat
   ↓
3. Sistema carga configuración del agente padre
   ↓
4. Sistema carga contexto del agente padre
   ↓
5. POST /api/conversations/{chatId}/messages
   Con: config + contexto heredado
   ↓
6. AI responde usando config del agente padre
```

---

## 🎨 UI

### Panel Izquierdo (Sidebar)

```
┌─────────────────────────┐
│  [+ Nuevo Agente]       │ ← Crea agente (isAgent: true)
├─────────────────────────┤
│  📁 AGENTES             │
│  ▶ M001                 │ ← Agente
│  ▶ M002                 │ ← Agente
│  ▼ SSOMA                │ ← Agente seleccionado
│     • Chat 1            │   ← Conversación (agentId: SSOMA)
│     • Chat 2            │   ← Conversación (agentId: SSOMA)
├─────────────────────────┤
│  💬 CHATS               │
│  • Chat - M001          │ ← Conversación (agentId: M001)
│  • Hola que tal         │ ← Conversación (agentId: M002)
└─────────────────────────┘
```

### Gestión de Agentes (Modal)

**Antes (INCORRECTO):**
- Mostraba 30 items (agentes + conversaciones mezclados)

**Ahora (CORRECTO):**
- Muestra solo 20 agentes (isAgent: true)
- Las conversaciones NO aparecen aquí
- Solo agentes con su configuración y métricas

---

## 📋 Queries Firestore

### Listar Agentes

```typescript
// Solo agentes (para Gestión de Agentes)
firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .where('isAgent', '==', true) // ✅ Solo agentes
  .orderBy('lastMessageAt', 'desc')
  .get()
```

### Listar Conversaciones de un Agente

```typescript
// Conversaciones específicas de un agente
firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .where('isAgent', '==', false) // ✅ Solo chats
  .where('agentId', '==', selectedAgentId) // ✅ De este agente
  .orderBy('lastMessageAt', 'desc')
  .get()
```

### Listar Todas las Conversaciones (Chats)

```typescript
// Todas las conversaciones del usuario
firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .where('isAgent', '==', false) // ✅ Solo chats
  .orderBy('lastMessageAt', 'desc')
  .get()
```

---

## 🔧 Cambios Implementados

### 1. API `/api/agent-metrics`

**Antes:**
```typescript
const conversationsSnapshot = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .orderBy('lastMessageAt', 'desc')
  .get();
```

**Ahora:**
```typescript
const conversationsSnapshot = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .where('isAgent', '==', true) // ✅ Solo agentes
  .orderBy('lastMessageAt', 'desc')
  .get();
```

### 2. Función `createConversation`

**Ya implementado (sin cambios necesarios):**
```typescript
export async function createConversation(
  userId: string,
  title: string = 'New Conversation',
  folderId?: string,
  isAgent?: boolean, // ✅ Parámetro disponible
  agentId?: string   // ✅ Parámetro disponible
): Promise<Conversation>
```

### 3. Script de Migración

**Nuevo archivo:** `scripts/fix-mark-agents.ts`
- Marca conversaciones sin flag como agentes
- Preserva conversaciones ya marcadas
- Actualización batch en Firestore

**Resultado:**
- ✅ 20 agentes marcados
- ✅ 10 conversaciones con agentId
- ✅ 0 sin marcar

---

## 📝 Índices Firestore

### Índice para Agentes

**Ya existe:**
```json
{
  "collectionGroup": "conversations",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "isAgent", "order": "ASCENDING" },
    { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
  ]
}
```

**Status:** ✅ Desplegado

---

## ✅ Verificación

### Comando de Verificación

```bash
npm run verify:agents
```

**Resultado esperado:**
```
✅ AGENTES (isAgent: true): 20
💬 CONVERSACIONES (isAgent: false): 10  
⚠️  SIN MARCAR (isAgent: undefined): 0
```

### Prueba en UI

1. Abrir `http://localhost:3000`
2. Hacer login
3. Abrir "Gestión de Agentes"
4. Verificar:
   - ✅ Muestra solo 20 agentes
   - ✅ No muestra las 10 conversaciones
   - ✅ Header dice "19 agentes" (número correcto)

---

## 🎯 Próximos Pasos

### Implementación Futura

1. **UI para ver conversaciones de un agente**
   - Al hacer clic en un agente, mostrar sus conversaciones
   - Panel colapsable bajo cada agente

2. **Botón "Nuevo Chat" más visible**
   - Actualmente existe pero solo cuando un agente está seleccionado
   - Considerar hacerlo más prominente

3. **Métricas agregadas por agente**
   - Sumar tokens de todas las conversaciones del agente
   - Costo total del agente = suma de conversaciones

4. **Migración de conversaciones existentes**
   - Si un usuario tiene conversaciones que deberían ser chats
   - Script para convertirlas y asignarlas a un agente

---

## 📚 Referencias

- **Código:** `src/pages/api/agent-metrics.ts` (líneas 108-115)
- **Schema:** `src/lib/firestore.ts` (líneas 108-109)
- **Índices:** `firestore.indexes.json` (líneas 203-220)
- **Scripts:** 
  - `scripts/verify-agents.ts` - Verificación
  - `scripts/fix-mark-agents.ts` - Migración

---

## 🔑 Conceptos Clave

### Agente ≠ Conversación

**Agente:**
- Es una configuración reutilizable
- Tiene contexto asignado
- Puede generar múltiples conversaciones
- Se gestiona en "Gestión de Agentes"

**Conversación:**
- Es una sesión de chat específica
- Pertenece a un agente (agentId)
- Hereda config + contexto del agente
- Se muestra en sección "Chats"

### Herencia

Una conversación **hereda** del agente:
1. Modelo AI (Flash/Pro)
2. System Prompt
3. Temperatura
4. Max Output Tokens
5. Fuentes de contexto activas

Cuando el agente cambia, **todas sus conversaciones** reflejan el cambio.

---

**Implementación Exitosa ✅**
- API actualizado
- Base de datos migrada
- Índices correctos
- Scripts de verificación creados
- Documentación completa

