# SalfaGPT CLI - Operation Log

This file tracks all operations performed by the SalfaGPT CLI tool.

**Created:** 2025-10-19  
**Version:** 0.1.0  
**Project:** Flow (gen-lang-client-0986191192)

---

## Usage

The CLI automatically appends entries to this file after each operation.

**Log Format:**
- Upload sessions with file details
- Extraction results with model info
- Cost tracking per operation
- Error details when applicable
- GCP resources created

---

## Sessions

(Operations will be logged here automatically)

---

**Note:** This file is managed by the CLI. Do not edit manually unless necessary.


## Upload Session - 2025-10-19T23:59:43.596Z

**Session ID:** `cli-session-1760918383516-0sdk7v`  
**User:** alec@getaifactory.com (`114671162830729001607`)  
**Source:** CLI v0.1.0  
**Folder:** `contextos/pdf/agentes/M001`  
**Total Files:** 11  
**Success:** 11  
**Failed:** 0  

### Files Processed

| File | Size (KB) | Status | Firestore Tracking |
|------|-----------|--------|--------------------|
| CIR-182.pdf | 541.29 | ✅ Success | Logged to `cli_events` |
| CIR-232.pdf | 435.68 | ✅ Success | Logged to `cli_events` |
| CIR-234.pdf | 220.94 | ✅ Success | Logged to `cli_events` |
| CIR-235.pdf | 1346.10 | ✅ Success | Logged to `cli_events` |
| CIR-236.pdf | 230.37 | ✅ Success | Logged to `cli_events` |
| CIR-239.pdf | 400.19 | ✅ Success | Logged to `cli_events` |
| CIR-420.pdf | 61.71 | ✅ Success | Logged to `cli_events` |
| CIR-421.pdf | 892.15 | ✅ Success | Logged to `cli_events` |
| CIR-422.pdf | 66.78 | ✅ Success | Logged to `cli_events` |
| CIR-427.pdf | 1691.30 | ✅ Success | Logged to `cli_events` |
| Cir-231.pdf | 125.82 | ✅ Success | Logged to `cli_events` |



### Traceability

All operations tracked in Firestore:
- **Collection:** `cli_events`
- **Session Collection:** `cli_sessions`
- **User Attribution:** All events linked to `alec@getaifactory.com`
- **Origin Tracking:** Source field = `cli` (distinguishes from webapp)

---


## Upload Session - 2025-10-20T00:16:10.296Z

**Session ID:** `cli-session-1760919348501-sinfvs`  
**User:** alec@getaifactory.com (`114671162830729001607`)  
**Source:** CLI v0.2.0  
**Folder:** `contextos/pdf/agentes/M001-test`  
**Total Files:** 1  
**Success:** 1  
**Failed:** 0  

### Files Processed

| File | Size (KB) | GCS Path | Firestore ID | Chars | Model | Cost | Status |
|------|-----------|----------|--------------|-------|-------|------|--------|
| CIR-182.pdf | 541.29 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf` | `HN3DfhwALQXATFDZvgNe` | 7,458 | gemini-2.5-flash | $0.000606 | ✅ |

### Extracción de Texto

- **Caracteres Totales:** 7,458
- **Modelo Usado:** gemini-2.5-flash
- **Costo Total:** $0.000606

### Recursos en GCP


#### CIR-182.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf
- **Firestore:** `context_sources/HN3DfhwALQXATFDZvgNe`
- **Texto Extraído:** 7,458 caracteres
- **Preview:** Ver en Firestore




### Traceability

All operations tracked in Firestore:
- **Collection:** `cli_events`
- **Session Collection:** `cli_sessions`
- **User Attribution:** All events linked to `alec@getaifactory.com`
- **Origin Tracking:** Source field = `cli` (distinguishes from webapp)

---


## Upload Session - 2025-10-20T00:25:24.806Z

**Session ID:** `cli-session-1760919595718-u5xhmm`  
**User:** alec@getaifactory.com (`114671162830729001607`)  
**Source:** CLI v0.2.0  
**Folder:** `contextos/pdf/agentes/M001`  
**Total Files:** 11  
**Success:** 11  
**Failed:** 0  

### Files Processed

| File | Size (KB) | GCS Path | Firestore ID | Chars | Model | Cost | Status |
|------|-----------|----------|--------------|-------|-------|------|--------|
| CIR-182.pdf | 541.29 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf` | `PlfwSwzkhPvIHPx4A5Rl` | 7,688 | gemini-2.5-flash | $0.000623 | ✅ |
| CIR-232.pdf | 435.68 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-232.pdf` | `yNZjhpEoCht9VzKF45l9` | 14,251 | gemini-2.5-flash | $0.001107 | ✅ |
| CIR-234.pdf | 220.94 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-234.pdf` | `k9LBGKQCX0pbPffqcq5c` | 9,177 | gemini-2.5-flash | $0.000711 | ✅ |
| CIR-235.pdf | 1346.10 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-235.pdf` | `Y1Cu6m2R6i1VKVKzw2ri` | 268,733 | gemini-2.5-flash | $0.020264 | ✅ |
| CIR-236.pdf | 230.37 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-236.pdf` | `hiagyzeBHWyMfDqNVZLy` | 9,523 | gemini-2.5-flash | $0.000737 | ✅ |
| CIR-239.pdf | 400.19 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-239.pdf` | `1Qld83blDkLgwPOLMDgf` | 15,477 | gemini-2.5-flash | $0.001197 | ✅ |
| CIR-420.pdf | 61.71 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-420.pdf` | `jQQuOqxVjL0Z7FPHHrsG` | 3,085 | gemini-2.5-flash | $0.000241 | ✅ |
| CIR-421.pdf | 892.15 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-421.pdf` | `nvH4MU7HeBZjMW9wZ3if` | 4,469 | gemini-2.5-flash | $0.000409 | ✅ |
| CIR-422.pdf | 66.78 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-422.pdf` | `liDnROmrAGbLFKFPvCyJ` | 3,451 | gemini-2.5-flash | $0.000269 | ✅ |
| CIR-427.pdf | 1691.30 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-427.pdf` | `TcknmSpOziBQgiLWxNmU` | 9,661 | gemini-2.5-flash | $0.000860 | ✅ |
| Cir-231.pdf | 125.82 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/Cir-231.pdf` | `Zzo7YPcn3IIJ5imgG3NX` | 4,702 | gemini-2.5-flash | $0.000368 | ✅ |

### Extracción de Texto

- **Caracteres Totales:** 350,217
- **Modelo Usado:** gemini-2.5-flash
- **Costo Total:** $0.026786

### Recursos en GCP


#### CIR-182.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf
- **Firestore:** `context_sources/PlfwSwzkhPvIHPx4A5Rl`
- **Texto Extraído:** 7,688 caracteres
- **Preview:** Ver en Firestore


#### CIR-232.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-232.pdf
- **Firestore:** `context_sources/yNZjhpEoCht9VzKF45l9`
- **Texto Extraído:** 14,251 caracteres
- **Preview:** Ver en Firestore


#### CIR-234.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-234.pdf
- **Firestore:** `context_sources/k9LBGKQCX0pbPffqcq5c`
- **Texto Extraído:** 9,177 caracteres
- **Preview:** Ver en Firestore


#### CIR-235.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-235.pdf
- **Firestore:** `context_sources/Y1Cu6m2R6i1VKVKzw2ri`
- **Texto Extraído:** 268,733 caracteres
- **Preview:** Ver en Firestore


#### CIR-236.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-236.pdf
- **Firestore:** `context_sources/hiagyzeBHWyMfDqNVZLy`
- **Texto Extraído:** 9,523 caracteres
- **Preview:** Ver en Firestore


#### CIR-239.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-239.pdf
- **Firestore:** `context_sources/1Qld83blDkLgwPOLMDgf`
- **Texto Extraído:** 15,477 caracteres
- **Preview:** Ver en Firestore


#### CIR-420.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-420.pdf
- **Firestore:** `context_sources/jQQuOqxVjL0Z7FPHHrsG`
- **Texto Extraído:** 3,085 caracteres
- **Preview:** Ver en Firestore


#### CIR-421.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-421.pdf
- **Firestore:** `context_sources/nvH4MU7HeBZjMW9wZ3if`
- **Texto Extraído:** 4,469 caracteres
- **Preview:** Ver en Firestore


#### CIR-422.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-422.pdf
- **Firestore:** `context_sources/liDnROmrAGbLFKFPvCyJ`
- **Texto Extraído:** 3,451 caracteres
- **Preview:** Ver en Firestore


#### CIR-427.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-427.pdf
- **Firestore:** `context_sources/TcknmSpOziBQgiLWxNmU`
- **Texto Extraído:** 9,661 caracteres
- **Preview:** Ver en Firestore


#### Cir-231.pdf
- **GCS:** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/Cir-231.pdf
- **Firestore:** `context_sources/Zzo7YPcn3IIJ5imgG3NX`
- **Texto Extraído:** 4,702 caracteres
- **Preview:** Ver en Firestore




### Traceability

All operations tracked in Firestore:
- **Collection:** `cli_events`
- **Session Collection:** `cli_sessions`
- **User Attribution:** All events linked to `alec@getaifactory.com`
- **Origin Tracking:** Source field = `cli` (distinguishes from webapp)

---


## Upload Session - 2025-10-20T00:42:56.566Z

**Session ID:** `cli-session-1760920640426-if267k`  
**User:** alec@getaifactory.com (`114671162830729001607`)  
**Source:** CLI v0.3.0  
**Folder:** `contextos/pdf/agentes/M001`  
**Total Files:** 11  
**Success:** 11  
**Failed:** 0  

### Files Processed

| File | Size (KB) | GCS Path | Firestore ID | Chars | Chunks | Embeddings | Cost Total | Status |
|------|-----------|----------|--------------|-------|--------|------------|------------|--------|
| CIR-182.pdf | 541.29 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf` | `IAbzJBQcio6HeFVvEBcR` | 7,582 | 4 | 0 | $0.000653 | ✅ |
| CIR-232.pdf | 435.68 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-232.pdf` | `F3V2hOxJOhbBlNkGTJRL` | 15,369 | 9 | 0 | $0.001268 | ✅ |
| CIR-234.pdf | 220.94 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-234.pdf` | `JnUD0dfvgkmM6NQHWm3c` | 9,178 | 6 | 0 | $0.000756 | ✅ |
| CIR-235.pdf | 1346.10 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-235.pdf` | `jrW7EeLbIrwpGc8Yv3zm` | 513,917 | 3 | 0 | $0.038677 | ✅ |
| CIR-236.pdf | 230.37 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-236.pdf` | `1OE2xyrn3tyCs6MLQfrw` | 10,024 | 6 | 0 | $0.000824 | ✅ |
| CIR-239.pdf | 400.19 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-239.pdf` | `OZ4YcbUI9G3VQCkM5xo0` | 15,880 | 10 | 0 | $0.001306 | ✅ |
| CIR-420.pdf | 61.71 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-420.pdf` | `BLN5ldnLSk4kib1NqyA3` | 3,018 | 2 | 0 | $0.000251 | ✅ |
| CIR-421.pdf | 892.15 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-421.pdf` | `B690EXfzTS9RTBqm9p30` | 5,285 | 4 | 0 | $0.000497 | ✅ |
| CIR-422.pdf | 66.78 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-422.pdf` | `ariRymmYBGFU2fsu58Rs` | 3,447 | 2 | 0 | $0.000286 | ✅ |
| CIR-427.pdf | 1691.30 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-427.pdf` | `aM0JcAPNq7ZtE9dMbaOk` | 10,020 | 6 | 0 | $0.000936 | ✅ |
| Cir-231.pdf | 125.82 | `gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/Cir-231.pdf` | `QLkYR6DClmOJY1tQkjBc` | 4,389 | 3 | 0 | $0.000366 | ✅ |

### Extracción de Texto

- **Caracteres Totales:** 598,109
- **Modelo Usado:** gemini-2.5-flash
- **Costo Extracción:** $0.045377

### RAG & Vectorización

- **Total Chunks:** 55
- **Total Embeddings:** 0 vectores (768 dimensiones)
- **Modelo Embeddings:** text-embedding-004
- **Costo RAG:** $0.000444
- **Costo Total (Extracción + RAG):** $0.045822

### Recursos en GCP


#### CIR-182.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf
- **Firestore (Metadata):** `context_sources/IAbzJBQcio6HeFVvEBcR`
- **Firestore (Embeddings):** `document_embeddings` - 4 chunks vectorizados
- **Texto Extraído:** 7,582 caracteres
- **Chunks RAG:** 4 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-232.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-232.pdf
- **Firestore (Metadata):** `context_sources/F3V2hOxJOhbBlNkGTJRL`
- **Firestore (Embeddings):** `document_embeddings` - 9 chunks vectorizados
- **Texto Extraído:** 15,369 caracteres
- **Chunks RAG:** 9 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-234.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-234.pdf
- **Firestore (Metadata):** `context_sources/JnUD0dfvgkmM6NQHWm3c`
- **Firestore (Embeddings):** `document_embeddings` - 6 chunks vectorizados
- **Texto Extraído:** 9,178 caracteres
- **Chunks RAG:** 6 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-235.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-235.pdf
- **Firestore (Metadata):** `context_sources/jrW7EeLbIrwpGc8Yv3zm`
- **Firestore (Embeddings):** `document_embeddings` - 3 chunks vectorizados
- **Texto Extraído:** 513,917 caracteres
- **Chunks RAG:** 3 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-236.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-236.pdf
- **Firestore (Metadata):** `context_sources/1OE2xyrn3tyCs6MLQfrw`
- **Firestore (Embeddings):** `document_embeddings` - 6 chunks vectorizados
- **Texto Extraído:** 10,024 caracteres
- **Chunks RAG:** 6 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-239.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-239.pdf
- **Firestore (Metadata):** `context_sources/OZ4YcbUI9G3VQCkM5xo0`
- **Firestore (Embeddings):** `document_embeddings` - 10 chunks vectorizados
- **Texto Extraído:** 15,880 caracteres
- **Chunks RAG:** 10 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-420.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-420.pdf
- **Firestore (Metadata):** `context_sources/BLN5ldnLSk4kib1NqyA3`
- **Firestore (Embeddings):** `document_embeddings` - 2 chunks vectorizados
- **Texto Extraído:** 3,018 caracteres
- **Chunks RAG:** 2 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-421.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-421.pdf
- **Firestore (Metadata):** `context_sources/B690EXfzTS9RTBqm9p30`
- **Firestore (Embeddings):** `document_embeddings` - 4 chunks vectorizados
- **Texto Extraído:** 5,285 caracteres
- **Chunks RAG:** 4 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-422.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-422.pdf
- **Firestore (Metadata):** `context_sources/ariRymmYBGFU2fsu58Rs`
- **Firestore (Embeddings):** `document_embeddings` - 2 chunks vectorizados
- **Texto Extraído:** 3,447 caracteres
- **Chunks RAG:** 2 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### CIR-427.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-427.pdf
- **Firestore (Metadata):** `context_sources/aM0JcAPNq7ZtE9dMbaOk`
- **Firestore (Embeddings):** `document_embeddings` - 6 chunks vectorizados
- **Texto Extraído:** 10,020 caracteres
- **Chunks RAG:** 6 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


#### Cir-231.pdf
- **GCS (Archivo Original):** gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/Cir-231.pdf
- **Firestore (Metadata):** `context_sources/QLkYR6DClmOJY1tQkjBc`
- **Firestore (Embeddings):** `document_embeddings` - 3 chunks vectorizados
- **Texto Extraído:** 4,389 caracteres
- **Chunks RAG:** 3 chunks de ~512 tokens cada uno
- **Embeddings:** 0 vectores de 768 dimensiones
- **Búsqueda Semántica:** ❌ No disponible


### Traceabilidad (User Attribution)

Todas las operaciones y vectores vinculados a:
- **Usuario:** alec@getaifactory.com (`114671162830729001607`)
- **Fuente:** salfagpt-cli v0.3.0
- **Session ID:** `cli-session-1760920640426-if267k`

Registro en Firestore:
- **Collection `cli_events`:** Eventos de upload, extracción, chunking, embedding
- **Collection `cli_sessions`:** Resumen de esta sesión
- **Collection `context_sources`:** Metadata con `userEmail: alec@getaifactory.com`, `uploadedVia: 'cli'`
- **Collection `document_embeddings`:** Cada chunk con `userEmail: alec@getaifactory.com`, `source: 'cli'`



### Traceability

All operations tracked in Firestore:
- **Collection:** `cli_events`
- **Session Collection:** `cli_sessions`
- **User Attribution:** All events linked to `alec@getaifactory.com`
- **Origin Tracking:** Source field = `cli` (distinguishes from webapp)

---

