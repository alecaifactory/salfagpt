# Quick Start - No Keys Required! 🚀

## Why You Don't Need Keys

Your organization blocks key creation for security. This is GOOD! 
Workload Identity is more secure and easier to manage.

## Setup (5 Minutes)

### 1. Create Service Account + Grant Permissions
```bash
./setup-service-account.sh
```

### 2. Setup Local Development
```bash
./setup-local-auth.sh
```

### 3. Create .env File
```bash
cat > .env << 'ENVFILE'
# GCP Configuration
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192

# BigQuery
BIGQUERY_DATASET=salfagpt_dataset

# Vertex AI
VERTEX_AI_LOCATION=us-central1

# OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here

# Node Environment
NODE_ENV=development
ENVFILE
```

### 4. Run the App
```bash
npm install
npm run dev
```

## How It Works

**Local Development:**
- Uses YOUR Google account credentials
- No keys needed!
- Run: `gcloud auth application-default login`

**Production (Cloud Run):**
- Uses the service account automatically
- No keys needed!
- Deploy with: `--service-account salfagpt-service@PROJECT_ID.iam.gserviceaccount.com`

## Benefits

✅ No key files to leak
✅ No manual key rotation
✅ Organization compliant
✅ More secure
✅ Automatic credential management

Done! 🎉
