# Workload Identity Setup Guide

## 🎯 Your Situation

Your organization has disabled service account key creation (error `iam.disableServiceAccountKeyCreation`). This is actually a **security best practice**! Let's set up authentication the modern, secure way.

---

## ✅ What You Need to Do

### Step 1: Create the Service Account (No Keys!)

Run these commands in your terminal:

```bash
# Set your project ID (this is GOOGLE_CLOUD_PROJECT from your .env file)
export PROJECT_ID="your-actual-project-id"  # Replace with your GCP project ID

# Create the service account
gcloud iam service-accounts create salfagpt-service \
  --display-name="SalfaGPT Service Account" \
  --description="Service account for SalfaGPT with BigQuery, Vertex AI, and Firestore access" \
  --project=${PROJECT_ID}

# Define the service account email
export SERVICE_ACCOUNT_EMAIL="salfagpt-service@${PROJECT_ID}.iam.gserviceaccount.com"

echo "✅ Service account created: ${SERVICE_ACCOUNT_EMAIL}"
```

**💡 Tip**: The `PROJECT_ID` here is the same as `GOOGLE_CLOUD_PROJECT` in your `.env` file.

### Step 2: Grant Required Permissions

Grant the service account the necessary roles:

```bash
# BigQuery Admin - for analytics and data storage
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/bigquery.admin"

# Vertex AI User - for Gemini AI responses
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/aiplatform.user"

# Cloud Datastore User - for Firestore chat storage
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/datastore.user"

# (Optional) Logging Writer - for application logs
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/logging.logWriter"

echo "✅ All permissions granted!"
```

### Step 3: Verify Permissions

Check that the service account has the correct roles:

```bash
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --format="table(bindings.role)"
```

You should see:
```
roles/aiplatform.user
roles/bigquery.admin
roles/datastore.user
roles/logging.logWriter
```

---

## 🖥️ Local Development Setup

For local development, use your own Google Cloud credentials:

### Step 1: Authenticate Locally

```bash
# Authenticate with your Google account
gcloud auth application-default login

# Set your default project
gcloud config set project ${PROJECT_ID}
```

### Step 2: Grant Yourself Permissions

Your Google account needs the same permissions as the service account:

```bash
# Replace with your actual email
export YOUR_EMAIL="your-email@gmail.com"

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/bigquery.admin"

# Grant Vertex AI permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/aiplatform.user"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/datastore.user"

echo "✅ Your account has been granted all necessary permissions!"
```

### Step 3: Test Local Authentication

```bash
# Verify authentication
gcloud auth list

# Check your credentials work
gcloud bigquery datasets list --project=${PROJECT_ID}
```

### Step 4: Update Your .env File

Remove or comment out the `GOOGLE_APPLICATION_CREDENTIALS` line:

```bash
# .env file
GOOGLE_CLOUD_PROJECT=your-actual-project-id

# ❌ NOT NEEDED with Workload Identity:
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# Other config...
BIGQUERY_DATASET=salfagpt_dataset
VERTEX_AI_LOCATION=us-central1
```

---

## 🚀 Production Deployment

### When deploying to Cloud Run, specify the service account:

```bash
# Build your container
gcloud builds submit --tag gcr.io/${PROJECT_ID}/salfagpt

# Deploy with the service account
gcloud run deploy salfagpt \
  --image gcr.io/${PROJECT_ID}/salfagpt \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account ${SERVICE_ACCOUNT_EMAIL} \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --set-env-vars "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
  --set-env-vars "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
  --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
  --set-env-vars "NODE_ENV=production"
```

**The magic**: The `--service-account` flag tells Cloud Run to use Workload Identity. No key files needed!

---

## 🔍 How It Works

### Local Development:
```
Your Code → Application Default Credentials → Your Google Account → GCP APIs
```

### Production (Cloud Run):
```
Your Code → Workload Identity → Service Account → GCP APIs
```

Both methods are secure and don't require managing key files!

---

## ✅ Quick Start Commands

Copy and run these all at once (replace YOUR_PROJECT_ID and YOUR_EMAIL):

```bash
#!/bin/bash
set -e

# Configuration
# PROJECT_ID is the same as GOOGLE_CLOUD_PROJECT in your .env file
export PROJECT_ID="your-actual-project-id"  # Replace with your GCP project ID
export YOUR_EMAIL="your-email@gmail.com"     # Replace with your Google email
export SERVICE_ACCOUNT_EMAIL="salfagpt-service@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
echo "Creating service account..."
gcloud iam service-accounts create salfagpt-service \
  --display-name="SalfaGPT Service Account" \
  --project=${PROJECT_ID}

# Grant service account permissions
echo "Granting service account permissions..."
for role in "roles/bigquery.admin" "roles/aiplatform.user" "roles/datastore.user" "roles/logging.logWriter"; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="${role}"
done

# Grant your user permissions for local development
echo "Granting your account permissions..."
for role in "roles/bigquery.admin" "roles/aiplatform.user" "roles/datastore.user"; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="user:${YOUR_EMAIL}" \
    --role="${role}"
done

# Authenticate locally
echo "Setting up local authentication..."
gcloud auth application-default login
gcloud config set project ${PROJECT_ID}

# Verify
echo "Verifying setup..."
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --format="table(bindings.role)"

echo "✅ Setup complete! You can now run: npm run dev"
```

---

## 🐛 Troubleshooting

### Error: "Authentication failed"

**Solution**: Re-authenticate locally
```bash
gcloud auth application-default login
gcloud auth list  # Verify your account is active
```

### Error: "Permission denied on BigQuery"

**Solution**: Verify permissions
```bash
# Check service account permissions
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}"

# Check your user permissions
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:${YOUR_EMAIL}"
```

### Error: "Service account does not exist"

**Solution**: Make sure you created it
```bash
gcloud iam service-accounts list --project=${PROJECT_ID}
```

### Local development works but Cloud Run fails

**Solution**: Verify Cloud Run is using the service account
```bash
gcloud run services describe salfagpt \
  --region=us-central1 \
  --format="value(spec.template.spec.serviceAccountName)"
```

Should return: `salfagpt-service@YOUR_PROJECT_ID.iam.gserviceaccount.com`

---

## 📊 Benefits of This Approach

✅ **More Secure**: No key files that can be leaked or stolen  
✅ **Automatic Rotation**: Credentials are automatically managed by Google  
✅ **Easier Management**: No need to rotate keys every 90 days  
✅ **Audit Trail**: Better logging of who accessed what  
✅ **Organization Compliant**: Meets your org's security policies  

---

## 📚 Additional Resources

- [Workload Identity Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Cloud Run Service Identity](https://cloud.google.com/run/docs/securing/service-identity)

---

## 🎉 Next Steps

1. Run the quick start script above
2. Run `npm install` if you haven't already
3. Run `npm run dev` to start local development
4. Deploy to Cloud Run using the deployment command above

You're all set! No key files needed. 🚀

