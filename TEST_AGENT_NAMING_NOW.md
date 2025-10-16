# 🧪 Test Agent Naming & Response Time - NOW

**Time to test:** 3 minutes  
**Browser:** http://localhost:3000/chat

---

## ✅ Test 1: Auto-Rename on First Config (1 min)

### Steps:
1. Click **"+ Nuevo Agente"**
   - Verify name is "Nuevo Agente" ✅

2. Click **"Configurar Agente"** button (top of chat)
   - Fill purpose: "Asistente de recursos humanos"
   - Submit configuration
   - **Check**: Agent name auto-changes to extracted name ✅

3. Look at left sidebar
   - Verify agent name updated automatically ✅

**Expected:** Agent renames from "Nuevo Agente" → "Asistente de Recursos Humanos" (or similar)

---

## ✅ Test 2: Preserve Manual Rename (1 min)

### Steps:
1. **Double-click** the agent name in left sidebar
   - Verify edit mode activates ✅

2. Change name to: **"Mi Asistente Personal"**
   - Press Enter or click ✓ button
   - Verify name saves ✅

3. Click **"Configurar Agente"** again
   - Change something (like add a line to purpose)
   - Submit configuration
   - **Check**: Name stays "Mi Asistente Personal" ✅ (NOT renamed!)

**Expected:** User's manual name is preserved, not overwritten by config

---

## ✅ Test 3: Response Time Display (1 min)

### Steps:
1. Send a simple message: **"Hola"**
   - Wait for response
   - Look at top-right of AI response box
   - **Check**: You should see time like "3.5s" or "5.2s" ✅

2. Send a more complex message: **"Explica cómo funcionan los contratos de trabajo en Chile"**
   - Wait for response
   - **Check**: You should see longer time like "12.8s" or "1m 5s" ✅

**Expected:** Every AI response shows generation time in header

---

## ✅ Test 4: Double-Click to Rename (30 sec)

### Steps:
1. **Double-click** any agent name in left sidebar
   - Verify edit mode activates immediately ✅
   - No need to hover for pencil button ✅

2. Change name to anything
   - Press Enter
   - Verify saves ✅

3. **Single-click** another agent
   - Verify it selects (doesn't edit) ✅

**Expected:** 
- Double-click = Edit mode
- Single-click = Select agent
- Pencil button still works too

---

## 🎯 What You Should See

### Response Time Examples:
```
┌────────────────────────────────────┐
│ SalfaGPT:                   4.2s  │ ← Fast response
├────────────────────────────────────┤
│ ¡Hola! ¿En qué puedo ayudarte?    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ SalfaGPT:                  23.5s  │ ← Slower response
├────────────────────────────────────┤
│ Los contratos de trabajo en...    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ SalfaGPT:                1m 15s   │ ← Long response
├────────────────────────────────────┤
│ Análisis completo de...           │
└────────────────────────────────────┘
```

### Auto-Rename Flow:
```
Before Config:  "Nuevo Agente"
After Config:   "Asistente de RRHH" ← Auto-renamed ✅
Manual Edit:    "María - RRHH Bot" ← User renamed
Re-Config:      "María - RRHH Bot" ← Preserved! ✅
```

---

## ✅ Success Criteria

**All 4 tests must pass:**
- ✅ Auto-rename works on first config
- ✅ Manual rename is preserved on re-config
- ✅ Response time shows for all messages
- ✅ Double-click edits agent name

**If ANY test fails**, report which one and what happened.

---

## 🐛 Troubleshooting

### Auto-rename not working?
- Check console for: `🔄 Auto-renaming agent to:`
- If you see: `ℹ️ Agent already renamed` → Working as intended!

### Response time not showing?
- Check if message is from AI (not user message)
- Check console for response data
- Verify formatResponseTime function exists

### Double-click not working?
- Make sure you're double-clicking the **name**, not the icon
- Check if edit mode activates
- Single-click should still select the agent

---

**Test now and let me know how it goes!** 🚀

