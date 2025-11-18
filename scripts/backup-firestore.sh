#!/bin/bash
# Backup completo de Firestore
# Seguro: Solo lee datos, no modifica nada

set -e  # Exit on error

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="firestore-backup-${DATE}"
PROJECT_ID="salfagpt"
BUCKET="gs://salfagpt-backups"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 BACKUP DE FIRESTORE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 Fecha: $(date)"
echo "🏷️  Nombre: ${BACKUP_NAME}"
echo "📍 Destino: ${BUCKET}/firestore/${BACKUP_NAME}"
echo "🔒 Proyecto: ${PROJECT_ID}"
echo ""

# Verificar que el bucket existe
echo "🔍 Verificando bucket de backups..."
if ! gsutil ls ${BUCKET} &>/dev/null; then
  echo "⚠️  Bucket no existe, creándolo..."
  gsutil mb -p ${PROJECT_ID} -c STANDARD -l us-central1 ${BUCKET}
  echo "✅ Bucket creado"
fi

# Configurar lifecycle (auto-delete después de 30 días)
echo "⚙️  Configurando lifecycle (auto-delete 30 días)..."
cat > /tmp/lifecycle.json <<EOF
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
gsutil lifecycle set /tmp/lifecycle.json ${BUCKET} 2>/dev/null || true
rm /tmp/lifecycle.json

# Iniciar backup
echo ""
echo "🚀 Iniciando export de Firestore..."
echo "   (Esto toma ~15-20 minutos para una DB promedio)"
echo ""

gcloud firestore export ${BUCKET}/firestore/${BACKUP_NAME} \
  --project=${PROJECT_ID} \
  --async

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BACKUP INICIADO EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Estado del backup:"
echo "   El backup se está ejecutando en background."
echo "   Puedes cerrar esta terminal sin problemas."
echo ""
echo "🔍 Para verificar progreso:"
echo "   gcloud firestore operations list --project=${PROJECT_ID}"
echo ""
echo "📍 Ubicación del backup:"
echo "   ${BUCKET}/firestore/${BACKUP_NAME}"
echo ""
echo "⏱️  Tiempo estimado: 15-20 minutos"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 PARA RESTAURAR SI ES NECESARIO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "gcloud firestore import ${BUCKET}/firestore/${BACKUP_NAME} \\"
echo "  --project=${PROJECT_ID}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Guardar info del backup
mkdir -p logs
cat > logs/backup-firestore-${DATE}.log <<EOF
Backup Firestore
================
Fecha: $(date)
Nombre: ${BACKUP_NAME}
Ubicación: ${BUCKET}/firestore/${BACKUP_NAME}
Proyecto: ${PROJECT_ID}
Estado: En progreso

Para restaurar:
gcloud firestore import ${BUCKET}/firestore/${BACKUP_NAME} --project=${PROJECT_ID}

Para verificar:
gcloud firestore operations list --project=${PROJECT_ID}
EOF

echo "📝 Log guardado en: logs/backup-firestore-${DATE}.log"
echo ""

