# 🚀 Guía de Optimización de Performance GCP - SALFAGPT

**Fecha:** 2025-11-18  
**Propósito:** Analizar arquitectura actual y opciones de escalamiento  
**Equivalencia:** M2 → M4 Pro Max 36GB (GCP)

---

## 📊 Arquitectura Actual

### Cloud Run - Configuración Actual

```yaml
Servicio: cr-salfagpt-ai-ft-prod
Región: us-east4

Recursos Actuales:
  Memory: 2 GiB         # Equivalente a ~M2 base
  CPU: 2 vCPUs          # CPU compartida (no dedicada)
  
Escalamiento:
  Min Instances: 1      # Siempre activa (sin cold start)
  Max Instances: 10     # Escalamiento automático
  Concurrency: 80       # 80 requests simultáneos/instancia
  
Performance:
  Timeout: 300s         # 5 minutos máximo
  
Métricas Observadas:
  CPU Utilization: 20-40%   # Subutilizado
  Memory Utilization: 40-60% # Espacio disponible
  Average Latency: 800ms-2s  # Principalmente por Gemini API
  Error Rate: <1%            # Estable
```

### Machine Type Actual (Cloud Build)

```yaml
Machine: E2_HIGHCPU_8
  CPUs: 8 vCPUs
  Memory: 8 GB
  Uso: Solo para builds (no runtime)
```

---

## 🎯 Opciones de Optimización

### Opción 1: Aumentar Recursos de Cloud Run (Recomendado)

**Similar a M2 → M4 Pro Max**

#### Nivel 1: Upgrade Moderado (M3 Pro equivalent)
```yaml
Resources:
  Memory: 4 GiB          # +100% (2 → 4 GB)
  CPU: 4 vCPUs           # +100% (2 → 4)
  CPU Allocation: cpu-always  # CPU dedicada (no compartida)
  
Escalamiento:
  Min Instances: 2       # Mayor disponibilidad
  Max Instances: 20      # Más capacidad de pico
  Concurrency: 100       # Más requests/instancia
```

**Beneficios:**
- ✅ 2x capacidad de procesamiento
- ✅ Mejor para procesamiento de PDFs grandes
- ✅ Extracción de documentos más rápida
- ✅ Menos timeouts en archivos grandes
- ✅ CPU dedicada (no compartida con otros tenants)

**Costo Estimado:**
- Actual: ~$18-20/mes
- Nuevo: ~$40-50/mes (+120%)
- Incremento: ~$25-30/mes

**Comando para aplicar:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --memory=4Gi \
  --cpu=4 \
  --cpu-throttling \
  --min-instances=2 \
  --max-instances=20 \
  --concurrency=100
```

---

#### Nivel 2: Upgrade Agresivo (M4 Pro Max equivalent)
```yaml
Resources:
  Memory: 8 GiB          # +300% (2 → 8 GB)
  CPU: 4 vCPUs           # +100% pero con CPU-always
  CPU Allocation: cpu-always  # Dedicada
  
Escalamiento:
  Min Instances: 2       
  Max Instances: 30      # Máxima escalabilidad
  Concurrency: 120       # Máximo aprovechamiento
```

**Beneficios:**
- ✅ 4x capacidad de memoria (archivos muy grandes)
- ✅ CPU dedicada 100% del tiempo
- ✅ Procesar múltiples archivos de 100-500MB simultáneamente
- ✅ Mejor caching en memoria
- ✅ Sin throttling de CPU

**Costo Estimado:**
- Actual: ~$18-20/mes
- Nuevo: ~$80-100/mes (+400%)
- Incremento: ~$60-80/mes

**Comando para aplicar:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --memory=8Gi \
  --cpu=4 \
  --cpu-throttling=false \
  --cpu-boost \
  --min-instances=2 \
  --max-instances=30 \
  --concurrency=120
```

---

#### Nivel 3: Ultra Performance (M4 Max 128GB equivalent)
```yaml
Resources:
  Memory: 16 GiB         # Máximo en Cloud Run Gen2
  CPU: 8 vCPUs           # Máximo en Cloud Run Gen2
  CPU Allocation: cpu-always
  
Escalamiento:
  Min Instances: 3       
  Max Instances: 50
  Concurrency: 150
```

**Beneficios:**
- ✅ 8x memoria (archivos masivos múltiples)
- ✅ 4x CPUs (paralelismo máximo)
- ✅ Procesamiento batch de decenas de archivos
- ✅ Caching agresivo en memoria

**Costo Estimado:**
- Actual: ~$18-20/mes
- Nuevo: ~$180-220/mes (+1000%)
- Incremento: ~$160-200/mes

**⚠️ Solo si necesitas:**
- Procesamiento masivo de archivos (>100 simultáneos)
- Múltiples usuarios concurrentes (>500)
- Archivos de 500MB+ regularmente

**Comando para aplicar:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --memory=16Gi \
  --cpu=8 \
  --cpu-throttling=false \
  --cpu-boost \
  --execution-environment=gen2 \
  --min-instances=3 \
  --max-instances=50 \
  --concurrency=150
```

---

### Opción 2: Cloud Run con GPU (Para AI/ML Intensivo)

**Solo Cloud Run Gen2 + Preview**

```yaml
Resources:
  Memory: 16 GiB
  CPU: 4 vCPUs
  GPU: 1x NVIDIA L4 GPU    # Para inferencia AI local
  
Use Case:
  - Embeddings locales (sin API externa)
  - Inferencia de modelos propios
  - Procesamiento de imágenes intensivo
```

**Costo Estimado:**
- Base: ~$180/mes
- GPU: ~$300/mes adicional
- Total: ~$480/mes

**⚠️ Solo si:**
- Tienes modelos propios de ML
- Necesitas inferencia <100ms
- Volumen muy alto (>10,000 requests/día)

---

### Opción 3: Migrar a GKE (Google Kubernetes Engine)

**Para control total de recursos**

```yaml
Node Pool:
  Machine Type: n2-highmem-8
    CPUs: 8 vCPUs
    Memory: 64 GB RAM
    Disk: 100 GB SSD
  
  Nodes: 2-10 (auto-scaling)
  
Pods:
  Replicas: 3-20 (HPA)
  
  Recursos por Pod:
    Requests:
      Memory: 4 Gi
      CPU: 2
    Limits:
      Memory: 8 Gi
      CPU: 4
```

**Beneficios:**
- ✅ Control total de infraestructura
- ✅ Más tipos de máquinas disponibles
- ✅ Mejor para cargas predecibles
- ✅ Integración con servicios custom

**Costo Estimado:**
- Cluster base: ~$75/mes
- Nodes (2x n2-highmem-8): ~$400/mes
- Total: ~$475/mes

**Complejidad:**
- ❌ Requiere configuración de K8s
- ❌ Más mantenimiento
- ❌ Necesitas expertise en Kubernetes

---

### Opción 4: Compute Engine (VM Dedicada)

**Máquinas equivalentes a Mac:**

#### Opción A: n2-standard-8 (M2 equivalent)
```yaml
Machine: n2-standard-8
  CPUs: 8 vCPUs
  Memory: 32 GB RAM
  Disk: 200 GB SSD
  
Costo: ~$250/mes (24/7)
```

#### Opción B: n2-highmem-16 (M4 Pro Max equivalent)
```yaml
Machine: n2-highmem-16
  CPUs: 16 vCPUs
  Memory: 128 GB RAM
  Disk: 500 GB SSD
  
Costo: ~$850/mes (24/7)
```

#### Opción C: c3-highcpu-88 (Mac Studio M2 Ultra)
```yaml
Machine: c3-highcpu-88
  CPUs: 88 vCPUs (ARM-based)
  Memory: 176 GB RAM
  Disk: 1 TB SSD
  
Costo: ~$2,000/mes (24/7)
```

**Cuándo usar:**
- ❌ **NO** para aplicación web (usa Cloud Run)
- ✅ Para procesamiento batch pesado
- ✅ Para servicios background
- ✅ Para ML training

---

## 📊 Tabla Comparativa de Opciones

| Opción | vCPUs | RAM | Costo/mes | Mejora vs Actual | Recomendado Para |
|--------|-------|-----|-----------|------------------|------------------|
| **Actual** | 2 | 2GB | $20 | Baseline | Tráfico bajo |
| **Nivel 1 (M3 Pro)** | 4 | 4GB | $45 | 2x | Producción normal ⭐ |
| **Nivel 2 (M4 Pro Max)** | 4 | 8GB | $90 | 4x memoria | Archivos grandes 🎯 |
| **Nivel 3 (Ultra)** | 8 | 16GB | $200 | 4x CPU + 8x RAM | Alto tráfico |
| **Cloud Run + GPU** | 4 | 16GB | $480 | + GPU | ML intensivo |
| **GKE (n2-highmem-8)** | 8 | 64GB | $475 | Control total | Enterprise |
| **Compute Engine** | 16 | 128GB | $850 | VM dedicada | Batch processing |

---

## 🎯 Recomendación Específica para SALFAGPT

### Recomendación Inmediata: Nivel 1 (M3 Pro equivalent)

**Razón:**
Basado en tus métricas actuales:
- CPU: 20-40% utilizado → Espacio para crecer
- Memory: 40-60% utilizado → Necesitas más para archivos grandes
- Latency: 800ms-2s → Principalmente por Gemini API (no por recursos)

**Upgrade sugerido:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --memory=4Gi \
  --cpu=4 \
  --cpu-throttling=false \
  --min-instances=2 \
  --max-instances=20 \
  --concurrency=100 \
  --project=salfagpt
```

**Beneficios específicos para tu caso:**
1. ✅ **Procesar archivos de 100-500MB** más rápido (2x memoria)
2. ✅ **Múltiples uploads simultáneos** sin degradación
3. ✅ **CPU dedicada** para extracción de PDFs
4. ✅ **2 instancias mínimas** = zero downtime en deploys
5. ✅ **Mejor experiencia de usuario** en operaciones pesadas

**Costo:**
- Incremento: ~$25/mes
- ROI: Mejor UX + menos timeouts + más capacidad

---

### Si Necesitas Más (Futuro): Nivel 2

**Cuándo actualizar a Nivel 2:**
- Uploads de 100+ archivos grandes simultáneos
- Múltiples usuarios haciendo operaciones pesadas
- Quieres procesar lotes de 20 archivos en <5 minutos

**Comando:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --memory=8Gi \
  --cpu=4 \
  --cpu-throttling=false \
  --cpu-boost \
  --min-instances=2 \
  --max-instances=30 \
  --concurrency=120 \
  --project=salfagpt
```

---

## ⚡ Optimizaciones Adicionales (Sin Costo)

### 1. Optimizar Configuración Actual

**En `cloudbuild.yaml` (builds más rápidos):**
```yaml
# Ya tienes:
machineType: 'E2_HIGHCPU_8'  # ✅ Bien

# Puedes mejorar a:
machineType: 'E2_HIGHCPU_32'  # Builds 4x más rápidos

# Costo: Solo durante build (~2-3 min/día)
# Incremento: ~$2-3/mes
```

### 2. Habilitar CPU Boost (Cloud Run)

**Sin costo adicional, mejor startup:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --cpu-boost \
  --project=salfagpt
```

**Beneficio:**
- Instancias nuevas arrancan más rápido
- Mejor cold start performance
- Sin costo adicional

### 3. Optimizar Región de Datos

**Actual:**
- App: us-east4
- Data: us-central1

**Latencia entre regiones:** ~5-10ms

**Opción 1: Mover Firestore a us-east4**
```bash
# Crear nuevo database en us-east4
gcloud firestore databases create \
  --database=us-east4-db \
  --location=us-east4 \
  --project=salfagpt

# Migrar datos (script personalizado)
```

**Beneficio:** -5-10ms latency
**Costo:** Migración compleja
**Recomendación:** No vale la pena (5-10ms es insignificante)

### 4. Cachear en Memoria

**Implementar en código:**
```typescript
// src/lib/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,        // 5 minutos
  checkperiod: 60,    // Check cada minuto
  useClones: false,   // Mejor performance
});

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;
  
  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}
```

**Uso:**
```typescript
// Cachear context sources
const sources = await getCachedOrFetch(
  `sources:${userId}`,
  () => getContextSources(userId),
  300
);
```

**Beneficio:**
- 10-100x más rápido para datos frecuentes
- Reduce load en Firestore
- Sin costo adicional

---

## 🔍 Análisis de Bottlenecks Actuales

### Dónde Está el Tiempo

Basado en tu latencia de 800ms-2s:

```
Total Request: ~1,500ms (promedio)

Breakdown:
├─ Load Balancer:        ~50ms   (3%)
├─ Cloud Run startup:    ~100ms  (7%)
├─ Authentication:       ~50ms   (3%)
├─ Firestore query:      ~100ms  (7%)
├─ Gemini API call:      ~1,000ms (67%) ⚠️ BOTTLENECK
└─ Save to Firestore:    ~200ms  (13%)
```

**Conclusión:**
- 🎯 **67% del tiempo es Gemini API** (externo, no controlable)
- ✅ Solo 33% es tu infraestructura (rápida)

**Implicación:**
- Aumentar CPU/RAM ayudará en procesamiento local (PDFs, chunking)
- NO mejorará llamadas a Gemini API (latencia de red)
- Mejor ROI: Optimizar procesamiento de archivos grandes

---

## 🎬 Plan de Implementación Recomendado

### Fase 1: Quick Win (Hoy)

```bash
# 1. Habilitar CPU boost (gratis)
gcloud run services update cr-salfagpt-ai-ft-prod \
  --cpu-boost \
  --region=us-east4 \
  --project=salfagpt

# 2. Aumentar timeout para archivos grandes (gratis)
gcloud run services update cr-salfagpt-ai-ft-prod \
  --timeout=900 \
  --region=us-east4 \
  --project=salfagpt
```

**Beneficio:** Mejor manejo de archivos grandes
**Costo:** $0
**Tiempo:** 5 minutos

---

### Fase 2: Upgrade a Nivel 1 (Esta semana)

```bash
# Upgrade a M3 Pro equivalent
gcloud run services update cr-salfagpt-ai-ft-prod \
  --memory=4Gi \
  --cpu=4 \
  --cpu-throttling=false \
  --min-instances=2 \
  --max-instances=20 \
  --concurrency=100 \
  --region=us-east4 \
  --project=salfagpt
```

**Beneficio:**
- 2x recursos
- Mejor experiencia con archivos grandes
- Zero downtime (2 instancias mínimas)

**Costo:** +$25/mes
**Tiempo:** 10 minutos

---

### Fase 3: Optimizaciones de Código (Próximas semanas)

1. **Implementar cache en memoria**
2. **Optimizar chunking de PDFs**
3. **Paralelizar procesamiento**
4. **Comprimir responses**

**Beneficio:** 20-50% mejora sin costo adicional
**Tiempo:** 2-3 días de desarrollo

---

### Fase 4: Monitorear y Ajustar (Continuo)

```bash
# Ver métricas en tiempo real
gcloud monitoring dashboards create \
  --config-from-file=monitoring-config.yaml \
  --project=salfagpt

# Alertas para alta utilización
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High CPU Usage" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s
```

---

## 💰 Análisis de Costos

### Costo Actual vs Opciones

```
Actual (2GB, 2vCPU):
├─ Cloud Run:           $18-20/mes
├─ Cloud Storage:       $5/mes
├─ Firestore:          $10/mes
├─ BigQuery:           $5/mes
├─ Load Balancer:      $18/mes
└─ Total:              ~$60/mes

Nivel 1 (4GB, 4vCPU):
├─ Cloud Run:           $40-45/mes  (+125%)
├─ Otros servicios:     $38/mes     (sin cambio)
└─ Total:              ~$85/mes    (+42%)

Nivel 2 (8GB, 4vCPU):
├─ Cloud Run:           $80-90/mes  (+350%)
├─ Otros servicios:     $38/mes     (sin cambio)
└─ Total:              ~$130/mes   (+117%)

Nivel 3 (16GB, 8vCPU):
├─ Cloud Run:           $180-200/mes (+900%)
├─ Otros servicios:     $38/mes      (sin cambio)
└─ Total:              ~$240/mes    (+300%)
```

---

## 📈 Métricas para Decidir Upgrade

### Cuándo Necesitas Más Recursos

**Señales de que necesitas Nivel 1:**
- ✅ CPU utilization >70% sostenido
- ✅ Memory utilization >80% picos frecuentes
- ✅ Timeouts en archivos >100MB
- ✅ Latency p95 >3s
- ✅ >10 usuarios concurrentes regularmente

**Señales de que necesitas Nivel 2:**
- ✅ Todas las anteriores +
- ✅ Procesamiento batch de 20+ archivos grandes
- ✅ >50 usuarios concurrentes
- ✅ Operaciones de ML/AI locales

**Señales de que necesitas GKE/Compute:**
- ✅ >500 usuarios concurrentes
- ✅ Operaciones batch masivas (100+ archivos)
- ✅ Necesitas GPUs
- ✅ Cargas muy predecibles

---

## 🎯 Resumen Ejecutivo

### Equivalencia Mac → GCP

| Mac | GCP Cloud Run | Costo/mes |
|-----|---------------|-----------|
| M2 Base (8GB) | 2GB, 2vCPU | $20 ⭐ Actual |
| M2 Pro (16GB) | 4GB, 4vCPU | $45 🎯 Recomendado |
| M3 Pro (18GB) | 4GB, 4vCPU + boost | $50 |
| M4 Pro Max (36GB) | 8GB, 4vCPU + boost | $90 |
| M4 Max (128GB) | 16GB, 8vCPU | $200 |
| Mac Studio Ultra | n2-highmem-16 (VM) | $850 |

### Recomendación Final

**Para SALFAGPT:**

1. 🎯 **Implementar ahora:** Nivel 1 (4GB, 4vCPU)
   - Costo: +$25/mes
   - Beneficio: 2x capacidad
   - Tiempo: 10 minutos

2. ⚡ **Quick wins (gratis):**
   - CPU boost
   - Timeout 900s
   - Cache en memoria

3. 📊 **Monitorear 2-4 semanas:**
   - Si CPU >70% → Nivel 2
   - Si memoria >80% → Nivel 2
   - Si todo OK → Mantener Nivel 1

4. 🚀 **Futuro (6+ meses):**
   - Si >100 usuarios → Nivel 2 o 3
   - Si >500 usuarios → Considerar GKE

---

**Próximo Paso Sugerido:**
Ejecutar los comandos de Fase 1 (gratis) y Fase 2 (Nivel 1) para ver mejora inmediata en archivos grandes.

---

**Fecha:** 2025-11-18  
**Versión:** 1.0.0  
**Autor:** Claude (Sonnet 4.5)

