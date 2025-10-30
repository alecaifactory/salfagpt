# Feedback System - Troubleshooting Guide

**Date:** 2025-10-29  
**Version:** 1.0.0

---

## 🐛 Error: "Error al enviar feedback. Intenta nuevamente."

### Síntomas:
- Usuario llena formulario de feedback
- Click en "Enviar" 
- Alert muestra: "Error al enviar feedback. Intenta nuevamente."

### Causas Posibles:

#### 1. **Servidor no reiniciado después de agregar endpoint**

**Fix:**
```bash
# Reiniciar servidor
pkill -f "astro dev"
npm run dev
```

**Verificar:**
```bash
# Check servidor corriendo
curl http://localhost:3000/
# Debería retornar HTML

# Check endpoint existe
curl -X POST http://localhost:3000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
# Debería retornar error 401 (Unauthorized) - significa que endpoint existe
```

#### 2. **Session no válida**

**Síntoma en console:**
```
POST /api/feedback/submit 401 (Unauthorized)
```

**Fix:**
```javascript
// Verificar sesión en DevTools console:
document.cookie
// Debería mostrar: flow_session=...

// Si no hay sesión, re-login:
window.location.href = '/auth/login'
```

#### 3. **Firestore connection error**

**Síntoma en server logs:**
```
❌ Error submitting feedback: FirestoreError: ...
```

**Fix:**
```bash
# Authenticate con Firestore
gcloud auth application-default login

# Verificar proyecto
cat .env | grep GOOGLE_CLOUD_PROJECT
# Debería mostrar: gen-lang-client-0986191192
```

#### 4. **Missing required fields**

**Síntoma en console:**
```
POST /api/feedback/submit 400 (Bad Request)
{"error": "Missing required fields"}
```

**Fix en código:**
Verificar que se están enviando todos los campos requeridos:

```typescript
// UserFeedbackPanel.tsx o ExpertFeedbackPanel.tsx
const feedback = {
  messageId: feedbackMessageId,  // ✅ Required
  conversationId: currentConversation, // ✅ Required
  userId: currentUser.id, // ✅ Required
  userEmail: currentUser.email, // ✅ Required
  userRole: currentUser.role, // ✅ Required
  feedbackType: 'user', // ✅ Required
  userStars: starRating, // ✅ Required for user feedback
  userComment: userComment || undefined,
  screenshots: screenshots.length > 0 ? screenshots : undefined,
};
```

#### 5. **Network error**

**Síntoma en console:**
```
Failed to fetch
TypeError: NetworkError
```

**Fix:**
```bash
# Check network
ping localhost
# Verify puerto correcto (3000)
lsof -i :3000
```

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

```javascript
// Abre DevTools (F12) → Console tab
// Busca error rojo después de click "Enviar"

// Debería mostrar uno de:
// - POST /api/feedback/submit 401
// - POST /api/feedback/submit 400
// - POST /api/feedback/submit 500
// - Failed to fetch
```

### Step 2: Check Network Tab

```
DevTools → Network tab → Clear → Click "Enviar"

Buscar request:
Name: submit
Status: 401, 400, 500, o Failed
Method: POST

Click en request → Preview tab
Ver response body con error específico
```

### Step 3: Check Server Logs

```bash
# Ver logs del servidor en terminal donde corre npm run dev
# Buscar líneas con ❌ o ERROR

# O ver archivo de log:
tail -f /tmp/salfagpt-dev.log
```

### Step 4: Test Endpoint Manually

```bash
# Get session token from browser
# DevTools → Application → Cookies → localhost:3000
# Copy value of "flow_session"

SESSION_TOKEN="eyJ..." # Paste aquí

# Test endpoint
curl -X POST http://localhost:3000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=$SESSION_TOKEN" \
  -d '{
    "messageId": "test-msg-123",
    "conversationId": "test-conv-456",
    "userId": "YOUR_USER_ID",
    "userEmail": "your@email.com",
    "userRole": "user",
    "feedbackType": "user",
    "userStars": 4,
    "userComment": "Test feedback"
  }'

# Debería retornar:
# {"success":true,"feedbackId":"...","ticketId":"..."}
```

---

## 🔧 Quick Fixes

### Fix 1: Restart Server (Más común)

```bash
# Terminal 1 (donde corre npm run dev):
Ctrl+C  # Stop server

npm run dev  # Start again

# Wait for "astro dev server ready"
# Retry feedback
```

### Fix 2: Clear Browser Cache

```
1. DevTools → Application → Storage
2. Clear site data
3. Hard reload (Cmd+Shift+R)
4. Re-login
5. Retry feedback
```

### Fix 3: Simplified Endpoint (Emergency)

Si nada funciona, usar endpoint ultra-simple para testing:

```typescript
// src/pages/api/feedback/test.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  console.log('📝 Test feedback received:', body);
  
  return new Response(
    JSON.stringify({ success: true, test: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

Luego en frontend temporalmente:
```typescript
// Cambiar endpoint temporalmente
const response = await fetch('/api/feedback/test', {
  method: 'POST',
  ...
});
```

---

## ✅ Verification Checklist

Cuando feedback funcione, deberías ver:

### En Browser Console:
```
📝 Submitting feedback: user
✅ Feedback submitted successfully: {feedbackId: "...", ticketId: "..."}
```

### En Server Logs:
```
💾 Saving feedback to Firestore: { messageId, conversationId, feedbackType, userId }
✅ Feedback created: abc123xyz (user)
✅ Ticket created: ticket-789def
```

### En Firestore Console:
```
1. Ir a: console.firebase.google.com
2. Project: gen-lang-client-0986191192
3. Firestore Database
4. Collections:
   - message_feedback → Ver nuevo documento
   - feedback_tickets → Ver nuevo ticket
```

### En UI:
```
Alert: "Feedback enviado exitosamente. Ticket creado: ticket-..."
Modal se cierra
Botón de feedback queda disponible para próximo mensaje
```

---

## 🎯 Current Status

**Fix Applied:**
- ✅ Simplified endpoint (removed AI dependencies for MVP)
- ✅ Fixed duplicate catch blocks
- ✅ Added helper functions (generateBasicTitle, determinePriority)
- ✅ Improved error logging
- ✅ Server restarted

**Next Test:**
1. Refresh browser (hard reload)
2. Send message to agent
3. Click feedback button
4. Fill form (select stars, add comment)
5. Click "Enviar"
6. Should see success message ✅

---

## 🚨 Si Todavía Falla

### Diagnostic Command:

```bash
# Check endpoint file exists
ls -la src/pages/api/feedback/submit.ts

# Check TypeScript errors
npm run type-check 2>&1 | grep "feedback"

# Test endpoint directly
curl -X POST http://localhost:3000/api/feedback/submit

# Should return 401 if endpoint works (auth required)
# If returns 404, endpoint not loading
```

### Enable Verbose Logging:

```typescript
// In ChatInterfaceWorking.tsx, handleSubmitFeedback:
const handleSubmitFeedback = async (feedback) => {
  console.log('🐛 DEBUG: Submitting feedback:', feedback);
  console.log('🐛 DEBUG: Endpoint URL:', '/api/feedback/submit');
  
  try {
    const response = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });

    console.log('🐛 DEBUG: Response status:', response.status);
    console.log('🐛 DEBUG: Response ok:', response.ok);

    const result = await response.json();
    console.log('🐛 DEBUG: Response body:', result);
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    // ... rest
  } catch (error) {
    console.error('🐛 DEBUG: Error caught:', error);
    alert('Error: ' + (error instanceof Error ? error.message : 'Unknown'));
  }
};
```

---

## 📝 Common Error Messages

### "Unauthorized"
```
Status: 401
Causa: No hay sesión válida
Fix: Re-login
```

### "Forbidden"
```
Status: 403
Causa: userId no coincide con session.id
Fix: Verificar que se pasa userId correcto
```

### "Missing required fields"
```
Status: 400
Causa: Falta messageId, conversationId, o feedbackType
Fix: Verificar props en componente
```

### "Star rating is required"
```
Status: 400
Causa: User feedback sin userStars
Fix: Verificar que starRating !== null antes de submit
```

### "Internal server error"
```
Status: 500
Causa: Error en Firestore o server
Fix: Check server logs, verificar Firestore connection
```

---

## 🎯 Expected Behavior

### Successful Submit:

```
1. User clicks "Enviar"
   ↓
2. Button shows "Enviando..." (disabled)
   ↓
3. POST /api/feedback/submit
   ↓
4. Server logs: "💾 Saving feedback..."
   ↓
5. Firestore write succeeds
   ↓
6. Server logs: "✅ Feedback created: abc123"
   ↓
7. Ticket created: "✅ Ticket created: ticket-xyz"
   ↓
8. Response 200: {success: true, feedbackId, ticketId}
   ↓
9. Alert: "Feedback enviado exitosamente. Ticket creado: ..."
   ↓
10. Modal closes
    ↓
11. ✅ DONE
```

---

**Status:** ✅ Endpoint fixed and simplified  
**Server:** Restarted  
**Ready:** For testing

**Try again:** Refresh page → Send message → Click feedback → Submit

