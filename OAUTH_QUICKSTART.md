# 🚀 OAuth Quick Start - 5 Minutes

Your server is running on: **http://localhost:3000**

---

## Step 1: Create OAuth Credentials (2 minutes)

### Click this link:
👉 **https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192**

### Then:

1. Click **"+ CREATE CREDENTIALS"** button at the top
2. Select **"OAuth 2.0 Client ID"**

### If you see "Configure Consent Screen" warning:

**Click "CONFIGURE CONSENT SCREEN"**

Then:
- User Type: **External** → Click **CREATE**
- App name: `OpenFlow` 
- User support email: `alec@getaifactory.com`
- Developer contact: `alec@getaifactory.com`
- Click **SAVE AND CONTINUE** (3 times to skip optional steps)
- Click **BACK TO DASHBOARD**

Now go back to **Credentials** tab and try again.

---

## Step 2: Configure OAuth Client (2 minutes)

Fill in the form:

**Application type:** Web application

**Name:** `OpenFlow Local`

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
```

Click **CREATE**

---

## Step 3: Copy Credentials (1 minute)

A popup will show:
- **Client ID**: Something like `123456-abc.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123def456`

**Copy both!**

---

## Step 4: Update .env File

Open your `.env` file and replace these lines:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

With your actual credentials:

```bash
GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

Save the file.

---

## Step 5: Restart Server

```bash
# Stop server
pkill -f "node.*astro"

# Start fresh
npm run dev
```

---

## Step 6: Test It!

**Option A: Run the test script**
```bash
./test-oauth.sh
```

**Option B: Test manually**
1. Open: http://localhost:3000/auth/login
2. Log in with your Google account
3. After login, you should be back at the app
4. Go to: http://localhost:3000/chat
5. Send a message - it should work!

---

## ✅ How to Know It's Working

After logging in:
- ✅ No "Unauthorized" errors
- ✅ You can send chat messages
- ✅ Browser DevTools shows `openflow_session` cookie

---

## 🐛 Common Issues

### "redirect_uri_mismatch" error
- Make sure redirect URI is exactly: `http://localhost:3000/auth/callback`
- No trailing slash!
- Port must match where your server is running

### "This app is blocked" error
- Go back to OAuth consent screen
- Add yourself as a Test User
- Save and try again

### Still getting 401 errors
- Check .env file has the correct credentials
- Make sure you restarted the server
- Clear browser cookies and try logging in again

---

## 📚 Detailed Guide

For more details, see: **OAUTH_LOCAL_TESTING.md**

---

**That's it! You should be up and running in 5 minutes!** 🎉
