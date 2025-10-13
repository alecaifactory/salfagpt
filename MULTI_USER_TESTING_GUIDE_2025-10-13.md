# Multi-User Testing Guide - 2025-10-13

## 🎯 Objetivo

Verificar que la privacidad entre usuarios funciona correctamente: cada usuario solo ve sus propios datos.

---

## 🔧 Preparación

### 1. Servidor Corriendo

Verifica que el servidor esté en puerto 3000:
```bash
# En terminal
npm run dev

# Debería mostrar:
# ┃ Local    http://localhost:3000/
```

### 2. Limpiar Cache del Navegador

**IMPORTANTE**: Antes de probar con el nuevo usuario:

1. **Abrir DevTools** (F12 o Cmd+Option+I)
2. **Click derecho en botón Refresh** → "Empty Cache and Hard Reload"
3. O mejor: **Abrir ventana Incognito** (Cmd+Shift+N)

**Por qué**: El cache del navegador puede tener código viejo que causa el error de React hooks.

---

## 🧪 Test 1: Usuario A (Existente)

### Pasos

1. **Abre** `http://localhost:3000/chat`
2. **Login** con `alec@getaifactory.com`
3. **Verifica** que ves tus conversaciones existentes (65+)
4. **Verifica** que ves tus fuentes de contexto
5. **Nota** el número de conversaciones y fuentes

**Resultado esperado**:
```
✅ Login exitoso
✅ Conversaciones cargadas
✅ Fuentes de contexto cargadas
✅ Todo funciona normalmente
```

---

## 🧪 Test 2: Usuario B (Nuevo)

### Pasos

1. **Abre ventana Incognito** (Cmd+Shift+N)
2. **Navega** a `http://localhost:3000/chat`
3. **Login** con `hello@getaifactory.com`
4. **Verifica** que ves:
   - 0 conversaciones (usuario nuevo)
   - 0 fuentes de contexto
   - Mensaje "Comienza una conversación..."

**Resultado esperado**:
```
✅ Login exitoso
✅ 0 conversaciones (correcto - usuario nuevo)
✅ 0 fuentes de contexto (correcto - usuario nuevo)
✅ NO ve nada de alec@getaifactory.com ⭐
```

### Si ves pantalla en blanco:

**Solución**:
1. **Cierra** la ventana incognito
2. **Abre DevTools** en ventana normal (F12)
3. **Application tab** → Clear Storage → Clear site data
4. **Refresca** con Cmd+Shift+R (hard reload)
5. **Intenta nuevamente** en ventana incognito

---

## 🧪 Test 3: Crear Datos en Usuario B

### Pasos (en ventana incognito con hello@)

1. **Click** en "+ Nuevo Agente"
2. **Renombra** a "Agente de Hello" (hover → lápiz → editar)
3. **Envía** un mensaje: "Hola, soy Hello"
4. **Verifica** que el AI responde
5. **Click** "+ Agregar" en Fuentes de Contexto
6. **Sube** un PDF (puede ser el mismo CV)
7. **Espera** la extracción
8. **Verifica** que aparece con toggle verde

**Resultado esperado**:
```
✅ Agente creado
✅ Nombre editado y guardado
✅ Mensaje enviado y respondido
✅ PDF subido y procesado
✅ Toggle verde (activado)
```

---

## 🧪 Test 4: Verificar Aislamiento

### Pasos

1. **En ventana incognito** (Usuario B - hello@):
   - Debe ver 1 conversación: "Agente de Hello"
   - Debe ver 1 fuente: "CV Tomás..."
   - NO debe ver conversaciones de Usuario A

2. **En ventana normal** (Usuario A - alec@):
   - Debe ver sus 65+ conversaciones
   - NO debe ver "Agente de Hello"
   - NO debe ver la fuente subida por Usuario B

3. **Refresca ambas ventanas**:
   - Usuario A: sigue viendo solo sus datos ✅
   - Usuario B: sigue viendo solo sus datos ✅

**Resultado esperado**:
```
✅ Usuario A ve SOLO sus datos
✅ Usuario B ve SOLO sus datos
✅ NO hay mezcla de datos
✅ Aislamiento total confirmado ⭐
```

---

## 🧪 Test 5: Intentar Acceso No Autorizado

### Pasos (Opcional - para confirmar seguridad)

1. **En Usuario B** (hello@):
2. **Abre DevTools** → Network tab
3. **Observa** las llamadas API, por ejemplo:
   ```
   GET /api/conversations?userId=106979816699084698289
   ```
4. **Copia** el userId de Usuario B
5. **En Usuario A** (alec@):
6. **Abre DevTools** → Console
7. **Ejecuta**:
   ```javascript
   fetch('/api/conversations?userId=106979816699084698289')
     .then(r => r.json())
     .then(console.log)
   ```

**Resultado esperado**:
```javascript
{
  "error": "Forbidden - Cannot access other user data"
}
```

✅ **HTTP 403 Forbidden** → Seguridad funcionando correctamente

---

## 🔍 Troubleshooting

### Problema: Pantalla en blanco con React hooks error

**Soluciones en orden**:

#### Solución 1: Limpiar cache del navegador
```
1. DevTools (F12)
2. Application tab
3. Clear Storage
4. Clear site data
5. Refresh (Cmd+Shift+R)
```

#### Solución 2: Usar ventana incognito
```
1. Cmd+Shift+N (Chrome)
2. Navegar a http://localhost:3000/chat
3. Login con usuario nuevo
```

#### Solución 3: Diferentes navegadores
```
- Usuario A: Chrome normal
- Usuario B: Firefox incognito
- Esto evita conflictos de cache
```

#### Solución 4: Reiniciar servidor
```bash
# En terminal
pkill -f "astro dev"
rm -rf node_modules/.vite dist .astro
npm run dev
```

---

### Problema: BigQuery dataset not found (warning)

**Síntoma**:
```
Error inserting session: ApiError: Not found: Dataset gen-lang-client-0986191192:flow_dataset
```

**Solución**: ⚠️ **IGNORAR** - Es solo analytics (non-blocking)

El error es porque estamos en modo desarrollo y BigQuery analytics está deshabilitado. NO afecta funcionalidad core.

---

### Problema: Usuario no ve sus datos después de login

**Diagnóstico**:
```bash
# Verificar que usuario está autenticado
curl -s http://localhost:3000/api/conversations?userId=USER_ID \
  -H "Cookie: flow_session=TOKEN"
```

**Si retorna 401**: Token inválido → Re-login  
**Si retorna 403**: userId incorrecto  
**Si retorna 200**: Datos cargando pero UI no muestra → Cache issue

---

## 📊 Checklist de Privacidad

Después de los tests, verifica:

### Aislamiento de Datos ✅
- [ ] Usuario A no ve conversaciones de Usuario B
- [ ] Usuario B no ve conversaciones de Usuario A
- [ ] Usuario A no ve context sources de Usuario B
- [ ] Usuario B no ve context sources de Usuario A

### Aislamiento de Agentes ✅
- [ ] PDF subido en Agent 1 no aparece en Agent 2
- [ ] Toggle state es independiente entre agentes
- [ ] Cada agente mantiene su configuración

### Persistencia ✅
- [ ] Conversaciones persisten al refrescar
- [ ] Mensajes persisten al refrescar
- [ ] Context sources persisten al refrescar
- [ ] Toggle state persiste al refrescar
- [ ] Nombre de agente editado persiste

### Seguridad ✅
- [ ] Intento de acceso cruzado retorna 403
- [ ] Usuario sin login es redirigido a /auth/login
- [ ] Cookies son HTTP-only

---

## 🎯 Resultado Esperado

Al completar todos los tests:

```
✅ Usuario A (alec@getaifactory.com):
   - Ve 65+ conversaciones propias
   - Ve sus fuentes de contexto
   - NO ve nada de Usuario B

✅ Usuario B (hello@getaifactory.com):
   - Ve 1-2 conversaciones propias
   - Ve sus fuentes de contexto
   - NO ve nada de Usuario A

✅ Privacidad Total:
   - Aislamiento de datos confirmado
   - Seguridad en 3 capas funcionando
   - GDPR/CCPA compliance verificado
```

---

## 📝 Reporte de Testing

Después de completar, documenta:

```markdown
## Test Results - [Fecha]

### User A (alec@getaifactory.com)
- Conversations: 65
- Context Sources: 1
- Can see User B data: ❌ NO ✅

### User B (hello@getaifactory.com)
- Conversations: 1
- Context Sources: 1
- Can see User A data: ❌ NO ✅

### Security Tests
- Unauthorized access attempt: 403 Forbidden ✅
- Unauthenticated access: 401 Unauthorized ✅
- Cookie security: HTTP-only ✅

### Conclusion
✅ Privacy working as expected
✅ User data completely isolated
✅ Agent context isolated
✅ Security layers functional
```

---

## 🚀 Próximo Paso

Una vez verificado que la privacidad funciona en localhost:

1. **Deploy Firestore Security Rules**:
   ```bash
   firebase deploy --only firestore:rules --project gen-lang-client-0986191192
   ```

2. **Production deployment**:
   - Deploy to Cloud Run
   - Test with real users
   - Monitor security logs

---

**Fecha**: 2025-10-13  
**Estado**: ✅ Ready for Testing  
**Server**: http://localhost:3000  
**Vite Config**: Added to prevent React duplicate issues

---

**¡Intenta ahora con ventana incognito y el nuevo usuario!** 🧪🔒

