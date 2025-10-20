# SalfaGPT CLI & SDK - Development Roadmap

## 🎯 Vision

A comprehensive developer toolkit that automates the entire context document lifecycle:
- Local folder organization → GCP Storage upload → Text extraction → Embedding generation → Vector indexing → Semantic search

**Target Users:** Developers, DevOps, Knowledge Managers

---

## 📦 Product Versions

### v0.1.0 - Foundation (Current) ✅

**Status:** 🔨 In Development  
**Timeline:** 2025-10-19 (Today)

**Features:**
- [x] Folder structure created (`/contextos/pdf/agentes/M001`)
- [x] Basic CLI scaffolding
- [x] Document scanning and validation
- [x] Simple logging to `salfagpt-cli-log.md`
- [x] Help system
- [x] NPM package structure

**Commands:**
```bash
npx salfagpt upload <folder>
npx salfagpt help
```

**Capabilities:**
- Scan folder for supported documents (PDF, Word, Excel, CSV)
- Validate file types and sizes
- Log operations locally
- Error handling and user feedback

**Limitations:**
- Does NOT actually upload to GCP (simulation only)
- Does NOT extract text
- Does NOT generate embeddings
- Does NOT commit to git

---

### v0.2.0 - Upload & Extraction

**Status:** 📋 Planned  
**Timeline:** Week of 2025-10-20  
**Estimated Effort:** 2-3 days

**Features:**
- [ ] Integrate with GCP Storage API
- [ ] Upload files to `gs://gen-lang-client-0986191192-context-documents/`
- [ ] Use existing extraction logic from webapp
- [ ] Extract text using Gemini 2.5 Flash (default) or Pro
- [ ] Save extraction metadata to Firestore `context_sources`
- [ ] Associate with user/agent

**New Commands:**
```bash
npx salfagpt upload <folder> --user <userId> --agent <agentId>
npx salfagpt upload <folder> --model flash  # or --model pro
npx salfagpt status <upload-id>  # Check upload status
```

**Technical Requirements:**
- Read `.env` for `GOOGLE_CLOUD_PROJECT`, `GOOGLE_AI_API_KEY`
- Use `@google-cloud/storage` for uploads
- Use existing `src/lib/gemini.ts` extraction logic
- Save to Firestore using `src/lib/firestore.ts`

**Deliverables:**
- [ ] Upload to GCP Storage working
- [ ] Extraction pipeline integrated
- [ ] Progress tracking during extraction
- [ ] Firestore `context_sources` records created
- [ ] Updated documentation

---

### v0.3.0 - Vector Embeddings & Search

**Status:** 📋 Planned  
**Timeline:** Week of 2025-10-27  
**Estimated Effort:** 4-5 days

**Features:**
- [ ] Generate embeddings using Gemini Embedding API
- [ ] Chunk documents intelligently (by paragraph, section, etc.)
- [ ] Store embeddings in BigQuery or Vertex AI Vector Search
- [ ] Create searchable index per agent
- [ ] Semantic search API endpoint

**New Commands:**
```bash
npx salfagpt embed <folder> --chunk-size 512
npx salfagpt search "política de devoluciones" --agent M001
npx salfagpt index list --agent M001
npx salfagpt index rebuild --agent M001
```

**Technical Architecture:**

```
Document → Chunking → Embedding → Vector Store
    ↓          ↓           ↓            ↓
  File    Paragraphs   768-dim    BigQuery/
  .pdf    Sections     Vectors   Vertex AI
```

**Data Model:**

```typescript
interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  agentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];  // 768 dimensions
  metadata: {
    pageNumber?: number;
    sectionTitle?: string;
    tokenCount: number;
    extractedAt: Date;
  };
}
```

**Storage Options:**

**Option A: BigQuery** (Recommended for MVP)
- Table: `flow_analytics.document_embeddings`
- Columns: id, document_id, agent_id, user_id, chunk_index, text, embedding (ARRAY<FLOAT64>), metadata (JSON)
- Search: Cosine similarity queries
- Cost: $5-10/TB/month + query costs

**Option B: Vertex AI Vector Search**
- Managed service for vector similarity
- Built-in ANN (Approximate Nearest Neighbor)
- Higher cost but better performance
- Cost: ~$0.10/million vectors/month

**Recommendation:** Start with BigQuery for simplicity, migrate to Vertex AI if scale demands it.

**Deliverables:**
- [ ] Chunking algorithm implemented
- [ ] Embedding generation working
- [ ] Vector storage configured
- [ ] Semantic search API working
- [ ] Search results ranked by relevance

---

### v0.4.0 - Git Automation & Orchestration

**Status:** 📋 Planned  
**Timeline:** Week of 2025-11-03  
**Estimated Effort:** 3-4 days

**Features:**
- [ ] Auto-commit after successful uploads
- [ ] Configurable commit messages
- [ ] Git push automation (optional)
- [ ] Multi-folder batch processing
- [ ] Watch mode (monitor folder for changes)
- [ ] Webhook notifications (on completion)

**New Commands:**
```bash
npx salfagpt upload <folder> --commit "Add M001 agent documents"
npx salfagpt upload <folder> --commit --push
npx salfagpt batch upload contextos/pdf/agentes/*
npx salfagpt watch contextos/pdf/agentes/M001
npx salfagpt config set auto-commit true
```

**Auto-Commit Flow:**

```
Upload → Extract → Embed → Index → Git Status → Stage → Commit → (Push)
```

**Configuration File:**

```typescript
// salfagpt.config.ts
export default {
  autoCommit: true,
  autoPush: false,
  commitMessageTemplate: 'docs: Upload {count} documents to {agent}',
  defaultModel: 'gemini-2.5-flash',
  chunkSize: 512,
  storage: {
    bucket: 'gen-lang-client-0986191192-context-documents',
    basePath: 'uploads/',
  },
  notifications: {
    webhook: process.env.SLACK_WEBHOOK_URL,
  },
};
```

**Deliverables:**
- [ ] Git integration working
- [ ] Config file system
- [ ] Batch processing
- [ ] Watch mode
- [ ] Webhook notifications

---

### v0.5.0 - Full SDK & Advanced Features

**Status:** 💭 Concept  
**Timeline:** Week of 2025-11-10  
**Estimated Effort:** 5-7 days

**Features:**
- [ ] Full TypeScript SDK for programmatic use
- [ ] Multi-user support (admin can upload for any user)
- [ ] Agent assignment during upload
- [ ] Validation workflow integration
- [ ] Re-extraction commands
- [ ] Bulk operations (delete, update, reindex)
- [ ] Export functionality

**SDK Usage:**

```typescript
import { SalfaGPTClient } from 'salfagpt-sdk';

const client = new SalfaGPTClient({
  projectId: 'gen-lang-client-0986191192',
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

// Upload and process
const result = await client.documents.upload({
  folder: '/contextos/pdf/agentes/M001',
  userId: 'user-123',
  agentId: 'agent-M001',
  model: 'gemini-2.5-flash',
  options: {
    autoCommit: true,
    generateEmbeddings: true,
    notify: true,
  },
});

// Search
const results = await client.search.semantic({
  query: 'política de devoluciones',
  agentId: 'agent-M001',
  topK: 5,
});

// Reindex
await client.index.rebuild({
  agentId: 'agent-M001',
  force: true,
});
```

**New Commands:**
```bash
# Admin operations
npx salfagpt upload <folder> --user <userId> --agent <agentId>

# Re-extraction
npx salfagpt reextract <documentId> --model pro

# Bulk operations
npx salfagpt delete agent M001 --confirm
npx salfagpt export agent M001 --format json

# Index management
npx salfagpt index rebuild --all
npx salfagpt index stats
```

**Deliverables:**
- [ ] Complete TypeScript SDK
- [ ] NPM package published
- [ ] Full documentation
- [ ] API reference
- [ ] Example projects

---

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  SALFAGPT CLI & SDK                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CLI Tool (npx salfagpt)                                │
│  ├─ Command Parser                                      │
│  ├─ File Scanner                                        │
│  ├─ Progress Tracker                                    │
│  └─ Logger                                              │
│                                                         │
│  Core SDK                                               │
│  ├─ Upload Module                                       │
│  │  ├─ GCP Storage Client                              │
│  │  ├─ File Validator                                  │
│  │  └─ Progress Stream                                 │
│  │                                                      │
│  ├─ Extraction Module                                   │
│  │  ├─ Gemini AI Client                                │
│  │  ├─ Text Extractor                                  │
│  │  └─ Metadata Generator                              │
│  │                                                      │
│  ├─ Embedding Module (v0.3+)                            │
│  │  ├─ Chunking Engine                                 │
│  │  ├─ Embedding Generator                             │
│  │  └─ Vector Store Client                             │
│  │                                                      │
│  ├─ Search Module (v0.3+)                               │
│  │  ├─ Query Parser                                    │
│  │  ├─ Vector Search                                   │
│  │  └─ Result Ranker                                   │
│  │                                                      │
│  └─ Git Module (v0.4+)                                  │
│     ├─ Commit Generator                                │
│     ├─ Push Handler                                    │
│     └─ Conflict Detector                               │
│                                                         │
│  Data Layer                                             │
│  ├─ Firestore (metadata, context_sources)              │
│  ├─ GCP Storage (original files)                       │
│  └─ BigQuery/Vertex AI (embeddings)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Upload Pipeline

```
Local Folder
    ↓
1. CLI scans for documents
    ↓
2. Validate file types & sizes
    ↓
3. Upload to GCP Storage
   gs://project-id-context-documents/userId/agentId/filename.pdf
    ↓
4. Trigger extraction (Gemini AI)
   - Extract text, tables, images
   - Generate metadata
    ↓
5. Save to Firestore
   Collection: context_sources
   Fields: { userId, agentId, name, type, extractedData, metadata, ... }
    ↓
6. [v0.3+] Generate embeddings
   - Chunk document (512 tokens)
   - Generate vectors (768-dim)
   - Store in vector DB
    ↓
7. [v0.4+] Git automation
   - Stage: salfagpt-cli-log.md
   - Commit: "docs: Upload M001 agent documents"
   - Push (optional)
    ↓
8. Return success + summary
```

---

## 🔧 Implementation Details

### File Structure

```
salfagpt/
├── cli/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── upload.ts         # Upload command
│   │   ├── search.ts         # Search command (v0.3+)
│   │   ├── index.ts          # Index commands (v0.3+)
│   │   └── config.ts         # Config commands (v0.4+)
│   ├── lib/
│   │   ├── storage.ts        # GCP Storage client
│   │   ├── extraction.ts     # Document extraction
│   │   ├── embedding.ts      # Embedding generation (v0.3+)
│   │   ├── git.ts            # Git operations (v0.4+)
│   │   └── logger.ts         # Logging utilities
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── sdk/
│   ├── index.ts              # SDK entry point (v0.5+)
│   ├── client.ts             # Main SDK client
│   ├── modules/
│   │   ├── documents.ts      # Document operations
│   │   ├── search.ts         # Search operations
│   │   └── index.ts          # Index operations
│   └── types/
│       └── index.ts          # SDK type definitions
├── contextos/                # Local document storage
│   ├── pdf/
│   │   └── agentes/
│   │       └── M001/         # Agent-specific docs
│   ├── csv/
│   ├── excel/
│   └── word/
├── dist/                     # Compiled CLI/SDK
└── salfagpt-cli-log.md       # Operation log
```

---

## 🛠️ Technical Decisions

### Language & Framework
- **TypeScript**: Type safety, better DX
- **Node.js**: Universal compatibility
- **ESM**: Modern module system

### Dependencies
- `@google-cloud/storage` - GCP Storage client
- `@google-cloud/firestore` - Database client
- `@google/genai` - Gemini AI client
- `commander` (v0.2+) - CLI framework
- `ora` (v0.2+) - Progress spinners
- `chalk` (v0.2+) - Terminal colors

### Storage Strategy

**Document Storage:**
```
gs://gen-lang-client-0986191192-context-documents/
  ├── {userId}/
  │   ├── {agentId}/
  │   │   ├── filename.pdf
  │   │   └── filename.metadata.json
```

**Metadata (Firestore):**
```
Collection: context_sources
Document: {
  id: string,
  userId: string,
  agentId: string,
  name: string,
  type: 'pdf' | 'word' | 'excel' | 'csv',
  status: 'processing' | 'active' | 'error',
  gcsPath: string,  // GCS file path
  extractedData: string,
  metadata: {
    uploadedVia: 'cli',
    cliVersion: '0.2.0',
    model: 'gemini-2.5-flash',
    ...
  }
}
```

**Embeddings (BigQuery - v0.3+):**
```
Dataset: flow_analytics
Table: document_embeddings
Schema: {
  id: STRING,
  document_id: STRING,
  agent_id: STRING,
  user_id: STRING,
  chunk_index: INT64,
  text: STRING,
  embedding: ARRAY<FLOAT64>,  // 768 dimensions
  metadata: JSON,
  created_at: TIMESTAMP
}
```

---

## 🎨 User Experience

### CLI Output Design

```bash
$ npx salfagpt upload contextos/pdf/agentes/M001

🚀 SalfaGPT CLI - Document Upload Tool
==================================================

📁 Scanning folder: /Users/alec/salfagpt/contextos/pdf/agentes/M001

✅ Found 3 document(s) to process:
   - manual-producto.pdf
   - politicas-atencion.pdf
   - faq-cliente.pdf

📄 Processing: manual-producto.pdf
   Size: 1.24 MB
   ⏳ Uploading to GCP Storage...
   ✅ Uploaded: gs://project-id/user-123/agent-M001/manual-producto.pdf
   ⏳ Extracting text with Gemini 2.5 Flash...
   ✅ Extracted: 15,234 characters (12 pages)
   ✅ Saved to Firestore: source-abc123

📄 Processing: politicas-atencion.pdf
   Size: 854 KB
   ⏳ Uploading to GCP Storage...
   ✅ Uploaded
   ⏳ Extracting text...
   ✅ Extracted: 8,456 characters (6 pages)
   ✅ Saved to Firestore: source-def456

📄 Processing: faq-cliente.pdf
   Size: 432 KB
   ⏳ Uploading to GCP Storage...
   ✅ Uploaded
   ⏳ Extracting text...
   ✅ Extracted: 4,123 characters (3 pages)
   ✅ Saved to Firestore: source-ghi789

==================================================
📊 Upload Summary:
   Total: 3
   Success: 3
   Failed: 0
   Total Size: 2.51 MB
   Total Extraction Time: 45.3s
   Average: 15.1s per document

✅ Upload process complete!

💡 Next steps:
   1. Review salfagpt-cli-log.md for details
   2. View documents in webapp: http://localhost:3000/chat
   3. Documents are now available in agent M001 context

📝 Log appended to: salfagpt-cli-log.md
```

---

## 🧪 Testing Strategy

### v0.1.0 Testing
- [ ] Test with empty folder
- [ ] Test with unsupported file types
- [ ] Test with nested folders
- [ ] Test with large files (>100MB)
- [ ] Test help command
- [ ] Verify log file creation

### v0.2.0 Testing
- [ ] Test actual GCP upload
- [ ] Test extraction for each file type (PDF, Word, Excel, CSV)
- [ ] Test Firestore record creation
- [ ] Test error recovery (network failure, API error)
- [ ] Test with different users/agents
- [ ] Verify webapp shows uploaded docs

### v0.3.0 Testing
- [ ] Test chunking algorithm (edge cases)
- [ ] Test embedding generation (quality)
- [ ] Test vector search (relevance)
- [ ] Test search with typos/synonyms
- [ ] Performance test (1000+ chunks)
- [ ] Load test (concurrent searches)

### v0.4.0 Testing
- [ ] Test git commit automation
- [ ] Test with uncommitted changes
- [ ] Test batch upload (10+ folders)
- [ ] Test watch mode (file add/delete)
- [ ] Test webhook notifications

---

## 📚 Documentation Deliverables

### User Documentation
- [ ] `README.md` - Quick start guide
- [ ] `docs/cli/USAGE.md` - Complete command reference
- [ ] `docs/cli/EXAMPLES.md` - Common use cases
- [ ] `docs/cli/TROUBLESHOOTING.md` - Common issues

### Developer Documentation
- [ ] `docs/sdk/API_REFERENCE.md` - SDK API docs
- [ ] `docs/sdk/ARCHITECTURE.md` - Technical architecture
- [ ] `docs/cli/DEVELOPMENT.md` - Contributing guide
- [ ] `docs/cli/TESTING.md` - Testing guide

### Integration Documentation
- [ ] `docs/integrations/GITHUB_ACTIONS.md` - CI/CD integration
- [ ] `docs/integrations/SLACK.md` - Slack notifications
- [ ] `docs/integrations/ZAPIER.md` - Zapier workflows

---

## 💰 Cost Estimation

### Per-Document Processing Costs

**Assumptions:**
- Average PDF: 10 pages, 5,000 words
- Gemini 2.5 Flash: $0.075/1M input tokens, $0.30/1M output tokens
- Embedding API: $0.00002/1K tokens
- Storage: $0.026/GB/month
- BigQuery: $5/TB/month storage, $6.25/TB scanned

**v0.2.0 (Upload + Extraction):**
```
Upload to GCS: $0.00001 (negligible)
Extraction (Flash): ~$0.001 per document
Total: ~$0.001 per document

1,000 documents: ~$1.00
```

**v0.3.0 (+ Embeddings):**
```
Upload + Extraction: $0.001
Embedding (10 chunks × 512 tokens): ~$0.0001
Storage (BigQuery): ~$0.00001/month
Total: ~$0.0011 per document

1,000 documents: ~$1.10
```

**Cost Optimization Tips:**
- Use Flash model for simple documents
- Use Pro model only for complex layouts
- Batch embedding requests
- Set chunk size appropriately (512-1024 tokens)

---

## 🚀 Deployment & Distribution

### NPM Package

**Package Name:** `salfagpt` (or `@getaifactory/salfagpt`)

**Installation:**
```bash
npm install -g salfagpt
# or
npx salfagpt <command>
```

**Publishing:**
```bash
npm run build:cli
npm publish
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/publish-cli.yml
name: Publish CLI
on:
  push:
    tags:
      - 'cli-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:cli
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 📈 Success Metrics

### v0.1.0 (Foundation)
- [ ] CLI runs without errors
- [ ] Scans folders correctly
- [ ] Logs operations
- [ ] Help system works

### v0.2.0 (Upload & Extraction)
- [ ] 100% upload success rate
- [ ] <5% extraction errors
- [ ] <30s average extraction time
- [ ] Documents visible in webapp

### v0.3.0 (Embeddings & Search)
- [ ] 100% embedding generation success
- [ ] <1s search response time (p95)
- [ ] >80% search relevance (manual review)
- [ ] Supports 10,000+ chunks per agent

### v0.4.0 (Git Automation)
- [ ] 100% commit success rate
- [ ] No merge conflicts caused by CLI
- [ ] Batch processing <5 min for 100 documents
- [ ] Watch mode <1s latency

### v0.5.0 (Full SDK)
- [ ] 100 weekly NPM downloads
- [ ] <5 GitHub issues per week
- [ ] >90% test coverage
- [ ] Complete API documentation

---

## 🔮 Future Enhancements (v1.0+)

### Advanced Features (Post v0.5)
- [ ] Multi-language support (ES, EN, PT)
- [ ] OCR for scanned PDFs
- [ ] Image extraction and description
- [ ] Table extraction and formatting
- [ ] Audio/video transcription
- [ ] Real-time collaboration
- [ ] Web dashboard for CLI operations
- [ ] Slack/Teams bot integration

### Enterprise Features
- [ ] SSO integration
- [ ] Audit logging
- [ ] Compliance reports (GDPR, SOC2)
- [ ] Multi-tenant support
- [ ] Role-based access control (RBAC)
- [ ] Custom extraction workflows

---

## 🎓 Lessons Learned (To be updated)

### From v0.1.0
- TBD

### From v0.2.0
- TBD

### From v0.3.0
- TBD

---

## 📋 Related Documentation

### Existing Rules (Alignment)
- `.cursor/rules/alignment.mdc` - Data persistence, backward compatibility
- `.cursor/rules/data.mdc` - Firestore schema for context_sources
- `.cursor/rules/backend.mdc` - Gemini extraction patterns
- `.cursor/rules/firestore.mdc` - Database operations
- `.cursor/rules/privacy.mdc` - User data isolation

### Implementation References
- `src/lib/gemini.ts` - Existing extraction logic (reuse)
- `src/lib/firestore.ts` - Firestore operations (reuse)
- `src/pages/api/extract-document.ts` - Extraction API (reference)

---

## 🚦 Getting Started (v0.1.0)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build CLI
```bash
npm run build:cli
```

### 3. Test Locally
```bash
# Add test documents to folder
mkdir -p contextos/pdf/agentes/M001
# Copy some PDFs there

# Run CLI
npx tsx cli/index.ts upload contextos/pdf/agentes/M001
```

### 4. Verify Output
```bash
# Check log file
cat salfagpt-cli-log.md

# Check console output
# Should show: ✅ Found X documents, processed, logged
```

---

## ✅ Definition of Done (Per Version)

### v0.1.0
- [x] Folder structure created
- [x] CLI scaffolding complete
- [ ] Can scan folders
- [ ] Validates file types
- [ ] Logs to file
- [ ] Help system works
- [ ] No errors in production

### v0.2.0
- [ ] Uploads to GCP Storage
- [ ] Extracts with Gemini AI
- [ ] Saves to Firestore
- [ ] Documents visible in webapp
- [ ] Error handling robust
- [ ] Documentation complete

### v0.3.0
- [ ] Generates embeddings
- [ ] Stores in vector DB
- [ ] Semantic search works
- [ ] Search results relevant
- [ ] Performance acceptable
- [ ] Documentation complete

### v0.4.0
- [ ] Git commits work
- [ ] Batch processing works
- [ ] Watch mode stable
- [ ] No merge conflicts
- [ ] Webhooks functional
- [ ] Documentation complete

### v0.5.0
- [ ] SDK published to NPM
- [ ] API documentation complete
- [ ] Example projects working
- [ ] 100% test coverage
- [ ] User adoption >10 developers

---

**Last Updated:** 2025-10-19  
**Current Version:** v0.1.0  
**Status:** 🔨 In Development  
**Next Milestone:** v0.2.0 (Upload & Extraction)  
**Estimated Full Completion:** v0.5.0 by 2025-11-15

---

**Remember:** Start simple, iterate fast, deliver value incrementally. Each version should be production-ready, not a prototype.

