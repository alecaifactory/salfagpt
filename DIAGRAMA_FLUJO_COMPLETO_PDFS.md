# 🔍 DIAGRAMA FLUJO COMPLETO: Pregunta → Respuesta → PDFs

**Problema Actual:** PDFs muestran "Vista de solo texto - Archivo no disponible"  
**Análisis:** Rastreo completo del flujo

---

## 📊 **FLUJO COMPLETO ACTUAL:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. USUARIO HACE PREGUNTA                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND → POST /api/conversations/:id/messages-stream               │
│    Payload: { userId, message, ragTopK: 10, ragMinSimilarity: 0.6 }    │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. BACKEND (Cloud Run us-east4)                                         │
│                                                                          │
│    A) Generate Embedding                                                │
│       Library: @google/genai                                            │
│       Model: text-embedding-004                                         │
│       Time: ~1s                                                         │
│       Result: 768-dim vector                                            │
│                                                                          │
│    B) Search BigQuery                                                   │
│       Query: searchByAgent()                                            │
│       │                                                                 │
│       ├─ Router decides: GREEN or BLUE?                                │
│       │  Origin: http://localhost:3000                                 │
│       │  Decision: GREEN (us-east4) ✅                                 │
│       │                                                                 │
│       ├─ BigQuery Query:                                               │
│       │  Dataset: flow_analytics_east4 ✅                              │
│       │  Location: us-east4 ✅                                         │
│       │  Query: SQL cosine similarity                                  │
│       │  Time: ~2-3s                                                   │
│       │                                                                 │
│       └─ Returns: [                                                    │
│            { source_id: 'LqZZrXNqK5zKKl26rwXZ',                       │
│              source_name: 'GOP-D-PI-1...',                            │
│              similarity: 0.773,                                         │
│              text: '...'                                               │
│            },                                                           │
│            ...5 chunks                                                 │
│          ]                                                              │
│                                                                          │
│    C) Build References                                                  │
│       Group by source_id → 1 referencia per documento                  │
│       Resultado: 5 referencias                                          │
│                                                                          │
│    D) Stream to Frontend                                                │
│       SSE events:                                                       │
│       - type: 'references' → Frontend recibe AHORA                     │
│       - type: 'chunk' → Gemini response                                │
│       - type: 'complete'                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND RECIBE REFERENCIAS                                          │
│                                                                          │
│    Referencias: [                                                       │
│      {                                                                  │
│        id: 1,                                                           │
│        sourceId: 'LqZZrXNqK5zKKl26rwXZ', ← FIRESTORE DOC ID           │
│        sourceName: 'GOP-D-PI-1.PLANIFICACION...',                     │
│        similarity: 0.773,                                               │
│        snippet: '...'                                                  │
│      },                                                                 │
│      ...                                                                │
│    ]                                                                    │
│                                                                          │
│    Muestra badges: [1] [2] [3] [4] [5]                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. USUARIO CLICK REFERENCIA [1]                                        │
│    sourceId: 'LqZZrXNqK5zKKl26rwXZ'                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND → GET /api/context-sources/LqZZrXNqK5zKKl26rwXZ/file      │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. BACKEND (src/pages/api/context-sources/[id]/file.ts)                │
│                                                                          │
│    A) Load from Firestore (us-central1):                               │
│       const source = await getContextSource('LqZZrXNqK5zKKl26rwXZ');  │
│       │                                                                 │
│       └─ Firestore Query:                                              │
│          Collection: context_sources                                    │
│          Doc ID: LqZZrXNqK5zKKl26rwXZ                                 │
│          Time: ~50ms                                                   │
│                                                                          │
│       Returns: {                                                        │
│         id: 'LqZZrXNqK5zKKl26rwXZ',                                   │
│         name: 'GOP-D-PI-1...',                                         │
│         metadata: {                                                     │
│           storagePath: ???, ← EL PROBLEMA ESTÁ AQUÍ                   │
│           bucketName: ???,                                             │
│         }                                                               │
│       }                                                                 │
│                                                                          │
│    B) Check storagePath:                                                │
│       const storagePath = metadata?.storagePath || metadata?.gcsPath;  │
│       │                                                                 │
│       ├─ SI TIENE storagePath:                                         │
│       │  └─ downloadFile(storagePath) ✅                               │
│       │                                                                 │
│       └─ SI NO TIENE storagePath: ❌ ESTE ES TU CASO                   │
│          └─ return HTML("Vista de solo texto - PDF no disponible")    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
                        ❌ PROBLEMA AQUÍ ❌
```

---

## 🚨 **EL PROBLEMA IDENTIFICADO:**

### **Estado Actual de Firestore:**

**Documento ID:** `LqZZrXNqK5zKKl26rwXZ`

**En Firestore AHORA (después del script):**
```javascript
{
  name: 'GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1) (1).PDF',
  metadata: {
    storagePath: "usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP-D-PI-1..."
    // ✅ ACTUALIZADO por script trace-document-location.mjs
  }
}
```

**PERO:** El problema es que hay DOS documentos con nombres similares:

1. `GOP-D-PI-1.PLANIFICACION...(V.1) (1).PDF` → ID: `90HhrU2rkTIxM38GeH95` ✅ Actualizado
2. `GOP-D-PI-1.PLANIFICACION...(V.1) (1).PDF` → ID: `LqZZrXNqK5zKKl26rwXZ` ❌ NO actualizado

**El script actualizó el primero, pero la referencia apunta al segundo!**

---

## 🔧 **LA SOLUCIÓN:**

Necesito actualizar ESPECÍFICAMENTE el documento `LqZZrXNqK5zKKl26rwXZ`. Déjame crear un script que actualice ese doc específico:

```javascript
// Actualizar doc LqZZrXNqK5zKKl26rwXZ con path correcto
await db.collection('context_sources')
  .doc('LqZZrXNqK5zKKl26rwXZ')
  .update({
    'metadata.storagePath': 'usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP-D-PI-1...',
    'metadata.bucketName': 'salfagpt-context-documents-east4',
  });
```

---

## 📋 **DIAGRAMA CORRECTO (Después del Fix):**

```
Usuario click [1]
        ↓
GET /api/context-sources/LqZZrXNqK5zKKl26rwXZ/file
        ↓
┌─────────────────────────────────────────┐
│ Backend lee Firestore (us-central1)     │
│   Doc: LqZZrXNqK5zKKl26rwXZ            │
│   metadata.storagePath: "usr_.../GOP..." ✅ CORRECTO
│   metadata.bucketName: "...-east4"     │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│ downloadFile(storagePath)               │
│   Intenta buckets:                      │
│   1. salfagpt-context-documents-east4   │
│      File: usr_.../vSto.../GOP-D-PI-1...│
│      ✅ EXISTS                          │
│      ✅ DOWNLOAD 0.48 MB                │
└─────────────────────────────────────────┘
        ↓
Response: HTTP 200
Content-Type: application/pdf ✅
Body: <PDF bytes>
        ↓
✅ BROWSER MUESTRA PDF
```

---

## 🎯 **ACCIÓN INMEDIATA:**

Voy a actualizar el documento específico `LqZZrXNqK5zKKl26rwXZ` AHORA.

