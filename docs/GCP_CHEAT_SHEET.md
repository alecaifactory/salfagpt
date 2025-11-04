# 📋 GCP Cheat Sheet - SALFAGPT Platform

**Para:** Referencia rápida diaria  
**Imprime y pega en tu escritorio** 📌

---

## 🎯 Información Crítica

```
Proyecto:    salfagpt
Project #:   82892384200
Admin:       alec@salfacloud.cl
Región DB:   us-central1
Región App:  us-east4
Producción:  https://salfagpt.salfagestion.cl
```

---

## ⚡ Comandos Más Usados

### Setup (Una vez)
```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project salfagpt
```

### Deploy
```bash
npm run build
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . --region=us-east4 --project=salfagpt
```

### Health Check
```bash
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq .status
```

### Logs (últimos 20)
```bash
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=20 --project=salfagpt
```

### Ver Variables
```bash
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt \
  --format="yaml(spec.template.spec.containers[0].env)"
```

---

## 🔑 Variables de Entorno Críticas

```bash
GOOGLE_CLOUD_PROJECT=salfagpt  ⭐ DEBE ser project ID
PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl
NODE_ENV=production
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
```

---

## 🗄️ Servicios GCP

| Servicio | Región | Propósito | Console URL |
|----------|--------|-----------|-------------|
| Cloud Run | us-east4 | App | [Link](https://console.cloud.google.com/run?project=salfagpt) |
| Firestore | us-central1 | DB | [Link](https://console.cloud.google.com/firestore?project=salfagpt) |
| Storage | us-central1 | Files | [Link](https://console.cloud.google.com/storage?project=salfagpt) |
| BigQuery | us-central1 | Analytics | [Link](https://console.cloud.google.com/bigquery?project=salfagpt) |

---

## 🚨 Troubleshooting Rápido

### Login falla
```bash
# Verificar project ID
curl https://salfagpt.salfagestion.cl/api/health/firestore | jq .checks.projectId.value
# Debe retornar: "salfagpt"
```

### Permission denied
```bash
# Re-autenticar
gcloud auth application-default login
```

### Deployment falla
```bash
# Rollback
gcloud run revisions list --service=cr-salfagpt-ai-ft-prod --region=us-east4
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=REVISION_NAME=100 --region=us-east4
```

---

## 📊 Service Account

```
Email: 82892384200-compute@developer.gserviceaccount.com
Roles: Editor, Firestore Owner, Storage Admin
```

---

## 🔐 OAuth

```
Client ID: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h
Redirect URI: https://salfagpt.salfagestion.cl/auth/callback
Console: https://console.cloud.google.com/apis/credentials?project=salfagpt
```

---

## 💰 Costos Mensuales

```
Cloud Run:        $15-25
Load Balancer:    $18-22
Firestore:        $5-10
Storage:          $2-5
BigQuery:         $5-10
Gemini AI:        $1-3
Vertex AI:        $1-2
Other:            $1
─────────────────────────
TOTAL:           $48-77/mes
```

---

## 🔗 URLs Importantes

**App:**
- Producción: https://salfagpt.salfagestion.cl
- Localhost: http://localhost:3000

**GCP Console:**
- Dashboard: https://console.cloud.google.com/home/dashboard?project=salfagpt
- Logs: https://console.cloud.google.com/logs?project=salfagpt

---

## 📝 Checklist Pre-Deploy

```
□ npm run type-check  (0 errors)
□ npm run build       (success)
□ gcloud config get-value project  (salfagpt)
□ git commit -m "..."
□ Deploy command
□ Health check post-deploy
```

---

## 🆘 Emergencia

**Rollback inmediato:**
```bash
gcloud run services update-traffic cr-salfagpt-ai-ft-prod \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-east4 --project=salfagpt
```

**Contacto:** alec@salfacloud.cl

---

**Última actualización:** 2025-11-04  
**Versión:** 1.0  
**Imprime esta página para referencia rápida** 🖨️

