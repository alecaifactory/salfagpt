# 🤝 Agent Sharing - Complete Implementation

**Date:** 2025-10-22  
**Status:** ✅ PRODUCTION READY  
**Feature:** Share agents with read-only access, users create private conversations

---

## 🎯 Overview

Enables sharing AI agents between users within an organization, allowing recipients to use the agent's configuration and context without modifying it, while maintaining complete privacy for their conversations.

---

## ✨ Key Features

### For Agent Owners

- ✅ **Share with specific users** - Select from organization directory
- ✅ **Share with groups** - Share with entire teams
- ✅ **Access level control** - Solo Ver, Usar, or Admin
- ✅ **Pre-assignment** - Assign before user's first login
- ✅ **View who has access** - See all shares in one place
- ✅ **Revoke access** - Remove access anytime with one click
- ✅ **Optional expiration** - Set automatic expiration dates

### For Recipients

- ✅ **See shared agents** - Separate "Agentes Compartidos" section
- ✅ **View configuration** - See model, system prompt (read-only)
- ✅ **View context** - See all context sources (read-only)
- ✅ **Create private chats** - Start unlimited conversations
- ✅ **Full privacy** - Owner cannot see recipient's messages

---

## 🏗️ Architecture

### User ID System

**Format:** Hash-based unique identifiers

```typescript
// Generated on user creation
userId = generateUserId(); // usr_k3n9x2m4p8q1w5z7y0

// Properties:
- Permanent (never changes)
- Independent of email
- URL-safe (lowercase + numbers)
- 24 characters (usr_ + 20 random)
- Collision-proof (36^20 possibilities)
```

**Benefits:**
1. ✅ Pre-assignment (assign before first login)
2. ✅ Email changes supported (ID stays same)
3. ✅ Privacy (email not in URLs/IDs)
4. ✅ Standard practice (industry best practice)

---

### Data Model

#### AgentShare (Firestore: `agent_shares` collection)

```typescript
interface AgentShare {
  id: string;                    // Share document ID
  agentId: string;               // Agent being shared
  ownerId: string;               // Creator's user ID (hash)
  sharedWith: Array<{
    type: 'user' | 'group';
    id: string;                  // User hash ID or group ID
  }>;
  accessLevel: 'view' | 'use' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;              // Optional expiration
  source: 'localhost' | 'production';
}
```

**Example:**
```json
{
  "id": "MyaAMrhHDNHBlnmwRLIo",
  "agentId": "fAPZHQaocTYLwInZlVaQ",
  "ownerId": "alec_getaifactory_com",
  "sharedWith": [{
    "type": "user",
    "id": "usr_g584q2jdqtdzqbvdyfoo"
  }],
  "accessLevel": "use",
  "createdAt": "2025-10-22T...",
  "updatedAt": "2025-10-22T..."
}
```

---

## 🎨 User Interface

### Sharing Modal

**Left Panel - Compartir con:**
- Tab selector: Grupos | Usuarios
- Search box: Filter users/groups
- User list: Checkboxes for selection
- Access level: Solo Ver | **Usar** | Admin
- Expiration: Optional date picker
- Share button: Creates the share

**Right Panel - Accesos Compartidos:**
- List of all current shares
- User/group name with icon
- Access level badge (colored)
- Share date
- Revoke button (red X)

**Access Levels:**
- **Solo Ver** (👁️ Blue) - View config and context only
- **Usar** (✏️ Green) - Create private conversations, can't modify
- **Admin** (🛡️ Purple) - Full control (view, use, modify, share, delete)

---

### Sidebar Display

**Owner sees:**
```
🤖 MIS AGENTES (5)
├─ SSOMA [Compartido]  ← Green badge
├─ M001
├─ M002
└─ ...
```

**Recipient sees:**
```
🤖 MIS AGENTES (0)

🤝 AGENTES COMPARTIDOS (1)
└─ SSOMA 👁️
   Compartido por alec@getaifactory.com
```

---

## 🔄 User Flows

### Flow 1: Admin Pre-Assigns Agent

```
1. Admin creates user via User Management panel
   POST /api/users
   { email: "newuser@company.com", name: "New User" }
   ↓
   User created with hash ID: usr_a7b2c9d4e1f6g3h8i5
   
2. Admin opens agent (e.g., "SSOMA")
   Click ⋮ menu → "Compartir Agente"
   
3. Modal opens
   Tab: Usuarios (default)
   Search: "newuser@company.com"
   
4. Select user
   Checkbox ✅ next to user
   Access: "Usar" (default - green)
   
5. Click "Compartir Agente"
   Share saved with: id = "usr_a7b2c9d4e1f6g3h8i5"
   ✅ Pre-assigned before user ever logs in!

6. Days/weeks later, user logs in for first time
   OAuth → getUserByEmail("newuser@company.com")
   → Finds usr_a7b2c9d4e1f6g3h8i5
   → Loads shared agents
   → ✅ SSOMA immediately visible!
```

---

### Flow 2: User Uses Shared Agent

```
1. Recipient logs in
   Sidebar shows:
   🤝 AGENTES COMPARTIDOS (1)
   └─ SSOMA 👁️

2. Click on SSOMA
   Sees:
   - Model: Gemini 2.5 Flash (grayed out)
   - System Prompt: "Eres..." (grayed out)
   - Context: Manual.pdf, Políticas.pdf (grayed out)
   - [🟣 Nuevo Chat con SSOMA] button

3. Click "Nuevo Chat con SSOMA"
   Creates new conversation:
   {
     userId: "usr_a7b2c9d4e1f6g3h8i5",  ← Recipient owns this
     agentId: "agent-ssoma",             ← References shared agent
     isAgent: false,                     ← This is a chat
     title: "Chat con SSOMA"
   }
   
4. Chat inherits from SSOMA:
   - Model: Gemini 2.5 Flash
   - System Prompt: SSOMA's prompt
   - Context: SSOMA's context sources
   
5. User sends message
   AI responds using SSOMA's configuration
   ✅ Owner CANNOT see these messages (private!)
```

---

### Flow 3: Owner Revokes Access

```
1. Owner opens "Compartir Agente" modal
   
2. Right panel shows:
   Accesos Compartidos (1)
   👤 New User
      [Usar agente]  [X]  ← Click this

3. Confirmation: "¿Revocar este acceso compartido?"
   
4. Click OK
   Share document deleted
   
5. Recipient's view updates:
   - SSOMA disappears from "Agentes Compartidos"
   - Existing chats remain (recipient owns them)
   - Cannot create new chats with SSOMA
   ✅ Access revoked!
```

---

## 🔐 Security & Privacy

### Data Isolation

**Owner's data:**
- Conversations with SSOMA
- Messages in those conversations
- Agent configuration
- Context sources

**Recipient's data:**
- Their own conversations with shared SSOMA
- Their messages (completely private)
- Cannot see owner's conversations ✅

### Access Control

**"Usar" level (recommended):**
- ✅ Can view agent config (read-only)
- ✅ Can view context sources (read-only)
- ✅ Can create private conversations
- ✅ Can send messages
- ❌ Cannot modify agent config
- ❌ Cannot modify context sources
- ❌ Cannot share further
- ❌ Cannot delete agent

---

## 🛠️ Technical Implementation

### Key Functions

#### shareAgent()
```typescript
export async function shareAgent(
  agentId: string,
  ownerId: string,
  sharedWith: Array<{ type: 'user' | 'group'; id: string }>,
  accessLevel: 'view' | 'use' | 'admin',
  expiresAt?: Date
): Promise<AgentShare>
```

**Location:** `src/lib/firestore.ts`

---

#### getSharedAgents()
```typescript
export async function getSharedAgents(
  userId: string,
  userEmail?: string
): Promise<Conversation[]>
```

**Process:**
1. Resolve user's hash ID from email
2. Get user's group memberships
3. Find all shares matching user or groups
4. Load the actual agent documents
5. Return as conversations with `isShared: true`

**Location:** `src/lib/firestore.ts`

---

#### getUserByEmail()
```typescript
export async function getUserByEmail(
  email: string
): Promise<User | null>
```

**Process:**
1. Query users collection by email field
2. Returns user with hash-based ID
3. Works even if document ID format varies

**Location:** `src/lib/firestore.ts`

---

### API Endpoints

#### POST /api/agents/:id/share
Create a new share

**Request:**
```json
{
  "ownerId": "alec_getaifactory_com",
  "sharedWith": [{
    "type": "user",
    "id": "usr_g584q2jdqtdzqbvdyfoo"
  }],
  "accessLevel": "use",
  "expiresAt": "2026-01-01T00:00:00Z" // optional
}
```

**Response:**
```json
{
  "share": {
    "id": "MyaAMrhHDNHBlnmwRLIo",
    "agentId": "fAPZHQaocTYLwInZlVaQ",
    ...
  }
}
```

---

#### GET /api/agents/:id/share
Get all shares for an agent

**Response:**
```json
{
  "shares": [
    {
      "id": "share1",
      "sharedWith": [{ "type": "user", "id": "usr_..." }],
      "accessLevel": "use"
    }
  ]
}
```

---

#### GET /api/agents/shared?userId=X&userEmail=Y
Get all agents shared with a user

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-ssoma",
      "title": "SSOMA",
      "isShared": true,
      ...
    }
  ]
}
```

---

#### DELETE /api/agents/:id/share?shareId=X
Revoke a share

**Response:**
```json
{
  "success": true
}
```

---

## 📋 Files Modified

### Core Implementation
1. ✅ `src/lib/firestore.ts`
   - `generateUserId()` - Hash ID generation
   - `createUser()` - Uses hash IDs
   - `upsertUserOnLogin()` - Looks up by email
   - `getUserByEmail()` - Queries by email field
   - `getSharedAgents()` - Resolves hash ID from email
   - `shareAgent()` - Creates shares
   - `getAgentShares()` - Lists shares
   - `deleteAgentShare()` - Revokes shares

2. ✅ `src/components/AgentSharingModal.tsx`
   - User selection UI
   - Share creation
   - Access level selection
   - Existing shares display
   - Revoke functionality

3. ✅ `src/pages/api/agents/[id]/share.ts`
   - POST - Create share
   - GET - List shares
   - DELETE - Revoke share

4. ✅ `src/pages/api/agents/shared.ts`
   - GET - List shared agents for user

5. ✅ `src/components/ChatInterfaceWorking.tsx`
   - Load shared agents
   - Display "Agentes Compartidos" section
   - Handle shared agent selection

6. ✅ `src/types/users.ts`
   - User interface with userId field

7. ✅ `src/pages/auth/callback.ts`
   - User creation on OAuth login

8. ✅ `src/pages/chat.astro`
   - Pass userId and userEmail to components

---

## 🧪 Testing

### Test 1: Pre-Assignment ✅ PASSED
```
✅ Admin creates user
✅ Admin shares agent
✅ User logs in later
✅ Shared agent appears immediately
```

### Test 2: User Selection ✅ PASSED
```
✅ User list loads
✅ Checkboxes are clickable
✅ Search filters users
✅ Selected users shown in summary
```

### Test 3: Sharing ✅ PASSED
```
✅ Share button enabled when user selected
✅ Hash ID used (usr_...)
✅ Share saved successfully
✅ Right panel updates
✅ Success message shown
```

### Test 4: Display ✅ PASSED
```
✅ Shared agent shows with "Compartido" badge
✅ Count includes shared agents
✅ Agent displays in sidebar
```

### Test 5: Privacy ✅ PASSED
```
✅ Hash IDs don't expose email
✅ Recipient's conversations are private
✅ Owner cannot see recipient's chats
```

---

## 📖 User Guide

### How to Share an Agent

1. **Open agent** you want to share
2. **Click settings menu** (⋮) → "Compartir Agente"
3. **Select users** - Check boxes next to users
4. **Choose access level:**
   - **Usar** (recommended) - Can create private conversations
   - Solo Ver - View only
   - Admin - Full control
5. **Click "Compartir Agente"**
6. ✅ Done! User will see it when they log in

### How to Revoke Access

1. **Open sharing modal** for the agent
2. **Right panel** shows "Accesos Compartidos"
3. **Click red X** next to user/group
4. **Confirm** revocation
5. ✅ Access removed immediately

### How to Use a Shared Agent

1. **Login** to Flow
2. **Sidebar** shows "🤝 AGENTES COMPARTIDOS"
3. **Click** on shared agent
4. **Click** "Nuevo Chat con [Agent Name]"
5. **Start chatting** - uses agent's config and context
6. **Your messages are private** - only you can see them

---

## 🎯 Best Practices

### When to Use Each Access Level

**Usar (Recommended)** ✏️
- Use case: Team members need access to expert agent
- Example: Technical support agent shared with support team
- Recipients: Can use but not break the agent
- Perfect for: Most sharing scenarios

**Solo Ver** 👁️
- Use case: Documentation/reference only
- Example: "See how I configured this agent"
- Recipients: View-only access
- Rare use case

**Admin** 🛡️
- Use case: Co-management with trusted users
- Example: Team leads managing shared agent together
- Recipients: Full control (can modify everything)
- Use sparingly: High trust required

---

### Recommended Workflow

**For Organizations:**
```
1. Admin creates standard users
2. Admin creates specialized agents (sales, support, HR, etc.)
3. Admin shares appropriate agents with each team
4. Users log in and agents are ready to use
5. Admin monitors usage and adjusts access as needed
```

**For Teams:**
```
1. Team lead creates domain-specific agent
2. Configures with team's context (manuals, policies, etc.)
3. Shares with "Usar" access to all team members
4. Team members create private conversations
5. Team lead updates agent config as needed
6. Updates automatically available to all users
```

---

## 🔧 Maintenance

### Email Changes

If a user changes their email:

```sql
UPDATE users SET email = 'newemail@company.com' 
WHERE id = 'usr_g584q2jdqtdzqbvdyfoo';
```

**Result:**
- ✅ User ID unchanged (usr_g584...)
- ✅ All shares still work
- ✅ User logs in with new email
- ✅ System finds them by new email
- ✅ No re-assignment needed

---

### Audit Trail

Check who has access to an agent:
```typescript
const shares = await getAgentShares(agentId);
// Returns all shares for this agent
```

Check what agents a user has access to:
```typescript
const agents = await getSharedAgents(userId, userEmail);
// Returns all shared agents for this user
```

---

## 📊 Analytics

Track sharing metrics (future):
- Number of shares per agent
- Most shared agents
- Access level distribution
- Share expiration compliance
- Usage by shared users

---

## 🚀 Future Enhancements

### Short-term (1-2 months)
- [ ] Share notifications (email/in-app)
- [ ] Batch sharing (share with multiple users at once)
- [ ] Share templates (pre-configured access patterns)
- [ ] Usage analytics (track shared agent usage)

### Medium-term (3-6 months)
- [ ] Share with external users (outside organization)
- [ ] Share links (shareable URLs with token)
- [ ] Share audit log (who shared what, when)
- [ ] Share permissions inheritance (from groups)

### Long-term (6-12 months)
- [ ] Agent marketplace (public shared agents)
- [ ] Agent versioning (share specific versions)
- [ ] Collaborative editing (multiple admins)
- [ ] Share analytics dashboard

---

## ✅ Success Criteria

A fully working agent sharing system should:

### Functionality ✅
- [x] Admin can share agents with users
- [x] Admin can share before user's first login
- [x] Recipients see shared agents
- [x] Recipients can create private conversations
- [x] Owner can revoke access
- [x] Access levels work correctly

### Privacy ✅
- [x] Hash IDs protect email privacy
- [x] Recipient's conversations are private
- [x] Owner cannot access recipient's chats
- [x] Clear attribution (shared by X)

### UX ✅
- [x] User selection is easy (search + checkboxes)
- [x] Default settings are sensible (Usar access)
- [x] Clear descriptions of access levels
- [x] Right panel shows who has access
- [x] Revoke is one click

### Technical ✅
- [x] Hash-based IDs (permanent, secure)
- [x] Email lookup (flexible)
- [x] Backward compatible (existing users work)
- [x] Performant (indexed queries)
- [x] Clean code (well-documented)

---

## 📚 Related Documentation

- `AGENT_SHARING_FIX_2025-10-22.md` - Initial fixes
- `AGENT_SHARING_QUICK_GUIDE.md` - User guide
- `HASH_BASED_USER_IDS_2025-10-22.md` - ID system details
- `CORRECT_USERID_APPROACH_2025-10-22.md` - Architecture decisions
- `.cursor/rules/agents.mdc` - Agent architecture
- `.cursor/rules/privacy.mdc` - Privacy requirements

---

## 🎉 Conclusion

**Agent sharing is fully functional and production-ready!**

Key achievements:
- ✅ Simple, clean UI
- ✅ Supports pre-assignment
- ✅ Email-independent IDs
- ✅ Complete privacy
- ✅ Backward compatible
- ✅ Industry best practices

**Ready for production deployment!** 🚀

---

**Last Updated:** 2025-10-22  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Tested:** ✅ All flows verified

