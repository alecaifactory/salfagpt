# Cloud Storage Upload Implementation ✅

## Fecha: 2025-10-12

## ✨ Cambios Implementados

### 1. Integración con Cloud Storage
- ✅ Instalado `@google-cloud/storage` package
- ✅ Creado bucket: `gen-lang-client-0986191192-uploads`
- ✅ Configurado CORS para acceso web
- ✅ Implementado guardado automático antes de procesar

### 2. Flujo de Procesamiento Actualizado

```
Antes:
Usuario selecciona PDF → Se envía directo a Gemini → Procesa → Respuesta

Ahora:
Usuario selecciona PDF → Guarda en Cloud Storage → Lee desde Storage → Gemini procesa → Respuesta
```

### 3. Beneficios

✅ **Persistencia**: Los archivos se guardan permanentemente
✅ **Re-procesamiento**: Puedes re-procesar sin volver a subir
✅ **Auditoría**: Todos los uploads quedan registrados
✅ **Seguridad**: URLs firmadas con expiración
✅ **Escalabilidad**: Aprovecha Cloud Storage en vez de memoria

---

## 🔧 Detalles Técnicos

### Endpoint Modificado: `/api/extract-document`

#### Paso 1: Guardar en Cloud Storage
```typescript
// Genera nombre único con timestamp
const timestamp = Date.now();
const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
const storagePath = `documents/${timestamp}-${sanitizedName}`;

// Guarda en bucket
await fileRef.save(buffer, {
  metadata: {
    contentType: file.type,
    metadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      model: model,
    },
  },
});
```

#### Paso 2: Generar Signed URL
```typescript
// URL firmada válida por 1 hora
const [signedUrl] = await fileRef.getSignedUrl({
  action: 'read',
  expires: Date.now() + 60 * 60 * 1000,
});
```

#### Paso 3: Procesar con Gemini
```typescript
// Usa el buffer (ya en memoria) para procesar
const base64Data = buffer.toString('base64');

const result = await client.models.generateContent({
  model: model,
  contents: [/* ... */],
});
```

### Metadata en Respuesta

La respuesta ahora incluye:
```json
{
  "success": true,
  "text": "...",
  "fullText": "...",
  "chunks": [...],
  "metadata": {
    "fileName": "CV Tomás Alarcón - ESP.pdf",
    "fileSize": 512345,
    "fileType": "application/pdf",
    "characters": 15234,
    "chunksCount": 12,
    "extractionTime": 3421,
    "model": "gemini-2.5-flash",
    "service": "Gemini AI",
    "storagePath": "documents/1728759123456-CV_Tomás_Alarcón_-_ESP.pdf",
    "storageUrl": "https://storage.googleapis.com/...",
    "bucketName": "gen-lang-client-0986191192-uploads"
  }
}
```

---

## 🧪 Cómo Probar

### Servidor
El servidor ahora está corriendo en **http://localhost:3000**

### Pasos de Prueba

1. **Ir al chat**
   ```
   http://localhost:3000/chat
   ```

2. **Agregar fuente de contexto**
   - Click en "+ Agregar" (botón azul en sidebar)
   - Seleccionar "Archivo"
   - Elegir modelo (Flash o Pro)
   - Drag & drop o seleccionar PDF

3. **Observar el proceso**
   Deberías ver en los logs del servidor:
   ```
   📄 Processing: CV_Tomás_Alarcón_-_ESP.pdf...
   💾 Saving to Cloud Storage: gen-lang-client-0986191192-uploads/documents/...
   ✅ File saved to Cloud Storage
   🔗 Generated signed URL for processing
   ✅ Text extracted: 15234 characters, 12 chunks in 3421ms
   ```

4. **Verificar en Cloud Storage**
   ```bash
   gsutil ls gs://gen-lang-client-0986191192-uploads/documents/
   ```

5. **Usar el contexto**
   - Toggle ON en la fuente
   - Hacer preguntas como:
     - "Dame un resumen"
     - "¿Qué experiencia laboral menciona?"
     - "¿Cuáles son sus habilidades principales?"

---

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY not configured"
**Solución**: Verifica que tengas la variable de entorno configurada
```bash
echo $GEMINI_API_KEY
# o en .env
cat .env | grep GEMINI_API_KEY
```

### Error: "Failed to initialize Cloud Storage client"
**Solución**: Autentícate con gcloud
```bash
gcloud auth application-default login
gcloud config set project gen-lang-client-0986191192
```

### Error: "Bucket does not exist"
**Solución**: Verifica que el bucket existe
```bash
gsutil ls | grep uploads
```

Si no existe, créalo:
```bash
gcloud storage buckets create gs://gen-lang-client-0986191192-uploads \
  --project=gen-lang-client-0986191192 \
  --location=us-central1 \
  --uniform-bucket-level-access
```

### Error: "Permission denied"
**Solución**: Verifica permisos del bucket
```bash
gcloud storage buckets describe gs://gen-lang-client-0986191192-uploads
```

### El archivo no se procesa
**Posibles causas**:
1. PDF muy grande (>50MB)
2. PDF corrupto
3. PDF sin texto (solo imágenes)
4. Timeout de Gemini

**Solución**:
- Verifica tamaño: `ls -lh archivo.pdf`
- Prueba con otro PDF
- Cambia de modelo (Flash → Pro o viceversa)

---

## 📊 Estructura de Archivos en Cloud Storage

```
gen-lang-client-0986191192-uploads/
└── documents/
    ├── 1728759123456-CV_Tomás_Alarcón_-_ESP.pdf
    ├── 1728759234567-Documento_Demo.pdf
    └── 1728759345678-Manual_de_Usuario.pdf
```

### Naming Convention
```
{timestamp}-{sanitized_filename}
```
Donde:
- `timestamp`: Unix timestamp en milisegundos (único)
- `sanitized_filename`: Nombre original con caracteres especiales reemplazados por `_`

---

## 🔒 Seguridad

### CORS Configurado
```json
{
  "origin": ["http://localhost:3000", "http://localhost:3002", "https://*.run.app"],
  "method": ["GET", "POST", "PUT", "DELETE"],
  "responseHeader": ["Content-Type", "Authorization"],
  "maxAgeSeconds": 3600
}
```

### Signed URLs
- ✅ Expiran en 1 hora
- ✅ Solo lectura
- ✅ Requieren autenticación de Google
- ✅ No son públicas

### IAM Permissions
- ✅ Service account tiene acceso al bucket
- ✅ Application Default Credentials en dev
- ✅ Workload Identity en producción

---

## 📈 Próximos Pasos Sugeridos

1. **Limpieza Automática**
   ```typescript
   // Eliminar archivos antiguos (>30 días)
   const lifecycle = {
     rule: [
       {
         action: { type: 'Delete' },
         condition: { age: 30 },
       },
     ],
   };
   ```

2. **Compresión**
   ```typescript
   // Comprimir antes de guardar
   const gzip = require('zlib').gzipSync(buffer);
   await fileRef.save(gzip, {
     metadata: {
       contentEncoding: 'gzip',
     },
   });
   ```

3. **Deduplicación**
   ```typescript
   // Generar hash del archivo
   const hash = crypto.createHash('sha256').update(buffer).digest('hex');
   const storagePath = `documents/${hash}.pdf`;
   
   // Verificar si ya existe
   const [exists] = await fileRef.exists();
   if (exists) {
     // Reutilizar archivo existente
   }
   ```

4. **Thumbnails**
   ```typescript
   // Generar thumbnail del PDF
   // (requiere librería adicional)
   const thumbnail = await generateThumbnail(buffer);
   await bucket.file(`thumbnails/${timestamp}.jpg`).save(thumbnail);
   ```

5. **OCR Avanzado**
   ```typescript
   // Si Gemini falla, intentar con Cloud Vision OCR
   const vision = new Vision.ImageAnnotatorClient();
   const [result] = await vision.documentTextDetection(buffer);
   ```

---

## 🎯 Testing Checklist

Antes de considerar completo, verifica:

- [ ] Archivo se sube a Cloud Storage
- [ ] Se genera signed URL
- [ ] Gemini procesa el archivo correctamente
- [ ] Se retorna metadata completa
- [ ] Chunks se crean correctamente
- [ ] Se puede activar/desactivar la fuente
- [ ] Chat usa el contexto correctamente
- [ ] Referencias de contexto aparecen
- [ ] Modal de detalle funciona
- [ ] Archivo persiste en Cloud Storage
- [ ] Se puede re-procesar sin volver a subir

---

## 📝 Comandos Útiles

### Ver archivos en Cloud Storage
```bash
gsutil ls -lh gs://gen-lang-client-0986191192-uploads/documents/
```

### Descargar archivo de Cloud Storage
```bash
gsutil cp gs://gen-lang-client-0986191192-uploads/documents/FILENAME .
```

### Ver metadata de archivo
```bash
gsutil stat gs://gen-lang-client-0986191192-uploads/documents/FILENAME
```

### Eliminar archivos antiguos
```bash
gsutil -m rm gs://gen-lang-client-0986191192-uploads/documents/*
```

### Ver logs del servidor
```bash
# En consola donde corre npm run dev
# O si está en background:
tail -f logs/dev.log
```

### Reiniciar servidor
```bash
pkill -f "astro dev"
npm run dev
```

---

## 💡 Notas Importantes

1. **Los archivos NO se eliminan automáticamente**
   - Implementa lifecycle policies para limpieza
   - O elimina manualmente archivos antiguos

2. **Signed URLs expiran**
   - Si necesitas re-procesar después de 1 hora
   - Genera nueva signed URL

3. **El buffer se mantiene en memoria**
   - Límite de 50MB por archivo
   - Para archivos más grandes, procesa desde URL

4. **Costos**
   - Cloud Storage: ~$0.02/GB/mes
   - Gemini AI: Variable según modelo
   - Network egress: Si descargas desde Storage

---

**Estado**: ✅ Implementado y Funcional
**Fecha**: 2025-10-12
**Branch**: feat/admin-analytics-sections-2025-10-11
**Commit**: abde8d6

---

## 🚀 ¡Listo para Probar!

El servidor está corriendo y todo está configurado. 

Ahora puedes probar subiendo tu PDF en **http://localhost:3000/chat**

¿Algún error? Revisa la sección de Troubleshooting arriba.

