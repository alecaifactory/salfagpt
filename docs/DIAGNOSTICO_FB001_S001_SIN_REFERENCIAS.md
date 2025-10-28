# 🔍 Diagnóstico FB-001: S001 Sin Referencias

**Issue:** S001 no muestra badges de referencias  
**Fecha Investigación:** 2025-10-28  
**Estado:** Root cause identificado

---

## 🚨 Root Cause Confirmado

### **Evidencia de Console Logs:**

**M001 (Funciona):**
```javascript
"📚 References in completion: 8"
"📚 MessageRenderer received references: 8"
[Muestra 8 badges clickeables]
```

**S001 (No Funciona):**
```javascript
"📚 References in completion: 0"  ← PROBLEMA AQUÍ
"📚 MessageRenderer: No references received" (x70 veces)
[No muestra badges]
```

---

## 📊 Análisis del Problema

### **Qué SÍ Funciona:**
- ✅ S001 tiene 76 documentos asignados
- ✅ S001 carga 76 fuentes activas
- ✅ Backend recibe la pregunta
- ✅ AI genera respuesta útil

### **Qué NO Funciona:**
- ❌ RAG search NO devuelve chunks para S001
- ❌ Backend devuelve `references: []` (array vacío)
- ❌ Frontend no puede mostrar badges (no hay data)

---

## 🔎 Por Qué RAG No Encuentra Chunks en S001

### **Hipótesis Principales:**

#### **1. Chunks de S001 no están en BigQuery** 🔴 MÁS PROBABLE

**Verificar:**
```sql
SELECT COUNT(*) 
FROM salfagpt.flow_dataset.document_chunks
WHERE source_id IN (SELECT id FROM context_sources WHERE assignedToAgents CONTAINS 'AjtQZEIMQvFnPRJRjl4y')
```

**Si count = 0:**
- Los 76 documentos de S001 fueron re-indexados en Firestore
- Pero NO se sincronizaron a BigQuery
- RAG busca en BigQuery → No encuentra nada → 0 referencias

---

#### **2. Similarity Score Muy Bajo**

Todos los 76 chunks tienen similarity <25% para la pregunta "¿Cómo genero informe petróleo?"

**Menos probable** porque:
- Hay documento específico PP-009 "Como Imprimir Resumen Consumo Petróleo"
- Debería tener alta similarity con esa pregunta

---

#### **3. AgentId Mapping Incorrecto**

BigQuery busca por `agentId` pero los chunks de S001 tienen `agentId` diferente o null.

---

## 🔧 Soluciones Propuestas

### **Solución 1: Verificar Sync a BigQuery** ⭐ PRIMERO

**Script de verificación:**
```javascript
// Verificar si chunks de S001 están en BigQuery
const s001Chunks = await bigquery.query(`
  SELECT COUNT(*) as total
  FROM document_chunks  
  WHERE user_id = 'alec_getaifactory_com'
    AND source_id IN (
      SELECT id FROM context_sources 
      WHERE assignedToAgents CONTAINS 'AjtQZEIMQvFnPRJRjl4y'
    )
`);

console.log('S001 chunks in BigQuery:', s001Chunks[0].total);
```

**Si 0:**
- Re-sincronizar chunks a BigQuery
- O usar Firestore search como fallback

---

### **Solución 2: Forzar Full-Text Mode para S001**

Temporalmente, hacer que S001 use documentos completos en vez de RAG:

```typescript
// En messages-stream.ts
if (agentId === 'AjtQZEIMQvFnPRJRjl4y') { // S001
  // Force full-text mode
  ragUsed = false;
  additionalContext = buildFullTextContext(sources);
}
```

**Pros:**
- Funciona inmediatamente
- S001 tendrá acceso a todo el contenido

**Cons:**
- Usa más tokens
- No tiene referencias clickeables granulares

---

### **Solución 3: Hybrid Search (Keyword + Vector)**

Para docs procedimentales como S001, agregar keyword matching:

```typescript
// Si vector search devuelve 0 resultados
// Intentar keyword search:
const keywordResults = await searchByKeywords(query, agentId, {
  keywords: ['informe', 'petróleo', 'consumo'],
  minMatches: 2
});
```

---

## 🎯 Plan de Acción Inmediato

### **Paso 1: Verificar BigQuery (5 mins)**

Ejecutar query para contar chunks de S001 en BigQuery.

**Si 0 chunks:**
→ Re-sync necesario
→ O implementar Firestore fallback

**Si >0 chunks:**
→ Problema es similarity/filtering
→ Ajustar parámetros o usar keyword boost

---

### **Paso 2: Implementar Fallback (15 mins)**

Si BigQuery no tiene los chunks, usar Firestore search:

```typescript
// En messages-stream.ts
let ragResults = await searchByAgentBigQuery(agentId, query);

if (ragResults.length === 0) {
  console.log('⚠️ BigQuery returned 0 - trying Firestore fallback');
  ragResults = await searchByAgentFirestore(agentId, query);
}
```

---

### **Paso 3: Re-Testear (2 mins)**

Después de aplicar fix, probar:
```
S001: "¿Cómo genero el informe de consumo de petróleo?"
Esperado: Muestra badges [1][2][3]...
```

---

## 📊 Comparación M001 vs S001

| Aspecto | M001 | S001 | Diferencia |
|---|---|---|---|
| Documentos asignados | 538 | 76 | M001 tiene 7x más |
| Fuentes activas (UI) | 538 | 76 | Correcto para ambos |
| RAG search ejecuta | ✅ Sí | ✅ Sí | Ambos ejecutan |
| Chunks encontrados | 8 | 0 | ❌ S001 no encuentra |
| Referencias devueltas | 8 | 0 | ❌ S001 vacío |
| Badges mostrados | ✅ 8 | ❌ 0 | S001 falla |

**Diferencia Clave:** RAG no encuentra chunks para S001, pero sí para M001.

---

## 🔍 Próximo Paso Específico

**Ejecutar ahora:**
```bash
# Verificar si chunks de S001 están en BigQuery
npx tsx scripts/check-s001-chunks-bigquery.ts
```

**Basado en resultado:**
- Si 0 → Re-sync a BigQuery
- Si >0 → Ajustar parámetros search
- Si error → Verificar conexión BigQuery

---

**Continuando investigación...** 🔍

