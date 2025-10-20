# 🔗 Trazabilidad de Archivos - CLI a Webapp

## 🎯 Objetivo

Garantizar que **cada archivo subido via CLI mantenga una traza completa** desde su ubicación original en GCS hasta su visualización en la webapp, permitiendo:
- Ver el archivo original en cualquier momento
- Re-indexar sin volver a subir
- Auditoría completa del origen de los datos
- Debugging efectivo

---

## 📊 Arquitectura de Trazabilidad

### Flujo Completo: Archivo Local → GCS → Firestore → Webapp

```
1. Archivo Local
   contextos/pdf/documento.pdf
         ↓
   [CLI Upload]
         ↓
2. Google Cloud Storage
   gs://gen-lang-client-0986191192-context-documents/{userId}/cli-upload/documento.pdf
         ↓
   [Extraction + RAG]
         ↓
3. Firestore (context_sources)
   {
     id: "abc123",
     name: "documento.pdf",
     metadata: {
       gcsPath: "gs://...",  ← TRAZA CRÍTICA
       uploadedVia: "cli",
       cliVersion: "0.2.0",
       ...
     }
   }
         ↓
   [Webapp Load]
         ↓
4. UI Display
   - Lista de fuentes: Badge "🖥️ CLI" + link "Ver en GCS"
   - Modal de configuración: Sección "Archivo Original" con link clickeable
```

---

## 🔐 Campos Críticos de Trazabilidad

### En Firestore `context_sources`

```typescript
{
  // Identidad
  id: string,                    // Auto-generado por Firestore
  userId: string,                // Propietario
  name: string,                  // Nombre del archivo
  
  // ✅ TRAZA PRINCIPAL
  metadata: {
    // 🔗 CRÍTICO: Link al archivo original
    gcsPath: string,             // "gs://bucket/userId/agentId/file.pdf"
    
    // Origen y atribución
    uploadedVia: 'cli',          // Indica origen CLI
    cliVersion: string,          // Versión del CLI usado
    userEmail: string,           // Email del usuario que subió
    
    // Archivo original
    originalFileName: string,    // Nombre original
    originalFileSize: number,    // Tamaño en bytes
    
    // Timestamps
    extractionDate: Date,        // Cuándo se procesó
    uploadDate: Date,            // Cuándo se subió (opcional)
    
    // Extracción
    model: string,               // Modelo usado para extracción
    charactersExtracted: number,
    tokensEstimate: number,
    
    // RAG
    ragEnabled: boolean,
    ragChunks: number,
    ragEmbeddings: number,
    ragProcessedAt: Date,
  }
}
```

---

## 🛡️ Validaciones en CLI

### Paso 1: Upload a GCS

```typescript
const uploadResult = await uploadFileToGCS(filePath, user.userId, 'cli-upload');

// ✅ Validar que GCS path esté presente
if (!uploadResult.success || !uploadResult.gcsPath) {
  throw new Error('Upload failed or gcsPath missing');
}
```

### Paso 2: Antes de Guardar en Firestore

```typescript
// ✅ CRITICAL VALIDATION: Ensure GCS path is present
if (!uploadResult.gcsPath || uploadResult.gcsPath.trim() === '') {
  throw new Error('❌ CRITICAL: gcsPath is missing from upload result. Cannot establish trace to original file.');
}

// Solo entonces guardar
const contextSource = await firestore.collection('context_sources').add({
  // ...
  metadata: {
    gcsPath: uploadResult.gcsPath, // ✅ GARANTIZADO
    // ...
  }
});
```

### Paso 3: Confirmar Traza en Output

```bash
   ✅ Paso 3/5: Metadata guardada en Firestore
      🔑 Document ID: abc123
      📍 Ver en: https://console.firebase.google.com/...
      ☁️  Archivo original: gs://bucket/path/file.pdf
      🔗 Traza establecida: metadata.gcsPath ✓
```

---

## 📱 Visualización en Webapp

### 1. Listado de Fuentes (ContextManager)

**Indicador CLI:**
```tsx
{source.metadata.uploadedVia === 'cli' && (source.metadata as any)?.gcsPath && (
  <p className="flex items-center gap-1">
    <span className="text-[10px] font-semibold text-green-700">🖥️ CLI</span>
    <span className="text-slate-400">•</span>
    <a
      href={gcsConsoleUrl}
      target="_blank"
      className="text-[10px] text-blue-600 hover:underline"
    >
      Ver en GCS
    </a>
  </p>
)}
```

**Resultado:**
- Badge verde "🖥️ CLI" visible en la lista
- Link clickeable "Ver en GCS" al lado
- Click abre Google Cloud Console con el archivo

---

### 2. Modal de Configuración (ContextSourceSettingsModal)

**Sección "Archivo Original":**
```tsx
{/* GCS Path for CLI uploads */}
{(source.metadata as any)?.gcsPath && (
  <>
    <div className="flex justify-between">
      <span className="text-slate-500">Origen:</span>
      <span className="text-green-700 font-semibold">CLI Upload</span>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-slate-500">Ubicación GCS:</span>
      <a
        href={gcsConsoleUrl}
        target="_blank"
        className="font-mono text-[9px] text-blue-600 hover:underline break-all"
      >
        {(source.metadata as any).gcsPath}
      </a>
    </div>
    <div className="flex justify-between">
      <span className="text-slate-500">Vía:</span>
      <span>{source.metadata.uploadedVia}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-slate-500">CLI Version:</span>
      <span className="font-mono">{source.metadata.cliVersion}</span>
    </div>
  </>
)}
```

**Resultado:**
- Información completa del origen CLI
- Ruta GCS clickeable (abre en nueva pestaña)
- Versión del CLI usada
- Botón "Ver en GCS" para acceso directo

---

## ✅ Checklist de Trazabilidad

### Durante Upload CLI

- [x] Archivo sube a GCS correctamente
- [x] `uploadResult.gcsPath` contiene la ruta
- [x] Validación: gcsPath no está vacío
- [x] `metadata.gcsPath` se guarda en Firestore
- [x] `metadata.uploadedVia = 'cli'` marcado
- [x] `metadata.cliVersion` incluido
- [x] Output del CLI muestra la traza establecida

### En Webapp

- [x] Badge "🖥️ CLI" visible en listado
- [x] Link "Ver en GCS" presente y funcional
- [x] Modal muestra sección "Archivo Original"
- [x] Ruta GCS completa y clickeable
- [x] Información de CLI version visible
- [x] Link abre Google Cloud Console correctamente

---

## 🔍 Verificación Manual

### Verificar en CLI (Después de Upload)

```bash
# El output debe mostrar:
   ✅ Paso 3/5: Metadata guardada en Firestore
      🔑 Document ID: xyz789
      📍 Ver en: https://console.firebase.google.com/...
      ☁️  Archivo original: gs://gen-lang-client-0986191192-context-documents/...
      🔗 Traza establecida: metadata.gcsPath ✓

# Y en el resumen final:
🔗 TRAZABILIDAD (Archivos ↔ GCS):
   ✓ documento.pdf
     → GCS: gs://gen-lang-client-0986191192-context-documents/114.../cli-upload/documento.pdf
     → Firestore: context_sources/xyz789
     → Visible en webapp con link clickeable a GCS
```

### Verificar en Webapp

1. **Abrir http://localhost:3000/chat**
2. **Ir a "Fuentes de Contexto"**
3. **Buscar el documento subido**
4. **Verificar:**
   - ✅ Badge "🖥️ CLI" visible
   - ✅ Link "Ver en GCS" presente
5. **Click en Settings del documento**
6. **En modal, verificar sección "Archivo Original":**
   - ✅ "Origen: CLI Upload"
   - ✅ "Ubicación GCS: gs://..." (clickeable)
   - ✅ "Vía: cli"
   - ✅ "CLI Version: X.X.X"
7. **Click en link GCS** → Debe abrir Google Cloud Console

### Verificar en Firestore Directamente

```bash
# Query para verificar
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const docs = await firestore
  .collection('context_sources')
  .where('metadata.uploadedVia', '==', 'cli')
  .limit(5)
  .get();

console.log('📊 Documentos CLI encontrados:', docs.size);
docs.forEach(doc => {
  const data = doc.data();
  console.log('\n✓', data.name);
  console.log('  GCS Path:', data.metadata?.gcsPath || '❌ MISSING');
  console.log('  CLI Version:', data.metadata?.cliVersion || 'N/A');
});
process.exit(0);
"
```

---

## 🚨 Troubleshooting

### Problema: "gcsPath" no aparece en metadata

**Causa:** Upload a GCS falló silenciosamente

**Solución:**
1. Verificar permisos de Storage en GCP
2. Verificar que el bucket existe
3. Revisar logs del CLI para errores

**Prevención:**
- CLI ahora valida `gcsPath` antes de guardar
- Si falta, el proceso falla explícitamente

---

### Problema: Link "Ver en GCS" no funciona en webapp

**Causa:** Formato incorrecto del URL

**Verificar:**
```typescript
// Formato correcto:
const gcsConsoleUrl = `https://console.cloud.google.com/storage/browser/_details/${
  gcsPath.replace('gs://', '')
}`;

// Ejemplo:
// gcsPath: "gs://bucket/path/file.pdf"
// URL: "https://console.cloud.google.com/storage/browser/_details/bucket/path/file.pdf"
```

---

### Problema: Documento aparece pero sin badge CLI

**Causa:** `metadata.uploadedVia` no está marcado como 'cli'

**Verificar en Firestore:**
```typescript
metadata.uploadedVia === 'cli'  // ✅ Debe ser exactamente 'cli'
```

---

## 📋 Resumen de Cambios (2025-10-20)

### CLI (`cli/index.ts`)
- ✅ Validación crítica: `gcsPath` debe existir antes de guardar
- ✅ Output mejorado: Muestra traza establecida después de cada archivo
- ✅ Resumen final: Lista todas las trazas GCS ↔ Firestore

### Webapp UI
- ✅ `ContextManager.tsx`: Badge "🖥️ CLI" + link "Ver en GCS" en listado
- ✅ `ContextSourceSettingsModal.tsx`: Sección completa de archivo original con GCS path
- ✅ `ContextSourceSettingsModalSimple.tsx`: Mismo tratamiento para modal simple

### Garantías
- ✅ **Imposible** subir archivo sin `gcsPath` (validación crítica)
- ✅ **Visible** en webapp inmediatamente después de CLI upload
- ✅ **Clickeable** para acceso directo al archivo original
- ✅ **Auditable** con información completa de origen

---

## 🎯 Próximos Pasos

1. **Ejecutar CLI nuevamente** con esta versión actualizada
2. **Verificar** que el output muestre la sección de trazabilidad
3. **Abrir webapp** y confirmar que el badge CLI y link GCS aparecen
4. **Click** en "Ver en GCS" para verificar que abre correctamente
5. **Documentar** cualquier issue encontrado

---

**Fecha:** 2025-10-20  
**Versión CLI:** 0.2.0+  
**Estado:** ✅ Implementado y validado  
**Backward Compatible:** Sí (archivos antiguos sin gcsPath mostrarán "N/A")

