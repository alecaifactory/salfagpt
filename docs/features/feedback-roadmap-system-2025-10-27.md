# Feedback & Roadmap Management System - Implementation Guide

**Created:** 2025-10-27  
**Status:** 🚧 Implementation Phase 1  
**Completion:** 30%

---

## 📋 Overview

Comprehensive product feedback and roadmap management system that enables:
- 📱 **User feedback collection** via AI-powered chat widget
- 🎨 **Screenshot annotation** for visual feedback
- 🤖 **AI-powered analysis** of feedback impact and requirements
- 📊 **Kanban backlog** management with priority scoring
- 🗺️ **AI roadmap planning** based on CSAT, NPS, and OKR alignment
- 🔧 **Worktree automation** from backlog items
- 💻 **CLI tools** for developers and admins
- 🔌 **Embeddable widget SDK** for multi-tenant deployments

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│  USER INTERFACE                                          │
│  ├─ Feedback Chat Widget (floating, right side)         │
│  ├─ Screenshot Capture (html2canvas)                    │
│  ├─ Annotation Tools (arrows, boxes, text)              │
│  └─ Real-time AI conversation                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  AI AGENT LAYER                                          │
│  ├─ Feedback Agent (Gemini 2.5 Flash)                  │
│  ├─ Requirement Extraction                               │
│  ├─ Impact Analysis (CSAT, NPS estimation)              │
│  └─ Agent Memory (context awareness)                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ADMIN INTERFACE                                         │
│  ├─ Feedback Review Panel                               │
│  ├─ Kanban Backlog Board                                │
│  ├─ Roadmap Planning Dashboard                          │
│  └─ Worktree Management                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  DATA LAYER (Firestore)                                 │
│  ├─ feedback_sessions (conversations)                   │
│  ├─ backlog_items (kanban items)                        │
│  ├─ roadmap_items (quarterly planning)                  │
│  ├─ feedback_agent_memory (user context)                │
│  ├─ company_okrs (alignment targets)                    │
│  └─ worktree_assignments (dev tracking)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Schema

### Collections Created

#### 1. `feedback_sessions` ✅
**Purpose:** Track complete user feedback conversations

**Key Fields:**
- `userId`, `companyId` (isolation)
- `sessionType`, `status`, `priority` (classification)
- `messages[]` (conversation history)
- `screenshots[]`, `annotations[]` (visual feedback)
- `aiSummary`, `extractedRequirements[]` (AI analysis)
- `expectedCSATImpact`, `expectedNPSImpact` (impact scores)
- `backlogItemId`, `roadmapItemId` (integration)

**Indexes:**
- userId ASC, createdAt DESC
- companyId ASC, status ASC, createdAt DESC
- status ASC, priority DESC, createdAt DESC

#### 2. `backlog_items` ✅
**Purpose:** Kanban-style backlog items

**Key Fields:**
- `title`, `description`, `userStory`, `acceptanceCriteria[]`
- `feedbackSessionIds[]` (source tracking)
- `type`, `category`, `tags[]` (classification)
- `priority`, `estimatedEffort`, `estimatedCSATImpact`, `estimatedNPSImpact`
- `alignedOKRs[]`, `okrImpactScore` (alignment)
- `status`, `lane`, `position` (kanban state)
- `assignedTo`, `worktreeId`, `branchName`, `prUrl` (dev tracking)

**Indexes:**
- companyId ASC, status ASC, priority DESC
- companyId ASC, lane ASC, position ASC
- status ASC, priority DESC, createdAt DESC

#### 3. `roadmap_items` ✅
**Purpose:** High-level roadmap planning

**Key Fields:**
- `title`, `description`, `objectives[]`
- `backlogItemIds[]`, `feedbackSessionIds[]` (composition)
- `quarter`, `status`, `progress`
- `estimatedCSATImpact`, `estimatedNPSImpact`, `affectedUsers`
- `alignedOKRs[]`, `okrImpactScore`, `strategicValue`
- `aiRationale`, `aiPriorityScore`, `aiRecommendedQuarter` (AI suggestions)
- `adminApproved`, `approvedBy`, `adminNotes` (admin review)

#### 4. `feedback_agent_memory` ✅
**Purpose:** Persistent context per user

**Key Fields:**
- `userId`, `companyId`
- `previousFeedback[]` (history)
- `preferredCommunicationStyle`, `commonPainPoints[]`, `frequentFeatureRequests[]`
- `totalSessions`, `averageSessionLength`

#### 5. `company_okrs` ✅
**Purpose:** Company objectives for alignment

**Key Fields:**
- `companyId`, `objective`, `keyResults[]`
- `quarter`, `year`, `status`
- `currentProgress`, `targetProgress`, `onTrack`

#### 6. `worktree_assignments` ✅
**Purpose:** Track dev work from backlog

**Key Fields:**
- `worktreePath`, `branchName`, `port`
- `backlogItemId`, `assignedTo`
- `status`, `progress`, `commits`, `filesChanged`
- `prUrl`, `mergedAt`

---

## 🎨 UI Components

### Components Created

#### 1. `FeedbackChatWidget.tsx` ✅
**Location:** `src/components/FeedbackChatWidget.tsx`

**Features:**
- Floating button with unread badge
- Expandable chat interface (400px width)
- Real-time AI conversation
- Screenshot capture with html2canvas
- Minimize/maximize animations
- Submit form with title

**Props:**
```typescript
interface FeedbackChatWidgetProps {
  userId: string;
  companyId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, summary: string) => void;
  onFeedbackSubmitted?: (feedbackId: string) => void;
}
```

**States:**
1. Collapsed: Floating button only
2. Open: Full chat interface
3. Minimized: Header bar only
4. Submit Form: Title + submit actions

#### 2. `AdminFeedbackPanel.tsx` ✅
**Location:** `src/components/AdminFeedbackPanel.tsx`

**Features:**
- Dashboard with stats (pending, under review, accepted, CSAT, NPS)
- Filter by status, priority, type
- Session cards with quick actions
- Detail modal with full conversation
- Approve/reject workflow
- Convert to backlog functionality

**Views:**
- List view: All sessions with filters
- Detail view: Full session analysis

---

## 📡 API Endpoints

### Endpoints Created

#### 1. `POST /api/feedback/sessions` ✅
**Purpose:** Create new feedback session

**Request:**
```json
{
  "userId": "user-123",
  "companyId": "company-abc",
  "sessionType": "feature_request",
  "initialMessage": "I need dark mode"
}
```

**Response:**
```json
{
  "id": "session-xyz",
  "userId": "user-123",
  "companyId": "company-abc",
  "sessionType": "feature_request",
  "status": "active",
  "messages": [],
  "createdAt": "2025-10-27T..."
}
```

#### 2. `POST /api/feedback/sessions/:id/messages` ✅
**Purpose:** Send message to AI agent

**Request:**
```json
{
  "userId": "user-123",
  "message": "I work late at night and the bright UI hurts my eyes"
}
```

**Response:**
```json
{
  "messageId": "msg-abc",
  "response": "Entiendo, el modo oscuro sería muy útil...",
  "timestamp": "2025-10-27T..."
}
```

#### 3. `POST /api/feedback/sessions/:id/submit` ✅
**Purpose:** Submit completed feedback

**Request:**
```json
{
  "title": "Add dark mode",
  "description": "Full conversation summary..."
}
```

---

## 🛠️ CLI Commands

### Commands Structure

#### 1. `feedback` command ✅
**File:** `cli/commands/feedback.ts`

**Subcommands:**
- `submit` - Submit feedback from CLI
- `list` - View feedback sessions
- `view <sessionId>` - View specific session
- `note <sessionId> <note>` - Add admin note

**Examples:**
```bash
# Submit feature request
flow-cli feedback submit \
  --type feature \
  --title "Add dark mode" \
  --description "Users need dark mode for night work" \
  --priority high

# List pending feedback
flow-cli feedback list --status submitted

# View session details
flow-cli feedback view session-xyz

# Add admin note
flow-cli feedback note session-xyz "Scheduled for Q1 2025"
```

#### 2. `backlog` command 🚧
**Status:** Planned (not yet implemented)

**Subcommands:**
- `list` - View backlog items
- `create` - Create backlog item
- `move` - Move item between lanes
- `assign` - Assign to developer/worktree

#### 3. `roadmap` command 🚧
**Status:** Planned (not yet implemented)

**Subcommands:**
- `analyze` - Run AI roadmap analysis
- `view` - View roadmap for quarter
- `approve` - Approve AI suggestions
- `reject` - Reject with reason

---

## 🔄 Complete User Flow

### Flow 1: User Submits Feedback

```
1. User clicks feedback button (bottom-right)
   ↓
2. Widget opens, AI greets: "¡Hola! 👋 ¿En qué puedo ayudarte?"
   ↓
3. User: "Necesito modo oscuro"
   ↓
4. AI: "¿Qué problema estás tratando de resolver con el modo oscuro?"
   ↓
5. User: "Trabajo de noche y la pantalla brillante me cansa los ojos"
   ↓
6. AI: "Entiendo. ¿Una captura de pantalla ayudaría a mostrar el problema?"
   ↓
7. User clicks "Capturar Pantalla"
   ↓
8. Screenshot captured and uploaded
   ↓
9. AI: "Gracias. ¿Cuántos usuarios crees que se beneficiarían?"
   ↓
10. User: "Muchos, trabajamos turnos nocturnos"
    ↓
11. AI generates summary:
    - Title: "Implementar modo oscuro"
    - Requirements: ["Dark color scheme", "Toggle switch", "Save preference"]
    - Impact: CSAT +1.5, NPS +15
    ↓
12. User reviews and clicks "Enviar Feedback"
    ↓
13. Session status → 'submitted'
    ↓
14. Admin receives notification
    ↓
15. Widget shows: "✅ ¡Gracias! Revisaremos pronto."
```

### Flow 2: Admin Reviews Feedback

```
1. Admin opens feedback panel
   ↓
2. Sees new submission with AI analysis
   ↓
3. Reviews conversation + screenshot
   ↓
4. Sees AI summary: "User needs dark mode for night work"
   ↓
5. Sees impact: CSAT +1.5, NPS +15, ~50 affected users
   ↓
6. Admin clicks "→ Backlog"
   ↓
7. Backlog item created:
   - Title: "Implementar modo oscuro"
   - User Story: "As a night shift user, I want dark mode, so I don't strain my eyes"
   - Acceptance Criteria: [generated from AI analysis]
   - Priority: High (based on impact)
   - Lane: "Next"
   ↓
8. Feedback status → 'accepted'
   ↓
9. User notified: "Tu feedback fue aceptado! Programado para Q1 2025"
```

### Flow 3: AI Roadmap Analysis (Weekly)

```
1. Cron job triggers roadmap analysis
   ↓
2. Collect all approved feedback from last week
   ↓
3. Load company OKRs and current roadmap
   ↓
4. AI analyzes:
   - Clusters similar feedback
   - Calculates impact scores
   - Evaluates OKR alignment
   - Suggests priorities
   ↓
5. AI generates recommendations:
   - New backlog items: [...]
   - Priority changes: [...]
   - Roadmap updates: [...]
   - Rationale: "Dark mode aligns with OKR 'Improve UX', high impact..."
   ↓
6. Admin reviews AI suggestions
   ↓
7. Admin approves/modifies
   ↓
8. Roadmap updated
   ↓
9. Backlog reprioritized
   ↓
10. Teams notified of changes
```

---

## 🎯 Implementation Status

### Phase 1: Foundation ✅ (Current)

- [x] Data schema designed and documented
- [x] TypeScript interfaces created
- [x] Feedback chat widget component
- [x] API endpoints (create session, send message, submit)
- [x] AI agent integration (Gemini 2.5 Flash)
- [x] Basic CLI commands (submit, list, view)
- [x] Admin feedback panel component
- [ ] Screenshot capture implementation
- [ ] Annotation tools
- [ ] Session persistence

### Phase 2: Admin Tools 🚧 (Next)

- [ ] Complete admin feedback panel
- [ ] Admin approval workflow API
- [ ] Convert to backlog API
- [ ] Admin notifications
- [ ] Feedback metrics dashboard

### Phase 3: Backlog & Kanban 📅

- [ ] Kanban board component
- [ ] Drag & drop functionality
- [ ] Backlog CRUD APIs
- [ ] Priority scoring algorithm
- [ ] Impact visualization

### Phase 4: AI Analysis 📅

- [ ] Impact analysis AI prompt
- [ ] OKR alignment analyzer
- [ ] Roadmap suggestion AI
- [ ] Clustering algorithm
- [ ] Priority recommendation engine

### Phase 5: Worktree Integration 📅

- [ ] Worktree creation from backlog
- [ ] Git integration scripts
- [ ] Progress tracking automation
- [ ] PR creation workflow
- [ ] Completion detection

### Phase 6: CLI & SDK 📅

- [ ] Complete CLI commands
- [ ] Embeddable widget package
- [ ] Widget configuration API
- [ ] MCP server foundation
- [ ] Public API documentation

---

## 📝 Files Created (Phase 1)

### Rules & Documentation
- ✅ `.cursor/rules/feedback-system.mdc` (4,200 lines)
  - Complete system documentation
  - Data schemas
  - UI specifications
  - API contracts
  - CLI reference

### TypeScript Types
- ✅ `src/types/feedback.ts` (280 lines)
  - All interface definitions
  - Type guards
  - Helper types

### UI Components
- ✅ `src/components/FeedbackChatWidget.tsx` (350 lines)
  - Floating chat button
  - Expandable chat interface
  - Message rendering
  - Screenshot integration (partial)
  - Submit workflow

- ✅ `src/components/AdminFeedbackPanel.tsx` (310 lines)
  - Stats dashboard
  - Filters (status, priority, type)
  - Session list with cards
  - Detail modal
  - Quick actions (approve, convert)

### API Endpoints
- ✅ `src/pages/api/feedback/sessions.ts`
  - POST: Create session
  - GET: List sessions

- ✅ `src/pages/api/feedback/sessions/[id]/messages.ts`
  - POST: Send message to AI agent

- ✅ `src/pages/api/feedback/sessions/[id]/submit.ts`
  - POST: Submit feedback

### CLI Commands
- ✅ `cli/commands/feedback.ts` (200 lines)
  - `submit` - Submit from CLI
  - `list` - View sessions
  - `view` - Session details
  - `note` - Add admin note

---

## 🚀 Next Steps (Phase 1 Completion)

### Immediate Tasks

1. **Screenshot Implementation** 🔨
   - Install html2canvas: `npm install html2canvas`
   - Create screenshot upload API
   - Integrate with GCS for storage
   - Add annotation layer

2. **Annotation Tools** 🎨
   - Create annotation canvas overlay
   - Implement drawing tools (arrow, box, text)
   - Color picker
   - Stroke width selector
   - Save annotations to session

3. **Session Persistence** 💾
   - Load active session on widget open
   - Resume conversation from last message
   - Sync state with Firestore real-time

4. **Testing** 🧪
   - Test widget in ChatInterfaceWorking
   - Test AI responses
   - Test admin panel
   - Test CLI commands

---

## 📦 Dependencies to Install

```bash
# Screenshot capture
npm install html2canvas

# Annotation tools (optional - can build custom)
# npm install react-konva konva

# CLI framework (already installed)
# npm install commander

# Date formatting
npm install date-fns
```

---

## 🔧 Integration Points

### Add to ChatInterfaceWorking.tsx

```typescript
import FeedbackChatWidget from './FeedbackChatWidget';

// In component
<FeedbackChatWidget
  userId={currentUser?.id || ''}
  companyId={currentUser?.company || 'demo'}
  position="bottom-right"
  onFeedbackSubmitted={(id) => {
    console.log('Feedback submitted:', id);
    // Optional: Show toast notification
  }}
/>
```

### Add admin route

**File:** `src/pages/admin/feedback.astro`

```astro
---
import AdminFeedbackPanel from '../../components/AdminFeedbackPanel';
import Layout from '../../layouts/Layout.astro';

// Auth check
const session = getSession(Astro.cookies);
if (!session || session.role !== 'admin') {
  return Astro.redirect('/auth/login');
}
---

<Layout title="Feedback Management">
  <AdminFeedbackPanel 
    client:load
    companyId={session.companyId}
    adminUserId={session.id}
  />
</Layout>
```

---

## 💰 Cost Considerations

### Estimated Costs (per 1,000 users/month)

**Firestore:**
- Reads: ~50K (sessions + messages) = $0.03
- Writes: ~10K (messages + updates) = $0.18
- Storage: ~1GB (conversations + screenshots) = $0.18
- **Total: ~$0.39/month**

**Gemini AI (Feedback Agent):**
- Avg conversation: 10 messages × 100 tokens = 1,000 tokens
- Sessions/month: ~500 (50% of users give feedback)
- Total tokens: 500K input + 250K output
- Cost: $0.04 (input) + $0.08 (output) = **$0.12/month**

**Cloud Storage (Screenshots):**
- Avg screenshots/session: 2
- Avg size: 500KB
- Storage: 500 sessions × 2 × 0.5MB = 500MB = **$0.01/month**

**Total: ~$0.52 per 1,000 users/month** ✅ Very cost-effective

---

## 🔒 Security & Privacy

### Data Isolation

**User-level:**
- ✅ Users see only their own feedback sessions
- ✅ userId filter on all queries
- ✅ Session ownership verified in APIs

**Company-level:**
- ✅ Admins see only their company's feedback
- ✅ companyId filter for admin queries
- ✅ Company OKRs isolated per company

**Firestore Security Rules:**
```javascript
match /feedback_sessions/{sessionId} {
  // Users can read/write their own feedback
  allow read, write: if request.auth != null && 
                      resource.data.userId == request.auth.uid;
  
  // Admins can read all company feedback
  allow read: if request.auth != null && 
              isAdmin(request.auth.uid) &&
              resource.data.companyId == getUserCompany(request.auth.uid);
}
```

---

## 📊 Success Metrics

### User Engagement
- **Target:** 40% of users submit feedback monthly
- **Measure:** `totalSessions / totalUsers`

### Admin Efficiency
- **Target:** Review feedback in < 5 minutes
- **Measure:** Time from submission to approval

### Impact Accuracy
- **Target:** 80% correlation between predicted and actual CSAT/NPS
- **Measure:** Compare predictions vs post-release surveys

### Roadmap Alignment
- **Target:** > 90% of roadmap items align with OKRs
- **Measure:** `itemsWithOKRAlignment / totalRoadmapItems`

### Development Velocity
- **Target:** Feedback → Production < 30 days (p95)
- **Measure:** Time from submission to feature launch

---

## 🔮 Future Enhancements

### Short-term (1-2 months)
- [ ] Email notifications for feedback updates
- [ ] Slack integration for admin alerts
- [ ] Video recording for feedback (Loom-style)
- [ ] Voice input for feedback messages
- [ ] Export feedback as PDF

### Medium-term (3-6 months)
- [ ] Public roadmap page (show users what's coming)
- [ ] Voting system (users upvote feedback)
- [ ] Feedback analytics dashboard
- [ ] A/B testing integration
- [ ] Sentiment analysis on feedback

### Long-term (6-12 months)
- [ ] Multi-language support
- [ ] Mobile SDK (React Native)
- [ ] Zapier integration
- [ ] Linear/Jira sync
- [ ] AI-powered feature scoping
- [ ] Automated testing generation from acceptance criteria

---

## 🎓 Key Design Decisions

### Why Gemini 2.5 Flash for Feedback Agent?
- ✅ Fast response (<2s)
- ✅ Cost-effective ($0.12 per 1K users)
- ✅ Sufficient for conversational tasks
- ✅ Good at requirement extraction

### Why Separate Feedback Sessions from Messages Collection?
- ✅ Cleaner data model
- ✅ Easier to query sessions
- ✅ Messages embedded = atomic updates
- ✅ No joins needed

### Why AI Analysis at Submission vs Real-time?
- ✅ Better context with full conversation
- ✅ More accurate impact estimation
- ✅ Reduces API calls during chat
- ✅ Admin sees polished analysis

### Why Kanban vs List for Backlog?
- ✅ Visual workflow
- ✅ Clear progress tracking
- ✅ Intuitive prioritization
- ✅ Industry standard

---

## 📚 References

### Internal Rules
- `.cursor/rules/alignment.mdc` - User feedback principles
- `.cursor/rules/data.mdc` - Data schema patterns
- `.cursor/rules/privacy.mdc` - User data isolation
- `.cursor/rules/agents.mdc` - AI agent architecture

### External Resources
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [Commander.js (CLI)](https://github.com/tj/commander.js)
- [Kanva (Annotations)](https://konvajs.org/)
- [OKR Framework](https://www.whatmatters.com/faqs/okr-meaning-definition-example)

---

## ✅ Verification Checklist

### Before Merging to Main

- [ ] All TypeScript types defined
- [ ] API endpoints tested manually
- [ ] Widget renders without errors
- [ ] AI responses working
- [ ] Admin panel loads
- [ ] CLI commands functional
- [ ] Documentation complete
- [ ] No console errors
- [ ] Backward compatible
- [ ] Privacy rules enforced

---

**Last Updated:** 2025-10-27  
**Next Review:** 2025-10-28  
**Owner:** Alec  
**Status:** Phase 1 - 30% complete

---

**This is a foundational system that will transform how we collect, analyze, and act on user feedback. The AI-powered approach ensures we never miss critical insights and always align with our users' needs and company OKRs.** 🚀

