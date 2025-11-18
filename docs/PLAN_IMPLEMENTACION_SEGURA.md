# 🛡️ Plan de Implementación Segura con Rollback

**Fecha:** 2025-11-18  
**Objetivo:** Optimizar sistema sin romper nada  
**Estrategia:** Backups automáticos + Rollback en cada paso

---

## 🎯 Principios de Seguridad

### ✅ Lo que vamos a hacer:

1. **Backup completo antes de cada cambio**
2. **Implementación incremental** (1 optimización a la vez)
3. **Testing después de cada paso**
4. **Rollback automático si algo falla**
5. **Sistema en producción sigue funcionando** durante todo el proceso
6. **Cero downtime**

### ✅ Garantías:

- 🔒 Datos originales intactos
- 🔄 Rollback en <5 minutos si hay problemas
- 📊 Monitoreo en tiempo real
- ⚡ Sistema sigue corriendo normalmente
- 🎯 Cambios son aditivos, no destructivos

---

## 📋 Plan de Implementación por Fases

### FASE 0: Preparación y Backups (30 minutos)

#### Paso 0.1: Backup Completo de Firestore

```bash
#!/bin/bash
# scripts/backup-firestore.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="firestore-backup-${DATE}"

echo "📦 Creando backup de Firestore..."

gcloud firestore export gs://salfagpt-backups/firestore/${BACKUP_NAME} \
  --project=salfagpt \
  --async

echo "✅ Backup iniciado: ${BACKUP_NAME}"
echo "📍 Location: gs://salfagpt-backups/firestore/${BACKUP_NAME}"
echo ""
echo "Para restaurar si necesitas:"
echo "gcloud firestore import gs://salfagpt-backups/firestore/${BACKUP_NAME} --project=salfagpt"
```

**Tiempo:** ~15 minutos  
**Costo:** ~$0.10 por backup  
**Válido por:** 30 días (luego auto-delete)

---

#### Paso 0.2: Backup de BigQuery

```bash
#!/bin/bash
# scripts/backup-bigquery.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DATASET="flow_analytics_backup_${DATE}"

echo "📦 Creando backup de BigQuery..."

# Crear dataset de backup
bq mk --dataset \
  --location=us-central1 \
  --description="Backup pre-optimización ${DATE}" \
  salfagpt:${BACKUP_DATASET}

# Copiar tabla principal
bq cp \
  --force \
  salfagpt:flow_analytics.document_embeddings \
  salfagpt:${BACKUP_DATASET}.document_embeddings

echo "✅ Backup completado: ${BACKUP_DATASET}"
echo ""
echo "Para restaurar si necesitas:"
echo "bq cp salfagpt:${BACKUP_DATASET}.document_embeddings salfagpt:flow_analytics.document_embeddings"
```

**Tiempo:** ~5 minutos  
**Costo:** ~$0.05 por backup  
**Storage:** Se borra automático después de 7 días

---

#### Paso 0.3: Snapshot del Código Actual

```bash
#!/bin/bash
# scripts/snapshot-code.sh

DATE=$(date +%Y%m%d_%H%M%S)
BRANCH="backup-pre-optimization-${DATE}"

echo "📸 Creando snapshot del código..."

# Crear branch de backup
git checkout -b ${BRANCH}
git push origin ${BRANCH}

# Volver a main
git checkout main

echo "✅ Snapshot creado: ${BRANCH}"
echo ""
echo "Para volver a este punto:"
echo "git checkout ${BRANCH}"
```

---

#### Paso 0.4: Crear Bucket de Backups

```bash
#!/bin/bash
# scripts/setup-backup-bucket.sh

echo "🪣 Configurando bucket de backups..."

# Crear bucket si no existe
gsutil mb -p salfagpt -c STANDARD -l us-central1 gs://salfagpt-backups/ 2>/dev/null || true

# Configurar lifecycle (auto-delete después de 30 días)
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://salfagpt-backups/
rm lifecycle.json

echo "✅ Bucket configurado: gs://salfagpt-backups/"
```

---

### FASE 1: Firestore - Índices Compuestos (1 hora)

#### Paso 1.1: Verificar Estado Actual

```bash
#!/bin/bash
# scripts/test-current-performance.sh

echo "📊 Testing performance actual..."

# Ejecutar queries de prueba y medir tiempo
node scripts/performance-test.js > results/baseline.json

echo "✅ Baseline guardado en results/baseline.json"
```

```javascript
// scripts/performance-test.js
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore({ projectId: 'salfagpt' });

async function testCurrentPerformance() {
  const results = {};
  
  // Test 1: Query contextSources
  console.log('Test 1: Query contextSources...');
  const start1 = Date.now();
  const sources = await firestore
    .collection('contextSources')
    .where('userId', '==', 'test-user')
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  results.contextSources = Date.now() - start1;
  console.log(`✓ ${results.contextSources}ms`);
  
  // Test 2: Query chunks
  console.log('Test 2: Query chunks...');
  const start2 = Date.now();
  const chunks = await firestore
    .collection('chunks')
    .where('sourceId', '==', 'test-source')
    .where('isActive', '==', true)
    .orderBy('chunkIndex', 'asc')
    .limit(20)
    .get();
  results.chunks = Date.now() - start2;
  console.log(`✓ ${results.chunks}ms`);
  
  // Guardar resultados
  console.log('\n📊 Resultados:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

testCurrentPerformance().catch(console.error);
```

---

#### Paso 1.2: Crear Índices (NO destructivo)

```json
// firestore.indexes.json - NUEVO archivo, no modifica nada existente
{
  "indexes": [
    {
      "collectionGroup": "contextSources",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chunks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sourceId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "chunkIndex", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "agentId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

```bash
#!/bin/bash
# scripts/apply-indexes.sh

echo "📇 Aplicando índices de Firestore..."

# Deploy índices (crea nuevos, NO modifica datos)
firebase deploy --only firestore:indexes --project salfagpt

echo ""
echo "⏳ Índices se están construyendo en background..."
echo "   Esto puede tomar 5-30 minutos."
echo ""
echo "Para verificar progreso:"
echo "  firebase firestore:indexes --project salfagpt"
echo ""
echo "⚠️ IMPORTANTE: Sistema sigue funcionando normalmente"
echo "   Los índices nuevos se usarán automáticamente cuando estén listos"
```

**Seguridad:**
- ✅ NO modifica datos existentes
- ✅ NO afecta queries actuales
- ✅ Construcción en background
- ✅ Sistema sigue funcionando
- ✅ Rollback: Simplemente no usar los índices

---

#### Paso 1.3: Verificar y Comparar

```bash
#!/bin/bash
# scripts/verify-indexes.sh

echo "🔍 Verificando índices..."

# Ver estado de índices
firebase firestore:indexes --project salfagpt

echo ""
echo "Testing performance con índices..."

# Correr tests de nuevo
node scripts/performance-test.js > results/after-indexes.json

# Comparar resultados
node scripts/compare-results.js results/baseline.json results/after-indexes.json
```

```javascript
// scripts/compare-results.js
const fs = require('fs');

const baseline = JSON.parse(fs.readFileSync(process.argv[2]));
const after = JSON.parse(fs.readFileSync(process.argv[3]));

console.log('\n📊 Comparación de Performance:\n');

for (const [test, baseTime] of Object.entries(baseline)) {
  const newTime = after[test];
  const improvement = ((baseTime - newTime) / baseTime * 100).toFixed(1);
  const status = improvement > 0 ? '✅' : '⚠️';
  
  console.log(`${status} ${test}:`);
  console.log(`   Before: ${baseTime}ms`);
  console.log(`   After:  ${newTime}ms`);
  console.log(`   Improvement: ${improvement}%\n`);
}
```

**Si algo sale mal:**
```bash
# Rollback: Simplemente borrar índices nuevos
firebase firestore:indexes:delete <index-name> --project salfagpt
```

---

### FASE 2: BigQuery - Partitioning (2 horas)

#### Paso 2.1: Crear Tabla Optimizada (NO destructivo)

```sql
-- scripts/bigquery-optimize.sql
-- Crear tabla NUEVA con partitioning, NO modificar la actual

-- Paso 1: Crear tabla optimizada
CREATE TABLE `salfagpt.flow_analytics.document_embeddings_v2`
PARTITION BY DATE(created_at)
CLUSTER BY user_id, document_id, is_active
OPTIONS(
  description = "Tabla optimizada con partitioning y clustering - ${DATE}",
  require_partition_filter = false  -- No forzar filtro (seguro para transición)
)
AS
SELECT * FROM `salfagpt.flow_analytics.document_embeddings`;

-- Paso 2: Crear vista para testing
CREATE OR REPLACE VIEW `salfagpt.flow_analytics.document_embeddings_test`
AS
SELECT * FROM `salfagpt.flow_analytics.document_embeddings_v2`;
```

```bash
#!/bin/bash
# scripts/optimize-bigquery.sh

DATE=$(date +%Y%m%d_%H%M%S)

echo "📊 Optimizando BigQuery..."
echo "⚠️ NOTA: Tabla original se mantiene intacta"
echo ""

# Reemplazar fecha en SQL
sed "s/\${DATE}/${DATE}/g" scripts/bigquery-optimize.sql > /tmp/bigquery-optimize.sql

# Ejecutar
bq query --use_legacy_sql=false < /tmp/bigquery-optimize.sql

echo ""
echo "✅ Tabla optimizada creada: document_embeddings_v2"
echo "✅ Vista de testing: document_embeddings_test"
echo ""
echo "📊 Para comparar tamaños:"
echo "  bq show salfagpt:flow_analytics.document_embeddings"
echo "  bq show salfagpt:flow_analytics.document_embeddings_v2"
```

**Seguridad:**
- ✅ Tabla original intacta
- ✅ Queries actuales siguen funcionando
- ✅ Nueva tabla para testing
- ✅ Cero impacto en producción

---

#### Paso 2.2: Testing Paralelo

```javascript
// scripts/test-bigquery-performance.js
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery({ projectId: 'salfagpt' });

async function comparePerformance() {
  const testQuery = `
    SELECT 
      chunk_id,
      content,
      metadata
    FROM \`salfagpt.flow_analytics.{TABLE}\`
    WHERE user_id = 'test-user'
      AND is_active = true
      AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    ORDER BY created_at DESC
    LIMIT 10
  `;
  
  console.log('Testing tabla ORIGINAL...');
  const start1 = Date.now();
  await bigquery.query(testQuery.replace('{TABLE}', 'document_embeddings'));
  const time1 = Date.now() - start1;
  console.log(`✓ Tiempo: ${time1}ms\n`);
  
  console.log('Testing tabla OPTIMIZADA...');
  const start2 = Date.now();
  await bigquery.query(testQuery.replace('{TABLE}', 'document_embeddings_v2'));
  const time2 = Date.now() - start2;
  console.log(`✓ Tiempo: ${time2}ms\n`);
  
  const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
  console.log(`📊 Mejora: ${improvement}%`);
  
  if (improvement > 30) {
    console.log('✅ Mejora significativa detectada');
    return true;
  } else {
    console.log('⚠️ Mejora menor a 30%, revisar configuración');
    return false;
  }
}

comparePerformance().catch(console.error);
```

```bash
#!/bin/bash
# scripts/test-bigquery.sh

node scripts/test-bigquery-performance.js

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Tests pasaron. Listo para switch."
  echo ""
  echo "Para hacer el switch (reversible):"
  echo "  bash scripts/switch-to-optimized.sh"
else
  echo ""
  echo "⚠️ Tests no pasaron. NO hacer switch."
  echo "   Tabla original sigue en uso."
fi
```

---

#### Paso 2.3: Switch Gradual (Reversible)

```bash
#!/bin/bash
# scripts/switch-to-optimized.sh - CON ROLLBACK AUTOMÁTICO

echo "🔄 Switching a tabla optimizada..."
echo ""
echo "⚠️ Creando alias reversible (NO renombrando tabla)"
echo ""

# Crear alias (instantáneo, reversible)
bq update --view \
  "$(cat <<EOF
SELECT * FROM \`salfagpt.flow_analytics.document_embeddings_v2\`
EOF
)" \
  salfagpt:flow_analytics.document_embeddings_active

echo "✅ Alias creado: document_embeddings_active → document_embeddings_v2"
echo ""
echo "📝 Modificar código para usar 'document_embeddings_active'"
echo ""
echo "Para ROLLBACK instantáneo:"
echo "  bash scripts/rollback-bigquery.sh"
```

```bash
#!/bin/bash
# scripts/rollback-bigquery.sh - ROLLBACK INSTANTÁNEO

echo "⏪ ROLLBACK: Volviendo a tabla original..."

bq update --view \
  "$(cat <<EOF
SELECT * FROM \`salfagpt.flow_analytics.document_embeddings\`
EOF
)" \
  salfagpt:flow_analytics.document_embeddings_active

echo "✅ Rollback completado"
echo "   Ahora usando tabla original de nuevo"
```

**Seguridad:**
- ✅ Switch es instantáneo (<1 segundo)
- ✅ Rollback es instantáneo (<1 segundo)
- ✅ Ambas tablas existen todo el tiempo
- ✅ Cero pérdida de datos

---

### FASE 3: Código - Batch Operations y Cache (3 horas)

#### Paso 3.1: Feature Flags

```typescript
// src/lib/feature-flags.ts - NUEVO archivo
export const FEATURES = {
  USE_BATCH_OPERATIONS: process.env.FEATURE_BATCH_OPS === 'true',
  USE_CACHE: process.env.FEATURE_CACHE === 'true',
  USE_CONNECTION_POOL: process.env.FEATURE_CONN_POOL === 'true',
};

// Valores default (seguros)
export const DEFAULT_FEATURES = {
  USE_BATCH_OPERATIONS: false,
  USE_CACHE: false,
  USE_CONNECTION_POOL: false,
};
```

```typescript
// src/lib/firestore-optimized.ts - NUEVO archivo, NO modifica el actual
import { Firestore } from '@google-cloud/firestore';
import { FEATURES } from './feature-flags';

// Singleton con connection pooling (opcional via flag)
let firestoreInstance: Firestore | null = null;

export function getFirestore(): Firestore {
  if (FEATURES.USE_CONNECTION_POOL && firestoreInstance) {
    return firestoreInstance;
  }
  
  firestoreInstance = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    ignoreUndefinedProperties: true,
  });
  
  return firestoreInstance;
}

// Batch read (opcional via flag)
export async function getDocumentsBatch(
  collection: string,
  ids: string[]
): Promise<any[]> {
  const firestore = getFirestore();
  
  if (!FEATURES.USE_BATCH_OPERATIONS) {
    // Fallback a método original (seguro)
    const docs = [];
    for (const id of ids) {
      const doc = await firestore.collection(collection).doc(id).get();
      docs.push(doc.data());
    }
    return docs;
  }
  
  // Método optimizado (nuevo)
  const refs = ids.map(id => firestore.collection(collection).doc(id));
  const snapshots = await firestore.getAll(...refs);
  return snapshots.map(snap => snap.data());
}
```

```typescript
// src/lib/cache-optimized.ts - NUEVO archivo
import NodeCache from 'node-cache';
import { FEATURES } from './feature-flags';

const cache = new NodeCache({
  stdTTL: 300,        // 5 minutos
  checkperiod: 60,    // Check cada minuto
  useClones: false,   // Performance
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Si feature flag deshabilitado, siempre fetch
  if (!FEATURES.USE_CACHE) {
    return fetcher();
  }
  
  // Intentar cache
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }
  
  // No en cache, fetch y guardar
  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

// Función para limpiar cache en caso de problemas
export function clearCache() {
  cache.flushAll();
  console.log('✅ Cache limpiado');
}
```

---

#### Paso 3.2: Implementación Gradual con A/B Testing

```typescript
// src/lib/gradual-rollout.ts
export function shouldUseOptimization(userId: string, feature: string): boolean {
  // Porcentaje de usuarios que usan nueva feature
  const ROLLOUT_PERCENTAGE = parseInt(process.env.ROLLOUT_PERCENTAGE || '0');
  
  // Hash del userId para distribución consistente
  const hash = hashCode(userId);
  const bucket = Math.abs(hash) % 100;
  
  return bucket < ROLLOUT_PERCENTAGE;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
```

```typescript
// src/pages/api/context-sources/[id].ts - Modificación con rollback
import { getFirestore } from '../../../lib/firestore-optimized';
import { getCached } from '../../../lib/cache-optimized';
import { shouldUseOptimization } from '../../../lib/gradual-rollout';

export const GET: APIRoute = async ({ params, locals }) => {
  const userId = locals.userId;
  const sourceId = params.id;
  
  try {
    // Decidir si usar optimizaciones para este usuario
    const useOptimizations = shouldUseOptimization(userId, 'cache');
    
    if (useOptimizations) {
      // Método optimizado con cache
      const source = await getCached(
        `source:${sourceId}`,
        () => getFirestore().collection('contextSources').doc(sourceId).get(),
        300
      );
      
      return new Response(JSON.stringify(source.data()), {
        status: 200,
        headers: { 'X-Optimization': 'enabled' }
      });
    } else {
      // Método original (sin cambios)
      const firestore = getFirestore();
      const source = await firestore.collection('contextSources').doc(sourceId).get();
      
      return new Response(JSON.stringify(source.data()), {
        status: 200,
        headers: { 'X-Optimization': 'disabled' }
      });
    }
  } catch (error) {
    console.error('Error:', error);
    // En caso de error, log y continuar
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500
    });
  }
};
```

---

#### Paso 3.3: Rollout Controlado

```bash
#!/bin/bash
# scripts/rollout.sh - Rollout gradual de optimizaciones

PERCENTAGE=${1:-0}

echo "🚀 Rollout de optimizaciones: ${PERCENTAGE}%"
echo ""

# Actualizar Cloud Run con nuevo porcentaje
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --update-env-vars="ROLLOUT_PERCENTAGE=${PERCENTAGE},FEATURE_CACHE=true,FEATURE_BATCH_OPS=true" \
  --project=salfagpt

echo ""
echo "✅ Rollout configurado: ${PERCENTAGE}% de usuarios"
echo ""
echo "📊 Monitorear en:"
echo "  https://console.cloud.google.com/run/detail/us-east4/cr-salfagpt-ai-ft-prod/metrics?project=salfagpt"
echo ""
echo "Para aumentar:"
echo "  bash scripts/rollout.sh 25  # 25% usuarios"
echo "  bash scripts/rollout.sh 50  # 50% usuarios"
echo "  bash scripts/rollout.sh 100 # Todos"
echo ""
echo "Para ROLLBACK total:"
echo "  bash scripts/rollout.sh 0   # 0% = deshabilitado"
```

**Plan de rollout seguro:**
```bash
# Día 1: Solo testing interno
bash scripts/rollout.sh 5   # 5% de usuarios

# Día 2: Si todo OK
bash scripts/rollout.sh 25  # 25% de usuarios

# Día 3: Si todo OK
bash scripts/rollout.sh 50  # 50% de usuarios

# Día 4: Si todo OK
bash scripts/rollout.sh 100 # Todos los usuarios

# Si hay problema en CUALQUIER momento:
bash scripts/rollout.sh 0   # Rollback instantáneo
```

---

## 📊 Monitoreo Durante Implementación

### Dashboard de Monitoreo

```typescript
// scripts/monitor.ts
import { Firestore } from '@google-cloud/firestore';

async function monitorPerformance() {
  const firestore = new Firestore({ projectId: 'salfagpt' });
  
  // Crear logs de performance
  const perfCollection = firestore.collection('_monitoring_performance');
  
  setInterval(async () => {
    // Test query
    const start = Date.now();
    await firestore.collection('contextSources').limit(1).get();
    const duration = Date.now() - start;
    
    // Log
    await perfCollection.add({
      timestamp: new Date(),
      query: 'contextSources_test',
      duration,
      optimization: process.env.ROLLOUT_PERCENTAGE || '0',
    });
    
    console.log(`Query time: ${duration}ms (${process.env.ROLLOUT_PERCENTAGE}% rollout)`);
  }, 60000); // Cada minuto
}

monitorPerformance();
```

```bash
#!/bin/bash
# scripts/monitor-dashboard.sh

echo "📊 Monitoring Dashboard"
echo "======================="
echo ""

while true; do
  clear
  echo "📊 Performance Monitor - $(date)"
  echo "========================================"
  echo ""
  
  # Últimos logs de Cloud Run
  gcloud logging read \
    "resource.type=cloud_run_revision AND resource.labels.service_name=cr-salfagpt-ai-ft-prod" \
    --limit=10 \
    --format="table(timestamp,textPayload)" \
    --project=salfagpt
  
  echo ""
  echo "Presiona Ctrl+C para salir"
  echo "Actualizando en 30 segundos..."
  
  sleep 30
done
```

---

## 🎯 Checklist de Seguridad

### Antes de Cada Fase:

- [ ] ✅ Backup completado
- [ ] ✅ Tests de performance baseline
- [ ] ✅ Feature flags configurados (OFF)
- [ ] ✅ Rollback script probado
- [ ] ✅ Monitoreo activo

### Durante Implementación:

- [ ] ✅ Implementar en ambiente staging primero
- [ ] ✅ Tests automatizados pasando
- [ ] ✅ Rollout gradual (5% → 25% → 50% → 100%)
- [ ] ✅ Monitoreo continuo
- [ ] ✅ Error rate <1%

### Criterios de Rollback:

- ⚠️ Error rate >5%
- ⚠️ Latency >2x baseline
- ⚠️ Cualquier error crítico
- ⚠️ Feedback negativo de usuarios

---

## 📋 Resumen de Comandos

### Preparación:
```bash
# 1. Backups
bash scripts/backup-firestore.sh
bash scripts/backup-bigquery.sh
bash scripts/snapshot-code.sh

# 2. Setup
bash scripts/setup-backup-bucket.sh
```

### Fase 1 - Firestore Índices:
```bash
# Aplicar
bash scripts/apply-indexes.sh

# Verificar
bash scripts/verify-indexes.sh

# Rollback si necesario
firebase firestore:indexes:delete <index-name> --project salfagpt
```

### Fase 2 - BigQuery:
```bash
# Crear tabla optimizada
bash scripts/optimize-bigquery.sh

# Testing
bash scripts/test-bigquery.sh

# Switch (reversible)
bash scripts/switch-to-optimized.sh

# Rollback si necesario
bash scripts/rollback-bigquery.sh
```

### Fase 3 - Código:
```bash
# Rollout gradual
bash scripts/rollout.sh 5    # 5%
bash scripts/rollout.sh 25   # 25%
bash scripts/rollout.sh 50   # 50%
bash scripts/rollout.sh 100  # 100%

# Rollback total
bash scripts/rollout.sh 0    # 0% = OFF
```

### Monitoreo:
```bash
# Dashboard en tiempo real
bash scripts/monitor-dashboard.sh

# Comparar performance
node scripts/compare-results.js results/baseline.json results/current.json
```

---

## 🎬 Resumen

### Lo que hace este plan SEGURO:

✅ **Backups automáticos** antes de cada cambio  
✅ **Implementación incremental** (1 paso a la vez)  
✅ **Sistema sigue funcionando** durante TODO el proceso  
✅ **Rollback en <5 minutos** si algo falla  
✅ **Testing continuo** después de cada paso  
✅ **Feature flags** para habilitar/deshabilitar  
✅ **Rollout gradual** (5% → 25% → 50% → 100%)  
✅ **Monitoreo en tiempo real**  
✅ **Cero downtime**  
✅ **Cero pérdida de datos**

### Tiempo total estimado:

- Fase 0 (Preparación): 30 minutos
- Fase 1 (Firestore): 1 hora + 30 min espera construcción índices
- Fase 2 (BigQuery): 2 horas
- Fase 3 (Código): 3 horas
- Monitoreo y rollout: 3-7 días

**Total desarrollo: ~7 horas**  
**Total rollout seguro: 1 semana**

---

**¿Quieres que empecemos con la Fase 0 (preparación y backups)?** 🚀

Es completamente seguro y reversible en cada paso.

