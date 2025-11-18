#!/bin/bash
# Snapshot del código actual
# Seguro: Solo crea un branch, no modifica nada

set -e  # Exit on error

DATE=$(date +%Y%m%d_%H%M%S)
BRANCH="backup-pre-optimization-${DATE}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 SNAPSHOT DEL CÓDIGO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 Fecha: $(date)"
echo "🌿 Branch actual: ${CURRENT_BRANCH}"
echo "🏷️  Branch backup: ${BRANCH}"
echo ""

# Verificar estado de git
echo "🔍 Verificando estado de git..."
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Hay cambios sin commit:"
  git status -s
  echo ""
  echo "💾 Guardando cambios actuales..."
  git add .
  git commit -m "WIP: Pre-optimization snapshot ${DATE}" || true
fi

echo "✅ Working directory limpio"
echo ""

# Crear branch de backup
echo "🚀 Creando branch de backup..."
git checkout -b ${BRANCH}

# Push a remote
echo "📤 Subiendo a remote..."
git push origin ${BRANCH}

# Volver a branch original
echo "🔙 Volviendo a ${CURRENT_BRANCH}..."
git checkout ${CURRENT_BRANCH}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SNAPSHOT CREADO EXITOSAMENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Información del snapshot:"
echo "   Branch: ${BRANCH}"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Remote: origin/${BRANCH}"
echo ""
echo "🔍 Para ver el snapshot:"
echo "   git log ${BRANCH} -1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 PARA RESTAURAR SI ES NECESARIO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Opción 1: Volver completamente al snapshot"
echo "git checkout ${BRANCH}"
echo ""
echo "# Opción 2: Traer cambios específicos"
echo "git checkout ${BRANCH} -- <archivo>"
echo ""
echo "# Opción 3: Ver diferencias"
echo "git diff ${BRANCH}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Guardar info del snapshot
mkdir -p logs
cat > logs/snapshot-code-${DATE}.log <<EOF
Snapshot de Código
==================
Fecha: $(date)
Branch backup: ${BRANCH}
Branch actual: ${CURRENT_BRANCH}
Commit: $(git rev-parse HEAD)
Remote: origin/${BRANCH}

Para restaurar:
git checkout ${BRANCH}

Para ver diferencias:
git diff ${BRANCH}

Para traer archivo específico:
git checkout ${BRANCH} -- <archivo>
EOF

echo "📝 Log guardado en: logs/snapshot-code-${DATE}.log"
echo ""

