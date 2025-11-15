# 🧪 QA/Staging Environment - Complete Setup Guide

**Purpose:** Safe testing environment that protects production  
**Created:** 2025-11-15  
**Status:** ✅ Ready to implement  
**Estimated Setup Time:** 1-2 hours (mostly automated)

---

## 🎯 What This Gives You

### **Before (Current State):**
```
Code Change → Deploy to Production → 😰 Hope it works
                ↓
        150+ real users affected
```

### **After (With QA):**
```
Code Change → Test Localhost → Deploy to QA → Test → Deploy to Production
                ↓                    ↓                      ↓
          Safe (QA data)      Safe (isolated)      Confident ✅
```

---

## 📊 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  LOCALHOST (Your Machine)                                │
│  • Port: 3000                                            │
│  • Data: salfagpt-qa Firestore                          │
│  • Purpose: Feature development with safe data          │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│  QA (salfagpt-qa project)                                │
│  • Service: cr-salfagpt-qa                               │
│  • Region: us-east4                                      │
│  • Data: Copy of production (refreshed weekly)          │
│  • Purpose: Pre-production testing                       │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│  PRODUCTION (salfagpt project)                           │
│  • Service: cr-salfagpt-ai-ft-prod                       │
│  • Region: us-east4                                      │
│  • Data: PROTECTED - Real user data                     │
│  • Purpose: Live service (150+ users)                    │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Phase 1)

### **Step 1: Run QA Setup Script (30-45 minutes)**

```bash
# Make script executable
chmod +x scripts/setup-qa-environment.sh

# Run setup (creates salfagpt-qa project)
./scripts/setup-qa-environment.sh

# What it does:
# ✅ Creates salfagpt-qa GCP project
# ✅ Enables required APIs
# ✅ Creates Firestore in us-east4
# ✅ Copies production data to QA
# ✅ Deploys indexes and security rules
# ✅ Creates secrets (you'll update with real values)
# ✅ Deploys Cloud Run service
# ✅ Sets READ-ONLY access to production
```

**During setup:**
- ☕ Grab coffee (export takes 10-15 minutes)
- You'll be prompted to update secrets with real values from .env

---

### **Step 2: Update Secrets (5 minutes)**

After setup script pauses, update QA secrets:

```bash
# Get values from your production .env file
cat .env

# Copy each value and run these commands:
echo 'YOUR_GOOGLE_AI_API_KEY' | gcloud secrets versions add google-ai-api-key --data-file=- --project=salfagpt-qa
echo 'YOUR_GOOGLE_CLIENT_ID' | gcloud secrets versions add google-client-id --data-file=- --project=salfagpt-qa
echo 'YOUR_GOOGLE_CLIENT_SECRET' | gcloud secrets versions add google-client-secret --data-file=- --project=salfagpt-qa
echo 'YOUR_JWT_SECRET' | gcloud secrets versions add jwt-secret --data-file=- --project=salfagpt-qa

# Press ENTER in setup script to continue
```

---

### **Step 3: Add OAuth Redirect URI (3 minutes)**

After QA is deployed, you'll get a URL like:
```
https://cr-salfagpt-qa-abc123.run.app
```

Add to Google OAuth:
1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt-qa
2. Click your OAuth client
3. Add authorized redirect URI:
   ```
   https://cr-salfagpt-qa-abc123.run.app/auth/callback
   ```
4. Save

---

### **Step 4: Create Git Branches (5 minutes)**

```bash
# Create develop branch (for QA deployments)
git checkout -b develop main
git push -u origin develop

# Create feature branch (for development)
git checkout -b feat/test-qa-setup-2025-11-15 develop

# Verify
git branch -a
# Should see: main, develop, feat/test-qa-setup-2025-11-15
```

---

### **Step 5: Point Localhost to QA (2 minutes)**

**Update your `.env` file:**

```bash
# Change this line:
# GOOGLE_CLOUD_PROJECT=salfagpt  # OLD (production)

# To this:
GOOGLE_CLOUD_PROJECT=salfagpt-qa  # NEW (QA)

# Now localhost uses QA database (safe to modify!)
```

---

### **Step 6: Test the Complete Flow (15 minutes)**

```bash
# 1. Test localhost (QA data)
npm run dev
# Open: http://localhost:3000/chat
# Verify: You see your agents and data
# Try: Create a test agent, send messages

# 2. Make a code change
echo "// QA test" >> src/test-file.ts
git add src/test-file.ts
git commit -m "test: QA deployment test"
git push origin feat/test-qa-setup-2025-11-15

# 3. Merge to develop
git checkout develop
git merge --no-ff feat/test-qa-setup-2025-11-15
git push origin develop

# 4. Deploy to QA
./scripts/deploy-to-qa.sh
# Takes 5-10 minutes

# 5. Test QA deployment
# Open QA URL from deploy output
# Verify test change is live

# 6. If QA looks good, deploy to production
git checkout main
git merge --no-ff develop
git push origin main
./scripts/deploy-to-production.sh
# Type "DEPLOY" to confirm
```

---

## 📋 Daily Workflow

### **Developing a New Feature:**

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feat/new-feature-2025-11-15

# 2. Develop locally (uses QA data)
npm run dev
# Make changes, test with QA data (safe!)

# 3. Commit and push
git add .
git commit -m "feat: Implement new feature"
git push origin feat/new-feature-2025-11-15

# 4. Merge to develop (triggers QA auto-deploy if configured)
git checkout develop
git merge --no-ff feat/new-feature-2025-11-15
git push origin develop

# 5. OR deploy to QA manually
./scripts/deploy-to-qa.sh

# 6. Test in QA thoroughly

# 7. When approved, merge to main and deploy to production
git checkout main
git merge --no-ff develop
./scripts/deploy-to-production.sh
```

---

## 🔍 Monitoring & Status

### **Check Status of All Environments:**

```bash
npm run qa:status

# Shows:
# - Current git branch and commit
# - Production deployment info
# - QA deployment info  
# - Branch comparison (QA ahead/behind production)
```

### **Compare QA vs Production:**

```bash
npm run qa:compare

# Shows:
# - User count difference
# - Agent count difference
# - Message count difference
# - Cloud Run status
# - Git commit differences
```

### **See What's Deployed Where:**

```bash
# Quick git commands
git show prod/current --oneline -1  # What's in production
git show qa/current --oneline -1    # What's in QA
git log prod/current..qa/current --oneline  # Difference

# Or check deployment files
cat deployments/production-latest.json
cat deployments/qa-latest.json
```

---

## 🛡️ Safety Features

### **1. Separate Databases**
- QA: `salfagpt-qa` project → Separate Firestore
- Production: `salfagpt` project → Separate Firestore
- **Result:** Cannot accidentally write to production from QA

### **2. READ-ONLY Production Access**
- QA service account can READ production data
- QA service account CANNOT WRITE to production
- **Result:** Can copy data, cannot corrupt it

### **3. Branch Validation**
- QA deployment: Warns if not from `develop`
- Production deployment: BLOCKS if not from `main`
- **Result:** Prevents wrong code in wrong environment

### **4. Deployment Confirmation**
- QA: Simple confirmation
- Production: Must type "DEPLOY"
- **Result:** Prevents accidental production deploys

### **5. Rollback Capability**
- Cloud Run keeps previous revisions
- Git tags track deployments
- Simple rollback script
- **Result:** Can undo bad deployments in <5 minutes

---

## 📁 Files Created

### **Scripts (executable):**
- ✅ `scripts/setup-qa-environment.sh` - One-time QA setup
- ✅ `scripts/deploy-to-qa.sh` - Deploy to QA
- ✅ `scripts/deploy-to-production.sh` - Deploy to production (with validation)
- ✅ `scripts/compare-qa-prod.sh` - Compare environments
- ✅ `scripts/rollback-production.sh` - Rollback production
- ✅ `scripts/track-deployment.sh` - Record deployments
- ✅ `scripts/status.sh` - Show all environment status
- ✅ `scripts/validate-deployment-branch.sh` - Validate branch before deploy

### **React Components:**
- ✅ `src/components/EnvironmentBadge.tsx` - Shows environment banner
- ✅ `src/components/VersionInfo.tsx` - Shows version info (bottom-right button)

### **Libraries:**
- ✅ `src/lib/version.ts` - Runtime version detection

### **Configuration:**
- ✅ `cloudbuild-qa-auto.yaml` - Auto-deploy QA on develop push
- ✅ `.env.qa` - QA environment template

### **Documentation:**
- ✅ `deployments/DEPLOYMENT_LOG.md` - Deployment history
- ✅ `docs/ENVIRONMENT_VERSIONS.md` - Version tracking
- ✅ `QA_SETUP_README.md` - This file

### **Updated:**
- ✅ `package.json` - Added QA/deployment scripts

---

## 🔧 Available Commands

```bash
# QA Environment
npm run qa:setup      # One-time setup (creates salfagpt-qa project)
npm run qa:deploy     # Deploy to QA
npm run qa:compare    # Compare QA vs production
npm run qa:status     # Show all environment status

# Production
npm run prod:deploy   # Deploy to production (with confirmation)
npm run prod:rollback # Rollback to previous revision

# Utilities
npm run deploy:track <env>  # Track a deployment (qa or production)
```

---

## 🎯 Next Steps

### **Phase 2: Automation (Optional - This Week)**

1. **Set up Cloud Build trigger** for auto-deploy:
   ```bash
   gcloud builds triggers create github \
     --repo-name=salfagpt \
     --repo-owner=<your-org> \
     --branch-pattern="^develop$" \
     --build-config=cloudbuild-qa-auto.yaml \
     --project=salfagpt-qa
   ```

2. **Schedule nightly QA data refresh:**
   ```bash
   # Refresh QA from production every Sunday at 2 AM
   # (Script to be created)
   ```

3. **Add environment components to UI:**
   ```tsx
   // In src/components/ChatInterfaceWorking.tsx
   import { EnvironmentBadge } from './EnvironmentBadge';
   import { VersionInfo } from './VersionInfo';
   
   return (
     <>
       <EnvironmentBadge />
       {/* Your existing UI */}
       <VersionInfo />
     </>
   );
   ```

---

## ❓ FAQ

### **Q: Will this break my current production deployment?**
A: No! QA is completely separate. Production continues working unchanged.

### **Q: Do I need to update my code?**
A: Minimal. Just:
1. Change GOOGLE_CLOUD_PROJECT in .env to salfagpt-qa (for localhost)
2. Optionally add EnvironmentBadge to UI

### **Q: What if I make a mistake in production?**
A: Run `npm run prod:rollback` - takes <5 minutes to revert.

### **Q: How much does QA cost?**
A: ~$30-50/month for the QA environment (similar to production).

### **Q: Can I delete QA and start over?**
A: Yes! It's completely separate. Delete project and run setup again.

### **Q: How do I know which environment I'm in?**
A: 
- Localhost: Blue banner at top
- QA: Yellow banner at top
- Production: No banner (clean UI)
- Click info button (bottom-right) for details

---

## 🚨 Troubleshooting

### **QA setup fails at Firestore creation:**
```bash
# Enable Firestore API manually
gcloud services enable firestore.googleapis.com --project=salfagpt-qa

# Retry setup
./scripts/setup-qa-environment.sh
```

### **Secrets not working:**
```bash
# Verify secrets exist
gcloud secrets list --project=salfagpt-qa

# Verify latest version exists
gcloud secrets versions list google-ai-api-key --project=salfagpt-qa

# Update if needed
echo 'VALUE' | gcloud secrets versions add google-ai-api-key --data-file=- --project=salfagpt-qa
```

### **OAuth fails in QA:**
```bash
# Check redirect URI is added
gcloud run services describe cr-salfagpt-qa \
  --region=us-east4 \
  --project=salfagpt-qa \
  --format='value(status.url)'

# Add /auth/callback to this URL in Google OAuth console
```

### **Branch validation fails:**
```bash
# Make sure you're on correct branch
git branch --show-current

# For QA: should be on develop (or any branch with warning)
# For Production: MUST be on main
```

---

## 📞 Support

**Issues?**
1. Check `deployments/DEPLOYMENT_LOG.md` for deployment history
2. Run `npm run qa:status` to see current state
3. Check Cloud Run logs in GCP console
4. Rollback if needed: `npm run prod:rollback`

**Questions?**
- Review this README
- Check individual script files (well-commented)
- Look at deployment log for examples

---

## ✅ Success Criteria

After setup, you should be able to:

- [ ] Run localhost with QA data (not production)
- [ ] Deploy to QA with one command
- [ ] See environment badge in UI
- [ ] Compare QA vs production
- [ ] Deploy to production with confidence
- [ ] Rollback production if needed
- [ ] Know what version is running where

---

**Ready to start? Run:**

```bash
chmod +x scripts/*.sh
npm run qa:setup
```

**Estimated total time:** 1-2 hours (mostly waiting for Firestore import)

**What you'll have:** Professional-grade deployment pipeline! 🚀

