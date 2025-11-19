# CLI Agent Fix Summary

## Problem
CLI-created agent `TestApiUpload_S001` had 18 documents in the database, but the UI showed "0 documentos disponibles".

## Root Cause Analysis

### Comparison with Working Agent
We compared `TestApiUpload_S001` (broken) with `AjtQZEIMQvFnPRJRjl4y` (GESTION BODEGAS GPT - working).

### Missing Critical Fields

The CLI-created agent was **missing these essential fields** that all UI-compatible agents must have:

1. ✅ **`agentName`**: Must be set (was `undefined`)
2. ✅ **`title`**: Friendly display name (was `undefined`)
3. ✅ **`organizationId`**: Required for multi-org support (was `undefined`)
4. ✅ **`messageCount`**: Initialize to 0 (was `undefined`)
5. ✅ **`version`**: Schema version tracking (was missing)
6. ✅ **`source`**: Track creation source (was missing)

### Additional Issues
- **`activeContextSourceIds`** was out of sync (had 1 instead of 18 document IDs)
- **`userId`** was using Google numeric ID instead of hash ID

## Fixes Applied

### 1. Fixed Agent Structure (`fix-test-agent-structure.ts`)

Added all missing critical fields:

```typescript
const updates = {
  agentName: 'TestApiUpload_S001',
  title: 'Test Upload Agent (S001)',
  organizationId: 'getaifactory.com',
  messageCount: 0,
  version: 1,
  source: 'cli',
  updatedAt: new Date(),
};
```

### 2. Synchronized Context Sources (`fix-agent-context.ts`)

Updated `activeContextSourceIds` to include all 18 documents:
- Before: 1 document
- After: 18 documents ✅

### 3. Updated Agent Creation Script (`create-test-agent.ts`)

Modified the script to create agents with the correct structure from the start:

```typescript
await firestore.collection('conversations').doc(agentId).set({
  id: agentId,
  name: 'Test API Upload S001',
  // ✅ CRITICAL FIELDS for UI compatibility
  agentName: agentId,
  title: 'Test Upload Agent (S001)',
  isAgent: true,
  userId, // ✅ Hash ID (primary)
  organizationId: 'getaifactory.com',
  messageCount: 0,
  version: 1,
  source: 'cli',
  // ... other fields
});
```

## Key Learnings

### Required Agent Fields for UI Compatibility

All agents created via CLI or API must include:

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `id` | string | ✅ | `"TestApiUpload_S001"` |
| `agentName` | string | ✅ | `"TestApiUpload_S001"` |
| `title` | string | ✅ | `"Test Upload Agent (S001)"` |
| `isAgent` | boolean | ✅ | `true` |
| `userId` | string | ✅ | `"usr_uhwqffaqag1wrryd82tw"` (hash ID) |
| `organizationId` | string | ✅ | `"getaifactory.com"` |
| `messageCount` | number | ✅ | `0` |
| `version` | number | ✅ | `1` |
| `source` | string | ✅ | `"cli"` or `"webapp"` |
| `createdAt` | Timestamp | ✅ | `new Date()` |
| `updatedAt` | Timestamp | ✅ | `new Date()` |
| `activeContextSourceIds` | string[] | ✅ | `[]` (initialize empty) |

### User ID Best Practices

- **Primary ID**: Use hash ID (e.g., `usr_uhwqffaqag1wrryd82tw`)
- **Legacy Support**: Include `googleUserId` as optional reference
- **Consistency**: Use hash ID for all Firestore queries and document attribution

## Verification

After applying fixes:

```bash
npx tsx scripts/compare-agents.ts
```

### Before Fix
```
TestApiUpload_S001:
  agentName: MISSING ❌
  title: MISSING ❌
  organizationId: MISSING ❌
  messageCount: MISSING ❌
  activeContextSourceIds: 1 documents ❌
```

### After Fix
```
TestApiUpload_S001:
  agentName: TestApiUpload_S001 ✅
  title: Test Upload Agent (S001) ✅
  organizationId: getaifactory.com ✅
  messageCount: 0 ✅
  activeContextSourceIds: 18 documents ✅
```

## Testing Checklist

- [x] Agent appears in UI agent list
- [x] Agent shows correct document count (18)
- [x] Documents load when clicking "Cargar Documentos"
- [x] RAG search works (embeddings in `document_chunks`)
- [x] Documents can be viewed individually
- [x] New agents created with correct structure

## Files Modified

1. `/scripts/fix-test-agent-structure.ts` - New script to fix existing agents
2. `/scripts/create-test-agent.ts` - Updated to create compliant agents
3. `/scripts/compare-agents.ts` - New diagnostic script
4. `/scripts/fix-agent-context.ts` - Existing script for syncing contexts

## Next Steps for Production

When creating agents programmatically:

1. **Always include all required fields** (see table above)
2. **Use hash IDs** for `userId` field
3. **Set `organizationId`** for multi-tenant support
4. **Initialize `activeContextSourceIds`** as empty array
5. **Sync `activeContextSourceIds`** when assigning documents

## Commands Reference

```bash
# Compare working vs broken agent
npx tsx scripts/compare-agents.ts

# Fix existing agent structure
npx tsx scripts/fix-test-agent-structure.ts

# Sync activeContextSourceIds
npx tsx scripts/fix-agent-context.ts TestApiUpload_S001

# Create new compliant agent
npx tsx scripts/create-test-agent.ts
```

---

**Date**: 2025-11-19  
**Status**: ✅ RESOLVED  
**Impact**: All CLI-created agents now compatible with UI

