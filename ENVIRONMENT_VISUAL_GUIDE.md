# 🎨 Environment Configuration - Visual Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SalfaGPT Project                              │
│                  /Users/alec/salfagpt                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  .env.project ──────► Tracks current environment                │
│                      │                                          │
│                      ▼                                          │
│              CURRENT_PROJECT=SALFACORP                          │
│                      │                                          │
│                      ▼                                          │
│  .env ◄───────── Active configuration                           │
│    │                                                            │
│    └──► Loaded by: npm run dev                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Environment Templates:                                         │
│                                                                 │
│  .env.salfacorp ──────► Salfacorp config                        │
│    └─ GOOGLE_CLOUD_PROJECT=salfagpt                            │
│    └─ Salfacorp API keys                                       │
│    └─ Client production                                        │
│                                                                 │
│  .env.aifactory ──────► AIFactory config                        │
│    └─ GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192         │
│    └─ AIFactory API keys                                       │
│    └─ Development/internal                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Switching Flow

### Switch to Salfacorp

```
User runs: ./scripts/switch-env.sh salfacorp
    │
    ├─► 1. Kill dev server (if running)
    │
    ├─► 2. Copy .env.salfacorp → .env
    │      └─ GOOGLE_CLOUD_PROJECT=salfagpt
    │
    ├─► 3. Update .env.project
    │      └─ CURRENT_PROJECT=SALFACORP
    │
    ├─► 4. Set gcloud project
    │      └─ gcloud config set project salfagpt
    │
    └─► 5. Show verification
           ✅ Environment: SALFACORP
           ✅ GCP Project: salfagpt
           ✅ Ready to use

User restarts: npm run dev
    │
    └─► Server loads .env with Salfacorp config
           └─► Connected to salfagpt Firestore ✅
```

### Switch to AIFactory

```
User runs: ./scripts/switch-env.sh aifactory
    │
    ├─► 1. Kill dev server (if running)
    │
    ├─► 2. Copy .env.aifactory → .env
    │      └─ GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
    │
    ├─► 3. Update .env.project
    │      └─ CURRENT_PROJECT=AIFACTORY
    │
    ├─► 4. Set gcloud project
    │      └─ gcloud config set project gen-lang-client-0986191192
    │
    └─► 5. Show verification
           ✅ Environment: AIFACTORY
           ✅ GCP Project: gen-lang-client-0986191192
           ✅ Ready to use

User restarts: npm run dev
    │
    └─► Server loads .env with AIFactory config
           └─► Connected to gen-lang-client-0986191192 Firestore ✅
```

---

## 🗂️ File Relationships

```
.env.project ────────┐
                     │
                     ▼
               Controls which
              environment is active
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
   SALFACORP                AIFACTORY
         │                       │
         ▼                       ▼
 .env.salfacorp           .env.aifactory
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
                   .env
                     │
                     ▼
              Used by npm run dev
                     │
                     ▼
            Connects to correct GCP project
```

---

## 🎯 Current Status

```
┌─────────────────────────────────────────────┐
│         CURRENT CONFIGURATION               │
├─────────────────────────────────────────────┤
│                                             │
│  Environment:  SALFACORP ✅                 │
│  GCP Project:  salfagpt ✅                  │
│  Account:      alec@salfacloud.cl ✅        │
│  Firestore:    salfagpt database ✅         │
│                                             │
│  Ready for:                                 │
│  - Salfacorp client work                    │
│  - Client demonstrations                    │
│  - Salfacorp production testing             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📋 Quick Reference

### Check Environment

```bash
cat .env.project
# CURRENT_PROJECT=SALFACORP  (you're in Salfacorp)
# CURRENT_PROJECT=AIFACTORY  (you're in AIFactory)
```

### Switch Environment

```bash
./scripts/switch-env.sh salfacorp   # Switch to Salfacorp
./scripts/switch-env.sh aifactory   # Switch to AIFactory
```

### Verify Configuration

```bash
# All in one command
cat .env.project && \
grep GOOGLE_CLOUD_PROJECT .env && \
gcloud config get-value project
```

---

## 🏢 When to Use Each Environment

### Use SALFACORP When:

✅ Working with Salfacorp client data  
✅ Testing Salfacorp-specific features  
✅ Preparing for Salfacorp deployment  
✅ Client demonstrations  
✅ Salfacorp user support

### Use AIFACTORY When:

✅ General platform development  
✅ Testing new features  
✅ Internal AIFactory work  
✅ Experimenting with new capabilities  
✅ Development that doesn't affect clients

---

## 🔐 Security Notes

### Data Isolation

Environments are **completely isolated**:
- Separate Firestore databases
- Separate GCP projects
- No data leakage possible
- Different API keys

### Authentication

Each environment requires:
- Google Cloud authentication
- Correct account permissions
- Application Default Credentials
- Project access granted

---

## 🎓 Example Workflows

### Scenario 1: Salfacorp Client Work

```bash
# Morning: Start Salfacorp work
./scripts/switch-env.sh salfacorp
npm run dev
# Work with Salfacorp data...

# Afternoon: Need to test new feature
./scripts/switch-env.sh aifactory
npm run dev
# Develop and test...

# End of day: Back to Salfacorp
./scripts/switch-env.sh salfacorp
npm run dev
```

### Scenario 2: Feature Development → Client Testing

```bash
# Day 1-3: Develop in AIFactory
./scripts/switch-env.sh aifactory
npm run dev
# Build feature...

# Day 4: Test with Salfacorp
./scripts/switch-env.sh salfacorp
npm run dev
# Verify works with client data...

# Ready to deploy to Salfacorp production!
```

---

## ✅ Success Criteria

Environment system is working if:

- [x] Can switch between environments with one command
- [x] `.env.project` always matches active `.env`
- [x] gcloud project matches environment
- [x] Firestore connects to correct database
- [x] No data leakage between environments
- [x] Dev server uses correct configuration
- [x] Authentication works for both environments

**Status:** ✅ ALL CRITERIA MET

---

## 📚 Documentation

- **Rule:** `.cursor/rules/environment-config.mdc` - Complete spec
- **Guide:** `docs/ENVIRONMENT_SETUP.md` - User guide
- **Script:** `scripts/switch-env.sh` - Switcher tool
- **Summary:** `ENVIRONMENT_SWITCH_COMPLETE.md` - This file

---

## 🎉 Ready to Use!

Your environment configuration system is complete and ready. You can now:

1. **Know which environment you're in** - Check `.env.project`
2. **Switch easily** - Use `./scripts/switch-env.sh`
3. **Work confidently** - Data is isolated
4. **No confusion** - Clear indicators

---

**Environment System:** ✅ Production Ready  
**Current Setup:** SALFACORP (salfagpt)  
**Authentication:** ✅ Complete  
**Ready for Development:** Yes 🚀
