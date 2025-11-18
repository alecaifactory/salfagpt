# 🛠️ SalfaGPT CLI

**Command-Line Interface for SalfaGPT Document Management**

---

## 📚 Overview

The SalfaGPT CLI provides powerful command-line tools for batch document operations, enabling:

- **Batch Upload** - Upload multiple PDFs at once
- **Automated Extraction** - Extract text with Gemini AI
- **RAG Indexing** - Automatic chunking & embeddings
- **Agent Assignment** - Assign documents to specific agents
- **Analytics Tracking** - Track all operations for monitoring

---

## 🚀 Quick Start

```bash
# 1. Install dependencies (from project root)
npm install

# 2. Configure environment
cat .env | grep GOOGLE_AI_API_KEY
cat .env | grep GOOGLE_CLOUD_PROJECT

# 3. Run example upload
./cli/upload-example.sh
```

**See [QUICK_START.md](./QUICK_START.md) for detailed walkthrough.**

---

## 📂 Structure

```
cli/
├── commands/          # CLI commands
│   ├── upload.ts      # ⭐ Batch document upload (NEW)
│   ├── backlog.ts     # Feature backlog management
│   ├── feedback.ts    # User feedback collection
│   ├── roadmap.ts     # Product roadmap
│   └── worktree.ts    # Git worktree management
│
├── lib/               # Shared libraries
│   ├── analytics.ts   # Event tracking & monitoring
│   ├── embeddings.ts  # RAG: Chunking & embeddings
│   ├── extraction.ts  # Document extraction with Gemini
│   └── storage.ts     # GCS upload utilities
│
├── index.ts           # CLI entry point (future)
├── test-upload.ts     # Upload command test
├── upload-example.sh  # Example upload script
│
├── README.md          # This file
├── QUICK_START.md     # 2-minute quick start
└── UPLOAD_GUIDE.md    # Comprehensive upload guide
```

---

## 🎯 Commands

### Upload (Batch Document Upload) ⭐ NEW

Upload multiple PDFs from a folder to SalfaGPT with full pipeline processing.

```bash
npx tsx cli/commands/upload.ts \
  --folder=/path/to/folder \
  --tag=TAG-NAME \
  --agent=AGENT_ID \
  --user=USER_ID \
  --email=user@example.com \
  --model=gemini-2.5-flash \
  --test="Test question here"
```

**Features:**
- ✅ Batch upload all PDFs in folder
- ✅ Automatic extraction with Gemini AI
- ✅ Chunking & embeddings for RAG
- ✅ Auto-assign to agent
- ✅ Progress tracking
- ✅ Error recovery
- ✅ Performance metrics
- ✅ Optional test query

**Documentation:**
- [QUICK_START.md](./QUICK_START.md) - 2-minute walkthrough
- [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) - Complete guide

**Example:**
```bash
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=TestApiUpload_S001 \
  --user=114671162830729001607 \
  --email=alec@getaifactory.com \
  --test="¿Cuáles son los requisitos de seguridad?"
```

---

### Backlog

Manage feature backlog and track implementation progress.

```bash
npx tsx cli/commands/backlog.ts
```

---

### Feedback

Collect and analyze user feedback.

```bash
npx tsx cli/commands/feedback.ts
```

---

### Roadmap

View and manage product roadmap.

```bash
npx tsx cli/commands/roadmap.ts
```

---

### Worktree

Manage Git worktrees for parallel development.

```bash
npx tsx cli/commands/worktree.ts
```

---

## 📊 Libraries

### Analytics (`lib/analytics.ts`)

Track CLI operations for monitoring and cost analysis.

```typescript
import { trackFileUpload, trackUploadSession } from './lib/analytics';

// Track file upload
await trackFileUpload({
  sessionId: 'session-123',
  fileName: 'manual.pdf',
  fileSize: 1240000,
  agentId: 'agent-M001',
  success: true,
  duration: 2300,
  gcsPath: 'gs://bucket/path/manual.pdf',
  firestoreDocId: 'source-abc123'
});

// Track session
await trackUploadSession({
  sessionId: 'session-123',
  command: 'upload --folder=/path',
  folderPath: '/path',
  agentId: 'agent-M001',
  startedAt: new Date(),
  endedAt: new Date(),
  filesProcessed: 3,
  filesSucceeded: 3,
  filesFailed: 0,
  totalDuration: 45300,
  totalCost: 0.0041,
  success: true
});
```

**Tracked Events:**
- `cli_file_uploaded` - File upload completed
- `cli_file_extracted` - Text extraction completed
- `cli_file_failed` - Operation failed
- `cli_upload_complete` - Batch upload completed
- `cli_upload_failed` - Batch upload failed

**Storage:**
- Firestore collection: `cli_events`
- Firestore collection: `cli_sessions`

---

### Embeddings (`lib/embeddings.ts`)

Generate embeddings for RAG (Retrieval-Augmented Generation).

```typescript
import { processForRAG } from './lib/embeddings';

const result = await processForRAG(
  'source-abc123',           // Document ID
  'manual.pdf',              // File name
  extractedText,             // Full text
  'user-123',                // User ID
  'agent-M001',              // Agent ID
  {
    chunkSize: 1000,         // Tokens per chunk
    embeddingModel: 'text-embedding-004',
    uploadedVia: 'cli',
    cliVersion: '0.2.0',
    userEmail: 'user@example.com',
  }
);

console.log('Chunks:', result.totalChunks);
console.log('Cost:', result.estimatedCost);
```

**Process:**
1. Chunk text intelligently (by paragraph/section)
2. Generate embeddings (768-dimensional vectors)
3. Store in Firestore collection `document_embeddings`
4. Enable RAG search for the document

---

### Extraction (`lib/extraction.ts`)

Extract text from documents using Gemini AI.

```typescript
import { extractDocument } from './lib/extraction';

const result = await extractDocument(
  '/path/to/document.pdf',
  'gemini-2.5-flash'
);

console.log('Extracted:', result.charactersExtracted, 'chars');
console.log('Tokens:', result.tokensEstimate);
console.log('Cost:', result.estimatedCost);
console.log('Text:', result.extractedText);
```

**Supported Formats:**
- PDF (including scanned documents with OCR)
- DOCX (coming soon)
- XLSX (coming soon)

**Models:**
- `gemini-2.5-flash` - Fast, good quality ($0.075/M input, $0.30/M output)
- `gemini-2.5-pro` - Slow, excellent quality ($1.25/M input, $5.00/M output)

---

### Storage (`lib/storage.ts`)

Upload files to Google Cloud Storage.

```typescript
import { uploadFileToGCS } from './lib/storage';

const result = await uploadFileToGCS(
  '/path/to/file.pdf',
  'user-123',
  'agent-M001',
  (progress) => {
    console.log(`${progress.percentage.toFixed(1)}%`);
  }
);

console.log('GCS Path:', result.gcsPath);
console.log('Public URL:', result.publicUrl);
```

**Bucket Structure:**
```
{project-id}-context-documents/
  ├── {userId}/
  │   └── {agentId}/
  │       ├── file1.pdf
  │       ├── file2.pdf
  │       └── ...
```

---

## 🔧 Configuration

### Environment Variables

Required in `.env`:

```bash
# Google AI API Key (for Gemini)
GOOGLE_AI_API_KEY=AIzaSy...

# Google Cloud Project
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192

# Optional: Service Account (for GCS)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### User Configuration

Edit CLI commands or use environment variables:

```bash
# Set default user
export SALFAGPT_USER_ID="114671162830729001607"
export SALFAGPT_USER_EMAIL="alec@getaifactory.com"
```

Or modify in `cli/lib/analytics.ts`:

```typescript
export function getCLIUser(): { userId: string; email: string } {
  return {
    userId: process.env.SALFAGPT_USER_ID || '114671162830729001607',
    email: process.env.SALFAGPT_USER_EMAIL || 'alec@getaifactory.com',
  };
}
```

---

## 📈 Monitoring

### View Events in Firestore

```javascript
// Firebase Console → Firestore

// All CLI events
db.collection('cli_events')
  .where('source', '==', 'cli')
  .orderBy('timestamp', 'desc')
  .limit(100)

// Failed uploads
db.collection('cli_events')
  .where('eventType', '==', 'cli_file_failed')
  .orderBy('timestamp', 'desc')

// Today's uploads
db.collection('cli_events')
  .where('eventType', '==', 'cli_file_uploaded')
  .where('timestamp', '>=', new Date('2025-11-18'))
  .orderBy('timestamp', 'desc')
```

### Cost Analysis

```javascript
// Total cost by user
db.collection('cli_sessions')
  .where('userId', '==', '114671162830729001607')
  .get()
  .then(docs => {
    const totalCost = docs.reduce((sum, doc) => 
      sum + (doc.data().totalCost || 0), 0
    );
    console.log('Total cost:', totalCost);
  });
```

---

## 🧪 Testing

### Test Upload Command

```bash
# Quick test with default configuration
npx tsx cli/test-upload.ts

# Manual test with custom configuration
npx tsx cli/commands/upload.ts \
  --folder=/path/to/test/folder \
  --tag=TEST-$(date +%s) \
  --agent=TestAgent \
  --user=YOUR_USER_ID \
  --email=your@email.com
```

### Verify Results

1. **In Firestore Console:**
   - Check `context_sources` collection for new documents
   - Check `document_embeddings` for generated embeddings
   - Check `cli_events` for tracking events

2. **In SalfaGPT UI:**
   - Open the target agent
   - Click "Fuentes de Contexto" (📚 icon)
   - Verify documents are listed and enabled
   - Check metadata (chunks, embeddings, model)

3. **Test RAG Search:**
   - Open a conversation with the agent
   - Ask a question about the uploaded documents
   - Verify AI responds using the context

---

## 💡 Best Practices

### 1. Organize Upload Folders by Date/Project
```
upload-queue/
├── salfacorp/
│   ├── S001-20251118/
│   ├── S002-20251119/
│   └── S003-20251120/
└── acme-corp/
    ├── PROJECT-A-20251118/
    └── PROJECT-B-20251119/
```

### 2. Use Descriptive Tags
```bash
# Good tags
--tag=S001-SSOMA-20251118
--tag=ACME-ONBOARDING-2025Q4
--tag=PROJECT-XYZ-DOCS-v2

# Avoid generic tags
--tag=docs
--tag=test
--tag=upload1
```

### 3. Start Small, Then Scale
```bash
# Phase 1: Test with 3-5 files
--folder=/test/small-batch

# Phase 2: Scale to 10-20 files
--folder=/test/medium-batch

# Phase 3: Production batches
--folder=/production/full-batch
```

### 4. Monitor Costs
```bash
# Check cost after each batch
# Rule of thumb: ~$0.011 per PDF with Flash

# For large batches (100+ files)
# Estimate: 100 files × $0.011 = $1.10
```

### 5. Use Test Queries
```bash
# Always include a test query to verify:
--test="Specific question about content"

# This validates:
# ✅ Embeddings generated correctly
# ✅ RAG search works
# ✅ AI can access the content
```

---

## 🚧 Roadmap

### Version 0.3.0 (Next)
- [ ] Retry logic for failed files
- [ ] Progress bars (not just logs)
- [ ] DOCX support
- [ ] XLSX support
- [ ] Parallel uploads (3 simultaneous)
- [ ] Config file (`.salfagptrc.json`)

### Version 0.4.0 (Future)
- [ ] Interactive mode (select files)
- [ ] Resume from checkpoint
- [ ] Webhook notifications
- [ ] S3 source integration
- [ ] Auto-tagging by folder structure
- [ ] Dry-run mode

---

## 📚 Documentation

- [QUICK_START.md](./QUICK_START.md) - Get started in 2 minutes
- [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) - Complete upload guide
- [RAG_EMBEDDINGS_GUIDE.md](../docs/cli/RAG_EMBEDDINGS_GUIDE.md) - RAG deep dive

---

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| `GOOGLE_AI_API_KEY not configured` | Check `.env` file has valid API key |
| `Bucket not found` | Verify `GOOGLE_CLOUD_PROJECT` in `.env` |
| `Agent not found` | Create agent first in SalfaGPT UI |
| `Permission denied` | Run `gcloud auth application-default login` |
| Some files fail | Try `--model=gemini-2.5-pro` for better OCR |

### Get Help

1. Check [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) troubleshooting section
2. Review Firestore `cli_events` for error details
3. Contact: alec@getaifactory.com

---

## 📝 License

Proprietary - SalfaGPT  
© 2025 AI Factory

---

**Version:** 0.2.0  
**Last Updated:** 2025-11-18  
**Maintainer:** Alec Dickinson (alec@getaifactory.com)

