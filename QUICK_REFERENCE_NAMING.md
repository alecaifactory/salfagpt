# 🎯 Quick Reference: Agent Naming & Response Time

---

## 🤖 Smart Auto-Rename

| Scenario | Agent Name Behavior | hasBeenRenamed |
|----------|---------------------|----------------|
| 1️⃣ Create new agent | "Nuevo Agente" | `false` |
| 2️⃣ First config | "Asistente de RRHH" ✨ (auto) | `false` |
| 3️⃣ User edits name | "María - Bot RRHH" (manual) | `true` ✅ |
| 4️⃣ Re-configure | "María - Bot RRHH" (preserved!) | `true` ✅ |

**Rule:** Auto-rename ONLY if `hasBeenRenamed == false`

---

## ⏱️ Response Time Format

| Duration | Format | Example |
|----------|--------|---------|
| < 60 seconds | `X.Xs` | `5.2s`, `23.4s`, `45.7s` |
| 1-59 minutes | `Xm Ys` | `2m 30s`, `5m 12s`, `15m 45s` |
| ≥ 1 hour | `Xh Ym` | `1h 15m`, `2h 30m` |

**Location:** Top-right of AI message header

---

## 🖱️ Agent Rename Actions

| Action | Result |
|--------|--------|
| **Single-click** agent name | Select agent (switch to it) |
| **Double-click** agent name | Edit mode ✨ (rename) |
| **Click pencil** button | Edit mode (rename) |

**Both double-click and pencil work!** Choose your preferred method.

---

## 🔧 Console Messages

### Auto-Rename
```
🔄 Auto-renaming agent to: Asistente de RRHH
✅ Título actualizado (auto): agent-123
```

### Manual Rename
```
✅ Título actualizado (manual): agent-123
```

### Preserved Rename
```
ℹ️ Agent already renamed by user, preserving name: María - Bot RRHH
```

---

## ✅ Testing Checklist (30 seconds each)

### Test Auto-Rename
- [ ] Create agent
- [ ] Configure
- [ ] Name changes ✅

### Test Preservation
- [ ] Rename manually
- [ ] Configure again
- [ ] Name preserved ✅

### Test Response Time
- [ ] Send message
- [ ] See time displayed ✅

### Test Double-Click
- [ ] Double-click name
- [ ] Edit mode activates ✅

---

## 🐛 Troubleshooting

### Auto-rename not happening?
**Check:** Console shows `ℹ️ Agent already renamed by user`  
**Fix:** This is correct! User's name is being preserved.

### Response time missing?
**Check:** Look at AI message header (top-right)  
**Note:** Only shows for AI responses, not user messages

### Double-click opens agent twice?
**Fix:** Should only activate edit mode  
**Check:** Verify `e.stopPropagation()` is working

---

**All features ready to test!** 🚀

**Test now at:** http://localhost:3000/chat

