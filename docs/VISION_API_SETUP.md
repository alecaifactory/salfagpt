# Google Cloud Vision API - Setup Guide

## 📋 Overview

Flow ahora usa **Google Cloud Vision API** para extracción de texto de documentos (PDFs, imágenes). Esta guía explica cómo configurarlo localmente y en producción.

---

## 🎯 Arquitectura

```
┌─────────────┐                ┌─────────────┐                ┌──────────────┐
│   Browser   │   Upload PDF   │  API Route  │  Google Cloud  │  Vision API  │
│             │───────────────>│ /extract-   │───────────────>│              │
│ChatInterface│                │ document.ts │                │ Text OCR     │
│             │<───────────────│             │<───────────────│              │
│  Display    │  Texto         │  Metadata   │  Full Text     │              │
└─────────────┘                └─────────────┘                └──────────────┘
```

**Beneficios:**
- ✅ Mismas credenciales que Firestore
- ✅ Funciona idéntico en local y GCP
- ✅ OCR incluido gratis
- ✅ Sin problemas de CORS
- ✅ Server-side (seguro)

---

## 🔐 Configuración de Credenciales

### Opción 1: Service Account (Recomendado para Local)

**Paso 1: Crear Service Account** (si no existe)

```bash
# Ya deberías tener uno para Firestore
gcloud iam service-accounts list
```

**Paso 2: Agregar Rol de Vision API**

```bash
# Reemplaza con tu service account email
export SERVICE_ACCOUNT="your-service-account@project-id.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudvision.admin"
```

**Paso 3: Descargar Key** (si no la tienes)

```bash
gcloud iam service-accounts keys create ~/gcp-key.json \
  --iam-account=$SERVICE_ACCOUNT
```

**Paso 4: Configurar Variable de Entorno**

```bash
# En tu .env local
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/gcp-key.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

---

### Opción 2: Application Default Credentials (ADC)

**Para desarrolladores con acceso a GCP:**

```bash
# Autenticar con tu cuenta de Google
gcloud auth application-default login

# El proyecto se toma de .env
```

Esto es más simple pero requiere que tu cuenta personal tenga los permisos necesarios.

---

## 🚀 Configuración en GCP (Producción)

### Paso 1: Habilitar Vision API

```bash
gcloud services enable vision.googleapis.com --project=YOUR_PROJECT_ID
```

### Paso 2: Configurar Cloud Run Service Account

```bash
# Verificar service account de Cloud Run
gcloud run services describe flow --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"

# Agregar rol Vision API
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:CLOUD_RUN_SERVICE_ACCOUNT" \
  --role="roles/cloudvision.admin"
```

### Paso 3: Deploy

```bash
# Mismo proceso de siempre
npm run build
gcloud run deploy flow --region=us-central1
```

**¡Sin configuración adicional!** Cloud Run usa Application Default Credentials automáticamente.

---

## 🧪 Testing Local

### Test 1: Verificar Credenciales

```bash
# Verificar que las credenciales están configuradas
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GOOGLE_CLOUD_PROJECT

# Test rápido con gcloud
gcloud auth application-default print-access-token
```

### Test 2: Iniciar Servidor

```bash
npm run dev
```

### Test 3: Probar Extracción

1. Ir a http://localhost:4321/chat
2. Click en "Agregar Fuente"
3. Seleccionar "Extraer Texto PDF"
4. Subir un PDF de prueba
5. Verificar que extrae texto correctamente

**Logs esperados en consola:**
```
✅ Vision API client initialized
📄 Extracting text from: test.pdf (application/pdf, 124352 bytes)
✅ Text extracted: 4521 characters in 1234ms
```

---

## 📊 API Endpoints

### POST /api/extract-document

**Request:**
```typescript
FormData {
  file: File,           // PDF, PNG, or JPEG
  model: string,        // 'gemini-2.5-flash' or 'gemini-2.5-pro'
}
```

**Response (Success):**
```json
{
  "success": true,
  "text": "📄 Archivo: doc.pdf\n📊 Total de páginas: 3\n...",
  "metadata": {
    "fileName": "doc.pdf",
    "fileSize": 124352,
    "fileType": "application/pdf",
    "pages": 3,
    "characters": 4521,
    "extractionTime": 1234,
    "model": "gemini-2.5-flash",
    "service": "Google Cloud Vision API"
  }
}
```

**Response (Error):**
```json
{
  "error": "Failed to extract document",
  "details": "Error message here"
}
```

**Response (No Credentials - Dev Only):**
```json
{
  "error": "Vision API not configured locally",
  "fallback": true,
  "message": "Please configure GOOGLE_APPLICATION_CREDENTIALS"
}
```

---

## 💰 Costos

### Vision API Pricing

| Servicio | Gratis/Mes | Costo Después |
|----------|------------|---------------|
| Text Detection | 1,000 páginas | $1.50/1,000 páginas |
| Document Text Detection | 1,000 páginas | $1.50/1,000 páginas |
| OCR | Incluido | Incluido |

**Estimación para uso típico:**
- 100 PDFs/día x 3 páginas = 300 páginas/día
- 9,000 páginas/mes
- Costo: ~$12 USD/mes (después del free tier)

**Comparación:**
- Gemini Flash: $0.001875 / 1M tokens
- Vision API: $1.50 / 1,000 páginas
- ✅ Vision es más eficiente para documentos

---

## 🔧 Troubleshooting

### Error: "Vision API not configured locally"

**Causa:** Credenciales no configuradas en desarrollo.

**Solución:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

### Error: "Permission denied"

**Causa:** Service account no tiene rol Vision API.

**Solución:**
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SA@project.iam.gserviceaccount.com" \
  --role="roles/cloudvision.admin"
```

### Error: "Failed to fetch dynamically imported module"

**Causa:** Problema con imports dinámicos.

**Solución:** Ya no aplica - ahora usamos Vision API server-side.

### Warning: "The Application Default Credentials are not available"

**Causa:** No hay credenciales configuradas.

**Soluciones:**
1. `gcloud auth application-default login`
2. O configurar `GOOGLE_APPLICATION_CREDENTIALS`

---

## 🎯 Features Incluidas

### ✅ OCR Automático

Vision API incluye OCR sin costo adicional:
- ✅ Texto impreso
- ✅ Texto manuscrito (limitado)
- ✅ Múltiples idiomas
- ✅ Detección de orientación
- ✅ Corrección de distorsión

### ✅ Tipos de Archivo Soportados

- **PDF**: Múltiples páginas, texto + imágenes
- **PNG**: Imágenes con texto
- **JPEG/JPG**: Fotos de documentos

### ✅ Límites

- Tamaño máximo: **50 MB**
- Páginas por PDF: Sin límite práctico
- Timeout: 30 segundos (ajustable)

---

## 📝 Ejemplo de Uso en Código

### Frontend (ChatInterface.tsx)

```typescript
// Ya implementado en handleAddSource
const formData = new FormData();
formData.append('file', file);
formData.append('model', userConfig.model);

const response = await fetch('/api/extract-document', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.text); // Texto extraído
```

### Backend (extract-document.ts)

```typescript
import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const [result] = await client.documentTextDetection({
  image: { content: buffer },
});

const text = result.fullTextAnnotation?.text;
```

---

## 🔒 Seguridad

### ✅ Implementado

- Validación de tipo MIME
- Límite de tamaño (50MB)
- Procesamiento server-side
- No expone credenciales al cliente
- Rate limiting (por GCP)
- Logging de operaciones

### 🔜 Próximos Pasos

- Virus scanning (opcional)
- Input sanitization mejorado
- Caché de resultados
- Batch processing

---

## 🚀 Deploy Checklist

### Pre-Deploy

- [ ] Vision API habilitada en GCP
- [ ] Service account tiene rol `roles/cloudvision.admin`
- [ ] Probado localmente con credenciales
- [ ] Build exitoso: `npm run build`

### Deploy

```bash
# Deploy a Cloud Run
gcloud run deploy flow \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated

# Verificar
curl -X POST https://flow-xxx.run.app/api/extract-document \
  -F "file=@test.pdf"
```

### Post-Deploy

- [ ] Probar extracción en producción
- [ ] Verificar logs en Cloud Console
- [ ] Monitorear costos en Billing
- [ ] Configurar alertas si es necesario

---

## 📚 Referencias

- [Google Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [Text Detection Guide](https://cloud.google.com/vision/docs/ocr)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Best Practices](https://cloud.google.com/vision/docs/best-practices)

---

## ✅ Ventajas vs Alternativas

| Feature | Vision API | pdfjs-dist | pdf-parse |
|---------|-----------|------------|-----------|
| Browser Compatible | ✅ Server-side | ⚠️ Complejo | ❌ Node only |
| OCR Incluido | ✅ Gratis | ❌ No | ❌ No |
| PDFs Grandes | ✅ Sin límite | ❌ Limitado | ⚠️ Memoria |
| Setup | ✅ Simple | ❌ Complejo | ⚠️ Medium |
| Credenciales | ✅ Mismas que Firestore | ➖ N/A | ➖ N/A |
| CORS Issues | ✅ No aplica | ❌ Sí | ✅ No aplica |
| Costo | ✅ $1.50/1K | ✅ Gratis | ✅ Gratis |

**Conclusión:** Vision API es la mejor opción para arquitectura cloud-native con GCP.

---

**Última actualización:** Octubre 11, 2025

