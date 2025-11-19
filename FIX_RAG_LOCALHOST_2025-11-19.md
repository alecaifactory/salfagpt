# Fix RAG References Not Showing - November 19, 2025

## Problem
S1-v2 agent in localhost (and production) was NOT showing document references at the end of responses. RAG was not working.

## Root Cause
**Two APIs were using the wrong method to find assigned documents:**

### 1. `/api/agents/[id]/context-stats` 
**Problem:** Looking for `assignedToAgents` array field in context_sources documents
**Reality:** We use `agent_sources` collection for assignments

### 2. `/api/conversations/[id]/context-sources-metadata` 
**Problem:** Only checking `assignedToAgents` field
**Reality:** Need to ALSO query `agent_sources` collection

## The Flow
```
1. Frontend loads agent → calls /api/agents/[id]/context-stats
2. API returns activeContextSourceIds (75 IDs)
3. Frontend creates minimal ContextSource objects
4. User sends message → frontend includes activeSourceIds in request
5. Backend (messages-stream.ts) uses activeSourceIds for RAG search
6. RAG returns relevant chunks with references
7. References shown at end of response
```

## What Was Broken
- Step 2: API returned 0 active sources (couldn't find assignments)
- Step 3: Frontend had empty contextSources array
- Step 4: activeSourceIds was empty array
- Step 5: No RAG search performed
- Result: Generic response, no references

## Fixes Applied

### Fix 1: `src/pages/api/agents/[id]/context-stats.ts`
```typescript
// BEFORE (WRONG):
const assignedCountSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('userId', '==', session.id)
  .where('assignedToAgents', 'array-contains', effectiveAgentId)  // ❌ Field doesn't exist
  .count()
  .get();

// AFTER (CORRECT):
const agentSourcesSnapshot = await firestore
  .collection('agent_sources')  // ✅ Use correct collection
  .where('agentId', '==', effectiveAgentId)
  .where('userId', '==', session.id)
  .count()
  .get();
```

### Fix 2: Load activeContextSourceIds from correct location
```typescript
// BEFORE (WRONG):
const contextDoc = await firestore
  .collection('conversation_context')  // ❌ Wrong collection
  .doc(effectiveAgentId)
  .get();

// AFTER (CORRECT):
const agentDoc = await firestore
  .collection(COLLECTIONS.CONVERSATIONS)  // ✅ Active IDs stored on agent document
  .doc(effectiveAgentId)
  .get();
```

### Fix 3: `src/pages/api/conversations/[id]/context-sources-metadata.ts`
Added query to `agent_sources` collection to supplement the existing check:

```typescript
// NEW: Query agent_sources collection
const agentSourcesSnapshot = await firestore
  .collection('agent_sources')
  .where('agentId', '==', effectiveAgentId)
  .get();

const assignedSourceIdsFromAgentSources = new Set(
  agentSourcesSnapshot.docs.map(doc => doc.data().sourceId)
);

// Add sources from agent_sources that aren't already in assignedSources
const additionalAssignedSources = allLoadedSources.filter((source: any) => 
  assignedSourceIdsFromAgentSources.has(source.id) && 
  !assignedSources.some((s: any) => s.id === source.id)
);
```

## Files Modified
1. `src/pages/api/agents/[id]/context-stats.ts` - Fixed to query agent_sources
2. `src/pages/api/conversations/[id]/context-sources-metadata.ts` - Added agent_sources query

## Testing in Localhost

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Log in as user
4. Select S1-v2 agent
5. Ask: "como solicito algo de la bodega?"
6. **Expected**: Response with references at the end showing document names and similarity scores
7. **Before Fix**: Generic response, no references
8. **After Fix**: Should show references from the 75 MAQ documents

## Deployment Steps

```bash
# Commit changes
git add src/pages/api/agents/[id]/context-stats.ts
git add src/pages/api/conversations/[id]/context-sources-metadata.ts
git commit -m "Fix: Query agent_sources collection in context-stats and metadata APIs"

# Deploy to production
gcloud run deploy cr-salfagpt-ai-ft-prod --source . --region us-central1 --project salfagpt
```

## Verification in Production

After deployment:
1. Refresh browser (Cmd+Shift+R)
2. Select S1-v2
3. Ask questions about warehouses/SAP/procedures
4. Should see references at end with:
   - Document names (e.g., "MAQ-LOG-CBO-I-001 Toma de Inventario Rev.05.pdf")
   - Similarity scores (e.g., "85% similarity")
   - Chunk previews

## Why This Matters

Without references:
- Users don't know if the answer is from their documents or generic AI knowledge
- No way to verify accuracy
- Can't trace back to source documents
- Defeats the purpose of RAG

With references:
- ✅ Users see which documents were used
- ✅ Can verify information in original docs
- ✅ Trust in answers increases
- ✅ RAG system working as intended

