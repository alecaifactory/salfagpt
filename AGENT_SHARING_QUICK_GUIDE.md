# 🤝 Agent Sharing - Quick Reference Guide

**Updated:** 2025-10-22  
**Status:** ✅ Fully Functional

---

## 🎯 Quick Start

### Share an Agent (3 steps)

1. **Open agent menu** → Click "Compartir Agente"
2. **Select users** → Check boxes next to users you want to share with
3. **Click "Compartir Agente"** → Done! ✅

**Default settings are perfect for your use case:**
- Tab: Usuarios (sharing with individuals)
- Access: **Usar** (green) - Can create private chats, can't modify agent

---

## 📋 Access Levels Explained

### 👁️ Solo Ver
**Use when:** You want someone to see how the agent is configured, but not use it.
- ✅ Can view configuration
- ✅ Can view context sources
- ❌ Cannot create conversations
- ❌ Cannot send messages

### ✏️ Usar (Recommended) ⭐
**Use when:** You want someone to use the agent without modifying it.
- ✅ Can view configuration (read-only)
- ✅ Can view context sources (read-only)
- ✅ **Can create their own private conversations**
- ✅ **Can send messages and chat with agent**
- ❌ Cannot modify configuration
- ❌ Cannot modify context sources
- ❌ Cannot share further

**Perfect for: "Use my configured agent, but keep your chats private"**

### 🛡️ Admin
**Use when:** You trust someone to co-manage the agent.
- ✅ Everything from "Usar"
- ✅ Can modify configuration
- ✅ Can modify context sources
- ✅ Can share with others
- ✅ Can delete the agent

---

## 🔄 Complete User Flow Example

### Scenario: Share "M001" agent with hello@getaifactory.com

**You (Agent Creator):**
```
1. Select agent "M001"
2. Click ⋮ menu → "Compartir Agente"
3. Modal opens:
   - Tab "Usuarios" selected ✅
   - Access "Usar" selected ✅
4. Search: "hello@getaifactory.com"
5. ✅ Click checkbox next to their name
6. Blue box shows: "Compartir con: 👤 hello@getaifactory.com"
7. Click "Compartir Agente"
8. ✅ Success: "¡Agente compartido exitosamente!"
9. Right panel updates:
   
   Accesos Compartidos (1)
   
   👤 hello@getaifactory.com
      [Usar agente] [X]
      Compartido 22/10/2025
```

**Recipient (hello@getaifactory.com):**
```
1. Opens Flow
2. Sidebar shows:
   
   🤖 MIS AGENTES (2)
   ├─ Mi Agente 1
   └─ Mi Agente 2
   
   🤝 AGENTES COMPARTIDOS (1)
   └─ M001 👁️
      Compartido por alec@getaifactory.com
      
3. Clicks on "M001"
4. Sees:
   - Configuration (grayed out)
   - Context sources (grayed out)
   - [🟣 Nuevo Chat con M001] button
   
5. Clicks "Nuevo Chat con M001"
6. Creates private conversation:
   - Inherits M001's model (Flash/Pro)
   - Inherits M001's system prompt
   - Inherits M001's context sources
   - BUT: All messages are private to hello@
   
7. Chats normally with AI
   - Uses M001's configuration
   - Uses M001's knowledge base
   - You (alec@) CANNOT see these messages
```

---

## 🗑️ Revoke Access

### Quick Revoke

1. Open agent sharing modal
2. Right panel: "Accesos Compartidos"
3. Find the user/group
4. Click red **X** button
5. Confirm: "¿Revocar este acceso compartido?"
6. ✅ Access removed immediately

**What happens to recipient:**
- Shared agent disappears from their "Agentes Compartidos" section
- Existing chats they created remain (they own those)
- Future chats: Cannot create new ones with this agent

---

## 🎨 UI Elements

### Modal Layout

```
┌─────────────────────────────────────────────────┐
│ Compartir Agente                            [X] │
│ SSOMA                                           │
├──────────────────────┬──────────────────────────┤
│ Compartir con        │ Accesos Compartidos (2)  │
│                      │                          │
│ [Grupos] [Usuarios]  │ 👤 hello@getaifactory.com│
│                      │    [Usar agente]     [X] │
│ 🔍 alec@getaifacto...│    Compartido 22/10/2025 │
│                      │                          │
│ ✅ alec@getaifactory │ 👥 Equipo Marketing      │
│    alec@getaifac...  │    [Solo ver]        [X] │
│                      │    Compartido 21/10/2025 │
│ ☐ hello@getaifactory │                          │
│    hello@getaifa...  │                          │
│                      │                          │
│ Nivel de Acceso      │                          │
│ [Ver] [Usar] [Admin] │                          │
│                      │                          │
│ ✏️ Pueden crear...   │                          │
│                      │                          │
│ [Compartir Agente]   │                          │
└──────────────────────┴──────────────────────────┘
```

---

## 💡 Tips & Best Practices

### When to Use Each Access Level

**Solo Ver:**
- ❌ Rarely needed
- Use case: Documentation/reference only
- Example: "See how I configured this expert agent"

**Usar (Default):** ⭐
- ✅ Most common use case
- Use case: "Use my agent, your chats are private"
- Example: Technical support agent shared with team

**Admin:**
- ⚠️ Use with trusted users only
- Use case: Co-management of agent
- Example: Team lead can modify shared agent

---

### Privacy Guarantees

**When you share with "Usar" access:**

✅ **They CAN:**
- See your agent's model selection
- See your agent's system prompt
- See your agent's context sources
- Create unlimited chats with your agent
- Send messages in their chats
- See AI responses

❌ **They CANNOT:**
- See your conversations with the agent
- See other recipients' conversations
- Modify agent configuration
- Modify context sources
- Share the agent with others
- Delete the agent

✅ **You (creator) CAN:**
- See who has access (right panel)
- Revoke access anytime
- Modify agent config (affects all users)
- See usage stats (future)

---

## 🔧 Troubleshooting

### "No hay usuarios disponibles"

**Cause:** API permission issue  
**Fix:** Verify you have admin role or proper permissions

### Groups tab shows error

**Status:** Non-critical  
**Impact:** Can still share with individual users  
**Fix:** Groups API needs setup (optional feature)

### Shared agent not appearing for recipient

**Checklist:**
- [ ] Share was successful (check right panel)
- [ ] Recipient has logged out and back in
- [ ] Recipient is checking "Agentes Compartidos" section
- [ ] Share hasn't expired

---

## 📊 Technical Details

### Data Model

```typescript
// Agent share document (Firestore: agent_shares collection)
{
  id: "share-abc123",
  agentId: "agent-m001",
  ownerId: "user-a-id",
  sharedWith: [
    {
      type: 'user',
      id: 'user-b-id',
      accessLevel: 'use'
    }
  ],
  createdAt: timestamp,
  expiresAt: null // Permanent access
}

// Recipient's conversation (private to them)
{
  id: "chat-xyz",
  userId: "user-b-id", // They own this
  agentId: "agent-m001", // References shared agent
  isAgent: false,
  title: "Chat con M001",
  // Inherits config from agent-m001
}
```

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Modal opens without errors
- [ ] Usuarios tab shows user list
- [ ] Checkboxes are clickable
- [ ] Selecting user adds to summary box
- [ ] "Usar" is selected by default
- [ ] Description explains private conversations
- [ ] "Compartir Agente" button enables
- [ ] Right panel shows existing shares
- [ ] X button revokes access
- [ ] No console errors

---

**All fixes applied:** ✅  
**Ready to use:** ✅  
**Backward compatible:** ✅  
**No breaking changes:** ✅

