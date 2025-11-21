#!/bin/bash

# Test Nubox Extraction via API
# This calls the playground API endpoint to test with real PDF

PDF_PATH="/Users/alec/salfagpt/upload-queue/cartolas/Banco de Chile.pdf"
API_URL="http://localhost:3000/api/playground/extract"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         API TEST - Banco de Chile                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ ERROR: Server is not running on localhost:3000"
    echo ""
    echo "Please start the server first:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "✅ Server is running"
echo "📄 PDF: $PDF_PATH"
echo "🔗 API: $API_URL"
echo ""
echo "🚀 Sending request..."
echo ""

# Make the request and save response
RESPONSE=$(curl -s -X POST "$API_URL" \
  -F "file=@$PDF_PATH" \
  -F "model=gemini-2.5-flash" \
  -F "structured=true" \
  -F "outputFormat=nubox" \
  -F "bank=auto")

# Check if response contains error
if echo "$RESPONSE" | grep -q '"success":false'; then
    echo "❌ EXTRACTION FAILED"
    echo ""
    echo "$RESPONSE" | jq '.'
    exit 1
fi

# Save full response
echo "$RESPONSE" > TEST_OUTPUT_API.json
echo "💾 Full response saved to: TEST_OUTPUT_API.json"
echo ""

# Extract key information
echo "─────────────────────────────────────────────────────────────────"
echo "📊 EXTRACTION SUMMARY"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Parse with jq
BANK=$(echo "$RESPONSE" | jq -r '.result.bank_name // "N/A"')
ACCOUNT=$(echo "$RESPONSE" | jq -r '.result.account_number // "N/A"')
MOVEMENTS=$(echo "$RESPONSE" | jq -r '.result.movements | length // 0')
CONFIDENCE=$(echo "$RESPONSE" | jq -r '.result.metadata.confidence // 0')
COST=$(echo "$RESPONSE" | jq -r '.result.metadata.cost // 0')

echo "Bank:       $BANK"
echo "Account:    $ACCOUNT"
echo "Movements:  $MOVEMENTS"
echo "Confidence: $(echo "$CONFIDENCE * 100" | bc)%"
echo "Cost:       \$$COST"
echo ""

# Show first movement
echo "─────────────────────────────────────────────────────────────────"
echo "📋 FIRST MOVEMENT (Sample)"
echo "─────────────────────────────────────────────────────────────────"
echo ""
echo "$RESPONSE" | jq '.result.movements[0]'
echo ""

# Verification checks
echo "─────────────────────────────────────────────────────────────────"
echo "🔍 VERIFICATION CHECKS"
echo "─────────────────────────────────────────────────────────────────"
echo ""

# Check 1: Decimals
HAS_DECIMALS=$(echo "$RESPONSE" | jq '[.result.movements[].amount] | map(. % 1 != 0) | any')
echo "✓ Decimals preserved:       $([ "$HAS_DECIMALS" = "true" ] && echo '✅ YES' || echo '⚠️  NO (all integers)')"

# Check 2: holder_id with DV
FIRST_HOLDER_ID=$(echo "$RESPONSE" | jq -r '[.result.movements[].sender_account.holder_id] | map(select(. != null)) | .[0] // "none"')
if [ "$FIRST_HOLDER_ID" != "none" ]; then
    echo "✓ holder_id format:         \"$FIRST_HOLDER_ID\""
    if echo "$FIRST_HOLDER_ID" | grep -qE '[0-9k]$'; then
        echo "  └─ Has DV:                ✅ YES"
    else
        echo "  └─ Has DV:                ❌ NO"
    fi
else
    echo "✓ holder_id:                N/A (no RUTs found)"
fi

# Check 3: Currency
FIRST_CURRENCY=$(echo "$RESPONSE" | jq -r '.result.movements[0].currency // "null"')
echo "✓ Currency type:            $FIRST_CURRENCY"
if [ "$FIRST_CURRENCY" = "0" ]; then
    echo "  └─ Using string \"0\":      ❌ BAD (should be null)"
elif [ "$FIRST_CURRENCY" = "null" ] || [ "$FIRST_CURRENCY" = "CLP" ]; then
    echo "  └─ Valid type:            ✅ GOOD"
fi

# Check 4: Insights
HAS_INSIGHTS=$(echo "$RESPONSE" | jq '[.result.movements[].insights] | all')
echo "✓ All have insights:        $([ "$HAS_INSIGHTS" = "true" ] && echo '✅ YES' || echo '❌ NO')"

# Check 5: Key naming
INSIGHTS_KEYS=$(echo "$RESPONSE" | jq -r '.result.movements[0].insights | keys | join(", ")')
echo "✓ Insights keys:            $INSIGHTS_KEYS"
if echo "$INSIGHTS_KEYS" | grep -q "extraction_proximity_pct"; then
    echo "  └─ New key name:          ✅ YES"
elif echo "$INSIGHTS_KEYS" | grep -q "cercania"; then
    echo "  └─ Old key name:          ❌ NO (using old key)"
fi

echo ""
echo "─────────────────────────────────────────────────────────────────"
echo "✅ TEST COMPLETE"
echo "─────────────────────────────────────────────────────────────────"
echo ""
echo "Review full output: TEST_OUTPUT_API.json"
echo "View with: jq '.' TEST_OUTPUT_API.json | less"
echo ""


