# Ally Dual-Level Architecture - User Private + Domain Shared

**Date:** November 16, 2025  
**Version:** 3.0.0 (Dual-Level Privacy)  
**Purpose:** Balance user privacy with admin oversight for Customer Success

---

## 🎯 Core Concept

**Two separate Ally instances per user:**

1. **User-Level Ally** (Private)
   - Completely private to individual user
   - Opt-in (user must enable)
   - Stored with user's personal email
   - Admin CANNOT access
   - For personal productivity and preferences

2. **Domain-Level Ally** (Shared within Domain)
   - Accessible to Domain Admins
   - Always enabled (system-level)
   - For customer success, support, compliance
   - Tracks: NPS, CSAT, bugs, engagement
   - Enables proactive issue resolution

---

## 🏗️ ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    DUAL-LEVEL ALLY SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User: alec@getaifactory.com                                │
│  Domain: getaifactory.com                                   │
│  Organization: AI Factory                                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🔒 USER-LEVEL ALLY (Private)                         │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  Owner: alec@ (user ID)                               │  │
│  │  Access: Only alec@ can read/write                    │  │
│  │  Purpose: Personal productivity                       │  │
│  │  Stored: conversations (privacyLevel: 'user')         │  │
│  │  Opt-in: User must enable in settings                 │  │
│  │                                                        │  │
│  │  Content Examples:                                     │  │
│  │  • Personal notes and reminders                       │  │
│  │  • Private questions about platform                   │  │
│  │  • Draft messages before sending                      │  │
│  │  • Personal preferences and settings                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🏢 DOMAIN-LEVEL ALLY (Shared - Admin Access)        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  Owner: alec@ (user ID)                               │  │
│  │  Access: alec@ + Domain Admins                        │  │
│  │  Purpose: Customer success & oversight                │  │
│  │  Stored: conversations (privacyLevel: 'domain')       │  │
│  │  Always on: System-enabled                            │  │
│  │                                                        │  │
│  │  Content Examples:                                     │  │
│  │  • Feature feedback and bug reports                   │  │
│  │  • NPS/CSAT ratings and feedback                      │  │
│  │  • Usage questions and support requests               │  │
│  │  • Agent usage patterns and preferences               │  │
│  │                                                        │  │
│  │  Admin Can See:                                        │  │
│  │  ✅ Conversation summaries (not full content)         │  │
│  │  ✅ NPS/CSAT scores                                    │  │
│  │  ✅ Bug reports and issues                            │  │
│  │  ✅ Feature requests                                   │  │
│  │  ✅ Agent usage patterns                              │  │
│  │  ✅ Engagement metrics                                │  │
│  │                                                        │  │
│  │  Admin CANNOT See:                                     │  │
│  │  ❌ User-level Ally conversations                     │  │
│  │  ❌ Private user notes                                │  │
│  │  ❌ Personal preferences (unless shared)              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA SCHEMA (Extended)

### Conversation Schema (Updated)

```typescript
interface Conversation {
  // ... ALL existing fields ...
  
  // 🆕 ALLY PRIVACY LEVELS
  isAlly?: boolean;                    // True if this is Ally
  isPinned?: boolean;                  // Pin to top
  allyPrivacyLevel?: 'user' | 'domain'; // Privacy level
  
  // User-level Ally specific
  userEmail?: string;                  // Personal email (for user-level only)
  userOptIn?: boolean;                 // User consented to user-level Ally
  
  // Domain-level Ally specific
  domainId?: string;                   // Domain this belongs to
  adminAccessible?: boolean;           // Admins can view (domain-level only)
  
  // Customer Success tracking (domain-level only)
  csMetrics?: {
    npsScore?: number;                 // 0-10 NPS score
    csatScore?: number;                // 1-5 CSAT score
    bugReports?: number;               // Count of bugs reported
    featureRequests?: number;          // Count of features requested
    engagementScore?: number;          // 0-100 engagement metric
    lastNPSAt?: Date;
    lastCSATAt?: Date;
  };
}
```

---

### Ally Message Schema (Extended)

```typescript
interface Message {
  // ... existing fields ...
  
  // 🆕 ALLY METADATA (for domain-level only)
  allyMetadata?: {
    privacyLevel: 'user' | 'domain';
    category?: 'support' | 'feedback' | 'bug' | 'feature-request' | 'question' | 'other';
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    npsScore?: number;                 // If user provided NPS
    csatScore?: number;                // If user provided CSAT
    tags?: string[];                   // Auto-tagged for admin search
  };
}
```

---

## 🎨 UI: Dual Ally Display

### In Agentes Section (User View)

```
┌─────────────────────────────────────┐
│ ▼ Agentes                       7   │
│                                     │
│ ╔═══════════════════════════════╗   │ ← USER-LEVEL ALLY (if enabled)
│ ║ 🔒 Ally (Personal)       📌  ║   │   Blue gradient
│ ║ Private                       ║   │   Lock icon
│ ║ Solo visible para ti          ║   │
│ ╚═══════════════════════════════╝   │
│                                     │
│ ╔═══════════════════════════════╗   │ ← DOMAIN-LEVEL ALLY (always)
│ ║ 🏢 Ally (Team)           📌  ║   │   Green gradient
│ ║ Shared                        ║   │   Building icon
│ ║ Visible para admins           ║   │
│ ╚═══════════════════════════════╝   │
│ ─────────────────────────────────   │ ← Separator
│   M001 - Legal                      │
│   S001 - Warehouse                  │
└─────────────────────────────────────┘
```

### In Admin View (Domain Admin)

```
┌─────────────────────────────────────┐
│ ▼ Agentes                       7   │
│                                     │
│ ╔═══════════════════════════════╗   │ ← DOMAIN-LEVEL ALLY
│ ║ 🏢 Ally (Domain Oversight)   ║   │   Admin can access
│ ║ Customer Success              ║   │
│ ║ 50 users • NPS 92 • CSAT 4.2  ║   │   Metrics visible
│ ╚═══════════════════════════════╝   │
│ ─────────────────────────────────   │
│                                     │
│ 📊 Domain Ally Dashboard            │ ← New section
│ • Active conversations: 45          │
│ • Bug reports: 3 (🔴 2 unresolved)  │
│ • Feature requests: 12              │
│ • Avg NPS: 92 (Target: 98)         │
│ • Avg CSAT: 4.2 (Target: 4.5)      │
│ • At-risk users: 2 ⚠️               │
│                                     │
│ [View Full Dashboard]               │
└─────────────────────────────────────┘
```

---

## 🔐 PRIVACY & ACCESS CONTROL

### User-Level Ally

**Access Rules:**
```typescript
// Firestore Security Rules
match /conversations/{convId} {
  // User-level Ally: ONLY owner can access
  allow read, write: if resource.data.allyPrivacyLevel == 'user' &&
                        resource.data.userId == request.auth.uid;
}

match /messages/{msgId} {
  // User-level Ally messages: ONLY owner can access
  allow read, write: if get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.allyPrivacyLevel == 'user' &&
                        resource.data.userId == request.auth.uid;
}
```

**User Controls:**
```
Settings → Privacy → Personal Ally

┌────────────────────────────────────────────┐
│ 🔒 Personal Ally (Private)                  │
├────────────────────────────────────────────┤
│                                            │
│ [○] Enable Personal Ally                   │
│     Your private assistant, only you       │
│     can access                             │
│                                            │
│ ⚠️  When enabled:                          │
│ • Creates separate private Ally            │
│ • Uses your personal email                 │
│ • Completely private (admins cannot see)   │
│ • Opt-out anytime (data preserved)         │
│                                            │
│ [Enable Personal Ally]                     │
└────────────────────────────────────────────┘
```

---

### Domain-Level Ally

**Access Rules:**
```typescript
// Firestore Security Rules
match /conversations/{convId} {
  // Domain-level Ally: Owner + Domain Admins
  allow read: if resource.data.allyPrivacyLevel == 'domain' &&
                 (resource.data.userId == request.auth.uid ||
                  isDomainAdmin(resource.data.domainId));
  
  allow write: if resource.data.allyPrivacyLevel == 'domain' &&
                  resource.data.userId == request.auth.uid;
}

function isDomainAdmin(domainId) {
  let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
  return user.role in ['admin', 'superadmin'] &&
         user.email.matches('.*@' + domainId);
}
```

**Admin View:**
```
Domain Ally Dashboard → Conversations

┌────────────────────────────────────────────┐
│ 🏢 Domain Ally - Customer Success          │
├────────────────────────────────────────────┤
│                                            │
│ 📊 Overview (Last 30 days)                 │
│ • Active users: 50                         │
│ • Conversations: 234                       │
│ • Avg NPS: 92 (🎯 Target: 98)              │
│ • Avg CSAT: 4.2 (🎯 Target: 4.5)           │
│ • Bug reports: 8 (⚠️  3 unresolved)        │
│ • Feature requests: 23                     │
│                                            │
│ 🚨 Proactive Alerts                        │
│ • 2 users with declining engagement ⚠️     │
│ • 1 user reported bug 3x (needs follow-up) │
│ • 5 users asked same question (doc gap)    │
│                                            │
│ 👥 User Conversations (Summaries Only)     │
│ ┌──────────────────────────────────────┐  │
│ │ User: sorellanac@salfagestion.cl     │  │
│ │ Last active: 2 hours ago              │  │
│ │ NPS: 95 | CSAT: 4.5 | Engagement: 87%│  │
│ │                                      │  │
│ │ Recent Topics:                        │  │
│ │ • Agent M001 usage questions         │  │
│ │ • Feature request: Export to Excel   │  │
│ │ • Bug: Slow loading (RESOLVED)       │  │
│ │                                      │  │
│ │ [View Summary] [Contact User]        │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [Export CS Report] [Schedule Review]       │
└────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA (Dual-Level)

### Extended Conversation Schema

```typescript
interface Conversation {
  // ... existing fields ...
  
  // ALLY FIELDS (Extended)
  isAlly?: boolean;
  isPinned?: boolean;
  
  // 🆕 PRIVACY LEVEL (Critical)
  allyPrivacyLevel?: 'user' | 'domain';
  
  // User-level specific
  userEmail?: string;                  // Personal email (user-level only)
  userOptIn?: boolean;                 // User consented
  userOptInAt?: Date;
  
  // Domain-level specific
  domainId?: string;                   // Domain ID
  adminAccessible?: boolean;           // Admins can view summaries
  
  // Customer Success Metrics (domain-level only)
  csMetrics?: {
    npsScore?: number;                 // Latest NPS (0-10)
    csatScore?: number;                // Latest CSAT (1-5)
    npsHistory?: Array<{ score: number; date: Date }>;
    csatHistory?: Array<{ score: number; date: Date }>;
    bugReportsCount?: number;
    featureRequestsCount?: number;
    engagementScore?: number;          // 0-100 computed metric
    lastNPSAt?: Date;
    lastCSATAt?: Date;
    riskLevel?: 'low' | 'medium' | 'high'; // Computed: churn risk
  };
  
  // Proactive Insights (domain-level only)
  insights?: {
    declineEngagement?: boolean;       // Engagement dropping
    repeatedIssues?: string[];         // Same issue multiple times
    needsFollowUp?: boolean;           // Admin should reach out
    lastReviewedByAdmin?: Date;
    reviewedBy?: string;               // Admin user ID
  };
}
```

---

### Message Metadata (Domain-Level)

```typescript
interface Message {
  // ... existing fields ...
  
  // 🆕 ALLY METADATA (domain-level only, for admin analytics)
  allyMetadata?: {
    privacyLevel: 'user' | 'domain';
    
    // Auto-categorization
    category?: 'support' | 'feedback' | 'bug' | 'feature-request' | 'nps' | 'csat' | 'question' | 'other';
    subcategory?: string;              // Specific issue type
    
    // Sentiment analysis
    sentiment?: 'positive' | 'neutral' | 'negative';
    sentimentScore?: number;           // -1 to 1
    
    // Urgency (auto-detected)
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    
    // Metrics (if provided in message)
    npsScore?: number;                 // 0-10
    csatScore?: number;                // 1-5
    
    // Tagging (for admin search/filter)
    tags?: string[];                   // ['bug', 'agent-m001', 'slow-performance']
    
    // Admin actions
    reviewed?: boolean;
    reviewedBy?: string;
    reviewedAt?: Date;
    resolved?: boolean;
    resolvedAt?: Date;
    resolution?: string;
  };
}
```

---

## 🎨 USER EXPERIENCE

### User View (Shows Both Allies)

```
Agentes Section:

╔═══════════════════════════════╗  ← USER-LEVEL (if enabled)
║ 🔒 Ally Personal         📌  ║
║ Private                       ║
║ Solo para ti                  ║
╚═══════════════════════════════╝

╔═══════════════════════════════╗  ← DOMAIN-LEVEL (always)
║ 🏢 Ally Team             📌  ║
║ Shared                        ║
║ Ayuda y soporte               ║
╚═══════════════════════════════╝
─────────────────────────────────
  M001 - Legal
  S001 - Warehouse
```

**When to use which:**

**Use Personal Ally for:**
- Private notes and drafts
- Personal productivity questions
- Sensitive topics
- Personal preferences

**Use Team Ally for:**
- Feature feedback
- Bug reports
- NPS/CSAT ratings
- Support questions
- Learning platform features

---

### Admin View (Domain Oversight)

```
GESTIÓN DE AGENTES → Ally

Tabs: [SuperPrompt] [Domain Ally] [CS Dashboard] [Compliance]

┌─────────────────────────────────────────────────────────────┐
│  🏢 Domain Ally - Customer Success Dashboard                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Domain: salfagestion.cl                                    │
│  Period: Last 30 days                                       │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ Active Users │ Avg NPS      │ Avg CSAT     │ At-Risk  │ │
│  │              │              │              │          │ │
│  │      50      │   92/100     │    4.2/5.0   │    2     │ │
│  │  (+5 vs LM)  │ (🎯 98)      │  (🎯 4.5)    │ (⚠️)     │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│                                                             │
│  📈 NPS Trend (Last 90 days)                                │
│  [Line chart: showing NPS over time, target line at 98]     │
│                                                             │
│  🐛 Active Issues (From Ally Conversations)                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔴 High Priority (3)                                   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ • M001 slow response (3 users) - Assigned to Tech     │ │
│  │ • Export feature not working (2 users) - In Progress  │ │
│  │ • Cannot share agent (1 user) - New                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  💡 Proactive Insights                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • 5 users asked "How to upload PDF?" → Doc gap         │ │
│  │ • Engagement dropping for: user1@, user2@             │ │
│  │ • M001 agent getting 15% more questions → Capacity?   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  👤 User-Level Summaries (Privacy-Safe)                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ User: sorellanac@salfagestion.cl                       │ │
│  │ NPS: 95 | CSAT: 4.5 | Risk: Low | Last active: 2h ago │ │
│  │                                                        │ │
│  │ Conversation Summary (Not full content):               │ │
│  │ • Asked about M001 usage (3 times this week)          │ │
│  │ • Requested Excel export feature                       │ │
│  │ • Reported slow loading (resolved)                     │ │
│  │                                                        │ │
│  │ Recommendations:                                        │ │
│  │ ✅ User is engaged and satisfied                       │ │
│  │ 💡 Consider M001 training for this user               │ │
│  │                                                        │ │
│  │ [Contact User] [View Timeline]                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Export CS Report] [Schedule Weekly Review] [Download NPS]│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 ADMIN CAPABILITIES

### What Admins CAN See (Domain-Level Ally)

✅ **Aggregated Metrics:**
- NPS scores over time
- CSAT scores over time
- Bug report summaries
- Feature request summaries
- Engagement metrics
- At-risk user identification

✅ **Conversation Summaries:**
- Topics discussed (not full content)
- Issues reported (bugs, features)
- Questions asked (FAQ candidates)
- Agent usage patterns

✅ **Proactive Insights:**
- Users with declining engagement
- Repeated issues across users
- Documentation gaps
- Training opportunities

✅ **Compliance Data:**
- Conversation counts per user
- Response times
- Resolution rates
- Admin review status

### What Admins CANNOT See (User-Level Ally)

❌ **Private Content:**
- Full conversation text (user-level)
- Personal notes
- Private questions
- Draft messages
- Personal preferences

❌ **Individual Messages:**
- Exact wording of questions (domain-level - only summaries)
- Specific user inputs (user-level)
- Private feedback

---

## 🎯 CUSTOMER SUCCESS WORKFLOW

### Proactive Issue Resolution

```
1. User chats with Domain Ally
   ↓
2. Ally auto-categorizes message
   - Bug report? → Tag + route to tech team
   - Feature request? → Tag + add to roadmap
   - NPS < 7? → Alert admin immediately
   - CSAT < 3? → Flag for follow-up
   ↓
3. Ally conversation indexed
   - Sentiment analysis (positive/neutral/negative)
   - Urgency detection (low/medium/high/critical)
   - Topic extraction
   ↓
4. Admin dashboard updated in real-time
   - New bug report appears
   - NPS score updates
   - At-risk user list updates
   ↓
5. Admin takes action
   - Reviews issue
   - Contacts user
   - Resolves problem
   - Marks resolved in dashboard
   ↓
6. Next Ally conversation
   - Admin can see: "Issue resolved on Nov 15"
   - User can see: "We fixed the problem you reported!"
   ↓
7. NPS/CSAT improves
   - Track resolution impact
   - Measure before/after scores
   - Achieve 98+ NPS, 4.5+ CSAT
```

---

## 📊 METRICS & TARGETS

### Platform-Wide Targets

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **NPS** | 92 | 98+ | +6 points |
| **CSAT** | 4.2/5 | 4.5/5 | +0.3 points |
| **Bug resolution time** | 48h | 24h | -50% |
| **Feature request acknowledgment** | 5 days | 1 day | -80% |
| **At-risk user intervention** | Reactive | Proactive | 100% change |

### Per-Domain Dashboards

**Each domain tracks:**
- NPS trend (daily, weekly, monthly)
- CSAT trend
- Bug report status (open, in-progress, resolved)
- Feature request backlog
- User engagement scores
- At-risk user count

**Alerts triggered when:**
- NPS < 80 (any user)
- CSAT < 3 (any conversation)
- Same bug reported 3+ times
- User engagement drops 20%+
- Critical urgency detected

---

## 🔄 IMPLEMENTATION (Updated)

### Database Changes

```typescript
// When creating Ally, specify privacy level

// User-Level Ally (opt-in)
{
  isAlly: true,
  isPinned: true,
  allyPrivacyLevel: 'user',
  userEmail: 'alec@getaifactory.com',
  userOptIn: true,
  userOptInAt: new Date(),
  title: 'Ally (Personal)',
  // ... admins CANNOT access
}

// Domain-Level Ally (always created)
{
  isAlly: true,
  isPinned: true,
  allyPrivacyLevel: 'domain',
  domainId: 'getaifactory.com',
  adminAccessible: true,
  title: 'Ally (Team)',
  csMetrics: {
    npsScore: null,          // Will be updated
    csatScore: null,
    bugReportsCount: 0,
    featureRequestsCount: 0,
    engagementScore: 100,
  },
  // ... admins CAN access summaries
}
```

---

### Message Auto-Categorization

```typescript
// When user sends message to Domain Ally
async function categorizeMessage(messageText: string): Promise<{
  category: string;
  sentiment: string;
  urgency: string;
  tags: string[];
}> {
  
  const text = messageText.toLowerCase();
  
  // Detect category
  let category = 'question';
  if (text.includes('bug') || text.includes('error') || text.includes('no funciona')) {
    category = 'bug';
  } else if (text.includes('feature') || text.includes('sería útil') || text.includes('me gustaría')) {
    category = 'feature-request';
  } else if (text.includes('nps:') || text.includes('calificar')) {
    category = 'nps';
  } else if (text.includes('csat:') || text.includes('satisfacción')) {
    category = 'csat';
  }
  
  // Detect sentiment
  let sentiment = 'neutral';
  const positiveWords = ['excelente', 'genial', 'perfecto', 'gracias', 'funciona bien'];
  const negativeWords = ['mal', 'lento', 'no funciona', 'problema', 'frustrado'];
  
  if (positiveWords.some(word => text.includes(word))) {
    sentiment = 'positive';
  } else if (negativeWords.some(word => text.includes(word))) {
    sentiment = 'negative';
  }
  
  // Detect urgency
  let urgency = 'low';
  if (text.includes('urgente') || text.includes('crítico') || text.includes('inmediatamente')) {
    urgency = 'critical';
  } else if (text.includes('pronto') || text.includes('importante')) {
    urgency = 'high';
  }
  
  // Extract tags
  const tags: string[] = [];
  if (text.includes('m001')) tags.push('agent-m001');
  if (text.includes('s001')) tags.push('agent-s001');
  if (text.includes('lento')) tags.push('performance');
  if (text.includes('export')) tags.push('export');
  
  return { category, sentiment, urgency, tags };
}
```

---

This is a comprehensive dual-level system. Should I continue implementing this or would you like to review the design first?

The key insight is:
- **User-level Ally** = Private productivity (user controls)
- **Domain-level Ally** = Customer success oversight (admin monitors for NPS/CSAT)

This balances privacy with the admin's need to ensure customer success. Continue? 🚀

