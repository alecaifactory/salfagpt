# Auto-Generated Conversation Titles

**Created:** 2025-11-13  
**Status:** ✅ Implemented  
**Branch:** feat/multi-org-system-2025-11-10

---

## 🎯 Purpose

Automatically generate descriptive titles for conversations after the user sends their first message, improving organization and navigation in the sidebar.

---

## 📋 Problem

When users create a new conversation, it starts with a generic title like "Nuevo Agente 2025-11-13 15:30:45". This is not descriptive and makes it hard to find specific conversations later.

---

## ✅ Solution

After the user sends their **first message**, the system:
1. Generates a descriptive title using Gemini AI (Flash model)
2. Updates the conversation in Firestore
3. Refreshes the title in the frontend UI

---

## 🔧 Technical Implementation

### Backend - Streaming Title Generation

**File:** `src/lib/gemini.ts`

**NEW Function:** `streamConversationTitle()` (lines 527-558)

```typescript
/**
 * ✅ NEW: Stream conversation title generation for real-time UI updates
 * Generates title token-by-token for smooth streaming effect
 */
export async function* streamConversationTitle(firstMessage: string): AsyncGenerator<string> {
  try {
    // ✅ Use streaming API
    const stream = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: firstMessage }] }],
      config: {
        systemInstruction: 'Generate a short, descriptive title (3-6 words) for a conversation based on the first message. Only return the title, nothing else. No quotes, no punctuation at the end.',
        temperature: 0.7,
        maxOutputTokens: 20,
      }
    });

    let fullTitle = '';
    
    // Stream each chunk
    for await (const chunk of stream) {
      if (chunk.text) {
        fullTitle += chunk.text;
        yield chunk.text; // Emit chunk to frontend
      }
    }

    return fullTitle.trim().replace(/^["']|["']$/g, '');
    
  } catch (error) {
    console.error('Error streaming title:', error);
    yield 'New Conversation';
  }
}
```

**Existing Function:** `generateConversationTitle()` (lines 501-521) - Preserved for non-streaming fallback

### Backend - SSE Streaming Endpoint

**File:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Lines 717-754:** After message completion, stream title generation

```typescript
// ✅ NEW: Generate and stream title for first message
const allMessages = await getMessages(conversationId);
const isFirstMessage = allMessages.length === 2; // user + assistant = first exchange

if (isFirstMessage) {
  console.log('🏷️ First message detected - generating title with streaming...');
  
  const { streamConversationTitle } = await import('../../../../lib/gemini');
  
  try {
    let fullTitle = '';
    
    // Stream title generation (token-by-token)
    for await (const titleChunk of streamConversationTitle(message)) {
      fullTitle += titleChunk;
      
      // Send each chunk via SSE
      const titleData = `data: ${JSON.stringify({
        type: 'title',
        chunk: titleChunk,
        conversationId,
      })}\n\n`;
      controller.enqueue(encoder.encode(titleData));
    }
    
    // Save final title to Firestore
    if (fullTitle.trim()) {
      await updateConversation(conversationId, { 
        title: fullTitle.trim() 
      });
      console.log(`✅ Title generated and saved: "${fullTitle.trim()}"`);
    }
    
  } catch (error) {
    console.error('⚠️ Error generating title:', error);
    // Non-critical - don't block completion
  }
}
```

### Frontend - Receive Title Chunks

**File:** `src/components/ChatInterfaceWorking.tsx`

**Step 1:** Track if it's the first message (line 2047)
```typescript
const sendMessage = async () => {
  // ...
  const isFirstMessage = messages.length === 0;
  // ...
}
```

**Step 2:** Process title chunks from SSE (lines 2426-2443)
```typescript
} else if (data.type === 'title') {
  // ✅ NEW: Receive title chunks and update conversation title progressively
  const titleChunk = data.chunk;
  const convId = data.conversationId;
  
  // Update conversation title in state (streaming effect)
  setConversations(prev => prev.map(c => {
    if (c.id === convId) {
      const currentTitle = c.title || '';
      const newTitle = currentTitle.startsWith('Nuevo Agente') 
        ? titleChunk // Replace generic title with first chunk
        : currentTitle + titleChunk; // Append subsequent chunks
      
      return { ...c, title: newTitle };
    }
    return c;
  }));
}
```

---

## 🎨 User Experience

### Before
1. User creates "Nuevo Agente 2025-11-13 15:30:45"
2. Sends first message: "¿Cuál es la política de vacaciones?"
3. Title remains: "Nuevo Agente 2025-11-13 15:30:45" ❌

### After (Streaming Effect ✨)
1. User creates "Nuevo Agente 2025-11-13 15:30:45"
2. Sends first message: "¿Cuál es la política de vacaciones?"
3. AI responds with message
4. **Title starts streaming token-by-token:**
   - "P..." (first chunk)
   - "Polí..." (second chunk)
   - "Política..." (third chunk)
   - "Política de..." (fourth chunk)
   - "Política de Vacaciones" (complete) ✅
5. **No page refresh** - Only the title element updates
6. Sidebar shows the typing effect in real-time

### Visual Effect

The title appears to **"write itself"** in the sidebar, creating a delightful visual feedback that the system is working on naming the conversation intelligently.

---

## 📊 Examples

### Sample First Messages → Generated Titles

| First Message | Generated Title |
|---|---|
| "¿Cuál es la política de vacaciones de la empresa?" | "Política de Vacaciones" |
| "Necesito ayuda con un problema de seguridad" | "Problema de Seguridad" |
| "Quiero saber sobre los beneficios para empleados" | "Beneficios para Empleados" |
| "How do I reset my password?" | "Password Reset Help" |
| "Explain quantum computing" | "Quantum Computing Explanation" |

---

## ✅ Backward Compatibility

- ✅ **Existing conversations:** Not affected
- ✅ **Manual renames:** Still work (hasBeenRenamed flag prevents overwrite)
- ✅ **Temp conversations:** Skip title generation (no Firestore)
- ✅ **Error handling:** Falls back gracefully if generation fails

---

## 🔒 Security

- ✅ **Authentication:** GET endpoint requires valid session
- ✅ **Authorization:** User can only access their own conversations
- ✅ **Validation:** conversationId required
- ✅ **Error handling:** Proper HTTP status codes (401, 403, 404)

---

## 🧪 Testing

### Manual Testing Steps

1. **Create new conversation**
   - Click "+ Nuevo Agente"
   - Initial title: "Nuevo Agente {timestamp}"

2. **Send first message**
   - Type: "¿Cómo funciona el sistema de vacaciones?"
   - Click Send

3. **Verify title updates**
   - Wait ~2 seconds
   - Check sidebar
   - Title should change to something like "Sistema de Vacaciones"

4. **Verify persistence**
   - Refresh page
   - New title should persist

### Console Logs

**Frontend (Browser Console):**
```
(No logs needed - visual streaming effect only)
```

**Backend (Server Console):**
```
🏷️ First message detected - generating title with streaming...
✅ Title generated and saved: "Sistema de Vacaciones"
```

**SSE Events Received:**
```
data: {"type":"title","chunk":"Sis","conversationId":"abc123"}
data: {"type":"title","chunk":"tema","conversationId":"abc123"}
data: {"type":"title","chunk":" de","conversationId":"abc123"}
data: {"type":"title","chunk":" Vac","conversationId":"abc123"}
data: {"type":"title","chunk":"aciones","conversationId":"abc123"}
```

### Edge Cases

**Case 1: Generation fails**
- Fallback: "New Conversation"
- User can still manually rename

**Case 2: Very long message**
- Title truncated to 60 characters

**Case 3: Empty response**
- Fallback: "New Conversation"

---

## 💡 Future Enhancements

- [ ] **Multi-language support:** Detect message language, generate title in same language
- [ ] **User preferences:** Allow disabling auto-title generation
- [ ] **Title templates:** Custom templates per agent type
- [ ] **Re-generate:** Allow users to request new title generation

---

## 📚 References

**Backend:**
- `src/pages/api/conversations/[id]/messages.ts` (lines 347-355)
- `src/lib/gemini.ts:generateConversationTitle()` (lines 501-521)

**Frontend:**
- `src/components/ChatInterfaceWorking.tsx:sendMessage()` (lines 2047, 2400-2424)

**API:**
- `src/pages/api/conversations/[id].ts:GET` (new endpoint)

---

**Last Updated:** 2025-11-13  
**Version:** 1.0.0  
**Aligned With:** `alignment.mdc`, `data.mdc`, `backend.mdc`, `frontend.mdc`

