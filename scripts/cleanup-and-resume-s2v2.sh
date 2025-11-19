#!/bin/bash

# Script de Limpieza y Reanudación S2-v2
# Elimina documentos con problemas y recomienza el proceso completo
# Fecha: 2025-11-19

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║         LIMPIEZA Y REANUDACIÓN COMPLETA S2-v2                          ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Variables
AGENT_ID="1lgr33ywq5qed67sqCYi"
USER_ID="usr_uhwqffaqag1wrryd82tw"
TAG="S002"
MODEL="gemini-2.5-flash"
TEST_QUERY="¿Qué procedimientos de mantenimiento existen para camiones pluma HIAB?"
FOLDER="/Users/alec/salfagpt/upload-queue/S002-20251118"

# Paso 1: Verificar API Key
echo "🔑 Paso 1/4: Verificando API Key..."
API_KEY=$(grep "GOOGLE_AI_API_KEY" /Users/alec/salfagpt/.env | cut -d'=' -f2)
if [ -z "$API_KEY" ]; then
    echo "❌ Error: No se encontró GOOGLE_AI_API_KEY en .env"
    exit 1
fi

if [ "$API_KEY" == "AIzaSyBuW4Yqrn2qfJhfYHtEwGb7hwGChSyxekU" ]; then
    echo "⚠️  ADVERTENCIA: Estás usando una API Key comprometida"
    echo "   Por favor, actualiza GOOGLE_AI_API_KEY en .env con una nueva key"
    echo ""
    read -p "¿Deseas continuar de todas formas? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Proceso cancelado"
        exit 1
    fi
fi

echo "✅ API Key encontrada: ${API_KEY:0:20}..."
echo ""

# Paso 2: Eliminar documentos problemáticos de Firestore
echo "🧹 Paso 2/4: Limpiando documentos problemáticos de Firestore..."
echo "   Esto eliminará los 87 documentos con 0 caracteres de contenido"
echo ""

read -p "¿Confirmas eliminar los 87 documentos problemáticos? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Proceso cancelado"
    exit 1
fi

cd /Users/alec/salfagpt

node -e "
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'salfagpt' });

async function cleanup() {
  const firestore = admin.firestore();
  
  console.log('🔍 Buscando documentos con 0 caracteres...');
  const snapshot = await firestore.collection('context_sources')
    .where('assignedToAgents', 'array-contains', '$AGENT_ID')
    .get();
  
  const toDelete = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const contentLength = data.extractedText ? data.extractedText.length : 0;
    
    if (contentLength === 0) {
      toDelete.push({ id: doc.id, name: data.name });
    }
  }
  
  console.log('📊 Documentos a eliminar:', toDelete.length);
  
  if (toDelete.length === 0) {
    console.log('✅ No hay documentos para eliminar');
    process.exit(0);
  }
  
  console.log('');
  console.log('🗑️  Eliminando documentos...');
  
  let deleted = 0;
  for (const doc of toDelete) {
    try {
      await firestore.collection('context_sources').doc(doc.id).delete();
      deleted++;
      if (deleted % 10 === 0) {
        console.log(\`   Eliminados: \${deleted}/\${toDelete.length}\`);
      }
    } catch (err) {
      console.error(\`   ❌ Error eliminando \${doc.name}: \${err.message}\`);
    }
  }
  
  console.log('');
  console.log(\`✅ Limpieza completada: \${deleted} documentos eliminados\`);
  process.exit(0);
}

cleanup().catch(err => { 
  console.error('Error:', err.message); 
  process.exit(1); 
});
"

if [ $? -ne 0 ]; then
    echo "❌ Error durante la limpieza"
    exit 1
fi

echo ""
echo "✅ Limpieza completada exitosamente"
echo ""

# Paso 3: Esperar confirmación para continuar
echo "📤 Paso 3/4: Preparando para re-upload completo..."
echo "   Se subirán los 98 archivos PDF desde: $FOLDER"
echo "   Agente: $AGENT_ID (S2-v2)"
echo "   Tag: $TAG"
echo "   Modelo: $MODEL"
echo ""

read -p "¿Confirmas iniciar el upload de 98 archivos? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Proceso cancelado"
    exit 1
fi

# Paso 4: Ejecutar upload completo
echo ""
echo "🚀 Paso 4/4: Iniciando upload completo..."
echo "📝 Log: /tmp/upload-s2v2-complete.log"
echo ""

npx tsx cli/commands/upload.ts \
  --folder="$FOLDER" \
  --tag="$TAG" \
  --agent="$AGENT_ID" \
  --user="$USER_ID" \
  --model="$MODEL" \
  --test-query="$TEST_QUERY" 2>&1 | tee /tmp/upload-s2v2-complete.log

echo ""
echo "✅ Proceso completado"
echo "📊 Revisa el log completo en: /tmp/upload-s2v2-complete.log"

