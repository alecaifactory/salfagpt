#!/bin/bash

echo "🧪 Testing Title Generation"
echo "=========================="
echo ""

USER_ID="114671162830729001607"
BASE_URL="http://localhost:3000"

# Step 1: Create new conversation
echo "1️⃣ Creating new conversation..."
CONV_RESPONSE=$(curl -s -X POST "$BASE_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"title\":\"Nueva Conversación\"}")

CONV_ID=$(echo $CONV_RESPONSE | jq -r '.id' 2>/dev/null)

if [ -z "$CONV_ID" ] || [ "$CONV_ID" = "null" ]; then
  echo "❌ Failed to create conversation"
  echo "Response: $CONV_RESPONSE"
  exit 1
fi

echo "✅ Conversation created: $CONV_ID"
echo ""

# Step 2: Send first message and watch for title updates
echo "2️⃣ Sending first message..."
echo "Message: '¿Cómo solicito vacaciones?'"
echo ""
echo "📡 Watching SSE stream for title events..."
echo "Press Ctrl+C to stop"
echo ""

curl -s -X POST "$BASE_URL/api/conversations/$CONV_ID/messages-stream" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\":\"$USER_ID\",
    \"message\":\"¿Cómo solicito vacaciones?\",
    \"model\":\"gemini-2.5-flash\",
    \"systemPrompt\":\"Eres un asistente útil.\",
    \"useAgentSearch\":true,
    \"ragEnabled\":true
  }" \
  | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      # Extract JSON from SSE event
      JSON_DATA="${line#data: }"
      EVENT_TYPE=$(echo "$JSON_DATA" | jq -r '.type' 2>/dev/null)
      
      case "$EVENT_TYPE" in
        "thinking")
          STEP=$(echo "$JSON_DATA" | jq -r '.step' 2>/dev/null)
          echo "💭 Thinking: $STEP"
          ;;
        "chunk")
          CHUNK=$(echo "$JSON_DATA" | jq -r '.chunk' 2>/dev/null)
          echo -n "$CHUNK"
          ;;
        "title")
          TITLE_CHUNK=$(echo "$JSON_DATA" | jq -r '.chunk' 2>/dev/null)
          echo ""
          echo "🏷️ TITLE CHUNK: '$TITLE_CHUNK'"
          ;;
        "complete")
          echo ""
          echo "✅ Response complete"
          ;;
      esac
    fi
  done

echo ""
echo "Test completed!"

