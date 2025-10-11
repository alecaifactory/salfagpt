# Quick Setup (No Service Account Keys Required!)

## 🎯 TL;DR - What You Need

Your organization blocks service account keys (good security!). Here's what to do:

---

## 📋 Required Service Account Permissions

When creating your service account, grant these roles:

| Role | Permission ID | What It Does |
|------|--------------|--------------|
| **BigQuery Admin** | `roles/bigquery.admin` | Analytics dashboard, chat storage |
| **Vertex AI User** | `roles/aiplatform.user` | Gemini AI responses |
| **Cloud Datastore User** | `roles/datastore.user` | Firestore session management |
| **Logs Writer** (optional) | `roles/logging.logWriter` | Application logging |

---

## ⚡ Quick Commands

### 1. Create Service Account & Grant Permissions

```bash
# Set your project (this is the GOOGLE_CLOUD_PROJECT from your .env file)
export PROJECT_ID="your-project-id"  # Replace with your actual GCP project ID
export SERVICE_ACCOUNT_EMAIL="flow-service@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
gcloud iam service-accounts create flow-service \
  --display-name="Flow Service Account" \
  --project=${PROJECT_ID}

# Grant all required permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/bigquery.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/datastore.user"
```

### 2. Setup Local Development

```bash
# Authenticate with your Google account
gcloud auth application-default login

# Give yourself the same permissions
export YOUR_EMAIL="your-email@gmail.com"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/bigquery.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/datastore.user"
```

### 3. Update .env File

```bash
# .env
GOOGLE_CLOUD_PROJECT=your-project-id  # This is YOUR_PROJECT_ID used in commands above

# ❌ REMOVE THIS LINE (not needed with Workload Identity):
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# Keep the rest of your config
BIGQUERY_DATASET=flow_dataset
VERTEX_AI_LOCATION=us-central1
```

**Note**: The `GOOGLE_CLOUD_PROJECT` value in your `.env` file is the same as `YOUR_PROJECT_ID` used in all the commands above.

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Deploy to Production

```bash
# Build
gcloud builds submit --tag gcr.io/${PROJECT_ID}/flow

# Deploy with service account (Workload Identity)
gcloud run deploy flow \
  --image gcr.io/${PROJECT_ID}/flow \
  --region us-central1 \
  --service-account ${SERVICE_ACCOUNT_EMAIL} \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
```

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# 1. Check service account exists
gcloud iam service-accounts list --project=${PROJECT_ID} | grep flow

# 2. Check service account permissions
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --format="table(bindings.role)"

# Should show:
# roles/aiplatform.user
# roles/bigquery.admin
# roles/datastore.user

# 3. Check your local authentication
gcloud auth list  # Your email should have a * next to it

# 4. Test BigQuery access
gcloud bigquery datasets list --project=${PROJECT_ID}
```

---

## 🔄 How It Works

### Local Development:
- Your code uses **Application Default Credentials**
- Google Cloud SDK authenticates with **your Google account**
- No key files needed!

### Production (Cloud Run):
- Cloud Run uses **Workload Identity**
- Automatically authenticates as the **service account**
- No key files needed!

---

## 🆚 Old Way vs. New Way

### ❌ Old Way (Insecure):
1. Create service account
2. Download JSON key file
3. Put file in repo (risk of leaking)
4. Rotate keys every 90 days manually
5. If leaked, attacker has full access

### ✅ New Way (Secure):
1. Create service account
2. Grant permissions
3. Deploy with `--service-account` flag
4. Google manages everything automatically
5. No files to leak!

---

## 📚 Full Documentation

For detailed explanations, see:
- **[WORKLOAD_IDENTITY_GUIDE.md](./WORKLOAD_IDENTITY_GUIDE.md)** - Complete walkthrough with troubleshooting
- **[SETUP.md](./SETUP.md)** - Full application setup guide

---

## 🚨 Common Errors & Solutions

### "Service account key creation is disabled"
✅ **This is expected!** Use the commands above (no keys needed)

### "Error: PERMISSION_DENIED" locally
```bash
gcloud auth application-default login
```

### "Error: PERMISSION_DENIED" on Cloud Run
```bash
# Verify Cloud Run is using the service account
gcloud run services describe flow \
  --region=us-central1 \
  --format="value(spec.template.spec.serviceAccountName)"
```

### "Error: Vertex AI API not enabled"
```bash
gcloud services enable aiplatform.googleapis.com --project=${PROJECT_ID}
gcloud services enable bigquery.googleapis.com --project=${PROJECT_ID}
```

---

## 🎯 Bottom Line

**You don't need service account keys!**

This is actually **better** than the old method:
- ✅ More secure
- ✅ No manual key rotation
- ✅ Organization compliant
- ✅ Easier to manage

Just follow the 5 quick commands above and you're set! 🚀

