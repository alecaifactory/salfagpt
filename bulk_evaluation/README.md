# 📊 Sistema de Evaluación Masiva - Agentes S1 y M1

**Propósito:** Evaluar calidad de respuestas de los agentes basado en feedback de Sebastian  
**Fecha:** 2025-10-28  
**Agentes:** S1 (Gestión Bodegas), M1 (Legal Territorial)

---

## 📁 Archivos en esta Carpeta

### **evaluation_template.csv**
Template con todas las preguntas de Sebastian:
- S1: 67 preguntas de gestión de bodegas
- M1: 19 preguntas de normativa urbana/construcción
- **Total:** 86 preguntas

**Columnas:**
- `id_evaluacion`: ID único (S1-001, M1-001, etc.)
- `agente`: S1 o M1
- `pregunta`: Pregunta exacta
- `respuesta`: Respuesta del agente (llenar después de testing)
- `evaluacion_calidad`: poor | fair | good | excellent
- `tiene_referencias`: true | false
- `basura_detectada`: true | false (si refs contienen "INTRODUCCIÓN..." etc.)
- `evaluacion_general`: pass | fail
- `notas`: Observaciones adicionales

---

## 🎯 Criterios de Evaluación

### **Calidad de Respuesta:**

**Excellent (10/10):**
- ✅ Respuesta específica y completa
- ✅ Con referencias a documentos
- ✅ Pasos concretos o información detallada
- ✅ Sin errores evidentes

**Good (7-9/10):**
- ✅ Respuesta relevante
- ✅ Información útil pero no completa
- ⚠️ Puede faltar algún detalle
- ✅ Con o sin referencias

**Fair (4-6/10):**
- ⚠️ Respuesta genérica pero relacionada
- ⚠️ Falta información específica
- ⚠️ Puede decir "consulta documento X"

**Poor (1-3/10):**
- ❌ No responde la pregunta
- ❌ Dice "no tengo información"
- ❌ Respuesta irrelevante

---

### **Referencias:**

**Valid:**
- ✅ Badges clickeables [1][2][3]
- ✅ Panel de referencias muestra fragmentos
- ✅ Fragmentos contienen texto útil

**Garbage:**
- ❌ "1. INTRODUCCIÓN .............."
- ❌ "Página X de Y"
- ❌ Solo números/puntos
- ❌ <50 caracteres de contenido

---

### **Evaluación General:**

**PASS:**
- Calidad ≥ Good (7/10)
- O calidad Fair (5/10) con referencias válidas

**FAIL:**
- Calidad Poor (<4/10)
- O Fair sin referencias

---

## 🧪 Cómo Usar Este Sistema

### **Paso 1: Testing Manual (Muestra Pequeña)**

**Probar 4-5 preguntas clave primero:**

```bash
# Ejecutar script de testing
npx tsx scripts/test-sebastian-questions.ts
```

Esto probará:
- S1: 4 preguntas más reportadas
- M1: 3 preguntas más reportadas

**Output:**
- Respuestas en console
- JSON con resultados en `bulk_evaluation/sebastian_test_results.json`

---

### **Paso 2: Evaluación de Muestra**

Revisar resultados y decidir:

**Si ≥70% son Good o Excellent:**
```
✅ Calidad aceptable
→ Proceder con evaluación masiva (86 preguntas)
```

**Si <70% son Good o Excellent:**
```
❌ Calidad insuficiente
→ Investigar causas
→ Aplicar más fixes
→ Re-testear muestra
```

---

### **Paso 3: Evaluación Masiva (Si Paso 2 fue exitoso)**

**Script automático:**
```bash
# Crear y ejecutar script que:
# 1. Lee evaluation_template.csv
# 2. Hace cada pregunta al agente correspondiente
# 3. Evalúa calidad automáticamente
# 4. Llena CSV con resultados
# 5. Genera reporte

npx tsx scripts/bulk-evaluate.ts
```

**Tiempo estimado:**
- 86 preguntas × ~5 segundos = ~7 minutos
- + tiempo de evaluación AI

---

### **Paso 4: Análisis de Resultados**

**Métricas clave:**
```
Total preguntas: 86
Excellent: X (Y%)
Good: X (Y%)
Fair: X (Y%)
Poor: X (Y%)

Con referencias: X (Y%)
Con basura: X (Y%)

Por agente:
- S1: X% calidad aceptable
- M1: X% calidad aceptable
```

**Decisión:**
- ≥70% aceptable → ✅ Listo para producción
- <70% aceptable → ❌ Más trabajo necesario

---

## 📊 Workflow

```
1. Testing Muestra (4-5 preguntas)
   ↓
2. Evaluar Calidad
   ↓
   ≥70% Good? 
   ├─ SÍ → Continuar
   └─ NO → Investigar y arreglar
   ↓
3. Re-indexing (si aplicable)
   ↓
4. Testing Masivo (86 preguntas)
   ↓
5. Análisis Final
   ↓
6. Decisión: Producción o Más Trabajo
```

---

## 🚀 Scripts Disponibles

### **test-sebastian-questions.ts**
- Prueba muestra de preguntas reportadas
- Evalúa calidad automáticamente
- Genera JSON con resultados

### **bulk-evaluate.ts** (por crear)
- Lee evaluation_template.csv
- Prueba todas las 86 preguntas
- Llena CSV con resultados
- Genera reporte HTML/PDF

### **analyze-results.ts** (por crear)
- Lee CSV completo
- Genera métricas
- Identifica patrones de fallos
- Recomienda acciones

---

## 📝 Formato de Reporte

### **CSV Output:**
```csv
id_evaluacion,agente,pregunta,respuesta,evaluacion_calidad,tiene_referencias,basura_detectada,evaluacion_general,notas
S1-001,S1,¿Cómo se hace una Solped?,"Para hacer una Solped[1]...",excellent,true,false,pass,Referencias válidas
S1-002,S1,¿Dónde busco códigos?,"Los códigos se encuentran en...",good,false,false,pass,Sin referencias pero útil
M1-001,M1,¿Qué es un OGUC?,"La OGUC es[1]...",excellent,true,false,pass,5 refs válidas sin basura
```

### **JSON Output:**
```json
{
  "testDate": "2025-10-28",
  "totalQuestions": 86,
  "results": [...],
  "summary": {
    "s1": { "total": 67, "excellent": 45, "good": 15, "fair": 5, "poor": 2 },
    "m1": { "total": 19, "excellent": 15, "good": 3, "fair": 1, "poor": 0 },
    "overall": { "acceptableRate": 0.85 }
  },
  "recommendation": "ready_for_production"
}
```

---

## 🎯 Próximos Pasos

### **AHORA:**
1. Ejecutar `npx tsx scripts/test-sebastian-questions.ts`
2. Revisar resultados de muestra (7 preguntas)
3. Decidir si calidad es aceptable

### **Si muestra es buena:**
4. Crear `scripts/bulk-evaluate.ts`
5. Ejecutar evaluación masiva (86 preguntas)
6. Analizar resultados
7. Decidir: Producción o Más fixes

### **Si muestra es mala:**
4. Investigar causas de baja calidad
5. Aplicar fixes adicionales
6. Re-probar muestra
7. Repetir hasta calidad aceptable

---

**Listo para comenzar evaluación.** 🚀

