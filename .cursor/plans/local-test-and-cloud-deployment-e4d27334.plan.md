<!-- e4d27334-f69f-44be-930a-995c55f85d3c 4d21817e-547d-4068-9853-f411eb83b2c2 -->
# Local Test and Cloud Run Deployment Plan

## Phase 1: Local Testing (Iteration 0)

### 1.1 Start Development Server

- Run `npm run dev` in background
- Wait 5 seconds for server to initialize
- Verify server responds on `http://localhost:3000`

### 1.2 Browser Testing Checklist

Test these routes using curl and verify responses:

- **`/`** (Landing page) - Should return HTML with "Flow" title and OAuth button
- **`/chat`** (Dev mode) - Should work without OAuth, uses test user
- **`/home`** (Protected) - Will redirect to auth since no OAuth configured
- **`/api/chat`** (API endpoint) - Test with POST request

Expected results:

- Landing page: ✅ Loads with gradient design
- Chat page: ✅ Loads in dev mode (no auth required)
- API: ⚠️ May need GCP credentials

### 1.3 Build Verification

- Run `npm run build` to ensure production build passes
- Check output for any errors
- Verify dist folder is created

---

## Phase 2: Cloud Run Deployment Attempts

### Attempt 1: Direct Cloud Run Deploy (Iteration 1)

**Command:**

```bash
gcloud run deploy flow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production" \
  --project=gen-lang-client-0986191192 \
  --timeout=20m
```

**Known Issue:** Registry push failures due to network connectivity

**If fails:** Proceed to Attempt 2

### Attempt 2: Use Cloud Shell (Iteration 2)

**Rationale:** Cloud Shell has better connectivity to GCP services

**Steps:**

1. Create deployment-ready zip (exclude node_modules, .git, dist)
2. Provide instructions to upload to Cloud Shell
3. Command for Cloud Shell:
   ```bash
   unzip flow-deploy.zip && cd flow
   gcloud run deploy flow --source . --region us-central1 --allow-unauthenticated
   ```


**If fails:** Check build logs and proceed to Attempt 3

### Attempt 3: Pre-build Docker Image (Iteration 3)

**Rationale:** Separate build from deploy to isolate issues

**Steps:**

1. Use Cloud Build to build image separately:
   ```bash
   gcloud builds submit --tag gcr.io/gen-lang-client-0986191192/flow
   ```

2. Deploy pre-built image:
   ```bash
   gcloud run deploy flow --image gcr.io/gen-lang-client-0986191192/flow --region us-central1
   ```


**If fails:** Diagnose specific error and proceed to Attempt 4

### Attempt 4: Simplified Deployment (Iteration 4)

**Rationale:** Remove complexity, deploy minimal working version

**Steps:**

1. Temporarily disable optional features in code
2. Use smallest possible container
3. Deploy with minimal environment variables
4. Test if basic deployment works

**If fails:** Proceed to Attempt 5

### Attempt 5: Alternative Registry (Iteration 5)

**Rationale:** Use Container Registry instead of Artifact Registry

**Steps:**

1. Enable Container Registry API
2. Configure Docker to use gcr.io
3. Deploy using Container Registry path:
   ```bash
   gcloud builds submit --tag gcr.io/gen-lang-client-0986191192/flow
   gcloud run deploy flow --image gcr.io/gen-lang-client-0986191192/flow
   ```


---

## Phase 3: Post-Deployment Verification

Once deployment succeeds:

1. Get Cloud Run URL from deployment output
2. Test the deployed URL in browser
3. Verify routes work:

   - Landing page loads
   - Chat interface accessible

4. Document the working deployment URL

---

## Success Criteria

**Local Testing:**

- [ ] Dev server starts successfully
- [ ] Landing page loads with proper styling
- [ ] Chat page works in dev mode
- [ ] Production build completes without errors

**Deployment:**

- [ ] Cloud Run service deployed successfully
- [ ] Service has public URL
- [ ] Landing page accessible via URL
- [ ] No critical errors in Cloud Run logs

---

## Failure Analysis Protocol

For each failed attempt, capture:

1. Exact error message
2. Build/deploy logs (last 50 lines)
3. Status codes
4. Identify root cause before next attempt

Common failure modes:

- **Registry push timeout:** Use Cloud Shell (Attempt 2)
- **Build errors:** Fix code issues identified in logs
- **Permission errors:** Verify IAM roles
- **API not enabled:** Enable required APIs
- **Resource limits:** Adjust memory/CPU settings

### To-dos

- [ ] Start local dev server and verify it responds
- [ ] Test all routes in browser - landing, chat, API endpoints
- [ ] Run production build and verify success
- [ ] Attempt 1: Deploy directly from local machine
- [ ] Attempt 2: Deploy via Cloud Shell if Attempt 1 fails
- [ ] Attempt 3: Pre-build image then deploy if Attempt 2 fails
- [ ] Test deployed URL and verify all routes work
- [ ] 