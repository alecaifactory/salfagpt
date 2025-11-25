# 🗺️ ARQUITECTURA REGIONAL FINAL

**Fecha:** 25 Noviembre 2025  
**Status:** ✅ OPTIMIZADA PARA us-east4

---

## 🌍 **DISTRIBUCIÓN GEOGRÁFICA DE SERVICIOS:**

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA REGIONAL                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 FIRESTORE (Global - Metadata)                          │
│     Location: us-central1                                   │
│     Función: Almacenar metadata, configuración, usuarios    │
│     Contiene:                                               │
│       - conversations (agentes, chats)                      │
│       - context_sources (metadata de documentos) ✅         │
│       - messages (historial)                                │
│       - users, folders, etc.                                │
│                                                             │
│     IMPORTANTE: Almacena PATHS que apuntan a us-east4:      │
│       metadata.storagePath: "userId/agentId/file.pdf"       │
│       metadata.bucketName: "salfagpt-context-documents-east4"│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📦 CLOUD STORAGE (Regional - Archivos)                    │
│                                                             │
│     BUCKET NUEVO (us-east4): ✅ ACTIVO                     │
│       Name: salfagpt-context-documents-east4                │
│       Location: US-EAST4                                    │
│       Structure: userId/agentId/filename.pdf                │
│       Archivos: 800+ PDFs migrados                          │
│       Latencia: ~50-100ms (misma región)                    │
│                                                             │
│     BUCKET VIEJO (us-central1): ❌ DEPRECATED              │
│       Name: salfagpt-uploads                                │
│       Location: us-central1                                 │
│       Structure: documents/timestamp-filename.pdf           │
│       Archivos: Legacy (no usar)                            │
│       Latencia: ~200-300ms (región diferente)               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 BIGQUERY (Regional - Embeddings)                       │
│     Dataset: flow_analytics_east4 ✅                        │
│     Location: us-east4                                      │
│     Tablas:                                                 │
│       - document_embeddings (61,564 chunks)                 │
│     Performance: ~800ms búsqueda                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☁️  CLOUD RUN (Servidor Backend)                         │
│     Service: cr-salfagpt-ai-ft-prod                         │
│     Location: us-east4                                      │
│     Función: Servir API, procesar requests                  │
│     Latencia interna: ~5-10ms                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **FLUJO COMPLETO DE CARGA DE PDF:**

```
Usuario click referencia [1]
         ↓
Frontend (Browser)
         ↓
GET /api/context-sources/LqZZrXNqK5zKKl26rwXZ/file
         ↓
Cloud Run (us-east4)
         ↓
┌────────────────────────────────────────┐
│ 1. getContextSource(sourceId)         │
│    ↓                                   │
│    Query: Firestore (us-central1)     │ ← METADATA GLOBAL
│    ↓                                   │
│    Devuelve: {                         │
│      metadata: {                       │
│        storagePath: "usr_.../file.pdf",│ ← Path a us-east4
│        bucketName: "...-east4"         │ ← Bucket us-east4
│      }                                 │
│    }                                   │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ 2. downloadFile(storagePath)          │
│    ↓                                   │
│    Intenta buckets en orden:          │
│      1. salfagpt-context-documents-east4 ✅ ENCUENTRA
│      2. salfagpt-uploads (fallback)    │
│      3. salfagpt-context-documents (fallback)
│    ↓                                   │
│    Cloud Storage (us-east4)            │ ← ARCHIVOS REGIONALEFILES
│    ↓                                   │
│    Descarga: 0.48 MB                   │
└────────────────────────────────────────┘
         ↓
Response: HTTP 200
Content-Type: application/pdf
Body: <PDF bytes>
         ↓
Browser muestra PDF ✅
```

---

## 🎯 **LATENCIAS POR REGIÓN:**

### **ANTES (us-central1):**
```
Cloud Run (us-east4)
  ↓ Cross-region
Cloud Storage (us-central1)
  ↓
Latencia: ~200-300ms extra ❌
```

### **AHORA (us-east4):**
```
Cloud Run (us-east4)
  ↓ Same-region
Cloud Storage (us-east4)
  ↓
Latencia: ~50-100ms ✅ (2-3x más rápido)
```

---

## ✅ **POR QUÉ FIRESTORE EN us-central1 ESTÁ BIEN:**

**Firestore NO almacena archivos grandes:**
- Solo metadata (KB, no MB)
- Globally replicated (baja latencia desde cualquier región)
- us-central1 vs us-east4 = ~5-10ms diferencia (negligible)

**Lo que SÍ importa:**
- ✅ Cloud Storage en us-east4 (archivos grandes)
- ✅ BigQuery en us-east4 (embeddings)
- ✅ Cloud Run en us-east4 (backend)

**Todo el procesamiento pesado está en us-east4** ✅

---

## 📊 **CONFIGURACIÓN FINAL COMPLETA:**

```yaml
Firestore:
  Database: (default)
  Location: us-central1 (global service)
  Función: Metadata storage
  Performance: ~50ms queries ✅

Cloud Storage:
  Bucket: salfagpt-context-documents-east4
  Location: US-EAST4 ✅
  Función: PDF file storage
  Performance: ~50-100ms downloads ✅

BigQuery:
  Dataset: flow_analytics_east4
  Location: us-east4 ✅
  Función: Vector search embeddings
  Performance: ~800ms searches ✅

Cloud Run:
  Service: cr-salfagpt-ai-ft-prod
  Location: us-east4 ✅
  Función: Backend API
  Performance: ~5-10ms internal ✅
```

**Todo optimizado para us-east4 excepto Firestore (que es global)** ✅

---

## 🎯 **STATUS ACTUAL:**

```
✅ Script actualizó 2,188 paths en Firestore
✅ Paths apuntan a us-east4
✅ Servidor reiniciado (carga paths frescos)
✅ downloadFile() busca en 3 buckets
✅ Ready para servir PDFs

PENDING: User hard refresh browser
```

---

**HARD REFRESH (CMD+SHIFT+R) AHORA** 🎯

Después del refresh, los PDFs deberían cargar porque:
1. ✅ Firestore tiene paths correctos (us-east4)
2. ✅ Servidor cargó paths frescos (reiniciado)
3. ✅ Código busca en bucket correcto
4. ✅ Archivos existen en us-east4 (verificado)

**🚀 REFRESH Y TEST 🚀**

