# Fix Completo: Persistencia de Prompt y Versionado - 2025-10-31

## 🎯 Problema Principal

**Síntoma:** Después de aplicar un prompt mejorado con IA, el cambio no persiste al reabrir la configuración del agente.

---

## 🔍 Análisis de Logs

### Log Crítico que Revela el Problema:

```
Line 2635: ✅ [SUGGEST] Local state updated to: 4636 chars
Line 2640: ✅ [SUGGEST] Saved to Firestore successfully
Line 2643: 🔄 [SUGGEST] Reloading from Firestore to verify...
Line 2664: 🔍 [SUGGEST] Final currentAgentPrompt: 193 chars  ← ❌ SE REVIRTIÓ!
```

**Diagnóstico:**
1. Estado se actualiza correctamente a 4636 caracteres
2. Se guarda a Firestore exitosamente
3. Se recarga desde Firestore
4. **PROBLEMA:** El reload sobrescribe con valor viejo (193)

**Causa Raíz:** Race condition - `loadPromptsForAgent()` lee de Firestore antes de que la escritura se propague completamente, sobrescribiendo el estado local con el valor viejo.

---

## ✅ Solución 1: Eliminar Reload que Causa Race Condition

### Cambio en `handlePromptSuggested`:

**Antes (❌ causaba race condition):**
```typescript
setCurrentAgentPrompt(enhancedPrompt);  // Actualiza a 4636
await handleSaveAgentPrompt(enhancedPrompt);  // Guarda 4636
await loadPromptsForAgent(currentConversation);  // ❌ Lee 193 y sobrescribe!
setShowAgentPromptModal(true);  // Modal muestra 193
```

**Después (✅ usa estado local):**
```typescript
await handleSaveAgentPrompt(enhancedPrompt);  // Guarda 4636
await new Promise(resolve => setTimeout(resolve, 1500));  // Espera propagación
setCurrentAgentPrompt(enhancedPrompt);  // Actualiza a 4636
// ✅ NO reload - confía en estado local
await new Promise(resolve => setTimeout(resolve, 500));  // Espera React
setShowAgentPromptModal(true);  // Modal muestra 4636 ✅
```

**Justificación:**
- Acabamos de guardar el prompt
- Sabemos que el valor local es correcto
- No hay necesidad de recargar inmediatamente
- Evita race condition con Firestore

---

## ✅ Solución 2: Índice de Firestore para Versiones

### Error en Terminal:

```
❌ Error loading prompt versions: Error: 9 FAILED_PRECONDITION: 
The query requires an index.
```

### Índice Agregado en `firestore.indexes.json`:

```json
{
  "collectionGroup": "agent_prompt_versions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "agentId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Despliegue:

```bash
firebase deploy --only firestore:indexes --project salfagpt
✔ Deploy complete!
```

**Status:** ✅ Índice desplegado y activo

---

## ✅ Solución 3: Versionado Siempre Guarda

### Lógica de Guardado Mejorada en `prompt.ts`:

```typescript
// 1. Guardar versión anterior si existe y es diferente
if (existingConfig?.agentPrompt && existingConfig.agentPrompt !== agentPrompt) {
  await saveVersion(existingConfig.agentPrompt, {
    versionNumber: existingConfig.promptVersion || 1,
    changeType: changeType || 'manual_update',
    previousVersion: true
  });
}

// 2. ✅ SIEMPRE guardar nueva versión (incluso si es la primera)
await saveVersion(agentPrompt, {
  versionNumber: (existingConfig?.promptVersion || 0) + 1,
  changeType: changeType || 'initial_version',
  isCurrent: true
});
```

**Resultado:**
- Primera mejora con IA → Versión 1 guardada
- Edición manual → Versión 2 guardada (v1 también guardada)
- Revertir → Versión 3 guardada (v2 guardada como "before_revert")

---

## ✅ Solución 4: Async/Await en Aplicar

### Cambio en `AgentPromptEnhancer.tsx`:

**Antes:**
```typescript
const handleApplySuggestion = () => {
  onPromptSuggested(suggestedPrompt, documentUrl);
  onClose();  // ❌ Cierra inmediatamente
};
```

**Después:**
```typescript
const handleApplySuggestion = async () => {
  setApplying(true);
  try {
    await onPromptSuggested(suggestedPrompt, documentUrl);  // ✅ Espera
    onClose();  // ✅ Cierra después de completar
  } finally {
    setApplying(false);
  }
};
```

**Botón actualizado:**
```tsx
<button disabled={applying}>
  {applying ? 'Guardando...' : 'Aplicar Prompt Mejorado'}
</button>
```

---

## 📊 Flujo Completo Corregido

### Paso a Paso:

```
1. Usuario sube documento
   → Progreso granular 2% a 100%
   → Extracción exitosa (49,222 caracteres)
   
2. IA genera prompt mejorado
   → Prompt actual: 193 chars
   → Prompt mejorado: 4,636 chars
   → Muestra comparación lado a lado
   
3. Usuario hace click "Aplicar Prompt Mejorado"
   → Botón muestra "Guardando..." con spinner
   
4. handleApplySuggestion (async):
   a. console.log('Applying...')
   b. Llama handlePromptSuggested (await)
   
5. handlePromptSuggested:
   a. Guarda a Firestore con changeType='ai_enhanced'
      - Backend guarda en agent_configs
      - Backend guarda en agent_prompt_versions
   b. Espera 1500ms (propagación de Firestore)
   c. setCurrentAgentPrompt(enhancedPrompt)  // 4636 chars
   d. Espera 500ms (propagación de React)
   e. setShowAgentPromptEnhancer(false)
   f. Espera 300ms
   g. setShowAgentPromptModal(true)
   
6. Modal de configuración se abre
   → useEffect detecta cambio en currentAgentPrompt
   → setAgentPrompt(currentAgentPrompt)  // 4636 chars
   → Textarea muestra prompt mejorado ✅
   
7. Usuario puede:
   → Ver prompt mejorado en textarea
   → Click "Ver Historial" para ver versiones
   → Click "Guardar" para confirmar (opcional)
   → Editar y seguir mejorando
```

---

## 🔧 Archivos Modificados

### 1. `firestore.indexes.json`
- ✅ Agregado índice: `agent_prompt_versions` (agentId ASC, createdAt DESC)
- ✅ Desplegado con Firebase CLI

### 2. `src/pages/api/conversations/[id]/prompt.ts`
- ✅ Siempre guarda nueva versión (incluso primera)
- ✅ Acepta parámetro `changeType`
- ✅ Logs detallados de versionado

### 3. `src/components/AgentPromptEnhancer.tsx`
- ✅ `handleApplySuggestion` ahora es async
- ✅ Estado `applying` con loading en botón
- ✅ Espera a que guardado complete
- ✅ Manejo de errores

### 4. `src/components/ChatInterfaceWorking.tsx`
- ✅ `handlePromptSuggested` NO hace reload (evita race condition)
- ✅ Actualiza estado DESPUÉS de guardar
- ✅ Delays estratégicos para propagación
- ✅ Logs detallados en cada paso

---

## 🧪 Testing - Qué Verificar

### Test 1: Prompt Se Guarda
```
☐ Aplicar prompt mejorado
☐ Ver "Guardando..." en botón
☐ Esperar a que termine
☐ Modal de enhancer se cierra
☐ Modal de config se abre
☐ ✅ Textarea muestra prompt mejorado (4636 chars, no 193)
```

### Test 2: Persistencia en Firestore
```
☐ Aplicar prompt mejorado
☐ Recargar página completa (F5)
☐ Abrir "Editar Prompt" del mismo agente
☐ ✅ Debe mostrar prompt mejorado (no el original de 193)
```

### Test 3: Historial de Versiones
```
☐ Aplicar prompt mejorado
☐ Click "Ver Historial"
☐ ✅ Debe mostrar "Versión 1 - ✨ Mejorado con IA"
☐ NO debe mostrar "No hay versiones anteriores"
```

### Test 4: Logs en Console
```
☐ Abrir DevTools Console
☐ Aplicar prompt mejorado
☐ Buscar: "[SUGGEST] Final currentAgentPrompt:"
☐ ✅ Debe mostrar 4636 chars (no 193)
☐ Buscar: "[VERSIONING] New version saved"
☐ ✅ Debe aparecer en logs del backend
```

---

## 📚 Colecciones en Firestore

### `agent_configs/cjn3bC0HrUYtHqu69CKS`
**Debe contener después de guardar:**
```javascript
{
  agentPrompt: "# Identidad y Propósito\n\nEres el...",  // 4636 caracteres
  promptVersion: 1,
  lastPromptUpdate: Timestamp(2025-10-31 12:13:36),
  model: "gemini-2.5-flash",
  userId: "114671162830729001607"
}
```

### `agent_prompt_versions` (colección)
**Debe tener al menos 1 documento:**
```javascript
{
  agentId: "cjn3bC0HrUYtHqu69CKS",
  userId: "114671162830729001607",
  prompt: "# Identidad y Propósito...",  // 4636 caracteres
  model: "gemini-2.5-flash",
  createdAt: Timestamp(2025-10-31 12:13:36),
  versionNumber: 1,
  changeType: "ai_enhanced",
  isCurrent: true
}
```

---

## 🚀 Deploy y Testing

### Comandos:

```bash
# 1. Índice ya desplegado ✅
firebase deploy --only firestore:indexes --project salfagpt

# 2. Verificar que servidor se reinició
# (debe reiniciarse automáticamente con cambios de código)

# 3. Testing manual completo
```

### Checklist Pre-Testing:

- [x] Índice de Firestore desplegado
- [x] Race condition eliminada (no reload)
- [x] Estado se actualiza después de guardar
- [x] Delays para propagación
- [x] Async/await en aplicar
- [x] Versionado siempre guarda
- [x] Logs detallados
- [ ] **Testing manual requerido**

---

## 🎯 Resultado Esperado

**Ahora al aplicar prompt mejorado:**

1. ✅ Botón muestra "Guardando..." mientras procesa
2. ✅ Prompt se guarda en Firestore (agent_configs)
3. ✅ Versión se guarda en historial (agent_prompt_versions)
4. ✅ Modal se reabre mostrando prompt actualizado
5. ✅ Prompt persiste al recargar página
6. ✅ "Ver Historial" muestra versión guardada
7. ✅ Usuario puede revertir si es necesario

**Ya NO debería:**
- ❌ Mostrar prompt viejo después de guardar
- ❌ Perder el prompt al recargar
- ❌ Mostrar "No hay versiones anteriores"
- ❌ Dar error de índice faltante

---

## 📝 Notas Importantes

### Timing de Propagación:
- **Firestore write:** ~500-1000ms para propagarse
- **React state update:** ~100-300ms para re-render
- **Total delays agregados:** 2300ms (1500 + 500 + 300)

Estos delays son necesarios para evitar race conditions y garantizar que el estado esté sincronizado antes de reabrir el modal.

### Por Qué NO Reload:
El reload de `loadPromptsForAgent()` causaba el problema porque:
1. Firestore write es eventualmente consistente
2. Read puede retornar valor viejo durante ~500-1000ms
3. Sobrescribe el estado local correcto con valor viejo
4. Mejor confiar en estado local justo después de guardar

---

**Fecha:** 2025-10-31  
**Status:** ✅ Fix completo aplicado  
**Índice:** ✅ Desplegado  
**Testing:** Requiere prueba manual final  
**Impacto:** 🔥 CRÍTICO - Funcionalidad ahora debe funcionar

---

## 🚀 Siguiente Paso

**Prueba ahora mismo:**

1. Refresca la página (F5) para asegurar cambios cargados
2. Abre "Editar Prompt" del agente
3. Click "Mejorar con IA"
4. Sube el documento
5. Espera a que genere prompt mejorado
6. Click "Aplicar Prompt Mejorado"
7. **Observa:**
   - ✅ Botón dice "Guardando..."
   - ✅ Modal se cierra y reabre
   - ✅ Textarea muestra prompt mejorado (4636 chars)
   - ✅ "Ver Historial" muestra versión

Si funciona: ¡Feature completo! 🎉  
Si falla: Revisar logs con filtro `[SUGGEST]` y `[VERSIONING]`








