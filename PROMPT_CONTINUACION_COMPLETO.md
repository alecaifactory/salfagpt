# 🔄 PROMPT PARA CONTINUAR - Contexto Completo

**Para copiar en nueva conversación de Cursor**

---

## 📊 **CONTEXTO COMPLETO:**

### **Trabajo Realizado (Nov 24-25, 2025):**

**Objetivo:** Optimizar performance frontend de 30-84s a ≤6s + Resolver tickets backlog

**Branch:** `feat/frontend-performance-2025-11-24` → **MERGED TO MAIN** ✅

**Commits:** 36 commits mergeados + documentación

---

## ✅ **OPTIMIZACIONES COMPLETADAS:**

### **1. Performance Backend (us-east4):**
```
✅ BigQuery: flow_analytics_east4 (61,564 chunks)
✅ Cloud Storage: salfagpt-context-documents-east4 (800+ PDFs)
✅ Flags: USE_EAST4_BIGQUERY=true, USE_EAST4_STORAGE=true
✅ Backend medido: 2.6s (embedding + count)
```

### **2. Performance Frontend (9 fixes):**
```
1. ✅ Console logs disabled (350+ → 0) = -9s
2. ✅ Chunk buffering (500 chars) = -15s
3. ✅ MessageRenderer memoized = -4s
4. ✅ Threshold: 0.7 → 0.6 (+10% docs found)
5. ✅ Font: 16px → 14px (mejor UX)
6. ✅ React hooks fixed (cache clear - elimina crashes)
7. ✅ PDF loading: 3 buckets fallback
8. ✅ Storage paths: 919 documentos actualizados a us-east4
9. ✅ maxTokens: 8192 → 300 (Tu trabajo previo)
```

### **3. Análisis Backlog:**
```
✅ 88 tickets analizados
✅ 17+ tickets resueltos por optimizaciones
✅ 18 tickets identificados (requieren cargar docs faltantes)
```

---

## 🚨 **PROBLEMA ACTUAL (CRÍTICO):**

### **Issue: PDFs no cargan visualmente**

**Síntoma:**
```
Usuario click referencia [1]
  ↓
Modal muestra: "Vista de solo texto - Archivo PDF original no disponible"
  ↓
Solo texto, no PDF visual ❌
```

**Root Cause Identificado:**
```
Firestore metadata tenía:
  storagePath: "documents/timestamp-file.pdf" (path viejo us-central1)
  bucketName: "salfagpt-uploads" (bucket viejo)

Archivos reales están en:
  gs://salfagpt-context-documents-east4/userId/agentId/filename.pdf
```

**Fix Aplicado:**
```
Script: update-all-firestore-paths.mjs
Resultado: 919 documentos actualizados ✅
Skipped: 1,107 (ya correctos)
Total: 93% coverage (2,026/2,188)

Nuevo metadata:
  storagePath: "userId/agentId/filename.pdf"
  bucketName: "salfagpt-context-documents-east4"
  gcsPath: "gs://salfagpt-context-documents-east4/..."
```

**downloadFile() mejorado:**
```typescript
// storage.ts - Busca en 3 buckets:
1. salfagpt-context-documents-east4 (us-east4) ✅
2. salfagpt-uploads (us-central1 fallback)
3. salfagpt-context-documents (fallback)
```

---

## 🚨 **PROBLEMA SECUNDARIO (Mensaje Vacío):**

**Issue Nuevo Detectado:**
```
contentLength: 15 (casi vacío)
Last message preview: [object Object]
```

**Probable causa:**
```
content: { type: 'text', text: '...' }  // Objeto
vs
content: '...'  // String esperado

MessageRenderer espera string, recibe object
```

**Archivos a revisar:**
- `src/pages/api/conversations/[id]/messages.ts` (cómo guarda content)
- `src/pages/api/conversations/[id]/messages-stream.ts` (cómo guarda content)
- `src/components/MessageRenderer.tsx` (cómo renderiza)

---

## 🗺️ **ARQUITECTURA ACTUAL:**

```
┌──────────────────────────────────────────────────┐
│ REGIÓN          │ SERVICIO        │ STATUS      │
├──────────────────────────────────────────────────┤
│ us-central1     │ Firestore       │ ✅ Correcto │
│ (Global)        │ (metadata)      │ (no mover)  │
├──────────────────────────────────────────────────┤
│ us-east4        │ Cloud Run       │ ✅ Optimizado│
│ (Regional)      │ BigQuery        │ ✅ Optimizado│
│                 │ Cloud Storage   │ ✅ Optimizado│
└──────────────────────────────────────────────────┘

Firestore en us-central1 es CORRECTO:
- Es servicio global (latencia ~50ms ok)
- Almacena PATHS que apuntan a us-east4
- NO necesita moverse (sería semanas de trabajo por 20ms ganancia)
```

---

## 📋 **ESTADO ACTUAL:**

### **Main Branch:**
```yaml
Branch: main ✅
Merged: feat/frontend-performance-2025-11-24 ✅
Pushed: GitHub ✅
Server: localhost:3000 (PID 32452) ✅

Optimizations Active:
  - maxTokens: 300 ✅
  - Storage paths: 919 updated ✅
  - us-east4 flags: true ✅
  - Chunk buffering: 500 chars ✅
  - PDF fallback: 3 buckets ✅
```

### **Performance:**
```
Backend: ~2-3s (us-east4) ✅
Gemini: ~3s (300 tokens) ✅
Frontend: ~2s overhead ✅
TOTAL: ~7-8s (vs 30-84s)
Mejora: 4-10x ⚡⚡⚡
```

### **Issues Pendientes:**
```
1. 🚨 PDFs no cargan visualmente (metadata actualizado pero aún muestra texto)
2. 🚨 Mensajes vacíos (contentLength: 15, content: [object Object])
3. ⚠️  162 documentos sin archivo en GCS (del total 2,188)
```

---

## 🎯 **PRÓXIMOS PASOS PROPUESTOS:**

### **PASO 1: Fix Mensaje Vacío (CRÍTICO)**

**Problema:** `contentLength: 15`, `preview: [object Object]`

**Diagnóstico:**
```bash
# Ver cómo se está guardando el mensaje
grep -A10 "addMessage" src/pages/api/conversations/[id]/messages-stream.ts | grep "content:"

# Ver cómo se está leyendo
grep -A5 "Last message content" src/components/ChatInterfaceWorking.tsx
```

**Fix probable:**
```typescript
// Si content es objeto, extraer .text
const contentText = typeof msg.content === 'string' 
  ? msg.content 
  : msg.content?.text || String(msg.content);
```

**Archivos a modificar:**
- `src/components/ChatInterfaceWorking.tsx` línea ~1140
- Verificar que MessageRenderer reciba string

---

### **PASO 2: Verificar PDF Loading**

**A pesar del fix de paths, aún no carga visualmente.**

**Diagnóstico:**
```bash
# Ver logs cuando click referencia
tail -f logs | grep "context-sources.*file\|storagePath\|Downloading"

# Debería ver:
# ✅ storagePath: userId/agentId/filename
# ✅ Trying bucket: salfagpt-context-documents-east4
# ✅ File downloaded
```

**Si ve:**
```
❌ hasStoragePath: false
❌ Generating HTML preview

= Metadata NO actualizado para ese doc específico
```

**Fix:**
```bash
# Actualizar doc específico que se está viendo
node scripts/trace-document-location.mjs
# Actualiza metadata y verifica descarga
```

---

### **PASO 3: Restart Server Fresh**

**Después de fixes:**
```bash
pkill -f "astro dev"
rm -rf node_modules/.vite dist .astro  # Clear cache
npm run dev

# Fresh start con metadata actualizado
```

---

### **PASO 4: Test Completo**

**Casos de evaluación:**
```
1. Performance: ~7-8s esperado
2. Referencias: Visibles con >60% similarity
3. PDFs: Cargan visualmente
4. Respuestas: Concisas (300 tokens)
```

---

## 📁 **ARCHIVOS CLAVE:**

### **Código Modificado:**
```
src/lib/storage.ts - downloadFile() con fallback
src/lib/gemini.ts - maxTokens = 300
src/pages/api/conversations/[id]/messages-stream.ts - buffering
src/components/ChatInterfaceWorking.tsx - UI logic
src/components/MessageRenderer.tsx - render logic
src/styles/global.css - font 14px
```

### **Scripts Útiles:**
```
scripts/update-all-firestore-paths.mjs - Actualizar paths
scripts/trace-document-location.mjs - Diagnosticar doc específico
scripts/benchmark-simple.mjs - Medir backend
scripts/get-all-tickets.mjs - Ver tickets backlog
```

### **Documentación:**
```
DIAGRAMA_INFRAESTRUCTURA_COMPLETO_REGIONES.md - Arquitectura
COMPATIBILIDAD_OPTIMIZACIONES.md - Optimizaciones combinadas
FIRESTORE_US_CENTRAL1_EXPLICACION.md - Por qué Firestore OK
MERGE_COMPLETADO_MAIN.md - Estado del merge
```

---

## 🔑 **INFORMACIÓN CRÍTICA:**

### **IDs Clave:**
```
Usuario: usr_uhwqffaqag1wrryd82tw (alec@getaifactory.com)
Agentes:
  - S2-v2: 1lgr33ywq5qed67sqCYi (467 sources, 20K chunks)
  - M3-v2: vStojK73ZKbjNsEnqANJ (77 sources, 12K chunks)
  - M1-v2: EgXezLcu4O3IUqFUJhUZ
  - S1-v2: iQmdg3bMSJ1AdqqlFpye

Documento problema ejemplo:
  ID: LqZZrXNqK5zKKl26rwXZ
  Nombre: GOP-D-PI-1.PLANIFICACION...
  Path actualizado: usr_.../vSto.../GOP-D-PI-1...
```

### **Buckets:**
```
NUEVO (us-east4): salfagpt-context-documents-east4 ✅
VIEJO (us-central1): salfagpt-uploads, salfagpt-context-documents
```

### **Datasets:**
```
NUEVO (us-east4): flow_analytics_east4 ✅
VIEJO (us-central1): flow_analytics
```

---

## 🎯 **COMANDO PARA SIGUIENTE SESIÓN:**

```markdown
# CONTEXTO:
Estoy continuando optimización frontend + fix PDFs para SalfaGPT.

# ESTADO ACTUAL:
- Branch: main (36 commits mergeados)
- Performance: 30-84s → 7-8s (4-10x mejora)
- Storage: 919 PDFs paths actualizados a us-east4
- Issue: PDFs no cargan visualmente (muestra "solo texto")
- Issue 2: Mensajes vacíos (contentLength: 15)

# LO QUE FUNCIONA:
✅ Backend us-east4 (2.6s)
✅ maxTokens 300 (3s Gemini)
✅ Chunk buffering (500 chars)
✅ Storage fallback (3 buckets)
✅ 919 paths actualizados en Firestore

# LO QUE FALTA:
❌ PDFs no cargan (metadata actualizado pero endpoint sigue retornando HTML)
❌ Mensajes contenido vacío (content: [object Object])

# ARCHIVOS CLAVE:
- src/pages/api/context-sources/[id]/file.ts (endpoint PDFs)
- src/lib/storage.ts (downloadFile con fallback)
- src/components/ChatInterfaceWorking.tsx (renderiza mensajes)
- Firestore collection: context_sources (metadata con paths)

# PRÓXIMOS PASOS:
1. Fix content vacío en mensajes (object → string)
2. Debug por qué endpoint file.ts retorna HTML no PDF
3. Verificar metadata realmente actualizado para docs específicos
4. Test completo y deploy

# COMANDO INICIAL:
Revisar src/pages/api/context-sources/[id]/file.ts
Ver por qué retorna HTML ("Vista de solo texto") 
a pesar de que storagePath fue actualizado.

Documento ejemplo problema:
  ID: LqZZrXNqK5zKKl26rwXZ
  Nombre: GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1) (1).PDF
  Path debería ser: usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP...
  Bucket: salfagpt-context-documents-east4

Server logs muestran:
  hasStoragePath: false ← EL PROBLEMA
  Debería ser: true con path correcto

Fix: Verificar por qué getContextSource() no ve metadata actualizado.
```

---

## 📚 **DOCUMENTACIÓN COMPLETA:**

Ver archivos en repo:
- `DIAGRAMA_INFRAESTRUCTURA_COMPLETO_REGIONES.md` - Arquitectura
- `COMPATIBILIDAD_OPTIMIZACIONES.md` - Optimizaciones compatibles
- `FIRESTORE_US_CENTRAL1_EXPLICACION.md` - Por qué Firestore OK
- `ESTADO_LOCALHOST_VERIFICADO.md` - Estado actual verificado
- `MERGE_COMPLETADO_MAIN.md` - Resumen merge

---

## 🔧 **ROLLBACK SI NECESARIO:**

```bash
# Si hay problemas críticos:
git revert -m 1 18767c7  # Revert merge
git push origin main

# O toggle flags:
USE_EAST4_BIGQUERY=false
USE_EAST4_STORAGE=false
```

---

**Branch actual:** main  
**Server:** localhost:3000 (corriendo)  
**Performance:** 4-10x mejorado  
**Issues:** PDFs + mensajes vacíos

**START HERE:** Debug endpoint `/api/context-sources/[id]/file.ts`

