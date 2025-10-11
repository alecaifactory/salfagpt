#!/bin/bash

# OAuth Local Testing Script
# This script helps you test Google OAuth locally

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║          🔐 OAuth Local Testing Helper 🔐               ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Detect server port
PORT=""
if lsof -ti:3000 > /dev/null 2>&1; then
  PORT=3000
elif lsof -ti:3001 > /dev/null 2>&1; then
  PORT=3001
fi

if [ -z "$PORT" ]; then
  echo "❌ Server is not running!"
  echo ""
  echo "Start the server first:"
  echo "   npm run dev"
  echo ""
  exit 1
fi

echo "✅ Server detected on port: $PORT"
echo ""

# Check .env configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking .env Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f ".env" ]; then
  echo "❌ .env file not found!"
  exit 1
fi

# Check OAuth credentials
if grep -q "your-client-id" .env || grep -q "your-client-secret" .env; then
  echo "❌ OAuth credentials NOT configured in .env"
  echo ""
  echo "You need to:"
  echo ""
  echo "1. Go to Google Cloud Console:"
  echo "   https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192"
  echo ""
  echo "2. Create OAuth 2.0 Client ID with these settings:"
  echo "   - Application type: Web application"
  echo "   - Authorized redirect URIs: http://localhost:$PORT/auth/callback"
  echo ""
  echo "3. Copy the Client ID and Client Secret to .env:"
  echo "   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com"
  echo "   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret"
  echo ""
  echo "4. Restart the server: npm run dev"
  echo ""
  echo "📚 See OAUTH_LOCAL_TESTING.md for detailed instructions"
  echo ""
  exit 1
else
  echo "✅ OAuth credentials are configured"
  CLIENT_ID=$(grep GOOGLE_CLIENT_ID .env | cut -d'=' -f2 | head -1)
  echo "   Client ID: ${CLIENT_ID:0:20}..."
fi

echo ""

# Check JWT secret
if grep -q "JWT_SECRET=" .env; then
  echo "✅ JWT_SECRET is set"
else
  echo "❌ JWT_SECRET not found in .env"
  exit 1
fi

echo ""

# Test auth endpoints
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testing Auth Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test login endpoint
echo "Testing /auth/login..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/auth/login)

if [ "$LOGIN_STATUS" = "302" ] || [ "$LOGIN_STATUS" = "307" ]; then
  echo "✅ Login endpoint works (redirects to Google)"
  
  # Get the redirect URL
  REDIRECT_URL=$(curl -s -I http://localhost:$PORT/auth/login | grep -i location | cut -d' ' -f2 | tr -d '\r')
  
  if [[ $REDIRECT_URL == *"accounts.google.com"* ]]; then
    echo "✅ Redirects to Google OAuth (correct!)"
  else
    echo "⚠️  Redirect URL: $REDIRECT_URL"
  fi
else
  echo "⚠️  Login endpoint returned: $LOGIN_STATUS"
  echo "   Expected: 302 or 307 (redirect)"
fi

echo ""

# Test logout endpoint
echo "Testing /auth/logout..."
LOGOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/auth/logout)
echo "   Status: $LOGOUT_STATUS"

echo ""

# Check protected endpoint
echo "Testing protected endpoint /api/chat..."
CHAT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  http://localhost:$PORT/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}')

if [ "$CHAT_STATUS" = "401" ]; then
  echo "✅ Protected endpoint correctly returns 401 (Unauthorized)"
else
  echo "⚠️  Protected endpoint returned: $CHAT_STATUS"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  OAuth Configuration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your OAuth setup appears to be working!"
echo ""
echo "📍 Important URLs:"
echo ""
echo "   Login URL:"
echo "   http://localhost:$PORT/auth/login"
echo ""
echo "   Callback URL (for Google Console):"
echo "   http://localhost:$PORT/auth/callback"
echo ""
echo "   Chat page (after login):"
echo "   http://localhost:$PORT/chat"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To test OAuth manually:"
echo ""
echo "1. Open in your browser:"
echo "   http://localhost:$PORT/auth/login"
echo ""
echo "2. Log in with your Google account"
echo ""
echo "3. After login, check:"
echo "   - You should be redirected back to the app"
echo "   - Browser DevTools → Application → Cookies"
echo "   - Look for 'flow_session' cookie"
echo ""
echo "4. Try the chat:"
echo "   http://localhost:$PORT/chat"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Opening login page in browser..."
echo ""

# Open browser
sleep 1
open "http://localhost:$PORT/auth/login" 2>/dev/null || \
  xdg-open "http://localhost:$PORT/auth/login" 2>/dev/null || \
  echo "Please open: http://localhost:$PORT/auth/login"

echo ""
echo "✅ OAuth test complete!"
echo ""
echo "📚 For detailed troubleshooting, see: OAUTH_LOCAL_TESTING.md"
echo ""

