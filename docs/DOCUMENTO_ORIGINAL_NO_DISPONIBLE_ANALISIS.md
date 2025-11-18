# 📄 Documento Original No Disponible - Análisis y Solución

**Fecha:** 2025-11-15  
**Problema:** Algunos documentos muestran "Vista de solo texto - El archivo original no está disponible"  
**Estado:** 🔍 Análisis Completo + Solución Diseñada

---

## 🎯 Por Qué Ocurre Esto

### Razón 1: Documentos Legacy (Pre-Cloud Storage)
**Cuándo:** Documentos subidos ANTES de implementar Cloud Storage (Octubre 2025)

**Qué pasó:**
- ✅ Texto extraído con Gemini AI → Guardado en Firestore
- ❌ Archivo original NO subido a Cloud Storage
- ❌ Solo existe `extractedData`, no `storagePath`

**Ejemplo:**
```typescript
{
  id: "abc123",
  name: "Documento Legacy.pdf",
  extractedData: "Texto completo extraído...", // ✅ Existe
  metadata: {
    storagePath: undefined,  // ❌ No existe
    gcsPath: undefined       // ❌ No existe
  }
}
```

**Cantidad estimada:** ~884 documentos (todos los subidos antes de Oct 2025)

---

### Razón 2: Problema con userId Format en Cloud Storage
**Cuándo:** Documentos subidos con Google OAuth numeric ID

**Qué pasó:**
- Archivo subido a Cloud Storage con ruta: `gs://bucket/{googleOAuthId}/{agentId}/file.pdf`
- Ahora buscamos con hash userId: `gs://bucket/{hashId}/{agentId}/file.pdf`
- ❌ Ruta no coincide → archivo no encontrado

**Ejemplo:**
```
Archivo guardado en:
gs://bucket/114671162830729001607/agent-xyz/documento.pdf

Buscamos en:
gs://bucket/usr_uhwqffaqag1wrryd82tw/agent-xyz/documento.pdf

Resultado: 404 Not Found ❌
```

**Cantidad estimada:** Depende de cuántos se subieron con CLI o API antes de la migración de userId

---

### Razón 3: Archivo Eliminado o Corrupto
**Cuándo:** Errores de almacenamiento o limpieza manual

**Qué pasó:**
- Metadata en Firestore indica `storagePath: "documents/file.pdf"`
- Archivo fue eliminado de Cloud Storage (manual o error)
- ❌ Archivo no existe pero metadata sí

**Cantidad estimada:** Raro, < 10 documentos

---

### Razón 4: Error en Upload Original
**Cuándo:** Upload falló pero se guardó el texto extraído

**Qué pasó:**
- Upload a Cloud Storage falló (timeout, permisos, etc.)
- Pero texto extraído sí se guardó en Firestore
- ❌ `storagePath` marcado pero archivo no existe

**Cantidad estimada:** Muy raro, < 5 documentos

---

## 🔍 Cómo Detectar Cada Caso

### Script de Análisis
```typescript
// scripts/analyze-missing-originals.ts

async function analyzeMissingOriginals() {
  const sources = await getAllContextSources();
  
  const categories = {
    legacy: [],           // No storagePath at all
    userIdMismatch: [],   // storagePath exists but uses old userId
    deleted: [],          // storagePath exists but file not in GCS
    corrupted: [],        // storagePath exists but download fails
    available: [],        // File available and accessible
  };
  
  for (const source of sources) {
    const metadata = source.metadata as any;
    const storagePath = metadata?.storagePath || metadata?.gcsPath;
    
    if (!storagePath) {
      // LEGACY: No storage path at all
      categories.legacy.push(source);
      continue;
    }
    
    // Check if path uses numeric userId
    if (storagePath.includes('114671162830729001607')) {
      categories.userIdMismatch.push(source);
      continue;
    }
    
    // Try to download file
    try {
      const exists = await checkFileExists(storagePath);
      if (!exists) {
        categories.deleted.push(source);
      } else {
        categories.available.push(source);
      }
    } catch (error) {
      categories.corrupted.push(source);
    }
  }
  
  return categories;
}
```

---

## ✅ Solución Completa

### Componente: Enhanced Document Viewer con Recovery Options

Modificar `DocumentViewerModal.tsx` y `PipelineDetailView.tsx` para mostrar:

```tsx
{/* Si archivo no disponible */}
{!documentUrl && loadError && (
  <div className="flex-1 flex flex-col items-center justify-center p-8 bg-yellow-50">
    <AlertTriangle className="w-16 h-16 text-yellow-600 mb-4" />
    
    <h3 className="text-lg font-bold text-slate-800 mb-2">
      Archivo Original No Disponible
    </h3>
    
    <p className="text-sm text-slate-600 mb-4 text-center max-w-md">
      El texto extraído está disponible abajo, pero el archivo PDF original no se encuentra.
    </p>
    
    {/* Explicación del problema */}
    <div className="mb-6 p-4 bg-white rounded-lg border border-yellow-200 max-w-md">
      <p className="text-xs font-semibold text-slate-700 mb-2">
        ¿Por qué pasa esto?
      </p>
      <ul className="text-xs text-slate-600 space-y-1">
        <li>• Documento subido antes de Octubre 2025 (solo se guardó el texto)</li>
        <li>• Ruta de almacenamiento cambió tras migración de usuarios</li>
        <li>• Archivo eliminado o corrupto en Cloud Storage</li>
      </ul>
    </div>
    
    {/* RECOVERY OPTIONS */}
    <div className="flex flex-col gap-3 w-full max-w-md">
      
      {/* Option 1: Re-upload (SuperAdmin only) */}
      {userRole === 'superadmin' && (
        <button
          onClick={() => setShowReUploadDialog(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Volver a Subir Archivo Original
        </button>
      )}
      
      {/* Option 2: Report Bug (All users) */}
      <button
        onClick={() => {
          setShowBugReportDialog(true);
          // Auto-capture screenshot of current section
          captureScreenshotForBugReport();
        }}
        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
      >
        <Bug className="w-4 h-4" />
        Reportar Problema
      </button>
      
      {/* Option 3: View extracted text anyway */}
      <button
        onClick={() => setShowExtractedText(true)}
        className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium flex items-center justify-center gap-2"
      >
        <FileText className="w-4 h-4" />
        Ver Texto Extraído
      </button>
    </div>
  </div>
)}
```

---

## 🔧 Recovery Options Implementadas

### Opción 1: Re-Upload de Archivo (SuperAdmin Only)

**Modal: ReUploadDocumentDialog**

```tsx
<Modal isOpen={showReUploadDialog} onClose={() => setShowReUploadDialog(false)}>
  <div className="p-6">
    <h3 className="text-lg font-bold mb-4">Reemplazar Archivo Original</h3>
    
    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
      <p className="text-sm text-slate-700 mb-2">
        <strong>Documento:</strong> {source.name}
      </p>
      <p className="text-xs text-slate-600">
        El texto extraído se mantendrá. Solo se actualizará el archivo PDF original.
      </p>
    </div>
    
    {/* File upload */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Seleccionar archivo PDF
      </label>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="w-full"
      />
    </div>
    
    {selectedFile && (
      <div className="mb-4 p-3 bg-slate-50 rounded">
        <p className="text-xs text-slate-700">
          <strong>Archivo seleccionado:</strong> {selectedFile.name}
        </p>
        <p className="text-xs text-slate-600">
          Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    )}
    
    {/* Actions */}
    <div className="flex gap-3">
      <button
        onClick={handleReUpload}
        disabled={!selectedFile || uploading}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 inline mr-2" />
            Subir Archivo
          </>
        )}
      </button>
      <button
        onClick={() => setShowReUploadDialog(false)}
        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
      >
        Cancelar
      </button>
    </div>
  </div>
</Modal>
```

**Implementación:**
```typescript
const handleReUpload = async () => {
  if (!selectedFile) return;
  
  setUploading(true);
  
  try {
    // Upload file to Cloud Storage
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sourceId', source.id);
    formData.append('userId', userId);
    
    const response = await fetch('/api/context-sources/reupload-original', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Update source with new storagePath
      setSource({
        ...source,
        metadata: {
          ...source.metadata,
          storagePath: data.storagePath,
          bucketName: data.bucketName,
          reUploadedAt: new Date(),
          reUploadedBy: userId,
        }
      });
      
      alert('✅ Archivo subido exitosamente');
      setShowReUploadDialog(false);
      
      // Reload document
      loadDocument();
    }
  } catch (error) {
    console.error('Error re-uploading file:', error);
    alert('❌ Error subiendo archivo');
  } finally {
    setUploading(false);
  }
};
```

---

### Opción 2: Reportar Bug (Todos los usuarios)

**Modal: BugReportDialog con Auto-Screenshot**

```tsx
<Modal isOpen={showBugReportDialog} onClose={() => setShowBugReportDialog(false)}>
  <div className="p-6">
    <div className="flex items-center gap-3 mb-4">
      <Bug className="w-6 h-6 text-red-600" />
      <h3 className="text-lg font-bold">Reportar Documento Faltante</h3>
    </div>
    
    {/* Auto-captured screenshot */}
    {screenshot && (
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-700 mb-2">
          Captura automática de la sección:
        </p>
        <img
          src={screenshot}
          alt="Screenshot"
          className="w-full border border-slate-200 rounded"
        />
      </div>
    )}
    
    {/* Pre-filled bug info */}
    <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-2">
      <div>
        <span className="text-xs font-semibold text-slate-700">Documento:</span>
        <span className="text-xs text-slate-600 ml-2">{source.name}</span>
      </div>
      <div>
        <span className="text-xs font-semibold text-slate-700">Problema:</span>
        <span className="text-xs text-slate-600 ml-2">Archivo original no disponible</span>
      </div>
      <div>
        <span className="text-xs font-semibold text-slate-700">Agente:</span>
        <span className="text-xs text-slate-600 ml-2">{agentName}</span>
      </div>
      <div>
        <span className="text-xs font-semibold text-slate-700">Storage Path:</span>
        <span className="text-xs text-slate-600 ml-2 font-mono">
          {(source.metadata as any)?.storagePath || 'No disponible'}
        </span>
      </div>
    </div>
    
    {/* User description (optional) */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Descripción adicional (opcional):
      </label>
      <textarea
        value={bugDescription}
        onChange={(e) => setBugDescription(e.target.value)}
        placeholder="¿Cuándo subiste este documento? ¿Qué esperabas ver?"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        rows={3}
      />
    </div>
    
    {/* Actions */}
    <div className="flex gap-3">
      <button
        onClick={handleSubmitBugReport}
        disabled={submitting}
        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 font-medium flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar a Backlog
          </>
        )}
      </button>
      <button
        onClick={() => setShowBugReportDialog(false)}
        className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
      >
        Cancelar
      </button>
    </div>
  </div>
</Modal>
```

**Implementación:**
```typescript
const captureScreenshotForBugReport = async () => {
  try {
    // Capture current section (document viewer area)
    const element = document.querySelector('.document-viewer-content');
    if (!element) return;
    
    // Use html2canvas or similar
    const canvas = await html2canvas(element as HTMLElement);
    const screenshot = canvas.toDataURL('image/png');
    
    setScreenshot(screenshot);
    console.log('📸 Screenshot captured for bug report');
  } catch (error) {
    console.warn('⚠️ Could not capture screenshot:', error);
    // Continue without screenshot
  }
};

const handleSubmitBugReport = async () => {
  setSubmitting(true);
  
  try {
    // Create ticket in feedback_tickets collection
    const ticketData = {
      title: `Documento faltante: ${source.name}`,
      description: bugDescription || 'Archivo original no disponible en visor',
      category: 'missing_document',
      priority: 'medium',
      status: 'open',
      
      // Context
      sourceId: source.id,
      sourceName: source.name,
      agentId: agentId,
      agentName: agentName,
      
      // Storage info
      storagePath: (source.metadata as any)?.storagePath,
      gcsPath: (source.metadata as any)?.gcsPath,
      
      // User info
      reportedBy: userId,
      reportedByEmail: userEmail,
      reportedByName: userName,
      
      // Screenshot
      screenshot: screenshot, // Base64 image
      
      // Diagnostic info
      diagnostic: {
        hasExtractedData: !!source.extractedData,
        hasStoragePath: !!(source.metadata as any)?.storagePath,
        extractedDataSize: source.extractedData?.length || 0,
        sourceUserId: source.userId,
        currentUserId: userId,
        userIdMatch: source.userId === userId,
      },
      
      timestamp: new Date(),
    };
    
    const response = await fetch('/api/stella/feedback-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(ticketData),
    });
    
    if (response.ok) {
      alert('✅ Reporte enviado al Backlog');
      setShowBugReportDialog(false);
      setBugDescription('');
      setScreenshot(null);
    } else {
      throw new Error('Failed to create ticket');
    }
    
  } catch (error) {
    console.error('Error submitting bug report:', error);
    alert('❌ Error enviando reporte. Por favor intenta de nuevo.');
  } finally {
    setSubmitting(false);
  }
};
```

---

## 🔧 Soluciones por Tipo de Problema

### Para Documentos Legacy (Sin storagePath)

**Solución A: Re-extract con nuevo upload**
```typescript
// En ReUploadDialog
// 1. Usuario sube archivo PDF original
// 2. Sistema lo guarda en Cloud Storage con ruta correcta
// 3. Actualiza metadata.storagePath
// 4. Mantiene extractedData existente (no re-extrae a menos que usuario quiera)
```

**Solución B: Marcar como "Solo texto"**
```typescript
// Actualizar metadata para indicar que es intencional
metadata: {
  ...existingMetadata,
  textOnlyMode: true,
  reason: 'legacy_upload_no_original',
  markedAt: new Date(),
}
```

---

### Para Documentos con userId Mismatch

**Solución A: Migrate Storage Paths (Automated)**
```typescript
// scripts/migrate-storage-paths.ts

async function migrateStoragePaths() {
  const USER_MAPPING = {
    '114671162830729001607': 'usr_uhwqffaqag1wrryd82tw'
  };
  
  for (const [oldId, newId] of Object.entries(USER_MAPPING)) {
    // 1. Find all sources with old userId in storagePath
    const sources = await firestore
      .collection('context_sources')
      .where('metadata.storagePath', '>=', oldId)
      .where('metadata.storagePath', '<=', oldId + '\uf8ff')
      .get();
    
    // 2. For each source
    for (const doc of sources.docs) {
      const source = doc.data();
      const oldPath = source.metadata?.storagePath;
      
      if (oldPath && oldPath.includes(oldId)) {
        // 3. Copy/move file in Cloud Storage
        const newPath = oldPath.replace(oldId, newId);
        
        await copyFileInStorage(oldPath, newPath);
        
        // 4. Update Firestore metadata
        await doc.ref.update({
          'metadata.storagePath': newPath,
          'metadata.oldStoragePath': oldPath, // Keep reference
          'metadata.pathMigratedAt': new Date(),
        });
        
        console.log(`✅ Migrated: ${oldPath} → ${newPath}`);
      }
    }
  }
}
```

**Solución B: Update Download Logic**
```typescript
// In storage.ts - Try both paths
export async function downloadFileSmart(
  storagePath: string,
  userId: string
): Promise<Buffer> {
  // Try hash format path first
  try {
    return await downloadFile(storagePath);
  } catch (error) {
    // Fallback: Try with Google OAuth ID
    const userDoc = await getUserById(userId);
    if (userDoc?.googleUserId) {
      const legacyPath = storagePath.replace(userId, userDoc.googleUserId);
      console.log('🔄 Trying legacy path:', legacyPath);
      return await downloadFile(legacyPath);
    }
    throw error;
  }
}
```

---

### Para Documentos Eliminados

**Solo opción: Re-upload**
- Usuario debe subir el archivo de nuevo
- Sistema crea nuevo storagePath
- Mantiene extractedData existente

---

### Para Documentos Corruptos

**Opciones:**
1. Re-upload (como eliminados)
2. Re-extract desde otro source si es duplicado
3. Marcar como corrupto y reportar

---

## 📋 API Endpoint: Re-Upload Original

```typescript
// src/pages/api/context-sources/reupload-original.ts

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      });
    }
    
    // 2. Verify SuperAdmin
    const user = await getUserById(session.id);
    if (user?.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden - SuperAdmin only' }), {
        status: 403
      });
    }
    
    // 3. Parse multipart form
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sourceId = formData.get('sourceId') as string;
    const userId = formData.get('userId') as string;
    
    if (!file || !sourceId) {
      return new Response(JSON.stringify({ error: 'Missing file or sourceId' }), {
        status: 400
      });
    }
    
    // 4. Get existing source
    const source = await getContextSource(sourceId);
    if (!source) {
      return new Response(JSON.stringify({ error: 'Source not found' }), {
        status: 404
      });
    }
    
    // 5. Upload file to Cloud Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(
      buffer,
      file.name,
      file.type,
      {
        sourceId: source.id,
        originalName: source.name,
        reUploadedAt: new Date().toISOString(),
        reUploadedBy: session.id,
      }
    );
    
    // 6. Update source metadata
    await firestore
      .collection('context_sources')
      .doc(sourceId)
      .update({
        'metadata.storagePath': uploadResult.storagePath,
        'metadata.bucketName': uploadResult.bucketName,
        'metadata.publicUrl': uploadResult.publicUrl,
        'metadata.reUploadedAt': new Date(),
        'metadata.reUploadedBy': session.id,
        'metadata.reUploadReason': 'original_missing',
      });
    
    console.log(`✅ Re-uploaded original file for source ${sourceId}`);
    
    return new Response(JSON.stringify({
      success: true,
      storagePath: uploadResult.storagePath,
      bucketName: uploadResult.bucketName,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error re-uploading original:', error);
    return new Response(JSON.stringify({
      error: 'Failed to re-upload',
      details: error instanceof Error ? error.message : 'Unknown'
    }), {
      status: 500
    });
  }
};
```

---

## 📊 Análisis del Estado Actual

Para entender cuántos documentos tienen cada problema, ejecutar:

```bash
npm run analyze:missing-originals
```

**Output esperado:**
```
📊 Análisis de Documentos Sin Original

Legacy (no storagePath):         850 documentos
userId Mismatch en path:         30 documentos
Archivo eliminado:               3 documentos
Archivo corrupto:                2 documentos
Disponible correctamente:        0 documentos (tras migración de userId)

Total problemáticos: 885 de 885 documentos
```

---

## 🎯 Plan de Acción Recomendado

### Paso 1: Migrar Storage Paths (Automated)
```bash
# Migrar rutas de Cloud Storage para coincidir con nuevo userId
npm run migrate:storage-paths
```

**Qué hace:**
- Encuentra archivos en `gs://bucket/114671162830729001607/...`
- Copia a `gs://bucket/usr_uhwqffaqag1wrryd82tw/...`
- Actualiza metadata.storagePath en Firestore
- Preserva archivos originales (copia, no mueve)

**Resultado esperado:**
- ✅ ~30 documentos ahora tienen archivo disponible
- ✅ Storage paths actualizados
- ✅ Archivos accesibles

---

### Paso 2: Marcar Documentos Legacy
```bash
# Marcar documentos sin storagePath como "solo texto"
npm run mark:legacy-documents
```

**Qué hace:**
- Encuentra documentos sin `storagePath`
- Actualiza `metadata.textOnlyMode = true`
- Agrega `metadata.legacyReason = 'pre_cloud_storage_era'`

**Resultado:**
- ✅ UI muestra claramente que es documento legacy
- ✅ Usuario sabe que es esperado, no un error
- ✅ Opción de re-upload disponible si tiene archivo

---

### Paso 3: Implementar Recovery UI
```bash
# Agregar botones de recovery al DocumentViewerModal
# - Re-upload (superadmin)
# - Report bug (todos)
# - View text anyway (todos)
```

**Resultado:**
- ✅ SuperAdmin puede re-subir archivos faltantes
- ✅ Usuarios pueden reportar problemas con contexto completo
- ✅ Todos pueden ver texto extraído si archivo no disponible

---

## 📝 Próximos Pasos

1. **Ejecutar migración de userId** (como planeado)
2. **Ejecutar migración de storage paths** (nuevo)
3. **Implementar Recovery UI** (este documento)
4. **Crear análisis detallado** (script analyze-missing-originals.ts)

¿Quieres que implemente la Recovery UI ahora o primero ejecutamos la migración de userId?





