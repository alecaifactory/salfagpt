# MCP Servers - Flow Platform

## 🎯 Purpose

Model Context Protocol (MCP) servers provide secure, structured access to platform data for AI assistants like Cursor. This enables AI-powered workflows while maintaining security and data isolation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 MCP SERVER ARCHITECTURE                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Cursor AI (Client)                                     │
│      ↓ (MCP Protocol)                                   │
│  MCP Server                                             │
│      ├─ Authentication (API Key)                        │
│      ├─ Authorization (SuperAdmin/Admin roles)          │
│      ├─ Resource Providers                              │
│      │   ├─ Usage Stats                                 │
│      │   ├─ Agent Stats (future)                        │
│      │   └─ Domain Stats (future)                       │
│      └─ Tools (future)                                  │
│          ├─ Query Builder                               │
│          └─ Data Export                                 │
│                                                         │
│  Firestore Database                                     │
│      ├─ conversations                                   │
│      ├─ messages                                        │
│      ├─ users                                           │
│      └─ organizations                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Model

### Role-Based Access

**SuperAdmin** (`alec@getaifactory.com`):
- ✅ Can create MCP servers
- ✅ Can assign servers to domains
- ✅ Access to all domains' data
- ✅ Can view cross-domain analytics

**Admin** (domain admins):
- ✅ Can view their domain's MCP servers
- ✅ Access only to their domain's data
- ✅ Cannot create new MCP servers
- ✅ Read-only access

**Users**:
- ❌ No MCP access

### Authentication

**API Key-Based:**
```
Authorization: Bearer mcp_[environment]_[random]
```

**Keys stored in:**
- Firestore collection: `mcp_servers`
- Hashed for security
- Expirable (90-day default)

---

## 📊 MCP Servers

### 1. Usage Stats Server (Read-Only)

**Purpose:** Provide usage statistics for agents/products per domain

**Resources:**
- `usage-stats://{domainId}/summary` - Overall domain statistics
- `usage-stats://{domainId}/agents` - Per-agent usage
- `usage-stats://{domainId}/users` - Per-user activity
- `usage-stats://{domainId}/costs` - Cost breakdown

**Access:** SuperAdmin (all domains), Admin (own domain only)

**Status:** ✅ Initial Implementation

---

## 🚀 Usage

### Cursor Configuration

```json
// .cursor/mcp.json (user-specific, not committed)
{
  "mcpServers": {
    "flow-usage-stats": {
      "url": "http://localhost:3000/mcp/usage-stats",
      "apiKey": "mcp_localhost_xxxxx",
      "domain": "getaifactory.com"
    }
  }
}
```

### Example Queries

```typescript
// In Cursor, you can now ask:
// "Show me usage stats for all agents in my domain"
// "Which products have the most conversations?"
// "What's our cost breakdown by agent?"

// The MCP server will return structured data
```

---

## 📋 Roadmap

### Phase 1: Read-Only Stats (Current)
- [x] Usage statistics resource
- [x] SuperAdmin authentication
- [x] Domain filtering
- [x] Basic error handling

### Phase 2: Advanced Queries
- [ ] Custom date ranges
- [ ] Aggregation options
- [ ] Export functionality
- [ ] Performance metrics

### Phase 3: Write Operations (Future)
- [ ] Create agents via MCP
- [ ] Update configurations
- [ ] Batch operations
- [ ] Audit trail

### Phase 4: Multi-Domain
- [ ] Admin-specific servers
- [ ] Domain isolation
- [ ] Permission management
- [ ] Sharing controls

---

## 🔐 Security Checklist

Before deploying MCP servers:

- [ ] API keys stored hashed in Firestore
- [ ] SuperAdmin role verified
- [ ] Domain isolation enforced
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] HTTPS in production
- [ ] Key rotation policy documented
- [ ] Access logs monitored

---

**Last Updated:** 2025-10-30  
**Status:** 🚧 Initial Implementation  
**Version:** 1.0.0

