# 🔐 Fix Firestore Authentication

**Problema:** Firestore authentication expired  
**Síntoma:** "No hay conversaciones guardadas" pero existen 74 en Firestore  
**Solución:** Re-autenticar con Google Cloud

---

## ✅ Pasos para Reconectar Firestore

### Opción 1: Terminal (Recomendado)

**Abre una NUEVA terminal** (no la que corre npm run dev) y ejecuta:

```bash
/Users/alec/google-cloud-sdk/bin/gcloud auth application-default login
```

**Qué pasará:**
1. Se abrirá tu browser automáticamente
2. Pedirá que selecciones tu cuenta Google
3. Pedirá autorización para "Google Auth Library"
4. Clic en "Allow"
5. Verás: "You are now authenticated"
6. Cierra el browser

**Resultado:**
```
Credentials saved to file:
[/Users/alec/.config/gcloud/application_default_credentials.json]

✅ Application default credentials authenticated
```

### Opción 2: Sin Terminal

**Si prefieres no usar terminal:**

1. Abre browser manualmente
2. Ve a: https://console.cloud.google.com/
3. Selecciona proyecto: gen-lang-client-0986191192
4. Navega a: IAM & Admin > Service Accounts
5. Descarga nueva key (más complejo, no recomendado)

---

## 🔄 Después de Autenticar

### 1. Reinicia el servidor

**En la terminal donde corre `npm run dev`:**
```bash
# Ctrl+C para detener
npm run dev
```

### 2. Refresca el browser
```bash
Cmd + Shift + R
```

### 3. Verifica que funciona

**Console debería mostrar:**
```
📥 Cargando conversaciones desde Firestore...
✅ 74 conversaciones cargadas desde Firestore
📋 Conversaciones activas: 74
🎨 Renderizando 74 conversaciones, 74 activas
```

**Sidebar debería mostrar:**
- Lista completa de 74 conversaciones
- Todas tus conversaciones anteriores
- No más "temp-" conversations

---

## 🎯 Comando Completo

**Copia y pega en NUEVA terminal:**

```bash
/Users/alec/google-cloud-sdk/bin/gcloud auth application-default login
```

Luego:
1. Autoriza en browser
2. Vuelve a terminal
3. Reinicia npm run dev
4. Refresh browser

---

## ✅ Verificación

**Para confirmar que funcionó:**

```bash
curl http://localhost:3000/api/health/firestore
```

**Deberías ver:**
```json
{
  "status": "healthy",
  "checks": {
    "authentication": {
      "status": "pass"  ← Debe decir "pass"
    }
  }
}
```

---

## 🚀 Resumen

1. **Ejecuta:** `/Users/alec/google-cloud-sdk/bin/gcloud auth application-default login`
2. **Autoriza** en browser que se abre
3. **Reinicia** npm run dev
4. **Refresh** browser
5. **Verás** tus 74 conversaciones ✅

---

**¿Ejecuto el comando de autenticación ahora o prefieres hacerlo manualmente?**

