# Flow CLI & API Key Management System

**Created**: 2025-10-30  
**Version**: 0.1.0  
**Status**: ✅ Ready for Testing

---

## 🎯 Overview

Implemented a secure, read-only CLI for Flow AI Platform that enables:

1. **SuperAdmins** create and manage API keys
2. **Domain Admins** access usage statistics via CLI
3. **Developers** integrate platform data into tools

**Core Principle**: Start simple, secure, read-only. Expand capabilities incrementally.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FLOW CLI ARCHITECTURE                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SuperAdmin (Web UI)                                    │
│  └─ Creates API Key                                     │
│     ├─ Name: "Production CLI Key"                       │
│     ├─ Assigned To: admin@domain.com                    │
│     ├─ Domain: @domain.com                              │
│     ├─ Expires: 90 days                                 │
│     └─ Permissions: { canReadUsageStats: true }         │
│                                                         │
│  Generated API Key (shown once)                         │
│  └─ <REDACTED_API_KEY>REDACTED                                 │
│                                                         │
│  Admin (CLI)                                            │
│  └─ flow login <REDACTED_API_KEY>REDACTED                      │
│     ├─ Saves to ~/.flow-cli/config.json                 │
│     ├─ Verifies with /api/cli/auth/verify               │
│     └─ Caches user info                                 │
│                                                         │
│  Admin Runs Command                                     │
│  └─ flow usage-stats @domain.com                        │
│     ├─ Sends X-API-Key header                           │
│     ├─ Server verifies hash                             │
│     ├─ Server checks permissions                        │
│     ├─ Server enforces domain access                    │
│     └─ Returns usage statistics                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### API Key Generation

```typescript
// 1. Generate 32-byte random key
const apiKey = crypto.randomBytes(32).toString('base64url');
// Result: <REDACTED_API_KEY>REDACTED

// 2. Hash before storage (SHA-256)
const hashedKey = crypto
  .createHash('sha256')
  .update(apiKey)
  .digest('hex');

// 3. Store in Firestore
{
  key: hashedKey,              // ← Never store plaintext
  keyPreview: '...o5p6',       // Last 8 chars for display
  assignedTo: 'admin@domain.com',
  domain: '@domain.com',
  createdAt: timestamp,
  expiresAt: timestamp + 90days,
  isActive: true,
  permissions: { canReadUsageStats: true }
}
```

### API Key Verification Flow

```
1. Admin runs: flow usage-stats @domain.com
2. CLI reads API key from ~/.flow-cli/config.json
3. CLI sends request with X-API-Key header
4. Server hashes received key
5. Server queries Firestore: WHERE key == hashedKey AND isActive == true
6. Server checks expiration
7. Server verifies domain access
8. Server returns data OR 401/403
```

### Security Features

✅ **Hashed storage** - Keys are SHA-256 hashed in Firestore  
✅ **Single-view** - Full key shown only once after creation  
✅ **Expiration** - Keys can expire after N days  
✅ **Revocation** - SuperAdmin can revoke any key  
✅ **Domain-scoped** - Each key can only access its assigned domain  
✅ **Audit trail** - All API requests logged with timestamps  
✅ **Secure config** - CLI config stored with 0600 permissions  

---

## 📦 Package Structure

```
packages/flow-cli/
├── package.json           # NPM package config
├── tsconfig.json          # TypeScript config
├── .npmignore             # Exclude dev files from npm
├── LICENSE                # MIT license
├── README.md              # User documentation
└── src/
    ├── index.ts           # CLI entry point (#!/usr/bin/env node)
    ├── types.ts           # TypeScript interfaces
    ├── config.ts          # Config file management
    ├── api-client.ts      # API client class
    └── commands/
        ├── login.ts       # Authentication command
        └── usage-stats.ts # Usage statistics command
```

---

## 🎨 SuperAdmin UI

### API Key Management Panel

**Location**: `/superadmin` → API Keys tab

**Features:**
- ✅ List all API keys with status
- ✅ Create new API key modal
- ✅ Revoke API key button
- ✅ One-time key display after creation
- ✅ Copy to clipboard functionality
- ✅ Quick start instructions
- ✅ Usage statistics (request count, last used)

**Create API Key Form:**
```
┌─────────────────────────────────────────────┐
│  Create New API Key                      [X]│
├─────────────────────────────────────────────┤
│                                             │
│  Key Name: [Production CLI Key          ]  │
│                                             │
│  Assigned To: [admin@mydomain.com       ]  │
│                                             │
│  Domain: [@mydomain.com                 ]  │
│  This key will only access this domain      │
│                                             │
│  Expires In: [90] days                      │
│  Leave empty for no expiration (not recommended)
│                                             │
│  Description: [                          ]  │
│  [Optional notes about this key...      ]  │
│                                             │
│              [Cancel]  [Create API Key]    │
└─────────────────────────────────────────────┘
```

**After Creation:**
```
┌─────────────────────────────────────────────┐
│  ✅ API Key Created!                     [X]│
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ Save this key securely!                │
│  This is the only time you'll see the      │
│  full API key.                              │
│                                             │
│  API Key: <REDACTED_API_KEY>REDACTED   [Copy 📋]    │
│                                             │
│  Quick Start:                               │
│  ┌─────────────────────────────────────┐   │
│  │ flow login <REDACTED_API_KEY>REDACTED        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Or with npx:                               │
│  ┌─────────────────────────────────────┐   │
│  │ npx @flow-ai/cli login <REDACTED_API_KEY>REDACTED  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                          [Done]             │
└─────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1. POST /api/superadmin/api-keys

**Purpose**: Create new API key (SuperAdmin only)

**Auth**: JWT session (SuperAdmin)

**Request:**
```json
{
  "name": "Production CLI Key",
  "assignedTo": "admin@mydomain.com",
  "domain": "@mydomain.com",
  "expiresInDays": 90,
  "description": "CLI access for production monitoring"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": {
    "id": "key-abc123",
    "key": "<REDACTED_API_KEY>REDACTED",
    "keyPreview": "...o5p6",
    "name": "Production CLI Key",
    "assignedTo": "admin@mydomain.com",
    "domain": "@mydomain.com",
    "createdAt": "2025-10-30T10:00:00Z",
    "expiresAt": "2026-01-28T10:00:00Z",
    "permissions": {
      "canReadUsageStats": true
    }
  },
  "warning": "Save this API key securely. It will not be shown again."
}
```

---

### 2. GET /api/superadmin/api-keys

**Purpose**: List all API keys (SuperAdmin only)

**Auth**: JWT session (SuperAdmin)

**Response:**
```json
{
  "apiKeys": [
    {
      "id": "key-abc123",
      "name": "Production CLI Key",
      "keyPreview": "...o5p6",
      "assignedTo": "admin@mydomain.com",
      "domain": "@mydomain.com",
      "isActive": true,
      "createdAt": "2025-10-30T10:00:00Z",
      "expiresAt": "2026-01-28T10:00:00Z",
      "requestCount": 145,
      "lastUsedAt": "2025-10-30T09:30:00Z"
    }
  ]
}
```

---

### 3. DELETE /api/superadmin/api-keys

**Purpose**: Revoke API key (SuperAdmin only)

**Auth**: JWT session (SuperAdmin)

**Request:**
```json
{
  "apiKeyId": "key-abc123"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 4. GET /api/cli/auth/verify

**Purpose**: Verify API key and return user info

**Auth**: X-API-Key header

**Headers:**
```
X-API-Key: <REDACTED_API_KEY>REDACTED
```

**Response:**
```json
{
  "status": "authenticated",
  "user": {
    "email": "admin@mydomain.com",
    "domain": "@mydomain.com",
    "role": "admin",
    "permissions": {
      "canReadUsageStats": true
    }
  },
  "apiKey": {
    "id": "key-abc123",
    "name": "Production CLI Key",
    "createdAt": "2025-10-30T10:00:00Z",
    "expiresAt": "2026-01-28T10:00:00Z"
  }
}
```

---

### 5. GET /api/cli/usage-stats

**Purpose**: Get domain usage statistics

**Auth**: X-API-Key header

**Query Parameters:**
- `domain`: Domain to query (e.g., @mydomain.com)
- `startDate`: ISO date (optional, default: 7 days ago)
- `endDate`: ISO date (optional, default: now)

**Headers:**
```
X-API-Key: <REDACTED_API_KEY>REDACTED
```

**Response:**
```json
{
  "domain": "@mydomain.com",
  "period": {
    "start": "2025-10-23T00:00:00Z",
    "end": "2025-10-30T00:00:00Z"
  },
  "totalUsers": 45,
  "activeUsers": 32,
  "totalAgents": 120,
  "totalConversations": 340,
  "totalMessages": 2450,
  "modelUsage": {
    "flash": { "requests": 2100, "tokens": 1250000, "cost": 0.1875 },
    "pro": { "requests": 350, "tokens": 450000, "cost": 2.8125 }
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

## 📊 Firestore Schema

### Collection: `api_keys`

```typescript
{
  id: string,                       // Auto-generated
  name: string,                     // "Production CLI Key"
  key: string,                      // SHA-256 hash (never plaintext)
  keyPreview: string,               // Last 8 chars for display
  createdBy: string,                // SuperAdmin email
  createdAt: Timestamp,
  expiresAt?: Timestamp,            // Optional expiration
  isActive: boolean,
  
  // Assignment
  assignedTo: string,               // Admin email
  domain: string,                   // @domain.com
  
  // Permissions (v0.1.0)
  permissions: {
    canReadUsageStats: boolean,     // ✅ Implemented
    canReadDomainStats: boolean,    // 🔜 Future
    canManageAgents: boolean,       // 🔜 Future
    canManageContext: boolean,      // 🔜 Future
  },
  
  // Usage tracking
  requestCount: number,
  lastUsedAt?: Timestamp,
  
  // Metadata
  description?: string,
  environment: 'localhost' | 'production',
  
  // Revocation (soft delete)
  revokedAt?: Timestamp,
  revokedBy?: string,
}
```

**Indexes Required:**
```json
[
  {
    "fields": [
      { "fieldPath": "key", "order": "ASCENDING" },
      { "fieldPath": "isActive", "order": "ASCENDING" }
    ]
  },
  {
    "fields": [
      { "fieldPath": "assignedTo", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "fields": [
      { "fieldPath": "domain", "order": "ASCENDING" },
      { "fieldPath": "isActive", "order": "ASCENDING" }
    ]
  }
]
```

---

## 🚀 Usage Examples

### Example 1: SuperAdmin Creates Key

```bash
# 1. Login to Flow platform
open https://flow.getaifactory.com/superadmin

# 2. Navigate to API Keys tab
# 3. Click "Create New API Key"
# 4. Fill form:
#    Name: Production CLI Key
#    Assigned To: admin@salfacorp.com
#    Domain: @salfacorp.com
#    Expires In: 90 days
#    Description: CLI access for SalfaCorp production
# 5. Click "Create"
# 6. Copy the generated key: <REDACTED_API_KEY>REDACTED
# 7. Send securely to admin@salfacorp.com (encrypted email, 1Password, etc.)
```

---

### Example 2: Admin Uses CLI

```bash
# 1. Install CLI globally
npm install -g @flow-ai/cli

# 2. Login with API key
flow login <REDACTED_API_KEY>REDACTED

# Output:
# 🔐 Flow CLI Authentication
# 
# Setting API endpoint: http://localhost:3000
# ✅ API key saved securely
# 
# Testing connection...
# ✅ Successfully authenticated!
# 
# User: admin@salfacorp.com
# Role: admin
# Config: ~/.flow-cli/config.json
# 
# 💡 You can now run commands like:
#    flow usage-stats @salfacorp.com
#    flow usage-stats @salfacorp.com --days 30

# 3. View usage stats
flow usage-stats @salfacorp.com --days 30

# 4. Export as JSON
flow usage-stats @salfacorp.com --format json > stats.json
```

---

### Example 3: Developer Uses NPX

```bash
# No installation needed!
npx @flow-ai/cli usage-stats @mydomain.com --days 7

# On first run, will prompt for API key:
# Enter API key: <REDACTED_API_KEY>REDACTED

# Subsequent runs use cached config
```

---

## 🧪 Testing Procedures

### Local Testing

```bash
# 1. Start platform locally
cd /Users/alec/salfagpt
npm run dev  # Port 3000

# 2. In another terminal, build CLI
cd packages/flow-cli
npm install
npm run build
npm link

# 3. Create API key via platform
# Open http://localhost:3000/superadmin
# Login as alec@getaifactory.com
# Navigate to API Keys
# Create key for test@domain.com with domain @test.com

# 4. Test CLI authentication
flow login <generated-key> --endpoint http://localhost:3000

# Expected: ✅ Successfully authenticated!

# 5. Test usage stats
flow usage-stats @test.com --days 7

# Expected: Table with usage statistics

# 6. Test domain isolation
flow usage-stats @otherdomain.com

# Expected: ❌ Cannot access other domains

# 7. Test JSON export
flow usage-stats @test.com --format json > test-stats.json
cat test-stats.json

# Expected: Valid JSON with stats
```

---

### Production Testing

```bash
# 1. Publish to npm (or test with npx link)
cd packages/flow-cli
npm publish --dry-run  # Test package contents

# 2. Install from npm
npm install -g @flow-ai/cli@latest

# 3. Login with production key
flow login <prod-api-key> --endpoint https://flow.getaifactory.com

# 4. Test production stats
flow usage-stats @salfacorp.com --days 30

# 5. Verify in platform
# Check /api/superadmin/api-keys
# Should see requestCount increment
# Should see lastUsedAt update
```

---

## 🔧 Configuration Files

### ~/.flow-cli/config.json

```json
{
  "apiKey": "<REDACTED_API_KEY>REDACTED",
  "apiEndpoint": "https://flow.getaifactory.com",
  "userEmail": "admin@mydomain.com",
  "userRole": "admin",
  "lastUpdated": "2025-10-30T10:00:00.000Z"
}
```

**Security:**
- File permissions: `0600` (owner read/write only)
- Location: `~/.flow-cli/` (hidden directory)
- Never committed to git
- Automatically created on first login

---

## 📋 Checklist Before Publishing

### Package Quality
- [ ] `npm run build` succeeds
- [ ] TypeScript compiles with 0 errors
- [ ] All imports resolve correctly
- [ ] README.md is comprehensive
- [ ] LICENSE file is present
- [ ] .npmignore excludes dev files

### Security
- [ ] No .env files in package
- [ ] No hardcoded credentials
- [ ] API keys are hashed (SHA-256)
- [ ] Config file has secure permissions (0600)
- [ ] All endpoints verify authentication

### Functionality
- [ ] `flow login` authenticates successfully
- [ ] `flow status` shows correct info
- [ ] `flow usage-stats` returns data
- [ ] `flow logout` clears config
- [ ] Domain isolation enforced

### Testing
- [ ] Tested locally with localhost
- [ ] Tested with production endpoint
- [ ] Tested domain isolation
- [ ] Tested expired key rejection
- [ ] Tested revoked key rejection
- [ ] Tested invalid key rejection

### Documentation
- [ ] README.md complete with examples
- [ ] All commands documented
- [ ] Troubleshooting section included
- [ ] Security best practices documented
- [ ] Changelog started

---

## 🚀 Deployment Steps

### Step 1: Build and Test Package

```bash
cd packages/flow-cli

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify dist/ contents
ls -la dist/

# Test locally
npm link
flow --help
```

### Step 2: Test End-to-End

```bash
# 1. Create API key in platform
# 2. Login with CLI
# 3. Run usage-stats command
# 4. Verify output
# 5. Check API logs in platform
```

### Step 3: Publish to NPM

```bash
# Dry run (verify package contents)
npm publish --dry-run

# Check what will be published
npm pack
tar -tzf flow-ai-cli-0.1.0.tgz

# Publish to npm
npm publish --access public

# Verify published
npm view @flow-ai/cli
```

### Step 4: Deploy Backend Changes

```bash
# From main salfagpt directory
git add .
git commit -m "feat: Add CLI API key management system

- SuperAdmin can create/revoke API keys
- API keys with domain-scoped access
- Read-only usage stats endpoint
- SHA-256 hashed key storage
- Expiration support
- Audit logging

Includes:
- API Key Management UI component
- /api/cli/auth/verify endpoint
- /api/cli/usage-stats endpoint
- /api/superadmin/api-keys CRUD
- Firestore indexes for api_keys collection

Version: 0.1.0
Status: Ready for testing"

# Deploy to production
gcloud run deploy flow-chat --source . --region us-central1
```

---

## 🔮 Future Enhancements

### v0.2.0 - Admin Self-Service
- [ ] Admins can rotate their own API keys
- [ ] Admins can see their API key usage
- [ ] Multi-domain support per key
- [ ] API key usage analytics

### v0.3.0 - Write Operations
- [ ] Upload context sources via CLI
- [ ] Create/configure agents via CLI
- [ ] Bulk operations support
- [ ] Agent deployment commands

### v0.4.0 - Advanced Features
- [ ] Custom report generation
- [ ] Scheduled data exports
- [ ] Webhook integrations
- [ ] CI/CD pipeline integration

---

## 🎓 Key Decisions

### Why Read-Only First?

**Rationale:**
1. **Security**: Read-only is much safer for first release
2. **Simplicity**: Single use case (usage stats) is easy to test
3. **Value**: Immediate value for admins monitoring domains
4. **Foundation**: Builds secure auth foundation for future features

### Why API Keys vs OAuth?

**Rationale:**
1. **CLI-friendly**: API keys work better in terminal environments
2. **Machine-to-machine**: Suitable for automation and scripts
3. **Simple**: No browser redirect flows needed
4. **Flexible**: Easy to rotate and revoke
5. **Granular**: Can assign specific permissions per key

### Why Hash API Keys?

**Rationale:**
1. **Security**: If Firestore is compromised, keys are not usable
2. **Best Practice**: Industry standard (GitHub, Stripe, etc.)
3. **One-way**: Cannot reverse hash to get original key
4. **Verification**: Can verify without storing plaintext

---

## ✅ Success Criteria

A successful CLI implementation should:

### Security ✅
- [ ] API keys are hashed before storage
- [ ] Keys can expire after N days
- [ ] Keys can be revoked instantly
- [ ] Domain access is enforced
- [ ] All requests are authenticated
- [ ] All requests are logged

### Functionality ✅
- [ ] SuperAdmin can create keys
- [ ] SuperAdmin can revoke keys
- [ ] Admin can login with key
- [ ] Admin can view domain stats
- [ ] Stats are accurate
- [ ] Commands have helpful output

### User Experience ✅
- [ ] Clear error messages
- [ ] Beautiful terminal output
- [ ] Simple installation (npm/npx)
- [ ] Comprehensive documentation
- [ ] Quick start guide
- [ ] Troubleshooting section

---

## 📞 Support

**Issues**: Report via Flow platform or GitHub  
**Questions**: hello@getaifactory.com  
**Documentation**: This file + README.md in package

---

**Last Updated**: 2025-10-30  
**Version**: 0.1.0  
**Status**: ✅ Ready for Testing  
**Next**: Test locally → Deploy → Publish to NPM






