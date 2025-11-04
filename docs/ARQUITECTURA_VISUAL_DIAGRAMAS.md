# 🎨 Diagramas de Arquitectura - SALFAGPT Platform

**Proyecto:** salfagpt  
**Fecha:** 2025-11-04  
**Propósito:** Visualizaciones de la arquitectura completa

---

## 📊 Diagrama 1: Arquitectura Completa del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA SALFAGPT                                  │
│                        Cliente: SALFACORP (Multi-Domain)                         │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    INTERNET
                                       │
                                       ↓
                    ┌──────────────────────────────────────┐
                    │     Google Cloud DNS                 │
                    │  salfagpt.salfagestion.cl            │
                    │  ia.salfagpt.salfagestion.cl         │
                    │         ↓                            │
                    │     A Record → 34.8.207.125          │
                    └──────────────────┬───────────────────┘
                                       ↓
        ┌──────────────────────────────────────────────────────────┐
        │           HTTPS LOAD BALANCER (Global)                   │
        │              lb-salfagpt-ft-prod                         │
        ├──────────────────────────────────────────────────────────┤
        │  Frontend:                                               │
        │  • IP: 34.8.207.125 (Global Anycast)                    │
        │  • SSL Certificate: Google-managed                       │
        │  • Hosts: salfagpt.salfagestion.cl                      │
        │            ia.salfagpt.salfagestion.cl                   │
        │                                                          │
        │  Cloud Armor (Security):                                 │
        │  • DDoS protection                                       │
        │  • Rate limiting: 1000 req/min per IP                   │
        │  • Geo-filtering (configurable)                          │
        │                                                          │
        │  Cloud CDN:                                              │
        │  • Cache static assets                                   │
        │  • Edge locations: Global                                │
        │  • TTL: Configurable per path                           │
        └──────────────────┬───────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────────────────┐
        │        Backend Service (Serverless NEG)                  │
        │           be-cr-salfagpt-ai-ft-prod                      │
        ├──────────────────────────────────────────────────────────┤
        │  Type: Serverless Network Endpoint Group                │
        │  Region: us-east4                                        │
        │  Health Check: GET / → 200 OK                           │
        │  Timeout: 30s                                            │
        └──────────────────┬───────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────────────────────────┐
        │            CLOUD RUN SERVICE                             │
        │           cr-salfagpt-ai-ft-prod                         │
        │              Region: us-east4                            │
        ├──────────────────────────────────────────────────────────┤
        │  Container Specs:                                        │
        │  • Image: gcr.io/salfagpt/salfagpt:latest               │
        │  • Port: 3000                                            │
        │  • Memory: 2 GiB                                         │
        │  • CPU: 2 vCPUs                                          │
        │  • Timeout: 300s                                         │
        │                                                          │
        │  Scaling:                                                │
        │  • Min: 1 instance (always warm)                        │
        │  • Max: 10 instances                                     │
        │  • Concurrency: 80 requests/instance                     │
        │                                                          │
        │  Service Account:                                        │
        │  82892384200-compute@developer.gserviceaccount.com       │
        │                                                          │
        │  Environment Variables:                                  │
        │  • GOOGLE_CLOUD_PROJECT=salfagpt                        │
        │  • PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl     │
        │  • NODE_ENV=production                                   │
        │  • + OAuth secrets, API keys                            │
        └──────────────────┬───────────────────────────────────────┘
                           │
        ┌──────────────────┴───────────────────────────────────────┐
        │                                                          │
        ↓                  ↓                  ↓                    ↓
┌───────────────┐  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐
│   FIRESTORE   │  │ CLOUD STORAGE │  │   BIGQUERY   │  │   VERTEX AI     │
│  (us-central1)│  │ (us-central1) │  │(us-central1) │  │  (us-central1)  │
├───────────────┤  ├───────────────┤  ├──────────────┤  ├─────────────────┤
│ Database:     │  │ Bucket:       │  │ Dataset:     │  │ Model:          │
│  (default)    │  │ salfagpt-     │  │ flow_        │  │ text-embedding  │
│               │  │ uploads       │  │ analytics    │  │ -004            │
│ Collections:  │  │               │  │              │  │                 │
│ • users       │  │ Folders:      │  │ Tables:      │  │ Purpose:        │
│ • domains ⭐  │  │ • documents/  │  │ • document_  │  │ • Embeddings    │
│ • convers...  │  │ • checkpoints │  │   embeddings │  │   generation    │
│ • messages    │  │ • temp/       │  │ • analytics  │  │ • 768-dim       │
│ • context_... │  │               │  │              │  │                 │
│ • document_   │  │ Size: ~10 GB  │  │ Size: ~5 GB  │  │ Cost: $0.00001  │
│   chunks      │  │               │  │              │  │ /1K chars       │
│               │  │ Lifecycle:    │  │ Vector Search│  │                 │
│ Total: 20     │  │ • temp/ → 7d  │  │ enabled      │  │                 │
│               │  │               │  │              │  │                 │
│ Access:       │  │ Access:       │  │ Access:      │  │ Access:         │
│ datastore.    │  │ storage.      │  │ bigquery.    │  │ Via roles/      │
│ owner         │  │ objectAdmin   │  │ dataEditor   │  │ editor          │
└───────────────┘  └───────────────┘  └──────────────┘  └─────────────────┘
        │                  │                  │                   │
        └──────────────────┴──────────────────┴───────────────────┘
                                    │
                                    ↓
                    ┌───────────────────────────────┐
                    │      EXTERNAL SERVICES        │
                    ├───────────────────────────────┤
                    │  • Gemini AI API              │
                    │    - gemini-2.5-flash         │
                    │    - gemini-2.5-pro           │
                    │    - API Key auth             │
                    │                               │
                    │  • Google OAuth 2.0           │
                    │    - accounts.google.com      │
                    │    - User authentication      │
                    └───────────────────────────────┘
```

**Notas del Diagrama:**
- Líneas sólidas: Data flow principal
- ⭐ Indica servicios críticos para multi-domain
- Todas las regiones en `us-central1` excepto Cloud Run (us-east4)

---

## 📊 Diagrama 2: Flujo de Autenticación OAuth

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUJO DE AUTENTICACIÓN OAUTH 2.0                        │
│                     Multi-Domain Support (SALFACORP)                        │
└─────────────────────────────────────────────────────────────────────────────┘

Usuario (Browser)                 SALFAGPT App              Google OAuth        Firestore
      │                                 │                         │                 │
      │  1. GET /auth/login             │                         │                 │
      ├────────────────────────────────>│                         │                 │
      │                                 │                         │                 │
      │  2. Redirect to Google          │                         │                 │
      │<────────────────────────────────┤                         │                 │
      │     OAuth consent URL           │                         │                 │
      │                                 │                         │                 │
      │  3. Show consent screen          │                         │                 │
      ├─────────────────────────────────┴────────────────────────>│                 │
      │     (user authorizes)           │                         │                 │
      │                                 │                         │                 │
      │  4. Redirect with code          │                         │                 │
      │<────────────────────────────────┴─────────────────────────┤                 │
      │     /auth/callback?code=xyz     │                         │                 │
      │                                 │                         │                 │
      │  5. Exchange code for user info │                         │                 │
      ├────────────────────────────────>│                         │                 │
      │                                 │  6. Exchange code       │                 │
      │                                 ├────────────────────────>│                 │
      │                                 │                         │                 │
      │                                 │  7. User profile        │                 │
      │                                 │<────────────────────────┤                 │
      │                                 │   { email, name, ... }  │                 │
      │                                 │                         │                 │
      │                                 │  8. Extract domain from email             │
      │                                 │     (e.g., getaifactory.com)              │
      │                                 │                         │                 │
      │                                 │  9. Check domain access │                 │
      │                                 ├─────────────────────────┴────────────────>│
      │                                 │     Query: domains/{domainName}           │
      │                                 │                         │                 │
      │                                 │  10. Domain document    │                 │
      │                                 │<──────────────────────────────────────────┤
      │                                 │     { enabled: true/false }               │
      │                                 │                         │                 │
      │                                 │  11. If enabled → Create/Update user      │
      │                                 ├─────────────────────────┴────────────────>│
      │                                 │     users/{userId}      │                 │
      │                                 │                         │                 │
      │                                 │  12. Generate JWT       │                 │
      │                                 │     (with userId, role) │                 │
      │                                 │                         │                 │
      │  13. Set session cookie + Redir │                         │                 │
      │<────────────────────────────────┤                         │                 │
      │     Cookie: flow_session        │                         │                 │
      │     Redirect: /chat             │                         │                 │
      │                                 │                         │                 │
      │  14. Access /chat               │                         │                 │
      ├────────────────────────────────>│                         │                 │
      │                                 │  15. Verify JWT         │                 │
      │                                 │     Decode session      │                 │
      │                                 │                         │                 │
      │  16. Render chat UI             │                         │                 │
      │<────────────────────────────────┤                         │                 │
      │     (authenticated)             │                         │                 │
      │                                 │                         │                 │

CASOS DE ERROR:

Si dominio no habilitado (enabled: false):
│                                 │  Domain check fails     │                 │
│                                 │                         │                 │
│  Error: "Dominio no habilitado" │                         │                 │
│<────────────────────────────────┤                         │                 │
│                                 │                         │                 │

Si dominio no existe en Firestore:
│                                 │  Domain not found       │                 │
│                                 │                         │                 │
│  Error: "Dominio no encontrado" │                         │                 │
│<────────────────────────────────┤                         │                 │
```

**OAuth Client Configuration:**
- Client ID: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
- Redirect URIs configurados para:
  - localhost (desarrollo)
  - Cloud Run direct URL
  - Custom domain (producción)

---

## 📊 Diagrama 3: Arquitectura de Datos (Multi-Domain)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE DATOS                                    │
│                     Multi-Domain Data Isolation                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                                  FIRESTORE
                              Database: (default)
                              Region: us-central1
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ↓                             ↓                             ↓
┌──────────────────┐      ┌──────────────────┐        ┌──────────────────┐
│    DOMAINS       │      │      USERS       │        │  CONVERSATIONS   │
│   Collection     │      │   Collection     │        │   Collection     │
├──────────────────┤      ├──────────────────┤        ├──────────────────┤
│ {domainName}     │      │ {userId}         │        │ {conversationId} │
│ ├─ enabled: bool │      │ ├─ email         │        │ ├─ userId        │
│ ├─ allowedDomains│      │ ├─ domain ⭐     │        │ ├─ title         │
│ ├─ settings      │      │ ├─ role          │        │ ├─ model         │
│ └─ createdAt     │      │ └─ permissions   │        │ └─ context       │
│                  │      │                  │        │                  │
│ Examples:        │      │ Filtered by:     │        │ Filtered by:     │
│ getaifactory.com │      │ • email domain   │        │ • userId         │
│ salfacloud.cl    │      │ • domain enabled │        │                  │
│ salfacorp.cl     │      │                  │        │                  │
└──────────────────┘      └──────────────────┘        └──────────────────┘
        ⭐                         │                             │
   GATE KEEPER                     │                             │
   Controls who                    ↓                             ↓
   can login              ┌──────────────────┐        ┌──────────────────┐
                          │    MESSAGES      │        │ CONTEXT_SOURCES  │
                          │   Collection     │        │   Collection     │
                          ├──────────────────┤        ├──────────────────┤
                          │ {messageId}      │        │ {sourceId}       │
                          │ ├─ conversationId│        │ ├─ userId        │
                          │ ├─ userId        │        │ ├─ type          │
                          │ ├─ role          │        │ ├─ extractedData │
                          │ ├─ content       │        │ └─ assignedTo    │
                          │ └─ timestamp     │        │    Agents[]      │
                          │                  │        │                  │
                          │ Filtered by:     │        │ Filtered by:     │
                          │ • conversationId │        │ • userId         │
                          │ • userId         │        │ • agentId        │
                          └──────────────────┘        └──────────────────┘
                                   │                             │
                                   └──────────────┬──────────────┘
                                                  ↓
                                  ┌──────────────────────────────┐
                                  │      DOCUMENT_CHUNKS         │
                                  │      (RAG Storage)           │
                                  ├──────────────────────────────┤
                                  │ {chunkId}                    │
                                  │ ├─ sourceId                  │
                                  │ ├─ userId                    │
                                  │ ├─ text                      │
                                  │ ├─ embedding (in BigQuery)   │
                                  │ └─ chunkIndex                │
                                  │                              │
                                  │ ~3,000+ chunks               │
                                  │ Synced to BigQuery           │
                                  └──────────────────────────────┘
                                                  │
                                                  ↓
                                  ┌──────────────────────────────┐
                                  │         BIGQUERY             │
                                  │  Dataset: flow_analytics     │
                                  ├──────────────────────────────┤
                                  │ • document_embeddings        │
                                  │   - Vector search (768-dim)  │
                                  │   - Cosine similarity        │
                                  │   - Filtered by userId       │
                                  │                              │
                                  │ • conversations (analytics)  │
                                  │ • messages (analytics)       │
                                  │ • context_usage              │
                                  │ • daily_metrics              │
                                  └──────────────────────────────┘
```

**Aislamiento de Datos:**
- ✅ Cada dominio tiene su documento en `domains`
- ✅ Cada usuario solo ve su propio data (filtrado por `userId`)
- ✅ Cada agente tiene su propio contexto (assignedToAgents)
- ✅ Vector search filtra por `userId`

---

## 📊 Diagrama 4: Flujo de Request (Ciclo Completo)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         REQUEST LIFECYCLE                                        │
│              De Usuario a AI Response (con RAG)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Usuario escribe: "¿Cuál es la política de vacaciones?"

1. FRONTEND
   │
   └─> POST /api/conversations/{id}/messages
       Body: {
         userId: "123",
         message: "¿Cuál es la política de vacaciones?",
         model: "gemini-2.5-flash",
         systemPrompt: "Eres un asistente...",
         activeContextSourceIds: ["pdf-1", "pdf-2"]
       }

2. LOAD BALANCER (34.8.207.125)
   │
   ├─> Cloud Armor: Check rate limit (OK)
   ├─> Cloud CDN: Check cache (MISS - API not cached)
   └─> Route to Backend Service

3. CLOUD RUN (cr-salfagpt-ai-ft-prod)
   │
   ├─> API Route: /api/conversations/[id]/messages.ts
   │   │
   │   ├─> 1. Authenticate user (verify JWT)
   │   │   └─> getSession({ cookies }) ✅
   │   │
   │   ├─> 2. Verify conversation ownership
   │   │   └─> conversation.userId === session.id ✅
   │   │
   │   ├─> 3. Load active context sources
   │   │   └─> Firestore query: context_sources
   │   │       WHERE userId == session.id
   │   │       AND id IN activeContextSourceIds
   │   │
   │   ├─> 4. Load conversation history
   │   │   └─> Firestore query: messages
   │   │       WHERE conversationId == id
   │   │       ORDER BY timestamp ASC
   │   │       LIMIT 20 (last 20 messages)
   │   │
   │   ├─> 5. RAG: Generate query embedding
   │   │   │
   │   │   └─> VERTEX AI (us-central1)
   │   │       Model: text-embedding-004
   │   │       Input: "¿Cuál es la política de vacaciones?"
   │   │       Output: [0.123, -0.456, ...] (768 dims)
   │   │       Latency: ~200ms
   │   │
   │   ├─> 6. RAG: Vector similarity search
   │   │   │
   │   │   └─> BIGQUERY (us-central1)
   │   │       Query: SELECT text, cosine_similarity
   │   │              FROM document_embeddings
   │   │              WHERE user_id = "123"
   │   │              AND source_id IN ("pdf-1", "pdf-2")
   │   │              ORDER BY DISTANCE(embedding, query_vector)
   │   │              LIMIT 5
   │   │       
   │   │       Results: 5 most relevant chunks
   │   │       Latency: ~300ms
   │   │
   │   ├─> 7. Build AI prompt
   │   │   Context sections:
   │   │   • System instruction (from systemPrompt)
   │   │   • Conversation history (last 20 messages)
   │   │   • RAG results (5 chunks de documentos)
   │   │   • User message
   │   │   
   │   │   Total tokens: ~15,000 input
   │   │
   │   ├─> 8. Call Gemini AI
   │   │   │
   │   │   └─> GEMINI API (External)
   │   │       Model: gemini-2.5-flash
   │   │       Input tokens: 15,000
   │   │       Output tokens: ~500
   │   │       Latency: ~2s (first token ~800ms)
   │   │       Cost: $0.0011 + $0.00015 = $0.00125
   │   │
   │   ├─> 9. Save user message to Firestore
   │   │   └─> FIRESTORE: messages collection
   │   │       { conversationId, role: "user", content, timestamp }
   │   │
   │   ├─> 10. Save AI response to Firestore
   │   │   └─> FIRESTORE: messages collection
   │   │       { conversationId, role: "assistant", content, timestamp }
   │   │
   │   ├─> 11. Update conversation metadata
   │   │   └─> FIRESTORE: conversations collection
   │   │       { messageCount++, lastMessageAt, contextWindowUsage }
   │   │
   │   └─> 12. Return response to frontend
   │       {
   │         userMessage: {...},
   │         assistantMessage: {...},
   │         tokenStats: {
   │           inputTokens: 15000,
   │           outputTokens: 500,
   │           contextWindowUsed: 15500,
   │           cost: 0.00125
   │         }
   │       }
   │
   └─> Load Balancer returns response

4. FRONTEND
   │
   ├─> Update messages state
   ├─> Display AI response (with markdown rendering)
   ├─> Log context usage
   └─> Scroll to bottom

Total Latency:
• Load Balancer: ~50ms
• Cloud Run (API logic): ~100ms
• Vertex AI (embedding): ~200ms
• BigQuery (vector search): ~300ms
• Gemini AI (response): ~2000ms
• Firestore writes: ~200ms
• Response to user: ~50ms
─────────────────────────────────
TOTAL: ~2.9s (p95)

First token to user: ~1.2s (streaming)
```

---

## 📊 Diagrama 5: Arquitectura de Storage

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     CLOUD STORAGE ARCHITECTURE                                   │
│                        Bucket: salfagpt-uploads                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                            gs://salfagpt-uploads/
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
                ↓                     ↓                     ↓
        documents/              checkpoints/            temp/
        (Permanent)             (State files)         (Auto-delete 7d)
             │                       │                      │
    ┌────────┴────────┐      ┌──────┴──────┐       ┌──────┴──────┐
    │                 │      │             │       │             │
    ↓                 ↓      ↓             ↓       ↓             ↓
┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
│  PDFs      │  │  Office    │  │ Extraction   │  │  Upload      │
│            │  │  Docs      │  │ State        │  │  Staging     │
├────────────┤  ├────────────┤  ├──────────────┤  ├──────────────┤
│ 173012...  │  │ 173012...  │  │ extract-abc- │  │ tmp-xyz.pdf  │
│ -manual.pdf│  │ -report.   │  │ chunk-5.json │  │              │
│            │  │ xlsx       │  │              │  │ Auto-deleted │
│ Size: 5MB  │  │            │  │ Checkpoint   │  │ after 7 days │
│ Retention: │  │ Size: 2MB  │  │ for resume   │  │              │
│ Permanent  │  │            │  │              │  │              │
└────────────┘  └────────────┘  └──────────────┘  └──────────────┘
      │               │                 │                  │
      └───────────────┴─────────────────┴──────────────────┘
                              │
                              ↓
                    ┌─────────────────────┐
                    │  Storage Lifecycle  │
                    ├─────────────────────┤
                    │ Rule 1:             │
                    │ • Path: temp/*      │
                    │ • Action: Delete    │
                    │ • Condition: Age 7d │
                    │                     │
                    │ Rule 2: (Futuro)    │
                    │ • Path: documents/* │
                    │ • Action: Archive   │
                    │ • Condition: Age 1y │
                    └─────────────────────┘

Naming Convention:
  {timestamp}-{original-filename}
  
  Example:
  1730749200000-Manual_Usuario_v2.pdf
  
  Timestamp: Unix ms (sortable, unique)
  Filename: Sanitized (remove spaces, special chars)

Access Control:
  • Bucket: Uniform bucket-level access
  • Public: Blocked (allUsers denied)
  • Service Account: roles/storage.objectAdmin
  • Signed URLs: For temporary public access (future)

Costs:
  • Storage: $0.020/GB/month (Standard class)
  • Operations: $0.05/10K class A, $0.004/10K class B
  • Egress: $0.12/GB (to internet)
  
  Estimated monthly:
  • Storage (10 GB): $0.20
  • Operations (10K): $0.05
  • Total: ~$0.25/month
```

---

## 📊 Diagrama 6: Security Layers (Defense in Depth)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                                       │
│                     Multiple Layers of Defense                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

Request: GET /api/conversations?userId=123

Layer 1: NETWORK (Load Balancer + Cloud Armor)
├─> Rate limiting: 1000 req/min per IP ✅
├─> DDoS protection: Automatic ✅
├─> Geo-blocking: Configurable
└─> WAF rules: Custom patterns
        │
        ↓ PASS
        │
Layer 2: TRANSPORT (SSL/TLS)
├─> Certificate: Google-managed ✅
├─> Protocol: TLS 1.2+ ✅
├─> Cipher suites: Strong only ✅
└─> HSTS: Enabled
        │
        ↓ PASS
        │
Layer 3: APPLICATION (Cloud Run)
├─> Container isolation ✅
├─> Read-only filesystem ✅
├─> Non-root user ✅
└─> Resource limits (CPU, Memory)
        │
        ↓ PASS
        │
Layer 4: AUTHENTICATION (JWT + OAuth)
├─> Cookie: httpOnly, secure ✅
├─> JWT: Signed with secret ✅
├─> Expiration: 7 days max ✅
└─> OAuth: Google-verified ✅
        │
        ↓ session.id = "123" ✅
        │
Layer 5: AUTHORIZATION (Ownership)
├─> Check: session.id === requestedUserId
├─> Result: "123" === "123" ✅
└─> Domain check: domain enabled ✅
        │
        ↓ AUTHORIZED ✅
        │
Layer 6: DATA ACCESS (Firestore)
├─> Query filters by userId ✅
├─> Security Rules enforce isolation ✅
├─> IAM permissions verified ✅
└─> Audit logging enabled ✅
        │
        ↓ DATA RETURNED
        │
Layer 7: RESPONSE (Sanitization)
├─> Remove sensitive fields ✅
├─> Escape HTML/XSS ✅
├─> Rate info redacted ✅
└─> Return to user
        │
        ↓
    User receives only THEIR data ✅

If ANY layer fails → Request DENIED
```

**Security Principles:**
1. **Zero Trust:** Verify at every layer
2. **Least Privilege:** Minimal permissions required
3. **Defense in Depth:** Multiple layers
4. **Audit Everything:** All access logged

---

## 📊 Diagrama 7: Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT PIPELINE                                      │
│                  Manual Deploy (gcloud CLI)                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

Developer Machine (alec@salfacloud.cl)
      │
      │  1. Code changes
      ↓
┌──────────────────────────────────┐
│   Local Development              │
│   cd /Users/alec/salfagpt        │
├──────────────────────────────────┤
│ • npm run type-check             │
│ • npm run build                  │
│ • git commit                     │
│ • git push origin main           │
└──────────┬───────────────────────┘
           │
           │  2. Deploy command
           ↓
┌──────────────────────────────────┐
│   gcloud CLI                     │
│   (authenticated as alec@...)    │
├──────────────────────────────────┤
│ gcloud run deploy \              │
│   cr-salfagpt-ai-ft-prod \       │
│   --source . \                   │
│   --region=us-east4 \            │
│   --project=salfagpt             │
└──────────┬───────────────────────┘
           │
           │  3. Trigger build
           ↓
┌──────────────────────────────────────┐
│   CLOUD BUILD (Automatic)            │
│   Region: us-east4                   │
├──────────────────────────────────────┤
│ Steps:                               │
│ 1. Create build context              │
│    └─> Upload source to GCS          │
│                                      │
│ 2. Build Docker image                │
│    ├─> FROM node:20-alpine           │
│    ├─> COPY package*.json            │
│    ├─> RUN npm ci                    │
│    ├─> COPY . .                      │
│    ├─> RUN npm run build             │
│    └─> EXPOSE 3000                   │
│                                      │
│ 3. Tag image                         │
│    └─> gcr.io/salfagpt/salfagpt:    │
│        latest                         │
│        sha-abc123                     │
│                                      │
│ Duration: ~5 minutes                 │
└──────────┬───────────────────────────┘
           │
           │  4. Push to registry
           ↓
┌──────────────────────────────────────┐
│   ARTIFACT REGISTRY                  │
│   gcr.io/salfagpt                    │
├──────────────────────────────────────┤
│ Images:                              │
│ • salfagpt:latest                    │
│ • salfagpt:sha-abc123                │
│ • ... (historical versions)          │
│                                      │
│ Retention: 30 days (untagged)        │
│ Size: ~500 MB per image              │
└──────────┬───────────────────────────┘
           │
           │  5. Deploy to Cloud Run
           ↓
┌──────────────────────────────────────────┐
│   CLOUD RUN DEPLOYMENT                   │
│   Service: cr-salfagpt-ai-ft-prod        │
│   Region: us-east4                       │
├──────────────────────────────────────────┤
│ 1. Create new revision                   │
│    └─> cr-salfagpt-ai-ft-prod-00037-xyz │
│                                          │
│ 2. Health check new revision             │
│    └─> GET / → 200 OK ✅                │
│                                          │
│ 3. Blue/Green deployment                 │
│    ├─> 00036 (old): 100% traffic        │
│    ├─> 00037 (new): 0% traffic          │
│    └─> Gradual migration:                │
│        00036: 100% → 50% → 0%            │
│        00037: 0% → 50% → 100%            │
│                                          │
│ 4. Traffic switched to new revision      │
│    └─> All traffic → 00037 ✅           │
│                                          │
│ 5. Old revision kept (rollback)          │
│    └─> Can revert if issues              │
│                                          │
│ Duration: ~3 minutes                     │
└──────────────────────────────────────────┘
           │
           │  6. Verification
           ↓
┌──────────────────────────────────────────┐
│   POST-DEPLOYMENT CHECKS                 │
├──────────────────────────────────────────┤
│ ✅ Health check                          │
│    curl /api/health/firestore            │
│                                          │
│ ✅ Login test                            │
│    open /auth/login                      │
│                                          │
│ ✅ Feature smoke test                    │
│    • Create conversation                 │
│    • Send message                        │
│    • Upload document                     │
│                                          │
│ ✅ Logs check                            │
│    No errors in last 20 logs             │
│                                          │
│ ✅ Metrics check                         │
│    Latency < 3s (p95)                    │
└──────────────────────────────────────────┘
           │
           ↓
    DEPLOYMENT COMPLETE ✅
    
Total Time: ~8-12 minutes
Downtime: 0 seconds (rolling update)
```

---

## 📊 Diagrama 8: Multi-Domain Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MULTI-DOMAIN ARCHITECTURE                                   │
│              SALFACORP Platform - Multiple Client Domains                        │
└─────────────────────────────────────────────────────────────────────────────────┘

                              SINGLE DEPLOYMENT
                         cr-salfagpt-ai-ft-prod
                         https://salfagpt.salfagestion.cl
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ↓                         ↓                         ↓
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │   DOMAIN 1   │        │   DOMAIN 2   │        │   DOMAIN 3   │
    │ getaifactory │        │ salfacloud   │        │ salfacorp    │
    │    .com      │        │    .cl       │        │    .cl       │
    ├──────────────┤        ├──────────────┤        ├──────────────┤
    │ enabled: true│        │ enabled: true│        │enabled: false│
    │ users: 3     │        │ users: 2     │        │ users: 0     │
    │ agents: 45   │        │ agents: 12   │        │ (disabled)   │
    └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
           │                       │                       │
           ↓                       ↓                       ↓
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │ USERS        │        │ USERS        │        │ NO ACCESS    │
    ├──────────────┤        ├──────────────┤        ├──────────────┤
    │ alec@get...  │        │ admin@salfa..│        │ user@salfa...│
    │ hello@get... │        │ user@salfa...│        │ → Login      │
    │ test@get...  │        │              │        │   BLOCKED ❌ │
    └──────┬───────┘        └──────┬───────┘        └──────────────┘
           │                       │
           ↓                       ↓
    ┌─────────────────────────────────────────┐
    │      COMPLETE DATA ISOLATION            │
    ├─────────────────────────────────────────┤
    │                                         │
    │  getaifactory.com users:                │
    │  • See only their conversations         │
    │  • See only their context sources       │
    │  • Cannot access salfacloud.cl data     │
    │                                         │
    │  salfacloud.cl users:                   │
    │  • See only their conversations         │
    │  • See only their context sources       │
    │  • Cannot access getaifactory.com data  │
    │                                         │
    │  Enforcement:                           │
    │  • Firestore queries: WHERE userId = X  │
    │  • API endpoints: Verify ownership      │
    │  • Security rules: Enforce isolation    │
    │                                         │
    └─────────────────────────────────────────┘

DOMAIN VERIFICACIÓN FLOW:

1. User attempts login: user@getaifactory.com
   ↓
2. OAuth returns: { email: "user@getaifactory.com", ... }
   ↓
3. Extract domain: "getaifactory.com"
   ↓
4. Firestore query: domains/getaifactory.com
   ↓
5. Check: domain.enabled === true ✅
   ↓
6. Create/update user with domain field
   ↓
7. Generate JWT + Set session cookie
   ↓
8. User logged in ✅

If domain.enabled === false or domain not found:
   ↓
   Return error: "Dominio no habilitado" ❌
```

---

## 📊 Diagrama 9: Document Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT EXTRACTION PIPELINE                                  │
│                         PDF → Text → Chunks → Embeddings                         │
└─────────────────────────────────────────────────────────────────────────────────┘

User uploads: manual-usuario.pdf (150 pages, 25 MB)

1. UPLOAD TO CLOUD STORAGE
   │
   └─> POST /api/extract-document
       Multipart form data: file + metadata
       │
       ↓
   ┌────────────────────────────────┐
   │  Cloud Storage                 │
   │  gs://salfagpt-uploads/        │
   │  documents/1730749200-manual.  │
   │  pdf                           │
   └────────┬───────────────────────┘
            │
            │  2. Chunked extraction
            ↓
   ┌────────────────────────────────────────┐
   │  Chunked Extraction Process            │
   │  (src/lib/chunked-extraction.ts)       │
   ├────────────────────────────────────────┤
   │ Configuration:                         │
   │ • Chunk size: 20 pages                 │
   │ • Model: gemini-2.5-flash              │
   │ • Max output: 50,000 tokens/chunk      │
   │                                        │
   │ Process:                               │
   │ For each chunk (7 chunks total):       │
   │   ├─> Extract pages 1-20               │
   │   ├─> Call Gemini AI                   │
   │   ├─> Save checkpoint to GCS           │
   │   ├─> Update progress: 14%             │
   │   └─> Continue...                      │
   │                                        │
   │ Checkpoint files:                      │
   │ gs://salfagpt-uploads/checkpoints/     │
   │   extraction-abc123-chunk-0.json       │
   │   extraction-abc123-chunk-1.json       │
   │   ... (resumable if fails)             │
   │                                        │
   │ Duration: ~3-5 minutes                 │
   │ Cost: ~$0.05 (Flash model)             │
   └────────┬───────────────────────────────┘
            │
            │  3. Combine results
            ↓
   ┌────────────────────────────────────────┐
   │  Full Extracted Text                   │
   │  ~250,000 characters                   │
   │  ~50,000 tokens                        │
   └────────┬───────────────────────────────┘
            │
            │  4. Save to Firestore
            ↓
   ┌────────────────────────────────────────┐
   │  Firestore: context_sources            │
   │  {                                     │
   │    id: "source-abc123",                │
   │    userId: "123",                      │
   │    name: "manual-usuario.pdf",         │
   │    type: "pdf",                        │
   │    extractedData: "...",               │
   │    metadata: {                         │
   │      pageCount: 150,                   │
   │      model: "gemini-2.5-flash",        │
   │      extractionTime: 180000, // 3min   │
   │      charactersExtracted: 250000       │
   │    }                                   │
   │  }                                     │
   └────────┬───────────────────────────────┘
            │
            │  5. Split into chunks
            ↓
   ┌────────────────────────────────────────┐
   │  Text Chunking                         │
   │  (Every ~1000 words)                   │
   ├────────────────────────────────────────┤
   │ • Chunk 0: "Capítulo 1..."             │
   │ • Chunk 1: "Sección 2.1..."            │
   │ • Chunk 2: "Tabla 3..."                │
   │ • ... (250 chunks total)               │
   │                                        │
   │ Save to Firestore:                     │
   │ document_chunks collection             │
   └────────┬───────────────────────────────┘
            │
            │  6. Generate embeddings
            ↓
   ┌────────────────────────────────────────┐
   │  Vertex AI Embedding Generation        │
   │  (Batch processing)                    │
   ├────────────────────────────────────────┤
   │ For each chunk:                        │
   │   ├─> Call text-embedding-004          │
   │   ├─> Input: chunk text (~1000 words)  │
   │   ├─> Output: vector[768]              │
   │   └─> Store in BigQuery                │
   │                                        │
   │ Progress: 1/250 → 250/250              │
   │ Duration: ~2-3 minutes                 │
   │ Cost: ~$0.002 (250 chunks)             │
   └────────┬───────────────────────────────┘
            │
            │  7. Sync to BigQuery
            ↓
   ┌────────────────────────────────────────┐
   │  BigQuery: document_embeddings         │
   │  (Vector search ready)                 │
   ├────────────────────────────────────────┤
   │ chunk_id | text | embedding[768] | ..  │
   │ ─────────────────────────────────────  │
   │ chunk-0  | ...  | [0.12, -0.45, ...]   │
   │ chunk-1  | ...  | [0.34, 0.22, ...]    │
   │ ... (250 rows)                         │
   │                                        │
   │ Ready for vector similarity search ✅  │
   └────────────────────────────────────────┘
            │
            ↓
        EXTRACTION COMPLETE
        Total time: ~8-10 minutes
        Total cost: ~$0.052
        
        User can now:
        ✅ Toggle source ON for agent
        ✅ RAG search will find relevant chunks
        ✅ AI responses use document context
```

---

## 📊 Diagrama 10: Monitoring y Observability

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY STACK                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                        Production Application
                     cr-salfagpt-ai-ft-prod (us-east4)
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ↓                         ↓                         ↓
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  CLOUD LOGGING   │   │  CLOUD MONITORING│   │   ERROR REPORTING│
│  (Automatic)     │   │  (Metrics)       │   │   (Errors)       │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Log Types:       │   │ Metrics:         │   │ Error Types:     │
│ • Request logs   │   │ • Request count  │   │ • 500 errors     │
│ • Application    │   │ • Latency (p50,  │   │ • Exceptions     │
│   logs           │   │   p95, p99)      │   │ • Crashes        │
│ • Error logs     │   │ • CPU usage      │   │ • Timeouts       │
│ • Security logs  │   │ • Memory usage   │   │                  │
│                  │   │ • Instance count │   │ Grouping:        │
│ Retention:       │   │ • Error rate     │   │ • By error type  │
│ • 30 days default│   │ • Success rate   │   │ • By stack trace │
│ • Exportable to  │   │                  │   │ • By user agent  │
│   BigQuery       │   │ Dashboards:      │   │                  │
│                  │   │ • Overview       │   │ Alerts:          │
│ Search:          │   │ • Performance    │   │ • Error spike    │
│ • By severity    │   │ • Costs          │   │ • New errors     │
│ • By timestamp   │   │                  │   │                  │
│ • By user        │   │ Alerts:          │   │                  │
│ • By resource    │   │ • Latency > 3s   │   │                  │
│                  │   │ • Error rate >1% │   │                  │
│                  │   │ • CPU > 70%      │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                                ↓
                    ┌───────────────────────┐
                    │   ALERTING CHANNELS   │
                    ├───────────────────────┤
                    │ • Email (alec@...)    │
                    │ • Slack (future)      │
                    │ • PagerDuty (future)  │
                    │ • SMS (future)        │
                    └───────────────────────┘

Manual Monitoring (Current):
┌────────────────────────────────────────┐
│ Daily:                                 │
│ • Check GCP console for errors         │
│ • Review request count trends          │
│ • Check latency metrics                │
│                                        │
│ Weekly:                                │
│ • Review cost reports                  │
│ • Analyze performance trends           │
│ • Check for anomalies                  │
└────────────────────────────────────────┘

Automated Monitoring (TODO):
┌────────────────────────────────────────┐
│ Uptime Checks:                         │
│ • /api/health/firestore every 60s      │
│ • Alert if 3 consecutive failures      │
│                                        │
│ Alerting Policies:                     │
│ • Error rate > 5% for 5 min            │
│ • Latency p95 > 3s for 5 min           │
│ • Memory > 80% for 5 min               │
│ • CPU > 70% sustained 10 min           │
│                                        │
│ Notifications:                         │
│ • Email to alec@salfacloud.cl          │
│ • Include: metric, threshold, graph    │
│ • Include: direct link to logs         │
└────────────────────────────────────────┘
```

---

## 📊 Diagrama 11: Cost Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MONTHLY COST BREAKDOWN                                  │
│                        Estimate: $48-97 USD/month                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Cloud Run: $15-25/month                                       │
├────────────────────────────────────────────────────────────────┤
│  Cost Model:                                                   │
│  • CPU: $0.00002400/vCPU-second                               │
│  • Memory: $0.00000250/GiB-second                             │
│  • Requests: $0.40/million                                     │
│                                                               │
│  With min-instances=1:                                        │
│  • Base: ~$17/month (always running)                          │
│  • + Traffic: ~$3-8/month (1M requests)                       │
│                                                               │
│  Optimization:                                                │
│  • Set min-instances=0 → Save $17 (accept cold starts)       │
│  • Use committed use → Save 30%                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Load Balancer: $18-22/month                                   │
├────────────────────────────────────────────────────────────────┤
│  Cost Model:                                                   │
│  • Forwarding rules: $18/month (flat)                         │
│  • Traffic: $0.008-0.012/GB                                    │
│                                                               │
│  With 100 GB/month:                                           │
│  • Base: $18                                                  │
│  • Traffic: $0.80-1.20                                        │
│  • Total: ~$19-20/month                                       │
│                                                               │
│  Note: Required for custom domain with SSL                    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Firestore: $5-10/month                                        │
├────────────────────────────────────────────────────────────────┤
│  Cost Model:                                                   │
│  • Reads: $0.06/100K documents                                │
│  • Writes: $0.18/100K documents                               │
│  • Storage: $0.18/GB/month                                    │
│                                                               │
│  With typical usage:                                          │
│  • 100K reads: $0.06                                          │
│  • 50K writes: $0.09                                          │
│  • 1 GB storage: $0.18                                        │
│  • Total: ~$0.33/month                                        │
│                                                               │
│  Real cost (with overhead): $5-10/month                       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Cloud Storage: $2-5/month                                     │
├────────────────────────────────────────────────────────────────┤
│  • Storage (10 GB): $0.20                                     │
│  • Class A ops (10K): $0.05                                   │
│  • Class B ops (100K): $0.04                                  │
│  • Egress (50 GB): $6.00                                      │
│  • Total: ~$2-5/month                                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  BigQuery: $5-10/month                                         │
├────────────────────────────────────────────────────────────────┤
│  • Storage (10 GB): $0.20                                     │
│  • Queries (100 GB): $5.00                                    │
│  • Streaming inserts: $0.05                                   │
│  • Total: ~$5-10/month                                        │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Gemini AI: $1.35/month                                        │
├────────────────────────────────────────────────────────────────┤
│  Flash (90% of usage):                                        │
│  • Input (10M tokens): $0.75                                  │
│  • Output (2M tokens): $0.60                                  │
│  Total: $1.35/month                                           │
│                                                               │
│  Pro (10% of usage): Add ~$1.50/month                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Vertex AI Embeddings: $1-2/month                              │
├────────────────────────────────────────────────────────────────┤
│  • 1M characters/month: $0.00001/char                         │
│  • Total: ~$1-2/month                                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Other Services: $1/month                                      │
├────────────────────────────────────────────────────────────────┤
│  • Cloud Logging: $0.50                                       │
│  • Secret Manager: $0.30                                      │
│  • Cloud Build: $0.20 (120 min/month free tier)              │
│  • Total: ~$1/month                                           │
└────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
  TOTAL MONTHLY COST: $48-77 USD/month
═══════════════════════════════════════════════════════════════

Cost Optimization Opportunities:
1. Set min-instances=0 → Save $17/month (accept cold starts)
2. Use Flash only (avoid Pro) → Save ~$1.50/month
3. Implement aggressive caching → Reduce Cloud Run requests by 30%
4. Committed use discounts → Save 30% on Cloud Run
5. Lifecycle policies on Storage → Save $1-2/month

Potential savings: $15-25/month → Total: $33-52/month
```

---

## 📊 Diagrama 12: Local Development Setup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      LOCAL DEVELOPMENT ARCHITECTURE                              │
│                     Developer: alec@salfacloud.cl                                │
└─────────────────────────────────────────────────────────────────────────────────┘

Developer Machine: /Users/alec/salfagpt
      │
      │  Setup (one-time)
      ↓
┌──────────────────────────────────────┐
│  Authentication Setup                │
├──────────────────────────────────────┤
│ 1. gcloud auth login                 │
│    → Select: alec@salfacloud.cl      │
│                                      │
│ 2. gcloud auth application-default   │
│    login                             │
│    → Creates ADC file:               │
│    ~/.config/gcloud/                 │
│    application_default_credentials.  │
│    json                              │
│                                      │
│ 3. gcloud config set project        │
│    salfagpt                          │
└──────────┬───────────────────────────┘
           │
           │  Development
           ↓
┌──────────────────────────────────────────┐
│  Local Dev Server                        │
│  http://localhost:3000                   │
├──────────────────────────────────────────┤
│ • npm run dev                            │
│ • Astro server on port 3000              │
│ • Hot reload enabled                     │
│ • Source maps enabled                    │
│                                          │
│ Environment (.env file):                 │
│ • GOOGLE_CLOUD_PROJECT=salfagpt          │
│ • PUBLIC_BASE_URL=http://localhost:3000  │
│ • NODE_ENV=development                   │
│ • (+ same secrets as production)         │
└──────────┬───────────────────────────────┘
           │
           │  Accesses GCP services via ADC
           │
    ┌──────┴──────────────────────────┐
    │                                 │
    ↓                                 ↓
┌─────────────────┐         ┌─────────────────┐
│  FIRESTORE      │         │ CLOUD STORAGE   │
│  (Production!)  │         │ (Production!)   │
├─────────────────┤         ├─────────────────┤
│ ⚠️  WARNING:    │         │ ⚠️  WARNING:    │
│ Local dev      │         │ Local dev      │
│ connects to    │         │ connects to    │
│ PRODUCTION     │         │ PRODUCTION     │
│ Firestore      │         │ bucket         │
│                │         │                │
│ Use test       │         │ Use test       │
│ accounts!      │         │ files!         │
└─────────────────┘         └─────────────────┘

Best Practices:
┌────────────────────────────────────────┐
│ 1. Usar cuentas de prueba              │
│    • test@getaifactory.com             │
│    • demo@salfacloud.cl                │
│                                        │
│ 2. Marcar datos de prueba              │
│    • Prefix: "TEST - "                 │
│    • Folder: "Testing"                 │
│                                        │
│ 3. NO eliminar datos de producción    │
│    • Verificar userId antes de delete  │
│                                        │
│ 4. Firestore Emulator (alternativa):   │
│    • firebase emulators:start          │
│    • Datos locales, no afecta prod     │
│    • Requiere configuración adicional  │
└────────────────────────────────────────┘
```

---

## ✅ Leyenda de Símbolos

**En todos los diagramas:**

```
┌────────┐
│ Box    │  = Componente o servicio
└────────┘

─────────>  = Flujo de datos o request

⭐          = Crítico para funcionalidad multi-domain

✅          = Configurado y operacional

⚠️          = Requiere atención o cuidado

❌          = No funcional o bloqueado

🔴         = Alta prioridad

🟡         = Media prioridad

🟢         = Baja prioridad
```

---

## 📐 Especificaciones Técnicas Resumidas

### Regiones
- **Compute (Cloud Run):** us-east4
- **Database (Firestore):** us-central1
- **Storage (Cloud Storage):** us-central1
- **Analytics (BigQuery):** us-central1
- **AI (Vertex AI):** us-central1
- **Networking (Load Balancer):** Global

**Razón de regiones diferentes:**
- Cloud Run en us-east4: Más cercano a East Coast USA + LATAM
- Database/Storage en us-central1: Colocation (menor latencia entre servicios)

### Capacidades

**Throughput:**
- Max requests/sec: ~800 (10 instances × 80 concurrency)
- Actual: ~10-50 req/sec (plenty of headroom)

**Storage:**
- Firestore: Unlimited (prácticamente)
- Cloud Storage: Unlimited
- BigQuery: Unlimited

**Latency Targets:**
- API responses: <1s (p95)
- AI responses (first token): <2s (p95)
- Document extraction: <30s per chunk
- Vector search: <500ms (p95)

---

## 🔄 Request Flow Summary

**Path crítico de un request:**
```
User → DNS → Load Balancer → Backend Service → Cloud Run → 
  → Authenticate → Query Firestore → Call Gemini → 
  → Save to Firestore → Return to User

Latency: ~2.9s (p95)
Components: 8
Critical path: Gemini AI call (~70% of latency)
```

---

**Creado:** 2025-11-04  
**Última Actualización:** 2025-11-04  
**Propósito:** Visualizar arquitectura completa  
**Uso:** Referencia técnica, onboarding, documentación

