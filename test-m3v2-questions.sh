#!/bin/bash

# Test M3-v2 agent questions via API
# Agent ID: vStojK73ZKbjNsEnqANJ
# Title: GOP GPT (M3-v2)

AGENT_ID="vStojK73ZKbjNsEnqANJ"
USER_ID="114671162830729001607"  # alec@getaifactory.com
API_URL="http://localhost:3000/api/conversations/${AGENT_ID}/messages-stream"

echo "🧪 Testing M3-v2 Agent Questions via API"
echo "========================================"
echo ""

# Test Question 1
echo "📝 Question 1: Plazo máximo PCO"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "message": "¿Cuál es el plazo máximo establecido para la elaboración del Plan de Calidad y Operación (PCO) una vez iniciada la obra, y con qué periodicidad mínima debe ser revisado el proceso de mantenimiento de dicho Plan?",
    "model": "gemini-2.5-flash",
    "useAgentSearch": true,
    "ragTopK": 10,
    "ragMinSimilarity": 0.5
  }' 2>/dev/null | tee /tmp/q1.txt

echo ""
echo ""
echo "✅ Question 1 complete. Checking for references..."
grep -o '\[Referencia:' /tmp/q1.txt | wc -l | xargs -I {} echo "Found {} reference(s)"
echo ""
echo "=================================================="
echo ""

sleep 3

# Test Question 2
echo "📝 Question 2: Responsable coordinación procedimientos"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "message": "¿Qué rol es el responsable principal de Coordinar y velar que todos los procedimientos del \"Procedimiento Inicio de Obras de Edificación\" se realicen, y qué Gerente debe verificar su cumplimiento en ausencia de ese rol?",
    "model": "gemini-2.5-flash",
    "useAgentSearch": true
  }' 2>/dev/null | tee /tmp/q2.txt

echo ""
echo ""
echo "✅ Question 2 complete. Checking for references..."
grep -o '\[Referencia:' /tmp/q2.txt | wc -l | xargs -I {} echo "Found {} reference(s)"
echo ""
echo "=================================================="
echo ""

