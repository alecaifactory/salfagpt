# CLI Bulk Upload System

## Overview

The CLI Bulk Upload System provides a programmatic way to upload and process large volumes of documents into the SalfaGPT platform. Documents are automatically extracted, chunked, embedded, and assigned to agents with full RAG (Retrieval-Augmented Generation) capabilities.

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [System Requirements](#system-requirements)
4. [Agent Requirements](#agent-requirements)
5. [Upload Process](#upload-process)
6. [Usage Methods](#usage-methods)
7. [Configuration](#configuration)
8. [Error Handling](#error-handling)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Bulk Upload Pipeline                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Storage    │    │  Extraction  │    │     RAG      │
│   (GCS)      │    │   (Gemini)   │    │  Processing  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │  Firestore   │
                    │   Storage    │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    Agent     │
                    │  Assignment  │
                    └──────────────┘
```

### Data Flow

1. **File Discovery**: Scan folder for PDF files (recursive)
2. **Upload to GCS**: Store original files in Google Cloud Storage
3. **Content Extraction**: Extract text using Gemini AI
4. **Metadata Storage**: Save document info to Firestore
5. **RAG Processing**: 
   - Chunk text into manageable pieces
   - Generate embeddings for each chunk
   - Store in vector database
6. **Agent Assignment**: Link documents to agent and update context

---

## Prerequisites

### Required Software

- **Node.js**: v18+ (v22.18.0 recommended)
- **npm**: v8+ or **pnpm** (preferred)
- **TypeScript**: Included in project dependencies
- **Google Cloud SDK**: For authentication

### Required Accounts & Access

1. **Google Cloud Platform**
   - Active GCP project
   - Cloud Storage bucket configured
   - Gemini AI API enabled
   - Firestore database active

2. **Authentication**
   - Google Cloud credentials configured
   - Run: `gcloud auth application-default login`

3. **User Account**
   - Valid user hash ID (format: `usr_xxxxxxxxxxxxxxxxxxxxx`)
   - User must exist in Firestore `users` collection
   - User must have proper permissions

### Environment Configuration

Required environment variables in `.env`:

```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_BUCKET=your-bucket-name

# Gemini AI
GEMINI_API_KEY=your-api-key

# Firestore
FIRESTORE_PROJECT_ID=your-project-id

# Optional
ENABLE_ANALYTICS=true
```

---

## System Requirements

### File Requirements

#### Supported Formats
- **PDF** (`.pdf`) - Primary supported format
- Future: Word docs, images, spreadsheets

#### File Constraints
- **Max file size**: 50 MB (recommended), 100 MB (absolute max)
- **Min file size**: 1 KB
- **File naming**: UTF-8 compatible characters
- **Path length**: < 4096 characters

#### Folder Structure
```
upload-queue/
├── organization-name/
│   ├── batch-identifier/
│   │   ├── document1.pdf
│   │   ├── document2.pdf
│   │   └── subfolder/
│   │       └── document3.pdf
```

### Storage Requirements

#### Google Cloud Storage
- **Bucket location**: Same region as Firestore
- **Storage class**: Standard
- **Access control**: Service account access
- **Retention**: Per business requirements

#### Firestore Collections

**`context_sources`**
```typescript
{
  userId: string;              // Hash ID (PRIMARY)
  googleUserId?: string;       // Optional: OAuth numeric ID
  name: string;                // Display name
  type: 'pdf' | 'doc' | ...;
  enabled: boolean;
  status: 'active' | 'inactive';
  addedAt: Timestamp;
  extractedData: string;       // Full extracted text
  originalFileUrl: string;     // GCS path
  tags: string[];              // Searchable tags
  assignedToAgents: string[];  // Agent IDs
  metadata: {
    originalFileName: string;
    originalFileSize: number;
    extractionDate: Timestamp;
    model: string;
    charactersExtracted: number;
    tokensEstimate: number;
    uploadedVia: 'cli' | 'webapp' | 'api';
    uploadedBy: string;        // User email
  };
  ragEnabled: boolean;
  ragMetadata?: {
    chunkCount: number;
    avgChunkSize: number;
    indexedAt: Timestamp;
    embeddingModel: string;
  };
  useRAGMode: boolean;
}
```

**`document_chunks`**
```typescript
{
  sourceId: string;       // Reference to context_sources
  userId: string;         // Hash ID
  agentId: string;        // Agent document ID
  chunkIndex: number;     // Sequential chunk number
  text: string;           // Chunk text content
  embedding: number[];    // 768-dim vector (text-embedding-004)
  tokens: number;         // Token count for this chunk
  metadata: {
    fileName: string;
    chunkSize: number;
    overlap: number;
  };
  createdAt: Timestamp;
}
```

**`conversations` (Agents)**
```typescript
{
  id: string;                      // Document ID (agent unique ID)
  userId: string;                  // Owner hash ID
  isAgent: true;
  
  // Display fields (ALL REQUIRED for UI compatibility)
  name: string;                    // Display name
  agentName: string;               // Agent identifier (must match ID or be unique)
  title: string;                   // Friendly title
  
  // Organization & versioning
  organizationId: string;          // Multi-tenant support
  version: number;                 // Schema version
  source: 'cli' | 'webapp' | 'api'; // Creation source
  
  // Context management
  activeContextSourceIds: string[]; // List of active document IDs
  messageCount: number;             // Total messages
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Configuration
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
```

---

## Agent Requirements

### Critical Agent Fields

For an agent to be **compatible with bulk uploads**, it MUST have all these fields:

```typescript
✅ REQUIRED FIELDS:
├─ id: string                    // Firestore document ID
├─ userId: string                // Owner's hash ID
├─ isAgent: true                 // Flag as agent
├─ agentName: string             // Identifier (search key)
├─ name: string                  // Display name
├─ title: string                 // UI display name
├─ organizationId: string        // Multi-tenant ID
├─ messageCount: number          // Initialize to 0
├─ version: number               // Schema version (1)
├─ source: string                // 'cli' | 'webapp' | 'api'
├─ activeContextSourceIds: []   // Initialize empty
├─ createdAt: Timestamp
└─ updatedAt: Timestamp
```

### Agent Discovery

The system finds agents by **NAME**, not by ID:

```typescript
// ✅ CORRECT: Find agent by display name
const agent = await findAgentByName('TestApiUpload_S001');
// Returns: { id: 'rzEqb17ZwSjk99bZHbTv', name: 'TestApiUpload_S001', ... }

// ❌ WRONG: Assuming name equals ID
const agent = 'TestApiUpload_S001'; // This might not be the document ID!
```

**Important**: 
- Agent **display name** ≠ Agent **document ID**
- Always use the discovery script to find the correct agent ID
- Document assignment uses the **document ID**, not the name

### Creating Compatible Agents

#### Via Script

```bash
npx tsx scripts/create-test-agent.ts
```

The script ensures all required fields are set.

#### Via Code

```typescript
import { firestore } from './src/lib/firestore';

await firestore.collection('conversations').doc(agentId).set({
  id: agentId,
  userId: 'usr_uhwqffaqag1wrryd82tw', // Hash ID
  isAgent: true,
  
  // Display fields
  name: 'My Upload Agent',
  agentName: agentId,  // or unique name
  title: 'My Upload Agent',
  
  // Required metadata
  organizationId: 'your-org.com',
  messageCount: 0,
  version: 1,
  source: 'cli',
  
  // Context
  activeContextSourceIds: [],
  
  // Timestamps
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Agent Validation

Before uploading, validate agent structure:

```bash
npx tsx scripts/compare-agents.ts
```

This will show missing fields and compare with working agents.

---

## Upload Process

### Step-by-Step Workflow

#### 1. Agent Discovery & Validation

```typescript
// Find agent by name
const agent = await findAgentByName('TestApiUpload_S001');
const agentId = agent.id; // e.g., 'rzEqb17ZwSjk99bZHbTv'

// Validate structure
if (!agent.agentName || !agent.organizationId) {
  // Fix missing fields
  await fixAgentStructure(agentId);
}
```

#### 2. File Discovery

```typescript
// Recursively scan folder for PDFs
const files = await findPDFsRecursive('/path/to/folder');
// Returns: ['doc1.pdf', 'subfolder/doc2.pdf', ...]
```

#### 3. Document Processing Loop

For each file:

##### a. Upload to GCS
```typescript
const uploadResult = await uploadFileToGCS(
  filePath,
  userId,      // Hash ID
  agentId,     // Agent document ID
  progressCallback
);
// Result: { gcsPath, fileSize, success }
```

##### b. Extract Content
```typescript
const extraction = await extractDocument(
  filePath,
  'gemini-2.5-flash'
);
// Result: { 
//   extractedText, 
//   charactersExtracted, 
//   inputTokens, 
//   outputTokens, 
//   estimatedCost 
// }
```

##### c. Save to Firestore
```typescript
const docRef = await firestore.collection('context_sources').add({
  userId: hashId,
  googleUserId: googleId, // Optional
  name: fileName,
  type: 'pdf',
  enabled: true,
  status: 'active',
  addedAt: new Date(),
  extractedData: extraction.extractedText,
  originalFileUrl: uploadResult.gcsPath,
  tags: ['bulk-upload-2025-11'],
  assignedToAgents: [agentId], // ✅ Use discovered agent ID
  metadata: { /* ... */ },
  source: 'cli',
});
const sourceId = docRef.id;
```

##### d. RAG Processing
```typescript
const ragResult = await processForRAG(
  sourceId,
  fileName,
  extraction.extractedText,
  userId,
  agentId,
  {
    chunkSize: 1000,
    embeddingModel: 'text-embedding-004',
    uploadedVia: 'cli',
  }
);
// Creates chunks and embeddings in document_chunks collection
```

##### e. Update Document Metadata
```typescript
await firestore.collection('context_sources').doc(sourceId).update({
  ragEnabled: ragResult.success,
  ragMetadata: {
    chunkCount: ragResult.totalChunks,
    avgChunkSize: Math.round(ragResult.totalTokens / ragResult.totalChunks),
    indexedAt: new Date(),
    embeddingModel: 'text-embedding-004',
  },
  useRAGMode: true,
});
```

#### 4. Agent Context Synchronization

After all documents uploaded:

```typescript
// Get all documents assigned to agent
const assignedDocs = await firestore
  .collection('context_sources')
  .where('userId', '==', userId)
  .where('assignedToAgents', 'array-contains', agentId)
  .get();

const docIds = assignedDocs.docs.map(doc => doc.id);

// Update agent's activeContextSourceIds
await firestore.collection('conversations').doc(agentId).update({
  activeContextSourceIds: docIds,
  updatedAt: new Date(),
});
```

**Critical**: This step ensures documents appear in the UI!

---

## Usage Methods

### Method 1: Direct Script Execution (Current)

```bash
npx tsx scripts/test-new-agent-upload.ts
```

**Configuration**: Edit script file directly

**Pros**:
- Full control over process
- Easy debugging
- Immediate execution

**Cons**:
- Requires code changes for different uploads
- No CLI arguments
- Not shareable

### Method 2: CLI Command (Recommended)

```bash
npx tsx cli/commands/upload.ts \
  --agent-name="TestApiUpload_S001" \
  --folder="/path/to/documents" \
  --tag="batch-2025-11" \
  --user="usr_uhwqffaqag1wrryd82tw" \
  --email="user@company.com" \
  --max-files=100
```

**Features**:
- Command-line arguments
- Reusable across uploads
- Progress reporting
- Error recovery

### Method 3: NPX Package (Future)

```bash
npx @salfagpt/bulk-upload \
  --agent="My Agent Name" \
  --folder="./documents" \
  --config="./upload-config.json"
```

**Benefits**:
- No local installation
- Always latest version
- Simplified usage

### Method 4: NPM Global Install (Future)

```bash
npm install -g @salfagpt/bulk-upload

salfagpt-upload \
  --agent="My Agent" \
  --folder="./docs"
```

### Method 5: REST API (Future)

```bash
curl -X POST https://api.salfagpt.com/v1/bulk-upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "My Agent",
    "files": ["https://example.com/doc1.pdf"],
    "tags": ["api-upload"]
  }'
```

### Method 6: MCP Server (Future)

Model Context Protocol integration for AI assistants:

```json
{
  "tool": "bulk_upload_documents",
  "arguments": {
    "agent_name": "My Agent",
    "folder_path": "/documents",
    "options": {
      "tags": ["mcp-upload"],
      "max_files": 50
    }
  }
}
```

---

## Configuration

### Upload Configuration Object

```typescript
interface UploadConfig {
  // Agent identification
  agentName: string;           // Display name to search for
  agentId?: string;            // Optional: If known, skip discovery
  
  // User identification
  userId: string;              // Hash ID (PRIMARY)
  userEmail: string;           // For audit logs
  googleUserId?: string;       // Optional: OAuth numeric ID
  
  // Source files
  folderPath: string;          // Root folder to scan
  filePattern?: RegExp;        // File filter (default: *.pdf)
  recursive?: boolean;         // Scan subfolders (default: true)
  maxFiles?: number;           // Limit files processed
  
  // Processing options
  tag: string;                 // Tag for batch identification
  model?: string;              // Gemini model (default: gemini-2.5-flash)
  chunkSize?: number;          // RAG chunk size (default: 1000)
  embeddingModel?: string;     // Embedding model (default: text-embedding-004)
  
  // Behavior
  skipExisting?: boolean;      // Skip if file already uploaded
  continueOnError?: boolean;   // Continue after errors
  dryRun?: boolean;            // Preview without uploading
  verbose?: boolean;           // Detailed logging
  
  // Performance
  concurrency?: number;        // Parallel uploads (default: 1)
  retryAttempts?: number;      // Retry failed uploads
  retryDelay?: number;         // Delay between retries (ms)
}
```

### Example Configurations

#### Minimal Configuration
```typescript
{
  agentName: 'My Agent',
  userId: 'usr_xxxxxxxxxxxxxxxxxxxxx',
  userEmail: 'user@company.com',
  folderPath: '/path/to/documents',
  tag: 'upload-2025-11-19'
}
```

#### Full Configuration
```typescript
{
  agentName: 'TestApiUpload_S001',
  userId: 'usr_uhwqffaqag1wrryd82tw',
  userEmail: 'alec@getaifactory.com',
  googleUserId: '114671162830729001607',
  folderPath: '/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118',
  filePattern: /\.pdf$/i,
  recursive: true,
  maxFiles: 100,
  tag: 'S001-20251118-bulk',
  model: 'gemini-2.5-flash',
  chunkSize: 1000,
  embeddingModel: 'text-embedding-004',
  skipExisting: true,
  continueOnError: true,
  dryRun: false,
  verbose: true,
  concurrency: 3,
  retryAttempts: 3,
  retryDelay: 5000
}
```

---

## Error Handling

### Common Errors

#### 1. Agent Not Found

**Error**: `Agent "${name}" not found`

**Solution**:
```bash
# List all agents
npx tsx scripts/list-all-user-agents.ts

# Create agent if needed
npx tsx scripts/create-test-agent.ts
```

#### 2. Missing Agent Fields

**Error**: `Agent missing critical fields: agentName, organizationId`

**Solution**:
```bash
# Fix agent structure
npx tsx scripts/fix-test-agent-structure.ts
```

#### 3. Documents Not Appearing in UI

**Error**: Documents uploaded but UI shows 0

**Cause**: `activeContextSourceIds` out of sync

**Solution**:
```bash
# Sync agent context
npx tsx scripts/fix-agent-context.ts AgentID
```

#### 4. Extraction Failed

**Error**: `Extraction failed: No text extracted`

**Causes**:
- Scanned PDF (image-only)
- Corrupted file
- Unsupported PDF version
- File too large

**Solutions**:
- Use OCR-enabled extraction
- Validate PDF integrity
- Split large PDFs
- Check file format

#### 5. RAG Processing Failed

**Error**: `RAG processing failed: No chunks created`

**Cause**: Empty or very short text

**Solution**:
- Check extraction output
- Verify minimum text length
- Review chunk size settings

### Error Recovery

#### Automatic Retry

```typescript
const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
  try {
    await uploadDocument(file);
    break; // Success
  } catch (error) {
    attempt++;
    if (attempt === maxRetries) {
      throw error; // Give up
    }
    await sleep(5000 * attempt); // Exponential backoff
  }
}
```

#### Partial Upload Resume

```typescript
// Track uploaded files
const completedFiles = new Set();

// On resume, filter out completed
const remainingFiles = allFiles.filter(f => !completedFiles.has(f));
```

---

## Monitoring & Analytics

### Analytics Events Tracked

#### Upload Session
```typescript
{
  eventType: 'upload_session',
  sessionId: string,
  userId: string,
  agentId: string,
  filesCount: number,
  startedAt: Timestamp,
  endedAt?: Timestamp,
  filesSucceeded: number,
  filesFailed: number,
  totalDuration: number,
  totalCost: number,
  success: boolean
}
```

#### File Upload
```typescript
{
  eventType: 'file_upload',
  sessionId: string,
  fileName: string,
  fileSize: number,
  agentId: string,
  success: boolean,
  duration: number,
  gcsPath?: string,
  errorMessage?: string
}
```

#### File Extraction
```typescript
{
  eventType: 'file_extraction',
  sessionId: string,
  fileName: string,
  agentId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  charactersExtracted: number,
  estimatedCost: number,
  success: boolean,
  duration: number
}
```

### Viewing Analytics

```bash
# Query Firestore collection: cli_analytics
# Filter by: sessionId, userId, agentId, eventType
```

### Performance Metrics

Track these KPIs:
- **Upload speed**: MB/s per file
- **Extraction time**: Seconds per page
- **RAG processing**: Chunks per second
- **Total cost**: $ per document
- **Success rate**: % of completed uploads
- **Error rate**: % of failed uploads

---

## Best Practices

### File Organization

✅ **DO**:
- Use consistent folder structure
- Name files descriptively
- Group related documents
- Use subfolders for categories
- Keep file names under 255 characters

❌ **DON'T**:
- Mix unrelated documents
- Use special characters in names
- Create overly deep hierarchies (>10 levels)
- Store non-document files in upload folders

### Batch Size

| Documents | Recommendation |
|-----------|----------------|
| 1-10 | Single batch, synchronous |
| 10-100 | Single batch, progress tracking |
| 100-1000 | Multiple batches, checkpoint saves |
| 1000+ | Distributed processing, queue system |

### Tagging Strategy

Use hierarchical tags:
```
organization-project-date-batch
↓
salfacorp-S001-20251118-batch01
```

Benefits:
- Easy filtering
- Batch identification
- Rollback capability
- Audit trails

### Cost Optimization

#### Gemini AI Costs (estimated)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| gemini-2.5-flash | $0.075 | $0.30 |
| gemini-1.5-flash | $0.075 | $0.30 |
| gemini-1.5-pro | $1.25 | $5.00 |

#### Embedding Costs

| Model | Cost (per 1M tokens) |
|-------|---------------------|
| text-embedding-004 | $0.00025 |

#### Typical Document Costs

- **Small PDF** (1-5 pages): ~$0.001 - $0.005
- **Medium PDF** (10-50 pages): ~$0.01 - $0.05
- **Large PDF** (100+ pages): ~$0.10 - $0.50

**Tips to reduce costs**:
- Use `gemini-2.5-flash` instead of `pro`
- Batch process during off-peak hours
- Skip re-extraction for unchanged files
- Cache extraction results

### Security

✅ **Required**:
- Use service account authentication
- Rotate API keys regularly
- Enable audit logging
- Restrict GCS bucket access
- Validate user permissions

❌ **Never**:
- Commit API keys to git
- Share service account keys
- Use admin credentials for uploads
- Store sensitive data in tags
- Bypass authentication

---

## Troubleshooting

### Diagnostic Scripts

#### 1. Check Agent Structure
```bash
npx tsx scripts/compare-agents.ts
```

#### 2. Verify Agent Documents
```bash
npx tsx scripts/check-agent-ids.ts
```

#### 3. List All Agents
```bash
npx tsx scripts/list-all-user-agents.ts
```

#### 4. Check Document Assignments
```bash
npx tsx scripts/check-document-assignments.ts
```

#### 5. Verify Embeddings
```bash
npx tsx scripts/check-embeddings-simple.ts
```

### Debug Checklist

- [ ] Agent exists in Firestore
- [ ] Agent has all required fields
- [ ] User hash ID is correct
- [ ] Files are valid PDFs
- [ ] Folder path is correct
- [ ] GCS bucket is accessible
- [ ] Gemini API key is valid
- [ ] Firestore has write permissions
- [ ] Documents assigned to correct agent ID
- [ ] activeContextSourceIds is synced

### Getting Help

1. **Check logs**: Review console output for errors
2. **Run diagnostics**: Use provided diagnostic scripts
3. **Verify data**: Check Firestore console
4. **Test incrementally**: Upload 1 file first
5. **Check permissions**: Ensure proper access

---

## Appendix

### Related Documentation

- [Agent vs Conversation Architecture](./AGENT_VS_CONVERSATION_ARCHITECTURE_2025-10-21.md)
- [Context Management System](./CONTEXT_MANAGEMENT.md)
- [RAG Implementation](./RAG_PIPELINE.md)
- [API Documentation](./API.md)

### Script Reference

| Script | Purpose |
|--------|---------|
| `test-new-agent-upload.ts` | Test upload to new agent |
| `fix-agent-name-and-reassign.ts` | Fix agent and reassign docs |
| `reassign-documents-by-agent-name.ts` | Bulk reassign by name |
| `compare-agents.ts` | Compare agent structures |
| `fix-agent-context.ts` | Sync activeContextSourceIds |
| `list-all-user-agents.ts` | List all user agents |

### Firestore Indexes Required

```javascript
// context_sources
- userId ASC, assignedToAgents ARRAY, addedAt DESC
- userId ASC, tags ARRAY, addedAt DESC
- metadata.uploadedVia ASC, userId ASC, addedAt DESC

// document_chunks
- sourceId ASC, chunkIndex ASC
- userId ASC, agentId ASC, createdAt DESC

// conversations
- userId ASC, isAgent ASC, createdAt DESC
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-19 | Initial documentation |
| 1.1.0 | TBD | Add API support |
| 1.2.0 | TBD | Add MCP server integration |
| 2.0.0 | TBD | Add NPX package |

---

**Last Updated**: 2025-11-19  
**Maintained By**: AI Factory LLC  
**Status**: Production Ready ✅

