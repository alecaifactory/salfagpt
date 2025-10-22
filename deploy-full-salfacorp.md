# Manual de Deployment Completo - Salfacorp (Proyecto salfagpt)

**Proyecto GCP:** salfagpt  
**Servicio Cloud Run:** salfagpt  
**Región:** us-central1  
**Última Actualización:** 2025-10-22

---

## 🎯 Resumen Ejecutivo

Este documento describe el proceso completo de deployment para el proyecto Salfacorp en Google Cloud Platform, incluyendo configuración de proyecto, autenticación, build, deploy y verificación.

---

## 📋 Pre-requisitos

### Herramientas Requeridas
- ✅ Node.js 20+ instalado
- ✅ gcloud CLI instalado y configurado
- ✅ npm instalado
- ✅ Git instalado
- ✅ Acceso al proyecto GCP `salfagpt`

### Permisos Necesarios
- ✅ Cloud Run Admin
- ✅ Cloud Build Editor  
- ✅ Firestore User
- ✅ Service Account User

---

## 🚀 Proceso de Deployment Completo

### Paso 1: Configurar Proyecto GCloud

```bash
# 1.1 Establecer proyecto activo
gcloud config set project salfagpt

# 1.2 Verificar proyecto
gcloud config get-value project
# Debe retornar: salfagpt

# 1.3 Verificar autenticación
gcloud auth list
# Debe mostrar cuenta activa (*)

# 1.4 Si no está autenticado, hacer login
gcloud auth login

# 1.5 Configurar application default credentials para Firestore
gcloud auth application-default login

# 1.6 Verificar Firestore auth
gcloud auth application-default print-access-token > /dev/null 2>&1 && echo "✅ OK"
```

**Resultado Esperado:**
```
✅ Proyecto: salfagpt
✅ Auth: activa
✅ Firestore: configurado
```

---

### Paso 2: Preparar Código

```bash
# 2.1 Asegurar en directorio correcto
cd /Users/alec/salfagpt

# 2.2 Verificar branch
git branch --show-current
# Debe ser: main

# 2.3 Pull últimos cambios (si trabajas en equipo)
git pull origin main

# 2.4 Verificar no hay cambios sin commitear
git status
# Debe mostrar: "working tree clean"

# 2.5 Verificar .env.salfacorp existe
ls -la .env.salfacorp
```

**Resultado Esperado:**
```
✅ En directorio correcto
✅ Branch: main
✅ Git clean
✅ .env.salfacorp existe
```

---

### Paso 3: Build de Producción

```bash
# 3.1 Ejecutar build
npm run build

# 3.2 Verificar build exitoso
echo $?
# Debe retornar: 0
```

**Resultado Esperado:**
```
✅ Build completo sin errores
✅ Archivos en dist/ generados
✅ Exit code: 0
```

**Tiempo Estimado:** 5-10 segundos

---

### Paso 4: Deploy a Cloud Run

```bash
# 4.1 Deploy del servicio
gcloud run deploy salfagpt \
  --source . \
  --region us-central1 \
  --project salfagpt \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s

# 4.2 Esperar a que termine (2-5 minutos)
# Cloud Build construirá la imagen automáticamente
```

**Resultado Esperado:**
```
Building Container...done
Creating Revision...done
Service [salfagpt] revision [salfagpt-00XXX-YYY] has been deployed
Service URL: https://salfagpt-3snj65wckq-uc.a.run.app
```

**Tiempo Estimado:** 2-5 minutos

**Notas:**
- La primera vez toma más tiempo (descarga dependencias)
- Deployments subsecuentes son más rápidos (cache)
- Cloud Build usa Dockerfile automáticamente

---

### Paso 5: Actualizar Variables de Entorno

```bash
# 5.1 Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"

# 5.2 Actualizar variables de entorno
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,PUBLIC_BASE_URL=$SERVICE_URL,NODE_ENV=production,GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0,GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com,JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f"
```

**Variables Críticas:**
- `GOOGLE_CLOUD_PROJECT` - Proyecto GCP
- `PUBLIC_BASE_URL` - URL del servicio (para OAuth)
- `NODE_ENV` - production
- `GOOGLE_AI_API_KEY` - Gemini AI
- `GOOGLE_CLIENT_ID` - OAuth Google
- `JWT_SECRET` - Firma de tokens de sesión

**Resultado Esperado:**
```
Creating Revision...done
Service [salfagpt] revision [salfagpt-00XXX-YYY] has been deployed
```

**Tiempo Estimado:** 30-60 segundos

---

### Paso 6: Actualizar Tráfico (Si es necesario)

```bash
# 6.1 Listar revisiones disponibles
gcloud run revisions list \
  --service salfagpt \
  --region us-central1 \
  --project salfagpt \
  --limit 5

# 6.2 Si quieres cambiar a una revisión específica
gcloud run services update-traffic salfagpt \
  --to-revisions=salfagpt-00010-94v=100 \
  --region us-central1 \
  --project salfagpt

# 6.3 O simplemente usar LATEST (recomendado)
# Ya está configurado por default
```

**Resultado Esperado:**
```
Traffic:
  100% salfagpt-00010-94v
```

---

### Paso 7: Verificación Post-Deployment

```bash
# 7.1 Verificar servicio responde
curl -I https://salfagpt-3snj65wckq-uc.a.run.app/

# Debe retornar: HTTP/2 200

# 7.2 Verificar redirect a auth funciona
curl -I https://salfagpt-3snj65wckq-uc.a.run.app/chat

# Debe retornar: HTTP/2 302 location: /auth/login

# 7.3 Ver logs en tiempo real
gcloud logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt" \
  --project salfagpt

# 7.4 Ver solo errores
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR" \
  --limit 20 \
  --project salfagpt

# 7.5 Verificar métricas
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="table(status.url,status.traffic)"
```

**Checklist de Verificación:**
- [ ] Servicio responde HTTP 200
- [ ] Redirect a /auth/login funciona
- [ ] No errores críticos en logs
- [ ] Variables de entorno configuradas
- [ ] Tráfico 100% en revisión correcta

---

## 🔧 Configuración del Servicio

### Especificaciones Cloud Run

```yaml
Service Name: salfagpt
Region: us-central1
Project: salfagpt

Resources:
  Memory: 2Gi
  CPU: 2
  Timeout: 300s (5 minutos)

Scaling:
  Min Instances: 1
  Max Instances: 10

Network:
  Allow Unauthenticated: Yes
  Ingress: All

Build:
  Method: Dockerfile (Cloud Build)
  Source: . (directorio actual)
```

### URLs Importantes

- **Servicio:** https://salfagpt-3snj65wckq-uc.a.run.app
- **Console:** https://console.cloud.google.com/run/detail/us-central1/salfagpt?project=salfagpt
- **Logs:** https://console.cloud.google.com/logs/query?project=salfagpt
- **Cloud Build:** https://console.cloud.google.com/cloud-build/builds?project=salfagpt

---

## 🔐 Variables de Entorno en Producción

### Variables Requeridas

```bash
GOOGLE_CLOUD_PROJECT=salfagpt
PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app
NODE_ENV=production

# API Keys (mantener secretas)
GOOGLE_AI_API_KEY=AIzaSy... (Gemini AI)
GOOGLE_CLIENT_ID=82892384200-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-... (si aplica)
JWT_SECRET=df45d920... (firma de sesiones)

# Configuración RAG (opcionales, tienen defaults)
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001

# Configuración de sesión (opcionales)
SESSION_COOKIE_NAME=salfagpt_session
SESSION_MAX_AGE=86400
```

### Cómo Actualizar Variables

```bash
# Actualizar una variable
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="VARIABLE_NAME=nuevo_valor"

# Actualizar múltiples variables
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="VAR1=valor1,VAR2=valor2,VAR3=valor3"

# Remover una variable
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --remove-env-vars="VARIABLE_NAME"
```

---

## 🔄 Rollback en Caso de Problemas

### Opción 1: Rollback a Revisión Anterior

```bash
# 1. Listar revisiones
gcloud run revisions list \
  --service salfagpt \
  --region us-central1 \
  --project salfagpt \
  --limit 5

# 2. Identificar revisión anterior (ej: salfagpt-00009-fdt)
PREVIOUS_REVISION="salfagpt-00009-fdt"

# 3. Actualizar tráfico a revisión anterior
gcloud run services update-traffic salfagpt \
  --to-revisions=$PREVIOUS_REVISION=100 \
  --region us-central1 \
  --project salfagpt

# 4. Verificar
curl -I https://salfagpt-3snj65wckq-uc.a.run.app/
```

### Opción 2: Rollback Rápido a Revisión Inmediata Anterior

```bash
# One-liner rollback
PREV_REV=$(gcloud run revisions list --service salfagpt --region us-central1 --project salfagpt --format="value(name)" --limit 2 | tail -1) && \
gcloud run services update-traffic salfagpt --to-revisions=$PREV_REV=100 --region us-central1 --project salfagpt && \
echo "✅ Rollback a $PREV_REV completo"
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Todos los logs
gcloud logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt" \
  --project salfagpt

# Solo errores
gcloud logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR" \
  --project salfagpt
```

### Ver Logs Históricos

```bash
# Últimos 50 logs
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt" \
  --limit 50 \
  --project salfagpt

# Últimos errores (últimas 24 horas)
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR" \
  --limit 20 \
  --project salfagpt \
  --freshness=1d
```

### Métricas Clave

```bash
# Información del servicio
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="table(status.url,status.traffic,metadata.generation)"
```

---

## 🔍 Troubleshooting

### Problema 1: Build Falla

**Síntoma:** Error durante `npm run build`

**Diagnóstico:**
```bash
# Ver errores de TypeScript
npm run type-check

# Ver advertencias
npm run build 2>&1 | grep -i error
```

**Soluciones:**
1. Corregir errores de TypeScript
2. Verificar dependencias: `npm install`
3. Limpiar cache: `rm -rf node_modules/.vite dist .astro`

### Problema 2: Deploy Falla

**Síntoma:** Cloud Build falla

**Diagnóstico:**
```bash
# Ver logs de Cloud Build
gcloud builds list --project salfagpt --limit 5

# Ver detalles del último build
BUILD_ID=$(gcloud builds list --project salfagpt --limit 1 --format="value(id)")
gcloud builds log $BUILD_ID --project salfagpt
```

**Soluciones:**
1. Verificar Dockerfile es válido
2. Verificar permisos de Cloud Build
3. Revisar logs del build

### Problema 3: Servicio No Responde

**Síntoma:** 502 Bad Gateway o 503 Service Unavailable

**Diagnóstico:**
```bash
# Ver estado del servicio
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt

# Ver logs de container
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt" \
  --limit 50 \
  --project salfagpt
```

**Soluciones:**
1. Verificar variables de entorno (Paso 5)
2. Incrementar memoria/CPU si es necesario
3. Revisar logs para errores de startup

### Problema 4: Variables de Entorno No Aplicadas

**Síntoma:** Servicio usa valores incorrectos

**Diagnóstico:**
```bash
# Ver variables actuales
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="value(spec.template.spec.containers[0].env)"
```

**Solución:**
```bash
# Re-aplicar variables (Paso 5)
# Asegurar que PUBLIC_BASE_URL coincida con la URL del servicio
```

---

## 🔐 Seguridad

### Secretos

**NUNCA commitear a Git:**
- ❌ `GOOGLE_AI_API_KEY`
- ❌ `JWT_SECRET`
- ❌ `GOOGLE_CLIENT_SECRET`

**Dónde Almacenar:**
- ✅ `.env.salfacorp` (local, .gitignored)
- ✅ Cloud Run environment variables (producción)
- ✅ Secret Manager (opcional, más seguro)

### Usando Secret Manager (Alternativa Segura)

```bash
# 1. Crear secret
echo -n "valor-secreto" | gcloud secrets create nombre-secret \
  --data-file=- \
  --project salfagpt

# 2. Dar acceso al service account
gcloud secrets add-iam-policy-binding nombre-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project salfagpt

# 3. Montar en Cloud Run
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --set-secrets="VARIABLE_NAME=nombre-secret:latest"
```

---

## 📈 Optimizaciones

### Performance

```bash
# Incrementar recursos si es necesario
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --memory 4Gi \
  --cpu 4

# Incrementar instancias mínimas para "warm start"
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --min-instances 2
```

### Costos

```bash
# Reducir instancias mínimas para ahorrar
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --min-instances 0

# Ver uso actual
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="value(status.traffic)"
```

---

## 🎯 Checklist de Deployment

### Pre-Deployment
- [ ] Código commiteado y pusheado
- [ ] `npm run build` exitoso
- [ ] `npm run type-check` sin errores
- [ ] Tests manuales en localhost pasados
- [ ] `.env.salfacorp` actualizado con valores correctos

### Durante Deployment
- [ ] `gcloud config set project salfagpt` ejecutado
- [ ] `gcloud auth` verificado
- [ ] `gcloud run deploy` completado sin errores
- [ ] Variables de entorno actualizadas
- [ ] Tráfico asignado a nueva revisión

### Post-Deployment
- [ ] Servicio responde (HTTP 200)
- [ ] Auth redirect funciona (HTTP 302)
- [ ] No errores en logs
- [ ] Funcionalidad principal testeada
- [ ] Documentación actualizada

---

## 📝 Comando One-Liner Completo

Para deployments rutinarios (después del primer setup):

```bash
cd /Users/alec/salfagpt && \
npm run build && \
gcloud config set project salfagpt && \
gcloud run deploy salfagpt \
  --source . \
  --region us-central1 \
  --project salfagpt \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s && \
SERVICE_URL=$(gcloud run services describe salfagpt --region us-central1 --project salfagpt --format='value(status.url)') && \
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,PUBLIC_BASE_URL=$SERVICE_URL,NODE_ENV=production,GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0,GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com,JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f" && \
echo "" && \
echo "✅ DEPLOYMENT COMPLETO" && \
echo "URL: $SERVICE_URL"
```

**Tiempo Total:** ~3-7 minutos

---

## 📚 Información del Deployment Actual

### Última Ejecución: 2025-10-22

```
✅ Proyecto: salfagpt
✅ Servicio: salfagpt
✅ Revisión: salfagpt-00010-94v
✅ URL: https://salfagpt-3snj65wckq-uc.a.run.app
✅ Tráfico: 100%
✅ Status: HTTP 200 OK
✅ Variables: Todas configuradas
```

### Cambios Deployados

1. **fix:** Restore references and chunks display
2. **feat:** BigQuery agent-source assignments sync
3. **debug:** Add detailed logging
4. **fix:** Use userId instead of undefined session
5. **docs:** Deployment documentation

---

## 🆘 Soporte

### Comandos Útiles

```bash
# Ver información del proyecto
gcloud config list

# Ver servicios en el proyecto
gcloud run services list --project salfagpt

# Ver todas las revisiones
gcloud run revisions list --region us-central1 --project salfagpt

# Describir servicio completo
gcloud run services describe salfagpt --region us-central1 --project salfagpt

# Ver builds recientes
gcloud builds list --project salfagpt --limit 10
```

### Contactos

- **Proyecto:** salfagpt (Salfacorp)
- **Documentación:** Este archivo
- **Logs:** Console de GCP

---

## 🎓 Notas Importantes

### Diferencias entre Servicios

En el proyecto salfagpt hay **3 servicios**:

1. **salfagpt** - Servicio principal actual ⭐
   - URL: https://salfagpt-3snj65wckq-uc.a.run.app
   - Status: Activo
   - Uso: Producción Salfacorp

2. **flow-production** - Servicio alternativo
   - URL: https://flow-production-3snj65wckq-uc.a.run.app
   - Status: Activo
   - Uso: Testing/staging

3. **flow-chat** - Servicio legacy
   - URL: https://flow-chat-...run.app
   - Status: Activo
   - Uso: Legacy

**Recomendación:** Usar servicio **salfagpt** para producción Salfacorp.

### Build Method

El proyecto usa **Dockerfile** para el build:
- Cloud Build detecta `Dockerfile` automáticamente
- Construye imagen optimizada para producción
- Cache de layers para builds rápidos

### Autenticación OAuth

Después del deployment, verificar en Google Cloud Console:
- **Redirect URI autorizado:** https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
- Si la URL cambió, actualizar en Console

---

## ✅ Success Criteria

Un deployment exitoso debe cumplir:

1. **Build:** ✅ Exit code 0, sin errores
2. **Deploy:** ✅ Revision created, traffic routed
3. **Health:** ✅ HTTP 200 en /
4. **Auth:** ✅ HTTP 302 redirect en /chat
5. **Logs:** ✅ Sin errores críticos
6. **Variables:** ✅ Todas configuradas
7. **Traffic:** ✅ 100% en nueva revisión

---

**Última Revisión:** 2025-10-22  
**Versión:** 1.0.0  
**Mantenedor:** Alec (alec@getaifactory.com)

