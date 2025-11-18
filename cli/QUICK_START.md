# 🚀 Quick Start - CLI Upload

**2 minutos para tu primer batch upload**

---

## ⚡ Setup Rápido

### 1. Verificar Requisitos

```bash
# Node.js 18+ instalado
node --version

# Variables de entorno configuradas
cat .env | grep GOOGLE_AI_API_KEY
cat .env | grep GOOGLE_CLOUD_PROJECT
```

### 2. Preparar Carpeta con PDFs

```bash
# Crear carpeta de prueba
mkdir -p upload-queue/test-upload

# Copiar PDFs a subir
cp /path/to/*.pdf upload-queue/test-upload/
```

### 3. Ejecutar Upload

```bash
# Método 1: Script de ejemplo (más fácil)
./cli/upload-example.sh

# Método 2: Comando directo (más control)
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=TestApiUpload_S001 \
  --user=114671162830729001607 \
  --email=alec@getaifactory.com \
  --test="¿Cuáles son los requisitos de seguridad?"
```

---

## 📋 Parámetros Mínimos

```bash
--folder=<path>      # Carpeta con PDFs
--tag=<tag>          # Etiqueta para agrupar
--agent=<agentId>    # ID del agente
--user=<userId>      # Tu user ID
--email=<email>      # Tu email
```

---

## ✅ Verificar Resultado

### 1. En la UI de SalfaGPT
1. Abrir agente `TestApiUpload_S001`
2. Click en "Fuentes de Contexto" (icono 📚)
3. Ver documentos con tag `S001-20251118-1545`
4. Verificar que estén **habilitados** (verde)
5. Ver metadata: chunks, embeddings, modelo usado

### 2. Probar RAG Search
```bash
# El test query ya lo hace automáticamente
# Pero también puedes probar en la UI:

1. Abrir conversación con el agente
2. Preguntar: "¿Cuáles son los requisitos de seguridad?"
3. Ver respuesta basada en los documentos subidos
4. Verificar que cite los documentos correctos
```

### 3. Ver Analytics en Firestore

```bash
# Firestore Console
# Collection: cli_events
# Filter: sessionId = <tu-session-id>

# Verás eventos:
# - cli_file_uploaded (por cada archivo)
# - cli_file_extracted (por cada extracción)
# - cli_upload_complete (resumen final)
```

---

## 🔧 Configuración Avanzada

### Usar Modelo Pro (mejor calidad)
```bash
npx tsx cli/commands/upload.ts \
  --folder=/path/to/folder \
  --tag=MY-TAG \
  --agent=MY-AGENT \
  --user=MY-USER-ID \
  --email=my@email.com \
  --model=gemini-2.5-pro
```

### Sin Test Query
```bash
# Omitir --test para subir más rápido
npx tsx cli/commands/upload.ts \
  --folder=/path/to/folder \
  --tag=MY-TAG \
  --agent=MY-AGENT \
  --user=MY-USER-ID \
  --email=my@email.com
```

---

## 💡 Tips

1. **Nombrar carpetas por fecha:** `S001-20251118` es fácil de buscar
2. **Tags descriptivos:** Usar `PROYECTO-FECHA-HORA` para unicidad
3. **Test query relevante:** Probar algo que DEBE estar en los docs
4. **Revisar costos:** ~$0.011 por archivo con Flash
5. **Usar Flash primero:** Solo usar Pro si Flash falla
6. **Batch pequeños:** Empezar con 3-5 archivos, luego escalar

---

## 🆘 Problemas Comunes

| Error | Solución |
|-------|----------|
| `GOOGLE_AI_API_KEY not configured` | Verificar `.env` tiene la API key |
| `Bucket not found` | Verificar `GOOGLE_CLOUD_PROJECT` en `.env` |
| `Agent not found` | Crear agente primero en la UI |
| `Permission denied` | Correr `gcloud auth application-default login` |
| Archivo fallido | Verificar PDF no corrupto, probar con `--model=pro` |

---

## 📚 Documentación Completa

Ver [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) para:
- Explicación detallada de cada paso
- Estructura de datos guardados
- Costos y optimización
- Casos de uso
- Troubleshooting avanzado

---

## 🎯 Ejemplo Real

```bash
# Upload de manuales SSOMA para agente de seguridad
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=TestApiUpload_S001 \
  --user=114671162830729001607 \
  --email=alec@getaifactory.com \
  --test="¿Cuáles son los requisitos de seguridad?"

# Output esperado:
# ✅ Found 3 PDF files
# ✅ 3 files uploaded successfully
# ✅ 101 total chunks created
# ✅ 101 embeddings generated
# ✅ Test query successful
# 💰 Total cost: $0.0142
```

---

**¿Listo para empezar?** → Corre `./cli/upload-example.sh` 🚀

