#!/bin/bash

# Script para validar consistencia entre desarrollo local y producción GCP
# Usage: ./scripts/validate-consistency.sh [production-url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_URL="${LOCAL_URL:-http://localhost:3000}"
PRODUCTION_URL="${1:-}"

if [ -z "$PRODUCTION_URL" ]; then
  echo -e "${RED}❌ Error: Production URL required${NC}"
  echo "Usage: $0 <production-url>"
  echo "Example: $0 https://flow-production-abc123.run.app"
  exit 1
fi

echo "=================================================="
echo "  🔍 Flow - Consistency Validation Tool"
echo "=================================================="
echo ""
echo "Local:      $LOCAL_URL"
echo "Production: $PRODUCTION_URL"
echo ""

# Function to check endpoint
check_endpoint() {
  local url=$1
  local name=$2
  
  echo -e "${BLUE}Checking $name...${NC}"
  
  response=$(curl -s -w "\n%{http_code}" "$url/api/health/firestore" || echo "000")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "503" ]; then
    echo -e "${GREEN}✅ $name is reachable (HTTP $http_code)${NC}"
    echo "$body"
    return 0
  else
    echo -e "${RED}❌ $name is not reachable (HTTP $http_code)${NC}"
    return 1
  fi
}

# Function to extract field from JSON
extract_field() {
  local json=$1
  local field=$2
  echo "$json" | grep "\"$field\"" | head -1 | sed 's/.*: "\(.*\)".*/\1/' | tr -d ',' | xargs
}

# Function to compare configurations
compare_configs() {
  echo ""
  echo "=================================================="
  echo "  📊 Comparing Configurations"
  echo "=================================================="
  echo ""
  
  # Get health check from local
  echo -e "${BLUE}Fetching local configuration...${NC}"
  local_response=$(curl -s "$LOCAL_URL/api/health/firestore" || echo "{}")
  local_project=$(extract_field "$local_response" "value")
  local_status=$(extract_field "$local_response" "status")
  local_env=$(extract_field "$local_response" "environment")
  
  # Get health check from production
  echo -e "${BLUE}Fetching production configuration...${NC}"
  prod_response=$(curl -s "$PRODUCTION_URL/api/health/firestore" || echo "{}")
  prod_project=$(extract_field "$prod_response" "value")
  prod_status=$(extract_field "$prod_response" "status")
  prod_env=$(extract_field "$prod_response" "environment")
  
  echo ""
  echo "┌─────────────────────────────────────────────────┐"
  echo "│              Configuration Comparison            │"
  echo "├─────────────────────────────────────────────────┤"
  
  # Compare Project IDs
  echo "│ Project ID                                       │"
  echo "│   Local:      $local_project"
  echo "│   Production: $prod_project"
  if [ "$local_project" = "$prod_project" ] && [ -n "$local_project" ]; then
    echo -e "│   ${GREEN}✅ MATCH${NC}                                        │"
  else
    echo -e "│   ${RED}❌ MISMATCH${NC}                                     │"
  fi
  echo "│                                                  │"
  
  # Compare Status
  echo "│ Health Status                                    │"
  echo "│   Local:      $local_status"
  echo "│   Production: $prod_status"
  if [ "$local_status" = "healthy" ] && [ "$prod_status" = "healthy" ]; then
    echo -e "│   ${GREEN}✅ BOTH HEALTHY${NC}                                 │"
  else
    echo -e "│   ${YELLOW}⚠️  CHECK DETAILS${NC}                               │"
  fi
  echo "│                                                  │"
  
  # Environment
  echo "│ Environment                                      │"
  echo "│   Local:      $local_env"
  echo "│   Production: $prod_env"
  echo "└─────────────────────────────────────────────────┘"
  echo ""
  
  # Determine if configuration is consistent
  if [ "$local_project" = "$prod_project" ] && [ -n "$local_project" ]; then
    echo -e "${GREEN}✅ Configuration is CONSISTENT${NC}"
    echo "   Both environments point to the same GCP project"
    return 0
  else
    echo -e "${RED}❌ Configuration is INCONSISTENT${NC}"
    echo "   Environments point to different projects or not configured"
    return 1
  fi
}

# Function to test basic operations
test_operations() {
  echo ""
  echo "=================================================="
  echo "  🧪 Testing Basic Operations"
  echo "=================================================="
  echo ""
  
  # Test conversation creation (would need auth, so we just check endpoint exists)
  echo -e "${BLUE}Testing API endpoints...${NC}"
  
  local_test=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL/api/conversations" || echo "000")
  prod_test=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/conversations" || echo "000")
  
  echo "Conversations endpoint:"
  echo "  Local:      HTTP $local_test"
  echo "  Production: HTTP $prod_test"
  
  if [ "$local_test" = "400" ] && [ "$prod_test" = "400" ]; then
    echo -e "  ${GREEN}✅ Both return 400 (expected - needs userId param)${NC}"
  else
    echo -e "  ${YELLOW}⚠️  Different responses${NC}"
  fi
}

# Main execution
main() {
  echo -e "${BLUE}Starting validation...${NC}"
  echo ""
  
  # Check local server is running
  echo "1️⃣  Checking local server..."
  if check_endpoint "$LOCAL_URL" "Local"; then
    echo ""
  else
    echo -e "${RED}❌ Local server is not running or not responding${NC}"
    echo "   Start with: npm run dev"
    exit 1
  fi
  
  # Check production server
  echo "2️⃣  Checking production server..."
  if check_endpoint "$PRODUCTION_URL" "Production"; then
    echo ""
  else
    echo -e "${RED}❌ Production server is not responding${NC}"
    echo "   Verify URL and deployment status"
    exit 1
  fi
  
  # Compare configurations
  echo "3️⃣  Comparing configurations..."
  if compare_configs; then
    echo ""
  else
    echo -e "${RED}❌ Configuration validation failed${NC}"
    exit 1
  fi
  
  # Test operations
  echo "4️⃣  Testing operations..."
  test_operations
  
  # Final summary
  echo ""
  echo "=================================================="
  echo "  ✅ Validation Complete"
  echo "=================================================="
  echo ""
  echo -e "${GREEN}✨ Local and production are consistent!${NC}"
  echo ""
  echo "Next steps:"
  echo "  • Test creating a conversation locally"
  echo "  • Verify it appears in Firebase Console"
  echo "  • Deploy changes with: npx pame-core-cli deploy www --production"
  echo ""
}

# Run main function
main

