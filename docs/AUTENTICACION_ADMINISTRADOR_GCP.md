# 🔐 Guía de Autenticación de Administrador - GCP SALFAGPT

**Usuario Administrador:** alec@salfacloud.cl  
**Proyecto:** salfagpt (82892384200)  
**Cliente:** SALFACORP  
**Fecha:** 2025-11-04

---

## 🎯 Propósito

Este documento detalla cómo usar las credenciales de **alec@salfacloud.cl** para gestionar todos los aspectos del proyecto SALFAGPT en Google Cloud Platform.

---

## 👤 Credenciales de Administrador

### Información de la Cuenta

**Email:** `alec@salfacloud.cl`  
**Tipo:** Google Workspace account (SALFACORP)  
**Rol en Proyecto:** Owner (Propietario)  
**Permisos:** Acceso completo a todos los servicios GCP

**Servicios Accesibles:**
- ✅ Cloud Run (deployment, configuración)
- ✅ Firestore (base de datos)
- ✅ Cloud Storage (buckets, archivos)
- ✅ Load Balancing (networking)
- ✅ BigQuery (analytics)
- ✅ Secret Manager (secretos)
- ✅ IAM (permisos)
- ✅ Billing (facturación)
- ✅ Monitoring (métricas)
- ✅ Logging (logs)

---

## 🔧 Configuración Inicial (Setup)

### 1. Instalar Google Cloud SDK

#### macOS (Homebrew)
```bash
brew install google-cloud-sdk
```

#### Linux
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Windows
Descargar de: https://cloud.google.com/sdk/docs/install

**Verificar instalación:**
```bash
gcloud --version
# Output:
# Google Cloud SDK 456.0.0
# ...
```

---

### 2. Autenticación Completa (3 Pasos)

#### Paso 1: Login Principal (gcloud)

```bash
gcloud auth login
```

**Proceso:**
1. Se abre navegador automáticamente
2. Seleccionar cuenta: **alec@salfacloud.cl**
3. Permitir acceso a Google Cloud SDK
4. Verificar success en terminal

**Verificar:**
```bash
gcloud auth list
# Expected:
#        Credentialed Accounts
# ACTIVE  ACCOUNT
# *       alec@salfacloud.cl
```

---

#### Paso 2: Application Default Credentials (ADC)

```bash
gcloud auth application-default login
```

**Propósito:** 
- Permite que aplicaciones locales (Node.js, Python) accedan a GCP
- Usado por Firestore, BigQuery, Storage en desarrollo local
- Crea archivo: `~/.config/gcloud/application_default_credentials.json`

**Proceso:**
1. Se abre navegador
2. Seleccionar cuenta: **alec@salfacloud.cl**
3. Permitir acceso para Application Default Credentials
4. Credenciales guardadas localmente

**Verificar:**
```bash
ls ~/.config/gcloud/application_default_credentials.json
# File should exist

cat ~/.config/gcloud/application_default_credentials.json | jq '.client_email'
# Should show: "alec@salfacloud.cl" or similar
```

---

#### Paso 3: Configurar Proyecto por Defecto

```bash
gcloud config set project salfagpt
```

**Verificar configuración completa:**
```bash
gcloud config list
```

**Output esperado:**
```
[core]
account = alec@salfacloud.cl
disable_usage_reporting = True
project = salfagpt

Your active configuration is: [default]
```

**Verificar acceso al proyecto:**
```bash
gcloud projects describe salfagpt
```

**Output esperado:**
```
createTime: '2024-XX-XXT00:00:00.000Z'
name: SALFAGPT
projectId: salfagpt
projectNumber: '82892384200'
state: ACTIVE
```

---

## 🚀 Operaciones Comunes

### Deployment a Producción

```bash
# Asegurar autenticación y proyecto correcto
gcloud config set project salfagpt

# Verificar credenciales
gcloud auth list | grep alec@salfacloud.cl

# Navegar al proyecto
cd /Users/alec/salfagpt

# Build local
npm run type-check
npm run build

# Deploy a Cloud Run
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt \
  --platform=managed \
  --allow-unauthenticated
```

**Durante deployment:**
- Se construye imagen Docker (Cloud Build)
- Se sube a Artifact Registry
- Se despliega nueva revision en Cloud Run
- Traffic se migra automáticamente (blue/green)

**Duración:** 5-8 minutos

---

### Gestión de Firestore

#### Acceso a Base de Datos

**Console Web:**
```bash
# Abrir Firestore console
open "https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=salfagpt"
```

**CLI (Query desde terminal):**
```bash
# Listar colecciones
gcloud firestore collections list --project=salfagpt

# Query documents (ejemplo: listar usuarios)
gcloud firestore documents query \
  --collection-id=users \
  --project=salfagpt
```

**Node.js (Scripts locales):**
```typescript
// scripts/query-firestore.ts
import { firestore } from '../src/lib/firestore';

async function queryUsers() {
  const snapshot = await firestore.collection('users').limit(10).get();
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

queryUsers();
```

```bash
# Ejecutar script
npx tsx scripts/query-firestore.ts
```

**ADC permite acceso automático sin código adicional de auth**

---

#### Backups y Restore

**Exportar Firestore:**
```bash
# Backup completo
gcloud firestore export \
  gs://salfagpt-backups/backup-$(date +%Y%m%d-%H%M%S) \
  --project=salfagpt

# Backup de colecciones específicas
gcloud firestore export \
  gs://salfagpt-backups/users-backup-$(date +%Y%m%d) \
  --collection-ids=users,conversations,messages \
  --project=salfagpt
```

**Importar Firestore:**
```bash
# Restaurar desde backup
gcloud firestore import \
  gs://salfagpt-backups/backup-20251104-100000 \
  --project=salfagpt

# ⚠️ CUIDADO: Esto sobreescribe datos existentes
```

---

### Gestión de Cloud Storage

#### Subir Archivos

```bash
# Subir archivo individual
gsutil cp archivo-local.pdf gs://salfagpt-uploads/documents/

# Subir carpeta completa
gsutil -m cp -r carpeta-local/* gs://salfagpt-uploads/documents/

# Verificar
gsutil ls gs://salfagpt-uploads/documents/ | tail -5
```

#### Descargar Archivos

```bash
# Descargar archivo
gsutil cp gs://salfagpt-uploads/documents/file.pdf ./local-file.pdf

# Descargar carpeta
gsutil -m cp -r gs://salfagpt-uploads/documents/ ./local-docs/
```

#### Gestión de Permisos

```bash
# Ver permisos del bucket
gsutil iam get gs://salfagpt-uploads

# Otorgar acceso a service account
gsutil iam ch \
  serviceAccount:82892384200-compute@developer.gserviceaccount.com:roles/storage.objectAdmin \
  gs://salfagpt-uploads
```

---

### Gestión de Secrets

#### Ver Secrets

```bash
# Listar todos los secrets
gcloud secrets list --project=salfagpt

# Ver versiones de un secret
gcloud secrets versions list GOOGLE_AI_API_KEY --project=salfagpt

# Leer valor de un secret (última versión)
gcloud secrets versions access latest \
  --secret=GOOGLE_AI_API_KEY \
  --project=salfagpt
```

**⚠️ Seguridad:** Los valores de secrets son sensibles, no los compartas

---

#### Crear/Actualizar Secrets

**Crear nuevo secret:**
```bash
# Desde prompt
echo -n "valor-del-secreto" | gcloud secrets create NUEVO_SECRET \
  --data-file=- \
  --replication-policy=automatic \
  --project=salfagpt

# Desde archivo
gcloud secrets create NUEVO_SECRET \
  --data-file=secret.txt \
  --project=salfagpt
```

**Actualizar secret (nueva versión):**
```bash
echo -n "nuevo-valor" | gcloud secrets versions add GOOGLE_AI_API_KEY \
  --data-file=- \
  --project=salfagpt
```

**Otorgar acceso al Cloud Run service account:**
```bash
gcloud secrets add-iam-policy-binding GOOGLE_AI_API_KEY \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=salfagpt
```

---

### Monitoreo y Logs

#### Ver Logs en Tiempo Real

```bash
# Seguir logs de Cloud Run
gcloud alpha logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=cr-salfagpt-ai-ft-prod" \
  --project=salfagpt

# Filtrar por severidad
gcloud alpha logging tail \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --project=salfagpt
```

#### Búsqueda de Logs Históricos

```bash
# Últimos 50 logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 \
  --project=salfagpt \
  --format=json

# Logs de autenticación
gcloud logging read \
  "resource.type=cloud_run_revision AND textPayload=~'OAuth'" \
  --limit=20 \
  --project=salfagpt

# Logs de errores de Firestore
gcloud logging read \
  "resource.type=cloud_run_revision AND textPayload=~'PERMISSION_DENIED'" \
  --limit=20 \
  --project=salfagpt

# Logs en rango de tiempo
gcloud logging read \
  "resource.type=cloud_run_revision AND timestamp>=\"2025-11-04T00:00:00Z\"" \
  --project=salfagpt
```

---

### Gestión de Permisos (IAM)

#### Ver Permisos del Proyecto

```bash
# Listar todos los miembros y sus roles
gcloud projects get-iam-policy salfagpt

# Filtrar por usuario específico
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:alec@salfacloud.cl"

# Ver permisos del service account
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:82892384200-compute@developer.gserviceaccount.com" \
  --format="table(bindings.role)"
```

#### Otorgar Permisos

```bash
# Otorgar rol a service account
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/NOMBRE_DEL_ROL"

# Otorgar rol a usuario
gcloud projects add-iam-policy-binding salfagpt \
  --member="user:usuario@ejemplo.com" \
  --role="roles/NOMBRE_DEL_ROL"
```

#### Revocar Permisos

```bash
gcloud projects remove-iam-policy-binding salfagpt \
  --member="serviceAccount:EMAIL" \
  --role="roles/NOMBRE_DEL_ROL"
```

---

## 🛠️ Desarrollo Local con Credenciales de Admin

### Configuración del Entorno Local

**Después de completar la autenticación (3 pasos):**

```bash
# 1. Clonar repositorio
git clone https://github.com/org/salfagpt.git
cd salfagpt

# 2. Instalar dependencias
npm install

# 3. Crear .env local
cp .env.example .env

# 4. Editar .env
nano .env
```

**Contenido de `.env` local:**
```bash
# GCP Configuration
GOOGLE_CLOUD_PROJECT=salfagpt

# AI API Keys
GOOGLE_AI_API_KEY=AIzaSy***  # Obtener de Secret Manager o console

# OAuth Configuration (MISMO que producción)
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***  # Obtener de Secret Manager

# Authentication
JWT_SECRET=***  # Generar local: openssl rand -base64 32

# Application Configuration
PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

**Obtener secretos de producción:**
```bash
# Ver valor de un secret
gcloud secrets versions access latest \
  --secret=GOOGLE_AI_API_KEY \
  --project=salfagpt

# Copiar a .env
echo "GOOGLE_AI_API_KEY=$(gcloud secrets versions access latest --secret=GOOGLE_AI_API_KEY --project=salfagpt)" >> .env
```

---

### Ejecutar Localmente

```bash
# Con ADC configurado, el código local accederá a Firestore/Storage en GCP
npm run dev
```

**El servidor local (`http://localhost:3000`) tendrá acceso a:**
- ✅ Firestore en `salfagpt` (via ADC)
- ✅ Cloud Storage `salfagpt-uploads` (via ADC)
- ✅ BigQuery `flow_analytics` (via ADC)
- ✅ Todos los servicios GCP

**Verificación:**
```bash
# Abrir en navegador
open http://localhost:3000

# Login debe funcionar
# Datos deben cargar de Firestore real
# Uploads deben ir a Cloud Storage real
```

**⚠️ CUIDADO:** Estás trabajando con datos de producción. Usa cuentas de prueba.

---

## 🔄 Flujo de Trabajo Típico

### Desarrollo → Testing → Deployment

```bash
# 1. Desarrollo local
cd /Users/alec/salfagpt
git checkout -b feat/nueva-feature-2025-11-04

# ADC permite acceso a Firestore/Storage real
npm run dev
# Desarrollar feature...

# 2. Testing
npm run type-check  # TypeScript
npm run build       # Build verification
# Test manual en http://localhost:3000

# 3. Commit
git add .
git commit -m "feat: Nueva feature XYZ"
git push origin feat/nueva-feature-2025-11-04

# 4. Merge to main
git checkout main
git merge feat/nueva-feature-2025-11-04
git push origin main

# 5. Deploy a producción
gcloud config set project salfagpt  # Asegurar proyecto correcto
gcloud auth list  # Verificar alec@salfacloud.cl activo

gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt \
  --allow-unauthenticated

# 6. Verificación post-deploy
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.'
open https://salfagpt.salfagestion.cl
# Test completo en producción
```

---

## 🔐 Gestión de Accesos Multi-Usuario (Futuro)

### Otorgar Acceso a Otros Desarrolladores

**Escenario:** Agregar nuevo developer al proyecto

```bash
# 1. Invitar usuario al proyecto
gcloud projects add-iam-policy-binding salfagpt \
  --member="user:developer@salfacorp.cl" \
  --role="roles/editor"

# 2. Roles recomendados por tipo de usuario
# Developer: roles/editor (puede modificar recursos)
# DevOps: roles/owner (deployment + billing)
# Viewer: roles/viewer (solo lectura)

# 3. Notificar al usuario
# Ellos deberán:
# - gcloud auth login (con su cuenta)
# - gcloud config set project salfagpt
# - gcloud auth application-default login
```

**Permisos Granulares (Opcional):**
```bash
# Solo Cloud Run
gcloud projects add-iam-policy-binding salfagpt \
  --member="user:devops@salfacorp.cl" \
  --role="roles/run.admin"

# Solo Firestore
gcloud projects add-iam-policy-binding salfagpt \
  --member="user:db-admin@salfacorp.cl" \
  --role="roles/datastore.owner"
```

---

### Revocar Acceso

```bash
# Listar roles de un usuario
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:developer@salfacorp.cl"

# Revocar rol específico
gcloud projects remove-iam-policy-binding salfagpt \
  --member="user:developer@salfacorp.cl" \
  --role="roles/editor"
```

---

## 🔍 Debugging y Troubleshooting

### Problema: "You do not have permission"

**Síntoma:**
```
ERROR: (gcloud.X.Y) You do not have permission to access project [salfagpt]
```

**Diagnóstico:**
```bash
# 1. Verificar cuenta activa
gcloud auth list
# ¿Es alec@salfacloud.cl la cuenta ACTIVE?

# 2. Verificar proyecto configurado
gcloud config get-value project
# ¿Es "salfagpt"?

# 3. Verificar permisos
gcloud projects get-iam-policy salfagpt \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:alec@salfacloud.cl"
# ¿Aparece en la lista?
```

**Soluciones:**
```bash
# A. Cambiar a cuenta correcta
gcloud config set account alec@salfacloud.cl

# B. Re-autenticar
gcloud auth login
# Seleccionar alec@salfacloud.cl

# C. Configurar proyecto
gcloud config set project salfagpt

# D. Si aún falla, verificar en GCP Console
# que alec@salfacloud.cl tiene rol de Owner
```

---

### Problema: ADC no funciona localmente

**Síntoma:**
```
Error: Could not load the default credentials
```

**Solución:**
```bash
# 1. Re-hacer ADC login
gcloud auth application-default login
# Seleccionar: alec@salfacloud.cl

# 2. Verificar archivo de credenciales
ls -la ~/.config/gcloud/application_default_credentials.json

# 3. Si no existe, volver a hacer login

# 4. Verificar variable de entorno no sobreescribe
echo $GOOGLE_APPLICATION_CREDENTIALS
# Debe estar vacío o apuntar al archivo correcto
```

---

### Problema: Firestore permission denied en local

**Síntoma:**
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Diagnóstico:**
```bash
# 1. Verificar ADC configurado
cat ~/.config/gcloud/application_default_credentials.json | jq '.type'
# Expected: "authorized_user"

# 2. Verificar proyecto en código
grep GOOGLE_CLOUD_PROJECT .env
# Expected: GOOGLE_CLOUD_PROJECT=salfagpt

# 3. Verificar permisos de alec@salfacloud.cl en proyecto
gcloud projects get-iam-policy salfagpt | grep alec@salfacloud.cl
```

**Solución:**
```bash
# Si no aparece, otorgar permiso
gcloud projects add-iam-policy-binding salfagpt \
  --member="user:alec@salfacloud.cl" \
  --role="roles/owner"
```

---

## 🎯 Best Practices

### Seguridad

1. **Nunca commitear credenciales**
   - `.env` está en `.gitignore` ✅
   - Secrets solo en Secret Manager
   - API keys nunca en código

2. **Rotar secrets regularmente**
   ```bash
   # Cada 90 días, crear nueva versión
   echo -n "nuevo-valor" | gcloud secrets versions add SECRET_NAME --data-file=-
   ```

3. **Usar service accounts en producción**
   - Cloud Run usa service account (no cuenta personal)
   - ADC solo para desarrollo local

4. **Revisar logs de acceso**
   ```bash
   gcloud logging read "protoPayload.authenticationInfo.principalEmail=alec@salfacloud.cl" \
     --limit=50 --project=salfagpt
   ```

---

### Organización

1. **Un proyecto por ambiente**
   - Producción: `salfagpt`
   - Staging: `salfagpt-staging` (si se crea)
   - Development: Local (apunta a salfagpt con ADC)

2. **Documentar todos los cambios**
   - Update `docs/CHANGELOG.md` con deployments
   - Commit messages descriptivos
   - Tag releases: `git tag v1.0.0`

3. **Mantener sincronizado**
   - Local `.env` refleja variables de producción
   - OAuth redirect URIs incluyen localhost
   - Documentation actualizada

---

### Performance

1. **Usar región cercana a usuarios**
   - Cloud Run: `us-east4` (cerca de East Coast USA/LATAM)
   - Firestore: `us-central1` (central USA)
   - Storage: `us-central1` (colocation con Firestore)

2. **Min instances = 1** (evitar cold starts)
   ```bash
   gcloud run services update cr-salfagpt-ai-ft-prod \
     --min-instances=1 \
     --region=us-east4 \
     --project=salfagpt
   ```

3. **Monitor latencias**
   ```bash
   # Ver latencias p95
   gcloud monitoring timeseries list \
     --filter='metric.type="run.googleapis.com/request_latencies"' \
     --project=salfagpt
   ```

---

## 📋 Checklist de Administrador

### Setup Inicial (Una vez)
- [x] gcloud SDK instalado
- [x] `gcloud auth login` (alec@salfacloud.cl)
- [x] `gcloud auth application-default login`
- [x] `gcloud config set project salfagpt`
- [x] Verificar acceso a Firestore
- [x] Verificar acceso a Cloud Storage
- [x] `.env` local configurado

### Antes de Cada Deployment
- [ ] `gcloud config get-value project` → `salfagpt` ✅
- [ ] `gcloud auth list` → `alec@salfacloud.cl` activo ✅
- [ ] `npm run type-check` → 0 errores
- [ ] `npm run build` → exitoso
- [ ] Test manual en localhost
- [ ] Variables de entorno verificadas
- [ ] Backup reciente de Firestore

### Después de Cada Deployment
- [ ] Health check pasa
- [ ] Login funciona
- [ ] Features principales verificadas
- [ ] No errores críticos en logs (últimos 20)
- [ ] Latencia aceptable (<3s p95)
- [ ] Documentar en CHANGELOG

### Mantenimiento Semanal
- [ ] Revisar logs de errores
- [ ] Verificar costos en Billing
- [ ] Revisar métricas de performance
- [ ] Verificar uptime
- [ ] Backup manual si es crítico

### Mantenimiento Mensual
- [ ] Revisar y actualizar dependencias
- [ ] Rotar secrets (cada 90 días)
- [ ] Revisar permisos IAM
- [ ] Limpiar archivos viejos en Storage
- [ ] Revisar y optimizar costos

---

## 🆘 Contactos y Soporte

### Soporte Técnico GCP

**Cloud Console:** https://console.cloud.google.com/support?project=salfagpt

**Niveles de Soporte:**
- Basic: Incluido (documentación, community)
- Standard: $29/mes (soporte 24/7)
- Enhanced: $500/mes (SLA 1 hora)
- Premium: Custom pricing (TAM dedicado)

**Recursos:**
- Documentación: https://cloud.google.com/docs
- Stack Overflow: Tag `google-cloud-platform`
- GitHub Issues: Repositorios oficiales de GCP

---

### Contactos del Proyecto

**Administrador del Proyecto:**
- Nombre: Alec
- Email: alec@salfacloud.cl
- Rol: Owner, Lead Developer

**Cliente:**
- Organización: SALFACORP
- Contacto: (por definir)

---

## 📖 Referencias Útiles

### Documentación GCP Oficial

- **Cloud Run:** https://cloud.google.com/run/docs
- **Firestore:** https://cloud.google.com/firestore/docs
- **Cloud Storage:** https://cloud.google.com/storage/docs
- **Load Balancing:** https://cloud.google.com/load-balancing/docs
- **IAM:** https://cloud.google.com/iam/docs
- **Secret Manager:** https://cloud.google.com/secret-manager/docs

### Documentación del Proyecto

- `docs/ARQUITECTURA_COMPLETA_GCP.md` - Arquitectura completa
- `PRODUCTION_LOGIN_FIX_COMPLETE_2025-11-03.md` - Fix de producción
- `docs/OAUTH_FINAL_CONFIG_2025-11-03.md` - Configuración OAuth
- `.cursor/rules/gcp-services-permissions.mdc` - Permisos y servicios
- `GCP_SERVICES_QUICK_REFERENCE.md` - Referencia rápida

### Comandos Frecuentes

**Ver en:** `GCP_SERVICES_QUICK_REFERENCE.md`

---

## ✅ Verificación de Setup

**Ejecutar para verificar que todo está correctamente configurado:**

```bash
#!/bin/bash
echo "🔍 Verificación de Setup de Administrador"
echo "=========================================="

# 1. gcloud instalado
if command -v gcloud &> /dev/null; then
  echo "✅ gcloud SDK instalado"
  gcloud --version | head -1
else
  echo "❌ gcloud SDK no encontrado"
fi

# 2. Usuario autenticado
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ "$ACCOUNT" = "alec@salfacloud.cl" ]; then
  echo "✅ Cuenta correcta: $ACCOUNT"
else
  echo "⚠️  Cuenta actual: $ACCOUNT (esperado: alec@salfacloud.cl)"
fi

# 3. Proyecto configurado
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT" = "salfagpt" ]; then
  echo "✅ Proyecto correcto: $PROJECT"
else
  echo "⚠️  Proyecto actual: $PROJECT (esperado: salfagpt)"
fi

# 4. ADC configurado
if [ -f ~/.config/gcloud/application_default_credentials.json ]; then
  echo "✅ Application Default Credentials configurado"
else
  echo "⚠️  ADC no encontrado - ejecutar: gcloud auth application-default login"
fi

# 5. Acceso a Firestore
if gcloud firestore databases list --project=salfagpt &>/dev/null; then
  echo "✅ Acceso a Firestore verificado"
else
  echo "❌ No se puede acceder a Firestore"
fi

# 6. Acceso a Cloud Run
if gcloud run services list --project=salfagpt &>/dev/null; then
  echo "✅ Acceso a Cloud Run verificado"
else
  echo "❌ No se puede acceder a Cloud Run"
fi

# 7. .env local existe
if [ -f .env ]; then
  echo "✅ Archivo .env existe"
  if grep -q "GOOGLE_CLOUD_PROJECT=salfagpt" .env; then
    echo "✅ .env tiene GOOGLE_CLOUD_PROJECT=salfagpt"
  else
    echo "⚠️  .env no tiene GOOGLE_CLOUD_PROJECT correcto"
  fi
else
  echo "⚠️  Archivo .env no encontrado"
fi

echo ""
echo "Resumen:"
if [ "$ACCOUNT" = "alec@salfacloud.cl" ] && [ "$PROJECT" = "salfagpt" ]; then
  echo "✅ Setup completo y correcto!"
else
  echo "⚠️  Hay configuraciones que corregir"
fi
```

**Guardar como:** `scripts/verify-admin-setup.sh`

**Ejecutar:**
```bash
chmod +x scripts/verify-admin-setup.sh
./scripts/verify-admin-setup.sh
```

---

## 🔄 Cambio de Cuenta (Switch entre proyectos)

### Si trabajas en múltiples proyectos GCP

```bash
# Ver todas las configuraciones
gcloud config configurations list

# Crear configuración específica para SALFAGPT
gcloud config configurations create salfagpt-config

# Activar configuración
gcloud config configurations activate salfagpt-config

# Configurar
gcloud config set account alec@salfacloud.cl
gcloud config set project salfagpt

# Verificar
gcloud config list
```

**Cambiar entre configuraciones:**
```bash
# Activar config de SALFAGPT
gcloud config configurations activate salfagpt-config

# Activar config de otro proyecto
gcloud config configurations activate otro-proyecto-config
```

---

## 🎓 Lecciones Aprendidas

### 1. Application Default Credentials es CRÍTICO

**Sin ADC:** Código local no puede acceder a Firestore/Storage  
**Con ADC:** Todo funciona transparentemente

**Siempre ejecutar después de clonar repo:**
```bash
gcloud auth application-default login
```

---

### 2. Project ID vs Service Name

**NEVER confundir:**
- Project ID: `salfagpt` ✅
- Service Name: `cr-salfagpt-ai-ft-prod` ❌

**Usar en código:**
```typescript
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT; // "salfagpt"
```

---

### 3. Secretos en Secret Manager

**Desarrollo local:** Puede copiar de Secret Manager a `.env`  
**Producción:** Cloud Run lee directamente de Secret Manager

**Nunca:**
- ❌ Commitear `.env` con secrets reales
- ❌ Hardcodear secrets en código
- ❌ Compartir secrets por Slack/Email

---

## 📊 Dashboard del Administrador

### URLs Importantes

**GCP Console Principal:**
```
https://console.cloud.google.com/home/dashboard?project=salfagpt
```

**Servicios Específicos:**
- **Cloud Run:** https://console.cloud.google.com/run?project=salfagpt
- **Firestore:** https://console.cloud.google.com/firestore?project=salfagpt
- **Cloud Storage:** https://console.cloud.google.com/storage?project=salfagpt
- **Load Balancing:** https://console.cloud.google.com/net-services/loadbalancing?project=salfagpt
- **IAM:** https://console.cloud.google.com/iam-admin/iam?project=salfagpt
- **Billing:** https://console.cloud.google.com/billing?project=salfagpt
- **Logging:** https://console.cloud.google.com/logs?project=salfagpt
- **Monitoring:** https://console.cloud.google.com/monitoring?project=salfagpt
- **APIs & Services:** https://console.cloud.google.com/apis/dashboard?project=salfagpt

**URLs de la Aplicación:**
- **Producción:** https://salfagpt.salfagestion.cl
- **Alternate:** https://ia.salfagpt.salfagestion.cl
- **Cloud Run Direct:** https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
- **Localhost:** http://localhost:3000

---

## 🔒 Seguridad de Credenciales

### Protección de la Cuenta alec@salfacloud.cl

**Recomendaciones:**

1. **2-Factor Authentication (2FA)**
   ```
   Google Account → Security → 2-Step Verification
   Habilitar para alec@salfacloud.cl
   ```

2. **Revisar actividad sospechosa**
   ```bash
   # Ver últimas acciones de la cuenta
   gcloud logging read \
     "protoPayload.authenticationInfo.principalEmail=alec@salfacloud.cl" \
     --limit=50 --project=salfagpt
   ```

3. **Backup de Application Default Credentials**
   ```bash
   # Backup del archivo de credenciales
   cp ~/.config/gcloud/application_default_credentials.json \
      ~/Backups/adc-backup-$(date +%Y%m%d).json
   ```

4. **Usar gcloud en máquina segura**
   - No en máquinas públicas
   - No en VMs compartidas
   - Logout después de uso: `gcloud auth revoke`

---

## ✅ Resumen Ejecutivo

### ✅ Lo que ESTÁ configurado

- Cuenta admin: alec@salfacloud.cl con rol Owner
- Proyecto: salfagpt (82892384200)
- Cloud Run: cr-salfagpt-ai-ft-prod en us-east4
- Firestore: (default) database en us-central1
- Cloud Storage: salfagpt-uploads en us-central1
- Load Balancer: Custom domain con SSL
- OAuth: Totalmente funcional
- Secrets: En Secret Manager
- Logging: Automático y funcional

### ⚠️ Lo que FALTA implementar (priorizado)

1. 🔴 **Alta Prioridad:**
   - Backups automáticos de Firestore
   - Monitoring y alertas
   - Disaster recovery plan documentado

2. 🟡 **Media Prioridad:**
   - Rate limiting en API
   - CDN caching optimizado
   - Multi-region redundancy

3. 🟢 **Baja Prioridad:**
   - Cloud Functions para async tasks
   - Cloud SQL (si BigQuery no es suficiente)
   - Infrastructure as Code (Terraform)

---

**Mantenedor:** alec@salfacloud.cl  
**Última Actualización:** 2025-11-04  
**Próxima Revisión:** Al implementar backups automáticos  
**Estado:** ✅ Documentación completa y verificada

