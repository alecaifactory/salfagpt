# MCP Server - Visual Architecture

**Created:** 2025-10-30  
**Purpose:** Visual overview of MCP server implementation

---

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  YOU (SuperAdmin in Cursor)                                     │
│  ├─ "Show me usage stats for getaifactory.com"                 │
│  └─ "Which agents have the most activity?"                     │
│                                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Natural Language Query
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  CURSOR AI                                                       │
│  ├─ Reads your question                                         │
│  ├─ Knows about MCP server (from ~/.cursor/mcp.json)           │
│  └─ Constructs MCP protocol request                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ MCP Request (JSON-RPC)
             │ + API Key (Authorization header)
             │ + Session (Cookie)
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  MCP SERVER (Flow Platform)                                     │
│  POST http://localhost:3000/api/mcp/usage-stats                │
│                                                                 │
│  Security Checks:                                               │
│  ├─ ✅ Verify session cookie (JWT)                             │
│  ├─ ✅ Verify API key (from mcp_servers collection)           │
│  ├─ ✅ Check role (SuperAdmin or Admin)                       │
│  └─ ✅ Verify domain access                                    │
│                                                                 │
│  If authorized:                                                 │
│  ├─ Parse resource URI: usage-stats://getaifactory.com/summary│
│  ├─ Query Firestore for domain data                            │
│  ├─ Aggregate statistics                                        │
│  └─ Return JSON                                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Queries (filtered by userId)
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  FIRESTORE DATABASE                                             │
│                                                                 │
│  conversations (agents)                                         │
│  ├─ userId: "user-123" → 45 conversations                      │
│  ├─ agentModel: "gemini-2.5-flash" → 40 agents                │
│  └─ messageCount: sum → 234 messages                           │
│                                                                 │
│  messages                                                       │
│  ├─ conversationId → links to conversations                    │
│  └─ tokenCount → for cost calculation                          │
│                                                                 │
│  users                                                          │
│  ├─ email: "*@getaifactory.com" → 3 users                     │
│  └─ role: "admin" → permissions                                │
│                                                                 │
│  mcp_servers (NEW!)                                             │
│  ├─ apiKeyHash → verify key                                    │
│  ├─ assignedDomains → ["getaifactory.com"]                    │
│  └─ isActive, expiresAt → security                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Aggregated Stats
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  JSON RESPONSE                                                  │
│  {                                                              │
│    "domain": "getaifactory.com",                               │
│    "totalAgents": 45,                                          │
│    "totalMessages": 234,                                       │
│    "activeUsers": 3,                                           │
│    "totalCost": 12.50,                                         │
│    "modelBreakdown": {                                         │
│      "flash": { "count": 40, "percentage": 88.9 },           │
│      "pro": { "count": 5, "percentage": 11.1 }               │
│    }                                                            │
│  }                                                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Structured Data
             │
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  CURSOR AI RESPONSE                                             │
│  "Here are your usage stats for getaifactory.com:              │
│                                                                 │
│   📊 Total Agents: 45                                          │
│   💬 Total Messages: 234                                       │
│   👥 Active Users: 3                                           │
│   💰 Estimated Cost: $12.50                                    │
│                                                                 │
│   Model Distribution:                                           │
│   • Flash: 40 agents (88.9%) - Cost efficient                 │
│   • Pro: 5 agents (11.1%) - High precision                    │
│                                                                 │
│   Average: 5.2 messages per agent"                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

```
1. USER QUERY
   ↓
   "Show me usage stats"

2. CURSOR CONSTRUCTS MCP REQUEST
   ↓
   POST /api/mcp/usage-stats
   Headers:
     Authorization: Bearer mcp_localhost_abc123...
     Cookie: flow_session=jwt_token...
   Body:
     {
       "jsonrpc": "2.0",
       "method": "resources/read",
       "params": {
         "uri": "usage-stats://getaifactory.com/summary"
       },
       "id": 1
     }

3. SERVER VALIDATES
   ↓
   ✅ Session valid?
   ✅ API key valid?
   ✅ Role = SuperAdmin/Admin?
   ✅ Domain access allowed?

4. SERVER QUERIES FIRESTORE
   ↓
   • Get users in domain (email contains @getaifactory.com)
   • Get conversations for users
   • Aggregate stats
   • Calculate costs

5. SERVER RESPONDS
   ↓
   {
     "jsonrpc": "2.0",
     "result": {
       "domain": "getaifactory.com",
       "totalAgents": 45,
       "totalMessages": 234,
       ...
     },
     "id": 1
   }

6. CURSOR FORMATS RESPONSE
   ↓
   "Here are your usage stats..."
   (Natural language with numbers)

7. USER SEES ANSWER
   ↓
   ✅ Got answer without leaving IDE
   ✅ Can ask follow-up questions
   ✅ Can compare domains (if SuperAdmin)
```

---

## 🗂️ Data Model

### New Collections

**mcp_servers:**
```
{
  id: "server-abc123"
  name: "Flow Usage Stats"
  type: "usage-stats"
  createdBy: "114671162830729001607" (Alec)
  apiKeyHash: "bXBjX2xvY2FsaG9zdF9hYmMxMjM=" (hashed)
  isActive: true
  expiresAt: "2026-01-28" (90 days)
  assignedDomains: ["getaifactory.com"]
  allowedRoles: ["superadmin", "admin"]
  resources: ["summary", "agents", "users", "costs"]
  endpoint: "/api/mcp/usage-stats"
  usageCount: 0
}
```

**mcp_api_keys:**
```
{
  id: "key-xyz789"
  serverId: "server-abc123"
  keyHash: "bXBjX2xvY2FsaG9zdF9hYmMxMjM="
  keyPrefix: "mcp_localhost" (for display)
  createdBy: "114671162830729001607"
  createdAt: "2025-10-30T10:00:00Z"
  expiresAt: "2026-01-28T10:00:00Z"
  isActive: true
  usageCount: 0
  metadata: {
    description: "API key for Flow Usage Stats"
    environment: "localhost"
  }
}
```

---

## 🎨 UI Components

### MCP Server Management UI

```
┌─────────────────────────────────────────────────────────┐
│  🖥️  MCP Servers                     [+ Create Server] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Flow Usage Stats                      [🟢 Active]  │
│  Read-only usage statistics for Cursor                  │
│  Type: usage-stats • Domains: getaifactory.com         │
│  Used: 0 times                                          │
│                                                         │
│  Resources:                                             │
│  [summary] [agents] [users] [costs]                    │
│                                                         │
│  Endpoint:                                              │
│  ┌───────────────────────────────────────────────┐     │
│  │ http://localhost:3000/api/mcp/usage-stats [📋]│     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Server Creation Flow

```
Step 1: Click "Create Server"
   ↓
┌─────────────────────────────────────┐
│  Create MCP Server                  │
├─────────────────────────────────────┤
│  Name: [Flow Usage Stats        ]  │
│  Description: [Read-only stats...]  │
│  Type: [usage-stats ▼]             │
│  Domains: [getaifactory.com     ]  │
│  Expires: [90] days                 │
│                                     │
│         [Cancel] [Create Server]    │
└─────────────────────────────────────┘
   ↓
Step 2: Server created, API key shown ONCE
   ↓
┌─────────────────────────────────────────────────┐
│  ✅ Server Created!                             │
├─────────────────────────────────────────────────┤
│  ⚠️ Save this API key - shown only once        │
│                                                 │
│  API Key:                          [📋 Copy]   │
│  ┌───────────────────────────────────────────┐ │
│  │ mcp_localhost_a1b2c3d4e5f6...             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Cursor Configuration:            [📋 Copy]    │
│  ┌───────────────────────────────────────────┐ │
│  │ {                                         │ │
│  │   "mcpServers": {                         │ │
│  │     "flow-usage-stats": {                 │ │
│  │       "url": "http://localhost:3000/...", │ │
│  │       "apiKey": "mcp_localhost_...",      │ │
│  │       "domain": "getaifactory.com"        │ │
│  │     }                                     │ │
│  │   }                                       │ │
│  │ }                                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│                            [Done]               │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Security Visualization

### Authentication Flow

```
Request arrives
     │
     ├─→ Has session cookie? ────→ NO ──→ 401 Unauthorized
     │         YES
     ↓
JWT valid?
     │
     ├─→ Valid token? ──────────→ NO ──→ 401 Invalid Session
     │         YES
     ↓
Has API key?
     │
     ├─→ Authorization header? ──→ NO ──→ 401 Missing API Key
     │         YES
     ↓
API key valid?
     │
     ├─→ Exists in DB? ─────────→ NO ──→ 401 Invalid Key
     │         YES
     ├─→ Is active? ────────────→ NO ──→ 401 Inactive Key
     │         YES
     ├─→ Not expired? ──────────→ NO ──→ 401 Expired Key
     │         YES
     ↓
User role authorized?
     │
     ├─→ SuperAdmin or Admin? ──→ NO ──→ 403 Forbidden
     │         YES
     ↓
Domain access allowed?
     │
     ├─→ SuperAdmin? ───────────→ YES ──→ ✅ Access ALL domains
     │         NO
     ├─→ Domain matches email? ─→ NO ──→ 403 Domain Mismatch
     │         YES
     ↓
✅ AUTHORIZED - Return filtered data
```

---

## 📊 Data Flow

### Summary Stats Query

```
1. Cursor asks: "Show usage stats"
   ↓
2. MCP request: GET usage-stats://getaifactory.com/summary
   ↓
3. Server extracts domain: "getaifactory.com"
   ↓
4. Query users:
   ┌────────────────────────────────────┐
   │ Firestore: users                   │
   │ WHERE email contains @getaifactory │
   │ RESULT: [user1, user2, user3]      │
   └────────────┬───────────────────────┘
                │
                ↓
5. Query conversations:
   ┌────────────────────────────────────┐
   │ Firestore: conversations           │
   │ WHERE userId IN [user1, user2...]  │
   │ RESULT: 45 conversations           │
   └────────────┬───────────────────────┘
                │
                ↓
6. Aggregate:
   ┌────────────────────────────────────┐
   │ • Count total: 45                  │
   │ • Sum messages: 234                │
   │ • Count Flash: 40                  │
   │ • Count Pro: 5                     │
   │ • Calculate costs                  │
   │ • Calculate averages               │
   └────────────┬───────────────────────┘
                │
                ↓
7. Return JSON:
   {
     "domain": "getaifactory.com",
     "totalAgents": 45,
     "totalMessages": 234,
     "activeUsers": 3,
     "totalCost": 12.50,
     "modelBreakdown": {...}
   }
   ↓
8. Cursor formats as natural language
   ↓
9. You see: "Your domain has 45 agents with 234 messages..."
```

---

## 🎯 Resource Types

### Visual Map

```
usage-stats://
    │
    └─ {domain}/
         │
         ├─ summary/          → Overall stats (agents, messages, costs)
         │   └─ Returns: UsageSummary object
         │
         ├─ agents/           → Per-agent details
         │   └─ Returns: AgentStats[] array
         │
         ├─ users/            → Per-user activity
         │   └─ Returns: UserActivityStats[] array
         │
         └─ costs/            → Cost breakdown
             └─ Returns: CostBreakdown object
```

### Example URIs

```
✅ usage-stats://getaifactory.com/summary
✅ usage-stats://getaifactory.com/agents
✅ usage-stats://getaifactory.com/users
✅ usage-stats://getaifactory.com/costs

❌ usage-stats://summary (missing domain)
❌ stats://getaifactory.com/summary (wrong protocol)
❌ usage-stats://getaifactory.com/invalid (unknown resource)
```

---

## 👥 User Roles

### Access Matrix

```
┌──────────────┬─────────────┬─────────────┬──────────────┐
│ User Role    │ Create MCP  │ View Servers│ Access Data  │
├──────────────┼─────────────┼─────────────┼──────────────┤
│ SuperAdmin   │     ✅      │  All servers│  All domains │
│ Admin        │     ❌      │  Own servers│  Own domain  │
│ User         │     ❌      │      ❌     │      ❌      │
└──────────────┴─────────────┴─────────────┴──────────────┘
```

### Permissions Breakdown

**SuperAdmin:**
```
alec@getaifactory.com
    │
    ├─ Can create MCP servers
    ├─ Can assign to any domain
    ├─ Can view ALL servers
    ├─ Can access ALL domains' data
    ├─ Can delete servers
    └─ Can regenerate API keys
```

**Admin:**
```
admin@clientdomain.com
    │
    ├─ Cannot create MCP servers
    ├─ Can view servers assigned to "clientdomain.com"
    ├─ Can access ONLY "clientdomain.com" data
    ├─ Cannot access other domains
    └─ Read-only access
```

---

## 📁 File Organization

```
salfagpt/
│
├─ src/
│  ├─ mcp/                       # MCP Server Code
│  │  ├─ README.md               # Architecture
│  │  └─ usage-stats.ts          # Core logic
│  │
│  ├─ pages/api/mcp/             # API Endpoints
│  │  ├─ usage-stats.ts          # MCP protocol handler
│  │  └─ servers.ts              # Server management
│  │
│  ├─ components/                # UI Components
│  │  └─ MCPServerManagement.tsx # Admin interface
│  │
│  └─ types/                     # TypeScript
│     └─ mcp.ts                  # MCP types
│
├─ docs/                         # Documentation
│  ├─ MCP_README.md              # Overview (this file's sibling)
│  ├─ MCP_SERVER_SETUP_*.md      # Complete guide
│  ├─ MCP_CURSOR_QUICK_START.md  # Quick guide
│  └─ MCP_*_COMPLETE.md          # Summary
│
├─ scripts/                      # Automation
│  └─ test-mcp-server.ts         # Test script
│
└─ firestore.indexes.json        # Database indexes
```

---

## 🎓 Key Concepts

### MCP (Model Context Protocol)

**What is it?**
> A standard protocol for AI assistants to securely access structured data

**Why use it?**
- ✅ Standard (not custom API)
- ✅ Secure (built-in auth)
- ✅ Structured (JSON resources)
- ✅ AI-friendly (easy for LLMs to use)

### Resources vs Tools

**Resources** (What we built):
- **Read-only data**
- **Static queries**
- **Pre-aggregated stats**
- **Example:** `usage-stats://domain/summary`

**Tools** (Future):
- **Actions/mutations**
- **Dynamic queries**
- **Custom parameters**
- **Example:** `create-agent(name, model)`

---

## 🚀 From Zero to Working in 7 Steps

```
1. Deploy Firestore indexes        (1 min)
   firebase deploy --only firestore:indexes
   
2. Start dev server                (30 sec)
   npm run dev
   
3. Login as SuperAdmin             (30 sec)
   http://localhost:3000
   
4. Create MCP server               (2 min)
   Admin → MCP Servers → Create
   
5. Save API key                    (30 sec)
   Copy and store securely
   
6. Configure Cursor                (2 min)
   Edit ~/.cursor/mcp.json
   
7. Test query                      (30 sec)
   "Show me usage stats"
   
─────────────────────────────────────────
TOTAL TIME: ~7 minutes
RESULT: ✅ Working MCP server!
```

---

## 📈 Example Queries & Responses

### Query 1: Overview

**Ask:**
```
"Show me usage stats for getaifactory.com"
```

**Cursor Gets:**
```json
{
  "domain": "getaifactory.com",
  "totalAgents": 45,
  "totalMessages": 234,
  "activeUsers": 3,
  "totalCost": 12.50,
  "modelBreakdown": {
    "flash": { "count": 40, "percentage": 88.9 },
    "pro": { "count": 5, "percentage": 11.1 }
  }
}
```

**You See:**
```
Here are your usage stats for getaifactory.com:

📊 Overview:
• Total Agents: 45
• Total Messages: 234
• Active Users: 3
• Estimated Cost: $12.50

🤖 Model Distribution:
• Flash: 40 agents (88.9%)
• Pro: 5 agents (11.1%)

📈 Averages:
• 5.2 messages per agent
• $0.28 cost per agent
```

---

### Query 2: Top Agents

**Ask:**
```
"Which agents have the most activity?"
```

**Cursor Gets:**
```json
[
  {
    "agentId": "conv-123",
    "agentTitle": "Customer Support Bot",
    "messageCount": 45,
    "lastUsed": "2025-10-29T15:30:00Z",
    "model": "gemini-2.5-flash"
  },
  {...}
]
```

**You See:**
```
Top agents by activity:

1. Customer Support Bot (45 messages)
   • Last used: Today at 3:30 PM
   • Model: Flash

2. Marketing Copy Assistant (38 messages)
   • Last used: Yesterday
   • Model: Flash

3. Data Analysis Pro (22 messages)
   • Last used: 2 days ago
   • Model: Pro
```

---

## ✅ What's Ready

**Code:** ✅ Complete and type-safe  
**Security:** ✅ Multi-layer authentication  
**Documentation:** ✅ 4 comprehensive guides  
**Testing:** ✅ Test script ready  
**UI:** ✅ Admin interface complete  

**Status:** Ready for you to test! 🎉

---

## 🔄 Next Steps

### For You (Right Now)

1. **Review** this document
2. **Run** `npm run test:mcp`
3. **Deploy** Firestore indexes
4. **Create** first server via UI
5. **Test** in Cursor

### After Testing

1. **Provide feedback** on UX
2. **Report issues** found
3. **Suggest improvements**
4. **Request Phase 2 features**

### For Production

1. Upgrade API key hashing (bcrypt)
2. Add rate limiting
3. Implement caching
4. Set up monitoring
5. Security audit

---

**All set! Ready to test when you are.** 🚀








