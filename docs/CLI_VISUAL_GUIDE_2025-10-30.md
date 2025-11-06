# 🎨 Flow CLI Visual Guide

**Version**: 0.1.0  
**Date**: 2025-10-30

---

## 🏗️ System Architecture (ASCII)

```
┌──────────────────────────────────────────────────────────────────────┐
│                      FLOW CLI ECOSYSTEM                               │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│   SuperAdmin (Web UI)   │  alec@getaifactory.com
│                         │
│  🔐 API Key Management  │
│  ├─ Create Keys         │───┐
│  ├─ Revoke Keys         │   │
│  ├─ View Usage          │   │
│  └─ Set Expiration      │   │
└─────────────────────────┘   │
                              │
                              │ Creates API Key
                              ▼
                    ┌─────────────────────┐
                    │   Firestore         │
                    │   api_keys          │
                    │                     │
                    │  { key: HASH,       │
                    │    assignedTo: ..., │
                    │    domain: ...,     │
                    │    permissions: {   │
                    │      canReadUsage   │
                    │    }}               │
                    └─────────────────────┘
                              │
                              │ API Key sent to admin (one-time)
                              ▼
┌─────────────────────────────────────┐
│   Domain Admin (CLI)                │  admin@salfacorp.com
│                                     │
│  📦 npm install -g @flow-ai/cli    │
│                                     │
│  🔐 flow login <REDACTED_API_KEY>REDACTED   │───┐
│     └─ Saves to ~/.flow-cli/       │   │
│                                     │   │
│  📊 flow usage-stats @salfacorp.com│◄──┤
│     ├─ X-API-Key: <REDACTED_API_KEY>REDACTED      │   │
│     ├─ GET /api/cli/usage-stats    │   │
│     └─ Returns domain statistics   │   │
│                                     │   │
│  📁 flow usage-stats --format json │   │
│     └─ Export for dashboards       │   │
└─────────────────────────────────────┘   │
                                          │
                                          │ Authenticated Request
                                          ▼
                              ┌─────────────────────┐
                              │  Flow Platform API  │
                              │                     │
                              │  1. Hash API key    │
                              │  2. Query Firestore │
                              │  3. Verify active   │
                              │  4. Check expired   │
                              │  5. Verify domain   │
                              │  6. Query stats     │
                              │  7. Return data     │
                              └─────────────────────┘
```

---

## 🔑 API Key Lifecycle

```
┌─────────────┐
│  CREATION   │  SuperAdmin creates key
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Generate:   <REDACTED_API_KEY>REDACTED   │  32 bytes, base64url
│  Hash:       9f86d081884c7d659a2f...   │  SHA-256
│  Store:      Only hash in Firestore     │
│  Display:    One time to SuperAdmin     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │  Admin uses key daily
└──────┬──────┘
       │
       │  Every request:
       │  ├─ Updates lastUsedAt
       │  ├─ Increments requestCount
       │  └─ Logs to audit trail
       │
       ├─ Check expiration: expiresAt > now
       └─ Check status: isActive == true
       │
       ▼
┌─────────────┐
│  EXPIRY or  │  90 days later OR SuperAdmin revokes
│  REVOCATION │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   INACTIVE  │  Key no longer works
└──────┬──────┘
       │
       │  Requests return:
       │  └─ 401 Unauthorized
       │     "API key expired" or "Invalid API key"
       │
       ▼
┌─────────────┐
│   ARCHIVED  │  Kept for audit history
└─────────────┘
```

---

## 📱 SuperAdmin UI Flow

### Step 1: Navigate to API Keys

```
┌──────────────────────────────────────────────────────┐
│  SuperAdmin Dashboard                             [≡]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  Tabs: [Dashboard] [Users] [API Keys] [Settings]    │
│                             ^^^^^^^^                 │
│                            Click here                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Step 2: View Existing Keys

```
┌──────────────────────────────────────────────────────────────────┐
│  🔑 API Key Management                     [+ Create API Key]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Name         │ Assigned To      │ Domain    │ Status    │  │
│  ├──────────────┼──────────────────┼───────────┼───────────┤  │
│  │ Prod CLI     │ admin@salfa.com  │ @salfa.com│ 🟢 Active │  │
│  │ Dev CLI      │ dev@salfa.com    │ @salfa.com│ 🟢 Active │  │
│  │ Old Key      │ old@salfa.com    │ @salfa.com│ 🔴 Revoked│  │
│  └──────────────┴──────────────────┴───────────┴───────────┘  │
│                                                                  │
│  Key Preview     │ Expires      │ Usage  │ Last Used │ Actions│
│  ────────────────┼──────────────┼────────┼───────────┼────────│
│  ••••o5p6        │ 2026-01-28   │ 145    │ 5 min ago │ 🗑️     │
│  ••••x9z2        │ Never        │ 23     │ 2 days ago│ 🗑️     │
│  ••••a1b2        │ Expired      │ 567    │ 30d ago   │ -      │
│                                                                  │
│  ℹ️ API keys are hashed before storage. Full key shown once.   │
│     Recommended: Set expiration (90 days) for security.         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Step 3: Create New Key

```
┌─────────────────────────────────────────────┐
│  Create New API Key                      [X]│
├─────────────────────────────────────────────┤
│                                             │
│  Key Name: *                                │
│  ┌─────────────────────────────────────┐   │
│  │ Production CLI Key                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Assigned To (Admin Email): *               │
│  ┌─────────────────────────────────────┐   │
│  │ admin@salfacorp.com                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Domain: *                                  │
│  ┌─────────────────────────────────────┐   │
│  │ @salfacorp.com                      │   │
│  └─────────────────────────────────────┘   │
│  This key will only access this domain     │
│                                             │
│  Expires In (Days):                         │
│  ┌─────────────────────────────────────┐   │
│  │ 90                                  │   │
│  └─────────────────────────────────────┘   │
│  Leave empty for no expiration              │
│  (not recommended)                          │
│                                             │
│  Description:                               │
│  ┌─────────────────────────────────────┐   │
│  │ CLI access for production monitoring│   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│              [Cancel]  [Create API Key]    │
└─────────────────────────────────────────────┘
```

---

### Step 4: Key Created - One Time Display

```
┌──────────────────────────────────────────────────────┐
│  ✅ API Key Created!                              [X]│
├──────────────────────────────────────────────────────┤
│                                                      │
│  ⚠️  SAVE THIS KEY SECURELY!                        │
│  ╔══════════════════════════════════════════════╗  │
│  ║  This is the ONLY time you'll see the        ║  │
│  ║  full API key. Store it in a password        ║  │
│  ║  manager or secure location.                 ║  │
│  ╚══════════════════════════════════════════════╝  │
│                                                      │
│  API Key for: Production CLI Key                    │
│  ┌────────────────────────────────────────────┐    │
│  │ <REDACTED_API_KEY>REDACTED │ 📋 │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Quick Start:                                       │
│  ┌────────────────────────────────────────────┐    │
│  │ flow login <REDACTED_API_KEY>REDACTED   │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Or with npx (no install):                          │
│  ┌────────────────────────────────────────────┐    │
│  │ npx @flow-ai/cli login <REDACTED_API_KEY>REDACTED    │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Details:                                           │
│  • Assigned to: admin@salfacorp.com                 │
│  • Domain: @salfacorp.com                           │
│  • Expires: January 28, 2026                        │
│  • Permissions: Read usage statistics               │
│                                                      │
│                                [Done]                │
└──────────────────────────────────────────────────────┘
```

---

## 💻 CLI User Experience

### Initial Setup (First Time)

```bash
$ npm install -g @flow-ai/cli

added 1 package in 2s

$ flow --version
0.1.0

$ flow status
🔍 Flow CLI Status

⚠️  Not authenticated

Run: flow login <your-api-key>

Config: ~/.flow-cli/config.json

$ flow login <REDACTED_API_KEY>REDACTED --endpoint http://localhost:3000

🔐 Flow CLI Authentication

Setting API endpoint: http://localhost:3000
✅ API key saved securely

Testing connection...
✅ Successfully authenticated!

User: admin@salfacorp.com
Role: admin
Config: ~/.flow-cli/config.json

💡 You can now run commands like:
   flow usage-stats @salfacorp.com
   flow usage-stats @salfacorp.com --days 30
```

---

### Daily Usage

```bash
$ flow usage-stats @salfacorp.com --days 7

📊 Usage Statistics: @salfacorp.com
Period: Last 7 days (Oct 23, 2025 - Oct 30, 2025)

👥 Users
┌─────────────┬───────────┐
│ Metric      │ Value     │
├─────────────┼───────────┤
│ Total Users │ 45        │
│ Active Users│ 32 (71.1%)│
└─────────────┴───────────┘

🤖 Agents & Conversations
┌──────────────────────────┬────────┐
│ Metric                   │ Value  │
├──────────────────────────┼────────┤
│ Total Agents             │ 120    │
│ Conversations            │ 340    │
│ Messages                 │ 2,450  │
│ Avg Messages/Conversation│ 7.2    │
└──────────────────────────┴────────┘

⚡ Model Usage
┌───────┬──────────┬────────────┬────────────┐
│ Model │ Requests │ Tokens     │ Cost (USD) │
├───────┼──────────┼────────────┼────────────┤
│ Flash │ 2,100    │ 1,250,000  │ $0.1875    │
│ Pro   │ 350      │ 450,000    │ $2.8125    │
│ Total │ 2,450    │ 1,700,000  │ $3.00      │
└───────┴──────────┴────────────┴────────────┘

📚 Context Sources
┌──────────────────────┬─────────────┐
│ Metric               │ Value       │
├──────────────────────┼─────────────┤
│ Total Sources        │ 89          │
│ Total Context Tokens │ 450,000     │
└──────────────────────┴─────────────┘

⚡ Performance
┌───────────────────┬──────────┐
│ Metric            │ Value    │
├───────────────────┼──────────┤
│ Avg Response Time │ 1500 ms  │
└───────────────────┴──────────┘

💰 Cost Summary
┌───────────────────┬──────────┐
│ Metric            │ Value    │
├───────────────────┼──────────┤
│ Total Cost        │ $3.00    │
│ Cost per User     │ $0.0667  │
│ Cost per Message  │ $0.0012  │
└───────────────────┴──────────┘
```

---

### JSON Export

```bash
$ flow usage-stats @salfacorp.com --format json

{
  "domain": "@salfacorp.com",
  "period": {
    "start": "2025-10-23T00:00:00.000Z",
    "end": "2025-10-30T23:59:59.999Z"
  },
  "totalUsers": 45,
  "activeUsers": 32,
  "totalAgents": 120,
  "totalConversations": 340,
  "totalMessages": 2450,
  "modelUsage": {
    "flash": {
      "requests": 2100,
      "tokens": 1250000,
      "cost": 0.1875
    },
    "pro": {
      "requests": 350,
      "tokens": 450000,
      "cost": 2.8125
    }
  },
  "totalContextSources": 89,
  "totalContextTokens": 450000,
  "avgResponseTimeMs": 1500,
  "totalCost": 3.00,
  "costPerUser": 0.0667,
  "costPerMessage": 0.0012
}
```

---

## 🔒 Security Visualization

### API Key Hashing Process

```
User Input (Plain Key)
    ↓
<REDACTED_API_KEY>REDACTED
    │
    │ SHA-256 Hash
    ▼
9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    │
    │ Store in Firestore
    ▼
┌─────────────────────────────────────────┐
│  Firestore: api_keys                    │
│  {                                      │
│    key: "9f86d081884c7d659a2f...",     │
│    keyPreview: "...o5p6",              │
│    assignedTo: "admin@salfacorp.com"   │
│  }                                      │
└─────────────────────────────────────────┘
    │
    │ User Request with Plain Key
    ▼
┌─────────────────────────────────────────┐
│  Verify: Hash(received) == stored       │
│  ✅ Match: Authenticate                 │
│  ❌ No match: Reject                    │
└─────────────────────────────────────────┘
```

**Why Secure:**
- ❌ Database breach → Hashes are useless (cannot reverse)
- ✅ Only SuperAdmin sees plaintext (once)
- ✅ Admin stores in password manager
- ✅ Platform never stores plaintext

---

### Domain Isolation

```
Admin A (API Key #1)
├─ Assigned: admin-a@company-a.com
├─ Domain: @company-a.com
└─ Can access:
    ✅ @company-a.com users
    ✅ @company-a.com agents
    ✅ @company-a.com stats
    ❌ @company-b.com data (BLOCKED)
    ❌ @company-c.com data (BLOCKED)

Admin B (API Key #2)
├─ Assigned: admin-b@company-b.com
├─ Domain: @company-b.com
└─ Can access:
    ❌ @company-a.com data (BLOCKED)
    ✅ @company-b.com users
    ✅ @company-b.com agents
    ✅ @company-b.com stats
    ❌ @company-c.com data (BLOCKED)

SuperAdmin (alec@getaifactory.com)
└─ Can access: ALL domains ✅
```

---

## 🌊 Data Flow Diagrams

### Login Flow

```
┌──────────┐
│   Admin  │
└────┬─────┘
     │
     │ flow login <REDACTED_API_KEY>REDACTED
     ▼
┌──────────────────────┐
│  CLI                 │
│  1. Save to config   │
│  2. Hash key         │
│  3. Call /auth/verify│
└────┬─────────────────┘
     │
     │ GET /api/cli/auth/verify
     │ X-API-Key: <REDACTED_API_KEY>REDACTED
     ▼
┌──────────────────────┐
│  Flow API            │
│  1. Hash received key│
│  2. Query Firestore  │
│  3. Check active     │
│  4. Check expired    │
│  5. Return user info │
└────┬─────────────────┘
     │
     │ { user: { email, role, domain }, ... }
     ▼
┌──────────────────────┐
│  CLI                 │
│  1. Cache user info  │
│  2. Display success  │
└──────────────────────┘
```

---

### Usage Stats Flow

```
┌──────────┐
│   Admin  │
└────┬─────┘
     │
     │ flow usage-stats @domain.com --days 30
     ▼
┌──────────────────────┐
│  CLI                 │
│  1. Read API key     │
│  2. Build request    │
│  3. Show spinner     │
└────┬─────────────────┘
     │
     │ GET /api/cli/usage-stats?domain=@domain.com&startDate=...
     │ X-API-Key: <REDACTED_API_KEY>REDACTED
     ▼
┌──────────────────────┐
│  Flow API            │
│  1. Verify API key   │
│  2. Check permission │
│  3. Verify domain    │
│  4. Query Firestore  │
│    ├─ users          │
│    ├─ conversations  │
│    ├─ messages       │
│    └─ context_sources│
│  5. Calculate stats  │
│  6. Return JSON      │
└────┬─────────────────┘
     │
     │ { domain, totalUsers, totalCost, ... }
     ▼
┌──────────────────────┐
│  CLI                 │
│  1. Parse JSON       │
│  2. Format tables    │
│  3. Display output   │
└──────────────────────┘
```

---

## 📊 Permission Model (v0.1.0)

```
┌─────────────────────────────────────────────┐
│           API KEY PERMISSIONS               │
├─────────────────────────────────────────────┤
│                                             │
│  v0.1.0 (Current)                           │
│  ├─ canReadUsageStats: ✅                   │
│  ├─ canReadDomainStats: ❌                  │
│  ├─ canManageAgents: ❌                     │
│  └─ canManageContext: ❌                    │
│                                             │
│  v0.2.0 (Planned)                           │
│  ├─ canReadUsageStats: ✅                   │
│  ├─ canReadDomainStats: ✅                  │
│  ├─ canRotateOwnKey: ✅ (new)              │
│  ├─ canManageAgents: ❌                     │
│  └─ canManageContext: ❌                    │
│                                             │
│  v0.3.0 (Planned)                           │
│  ├─ canReadUsageStats: ✅                   │
│  ├─ canReadDomainStats: ✅                  │
│  ├─ canRotateOwnKey: ✅                     │
│  ├─ canManageAgents: ✅ (new)              │
│  └─ canManageContext: ✅ (new)             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔄 Workflow Examples

### Workflow 1: Weekly Cost Monitoring

```bash
#!/bin/bash
# weekly-report.sh

# Get last 7 days stats
flow usage-stats @salfacorp.com --days 7 --format json > weekly.json

# Extract key metrics
TOTAL_COST=$(cat weekly.json | jq -r '.totalCost')
TOTAL_MESSAGES=$(cat weekly.json | jq -r '.totalMessages')
ACTIVE_USERS=$(cat weekly.json | jq -r '.activeUsers')

# Email report
echo "Weekly Report for SalfaCorp" > report.txt
echo "=============================" >> report.txt
echo "" >> report.txt
echo "Total Cost: \$$TOTAL_COST" >> report.txt
echo "Total Messages: $TOTAL_MESSAGES" >> report.txt
echo "Active Users: $ACTIVE_USERS" >> report.txt

# Send email (placeholder)
# sendmail -t < report.txt
```

---

### Workflow 2: Dashboard Integration

```javascript
// dashboard-api/routes/stats.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getDomainStats(req, res) {
  const { domain, days } = req.query;
  
  try {
    const { stdout } = await execAsync(
      `flow usage-stats ${domain} --days ${days} --format json`
    );
    
    const stats = JSON.parse(stdout);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

### Workflow 3: Automated Alerts

```bash
#!/bin/bash
# cost-alert.sh

# Get today's stats
STATS=$(flow usage-stats @salfacorp.com --days 1 --format json)
DAILY_COST=$(echo $STATS | jq -r '.totalCost')

# Alert if over threshold
if (( $(echo "$DAILY_COST > 5.00" | bc -l) )); then
  echo "⚠️  ALERT: Daily cost exceeded \$5.00"
  echo "Current: \$$DAILY_COST"
  # Send alert...
fi
```

---

## 🎯 Before/After Comparison

### Before CLI

```
Admin wants usage stats
    ↓
1. Email SuperAdmin: "Can I get stats for @salfacorp.com?"
2. SuperAdmin logs into platform
3. SuperAdmin navigates to analytics
4. SuperAdmin filters by domain
5. SuperAdmin screenshots/exports
6. SuperAdmin emails back to admin
7. Admin receives stats (hours later)
```

### After CLI

```
Admin wants usage stats
    ↓
1. Run: flow usage-stats @salfacorp.com
2. View stats instantly (< 3 seconds)
3. Export as JSON if needed
4. Integrate into dashboards
```

**Time saved**: Hours → Seconds  
**Self-service**: ✅ Admin empowered  
**Automation**: ✅ Scriptable  

---

## 📈 Adoption Strategy

### Phase 1: SuperAdmin Only (Week 1)

```
SuperAdmin creates 1 test key
    ↓
Tests all commands locally
    ↓
Verifies security (domain isolation, expiration)
    ↓
Approves for limited rollout
```

### Phase 2: Beta Admins (Week 2-3)

```
Create keys for 3-5 trusted admins
    ↓
Each admin:
  1. Installs CLI
  2. Tests usage-stats
  3. Provides feedback
    ↓
Iterate on UX/bugs
```

### Phase 3: General Availability (Week 4+)

```
All domain admins can request keys
    ↓
SuperAdmin creates keys via UI
    ↓
Admins use CLI for daily monitoring
    ↓
Track adoption metrics
```

---

## ✅ Quality Checklist

### Code Quality
- [x] TypeScript compiles (0 errors)
- [x] All imports resolve
- [x] No console.logs in production paths
- [x] Error handling on all async operations
- [x] Type safety enforced

### Security
- [x] API keys hashed (SHA-256)
- [x] No plaintext keys in storage
- [x] Config file permissions (0600)
- [x] Domain isolation enforced
- [x] Expiration checked on every request
- [x] Audit logging enabled

### UX
- [x] Clear error messages
- [x] Beautiful terminal output
- [x] Loading spinners
- [x] Color-coded information
- [x] Helpful examples in --help
- [x] Quick start in README

### Documentation
- [x] README.md complete
- [x] Quick start guide
- [x] API reference
- [x] Troubleshooting section
- [x] Security best practices
- [x] Visual guides (this file)

---

## 🎓 Key Learnings

### 1. Start Simple

**Decision**: Read-only, single use case  
**Result**: Focused, testable, valuable  
**Lesson**: Better to ship one thing well than many things poorly

### 2. Security First

**Decision**: Hash keys, domain isolation, expiration  
**Result**: Enterprise-grade security from v0.1.0  
**Lesson**: Security is easier to build in than retrofit

### 3. Great UX Matters

**Decision**: Beautiful output, clear errors, one-time setup  
**Result**: CLI that's enjoyable to use  
**Lesson**: Developer tools deserve good UX too

### 4. Plan for Expansion

**Decision**: Extensible permission model, command structure  
**Result**: Easy to add new features  
**Lesson**: Architecture decisions pay off over time

---

## 🚀 Ready to Test!

This implementation is:
- ✅ **Complete**: All features implemented
- ✅ **Tested**: Builds successfully, commands work
- ✅ **Documented**: Comprehensive docs and guides
- ✅ **Secure**: Industry-standard practices
- ✅ **Production-ready**: Error handling, logging, monitoring

**Next**: User testing and feedback! 🎉










