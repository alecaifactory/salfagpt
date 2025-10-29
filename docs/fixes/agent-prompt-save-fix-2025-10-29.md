# Fix: Agent Prompt No Se Guardaba Correctamente ✅

**Date:** 2025-10-29  
**Issue:** El prompt específico del agente no se guardaba en Firestore  
**Status:** ✅ RESUELTO

---

## 🐛 Problema

### Síntoma:
```
1. Usuario edita el prompt del agente en el modal
2. Ingresa texto largo (ej: 744 caracteres con instrucciones detalladas)
3. Click "Guardar Prompt del Agente"
4. Error 500 en la consola
5. Modal se cierra pero el prompt NO se guarda
6. Al volver a abrir, el prompt vuelve al valor anterior (corto)
```

### Error en Consola:
```javascript
Error 500: Value for argument "data" is not a valid Firestore document. 
Cannot use "undefined" as a Firestore value (found in field "temperature"). 
If you want to ignore undefined values, enable `ignoreUndefinedProperties`.
```

---

## 🔍 Causa Raíz

### Problema #1: Parámetros Incorrectos

**Archivo:** `src/pages/api/conversations/[id]/prompt.ts` línea 59

**ANTES (❌ Incorrecto):**
```typescript
const config = await saveAgentConfig(id, {
  conversationId: id,  // ❌ conversationId ya está como parámetro 1
  userId,              // ❌ userId también debe ser parámetro 2
  model: ...,
  agentPrompt: ...,
  temperature: ...,
  maxOutputTokens: ...,
});
```

**Firma de saveAgentConfig:**
```typescript
export async function saveAgentConfig(
  conversationId: string,  // ← Parámetro 1
  userId: string,          // ← Parámetro 2  
  config: Omit<AgentConfig, 'id' | 'conversationId' | 'userId' | ...>  // ← Parámetro 3
): Promise<AgentConfig>
```

**Resultado:** TypeScript interpretaba mal los parámetros, causando que la función recibiera datos incorrectos.

---

### Problema #2: Valores Undefined en Firestore

**Archivo:** `src/pages/api/conversations/[id]/prompt.ts`

**ANTES (❌ Incorrecto):**
```typescript
const configToSave = {
  model: model || existingConfig?.model || 'gemini-2.5-flash',
  agentPrompt: agentPrompt || '',
  temperature: existingConfig?.temperature,        // ❌ undefined si no existe
  maxOutputTokens: existingConfig?.maxOutputTokens // ❌ undefined si no existe
};

await saveAgentConfig(id, userId, configToSave);
// ❌ Firestore rechaza valores undefined
```

**Error:** Firestore no acepta `undefined` como valor. Si `existingConfig` no tiene `temperature` o `maxOutputTokens`, estos campos son `undefined` y Firestore arroja error.

---

### Problema #3: Guardando en Chat en Vez de Agente Padre

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**ANTES (❌ Incorrecto):**
```typescript
// Siempre guardaba en currentConversation (podría ser un chat hijo)
const response = await fetch(`/api/conversations/${currentConversation}/prompt`, {
  method: 'PUT',
  ...
});
```

**Resultado:** Si el usuario estaba en un chat hijo (ej: "Nuevo Chat" con ID "DJCzG5RK9FpSssizAp34"), el prompt se guardaba en ese chat específico, NO en el agente padre (S001: "AjtQZEIMQvFnPRJRjl4y"). Esto causaba que:
- El prompt no aparecía al seleccionar el agente
- Cada chat tenía su propio prompt en vez de heredar del agente
- La configuración no era consistente entre chats del mismo agente

---

## ✅ Solución

### Fix #1: Corregir Parámetros

**AHORA (✅ Correcto):**
```typescript
const config = await saveAgentConfig(id, userId, {
  model: model || existingConfig?.model || 'gemini-2.5-flash',
  agentPrompt: agentPrompt || '',
  temperature: existingConfig?.temperature,
  maxOutputTokens: existingConfig?.maxOutputTokens,
});
```

**Cambios:**
- ✅ `id` como parámetro 1 (conversationId)
- ✅ `userId` como parámetro 2 (separado del config)
- ✅ Objeto config como parámetro 3 (sin `conversationId` ni `userId`)

---

### Fix #2: Filtrar Valores Undefined

**AHORA (✅ Correcto):**
```typescript
// Build config object, filtering out undefined values
const configToSave: any = {
  model: model || existingConfig?.model || 'gemini-2.5-flash',
  agentPrompt: agentPrompt || '',
};

// Only include temperature if defined
if (existingConfig?.temperature !== undefined) {
  configToSave.temperature = existingConfig.temperature;
}

// Only include maxOutputTokens if defined
if (existingConfig?.maxOutputTokens !== undefined) {
  configToSave.maxOutputTokens = existingConfig.maxOutputTokens;
}

const config = await saveAgentConfig(id, userId, configToSave);
```

**Beneficios:**
- ✅ Solo incluye campos que tienen valor definido
- ✅ Firestore acepta el documento sin errores
- ✅ Campos opcionales quedan vacíos (no undefined)

---

### Fix #3: Guardar en Agente Padre, No en Chat Hijo

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**AHORA (✅ Correcto):**

```typescript
const handleSaveAgentPrompt = async (agentPrompt: string) => {
  if (!currentConversation) return;
  
  try {
    // 🔑 CRITICAL: Get parent agent ID if this is a chat
    const currentConv = conversations.find(c => c.id === currentConversation);
    const agentIdToSave = currentConv?.agentId || currentConversation;
    
    console.log('🔍 [FRONTEND] Current conversation ID:', currentConversation);
    console.log('🔍 [FRONTEND] Is chat with parent agent:', !!currentConv?.agentId);
    console.log('🔍 [FRONTEND] Agent ID to save to:', agentIdToSave);
    
    // Guardar en el AGENTE PADRE, no en el chat hijo
    const response = await fetch(`/api/conversations/${agentIdToSave}/prompt`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentPrompt,
        userId,
        model: currentAgentConfig?.preferredModel || globalUserSettings.preferredModel,
      }),
    });
    // ...
  }
};
```

**También corregido en loadPromptsForAgent:**
```typescript
const loadPromptsForAgent = async (conversationId: string) => {
  try {
    // 🔑 CRITICAL: Get parent agent ID if this is a chat
    const currentConv = conversations.find(c => c.id === conversationId);
    const agentIdToLoad = currentConv?.agentId || conversationId;
    
    console.log('🔍 [LOAD PROMPTS] Agent ID to load from:', agentIdToLoad);
    
    // Cargar desde el AGENTE PADRE, no del chat hijo
    const agentResponse = await fetch(`/api/conversations/${agentIdToLoad}/prompt`);
    // ...
  }
};
```

**Beneficios:**
- ✅ Prompt se guarda una sola vez en el agente padre
- ✅ Todos los chats del agente heredan el mismo prompt
- ✅ Configuración consistente para todo el agente
- ✅ Cambios en el prompt se reflejan en todos los chats

---

## 🧪 Verificación

### Logs en Consola (Exitoso):

```javascript
// FRONTEND - Determinando dónde guardar
💾 [FRONTEND] Guardando agent prompt...
🔍 [FRONTEND] Current conversation ID: x0dGOunL50ibm7k0XICc (chat hijo)
🔍 [FRONTEND] Is chat with parent agent: true  ← Detecta que es un chat
🔍 [FRONTEND] Agent ID to save to: AjtQZEIMQvFnPRJRjl4y  ← Guarda en agente padre (S001) ✅
🔍 [FRONTEND] Agent prompt length: 744
🔍 [FRONTEND] Full agent prompt: Eres un asistente de IA útil, preciso...

// BACKEND
🔍 [BACKEND] PUT /api/conversations/:id/prompt
🔍 [BACKEND] Conversation ID: AjtQZEIMQvFnPRJRjl4y  ← Agente padre correcto ✅
🔍 [BACKEND] User ID: 114671162830729001607
🔍 [BACKEND] Agent prompt received length: 744
🔍 [BACKEND] Config to save: {model: "gemini-2.5-flash", agentPrompt: "..."}

// FIRESTORE
🔍 [FIRESTORE] saveAgentConfig called
🔍 [FIRESTORE] conversationId: AjtQZEIMQvFnPRJRjl4y  ← Agente padre S001 ✅
🔍 [FIRESTORE] config.agentPrompt length: 744
🔍 [FIRESTORE] Final agentConfig to save: {...}
✅ [FIRESTORE] Agent config saved from localhost: AjtQZEIMQvFnPRJRjl4y
🔍 [FIRESTORE] Verification - agentPrompt length: 744

// FRONTEND (Respuesta)
✅ [FRONTEND] Agent prompt saved, response: {agentPrompt: ..., model: gemini-2.5-flash}
🔍 [FRONTEND] Saved prompt length: 744
✅ Agent prompt saved
```

**Resultado:** ✅ El prompt completo (744 caracteres) se guardó exitosamente en el AGENTE PADRE (AjtQZEIMQvFnPRJRjl4y)

---

## 📋 Archivos Modificados

1. **`src/pages/api/conversations/[id]/prompt.ts`**
   - ✅ Corregido orden de parámetros en `saveAgentConfig()` (3 parámetros correctos)
   - ✅ Filtrado de valores `undefined` antes de guardar en Firestore
   - ✅ Agregado logging detallado para debugging

2. **`src/components/ChatInterfaceWorking.tsx`**
   - ✅ **CRITICAL:** `handleSaveAgentPrompt()` ahora detecta si está en chat hijo y guarda en agente padre
   - ✅ **CRITICAL:** `loadPromptsForAgent()` ahora carga desde agente padre
   - ✅ Props del `AgentPromptModal` usan agente padre
   - ✅ Agregado logging detallado con detección de parent agent

3. **`src/lib/firestore.ts`**
   - ✅ Agregado logging detallado en `saveAgentConfig()`
   - ✅ Verificación post-guardado con lectura de Firestore
   - ✅ Logging de todos los parámetros recibidos

---

## 🎯 Pasos para Reproducir el Fix

### 1. Aplicar los Cambios

```bash
# Los cambios ya están aplicados en:
# - src/pages/api/conversations/[id]/prompt.ts
# - src/components/ChatInterfaceWorking.tsx
# - src/lib/firestore.ts
```

### 2. Probar en Localhost

1. Abrir http://localhost:3000/chat
2. Expandir "Agentes"
3. Click en un agente (ej: "GESTION BODEGAS GPT (S001)")
4. Click "Configurar Contexto"
5. Click "Editar Prompt" (botón verde con icono Sparkles)
6. Ingresar texto largo (ej: 744 caracteres)
7. Click "Guardar Prompt del Agente"
8. **Resultado esperado:** ✅ Modal se cierra sin errores
9. Volver a abrir el modal
10. **Verificar:** El prompt guardado aparece completo (744 caracteres)

### 3. Verificar en Firestore

**Firebase Console:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fagent_configs
```

**Buscar documento:** `DJCzG5RK9FpSssizAp34` (o el ID de tu conversación)

**Verificar campo:** `agentPrompt` debe contener el texto completo (744 caracteres)

---

## 🔒 Lecciones Aprendidas

### 1. **Siempre verificar firma de funciones**
   - ✅ Revisar cuántos parámetros espera
   - ✅ Revisar el orden de los parámetros
   - ✅ Verificar tipos esperados

### 2. **Firestore no acepta undefined**
   - ✅ Filtrar valores undefined antes de `.set()`
   - ✅ Usar condicionales para campos opcionales
   - ✅ Alternativa: `ignoreUndefinedProperties: true` en config

### 3. **Logging detallado es crítico**
   - ✅ Log en frontend, backend, y firestore
   - ✅ Log longitud de strings largos
   - ✅ Log valores antes y después de guardar
   - ✅ Verificar con lectura post-guardado

### 4. **Hot reload puede causar confusión**
   - ⚠️ Código viejo puede estar en cache
   - ⚠️ Refresh completo (Cmd+Shift+R) después de cambios
   - ⚠️ Revisar logs cuidadosamente para distinguir

---

## 📊 Antes vs Después

| Aspecto | ANTES ❌ | DESPUÉS ✅ |
|---------|---------|------------|
| **Parámetros de saveAgentConfig** | 2 parámetros incorrectos | 3 parámetros correctos |
| **Valores undefined** | Se enviaban a Firestore | Se filtran antes de guardar |
| **Error 500** | Sí, bloqueaba guardado | No, guardado exitoso |
| **Prompt guardado** | Solo primera oración | Texto completo (744 chars) |
| **Persistencia** | No persistía | ✅ Persiste en Firestore |
| **Logging** | Mínimo | Detallado en 3 capas |

---

## ✅ Verificación Final

### Test Case: Prompt Largo

**Input:**
```
Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.

Si el formato de la pregunta es compleja: pregunta mas de una cosa a la vez, o tiene muchas consideraciones, preguntale al usuario si puede especificar por donde empezar para mejorar la respuesta. 

Si la pregunta da respuestas que no son las mejores, propon mejores preguntas. 

Que la respuesta sea breve, con un breve resumen concreto al principio, luego si hace falta hasta 3 bullet points adicionales con los principales puntos y sus referencias. 

Finalmente conclusion.

Propon preguntas de seguimiento relacionadas con la pregunta realizada.
```

**Expected Output:**
- ✅ Guardado exitoso (sin Error 500)
- ✅ Modal se cierra automáticamente
- ✅ Al volver a abrir, prompt aparece completo
- ✅ 744 caracteres guardados en Firestore
- ✅ Logs muestran todo el flujo correctamente

**Actual Result:** ✅ CUMPLE TODOS LOS CRITERIOS

---

## 🚀 Siguientes Pasos

### Opcional: Remover Logging Extenso

Una vez confirmado que funciona en producción, considerar:

```typescript
// Remover o comentar logs de debugging:
// console.log('🔍 [FRONTEND] Full agent prompt:', agentPrompt);
// console.log('🔍 [BACKEND] Full agent prompt received:', agentPrompt);
// console.log('🔍 [FIRESTORE] Verification - agentPrompt:', savedData?.agentPrompt);

// Mantener solo logs esenciales:
console.log('✅ Agent prompt saved');
console.log('✅ [BACKEND] Agent prompt updated:', id);
console.log(`✅ [FIRESTORE] Agent config saved from ${source}:`, conversationId);
```

---

**Last Updated:** 2025-10-29  
**Fixed By:** API parameter correction + undefined value filtering  
**Tested:** ✅ Localhost confirmed working  
**Ready for Production:** ✅ Yes

