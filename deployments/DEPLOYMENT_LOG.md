# Deployment Log - SalfaGPT

**Purpose:** Track all deployments to QA and Production environments  
**Auto-updated:** By deployment scripts  
**Last Updated:** 2025-11-15

---

## 🔴 Production Deployments (salfagpt)

**Current:**
- **Version:** v0.3.0
- **Service:** cr-salfagpt-ai-ft-prod
- **URL:** https://salfagpt-3snj65wckq-uc.a.run.app
- **Branch:** main
- **Status:** ✅ Active

**History:**
(Deployment entries will be added here automatically)

---

## 🟡 QA Deployments (salfagpt-qa)

**Current:**
- **Version:** Not yet deployed
- **Service:** cr-salfagpt-qa
- **URL:** Not yet deployed
- **Branch:** develop
- **Status:** ⏳ Pending setup

**History:**
(Deployment entries will be added here automatically)

---

## 📝 How This Log Works

This file is automatically updated by:
- `scripts/track-deployment.sh` - Appends deployment entries
- `scripts/deploy-to-qa.sh` - Records QA deployments
- `scripts/deploy-to-production.sh` - Records production deployments

Each entry includes:
- Timestamp
- Version number
- Git branch and commit
- Deployer email
- Service URL
- Project and service name

---

## 🔍 Quick Lookups

**What's running in production?**
```bash
# Check latest production deployment
tail -20 deployments/DEPLOYMENT_LOG.md | grep -A5 "Production"

# Or check git tag
git show prod/current --oneline -1

# Or check file
cat deployments/production-latest.json
```

**What's running in QA?**
```bash
# Check latest QA deployment
tail -20 deployments/DEPLOYMENT_LOG.md | grep -A5 "QA"

# Or check git tag
git show qa/current --oneline -1

# Or check file
cat deployments/qa-latest.json
```

**What's different between QA and production?**
```bash
# Run comparison script
./scripts/compare-qa-prod.sh

# Or compare git commits
git log prod/current..qa/current --oneline
```

