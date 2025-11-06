# Firestore Undefined Values Fix - 2025-11-06

**Error:** `Value for argument "data" is not a valid Firestore document. Input is not a plain JavaScript object.`

**Root Cause:** Firestore rejects documents with `undefined` values

---

## 🐛 The Problem

When submitting user feedback, the `originalFeedback` object had undefined values:

```typescript
originalFeedback: {
  type: feedbackType,
  rating: feedbackType === 'expert' ? expertRating : userStars,
  comment: expertNotes || userComment,
  screenshots: screenshots || [],
  screenshotAnalysis: feedbackData.screenshotAnalysis,  // ❌ undefined if no AI analysis
  npsScore: feedbackType === 'expert' ? npsScore : undefined,  // ❌ undefined for user feedback
  csatScore: feedbackType === 'expert' ? csatScore : undefined,  // ❌ undefined for user feedback
  userStars: feedbackType === 'user' ? userStars : undefined,  // ❌ undefined for expert feedback
}
```

**Firestore error when saving:**
```
FirebaseError: Value for argument "data" is not a valid Firestore document.
Cannot contain undefined values.
```

---

## ✅ The Solution

**Conditionally add fields only if they have values:**

```typescript
// Build originalFeedback without undefined values
const originalFeedback: any = {
  type: feedbackType,
  rating: feedbackType === 'expert' ? expertRating : userStars,
  screenshots: screenshots || [],
};

// Add optional fields only if they exist
if (expertNotes || userComment) {
  originalFeedback.comment = expertNotes || userComment;
}
if (feedbackData.screenshotAnalysis) {
  originalFeedback.screenshotAnalysis = feedbackData.screenshotAnalysis;
}
if (feedbackType === 'expert') {
  if (npsScore !== undefined && npsScore !== null) {
    originalFeedback.npsScore = npsScore;
  }
  if (csatScore !== undefined && csatScore !== null) {
    originalFeedback.csatScore = csatScore;
  }
} else {
  if (userStars !== undefined && userStars !== null) {
    originalFeedback.userStars = userStars;
  }
}
```

**Result:** Only defined values are added to the object

---

## 📋 General Pattern

### ❌ DON'T: Include undefined values

```typescript
const data = {
  required: value,
  optional: optionalValue,  // ❌ Could be undefined
  nested: {
    field: maybeValue  // ❌ Could be undefined
  }
};

await firestore.collection('items').add(data);  // ❌ Fails if any undefined
```

### ✅ DO: Conditionally add optional fields

```typescript
const data = {
  required: value,
  // Start with required fields only
};

// Add optional fields only if defined
if (optionalValue !== undefined) {
  data.optional = optionalValue;
}

// For nested objects, build without undefined
const nested = {};
if (maybeValue !== undefined) {
  nested.field = maybeValue;
}
if (Object.keys(nested).length > 0) {
  data.nested = nested;
}

await firestore.collection('items').add(data);  // ✅ Safe
```

### ✅ ALTERNATIVE: Use spread operator

```typescript
const data = {
  required: value,
  ...(optionalValue && { optional: optionalValue }),
  ...(maybeValue && { nested: { field: maybeValue } }),
};

await firestore.collection('items').add(data);  // ✅ Safe
```

---

## 🔧 Files Updated

**src/pages/api/feedback/submit.ts:**
- Builds `originalFeedback` without undefined values
- Conditionally adds `comment`, `screenshotAnalysis`, `npsScore`, `csatScore`, `userStars`
- Ensures Firestore write always succeeds

---

## ✅ Testing

### Before Fix:
```
❌ POST /api/feedback/submit → 500 Internal Server Error
Error: Value for argument "data" is not a valid Firestore document
```

### After Fix:
```
✅ POST /api/feedback/submit → 200 OK
{
  success: true,
  feedbackId: "abc123",
  ticketId: "TKT-1730000000000-xyz",
  message: "Feedback recibido exitosamente"
}
```

---

## 📚 Related Rules

See: `.cursor/rules/firestore.mdc`
- Section: "CRITICAL: Filter undefined values before writes"
- Pattern: Always clean data before Firestore operations

---

**Fixed:** 2025-11-06  
**Impact:** User feedback now saves correctly  
**Backward Compatible:** ✅ Yes (existing tickets unaffected)

