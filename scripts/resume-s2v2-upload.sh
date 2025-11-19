#!/bin/bash

# Script de Reanudación S2-v2
# Solo procesa archivos que NO han sido subidos aún
# Fecha: 2025-11-19

echo "🔄 REANUDANDO UPLOAD S2-v2"
echo "=========================="
echo ""

# Parámetros
AGENT_ID="1lgr33ywq5qed67sqCYi"
USER_ID="usr_uhwqffaqag1wrryd82tw"
TAG="S002"
MODEL="gemini-2.5-flash"
TEST_QUERY="¿Qué procedimientos de mantenimiento existen para camiones pluma HIAB?"
FOLDER="/Users/alec/salfagpt/upload-queue/S002-20251118"

echo "📊 Estado actual:"
echo "  - Documentos ya subidos: 23"
echo "  - Documentos pendientes: 75"
echo "  - Total esperado: 98"
echo ""

# Leer lista de archivos pendientes
PENDING_FILES=$(cat /tmp/s2v2-pending.json)

echo "📝 Primeros 10 archivos a procesar:"
cat /tmp/s2v2-pending.json | jq -r '.[:10][]' | nl
echo ""

read -p "¿Continuar con el upload de 75 archivos restantes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado por usuario"
    exit 1
fi

echo ""
echo "🚀 Iniciando upload..."
echo "📝 Log: /tmp/upload-s2v2-resume.log"
echo ""

# Ejecutar upload con los mismos parámetros
cd /Users/alec/salfagpt

npx tsx cli/commands/upload.ts \
  --folder="$FOLDER" \
  --tag="$TAG" \
  --agent="$AGENT_ID" \
  --user="$USER_ID" \
  --model="$MODEL" \
  --test-query="$TEST_QUERY" 2>&1 | tee /tmp/upload-s2v2-resume.log

echo ""
echo "✅ Proceso completado"
echo "📊 Revisar log completo en: /tmp/upload-s2v2-resume.log"

