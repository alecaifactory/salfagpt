# Feedback Backlog Diagnostic Guide

**Purpose:** Debug why feedback doesn't appear in Roadmap Backlog

---

## 🔍 Step-by-Step Diagnostic

### Step 1: Check Browser Console (Frontend)

When you submit feedback, check the browser console for:

```
📝 Submitting feedback: {type: 'user', messageId: '...', userId: '...'}
📡 Response status: 200
✅ Feedback submitted successfully: {success: true, feedbackId: '...', ticketId: '...'}
```

**Expected:** You should see ALL three logs  
**If missing:** Check network tab for the POST to `/api/feedback/submit`

---

### Step 2: Check Server Console (Backend)

Look for these logs in your terminal where `npm run dev` is running:

#### Feedback Creation:
```
💾 Saving feedback to Firestore: {messageId: '...', conversationId: '...', feedbackType: 'user', userId: '...'}
✅ Feedback created: XYZ123 (user)
```

#### Ticket Creation:
```
✅ Ticket created: TKT-1699999999999-abc123
📋 Ticket data: {
  ticketId: 'TKT-...',
  title: 'Hola',
  lane: 'backlog',
  priority: 'low',
  userRole: 'admin',
  domain: 'getaifactory.com'
}
```

**If you see:**
- ❌ `Ticket creation failed`: There's an error creating the ticket
- ⚠️ No ticket logs at all: Check if the code is even running

---

### Step 3: Check Firestore Console

Open: https://console.firebase.google.com/project/salfagpt/firestore

**Check Collection: `message_feedback`**
- Should have a new document with your feedback
- Should have `ticketId` field populated
- Should have `ticketCreatedAt` timestamp

**Check Collection: `feedback_tickets`**
- Should have a new document with ticketId starting with "TKT-"
- Should have `lane: 'backlog'`
- Should have `reportedBy` matching your userId
- Should have `userDomain` matching your email domain

**If missing from feedback_tickets:**
- The ticket creation is failing silently
- Check server console for error details

---

### Step 4: Check Roadmap Loading

When you open the Roadmap modal, check the browser console:

```
// Should see this when modal opens:
📡 Loading tickets for domain: getaifactory.com
✅ Loaded X feedback tickets (role: admin, domain: getaifactory.com)
📊 Tickets by lane: {backlog: X, roadmap: 0, ...}
```

**If backlog: 0:**
- Tickets exist but aren't being loaded
- Check the query filter in `/api/feedback/tickets`

---

### Step 5: Check Network Tab

In browser DevTools → Network tab:

**When submitting feedback:**
1. Look for `POST /api/feedback/submit`
2. Check Response:
   ```json
   {
     "success": true,
     "feedbackId": "abc123",
     "ticketId": "TKT-1699999999999-xyz",
     "message": "Feedback recibido exitosamente"
   }
   ```
3. If `ticketId` is missing → Ticket creation failed

**When opening Roadmap:**
1. Look for `GET /api/feedback/tickets?companyId=aifactory&userId=...`
2. Check Response: Should be array of tickets
3. Check if array includes your ticket with `lane: 'backlog'`

---

## 🐛 Common Issues & Fixes

### Issue 1: Ticket created but not appearing in Backlog

**Symptom:** 
- Server logs show "✅ Ticket created"
- Firestore has the ticket
- But Roadmap Backlog shows "Sin items"

**Cause:** Query filter is excluding your ticket

**Fix:**
Check if the ticket's `userDomain` matches the domain being queried.

**Test:**
```javascript
// In browser console on Roadmap page:
fetch('/api/feedback/tickets?companyId=aifactory&userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(console.log)
// Should show your ticket in the array
```

---

### Issue 2: Ticket creation fails silently

**Symptom:**
- Feedback is saved (message_feedback collection)
- But no ticket created (feedback_tickets collection)
- Server shows "❌ Ticket creation failed"

**Possible Causes:**
1. **Missing userName** - Users collection doesn't have your user
2. **Missing conversationTitle** - Conversation doesn't exist
3. **Invalid data** - Some field has wrong type
4. **Firestore permission** - Security rules blocking write

**Fix:**
1. Check error details in server console
2. Verify your user exists in `users` collection
3. Verify conversation exists in `conversations` collection
4. Check Firestore rules allow writing to `feedback_tickets`

---

### Issue 3: Real-time update not working

**Symptom:**
- Ticket appears in Firestore
- But doesn't appear in Roadmap without manual refresh

**Cause:** Polling might not be working

**Test:**
- Submit feedback
- Wait 30 seconds
- Should see new network request to `/api/feedback/tickets`
- Should see ticket appear automatically

**Fix:**
If not working, check:
1. Is modal still open after 30 seconds?
2. Is interval being cleared accidentally?
3. Check browser console for errors

---

### Issue 4: Wrong CSAT score display

**Symptom:**
- User gives 5 stars
- Card shows different number

**Cause:** CSAT calculation was multiplying incorrectly

**Fix:** ✅ Fixed in this update
- Line 188 now correctly uses `userStars` directly
- Expert CSAT uses `csatScore` (1-5)
- User CSAT uses `userStars` (0-5)

---

## 🔧 Quick Fixes

### Force Reload Data

```javascript
// In browser console:
// 1. Clear local state
sessionStorage.clear()
localStorage.clear()

// 2. Reload page
location.reload()
```

### Manual Ticket Creation (Testing)

```javascript
// In Firestore console, create a test ticket manually:
{
  ticketId: "TKT-TEST-123",
  title: "Test Ticket",
  description: "Manual test",
  lane: "backlog",
  priority: "medium",
  status: "new",
  reportedBy: "YOUR_USER_ID",
  reportedByEmail: "YOUR_EMAIL",
  reportedByRole: "admin",
  reportedByName: "Your Name",
  userDomain: "getaifactory.com",
  companyDomain: "getaifactory.com",
  createdBy: "Your Name",
  createdByRole: "admin",
  agentId: "some-conv-id",
  agentName: "Test Agent",
  estimatedNPS: 0,
  estimatedCSAT: 5,
  estimatedROI: 0,
  okrAlignment: [],
  customKPIs: [],
  upvotes: 0,
  upvotedBy: [],
  views: 0,
  viewedBy: [],
  shares: 0,
  sharedBy: [],
  originalFeedback: {
    type: "user",
    rating: 5,
    comment: "Test",
    screenshots: []
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  source: "localhost"
}
```

Then refresh Roadmap - should appear immediately.

---

## 📋 Verification Checklist

Run through this checklist to diagnose the issue:

### Frontend
- [ ] Feedback modal opens when clicking ⭐ "Calificar"
- [ ] Can select stars (1-5)
- [ ] Can add comment (optional)
- [ ] "Enviar" button works
- [ ] Modal closes after submit
- [ ] Success toast appears (purple notification)

### API
- [ ] POST to `/api/feedback/submit` returns 200
- [ ] Response includes `feedbackId`
- [ ] Response includes `ticketId`
- [ ] No error in response

### Database
- [ ] Document created in `message_feedback` collection
- [ ] Document has `ticketId` field
- [ ] Document created in `feedback_tickets` collection
- [ ] Ticket has `lane: 'backlog'`
- [ ] Ticket has your `reportedBy` userId
- [ ] Ticket has `userDomain` from your email

### Roadmap
- [ ] Roadmap modal opens (🗺️ button in top menu)
- [ ] GET request to `/api/feedback/tickets` succeeds
- [ ] Response includes your ticket
- [ ] Backlog column shows count > 0
- [ ] Your ticket card appears in Backlog
- [ ] Card shows your name, role, rating

---

## 🚨 Most Likely Issue

Based on the screenshot showing "0 items • Backlog → ..." and empty lanes:

**The ticket is being created but the query is not finding it.**

### Check This First:

1. **Open Firestore Console** and navigate to `feedback_tickets` collection
2. **Find your latest ticket** (should be at the top, sorted by creation date)
3. **Check these fields:**
   - `lane` should be `'backlog'` (exactly, lowercase)
   - `userDomain` should match your email domain
   - `reportedBy` should match your userId

4. **If any field is wrong:**
   - The query filter is excluding it
   - Check the ticket creation logic in `submit.ts`

5. **If all fields look correct:**
   - The query itself might have an issue
   - Check `/api/feedback/tickets` endpoint
   - Verify the where clause matches the ticket data

---

## 💡 Testing Commands

### Check if tickets exist in Firestore:

```bash
# Using Firebase CLI (if installed)
firebase firestore:get feedback_tickets --project salfagpt --limit 5

# Or use the Firestore console UI
```

### Check API directly:

```bash
# Get all tickets (as SuperAdmin)
curl "http://localhost:3000/api/feedback/tickets?companyId=aifactory&userId=YOUR_USER_ID" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN"
  
# Should return array of tickets
```

### Check specific ticket:

```bash
# If you know the ticket ID
curl "http://localhost:3000/api/feedback/tickets/TICKET_ID" \
  -H "Cookie: flow_session=YOUR_SESSION_TOKEN"
```

---

## ✅ Expected Behavior

When everything works correctly:

1. **Submit feedback** (5 stars, optional comment)
2. **Browser console** shows success with ticketId
3. **Server console** shows ticket created with lane: 'backlog'
4. **Firestore** has both message_feedback and feedback_tickets documents
5. **Roadmap** shows ticket in Backlog column (within 30 seconds if modal was already open)
6. **MyFeedback** shows ticket in "Backlog" stat (4 items → 5 items)

---

## 📞 Next Steps

1. **Submit test feedback** with comment "Hola" (or any text)
2. **Check browser console** for any errors
3. **Check server terminal** for ticket creation logs
4. **Open Firestore console** and verify ticket exists
5. **Share any error messages** you see

The enhanced logging will now show exactly what's happening at each step!

---

**Updated:** 2025-11-06  
**Enhanced Logging:** ✅ Added  
**Error Visibility:** ✅ Improved  
**CSAT Calculation:** ✅ Fixed

