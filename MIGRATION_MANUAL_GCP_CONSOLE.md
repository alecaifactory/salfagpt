# 🔄 Migración Manual via GCP Console (Más Rápido)

**Problema:** bq CLI requiere re-autenticación  
**Solución:** Usar GCP Console (más simple y directo)  
**Tiempo:** 30-45 minutos

---

## 📋 **MIGRACIÓN PASO A PASO (GCP CONSOLE):**

### **PASO 1: Crear Dataset en us-east4 (2 min)**

1. Abrir: https://console.cloud.google.com/bigquery?project=salfagpt
2. Click en proyecto "salfagpt" (lado izquierdo)
3. Click "⋮" (3 puntos) → "Create dataset"
4. Configurar:
   - **Dataset ID:** `flow_analytics_east4`
   - **Location:** `us-east4` ✅
   - **Description:** "RAG embeddings - us-east4 (GREEN deployment)"
5. Click "Create dataset"

**✅ Resultado:** Dataset `flow_analytics_east4` creado en us-east4

---

### **PASO 2: Copiar Tabla (10-20 min)**

**Opción A: Copy Table (Más Fácil)**

1. En BigQuery Console
2. Navegar a: `flow_analytics` > `document_embeddings`
3. Click en la tabla
4. Click "Copy" (arriba a la derecha)
5. En el diálogo:
   - **Destination project:** salfagpt
   - **Destination dataset:** flow_analytics_east4
   - **Destination table:** document_embeddings
   - **Location:** us-east4
6. Click "Copy"
7. **Esperar 10-20 minutos** (copiar 61K chunks)

**Opción B: SQL Query (Manual)**

1. Click "Compose new query"
2. Pegar:
```sql
CREATE TABLE `salfagpt.flow_analytics_east4.document_embeddings`
PARTITION BY DATE(created_at)
CLUSTER BY user_id, source_id
AS
SELECT * FROM `salfagpt.flow_analytics.document_embeddings`
```
3. **Location:** Seleccionar "us-east4"
4. Click "Run"
5. Esperar completitud

**✅ Resultado:** 61,565 chunks copiados a us-east4

---

### **PASO 3: Verificar Copia (1 min)**

1. Click "Compose new query"
2. Pegar:
```sql
SELECT 
  'BLUE (us-central1)' as source,
  COUNT(*) as chunks
FROM `salfagpt.flow_analytics.document_embeddings`
UNION ALL
SELECT 
  'GREEN (us-east4)' as source,
  COUNT(*) as chunks  
FROM `salfagpt.flow_analytics_east4.document_embeddings`
```
3. Click "Run"

**✅ Resultado esperado:**
```
BLUE: 61,565
GREEN: 61,565 ✓
```

---

### **PASO 4: Crear Vector Index (2 min setup, 20-30 min build)**

1. Navegar a: `flow_analytics_east4` > `document_embeddings`
2. Click pestaña "Detalles"
3. Scroll abajo a sección "Índices"
4. Si hay opción "Crear índice vectorial":
   - Click "Crear índice vectorial"
   - Columna: `embedding`
   - Distance metric: `COSINE`
   - Index type: `IVF`
   - Número de listas: `1000`
   - Click "Crear"

**Si NO hay opción de índice vectorial:**
```sql
-- Ejecutar esta query en us-east4
CREATE VECTOR INDEX IF NOT EXISTS embedding_cosine_idx
ON `salfagpt.flow_analytics_east4.document_embeddings`(embedding)
OPTIONS(
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{"num_lists": 1000}'
)
```

**✅ Resultado:** Índice construyéndose (background, 20-30 min)

---

### **PASO 5: Actualizar Código (5 min)**

**Archivo:** `src/lib/bigquery-agent-search.ts`

Cambiar línea 32:
```typescript
// ❌ ANTES:
const DATASET_ID = 'flow_analytics';

// ✅ DESPUÉS:
const DATASET_ID = process.env.USE_EAST4_BIGQUERY === 'true' 
  ? 'flow_analytics_east4'  // GREEN (us-east4)
  : 'flow_analytics';        // BLUE (us-central1) fallback
```

**Otros archivos que usan BigQuery:**
- `src/lib/bigquery-optimized.ts` - Cambiar línea 24
- `src/lib/bigquery-vector-search.ts` - Cambiar constante DATASET_ID
- `src/lib/rag-indexing.ts` - Si usa dataset hardcoded

**Buscar todos:**
```bash
grep -r "flow_analytics" src/lib/*.ts | grep -v "flow_analytics_"
```

---

### **PASO 6: Test Localhost con GREEN (5 min)**

```bash
# 1. Configurar para usar GREEN
export USE_EAST4_BIGQUERY=true

# 2. Reiniciar servidor
pkill -f "astro dev"
npm run dev

# 3. Test en browser
# - Abrir http://localhost:3000/chat
# - Seleccionar S2-v2
# - Preguntar: "¿Aceite hidráulico Scania P450?"
# - Verificar:
#   ✓ Respuesta rápida (<2s)
#   ✓ Referencias [1], [2], [3]
#   ✓ Sin errores en consola

# 4. Verificar logs
# Debe decir: "Dataset: flow_analytics_east4"
```

**✅ Si funciona → Continuar a producción**  
**❌ Si falla → Quitar env var (vuelve a BLUE)**

---

### **PASO 7: Deploy a Producción (5 min)**

```bash
# Deploy con feature flag GREEN
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --update-env-vars="USE_EAST4_BIGQUERY=true"

# Verificar deployment
gcloud run revisions list \
  --service=cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --limit=1

# Test producción
curl https://salfagpt.salfagestion.cl/api/health
```

**✅ Resultado:** Producción usando GREEN (us-east4)

---

### **PASO 8: Verificar Performance (10 min)**

**En producción:**
1. Login en https://salfagpt.salfagestion.cl
2. Abrir S2-v2
3. Hacer pregunta: "¿Medidas seguridad grúa?"
4. **Medir tiempo** (F12 → Network → messages-stream)

**Esperado:**
- ❌ BLUE (antes): ~1.5-2s total
- ✅ GREEN (ahora): **~0.8-1.2s total** ⚡⚡

**Verificar logs:**
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND textPayload=~'BigQuery'" \
  --limit=20 \
  --format=json
```

Debe mostrar: `"Dataset: flow_analytics_east4"`

---

### **PASO 9: Monitor 24h (Automático)**

**Métricas a vigilar:**
- Error rate < 0.5%
- Latency p95 < 2s
- No user complaints

**Si todo OK después de 24h:**
- ✅ Migración exitosa
- ✅ Hardcodear GREEN en código
- ✅ Deprecar BLUE (no delete aún)

**Si hay problemas:**
```bash
# Rollback inmediato a BLUE
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --remove-env-vars="USE_EAST4_BIGQUERY"

# Tiempo rollback: <2 minutos
```

---

## 🎯 **PLAN ACELERADO (Si tienes prisa):**

### **Migración Express (45 min):**

```
1. GCP Console → Create dataset (2 min)
2. Copy table (20 min wait)
3. Verify counts (1 min)
4. Update code + test localhost (5 min)
5. Deploy producción (5 min)
6. Verify working (5 min)
Total: ~40 minutos + 20 min vector index (background)
```

---

## ⚠️ **PROBLEMAS COMUNES:**

### **"Reauthentication required"**
**Solución:** Usar GCP Console en vez de CLI ✅

### **"Cross-region copy not allowed"**
**Solución:** Export → Cloud Storage → Import (ya incluido arriba)

### **"Table already exists"**
**Solución:** Usar WRITE_TRUNCATE o DROP primero

---

## 📊 **CHECKLIST:**

- [ ] Dataset GREEN creado (us-east4)
- [ ] Tabla copiada (61,565 chunks)
- [ ] Conteos verificados (BLUE = GREEN)
- [ ] Código actualizado con feature flag
- [ ] Test localhost OK
- [ ] Deploy producción con GREEN
- [ ] Performance mejorado (medir)
- [ ] Sin errores en logs
- [ ] Users satisfechos

---

## 🚀 **EMPEZAR AHORA:**

**Ir a:** https://console.cloud.google.com/bigquery?project=salfagpt

**Ejecutar pasos 1-3** (30 min)

**Luego actualizar código** (5 min)

---

**¿Comenzamos con GCP Console?** 🎯

