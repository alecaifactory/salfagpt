# MCP Developer Guide - Flow Platform

**Audience:** Developers integrating with or extending Flow  
**Purpose:** Complete guide to building on top of Flow's MCP infrastructure  
**Level:** Intermediate to Advanced

---

## 🎯 For Developers

Welcome! This guide will help you:
- ✅ **Integrate** your tools with Flow via MCP
- ✅ **Build** custom MCP servers on Flow
- ✅ **Extend** existing MCP resources
- ✅ **Contribute** to the platform

### Why MCP for Developers?

**Traditional API:**
```javascript
// Manual REST integration
const stats = await fetch('/api/stats?domain=x&metric=y&range=z')
const data = await stats.json()
// Parse, validate, transform...
```

**With MCP:**
```javascript
// AI assistant does the work
"Show me stats for domain X"
// MCP server returns structured data
// AI formats it naturally
```

**Benefits:**
- 🚀 **Faster integration** - Standard protocol
- 🤖 **AI-native** - Built for LLM consumption
- 🔒 **Secure by default** - Auth + RBAC built-in
- 📊 **Structured data** - Type-safe responses
- 🔄 **Self-documenting** - Resources describe themselves

---

## 🏗️ Architecture for Developers

### MCP Server Anatomy

```typescript
┌─────────────────────────────────────────────────────────┐
│                   MCP SERVER                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Authentication Layer                                │
│     ├─ Verify session (JWT)                             │
│     ├─ Verify API key                                   │
│     └─ Check permissions                                │
│                                                         │
│  2. Resource Providers                                  │
│     ├─ List available resources                         │
│     ├─ Read specific resource                           │
│     └─ Transform data for AI                            │
│                                                         │
│  3. Tool Providers (future)                             │
│     ├─ List available tools                             │
│     ├─ Execute tool with params                         │
│     └─ Return execution result                          │
│                                                         │
│  4. Data Layer                                          │
│     ├─ Query Firestore                                  │
│     ├─ Aggregate statistics                             │
│     └─ Apply security filters                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Building Your First MCP Integration

### Use Case: Custom Analytics Dashboard

**Goal:** Query Flow stats from your own application

**Step 1: Get API Access**

```typescript
// Contact SuperAdmin to create MCP server for your domain
// You'll receive:
const config = {
  url: 'https://flow.yourcompany.com/api/mcp/usage-stats',
  apiKey: 'mcp_production_...',
  domain: 'yourcompany.com'
}
```

**Step 2: Make MCP Request**

```typescript
// Node.js example
import fetch from 'node-fetch';

async function getUsageStats(domain: string) {
  const response = await fetch('https://flow.yourcompany.com/api/mcp/usage-stats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MCP_API_KEY}`,
      'Cookie': `flow_session=${process.env.FLOW_SESSION}`, // From login
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'resources/read',
      params: {
        uri: `usage-stats://${domain}/summary`
      },
      id: Date.now(),
    }),
  });

  const data = await response.json();
  return data.result;
}

// Usage
const stats = await getUsageStats('yourcompany.com');
console.log(`Total agents: ${stats.totalAgents}`);
console.log(`Total messages: ${stats.totalMessages}`);
```

**Step 3: Display in Your App**

```typescript
// React example
function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getUsageStats('yourcompany.com').then(setStats);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <StatCard 
        title="Total Agents" 
        value={stats.totalAgents}
        icon="🤖"
      />
      <StatCard 
        title="Total Messages" 
        value={stats.totalMessages}
        icon="💬"
      />
      <StatCard 
        title="Active Users" 
        value={stats.activeUsers}
        icon="👥"
      />
      <ModelBreakdown data={stats.modelBreakdown} />
    </div>
  );
}
```

---

## 🔧 Extending Flow MCP

### Adding a New Resource Type

**Example:** Add "context-stats" resource for document usage

**Step 1: Define Types**

```typescript
// src/types/mcp.ts
export interface ContextStats {
  domain: string;
  totalSources: number;
  totalDocuments: number;
  averageExtraction: number;
  byType: {
    pdf: number;
    csv: number;
    excel: number;
    word: number;
  };
}
```

**Step 2: Implement Data Fetching**

```typescript
// src/mcp/usage-stats.ts
async function getContextStats(domainId: string): Promise<ContextStats> {
  // Get users in domain
  const users = await getUsersInDomain(domainId);
  const userIds = users.map(u => u.id);

  // Query context sources
  const sourcesSnapshot = await firestore
    .collection('context_sources')
    .where('userId', 'in', userIds.slice(0, 10))
    .get();

  const sources = sourcesSnapshot.docs.map(doc => doc.data());

  // Aggregate stats
  return {
    domain: domainId,
    totalSources: sources.length,
    totalDocuments: sources.filter(s => s.extractedData).length,
    averageExtraction: sources.reduce((sum, s) => 
      sum + (s.metadata?.extractionTime || 0), 0
    ) / sources.length,
    byType: {
      pdf: sources.filter(s => s.type === 'pdf').length,
      csv: sources.filter(s => s.type === 'csv').length,
      excel: sources.filter(s => s.type === 'excel').length,
      word: sources.filter(s => s.type === 'word').length,
    },
  };
}
```

**Step 3: Add to Resource List**

```typescript
// src/mcp/usage-stats.ts - in listResources()
resources.push({
  uri: `usage-stats://${domainId}/context`,
  name: `Context Stats - ${domainId}`,
  description: `Document and context usage for ${domainId}`,
  mimeType: 'application/json',
});
```

**Step 4: Handle in readResource**

```typescript
// src/mcp/usage-stats.ts - in readResource()
switch (resource) {
  case 'summary':
    data = await getUsageSummary(domainId);
    break;
  case 'context':  // NEW
    data = await getContextStats(domainId);
    break;
  // ... other cases
}
```

**Step 5: Test**

```typescript
// In Cursor
"Show me context stats for getaifactory.com"

// Expected response with your new data!
```

---

## 🔌 Building a Custom MCP Server

### Use Case: Agent Performance Monitoring

**Goal:** Create MCP server for agent health metrics

**Step 1: Create Server Module**

```typescript
// src/mcp/agent-health.ts
import { firestore } from '../lib/firestore';

export interface AgentHealth {
  agentId: string;
  title: string;
  status: 'healthy' | 'degraded' | 'critical';
  metrics: {
    responseTime: number; // ms
    errorRate: number; // %
    uptime: number; // %
    lastActive: Date;
  };
  alerts: string[];
}

export async function getAgentHealth(
  domainId: string
): Promise<AgentHealth[]> {
  // Query conversations (agents)
  const agents = await getAgentsInDomain(domainId);
  
  return agents.map(agent => {
    const health = calculateHealth(agent);
    return {
      agentId: agent.id,
      title: agent.title,
      status: health.status,
      metrics: health.metrics,
      alerts: health.alerts,
    };
  });
}

function calculateHealth(agent: any): any {
  // Your health calculation logic
  const daysSinceActive = getDaysSince(agent.lastMessageAt);
  const errorRate = calculateErrorRate(agent);
  
  return {
    status: errorRate > 5 ? 'critical' 
      : daysSinceActive > 7 ? 'degraded' 
      : 'healthy',
    metrics: {
      responseTime: 0, // TODO: Calculate from message timestamps
      errorRate,
      uptime: 100 - errorRate,
      lastActive: agent.lastMessageAt,
    },
    alerts: [
      errorRate > 5 && 'High error rate',
      daysSinceActive > 7 && 'Inactive for >7 days',
    ].filter(Boolean),
  };
}
```

**Step 2: Create API Endpoint**

```typescript
// src/pages/api/mcp/agent-health.ts
import type { APIRoute } from 'astro';
import { handleMCPRequest } from '../../../mcp/agent-health';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Similar to usage-stats.ts
  // Add your custom auth/logic
  const response = await handleMCPRequest({
    method,
    params,
    apiKey,
    requesterId: session.id,
  });

  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    result: response.data,
    id: requestId,
  }));
};
```

**Step 3: Register Server**

```typescript
// Via UI or API
await fetch('/api/mcp/servers', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Agent Health Monitor',
    type: 'agent-health',
    assignedDomains: ['yourcompany.com'],
    resources: ['health', 'alerts', 'performance'],
    expiresInDays: 90,
  }),
});
```

**Step 4: Use in Cursor**

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "agent-health": {
      "url": "http://localhost:3000/api/mcp/agent-health",
      "apiKey": "mcp_...",
      "domain": "yourcompany.com"
    }
  }
}
```

```
Ask Cursor: "Show me unhealthy agents"
Response: [List of degraded/critical agents with alerts]
```

---

## 🛠️ Development Workflow

### Local Development Setup

**1. Clone and Setup:**
```bash
git clone [repo]
cd salfagpt
npm install
```

**2. Environment:**
```bash
# Copy .env.example
cp .env.example .env

# Add your credentials
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
GOOGLE_AI_API_KEY=...
```

**3. Start Dev Server:**
```bash
npm run dev
# Server at http://localhost:3000
```

**4. Test MCP:**
```bash
# Run test suite
npm run test:mcp

# Expected: ✅ All checks passed
```

---

### Development Cycle

```
1. Design resource schema
   ↓ (Define TypeScript interfaces)
   
2. Implement data fetching
   ↓ (Query Firestore, aggregate)
   
3. Add to MCP server
   ↓ (Update usage-stats.ts or create new)
   
4. Create API endpoint
   ↓ (src/pages/api/mcp/your-server.ts)
   
5. Test with curl
   ↓ (Verify JSON responses)
   
6. Test in Cursor
   ↓ (Natural language queries)
   
7. Document
   ↓ (Add to docs/)
   
8. Submit PR
   ↓ (Following contribution guidelines)
```

---

## 📊 MCP Protocol Deep Dive

### Request Structure

**JSON-RPC 2.0 Format:**
```json
{
  "jsonrpc": "2.0",
  "method": "resources/list" | "resources/read" | "tools/list" | "tools/call",
  "params": {
    "uri": "protocol://domain/resource",
    "arguments": { ... }
  },
  "id": 1
}
```

**Methods:**

**`resources/list`** - Get available resources
```json
Request: {
  "method": "resources/list"
}

Response: {
  "result": {
    "resources": [
      {
        "uri": "usage-stats://domain/summary",
        "name": "Usage Summary",
        "description": "Overall statistics",
        "mimeType": "application/json"
      }
    ]
  }
}
```

**`resources/read`** - Read specific resource
```json
Request: {
  "method": "resources/read",
  "params": {
    "uri": "usage-stats://domain/summary"
  }
}

Response: {
  "result": {
    "domain": "...",
    "totalAgents": 45,
    ...
  }
}
```

---

### Error Handling

**MCP Error Format:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Human-readable error",
    "data": {
      "code": "CUSTOM_ERROR_CODE",
      "details": "Additional context"
    }
  },
  "id": 1
}
```

**Standard Error Codes:**
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error
- `-32000` - Server error (custom)

**Flow-Specific Codes:**
```typescript
'UNAUTHORIZED'      // 401 - Not authenticated
'FORBIDDEN'         // 403 - Not authorized
'INVALID_URI'       // 400 - Malformed URI
'NOT_FOUND'         // 404 - Resource not found
'INTERNAL_ERROR'    // 500 - Server error
```

---

## 🔐 Authentication for Developers

### Getting API Access

**Process:**
1. **Request access** from SuperAdmin
2. **Receive** API key for your domain
3. **Configure** your environment
4. **Test** connection

**Request template:**
```
To: SuperAdmin (alec@getaifactory.com)
Subject: MCP API Access Request

Hi,

I'd like to request MCP API access for:

Domain: mycompany.com
Purpose: [What you're building]
Resources needed: [summary, agents, etc.]
Expected usage: [Daily queries, batch jobs, etc.]

Thanks!
```

**You'll receive:**
```json
{
  "apiKey": "mcp_production_...",
  "endpoint": "https://flow.yourcompany.com/api/mcp/usage-stats",
  "domain": "mycompany.com",
  "expiresAt": "2026-01-28",
  "resources": ["summary", "agents", "users", "costs"]
}
```

---

### Using the API Key

**Environment Variables (Recommended):**
```bash
# .env (never commit!)
MCP_API_KEY=mcp_production_...
MCP_ENDPOINT=https://flow.yourcompany.com/api/mcp/usage-stats
MCP_DOMAIN=mycompany.com
```

**In Code:**
```typescript
const MCP_CONFIG = {
  apiKey: process.env.MCP_API_KEY!,
  endpoint: process.env.MCP_ENDPOINT!,
  domain: process.env.MCP_DOMAIN!,
};

async function mcpRequest(method: string, params?: any) {
  const response = await fetch(MCP_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MCP_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data.result;
}
```

---

## 🧩 SDK for Developers

### TypeScript SDK (Recommended)

```typescript
// flow-mcp-client.ts
import type { MCPRequest, MCPResponse, UsageSummary } from './types/mcp';

export class FlowMCPClient {
  constructor(
    private config: {
      apiKey: string;
      endpoint: string;
      domain: string;
      session?: string; // Optional session token
    }
  ) {}

  private async request(method: string, params?: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.session) {
      headers['Cookie'] = `flow_session=${this.config.session}`;
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new MCPError(data.error.code, data.error.message);
    }
    
    return data.result;
  }

  // High-level methods
  async getUsageSummary(): Promise<UsageSummary> {
    return this.request('resources/read', {
      uri: `usage-stats://${this.config.domain}/summary`,
    });
  }

  async getAgentStats() {
    return this.request('resources/read', {
      uri: `usage-stats://${this.config.domain}/agents`,
    });
  }

  async getUserStats() {
    return this.request('resources/read', {
      uri: `usage-stats://${this.config.domain}/users`,
    });
  }

  async getCostBreakdown() {
    return this.request('resources/read', {
      uri: `usage-stats://${this.config.domain}/costs`,
    });
  }

  // Low-level access
  async listResources() {
    return this.request('resources/list');
  }

  async readResource(uri: string) {
    return this.request('resources/read', { uri });
  }
}

class MCPError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'MCPError';
  }
}

// Usage
const client = new FlowMCPClient({
  apiKey: process.env.MCP_API_KEY!,
  endpoint: 'https://flow.yourcompany.com/api/mcp/usage-stats',
  domain: 'yourcompany.com',
});

const stats = await client.getUsageSummary();
console.log(stats);
```

---

### Python SDK Example

```python
# flow_mcp_client.py
import requests
import os
from typing import Dict, Any

class FlowMCPClient:
    def __init__(self, api_key: str, endpoint: str, domain: str):
        self.api_key = api_key
        self.endpoint = endpoint
        self.domain = domain
        self.session = None
        
    def _request(self, method: str, params: Dict[str, Any] = None) -> Any:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
        }
        
        if self.session:
            headers['Cookie'] = f'flow_session={self.session}'
        
        payload = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params or {},
            'id': 1,
        }
        
        response = requests.post(self.endpoint, json=payload, headers=headers)
        data = response.json()
        
        if 'error' in data:
            raise Exception(f"MCP Error: {data['error']['message']}")
        
        return data.get('result')
    
    def get_usage_summary(self) -> Dict[str, Any]:
        return self._request('resources/read', {
            'uri': f'usage-stats://{self.domain}/summary'
        })
    
    def get_agent_stats(self):
        return self._request('resources/read', {
            'uri': f'usage-stats://{self.domain}/agents'
        })

# Usage
client = FlowMCPClient(
    api_key=os.getenv('MCP_API_KEY'),
    endpoint='https://flow.yourcompany.com/api/mcp/usage-stats',
    domain='yourcompany.com'
)

stats = client.get_usage_summary()
print(f"Total agents: {stats['totalAgents']}")
```

---

## 🎨 Common Integration Patterns

### Pattern 1: Dashboard Widget

**Use Case:** Show live stats in your admin dashboard

```typescript
// DashboardWidget.tsx
export function FlowStatsWidget() {
  const { data, loading } = useFlowMCPQuery('summary');

  return (
    <div className="widget">
      <h3>Flow Platform Stats</h3>
      {loading ? <Spinner /> : (
        <>
          <Metric label="Agents" value={data.totalAgents} />
          <Metric label="Messages" value={data.totalMessages} />
          <Metric label="Cost" value={`$${data.totalCost}`} />
        </>
      )}
    </div>
  );
}
```

---

### Pattern 2: Scheduled Reports

**Use Case:** Daily email with usage stats

```typescript
// scheduled-report.ts (runs via cron)
import { FlowMCPClient } from './flow-mcp-client';
import { sendEmail } from './email-service';

async function sendDailyReport() {
  const client = new FlowMCPClient({
    apiKey: process.env.MCP_API_KEY!,
    endpoint: process.env.MCP_ENDPOINT!,
    domain: process.env.MCP_DOMAIN!,
  });

  const stats = await client.getUsageSummary();
  const agents = await client.getAgentStats();
  
  const topAgents = agents
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);

  await sendEmail({
    to: 'team@yourcompany.com',
    subject: 'Daily Flow Usage Report',
    body: `
      <h2>Usage Stats - ${new Date().toLocaleDateString()}</h2>
      <ul>
        <li>Total Agents: ${stats.totalAgents}</li>
        <li>Total Messages: ${stats.totalMessages}</li>
        <li>Active Users: ${stats.activeUsers}</li>
        <li>Cost: $${stats.totalCost}</li>
      </ul>
      
      <h3>Top 5 Agents:</h3>
      <ol>
        ${topAgents.map(a => `
          <li>${a.agentTitle} - ${a.messageCount} messages</li>
        `).join('')}
      </ol>
    `,
  });
}

// Run daily at 9 AM
cron.schedule('0 9 * * *', sendDailyReport);
```

---

### Pattern 3: Monitoring & Alerts

**Use Case:** Alert when costs exceed threshold

```typescript
// cost-monitor.ts
async function monitorCosts() {
  const client = new FlowMCPClient({ /* config */ });
  const costs = await client.getCostBreakdown();

  const THRESHOLD = 100; // $100

  if (costs.totalCost > THRESHOLD) {
    await sendAlert({
      severity: 'high',
      message: `Flow costs exceeded threshold: $${costs.totalCost}`,
      details: {
        flash: costs.byModel.flash,
        pro: costs.byModel.pro,
        threshold: THRESHOLD,
      },
    });
  }
}

// Run every hour
setInterval(monitorCosts, 60 * 60 * 1000);
```

---

## 🔍 Debugging MCP Integrations

### Enable Verbose Logging

```typescript
// Your client
const client = new FlowMCPClient({
  apiKey: process.env.MCP_API_KEY!,
  endpoint: process.env.MCP_ENDPOINT!,
  domain: process.env.MCP_DOMAIN!,
  debug: true, // Enable debug logs
});

// Will log:
// → MCP Request: resources/read
// → URI: usage-stats://domain/summary
// ← MCP Response: 200 OK (345ms)
// ← Data: { totalAgents: 45, ... }
```

---

### Test with curl

```bash
# Set variables
API_KEY="mcp_localhost_..."
ENDPOINT="http://localhost:3000/api/mcp/usage-stats"
SESSION="your_jwt_token"

# List resources
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Cookie: flow_session=$SESSION" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "id": 1
  }' | jq

# Read resource
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Cookie: flow_session=$SESSION" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "usage-stats://getaifactory.com/summary"
    },
    "id": 2
  }' | jq
```

---

### Common Issues

**Issue: "Unauthorized"**
```typescript
// Check:
1. API key is correct
2. Session token is valid
3. User role is SuperAdmin/Admin
4. Server is active

// Debug:
console.log('API Key:', apiKey.substring(0, 20) + '...');
console.log('Has session:', !!sessionToken);
```

---

**Issue: "Forbidden - Domain Mismatch"**
```typescript
// Check:
1. Your email domain matches requested domain
2. Server is assigned to your domain
3. You're not trying to access other domain (if Admin)

// Debug:
const userDomain = userEmail.split('@')[1];
const requestedDomain = uri.split('://')[1].split('/')[0];
console.log('User domain:', userDomain);
console.log('Requested domain:', requestedDomain);
console.log('Match:', userDomain === requestedDomain);
```

---

**Issue: "Invalid URI"**
```typescript
// Correct format:
usage-stats://getaifactory.com/summary

// Invalid formats:
usage-stats/summary              // Missing domain
stats://domain/summary           // Wrong protocol
usage-stats://domain/invalid     // Unknown resource
```

---

## 🧪 Testing Your Integration

### Unit Tests

```typescript
// __tests__/mcp-client.test.ts
import { FlowMCPClient } from '../flow-mcp-client';

describe('FlowMCPClient', () => {
  const client = new FlowMCPClient({
    apiKey: 'test_key',
    endpoint: 'http://localhost:3000/api/mcp/usage-stats',
    domain: 'test.com',
  });

  it('should fetch usage summary', async () => {
    const stats = await client.getUsageSummary();
    
    expect(stats).toHaveProperty('totalAgents');
    expect(stats).toHaveProperty('totalMessages');
    expect(stats.domain).toBe('test.com');
  });

  it('should handle errors gracefully', async () => {
    // Mock invalid key
    await expect(
      client.readResource('invalid://uri')
    ).rejects.toThrow('Invalid URI');
  });
});
```

---

### Integration Tests

```typescript
// __tests__/mcp-integration.test.ts
describe('MCP Integration', () => {
  let apiKey: string;

  beforeAll(async () => {
    // Create test MCP server
    const response = await createTestMCPServer();
    apiKey = response.apiKey;
  });

  afterAll(async () => {
    // Cleanup test server
    await deleteTestMCPServer();
  });

  it('should complete full flow', async () => {
    // 1. List resources
    const resources = await listResources(apiKey);
    expect(resources.length).toBeGreaterThan(0);

    // 2. Read resource
    const stats = await readResource(
      'usage-stats://test.com/summary',
      apiKey
    );
    expect(stats).toBeDefined();
  });
});
```

---

## 📚 API Reference

### FlowMCPClient Methods

**`listResources()`**
```typescript
async listResources(): Promise<MCPResource[]>

// Returns all available resources for your domain
// Example:
const resources = await client.listResources();
console.log(resources[0].uri); // usage-stats://domain/summary
```

---

**`getUsageSummary()`**
```typescript
async getUsageSummary(): Promise<UsageSummary>

// Returns overview statistics
// Example:
const summary = await client.getUsageSummary();
console.log(`Agents: ${summary.totalAgents}`);
```

---

**`getAgentStats()`**
```typescript
async getAgentStats(): Promise<AgentStats[]>

// Returns per-agent statistics
// Example:
const agents = await client.getAgentStats();
const topAgent = agents.sort((a,b) => b.messageCount - a.messageCount)[0];
console.log(`Top agent: ${topAgent.agentTitle}`);
```

---

**`getUserStats()`**
```typescript
async getUserStats(): Promise<UserActivityStats[]>

// Returns per-user activity
// Example:
const users = await client.getUserStats();
const activeUsers = users.filter(u => u.lastActive > yesterday);
console.log(`Active users: ${activeUsers.length}`);
```

---

**`getCostBreakdown()`**
```typescript
async getCostBreakdown(): Promise<CostBreakdown>

// Returns cost analysis
// Example:
const costs = await client.getCostBreakdown();
console.log(`Flash: $${costs.byModel.flash}`);
console.log(`Pro: $${costs.byModel.pro}`);
```

---

## 🎯 Real-World Examples

### Example 1: Slack Bot Integration

**Use Case:** Query Flow stats from Slack

```typescript
// slack-bot.ts
import { FlowMCPClient } from './flow-mcp-client';

const client = new FlowMCPClient({
  apiKey: process.env.MCP_API_KEY!,
  endpoint: process.env.MCP_ENDPOINT!,
  domain: 'yourcompany.com',
});

// Slack command: /flow-stats
app.command('/flow-stats', async ({ command, ack, say }) => {
  await ack();

  try {
    const stats = await client.getUsageSummary();
    
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Flow Usage Stats*\n\n` +
              `📊 Total Agents: ${stats.totalAgents}\n` +
              `💬 Total Messages: ${stats.totalMessages}\n` +
              `👥 Active Users: ${stats.activeUsers}\n` +
              `💰 Cost: $${stats.totalCost}\n\n` +
              `🤖 Flash: ${stats.modelBreakdown.flash.count} (${stats.modelBreakdown.flash.percentage}%)\n` +
              `🌟 Pro: ${stats.modelBreakdown.pro.count} (${stats.modelBreakdown.pro.percentage}%)`
          }
        }
      ]
    });
  } catch (error) {
    await say(`Error fetching stats: ${error.message}`);
  }
});
```

---

### Example 2: Custom Analytics Pipeline

**Use Case:** ETL Flow stats into your data warehouse

```typescript
// etl-flow-stats.ts
import { FlowMCPClient } from './flow-mcp-client';
import { BigQuery } from '@google-cloud/bigquery';

async function syncFlowStatsToWarehouse() {
  const client = new FlowMCPClient({ /* config */ });
  const bigquery = new BigQuery();

  // 1. Fetch all stats
  const summary = await client.getUsageSummary();
  const agents = await client.getAgentStats();
  const users = await client.getUserStats();
  const costs = await client.getCostBreakdown();

  // 2. Transform for warehouse
  const rows = [
    {
      timestamp: new Date(),
      domain: summary.domain,
      total_agents: summary.totalAgents,
      total_messages: summary.totalMessages,
      active_users: summary.activeUsers,
      total_cost: summary.totalCost,
      flash_percentage: summary.modelBreakdown.flash.percentage,
      pro_percentage: summary.modelBreakdown.pro.percentage,
    }
  ];

  // 3. Insert into BigQuery
  await bigquery
    .dataset('analytics')
    .table('flow_daily_stats')
    .insert(rows);

  console.log('✅ Flow stats synced to warehouse');
}

// Run daily
cron.schedule('0 2 * * *', syncFlowStatsToWarehouse);
```

---

### Example 3: Custom CLI Tool

**Use Case:** CLI for querying Flow from terminal

```typescript
#!/usr/bin/env node
// flow-cli.ts
import { Command } from 'commander';
import { FlowMCPClient } from './flow-mcp-client';

const program = new Command();
const client = new FlowMCPClient({
  apiKey: process.env.MCP_API_KEY!,
  endpoint: process.env.MCP_ENDPOINT!,
  domain: process.env.MCP_DOMAIN!,
});

program
  .name('flow')
  .description('Flow Platform CLI')
  .version('1.0.0');

program
  .command('stats')
  .description('Show usage statistics')
  .action(async () => {
    const stats = await client.getUsageSummary();
    
    console.log('📊 Flow Usage Stats\n');
    console.log(`Domain:         ${stats.domain}`);
    console.log(`Total Agents:   ${stats.totalAgents}`);
    console.log(`Total Messages: ${stats.totalMessages}`);
    console.log(`Active Users:   ${stats.activeUsers}`);
    console.log(`Total Cost:     $${stats.totalCost}`);
    console.log('\n🤖 Model Breakdown:');
    console.log(`Flash: ${stats.modelBreakdown.flash.count} (${stats.modelBreakdown.flash.percentage}%)`);
    console.log(`Pro:   ${stats.modelBreakdown.pro.count} (${stats.modelBreakdown.pro.percentage}%)`);
  });

program
  .command('top-agents')
  .description('Show most active agents')
  .option('-n, --number <count>', 'Number of agents to show', '10')
  .action(async (options) => {
    const agents = await client.getAgentStats();
    const top = agents
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, parseInt(options.number));

    console.log(`🏆 Top ${options.number} Agents:\n`);
    top.forEach((agent, idx) => {
      console.log(`${idx + 1}. ${agent.agentTitle}`);
      console.log(`   Messages: ${agent.messageCount}`);
      console.log(`   Model: ${agent.model}`);
      console.log(`   Last used: ${agent.lastUsed.toLocaleDateString()}\n`);
    });
  });

program.parse();

// Usage:
// $ flow stats
// $ flow top-agents -n 5
```

---

## 🚀 Contributing to Flow MCP

### Adding New MCP Server Types

**Process:**
1. **Fork** repository
2. **Create** feature branch: `feat/mcp-server-[type]-YYYY-MM-DD`
3. **Implement** following existing patterns
4. **Document** in `docs/`
5. **Test** thoroughly
6. **Submit** PR with:
   - Code changes
   - TypeScript types
   - Documentation
   - Test coverage
   - Example usage

**PR Template:**
```markdown
## New MCP Server: [Name]

**Type:** [agent-health, workflow-stats, etc.]
**Purpose:** [What it does]

### Changes
- [ ] Server implementation (src/mcp/[type].ts)
- [ ] API endpoint (src/pages/api/mcp/[type].ts)
- [ ] Types (src/types/mcp.ts)
- [ ] Documentation (docs/MCP_[TYPE].md)
- [ ] Tests (scripts/test-mcp-[type].ts)

### Resources Exposed
- `[type]://domain/resource1` - [Description]
- `[type]://domain/resource2` - [Description]

### Security
- [ ] Auth implemented
- [ ] Domain isolation verified
- [ ] Audit logging added

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Cursor integration verified
```

---

### Code Style Guidelines

**Follow existing patterns:**

```typescript
// ✅ Good - Follows Flow patterns
export async function getMyStats(domainId: string): Promise<MyStats> {
  try {
    // 1. Get users in domain
    const users = await getUsersInDomain(domainId);
    
    // 2. Query data
    const data = await queryData(users);
    
    // 3. Aggregate
    return aggregateStats(data);
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    throw new Error('Failed to get stats');
  }
}

// ❌ Bad - Not following conventions
function getStats(d) {
  const u = getUsers(d);
  return calc(u);
}
```

**TypeScript:**
- ✅ Explicit types for all parameters
- ✅ Return type annotations
- ✅ Interface for all data structures
- ✅ No `any` types

**Error Handling:**
- ✅ Try-catch for async operations
- ✅ Descriptive error messages
- ✅ Log errors with context
- ✅ Return meaningful errors to client

**Documentation:**
- ✅ JSDoc comments for public functions
- ✅ Inline comments for complex logic
- ✅ README for each module
- ✅ Examples in docs/

---

## 📖 Resources for Developers

### Internal Documentation
- `src/mcp/README.md` - MCP architecture
- `.cursor/rules/mcp.mdc` - MCP development rules
- `.cursor/rules/data.mdc` - Database schema
- `.cursor/rules/backend.mdc` - API patterns

### External Resources
- [MCP Specification](https://modelcontextprotocol.io/)
- [JSON-RPC 2.0 Spec](https://www.jsonrpc.org/specification)
- [Cursor MCP Docs](https://cursor.sh/docs/mcp)

### Community
- GitHub Issues: [Report bugs]
- GitHub Discussions: [Ask questions]
- Discord: [Coming soon]

---

## 🎓 Learning Path

**New to MCP?**
1. Read: MCP Specification basics
2. Review: `src/mcp/usage-stats.ts` (working example)
3. Test: `npm run test:mcp`
4. Experiment: Query in Cursor
5. Build: Your first integration

**Want to extend?**
1. Study: Existing resource types
2. Design: Your resource schema
3. Implement: Following patterns
4. Test: With curl and Cursor
5. Document: In docs/
6. Submit: Pull request

**Want to contribute?**
1. Fork: Repository
2. Branch: `feat/mcp-[feature]`
3. Code: Follow style guide
4. Test: Full coverage
5. Document: Complete guides
6. PR: With clear description

---

## 🎯 Developer Success Checklist

**For Integration Developers:**
- [ ] API key obtained
- [ ] Environment configured
- [ ] Client library created
- [ ] Test queries working
- [ ] Error handling implemented
- [ ] Production deployment planned

**For Platform Contributors:**
- [ ] Codebase understood
- [ ] Development environment setup
- [ ] Feature branch created
- [ ] Tests passing
- [ ] Documentation written
- [ ] PR submitted

**For Both:**
- [ ] Security best practices followed
- [ ] Performance optimized
- [ ] Error handling comprehensive
- [ ] Code review completed
- [ ] User feedback gathered

---

## 🚀 What You Can Build

### Ideas for Developers

**Analytics & Reporting:**
- Custom dashboards
- Scheduled reports
- Data exports
- Trend analysis
- Predictive analytics

**Automation:**
- Auto-scaling based on usage
- Cost optimization tools
- Health monitoring
- Alert systems
- Backup automation

**Integrations:**
- Slack/Teams bots
- Email notifications
- Data warehouse ETL
- BI tool connectors
- Custom APIs

**Tools:**
- CLI tools
- VS Code extensions
- Browser extensions
- Mobile apps
- Desktop apps

**AI Enhancements:**
- Custom Cursor commands
- Agent recommendations
- Query optimization
- Pattern detection
- Anomaly alerts

---

## 💡 Pro Tips

**1. Cache Aggressively**
```typescript
// MCP responses rarely change minute-to-minute
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedStats(domain: string) {
  const cacheKey = `summary:${domain}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await client.getUsageSummary();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

**2. Batch Requests**
```typescript
// Instead of 4 separate requests:
const [summary, agents, users, costs] = await Promise.all([
  client.getUsageSummary(),
  client.getAgentStats(),
  client.getUserStats(),
  client.getCostBreakdown(),
]);
```

**3. Handle Rate Limits**
```typescript
class RateLimitedClient extends FlowMCPClient {
  private queue: Promise<any> = Promise.resolve();
  private minInterval = 100; // ms between requests

  async request(method: string, params?: any) {
    this.queue = this.queue.then(async () => {
      const result = await super.request(method, params);
      await new Promise(resolve => setTimeout(resolve, this.minInterval));
      return result;
    });
    
    return this.queue;
  }
}
```

**4. Type Safety**
```typescript
// Define strict types for responses
type MCPResponse<T> = {
  jsonrpc: '2.0';
  result: T;
  id: number;
} | {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
  };
  id: number;
};

async function typedRequest<T>(
  method: string, 
  params?: any
): Promise<T> {
  const response: MCPResponse<T> = await makeRequest(method, params);
  
  if ('error' in response) {
    throw new Error(response.error.message);
  }
  
  return response.result;
}
```

---

## 🏆 Best Practices

### Performance
- ✅ Cache responses (5-min TTL)
- ✅ Batch concurrent requests
- ✅ Use compression (gzip)
- ✅ Paginate large results
- ✅ Index your queries

### Security
- ✅ Store API keys in env vars
- ✅ Rotate keys every 90 days
- ✅ Use HTTPS in production
- ✅ Validate all responses
- ✅ Handle 401/403 gracefully

### Reliability
- ✅ Retry with exponential backoff
- ✅ Circuit breaker pattern
- ✅ Graceful degradation
- ✅ Comprehensive error handling
- ✅ Health checks

### Developer Experience
- ✅ Type-safe client library
- ✅ Clear error messages
- ✅ Helpful documentation
- ✅ Working examples
- ✅ Active support

---

## 📞 Developer Support

**Questions?**
- GitHub Issues: Technical questions
- Email: alec@getaifactory.com
- Docs: This guide + MCP_SERVER_SETUP.md

**Contributing?**
- Read: CONTRIBUTING.md (coming soon)
- Follow: Code style guide above
- Test: Thoroughly before PR
- Document: All new features

**Feedback?**
- What's working well?
- What's confusing?
- What's missing?
- What should we build next?

---

## 🎉 Welcome to Flow MCP Development!

You now have everything you need to:
- ✅ Integrate Flow into your apps
- ✅ Build on top of Flow MCP
- ✅ Extend Flow's capabilities
- ✅ Contribute to the platform

**Start with:**
1. `MCP_CURSOR_QUICK_START.md` - Get connected
2. Test queries in Cursor
3. Build your first integration
4. Share what you've built!

**Happy coding!** 🚀

---

**Last Updated:** 2025-10-30  
**Version:** 1.0.0  
**Target Audience:** Developers  
**Difficulty:** Intermediate to Advanced






