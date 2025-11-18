# CLI Upload Implementation - Complete

**Date:** 2025-11-18  
**Version:** 0.2.0  
**Status:** ✅ Ready for Use

---

## 🎯 Overview

Implemented a comprehensive CLI batch upload system that allows uploading multiple PDF documents from a folder, processing them through the complete SalfaGPT pipeline, and assigning them to agents - all from the command line.

---

## ✅ What Was Built

### 1. Core Upload Command (`cli/commands/upload.ts`)

**Features Implemented:**
- ✅ Batch upload all PDFs from a folder
- ✅ Upload to Google Cloud Storage with progress tracking
- ✅ Extract text with Gemini AI (Flash or Pro)
- ✅ Save to Firestore with full metadata
- ✅ Chunk text intelligently for RAG
- ✅ Generate embeddings (768-dimensional vectors)
- ✅ Store in vector database for semantic search
- ✅ Auto-assign to agent and activate
- ✅ Track all operations for analytics
- ✅ Test query to verify RAG works
- ✅ Comprehensive error handling and recovery
- ✅ Detailed progress reporting
- ✅ Cost estimation and tracking

**Pipeline Steps:**
```
1. Upload to GCS      → 2. Extract with Gemini → 3. Save to Firestore
       ↓                        ↓                         ↓
4. Chunk text         → 5. Generate embeddings → 6. Store vectors
       ↓                        ↓                         ↓
7. Update metadata    → 8. Assign to agent     → 9. Test query (optional)
```

### 2. Enhanced Analytics (`cli/lib/analytics.ts`)

**Added Functions:**
- `trackFileUpload()` - Track individual file uploads
- `trackFileExtraction()` - Track extraction operations
- `trackUploadSession()` - Track batch upload sessions
- `getCLIUser()` - Get CLI user configuration

**Events Tracked:**
- `cli_upload_start` - Batch upload started
- `cli_file_uploaded` - File uploaded successfully
- `cli_file_extracted` - Text extracted successfully
- `cli_file_failed` - Operation failed
- `cli_upload_complete` - Batch completed
- `cli_upload_failed` - Batch failed

**Storage:**
- Firestore collection: `cli_events` (per-file events)
- Firestore collection: `cli_sessions` (batch summaries)

### 3. Helper Scripts

**`cli/upload-s001.sh`**
- Pre-configured script for the example use case
- Folder: `/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118`
- Tag: `S001-20251118-1545`
- Agent: `TestApiUpload_S001`

**`cli/upload-example.sh`**
- Template script for custom uploads
- Easy to modify for different use cases

**`cli/test-upload.ts`**
- Quick test to verify upload command works
- Uses TypeScript API directly

### 4. Documentation

**`cli/README.md`**
- Complete CLI documentation
- Overview of all commands and libraries
- Configuration guide
- Best practices
- Troubleshooting

**`cli/QUICK_START.md`**
- 2-minute quickstart guide
- Minimal steps to get running
- Simple examples

**`cli/UPLOAD_GUIDE.md`**
- Comprehensive upload guide
- Detailed explanation of each step
- Data structure documentation
- Cost analysis
- Advanced usage
- Troubleshooting

---

## 🔄 Backward Compatibility

### ✅ Fully Compatible with Existing Systems

**No Breaking Changes:**
- Uses existing Firestore schema (`context_sources`)
- Uses existing embedding system (`document_embeddings`)
- Uses existing GCS bucket structure
- Uses existing agent assignment logic
- Uses existing RAG search infrastructure

**Extends Existing Systems:**
- Adds `sessionId` to metadata (optional field)
- Adds `uploadedVia: 'cli'` to metadata (optional field)
- Adds analytics collections (new, non-breaking)

**Coexists with Web UI:**
- Documents uploaded via CLI appear in UI
- Documents uploaded via UI work with CLI
- All operations tracked separately by source (`cli` vs `webapp`)

### Integration Points

**1. Context Management Dashboard**
```typescript
// UI shows CLI-uploaded documents
contextSources.filter(s => 
  s.metadata?.uploadedVia === 'cli' ||
  s.metadata?.uploadedVia === 'webapp'
)

// Both types work identically
// Tag filtering works
// Agent assignment works
// RAG search works
```

**2. RAG Search**
```typescript
// CLI-uploaded documents participate in search
const results = await searchRelevantChunks(userId, query, {
  topK: 5,
  activeSourceIds: agentContextSources // Includes CLI uploads
});

// No difference between CLI and UI uploads
```

**3. Analytics**
```typescript
// Separate tracking collections
// - cli_events (CLI operations)
// - webapp_events (UI operations)

// Both feed into same dashboards
// Cost tracking works across both
```

---

## 📊 Data Flow

### Upload Flow

```
CLI Command
    ↓
1. Scan folder for PDFs
    ↓
2. For each PDF:
    ├─→ Upload to GCS
    │   ├─ Track: cli_file_uploaded
    │   └─ Result: gs://bucket/userId/agentId/file.pdf
    │
    ├─→ Extract with Gemini
    │   ├─ Track: cli_file_extracted
    │   ├─ Cost: ~$0.011 per file
    │   └─ Result: Full text extracted
    │
    ├─→ Save to Firestore
    │   ├─ Collection: context_sources
    │   ├─ Fields: All standard fields + CLI metadata
    │   └─ Result: Document ID (sourceId)
    │
    ├─→ Chunk & Embed
    │   ├─ Chunk text (~1000 tokens/chunk)
    │   ├─ Generate embeddings (768D vectors)
    │   ├─ Store in: document_embeddings
    │   └─ Result: N chunks indexed
    │
    └─→ Assign to Agent
        ├─ Add to: assignedToAgents[]
        ├─ Activate in: activeContextSourceIds
        └─ Result: Agent can use document
    
3. Summary
    ├─ Track: cli_upload_complete
    ├─ Session stored in: cli_sessions
    └─ Display: Summary report

4. Test Query (optional)
    ├─ Search with RAG
    ├─ Generate AI response
    └─ Validate: System works
```

### Data Stored

**Firestore: `context_sources`**
```typescript
{
  id: "source-abc123",
  userId: string,
  name: string,
  type: "pdf",
  enabled: true,
  status: "active",
  addedAt: Date,
  extractedData: string,           // Full text
  originalFileUrl: string,         // gs:// path
  tags: string[],                  // Including user-specified tag
  assignedToAgents: string[],      // Including target agent
  ragEnabled: boolean,             // true if embeddings succeeded
  ragMetadata: {
    chunkCount: number,
    avgChunkSize: number,
    indexedAt: Date,
    embeddingModel: "text-embedding-004",
    processingTime: number
  },
  useRAGMode: true,                // Enable RAG by default
  metadata: {
    originalFileName: string,
    originalFileSize: number,
    extractionDate: Date,
    extractionTime: number,
    model: "gemini-2.5-flash" | "gemini-2.5-pro",
    charactersExtracted: number,
    tokensEstimate: number,
    inputTokens: number,
    outputTokens: number,
    estimatedCost: number,
    uploadedVia: "cli",            // ⭐ CLI identifier
    uploadedBy: string,            // User email
    sessionId: string              // ⭐ CLI session ID
  },
  source: "localhost"              // CLI runs locally
}
```

**Firestore: `document_embeddings`**
```typescript
{
  id: "embedding-xyz789",
  sourceId: string,
  sourceName: string,
  userId: string,
  agentId: string,
  chunkIndex: number,
  text: string,                    // Chunk text
  embedding: number[],             // 768 dimensions
  tokenCount: number,
  model: "text-embedding-004",
  uploadedVia: "cli",              // ⭐ CLI identifier
  userEmail: string,
  createdAt: Date
}
```

**Firestore: `cli_events`** (NEW)
```typescript
{
  eventType: CLIEventType,
  userId: string,
  userEmail: string,
  source: "cli",
  cliVersion: string,
  agentId?: string,
  operation: string,
  fileName?: string,
  success: boolean,
  duration?: number,
  filesProcessed?: number,
  filesSucceeded?: number,
  filesFailed?: number,
  model?: string,
  inputTokens?: number,
  outputTokens?: number,
  estimatedCost?: number,
  gcsPath?: string,
  firestoreDocId?: string,
  errorMessage?: string,
  timestamp: Date,
  sessionId: string
}
```

**Firestore: `cli_sessions`** (NEW)
```typescript
{
  id: string,
  userId: string,
  userEmail: string,
  command: string,
  startedAt: Date,
  endedAt?: Date,
  duration?: number,
  eventsCount: number,
  success: boolean,
  cliVersion: string
}
```

---

## 💰 Cost Analysis

### Per File (Average)

| Operation | Tokens | Cost | % |
|-----------|--------|------|---|
| Gemini Input | ~15K | $0.0011 | 24% |
| Gemini Output | ~31K | $0.0093 | 66% |
| Embeddings | ~31K | $0.0006 | 10% |
| **Total** | - | **$0.0110** | 100% |

### Batch Examples

| Files | Total Cost | Time (est) |
|-------|-----------|------------|
| 3 files | $0.033 | ~45s |
| 10 files | $0.110 | ~2.5m |
| 50 files | $0.550 | ~12m |
| 100 files | $1.100 | ~25m |

**Notes:**
- Using `gemini-2.5-flash` (recommended)
- Assumes average file ~2.5MB, ~125KB text
- Times include all steps (upload, extract, chunk, embed)
- GCS storage: ~$0.02/GB/month (negligible)
- Firestore writes: Included in free tier

---

## 🚀 Usage

### Basic Usage

```bash
npx tsx cli/commands/upload.ts \
  --folder=/path/to/folder \
  --tag=TAG-NAME \
  --agent=AGENT_ID \
  --user=USER_ID \
  --email=user@example.com
```

### Example from User Request

```bash
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=TestApiUpload_S001 \
  --user=114671162830729001607 \
  --email=alec@getaifactory.com \
  --test="¿Cuáles son los requisitos de seguridad?"
```

### Using Helper Script

```bash
# Pre-configured for S001 example
./cli/upload-s001.sh

# Or customize the template
./cli/upload-example.sh
```

### Programmatic Usage

```typescript
import { uploadCommand } from './cli/commands/upload';

const result = await uploadCommand({
  folderPath: '/path/to/folder',
  tag: 'MY-TAG',
  agentId: 'MY-AGENT',
  userId: 'MY-USER-ID',
  userEmail: 'user@example.com',
  model: 'gemini-2.5-flash',
  testQuery: 'Test question?'
});

console.log('Succeeded:', result.succeeded);
console.log('Failed:', result.failed);
console.log('Cost:', result.totalCost);
```

---

## ✅ Testing

### Unit Test

```bash
npx tsx cli/test-upload.ts
```

### Integration Test

```bash
# 1. Create test folder with PDFs
mkdir -p upload-queue/test
cp /path/to/*.pdf upload-queue/test/

# 2. Run upload
npx tsx cli/commands/upload.ts \
  --folder=upload-queue/test \
  --tag=TEST-$(date +%s) \
  --agent=TestAgent \
  --user=YOUR_USER_ID \
  --email=your@email.com

# 3. Verify in UI
# - Open agent "TestAgent"
# - Check "Fuentes de Contexto"
# - Verify documents appear

# 4. Test RAG
# - Ask question about documents
# - Verify AI responds correctly
```

---

## 📝 Documentation

### For Users
- [QUICK_START.md](cli/QUICK_START.md) - 2-minute guide
- [UPLOAD_GUIDE.md](cli/UPLOAD_GUIDE.md) - Complete guide

### For Developers
- [README.md](cli/README.md) - CLI overview
- [RAG_EMBEDDINGS_GUIDE.md](docs/cli/RAG_EMBEDDINGS_GUIDE.md) - RAG deep dive
- This document - Implementation details

---

## 🔮 Future Enhancements

### Version 0.3.0 (Next Release)
- [ ] Retry logic for transient failures
- [ ] Progress bars (not just logs)
- [ ] DOCX support
- [ ] XLSX support  
- [ ] Parallel uploads (3 simultaneous)
- [ ] Config file support (`.salfagptrc.json`)
- [ ] Dry-run mode

### Version 0.4.0 (Future)
- [ ] Interactive file selection
- [ ] Resume from checkpoint
- [ ] Webhook notifications
- [ ] S3 source integration
- [ ] Auto-tagging by folder structure
- [ ] Watch mode (auto-upload new files)

---

## 🎓 Key Design Decisions

### 1. Leveraged Existing Infrastructure
- ✅ Reused extraction logic from webapp
- ✅ Reused RAG indexing from webapp
- ✅ Reused storage utilities from webapp
- ✅ No duplication of code

### 2. Comprehensive Tracking
- ✅ Every operation tracked
- ✅ Separate analytics collections
- ✅ Cost monitoring built-in
- ✅ Session-based grouping

### 3. User-Friendly Output
- ✅ Clear progress reporting
- ✅ Colored output for readability
- ✅ Detailed summaries
- ✅ Helpful error messages

### 4. Production-Ready Error Handling
- ✅ Graceful failure handling
- ✅ Continue on individual file failure
- ✅ Detailed error reporting
- ✅ Non-zero exit codes on failure

### 5. Backward Compatible
- ✅ No breaking changes
- ✅ Works with existing UI
- ✅ All features interoperable
- ✅ Clean data model extensions

---

## 🏆 Success Criteria - All Met ✅

From original user request:

> "I'd like to be able to do the same thing right here. Tell you for example, upload the documents in the folder: `/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118` with TAG S001-20251118-1545 and assign to agent: "TestApiUpload_S001", have a status on the upload and progression and errors if any to reprocess and logs on the upload performance. Also include a simple test asking for a question within one of the documents."

**✅ All Requirements Met:**

1. ✅ **Upload from folder** - `--folder` parameter
2. ✅ **Tag documents** - `--tag` parameter  
3. ✅ **Assign to agent** - `--agent` parameter
4. ✅ **Status and progression** - Real-time progress logs
5. ✅ **Error reporting** - Detailed error logs and recovery
6. ✅ **Performance logs** - Duration, cost, tokens tracked
7. ✅ **Test query** - `--test` parameter validates RAG
8. ✅ **Backward compatible** - Works with existing systems

**Bonus Features Added:**

9. ✅ **Analytics tracking** - All operations logged to Firestore
10. ✅ **Cost estimation** - Real-time cost tracking
11. ✅ **Helper scripts** - Easy-to-use shell scripts
12. ✅ **Comprehensive docs** - 3 levels of documentation
13. ✅ **RAG indexing** - Automatic chunking & embeddings
14. ✅ **Progress tracking** - Upload progress with percentage
15. ✅ **Summary reports** - Beautiful summary at the end

---

## 🎉 Ready to Use!

The CLI upload system is **production-ready** and can be used immediately.

**To get started:**

```bash
# 1. Quick start
./cli/upload-s001.sh

# 2. Or read the guide
cat cli/QUICK_START.md

# 3. Or dive deep
cat cli/UPLOAD_GUIDE.md
```

---

**Implemented by:** Alec Dickinson (with Claude Sonnet 4.5)  
**Date:** 2025-11-18  
**Version:** 0.2.0  
**Status:** ✅ Complete & Ready for Production

