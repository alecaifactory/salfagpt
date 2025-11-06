# Domain Filter Fix - Roadmap Not Showing Tickets

**Date:** 2025-11-06  
**Issue:** Roadmap showed "0 items" even though MyFeedback showed 7 tickets

---

## 🐛 Root Cause

**Domain mismatch in query filter:**

```typescript
// RoadmapModal was querying with:
companyId="aifactory"

// But tickets have:
userDomain="getaifactory.com"

// Query filter:
query.where('userDomain', '==', 'aifactory')  // ❌ No matches!
```

**Result:** Query returned 0 tickets because domain strings didn't match

---

## ✅ Fix

**File:** `src/components/ChatInterfaceWorking.tsx` line 6375

**Before:**
```typescript
<RoadmapModal
  companyId="aifactory"  // ❌ Wrong
  ...
/>
```

**After:**
```typescript
<RoadmapModal
  companyId="getaifactory.com"  // ✅ Correct
  ...
/>
```

---

## 🔍 How We Found It

Enhanced logging showed:

**Frontend (RoadmapModal.tsx):**
```
📥 [ROADMAP] Loading tickets: {companyId: 'aifactory', ...}
📡 [ROADMAP] Response status: 200
✅ [ROADMAP] Received tickets: 0  ← Empty array!
```

**Backend (tickets.ts):**
```
🔐 [TICKETS] Session verified: {email: 'alec@getaifactory.com', ...}
🔍 [TICKETS] Query params: {companyId: 'aifactory', ...}
✅ [TICKETS] SuperAdmin access - loading all tickets
   Filtering by domain: aifactory  ← Wrong domain!
✅ Loaded 0 feedback tickets
📊 Tickets by lane: {backlog: 0, ...}
```

**Firestore:**
```javascript
// Query was:
where('userDomain', '==', 'aifactory')

// Tickets have:
{ userDomain: 'getaifactory.com' }

// Result: No matches
```

---

## 💡 Lesson Learned

**Always use full domain names consistently:**

- Email: `alec@getaifactory.com`
- Domain extraction: `email.split('@')[1]` → `'getaifactory.com'`
- Query filter: Must match exactly

**Don't use shortened domain names:**
- ❌ 'aifactory'
- ❌ 'aifactory.com'  
- ✅ 'getaifactory.com' (from email)

---

## ✅ Expected Behavior After Fix

**When opening Roadmap:**

1. Query uses `companyId='getaifactory.com'`
2. Firestore query: `where('userDomain', '==', 'getaifactory.com')`
3. Returns all 7 tickets
4. Roadmap displays:
   - Total: 7
   - Backlog: 7
   - 7 cards visible in Backlog column

---

## 🧪 Verification

**Please refresh browser and open Roadmap again.**

**You should now see:**
```
Total: 7  👤 Usuarios: 0  👨‍🏫 Expertos: 0  👑 Admins: 7

┌─────────────────┐
│ 📋 Backlog  7   │
├─────────────────┤
│ [7 yellow cards]│
│ - Bueno        │
│ - Hola         │
│ - Regular      │
│ - (4 more...)  │
└─────────────────┘
```

---

**Fixed:** 2025-11-06, 7:25 AM  
**Impact:** Roadmap now loads all feedback tickets correctly  
**Root Cause:** Hardcoded domain 'aifactory' didn't match 'getaifactory.com'  
**Solution:** Use full domain from email

