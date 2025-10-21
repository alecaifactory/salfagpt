# Environment Setup Guide - SalfaGPT

## 🎯 Overview

SalfaGPT supports two environment profiles:

1. **SALFACORP** - Client environment (`salfagpt` GCP project)
2. **AIFACTORY** - Development environment (`gen-lang-client-0986191192` GCP project)

---

## 🚀 Quick Start

### Check Current Environment

```bash
cat .env.project
# Shows: CURRENT_PROJECT=SALFACORP or CURRENT_PROJECT=AIFACTORY
```

### Switch Environment

```bash
# Switch to Salfacorp
./scripts/switch-env.sh salfacorp

# Switch to AIFactory
./scripts/switch-env.sh aifactory
```

---

## 📋 Full Setup Procedure

### Initial Setup (First Time)

1. **Install gcloud CLI** (if not already installed)
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Login to gcloud**
   ```bash
   gcloud auth login
   ```

3. **Set up Application Default Credentials**
   ```bash
   gcloud auth application-default login
   ```

4. **Choose your environment** and switch to it:
   ```bash
   # For Salfacorp work
   ./scripts/switch-env.sh salfacorp
   
   # OR for AIFactory work
   ./scripts/switch-env.sh aifactory
   ```

5. **Start dev server**
   ```bash
   npm run dev
   ```

6. **Verify** it's working:
   ```bash
   curl http://localhost:3000/api/health/firestore
   ```

---

## 🔄 Daily Workflow

### Starting Work

```bash
# 1. Check which environment you need
cat .env.project

# 2. If wrong environment, switch:
./scripts/switch-env.sh salfacorp  # or aifactory

# 3. Start dev server
npm run dev

# 4. Open browser
open http://localhost:3000/chat
```

### Switching During Work

```bash
# 1. Stop server
pkill -f "astro dev"

# 2. Switch environment
./scripts/switch-env.sh aifactory  # or salfacorp

# 3. Restart server
npm run dev
```

---

## 🏢 Environment Details

### Salfacorp Environment

**GCP Project:** `salfagpt`  
**Purpose:** Salfacorp client data and production  
**Firestore:** `salfagpt` project database  
**Use For:**
- Working with Salfacorp client data
- Testing Salfacorp-specific features
- Client demonstrations
- Salfacorp production deployments

**Data:**
- Salfacorp agents and conversations
- Salfacorp context sources
- Salfacorp users

---

### AIFactory Environment

**GCP Project:** `gen-lang-client-0986191192`  
**Purpose:** General development and AIFactory internal use  
**Firestore:** `gen-lang-client-0986191192` project database  
**Use For:**
- General platform development
- Testing new features
- Internal AIFactory work
- Development experiments

**Data:**
- Development agents and conversations
- Test context sources
- Development users

---

## ✅ Verification Checklist

After switching environments, verify:

```bash
# 1. Check .env.project
cat .env.project
# ✅ Shows correct CURRENT_PROJECT

# 2. Check .env file
grep GOOGLE_CLOUD_PROJECT .env
# ✅ Salfacorp: salfagpt
# ✅ AIFactory: gen-lang-client-0986191192

# 3. Check gcloud project
gcloud config get-value project
# ✅ Matches .env file

# 4. Check active account
gcloud auth list
# ✅ Correct account active

# 5. Test Firestore
curl http://localhost:3000/api/health/firestore | jq .
# ✅ Should return healthy status
```

---

## 🚨 Common Issues

### Issue: "Permission Denied"

```
ERROR: User does not have permission to access project
```

**Fix:**
```bash
# Re-authenticate
gcloud auth application-default login

# Verify you have access
gcloud projects list | grep salfagpt
# or
gcloud projects list | grep gen-lang-client-0986191192
```

### Issue: "Wrong Data Showing"

**Fix:**
```bash
# Verify environment
cat .env.project
grep GOOGLE_CLOUD_PROJECT .env
gcloud config get-value project

# If mismatch, switch again
./scripts/switch-env.sh salfacorp  # or aifactory

# Clear cache
rm -rf .astro dist node_modules/.vite

# Restart
npm run dev
```

### Issue: "Firestore Not Found"

```
5 NOT_FOUND: Database not found
```

**Fix:**
```bash
# Create Firestore database in the project
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native \
  --project=$(gcloud config get-value project)
```

---

## 📊 Environment Comparison

| Feature | Salfacorp | AIFactory |
|---------|-----------|-----------|
| **GCP Project** | `salfagpt` | `gen-lang-client-0986191192` |
| **Purpose** | Client production | Development |
| **Data** | Client-specific | Development/testing |
| **Users** | Salfacorp employees | AIFactory team |
| **Deployment** | Client facing | Internal staging |
| **API Keys** | Separate | Separate |
| **OAuth** | Shared config | Shared config |

---

## 🎯 Best Practices

1. **Know Your Environment**
   - Always check `.env.project` before starting work
   - Use the correct environment for the task

2. **Use the Switcher Script**
   - Don't manually copy `.env` files
   - Use `./scripts/switch-env.sh` for safety

3. **Restart After Switching**
   - Environment variables load at startup
   - Always restart dev server after switch

4. **Verify After Switching**
   - Run the verification checklist
   - Test Firestore connection
   - Check gcloud project matches

5. **Keep Environments Separate**
   - Don't mix Salfacorp and AIFactory data
   - Each environment has its own Firestore
   - Data doesn't leak between environments

---

## 📚 Files

- `.env` - Active environment (gitignored, changes based on switch)
- `.env.project` - Current environment identifier
- `.env.salfacorp` - Salfacorp configuration template
- `.env.aifactory` - AIFactory configuration template
- `.env.example` - Example template
- `scripts/switch-env.sh` - Environment switcher script

---

## 🔗 Related Documentation

- `.cursor/rules/environment-config.mdc` - Complete environment rule
- `.cursor/rules/gcp-project-consistency.mdc` - GCP project rules
- `.cursor/rules/env.mdc` - Environment variables
- `docs/LocalToProduction.md` - Deployment guide

---

**Last Updated**: 2025-10-21  
**Status**: ✅ Ready to Use

---

## 🎓 Quick Commands Reference

```bash
# Check current environment
cat .env.project

# Switch to Salfacorp
./scripts/switch-env.sh salfacorp

# Switch to AIFactory  
./scripts/switch-env.sh aifactory

# Verify setup
grep GOOGLE_CLOUD_PROJECT .env
gcloud config get-value project

# Test Firestore
npm run dev
curl http://localhost:3000/api/health/firestore

# Troubleshoot
gcloud auth application-default login
pkill -f "astro dev" && npm run dev
```

