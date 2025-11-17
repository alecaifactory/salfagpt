# Feedback System - Testing Checklist

**Date:** 2025-10-30  
**Purpose:** Verify complete feedback flow works without errors

---

## ✅ Pre-Testing Verification

### 1. Server Running
```bash
# Check server
lsof -i :3000
# Should show node process

# Check endpoint exists
curl -X POST http://localhost:3000/api/feedback/submit
# Should return 401 (auth required) - means endpoint exists
```

### 2. Dependencies Installed
```bash
# Check html2canvas
npm list html2canvas
# Should show: html2canvas@1.4.1

# Check no TypeScript errors
npm run type-check | grep -i feedback
# Should be clean
```

### 3. Firestore Connected
```bash
# Check in browser console:
# Should see: "✅ 168 conversaciones cargadas desde Firestore"
```

---

## 🧪 Test Flow: User Feedback (Basic)

### Step 1: Send Message
```
1. Ir a cualquier agente
2. Enviar mensaje: "¿Cómo funcionas?"
3. Esperar respuesta del agente
4. ✅ Ver respuesta completa
```

### Step 2: Open Feedback Modal
```
5. Scroll al final del mensaje del agente
6. Ver botones: [👑 Experto] [⭐ Calificar]
7. Click "⭐ Calificar"
8. ✅ Modal abre (violet-yellow gradient)
```

### Step 3: Fill Feedback
```
9. Hover sobre estrellas (ver labels)
10. Click 4 estrellas
11. ✅ Estrellas se llenan de violeta
12. Comentario: "Muy útil, gracias"
13. ✅ Texto aparece en textarea
```

### Step 4: Submit (WITHOUT Screenshot)
```
14. Click "Enviar"
15. ✅ Button muestra "Enviando..." con spinner
16. ✅ Button disabled durante envío

Expected Console Logs:
📝 Submitting feedback: {type: 'user', messageId: '...', userId: '...'}
📡 Response status: 200
✅ Feedback submitted successfully: {success: true, feedbackId: '...', ticketId: '...'}
```

### Step 5: Verify Success
```
17. ✅ Alert aparece:
    "✅ ¡Feedback enviado exitosamente!
     🎫 Ticket ID: xyz...
     ✨ Abriendo tu seguimiento..."
     
18. Click OK

19. ✅ Modal "Mi Feedback" abre automáticamente

Expected Console Logs:
📥 Loading my feedback for userId: ...
📡 My feedback response: 200
✅ Feedback data received: 1 items
🎫 Loading tickets for 1 feedbacks
📡 My tickets response: 200
✅ Tickets data received: 1 tickets
```

### Step 6: Verify "Mi Feedback" Display
```
20. ✅ Stats cards muestran:
    - Total: 1 (o más si hay feedback previo)
    - En Cola: 1
    - En Desarrollo: 0
    - Implementados: 0

21. ✅ Ver ticket en lista con:
    - Ring violeta (highlighted)
    - Badge: [🆕 Nuevo] [Priority] [⭐ Usuario] [📅 Hoy]
    - Mensaje: "✨ Tu feedback fue recibido..."

22. Click en ticket para expandir

23. ✅ Ver detalles:
    - Descripción
    - Posición en cola: "#1/1" (si es único)
    - Progress bar
    - Timeline: ✅ Recibido → ⏱️ Esperando revisión
    - Tu feedback original: "4/5 ⭐"
    - Comentario: "Muy útil, gracias"
    - Próximos pasos

24. Click "Cerrar"
25. ✅ Modal se cierra
```

---

## 🧪 Test Flow: Expert Feedback (Advanced)

### Step 1-2: Same as User Feedback

### Step 3: Open Expert Feedback
```
3. Click "👑 Experto" (purple button)
4. ✅ Modal abre (purple theme)
```

### Step 4: Fill Expert Form
```
5. Seleccionar calificación:
   - Click "⭐ Sobresaliente" (purple)
   - ✅ Card se selecciona (ring purple)

6. NPS Score:
   - Click "9"
   - ✅ Button se selecciona (green)

7. CSAT Score:
   - Click "5"
   - ✅ Button se selecciona (green)

8. Notas de Evaluación:
   - Escribir: "Excelente respuesta, muy clara y precisa"
   - ✅ Texto aparece en textarea
```

### Step 5: Submit Expert Feedback
```
9. Click "Enviar Feedback"
10. ✅ Mismo flujo que user feedback
11. ✅ "Mi Feedback" abre con ticket highlighted
```

---

## 🧪 Test Flow: With Screenshot

### Step 1-3: Same as above

### Step 4: Capture Screenshot
```
4. Click "📷 Capturar Pantalla"
5. ✅ Screenshot Annotator abre fullscreen

Expected Console Log:
📸 Capturing full UI (body element)...
✅ Full UI captured: 1380 x 1001 (o similar)
```

### Step 5: Draw Annotations
```
6. Toolbar visible con herramientas
7. Click herramienta "⭕ Círculo"
8. ✅ Button se activa (bg-violet-600)

9. Click en canvas y arrastra
10. ✅ Círculo se dibuja en tiempo real

11. Click herramienta "📝 Texto"
12. Click en canvas
13. ✅ Input de texto aparece
14. Escribir: "Este elemento"
15. Click "Agregar"
16. ✅ Texto aparece en canvas

17. Click "Deshacer"
18. ✅ Última anotación se borra

19. Re-dibujar círculo
20. Click "✔ Confirmar"
21. ✅ Annotator se cierra
22. ✅ Screenshot aparece en modal de feedback:
    "Captura 1 (1 anotación)"
```

### Step 6: Submit with Screenshot
```
23. Click "Enviar"
24. ✅ Feedback se envía (Status 200)
25. ✅ Ticket incluye screenshot
```

---

## 🐛 Known Issues & Fixes Applied

### Issue 1: ✅ FIXED - originalFeedback undefined
**Error:** `Cannot read properties of undefined (reading 'type')`  
**Fix:** API ahora siempre guarda `originalFeedback` object  
**Verification:** Check line 129 in `/api/feedback/submit.ts`

### Issue 2: ✅ FIXED - createdAt.getTime() error
**Error:** `createdAt.getTime is not a function`  
**Fix:** Helper `formatDate()` maneja Date y timestamps  
**Verification:** Check line 121 in `MyFeedbackView.tsx`

### Issue 3: ✅ FIXED - HTTP 500 on "Mi Feedback"
**Error:** `Error: HTTP 500` when loading  
**Fix:** Removed `orderBy()`, sort in memory  
**Verification:** Check `my-feedback.ts` and `my-tickets.ts`

### Issue 4: ✅ FIXED - Duplicate menu item
**Error:** "Backlog de Feedback" duplicado  
**Fix:** Removed, integrated into "Roadmap & Backlog"  
**Verification:** User menu only shows "Mi Feedback" for users

---

## 🔍 Error Debugging

### If "Enviando..." never completes:

**Check Console:**
```javascript
// Should see:
📝 Submitting feedback: {...}
📡 Response status: XXX

// If 401: Re-login
// If 400: Check required fields
// If 500: Check server logs
// If no response: Network issue
```

### If "Mi Feedback" shows error:

**Check Console:**
```javascript
// Should see:
📥 Loading my feedback for userId: ...
📡 My feedback response: 200
✅ Feedback data received: N items

// If error appears, check:
// - TypeError: Check formatDate() is working
// - HTTP 500: Check API endpoints
// - undefined: Check data structure
```

### If Screenshot not capturing:

**Check Console:**
```javascript
// Should see:
📸 Capturing full UI (body element)...
✅ Full UI captured: WxH

// If error:
// - Check html2canvas installed
// - Check browser supports Canvas API
// - Check no CORS errors
```

---

## ✅ Success Criteria

### Feedback Submit:
- [ ] Modal opens (no errors)
- [ ] All fields work (stars, comment, screenshot)
- [ ] Submit completes in <2s
- [ ] Console shows: Status 200
- [ ] Alert shows ticket ID
- [ ] No JavaScript errors

### Mi Feedback Display:
- [ ] Modal opens automatically
- [ ] Stats cards show correct numbers
- [ ] Ticket appears highlighted
- [ ] Dates format correctly
- [ ] Queue position calculated
- [ ] Can expand/collapse tickets
- [ ] No crashes or errors

### Screenshot Annotator:
- [ ] Captures full UI (sidebar + chat + panel)
- [ ] All 4 tools work (circle, rect, arrow, text)
- [ ] Color selection works
- [ ] Undo/Clear work
- [ ] Confirm saves screenshot
- [ ] Screenshot appears in feedback modal

---

## 📋 Current Status

**From Your Logs:**
```
✅ Feedback submitted successfully
✅ Ticket created: UY5GoQIeLBCmnPUnblri
✅ Screenshot captured: 1380 x 1001
✅ UI loaded: 168 conversations, 76 context sources
```

**Errors Fixed:**
```
✅ originalFeedback.type undefined → FIXED
✅ createdAt.getTime() → FIXED  
✅ HTTP 500 on my-feedback → FIXED
```

**Code Status:**
```
✅ Committed to git
✅ Pushed to GitHub
✅ All API keys redacted
✅ No linter errors
✅ TypeScript clean
```

---

## 🚀 Final Test

**Try this exact flow:**

```
1. Refresh page (Cmd+R)
2. Send message: "test feedback"
3. Wait for response
4. Click "⭐ Calificar"
5. Select 5 stars
6. Comment: "testing system"
7. Click "Enviar"
   ↓
Expected:
✅ Alert with ticket ID
✅ "Mi Feedback" opens
✅ Shows your ticket
✅ No errors in console
```

---

**¿Quieres que revise algo específico o está funcionando bien ahora?** 🎯✨











