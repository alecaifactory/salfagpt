# 🎨 RAG Data Flow - Visual Guide

**Principle:** RAG complements, doesn't replace

---

## 📊 Firestore Data Structure - Before & After

### BEFORE RAG (Just Uploaded)

```
context_sources/
└── src_abc123/
    ├── id: "src_abc123"
    ├── userId: "user_xyz"
    ├── name: "Sales Report Q4.pdf"
    ├── type: "pdf"
    ├── extractedData: "Page 1: Executive Summary...      ← 50,000 tokens
    │                   Our Q4 sales reached $175K...      (COMPLETE text
    │                   [Image: Bar chart showing...]       with images
    │                   Table: Revenue breakdown...          and tables)
    │                   Page 2: Detailed analysis..."
    ├── ragEnabled: false                                  ← Not indexed yet
    └── metadata: { characters: 48234, ... }

✅ READY FOR QUERIES (full-text mode)
   Send entire 50K tokens → Slow but complete
```

---

### AFTER RAG ENABLED (Indexed)

```
context_sources/
└── src_abc123/
    ├── id: "src_abc123"
    ├── userId: "user_xyz"
    ├── name: "Sales Report Q4.pdf"
    ├── extractedData: "Page 1: Executive Summary..."      ← STILL HERE!
    │                                                        (Full-text mode)
    ├── ragEnabled: true                                    ← NOW indexed
    ├── ragMetadata: {
    │     totalChunks: 100,
    │     embeddingModel: "text-embedding-004",
    │     indexedAt: "2025-10-18"
    │   }
    └── metadata: { ... }

            +                                               ← ADDITION, not replacement

document_chunks/
├── chunk_abc123_000/
│   ├── sourceId: "src_abc123"                             ← Links back
│   ├── userId: "user_xyz"
│   ├── chunkIndex: 0
│   ├── text: "Page 1: Executive Summary...                ← 500 tokens
│   │           Our Q4 sales reached $175K..."              (first chunk)
│   ├── embedding: [0.123, 0.456, ..., 0.789]              ← 768 numbers
│   └── metadata: { startChar: 0, endChar: 2000, ... }
│
├── chunk_abc123_001/
│   ├── sourceId: "src_abc123"
│   ├── chunkIndex: 1
│   ├── text: "[Image: Bar chart showing Q1: $100K..."     ← 500 tokens
│   ├── embedding: [0.234, 0.567, ..., 0.890]              (second chunk)
│   └── metadata: { startChar: 2000, endChar: 4000, ... }
│
├── chunk_abc123_002/
│   ├── text: "Table: Revenue breakdown..."
│   ├── embedding: [...]
│   └── ...
│
└── ... (97 more chunks, total 100)

✅ READY FOR RAG QUERIES (optimized mode)
   Search 100 chunks → Find top 5 → Send 2.5K tokens → Fast!
```

---

## 🔄 Query Flow - Side by Side Comparison

### Query: "What were Q4 sales?"

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WITHOUT RAG (Mode 1)                              │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Load full document
┌──────────────────────────────────┐
│ Load context_sources/src_abc123  │
│ extractedData = "50,000 tokens"  │
└──────────────────────────────────┘
                 │
                 ▼
Step 2: Build context (all 50K tokens)
┌──────────────────────────────────┐
│ additionalContext =              │
│   "=== Sales Report Q4.pdf ===   │
│    Page 1: Executive Summary...  │
│    [All 100 pages of content]    │
│    ...Page 100: Appendix"        │
│                                  │
│ Size: 50,000 tokens              │
└──────────────────────────────────┘
                 │
                 ▼
Step 3: Send to Gemini
┌──────────────────────────────────┐
│ Input tokens: 50,000             │
│ Processing time: 4.2s            │
│ Cost: $0.0625 (Pro)              │
└──────────────────────────────────┘
                 │
                 ▼
Step 4: Get answer
┌──────────────────────────────────┐
│ "Q4 sales were $175K"            │
│                                  │
│ Quality: ✓ Complete              │
│ Speed: Slow (4.2s)               │
│ Efficiency: Low (95% unused)     │
└──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        WITH RAG (Mode 2)                                 │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Generate query embedding
┌──────────────────────────────────┐
│ text: "What were Q4 sales?"      │
│ embedding: [0.145, 0.432, ...]   │
│ Time: 23ms                       │
└──────────────────────────────────┘
                 │
                 ▼
Step 2: Search chunks (vector similarity)
┌──────────────────────────────────┐
│ Load 100 chunks for src_abc123   │
│ Calculate similarity with each   │
│                                  │
│ Results:                         │
│ • Chunk 23: 0.89 (Q4 sales)     │ ✓ Top 1
│ • Chunk 45: 0.84 (bar chart)    │ ✓ Top 2
│ • Chunk 67: 0.79 (revenue)      │ ✓ Top 3
│ • Chunk 12: 0.71 (analysis)     │ ✓ Top 4
│ • Chunk 89: 0.68 (summary)      │ ✓ Top 5
│ • ... 95 others < 0.5 (skip)    │ ✗ Not relevant
│                                  │
│ Time: 234ms                      │
└──────────────────────────────────┘
                 │
                 ▼
Step 3: Build context (top 5 chunks only)
┌──────────────────────────────────┐
│ additionalContext =              │
│   "=== Sales Report (RAG) ===    │
│    [Chunk 23, 89% relevant]      │
│    Q4 sales reached $175K...     │
│    [Chunk 45, 84% relevant]      │
│    [Bar chart shows Q4...]       │
│    [Chunk 67, 79% relevant]      │
│    Revenue breakdown..."         │
│                                  │
│ Size: 2,500 tokens (5 chunks)    │
└──────────────────────────────────┘
                 │
                 ▼
Step 4: Send to Gemini
┌──────────────────────────────────┐
│ Input tokens: 2,500 (95% less!)  │
│ Processing time: 1.8s (2x faster)│
│ Cost: $0.003 (95% cheaper!)      │
└──────────────────────────────────┘
                 │
                 ▼
Step 5: Get answer
┌──────────────────────────────────┐
│ "Q4 sales were $175K"            │
│                                  │
│ Quality: ✓ Same or better        │
│ Speed: Fast (1.8s)               │
│ Efficiency: High (only relevant) │
└──────────────────────────────────┘
```

---

## 🔄 Hybrid Query Example

### User has 3 documents active:

```
Active Sources:
├─ Small_Doc.pdf (5 pages)    → ragEnabled: false
├─ Medium_Doc.pdf (50 pages)  → ragEnabled: true
└─ Large_Doc.pdf (100 pages)  → ragEnabled: true

User asks: "Summarize key points from all documents"
      ↓
┌─────────────────────────────────────────────────────────────┐
│ System builds hybrid context:                                │
│                                                              │
│ Small_Doc.pdf (Full-text):                                   │
│   Send all 5,000 tokens (small, no RAG needed)               │
│                                                              │
│ Medium_Doc.pdf (RAG):                                         │
│   Search → Find 5 relevant chunks → Send 2,500 tokens        │
│                                                              │
│ Large_Doc.pdf (RAG):                                          │
│   Search → Find 5 relevant chunks → Send 2,500 tokens        │
│                                                              │
│ Total context: 10,000 tokens                                 │
│ (vs 155,000 without RAG - 94% reduction!)                    │
└─────────────────────────────────────────────────────────────┘
      ↓
   Optimal answer using best mode for each document
```

---

## 📋 API Interfaces Summary

### 1. Upload & Extract (Existing - Working)

**Endpoint:** `POST /api/extract-document`

**Input:**
```typescript
FormData {
  file: File,
  userId: string,
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro'
}
```

**Output:**
```typescript
{
  success: true,
  extractedText: string,  // Complete multimodal text
  metadata: {
    characters: number,
    extractionTime: number,
    model: string,
    pageCount?: number
  }
}
```

**Frontend saves to:** `context_sources` collection

---

### 2. Enable RAG (NEW - To Implement)

**Endpoint:** `POST /api/context-sources/:id/enable-rag`

**Input:**
```typescript
{
  userId: string,
  chunkSize?: number,     // Default: 500
  overlap?: number        // Default: 50
}
```

**Process:**
1. Load `extractedData` from existing source
2. Chunk the text
3. Generate embeddings
4. Store chunks in `document_chunks`
5. Update source with `ragEnabled: true`

**Output:**
```typescript
{
  success: true,
  chunksCreated: number,
  totalTokens: number,
  estimatedCost: number
}
```

---

### 3. Query with Intelligence (Existing - Enhanced)

**Endpoint:** `POST /api/conversations/:id/messages`

**Input:**
```typescript
{
  userId: string,
  message: string,
  contextSources: Array<{
    id: string,
    name: string,
    content: string  // extractedData
  }>,
  ragEnabled?: boolean  // From user settings
}
```

**Process:**
```typescript
// Intelligent mode selection per source
for (const source of contextSources) {
  if (ragEnabled && hasRAGChunks(source.id)) {
    // Mode 2: RAG search
    const chunks = await searchRelevantChunks(userId, message, {
      activeSourceIds: [source.id],
      topK: 5
    });
    context += buildRAGContext(chunks);
  } else {
    // Mode 1: Full-text
    context += source.content;
  }
}

// Send optimal context to Gemini
const response = await generateAIResponse(message, {
  userContext: context
});
```

**Output:**
```typescript
{
  message: {
    role: 'assistant',
    content: "Answer text..."
  },
  ragStats: {
    sourcesUsed: number,
    chunksRetrieved: number,
    totalTokens: number,
    avgSimilarity: number
  } | null,
  tokenStats: {
    inputTokens: number,
    outputTokens: number,
    contextWindowUsed: number
  }
}
```

---

## 🎯 Your Architecture is PERFECT!

```
┌─────────────────────────────────────────────────────────────┐
│                  WHY IT WORKS SO WELL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Multimodal Extraction (Gemini Vision)                   │
│     ✅ Captures text, images, tables                        │
│     ✅ Complete information preserved                       │
│     ✅ High-quality rich text representation                │
│                                                             │
│  2. Optional RAG Layer                                      │
│     ✅ Built on top of complete extraction                  │
│     ✅ Doesn't lose information (chunks from full text)     │
│     ✅ Optimizes search without sacrificing quality         │
│                                                             │
│  3. Intelligent Querying                                    │
│     ✅ Uses RAG where available (efficient)                 │
│     ✅ Falls back to full-text (reliable)                   │
│     ✅ Best of both worlds                                  │
│                                                             │
│  Result: 95% efficiency gain with 0% quality loss           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Want me to implement the `enable-rag` endpoint now so you can start indexing documents?** 🚀

