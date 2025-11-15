# 🚀 QA Environment - Quick Start Guide

**Goal:** Get QA environment running in 1 hour  
**For:** Developers who want to test safely without affecting production

---

## ⚡ 5-Minute Overview

```bash
# What you'll do:
1. Run setup script (30 min - mostly automated)
2. Update secrets (5 min)
3. Create develop branch (2 min)
4. Test deployment (15 min)
5. Done! ✅

# What you'll have:
✅ Isolated QA environment (salfagpt-qa)
✅ Safe testing with production-like data
✅ Automatic deployment pipeline
✅ Production protection
✅ Version tracking
```

---

## 🏁 Step-by-Step (Copy & Paste)

### **Step 1: Run QA Setup (30 minutes)**

```bash
# Navigate to project
cd /Users/alec/salfagpt

# Run setup script
npm run qa:setup

# ☕ The script will:
# - Create salfagpt-qa GCP project
# - Copy production data (takes 10-15 min)
# - Deploy Cloud Run service
# - Pause for you to update secrets

# When it pauses, continue to Step 2
```

---

### **Step 2: Update QA Secrets (5 minutes)**

The script will pause and ask you to update secrets.

**Open another terminal and run:**

```bash
# Get values from your .env file
cat .env

# Copy GOOGLE_AI_API_KEY value and run:
echo 'YOUR_GOOGLE_AI_API_KEY_HERE' | gcloud secrets versions add google-ai-api-key --data-file=- --project=salfagpt-qa

# Copy GOOGLE_CLIENT_ID value and run:
echo 'YOUR_GOOGLE_CLIENT_ID_HERE' | gcloud secrets versions add google-client-id --data-file=- --project=salfagpt-qa

# Copy GOOGLE_CLIENT_SECRET value and run:
echo 'YOUR_GOOGLE_CLIENT_SECRET_HERE' | gcloud secrets versions add google-client-secret --data-file=- --project=salfagpt-qa

# Copy JWT_SECRET value and run:
echo 'YOUR_JWT_SECRET_HERE' | gcloud secrets versions add jwt-secret --data-file=- --project=salfagpt-qa

# Return to first terminal and press ENTER to continue
```

---

### **Step 3: Add OAuth Redirect URI (3 minutes)**

After setup completes, you'll see a QA URL like:
```
https://cr-salfagpt-qa-abc123.run.app
```

**Add to Google OAuth:**

1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt-qa
2. Find your OAuth 2.0 Client ID
3. Click edit
4. Under "Authorized redirect URIs", add:
   ```
   https://cr-salfagpt-qa-abc123.run.app/auth/callback
   ```
5. Save

---

### **Step 4: Test QA (5 minutes)**

```bash
# Get QA URL from setup output or run:
gcloud run services describe cr-salfagpt-qa \
  --region=us-east4 \
  --project=salfagpt-qa \
  --format='value(status.url)'

# Open in browser
open <QA_URL>/chat

# Test:
# ✅ Login works
# ✅ You see your agents
# ✅ You see your data
# ✅ Yellow "QA" banner at top
```

---

### **Step 5: Point Localhost to QA (2 minutes)**

```bash
# Edit .env file
# Change this line:
GOOGLE_CLOUD_PROJECT=salfagpt  # OLD

# To this:
GOOGLE_CLOUD_PROJECT=salfagpt-qa  # NEW

# Now localhost uses QA data (safe to test!)
```

---

### **Step 6: Test Complete Workflow (10 minutes)**

```bash
# 1. Test localhost
npm run dev
# Open: http://localhost:3000/chat
# Verify: Blue "LOCAL" banner, your data loads

# 2. Make a test change
echo "// QA test" >> src/test-file.ts

# 3. Deploy to QA
npm run qa:deploy
# Takes 5-10 minutes

# 4. Test QA deployment
# Open QA URL from deploy output
# Verify: Yellow "QA" banner, test change is live

# 5. Check status
npm run qa:status
# See: Localhost, QA, Production status

# 6. If happy, deploy to production
git checkout main
git merge develop
npm run prod:deploy
# Type "DEPLOY" to confirm
```

---

## ✅ Done!

You now have:
- ✅ QA environment (salfagpt-qa)
- ✅ Production protection (cannot accidentally deploy)
- ✅ Version tracking (know what's where)
- ✅ Rollback capability (quick recovery)
- ✅ Professional pipeline (industry standard)

---

## 🆘 If Something Goes Wrong

### **Setup script fails:**
```bash
# Check authentication
gcloud auth list

# Check project access
gcloud projects list

# Try again
npm run qa:setup
```

### **Secrets don't work:**
```bash
# Verify secrets
gcloud secrets list --project=salfagpt-qa

# Check latest version
gcloud secrets versions list google-ai-api-key --project=salfagpt-qa

# Should see version 2 or higher (version 1 is placeholder)
```

### **Deployment fails:**
```bash
# Check build logs
gcloud builds list --project=salfagpt-qa --limit=5

# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" \
  --project=salfagpt-qa \
  --limit=50
```

---

## 📚 Full Documentation

**For detailed explanations, see:**
- `QA_SETUP_README.md` - Complete guide (310 lines)
- `QA_ENVIRONMENT_IMPLEMENTATION_COMPLETE.md` - What was built
- `deployments/DEPLOYMENT_LOG.md` - Deployment history
- `docs/ENVIRONMENT_VERSIONS.md` - Version tracking

**For help with scripts:**
- All scripts have detailed comments
- Run scripts without arguments to see usage

---

## 💡 Pro Tips

1. **Use QA for everything** - Never test in production first
2. **Keep develop up to date** - Merge features frequently
3. **Check status often** - `npm run qa:status`
4. **Monitor costs** - QA should be <$50/month
5. **Refresh QA data weekly** - Keep it realistic

---

**Time from start to working QA:** ~1 hour  
**Confidence level:** 100% ✅  
**Production safety:** Guaranteed 🛡️

**Ready? Run:** `npm run qa:setup`

