# 🔒 Cloud Run URL - Reglas de Oro para Estabilidad

## 📌 Tu URL Actual (PERMANENTE)

```
https://flow-chat-cno6l2kfga-uc.a.run.app
```

**Esta URL está registrada en OAuth y NO debe cambiar.**

---

## ✅ Reglas de Oro (NUNCA CAMBIES ESTOS 2 VALORES)

### 1. Nombre del Servicio: `flow-chat`

```bash
# ✅ SIEMPRE usa este comando:
gcloud run deploy flow-chat --region us-central1 --source .

# ❌ NUNCA cambies el nombre:
# gcloud run deploy flow-chat-v2     # ❌ Genera nueva URL
# gcloud run deploy salfagpt          # ❌ Genera nueva URL
```

### 2. Región: `us-central1`

```bash
# ✅ SIEMPRE usa us-central1:
gcloud run deploy flow-chat --region us-central1 --source .

# ❌ NUNCA cambies la región:
# gcloud run deploy flow-chat --region us-east1    # ❌ Nueva URL
```

---

## ✅ Cambios SEGUROS (No Afectan la URL)

### Código y Configuración
```bash
# ✅ Actualizar código
gcloud run deploy flow-chat --region us-central1 --source .

# ✅ Cambiar variables de entorno
gcloud run services update flow-chat \
  --region us-central1 \
  --set-env-vars="NEW_VAR=value"
```

### Recursos
```bash
# ✅ Cambiar CPU/memoria/timeout
gcloud run services update flow-chat \
  --region us-central1 \
  --cpu=2 --memory=1Gi --timeout=300
```

### Escalado
```bash
# ✅ Cambiar instancias
gcloud run services update flow-chat \
  --region us-central1 \
  --min-instances=1 --max-instances=10
```

---

## ❌ NUNCA Hagas Esto

```bash
# ❌ Eliminar servicio
gcloud run services delete flow-chat

# ❌ Cambiar nombre
gcloud run deploy OTRO-NOMBRE

# ❌ Cambiar región
gcloud run deploy flow-chat --region us-east1
```

---

## 🔍 Comandos de Verificación

### Verificar URL Actual
```bash
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="value(status.url)"

# Salida esperada:
# https://flow-chat-cno6l2kfga-uc.a.run.app
```

### Script de Verificación
```bash
# Ejecuta verify-url.sh
./verify-url.sh

# Salida esperada:
# ✅ URL correcta: https://flow-chat-cno6l2kfga-uc.a.run.app
```

---

## 🚨 Si la URL Cambió

1. Obtén la nueva URL:
```bash
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="value(status.url)"
```

2. Actualiza OAuth:
https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192

3. Agrega nueva redirect URI:
```
https://NUEVA-URL.run.app/auth/callback
```

---

## 📝 Comando Seguro Estándar

```bash
gcloud run deploy flow-chat \
  --region us-central1 \
  --source . \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192"
```

**Este comando es 100% seguro y mantiene tu URL.**

---

## 🎯 Resumen

### ✅ Puedes Cambiar Libremente
- Código (deploy)
- Variables de entorno
- CPU / Memoria / Timeout
- Escalado

### ❌ NUNCA Cambies
- Nombre: `flow-chat`
- Región: `us-central1`
- No elimines el servicio

**URL actual:** `https://flow-chat-cno6l2kfga-uc.a.run.app`  
**Estado:** Estable y permanente ✅
