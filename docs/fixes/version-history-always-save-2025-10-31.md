# Fix: Historial de Versiones Siempre Guarda - 2025-10-31

## 🐛 Problema Identificado

**Síntoma:**
- Usuario aplica prompt mejorado con IA
- Click en "Ver Historial"
- Mensaje: "No hay versiones anteriores"
- Historial vacío aunque ya se guardó un prompt

**Causa Raíz:**

La lógica de versionado tenía una condición restrictiva:

```typescript
// ❌ ANTES: Solo guardaba si había prompt ANTERIOR diferente
if (existingConfig?.agentPrompt && existingConfig.agentPrompt !== agentPrompt) {
  // Guardar versión
}
```

**Problema:**
- Primera vez que se guarda un prompt → NO se versiona (no hay anterior)
- Prompt inicial nunca entra al historial
- Usuario no ve versiones porque nunca se guardó la inicial

---

## ✅ Solución Implementada

### Estrategia: Doble Guardado

**1. Guardar versión anterior (si existe y es diferente):**
```typescript
if (existingConfig?.agentPrompt && existingConfig.agentPrompt !== agentPrompt) {
  await saveVersion({
    prompt: existingConfig.agentPrompt,  // La versión ANTERIOR
    versionNumber: existingConfig.promptVersion || 1,
    changeType: changeType || 'manual_update',
    previousVersion: true,
  });
}
```

**2. SIEMPRE guardar nueva versión (incluyendo la primera):**
```typescript
// ✅ NUEVO: Siempre guardar la versión que se está aplicando
await saveVersion({
  prompt: agentPrompt,  // La versión NUEVA
  versionNumber: (existingConfig?.promptVersion || 0) + 1,
  changeType: changeType || (existingConfig?.agentPrompt ? 'manual_update' : 'initial_version'),
  isCurrent: true,
});
```

---

## 📊 Flujo de Versionado Corregido

### Caso 1: Primer Prompt (Inicial)

```
Estado inicial:
  agent_configs: { agentPrompt: undefined }
  agent_prompt_versions: []

Usuario aplica prompt mejorado con IA:
  ↓
Backend:
  1. existingConfig?.agentPrompt = undefined
  2. Salta el guardado de "versión anterior" (no existe)
  3. ✅ SIEMPRE guarda nueva versión:
     {
       prompt: "Eres SALFAGPT, un asistente virtual...",
       versionNumber: 1,
       changeType: 'ai_enhanced',
       isCurrent: true
     }

Resultado:
  agent_configs: { 
    agentPrompt: "Eres SALFAGPT...",
    promptVersion: 1 
  }
  agent_prompt_versions: [
    { versionNumber: 1, changeType: 'ai_enhanced' }  ✅
  ]
```

### Caso 2: Actualización de Prompt Existente

```
Estado actual:
  agent_configs: { 
    agentPrompt: "Eres SALFAGPT...",
    promptVersion: 1 
  }
  agent_prompt_versions: [
    { versionNumber: 1, changeType: 'ai_enhanced' }
  ]

Usuario edita manualmente y guarda:
  ↓
Backend:
  1. existingConfig.agentPrompt = "Eres SALFAGPT..."
  2. ✅ Guarda versión anterior:
     {
       prompt: "Eres SALFAGPT...",
       versionNumber: 1,
       changeType: 'manual_update',
       previousVersion: true
     }
  3. ✅ Guarda nueva versión:
     {
       prompt: "Eres SALFAGPT (editado)...",
       versionNumber: 2,
       changeType: 'manual_update',
       isCurrent: true
     }

Resultado:
  agent_configs: { 
    agentPrompt: "Eres SALFAGPT (editado)...",
    promptVersion: 2 
  }
  agent_prompt_versions: [
    { versionNumber: 2, changeType: 'manual_update', isCurrent: true },  ✅
    { versionNumber: 1, changeType: 'manual_update', previousVersion: true },  ✅
    { versionNumber: 1, changeType: 'ai_enhanced' }  ✅ (inicial)
  ]
```

---

## 🎯 Tipos de Cambio (changeType)

### Ahora Soportados:

1. **`initial_version`** 🎯
   - Primera vez que se guarda un prompt
   - Versión 1
   - Base para comparaciones futuras

2. **`ai_enhanced`** ✨
   - Prompt mejorado con IA
   - Generado desde documento de especificaciones
   - Badge morado en UI

3. **`manual_update`** ✏️
   - Edición manual del usuario
   - Cualquier cambio directo en textarea
   - Badge azul en UI

4. **`before_revert`** ↩️
   - Se guarda antes de revertir a versión anterior
   - Permite des-revertir si fue error
   - Badge amarillo en UI

---

## 🔧 Cambios en Código

### `/src/pages/api/conversations/[id]/prompt.ts`

**Añadido parámetro `changeType`:**
```typescript
const { agentPrompt, userId, model, changeType } = body;
```

**Lógica de doble guardado:**
```typescript
// 1. Guardar anterior si existe
if (existingConfig?.agentPrompt && different) {
  await saveVersion(existingConfig.agentPrompt, 'previousVersion');
}

// 2. SIEMPRE guardar nueva (incluso si es la primera)
await saveVersion(agentPrompt, 'isCurrent');
```

### `/src/components/ChatInterfaceWorking.tsx`

**Parámetro opcional en handleSaveAgentPrompt:**
```typescript
const handleSaveAgentPrompt = async (
  agentPrompt: string, 
  changeType?: string  // ✅ Nuevo parámetro
) => {
  // ...
  body: JSON.stringify({
    agentPrompt,
    userId,
    model,
    changeType: changeType || 'manual_update',  // ✅ Pasa tipo
  })
}
```

**Llamada con tipo específico:**
```typescript
await handleSaveAgentPrompt(enhancedPrompt, 'ai_enhanced');
```

### `/src/components/PromptVersionHistory.tsx`

**Etiqueta para versión inicial:**
```typescript
case 'initial_version': return '🎯 Versión inicial';
```

---

## 📚 Estructura de Versiones en Firestore

### Después de Primera Mejora con IA:

```javascript
// agent_configs/cjn3bC0HrUYtHqu69CKS
{
  agentPrompt: "Eres SALFAGPT, un asistente virtual...",
  promptVersion: 1,
  lastPromptUpdate: Timestamp(2025-10-31 00:50:00),
  model: "gemini-2.5-flash"
}

// agent_prompt_versions collection
[
  {
    id: "version_abc123",
    agentId: "cjn3bC0HrUYtHqu69CKS",
    userId: "114671162830729001607",
    prompt: "Eres SALFAGPT, un asistente virtual...",
    model: "gemini-2.5-flash",
    createdAt: Timestamp(2025-10-31 00:50:00),
    versionNumber: 1,
    changeType: "ai_enhanced",  // ✅ Marcado como mejorado con IA
    isCurrent: true
  }
]
```

### Después de Edición Manual:

```javascript
// agent_configs/cjn3bC0HrUYtHqu69CKS
{
  agentPrompt: "Eres SALFAGPT (editado)...",
  promptVersion: 2,
  lastPromptUpdate: Timestamp(2025-10-31 00:52:00),
  model: "gemini-2.5-flash"
}

// agent_prompt_versions collection
[
  {
    id: "version_xyz789",
    agentId: "cjn3bC0HrUYtHqu69CKS",
    userId: "114671162830729001607",
    prompt: "Eres SALFAGPT (editado)...",
    model: "gemini-2.5-flash",
    createdAt: Timestamp(2025-10-31 00:52:00),
    versionNumber: 2,
    changeType: "manual_update",  // ✅ Edición manual
    isCurrent: true
  },
  {
    id: "version_def456",
    agentId: "cjn3bC0HrUYtHqu69CKS",
    userId: "114671162830729001607",
    prompt: "Eres SALFAGPT, un asistente virtual...",
    model: "gemini-2.5-flash",
    createdAt: Timestamp(2025-10-31 00:52:00),
    versionNumber: 1,
    changeType: "manual_update",  // Guardada antes de actualizar
    previousVersion: true
  },
  {
    id: "version_abc123",
    agentId: "cjn3bC0HrUYtHqu69CKS",
    userId: "114671162830729001607",
    prompt: "Eres SALFAGPT, un asistente virtual...",
    model: "gemini-2.5-flash",
    createdAt: Timestamp(2025-10-31 00:50:00),
    versionNumber: 1,
    changeType: "ai_enhanced",  // Original con IA
    isCurrent: false  // Ya no es actual
  }
]
```

---

## ✅ Testing

### Ahora al Probar:

1. **Primera vez aplicando prompt mejorado:**
   ```
   ☑ Aplicar prompt mejorado
   ☑ Click "Ver Historial"
   ☑ Debe mostrar: "Versión 1 - ✨ Mejorado con IA"
   ```

2. **Editar manualmente:**
   ```
   ☑ Editar prompt
   ☑ Guardar
   ☑ Click "Ver Historial"
   ☑ Debe mostrar:
     - Versión Actual (v2)
     - v1 - ✨ Mejorado con IA
   ```

3. **Revertir:**
   ```
   ☑ Revertir a v1
   ☑ Click "Ver Historial"
   ☑ Debe mostrar:
     - Versión Actual (v3)
     - v2 - ↩️ Antes de revertir
     - v1 - ✨ Mejorado con IA
   ```

---

## 🔍 Logs para Debugging

**Cuando se guarda primera vez:**
```
📚 [VERSIONING] Saving new prompt as version in history
✅ [VERSIONING] New version saved as v1
```

**Cuando se actualiza:**
```
📚 [VERSIONING] Saving current prompt to history
✅ [VERSIONING] Previous version saved as v1
📚 [VERSIONING] Saving new prompt as version in history  
✅ [VERSIONING] New version saved as v2
```

**Cuando se carga historial:**
```
📚 [VERSIONING] Loading prompt versions for agent: cjn3bC0HrUYtHqu69CKS
📚 [VERSIONING] Found X versions
```

---

## 📋 Checklist de Verificación

- [x] Siempre guarda nueva versión (incluso primera)
- [x] Marca tipo de cambio correctamente (ai_enhanced, manual_update, etc.)
- [x] Guarda versión anterior antes de actualizar
- [x] Version numbers incrementan correctamente
- [x] UI muestra emojis correctos por tipo
- [x] Logs informativos para debugging
- [ ] **Testing manual requerido**

---

## 🚀 Próximo Paso

**Prueba ahora:**

1. Aplica el prompt mejorado con IA
2. Espera a que se complete (100%)
3. Click "Aplicar Prompt Mejorado"
4. Modal se cierra y reabre mostrando nuevo prompt
5. Click "Ver Historial" (botón azul)
6. **Ahora SÍ debería mostrar:** 
   - Versión Actual
   - v1 - ✨ Mejorado con IA

Si no aparece, revisa la consola del navegador para ver los logs de `[VERSIONING]`.

---

**Fecha:** 2025-10-31  
**Fix:** Versionado ahora guarda TODAS las versiones, incluyendo la primera  
**Status:** ✅ Listo para testing







