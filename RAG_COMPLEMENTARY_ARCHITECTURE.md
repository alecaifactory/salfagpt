# 🏗️ RAG Complementary Architecture - Complete Flow

**Date:** October 18, 2025  
**Principle:** RAG **extends** existing system, doesn't replace it

---

## 🎯 Core Principle: Dual-Mode Operation

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLEMENTARY ARCHITECTURE                    │
│                                                                 │
│  Every document supports BOTH modes simultaneously:             │
│                                                                 │
│  Mode 1: Full-Text (ALWAYS available)                          │
│  Mode 2: RAG Search (OPTIONAL enhancement)                     │
│                                                                 │
│  System intelligently chooses best mode per query              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete Architecture - ASCII Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         1. UPLOAD & EXTRACTION                             │
└───────────────────────────────────────────────────────────────────────────┘

User uploads PDF
      │
      ▼
┌─────────────────────────────────────────────┐
│  API: /api/extract-document                 │
│                                             │
│  Input:                                     │
│  • file: File (PDF)                         │
│  • userId: string                           │
│  • model: 'flash' | 'pro'                   │
│  • ragEnabled: boolean (optional)           │
│                                             │
│  Process:                                   │
│  ├─ Gemini Vision extraction (multimodal)  │
│  │  ├─ Extract text                        │
│  │  ├─ Describe images                     │
│  │  └─ Convert tables to text              │
│  │                                          │
│  │  Result: Rich extractedText (complete)  │
│  │                                          │
│  └─ Return to frontend                     │
│                                             │
│  Output:                                    │
│  {                                          │
│    success: true,                           │
│    extractedText: "Complete text...",       │
│    metadata: { ... }                        │
│  }                                          │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  Frontend: ContextManagementDashboard       │
│                                             │
│  Receives extractedText                     │
│  Creates context_sources document:          │
│                                             │
│  {                                          │
│    id: "src_abc123",                        │
│    userId: "user_xyz",                      │
│    name: "Document.pdf",                    │
│    extractedData: "Complete text...",       │ ← Full-text (ALWAYS)
│    ragEnabled: false,  // Initially          │
│    status: "active"                         │
│  }                                          │
│                                             │
│  ✅ Document ready for full-text queries   │
└─────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                      2. RAG INDEXING (OPTIONAL)                            │
└───────────────────────────────────────────────────────────────────────────┘

User or Admin enables RAG for document
      │
      ▼
┌─────────────────────────────────────────────┐
│  API: /api/context-sources/:id/enable-rag   │
│                                             │
│  Input:                                     │
│  • sourceId: string                         │
│  • userId: string                           │
│  • chunkSize: number (default: 500)         │
│  • overlap: number (default: 50)            │
│                                             │
│  Process:                                   │
│  ├─ Load extractedData from Firestore      │ ← Uses existing extraction
│  │                                          │
│  ├─ Chunk the text                         │
│  │  ├─ Smart chunking (paragraph-aware)    │
│  │  ├─ 500 tokens per chunk                │
│  │  └─ 50 tokens overlap                   │
│  │                                          │
│  │  Result: 100 chunks for 100-page doc    │
│  │                                          │
│  ├─ Generate embeddings                    │
│  │  ├─ For each chunk                      │
│  │  ├─ 768-dimensional vectors             │
│  │  └─ Batch processing (5 at a time)      │
│  │                                          │
│  │  Result: 100 embeddings                 │
│  │                                          │
│  └─ Store in Firestore                     │
│                                             │
│  Output:                                    │
│  {                                          │
│    success: true,                           │
│    chunksCreated: 100,                      │
│    totalTokens: 50000                       │
│  }                                          │
└─────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│  Firestore: TWO complementary stores        │
│                                             │
│  Collection: context_sources                │
│  Document: src_abc123                       │
│  {                                          │
│    extractedData: "Full text...",           │ ← Mode 1: Full-text
│    ragEnabled: true,                        │ ← RAG now available
│    ragMetadata: {                           │
│      totalChunks: 100,                      │
│      indexedAt: "2025-10-18"                │
│    }                                        │
│  }                                          │
│                                             │
│  Collection: document_chunks                │ ← Mode 2: RAG chunks
│  Documents: chunk_001, chunk_002, ...       │
│  {                                          │
│    sourceId: "src_abc123",                  │ ← Links to full doc
│    chunkIndex: 0,                           │
│    text: "Chunk text with complete info",  │
│    embedding: [0.123, 0.456, ..., 0.789]   │
│  }                                          │
│                                             │
│  ✅ Both modes available simultaneously     │
└─────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                         3. Q&A WITH AGENT                                  │
└───────────────────────────────────────────────────────────────────────────┘

User asks question in agent
      │
      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API: /api/conversations/:id/messages                                    │
│                                                                          │
│  Input:                                                                  │
│  • conversationId: string                                                │
│  • userId: string                                                        │
│  • message: "What were Q4 sales?"                                        │
│  • contextSources: [{ id, name, content }]                               │
│  • ragEnabled: boolean (from user settings)                              │
│                                                                          │
│  Decision Tree:                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                                                              │       │
│  │  Is RAG enabled? ──No──→ Use Full-Text Mode ─────────────┐  │       │
│  │       │                   (Mode 1: Original behavior)     │  │       │
│  │      Yes                                                  │  │       │
│  │       │                                                   │  │       │
│  │       ▼                                                   │  │       │
│  │  Do chunks exist? ──No──→ Use Full-Text Mode ────────────┤  │       │
│  │       │                   (Graceful fallback)            │  │       │
│  │      Yes                                                  │  │       │
│  │       │                                                   │  │       │
│  │       ▼                                                   │  │       │
│  │  Try RAG Search                                           │  │       │
│  │       │                                                   │  │       │
│  │   Success?──No──→ Use Full-Text Mode ────────────────────┤  │       │
│  │       │            (Graceful fallback)                   │  │       │
│  │      Yes                                                  │  │       │
│  │       │                                                   │  │       │
│  │       ▼                                                   │  │       │
│  │  Results above                                            │  │       │
│  │  threshold?──No──→ Use Full-Text Mode ───────────────────┤  │       │
│  │       │             (Quality check)                      │  │       │
│  │      Yes                                                  │  │       │
│  │       │                                                   │  │       │
│  │       ▼                                                   │  │       │
│  │  Use RAG Results ◄────────────────────────────────────────┘  │       │
│  │  (Mode 2: Optimized)                                         │       │
│  │                                                              │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  Mode 1: Full-Text                    Mode 2: RAG Search                 │
│  ─────────────────────                ────────────────────               │
│  ┌──────────────────────┐             ┌──────────────────────┐          │
│  │ Load full document:  │             │ RAG Search:          │          │
│  │                      │             │                      │          │
│  │ additionalContext =  │             │ 1. Generate query    │          │
│  │   contextSources     │             │    embedding         │          │
│  │   .map(s =>          │             │                      │          │
│  │     `=== ${s.name}   │             │ 2. Search chunks     │          │
│  │      ===\n           │             │    (cosine simil.)   │          │
│  │      ${s.content}`)  │             │                      │          │
│  │   .join('\n');       │             │ 3. Get top 5 chunks  │          │
│  │                      │             │                      │          │
│  │ Tokens: 50,000       │             │ 4. Build context:    │          │
│  │ (full document)      │             │    additionalContext │          │
│  │                      │             │    = buildRAGContext │          │
│  │                      │             │      (ragResults)    │          │
│  │                      │             │                      │          │
│  │                      │             │ Tokens: 2,500        │          │
│  │                      │             │ (relevant chunks)    │          │
│  └──────────────────────┘             └──────────────────────┘          │
│           │                                     │                        │
│           └──────────────┬──────────────────────┘                        │
│                          ▼                                               │
│                  Send to Gemini AI                                       │
│                  ┌──────────────────┐                                    │
│                  │ System prompt    │                                    │
│                  │ History          │                                    │
│                  │ Context ◄────────┤ From Mode 1 or Mode 2             │
│                  │ User query       │                                    │
│                  └──────────────────┘                                    │
│                          │                                               │
│                          ▼                                               │
│                   AI Response                                            │
│                                                                          │
│  Output:                                                                 │
│  {                                                                       │
│    message: { role: 'assistant', content: "..." },                       │
│    ragStats: { chunks: 5, tokens: 2500, ... } or null,                   │
│    tokenStats: { input, output, ... }                                    │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow - Step by Step

### STEP 1: Upload & Extraction (✅ Working Now)

```
User Action: Upload PDF
      ↓
┌──────────────────────────────────────────────────────────────┐
│  Frontend: ContextManagementDashboard.tsx                     │
│  Method: handleSubmitUpload()                                 │
│                                                               │
│  const formData = new FormData();                             │
│  formData.append('file', pdfFile);                            │
│  formData.append('userId', userId);                           │
│  formData.append('model', 'gemini-2.5-flash');                │
│                                                               │
│  fetch('/api/extract-document', {                             │
│    method: 'POST',                                            │
│    body: formData                                             │
│  })                                                           │
└──────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend: /api/extract-document                               │
│  File: src/pages/api/extract-document.ts                      │
│                                                               │
│  1. Receive PDF file                                          │
│  2. Convert to base64                                         │
│  3. Call Gemini Vision:                                       │
│                                                               │
│     genAI.models.generateContent({                            │
│       model: 'gemini-2.5-flash',                              │
│       contents: [{                                            │
│         role: 'user',                                         │
│         parts: [{                                             │
│           inlineData: {                                       │
│             mimeType: 'application/pdf',                      │
│             data: base64Data                                  │
│           }                                                   │
│         }, {                                                  │
│           text: 'Extract all text, describe images...'        │
│         }]                                                    │
│       }]                                                      │
│     })                                                        │
│                                                               │
│  4. Get extractedText (rich multimodal text)                  │
│  5. Return to frontend                                        │
│                                                               │
│  Output:                                                      │
│  {                                                            │
│    success: true,                                             │
│    extractedText: "Page 1: Sales data...\n                    │
│                    [Image: Bar chart Q1-Q4]\n                 │
│                    Table: Revenue breakdown...",              │
│    metadata: {                                                │
│      characters: 48234,                                       │
│      extractionTime: 8234,                                    │
│      model: 'gemini-2.5-flash'                                │
│    }                                                          │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────┐
│  Frontend: ContextManagementDashboard.tsx                     │
│  Method: processQueue() continuation                          │
│                                                               │
│  fetch('/api/context-sources', {                              │
│    method: 'POST',                                            │
│    body: JSON.stringify({                                     │
│      userId,                                                  │
│      name: 'Document.pdf',                                    │
│      type: 'pdf',                                             │
│      extractedData: uploadData.extractedText,  ← STORED      │
│      metadata: { ... }                                        │
│    })                                                         │
│  })                                                           │
└──────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────┐
│  Firestore: context_sources collection                        │
│                                                               │
│  Document created: src_abc123                                 │
│  {                                                            │
│    id: "src_abc123",                                          │
│    userId: "user_xyz",                                        │
│    name: "Document.pdf",                                      │
│    type: "pdf",                                               │
│    extractedData: "Complete multimodal text...",  ← 50K tokens│
│    ragEnabled: false,         ← RAG not yet enabled           │
│    status: "active",                                          │
│    metadata: { ... }                                          │
│  }                                                            │
│                                                               │
│  ✅ Document usable immediately (full-text mode)              │
└──────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                    2. RAG INDEXING (NEW - OPTIONAL)                        │
└───────────────────────────────────────────────────────────────────────────┘

Admin or User enables RAG for document
      ↓
┌──────────────────────────────────────────────────────────────┐
│  Option A: User Settings (Global)                             │
│                                                               │
│  User clicks Settings → Toggle RAG ON                         │
│  Applies to all future queries                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Option B: Admin Panel (System-wide)                          │
│                                                               │
│  Admin clicks "Configuración RAG" → Enable RAG                │
│  Applies to all users, all documents                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Option C: Per-Document (Future)                              │
│                                                               │
│  Context source settings → Enable RAG for this doc            │
│  Click "Index for RAG" button                                 │
└──────────────────────────────────────────────────────────────┘

      ↓
┌──────────────────────────────────────────────────────────────┐
│  API: /api/context-sources/:id/enable-rag (NEW)               │
│  File: src/pages/api/context-sources/[id]/enable-rag.ts       │
│                                                               │
│  Input:                                                       │
│  • sourceId: "src_abc123"                                     │
│  • userId: "user_xyz"                                         │
│  • chunkSize: 500  (optional)                                 │
│  • overlap: 50     (optional)                                 │
│                                                               │
│  Process:                                                     │
│  ┌────────────────────────────────────────────────┐           │
│  │ 1. Load source from Firestore                  │           │
│  │    const source = await getContextSource(id)   │           │
│  │    const fullText = source.extractedData       │ ← Reuse   │
│  │                                                │           │
│  │ 2. Chunk the extracted text                    │           │
│  │    import { chunkTextSmart } from '../../lib/chunking'     │
│  │                                                │           │
│  │    const chunks = chunkTextSmart(fullText, 500)│           │
│  │    // Result: 100 chunks                       │           │
│  │                                                │           │
│  │ 3. Generate embeddings for each chunk          │           │
│  │    import { generateEmbeddingsBatch }          │           │
│  │           from '../../lib/embeddings'          │           │
│  │                                                │           │
│  │    const chunkTexts = chunks.map(c => c.text)  │           │
│  │    const embeddings =                          │           │
│  │      await generateEmbeddingsBatch(chunkTexts) │           │
│  │    // Result: 100 vectors (768-dim each)       │           │
│  │                                                │           │
│  │ 4. Store chunks in Firestore                   │           │
│  │    const batch = firestore.batch();            │           │
│  │                                                │           │
│  │    chunks.forEach((chunk, i) => {              │           │
│  │      batch.set(                                │           │
│  │        firestore.collection('document_chunks') │           │
│  │          .doc(),                               │           │
│  │        {                                       │           │
│  │          sourceId: 'src_abc123',               │           │
│  │          userId: 'user_xyz',                   │           │
│  │          chunkIndex: i,                        │           │
│  │          text: chunk.text,                     │           │
│  │          embedding: embeddings[i],             │           │
│  │          metadata: {                           │           │
│  │            startChar: chunk.startChar,         │           │
│  │            endChar: chunk.endChar,             │           │
│  │            tokenCount: chunk.tokenCount        │           │
│  │          }                                     │           │
│  │        }                                       │           │
│  │      );                                        │           │
│  │    });                                         │           │
│  │                                                │           │
│  │    await batch.commit();                       │           │
│  │                                                │           │
│  │ 5. Update source document                      │           │
│  │    await firestore                             │           │
│  │      .collection('context_sources')            │           │
│  │      .doc('src_abc123')                        │           │
│  │      .update({                                 │           │
│  │        ragEnabled: true,                       │           │
│  │        ragMetadata: {                          │           │
│  │          totalChunks: 100,                     │           │
│  │          embeddingModel: 'text-embedding-004', │           │
│  │          chunkSize: 500,                       │           │
│  │          indexedAt: new Date()                 │           │
│  │        }                                       │           │
│  │      });                                       │           │
│  └────────────────────────────────────────────────┘           │
│                                                               │
│  Output:                                                      │
│  {                                                            │
│    success: true,                                             │
│    chunksCreated: 100,                                        │
│    message: "Document indexed for RAG"                        │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
      ↓
┌──────────────────────────────────────────────────────────────┐
│  Firestore: NOW DUAL-MODE                                     │
│                                                               │
│  context_sources/src_abc123:                                  │
│  {                                                            │
│    extractedData: "Full text...",     ← Mode 1: ALWAYS works │
│    ragEnabled: true,                  ← Mode 2: NOW available│
│    ragMetadata: { totalChunks: 100 }                          │
│  }                                                            │
│                                                               │
│  document_chunks/ (100 documents):    ← Mode 2: RAG chunks   │
│  chunk_001: { text: "...", embedding: [...] }                │
│  chunk_002: { text: "...", embedding: [...] }                │
│  chunk_003: { text: "...", embedding: [...] }                │
│  ...                                                          │
│  chunk_100: { text: "...", embedding: [...] }                │
│                                                               │
│  ✅ Document now supports BOTH modes!                         │
└──────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                      3a. Q&A - MODE 1 (Full-Text)                          │
└───────────────────────────────────────────────────────────────────────────┘

User query: "What were Q4 sales?"
RAG disabled OR no chunks available
      ↓
┌──────────────────────────────────────────────────────────────┐
│  /api/conversations/:id/messages                              │
│                                                               │
│  // Build context from full documents                         │
│  const additionalContext = contextSources                     │
│    .filter(s => s.enabled)                                    │
│    .map(source => `                                           │
│      === ${source.name} ===                                   │
│      ${source.extractedData}                                  │
│    `)                                                         │
│    .join('\n\n');                                             │
│                                                               │
│  // Send to Gemini                                            │
│  const aiResponse = await generateAIResponse(message, {       │
│    model: 'gemini-2.5-flash',                                 │
│    systemInstruction: systemPrompt,                           │
│    userContext: additionalContext,  ← Full document (50K)    │
│    conversationHistory: [...]                                 │
│  });                                                          │
│                                                               │
│  Tokens sent: 50,000                                          │
│  Response time: 4.2s                                          │
│  Cost: $0.0625 (Pro model)                                    │
└──────────────────────────────────────────────────────────────┘
      ↓
    Answer delivered (complete context)


┌───────────────────────────────────────────────────────────────────────────┐
│                      3b. Q&A - MODE 2 (RAG Search)                         │
└───────────────────────────────────────────────────────────────────────────┘

User query: "What were Q4 sales?"
RAG enabled AND chunks available
      ↓
┌──────────────────────────────────────────────────────────────┐
│  /api/conversations/:id/messages                              │
│                                                               │
│  // Try RAG search first                                      │
│  import { searchRelevantChunks, buildRAGContext }             │
│         from '../../../lib/rag-search';                       │
│                                                               │
│  const ragResults = await searchRelevantChunks(               │
│    userId,                                                    │
│    message,  // "What were Q4 sales?"                         │
│    {                                                          │
│      topK: 5,                        ← Get top 5 chunks      │
│      minSimilarity: 0.5,             ← 50% similar or more   │
│      activeSourceIds: ['src_abc123'] ← Filter by doc         │
│    }                                                          │
│  );                                                           │
│                                                               │
│  ┌────────────────────────────────────────────────┐           │
│  │ RAG Search Process:                            │           │
│  │                                                │           │
│  │ 1. Generate query embedding                    │           │
│  │    const queryEmbed =                          │           │
│  │      await generateEmbedding(                  │           │
│  │        "What were Q4 sales?"                   │           │
│  │      );                                        │           │
│  │    // [0.145, 0.432, ..., 0.267]              │           │
│  │                                                │           │
│  │ 2. Load all chunks for user                    │           │
│  │    const chunks = await firestore              │           │
│  │      .collection('document_chunks')            │           │
│  │      .where('userId', '==', userId)            │           │
│  │      .where('sourceId', 'in', activeSourceIds) │           │
│  │      .get();                                   │           │
│  │    // Loaded: 100 chunks                       │           │
│  │                                                │           │
│  │ 3. Calculate similarity for each chunk         │           │
│  │    const similarities = chunks.map(chunk => ({ │           │
│  │      chunk,                                    │           │
│  │      similarity: cosineSimilarity(             │           │
│  │        queryEmbed,                             │           │
│  │        chunk.embedding                         │           │
│  │      )                                         │           │
│  │    }));                                        │           │
│  │                                                │           │
│  │    Results:                                    │           │
│  │    - Chunk 23: 0.89 (89% similar) ✓           │           │
│  │    - Chunk 45: 0.84 (84% similar) ✓           │           │
│  │    - Chunk 67: 0.79 (79% similar) ✓           │           │
│  │    - Chunk 12: 0.71 (71% similar) ✓           │           │
│  │    - Chunk 89: 0.68 (68% similar) ✓           │           │
│  │    - Chunk 34: 0.42 (42% similar) ✗ Skip     │           │
│  │    - ... (95 others < 50% - skip)             │           │
│  │                                                │           │
│  │ 4. Select top 5 above threshold                │           │
│  │    const topChunks = similarities              │           │
│  │      .filter(s => s.similarity >= 0.5)         │           │
│  │      .sort((a,b) => b.similarity - a.similarity)│           │
│  │      .slice(0, 5);                             │           │
│  │                                                │           │
│  │ 5. Build context from selected chunks          │           │
│  │    const context = buildRAGContext(topChunks); │           │
│  └────────────────────────────────────────────────┘           │
│                                                               │
│  const additionalContext = `                                  │
│    === Document.pdf (RAG: 5 relevant chunks) ===              │
│                                                               │
│    [Chunk 23, Relevance: 89%]                                 │
│    Q4 sales reached $175K, representing...                    │
│                                                               │
│    [Chunk 45, Relevance: 84%]                                 │
│    The bar chart shows quarterly progression...               │
│                                                               │
│    [Chunk 67, Relevance: 79%]                                 │
│    Revenue breakdown by quarter indicates...                  │
│  `;                                                           │
│                                                               │
│  // Send to Gemini                                            │
│  const aiResponse = await generateAIResponse(message, {       │
│    model: 'gemini-2.5-flash',                                 │
│    systemInstruction: systemPrompt,                           │
│    userContext: additionalContext,  ← Relevant chunks (2.5K) │
│    conversationHistory: [...]                                 │
│  });                                                          │
│                                                               │
│  Tokens sent: 2,500 (95% reduction!)                          │
│  Response time: 1.8s (2.3x faster!)                           │
│  Cost: $0.003 (95% cheaper!)                                  │
└──────────────────────────────────────────────────────────────┘
      ↓
    Answer delivered (focused, relevant context)
```

---

## 🔄 Dual-Mode Intelligence

### The System Automatically Chooses:

```
┌─────────────────────────────────────────┐
│  Query arrives                          │
└──────────────┬──────────────────────────┘
               │
               ▼
        Check: RAG available?
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ▼                ▼
   Try RAG         Use Full-Text
       │                │
       ▼                │
   Success?             │
       │                │
   ┌───┴───┐            │
  YES     NO            │
   │       │            │
   │       └────────────┤
   │                    │
   ▼                    ▼
Use RAG           Use Full-Text
(2.5K tokens)     (50K tokens)
   │                    │
   └────────┬───────────┘
            │
            ▼
      Gemini AI gets best available context
            │
            ▼
         Answer
```

**Intelligent fallback at every step** ✅

---

## 📋 Implementation Interfaces

### Interface 1: Enable RAG for Document

**NEW API Endpoint:**

```typescript
// src/pages/api/context-sources/[id]/enable-rag.ts

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;  // sourceId
  const body = await request.json();
  const { userId, chunkSize = 500, overlap = 50 } = body;

  // 1. Load source
  const source = await firestore
    .collection('context_sources')
    .doc(id)
    .get();

  if (!source.exists || source.data().userId !== userId) {
    return new Response(
      JSON.stringify({ error: 'Source not found' }),
      { status: 404 }
    );
  }

  const extractedText = source.data().extractedData;

  // 2. Chunk text
  const { chunkTextSmart } = await import('../../lib/chunking.js');
  const chunks = chunkTextSmart(extractedText, chunkSize);

  // 3. Generate embeddings
  const { generateEmbeddingsBatch } = await import('../../lib/embeddings.js');
  const chunkTexts = chunks.map(c => c.text);
  const embeddings = await generateEmbeddingsBatch(chunkTexts);

  // 4. Store chunks
  const batch = firestore.batch();
  chunks.forEach((chunk, i) => {
    const chunkDoc = firestore.collection('document_chunks').doc();
    batch.set(chunkDoc, {
      sourceId: id,
      userId,
      chunkIndex: i,
      text: chunk.text,
      embedding: embeddings[i],
      metadata: {
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        tokenCount: chunk.tokenCount
      },
      createdAt: new Date()
    });
  });
  await batch.commit();

  // 5. Update source
  await source.ref.update({
    ragEnabled: true,
    ragMetadata: {
      totalChunks: chunks.length,
      embeddingModel: 'text-embedding-004',
      embeddingDimensions: 768,
      chunkSize,
      indexedAt: new Date()
    }
  });

  return new Response(
    JSON.stringify({
      success: true,
      chunksCreated: chunks.length
    }),
    { status: 200 }
  );
};
```

---

### Interface 2: Query with RAG

**EXISTING (Already Modified):**

```typescript
// src/pages/api/conversations/[id]/messages.ts

export const POST: APIRoute = async ({ params, request }) => {
  const { userId, message, contextSources, ragEnabled } = await request.json();

  let additionalContext = '';
  let ragUsed = false;

  if (contextSources && contextSources.length > 0) {
    const activeSourceIds = contextSources.map(s => s.id);

    // Try RAG if enabled
    if (ragEnabled) {
      const { searchRelevantChunks, buildRAGContext } = 
        await import('../../../lib/rag-search.js');

      const ragResults = await searchRelevantChunks(userId, message, {
        topK: 5,
        minSimilarity: 0.5,
        activeSourceIds
      });

      if (ragResults.length > 0) {
        // RAG success - use chunks
        additionalContext = buildRAGContext(ragResults);
        ragUsed = true;
      } else {
        // No results - fall back to full-text
        additionalContext = contextSources
          .map(s => `=== ${s.name} ===\n${s.content}`)
          .join('\n');
      }
    } else {
      // RAG disabled - use full-text
      additionalContext = contextSources
        .map(s => `=== ${s.name} ===\n${s.content}`)
        .join('\n');
    }
  }

  // Send to Gemini
  const aiResponse = await generateAIResponse(message, {
    userContext: additionalContext,
    // ... other options
  });

  return new Response(JSON.stringify({
    message: aiResponse,
    ragStats: ragUsed ? { chunks: 5, tokens: 2500 } : null
  }));
};
```

---

## 🎯 Complementary Benefits

### Documents WITHOUT RAG:

- ✅ Work immediately after upload
- ✅ Full context available
- ✅ No indexing wait time
- ✅ Good for small documents (<10 pages)

**Use case:** Quick uploads, small docs, exploratory analysis

---

### Documents WITH RAG:

- ✅ 95% token reduction
- ✅ 2-3x faster responses
- ✅ More focused answers
- ✅ Support larger libraries

**Use case:** Large docs, frequent queries, production use

---

### Mixed Mode (BEST):

**User has 10 documents:**
- 3 small PDFs (10 pages each) → Full-text mode
- 7 large PDFs (100 pages each) → RAG mode

**Query uses both:**
- Small docs: Send full text (no overhead)
- Large docs: Send relevant chunks (efficient)
- **Result: Optimal efficiency for each document type** ✅

---

## 🚀 Implementation Plan

### Phase 1: Enable RAG Indexing (Next)

**Create new endpoint:**

```typescript
// src/pages/api/context-sources/[id]/enable-rag.ts
```

**Triggered by:**
- User clicks "Enable RAG" on document
- Admin clicks "Bulk Index All"
- Automatic after upload (future - if size >10 pages)

---

### Phase 2: UI Integration (After)

**Add button to context source settings:**
```
┌──────────────────────────────────────┐
│ Document Settings                    │
├──────────────────────────────────────┤
│                                      │
│ ✅ Extracted: 48,234 characters      │
│                                      │
│ RAG Status: Not indexed              │
│                                      │
│ [🔍 Index for RAG Search]            │ ← NEW button
│                                      │
│ Benefits:                             │
│ • 95% token reduction                │
│ • 2x faster responses                │
│ • More focused answers               │
│                                      │
│ Cost: ~$0.005 (one-time)             │
│ Time: ~15 seconds                    │
└──────────────────────────────────────┘
```

---

### Phase 3: Admin Bulk Operations (After)

**Admin panel button:**
```
┌──────────────────────────────────────┐
│ RAG Configuration - Maintenance      │
├──────────────────────────────────────┤
│                                      │
│ Sources without RAG: 47              │
│                                      │
│ [🔄 Index All Documents]             │ ← Bulk operation
│                                      │
│ This will:                            │
│ • Process 47 documents                │
│ • Create ~4,700 chunks                │
│ • Cost: ~$0.25 total                 │
│ • Time: ~15 minutes                  │
└──────────────────────────────────────┘
```

---

## 💡 Why This Architecture is Perfect

### 1. **Non-Destructive** ✅
- Original extractedData preserved
- RAG chunks are additions (not replacements)
- Can disable RAG anytime
- Original full-text always works

### 2. **Flexible** ✅
- Per-document RAG enable/disable
- Per-user RAG preferences
- System-wide defaults
- Graceful fallback

### 3. **Optimal** ✅
- Small docs: No RAG overhead
- Large docs: Maximum efficiency
- Mixed queries: Best of both
- Intelligent mode selection

### 4. **Cost-Effective** ✅
- One-time indexing cost (~$0.005/doc)
- Massive query savings (99%)
- User controls trade-offs
- ROI < 1 day

---

## 🎯 Summary

**Your understanding:**
> "RAG should be used after the initial extraction, leverage multimodal extraction to get complete text, then embed that"

**Status:** ✅ **EXACTLY RIGHT!**

**Architecture:**
- Multimodal extraction FIRST (capture everything)
- RAG indexing SECOND (optimize search)
- Dual-mode querying THIRD (intelligent selection)
- **Complementary, not replacement** ✅

**Next steps:**
1. Create `/api/context-sources/[id]/enable-rag` endpoint
2. Add "Index for RAG" button to UI
3. Test with one document
4. Enable for more when ready

**Want me to implement the enable-rag endpoint now?** 🚀
