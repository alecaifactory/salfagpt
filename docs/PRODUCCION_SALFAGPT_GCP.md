# 🚀 Guía de Despliegue a Producción - SalfaGPT en GCP

**Última Actualización:** 2025-10-23  
**Estado:** ✅ Verificado y Funcionando  
**Proyecto GCP:** salfagpt  
**Región:** us-central1  

---

## 📋 Información del Proyecto

**Proyecto GCP:**
- **ID del Proyecto:** `salfagpt`
- **Número del Proyecto:** `82892384200`
- **Región:** `us-central1`
- **Servicio Cloud Run:** `salfagpt`
- **URL de Producción:** `https://salfagpt-3snj65wckq-uc.a.run.app`

---

## 🔐 Variables de Entorno Requeridas

### Archivo .env Local

Tu archivo `.env` debe contener estas variables (para desarrollo local):

```bash
# GCP Configuration
GOOGLE_CLOUD_PROJECT=salfagpt

# Gemini AI
GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0

# OAuth 2.0 (Google Sign-In)
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# JWT (Session Management)
JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f

# URLs
PUBLIC_BASE_URL=http://localhost:3000
DEV_PORT=3000

# Session Configuration
SESSION_COOKIE_NAME=salfagpt_session
SESSION_MAX_AGE=86400

# RAG Configuration (Opcionales, tienen defaults)
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001
```

### Variables Críticas para Producción

Estas son las **7 variables OBLIGATORIAS** que deben configurarse en Cloud Run:

| Variable | Valor Producción | Descripción |
|----------|------------------|-------------|
| `GOOGLE_CLOUD_PROJECT` | `salfagpt` | ID del proyecto GCP |
| `GOOGLE_CLIENT_ID` | `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `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` | OAuth Client Secret |
| `GOOGLE_AI_API_KEY` | `AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0` | Gemini AI API Key |
| `JWT_SECRET` | `df45d920393b2317...` (tu secret largo) | Firma de tokens de sesión |
| `PUBLIC_BASE_URL` | `https://salfagpt-3snj65wckq-uc.a.run.app` | URL base para OAuth callbacks |
| `NODE_ENV` | `production` | Modo de ejecución |

⚠️ **IMPORTANTE:** El `GOOGLE_CLIENT_SECRET` debe coincidir EXACTAMENTE con el que aparece en Google Cloud Console.

---

## 🔧 Configuración de OAuth en Google Cloud Console

### Paso 1: Acceder a Credenciales OAuth

1. Ve a: [Google Cloud Console - Credenciales](https://console.cloud.google.com/apis/credentials?project=salfagpt)
2. Asegúrate de estar en el proyecto **`salfagpt`** (verifica en la barra superior)
3. Busca el OAuth 2.0 Client ID: **SalfaGPT**

### Paso 2: Configurar URIs Autorizados

**Orígenes autorizados de JavaScript:**
```
http://localhost:3000
https://salfagpt-3snj65wckq-uc.a.run.app
```

**URIs de redireccionamiento autorizados:**
```
http://localhost:3000/auth/callback
https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
```

⚠️ **IMPORTANTE:**
- ✅ Usa `https://` para producción (NO `http://`)
- ✅ NO incluyas barra final (`/`)
- ✅ El path debe ser exactamente `/auth/callback`
- ⏳ Los cambios pueden tardar 5-15 minutos en propagarse

### Paso 3: Verificar Client Secret

1. En la misma página de credenciales, haz clic en "MOSTRAR SECRETO DEL CLIENTE"
2. Copia el secreto que empieza con `GOCSPX-`
3. **Debe coincidir EXACTAMENTE** con el valor en tu archivo `.env`
4. Si es diferente, actualiza tu `.env` local Y Cloud Run

---

## 🚀 Proceso de Despliegue a Producción

### Pre-requisitos

```bash
# 1. Verificar que estás autenticado
gcloud auth list

# 2. Configurar el proyecto correcto
gcloud config set project salfagpt

# 3. Verificar que el build local funciona
npm run build
```

### Comando de Despliegue Completo

```bash
# Desplegar con TODAS las variables de entorno
gcloud run deploy salfagpt \
  --source . \
  --project=salfagpt \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --update-env-vars="GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com,GOOGLE_CLIENT_SECRET=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,PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app,NODE_ENV=production,GOOGLE_CLOUD_PROJECT=salfagpt,JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f,GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0"
```

### Explicación de Parámetros

**Parámetros de Cloud Run:**
- `--source .` - Build desde el código fuente actual
- `--min-instances=0` - Escala a 0 cuando no hay tráfico (ahorra costos)
- `--max-instances=10` - Máximo 10 instancias concurrentes
- `--memory=1Gi` - 1GB de RAM por instancia
- `--cpu=1` - 1 vCPU por instancia
- `--timeout=300` - 5 minutos de timeout (para procesamiento de PDFs)
- `--allow-unauthenticated` - Permite acceso público (OAuth maneja autenticación)

---

## ✅ Verificación Post-Despliegue

### Paso 1: Verificar que el servicio está saludable

```bash
curl -s https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq .
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": { "status": "pass" },
    "authentication": { "status": "pass" },
    "firestoreRead": { "status": "pass" },
    "firestoreWrite": { "status": "pass" }
  }
}
```

### Paso 2: Verificar variables de entorno

```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="value(spec.template.spec.containers[0].env)"
```

**Debes ver:**
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ GOOGLE_AI_API_KEY
- ✅ JWT_SECRET
- ✅ PUBLIC_BASE_URL
- ✅ NODE_ENV
- ✅ GOOGLE_CLOUD_PROJECT

### Paso 3: Probar OAuth Login

1. **Limpia caché del navegador:**
   - Chrome: Cmd + Shift + Delete → Borrar cookies y caché
   - O usa ventana de incógnito

2. **Visita:** https://salfagpt-3snj65wckq-uc.a.run.app

3. **Haz clic en:** "Continuar con Google"

4. **Verifica:**
   - ✅ Redirige a Google Sign-In
   - ✅ Puedes seleccionar tu cuenta
   - ✅ Redirige de vuelta a `/chat`
   - ✅ Muestra tus conversaciones

### Paso 4: Verificar logs (si hay errores)

```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=20 \
  --project=salfagpt \
  --format="table(timestamp,severity,textPayload)"
```

---

## 🔧 Actualizar Variables de Entorno (Sin Redesplegar)

Si solo necesitas actualizar variables de entorno sin redesplegar el código:

### Actualizar una variable:
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="VARIABLE_NAME=nuevo_valor"
```

### Actualizar múltiples variables:
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="VAR1=valor1,VAR2=valor2,VAR3=valor3"
```

### Remover una variable:
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --remove-env-vars="VARIABLE_NAME"
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Missing required parameter: client_id"

**Causa:** `GOOGLE_CLIENT_ID` no está configurado en Cloud Run

**Solución:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com"
```

### Error: "invalid_client" (HTTP 401)

**Causa:** El `GOOGLE_CLIENT_SECRET` en Cloud Run no coincide con el de Google Console

**Solución:**
1. Verifica el secreto en Google Console (botón "MOSTRAR SECRETO DEL CLIENTE")
2. Actualiza Cloud Run con el secreto correcto del archivo `.env`:
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=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"
```

### Error: "redirect_uri_mismatch"

**Causa:** El redirect URI en OAuth Console no coincide con la URL del servicio

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Edita el OAuth Client
3. Agrega: `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback`
4. Guarda y espera 10-15 minutos

### Error: "Firestore permission denied"

**Causa:** El servicio no tiene permisos para acceder a Firestore

**Solución:**
```bash
# Dar permisos a la service account
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:
```bash
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt" \
  --project=salfagpt \
  --format="table(timestamp,severity,textPayload)"
```

### Ver solo errores:
```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=50 \
  --project=salfagpt
```

### Ver logs de OAuth:
```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND textPayload=~"OAuth"' \
  --limit=20 \
  --project=salfagpt
```

---

## 🔄 Rollback a Versión Anterior

Si el nuevo despliegue tiene problemas:

### Paso 1: Listar revisiones
```bash
gcloud run revisions list \
  --service salfagpt \
  --region us-central1 \
  --project salfagpt
```

### Paso 2: Hacer rollback
```bash
# Reemplaza REVISION_NAME con la revisión anterior que funcionaba
gcloud run services update-traffic salfagpt \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1 \
  --project salfagpt
```

**Ejemplo:**
```bash
gcloud run services update-traffic salfagpt \
  --to-revisions=salfagpt-00015-zk5=100 \
  --region us-central1 \
  --project salfagpt
```

---

## 🎯 Checklist Pre-Despliegue

Antes de cada despliegue a producción, verifica:

### Código
- [ ] `npm run build` funciona sin errores
- [ ] `npm run type-check` pasa (0 errores)
- [ ] Todas las funcionalidades probadas localmente
- [ ] Git commit realizado

### Variables de Entorno
- [ ] Archivo `.env` actualizado con valores correctos
- [ ] `GOOGLE_CLIENT_SECRET` coincide con Google Console
- [ ] Todas las 7 variables críticas presentes
- [ ] `PUBLIC_BASE_URL` apunta a URL de producción

### OAuth Configuration
- [ ] URIs de redireccionamiento incluyen URL de producción
- [ ] Orígenes JavaScript autorizados incluyen URL de producción
- [ ] Client Secret visible y copiado correctamente

### GCP
- [ ] Autenticado con `gcloud auth list`
- [ ] Proyecto configurado: `gcloud config get-value project` → `salfagpt`
- [ ] Permisos de Firestore configurados

---

## 🚀 Script de Despliegue Automático

Puedes usar este script para desplegar más fácilmente:

```bash
#!/bin/bash
# deploy-salfagpt-production.sh

set -e  # Exit on error

echo "🚀 Desplegando SalfaGPT a Producción"
echo "===================================="
echo ""

# Configurar proyecto
gcloud config set project salfagpt

# Verificar build
echo "🏗️  Verificando build local..."
npm run build

# Desplegar
echo ""
echo "📦 Desplegando a Cloud Run..."
gcloud run deploy salfagpt \
  --source . \
  --project=salfagpt \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --update-env-vars="GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com,GOOGLE_CLIENT_SECRET=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,PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app,NODE_ENV=production,GOOGLE_CLOUD_PROJECT=salfagpt,JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f,GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0"

# Verificar salud
echo ""
echo "🧪 Verificando salud del servicio..."
sleep 5
curl -s https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq -r '.status'

echo ""
echo "✅ Despliegue completo!"
echo "🌐 URL: https://salfagpt-3snj65wckq-uc.a.run.app"
```

**Para usar:**
```bash
chmod +x deploy-salfagpt-production.sh
./deploy-salfagpt-production.sh
```

---

## 📝 Notas Importantes

### 1. Client Secret vs Client ID

**GOOGLE_CLIENT_SECRET** es el que causa más problemas:
- ✅ **Debe ser EXACTO** - un solo carácter diferente causa error
- ✅ **Empieza con** `GOCSPX-`
- ✅ **Se puede ver** en Google Console con "MOSTRAR SECRETO"
- ⚠️ **No confundir** con el Client ID (que es público)

### 2. URLs de Producción vs Desarrollo

**Desarrollo (localhost):**
```bash
PUBLIC_BASE_URL=http://localhost:3000
```

**Producción (Cloud Run):**
```bash
PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app
```

⚠️ **NUNCA uses** `http://` en producción, siempre `https://`

### 3. Propagación de Cambios

**Cloud Run:**
- Cambios de código: ~2-5 minutos
- Cambios de env vars: ~30 segundos a 2 minutos

**Google OAuth:**
- Cambios en redirect URIs: **5-15 minutos** (a veces hasta 1 hora)
- Cambios en client secret: Inmediato (pero actualiza Cloud Run)

### 4. Service Account Permissions

La service account debe tener estos roles:
```bash
# Verificar permisos actuales
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:82892384200-compute@developer.gserviceaccount.com"
```

**Roles requeridos:**
- `roles/datastore.user` - Para Firestore
- `roles/storage.admin` - Para Cloud Storage (si usas uploads)

---

## 🔐 Seguridad y Mejores Prácticas

### DO's ✅

1. ✅ **Mantén secretos fuera de Git:**
   - Archivo `.env` está en `.gitignore`
   - Nunca hagas commit de `.env`

2. ✅ **Usa variables de entorno en Cloud Run:**
   - No hardcodees secretos en código
   - Usa `process.env.VARIABLE_NAME`

3. ✅ **Rota secretos regularmente:**
   - JWT_SECRET cada 90 días
   - Client Secret cada 6 meses

4. ✅ **Monitorea logs:**
   - Revisa logs de errores diariamente
   - Configura alertas para errores críticos

### DON'Ts ❌

1. ❌ **No compartas secretos públicamente:**
   - No los pongas en issues de GitHub
   - No los compartas por Slack sin encriptar
   - No los pongas en screenshots

2. ❌ **No uses el mismo secret en múltiples ambientes:**
   - Desarrollo debe tener su propio JWT_SECRET
   - Producción debe tener secretos únicos

3. ❌ **No hardcodees secretos:**
   ```typescript
   // ❌ WRONG
   const apiKey = "AIzaSy...";
   
   // ✅ CORRECT
   const apiKey = process.env.GOOGLE_AI_API_KEY;
   ```

---

## 📚 Referencias Rápidas

### URLs Importantes

**Servicio en Producción:**
- https://salfagpt-3snj65wckq-uc.a.run.app

**Consolas GCP:**
- [Cloud Run Dashboard](https://console.cloud.google.com/run/detail/us-central1/salfagpt?project=salfagpt)
- [OAuth Credentials](https://console.cloud.google.com/apis/credentials?project=salfagpt)
- [Firestore Database](https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=salfagpt)
- [Cloud Build History](https://console.cloud.google.com/cloud-build/builds?project=salfagpt)
- [Logs Explorer](https://console.cloud.google.com/logs/query?project=salfagpt)

### Comandos Útiles

```bash
# Ver estado del servicio
gcloud run services describe salfagpt --region us-central1 --project salfagpt

# Ver revisiones recientes
gcloud run revisions list --service salfagpt --region us-central1 --project salfagpt --limit=5

# Ver métricas
gcloud monitoring dashboards list --project=salfagpt

# Actualizar una variable
gcloud run services update salfagpt --region us-central1 --project salfagpt --update-env-vars="KEY=value"

# Ver todas las env vars configuradas
gcloud run services describe salfagpt --region us-central1 --project salfagpt --format="value(spec.template.spec.containers[0].env)"
```

---

## ✅ Checklist de Éxito

Después del despliegue, verifica:

- [ ] ✅ Build exitoso (sin errores)
- [ ] ✅ Servicio desplegado (revision nueva creando)
- [ ] ✅ Health check pasa (`/api/health/firestore` retorna `healthy`)
- [ ] ✅ Login con Google funciona
- [ ] ✅ Puedes crear conversaciones
- [ ] ✅ AI responde correctamente
- [ ] ✅ Puedes subir PDFs y extraer contenido
- [ ] ✅ No hay errores en logs

---

## 🎓 Lecciones Aprendidas

### 1. Client Secret debe ser EXACTO
El error más común es que el `GOOGLE_CLIENT_SECRET` en Cloud Run no coincida con el de Google Console. **Siempre copia desde Google Console o desde tu `.env` local verificado.**

### 2. Esperar propagación de OAuth
Los cambios en OAuth pueden tardar hasta 15 minutos. **Ten paciencia** después de modificar redirect URIs.

### 3. Limpiar caché del navegador
Los navegadores cachean agresivamente. **Siempre limpia caché** o usa incógnito cuando pruebes cambios de OAuth.

### 4. Verificar el servicio correcto
Con múltiples servicios (`flow-chat`, `flow-salfacorp`, `salfagpt`), **asegúrate de actualizar el servicio correcto**.

### 5. Todas las variables son necesarias
No es suficiente con configurar solo OAuth. **Las 7 variables críticas** deben estar configuradas para que todo funcione.

---

## 🔮 Próximos Pasos (Opcional)

### Dominio Personalizado
Si quieres usar un dominio como `salfagpt.com`:

1. Configura Cloud Run Domain Mapping
2. Actualiza DNS records
3. Actualiza OAuth redirect URIs con nuevo dominio
4. Actualiza `PUBLIC_BASE_URL`

### HTTPS/SSL
Cloud Run ya incluye HTTPS automático con certificados gestionados. ✅

### Monitoring y Alertas
Configura alertas para:
- Errores de OAuth
- Errores de Firestore
- Latencia alta
- Uso de memoria

---

**¡Despliegue Exitoso! 🎉**

Tu aplicación SalfaGPT ahora está corriendo en producción con OAuth completamente funcional.

**URL de Producción:** https://salfagpt-3snj65wckq-uc.a.run.app

