# 🧪 Test Configuration Persistence - Ahora

**Action:** Upload PDF y revisar logs detallados  
**Date:** 2025-10-16

---

## 🎯 Qué Hacer

### 1. Refresh la Página
```
F5 o Cmd+R para cargar el código nuevo con logs
```

### 2. Limpiar Console
```
Click en 🚫 icon en Console para limpiar
```

### 3. Subir PDF de Nuevo
```
1. Seleccionar agente (Asistente Legal Territorial RDI)
2. Header → "Configurar Agente"
3. Upload el mismo PDF
4. Esperar a que procese
```

---

## 🔍 Logs Críticos a Buscar

### Durante Upload (Backend):

**Busca estos logs en Console:**
```
✅ Configuration extracted successfully
Agent name: Asistente Legal...

🔍 [DEBUG] extractedConfig keys: [...]
🔍 [DEBUG] expectedInputExamples: [...]     ← CRÍTICO
🔍 [DEBUG] expectedInputExamples length: X   ← CRÍTICO
🔍 [DEBUG] expectedOutputExamples: [...]
🔍 [DEBUG] Full config: {...}

💾 [SAVE] Starting Firestore save...
💾 [SAVE] Mapped inputExamples: [...]        ← CRÍTICO
💾 [SAVE] inputExamples count: X             ← CRÍTICO
💾 [SAVE] Final setupDocData.inputExamples: [...]
💾 [SAVE] Final setupDocData.inputExamples.length: X
```

---

## ❓ Diagnóstico

### Si ves:
```
🔍 [DEBUG] expectedInputExamples: []
🔍 [DEBUG] expectedInputExamples length: 0
💾 [SAVE] inputExamples count: 0
```

**Problema:** `extractedConfig` no tiene `expectedInputExamples` populated

**Posibles causas:**
1. Gemini no extrajo ejemplos del PDF
2. Campo tiene nombre diferente en el JSON extraído
3. Estructura del JSON es diferente

---

### Si ves:
```
🔍 [DEBUG] expectedInputExamples: [{...}, {...}, ...]
🔍 [DEBUG] expectedInputExamples length: 10
💾 [SAVE] inputExamples count: 0
```

**Problema:** Mapeo está fallando (ex.question, ex.example, ex.input todos undefined)

**Solución:** Necesitamos ver la estructura exacta del objeto

---

## 📋 Por Favor Comparte

**Después de subir, copia y pega estos logs:**

1. **Los logs que empiezan con `🔍 [DEBUG]`**
   - Especialmente `expectedInputExamples`
   - Y `Full config`

2. **Los logs que empiezan con `💾 [SAVE]`**
   - Especialmente `Mapped inputExamples`
   - Y `inputExamples count`

3. **El JSON completo de `extractedConfig`:**
```javascript
// En Console, después de upload, corre:
copy(JSON.stringify(extractedConfig, null, 2))
// Luego pega aquí
```

---

## 💡 Solución Probable

**Si `expectedInputExamples` está vacío:**

Probablemente los ejemplos están en un campo diferente. Posibles nombres:
- `inputExamples` (directo)
- `testCases`
- `exampleInputs`
- `inputExamplesList`

**Necesitamos ver el JSON completo para saber el nombre correcto del campo.**

---

## 🚀 Próximo Paso

1. **Upload PDF** con Console limpio
2. **Copia TODOS los logs** que aparecen
3. **Compártelos** aquí
4. **Arreglaré el mapeo** basado en la estructura real

---

**Con los logs sabremos exactamente cómo mapear los datos!** 🔍

