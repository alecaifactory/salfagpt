#!/bin/bash
# Backup completo de BigQuery
# Seguro: Solo copia datos, no modifica nada

set -e  # Exit on error

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DATASET="flow_analytics_backup_${DATE}"
PROJECT_ID="salfagpt"
SOURCE_DATASET="flow_analytics"
SOURCE_TABLE="document_embeddings"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 BACKUP DE BIGQUERY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 Fecha: $(date)"
echo "🏷️  Dataset backup: ${BACKUP_DATASET}"
echo "📍 Tabla origen: ${SOURCE_DATASET}.${SOURCE_TABLE}"
echo "🔒 Proyecto: ${PROJECT_ID}"
echo ""

# Verificar que la tabla origen existe
echo "🔍 Verificando tabla origen..."
if ! bq show ${PROJECT_ID}:${SOURCE_DATASET}.${SOURCE_TABLE} &>/dev/null; then
  echo "❌ ERROR: Tabla origen no existe"
  echo "   ${SOURCE_DATASET}.${SOURCE_TABLE}"
  exit 1
fi

TABLE_SIZE=$(bq show --format=prettyjson ${PROJECT_ID}:${SOURCE_DATASET}.${SOURCE_TABLE} | grep numBytes | awk '{print $2}' | tr -d ',')
TABLE_SIZE_MB=$((TABLE_SIZE / 1024 / 1024))
echo "✅ Tabla encontrada: ${TABLE_SIZE_MB} MB"
echo ""

# Crear dataset de backup
echo "🚀 Creando dataset de backup..."
bq mk --dataset \
  --location=us-central1 \
  --description="Backup pre-optimización ${DATE}" \
  --default_table_expiration=604800 \
  ${PROJECT_ID}:${BACKUP_DATASET}

echo "✅ Dataset creado: ${BACKUP_DATASET}"
echo "   Auto-delete: 7 días"
echo ""

# Copiar tabla principal
echo "📋 Copiando tabla ${SOURCE_TABLE}..."
echo "   Esto puede tomar 2-5 minutos..."
echo ""

bq cp \
  --force \
  ${PROJECT_ID}:${SOURCE_DATASET}.${SOURCE_TABLE} \
  ${PROJECT_ID}:${BACKUP_DATASET}.${SOURCE_TABLE}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BACKUP COMPLETADO EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resumen del backup:"
echo "   Dataset: ${BACKUP_DATASET}"
echo "   Tabla: ${SOURCE_TABLE}"
echo "   Tamaño: ${TABLE_SIZE_MB} MB"
echo "   Expiración: 7 días"
echo ""
echo "🔍 Para verificar:"
echo "   bq show ${PROJECT_ID}:${BACKUP_DATASET}.${SOURCE_TABLE}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 PARA RESTAURAR SI ES NECESARIO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Restaurar desde backup:"
echo "bq cp --force \\"
echo "  ${PROJECT_ID}:${BACKUP_DATASET}.${SOURCE_TABLE} \\"
echo "  ${PROJECT_ID}:${SOURCE_DATASET}.${SOURCE_TABLE}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Guardar info del backup
mkdir -p logs
cat > logs/backup-bigquery-${DATE}.log <<EOF
Backup BigQuery
===============
Fecha: $(date)
Dataset backup: ${BACKUP_DATASET}
Tabla: ${SOURCE_TABLE}
Tamaño: ${TABLE_SIZE_MB} MB
Proyecto: ${PROJECT_ID}
Expiración: 7 días

Para restaurar:
bq cp --force \\
  ${PROJECT_ID}:${BACKUP_DATASET}.${SOURCE_TABLE} \\
  ${PROJECT_ID}:${SOURCE_DATASET}.${SOURCE_TABLE}

Para verificar:
bq show ${PROJECT_ID}:${BACKUP_DATASET}.${SOURCE_TABLE}
EOF

echo "📝 Log guardado en: logs/backup-bigquery-${DATE}.log"
echo ""

