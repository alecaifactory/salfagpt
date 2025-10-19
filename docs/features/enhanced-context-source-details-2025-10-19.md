# Enhanced Context Source Details Modal

**Created:** 2025-10-19  
**Status:** ✅ Implemented  
**Branch:** main  
**Feature Type:** UI Enhancement  

---

## 🎯 Objective

Enhance the context source details modal to display comprehensive information about document extraction, chunking, and embedding processes. This allows users to evaluate the quality of each document's processing directly within the interface.

---

## 📋 What Was Implemented

### 1. Wider Modal Layout

**Before:** `max-w-2xl` (672px)  
**After:** `max-w-6xl` (1152px)  

**Why:** Accommodate comprehensive content display without overcrowding

### 2. Two-Column Layout

**Left Column - Metadata & Status:**
- Extraction information (model, size, characters, tokens, time, cost)
- Cloud Storage status with file viewer
- RAG indexing status with detailed statistics
- Re-index functionality

**Right Column - Content & Analysis:**
- Full extracted text viewer (collapsible)
- Chunks list with expandable details
- Individual chunk text and embedding vectors

### 3. New API Endpoint

**Endpoint:** `GET /api/context-sources/:id/chunks`

**Purpose:** Fetch all chunks and embeddings for a specific context source

**Response:**
```typescript
{
  chunks: ChunkData[];      // All chunks with embeddings
  stats: {
    totalChunks: number;
    totalTokens: number;
    avgChunkSize: number;
    embeddingDimensions: number;
  };
  sourceId: string;
  sourceName: string;
}
```

**Security:** 
- Requires authentication
- Verifies user ownership of source
- Filters by userId for data isolation

### 4. Enhanced Display Components

#### Extraction Information
- Model used (with Sparkles icon)
- File size
- Characters extracted
- Tokens estimated
- Extraction time (seconds)
- Extraction cost (USD)

#### RAG Statistics (Auto-loaded when RAG enabled)
- Total chunks created
- Total tokens across all chunks
- Average chunk size
- Embedding dimensions (768 for text-embedding-004)
- Index creation date

#### Extracted Text Viewer
- Collapsible section
- Character count display
- Copy to clipboard button
- Scrollable pre-formatted text
- Monospace font for readability

#### Chunks Viewer
- Collapsible list of all chunks
- Each chunk shows:
  - Chunk number (1-indexed)
  - Token count
  - Page numbers (if available)
  - Text preview (2 lines)
- Expandable chunk details:
  - Full chunk text
  - Embedding vector preview (first 10 dimensions)
  - Character position in original document
  - Creation timestamp
  - Copy buttons for text and vector

---

## 🎨 Design Principles

### Minimalist & Clean
- White backgrounds for content
- Gray backgrounds for sections (slate-50)
- Subtle borders (slate-200)
- Consistent padding and spacing

### Progressive Disclosure
- Collapsible sections (text, chunks)
- Expandable individual chunks
- Show/hide toggles with chevron icons
- Default state: collapsed (reduced cognitive load)

### Color Coding
- **Blue:** Primary actions and highlights
- **Green:** Success states, RAG enabled
- **Gray/Slate:** Neutral information
- **Amber:** Warnings (file not available)
- **Red:** Errors (when applicable)

### Typography
- Headers: `text-sm font-semibold`
- Body: `text-xs` or `text-sm`
- Metadata: `text-[10px]`
- Monospace for code/vectors: `font-mono`

---

## 🔧 Technical Implementation

### Component Structure

```typescript
// State management
const [chunksData, setChunksData] = useState<ChunksResponse | null>(null);
const [loadingChunks, setLoadingChunks] = useState(false);
const [showExtractedText, setShowExtractedText] = useState(false);
const [showChunks, setShowChunks] = useState(false);
const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);

// Load chunks when modal opens and RAG is enabled
useEffect(() => {
  if (isOpen && source && source.ragEnabled) {
    loadChunks();
  }
}, [isOpen, source?.id, source?.ragEnabled]);
```

### Data Flow

```
Modal Opens
    ↓
Check if RAG enabled
    ↓
Fetch /api/context-sources/:id/chunks
    ↓
Display statistics
    ↓
User can expand sections
    ↓
View chunks, embeddings, text
```

---

## 📊 Information Architecture

### Left Column (Status & Control)
```
Información de Extracción
  ├─ Modelo: gemini-2.5-flash
  ├─ Tamaño: 250 KB
  ├─ Caracteres: 125,432
  ├─ Tokens: 31,358
  ├─ Tiempo: 12.45s
  └─ Costo: $0.0023

Archivo Original
  ├─ ✓ Disponible en Cloud Storage
  ├─ Ruta: documents/1234.pdf
  └─ [Ver archivo] → PDF viewer

Indexación RAG
  ├─ ✓ RAG habilitado
  ├─ Total chunks: 63
  ├─ Tokens totales: 31,358
  ├─ Tamaño promedio: 498 tokens
  ├─ Dimensiones: 768
  ├─ Indexado: 19/10/2025
  └─ [Re-indexar] → Trigger re-index
```

### Right Column (Content Analysis)
```
Texto Extraído [▼ Mostrar]
  └─ (Cuando expandido)
      ├─ Header: 125,432 caracteres [Copiar]
      └─ Pre-formatted scrollable text

Chunks (63) [▼ Mostrar]
  └─ (Cuando expandido)
      └─ Chunk #1 [▼]
          ├─ 498 tokens, Pág. 1-2
          ├─ Preview: "Texto del chunk..."
          └─ (Cuando expandido)
              ├─ Texto completo
              ├─ Vector de embedding
              │   ├─ 768 dimensiones
              │   ├─ Preview: [0.1234, -0.5678, ...]
              │   └─ [Copiar]
              └─ Metadata
                  ├─ Posición: 0 - 2500
                  └─ Creado: 19/10/2025
```

---

## ✅ Success Criteria

### Functionality
- [x] Modal opens with increased width
- [x] Two-column layout displays correctly
- [x] Chunks load automatically when RAG enabled
- [x] Extracted text displays in collapsible section
- [x] Chunks list displays with expansion capability
- [x] Individual chunks show full details
- [x] Embedding vectors preview correctly
- [x] Copy buttons work for text and vectors
- [x] All sections are collapsible/expandable
- [x] Responsive to different screen sizes

### Data Display
- [x] Extraction metadata complete
- [x] RAG statistics accurate
- [x] Chunk count matches reality
- [x] Token counts calculated correctly
- [x] Embedding dimensions shown
- [x] Page numbers displayed (when available)

### User Experience
- [x] Progressive disclosure (collapsed by default)
- [x] Smooth transitions and hover states
- [x] Clear visual hierarchy
- [x] Consistent with overall design
- [x] No performance impact with large documents
- [x] Loading states for async operations

### Security
- [x] Authentication required
- [x] Ownership verification
- [x] No data leakage between users
- [x] Safe handling of missing data

---

## 🚀 Usage

### Opening the Modal

Users can access this enhanced details view by:

1. Clicking on a context source card in the sidebar
2. Clicking on a referenced source in a message
3. Clicking "Ver detalles" in the context panel

### Viewing Extraction Details

**Left column shows:**
- How the document was processed
- What model was used
- How long it took
- How much it cost
- Whether the file is available for re-indexing

### Viewing Content Analysis

**Right column shows:**
- Complete extracted text (for quality review)
- All chunks created (for chunking strategy evaluation)
- Embedding vectors (for technical debugging)
- Token distribution (for cost optimization)

### Evaluating Quality

Users can now evaluate extraction quality by:
1. Reading the full extracted text
2. Checking if chunks are well-segmented
3. Verifying page attribution is correct
4. Ensuring no information was lost
5. Reviewing token usage efficiency

---

## 🔄 Backward Compatibility

### Additive Changes Only
- ✅ No existing functionality removed
- ✅ All new features are optional (collapsible)
- ✅ Works with sources that don't have RAG
- ✅ Works with legacy sources (no Cloud Storage)
- ✅ Graceful handling of missing data

### Data Requirements
- **Minimum:** Source metadata (always present)
- **Enhanced:** Cloud Storage path (for file viewer)
- **Full:** RAG chunks (for comprehensive analysis)

### UI States
- **No RAG:** Shows "RAG no indexado" message
- **RAG but no chunks loaded:** Shows loading spinner
- **RAG with chunks:** Shows full statistics and list
- **No extracted text:** Shows "No hay texto extraído"

---

## 📈 Benefits

### For Users
1. **Quality Assurance:** Verify extraction quality before using in agents
2. **Transparency:** See exactly what was extracted and how it was processed
3. **Cost Awareness:** View extraction costs and token usage
4. **Debugging:** Identify issues with chunking or embeddings
5. **Confidence:** Trust the system through visibility

### For Admins
1. **Monitoring:** Track extraction quality across users
2. **Optimization:** Identify opportunities to improve chunking
3. **Support:** Help users understand their documents
4. **Auditing:** Complete traceability of processing pipeline

### For Developers
1. **Debugging:** Inspect chunks and embeddings
2. **Testing:** Verify RAG indexing worked correctly
3. **Optimization:** Analyze token distribution
4. **Validation:** Ensure embedding quality

---

## 🧪 Testing

### Manual Testing Steps

1. **Open modal for non-RAG source:**
   - ✅ Shows extraction info
   - ✅ Shows "RAG no indexado" message
   - ✅ Can view extracted text
   - ✅ No chunks section displayed

2. **Open modal for RAG-enabled source:**
   - ✅ Shows extraction info
   - ✅ Shows RAG statistics
   - ✅ Loads chunks automatically
   - ✅ Can expand/collapse chunks list
   - ✅ Can select individual chunks
   - ✅ Can view embedding vectors
   - ✅ Can copy text and vectors

3. **Test interactions:**
   - ✅ Click "Mostrar" on extracted text → expands
   - ✅ Click "Ocultar" → collapses
   - ✅ Click chunk → expands details
   - ✅ Click again → collapses
   - ✅ Copy buttons work
   - ✅ Scrolling works in long lists

4. **Test edge cases:**
   - ✅ Source with no extracted data
   - ✅ Source with no Cloud Storage
   - ✅ Source with many chunks (>50)
   - ✅ Source with very long text
   - ✅ Network error loading chunks

---

## 🔐 Security Considerations

### API Endpoint Security
```typescript
// 1. Authentication check
const session = getSession(context);
if (!session) return 401;

// 2. Ownership verification
if (sourceData.userId !== session.id) return 403;

// 3. Data filtering
.where('userId', '==', userId)
```

### Data Privacy
- Users can only see their own chunks
- Embedding vectors are user-specific
- No cross-user data access
- Session-based authentication

---

## 📝 Files Modified

### New Files
- `src/pages/api/context-sources/[id]/chunks.ts` - API endpoint for fetching chunks

### Modified Files
- `src/components/ContextSourceSettingsModalSimple.tsx` - Enhanced modal with new sections

### Data Schema
- No schema changes (uses existing `document_chunks` collection)
- No Firestore index changes needed

---

## 🎯 Future Enhancements

### Potential Improvements
1. **Search within chunks:** Find specific text across chunks
2. **Similarity visualization:** Show chunk relationships
3. **Quality scoring:** Auto-rate extraction quality
4. **Chunk optimization:** Suggest better chunking parameters
5. **Export:** Download chunks as JSON/CSV
6. **Comparison:** Compare before/after re-indexing

### Analytics Integration
- Track which chunks are most frequently retrieved
- Identify low-quality chunks (never matched)
- Optimize chunking based on usage patterns

---

## 📊 Metrics

### Performance
- Modal load time: <500ms
- Chunks API response: <1s for 100 chunks
- Embedding vector display: Instant (first 10 dims)
- Smooth scrolling with 100+ chunks

### User Engagement
- Track modal open rate
- Track section expansion rate
- Track chunk inspection rate
- Measure quality improvement correlation

---

## ✅ Checklist

### Implementation
- [x] API endpoint created and tested
- [x] Modal enhanced with two-column layout
- [x] Extraction info displayed
- [x] RAG statistics calculated and shown
- [x] Extracted text viewer implemented
- [x] Chunks list with expansion
- [x] Embedding preview functional
- [x] Copy functionality added
- [x] Loading states implemented
- [x] Error handling added

### Quality
- [x] No TypeScript errors
- [x] No linting errors
- [x] Follows design system
- [x] Responsive layout
- [x] Backward compatible
- [x] Security verified

### Documentation
- [x] Feature documented
- [x] API endpoint documented
- [x] Usage instructions clear
- [x] Testing procedures defined

---

## 🎓 Key Learnings

### Design Decisions

1. **Collapsible by default:** Reduce initial cognitive load
2. **Two columns:** Separate status/control from content
3. **Embedding preview:** Show first 10 dims (sufficient for debugging)
4. **Monospace fonts:** Better readability for technical data
5. **Copy buttons:** Enable easy sharing and debugging

### Technical Insights

1. **Firestore query optimization:** Order by chunkIndex for sequential display
2. **Loading strategy:** Load chunks automatically (not on-demand)
3. **State management:** Separate state for each expandable section
4. **Memory efficiency:** Show embedding preview, not full vector (saves rendering time)

---

## 📚 References

### Related Features
- RAG Indexing System
- Context Management Dashboard
- Cloud Storage Integration
- Embedding Generation Service

### Related Files
- `src/lib/rag-indexing.ts` - Chunking and embedding
- `src/lib/rag-search.ts` - Similarity search
- `src/lib/embeddings.ts` - Embedding utilities
- `src/types/context.ts` - Type definitions

---

**Last Updated:** 2025-10-19  
**Impact:** High - Significant improvement in document quality evaluation  
**User Benefit:** Complete transparency into document processing pipeline

