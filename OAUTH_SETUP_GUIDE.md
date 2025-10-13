# 🔐 OAuth Setup - Quick Fix Guide

## ❌ Error You're Seeing

```
Access blocked: SalfaGPT's request is invalid
Error 400: redirect_uri_mismatch
```

**Reason**: The production URL is not registered in Google Cloud Console.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Open Google Cloud Console

**Direct Link**: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192

### Step 2: Find Your OAuth Client

Look for the OAuth 2.0 Client ID:
```
1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic
```

Click on it to edit.

### Step 3: Add Production Redirect URI

In the **"Authorized redirect URIs"** section, add:

```
https://flow-chat-cno6l2kfga-uc.a.run.app/auth/callback
```

### Step 4: Verify You Have Both URIs

Your final list should include:

```
✅ http://localhost:3000/auth/callback
✅ https://flow-chat-cno6l2kfga-uc.a.run.app/auth/callback
```

### Step 5: Save

Click **"Save"** at the bottom.

---

## ⏱️ Wait 5 Minutes

OAuth changes take ~5 minutes to propagate globally.

---

## 🧪 Test It

### After 5 minutes, try logging in again:

**Production**: https://flow-chat-cno6l2kfga-uc.a.run.app/chat

You should now be able to:
1. Click "Login with Google"
2. Select your account
3. Get redirected back to the app
4. See your chat interface

---

## 🔧 Technical Details

### Configuration Updated

**Files Changed**:
- `astro.config.mjs` - Added `strictPort: true` to force port 3000
- `.cursor/rules/project-identity.mdc` - Documented OAuth configuration

### Why Port 3000 Only?

Before, Astro would auto-switch to 3001, 3002 if port 3000 was busy. This caused:
- Inconsistent OAuth redirect URIs
- Need to register multiple local URLs
- Confusion during development

Now:
- **ALWAYS port 3000** (`strictPort: true`)
- If 3000 is in use, server will error (not auto-switch)
- Keeps OAuth URIs consistent
- Only 1 local URI to register

### OAuth Flow

```
1. User clicks "Login with Google"
   ↓
2. Redirects to: accounts.google.com/signin/oauth
   ↓
3. User authenticates
   ↓
4. Google redirects to: https://flow-chat-cno6l2kfga-uc.a.run.app/auth/callback
   ↓
5. Backend creates session
   ↓
6. User redirected to: /chat
```

---

## 📝 What to Do If It Still Fails

### Check 1: Verify URI in Console

```bash
# Should show your URIs
gcloud alpha services api-keys get-key-string 1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic
```

### Check 2: Check Service Logs

```bash
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=flow-chat \
  AND severity>=ERROR" \
  --limit 20 \
  --format json
```

### Check 3: Verify Environment Variables

```bash
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

Should show:
- `GOOGLE_CLIENT_ID` (from Secret Manager)
- `PUBLIC_BASE_URL` = https://flow-chat-cno6l2kfga-uc.a.run.app

### Check 4: Test OAuth Endpoint

```bash
curl -I https://flow-chat-cno6l2kfga-uc.a.run.app/auth/login
```

Should return `302` (redirect to Google).

---

## 🎯 Success Checklist

- [ ] Opened Google Cloud Console
- [ ] Found OAuth Client ID
- [ ] Added production redirect URI
- [ ] Clicked Save
- [ ] Waited 5 minutes
- [ ] Tested login in production
- [ ] Successfully logged in

---

## 💡 Pro Tips

### Local Development

Always use port 3000:
```bash
# If port 3000 is in use, find and kill the process:
lsof -ti:3000 | xargs kill -9

# Then start dev server:
npm run dev
```

### Production Updates

After any service redeployment, verify the URL hasn't changed:
```bash
gcloud run services describe flow-chat --region us-central1 \
  --format="value(status.url)"
```

If URL changed, update OAuth redirect URI in Google Cloud Console.

---

## 📚 References

- **Google OAuth 2.0 Docs**: https://developers.google.com/identity/protocols/oauth2/web-server
- **Redirect URI Mismatch**: https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch
- **Project Rules**: `.cursor/rules/project-identity.mdc`

---

**Status**: ⏳ Waiting for you to update Google Cloud Console  
**Time**: ~5 minutes to fix  
**Next**: Test login after saving changes

🎉 **Once done, you'll be able to login and test the PDF upload feature!**

