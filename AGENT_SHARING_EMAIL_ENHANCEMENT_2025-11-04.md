# 🔧 Agent Sharing Enhancement - Email-Based Assignment

**Date:** November 4, 2025  
**Issue:** Agent assignments should persist even if user is deleted/recreated  
**Solution:** Add email field to sharedWith array as backup identifier  
**Status:** 📋 PROPOSED

---

## 🎯 Current System

### AgentShare Schema (Current)

```typescript
interface AgentShare {
  id: string;
  agentId: string;
  ownerId: string;
  sharedWith: Array<{
    type: 'user' | 'group';
    id: string;  // ← Hash ID (e.g., usr_abc123)
  }>;
  accessLevel: 'view' | 'use' | 'admin';
}
```

**Problem:**
- Uses hash-based user ID
- If user is deleted and recreated → new ID generated
- Agent assignments lost ❌

---

## 🎯 Proposed Enhancement

### AgentShare Schema (Enhanced)

```typescript
interface AgentShare {
  id: string;
  agentId: string;
  ownerId: string;
  sharedWith: Array<{
    type: 'user' | 'group';
    id: string;        // Hash ID (primary)
    email?: string;    // 🆕 Email (backup identifier)
    domain?: string;   // 🆕 Domain (for domain-wide sharing)
  }>;
  accessLevel: 'view' | 'use' | 'admin';
}
```

**Benefits:**
- ✅ Hash ID as primary (current behavior)
- ✅ Email as backup (persists across user recreation)
- ✅ Domain for organization-level sharing
- ✅ Backward compatible (email is optional)

---

## 🔄 Matching Logic Enhancement

### Current Matching

```typescript
const isMatch = share.sharedWith.some(target => {
  return target.type === 'user' && target.id === userHashId;
});
```

**Problem:** Only matches by ID

---

### Enhanced Matching (Proposed)

```typescript
const isMatch = share.sharedWith.some(target => {
  if (target.type === 'user') {
    // Primary: Match by hash ID
    if (target.id === userHashId) {
      return true;
    }
    
    // 🆕 Fallback: Match by email
    if (target.email && target.email === userEmail) {
      console.log('     ✅ Match by email (user recreated):', userEmail);
      return true;
    }
    
    // 🆕 Domain-wide: Match by domain
    if (target.domain && userEmail) {
      const userDomain = userEmail.split('@')[1];
      if (target.domain === userDomain) {
        console.log('     ✅ Match by domain:', userDomain);
        return true;
      }
    }
  }
  
  return false;
});
```

**Benefits:**
- ✅ Works with current system (hash ID)
- ✅ Works if user recreated (email match)
- ✅ Works for domain-wide sharing

---

## 🔧 Implementation Plan

### Phase 1: Add Email Field (Backward Compatible)

**Step 1:** Update `shareAgent()` function

```typescript
export async function shareAgent(
  agentId: string,
  ownerId: string,
  sharedWith: Array<{ 
    type: 'user' | 'group'; 
    id: string;
    email?: string;  // 🆕 Optional email
  }>,
  accessLevel: AgentShare['accessLevel'] = 'view',
  expiresAt?: Date
): Promise<AgentShare> {
  // For users, automatically include email
  const enrichedSharedWith = await Promise.all(
    sharedWith.map(async (target) => {
      if (target.type === 'user' && !target.email) {
        // Get user and add email
        const user = await getUserById(target.id);
        if (user) {
          return {
            ...target,
            email: user.email  // 🆕 Add email from user record
          };
        }
      }
      return target;
    })
  );
  
  // Save with enriched data
  const agentShare: AgentShare = {
    sharedWith: enrichedSharedWith,
    // ... rest
  };
  
  await shareRef.set(agentShare);
}
```

---

### Phase 2: Update Matching Logic

**Step 2:** Enhance `getSharedAgents()` function

```typescript
const isMatch = share.sharedWith.some(target => {
  if (target.type === 'user') {
    // Primary match: by ID
    if (target.id === userHashId) {
      return true;
    }
    
    // 🆕 Fallback match: by email (if user was recreated)
    if (target.email && userEmail && target.email === userEmail) {
      console.log('     ✅ Match by email (ID changed):', userEmail);
      // 🔄 Optional: Update share with new ID
      return true;
    }
  }
  
  return target.type === 'group' && groupIds.includes(target.id);
});
```

---

### Phase 3: Backfill Existing Shares (Optional)

**Step 3:** Add emails to existing shares

```typescript
async function backfillShareEmails() {
  const shares = await firestore.collection('agent_shares').get();
  
  for (const shareDoc of shares.docs) {
    const shareData = shareDoc.data();
    const updated = await Promise.all(
      shareData.sharedWith.map(async (target) => {
        if (target.type === 'user' && !target.email) {
          const user = await getUserById(target.id);
          if (user) {
            return { ...target, email: user.email };
          }
        }
        return target;
      })
    );
    
    await shareDoc.ref.update({ sharedWith: updated });
  }
}
```

---

## ✅ Benefits of Email-Based Assignment

### Scenario: User Deletion & Recreation

**Before (ID-only):**
```
1. Admin shares M001 with user
   Share: { sharedWith: [{ id: 'usr_abc123' }] }
   
2. Admin deletes user (accident)
   
3. Admin recreates user with same email
   New ID: usr_xyz789 (different!)
   
4. User logs in
   Query: shares WHERE sharedWith contains usr_xyz789
   Result: [] (no matches) ❌
   
5. Agent access LOST ❌
```

**After (ID + Email):**
```
1. Admin shares M001 with user
   Share: { 
     sharedWith: [{ 
       id: 'usr_abc123',
       email: 'user@company.com'  // 🆕
     }] 
   }
   
2. Admin deletes user (accident)
   
3. Admin recreates user with same email
   New ID: usr_xyz789 (different!)
   Email: user@company.com (SAME)
   
4. User logs in
   Query 1: shares WHERE sharedWith contains usr_xyz789 → []
   Query 2: shares WHERE sharedWith.email = user@company.com → ✅ MATCH
   
5. Agent access PRESERVED ✅
```

---

## 🔒 Security Considerations

### Privacy

**Email in sharedWith:**
- ✅ Already have email in User document (same privacy level)
- ✅ Only used for matching, not displayed in URLs
- ✅ Admins/Experts already see all emails

**Access Control:**
- ✅ Still check user permissions
- ✅ Still check if user is active
- ✅ Still check access level

---

## 📋 Migration Strategy

### Backward Compatibility

**Existing shares (ID-only):**
```json
{
  "sharedWith": [
    { "type": "user", "id": "usr_abc123" }
  ]
}
```

**New shares (ID + Email):**
```json
{
  "sharedWith": [
    { 
      "type": "user", 
      "id": "usr_abc123",
      "email": "user@company.com"  // 🆕
    }
  ]
}
```

**Matching logic handles both:**
```typescript
// Try ID first (works for all)
if (target.id === userHashId) return true;

// Try email fallback (works for new shares)
if (target.email === userEmail) return true;
```

**Result:** ✅ No breaking changes

---

## 🧪 Testing Plan

### Test 1: Existing Shares Still Work

```
User: Existing user with ID-only shares
Expected: Still sees shared agents ✅
```

### Test 2: New Shares Include Email

```
Admin: Shares agent with user
Firestore: Document includes both id and email ✅
User: Sees agent ✅
```

### Test 3: User Recreation Preserves Access

```
1. Create user, share agent
2. Delete user
3. Recreate user with SAME email (new ID)
4. User logs in
Expected: Still sees shared agent ✅
```

---

## 🎯 Current Status: Working System

### What's Already Working ✅

Based on your screenshots:
- ✅ Agent sharing UI working
- ✅ Users being assigned to agents
- ✅ "Usar agente" badges showing
- ✅ Multiple users can be assigned

### What Needs Enhancement

**For persistence:**
- 🔄 Add email to sharedWith (not critical for current users)
- 🔄 Update matching to use email as fallback
- 🔄 Backfill existing shares (optional)

**For visibility (Critical):**
- 🔧 Verify getSharedAgents() returns correctly
- 🔧 Check admin/expert see all agents
- 🔧 Check regular users only see assigned agents

---

## 💡 Immediate Actions

### For dortega@novatec.cl Issue:

The agent IS assigned correctly in Firestore. The issue is likely:

1. **Frontend caching** - User needs hard refresh
2. **Session mismatch** - User needs logout/login
3. **API not returning** - Check console logs

**Quick Fix:** User does Ctrl+Shift+R or logout/login

---

### For Future Persistence:

**I recommend implementing email-based sharing in next iteration:**

1. Add `email` field to `sharedWith` array
2. Update matching logic to use email as fallback
3. This ensures assignments persist across user recreation

**Priority:** MEDIUM (current system works, this is for robustness)

---

**Would you like me to:**
1. ✅ Implement email-based sharing NOW (adds persistence)
2. ✅ Just help debug dortega's immediate issue (quick fix)
3. ✅ Both (implement enhancement + fix current issue)

Let me know and I'll proceed!
