# ✅ Environment Variables Verification - Dec 4, 2025

**Deployment:** cr-salfagpt-ai-ft-prod-00099-tjs  
**Source:** .env.salfacorp  
**Status:** ✅ **ALL REQUIRED VARIABLES DEPLOYED**

---

## 📋 **Complete Variable Checklist**

### **Variables from .env.salfacorp**

| Variable | Source | Value | Status |
|----------|--------|-------|--------|
| GOOGLE_CLOUD_PROJECT | .env.salfacorp | salfagpt | ✅ Deployed |
| GOOGLE_AI_API_KEY | .env.salfacorp | AIzaSy...Hax0 | ✅ Secret |
| GOOGLE_CLIENT_ID | .env.salfacorp | 82892...st9h | ✅ Secret |
| GOOGLE_CLIENT_SECRET | .env.salfacorp | GOCSPX-...GyF | ✅ Secret |
| JWT_SECRET | .env.salfacorp | df45d9...42f | ✅ Secret |
| PUBLIC_BASE_URL | .env.salfacorp | https://salfagpt.salfagestion.cl | ✅ Deployed |
| SESSION_COOKIE_NAME | .env.salfacorp | salfagpt_session | ✅ Deployed |
| SESSION_MAX_AGE | .env.salfacorp | 86400 | ✅ Deployed |
| CHUNK_SIZE | .env.salfacorp | 8000 | ✅ Deployed |
| CHUNK_OVERLAP | .env.salfacorp | 2000 | ✅ Deployed |
| EMBEDDING_BATCH_SIZE | .env.salfacorp | 32 | ✅ Deployed |
| EMBEDDING_MODEL | .env.salfacorp | gemini-embedding-001 | ✅ Deployed |
| TOP_K | Default (not in .env) | 8 | ✅ Deployed |
| NODE_ENV | Added | production | ✅ Deployed |
| ENVIRONMENT_NAME | Added | production | ✅ Deployed |

**Total:** 15 variables deployed ✅

---

## 🔐 **Secret Manager Configuration**

### **Secrets Mounted:**

```
google-ai-api-key:latest      → GOOGLE_AI_API_KEY
google-client-id:latest       → GOOGLE_CLIENT_ID  
google-client-secret:latest   → GOOGLE_CLIENT_SECRET
jwt-secret:latest             → JWT_SECRET
```

**All secrets accessible** ✅

---

## ✅ **Verification Commands**

### **Check Deployed Variables:**

```bash
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --format="value(spec.template.spec.containers[0].env)" | tr ';' '\n'
```

### **Verified Results:**

```
✅ GOOGLE_CLOUD_PROJECT='salfagpt'
✅ NODE_ENV='production'
✅ PUBLIC_BASE_URL='https://salfagpt.salfagestion.cl'
✅ SESSION_COOKIE_NAME='salfagpt_session'
✅ SESSION_MAX_AGE='86400'
✅ CHUNK_SIZE='8000'
✅ CHUNK_OVERLAP='2000'
✅ EMBEDDING_BATCH_SIZE='32'
✅ TOP_K='8'
✅ EMBEDDING_MODEL='gemini-embedding-001'
✅ ENVIRONMENT_NAME='production'
✅ GOOGLE_AI_API_KEY (from secret)
✅ GOOGLE_CLIENT_ID (from secret)
✅ GOOGLE_CLIENT_SECRET (from secret)
✅ JWT_SECRET (from secret)
```

---

## 🎯 **OAuth Configuration**

### **Critical Variables for Login:**

```
GOOGLE_CLIENT_ID:       ✅ Set (from secret)
GOOGLE_CLIENT_SECRET:   ✅ Set (from secret)
PUBLIC_BASE_URL:        ✅ https://salfagpt.salfagestion.cl
JWT_SECRET:             ✅ Set (from secret)
SESSION_COOKIE_NAME:    ✅ salfagpt_session
```

### **Expected OAuth Flow:**

```
1. User clicks "Continuar con Google"
   → Redirect to: https://accounts.google.com/...
   → Uses: GOOGLE_CLIENT_ID
   
2. User authenticates with Google
   → Google validates CLIENT_ID
   → Returns authorization code
   
3. Callback to: https://salfagpt.salfagestion.cl/auth/callback
   → Matches PUBLIC_BASE_URL ✅
   → Uses: GOOGLE_CLIENT_SECRET to exchange code
   
4. Create session
   → Generates JWT using JWT_SECRET
   → Sets cookie: salfagpt_session
   → MaxAge: 86400 seconds (24 hours)
   
5. Redirect to: /chat
   → User logged in ✅
```

---

## 🔍 **Potential Issues (If Still Failing)**

### **Issue 1: Google OAuth Console Mismatch**

**Check:**
- Google OAuth Console redirect URI matches: `https://salfagpt.salfagestion.cl/auth/callback`
- Client ID in Secret Manager matches Client ID in Google Console

### **Issue 2: Domain Not Enabled**

**Check:**
```typescript
// In Firestore: domains collection
{
  domain: "getaifactory.com",
  enabled: true  // Must be true
}
```

### **Issue 3: Session Cookie Domain**

**Check:**
- Cookie is set for correct domain
- Not being blocked by browser
- HTTPS working (required for secure cookies)

---

## 🚀 **Current Deployment**

**Revision:** cr-salfagpt-ai-ft-prod-00099-tjs  
**Deployed:** 2025-12-04 00:30 UTC  
**Status:** ✅ Healthy  
**Variables:** ✅ Complete (15/15)  
**Secrets:** ✅ Mounted (4/4)

---

## 📊 **Rollback Options (If Needed)**

### **Option 1: Previous Revision (00098)**
```bash
# 10 minutes ago
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=cr-salfagpt-ai-ft-prod-00098-nck=100 \
  --region us-east4 \
  --project salfagpt
```
**Issue:** También faltaba TOP_K

---

### **Option 2: Before Today's Changes (00095)** ⭐ SAFE
```bash
# Nov 25 deployment (known working)
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=cr-salfagpt-ai-ft-prod-00095-b8f=100 \
  --region us-east4 \
  --project salfagpt
```
**Benefit:** Returns to last known good state

---

### **Option 3: Even Earlier (00094, 00093, etc.)**
```bash
# If 00095 also has issues
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=cr-salfagpt-ai-ft-prod-00094-bvq=100 \
  --region us-east4 \
  --project salfagpt
```

---

## 🎯 **Recommendation**

**IF login still doesn't work with 00099:**

**ROLLBACK TO: 00095-b8f**
- Last deployment before my changes today
- Date: Nov 25, 2025
- Should have working login
- Loses: My features from today (version refresh, CSS fixes)
- Gains: Guaranteed access to platform

**Command:**
```bash
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=cr-salfagpt-ai-ft-prod-00095-b8f=100 \
  --region us-east4 \
  --project salfagpt
```

**Time:** 30 seconds  
**Risk:** Very low (proven working revision)

---

## ⏭️ **Next Step**

**PLEASE TEST LOGIN NOW:**
1. Refresh: https://salfagpt.salfagestion.cl/
2. Try login
3. Report: ✅ Works or ❌ Still fails

**IF FAILS:**
→ I'll immediately rollback to 00095-b8f
→ Platform working again in 30 seconds
→ Then we debug separately why login broke

---

**Waiting for your test result...** 🧪

