# 🚀 Quick Start Guide

## Current Status

✅ **Dev Server Running:** `http://localhost:3000`  
✅ **All Features Implemented**  
⚠️ **OAuth Configuration Required**

---

## Google OAuth Configuration (Required)

### Step 1: Get OAuth Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (or use existing)
3. Configure for **local development:**

#### ✅ Authorized JavaScript Origins
```
http://localhost:3000
```

#### ✅ Authorized Redirect URIs
```
http://localhost:3000/auth/callback
```

### Step 2: Update Environment Variables

Copy your credentials and update `.env`:

```bash
# Required OAuth credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# Application URL (already correct for local)
PUBLIC_BASE_URL=http://localhost:3000

# JWT Secret (generate new one)
JWT_SECRET=$(openssl rand -base64 32)

# Optional: GCP Project (for BigQuery/Vertex AI)
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json
BIGQUERY_DATASET=salfagpt_dataset
VERTEX_AI_LOCATION=us-central1
```

### Step 3: Generate JWT Secret

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env` file as `JWT_SECRET`.

---

## Testing the Application

### 1. Visit the Landing Page

Open your browser to:
```
http://localhost:3000
```

You should see:
- ✨ Modern gradient background
- 📝 Value proposition on the left
- 🔐 Google sign-in button on the right

### 2. Test Google OAuth (After Configuration)

1. Click "Continue with Google"
2. Select your Google account
3. Grant permissions
4. You should be redirected to `/home` (chat interface)

### 3. Explore the Chat Interface

After logging in, you'll see:
- 💬 ChatGPT-like interface
- 👤 User profile in header
- 📋 Sidebar with chat history (mockup)
- ✍️ Message input box
- 🤖 AI response area

---

## Optional: BigQuery & Vertex AI Setup

### If You Want to Test AI Features:

1. **Create GCP Service Account:**
   ```bash
   gcloud iam service-accounts create salfagpt-service \
     --display-name="SalfaGPT Service Account"
   ```

2. **Grant Permissions:**
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:salfagpt-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/bigquery.admin"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:salfagpt-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

3. **Download Key:**
   ```bash
   gcloud iam service-accounts keys create gcp-service-account-key.json \
     --iam-account=salfagpt-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Initialize BigQuery:**
   ```bash
   npm run setup:bigquery
   ```

5. **Enable APIs:**
   ```bash
   gcloud services enable bigquery.googleapis.com
   gcloud services enable aiplatform.googleapis.com
   ```

---

## Current Features

### ✅ Implemented
- Landing page with Google OAuth
- Secure authentication flow
- Session management with JWT
- Protected routes
- Chat interface (mockup)
- Modern responsive UI
- Security best practices

### 🔄 Requires Configuration
- Google OAuth credentials
- GCP service account (optional)
- BigQuery integration (optional)
- Vertex AI integration (optional)

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Verify OAuth redirect URIs match exactly
- Check for `http://` vs `https://`
- Ensure port number matches (`:3000`)
- Wait 5-10 minutes after updating OAuth config

### Session Not Working
- Check `JWT_SECRET` is set in `.env`
- Verify cookies are enabled in browser
- Clear browser cookies and try again

### CSS Not Loading
- Run `npm run build` to verify CSS compilation
- Check browser console for errors
- Verify Tailwind CSS v3.4.17 is installed

---

## Next Steps

1. ✅ **Configure OAuth** (see instructions above)
2. ✅ **Test login flow** at `http://localhost:3000`
3. 🎨 **Customize UI** as needed
4. 🤖 **Set up GCP** for AI features (optional)
5. 🚀 **Deploy to production** when ready

---

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[OAUTH_CONFIG.md](./OAUTH_CONFIG.md)** - Detailed OAuth instructions
- **[README.md](./README.md)** - Project overview
- **[docs/BranchLog.md](./docs/BranchLog.md)** - Development log

---

## Need Help?

Check the detailed guides:
- OAuth issues → [OAUTH_CONFIG.md](./OAUTH_CONFIG.md)
- Deployment → [SETUP.md](./SETUP.md)
- Architecture → [README.md](./README.md)

---

**🎉 Your app is ready to test! Just configure OAuth and start building!**

