# Fix OAuth Redirect URI - Production

## ✅ Problema Identificado

El login redirige a `localhost:3000/chat` en lugar de la URL de producción.

**Causa:** Las OAuth redirect URIs en Google Cloud Console no incluyen la URL de producción.

---

## 🔧 Solución

### 1. ✅ Ya Completado

`PUBLIC_BASE_URL` ya está configurado correctamente en Cloud Run:

```bash
PUBLIC_BASE_URL=https://flow-chat-1030147139179.us-central1.run.app
```

### 2. 🔑 Actualizar OAuth Redirect URIs en Google Cloud Console

**Pasos:**

1. **Ir a Google Cloud Console**
   - URL: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192
   - O: Google Cloud Console > APIs & Services > Credentials

2. **Encontrar tus credenciales OAuth 2.0**
   - Buscar: `1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic.apps.googleusercontent.com`
   - Click en el nombre para editar

3. **Agregar Authorized redirect URIs**
   
   En la sección "Authorized redirect URIs", agregar:
   
   ```
   https://flow-chat-1030147139179.us-central1.run.app/auth/callback
   ```
   
   **IMPORTANTE:** También mantener las URIs existentes:
   - `http://localhost:3000/auth/callback` (para desarrollo local)
   - Cualquier otra URL de producción anterior

4. **Guardar cambios**
   - Click "Save" en la parte inferior
   - Los cambios se propagan inmediatamente

---

## 🧪 Verificar la Solución

### Opción 1: Probar en Incognito/Private Browser

```bash
# 1. Abrir en modo incógnito
https://flow-chat-1030147139179.us-central1.run.app

# 2. Click "Continue with Google"
# 3. Login con tu cuenta
# 4. Deberías ser redirigido a:
https://flow-chat-1030147139179.us-central1.run.app/chat
```

### Opción 2: Verificar con curl

```bash
# Verificar que la URL del servicio responde
curl -I https://flow-chat-1030147139179.us-central1.run.app/auth/login

# Debería retornar:
# HTTP/2 302 (redirect a Google OAuth)
```

---

## 📊 Configuración Actual

### Environment Variables en Cloud Run

```yaml
GOOGLE_CLOUD_PROJECT: gen-lang-client-0986191192
GOOGLE_CLIENT_ID: 1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic.apps.googleusercontent.com
GOOGLE_AI_API_KEY: [configured]
PUBLIC_BASE_URL: https://flow-chat-1030147139179.us-central1.run.app
```

### OAuth Configuration

```javascript
Client ID: 1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic.apps.googleusercontent.com
Redirect URI: https://flow-chat-1030147139179.us-central1.run.app/auth/callback
```

---

## 🔍 Debugging

Si el problema persiste después de actualizar las redirect URIs:

### 1. Verificar que PUBLIC_BASE_URL está configurado

```bash
gcloud run services describe flow-chat --region us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)" | grep PUBLIC_BASE_URL
```

**Esperado:**
```yaml
- name: PUBLIC_BASE_URL
  value: https://flow-chat-1030147139179.us-central1.run.app
```

### 2. Verificar los logs de Cloud Run

```bash
gcloud run services logs read flow-chat --region us-central1 --limit=50
```

**Buscar:** Líneas que contengan "OAuth Config" para ver qué redirect_uri se está usando.

### 3. Probar el flujo OAuth manualmente

```bash
# 1. Obtener la URL de autorización
curl -s https://flow-chat-1030147139179.us-central1.run.app/auth/login -I | grep -i location

# 2. Verificar que la URL contiene:
# - client_id=1030147139179-...
# - redirect_uri=https://flow-chat-1030147139179.us-central1.run.app/auth/callback
```

### 4. Limpiar cookies y caché

A veces el navegador cachea la redirect URI antigua:

1. Abrir DevTools (F12)
2. Application > Storage > Clear site data
3. O usar modo incógnito

---

## 📝 Notas Importantes

### Múltiples URLs del Servicio

Cloud Run puede mostrar dos URLs diferentes para el mismo servicio:

- `https://flow-chat-cno6l2kfga-uc.a.run.app` (URL autogenerada)
- `https://flow-chat-1030147139179.us-central1.run.app` (URL con project number)

**Ambas funcionan**, pero debes usar la misma URL en:
- ✅ `PUBLIC_BASE_URL` (variable de entorno)
- ✅ OAuth redirect URIs (Google Cloud Console)
- ✅ Tu navegador

### Propagación de Cambios

- **Environment Variables:** ~30 segundos (redeploy automático)
- **OAuth Redirect URIs:** Inmediato (pero puede requerir limpiar caché)

---

## ✅ Checklist de Solución

- [x] `PUBLIC_BASE_URL` configurado en Cloud Run
- [ ] OAuth redirect URI agregado en Google Cloud Console
- [ ] Cookies/caché limpiados en navegador
- [ ] Probado login en modo incógnito
- [ ] Redirige correctamente a `/chat` en producción

---

## 🚀 Comando Rápido para Re-deployment (si necesario)

Si necesitas re-deployar después de cambios:

```bash
# 1. Verificar configuración actual
gcloud run services describe flow-chat --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep PUBLIC_BASE_URL

# 2. Si necesitas cambiar PUBLIC_BASE_URL
gcloud run services update flow-chat --region us-central1 \
  --update-env-vars="PUBLIC_BASE_URL=https://flow-chat-1030147139179.us-central1.run.app"

# 3. Verificar que se aplicó
gcloud run services describe flow-chat --region us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)" | grep -A1 PUBLIC_BASE_URL
```

---

## 📚 Referencias

- **OAuth Configuration Guide:** `OAUTH_PRODUCTION_FIX.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Deployment Rule:** `.cursor/rules/deployment.mdc`

---

**Última Actualización:** 2025-10-12  
**Estado:** ✅ `PUBLIC_BASE_URL` configurado  
**Acción Pendiente:** Actualizar OAuth redirect URIs en Google Cloud Console

