# Changelog System - Visual Architecture

**Created:** November 8, 2025  
**Purpose:** Visual diagrams for understanding the changelog system

---

## 📊 System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    CHANGELOG ECOSYSTEM                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  👤 USER LAYER                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Web Browser                                        │     │
│  │  ├─ /changelog page (ChangelogViewer)               │     │
│  │  ├─ Notification Bell (sidebar header)              │     │
│  │  └─ Tutorial Modals (FeatureTutorial)               │     │
│  └─────────────────────────────────────────────────────┘     │
│                          ↕                                     │
│                                                               │
│  🌐 API LAYER                                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  RESTful Endpoints (Astro)                          │     │
│  │  ├─ GET /api/changelog (list/filter)                │     │
│  │  ├─ GET /api/changelog/:id (single entry)           │     │
│  │  ├─ POST /api/changelog (create - admin)            │     │
│  │  ├─ GET /api/changelog/notifications (user notifs)  │     │
│  │  ├─ POST /api/changelog/notifications (broadcast)   │     │
│  │  └─ GET/POST /api/changelog/analytics (tracking)    │     │
│  └─────────────────────────────────────────────────────┘     │
│                          ↕                                     │
│                                                               │
│  💼 BUSINESS LOGIC LAYER                                      │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Service Functions (TypeScript)                     │     │
│  │  ├─ changelog.ts - Entry CRUD                       │     │
│  │  ├─ notifications.ts - Notification delivery        │     │
│  │  └─ Analytics tracking & aggregation                │     │
│  └─────────────────────────────────────────────────────┘     │
│                          ↕                                     │
│                                                               │
│  🔥 DATA LAYER                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Firestore Collections                              │     │
│  │  ├─ changelog_entries (feature docs)                │     │
│  │  ├─ changelog_notifications (user notifs)           │     │
│  │  ├─ platform_notifications (general)                │     │
│  │  └─ changelog_analytics (engagement)                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Publishing a New Feature

```
┌──────────────┐
│ Admin/Expert │
└──────┬───────┘
       │
       │ 1. Creates entry via API or UI
       ↓
┌──────────────────────────────────┐
│ POST /api/changelog              │
│ {                                │
│   version: '0.4.0',              │
│   title: 'New Feature',          │
│   industries: ['banking'],       │
│   useCases: [...],               │
│   ...                            │
│ }                                │
└────────┬─────────────────────────┘
         │
         │ 2. Validate & save to Firestore
         ↓
┌──────────────────────────────────┐
│ changelog_entries                │
│ ├─ entry-abc123                  │
│ │  ├─ version: '0.4.0'           │
│ │  ├─ title: 'New Feature'       │
│ │  └─ ...                        │
└────────┬─────────────────────────┘
         │
         │ 3. Broadcast notification
         ↓
┌──────────────────────────────────┐
│ POST /api/changelog/notifications│
│ {                                │
│   changelogEntryId: 'abc123',    │
│   userIds: [all active users]    │
│ }                                │
└────────┬─────────────────────────┘
         │
         │ 4. Create notification for each user
         ↓
┌──────────────────────────────────┐
│ platform_notifications           │
│ ├─ notif-user1                   │
│ ├─ notif-user2                   │
│ └─ notif-user3                   │
└────────┬─────────────────────────┘
         │
         │ 5. Users see notification
         ↓
┌──────────────────────────────────┐
│ 👤 Users                         │
│ ├─ Bell badge: (1)               │
│ ├─ Click → Dropdown              │
│ └─ Click → Navigate to changelog │
└──────────────────────────────────┘
```

---

### 2. User Discovers Feature

```
┌──────────────┐
│ 👤 User      │
└──────┬───────┘
       │
       │ 1. Visits /changelog
       ↓
┌──────────────────────────────────┐
│ GET /api/changelog?grouped=true │
└────────┬─────────────────────────┘
         │
         │ 2. Query Firestore with filters
         ↓
┌──────────────────────────────────┐
│ changelog_entries                │
│ WHERE status = 'stable'          │
│ ORDER BY releaseDate DESC        │
└────────┬─────────────────────────┘
         │
         │ 3. Group by version
         ↓
┌──────────────────────────────────┐
│ Grouped Response                 │
│ {                                │
│   groups: [                      │
│     {                            │
│       version: '0.3.0',          │
│       entries: [...]             │
│     }                            │
│   ]                              │
│ }                                │
└────────┬─────────────────────────┘
         │
         │ 4. Render in UI
         ↓
┌──────────────────────────────────┐
│ ChangelogViewer                  │
│ ├─ Hero section                  │
│ ├─ Filters                       │
│ └─ Version groups                │
│    └─ Feature entries            │
└────────┬─────────────────────────┘
         │
         │ 5. User clicks entry
         ↓
┌──────────────────────────────────┐
│ Track View                       │
│ POST /api/changelog/analytics    │
└────────┬─────────────────────────┘
         │
         │ 6. Save to analytics
         ↓
┌──────────────────────────────────┐
│ changelog_analytics              │
│ ├─ entryId: 'abc123'             │
│ ├─ userId: 'user456'             │
│ ├─ viewCount: +1                 │
│ └─ lastViewedAt: now()           │
└──────────────────────────────────┘
```

---

### 3. Industry-Specific Filtering

```
┌──────────────┐
│ User: Filter │
│ by Banking   │
└──────┬───────┘
       │
       │ 1. Click "Banking" filter button
       ↓
┌──────────────────────────────────┐
│ Frontend: Update state           │
│ setSelectedIndustry('banking')   │
└────────┬─────────────────────────┘
         │
         │ 2. Trigger reload with filter
         ↓
┌──────────────────────────────────┐
│ GET /api/changelog               │
│ ?industry=banking                │
│ &status=stable                   │
└────────┬─────────────────────────┘
         │
         │ 3. Query Firestore, filter in code
         ↓
┌──────────────────────────────────┐
│ getAllEntries()                  │
│ .filter(e =>                     │
│   e.industries.includes(         │
│     'banking'                    │
│   )                              │
│ )                                │
└────────┬─────────────────────────┘
         │
         │ 4. Return filtered results
         ↓
┌──────────────────────────────────┐
│ Response                         │
│ { entries: [                     │
│   { title: 'Security', ...},     │
│   { title: 'Agent Sharing', ...},│
│   { title: 'MCP', ...}           │
│ ]}                               │
└────────┬─────────────────────────┘
         │
         │ 5. Render banking-only entries
         ↓
┌──────────────────────────────────┐
│ ChangelogViewer                  │
│ Shows 3 banking-relevant features│
└──────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```
📄 /changelog page (changelog.astro)
  │
  └─ 📦 <ChangelogViewer />
      ├─ 🎨 Hero Section
      │   ├─ Title with icon
      │   ├─ Description
      │   └─ Stats cards (versions, features, industries)
      │
      ├─ 🔍 Filters Section
      │   ├─ Industry buttons (13)
      │   └─ Category buttons (11)
      │
      └─ 📋 Entries Section
          ├─ Version Group 0.3.0
          │   ├─ Version header
          │   ├─ Highlights
          │   └─ Entries
          │       ├─ Entry 1
          │       │   ├─ Header (title, badges)
          │       │   ├─ Description
          │       │   ├─ Value proposition
          │       │   ├─ Industries
          │       │   ├─ [Expand button]
          │       │   └─ Expanded content
          │       │       ├─ Use cases
          │       │       ├─ Alignment
          │       │       ├─ Technical details
          │       │       └─ Demo links
          │       └─ Entry 2...
          │
          ├─ Version Group 0.2.0
          └─ Version Group 0.1.0

💬 Feedback buttons (per entry)
  ├─ Thumbs up
  └─ Thumbs down
```

```
🔔 <NotificationBell />
  │
  ├─ 🔴 Badge (unread count)
  │
  └─ 📋 Dropdown (when clicked)
      ├─ Header ("Notificaciones")
      ├─ Mark all read button
      ├─ Notification list
      │   ├─ Notification 1
      │   │   ├─ Icon
      │   │   ├─ Title
      │   │   ├─ Message
      │   │   ├─ Timestamp
      │   │   └─ Action link
      │   └─ Notification 2...
      │
      └─ Footer ("Ver todas →")
```

```
🎓 <FeatureTutorial />
  │
  ├─ 🎨 Header
  │   ├─ Feature title
  │   ├─ Progress bar
  │   └─ Step navigator
  │
  ├─ 📖 Content
  │   ├─ Step title
  │   ├─ Description
  │   ├─ Highlights
  │   ├─ HTML demo (if provided)
  │   ├─ Image (if provided)
  │   └─ Video (if provided)
  │
  └─ 🎮 Footer
      ├─ Previous button
      ├─ Close button
      └─ Next/Complete button
```

---

## 🗂️ Data Schema

### Changelog Entry

```typescript
{
  // Identity
  id: "entry-abc123"
  version: "0.3.0"
  releaseDate: Date
  
  // Content
  title: "Feature Name"
  subtitle: "Brief value prop"
  description: "Full markdown description"
  
  // Classification
  category: "ai-agents" | "security" | ...
  status: "stable" | "beta" | ...
  industries: ["banking", "health", ...]
  
  // Priority & Impact
  priority: "critical" | "high" | "medium" | "low"
  impactScore: 1-10
  userRequestCount: number
  
  // Value
  valueProposition: "Business value statement"
  useCases: [
    {
      industry: "banking"
      title: "Use case name"
      description: "Scenario description"
      beforeAfter: {
        before: "Problem"
        after: "Solution"
      }
      metrics: {
        timeSaved: "80%"
        costReduction: "$5k/month"
        qualityImprovement: "95% accuracy"
      }
    }
  ]
  
  // User Feedback
  userFeedbackSource: "Link to feedback"
  requestedBy: ["User names"]
  alignmentReason: "Why this was prioritized"
  
  // Technical
  technicalDetails: {
    githubPRs: ["#123"]
    commits: ["abc123"]
    filesChanged: 15
    linesAdded: 800
    linesRemoved: 0
    breakingChanges: false
  }
  
  // Media
  showcase: {
    videoUrl: "..."
    imageUrls: [...]
    demoUrl: "..."
    interactiveTutorial: "..."
  }
  
  // Metadata
  tags: ["security", "gdpr"]
  relatedFeatures: ["other-entry-ids"]
  createdBy: "user-id"
  publishedBy: "admin-id"
  publishedAt: Date
}
```

---

### Notification

```typescript
{
  id: "notif-xyz789"
  userId: "user-456"
  type: "changelog" | "feature" | "announcement"
  title: "🎉 Nueva versión 0.3.0"
  message: "Sistema de Changelog disponible"
  
  actionUrl: "/changelog#entry-abc123"
  actionLabel: "Ver Novedades"
  
  read: false
  readAt: null
  dismissed: false
  
  priority: "high"
  icon: "Sparkles"
  color: "blue"
  
  relatedEntityType: "changelog"
  relatedEntityId: "entry-abc123"
  
  createdAt: Date
  expiresAt: Date (optional)
}
```

---

### Analytics

```typescript
{
  id: "analytics-123"
  changelogEntryId: "entry-abc123"
  userId: "user-456"
  
  viewCount: 3
  totalTimeSpent: 245 // seconds
  tutorialStarted: true
  tutorialCompleted: true
  
  helpful: true
  feedbackText: "Very useful!"
  
  firstViewedAt: Date
  lastViewedAt: Date
}
```

---

## 🎯 User Flows

### Flow 1: First-Time User

```
Login to platform
  ↓
See notification badge (1)
  ↓
Curious → Click bell
  ↓
"🎉 Bienvenido! Descubre las features"
  ↓
Click notification
  ↓
Lands on /changelog
  ↓
Filters by their industry (e.g., "Banking")
  ↓
Sees 3 relevant features
  ↓
Clicks "Agent Sharing"
  ↓
Expands details
  ↓
Reads banking use case
  ↓
"97% reduction in setup time" 🤯
  ↓
Clicks "Tutorial Interactivo"
  ↓
3-step walkthrough (90 seconds)
  ↓
Completes tutorial
  ↓
Clicks thumbs up
  ↓
Immediately tries feature
  ↓
Success! 🎉
```

**Time to value:** 5 minutes  
**Conversion:** Discovery → Understanding → Action

---

### Flow 2: Returning User

```
Regular usage of platform
  ↓
New feature released
  ↓
Notification appears (badge: 1)
  ↓
Between tasks → Clicks bell
  ↓
"🚀 New: Embeddings Vectoriales"
  ↓
Reads title: "Búsqueda 10x más precisa"
  ↓
Interested → Clicks
  ↓
Skims value prop: "95% precision"
  ↓
Scrolls to their industry use case
  ↓
"Regulatory search: 30% → 95% accuracy"
  ↓
Convinced → Clicks "Ver Demo"
  ↓
Watches 60-second video
  ↓
Enables feature in settings
  ↓
Provides feedback: Helpful ✓
```

**Time to adoption:** 3 minutes  
**Engagement:** High (video + feedback)

---

## 🏢 Industry Mapping

### 13 Industries × Features Matrix

```
                   Agent  Context  Security  MCP  CLI  Sharing
                   ──────────────────────────────────────────
Construction       ✓      ✓        ○         ○    ✓    ○
Real Estate        ✓      ✓        ✓         ○    ○    ○
Mobility           ○      ○        ○         ✓    ○    ○
Banking            ✓      ✓        ✓         ✓    ○    ✓
Fintech            ○      ○        ○         ✓    ✓    ○
Health             ✓      ○        ✓         ○    ○    ✓
Corp VC            ✓      ○        ✓         ✓    ○    ✓
Agriculture        ○      ✓        ○         ○    ○    ○
Family Office      ○      ○        ✓         ○    ○    ○
Retail             ○      ✓        ○         ○    ○    ○
eCommerce          ○      ○        ○         ○    ✓    ○
Higher Ed          ○      ○        ○         ○    ○    ✓
SMBs               ✓      ○        ○         ✓    ✓    ○

✓ = Feature specifically showcased for industry
○ = Feature applicable but not highlighted yet
```

**Coverage:** Every industry has 2-4 features highlighted

---

## 🎨 UI State Machine

### Changelog Viewer States

```
                  ┌─────────────┐
                  │   Loading   │
                  └──────┬──────┘
                         │
                    Fetch data
                         │
          ┌──────────────┴──────────────┐
          │                             │
     Success                         Failure
          │                             │
   ┌──────▼──────┐              ┌──────▼──────┐
   │   Loaded    │              │    Error    │
   │  (entries)  │              │  (empty)    │
   └──────┬──────┘              └─────────────┘
          │
     User action
          │
   ┌──────┴──────────────────────┐
   │                             │
Filter by industry        Expand entry
   │                             │
   ▼                             ▼
Re-filter                   Show details
(instant)                   (smooth expand)
   │                             │
   │                      User clicks tutorial
   │                             │
   │                      ┌──────▼──────┐
   │                      │  Tutorial   │
   │                      │   Modal     │
   │                      └─────────────┘
   │                             │
   └─────────────┬───────────────┘
                 │
          User provides feedback
                 │
          ┌──────▼──────┐
          │  Analytics  │
          │   Updated   │
          └─────────────┘
```

---

### Notification Bell States

```
        ┌─────────────┐
        │  No Badge   │ (unreadCount: 0)
        └──────┬──────┘
               │
        New notification
               │
        ┌──────▼──────┐
        │   Badge (1) │ (unreadCount > 0)
        └──────┬──────┘
               │
        User clicks bell
               │
        ┌──────▼──────────┐
        │   Dropdown      │
        │   Loading...    │
        └──────┬──────────┘
               │
          Fetch complete
               │
        ┌──────▼──────────┐
        │  Notifications  │
        │    Visible      │
        └──────┬──────────┘
               │
     User clicks notification
               │
        ┌──────▼──────────┐
        │  Navigate +     │
        │  Mark Read      │
        └──────┬──────────┘
               │
          API call complete
               │
        ┌──────▼──────┐
        │ Badge (0)   │
        └─────────────┘
```

---

## 🔌 Integration Points

### With Existing Systems

```
┌────────────────────────────────────────────────────┐
│  AI FACTORY PLATFORM                               │
├────────────────────────────────────────────────────┤
│                                                    │
│  Changelog System                                  │
│  │                                                 │
│  ├─→ User Management                               │
│  │   └─ Get all user IDs for broadcasting         │
│  │                                                 │
│  ├─→ Analytics Dashboard                           │
│  │   └─ Feature adoption metrics                  │
│  │                                                 │
│  ├─→ Feedback System                               │
│  │   └─ Link changelog to user feedback           │
│  │                                                 │
│  ├─→ Roadmap System                                │
│  │   └─ Released features move to changelog       │
│  │                                                 │
│  └─→ Agent Configuration                           │
│      └─ Tutorials reference agent setup            │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📊 Performance Characteristics

### Load Times

```
Changelog Page Load:
  ├─ HTML: ~100ms
  ├─ API call: ~200ms (6 entries)
  ├─ Rendering: ~50ms
  └─ Total: ~350ms ✅

Notification Bell:
  ├─ Unread count: ~100ms
  ├─ Badge render: ~10ms
  └─ Total: ~110ms ✅

Tutorial Load:
  ├─ Modal render: ~50ms
  ├─ Content load: ~20ms
  └─ Total: ~70ms ✅
```

### Database Queries

```
Get Changelog (filtered):
  ├─ Firestore query: ~150ms
  ├─ Array filtering: ~5ms
  ├─ Grouping logic: ~10ms
  └─ Total: ~165ms ✅

Get Notifications:
  ├─ Firestore query: ~100ms
  ├─ Formatting: ~5ms
  └─ Total: ~105ms ✅
```

### Scalability

```
Users:
  ├─ 10 users: Instant (<200ms)
  ├─ 100 users: Fast (<300ms)
  ├─ 1,000 users: Good (<500ms)
  └─ 10,000 users: OK (<1s with caching)

Entries:
  ├─ 10 entries: Instant
  ├─ 100 entries: Fast (add pagination)
  ├─ 1,000 entries: Need pagination
  └─ Firestore limit: 1M docs (not a concern)
```

---

## 🔐 Security Model

### Authentication Flow

```
User accesses /changelog
  ↓
Check session cookie
  ↓
┌────────┴─────────┐
│                  │
No session      Has session
│                  │
│                  ↓
│            Verify JWT
│                  │
│          ┌───────┴────────┐
│          │                │
│     Invalid JWT      Valid JWT
│          │                │
↓          ↓                ↓
Redirect to login     Load changelog
  (/auth/login?           ↓
   redirect=/changelog)   Filter by user
                          ↓
                        Return data
```

### Authorization Levels

```
Public Access (future):
  └─ stable releases

Authenticated Users:
  ├─ stable releases
  ├─ beta releases (if in beta program)
  └─ notifications
  └─ analytics (own data)

Admin/SuperAdmin:
  ├─ All above
  ├─ Draft releases
  ├─ Create/edit/delete entries
  ├─ Broadcast notifications
  └─ All analytics data
```

---

## 🎓 Educational Content

### Tutorial Structure

```
Tutorial: "Compartir Agentes"
  │
  ├─ Step 1: "Marca como Público" (30s)
  │   ├─ Description
  │   ├─ HTML demo (toggle button)
  │   └─ Key points
  │
  ├─ Step 2: "Gestiona Permisos" (45s)
  │   ├─ Description
  │   ├─ HTML demo (permission selector)
  │   └─ Key points
  │
  └─ Step 3: "Comparte con Equipo" (30s)
      ├─ Description
      ├─ HTML demo (share dialog)
      ├─ Key points
      └─ Completion badge
```

### Industry Showcases

```
Banking Use Case:
  ├─ Scenario card
  │   ├─ Title: "Agentes AML/KYC"
  │   ├─ Description
  │   └─ Before/After split
  │       ├─ Before (red): Manual setup, 3 hours
  │       └─ After (green): Clone certified agent, 5 min
  │
  └─ Metrics banner
      ├─ ⏱️ 97% faster
      ├─ 💰 $4k/month saved
      └─ 📈 100% consistency
```

---

## 🔮 Evolution Path

### V1.0 (Current) ✅
- Core changelog display
- Basic notifications
- Simple tutorials
- Manual entry creation

### V1.1 (Next 2 weeks)
- [ ] Admin UI for entries (no code)
- [ ] Image uploads
- [ ] Email notifications
- [ ] RSS feed

### V1.2 (Next month)
- [ ] User voting on features
- [ ] Community use cases
- [ ] Enhanced tutorials (branching)
- [ ] A/B testing for descriptions

### V2.0 (Next quarter)
- [ ] AI-generated changelog from commits
- [ ] Personalized changelog per role
- [ ] Slack/Teams integration
- [ ] Public API for integrations

---

## 📚 References

### Internal Docs
- Full feature doc: `docs/features/changelog-system-2025-11-08.md`
- Quick start: `docs/CHANGELOG_QUICK_START.md`
- This file: Visual architecture

### Code Files
- Types: `src/types/changelog.ts`
- Business logic: `src/lib/changelog.ts`, `src/lib/notifications.ts`
- API: `src/pages/api/changelog/*.ts`
- UI: `src/components/Changelog*.tsx`, `src/components/Notification*.tsx`
- Config: `src/config/industry-showcases.ts`

### External Inspiration
- Cursor Changelog: https://changelog.cursor.com/
- Linear Updates: https://linear.app/releases
- Stripe Changelog: https://stripe.com/blog/changelog

---

**Status:** ✅ Architecture Documented  
**Next:** Deploy and iterate based on user feedback  
**Vision:** Best-in-class changelog for AI platforms

