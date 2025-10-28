# 🎯 Plan de 4 Pasos - Resolver Issues de Sebastian

**Creado:** 2025-10-28 23:45  
**Objetivo:** Resolver TODOS los issues reportados por Sebastian  
**Tiempo Total Estimado:** 1h 20 mins

---

## ✅ PASO 1: Sync BigQuery - COMPLETADO

**Status:** ✅ DONE  
**Tiempo:** 20 mins  
**Resultado:** 6,745 chunks sincronizados exitosamente

**Logros:**
- ✅ Script `sync-firestore-to-bigquery.mjs` creado
- ✅ 6,745 chunks insertados en BigQuery
- ✅ S001 ahora puede buscar en BigQuery
- ✅ PP-009 encontrado correctamente
- ✅ Referencias aparecen (3 badges)

**Issues Resueltos:**
- ✅ FB-005 (S001 solo menciona) → Ahora usa contenido real

**Issues Mejorados:**
- 🟡 FB-001 (S001 sin referencias) → Ahora tiene 3 referencias (pero deberían ser más)

---

## 🔧 PASO 2: Fix Referencias Phantom (FB-002)

**Status:** 🔴 EN CURSO  
**Tiempo Estimado:** 30 mins  
**Prioridad:** CRÍTICA (afecta S001 + M001)

### **Problema:**
- AI menciona [1]-[10] en texto
- Solo 3-8 aparecen como badges clickeables
- Discrepancia entre fragmentos enviados vs referencias procesadas

### **Causa Raíz:**
```javascript
// En messages-stream.ts
// fragmentMapping tiene 10 items
// Pero references solo tiene 3-8 items

// El AI usa TODOS los fragmentos en texto
// Pero solo algunos se guardan como referencias
```

### **Solución:**

**Opción A - Filtrar menciones inválidas (Post-procesamiento):**
```typescript
// En src/pages/api/conversations/[id]/messages-stream.ts

// Después de generar respuesta
const validReferenceNumbers = references.map((_, i) => i + 1);
// validReferenceNumbers = [1, 2, 3] si hay 3 referencias

// Limpiar texto de menciones inválidas
let cleanedText = fullText;

// Regex para encontrar [número]
const citationRegex = /\[(\d+)\]/g;
cleanedText = cleanedText.replace(citationRegex, (match, num) => {
  const number = parseInt(num);
  // Si el número está en referencias válidas, mantener
  if (validReferenceNumbers.includes(number)) {
    return match; // Mantener [1], [2], [3]
  }
  // Si no, eliminar
  return ''; // Eliminar [4], [5], ..., [10]
});

// Limpiar espacios dobles resultantes
cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
```

**Opción B - Prompt más estricto:**
```typescript
// En src/lib/gemini.ts - buildRAGContext()

const validNumbers = chunks.map((_, i) => i + 1).join(', ');

systemPrompt += `

CRÍTICO - NUMERACIÓN DE REFERENCIAS:
- Tienes exactamente ${chunks.length} fragmentos numerados del 1 al ${chunks.length}
- SOLO usa números ${validNumbers} en tus referencias
- NO uses números fuera de ese rango
- NO agregues fragmentos adicionales en la sección "Referencias"
- La lista de referencias DEBE tener exactamente ${chunks.length} items

Formato OBLIGATORIO para referencias:
[1] Fragmento de [nombre documento] (similitud: XX%)
[2] Fragmento de [nombre documento] (similitud: XX%)
...
[${chunks.length}] Fragmento de [nombre documento] (similitud: XX%)

NO agregues [${chunks.length + 1}], [${chunks.length + 2}], etc.
`;
```

**Decisión:** Implementar **AMBAS** para máxima robustez
- Opción B previene el problema (prompt)
- Opción A limpia cualquier caso que escape (post-process)

### **Archivos a Modificar:**
1. `src/pages/api/conversations/[id]/messages-stream.ts` (post-process)
2. `src/lib/gemini.ts` (prompt reforzado)

### **Testing:**
- S001: "¿Cómo genero informe petróleo?" → Solo [1]-[3]
- M001: "¿Qué es OGUC?" → Solo [1]-[8] (sin [9][10])

---

## 🔍 PASO 3: Verificar Calidad de Fragmentos

**Status:** ⏳ PENDING  
**Tiempo Estimado:** 10 mins  
**Prioridad:** ALTA

### **Objetivo:**
Confirmar que fragmentos NO son basura (FB-003)

### **Método:**

**Testing Manual:**
```
M001: "¿Qué es un OGUC?"

Para cada badge [1] a [8]:
1. Click en badge
2. Verificar contenido NO es:
   ❌ "1. INTRODUCCIÓN ............."
   ❌ "Página X de Y"
   ❌ Solo puntos y espacios
3. Contar útiles vs basura

Meta: ≥7 de 8 útiles (88%)
```

**Automatización (si hay tiempo):**
```javascript
// Script: scripts/validate-chunk-quality.mjs
// Lee chunks de BigQuery
// Aplica filterGarbageChunks()
// Cuenta % útiles vs basura
```

### **Criterio PASS:**
- ✅ ≥80% fragmentos útiles
- ✅ Sin headers genéricos ("INTRODUCCIÓN")
- ✅ Sin footers de página ("Página X de Y")
- ✅ Contenido sustantivo presente

---

## ✅ PASO 4: Testing Final & Decisión

**Status:** ⏳ PENDING  
**Tiempo Estimado:** 20 mins  
**Prioridad:** CRÍTICA

### **4.1 Testing de Validación (10 mins)**

**Test 1 - S001:**
```
Pregunta: "¿Cómo genero el informe de consumo de petróleo?"

Verificar:
✅ Muestra badges [1][2][3]
✅ NO menciona [4][5]...[10] sin badges
✅ Encuentra PP-009
✅ Da pasos concretos del procedimiento
✅ Referencias son clickeables
✅ Panel de detalles abre correctamente

Criterio PASS: Todos ✅
```

**Test 2 - M001:**
```
Pregunta: "¿Qué es un OGUC?"

Verificar:
✅ Muestra badges [1] a [N]
✅ NO menciona números sin badges
✅ ≥80% fragmentos útiles
✅ NO aparece "INTRODUCCIÓN..." ni "Página X de Y"

Criterio PASS: Todos ✅
```

### **4.2 Evaluación Masiva (si tests pasan) (10 mins)**

**Solo si PASO 4.1 pasa completamente:**

```bash
# Script: scripts/quick-spot-check.mjs
# Evaluar 10 preguntas aleatorias (5 S001 + 5 M001)
# Verificar patrón general de calidad
```

**Criterio PASS:**
- ✅ ≥8/10 preguntas con referencias correctas
- ✅ ≥8/10 preguntas con fragmentos útiles
- ✅ 0 alucinaciones de referencias

### **4.3 Decisión Final (inmediata)**

**Si PASO 4.2 pasa:**
→ ✅ APROBADO para Sebastian
→ Cerrar tickets FB-001, FB-002, FB-003, FB-005
→ Notificar Sebastian para testing final

**Si PASO 4.2 falla:**
→ ❌ Más debugging necesario
→ Identificar nuevos issues
→ Crear tickets adicionales

---

## 📋 Checklist de Ejecución

### **PASO 2 (Ahora):**
- [ ] Implementar post-procesamiento (Opción A)
- [ ] Reforzar prompts (Opción B)
- [ ] Commit: "fix: Eliminar referencias phantom [9][10] (FB-002)"
- [ ] Test S001 + M001

### **PASO 3 (Después de PASO 2):**
- [ ] Click en 8 badges de M001
- [ ] Verificar calidad de contenido
- [ ] Documentar % útiles
- [ ] Screenshot evidencia

### **PASO 4 (Final):**
- [ ] Re-test S001 completo
- [ ] Re-test M001 completo
- [ ] Quick spot-check 10 preguntas
- [ ] Decisión GO/NO-GO
- [ ] Actualizar tickets en roadmap
- [ ] Commit: "docs: Completar testing Sebastian"

---

## 🎯 Resultado Esperado

### **Post PASO 2:**
- S001: ✅ Referencias correctas [1][2][3] (sin [4]-[10])
- M001: ✅ Referencias correctas [1]-[8] (sin [9][10])

### **Post PASO 3:**
- M001: ✅ ≥7/8 fragmentos útiles (88%)
- S001: ✅ ≥2/3 fragmentos útiles (67%)

### **Post PASO 4:**
- ✅ Todos los issues de Sebastian resueltos
- ✅ Calidad ≥80% en spot-check
- ✅ Listo para evaluación masiva 87 preguntas (si necesario)

---

## 📊 KPIs de Éxito

| Métrica | Target | Post-Sync | Post-PASO 2 | Post-PASO 4 |
|---|---|---|---|---|
| S001 con referencias | Sí | 🟡 3 badges | ✅ Correcto | ✅ Verificado |
| M001 sin phantom refs | Sí | ❌ [9][10] | ✅ Solo [1-8] | ✅ Verificado |
| Fragmentos útiles | ≥80% | ? | ? | ✅ ≥80% |
| Sebastian aprueba | Sí | ⏳ | ⏳ | ✅ |

---

## 🚀 INICIAR PASO 2 AHORA

**Próxima acción:**
1. Modificar `messages-stream.ts` (post-process)
2. Modificar `gemini.ts` (prompt)
3. Test inmediato
4. Continuar con PASO 3

**Tiempo total restante:** ~1 hora

---

**PASO 1: ✅ DONE (20 mins)**  
**PASO 2: 🔴 NOW (30 mins)**  
**PASO 3: ⏳ NEXT (10 mins)**  
**PASO 4: ⏳ FINAL (20 mins)**

