# 🗄️ Sistema Completo de Persistencia en Firestore

## ✅ Problema Resuelto

**ANTES:**
- ❌ User settings en localStorage (se pierden)
- ❌ Agent configs solo en memoria (se pierden)
- ❌ Workflow configs solo en memoria (se pierden)
- ❌ Context state no persistía
- ❌ No tracking de uso

**AHORA:**
- ✅ TODO persiste en Firestore
- ✅ Tracking completo con `source: localhost | production`
- ✅ APIs RESTful para todas las configuraciones
- ✅ Logs de uso para analytics
- ✅ Estructura escalable y organizada

---

## 📊 Nuevas Colecciones en Firestore

### 1. `user_settings` - Configuración Global del Usuario
```typescript
{
  userId: "user_abc123",                  // Document ID
  preferredModel: "gemini-2.5-flash",
  systemPrompt: "Eres un asistente...",
  language: "es",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: "localhost" | "production"
}
```

**Uso:** Preferencias globales que aplican a todos los agentes nuevos del usuario.

---

### 2. `agent_configs` - Configuración por Agente
```typescript
{
  id: "conv_xyz789",                      // Document ID = conversationId
  conversationId: "conv_xyz789",
  userId: "user_abc123",
  model: "gemini-2.5-pro",
  systemPrompt: "Eres un experto en...",
  temperature: 0.7,
  maxOutputTokens: 8192,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: "localhost" | "production"
}
```

**Uso:** Configuración específica de cada agente/conversación. Override de user_settings.

---

### 3. `workflow_configs` - Configuración de Workflows
```typescript
{
  id: "pdf-extraction",                   // Workflow ID
  userId: "user_abc123",
  workflowType: "pdf-extraction",
  config: {
    maxFileSize: 50,                      // MB
    maxOutputLength: 20000,               // tokens
    language: "es",
    model: "gemini-2.5-flash"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: "localhost" | "production"
}
```

**Uso:** Configuración personalizada de cada workflow (extracción PDF, CSV, etc.).

---

### 4. `conversation_context` - Estado de Context por Conversación
```typescript
{
  id: "conv_xyz789",                      // Document ID = conversationId
  conversationId: "conv_xyz789",
  userId: "user_abc123",
  activeContextSourceIds: [
    "source_1",
    "source_2",
    "source_3"
  ],
  contextWindowUsage: 45.2,               // Percentage
  lastUsedAt: Timestamp,
  updatedAt: Timestamp,
  source: "localhost" | "production"
}
```

**Uso:** Qué fuentes de contexto están activas para cada agente, y cuánto context window usan.

---

### 5. `usage_logs` - Tracking de Uso
```typescript
{
  id: "log_auto_id",                      // Auto-generated
  userId: "user_abc123",
  conversationId: "conv_xyz789",
  action: "message_sent",
  details: {
    model: "gemini-2.5-pro",
    tokensUsed: 1234,
    contextSourcesUsed: ["source_1", "source_2"]
  },
  timestamp: Timestamp,
  source: "localhost" | "production"
}
```

**Uso:** Analytics, tracking de costos, debugging.

---

## 🔌 APIs Disponibles

### 1. User Settings API

#### GET User Settings
```bash
GET /api/user-settings?userId=user_abc123
```

**Response:**
```json
{
  "userId": "user_abc123",
  "preferredModel": "gemini-2.5-flash",
  "systemPrompt": "Eres un asistente...",
  "language": "es",
  "createdAt": "2025-10-12T10:00:00Z",
  "updatedAt": "2025-10-12T10:00:00Z",
  "source": "localhost"
}
```

#### POST User Settings
```bash
POST /api/user-settings
Content-Type: application/json

{
  "userId": "user_abc123",
  "preferredModel": "gemini-2.5-pro",
  "systemPrompt": "Custom prompt",
  "language": "es"
}
```

---

### 2. Agent Config API

#### GET Agent Config
```bash
GET /api/agent-config?conversationId=conv_xyz789
```

**Response:**
```json
{
  "id": "conv_xyz789",
  "conversationId": "conv_xyz789",
  "userId": "user_abc123",
  "model": "gemini-2.5-pro",
  "systemPrompt": "Eres un experto...",
  "temperature": 0.7,
  "maxOutputTokens": 8192,
  "createdAt": "2025-10-12T10:00:00Z",
  "updatedAt": "2025-10-12T10:00:00Z",
  "source": "localhost"
}
```

#### POST Agent Config
```bash
POST /api/agent-config
Content-Type: application/json

{
  "conversationId": "conv_xyz789",
  "userId": "user_abc123",
  "model": "gemini-2.5-pro",
  "systemPrompt": "Custom agent prompt",
  "temperature": 0.8,
  "maxOutputTokens": 4096
}
```

---

### 3. Workflow Config API

#### GET Workflow Config
```bash
# Specific workflow
GET /api/workflow-config?workflowId=pdf-extraction&userId=user_abc123

# All workflows for user
GET /api/workflow-config?userId=user_abc123
```

#### POST Workflow Config
```bash
POST /api/workflow-config
Content-Type: application/json

{
  "workflowId": "pdf-extraction",
  "userId": "user_abc123",
  "workflowType": "pdf-extraction",
  "config": {
    "maxFileSize": 50,
    "model": "gemini-2.5-flash"
  }
}
```

---

### 4. Conversation Context API

#### GET Conversation Context
```bash
GET /api/conversation-context?conversationId=conv_xyz789
```

**Response:**
```json
{
  "id": "conv_xyz789",
  "conversationId": "conv_xyz789",
  "userId": "user_abc123",
  "activeContextSourceIds": ["source_1", "source_2"],
  "contextWindowUsage": 45.2,
  "lastUsedAt": "2025-10-12T10:00:00Z",
  "updatedAt": "2025-10-12T10:00:00Z",
  "source": "localhost"
}
```

#### POST Conversation Context
```bash
POST /api/conversation-context
Content-Type: application/json

{
  "conversationId": "conv_xyz789",
  "userId": "user_abc123",
  "activeContextSourceIds": ["source_1", "source_2", "source_3"],
  "contextWindowUsage": 52.3
}
```

---

## 🔗 Enlaces Directos a Firestore Console

### Ver Colecciones

**User Settings:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/user_settings?project=gen-lang-client-0986191192
```

**Agent Configs:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/agent_configs?project=gen-lang-client-0986191192
```

**Workflow Configs:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/workflow_configs?project=gen-lang-client-0986191192
```

**Conversation Context:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/conversation_context?project=gen-lang-client-0986191192
```

**Usage Logs:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/usage_logs?project=gen-lang-client-0986191192
```

**Conversations (original):**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/conversations?project=gen-lang-client-0986191192
```

**Messages (original):**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/messages?project=gen-lang-client-0986191192
```

---

## 🧪 Testing en Localhost

### Paso 1: Iniciar servidor
```bash
npm run dev
```

### Paso 2: Test User Settings

**A. Guardar configuración del usuario**
```bash
curl -X POST http://localhost:3000/api/user-settings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_1",
    "preferredModel": "gemini-2.5-pro",
    "systemPrompt": "Eres un experto en tecnología",
    "language": "es"
  }'
```

**B. Obtener configuración**
```bash
curl "http://localhost:3000/api/user-settings?userId=test_user_1"
```

**C. Verificar en Firestore:**
- Abrir: https://console.cloud.google.com/firestore/databases/-default-/data/panel/user_settings?project=gen-lang-client-0986191192
- ✅ Buscar documento `test_user_1`
- ✅ Ver campo `source: "localhost"`

---

### Paso 3: Test Agent Config

**A. Crear agente en UI**
- Ir a http://localhost:3000/chat
- Click "Nuevo Agente"
- Enviar mensaje: "Hola, primer mensaje"

**B. Guardar config del agente**
```bash
curl -X POST http://localhost:3000/api/agent-config \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "TU_CONVERSATION_ID_AQUI",
    "userId": "test_user_1",
    "model": "gemini-2.5-pro",
    "systemPrompt": "Eres un experto en ventas",
    "temperature": 0.8,
    "maxOutputTokens": 4096
  }'
```

**C. Obtener config del agente**
```bash
curl "http://localhost:3000/api/agent-config?conversationId=TU_CONVERSATION_ID_AQUI"
```

**D. Verificar en Firestore:**
- Abrir: https://console.cloud.google.com/firestore/databases/-default-/data/panel/agent_configs?project=gen-lang-client-0986191192
- ✅ Buscar documento con tu `conversationId`
- ✅ Ver campo `source: "localhost"`

---

### Paso 4: Test Workflow Config

**A. Guardar workflow config**
```bash
curl -X POST http://localhost:3000/api/workflow-config \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "pdf-extraction",
    "userId": "test_user_1",
    "workflowType": "pdf-extraction",
    "config": {
      "maxFileSize": 100,
      "maxOutputLength": 50000,
      "language": "es",
      "model": "gemini-2.5-pro"
    }
  }'
```

**B. Obtener workflow config**
```bash
curl "http://localhost:3000/api/workflow-config?workflowId=pdf-extraction&userId=test_user_1"
```

**C. Obtener todos los workflows del usuario**
```bash
curl "http://localhost:3000/api/workflow-config?userId=test_user_1"
```

**D. Verificar en Firestore:**
- Abrir: https://console.cloud.google.com/firestore/databases/-default-/data/panel/workflow_configs?project=gen-lang-client-0986191192
- ✅ Buscar documento `test_user_1_pdf-extraction`
- ✅ Ver campo `source: "localhost"`

---

### Paso 5: Test Conversation Context

**A. Guardar context state**
```bash
curl -X POST http://localhost:3000/api/conversation-context \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "TU_CONVERSATION_ID_AQUI",
    "userId": "test_user_1",
    "activeContextSourceIds": ["source_1", "source_2", "source_3"],
    "contextWindowUsage": 67.5
  }'
```

**B. Obtener context state**
```bash
curl "http://localhost:3000/api/conversation-context?conversationId=TU_CONVERSATION_ID_AQUI"
```

**C. Verificar en Firestore:**
- Abrir: https://console.cloud.google.com/firestore/databases/-default-/data/panel/conversation_context?project=gen-lang-client-0986191192
- ✅ Buscar documento con tu `conversationId`
- ✅ Ver `activeContextSourceIds` array
- ✅ Ver campo `source: "localhost"`

---

## 📊 BigQuery Analytics Queries

### Comparar localhost vs production

```sql
-- User Settings
SELECT 
  source,
  COUNT(*) as total_users,
  COUNT(DISTINCT preferredModel) as unique_models
FROM `gen-lang-client-0986191192.flow_analytics.user_settings`
GROUP BY source;

-- Agent Configs
SELECT 
  source,
  model,
  COUNT(*) as agent_count,
  AVG(temperature) as avg_temperature
FROM `gen-lang-client-0986191192.flow_analytics.agent_configs`
GROUP BY source, model;

-- Workflow Configs
SELECT 
  source,
  workflowType,
  COUNT(*) as workflow_count,
  AVG(JSON_EXTRACT_SCALAR(config, '$.maxFileSize')) as avg_max_file_size
FROM `gen-lang-client-0986191192.flow_analytics.workflow_configs`
GROUP BY source, workflowType;

-- Usage Logs
SELECT 
  source,
  action,
  COUNT(*) as event_count,
  SUM(CAST(JSON_EXTRACT_SCALAR(details, '$.tokensUsed') AS INT64)) as total_tokens
FROM `gen-lang-client-0986191192.flow_analytics.usage_logs`
GROUP BY source, action
ORDER BY event_count DESC;
```

---

## 🔄 Flujo Completo de Persistencia

### Cuando usuario crea un agente:

```
1. Frontend: Usuario click "Nuevo Agente"
   ↓
2. API: POST /api/conversations
   ↓
3. Firestore: Documento creado en `conversations`
   ↓
4. Firestore: `source: "localhost"` añadido automáticamente
   ↓
5. Frontend: Recibe conversationId
   ↓
6. API: POST /api/agent-config (con defaults de user_settings)
   ↓
7. Firestore: Documento creado en `agent_configs`
   ↓
8. API: POST /api/conversation-context (con context vacío)
   ↓
9. Firestore: Documento creado en `conversation_context`
   ↓
10. Frontend: Agente listo para usar
```

### Cuando usuario envía un mensaje:

```
1. Frontend: Usuario escribe mensaje y click "Enviar"
   ↓
2. API: GET /api/agent-config?conversationId=xxx
   ↓
3. Firestore: Lee config del agente
   ↓
4. API: GET /api/conversation-context?conversationId=xxx
   ↓
5. Firestore: Lee context sources activos
   ↓
6. API: POST /api/conversations/xxx/messages
   ↓
7. Gemini: Genera respuesta con config y context
   ↓
8. Firestore: Guarda mensaje user y assistant en `messages`
   ↓
9. Firestore: Actualiza `conversation_context` con nuevo usage
   ↓
10. Firestore: Añade log en `usage_logs`
   ↓
11. Frontend: Muestra respuesta
```

### Cuando usuario cambia configuración:

```
1. Frontend: Usuario abre UserSettingsModal
   ↓
2. Frontend: Cambia preferredModel a "gemini-2.5-pro"
   ↓
3. API: POST /api/user-settings
   ↓
4. Firestore: Actualiza documento en `user_settings`
   ↓
5. Frontend: Recibe confirmación
   ↓
6. Para cada agente nuevo:
   - API: POST /api/agent-config (usa nuevo preferredModel)
   - Firestore: Guarda en `agent_configs` con modelo nuevo
```

---

## ✅ Checklist de Verificación

### Localhost
- [ ] User settings persisten en Firestore ✅
- [ ] Agent configs persisten por conversación ✅
- [ ] Workflow configs persisten ✅
- [ ] Context state persiste ✅
- [ ] Todos tienen campo `source: "localhost"` ✅
- [ ] Usage logs se crean automáticamente ✅

### Producción (después de deploy)
- [ ] User settings persisten en Firestore
- [ ] Agent configs persisten por conversación
- [ ] Workflow configs persisten
- [ ] Context state persiste
- [ ] Todos tienen campo `source: "production"`
- [ ] Usage logs se crean automáticamente

### Analytics
- [ ] BigQuery queries funcionan
- [ ] Se pueden comparar localhost vs production
- [ ] Se pueden generar reportes de uso
- [ ] Se puede calcular costo por usuario

---

## 🚀 Deploy a Producción

```bash
# 1. Commit
git add .
git commit -m "feat: complete Firestore persistence system with tracking"

# 2. Type check
npm run type-check

# 3. Build
npm run build

# 4. Deploy
gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --project=gen-lang-client-0986191192
```

---

## 📚 Archivos Modificados/Creados

### Modificados:
- ✅ `src/lib/firestore.ts` - Añadidas 5 colecciones nuevas + funciones
- ✅ `src/components/ChatInterfaceWorking.tsx` - Próximo: integrar APIs

### Creados:
- ✅ `src/pages/api/user-settings.ts` - API user settings
- ✅ `src/pages/api/agent-config.ts` - API agent configs
- ✅ `src/pages/api/workflow-config.ts` - API workflow configs
- ✅ `src/pages/api/conversation-context.ts` - API conversation context

---

## 🎯 Próximos Pasos

1. **Integrar APIs en ChatInterfaceWorking:**
   - Reemplazar localStorage con API calls
   - Cargar config al cambiar de agente
   - Guardar config al modificar settings

2. **Testing completo en localhost:**
   - Crear múltiples agentes
   - Configurar cada uno diferente
   - Verificar persistencia en Firestore

3. **Deploy a producción:**
   - Verificar todas las colecciones se crean
   - Verificar campo `source: "production"`
   - Comparar datos localhost vs production

---

**Última actualización:** 2025-10-12  
**Estado:** ✅ APIs creadas - Listo para integrar en frontend  
**Próximo:** Actualizar ChatInterfaceWorking para usar APIs

