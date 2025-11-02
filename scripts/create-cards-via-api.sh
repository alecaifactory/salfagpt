#!/bin/bash

# Create example roadmap cards via API
# Based on real features we built

echo "🎨 Creating example roadmap cards via API..."
echo ""

BASE_URL="http://localhost:3000"

# Helper function to create card
create_card() {
  local title="$1"
  local desc="$2"
  local lane="$3"
  local priority="$4"
  local effort="$5"
  local csat="$6"
  local nps="$7"
  local roi="$8"
  
  curl -s -X POST "$BASE_URL/api/backlog/create" \
    -H "Content-Type: application/json" \
    -d "{
      \"companyId\": \"aifactory\",
      \"userId\": \"114671162830729001607\",
      \"title\": \"$title\",
      \"description\": \"$desc\",
      \"type\": \"feature\",
      \"priority\": \"$priority\",
      \"estimatedEffort\": \"$effort\",
      \"estimatedCSATImpact\": $csat,
      \"estimatedNPSImpact\": $nps,
      \"affectedUsers\": 500,
      \"lane\": \"$lane\"
    }" | jq -r '.id // "error"'
}

# BACKLOG
echo "📋 Creating BACKLOG items..."

ID1=$(create_card \
  "Sistema de carrusel de preguntas" \
  "Carrusel visual de preguntas sugeridas con navegación" \
  "backlog" "medium" "s" 3.2 85 6.5)
echo "   ✅ FEAT-001: $ID1"

ID2=$(create_card \
  "Export conversación a PDF/Word" \
  "Exportar conversaciones con formato markdown" \
  "backlog" "medium" "m" 2.5 78 5)
echo "   ✅ FEAT-008: $ID2"

ID3=$(create_card \
  "Multi-file upload en contexto" \
  "Drag & drop múltiples PDFs simultáneamente" \
  "backlog" "low" "s" 2.8 82 4.5)
echo "   ✅ FEAT-009: $ID3"

echo ""

# ROADMAP
echo "🔵 Creating ROADMAP items..."

ID4=$(create_card \
  "Sistema de evaluación masiva" \
  "Banco de 85 preguntas benchmark para evaluar agentes" \
  "roadmap" "high" "l" 4.5 95 15)
echo "   ✅ FEAT-002: $ID4"

ID5=$(create_card \
  "Dashboard de métricas por agente" \
  "Analytics con CSAT, NPS, tokens, quality scores" \
  "roadmap" "high" "l" 3.8 90 10)
echo "   ✅ FEAT-007: $ID5"

ID6=$(create_card \
  "Modal referencias no abre" \
  "Bug: Referencias clickables no abren modal" \
  "roadmap" "high" "s" 3.5 88 8)
echo "   ✅ BUG-002: $ID6"

echo ""

# IN DEVELOPMENT
echo "🔷 Creating IN DEVELOPMENT item..."

ID7=$(create_card \
  "Fix permanente numeración RAG" \
  "Consolidar referencias ANTES de enviar al AI" \
  "in_development" "critical" "m" 4.8 98 25)
echo "   ✅ BUG-001: $ID7"

echo ""

# EXPERT REVIEW
echo "🟡 Creating EXPERT REVIEW item..."

ID8=$(create_card \
  "Modal referencias simplificado" \
  "Mostrar solo info esencial en modal" \
  "expert_review" "medium" "s" 3.5 88 8)
echo "   ✅ FEAT-003: $ID8"

echo ""

# PRODUCTION
echo "🟢 Creating PRODUCTION items..."

ID9=$(create_card \
  "Prompts jerárquicos Domain + Agent" \
  "Combinar prompts de dominio y agente" \
  "production" "high" "m" 4.2 92 12)
echo "   ✅ FEAT-004: $ID9"

ID10=$(create_card \
  "Stella Marker Tool" \
  "Feedback visual con markers y viral sharing" \
  "production" "high" "xl" 4.8 96 18)
echo "   ✅ FEAT-005: $ID10"

echo ""
echo "🎉 Example cards created!"
echo ""
echo "📊 Summary:"
echo "   Backlog: 3"
echo "   Roadmap: 3"
echo "   In Development: 1"
echo "   Expert Review: 1"
echo "   Production: 2"
echo ""
echo "🔗 View in modal:"
echo "   1. http://localhost:3000/chat"
echo "   2. Login: alec@getaifactory.com"
echo "   3. Avatar → 'Roadmap & Backlog'"
echo ""




