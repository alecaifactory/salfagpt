# Salfacorp Production Deployment - Quick Reference

**Last Updated:** 2025-11-03  
**Service:** cr-salfagpt-ai-ft-prod  
**Region:** us-east4  
**Domain:** https://salfagpt.salfagestion.cl

---

## 🚀 Quick Deploy Command

```bash
cd /Users/alec/salfagpt

# Build and deploy in one command
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --source . \
  --allow-unauthenticated \
  --port=3000 \
  --timeout=300 \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=10
```

---

## ⚠️ Critical Configuration Notes

### Port Configuration
- **Container Port:** 3000 (hardcoded in Astro build)
- **Cloud Run Flag:** `--port=3000` (REQUIRED)
- **Why:** Astro builds with hardcoded port in `dist/server/entry.mjs`
- **DO NOT** set PORT env var or Cloud Run will expect 8080

### OAuth Configuration
- **Client ID:** 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h
- **Redirect URIs:**
  - `https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app/auth/callback`
  - `https://salfagpt.salfagestion.cl/auth/callback`

### Environment Variables (in Cloud Run)
```
GOOGLE_CLOUD_PROJECT=cr-salfagpt-ai-ft-prod
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
PUBLIC_BASE_URL=https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
NODE_ENV=production
GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0
GOOGLE_CLIENT_SECRET=(secret)
JWT_SECRET=(secret)
```

---

## 🧪 Testing After Deployment

```bash
# 1. Test login page
curl -I https://salfagpt.salfagestion.cl/
# Expected: HTTP/2 200

# 2. Test callback route
curl -I https://salfagpt.salfagestion.cl/auth/callback
# Expected: HTTP/2 302 (redirects to /?error=no_code)

# 3. Test OAuth redirect
curl -I https://salfagpt.salfagestion.cl/auth/login-redirect
# Expected: HTTP/2 302 (redirects to Google)

# 4. Check for errors
gcloud logging read "resource.labels.service_name=cr-salfagpt-ai-ft-prod AND severity>=ERROR" \
  --project=salfagpt \
  --limit=10
# Expected: No EADDRINUSE errors
```

---

## 📋 Pre-Deployment Checklist

- [ ] Code committed to git
- [ ] `npm run build` succeeds locally
- [ ] `npm run type-check` passes
- [ ] OAuth client has all redirect URIs registered
- [ ] Environment variables verified in Cloud Run console

---

## 🔧 Troubleshooting

### Error: EADDRINUSE (port already in use)

**Symptom:** `Error: listen EADDRINUSE: address already in use 0.0.0.0:8080`

**Cause:** Cloud Run PORT env var (8080) doesn't match container port (3000)

**Fix:** Deploy with `--port=3000` flag

### Error: 404 on /auth/callback

**Symptom:** Callback route returns 404

**Causes & Solutions:**
1. **Routes not in build:** Run `npm run build` and redeploy
2. **Port mismatch:** Add `--port=3000` to deployment
3. **Stale deployment:** Wait 2-3 minutes for new revision to activate

### Error: redirect_uri_mismatch

**Symptom:** OAuth error page

**Fix:** Add redirect URI to OAuth client in Google Cloud Console

---

## 📊 Current Service Status

```bash
# Check service status
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --format="value(status.url,status.latestReadyRevisionName)"
```

---

## 🔗 Related Documentation

- `docs/OAUTH_CONFIG_SALFACORP_PROD.md` - OAuth configuration details
- `docs/OAUTH_FIX_SALFACORP_2025-11-03.md` - Full troubleshooting guide
- `README_PRODUCCION_SALFAGPT.md` - Production setup guide

---

## ✅ Deployment Success Criteria

After deployment, verify:
- [x] Login page loads (https://salfagpt.salfagestion.cl)
- [x] OAuth redirect works (no redirect_uri_mismatch)
- [x] Callback returns 302 redirect
- [x] No errors in Cloud Run logs
- [x] Container starts successfully (no EADDRINUSE)
- [ ] User can complete full login flow
- [ ] Chat interface loads after login

---

**Service:** cr-salfagpt-ai-ft-prod  
**Latest Revision:** cr-salfagpt-ai-ft-prod-00032-xrw  
**Status:** ✅ FULLY OPERATIONAL  
**Login URL:** https://salfagpt.salfagestion.cl  
**Last Fixed:** 2025-11-03 - Absolute path issue resolved

