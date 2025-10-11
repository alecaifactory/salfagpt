# Environment Variables Reference

## 🔗 .env Variables ↔️ Command Variables

This document clarifies the relationship between variables in your `.env` file and the variables used in setup commands.

---

## Variable Mapping

| .env File Variable | Command Variable | Description | Example |
|-------------------|------------------|-------------|---------|
| `GOOGLE_CLOUD_PROJECT` | `PROJECT_ID` or `YOUR_PROJECT_ID` | Your GCP project ID | `my-project-12345` |
| (your Google email) | `YOUR_EMAIL` | Your Google account email | `you@gmail.com` |
| (auto-generated) | `SERVICE_ACCOUNT_EMAIL` | Service account email | `openflow-service@my-project-12345.iam.gserviceaccount.com` |

---

## Example Setup

### Your .env file:
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=my-openflow-project-12345

# ❌ NOT NEEDED with Workload Identity:
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# Other configuration...
BIGQUERY_DATASET=openflow_dataset
VERTEX_AI_LOCATION=us-central1

# Role-Based Access Control
SUPERADMIN_EMAILS=admin@salfacorp.com,cto@salfacorp.com
ADMIN_EMAILS=manager@salfacorp.com
EXPERT_EMAILS=expert1@salfacorp.com,expert2@salfacorp.com
ANALYTICS_EMAILS=analyst@salfacorp.com
```

### Corresponding commands:
```bash
# Set variables for commands
export PROJECT_ID="my-openflow-project-12345"        # ← Same as GOOGLE_CLOUD_PROJECT
export YOUR_EMAIL="your-email@gmail.com"              # ← Your Google account
export SERVICE_ACCOUNT_EMAIL="openflow-service@my-openflow-project-12345.iam.gserviceaccount.com"

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
export SERVICE_ACCOUNT_EMAIL="openflow-service@${PROJECT_ID}.iam.gserviceaccount.com"
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
BIGQUERY_DATASET=openflow_dataset                  # Optional - Defaults to "openflow_dataset"

# Vertex AI Configuration  
VERTEX_AI_LOCATION=us-central1                     # Optional - Defaults to "us-central1"

# Session Configuration
SESSION_COOKIE_NAME=openflow_session               # Optional - Defaults to "openflow_session"
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
gcloud run deploy openflow \
  --image gcr.io/${PROJECT_ID}/openflow \              # ← Uses PROJECT_ID
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
export PROJECT_ID="my-openflow-project-12345"  # Use your real project ID
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

---

## Role-Based Access Control (RBAC)

### Overview

The OpenFlow platform now includes role-based access control to provide different levels of access to various sections of the application.

### User Roles

| Role | Access Level | Routes Accessible |
|------|--------------|-------------------|
| `user` | Standard | `/chat`, `/home` |
| `expert` | Evaluation | All standard + `/expertos` |
| `analytics` | Analytics | All standard + `/analytics` |
| `admin` | Management | All expert + All analytics |
| `superadmin` | Full System | All routes including `/superadmin` |

### Environment Variables

Add these variables to your `.env` file to assign roles to users:

```bash
# SuperAdmin - Full system access
SUPERADMIN_EMAILS=admin@salfacorp.com,cto@salfacorp.com

# Admin - User management and all analytics
ADMIN_EMAILS=manager@salfacorp.com,director@salfacorp.com

# Expert - Quality evaluation access
EXPERT_EMAILS=expert1@salfacorp.com,expert2@salfacorp.com,qa@salfacorp.com

# Analytics - Analytics dashboard access
ANALYTICS_EMAILS=analyst@salfacorp.com,data@salfacorp.com
```

### Important Notes

1. **Email Format**: Use comma-separated email addresses with no spaces
2. **Case Insensitive**: Emails are normalized to lowercase
3. **Priority**: SuperAdmin > Admin > Expert/Analytics > User
4. **Defaults**: Any authenticated user without a role assignment defaults to `user`
5. **Multiple Roles**: If an email appears in multiple variables, the highest priority role is assigned

### Section Descriptions

#### `/superadmin` - SuperAdmin Dashboard
**Access**: SuperAdmin only

Features:
- Real-time system health monitoring
- API performance metrics (p50, p95, p99)
- Model performance analytics
- Infrastructure metrics (Cloud Run, Firestore, BigQuery)
- Cost analysis and projections

#### `/expertos` - Expert Evaluation
**Access**: Expert, Admin, SuperAdmin

Features:
- Review conversation quality
- Rate conversations on multiple dimensions
- Provide detailed feedback
- Flag conversations for review
- Track evaluation metrics

#### `/analytics` - Enhanced Analytics
**Access**: Analytics, Admin, SuperAdmin

Features:
- Conversation quality metrics
- Token usage and cost analysis
- User feedback aggregation
- Agent performance comparison
- Quality trends over time

### Setup Example

```bash
# 1. Add to your .env file
cat >> .env << EOF

# Role-Based Access Control
SUPERADMIN_EMAILS=admin@salfacorp.com
ADMIN_EMAILS=manager@salfacorp.com
EXPERT_EMAILS=expert1@salfacorp.com,expert2@salfacorp.com
ANALYTICS_EMAILS=analyst@salfacorp.com
EOF

# 2. Deploy with new environment variables
npx pame-core-cli deploy www --production

# 3. Verify role assignments
# Log in with each email and verify access to appropriate sections
```

### Testing Roles Locally

```bash
# 1. Set environment variables
export SUPERADMIN_EMAILS=your-email@gmail.com
export EXPERT_EMAILS=your-email@gmail.com
export ANALYTICS_EMAILS=your-email@gmail.com

# 2. Start dev server
npm run dev

# 3. Test each section
# - Navigate to http://localhost:3000/superadmin
# - Navigate to http://localhost:3000/expertos
# - Navigate to http://localhost:3000/analytics
```

### Security Considerations

1. **Environment Variables**: Never commit role assignments to version control
2. **Production Secrets**: Store in Google Secret Manager
3. **Regular Audits**: Review role assignments monthly
4. **Least Privilege**: Assign minimum necessary role for each user
5. **Logging**: All access attempts are logged for security auditing

### Troubleshooting

**Problem**: User can't access assigned section
```bash
# Check environment variables are set
echo $SUPERADMIN_EMAILS
echo $EXPERT_EMAILS
echo $ANALYTICS_EMAILS

# Verify user's email is in the correct list
# Check case sensitivity (emails are normalized to lowercase)
```

**Problem**: Wrong role assigned
```bash
# Roles are assigned by priority: SuperAdmin > Admin > Expert/Analytics > User
# If email appears in multiple lists, highest priority wins
# Remove from lower priority lists if needed
```

---

