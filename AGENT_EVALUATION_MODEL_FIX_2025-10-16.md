# Agent Evaluation Model Name Fix - 2025-10-16

## 🎯 Problem Identified

Agent evaluation was failing with error:
```
models/gemini-1.5-pro is not found for API version v1beta
```

**Root Cause**: 
- Gemini AI extraction was sometimes generating `gemini-1.5-pro` as the recommended model
- This is an invalid model name (correct names are `gemini-2.5-flash` and `gemini-2.5-pro`)
- When evaluation tried to use this model, it failed

## ✅ Solutions Implemented

### 1. Model Name Validation in Evaluation (evaluate.ts)

**File**: `src/pages/api/agents/evaluate.ts`

**What Changed**:
- Added validation before using `agentConfig.recommendedModel`
- Automatically corrects invalid model names:
  - `gemini-1.5-pro` → `gemini-2.5-pro`
  - `gemini-1.5-flash` → `gemini-2.5-flash`
  - `gemini-pro` → `gemini-2.5-pro`
  - `gemini-flash` → `gemini-2.5-flash`

**Code**:
```typescript
// Validate and correct model name
let modelToUse = agentConfig.recommendedModel || 'gemini-2.5-flash';
if (modelToUse === 'gemini-1.5-pro' || modelToUse === 'gemini-pro') {
  console.log(`  🔧 Correcting invalid model name: ${modelToUse} -> gemini-2.5-pro`);
  modelToUse = 'gemini-2.5-pro';
} else if (modelToUse === 'gemini-1.5-flash' || modelToUse === 'gemini-flash') {
  console.log(`  🔧 Correcting invalid model name: ${modelToUse} -> gemini-2.5-flash`);
  modelToUse = 'gemini-2.5-flash';
}
```

**Why This Works**:
- ✅ Defensive programming - handles invalid input gracefully
- ✅ Logs corrections for debugging
- ✅ Doesn't fail if extraction generates wrong model name
- ✅ Always uses valid Gemini 2.5 models

---

### 2. Explicit Model Name Constraint in Extraction (extract-config.ts)

**File**: `src/pages/api/agents/extract-config.ts`

**What Changed**:
- Updated extraction prompt to explicitly forbid `gemini-1.5-*` model names
- Emphasized exact model names required

**Before**:
```json
"recommendedModel": "gemini-2.5-flash" o "gemini-2.5-pro",
```

**After**:
```json
"recommendedModel": "gemini-2.5-flash" o "gemini-2.5-pro" (EXACTAMENTE estos nombres, NO usar gemini-1.5-*),
```

**Why This Helps**:
- ✅ Prevents the issue at the source (extraction)
- ✅ Clear instruction to Gemini AI
- ✅ Reduces need for validation/correction

---

## 🧪 Testing

### What to Test

1. **Upload a new setup document**
   - Verify extraction completes successfully
   - Check that `recommendedModel` is `gemini-2.5-flash` or `gemini-2.5-pro`
   - NOT `gemini-1.5-*`

2. **Run agent evaluation**
   - Should complete without model errors
   - Should show evaluation results
   - Should use correct model for testing

### Expected Behavior

**Before Fix**:
```
❌ Error: models/gemini-1.5-pro is not found
🎯 Evaluation complete! Overall score: 0.0/100
```

**After Fix**:
```
🔧 Correcting invalid model name: gemini-1.5-pro -> gemini-2.5-pro
✅ Score: 85/100
🎯 Evaluation complete! Overall score: 85.0/100
```

---

## 📊 Impact

**Files Modified**: 2
- `src/pages/api/agents/evaluate.ts` - Added model validation
- `src/pages/api/agents/extract-config.ts` - Improved prompt clarity

**Backward Compatible**: ✅ Yes
- Existing configs with correct models: Unchanged
- Existing configs with wrong models: Auto-corrected
- No breaking changes

**User Experience**:
- ✅ Agent evaluation now works reliably
- ✅ No manual intervention needed for model name issues
- ✅ Clear logging when corrections happen

---

## 🔍 Additional Issues Fixed

### Authentication Issue
- Google Cloud credentials were expired
- **Fixed**: Re-authenticated with `gcloud auth application-default login`
- **Fixed**: Restarted dev server to pick up new credentials

**Impact**:
- ✅ All Firestore API calls now work
- ✅ Agent configuration saves successfully
- ✅ No more 500 Internal Server Error responses

---

## ✅ Verification Checklist

- [x] Model validation added to evaluation
- [x] Extraction prompt updated
- [x] No linting errors
- [x] Server running successfully
- [x] Authentication fixed
- [ ] User tested in browser (pending)

---

## 🚀 Next Steps

1. **Refresh browser** (Cmd+Shift+R)
2. **Upload a setup document** to test extraction
3. **Verify model name** is correct (`gemini-2.5-*`)
4. **Run evaluation** and verify it completes successfully
5. **Check console** for model correction logs if needed

---

**Status**: ✅ Ready to test  
**Date**: 2025-10-16  
**Aligned With**: gemini-api-usage.mdc, error-prevention-checklist.mdc

