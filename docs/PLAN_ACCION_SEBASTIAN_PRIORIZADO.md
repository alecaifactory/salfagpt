# 🎯 Plan de Acción Priorizado - Issues de Sebastian

**Objetivo:** Resolver TODO lo que Sebastian reportó ANTES de evaluación masiva  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo Estimado:** 2-3 horas

---

## 🚨 Lo Que Sebastian Reportó (Textual)

### **1. S1 - No muestra referencias** 🔴
```
"ya mira en el S1: no esta mostrando referencias"
"mira de todas formas en usuario admin y usuario final"
"no muestra la referencias"
```

### **2. M1 - Referencias inventadas [7]** 🔴
```
"tiene pegado el [7] en las respuesta"
"pero según yo eso esta alucinando porque los texto citados son solo 5"
```

### **3. M1 - Fragmentos basura** 🔴
```
"4 de los 5 fragmentos son según yo basura o sin relación"
"el fragmento 1, 2 y 4 solo dicen: '1. INTRODUCCIÓN .............'"
"el 5to dice esto: 'página 2 de 3' (4 tokens)"
```

### **4. M1 - Vista documento original no funciona** 🟡
```
"la vista del documento original de referencia aun no se ve"
```

---

## ✅ FOCO: Resolver en Este Orden

### **PRIORIDAD 1: S001 Sin Referencias** 🔴 BLOQUEANTE

**Issue:** FB-001  
**Ticket:** MOQ0ANuDIu5DEueNXsfK  
**Root Cause:** Chunks NO en BigQuery  
**Solución:** Sync Firestore → BigQuery

**Pasos Específicos:**

1. **Crear script de sync (30 mins):**
   ```bash
   scripts/sync-firestore-to-bigquery.mjs
   ```
   
   **Debe:**
   - Leer chunks de Firestore (collection: document_chunks)
   - Para user_id: '114671162830729001607'
   - Insertar en BigQuery (salfagpt.flow_analytics.document_embeddings)
   - Usar schema correcto
   - Log progreso cada 100 chunks

2. **Ejecutar sync (15 mins):**
   ```bash
   node scripts/sync-firestore-to-bigquery.mjs
   ```
   
   **Resultado esperado:**
   - 1,773 chunks de S001 en BigQuery
   - Más chunks de M001 si aplica
   - Total: ~2,000-3,000 chunks

3. **Verificar (2 mins):**
   ```sql
   SELECT COUNT(*) 
   FROM salfagpt.flow_analytics.document_embeddings
   WHERE user_id = '114671162830729001607'
   AND created_at >= '2025-10-28'
   ```
   
   **Esperado:** >1,700 chunks

4. **Re-probar S001 (3 mins):**
   ```
   Pregunta: "¿Cómo genero el informe de consumo de petróleo?"
   
   ANTES: 0 badges, dice "consulta doc PP-009"
   DESPUÉS: 6-8 badges, pasos concretos de PP-009
   ```

**Criterio de Éxito:** S001 muestra badges clickeables ✅

---

### **PRIORIDAD 2: M001 Referencias Phantom** 🔴 BLOQUEANTE

**Issue:** FB-002 (parcial)  
**Ticket:** rPyjfACV6wEGeUjJcIRX  
**Problema:** Menciona [9][10] sin badges correspondientes

**Solución Rápida (15 mins):**

**Opción A - Post-procesamiento:**
```typescript
// En messages-stream.ts, después de recibir referencias del AI
// Limpiar menciones de números sin badges

const validNumbers = references.map((r, i) => i + 1);
// validNumbers = [1, 2, 3, 4, 5, 6, 7, 8]

// Eliminar menciones de [9], [10], etc del texto de referencias
aiResponseText = aiResponseText.replace(
  /\[(\d+)\]/g,
  (match, num) => {
    const number = parseInt(num);
    return validNumbers.includes(number) ? match : '';
  }
);
```

**Opción B - Prompt más estricto:**
```typescript
// En gemini.ts
`
IMPORTANTE: La lista de referencias FINAL debe contener SOLO los números ${fragmentNumbers.join(', ')}.
NO agregues números adicionales en la sección de referencias.
NO digas "[9] Fragmento de..." si solo tienes hasta [8].
`
```

**Criterio de Éxito:** M001 solo menciona [1]-[8], no [9][10] ✅

---

### **PRIORIDAD 3: M001 Fragmentos Basura** ✅ PROBABLEMENTE RESUELTO

**Issue:** FB-003  
**Ticket:** m7hnfk49hxa59qWkCcW8  
**Estado:** Re-indexing eliminó 1,896 chunks basura

**Verificación (5 mins):**

```
M001: "¿Qué es un OGUC?"

Click en cada badge [1]-[8]
Verificar contenido NO es:
❌ "1. INTRODUCCIÓN ............."
❌ "Página X de Y"
❌ Solo puntos y espacios

Contar: ¿Cuántos de 8 son útiles?

ESPERADO: 7-8 de 8 útiles (88-100%)
ANTES: 1 de 5 útiles (20%)
```

**Criterio de Éxito:** ≥80% fragmentos útiles ✅

---

### **PRIORIDAD 4: M1 Vista Documento Original** 🟡 NO BLOQUEANTE

**Issue:** FB-004  
**Ticket:** 6lOqVHY2MvUB8ItdL6Hr  
**Estado:** No investigado

**Investigación (10 mins):**
1. Click en badge de referencia
2. Panel se abre
3. Buscar botón "Ver documento original"
4. Click
5. ¿Abre modal?

**Si NO abre:**
- Verificar event handler
- Implementar modal si falta
- O documentar como feature pendiente

**Severidad:** MEDIA (feature secundaria, no bloqueante)

---

## 📋 Checklist de Resolución

### **Para Declarar Issues de Sebastian RESUELTOS:**

```
□ PRIORIDAD 1: S001 muestra badges [1][2][3]...
  └─ Sync BigQuery ejecutado
  └─ Query confirma chunks insertados
  └─ Testing S001 muestra referencias
  └─ Screenshot como evidencia

□ PRIORIDAD 2: M001 no menciona [9][10]
  └─ Fix aplicado (post-process o prompt)
  └─ Testing M001 solo usa [1]-[8]
  └─ Screenshot como evidencia

□ PRIORIDAD 3: M001 fragmentos útiles
  └─ Click en 8 badges
  └─ Verificar 7-8 útiles (no "INTRODUCCIÓN...")
  └─ Screenshot de 3-4 fragmentos buenos

□ PRIORIDAD 4: Modal documento (opcional)
  └─ Verificar si implementado
  └─ Si no, documentar como mejora futura
```

**SOLO después de esos 3-4 checks ✅:**
→ Proceder con evaluación masiva 87 preguntas

---

## 🎯 Workflow Simplificado

```
SESIÓN NUEVA
    ↓
1. Leer: PROXIMA_SESION_CONTINUAR_AQUI.md
    ↓
2. Ejecutar: Sync Firestore → BigQuery (PRIORIDAD 1)
    ↓
3. Probar: S001 "informe petróleo" → ¿Muestra badges?
    ├─ SÍ → ✅ Continuar
    └─ NO → 🔧 Debug sync
    ↓
4. Arreglar: M001 refs phantom (PRIORIDAD 2)
    ↓
5. Probar: M001 "OGUC" → ¿Solo [1]-[8]?
    ├─ SÍ → ✅ Continuar
    └─ NO → 🔧 Ajustar fix
    ↓
6. Verificar: M001 fragmentos útiles (PRIORIDAD 3)
    ↓
7. TODO RESUELTO → Evaluación Masiva 87 preguntas
    ↓
8. Análisis → Decisión final
```

---

## 📊 Tickets Priorizados en Roadmap

### **Lane NOW (Ejecutar Ya):**
```
🔴 MOQ0ANuDIu5DEueNXsfK - Sync BigQuery (CRÍTICO)
   └─ Resuelve: FB-001, FB-005
   └─ Tiempo: 20 mins
   └─ Bloqueante para resto
```

### **Lane NEXT (Después de Sync):**
```
🟡 rPyjfACV6wEGeUjJcIRX - Fix refs phantom
   └─ Resuelve: FB-002 (parcial)
   └─ Tiempo: 15 mins

🟡 vzjhsKgDa0v0Rwl5zjAQ - Evaluación masiva
   └─ SOLO después de fixes
   └─ Tiempo: 40 mins
```

### **Lane BACKLOG (Si hay tiempo):**
```
🟢 6lOqVHY2MvUB8ItdL6Hr - Modal documento
   └─ FB-004 (no bloqueante)
   └─ Tiempo: 30 mins
```

---

## 🎯 Definición de "DONE"

### **Issues de Sebastian = RESUELTOS cuando:**

**S001:**
- ✅ Muestra badges de referencias [1][2][3]...
- ✅ Referencias son clickeables
- ✅ Panel de detalle se abre
- ✅ Respuesta usa contenido de documentos (no solo menciona)
- ✅ Encuentra PP-009 y usa su contenido

**M001:**
- ✅ Solo usa referencias que existen [1] a [N]
- ✅ NO inventa [0], [9], [10], etc.
- ✅ 7-8 de 8 fragmentos son útiles
- ✅ NO aparece "INTRODUCCIÓN ..." ni "Página X de Y"

**Confirmación:**
- ✅ Sebastian testea y aprueba
- ✅ Mueve tickets a "Done" en roadmap
- ✅ Calidad ≥70% en evaluación masiva

---

## 💡 Comando para AI en Nueva Sesión

```
@docs/PROXIMA_SESION_CONTINUAR_AQUI.md

Continuar trabajo de Sebastian.

FOCO: Arreglar issues reportados antes de evaluación masiva.

ORDEN:
1. Sync BigQuery (PRIORIDAD 1 - CRÍTICO)
2. Fix refs phantom (PRIORIDAD 2)
3. Verificar fragmentos (PRIORIDAD 3)
4. Testing validación
5. SOLO si todo pasa → Evaluación 87 preguntas

Ticket NOW: MOQ0ANuDIu5DEueNXsfK

¿Empezamos con sync BigQuery?
```

---

**Todo documentado. Foco claro. Listo para próxima sesión.** ✅🎯

