# Quick Test: Archive Feature

**Testing Time:** ~2 minutes  
**Date:** 2025-10-15

---

## 🚀 Quick Test Steps

### Test 1: Archive an Agent (30 seconds)

1. **Open chat:** http://localhost:3000/chat
2. **Hover over any agent** in the left panel
3. **Look for archive icon** (box icon) next to rename (pencil) icon
4. **Click archive button**
5. **Verify:** Agent disappears from the list

**Expected:**
- ✅ Agent is hidden from main view
- ✅ If it was selected, chat clears
- ✅ Console shows: `📦 Agente archivado: [id]`

---

### Test 2: View Archived Agents (20 seconds)

1. **Click "Mostrar archivados"** button above agent list
2. **Verify:** Previously archived agent reappears
3. **Look for amber styling:**
   - Amber background
   - Amber border
   - Italic text
   - Amber icon

**Expected:**
- ✅ Archived agent visible with different styling
- ✅ Toggle button text changes to "Ocultar archivados"
- ✅ Archive icon becomes restore icon (green)

---

### Test 3: Restore an Agent (20 seconds)

1. **With archived agents visible**, hover over archived agent
2. **Click restore icon** (ArchiveRestore, green)
3. **Verify:** Agent styling returns to normal
4. **Click "Ocultar archivados"** to hide archived
5. **Verify:** Restored agent still visible

**Expected:**
- ✅ Agent restored to active status
- ✅ Styling changes from amber to normal
- ✅ Console shows: `📂 Agente restaurado: [id]`

---

### Test 4: Count Badge (15 seconds)

1. **Archive 2-3 agents**
2. **Click "Ocultar archivados"** if showing
3. **Look for badge** next to toggle button text

**Expected:**
- ✅ Badge shows correct count of archived agents
- ✅ Badge has amber background
- ✅ Badge disappears when "Mostrar archivados" enabled

---

### Test 5: Persistence (30 seconds)

1. **Archive an agent**
2. **Refresh the page** (Cmd+R)
3. **Verify:** Agent stays archived
4. **Click "Mostrar archivados"**
5. **Verify:** Archived agent appears

**Expected:**
- ✅ Archive status persists across page reload
- ✅ Data saved to Firestore
- ✅ State restored correctly

---

## 🎨 Visual Checks

### Active Agent
```
□ Normal background (white/hover slate)
□ Normal text (slate-700)
□ Normal icon (slate-400)
□ Archive button (amber on hover)
```

### Archived Agent (when visible)
```
□ Amber background (amber-50)
□ Amber border (amber-200)
□ Italic text (amber-700)
□ Amber icon (amber-400)
□ Restore button (green on hover)
```

### Toggle Button
```
□ Shows "Mostrar archivados" when hiding
□ Shows "Ocultar archivados" when showing
□ Archive icon when hiding
□ ArchiveRestore icon when showing
□ Count badge when archived agents exist
```

---

## ⚠️ Known Issues

None expected - this is a simple, additive feature.

---

## 🐛 If Something Doesn't Work

### Archive button not appearing
- **Check:** Hover over agent (buttons appear on hover)
- **Check:** Browser console for errors

### Agent not disappearing after archive
- **Check:** Browser console for API errors
- **Try:** Refresh page and check again

### Archived agents not appearing when toggled
- **Check:** Console for filtering errors
- **Verify:** Agent actually has status: 'archived' in Firestore

### Console Commands
```javascript
// Check conversation status in console
console.log(conversations.map(c => ({ title: c.title, status: c.status })))

// Count archived
console.log('Archived:', conversations.filter(c => c.status === 'archived').length)
```

---

## ✅ Success Criteria

All tests passing = Feature working correctly!

**Ready to commit:** Yes  
**Ready to deploy:** Yes (after local testing passes)

---

**Next Steps:**
1. Run these quick tests
2. If all pass → Commit changes
3. Deploy to production
4. Verify in production

