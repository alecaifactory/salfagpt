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

