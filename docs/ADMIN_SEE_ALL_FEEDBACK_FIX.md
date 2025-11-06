# Admin See All Feedback Fix - 2025-11-06

**Issue:** Admin submitted feedback from `alecdickinson@gmail.com` (domain: `gmail.com`) but it didn't appear in the Roadmap or MyFeedback

**Root Cause:** Privacy filter was too restrictive - admins could only see feedback from their own email domain

---

## 🐛 The Problem

### Original Privacy Model (Too Restrictive):

```typescript
// Admin: Can see tickets from their domain ONLY
if (session.role === 'admin') {
  const adminDomain = session.email.split('@')[1]; // getaifactory.com
  query = query.where('userDomain', '==', adminDomain);
  // ❌ Only shows tickets from getaifactory.com
  // ❌ Hides tickets from gmail.com, salfa.cl, etc.
}
```

**Result:**
- Admin `alec@getaifactory.com` submits feedback → Creates ticket with `userDomain: 'getaifactory.com'` ✅
- Admin `alecdickinson@gmail.com` submits feedback → Creates ticket with `userDomain: 'gmail.com'` ✅
- Roadmap query filters: `where('userDomain', '==', 'getaifactory.com')` → Only shows first ticket ❌

---

## ✅ The Solution

### New Privacy Model (Admin-Appropriate):

```typescript
// Admin OR SuperAdmin: Can see ALL tickets from ALL users/domains
if (session.role === 'admin' || session.email === 'alec@getaifactory.com') {
  console.log('✅ [TICKETS] Admin/SuperAdmin access - loading all tickets from all users');
  
  // Optional domain filter for organizing view
  if (companyId && companyId !== 'all') {
    console.log(`   Optional filtering by domain: ${companyId}`);
    query = query.where('userDomain', '==', companyId);
  } else {
    console.log('   Loading ALL tickets (no domain filter)');
    // ✅ No filter = all tickets from all domains
  }
}
```

**Result:**
- Admin can see feedback from ALL users
- Feedback from `gmail.com`, `getaifactory.com`, `salfa.cl`, etc. all visible
- Optional: Can filter by specific domain if needed

---

## 📋 Updated Privacy Matrix

| User Role | Can See |
|-----------|---------|
| **User** | Only their own tickets (`reportedBy == userId`) |
| **Expert** | All tickets from their domain (`userDomain == expertDomain`) |
| **Admin** | ✅ **ALL tickets from ALL domains** (no filter) |
| **SuperAdmin** | ✅ **ALL tickets from ALL domains** (no filter) |

### Rationale

**Why Admins need to see all feedback:**

1. **Product Management:** Admins manage the entire product roadmap, not just one domain
2. **Cross-Domain Insights:** Feedback from different user types (internal, external, partners) provides complete picture
3. **Prioritization:** Need to see all feedback to prioritize by impact, not just domain
4. **Analytics:** Can't analyze feedback trends if limited to one domain

**Why Users should only see their own:**
- Users should only track their own submissions
- Privacy - users shouldn't see each other's feedback

**Why Experts might be domain-limited:**
- Experts might be domain-specific (e.g., Salfa domain expert)
- Can be changed in the future if needed

---

## 🔧 Changes Made

### File 1: `src/pages/api/feedback/tickets.ts`

**Lines 55-81:**
- Changed: Admin privacy filter from domain-restricted to all-access
- Added: Better logging to show access level
- Result: Admins see all tickets from all domains

### File 2: `src/components/ChatInterfaceWorking.tsx`

**Line 6375:**
```typescript
// Before:
companyId="getaifactory.com"  // ❌ Filtered to one domain

// After:
companyId="all"  // ✅ Shows all domains
```

**Result:** Roadmap loads ALL tickets, no domain filter

---

## 🧪 Testing

### Test Case: Multi-Domain Feedback

**Setup:**
1. Admin `alec@getaifactory.com` (domain: getaifactory.com)
2. Admin `alecdickinson@gmail.com` (domain: gmail.com)

**Scenario:**
1. alecdickinson@gmail.com submits feedback → ticket with `userDomain: 'gmail.com'`
2. alec@getaifactory.com opens Roadmap

**Before Fix:**
- ❌ Only sees tickets with `userDomain: 'getaifactory.com'`
- ❌ gmail.com ticket hidden

**After Fix:**
- ✅ Sees tickets from ALL domains
- ✅ getaifactory.com tickets visible
- ✅ gmail.com tickets visible
- ✅ Any other domain tickets visible

---

## 📊 Expected Behavior Now

### MyFeedbackView (Personal)
- **Users:** See only their own tickets (unchanged)
- **Experts:** See only their own tickets (unchanged)
- **Admins:** See only their own tickets (unchanged)

**Why:** "Mi Feedback" is personal tracking, not team view

### Roadmap (Team/Product View)
- **Users:** N/A (cannot access Roadmap)
- **Experts:** See tickets from their domain (unchanged)
- **Admins:** ✅ **See ALL tickets from ALL domains** (fixed!)
- **SuperAdmin:** See ALL tickets from ALL domains (unchanged)

**Why:** Roadmap is product management tool, needs complete view

---

## 🎯 Impact

**For alecdickinson@gmail.com:**
- ✅ Feedback now visible in admin Roadmap
- ✅ Shows in "Mi Feedback" personal view
- ✅ Can be prioritized and moved through lanes

**For alec@getaifactory.com:**
- ✅ Can see feedback from ALL users (gmail.com, getaifactory.com, etc.)
- ✅ Complete view of product feedback
- ✅ Better prioritization with full context

**Analytics:**
- ✅ Breakdown by domain now meaningful
- ✅ Can compare feedback quality across domains
- ✅ Identify patterns across user types

---

## 🔮 Future Enhancements

Could add domain filtering UI in Roadmap:

```
[All Domains ▼] [All Priorities ▼] [All Roles ▼]
```

Dropdown to filter by:
- Specific domain (getaifactory.com, gmail.com, salfa.cl, etc.)
- All domains (default)

This would help when there are hundreds of tickets.

---

## ✅ Verification

**Steps to verify:**

1. **As alecdickinson@gmail.com:**
   - Submit feedback (should see success)
   - Open "Mi Feedback" → Should see ticket
   - If also admin, open Roadmap → Should see ticket

2. **As alec@getaifactory.com:**
   - Open Roadmap
   - Should see tickets from BOTH:
     - getaifactory.com domain (yours)
     - gmail.com domain (alecdickinson's)
   - Analytics should show correct domain breakdown

---

**Fixed:** 2025-11-06  
**File:** `src/pages/api/feedback/tickets.ts`  
**Impact:** Admins now see feedback from all users across all domains  
**Backward Compatible:** ✅ Yes (only makes admin view more permissive)

