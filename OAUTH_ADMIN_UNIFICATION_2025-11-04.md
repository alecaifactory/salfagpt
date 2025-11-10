# ✅ OAuth & Admin User Unification System

**Date:** November 4, 2025  
**Status:** ✅ Implemented  
**Impact:** Seamless unification of OAuth-first and admin-created users

---

## 🎯 System Overview

### The Unified Flow

Users can access the platform through **two paths**, both unified by email:

```
Path 1: OAuth-First (User-Initiated)
  User logs in via OAuth
    ↓
  Auto-create user with default role
    ↓
  User accesses platform (NO agents yet)
    ↓
  Admin later "upgrades" user with roles/agents
    ↓
  User sees assigned agents on next login

Path 2: Admin-First (Admin-Initiated)
  Admin creates user in User Management
    ↓
  Assigns roles and agents
    ↓
  User logs in via OAuth
    ↓
  System finds existing user (by email)
    ↓
  User immediately sees assigned agents

BOTH PATHS UNIFIED BY EMAIL ✅
```

---

## 🔑 Key Principle: Email as Universal Identifier

**Single Source of Truth:** User's email address

**Why this works:**
- OAuth provides email from Google account
- Admin provides email when creating user
- Same email = same person = unified record

**Implementation:**
```typescript
// OAuth login
const oauthEmail = userInfo.email; // from Google

// Admin creation
const adminEmail = formData.email; // from admin form

// Unification
if (oauthEmail === adminEmail) {
  // Same user, unified record ✅
}
```

---

## 🔄 User Lifecycle Scenarios

### Scenario 1: OAuth-First User

```
Day 1: User logs in via OAuth
  ↓
  upsertUserOnLogin(email) called
  ↓
  User NOT found by email
  ↓
  Create new user:
  {
    id: "usr_abc123",          // Random hash ID
    email: "user@company.com",
    name: "User Name",
    googleUserId: "123456789", // OAuth ID
    role: "user",              // Default role
    roles: ["user"],
    company: "Company",        // Auto-extracted from email
    createdBy: "oauth-system",
    createdAt: now,
    isActive: true,
    agentAccessCount: 0,       // NO agents yet
    contextAccessCount: 0
  }
  ↓
  User accesses platform
  ↓
  Sees: Empty agent list (no assignments yet)
  ✅ Can use platform, create conversations

---

Day 5: Admin assigns agents
  ↓
  Admin goes to User Management
  ↓
  Admin finds user by email: "user@company.com"
  ↓
  Admin clicks "Edit" or creates via "Crear Usuario"
  ↓
  createUser(email, name, roles, company) called
  ↓
  Function checks: getUserByEmail(email)
  ↓
  User FOUND (OAuth user exists)
  ↓
  UPDATE existing user:
  {
    // Keep same ID
    id: "usr_abc123",
    email: "user@company.com",
    
    // Update these fields
    role: "expert",            // Admin assigned
    roles: ["expert"],
    permissions: {...},        // Updated based on role
    company: "Updated Company",
    department: "Engineering",
    
    // Track admin management
    createdBy: "oauth-system", // Original
    adminUpdatedBy: "admin@company.com", // NEW
    adminUpdatedAt: now,       // NEW
    
    updatedAt: now
  }
  ↓
  Admin assigns agents to this user
  ↓
  Agent assignments stored with user email
  
---

Day 6: User logs in again
  ↓
  OAuth authentication
  ↓
  upsertUserOnLogin(email) called
  ↓
  User FOUND by email
  ↓
  Update lastLoginAt timestamp
  ↓
  Load user with updated roles/permissions
  ↓
  User accesses platform
  ↓
  Sees: Assigned agents ✅
  ✅ Full access with admin-assigned permissions
```

---

### Scenario 2: Admin-First User

```
Day 1: Admin creates user
  ↓
  createUser(email, name, roles, company) called
  ↓
  Function checks: getUserByEmail(email)
  ↓
  User NOT found
  ↓
  Create new user:
  {
    id: "usr_xyz789",
    email: "newuser@company.com",
    role: "expert",            // Admin assigned
    roles: ["expert"],
    permissions: {...},
    company: "Company",
    createdBy: "admin@company.com", // Admin created
    isActive: true,
    agentAccessCount: 0        // Will be updated when agents assigned
  }
  ↓
  Admin assigns agents to this email
  
---

Day 2: User logs in via OAuth (first time)
  ↓
  OAuth authentication
  ↓
  upsertUserOnLogin(email) called
  ↓
  User FOUND by email (admin-created)
  ↓
  Update:
  {
    googleUserId: "987654321", // Add OAuth ID
    lastLoginAt: now,
    updatedAt: now
    // Keep all admin-assigned roles/permissions
  }
  ↓
  User accesses platform
  ↓
  Sees: Assigned agents immediately ✅
  ✅ Full access with admin-assigned permissions
```

---

## 🔧 Implementation Details

### Key Functions

#### 1. `upsertUserOnLogin()` - OAuth Login Handler

**Location:** `src/lib/firestore.ts`

```typescript
export async function upsertUserOnLogin(
  email: string, 
  name: string, 
  googleUserId?: string
): Promise<User> {
  const existingUser = await getUserByEmail(email);
  
  if (existingUser) {
    // User exists (either OAuth or admin-created)
    // UPDATE: last login, Google OAuth ID
    // PRESERVE: roles, permissions, agent assignments
    await update({ lastLoginAt: now, googleUserId });
    return existingUser;
  } else {
    // User doesn't exist
    // CREATE: with default role, no agents
    const newUser = createWithDefaults(email, name, googleUserId);
    return newUser;
  }
}
```

**Behavior:**
- ✅ OAuth-first: Creates user with defaults
- ✅ Admin-first: Updates with OAuth ID
- ✅ Preserves admin assignments

---

#### 2. `createUser()` - Admin Creation Handler

**Location:** `src/lib/firestore.ts`

```typescript
export async function createUser(
  email: string,
  name: string,
  roles: UserRole[],
  company: string,
  createdBy?: string,
  department?: string
): Promise<User> {
  const existingUser = await getUserByEmail(email);
  
  if (existingUser) {
    // User exists (OAuth-created)
    // UPDATE: roles, permissions, company, department
    // TRACK: adminUpdatedBy, adminUpdatedAt
    // PRESERVE: id, email, googleUserId, createdAt
    await update({
      roles,
      permissions: getMergedPermissions(roles),
      adminUpdatedBy: createdBy,
      adminUpdatedAt: now
    });
    
    console.log('✅ OAuth user upgraded by admin');
    return updatedUser;
  } else {
    // User doesn't exist
    // CREATE: with admin-provided roles
    const newUser = create(email, name, roles, company);
    return newUser;
  }
}
```

**Behavior:**
- ✅ OAuth user exists: Upgrades with admin info
- ✅ New user: Creates from scratch
- ✅ Tracks admin management via `adminUpdatedBy`

---

### New Tracking Fields

Added to User schema:
```typescript
interface User {
  // ... existing fields
  
  // NEW: Track admin management of OAuth users
  adminUpdatedBy?: string;   // Admin email who upgraded OAuth user
  adminUpdatedAt?: Date;      // When admin took over management
}
```

**Purpose:** Distinguish between:
- Pure OAuth users: `createdBy = "oauth-system"`, no `adminUpdatedBy`
- Admin-upgraded OAuth users: `createdBy = "oauth-system"`, `adminUpdatedBy = "admin@..."`
- Pure admin users: `createdBy = "admin@..."`, no OAuth history

---

## 🎯 Access Control Rules

### Agent Assignments

**Key Principle:** Agents are assigned to **user email**, not user ID

**Why this works:**
```typescript
// Agent sharing/assignment
{
  agentId: "agent_123",
  sharedWithEmails: ["user@company.com"], // By EMAIL ✅
  // NOT by userId (which could differ)
}
```

**Result:**
- OAuth user with email X → sees agents assigned to email X
- Admin creates user with email X, assigns agents → same email X
- Both see same agents ✅

---

### Permission Hierarchy

```
1. Admin-assigned roles/permissions (if adminUpdatedBy exists)
   ↓ (highest priority)
   
2. Default roles from initial creation
   ↓ (fallback)
   
3. System defaults
   ↓ (last resort)
```

**Example:**
```typescript
// OAuth user created
createdBy: "oauth-system"
role: "user"  // Default

// Admin upgrades
adminUpdatedBy: "admin@company.com"
role: "expert"  // Admin-assigned (takes precedence)

// User sees: "expert" permissions ✅
```

---

## 📊 User Management UI Updates

### User List Display

**Shows creation origin:**
```
┌─────────────────────────────────────────────────────────┐
│ Email              │ Role   │ Created By      │ Status  │
├─────────────────────────────────────────────────────────┤
│ user1@company.com  │ expert │ OAuth → Admin   │ Active  │
│ user2@company.com  │ user   │ OAuth           │ Active  │
│ user3@company.com  │ admin  │ Admin           │ Active  │
└─────────────────────────────────────────────────────────┘
```

**Badge Logic:**
- "OAuth" - `createdBy = "oauth-system"`, no `adminUpdatedBy`
- "OAuth → Admin" - Both `createdBy = "oauth-system"` AND `adminUpdatedBy`
- "Admin" - `createdBy = admin email`

---

## 🧪 Testing Scenarios

### Test 1: OAuth-First, Then Admin Assignment

**Steps:**
1. User logs in via OAuth (never done before)
2. System creates user automatically
3. User sees empty agent list
4. Admin goes to User Management
5. Admin searches for user by email
6. Admin clicks "Edit" (user appears in list)
7. Admin assigns role "expert" and agents
8. User refreshes page or logs in again
9. User sees assigned agents ✅

**Expected Behavior:**
- ✅ OAuth login successful (auto-create)
- ✅ User can access platform immediately
- ✅ Admin can find and edit user
- ✅ Admin assignments persist
- ✅ User sees assignments on next login

---

### Test 2: Admin-First, Then OAuth Login

**Steps:**
1. Admin creates user in User Management
2. Admin assigns role "expert" and agents
3. User (never logged in before) attempts OAuth login
4. System finds user by email
5. System adds OAuth ID to existing record
6. User immediately sees assigned agents ✅

**Expected Behavior:**
- ✅ Admin creation successful
- ✅ Agent assignments stored
- ✅ First OAuth login updates OAuth ID
- ✅ User sees assigned agents immediately
- ✅ Roles/permissions from admin preserved

---

### Test 3: Multiple Login Cycles

**Steps:**
1. User logs in via OAuth → auto-created
2. User logs out
3. Admin assigns agents to email
4. User logs in via OAuth again
5. System updates user (same record, by email)
6. User sees assigned agents ✅

**Expected Behavior:**
- ✅ Same user record throughout
- ✅ Email links everything
- ✅ Assignments visible immediately

---

## 🔒 Security Maintained

### Access Control Unchanged

**Still enforced:**
- ✅ Domain must be enabled
- ✅ Email must be verified by Google
- ✅ HTTPS-only cookies
- ✅ JWT with expiration

**What changed:**
- ✅ Users auto-created on OAuth (like before)
- ✅ Admin can upgrade OAuth users (NEW)
- ✅ Unification tracked (NEW fields)

---

## 📝 Modified Files

### `src/lib/firestore.ts`

**Function:** `createUser()`

**Changes:**
- ✅ Check if user exists by email FIRST
- ✅ If exists: UPDATE (don't create duplicate)
- ✅ Track admin management: `adminUpdatedBy`, `adminUpdatedAt`
- ✅ Preserve OAuth history: keep `createdBy` original value

**Lines Modified:** ~60 lines (lines 915-959)

---

### `src/pages/auth/callback.ts`

**Changes:**
- ✅ Reverted to original behavior (allow OAuth auto-creation)
- ✅ Enhanced comments explaining unification logic
- ✅ Improved logging

**Lines Modified:** ~30 lines (lines 72-83)

---

## 🎯 How Unification Works

### Email-Based Matching

```typescript
// OAuth login
const oauthUser = {
  email: "user@company.com",  // ← KEY
  googleUserId: "123456789",
  createdBy: "oauth-system"
};

// Admin creates
const adminInput = {
  email: "user@company.com",  // ← SAME KEY
  roles: ["expert"],
  company: "Updated Company"
};

// Unification check
const existing = getUserByEmail("user@company.com");
if (existing) {
  // SAME RECORD - update it
  existing.roles = adminInput.roles;
  existing.adminUpdatedBy = currentAdmin;
}
```

**Result:** One user record, unified by email ✅

---

### Registry Tracking

**Purpose:** Know the user's journey

```typescript
// Pure OAuth user
{
  email: "user@company.com",
  createdBy: "oauth-system",
  adminUpdatedBy: undefined  // Never touched by admin
}

// OAuth user upgraded by admin
{
  email: "user@company.com",
  createdBy: "oauth-system",      // Original
  adminUpdatedBy: "admin@company.com", // Admin took over
  adminUpdatedAt: "2025-11-04T10:30:00Z"
}

// Pure admin user (never logged in via OAuth yet)
{
  email: "user@company.com",
  createdBy: "admin@company.com",
  googleUserId: undefined,    // No OAuth login yet
  lastLoginAt: undefined      // Never logged in
}
```

---

## 📊 Agent Assignment System

### How Agents Are Shared

**Collection:** `agent_sharing` or similar

```typescript
interface AgentSharing {
  agentId: string;
  sharedWithEmails: string[];  // ✅ By EMAIL, not userId
  permissions: string[];
}
```

**Query Logic:**
```typescript
// Get agents for user
function getUserAgents(userEmail: string) {
  return agents.where('sharedWithEmails', 'array-contains', userEmail);
}

// This works for:
// ✅ OAuth-first users (email in system)
// ✅ Admin-first users (email in system)
// ✅ Unified users (same email)
```

**Result:** Agent access is unified by email ✅

---

## 🔄 Complete User Journey Examples

### Example 1: Engineering Team Member

```
Monday: Sarah tries to login
  ↓
  OAuth with sarah@company.com
  ↓
  System: User not found, creating...
  ↓
  Created: { email: "sarah@company.com", role: "user", createdBy: "oauth-system" }
  ↓
  Sarah accesses platform: NO agents visible
  ↓
  Sarah can create conversations, explore

Tuesday: Admin adds Sarah to project
  ↓
  Admin goes to User Management
  ↓
  Admin sees Sarah (from OAuth auto-creation)
  ↓
  Admin clicks "Edit" on Sarah
  ↓
  Admin changes:
    - Role: user → expert
    - Assigns: Agent "M001", Agent "S001"
  ↓
  System updates Sarah's record:
    - roles: ["expert"]
    - adminUpdatedBy: "admin@company.com"
  ↓
  Agent assignments created:
    - M001.sharedWithEmails: [..., "sarah@company.com"]
    - S001.sharedWithEmails: [..., "sarah@company.com"]

Wednesday: Sarah logs in again
  ↓
  OAuth with sarah@company.com
  ↓
  System: User found (same email)
  ↓
  Update lastLoginAt
  ↓
  Load user: { role: "expert", roles: ["expert"] }
  ↓
  Query agents: WHERE sharedWithEmails contains "sarah@company.com"
  ↓
  Sarah sees: M001, S001 ✅
  ✅ Full access with expert permissions
```

---

### Example 2: Pre-Registered Contractor

```
Monday: Admin creates contractor account
  ↓
  Admin: "Crear Usuario"
    - Email: contractor@external.com
    - Role: context_reviewer
    - Assign: Agent "REVIEW-001"
  ↓
  System creates user:
  {
    email: "contractor@external.com",
    role: "context_reviewer",
    createdBy: "admin@company.com",
    googleUserId: undefined  // No OAuth yet
  }
  ↓
  Agent REVIEW-001 assigned to "contractor@external.com"

Tuesday: Contractor receives invitation email

Wednesday: Contractor logs in for first time
  ↓
  OAuth with contractor@external.com
  ↓
  System: User found by email (admin-created)
  ↓
  Update:
  {
    googleUserId: "555666777",  // Add OAuth ID
    lastLoginAt: now,
    // Keep admin-assigned roles/permissions
  }
  ↓
  Query agents: WHERE sharedWithEmails contains "contractor@external.com"
  ↓
  Contractor sees: REVIEW-001 immediately ✅
  ✅ Ready to work, no additional setup
```

---

## 🛡️ Backward Compatibility

### Existing Users

**Status:** ✅ Fully compatible

**Why:**
- All existing users already have email field
- OAuth flow unchanged (still auto-creates)
- Admin creation enhanced (now checks for duplicates)
- Agent assignments already by email

**Migration:** None needed ✅

---

## 📋 Admin Workflow Updates

### When Creating/Editing Users

**Admin UI should show:**
```
┌────────────────────────────────────────────┐
│ Email: user@company.com                    │
│                                            │
│ ℹ️  User Origin:                           │
│   Created: oauth-system (Oct 15)           │
│   Admin managed: admin@company.com (Nov 4) │
│                                            │
│ Current Status:                            │
│   Last Login: 2 hours ago                  │
│   OAuth ID: 123456789 ✅                   │
│   Active: ✅                                │
└────────────────────────────────────────────┘
```

**Indicates:**
- User's creation origin
- Whether admin has managed them
- OAuth connection status
- Last activity

---

## ✅ Verification Checklist

### System Behavior

- [x] OAuth users can login without pre-registration
- [x] OAuth users auto-created with default role
- [x] OAuth users start with NO agents
- [x] Admin can create users before OAuth login
- [x] Admin can edit OAuth-created users
- [x] Email is the unification key
- [x] Same email = same user record
- [x] Agent assignments work by email
- [x] Users see assignments regardless of creation path
- [x] Roles/permissions from admin are preserved
- [x] OAuth ID tracked for reference
- [x] Creation history maintained

---

## 🎓 Key Insights

### 1. Email is Permanent, IDs May Vary

**User Record ID:** Hash-based, random (e.g., `usr_abc123`)  
**Google OAuth ID:** Numeric, from Google (e.g., `123456789`)  
**Email:** The constant that links everything

**Unification Strategy:**
- Always query by email
- Always assign by email
- IDs are references, email is identity

---

### 2. Dual Creation Paths Merge

```
         OAuth Path              Admin Path
              ↓                       ↓
         Auto-create            Admin-create
              ↓                       ↓
              └───────┬───────────────┘
                      ↓
              Email Unification
                      ↓
              Single User Record
```

---

### 3. Agent Access is Email-Based

**No matter which path:**
- Agents assigned to email
- User logs in with email (via OAuth)
- System loads agents for that email
- User sees assignments ✅

---

## 🚀 Deployment Notes

### No Breaking Changes

**Existing behavior preserved:**
- ✅ OAuth login auto-creates (unchanged)
- ✅ Domain check still enforced
- ✅ Agent assignments still work
- ✅ Existing users unaffected

**New capabilities:**
- ✅ Admin can manage OAuth users
- ✅ Unification tracking
- ✅ Better audit trail

---

## 📚 Related Documentation

**Previous Work:**
- `AUTO_USER_CREATION_2025-10-14.md` - OAuth auto-creation
- `DOMAIN_MANAGEMENT_2025-10-21.md` - Domain system
- `docs/USER_MANAGEMENT_SYSTEM.md` - User management

**System Rules:**
- `.cursor/rules/privacy.mdc` - Data isolation
- `.cursor/rules/userpersonas.mdc` - Roles & permissions

---

## 🎯 Summary

### What This Achieves

✅ **Flexible Access:** Users can start via OAuth or admin creation  
✅ **Seamless Unification:** Both paths merge via email  
✅ **No Duplication:** Email matching prevents duplicate records  
✅ **Preserved History:** Track both OAuth and admin management  
✅ **Email-Based Assignments:** Agents assigned to email (not ID)  
✅ **Immediate Access:** Admin assignments visible on next login  

### System Flow

```
User Logs In (OAuth)
  ↓
Auto-create if new (default role, no agents)
  ↓
OR
  ↓
Find existing (by email) and update login timestamp
  ↓
Load permissions (OAuth default OR admin-assigned)
  ↓
Load agents (assigned to user's email)
  ↓
User sees personalized view ✅
```

---

**Last Updated:** 2025-11-04  
**Version:** 1.0.0  
**Status:** ✅ Implemented  
**Breaking Changes:** None  
**Backward Compatible:** Yes  
**Complies With Requirements:** ✅ Yes - OAuth-first access with admin unification




