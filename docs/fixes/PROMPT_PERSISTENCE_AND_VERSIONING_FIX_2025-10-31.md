# Prompt Persistence & Versioning Fix - 2025-10-31

## 🐛 Issues Fixed

### Issue 1: Enhanced Prompt Not Persisting in UI
**Symptom:** After enhancing prompt with AI (4730 chars), reopening agent config shows old prompt (193 chars)

**Root Cause:** Race condition between Firestore save and UI reload
- Enhanced prompt saves to Firestore (~1.5s write time)
- Local state updates immediately
- Modal reopens
- `loadPromptsForAgent()` called on modal reopen
- Firestore read completes **before** write propagates
- Old value (193) overwrites new value (4730)

**Fix Applied:**
```typescript
// Added save time tracker
const [lastPromptSaveTime, setLastPromptSaveTime] = useState<number>(0);

// Mark time when saving
setLastPromptSaveTime(Date.now());

// Skip reload if saved within last 5 seconds
const timeSinceLastSave = Date.now() - lastPromptSaveTime;
if (timeSinceLastSave < 5000 && lastPromptSaveTime > 0) {
  console.log('⏭️ Skipping reload - recently saved');
  return; // Use cached state
}
```

**Files Modified:**
- `src/components/ChatInterfaceWorking.tsx`:
  - Line 312: Added `lastPromptSaveTime` state
  - Line 2618: Set timestamp on save
  - Line 2694-2699: Check cache before reload
  - Line 2637-2655: Optimized enhancement flow

---

### Issue 2: Version History Failed to Load
**Symptom:** 
```
Error: 9 FAILED_PRECONDITION: The query requires an index
GET /api/agents/.../prompt-versions returns 500
```

**Root Cause:** Missing Firestore composite index for `agent_prompt_versions` collection

**Query Requiring Index:**
```typescript
firestore
  .collection('agent_prompt_versions')
  .where('agentId', '==', agentId)
  .orderBy('createdAt', 'desc')
  .get();
```

**Index Required:**
```json
{
  "collectionGroup": "agent_prompt_versions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "agentId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**Fix Applied:**
```bash
# Deployed via Firebase CLI
firebase deploy --only firestore:indexes --project salfagpt

# Created directly via gcloud
gcloud firestore indexes composite create \
  --project=salfagpt \
  --database='(default)' \
  --collection-group=agent_prompt_versions \
  --field-config field-path=agentId,order=ascending \
  --field-config field-path=createdAt,order=descending

# Result: Index CICAgJjF9oIK created successfully
```

**Files Modified:**
- `firestore.indexes.json`: Already had definition (line 178-184)
- `.cursor/rules/data.mdc`: Added collection documentation (section 18)

**Index Status:**
- State: READY ✅
- Collection: agent_prompt_versions
- Fields: agentId ASC, createdAt DESC
- Created: 2025-10-31

---

## 📊 Technical Details

### Prompt Loading Flow (BEFORE Fix)

```
1. User clicks "Mejorar con IA"
2. Enhancement saves to Firestore (slow ~1.5s)
3. Local state updates (fast ~0ms)
4. Modal reopens
5. onEditPrompt() called
6. loadPromptsForAgent() fires
7. Firestore read (fast ~200ms)
8. READ completes BEFORE WRITE propagates
9. Old value loaded
10. Local state overwritten ❌
```

### Prompt Loading Flow (AFTER Fix)

```
1. User clicks "Mejorar con IA"
2. Enhancement saves to Firestore
3. Local state updates
4. lastPromptSaveTime = Date.now()
5. Modal reopens
6. onEditPrompt() called (if user clicks edit button again)
7. loadPromptsForAgent() fires
8. ✅ CHECK: timeSinceLastSave < 5000ms?
9. ✅ YES: Skip reload, use cached state
10. Enhanced prompt displayed ✅
```

### Cache Window Strategy

**Duration:** 5 seconds after save

**Rationale:**
- Firestore write propagation: ~1-2 seconds
- User modal transition time: ~0.5 seconds
- Buffer for network latency: ~1.5 seconds
- Total: 5 seconds provides safe margin

**Trade-offs:**
- ✅ Prevents race condition
- ✅ Immediate UI feedback
- ✅ No data loss
- ⚠️ Stale data if external update within 5s (unlikely)

---

## 🧪 Testing

### Test Scenario 1: Enhance Prompt
1. Open agent config
2. Click "Mejorar con IA"
3. Upload setup document
4. Wait for enhancement (~30-60s)
5. Click "Aplicar Sugerencia"
6. **Expected:** Modal reopens with 4730 char prompt ✅
7. Close and reopen modal within 5s
8. **Expected:** Still shows 4730 chars (cached) ✅
9. Close modal, wait 6 seconds
10. Reopen modal
11. **Expected:** Shows 4730 chars (from Firestore) ✅

### Test Scenario 2: Version History
1. Open agent config
2. Click "Ver Historial"
3. **Expected:** History modal opens ✅
4. **Expected:** Shows version list (if any exist) ✅
5. **Expected:** No 500 error ✅

### Test Scenario 3: Manual Edit After Enhancement
1. Enhance prompt (4730 chars)
2. Immediately edit prompt manually
3. Add text to make it 4800 chars
4. Click "Guardar"
5. Close and reopen
6. **Expected:** Shows 4800 chars ✅

---

## 📋 Changes Summary

### Code Changes
1. **ChatInterfaceWorking.tsx**:
   - Added `lastPromptSaveTime` state tracker
   - Modified `loadPromptsForAgent` with cache check
   - Updated `handleSaveAgentPrompt` to set timestamp
   - Optimized enhancement flow (removed delays)

2. **Firestore Indexes**:
   - Created `agent_prompt_versions` composite index
   - State: READY
   - Name: CICAgJjF9oIK

3. **Documentation**:
   - Added `agent_prompt_versions` to `data.mdc`
   - Full schema and API documentation

### No Breaking Changes
- ✅ Additive only (new state, new logic)
- ✅ Backward compatible
- ✅ No removed functionality
- ✅ Existing flows unchanged

---

## ✅ Resolution Status

**Issue 1: Prompt Persistence**
- Status: ✅ FIXED
- Solution: 5-second cache window prevents reload race
- Verification: Manual testing required

**Issue 2: Version History Index**
- Status: ✅ FIXED
- Solution: Firestore index deployed
- Verification: Index state = READY

---

## 🔄 Next Steps

### Immediate (User Testing)
1. Test enhancement flow end-to-end
2. Verify prompt persists on reopen
3. Test version history loads
4. Verify no console errors

### Future Enhancements
1. Add visual indicator for "recently saved" state
2. Add optimistic UI updates with rollback
3. Add retry logic for failed Firestore writes
4. Add conflict resolution for concurrent edits

---

## 📚 Related Documentation

- `docs/PROMPT_ENHANCEMENT_COMPLETE_FIX_2025-10-30.md` - Prompt enhancement feature
- `docs/PROMPT_VERSIONING_SUMMARY.md` - Versioning system overview
- `.cursor/rules/data.mdc` - Complete data schema (section 18)
- `.cursor/rules/firestore.mdc` - Firestore index guidelines

---

**Fixed:** 2025-10-31  
**Tested:** Pending user verification  
**Backward Compatible:** Yes  
**Breaking Changes:** None


