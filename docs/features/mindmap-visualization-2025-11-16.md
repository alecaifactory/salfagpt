# Conversation Mindmap Visualization

**Created:** 2025-11-16  
**Feature Flag:** SuperAdmin only  
**Status:** ✅ Implemented  
**Branch:** refactor/chat-v2-2025-11-15

---

## 🎯 Purpose

Provides a visual representation of conversation structure using Mermaid mindmaps, showing:
- Conversation flow (user-assistant turns)
- Context sources used
- Document references per message
- RAG chunk relationships

**Target Users:** SuperAdmin only (feature flag)

---

## 🏗️ Architecture

### Components

**ConversationMindmap** (`src/components/chat-v2/messages/ConversationMindmap.tsx`)
- Generates Mermaid mindmap diagram from conversation data
- Visualizes message flow, context, and references
- Auto-renders using mermaid.js

**MessagesArea** (`src/components/chat-v2/messages/MessagesArea.tsx`)
- Enhanced with tab system (Chat / Mindmap)
- Feature flag: Only shows mindmap tab for SuperAdmin
- Passes context sources to mindmap component

**ChatContainer** (`src/components/chat-v2/ChatContainer.tsx`)
- Passes `userRole` and `contextSources` to MessagesArea
- Context sources loaded via useCoordinatedLoad hook

---

## 📊 Mindmap Structure

```
mindmap
  root((Agent Name))
    Context
      Document 1
        [pdf]
      Document 2
        [csv]
    Conversación
      Turno 1
        Usuario: "Question preview..."
        AI: "Response preview..."
          Referencias
            Document 1 [3 chunks (85%)]
            Document 2 [1 chunk (72%)]
      Turno 2
        Usuario: "Follow-up..."
        AI: "Response..."
```

### Node Types

- **Root:** Agent name (double circle)
- **Branches:** Context, Conversación
- **Context Nodes:** Document names with type badges
- **Turn Nodes:** Sequential user-assistant pairs
- **Reference Nodes:** Documents referenced with chunk count and similarity scores

---

## 🔐 Feature Flag

### SuperAdmin Only Access

```typescript
// Feature flag check in MessagesArea
const isSuperAdmin = userRole === 'superadmin';

// Mindmap tab only visible if:
if (isSuperAdmin) {
  // Show mindmap tab
}
```

**Visual Indicator:** Purple "SA" badge on Mindmap tab

---

## 🎨 UI/UX

### Tab System

**Chat Tab:**
- Icon: MessageSquare
- Badge: Message count
- Default: Active on load

**Mindmap Tab:**
- Icon: Network
- Badge: "SA" (SuperAdmin indicator)
- Purple accent color

### Empty State

When no messages exist:
- Shows tabs for consistency
- Displays "No hay conversación aún" message
- Prompts user to send first message

### Mindmap View

- Full height scrollable area
- White background (light mode), dark gray (dark mode)
- Auto-renders on message/context changes
- Centered diagram with padding

---

## 🔄 Data Flow

```
ChatContainer
  ↓ (loads agent data)
useCoordinatedLoad
  ↓ (fetches in parallel)
/api/agents/[id]/context-sources
  ↓ (returns)
AgentData { contextSources: [...] }
  ↓ (passed to)
MessagesArea
  ↓ (if mindmap tab active)
ConversationMindmap
  ↓ (generates diagram)
Mermaid.js (renders mindmap)
```

---

## 📦 Dependencies

**New Package:**
- `mermaid` (^11.x) - Mindmap rendering engine
- `react-mermaid2` (^1.x) - React wrapper for mermaid

**Existing:**
- `lucide-react` - Icons (Network, MessageSquare)
- `zustand` - State management

---

## 🚀 Future Enhancements

### Phase 1 (Current)
- ✅ Basic conversation flow
- ✅ Context sources visualization
- ✅ Document references
- ✅ SuperAdmin feature flag

### Phase 2 (Planned)
- [ ] Interactive nodes (click to view details)
- [ ] Expand/collapse branches
- [ ] Filter by context source
- [ ] Export as PNG/SVG
- [ ] Timeline view option

### Phase 3 (Future)
- [ ] User feedback integration (Stella)
- [ ] Backlog items connected to conversations
- [ ] Roadmap items (Rudy integration)
- [ ] Collaboration visualization (multi-user contributions)
- [ ] Embeddings similarity map
- [ ] Chunk detail overlay

---

## 🧪 Testing

### Manual Testing Steps

1. **Login as SuperAdmin** (alec@getaifactory.com)
2. **Navigate to /chat**
3. **Verify mindmap tab visible** (with SA badge)
4. **Send a message with context sources active**
5. **Switch to Mindmap tab**
6. **Verify diagram renders** showing:
   - Agent name as root
   - Context sources branch
   - Conversation turns
   - References (if any)

### Non-SuperAdmin Testing

1. **Login as regular user**
2. **Navigate to /chat**
3. **Verify NO mindmap tab** (feature hidden)
4. **Chat functions normally**

---

## 📝 Implementation Notes

### Why Feature Flag?

- **Experimental feature** - needs validation
- **Performance consideration** - mermaid rendering on large conversations
- **Visual complexity** - may overwhelm regular users
- **SuperAdmin testing** - gather feedback before wider rollout

### Why Simple First?

Following project principle: "Keep it simple"
- Focus on core visualization (conversation + context + references)
- Avoid over-engineering before validation
- Easy to enhance based on feedback
- Minimal performance impact

### Backward Compatibility

- ✅ **Additive only** - no breaking changes
- ✅ **Feature flag** - doesn't affect existing users
- ✅ **Optional props** - contextSources defaults to empty array
- ✅ **Graceful degradation** - works without context sources

---

## 🎯 Success Metrics

**Qualitative:**
- SuperAdmin finds it useful for understanding conversations
- Helps identify context usage patterns
- Reveals reference relationships clearly

**Quantitative:**
- Zero performance degradation for non-SuperAdmin users
- Mindmap renders in < 1 second for conversations with < 20 messages
- No errors in production logs

---

## 📚 References

**Internal:**
- `.cursor/rules/alignment.mdc` - Progressive disclosure, feature flags
- `.cursor/rules/frontend.mdc` - React component patterns
- `src/components/chat-v2/` - Chat V2 architecture

**External:**
- [Mermaid Mindmap Docs](https://mermaid.js.org/syntax/mindmap.html)
- [React Mermaid](https://github.com/mermaid-js/mermaid)

---

**Last Updated:** 2025-11-16  
**Version:** 1.0.0  
**Implemented By:** Cursor AI (Alec)  
**Status:** ✅ Ready for testing

