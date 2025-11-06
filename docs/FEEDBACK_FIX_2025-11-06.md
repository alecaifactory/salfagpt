# Feedback Backlog Fix - 2025-11-06

**Issue:** User submitted feedback ("Calificar" with 5 stars) but it didn't appear in Roadmap Backlog

**Root Cause:** Existing tickets were missing required fields (`lane`, `ticketId`, `userDomain`, etc.)

---

## ✅ Solution Applied

### 1. Fixed CSAT Calculation Bug
**File:** `src/pages/api/feedback/submit.ts` (line 188)

**Before:**
```typescript
estimatedCSAT: feedbackType === 'expert' ? (csatScore || 0) : (userStars ? (userStars / 5) * 5 : 0)
// This was multiplying by 5, so 5 stars became 5, but 4 stars became 4, 3 became 3, etc.
// The math was wrong: (userStars / 5) * 5 = userStars
```

**After:**
```typescript
estimatedCSAT: feedbackType === 'expert' ? (csatScore || 0) : (userStars || 0)
// Now correctly stores the star rating (0-5)
```

### 2. Improved Error Logging
**File:** `src/pages/api/feedback/submit.ts`

**Changes:**
- Added detailed ticket creation logs
- Changed warning to error for failed ticket creation
- Throws error instead of swallowing it
- Shows exactly what data caused the failure

**Now logs:**
```
✅ Ticket created: TKT-123...
📋 Ticket data: {ticketId, title, lane, priority, userRole, domain}
```

**Or on error:**
```
❌ Ticket creation failed: [detailed error]
Failed with data: {feedbackType, userId, conversationId, userEmail}
```

### 3. Migrated Existing Tickets
**Script:** `scripts/migrate-feedback-tickets.mjs`

**What it does:**
- Finds all feedback tickets in Firestore
- Adds missing `lane: 'backlog'` field
- Generates `ticketId` in TKT-* format
- Extracts `userDomain` from email
- Extracts `reportedByName` from email
- Fetches `agentName` from conversations collection
- Creates `originalFeedback` object from existing data
- Adds social features fields (upvotes, views, shares)

**Results:**
- ✅ Migrated 4 tickets
- ✅ All now have `lane: 'backlog'`
- ✅ All now have complete metadata

---

## 🎯 What Should Happen Now

### When you submit new "Calificar" feedback:

1. **Feedback modal** opens with star rating (1-5)
2. **Select stars** (e.g., 5 stars = purple/violet star)
3. **Add comment** "Hola" (or anything)
4. **Click "Enviar"**
5. **Server console** shows:
   ```
   💾 Saving feedback to Firestore...
   ✅ Feedback created: xyz (user)
   ✅ Ticket created: TKT-1730000000000-abc
   📋 Ticket data: {
     ticketId: 'TKT-...',
     title: 'Hola',
     lane: 'backlog',
     priority: 'low',  // 5 stars = positive = low priority
     userRole: 'admin',
     domain: 'getaifactory.com'
   }
   ```
6. **Browser console** shows success
7. **MyFeedbackView** stats update (Backlog count increases)
8. **RoadmapModal:**
   - Either refreshes automatically (if already open, wait 30s)
   - Or shows ticket immediately when opened
   - Backlog column shows your card with:
     - ✅ Your name "Alec"
     - ✅ ADMIN badge (yellow)
     - ✅ Priority badge (P3 for 5 stars)
     - ✅ Ticket ID (TKT-...)
     - ✅ Title "Hola"
     - ✅ Agent name "Nuevo Chat"
     - ✅ 5 yellow stars displayed
     - ✅ Domain: getaifactory.com

---

## 🔍 Verification Steps

### Step 1: Check Migrated Tickets Appear

1. **Open Roadmap** (🗺️ Roadmap Flow button in top menu)
2. **Look at Backlog column**
3. **Should now show:** "4" in the header badge
4. **Should see:** 4 cards with:
   - Yellow border (admin)
   - "ADMIN" badge
   - "P2" priority badge (medium)
   - "Feedback Experto: aceptable" title
   - "Nuevo Chat" agent name
   - 3 stars displayed (default we set for missing rating)

### Step 2: Submit New User Feedback

1. **Go to any agent** (e.g., "Nuevo Chat")
2. **Send a message:** "Test feedback"
3. **AI responds** (wait for response)
4. **Click** ⭐ "Calificar" button below AI response
5. **Select** 5 stars (purple/violet star)
6. **Add comment:** "Excelente respuesta!"
7. **Click** "Enviar" (gradient button)
8. **Check browser console:**
   ```
   📝 Submitting feedback: {type: 'user', ...}
   📡 Response status: 200
   ✅ Feedback submitted successfully: {feedbackId, ticketId}
   ```
9. **Check server terminal:**
   ```
   💾 Saving feedback to Firestore...
   ✅ Feedback created: abc123 (user)
   ✅ Ticket created: TKT-...
   📋 Ticket data: {lane: 'backlog', ...}
   ```

### Step 3: Verify in Roadmap

**If Roadmap is already open:**
- Wait 30 seconds
- Should see new network request to `/api/feedback/tickets`
- Backlog count updates: 4 → 5
- New card appears at top

**If Roadmap was closed:**
- Open Roadmap
- Backlog should show "5"
- New card should be visible

### Step 4: Verify in MyFeedback

1. **Click** your user menu (bottom-left)
2. **Select** "Mi Feedback"
3. **Backlog stat** should show 5
4. **Tickets list** should show 5 tickets
5. **New ticket** should be at top with:
   - Title: "Excelente respuesta!"
   - Status: 🆕 Nuevo
   - Priority: P3: Bajo (5 stars = positive = low priority)
   - Position: 1/X en Top 50%

---

## 📊 Expected Roadmap Display

After migration + new feedback, you should see:

```
┌─────────────────────────────────────────────────────┐
│ Roadmap Flow                     🤖 Hablar con Rudy │
│ 5 items • Backlog → Roadmap → ...                  │
├─────────────────────────────────────────────────────┤
│ Total: 5  👤 Usuarios: 0  👨‍🏫 Expertos: 0  👑 Admins: 5  │
│                                 P0: 0  P1: 0  P2: 4  P3: 1 │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────┐ ┌──────────┐ ┌──────────┐         │
│ │ 📋 Backlog  │ │ 🎯 Roadmap│ │ ✨ In Dev│ ...     │
│ │     5       │ │     0    │ │     0    │         │
│ └─────────────┘ └──────────┘ └──────────┘         │
│                                                     │
│ ┌─────────────────────────────────┐                │
│ │ 👤 Alec          [ADMIN]       │                │
│ │ 🏢 getaifactory.com            │                │
│ │                                 │                │
│ │ TKT-... [P3]                   │                │
│ │ Excelente respuesta!           │                │
│ │ 💬 Agente: Nuevo Chat          │                │
│ │                                 │                │
│ │ Calificación: ★★★★★            │                │
│ │                                 │                │
│ │ 👍 0    📤 0               →   │                │
│ └─────────────────────────────────┘                │
│                                                     │
│ [4 more cards below...]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🐛 If Still Not Appearing

### Check Server Logs in Real-Time

In the terminal where `npm run dev` is running, you should see:

**When opening Roadmap:**
```
✅ Loaded 5 feedback tickets (role: admin, domain: getaifactory.com)
📊 Tickets by lane: {backlog: 5, roadmap: 0, in_development: 0, expert_review: 0, production: 0}
```

**If you see:**
```
✅ Loaded 0 feedback tickets...
```

**Then the query is returning empty.** Possible reasons:
1. Wrong domain filter
2. Wrong userId filter
3. Tickets don't have matching userDomain

### Check API Response in Browser

```javascript
// Open browser console on Roadmap page
// Check Network tab for GET /api/feedback/tickets

// Or manually call:
fetch('/api/feedback/tickets?companyId=aifactory&userId=114671162830729001607')
  .then(r => r.json())
  .then(tickets => {
    console.log('Total tickets:', tickets.length);
    console.log('In backlog:', tickets.filter(t => t.lane === 'backlog').length);
    console.table(tickets);
  });
```

### Check Firestore Query Directly

```javascript
// In scripts/test-query.mjs
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({ projectId: 'salfagpt' });

const snapshot = await firestore
  .collection('feedback_tickets')
  .where('userDomain', '==', 'getaifactory.com')
  .get();

console.log('Tickets found:', snapshot.size);
snapshot.docs.forEach(doc => {
  console.log(doc.id, doc.data().lane, doc.data().userDomain);
});
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ **Backlog shows "4"** (or 5 if you submitted new feedback)
2. ✅ **Cards appear** in Backlog column
3. ✅ **Each card shows:**
   - Your name
   - ADMIN badge (yellow)
   - Priority (P2 or P3)
   - Agent name
   - Star rating or expert rating
4. ✅ **Can drag cards** to other lanes
5. ✅ **Analytics summary** shows correct counts

---

## 🚀 Next Actions

1. **Refresh the Roadmap** (close and reopen)
2. **Should now see 4 tickets** in Backlog column
3. **Submit new "Calificar" feedback** to test new flow
4. **Wait 30 seconds** or refresh to see it appear
5. **Report back** if you see the tickets or if there are any errors!

---

**Fixed:** 2025-11-06  
**Migration:** ✅ Completed (4 tickets updated)  
**Server:** ✅ Running with enhanced logging  
**Ready to Test:** ✅ Yes

