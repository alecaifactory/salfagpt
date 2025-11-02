# Conversation Pagination System

**Branch:** feat/conversation-pagination-2025-10-31  
**Created:** 2025-10-31  
**Status:** 🔨 Design Phase  
**Purpose:** Implement smart pagination that optimizes context window usage by creating linked conversation pages

---

## 🎯 Objective

Enable conversations to span multiple "pages" (sub-conversations) that automatically chain when context window reaches 30% capacity. This allows for:
- **Optimized context windows** per prompt
- **Reduced latency** through smaller context
- **Continuous conversations** without manual management
- **Full conversation history** preserved across pages

---

## 🏗️ Architecture

### Conceptual Model

```
Conversation Thread (Parent)
├─ Page 1 (conversationId: "parent-123-page-1")
│  ├─ Messages 1-50
│  ├─ Context Window: 28%
│  └─ Summary: "User discussed X, Y, Z..."
│
├─ Page 2 (conversationId: "parent-123-page-2")
│  ├─ Previous Page Summary (from Page 1)
│  ├─ Messages 51-100
│  ├─ Context Window: 25%
│  └─ Summary: "Continued discussing Z, introduced A..."
│
└─ Page 3 (conversationId: "parent-123-page-3")
   ├─ Previous Page Summary (from Page 2)
   ├─ Messages 101-current
   └─ Context Window: 15% (active)
```

### Data Model

#### New Collections

**`conversation_threads`** (New collection)
```typescript
interface ConversationThread {
  id: string;                       // Thread ID (parent)
  userId: string;                   // Owner
  title: string;                    // Thread title
  currentPageId: string;            // Active page ID
  pageIds: string[];                // Ordered list of page IDs
  createdAt: Date;
  updatedAt: Date;
  totalMessages: number;            // Across all pages
  source: 'localhost' | 'production';
}
```

**Update `conversations` collection:**
```typescript
interface Conversation {
  // Existing fields...
  id: string;
  userId: string;
  title: string;
  
  // NEW: Pagination fields
  threadId?: string;                // Parent thread (if part of thread)
  pageNumber?: number;              // Page number in thread (1-indexed)
  previousPageId?: string;          // Link to previous page
  nextPageId?: string;              // Link to next page
  pageSummary?: string;             // AI-generated summary of this page
  isActivePage?: boolean;           // Current page in thread
  
  // Existing fields...
  contextWindowUsage: number;
  messageCount: number;
  // ... rest
}
```

---

## 🔄 User Flow

### 1. Normal Conversation (Single Page)

```
User creates conversation
  ↓
Send messages (context < 30%)
  ↓
Continue normally
```

### 2. Reaching Pagination Threshold

```
User sending message
  ↓
Backend calculates: contextWindowUsage = 32%
  ↓
System detects: > 30% threshold
  ↓
Backend response includes:
  {
    message: "...",
    paginationSuggested: true,
    currentUsage: 32%
  }
  ↓
Frontend shows button:
  "📄 Nueva Página (Contexto: 32%)"
```

### 3. Creating New Page

```
User clicks "Nueva Página"
  ↓
Frontend calls: POST /api/conversations/paginate
  {
    conversationId: "current-page-id",
    summary: "AI-generated summary" (optional)
  }
  ↓
Backend:
  1. Generate page summary (AI)
  2. Create new conversation page
  3. Link pages (previousPageId, nextPageId)
  4. Create/update thread
  5. Set new page as active
  ↓
Frontend:
  1. Update UI to show new page
  2. Display "Continuación de Página X"
  3. Show navigation to previous pages
  4. Clear input, ready for new messages
```

---

## 💾 Database Operations

### Create New Page

```typescript
// src/lib/firestore.ts
export async function createConversationPage(
  currentPageId: string,
  userId: string
): Promise<{
  newPage: Conversation;
  thread: ConversationThread;
  summary: string;
}> {
  // 1. Get current page
  const currentPage = await getConversation(currentPageId);
  if (!currentPage) throw new Error('Current page not found');
  
  // 2. Generate summary of current page
  const messages = await getMessages(currentPageId);
  const summary = await generatePageSummary(messages);
  
  // 3. Update current page with summary and mark as inactive
  await updateConversation(currentPageId, {
    pageSummary: summary,
    isActivePage: false,
    updatedAt: new Date(),
  });
  
  // 4. Create new page
  const newPageNumber = (currentPage.pageNumber || 1) + 1;
  const newPage = await createConversation(userId, currentPage.title);
  
  // 5. Link pages
  await updateConversation(currentPageId, {
    nextPageId: newPage.id,
  });
  
  await updateConversation(newPage.id, {
    threadId: currentPage.threadId || currentPageId,
    pageNumber: newPageNumber,
    previousPageId: currentPageId,
    isActivePage: true,
  });
  
  // 6. Create/update thread
  let thread: ConversationThread;
  if (currentPage.threadId) {
    // Existing thread
    thread = await updateThread(currentPage.threadId, {
      currentPageId: newPage.id,
      pageIds: [...currentThread.pageIds, newPage.id],
      totalMessages: currentThread.totalMessages + currentPage.messageCount,
    });
  } else {
    // First pagination - create thread
    thread = await createThread({
      userId,
      title: currentPage.title,
      currentPageId: newPage.id,
      pageIds: [currentPageId, newPage.id],
      totalMessages: currentPage.messageCount,
    });
    
    // Update first page with threadId
    await updateConversation(currentPageId, {
      threadId: thread.id,
      pageNumber: 1,
    });
  }
  
  return { newPage, thread, summary };
}
```

### Generate Page Summary

```typescript
// src/lib/gemini.ts
export async function generatePageSummary(
  messages: Message[]
): Promise<string> {
  const conversationText = messages
    .map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : m.content.text}`)
    .join('\n\n');
  
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash', // Fast model for summaries
    contents: conversationText,
    config: {
      systemInstruction: `Genera un resumen conciso de esta conversación en español.
      
      El resumen debe:
      - Capturar los temas principales discutidos
      - Mencionar decisiones o conclusiones clave
      - Ser máximo 200 palabras
      - Estar en formato narrativo
      - Permitir continuar la conversación en una nueva página
      
      Ejemplo:
      "El usuario preguntó sobre políticas de devolución y garantía. Se explicó que las devoluciones son aceptadas dentro de 30 días con recibo. Se discutió el proceso de garantía para productos defectuosos. El usuario solicitó información sobre envíos internacionales."`,
      maxOutputTokens: 400,
      temperature: 0.3, // Consistent summaries
    }
  });
  
  return result.text || 'Conversación sin resumen disponible';
}
```

---

## 🎨 Frontend Implementation

### UI Components

#### Page Navigation Header

```typescript
// In ChatInterfaceWorking.tsx - above messages area
{currentConversation && currentConversation.threadId && (
  <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileStack className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Página {currentConversation.pageNumber || 1}
          </span>
        </div>
        
        {currentConversation.previousPageId && (
          <button
            onClick={() => navigateToPage(currentConversation.previousPageId!)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Página Anterior
          </button>
        )}
        
        {currentConversation.nextPageId && (
          <button
            onClick={() => navigateToPage(currentConversation.nextPageId!)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Página Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <button
        onClick={() => setShowPageHistory(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        Ver todas las páginas ({thread?.pageIds.length || 1})
      </button>
    </div>
    
    {currentConversation.previousPageId && (
      <div className="mt-2 p-2 bg-white rounded border border-blue-200">
        <p className="text-xs text-slate-600 font-medium mb-1">
          Resumen de página anterior:
        </p>
        <p className="text-xs text-slate-700 italic">
          {previousPageSummary}
        </p>
      </div>
    )}
  </div>
)}
```

#### Pagination Trigger Button

```typescript
// Show when context > 30%
{contextWindowUsage > 30 && currentConversation?.isActivePage !== false && (
  <div className="px-6 py-3 bg-yellow-50 border-t border-b border-yellow-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <div>
          <p className="text-sm font-semibold text-yellow-900">
            Contexto alcanzando capacidad
          </p>
          <p className="text-xs text-yellow-700">
            El contexto está al {contextWindowUsage.toFixed(1)}%. 
            Crear una nueva página optimizará el rendimiento.
          </p>
        </div>
      </div>
      
      <button
        onClick={handleCreateNewPage}
        disabled={isCreatingPage}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-300 text-sm font-medium"
      >
        {isCreatingPage ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creando...
          </>
        ) : (
          <>
            <FilePlus className="w-4 h-4" />
            Nueva Página
          </>
        )}
      </button>
    </div>
  </div>
)}
```

#### Page History Modal

```typescript
// Modal to view all pages in thread
{showPageHistory && thread && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-bold text-slate-800">
          Historial de Páginas - {thread.title}
        </h2>
        <button onClick={() => setShowPageHistory(false)}>
          <X className="w-6 h-6 text-slate-400 hover:text-slate-600" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {thread.pageIds.map((pageId, index) => (
          <PageCard
            key={pageId}
            pageId={pageId}
            pageNumber={index + 1}
            isActive={pageId === thread.currentPageId}
            onNavigate={() => {
              navigateToPage(pageId);
              setShowPageHistory(false);
            }}
          />
        ))}
      </div>
    </div>
  </div>
)}
```

#### Page Card Component

```typescript
interface PageCardProps {
  pageId: string;
  pageNumber: number;
  isActive: boolean;
  onNavigate: () => void;
}

function PageCard({ pageId, pageNumber, isActive, onNavigate }: PageCardProps) {
  const [pageData, setPageData] = useState<Conversation | null>(null);
  
  useEffect(() => {
    loadPageData();
  }, [pageId]);
  
  async function loadPageData() {
    const response = await fetch(`/api/conversations/${pageId}`);
    if (response.ok) {
      setPageData(await response.json());
    }
  }
  
  return (
    <button
      onClick={onNavigate}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-blue-300 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {pageNumber}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Página {pageNumber}
              {isActive && <span className="ml-2 text-xs text-blue-600">(Actual)</span>}
            </h3>
            <p className="text-xs text-slate-500">
              {pageData?.messageCount || 0} mensajes • 
              Contexto: {pageData?.contextWindowUsage.toFixed(1) || 0}%
            </p>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
      
      {pageData?.pageSummary && (
        <p className="text-sm text-slate-600 line-clamp-2 italic mt-2">
          {pageData.pageSummary}
        </p>
      )}
      
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <Calendar className="w-3 h-3" />
        {formatDate(pageData?.createdAt)}
      </div>
    </button>
  );
}
```

---

## 🔌 API Endpoints

### POST /api/conversations/paginate

**Purpose:** Create a new page in conversation thread

```typescript
// src/pages/api/conversations/paginate.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createConversationPage } from '../../../lib/firestore';

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Authenticate
  const session = getSession({ cookies } as any);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  try {
    // 2. Parse request
    const { conversationId, customSummary } = await request.json();
    
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId required' }),
        { status: 400 }
      );
    }

    // 3. Verify ownership
    const currentPage = await getConversation(conversationId);
    if (!currentPage || currentPage.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // 4. Create new page
    const result = await createConversationPage(conversationId, session.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating page:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create page',
        details: error instanceof Error ? error.message : 'Unknown'
      }),
      { status: 500 }
    );
  }
};
```

### GET /api/conversations/threads/:threadId

**Purpose:** Get all pages in a thread

```typescript
export const GET: APIRoute = async ({ params, cookies }) => {
  const session = getSession({ cookies } as any);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }

  try {
    const { threadId } = params;
    
    // Get thread
    const thread = await getThread(threadId);
    if (!thread || thread.userId !== session.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403
      });
    }

    // Get all pages
    const pages = await Promise.all(
      thread.pageIds.map(id => getConversation(id))
    );

    return new Response(
      JSON.stringify({
        thread,
        pages: pages.filter(p => p !== null)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error getting thread:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get thread' }),
      { status: 500 }
    );
  }
};
```

---

## 🤖 AI Integration

### Including Previous Page Summary in Context

When sending a message in a paginated conversation, include the previous page summary:

```typescript
// In message sending logic
async function buildMessageContext(conversationId: string) {
  const conversation = await getConversation(conversationId);
  const messages = await getMessages(conversationId);
  
  let contextParts: string[] = [];
  
  // 1. Include previous page summary if exists
  if (conversation.previousPageId) {
    const previousPage = await getConversation(conversation.previousPageId);
    if (previousPage?.pageSummary) {
      contextParts.push(
        `### Resumen de Conversación Anterior (Página ${conversation.pageNumber! - 1})\n${previousPage.pageSummary}\n\n---\n`
      );
    }
  }
  
  // 2. Include current page messages
  const currentPageMessages = messages.map(m => ({
    role: m.role,
    parts: [{ text: typeof m.content === 'string' ? m.content : m.content.text }]
  }));
  
  return {
    systemContext: contextParts.join('\n'),
    messages: currentPageMessages
  };
}
```

---

## 📊 Context Window Monitoring

### Enhanced Context Calculation

```typescript
interface ContextBreakdown {
  systemPrompt: number;
  previousPageSummary: number;  // NEW
  conversationHistory: number;
  activeContextSources: number;
  userMessage: number;
  total: number;
  percentage: number;
  capacity: number;
  shouldPaginate: boolean;       // NEW: > 30%
}

function calculateContextWithPagination(
  conversation: Conversation,
  messages: Message[],
  activeContextSources: ContextSource[],
  userMessage: string,
  systemPrompt: string
): ContextBreakdown {
  const PAGINATION_THRESHOLD = 0.30; // 30%
  
  // Calculate tokens
  const systemPromptTokens = estimateTokens(systemPrompt);
  
  const previousPageTokens = conversation.previousPageId
    ? estimateTokens(previousPageSummary || '')
    : 0;
  
  const historyTokens = messages.reduce((sum, m) => {
    const content = typeof m.content === 'string' ? m.content : m.content.text || '';
    return sum + estimateTokens(content);
  }, 0);
  
  const contextSourcesTokens = activeContextSources.reduce((sum, s) => {
    return sum + estimateTokens(s.extractedData || '');
  }, 0);
  
  const userMessageTokens = estimateTokens(userMessage);
  
  const total = systemPromptTokens + previousPageTokens + historyTokens + 
                contextSourcesTokens + userMessageTokens;
  
  const capacity = conversation.agentModel === 'gemini-2.5-pro' 
    ? 2000000 
    : 1000000;
  
  const percentage = (total / capacity) * 100;
  
  return {
    systemPrompt: systemPromptTokens,
    previousPageSummary: previousPageTokens,
    conversationHistory: historyTokens,
    activeContextSources: contextSourcesTokens,
    userMessage: userMessageTokens,
    total,
    percentage,
    capacity,
    shouldPaginate: percentage > (PAGINATION_THRESHOLD * 100),
  };
}
```

---

## 🎯 Implementation Plan

### Phase 1: Data Model (Week 1)
- [ ] Add pagination fields to Conversation interface
- [ ] Create ConversationThread interface
- [ ] Update TypeScript types
- [ ] Create `conversation_threads` collection

### Phase 2: Backend Logic (Week 1-2)
- [ ] Implement `createConversationPage()` in firestore.ts
- [ ] Implement `generatePageSummary()` in gemini.ts
- [ ] Create Thread CRUD operations
- [ ] Create pagination API endpoints
- [ ] Add context calculation with summary tokens

### Phase 3: Frontend UI (Week 2)
- [ ] Add page navigation header
- [ ] Add pagination trigger button
- [ ] Implement page creation flow
- [ ] Add page history modal
- [ ] Update context display

### Phase 4: Integration (Week 3)
- [ ] Update message sending to include page summary
- [ ] Test context window calculation
- [ ] Test page navigation
- [ ] Test summary generation quality

### Phase 5: Polish & Testing (Week 3-4)
- [ ] Add animations/transitions
- [ ] Error handling
- [ ] Edge cases (empty pages, failed summaries)
- [ ] Performance testing
- [ ] Documentation

---

## ✅ Success Criteria

### Functional Requirements
- ✅ User can manually create new page when context > 30%
- ✅ System suggests pagination at 30% threshold
- ✅ New page includes summary of previous page
- ✅ Navigation between pages works smoothly
- ✅ All pages persist to Firestore
- ✅ Thread maintains correct order

### Technical Requirements
- ✅ Each page maintains context < 40%
- ✅ Summary generation < 3s
- ✅ Page creation < 2s
- ✅ No data loss during pagination
- ✅ Backward compatible (non-paginated conversations still work)

### User Experience
- ✅ Clear indication of page number
- ✅ Easy navigation between pages
- ✅ Smooth transitions
- ✅ Visual context continuity
- ✅ Summary helps user understand previous discussion

---

## 🚨 Risks & Mitigation

### Risk 1: Summary Quality
**Risk:** AI-generated summaries may miss important details  
**Mitigation:** 
- Use structured prompt with clear requirements
- Test with various conversation types
- Allow user to edit/view full history

### Risk 2: User Confusion
**Risk:** Users may not understand pagination concept  
**Mitigation:**
- Clear visual indicators (page numbers, navigation)
- Informative tooltips
- "Primera vez?" tutorial

### Risk 3: Breaking Changes
**Risk:** Existing conversations may break  
**Mitigation:**
- All pagination fields are optional
- Existing conversations work as single pages
- Gradual rollout with feature flag

---

## 🔄 Backward Compatibility

### Existing Conversations
- All existing conversations have no threadId → single page
- All new fields are optional
- No migration required
- Existing code continues to work

### Progressive Enhancement
```typescript
// Frontend code handles both cases
if (conversation.threadId) {
  // Show pagination UI
  showPageNavigation();
} else {
  // Normal conversation (no pagination)
  showNormalConversation();
}
```

---

## 📚 References

### Alignment with Project Rules
- ✅ `alignment.mdc` - Data Persistence First (all pages → Firestore)
- ✅ `data.mdc` - Additive schema changes (new optional fields)
- ✅ `agents.mdc` - Each page is still an agent
- ✅ `privacy.mdc` - userId filtering on threads and pages
- ✅ `code-change-protocol.mdc` - No breaking changes

### Similar Patterns
- Slack threads (parent + replies)
- Discord channels (topic continuity)
- Email threads (conversation continuity)
- ChatGPT conversation history

---

## 💡 Future Enhancements

### Auto-Pagination (Phase 2)
- Automatic page creation at 30% threshold
- User confirmation dialog
- Option to disable auto-pagination

### Smart Summaries (Phase 3)
- Include key decisions/outcomes
- Extract action items
- Link to important messages

### Page Merging (Phase 4)
- Combine pages if total < 20%
- Optimize thread structure
- Archive old pages

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Status:** 📋 Design Document  
**Estimated Effort:** 3-4 weeks  
**Priority:** Medium  
**Dependencies:** None

---

**Remember:** This feature optimizes context windows while maintaining conversation continuity. Each page is a full conversation with its own context, linked through summaries for seamless user experience.




