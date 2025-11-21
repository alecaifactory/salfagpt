#!/bin/bash

# Test S1-v2 with evaluation questions
# Creates temporary conversations and captures responses

AGENT_ID="iQmdg3bMSJ1AdqqlFpye"
BASE_URL="http://localhost:3000"

echo "🧪 Testing S1-v2 Agent"
echo "======================"
echo ""

# Test 1: Pedido de Convenio
echo "TEST 1: ¿Cómo hago un pedido de convenio?"
echo "-------------------------------------------"

CONV_ID="test-convenio-$(date +%s)"

curl -s -X POST "${BASE_URL}/api/conversations/${CONV_ID}/messages-stream" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"¿Cómo hago un pedido de convenio?\",
    \"agentId\": \"${AGENT_ID}\",
    \"useAgentSearch\": true,
    \"activeSourceIds\": []
  }" > /tmp/test1-response.txt

echo ""
echo "Response saved to /tmp/test1-response.txt"
echo ""
echo "Waiting 3 seconds..."
sleep 3

# Test 2: Informe Petróleo
echo ""
echo "TEST 2: ¿Cuándo debo enviar el informe de consumo de petróleo?"
echo "----------------------------------------------------------------"

CONV_ID="test-petroleo-$(date +%s)"

curl -s -X POST "${BASE_URL}/api/conversations/${CONV_ID}/messages-stream" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"¿Cuándo debo enviar el informe de consumo de petróleo?\",
    \"agentId\": \"${AGENT_ID}\",
    \"useAgentSearch\": true,
    \"activeSourceIds\": []
  }" > /tmp/test2-response.txt

echo ""
echo "Response saved to /tmp/test2-response.txt"
echo ""

echo "================================"
echo "Tests completed!"
echo "Check /tmp/test1-response.txt and /tmp/test2-response.txt"

