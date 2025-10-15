# 🧪 Guía de Testing - Autenticación y Seguridad

**Fecha:** 2025-10-14  
**Estado:** ✅ Lista para testing

---

## 🎯 Objetivo

Verificar que el sistema de autenticación funciona correctamente y que usuarios no autenticados NO pueden acceder a `/chat`.

---

## ✅ Test 1: Acceso No Autorizado Bloqueado

### Pasos:
1. **Abre ventana de incógnito** (Cmd+Shift+N en Chrome/Safari)
2. **Navega a:** `http://localhost:3000/chat`
3. **Observa:** Debería redirigir automáticamente

### Resultado Esperado:
```
✅ Redirige a: http://localhost:3000/auth/login?error=unauthorized&redirect=/chat
✅ Muestra mensaje de error:
   "Acceso No Autorizado"
   "Debes iniciar sesión para acceder a esta página"
✅ Botón "Continuar con Google" visible
```

### Verificación en Consola:
```bash
# Ver logs del servidor
⚠️ Unauthorized access attempt to /chat - no token
```

---

## ✅ Test 2: Login Exitoso

### Pasos:
1. **En la ventana de incógnito** (ya en `/auth/login`)
2. **Click en** "Continuar con Google"
3. **Completa** el flujo de OAuth con tu cuenta de Google
4. **Observa** la redirección después de autenticación

### Resultado Esperado:
```
✅ Redirige a Google OAuth
✅ Solicita permisos (si es primera vez)
✅ Callback procesa correctamente
✅ Redirige a: http://localhost:3000/chat
✅ Chat carga normalmente
✅ Usuario autenticado visible en menú
```

### Verificación en Consola:
```bash
🔐 OAuth callback received: { hasCode: true, hasError: false, ... }
✅ User authenticated: { userId: '1146711...', email: '...', ... }
✅ User created/updated in Firestore: ...
🔐 Redirecting authenticated user to: /chat
```

---

## ✅ Test 3: Acceso Autorizado Funciona

### Pasos:
1. **Estando logeado** en `/chat`
2. **Verifica** que puedes:
   - Crear conversaciones
   - Enviar mensajes
   - Ver historial
   - Cambiar configuración

### Resultado Esperado:
```
✅ Todas las funcionalidades trabajan normalmente
✅ Usuario ve sus datos (no datos de otros)
✅ Sin errores en consola
```

---

## ✅ Test 4: Sesión Persistente

### Pasos:
1. **Estando logeado** en `/chat`
2. **Refresca la página** (Cmd+R)
3. **Observa**

### Resultado Esperado:
```
✅ Página carga sin redirigir
✅ Usuario sigue autenticado
✅ Cookie flow_session presente (DevTools → Application → Cookies)
✅ Sesión válida por 7 días
```

---

## ✅ Test 5: Logout

### Pasos:
1. **Estando logeado** en `/chat`
2. **Click** en tu nombre (esquina inferior izquierda)
3. **Click** en "Cerrar Sesión"
4. **Observa** redirección

### Resultado Esperado:
```
✅ Redirige a: http://localhost:3000/?logout=success
✅ Muestra mensaje verde:
   "Sesión Cerrada"
   "Has cerrado sesión exitosamente"
✅ Cookie flow_session eliminada
```

### Verificación en Consola:
```bash
🔐 User logout: { userId: '1146711...', email: '...', ... }
✅ Session cleared, redirecting to home
```

---

## ✅ Test 6: Re-Login Después de Logout

### Pasos:
1. **Después del logout** (en homepage con mensaje de éxito)
2. **Click** en "Continue with Google"
3. **Observa** el flujo

### Resultado Esperado:
```
✅ Redirige a Google OAuth
✅ Si ya diste permisos, login automático (no solicita permisos)
✅ Redirige a /chat
✅ Nueva sesión establecida
```

---

## ✅ Test 7: Sesión Expirada

### Pasos (Simular sesión expirada):
1. **Login exitoso**
2. **En DevTools → Application → Cookies**
3. **Edita cookie** `flow_session` con valor inválido: `invalid_token_test`
4. **Refresca** `/chat`

### Resultado Esperado:
```
✅ Redirige a /auth/login?error=session_expired
✅ Muestra mensaje:
   "Sesión Expirada"
   "Tu sesión ha expirado. Por favor, inicia sesión nuevamente"
```

---

## ✅ Test 8: OAuth Error Handling

### Pasos (Simular error OAuth):
1. **Navega a:** `http://localhost:3000/?error=auth_failed`
2. **Observa** mensaje de error
3. **Prueba otros errores:**
   - `/?error=no_code`
   - `/?error=auth_processing_failed`

### Resultado Esperado:
```
✅ Cada error muestra su mensaje específico
✅ UI clara con icono de error
✅ Botón de login sigue funcional
```

---

## 🔒 Security Checklist

Después de completar todos los tests:

- [ ] **No se puede acceder a /chat sin autenticación**
- [ ] **Login exitoso redirige a /chat**
- [ ] **Logout limpia sesión y redirige**
- [ ] **Sesión persiste 7 días**
- [ ] **Errores se muestran claramente**
- [ ] **Cookie es HTTP-only** (no visible en JavaScript)
- [ ] **Cookie es Secure en producción**
- [ ] **Email debe estar verificado**
- [ ] **Logs de seguridad funcionan**

---

## 📊 Verificación de Logs

### Logs Esperados en Diferentes Escenarios:

#### Intento no autorizado:
```
⚠️ Unauthorized access attempt to /chat - no token
```

#### Login exitoso:
```
🔐 OAuth callback received: { hasCode: true, ... }
✅ User authenticated: { userId: '...', email: '...', ... }
✅ User created/updated in Firestore: ...
🔐 Session cookie set: { secure: false, httpOnly: true, maxAge: '7 days', ... }
🔐 Redirecting authenticated user to: /chat
```

#### Logout:
```
🔐 User logout: { userId: '...', email: '...', ... }
🔐 Session cookies cleared
✅ Session cleared, redirecting to home
```

#### Token expirado:
```
⚠️ JWT token expired: [date]
```

---

## 🐛 Troubleshooting

### Problema: No redirige a login
**Solución:** Verifica que el servidor esté corriendo y la cookie no exista

### Problema: OAuth no funciona
**Solución:** Verifica variables de entorno:
```bash
# Verifica que existan
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $JWT_SECRET
```

### Problema: Cookie no se establece
**Solución:** 
- Verifica que JWT_SECRET esté configurado
- Revisa logs de consola del servidor

---

## ✅ Quick Test Script

```bash
#!/bin/bash
# Test de autenticación rápido

echo "🧪 Testing Authentication System"
echo "================================"

# Test 1: Sin auth debe redirigir
echo "Test 1: Acceso sin autenticación"
curl -s -L "http://localhost:3000/chat" | grep -q "Continuar con Google" && echo "✅ Redirige a login" || echo "❌ NO redirige"

# Test 2: Login endpoint debe redirigir a Google
echo "Test 2: Login endpoint"
REDIRECT=$(curl -s -I "http://localhost:3000/auth/login-redirect" | grep -i location | head -1)
echo "$REDIRECT" | grep -q "google" && echo "✅ Redirige a Google OAuth" || echo "❌ NO redirige a Google"

# Test 3: Logout endpoint debe limpiar cookie
echo "Test 3: Logout endpoint"
curl -s -I "http://localhost:3000/auth/logout" | grep -q "/?logout=success" && echo "✅ Logout funciona" || echo "❌ Logout falla"

echo ""
echo "✅ Tests básicos completados"
echo "⚠️  Tests manuales requeridos para OAuth completo"
```

---

## 🎯 Criterios de Éxito

Para considerar la implementación exitosa:

### Funcional ✅
- [x] `/chat` bloqueado sin autenticación
- [x] Login redirige a Google OAuth
- [x] Callback procesa correctamente
- [x] Usuario redirige a /chat después de login
- [x] Logout limpia sesión
- [x] Errores se muestran en UI

### Seguridad 🔒
- [x] Cookies HTTP-only
- [x] Cookies Secure en producción
- [x] SameSite configurado
- [x] JWT con expiración (7 días)
- [x] Email verificado requerido
- [x] Logging de eventos de seguridad

### UX 🎨
- [x] Mensajes de error claros
- [x] Mensaje de logout exitoso
- [x] Redirect preservado después de login
- [x] UI profesional y accesible

---

**Próximo paso:** Ejecutar todos los tests manualmente y verificar que todo funciona como se espera.

