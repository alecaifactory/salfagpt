#!/bin/bash

# Comprehensive M3-v2 Agent Testing via API
# Agent ID: vStojK73ZKbjNsEnqANJ
# Title: GOP GPT (M3-v2)

AGENT_ID="vStojK73ZKbjNsEnqANJ"
USER_ID="114671162830729001607"  # alec@getaifactory.com
API_URL="http://localhost:3000/api/conversations/${AGENT_ID}/messages-stream"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🧪 M3-v2 Agent Comprehensive Test"
echo "=================================="
echo "Agent: GOP GPT (M3-v2)"
echo "ID: $AGENT_ID"
echo ""

# Function to test a question
test_question() {
    local question_num=$1
    local question=$2
    local expected_refs=$3
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📝 Question $question_num${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Question: $question"
    echo ""
    echo -e "${YELLOW}⏳ Sending to API...${NC}"
    
    # Send request and capture response
    local response=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "userId": "'$USER_ID'",
        "message": "'"$question"'",
        "model": "gemini-2.5-flash",
        "useAgentSearch": true,
        "ragTopK": 10,
        "ragMinSimilarity": 0.5
      }')
    
    # Save to temp file
    echo "$response" > "/tmp/q${question_num}.txt"
    
    # Extract just the content chunks
    local content=$(echo "$response" | grep '"type":"chunk"' | sed 's/.*"content":"\([^"]*\)".*/\1/' | tr '\n' ' ')
    
    echo ""
    echo -e "${GREEN}📄 Response:${NC}"
    echo "---"
    echo "$content" | fold -w 80
    echo "---"
    echo ""
    
    # Check for references
    local ref_count=$(echo "$response" | grep -o '\[Referencia:' | wc -l | tr -d ' ')
    
    echo -e "${BLUE}🔍 Analysis:${NC}"
    echo "  References found: $ref_count"
    echo "  Expected refs: $expected_refs"
    
    if [ "$ref_count" -ge "$expected_refs" ]; then
        echo -e "  Status: ${GREEN}✅ PASS${NC}"
    else
        echo -e "  Status: ${RED}❌ FAIL - Missing references${NC}"
    fi
    
    # Check if response says "no encontramos"
    if echo "$content" | grep -qi "no encontramos\|no dispongo\|no se encuentra"; then
        echo -e "  ${RED}⚠️ WARNING: Agent says document not found${NC}"
    fi
    
    echo ""
}

# Run tests for problematic questions from evaluation

echo -e "${YELLOW}Testing questions that failed in manual evaluation...${NC}"
echo ""

# Question 1 - Failed in evaluation (Inaceptable)
test_question 1 \
  "¿Cuál es el plazo máximo establecido para la elaboración del Plan de Calidad y Operación (PCO) una vez iniciada la obra, y con qué periodicidad mínima debe ser revisado el proceso de mantenimiento de dicho Plan?" \
  1

# Question 6 - Passed (Sobresaliente)
test_question 6 \
  "¿quién es el responsable de mantener actualizada la información del control de etapas?" \
  1

# Question 9 - Passed
test_question 9 \
  "¿Existe algún calendario de presentación de control de etapas DS49 y donde lo encuentro?" \
  1

# Question 24 - Failed (Inaceptable)  
test_question 24 \
  "soy jefe de terreno y debo solicitar materiales ¿como los solicito?" \
  1

# Question 26 - Failed (Inaceptable)
test_question 26 \
  "podrías decirme mes a mes que se debe hacer en el panel financiero" \
  1

# Question 27 - Failed (Inaceptable)
test_question 27 \
  "soy administrador de obra y tengo la siguiente situacion en obra un vecino molesto por el polvo que mantiene en su hogar. esta en la calle tratando mal al portero el cual me llama por radio comunicandome que esta afuera el vecino. que debo hacer" \
  1

# Question 30 - Passed (Sobresaliente)
test_question 30 \
  "como controlo la calidad en los proyectos" \
  1

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Testing Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Full responses saved to /tmp/q*.txt"
echo ""



