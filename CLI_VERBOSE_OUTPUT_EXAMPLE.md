# 📊 CLI Upload - Verbose Output Example

**Updated:** 2025-11-18  
**Version:** 0.2.1 (Enhanced Progress Tracking)

---

## 🎯 What's New

The CLI upload command now shows **much more detailed progress information** for each file and across the entire batch:

### Per-File Details:
- ✅ Upload speed (MB/s)
- ✅ Extraction metrics (input/output tokens, cost)
- ✅ RAG processing details (chunks, embeddings, cost)
- ✅ Agent context updates (before/after count)
- ✅ Per-file summary with all metrics

### Batch Progress:
- ✅ File X of Y counter
- ✅ Running totals (chars, chunks, cost)
- ✅ Success/failure counters
- ✅ Remaining files counter

---

## 📋 Example Output (Single File)

```bash
══════════════════════════════════════════════════════════════════════
📄 ARCHIVO 1 de 70
══════════════════════════════════════════════════════════════════════
📁 Archivo: MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
📊 Progreso global: 0 completados, 70 restantes
══════════════════════════════════════════════════════════════════════

📤 Paso 1/5: Subiendo a Cloud Storage...
   📤 100.0% (617.1 KB/617.1 KB) @ 238.5 KB/s
   ✅ Upload exitoso en 2.6s (237.3 KB/s)
   📍 GCS Path: gs://salfagpt-context-documents/114671162830729001607/TestApiUpload_S001/MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf

🤖 Paso 2/5: Extrayendo contenido con Gemini AI...
   📄 Archivo: MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
   📊 Tamaño: 617.13 KB
   🤖 Modelo: gemini-2.5-flash
   ⏳ Procesando con Gemini...
   ✅ Extracción exitosa en 80.8s
   📝 Caracteres extraídos: 352,951
   🎯 Tokens estimados: ~88,238
   📥 Input tokens: 15,342
   📤 Output tokens: 88,238
   💰 Costo: $0.026524

💾 Paso 3/5: Guardando en Firestore...
   📦 Collection: context_sources
   🏷️  Tags: [S001-20251118-1545]
   🤖 Assigned to: TestApiUpload_S001
   ✅ Documento guardado exitosamente
   🆔 Source ID: Kx7YmZ9WvB2CnHsRpA3L
   ⏱️  Tiempo: 0.3s

🧬 Paso 4/5: Procesando para RAG (chunking + embeddings)...
   📊 Texto a procesar: 352,951 caracteres
   📊 Tokens estimados: ~88,238 tokens
   ✅ Chunking completado: 127 chunks creados
   ✅ Embeddings generados: 127 vectores (768 dimensiones)
   📊 Promedio tokens/chunk: 695
   💰 Costo embeddings: $0.001765
   ⏱️  Tiempo RAG: 15.3s

📝 Paso 5/5: Actualizando metadata RAG...
   ✅ Metadata actualizada
   🔍 RAG enabled: Yes

🔗 Asignando a agente...
   🤖 Agente: TestApiUpload_S001
   ✅ Documento asignado y activado
   📚 Contextos activos: 0 → 1

────────────────────────────────────────────────────────────
✅ ARCHIVO COMPLETADO: MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
────────────────────────────────────────────────────────────
⏱️  Tiempo total: 99.1s
📝 Caracteres: 352,951
📐 Chunks: 127
🧬 Embeddings: 127
💰 Costo total: $0.028289
🆔 Source ID: Kx7YmZ9WvB2CnHsRpA3L
────────────────────────────────────────────────────────────

📊 PROGRESO ACUMULADO (1/70):
   ✅ Exitosos: 1
   ❌ Fallidos: 0
   📝 Total caracteres: 352,951
   📐 Total chunks: 127
   💰 Costo acumulado: $0.0283
```

---

## 📋 Example Output (Multiple Files)

```bash
🚀 SalfaGPT CLI - Batch Document Upload
═══════════════════════════════════════

📋 Configuration:
   📁 Folder: /Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118
   🏷️  Tag: S001-20251118-1545
   🤖 Agent: TestApiUpload_S001
   👤 User: 114671162830729001607 (alec@getaifactory.com)
   ⚡ Model: gemini-2.5-flash
   🔑 Session: cli-upload-1763502618750-dore7f3et

📦 Checking GCS bucket...
✅ Bucket ready

📂 Scanning folder for PDFs...
✅ Found 70 PDF files

══════════════════════════════════════════════════════════════════════
📄 ARCHIVO 1 de 70
══════════════════════════════════════════════════════════════════════
📁 Archivo: MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
📊 Progreso global: 0 completados, 70 restantes
══════════════════════════════════════════════════════════════════════

[... file 1 processing as shown above ...]

📊 PROGRESO ACUMULADO (1/70):
   ✅ Exitosos: 1
   ❌ Fallidos: 0
   📝 Total caracteres: 352,951
   📐 Total chunks: 127
   💰 Costo acumulado: $0.0283

══════════════════════════════════════════════════════════════════════
📄 ARCHIVO 2 de 70
══════════════════════════════════════════════════════════════════════
📁 Archivo: MAQ-LOG-CT-P-002 Transporte de Carga Menor Rev.02.pdf
📊 Progreso global: 1 completados, 69 restantes
══════════════════════════════════════════════════════════════════════

📤 Paso 1/5: Subiendo a Cloud Storage...
   📤 100.0% (425.3 KB/425.3 KB) @ 195.7 KB/s
   ✅ Upload exitoso en 2.2s (193.3 KB/s)
   📍 GCS Path: gs://salfagpt-context-documents/.../file.pdf

🤖 Paso 2/5: Extrayendo contenido con Gemini AI...
   📄 Archivo: MAQ-LOG-CT-P-002 Transporte de Carga Menor Rev.02.pdf
   📊 Tamaño: 425.30 KB
   🤖 Modelo: gemini-2.5-flash
   ⏳ Procesando con Gemini...
   ✅ Extracción exitosa en 65.2s
   📝 Caracteres extraídos: 287,420
   🎯 Tokens estimados: ~71,855
   📥 Input tokens: 12,458
   📤 Output tokens: 71,855
   💰 Costo: $0.021650

💾 Paso 3/5: Guardando en Firestore...
   📦 Collection: context_sources
   🏷️  Tags: [S001-20251118-1545]
   🤖 Assigned to: TestApiUpload_S001
   ✅ Documento guardado exitosamente
   🆔 Source ID: Lm3ZnA4XwC5DoItQrB8M
   ⏱️  Tiempo: 0.2s

🧬 Paso 4/5: Procesando para RAG (chunking + embeddings)...
   📊 Texto a procesar: 287,420 caracteres
   📊 Tokens estimados: ~71,855 tokens
   ✅ Chunking completado: 103 chunks creados
   ✅ Embeddings generados: 103 vectores (768 dimensiones)
   📊 Promedio tokens/chunk: 697
   💰 Costo embeddings: $0.001437
   ⏱️  Tiempo RAG: 12.8s

📝 Paso 5/5: Actualizando metadata RAG...
   ✅ Metadata actualizada
   🔍 RAG enabled: Yes

🔗 Asignando a agente...
   🤖 Agente: TestApiUpload_S001
   ✅ Documento asignado y activado
   📚 Contextos activos: 1 → 2

────────────────────────────────────────────────────────────
✅ ARCHIVO COMPLETADO: MAQ-LOG-CT-P-002 Transporte de Carga Menor Rev.02.pdf
────────────────────────────────────────────────────────────
⏱️  Tiempo total: 80.4s
📝 Caracteres: 287,420
📐 Chunks: 103
🧬 Embeddings: 103
💰 Costo total: $0.023087
🆔 Source ID: Lm3ZnA4XwC5DoItQrB8M
────────────────────────────────────────────────────────────

📊 PROGRESO ACUMULADO (2/70):
   ✅ Exitosos: 2
   ❌ Fallidos: 0
   📝 Total caracteres: 640,371
   📐 Total chunks: 230
   💰 Costo acumulado: $0.0514

[... files 3-69 continue ...]

══════════════════════════════════════════════════════════════════════
📄 ARCHIVO 70 de 70
══════════════════════════════════════════════════════════════════════
📁 Archivo: Instructivo Capacitación Salfacorp.pdf
📊 Progreso global: 69 completados, 1 restantes
══════════════════════════════════════════════════════════════════════

[... file 70 processing ...]

📊 PROGRESO ACUMULADO (70/70):
   ✅ Exitosos: 70
   ❌ Fallidos: 0
   📝 Total caracteres: 18,452,390
   📐 Total chunks: 6,542
   💰 Costo acumulado: $1.8947


════════════════════════════════════════════════════════════
📊 RESUMEN DE CARGA
════════════════════════════════════════════════════════════

📁 Total de archivos: 70
✅ Exitosos: 70 (100.0%)
❌ Fallidos: 0
⏱️  Tiempo total: 5,847.3s (97.5 min)
💰 Costo estimado: $1.8947

✅ Archivos Exitosos:
   --------------------------------------------------------
   📄 MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras Rev.08.pdf
      🆔 Source ID: Kx7YmZ9WvB2CnHsRpA3L
      📝 Chars: 352,951
      📐 Chunks: 127
      🧬 Embeddings: 127
      ⏱️  Duration: 99.1s

   📄 MAQ-LOG-CT-P-002 Transporte de Carga Menor Rev.02.pdf
      🆔 Source ID: Lm3ZnA4XwC5DoItQrB8M
      📝 Chars: 287,420
      📐 Chunks: 103
      🧬 Embeddings: 103
      ⏱️  Duration: 80.4s

   [... all 70 files listed ...]

════════════════════════════════════════════════════════════

✅ Upload completed successfully!
```

---

## 📊 Metrics Tracked

### Per-File Metrics:
| Metric | Description | Example |
|--------|-------------|---------|
| Upload Speed | MB/s during upload | 237.3 KB/s |
| File Size | Original PDF size | 617.13 KB |
| Extraction Time | Time for Gemini | 80.8s |
| Characters | Text extracted | 352,951 |
| Input Tokens | Sent to Gemini | 15,342 |
| Output Tokens | From Gemini | 88,238 |
| Extraction Cost | Gemini cost | $0.026524 |
| Chunks Created | RAG chunks | 127 |
| Embeddings Generated | 768D vectors | 127 |
| Avg Chunk Size | Tokens/chunk | 695 |
| Embedding Cost | Embedding cost | $0.001765 |
| Total Cost | Extraction + Embeddings | $0.028289 |
| Source ID | Firestore doc ID | Kx7Y... |
| Context Count | Before → After | 0 → 1 |

### Batch Metrics:
| Metric | Description | Example (70 files) |
|--------|-------------|-------------------|
| Files Processed | Total count | 70 |
| Success Rate | % successful | 100.0% |
| Failed Count | # failures | 0 |
| Total Characters | Sum of all chars | 18,452,390 |
| Total Chunks | Sum of all chunks | 6,542 |
| Total Cost | Cumulative cost | $1.8947 |
| Total Time | End-to-end duration | 97.5 min |
| Avg Time/File | Total / count | 83.5s |

---

## 🎯 Benefits

### 1. Real-Time Visibility
- Know exactly what's happening at each step
- See progress percentages and speeds
- Identify slow steps immediately

### 2. Cost Tracking
- Per-file cost breakdown
- Running total during upload
- Predict final cost early

### 3. Quality Assurance
- Verify extraction quality (chars, tokens)
- Confirm chunking worked (chunk count)
- Validate RAG enabled correctly

### 4. Debugging
- Pinpoint where failures occur
- See exact error at each step
- Detailed timing information

### 5. Performance Monitoring
- Upload speeds
- Extraction times
- RAG processing duration
- Agent context updates

---

## 🔍 What Each Section Means

### Upload Phase
```
📤 100.0% (617.1 KB/617.1 KB) @ 238.5 KB/s
   ✅ Upload exitoso en 2.6s (237.3 KB/s)
```
- Shows real-time upload progress
- Displays instantaneous speed
- Shows average speed at completion

### Extraction Phase
```
   ✅ Extracción exitosa en 80.8s
   📝 Caracteres extraídos: 352,951
   📥 Input tokens: 15,342
   📤 Output tokens: 88,238
   💰 Costo: $0.026524
```
- Extraction duration
- Text length (quality check)
- Token usage (billable)
- Exact cost

### RAG Phase
```
   ✅ Chunking completado: 127 chunks creados
   ✅ Embeddings generados: 127 vectores (768 dimensiones)
   📊 Promedio tokens/chunk: 695
   💰 Costo embeddings: $0.001765
```
- How many chunks created
- Embedding vector count
- Average chunk quality
- Embedding cost

### Agent Assignment
```
   ✅ Documento asignado y activado
   📚 Contextos activos: 0 → 1
```
- Confirms assignment worked
- Shows context growth

### Running Totals
```
📊 PROGRESO ACUMULADO (2/70):
   ✅ Exitosos: 2
   ❌ Fallidos: 0
   📝 Total caracteres: 640,371
   📐 Total chunks: 230
   💰 Costo acumulado: $0.0514
```
- Progress through batch
- Success/failure tracking
- Cumulative metrics
- Running cost

---

## 💡 Tips

### Monitor Cost
Watch the **💰 Costo acumulado** line to track spending in real-time.

### Check Quality
Look at **📝 Caracteres extraídos** - should be substantial (>50K for typical docs).

### Verify RAG
Confirm **🔍 RAG enabled: Yes** - if No, embeddings failed.

### Track Speed
Monitor **Upload Speed** and **Extraction Time** to identify bottlenecks.

### Context Growth
Watch **📚 Contextos activos** to see documents being added to agent.

---

**Version:** 0.2.1 (Enhanced Verbose Output)  
**Updated:** 2025-11-18  
**Status:** ✅ Production Ready

