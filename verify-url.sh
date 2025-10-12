#!/bin/bash

EXPECTED_URL="https://flow-chat-cno6l2kfga-uc.a.run.app"
CURRENT_URL=$(gcloud run services describe flow-chat \
  --region us-central1 \
  --format="value(status.url)" 2>/dev/null)

if [ "$CURRENT_URL" = "$EXPECTED_URL" ]; then
  echo "✅ URL correcta: $CURRENT_URL"
  exit 0
else
  echo "❌ ERROR: URL cambió!"
  echo "Esperada: $EXPECTED_URL"
  echo "Actual:   $CURRENT_URL"
  echo ""
  echo "⚠️ ACCIÓN REQUERIDA: Actualizar OAuth redirect URI"
  exit 1
fi
