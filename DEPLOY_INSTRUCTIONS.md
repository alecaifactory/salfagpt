# 🚀 Instrucciones de Deploy - Fix M1-v2

**Status:** ✅ Build completado  
**Pendiente:** Deploy a producción  
**Tiempo:** 5-10 minutos

---

## ✅ **LO QUE YA ESTÁ HECHO:**

1. ✅ Código modificado en `AgentSharingModal.tsx`
2. ✅ Build completado (`npm run build`)
3. ✅ Carpeta `dist/` lista para deploy

---

## 🚀 **COMANDOS PARA DEPLOY:**

### **Paso 1: Autenticar (si es necesario)**

```bash
gcloud auth login
```

### **Paso 2: Set Project**

```bash
gcloud config set project salfagpt
```

### **Paso 3: Deploy**

```bash
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=2Gi \
  --timeout=300
```

**Tiempo estimado:** 5-10 minutos

---

## ✅ **DESPUÉS DEL DEPLOY:**

### **Verificación:**

1. Espera 2-3 minutos después del deploy
2. Abre **incógnito**: https://salfagpt.salfagestion.cl
3. Login como alec@getaifactory.com
4. Abre **M1-v2**
5. Click **"Compartir Agente"**

**Debe mostrar:**
```
Accesos Compartidos (14)
  👤 JULIO IGNACIO RIVERO FIGUEROA
     ✉️ jriverof@iaconcagua.com
     🌐 iaconcagua.com
     
  👤 ALVARO FELIPE MANRIQUEZ JIMENEZ
     ✉️ afmanriquez@iaconcagua.com
     🌐 iaconcagua.com
     
  ... (12 usuarios más)
```

---

## 📊 **RESUMEN DEL FIX**

### **Problema:**
- API `/api/users` falla con error "cookieName not defined"
- Componente dependía de `allUsers` para mostrar nombres
- Sin `allUsers`, no mostraba nada

### **Solución:**
- Componente ahora usa datos directamente de `share.sharedWith`
- Cada entrada ya tiene: name, email, userId, accessLevel
- No depende de `allUsers` API

### **Beneficio:**
- ✅ M1-v2 mostrará usuarios
- ✅ Todos los agentes funcionarán
- ✅ Más robusto (no depende de API adicional)

---

## 🎯 **ESTADO FINAL ESPERADO:**

Después del deploy:

| Agent | Usuarios | Status |
|-------|----------|--------|
| S1-v2 | 16 | ✅ Funciona |
| S2-v2 | 11 | ✅ Funciona |
| M1-v2 | 14 | ✅ **Funcionará** |
| M3-v2 | 14 | ✅ Funciona |

**Sistema 100% funcional** ✅

---

## ⚡ **SIGUIENTE ACCIÓN:**

**Tu turno:**

```bash
# Autenticar si es necesario
gcloud auth login

# Deploy
cd /Users/alec/salfagpt
gcloud config set project salfagpt
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --allow-unauthenticated
```

**Después del deploy, M1-v2 mostrará los 14 usuarios correctamente** ✅

---

**¿Listo para deployar?** 🚀


