# 📍 MAPEO COMPLETO: Documentos en Cloud Storage

**Fecha:** 25 Noviembre 2025, 8:11 AM  
**Status:** ✅ PATHS ACTUALIZADOS - SERVIDOR REINICIADO

---

## 🗺️ **UBICACIONES DE DOCUMENTOS:**

### **us-central1 (VIEJO - Deprecated):**

**Bucket 1: salfagpt-uploads**
```
Location: us-central1
Structure: documents/timestamp-filename.pdf
Example: documents/1761006058821-DDU-ESP-005-07.pdf
Status: ❌ NO USAR (viejo, región incorrecta)
```

**Bucket 2: salfagpt-context-documents**
```
Location: us-central1
Structure: Variada
Status: ❌ NO USAR (viejo, región incorrecta)
```

---

### **us-east4 (NUEVO - Activo):**

**Bucket: salfagpt-context-documents-east4**
```
Location: US-EAST4 ✅
Structure: userId/agentId/filename.pdf
Example: usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP-D-PI-1...
Status: ✅ ACTIVO (misma región que backend)
```

**Ejemplo Real (GOP-D-PI-1):**
```
Ruta completa:
gs://salfagpt-context-documents-east4/usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1) (1).PDF

Desglose:
  Bucket: salfagpt-context-documents-east4
  User: usr_uhwqffaqag1wrryd82tw
  Agent: vStojK73ZKbjNsEnqANJ (M3-v2)
  File: GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1) (1).PDF

Tamaño: 0.48 MB
Verificado: ✅ Descarga exitosa
```

---

## 🔄 **MIGRACIÓN COMPLETADA:**

### **Antes (us-central1):**
```
Firestore metadata:
  storagePath: "documents/1762166321601-GOP-D-PI-1..."
  bucketName: "salfagpt-uploads"
  gcsPath: N/A

Archivo en:
  gs://salfagpt-uploads/documents/1762166321601-GOP...
  Location: us-central1 ❌
```

### **Después (us-east4):**
```
Firestore metadata:
  storagePath: "usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP-D-PI-1..."
  bucketName: "salfagpt-context-documents-east4"
  gcsPath: "gs://salfagpt-context-documents-east4/usr_.../GOP..."

Archivo en:
  gs://salfagpt-context-documents-east4/usr_.../GOP...
  Location: US-EAST4 ✅
```

---

## 🔧 **CÓMO SE ACCEDE AHORA:**

### **Flujo Completo:**

**1. Usuario click referencia [1]**
```
Frontend: onClick → setSelectedSource(sourceId: 'LqZZrXNqK5zKKl26rwXZ')
```

**2. DocumentViewerModal abre**
```
Modal llama: loadDocument()
  ↓
fetch('/api/context-sources/LqZZrXNqK5zKKl26rwXZ/file')
```

**3. Backend endpoint (/api/context-sources/[id]/file.ts):**
```typescript
// a) Carga source desde Firestore
const source = await getContextSource('LqZZrXNqK5zKKl26rwXZ');

// b) Lee metadata (ACTUALIZADO por script)
const storagePath = source.metadata.storagePath;
// Ahora: "usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP..."

// c) Llama downloadFile()
const buffer = await downloadFile(storagePath);
```

**4. downloadFile() busca (storage.ts):**
```typescript
const bucketsToTry = [
  'salfagpt-context-documents-east4',  // Intenta primero
  'salfagpt-uploads',                   // Fallback
  'salfagpt-context-documents',         // Fallback
];

for (const bucket of bucketsToTry) {
  const file = storage.bucket(bucket).file(storagePath);
  if (await file.exists()) {
    return await file.download(); // ✅ ENCUENTRA
  }
}
```

**5. Servidor responde:**
```
HTTP 200
Content-Type: application/pdf ✅
Content-Disposition: inline; filename="GOP-D-PI-1..."
Body: <PDF bytes>
```

**6. Browser muestra:**
```
<iframe src="/api/context-sources/.../file">
  ✅ PDF VISUAL (no solo texto)
</iframe>
```

---

## ✅ **LO QUE SE HIZO PARA ARREGLARLO:**

### **Fix #1: Script actualizó Firestore**
```bash
node scripts/fix-missing-storage-paths.mjs

Resultado:
- 2,188 documentos revisados
- Paths encontrados en us-east4
- Firestore actualizado con paths correctos
```

### **Fix #2: Código busca en 3 buckets**
```typescript
// storage.ts - downloadFile()
// Intenta todos los buckets hasta encontrar
```

### **Fix #3: Servidor reiniciado**
```bash
pkill -f "astro dev"
npm run dev

Resultado:
- Carga fresh metadata desde Firestore
- storagePaths actualizados en memoria
- Ready para servir PDFs correctos
```

---

## 🧪 **VALIDACIÓN AHORA:**

### **HARD REFRESH BROWSER:** Cmd+Shift+R

**Por qué es crítico:**
1. ✅ Firestore actualizado (script)
2. ✅ Código correcto (3 buckets fallback)
3. ✅ **Servidor reiniciado** (carga nuevo metadata) 🆕
4. ⏳ Browser necesita refrescar (cargar nuevo código)

**Después del refresh:**

**Click en referencia [1] GOP-D-PI-1**

**Debería:**
```
✅ Modal abre
✅ fetch('/api/context-sources/LqZZrXNqK5zKKl26rwXZ/file')
✅ Servidor lee Firestore (path nuevo)
✅ storagePath: "usr_.../vSto.../GOP..."
✅ downloadFile() busca en:
   1. salfagpt-context-documents-east4 ✅ ENCUENTRA
✅ Descarga 0.48 MB
✅ Content-Type: application/pdf
✅ PDF SE MUESTRA VISUALMENTE
```

---

## 📊 **VERIFICACIÓN TÉCNICA:**

### **En Server Logs (después de click):**

**Esperado ver:**
```
📄 File request for source: LqZZrXNqK5zKKl26rwXZ
📋 Source loaded: GOP-D-PI-1... User: usr_uhwqffaqag1wrryd82tw
✅ Ownership verified
🔍 Storage path check: { 
  hasStoragePath: true,  ✅ (ya no "false")
  storagePath: "usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP..." ✅
}
📥 Downloading from Cloud Storage: usr_uhwqffaqag1wrryd82tw/...
  🔍 Trying bucket: salfagpt-context-documents-east4
  ✅ File downloaded from salfagpt-context-documents-east4: 0.48 MB
✅ Serving file from Cloud Storage
```

**NO debería ver:**
```
❌ Storage path check: { hasStoragePath: false }
❌ Generating HTML preview from extracted text
```

---

## 🎯 **TU ACCIÓN:**

**1. HARD REFRESH:** Cmd + Shift + R (limpia cache browser)

**2. Click referencia [1]**

**3. Observa:**
- ¿Modal abre?
- ¿Muestra PDF visual o solo texto?
- ¿Hay errores en console?

**4. Reporta:**
- Si funciona: ✅ Deploy
- Si falla: Dame el error específico del servidor

---

**Server:** ✅ Reiniciado con paths frescos  
**Firestore:** ✅ Actualizado con paths us-east4  
**Código:** ✅ Busca en 3 buckets  
**Ready:** ✅ HARD REFRESH Y TEST

**🎯 HAZ HARD REFRESH AHORA (CMD+SHIFT+R) 🎯**
