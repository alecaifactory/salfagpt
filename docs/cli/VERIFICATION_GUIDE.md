# ✅ Guía de Verificación - Documentos Subidos via CLI

## 🎯 Resumen del Último Upload

**Fecha:** 2025-10-19  
**Usuario:** alec@getaifactory.com  
**Session ID:** cli-session-1760919348501-sinfvs  
**Archivo Procesado:** CIR-182.pdf  

### ✅ Proceso Completado Exitosamente

```
📄 CIR-182.pdf (541 KB)
   ├─ ✅ Subido a GCS en 2.5s
   ├─ ✅ Texto extraído con Gemini Flash en 16.1s
   ├─ ✅ 7,458 caracteres extraídos
   ├─ ✅ Guardado en Firestore (ID: HN3DfhwALQXATFDZvgNe)
   └─ ✅ Costo: $0.000606
```

---

## 📍 Dónde Está Almacenado

### 1. GCP Cloud Storage - Archivo Original

**Ubicación exacta:**
```
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf
```

**Ver en consola:**
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload

**Comandos para verificar:**
```bash
# Listar archivo
gsutil ls gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf

# Ver detalles
gsutil ls -L gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf

# Descargar (si quieres verificar)
gsutil cp gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf ./downloaded-CIR-182.pdf
```

---

### 2. Firestore - Texto Extraído Completo

**Document ID:** `HN3DfhwALQXATFDZvgNe`

**Ver en Firebase Console:**
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources~2FHN3DfhwALQXATFDZvgNe

**Qué contiene:**
```typescript
{
  id: "HN3DfhwALQXATFDZvgNe",
  userId: "114671162830729001607",
  name: "CIR-182.pdf",
  type: "pdf",
  enabled: true,
  status: "active",
  
  // ⭐ EL TEXTO COMPLETO ESTÁ AQUÍ
  extractedData: "Aquí tienes el texto completo del documento, incluyendo su estructura y la tabla en formato Markdown:\n\n---\n\n# DDU 182\n\n0386\n\n## CIRCULAR ORD. Nº\n\n**MAT.:** Aplicación artículo 116 y vigencia del artículo 133 de la Ley General de Urbanismo y Construcciones...",
  // (7,458 caracteres completos)
  
  metadata: {
    originalFileName: "CIR-182.pdf",
    originalFileSize: 554281,
    uploadedVia: "cli",  // ⭐ ORIGEN: CLI
    cliVersion: "0.2.0",
    gcsPath: "gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf",
    
    model: "gemini-2.5-flash",
    charactersExtracted: 7458,
    tokensEstimate: 1865,
    inputTokens: 554,  // Aproximado
    outputTokens: 1865,
    estimatedCost: 0.000606,
    
    extractionDate: Timestamp(2025-10-19),
    extractionTime: 16100  // ms
  }
}
```

**Leer el texto extraído:**
1. Abre el link de Firebase Console arriba
2. Scroll hasta el campo `extractedData`
3. Click para expandir
4. Verás los 7,458 caracteres completos

---

## 🔍 Verificación Paso a Paso

### Paso 1: Verificar GCP Storage ✅

```bash
gsutil ls gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/
```

**Resultado esperado:**
```
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf
```

✅ **Confirmado:** Archivo subido a GCS

---

### Paso 2: Verificar Firestore ✅

**Abrir en navegador:**
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources

**Buscar documento:** HN3DfhwALQXATFDZvgNe

✅ **Confirmado:** Documento creado en Firestore

---

### Paso 3: Verificar Texto Extraído ✅

**En Firestore, campo `extractedData`:**
- Preview mostrado en terminal: "Aquí tienes el texto completo del documento, incluyendo su estructura y la tabla en formato Markdown..."
- Total: 7,458 caracteres
- Incluye tablas convertidas a Markdown
- Incluye toda la estructura del documento

✅ **Confirmado:** Texto completo extraído con Gemini 2.5 Flash

---

### Paso 4: Verificar Metadata ✅

**Metadata guardada:**
- ✅ `gcsPath`: Link al archivo original
- ✅ `model`: gemini-2.5-flash
- ✅ `charactersExtracted`: 7,458
- ✅ `tokensEstimate`: 1,865
- ✅ `estimatedCost`: $0.000606
- ✅ `uploadedVia`: "cli" (origen)
- ✅ `cliVersion`: "0.2.0"

✅ **Confirmado:** Metadata completa guardada

---

## 📊 Progreso Mostrado en Terminal

### Output del CLI (Detallado)

```
📄 Procesando: CIR-182.pdf
   📊 Tamaño: 541.29 KB
   
   ⏳ Paso 1/3: Subiendo a GCP Storage...
   📤 Subiendo a GCS: gs://...CIR-182.pdf
      100% (541 KB / 541 KB)
   ✅ Subido en 2.5s: gs://...
   ✅ Paso 1/3: Subido a: gs://...
   
   ⏳ Paso 2/3: Extrayendo texto con Gemini AI...
   🤖 Extrayendo con gemini-2.5-flash...
   📄 Leyendo archivo: .../CIR-182.pdf
   📊 Tamaño: 541.29 KB
   🔄 Enviando a Gemini AI...
   ✅ Extracción completa en 16.1s
   📝 7,458 caracteres extraídos
   🎯 ~1,865 tokens estimados
   💰 Costo estimado: $0.000606
   👁️  Preview: Aquí tienes el texto completo...
   
   ✅ Paso 2/3: Texto extraído
      📝 7,458 caracteres
      🎯 ~1,865 tokens
      💰 Costo: $0.000606
      ⏱️  Tiempo: 16.1s

   📖 Preview del texto extraído:
   ────────────────────────────────────────
   Aquí tienes el texto completo del documento...
   DDU 182
   CIRCULAR ORD. Nº
   MAT.: Aplicación artículo 116...
   ────────────────────────────────────────
   
   ⏳ Paso 3/3: Guardando en Firestore...
   ✅ Paso 3/3: Guardado en Firestore
      🔑 Document ID: HN3DfhwALQXATFDZvgNe
      📍 Ver en: https://console.firebase.google.com/...
   
   ✨ Archivo completado en 20.5s
```

**Información mostrada:**
- ✅ Tamaño del archivo
- ✅ % de progreso del upload
- ✅ GCS path donde se guardó
- ✅ Tiempo de extracción
- ✅ Caracteres y tokens extraídos
- ✅ Costo estimado
- ✅ Preview de 300 caracteres del texto
- ✅ Firestore document ID
- ✅ Link directo a Firebase Console

---

## 💰 Costos Tracking

### Por Archivo
```
CIR-182.pdf:
- Input tokens: ~554 (archivo + prompt)
- Output tokens: ~1,865 (texto extraído)
- Modelo: gemini-2.5-flash
- Pricing: $0.075/1M input, $0.30/1M output
- Costo: $0.000606
```

### Proyección para 11 archivos
```
Estimación (basado en CIR-182.pdf):
- Promedio por archivo: $0.000606
- 11 archivos: ~$0.0067
- Tiempo estimado: ~200s (3.3 minutos)
```

---

## 🔧 Comandos de Verificación

### Ver archivo en GCS

```bash
# Ver detalles del archivo
gsutil ls -L gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf

# Obtener metadata
gsutil stat gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/CIR-182.pdf
```

### Ver documento en Firestore (via gcloud)

```bash
gcloud firestore documents get \
  --collection-ids=context_sources \
  --document-ids=HN3DfhwALQXATFDZvgNe \
  --project=gen-lang-client-0986191192
```

### Listar todos los archivos subidos

```bash
# En GCS
gsutil ls -r gs://gen-lang-client-0986191192-context-documents/114671162830729001607/

# Total de documentos
gsutil du -s gs://gen-lang-client-0986191192-context-documents/114671162830729001607/
```

---

## 🎯 Próximos Pasos

### 1. Procesar los 11 archivos restantes

```bash
# Opción A: Procesar todos a la vez
npx tsx cli/index.ts upload contextos/pdf/agentes/M001

# Opción B: Procesar por lotes de 3-4
# (Más lento pero puedes ver progreso de cada uno)
```

### 2. Verificar en la Webapp

1. Abre http://localhost:3000/chat
2. Login como alec@getaifactory.com
3. Abre panel "Fuentes de Contexto"
4. Deberías ver "CIR-182.pdf" (y más si procesas todos)
5. Toggle ON para usar en un agente
6. Envía un mensaje preguntando sobre el contenido

### 3. Verificar búsqueda funciona

Pregunta en el chat algo como:
```
"¿Qué dice el documento sobre el artículo 116 de la Ley de Urbanismo?"
```

El AI debería responder usando el contexto del CIR-182.pdf

---

## 📋 Checklist de Verificación Completa

- [x] **GCS:** Archivo subido correctamente
- [x] **Firestore:** Documento creado con ID único
- [x] **extractedData:** Texto completo guardado (7,458 chars)
- [x] **metadata.gcsPath:** Link al archivo original
- [x] **metadata.model:** Modelo usado registrado
- [x] **metadata.uploadedVia:** Marcado como "cli"
- [x] **metadata.estimatedCost:** Costo calculado
- [x] **Terminal:** Progreso detallado mostrado
- [x] **Log:** salfagpt-cli-log.md actualizado
- [x] **Events:** Tracked a cli_events (dev mode simula)
- [x] **Session:** Tracked a cli_sessions (dev mode simula)
- [ ] **Webapp:** Ver documento en interface (próximo paso)
- [ ] **Búsqueda:** Usar contexto en conversación (próximo paso)

---

## 🚀 ¿Todo Funcionó?

**SÍ ✅** si:
- Terminal mostró "✅ Proceso completado!"
- GCS path mostrado: `gs://...CIR-182.pdf`
- Firestore ID mostrado: `HN3DfhwALQXATFDZvgNe`
- Preview del texto mostrado en terminal
- Costo calculado: $0.000606
- Log actualizado en `salfagpt-cli-log.md`

**NO ❌** si:
- Errores en terminal
- No se creó archivo en GCS
- No se creó documento en Firestore
- extractedData está vacío

---

## 💡 Troubleshooting

### Error: "Bucket not found"
```bash
# Crear bucket manualmente
gsutil mb -p gen-lang-client-0986191192 -l us-central1 gs://gen-lang-client-0986191192-context-documents
```

### Error: "Permission denied"
```bash
# Re-autenticar
gcloud auth application-default login
```

### Error: "API key not found"
```bash
# Verificar .env
cat .env | grep GOOGLE_AI_API_KEY

# Si no existe, agregar:
echo "GOOGLE_AI_API_KEY=tu-key-aqui" >> .env
```

---

**Last Updated:** 2025-10-19  
**CLI Version:** 0.2.0  
**Status:** ✅ Working

