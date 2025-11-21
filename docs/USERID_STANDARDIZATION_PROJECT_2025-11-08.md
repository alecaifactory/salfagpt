# 🔐 User ID Standardization Project

**Date:** 2025-11-08 21:05:20  
**Status:** 🔨 In Progress  
**Branch:** main (development)  
**Backup:** backup-20251108-210520 (worktree + tag)  

---

## 🎯 Project Overview

### Goal
Standardize user identification to use hash-based IDs throughout the platform, eliminating ID type mismatches and simplifying access control logic by 80%.

### Current Problem
- **JWT contains:** Google OAuth numeric ID (e.g., `114671162830729001607`)
- **Firestore contains:** Hash-based ID (e.g., `usr_k3n9x2m4p8q1w5z7y0`)
- **Result:** Every query requires email-based fallback resolution
- **Impact:** Triple-matching logic, 2-3 extra DB queries per request, complex code

### Target Solution
- **JWT contains:** Hash-based ID from Firestore (e.g., `usr_k3n9x2m4p8q1w5z7y0`)
- **All documents:** Use consistent hash IDs
- **Result:** Direct ID comparisons work everywhere
- **Impact:** 40% performance improvement, 80% less complexity

---

## 🛡️ Safety Measures

### Backup Strategy

**Backup Branch:**
```
Name: backup/userid-refactor-20251108-210520
Location: /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520
Port: 3001
Status: Frozen (no changes, reference only)
```

**Git Tag:**
```
Name: backup-20251108-210520
Purpose: Instant rollback point
Usage: git reset --hard backup-20251108-210520
```

**Rollback Commands:**
```bash
# Option 1: Reset to tag
git reset --hard backup-20251108-210520

# Option 2: Copy file from backup
cp /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520/src/pages/auth/callback.ts \
   src/pages/auth/callback.ts

# Option 3: Checkout specific file from backup
git checkout backup/userid-refactor-20251108-210520 -- src/pages/auth/callback.ts
```

---

## 📋 Implementation Plan

### Phase 1: Critical JWT Fix ⚠️ (HIGH PRIORITY)

**File:** `src/pages/auth/callback.ts`  
**Lines:** ~87-95  
**Change:** Use `firestoreUser.id` instead of `userInfo.id`

**Before:**
```typescript
const userData = {
  id: userInfo.id, // Google numeric: "114671162830729001607"
  email: userInfo.email,
  name: userInfo.name,
  role: firestoreUser?.role || 'user',
  roles: firestoreUser?.roles || ['user'],
};
```

**After:**
```typescript
const userData = {
  id: firestoreUser.id, // Hash ID: "usr_k3n9x2m4p8q1w5z7y0"
  googleUserId: userInfo.id, // Store numeric for reference
  email: userInfo.email,
  name: userInfo.name,
  role: firestoreUser.role,
  roles: firestoreUser.roles,
  domain: getDomainFromEmail(userInfo.email), // Add domain
};
```

**Expected Impact:**
- ✅ JWT matches Firestore document IDs
- ✅ Direct comparisons work in all API endpoints
- ✅ No email lookup needed in `getSharedAgents()`
- ✅ 40% faster shared agent loading
- ✅ 80% reduction in fallback logic usage

**Testing:**
- [ ] Login as existing user → JWT has hash ID
- [ ] Load conversations → All appear
- [ ] Load shared agents → No email lookup in logs
- [ ] Create conversation → Hash ID stored
- [ ] Send message → Hash ID in message
- [ ] Cross-user access blocked (security)

---

### Phase 2: Add Domain Field (MEDIUM PRIORITY)

**Files:**
- `src/types/users.ts` - Add `domain: string` to User interface
- `src/lib/firestore.ts` - Store domain on user create/update

**Changes:**
```typescript
// User interface
export interface User {
  id: string;              // Hash ID (primary)
  googleUserId?: string;   // OAuth numeric (reference)
  email: string;           // Lookup key
  domain: string;          // NEW: From email (e.g., "company.com")
  // ... rest
}

// User creation
const domain = getDomainFromEmail(email);
await firestore.collection('users').doc(userId).set({
  ...userData,
  domain, // ✅ Store explicitly
});
```

**Benefits:**
- Fast domain-based queries (indexed)
- No `email.split('@')[1]` needed
- Clear organizational structure

---

### Phase 3: Documentation (IMPORTANT)

**Files to create:**
- `docs/USER_ID_STRATEGY.md` - Complete ID strategy guide
- `docs/USER_ID_MIGRATION_GUIDE.md` - Optional migration steps

**Files to update:**
- `.cursor/rules/privacy.mdc` - Update ID references
- `.cursor/rules/data.mdc` - Clarify ID fields
- `docs/BranchLog.md` - Track this project

---

### Phase 4: Optional Migration (LOW PRIORITY)

**Purpose:** Convert old email-based IDs to hash IDs

**Status:** Optional - current system works with mixed IDs

**When to do:** Only if:
- Old IDs causing specific issues
- Want 100% consistency
- Have planned maintenance window

---

## 🧪 Testing Checklist

### Pre-Change Testing (Port 3001 - Backup)

Run backup server for baseline:
```bash
cd /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520
npm run dev  # Port 3001
```

**Baseline Metrics:**
- [ ] Login time: ___ ms
- [ ] Shared agent load time: ___ ms
- [ ] Conversation creation time: ___ ms
- [ ] Console shows email lookup in getSharedAgents()
- [ ] JWT decoded: id is numeric

---

### Post-Change Testing (Port 3000 - Main)

Run main server after changes:
```bash
cd /Users/alec/salfagpt
npm run dev  # Port 3000
```

**Target Metrics:**
- [ ] Login time: ___ ms (should be similar)
- [ ] Shared agent load time: ___ ms (should be 40% faster)
- [ ] Conversation creation time: ___ ms (should be similar)
- [ ] Console shows NO email lookup in getSharedAgents() ✅
- [ ] JWT decoded: id is hash ✅

---

### Functional Testing

**Test Scenarios:**

1. **Existing User Login**
   - [ ] Can login successfully
   - [ ] JWT contains hash ID (not numeric)
   - [ ] All conversations load
   - [ ] All shared agents load
   - [ ] No console errors

2. **New Conversation**
   - [ ] Can create "Nuevo Agente"
   - [ ] Firestore conversation has userId as hash
   - [ ] Can send messages
   - [ ] Messages have userId as hash

3. **Agent Sharing**
   - [ ] Can share agent with user
   - [ ] Share uses hash ID
   - [ ] Recipient sees shared agent
   - [ ] No email fallback needed (check logs)

4. **Security**
   - [ ] Cross-user access blocked (403)
   - [ ] Reason is ownership, not ID type mismatch
   - [ ] Domain access control still works

5. **Backward Compatibility**
   - [ ] Existing conversations with numeric userId still accessible
   - [ ] Email fallback still works (resilience)
   - [ ] No data loss

---

## 📊 Performance Benchmarks

### Measure These

**Shared Agent Loading:**
```javascript
// In browser console (both ports)
console.time('loadSharedAgents');
// Trigger load
console.timeEnd('loadSharedAgents');

// Backup (3001): ~250ms (baseline)
// Main (3000): ~150ms (target) → 40% improvement ✅
```

**DB Query Count:**
```
// Count queries in console logs

Backup (3001):
  - getUserByEmail: 1 query
  - getSharedAgents: 1 query
  - getConversation: N queries (N = agents)
  Total: 2 + N queries

Main (3000):
  - getSharedAgents: 1 query (no getUserByEmail!) ✅
  - getConversation: N queries
  Total: 1 + N queries
  
Reduction: 1 query saved per request ✅
```

---

## 🚨 Rollback Procedures

### If Single File Breaks

```bash
cd /Users/alec/salfagpt

# Copy from backup
cp /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520/src/pages/auth/callback.ts \
   src/pages/auth/callback.ts

# Test
npm run dev
```

### If Multiple Issues

```bash
cd /Users/alec/salfagpt

# Reset to tag
git reset --hard backup-20251108-210520

# Verify
npm run dev  # Should work like before
```

### If Need to Start Over

```bash
cd /Users/alec/salfagpt

# Create recovery branch from tag
git checkout -b recovery/userid-refactor backup-20251108-210520

# Or reset main entirely
git checkout main
git reset --hard backup-20251108-210520
git push --force origin main  # ⚠️ Only if absolutely necessary
```

---

## 📁 File Locations

### Development (Main Branch)
```
Location: /Users/alec/salfagpt
Branch: main
Port: 3000
Purpose: Make changes here
OAuth: ✅ Configured
```

### Backup (Worktree)
```
Location: /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520
Branch: backup/userid-refactor-20251108-210520
Port: 3001
Purpose: Reference only (DO NOT CHANGE)
OAuth: ❌ Not configured (not needed)
```

---

## 🔍 Verification Commands

### Check Setup

```bash
# List worktrees
git worktree list

# Should show:
# /Users/alec/salfagpt                    [main]
# /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520  [backup/userid-refactor-20251108-210520]

# List tags
git tag | grep backup-20251108

# Should show:
# backup-20251108-210520

# Check ports
lsof -i :3000  # Main (when running)
lsof -i :3001  # Backup (when running)
```

---

## 📝 Progress Tracking

### Day 1: 2025-11-08
- [x] Backup branch created
- [x] Backup tag created  
- [x] Backup worktree created
- [x] Port 3001 configured
- [ ] JWT change implemented
- [ ] Testing completed
- [ ] Documentation updated

### Day 2: TBD
- [ ] Domain field added
- [ ] Performance benchmarks
- [ ] User acceptance testing

---

## ✅ Success Criteria

**Before declaring complete:**
- [ ] All tests passing
- [ ] Performance improved (40% target)
- [ ] No console errors
- [ ] Backward compatible (old data works)
- [ ] Documentation complete
- [ ] Can run both servers side-by-side
- [ ] Can rollback in <5 minutes if needed

---

## 🎯 Next Steps

1. **Start both servers:**
   ```bash
   # Terminal 1 - Main (development)
   cd /Users/alec/salfagpt
   npm run dev  # Port 3000
   
   # Terminal 2 - Backup (reference)
   cd /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520
   npm run dev  # Port 3001
   ```

2. **Make JWT change in main branch**
   - Edit: `src/pages/auth/callback.ts`
   - Test on port 3000
   - Compare with port 3001

3. **Verify nothing broke**
   - Run all test scenarios
   - Measure performance
   - Check console logs

4. **Commit and document**
   - Update this document with results
   - Update BranchLog.md
   - Create USER_ID_STRATEGY.md

---

**Last Updated:** 2025-11-08 21:05:20  
**Backup Valid Until:** Keep indefinitely or delete after 2 weeks of stable operation







