# Next Steps - Security Remediation Complete

## ✅ Completed

1. ✅ Git history cleaned (local & remote deleted)
2. ✅ All credentials rotated (you did this)
3. ✅ .gitignore updated (.env.*)
4. ✅ Naming convention updated (.env.salfacorp)
5. ✅ Port configuration updated (astro.config.mjs)
6. ✅ Update scripts created (AI Factory & Salfacorp)
7. ✅ Documentation created

## 📋 Required Next Steps

### 1. Add DEV_PORT to Your .env Files

**In your `.env` (AI Factory):**
```bash
DEV_PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
```

**In your `.env.salfacorp` (Salfacorp):**
```bash
DEV_PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
```

### 2. Create New GitHub Repository

```bash
# Option A: Using GitHub CLI
gh repo create alecaifactory/salfagpt --private --source=. --remote=origin

# Option B: Manual
# 1. Go to: https://github.com/new
# 2. Repository name: salfagpt
# 3. Make it PRIVATE ✅
# 4. Don't initialize (we have existing code)
# 5. Copy the remote URL
```

### 3. Push to New Repository

```bash
# Add remote
git remote add origin https://github.com/alecaifactory/salfagpt.git

# Push code
git push -u origin main

# Push tags
git push --tags
```

### 4. Update Cloud Run - AI Factory

```bash
# Run the update script
./scripts/update-env-aifactory.sh

# Or manually:
gcloud run services update flow-chat \
  --region=us-central1 \
  --update-env-vars="GOOGLE_AI_API_KEY=NEW_KEY" \
  --update-env-vars="GOOGLE_CLIENT_SECRET=NEW_SECRET" \
  --update-env-vars="JWT_SECRET=NEW_JWT" \
  --project=gen-lang-client-0986191192
```

### 5. Update Cloud Run - Salfacorp

```bash
# Run the update script
./scripts/update-env-salfacorp.sh

# Or manually:
gcloud run services update salfagpt \
  --region=us-central1 \
  --update-env-vars="GOOGLE_AI_API_KEY=NEW_KEY" \
  --update-env-vars="GOOGLE_CLIENT_SECRET=NEW_SECRET" \
  --update-env-vars="JWT_SECRET=NEW_JWT" \
  --project=salfagpt
```

### 6. Test Both Deployments

**AI Factory:**
```bash
# Get service URL
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format='value(status.url)'

# Test health
curl https://[service-url]/api/health/firestore

# Test in browser
open https://[service-url]/chat
```

**Salfacorp:**
```bash
# Get service URL
gcloud run services describe salfagpt \
  --region=us-central1 \
  --project=salfagpt \
  --format='value(status.url)'

# Test health
curl https://[service-url]/api/health/firestore

# Test in browser
open https://[service-url]/chat
```

## 🧪 Local Testing

### Test AI Factory (Port 3000)
```bash
# Ensure .env has DEV_PORT=3000
npm run dev
# → http://localhost:3000
# → Should see "Local: http://localhost:3000" in terminal
```

### Test Salfacorp (Port 3001)
```bash
# Switch to Salfacorp env
cp .env.salfacorp .env

# Start dev server
npm run dev
# → http://localhost:3001
# → Should see "Local: http://localhost:3001" in terminal
```

## 📊 Verification Checklist

- [ ] Added DEV_PORT to .env (AI Factory)
- [ ] Added DEV_PORT to .env.salfacorp (Salfacorp)
- [ ] Created new GitHub repository (private)
- [ ] Pushed code to new repository
- [ ] Updated Cloud Run AI Factory
- [ ] Tested AI Factory production
- [ ] Updated Cloud Run Salfacorp
- [ ] Tested Salfacorp production
- [ ] Verified .env files NOT in new repo
- [ ] Tested local development (both ports)

## 🎯 Files Created/Updated

### Created:
- ✅ `scripts/update-env-aifactory.sh` - Update AI Factory Cloud Run
- ✅ `scripts/update-env-salfacorp.sh` - Update Salfacorp Cloud Run
- ✅ `docs/SECURITY_REMEDIATION_COMPLETE_2025-10-20.md` - Incident report
- ✅ `docs/ENV_FILES_GUIDE.md` - Environment files guide
- ✅ `docs/QUICK_SETUP_ENV.md` - Quick setup reference
- ✅ `.env.example` - Template (safe to commit)

### Updated:
- ✅ `.gitignore` - Now uses `.env.*` pattern
- ✅ `astro.config.mjs` - Reads DEV_PORT from environment

## 🔒 Security Status

✅ **All Clear** - Ready to proceed with new repository and Cloud Run updates

---

**Next:** Add DEV_PORT to your .env files, then follow steps 2-6 above.
