# ✅ QA Environment Deployment Checklist

**Use this checklist to deploy QA environment step-by-step**

---

## 📋 Pre-Setup Verification

- [ ] **Authenticated with gcloud**
  ```bash
  gcloud auth list
  # Should show: alec@salfacloud.cl (active)
  ```

- [ ] **In correct directory**
  ```bash
  pwd
  # Should show: /Users/alec/salfagpt
  ```

- [ ] **Have production .env file**
  ```bash
  ls -la .env
  # Should exist and have all secrets
  ```

- [ ] **Scripts are executable**
  ```bash
  ls -la scripts/setup-qa-environment.sh
  # Should show: -rwxr-xr-x
  ```

---

## 🚀 Phase 1: QA Environment Setup

### **Step 1: Run Setup Script**

- [ ] **Execute setup**
  ```bash
  npm run qa:setup
  ```

- [ ] **Wait for export** (10-15 minutes)
  - Script will show progress
  - ☕ Good time for coffee

- [ ] **Script pauses for secret update**
  - Don't close terminal
  - Move to Step 2

---

### **Step 2: Update QA Secrets**

Open **new terminal** and run these commands:

- [ ] **Get values from .env**
  ```bash
  cd /Users/alec/salfagpt
  cat .env
  # Copy each value for next commands
  ```

- [ ] **Update GOOGLE_AI_API_KEY**
  ```bash
  echo 'PASTE_VALUE_HERE' | gcloud secrets versions add google-ai-api-key --data-file=- --project=salfagpt-qa
  ```

- [ ] **Update GOOGLE_CLIENT_ID**
  ```bash
  echo 'PASTE_VALUE_HERE' | gcloud secrets versions add google-client-id --data-file=- --project=salfagpt-qa
  ```

- [ ] **Update GOOGLE_CLIENT_SECRET**
  ```bash
  echo 'PASTE_VALUE_HERE' | gcloud secrets versions add google-client-secret --data-file=- --project=salfagpt-qa
  ```

- [ ] **Update JWT_SECRET**
  ```bash
  echo 'PASTE_VALUE_HERE' | gcloud secrets versions add jwt-secret --data-file=- --project=salfagpt-qa
  ```

- [ ] **Return to first terminal and press ENTER**

---

### **Step 3: Get QA URL**

- [ ] **Script completes and shows QA URL**
  ```
  QA URL: https://cr-salfagpt-qa-XXXXX.run.app
  ```
  - Copy this URL (you'll need it next)

---

### **Step 4: Add OAuth Redirect URI**

- [ ] **Open Google Console**
  ```
  https://console.cloud.google.com/apis/credentials?project=salfagpt-qa
  ```

- [ ] **Find OAuth 2.0 Client ID**
  - Click on the client ID name

- [ ] **Add Authorized redirect URI**
  - Click "Add URI"
  - Paste: `https://cr-salfagpt-qa-XXXXX.run.app/auth/callback`
  - Click "Save"

---

### **Step 5: Wait for Firestore Import**

- [ ] **Check import status**
  ```bash
  gcloud firestore operations list --project=salfagpt-qa
  ```
  - Wait until no operations listed (10-20 min total)

---

### **Step 6: Test QA Environment**

- [ ] **Open QA URL in browser**
  ```bash
  # Use URL from Step 3
  open https://cr-salfagpt-qa-XXXXX.run.app/chat
  ```

- [ ] **Login with Google**
  - Use your salfacloud.cl account

- [ ] **Verify data loaded**
  - See your agents? ✅
  - See your context sources? ✅
  - Yellow "QA" banner at top? ✅

- [ ] **Send test message**
  - Create or select agent
  - Send "Hola"
  - Get AI response? ✅

---

## 🔧 Phase 2: Git Setup

### **Step 7: Create Develop Branch**

- [ ] **Create and push develop**
  ```bash
  cd /Users/alec/salfagpt
  git checkout -b develop main
  git push -u origin develop
  ```

- [ ] **Verify branches**
  ```bash
  git branch -a
  # Should see: main, develop
  ```

---

### **Step 8: Point Localhost to QA**

- [ ] **Edit .env file**
  ```bash
  # Change this line:
  GOOGLE_CLOUD_PROJECT=salfagpt  # OLD
  
  # To this:
  GOOGLE_CLOUD_PROJECT=salfagpt-qa  # NEW
  ```

- [ ] **Restart dev server**
  ```bash
  pkill -f "astro dev"
  npm run dev
  ```

- [ ] **Verify localhost uses QA**
  - Blue "LOCAL" banner at top? ✅
  - Same agents as QA? ✅

---

## 🧪 Phase 3: Test Complete Flow

### **Step 9: Test QA Deployment**

- [ ] **Create test feature**
  ```bash
  git checkout -b feat/qa-test-2025-11-15 develop
  echo "// QA test" >> src/test-qa.ts
  git add src/test-qa.ts
  git commit -m "test: QA deployment test"
  ```

- [ ] **Deploy to QA**
  ```bash
  git checkout develop
  git merge --no-ff feat/qa-test-2025-11-15
  npm run qa:deploy
  ```

- [ ] **Verify in QA**
  - Open QA URL
  - Check test file deployed

---

### **Step 10: Test Production Deploy (Optional)**

⚠️ **Only do this if you want to test production deploy now**

- [ ] **Merge to main**
  ```bash
  git checkout main
  git merge --no-ff develop
  git tag -a v0.3.1 -m "QA pipeline setup"
  git push origin main --tags
  ```

- [ ] **Deploy to production**
  ```bash
  npm run prod:deploy
  # Type "DEPLOY" when prompted
  ```

- [ ] **Verify production**
  - Open: https://salfagpt-3snj65wckq-uc.a.run.app
  - Test works? ✅

---

## 🎯 Final Verification

### **Check Everything Works:**

- [ ] **Run status check**
  ```bash
  npm run qa:status
  ```
  - Shows production? ✅
  - Shows QA? ✅
  - Shows git branches? ✅

- [ ] **Compare environments**
  ```bash
  npm run qa:compare
  ```
  - Shows data counts? ✅
  - Shows differences? ✅

- [ ] **View deployment log**
  ```bash
  cat deployments/DEPLOYMENT_LOG.md
  ```
  - Has QA deployment? ✅
  - Has production deployment (if you tested)? ✅

---

## ✅ Success Criteria

When complete, you should have:

- [x] QA environment created (salfagpt-qa)
- [x] QA Cloud Run service deployed
- [x] Production READ-ONLY access configured
- [x] Develop branch created
- [x] Localhost points to QA (not production)
- [x] All scripts working
- [x] Deployment tracking active
- [x] Version visibility in UI

---

## 🎉 You're Done When...

- ✅ You can run `npm run dev` (uses QA data, not production)
- ✅ You can run `npm run qa:deploy` (deploys to QA)
- ✅ You can run `npm run prod:deploy` (deploys to production safely)
- ✅ You see environment badge in UI
- ✅ You can rollback production with one command
- ✅ You know what version is running where

---

## 📞 Help

**Stuck?** Check these:
- `QUICK_START_QA.md` - Fast guide
- `QA_SETUP_README.md` - Detailed guide
- `QA_IMPLEMENTATION_SUMMARY.md` - What was created
- Script files - All have detailed comments

**Questions?**
- Run `npm run qa:status` to see current state
- Check Cloud Run logs in GCP console
- Review deployment log: `deployments/DEPLOYMENT_LOG.md`

---

**Ready to start?**

```bash
npm run qa:setup
```

**Estimated time:** 1 hour (mostly automated)  
**What you get:** Professional deployment pipeline! 🚀

