#!/bin/bash
# Script maestro: Ejecuta todos los backups
# Seguro: Solo lee y copia datos, no modifica nada en producción

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  FASE 0: PREPARACIÓN Y BACKUPS COMPLETOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 Fecha: $(date)"
echo "🔒 Proyecto: salfagpt"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   Este proceso NO modifica nada en producción"
echo "   Solo crea copias de seguridad"
echo "   Sistema sigue funcionando normalmente"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Crear directorio de logs
mkdir -p logs
DATE=$(date +%Y%m%d_%H%M%S)

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: No estás en el directorio raíz del proyecto"
  echo "   Por favor cd al directorio correcto"
  exit 1
fi

# Verificar que scripts tienen permisos de ejecución
chmod +x scripts/*.sh

# Verificar que gcloud está configurado
echo "🔍 Verificando configuración de GCP..."
if ! gcloud config get-value project &>/dev/null; then
  echo "❌ ERROR: gcloud no está configurado"
  echo "   Ejecuta: gcloud auth login"
  exit 1
fi

CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "salfagpt" ]; then
  echo "⚠️  Proyecto actual: $CURRENT_PROJECT"
  echo "   Cambiando a salfagpt..."
  gcloud config set project salfagpt
fi

echo "✅ GCP configurado correctamente"
echo ""

# 1. Backup de Código (más rápido)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 PASO 1/3: Snapshot del Código"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
bash scripts/snapshot-code.sh
echo ""
echo "✅ Snapshot completado"
echo ""
sleep 2

# 2. Backup de BigQuery (5 minutos)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PASO 2/3: Backup de BigQuery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
bash scripts/backup-bigquery.sh
echo ""
echo "✅ Backup de BigQuery completado"
echo ""
sleep 2

# 3. Backup de Firestore (15-20 minutos en background)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 PASO 3/3: Backup de Firestore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
bash scripts/backup-firestore.sh
echo ""

# Crear reporte consolidado
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TODOS LOS BACKUPS INICIADOS EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Resumen:"
echo ""
echo "   1. ✅ Código       → Branch backup creado"
echo "   2. ✅ BigQuery     → Dataset backup completo"
echo "   3. 🔄 Firestore   → Export en progreso (~15-20 min)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 LOGS Y DOCUMENTACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Todos los logs guardados en:"
ls -lh logs/*.log | tail -3
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICAR PROGRESO DE FIRESTORE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "gcloud firestore operations list --project=salfagpt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💰 COSTOS ESTIMADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Firestore export:  ~\$0.10"
echo "   BigQuery copy:     ~\$0.05"
echo "   Storage (30 días): ~\$0.50"
echo "   ─────────────────────────"
echo "   TOTAL:             ~\$0.65"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SIGUIENTE PASO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Espera ~20 minutos a que complete el backup de Firestore."
echo ""
echo "Mientras esperas, puedes:"
echo "   • Revisar los logs en ./logs/"
echo "   • Verificar backups en GCP Console"
echo "   • Leer docs/PLAN_IMPLEMENTACION_SEGURA.md"
echo ""
echo "Cuando el backup de Firestore esté completo:"
echo "   bash scripts/verify-backups.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Crear reporte consolidado
cat > logs/backups-summary-${DATE}.txt <<EOF
═══════════════════════════════════════════════════════════
REPORTE DE BACKUPS - FASE 0
═══════════════════════════════════════════════════════════

Fecha: $(date)
Proyecto: salfagpt

BACKUPS REALIZADOS:
───────────────────────────────────────────────────────────

1. CÓDIGO
   Status: ✅ Completado
   Branch: backup-pre-optimization-${DATE}
   Location: origin/backup-pre-optimization-${DATE}
   
2. BIGQUERY
   Status: ✅ Completado
   Dataset: flow_analytics_backup_${DATE}
   Expira: 7 días
   
3. FIRESTORE
   Status: 🔄 En progreso
   Location: gs://salfagpt-backups/firestore/firestore-backup-${DATE}
   Expira: 30 días

COMANDOS DE RESTAURACIÓN:
───────────────────────────────────────────────────────────

Ver logs individuales en:
  - logs/snapshot-code-${DATE}.log
  - logs/backup-bigquery-${DATE}.log
  - logs/backup-firestore-${DATE}.log

COSTOS:
───────────────────────────────────────────────────────────
  Total estimado: ~\$0.65

SIGUIENTE PASO:
───────────────────────────────────────────────────────────
  Esperar ~20 min y ejecutar:
  bash scripts/verify-backups.sh

═══════════════════════════════════════════════════════════
EOF

echo "📄 Reporte consolidado: logs/backups-summary-${DATE}.txt"
echo ""

