# 🔄 Prompt para Próxima Conversación

**Copiar y pegar esto al iniciar nueva conversación:**

---

## CONTEXTO COMPLETO:

Acabo de completar la configuración del agente **S2-v2** (Maqsa Mantenimiento Equipos Superficie) con éxito total:

### **Logros S2-v2:**
- ✅ 2,188 documentos asignados al agente
- ✅ 12,219 chunks procesados e indexados
- ✅ 12,219 embeddings semánticos (768 dims) en BigQuery
- ✅ RAG funcional con 76.3% similarity promedio
- ✅ 4/4 evaluaciones de calidad aprobadas
- ✅ Búsqueda vectorial en 50-60s
- ✅ Referencias correctas y contenido relevante

### **Proceso ejecutado (3h 37min):**
1. Análisis de 101 documentos en carpeta S002-20251118
2. Asignación masiva de sources al agente
3. Procesamiento de chunks (500 tokens, 50 overlap)
4. Generación de embeddings semánticos (Gemini text-embedding-004)
5. Sincronización a BigQuery (flow_analytics.document_embeddings)
6. Testing y validación con preguntas reales

### **Arquitectura BigQuery (CRÍTICO):**
```javascript
// ✅ USAR ESTA CONFIGURACIÓN:
Project: salfagpt
Dataset: flow_analytics
Table: document_embeddings

// Schema exacto (verificado en GCP console):
{
  chunk_id: STRING REQUIRED,
  source_id: STRING REQUIRED,
  user_id: STRING REQUIRED,
  chunk_index: INTEGER REQUIRED,
  text_preview: STRING NULLABLE,
  full_text: STRING NULLABLE,
  embedding: FLOAT REPEATED,
  metadata: JSON NULLABLE,  // Campos extra aquí (source_name, token_count, etc.)
  created_at: TIMESTAMP NULLABLE
}
```

---

## OBJETIVO AHORA:

Replicar el proceso exitoso de S2-v2 para **tres agentes más:**

### **1. S1-v2 (PRIMERO)**
- **Agent ID:** iQmdg3bMSJ1AdqqlFpye
- **Carpeta:** upload-queue/S001-20251118
- **Docs estimados:** ~75 (Warehouse/SAP procedures)
- **Categorías:** MAQ-LOG-CBO, MAQ-LOG-CT, MAQ-ADM, Paso a Paso SAP

### **2. M1-v2 (SEGUNDO)**
- **Agent ID:** Por verificar en Firestore
- **Carpeta:** upload-queue/M001-20251118
- **Docs:** Por verificar
- **Categorías:** Por definir

### **3. M3-v2 (TERCERO)**
- **Agent ID:** Por verificar en Firestore
- **Carpeta:** upload-queue/M003-20251118  
- **Docs:** Por verificar
- **Categorías:** Por definir

---

## ARCHIVOS BASE PARA COPIAR:

### **Scripts ya funcionando (en /Users/alec/salfagpt/scripts/):**
1. `check-s002-status.mjs` - Análisis de documentos
2. `assign-all-s002-to-s2v2.mjs` - Asignación masiva
3. `process-s2v2-chunks-v2.mjs` - Procesamiento chunks/embeddings
4. `test-s2v2-evaluation.mjs` - Testing con evaluaciones

### **Para cada nuevo agente:**
- Copiar los 4 scripts
- Buscar/Reemplazar: Agent ID, carpeta, nombres
- Ejecutar secuencia: análisis → asignación → procesamiento → testing

---

## LECCIONES CRÍTICAS APRENDIDAS:

### **❌ NO USAR:**
- `flow_rag_optimized` dataset (no existe en salfagpt project)
- `document_chunks` table (no existe)
- `document_chunks_vectorized` table (no existe)

### **✅ USAR:**
- `flow_analytics` dataset (existe)
- `document_embeddings` table (existe y funciona)
- Schema exacto sin campos extra (source_name/token_count → metadata)

### **🔧 Problemas Resueltos:**
1. Tabla incorrecta → Corregida a document_embeddings
2. Schema incompatible → Campos extra a metadata JSON
3. API key issues → Módulo embeddings.ts maneja automáticamente
4. Todos los 2,188 docs procesados exitosamente

---

## COMANDO INMEDIATO:

```bash
# 1. Verificar Agent IDs
cd /Users/alec/salfagpt

# 2. Listar agentes del usuario
npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const snapshot = await db.collection('conversations')
  .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
  .get();

console.log('Agentes encontrados:\n');
snapshot.docs.forEach(doc => {
  const data = doc.data();
  if (data.title?.match(/S1-v2|M1-v2|M3-v2/)) {
    console.log(\`- \${data.title}: \${doc.id}\`);
  }
});
process.exit(0);
"

# 3. Ver carpetas disponibles
ls -la upload-queue/ | grep "20251118"

# 4. Iniciar con S1-v2
# Copiar scripts y adaptar según CONTEXT_HANDOFF_S1_M1_M3.md
```

---

## ARCHIVOS DE REFERENCIA:

**Leer estos archivos para contexto completo:**
- `CONTEXT_HANDOFF_S1_M1_M3.md` - Este archivo (guía completa)
- `S002_TABLA_ESTADO.md` - Ejemplo de tabla final
- `PROBLEMA_BIGQUERY_RESUELTO_FINAL.md` - Soluciones aplicadas
- `SCHEMA_FIX_BACKWARD_COMPATIBLE.md` - Schema correcto

---

## ÉXITO ESPERADO:

**Al completar los 3 agentes:**
- ✅ S1-v2: ~75 docs, ~4,000 chunks
- ✅ M1-v2: ~50 docs, ~2,500 chunks  
- ✅ M3-v2: ~50 docs, ~2,500 chunks
- ✅ **Total:** ~175 docs, ~19,000 chunks adicionales
- ✅ **4 agentes** completamente funcionales con RAG

**Tiempo total:** 6-7 horas  
**Costo total:** ~$0.21 (embeddings)

---

**Usuario:** usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)  
**Proyecto:** salfagpt  
**Estado S2-v2:** ✅ 100% COMPLETO Y FUNCIONAL  
**Próximos:** S1-v2, M1-v2, M3-v2

**¿Por dónde empezar?** Verificar Agent IDs y comenzar con S1-v2.

