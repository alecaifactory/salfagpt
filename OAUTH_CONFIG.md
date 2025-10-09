# Google OAuth Configuration Quick Reference

## 📋 OAuth Setup Checklist

### Local Development Configuration

#### Authorized JavaScript Origins
```
http://localhost:3000
```

**Important Notes:**
- ✅ Use `http://` (not `https://`) for localhost
- ✅ Include the port number (`:3000`)
- ❌ NO trailing slash
- ❌ NO wildcards
- ❌ NO paths (just the origin)

#### Authorized Redirect URIs
```
http://localhost:3000/auth/callback
```

**Important Notes:**
- ✅ Must include the full path (`/auth/callback`)
- ✅ Must match exactly with your callback route
- ❌ NO wildcards
- ❌ NO URL fragments
- ❌ NO relative paths
- ❌ Cannot be a public IP address

---

### Production Configuration

#### Authorized JavaScript Origins
```
https://your-domain.com
https://your-subdomain.your-domain.com
```

**For Google Cloud Run:**
```
https://salfagpt-[hash]-uc.a.run.app
```

**Important Notes:**
- ✅ Must use `https://` (required for production)
- ✅ Add each domain/subdomain separately
- ❌ NO port numbers (use standard 443)
- ❌ NO trailing slashes

#### Authorized Redirect URIs
```
https://your-domain.com/auth/callback
https://your-subdomain.your-domain.com/auth/callback
```

**For Google Cloud Run:**
```
https://salfagpt-[hash]-uc.a.run.app/auth/callback
```

---

## 🔧 Step-by-Step OAuth Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **"APIs & Services"** → **"Credentials"**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**

### 2. Configure OAuth Consent Screen

If this is your first time:

1. Click **"Configure Consent Screen"**
2. Select **"External"** (or "Internal" for Google Workspace)
3. Fill in required information:
   - **App name:** SalfaGPT
   - **User support email:** your-email@example.com
   - **Developer contact:** your-email@example.com
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (for testing phase)
6. Save and continue

### 3. Create OAuth Client

1. **Application type:** Web application
2. **Name:** SalfaGPT Web Client
3. Add **Authorized JavaScript origins** (see above)
4. Add **Authorized redirect URIs** (see above)
5. Click **"Create"**

### 4. Save Your Credentials

You'll receive:
- **Client ID:** `xxxxx.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-xxxxx`

⚠️ **Keep these secret!** Add them to your `.env` file.

---

## 🚨 Common Errors and Solutions

### Error: `redirect_uri_mismatch`

**Cause:** The redirect URI doesn't match what's configured in Google Cloud Console.

**Solutions:**
- ✅ Check for exact match (including `http://` vs `https://`)
- ✅ Verify the port number matches
- ✅ Ensure no trailing slashes
- ✅ Wait 5-10 minutes after updating OAuth config (changes take time)

### Error: `invalid_client`

**Cause:** Client ID or Client Secret is incorrect.

**Solutions:**
- ✅ Verify `GOOGLE_CLIENT_ID` in `.env` matches Google Cloud Console
- ✅ Verify `GOOGLE_CLIENT_SECRET` in `.env` matches Google Cloud Console
- ✅ Check for extra spaces or newlines in `.env` file

### Error: `access_denied`

**Cause:** User denied permission or app is not verified.

**Solutions:**
- ✅ Ensure OAuth consent screen is properly configured
- ✅ Add test users during testing phase
- ✅ Verify required scopes are added

---

## 📝 Environment Variables

Update your `.env` file:

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
PUBLIC_BASE_URL=http://localhost:3000
```

For production:
```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
PUBLIC_BASE_URL=https://your-domain.com
```

---

## 🧪 Testing Your OAuth Configuration

### Test Locally

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`

3. Click "Continue with Google"

4. You should be redirected to Google's sign-in page

5. After signing in, you should be redirected back to `/home`

### Test Production

1. Deploy your app to Cloud Run (or your hosting platform)

2. Update OAuth configuration with production URLs

3. Wait 5-10 minutes for changes to propagate

4. Test the login flow

---

## 🔐 Security Best Practices

✅ **DO:**
- Use HTTPS in production (required by Google)
- Keep Client Secret in `.env` (never commit to Git)
- Use different OAuth clients for dev and production
- Rotate Client Secret periodically
- Enable 2FA on your Google Cloud account

❌ **DON'T:**
- Commit `.env` to version control
- Share Client Secret publicly
- Use production credentials in development
- Hardcode credentials in your code

---

## 📞 Need Help?

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

## ⏱️ Propagation Time

**Important:** After updating OAuth configuration in Google Cloud Console:
- **Local changes:** Usually immediate
- **Production changes:** Can take 5-10 minutes to propagate
- **Consent screen changes:** Can take up to 1 hour

If your changes aren't working immediately, wait a few minutes and try again.

