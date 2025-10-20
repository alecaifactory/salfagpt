# 📺 Ejemplo de Output del Terminal - SalfaGPT CLI v0.2

## 🎯 Comando Ejecutado

```bash
npx tsx cli/index.ts upload contextos/pdf/agentes/M001
```

---

## 📟 Output Completo con Progreso Real

```
🌍 Environment: Local Development
📦 Project: gen-lang-client-0986191192
🔧 Initializing Firestore client...
📦 Project ID: gen-lang-client-0986191192
🌍 Environment: local
🏗️  Node ENV: development
✅ Firestore client initialized successfully
💡 Local dev: Ensure you have run "gcloud auth application-default login"
💡 Production: Uses Workload Identity automatically

🚀 SalfaGPT CLI - Document Upload Tool
==================================================

👤 User: alec@getaifactory.com
📍 Session: cli-session-1760917821117-s9011

📁 Scanning folder: /Users/alec/salfagpt/contextos/pdf/agentes/M001
📊 [DEV] Would track CLI event: {
  type: 'cli_upload_start',
  user: 'alec@getaifactory.com',
  operation: 'upload',
  success: true
}

✅ Found 3 document(s) to process:
   - manual-producto.pdf
   - politicas-atencion.pdf
   - faq-cliente.pdf

🪣 Verificando bucket de GCS...
   ✅ Bucket listo

🤖 Modelo de extracción: gemini-2.5-flash

📄 Procesando: manual-producto.pdf
   📊 Tamaño: 1,270.00 KB
   ⏳ Paso 1/3: Subiendo a GCP Storage...
   📤 Subiendo a GCS: gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
      25% (317 KB / 1,270 KB)
      50% (635 KB / 1,270 KB)
      75% (952 KB / 1,270 KB)
   ✅ Subido en 2.3s: gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
📊 [DEV] Would track CLI event: { ... }
   ✅ Paso 1/3: Subido a: gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
   
   ⏳ Paso 2/3: Extrayendo texto con Gemini AI...
   📄 Leyendo archivo: /Users/alec/salfagpt/contextos/pdf/agentes/M001/manual-producto.pdf
   📊 Tamaño: 1,270.00 KB
   🔄 Enviando a Gemini AI...
   ✅ Extracción completa en 8.7s
   📝 15,234 caracteres extraídos
   🎯 ~3,809 tokens estimados
   💰 Costo estimado: $0.001234
   👁️  Preview: # Manual de Producto

Bienvenido al manual completo de nuestro producto estrella. Este documento contiene toda la información necesaria para el uso, mantenimiento y soporte del producto.

## Tabla de Contenidos

1. Introducción
2. Características Principales
3. Instalación...
   ✅ Paso 2/3: Texto extraído
      📝 15,234 caracteres
      🎯 ~3,809 tokens
      💰 Costo: $0.001234
      ⏱️  Tiempo: 8.7s

   📖 Preview del texto extraído:
   ────────────────────────────────────────────────────────────
   # Manual de Producto

Bienvenido al manual completo de nuestro producto estrella. Este documento contiene toda la información necesaria para el uso, mantenimiento y soporte del producto.

## Tabla de Contenidos

1. Introducción
2. Características Principales...
   ────────────────────────────────────────────────────────────
📊 [DEV] Would track CLI event: { ... }
   
   ⏳ Paso 3/3: Guardando en Firestore...
   ✅ Paso 3/3: Guardado en Firestore
      🔑 Document ID: source-abc123def456
      📍 Ver en: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources~2Fsource-abc123def456

   ✨ Archivo completado en 12.4s

📄 Procesando: politicas-atencion.pdf
   📊 Tamaño: 854.00 KB
   ⏳ Paso 1/3: Subiendo a GCP Storage...
   📤 Subiendo a GCS: gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/politicas-atencion.pdf
      25% (213 KB / 854 KB)
      50% (427 KB / 854 KB)
      75% (640 KB / 854 KB)
   ✅ Subido en 1.8s: gs://...politicas-atencion.pdf
   ✅ Paso 1/3: Subido
   
   ⏳ Paso 2/3: Extrayendo texto con Gemini AI...
   📄 Leyendo archivo: /Users/alec/salfagpt/contextos/pdf/agentes/M001/politicas-atencion.pdf
   📊 Tamaño: 854.00 KB
   🔄 Enviando a Gemini AI...
   ✅ Extracción completa en 6.2s
   📝 8,456 caracteres extraídos
   🎯 ~2,114 tokens estimados
   💰 Costo estimado: $0.000876
   👁️  Preview: # Políticas de Atención al Cliente

## 1. Horarios de Atención

Nuestro equipo está disponible:
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sábados: 10:00 AM - 2:00 PM
- Domingos y festivos: Cerrado...
   ✅ Paso 2/3: Texto extraído
      📝 8,456 caracteres
      🎯 ~2,114 tokens
      💰 Costo: $0.000876
      ⏱️  Tiempo: 6.2s

   📖 Preview del texto extraído:
   ────────────────────────────────────────────────────────────
   # Políticas de Atención al Cliente

## 1. Horarios de Atención...
   ────────────────────────────────────────────────────────────
   
   ⏳ Paso 3/3: Guardando en Firestore...
   ✅ Paso 3/3: Guardado en Firestore
      🔑 Document ID: source-def456ghi789
      📍 Ver en: https://console.firebase.google.com/project/...

   ✨ Archivo completado en 9.1s

📄 Procesando: faq-cliente.pdf
   📊 Tamaño: 432.00 KB
   ⏳ Paso 1/3: Subiendo a GCP Storage...
   📤 Subiendo a GCS: gs://...faq-cliente.pdf
      25% (108 KB / 432 KB)
      50% (216 KB / 432 KB)
      75% (324 KB / 432 KB)
   ✅ Subido en 1.2s: gs://...faq-cliente.pdf
   ✅ Paso 1/3: Subido
   
   ⏳ Paso 2/3: Extrayendo texto con Gemini AI...
   📄 Leyendo archivo: .../faq-cliente.pdf
   📊 Tamaño: 432.00 KB
   🔄 Enviando a Gemini AI...
   ✅ Extracción completa en 4.1s
   📝 4,123 caracteres extraídos
   🎯 ~1,031 tokens estimados
   💰 Costo estimado: $0.000432
   👁️  Preview: # FAQ - Preguntas Frecuentes

## ¿Cómo puedo devolver un producto?

Para realizar una devolución:
1. Contacta a nuestro servicio al cliente
2. Proporciona tu número de orden...
   ✅ Paso 2/3: Texto extraído
      📝 4,123 caracteres
      🎯 ~1,031 tokens
      💰 Costo: $0.000432
      ⏱️  Tiempo: 4.1s

   📖 Preview del texto extraído:
   ────────────────────────────────────────────────────────────
   # FAQ - Preguntas Frecuentes

## ¿Cómo puedo devolver un producto?...
   ────────────────────────────────────────────────────────────
   
   ⏳ Paso 3/3: Guardando en Firestore...
   ✅ Paso 3/3: Guardado en Firestore
      🔑 Document ID: source-ghi789jkl012
      📍 Ver en: https://console.firebase.google.com/project/...

   ✨ Archivo completado en 6.5s

======================================================================
📊 Resumen del Proceso:
======================================================================

📁 Archivos Procesados:
   Total: 3
   ✅ Exitosos: 3
   ❌ Fallidos: 0
   📦 Tamaño Total: 2.51 MB

📝 Extracción de Texto:
   Caracteres Totales: 27,813
   Modelo Usado: gemini-2.5-flash
   Tiempo Total Extracción: 19.0s
   Promedio por Archivo: 6.3s

💰 Costos:
   Costo Total Extracción: $0.002542
   Costo Promedio por Archivo: $0.000847

☁️  Recursos Creados en GCP:
   Storage: 3 archivo(s) en gs://gen-lang-client-0986191192-context-documents/
   Firestore: 3 documento(s) en collection 'context_sources'

⏱️  Tiempo Total: 28.0s

✅ Proceso completado!

💡 Próximos pasos:
   1. Revisar salfagpt-cli-log.md para detalles completos
   2. Ver archivos en GCP Console:
      https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents
   3. Ver documentos en Firestore:
      https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources
   4. Usar en webapp: Los documentos ya están disponibles en Flow

📝 Log appended to: salfagpt-cli-log.md
📊 Events tracked to Firestore (collection: cli_events)
```

---

## 📍 Dónde Quedan Almacenados los Archivos

### 1. GCP Cloud Storage - Archivo Original

**Bucket:** `gen-lang-client-0986191192-context-documents`  
**Path:** `{userId}/{agentId}/{nombre-archivo.pdf}`

**Ejemplo:**
```
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
```

**Ver en consola:**
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents

---

### 2. Firestore - Texto Extraído + Metadata

**Collection:** `context_sources`

**Document contiene:**
```typescript
{
  id: "source-abc123",
  userId: "114671162830729001607",
  name: "manual-producto.pdf",
  type: "pdf",
  enabled: true,
  status: "active",
  
  // ⭐ TEXTO COMPLETO EXTRAÍDO
  extractedData: "Todo el texto del PDF, incluyendo tablas y descripciones de imágenes...",
  
  metadata: {
    gcsPath: "gs://bucket/path/file.pdf",  // ← Link al archivo original
    model: "gemini-2.5-flash",
    charactersExtracted: 15234,
    tokensEstimate: 3809,
    estimatedCost: 0.001234,
    uploadedVia: "cli",                     // ⭐ Origen
    cliVersion: "0.2.0",
  }
}
```

**Ver en consola:**
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources

---

### 3. Firestore - Eventos y Sesiones

**Collections:**
- `cli_events` - Cada operación individual
- `cli_sessions` - Resumen de cada ejecución

**Todos los eventos vinculados a:**
- **User:** alec@getaifactory.com
- **Source:** 'cli'
- **Session ID:** Para agrupar operaciones relacionadas

**Ver eventos:**
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcli_events

**Ver sesiones:**
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcli_sessions

---

## 📖 Detalles de Cada Paso

### Paso 1/3: Upload a GCP Storage

```
⏳ Paso 1/3: Subiendo a GCP Storage...
📤 Subiendo a GCS: gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
   25% (317 KB / 1,270 KB)
   50% (635 KB / 1,270 KB)
   75% (952 KB / 1,270 KB)
✅ Subido en 2.3s: gs://...
✅ Paso 1/3: Subido a: gs://...
```

**Qué se guardó:**
- Archivo PDF original en GCS
- Path: `gs://bucket/{userId}/{agentId}/filename.pdf`
- Metadata: userId, agentId, uploadedVia='cli'

---

### Paso 2/3: Extracción de Texto

```
⏳ Paso 2/3: Extrayendo texto con Gemini AI...
📄 Leyendo archivo: /Users/alec/salfagpt/contextos/pdf/agentes/M001/manual-producto.pdf
📊 Tamaño: 1,270.00 KB
🔄 Enviando a Gemini AI...
✅ Extracción completa en 8.7s
📝 15,234 caracteres extraídos
🎯 ~3,809 tokens estimados
💰 Costo estimado: $0.001234
👁️  Preview: # Manual de Producto...

📖 Preview del texto extraído:
────────────────────────────────────────────────────────────
# Manual de Producto

Bienvenido al manual completo...
────────────────────────────────────────────────────────────
```

**Qué se hizo:**
- Archivo leído como base64
- Enviado a Gemini 2.5 Flash con prompt de extracción
- Modelo procesó el PDF (texto + tablas + imágenes)
- Respuesta contiene TODO el contenido textual
- Preview de 300 caracteres mostrado en terminal

**Detalles técnicos:**
- Input tokens: ~1,234 (prompt + imagen)
- Output tokens: ~3,809 (texto extraído)
- Costo: $0.001234 (según pricing de Gemini Flash)

---

### Paso 3/3: Guardar en Firestore

```
⏳ Paso 3/3: Guardando en Firestore...
✅ Paso 3/3: Guardado en Firestore
   🔑 Document ID: source-abc123def456
   📍 Ver en: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources~2Fsource-abc123def456
```

**Qué se guardó:**
- Document en collection `context_sources`
- Incluye texto completo en `extractedData`
- Metadata completa (modelo, tokens, costo, duración)
- Link al archivo GCS
- Usuario: alec@getaifactory.com
- Origen: 'cli'

---

## 📊 Resumen Final

```
======================================================================
📊 Resumen del Proceso:
======================================================================

📁 Archivos Procesados:
   Total: 3
   ✅ Exitosos: 3
   ❌ Fallidos: 0
   📦 Tamaño Total: 2.51 MB

📝 Extracción de Texto:
   Caracteres Totales: 27,813
   Modelo Usado: gemini-2.5-flash
   Tiempo Total Extracción: 19.0s
   Promedio por Archivo: 6.3s

💰 Costos:
   Costo Total Extracción: $0.002542
   Costo Promedio por Archivo: $0.000847

☁️  Recursos Creados en GCP:
   Storage: 3 archivo(s) en gs://gen-lang-client-0986191192-context-documents/
   Firestore: 3 documento(s) en collection 'context_sources'

⏱️  Tiempo Total: 28.0s
```

**Métricas mostradas:**
- Número total de archivos
- Éxito/fallos
- Tamaño total procesado
- Caracteres extraídos (total)
- Tiempo de extracción (total y promedio)
- Costos (total y promedio)
- Recursos creados en GCP

---

## 🔍 Cómo Verificar que se Subió Correctamente

### 1. Check GCP Storage

```bash
gsutil ls gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/

# Deberías ver:
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/politicas-atencion.pdf
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/faq-cliente.pdf
```

### 2. Check Firestore

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const docs = await firestore
  .collection('context_sources')
  .where('metadata.uploadedVia', '==', 'cli')
  .orderBy('addedAt', 'desc')
  .limit(10)
  .get();

console.log(\`📊 Documentos subidos via CLI: \${docs.size}\n\`);

docs.forEach(doc => {
  const data = doc.data();
  console.log(\`📄 \${data.name}\`);
  console.log(\`   GCS: \${data.metadata.gcsPath}\`);
  console.log(\`   Caracteres: \${data.metadata.charactersExtracted.toLocaleString()}\`);
  console.log(\`   Costo: $\${data.metadata.estimatedCost.toFixed(6)}\`);
  console.log('');
});

process.exit(0);
"
```

### 3. Check CLI Events

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const events = await firestore
  .collection('cli_events')
  .where('userEmail', '==', 'alec@getaifactory.com')
  .orderBy('timestamp', 'desc')
  .limit(20)
  .get();

console.log(\`📊 Últimos \${events.size} eventos CLI:\n\`);

events.forEach(doc => {
  const data = doc.data();
  console.log(\`\${data.timestamp.toDate().toLocaleString()} - \${data.eventType}\`);
  if (data.fileName) console.log(\`   Archivo: \${data.fileName}\`);
  if (data.estimatedCost) console.log(\`   Costo: $\${data.estimatedCost.toFixed(6)}\`);
  console.log('');
});

process.exit(0);
"
```

---

## ⚠️ Si Hay Errores

### Error en Upload

```
❌ Error subiendo: Permission denied

💡 Solución:
gcloud auth application-default login
```

### Error en Extracción

```
❌ Error en extracción: API key not configured

💡 Solución:
Verifica .env tiene:
GOOGLE_AI_API_KEY=tu-key-aqui
```

### Fallo Parcial

```
📁 Archivos Procesados:
   Total: 3
   ✅ Exitosos: 2
   ❌ Fallidos: 1

⚠️  Failed uploads:
   - archivo-corrupto.pdf: Invalid PDF format
```

**Qué hacer:**
1. Check el archivo fallido
2. Verifica que no esté corrupto
3. Intenta de nuevo solo ese archivo

---

**Last Updated:** 2025-10-19  
**CLI Version:** 0.2.0  
**User:** alec@getaifactory.com

