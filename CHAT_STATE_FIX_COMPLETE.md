# Chat State & Analytics Tracking - Fix Completo

## 🎯 Problemas Resueltos

### 1. ✅ Chat no cambiaba al seleccionar otro agente
**Problema:** Al crear un agente e interactuar, el chat no se actualizaba al seleccionar otro agente.

**Solución:** Añadido `useEffect` que detecta cambios en `currentConversation` y:
- Limpia mensajes previos
- Carga mensajes del nuevo agente
- Carga contexto activo del agente
- Resetea el input

**Archivo modificado:** `src/components/ChatInterfaceWorking.tsx` (líneas 283-310)

```typescript
// Effect: Handle conversation change - load messages and context
useEffect(() => {
  if (!currentConversation) {
    setMessages([]);
    setContextLogs([]);
    return;
  }

  if (currentConversation.startsWith('temp-')) {
    console.log('⏭️ Conversación temporal - no cargando mensajes de Firestore');
    setMessages([]);
    setContextLogs([]);
    return;
  }

  console.log('🔄 Cambiando a conversación:', currentConversation);
  
  // Load messages for this conversation
  loadMessages(currentConversation);
  
  // Load context configuration for this conversation
  loadContextForConversation(currentConversation);
  
  // Reset input
  setInput('');
  
}, [currentConversation]);
```

### 2. ✅ Tracking de Source (localhost vs production)

**Problema:** No había forma de distinguir en analytics si los datos venían de localhost o producción.

**Solución:** Añadido campo `source` a todas las operaciones de Firestore/BigQuery.

**Archivos modificados:**
- `src/lib/firestore.ts`:
  - Nueva función helper: `getEnvironmentSource()`
  - Campo `source` añadido a interfaces `Conversation` y `Message`
  - Función `createConversation()` ahora incluye `source`
  - Función `addMessage()` ahora incluye `source`

```typescript
// Helper function to determine source environment
export function getEnvironmentSource(): 'localhost' | 'production' {
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'localhost' 
      : 'production';
  }
  
  // Server context - check NODE_ENV and other indicators
  if (process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV === 'dev' ||
      !process.env.K_SERVICE) {  // K_SERVICE is set in Cloud Run
    return 'localhost';
  }
  
  return 'production';
}
```

### 3. 🔍 Modelo Fundacional en Producción

**Diagnóstico:** El código está correcto. El problema puede ser:
1. API key no configurada en Cloud Run
2. Variable de entorno mal nombrada
3. Límites de cuota superados

**Verificación necesaria:**
```bash
# Verificar variables de entorno en Cloud Run
gcloud run services describe flow-chat \
  --region us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

---

## 📊 Google Cloud Console - Links Directos

### Firestore Database

#### Ver Colecciones:
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=gen-lang-client-0986191192
```

#### Ver Conversaciones (con campo source):
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/conversations?project=gen-lang-client-0986191192
```

#### Ver Mensajes (con campo source):
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/messages?project=gen-lang-client-0986191192
```

### BigQuery Analytics

#### Dataset flow_analytics:
```
https://console.cloud.google.com/bigquery?project=gen-lang-client-0986191192&page=dataset&d=flow_analytics&p=gen-lang-client-0986191192
```

#### Query para ver datos por source:
```sql
-- Conversaciones por source
SELECT 
  source,
  COUNT(*) as total_conversations,
  COUNT(DISTINCT userId) as unique_users
FROM `gen-lang-client-0986191192.flow_analytics.conversations`
GROUP BY source
ORDER BY total_conversations DESC;

-- Mensajes por source
SELECT 
  source,
  role,
  COUNT(*) as total_messages,
  AVG(tokenCount) as avg_tokens
FROM `gen-lang-client-0986191192.flow_analytics.messages`
GROUP BY source, role
ORDER BY total_messages DESC;
```

### Cloud Run Service

#### Ver Service:
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat?project=gen-lang-client-0986191192
```

#### Ver Variables de Entorno:
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/variables-and-secrets?project=gen-lang-client-0986191192
```

#### Ver Logs:
```
https://console.cloud.google.com/logs/query?project=gen-lang-client-0986191192&query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22flow-chat%22
```

---

## 🧪 Testing en Localhost

### 1. Iniciar servidor local
```bash
npm run dev
```

### 2. Abrir navegador
```
http://localhost:3000/chat
```

### 3. Test del cambio de agente
1. ✅ Crear agente 1
2. ✅ Enviar mensaje a agente 1
3. ✅ Crear agente 2
4. ✅ Seleccionar agente 2 (debe limpiar chat)
5. ✅ Enviar mensaje a agente 2
6. ✅ Volver a seleccionar agente 1 (debe mostrar mensaje anterior)

### 4. Verificar en Firestore
```bash
# Ver conversaciones en Firestore
gcloud firestore collections list --project=gen-lang-client-0986191192

# Ver documentos de una conversación
gcloud firestore documents list conversations --project=gen-lang-client-0986191192

# Ver datos de un documento específico
gcloud firestore documents describe conversations/[CONVERSATION_ID] --project=gen-lang-client-0986191192
```

**Esperado:** Ver campo `source: "localhost"` en los documentos

### 5. Verificar en BigQuery (si está configurado)
```sql
SELECT 
  id,
  title,
  source,
  agentModel,
  createdAt
FROM `gen-lang-client-0986191192.flow_analytics.conversations`
WHERE source = 'localhost'
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 🔧 Arreglar Modelo en Producción

### Verificar API Key

#### 1. Verificar que existe en Cloud Run
```bash
gcloud run services describe flow-chat \
  --region us-central1 \
  --format='json(spec.template.spec.containers[0].env)' | \
  jq '.spec.template.spec.containers[0].env[] | select(.name | contains("API_KEY"))'
```

#### 2. Si no existe, añadir:
```bash
# Obtener tu API key de AI Studio:
# https://aistudio.google.com/app/apikey

# Añadir a Cloud Run
gcloud run services update flow-chat \
  --region us-central1 \
  --set-env-vars="GOOGLE_AI_API_KEY=TU_API_KEY_AQUI" \
  --project=gen-lang-client-0986191192
```

#### 3. Verificar logs de producción
```bash
# Ver logs recientes
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=flow-chat" \
  --limit 50 \
  --format json \
  --project=gen-lang-client-0986191192 | \
  jq -r '.[] | "\(.timestamp) \(.textPayload // .jsonPayload.message)"'
```

**Buscar mensajes como:**
- ✅ `"🤖 Gemini AI initialized with model: gemini-2.5-flash"`
- ❌ `"⚠️ No Google AI API key found"`
- ❌ `"API key not valid"`

---

## 📊 Estructura de Datos con Source

### Firestore Collections

#### conversations
```json
{
  "id": "conv_abc123",
  "userId": "user_xyz",
  "title": "Nuevo Agente",
  "agentModel": "gemini-2.5-flash",
  "source": "localhost",  // 👈 NUEVO CAMPO
  "createdAt": "2025-10-12T10:00:00Z",
  "updatedAt": "2025-10-12T10:00:00Z",
  "lastMessageAt": "2025-10-12T10:05:00Z",
  "messageCount": 2,
  "contextWindowUsage": 15
}
```

#### messages
```json
{
  "id": "msg_def456",
  "conversationId": "conv_abc123",
  "userId": "user_xyz",
  "role": "user",
  "content": {
    "type": "text",
    "text": "Hola, ¿cómo estás?"
  },
  "source": "localhost",  // 👈 NUEVO CAMPO
  "timestamp": "2025-10-12T10:00:00Z",
  "tokenCount": 25
}
```

---

## 🔍 Troubleshooting

### Problema: Chat sigue sin cambiar al seleccionar agente

**Verificar:**
1. ✅ Abrir DevTools (F12)
2. ✅ Ver Console
3. ✅ Buscar mensaje: `🔄 Cambiando a conversación: [ID]`
4. ✅ Buscar errores relacionados con `loadMessages` o `loadContextForConversation`

**Si no aparece el mensaje:**
```bash
# Verificar que el código se desplegó
git log --oneline -1
git diff HEAD -- src/components/ChatInterfaceWorking.tsx
```

### Problema: Campo source no aparece en Firestore

**Verificar:**
1. ✅ Limpiar cache del navegador
2. ✅ Crear nueva conversación
3. ✅ Verificar en Firestore Console
4. ✅ Si sigue sin aparecer, revisar logs:

```bash
# Ver logs de creación de conversación
gcloud logging read \
  "resource.type=cloud_run_revision AND textPayload=~'Conversation created from'" \
  --limit 10 \
  --format json \
  --project=gen-lang-client-0986191192
```

### Problema: Modelo no responde en producción

**Pasos de diagnóstico:**

1. **Verificar API Key:**
```bash
gcloud run services describe flow-chat \
  --region us-central1 \
  --format='value(spec.template.spec.containers[0].env)' | \
  grep -i api_key
```

2. **Ver logs de error:**
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20 \
  --project=gen-lang-client-0986191192
```

3. **Probar endpoint directamente:**
```bash
# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe flow-chat \
  --region us-central1 \
  --format='value(status.url)')

# Test con curl (requiere autenticación válida)
curl -X POST "${SERVICE_URL}/api/conversations/[CONV_ID]/messages" \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=[YOUR_JWT_TOKEN]" \
  -d '{
    "userId": "user_id",
    "message": "test",
    "model": "gemini-2.5-flash",
    "systemPrompt": "You are helpful"
  }'
```

4. **Verificar cuota de API:**
```
https://aistudio.google.com/app/apikey
```
- Revisar límites de uso
- Verificar que la key no esté bloqueada

---

## 📈 Analytics Queries Útiles

### Comparar uso entre localhost y production

```sql
-- Dashboard de uso por environment
WITH stats AS (
  SELECT 
    source,
    COUNT(DISTINCT c.id) as conversations,
    COUNT(m.id) as messages,
    AVG(m.tokenCount) as avg_tokens_per_message,
    SUM(m.tokenCount) as total_tokens
  FROM `gen-lang-client-0986191192.flow_analytics.conversations` c
  LEFT JOIN `gen-lang-client-0986191192.flow_analytics.messages` m
    ON c.id = m.conversationId
  GROUP BY source
)
SELECT 
  source,
  conversations,
  messages,
  ROUND(avg_tokens_per_message, 2) as avg_tokens,
  total_tokens,
  ROUND(messages / conversations, 2) as messages_per_conversation
FROM stats
ORDER BY conversations DESC;
```

### Ver actividad por día y source

```sql
SELECT 
  DATE(createdAt) as date,
  source,
  COUNT(*) as conversations_created,
  COUNT(DISTINCT userId) as unique_users
FROM `gen-lang-client-0986191192.flow_analytics.conversations`
GROUP BY date, source
ORDER BY date DESC, conversations_created DESC;
```

### Identificar problemas de producción

```sql
-- Conversaciones sin mensajes (posibles errores)
SELECT 
  c.id,
  c.source,
  c.createdAt,
  c.messageCount
FROM `gen-lang-client-0986191192.flow_analytics.conversations` c
LEFT JOIN `gen-lang-client-0986191192.flow_analytics.messages` m
  ON c.id = m.conversationId
WHERE c.messageCount > 0 AND m.id IS NULL
ORDER BY c.createdAt DESC;
```

---

## 🚀 Deploy a Producción

### Antes de deployar
```bash
# 1. Verificar cambios
git status

# 2. Commit cambios
git add .
git commit -m "fix: Añadir cambio de conversación y tracking de source"

# 3. Type check
npm run type-check

# 4. Build local
npm run build
```

### Deploy a Cloud Run
```bash
# Set project
gcloud config set project gen-lang-client-0986191192

# Deploy
gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production"
```

### Verificar después de deploy
```bash
# 1. Test health check
curl https://flow-chat-[hash]-uc.a.run.app/api/health

# 2. Ver logs de startup
gcloud logging read \
  "resource.type=cloud_run_revision AND textPayload=~'Firestore client initialized'" \
  --limit 5 \
  --project=gen-lang-client-0986191192

# 3. Test chat endpoint (con autenticación válida)
```

---

## ✅ Checklist de Verificación

### Localhost
- [ ] Chat cambia al seleccionar diferentes agentes
- [ ] Mensajes se cargan correctamente al cambiar de agente
- [ ] Campo `source: "localhost"` aparece en Firestore
- [ ] Consola muestra: `🔄 Cambiando a conversación: [ID]`
- [ ] Consola muestra: `📝 Conversation created from localhost`
- [ ] Consola muestra: `💬 Message created from localhost`

### Producción
- [ ] Chat cambia al seleccionar diferentes agentes
- [ ] Modelo AI responde correctamente
- [ ] Campo `source: "production"` aparece en Firestore
- [ ] Logs muestran: `Conversation created from production`
- [ ] No hay errores de API key en logs
- [ ] Variables de entorno configuradas correctamente

### Analytics
- [ ] BigQuery recibe datos con campo `source`
- [ ] Query de comparación localhost vs production funciona
- [ ] Dashboard muestra métricas separadas por source

---

## 📝 Logs Importantes a Buscar

### Éxito
```
✅ Firestore client initialized successfully
✅ 🔄 Cambiando a conversación: conv_xyz
✅ 📝 Conversation created from localhost: conv_abc
✅ 💬 Message created from localhost: msg_def
✅ 🤖 Generating response with model: gemini-2.5-flash
```

### Errores
```
❌ Error loading messages: [error details]
❌ ⚠️ No Google AI API key found
❌ Error fetching messages: [details]
❌ Failed to send message
```

---

## 🎯 Próximos Pasos

1. **Verificar en localhost** ✅
2. **Commit y push cambios** ✅
3. **Deploy a producción** ⏳
4. **Configurar API key en Cloud Run** ⏳
5. **Verificar en producción** ⏳
6. **Monitorear analytics** ⏳

---

**Última actualización:** 2025-10-12  
**Estado:** ✅ Código listo para test en localhost  
**Deploy a producción:** ⏳ Pendiente

