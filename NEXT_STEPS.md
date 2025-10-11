# 🎯 Next Steps - Quick Reference

## ✅ What's Complete

- [x] Service account created (no keys!)
- [x] Permissions granted
- [x] Local authentication configured
- [x] APIs enabled
- [x] .env file created with JWT secret

---

## 🚨 What You Need to Do Now

### 1. Create OAuth Credentials

**Quick Link**: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192

**Steps**:
1. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
2. If prompted, configure OAuth Consent Screen:
   - User Type: **External**
   - App name: **OpenFlow**
   - User support email: **alec@getaifactory.com**
   - Save and Continue
3. Create OAuth Client:
   - Application type: **Web application**
   - Name: **OpenFlow Web Client**
   - Authorized redirect URIs:
     - `http://localhost:4321/auth/callback`
   - Click **Create**
4. **Copy** the Client ID and Client Secret

### 2. Update .env File

Open `.env` and replace these two lines:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

With your actual OAuth credentials:

```bash
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-secret-here
```

### 3. Run the App

```bash
npm run dev
```

Visit: http://localhost:4321

---

## 📝 Current .env Configuration

```
✅ GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
✅ BIGQUERY_DATASET=openflow_dataset
✅ VERTEX_AI_LOCATION=us-central1
❌ GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com  ← UPDATE THIS
❌ GOOGLE_CLIENT_SECRET=your-client-secret  ← UPDATE THIS
✅ JWT_SECRET=6yR4QsUuTaA5QVDb/RwbgMtI/RWQ+gIoZWPuLY7bxb0=
✅ NODE_ENV=development
```

---

## 🔍 How to Verify It's Working

### 1. Check Authentication
```bash
gcloud auth list
# Should show: alec@getaifactory.com (ACTIVE)
```

### 2. Test API Access
```bash
gcloud services list --enabled | grep -E "bigquery|aiplatform|firestore"
# Should show all three APIs
```

### 3. Start the App
```bash
npm run dev
# Should start without authentication errors
```

### 4. Test in Browser
- Visit: http://localhost:4321
- Click "Sign in with Google"
- Should redirect to Google OAuth
- After auth, should return to your app

---

## 🐛 Common Issues

### Error: "OAuth error" / "Invalid credentials"
**Solution**: Make sure you updated GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env

### Error: "Redirect URI mismatch"
**Solution**: Add `http://localhost:4321/auth/callback` to authorized redirect URIs in Google Cloud Console

### Error: "Permission denied" for GCP APIs
**Solution**: Re-authenticate
```bash
gcloud auth application-default login
```

### Error: "API not enabled"
**Solution**: Enable the API
```bash
gcloud services enable [API_NAME] --project=gen-lang-client-0986191192
```

---

## 📚 Documentation

- **SETUP_COMPLETE.md** - Full setup summary
- **WORKLOAD_IDENTITY_GUIDE.md** - Detailed authentication guide
- **AUTHENTICATION_COMPARISON.md** - Why this is better than keys

---

## 🚀 Ready to Deploy? (Later)

When ready for production:

```bash
# Build
gcloud builds submit --tag gcr.io/gen-lang-client-0986191192/openflow

# Deploy with Workload Identity
gcloud run deploy openflow \
  --image gcr.io/gen-lang-client-0986191192/openflow \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account openflow-service@gen-lang-client-0986191192.iam.gserviceaccount.com \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192"
```

**Note**: For production, create new OAuth credentials with your production domain redirect URI.

---

## 📞 Need Help?

If you get stuck:
1. Check the error message
2. Review SETUP_COMPLETE.md
3. Verify .env file has OAuth credentials
4. Make sure you're authenticated: `gcloud auth list`

---

**You're almost there! Just set up OAuth and you're ready to go!** 🎉

