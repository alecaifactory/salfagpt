# Local Testing & Production Deployment Guide

**Last Updated**: October 11, 2025

This guide covers how to test all components locally and deploy to production.

---

## 🎯 Quick Start: Test Everything Locally

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your keys (see below)

# 2. Start development server
npm run dev

# 3. Test chat at http://localhost:3000/chat
```

---

## 🔑 Environment Variables Setup

### For Local Development

Create/edit `.env`:

```bash
# Required: Gemini AI API Key (get from https://aistudio.google.com/apikey)
GOOGLE_AI_API_KEY=your-api-key-here

# Optional: For Firestore/BigQuery (see sections below)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Optional: For BigQuery
BIGQUERY_DATASET=openflow_dataset

# Optional: For Vertex AI location
VERTEX_AI_LOCATION=us-central1
```

---

## 🤖 Testing Gemini AI Locally

### Setup

1. **Get API Key**:
   - Go to: https://aistudio.google.com/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to .env**:
   ```bash
   GOOGLE_AI_API_KEY=AIzaSy...
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Test

1. Navigate to: http://localhost:3000/chat
2. Type a message
3. **Expected**: Real AI response from Gemini 2.5 Flash

### Verify

Check console output:
```
✅ Gemini response generated in 1234ms
📝 Token count: 150
```

### Current Configuration

- **Model**: `gemini-2.5-flash` (fast, efficient)
- **Alternative**: `gemini-2.5-pro` (slower, more capable)
- **Location**: Uses Google AI API (no GCP credentials needed)
- **API Library**: `@google/genai` v1.23.0

---

## 🔥 Testing Firestore Locally

You have **3 options** for local Firestore testing:

### Option 1: Skip Firestore (Simplest)

**How it works**: App runs with in-memory storage only

```bash
# Just start the server (no additional setup)
npm run dev
```

**Pros**: 
- ✅ No setup required
- ✅ Fast development

**Cons**: 
- ⚠️ Conversations don't persist between reloads
- ⚠️ Settings don't save

### Option 2: Firebase Emulator (Recommended)

**How it works**: Local Firestore emulator

```bash
# Terminal 1: Start Firebase emulator
npm run dev:emulator

# Terminal 2: Start app with emulator
npm run dev:local
```

**Setup** (one-time):
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators
# Select: Firestore, Pub/Sub
# Accept defaults
```

**Pros**:
- ✅ Full Firestore functionality
- ✅ No GCP credentials needed
- ✅ Data persists during session
- ✅ Can inspect data in UI: http://localhost:4000

**Cons**:
- ⚠️ Data clears when emulator stops

### Option 3: Real Firestore (Production-like)

**How it works**: Connect to actual GCP Firestore

```bash
# 1. Get service account key from GCP
# 2. Save to keys/service-account.json
# 3. Add to .env
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/service-account.json"

# 4. Start dev server
npm run dev
```

**Setup**:
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Create service account with Firestore permissions
3. Download JSON key
4. Save securely in `keys/` directory
5. Add `keys/` to `.gitignore`

**Pros**:
- ✅ Real production data
- ✅ Full persistence

**Cons**:
- ⚠️ Requires GCP setup
- ⚠️ Uses real quota/billing
- ⚠️ Security risk if keys leaked

---

## 📊 Testing BigQuery Locally

BigQuery is **automatically disabled in development mode**. You'll see:

```
📝 [DEV] Would insert chat message: { userId: 'test-user', role: 'user', messageLength: 10 }
```

### To Test with Real BigQuery

1. **Set up GCP credentials** (see Firestore Option 3)

2. **Create BigQuery dataset**:
   ```bash
   # One-time setup
   npm run setup:bigquery
   ```

3. **Remove dev mode bypass** (temporary, for testing):
   ```typescript
   // In src/lib/gcp.ts, comment out:
   // if (IS_DEVELOPMENT) {
   //   console.log('...');
   //   return;
   // }
   ```

4. **Test query**:
   ```bash
   # In GCP Console BigQuery
   SELECT * FROM `your-project.openflow_dataset.chat_messages`
   ORDER BY timestamp DESC
   LIMIT 10;
   ```

---

## 🧪 Complete Local Testing Workflow

### 1. Basic Chat Test (No Persistence)

```bash
# Terminal 1
npm run dev

# Browser
# Open: http://localhost:3000/chat
# Send message: "Hello"
# Verify: Real AI response appears
```

### 2. Full Stack Test (With Persistence)

```bash
# Terminal 1: Firebase Emulator
npm run dev:emulator

# Terminal 2: App with Emulator
npm run dev:local

# Browser
# Open: http://localhost:3000/chat
# Create conversation
# Send multiple messages
# Reload page - conversation should persist
# Open: http://localhost:4000 - inspect Firestore data
```

### 3. Integration Test (All Services)

```bash
# Requires: GCP service account key

# 1. Set credentials
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/keys/service-account.json"

# 2. Setup BigQuery
npm run setup:bigquery

# 3. Start dev server
npm run dev

# 4. Test chat
# - Messages persist to Firestore
# - Analytics logged to BigQuery
# - Real Gemini AI responses
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Clean build
rm -rf .next
npm run build

# 2. Type check
npm run type-check

# 3. Verify no linter errors
# (should show 0 errors)

# 4. Test production build locally
npm run preview
```

### Deploy to Cloud Run (GCP)

```bash
# Using pame-core-cli
npx pame-core-cli deploy www --production

# OR using gcloud directly
gcloud builds submit --tag gcr.io/${PROJECT_ID}/openflow
gcloud run deploy openflow \
  --image gcr.io/${PROJECT_ID}/openflow \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Production Environment Variables

Set in Cloud Run:

```bash
# Required
GOOGLE_AI_API_KEY=your-production-api-key
GOOGLE_CLOUD_PROJECT=your-project-id

# OAuth
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-secret
OAUTH_REDIRECT_URI=https://your-domain.com/auth/callback

# Optional
BIGQUERY_DATASET=openflow_dataset
VERTEX_AI_LOCATION=us-central1
```

### Verify Production Deployment

1. **Check health**:
   ```bash
   curl https://your-app.run.app/
   # Should return 200 OK
   ```

2. **Test chat**:
   - Navigate to: https://your-app.run.app/chat
   - Send test message
   - Verify AI response

3. **Check logs**:
   ```bash
   gcloud run logs read openflow --limit 50
   ```

4. **Verify BigQuery**:
   ```sql
   -- In GCP Console
   SELECT COUNT(*) FROM `project.openflow_dataset.chat_messages`
   WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR);
   ```

---

## 🔍 Troubleshooting

### Issue: "No Gemini responses"

**Check**:
1. API key is set: `echo $GOOGLE_AI_API_KEY`
2. Console shows: `✅ AI response generated`
3. Not in mock mode: Check for mock messages

**Fix**:
```bash
# Add to .env
GOOGLE_AI_API_KEY=your-key-here

# Restart server
npm run dev
```

### Issue: "Firestore errors"

**Check**:
```
Error: ENOENT: no such file or directory
```

**Fix**:
```bash
# Option 1: Unset invalid credentials
unset GOOGLE_APPLICATION_CREDENTIALS

# Option 2: Use Firebase emulator
npm run dev:emulator
# In another terminal:
npm run dev:local
```

### Issue: "BigQuery errors in production"

**Check**:
1. Dataset exists
2. Service account has BigQuery permissions
3. Workload Identity configured

**Fix**:
```bash
# Recreate dataset
npm run setup:bigquery

# Grant permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/bigquery.dataEditor"
```

### Issue: "Build fails"

**Check**:
```bash
npm run type-check
```

**Common fixes**:
1. Update imports to use correct Gemini API
2. Fix TypeScript errors
3. Clean build: `rm -rf .next && npm run build`

---

## 📋 Testing Matrix

| Component | Local (Basic) | Local (Full) | Production |
|-----------|---------------|--------------|------------|
| **Gemini AI** | ✅ Google AI API | ✅ Google AI API | ✅ Google AI API |
| **Firestore** | ⚠️ In-memory | ✅ Emulator | ✅ Real Firestore |
| **BigQuery** | ❌ Disabled | ⚠️ Optional | ✅ Enabled |
| **Auth** | ✅ Dev bypass | ✅ Dev bypass | ✅ OAuth |
| **Persistence** | ❌ No | ✅ Session | ✅ Permanent |

---

## 🎓 Best Practices

### Development

1. **Start simple**: Use basic setup (no Firestore/BigQuery)
2. **Iterate**: Add emulators when testing persistence
3. **Final test**: Test with real services before deploying

### Before Commit

```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Test
npm run preview
```

### Before Deploy

```bash
# 1. All commits pushed
git status

# 2. Branch merged to main
git checkout main && git pull

# 3. Build succeeds
npm run build

# 4. Deploy
npx pame-core-cli deploy www --production
```

---

## 📚 Related Documentation

- `docs/GEMINI_API_MIGRATION.md` - Gemini API usage guide
- `docs/FIRESTORE_DEV_SETUP.md` - Firestore setup details
- `docs/BIGQUERY_ANALYTICS_GUIDE.md` - BigQuery configuration
- `docs/OAUTH_QUICKSTART.md` - OAuth setup

---

**Questions?** Check console output - we log helpful messages for development!

- ✅ Good: `🔥 Firestore initialized successfully`
- ✅ Good: `✅ AI response generated in 1234ms`
- ⚠️ Warning: `⚠️ Firestore not available - using in-memory storage`
- ❌ Error: Check stack trace and refer to troubleshooting

