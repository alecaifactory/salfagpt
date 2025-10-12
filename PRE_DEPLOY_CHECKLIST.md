# ✅ Pre-Deploy Checklist - Mantener URL Estable

## 🎯 Objetivo
Asegurar que la URL de producción **NO cambie** con el deploy.

---

## 🔒 Regla de Oro

```bash
# ✅ COMANDO CORRECTO (mantiene URL):
gcloud run deploy flow-chat \
  --region us-central1 \
  --source .

# ❌ NO CAMBIES EL NOMBRE:
# gcloud run deploy flow-chat-v2    # Genera nueva URL
# gcloud run deploy production       # Genera nueva URL

# ❌ NO CAMBIES LA REGIÓN:
# gcloud run deploy flow-chat --region us-east1  # Genera nueva URL
```

---

## ✅ Checklist de Seguridad

Antes de ejecutar `gcloud run deploy`, verifica:

- [ ] **Nombre del servicio**: `flow-chat` ✅
- [ ] **Región**: `us-central1` ✅
- [ ] **No estás eliminando el servicio**

---

## 🔍 Verificación Automática

Ejecuta esto ANTES de deploy:

```bash
./verify-url.sh
```

Si muestra `✅ URL correcta`, puedes proceder con seguridad.

---

## 📋 Si la URL Cambia Accidentalmente

1. **Verificar nueva URL:**
   ```bash
   gcloud run services describe flow-chat --region us-central1 --format="value(status.url)"
   ```

2. **Actualizar OAuth en Google Cloud Console:**
   - Ve a: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192
   - Edita el OAuth Client ID: `1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic`
   - Actualiza **Authorized redirect URIs**:
     ```
     https://[NUEVA-URL]/auth/callback
     ```

3. **Actualizar `.cursor/rules/project-identity.mdc`:**
   - Reemplaza la URL en la sección OAuth Configuration

---

## 📞 Recursos

- **Documentación completa**: `CLOUD_RUN_URL_STABILITY.md`
- **Explicación Load Balancer**: `LOAD_BALANCER_EXPLANATION.md`
- **Script de verificación**: `verify-url.sh`

---

**URL Actual Registrada en OAuth:**
```
https://flow-chat-cno6l2kfga-uc.a.run.app
```

**Verificado en 21 deployments consecutivos** ✅
