#!/bin/bash

# ============================================
# SalfaGPT Quick Start Script
# ============================================

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║              🚀 SalfaGPT Quick Start Check 🚀               ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check 1: Service Account
echo "1️⃣  Checking Service Account..."
if gcloud iam service-accounts list --filter="email:salfagpt-service@*" --format="value(email)" | grep -q "salfagpt-service"; then
    echo "   ✅ Service account exists"
else
    echo "   ❌ Service account missing"
    echo "   Run: ./setup-service-account.sh"
    exit 1
fi

# Check 2: Authentication
echo ""
echo "2️⃣  Checking Local Authentication..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    echo "   ✅ Authenticated as: $ACTIVE_ACCOUNT"
else
    echo "   ❌ Not authenticated"
    echo "   Run: ./setup-local-auth.sh"
    exit 1
fi

# Check 3: APIs
echo ""
echo "3️⃣  Checking Required APIs..."
REQUIRED_APIS="aiplatform bigquery firestore"
for api in $REQUIRED_APIS; do
    if gcloud services list --enabled --filter="name:${api}" --format="value(name)" | grep -q "${api}"; then
        echo "   ✅ ${api} API enabled"
    else
        echo "   ❌ ${api} API not enabled"
    fi
done

# Check 4: .env file
echo ""
echo "4️⃣  Checking .env Configuration..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    
    # Check OAuth credentials
    if grep -q "your-client-id" .env || grep -q "your-client-secret" .env; then
        echo "   ⚠️  OAuth credentials need to be set!"
        echo ""
        echo "   📝 Next Step:"
        echo "   1. Visit: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192"
        echo "   2. Create OAuth 2.0 Client ID"
        echo "   3. Update .env with your credentials"
        echo ""
        exit 1
    else
        echo "   ✅ OAuth credentials configured"
    fi
else
    echo "   ❌ .env file missing"
    echo "   Check SETUP_COMPLETE.md for instructions"
    exit 1
fi

# Check 5: Dependencies
echo ""
echo "5️⃣  Checking Node Dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  Dependencies not installed"
    echo "   Run: npm install"
    exit 1
fi

# All checks passed
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║              ✅ ALL CHECKS PASSED! ✅                        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Ready to start!"
echo ""
echo "Run: npm run dev"
echo ""
echo "Then visit: http://localhost:4321"
echo ""

