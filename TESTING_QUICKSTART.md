# 🧪 Testing & Validation - Quick Start

## 🎯 Objetivo

Validar que tu entorno local está configurado exactamente igual que producción GCP.

---

## ⚡ 3 Comandos Esenciales

```bash
# 1. Validar configuración local de Firestore
npm run test:firestore

# 2. Verificar health del servidor local
npm run health:check

# 3. Comparar local vs producción
npm run test:consistency https://your-app.run.app
```

---

## 📋 Antes de Empezar

### Setup Requerido

```bash
# 1. Autenticar con GCP
gcloud auth application-default login

# 2. Configurar proyecto (debe coincidir con .env)
gcloud config set project YOUR_PROJECT_ID

# 3. Verificar configuración
gcloud config list
```

### Variables de Entorno

Tu archivo `.env` debe tener:

```bash
GOOGLE_CLOUD_PROJECT=your-project-id-12345
```

---

## 🔍 Test 1: Validación Local

**Comando:**
```bash
npm run test:firestore
```

**¿Qué valida?**
- ✅ Configuración de PROJECT_ID
- ✅ Autenticación con GCP
- ✅ Permisos de lectura/escritura
- ✅ Acceso a colecciones críticas
- ✅ Latencia de operaciones

**Éxito se ve así:**
```
✅ Firestore client initialized
✅ Authenticated successfully
✅ Read permission verified
✅ Write permission verified
✅ All tests passed!
```

**Si falla, revisa:**
- `GOOGLE_CLOUD_PROJECT` en `.env`
- Ejecutaste `gcloud auth application-default login`
- Tienes permisos `roles/datastore.user`

---

## 🏥 Test 2: Health Check

**Comando:**
```bash
npm run health:check
```

**¿Qué valida?**
- Estado general del sistema
- Conectividad con Firestore
- Rendimiento de operaciones

**Éxito se ve así:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": { "status": "pass" },
    "authentication": { "status": "pass" },
    "firestoreRead": { "status": "pass", "latency": 45 },
    "firestoreWrite": { "status": "pass", "latency": 67 },
    "collections": { "status": "pass" }
  },
  "summary": {
    "passed": 5,
    "failed": 0
  }
}
```

**Estados posibles:**
- `healthy` (200) = ✅ Todo bien
- `degraded` (503) = ⚠️ Algunos problemas
- `error` (503) = ❌ No funciona

---

## 🔄 Test 3: Consistencia Local-Producción

**Comando:**
```bash
npm run test:consistency https://your-production-url.run.app
```

**¿Qué valida?**
- Ambos endpoints responden
- Mismo PROJECT_ID
- Ambos están healthy
- Configuración consistente

**Éxito se ve así:**
```
✅ Local is reachable
✅ Production is reachable

Configuration Comparison:
  Project ID:    ✅ MATCH
  Health Status: ✅ BOTH HEALTHY

✅ Configuration is CONSISTENT
```

**Si falla:**
- Verifica que producción esté deployed
- Compara PROJECT_ID en ambos
- Revisa permisos en ambos entornos

---

## 🚨 Troubleshooting Rápido

### "Project ID not set"
```bash
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> .env
```

### "Authentication failed"
```bash
gcloud auth application-default login
```

### "Permission denied"
```bash
# Verificar roles
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"
```

### "Temporary conversations (temp-12345)"
```bash
# Firestore no conectado, ejecutar:
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

---

## ✅ Checklist de Validación

Antes de deployar, verifica:

- [ ] `npm run test:firestore` → ✅ All passed
- [ ] `npm run health:check` → `"status": "healthy"`
- [ ] Conversaciones tienen ID real (no `temp-`)
- [ ] Datos aparecen en Firebase Console
- [ ] `npm run test:consistency` → ✅ CONSISTENT

---

## 📚 Documentación Completa

Para más detalles, ver:

- **Setup Local**: `docs/FIRESTORE_LOCAL_SETUP.md`
- **Testing Completo**: `docs/TESTING_CONSISTENCY.md`
- **Variables**: `ENV_VARIABLES_REFERENCE.md`

---

## 🎯 Comandos por Situación

### Primera vez configurando
```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
npm run test:firestore
npm run dev
```

### Antes de desarrollar
```bash
npm run health:check
npm run dev
```

### Antes de deployar
```bash
npm run test:firestore
npm run test:consistency https://staging-url.run.app
# Si todo OK:
npx pame-core-cli deploy www --production
```

### Después de deployar
```bash
curl https://production-url.run.app/api/health/firestore
npm run test:consistency https://production-url.run.app
```

---

## 🎉 Success Indicators

Todo está bien cuando ves:

✅ **Test Firestore:**
```
✅ All tests passed!
✅ Excellent latency!
```

✅ **Health Check:**
```json
{ "status": "healthy", "summary": { "passed": 5, "failed": 0 } }
```

✅ **Consistencia:**
```
✅ Configuration is CONSISTENT
✅ BOTH HEALTHY
```

✅ **Firebase Console:**
- Conversaciones creadas localmente aparecen
- Mismo PROJECT_ID
- Collections pobladas

---

**¡Listo para producción! 🚀**

Para ayuda: `docs/TESTING_CONSISTENCY.md`

