# Debug: Persistencia de Prompt Mejorado - 2025-10-31

## 🐛 Problema Reportado

**Síntomas:**
1. Prompt mejorado se genera y se ve en UI
2. Usuario hace click en "Aplicar Prompt Mejorado"
3. Al recargar configuración del agente: prompt NO está guardado
4. Historial de versiones: vacío

**Comportamiento esperado:**
- Prompt debe guardarse en Firestore
- Debe aparecer en modal de configuración
- Debe aparecer en historial de versiones

---

## 🔍 Investigación

### Puntos de Falla Potenciales:

1. **Frontend no espera a que termine el guardado**
   - Modal se cierra antes de completar
   - Estado se actualiza pero se pierde

2. **Backend no guarda correctamente**
   - Versión no se crea en Firestore
   - Prompt no se actualiza en agent_configs

3. **Estado local no se sincroniza**
   - setCurrentAgentPrompt() no propaga
   - Modal se reabre con valor viejo

4. **Race condition**
   - Modal se reabre antes de que estado se actualice
   - useEffect no se dispara correctamente

---

## ✅ Fixes Aplicados

### Fix 1: Versionado Siempre Guarda

**Antes:**
```typescript
// Solo guardaba si había prompt anterior diferente
if (existingConfig?.agentPrompt && different) {
  saveVersion();
}
```

**Después:**
```typescript
// Siempre guarda anterior si existe
if (existingConfig?.agentPrompt && different) {
  saveVersion(existingConfig.agentPrompt, 'previousVersion');
}

// ✅ SIEMPRE guarda nueva versión (incluso primera)
saveVersion(agentPrompt, {
  versionNumber: (existingConfig?.promptVersion || 0) + 1,
  changeType: changeType || 'initial_version',
  isCurrent: true
});
```

### Fix 2: Async Await en Aplicar

**Antes:**
```typescript
const handleApplySuggestion = () => {
  onPromptSuggested(suggestedPrompt, documentUrl);
  onClose(); // ❌ Cierra inmediatamente
};
```

**Después:**
```typescript
const handleApplySuggestion = async () => {
  setApplying(true);
  try {
    await onPromptSuggested(suggestedPrompt, documentUrl); // ✅ Espera
    onClose(); // ✅ Solo cierra después de guardar
  } finally {
    setApplying(false);
  }
};
```

### Fix 3: Estado Actualiza ANTES de Guardar

**Antes:**
```typescript
await handleSaveAgentPrompt(prompt);
setCurrentAgentPrompt(prompt); // Después del guardado
```

**Después:**
```typescript
setCurrentAgentPrompt(enhancedPrompt); // ✅ PRIMERO actualiza estado
await handleSaveAgentPrompt(enhancedPrompt, 'ai_enhanced'); // Luego guarda
```

### Fix 4: Delays para Propagación de Estado

```typescript
// Esperar a que Firestore termine
await new Promise(resolve => setTimeout(resolve, 1000));

// Cerrar modal
setShowAgentPromptEnhancer(false);

// Esperar antes de reabrir
await new Promise(resolve => setTimeout(resolve, 300));

// Reabrir con estado actualizado
setShowAgentPromptModal(true);
```

### Fix 5: Logs Detallados para Debugging

**Agregados logs en cada paso:**
```typescript
console.log('🔍 [SUGGEST] Current agent prompt BEFORE:', ...);
console.log('🔄 [SUGGEST] Updating local state FIRST...');
console.log('✅ [SUGGEST] Local state updated to:', ...);
console.log('💾 [SUGGEST] Saving to Firestore...');
console.log('✅ [SUGGEST] Saved successfully');
console.log('🔄 [SUGGEST] Reloading from Firestore...');
console.log('✅ [SUGGEST] Reloaded');
console.log('🔍 [SUGGEST] Final currentAgentPrompt:', ...);
```

---

## 🧪 Testing con Logs

### Flujo Completo a Verificar:

```
1. Usuario aplica prompt mejorado
   └─> Console: "✨ [SUGGEST] Enhanced prompt suggested: 5339 characters"
   
2. Estado se actualiza
   └─> Console: "🔄 [SUGGEST] Updating local state FIRST..."
   └─> Console: "✅ [SUGGEST] Local state updated to: 5339 chars"
   
3. Guardado en Firestore
   └─> Console: "💾 [SUGGEST] Saving to Firestore with ai_enhanced..."
   └─> Console: "💾 [FRONTEND] Guardando agent prompt..."
   └─> Console: "🔍 [BACKEND] PUT /api/conversations/:id/prompt"
   └─> Console: "📚 [VERSIONING] Saving new prompt as version in history"
   └─> Console: "✅ [VERSIONING] New version saved as v1"
   └─> Console: "✅ [BACKEND] Agent prompt updated"
   └─> Console: "✅ [FRONTEND] Agent prompt saved"
   └─> Console: "✅ [SUGGEST] Saved to Firestore successfully"
   
4. Recarga desde Firestore
   └─> Console: "🔄 [SUGGEST] Reloading from Firestore to verify..."
   └─> Console: "📥 [LOAD PROMPTS] Loading prompts for conversation..."
   └─> Console: "📥 [LOAD PROMPTS] Prompt data received: { agentPrompt: '...' }"
   └─> Console: "✅ [SUGGEST] Reloaded - prompt should be: 5339 chars"
   
5. Modal se reabre
   └─> Console: "🔄 [SUGGEST] Closing enhancer modal..."
   └─> Console: "🔄 [SUGGEST] Reopening config modal..."
   └─> Console: "✅ [SUGGEST] Enhanced prompt applied and modal reopened"
   
6. Verificar estado final
   └─> Console: "🔍 [SUGGEST] Final currentAgentPrompt: 5339 chars"
```

### Si Algo Falla:

**Buscar en consola:**
- ❌ Si no ves "✅ [VERSIONING] New version saved" → Backend no guardó versión
- ❌ Si no ves "✅ [BACKEND] Agent prompt updated" → Firestore no actualizó config
- ❌ Si no ves "📥 [LOAD PROMPTS] Prompt data received" → Recarga falló
- ❌ Si ves "Final currentAgentPrompt: 0 chars" → Estado se perdió

---

## 📊 Datos a Verificar en Firestore Console

Después de aplicar prompt mejorado, verificar en Firestore:

### Collection: `agent_configs`
```
Document ID: cjn3bC0HrUYtHqu69CKS

Should contain:
{
  agentPrompt: "Eres SALFAGPT, un asistente virtual experto en la normativa de urbanización de Chile...",
  promptVersion: 1,
  lastPromptUpdate: (Timestamp),
  model: "gemini-2.5-flash",
  userId: "114671162830729001607"
}
```

**Verificar:**
- [ ] Campo `agentPrompt` existe y tiene >5000 caracteres
- [ ] Campo `promptVersion` = 1
- [ ] Campo `lastPromptUpdate` es reciente

### Collection: `agent_prompt_versions`
```
Query: agentId == "cjn3bC0HrUYtHqu69CKS"
Order by: createdAt DESC

Should contain at least 1 document:
{
  agentId: "cjn3bC0HrUYtHqu69CKS",
  userId: "114671162830729001607",
  prompt: "Eres SALFAGPT...",
  model: "gemini-2.5-flash",
  createdAt: (Timestamp),
  versionNumber: 1,
  changeType: "ai_enhanced",
  isCurrent: true
}
```

**Verificar:**
- [ ] Al menos 1 documento en `agent_prompt_versions`
- [ ] `agentId` correcto
- [ ] `prompt` tiene contenido completo
- [ ] `changeType` = "ai_enhanced"

---

## 🔧 Comandos para Debugging

### Verificar en Firestore con CLI:

```bash
# Ver config del agente
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const config = await firestore.collection('agent_configs').doc('cjn3bC0HrUYtHqu69CKS').get();
console.log('Config:', config.data());
process.exit(0);
"

# Ver versiones del agente
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const versions = await firestore
  .collection('agent_prompt_versions')
  .where('agentId', '==', 'cjn3bC0HrUYtHqu69CKS')
  .orderBy('createdAt', 'desc')
  .get();
console.log('Versions:', versions.size);
versions.docs.forEach(doc => console.log('  -', doc.data().versionNumber, doc.data().changeType));
process.exit(0);
"
```

---

## ✅ Checklist de Fixes

- [x] Async/await en handleApplySuggestion
- [x] Loading state mientras guarda
- [x] Estado se actualiza ANTES de guardar
- [x] Delays para propagación de estado
- [x] Siempre guarda versión (incluso primera)
- [x] Tipo de cambio correcto (ai_enhanced)
- [x] Logs detallados en cada paso
- [x] Modal se reabre después de guardar
- [ ] **Testing manual con logs**

---

## 🚀 Próximo Paso

**Prueba el flujo completo con la consola abierta:**

1. Abre DevTools Console (F12)
2. Filtra por `[SUGGEST]` o `[VERSIONING]`
3. Aplica prompt mejorado
4. Observa TODOS los logs paso a paso
5. Si algo falla, copia el log exacto donde falla
6. Verificar en Firestore Console si los datos llegaron

Con estos logs detallados podremos identificar exactamente dónde está fallando la persistencia.

---

**Status:** ✅ Fixes aplicados - Requiere testing con logs  
**Prioridad:** 🔥 CRÍTICA - Sin esto el feature no funciona  
**Siguiente:** Testing manual con consola abierta














