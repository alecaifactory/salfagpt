# ✅ Visor Seguro + URLs de Monitoreo GCP

**Fecha:** 18 de Octubre, 2025  
**Estado:** ✅ IMPLEMENTADO

---

## 🔐 Visor de Archivos Seguro

### Endpoint Autenticado

**Nuevo:** `/api/context-sources/:id/file`

**Seguridad:**
1. ✅ Requiere login (session cookie)
2. ✅ Verifica ownership (userId must match)
3. ✅ Descarga de Cloud Storage server-side
4. ✅ Sirve archivo solo si autorizado

**Código:**
```typescript
// Authentication
const session = getSession(context);
if (!session) return 401;

// Authorization
if (source.userId !== session.id) return 403;

// Download from Cloud Storage
const fileBuffer = await downloadFile(storagePath);

// Serve file
return new Response(fileBuffer, {
  'Content-Type': 'application/pdf',
  'Cache-Control': 'private, max-age=3600',
});
```

---

### Visor Integrado en Modal

**Antes:**
```tsx
<iframe src="https://storage.googleapis.com/..." />
// ❌ URL pública, sin autenticación
```

**Ahora:**
```tsx
<iframe src="/api/context-sources/{id}/file" />
// ✅ Endpoint autenticado, solo usuarios con permisos
```

**Diseño:**
```
┌────────────────────────────────────────┐
│ [👁 Ver archivo]                      │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 📄 ANEXOS-Manual...  Vista protegida│ │
│ ├────────────────────────────────────┤ │
│ │                                     │ │
│ │   [Contenido del PDF]               │ │
│ │   - Scrolleable                     │ │
│ │   - 384px altura                    │ │
│ │   - Dentro del modal                │ │
│ │                                     │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## 📊 URLs de Monitoreo en GCP

### Cloud Storage - Archivos Subidos

**Ver todos los archivos:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads/documents?project=gen-lang-client-0986191192
```

**Ver archivo específico:**
```
https://console.cloud.google.com/storage/browser/_details/gen-lang-client-0986191192-uploads/documents/1760816030388-ANEXOS-Manual-EAE-IPT-MINVU.pdf?project=gen-lang-client-0986191192
```

**Métricas de Storage:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads;tab=live_object_monitoring?project=gen-lang-client-0986191192
```

---

### Firestore - Chunks y Metadata

**Collection document_chunks (RAG chunks con embeddings):**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/document_chunks?project=gen-lang-client-0986191192
```

**Collection context_sources (metadata de documentos):**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/context_sources?project=gen-lang-client-0986191192
```

**Ver documento específico:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/context_sources/WxoZcqIGLdrQcnVBHuZY?project=gen-lang-client-0986191192
```

**Buscar por userId:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/query;collection=document_chunks;filter=userId%3D%3D114671162830729001607?project=gen-lang-client-0986191192
```

---

### Cloud Run - Logs de Procesamiento

**Logs del servicio:**
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/logs?project=gen-lang-client-0986191192
```

**Filtrar solo re-indexing:**
```
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0AtextPayload%3D~%22Re-indexing%7CRAG%20indexing%7CSaved.*chunks%22?project=gen-lang-client-0986191192
```

**Filtrar solo Cloud Storage operations:**
```
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0AtextPayload%3D~%22Uploading%20to%20Cloud%20Storage%7CDownloading%20from%20Cloud%20Storage%22?project=gen-lang-client-0986191192
```

---

### Logs Explorer - Queries Avanzadas

**Logs generales:**
```
https://console.cloud.google.com/logs/query?project=gen-lang-client-0986191192
```

**Query para todo el proceso de re-indexing:**
```
Query en Logs Explorer:

resource.type="cloud_run_revision"
(
  textPayload=~"Re-indexing source" OR
  textPayload=~"Downloading from Cloud Storage" OR
  textPayload=~"Fresh extraction complete" OR
  textPayload=~"Starting RAG indexing" OR
  textPayload=~"Saved.*chunks" OR
  textPayload=~"RAG indexing complete"
)
severity>=INFO
```

**Query para errores:**
```
resource.type="cloud_run_revision"
severity>=ERROR
textPayload=~"RAG|reindex|storage"
```

---

### Monitoring - Métricas en Tiempo Real

**Cloud Run métricas:**
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/metrics?project=gen-lang-client-0986191192
```

**Request latency (ver si re-index demora mucho):**
```
https://console.cloud.google.com/monitoring/dashboards/builder?project=gen-lang-client-0986191192
```

**Storage usage:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads;tab=live_object_monitoring?project=gen-lang-client-0986191192
```

---

## 🔍 Cómo Monitorear el Proceso

### Durante Re-indexación

**1. Abrir Logs de Cloud Run:**
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/logs?project=gen-lang-client-0986191192
```

**2. Filtrar por tu request:**
- Busca: `Re-indexing source: WxoZcqIGLdrQcnVBHuZY`
- Verás toda la secuencia

**3. Seguir el progreso:**
```
✅ Original file found in storage
📥 Downloading...
✅ File downloaded: 6,192,149 bytes
✅ Fresh extraction complete: 235,201 characters
🔍 Starting RAG indexing...
  Processing chunks 1-10 of 74...
  ✓ Saved 10 chunks
  Processing chunks 11-20 of 74...
  ✓ Saved 10 chunks
  ... (continúa)
✅ RAG indexing complete!
  Chunks created: 74
  Total tokens: 73,401
  Time: 25.68s
```

---

### Ver Chunks Creados

**Firestore Console:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/document_chunks?project=gen-lang-client-0986191192
```

**Filtrar por sourceId:**
- Click "Start Collection"
- Add filter: `sourceId == WxoZcqIGLdrQcnVBHuZY`
- Verás 74 documentos (chunks)

**Verificar embedding:**
- Click en cualquier chunk
- Campo `embedding`: Array con 768 números
- Campo `text`: Texto del chunk
- Campo `metadata.tokenCount`: Tokens del chunk

---

### Ver Archivo en Cloud Storage

**Browser del bucket:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads/documents?project=gen-lang-client-0986191192
```

**Buscar archivo:**
- Scroll o busca: `1760816030388-ANEXOS-Manual-EAE-IPT-MINVU.pdf`
- Click para ver detalles
- Tamaño: 6.19 MB
- Metadata: originalName, uploadedAt, model, etc.

---

## ✅ Seguridad Implementada

### Niveles de Protección

**Nivel 1: Authentication**
```
¿Usuario logueado?
  NO → HTTP 401 Unauthorized
  SÍ → Continuar
```

**Nivel 2: Authorization**
```
¿Usuario es dueño del documento?
  NO → HTTP 403 Forbidden
  SÍ → Continuar
```

**Nivel 3: Cloud Storage**
```
¿Archivo existe en storage?
  NO → HTTP 404 Not Found
  SÍ → Servir archivo
```

### Beneficios

- ✅ Solo usuarios autenticados ven archivos
- ✅ Solo dueños ven sus documentos
- ✅ URLs no son públicas
- ✅ No se puede acceder directo a Cloud Storage
- ✅ Todo pasa por autenticación de la plataforma

---

## 📋 Archivos Creados/Modificados

1. ✅ `src/pages/api/context-sources/[id]/file.ts` (nuevo)
   - Endpoint autenticado
   - Verifica session
   - Verifica ownership
   - Descarga de Cloud Storage
   - Sirve archivo protegido

2. ✅ `src/components/ContextSourceSettingsModalSimple.tsx`
   - Usa endpoint autenticado
   - Visor integrado con iframe
   - Header con "Vista protegida"
   - Toggle Ver/Ocultar

---

## 🧪 Testing

### Test 1: Ver archivo autenticado

```
1. Modal abierto
2. Sección "Archivo Original"
3. Click "Ver archivo"
4. iframe carga: /api/context-sources/{id}/file
5. Backend verifica auth
6. Descarga de Cloud Storage
7. Sirve PDF en iframe
8. Usuario ve PDF dentro del modal ✅
```

### Test 2: Seguridad

```
1. Copy URL del iframe: /api/context-sources/abc123/file
2. Abre en incognito (sin login)
3. Resultado: HTTP 401 Unauthorized ✅
4. Login
5. Intenta acceder con otro userId
6. Resultado: HTTP 403 Forbidden ✅
```

---

## 📍 URLs Rápidas de Acceso

**Copiar estas URLs para monitoreo:**

**Storage:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads/documents?project=gen-lang-client-0986191192
```

**Firestore Chunks:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/document_chunks?project=gen-lang-client-0986191192
```

**Cloud Run Logs:**
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/logs?project=gen-lang-client-0986191192
```

**Monitoring Dashboard:**
```
https://console.cloud.google.com/monitoring/dashboards?project=gen-lang-client-0986191192
```

---

**Build exitoso:** ✅  
**Sin errores críticos:** ✅  

**Refresh browser para ver:**
1. Visor seguro integrado
2. "Vista protegida" en header del iframe
3. Acceso solo con autenticación

🚀














