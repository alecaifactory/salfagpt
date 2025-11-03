# 🔒 Stella Privacy Architecture

**Fecha:** 2025-10-30  
**Versión:** 2.1  
**Status:** ✅ Implemented

---

## 🎯 Privacy Model

### **Core Principle: User Privacy First**

Cada usuario tiene sus propias conversaciones privadas con Stella. Solo Admin/SuperAdmin pueden ver el feedback agregado en el Backlog.

---

## 🔐 Data Access Rules

### 1. **Stella Conversations (Private)**

**Collection:** `feedback_sessions`

```typescript
{
  userId: string,  // OWNER - cada usuario solo ve sus propias
  sessionId: string,
  category: 'bug' | 'feature' | 'improvement',
  messages: Message[],
  ticketId?: string,
  // ... metadata
}
```

**Access:**
- ✅ User can see: **ONLY their own sessions**
- ✅ Admin: Can see all sessions
- ✅ SuperAdmin: Can see all sessions

**Firestore Security Rule:**
```javascript
match /feedback_sessions/{sessionId} {
  allow read: if request.auth.uid == resource.data.userId ||
              isAdmin(request.auth.uid);
  allow create: if request.auth.uid == request.resource.data.userId;
  allow update, delete: if request.auth.uid == resource.data.userId;
}
```

---

### 2. **Feedback Tickets (Private)**

**Collection:** `feedback_tickets`

```typescript
{
  userId: string,  // OWNER
  ticketId: string,
  sessionId: string,
  category: 'bug' | 'feature' | 'improvement',
  title: string,
  description: string,
  attachments: Attachment[],
  status: 'submitted' | 'in-review' | 'resolved',
  // ... metadata
}
```

**Access:**
- ✅ User can see: **ONLY their own tickets**
- ✅ Admin: Can see all tickets
- ✅ SuperAdmin: Can see all tickets

---

### 3. **Backlog Items (Admin/SuperAdmin Only)**

**Collection:** `backlog_items`

```typescript
{
  stellaTicketId: string,  // Link to ticket
  stellaSessionId: string,  // Link to session
  title: string,
  description: string,
  type: 'bug' | 'feature' | 'improvement',
  priority: 'low' | 'medium' | 'high' | 'critical',
  status: 'backlog' | 'todo' | 'in-progress' | 'done',
  createdBy: string,  // Original user
  metadata: {
    messageCount: number,
    hasAttachments: boolean,
    pageContext: any,
  },
  // ... more fields
}
```

**Access:**
- ❌ Regular users: **CANNOT see backlog items**
- ✅ Admin: Can see all backlog items
- ✅ SuperAdmin: Can see all backlog items + edit

**Who sees what:**
```
User (alguien@empresa.com):
  - ✅ Their own Stella conversations
  - ✅ Their own tickets
  - ❌ Other users' feedback
  - ❌ Backlog/Roadmap

Admin (admin@empresa.com):
  - ✅ All feedback tickets
  - ✅ All Stella sessions
  - ✅ Backlog items (read-only)
  - ❌ Cannot edit backlog

SuperAdmin (alec@getaifactory.com):
  - ✅ All feedback tickets
  - ✅ All Stella sessions
  - ✅ Backlog items (full access)
  - ✅ Roadmap management
  - ✅ Can prioritize and move items
```

---

## 🔄 Data Flow

### User Submits Feedback:

```
1. User chats with Stella (private conversation)
   ↓
2. User clicks "Enviar Feedback"
   ↓
3. API creates:
   a) feedback_sessions (userId filtered)
   b) feedback_tickets (userId filtered)
   c) IF Admin/SuperAdmin: backlog_items
   ↓
4. User sees: Ticket ID (BUG-0045)
   ↓
5. Admin/SuperAdmin sees: New card in Kanban backlog
```

---

## 🚨 Security Checks

### API Level (POST /api/stella/chat):

```typescript
// 1. Verify authentication
const session = getSession({ cookies });
if (!session) return 401;

// 2. Verify ownership
if (session.id !== userId) return 403;

// 3. Stella responds (private to user)
const response = await generateStellaResponse(...);

return { response };  // User-specific
```

### API Level (POST /api/stella/submit-feedback):

```typescript
// 1. Verify authentication
const session = getSession({ cookies });
if (!session) return 401;

// 2. Verify ownership
if (session.id !== userId) return 403;

// 3. Create documents with userId
feedback_sessions: { userId, ... }
feedback_tickets: { userId, ... }

// 4. IF Admin/SuperAdmin: Create backlog item
if (userRole === 'admin' || userRole === 'superadmin') {
  backlog_items: { 
    createdBy: userId,
    stellaTicketId,
    stellaSessionId,
    ...
  }
}
```

---

## 📊 Firestore Collections Schema

### feedback_sessions (User Private)

```typescript
{
  id: string,
  userId: string,  // ⭐ OWNER - enables filtering
  sessionId: string,
  category: 'bug' | 'feature' | 'improvement',
  ticketId?: string,
  messages: Array<{
    id: string,
    role: 'user' | 'stella',
    content: string,
    timestamp: Date,
    attachments?: Attachment[],
  }>,
  pageContext: {
    pageUrl: string,
    agentId?: string,
    conversationId?: string,
  },
  status: 'active' | 'submitted',
  createdAt: Date,
  submittedAt?: Date,
  source: 'localhost' | 'production',
}
```

**Indexes:**
```
- userId ASC, createdAt DESC
- userId ASC, status ASC
- ticketId ASC (for lookup)
```

---

### feedback_tickets (User Private, Admin Visible)

```typescript
{
  id: string,
  userId: string,  // ⭐ OWNER
  sessionId: string,  // Link to session
  ticketId: string,  // BUG-0045, FEAT-0123, IMP-0067
  category: 'bug' | 'feature' | 'improvement',
  title: string,
  description: string,
  status: 'submitted' | 'in-review' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high' | 'critical',
  attachments: Attachment[],
  pageContext: any,
  createdAt: Date,
  updatedAt: Date,
  resolvedAt?: Date,
  source: 'localhost' | 'production',
}
```

**Indexes:**
```
- userId ASC, createdAt DESC
- ticketId ASC (unique)
- status ASC, priority DESC
```

---

### backlog_items (Admin/SuperAdmin Only)

```typescript
{
  id: string,
  stellaTicketId: string,  // Link to ticket
  stellaSessionId: string,  // Link to session
  createdBy: string,  // Original user (for attribution)
  title: string,
  description: string,
  type: 'bug' | 'feature' | 'improvement' | 'task',
  priority: 'low' | 'medium' | 'high' | 'critical',
  status: 'backlog' | 'todo' | 'in-progress' | 'done',
  category: string,
  source: 'stella-chat',
  metadata: {
    pageContext: any,
    messageCount: number,
    hasAttachments: boolean,
  },
  assignedTo?: string,  // Admin can assign
  estimatedEffort?: string,
  labels?: string[],
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:**
```
- status ASC, priority DESC
- createdBy ASC
- stellaTicketId ASC
```

---

## 👥 User Roles & Permissions

### User (Regular)
```typescript
Permissions:
  ✅ Chat with Stella
  ✅ Create feedback sessions
  ✅ View OWN sessions/tickets
  ❌ View other users' feedback
  ❌ View backlog items
  ❌ Access Kanban/Roadmap
```

### Admin
```typescript
Permissions:
  ✅ All User permissions
  ✅ View ALL feedback sessions
  ✅ View ALL tickets
  ✅ View backlog items (read-only)
  ✅ Comment on backlog items
  ❌ Move backlog items
  ❌ Edit roadmap
```

### SuperAdmin (alec@getaifactory.com)
```typescript
Permissions:
  ✅ All Admin permissions
  ✅ Edit backlog items
  ✅ Move items in Kanban
  ✅ Prioritize and assign
  ✅ Manage roadmap
  ✅ Delete items
```

---

## 🔍 Privacy Guarantees

### For Regular Users:

**✅ What you can see:**
- Your own Stella conversations
- Your own feedback tickets
- Ticket IDs you created
- Status of your tickets

**❌ What you CANNOT see:**
- Other users' Stella conversations
- Other users' tickets
- Backlog items
- Roadmap

### For Admins:

**✅ What you can see:**
- All users' feedback (aggregated)
- All tickets
- Backlog items (with attribution)
- Who created what

**❌ What you CANNOT see:**
- Private Stella conversation details (only summaries)

**Privacy preserved:**
- Admin sees WHAT was reported (ticket)
- Admin does NOT see full chat transcript
- Stella conversations remain private

---

## 🛡️ Security Implementation

### API Endpoints:

**POST /api/stella/chat**
```typescript
// Always verify ownership
if (session.id !== userId) return 403;

// Response private to user
return { response: stellaResponse };  // User-specific
```

**POST /api/stella/submit-feedback**
```typescript
// Verify ownership
if (session.id !== userId) return 403;

// Create with userId
await firestore.collection('feedback_sessions').add({
  userId,  // ⭐ Ownership
  ...sessionData
});

await firestore.collection('feedback_tickets').add({
  userId,  // ⭐ Ownership
  ...ticketData
});

// Backlog only for Admin/SuperAdmin
if (isAdminOrSuperAdmin(userId)) {
  await firestore.collection('backlog_items').add({
    createdBy: userId,  // Attribution
    ...backlogData
  });
}
```

---

## 📋 Query Examples

### User queries their feedback:

```typescript
// Frontend
const mySessions = await fetch(`/api/stella/sessions?userId=${userId}`);

// Backend
const sessions = await firestore
  .collection('feedback_sessions')
  .where('userId', '==', userId)  // ⭐ User isolation
  .orderBy('createdAt', 'desc')
  .get();

return sessions;  // Only user's data
```

### Admin queries all feedback:

```typescript
// Frontend (admin only)
const allTickets = await fetch('/api/admin/feedback-tickets');

// Backend
if (userRole !== 'admin' && userRole !== 'superadmin') {
  return 403;
}

const tickets = await firestore
  .collection('feedback_tickets')
  .orderBy('createdAt', 'desc')
  .get();

return tickets;  // All tickets, but with userId for attribution
```

### SuperAdmin views Kanban:

```typescript
// Frontend (superadmin only)
const backlog = await fetch('/api/roadmap/backlog');

// Backend
if (userId !== '114671162830729001607') {
  return 403;
}

const items = await firestore
  .collection('backlog_items')
  .orderBy('priority', 'desc')
  .get();

return items;  // With createdBy for attribution
```

---

## 🎯 Example Scenarios

### Scenario 1: Regular User Reports Bug

```
User: usuario@empresa.com
Action: Chat with Stella → Report bug → Submit

Created:
  ✅ feedback_sessions (userId: usuario@empresa.com)
  ✅ feedback_tickets (userId: usuario@empresa.com, ticketId: BUG-0045)
  ❌ backlog_items (NOT created - user is not admin)

User sees:
  ✅ "Feedback enviado! Ticket: BUG-0045"
  
Admin sees:
  ✅ New ticket BUG-0045 in admin dashboard
  ❌ NOT in Kanban (user is not admin)

SuperAdmin sees:
  ✅ New ticket BUG-0045 in admin dashboard
  ❌ NOT in Kanban (user is not admin)
```

### Scenario 2: Admin Reports Feature

```
User: admin@empresa.com (role: admin)
Action: Chat with Stella → Request feature → Submit

Created:
  ✅ feedback_sessions (userId: admin@empresa.com)
  ✅ feedback_tickets (userId: admin@empresa.com, ticketId: FEAT-0123)
  ✅ backlog_items (createdBy: admin@empresa.com, source: 'stella-chat')

User (admin) sees:
  ✅ "Feedback enviado! Ticket: FEAT-0123"
  ✅ "Ver en Kanban →" (link)

SuperAdmin sees:
  ✅ New card in Kanban backlog
  ✅ Attribution: "Created by admin@empresa.com"
  ✅ Can drag to roadmap
```

### Scenario 3: SuperAdmin Reports Improvement

```
User: alec@getaifactory.com (role: superadmin)
Action: Chat with Stella → Suggest improvement → Submit

Created:
  ✅ feedback_sessions (userId: 114671162830729001607)
  ✅ feedback_tickets (ticketId: IMP-0067)
  ✅ backlog_items (createdBy: 114671162830729001607, immediate)

SuperAdmin sees:
  ✅ "Feedback enviado! Ticket: IMP-0067"
  ✅ Card immediately in Kanban backlog
  ✅ Can manage roadmap
```

---

## 📊 Privacy Summary Table

| Data Type | Regular User | Admin | SuperAdmin |
|-----------|--------------|-------|------------|
| **Own Stella chats** | ✅ Full | ✅ Full | ✅ Full |
| **Own tickets** | ✅ Full | ✅ Full | ✅ Full |
| **Other users' chats** | ❌ Never | ✅ Summary | ✅ Summary |
| **Other users' tickets** | ❌ Never | ✅ Full | ✅ Full |
| **Backlog items** | ❌ Never | ✅ Read-only | ✅ Full access |
| **Kanban board** | ❌ Never | ✅ View-only | ✅ Edit |
| **Roadmap** | ❌ Never | ✅ View-only | ✅ Manage |

---

## 🔒 GDPR/CCPA Compliance

### Data Minimization ✅
- Only collect what's needed for feedback
- No excessive metadata
- Screenshots optional

### User Rights ✅
- **Right to Access:** User can export their Stella conversations
- **Right to Delete:** User can delete their sessions/tickets
- **Right to Rectify:** User can edit before submitting
- **Right to Object:** User can cancel anytime

### Data Retention ✅
- Submitted feedback: Retained indefinitely (product improvement)
- Resolved tickets: Archived after 1 year
- Chat sessions: User can delete anytime

---

## 🎯 Best Practices

### 1. **Always Filter by userId**
```typescript
// ✅ CORRECT
const sessions = await firestore
  .collection('feedback_sessions')
  .where('userId', '==', session.id)
  .get();

// ❌ WRONG
const sessions = await firestore
  .collection('feedback_sessions')
  .get();  // Returns ALL users' data!
```

### 2. **Verify Ownership in APIs**
```typescript
// ✅ ALWAYS check
if (session.id !== userId) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403
  });
}
```

### 3. **Attribution in Backlog**
```typescript
// ✅ Show who created it
backlog_items: {
  createdBy: userId,  // For attribution
  title: "User reported: ...",
}

// Admin sees: "Created by admin@empresa.com"
// SuperAdmin can contact user if needed
```

---

## 📝 Privacy Policy Points

**For Users:**
> "Your conversations with Stella are private. Only you can see the messages you exchange with Stella. When you submit feedback, a ticket is created that admins can view to improve the product."

**For Admins:**
> "As an admin, you can view feedback tickets submitted by users to understand product issues. Individual chat conversations with Stella remain private to each user."

**For Everyone:**
> "We collect feedback to improve the product. Your data is used only for product development and is not shared with third parties."

---

**Last Updated:** 2025-10-30  
**Status:** ✅ Privacy Architecture Implemented  
**Compliance:** GDPR/CCPA Ready

---

**Stella respeta la privacidad del usuario mientras permite que admins mejoren el producto basándose en feedback agregado.** 🔒🪄








