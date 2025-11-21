# Production Deployment Checklist - SalfaGPT

**Project:** salfagpt  
**Service:** cr-salfagpt-ai-ft-prod  
**Region:** us-east4  
**Created:** November 17, 2025  
**Status:** ✅ PRODUCTION READY

---

## 🎯 Pre-Deployment Checklist

### 1. Code Quality ✅

```bash
# Type check (must be 0 errors)
npm run type-check

# Lint (fix any issues)
npm run lint

# Check git status
git status
# Should be clean or only intended changes
```

### 2. Local Build Verification ✅

```bash
# Clean build
rm -rf dist .astro node_modules/.vite

# Build locally
npm run build

# Expected output:
# ✅ Fixed file paths in entry.mjs
# 📋 CSS files found: [ '_tailwind-compiled.css' ]
# 📄 Main CSS: _tailwind-compiled.css
# 🔍 CSS references found: []
# ✅ CSS references fixed

# Verify CSS files
ls -1 dist/client/*.css
# Expected: Only _tailwind-compiled.css

# Verify no phantom CSS in manifest
grep -c "\.css" dist/server/manifest_*.mjs
# Expected: Low number (just the actual CSS file)
```

### 3. Environment Variables Verification ✅

**Required Variables:**
```bash
GOOGLE_CLOUD_PROJECT=salfagpt
NODE_ENV=production
GOOGLE_AI_API_KEY=AIzaSy... (from .env)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com (from .env)
GOOGLE_CLIENT_SECRET=GOCSPX-... (from .env)
JWT_SECRET=... (from .env)
PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl
SESSION_COOKIE_NAME=flow_session
SESSION_MAX_AGE=604800
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

**Verification Command:**
```bash
# Check local .env has all required vars
cat .env | grep -E "^(GOOGLE_AI_API_KEY|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET|PUBLIC_BASE_URL)=" | wc -l
# Expected: 5

# Verify Cloud Run has all vars
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project salfagpt \
  --region us-east4 \
  --format="value(spec.template.spec.containers[0].env)" | \
  grep -E "JWT_SECRET|GOOGLE_AI_API_KEY" | wc -l
# Expected: 2+
```

### 4. Git Commit ✅

```bash
# Stage changes
git add -A

# Commit with descriptive message
git commit -m "fix: Comprehensive fix for CSS 404s and JWT auth

- Disabled CSS code splitting
- Added manual CSS links to pages
- Set all environment variables in Cloud Run
- Created post-build verification script

Impact: Zero console errors, auth working
Testing: Verified in production revision 00076-q54
Backward Compatible: Yes"

# Push to remote
git push origin refactor/chat-v2-2025-11-15
```

---

## 🚀 Deployment Process

### Method 1: Quick Deployment (Code Changes Only)

**When to use:** Code/config changes, no env var changes needed

```bash
cd /Users/alec/salfagpt

# Deploy
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --project salfagpt \
  --region us-east4 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 50 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300

# Wait for completion (~10-15 minutes)
# Expected output:
# Service [cr-salfagpt-ai-ft-prod] revision [cr-salfagpt-ai-ft-prod-000XX-xxx] 
# has been deployed and is serving 100 percent of traffic.
```

### Method 2: Full Deployment (With Environment Variables)

**When to use:** First deployment, env var changes, or major updates

```bash
cd /Users/alec/salfagpt

# Load env vars from .env
export GOOGLE_AI_API_KEY=$(grep '^GOOGLE_AI_API_KEY=' .env | cut -d'=' -f2)
export GOOGLE_CLIENT_ID=$(grep '^GOOGLE_CLIENT_ID=' .env | cut -d'=' -f2)
export GOOGLE_CLIENT_SECRET=$(grep '^GOOGLE_CLIENT_SECRET=' .env | cut -d'=' -f2)
export JWT_SECRET=$(grep '^JWT_SECRET=' .env | cut -d'=' -f2)
export PUBLIC_BASE_URL=$(grep '^PUBLIC_BASE_URL=' .env | cut -d'=' -f2)

# Deploy with env vars
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --project salfagpt \
  --region us-east4 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 50 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --update-env-vars="\
GOOGLE_CLOUD_PROJECT=salfagpt,\
NODE_ENV=production,\
GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY},\
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID},\
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET},\
JWT_SECRET=${JWT_SECRET},\
PUBLIC_BASE_URL=${PUBLIC_BASE_URL},\
SESSION_COOKIE_NAME=flow_session,\
SESSION_MAX_AGE=604800,\
CHUNK_SIZE=8000,\
CHUNK_OVERLAP=2000,\
EMBEDDING_BATCH_SIZE=32,\
TOP_K=5,\
EMBEDDING_MODEL=gemini-embedding-001"
```

### Method 3: Update Env Vars Only (No Rebuild)

**When to use:** Only env vars changed, code is fine

```bash
# Load env vars
export JWT_SECRET=$(grep '^JWT_SECRET=' .env | cut -d'=' -f2)

# Update service (fast - no rebuild)
gcloud run services update cr-salfagpt-ai-ft-prod \
  --project salfagpt \
  --region us-east4 \
  --update-env-vars="JWT_SECRET=${JWT_SECRET}"

# Takes ~30 seconds instead of 15 minutes
```

---

## ✅ Post-Deployment Verification

### Immediate Checks (Within 2 minutes)

**1. Service Health**
```bash
curl https://salfagpt.salfagestion.cl/api/health/firestore
```
**Expected:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": {"status": "pass"},
    "authentication": {"status": "pass"},
    "firestoreRead": {"status": "pass"},
    "firestoreWrite": {"status": "pass"}
  }
}
```

**2. CSS Loading**
```bash
curl -I https://salfagpt.salfagestion.cl/_tailwind-compiled.css
```
**Expected:** `HTTP/2 200`

**3. No 404 Errors**
```bash
curl -s https://salfagpt.salfagestion.cl/ | grep -o '<link.*stylesheet[^>]*>'
```
**Expected:** Only references to `/_tailwind-compiled.css`

**4. JWT Authentication**
```bash
# Should NOT see "JWT_SECRET not configured"
gcloud logging read "resource.type=cloud_run_revision AND textPayload:JWT_SECRET" \
  --project=salfagpt \
  --limit=5 \
  --format=json
```
**Expected:** No recent "JWT_SECRET not configured" errors

### Browser Verification (Manual)

**Open:** https://salfagpt.salfagestion.cl

**Check:**
1. ✅ Page loads without visual issues
2. ✅ Console shows NO CSS 404 errors
3. ✅ Styles applied correctly (Tailwind working)
4. ✅ Login button visible and styled
5. ✅ Can login with Google OAuth
6. ✅ Chat interface loads after login
7. ✅ No "JWT_SECRET not configured" in console

### Performance Checks

**1. Response Times**
```bash
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://salfagpt.salfagestion.cl/
```
**Expected:** < 2 seconds

**2. CSS File Size**
```bash
curl -s https://salfagpt.salfagestion.cl/_tailwind-compiled.css | wc -c
```
**Expected:** ~100KB (reasonable for Tailwind)

**3. No Error Logs**
```bash
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --project=salfagpt \
  --limit=20 \
  --format=json
```
**Expected:** No deployment-related errors

---

## 🚨 Rollback Procedure

### If Deployment Fails

**Immediate Rollback:**
```bash
# List revisions
gcloud run revisions list \
  --service=cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4

# Rollback to previous (00075 or earlier known-good)
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=cr-salfagpt-ai-ft-prod-00075-twd=100 \
  --project=salfagpt \
  --region=us-east4
```

**Verify Rollback:**
```bash
curl https://salfagpt.salfagestion.cl/api/health/firestore
# Should return healthy
```

### If CSS Issues Persist

**Emergency Fix:**
```bash
# SSH into running container (if needed)
gcloud run services proxy cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4

# Or deploy a hotfix
git revert HEAD
git push origin refactor/chat-v2-2025-11-15
# Then redeploy
```

---

## 📊 Monitoring Commands

### Check Current Deployment

```bash
# Current revision
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --format="value(status.traffic[0].revisionName)"

# Environment variables
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --format="table(spec.template.spec.containers[0].env.name,spec.template.spec.containers[0].env.value)"

# Recent logs
gcloud logging tail "resource.type=cloud_run_revision" \
  --project=salfagpt \
  --format="value(textPayload)"
```

### Monitor Health

```bash
# Continuous health check (every 30s)
watch -n 30 'curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq .status'

# Error monitoring
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --project=salfagpt \
  --limit=50 \
  --format=json
```

---

## 🎓 Key Learnings for Future Deployments

### Critical Success Factors

1. **Always build locally first**
   - Catches issues before production
   - Faster iteration
   - Verifies build artifacts

2. **Verify environment variables**
   - Don't assume .env carries over
   - Check Cloud Run service config
   - Test auth endpoints after deploy

3. **Monitor console for 404s**
   - Open DevTools immediately after deploy
   - Check for any red errors
   - Verify all assets load

4. **Use explicit CSS links**
   - Don't rely on build system magic
   - Manual `<link>` tags are clearer
   - Easier to debug

5. **Clean builds prevent issues**
   - Delete dist, .astro, caches
   - Fresh build = fresh manifest
   - No stale references

### Common Pitfalls Avoided

❌ **Trusting browser cache** - Always hard refresh  
❌ **Assuming .env works in production** - Set env vars explicitly  
❌ **Leaving orphaned files** - Delete unused pages promptly  
❌ **Auto CSS injection** - Use manual links for control  
❌ **Skipping local build** - Always verify before deploy

---

## 📝 Quick Reference

### Deploy Command (Copy-Paste Ready)

```bash
cd /Users/alec/salfagpt && \
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --project salfagpt \
  --region us-east4 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 50 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300
```

### Health Check (Copy-Paste Ready)

```bash
curl https://salfagpt.salfagestion.cl/api/health/firestore | jq .
```

### View Logs (Copy-Paste Ready)

```bash
gcloud logging tail "resource.type=cloud_run_revision" \
  --project=salfagpt \
  --format="value(textPayload)" \
  --filter="severity>=WARNING"
```

---

## 🎯 Success Criteria

A successful deployment must meet ALL criteria:

### Technical
- [ ] Build completes without errors
- [ ] Type check passes (0 errors)
- [ ] Only 1 CSS file in dist/client (_tailwind-compiled.css)
- [ ] All env vars set in Cloud Run
- [ ] Revision deployed successfully

### Functional
- [ ] https://salfagpt.salfagestion.cl/ loads
- [ ] No CSS 404 errors in console
- [ ] Google OAuth login works
- [ ] Chat interface loads after login
- [ ] Can send messages and get AI responses
- [ ] Firestore health check passes

### Performance
- [ ] Page load < 2 seconds
- [ ] No console errors
- [ ] CSS loads quickly
- [ ] No excessive network requests

---

## 📞 Troubleshooting

### Issue: CSS 404 Errors

**Check:**
```bash
curl -s https://salfagpt.salfagestion.cl/ | grep -o '<link.*\.css'
```

**Fix:**
1. Verify `/_tailwind-compiled.css` exists in dist/client
2. Check astro.config.mjs has `cssCodeSplit: false`
3. Verify manual `<link>` tags in index.astro and chat.astro
4. Rebuild and redeploy

### Issue: "JWT_SECRET not configured"

**Check:**
```bash
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project salfagpt \
  --region us-east4 \
  --format="value(spec.template.spec.containers[0].env)" | grep JWT_SECRET
```

**Fix:**
```bash
export JWT_SECRET=$(grep '^JWT_SECRET=' .env | cut -d'=' -f2)

gcloud run services update cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region us-east4 \
  --update-env-vars="JWT_SECRET=${JWT_SECRET}"
```

### Issue: OAuth Fails

**Check:**
```bash
# Verify OAuth credentials
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region us-east4 \
  --format="value(spec.template.spec.containers[0].env)" | \
  grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|PUBLIC_BASE_URL"
```

**Fix:**
Ensure all three OAuth vars are set correctly

### Issue: Firestore Fails

**Check:**
```bash
curl https://salfagpt.salfagestion.cl/api/health/firestore
```

**Fix:**
1. Verify GOOGLE_CLOUD_PROJECT=salfagpt
2. Check service account has Firestore permissions
3. Review error logs

---

## 🔄 Deployment Workflow

### Standard Workflow

```
1. Make code changes
   ↓
2. Test locally (npm run dev)
   ↓
3. Build locally (npm run build)
   ↓
4. Verify build (check dist/client/*.css)
   ↓
5. Commit (git commit -m "...")
   ↓
6. Push (git push origin branch)
   ↓
7. Deploy (gcloud run deploy ...)
   ↓
8. Verify (curl health check)
   ↓
9. Browser test (open site, check console)
   ↓
10. Monitor (gcloud logging tail ...)
```

### Emergency Hotfix Workflow

```
1. Identify issue in production
   ↓
2. Create hotfix branch
   git checkout -b hotfix/issue-name
   ↓
3. Make minimal fix
   ↓
4. Test locally
   ↓
5. Deploy immediately (skip full testing)
   ↓
6. Verify fix worked
   ↓
7. Merge to main later
```

---

## 📚 Related Documentation

**Guides Created Today:**
- `docs/CSS_404_FIX_2025-11-17.md` - CSS issue deep dive
- `docs/DEPLOYMENT_CHECKLIST_2025-11-17.md` - This document

**Scripts:**
- `scripts/fix-css-references.js` - Post-build CSS verification
- `scripts/fix-production-paths.js` - Path fixing for Docker
- `scripts/deploy-production.sh` - Deployment automation

**Configuration:**
- `astro.config.mjs` - CSS bundling settings
- `.env` - Environment variables (local)
- `Dockerfile` - Container configuration

---

## 🎯 Success Metrics - November 17, 2025

### Deployment Statistics

- **Total deployments today:** 10 (revisions 00067-00076)
- **Final working revision:** 00076-q54
- **Time to resolution:** ~2 hours
- **Console errors eliminated:** 4 CSS 404s + JWT errors
- **Auth status:** ✅ Working
- **Site status:** ✅ Fully operational

### Commits

1. `658af11` - Remove orphaned CSS files
2. `0619032` - Add cache headers
3. `72c960a` - Delete admin-agents-list.astro
4. `02a4aa6` - Disable CSS code splitting
5. `a550a58` - Simplify CSS config
6. `a8091f4` - Add CSS fix script
7. `3da9a81` - Add manual CSS links ← **FINAL FIX**

### Impact

**Before:**
- ❌ 4 CSS 404 errors per page load
- ❌ JWT authentication broken
- ❌ Unprofessional console appearance
- ❌ Wasted network requests

**After:**
- ✅ Zero CSS 404 errors
- ✅ JWT authentication working
- ✅ Clean console
- ✅ Optimized performance

---

## 🚀 Next Steps

### Short Term (This Week)

- [ ] Monitor production for 48 hours
- [ ] Verify no new CSS issues emerge
- [ ] Test all user flows work correctly
- [ ] Document any edge cases found

### Medium Term (This Month)

- [ ] Consider CSS optimization strategies
- [ ] Evaluate moving to CSS-in-JS if issues persist
- [ ] Set up automated deployment pipeline
- [ ] Create staging environment for testing

### Long Term (This Quarter)

- [ ] Implement comprehensive E2E tests
- [ ] Automate deployment checklist
- [ ] Set up monitoring/alerting for 404s
- [ ] Create deployment dashboard

---

## 📧 Contact & Support

**Deployment Owner:** Alec (alec@getaifactory.com)  
**Cloud Project:** salfagpt  
**Repository:** github.com/alecaifactory/salfagpt  
**Documentation:** /Users/alec/salfagpt/docs/

**For issues:**
1. Check this guide first
2. Review related docs (CSS_404_FIX_2025-11-17.md)
3. Check recent commits
4. Contact deployment owner

---

**Remember:** 
- 🎯 Build locally first
- 🔐 Verify env vars always
- 🚀 Deploy with confidence
- ✅ Check immediately after deploy
- 📊 Monitor for 24 hours

**Production is LIVE and STABLE as of November 17, 2025, 10:30 AM PST** 🎉





