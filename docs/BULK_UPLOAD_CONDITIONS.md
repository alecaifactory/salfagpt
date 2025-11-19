# Bulk Upload System - Required Conditions Checklist

## Quick Reference: Conditions Required for Successful Upload

This document provides a concise checklist of ALL conditions that must be met for bulk uploads to work correctly.

---

## ✅ System Prerequisites

### 1. Software Installation
- [ ] Node.js v18+ installed
- [ ] npm or pnpm available
- [ ] TypeScript in project dependencies
- [ ] Google Cloud SDK installed

### 2. Authentication & Credentials
- [ ] Google Cloud authenticated: `gcloud auth application-default login`
- [ ] Valid Gemini API key in `.env`
- [ ] Service account with proper permissions
- [ ] Firestore access configured

### 3. Environment Setup
```bash
# Required .env variables
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_BUCKET=your-bucket-name
GEMINI_API_KEY=your-api-key
FIRESTORE_PROJECT_ID=your-project-id
```

---

## 📋 Agent Requirements (CRITICAL)

### Agent Must Exist
```bash
# Verify agent exists
npx tsx scripts/list-all-user-agents.ts
```

### Agent Must Have ALL These Fields
```typescript
{
  // ✅ MANDATORY - Will break without these
  id: string,                    // Firestore document ID
  userId: string,                // Owner's hash ID
  isAgent: true,
  agentName: string,             // Searchable identifier
  name: string,                  // Display name
  title: string,                 // UI-friendly name
  organizationId: string,        // Multi-tenant ID
  messageCount: number,          // Initialize to 0
  version: number,               // Set to 1
  source: 'cli' | 'webapp',      // Creation method
  activeContextSourceIds: [],    // Initialize empty array
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**If ANY field is missing**: Documents will upload but NOT appear in UI!

### Create Valid Agent
```bash
# Create new agent with all fields
npx tsx scripts/create-test-agent.ts

# Or fix existing agent
npx tsx scripts/fix-test-agent-structure.ts
```

---

## 👤 User Requirements

### User Identification (CRITICAL)

**Primary ID**: Hash ID (format: `usr_xxxxxxxxxxxxxxxxxxxxx`)

```bash
# Get your hash ID
npx tsx scripts/get-hash-id.ts user@company.com
```

**Required**:
- [ ] User exists in Firestore `users` collection
- [ ] Hash ID is known and valid
- [ ] User has proper permissions for target organization

**Optional**:
- Google OAuth numeric ID (for legacy compatibility)

### User Document Structure
```typescript
{
  id: string,              // Hash ID (PRIMARY)
  email: string,
  googleUserId?: string,   // OAuth numeric ID (optional)
  organizationId: string,
  // ... other fields
}
```

---

## 📁 File Requirements

### Supported File Types
- [ ] PDF files (`.pdf`) - Primary supported format
- [ ] Files must be readable/not corrupted
- [ ] Files must contain extractable content (not just images)

### File Constraints
- [ ] Max file size: 50 MB (recommended), 100 MB (absolute max)
- [ ] Min file size: 1 KB
- [ ] File names: UTF-8 compatible, < 255 characters
- [ ] No special characters that break file systems: `\ / : * ? " < > |`

### Folder Structure
```
✅ GOOD:
upload-queue/
├── organization/
│   └── batch-20251119/
│       ├── doc1.pdf
│       └── category/
│           └── doc2.pdf

❌ BAD:
random-folder/
├── mixed-files.zip
├── corrupted.pdf
└── image.jpg  # Not supported yet
```

### Folder Path
- [ ] Folder exists and is readable
- [ ] Full path is valid (< 4096 characters)
- [ ] No permission issues
- [ ] Contains at least 1 PDF file

---

## 🗄️ Firestore Requirements

### Required Collections

**`context_sources`**
- [ ] Collection exists
- [ ] Write permissions granted
- [ ] Indexes created (see below)

**`document_chunks`**
- [ ] Collection exists
- [ ] Write permissions granted
- [ ] Indexes created (see below)

**`conversations`**
- [ ] Collection exists (for agents)
- [ ] Agent document exists
- [ ] Agent has all required fields

**`users`**
- [ ] Collection exists
- [ ] User document exists with hash ID

### Required Firestore Indexes

```javascript
// context_sources
collection: "context_sources"
fields:
  - userId: ASC
  - assignedToAgents: ARRAY
  - addedAt: DESC

collection: "context_sources"
fields:
  - userId: ASC
  - tags: ARRAY
  - addedAt: DESC

// document_chunks
collection: "document_chunks"
fields:
  - sourceId: ASC
  - chunkIndex: ASC

collection: "document_chunks"
fields:
  - userId: ASC
  - agentId: ASC
  - createdAt: DESC

// conversations (agents)
collection: "conversations"
fields:
  - userId: ASC
  - isAgent: ASC
  - createdAt: DESC
```

**Create indexes**:
- Firestore will show error with index creation link on first query
- Follow link to auto-create index
- Wait 5-10 minutes for index to build

---

## 🔧 Upload Configuration

### Minimum Required Configuration
```typescript
{
  agentName: string,     // Display name to search for
  userId: string,        // Hash ID (PRIMARY)
  userEmail: string,     // For audit logs
  folderPath: string,    // Absolute path to folder
  tag: string            // Unique batch identifier
}
```

### Recommended Configuration
```typescript
{
  agentName: 'TestApiUpload_S001',
  userId: 'usr_uhwqffaqag1wrryd82tw',
  userEmail: 'alec@getaifactory.com',
  folderPath: '/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118',
  tag: 'S001-20251118-batch01',
  maxFiles: 100,         // Limit for testing
  verbose: true          // Detailed logs
}
```

---

## 🔍 Pre-Upload Validation Checklist

Run these checks BEFORE starting upload:

### 1. Agent Validation
```bash
# List all agents
npx tsx scripts/list-all-user-agents.ts

# Check specific agent structure
npx tsx scripts/compare-agents.ts

# Fix agent if needed
npx tsx scripts/fix-test-agent-structure.ts
```

### 2. User Validation
```bash
# Get hash ID
npx tsx scripts/get-hash-id.ts your-email@company.com

# Verify user exists in Firestore console
```

### 3. File Validation
```bash
# Check folder exists
ls -la /path/to/upload-queue/

# Count PDFs
find /path/to/upload-queue/ -name "*.pdf" | wc -l

# Check file sizes
find /path/to/upload-queue/ -name "*.pdf" -exec ls -lh {} \;
```

### 4. Environment Validation
```bash
# Check .env variables
cat .env | grep GOOGLE_CLOUD

# Test GCS access
gsutil ls gs://your-bucket-name/

# Test Firestore access (run any script)
npx tsx scripts/list-all-user-agents.ts
```

---

## 🚀 Upload Execution

### Step 1: Prepare
```bash
cd /Users/alec/salfagpt
```

### Step 2: Run Upload
```bash
# Test upload (2 files)
npx tsx scripts/test-new-agent-upload.ts

# Or full bulk upload
npx tsx cli/commands/upload.ts \
  --agent-name="YourAgentName" \
  --folder="/path/to/documents" \
  --tag="batch-2025-11-19" \
  --user="usr_xxxxxxxxxxxxxxxxxxxxx" \
  --email="your-email@company.com"
```

### Step 3: Monitor Progress
- Watch console output
- Check for errors
- Note uploaded document IDs
- Track costs

---

## ✅ Post-Upload Verification

### 1. Check Documents in Firestore
```bash
# Open Firestore console
# Navigate to context_sources collection
# Filter by: tags = your-tag
# Verify: userId matches, assignedToAgents includes agent ID
```

### 2. Verify Agent Context
```bash
# Check activeContextSourceIds sync
npx tsx scripts/verify-agent-sync.ts

# If mismatch, fix it
npx tsx scripts/fix-agent-context.ts
```

### 3. Test RAG Indexing
```bash
# Check embeddings exist
npx tsx scripts/check-embeddings-simple.ts

# Should show chunks in document_chunks collection
```

### 4. Verify UI Visibility
- [ ] Refresh browser
- [ ] Open agent settings
- [ ] Check document count matches
- [ ] Documents are listed
- [ ] Documents are searchable

### 5. Test RAG Functionality
- [ ] Open chat with agent
- [ ] Ask question about uploaded content
- [ ] Verify agent uses document context
- [ ] Check response quality

---

## 🐛 Common Issues & Fixes

### Issue 1: Agent Not Found
```bash
# Symptom: "Agent 'X' not found"
# Fix: Create or check agent name
npx tsx scripts/list-all-user-agents.ts
npx tsx scripts/create-test-agent.ts
```

### Issue 2: Documents Don't Appear in UI
```bash
# Symptom: Upload succeeds but UI shows 0 documents
# Cause: activeContextSourceIds not synced
# Fix:
npx tsx scripts/verify-agent-sync.ts
npx tsx scripts/fix-agent-context.ts
```

### Issue 3: Wrong User ID
```bash
# Symptom: Documents uploaded but not found by API
# Cause: Used Google ID instead of hash ID
# Fix: Re-upload with correct hash ID
npx tsx scripts/get-hash-id.ts your-email@company.com
```

### Issue 4: Missing Agent Fields
```bash
# Symptom: Documents upload but don't appear
# Cause: Agent missing agentName, organizationId, etc.
# Fix:
npx tsx scripts/fix-test-agent-structure.ts
```

### Issue 5: Extraction Failed
```bash
# Symptom: "0 characters extracted"
# Causes:
#   - Scanned PDF (image-only)
#   - Corrupted file
#   - Unsupported format
# Fix: Manually check PDF, use OCR if needed
```

---

## 📊 Success Criteria

Upload is successful when ALL these conditions are true:

- [ ] All files uploaded to Google Cloud Storage
- [ ] All files extracted (characters > 0)
- [ ] All documents saved to `context_sources`
- [ ] All documents have `ragEnabled: true`
- [ ] All chunks created in `document_chunks`
- [ ] All embeddings generated (768-dim vectors)
- [ ] All documents assigned to correct agent ID
- [ ] Agent's `activeContextSourceIds` includes all document IDs
- [ ] Documents appear in UI when agent settings opened
- [ ] Documents are searchable in chat
- [ ] RAG responses use document content

---

## 🔄 Troubleshooting Flow

```
Upload Failed?
├─ Agent exists? ──NO──> Create agent
│  └─ YES
├─ Agent has all fields? ──NO──> Fix agent structure
│  └─ YES
├─ Files uploaded to GCS? ──NO──> Check GCS permissions
│  └─ YES
├─ Content extracted? ──NO──> Check file format, use OCR
│  └─ YES
├─ Documents in Firestore? ──NO──> Check Firestore permissions
│  └─ YES
├─ RAG chunks created? ──NO──> Re-run RAG processing
│  └─ YES
├─ Assigned to agent? ──NO──> Check agent ID, reassign
│  └─ YES
├─ activeContextSourceIds synced? ──NO──> Run fix-agent-context.ts
│  └─ YES
└─ Documents visible in UI? ──YES──> SUCCESS! ✅
   └─ NO ──> Clear browser cache, refresh
```

---

## 📞 Support Resources

### Diagnostic Scripts Location
```
/Users/alec/salfagpt/scripts/
├── test-new-agent-upload.ts          # Test upload
├── create-test-agent.ts              # Create agent
├── fix-test-agent-structure.ts       # Fix agent fields
├── list-all-user-agents.ts           # List agents
├── compare-agents.ts                 # Compare structures
├── verify-agent-sync.ts              # Check sync
├── fix-agent-context.ts              # Sync activeContextSourceIds
├── check-embeddings-simple.ts        # Verify RAG
├── get-hash-id.ts                    # Get user hash ID
└── reassign-documents-by-agent-name.ts # Bulk reassign
```

### Documentation References
- Main guide: `/docs/CLI_BULK_UPLOAD_SYSTEM.md`
- Interactive guide: `/docs/CLI_BULK_UPLOAD_SYSTEM.mdc`
- This checklist: `/docs/BULK_UPLOAD_CONDITIONS.md`
- Agent architecture: `/docs/AGENT_VS_CONVERSATION_ARCHITECTURE_2025-10-21.md`

---

## 🎯 Quick Start for New Upload

```bash
# 1. Get your hash ID
npx tsx scripts/get-hash-id.ts your-email@company.com

# 2. Create or verify agent
npx tsx scripts/create-test-agent.ts

# 3. Run test upload (2 files)
npx tsx scripts/test-new-agent-upload.ts

# 4. If successful, run bulk upload
npx tsx cli/commands/upload.ts \
  --agent-name="YourAgent" \
  --folder="/path/to/docs" \
  --tag="batch-$(date +%Y%m%d)" \
  --user="usr_xxxxx" \
  --email="your@email.com"

# 5. Verify in browser
# Open agent settings -> Should see documents
```

---

**Last Updated**: 2025-11-19  
**Version**: 1.0.0  
**Status**: Production Ready ✅

