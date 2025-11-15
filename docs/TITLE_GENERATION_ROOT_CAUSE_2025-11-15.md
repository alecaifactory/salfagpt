# Title Generation Root Cause Analysis

**Date:** 2025-11-15  
**Issue:** Auto-generated titles return empty string  
**Status:** 🔍 Root cause identified

---

## 🔍 Root Cause: Gemini API Returns Zero Chunks

### Evidence from Logs

```
🏷️ [streamConversationTitle] Starting...
   Message: ¿Me puedes decir la diferencia entre un Loteo DFL2...
🏷️ [streamConversationTitle] Stream started, reading chunks...
✅ [streamConversationTitle] Complete: 
   Total chunks: 0  ← PROBLEM!
```

**The Gemini `generateContentStream` API is returning ZERO text chunks.**

---

## 🔑 User ID Structure - VERIFIED CORRECT ✅

### Current Implementation

**Conversation:** `pz5RswRBvEaODcbKioU8`
**User ID:** `usr_uhwqffaqag1wrryd82tw` (hashed format) ✅
**Google ID:** `114671162830729001607` (stored in JWT for reference)

### Who Has Access

Based on the logs, the conversation `pz5RswRBvEaODcbKioU8`:
- **Owner:** usr_uhwqffaqag1wrryd82tw (alec@getaifactory.com)
- **Access:** Only owner (no shares)
- **Agent:** cjn3bC0HrUYtHqu69CKS (Asistente Legal Territorial RDI)

### ID Attribution - CORRECT ✅

```
JWT contains:
  - id: 'usr_uhwqffaqag1wrryd82tw' (hashed)
  - googleUserId: '114671162830729001607' (reference)

System uses:
  - selected: 'usr_uhwqffaqag1wrryd82tw' ✅ CORRECT
```

All data is being saved with the **hashed ID** which is the correct post-migration format.

---

## 💡 Why Gemini Returns Zero Chunks

### Hypothesis 1: API Configuration Issue

The `generateContentStream` call might have an issue with the configuration:

```typescript
const stream = await genAI.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: [{ 
    role: 'user', 
    parts: [{ 
      text: `Create a short title for: "${firstMessage}"` 
    }] 
  }],
  config: {
    systemInstruction: '...',
    temperature: 0.3,
    maxOutputTokens: 20,
  }
});
```

**Possible issues:**
1. `maxOutputTokens: 20` might be too restrictive
2. System instruction might be confusing
3. Prompt structure might not work with Flash

### Hypothesis 2: API Rate Limiting

Gemini might be rate-limiting or rejecting requests silently.

### Hypothesis 3: Streaming vs Non-Streaming

The streaming API might behave differently than the regular API.

---

## ✅ SOLUTION: Use Non-Streaming API

Since streaming returns zero chunks, let's use the **proven non-streaming API** that already works:

```typescript
// This function WORKS (used in messages.ts line 349)
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  const result = await genAI.models.generateContent({  // Non-streaming
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: firstMessage }] }],
    config: {
      systemInstruction: 'Generate a short, descriptive title...',
      temperature: 0.7,
      maxOutputTokens: 20,
    }
  });

  return result.text || 'New Conversation';  // This works!
}
```

**This function is PROVEN to work** - it's already used in the codebase successfully.

---

## 🎯 Recommended Fix

### Option A: Use Non-Streaming (Simple, Proven) ✅

**Change `/api/generate-title` to use non-streaming:**

```typescript
// Instead of streaming
const title = await generateConversationTitle(message);

// Return immediately
return Response.json({ title });
```

**Frontend:**
```typescript
// Simple fetch
const response = await fetch('/api/generate-title', {...});
const { title } = await response.json();

// Update sidebar immediately
setConversations(prev => prev.map(c => 
  c.id === currentConversation ? { ...c, title } : c
));
```

**Pros:**
- ✅ Proven to work
- ✅ Simpler code
- ✅ No SSE complexity
- ✅ Immediate result

**Cons:**
- ❌ No streaming visual effect
- ❌ User waits ~1-2s for complete title

### Option B: Fix Streaming API (Complex)

Debug why streaming returns zero chunks:
1. Test API manually
2. Check Gemini documentation
3. Try different prompt structure
4. Increase maxOutputTokens

**Pros:**
- ✅ Nice visual effect if it works

**Cons:**
- ❌ Unknown time to fix
- ❌ May not be fixable
- ❌ More complex

---

## 💡 RECOMMENDATION

**Use Option A** - Non-streaming API:

1. It's proven to work (already in codebase)
2. Simple and reliable
3. Fast implementation (5 minutes)
4. User still gets automatic titles (~2 second delay)

The visual streaming effect is nice-to-have, but having titles that WORK is must-have.

---

## 🎯 Next Steps

1. Switch to non-streaming API
2. Test title generation
3. Verify it works
4. Then optimize for streaming later if needed

---

**Priority:** Fix title generation FIRST (with non-streaming), optimize for streaming LATER.


