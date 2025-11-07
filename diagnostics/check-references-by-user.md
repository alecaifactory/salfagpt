# References Diagnostic Guide

## Issue
References are not showing for non-admin users (e.g., alecdickinson@gmail.com) but do show for admin users (e.g., alec@getaifactory.com).

## Affected Agents
- MAQSA Mantenimiento S2
- GOP GPT M3
- Potentially others

## Diagnostic Steps

### Step 1: Check if references are being generated
Open browser console for non-admin user and look for these logs when sending a message:

```
Expected logs during message send:
1. "🔍 BigQuery Agent Search starting..."
2. "✅ RAG: Using X relevant chunks"  
3. "📚 Built X references from RAG results"
4. "📚 References in completion: X"
```

**If you DON'T see these logs:**
- References are not being generated at all
- Check Step 2

**If you DO see these logs:**
- References are being generated
- Check Step 3

### Step 2: Check why references are not being generated

Look for these warning logs:
```
⚠️ No sources assigned to this agent
⚠️ RAG: No chunks found above similarity threshold
⚠️ Agent search returned 0 results
```

**Possible causes:**
1. **No context sources assigned to agent** for this user
   - Solution: Assign sources to the agent
   
2. **BigQuery search failing**
   - Check: "❌ BigQuery agent search failed:" error
   - Solution: Check BigQuery permissions/dataset
   
3. **Sources exist but no chunks indexed**
   - Check: "⚠️ No chunks exist"
   - Solution: Re-index documents

### Step 3: Check if references are being received by frontend

Look for this log in console:
```
📚 MessageRenderer received references: X
```

**If you DON'T see this log:**
- References are generated but not making it to the Message object
- Check Step 4

**If you DO see this log but references still don't show:**
- References are there but not rendering
- Check Step 5

### Step 4: Check if references are in the SSE completion event

Look for this log:
```
📚 References in completion: X
```

**If this shows 0:**
- References are being built but not included in the completion event
- This is a backend bug

**If this shows > 0:**
- References are sent but not being set on the message
- This is a frontend state management bug

### Step 5: Check if MessageRenderer is receiving the references prop

Add this temporary debugging code to MessageRenderer.tsx:

```typescript
// At top of MessageRenderer component (line 28)
console.log('🔍 MessageRenderer render:', {
  hasContent: !!content,
  contentLength: content?.length,
  referencesCount: references?.length || 0,
  references: references
});
```

**If references is undefined or empty:**
- The prop is not being passed correctly
- Check the MessageRenderer call in ChatInterfaceWorking.tsx

## Quick Test

For admin user (alec@getaifactory.com):
1. Open browser console
2. Ask a question
3. Look for: `📚 MessageRenderer received references: X` (should be > 0)
4. Screenshot the console logs

For non-admin user (alecdickinson@gmail.com):
1. Open browser console (preferably in incognito window)
2. Ask THE SAME question to the SAME agent
3. Look for: `📚 MessageRenderer received references: X` (check if 0 or > 0)
4. Screenshot the console logs

## Expected Root Cause

Based on code analysis, the most likely causes are:

### Hypothesis 1: No context sources assigned to agent for non-admin user
The agent might have been created by admin user, and context sources are only assigned to the admin's userId, not visible to other users.

**Check:**
```javascript
// In browser console for non-admin user:
fetch('/api/agents/AGENT_ID/context-stats')
  .then(r => r.json())
  .then(data => console.log('Context stats:', data))
```

**Expected issue:**
- activeCount: 0 (no sources)
- totalCount: 0 (no sources)

**Solution:**
- Admin needs to share context sources with non-admin users
- OR non-admin users need to upload their own context sources to the agent

### Hypothesis 2: BigQuery search failing for non-admin users
The BigQuery dataset might only be accessible to admin user's credentials.

**Check console logs for:**
```
❌ BigQuery agent search failed:
```

**Solution:**
- Check BigQuery permissions
- Ensure dataset is accessible to all authenticated users

### Hypothesis 3: References are generated but not saved
The message is being saved without references due to a conditional that checks user role.

**Check in backend logs:**
```
📚 Built X references from RAG results
```
vs
```
💬 Message created from localhost: msg-XXX
```

**Solution:**
- Ensure addMessage function is being called with references parameter

## Fix Strategy

Once root cause is identified:

### If Hypothesis 1 (No sources):
- Share context sources from admin to other users
- OR allow users to upload their own sources

### If Hypothesis 2 (BigQuery permissions):
- Grant BigQuery dataViewer role to service account
- OR fix fallback to Firestore search

### If Hypothesis 3 (References not saved):
- Review backend code for conditional logic
- Ensure references are always passed to addMessage

## Files to Check

1. `src/pages/api/conversations/[id]/messages-stream.ts` - Line 614-632 (where references are sent)
2. `src/components/ChatInterfaceWorking.tsx` - Line 2040 (where references are set)
3. `src/components/MessageRenderer.tsx` - Line 352 (where references are rendered)
4. `src/lib/firestore.ts` - Line 499 (where references are saved)

## Next Steps

1. Run the Quick Test above
2. Share console screenshots from both users
3. Identify which hypothesis matches the logs
4. Apply the appropriate fix

