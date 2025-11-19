# ✅ CLI Upload - Hash ID Update

**Date:** 2025-11-19  
**Status:** ✅ Fixed

---

## 🐛 Issue Discovered

Documents uploaded via CLI were using **Google OAuth numeric ID** as the `userId`:
```
userId: "114671162830729001607"
```

But the current authentication system uses **hash IDs**:
```
userId: "usr_uhwqffaqag1wrryd82tw"
```

This caused documents to be invisible in the UI because the API queries by hash ID.

---

## ✅ Solution Implemented

### 1. Fixed Existing Documents
Updated all 16 uploaded documents to use hash ID:
```bash
npx tsx scripts/fix-userid-to-hash.ts
```

### 2. Updated CLI Upload Command

**New Primary ID: Hash ID**
- `--user` parameter now expects **hash ID** (e.g., `usr_uhwqffaqag1wrryd82tw`)
- Added optional `--google-user` parameter for Google numeric ID (for reference)

**Updated Command:**
```bash
npx tsx cli/commands/upload.ts \
  --folder=/path/to/folder \
  --tag=TAG-NAME \
  --agent=AGENT_ID \
  --user=usr_uhwqffaqag1wrryd82tw \          # ✅ HASH ID (primary)
  --google-user=114671162830729001607 \       # ✅ Optional (for reference)
  --email=alec@getaifactory.com
```

### 3. Data Model Updates

**context_sources document:**
```typescript
{
  userId: "usr_uhwqffaqag1wrryd82tw",  // ✅ HASH ID - PRIMARY
  googleUserId: "114671162830729001607", // ✅ Optional: for reference
  name: "document.pdf",
  assignedToAgents: ["TestApiUpload_S001"],
  // ... rest of fields
}
```

---

## 🔑 Finding Your Hash ID

### Method 1: From Browser Console
```javascript
// In browser console on localhost:3000/chat
console.log(window.__USER_ID__);  // Shows: usr_uhwqffaqag1wrryd82tw
```

### Method 2: From Database
```bash
npx tsx scripts/get-current-user-id.ts
```

Output:
```
Document ID (hash): usr_uhwqffaqag1wrryd82tw
Email: alec@getaifactory.com
Google ID: 114671162830729001607
```

### Method 3: From Firestore Console
```
Firestore → users collection → Find by email
Document ID = Hash ID
```

---

## 📋 Updated Examples

### Upload Command
```bash
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=TestApiUpload_S001 \
  --user=usr_uhwqffaqag1wrryd82tw \
  --google-user=114671162830729001607 \
  --email=alec@getaifactory.com \
  --test="¿Cuáles son los requisitos de seguridad?"
```

### Helper Script
```bash
./cli/upload-s001.sh  # Now uses hash ID automatically
```

---

## 🎯 Key Changes

| Before | After |
|--------|-------|
| `--user=114671162830729001607` | `--user=usr_uhwqffaqag1wrryd82tw` |
| Only Google numeric ID | Hash ID (primary) + Google ID (optional) |
| Documents invisible in UI | ✅ Documents visible |
| API queries failed | ✅ API queries work |

---

## ✅ Verification

After the fix, documents now appear correctly in the UI:

1. **Agent Context Modal:**
   - Shows: "0 de 16 documentos" → **"16 documentos"** ✅

2. **API Query:**
   ```
   GET /api/agents/TestApiUpload_S001/context-sources
   Response: 16 documents ✅
   ```

3. **Firestore:**
   ```
   context_sources where userId == 'usr_uhwqffaqag1wrryd82tw'
   Result: 16 documents ✅
   ```

---

## 📚 Why This Matters

### Hash ID Benefits:
1. **Privacy:** Obfuscates real Google ID
2. **Consistency:** Same across all UI and API
3. **Security:** Harder to guess user IDs
4. **Flexibility:** Can map to multiple OAuth providers

### Google ID Kept For:
1. **Reference:** Link back to OAuth provider
2. **Migration:** Backward compatibility if needed
3. **Debugging:** Trace to original OAuth account

---

## 🚀 Going Forward

**Always use Hash ID as primary identifier:**
```typescript
// ✅ CORRECT
const userId = 'usr_uhwqffaqag1wrryd82tw';  // Hash ID

// ❌ WRONG
const userId = '114671162830729001607';  // Google numeric ID
```

**When creating new features:**
- Query by `userId` (hash ID)
- Optionally store `googleUserId` for reference
- Never query by Google ID directly

---

## 📖 Related Documentation

- [UPLOAD_GUIDE.md](cli/UPLOAD_GUIDE.md) - Updated with hash ID examples
- [QUICK_START.md](cli/QUICK_START.md) - Updated commands
- [CLI_UPLOAD_READY.md](CLI_UPLOAD_READY.md) - Updated examples

---

**Fixed:** 2025-11-19  
**Status:** ✅ Complete  
**Documents Updated:** 16  
**CLI Commands Updated:** ✅

