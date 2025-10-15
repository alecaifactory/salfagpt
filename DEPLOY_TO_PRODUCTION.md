# 🚀 Deploy a Producción - GCP Cloud Run

**Status:** ⏳ Esperando autenticación  
**Target:** flow-chat service en us-central1  
**Build:** ✅ Exitoso

---

## 🔐 Paso 1: Autentica con GCP

**En tu terminal, ejecuta:**

```bash
gcloud auth login
```

**Qué pasará:**
1. Se abrirá tu browser
2. Selecciona tu cuenta Google
3. Autoriza Google Cloud SDK
4. Vuelve a la terminal

---

## 🚀 Paso 2: Deploy a Cloud Run

**Después de autenticar, ejecuta:**

```bash
cd /Users/alec/salfagpt

gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production"
```

**Este comando:**
- Builds tu código en Cloud Build
- Crea imagen Docker automáticamente
- Deploy a Cloud Run service "flow-chat"
- Región: us-central1
- Min instances: 1 (siempre caliente)
- Memory: 2GB (suficiente para Gemini)
- Timeout: 5 minutos (para uploads grandes)

**Tiempo estimado:** 3-5 minutos

---

## 📋 Durante el Deploy

**Verás:**
```
Building using Buildpacks...
✓ Creating Container Repository
✓ Uploading sources
✓ Building image
✓ Pushing to Container Registry
✓ Deploying to Cloud Run
✓ Setting traffic

Service [flow-chat] revision [flow-chat-00XXX] has been deployed
Service URL: https://flow-chat-XXXXX.run.app
```

---

## 🔧 Paso 3: Configurar Variables Secretas

**Después del deploy inicial, configura las secrets:**

### Opción A: Usar Secret Manager (Recomendado)

```bash
# 1. Crear secrets si no existen
echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets create google-ai-api-key \
  --data-file=- \
  --project=gen-lang-client-0986191192 \
  --replication-policy="automatic" || echo "Secret already exists"

echo -n "$GOOGLE_CLIENT_ID" | gcloud secrets create google-client-id \
  --data-file=- \
  --project=gen-lang-client-0986191192 \
  --replication-policy="automatic" || echo "Secret already exists"

echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- \
  --project=gen-lang-client-0986191192 \
  --replication-policy="automatic" || echo "Secret already exists"

echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
  --data-file=- \
  --project=gen-lang-client-0986191192 \
  --replication-policy="automatic" || echo "Secret already exists"

# 2. Grant service account access
SERVICE_ACCOUNT=$(gcloud run services describe flow-chat \
  --region=us-central1 \
  --format="value(spec.template.spec.serviceAccountName)")

for SECRET in google-ai-api-key google-client-id google-client-secret jwt-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=gen-lang-client-0986191192
done

# 3. Update Cloud Run to use secrets
gcloud run services update flow-chat \
  --region=us-central1 \
  --update-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest" \
  --update-secrets="GOOGLE_CLIENT_ID=google-client-id:latest" \
  --update-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --update-secrets="JWT_SECRET=jwt-secret:latest" \
  --project=gen-lang-client-0986191192
```

### Opción B: Env Vars Directas (Más Simple pero Menos Seguro)

```bash
# Lee desde .env
source .env

gcloud run services update flow-chat \
  --region=us-central1 \
  --update-env-vars="GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY" \
  --update-env-vars="GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" \
  --update-env-vars="GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" \
  --update-env-vars="JWT_SECRET=$JWT_SECRET" \
  --project=gen-lang-client-0986191192
```

---

## 🌐 Paso 4: Configurar OAuth Redirect URIs

**Después del deploy, obtén la URL:**

```bash
SERVICE_URL=$(gcloud run services describe flow-chat \
  --region=us-central1 \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"
```

**Luego actualiza PUBLIC_BASE_URL:**

```bash
gcloud run services update flow-chat \
  --region=us-central1 \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL" \
  --project=gen-lang-client-0986191192
```

**Y configura OAuth:**
1. Ve a: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192
2. Edit OAuth Client ID
3. Agregar a "Authorized redirect URIs":
   ```
   https://YOUR-SERVICE-URL/auth/callback
   ```

---

## ✅ Paso 5: Verificación Post-Deploy

```bash
# Health check
curl https://YOUR-SERVICE-URL/api/health/firestore

# Expected:
{
  "status": "healthy",
  "checks": {
    "authentication": { "status": "pass" }
  }
}
```

---

## 🎯 Resumen de Pasos

```
1. gcloud auth login (ahora)
2. gcloud run deploy flow-chat (3-5 min)
3. Configurar secrets/env vars (2 min)
4. Obtener URL y configurar OAuth (2 min)
5. Test en producción (1 min)

Total: ~10-15 minutos
```

---

**¿Procedo con el paso 1 (gcloud auth login)?**

