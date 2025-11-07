# Fix: References Not Showing for Non-Admin Users

## Problem
References are not displaying for non-admin users (e.g., alecdickinson@gmail.com) when using agents like "MAQSA Mantenimiento S2" and "GOP GPT M3", but they do show for admin users (e.g., alec@getaifactory.com).

## Root Cause Analysis

After code investigation, the issue is NOT in the frontend rendering or API logic. Both are working correctly:
- ✅ References are properly saved to Firestore (src/lib/firestore.ts:499)
- ✅ References are properly loaded from Firestore (src/lib/firestore.ts:530-533)
- ✅ References are properly passed to MessageRenderer (ChatInterfaceWorking.tsx:4706)
- ✅ References are properly rendered in UI (MessageRenderer.tsx:352-462)

**The actual issue is:**

When a non-admin user sends a message to a shared agent, the RAG search looks for context sources with:
```typescript
.where('userId', '==', effectiveUserId)
.where('assignedToAgents', 'array-contains', agentId)
```

If `effectiveUserId` returns the **current user's ID** instead of the **original owner's ID**, no sources are found → No RAG results → No references generated.

## Solution

### Option 1: Ensure Agent Sharing is Configured (Recommended)

Make sure the agents are properly shared so `getEffectiveOwnerForContext` returns the correct owner ID.

#### Steps:

1. **Check Current Sharing Status**
```bash
npx tsx scripts/check-agent-sharing.ts
```

2. **If agents are not shared, share them**

For each agent (MAQSA Mantenimiento S2, GOP GPT M3):

```typescript
// Run this in browser console as admin user or create a script
const agentId = 'AGENT_ID_HERE'; // Get from Firestore

await fetch('/api/agents/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: agentId,
    sharedWithType: 'domain',
    sharedWithId: 'getaifactory.com', // Share with everyone at domain
    accessLevel: 'view', // Or 'edit' if you want users to modify
    sharedBy: 'USER_ID_OF_ADMIN'
  })
});
```

3. **Verify sharing worked**
```bash
npx tsx scripts/check-agent-sharing.ts
```

Should now show shares for each agent.

### Option 2: Fix getEffectiveOwnerForContext to Handle Non-Shared Agents

If agents aren't shared but you still want references to work, modify the search logic:

#### File: `src/lib/bigquery-agent-search.ts`

Change lines 123-134 to:

```typescript
// Fallback to Firestore (always for dev, or if BigQuery failed)
if (assignedSourceIds.length === 0) {
  // ✅ FIX: Try with effectiveUserId first, then try with agent owner if that fails
  let sourcesSnapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .where('userId', '==', effectiveUserId)
    .where('assignedToAgents', 'array-contains', agentId)
    .select('__name__')
    .get();
  
  // If no sources found with effectiveUserId, try with agent's original owner
  if (sourcesSnapshot.empty) {
    const agent = await getConversation(agentId);
    if (agent && agent.userId !== effectiveUserId) {
      console.log(`  ℹ️ No sources found for effectiveUserId, trying agent owner: ${agent.userId}`);
      sourcesSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('userId', '==', agent.userId) // ✅ Use agent owner's userId
        .where('assignedToAgents', 'array-contains', agentId)
        .select('__name__')
        .get();
      
      console.log(`  ✓ Found ${sourcesSnapshot.size} sources from agent owner`);
    }
  }
  
  assignedSourceIds = sourcesSnapshot.docs.map(doc => doc.id);
  console.log(`  ✓ Found ${assignedSourceIds.length} sources from Firestore (${Date.now() - startSources}ms)`);
}
```

### Option 3: Universal Context Sources (Not Recommended)

Mark context sources as available to all users in the domain (not recommended for privacy/security).

## Recommended Fix

**Use Option 1** (Agent Sharing) because:
1. It's the correct architectural pattern
2. It maintains security and privacy
3. It uses existing sharing infrastructure
4. It allows proper access control

## Quick Fix for Testing

To quickly verify this is the issue and test a fix:

1. **As admin user**, upload a test PDF to "MAQSA Mantenimiento S2" agent
2. **As admin user**, send a question and verify references show
3. **As non-admin user**, send THE SAME question to the SAME agent
4. Check if references show

If references still don't show for non-admin user:
- Run `npx tsx scripts/check-message-references.ts CONVERSATION_ID`
- Check if the non-admin user's messages have references in Firestore
- If they don't have references, it confirms the RAG search is failing

## Testing Checklist

After applying the fix:

- [ ] Run `npx tsx scripts/check-agent-sharing.ts`
- [ ] Verify agents show as shared
- [ ] Login as non-admin user (alecdickinson@gmail.com)
- [ ] Send question to MAQSA Mantenimiento S2
- [ ] Check browser console for "📚 MessageRenderer received references: X" where X > 0
- [ ] Verify references section shows at bottom of response
- [ ] Click on reference badge to verify ReferencePanel opens
- [ ] Repeat for GOP GPT M3
- [ ] Verify all other agents with context sources

## Expected Console Output After Fix

For non-admin user sending message:

```
🔍 BigQuery Agent Search starting...
  Current User: USER_ID_NON_ADMIN
  Agent: AGENT_ID
  🔑 Effective owner for context: ADMIN_USER_ID (shared agent)
  ✓ Found X sources from Firestore
✅ RAG: Using Y relevant chunks
📚 Built Y references from RAG results
...
📚 MessageRenderer received references: Y
```

The key indicator is: `Effective owner for context: ADMIN_USER_ID (shared agent)`

This confirms that the non-admin user is correctly using the admin's context sources.

## Preventive Measures

To prevent this issue in the future:

1. **Always share agents** when creating them for team use
2. **Document sharing requirements** in agent creation flow
3. **Add UI indicator** when agent is private vs shared
4. **Show warning** if user tries to use an agent without context access

## Files Modified

If implementing Option 2 (code fix):
- `src/lib/bigquery-agent-search.ts` - Lines 123-134

If implementing Option 1 (sharing):
- No code changes needed
- Just configuration in Firestore

## Additional Notes

The code architecture is actually correct and secure:
- It properly separates user data by userId
- It properly handles shared agents with `getEffectiveOwnerForContext`
- It properly generates and saves references

The issue is just that **sharing was not configured** for these specific agents, so non-admin users can't access the owner's context sources, and therefore get no RAG results, and therefore no references.

