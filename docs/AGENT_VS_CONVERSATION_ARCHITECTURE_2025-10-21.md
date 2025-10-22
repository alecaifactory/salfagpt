# Agent vs Conversation Architecture - Complete Guide

**Date:** October 21, 2025  
**Status:** ✅ Architecture Defined and Implemented  
**Purpose:** Clear distinction between Agents and Conversations in Flow platform

---

## 🎯 Core Concepts

### The Fundamental Distinction

```
AGENT = Reusable AI configuration + context
CONVERSATION = Active chat session using an agent
```

**Think of it like this:**
- **Agent** = Template/Blueprint (configuration, context, system prompt)
- **Conversation** = Instance/Usage (specific chat using that template)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER WORKSPACE                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 AGENTS (Configurations/Templates)                   │
│  ├─ 🤖 Agente M001                                     │
│  │  ├─ Model: Gemini 2.5 Pro                          │
│  │  ├─ System Prompt: "Eres un experto en..."         │
│  │  ├─ Context Sources:                                │
│  │  │  • Manual.pdf                                    │
│  │  │  • Guía Seguridad.pdf                           │
│  │  └─ Configuration: Saved                            │
│  │                                                     │
│  ├─ 🤖 Agente Support                                  │
│  │  ├─ Model: Gemini 2.5 Flash                        │
│  │  ├─ System Prompt: "Eres un asistente..."          │
│  │  ├─ Context Sources:                                │
│  │  │  • FAQ.pdf                                       │
│  │  │  • Políticas.pdf                                │
│  │  └─ Configuration: Saved                            │
│  │                                                     │
│  └─ 🤖 Agente HR                                       │
│     ├─ Model: Gemini 2.5 Flash                        │
│     ├─ System Prompt: "Eres un experto en RRHH..."    │
│     ├─ Context Sources: (none)                         │
│     └─ Configuration: Saved                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💬 CONVERSATIONS (Chat Sessions)                       │
│  ├─ Chat: "Consulta sobre vacaciones"                  │
│  │  ├─ Agent: Agente HR                                │
│  │  ├─ Messages: 12                                    │
│  │  ├─ Created: 2025-10-15                             │
│  │  └─ Inherits: HR's context + config                 │
│  │                                                     │
│  ├─ Chat: "Problema con seguridad"                     │
│  │  ├─ Agent: Agente M001                              │
│  │  ├─ Messages: 25                                    │
│  │  ├─ Created: 2025-10-18                             │
│  │  └─ Inherits: M001's context + config               │
│  │                                                     │
│  └─ Chat: "FAQ cliente X"                              │
│     ├─ Agent: Agente Support                           │
│     ├─ Messages: 8                                     │
│     ├─ Created: 2025-10-20                             │
│     └─ Inherits: Support's context + config            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

### Agent (Root Conversation)

```typescript
interface Agent {
  // Identity
  id: string;                       // Unique agent ID
  userId: string;                   // Owner
  title: string;                    // Agent name
  
  // Agent Marker
  isAgent: true;                    // ← Marks this as an agent
  agentId: undefined;               // ← No parent (this IS the parent)
  
  // Configuration
  agentModel: string;               // 'gemini-2.5-flash' | 'gemini-2.5-pro'
  systemPrompt?: string;            // Custom system instruction
  temperature?: number;             // Creativity (0-1)
  maxOutputTokens?: number;         // Response length
  
  // Context
  activeContextSourceIds: string[]; // Assigned context sources
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;             // Total across all chats
  contextWindowUsage: number;
  status?: 'active' | 'archived';
  
  // Sharing
  isShared?: boolean;
  sharedAccessLevel?: 'view' | 'edit' | 'admin';
}
```

### Conversation (Chat Instance)

```typescript
interface Conversation {
  // Identity
  id: string;                       // Unique conversation ID
  userId: string;                   // Owner (same as parent agent's owner)
  title: string;                    // Conversation name
  
  // Chat Marker
  isAgent: false;                   // ← Marks this as a chat
  agentId: string;                  // ← References parent agent
  
  // Organization
  folderId?: string;                // Optional project assignment
  
  // Inheritance (from parent agent)
  agentModel: string;               // Inherited from agent
  activeContextSourceIds: undefined; // Inherits from parent agent
  
  // Own Data
  messages: Message[];              // This chat's messages only
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;             // This chat's message count
  contextWindowUsage: number;       // This chat's usage
  status?: 'active' | 'archived';
}
```

---

## 🔄 Lifecycle

### Creating an Agent

```typescript
// User clicks "+ Nuevo Agente"
const agent = await createConversation({
  userId: 'user-123',
  title: 'Agente M001',
  isAgent: true,        // ← Mark as agent
  agentId: undefined,   // ← No parent
  agentModel: 'gemini-2.5-flash',
  activeContextSourceIds: []
});

// Agent appears in "Agentes" section of left pane
```

### Creating a Conversation (Chat)

```typescript
// User selects an agent, then clicks "+ Nuevo Chat"
const chat = await createConversation({
  userId: 'user-123',
  title: 'Chat - Aprendizaje',
  isAgent: false,       // ← Mark as chat
  agentId: 'agent-123', // ← Link to parent agent
  agentModel: agent.agentModel, // Inherited
  activeContextSourceIds: undefined // Will inherit
});

// Chat appears in "Chats" section under selected agent
```

### Using a Conversation

```
1. User opens chat
   ↓
2. System loads chat's messages
   ↓
3. System finds parent agent via agentId
   ↓
4. System loads agent's context sources
   ↓
5. System loads agent's configuration
   ↓
6. User sends message
   ↓
7. AI responds using:
   - Agent's model
   - Agent's system prompt
   - Agent's context sources
   - Chat's message history
```

---

## 🎯 Context Assignment Rules

### Rule 1: Context Sources → Agents

**Principle:** Context sources are ONLY assigned to agents, never to individual chats.

```typescript
// ✅ CORRECT
contextSource.assignedToAgents = ['agent-m001', 'agent-support'];

// ❌ WRONG
contextSource.assignedToAgents = ['chat-aprendizaje', 'chat-consultas'];
```

**Why:**
- Agents manage context (they are the "context managers")
- Chats consume context (they are "context consumers")
- Inheritance model is clearer and simpler

### Rule 2: Chats Inherit from Parent Agent

**Principle:** When a chat needs context, it looks up its parent agent and uses the agent's context.

```typescript
// Loading context for a chat
async function loadContextForChat(chatId: string) {
  const chat = await getConversation(chatId);
  
  if (chat.agentId) {
    // This is a chat - get parent agent's context
    const agent = await getConversation(chat.agentId);
    return agent.activeContextSourceIds;
  } else {
    // This is an agent - use its own context
    return chat.activeContextSourceIds;
  }
}
```

### Rule 3: PUBLIC Sources → All Agents

**Principle:** PUBLIC tagged sources are auto-assigned to ALL agents, not all conversations.

```typescript
// When marking a source as PUBLIC
if (newLabels.includes('PUBLIC')) {
  // ✅ Filter to agents only
  const allAgents = conversations.filter(c => c.isAgent !== false);
  const allAgentIds = allAgents.map(a => a.id);
  
  // Assign to all agents
  for (const agentId of allAgentIds) {
    await assignSourceToAgent(sourceId, agentId);
  }
}
```

---

## 🖥️ UI Distinctions

### Left Pane Organization

```
┌───────────────────────────┐
│ 🤖 AGENTES (3)            │ ← Agents section (blue)
│   • Agente M001          │
│   • Agente Support       │
│   • Agente HR            │
│                          │
│ 📁 PROYECTOS (2)          │ ← Projects section (green)
│   • Customer Support     │
│   • Internal Docs        │
│                          │
│ 💬 CHATS (5)              │ ← Chats section (purple)
│   • Chat - Aprendizaje   │ ← Linked to selected agent
│   • Chat - Consultas     │
│   • Chat - Soporte       │
│   ...                    │
└───────────────────────────┘
```

**Color Coding:**
- Agents: Blue (primary action color)
- Chats: Purple (secondary, derivative)
- Projects: Green (organizational)

### Context Management Dashboard

```
┌───────────────────────────────────────────┐
│ Gestión de Contexto                    [X]│
├───────────────────────────────────────────┤
│ Sources List                              │
│ □ Manual.pdf                              │
│ □ Guía Seguridad.pdf                      │
│ □ FAQ.pdf                                 │
│                                           │
│ ──────────────────────────────────────    │
│                                           │
│ ASIGNAR A AGENTES                         │ ← Only shows agents
│ □ Agente M001                             │ ← Agent
│ □ Agente Support                          │ ← Agent
│ □ Agente HR                               │ ← Agent
│                                           │
│ (Chats do NOT appear here)                │
│                                           │
│               [Asignar (3)]               │
└───────────────────────────────────────────┘
```

**Key Points:**
- Only agents appear in "Asignar a Agentes" list
- Chats are NOT shown (they inherit from parent)
- Clear, focused assignment UI

---

## 🔧 Implementation Details

### Filtering Agents

**In any component that needs to show agents only:**

```typescript
// ✅ CORRECT: Filter to agents
const agents = conversations.filter(conv => conv.isAgent !== false);

// Explanation:
// - conv.isAgent === true → Include (explicit agent)
// - conv.isAgent === undefined → Include (legacy, defaults to agent)
// - conv.isAgent === false → Exclude (this is a chat)
```

### Filtering Chats

**To show only chats (for a specific agent):**

```typescript
// ✅ CORRECT: Filter to chats of specific agent
const chatsForAgent = conversations.filter(conv => 
  conv.isAgent === false && 
  conv.agentId === agentId
);
```

### Filtering All Chats

```typescript
// ✅ CORRECT: All chats across all agents
const allChats = conversations.filter(conv => conv.isAgent === false);
```

---

## 📋 API Patterns

### Create Agent Endpoint

```typescript
POST /api/conversations
Body: {
  userId: "user-123",
  title: "Agente M001",
  isAgent: true,           // ← Create as agent
  agentModel: "gemini-2.5-flash",
  systemPrompt: "Eres un experto en..."
}

Response: {
  id: "agent-m001",
  isAgent: true,
  agentId: undefined,
  activeContextSourceIds: [],
  ...
}
```

### Create Chat Endpoint

```typescript
POST /api/conversations
Body: {
  userId: "user-123",
  title: "Chat - Aprendizaje",
  isAgent: false,          // ← Create as chat
  agentId: "agent-m001",   // ← Link to parent
  agentModel: "gemini-2.5-flash" // Inherited
}

Response: {
  id: "chat-aprendizaje",
  isAgent: false,
  agentId: "agent-m001",
  activeContextSourceIds: undefined,
  ...
}
```

### Get Agents Endpoint

```typescript
GET /api/conversations?userId=user-123&type=agents

// Returns only agents
Response: {
  conversations: [
    { id: "agent-m001", isAgent: true, ... },
    { id: "agent-support", isAgent: true, ... }
  ]
}
```

### Get Chats for Agent Endpoint

```typescript
GET /api/conversations?userId=user-123&agentId=agent-m001

// Returns only chats for this agent
Response: {
  conversations: [
    { id: "chat-1", isAgent: false, agentId: "agent-m001", ... },
    { id: "chat-2", isAgent: false, agentId: "agent-m001", ... }
  ]
}
```

---

## 🔄 Context Inheritance Flow

### Step-by-Step

```
1. User creates Agent M001
   ↓
2. User assigns Manual.pdf to Agent M001
   assignedToAgents: ['agent-m001']
   ↓
3. User creates Chat "Aprendizaje" under Agent M001
   agentId: 'agent-m001'
   ↓
4. User opens Chat "Aprendizaje"
   ↓
5. System loads chat data
   ↓
6. System detects agentId = 'agent-m001'
   ↓
7. System loads Agent M001's context
   activeContextSourceIds: ['manual-pdf-id']
   ↓
8. System loads Manual.pdf content
   ↓
9. User sends message in chat
   ↓
10. AI response uses:
    - Agent M001's model
    - Agent M001's system prompt
    - Agent M001's context (Manual.pdf)
    - Chat "Aprendizaje"'s message history
    ↓
11. Response shown in Chat "Aprendizaje"
```

---

## ✅ Benefits of This Architecture

### 1. Reusability

**Without Agent/Chat Distinction:**
```
Problem: User wants to talk about 3 different topics using same expert agent
Solution: Copy entire agent config 3 times (inefficient)
```

**With Agent/Chat Distinction:**
```
Solution: 
1. Create 1 Agent M001 (expert configuration)
2. Create 3 Chats (Topic A, Topic B, Topic C)
3. All use same agent config
4. All share same context sources
```

### 2. Context Management

**Without:**
- Must assign context to every conversation
- Duplication of assignments
- Hard to update context (must update everywhere)

**With:**
- Assign context once to agent
- All chats inherit automatically
- Update agent's context → all chats updated

### 3. Configuration Changes

**Without:**
- Change model in one conversation
- Other conversations still use old model
- Inconsistent behavior

**With:**
- Change agent's model
- All new chats use new model
- Existing chats optionally update

### 4. Organization

**Without:**
- Flat list of conversations
- Hard to find related conversations
- No grouping by purpose

**With:**
- Agents organized by purpose
- Chats grouped under agents
- Projects for topic-based organization
- Clear hierarchy

---

## 🎨 UI Components

### Components That Show Agents Only

1. **Context Management Dashboard** (`ContextManagementDashboard.tsx`)
   - "Asignar a Agentes" list
   - Shows: Agents only
   - Purpose: Assign context sources

2. **Agent Sharing Modal** (`AgentSharingModal.tsx`)
   - Share agent with users/groups
   - Shows: Agent being shared
   - Purpose: Collaboration

3. **Agent Management Dashboard** (`AgentManagementDashboard.tsx`)
   - Manage all agents
   - Shows: Agents only
   - Purpose: Agent administration

4. **Agent Evaluation Dashboard** (`AgentEvaluationDashboard.tsx`)
   - Evaluate agent configurations
   - Shows: Agents only
   - Purpose: Quality assurance

### Components That Show Chats Only

1. **Chats Section** (Left Pane in `ChatInterfaceWorking.tsx`)
   - Chats for selected agent
   - Shows: Chats only (filtered by agentId)
   - Purpose: Navigate conversations

2. **Project Contents** (Proyectos section)
   - Chats organized by project
   - Shows: Chats in that project
   - Purpose: Project-based organization

### Components That Show Both (with Distinction)

1. **Left Pane** (`ChatInterfaceWorking.tsx`)
   - Agentes section: Agents (blue)
   - Chats section: Chats (purple)
   - Clear visual separation

---

## 🔧 Common Operations

### Operation 1: Assign Context Source to Agent

```typescript
// Via Context Management Dashboard

// 1. Select source(s)
selectedSourceIds = ['manual-pdf-id'];

// 2. Select agent(s)
pendingAgentIds = ['agent-m001', 'agent-support'];

// 3. Click "Asignar"
await assignSourcesToAgents(selectedSourceIds, pendingAgentIds);

// Result:
// - manual-pdf-id assigned to agent-m001
// - manual-pdf-id assigned to agent-support
// - All chats under agent-m001 inherit Manual.pdf
// - All chats under agent-support inherit Manual.pdf
```

### Operation 2: Create Chat from Agent

```typescript
// Via Chat Interface

// 1. Select agent in left pane
setSelectedAgent('agent-m001');

// 2. Click "+ Nuevo Chat" button
const chat = await createNewChatForAgent('agent-m001');

// Result:
// - New chat created with agentId = 'agent-m001'
// - Chat inherits agent's context automatically
// - Chat inherits agent's configuration
// - Chat appears in "Chats" section
```

### Operation 3: Mark Source as PUBLIC

```typescript
// Via Context Management Dashboard

// 1. Select source
// 2. Add "PUBLIC" tag
// 3. Save

// System automatically:
const allAgents = conversations.filter(c => c.isAgent !== false);
for (const agentId of allAgents.map(a => a.id)) {
  await assignSourceToAgent(sourceId, agentId);
}

// Result:
// - Source assigned to ALL agents
// - ALL chats inherit the PUBLIC source
```

---

## 🚨 Common Mistakes to Avoid

### ❌ MISTAKE 1: Assigning Context to Chats

```typescript
// WRONG
contextSource.assignedToAgents = ['chat-aprendizaje'];

// CORRECT
contextSource.assignedToAgents = ['agent-m001'];
// Chat "Aprendizaje" inherits from Agent M001
```

### ❌ MISTAKE 2: Showing Chats in Agent Lists

```typescript
// WRONG
const agentList = conversations; // Includes chats

// CORRECT
const agentList = conversations.filter(c => c.isAgent !== false);
```

### ❌ MISTAKE 3: Creating Agent as Chat

```typescript
// WRONG
const newAgent = await createConversation({
  title: 'Mi Agente',
  isAgent: false // ← WRONG: Agent marked as chat
});

// CORRECT
const newAgent = await createConversation({
  title: 'Mi Agente',
  isAgent: true // ← CORRECT: Explicit agent
});
```

### ❌ MISTAKE 4: Creating Chat Without Parent

```typescript
// WRONG
const newChat = await createConversation({
  title: 'Chat - Topic',
  isAgent: false,
  agentId: undefined // ← WRONG: Chat without parent
});

// CORRECT
const newChat = await createConversation({
  title: 'Chat - Topic',
  isAgent: false,
  agentId: 'agent-m001' // ← CORRECT: Linked to parent
});
```

---

## 📊 Firestore Queries

### Get All Agents

```typescript
const agents = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .where('isAgent', '==', true)  // Only agents
  .orderBy('lastMessageAt', 'desc')
  .get();
```

### Get All Chats for an Agent

```typescript
const chats = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .where('agentId', '==', agentId)  // Chats for this agent
  .where('isAgent', '==', false)     // Only chats
  .orderBy('lastMessageAt', 'desc')
  .get();
```

### Get All Conversations (Agents + Chats)

```typescript
const allConversations = await firestore
  .collection('conversations')
  .where('userId', '==', userId)
  .orderBy('lastMessageAt', 'desc')
  .get();
```

---

## 🔄 Migration & Backward Compatibility

### Legacy Data Handling

**Conversations created before this architecture:**
- Have no `isAgent` field
- Have no `agentId` field

**Default Behavior:**
```typescript
// Filter treats undefined as agent
const isThisAnAgent = conv.isAgent !== false;

// Examples:
// isAgent === true → true (explicit agent)
// isAgent === undefined → true (legacy, defaults to agent)
// isAgent === false → false (explicit chat)
```

**Result:**
- All legacy conversations appear as agents
- Users can create chats under them
- No data migration needed
- Seamless upgrade

---

## ✅ Testing Checklist

### Create Agent
- [ ] Agent has `isAgent: true`
- [ ] Agent has `agentId: undefined`
- [ ] Agent appears in "Agentes" section
- [ ] Agent can have context assigned
- [ ] Agent appears in Context Management Dashboard

### Create Chat
- [ ] Chat has `isAgent: false`
- [ ] Chat has `agentId: <parent-agent-id>`
- [ ] Chat appears in "Chats" section (under selected agent)
- [ ] Chat does NOT appear in "Agentes" section
- [ ] Chat does NOT appear in Context Management Dashboard agent list

### Assign Context
- [ ] Can assign source to agent via Context Management Dashboard
- [ ] Source appears in agent's context configuration
- [ ] Chat inherits source from parent agent
- [ ] Chat can use source in conversations

### PUBLIC Sources
- [ ] PUBLIC source assigned to all agents
- [ ] PUBLIC source NOT assigned to chats
- [ ] All chats inherit PUBLIC source from their parent agent

---

## 📚 References

### Internal Documentation
- `.cursor/rules/agents.mdc` - Agent architecture principles
- `.cursor/rules/data.mdc` - Complete data schema
- `docs/LEFT_PANE_REDESIGN_2025-10-21.md` - UI redesign
- `docs/CHAT_CONTEXT_ARCHITECTURE_2025-10-21.md` - Context inheritance
- `docs/CONTEXT_MANAGEMENT_AGENT_FILTER_FIX_2025-10-21.md` - This fix

### Code References
- `src/lib/firestore.ts` - Conversation interface
- `src/components/ChatInterfaceWorking.tsx` - Main UI
- `src/components/ContextManagementDashboard.tsx` - Context assignment
- `src/pages/api/conversations/index.ts` - Create endpoints

---

## 🎓 Key Takeaways

### For Developers

1. **Always filter to show agents** when assigning context
2. **Use `isAgent !== false`** for backward compatibility
3. **Never assign context to chats** directly
4. **Chats inherit from parent agent** - enforce this in UI

### For Users

1. **Agents are reusable** - create once, use many times
2. **Chats are instances** - multiple conversations with same agent
3. **Context assigned to agents** - chats inherit automatically
4. **Organize chats in projects** - for topic-based grouping

### For Product Design

1. **Clear visual distinction** - colors, icons, labels
2. **Hierarchical organization** - agents → chats → projects
3. **Context inheritance** - simpler mental model
4. **Separation of concerns** - configuration vs usage

---

## ✅ Summary

**What is an Agent?**
- Reusable AI configuration
- Has context sources
- Has system prompt and model
- Parent to multiple chats

**What is a Conversation/Chat?**
- Specific chat session
- Uses an agent's configuration
- Inherits agent's context
- Has its own message history

**Why This Matters?**
- Clearer data model
- Better UX
- Easier context management
- More powerful organization

**Implementation Rule:**
> "Context sources are assigned to agents.  
> Chats inherit context from their parent agent.  
> UI shows agents in assignment lists, not chats."

---

**Status:** ✅ Architecture Implemented  
**Components Updated:** 2 (ContextManagementDashboard, ChatInterfaceWorking)  
**Documentation:** Complete  
**Testing:** Manual verification needed  
**Backward Compatible:** Yes

