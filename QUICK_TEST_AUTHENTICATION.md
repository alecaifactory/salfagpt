# 🧪 Quick Test - Autenticación

**Servidor corriendo en:** `http://localhost:3000`

---

## ✅ Test Rápido (2 minutos)

### 1. Abre Incógnito
```
Cmd+Shift+N (Chrome/Safari)
```

### 2. Navega a Chat
```
http://localhost:3000/chat
```

**¿Qué deberías ver?**
- ✅ Redirige automáticamente a `/auth/login`
- ✅ Mensaje rojo: "Acceso No Autorizado"
- ✅ Botón: "Continuar con Google"

---

### 3. Haz Login
```
Click en "Continuar con Google"
Selecciona tu cuenta
```

**¿Qué debería pasar?**
- ✅ Te lleva a Google OAuth
- ✅ Solicita permisos (si es primera vez)
- ✅ Redirige de vuelta a `/chat`
- ✅ Ves la interfaz de chat normalmente

---

### 4. Logout
```
Click en tu nombre (abajo izquierda)
Click en "Cerrar Sesión"
```

**¿Qué debería pasar?**
- ✅ Redirige a homepage
- ✅ Mensaje verde: "Has cerrado sesión exitosamente"
- ✅ Ya no puedes acceder a /chat sin re-login

---

## ✅ Si Todo Funciona

**Responde:** "Todo funciona" o "Looks good"

**Procederé a:**
1. Git commit con los cambios
2. (Opcional) Deploy a producción si lo solicitas

---

## ❌ Si Algo Falla

**Dime qué paso falló y qué viste**

Por ejemplo:
- "En el paso 2, no redirige"
- "En el paso 3, error al hacer login"
- "En el paso 4, no muestra mensaje"

---

## 🔍 Logs a Revisar

**En la terminal del servidor, deberías ver:**

```bash
# Al intentar acceder sin auth:
⚠️ Unauthorized access attempt to /chat - no token

# Al hacer login:
🔐 OAuth callback received: { hasCode: true, ... }
✅ User authenticated: { userId: '...', email: '...', ... }
🔐 Redirecting authenticated user to: /chat

# Al hacer logout:
🔐 User logout: { userId: '...', email: '...', ... }
✅ Session cleared, redirecting to home
```

---

**Toma ~2 minutos. ¿Está todo bien?** 🚀

