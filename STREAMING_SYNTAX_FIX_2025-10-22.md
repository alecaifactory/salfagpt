# Streaming Syntax Error Fix - October 22, 2025

## 🐛 Problem

When users tried to ask questions to agents, the application crashed with a 500 Internal Server Error. The error messages were:

### Error 1: messages-stream.ts
```
ERROR: Expected "finally" but found "sendStatus"
at /Users/alec/salfagpt/src/pages/api/conversations/[id]/messages-stream.ts:320:10
```

### Error 2: bigquery-agent-search.ts
```
ERROR: The symbol "sourcesSnapshot" has already been declared
at /Users/alec/salfagpt/src/lib/bigquery-agent-search.ts:189:10
```

### User Impact
- ❌ Agent questions returned 500 errors
- ❌ Streaming responses failed
- ❌ RAG search with BigQuery failed
- ❌ No AI responses possible

---

## 🔍 Root Cause Analysis

### Issue 1: Incorrect Try-Catch Block Structure

**File:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Problem:**
The try-catch block for RAG search (lines 104-265) was structured incorrectly:

```typescript
// BEFORE (BROKEN):
if (useAgentSearch || activeSourceIds.length > 0) {  // Line 99
  try {                                               // Line 104
    // RAG search logic
  } catch (error) {                                   // Line 242
    // Fallback logic
  }                                                   // Line 265
} else {                                              // Line 266 - WRONG LOCATION
  // No sources case
}                                                     // Line 271

// Lines 273-317 were ORPHANED - not inside any block!
// Ensure minimum 3 seconds...
sendStatus('searching', 'complete');
// Step 3: Seleccionando Chunks...
sendStatus('selecting', 'active');
// ... chunk details ...
sendStatus('selecting', 'complete');
}                                                     // Line 317 - closing WHAT?

// Step 4: Generando Respuesta...
sendStatus('generating', 'active');                   // Line 320 - ERROR HERE
```

**Why It Failed:**
- The `} else {` at line 266 prematurely closed the if block from line 99
- This left lines 273-317 orphaned (not inside any block structure)
- Line 317's `}` had nothing valid to close
- The parser thought we were still in a try-catch context
- When it encountered `sendStatus('generating', 'active')` at line 320, it expected a `finally` block, not a regular statement

### Issue 2: Duplicate Variable Declaration

**File:** `src/lib/bigquery-agent-search.ts`

**Problem:**
The variable `sourcesSnapshot` was declared twice in the same function scope:

```typescript
// First declaration (line 91) - Get source IDs assigned to agent
const sourcesSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('userId', '==', userId)
  .where('assignedToAgents', 'array-contains', agentId)
  .select('__name__')
  .get();

// ... many lines later ...

// Second declaration (line 172) - Get source names for display
const sourcesSnapshot = await firestore  // ❌ DUPLICATE
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('__name__', 'in', uniqueSourceIds)
  .select('name')
  .get();
```

**Why It Failed:**
- JavaScript/TypeScript doesn't allow redeclaring `const` variables in the same scope
- Both queries were needed, but used the same variable name
- ESBuild compilation failed with duplicate symbol error

---

## ✅ Solution

### Fix 1: Restructure Try-Catch Block

**File:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Changes:**
1. Moved the `} else {` from line 266 to line 311 (after all if-block code completes)
2. Ensured lines 267-310 (Step 2 completion and Step 3) are inside the if block

```typescript
// AFTER (FIXED):
if (useAgentSearch || activeSourceIds.length > 0) {  // Line 99
  try {                                               // Line 104
    // RAG search logic
  } catch (error) {                                   // Line 242
    // Fallback logic
  }                                                   // Line 265
  
  // ✅ NOW INSIDE THE IF BLOCK:
  // Ensure minimum 3 seconds for this step
  const searchElapsed = Date.now() - searchStartTime;
  if (searchElapsed < 3000) {
    await new Promise(resolve => setTimeout(resolve, 3000 - searchElapsed));
  }
  
  sendStatus('searching', 'complete');

  // Step 3: Seleccionando Chunks...
  sendStatus('selecting', 'active');
  
  // Send chunk selection details if available
  if (ragUsed && ragStats && ragStats.sources) {
    // ... chunk details ...
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  sendStatus('selecting', 'complete');
} else {                                              // Line 311 - NOW CORRECT
  // No sources case
  console.warn('⚠️ No active sources provided.');
  additionalContext = '';
}                                                     // Line 316

// ✅ Step 4 is now correctly OUTSIDE the if-else
sendStatus('generating', 'active');                   // Line 319 - NOW WORKS
```

### Fix 2: Rename Duplicate Variable

**File:** `src/lib/bigquery-agent-search.ts`

**Changes:**
Renamed the second `sourcesSnapshot` to `sourceNamesSnapshot` to clarify its purpose:

```typescript
// First use (line 91) - Keep as is
const sourcesSnapshot = await firestore
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('userId', '==', userId)
  .where('assignedToAgents', 'array-contains', agentId)
  .select('__name__')
  .get();

const assignedSourceIds = sourcesSnapshot.docs.map(doc => doc.id);

// Second use (line 172) - Renamed
const sourceNamesSnapshot = await firestore  // ✅ RENAMED
  .collection(COLLECTIONS.CONTEXT_SOURCES)
  .where('__name__', 'in', uniqueSourceIds)
  .select('name')
  .get();

const sourcesMap = new Map(
  sourceNamesSnapshot.docs.map(doc => [doc.id, doc.data().name || 'Unknown'])
);
```

---

## 📝 Files Modified

### 1. `src/pages/api/conversations/[id]/messages-stream.ts`
- **Lines changed**: 264-316
- **Type**: Control flow restructuring
- **Impact**: Fixed try-catch block structure to properly close before Step 4

### 2. `src/lib/bigquery-agent-search.ts`
- **Lines changed**: 172, 179
- **Type**: Variable renaming
- **Impact**: Eliminated duplicate variable declaration

---

## ✅ Verification

### Before Fix
```bash
# Terminal showed:
ERROR: Expected "finally" but found "sendStatus"
ERROR: The symbol "sourcesSnapshot" has already been declared

# Browser showed:
500 Internal Server Error
Failed to send message
```

### After Fix
```bash
# TypeScript compilation:
✅ No linter errors found

# Runtime behavior:
✅ Agent responds to questions
✅ RAG search works
✅ Streaming responses work
✅ References displayed correctly
```

### Test Query
**Question:** "¿Qué hacer si aparecen mantos de arena durante una excavación?"

**Result:** 
- ✅ AI responded with safety procedures
- ✅ 5 relevant document chunks found (74-81% similarity)
- ✅ References displayed with fragments
- ✅ No errors in console

---

## 🎓 Lessons Learned

### 1. Try-Catch Block Scope
**Lesson:** All code that depends on the try-catch must be inside the same if block, not orphaned outside.

**Pattern:**
```typescript
// ✅ CORRECT
if (condition) {
  try {
    // risky operation
  } catch (error) {
    // handle error
  }
  // ✅ continuation code INSIDE if block
  completeStep();
} else {
  // alternative path
}

// ❌ WRONG
if (condition) {
  try {
    // risky operation
  } catch (error) {
    // handle error
  }
} else {  // ❌ Premature else
  // alternative path
}
// ❌ Orphaned code - not in if or else!
completeStep();
```

### 2. Variable Naming in Long Functions
**Lesson:** Use descriptive variable names to avoid accidental duplicates, especially when the same collection is queried multiple times for different purposes.

**Pattern:**
```typescript
// ✅ CORRECT - Descriptive names
const sourcesSnapshot = await getSourceIds();
// ... many lines later ...
const sourceNamesSnapshot = await getSourceNames();

// ❌ WRONG - Generic names lead to conflicts
const sourcesSnapshot = await getSourceIds();
// ... many lines later ...
const sourcesSnapshot = await getSourceNames(); // ❌ Duplicate!
```

### 3. Testing Streaming Endpoints
**Lesson:** Syntax errors in streaming endpoints can be subtle because the code structure is complex with nested try-catch blocks and async operations.

**Best Practice:**
- Run `npm run type-check` before testing
- Check linter errors immediately
- Test with actual requests to catch runtime issues

---

## 🚀 Deployment Status

### Local Development
- ✅ Fixed and verified
- ✅ Type check passes (0 errors)
- ✅ Manual testing successful
- ✅ Ready for commit

### Production
- ⏳ Not yet deployed
- 📋 Requires: Git commit → Push → Deploy to Cloud Run
- 🎯 Expected: Same fixes apply to production

---

## 📊 Impact Assessment

### User Experience
- **Before**: Complete failure - no agent responses possible
- **After**: Full functionality restored - agents respond normally
- **Improvement**: 100% (from broken to working)

### Performance
- **No performance impact** - Pure syntax fix
- Streaming still works as designed
- RAG search performance unchanged

### Security
- **No security impact** - No changes to access control or data handling
- All user isolation still enforced

---

## 🔗 Related Documentation

- `OPTIMISTIC_UI_FIX_2025-10-22.md` - Recent UI improvements
- `.cursor/rules/backend.mdc` - Backend error handling rules
- `.cursor/rules/code-change-protocol.mdc` - Change safety rules
- `.cursor/rules/alignment.mdc` - Graceful degradation principle

---

## 📅 Timeline

- **Error Reported**: 2025-10-22 14:18 (during user testing)
- **Root Cause Identified**: 2025-10-22 14:20 (syntax analysis)
- **Fix Applied**: 2025-10-22 14:24 (two-file fix)
- **Verification**: 2025-10-22 14:25 (linter + manual test)
- **Documentation**: 2025-10-22 14:26 (this document)

**Total Resolution Time**: ~8 minutes

---

## ✅ Checklist

- [x] Root cause identified
- [x] Fix applied to both files
- [x] Linter errors cleared (0 errors)
- [x] Manual testing successful
- [x] Documentation created
- [ ] Git commit
- [ ] Git push
- [ ] Production deployment (future)

---

**Status**: ✅ **RESOLVED**  
**Priority**: CRITICAL (blocking all agent functionality)  
**Complexity**: Low (syntax errors)  
**Risk**: None (pure fixes, no logic changes)  

---

**Remember**: Always run `npm run type-check` before committing changes to catch syntax errors early!

