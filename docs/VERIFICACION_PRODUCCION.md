# ✅ Lista de Verificación Post-Despliegue - SalfaGPT Producción

**Fecha:** 2025-10-23  
**Servicio:** salfagpt  
**URL:** https://salfagpt-3snj65wckq-uc.a.run.app  
**Revisión Actual:** salfagpt-00016-q6n (100% tráfico)  

---

## 🎯 Verificación Inmediata (Después del Despliegue)

### 1. ✅ Health Check
```bash
curl -s https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq .
```

**Esperado:**
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

✅ **PASS** si retorna `"status": "healthy"`

---

### 2. ✅ Variables de Entorno

```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="value(spec.template.spec.containers[0].env)" | grep -o "name.*GOOGLE"
```

**Debe incluir:**
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ GOOGLE_AI_API_KEY
- ✅ GOOGLE_CLOUD_PROJECT

---

### 3. ✅ OAuth Login

**Pasos:**
1. Abre en navegador (incógnito recomendado): https://salfagpt-3snj65wckq-uc.a.run.app
2. Verifica que aparece la página de login con el logo de SalfaCorp
3. Click en "Continuar con Google"
4. Debe redirigir a Google Sign-In (NO debe mostrar error)
5. Selecciona una cuenta Google autorizada
6. Debe redirigir a `/chat` exitosamente
7. Verifica que puedes ver conversaciones (si existen) o pantalla vacía

✅ **PASS** si el login completo funciona sin errores

---

### 4. ✅ Funcionalidad Básica

Una vez logueado, verifica:

**Chat:**
- [ ] Puedes crear un nuevo agente
- [ ] Puedes enviar un mensaje
- [ ] El AI responde correctamente
- [ ] Los mensajes se guardan (refresh y siguen ahí)

**Contexto:**
- [ ] Puedes ver el panel de fuentes de contexto
- [ ] Puedes agregar una fuente (PDF, URL, etc.)
- [ ] La extracción funciona
- [ ] El toggle ON/OFF funciona

**Configuración:**
- [ ] Puedes abrir configuración de usuario
- [ ] Puedes cambiar modelo (Flash/Pro)
- [ ] Los cambios se guardan

✅ **PASS** si todas las funciones básicas funcionan

---

## 🔧 Verificación de Configuración OAuth

### En Google Cloud Console

Ve a: https://console.cloud.google.com/apis/credentials?project=salfagpt

**Client ID:** `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com`

**Orígenes Autorizados (JavaScript origins):**
```
✅ http://localhost:3000
✅ https://salfagpt-3snj65wckq-uc.a.run.app
```

**URIs de Redireccionamiento (Redirect URIs):**
```
✅ http://localhost:3000/auth/callback
✅ https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
```

**Client Secret:**
- Debe empezar con: `GOCSPX-`
- Debe coincidir EXACTAMENTE con el valor en `.env`
- Actual: `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`

✅ **PASS** si todos los URIs están configurados y el secret coincide

---

## 📊 Monitoreo Continuo

### Logs de Errores (últimos 10)
```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=10 \
  --project=salfagpt \
  --format="table(timestamp,severity,textPayload)"
```

### Logs de OAuth (si hay problemas)
```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND textPayload=~"OAuth"' \
  --limit=20 \
  --project=salfagpt
```

### Métricas de Performance
```bash
# Ver latencia promedio
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --project=salfagpt
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: Error "Missing client_id"

**Síntoma:** Página de error de Google con "Missing required parameter: client_id"

**Causa:** `GOOGLE_CLIENT_ID` no está configurado en Cloud Run

**Solución:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com"
```

---

### Problema 2: Error "invalid_client"

**Síntoma:** Después de seleccionar cuenta Google, error "invalid_client"

**Causa:** El `GOOGLE_CLIENT_SECRET` no coincide con el de Google Console

**Solución:**
1. Verifica en Google Console el secreto actual
2. Compara con tu `.env`
3. Actualiza Cloud Run con el correcto:
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=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"
```

---

### Problema 3: Error "redirect_uri_mismatch"

**Síntoma:** Error "The redirect URI in the request does not match"

**Causa:** El redirect URI no está configurado en Google Console

**Solución:**
1. Ve a: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Edita el OAuth client
3. Agrega: `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback`
4. Guarda
5. Espera 10-15 minutos para propagación

---

### Problema 4: Servicio responde lento o timeout

**Síntoma:** Páginas cargan muy lento o timeout

**Solución:**
```bash
# Aumentar recursos
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=1
```

---

### Problema 5: "Firestore permission denied"

**Síntoma:** Errores de permisos al acceder a Firestore

**Solución:**
```bash
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## 📈 Métricas de Éxito

### Después de 1 hora del despliegue:

- [ ] 0 errores de OAuth en logs
- [ ] 0 errores de Firestore en logs
- [ ] Health check retorna "healthy"
- [ ] Al menos 1 usuario ha iniciado sesión exitosamente
- [ ] AI responde a mensajes (no errores de Gemini)

### Después de 24 horas:

- [ ] Uptime > 99%
- [ ] Latencia p95 < 3 segundos
- [ ] 0 crashes del servicio
- [ ] Usuarios reportan funcionamiento normal

---

## 🔄 Proceso de Actualización Rutinaria

Para despliegues futuros:

### 1. Desarrollo y Testing Local
```bash
npm run dev
# Probar cambios en http://localhost:3000
```

### 2. Build y Verificación
```bash
npm run build
npm run type-check
```

### 3. Commit a Git
```bash
git add .
git commit -m "feat: descripción de cambios"
git push origin main
```

### 4. Desplegar a Producción
```bash
./deploy-salfagpt-production.sh
```

### 5. Verificar
```bash
# Health check
curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore

# Probar login
# Visitar en navegador y verificar manualmente
```

---

## 🎓 Lecciones Aprendidas

### 1. Client Secret debe coincidir EXACTAMENTE
El error más común es que `GOOGLE_CLIENT_SECRET` en Cloud Run sea diferente al de Google Console. **Siempre verifica que coincidan.**

### 2. PUBLIC_BASE_URL debe ser la URL de producción
En Cloud Run debe ser: `https://salfagpt-3snj65wckq-uc.a.run.app`  
NO uses: `http://localhost:3000`

### 3. Redirect URIs deben estar en Google Console
Antes de desplegar, **verifica que los URIs estén configurados**. Los cambios pueden tardar hasta 15 minutos.

### 4. Usar el servicio correcto
Con múltiples servicios (`flow-chat`, `flow-salfacorp`, `salfagpt`), asegúrate de actualizar **`salfagpt`**.

### 5. Todas las 7 variables son críticas
No basta con configurar solo OAuth. **Todas las variables** deben estar configuradas:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_AI_API_KEY
- JWT_SECRET
- PUBLIC_BASE_URL
- NODE_ENV
- GOOGLE_CLOUD_PROJECT

---

## 📞 Contactos y Recursos

**Consola de Cloud Run:**  
https://console.cloud.google.com/run/detail/us-central1/salfagpt?project=salfagpt

**OAuth Credentials:**  
https://console.cloud.google.com/apis/credentials?project=salfagpt

**Firestore Database:**  
https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=salfagpt

**Logs:**  
https://console.cloud.google.com/logs/query?project=salfagpt

**Documentación Completa:**  
`docs/PRODUCCION_SALFAGPT_GCP.md`

---

**Estado del Servicio:** ✅ Funcionando  
**Última Verificación:** 2025-10-23 23:50 UTC  
**Próxima Revisión:** 2025-10-24

