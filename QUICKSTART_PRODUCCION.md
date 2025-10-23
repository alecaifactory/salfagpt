# ⚡ Quickstart - Despliegue a Producción SalfaGPT

**Para desplegar rápidamente a producción en 3 minutos.**

---

## 🎯 Pre-requisitos (5 minutos)

### 1. Verificar archivo .env

Tu archivo `.env` debe tener estas variables (valores ya configurados):

```bash
GOOGLE_CLOUD_PROJECT=salfagpt
GOOGLE_AI_API_KEY=AIzaSyALvlJm5pl5Ygp_P-nM1ey7vWP7E6O4mV0
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=df45d920393b23177f56675c5bac8d99058b3388be154b620ef2e8eb7ad58dfdaeaa76514fd268837c60bfd616cbf28be65a736818fed62f8a0a90b766e6542f
```

### 2. Verificar OAuth en Google Console

**URIs que DEBEN estar configurados:**

Ve a: https://console.cloud.google.com/apis/credentials?project=salfagpt

**Orígenes autorizados:**
- `https://salfagpt-3snj65wckq-uc.a.run.app`

**Redirect URIs:**
- `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback`

✅ **Si ya están configurados, continúa al despliegue.**

---

## 🚀 Despliegue (3 minutos)

### Opción 1: Usar Script Automático (Recomendado)

```bash
./deploy-salfagpt-production.sh
```

### Opción 2: Comando Manual

```bash
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

---

## ✅ Verificación (1 minuto)

### 1. Health Check
```bash
curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore
```

**Debe retornar:** `"status": "healthy"`

### 2. Test Login

1. Limpia caché del navegador (Cmd + Shift + Delete)
2. Visita: https://salfagpt-3snj65wckq-uc.a.run.app
3. Click "Continuar con Google"
4. ✅ Debe funcionar

---

## 🐛 Si algo falla

### Error: "Missing client_id"
```bash
# Actualizar Client ID
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com"
```

### Error: "invalid_client"
```bash
# Actualizar Client Secret (usa el valor EXACTO del .env)
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=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"
```

### Ver logs de errores:
```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=10 \
  --project=salfagpt
```

---

## 📞 Soporte

**Documentación completa:** `docs/PRODUCCION_SALFAGPT_GCP.md`  
**Service Account:** 82892384200-compute@developer.gserviceaccount.com  
**Project Number:** 82892384200

---

✅ **Total: ~9 minutos (setup 5 min + deploy 3 min + verificación 1 min)**

