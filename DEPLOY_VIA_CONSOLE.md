# Deploy Flow via Google Cloud Console

## Quick Deploy Instructions

The local network has persistent issues pushing to Container Registry. Deploy via Cloud Console instead:

### Option 1: Deploy from Source (Recommended)

1. **Open Cloud Console:**
   https://console.cloud.google.com/run/create?project=gen-lang-client-0986191192

2. **Configure:**
   - Service name: `flow`
   - Region: `us-central1`
   - Select "Deploy one revision from source"
   - Click "Set up with Cloud Build"

3. **Source:**
   - Repository provider: Upload files
   - Upload the zip: `/Users/alec/flow-deploy.zip`
   
4. **Build Configuration:**
   - Build type: Dockerfile
   - Source location: `/Dockerfile`

5. **Container Settings:**
   - Port: 8080
   - Environment variables:
     - `GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192`
     - `NODE_ENV=production`
     - `VERTEX_AI_LOCATION=us-central1`

6. **Authentication:**
   - Allow unauthenticated invocations: Yes

7. Click **CREATE**

### Option 2: Cloud Shell (Fastest)

```bash
# Open Cloud Shell
# Upload flow-deploy.zip

unzip flow-deploy.zip
cd flow

gcloud run deploy flow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production,VERTEX_AI_LOCATION=us-central1"
```

This will work because Cloud Shell has direct, fast connectivity to GCP services.

### Success Criteria

After deployment:
- You'll receive a URL: `https://flow-[hash]-uc.a.run.app`
- Landing page should load with the gradient design
- Chat interface accessible at `/chat`

### Current Status

**Local Testing:** ✅ All passed
- Dev server: ✅ Working
- Landing page: ✅ Loads correctly
- Chat interface: ✅ Works in dev mode  
- Build: ✅ Completes successfully

**Deployment:** ❌ Registry push timeout (network issue)
- Attempt 1: Failed (auth required)
- Attempt 2: Skipped (requires user)
- Attempt 3: Failed (registry push timeout)
- **Solution:** Use Cloud Console or Cloud Shell

