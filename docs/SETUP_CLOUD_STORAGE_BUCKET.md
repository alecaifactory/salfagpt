# Setup Cloud Storage Bucket para Agent Setup Documents

**Date:** 2025-10-30  
**Purpose:** Crear bucket para almacenar documentos de setup de agentes  
**Status:** ⏳ Pendiente

---

## 🎯 Bucket Requerido

**Nombre:** `gen-lang-client-0986191192-agent-setup-docs`  
**Región:** `us-central1`  
**Proyecto:** `gen-lang-client-0986191192`

---

## 📋 Opción 1: Crear via Console (Recomendado si no tienes permisos CLI)

### Paso 1: Abrir Cloud Console

1. Ve a: https://console.cloud.google.com/storage/browser?project=gen-lang-client-0986191192
2. Asegúrate de estar en el proyecto `gen-lang-client-0986191192`

### Paso 2: Create Bucket

1. Click "CREATE BUCKET"
2. **Name:** `gen-lang-client-0986191192-agent-setup-docs`
3. **Location type:** Region
4. **Location:** `us-central1`
5. **Storage class:** Standard
6. **Access control:** Fine-grained
7. **Protection tools:** None (por ahora)
8. Click "CREATE"

### Paso 3: Configurar Permisos (Opcional)

**Para URLs públicas (más fácil para pruebas):**
1. Click en el bucket creado
2. Permissions tab
3. Add Principal: `allUsers`
4. Role: `Storage Object Viewer`
5. Save

**Para URLs privadas (más seguro para producción):**
- Dejar permisos por defecto
- Usar signed URLs en el código
- Requiere modificar `upload-setup-document.ts`

---

## 📋 Opción 2: Crear via CLI (Requiere permisos)

### Paso 1: Autenticarse

```bash
gcloud auth login
# Selecciona cuenta con permisos de Storage Admin
```

### Paso 2: Crear Bucket

```bash
gsutil mb -p gen-lang-client-0986191192 \
  -l us-central1 \
  -c STANDARD \
  gs://gen-lang-client-0986191192-agent-setup-docs
```

### Paso 3: Verificar Creación

```bash
gsutil ls -p gen-lang-client-0986191192
# Debe mostrar el bucket
```

### Paso 4: Configurar Permisos Públicos (Opcional)

```bash
gsutil iam ch allUsers:objectViewer \
  gs://gen-lang-client-0986191192-agent-setup-docs
```

---

## 📂 Estructura del Bucket

Una vez creado, la estructura será:

```
gs://gen-lang-client-0986191192-agent-setup-docs/
  └── agents/
      ├── {agentId-1}/
      │   └── setup-docs/
      │       ├── {timestamp}-Ficha-M001.pdf
      │       └── {timestamp}-Especificaciones.docx
      ├── {agentId-2}/
      │   └── setup-docs/
      │       └── {timestamp}-Setup.pdf
      └── ...
```

---

## ✅ Verificación

### Después de Crear el Bucket:

```bash
# 1. Verificar que existe
gsutil ls gs://gen-lang-client-0986191192-agent-setup-docs

# 2. Subir archivo de prueba
echo "test" > test.txt
gsutil cp test.txt gs://gen-lang-client-0986191192-agent-setup-docs/test.txt

# 3. Verificar que se subió
gsutil ls gs://gen-lang-client-0986191192-agent-setup-docs/

# 4. Limpiar
gsutil rm gs://gen-lang-client-0986191192-agent-setup-docs/test.txt
rm test.txt
```

---

## 🔧 Troubleshooting

### Error: "does not have storage.buckets.create access"

**Solución:**
1. Pide a un admin del proyecto que te dé rol `Storage Admin`
2. O crea el bucket desde Cloud Console (requiere menos permisos)
3. O usa una cuenta diferente con permisos

**Grant permisos (requiere ser Project Owner):**
```bash
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="user:alec@getaifactory.com" \
  --role="roles/storage.admin"
```

---

### Error: "Reauthentication required"

**Solución:**
```bash
gcloud auth login
# Seguir el flujo de OAuth en el navegador
```

---

## 🚀 Siguiente Paso Después de Crear Bucket

### 1. Verificar que el servidor está corriendo

```bash
cd /Users/alec/salfagpt
npm run dev
# Debe iniciar en localhost:3000
```

### 2. Probar la funcionalidad

1. Abrir http://localhost:3000/chat
2. Seleccionar un agente (ej: M3)
3. Click "Configurar Agente"
4. Seleccionar tab "Mejorar Prompt" (tercera opción)
5. Subir documento "Ficha de Asistente Virtual"
6. Click "Generar Prompt Mejorado"
7. Esperar procesamiento (~30 segundos)
8. Revisar prompt mejorado
9. Click "Aplicar"

### 3. Verificar en Cloud Storage

```bash
# Listar archivos subidos
gsutil ls -r gs://gen-lang-client-0986191192-agent-setup-docs/

# Debe mostrar:
# gs://gen-lang-client-0986191192-agent-setup-docs/agents/{agentId}/setup-docs/{timestamp}-{filename}.pdf
```

---

## 📊 Costos Estimados

**Cloud Storage:**
- Standard storage: $0.020 per GB/month
- Documentos típicos: 0.5MB - 5MB
- 100 documentos ≈ 500MB = **$0.01/month**

**Operaciones:**
- Upload: $0.005 per 1,000 operations
- 100 uploads = **$0.0005**

**Total estimado:** < $1/month para uso normal

---

## 🔒 Security Best Practices

### Para Producción:

1. **NO usar URLs públicas** (evitar `allUsers:objectViewer`)

2. **Usar Signed URLs:**
```typescript
// En upload-setup-document.ts
const [url] = await cloudFile.getSignedUrl({
  action: 'read',
  expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
});
```

3. **Agregar reglas de lifecycle:**
```bash
# Auto-eliminar archivos > 1 año
gsutil lifecycle set lifecycle.json \
  gs://gen-lang-client-0986191192-agent-setup-docs
```

4. **Habilitar versionado:**
```bash
gsutil versioning set on \
  gs://gen-lang-client-0986191192-agent-setup-docs
```

---

**Status Actual:** ⏳ Bucket pendiente de creación  
**Bloqueador:** Permisos de cuenta  
**Solución:** Crear via Console o pedir permisos Storage Admin

