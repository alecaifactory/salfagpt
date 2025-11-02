# Flow CLI Developer Ecosystem

**Version**: 1.0.0  
**Date**: 2025-10-30  
**Status**: ✅ Active Development

---

## 🎯 Vision

Build a comprehensive **developer ecosystem** around Flow AI Platform that enables:

1. **Developers** to integrate Flow into their tools and workflows
2. **Admins** to automate platform operations
3. **Partners** to build extensions and integrations
4. **Community** to contribute and extend capabilities

**Core Principle**: Make Flow **API-first** and **developer-friendly** from day one.

---

## 👥 Developer User Personas

### 1. **Integration Developer**

**Profile:**
- Builds internal dashboards
- Integrates Flow stats into company tools
- Needs read-only API access
- Values: Speed, reliability, clear docs

**Use Cases:**
```bash
# Daily cost monitoring dashboard
const stats = await getFlowStats('@company.com', { days: 1 });
dashboard.update({ cost: stats.totalCost });

# Slack bot for usage reports
/flow-stats @salfacorp.com weekly
```

**Needs:**
- ✅ Read-only API access (v0.1.0)
- 🔜 Webhook notifications (v0.2.0)
- 🔜 Streaming data export (v0.3.0)

---

### 2. **Automation Engineer**

**Profile:**
- Builds CI/CD pipelines
- Automates agent deployment
- Needs write API access
- Values: Reliability, idempotency, error handling

**Use Cases:**
```bash
# Deploy agent from CI/CD
flow agents deploy ./config/customer-service-agent.yaml

# Bulk upload context
flow context upload ./docs/**/*.pdf --agent customer-service

# Run evaluations in pipeline
flow evaluate agent-id --test-suite regression.json
```

**Needs:**
- ✅ Authentication (v0.1.0)
- 🔜 Agent management commands (v0.2.0)
- 🔜 Context upload commands (v0.2.0)
- 🔜 Evaluation commands (v0.3.0)

---

### 3. **Platform Extender**

**Profile:**
- Builds plugins/extensions for Flow
- Creates custom processors
- Needs SDK access
- Values: Extensibility, documentation, examples

**Use Cases:**
```typescript
// Custom context processor
import { FlowSDK } from '@flow-ai/sdk';

const flow = new FlowSDK({ apiKey: process.env.FLOW_API_KEY });

// Upload with custom processor
await flow.context.upload({
  file: 'data.xml',
  processor: customXMLProcessor,
  agentId: 'agent-123'
});
```

**Needs:**
- 🔜 JavaScript/TypeScript SDK (v0.3.0)
- 🔜 Plugin system (v0.4.0)
- 🔜 Custom processor API (v0.4.0)

---

### 4. **Data Scientist**

**Profile:**
- Analyzes conversation data
- Trains custom models
- Needs bulk data export
- Values: Data quality, format flexibility, performance

**Use Cases:**
```bash
# Export conversations for analysis
flow export conversations --format jsonl --filter 'model=pro' > data.jsonl

# Download embeddings for custom RAG
flow export embeddings --agent customer-service > embeddings.npy

# Bulk evaluation results
flow export evaluations --date-range '2025-10' > evals.csv
```

**Needs:**
- 🔜 Bulk export commands (v0.3.0)
- 🔜 Data pipeline integration (v0.4.0)
- 🔜 Custom evaluation frameworks (v0.4.0)

---

## 📚 Package Ecosystem Roadmap

### v0.1.0 - Foundation (✅ Current)

**Package**: `@flow-ai/cli`

**Features:**
- ✅ API key authentication
- ✅ Read-only usage statistics
- ✅ Beautiful terminal output
- ✅ JSON export format

**Commands:**
```bash
flow login <api-key>
flow logout
flow status
flow usage-stats <domain> [--days N] [--format json]
flow config
```

**Permissions:**
- ✅ `canReadUsageStats`: View domain analytics

**Target Users**: Domain admins, integration developers

---

### v0.2.0 - Agent & Context Read (Planned)

**Package**: `@flow-ai/cli` (updated)

**New Features:**
- 🔜 List agents for domain
- 🔜 View agent configuration
- 🔜 List context sources
- 🔜 View context metadata
- 🔜 Search conversations

**New Commands:**
```bash
flow agents list [--domain @domain.com]
flow agents show <agent-id>
flow agents config <agent-id>
flow context list [--agent <agent-id>]
flow context show <context-id>
flow conversations search <query>
```

**New Permissions:**
- 🔜 `canReadAgents`: View agent data
- 🔜 `canReadContext`: View context data
- 🔜 `canSearchConversations`: Search capability

**Target Users**: All developer personas

---

### v0.3.0 - Write Operations (Planned)

**Package**: `@flow-ai/cli` (updated)

**New Features:**
- 🔜 Create/update agents
- 🔜 Upload context sources
- 🔜 Run evaluations
- 🔜 Bulk operations

**New Commands:**
```bash
flow agents create <name> --model flash --config config.yaml
flow agents update <agent-id> --system-prompt "New prompt..."
flow context upload <file> --agent <agent-id>
flow context bulk-upload <folder> --agent <agent-id>
flow evaluate <agent-id> --test-suite tests.json
```

**New Permissions:**
- 🔜 `canManageAgents`: Create/update/delete agents
- 🔜 `canManageContext`: Upload/delete context
- 🔜 `canRunEvaluations`: Execute evaluations

**Target Users**: Automation engineers, platform extenders

---

### v0.4.0 - SDK & Plugins (Planned)

**New Package**: `@flow-ai/sdk`

**Purpose**: JavaScript/TypeScript SDK for programmatic access

**Features:**
- 🔜 Object-oriented API
- 🔜 Promise-based async
- 🔜 TypeScript types
- 🔜 Streaming support
- 🔜 Webhook listeners
- 🔜 Plugin system

**Example Usage:**
```typescript
import { FlowSDK } from '@flow-ai/sdk';

const flow = new FlowSDK({
  apiKey: process.env.FLOW_API_KEY,
  domain: '@mycompany.com'
});

// Get stats
const stats = await flow.analytics.getUsageStats({ days: 30 });

// Create agent
const agent = await flow.agents.create({
  name: 'Customer Service Bot',
  model: 'gemini-2.5-flash',
  systemPrompt: 'You are a helpful assistant...'
});

// Upload context
await flow.context.upload({
  file: './kb/policies.pdf',
  agentId: agent.id,
  processor: 'pdf-extractor'
});

// Listen to events
flow.on('message:created', (message) => {
  console.log('New message:', message);
});
```

**Target Users**: All developer personas

---

### v0.5.0 - Advanced Developer Tools (Planned)

**New Packages:**
- 🔜 `@flow-ai/webpack-plugin` - Webpack integration
- 🔜 `@flow-ai/vite-plugin` - Vite integration
- 🔜 `@flow-ai/react` - React components
- 🔜 `@flow-ai/vue` - Vue components

**Features:**
- 🔜 Dev server integration
- 🔜 Hot reload for agent configs
- 🔜 UI component library
- 🔜 Mock/test utilities

**Target Users**: Frontend developers, full-stack developers

---

## 🏗️ Architecture Principles

### 1. **Layered Packages**

```
@flow-ai/cli          # Command-line interface
    ↓ uses
@flow-ai/sdk          # JavaScript/TypeScript SDK
    ↓ uses
@flow-ai/core         # Core utilities, types, auth
    ↓ connects to
Flow Platform API     # REST API endpoints
```

**Benefits:**
- Clear separation of concerns
- Reusable components
- Easy testing
- Independent versioning

---

### 2. **API-First Design**

**Principle**: Every CLI command maps to an API endpoint.

```
CLI Command:       flow usage-stats @domain.com
    ↓
API Call:          GET /api/cli/usage-stats?domain=@domain.com
    ↓
SDK Method:        flow.analytics.getUsageStats({ domain: '@domain.com' })
```

**Benefits:**
- CLI and SDK share same API
- Easy to add new clients (mobile, web, etc.)
- Consistent behavior across tools
- API can be used directly if needed

---

### 3. **Developer Experience First**

**Principles:**
- Beautiful output (not just functional)
- Clear error messages (with recovery steps)
- One-time setup (credentials cached)
- Fast feedback (< 3 seconds)
- Examples everywhere (docs, --help, errors)

**Example Error Message:**
```
❌ Authentication failed: API key expired

Your API key expired on 2025-10-28.

To fix this:
1. Contact your SuperAdmin for a new key
2. Run: flow login <new-api-key>

Need help? Email: hello@getaifactory.com
```

---

### 4. **Security by Default**

**Principles:**
- No plaintext secrets ever
- Domain isolation enforced
- Permissions checked on every request
- Audit trail for all operations
- Secure defaults (expiration, read-only)

**Example:**
```typescript
// API key automatically hashed
const apiKey = generateAPIKey();        // Plaintext
const hashed = hashAPIKey(apiKey);      // SHA-256
store({ key: hashed });                 // Only hash stored

// Domain access enforced
if (auth.domain !== requestedDomain) {
  return 403; // Forbidden
}
```

---

### 5. **Versioned & Extensible**

**Principles:**
- Semver versioning (0.1.0, 0.2.0, etc.)
- Backward compatibility always
- Feature flags for new features
- Clear deprecation paths

**Example:**
```typescript
// v0.1.0
permissions: {
  canReadUsageStats: true
}

// v0.2.0 (backward compatible)
permissions: {
  canReadUsageStats: true,      // Existing
  canReadAgents: false,           // New
  canReadContext: false           // New
}
```

---

## 📖 Developer Documentation Strategy

### Tiered Documentation

**Tier 1: Quick Start** (5 minutes)
- Installation
- Authentication
- First command
- Expected output

**Tier 2: User Guide** (30 minutes)
- All commands explained
- Common use cases
- Best practices
- Troubleshooting

**Tier 3: Developer Guide** (2 hours)
- Architecture overview
- API reference
- SDK documentation
- Extension guide

**Tier 4: Deep Dive** (4+ hours)
- System internals
- Security model
- Performance optimization
- Contributing guide

---

### Documentation Types

**For Users (Admins):**
- ✅ `CLI_QUICK_START.md` - 5-minute setup
- ✅ `README.md` - Complete user guide
- ✅ `TESTING_GUIDE.md` - How to test

**For Developers:**
- ✅ `CLI_API_KEY_SYSTEM.md` - System architecture
- ✅ `CLI_VISUAL_GUIDE.md` - Visual diagrams
- 🔜 `SDK_GUIDE.md` - SDK documentation
- 🔜 `EXTENSION_GUIDE.md` - Building plugins

**For Contributors:**
- 🔜 `CONTRIBUTING.md` - How to contribute
- 🔜 `ARCHITECTURE.md` - Technical deep dive
- 🔜 `SECURITY.md` - Security model

---

## 🔌 Integration Patterns

### Pattern 1: Dashboard Integration

**Use Case**: Display Flow stats in company dashboard

```typescript
// dashboard-backend/routes/flow-stats.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getFlowStats(req, res) {
  try {
    const { domain, days } = req.query;
    
    // Execute Flow CLI
    const { stdout } = await execAsync(
      `flow usage-stats ${domain} --days ${days} --format json`,
      {
        env: {
          ...process.env,
          // No need to pass API key - reads from ~/.flow-cli/config.json
        }
      }
    );
    
    const stats = JSON.parse(stdout);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Use in React dashboard
useEffect(() => {
  fetch('/api/flow-stats?domain=@company.com&days=30')
    .then(r => r.json())
    .then(stats => setDashboardData(stats));
}, []);
```

---

### Pattern 2: Automated Reporting

**Use Case**: Daily usage reports via email

```bash
#!/bin/bash
# daily-report.sh

# Get yesterday's stats
STATS=$(flow usage-stats @company.com --days 1 --format json)

# Extract key metrics
COST=$(echo $STATS | jq -r '.totalCost')
MESSAGES=$(echo $STATS | jq -r '.totalMessages')
USERS=$(echo $STATS | jq -r '.activeUsers')

# Create email
cat > report.html << EOF
<h1>Daily Flow Usage Report</h1>
<p><strong>Date:</strong> $(date +%Y-%m-%d)</p>
<p><strong>Active Users:</strong> $USERS</p>
<p><strong>Messages Sent:</strong> $MESSAGES</p>
<p><strong>Total Cost:</strong> \$$COST</p>
<p>Full report: <a href="https://flow.company.com/analytics">View Analytics</a></p>
EOF

# Send email (using sendgrid, etc.)
sendmail admin@company.com < report.html
```

**Schedule with cron:**
```bash
# Run daily at 8 AM
0 8 * * * /path/to/daily-report.sh
```

---

### Pattern 3: Cost Monitoring & Alerts

**Use Case**: Alert when daily cost exceeds threshold

```javascript
// cost-monitor.js
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function checkDailyCost() {
  // Get today's stats
  const { stdout } = await execAsync(
    'flow usage-stats @company.com --days 1 --format json'
  );
  
  const stats = JSON.parse(stdout);
  const dailyCost = stats.totalCost;
  const threshold = 10.00; // $10/day
  
  if (dailyCost > threshold) {
    // Send alert
    await sendAlert({
      title: '⚠️ Daily Cost Alert',
      message: `Flow usage cost exceeded $${threshold}`,
      details: {
        cost: `$${dailyCost}`,
        messages: stats.totalMessages,
        activeUsers: stats.activeUsers
      },
      severity: 'warning'
    });
  }
}

// Run every hour
setInterval(checkDailyCost, 60 * 60 * 1000);
```

---

### Pattern 4: Analytics Aggregation

**Use Case**: Multi-domain analytics for holding companies

```typescript
// multi-domain-analytics.ts
import { FlowSDK } from '@flow-ai/sdk'; // Future v0.4.0

const flow = new FlowSDK({ apiKey: process.env.FLOW_API_KEY });

async function getConsolidatedStats() {
  const domains = ['@subsidiary-a.com', '@subsidiary-b.com', '@subsidiary-c.com'];
  
  const results = await Promise.all(
    domains.map(domain => 
      flow.analytics.getUsageStats({ domain, days: 30 })
    )
  );
  
  // Aggregate across domains
  const consolidated = {
    totalCost: results.reduce((sum, r) => sum + r.totalCost, 0),
    totalMessages: results.reduce((sum, r) => sum + r.totalMessages, 0),
    totalUsers: results.reduce((sum, r) => sum + r.totalUsers, 0),
    breakdown: results.map((stats, i) => ({
      domain: domains[i],
      cost: stats.totalCost,
      messages: stats.totalMessages
    }))
  };
  
  return consolidated;
}
```

---

## 🎨 Developer Experience (DX) Principles

### 1. **Zero Config for Simple Use**

```bash
# Works immediately with reasonable defaults
npx @flow-ai/cli usage-stats @domain.com

# No config file needed for one-off use
```

---

### 2. **Progressive Disclosure**

```bash
# Basic usage (simple)
flow usage-stats @domain.com

# With options (intermediate)
flow usage-stats @domain.com --days 30 --format json

# With config file (advanced)
flow usage-stats @domain.com --config custom-config.yaml
```

---

### 3. **Helpful Errors**

```bash
# ❌ Bad error message
Error: ECONNREFUSED

# ✅ Good error message
❌ Cannot connect to Flow API

Possible causes:
1. API endpoint is incorrect
2. Platform is not running
3. Network firewall blocking requests

To fix:
1. Check endpoint: flow config
2. Update if needed: flow login <key> --endpoint <url>
3. Test connection: curl <endpoint>/api/cli/auth/verify

Need help? https://docs.flow.ai/troubleshooting
```

---

### 4. **Fast Feedback**

```bash
# Show progress for slow operations
⏳ Fetching usage stats for @salfacorp.com (last 30 days)...
✅ Retrieved 2,450 messages from 340 conversations

# Stream large results
Exporting conversations... (1/100)
Exporting conversations... (50/100)
Exporting conversations... (100/100)
✅ Export complete: conversations.jsonl
```

---

### 5. **Examples Everywhere**

**In --help:**
```bash
$ flow usage-stats --help

Usage: flow usage-stats <domain> [options]

View domain usage statistics

Arguments:
  domain          Domain to query (e.g., @mydomain.com)

Options:
  -d, --days <n>  Number of days (default: 7)
  -f, --format    Output format: table|json (default: table)
  -h, --help      Display help

Examples:
  $ flow usage-stats @salfacorp.com
  $ flow usage-stats @salfacorp.com --days 30
  $ flow usage-stats @salfacorp.com --format json > stats.json
```

---

## 🔧 Technical Standards

### Package Structure

```
@flow-ai/<package-name>/
├── package.json           # NPM config
├── tsconfig.json          # TypeScript config
├── .npmignore             # Exclude from npm
├── .gitignore             # Exclude from git
├── LICENSE                # MIT license
├── README.md              # User documentation
├── CHANGELOG.md           # Version history
├── src/
│   ├── index.ts           # Main entry point
│   ├── types.ts           # TypeScript definitions
│   ├── config.ts          # Configuration
│   └── ...                # Feature modules
├── dist/                  # Compiled JavaScript
└── docs/                  # Additional documentation
```

---

### TypeScript Configuration

**Target**: ES2022 (modern, wide support)  
**Module**: ESNext (pure ESM)  
**Strict**: true (no implicit any, null checks)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

---

### Dependencies Policy

**Production Dependencies:**
- ✅ Must be stable (not alpha/beta)
- ✅ Must be well-maintained (updated < 1 year ago)
- ✅ Must have TypeScript types
- ✅ Must be tree-shakeable (ESM)
- ✅ Minimize bundle size

**Current Dependencies:**
```json
{
  "@google-cloud/firestore": "^7.10.0",  // Platform SDK
  "commander": "^12.0.0",                // CLI framework
  "chalk": "^5.3.0",                     // Terminal colors
  "ora": "^8.0.1",                       // Spinners
  "table": "^6.8.2"                      // Tables
}
```

**Bundle Size**: < 500 KB (uncompressed)

---

### Error Handling Standard

```typescript
// ✅ Always handle errors with context
try {
  const result = await operation();
} catch (error) {
  // 1. Log for debugging
  console.error('Operation failed:', error);
  
  // 2. User-friendly message
  console.log(chalk.red('❌ Failed to complete operation'));
  
  // 3. Explain what went wrong
  console.log(chalk.dim('\nError:', error.message));
  
  // 4. Provide recovery steps
  console.log(chalk.dim('\nTo fix:'));
  console.log(chalk.dim('1. Check your internet connection'));
  console.log(chalk.dim('2. Verify API key is valid: flow status'));
  console.log(chalk.dim('3. Try again or contact support'));
  
  // 5. Exit with appropriate code
  process.exit(1);
}
```

---

### Testing Strategy

**Unit Tests:**
```typescript
// config.test.ts
import { readConfig, writeConfig } from './config';

describe('Config Management', () => {
  it('should create config with defaults', () => {
    const config = readConfig();
    expect(config.apiEndpoint).toBe('http://localhost:3000');
  });
  
  it('should save and retrieve API key', () => {
    writeConfig({ apiKey: 'test-key' });
    const config = readConfig();
    expect(config.apiKey).toBe('test-key');
  });
});
```

**Integration Tests:**
```typescript
// api-client.test.ts
import { FlowAPIClient } from './api-client';

describe('API Client', () => {
  it('should authenticate with valid key', async () => {
    const client = new FlowAPIClient();
    const result = await client.testConnection();
    expect(result.success).toBe(true);
  });
});
```

**E2E Tests:**
```bash
#!/bin/bash
# e2e-test.sh

# Start platform
npm run dev &
sleep 5

# Create API key
KEY=$(create-test-key.sh)

# Test CLI
flow login $KEY --endpoint http://localhost:3000
flow usage-stats @test.com

# Cleanup
flow logout
kill %1
```

---

## 📊 Analytics & Monitoring

### Package Analytics

**Track (via npm):**
- Downloads per day/week/month
- Version distribution
- Geo distribution
- Install vs npx usage

**Track (via platform):**
- API requests per command
- Average response times
- Error rates by command
- Most used features

---

### Developer Feedback Loop

**Metrics:**
1. **Adoption**: Unique CLI users per week
2. **Engagement**: Commands run per user per day
3. **Satisfaction**: GitHub stars, npm reviews
4. **Issues**: Bug reports, feature requests

**Process:**
```
Developer uses CLI
    ↓
Encounters issue/idea
    ↓
Opens GitHub issue
    ↓
Team triages (label: bug/feature/question)
    ↓
Prioritize based on:
  - Number of +1s
  - User impact
  - Implementation effort
    ↓
Fix in next minor version
    ↓
Notify user when released
```

---

## 🚀 Distribution Strategy

### npm Registry (Primary)

```bash
# Official package
npm install -g @flow-ai/cli

# Specific version
npm install -g @flow-ai/cli@0.2.0

# Latest (auto-update)
npm install -g @flow-ai/cli@latest
```

---

### npx (Zero Install)

```bash
# One-off usage (no install)
npx @flow-ai/cli usage-stats @domain.com

# Always latest version
npx @flow-ai/cli@latest usage-stats @domain.com
```

---

### Docker Image (Future)

```bash
# Run in container
docker run flow-ai/cli:latest usage-stats @domain.com
```

---

### GitHub Releases (For Custom Builds)

```bash
# Download binary
curl -L https://github.com/flow-ai/cli/releases/download/v0.1.0/flow-cli-macos -o flow
chmod +x flow
./flow --version
```

---

## 🎓 Best Practices for Developers

### 1. **Use Environment Variables**

```bash
# .env file
FLOW_API_KEY=<REDACTED_API_KEY>...
FLOW_API_ENDPOINT=https://flow.company.com

# In scripts
flow usage-stats @domain.com  # Reads from config
```

---

### 2. **Cache API Responses**

```typescript
// Don't call API on every request
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getStats(domain) {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const stats = await flow.analytics.getUsageStats({ domain });
  cache.set(domain, { data: stats, timestamp: Date.now() });
  return stats;
}
```

---

### 3. **Handle Rate Limits**

```typescript
// Implement retry with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Rate limited
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const stats = await withRetry(() => 
  flow.analytics.getUsageStats({ domain: '@company.com' })
);
```

---

### 4. **Validate Input**

```typescript
// Always validate user input
function validateDomain(domain: string): string {
  if (!domain) {
    throw new Error('Domain is required');
  }
  
  // Ensure @ prefix
  const normalized = domain.startsWith('@') ? domain : `@${domain}`;
  
  // Validate format
  if (!/^@[a-z0-9-]+\.[a-z]{2,}$/i.test(normalized)) {
    throw new Error(`Invalid domain format: ${domain}`);
  }
  
  return normalized;
}
```

---

### 5. **Log Appropriately**

```typescript
// Development: Verbose logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 API Request:', {
    endpoint: url,
    method: 'GET',
    timestamp: new Date().toISOString()
  });
}

// Production: Error logging only
if (error) {
  console.error('❌ API Error:', {
    message: error.message,
    endpoint: url,
    statusCode: error.status
  });
}
```

---

## 🔐 Security Guidelines for Developers

### 1. **Never Hardcode API Keys**

```typescript
// ❌ BAD
const API_KEY = '<REDACTED_API_KEY>...';

// ✅ GOOD
const API_KEY = process.env.FLOW_API_KEY;
if (!API_KEY) {
  throw new Error('FLOW_API_KEY environment variable required');
}
```

---

### 2. **Rotate Keys Regularly**

```bash
# Every 90 days (automated reminder)
# 1. Create new key in platform
# 2. Update environment variable
# 3. Test with new key
# 4. Revoke old key
# 5. Update documentation
```

---

### 3. **Scope Keys Appropriately**

```
Development:    Limited permissions, short expiration (7 days)
Staging:        Read-only, medium expiration (30 days)
Production:     Necessary permissions only, 90-day expiration
CI/CD:          Service-specific, rotated automatically
```

---

### 4. **Monitor Usage**

```typescript
// Track your API usage
async function logAPIUsage() {
  const usage = await flow.apiKeys.getUsage();
  
  console.log('API Usage:', {
    requests: usage.requestCount,
    lastUsed: usage.lastUsedAt,
    remaining: usage.rateLimitRemaining
  });
}

// Alert on anomalies
if (usage.requestCount > expectedRange) {
  sendAlert('Unusual API activity detected');
}
```

---

### 5. **Handle Errors Gracefully**

```typescript
// Don't crash on API errors
try {
  const stats = await flow.analytics.getUsageStats({ domain });
  return stats;
} catch (error) {
  if (error.status === 401) {
    console.error('API key expired. Please login again.');
    return null;
  } else if (error.status === 403) {
    console.error('Insufficient permissions.');
    return null;
  } else {
    console.error('API error:', error.message);
    return getCachedStats(domain); // Fallback to cache
  }
}
```

---

## 📚 Documentation Examples

### Example 1: Integration Tutorial

```markdown
# Integrating Flow Stats into Your Dashboard

## Step 1: Install CLI
\`\`\`bash
npm install -g @flow-ai/cli
\`\`\`

## Step 2: Authenticate
\`\`\`bash
flow login <your-api-key>
\`\`\`

## Step 3: Fetch Stats
\`\`\`typescript
import { exec } from 'child_process';

async function getFlowStats() {
  return new Promise((resolve, reject) => {
    exec('flow usage-stats @domain.com --format json', (err, stdout) => {
      if (err) reject(err);
      else resolve(JSON.parse(stdout));
    });
  });
}
\`\`\`

## Step 4: Display in UI
\`\`\`typescript
const stats = await getFlowStats();
dashboard.render({
  users: stats.activeUsers,
  cost: stats.totalCost,
  messages: stats.totalMessages
});
\`\`\`
```

---

### Example 2: CI/CD Integration

```markdown
# Using Flow CLI in CI/CD

## GitHub Actions

\`\`\`yaml
name: Deploy Agent

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flow CLI
        run: npm install -g @flow-ai/cli
      
      - name: Authenticate
        run: flow login ${{ secrets.FLOW_API_KEY }}
      
      - name: Deploy Agent
        run: flow agents deploy ./config/agent.yaml
      
      - name: Run Tests
        run: flow evaluate agent-id --suite regression.json
\`\`\`
```

---

### Example 3: Monitoring Dashboard

```markdown
# Building a Flow Monitoring Dashboard

## Tech Stack
- Backend: Node.js + Express
- Frontend: React + Chart.js
- Refresh: Every 5 minutes

## Backend API
\`\`\`typescript
app.get('/api/flow-stats', async (req, res) => {
  const stats = await getFlowStats('@company.com');
  res.json(stats);
});
\`\`\`

## Frontend Component
\`\`\`typescript
function FlowDashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('/api/flow-stats')
      .then(r => r.json())
      .then(setStats);
  }, []);
  
  return (
    <div>
      <h1>Flow Usage Dashboard</h1>
      <MetricCard title="Active Users" value={stats?.activeUsers} />
      <MetricCard title="Total Cost" value={`$${stats?.totalCost}`} />
      <Chart data={stats?.modelUsage} />
    </div>
  );
}
\`\`\`
```

---

## 🌟 Community & Ecosystem

### Open Source Contributions

**Accepting contributions for:**
- 🔜 New commands
- 🔜 Output formats (CSV, XML, etc.)
- 🔜 Integrations (Slack, Discord, etc.)
- 🔜 Plugins and extensions

**Contribution Process:**
1. Open GitHub issue (discuss first)
2. Fork repository
3. Create feature branch
4. Implement + tests + docs
5. Open pull request
6. Code review
7. Merge + release

---

### Plugin System (Future)

**Vision**: Developers can extend CLI with custom commands

```typescript
// flow-plugin-slack/index.ts
export default {
  name: 'slack',
  commands: [
    {
      name: 'notify',
      description: 'Send stats to Slack',
      action: async (domain) => {
        const stats = await flow.analytics.getUsageStats({ domain });
        await sendToSlack(stats);
      }
    }
  ]
};

// Usage after installing plugin
flow slack notify @company.com
```

---

## 📖 Developer Resources

### Documentation Sites

**For End Users:**
- 🔜 https://docs.flow.ai/cli - CLI documentation
- 🔜 https://docs.flow.ai/sdk - SDK documentation

**For Developers:**
- 🔜 https://developers.flow.ai - Developer portal
- 🔜 https://github.com/flow-ai/cli - GitHub repository

**For API:**
- 🔜 https://api.flow.ai/reference - API reference
- 🔜 https://api.flow.ai/playground - Interactive API explorer

---

### Support Channels

**Community:**
- 🔜 Discord server for developers
- 🔜 GitHub Discussions for Q&A
- 🔜 Stack Overflow tag: [flow-ai]

**Direct Support:**
- Email: developers@flow.ai
- Issues: GitHub issues
- Urgent: Slack channel (for partners)

---

## 🎯 Success Metrics

### Developer Adoption

**Week 1:**
- Downloads: 10+
- Unique users: 3+
- GitHub stars: 5+

**Month 1:**
- Downloads: 100+
- Unique users: 20+
- GitHub stars: 25+
- First integration built

**Quarter 1:**
- Downloads: 1,000+
- Unique users: 100+
- GitHub stars: 100+
- 5+ integrations in production

---

### Developer Satisfaction

**Metrics:**
- npm package rating: 4.5+ / 5
- GitHub issues response time: < 24 hours
- Documentation clarity: 90%+ find answers
- NPS score: 50+ (promoters - detractors)

---

## 🔮 Long-Term Vision

### Year 1: Foundation

**Goals:**
- ✅ v0.1.0: Read-only CLI (Done!)
- 🔜 v0.2.0: Agent & context read
- 🔜 v0.3.0: Write operations
- 🔜 v0.4.0: JavaScript/TypeScript SDK

**Outcome**: Developers can integrate Flow into their tools

---

### Year 2: Ecosystem

**Goals:**
- 🔜 Plugin system
- 🔜 Community contributions
- 🔜 Framework integrations (React, Vue, etc.)
- 🔜 Developer marketplace

**Outcome**: Thriving ecosystem of extensions

---

### Year 3: Platform

**Goals:**
- 🔜 Flow as infrastructure (API-first)
- 🔜 White-label solutions
- 🔜 Enterprise developer program
- 🔜 Certification program

**Outcome**: Flow powers third-party products

---

## ✅ Current Status (v0.1.0)

**Package**: ✅ Built and tested  
**Documentation**: ✅ Comprehensive  
**Security**: ✅ Enterprise-grade  
**DX**: ✅ Beautiful and simple  

**Ready for**:
1. User testing (30 seconds)
2. Deployment (5 minutes)
3. npm publish (10 minutes)
4. Developer adoption!

---

## 🎉 Bottom Line

**We've built the foundation** for a world-class developer ecosystem:

- ✅ **Secure**: Industry-standard practices
- ✅ **Simple**: One command to get value
- ✅ **Extensible**: Clear path to add features
- ✅ **Professional**: Production-ready quality

**This is just the beginning!** The architecture supports:
- SDKs for any language
- Plugins and extensions
- Community contributions
- Partner integrations

**Developers will love it!** 🚀

---

**Next**: User says "looks good" → We deploy → Developers get access! 🎉




