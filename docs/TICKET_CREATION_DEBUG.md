# Ticket Creation Debugging Guide - 2025-11-06

**Issue:** User submits feedback successfully but no ticket appears in Roadmap/MyFeedback

**Symptoms:**
- Response: `{success: true, feedbackId: 'xxx'}` but NO `ticketId`
- MyFeedback shows: "Total Feedback: 2" but "Tus Tickets (0)"
- Roadmap Backlog: Ticket not visible

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

After submitting feedback, look for:

```javascript
✅ Feedback submitted successfully: {
  success: true,
  feedbackId: 'abc123',
  ticketId: 'TKT-...',  // ✅ Should be present
  message: 'Feedback recibido exitosamente'
}
```

**If `ticketId` is missing:**
```javascript
⚠️ Warning: Feedback guardado pero no se pudo crear ticket
   Feedback saved but ticket not created
   Check server logs for ticket creation error
⚠️ Ticket not created - feedback saved but won't appear in Roadmap
```

**Action:** Check server terminal for detailed error

---

### Step 2: Check Server Terminal

Look for these logs:

**Success path:**
```
💾 Saving feedback to Firestore: {...}
✅ Feedback created: abc123 (user)
✅ Ticket created: TKT-1730000000-xyz
📋 Ticket data: {
  ticketId: 'TKT-...',
  title: 'User comment',
  lane: 'backlog',
  priority: 'low',
  userRole: 'user',
  domain: 'gmail.com'
}
```

**Failure path:**
```
💾 Saving feedback to Firestore: {...}
✅ Feedback created: abc123 (user)
❌ Ticket creation failed (non-critical): [ERROR MESSAGE]
Failed with data: {
  feedbackType: 'user',
  userId: '103506...',
  conversationId: 'xyz',
  userEmail: 'alecdickinson@gmail.com',
  userName: 'alecdickinson',
  conversationTitle: 'Nuevo Chat'
}
Full error stack: [STACK TRACE]
⚠️ Returning response without ticketId
```

**The error message and stack trace will show exactly what failed!**

---

## 🐛 Common Errors

### Error 1: "Cannot read property of undefined"

**Likely cause:** One of the fetched values (userName, conversationTitle) is undefined

**Example:**
```
TypeError: Cannot read property 'title' of undefined
  at generateDetailedTitle
```

**Fix:** Ensure fallback values are used:
```typescript
userName = userName || userEmail.split('@')[0]
conversationTitle = conversationTitle || 'General'
```

---

### Error 2: "Value for argument 'data' is not valid"

**Likely cause:** Ticket data still contains undefined values

**Example:**
```
FirebaseError: Value for argument "data" is not a valid Firestore document.
Cannot contain undefined values.
```

**Fix:** Check ticketData for any undefined fields:
```typescript
// Bad
{
  field: maybeUndefined  // ❌ Could be undefined
}

// Good
{
  ...(maybeValue && { field: maybeValue })  // ✅ Only if defined
}
```

---

### Error 3: "User not found in users collection"

**Likely cause:** User doesn't exist in Firestore `users` collection

**Check:**
```javascript
// In browser console or Firestore UI
// Check if document exists: users/1035065385462500519234
```

**Fix:** The code already has fallback:
```typescript
let userName = userEmail.split('@')[0]; // Fallback
try {
  const userDoc = await firestore.collection('users').doc(userId).get();
  if (userDoc.exists) {
    userName = userDoc.data()?.name || userName;
  }
} catch (err) {
  console.warn('Could not fetch user name, using email fallback');
}
```

This should NOT cause ticket creation to fail.

---

### Error 4: "Conversation not found"

**Likely cause:** Conversation doesn't exist (deleted or temp)

**Check:**
```javascript
// Check if conversation exists in Firestore
// Collection: conversations/{conversationId}
```

**Fix:** Code has fallback:
```typescript
let conversationTitle = 'General';  // Fallback
```

This should NOT cause failure either.

---

## 🔧 Testing Action Plan

### For alecdickinson@gmail.com:

1. **Refresh browser** (to get new code with warning logs)
2. **Submit NEW feedback:**
   - Click ⭐ Calificar
   - Select 5 stars
   - Add comment: "Test ticket creation"
   - Click Enviar
3. **Check browser console** for warnings
4. **Check server terminal** for error details
5. **Share the error message** with me

---

## 📊 What Server Logs Should Show

**When alecdickinson@gmail.com submits feedback:**

```
💾 Saving feedback to Firestore: {
  messageId: '...',
  conversationId: '...',
  feedbackType: 'user',
  userId: '1035065...'
}
✅ Feedback created: xyz123 (user)

[Then EITHER:]

✅ Ticket created: TKT-1730000000-abc
📋 Ticket data: {
  ticketId: 'TKT-...',
  title: 'Test ticket creation',
  lane: 'backlog',
  priority: 'low',
  userRole: 'user',
  domain: 'gmail.com'
}

[OR:]

❌ Ticket creation failed (non-critical): [ERROR DETAILS HERE]
Failed with data: {...}
Full error stack: [STACK TRACE HERE]
⚠️ Returning response without ticketId
```

**The error details will tell us exactly what to fix!**

---

## ✅ Next Steps

1. **User refreshes browser**
2. **Submits test feedback**
3. **Checks both browser AND server console**
4. **Shares error message**
5. **I fix the specific error**

---

**Enhanced Logging:** ✅ Added  
**Error Visibility:** ✅ Maximum  
**Ready to Debug:** ✅ Yes

Please submit new feedback and share what the error says!

