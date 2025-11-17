# 🧪 Testing Guide - Document Collaboration System

**Date:** November 15, 2025  
**Duration:** 15-20 minutes  
**Prerequisites:** Localhost running on port 3000

---

## 🎯 Testing Objectives

1. ✅ Verify document viewer opens correctly
2. ✅ Verify file loads from Cloud Storage
3. ✅ Verify UI is prominent and accessible
4. ✅ Verify annotations can be created
5. ✅ Verify invitations can be sent
6. ✅ Verify collaboration page works

---

## 🚀 Before Testing

### Deploy Indexes (Critical - Do This First!)
```bash
firebase deploy --only firestore:indexes --project salfagpt
```

**Wait 2-3 minutes** for indexes to reach READY state:
```bash
gcloud firestore indexes list --project salfagpt | grep document_annotations
gcloud firestore indexes list --project salfagpt | grep collaboration_invitations
```

**Expected:** All show `STATE: READY`

### Start Dev Server
```bash
npm run dev
```

**Expected:** Server starts on http://localhost:3000

---

## 📋 Test Sequence

### Test 1: Prominent Document Button (2 min)

**Steps:**
1. Go to http://localhost:3000/chat
2. Login if needed
3. Select any agent that has context sources
4. Send message: "Dame un resumen de los documentos"
5. Wait for AI response with references

**Look for:**
- References section below response
- Each reference shows: `[#] [Source Name] [📄 Ver Documento] [Score]`
- **NEW:** Blue gradient button "Ver Documento" prominently placed
- Button has `FileText` icon

**Success Criteria:**
- ✅ Button is highly visible (not hidden)
- ✅ Button is blue gradient (stands out)
- ✅ Button is right next to source name
- ✅ Can see it without scrolling

**Screenshot:** Take screenshot of reference with button

---

### Test 2: Document Viewer Opens (3 min)

**Steps:**
1. From Test 1, click the [📄 Ver Documento] button
2. Observe loading state

**Expected:**
- Modal opens instantly
- Loading spinner appears
- Progress bar shows (0% → 100%)
- Message: "Cargando documento..."
- Progress updates smoothly

**After Loading (1-3 seconds):**
- PDF displays on left side (60% of modal)
- Tools panel on right side (40% of modal)
- Modal covers ~80% of screen
- Header shows document name
- Header shows file stats (pages, MB)
- Download button in header
- Close button in header

**Success Criteria:**
- ✅ Modal is large (not cramped)
- ✅ PDF is readable
- ✅ Progress bar provides feedback
- ✅ Tools are visible on right

**Screenshot:** Take screenshot of opened viewer

---

### Test 3: Text Selection (2 min)

**Steps:**
1. In document viewer, select some text in the PDF
2. Release mouse

**Expected:**
- Text selection works (browser default)
- Yellow box appears in tools panel showing selected text
- Format: "Texto seleccionado: [text preview]"
- "Preguntar" button becomes enabled (not grayed out)
- "Solicitar Revisión" button becomes enabled

**Success Criteria:**
- ✅ Selection works smoothly
- ✅ Selected text displays
- ✅ Buttons enable correctly

---

### Test 4: Create Annotation (3 min)

**Steps:**
1. With text selected, click "Preguntar" button

**Expected:**
- Question modal opens (overlay on viewer)
- Selected text shown in yellow box
- Question textarea focused
- "Guardar Pregunta" button visible

2. Type question: "¿Esto aplica a contratos internacionales?"
3. Click "Guardar Pregunta"

**Expected:**
- Loading state: Button shows "Guardando..." with spinner
- Success alert: "✅ Pregunta anotada correctamente"
- Modal closes
- Annotation appears in right panel annotations list
- Yellow dot marker appears on PDF (simplified position)

**Verify Persistence:**
4. Close document viewer
5. Reopen document viewer

**Expected:**
- Annotation still visible in list
- Count shows: "Anotaciones (1)"

**Success Criteria:**
- ✅ Annotation saves to Firestore
- ✅ Annotation displays correctly
- ✅ Annotation persists on reload
- ✅ UI provides clear feedback

---

### Test 5: Send Invitation (4 min)

**Steps:**
1. Select text in PDF
2. Click "Solicitar Revisión" button

**Expected:**
- Invitation modal opens
- Selected text shown in orange box
- Form fields:
  * Recipient name (optional)
  * Recipient email (required)
  * Personal message (required)
  
3. Fill form:
   - Name: "Juan Pérez"
   - Email: "test@example.com"
   - Message: "Por favor revisa esta sección del contrato"

4. Observe Gmail status
   - If not connected: Shows "Conectar Gmail" info box
   - Button says: "Crear Invitación"

5. Click button

**Expected:**
- Loading state: "Enviando..." with spinner
- Success alert with shareable link
- Link format: `http://localhost:3000/collaborate/[random-token]`
- Modal closes

6. Copy the link

**Success Criteria:**
- ✅ Invitation created in Firestore
- ✅ Unique token generated
- ✅ Link provided to user
- ✅ UI feedback clear

---

### Test 6: Collaboration Page (3 min)

**Steps:**
1. Open incognito window (Cmd+Shift+N)
2. Paste invitation link
3. Visit link

**Expected:**
- Beautiful landing page loads
- Purple gradient background
- White card container
- Shows:
  * "🤝 Invitación de Colaboración" title
  * Sender info (name, email)
  * Document name
  * Personal message
  * Selected text (if any) in highlighted box
  * "✨ Bienvenido a Flow" section
  * "🚀 Iniciar Sesión con Google" button
  * "30 días gratis" mention

**Success Criteria:**
- ✅ Page loads correctly
- ✅ All invitation details show
- ✅ Welcome message is warm
- ✅ Call-to-action is clear
- ✅ Trial offer is visible

**Screenshot:** Take screenshot of collaboration page

---

### Test 7: Gmail Connection Status (1 min)

**Steps:**
1. In document viewer, look at bottom of right panel
2. Check Gmail status section

**Expected:**
- Shows "Conectar Gmail para enviar invitaciones" button
- Button is blue, full width
- Has Gmail icon

3. Click button

**Expected:**
- Instructions page opens
- Shows step-by-step Gmail OAuth setup
- Explains what scopes are needed
- Provides "Volver" button

**Success Criteria:**
- ✅ Status check works
- ✅ Instructions are clear
- ✅ Future OAuth ready

---

### Test 8: Annotations List (2 min)

**Steps:**
1. Create 2-3 annotations (repeat Test 4)
2. Observe right panel annotations list

**Expected:**
- Shows count: "Anotaciones (3)"
- Each annotation displays:
  * Icon (blue circle for questions)
  * Selected text (truncated if long)
  * Question text
  * User name
  * Timestamp (formatted)
  
**Success Criteria:**
- ✅ All annotations visible
- ✅ Properly formatted
- ✅ Chronological order (newest first)
- ✅ Scrollable if many

---

## 🔍 API Testing (Optional)

### Test Annotations API
```bash
# Get annotations for a document
curl -X GET "http://localhost:3000/api/annotations?sourceId=YOUR_SOURCE_ID&userId=YOUR_USER_ID" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN"

# Expected: JSON array of annotations
```

### Test Invitation API
```bash
# Create invitation
curl -X POST "http://localhost:3000/api/invitations/send" \
  -H "Content-Type: application/json" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN" \
  -d '{
    "invitation": {
      "sourceId": "SOURCE_ID",
      "sourceName": "Document.pdf",
      "senderId": "USER_ID",
      "senderEmail": "user@example.com",
      "senderName": "User Name",
      "recipientEmail": "recipient@example.com",
      "message": "Please review this document"
    },
    "userId": "USER_ID"
  }'

# Expected: { "success": true, "invitationLink": "..." }
```

### Test Gmail Status
```bash
curl -X GET "http://localhost:3000/api/gmail/status?userId=YOUR_USER_ID" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN"

# Expected: { "connected": false }
```

### Test Referral Network
```bash
curl -X GET "http://localhost:3000/api/referral-network"

# Expected: { "nodes": [], "stats": { ... } }
```

---

## 🚨 Common Issues & Solutions

### Issue: "Ver Documento" button doesn't appear

**Diagnosis:**
```
Check MessageRenderer.tsx line ~424
Button should be inside references.map()
```

**Solution:**
```bash
# Verify file updated
grep "Ver Documento" src/components/MessageRenderer.tsx

# Should show the button code
```

### Issue: Document viewer doesn't open

**Diagnosis:**
```typescript
// Check console for errors
// Look for: "Could not load source for reference"
```

**Solution:**
```typescript
// Verify source has storagePath in metadata
// Check: source.metadata?.storagePath
// Should be: "documents/[timestamp]-[filename]"
```

### Issue: Firestore index error

**Error Message:**
```
"The query requires an index"
```

**Solution:**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes --project salfagpt

# Wait for READY
gcloud firestore indexes list --project salfagpt

# All should show: STATE: READY
```

### Issue: Annotation not saving

**Diagnosis:**
```bash
# Check Firestore rules allow writes
# Check browser console for errors
# Check network tab for API response
```

**Solution:**
```bash
# Ensure authenticated
# Verify userId matches session
# Check API endpoint logs
```

---

## 📊 Success Metrics to Track

### Immediate Verification
- [ ] Button visibility: Can you see it without looking?
- [ ] Load time: Does PDF load in <3 seconds?
- [ ] Modal size: Does it cover ~80% of screen?
- [ ] Annotation save: Does it succeed in <1 second?
- [ ] Invitation create: Does it generate link?

### User Experience
- [ ] Is the flow obvious? (No instructions needed)
- [ ] Is it delightful? (Feels professional)
- [ ] Is it fast? (No frustrating waits)
- [ ] Is it reliable? (Works every time)

### Growth Potential
- [ ] Would you share this? (Personal answer)
- [ ] Is collaboration valuable? (Real workflow benefit)
- [ ] Is invitation compelling? (Would you click the link?)
- [ ] Is trial offer attractive? (30 days enough?)

---

## 🎓 What to Look For

### Good Signs ✅
- PDF loads smoothly
- Progress bar is smooth (not jumpy)
- Buttons are obvious (don't need to hunt)
- Annotations save instantly
- Invitations feel personal
- Collaboration page is welcoming

### Red Flags 🚩
- File fails to load (check Cloud Storage path)
- Modal is too small (should be 80%)
- Buttons are hard to find (should be prominent)
- Long waits without feedback (add progress bars)
- Generic error messages (should be specific)
- Collaboration page feels cold (should be warm)

---

## 📸 Screenshots to Take

1. **Reference with Prominent Button**
   - Show before/after if possible
   - Highlight the blue [Ver Documento] button

2. **Document Viewer Modal**
   - Full modal covering 80% of screen
   - PDF on left, tools on right
   - Progress bar if possible

3. **Annotation Creation**
   - Selected text in yellow box
   - Question modal open
   - Annotation in list after save

4. **Invitation Modal**
   - Form filled out
   - Selected text preview
   - Gmail status visible

5. **Collaboration Page**
   - Welcome message
   - Sender info
   - Document details
   - Login button
   - Trial offer

---

## 🎯 Test Results Template

```markdown
# Collaboration System Test Results

**Date:** 2025-11-15
**Tester:** [Your Name]
**Environment:** Localhost
**Browser:** [Chrome/Firefox/Safari]

## Test 1: Document Button
- [ ] Button visible: Yes/No
- [ ] Button prominent: Yes/No
- [ ] Placement: Correct/Incorrect
- Issues: [None / List issues]

## Test 2: Document Viewer
- [ ] Opens: Yes/No
- [ ] Size: ~80% / [Actual]
- [ ] Progress bar: Yes/No
- [ ] PDF loads: Yes/No / [Time]
- Issues: [None / List issues]

## Test 3: Text Selection
- [ ] Selection works: Yes/No
- [ ] Yellow box shows: Yes/No
- [ ] Buttons enable: Yes/No
- Issues: [None / List issues]

## Test 4: Annotation
- [ ] Modal opens: Yes/No
- [ ] Saves successfully: Yes/No
- [ ] Appears in list: Yes/No
- [ ] Persists on reload: Yes/No
- Issues: [None / List issues]

## Test 5: Invitation
- [ ] Modal opens: Yes/No
- [ ] Form works: Yes/No
- [ ] Link generated: Yes/No
- [ ] Link format correct: Yes/No
- Issues: [None / List issues]

## Test 6: Collaboration Page
- [ ] Page loads: Yes/No
- [ ] Welcome shows: Yes/No
- [ ] Details correct: Yes/No
- [ ] Login button works: Yes/No
- Issues: [None / List issues]

## Overall Assessment
- Ready for production: Yes/No/With fixes
- Critical issues: [Count]
- Minor issues: [Count]
- Delightfulness: [1-10]

## Recommendations
[Your feedback here]
```

---

## 💡 Tips for Effective Testing

### Test Like a User
- Pretend you don't know how it works
- Look for obvious next steps
- Get frustrated if things don't work
- Celebrate when things delight you

### Test Edge Cases
- Very long document names
- Very long selected text
- Special characters in emails
- Missing/invalid data
- Slow network (throttle in DevTools)

### Test Across Browsers
- Chrome (primary)
- Firefox (secondary)
- Safari (if on Mac)
- Mobile view (responsive check)

### Document Everything
- Take screenshots
- Note exact error messages
- Record loading times
- Save network logs if issues

---

## 🎉 When to Celebrate

You know the feature is ready when:
1. ✅ You can't wait to show it to users
2. ✅ It feels obvious how to use
3. ✅ It's faster than you expected
4. ✅ You'd want to share it yourself
5. ✅ It makes you smile

If all 5 are true: **Ship it!** 🚀

---

## 🔄 After Testing

### If All Tests Pass
```bash
# Celebrate! 🎉
# Then:

# 1. Document results
# Fill out test results template above

# 2. Take screenshots
# Save in docs/screenshots/collaboration-system/

# 3. Share with team
# Show them the new feature

# 4. Deploy to production
# Follow deployment guide

# 5. Monitor
# Track engagement metrics
```

### If Tests Fail
```bash
# Don't panic! 

# 1. Document the issue
# Exact steps to reproduce
# Expected vs actual behavior
# Screenshots/error messages

# 2. Check docs
# DOCUMENT_COLLABORATION_SYSTEM_2025-11-15.md
# Has troubleshooting section

# 3. Fix the issue
# Update code
# Test again
# Commit fix

# 4. Repeat testing
```

---

## 🎓 Learning Opportunities

### What to Notice
- How progress bars improve perceived performance
- How prominent buttons increase feature discovery
- How personal invitations build trust
- How trial offers reduce friction
- How collaboration creates network effects

### What to Measure
- Click-through rate on "Ver Documento"
- Time to first annotation
- Invitation acceptance rate
- Trial sign-up rate
- Network growth rate

### What to Optimize
- If modal too small → Increase to 85%
- If loading feels slow → Add more progress updates
- If invitations aren't sent → Check Gmail setup
- If acceptance low → Improve landing page
- If growth slow → Optimize referral incentives

---

Happy testing! 🧪✨

**Remember:** You're not just testing code, you're testing a growth engine. Each collaboration creates an opportunity for viral expansion. Make it delightful! 🚀


