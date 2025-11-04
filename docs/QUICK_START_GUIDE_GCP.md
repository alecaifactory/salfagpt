# ⚡ Quick Start Guide - SALFAGPT Platform

**Para:** Nuevos desarrolladores y administradores  
**Tiempo estimado:** 15 minutos  
**Última actualización:** 2025-11-04

---

## 🎯 Objetivo

Configurar tu entorno local en 15 minutos y poder:
- ✅ Ejecutar la aplicación localmente
- ✅ Hacer deployment a producción
- ✅ Acceder a todos los servicios GCP

---

## 📋 Pre-requisitos

- [ ] macOS, Linux, o Windows
- [ ] Cuenta de Google (alec@salfacloud.cl para admin)
- [ ] Node.js 20+ instalado
- [ ] Git instalado
- [ ] Terminal/shell accesible

---

## 🚀 Setup en 6 Pasos

### Paso 1: Instalar Google Cloud SDK (3 min)

```bash
# macOS (Homebrew)
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Verificar
gcloud --version
```

---

### Paso 2: Autenticarse (2 min)

```bash
# Login principal
gcloud auth login
# Seleccionar: alec@salfacloud.cl en el navegador

# Application Default Credentials (para código local)
gcloud auth application-default login
# Seleccionar: alec@salfacloud.cl nuevamente

# Configurar proyecto
gcloud config set project salfagpt

# Verificar
gcloud config list
# Expected:
# account = alec@salfacloud.cl
# project = salfagpt
```

✅ **Checkpoint 1:** Tu terminal ahora puede acceder a GCP

---

### Paso 3: Clonar Repositorio (1 min)

```bash
# Clonar (si aún no lo tienes)
git clone https://github.com/org/salfagpt.git
cd salfagpt

# O si ya tienes el repo
cd /Users/alec/salfagpt
git pull origin main
```

---

### Paso 4: Configurar Environment Variables (3 min)

```bash
# Copiar template
cp .env.example .env

# Editar .env
nano .env
```

**Contenido mínimo de `.env`:**
```bash
# GCP
GOOGLE_CLOUD_PROJECT=salfagpt

# OAuth (copiar de Secret Manager)
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***  # Ver abajo cómo obtener

# Gemini AI (copiar de Secret Manager)
GOOGLE_AI_API_KEY=AIzaSy***  # Ver abajo cómo obtener

# JWT (generar nuevo para local)
JWT_SECRET=$(openssl rand -base64 32)  # Ejecutar este comando

# Local config
PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

**Obtener secretos de producción:**
```bash
# OAuth Client Secret
gcloud secrets versions access latest \
  --secret=GOOGLE_CLIENT_SECRET \
  --project=salfagpt

# Gemini API Key
gcloud secrets versions access latest \
  --secret=GOOGLE_AI_API_KEY \
  --project=salfagpt

# Copiar valores a .env
```

✅ **Checkpoint 2:** `.env` configurado correctamente

---

### Paso 5: Instalar Dependencias (3 min)

```bash
npm install
```

**Verificar instalación:**
```bash
npm list --depth=0 | grep astro
# Should show: astro@5.x.x
```

---

### Paso 6: Ejecutar Localmente (1 min)

```bash
npm run dev
```

**Output esperado:**
```
🚀 astro v5.1.0 started in 2s

  ┃ Local    http://localhost:3000/
  ┃ Network  use --host to expose
```

**Abrir en navegador:**
```bash
open http://localhost:3000
```

✅ **Checkpoint 3:** Aplicación corriendo localmente

---

## ✅ Verificación del Setup

### Test 1: Login Funciona

1. Ir a http://localhost:3000/auth/login
2. Click "Login con Google"
3. Seleccionar cuenta (debe estar en dominio habilitado)
4. Debe redirigir a http://localhost:3000/chat
5. ✅ Si ves el chat → Login funciona

**Si falla:**
- Verificar `.env` tiene `GOOGLE_CLIENT_ID` correcto
- Verificar OAuth redirect URI incluye `http://localhost:3000/auth/callback`

---

### Test 2: Firestore Accesible

```bash
# En otra terminal (mientras app corre)
curl -s http://localhost:3000/api/health/firestore | jq '.'
```

**Expected output:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": {
      "status": "pass",
      "value": "salfagpt"
    },
    "authentication": {
      "status": "pass"
    },
    "firestoreRead": {
      "status": "pass",
      "latency": "130ms"
    }
  }
}
```

✅ Si `status: "healthy"` → Firestore funciona

---

### Test 3: Crear Conversación

1. Después de login, en http://localhost:3000/chat
2. Click "+ Nuevo Agente"
3. Escribir mensaje: "Hola"
4. Enviar
5. ✅ Si AI responde → Todo funciona

---

## 🚀 Deployment a Producción (5 min)

### Pre-Deploy Checklist

```bash
# 1. Type check
npm run type-check
# Expected: 0 errors

# 2. Build
npm run build
# Expected: Build successful

# 3. Verificar proyecto
gcloud config get-value project
# Expected: salfagpt

# 4. Verificar cuenta
gcloud auth list | grep ACTIVE
# Expected: alec@salfacloud.cl
```

---

### Deploy Command

```bash
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt \
  --platform=managed \
  --allow-unauthenticated
```

**Prompts durante deploy:**
- Service name: (aceptar default)
- Region: (aceptar default)
- Allow unauthenticated: Yes

**Duración:** ~5-8 minutos

---

### Post-Deploy Verification

```bash
# 1. Health check
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
# Expected: "healthy"

# 2. Verificar project ID
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.projectId.value'
# Expected: "salfagpt"

# 3. Abrir en navegador
open https://salfagpt.salfagestion.cl

# 4. Login test
# Click "Login" → Debe funcionar

# 5. Feature test
# Crear conversación → Enviar mensaje → ✅
```

---

## 🔧 Comandos Esenciales

### Gestión de Servicios

```bash
# Ver servicios Cloud Run
gcloud run services list --project=salfagpt

# Describir servicio
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt

# Ver variables de entorno
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt \
  --format="yaml(spec.template.spec.containers[0].env)"
```

---

### Ver Logs

```bash
# Logs recientes
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=20 --project=salfagpt

# Solo errores
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=10 --project=salfagpt

# Seguir logs en tiempo real
gcloud alpha logging tail "resource.type=cloud_run_revision" \
  --project=salfagpt
```

---

### Firestore

```bash
# Abrir console
open "https://console.cloud.google.com/firestore?project=salfagpt"

# Backup manual
gcloud firestore export \
  gs://salfagpt-backups/manual-$(date +%Y%m%d-%H%M%S) \
  --project=salfagpt

# Listar colecciones
gcloud firestore collections list --project=salfagpt
```

---

### Cloud Storage

```bash
# Listar buckets
gsutil ls -p salfagpt

# Listar archivos
gsutil ls gs://salfagpt-uploads/documents/ | tail -10

# Ver tamaño
gsutil du -sh gs://salfagpt-uploads
```

---

## 🆘 Troubleshooting Rápido

### Error: "You do not have permission"

```bash
# Solución rápida
gcloud auth login
gcloud config set project salfagpt
gcloud auth application-default login
```

---

### Error: "Firestore PERMISSION_DENIED"

```bash
# Verificar proyecto correcto
grep GOOGLE_CLOUD_PROJECT .env
# Debe ser: GOOGLE_CLOUD_PROJECT=salfagpt

# Verificar ADC
ls ~/.config/gcloud/application_default_credentials.json
# Debe existir
```

---

### Error: "OAuth redirect_uri_mismatch"

```bash
# Verificar PUBLIC_BASE_URL en .env
grep PUBLIC_BASE_URL .env

# Para local: PUBLIC_BASE_URL=http://localhost:3000
# Para producción: PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl

# Verificar OAuth redirect URIs incluyen esta URL
open "https://console.cloud.google.com/apis/credentials?project=salfagpt"
# Client ID: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h
# Verificar redirect URIs
```

---

### App no carga (localhost)

```bash
# Verificar puerto 3000 disponible
lsof -i :3000
# Si ocupado, matar proceso: kill -9 <PID>

# Limpiar y reiniciar
rm -rf node_modules/.vite dist .astro
npm install
npm run dev
```

---

## 📚 Recursos Útiles

### Documentación del Proyecto

| Documento | Propósito | Cuándo Leer |
|-----------|-----------|-------------|
| `ARQUITECTURA_COMPLETA_GCP.md` | Arquitectura detallada | Setup inicial |
| `AUTENTICACION_ADMINISTRADOR_GCP.md` | Guía de credenciales | Setup inicial |
| `ARQUITECTURA_VISUAL_DIAGRAMAS.md` | Diagramas visuales | Entender flujos |
| `GCP_SERVICES_QUICK_REFERENCE.md` | Comandos rápidos | Día a día |
| `.cursor/rules/gcp-services-permissions.mdc` | Reglas de permisos | Debugging |

---

### URLs Importantes

**GCP Console:**
- **Dashboard:** https://console.cloud.google.com/home/dashboard?project=salfagpt
- **Cloud Run:** https://console.cloud.google.com/run?project=salfagpt
- **Firestore:** https://console.cloud.google.com/firestore?project=salfagpt
- **Storage:** https://console.cloud.google.com/storage?project=salfagpt
- **IAM:** https://console.cloud.google.com/iam-admin/iam?project=salfagpt
- **Logs:** https://console.cloud.google.com/logs?project=salfagpt

**Aplicación:**
- **Producción:** https://salfagpt.salfagestion.cl
- **Localhost:** http://localhost:3000

---

## 💡 Tips Útiles

### 1. Alias Útiles (opcional)

Agregar a `~/.zshrc` o `~/.bashrc`:

```bash
# SALFAGPT aliases
alias gcp-salfagpt='gcloud config set project salfagpt'
alias logs-salfagpt='gcloud logging read "resource.type=cloud_run_revision" --limit=20 --project=salfagpt'
alias deploy-salfagpt='cd /Users/alec/salfagpt && gcloud run deploy cr-salfagpt-ai-ft-prod --source . --region=us-east4 --project=salfagpt'
alias health-salfagpt='curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq .'
```

**Uso:**
```bash
gcp-salfagpt      # Set proyecto
logs-salfagpt     # Ver logs
deploy-salfagpt   # Deploy rápido
health-salfagpt   # Health check
```

---

### 2. VS Code Extension Recomendada

**Google Cloud Code:**
- Cloud Run debugging
- Firestore explorer
- Log viewer integrado

**Instalar:**
```bash
code --install-extension googlecloudtools.cloudcode
```

---

### 3. Atajos de Teclado

En terminal:
- `Ctrl+R`: Buscar comando anterior
- `Ctrl+C`: Cancelar comando actual
- `Ctrl+Z`: Suspender proceso (bg para continuar en background)

En navegador (GCP Console):
- `g` + `h`: Go to home
- `g` + `c`: Go to Cloud Run
- `/`: Focus search bar

---

## 🎓 Siguientes Pasos

Después de completar el Quick Start:

### Para Desarrolladores:
1. Leer `ARQUITECTURA_COMPLETA_GCP.md` (20 min)
2. Explorar código en `src/` (1 hora)
3. Leer `.cursor/rules/*.mdc` (reglas del proyecto)
4. Hacer primera feature (2-4 horas)

### Para DevOps:
1. Leer `AUTENTICACION_ADMINISTRADOR_GCP.md` (15 min)
2. Configurar monitoring (1 hora)
3. Configurar backups automáticos (1 hora)
4. Documentar disaster recovery (2 horas)

### Para Product Managers:
1. Leer `ARQUITECTURA_VISUAL_DIAGRAMAS.md` (30 min)
2. Ver dashboard de métricas (30 min)
3. Entender cost breakdown (15 min)

---

## 📊 Métricas de Éxito

**Después del Quick Start deberías poder:**

- [x] Ejecutar `npm run dev` sin errores
- [x] Abrir http://localhost:3000 y ver la app
- [x] Hacer login con cuenta de prueba
- [x] Crear una conversación
- [x] Enviar un mensaje y recibir respuesta
- [x] Hacer deploy a producción
- [x] Verificar que producción funciona

**Si todos ✅ → Setup exitoso!**

---

## 🚨 Problemas Comunes y Soluciones

### "gcloud: command not found"

```bash
# Reinstalar SDK
brew install google-cloud-sdk

# O agregar a PATH
export PATH=$PATH:/usr/local/google-cloud-sdk/bin
echo 'export PATH=$PATH:/usr/local/google-cloud-sdk/bin' >> ~/.zshrc
```

---

### "Could not load default credentials"

```bash
# Re-hacer ADC
gcloud auth application-default login
# Seleccionar alec@salfacloud.cl
```

---

### "npm install" falla

```bash
# Limpiar cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### Puerto 3000 ocupado

```bash
# Ver qué está usando el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en astro.config.mjs (no recomendado para producción)
```

---

## 📞 Soporte

**Documentación completa:**
- `docs/ARQUITECTURA_COMPLETA_GCP.md`
- `docs/AUTENTICACION_ADMINISTRADOR_GCP.md`
- `docs/ARQUITECTURA_VISUAL_DIAGRAMAS.md`

**Contacto:**
- Alec: alec@salfacloud.cl
- GCP Support: https://console.cloud.google.com/support?project=salfagpt

**Comunidad:**
- GitHub Issues: (si hay repo público)
- Stack Overflow: Tag `google-cloud-platform`

---

## ✅ Checklist Final

Marcar cuando completes cada paso:

**Setup Inicial:**
- [ ] Google Cloud SDK instalado
- [ ] Autenticado como alec@salfacloud.cl
- [ ] Proyecto configurado (salfagpt)
- [ ] ADC configurado
- [ ] Repositorio clonado
- [ ] `.env` configurado
- [ ] Dependencies instaladas
- [ ] App corre en localhost
- [ ] Login funciona localmente
- [ ] Puede crear conversación
- [ ] Puede enviar mensaje

**Primer Deployment:**
- [ ] Type check pasa
- [ ] Build exitoso
- [ ] Deploy command ejecutado
- [ ] Deployment completado sin errores
- [ ] Health check producción OK
- [ ] Login producción funciona
- [ ] Features principales verificadas

**Conocimiento:**
- [ ] Entiendo la arquitectura general
- [ ] Sé dónde están los logs
- [ ] Sé cómo ver Firestore data
- [ ] Sé cómo hacer rollback si es necesario
- [ ] Sé a quién contactar para ayuda

---

**¡Felicitaciones! 🎉**

Ya tienes todo configurado para desarrollar y desplegar en SALFAGPT.

**Próximos pasos:**
1. Explorar el código
2. Leer documentación detallada
3. Hacer tu primera feature
4. Configurar monitoring (recomendado)

---

**Tiempo total:** ~15 minutos  
**Dificultad:** Principiante  
**Prerequisitos:** Cuenta GCP con permisos de Owner  
**Última actualización:** 2025-11-04

