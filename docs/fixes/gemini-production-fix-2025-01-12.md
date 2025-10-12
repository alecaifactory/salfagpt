# Fix: Gemini AI Not Working in Production
**Date:** 2025-01-12
**Status:** ✅ Fixed

## 📋 Problem

### Symptom
- Chat worked perfectly in `localhost` but failed in production
- No AI responses were generated in `https://flow-chat-cno6l2kfga-uc.a.run.app`

### Root Cause
**Missing `GOOGLE_AI_API_KEY` environment variable in Cloud Run**

The Gemini AI client requires this API key to authenticate requests. While it was present in the local `.env` file, it was not configured in the Cloud Run service.

## 🔧 Solution Implemented

### Step 1: Created Secret in Secret Manager
```bash
# Add API key as secret
echo -n "AIzaSyCbK-RXY06udmeLVrcgqz992b3haE1dVWo" | gcloud secrets versions add gemini-api-key --data-file=- --project=gen-lang-client-0986191192
```

### Step 2: Grant Service Account Access
```bash
# Give Cloud Run service account permission to read the secret
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=gen-lang-client-0986191192
```

### Step 3: Mount Secret in Cloud Run
```bash
# Update Cloud Run to mount the secret as environment variable
gcloud run services update flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --update-secrets="GOOGLE_AI_API_KEY=gemini-api-key:latest"
```

## ✅ Verification

### Test Command
```bash
curl -X POST "https://flow-chat-cno6l2kfga-uc.a.run.app/api/conversations/temp-test-123/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "Hola, ¿cómo estás?",
    "model": "gemini-2.5-flash",
    "systemPrompt": "Eres un asistente útil.",
    "contextSources": []
  }'
```

### Expected Response
```json
{
  "message": {
    "content": {
      "type": "text",
      "text": "Hola, estoy muy bien, gracias por preguntar.\n\n¿Y tú, cómo estás?"
    },
    "role": "assistant",
    "tokenCount": 16
  },
  "tokenStats": {
    "totalInputTokens": 11,
    "totalOutputTokens": 16,
    "contextWindowUsed": 27,
    "contextWindowAvailable": 999973
  }
}
```

## 📝 Key Lessons

### 1. Environment Variable Management
**ALWAYS verify that ALL required environment variables are set in Cloud Run**, not just in local `.env`.

#### Critical Variables for Flow:
| Variable | Required | Where | Purpose |
|---|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | ✅ | Env Var | Firestore/BigQuery project |
| `GOOGLE_AI_API_KEY` | ✅ | Secret | Gemini AI authentication |
| `GOOGLE_CLIENT_ID` | ✅ | Secret | OAuth2 authentication |
| `GOOGLE_CLIENT_SECRET` | ✅ | Secret | OAuth2 authentication |
| `JWT_SECRET` | ✅ | Secret | Session token signing |
| `PUBLIC_BASE_URL` | ✅ | Env Var | OAuth2 redirect URI |
| `NODE_ENV` | ✅ | Env Var | Production environment flag |

### 2. Sensitive Data in Secrets
**NEVER pass API keys as environment variables directly**. Always use Secret Manager:

✅ **CORRECT:**
```bash
gcloud run services update flow-chat \
  --update-secrets="GOOGLE_AI_API_KEY=gemini-api-key:latest"
```

❌ **WRONG:**
```bash
gcloud run services update flow-chat \
  --set-env-vars="GOOGLE_AI_API_KEY=AIzaSy..." # Visible in logs!
```

### 3. Service Account Permissions
The Cloud Run service account needs `secretmanager.secretAccessor` role to read secrets.

### 4. Testing in Production
After configuration changes:
1. ✅ Deploy service
2. ✅ Wait for service to restart (~30 seconds)
3. ✅ Test with curl
4. ✅ Check Cloud Run logs for errors

## 🔍 Debugging Commands

### Check Environment Variables
```bash
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Check Secrets Mounted
```bash
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Check Cloud Run Logs
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=flow-chat AND severity>=ERROR' \
  --limit=30 \
  --project=gen-lang-client-0986191192
```

### Verify Secret Value
```bash
gcloud secrets versions access latest --secret="gemini-api-key" --project=gen-lang-client-0986191192
```

## 📚 Related Documentation
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `.cursor/rules/backend.mdc` - Backend architecture
- `.env.example` - Required environment variables
- `src/lib/gemini.ts` - Gemini AI client initialization

## ✅ Success Criteria

After this fix, the following should work in production:

1. ✅ **Chat responses**: Users can send messages and receive AI-generated responses
2. ✅ **Model selection**: Both Flash and Pro models work correctly
3. ✅ **Context usage**: Context sources are included in AI requests
4. ✅ **Token tracking**: Accurate token counts and context window usage
5. ✅ **Error handling**: Clear error messages if API key becomes invalid

## 🎯 Next Steps

1. ✅ Update `docs/DEPLOYMENT.md` with this lesson
2. ✅ Add pre-deployment checklist to verify all secrets
3. ✅ Create automated health check for Gemini AI
4. ⏳ Add monitoring alerts for Gemini API errors

---

**Last Updated:** 2025-01-12  
**Fixed By:** AI Assistant  
**Production URL:** https://flow-chat-cno6l2kfga-uc.a.run.app

