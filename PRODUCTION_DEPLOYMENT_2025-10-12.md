
---

## 🔧 Critical Fix - October 12, 2025 (19:16 PST)

### Issue Fixed: PDF Upload & Relevance Analysis Failing

**Symptoms:**
- HTTP 500 errors when uploading PDFs
- Error: "API key not valid. Please pass a valid API key"
- Firestore warning: "not configured"

**Root Cause:**
```
Code was looking for:    GEMINI_API_KEY
Cloud Run had:          GOOGLE_AI_API_KEY (configured as secret)
Result:                 API key not found → Gemini AI failed
```

**Solution Applied:**

Updated API endpoints to use `GOOGLE_AI_API_KEY`:
- `src/pages/api/extract-document.ts`
- `src/pages/api/analyze-relevance.ts`

Changed from:
```typescript
const apiKey = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
```

To:
```typescript
const apiKey = process.env.GOOGLE_AI_API_KEY || import.meta.env.GOOGLE_AI_API_KEY;
```

**Deployment Details:**
```
Service:     flow-chat
Revision:    flow-chat-00022-942
URL:         https://flow-chat-cno6l2kfga-uc.a.run.app (unchanged ✅)
Deployed:    2025-10-12 22:16 UTC
Status:      ✅ Serving 100% traffic
```

**Functionality Restored:**
- ✅ PDF upload with Gemini AI extraction
- ✅ Content extraction and chunking
- ✅ Relevance analysis of context chunks
- ✅ Cloud Storage integration
- ✅ Contextual reference visualization

**Commit:**
```
13f98b1 - fix: Use GOOGLE_AI_API_KEY instead of GEMINI_API_KEY
```

**Verified:**
- URL stability maintained (OAuth unchanged)
- All secrets properly configured
- System fully functional in production


---

### Fix #3: Cloud Storage Permissions (October 12, 2025 - 23:30 PST)

**Issue**: Files not being saved to Cloud Storage
- Bucket appeared empty in GCP Console
- No files uploaded despite successful UI response
- No error messages in logs (silent failure)

**Root Cause**:
```
Service Account: 1030147139179-compute@developer.gserviceaccount.com
Missing role: roles/storage.objectAdmin on bucket
Result: Upload fails silently, no files saved
```

**Solution**:
```bash
# Grant Storage Object Admin role to Cloud Run Service Account
gcloud storage buckets add-iam-policy-binding \
  gs://gen-lang-client-0986191192-uploads \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" \
  --project gen-lang-client-0986191192
```

**Files Changed**: None (configuration only)

**Verification**:
```bash
# Check bucket permissions
gcloud storage buckets get-iam-policy \
  gs://gen-lang-client-0986191192-uploads
```

**Status**: ✅ Fixed - Files now saving correctly to Cloud Storage

**Documentation**: See `STORAGE_ARCHITECTURE.md` for complete storage details

