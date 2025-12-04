# 🔄 Plan de Migración: us-central1 → us-east4

**Fecha:** 24 noviembre 2025  
**Objetivo:** Migrar BigQuery y GCS a us-east4 (misma región que Cloud Run)  
**Beneficio:** Reducir latencia 100-200ms, eliminar costos egress  
**Riesgo:** Medio (requiere planificación cuidadosa)

---

## 📊 **ESTADO ACTUAL:**

### **Infraestructura por Región:**

| Componente | Ubicación Actual | Debe Estar En | Status |
|------------|------------------|---------------|--------|
| **Cloud Run** | us-east4 | us-east4 | ✅ Correcto |
| **Firestore** | Global/Multi-region | Global | ✅ Correcto |
| **BigQuery - flow_analytics** | **us-central1** | us-east4 | ❌ **Migrar** |
| **GCS - context-documents** | **us-central1** | us-east4 | ❌ **Migrar** |
| **GCS - uploads** | **us-central1** | us-east4 | ❌ **Migrar** |
| **GCS - rag-chunks** | **us-central1** | us-east4 | ❌ **Migrar** |
| **GCS - backups** | us-east4 | us-east4 | ✅ Correcto |

---

## 🎯 **ESTRATEGIA DE MIGRACIÓN:**

### **Enfoque: Blue-Green Deployment**

**Por qué:**
- ✅ Cero downtime
- ✅ Rollback inmediato si hay problemas
- ✅ Validar antes de switch completo
- ✅ Migración progresiva

**Fases:**
1. **BUILD GREEN** (us-east4) - 2-4 horas
2. **TEST GREEN** (paralelo) - 1 hora
3. **SWITCH TRAFFIC** (feature flag) - 5 minutos
4. **VALIDATE** (monitor 24h) - 1 día
5. **DEPRECATE BLUE** (cleanup) - 1 hora

**Tiempo total:** 1-2 días de trabajo, 24h de validación

---

## 📋 **FASE 1: BUILD GREEN (us-east4)**

### **Paso 1.1: BigQuery Dataset y Tabla**

**Duración:** 30-60 minutos

```bash
# 1. Crear dataset en us-east4
bq mk \
  --dataset \
  --location=us-east4 \
  --description="RAG embeddings - us-east4" \
  salfagpt:flow_analytics_east4

# 2. Crear tabla con mismo schema
bq mk \
  --table \
  --location=us-east4 \
  --time_partitioning_field=created_at \
  --clustering_fields=user_id,source_id \
  --description="Document chunks with embeddings - us-east4" \
  salfagpt:flow_analytics_east4.document_embeddings \
  chunk_id:STRING,source_id:STRING,user_id:STRING,chunk_index:INTEGER,text_preview:STRING,full_text:STRING,embedding:FLOAT64,metadata:JSON,created_at:TIMESTAMP

# 3. Verificar tabla creada
bq show salfagpt:flow_analytics_east4.document_embeddings
```

**Resultado esperado:**
```
✅ Dataset: flow_analytics_east4 (us-east4)
✅ Table: document_embeddings
✅ Schema: Idéntico a tabla actual
✅ Partitioning: Por created_at
✅ Clustering: user_id, source_id
```

---

### **Paso 1.2: Copiar Datos BigQuery**

**Duración:** 1-2 horas (60K chunks)

**Opción A: Export/Import (Recomendado para cross-region)**

```bash
# 1. Export desde us-central1 a Cloud Storage
bq extract \
  --destination_format=AVRO \
  'salfagpt:flow_analytics.document_embeddings' \
  'gs://salfagpt-backups-us/migration/document_embeddings_*.avro'

# 2. Load a us-east4
bq load \
  --source_format=AVRO \
  --location=us-east4 \
  salfagpt:flow_analytics_east4.document_embeddings \
  'gs://salfagpt-backups-us/migration/document_embeddings_*.avro'

# 3. Verificar conteo
bq query --location=us-east4 --use_legacy_sql=false "
SELECT COUNT(*) as chunks 
FROM \`salfagpt.flow_analytics_east4.document_embeddings\`
"
# Debería mostrar: 61,565 chunks
```

**Opción B: Query Insert (Más simple pero puede fallar cross-region)**

```bash
# Copiar con SQL
bq query --location=us-east4 --use_legacy_sql=false "
INSERT INTO \`salfagpt.flow_analytics_east4.document_embeddings\`
SELECT * FROM \`salfagpt.flow_analytics.document_embeddings\`
"
```

**Verificación:**
```bash
# Comparar conteos
bq query --use_legacy_sql=false "
SELECT 'BLUE (us-central1)' as source, COUNT(*) as chunks
FROM \`salfagpt.flow_analytics.document_embeddings\`
UNION ALL
SELECT 'GREEN (us-east4)' as source, COUNT(*) as chunks  
FROM \`salfagpt.flow_analytics_east4.document_embeddings\`
"

# Resultado esperado:
# BLUE: 61,565
# GREEN: 61,565 ✅
```

---

### **Paso 1.3: Crear Vector Index en GREEN**

**Duración:** 20-30 minutos (background)

```bash
# Crear índice vectorial en nueva tabla
bq query --location=us-east4 --use_legacy_sql=false "
CREATE VECTOR INDEX embedding_cosine_idx
ON \`salfagpt.flow_analytics_east4.document_embeddings\`(embedding)
OPTIONS(
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{\"num_lists\": 1000}'
)
"

# Verificar status del índice
bq query --location=us-east4 --use_legacy_sql=false "
SELECT * 
FROM \`salfagpt.flow_analytics_east4.INFORMATION_SCHEMA.VECTOR_INDEXES\`
WHERE table_name = 'document_embeddings'
"
```

**Resultado esperado:**
```
✅ Index: embedding_cosine_idx
✅ Status: READY (después de 20-30 min)
✅ Distance: COSINE
✅ Type: IVF
```

---

### **Paso 1.4: Migrar GCS Buckets**

**Duración:** 2-4 horas (depende de tamaño)

**Buckets a migrar:**
1. `salfagpt-context-documents` (us-central1 → us-east4)
2. `salfagpt-uploads` (us-central1 → us-east4)
3. `salfagpt-rag-chunks` (us-central1 → us-east4)

**Proceso por bucket:**

```bash
# 1. Crear bucket en us-east4
gsutil mb -l us-east4 gs://salfagpt-context-documents-east4

# 2. Copiar datos (usa transfer job para grandes volúmenes)
# Opción A: Transfer Service (Recomendado para >1TB)
# Ir a: Cloud Console > Storage Transfer Service
# - Source: gs://salfagpt-context-documents
# - Destination: gs://salfagpt-context-documents-east4
# - Schedule: One-time transfer

# Opción B: gsutil (OK para <100GB)
gsutil -m cp -r \
  gs://salfagpt-context-documents/* \
  gs://salfagpt-context-documents-east4/

# 3. Verificar conteo
gsutil du -sh gs://salfagpt-context-documents
gsutil du -sh gs://salfagpt-context-documents-east4
# Deberían ser iguales

# 4. Verificar permisos
gsutil iam get gs://salfagpt-context-documents-east4
```

**Repetir para cada bucket.**

---

## 🔄 **FASE 2: TEST GREEN**

### **Paso 2.1: Actualizar Código (Feature Flag)**

**Duración:** 15 minutos

**Archivo:** `src/lib/bigquery-agent-search.ts`

```typescript
// ✅ ANTES (BLUE):
const DATASET_ID = 'flow_analytics';

// ✅ DESPUÉS (con feature flag):
const DATASET_ID = process.env.USE_EAST4_BIGQUERY === 'true' 
  ? 'flow_analytics_east4'  // GREEN
  : 'flow_analytics';        // BLUE (fallback)
```

**Archivo:** `src/lib/storage.ts`

```typescript
// ✅ ANTES (BLUE):
const BUCKET_NAME = 'salfagpt-context-documents';

// ✅ DESPUÉS (con feature flag):
const BUCKET_NAME = process.env.USE_EAST4_STORAGE === 'true'
  ? 'salfagpt-context-documents-east4'  // GREEN
  : 'salfagpt-context-documents';        // BLUE
```

---

### **Paso 2.2: Test en Localhost (GREEN)**

**Duración:** 30 minutos

```bash
# 1. Configurar para usar GREEN
export USE_EAST4_BIGQUERY=true
export USE_EAST4_STORAGE=true

# 2. Iniciar servidor
npm run dev

# 3. Probar S2-v2
# - Abrir http://localhost:3000/chat
# - Seleccionar S2-v2
# - Hacer las 4 preguntas de evaluación
# - Verificar referencias funcionan
# - Verificar puede ver documentos

# 4. Medir performance
# - Búsqueda debería ser <500ms (vs 600-800ms actual)
# - Sin errores en console

# 5. Si todo OK → Continuar
# 6. Si hay problemas → Usar BLUE (quitar env vars)
```

**Checklist:**
- [ ] RAG funciona (similarity >70%)
- [ ] Referencias correctas
- [ ] Docs se pueden ver/descargar
- [ ] Búsqueda más rápida (<500ms)
- [ ] Sin errores

---

### **Paso 2.3: Test en Staging/Producción (GREEN)**

**Duración:** 30 minutos

```bash
# 1. Deploy con feature flag
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --update-env-vars="USE_EAST4_BIGQUERY=true,USE_EAST4_STORAGE=true"

# 2. Verificar deployment
curl https://salfagpt.salfagestion.cl/api/health

# 3. Test manual en producción
# - Login
# - Probar S2-v2
# - Verificar todo funciona

# 4. Monitor logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=100 \
  --format=json \
  | grep -i "bigquery\|storage\|error"

# 5. Verificar métricas
# Cloud Console > Cloud Run > Metrics
# - Latency
# - Error rate
# - Request count
```

---

## 🔀 **FASE 3: SWITCH TRAFFIC**

### **Paso 3.1: Gradual Rollout (Recomendado)**

**Duración:** 2-4 horas (con validación)

```bash
# Semana 1: 10% tráfico a GREEN
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --tag=green \
  --update-env-vars="USE_EAST4_BIGQUERY=true,USE_EAST4_STORAGE=true"

# Configurar traffic split
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-tags=green=10

# Monitor 2-4 horas
# Verificar: error rate, latency, user reports

# Si OK → Aumentar progresivamente
# 10% → 25% → 50% → 75% → 100%
```

**Beneficios:**
- ✅ Detecta problemas con pocos usuarios
- ✅ Rollback inmediato
- ✅ Validación gradual

---

### **Paso 3.2: Full Switch (Alternativa rápida)**

**Duración:** 5 minutos + 24h validación

```bash
# Switch completo a GREEN
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --update-env-vars="USE_EAST4_BIGQUERY=true,USE_EAST4_STORAGE=true"

# Verificar
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --format="value(spec.template.spec.containers[0].env)"

# Monitor 24 horas
# - Error rate < 0.5%
# - Latency p95 < 2s
# - No user complaints
```

---

## ✅ **FASE 4: VALIDATE GREEN**

### **Métricas a Monitorear:**

**Performance:**
```sql
-- Comparar latencia BLUE vs GREEN
SELECT
  IF(location = 'us-central1', 'BLUE', 'GREEN') as env,
  AVG(execution_time_ms) as avg_latency,
  APPROX_QUANTILES(execution_time_ms, 100)[OFFSET(95)] as p95_latency
FROM bigquery_jobs
WHERE date >= CURRENT_DATE() - 7
GROUP BY env
```

**Errores:**
```bash
# Buscar errores relacionados a BigQuery/Storage
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=100 \
  --format=json \
  | jq '.[] | select(.textPayload | contains("BigQuery") or contains("Storage"))'
```

**Usuarios:**
- Feedback de mecánicos
- Tiempo de respuesta percibido
- Referencias funcionando

---

## 🔙 **FASE 5: ROLLBACK PLAN**

### **Si GREEN tiene problemas:**

```bash
# Rollback inmediato a BLUE
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --remove-env-vars="USE_EAST4_BIGQUERY,USE_EAST4_STORAGE"

# Verificar rollback
curl https://salfagpt.salfagestion.cl/api/health
# Debería volver a us-central1

# Tiempo de rollback: <2 minutos
```

**Triggers para rollback:**
- Error rate > 1%
- Latency p95 > 3s
- User complaints > 3
- Búsquedas fallando > 5%

---

## 🗑️ **FASE 6: CLEANUP BLUE**

### **Después de 30 días en GREEN sin problemas:**

**Duración:** 1 hora

```bash
# 1. Backup final de BLUE (por si acaso)
bq extract \
  'salfagpt:flow_analytics.document_embeddings' \
  'gs://salfagpt-backups-us/final-backup-central1/*.avro'

# 2. Verificar backup
gsutil ls gs://salfagpt-backups-us/final-backup-central1/

# 3. Deprecar dataset BLUE (NO delete todavía)
bq update \
  --description="DEPRECATED - Migrated to flow_analytics_east4" \
  salfagpt:flow_analytics

# 4. Después de 90 días sin issues → Delete
# bq rm -r -f salfagpt:flow_analytics
# gsutil -m rm -r gs://salfagpt-context-documents

# 5. Actualizar código (quitar feature flag)
const DATASET_ID = 'flow_analytics_east4';  // Hardcoded
```

---

## 📊 **TIMELINE SUGERIDO:**

### **Opción A: Migración Completa (2-3 días)**

```
Día 1 - Preparación (4-6 horas):
├─ 09:00-10:00: Crear dataset/tabla us-east4
├─ 10:00-12:00: Copiar chunks BigQuery (2h)
├─ 12:00-12:30: Crear vector index
├─ 13:00-14:00: Copiar GCS buckets (inicio)
├─ 14:00-17:00: Continuar GCS copy (3h)
└─ 17:00-18:00: Actualizar código con feature flags

Día 2 - Testing (4 horas):
├─ 09:00-10:00: Test localhost GREEN
├─ 10:00-11:00: Deploy staging GREEN
├─ 11:00-12:00: Test staging GREEN
└─ 12:00-13:00: Deploy prod con 10% traffic

Día 2-3 - Gradual Rollout (24h):
├─ 13:00: 10% GREEN
├─ 15:00: 25% GREEN (si OK)
├─ 18:00: 50% GREEN (si OK)
├─ 21:00: 75% GREEN (si OK)
└─ Día 3 09:00: 100% GREEN (si OK)

Día 3+ - Validation:
└─ Monitor 24-48h antes de declarar éxito
```

---

### **Opción B: Migración Rápida (6-8 horas)**

```
Mañana (6h trabajo continuo):
├─ 09:00-10:00: Setup GREEN
├─ 10:00-12:00: Copiar datos
├─ 12:00-12:30: Crear índice
├─ 13:00-14:00: Test localhost
├─ 14:00-15:00: Deploy producción con GREEN
└─ 15:00-17:00: Monitor y validar

Tarde/Noche:
└─ Monitor automático 24h
```

---

## 🔧 **SCRIPTS DE MIGRACIÓN:**

### **Script 1: Setup GREEN**

```javascript
// scripts/setup-green-us-east4.mjs
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });

async function setup() {
  // 1. Create dataset
  const [dataset] = await bq.createDataset('flow_analytics_east4', {
    location: 'us-east4',
    description: 'RAG embeddings - us-east4 (GREEN deployment)'
  });
  
  // 2. Create table
  // ... (código completo en archivo)
}
```

---

### **Script 2: Copy Data**

```javascript
// scripts/copy-to-green.mjs
async function copyData() {
  const query = `
    INSERT INTO \`salfagpt.flow_analytics_east4.document_embeddings\`
    SELECT * FROM \`salfagpt.flow_analytics.document_embeddings\`
  `;
  
  const [job] = await bq.createQueryJob({
    query,
    location: 'us-east4'
  });
  
  // Wait for completion
  await job.getQueryResults();
}
```

---

### **Script 3: Verify Migration**

```javascript
// scripts/verify-green.mjs
async function verify() {
  // Compare counts
  // Compare sample data
  // Verify embeddings intact
  // Test search performance
}
```

---

## 📈 **BENEFICIOS ESPERADOS:**

### **Performance:**

| Métrica | BLUE (us-central1) | GREEN (us-east4) | Mejora |
|---------|-------------------|------------------|--------|
| **BigQuery search** | 600-800ms | **300-400ms** | **2x** ⚡ |
| **GCS file load** | 200-300ms | **100-150ms** | **2x** ⚡ |
| **Total RAG** | 1.5-2s | **0.8-1.2s** | **1.7x** ⚡ |

### **Costos:**

| Concepto | BLUE | GREEN | Ahorro |
|----------|------|-------|--------|
| **Cross-region egress** | $0.01/GB | $0 | 100% |
| **Query cost** | Same | Same | - |
| **Storage cost** | Same | Same | - |

**Ahorro mensual:** ~$5-10 (si mucho tráfico)

---

## ⚠️ **RIESGOS Y MITIGACIÓN:**

### **Riesgo 1: Downtime durante migración**

**Probabilidad:** Baja  
**Impacto:** Alto  
**Mitigación:**
- ✅ Blue-Green deployment (cero downtime)
- ✅ Feature flags (switch instantáneo)
- ✅ Rollback < 2 minutos

---

### **Riesgo 2: Datos inconsistentes**

**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- ✅ Copiar todo antes de switch
- ✅ Verificar conteos
- ✅ Test exhaustivo antes de producción
- ✅ Mantener BLUE intacto 30 días

---

### **Riesgo 3: References rotas**

**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**
- ✅ Actualizar storagePath en Firestore
- ✅ Script de actualización masiva
- ✅ Test de cada tipo de documento

---

## 📋 **CHECKLIST PRE-MIGRACIÓN:**

### **Preparación:**
- [ ] Backup completo de BLUE
- [ ] Documentar estado actual
- [ ] Plan de rollback listo
- [ ] Equipo notificado
- [ ] Ventana de mantenimiento programada (opcional)

### **Durante Migración:**
- [ ] GREEN dataset creado
- [ ] Datos copiados (verificar conteo)
- [ ] Índice vectorial creado
- [ ] GCS buckets copiados
- [ ] Código actualizado con flags
- [ ] Tests passed

### **Post-Migración:**
- [ ] Monitor 24h
- [ ] Error rate < 0.5%
- [ ] Performance mejorado
- [ ] User feedback positivo
- [ ] Backup de BLUE preservado

---

## 🎯 **RECOMENDACIÓN:**

### **Para Presentación HOY:**
❌ **NO migrar** - Sistema actual funciona (600ms es bueno)

### **Post-Presentación (Esta Semana):**
✅ **SÍ migrar** - Siguiendo plan Blue-Green
- Lunes-Martes: Setup + Copy
- Miércoles: Test
- Jueves: Deploy GREEN
- Viernes: Validate 100%

**Beneficio:** 2x más rápido (600ms → 300ms) ⚡

---

## 💡 **QUICK WIN (Sin Migración):**

**Para mejorar HOY sin migración:**

```bash
# Optimizar query actual (us-central1)
# Agregar APPROX_TOP_COUNT para acelerar

UPDATE bigquery query to use:
  ORDER BY similarity DESC
  LIMIT 8
  
+ Add query cache
+ Add connection pooling
```

**Mejora:** 600ms → 500ms (17% mejor) sin mover datos

---

**PLAN COMPLETO DE MIGRACIÓN DOCUMENTADO** ✅  
**Listo para ejecutar post-presentación** 🎯



