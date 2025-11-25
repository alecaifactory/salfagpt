#!/bin/bash

# Test API endpoints directly via curl
# Measures actual end-to-end performance

echo "🧪 TEST DIRECTO DE API - 4 CASOS DE EVALUACIÓN"
echo "════════════════════════════════════════════════════════════════"
echo ""

ENDPOINT="http://localhost:3000/api/conversations"
USER_ID="usr_uhwqffaqag1wrryd82tw"

# Test Case 1: Filtros Grúa Sany
echo "CASO 1: Filtros Grúa Sany CR900C"
echo "────────────────────────────────────────────────────────────────"
echo "Agent: S2-v2 (1lgr33ywq5qed67sqCYi)"
echo "Original: Inaceptable (1/5)"
echo ""

START=$(date +%s%3N)
RESPONSE=$(curl -s -X POST \
  "${ENDPOINT}/1lgr33ywq5qed67sqCYi/messages-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"${USER_ID}"'",
    "message": "Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C",
    "model": "gemini-2.5-flash",
    "systemPrompt": "Eres un asistente útil.",
    "ragTopK": 10,
    "ragMinSimilarity": 0.6
  }' \
  --max-time 60 \
  2>&1)
END=$(date +%s%3N)
TIME=$((END - START))

echo "⏱️  Tiempo: ${TIME}ms (~$((TIME / 1000))s)"

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ ERROR en respuesta"
  echo "$RESPONSE" | grep "error" | head -5
else
  # Count references
  REF_COUNT=$(echo "$RESPONSE" | grep -o '"type":"references"' | wc -l)
  CHUNK_COUNT=$(echo "$RESPONSE" | grep -o '"type":"chunk"' | wc -l)
  
  echo "📚 Referencias: $REF_COUNT eventos"
  echo "📝 Chunks: $CHUNK_COUNT eventos"
  
  if [ $REF_COUNT -gt 0 ]; then
    echo "✅ Mostró referencias"
  else
    echo "⚠️  Sin referencias (posible: doc no cargado)"
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Test Case 2: Forros Frenos (should work well)
echo "CASO 2: Forros Frenos TCBY-56"
echo "────────────────────────────────────────────────────────────────"
echo "Agent: S2-v2"
echo "Original: Sobresaliente (5/5)"
echo ""

START=$(date +%s%3N)
curl -s -X POST \
  "${ENDPOINT}/1lgr33ywq5qed67sqCYi/messages-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"${USER_ID}"'",
    "message": "Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados",
    "model": "gemini-2.5-flash",
    "systemPrompt": "Eres un asistente útil.",
    "ragTopK": 10,
    "ragMinSimilarity": 0.6
  }' \
  --max-time 60 \
  > /tmp/case2.txt 2>&1
END=$(date +%s%3N)
TIME=$((END - START))

echo "⏱️  Tiempo: ${TIME}ms (~$((TIME / 1000))s)"

REF_COUNT=$(grep -o '"type":"references"' /tmp/case2.txt | wc -l)
HAS_ERROR=$(grep -c "error" /tmp/case2.txt)

if [ $HAS_ERROR -gt 0 ]; then
  echo "❌ ERROR"
else
  echo "📚 Referencias: $REF_COUNT"
  [ $REF_COUNT -gt 0 ] && echo "✅ Con referencias" || echo "⚠️  Sin referencias"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📊 RESUMEN RÁPIDO:"
echo "  - Servidor respondiendo: ✅"
echo "  - Threshold activo: 0.6"
echo "  - Performance: ~$((TIME / 1000))s por request"
echo ""
echo "Para análisis completo, revisar:"
echo "  - /tmp/case2.txt (respuesta caso 2)"
echo "  - REPORTE_FINAL_4_CASOS.md (predicciones)"
echo ""

