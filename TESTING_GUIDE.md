# 🧪 Manual Testing Guide - Flow Chat

## ✅ What's Working

**Complete chat interface with:**
- Conversation creation & switching
- Message sending & AI responses
- Context source management
- Agent-specific context persistence
- Firestore integration with fallbacks

---

## 🎯 Manual Test Scenarios

### Test 1: Basic Chat Flow
**Steps:**
1. Open http://localhost:3000/chat
2. Click "Nuevo Agente" button
3. Type a message in the input field
4. Click Send button (or press Enter)
5. Wait for AI response

**Expected Results:**
- ✅ New conversation appears in left sidebar
- ✅ Your message appears (blue, right-aligned)
- ✅ AI response appears (white, left-aligned)
- ✅ Input field clears after sending
- ✅ Loading spinner shows while waiting

---

### Test 2: Context Activation
**Steps:**
1. Find "Fuentes de Contexto" section (bottom left)
2. Click toggle next to "Documento Demo.pdf" (turns green)
3. Send a message: "Qué dice el documento?"
4. AI should reference the demo content in response

**Expected Results:**
- ✅ Toggle turns green when activated
- ✅ AI response includes information from demo PDF
- ✅ Context persists when switching conversations

---

### Test 3: Agent-Specific Context
**Steps:**
1. Create Agent A → Activate context → Send message
2. Click "Nuevo Agente" (creates Agent B)
3. Notice context is OFF for Agent B
4. Switch back to Agent A
5. Context should still be ON for Agent A

**Expected Results:**
- ✅ Each agent remembers its own context settings
- ✅ Context toggle state persists per conversation
- ✅ No cross-contamination between agents

---

### Test 4: Conversation Persistence
**Steps:**
1. Send 3 messages in a conversation
2. Click "Nuevo Agente" (switch away)
3. Click back to first conversation
4. All 3 messages should still be there

**Expected Results:**
- ✅ Messages load from Firestore
- ✅ Conversation history persists
- ✅ No data loss when switching

---

### Test 5: Firestore Fallback
**Steps:**
1. If Firestore is unavailable
2. Page still loads
3. Can create temp conversations
4. Can send messages

**Expected Results:**
- ✅ App doesn't crash
- ✅ Temp conversations (ID starts with "temp-")
- ✅ Basic functionality works
- ✅ Console shows warnings, not errors

---

## 🐛 Known Limitations

1. **Context sources are demo data** - No real PDF upload yet
2. **No multi-user testing** - Single user mode only
3. **No validation pipeline** - Quality control not implemented
4. **No sharing features** - Email generation not active
5. **No optimizations** - Latency not optimized yet

---

## 📊 Success Criteria

### Core Functionality (This Step)
- [x] Page loads without blank screen
- [x] Can create new conversations
- [x] Can send messages and receive responses
- [x] Can toggle context sources
- [x] Context persists per agent
- [x] Graceful Firestore fallback

### Future Steps
- [ ] Validation pipeline (50% validation rate)
- [ ] Email generation (20% sharing conversion)
- [ ] Context discovery & search
- [ ] Sub-3s extraction latency
- [ ] 80% context reuse rate
- [ ] Viral loops & network effects

---

## 🚀 Next Steps

Once manual testing confirms all scenarios pass:

1. **Document results** - Screenshot each test
2. **Report issues** - Note any bugs or UX problems
3. **Prioritize improvements** - What needs fixing first?

**After validation:**
- Move to Step 2: Quality & Sharing features
- Move to Step 3: 100x optimization

---

## 💡 Testing Tips

- **Use browser DevTools** (F12) to see console logs
- **Check Network tab** for API call success/failure
- **Refresh page** (Cmd+R) if something seems stuck
- **Hard refresh** (Cmd+Shift+R) to clear cache
- **Test in incognito** to rule out cache issues

---

**Current Status:** ✅ Ready for manual testing  
**Last Updated:** October 12, 2025  
**Test Completion:** Pending user validation



