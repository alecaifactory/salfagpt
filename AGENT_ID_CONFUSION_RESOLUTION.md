# Agent ID Confusion - Resolution

## The Problem

There are **TWO different agents** with confusing names:

### Agent 1: Document ID = `TestApiUpload_S001`
- **Firestore Document ID**: `TestApiUpload_S001` 
- **Display Name**: `Test API Upload S001`
- **Has**: 18 documents (from CLI uploads) ✅
- **Status**: Fully functional
- **You see this agent**: NO (not currently viewing in UI)

### Agent 2: Document ID = `rzEqb17ZwSjk99bZHbTv`  
- **Firestore Document ID**: `rzEqb17ZwSjk99bZHbTv`
- **Display Name**: `TestApiUpload_S001` (confusing!)
- **Has**: 0 documents ❌
- **Status**: Just fixed structure, but no documents assigned
- **You see this agent**: YES ✅ (this is what you're viewing in UI)

## Why The Confusion

The agent you're viewing in the UI (`rzEqb17ZwSjk99bZHbTv`) has the **NAME** "TestApiUpload_S001", but its **document ID** is `rzEqb17ZwSjk99bZHbTv`.

When we uploaded via CLI using `--agent=TestApiUpload_S001`, the documents went to the agent whose **document ID** is literally `TestApiUpload_S001` (not the one named that).

## Solution Options

### Option 1: View the Correct Agent (Recommended)
**Find and open the agent with document ID `TestApiUpload_S001` in your UI.**

This agent already has all 18 documents and is working correctly.

### Option 2: Re-Upload to Current Agent
**Upload documents to the agent you're currently viewing:**

```bash
cd /Users/alec/salfagpt

npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=rzEqb17ZwSjk99bZHbTv \
  --user=usr_uhwqffaqag1wrryd82tw \
  --email=alec@getaifactory.com
```

Note: Use `--agent=rzEqb17ZwSjk99bZHbTv` (the document ID, not the name)

### Option 3: Rename for Clarity
**Rename one of the agents to avoid confusion:**

```typescript
// Rename rzEqb17ZwSjk99bZHbTv to something different
await firestore.collection('conversations').doc('rzEqb17ZwSjk99bZHbTv').update({
  name: 'Test Upload Agent V2',
  title: 'Test Upload Agent V2',
  agentName: 'rzEqb17ZwSjk99bZHbTv',
});
```

## Key Learnings

1. **Agent ID vs Agent Name**: 
   - Document ID (`rzEqb17ZwSjk99bZHbTv`) is what identifies the agent in Firestore
   - Display name (`TestApiUpload_S001`) is just a label for humans
   
2. **CLI Upload Argument**:
   - `--agent=VALUE` expects the **Firestore document ID**, not the display name
   
3. **Finding Agents in UI**:
   - Agents are listed by their display name/title
   - But operations use the document ID

## Recommended Action

**Option 1 is fastest**: Just find the agent with ID `TestApiUpload_S001` in your agent list. It should be there and have 18 documents already working.

To help find it, I can create a script that lists all your agents with their IDs and document counts.

---

**Date**: 2025-11-19  
**Status**: Clarified, awaiting user decision

