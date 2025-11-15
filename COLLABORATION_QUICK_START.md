# 🚀 Document Collaboration - Quick Start Guide

**Date:** November 15, 2025  
**Time to Deploy:** ~10 minutes  
**Difficulty:** Easy

---

## ⚡ Quick Deploy (3 Commands)

```bash
# 1. Deploy Firestore indexes (required for new collections)
firebase deploy --only firestore:indexes --project salfagpt

# 2. Type check
npm run type-check

# 3. Test locally
npm run dev
```

**That's it!** The feature is ready to use.

---

## ✅ Verification Steps

### Step 1: Document Viewer Opens (2 min)

1. Go to http://localhost:3000/chat
2. Send a message that gets a reference response
3. Look for **[📄 Ver Documento]** button (blue gradient, prominently placed)
4. Click button
5. **Expected:** 
   - Modal opens covering 80% of screen
   - Progress bar shows (0→100%)
   - PDF loads on left side
   - Tools panel on right side

### Step 2: Text Selection Works (1 min)

1. In document viewer, select some text
2. **Expected:**
   - Text selection works
   - Yellow box shows selected text
   - "Preguntar" button becomes enabled

3. Click "Preguntar"
4. **Expected:**
   - Question modal opens
   - Selected text previewed
   - Can type question

5. Type a question, click "Guardar"
6. **Expected:**
   - Success message
   - Annotation appears in right panel
   - Persists on reload

### Step 3: Invitation Works (2 min)

1. Select text in viewer
2. Click "Solicitar Revisión"
3. **Expected:**
   - Invitation modal opens
   - Selected text shown
   
4. Fill in:
   - Name: "Test Collaborator"
   - Email: "test@example.com"
   - Message: "Please review this section"
   
5. Click "Crear Invitación"
6. **Expected:**
   - Success alert with link
   - Link format: `http://localhost:3000/collaborate/[token]`

7. Copy link, open in incognito window
8. **Expected:**
   - Collaboration page loads
   - Welcome message displays
   - "Iniciar Sesión con Google" button shows
   - "30 días gratis" mentioned

---

## 🔧 Optional: Gmail Integration Setup

### Prerequisites
- Google Cloud Console access
- OAuth 2.0 credentials

### Steps

1. **Create OAuth Client:**
   ```
   Go to: https://console.cloud.google.com/apis/credentials
   Click: Create Credentials → OAuth 2.0 Client ID
   Type: Web application
   Name: Flow Gmail Integration
   ```

2. **Add Redirect URI:**
   ```
   http://localhost:3000/api/gmail/callback
   https://your-production-url.com/api/gmail/callback
   ```

3. **Add Scopes:**
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.compose
   ```

4. **Add to .env:**
   ```bash
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-secret
   ```

5. **Implement OAuth callback:**
   - Create `src/pages/api/gmail/callback.ts`
   - Exchange code for tokens
   - Store in `gmail_connections` collection
   - Redirect back to returnTo URL

### Testing Gmail
```bash
# After setup:
1. Click "Conectar Gmail" in document viewer
2. OAuth flow initiates
3. Grant permissions
4. Returns to viewer
5. Status shows "Gmail conectado"
6. Create invitation
7. Email sent from your Gmail account
```

---

## 📊 Monitoring

### What to Watch

#### Success Metrics
```bash
# Count annotations created
firebase firestore:count document_annotations --project salfagpt

# Count invitations sent
firebase firestore:count collaboration_invitations --project salfagpt

# Count invitation requests
firebase firestore:count invitation_requests --project salfagpt
```

#### User Engagement
- How many documents viewed per day
- How many annotations created per document
- How many invitations sent per user
- Invitation acceptance rate

#### Viral Growth
- Invitation requests per week
- Network depth distribution
- Referral coefficient (invites per user)
- Trial-to-paid conversion

---

## 🐛 Troubleshooting

### Issue: Document Viewer Doesn't Open

**Check:**
```bash
# 1. Verify reference has sourceId
console.log(reference);
# Should show: { id, sourceId, sourceName, ... }

# 2. Verify source has storage path
# Check Firestore: context_sources/{id}/metadata/storagePath

# 3. Test API endpoint
curl http://localhost:3000/api/context-sources/SOURCE_ID/file
# Should return PDF content
```

**Fix:**
```typescript
// Ensure source has storagePath in metadata
// If missing, re-upload document
```

### Issue: Annotations Not Saving

**Check:**
```bash
# 1. Verify indexes deployed
gcloud firestore indexes list --project salfagpt
# Should show: document_annotations indexes in READY state

# 2. Test API
curl -X POST http://localhost:3000/api/annotations \
  -H "Content-Type: application/json" \
  -d '{"annotation":{...},"userId":"..."}'

# 3. Check Firestore
# Console → document_annotations collection
```

**Fix:**
```bash
# If indexes missing:
firebase deploy --only firestore:indexes --project salfagpt

# Wait 2-3 minutes for indexes to be READY
```

### Issue: Invitation Link Broken

**Check:**
```bash
# 1. Verify invitation exists
# Firestore → collaboration_invitations → search by token

# 2. Test page
curl http://localhost:3000/collaborate/TOKEN
# Should return HTML

# 3. Check PUBLIC_BASE_URL
echo $PUBLIC_BASE_URL
# Should be: http://localhost:3000 (dev) or production URL
```

**Fix:**
```bash
# Update .env if needed
PUBLIC_BASE_URL=http://localhost:3000
```

---

## 💡 Usage Tips

### For Document Owners

**Best Practices:**
1. **Add context before sharing:** Annotate your own questions first
2. **Clear requests:** Be specific in revision requests
3. **Follow up:** Check collaborator comments within 24h
4. **Acknowledge:** Respond to all annotations

### For Collaborators

**Best Practices:**
1. **Read context:** Review document before commenting
2. **Be specific:** Highlight exact text in question
3. **Be constructive:** Suggest improvements, not just criticism
4. **Respond promptly:** Aim for <24h response time

### For Platform Growth

**Viral Loop Optimization:**
1. **Make collaboration delightful:** Fast, easy, obvious value
2. **Reduce friction:** One-click sharing, easy login
3. **Personalize invitations:** Custom messages > generic
4. **Show value early:** Immediate collaboration on first visit
5. **Track & optimize:** Measure every step of funnel

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Deploy indexes: `firebase deploy --only firestore:indexes`
2. ✅ Test locally: Verify all flows work
3. ✅ Create test invitations: Ensure email templates look good

### Short-term (This Week)
1. [ ] Set up Gmail OAuth (if desired)
2. [ ] Test with real users
3. [ ] Gather feedback on collaboration UX
4. [ ] Monitor invitation acceptance rates

### Medium-term (This Month)
1. [ ] Add annotation threading (replies)
2. [ ] Implement real-time updates
3. [ ] Add mobile-responsive view
4. [ ] Create collaboration analytics dashboard

---

## 📚 Code Examples

### Open Document Viewer Programmatically
```typescript
// In your component
const handleOpenDocument = async (sourceId: string) => {
  const source = await loadFullContextSource(sourceId);
  if (source) {
    setDocumentViewerSource(source);
    setShowDocumentViewer(true);
  }
};
```

### Create Annotation Programmatically
```typescript
const annotation = {
  sourceId: documentId,
  userId: currentUser.id,
  userEmail: currentUser.email,
  userName: currentUser.name,
  selectionText: "Important clause here",
  startChar: 1250,
  endChar: 1280,
  annotationType: 'question',
  content: "Does this apply to international contracts?",
  position: { x: 45, y: 67, page: 2 },
  status: 'open',
  createdAt: new Date(),
  updatedAt: new Date(),
  responses: [],
};

const response = await fetch('/api/annotations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ annotation, userId: currentUser.id })
});
```

### Send Invitation Programmatically
```typescript
const invitation = {
  sourceId: documentId,
  sourceName: documentName,
  senderId: currentUser.id,
  senderEmail: currentUser.email,
  senderName: currentUser.name,
  recipientEmail: 'colleague@company.com',
  recipientName: 'Colleague Name',
  message: 'Please review this contract section.',
  accessLevel: 'comment',
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const response = await fetch('/api/invitations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    invitation, 
    userId: currentUser.id,
    selectedText: 'Text to highlight' // Optional
  })
});
```

---

## 🌟 Success Criteria

### Feature is Working If:
- [x] "Ver Documento" button visible and prominent
- [x] Document viewer opens covering 80% of screen
- [x] PDF loads with progress bar
- [x] Text selection works
- [x] Annotations can be created
- [x] Invitations can be sent
- [x] Collaboration page loads for invited users
- [x] Network graph visualizes connections

### Feature is Delightful If:
- [x] Loading never feels like waiting (progress everywhere)
- [x] Collaboration is obvious and easy
- [x] Invitations feel personal (custom messages)
- [x] UI is beautiful and professional
- [x] Performance is instant (<2s for all operations)

---

**This feature transforms Flow from a single-user AI tool into a collaborative platform with viral growth potential.** 🎯

**Deploy → Test → Iterate → Grow!** 🚀

