# 🗺️ Conversation Mindmap - User Guide

**For:** SuperAdmin (alec@getaifactory.com)  
**Access:** Chat interface → Mapa Mental tab  
**Status:** ✅ Available now on localhost:3000

---

## 🎯 What Is It?

A **visual representation** of your conversation that shows:

- 📊 **Conversation flow** - How the discussion evolved
- 📚 **Context sources** - Which documents are active
- 🔗 **References** - What sources the AI cited
- 📈 **Usage patterns** - How context is being utilized

---

## 🚀 How to Use It

### Step 1: Access the Feature

1. Go to http://localhost:3000/chat
2. Login as **SuperAdmin** (alec@getaifactory.com)
3. Select any agent or create a new one

### Step 2: Switch to Mindmap View

You'll see **two tabs** at the top of the chat area:

```
┌─────────────────────────────────────────────┐
│  [💬 Chat (5)]  [🔗 Mapa Mental SA]         │
└─────────────────────────────────────────────┘
```

- **Chat tab** - Traditional message view (default)
- **Mindmap tab** - Visual diagram (with purple "SA" badge)

### Step 3: View the Mindmap

Click the **"Mapa Mental"** tab to see:

```
         ┌──────────────────┐
         │   Agent Name     │
         └────────┬─────────┘
                  │
         ┌────────┴─────────┐
         │                  │
    ┌────▼────┐      ┌─────▼─────┐
    │ Context │      │Conversación│
    └────┬────┘      └─────┬─────┘
         │                 │
    ┌────▼────┐      ┌─────▼─────┐
    │ Doc 1   │      │  Turno 1  │
    │  [pdf]  │      │ User: "?" │
    │         │      │ AI: "..."  │
    │ Doc 2   │      │  Refs      │
    │  [csv]  │      │  Doc1 [3]  │
    └─────────┘      └────────────┘
```

---

## 🎨 What You'll See

### Root Node (Center)
- **Agent name** in double circles
- Example: `((GOP GPT M003))`

### Context Branch
- **Context** node
- Child nodes for each active document
- Type indicator in brackets: `[pdf]`, `[csv]`, `[excel]`, etc.

### Conversation Branch
- **Conversación** node
- **Turno N** for each user-assistant pair
- Shows last 5 interactions (most recent)
- Indicates earlier messages if more than 5

### Turn Details
- **Usuario:** Truncated question preview (30 chars)
- **AI:** Truncated response preview (30 chars)
- **Referencias:** Documents cited (if any)
  - Document name
  - Chunk count in brackets
  - Similarity score as percentage

---

## 💡 Use Cases

### 1. Understanding Context Usage

**See which documents are actually being used:**
- Active sources show in Context branch
- Referenced sources show under AI responses
- Identify unused context sources

### 2. Validating AI Responses

**Verify the AI is using appropriate sources:**
- Check which documents were cited
- View similarity scores (higher = better match)
- Ensure relevant sources are referenced

### 3. Optimizing Context

**Identify patterns to improve efficiency:**
- Which sources are never referenced? (consider removing)
- Which sources are always referenced? (keep active)
- Are there missing sources? (gaps in references)

### 4. Conversation Analysis

**Understand conversation structure:**
- How many turns before resolution?
- Which questions triggered which sources?
- Pattern recognition across similar conversations

---

## 🔍 Example Scenarios

### Scenario 1: HR Agent with CV Review

**Context Sources:**
- CV Tomás Alarcón.pdf
- Descripción Cargo Jefe Mecánico.csv
- Política de Contratación.docx

**Conversation:**
1. User: "¿Cumple Tomás con los requisitos?"
   - AI cites: CV (85%), Descripción Cargo (78%)
2. User: "¿Y la política de contratación?"
   - AI cites: Política (92%)

**Mindmap Shows:**
- All 3 context sources
- 2 conversation turns
- Which source was used when
- Similarity scores for validation

### Scenario 2: Technical Support Agent

**Context Sources:**
- Manual Técnico M001.pdf
- Base de Conocimiento.csv

**Conversation:**
1. User: "¿Cómo soluciono el error E001?"
   - AI cites: Manual Técnico [5 chunks] (88%)
2. User: "¿Hay casos similares?"
   - AI cites: Base de Conocimiento [2 chunks] (73%)

**Mindmap Shows:**
- Context relationship between manual and knowledge base
- Which sections of manual were most relevant
- Connection between error codes and solutions

---

## ⚙️ Current Limitations

### Display Limits

- **Shows last 5 turns only** (prevents overcrowding)
- **30 character previews** (keeps diagram readable)
- **No interactivity yet** (future: click nodes for details)

### Why These Limits?

- **Performance** - Large diagrams can be slow
- **Readability** - Too many nodes = confusing
- **Focus** - Recent conversation is most relevant

### Future Enhancements

Will add based on your feedback:
- Expand/collapse branches
- Click nodes for full text
- Export as image
- Filter by source type
- Timeline view option

---

## 🎨 Visual Indicators

### Node Colors (Mermaid Default)

- **Root:** Blue
- **Branches:** Green
- **Sub-nodes:** Various colors (auto-assigned)

### Text Formatting

- **Questions:** In quotes with "?"
- **Responses:** In quotes with "..."
- **References:** In brackets with count
- **Types:** In square brackets [pdf], [csv], etc.

### Badges in Tab

- **Chat tab:** Slate badge with message count
- **Mindmap tab:** Purple "SA" badge (SuperAdmin)

---

## 🔧 Troubleshooting

### Problem: Tab not showing

**Check:**
- Are you logged in as SuperAdmin?
- Console: Look for `userRole === 'superadmin'`
- Refresh page

### Problem: Mindmap empty

**Possible causes:**
- No messages in conversation yet (send one)
- Mermaid rendering error (check console)
- Missing context sources (they're optional)

**Solution:**
- Send a test message
- Check browser console for errors
- Try switching back to Chat tab and then back

### Problem: References not showing

**Possible causes:**
- Message has no references array
- RAG not enabled on context sources
- Similarity scores too low (filtered out)

**Solution:**
- Enable RAG on context sources
- Send new message with RAG active
- Check if full-text mode is being used instead

---

## 📈 Success Metrics

### How to Know It's Working

✅ **Visual confirmation:**
- Mindmap tab appears for SuperAdmin
- Diagram renders when tab clicked
- Context sources visible in diagram
- Conversation turns displayed

✅ **Functional confirmation:**
- Can switch between tabs smoothly
- New messages auto-update mindmap
- No errors in console
- No performance degradation

✅ **Feature flag working:**
- Regular users don't see mindmap tab
- No errors for non-SuperAdmin users
- Chat continues to work normally

---

## 💬 Feedback Template

After testing, please provide feedback:

**What works well:**
- (List what you like)

**What's confusing:**
- (List anything unclear)

**What's missing:**
- (List desired features)

**Performance:**
- (Any lag or slowness?)

**Visual design:**
- (Too cluttered? Too simple?)

**Overall usefulness:**
- Rating: 1-10
- Would you use this regularly?

---

## 🌟 Future Vision

This is **Phase 1** of the mindmap feature. Future phases will add:

### Phase 2: Interactivity
- Click nodes to expand
- Hover for previews
- Zoom and pan
- Export diagrams

### Phase 3: Enhanced Data
- User feedback (Stella)
- Backlog items (Rudy)
- Multi-user contributions
- Embeddings similarity

### Phase 4: Knowledge Graph
- Cross-conversation relationships
- Document clustering
- Concept mapping
- Impact analysis

---

## 🎯 Your Input Shapes the Future

This simple mindmap is the foundation. Your feedback will determine:

- What features get prioritized
- How the visualization evolves
- Which enhancements matter most
- Whether to expand to all users

**Test it, use it, and let me know what you think!** 🚀

---

**Quick Start:** http://localhost:3000/chat → Login → Select agent → Click "Mapa Mental" tab

**Ready to test!** ✨

