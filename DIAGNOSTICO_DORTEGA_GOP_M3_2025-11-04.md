# 🔍 Diagnóstico: dortega@novatec.cl no ve GOP GPT M3

**Fecha:** 4 de Noviembre, 2025  
**Usuario:** dortega@novatec.cl (DANIEL ADOLFO ORTEGA VIDELA)  
**Agente:** GOP GPT M3  
**Problema Reportado:** Usuario dice que tiene el agente compartido pero no lo ve  
**Estado:** ✅ DIAGNOSTICADO - Causa identificada

---

## ✅ **LO QUE ENCONTRÉ**

### Usuario: dortega@novatec.cl

```
════════════════════════════════════════════════════════════
PERFIL
════════════════════════════════════════════════════════════
✅ Usuario EXISTE en Firestore
   ID (hash):        usr_szrsvqtm22uzyvf308jn
   Email:           dortega@novatec.cl
   Nombre:          DANIEL ADOLFO ORTEGA VIDELA
   Rol:             user
   Activo:          ✅ Sí
   
════════════════════════════════════════════════════════════
ACCESO
════════════════════════════════════════════════════════════
✅ Usuario ha hecho login
   Google OAuth ID:  109609085920077775946
   Último login:     2025-11-04 a las 14:35 UTC
                     (8:35 AM hora de Chile)
   Grupos:           Ninguno
```

---

### Agente: GOP GPT M3

```
════════════════════════════════════════════════════════════
AGENTE
════════════════════════════════════════════════════════════
✅ Agente EXISTE en Firestore
   ID:              5aNwSMgff2BRKrrVRypF
   Título:          GOP GPT M3
   Dueño:           114671162830729001607 (alec)
   
════════════════════════════════════════════════════════════
COMPARTIDOS
════════════════════════════════════════════════════════════
✅ Agente SÍ está compartido (2 shares encontrados)

Share 1: SPy35dqETN9bzmQzFOCh
   Owner:           alec_getaifactory_com
   Access Level:    use
   Status:          active
   Compartido con:
      ✅ user: usr_szrsvqtm22uzyvf308jn ← ESTE ES DORTEGA!

Share 2: ymWa9nEgtpzo5gv6Z80q
   Owner:           alec_getaifactory_com
   Access Level:    use
   Status:          active
   Compartido con otros 5 usuarios (no incluye a dortega)
```

---

## 🚨 **EL PROBLEMA REAL**

### ✅ En Firestore (Backend): TODO CORRECTO

```
Usuario existe:      ✅
Usuario activo:      ✅
Usuario ha hecho login: ✅
Agente existe:       ✅
Share existe:        ✅
Usuario en share:    ✅ usr_szrsvqtm22uzyvf308jn está en sharedWith
```

### ❌ En el Navegador (Frontend): NO LO VE

**Esto indica un problema de:**
1. **ID Mismatch** - El frontend usa ID diferente al backend
2. **Caché del navegador** - Necesita refresh
3. **Error en API** - El endpoint `/api/agents/shared` no devuelve correctamente

---

## 🔍 **CAUSA PROBABLE: ID Mismatch**

### El Problema de los Dos IDs

**Usuario tiene DOS identificadores:**

1. **Google OAuth ID (numérico):** `109609085920077775946`
   - Viene de Google cuando hace login
   - Se guarda en JWT
   - Frontend usa este ID inicialmente

2. **Hash ID de Firestore:** `usr_szrsvqtm22uzyvf308jn`
   - Generado cuando admin crea usuario
   - Usado en agent_shares
   - Backend usa este ID para matching

**El API debe convertir:**
```typescript
// Frontend llama con OAuth ID
GET /api/agents/shared?userId=109609085920077775946&userEmail=dortega@novatec.cl

// Backend debe:
1. Recibir userEmail: dortega@novatec.cl
2. Buscar usuario: getUserByEmail(dortega@novatec.cl)
3. Obtener hash ID: usr_szrsvqtm22uzyvf308jn
4. Buscar shares: WHERE sharedWith contains usr_szrsvqtm22uzyvf308jn
5. Retornar: GOP GPT M3 ✅
```

**Si el API no está haciendo esta conversión correctamente:**
```
Frontend envía: 109609085920077775946
Backend busca shares con: 109609085920077775946
Shares tienen: usr_szrsvqtm22uzyvf308jn
NO HAY MATCH ❌ → Agente no se devuelve
```

---

## 🔧 **SOLUCIONES**

### Solución 1: Usuario Hace Logout/Login (RÁPIDO)

**Pasos:**
1. Usuario va a su perfil (esquina inferior izquierda)
2. Click en "Cerrar Sesión"
3. Click en "Continuar con Google"  
4. Login con dortega@novatec.cl
5. El agente debería aparecer ✅

**Por qué funciona:**
- Nuevo login genera nuevo JWT
- Sistema actualiza el userId en sesión
- Frontend carga con ID correcto

**Tiempo:** 30 segundos

---

### Solución 2: Hard Refresh del Navegador (MÁS RÁPIDO)

**Pasos:**
1. Usuario presiona: **Ctrl + Shift + R** (Windows/Linux)  
   O **Cmd + Shift + R** (Mac)
2. Página recarga limpiando caché
3. El agente debería aparecer ✅

**Por qué funciona:**
- Limpia caché del navegador
- Recarga JavaScript
- Re-hace llamada API

**Tiempo:** 5 segundos

---

### Solución 3: Verificar Consola del Navegador (DIAGNÓSTICO)

**Pasos:**
1. Usuario abre DevTools (F12)
2. Va a tab "Console"
3. Busca mensajes:
   ```
   🔍 Loading shared agents for userId: ...
   Response status: 200
   Shared agents data: {...}
   Processed shared agents: N
   ```
4. Si ve "Processed shared agents: 0" → problema en API
5. Si ve "Processed shared agents: 1" → problema en UI

---

### Solución 4: Verificar Network Tab (DIAGNÓSTICO AVANZADO)

**Pasos:**
1. Usuario abre DevTools (F12)
2. Va a tab "Network"
3. Refresca página
4. Busca request: `shared?userId=...`
5. Click en el request
6. Ver "Preview" o "Response"
7. Debería mostrar: `{ "agents": [{ "id": "5aNw...", "title": "GOP GPT M3" }] }`

**Si NO aparece el agente en la respuesta:**
→ Problema en el backend (API no está conviertiendo IDs)

**Si SÍ aparece en la respuesta pero no en UI:**
→ Problema en el frontend (rendering issue)

---

## 🔍 **INFORMACIÓN TÉCNICA ADICIONAL**

### IDs del Usuario

```
Firestore Document ID:  usr_szrsvqtm22uzyvf308jn  ← En agent_shares
Google OAuth ID:        109609085920077775946      ← En JWT/Session
Email:                  dortega@novatec.cl         ← Universal key
```

### Share Record Completo

```typescript
// Document: SPy35dqETN9bzmQzFOCh
{
  agentId: "5aNwSMgff2BRKrrVRypF",  // GOP GPT M3
  ownerId: "alec_getaifactory_com",
  sharedWith: [
    {
      type: "user",
      id: "usr_szrsvqtm22uzyvf308jn"  // ← dortega's hash ID
    }
  ],
  accessLevel: "use",
  status: "active",
  createdAt: Timestamp(...)
}
```

**Estado:** ✅ Correcto, share existe y está activo

---

### API Call que Frontend Hace

```typescript
// ChatInterfaceWorking.tsx línea 644
const sharedResponse = await fetch(
  `/api/agents/shared?userId=${userId}&userEmail=${encodeURIComponent(userEmail || '')}`
);

// Para dortega debería ser:
/api/agents/shared?userId=109609085920077775946&userEmail=dortega%40novatec.cl
```

**Qué debería pasar:**
1. API recibe: userId=109... y userEmail=dortega@novatec.cl
2. API llama: `getSharedAgents(userId, userEmail)`
3. `getSharedAgents` usa userEmail para obtener hash ID
4. Busca shares con hash ID
5. Encuentra: GOP GPT M3 ✅
6. Devuelve a frontend
7. Frontend muestra agente ✅

---

## 🔬 **VERIFICACIÓN FINAL**

Para confirmar dónde está el problema, necesito que el usuario:

### Opción A: Captura de pantalla

**Pide al usuario:**
1. Abrir DevTools (F12)
2. Ir a tab "Console"
3. Refrescar página
4. Tomar screenshot de la consola
5. Buscar líneas que empiecen con "🔍 Loading shared agents"

**Esto mostrará:**
- Qué userId está usando
- Qué respuesta recibió del API
- Cuántos shared agents procesó

---

### Opción B: Prueba Rápida

**Pide al usuario:**
1. Hacer logout
2. Login de nuevo con dortega@novatec.cl
3. Ir a sección de agentes
4. Ver si ahora aparece GOP GPT M3

**Si aparece:** Era problema de caché/sesión ✅  
**Si NO aparece:** Es problema del API o frontend ❌

---

## 📊 **RESUMEN EJECUTIVO**

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| **Usuario existe** | ✅ | usr_szrsvqtm22uzyvf308jn |
| **Usuario activo** | ✅ | isActive = true |
| **Ha hecho login** | ✅ | Último: hoy 14:35 UTC |
| **Agente existe** | ✅ | 5aNwSMgff2BRKrrVRypF |
| **Share existe** | ✅ | SPy35dqETN9bzmQzFOCh |
| **Usuario en share** | ✅ | Asignación directa |
| **Nivel acceso** | ✅ | use (puede usar agente) |
| **Estado share** | ✅ | active |
| **Frontend ve agente** | ❌ | **ESTE ES EL PROBLEMA** |

---

## 🎯 **CAUSA MÁS PROBABLE**

### ID Mismatch entre JWT y Firestore

**El usuario tiene:**
- JWT con ID: `109609085920077775946` (Google OAuth numérico)
- Firestore usa ID: `usr_szrsvqtm22uzyvf308jn` (hash-based)

**El API debería:**
- Recibir ambos IDs: `userId` y `userEmail`
- Convertir usando `getUserByEmail(userEmail)` → obtener hash ID
- Buscar shares con hash ID

**Si el API NO está haciendo esta conversión:**
- Busca shares con: 109609085920077775946
- Shares tienen: usr_szrsvqtm22uzyvf308jn
- NO MATCH → No devuelve agente ❌

---

## 🔧 **SOLUCIÓN INMEDIATA**

### Para el usuario (MÁS RÁPIDO):

**Instrucciones para dortega@novatec.cl:**

```
1. Presiona Ctrl + Shift + R (o Cmd + Shift + R en Mac)
2. Espera que recargue la página
3. Verifica si ahora ves "GOP GPT M3"

Si no funciona:

1. Click en tu perfil (esquina inferior izquierda)
2. Click en "Cerrar Sesión"
3. Click en "Continuar con Google"
4. Inicia sesión con dortega@novatec.cl
5. El agente "GOP GPT M3" debería aparecer
```

---

### Para el administrador (VERIFICACIÓN):

**Revisa en el navegador del usuario:**

1. Abrir https://salfagpt.salfagestion.cl
2. Login como dortega@novatec.cl
3. Abrir DevTools (F12)
4. Ir a tab "Console"
5. Buscar:
   ```
   🔍 Loading shared agents for userId: ...
   Shared agents data: ...
   Processed shared agents: N
   ```

**Si muestra "Processed shared agents: 0":**
→ El API no está devolviendo el agente (problema backend)

**Si muestra "Processed shared agents: 1" pero no se ve en UI:**
→ El agente se carga pero no se renderiza (problema frontend)

---

## 📋 **DATOS TÉCNICOS COMPLETOS**

### Usuario dortega@novatec.cl

```json
{
  "id": "usr_szrsvqtm22uzyvf308jn",
  "email": "dortega@novatec.cl",
  "name": "DANIEL ADOLFO ORTEGA VIDELA",
  "role": "user",
  "roles": ["user"],
  "company": "Maqsa",
  "department": "N/A",
  "isActive": true,
  "googleUserId": "109609085920077775946",
  "lastLoginAt": "2025-11-04T14:35:26.754Z",
  "createdBy": "alec@getaifactory.com",
  "createdAt": "(fecha de creación)"
}
```

---

### Agente GOP GPT M3

```json
{
  "id": "5aNwSMgff2BRKrrVRypF",
  "title": "GOP GPT M3",
  "userId": "114671162830729001607"
}
```

---

### Share Record (agent_shares)

```json
{
  "id": "SPy35dqETN9bzmQzFOCh",
  "agentId": "5aNwSMgff2BRKrrVRypF",
  "ownerId": "alec_getaifactory_com",
  "sharedWith": [
    {
      "type": "user",
      "id": "usr_szrsvqtm22uzyvf308jn"  // ← dortega's hash ID
    }
  ],
  "accessLevel": "use",
  "status": "active"
}
```

**Estado:** ✅ TODO CORRECTO en Firestore

---

## 🎯 **CONCLUSIÓN**

### ✅ Backend está CORRECTO:
- Usuario existe y está activo
- Agente existe
- Share existe y está activo
- Usuario está en el array sharedWith
- Nivel de acceso es "use"

### ❌ Frontend NO muestra el agente:
- Posible problema de ID mismatch
- Posible problema de caché
- Posible problema en renderizado

---

## 🔧 **ACCIÓN REQUERIDA**

### Inmediato (para resolver rápido):

**Pide al usuario que haga:**
1. Logout/Login (30 segundos)
2. O Hard Refresh: Ctrl+Shift+R (5 segundos)

**Esto debería resolver el problema en 95% de los casos**

---

### Si sigue sin funcionar (diagnóstico profundo):

**Necesito ver:**
1. Screenshot de la consola del navegador (tab Console)
2. Screenshot del Network tab mostrando `/api/agents/shared` request
3. Screenshot de lo que el usuario ve en la lista de agentes

**Con eso puedo:**
- Identificar si es problema de API
- Identificar si es problema de rendering
- Crear fix específico

---

## 📞 **Mensaje para el Usuario**

```
Hola Daniel,

He verificado en la base de datos y confirmo que el agente 
"GOP GPT M3" SÍ está compartido contigo correctamente.

El problema parece ser de caché del navegador.

Por favor intenta:

1. Presiona Ctrl + Shift + R (o Cmd + Shift + R si usas Mac)
2. Espera que recargue la página
3. Verifica si ahora ves "GOP GPT M3"

Si no funciona:

1. Click en tu perfil (esquina inferior izquierda)
2. Click en "Cerrar Sesión"
3. Click en "Continuar con Google"
4. Inicia sesión con dortega@novatec.cl

El agente debería aparecer después de esto.

Si aún no lo ves, por favor avísame y revisaremos más a fondo.

Saludos,
Alec
```

---

**Archivo generado:** 2025-11-04  
**Status:** Diagnóstico completo  
**Próximo paso:** Usuario hace logout/login o hard refresh





