# 🚨 CRITICAL: API Key Leaked - Immediate Action Required

## Problem
```
Your API key was reported as leaked. Please use another API key.
```

## Impact
- **ALL** AI responses are blocked
- RAG cannot work because Gemini API calls fail
- This affects BOTH localhost and production

## Immediate Steps Required

### 1. Generate New Google AI API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy the new key

### 2. Update `.env` file (localhost)
```bash
# Replace the current key with new one
GOOGLE_AI_API_KEY=your-new-api-key-here
```

### 3. Update Google Cloud Secret (production)
```bash
# Update the secret
echo -n "your-new-api-key-here" | gcloud secrets versions add GOOGLE_AI_API_KEY --data-file=- --project=salfagpt

# Verify
gcloud secrets versions access latest --secret="GOOGLE_AI_API_KEY" --project=salfagpt
```

### 4. Redeploy to Production
```bash
# Cloud Run will pick up the new secret automatically
gcloud run deploy cr-salfagpt-ai-ft-prod --source . --region us-central1 --project salfagpt
```

### 5. Restart Localhost Server
```bash
# Kill current server
lsof -ti:3000 | xargs kill -9

# Restart with new key
npm run dev
```

## Additional Fixes Applied

While fixing this, I also fixed:

### Fix 1: Wrong function name in rag-search.ts
```typescript
// BEFORE (BROKEN):
const { getUserByIdOrEmail } = await import('./firestore.js');

// AFTER (FIXED):
const { getUserById } = await import('./firestore.js');
```

### Fix 2: context-stats API querying wrong place
- Now queries `agent_sources` collection correctly
- Returns activeContextSourceIds properly

### Fix 3: context-sources-metadata API
- Also queries `agent_sources` collection
- Merges results from both sources

## Testing After API Key Fix

Once you have a new API key:

1. Update `.env` with new key
2. Restart server: `npm run dev`
3. Refresh browser
4. Select S1-v2
5. Ask: "como solicito algo de la bodega?"
6. **You should see**: References at the end with document names

## Why This Matters

The API key leak is **blocking everything**:
- ❌ No AI responses
- ❌ No RAG searches
- ❌ No embeddings
- ❌ No references

**Fix the API key FIRST**, then everything else will work.

## Current Status

✅ Documents assigned: 75 documents to S1-v2
✅ activeContextSourceIds: 75 IDs on agent
✅ agent_sources: 75 assignments
✅ APIs fixed: context-stats and context-sources-metadata
✅ Function name fixed: getUserById
❌ **API KEY LEAKED**: Blocking all functionality

**Action Required**: Generate new API key NOW

