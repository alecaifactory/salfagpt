# Guía de Migración de Datos: GCP → AWS
## Firestore to DynamoDB, Cloud Storage to S3

**Fecha:** 24 de Noviembre, 2025  
**Versión:** 1.0  
**Propósito:** Migración segura de datos existentes

---

## 🎯 Objetivo

Migrar datos existentes de cartolas bancarias desde **Google Cloud Platform** (Firestore + Cloud Storage) a **AWS** (DynamoDB + S3) manteniendo:
- ✅ 100% integridad de datos
- ✅ Cero pérdida de información
- ✅ Mínimo downtime
- ✅ Rollback disponible

---

## 📊 Inventario de Datos

### Datos en GCP (Actual)

**Firestore Collections:**
```
Collection: context_sources (o cartola_extractions si existe)
├── Documentos: ~X documentos
├── Campos:
│   ├── id: string
│   ├── userId: string
│   ├── organizationId: string (opcional)
│   ├── type: 'pdf' | 'csv' | ...
│   ├── extractedData: string (JSON como texto)
│   ├── metadata: object
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
└── Tamaño estimado: ~Y GB
```

**Cloud Storage Buckets:**
```
Bucket: gen-lang-client-0986191192-uploads (o similar)
├── Archivos PDF: ~Z archivos
├── Tamaño total: ~W GB
├── Retención: 7 días (lifecycle)
└── Ubicación: us-central1
```

---

## 🔄 Estrategia de Migración

### Opción 1: Migración Limpia (RECOMENDADO)

**Descripción:** Iniciar AWS Lambda sin migrar datos históricos de GCP.

**Justificación:**
- ✅ **Retention corta**: Datos GCP se auto-eliminan en 7-90 días (lifecycle policies)
- ✅ **Datos no críticos**: Extracciones históricas no necesarias para operación
- ✅ **Simplicidad**: Sin complejidad de migración
- ✅ **Zero risk**: No hay forma de corromper datos

**Proceso:**
```
Día 0: Sistema GCP funcional
       ↓
Día 1-14: Desarrollo AWS Lambda (paralelo, GCP sigue funcionando)
       ↓
Día 15: Deploy AWS Lambda staging
       ↓ (GCP sigue activo)
Día 15-21: Testing staging
       ↓
Día 22: Deploy AWS Lambda producción
       ↓ (switch tráfico a AWS)
Día 22+: GCP en modo lectura (mantener 90 días como backup)
       ↓
Día 112: Desactivar GCP completamente
```

**Pros:**
- ✅ Sin complejidad de migración
- ✅ Sin riesgo de pérdida de datos
- ✅ Implementación rápida
- ✅ GCP como backup durante transición

**Contras:**
- ⚠️ Datos históricos GCP no accesibles desde AWS (aceptable)
- ⚠️ Usuarios no ven extracciones antiguas en nuevo sistema (temporal)

---

### Opción 2: Migración Completa de Datos

**Descripción:** Migrar todos los datos históricos de GCP a AWS.

**Solo si:**
- Tienes >1,000 extracciones históricas que usuarios necesitan
- Compliance requiere mantener histórico
- Analytics requiere datos históricos

**Proceso:**

#### Fase 1: Exportar de Firestore

```bash
# 1. Exportar colección completa
gcloud firestore export gs://salfagpt-firestore-export/cartola-export-$(date +%Y%m%d) \
  --collection-ids=context_sources \
  --project=salfagpt

# O query específica (solo cartolas)
# Si diferencias context_sources de cartolas por campo 'type'

# 2. Descargar export
gsutil -m cp -r gs://salfagpt-firestore-export/cartola-export-* ./firestore-export/

# 3. Convertir a formato JSON legible
npm install -g @google-cloud/firestore-export
firestore-export --accountCredentials ./service-account-key.json \
  --nodePath 'context_sources' \
  --outputFile ./data/firestore-cartolas.json
```

#### Fase 2: Transformar Datos

```javascript
// scripts/transform-firestore-to-dynamodb.js

const fs = require('fs');

// 1. Leer export de Firestore
const firestoreData = JSON.parse(fs.readFileSync('./data/firestore-cartolas.json', 'utf8'));

// 2. Transformar a formato DynamoDB
const dynamoItems = Object.entries(firestoreData).map(([docId, docData]) => {
  return {
    PutRequest: {
      Item: {
        id: docId,
        userId: docData.userId,
        organizationId: docData.organizationId || null,
        status: 'completed',  // Asumimos completados
        fileName: docData.metadata?.originalFileName || 'unknown.pdf',
        fileSize: docData.metadata?.originalFileSize || 0,
        s3Key: null,  // No hay archivo en S3 (expirado)
        extractionResult: docData.extractedData ? JSON.parse(docData.extractedData) : null,
        createdAt: docData.createdAt?._seconds ? docData.createdAt._seconds * 1000 : Date.now(),
        updatedAt: docData.updatedAt?._seconds ? docData.updatedAt._seconds * 1000 : Date.now(),
        completedAt: docData.createdAt?._seconds ? docData.createdAt._seconds * 1000 : Date.now(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),  // 90 días desde ahora
        // Metadata para trazabilidad
        _migrated: true,
        _migratedFrom: 'gcp-firestore',
        _migrationDate: Date.now()
      }
    }
  };
});

// 3. Dividir en batches de 25 (límite DynamoDB BatchWriteItem)
const batches = [];
for (let i = 0; i < dynamoItems.length; i += 25) {
  batches.push(dynamoItems.slice(i, i + 25));
}

// 4. Guardar batches
fs.writeFileSync('./data/dynamodb-batches.json', JSON.stringify(batches, null, 2));

console.log(`✅ Transformed ${dynamoItems.length} documents into ${batches.length} batches`);
```

#### Fase 3: Importar a DynamoDB

```javascript
// scripts/import-to-dynamodb.js

const AWS = require('aws-sdk');
const fs = require('fs');

AWS.config.update({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function importBatches() {
  const batches = JSON.parse(fs.readFileSync('./data/dynamodb-batches.json', 'utf8'));
  
  console.log(`📦 Importing ${batches.length} batches...`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      await dynamoDB.batchWrite({
        RequestItems: {
          [process.env.DYNAMODB_TABLE]: batch
        }
      }).promise();
      
      console.log(`✅ Batch ${i + 1}/${batches.length} imported`);
      
      // Rate limiting (DynamoDB free tier: 25 writes/sec)
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      
      // Guardar batch fallido para retry
      fs.appendFileSync('./data/failed-batches.json', JSON.stringify(batch) + '\n');
    }
  }
  
  console.log('🎉 Import complete!');
}

importBatches().catch(console.error);

// Ejecutar:
// DYNAMODB_TABLE=cartola_extractions_staging node scripts/import-to-dynamodb.js
```

#### Fase 4: Migrar Archivos S3 (Opcional)

**Solo si archivos <7 días y necesitas preservarlos:**

```bash
# 1. Listar archivos en Cloud Storage
gsutil ls -r gs://salfagpt-uploads/cartola/ > ./data/gcs-files.txt

# 2. Copiar a S3 (con gsutil y AWS CLI)
while read gcs_path; do
  # Descargar de GCS
  gsutil cp "$gcs_path" ./temp/file.pdf
  
  # Subir a S3
  filename=$(basename "$gcs_path")
  aws s3 cp ./temp/file.pdf s3://nubox-cartola-uploads-prod/migrated/$filename
  
  echo "✅ Migrated: $filename"
done < ./data/gcs-files.txt

# O usar Cloud Storage Transfer Service:
# https://cloud.google.com/storage-transfer/docs/s3-transfer
```

**Alternativa: gsutil rsync (más rápido)**
```bash
# Instalar boto para S3
pip install boto

# Configurar boto con AWS credentials
cat > ~/.boto << EOF
[Credentials]
aws_access_key_id = YOUR_AWS_KEY
aws_secret_access_key = YOUR_AWS_SECRET

[s3]
host = s3.us-east-1.amazonaws.com
EOF

# Sync GCS → S3
gsutil -m rsync -r gs://salfagpt-uploads/cartola/ s3://nubox-cartola-uploads-prod/migrated/
```

---

## 🔒 Seguridad Durante Migración

### Encriptación de Datos en Tránsito

```bash
# 1. Exportar de Firestore encriptado
gcloud firestore export gs://salfagpt-export/encrypted-$(date +%Y%m%d) \
  --collection-ids=context_sources

# 2. Descargar y encriptar localmente
gsutil -m cp -r gs://salfagpt-export/encrypted-* ./export/
tar -czf export.tar.gz ./export/
gpg --symmetric --cipher-algo AES256 export.tar.gz

# 3. Subir a S3 encriptado
aws s3 cp export.tar.gz.gpg s3://nubox-migration-bucket/firestore-export/ \
  --server-side-encryption AES256

# 4. Procesar en Lambda con decryption
```

### Validación de Integridad

```javascript
// scripts/validate-migration.js

const AWS = require('aws-sdk');
const fs = require('fs');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function validateMigration() {
  // 1. Contar documentos originales (Firestore)
  const firestoreData = JSON.parse(fs.readFileSync('./data/firestore-cartolas.json', 'utf8'));
  const firestoreCount = Object.keys(firestoreData).length;
  
  console.log(`📊 Firestore documents: ${firestoreCount}`);
  
  // 2. Contar documentos migrados (DynamoDB)
  const scanResult = await dynamoDB.scan({
    TableName: process.env.DYNAMODB_TABLE,
    Select: 'COUNT',
    FilterExpression: 'attribute_exists(#migrated)',
    ExpressionAttributeNames: {
      '#migrated': '_migrated'
    }
  }).promise();
  
  const dynamoCount = scanResult.Count;
  
  console.log(`📊 DynamoDB documents (migrated): ${dynamoCount}`);
  
  // 3. Validar match
  if (firestoreCount === dynamoCount) {
    console.log('✅ Migration count matches!');
  } else {
    console.error(`❌ Mismatch: ${firestoreCount} vs ${dynamoCount}`);
    console.error(`   Missing: ${firestoreCount - dynamoCount} documents`);
  }
  
  // 4. Validar estructura de algunos documentos
  const sampleIds = Object.keys(firestoreData).slice(0, 10);
  
  for (const id of sampleIds) {
    const firestoreDoc = firestoreData[id];
    
    const dynamoResult = await dynamoDB.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id }
    }).promise();
    
    const dynamoDoc = dynamoResult.Item;
    
    if (!dynamoDoc) {
      console.error(`❌ Document ${id} missing in DynamoDB`);
      continue;
    }
    
    // Validar campos críticos
    if (firestoreDoc.userId !== dynamoDoc.userId) {
      console.error(`❌ userId mismatch for ${id}`);
    }
    
    console.log(`✅ Document ${id} validated`);
  }
  
  console.log('🎉 Validation complete!');
}

validateMigration().catch(console.error);
```

---

## 🔄 Migración Sin Downtime

### Estrategia Blue-Green

```
┌──────────────────────────────────────────────────────────┐
│               MIGRACIÓN BLUE-GREEN                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Semana 1-2: Preparación                                │
│  ┌──────────────────┐                                   │
│  │  GCP (BLUE)      │  ← 100% tráfico                   │
│  │  Cloud Run       │                                   │
│  │  Firestore       │                                   │
│  │  Cloud Storage   │                                   │
│  └──────────────────┘                                   │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  AWS (GREEN)     │  ← 0% tráfico (staging)           │
│  │  Lambda          │  ← Desarrollo y testing           │
│  │  DynamoDB        │  ← Sin datos prod aún            │
│  │  S3              │                                   │
│  └──────────────────┘                                   │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Semana 3: Canary Release                               │
│  ┌──────────────────┐                                   │
│  │  GCP (BLUE)      │  ← 90% tráfico                    │
│  └──────────────────┘                                   │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  AWS (GREEN)     │  ← 10% tráfico (canary)           │
│  │  - Monitor errors│                                   │
│  │  - Monitor latency                                   │
│  │  - Compare quality                                   │
│  └──────────────────┘                                   │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Día 1-2: Si 10% exitoso                                │
│  ┌──────────────────┐                                   │
│  │  GCP (BLUE)      │  ← 50% tráfico                    │
│  └──────────────────┘                                   │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  AWS (GREEN)     │  ← 50% tráfico                    │
│  └──────────────────┘                                   │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Día 3-5: Si 50% exitoso                                │
│  ┌──────────────────┐                                   │
│  │  GCP (BLUE)      │  ← 0% tráfico (backup pasivo)     │
│  │  - Mantener 90 días                                  │
│  │  - Solo lectura                                      │
│  └──────────────────┘                                   │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  AWS (GREEN)     │  ← 100% tráfico ✅                │
│  │  - Producción     │                                   │
│  │  - Fully active   │                                   │
│  └──────────────────┘                                   │
│                                                          │
│  Día 90+: Cleanup GCP                                   │
│  ┌──────────────────┐                                   │
│  │  GCP (BLUE)      │  ← Desactivado ♻️                 │
│  └──────────────────┘                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Doble Escritura (Transición)

**Si requieres mantener ambos sistemas sincronizados (temporal):**

```javascript
// Durante transición, escribir a ambos
async function saveExtraction(data) {
  const results = await Promise.allSettled([
    // Write to GCP (existing)
    saveToFirestore(data),
    
    // Write to AWS (new)
    saveToDynamoDB(data)
  ]);
  
  // Log results
  results.forEach((result, idx) => {
    const system = idx === 0 ? 'GCP' : 'AWS';
    if (result.status === 'fulfilled') {
      console.log(`✅ ${system} write succeeded`);
    } else {
      console.error(`❌ ${system} write failed:`, result.reason);
    }
  });
  
  // Require at least one success
  if (results.every(r => r.status === 'rejected')) {
    throw new Error('Both GCP and AWS writes failed');
  }
}

// Después de validar AWS funciona:
// 1. Desactivar writes a GCP
// 2. Solo leer de GCP si no existe en AWS (fallback)
// 3. Eventualmente eliminar código GCP
```

---

## 📦 Script de Migración Completo

### migrate-all.sh

```bash
#!/bin/bash
# Migración completa GCP → AWS
# Uso: ./migrate-all.sh [staging|prod]

set -e

STAGE=${1:-staging}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🚀 Starting GCP → AWS migration"
echo "================================"
echo "Stage: $STAGE"
echo "Timestamp: $TIMESTAMP"
echo ""

# ============================================================================
# PASO 1: Backup GCP
# ============================================================================
echo "📦 Step 1: Backup GCP data"

# Export Firestore
echo "  Exporting Firestore..."
gcloud firestore export gs://salfagpt-backup/migration-$TIMESTAMP \
  --collection-ids=context_sources \
  --project=salfagpt

# List Cloud Storage files
echo "  Listing Cloud Storage files..."
gsutil ls -r gs://salfagpt-uploads/cartola/ > ./migration-data/gcs-files-$TIMESTAMP.txt

echo "  ✅ GCP backup complete"
echo ""

# ============================================================================
# PASO 2: Crear Infraestructura AWS (si no existe)
# ============================================================================
echo "📋 Step 2: Setup AWS infrastructure"

# Crear S3 bucket
aws s3 mb s3://nubox-cartola-uploads-$STAGE --region us-east-1 2>/dev/null || echo "  Bucket already exists"

# Crear DynamoDB table (via Serverless Framework)
cd lambda/
serverless deploy --stage $STAGE

echo "  ✅ AWS infrastructure ready"
echo ""

# ============================================================================
# PASO 3: Transformar Datos
# ============================================================================
echo "🔄 Step 3: Transform data"

# Descargar Firestore export
gsutil -m cp -r gs://salfagpt-backup/migration-$TIMESTAMP ./migration-data/

# Convertir a JSON
node scripts/transform-firestore-to-dynamodb.js

echo "  ✅ Data transformed"
echo ""

# ============================================================================
# PASO 4: Importar a DynamoDB
# ============================================================================
echo "📥 Step 4: Import to DynamoDB"

DYNAMODB_TABLE=cartola_extractions_$STAGE node scripts/import-to-dynamodb.js

echo "  ✅ DynamoDB import complete"
echo ""

# ============================================================================
# PASO 5: Validar Migración
# ============================================================================
echo "✅ Step 5: Validate migration"

DYNAMODB_TABLE=cartola_extractions_$STAGE node scripts/validate-migration.js

echo "  ✅ Validation complete"
echo ""

# ============================================================================
# PASO 6: Opcional - Migrar Archivos S3
# ============================================================================
read -p "¿Migrar archivos de Cloud Storage a S3? (y/n): " MIGRATE_FILES

if [ "$MIGRATE_FILES" = "y" ]; then
  echo "📁 Step 6: Migrate files to S3"
  
  # Sync GCS → S3
  gsutil -m rsync -r gs://salfagpt-uploads/cartola/ s3://nubox-cartola-uploads-$STAGE/migrated/
  
  echo "  ✅ Files migrated"
else
  echo "  ⏭️  Skipping file migration"
fi

echo ""
echo "🎉 Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Test API endpoints in $STAGE"
echo "  2. Verify data integrity"
echo "  3. Monitor for errors"
echo "  4. If all OK, proceed to production"
```

---

## ✅ Validación Post-Migración

### Checklist de Validación

```bash
# 1. Verificar conteo de documentos
FIRESTORE_COUNT=$(cat ./data/firestore-cartolas.json | jq 'keys | length')
DYNAMO_COUNT=$(aws dynamodb scan \
  --table-name cartola_extractions_staging \
  --select COUNT \
  --filter-expression "attribute_exists(#migrated)" \
  --expression-attribute-names '{"#migrated": "_migrated"}' \
  --query 'Count' \
  --output text)

echo "Firestore: $FIRESTORE_COUNT"
echo "DynamoDB: $DYNAMO_COUNT"

if [ "$FIRESTORE_COUNT" -eq "$DYNAMO_COUNT" ]; then
  echo "✅ Count matches"
else
  echo "❌ Count mismatch!"
fi

# 2. Verificar algunos documentos específicos
# Sample 10 random documents
SAMPLE_IDS=$(cat ./data/firestore-cartolas.json | jq -r 'keys | .[:10] | .[]')

for id in $SAMPLE_IDS; do
  # Get from DynamoDB
  DYNAMO_DOC=$(aws dynamodb get-item \
    --table-name cartola_extractions_staging \
    --key "{\"id\": {\"S\": \"$id\"}}" \
    --query 'Item' \
    --output json)
  
  if [ "$DYNAMO_DOC" != "null" ]; then
    echo "✅ Document $id exists in DynamoDB"
  else
    echo "❌ Document $id MISSING in DynamoDB"
  fi
done

# 3. Verificar archivos S3 (si se migraron)
S3_COUNT=$(aws s3 ls s3://nubox-cartola-uploads-staging/migrated/ --recursive | wc -l)
echo "S3 files: $S3_COUNT"

# 4. Test funcional
echo "Testing Lambda with migrated data..."
serverless invoke -f processCartola --stage staging --data '{
  "body": "{\"test\": true}"
}'
```

---

## 🔙 Plan de Rollback

### Si Migración Falla

**Paso 1: Detener Escrituras a AWS**
```bash
# Pausar Lambda functions
aws lambda put-function-concurrency \
  --function-name nubox-cartola-extraction-$STAGE-processCartola \
  --reserved-concurrent-executions 0

# O eliminar API Gateway endpoints
serverless remove --stage $STAGE
```

**Paso 2: Restaurar desde Backup**
```bash
# Si necesitas restaurar Firestore
gcloud firestore import gs://salfagpt-backup/migration-$TIMESTAMP \
  --project=salfagpt
```

**Paso 3: Redireccionar Tráfico a GCP**
```bash
# GCP Cloud Run debe seguir activo durante transición
# Simplemente dejar de usar AWS endpoints
```

**Paso 4: Limpieza AWS (opcional)**
```bash
# Eliminar DynamoDB table
aws dynamodb delete-table --table-name cartola_extractions_$STAGE

# Vaciar y eliminar S3 bucket
aws s3 rm s3://nubox-cartola-uploads-$STAGE --recursive
aws s3 rb s3://nubox-cartola-uploads-$STAGE

# Eliminar Lambda functions
serverless remove --stage $STAGE
```

---

## 📊 Monitoreo Durante Migración

### Métricas Clave

**Durante Canary (10% tráfico AWS):**
```bash
# 1. Error rate comparison
GCP_ERRORS=$(gcloud logging read "severity=ERROR AND resource.labels.service_name=cloud-run-service" --limit 1000 --format json | jq '. | length')
AWS_ERRORS=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=nubox-cartola-extraction-staging-processCartola \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

echo "GCP errors (last hour): $GCP_ERRORS"
echo "AWS errors (last hour): $AWS_ERRORS"

# 2. Latency comparison
# (Implementar con timestamps en logs)

# 3. Quality comparison
# (Comparar average_extraction_proximity_pct)
```

### Dashboard Comparativo

```javascript
// CloudWatch custom metrics para comparación
const cloudwatch = new AWS.CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'NuboxCartolaMigration',
  MetricData: [
    {
      MetricName: 'TrafficPercentage',
      Value: 10,  // 10% en AWS
      Unit: 'Percent',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: 'production' },
        { Name: 'Provider', Value: 'AWS' }
      ]
    },
    {
      MetricName: 'ExtractionAccuracy',
      Value: 95.5,
      Unit: 'Percent',
      Dimensions: [
        { Name: 'Provider', Value: 'AWS' }
      ]
    }
  ]
}).promise();

// Crear dashboard con métricas lado a lado GCP vs AWS
```

---

## 🎯 Recomendación Final de Migración

### Opción Recomendada: Migración Limpia (Sin Migrar Datos)

**Por qué:**

1. **Datos Temporales** ✅
   - Retention: 7-90 días
   - No es histórico crítico
   - Auto-eliminación configurada

2. **Simplicidad** ✅
   - Sin scripts de migración complejos
   - Sin riesgo de corrupción de datos
   - Sin tiempo adicional de desarrollo

3. **Costo-Beneficio** ✅
   - Migración de datos: 1-2 días adicionales
   - Beneficio: Mínimo (datos se eliminan solos)
   - ROI negativo para migrar histórico

4. **Backup Disponible** ✅
   - GCP mantiene datos 90 días
   - Rollback inmediato si problemas AWS
   - Sin pérdida de datos

### Proceso Recomendado

```
1. Desarrollar AWS Lambda (2 semanas)
2. Deploy a staging, validar (1 semana)
3. Deploy a producción con canary (10% → 50% → 100%)
4. Mantener GCP como backup pasivo (90 días)
5. Desactivar GCP después de validación completa
6. Datos GCP se auto-eliminan por lifecycle policy
```

**Tiempo total:** 3 semanas  
**Riesgo:** Bajo  
**Complejidad:** Baja  
**Costo:** Mínimo

---

## 📚 Comandos Útiles

### Verificar Datos GCP

```bash
# Contar documentos en Firestore
gcloud firestore databases list --project=salfagpt

# Query ejemplo
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('context_sources')
  .where('type', '==', 'pdf')
  .limit(10)
  .get();
console.log('Documents:', snapshot.size);
process.exit(0);
"

# Listar archivos Cloud Storage
gsutil ls -lh gs://salfagpt-uploads/cartola/ | head -20
```

### Verificar Datos AWS

```bash
# Contar items en DynamoDB
aws dynamodb scan \
  --table-name cartola_extractions_staging \
  --select COUNT \
  --query 'Count' \
  --output text

# Query por usuario
aws dynamodb query \
  --table-name cartola_extractions_staging \
  --index-name userId-createdAt-index \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "user-test-123"}}' \
  --limit 10

# Listar archivos S3
aws s3 ls s3://nubox-cartola-uploads-staging/uploads/ --recursive --human-readable | head -20
```

---

## ✅ Conclusión

### Estrategia Recomendada

**✅ MIGRACIÓN LIMPIA (Sin migrar datos históricos)**

**Razones:**
- Datos temporales (7-90 días retention)
- Simplicidad (sin scripts de migración)
- Riesgo cero (GCP como backup 90 días)
- Tiempo óptimo (sin overhead de migración)

**Proceso:**
1. Desarrollar AWS Lambda (código ya validado)
2. Deploy staging y validar
3. Deploy producción con canary
4. GCP como backup pasivo
5. Desactivar GCP después de 90 días

**Timeline:** 3 semanas  
**Complejidad:** Baja  
**Riesgo:** Bajo  
**Costo:** Mínimo

---

**Si se requiere migración completa de datos históricos:**
- Seguir Opción 2 en este documento
- Tiempo adicional: 1-2 días
- Usar scripts proporcionados
- Validar integridad antes de switch

---

**Siguiente Paso:** Iniciar desarrollo AWS Lambda según `GUIA_IMPLEMENTACION_AWS_LAMBDA.md`

**Documentos Relacionados:**
- `AWS_LAMBDA_CARTOLA_PRD.md` - PRD técnico
- `CONCILIACION_EJECUTIVA_AWS_LAMBDA.md` - Executive summary
- `ARQUITECTURA_COMPARATIVA_GCP_AWS.md` - Comparativa técnica

**Contacto:** dev-team@nubox.com

---

**Última Actualización:** 24 de Noviembre, 2025  
**Versión:** 1.0  
**Estado:** ✅ Completo

