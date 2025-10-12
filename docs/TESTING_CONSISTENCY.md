# Testing Local-Production Consistency

## 🎯 Objetivo

Validar que tu entorno de desarrollo local está configurado exactamente igual que producción en GCP, asegurando que no haya sorpresas al deployar.

---

## ⚡ Quick Test

```bash
# 1. Verificar configuración de Firestore
npm run test:firestore

# 2. Verificar consistencia con producción
npm run test:consistency https://your-app.run.app

# 3. Check health endpoint en local
npm run health:check
```

---

## 📋 Herramientas de Validación

### 1. Health Check Endpoint

**Endpoint:** `GET /api/health/firestore`

**¿Qué hace?**
- Verifica la configuración del PROJECT_ID
- Prueba la autenticación con Firestore
- Valida permisos de lectura y escritura
- Mide latencia de operaciones
- Lista colecciones disponibles

**Uso:**

```bash
# Local
curl http://localhost:3000/api/health/firestore | json_pp

# Production
curl https://your-app.run.app/api/health/firestore | json_pp
```

**Respuesta Esperada:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-12T10:30:00.000Z",
  "environment": "development",
  "checks": {
    "projectId": {
      "status": "pass",
      "value": "your-project-12345",
      "message": "Project ID configured: your-project-12345"
    },
    "authentication": {
      "status": "pass",
      "message": "Authenticated successfully (8 collections accessible)"
    },
    "firestoreRead": {
      "status": "pass",
      "message": "Read operation successful (45ms)",
      "latency": 45
    },
    "firestoreWrite": {
      "status": "pass",
      "message": "Write operation successful (67ms)",
      "latency": 67
    },
    "collections": {
      "status": "pass",
      "found": ["conversations", "messages", "users", "folders"],
      "expected": ["conversations", "messages", "folders", "user_context"],
      "message": "Found 8 collections"
    }
  },
  "summary": {
    "totalChecks": 5,
    "passed": 5,
    "failed": 0
  }
}
```

**Estados Posibles:**

| Status | HTTP Code | Significado |
|--------|-----------|-------------|
| `healthy` | 200 | ✅ Todo funcionando correctamente |
| `degraded` | 503 | ⚠️ Algunos checks fallaron pero funciona |
| `error` | 503 | ❌ No está funcionando |

---

### 2. Script de Test de Firestore

**Script:** `scripts/test-firestore-consistency.js`

**¿Qué hace?**
- Valida configuración de .env
- Prueba autenticación con GCP
- Verifica permisos de lectura/escritura
- Comprueba acceso a colecciones críticas
- Mide latencia promedio
- Valida consistencia de configuración

**Uso:**

```bash
npm run test:firestore
```

**Salida Esperada:**

```
============================================================
  🔍 Firestore Consistency Test
============================================================

ℹ️  Project ID: your-project-12345
ℹ️  Node Environment: development

============================================================
  📦 Initializing Firestore Client
============================================================

✅ Firestore client initialized

============================================================
  🔐 Test 1: Authentication
============================================================

✅ Authenticated successfully
ℹ️  Found 8 collections
ℹ️  Collections: conversations, messages, users, folders...

============================================================
  📖 Test 2: Read Permissions
============================================================

✅ Read permission verified
ℹ️  Query returned 5 documents

============================================================
  ✍️  Test 3: Write Permissions
============================================================

✅ Write permission verified
ℹ️  Test document created: _test_consistency/test_1697...
✅ Document read back successfully
✅ Test document cleaned up

============================================================
  📚 Test 4: Critical Collections
============================================================

✅ conversations: accessible (1 docs checked)
✅ messages: accessible (1 docs checked)
✅ users: accessible (1 docs checked)
✅ folders: accessible (1 docs checked)
✅ user_context: accessible (1 docs checked)

============================================================
  ⚡ Test 5: Latency Check
============================================================

ℹ️  Test 1: 45ms
ℹ️  Test 2: 38ms
ℹ️  Test 3: 42ms
ℹ️  Test 4: 40ms
ℹ️  Test 5: 44ms
✅ Latency stats:
ℹ️    Average: 41.80ms
ℹ️    Min: 38ms
ℹ️    Max: 45ms
✅ Excellent latency!

============================================================
  ✨ Test Summary
============================================================

✅ All tests passed!

Your local environment is properly configured to use GCP Firestore.
Both local development and production will use the same database.
```

---

### 3. Script de Validación de Consistencia

**Script:** `scripts/validate-consistency.sh`

**¿Qué hace?**
- Compara configuraciones entre local y producción
- Verifica que ambos usan el mismo PROJECT_ID
- Valida que ambos endpoints responden
- Comprueba el estado de salud de ambos
- Prueba operaciones básicas en ambos

**Uso:**

```bash
# Primero, inicia el servidor local
npm run dev

# En otra terminal, ejecuta la validación
npm run test:consistency https://your-app.run.app

# O directamente:
./scripts/validate-consistency.sh https://flow-production-abc123.run.app
```

**Salida Esperada:**

```
==================================================
  🔍 Flow - Consistency Validation Tool
==================================================

Local:      http://localhost:3000
Production: https://flow-production-abc123.run.app

Starting validation...

1️⃣  Checking local server...
Checking Local...
✅ Local is reachable (HTTP 200)

2️⃣  Checking production server...
Checking Production...
✅ Production is reachable (HTTP 200)

3️⃣  Comparing configurations...

==================================================
  📊 Comparing Configurations
==================================================

Fetching local configuration...
Fetching production configuration...

┌─────────────────────────────────────────────────┐
│              Configuration Comparison            │
├─────────────────────────────────────────────────┤
│ Project ID                                       │
│   Local:      your-project-12345                │
│   Production: your-project-12345                │
│   ✅ MATCH                                        │
│                                                  │
│ Health Status                                    │
│   Local:      healthy                           │
│   Production: healthy                           │
│   ✅ BOTH HEALTHY                                 │
│                                                  │
│ Environment                                      │
│   Local:      development                       │
│   Production: production                        │
└─────────────────────────────────────────────────┘

✅ Configuration is CONSISTENT
   Both environments point to the same GCP project

4️⃣  Testing operations...

Testing API endpoints...
Conversations endpoint:
  Local:      HTTP 400
  Production: HTTP 400
  ✅ Both return 400 (expected - needs userId param)

==================================================
  ✅ Validation Complete
==================================================

✨ Local and production are consistent!

Next steps:
  • Test creating a conversation locally
  • Verify it appears in Firebase Console
  • Deploy changes with: npx pame-core-cli deploy www --production
```

---

## 🔍 Troubleshooting

### Error: "Project ID not configured"

```bash
❌ GOOGLE_CLOUD_PROJECT not set in .env file
```

**Solución:**
```bash
# Agregar a .env
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> .env

# Re-ejecutar test
npm run test:firestore
```

---

### Error: "Authentication failed"

```bash
❌ Authentication failed: Could not load the default credentials
```

**Solución:**
```bash
# Re-autenticar con GCP
gcloud auth application-default login

# Verificar proyecto
gcloud config get-value project

# Re-ejecutar test
npm run test:firestore
```

---

### Error: "Permission denied"

```bash
❌ Read permission failed: 7 PERMISSION_DENIED
```

**Solución:**
```bash
# Verificar roles
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL@gmail.com"

# Si falta roles/datastore.user, solicitar al admin:
# gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
#   --member="user:YOUR_EMAIL@gmail.com" \
#   --role="roles/datastore.user"
```

---

### Error: "Project ID mismatch"

```
❌ Configuration is INCONSISTENT
   Environments point to different projects
```

**Local:**
```bash
# Verificar .env local
cat .env | grep GOOGLE_CLOUD_PROJECT
# GOOGLE_CLOUD_PROJECT=project-a

# Verificar gcloud
gcloud config get-value project
# project-b  ← DIFERENTE!

# Corregir:
gcloud config set project project-a
```

**Production:**
```bash
# Verificar variable en Cloud Run
gcloud run services describe flow-production --region us-central1 \
  --format="value(spec.template.spec.containers[0].env[?name=='GOOGLE_CLOUD_PROJECT'].value)"

# Si está mal, re-deployar con el proyecto correcto
```

---

### Error: "High latency"

```
⚠️  High latency detected
    Average: 450ms
```

**Posibles causas:**
1. **Red lenta**: Verificar conexión a internet
2. **Ubicación geográfica**: Firestore está en otra región
3. **Firestore sobrecargado**: Verificar en console.cloud.google.com
4. **Índices faltantes**: Crear índices necesarios

**Solución:**
```bash
# Verificar índices
firebase firestore:indexes

# Si faltan índices, se crearán automáticamente en el primer uso
# O crearlos manualmente en Firebase Console
```

---

## 📊 Interpretando Resultados

### Status: healthy ✅

**Significado:**
- ✅ Todo configurado correctamente
- ✅ Autenticación funciona
- ✅ Permisos correctos
- ✅ Operaciones funcionan
- ✅ Latencia aceptable

**Acción:** ¡Listo para desarrollar!

---

### Status: degraded ⚠️

**Significado:**
- ⚠️ Algunos checks fallaron
- ⚠️ La aplicación puede funcionar parcialmente
- ⚠️ Algunos features pueden no estar disponibles

**Acción:** 
1. Revisar qué checks fallaron
2. Corregir según troubleshooting
3. Re-ejecutar tests

---

### Status: error ❌

**Significado:**
- ❌ Configuración incorrecta o incompleta
- ❌ Autenticación o permisos faltantes
- ❌ La aplicación no funcionará correctamente

**Acción:**
1. Seguir guía de setup: `docs/FIRESTORE_LOCAL_SETUP.md`
2. Ejecutar: `gcloud auth application-default login`
3. Verificar: `GOOGLE_CLOUD_PROJECT` en `.env`
4. Re-ejecutar: `npm run test:firestore`

---

## 🔄 Flujo de Validación Recomendado

### Antes de Empezar a Desarrollar

```bash
# 1. Setup inicial
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

# 2. Validar configuración
npm run test:firestore

# 3. Iniciar servidor
npm run dev

# 4. Verificar health
npm run health:check
```

### Antes de Deployar

```bash
# 1. Verificar local funciona
npm run health:check

# 2. Build production
npm run build

# 3. Validar consistencia
npm run test:consistency https://your-staging-url.run.app

# 4. Si todo OK, deploy a producción
npx pame-core-cli deploy www --production

# 5. Verificar producción
curl https://your-production-url.run.app/api/health/firestore
```

### Después de Deployar

```bash
# 1. Verificar producción healthy
curl https://your-production-url.run.app/api/health/firestore

# 2. Validar consistencia
npm run test:consistency https://your-production-url.run.app

# 3. Prueba E2E
# - Crear conversación en local
# - Verificar aparece en Firebase Console
# - Crear conversación en producción
# - Verificar aparece en Firebase Console
```

---

## 🎯 Checklist de Validación

Antes de considerar tu entorno "production-ready", verifica:

### Configuración
- [ ] `GOOGLE_CLOUD_PROJECT` configurado en `.env`
- [ ] `gcloud auth application-default login` ejecutado
- [ ] Proyecto de gcloud coincide con `.env`
- [ ] Permisos de Firestore otorgados

### Tests
- [ ] `npm run test:firestore` → ✅ All tests passed
- [ ] `npm run health:check` → `"status": "healthy"`
- [ ] `npm run test:consistency` → ✅ CONSISTENT

### Funcionalidad
- [ ] Conversaciones se crean con ID real (no `temp-`)
- [ ] Mensajes se guardan en Firestore
- [ ] Context sources persisten
- [ ] Datos aparecen en Firebase Console

### Producción
- [ ] Health check en producción → `"status": "healthy"`
- [ ] Mismo PROJECT_ID en local y producción
- [ ] Latencia aceptable (< 200ms promedio)
- [ ] Sin errores de permisos

---

## 📚 Recursos Adicionales

- [Guía de Setup Local](./FIRESTORE_LOCAL_SETUP.md)
- [Variables de Entorno](../ENV_VARIABLES_REFERENCE.md)
- [Deployment Guide](../LocalToProduction.md)
- [Firebase Console](https://console.firebase.google.com/)
- [Cloud Console](https://console.cloud.google.com/)

---

## 🎉 Success Indicators

Sabrás que todo está correcto cuando:

✅ **Local:**
```bash
npm run test:firestore
# ✅ All tests passed!
# ✅ Excellent latency!
```

✅ **Health Check:**
```bash
npm run health:check
# "status": "healthy"
# "passed": 5, "failed": 0
```

✅ **Consistencia:**
```bash
npm run test:consistency https://your-app.run.app
# ✅ Configuration is CONSISTENT
# ✅ BOTH HEALTHY
```

✅ **Firebase Console:**
- Conversaciones creadas localmente aparecen
- Mismo PROJECT_ID en ambos entornos
- Collections correctamente pobladas

---

**¡Tu entorno está listo para producción! 🚀**

