# 📊 Informe de Validación Post Re-indexing

**Fecha:** 2025-10-28  
**Re-indexing:** ✅ Completado (614 docs, 1,896 chunks basura eliminados)  
**Tests Ejecutados:** 2 preguntas clave  
**Resultado:** ⚠️ MEJORA PARCIAL - Requiere ajustes adicionales

---

## 🧪 Test 1: M001 - "¿Qué es un OGUC?"

### **Respuesta Obtenida:**

```
"La sigla OGUC se refiere a la Ordenanza General de Urbanismo y 
Construcciones[0]."
```

### **Referencias:**

**Total mostradas:** 8 badges clickeables

**Referencias en texto:**
- Usa: `[0]`
- Menciona también: `[9]`, `[10]` en sección de referencias

**Badges mostrados:**
- [5] 75% - DDU-493-
- [1] 76% - DDU-493-.pdf
- [7] 74% - INDICE-HASTA-LA-DDU-ESP...
- [3] 76% - Recomendaciones...
- [4] 76% - DDU-356.pdf
- [2] 75% - Cir-231.pdf
- [6] 74% - DDU-257.pdf
- [8] 74% - DDU-ESPECIFICA...

---

### **Evaluación:**

#### ❌ FB-002 (Anti-Alucinación): **FALLA PARCIAL**

**Problema detectado:**
```
Referencias válidas: 8 (índices 0-8 técnicamente)
Respuesta usa: [0]
Sección menciona: [9], [10]

❌ El AI sigue creando referencias fuera del rango mostrado
❌ Numeración confusa ([0] en vez de empezar en [1])
❌ Menciona [9][10] que no tienen badge correspondiente
```

**Severidad:** MEDIA-ALTA  
**Root Cause:** 
- Chunks tienen índice 0-based (0, 1, 2...)
- El prompt dice "usa solo [0][1][2]..." y el AI obedece
- Pero UX espera [1][2][3]... (1-based)
- También genera referencias extras [9][10] en texto descriptivo

**Estado:** ⚠️ NO RESUELTO - Requiere fix adicional

---

#### ⏳ FB-003 (Calidad Fragmentos): **PENDIENTE VERIFICACIÓN PROFUNDA**

**Observaciones:**
```
✅ Badges se ven relevantes (DDU-493, INDICE, Recomendaciones)
✅ NO veo "INTRODUCCIÓN ..." en nombres
✅ Similitudes altas (74-76%)
⏳ NO pude abrir badges para ver contenido completo
```

**Necesita:** Click en badges para verificar NO contienen "INTRODUCCIÓN..." o "Página X de Y"

**Estimación:** PROBABLEMENTE RESUELTO (basado en nombres de docs)

---

## 🧪 Test 2: S001 - "¿Cómo genero el informe de consumo de petróleo?"

### **Respuesta Obtenida:**

```
Según el documento "MAQ-LOG-CBO-I-002 Cierre de Bodegas Rev.08.pdf", 
la actividad número 7 se refiere al "Informe de Consumo de Petróleo Diésel".

Para generar este informe, las responsabilidades son:

- JBOD (Jefatura de Bodega): Revisar las últimas rebajas de consumo 
  en el almacén y enviar el último Informe de consumo de Petróleo al 
  área de Impuestos...

- JOT (Jefatura de Oficina Técnica) y AO (Administrador/a de Obra): 
  También tienen responsabilidad...

En la sección de "Referencias" se menciona el instructivo 
"MAQ-LOG-CBO-PP-009 Como Imprimir Resumen Consumo Petróleo Diésel".

❌ Sin embargo, el contenido específico de "MAQ-LOG-CBO-PP-009" NO ESTÁ 
DISPONIBLE en los documentos proporcionados.

Por lo tanto, necesitarías consultar el documento "MAQ-LOG-CBO-PP-009" 
directamente o contactar al área de Logística.
```

### **Referencias:**

❌ **NO HAY BADGES DE REFERENCIAS**  
❌ **NO HAY SECCIÓN "Referencias utilizadas"**

---

### **Evaluación:**

#### ❌ FB-001 (S1 Sin Referencias): **NO RESUELTO**

```
❌ No muestra badges clickeables
❌ No muestra sección "Referencias utilizadas"
❌ Comportamiento idéntico al reportado por Sebastian

Estado: Problema persiste después de re-indexing
```

---

#### ❌ FB-005 (S1 Solo Menciona Docs): **CONFIRMADO - ES UN PROBLEMA RAG**

```
✅ S1 SÍ tiene 76 documentos (confirmado)
✅ PP-009 SÍ existe en sistema (ID: vknF67jkvup4IIuVG2BG)
✅ PP-009 SÍ fue re-indexado (confirmado en logs)

❌ PERO: RAG no devuelve PP-009 en resultados de búsqueda
❌ RAG solo devuelve I-002 (que menciona PP-009)
❌ Por eso el AI dice "PP-009 no está disponible"
```

**Root Cause:**  
PP-009 tiene baja similitud semántica con la pregunta. El AI pregunta sobre "cómo genero" y PP-009 (pequeño, 6.9KB) no rankea alto en búsqueda vectorial.

**Estado:** ⚠️ Problema de RAG Search, NO de re-indexing

---

## 📊 Tabla de Evaluación General

| Ticket | Issue | Estado Pre-Fix | Test Result | Estado Post-Fix | ¿Resuelto? |
|---|---|---|---|---|---|
| FB-002 | M1 Alucinación [7] | ❌ Inventa [7] | ⚠️ Inventa [0][9][10] | Mejora parcial | ⚠️ Parcial |
| FB-003 | M1 80% basura | ❌ 4/5 basura | ⏳ Pendiente verificar | Probablemente OK | ⏳ Pendiente |
| FB-001 | S1 Sin referencias | ❌ No muestra refs | ❌ Sigue sin refs | Sin cambio | ❌ No |
| FB-005 | S1 Solo menciona | ❌ Dice "consulta doc X" | ❌ Sigue diciendo | Sin cambio | ❌ No |
| FB-004 | M1 Modal no abre | ❌ No funciona | ⏳ No probado | N/A | ⏳ Pendiente |

---

## 🎯 Conclusión de Validación

### ❌ **NO LISTOS PARA USO PRODUCTIVO AÚN**

**Razones:**

1. **FB-002 NO completamente resuelto:**
   - Sigue inventando referencias ([0], [9], [10])
   - Numeración confusa para usuarios
   - Severidad: ALTA

2. **FB-001 NO resuelto:**
   - S001 no muestra badges de referencias
   - Problema más profundo que re-indexing
   - Severidad: ALTA

3. **FB-005 NO resuelto:**
   - RAG no recupera documentos pequeños (PP-009)
   - Necesita ajuste de parámetros RAG
   - Severidad: ALTA

4. **FB-003 Probablemente resuelto:**
   - Re-indexing eliminó 1,896 chunks basura ✅
   - Nombres de fragmentos se ven relevantes ✅
   - Requiere verificación profunda ⏳

---

## 📋 Trabajo Adicional Requerido

### **Fix 1: Normalizar Referencias a 1-based** 🔴 CRÍTICO

**Problema:** Chunks usan índice 0-based, usuarios esperan 1-based

**Solución:**
```typescript
// En lugar de usar chunkIndex directo (0, 1, 2...)
// Renumerar al mostrar (1, 2, 3...)

// Backend: Al devolver referencias
references.map((ref, index) => ({
  ...ref,
  displayNumber: index + 1 // 1-based para UI
}))

// Frontend: Mostrar displayNumber
// AI Prompt: Decir "usa [1] a [8]" (no [0] a [7])
```

---

### **Fix 2: S001 Referencias No Aparecen** 🔴 CRÍTICO

**Investigación requerida:**
- ¿Por qué M001 muestra referencias pero S001 no?
- ¿Es problema de frontend rendering?
- ¿Es problema de backend no devolviendo refs para S001?

**Pasos:**
1. Verificar logs de backend para S001
2. Verificar que RAG devuelve referencias
3. Verificar que frontend las renderiza

---

### **Fix 3: RAG No Recupera Docs Pequeños** 🔴 CRÍTICO

**Problema:** PP-009 (6.9KB) no aparece en resultados RAG

**Solución:**
```
Opciones:
A) Bajar umbral de similarity (de 70% a 60%)
B) Aumentar top_k (de 5 a 10 resultados)
C) Boost para docs pequeños pero relevantes
D) Hybrid search (keyword + vector)
```

---

## 📊 Calidad Estimada Actual

### **Con los problemas detectados:**

| Categoría | Calidad Esperada Original | Calidad Real Observada | Gap |
|---|---|---|---|
| M1 Referencias | Excellent (9/10) | Fair (6/10) | -3 |
| M1 Fragmentos | Excellent (9/10) | Good (8/10) ⏳ | -1 |
| S1 Referencias | Excellent (9/10) | Poor (2/10) | -7 |
| S1 Contenido | Excellent (9/10) | Fair (5/10) | -4 |

**Promedio:** 5.25/10 (53%) - **NO ACEPTABLE** ❌

**Objetivo Sebastian:** 50% respondan bien  
**Estado Actual:** ~53% calidad → **JUSTO EN EL LÍMITE** ⚠️

---

## 🎯 Recomendación

### ❌ **NO PROCEDER con Evaluación Masiva (Parte B) aún**

**Razones:**
1. 2 de 2 tests tienen problemas críticos
2. Calidad está en el límite (53% vs objetivo 50%)
3. Fixes adicionales mejorarían a 80-90%

**Acción Recomendada:**
1. ✅ Aplicar Fix 1 (1-based references)
2. ✅ Investigar Fix 2 (S001 sin badges)
3. ✅ Investigar Fix 3 (RAG docs pequeños)
4. 🔄 Re-testear validación
5. ✅ Si pasa → Entonces Parte B

**Tiempo estimado de fixes:** 1-2 horas

---

## 📝 Issues Nuevos Descubiertos

### **Nuevo: ISSUE-006 - Referencias usan índice 0-based**
```
Problema: [0][1][2] confunde a usuarios (esperan [1][2][3])
Severidad: ALTA
Effort: S (pequeño)
Fix: Renumerar a 1-based en frontend + backend
```

### **Nuevo: ISSUE-007 - RAG no recupera docs pequeños relevantes**
```
Problema: PP-009 (6.9KB) no aparece en resultados
Severidad: ALTA
Effort: M (mediano)
Fix: Ajustar parámetros RAG (similarity, top_k, boost)
```

---

## 📸 Screenshots

- ✅ `test-m001-oguc-response.png` - M1 con [0] y 8 referencias
- ✅ `test-s001-petroleo-response.png` - S1 sin badges, dice "no disponible"

---

**Conclusión:** Re-indexing funcionó (basura eliminada) pero hay 3 problemas adicionales que bloquean uso productivo.

**¿Proceder con fixes o evaluar masivo de todas formas para ver alcance completo del problema?**

