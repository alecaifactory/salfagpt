#!/bin/bash
# Verificar que todos los backups se completaron correctamente

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICACIÓN DE BACKUPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# 1. Verificar backup de Firestore
echo "📦 Verificando Firestore..."
FIRESTORE_OPERATIONS=$(gcloud firestore operations list --project=salfagpt --filter="done=true" --limit=1)

if [ -n "$FIRESTORE_OPERATIONS" ]; then
  echo "✅ Firestore backup completado"
else
  echo "⚠️  Firestore backup aún en progreso"
  echo "   Ejecuta: gcloud firestore operations list --project=salfagpt"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Verificar backup de BigQuery
echo "📊 Verificando BigQuery..."
LATEST_BACKUP=$(bq ls --project_id=salfagpt | grep "flow_analytics_backup" | tail -1 | awk '{print $1}')

if [ -n "$LATEST_BACKUP" ]; then
  echo "✅ BigQuery backup encontrado: ${LATEST_BACKUP}"
  
  # Verificar que tiene datos
  TABLE_COUNT=$(bq query --use_legacy_sql=false --format=csv "SELECT COUNT(*) as count FROM \`salfagpt.${LATEST_BACKUP}.document_embeddings\`" | tail -1)
  echo "   Rows: ${TABLE_COUNT}"
else
  echo "❌ BigQuery backup no encontrado"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Verificar snapshot de código
echo "📸 Verificando snapshot de código..."
BACKUP_BRANCHES=$(git branch -r | grep "backup-pre-optimization" | head -1)

if [ -n "$BACKUP_BRANCHES" ]; then
  echo "✅ Branch de backup encontrado"
  echo "   ${BACKUP_BRANCHES}"
else
  echo "❌ Branch de backup no encontrado"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo "✅ TODOS LOS BACKUPS VERIFICADOS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🎉 ¡Listo para continuar con Fase 1!"
  echo ""
  echo "Siguiente paso:"
  echo "   bash scripts/phase1-firestore-indexes.sh"
  echo ""
else
  echo "⚠️  HAY $ERRORS PROBLEMA(S)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Por favor resuelve los problemas antes de continuar."
  echo ""
fi

