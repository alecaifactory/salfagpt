# OAuth Configuration - Salfacorp Production

**Service:** cr-salfagpt-ai-ft-prod  
**Region:** us-east4 (generates .uk.a.run.app URLs)  
**Domain:** https://salfagpt.salfagestion.cl  
**Last Updated:** 2025-11-03

---

## Current Configuration

### OAuth Client ID
```
Client ID: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
Project: salfagpt
Name: SalfaGPT
```

### Authorized JavaScript Origins
```
1. http://localhost:3000
2. https://salfagpt-3snj65wckq-uc.a.run.app
3. https://salfagpt.salfagestion.cl
4. https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
```

### Authorized Redirect URIs
```
1. http://localhost:3000/auth/callback
2. https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
3. https://salfagpt.salfagestion.cl/auth/callback
4. https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app/auth/callback
```

---

## Cloud Run Service Configuration

### Service: cr-salfagpt-ai-ft-prod

**Environment Variables:**
```bash
GOOGLE_CLOUD_PROJECT=cr-salfagpt-ai-ft-prod
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
PUBLIC_BASE_URL=https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
NODE_ENV=production
```

**Region:** us-east4  
**URL:** https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app

---

## Domain Mapping

The custom domain **salfagpt.salfagestion.cl** is mapped to the Cloud Run service.

**DNS Configuration:**
- Type: CNAME or A record
- Points to: Cloud Run service URL
- SSL/TLS: Managed by Cloud Run

**Verification:**
```bash
# Check domain mapping
gcloud run domain-mappings list --project=salfagpt --region=us-east4

# Test domain
curl -I https://salfagpt.salfagestion.cl
```

---

## Troubleshooting

### Error: redirect_uri_mismatch

**Symptom:** OAuth error "redirect_uri_mismatch"

**Cause:** Redirect URI not registered in OAuth client

**Solution:**
1. Get actual Cloud Run URL:
   ```bash
   gcloud run services describe cr-salfagpt-ai-ft-prod \
     --project=salfagpt \
     --region=us-east4 \
     --format="value(status.url)"
   ```

2. Add to OAuth client in Google Cloud Console:
   - Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
   - Edit OAuth client: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h
   - Add redirect URI: `[CLOUD_RUN_URL]/auth/callback`
   - Save

3. **Wait 5-15 minutes** for Google to propagate changes

4. Test in incognito window

---

### Verify OAuth Configuration

```bash
# Check Cloud Run environment variables
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --format="yaml(spec.template.spec.containers[0].env)" | \
  grep -E "PUBLIC_BASE_URL|GOOGLE_CLIENT_ID"

# Expected output:
# - name: PUBLIC_BASE_URL
#   value: https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
# - name: GOOGLE_CLIENT_ID
#   value: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
```

---

## Testing Checklist

### Before Testing
- [ ] OAuth redirect URIs added to Google Cloud Console
- [ ] Waited 5-15 minutes for propagation
- [ ] Using incognito/private window

### Test Login Flow
1. [ ] Go to https://salfagpt.salfagestion.cl
2. [ ] Click "Continuar con Google"
3. [ ] Should redirect to Google OAuth (not error page)
4. [ ] Select Google account
5. [ ] Should redirect back to https://salfagpt.salfagestion.cl/auth/callback
6. [ ] Should show chat interface
7. [ ] User info displayed correctly

### Verify Session
1. [ ] Session cookie set (flow_session)
2. [ ] Cookie is httpOnly and secure
3. [ ] User can navigate app
4. [ ] Refresh preserves session
5. [ ] Logout clears session

---

## Important Notes

### Region Difference
- **US Central 1** services generate `.uc.a.run.app` URLs
- **US East 4** services generate `.uk.a.run.app` URLs
- This is why `cr-salfagpt-ai-ft-prod` has a different URL pattern

### OAuth Client Usage
This OAuth client (ID: 82892384200-...) is used for:
- ✅ Local development (localhost:3000)
- ✅ Salfacorp production (salfagpt.salfagestion.cl)
- ✅ Direct Cloud Run URLs (for testing)

### Security
- Client secret is stored securely (masked in console)
- Never commit OAuth credentials to git
- Use environment variables for all deployments

---

## Quick Commands

### Get Service URL
```bash
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --format="value(status.url)"
```

### Update PUBLIC_BASE_URL (if needed)
```bash
SERVICE_URL=$(gcloud run services describe cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --format="value(status.url)")

gcloud run services update cr-salfagpt-ai-ft-prod \
  --project=salfagpt \
  --region=us-east4 \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"
```

### Test OAuth Redirect
```bash
# Should return 302 redirect to Google
curl -I https://salfagpt.salfagestion.cl/auth/google
```

---

## Related Documentation

- `README_PRODUCCION_SALFAGPT.md` - Salfacorp production setup
- `OAUTH_SETUP_GUIDE.md` - General OAuth setup guide
- `.cursor/rules/deployment.mdc` - Deployment rules
- `.cursor/rules/oauthclient.mdc` - OAuth client stability rules

---

**Status:** ✅ Configured  
**Last Verified:** 2025-11-03  
**Next Check:** After OAuth propagation (5-15 minutes)

