# How to Get Service Account Keys (If You Must)

## ⚠️ WARNING: Keys Are Less Secure

Service account keys are a security risk:
- Can be leaked in code repositories
- Must be rotated every 90 days
- If stolen, attacker has full access
- Your org blocked them for good reason!

**Use Workload Identity instead (Path 1)** unless you have a specific reason for keys.

---

## If You Need Keys Anyway

### Step 1: Get Admin to Disable the Policy

You need someone with the **Organization Policy Administrator** role:
- Role: `roles/orgpolicy.policyAdmin`

They must temporarily disable this constraint:
- **Policy**: `iam.disableServiceAccountKeyCreation`

### Step 2: Admin Runs This Command

```bash
# Get your organization ID
gcloud organizations list

# Disable the key creation constraint
gcloud resource-manager org-policies delete \
  constraints/iam.disableServiceAccountKeyCreation \
  --organization=YOUR_ORG_ID
```

Or set an exception for your project:

```bash
export PROJECT_ID="gen-lang-client-0986191192"

gcloud resource-manager org-policies set-policy - <<POLICY
constraint: constraints/iam.disableServiceAccountKeyCreation
booleanPolicy:
  enforced: false
POLICY \
  --project=${PROJECT_ID}
```

### Step 3: Create the Service Account

```bash
export PROJECT_ID="gen-lang-client-0986191192"
export SERVICE_ACCOUNT_EMAIL="openflow-service@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
gcloud iam service-accounts create openflow-service \
  --display-name="OpenFlow Service Account" \
  --project=${PROJECT_ID}

# Grant permissions
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

### Step 4: Create and Download the Key

```bash
# Create the key and download JSON
gcloud iam service-accounts keys create ./gcp-service-account-key.json \
  --iam-account=${SERVICE_ACCOUNT_EMAIL} \
  --project=${PROJECT_ID}

echo "✅ Key file created: gcp-service-account-key.json"
```

### Step 5: Secure the Key File

```bash
# Set restrictive permissions
chmod 600 ./gcp-service-account-key.json

# Add to .gitignore
echo "gcp-service-account-key.json" >> .gitignore
echo "*.json" >> .gitignore

# Verify it's ignored
git status | grep gcp-service-account-key.json
# Should return nothing!
```

### Step 6: Update .env File

```bash
# .env
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# Other config...
BIGQUERY_DATASET=openflow_dataset
VERTEX_AI_LOCATION=us-central1
```

### Step 7: Test Locally

```bash
npm install
npm run dev
```

---

## Security Checklist

After getting keys, you MUST:

- [ ] Add `*.json` to `.gitignore`
- [ ] Never commit keys to git
- [ ] Set file permissions: `chmod 600 gcp-service-account-key.json`
- [ ] Rotate keys every 90 days
- [ ] Delete old keys after rotation
- [ ] Use environment variables in production (not files!)
- [ ] Enable audit logging
- [ ] Set up key expiration alerts

---

## Key Rotation (Every 90 Days)

```bash
# Create new key
gcloud iam service-accounts keys create ./gcp-service-account-key-new.json \
  --iam-account=${SERVICE_ACCOUNT_EMAIL}

# Test with new key
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key-new.json npm run dev

# If it works, delete old key
# List keys to find the old key ID
gcloud iam service-accounts keys list \
  --iam-account=${SERVICE_ACCOUNT_EMAIL}

# Delete old key (replace KEY_ID with actual ID from list)
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=${SERVICE_ACCOUNT_EMAIL}

# Replace old file
mv ./gcp-service-account-key-new.json ./gcp-service-account-key.json
```

---

## Alternative: Use Cloud Secret Manager (Better!)

Instead of a file, store the key in Secret Manager:

```bash
# Store key in Secret Manager
gcloud secrets create openflow-service-account-key \
  --data-file=./gcp-service-account-key.json \
  --project=${PROJECT_ID}

# Delete local file
rm ./gcp-service-account-key.json

# Your app fetches from Secret Manager at runtime
```

---

## Still Recommend: Use Workload Identity Instead! 🚀

Why deal with all this complexity when Workload Identity:
- ✅ Automatically handles credentials
- ✅ No key rotation needed
- ✅ No files to secure
- ✅ Better security
- ✅ Organization compliant

Just use `./setup-service-account.sh` and `./setup-local-auth.sh` instead!
