# MCP Server Setup Guide

**Created:** 2025-10-30  
**Purpose:** Enable secure AI assistant access to platform data via Model Context Protocol  
**Initial Use Case:** Read-only usage statistics for Cursor AI

---

## 🎯 What is MCP?

**Model Context Protocol (MCP)** is a standard for providing structured, secure access to data sources for AI assistants. Think of it as an API specifically designed for AI tools like Cursor to safely query your platform data.

### Why MCP?

✅ **Secure:** Token-based authentication, role-based access  
✅ **Structured:** AI gets well-formatted data, not raw database dumps  
✅ **Read-Only:** Initial implementation is read-only (no mutations)  
✅ **Auditable:** All access logged for security  
✅ **Flexible:** Can expose different data to different roles

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Cursor AI                                               │
│    ↓ (asks: "Show usage stats for my domain")           │
├─────────────────────────────────────────────────────────┤
│  MCP Client (in Cursor)                                  │
│    ↓ (HTTP POST with API key)                           │
├─────────────────────────────────────────────────────────┤
│  Flow Platform - MCP Server                              │
│    ├─ Verify API key                                     │
│    ├─ Check role (SuperAdmin/Admin)                      │
│    ├─ Filter by domain                                   │
│    └─ Return usage stats                                 │
│         ↓                                                │
├─────────────────────────────────────────────────────────┤
│  Firestore Database                                      │
│    ├─ conversations (agents)                             │
│    ├─ messages                                           │
│    ├─ users                                              │
│    └─ organizations                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (SuperAdmin)

### Step 1: Create MCP Server

1. Login as SuperAdmin (`alec@getaifactory.com`)
2. Navigate to Admin Panel
3. Click "MCP Servers" tab
4. Click "Create Server"
5. Fill in details:
   - **Name:** "Flow Usage Stats"
   - **Description:** "Read-only usage statistics"
   - **Type:** Usage Stats
   - **Domains:** getaifactory.com
   - **Expires:** 90 days
6. Click "Create Server"

**Result:** You'll get an API key - **save it immediately!**

```
API Key: mcp_localhost_a1b2c3d4e5f6...
```

---

### Step 2: Configure Cursor

Create or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "flow-usage-stats": {
      "url": "http://localhost:3000/api/mcp/usage-stats",
      "apiKey": "mcp_localhost_YOUR_KEY_HERE",
      "domain": "getaifactory.com"
    }
  }
}
```

**Important:**
- ✅ Use `http://localhost:3000` for local development
- ✅ Use `https://your-production-domain.com` for production
- ✅ Keep API key secure (don't commit to git)

---

### Step 3: Test in Cursor

Restart Cursor and try these queries:

```
"Show me usage stats for getaifactory.com domain"
"Which agents have the most conversations?"
"What's our cost breakdown by model?"
"How many active users do we have?"
```

The MCP server will provide structured data that Cursor can use to answer your questions.

---

## 📊 Available Resources

### 1. Summary (`usage-stats://{domain}/summary`)

**Returns:**
```json
{
  "domain": "getaifactory.com",
  "period": "all-time",
  "totalAgents": 45,
  "totalConversations": 45,
  "totalMessages": 234,
  "activeUsers": 3,
  "totalCost": 12.50,
  "averageMessagesPerAgent": 5.2,
  "modelBreakdown": {
    "flash": { "count": 40, "percentage": 88.9 },
    "pro": { "count": 5, "percentage": 11.1 }
  }
}
```

**Use Cases:**
- Dashboard overview
- Executive reports
- Cost monitoring
- Growth tracking

---

### 2. Agents (`usage-stats://{domain}/agents`)

**Returns:**
```json
[
  {
    "agentId": "conv-123",
    "agentTitle": "Customer Support Bot",
    "conversationCount": 1,
    "messageCount": 45,
    "uniqueUsers": 1,
    "lastUsed": "2025-10-30T10:00:00Z",
    "model": "gemini-2.5-flash"
  }
]
```

**Use Cases:**
- Agent performance analysis
- Identify most-used agents
- Model distribution
- Optimization opportunities

---

### 3. Users (`usage-stats://{domain}/users`)

**Returns:**
```json
[
  {
    "userId": "user-123",
    "email": "john@getaifactory.com",
    "name": "John Doe",
    "role": "user",
    "totalAgents": 5,
    "totalMessages": 120,
    "lastActive": "2025-10-29T15:30:00Z"
  }
]
```

**Use Cases:**
- User engagement tracking
- Power user identification
- Onboarding effectiveness
- Churn prediction

---

### 4. Costs (`usage-stats://{domain}/costs`)

**Returns:**
```json
{
  "domain": "getaifactory.com",
  "totalCost": 12.50,
  "byModel": {
    "flash": 2.00,
    "pro": 10.50
  },
  "byAgent": {
    "flash": 40,
    "pro": 5
  }
}
```

**Use Cases:**
- Budget monitoring
- Cost optimization
- Model selection analysis
- ROI calculation

---

## 🔒 Security

### Authentication Flow

```
1. Cursor sends request with API key
   ↓
2. Server verifies key in Firestore (mcp_servers collection)
   ↓
3. Server checks if key is active and not expired
   ↓
4. Server loads user by session
   ↓
5. Server verifies role (SuperAdmin or Admin)
   ↓
6. Server enforces domain access:
   - SuperAdmin: All domains ✅
   - Admin: Own domain only ✅
   ↓
7. Server returns filtered data
```

### Role-Based Access

**SuperAdmin** (`alec@getaifactory.com`):
- ✅ Create MCP servers
- ✅ Assign servers to domains
- ✅ View all domains' data
- ✅ Manage server lifecycle

**Admin** (domain-specific):
- ✅ View servers assigned to their domain
- ✅ Access only their domain's data
- ❌ Cannot create or delete servers
- ❌ Cannot access other domains

**Users:**
- ❌ No MCP access

### API Key Security

**Best Practices:**
- ✅ Store in secure location (password manager, env vars)
- ✅ Never commit to version control
- ✅ Rotate every 90 days (configurable)
- ✅ Revoke immediately if compromised
- ✅ Use separate keys for dev/staging/prod

**Key Format:**
```
mcp_[environment]_[64-char-random-hex]

Examples:
- mcp_localhost_a1b2c3d4e5f6...
- mcp_production_x9y8z7w6v5u4...
```

---

## 🛠️ Development

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Create MCP server via UI
# Navigate to http://localhost:3000/admin
# Go to "MCP Servers" tab
# Create server

# 3. Copy API key and configure Cursor

# 4. Test in Cursor
# Ask: "Show me usage stats"
```

### Testing with curl

```bash
# List resources
curl -X POST http://localhost:3000/api/mcp/usage-stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mcp_localhost_YOUR_KEY" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "id": 1
  }'

# Read specific resource
curl -X POST http://localhost:3000/api/mcp/usage-stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mcp_localhost_YOUR_KEY" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "usage-stats://getaifactory.com/summary"
    },
    "id": 2
  }'
```

---

## 📋 Admin Workflows

### For SuperAdmin: Creating a Server

**Scenario:** Enable admin@example.com to view their domain stats in Cursor

**Steps:**
1. Login as SuperAdmin
2. Go to Admin Panel → MCP Servers
3. Click "Create Server"
4. Configure:
   - Name: "Example Corp Stats"
   - Domains: example.com
   - Type: usage-stats
   - Expires: 90 days
5. Save API key
6. Share API key with admin@example.com (securely)
7. Provide Cursor configuration

**Admin receives:**
```json
{
  "mcpServers": {
    "example-corp-stats": {
      "url": "https://flow.yourcompany.com/api/mcp/usage-stats",
      "apiKey": "mcp_production_...",
      "domain": "example.com"
    }
  }
}
```

---

### For Admin: Using MCP Server

**Scenario:** View your domain's usage stats in Cursor

**Steps:**
1. Receive MCP server config from SuperAdmin
2. Add config to `~/.cursor/mcp.json`
3. Restart Cursor
4. Test connection:
   ```
   "Show me usage stats for my domain"
   ```
5. Verify you only see your domain's data

**Limitations:**
- ❌ Cannot create new MCP servers
- ❌ Cannot access other domains' data
- ✅ Read-only access to own domain

---

## 🔧 Firestore Collections

### mcp_servers

```typescript
{
  id: string;
  name: string;
  description: string;
  type: 'usage-stats';
  createdBy: string; // SuperAdmin user ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  apiKeyHash: string; // Base64 hash (use bcrypt in prod)
  isActive: boolean;
  expiresAt?: Timestamp;
  assignedDomains: string[];
  allowedRoles: ['superadmin', 'admin'];
  resources: string[]; // ['summary', 'agents', 'users', 'costs']
  endpoint: string; // '/api/mcp/usage-stats'
  usageCount: number;
  lastUsed?: Timestamp;
}
```

### mcp_api_keys

```typescript
{
  id: string;
  serverId: string;
  keyHash: string;
  keyPrefix: string; // First 12 chars for display
  createdBy: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  isActive: boolean;
  usageCount: number;
  lastUsed?: Timestamp;
  metadata: {
    description?: string;
    environment: 'localhost' | 'production';
  };
}
```

---

## 🚨 Security Checklist

Before going to production:

**API Keys:**
- [ ] Stored hashed in Firestore (bcrypt, not base64)
- [ ] Never logged in plaintext
- [ ] Rotation policy documented (90 days)
- [ ] Revocation process tested

**Access Control:**
- [ ] SuperAdmin role verified
- [ ] Domain isolation enforced
- [ ] No cross-domain data leakage
- [ ] Audit logging enabled

**Network:**
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Request size limits set

**Monitoring:**
- [ ] Usage tracking active
- [ ] Error alerting configured
- [ ] Access logs reviewed daily
- [ ] Anomaly detection enabled

---

## 📈 Roadmap

### Phase 1: Read-Only Stats ✅ (Current)
- [x] Usage statistics endpoint
- [x] SuperAdmin authentication
- [x] Domain filtering
- [x] Basic UI for management

### Phase 2: Enhanced Stats (Next)
- [ ] Custom date ranges
- [ ] Real-time updates
- [ ] Export to CSV/JSON
- [ ] Performance metrics
- [ ] Cost projections

### Phase 3: Multi-Domain Support
- [ ] Admin-specific servers
- [ ] Per-domain API keys
- [ ] Domain isolation UI
- [ ] Sharing controls

### Phase 4: Write Operations (Future)
- [ ] Create agents via MCP
- [ ] Update configurations
- [ ] Batch operations
- [ ] Workflow automation

---

## 🐛 Troubleshooting

### "Unauthorized" Error

**Symptom:** MCP requests return 401 Unauthorized

**Checks:**
1. API key is correct
2. Server is active (`isActive: true`)
3. Server not expired
4. User is SuperAdmin or Admin
5. Session cookie is valid

**Fix:**
```bash
# Verify server in Firestore
# Check: isActive, expiresAt, apiKeyHash
```

---

### "Forbidden" Error

**Symptom:** MCP requests return 403 Forbidden

**Checks:**
1. User role is SuperAdmin or Admin
2. Admin trying to access their own domain only
3. Domain exists in assignedDomains

**Fix:**
- SuperAdmin: Should have access to all
- Admin: Verify domain matches email

---

### "No Data Returned"

**Symptom:** Stats show 0 for everything

**Checks:**
1. Users exist in domain
2. Conversations exist for users
3. Firestore indexes are deployed
4. Query filters are correct

**Fix:**
```bash
# Check users in domain
# Firestore Console > users collection
# Filter: email contains @domain.com

# Check conversations
# Firestore Console > conversations collection
# Verify userId matches users
```

---

### "Invalid URI" Error

**Symptom:** Resource read fails with invalid URI

**Checks:**
1. URI format: `usage-stats://{domain}/{resource}`
2. Resource is valid: `summary`, `agents`, `users`, `costs`
3. Domain exists

**Fix:**
```
Valid:   usage-stats://getaifactory.com/summary
Invalid: usage-stats/summary (missing domain)
Invalid: stats://getaifactory.com/summary (wrong protocol)
```

---

## 📚 API Reference

### Create Server (SuperAdmin only)

```http
POST /api/mcp/servers
Content-Type: application/json
Cookie: flow_session=...

{
  "name": "Usage Stats Server",
  "description": "Read-only usage statistics",
  "type": "usage-stats",
  "assignedDomains": ["getaifactory.com"],
  "resources": ["summary", "agents", "users", "costs"],
  "expiresInDays": 90
}
```

**Response:**
```json
{
  "server": {
    "id": "server-123",
    "name": "Usage Stats Server",
    ...
  },
  "apiKey": "mcp_localhost_...",
  "warning": "Store this API key securely. It will not be shown again."
}
```

---

### List Servers

```http
GET /api/mcp/servers
Cookie: flow_session=...
```

**Response:**
```json
{
  "servers": [
    {
      "id": "server-123",
      "name": "Usage Stats Server",
      "type": "usage-stats",
      "assignedDomains": ["getaifactory.com"],
      "isActive": true,
      "usageCount": 42
    }
  ]
}
```

---

### MCP Request (from Cursor)

```http
POST /api/mcp/usage-stats
Content-Type: application/json
Authorization: Bearer mcp_localhost_...
Cookie: flow_session=...

{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "usage-stats://getaifactory.com/summary"
  },
  "id": 1
}
```

**Response:**
```json
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
```

---

## 🎓 Best Practices

### API Key Management

**DO:**
- ✅ Store in environment variables or secure vault
- ✅ Rotate every 90 days
- ✅ Use separate keys for dev/staging/prod
- ✅ Revoke old keys after rotation

**DON'T:**
- ❌ Commit to version control
- ❌ Share in chat/email (use secure channels)
- ❌ Reuse across environments
- ❌ Log in plaintext

---

### Resource Design

**DO:**
- ✅ Keep resources focused (single responsibility)
- ✅ Return structured, consistent data
- ✅ Include metadata (timestamps, counts)
- ✅ Filter by domain automatically

**DON'T:**
- ❌ Return raw database dumps
- ❌ Include sensitive user data
- ❌ Mix multiple concerns in one resource
- ❌ Return unfiltered cross-domain data

---

### Error Handling

**DO:**
- ✅ Return descriptive error messages
- ✅ Use appropriate HTTP status codes
- ✅ Log errors for debugging
- ✅ Provide troubleshooting hints

**DON'T:**
- ❌ Expose internal errors to client
- ❌ Return stack traces
- ❌ Silent failures
- ❌ Generic "error occurred" messages

---

## 📖 Related Documentation

**Internal:**
- `.cursor/rules/privacy.mdc` - Security model
- `.cursor/rules/data.mdc` - Database schema
- `.cursor/rules/backend.mdc` - API patterns
- `src/mcp/README.md` - MCP architecture

**External:**
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)

---

## ✅ Success Criteria

A properly implemented MCP server should:

**Functionality:**
- ✅ SuperAdmin can create servers
- ✅ Admin can view their servers
- ✅ Stats are accurate and up-to-date
- ✅ Cursor can query successfully

**Security:**
- ✅ API keys required and verified
- ✅ Role-based access enforced
- ✅ Domain isolation working
- ✅ All access logged

**Performance:**
- ✅ Responses < 2 seconds
- ✅ Efficient Firestore queries
- ✅ Proper error handling
- ✅ Rate limiting in place

**UX:**
- ✅ Easy server creation
- ✅ Clear API key display (once)
- ✅ Helpful error messages
- ✅ Usage tracking visible

---

**Last Updated:** 2025-10-30  
**Status:** ✅ Initial Implementation Complete  
**Version:** 1.0.0  
**Next:** Phase 2 - Enhanced stats with date ranges










