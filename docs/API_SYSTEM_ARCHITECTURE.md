# Flow API System Architecture

**Created:** 2025-11-16  
**Version:** 1.0.0  
**Status:** 🔨 Implementation Ready

---

## 🎯 **Overview**

The Flow API System enables external developers to integrate Flow's Vision API capabilities into their applications. It provides:

1. **Flow Vision API** - Document processing and context extraction
2. **Developer Portal** - Self-service documentation and API management
3. **Invitation System** - SuperAdmin-controlled access distribution
4. **CLI Authentication** - Google OAuth via CLI for developer access
5. **API Organizations** - Multi-domain API workspace management
6. **Requirement Workflow** - Iterative document refinement with AI assistance

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FLOW API ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SuperAdmin (alec@getaifactory.com)                                 │
│      ↓                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │  API Invitation Management              │                        │
│  │  • Create personal invitations          │                        │
│  │  • Target specific audiences            │                        │
│  │  • Track invitation usage               │                        │
│  └─────────────────────────────────────────┘                        │
│      ↓                                                               │
│  Developer receives invitation email                                │
│      ↓                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │  CLI Authentication Flow                │                        │
│  │  $ flow-cli login                       │                        │
│  │  • Google OAuth in terminal             │                        │
│  │  • Business email required              │                        │
│  │  • Creates API organization             │                        │
│  └─────────────────────────────────────────┘                        │
│      ↓                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │  API Organization Portal                │                        │
│  │  • Organization: Salfa-Corp-API         │                        │
│  │  • Domain: salfagestion.cl              │                        │
│  │  • Members: dev team                    │                        │
│  │  • API Keys: Multiple with scopes       │                        │
│  └─────────────────────────────────────────┘                        │
│      ↓                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │  Developer Portal                       │                        │
│  │  • API Documentation                    │                        │
│  │  • Interactive playground               │                        │
│  │  • Code examples (curl, JS, Python)     │                        │
│  │  • Usage analytics                      │                        │
│  └─────────────────────────────────────────┘                        │
│      ↓                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │  Flow Vision API                        │                        │
│  │  POST /api/v1/extract-document          │                        │
│  │  • Upload PDF/Excel/Word/CSV            │                        │
│  │  • Get structured extraction            │                        │
│  │  • Webhook on completion                │                        │
│  └─────────────────────────────────────────┘                        │
│      ↓                                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │  Requirement Document Workflow          │                        │
│  │  1. Upload requirement doc              │                        │
│  │  2. AI preprompting (enhancement)       │                        │
│  │  3. User reviews and confirms           │                        │
│  │  4. Up to 10 iterations                 │                        │
│  │  5. Request help (Admin/Ally/Stella)    │                        │
│  │  6. Feedback → Staging → Production     │                        │
│  └─────────────────────────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 **Data Model**

### Firestore Collections

#### 1. `api_organizations`

```typescript
interface APIOrganization {
  // Identity
  id: string;                     // org-{timestamp}-{random}
  name: string;                   // "Salfa-Corp-API"
  domain: string;                 // "salfagestion.cl"
  
  // Ownership
  ownerId: string;                // User who created org
  ownerEmail: string;             // Business email
  memberIds: string[];            // Team members
  
  // Configuration
  type: 'api_consumer';           // Future: 'api_provider', 'reseller'
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  
  // Limits
  quotas: {
    monthlyRequests: number;      // Max API calls per month
    dailyRequests: number;        // Max API calls per day
    concurrentRequests: number;   // Max simultaneous requests
    maxFileSize: number;          // Max upload size (MB)
  };
  
  // Usage tracking
  usage: {
    totalRequests: number;
    currentMonthRequests: number;
    totalDocumentsProcessed: number;
    totalTokensUsed: number;
    totalCost: number;
  };
  
  // Access control
  allowedIPs?: string[];          // IP whitelist (optional)
  webhookUrl?: string;            // Callback URL for async operations
  
  // Status
  status: 'active' | 'suspended' | 'trial';
  trialEndsAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}
```

#### 2. `api_keys`

```typescript
interface APIKey {
  // Identity
  id: string;                     // api_key_id
  key: string;                    // Hashed API key (bcrypt)
  keyPrefix: string;              // First 8 chars (for display)
  
  // Ownership
  organizationId: string;         // Parent API organization
  createdBy: string;              // User ID who created
  
  // Configuration
  name: string;                   // Developer-friendly name
  scopes: string[];               // Permissions: ['vision:read', 'vision:write']
  
  // Status
  status: 'active' | 'revoked';
  
  // Security
  lastUsedAt?: Date;
  lastUsedFrom?: string;          // IP address
  
  // Limits (override org defaults)
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;               // Optional expiration
  revokedAt?: Date;
  revokedBy?: string;
  
  // Source tracking
  source: 'localhost' | 'production';
}
```

#### 3. `api_invitations`

```typescript
interface APIInvitation {
  // Identity
  id: string;
  invitationCode: string;         // Unique code (secure random)
  
  // SuperAdmin control
  createdBy: string;              // SuperAdmin user ID
  createdByEmail: string;         // alec@getaifactory.com
  
  // Targeting
  targetAudience: string;         // e.g., "Enterprise Clients", "Beta Testers"
  description: string;            // Purpose of this invitation batch
  allowedDomains?: string[];      // Restrict to specific business domains
  
  // Limits
  maxRedemptions: number;         // How many can use this code
  currentRedemptions: number;     // How many have used it
  
  // Configuration
  defaultTier: 'trial' | 'starter' | 'pro';
  trialDuration?: number;         // Days if tier = 'trial'
  
  // Status
  status: 'active' | 'expired' | 'exhausted';
  
  // Redemptions tracking
  redeemedBy: Array<{
    userId: string;
    userEmail: string;
    organizationId: string;
    redeemedAt: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}
```

#### 4. `api_usage_logs`

```typescript
interface APIUsageLog {
  // Identity
  id: string;
  
  // Request info
  organizationId: string;
  apiKeyId: string;
  endpoint: string;               // '/api/v1/extract-document'
  method: string;                 // 'POST'
  
  // Details
  fileType?: string;              // 'application/pdf'
  fileSize?: number;              // bytes
  model?: string;                 // 'gemini-2.5-flash'
  
  // Response
  statusCode: number;             // 200, 400, 500, etc.
  success: boolean;
  
  // Resources
  tokensUsed?: number;
  costUSD?: number;
  durationMs: number;
  
  // Security
  ipAddress: string;              // Hashed for privacy
  userAgent: string;
  
  // Error tracking
  errorMessage?: string;
  errorCode?: string;
  
  // Timestamp
  timestamp: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}
```

#### 5. `api_requirement_workflows`

```typescript
interface APIRequirementWorkflow {
  // Identity
  id: string;
  organizationId: string;
  userId: string;
  
  // Document
  originalDocumentId: string;     // Context source ID
  originalDocumentName: string;
  currentVersion: number;         // Iteration count (max 10)
  
  // AI Enhancement
  enhancementPrompt: string;      // AI preprompting used
  enhancedRequirements?: string;  // AI-enhanced version
  
  // User feedback
  iterations: Array<{
    version: number;
    aiSuggestions: string;
    userFeedback: string;
    approved: boolean;
    timestamp: Date;
  }>;
  
  // Status
  status: 'draft' | 'in_review' | 'approved' | 'needs_help';
  
  // Help requests
  helpRequests?: Array<{
    type: 'admin' | 'ally' | 'stella';
    message: string;
    requestedAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
  }>;
  
  // Staging feedback
  stagingIssues?: Array<{
    description: string;
    reportedAt: Date;
    fixedInStaging: boolean;
    deployedToProduction: boolean;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  
  // Source tracking
  source: 'localhost' | 'production';
}
```

---

## 🔐 **Authentication & Authorization**

### CLI Authentication Flow

```
1. Developer runs: flow-cli login
   ↓
2. CLI opens browser to: https://flow.ai/api/cli/auth
   ↓
3. User logs in with Google OAuth
   ↓
4. Backend validates:
   - Valid invitation code exists
   - Email domain is business (not @gmail.com)
   - User not already registered
   ↓
5. Create API Organization:
   - Extract domain from email
   - Set defaults based on invitation tier
   - Generate first API key
   ↓
6. CLI receives:
   - API key (display once, save to ~/.flow/credentials)
   - Organization ID
   - Welcome message
   ↓
7. CLI stores credentials:
   ~/.flow/credentials.json (secure permissions)
   {
     "organizationId": "org-xxx",
     "apiKey": "fv_live_xxx...",
     "email": "dev@company.com",
     "createdAt": "2025-11-16T..."
   }
   ↓
8. Developer can now use API
```

### API Key Authentication

```typescript
// Every API request includes header
Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx

// Backend validates:
1. API key exists and not revoked
2. Belongs to active organization
3. Has required scopes for endpoint
4. Organization within quotas
5. Request from allowed IP (if configured)
```

### Scopes System

```typescript
type APIScope = 
  | 'vision:read'         // Read document extraction results
  | 'vision:write'        // Upload and extract documents
  | 'vision:delete'       // Delete documents
  | 'org:read'            // View organization info
  | 'org:write'           // Update organization settings
  | 'analytics:read';     // View usage analytics

// API key can have multiple scopes
```

---

## 🚀 **Flow Vision API Specification**

### POST /api/v1/extract-document

**Purpose:** Upload and extract content from documents using Flow's Vision AI

**Request:**
```typescript
POST https://api.flow.ai/v1/extract-document
Authorization: Bearer fv_live_xxxxxxxxxxxxxxxx
Content-Type: multipart/form-data

{
  file: File,                     // PDF/Excel/Word/CSV (<500MB)
  model: 'flash' | 'pro',         // Optional (default: flash)
  extractionMethod: 'vision-api' | 'gemini', // Optional (auto-selected)
  webhookUrl?: string,            // Callback URL for async processing
  metadata?: {                    // Optional metadata
    description?: string,
    tags?: string[],
    customId?: string,
  }
}
```

**Response (Sync - Small Files <50MB):**
```typescript
{
  success: true,
  documentId: "doc_xxxxx",
  extractedText: "Full extracted content...",
  metadata: {
    fileName: "requirements.pdf",
    fileSize: 1240000,
    pageCount: 15,
    model: "gemini-2.5-flash",
    extractionMethod: "vision-api",
    tokensUsed: 12450,
    costUSD: 0.0034,
    processingTime: 2300
  }
}
```

**Response (Async - Large Files >50MB):**
```typescript
{
  success: true,
  jobId: "job_xxxxx",
  status: "processing",
  estimatedCompletion: "2025-11-16T10:35:00Z",
  webhookUrl: "https://your-app.com/webhooks/flow",
  message: "Large file processing asynchronously. Webhook will be called on completion."
}
```

**Webhook Payload (on completion):**
```typescript
POST https://your-app.com/webhooks/flow
Content-Type: application/json
X-Flow-Signature: sha256=xxxxx  // HMAC signature for verification

{
  jobId: "job_xxxxx",
  documentId: "doc_xxxxx",
  status: "completed" | "failed",
  extractedText?: "Full content...",
  error?: {
    code: "EXTRACTION_FAILED",
    message: "Details..."
  },
  metadata: {
    // Same as sync response
  }
}
```

**Error Responses:**
```typescript
// 401 Unauthorized
{
  error: {
    code: "UNAUTHORIZED",
    message: "Invalid or missing API key"
  }
}

// 403 Forbidden
{
  error: {
    code: "QUOTA_EXCEEDED",
    message: "Monthly quota limit reached",
    quota: {
      limit: 1000,
      used: 1000,
      resetsAt: "2025-12-01T00:00:00Z"
    }
  }
}

// 400 Bad Request
{
  error: {
    code: "INVALID_FILE",
    message: "File too large. Maximum: 500MB",
    fileSize: 650000000,
    maxSize: 524288000
  }
}
```

---

## 🎛️ **Developer Portal Features**

### Portal Structure

```
https://api.flow.ai/portal (Developer Portal)
  │
  ├─ Dashboard
  │   ├─ API usage charts
  │   ├─ Quota status
  │   ├─ Recent requests
  │   └─ Quick start guide
  │
  ├─ Documentation
  │   ├─ API Reference
  │   │   ├─ Authentication
  │   │   ├─ Vision API
  │   │   ├─ Webhooks
  │   │   └─ Error codes
  │   ├─ Guides
  │   │   ├─ Quick start
  │   │   ├─ Best practices
  │   │   └─ Use cases
  │   └─ SDKs
  │       ├─ JavaScript/TypeScript
  │       ├─ Python
  │       └─ cURL examples
  │
  ├─ API Keys
  │   ├─ Create new key
  │   ├─ Revoke key
  │   ├─ View usage per key
  │   └─ Configure scopes
  │
  ├─ Organization
  │   ├─ Team members
  │   ├─ Settings
  │   ├─ Billing (future)
  │   └─ Webhooks
  │
  ├─ Playground
  │   ├─ Interactive API tester
  │   ├─ Upload sample files
  │   ├─ See live extraction
  │   └─ Copy code examples
  │
  └─ Support
      ├─ Submit ticket
      ├─ Chat with Ally
      └─ Contact admin
```

---

## 🛠️ **Requirement Document Workflow**

### Workflow Stages

```
Stage 1: Upload
  └─ Developer uploads requirement document
     ↓
Stage 2: AI Enhancement (Preprompting)
  ├─ AI analyzes document
  ├─ Suggests improvements:
  │   • Missing technical details
  │   • Ambiguous requirements
  │   • Incomplete acceptance criteria
  │   • Performance requirements
  │   • Security considerations
  └─ Generates enhanced version
     ↓
Stage 3: User Review
  ├─ Side-by-side comparison:
  │   • Original (left)
  │   • AI-enhanced (right)
  │   • Diff highlighting
  ├─ User provides feedback:
  │   • Approve changes
  │   • Request modifications
  │   • Add comments
  └─ Iteration count: X/10
     ↓
Stage 4: Iteration (up to 10 times)
  ├─ AI refines based on feedback
  ├─ User reviews again
  └─ Repeat until approved or max iterations
     ↓
Stage 5: Help Request (if needed)
  ├─ Admin help:
  │   • Direct message to SuperAdmin
  │   • Email notification
  │   • Priority: High
  ├─ Ally support:
  │   • AI assistant (Ally)
  │   • Contextual suggestions
  │   • Knowledge base search
  └─ Stella ticketing:
      • Create formal ticket
      • Track in backlog
      • SLA tracking
     ↓
Stage 6: Feedback Loop (if issues found)
  ├─ Developer reports issue in production
  ├─ Issue flagged in staging environment
  ├─ Fix developed and tested in staging
  ├─ Developer invited to test staging fix
  ├─ If approved → Deploy to production
  └─ Close feedback loop
```

---

## 📋 **API Endpoints**

### Authentication Endpoints

```typescript
// CLI login flow
POST /api/v1/auth/cli/initiate
Response: { authUrl: string, state: string }

GET /api/v1/auth/cli/callback
Query: { code: string, state: string }
Response: { apiKey: string, organization: APIOrganization }

// Verify API key
GET /api/v1/auth/verify
Headers: Authorization: Bearer {apiKey}
Response: { valid: boolean, organization: APIOrganization, scopes: string[] }
```

### Vision API Endpoints

```typescript
// Extract document
POST /api/v1/extract-document
// See specification above

// Get extraction status (for async jobs)
GET /api/v1/jobs/{jobId}
Response: {
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress?: number,
  result?: ExtractionResult
}

// List documents
GET /api/v1/documents
Query: { limit?: number, offset?: number }
Response: {
  documents: Array<{
    id: string,
    name: string,
    status: string,
    createdAt: string
  }>,
  total: number,
  hasMore: boolean
}
```

### Organization Endpoints

```typescript
// Get organization info
GET /api/v1/organization
Response: APIOrganization

// Update organization
PATCH /api/v1/organization
Body: { webhookUrl?: string, allowedIPs?: string[] }
Response: APIOrganization

// Get usage analytics
GET /api/v1/organization/usage
Query: { start: string, end: string }
Response: {
  totalRequests: number,
  successRate: number,
  avgResponseTime: number,
  costBreakdown: {...}
}
```

### API Key Management

```typescript
// Create API key
POST /api/v1/keys
Body: { name: string, scopes: string[] }
Response: { key: string, keyInfo: APIKey } // Key shown ONCE

// List API keys
GET /api/v1/keys
Response: Array<APIKey> // key field is redacted

// Revoke API key
DELETE /api/v1/keys/{keyId}
Response: { success: boolean }
```

---

## 🎨 **UI Components**

### 1. Settings → APIs Section

**Location:** UserSettingsModal.tsx (new tab)

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  User Settings                              [X]   │
├────────────────────────────────────────────────────┤
│  [General] [RAG] [APIs] ← New tab                │
├────────────────────────────────────────────────────┤
│                                                    │
│  🔌 Flow Vision API                               │
│                                                    │
│  Enable external access to Flow's document        │
│  processing capabilities.                          │
│                                                    │
│  Status: ⚪ Not Connected                         │
│                                                    │
│  ┌──────────────────────────────────────┐        │
│  │  Get Started                         │        │
│  │                                      │        │
│  │  1. Request invitation from admin    │        │
│  │  2. Install CLI: npm i -g @flow/cli │        │
│  │  3. Login: flow-cli login [code]    │        │
│  │  4. Access developer portal          │        │
│  └──────────────────────────────────────┘        │
│                                                    │
│  [Request API Access]                             │
│                                                    │
└────────────────────────────────────────────────────┘
```

**If Connected:**
```
┌────────────────────────────────────────────────────┐
│  🔌 Flow Vision API                    ✅ Active  │
│                                                    │
│  Organization: Salfa-Corp-API                     │
│  Domain: salfagestion.cl                          │
│  Tier: Pro                                        │
│                                                    │
│  ┌──────────────────────────────────────┐        │
│  │  Usage This Month                    │        │
│  │  • Requests: 1,234 / 10,000          │        │
│  │  • Documents: 456                    │        │
│  │  • Cost: $12.34                      │        │
│  └──────────────────────────────────────┘        │
│                                                    │
│  [View Dashboard] [Manage API Keys]               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 2. SuperAdmin API Management

**Location:** AdminPanel.tsx or new dedicated section

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  API Management                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  📨 Invitations                                   │
│                                                    │
│  [+ Create Invitation]                            │
│                                                    │
│  Active Invitations (3)                           │
│  ┌──────────────────────────────────────┐        │
│  │  Enterprise Beta - Nov 2025          │        │
│  │  Code: FLOW-ENT-BETA-2025            │        │
│  │  Used: 12 / 50                       │        │
│  │  Expires: Dec 31, 2025               │        │
│  │  [View Details] [Deactivate]         │        │
│  └──────────────────────────────────────┘        │
│                                                    │
│  🏢 API Organizations (8)                         │
│                                                    │
│  ┌──────────────────────────────────────┐        │
│  │  Salfa-Corp-API                      │        │
│  │  Domain: salfagestion.cl             │        │
│  │  Tier: Pro | Requests: 1.2K this mo. │        │
│  │  [View Portal] [Analytics]           │        │
│  └──────────────────────────────────────┘        │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 3. Requirement Document Workflow UI

**Component:** RequirementWorkflowModal.tsx

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  Requirement Document Enhancement          [X]    │
├────────────────────────────────────────────────────┤
│  Iteration 1 / 10                                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────┬──────────────┐                 │
│  │   Original   │  AI Enhanced │                 │
│  ├──────────────┼──────────────┤                 │
│  │              │              │                 │
│  │  [Original   │  [Enhanced   │                 │
│  │   document   │   version    │                 │
│  │   content]   │   with AI    │                 │
│  │              │   suggestions]│                 │
│  │              │              │                 │
│  └──────────────┴──────────────┘                 │
│                                                    │
│  🤖 AI Suggestions:                               │
│  • Added technical acceptance criteria            │
│  • Clarified performance requirements             │
│  • Included security considerations               │
│                                                    │
│  💬 Your Feedback:                                │
│  ┌──────────────────────────────────────┐        │
│  │  [Type feedback here...]             │        │
│  │                                      │        │
│  └──────────────────────────────────────┘        │
│                                                    │
│  [✅ Approve] [🔄 Refine] [🆘 Get Help]          │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Get Help Options:**
```
┌────────────────────────────────────┐
│  Get Help                          │
├────────────────────────────────────┤
│                                    │
│  👤 Admin Help                     │
│  Contact SuperAdmin directly       │
│  [Request Admin Help]              │
│                                    │
│  🤖 Ally Support                   │
│  AI assistant for guidance         │
│  [Chat with Ally]                  │
│                                    │
│  🎫 Stella Ticketing               │
│  Create formal support ticket      │
│  [Create Ticket]                   │
│                                    │
└────────────────────────────────────┘
```

---

## 📖 **Developer Documentation Structure**

### API Reference Pages

**1. Getting Started**
```markdown
# Getting Started with Flow Vision API

## Prerequisites
- Business email (no @gmail.com)
- Invitation code from Flow team

## Installation
```bash
npm install -g @flow/cli
```

## Authentication
```bash
# Login with invitation code
flow-cli login FLOW-ENT-BETA-2025

# Browser will open for Google OAuth
# Enter your business email
# CLI will save credentials to ~/.flow/credentials.json
```

## First API Call
```bash
# Using CLI
flow-cli extract document.pdf

# Using cURL
curl -X POST https://api.flow.ai/v1/extract-document \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@document.pdf"
```
```

**2. API Reference**
- Full endpoint documentation
- Request/response schemas
- Code examples in multiple languages
- Error reference guide

**3. Use Cases**
- Document processing pipelines
- Automated data extraction
- Integration patterns
- Performance optimization

---

## 🔄 **Staging-Production Feedback Loop**

### Workflow

```
1. Developer reports issue in Production
   ↓
2. Issue logged in api_requirement_workflows
   └─ Type: 'production_issue'
   └─ Priority: Auto-calculated from impact
   ↓
3. SuperAdmin/Dev team fixes in Staging
   ↓
4. Developer invited to test Staging
   └─ Email: "We've fixed your issue in staging"
   └─ Link: https://staging.flow.ai/?test=issue-xxx
   ↓
5. Developer tests and provides feedback
   ├─ If approved → Schedule production deployment
   └─ If not approved → Iterate (back to step 3)
   ↓
6. Deploy to Production
   ↓
7. Notify developer
   └─ "Your fix is now live in production"
   ↓
8. Close feedback loop
   └─ Update issue status: 'resolved'
```

### Integration Points

**Ally Integration:**
- Proactive suggestions during requirement enhancement
- Answers common API questions
- Provides code examples
- Troubleshoots errors

**Stella Integration:**
- Ticket creation from help requests
- SLA tracking
- Priority management
- Assignment to support team

---

## 🎯 **Business Rules**

### Email Domain Validation

```typescript
// Only business domains allowed
function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1];
  
  // Blacklist consumer domains
  const consumerDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
  ];
  
  return !consumerDomains.includes(domain);
}
```

### Invitation Code Format

```typescript
// Format: FLOW-{AUDIENCE}-{YYYYMM}
// Examples:
FLOW-ENT-202511      // Enterprise, November 2025
FLOW-BETA-202512     // Beta testers, December 2025
FLOW-PARTNER-202601  // Partners, January 2026

// Generated: Secure random suffix
FLOW-ENT-202511-A3F9E2D8
```

### Tier Quotas

```typescript
const TIER_QUOTAS = {
  trial: {
    monthlyRequests: 100,
    dailyRequests: 10,
    concurrentRequests: 1,
    maxFileSize: 20, // MB
    durationDays: 14,
  },
  starter: {
    monthlyRequests: 1000,
    dailyRequests: 100,
    concurrentRequests: 3,
    maxFileSize: 100,
  },
  pro: {
    monthlyRequests: 10000,
    dailyRequests: 1000,
    concurrentRequests: 10,
    maxFileSize: 500,
  },
  enterprise: {
    monthlyRequests: 100000,
    dailyRequests: 10000,
    concurrentRequests: 50,
    maxFileSize: 2000,
  },
};
```

---

## 🔒 **Security Considerations**

### API Key Security

1. **Generation:** Cryptographically secure random (32+ bytes)
2. **Storage:** Bcrypt hashed in database
3. **Display:** Show full key ONCE on creation
4. **Prefix:** Store first 8 chars for identification
5. **Transmission:** HTTPS only

### Rate Limiting

```typescript
// Per API key
- Requests per minute: Based on tier
- Requests per hour: Based on tier
- Concurrent requests: Based on tier

// Per organization
- Monthly quota: Based on tier
- Daily quota: Based on tier

// Global (per IP)
- 100 requests per minute (prevent abuse)
```

### Webhook Security

```typescript
// HMAC signature verification
const signature = crypto
  .createHmac('sha256', organizationSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

headers['X-Flow-Signature'] = `sha256=${signature}`;
```

---

## 📊 **Analytics & Monitoring**

### Developer Dashboard Metrics

```typescript
interface DeveloperMetrics {
  // Usage
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  
  // Documents
  documentsProcessed: number;
  totalPagesExtracted: number;
  
  // Costs
  totalCost: number;
  costByModel: {
    flash: number,
    pro: number,
  };
  
  // Performance
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Errors
  errorRate: number;
  topErrors: Array<{
    code: string,
    count: number,
    message: string,
  }>;
}
```

### SuperAdmin Oversight

```typescript
interface APIPlatformMetrics {
  // Organizations
  totalOrganizations: number;
  activeOrganizations: number;
  organizationsByTier: Record<string, number>;
  
  // Invitations
  totalInvitationsCreated: number;
  redemptionRate: number;
  
  // Usage
  totalAPIRequests: number;
  requestsLast30Days: number;
  totalDocumentsProcessed: number;
  
  // Revenue (future)
  totalRevenue: number;
  revenueByTier: Record<string, number>;
  
  // Health
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}
```

---

## 🚀 **Implementation Phases**

### Phase 1: Core Infrastructure (Week 1)
- [x] Design architecture
- [ ] Create Firestore collections
- [ ] Implement authentication flow
- [ ] Build CLI login command
- [ ] Create API key management

### Phase 2: Vision API (Week 2)
- [ ] Expose existing extract-document as API endpoint
- [ ] Add API key authentication
- [ ] Implement quota checking
- [ ] Add usage logging
- [ ] Webhook support for async

### Phase 3: Developer Portal (Week 3)
- [ ] Build portal landing page
- [ ] API documentation generator
- [ ] Interactive playground
- [ ] Code examples
- [ ] SDK generation

### Phase 4: SuperAdmin Tools (Week 4)
- [ ] Invitation management UI
- [ ] Organization dashboard
- [ ] Usage analytics
- [ ] Monitoring & alerts

### Phase 5: Requirement Workflow (Week 5-6)
- [ ] AI enhancement engine
- [ ] Review interface
- [ ] Iteration tracking
- [ ] Help request integration
- [ ] Feedback loop

### Phase 6: Advanced Features (Week 7+)
- [ ] Billing integration
- [ ] Team management
- [ ] Advanced analytics
- [ ] White-label options

---

## ✅ **Success Criteria**

### MVP (Minimum Viable Product)

- [ ] SuperAdmin can create invitations
- [ ] Developer can login via CLI
- [ ] Developer receives API key
- [ ] Developer can call Vision API
- [ ] Extraction returns results
- [ ] Usage is tracked and displayed
- [ ] Quotas are enforced
- [ ] Documentation is complete

### Production Ready

- [ ] 99.9% uptime
- [ ] <2s average response time
- [ ] Comprehensive error handling
- [ ] Complete audit logging
- [ ] Security hardened
- [ ] Load tested (1000+ req/s)
- [ ] Documentation for all features
- [ ] Support channels established

---

## 📚 **References**

### Internal
- `.cursor/rules/alignment.mdc` - Design principles
- `.cursor/rules/data.mdc` - Database schema patterns
- `.cursor/rules/privacy.mdc` - Security requirements
- `src/pages/api/extract-document.ts` - Vision API implementation

### External
- [Stripe API Design](https://stripe.com/docs/api) - Best-in-class API docs
- [Twilio API](https://www.twilio.com/docs/usage/api) - Developer experience
- [OpenAI API](https://platform.openai.com/docs) - AI API patterns

---

**This architecture is ready for implementation. Each phase builds on the previous, ensuring we ship value incrementally while maintaining backward compatibility.** 🚀

**Next:** Implement Firestore collections and API endpoints.

