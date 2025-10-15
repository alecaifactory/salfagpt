# Quick Test: Parallel Agents & Archive

**Testing Time:** 3-4 minutes  
**URL:** http://localhost:3000/chat

---

## 🚀 Test 1: Parallel Agents (90 seconds)

### What to Do:
1. **Open MultiDocs** agent
2. **Type:** "Escribe un ensayo de 500 palabras sobre inteligencia artificial"
3. **Click Send**
4. **Watch:** Timer starts → "1s", "2s", "3s"...
5. **WITHOUT WAITING** - Click on **IRD** agent
6. **Type in IRD:** "Hola, dame un resumen breve"
7. **Click Send**
8. **Switch back to MultiDocs** - still processing!

### What You Should See:
```
MultiDocs:
  🔄 Procesando... 18s

IRD:
  🔄 Procesando... 5s
```

### Expected Results:
- ✅ Both agents show timers
- ✅ Timers update independently
- ✅ Can switch between agents freely
- ✅ Sound plays when IRD finishes (🔔)
- ✅ Sound plays when MultiDocs finishes (🔔)
- ✅ No blocking or waiting

**Result:** Parallel execution working! ✨

---

## ⏱️ Test 2: Timer Formats (60 seconds)

### What to Do:
1. **Ask any agent** a question that takes time
2. **Watch the timer format change:**

### Expected Format Changes:
```
0-59 seconds:
  1s → 5s → 30s → 59s

60-119 seconds:
  1m 0s → 1m 15s → 1m 59s

120+ seconds:
  2m 0s → 2m 30s

3600+ seconds (if you wait that long!):
  1h 0m → 1h 15m
```

### Expected Results:
- ✅ Starts at "1s" or "2s"
- ✅ Counts up every second
- ✅ Changes to "Xm Ys" at 60 seconds
- ✅ Mono font (easy to read numbers)

**Result:** Timer formatting working! ⏱️

---

## 🔔 Test 3: Sound Alert (30 seconds)

### What to Do:
1. **Send a message** to any agent
2. **Switch to another tab** or minimize browser
3. **Wait** for response

### Expected Results:
- ✅ Hear subtle "ding" sound when response ready
- ✅ Sound is not too loud (30% volume)
- ✅ Can work in other tabs and know when done

**Result:** Sound notification working! 🔔

---

## ⚠️ Test 4: Feedback Detection (45 seconds)

### What to Do:
1. **Ask agent:** "Cómo puedo mejorar mi currículum?"
2. **Wait for response**
3. **Look for keywords** like:
   - "necesito más información"
   - "podrías proporcionar"
   - "por favor especifica"

### Expected Results:
- ✅ If AI asks for more info → Orange badge appears
- ✅ Badge shows: "⚠️ Feedback"
- ✅ Badge is visible on agent card
- ✅ Badge persists until you send new message

### How to Trigger (Guaranteed):
**Ask:** "Ayúdame con un proyecto"

**AI will say something like:**
"Para ayudarte mejor, necesito más información sobre el tipo de proyecto..."

**Result:** Feedback detection working! ⚠️

---

## 📦 Test 5: Archive Section (90 seconds)

### Part A: Archive Agents
1. **Hover over "New Conversation"** agent
2. **See 3 buttons appear:** Pencil, Archive
3. **Click Archive button** (box icon, amber)
4. **Verify:** Agent disappears from main list
5. **Archive 2 more agents** the same way

### Part B: Collapsed View
After archiving 3 agents:

**What You Should See:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fuentes de Contexto
━━━━━━━━━━━━━━━━━━━━━━━━━━━
↑ Above context section ↑

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Archivados (3)         ▼
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Part C: Expand Section
1. **Click "Archivados (3)"** → Expands upward
2. **Verify:** Shows last 3 archived agents
3. **See:** Each has amber background, italic text
4. **Hover:** Restore button appears (green)

### Part D: Restore
1. **Hover over archived agent**
2. **Click restore button** (ArchiveRestore icon, green)
3. **Verify:** Agent returns to main list
4. **Verify:** Styling back to normal (white background)

### Expected Results:
- ✅ "Archivados" section only appears when archives exist
- ✅ Click to expand/collapse smoothly
- ✅ Shows last 3 archived agents
- ✅ Amber styling for archived agents
- ✅ Restore button works
- ✅ Restored agents return to active

**Result:** Archive section working! 📦

---

## 🎬 Test 6: View All Archived (30 seconds)

**Prerequisites:** Have 4+ archived agents

### What to Do:
1. **Archive 4-5 agents**
2. **Click "Archivados"** to expand
3. **See:** Last 3 archived + "Ver todos los archivados (5)" link
4. **Click "Ver todos los archivados"**

### Expected Modal:
```
┌─────────────────────────────────────┐
│ 📦 Agentes Archivados (5)      [X] │
├─────────────────────────────────────┤
│                                     │
│ 💬 Old Agent 1    [Restaurar]      │
│    Última actividad: 15/10/2025    │
│                                     │
│ 💬 Old Agent 2    [Restaurar]      │
│    Última actividad: 14/10/2025    │
│                                     │
│ 💬 Old Agent 3    [Restaurar]      │
│    Última actividad: 13/10/2025    │
│                                     │
│ ... (all 5 shown)                   │
│                                     │
└─────────────────────────────────────┘
```

### Expected Results:
- ✅ Modal shows all archived agents
- ✅ Click agent → Opens it, closes modal
- ✅ Click Restaurar → Restores agent
- ✅ Shows last activity date
- ✅ Can close modal with X or ESC

**Result:** Full archive view working! 📋

---

## ✨ All Features Working!

If all tests pass:
- ✅ Parallel execution
- ✅ Timer display
- ✅ Sound alerts
- ✅ Feedback detection
- ✅ Archive section
- ✅ View all archived modal

---

## 🎯 Real-World Usage

### Scenario: Multiple Tasks
```
9:00 AM - Ask Agent "Research" to analyze 50-page report
          → Timer shows: 5s, 10s, 15s...

9:01 AM - Switch to Agent "Writer"
          → Ask to draft email
          → Both agents processing!

9:02 AM - "Writer" finishes → 🔔 Sound alert
          → Review and send email

9:03 AM - "Research" still going → 2m 30s
          → Switch to Agent "Quick Tasks"
          → Ask quick question

9:05 AM - "Research" finishes → 🔔 Sound alert
          → Has ⚠️ Feedback badge
          → "Necesito aclarar: ¿quieres análisis técnico o ejecutivo?"
          → Provide feedback

9:06 AM - Archive "Quick Tasks" → Done with it
          → Shows in "Archivados (1)" section
```

**Productivity:** 3x increase - no waiting between tasks!

---

## 🐛 Troubleshooting

### No Timer Appearing
- **Check:** Agent is actually processing (spinner visible?)
- **Check:** Console for errors

### No Sound Playing
- **Normal:** Browser might block audio on first load
- **Fix:** Click anywhere on page first
- **Alternative:** Check browser audio permissions

### Feedback Badge Not Showing
- **Check:** Did AI actually ask for feedback?
- **Try:** Ask "Ayúdame con algo" (vague question)
- **Expected:** AI will ask "¿Con qué necesitas ayuda específicamente?"

### Archive Section Not Appearing
- **Check:** Do you have any archived agents?
- **Action:** Archive at least 1 agent first

---

## ✅ Success!

All features working = Ready for production! 🎉

**Next Steps:**
1. Test all features above (~4 minutes)
2. If everything works → Tell developer "looks good!"
3. Developer commits and deploys

---

**Happy parallel processing!** 🚀✨

