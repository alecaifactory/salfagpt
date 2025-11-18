# 🔍 MAQSA Users Diagnosis - Why They Don't See Agents

**Date:** November 4, 2025  
**Issue:** Users iojedaa@maqsa.cl, vclarke@maqsa.cl, salegria@maqsa.cl report not seeing agents  
**Root Cause:** ❌ **NO AGENT ASSIGNMENTS IN `agent_shares` COLLECTION**

---

## 📊 Investigation Results

### User 1: iojedaa@maqsa.cl - INGRID OJEDA ALVARADO

```
════════════════════════════════════════════════════════════
PROFILE INFORMATION
════════════════════════════════════════════════════════════
✅ Status:           EXISTS IN SYSTEM
   Document ID:      usr_mawxi3m5fubitxgl6d4m
   Email:           iojedaa@maqsa.cl
   Name:            INGRID OJEDA ALVARADO
   Role:            user
   Company:         Maqsa
   Department:      Negocio
   Active:          ✅ Yes

════════════════════════════════════════════════════════════
CREATION & LOGIN
════════════════════════════════════════════════════════════
Creation Method:     👤 ADMIN-CREATED
Created By:         alec@getaifactory.com
Created At:         2025-11-04 at 12:48:23 UTC
                    (Today, 6:48 AM Chile Time)

OAuth Status:       ❌ Never logged in via OAuth
Google ID:          Not set (user hasn't logged in yet)
Last Login:         ❌ NEVER

════════════════════════════════════════════════════════════
AGENT ASSIGNMENTS
════════════════════════════════════════════════════════════
❌ NO AGENTS ASSIGNED

Checked Collections:
  • agent_shares:   0 records (sharedWith.id = usr_mawxi3m5fubitxgl6d4m)
  • agent_sharing:  0 records (sharedWithEmails contains email)
  • agent_access:   0 records (userEmail = email)

Result: User has NO access to any agents

════════════════════════════════════════════════════════════
WHY USER DOESN'T SEE AGENTS
════════════════════════════════════════════════════════════
ROOT CAUSE: No agent_shares records exist for this user

When user logs in, the system queries:
  
  getSharedAgents(userId) 
    ↓
  Queries: agent_shares WHERE sharedWith contains {type:'user', id:userId}
    ↓
  Returns: [] (empty array)
    ↓
  UI shows: No shared agents

FIX: Admin must share agents with usr_mawxi3m5fubitxgl6d4m
```

---

### User 2: vclarke@maqsa.cl - VClarke

```
════════════════════════════════════════════════════════════
PROFILE INFORMATION
════════════════════════════════════════════════════════════
✅ Status:           EXISTS IN SYSTEM
   Document ID:      usr_4bp9uq03gs6aqgpa9fv9
   Email:           vclarke@maqsa.cl
   Name:            VClarke
   Role:            user
   Company:         Maqsa
   Department:      Negocioo (note typo)
   Active:          ✅ Yes

════════════════════════════════════════════════════════════
CREATION & LOGIN
════════════════════════════════════════════════════════════
Creation Method:     👤 ADMIN-CREATED
Created By:         alec@getaifactory.com
Created At:         2025-11-04 at 14:07:10 UTC
                    (Today, 8:07 AM Chile Time)

OAuth Status:       ❌ Never logged in via OAuth
Google ID:          Not set (user hasn't logged in yet)
Last Login:         ❌ NEVER

════════════════════════════════════════════════════════════
AGENT ASSIGNMENTS
════════════════════════════════════════════════════════════
❌ NO AGENTS ASSIGNED

Checked Collections:
  • agent_shares:   0 records (sharedWith.id = usr_4bp9uq03gs6aqgpa9fv9)
  • agent_sharing:  0 records (sharedWithEmails contains email)
  • agent_access:   0 records (userEmail = email)

Result: User has NO access to any agents

════════════════════════════════════════════════════════════
WHY USER DOESN'T SEE AGENTS
════════════════════════════════════════════════════════════
ROOT CAUSE: No agent_shares records exist for this user

When user logs in, the system queries:
  
  getSharedAgents(userId)
    ↓
  Queries: agent_shares WHERE sharedWith contains {type:'user', id:userId}
    ↓
  Returns: [] (empty array)
    ↓
  UI shows: No shared agents

FIX: Admin must share agents with usr_4bp9uq03gs6aqgpa9fv9
```

---

### User 3: salegria@maqsa.cl

```
════════════════════════════════════════════════════════════
PROFILE INFORMATION
════════════════════════════════════════════════════════════
❌ Status:           NOT FOUND IN SYSTEM

User does not exist in Firestore users collection

════════════════════════════════════════════════════════════
WHY USER DOESN'T EXIST
════════════════════════════════════════════════════════════
POSSIBLE REASONS:
1. User has never logged in via OAuth
2. Admin has not created this user manually
3. User attempted login from disabled domain (blocked)
4. Typo in email address

════════════════════════════════════════════════════════════
FIX REQUIRED
════════════════════════════════════════════════════════════
Option 1: User Logs In First (OAuth-first)
  1. User goes to: https://salfagpt.salfagestion.cl
  2. Clicks "Continuar con Google"
  3. Logs in with: salegria@maqsa.cl
  4. System auto-creates user
  5. Admin then shares agents

Option 2: Admin Creates User Now (Admin-first)
  1. Go to User Management
  2. Click "Crear Usuario"
  3. Email: salegria@maqsa.cl
  4. Name: [User's full name]
  5. Role: user (or appropriate role)
  6. Company: Maqsa
  7. Click "Crear"
  8. Then share agents with this user
  9. User can login anytime after
```

---

## 🚨 **ROOT CAUSE: Agent Sharing Not Completed**

### The Real Problem

**Admin created users** ✅ (2/3 users found)  
**BUT:** Admin did NOT share any agents ❌

**What's Missing:**

Documents in `agent_shares` collection like this:

```typescript
// Example: What SHOULD exist but DOESN'T
{
  id: "share_abc123",
  agentId: "M001",  // Or whichever agent
  ownerId: "admin_user_id",
  sharedWith: [
    { 
      type: 'user', 
      id: 'usr_mawxi3m5fubitxgl6d4m'  // ← iojedaa@maqsa.cl
    },
    {
      type: 'user',
      id: 'usr_4bp9uq03gs6aqgpa9fv9'  // ← vclarke@maqsa.cl
    }
  ],
  accessLevel: 'view', // or 'use'
  createdAt: "2025-11-04...",
  status: "active"
}
```

**Current Reality:** ❌ NO such documents exist

---

## 🔧 **How to Fix (Step-by-Step Guide)**

### Step 1: Identify Which Agents to Share

**First, answer these questions:**
1. Which agents should iojedaa@maqsa.cl access?
2. Which agents should vclarke@maqsa.cl access?
3. Which agents should salegria@maqsa.cl access?

**Examples:**
- M001 - Manual Operativo Maquinaria
- S001 - Sistema de Gestión SSOMA
- M002 - Procedimientos Mantenimiento
- etc.

---

### Step 2: Share Agents via UI

**For each agent and each user:**

1. **Login as admin**
   - Go to https://salfagpt.salfagestion.cl
   - Login with admin@salfacorp.com (or your admin account)

2. **Navigate to agent**
   - Go to agent list
   - Find the agent (e.g., M001)
   - Click on agent or open settings

3. **Open sharing modal**
   - Look for "Compartir" or "Share" button
   - Click to open AgentSharingModal

4. **Add users**
   - Search/select: iojedaa@maqsa.cl
   - Search/select: vclarke@maqsa.cl
   - Search/select: salegria@maqsa.cl (after creating user)
   - Set access level: "view" or "use"
   - Click "Guardar" or "Save"

5. **Verify assignment**
   - Check that user appears in "Compartido con" list
   - Firestore should have new document in `agent_shares`

---

### Step 3: Create Missing User (salegria@maqsa.cl)

**Before sharing agents with salegria@maqsa.cl:**

1. Go to "Gestión de Usuarios"
2. Click "Crear Usuario"
3. Fill in form:
   ```
   Email: salegria@maqsa.cl
   Name: [Their full name]
   Roles: ["user"]
   Company: Maqsa
   Department: [Their department]
   Active: ✅ (checked)
   ```
4. Click "Crear"
5. User will be created with hash ID (e.g., usr_abc123...)
6. Now you can share agents with this user ID

---

### Step 4: Notify Users

**Email template:**

```
Hola [Name],

Tu acceso a SalfaGPT está listo.

URL: https://salfagpt.salfagestion.cl

Instrucciones:
1. Haz clic en "Continuar con Google"
2. Usa tu correo: [their-email]@maqsa.cl
3. Verás los agentes asignados en tu panel

Agentes asignados:
- [Agent name 1]
- [Agent name 2]
- etc.

Si tienes problemas, contáctame.

Saludos,
[Admin name]
```

---

## 🔍 **Alternative: Programmatic Agent Assignment**

### If you know which agents to assign, I can create a script

**Tell me:**
```
iojedaa@maqsa.cl needs access to:
  - Agent ID: [?]
  - Agent ID: [?]

vclarke@maqsa.cl needs access to:
  - Agent ID: [?]
  - Agent ID: [?]

salegria@maqsa.cl needs access to:
  - Agent ID: [?]
  - Agent ID: [?]
```

**I'll create a script that:**
1. Creates salegria user (if needed)
2. Creates agent_shares documents
3. Adds all three users to sharedWith arrays
4. Verifies assignments work

---

## 📋 **Current System State**

### Users Table

| Email | ID | Created By | Logged In | Agents | Status |
|-------|----|-----------|-----------| -------|--------|
| iojedaa@maqsa.cl | usr_mawxi3m5fubitxgl6d4m | Admin | ❌ Never | ❌ 0 | Ready for login |
| vclarke@maqsa.cl | usr_4bp9uq03gs6aqgpa9fv9 | Admin | ❌ Never | ❌ 0 | Ready for login |
| salegria@maqsa.cl | - | - | - | - | ❌ Not created |

### Agent Shares Table

| Agent | Shared With | Records Found |
|-------|-------------|---------------|
| All agents | iojedaa@maqsa.cl | ❌ 0 |
| All agents | vclarke@maqsa.cl | ❌ 0 |
| All agents | salegria@maqsa.cl | ❌ N/A |

---

## 🎯 **What Needs to Happen**

### Summary:

1. **Create salegria@maqsa.cl user** (missing)
2. **Share agents with all three users** (none assigned)
3. **Notify users to login** (only 2 can login currently)
4. **Users login** → See assigned agents ✅

---

## 🔧 **Technical Details for Reference**

### Agent Sharing System Architecture

**Collection:** `agent_shares`

**Document Structure:**
```typescript
{
  id: string,
  agentId: string,  // The agent being shared
  ownerId: string,  // Who owns the agent
  sharedWith: [
    { type: 'user', id: 'usr_hashbasedid' },  // ← User hash ID
    { type: 'group', id: 'group_123' }
  ],
  accessLevel: 'view' | 'use' | 'admin',
  createdAt: Date,
  status: 'active'
}
```

**User Access Query:**
```typescript
// When user logs in with email
const user = await getUserByEmail(userEmail);  // Get hash ID
const shares = await getSharedAgents(user.id); // Query by hash ID

// Query looks for:
agent_shares WHERE sharedWith contains {type:'user', id:user.id}
```

**Current Reality for MAQSA users:**
```typescript
getSharedAgents('usr_mawxi3m5fubitxgl6d4m')
  → Returns: [] (no shares found)

getSharedAgents('usr_4bp9uq03gs6aqgpa9fv9')
  → Returns: [] (no shares found)
```

---

## 💡 **Quick Action Plan**

### Option 1: Manual (via UI) - Recommended for Small Number of Agents

1. List agents these users need
2. Open each agent
3. Click "Compartir"
4. Add users:
   - iojedaa@maqsa.cl
   - vclarke@maqsa.cl
   - salegria@maqsa.cl (after creating)
5. Save
6. Verify in Firestore

**Time:** ~5 minutes per agent

---

### Option 2: Programmatic (via Script) - Faster for Many Agents

**Tell me:**
- Agent IDs or names to assign
- Access level (view/use/admin)

**I'll create:**
- Script to create agent_shares records
- Bulk assignment for all three users
- Verification check

**Time:** ~2 minutes total (automated)

---

## 🎯 **Specific Actions Needed**

### For iojedaa@maqsa.cl (usr_mawxi3m5fubitxgl6d4m)

**Current State:**
- ✅ User exists
- ✅ Account active
- ❌ Never logged in
- ❌ No agents assigned

**Required Actions:**
1. [ ] Share agent(s) with user ID: `usr_mawxi3m5fubitxgl6d4m`
2. [ ] Notify user to login at https://salfagpt.salfagestion.cl
3. [ ] User logs in → agents should appear

---

### For vclarke@maqsa.cl (usr_4bp9uq03gs6aqgpa9fv9)

**Current State:**
- ✅ User exists
- ✅ Account active
- ❌ Never logged in
- ❌ No agents assigned

**Required Actions:**
1. [ ] Share agent(s) with user ID: `usr_4bp9uq03gs6aqgpa9fv9`
2. [ ] Notify user to login at https://salfagpt.salfagestion.cl
3. [ ] User logs in → agents should appear

---

### For salegria@maqsa.cl (NOT IN SYSTEM)

**Current State:**
- ❌ User does NOT exist
- Cannot assign agents yet (no user ID)

**Required Actions:**
1. [ ] Create user in User Management
2. [ ] Note the generated user ID (usr_xxxx...)
3. [ ] Share agent(s) with that user ID
4. [ ] Notify user to login
5. [ ] User logs in → agents should appear

---

## 📊 **Timeline**

### Today (2025-11-04)

**12:48 UTC (6:48 AM Chile):**
- Admin created iojedaa@maqsa.cl
- ❌ Did not assign agents

**14:07 UTC (8:07 AM Chile):**
- Admin created vclarke@maqsa.cl  
- ❌ Did not assign agents

**Current Time:**
- Users report not seeing agents
- Investigation reveals: No assignments exist
- Root cause identified ✅

---

## 🎓 **System Behavior Explained**

### How Agent Access Works

```
User logs in
  ↓
System loads user by email → Gets hash ID (usr_abc123...)
  ↓
System queries: agent_shares WHERE sharedWith contains usr_abc123
  ↓
For MAQSA users: Returns [] (empty)
  ↓
UI shows: "No shared agents" ❌
```

### What Needs to Exist

```
admin_shares collection should have:
  
Document 1: share_agent_M001
{
  agentId: "M001",
  sharedWith: [
    { type: 'user', id: 'usr_mawxi3m5fubitxgl6d4m' },  ← iojedaa
    { type: 'user', id: 'usr_4bp9uq03gs6aqgpa9fv9' }   ← vclarke
  ],
  accessLevel: 'view'
}

Document 2: share_agent_S001
{
  agentId: "S001",
  sharedWith: [
    { type: 'user', id: 'usr_mawxi3m5fubitxgl6d4m' },  ← iojedaa
    { type: 'user', id: 'usr_4bp9uq03gs6aqgpa9fv9' }   ← vclarke
  ],
  accessLevel: 'view'
}

etc.
```

**Current Reality:** These documents DO NOT exist

---

## ✅ **Next Steps**

### Tell me which agents to assign, and I'll help you:

**Option A:** Manual UI walkthrough (I'll guide you step-by-step)

**Option B:** Automated script (I'll create it, you run it)

**Information needed:**
1. Agent IDs or names for each user
2. Access level (view, use, or admin)
3. Whether you want same agents for all three users or different

---

**Example:**

If you want all three users to access agents M001 and S001 with "view" access, tell me:

```
All three users need:
- M001 (view access)
- S001 (view access)
```

And I'll create either:
- A step-by-step UI guide
- OR an automated assignment script

---

**Last Updated:** 2025-11-04  
**Investigation:** Complete  
**Diagnosis:** Agent assignments missing  
**Fix:** Pending (awaiting agent IDs from you)








