# 🏗️ Arquitectura Completa GCP - SALFAGPT Platform

**Proyecto:** SALFAGPT  
**Cliente:** SALFACORP  
**Fecha de Creación:** 2025-11-04  
**Estado:** ✅ Producción Operacional  
**Última Actualización:** 2025-11-04

---

## 📋 Tabla de Contenidos

1. [Información del Proyecto](#información-del-proyecto)
2. [Arquitectura General](#arquitectura-general)
3. [Configuración de Autenticación](#configuración-de-autenticación)
4. [Servicios GCP Utilizados](#servicios-gcp-utilizados)
5. [Networking y Load Balancing](#networking-y-load-balancing)
6. [Seguridad y Permisos](#seguridad-y-permisos)
7. [Variables de Entorno](#variables-de-entorno)
8. [Deployment y CI/CD](#deployment-y-cicd)
9. [Mejores Prácticas Pendientes](#mejores-prácticas-pendientes)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Información del Proyecto

### 0. Proyecto GCP

**Project ID:** `salfagpt`  
**Project Number:** `82892384200`  
**Project Name:** SALFAGPT  
**Organization:** SALFACORP  
**Owner:** alec@salfacloud.cl

**URLs de Acceso:**
- **Console Principal:** https://console.cloud.google.com/home/dashboard?project=salfagpt
- **Cloud Resource Manager:** https://console.cloud.google.com/cloud-resource-manager?project=salfagpt

**Región Principal:** `us-central1` (Database, Storage)  
**Región Compute:** `us-east4` (Cloud Run)

---

## 🏛️ Arquitectura General

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA SALFAGPT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuario Final (Web/Mobile)                                    │
│         ↓                                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  Load Balancer (HTTPS)                       │             │
│  │  lb-salfagpt-ft-prod                         │             │
│  │  • SSL Certificate (Google-managed)          │             │
│  │  • IP: 34.8.207.125                          │             │
│  │  • Hosts: salfagpt.salfagestion.cl           │             │
│  │           ia.salfagpt.salfagestion.cl        │             │
│  └──────────────────┬───────────────────────────┘             │
│                     ↓                                           │
│  ┌──────────────────────────────────────────────┐             │
│  │  Backend Service (NEG)                       │             │
│  │  be-cr-salfagpt-ai-ft-prod                   │             │
│  │  • Region: us-east4                          │             │
│  │  • Health Check: /                           │             │
│  └──────────────────┬───────────────────────────┘             │
│                     ↓                                           │
│  ┌──────────────────────────────────────────────┐             │
│  │  Cloud Run Service                           │             │
│  │  cr-salfagpt-ai-ft-prod                      │             │
│  │  • Region: us-east4                          │             │
│  │  • Port: 3000                                │             │
│  │  • Memory: 2GiB, CPU: 2                      │             │
│  │  • Min: 1, Max: 10 instances                 │             │
│  │  • URL: https://cr-salfagpt-ai-ft-prod       │             │
│  │         -3snj65wckq-uk.a.run.app             │             │
│  └──────────────────┬───────────────────────────┘             │
│                     ↓                                           │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Backend Services                       │       │
│  ├─────────────────────────────────────────────────────┤       │
│  │                                                     │       │
│  │  🔥 Firestore (us-central1)                        │       │
│  │     • Database: (default)                          │       │
│  │     • Collections: 20+                             │       │
│  │     • Users, Conversations, Messages               │       │
│  │     • Domains, Context Sources                     │       │
│  │                                                     │       │
│  │  📦 Cloud Storage (us-central1)                    │       │
│  │     • Bucket: salfagpt-uploads                     │       │
│  │     • Documents, PDFs, Checkpoints                 │       │
│  │                                                     │       │
│  │  📊 BigQuery (us-central1)                         │       │
│  │     • Dataset: flow_analytics                      │       │
│  │     • Tables: embeddings, analytics                │       │
│  │     • Vector Search (768-dim)                      │       │
│  │                                                     │       │
│  │  🤖 Vertex AI (us-central1)                        │       │
│  │     • Model: text-embedding-004                    │       │
│  │     • Dimensions: 768                              │       │
│  │                                                     │       │
│  │  ✨ Gemini AI (API externa)                        │       │
│  │     • gemini-2.5-flash / pro                       │       │
│  │     • API Key authentication                       │       │
│  │                                                     │       │
│  │  📝 Cloud Logging                                  │       │
│  │     • Application logs                             │       │
│  │     • Error tracking                               │       │
│  │                                                     │       │
│  │  🔐 Secret Manager                                 │       │
│  │     • API Keys, OAuth secrets                      │       │
│  │     • JWT secrets                                  │       │
│  │                                                     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Configuración de Autenticación

### Credenciales de Administrador

**Usuario Admin:** `alec@salfacloud.cl`  
**Propósito:** Gestión del proyecto GCP, deployment, configuración

**Autenticación Local (Desarrollo):**
```bash
# 1. Instalar gcloud CLI
brew install google-cloud-sdk  # macOS

# 2. Autenticar como alec@salfacloud.cl
gcloud auth login
# Seleccionar: alec@salfacloud.cl

# 3. Configurar Application Default Credentials
gcloud auth application-default login
# Seleccionar: alec@salfacloud.cl

# 4. Configurar proyecto por defecto
gcloud config set project salfagpt

# 5. Verificar configuración
gcloud config list
# account = alec@salfacloud.cl
# project = salfagpt
```

**Roles del Usuario en el Proyecto:**
- Owner (Propietario del proyecto)
- Editor (Puede modificar recursos)
- Acceso a todos los servicios GCP

**Autenticación en Producción:**
- Cloud Run usa Service Account (no usuario personal)
- Service Account: `82892384200-compute@developer.gserviceaccount.com`

---

## 🗄️ Servicios GCP Utilizados

### 1. Firestore (Base de Datos Principal)

**API:** `firestore.googleapis.com`  
**Estado:** ✅ Habilitado  
**Database ID:** `(default)`  
**Región:** `us-central1`  
**Modo:** Native (no Datastore)

**URL de Acceso:**
- **Console:** https://console.cloud.google.com/firestore?project=salfagpt
- **Data Browser:** https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=salfagpt

**Colecciones Principales (20 total):**

| Colección | Propósito | Documentos Aprox. | Indexes |
|-----------|-----------|-------------------|---------|
| `conversations` | Agentes AI (cada conversación) | 100+ | userId, lastMessageAt |
| `messages` | Mensajes de chat | 500+ | conversationId, timestamp |
| `users` | Perfiles de usuario | 10+ | email, role |
| `domains` | Control de acceso por dominio | 5+ | domainName, enabled |
| `context_sources` | Documentos subidos | 20+ | userId, addedAt |
| `document_chunks` | Chunks de texto (RAG) | 3,000+ | sourceId, chunkIndex |
| `conversation_context` | Estado del agente | 100+ | conversationId |
| `user_settings` | Preferencias de usuario | 10+ | userId |
| `agent_configs` | Configuración de agentes | 50+ | conversationId |
| `agent_prompt_versions` | Historial de prompts | 100+ | agentId, createdAt |
| `folders` | Organización | 20+ | userId |
| `agent_shares` | Compartir agentes | 5+ | agentId |
| `message_feedback` | Feedback de mensajes | 50+ | messageId |
| `feedback_tickets` | Tickets de soporte | 10+ | status |
| `backlog_items` | Roadmap items | 30+ | priority |
| `evaluations` | Evaluaciones de calidad | 20+ | agentId |
| `test_questions` | Preguntas de prueba | 50+ | agentId |
| `test_results` | Resultados de tests | 100+ | testId |
| `agent_testing_config` | Config de testing | 10+ | agentId |
| `ticket_counters` | Auto-increment IDs | 1+ | domain |

**Índices Compuestos Críticos:**
```javascript
// conversations
{
  collectionGroup: "conversations",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "lastMessageAt", order: "DESCENDING" }
  ]
}

// messages
{
  collectionGroup: "messages",
  fields: [
    { fieldPath: "conversationId", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "ASCENDING" }
  ]
}

// document_chunks (RAG)
{
  collectionGroup: "document_chunks",
  fields: [
    { fieldPath: "sourceId", order: "ASCENDING" },
    { fieldPath: "chunkIndex", order: "ASCENDING" }
  ]
}
```

**Configuración de Seguridad:**
- **Reglas de Seguridad:** Definidas en `firestore.rules`
- **Acceso:** Usuarios solo ven sus propios datos
- **Isolación:** Por `userId` en todas las queries

**Permisos Requeridos:**
- ✅ `roles/datastore.owner` - Control total de Firestore
- ✅ `roles/datastore.user` - Lectura/escritura de documentos

**Archivos del Código:**
- `src/lib/firestore.ts` - Cliente principal de Firestore
- `src/lib/domains.ts` - Gestión de dominios
- `src/pages/api/**/*.ts` - Todos los endpoints de API

**Métricas de Rendimiento:**
- Read Latency (p95): ~130ms
- Write Latency (p95): ~250ms
- Queries/sec: 10-50

---

### 2. Cloud Storage (Almacenamiento de Archivos)

**API:** `storage.googleapis.com`  
**Estado:** ✅ Habilitado

**URL de Acceso:**
- **Console:** https://console.cloud.google.com/storage/browser?project=salfagpt&prefix=&forceOnBucketsSortingFiltering=true&bucketType=live

**Buckets Configurados:**

#### salfagpt-uploads
- **Región:** `us-central1`
- **Storage Class:** Standard
- **Acceso Público:** Bloqueado (Uniform bucket-level access)
- **Propósito:** Documentos subidos por usuarios

**Estructura de Directorios:**
```
gs://salfagpt-uploads/
├── documents/
│   ├── 1730123456789-manual-usuario.pdf
│   ├── 1730123457890-reporte-ventas.xlsx
│   └── ... (archivos timestamped)
├── checkpoints/
│   ├── extraction-abc123-chunk-0.json
│   └── ... (estados de extracción)
└── temp/
    └── ... (archivos temporales)
```

**Tipos de Archivos Soportados:**
- PDF (.pdf)
- Word (.docx, .doc)
- Excel (.xlsx, .xls)
- CSV (.csv)
- Texto (.txt)

**Configuración de Lifecycle:**
```yaml
# Auto-delete archivos temporales después de 7 días
lifecycle:
  rule:
    - action: Delete
      condition:
        age: 7
        matchesPrefix: ["temp/"]
```

**Permisos Requeridos:**
- ✅ `roles/storage.admin` - Gestión completa de buckets
- ✅ `roles/storage.objectAdmin` - Operaciones con objetos

**Archivos del Código:**
- `src/lib/storage.ts` - Upload/download
- `src/lib/chunked-extraction.ts` - Almacenamiento de chunks
- `src/lib/extraction-checkpoint.ts` - Checkpoints de estado
- `src/lib/tool-manager.ts` - Gestión de archivos

**Verificación:**
```bash
# Listar bucket
gsutil ls -p salfagpt
# Output: gs://salfagpt-uploads/

# Verificar permisos
gsutil iam get gs://salfagpt-uploads | grep 82892384200
```

---

### 3. Load Balancer (Networking)

**Tipo:** HTTP(S) Load Balancing (Application Load Balancer)  
**Estado:** ✅ Configurado y Operacional

**URL de Acceso:**
- **Console:** https://console.cloud.google.com/net-services/loadbalancing/details/httpAdvanced/lb-salfagpt-ft-prod?project=salfagpt

#### Configuración del Load Balancer

**Nombre:** `lb-salfagpt-ft-prod`  
**Tipo:** HTTP(S) Advanced Load Balancer  
**IP Externa:** `34.8.207.125` (Estática, reservada)  
**Región:** Global (multi-región)

**Componentes:**

##### Frontend Configuration
```yaml
Name: fe-salfagpt-ft-prod
Protocol: HTTPS
IP: 34.8.207.125 (salfagpt-lb-ip)
Port: 443
Certificate: Google-managed SSL certificate
  - salfagpt.salfagestion.cl
  - ia.salfagpt.salfagestion.cl
```

##### URL Map (Routing)
```yaml
Name: lb-salfagpt-ft-prod
Default Backend: be-cr-salfagpt-ai-ft-prod
Host Rules:
  - Hosts: salfagpt.salfagestion.cl, ia.salfagpt.salfagestion.cl
    Path Matcher: All paths (*)
    Backend: be-cr-salfagpt-ai-ft-prod
```

##### Backend Service
- **Nombre:** `be-cr-salfagpt-ai-ft-prod`
- **Tipo:** Serverless Network Endpoint Group (NEG)
- **Región:** us-east4
- **Target:** Cloud Run service `cr-salfagpt-ai-ft-prod`
- **Health Check:** `GET /` (200 OK)
- **Timeout:** 30s
- **Console:** https://console.cloud.google.com/net-services/loadbalancing/backends/details/backendService/be-cr-salfagpt-ai-ft-prod?project=salfagpt

##### Network Endpoint Group
```yaml
Name: gr-be-cr-salfagpt-ai-ft-prod
Type: Serverless NEG
Region: us-east4
Target: Cloud Run service cr-salfagpt-ai-ft-prod
```

**Beneficios del Load Balancer:**
- ✅ CDN caching global
- ✅ Cloud Armor (WAF) habilitado
- ✅ Dominio personalizado con SSL
- ✅ Múltiples hosts soportados
- ✅ Auto-scaling global
- ✅ Health checks automáticos

**Costo:** ~$18-20 USD/mes

---

### 4. Cloud Run (Servicio de Aplicación)

**API:** `run.googleapis.com`  
**Estado:** ✅ Desplegado y Corriendo

**URLs de Acceso:**
- **Console:** https://console.cloud.google.com/run/services?project=salfagpt
- **Service Detail:** https://console.cloud.google.com/run/detail/us-east4/cr-salfagpt-ai-ft-prod/observability/metrics?project=salfagpt

#### Configuración del Servicio

**Service Name:** `cr-salfagpt-ai-ft-prod`  
**Región:** `us-east4`  
**Revision Actual:** `cr-salfagpt-ai-ft-prod-00036-9rr` (ejemplo)

**URLs del Servicio:**
- **URL Directa:** https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
- **Custom Domain (vía LB):** https://salfagpt.salfagestion.cl
- **Alternate (vía LB):** https://ia.salfagpt.salfagestion.cl

**Configuración de Contenedor:**
```yaml
Container:
  Port: 3000
  Image: gcr.io/salfagpt/salfagpt:latest (auto-built from source)
  
Resources:
  Memory: 2 GiB
  CPU: 2 vCPUs
  
Scaling:
  Min Instances: 1  # Always warm (evita cold starts)
  Max Instances: 10
  Concurrency: 80 requests/instance
  
Timeout: 300s (5 minutos)

Ingress: All traffic allowed
Authentication: Allow unauthenticated (OAuth en aplicación)
```

**Service Account:**
- Email: `82892384200-compute@developer.gserviceaccount.com`
- Tipo: Default Compute Engine service account
- Roles: Editor, Storage Admin, Firestore Owner

**Health Check:**
- Path: `/` or `/api/health/firestore`
- Expected: HTTP 200
- Interval: 10s

**Métricas Clave:**
- Request count: ~1,000-5,000/día
- Average latency: 800ms-2s
- Error rate: <1%
- CPU utilization: 20-40%
- Memory utilization: 40-60%

**Archivos Relacionados:**
- `Dockerfile` - Imagen del contenedor
- `astro.config.mjs` - Configuración de Astro
- `package.json` - Build scripts

---

### 5. Networking y Servicios de Red

**URL de Referencia:** https://console.cloud.google.com/net-services/loadbalancing/backends/details/backendService/be-cr-salfagpt-ai-ft-prod?project=salfagpt

#### IP Estática (Load Balancer Frontend)

**Nombre:** `salfagpt-lb-ip`  
**Dirección:** `34.8.207.125`  
**Tipo:** Global (Anycast)  
**Región:** Global  
**Versión:** IPv4  
**Propósito:** Frontend del Load Balancer

**DNS Configuration (en proveedor DNS externo):**
```
# A Records apuntando al Load Balancer
salfagpt.salfagestion.cl.        A    34.8.207.125
ia.salfagpt.salfagestion.cl.     A    34.8.207.125

# TTL recomendado
TTL: 300 (5 minutos)
```

#### SSL/TLS Configuration

**Certificados:** Google-managed SSL certificates (automáticos)  
**Dominios cubiertos:**
- salfagpt.salfagestion.cl
- ia.salfagpt.salfagestion.cl

**Renovación:** Automática (90 días antes del vencimiento)  
**Protocolo:** TLS 1.2+ (soporta TLS 1.3)

#### Cloud Armor (Seguridad)

**Policy:** `salfagpt-security-policy` (si configurado)  
**Reglas:**
- Rate limiting: 1000 requests/min por IP
- Geo-blocking: Configurable
- DDoS protection: Habilitado por defecto

---

### 6. BigQuery (Analytics y Vector Search)

**API:** `bigquery.googleapis.com`  
**Estado:** ✅ Habilitado

**Dataset Principal:** `flow_analytics`  
**Región:** `us-central1`  
**URL de Acceso:** https://console.cloud.google.com/bigquery?project=salfagpt

**Tablas Configuradas:**

#### document_embeddings (Vector Search)
```sql
CREATE TABLE `salfagpt.flow_analytics.document_embeddings` (
  chunk_id STRING NOT NULL,
  source_id STRING NOT NULL,
  user_id STRING NOT NULL,
  agent_id STRING,
  text STRING NOT NULL,
  embedding ARRAY<FLOAT64>,  -- 768 dimensions
  chunk_index INT64,
  total_chunks INT64,
  created_at TIMESTAMP NOT NULL,
  metadata JSON
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, source_id;
```

**Propósito:** Vector similarity search para RAG (Retrieval-Augmented Generation)

**Dimensiones:** 768 (Vertex AI text-embedding-004)

**Query de Búsqueda Ejemplo:**
```sql
-- Buscar los 5 chunks más relevantes
WITH query_vector AS (
  SELECT @queryEmbedding AS embedding
)
SELECT 
  chunk_id,
  text,
  ML.DISTANCE(de.embedding, qv.embedding, 'COSINE') AS distance
FROM `salfagpt.flow_analytics.document_embeddings` de,
     query_vector qv
WHERE user_id = @userId
ORDER BY distance ASC
LIMIT 5;
```

#### Otras Tablas Analytics
- `conversations` - Analytics de conversaciones
- `messages` - Analytics de mensajes
- `context_usage` - Tracking de uso de contexto
- `daily_metrics` - Métricas agregadas diarias

**Permisos Requeridos:**
- ✅ `roles/bigquery.dataEditor` - Lectura/escritura de datos
- Incluido en `roles/editor`

**Archivos del Código:**
- `src/lib/bigquery-vector-search.ts` - Búsqueda vectorial
- `src/lib/bigquery-agent-search.ts` - Búsqueda de agentes
- `src/lib/bigquery-agent-sync.ts` - Sincronización
- `src/lib/analytics.ts` - Analytics queries

---

### 7. Vertex AI (Embeddings)

**API:** `aiplatform.googleapis.com`  
**Estado:** ✅ Habilitado

**Modelo Utilizado:** `text-embedding-004`  
**Región:** `us-central1`  
**Dimensiones:** 768

**Propósito:**
- Generar embeddings semánticos de texto
- Búsqueda vectorial (similarity search)
- RAG (Retrieval-Augmented Generation)

**Uso:**
```typescript
import { generateEmbedding } from './lib/embeddings';

// Generar embedding de 768 dimensiones
const vector = await generateEmbedding("Texto de consulta del usuario");
// Returns: number[] (768 elementos)

// Se almacena en BigQuery para búsqueda posterior
```

**Permisos Requeridos:**
- ✅ Via `roles/editor` (incluye Vertex AI)
- O específicamente: `roles/aiplatform.user`

**Archivos del Código:**
- `src/lib/embeddings.ts` - Generación de embeddings

**Costos:**
- ~$0.00001 por 1,000 caracteres procesados

---

### 8. Gemini AI (Generación de Respuestas)

**API:** Gemini AI REST API (externa a GCP)  
**Autenticación:** API Key (no IAM de GCP)  
**Estado:** ✅ Operacional

**Modelos Utilizados:**
- `gemini-2.5-flash` - Rápido, económico (default)
  - Tokens: 1M input, 8K output
  - Costo: $0.075/1M input, $0.30/1M output
- `gemini-2.5-pro` - Avanzado, preciso
  - Tokens: 2M input, 8K output
  - Costo: $1.25/1M input, $5.00/1M output

**Casos de Uso:**
- Respuestas de chat con IA
- Extracción de texto de PDFs
- Procesamiento de queries con RAG
- Generación de contenido

**API Key:** Configurado en `GOOGLE_AI_API_KEY` (Secret Manager)

**Archivos del Código:**
- `src/lib/gemini.ts` - Cliente principal
- `src/pages/api/conversations/[id]/messages.ts` - Endpoint de chat
- `src/pages/api/extract-document.ts` - Extracción de documentos

**Patrón de Uso:**
```typescript
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY 
});

const result = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: messages,
  config: {
    systemInstruction: systemPrompt,
    temperature: 0.7,
    maxOutputTokens: 8192
  }
});
```

**Límites de Rate:**
- Flash: 10 requests/min (tier gratuito)
- Pro: 5 requests/min (tier gratuito)
- Escalable con facturación habilitada

---

### 9. Cloud Logging (Monitoreo)

**API:** `logging.googleapis.com`  
**Estado:** ✅ Automáticamente habilitado con Cloud Run

**Tipos de Logs:**

#### Application Logs
- Source: `console.log()`, `console.error()`, etc.
- Nivel: INFO, WARNING, ERROR
- Retention: 30 días (default)

#### Request Logs
- Automáticos para cada HTTP request
- Incluye: método, URL, status, latencia
- Útil para debugging

#### Security Logs
- Login attempts
- Domain verification
- Permission errors

**Visualización:**
```bash
# Logs recientes
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 \
  --project=salfagpt \
  --format=json

# Solo errores
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 \
  --project=salfagpt
```

**Filtros Útiles:**
```
# Errores de autenticación
resource.type="cloud_run_revision" AND textPayload=~"OAuth"

# Performance (latencias >2s)
resource.type="cloud_run_revision" AND latency>2s

# Errores de Firestore
resource.type="cloud_run_revision" AND textPayload=~"PERMISSION_DENIED"
```

**Permisos Requeridos:**
- ✅ `roles/logging.logWriter` - Escribir logs

**Archivos del Código:**
- `src/lib/logger.ts` - Logging estructurado
- Todo código server-side (automático)

---

### 10. Secret Manager (Gestión de Secretos)

**API:** `secretmanager.googleapis.com`  
**Estado:** ✅ Habilitado

**Secretos Almacenados:**

| Secret Name | Propósito | Versiones | Usado En |
|-------------|-----------|-----------|----------|
| `GOOGLE_AI_API_KEY` | Gemini AI authentication | 2+ | Cloud Run |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | 2+ | Cloud Run |
| `JWT_SECRET` | Session token signing | 1 | Cloud Run |

**Acceso a Secretos:**
```typescript
// En Cloud Run, los secretos se cargan automáticamente
const apiKey = process.env.GOOGLE_AI_API_KEY;
const oauthSecret = process.env.GOOGLE_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET;
```

**Configuración en Cloud Run:**
```bash
# Montar secreto como variable de entorno
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --update-secrets="GOOGLE_AI_API_KEY=GOOGLE_AI_API_KEY:latest"
```

**Permisos Requeridos:**
- ✅ `roles/secretmanager.secretAccessor` - Leer secretos

**Rotación de Secretos:**
- Manual (por ahora)
- Recomendado: Cada 90 días
- Crear nueva versión → Actualizar Cloud Run

---

### 11. Otros Servicios GCP

#### Cloud Build
**API:** `cloudbuild.googleapis.com`  
**Propósito:** Build automático de imágenes Docker para Cloud Run  
**Triggered by:** `gcloud run deploy --source .`

#### Artifact Registry
**API:** `artifactregistry.googleapis.com`  
**Propósito:** Almacenar imágenes Docker builds  
**Repository:** `gcr.io/salfagpt/salfagpt`

#### APIs Habilitadas
```bash
# Listar todas las APIs habilitadas
gcloud services list --enabled --project=salfagpt

# Principales:
✅ run.googleapis.com
✅ firestore.googleapis.com
✅ storage.googleapis.com
✅ bigquery.googleapis.com
✅ aiplatform.googleapis.com
✅ secretmanager.googleapis.com
✅ cloudbuild.googleapis.com
✅ artifactregistry.googleapis.com
✅ logging.googleapis.com
✅ compute.googleapis.com
```

---

## 🔐 Configuración OAuth 2.0

**URL de Referencia:** https://console.cloud.google.com/auth/clients/82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com?project=salfagpt

### OAuth Client Configuration

**Client ID:** `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`  
**Tipo:** Web application  
**Proyecto:** salfagpt  
**Creado:** 2025 (fecha exacta en console)

#### Orígenes JavaScript Autorizados

```
1. http://localhost:3000
2. https://salfagpt.salfagestion.cl              ⭐ PRIMARY
3. https://ia.salfagpt.salfagestion.cl           ⭐ ALTERNATE
4. https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
```

**Nota:** Ambos dominios custom apuntan al mismo Load Balancer

#### URIs de Redireccionamiento Autorizados

```
1. http://localhost:3000/auth/callback
2. https://salfagpt.salfagestion.cl/auth/callback              ⭐ PRIMARY
3. https://ia.salfagpt.salfagestion.cl/auth/callback           ⭐ ALTERNATE
4. https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app/auth/callback
```

**Flujo OAuth:**
```
1. Usuario → /auth/login
2. Redirect → Google OAuth consent screen
3. Usuario aprueba
4. Google → /auth/callback?code=xxx
5. Backend → Exchange code por user info
6. Backend → Verify domain access (Firestore)
7. Backend → Create JWT session
8. Backend → Set cookie + Redirect → /chat
```

#### OAuth Secrets

**Client Secret:** `GOCSPX-***` (encriptado)  
**Almacenado en:** Secret Manager  
**Variable de Entorno:** `GOOGLE_CLIENT_SECRET`

**JWT Secret:**
- Generado: openssl rand -base64 32
- Almacenado: Secret Manager
- Variable: `JWT_SECRET`
- Propósito: Firmar session cookies

---

## 🔒 Seguridad y Permisos

### Service Account Principal

**Email:** `82892384200-compute@developer.gserviceaccount.com`  
**Tipo:** Default Compute Engine service account  
**Usado por:** Cloud Run service

#### Roles IAM Asignados

| Role | Alcance | Permisos Críticos | Necesario Para |
|------|---------|-------------------|----------------|
| `roles/editor` | Project-wide | Amplios permisos de edición | Operaciones generales |
| `roles/datastore.owner` | Firestore | Control total de Firestore | Gestión de colecciones |
| `roles/datastore.user` | Firestore | Read/write documentos | Queries de usuarios, dominios |
| `roles/storage.admin` | Cloud Storage | Gestión de buckets | Creación/eliminación buckets |
| `roles/storage.objectAdmin` | Cloud Storage | Operaciones con objetos | Upload/download archivos |
| `roles/bigquery.dataEditor` | BigQuery | Read/write tablas | Vector search, analytics |
| `roles/logging.logWriter` | Cloud Logging | Escribir logs | Monitoreo aplicación |
| `roles/secretmanager.secretAccessor` | Secret Manager | Leer secretos | Acceso a API keys, secrets |

**Verificar Permisos:**
```bash
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:82892384200-compute@developer.gserviceaccount.com" \
  --format="table(bindings.role)"
```

**Otorgar Nuevo Permiso:**
```bash
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/NOMBRE_DEL_ROL"
```

### Firestore Security Rules

**Archivo:** `firestore.rules` (en el proyecto)

**Reglas Principales:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Usuario autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Usuario es dueño
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Conversations - Aislamiento por usuario
    match /conversations/{conversationId} {
      allow read: if isAuthenticated() && 
                    resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                              resource.data.userId == request.auth.uid;
    }
    
    // Messages - Aislamiento por conversación
    match /messages/{messageId} {
      allow read: if isAuthenticated() && 
                    resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
                      request.resource.data.userId == request.auth.uid;
    }
    
    // Domains - Solo admins
    match /domains/{domainId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**Deployment de Reglas:**
```bash
firebase deploy --only firestore:rules --project salfagpt
```

---

## ⚙️ Variables de Entorno

### Variables de Entorno Requeridas (Production)

**En Cloud Run (`cr-salfagpt-ai-ft-prod`):**

| Variable | Valor | Tipo | Crítico |
|----------|-------|------|---------|
| `GOOGLE_CLOUD_PROJECT` | `salfagpt` | Direct | ⭐ SÍ |
| `PUBLIC_BASE_URL` | `https://salfagpt.salfagestion.cl` | Direct | ⭐ SÍ |
| `NODE_ENV` | `production` | Direct | SÍ |
| `GOOGLE_CLIENT_ID` | `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com` | Direct | ⭐ SÍ |
| `GOOGLE_AI_API_KEY` | `AIzaSy***` | Secret | ⭐ SÍ |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-***` | Secret | ⭐ SÍ |
| `JWT_SECRET` | `(random 32+ chars)` | Secret | ⭐ SÍ |

**⚠️ REGLA CRÍTICA:**
- `GOOGLE_CLOUD_PROJECT` **DEBE** ser el Project ID (`salfagpt`)
- **NO** el service name (`cr-salfagpt-ai-ft-prod`)
- **NO** el dominio custom
- **NO** el project number

**Verificación:**
```bash
# Ver todas las variables
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --format="yaml(spec.template.spec.containers[0].env)"

# Verificar valor específico
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.projectId.value'
# Debe retornar: "salfagpt"
```

### Variables de Entorno Locales (Desarrollo)

**Archivo:** `.env` (gitignored)

```bash
# GCP Configuration
GOOGLE_CLOUD_PROJECT=salfagpt

# AI API Keys
GOOGLE_AI_API_KEY=AIzaSy***

# OAuth Configuration
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***

# Authentication
JWT_SECRET=***

# Application Configuration
PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

**Actualizar Variable en Cloud Run:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --update-env-vars="VARIABLE_NAME=value"
```

**Actualizar Secret:**
```bash
# Crear nueva versión del secret
echo -n "nuevo-valor" | gcloud secrets versions add SECRET_NAME \
  --data-file=- \
  --project=salfagpt

# Cloud Run usa :latest automáticamente
```

---

## 🚀 Deployment y CI/CD

### Deployment Manual (Actual)

**Pre-requisitos:**
```bash
# 1. Autenticación
gcloud auth login  # Como alec@salfacloud.cl
gcloud config set project salfagpt

# 2. Verificación local
npm run type-check  # 0 errores
npm run build       # Build exitoso
```

**Comando de Deployment:**
```bash
cd /Users/alec/salfagpt

gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt \
  --platform=managed \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=300s \
  --port=3000
```

**Proceso:**
1. Build de imagen Docker (Cloud Build)
2. Push a Artifact Registry
3. Deploy a Cloud Run
4. Health check automático
5. Traffic switch (blue/green)

**Duración:** ~5-8 minutos

**Verificación Post-Deployment:**
```bash
# 1. Health check
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
# Expected: "healthy"

# 2. Verificar project ID
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.projectId.value'
# Expected: "salfagpt"

# 3. Test de login
open https://salfagpt.salfagestion.cl/auth/login
# Debe redirigir a Google OAuth

# 4. Verificar logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=10 --project=salfagpt
```

### Rollback Plan

**Si el deployment falla:**
```bash
# 1. Listar revisiones
gcloud run revisions list \
  --service=cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt

# 2. Rollback a revisión anterior
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=REVISION_NAME=100 \
  --region=us-east4 \
  --project=salfagpt

# 3. Verificar
curl https://salfagpt.salfagestion.cl/api/health/firestore
```

### CI/CD Futuro (Pendiente)

**Opciones Recomendadas:**

#### Opción 1: Cloud Build Triggers
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    args: ['install']
  
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'type-check']
  
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
  
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'cr-salfagpt-ai-ft-prod'
      - '--region=us-east4'
      - '--source=.'
```

**Trigger:** Push to `main` branch

#### Opción 2: GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - run: npm ci
      - run: npm run type-check
      - run: npm run build
      - run: gcloud run deploy cr-salfagpt-ai-ft-prod --source .
```

---

## 📊 Mejores Prácticas Pendientes (Priorizado)

### 🔴 Alta Prioridad (Implementar primero)

#### 1. Backups Automáticos de Firestore
**Estado:** ⚠️ Pendiente  
**Impacto:** CRÍTICO - Pérdida de datos  
**Esfuerzo:** 2 horas

**Implementación:**
```bash
# Habilitar backups automáticos
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=7d \
  --project=salfagpt

# O configurar export diario a Cloud Storage
gcloud firestore export gs://salfagpt-backups/$(date +%Y%m%d) \
  --project=salfagpt
```

**Automatización con Cloud Scheduler:**
```bash
# Crear job diario a las 02:00 UTC
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/salfagpt/databases/(default):exportDocuments" \
  --http-method=POST \
  --message-body='{"outputUriPrefix":"gs://salfagpt-backups"}' \
  --project=salfagpt
```

**Costo:** ~$0.02/GB/mes (Storage de backups)  
**Beneficio:** Recuperación ante desastres

---

#### 2. Monitoring y Alertas
**Estado:** ⚠️ Parcial (logs sí, alertas no)  
**Impacto:** ALTO - Detección temprana de problemas  
**Esfuerzo:** 3 horas

**Implementación:**

##### A. Uptime Checks
```bash
# Crear uptime check
gcloud monitoring uptime create salfagpt-uptime \
  --resource-type=uptime-url \
  --display-name="SALFAGPT Production Health" \
  --check-interval=60s \
  --timeout=10s \
  --monitored-resource="https://salfagpt.salfagestion.cl/api/health/firestore" \
  --project=salfagpt
```

##### B. Alerting Policies
```bash
# Alert si error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s \
  --project=salfagpt
```

##### C. Notificaciones
```bash
# Email notification channel
gcloud alpha monitoring channels create \
  --display-name="Alec Email" \
  --type=email \
  --channel-labels=email_address=alec@salfacloud.cl \
  --project=salfagpt
```

**Métricas a Monitorear:**
- Request count (spike/drop)
- Error rate (>1%)
- Latency (p95 >3s)
- Memory usage (>80%)
- CPU usage (>70%)
- Firestore errors (PERMISSION_DENIED)

**Costo:** Gratis (tier gratuito cubre needs)

---

#### 3. Disaster Recovery Plan
**Estado:** ⚠️ No documentado  
**Impacto:** ALTO - RTO/RPO no definidos  
**Esfuerzo:** 4 horas (documentación)

**Elementos del Plan:**

##### A. Backups
- Firestore: Diario, retención 7 días
- Cloud Storage: Versioning habilitado
- Configuración: Exportar a repositorio Git

##### B. Recovery Procedures
```markdown
## Escenario 1: Pérdida de datos en Firestore
1. Identificar último backup válido
2. Restaurar: gcloud firestore import gs://salfagpt-backups/YYYYMMDD
3. Verificar integridad de datos
4. Resumir servicio

RTO: 2 horas
RPO: 24 horas (último backup)

## Escenario 2: Cloud Run service corrupto
1. Rollback a revision anterior
2. Si falla, re-deploy desde código fuente
3. Verificar environment variables
4. Test completo

RTO: 30 minutos
RPO: 0 (stateless)

## Escenario 3: Proyecto GCP comprometido
1. Crear nuevo proyecto
2. Restaurar Firestore desde backup
3. Re-deploy aplicación
4. Migrar DNS a nueva IP

RTO: 4 horas
RPO: 24 horas
```

**Documentar en:** `docs/DISASTER_RECOVERY_PLAN.md`

---

### 🟡 Media Prioridad (Siguiente mes)

#### 4. Rate Limiting en API
**Estado:** ⚠️ No implementado  
**Impacto:** MEDIO - Protección contra abuso  
**Esfuerzo:** 6 horas

**Opciones:**

##### A. Cloud Armor (Load Balancer)
```bash
# Crear security policy con rate limiting
gcloud compute security-policies create salfagpt-rate-limit \
  --description="Rate limiting para SALFAGPT" \
  --project=salfagpt

# Agregar regla: 100 requests/min por IP
gcloud compute security-policies rules create 1000 \
  --security-policy=salfagpt-rate-limit \
  --expression="origin.ip == '[enter IP]'" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600 \
  --project=salfagpt

# Aplicar al Load Balancer
gcloud compute backend-services update be-cr-salfagpt-ai-ft-prod \
  --security-policy=salfagpt-rate-limit \
  --global \
  --project=salfagpt
```

##### B. Aplicación (Middleware)
```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Costo:** Gratis (Cloud Armor incluido con Load Balancer)

---

#### 5. CDN Caching
**Estado:** ⚠️ Habilitado pero sin configurar  
**Impacto:** MEDIO - Performance global  
**Esfuerzo:** 3 horas

**Configuración:**
```bash
# Habilitar Cloud CDN en backend service
gcloud compute backend-services update be-cr-salfagpt-ai-ft-prod \
  --enable-cdn \
  --global \
  --project=salfagpt

# Configurar cache mode
gcloud compute backend-services update be-cr-salfagpt-ai-ft-prod \
  --cache-mode=CACHE_ALL_STATIC \
  --global \
  --project=salfagpt
```

**Headers de Cache en Aplicación:**
```typescript
// Archivos estáticos: 1 año
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// HTML: Sin cache
res.setHeader('Cache-Control', 'no-cache, must-revalidate');

// API responses: Sin cache (default)
```

**Beneficio:** 30-50% reducción en latencia global

---

#### 6. Multi-Region Redundancy
**Estado:** ⚠️ Single region  
**Impacto:** MEDIO - High availability  
**Esfuerzo:** 8 horas

**Implementación:**
```bash
# Deploy en múltiples regiones
gcloud run deploy cr-salfagpt-ai-ft-prod-eu \
  --region=europe-west1 \
  --project=salfagpt \
  --source=.

gcloud run deploy cr-salfagpt-ai-ft-prod-asia \
  --region=asia-northeast1 \
  --project=salfagpt \
  --source=.

# Configurar Load Balancer para multi-región
# (requiere backend services adicionales)
```

**Costo:** +100% (doble costo de Cloud Run)  
**Beneficio:** 99.99% uptime, latencia reducida globalmente

---

### 🟢 Baja Prioridad (Optimizaciones futuras)

#### 7. Cloud Functions para Procesamiento Asíncrono
**Estado:** ⚠️ No implementado  
**Impacto:** BAJO - Offload tareas pesadas  
**Esfuerzo:** 12 horas

**Casos de uso:**
- Extracción de PDFs grandes (>100 páginas)
- Generación de embeddings en batch
- Procesamiento de analytics diarios

#### 8. Cloud SQL para Analytics Avanzados
**Estado:** ⚠️ No necesario aún  
**Impacto:** BAJO - BigQuery suficiente por ahora  
**Esfuerzo:** 16 horas

#### 9. VPC Service Controls
**Estado:** ⚠️ No implementado  
**Impacto:** BAJO - Seguridad adicional  
**Esfuerzo:** 8 horas

#### 10. Terraform para Infrastructure as Code
**Estado:** ⚠️ Manual config actual  
**Impacto:** BAJO - Mejor para equipos grandes  
**Esfuerzo:** 20 horas

---

## 🔧 Troubleshooting

### Issue 1: Login Falla con "Dominio Deshabilitado"

**Síntoma:**
```
Error: Dominio no habilitado o no encontrado
Domain: getaifactory.com
```

**Diagnóstico:**
```bash
# 1. Verificar Firestore health
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'

# 2. Verificar project ID correcto
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.projectId.value'
# Debe ser: "salfagpt"

# 3. Verificar dominio existe en Firestore
# Ir a: https://console.cloud.google.com/firestore/databases/-default-/data/panel/domains?project=salfagpt
# Buscar dominio y verificar enabled: true
```

**Solución:**
```bash
# Si project ID es incorrecto
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt"

# Si dominio no existe, crear en Firestore
# (ver PRODUCTION_LOGIN_FIX_COMPLETE_2025-11-03.md)
```

---

### Issue 2: PERMISSION_DENIED en Firestore

**Síntoma:**
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Diagnóstico:**
```bash
# Verificar permisos del service account
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:82892384200-compute@developer.gserviceaccount.com"
```

**Solución:**
```bash
# Otorgar permiso de Firestore
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

### Issue 3: OAuth Redirect URI Mismatch

**Síntoma:**
```
Error: redirect_uri_mismatch
The redirect URI in the request: https://X.com/auth/callback
does not match the ones authorized for the OAuth client.
```

**Solución:**
```bash
# 1. Ir a OAuth console
open "https://console.cloud.google.com/apis/credentials?project=salfagpt"

# 2. Editar Client ID: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h

# 3. Agregar URI faltante en "Authorized redirect URIs"
https://NUEVA-URL.com/auth/callback

# 4. Guardar cambios

# 5. Puede tardar 5 minutos en propagarse
```

---

### Issue 4: Cloud Storage Upload Falla

**Síntoma:**
```
Error uploading file: Forbidden
```

**Diagnóstico:**
```bash
# Verificar permisos del bucket
gsutil iam get gs://salfagpt-uploads
```

**Solución:**
```bash
# Otorgar permiso al service account
gsutil iam ch \
  serviceAccount:82892384200-compute@developer.gserviceaccount.com:roles/storage.objectAdmin \
  gs://salfagpt-uploads
```

---

### Issue 5: Load Balancer 502 Bad Gateway

**Síntoma:**
- Load Balancer retorna 502
- Cloud Run está healthy

**Causas Comunes:**
1. Backend service apunta a revisión incorrecta
2. Health check falla
3. Timeout del Load Balancer < timeout de Cloud Run

**Diagnóstico:**
```bash
# 1. Verificar health del backend
gcloud compute backend-services get-health be-cr-salfagpt-ai-ft-prod \
  --global \
  --project=salfagpt

# 2. Verificar Cloud Run directamente
curl https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app/api/health/firestore

# 3. Ver logs del Load Balancer
gcloud logging read "resource.type=http_load_balancer" \
  --limit=20 \
  --project=salfagpt
```

**Solución:**
- Si health check falla: Ajustar path o expected response
- Si timeout: Aumentar timeout del Load Balancer
- Si revision incorrecta: Actualizar backend service

---

## 📚 Comandos Útiles de Referencia

### Gestión del Proyecto

```bash
# Ver información del proyecto
gcloud projects describe salfagpt

# Listar todos los servicios habilitados
gcloud services list --enabled --project=salfagpt

# Ver uso de cuota
gcloud compute project-info describe --project=salfagpt

# Ver costos del proyecto
gcloud billing accounts list
gcloud billing projects describe salfagpt
```

### Gestión de Cloud Run

```bash
# Listar servicios
gcloud run services list --project=salfagpt

# Describir servicio
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt

# Ver revisiones
gcloud run revisions list \
  --service=cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt

# Ver logs en tiempo real
gcloud alpha logging tail "resource.type=cloud_run_revision" \
  --project=salfagpt

# Ver métricas
gcloud monitoring timeseries list \
  --filter='metric.type="run.googleapis.com/request_count"' \
  --project=salfagpt
```

### Gestión de Firestore

```bash
# Exportar toda la base de datos
gcloud firestore export gs://salfagpt-backups/manual-backup-$(date +%Y%m%d) \
  --project=salfagpt

# Importar backup
gcloud firestore import gs://salfagpt-backups/manual-backup-20251104 \
  --project=salfagpt

# Listar índices
gcloud firestore indexes composite list --project=salfagpt

# Crear índice
gcloud firestore indexes composite create \
  --collection-group=conversations \
  --field-config field-path=userId,order=ascending \
  --field-config field-path=lastMessageAt,order=descending \
  --project=salfagpt
```

### Gestión de Cloud Storage

```bash
# Listar buckets
gsutil ls -p salfagpt

# Ver tamaño del bucket
gsutil du -sh gs://salfagpt-uploads

# Listar archivos recientes
gsutil ls -l gs://salfagpt-uploads/documents/ | tail -10

# Copiar archivo local a bucket
gsutil cp local-file.pdf gs://salfagpt-uploads/documents/

# Configurar lifecycle
gsutil lifecycle set lifecycle.json gs://salfagpt-uploads
```

### Gestión de Secrets

```bash
# Listar secrets
gcloud secrets list --project=salfagpt

# Ver versiones de un secret
gcloud secrets versions list GOOGLE_AI_API_KEY --project=salfagpt

# Crear nuevo secret
echo -n "valor-secreto" | gcloud secrets create NUEVO_SECRET \
  --data-file=- \
  --replication-policy=automatic \
  --project=salfagpt

# Actualizar secret (nueva versión)
echo -n "nuevo-valor" | gcloud secrets versions add GOOGLE_AI_API_KEY \
  --data-file=- \
  --project=salfagpt

# Dar acceso al service account
gcloud secrets add-iam-policy-binding GOOGLE_AI_API_KEY \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=salfagpt
```

---

## 📊 Costos Estimados

### Desglose Mensual (Estimado)

| Servicio | Uso Aproximado | Costo Mensual |
|----------|----------------|---------------|
| **Cloud Run** | 1M requests, 100 GB-hours | $15-25 |
| **Firestore** | 100K reads, 50K writes, 1GB storage | $5-10 |
| **Cloud Storage** | 10 GB storage, 100 GB egress | $2-5 |
| **Load Balancer** | 1M requests, 100 GB egress | $18-22 |
| **BigQuery** | 10 GB storage, 100 GB queries | $5-10 |
| **Vertex AI Embeddings** | 1M chars/mes | $1-2 |
| **Gemini AI (Flash)** | 10M tokens input, 2M output | $1.35 |
| **Cloud Logging** | 10 GB logs | $0.50 |
| **SSL Certificates** | 2 certs (auto-managed) | Gratis |
| **Secret Manager** | 5 secrets, 1K accesos | $0.30 |
| **Backups** (futuro) | 10 GB snapshots | $0.20 |
| **Monitoring** (futuro) | Uptime checks, alerts | Gratis |

**TOTAL ESTIMADO:** $48-97 USD/mes

**Variables:**
- Número de usuarios activos
- Volumen de documentos procesados
- Uso de modelo Pro vs Flash
- Traffic internacional (egress)

**Optimizaciones de Costo:**
1. Usar Flash en lugar de Pro cuando sea posible (94% ahorro)
2. Committed use discounts para Cloud Run (30% descuento)
3. Lifecycle policies en Storage (eliminar archivos viejos)
4. Cache agresivo en Load Balancer (reduce Cloud Run requests)

---

## 🎯 Resumen de Arquitectura

### Stack Tecnológico

**Frontend:**
- Framework: Astro 5.1.x + React 18.3.x
- Styling: Tailwind CSS v3.4.17
- Icons: Lucide React
- Markdown: react-markdown, remark-gfm

**Backend:**
- Runtime: Node.js 20+
- API: Astro API Routes
- Authentication: JWT + Google OAuth 2.0
- Session: HTTP-only cookies

**Database:**
- Primary: Firestore (operational data)
- Analytics: BigQuery (analytical queries)
- Vector DB: BigQuery + Vertex AI embeddings

**AI:**
- Chat: Gemini 2.5 Flash/Pro
- Embeddings: Vertex AI text-embedding-004
- RAG: BigQuery vector search

**Infrastructure:**
- Hosting: Cloud Run (serverless)
- CDN: Cloud CDN (via Load Balancer)
- Storage: Cloud Storage
- Security: Cloud Armor, IAM

### Flujo de Datos

```
Usuario → Load Balancer → Cloud Run → Firestore/Storage/BigQuery
                                    → Gemini AI
                                    → Vertex AI
```

**Latencia Total (p95):**
- Static content: 100-300ms
- API calls: 800ms-2s
- AI responses (first token): 1-3s
- Document extraction: 5-30s (depending on size)

---

## ✅ Checklist de Deployment

### Pre-Deployment

- [ ] Código pasa `npm run type-check` (0 errores)
- [ ] Build exitoso: `npm run build`
- [ ] Test manual en localhost
- [ ] Variables de entorno documentadas
- [ ] Secrets configurados en Secret Manager
- [ ] Service account tiene permisos necesarios
- [ ] OAuth redirect URIs actualizados
- [ ] Backup reciente de Firestore disponible

### Deployment

- [ ] `gcloud config set project salfagpt`
- [ ] `gcloud auth login` (alec@salfacloud.cl)
- [ ] Deploy command con flags correctos
- [ ] Deployment exitoso (sin errores)

### Post-Deployment

- [ ] Health check retorna "healthy"
- [ ] Project ID es "salfagpt" (no service name)
- [ ] Login funciona con cuenta de prueba
- [ ] Crear conversación funciona
- [ ] Upload de documento funciona
- [ ] No errores en logs (últimos 50)
- [ ] Latencia <3s (p95)
- [ ] Monitoring activo

---

## 📖 Referencias

### Documentación Interna
- `PRODUCTION_LOGIN_FIX_COMPLETE_2025-11-03.md` - Fix de producción
- `docs/OAUTH_FINAL_CONFIG_2025-11-03.md` - Configuración OAuth
- `.cursor/rules/gcp-services-permissions.mdc` - Permisos GCP
- `GCP_SERVICES_QUICK_REFERENCE.md` - Referencia rápida
- `STORAGE_ARCHITECTURE.md` - Arquitectura de Storage

### Reglas del Proyecto
- `.cursor/rules/alignment.mdc` - Principios de diseño
- `.cursor/rules/firestore.mdc` - Esquema de base de datos
- `.cursor/rules/backend.mdc` - Arquitectura backend
- `.cursor/rules/deployment.mdc` - Procedimientos de deployment
- `.cursor/rules/gcp-project-consistency.mdc` - Consistencia de proyecto

### Recursos Externos
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [Load Balancing Documentation](https://cloud.google.com/load-balancing/docs)
- [Cloud Armor Documentation](https://cloud.google.com/armor/docs)

---

## 📅 Historial de Cambios

| Fecha | Cambio | Autor | Notas |
|-------|--------|-------|-------|
| 2025-11-03 | Fix producción login | Alec | GOOGLE_CLOUD_PROJECT corregido |
| 2025-11-03 | OAuth unificado | Alec | Todos los dominios configurados |
| 2025-11-04 | Documentación completa | Alec | Este documento |

---

## 🎓 Lecciones Aprendidas

### 1. Project ID vs Service Name
**CRÍTICO:** `GOOGLE_CLOUD_PROJECT` debe ser el project ID (`salfagpt`), NO el service name (`cr-salfagpt-ai-ft-prod`).

### 2. Firestore Connectivity
**Siempre verificar** después de deployment: `curl /api/health/firestore`

### 3. OAuth Redirect URIs
**Mantener sincronizados** los URIs en OAuth console con `PUBLIC_BASE_URL`

### 4. Service Account Permissions
**Otorgar explícitamente** todos los permisos necesarios, no asumir defaults

### 5. Secrets Management
**Usar Secret Manager** en lugar de variables de entorno directas para datos sensibles

---

**Última Actualización:** 2025-11-04  
**Próxima Revisión:** Cuando se implemente CI/CD o multi-región  
**Mantenedor:** alec@salfacloud.cl  
**Estado:** ✅ Documentación completa y verificada

---

**Nota:** Esta documentación debe actualizarse cada vez que se agregue un nuevo servicio GCP, se cambie la arquitectura, o se modifiquen configuraciones críticas.

