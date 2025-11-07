# Testing Guide: References Fix for All Users

## 🎯 What We're Testing

Verifying that non-admin users now see reference citations at the bottom of AI responses, just like admin users.

## ✅ Pre-Test Verification

The diagnostic script confirmed:
- ✅ MAQSA agent has 117 context sources
- ✅ All sources are properly assigned to agent
- ✅ Sources are indexed (chunks exist for RAG)
- ✅ Agent is shared
- ✅ Fix has been applied and committed

## 🧪 Test Procedure

### Test 1: Admin User (Regression Test - Should Still Work)

1. **Open browser** (regular window)
2. **Navigate to:** http://localhost:3000/chat
3. **Login as:** alec@getaifactory.com
4. **Select agent:** MAQSA Mantenimiento S2
5. **Open browser console** (F12 or Cmd+Option+I)
6. **Ask question:** "¿Cómo cambio el filtro de aire de un motor Cummins 6bt5.9?"

**Expected Result:**
```
Console should show:
🔍 BigQuery Agent Search starting...
  Current User: 114671162830729001607
  🔑 Effective owner for context: 114671162830729001607 (own agent)
  🔍 Searching Firestore for sources assigned to agent...
  ✅ SUCCESS! Found 117 sources with effectiveUserId
  📊 FINAL RESULT: 117 sources will be used for RAG search
✅ RAG: Using 8 relevant chunks
📚 Built X references from RAG results
📚 MessageRenderer received references: X
```

**UI should show:**
- ✅ AI response appears
- ✅ Reference badges [1] [2] [3] etc. appear in the text
- ✅ "📚 Referencias utilizadas" section appears at bottom
- ✅ Clicking expand shows list of references
- ✅ Clicking reference badge opens ReferencePanel

---

### Test 2: Non-Admin User (THE FIX - Should Now Work)

1. **Open NEW incognito window** (Cmd+Shift+N)
2. **Navigate to:** http://localhost:3000/chat
3. **Login as:** alecdickinson@gmail.com
4. **Select agent:** MAQSA Mantenimiento S2
5. **Open browser console** (F12 or Cmd+Option+I)
6. **Ask THE SAME question:** "¿Cómo cambio el filtro de aire de un motor Cummins 6bt5.9?"

**Expected Result:**
```
Console should show:
🔍 BigQuery Agent Search starting...
  Current User: 116745562509015715931
  🔑 Effective owner for context: 116745562509015715931 (own agent)
  🔍 Searching Firestore for sources assigned to agent...
     Step 1: Trying with effectiveUserId: 116745562509015715931
     Step 1 result: 0 sources found
     Step 2: No sources found with effectiveUserId, checking agent owner...
     Agent found: owner userId = 114671162830729001607
     Comparing: effectiveUserId (116745562509015715931) vs agent.userId (114671162830729001607)
     Are they different? true
  📚 Trying agent owner's sources: 114671162830729001607
  ✅ SUCCESS! Found 117 sources from agent owner - references will be generated
  📊 FINAL RESULT: 117 sources will be used for RAG search
✅ RAG: Using 8 relevant chunks
📚 Built X references from RAG results
📚 MessageRenderer received references: X
```

**UI should NOW show:**
- ✅ AI response appears
- ✅ Reference badges [1] [2] [3] etc. appear in the text (THIS IS THE FIX!)
- ✅ "📚 Referencias utilizadas" section appears at bottom (THIS IS THE FIX!)
- ✅ Clicking expand shows list of references
- ✅ Clicking reference badge opens ReferencePanel

---

### Test 3: Repeat for GOP GPT M3

Repeat both tests above for the "GOP GPT M3" agent with this question:
"¿Qué procedimientos están asociados al plan de calidad?"

---

## 🔍 Key Console Logs to Look For

### ✅ Success Indicators (what you WANT to see):

For **non-admin user**, the critical log is:
```
📚 Trying agent owner's sources: 114671162830729001607
     (This allows references to work even if agent is not explicitly shared)
✅ SUCCESS! Found 117 sources from agent owner - references will be generated
```

This confirms the fallback mechanism is working!

### ❌ Failure Indicators (what you DON'T want to see):

```
⚠️ No sources assigned to this agent
⚠️ PROBLEM: No sources found even from agent owner
⚠️ RAG: No chunks found above similarity threshold
```

If you see these, it means the fallback failed.

---

## 📊 Comparison Matrix

| Feature | Admin User (Before) | Non-Admin (Before) | Admin User (After) | Non-Admin (After) |
|---------|--------------------|--------------------|--------------------|--------------------|
| References shown | ✅ YES | ❌ NO | ✅ YES | ✅ YES (FIXED!) |
| Reference badges clickable | ✅ YES | N/A | ✅ YES | ✅ YES (FIXED!) |
| ReferencePanel opens | ✅ YES | N/A | ✅ YES | ✅ YES (FIXED!) |
| Sources used for RAG | Admin's sources | None | Admin's sources | Admin's sources (via fallback) |

---

## 🐛 Troubleshooting

### If references STILL don't show for non-admin user:

1. **Check console logs carefully** - Look for the detailed logs I added
2. **Verify the fallback is executing:**
   - Should see "Step 2: No sources found with effectiveUserId"
   - Should see "Trying agent owner's sources"
   - Should see "Found X sources from owner"

3. **If fallback is NOT executing:**
   - effectiveUserId might be returning the same as current user
   - Agent might not be found in database
   - Share the console logs with me

4. **If fallback executes but finds 0 sources:**
   - AssignedToAgents field might not include this agentId
   - Run: `npx tsx scripts/diagnose-maqsa-references.ts` again
   - Check if sources actually have agentId in assignedToAgents array

5. **If sources found but no references shown:**
   - RAG search might be failing
   - Check for BigQuery errors in console
   - Check if chunks exist: look for "Sources are indexed" log

---

## 📸 Screenshot Checklist

Please take screenshots showing:

1. **Admin user response** (for comparison/baseline)
   - Full AI response with references section visible

2. **Non-admin user response** (the fix)
   - Full AI response with references section visible
   - Console logs showing the fallback mechanism

3. **Console logs** for non-admin user showing:
   - "Found X sources from agent owner"
   - "References will be generated"
   - "MessageRenderer received references: X"

---

## ✅ Success Criteria

The fix is successful if:
- ✅ Admin user still sees references (no regression)
- ✅ Non-admin user NOW sees references (issue fixed)
- ✅ Console shows fallback mechanism executed
- ✅ References are clickable
- ✅ No errors in console

The fix needs more work if:
- ❌ Non-admin still doesn't see references
- ❌ Admin stops seeing references (regression)
- ❌ Errors appear in console
- ❌ Fallback logs don't appear

---

## 🚀 Next Steps After Testing

### If tests PASS:
1. ✅ Mark as verified
2. ✅ Deploy to production
3. ✅ Monitor for any issues
4. ✅ Update user documentation

### If tests FAIL:
1. Share console logs (full output)
2. Share screenshots
3. Run diagnostic scripts
4. We'll debug further

---

**Current Status:** ✅ Fix committed, server running, ready for testing  
**Dev Server:** http://localhost:3000/chat  
**Test Users:**
- Admin: alec@getaifactory.com
- Non-Admin: alecdickinson@gmail.com

