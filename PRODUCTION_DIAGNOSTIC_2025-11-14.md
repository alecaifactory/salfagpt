# 🔍 Diagnóstico Producción - Estado Actual

**Fecha:** 14 de Noviembre, 2025, 12:25 PM PST  
**Issue:** Producción no muestra referencias, localhost sí  
**Env Var:** USE_OPTIMIZED_BIGQUERY=true ✅ (confirmado)

---

## 📊 **TABLA DE ESTADO: localhost vs Producción**

### **Comparación Completa por Usuario y Entorno:**

| Usuario | Rol | Entorno | URL | Agent | Respuesta | Referencias | Time | BigQuery Esperado | Funciona? |
|---------|-----|---------|-----|-------|-----------|-------------|------|------------------|-----------|
| **alec@getaifactory.com** | SuperAdmin (Owner) | localhost | localhost:3000 | M003 | ✅ Detallada con docs | ✅ 11 referencias | 24.2s | 🟢 GREEN | ✅ **SÍ** |
| **alec@getaifactory.com** | SuperAdmin (Owner) | producción | salfagestion.cl | M003 | ⚠️ Genérica sin docs | ❌ NO referencias | 29.2s | 🟢 GREEN | ⚠️ **PARCIAL** |
| **alecdickinson@gmail.com** | User (Shared) | localhost | localhost:3000 | M003 | ✅ Detallada con docs | ✅ 11 referencias | 23.1s | 🟢 GREEN | ✅ **SÍ** |
| **alecdickinson@gmail.com** | User (Shared) | producción | salfagestion.cl | M003 | ❌ "No encontramos..." | ❌ NO referencias | 13.7s, 19.4s | 🟢 GREEN | ❌ **NO** |

---

## 🔍 **PATRÓN DETECTADO**

### **Observaciones:**

```
localhost (GREEN):
  ├─ Owner: ✅ Respuesta + Referencias
  └─ Shared: ✅ Respuesta + Referencias

Producción (GREEN activado):
  ├─ Owner: ⚠️ Respuesta SIN referencias
  └─ Shared: ❌ "No encontramos el documento"
```

**Hipótesis:** El env var `USE_OPTIMIZED_BIGQUERY=true` está configurado, pero:
1. ⚠️ El código deployed puede ser de la revisión ANTERIOR (00059) sin el fix
2. ⚠️ O el routing en producción no está detectando correctamente
3. ⚠️ O hay un cache issue

---

## 🔧 **POSIBLES CAUSAS**

### **Causa 1: Deployment No Incluyó el Fix Compartido**

```
Revisión deployed: 00060-d54
Timestamp: 12:18 PM

Pero el fix de getEffectiveOwnerForContext fue aplicado DESPUÉS
del primer deployment (00059-ptt)

¿Incluye 00060 el fix? Necesitamos verificar
```

### **Causa 2: Domain Routing No Funciona en Producción**

```
Router espera: request.headers.get('origin')
Producción envía: ¿Qué header exactamente?

Puede que en producción el header 'origin' sea diferente
Y no esté matcheando correctamente
```

### **Causa 3: BigQuery GREEN No Tiene los Chunks**

```
GREEN table creado en: localhost
¿Existe en proyecto producción?: Verificar

Si la tabla GREEN no existe en producción:
  → Query falla
  → Fallback a... ¿qué?
  → No encuentra resultados
```

---

## 📋 **TABLA DIAGNÓSTICA DETALLADA**

### **Análisis de Fallos por Paso:**

| Paso | localhost (Owner) | localhost (Shared) | Prod (Owner) | Prod (Shared) | ¿Dónde Falla? |
|------|------------------|-------------------|--------------|---------------|---------------|
| **1. User Login** | usr_uhwq... ✅ | usr_l1fi... ✅ | usr_uhwq... ✅ | usr_l1fi... ✅ | ✅ OK |
| **2. Open Agent** | M003 ✅ | M003 ✅ | M003 ✅ | M003 ✅ | ✅ OK |
| **3. Send Query** | "¿Procedimientos?" ✅ | "¿Procedimientos?" ✅ | "¿Procedimientos?" ✅ | "¿Procedimientos?" ✅ | ✅ OK |
| **4. Domain Routing** | localhost → GREEN ✅ | localhost → GREEN ✅ | salfagestion → ? | salfagestion → ? | ⚠️ **VERIFICAR** |
| **5. getEffectiveOwner** | Returns usr_uhwq... ✅ | Returns usr_uhwq... ✅ | Returns ? | Returns ? | ⚠️ **VERIFICAR** |
| **6. Load Sources** | Finds 28 ✅ | Finds 28 ✅ | Finds 0? ❌ | Finds 0 ❌ | ❌ **FALLA AQUÍ** |
| **7. BigQuery Search** | Searches 28 ✅ | Searches 28 ✅ | Searches 0? ❌ | Searches 0 ❌ | ❌ **FALLA AQUÍ** |
| **8. Chunks Found** | 8 chunks ✅ | 8 chunks ✅ | 0 chunks ❌ | 0 chunks ❌ | ❌ **FALLA AQUÍ** |
| **9. References** | ✅ Shown | ✅ Shown | ❌ NOT shown | ❌ NOT shown | ❌ **SÍNTOMA** |
| **10. Response** | ✅ Con contexto | ✅ Con contexto | ⚠️ Sin contexto | ❌ "No encontramos" | ❌ **SÍNTOMA** |

**Conclusión:** Falla en pasos 6-8 (Load Sources → BigQuery Search → Chunks Found)

---

## 🎯 **HIPÓTESIS PRINCIPAL**

### **El Fix NO está en Producción:**

```
Lo que deployamos (00059-ptt):
  ├─ BigQuery GREEN infrastructure ✅
  ├─ Migration scripts ✅
  ├─ Domain routing ✅
  └─ Shared agent fix: ⚠️ PUEDE NO ESTAR

Lo que activamos (00060-d54):
  ├─ USE_OPTIMIZED_BIGQUERY=true ✅
  └─ Pero usa código de 00059 sin el fix compartido

El fix de getEffectiveOwnerForContext:
  └─ Aplicado DESPUÉS del deployment inicial
  └─ ¿Está en 00060? Necesitamos re-deploy
```

---

## 🚀 **SOLUCIÓN: RE-DEPLOY CON TODO EL FIX**

### **Necesitamos Re-Deployar:**

El código actual tiene todos los fixes:
- ✅ BigQuery GREEN setup
- ✅ Domain routing
- ✅ Shared agent fix (getEffectiveOwnerForContext)
- ✅ userId compatibility (numeric + hashed)

Pero producción puede estar ejecutando código ANTES del último fix.

**Action:**
```bash
# Re-deploy con el código actual (tiene TODOS los fixes)
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt
  
# Esto creará revisión 00061 con TODO incluido
```

---

## 📊 **ESTADO ESPERADO DESPUÉS DE RE-DEPLOY**

| Usuario | Entorno | Respuesta | Referencias | Performance |
|---------|---------|-----------|-------------|-------------|
| **Owner** | localhost | ✅ Con contexto | ✅ 11 refs | 24s |
| **Owner** | producción | ✅ Con contexto | ✅ 11 refs | <8s |
| **Shared** | localhost | ✅ Con contexto | ✅ 11 refs | 23s |
| **Shared** | producción | ✅ Con contexto | ✅ 11 refs | <8s |

**Todos funcionan igual en ambos entornos!** ✅

---

## 💡 **POR QUÉ NECESITAMOS RE-DEPLOY**

### **Timeline de Cambios:**

```
11:52 AM - Git commit inicial (sin fix compartido)
11:55 AM - Deploy 00059-ptt
12:05 AM - Encontraste el bug compartido
12:10 AM - Aplicamos fix getEffectiveOwnerForContext
12:15 AM - Git commit con fix
12:18 AM - Deploy 00060-d54 (solo env var, NO re-build)

Problema:
  00060 solo cambió env var
  NO re-built el código
  Sigue usando código de 00059 (sin fix compartido)
```

**Necesitamos:** Deploy con `--source .` para rebuild con nuevo código

---

## 🚀 **COMANDO PARA RE-DEPLOY**

¿Ejecuto esto ahora?

```bash
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt \
  --set-env-vars="USE_OPTIMIZED_BIGQUERY=true,GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production,..."
```

**Esto incluirá:**
- ✅ Código con fix compartido
- ✅ BigQuery GREEN router
- ✅ getEffectiveOwnerForContext
- ✅ Todos los fixes aplicados hoy

**¿Procedo con re-deploy?** 🎯

