# Document AI High-Precision RAG Pipeline - Implementation Plan

## 🎯 Objective

Build a production-grade, high-precision RAG system using Google Cloud Document AI and BigQuery Vector Search to correctly handle complex PDFs with tables, diagrams, and structured content.

## ❌ Current Problems

### 1. Simple Text Extraction Destroys Structure
```
Table in PDF:
┌─────────────┬────────┬─────────────┐
│ Intensidad  │ Valor  │ Descripción │
├─────────────┼────────┼─────────────┤
│ Baja        │   1    │ Menor...    │
│ Media       │   3    │ Notoria...  │
│ Alta        │   5    │ Extensa...  │
└─────────────┴────────┴─────────────┘

Current extraction (scrambled):
"Intensidad Baja Media Alta Valor 1 3 5 Descripción Menor Notoria Extensa"

❌ Semantic structure lost
❌ Impossible to understand
❌ RAG retrieval will fail
```

### 2. Fixed-Size Chunking Breaks Semantic Units
```
Current chunking (1000 tokens):
Chunk 1: "...final de párrafo 1. Criterio de evaluación: Intensidad (I) Valor 1: Baja, cuando la alteración..."
Chunk 2: "...es menor. Valor 3: Media, cuando..."

❌ Table row split across chunks
❌ Context lost
❌ Cannot answer "What is Valor 3?"
```

### 3. No Vector Search
- Current: Load ALL documents → Send ALL to AI
- Cost: High (unnecessary tokens)
- Latency: High (large context)
- Quality: Lower (too much noise)

## ✅ Required Solution: 5-Phase Pipeline

### Phase 1: Document AI Ingestion ⭐ CRITICAL

**Goal:** Parse PDF into structured JSON with layout, tables, paragraphs

**Service:** Google Cloud Document AI  
**Processor:** Document OCR Processor  
**Input:** PDF in Cloud Storage  
**Output:** `document.json` with complete structure

```typescript
// document.json structure
{
  pages: [
    {
      pageNumber: 1,
      paragraphs: [
        { text: "...", boundingBox: {...} }
      ],
      tables: [
        {
          rows: [
            { cells: [
              { text: "Intensidad", colSpan: 1 },
              { text: "Valor", colSpan: 1 },
              { text: "Descripción", colSpan: 1 }
            ]},
            { cells: [
              { text: "Baja", colSpan: 1 },
              { text: "1", colSpan: 1 },
              { text: "Menor alteración...", colSpan: 1 }
            ]}
          ]
        }
      ],
      blocks: [
        { text: "IDENTIFICACIÓN", blockType: "diagram_node" }
      ]
    }
  ]
}
```

### Phase 2: Intelligent Chunking ⭐ CRITICAL

**Goal:** Convert structured JSON into semantic chunks

**Chunking Strategy:**

```typescript
// 1. Text chunks (by paragraph)
{
  type: 'paragraph',
  content: "Complete paragraph text...",
  metadata: { page: 1, section: "Introducción" }
}

// 2. Table chunks (linearized per row)
{
  type: 'table_row',
  content: "Criterio de Evaluación: Intensidad (I). Valor: 1. Nivel: Baja. Descripción: cuando la alteración de la componente ambiental es menor.",
  metadata: { 
    page: 3, 
    table: "Criterios de Evaluación",
    row: 2
  }
}

// 3. Diagram chunks (with context)
{
  type: 'diagram',
  content: "ANEXO 1: DIAGRAMA DE FLUJO DE LA GESTIÓN DEL RIESGO. El flujo comienza con IDENTIFICACIÓN → PELIGROS → EVALUACIÓN DE RIESGOS → VALORACIÓN → MEDIDAS DE CONTROL.",
  metadata: {
    page: 15,
    diagram: "Flujo de Gestión"
  }
}
```

**Key Insight:** Each semantic unit becomes one chunk, regardless of size.

### Phase 3: Embedding Generation

**Goal:** Convert each chunk into a 768-dimensional vector

**Service:** Vertex AI Embeddings API  
**Model:** `text-multilingual-embedding-002` (Spanish support)  
**Batch:** Process 100 chunks at a time for efficiency

```typescript
// For each chunk
const embedding = await vertexAI.embed({
  model: 'text-multilingual-embedding-002',
  content: chunk.content
});

// Result: float64[768]
```

### Phase 4: BigQuery Vector Store

**Goal:** Store chunks + embeddings in searchable database

**Schema:**
```sql
CREATE TABLE `salfagpt.rag_documents.document_chunks` (
  -- Identity
  chunk_id STRING NOT NULL,
  source_id STRING NOT NULL,
  user_id STRING NOT NULL,
  
  -- Content
  content STRING,
  chunk_type STRING, -- 'paragraph', 'table_row', 'diagram'
  
  -- Metadata
  source_document STRING,
  page_number INT64,
  section_title STRING,
  table_name STRING,
  
  -- Vector
  embedding ARRAY<FLOAT64>, -- 768 dimensions
  
  -- Timestamps
  created_at TIMESTAMP,
  indexed_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, source_id;

-- Create vector index for fast search
CREATE VECTOR INDEX chunk_vector_index
ON `salfagpt.rag_documents.document_chunks`(embedding)
OPTIONS(
  index_type = 'IVF',
  distance_type = 'COSINE',
  ivf_options = '{"num_lists": 1000}'
);
```

### Phase 5: RAG Search & Retrieval

**Goal:** Find relevant chunks for user query

**Query Flow:**
```sql
-- 1. Embed user query
DECLARE query_embedding ARRAY<FLOAT64>;
SET query_embedding = (
  SELECT embedding 
  FROM ML.GENERATE_EMBEDDING(
    MODEL `salfagpt.embedding_model`,
    (SELECT '¿Cuál es la fórmula de Severidad?' AS content)
  )
);

-- 2. Search similar chunks
SELECT
  chunk_id,
  content,
  chunk_type,
  page_number,
  distance
FROM VECTOR_SEARCH(
  TABLE `salfagpt.rag_documents.document_chunks`,
  'embedding',
  query_embedding,
  top_k => 5,
  distance_type => 'COSINE'
)
WHERE user_id = 'user-123'
ORDER BY distance ASC
LIMIT 5;

-- Result: Top 5 most relevant chunks
```

**Then send to Gemini:**
```typescript
const context = results.map(r => r.content).join('\n\n---\n\n');

const response = await gemini.generateContent({
  model: 'gemini-2.5-pro',
  contents: [{
    role: 'user',
    parts: [{
      text: `Context:\n${context}\n\nQuestion:\n${userQuery}\n\nAnswer based only on context:`
    }]
  }]
});
```

## 📦 Required Packages

### Install Document AI
```bash
npm install @google-cloud/documentai
npm install @google-cloud/bigquery
npm install @google-cloud/aiplatform # For Vertex AI embeddings
```

### Environment Variables
```bash
# .env (add these)
GOOGLE_CLOUD_PROJECT=salfagpt
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
DOCUMENT_AI_LOCATION=us
BIGQUERY_DATASET_ID=rag_documents
```

## 🏗️ Implementation Phases

### Phase 1: Document AI Setup (Day 1)

**Tasks:**
1. Enable Document AI API in GCP Console
2. Create Document OCR Processor
3. Install npm package
4. Create service account with permissions
5. Test basic PDF upload → Document AI processing

**Files:**
- `src/lib/document-ai-extraction.ts` (NEW)
- `scripts/setup-document-ai.ts` (NEW)
- `docs/DOCUMENT_AI_SETUP.md` (NEW)

### Phase 2: Intelligent Chunking (Day 2)

**Tasks:**
1. Parse Document AI JSON
2. Implement table linearization
3. Implement diagram context preservation
4. Implement paragraph-aware chunking
5. Test with SSOMA PDF

**Files:**
- `src/lib/intelligent-chunking.ts` (NEW)
- `tests/chunking.test.ts` (NEW)

### Phase 3: BigQuery Vector Store (Day 3)

**Tasks:**
1. Create BigQuery dataset
2. Create table schema
3. Create vector index
4. Implement upload pipeline
5. Test indexing

**Files:**
- `src/lib/bigquery-vector-store.ts` (NEW)
- `sql/create-vector-table.sql` (NEW)

### Phase 4: Vertex AI Embeddings (Day 4)

**Tasks:**
1. Enable Vertex AI API
2. Deploy embedding model
3. Implement batch embedding generation
4. Test with chunks
5. Monitor costs

**Files:**
- `src/lib/vertex-embeddings.ts` (NEW)
- `scripts/test-embeddings.ts` (NEW)

### Phase 5: RAG Search Integration (Day 5)

**Tasks:**
1. Implement VECTOR_SEARCH query
2. Integrate with chat API
3. Update context loading
4. Test end-to-end
5. Performance benchmarks

**Files:**
- `src/lib/bigquery-rag-search.ts` (NEW)
- `src/pages/api/rag-search.ts` (NEW)

## 💰 Cost Comparison

### Current (Gemini Flash):
- **Extraction**: ~$0.10 per PDF (394K input tokens @ $0.075/1M + 18K output @ $0.30/1M)
- **Context per query**: ~$0.05 (50K tokens @ $1.00/1M)
- **Total for 100 queries**: $5.10

### New (Document AI + BigQuery):
- **Extraction (one-time)**: $0.015 per PDF (10 pages @ $1.50/1000 pages)
- **Indexing (one-time)**: $0.0001 per PDF (50K tokens @ $0.00002/1K for embeddings)
- **Search per query**: $0.01 (BigQuery query cost)
- **Context per query**: $0.01 (5K tokens @ $1.00/1M, 90% reduction)
- **Total for 100 queries**: $1.01 + $0.015 + $0.0001 = **$1.03** (80% savings)

## 📊 Performance Comparison

### Current:
- **Context tokens**: 50,000
- **Retrieval time**: N/A (loads everything)
- **AI response time**: 8-15s (large context)
- **Total latency**: 8-15s

### New:
- **Context tokens**: 2,500 (95% reduction)
- **Retrieval time**: 200-500ms (BigQuery vector search)
- **AI response time**: 2-4s (small, focused context)
- **Total latency**: 2.5-4.5s (60% improvement)

## 🎯 Success Criteria

### Extraction Quality
- ✅ Tables preserved with row/column structure
- ✅ Diagrams described with context
- ✅ Formulas extracted correctly
- ✅ Page numbers tracked

### Retrieval Precision
- ✅ Can answer "What is Valor 3?" → Returns correct table row
- ✅ Can answer "What is Severidad formula?" → Returns exact formula
- ✅ Can answer diagram questions → Returns flowchart description

### Performance
- ✅ Retrieval < 500ms (p95)
- ✅ Total latency < 5s (p95)
- ✅ 90% context reduction
- ✅ 80% cost reduction

## 🚧 Migration Strategy

### Step 1: Parallel Implementation (Weeks 1-2)
- Build new pipeline alongside current system
- Feature flag: `USE_DOCUMENT_AI=false` (default)
- Test with subset of documents

### Step 2: Gradual Rollout (Week 3)
- Enable for new uploads only
- Monitor quality and performance
- Compare results side-by-side

### Step 3: Full Migration (Week 4)
- Enable for all new uploads
- Offer re-indexing tool for existing documents
- Deprecate old chunking method

### Step 4: Cleanup (Week 5)
- Remove old Vision API extraction
- Remove simple chunking
- Archive old code

## 📋 Immediate Next Steps

### This Session:
1. Install Document AI package
2. Create basic extraction module
3. Test Document AI API connection
4. Parse first PDF with Document AI

### Tomorrow:
1. Implement table linearization
2. Implement diagram chunking
3. Test chunking quality

### This Week:
1. Set up BigQuery vector table
2. Implement Vertex AI embeddings
3. End-to-end pipeline test

## 🔗 References

- [Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [BigQuery Vector Search](https://cloud.google.com/bigquery/docs/vector-search)
- [Vertex AI Embeddings](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)

---

**Status**: Planning Complete  
**Next**: Install packages and implement Phase 1  
**ETA**: 5 days for complete implementation  
**Priority**: CRITICAL (blocks high-quality RAG)

