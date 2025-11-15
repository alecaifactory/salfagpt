# Environment Versions - SalfaGPT

**Purpose:** Track what code version is running in each environment  
**Updated:** Automatically by deployment scripts  
**Last Updated:** 2025-11-15

---

## 📊 Current State

| Environment | Branch | Commit | Version | Project | Service | URL | Status |
|-------------|--------|--------|---------|---------|---------|-----|--------|
| **Production** | main | - | v0.3.0 | salfagpt | cr-salfagpt-ai-ft-prod | [Link](https://salfagpt-3snj65wckq-uc.a.run.app) | 🟢 Active |
| **QA** | develop | - | - | salfagpt-qa | cr-salfagpt-qa | Not deployed | ⏳ Setup |
| **Localhost** | - | local | dev | salfagpt-qa | N/A | http://localhost:3000 | 🟢 Dev |

---

## 🌳 Branch Status

### main → Production
- **Purpose:** Stable, production-ready code
- **Protection:** Protected branch, no direct commits
- **Deploy:** Manual only (requires confirmation)
- **Testing:** Must pass QA first
- **Auto-Deploy:** ❌ No

### develop → QA
- **Purpose:** Integration branch for features
- **Protection:** Protected branch
- **Deploy:** Automatic on push
- **Testing:** Continuous in QA environment
- **Auto-Deploy:** ✅ Yes (Cloud Build)

### feature/* → Localhost
- **Purpose:** Feature development
- **Protection:** None (developer branches)
- **Deploy:** Local testing only
- **Testing:** Developer validation
- **Auto-Deploy:** N/A

---

## 🔄 Sync Status

**Develop vs Main:**
- Commits ahead: - (check with: `git log origin/main..origin/develop --oneline`)
- Commits behind: 0 (should always be up to date)
- Status: ⏳ Pending (develop branch to be created)

**Last Production Deploy:** Not tracked yet  
**Last QA Deploy:** Not deployed yet  
**Last QA Data Refresh:** Not scheduled yet

---

## 📋 Active Feature Branches

(Will be populated as features are developed)

---

## 🎯 Quick Commands

**Check current status:**
```bash
./scripts/status.sh
```

**Compare QA vs Production:**
```bash
./scripts/compare-qa-prod.sh
```

**See what's deployed where:**
```bash
# Production
git show prod/current --oneline -1
cat deployments/production-latest.json

# QA
git show qa/current --oneline -1
cat deployments/qa-latest.json
```

**See difference between QA and production:**
```bash
git log prod/current..qa/current --oneline
```

---

## 🔐 Branch Protection Rules

### main (Production)
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators (no bypass)
- ❌ Allow force pushes (never!)
- ❌ Allow deletions (never!)

### develop (QA)
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ⚠️ Allow administrators to bypass (for urgent fixes)
- ❌ Allow force pushes (never!)
- ❌ Allow deletions (never!)

---

## 📊 Deployment Frequency

**Target Metrics:**
- QA deploys: Multiple per day (automatic)
- Production deploys: 1-2 per week (manual)
- Hotfixes: As needed (< 1 hour from issue to fix)

**Actual Metrics:**
(Will be tracked as deployments occur)

---

## 🚨 Emergency Procedures

**Production is down:**
1. Check Cloud Run status
2. Check recent deployments in this file
3. Rollback to previous revision: `./scripts/rollback-production.sh`
4. If still broken, deploy known-good commit:
   ```bash
   git checkout <good-commit>
   ./scripts/deploy-to-production.sh
   ```

**QA is broken:**
1. Check if production is affected (should not be)
2. Redeploy QA from known-good commit
3. If still broken, refresh QA from production:
   ```bash
   ./scripts/smart-qa-refresh.sh
   ```

---

*This file is automatically updated by deployment scripts. Manual edits may be overwritten.*

