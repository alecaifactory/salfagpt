# ✅ Correct UserId Approach - Google Numeric ID

**Date:** 2025-10-22  
**Status:** ✅ Implemented  
**Approach:** Use Google OAuth numeric ID for all data, email for UI selection

---

## 🎯 The Right Approach

### Use Google Numeric ID for Data Storage

**Why:**
- ✅ **Permanent** - Never changes even if user changes email
- ✅ **Unique** - Guaranteed unique across all Google users
- ✅ **Consistent** - Same ID across all Google services
- ❌ Email can change - User might update their email address

**Where to use:**
- ✅ Firestore `conversations.userId` field
- ✅ Firestore `messages.userId` field
- ✅ Firestore `context_sources.userId` field (if applicable)
- ✅ Agent share `sharedWith[].id` field
- ✅ All database queries
- ✅ JWT token `id` field

**Example:**
```typescript
userId: "114671162830729001607"  ← Google OAuth ID
```

---

### Use Email for User Selection (UI Only)

**Why:**
- ✅ **Human-readable** - Users recognize emails
- ✅ **Searchable** - Easy to find users
- ✅ **Familiar** - Standard UX pattern

**Where to use:**
- ✅ User selection dropdown/list
- ✅ Search functionality
- ✅ Display names
- ✅ "Shared by" labels

**Example:**
```
Select user: alec@salfacloud.cl
             ↓
Store in share: { type: 'user', id: '106389857986485785874' }
```

---

## 📊 Data Model

### Users Collection

**Document ID:** Email-based (for backward compat with existing code)
```
Document: alec_salfacloud_cl
```

**Document Fields:**
```typescript
{
  id: "alec_salfacloud_cl",     // Email-based (document ID)
  userId: "106389857986485785874", // ✅ Google numeric ID (for sharing)
  email: "alec@salfacloud.cl",
  name: "Alec Salfa",
  ...
}
```

---

### Agent Shares Collection

**Share document uses numeric IDs:**
```typescript
{
  id: "share-abc123",
  agentId: "fAPZHQaocTYLwInZlVaQ",
  ownerId: "114671162830729001607",  // ✅ Google numeric ID
  sharedWith: [
    {
      type: 'user',
      id: "106389857986485785874",  // ✅ Google numeric ID (not email!)
      accessLevel: 'use'
    }
  ],
  createdAt: timestamp
}
```

---

### Conversations Collection

**Uses numeric userId:**
```typescript
{
  id: "conv-xyz",
  userId: "114671162830729001607",  // ✅ Google numeric ID
  title: "My Conversation",
  ...
}
```

---

## 🔄 Complete Flow

### When Owner Shares Agent

```
1. User opens "Compartir Agente" modal
   ↓
2. Modal loads users from /api/users
   Response: [
     { 
       id: "alec_salfacloud_cl",        ← Email-based (for display)
       userId: "106389857986485785874",  ← Google numeric ID
       email: "alec@salfacloud.cl",
       name: "Alec Salfa"
     },
     ...
   ]
   ↓
3. UI shows: "☐ Alec Salfa (alec@salfacloud.cl)"
   ↓
4. User clicks checkbox
   ↓
5. toggleTarget extracts user.userId:
   selectedTargets: [{ 
     type: 'user', 
     id: "106389857986485785874"  ← Google numeric ID stored!
   }]
   ↓
6. User clicks "Compartir Agente"
   ↓
7. POST /api/agents/{id}/share
   Body: {
     sharedWith: [{ 
       type: 'user', 
       id: "106389857986485785874"  ← Google numeric ID
     }]
   }
   ↓
8. Firestore saves share with numeric ID ✅
```

---

### When Recipient Loads

```
1. User logs in as alec@salfacloud.cl
   ↓
2. JWT created with:
   {
     id: "106389857986485785874",  ← Google numeric ID
     email: "alec@salfacloud.cl"
   }
   ↓
3. Frontend loads:
   GET /api/agents/shared?userId=106389857986485785874
   ↓
4. getSharedAgents(userId) queries shares:
   WHERE sharedWith contains { 
     type: 'user', 
     id: "106389857986485785874"  ← MATCHES! ✅
   }
   ↓
5. Share found → Load agent → Display in UI ✅
```

---

## 🛠️ Implementation Details

### JWT Token Creation (auth/callback.ts)

```typescript
const userData = {
  id: userInfo.id,  // ✅ Google OAuth numeric ID
  email: userInfo.email,
  name: userInfo.name,
  ...
};

setSession({ cookies }, userData);
```

---

### Users API (Should return userId field)

```typescript
export async function getAllUsers(): Promise<User[]> {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,           // Email-based (Firestore document ID)
      userId: data.userId,  // ✅ Google numeric ID (from OAuth)
      email: data.email,
      ...
    };
  });
}
```

---

### Modal Toggle (Uses userId for sharing)

```typescript
const toggleTarget = (type: 'user' | 'group', id: string, user?: User) => {
  // ✅ For users: use user.userId (Google numeric ID)
  const targetId = type === 'user' && user?.userId ? user.userId : id;
  
  setSelectedTargets([...selectedTargets, { type, id: targetId }]);
  console.log('Added:', targetId, '(', user?.email, ')');
};
```

---

### Shared Agents Query (Uses numeric ID)

```typescript
export async function getSharedAgents(userId: string): Promise<Conversation[]> {
  // userId is Google numeric ID
  const shares = await firestore
    .collection('agent_shares')
    .get();
  
  const relevant = shares.filter(share => 
    share.sharedWith.some(target => 
      target.type === 'user' && target.id === userId  // ✅ Numeric match
    )
  );
  
  return relevant.map(share => getConversation(share.agentId));
}
```

---

## ✅ Benefits

### 1. Permanent IDs ✨
```
User changes email: john@company.com → john.smith@company.com
Google ID remains: 123456789 (unchanged)
Shares still work: ✅
```

### 2. Clean Separation
```
UI Layer:  Email (human-readable)
Data Layer: Numeric ID (permanent)
```

### 3. No Migration Needed
```
Existing data already uses numeric IDs ✅
Just needed to expose userId field in API
```

### 4. Standard Practice
```
Google OAuth best practice: Use 'sub' claim as primary identifier
Our approach: Use numeric ID everywhere
```

---

## 🧪 Testing

### Verify User Has userId Field

```
Console → Network → /api/users response:

{
  "users": [
    {
      "id": "alec_salfacloud_cl",        ← Firestore doc ID
      "userId": "106389857986485785874",  ← Google ID (should be present!)
      "email": "alec@salfacloud.cl",
      "name": "Alec Salfa"
    }
  ]
}
```

### If userId is missing:

User needs to **logout and re-login** so `upsertUserOnLogin` saves the Google ID:

```typescript
// auth/callback.ts line 75
firestoreUser = await upsertUserOnLogin(
  userInfo.email, 
  userInfo.name, 
  userInfo.id  ← This saves the Google numeric ID
);
```

---

### Verify Share Uses Numeric ID

```
Console when sharing:

Added target: { type: 'user', id: '106389857986485785874', email: 'alec@salfacloud.cl' }
                                    ↑ Should be numeric!
```

### Verify Loading Uses Numeric ID

```
Console when loading:

Loading shared agents for userId: 106389857986485785874
                                  ↑ Should be numeric!
```

---

## 📋 Files Modified

1. ✅ `src/pages/auth/callback.ts` - Use numeric ID in JWT
2. ✅ `src/pages/chat.astro` - Use numeric ID from JWT
3. ✅ `src/lib/firestore.ts` - Return userId field in getAllUsers()
4. ✅ `src/types/users.ts` - Add userId field to User interface
5. ✅ `src/components/AgentSharingModal.tsx` - Use user.userId when sharing

---

## ⚠️ Important Notes

### Users Must Have userId Field

For this to work, users need the `userId` field (Google numeric ID) in their Firestore document.

**How to ensure it:**
1. User logs out
2. User logs in (triggers `upsertUserOnLogin`)
3. Google numeric ID is saved to `userId` field
4. `/api/users` returns it
5. Sharing uses it ✅

**Check in Firestore Console:**
```
Collection: users
Document: alec_salfacloud_cl
Field: userId = "106389857986485785874"  ← Should exist!
```

**If missing:** User hasn't logged in since field was added. They need to re-login.

---

## ✅ Summary

**Correct Approach:**
- 🎯 **Data Layer:** Google OAuth numeric ID (permanent)
- 👤 **UI Layer:** Email + Name (human-readable)
- 🔄 **Conversion:** Modal converts email → numeric ID when saving

**This ensures:**
- ✅ Shares survive email changes
- ✅ IDs are permanent and unique
- ✅ UI is user-friendly
- ✅ Standard OAuth best practices

---

**Next:** Refresh browser and test! Your existing data will load, and sharing will use numeric IDs.

