# CLI Upload Architecture

**Visual representation of the complete system**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CLI Commands:                     Shell Scripts:                    │
│  ┌──────────────────┐             ┌──────────────────┐             │
│  │ upload.ts        │             │ upload-s001.sh   │             │
│  │ test-upload.ts   │             │ upload-example.sh│             │
│  └──────────────────┘             └──────────────────┘             │
│           │                                 │                        │
│           └─────────────┬───────────────────┘                       │
│                         │                                            │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CORE LIBRARIES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  storage.ts │  │extraction.ts│  │embeddings.ts│  │analytics.ts│ │
│  │             │  │             │  │             │  │            │ │
│  │ • Upload    │  │ • Gemini AI │  │ • Chunking  │  │ • Tracking │ │
│  │   to GCS    │  │   Vision    │  │ • Embeddings│  │ • Events   │ │
│  │ • Progress  │  │ • PDF Parse │  │ • Filtering │  │ • Sessions │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                                       │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Google Cloud │  │  Gemini AI   │  │  Firestore   │             │
│  │   Storage    │  │              │  │              │             │
│  │              │  │ • Flash      │  │ • context_   │             │
│  │ • Bucket     │  │ • Pro        │  │   sources    │             │
│  │ • Files      │  │ • Vision     │  │ • document_  │             │
│  │              │  │              │  │   embeddings │             │
│  │              │  │              │  │ • cli_events │             │
│  │              │  │              │  │ • cli_       │             │
│  │              │  │              │  │   sessions   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Upload Pipeline Flow

```
START: CLI Command
    │
    ├─→ Parse Arguments
    │   └─→ Validate (folder, tag, agent, user)
    │
    ├─→ Ensure GCS Bucket
    │   └─→ Check/Create if needed
    │
    ├─→ Scan Folder for PDFs
    │   └─→ Get list of .pdf files
    │
    └─→ FOR EACH FILE:
        │
        ├─ STEP 1: Upload to GCS (0-20%)
        │  │
        │  ├─→ Read file from disk
        │  ├─→ Stream to GCS with progress
        │  ├─→ Track: cli_file_uploaded
        │  └─→ Result: gs://bucket/userId/agentId/file.pdf
        │
        ├─ STEP 2: Extract with Gemini (20-50%)
        │  │
        │  ├─→ Send PDF to Gemini AI
        │  ├─→ Extract text, tables, images
        │  ├─→ Track: cli_file_extracted
        │  ├─→ Count tokens (input + output)
        │  ├─→ Calculate cost
        │  └─→ Result: Full text extracted
        │
        ├─ STEP 3: Save to Firestore (50-60%)
        │  │
        │  ├─→ Create context_sources document
        │  ├─→ Store: text, metadata, tags
        │  ├─→ Include: CLI attribution
        │  └─→ Result: sourceId
        │
        ├─ STEP 4: RAG Processing (60-90%)
        │  │
        │  ├─→ 4a: Chunk Text
        │  │   ├─→ Split by paragraphs
        │  │   ├─→ Target: ~1000 tokens/chunk
        │  │   ├─→ Filter garbage (headers, footers)
        │  │   └─→ Result: N chunks
        │  │
        │  ├─→ 4b: Generate Embeddings
        │  │   ├─→ For each chunk: text → vector
        │  │   ├─→ Model: text-embedding-004
        │  │   ├─→ Dimensions: 768
        │  │   ├─→ Batch API calls (5 at a time)
        │  │   └─→ Result: N embeddings
        │  │
        │  └─→ 4c: Store Embeddings
        │      ├─→ Save to document_embeddings
        │      ├─→ Link to sourceId
        │      ├─→ Include: userId, agentId
        │      └─→ Result: Indexed for search
        │
        ├─ STEP 5: Update Metadata (90-95%)
        │  │
        │  ├─→ Update context_sources doc
        │  ├─→ Set: ragEnabled = true
        │  ├─→ Set: ragMetadata (chunks, model, etc)
        │  └─→ Set: useRAGMode = true
        │
        └─ STEP 6: Assign to Agent (95-100%)
           │
           ├─→ Add to: assignedToAgents[]
           ├─→ Load agent's context
           ├─→ Add to: activeContextSourceIds[]
           ├─→ Save conversation context
           └─→ Result: Agent can use document
    │
    └─→ After all files:
        │
        ├─→ Generate Summary Report
        │   ├─→ Total files
        │   ├─→ Succeeded / Failed
        │   ├─→ Total duration
        │   ├─→ Total cost
        │   └─→ Per-file breakdown
        │
        ├─→ Track Session
        │   ├─→ Save to: cli_sessions
        │   └─→ Include: all metrics
        │
        └─→ (Optional) Test Query
            ├─→ Search with RAG
            ├─→ Display top chunks
            ├─→ Generate AI response
            └─→ Validate: System works

END: Exit with status code
```

---

## 💾 Data Model

### Firestore: `context_sources`

```
context_sources/{sourceId}
├── id: string
├── userId: string
├── name: string
├── type: "pdf"
├── enabled: true
├── status: "active"
├── addedAt: Date
├── extractedData: string (full text)
├── originalFileUrl: string (gs:// path)
├── tags: string[]
│   └── ["S001-20251118-1545"]
├── assignedToAgents: string[]
│   └── ["TestApiUpload_S001"]
├── ragEnabled: boolean
├── ragMetadata: {
│   ├── chunkCount: number
│   ├── avgChunkSize: number
│   ├── indexedAt: Date
│   ├── embeddingModel: "text-embedding-004"
│   └── processingTime: number
│   }
├── useRAGMode: true
├── metadata: {
│   ├── originalFileName: string
│   ├── originalFileSize: number
│   ├── extractionDate: Date
│   ├── extractionTime: number
│   ├── model: "gemini-2.5-flash" | "gemini-2.5-pro"
│   ├── charactersExtracted: number
│   ├── tokensEstimate: number
│   ├── inputTokens: number
│   ├── outputTokens: number
│   ├── estimatedCost: number
│   ├── uploadedVia: "cli" ⭐
│   ├── uploadedBy: string ⭐
│   └── sessionId: string ⭐
│   }
└── source: "localhost"
```

### Firestore: `document_embeddings`

```
document_embeddings/{embeddingId}
├── id: string
├── sourceId: string (link to context_sources)
├── sourceName: string
├── userId: string
├── agentId: string
├── chunkIndex: number
├── text: string (chunk text)
├── embedding: number[] (768 dimensions)
├── tokenCount: number
├── model: "text-embedding-004"
├── uploadedVia: "cli" ⭐
├── userEmail: string ⭐
└── createdAt: Date
```

### Firestore: `cli_events` (NEW)

```
cli_events/{eventId}
├── eventType: CLIEventType
├── userId: string
├── userEmail: string
├── source: "cli"
├── cliVersion: string
├── agentId?: string
├── operation: string
├── fileName?: string
├── success: boolean
├── duration?: number
├── filesProcessed?: number
├── filesSucceeded?: number
├── filesFailed?: number
├── model?: string
├── inputTokens?: number
├── outputTokens?: number
├── estimatedCost?: number
├── gcsPath?: string
├── firestoreDocId?: string
├── errorMessage?: string
├── timestamp: Date
├── sessionId: string
├── hostname: string
├── nodeVersion: string
└── platform: string
```

### Firestore: `cli_sessions` (NEW)

```
cli_sessions/{sessionId}
├── id: string
├── userId: string
├── userEmail: string
├── command: string (full command)
├── startedAt: Date
├── endedAt?: Date
├── duration?: number
├── eventsCount: number
├── success: boolean
└── cliVersion: string
```

---

## 🔌 Integration Points

### 1. With Web UI

```
CLI Upload                    Web UI
    │                            │
    ├─→ Upload documents         │
    │   └─→ Firestore            │
    │       context_sources       │
    │            ↓                │
    │       ┌────┴────┐          │
    │       │ SHARED  │←─────────┤
    │       │  DATA   │          │
    │       └────┬────┘          │
    │            ↓                │
    ├←───── Load documents       │
    │       Display in UI ←──────┤
    │                             │
    └─→ Both use RAG search ←────┘
```

**Key Points:**
- CLI documents appear in UI automatically
- UI documents visible to CLI (if needed)
- Same RAG search algorithm
- Same agent assignment logic
- Same tag filtering

### 2. With RAG Search

```
Query: "¿Cuáles son los requisitos?"
    │
    ├─→ Generate query embedding
    │   └─→ text-embedding-004
    │
    ├─→ Search document_embeddings
    │   ├─→ Calculate cosine similarity
    │   ├─→ Filter by: userId, activeSourceIds
    │   └─→ Return: top 5 chunks
    │
    ├─→ Build context from chunks
    │   └─→ Format: [Source 1] text [Source 2] text...
    │
    └─→ Generate response with Gemini
        ├─→ Input: context + query
        └─→ Output: AI response
```

**Works for:**
- ✅ CLI-uploaded documents
- ✅ UI-uploaded documents
- ✅ Mixed sources
- ✅ Multi-agent scenarios

### 3. With Analytics

```
CLI Upload
    │
    ├─→ trackFileUpload()
    │   └─→ cli_events: "cli_file_uploaded"
    │
    ├─→ trackFileExtraction()
    │   └─→ cli_events: "cli_file_extracted"
    │
    └─→ trackUploadSession()
        ├─→ cli_events: "cli_upload_complete"
        └─→ cli_sessions: summary
            │
            ├─→ Dashboard queries
            ├─→ Cost reporting
            ├─→ Usage analytics
            └─→ Error monitoring
```

---

## 🎯 Use Case Flow

### Example: Upload S001 Documents

```
User runs: ./cli/upload-s001.sh
    │
    ├─→ Script starts
    │   └─→ Shows: Configuration
    │
    ├─→ Check folder
    │   └─→ Found: 3 PDFs
    │
    ├─→ Confirm with user
    │   └─→ User: "y"
    │
    ├─→ Process each PDF
    │   │
    │   ├─ Manual_Seguridad.pdf
    │   │  ├─→ Upload (1.2s)
    │   │  ├─→ Extract (8.3s)
    │   │  ├─→ Save (0.3s)
    │   │  ├─→ RAG (3.2s)
    │   │  └─→ Assign (0.1s)
    │   │
    │   ├─ Procedimiento_Emergencias.pdf
    │   │  └─→ [same steps]
    │   │
    │   └─ Plan_Evacuacion.pdf
    │      └─→ [same steps]
    │
    ├─→ Generate summary
    │   ├─→ 3 files
    │   ├─→ 3 succeeded
    │   ├─→ 42.5s total
    │   └─→ $0.0142 cost
    │
    ├─→ Test query
    │   ├─→ Search: "requisitos de seguridad"
    │   ├─→ Find: 5 relevant chunks
    │   └─→ AI responds: [answer]
    │
    └─→ Exit: success ✅

User opens UI:
    │
    ├─→ Navigate to: TestApiUpload_S001
    │
    ├─→ Click: "Fuentes de Contexto"
    │
    └─→ See: 3 documents
        ├─→ Tag: S001-20251118-1545
        ├─→ All enabled (green)
        └─→ RAG metadata visible

User chats with agent:
    │
    ├─→ Ask: "¿Cuáles son los requisitos?"
    │
    ├─→ RAG search finds chunks
    │
    └─→ AI responds using documents ✅
```

---

## 🔒 Security & Attribution

```
Every Operation
    │
    ├─→ User Attribution
    │   ├─→ userId: "114671162830729001607"
    │   └─→ email: "alec@getaifactory.com"
    │
    ├─→ Source Tracking
    │   ├─→ uploadedVia: "cli"
    │   └─→ sessionId: "cli-upload-{timestamp}-{random}"
    │
    ├─→ Timestamp
    │   └─→ All operations timestamped
    │
    └─→ Audit Trail
        ├─→ cli_events (all operations)
        ├─→ cli_sessions (summaries)
        └─→ context_sources (metadata)
```

---

## 📊 Monitoring Dashboard (Conceptual)

```
┌─────────────────────────────────────────────────────────┐
│ CLI Upload Dashboard                                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Today's Activity                                        │
│  ┌─────────────┬─────────────┬─────────────┐           │
│  │  Files      │  Sessions   │  Total Cost │           │
│  │  Uploaded   │  Run        │  Spent      │           │
│  ├─────────────┼─────────────┼─────────────┤           │
│  │    127      │     15      │   $1.397    │           │
│  └─────────────┴─────────────┴─────────────┘           │
│                                                           │
│  Success Rate                                            │
│  ████████████████████████░░░  95%                       │
│                                                           │
│  Recent Sessions                                         │
│  ┌────────────────────────────────────────────┐         │
│  │ 15:45  S001-Upload    3 files   ✅ $0.014  │         │
│  │ 14:30  S002-Upload   10 files   ✅ $0.047  │         │
│  │ 12:15  TEST-Upload    2 files   ⚠️  $0.008  │         │
│  └────────────────────────────────────────────┘         │
│                                                           │
│  Error Log                                               │
│  ┌────────────────────────────────────────────┐         │
│  │ 12:15  file3.pdf  Extraction timeout       │         │
│  └────────────────────────────────────────────┘         │
│                                                           │
└───────────────────────────────────────────────────────────┘

Query: Firestore → cli_events + cli_sessions
```

---

## 🚀 Deployment Architecture

```
Development Machine (MacBook)
    │
    ├─→ CLI Command
    │   └─→ npx tsx cli/commands/upload.ts
    │
    ├─→ Local Files
    │   └─→ /Users/alec/salfagpt/upload-queue/...
    │
    └─→ Network Calls
        │
        ├─→ Google Cloud Storage
        │   ├─→ Upload files
        │   └─→ Store: gs://bucket/...
        │
        ├─→ Gemini AI API
        │   ├─→ Extract text
        │   ├─→ Generate embeddings
        │   └─→ API Key: GOOGLE_AI_API_KEY
        │
        └─→ Firestore
            ├─→ Save documents
            ├─→ Store embeddings
            ├─→ Track events
            └─→ Auth: Application Default Credentials
```

---

## 🔄 Backward Compatibility Guarantee

```
Existing System (Before)
    │
    ├─→ UI uploads
    ├─→ context_sources collection
    ├─→ document_embeddings collection
    ├─→ RAG search
    └─→ Agent assignment
        │
        └─→ All work perfectly ✅

CLI System Added (After)
    │
    ├─→ CLI uploads
    ├─→ SAME context_sources collection
    ├─→ SAME document_embeddings collection
    ├─→ SAME RAG search
    ├─→ SAME agent assignment
    └─→ NEW cli_events collection
        │
        └─→ Everything still works ✅
            │
            ├─→ UI + CLI coexist
            ├─→ No breaking changes
            ├─→ Optional fields only
            └─→ Full interoperability
```

---

**Architecture Version:** 0.2.0  
**Created:** 2025-11-18  
**Status:** ✅ Production Ready

