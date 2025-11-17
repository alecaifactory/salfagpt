# Archive Folders - Test Plan

**Date:** November 17, 2025  
**Feature:** Organized archive system with 4 category folders  
**Tester:** User  
**Environment:** Localhost → Staging → Production

---

## 🎯 Test Objectives

1. Verify archive folder structure displays correctly
2. Verify auto-categorization works for all types
3. Verify historical archived items appear (googleUserId fallback)
4. Verify restore functionality for all categories
5. Verify privacy (user isolation)
6. Verify backward compatibility

---

## 🧪 Test Cases

### Test 1: Fresh Archive - Ally

**Steps:**
1. Go to Ally conversation
2. Click Archive button (amber icon)
3. Expand "Archivados" section
4. Check "Ally" folder

**Expected:**
- ✅ Ally conversation appears in Ally folder (Indigo color)
- ✅ Count badge shows "1"
- ✅ Item is clickable
- ✅ Restore button visible on hover (green)

**Verify in Firestore:**
```
status: 'archived'
archivedFolder: 'ally'
archivedAt: [timestamp]
```

---

### Test 2: Fresh Archive - Agent

**Steps:**
1. Go to an agent (e.g., "KAMKE L2")
2. Click Archive button
3. Expand "Archivados" section
4. Check "Agentes" folder

**Expected:**
- ✅ Agent appears in Agentes folder (Blue color)
- ✅ Count badge updated
- ✅ Item clickable
- ✅ Restore button works

**Verify in Firestore:**
```
status: 'archived'
archivedFolder: 'agents'
isAgent: true
archivedAt: [timestamp]
```

---

### Test 3: Fresh Archive - Project

**Steps:**
1. Go to a project conversation (has folderId)
2. Click Archive button
3. Expand "Archivados" section
4. Check "Proyectos" folder

**Expected:**
- ✅ Project appears in Proyectos folder (Green color)
- ✅ Count badge updated
- ✅ Item clickable
- ✅ Restore button works

**Verify in Firestore:**
```
status: 'archived'
archivedFolder: 'projects'
folderId: [folder-id]
archivedAt: [timestamp]
```

---

### Test 4: Fresh Archive - Conversation

**Steps:**
1. Create new regular conversation (not agent, not in folder)
2. Send a message
3. Archive it
4. Expand "Archivados" section
5. Check "Conversaciones" folder

**Expected:**
- ✅ Conversation appears in Conversaciones folder (Purple color)
- ✅ Count badge updated
- ✅ Item clickable
- ✅ Restore button works

**Verify in Firestore:**
```
status: 'archived'
archivedFolder: 'conversations'
isAgent: false (or undefined)
folderId: undefined
archivedAt: [timestamp]
```

---

### Test 5: Historical Archives (googleUserId)

**Pre-requisite:** User has archived conversations from before userId migration

**Steps:**
1. Login as user with historical data
2. Expand "Archivados" section
3. Check all 4 folders

**Expected:**
- ✅ Historical archived items appear in correct folders
- ✅ No empty state if items exist in Firestore
- ✅ Console shows: "Found X archived items with googleUserId"

**Console Logs to Check:**
```
🔑 Trying googleUserId for archived items: usr_xxx → 114671162830729001607
✅ Found X archived items with googleUserId
```

---

### Test 6: Restore Functionality

**Steps:**
1. For each category folder (Ally, Agents, Projects, Conversations)
2. Hover over an archived item
3. Click the green Restore button (ArchiveRestore icon)
4. Verify item moves back to active section

**Expected:**
- ✅ Item disappears from archive folder
- ✅ Item appears in appropriate active section
- ✅ Count badges update (-1 in archive, +1 in active)
- ✅ Item is fully functional

**Verify in Firestore:**
```
status: 'active' (or undefined)
archivedFolder: undefined
archivedAt: undefined
```

---

### Test 7: Privacy (Multi-User)

**Steps:**
1. Login as User A
2. Archive items in all 4 categories
3. Note count per category
4. Logout
5. Login as User B (different user)
6. Expand "Archivados" section

**Expected:**
- ✅ User B sees ZERO of User A's archived items
- ✅ Each user's archives completely isolated
- ✅ No data leakage

**Security Check:**
```typescript
// Verify API blocks cross-user access
fetch('/api/conversations/archived?userId=USER_B_ID', {
  headers: { Cookie: 'USER_A_SESSION' }
});
// → Should return 403 Forbidden
```

---

### Test 8: Expand/Collapse

**Steps:**
1. Expand "Archivados" section
2. Click each folder header (Ally, Agents, Projects, Conversaciones)
3. Verify expand/collapse animation

**Expected:**
- ✅ Smooth rotation animation on chevron
- ✅ Smooth height transition
- ✅ State persists while section is open
- ✅ Each folder independent (can expand multiple)

---

### Test 9: "+N más" Links

**Steps:**
1. Archive more than 3 items in one category
2. Expand that category folder
3. Verify "+N más" link appears
4. Click the link

**Expected:**
- ✅ Link shows correct count (e.g., "+5 más")
- ✅ Click opens full archive view modal (or scrolls if inline)
- ✅ All items accessible

---

### Test 10: Total Count Badge

**Steps:**
1. Archive items across all categories
2. Check "Archivados" button badge

**Expected:**
- ✅ Badge shows total count (sum of all 4 categories)
- ✅ Updates in real-time when archiving/restoring
- ✅ Color: amber-100 background, amber-700 text

---

## 🔧 Migration Testing

### Test 11: Archive Folder Migration Script

**Steps:**
```bash
# 1. Run dry-run
npx tsx scripts/migrate-archive-folders.ts

# 2. Review output
# - Check statistics
# - Check sample conversions
# - Verify categories detected correctly

# 3. Execute
npx tsx scripts/migrate-archive-folders.ts --execute

# 4. Verify in Firestore
# - Check archivedFolder field set
# - Check archivedAt timestamp set
```

**Expected:**
- ✅ All existing archived items get `archivedFolder`
- ✅ All existing archived items get `archivedAt`
- ✅ Categories detected correctly
- ✅ No errors or skipped items

---

### Test 12: User ID Mapping Fix Script

**Steps:**
```bash
# 1. Run dry-run
npx tsx scripts/fix-archived-userid-mapping.ts

# 2. Review mappings
# - Check googleUserId → hashId conversions
# - Check email-based → hashId conversions
# - Verify all users have mappings

# 3. Execute
npx tsx scripts/fix-archived-userid-mapping.ts --execute

# 4. Verify in Firestore
# - Check userId updated to usr_ format
# - Check _migratedUserId flag set
# - Check _originalUserId preserved
```

**Expected:**
- ✅ All old format userIds converted to hashId
- ✅ Migration tracking fields added
- ✅ Original userId preserved for reference
- ✅ No errors

---

## 🚨 Edge Cases to Test

### Edge Case 1: Conversation with Multiple Properties

**Scenario:** Agent that is also in a project folder

**Expected:**
- Should archive to "agents" (isAgent takes precedence)
- Restore should work correctly

### Edge Case 2: Unarchive Then Re-Archive

**Scenario:** Archive → Restore → Archive again

**Expected:**
- First archive sets category
- Restore clears category
- Second archive re-detects (may be different if properties changed)

### Edge Case 3: Archive While Viewing

**Scenario:** User is viewing a conversation, then archives it

**Expected:**
- Conversation clears from main view
- Messages clear
- User prompted to select another conversation

### Edge Case 4: User with No googleUserId

**Scenario:** User created after userId migration (no googleUserId field)

**Expected:**
- Regular query works
- No fallback attempt
- No errors

### Edge Case 5: Empty Archive

**Scenario:** User has never archived anything

**Expected:**
- "Archivados" section shows "0" badge
- Expanding shows "No hay archivados" or empty
- No errors

---

## 📊 Performance Testing

### Test 13: Query Performance

**Steps:**
1. Archive 50+ items across all categories
2. Expand "Archivados" section
3. Measure load time

**Expected:**
- ✅ Loads in <500ms
- ✅ No UI lag
- ✅ Smooth animations

**Check Indexes:**
```bash
# Verify indexes are built
firebase deploy --only firestore:indexes --project salfagpt

# Should show status: ENABLED for:
# - userId + status + archivedAt
# - userId + status + archivedFolder + archivedAt
```

---

### Test 14: Batch Operations

**Steps:**
1. Archive 10 items quickly (rapid clicking)
2. Restore 10 items quickly

**Expected:**
- ✅ All operations complete without errors
- ✅ No race conditions
- ✅ Counts update correctly
- ✅ UI remains responsive

---

## ✅ Acceptance Criteria

**Must Pass ALL Tests Before Deploying:**

### Functionality
- [ ] All 4 folders display correctly
- [ ] Auto-categorization works for all types
- [ ] Historical archives visible (googleUserId fallback)
- [ ] Restore works for all categories
- [ ] Counts accurate

### Privacy
- [ ] User isolation verified (multi-user test)
- [ ] API blocks cross-user access (403)
- [ ] Only sees own archives

### Performance
- [ ] Loads in <500ms
- [ ] Indexes deployed and enabled
- [ ] No UI lag

### Backward Compatibility
- [ ] Old archived items still work
- [ ] No breaking changes
- [ ] Migration scripts successful

### Code Quality
- [ ] No TypeScript errors (in relevant files)
- [ ] No linter errors
- [ ] Documentation complete

---

## 🔄 Rollback Plan (If Issues)

### If Migration Causes Issues:

```bash
# 1. Stop using new fields in queries
# - Comment out archivedFolder filter
# - Fall back to status === 'archived' only

# 2. Revert Firestore changes (if needed)
# For each affected conversation:
UPDATE conversations
SET archivedFolder = null, archivedAt = null
WHERE status = 'archived'

# 3. Redeploy previous code version
git revert [commit-hash]
git push

# 4. Notify users of temporary issue
```

### If googleUserId Fallback Fails:

```bash
# Option 1: Run mapping fix script again
npx tsx scripts/fix-archived-userid-mapping.ts --execute

# Option 2: Manual update in Firestore Console
# Update userId field for affected documents
```

---

## 📝 Test Execution Log

**Tester:** _______________  
**Date:** _______________  
**Environment:** localhost / staging / production

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Fresh Archive - Ally | ⬜ Pass / ❌ Fail | |
| 2 | Fresh Archive - Agent | ⬜ Pass / ❌ Fail | |
| 3 | Fresh Archive - Project | ⬜ Pass / ❌ Fail | |
| 4 | Fresh Archive - Conversation | ⬜ Pass / ❌ Fail | |
| 5 | Historical Archives | ⬜ Pass / ❌ Fail | |
| 6 | Restore Functionality | ⬜ Pass / ❌ Fail | |
| 7 | Privacy (Multi-User) | ⬜ Pass / ❌ Fail | |
| 8 | Expand/Collapse | ⬜ Pass / ❌ Fail | |
| 9 | "+N más" Links | ⬜ Pass / ❌ Fail | |
| 10 | Total Count Badge | ⬜ Pass / ❌ Fail | |
| 11 | Archive Folder Migration | ⬜ Pass / ❌ Fail | |
| 12 | User ID Mapping Fix | ⬜ Pass / ❌ Fail | |
| 13 | Query Performance | ⬜ Pass / ❌ Fail | |
| 14 | Batch Operations | ⬜ Pass / ❌ Fail | |

**Overall Result:** ⬜ PASS / ❌ FAIL

**Issues Found:**
1. 
2. 
3. 

**Actions Taken:**
1. 
2. 
3. 

---

**Sign-off:** _______________  
**Date:** _______________

