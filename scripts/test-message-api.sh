#!/bin/bash

# Test the messages-stream API with S1-v2

echo "🧪 Testing messages-stream API for S1-v2..."
echo ""

# Agent ID
AGENT_ID="iQmdg3bMSJ1AdqqlFpye"

# Sample active source IDs (first 5 from the 75)
ACTIVE_IDS='["WvMqftPDe4KHqc8PIzcX","Gxx4N9AZxadIDUrqIb0e","vpbcEyoGpAtKOkzANsEt","X2BasCXLGotPRD9pcVwT","lMIZEUyzc8FQkY7uVJsU"]'

# Make request
curl -N "http://localhost:3000/api/conversations/${AGENT_ID}/messages-stream" \
  -H "Content-Type: application/json" \
  -H "Cookie: session=eyJpZCI6InVzcl91aHdxZmZhcWFnMXdycnlkODJ0dyIsImVtYWlsIjoiYWxlY0BnZXRhaWZhY3RvcnkuY29tIiwibmFtZSI6IkFsZWphbmRybyBUb23DoXMgRGlja2luc29uIFJvc3NvIiwicm9sZSI6InN1cGVyYWRtaW4iLCJnb29nbGVVc2VySWQiOiIxMTQ2NzExNjI4MzA3MjkwMDE2MDciLCJjb21wYW55IjoiQUkgRmFjdG9yeSIsImlhdCI6MTczMjAzOTAwMSwiZXhwIjoxNzMyMDQyNjAxfQ.1qVGZP5xJMqLxWqZpKWJeq0CJ1vHgTHJ0EKm_LWYxKk" \
  -d "{
    \"userId\": \"usr_uhwqffaqag1wrryd82tw\",
    \"userEmail\": \"dundurraga@iaconcagua.com\",
    \"message\": \"como solicito algo de la bodega?\",
    \"model\": \"gemini-2.5-flash\",
    \"systemPrompt\": \"Eres un asistente de IA.\",
    \"useAgentSearch\": true,
    \"activeSourceIds\": ${ACTIVE_IDS},
    \"ragEnabled\": true,
    \"ragTopK\": 10,
    \"ragMinSimilarity\": 0.5
  }" \
  2>&1 | head -50

echo ""
echo ""
echo "📋 Check server logs:"
tail -30 /tmp/dev-server.log | grep -E "(Context Strategy|activeSourceIds|RAG|references)"

