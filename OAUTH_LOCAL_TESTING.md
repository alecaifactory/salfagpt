# 🔐 Testing Google OAuth Locally - Complete Guide

## 🎯 Quick Setup (5 Minutes)

Your server is running on: **http://localhost:3001**

---

## Step 1: Create OAuth Credentials in Google Cloud Console

### 1.1 Go to Credentials Page
**Direct Link:** https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192

### 1.2 Configure OAuth Consent Screen (If Not Done)

Click **"OAuth consent screen"** in the left sidebar:

1. **User Type**: Select **"External"**
2. Click **"Create"**

Fill in the form:
- **App name**: `Flow Local Development`
- **User support email**: `alec@getaifactory.com`
- **App logo**: (optional, skip for now)
- **App domain**: Leave blank for local testing
- **Authorized domains**: Leave blank for local testing
- **Developer contact**: `alec@getaifactory.com`

Click **"Save and Continue"**

3. **Scopes**: Click **"Add or Remove Scopes"**
   - Select: `userinfo.email`
   - Select: `userinfo.profile`
   - Select: `openid`
   - Click **"Update"** → **"Save and Continue"**

4. **Test users**: Click **"Add Users"**
   - Add your email: `alec@getaifactory.com`
   - Click **"Save and Continue"**

5. Review and click **"Back to Dashboard"**

### 1.3 Create OAuth Client ID

1. Click **"Credentials"** in the left sidebar
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Fill in:
   - **Application type**: Web application
   - **Name**: `Flow Local Dev`
   
4. **Authorized JavaScript origins**:
   - Add: `http://localhost:3001`
   - Add: `http://localhost:3000` (backup port)
   
5. **Authorized redirect URIs**:
   - Add: `http://localhost:3001/auth/callback`
   - Add: `http://localhost:3000/auth/callback` (backup)
   
6. Click **"Create"**

7. **Copy the credentials** that appear:
   - Client ID: `xxxxx-xxxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxxxxxxxxxx`

---

## Step 2: Update Your .env File

Open `/Users/alec/flow/.env` and update these lines:

```bash
# Replace these with your actual OAuth credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
```

**Full .env example:**
```bash
# GCP Configuration
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192

# BigQuery
BIGQUERY_DATASET=flow_dataset

# Vertex AI
VERTEX_AI_LOCATION=us-central1

# OAuth Credentials (UPDATE THESE!)
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789

# JWT Secret (already generated)
JWT_SECRET=6yR4QsUuTaA5QVDb/RwbgMtI/RWQ+gIoZWPuLY7bxb0=

# Environment
NODE_ENV=development
```

---

## Step 3: Restart the Server

```bash
# Stop current server
pkill -f "node.*astro"

# Start fresh
cd /Users/alec/flow
npm run dev
```

Note: Server might run on port 3000 or 3001 depending on availability.

---

## Step 4: Test OAuth Login

### Option A: Visit Login Page Directly

1. Open your browser to:
   ```
   http://localhost:3001/auth/login
   ```
   (or port 3000 if that's where it started)

2. You should be redirected to Google's login page

3. Log in with your Google account (alec@getaifactory.com)

4. Grant permissions when asked

5. You should be redirected back to your app with a session cookie!

### Option B: Test with cURL

```bash
# Test login endpoint
curl -v http://localhost:3001/auth/login

# Should return 302 redirect to Google OAuth
```

---

## Step 5: Verify Login is Working

### Test 1: Check Session Cookie
After logging in, open browser DevTools (F12):
1. Go to **Application** tab
2. Check **Cookies** → `http://localhost:3001`
3. Look for `session` cookie

### Test 2: Try Protected Endpoint
```bash
# This should now work (with your session cookie in browser)
curl http://localhost:3001/api/analytics/summary \
  -H "Cookie: session=your-session-cookie-here"
```

### Test 3: Send a Chat Message
Go to: http://localhost:3001/chat

Type a message and send it. If OAuth is working:
- ✅ Message sends successfully
- ✅ AI responds
- ✅ No "Unauthorized" errors

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI doesn't match what's in Google Cloud Console.

**Solution**:
1. Check what port your server is on (3000 or 3001)
2. Go back to Google Cloud Console → Credentials
3. Click your OAuth Client ID
4. Make sure redirect URI matches: `http://localhost:PORT/auth/callback`
5. Save and try again

### Error: "Access blocked: This app is not verified"

**Problem**: Your app is in testing mode and you're not a test user.

**Solution**:
1. Go to OAuth consent screen
2. Add yourself to Test Users
3. Try logging in again

### Error: "Invalid OAuth client"

**Problem**: Client ID or Secret is wrong in .env

**Solution**:
1. Double-check credentials in Google Cloud Console
2. Copy them exactly into .env
3. Restart the server
4. Try again

### Error: "Unauthorized" after login

**Problem**: Session isn't being saved or read properly.

**Solution**:
1. Check browser cookies (should have `session` cookie)
2. Make sure JWT_SECRET is set in .env
3. Try clearing cookies and logging in again

### Server won't start / Port in use

**Solution**:
```bash
# Kill any processes on port 3000-3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Start fresh
npm run dev
```

---

## 🧪 Complete Test Script

Run this to test your entire OAuth setup:

```bash
#!/bin/bash

echo "🧪 Testing OAuth Setup"
echo ""

# Check .env
echo "1️⃣  Checking .env configuration..."
if grep -q "your-client-id" .env; then
  echo "   ❌ OAuth credentials not set in .env"
  echo "   Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
  exit 1
else
  echo "   ✅ OAuth credentials configured"
fi

# Check server
echo ""
echo "2️⃣  Checking server..."
SERVER_PORT=$(lsof -ti:3000,3001 | head -1)
if [ -z "$SERVER_PORT" ]; then
  echo "   ❌ Server not running"
  echo "   Run: npm run dev"
  exit 1
else
  echo "   ✅ Server is running"
fi

# Test login endpoint
echo ""
echo "3️⃣  Testing login endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/login 2>/dev/null || \
           curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login 2>/dev/null)

if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "307" ]; then
  echo "   ✅ Login endpoint redirects (good!)"
else
  echo "   ⚠️  Login endpoint returned: $RESPONSE"
fi

echo ""
echo "4️⃣  Next step: Visit http://localhost:3001/auth/login in your browser"
echo ""
```

Save as `test-oauth.sh`, make executable, and run:
```bash
chmod +x test-oauth.sh
./test-oauth.sh
```

---

## 📊 OAuth Flow Diagram

```
User Browser → /auth/login
    ↓
Flow redirects to Google OAuth
    ↓
User logs in with Google
    ↓
Google redirects to /auth/callback with code
    ↓
Flow exchanges code for user info
    ↓
Flow creates session cookie
    ↓
User redirected to /chat (logged in!)
```

---

## ✅ Success Indicators

You'll know OAuth is working when:

1. ✅ Visiting `/auth/login` redirects to Google
2. ✅ After Google login, you're back at your app
3. ✅ You have a `session` cookie in DevTools
4. ✅ `/api/chat` returns responses (not 401)
5. ✅ You can send messages in the chat interface

---

## 🔍 Debugging Tips

### Enable Debug Logging

Add to your .env:
```bash
DEBUG=flow:*
NODE_ENV=development
```

Restart server and check logs for OAuth flow details.

### Check Auth Code

Look at your auth.ts file to see what's happening:
```bash
cat src/lib/auth.ts | head -50
```

### Test Each Step Manually

1. Get auth URL:
   ```bash
   curl http://localhost:3001/auth/login -v
   ```

2. Visit that URL in browser

3. Copy the callback URL from browser

4. Check if session was created

---

## 🚀 Quick Start Commands

```bash
# 1. Update .env with OAuth credentials
vim .env

# 2. Restart server
pkill -f astro && npm run dev

# 3. Test in browser
open http://localhost:3001/auth/login

# 4. Or test with script
./test-oauth.sh
```

---

## 📱 Testing on Mobile (Bonus)

To test OAuth on your phone:

1. Get your local IP:
   ```bash
   ipconfig getifaddr en0
   ```

2. Start server with --host:
   ```bash
   npm run dev -- --host
   ```

3. Add to OAuth redirect URIs:
   ```
   http://YOUR_IP:3001/auth/callback
   ```

4. Visit on phone:
   ```
   http://YOUR_IP:3001/auth/login
   ```

---

**You're all set! Follow the steps and OAuth should work perfectly!** 🎉

