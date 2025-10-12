# 🚀 Deploy Flow to Cloud Run

## Current Issue
The local gcloud authentication has scope limitations. Here are your deployment options:

---

## ✅ **OPTION 1: Deploy via GCP Console** (EASIEST - Recommended)

### Step 1: Open Cloud Shell
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **`gen-lang-client-0986191192`**
3. Click the **Cloud Shell** icon (terminal icon in top right)

### Step 2: Upload Your Code
In Cloud Shell, run:
```bash
# Create directory
mkdir -p ~/flow
cd ~/flow

# Upload your files (or clone from git)
# You can drag & drop files into Cloud Shell or use git
```

### Step 3: Deploy
```bash
gcloud run deploy flow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production,VERTEX_AI_LOCATION=us-central1"
```

**That's it!** Cloud Run will build and deploy automatically.

---

## 📋 **OPTION 2: Deploy from Local Machine**

### Prerequisites
You need to fix the authentication first.

### Step 1: Re-authenticate with proper scopes
```bash
# Remove old credentials
rm -rf ~/.config/gcloud/application_default_credentials.json

# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project gen-lang-client-0986191192
```

### Step 2: Run the deployment script
```bash
./DEPLOY_COMMANDS.sh
```

Or manually:
```bash
# Enable APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com

# Deploy
gcloud run deploy flow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production"
```

---

## 🔒 **OPTION 3: Deploy with OAuth Secrets** (Production-Ready)

### Step 1: Create secrets in Secret Manager
```bash
# Enable Secret Manager
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo -n "YOUR_GOOGLE_CLIENT_ID" | gcloud secrets create google-client-id --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
```

### Step 2: Create service account
```bash
gcloud iam service-accounts create flow-service \
  --display-name="Flow Service Account"

# Grant permissions
PROJECT_ID="gen-lang-client-0986191192"
SA_EMAIL="flow-service@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/bigquery.admin"

# Allow service account to access secrets
for SECRET in google-client-id google-client-secret jwt-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Step 3: Deploy with secrets
```bash
gcloud run deploy flow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account="flow-service@gen-lang-client-0986191192.iam.gserviceaccount.com" \
  --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production,VERTEX_AI_LOCATION=us-central1"
```

---

## 📝 **After Deployment**

### 1. Get Your Cloud Run URL
After deployment, you'll see output like:
```
Service URL: https://flow-abc123-uc.a.run.app
```

### 2. Update Google OAuth Configuration
1. Go to [Google Cloud Console > APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add authorized origins:
   ```
   https://flow-abc123-uc.a.run.app
   ```
4. Add authorized redirect URIs:
   ```
   https://flow-abc123-uc.a.run.app/auth/callback
   ```

### 3. Test Your Deployment
```bash
# Test the endpoint
curl https://flow-abc123-uc.a.run.app

# View logs
gcloud run services logs read flow --region=us-central1
```

---

## 🔧 **Troubleshooting**

### "Permission denied" errors
- Ensure you're authenticated: `gcloud auth login`
- Verify project access: `gcloud projects list`
- Check you have Owner or Editor role on the project

### "APIs not enabled" errors
Run this in Cloud Shell or after proper authentication:
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
```

### Build fails
- Check Dockerfile syntax
- Verify package.json has all dependencies
- Check build logs: `gcloud builds list`

### App crashes on Cloud Run
```bash
# View logs
gcloud run services logs read flow --region=us-central1 --limit=50

# Check environment variables
gcloud run services describe flow --region=us-central1
```

---

## 💡 **Recommended Approach**

1. **Use Option 1** (Cloud Shell) for first deployment - it's simplest
2. **Add OAuth credentials** via Secret Manager for production
3. **Monitor** your app: `gcloud run services logs tail flow --region=us-central1`

---

## 📊 **Deployment Checklist**

- [ ] APIs enabled (Cloud Run, Cloud Build, Container Registry)
- [ ] Code ready (Dockerfile, package.json, etc.)
- [ ] OAuth credentials created (if needed)
- [ ] Service account created (for production)
- [ ] Secrets configured (for production)
- [ ] Deploy command executed
- [ ] OAuth redirect URIs updated with Cloud Run URL
- [ ] Test the deployed application
- [ ] Monitor logs for errors

---

**Need help?** Check the logs or deployment status:
```bash
gcloud run services describe flow --region=us-central1
```

