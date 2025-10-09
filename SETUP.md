# SalfaGPT Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm installed
- Google Cloud Platform account
- Google Cloud Project created

## 1. Google OAuth Configuration

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External (or Internal for Google Workspace)
   - Add your app name: "SalfaGPT"
   - Add user support email
   - Add developer contact email
   - Add scopes: `userinfo.email`, `userinfo.profile`

### Step 2: Configure OAuth Client

1. Application type: **Web application**
2. Name: "SalfaGPT Web Client"

#### For Local Development

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
```

#### For Production

**Authorized JavaScript origins:**
```
https://your-domain.com
```

**Authorized redirect URIs:**
```
https://your-domain.com/auth/callback
```

### Step 3: Get Your Credentials

After creating the OAuth client:
1. Copy the **Client ID** 
2. Copy the **Client Secret**
3. Save these for the next step

## 2. Environment Variables Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret

# Application URLs
PUBLIC_BASE_URL=http://localhost:3000

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret

# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# BigQuery Configuration
BIGQUERY_DATASET=salfagpt_dataset

# Vertex AI Configuration
VERTEX_AI_LOCATION=us-central1

# Session Configuration
SESSION_COOKIE_NAME=salfagpt_session
SESSION_MAX_AGE=86400

# Security
NODE_ENV=development
```

### Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
openssl rand -base64 32
```

## 3. Google Cloud Setup

### Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: "salfagpt-service"
4. Grant these roles:
   - BigQuery Admin
   - Vertex AI User
5. Click **Create Key** > **JSON**
6. Save the key as `gcp-service-account-key.json` in the project root

### Enable Required APIs

Enable these APIs in Google Cloud Console:
```bash
gcloud services enable bigquery.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable oauth2.googleapis.com
```

Or via console:
- BigQuery API
- Vertex AI API
- OAuth 2.0 API

### Initialize BigQuery Dataset

Run this setup script to create the necessary tables:
```bash
npm run setup:bigquery
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## 6. Production Deployment to Google Cloud Run

### Build the Docker Image

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["node", "./dist/server/entry.mjs"]
```

### Deploy to Cloud Run

1. Build and push the image:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/salfagpt
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy salfagpt \
  --image gcr.io/YOUR_PROJECT_ID/salfagpt \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
  --set-env-vars "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}" \
  --set-env-vars "NODE_ENV=production"
```

3. Update your `.env` for production:
   - Set `PUBLIC_BASE_URL` to your Cloud Run URL
   - Update OAuth redirect URIs in Google Cloud Console

### Update OAuth Configuration for Production

After deployment, get your Cloud Run URL (e.g., `https://salfagpt-xxx-uc.a.run.app`)

Update in Google Cloud Console:
1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client
3. Add production URLs:
   - **Authorized JavaScript origins:** `https://salfagpt-xxx-uc.a.run.app`
   - **Authorized redirect URIs:** `https://salfagpt-xxx-uc.a.run.app/auth/callback`

## 7. Security Best Practices

✅ **Implemented:**
- HTTPOnly cookies for session management
- Secure cookies in production (HTTPS only)
- JWT token expiration (24 hours)
- SameSite cookie policy
- CSRF protection via SameSite cookies
- Environment variable isolation
- Service account with minimal permissions

✅ **Additional Recommendations:**
- Enable Cloud Armor for DDoS protection
- Set up Cloud Identity-Aware Proxy (IAP) for additional security
- Enable Cloud Audit Logs
- Implement rate limiting
- Add Content Security Policy headers
- Regular security audits

## 8. Monitoring and Logging

View logs:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt" --limit 50
```

## Troubleshooting

### OAuth Error: redirect_uri_mismatch
- Verify redirect URIs in Google Cloud Console match exactly
- Include the protocol (http:// or https://)
- No trailing slashes
- Port must match if not 80/443

### BigQuery Permissions Error
- Verify service account has BigQuery Admin role
- Check GOOGLE_APPLICATION_CREDENTIALS path is correct
- Ensure BigQuery API is enabled

### Vertex AI Error
- Verify Vertex AI API is enabled
- Check service account has Vertex AI User role
- Verify location is supported (us-central1 recommended)

## Next Steps

- Customize the UI
- Add more AI features
- Implement chat history loading
- Add file uploads
- Integrate Google AgentKit (ADK)
- Set up CI/CD pipeline

