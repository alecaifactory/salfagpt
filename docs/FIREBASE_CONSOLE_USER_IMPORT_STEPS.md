# Firebase Console - Manual User Import Steps

## 🎯 If You Choose Manual Import

This guide shows how to manually import the 43 Salfacorp users via Firebase Console.

**Time Required:** ~10-15 minutes  
**Difficulty:** Easy (copy-paste)

---

## 📋 Prerequisites

1. Access to Firebase Console
2. Project: gen-lang-client-0986191192
3. File: `scripts/salfacorp-users-import.json`

---

## 🔗 Access Firestore Console

**Direct Link:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fusers

**Steps:**
1. Open link above
2. You should see the `users` collection
3. Current users will be displayed

---

## ➕ Add Users (Repeat for Each User)

### For Each User in salfacorp-users-import.json:

#### Step 1: Start Adding Document

1. Click "**Add document**" button (top-right)
2. Modal opens: "Add a document to users"

#### Step 2: Set Document ID

**Document ID:** Convert email to ID format

**Formula:** Replace `@` and `.` with `_`

**Examples:**
- `nfarias@salfagestion.cl` → `nfarias_salfagestion_cl`
- `acastillo@salfagestion.cl` → `acastillo_salfagestion_cl`
- `mjaramillo@salfamontajes.com` → `mjaramillo_salfamontajes_com`

#### Step 3: Add Fields

Click "**Add field**" for each of these:

| Field Name | Type | Value (from JSON) |
|---|---|---|
| `email` | string | User's email (e.g., "nfarias@salfagestion.cl") |
| `name` | string | Full name (e.g., "Nenett Farias") |
| `role` | string | `user` |
| `roles` | array | Add one item (string): `user` |
| `company` | string | Company name (e.g., "Salfa Gestión") |
| `createdBy` | string | `alec@getaifactory.com` |
| `createdAt` | timestamp | Click "Set to current time" |
| `updatedAt` | timestamp | Click "Set to current time" |
| `isActive` | boolean | `true` |
| `agentAccessCount` | number | `0` |
| `contextAccessCount` | number | `0` |
| `permissions` | map | See permissions below ⬇️ |

#### Permissions Map (Add as nested fields)

Click on `permissions` → Add field for each:

| Field Name | Type | Value |
|---|---|---|
| `canCreateAgents` | boolean | `true` |
| `canDeleteOwnAgents` | boolean | `true` |
| `canViewOwnAgents` | boolean | `true` |
| `canUseAgents` | boolean | `true` |
| `canUploadContext` | boolean | `true` |
| `canDeleteOwnContext` | boolean | `true` |
| `canViewOwnContext` | boolean | `true` |
| `canUseContext` | boolean | `true` |
| `canSendMessages` | boolean | `true` |
| `canViewOwnConversations` | boolean | `true` |
| `canOrganizeInFolders` | boolean | `true` |

#### Step 4: Save Document

1. Click "**Save**" button
2. User document is created
3. Repeat for next user

---

## 🎬 Visual Example

### Document ID
```
nfarias_salfagestion_cl
```

### Fields
```
email (string):              "nfarias@salfagestion.cl"
name (string):               "Nenett Farias"
role (string):               "user"
roles (array):               ["user"]
company (string):            "Salfa Gestión"
createdBy (string):          "alec@getaifactory.com"
createdAt (timestamp):       October 22, 2025 at 10:30:00 AM UTC-3
updatedAt (timestamp):       October 22, 2025 at 10:30:00 AM UTC-3
isActive (boolean):          true
agentAccessCount (number):   0
contextAccessCount (number): 0
permissions (map):
  ├─ canCreateAgents (boolean):         true
  ├─ canDeleteOwnAgents (boolean):      true
  ├─ canViewOwnAgents (boolean):        true
  ├─ canUseAgents (boolean):            true
  ├─ canUploadContext (boolean):        true
  ├─ canDeleteOwnContext (boolean):     true
  ├─ canViewOwnContext (boolean):       true
  ├─ canUseContext (boolean):           true
  ├─ canSendMessages (boolean):         true
  ├─ canViewOwnConversations (boolean): true
  └─ canOrganizeInFolders (boolean):    true
```

---

## ⚡ Quick Copy-Paste Template

For faster manual import, use this template:

### 1. User: Nenett Farias

```
Document ID: nfarias_salfagestion_cl

email: nfarias@salfagestion.cl
name: Nenett Farias
role: user
roles: ["user"]
company: Salfa Gestión
createdBy: alec@getaifactory.com
isActive: true
agentAccessCount: 0
contextAccessCount: 0
```

Permissions: (Copy the permissions map above)

---

## 🔄 Bulk Import Alternative (Requires Permissions)

If you get project owner permissions, you can use:

```bash
# Deploy Firestore rules first
firebase deploy --only firestore:rules --project gen-lang-client-0986191192

# Then run automated script
npx tsx scripts/create-salfacorp-users-admin.ts
```

---

## ✅ Verification After Import

### Check Total Count

```bash
npx tsx -e "
import { getAllUsers } from './src/lib/firestore.js';
const users = await getAllUsers();
console.log('Total users:', users.length);
process.exit(0);
"
```

### Check Salfacorp Users

```bash
npx tsx -e "
import { getAllUsers } from './src/lib/firestore.js';
const users = await getAllUsers();
const salfacorp = users.filter(u => 
  u.company.toLowerCase().includes('salfa') ||
  u.company.toLowerCase().includes('fe grande') ||
  u.company.toLowerCase().includes('geovita') ||
  u.company.toLowerCase().includes('novatec') ||
  u.company.toLowerCase().includes('tecsa') ||
  u.company.toLowerCase().includes('maqsa') ||
  u.company.toLowerCase().includes('inoval') ||
  u.company.toLowerCase().includes('concagua')
);
console.log('Salfacorp users:', salfacorp.length);
salfacorp.forEach(u => console.log('-', u.email, '(' + u.company + ')'));
process.exit(0);
"
```

Expected: 43 Salfacorp users

---

## 📧 Next Steps After Creation

1. **Email Users:** Send login instructions
2. **Monitor Logins:** Track first logins
3. **Support:** Be available for questions
4. **Verify Access:** Ensure all users can login
5. **Adjust Roles:** If needed, use User Management panel

---

## 🎯 FINAL RECOMMENDATION

**✨ Use auto-creation on first login - it's the best approach:**

- No manual work needed
- Users self-service
- Proven and tested
- No permission issues
- Professional onboarding experience

**Just send users this:**
```
Visit https://your-url.com/chat
Click "Login with Google"
Use your corporate email
```

**System handles the rest!** ✅

---

**Date:** 2025-10-22  
**Status:** ✅ Ready for auto-creation  
**Alternative:** Manual import via Firebase Console  
**Automation:** Blocked by IAM permissions (not critical)

