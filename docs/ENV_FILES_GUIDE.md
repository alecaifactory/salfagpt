# Environment Files Guide - AI Factory & Salfacorp

## 🎯 File Naming Convention

| Tenant | File Name | Port | Project ID | Purpose |
|--------|-----------|------|------------|---------|
| **AI Factory** | `.env` | 3000 | gen-lang-client-0986191192 | Default development |
| **Salfacorp** | `.env.salfacorp` | 3001 | salfagpt | Salfacorp tenant |
| **Template** | `.env.example` | - | - | Safe template (committed) |

## 📁 File Locations

```
/Users/alec/salfagpt/
├── .env                    # AI Factory (gitignored ✅)
├── .env.salfacorp          # Salfacorp (gitignored ✅)
└── .env.example            # Template (safe to commit)
```

## 🔄 Switching Between Tenants

### For AI Factory Development
```bash
# .env is the default
npm run dev
# → Runs on http://localhost:3000
```

### For Salfacorp Development
```bash
# Copy Salfacorp env
cp .env.salfacorp .env

# Or use env vars directly
export $(cat .env.salfacorp | xargs)
npm run dev
# → Runs on http://localhost:3001
```

## 🚀 Updating Cloud Run

### Update AI Factory Production
```bash
./scripts/update-env-aifactory.sh
```

This script:
- Reads from `.env`
- Updates Cloud Run service: `flow-chat`
- Project: `gen-lang-client-0986191192`
- Region: `us-central1`

### Update Salfacorp Production
```bash
./scripts/update-env-salfacorp.sh
```

This script:
- Reads from `.env.salfacorp`
- Updates Cloud Run service: `salfagpt`
- Project: `salfagpt`
- Region: `us-central1`

## 📋 Environment Variable Checklist

### Required in ALL .env files:
```bash
# GCP Configuration
GOOGLE_CLOUD_PROJECT=          # Project ID
GOOGLE_CLOUD_PROJECT_NUMBER=   # Project number (optional)

# Gemini AI
GOOGLE_AI_API_KEY=             # From: https://aistudio.google.com/app/apikey

# OAuth
GOOGLE_CLIENT_ID=              # From GCP Console
GOOGLE_CLIENT_SECRET=          # From GCP Console

# Security
JWT_SECRET=                    # Generate: openssl rand -base64 32

# Application
PUBLIC_BASE_URL=               # Production URL or http://localhost:PORT
NODE_ENV=                      # development | production

# Session (optional)
SESSION_COOKIE_NAME=           # Default: flow_session
SESSION_MAX_AGE=               # Default: 604800 (7 days)

# RAG/Embeddings (Salfacorp only)
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

## 🔐 Security Best Practices

### ✅ DO:
- Use separate .env files per tenant
- Rotate credentials immediately if exposed
- Keep .env files LOCAL only (never commit)
- Use .env.example for documentation
- Use scripts to update Cloud Run

### ❌ DON'T:
- Commit .env files to git
- Share .env files via Slack/email
- Hardcode credentials in code
- Use same credentials across environments
- Skip .gitignore verification

## 🛡️ .gitignore Protection

Current protection in `.gitignore`:
```gitignore
# environment variables
.env
.env.*
!.env.example
```

**This protects:**
- ✅ `.env` (AI Factory)
- ✅ `.env.salfacorp` (Salfacorp)
- ✅ `.env.local`, `.env.production`, etc.
- ✅ Any `.env.*` variant
- ✅ **Allows** `.env.example` (safe template)

## 🧪 Verification Commands

### Check .env files are NOT in git:
```bash
# Check git history
git log --all --full-history --oneline -- .env .env.salfacorp
# Should return: nothing

# Check current commit
git show HEAD:.env 2>&1
git show HEAD:.env.salfacorp 2>&1
# Should return: "does not exist in 'HEAD'"

# Check .gitignore
cat .gitignore | grep "\.env"
# Should show .env patterns
```

### Verify Cloud Run has new credentials:
```bash
# AI Factory
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)"

# Salfacorp
gcloud run services describe salfagpt \
  --region=us-central1 \
  --project=salfagpt \
  --format="value(spec.template.spec.containers[0].env)"
```

## 🔄 Credential Rotation Schedule

**Recommended rotation frequency:**
- API Keys: Every 90 days
- OAuth Secrets: Every 180 days
- JWT Secrets: Every 90 days

**Next rotation due:**
- API Keys: January 18, 2026
- OAuth Secrets: April 18, 2026
- JWT Secrets: January 18, 2026

## 📞 Emergency Response

If credentials are exposed again:

1. **Immediate:**
   - Rotate ALL credentials (all tenants)
   - Update Cloud Run immediately
   
2. **Within 1 hour:**
   - Clean git history (use scripts from this incident)
   - Verify removal (local + remote)
   
3. **Within 24 hours:**
   - Audit access logs
   - Check for unauthorized usage
   - Document incident
   
4. **Follow-up:**
   - Review security practices
   - Update team training
   - Enhance automation

## 🎯 Quick Command Reference

```bash
# Start AI Factory dev
npm run dev
# → localhost:3000

# Start Salfacorp dev  
cp .env.salfacorp .env && npm run dev
# → localhost:3001

# Update AI Factory production
./scripts/update-env-aifactory.sh

# Update Salfacorp production
./scripts/update-env-salfacorp.sh

# Verify .env not in git
git log --all -- .env .env.salfacorp

# Check .gitignore
cat .gitignore | grep env
```

---

**Created:** 2025-10-20  
**Last Updated:** 2025-10-20  
**Status:** Incident resolved, prevention measures in place

