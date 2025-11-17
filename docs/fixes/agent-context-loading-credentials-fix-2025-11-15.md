# Agent Context Loading - Missing Credentials Fix

**Date:** 2025-11-15  
**Bug:** Agent context configuration modal failing to load documents  
**Component:** `AgentContextModal.tsx`  
**Status:** ✅ Fixed

---

## 🐛 Problem

When opening the agent context configuration modal (⚙️ gear icon), documents failed to load with "Unauthorized - Please login" error.

### Symptoms
- Modal opened showing "0 documentos"
- Console showed 401 Unauthorized errors
- Documents were not loading even though user was authenticated

### Root Cause
Missing `credentials: 'include'` option in fetch calls, preventing session cookies from being sent to API endpoints.

---

## 🔧 Solution

Added `credentials: 'include'` to ALL fetch calls in `AgentContextModal.tsx`:

### Fixed Functions

**1. loadMetadata() - Line 70**
```typescript
// ❌ BEFORE
const response = await fetch(`/api/agents/${agentId}/context-count`);

// ✅ AFTER
const response = await fetch(`/api/agents/${agentId}/context-count`, {
  credentials: 'include', // ✅ FIX: Include cookies for authentication
});
```

**2. enableAllAssignedSources() - Line 135**
```typescript
// ❌ BEFORE
const allIdsResponse = await fetch(`/api/agents/${agentId}/context-sources/all-ids`);

// ✅ AFTER
const allIdsResponse = await fetch(`/api/agents/${agentId}/context-sources/all-ids`, {
  credentials: 'include', // ✅ FIX: Include cookies for authentication
});
```

**3. enableAllAssignedSources() - POST call - Line 149**
```typescript
// ❌ BEFORE
await fetch(`/api/conversations/${agentId}/context-sources`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ activeContextSourceIds: allSourceIds })
});

// ✅ AFTER
await fetch(`/api/conversations/${agentId}/context-sources`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ✅ FIX: Include cookies for authentication
  body: JSON.stringify({ activeContextSourceIds: allSourceIds })
});
```

**4. loadDocumentDetails() - Line 195**
```typescript
// ❌ BEFORE
const response = await fetch(`/api/context-sources/${sourceId}`);

// ✅ AFTER
const response = await fetch(`/api/context-sources/${sourceId}`, {
  credentials: 'include', // ✅ FIX: Include cookies for authentication
});
```

**Note:** `loadFirstPage()` and `loadNextPage()` already had `credentials: 'include'` ✅

---

## ✅ Verification

### Before Fix
```
GET /api/agents/KfoKCDrb6pMnduA1L1rD/context-count
→ 401 Unauthorized - Please login
```

### After Fix
```
GET /api/agents/KfoKCDrb6pMnduA1L1rD/context-count
→ 200 OK
→ { total: 538, agentId: "...", responseTime: 45 }
```

---

## 📋 Pattern

**Rule:** ALWAYS include `credentials: 'include'` in fetch calls to authenticated API endpoints.

**Pattern:**
```typescript
const response = await fetch('/api/endpoint', {
  credentials: 'include', // ✅ Required for session cookie
  // ... other options
});
```

---

## 🎯 Impact

**Before:** 
- ❌ Modal showed "0 documentos" even when documents existed
- ❌ Users couldn't configure agent context
- ❌ API returned 401 errors

**After:**
- ✅ Modal correctly shows document count (e.g., "538 documentos")
- ✅ Users can browse and configure agent documents
- ✅ API authentication works properly

---

## 📚 Related Issues

This is similar to other authentication fixes documented in:
- `docs/fixes/context-management-auth-fix-2025-10-xx.md`
- General pattern: Always include credentials in authenticated fetch calls

---

**Lesson Learned:** When adding new API calls, always include `credentials: 'include'` for authenticated endpoints. Consider adding this to linting rules or component templates.


