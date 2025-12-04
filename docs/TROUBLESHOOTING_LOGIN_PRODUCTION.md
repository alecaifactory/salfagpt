# 🚨 TROUBLESHOOTING: Login Issues in Production

**Updated:** 2025-12-04 00:20 UTC  
**Service:** cr-salfagpt-ai-ft-prod-00098-nck  
**Status:** 🔴 **Login Not Working** (needs diagnosis)

---

## 🎯 **Quick Diagnostic Steps**

### **PASO 1: Abrir Consola del Navegador**

1. **Ve a:** https://salfagpt.salfagestion.cl/
2. **Presiona F12** (o Cmd+Option+I en Mac)
3. **Click en tab "Console"**
4. **Deja abierta la consola**

---

### **PASO 2: Intentar Login**

5. **Click en:** "Continuar con Google"
6. **Observa qué pasa:**

**Opciones:**

#### **A) Te redirige a Google** ✅
```
URL cambia a: https://accounts.google.com/...
Ves: Pantalla de login de Google
Acción: Autentica con tu cuenta
```
→ **Continúa a PASO 3**

#### **B) Error inmediato (sin redirigir)** ❌
```
Página muestra error sin ir a Google
```
→ **Copia el mensaje de error y los logs de consola**

#### **C) Página en blanco** ❌
```
Pantalla blanca, nada carga
```
→ **Revisa consola para errores JavaScript**

---

### **PASO 3: Después de Google Auth**

7. **Google te redirige de vuelta**
8. **¿Qué ves?**

#### **A) Chat carga correctamente** ✅
```
URL: https://salfagpt.salfagestion.cl/chat
Ves: Tus conversaciones y agentes
```
→ **¡FUNCIONA! No hay problema**

#### **B) Error "Error al Procesar"** ❌
```
Ves cuadro rojo con:
"Error al Procesar
Ocurrió un error al procesar tu inicio de sesión."
```
→ **Revisa Console logs (F12) y copia errores**

#### **C) Redirect loop** ❌
```
URL cambia constantemente entre:
/chat → / → /auth/login → /chat → / ...
```
→ **Problema de cookie o sesión**

#### **D) Página de login de nuevo** ❌
```
Te devuelve a la pantalla "Bienvenido"
Como si no estuvieras logueado
```
→ **Problema de sesión o cookie**

---

## 🔍 **Qué Buscar en Console (F12)**

### **Errores Comunes:**

#### **Error 1: OAuth Redirect URI**
```javascript
Console error:
"Error 400: redirect_uri_mismatch"
```

**Causa:** Redirect URI no autorizado en Google Console  
**Fix:** Verificar Google OAuth console tiene:
```
https://salfagpt.salfagestion.cl/auth/callback
```

---

#### **Error 2: Domain Disabled**
```javascript
Console error:
"Domain disabled" o "domain_disabled"
```

**Causa:** Tu dominio no está habilitado en Firestore  
**Fix:** Habilitar dominio en `domains` collection

---

#### **Error 3: Session Cookie**
```javascript
Console error:
"Unauthorized" o "No session"
```

**Causa:** Cookie no se está seteando correctamente  
**Fix:** Verificar SESSION_COOKIE_NAME matches código

---

#### **Error 4: Secret Not Found**
```javascript
Console error (o en Cloud Logs):
"GOOGLE_CLIENT_SECRET not found"
"JWT_SECRET not found"
```

**Causa:** Secrets no montados correctamente  
**Fix:** Verificar secrets existen y tienen permisos

---

## 📋 **Checklist de Diagnóstico**

**Copia esta información:**

```
URL que intentas: ___________
Error que ves: ___________
Console errors (F12): ___________
¿Llegas a Google?: SÍ / NO
¿Google te redirige de vuelta?: SÍ / NO
¿A qué URL llegas después?: ___________
```

---

## 🔧 **Fixes Rápidos Por Tipo de Error**

### **Si dice "domain_disabled":**

```bash
# Verificar dominios habilitados
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('domains').where('enabled', '==', true).get();
console.log('Dominios habilitados:');
snapshot.docs.forEach(doc => console.log(' -', doc.id, doc.data().domain));
process.exit(0);
"
```

**Fix:**
```typescript
// Habilitar tu dominio
await firestore.collection('domains').doc('getaifactory-com').set({
  domain: 'getaifactory.com',
  enabled: true,
  name: 'AI Factory'
});
```

---

### **Si dice "redirect_uri_mismatch":**

**Verificar Google OAuth Console:**
1. https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Click en OAuth Client
3. Authorized redirect URIs debe incluir:
   ```
   https://salfagpt.salfagestion.cl/auth/callback
   ```

---

### **Si loop infinito:**

**Problema:** Session cookie no se guarda

**Check:**
```bash
# Ver qué cookie se está usando
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --format="value(spec.template.spec.containers[0].env)" | grep SESSION_COOKIE_NAME

# Debe ser: salfagpt_session
```

---

## 🎯 **Próximo Paso INMEDIATO**

**POR FAVOR PROPORCIONA:**

1. **Error exacto** que ves en pantalla
2. **Console logs** (F12 → Console → copia todo)
3. **URL final** donde terminas después de intentar login
4. **¿Llegas a Google?** SÍ/NO

Con esta información puedo diagnosticar y arreglar el problema específico.

---

**Esperando tu información de diagnóstico...** 🔍

