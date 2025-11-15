# 🎯 START HERE - QA Environment Setup

**⏱️ Time Required:** 1 hour  
**💰 Cost:** $1 AI + $40/month infrastructure  
**🎁 Value:** Production-safe deployment pipeline

---

## ✅ What's Ready

All files created and ready to use:

### **Scripts (8):** ✅
- setup-qa-environment.sh
- deploy-to-qa.sh
- deploy-to-production.sh
- compare-qa-prod.sh
- rollback-production.sh
- track-deployment.sh
- status.sh
- validate-deployment-branch.sh

### **Components (3):** ✅
- EnvironmentBadge.tsx
- VersionInfo.tsx
- version.ts

### **Config (2):** ✅
- cloudbuild-qa-auto.yaml
- .env.qa (template)

### **Docs (6):** ✅
- QA_SETUP_README.md (complete guide)
- QUICK_START_QA.md (fast guide)
- QA_IMPLEMENTATION_SUMMARY.md (what was built)
- DEPLOYMENT_CHECKLIST.md (step-by-step)
- deployments/DEPLOYMENT_LOG.md (tracking)
- docs/ENVIRONMENT_VERSIONS.md (versions)

### **Git:** ✅
- develop branch created
- package.json updated with scripts

---

## 🚀 Run This Now (1 hour)

### **One Command to Start:**

```bash
npm run qa:setup
```

**Then follow the prompts!**

The script will:
1. ✅ Create salfagpt-qa project
2. ✅ Set up Firestore
3. ✅ Copy production data
4. ⏸️ Pause for you to update secrets
5. ✅ Deploy Cloud Run
6. ✅ Configure everything

---

## 📖 Documentation Guide

**Choose based on your need:**

| Need | Read This | Time |
|------|-----------|------|
| **Fast start** | `QUICK_START_QA.md` | 5 min |
| **Complete guide** | `QA_SETUP_README.md` | 15 min |
| **Step checklist** | `DEPLOYMENT_CHECKLIST.md` | 10 min |
| **What was built** | `QA_IMPLEMENTATION_SUMMARY.md` | 10 min |
| **Cost breakdown** | `QA_IMPLEMENTATION_SUMMARY.md` | 5 min |

---

## 🎯 What You'll Get

```
BEFORE:
Code → Deploy to Production → 😰 Hope it works

AFTER:
Code → Test Localhost → Deploy QA → Test → Deploy Production ✅
        (QA data)        (isolated)         (confident)
```

### **Safety:**
- ✅ QA cannot touch production (separate projects)
- ✅ Production requires confirmation ("DEPLOY")
- ✅ Branch validation (main required for prod)
- ✅ Rollback in <5 minutes

### **Visibility:**
- ✅ Environment badge in UI
- ✅ Version info button
- ✅ Status command
- ✅ Deployment log

### **Workflow:**
- ✅ Feature → Develop → QA → Main → Production
- ✅ Automatic QA deploys (optional)
- ✅ Manual production (required)
- ✅ Complete audit trail

---

## 💡 Quick Commands Reference

```bash
# Setup (one-time)
npm run qa:setup              # Create QA environment

# Daily use
npm run dev                   # Localhost (QA data)
npm run qa:deploy             # Deploy to QA
npm run prod:deploy           # Deploy to production

# Monitoring
npm run qa:status             # Show all environments
npm run qa:compare            # Compare QA vs prod

# Emergency
npm run prod:rollback         # Rollback production
```

---

## 🆘 If You Get Stuck

### **Setup fails?**
- Check authentication: `gcloud auth list`
- Check you're in right directory: `pwd`
- Read error message carefully
- Check `QA_SETUP_README.md` troubleshooting section

### **Secrets don't work?**
- Verify they exist: `gcloud secrets list --project=salfagpt-qa`
- Check versions: `gcloud secrets versions list google-ai-api-key --project=salfagpt-qa`
- Should see version 2+ (version 1 is placeholder)

### **OAuth fails?**
- Verify redirect URI added in Google Console
- Check URL matches exactly (including /auth/callback)
- Wait 5 minutes after adding (propagation time)

---

## ⏱️ Timeline

**If you start now:**
- **12:15 PM:** Run `npm run qa:setup`
- **12:20 PM:** Update secrets while export runs
- **12:30 PM:** Export completes, import starts
- **12:45 PM:** Add OAuth redirect URI
- **12:50 PM:** Import completes
- **1:00 PM:** Test QA environment
- **1:15 PM:** ✅ **Done!**

**Total:** 1 hour

---

## 🎉 Success Looks Like

- ✅ Yellow "QA" banner when you open QA URL
- ✅ Blue "LOCAL" banner when you run `npm run dev`
- ✅ Can deploy to QA without touching production
- ✅ Can see what's different: `npm run qa:compare`
- ✅ Can deploy to production confidently

---

## 🚀 Ready?

```bash
npm run qa:setup
```

**Then follow:** `DEPLOYMENT_CHECKLIST.md` for step-by-step

**Good luck! You've got this!** 💪

