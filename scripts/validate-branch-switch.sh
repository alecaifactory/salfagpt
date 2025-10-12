#!/bin/bash

# Branch Switch Validation Script
# Validates safety of switching branches before making the switch

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Symbols
CHECK="✅"
WARN="⚠️ "
ERROR="❌"
INFO="ℹ️ "

# Get target branch from argument
TARGET_BRANCH=$1

if [ -z "$TARGET_BRANCH" ]; then
    echo -e "${ERROR} Usage: ./scripts/validate-branch-switch.sh <target-branch>"
    exit 1
fi

echo -e "${BLUE}🔄 Branch Switch Validation${NC}"
echo "=================================="
echo ""

# Current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${INFO} Current Branch: ${GREEN}$CURRENT_BRANCH${NC}"
echo -e "${INFO} Target Branch:  ${GREEN}$TARGET_BRANCH${NC}"
echo ""

# Check if target branch exists
if ! git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
    echo -e "${ERROR} Target branch '$TARGET_BRANCH' does not exist!"
    exit 1
fi

# Initialize risk level
RISK_LEVEL=0
WARNINGS=()
ERRORS=()
INFO_ITEMS=()

# ===================
# 1. CHECK UNCOMMITTED CHANGES
# ===================
echo "1. Checking for uncommitted changes..."
UNCOMMITTED=$(git status --short | wc -l | tr -d ' ')

if [ "$UNCOMMITTED" -gt 0 ]; then
    ERRORS+=("${ERROR} $UNCOMMITTED uncommitted changes detected")
    RISK_LEVEL=$((RISK_LEVEL + 3))
    echo -e "   ${ERROR} $UNCOMMITTED files have uncommitted changes"
    echo ""
    echo "   Modified files:"
    git status --short | sed 's/^/   /'
    echo ""
else
    echo -e "   ${CHECK} No uncommitted changes"
fi
echo ""

# ===================
# 2. CHECK PROTECTED FEATURES
# ===================
echo "2. Checking protected features in current branch..."
PROTECTED_COUNT=0
MISSING_FEATURES=()

# Check for Sparkles import
if grep -q "import.*Sparkles" src/components/ChatInterface.tsx 2>/dev/null; then
    echo -e "   ${CHECK} Sparkles import present"
    PROTECTED_COUNT=$((PROTECTED_COUNT + 1))
else
    MISSING_FEATURES+=("Sparkles import")
    echo -e "   ${WARN} Sparkles import missing"
fi

# Check for userConfig
if grep -q "userConfig\.model" src/components/ChatInterface.tsx 2>/dev/null; then
    echo -e "   ${CHECK} Model display (userConfig) present"
    PROTECTED_COUNT=$((PROTECTED_COUNT + 1))
else
    MISSING_FEATURES+=("Model display")
    echo -e "   ${WARN} Model display missing"
fi

# Check for disclaimer
if grep -q "Flow puede cometer" src/components/ChatInterface.tsx 2>/dev/null; then
    echo -e "   ${CHECK} Disclaimer text present"
    PROTECTED_COUNT=$((PROTECTED_COUNT + 1))
else
    MISSING_FEATURES+=("Disclaimer")
    echo -e "   ${WARN} Disclaimer missing"
fi

# Check for calculateLocalContext
if grep -q "calculateLocalContext" src/components/ChatInterface.tsx 2>/dev/null; then
    echo -e "   ${CHECK} Context calculation present"
    PROTECTED_COUNT=$((PROTECTED_COUNT + 1))
else
    MISSING_FEATURES+=("Context calculation")
    echo -e "   ${WARN} Context calculation missing"
fi

echo ""
echo -e "   Protected features: ${GREEN}$PROTECTED_COUNT/4${NC}"

if [ $PROTECTED_COUNT -eq 4 ]; then
    INFO_ITEMS+=("${CHECK} All 4 protected features present")
else
    WARNINGS+=("${WARN} Only $PROTECTED_COUNT/4 protected features present")
    RISK_LEVEL=$((RISK_LEVEL + 2))
fi
echo ""

# ===================
# 3. CHECK BRANCH RELATIONSHIP WITH MAIN
# ===================
echo "3. Checking branch relationship with main..."

# Fetch to ensure we have latest
git fetch origin main --quiet 2>/dev/null || true

# Check if main exists
if git show-ref --verify --quiet refs/heads/main; then
    # Get ahead/behind counts
    AHEAD_BEHIND=$(git rev-list --left-right --count main...HEAD 2>/dev/null || echo "0 0")
    BEHIND=$(echo $AHEAD_BEHIND | awk '{print $1}')
    AHEAD=$(echo $AHEAD_BEHIND | awk '{print $2}')
    
    echo -e "   Current branch is ${YELLOW}$AHEAD commits ahead${NC}, ${YELLOW}$BEHIND commits behind${NC} main"
    
    if [ "$AHEAD" -gt 0 ]; then
        INFO_ITEMS+=("${INFO} $AHEAD new commits on this branch")
    fi
    
    if [ "$BEHIND" -gt 0 ]; then
        WARNINGS+=("${WARN} Main has $BEHIND new commits")
        RISK_LEVEL=$((RISK_LEVEL + 1))
    fi
else
    echo -e "   ${WARN} Main branch not found locally"
fi
echo ""

# ===================
# 4. CHECK IF TARGET BRANCH IS MERGED TO MAIN
# ===================
echo "4. Checking if target branch is merged to main..."

if git show-ref --verify --quiet refs/heads/main; then
    if git branch --merged main | grep -q "^\s*$TARGET_BRANCH$"; then
        echo -e "   ${CHECK} Target branch IS merged to main (validated)"
        INFO_ITEMS+=("${CHECK} Target is validated (merged to main)")
        # Merged branches are safe
    else
        echo -e "   ${WARN} Target branch NOT merged to main (experimental)"
        WARNINGS+=("${WARN} Target branch not validated yet")
        RISK_LEVEL=$((RISK_LEVEL + 2))
    fi
else
    echo -e "   ${WARN} Cannot verify (main not found)"
fi
echo ""

# ===================
# 5. CHECK TARGET BRANCH FEATURES
# ===================
echo "5. Checking protected features in target branch..."

# Temporarily switch to target to check (in a subshell to not affect current state)
(
    git checkout $TARGET_BRANCH --quiet 2>/dev/null
    
    TARGET_FEATURES=0
    
    if grep -q "import.*Sparkles" src/components/ChatInterface.tsx 2>/dev/null; then
        TARGET_FEATURES=$((TARGET_FEATURES + 1))
    fi
    
    if grep -q "userConfig\.model" src/components/ChatInterface.tsx 2>/dev/null; then
        TARGET_FEATURES=$((TARGET_FEATURES + 1))
    fi
    
    if grep -q "Flow puede cometer" src/components/ChatInterface.tsx 2>/dev/null; then
        TARGET_FEATURES=$((TARGET_FEATURES + 1))
    fi
    
    if grep -q "calculateLocalContext" src/components/ChatInterface.tsx 2>/dev/null; then
        TARGET_FEATURES=$((TARGET_FEATURES + 1))
    fi
    
    echo $TARGET_FEATURES
) > /tmp/target_features_count.txt 2>/dev/null

# Return to original branch
git checkout $CURRENT_BRANCH --quiet 2>/dev/null

TARGET_PROTECTED=$(cat /tmp/target_features_count.txt 2>/dev/null || echo "0")
rm -f /tmp/target_features_count.txt

echo -e "   Target has: ${GREEN}$TARGET_PROTECTED/4${NC} protected features"

if [ "$TARGET_PROTECTED" -lt 4 ] && [ "$PROTECTED_COUNT" -eq 4 ]; then
    ERRORS+=("${ERROR} Switching will LOSE $(($PROTECTED_COUNT - $TARGET_PROTECTED)) protected features!")
    RISK_LEVEL=$((RISK_LEVEL + 5))
fi
echo ""

# ===================
# 6. CHECK FOR POTENTIAL CONFLICTS
# ===================
echo "6. Checking for potential conflicts..."

# Get merge base
MERGE_BASE=$(git merge-base HEAD $TARGET_BRANCH 2>/dev/null || echo "")

if [ -n "$MERGE_BASE" ]; then
    # Check for conflicting files
    CONFLICTS=$(git diff --name-only $MERGE_BASE..$CURRENT_BRANCH | sort > /tmp/current_files.txt && \
                git diff --name-only $MERGE_BASE..$TARGET_BRANCH | sort > /tmp/target_files.txt && \
                comm -12 /tmp/current_files.txt /tmp/target_files.txt | wc -l | tr -d ' ')
    
    if [ "$CONFLICTS" -gt 0 ]; then
        echo -e "   ${WARN} $CONFLICTS files modified in both branches"
        WARNINGS+=("${WARN} $CONFLICTS potential conflict files")
        RISK_LEVEL=$((RISK_LEVEL + 2))
        
        echo ""
        echo "   Potentially conflicting files:"
        comm -12 /tmp/current_files.txt /tmp/target_files.txt | sed 's/^/   - /'
    else
        echo -e "   ${CHECK} No conflicting changes detected"
    fi
    
    rm -f /tmp/current_files.txt /tmp/target_files.txt
else
    echo -e "   ${WARN} Cannot determine merge base"
fi
echo ""

# ===================
# SUMMARY
# ===================
echo "=================================="
echo -e "${BLUE}📊 VALIDATION SUMMARY${NC}"
echo "=================================="
echo ""

# Display all info items
if [ ${#INFO_ITEMS[@]} -gt 0 ]; then
    for item in "${INFO_ITEMS[@]}"; do
        echo -e "$item"
    done
    echo ""
fi

# Display all warnings
if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Warnings:${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo -e "$warning"
    done
    echo ""
fi

# Display all errors
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo -e "${RED}Errors:${NC}"
    for error in "${ERRORS[@]}"; do
        echo -e "$error"
    done
    echo ""
fi

# Risk assessment
echo -e "Risk Level: "
if [ $RISK_LEVEL -eq 0 ]; then
    echo -e "${GREEN}${CHECK} LOW - Safe to switch${NC}"
    RECOMMENDATION="Safe to proceed"
    EXIT_CODE=0
elif [ $RISK_LEVEL -le 3 ]; then
    echo -e "${YELLOW}${WARN} MEDIUM - Proceed with caution${NC}"
    RECOMMENDATION="Commit or stash changes first"
    EXIT_CODE=1
elif [ $RISK_LEVEL -le 6 ]; then
    echo -e "${YELLOW}${WARN} HIGH - Significant risk${NC}"
    RECOMMENDATION="Commit changes and verify target branch"
    EXIT_CODE=2
else
    echo -e "${RED}${ERROR} CRITICAL - High risk of feature loss${NC}"
    RECOMMENDATION="DO NOT SWITCH - Commit and validate first"
    EXIT_CODE=3
fi
echo ""

echo -e "${BLUE}Recommendation:${NC} $RECOMMENDATION"
echo ""

# Action suggestions
echo -e "${BLUE}Suggested Actions:${NC}"
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "1. Commit current changes:"
    echo "   git add ."
    echo "   git commit -m \"feat: [description]\""
fi

if [ ${#WARNINGS[@]} -gt 0 ] || [ ${#ERRORS[@]} -gt 0 ]; then
    echo "2. Review changes carefully before switching"
fi

echo "3. After switch, verify protected features:"
echo "   npm run type-check"
echo "   grep \"Sparkles\" src/components/ChatInterface.tsx"

echo ""
echo "=================================="

exit $EXIT_CODE

