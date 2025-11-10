# 🧪 Immediate Testing Checklist
**Date:** 2025-11-10  
**Commit:** 2490df6  
**Server:** http://localhost:3000

---

## 🎯 TEST 1: Config Panel Opens (2 min)

### Steps:
1. ✅ Open http://localhost:3000/chat
2. ✅ Login as `alec@getaifactory.com`
3. ✅ Click user avatar (bottom-left corner)
4. ✅ Menu should open
5. ✅ Look for "EVALUACIONES" section
6. ✅ Click "⚙️ Config. Evaluación"

### Expected Result:
```
✅ Modal opens (NOT alert!)
✅ Title: "Configuración de Evaluación"
✅ Subtitle: "Dominio: getaifactory.com"
✅ 4 tabs visible:
   - Expertos & Especialistas
   - Umbrales
   - Automatización  
   - Metas de Calidad
✅ Content shows for each tab
✅ Can click between tabs
✅ Footer has "Guardar Configuración" button
```

### If FAILS:
```
❌ Still shows alert → Component not connected
❌ Blank modal → Component error
❌ No modal → State not working
❌ Import error → Check console

ACTION: Check browser console for errors
```

---

## 🎯 TEST 2: Data Loads (2 min)

### Steps:
1. ✅ With page loaded at http://localhost:3000/chat
2. ✅ Open DevTools: Cmd + Option + J
3. ✅ Look at Console tab
4. ✅ Refresh page (Cmd + R)
5. ✅ Read the diagnostic logs

### Expected Logs:
```
🔍 DIAGNOSTIC: useEffect for loadConversations() TRIGGERED
   userId: 114671162830729001607
   userId type: string
   userId truthy: true
   Calling loadConversations()...

🔍 DIAGNOSTIC: loadConversations() CALLED
📥 Cargando conversaciones desde Firestore...
   userId: 114671162830729001607
   userEmail: alec@getaifactory.com
   API URL: /api/conversations?userId=114671162830729001607
   Making fetch request...
   Response received: { status: 200, statusText: 'OK', ok: true }

✅ 65 conversaciones propias cargadas desde Firestore
   (or similar number)

📋 Agentes: 65
📋 Chats: 0
```

### Expected Sidebar:
```
✅ "Agentes (65)" or similar number
✅ List of conversations visible
✅ Can click on a conversation
✅ Conversation opens and shows messages
```

### If FAILS:
```
❌ userId: undefined
   → Problem in chat.astro (not passing userId prop)
   → Fix: Check src/pages/chat.astro line 50+

❌ userId truthy: false
   → Session not set or expired
   → Fix: Re-login

❌ No "Making fetch request..." log
   → useEffect not calling loadConversations
   → Fix: Check useEffect dependencies

❌ Response status: 401
   → Authentication failed
   → Fix: Check session cookie

❌ Response status: 500
   → Server error
   → Fix: Check terminal for errors

❌ Response 200 but 0 conversations
   → Firestore query returning empty
   → Fix: Check API query filters
```

---

## 🎯 TEST 3: Network Tab (2 min)

### Steps:
1. ✅ DevTools → Network tab
2. ✅ Refresh page
3. ✅ Look for API calls

### Expected Requests:
```
✅ GET /api/conversations?userId=114671162830729001607
   Status: 200
   Response: { groups: [...] }

✅ GET /api/agents/shared?userId=...
   Status: 200 or 404
   
✅ GET /api/folders?userId=...
   Status: 200
```

### If Missing:
```
❌ No /api/conversations call
   → useEffect not executing
   → Check userId prop

❌ All calls return 401
   → Not authenticated
   → Re-login

❌ Calls return 500
   → Server errors
   → Check terminal logs
```

---

## 🎯 TEST 4: Config Panel Functionality (5 min)

### Only if Test 1 passed (modal opens):

**Test 4A: Experts Tab**
1. ✅ Click "Expertos & Especialistas" tab
2. ✅ Should show:
   - "Supervisores (0)" or number
   - "Agregar Supervisor" button
   - "Especialistas (0)" or number
   - "Agregar Especialista" button
3. ✅ Click "Agregar Supervisor"
4. ✅ (For now, should show alert - full form coming later)

**Test 4B: Umbrales Tab**
1. ✅ Click "Umbrales" tab
2. ✅ Should show 4 settings:
   - Umbral de Estrellas Usuario (1-5)
   - Umbral de Evaluación Experto (dropdown)
   - Auto-marcar respuestas inaceptables (checkbox)
   - Mínimo Preguntas Similares (number)
3. ✅ Try changing values
4. ✅ Should update in state

**Test 4C: Automatización Tab**
1. ✅ Click "Automatización" tab
2. ✅ Should show 4 toggles:
   - Generar Sugerencias AI Automáticamente
   - Ejecutar Análisis de Impacto Automático
   - Asignar Especialistas Automáticamente
   - Implementación por Lotes Habilitada
3. ✅ Toggle each checkbox
4. ✅ Should update in state

**Test 4D: Metas de Calidad Tab**
1. ✅ Click "Metas de Calidad" tab
2. ✅ Should show 3 inputs:
   - CSAT Objetivo (1-5, decimals)
   - NPS Objetivo (-100 to 100)
   - Rating Mínimo Aceptable (1-5, decimals)
3. ✅ Change values
4. ✅ Should update in state

**Test 4E: Save Configuration**
1. ✅ Make changes in any tab
2. ✅ Click "Guardar Configuración"
3. ✅ Should show:
   - Button text: "Guardando..."
   - Spinner animation
   - Then: "Configuración guardada exitosamente" alert
4. ✅ Close modal
5. ✅ Reopen modal
6. ✅ Verify changes persisted

---

## 📊 RESULTS TEMPLATE

Copy this and fill in results:

```markdown
## Test Results - [Time]

### Config Panel (Test 1):
- Opens on click: [YES/NO]
- Shows 4 tabs: [YES/NO]
- Can navigate: [YES/NO]
- If NO, error: [paste error]

### Data Loading (Test 2):
- userId in logs: [value or undefined]
- API called: [YES/NO]
- Response status: [200/401/500/other]
- Conversations shown: [number]
- If NO data, reason: [from console]

### Network Tab (Test 3):
- /api/conversations called: [YES/NO]
- Status code: [200/401/500]
- If error, details: [paste]

### Config Functionality (Test 4):
- Experts tab works: [YES/NO]
- Thresholds tab works: [YES/NO]
- Automation tab works: [YES/NO]
- Goals tab works: [YES/NO]
- Save persists: [YES/NO]
- If NO, which failed: [details]

### Overall Status:
- Config Panel: [✅ Working / ⚠️ Issues / ❌ Broken]
- Data Loading: [✅ Working / ⚠️ Issues / ❌ Broken]
- Ready for Full Testing: [YES/NO]
- Ready for Production: [YES/NO]

### Issues Found:
[List any issues]

### Next Steps:
[What to do next]
```

---

## 🚀 AFTER TESTING

### If All Tests Pass:
```bash
# Push to GitHub
git push origin main

# Proceed to full testing
# Follow: TESTING_GUIDE_ALL_PERSONAS_BACKWARD_COMPAT.md

# Then: Deploy to production
```

### If Config Panel Fails:
```
1. Check browser console for errors
2. Check if DomainConfigPanel imported correctly
3. Check if showDomainConfig state exists
4. Check server terminal for build errors
5. Try: rm -rf node_modules/.vite && npm run dev
```

### If Data Loading Fails:
```
1. Review console logs carefully
2. Identify where it stops (useEffect? API call? Response?)
3. Check corresponding section:
   - No useEffect trigger → Check userId prop
   - No API call → Check if statement in useEffect
   - 401 error → Re-login
   - 500 error → Check server terminal
   - 200 but empty → Check Firestore query
```

---

## ⏱️ TIME ESTIMATES

**If Everything Works:**
- Config testing: 10 min
- Data validation: 5 min
- Full persona testing: 1 hour
- Production deploy: 15 min
- **Total: 1.5 hours to production** ✅

**If Issues Found:**
- Debug config: 30 min
- Debug data: 30 min
- Re-test: 20 min
- **Total: 2.5 hours to production**

---

## 💡 PRO TIPS

1. **Keep Console Open:** You'll see everything happening in real-time
2. **Network Tab:** Shows actual API calls being made
3. **React DevTools:** Can inspect component state
4. **Hard Refresh:** Cmd + Shift + R if things look weird
5. **Incognito:** Test as different user without cache

---

**YOU'RE NOW READY TO TEST!** 🎉

**Server:** http://localhost:3000  
**Console:** Cmd + Option + J  
**Network:** Cmd + Option + J → Network tab

**Test config panel first, then data loading, then celebrate!** 🚀

