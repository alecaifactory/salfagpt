# 🚀 Deployment to Production - In Progress

**Time:** 2025-11-17 10:21 UTC  
**Service:** cr-salfagpt-ai-ft-prod  
**Region:** us-east4  
**Project:** salfagpt

---

## 📊 **DEPLOYMENT STATUS**

**Current Revision:** 00063 (building)  
**Previous Successful:** 00061  
**Method:** Cloud Run with source build

---

## ⚙️ **ENVIRONMENT VARIABLES**

All env vars set directly (no secrets):
- ✅ GOOGLE_CLOUD_PROJECT=salfagpt
- ✅ NODE_ENV=production
- ✅ GOOGLE_AI_API_KEY (from .env)
- ✅ GOOGLE_CLIENT_ID (from .env)
- ✅ GOOGLE_CLIENT_SECRET (from .env)
- ✅ JWT_SECRET (from .env)
- ✅ PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl
- ✅ SESSION_COOKIE_NAME=salfagpt_session
- ✅ SESSION_MAX_AGE=86400
- ✅ CHUNK_SIZE=8000
- ✅ CHUNK_OVERLAP=2000
- ✅ EMBEDDING_BATCH_SIZE=32
- ✅ TOP_K=5
- ✅ EMBEDDING_MODEL=gemini-embedding-001

---

## 📦 **WHAT'S BEING DEPLOYED**

**Branch:** refactor/chat-v2-2025-11-15  
**Commits:** 15 total  
**Changes:**
- ✅ ABC tasks complete
- ✅ Ally thinking steps (perfect)
- ✅ Ally prompts (SuperPrompt, Org, Domain)
- ✅ Ally empty state (sample questions)
- ✅ Ally config modal
- ✅ Build fixes (duplicate exports)

**Total Lines:** +4,619, -51

---

## ⏱️ **ESTIMATED TIME**

**Build:** ~5-8 minutes  
**Deploy:** ~2-3 minutes  
**Total:** ~10 minutes

---

**Monitoring deployment...**

