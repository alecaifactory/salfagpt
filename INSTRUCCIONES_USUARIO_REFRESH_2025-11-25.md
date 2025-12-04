# 🔄 Instrucciones para Ver Documentos - Requiere Refresh

**Para:** Todos los usuarios con agentes compartidos  
**Fecha:** 2025-11-25 12:00 PM  
**Reason:** Nueva actualización deployada

---

## 🎯 **SI VES "HTTP 403" AL ABRIR DOCUMENTOS:**

### **Paso 1: HARD REFRESH (CRÍTICO)**
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
Linux: Ctrl + Shift + R
```

**¿Por qué?** Tu navegador está usando código viejo cacheado. El hard refresh fuerza cargar el código nuevo.

---

### **Paso 2: Si sigue fallando → Logout y Login**
```
1. Click en tu nombre (abajo izquierda)
2. Click "Cerrar Sesión"
3. Volver a login con tu cuenta
4. Reintentar abrir documento
```

**¿Por qué?** Tu sesión puede tener permisos viejos. Re-login actualiza permisos.

---

### **Paso 3: Si SIGUE fallando → Limpiar Cache Completo**
```
Chrome:
1. Cmd+Shift+Delete (Mac) o Ctrl+Shift+Delete (Windows)
2. Seleccionar "Cached images and files"
3. Time range: "Last hour"
4. Click "Clear data"

Safari:
1. Develop → Empty Caches
2. Reload página

Firefox:
1. Preferences → Privacy & Security
2. Clear Data → Cached Web Content
3. Clear
```

---

## ✅ **CÓMO VERIFICAR QUE FUNCIONA:**

### Después del Refresh:
```
1. Ve a cualquier agente compartido contigo
   (ej: GOP GPT, Maqsa Mantenimiento, etc.)

2. Envía una pregunta que genere referencias

3. Click en cualquier referencia (tarjeta azul abajo del mensaje)

4. ESPERADO: Documento se abre ✅
   - PDF viewer si existe archivo original
   - Texto extraído si no hay PDF

5. NO ESPERADO: Error 403 ❌
   - Si ves esto, reportar inmediatamente
```

---

## 🔍 **SI PERSISTE EL PROBLEMA:**

### Información a Reportar:
```
1. Tu email: _______________
2. Agente que usaste: _______________
3. Documento que intentaste abrir: _______________
4. Screenshot del error completo
5. Console del navegador (F12 → Console tab)
```

### Enviar a:
- alec@getaifactory.com
- O crear ticket en sistema

---

## 🎯 **USUARIOS CONFIRMADOS CON ACCESO:**

Estos usuarios tienen agentes compartidos y DEBEN poder ver documentos:

```
✅ alec@salfacloud.cl (8 agentes compartidos)
   - GOP GPT (M3-v2)
   - Maqsa Mantenimiento (S2-v2)
   - Asistente Legal (M1-v2)
   - Gestion Bodegas (S1-v2)
   - + 4 más

✅ sorellanac@salfagestion.cl (Admin)
✅ fdiazt@salfagestion.cl (User)
✅ nfarias@salfagestion.cl (User)
✅ jriverof@iaconcagua.com (Expert)
✅ + 43 usuarios más con agentes compartidos
```

---

## 🛡️ **SEGURIDAD:**

### Usuarios que NO deberían ver documentos:
```
❌ Usuario sin agentes compartidos
❌ Usuario que NO tiene acceso al agente específico
❌ Usuario con acceso revocado

→ Estos verán 403 correctamente (no es un error)
```

---

## ⚡ **CAMBIOS TÉCNICOS (Para Referencia):**

### Revisión Deployada:
```
Revision: cr-salfagpt-ai-ft-prod-00095-b8f
Deployed: 2025-11-25 11:50 AM
Status: 100% traffic
```

### Fixes Incluidos:
```
1. Gemini thinking mode fix
2. JSON endpoint access via agent sharing
3. PDF viewer access via agent sharing
```

### Lógica de Acceso:
```
Permiso otorgado SI:
- Eres dueño del documento, O
- Eres SuperAdmin, O
- Tienes acceso compartido a un agente que usa el documento
```

---

## 🎊 **NOTA IMPORTANTE:**

**El hard refresh es OBLIGATORIO** después de cualquier deployment.

Sin hard refresh, tu navegador seguirá usando código viejo del cache y verás errores que ya fueron corregidos.

**⌨️ Cmd+Shift+R** es tu mejor amigo después de deployments! 🚀

---

**Última actualización:** 2025-11-25 12:00 PM  
**Status:** Deployment completado, esperando que usuarios hagan refresh



