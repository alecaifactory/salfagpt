# Environment Variables Reference

## 🔗 .env Variables ↔️ Command Variables

This document clarifies the relationship between variables in your `.env` file and the variables used in setup commands.

---

## Variable Mapping

| .env File Variable | Command Variable | Description | Example |
|-------------------|------------------|-------------|---------|
| `GOOGLE_CLOUD_PROJECT` | `PROJECT_ID` or `YOUR_PROJECT_ID` | Your GCP project ID | `my-project-12345` |
| (your Google email) | `YOUR_EMAIL` | Your Google account email | `you@gmail.com` |
| (auto-generated) | `SERVICE_ACCOUNT_EMAIL` | Service account email | `salfagpt-service@my-project-12345.iam.gserviceaccount.com` |

---

## Example Setup

### Your .env file:
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=my-salfagpt-project-12345

# ❌ NOT NEEDED with Workload Identity:
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# Other configuration...
BIGQUERY_DATASET=salfagpt_dataset
VERTEX_AI_LOCATION=us-central1
```

### Corresponding commands:
```bash
# Set variables for commands
export PROJECT_ID="my-salfagpt-project-12345"        # ← Same as GOOGLE_CLOUD_PROJECT
export YOUR_EMAIL="your-email@gmail.com"              # ← Your Google account
export SERVICE_ACCOUNT_EMAIL="salfagpt-service@my-salfagpt-project-12345.iam.gserviceaccount.com"

# Now run setup commands...
```

---

## Quick Setup Template

**Step 1: Get your project ID from .env**
```bash
# Look at your .env file and find GOOGLE_CLOUD_PROJECT
cat .env | grep GOOGLE_CLOUD_PROJECT
# Output: GOOGLE_CLOUD_PROJECT=my-project-12345
```

**Step 2: Export variables**
```bash
# Replace with your actual values
export PROJECT_ID="my-project-12345"                    # ← From GOOGLE_CLOUD_PROJECT
export YOUR_EMAIL="your-email@gmail.com"                # ← Your Google email
export SERVICE_ACCOUNT_EMAIL="salfagpt-service@${PROJECT_ID}.iam.gserviceaccount.com"
```

**Step 3: Verify**
```bash
echo "Project ID: ${PROJECT_ID}"
echo "Your Email: ${YOUR_EMAIL}"
echo "Service Account: ${SERVICE_ACCOUNT_EMAIL}"
```

---

## All Environment Variables

### Required in .env

```bash
# Google Cloud Project
GOOGLE_CLOUD_PROJECT=your-project-id          # REQUIRED - Your GCP project ID

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com    # REQUIRED - From Google Cloud Console
GOOGLE_CLIENT_SECRET=xxx                           # REQUIRED - From Google Cloud Console

# JWT Secret
JWT_SECRET=your_generated_jwt_secret               # REQUIRED - Generated with: openssl rand -base64 32

# Application URL
PUBLIC_BASE_URL=http://localhost:3000              # REQUIRED - Your app URL
```

### Optional in .env

```bash
# BigQuery Configuration
BIGQUERY_DATASET=salfagpt_dataset                  # Optional - Defaults to "salfagpt_dataset"

# Vertex AI Configuration  
VERTEX_AI_LOCATION=us-central1                     # Optional - Defaults to "us-central1"

# Session Configuration
SESSION_COOKIE_NAME=salfagpt_session               # Optional - Defaults to "salfagpt_session"
SESSION_MAX_AGE=86400                              # Optional - Defaults to 86400 (24 hours)

# Security
NODE_ENV=development                               # Optional - "development" or "production"
```

### NOT Needed with Workload Identity

```bash
# ❌ REMOVE THIS LINE - Not needed with Workload Identity:
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json
```

---

## Deployment Variables

### Cloud Run Deployment
```bash
gcloud run deploy salfagpt \
  --image gcr.io/${PROJECT_ID}/salfagpt \              # ← Uses PROJECT_ID
  --service-account ${SERVICE_ACCOUNT_EMAIL} \         # ← Uses SERVICE_ACCOUNT_EMAIL
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"  # ← Sets env var for app
```

---

## Quick Reference Commands

### Check current project
```bash
gcloud config get-value project
```

### Set default project
```bash
gcloud config set project YOUR_PROJECT_ID
```

### List your projects
```bash
gcloud projects list
```

### Check authentication
```bash
gcloud auth list
```

### Check service account
```bash
gcloud iam service-accounts list --project=${PROJECT_ID}
```

---

## Common Mistakes

### ❌ Wrong: Using placeholder values
```bash
export PROJECT_ID="YOUR_PROJECT_ID"  # Don't leave as placeholder!
```

### ✅ Correct: Using actual values
```bash
export PROJECT_ID="my-salfagpt-project-12345"  # Use your real project ID
```

---

### ❌ Wrong: Mismatched project IDs
```bash
# .env file
GOOGLE_CLOUD_PROJECT=project-abc

# Commands
export PROJECT_ID="project-xyz"  # Different project ID!
```

### ✅ Correct: Matching project IDs
```bash
# .env file
GOOGLE_CLOUD_PROJECT=my-project-12345

# Commands
export PROJECT_ID="my-project-12345"  # Same project ID ✓
```

---

### ❌ Wrong: Keeping old credentials line
```bash
# .env file
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json  # Remove this!
```

### ✅ Correct: Removed credentials line
```bash
# .env file
# GOOGLE_APPLICATION_CREDENTIALS not needed with Workload Identity
GOOGLE_CLOUD_PROJECT=my-project-12345
```

---

## Validation Checklist

Before running commands, verify:

- [ ] `PROJECT_ID` matches `GOOGLE_CLOUD_PROJECT` from .env
- [ ] `YOUR_EMAIL` is your actual Google account email
- [ ] `SERVICE_ACCOUNT_EMAIL` uses the correct `PROJECT_ID`
- [ ] Removed `GOOGLE_APPLICATION_CREDENTIALS` from .env
- [ ] All environment variables have actual values (no placeholders)

---

## Need Help?

If you're unsure about any values:

1. **Check your .env file**: `cat .env`
2. **Check your GCP project**: `gcloud projects list`
3. **Check your auth**: `gcloud auth list`
4. **Verify setup**: `gcloud config list`

---

**Remember**: `PROJECT_ID` in commands = `GOOGLE_CLOUD_PROJECT` in .env ✨

