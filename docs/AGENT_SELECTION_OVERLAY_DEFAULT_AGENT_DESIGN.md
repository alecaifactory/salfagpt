# Agent Selection Overlay & Default Agent System - Complete Design

**Date:** November 16, 2025  
**Status:** 🎨 Design Phase  
**Version:** 1.0.0

---

## 🎯 Objective

Implement an intuitive agent selection system with:
1. **Overlay UI** when no agent selected (prevents typing without context)
2. **3 Available Agents** displayed as cards (personalized recommendations)
3. **Default Agent** option ("New Conversation" - org/domain/user scoped)
4. **Public Domain Agents** (one per domain, domain-private visibility)
5. **User Memory** for Default Agent personalization
6. **Role-Based Experiences** (SuperAdmin, Admin, User, Supervisor, Expert, Evaluator)

---

## 📊 BEFORE vs AFTER Comparison

### User Experience Flow

#### ❌ BEFORE:
```
User opens chat
  ↓
Empty chat interface
  ↓
User can type message (no agent selected!)
  ↓
Unclear behavior - which agent responds?
  ↓
Potential errors or confusion
```

#### ✅ AFTER:
```
User opens chat
  ↓
Overlay appears with:
  - 3 Recommended Agents (personalized)
  - Default Agent option (New Conversation)
  ↓
User selects agent or default
  ↓
Overlay disappears
  ↓
Chat ready with proper context
  ↓
User can start typing (agent is set!)
```

---

## 🏗️ DATA SCHEMA CHANGES

### 1. Conversation Schema (EXTENDED - Additive Only)

#### BEFORE:
```typescript
interface Conversation {
  id: string;
  userId: string;
  title: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  contextWindowUsage: number;
  agentModel: string;
  activeContextSourceIds?: string[];
  status?: 'active' | 'archived';
  isAgent?: boolean;
  agentId?: string;
  hasBeenRenamed?: boolean;
  isShared?: boolean;
  sharedAccessLevel?: 'view' | 'edit' | 'admin';
  organizationId?: string;
  version?: number;
  // ... versioning fields
}
```

#### AFTER (Additive Extensions):
```typescript
interface Conversation {
  // ... ALL existing fields preserved ...
  
  // 🆕 DEFAULT AGENT FIELDS
  isDefaultAgent?: boolean;            // True if this is the org/domain/user default agent
  defaultAgentScope?: 'organization' | 'domain' | 'user'; // Scope of default agent
  userMemoryEnabled?: boolean;         // Track if user memory is enabled
  userMemoryProfile?: {                // Learned user preferences
    preferredModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    commonTopics?: string[];           // Topics user asks about
    communicationStyle?: string;       // Formal, casual, technical, etc.
    preferredLanguage?: string;        // User's preferred language
    timezone?: string;                 // For time-aware responses
    lastInteractionAt?: Date;          // Last use of default agent
    totalInteractions?: number;        // Count of conversations
  };
  
  // 🆕 PUBLIC AGENT FIELDS (Domain-Private)
  isDomainPublicAgent?: boolean;       // True if this is the domain's public agent
  domainId?: string;                   // Domain this public agent belongs to
  publicAgentVisibility?: 'domain' | 'organization'; // Who can see it
  
  // 🆕 RECOMMENDATION FIELDS
  recommendationScore?: number;        // 0-100, for agent suggestions
  lastRecommendedAt?: Date;           // When this was last recommended
  recommendationReasons?: string[];    // Why recommended: ['recent_use', 'high_rating', 'popular']
  
  // 🆕 USAGE ANALYTICS (for recommendations)
  usageStats?: {
    totalUses?: number;                // How many times used
    uniqueUsers?: number;              // How many different users
    averageRating?: number;            // 0-5 stars
    lastUsedAt?: Date;                 // Most recent use
    weeklyActiveUsers?: number;        // MAU proxy
  };
}
```

**Migration Strategy:** All new fields are optional (`?`), ensuring backward compatibility. Existing conversations continue working without any changes.

---

### 2. Organization Schema (EXTENDED)

#### BEFORE:
```typescript
interface Organization {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  source?: DataSource;
}
```

#### AFTER:
```typescript
interface Organization {
  // ... existing fields ...
  
  // 🆕 DEFAULT AGENT CONFIGURATION
  defaultAgentConfig?: {
    enabled: boolean;                  // Enable default agent for org
    systemPrompt?: string;             // Org-level default prompt
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    contextSourceIds?: string[];       // Default context sources
    userMemoryEnabled?: boolean;       // Enable user memory tracking
    conversationHistoryLimit?: number; // Max messages to remember (default: 50)
  };
  
  // 🆕 AGENT RECOMMENDATION SETTINGS
  recommendationConfig?: {
    enabled: boolean;                  // Enable agent recommendations
    algorithmType?: 'usage' | 'collaborative' | 'hybrid'; // Recommendation algorithm
    maxRecommendations?: number;       // How many to show (default: 3)
    personalizedByUser?: boolean;      // Personalize per user
    personalizedByDomain?: boolean;    // Personalize per domain
  };
}
```

---

### 3. Domain Schema (EXTENDED)

#### BEFORE:
```typescript
interface Domain {
  id: string;
  name: string;
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  allowedAgents: string[];
  allowedContextSources: string[];
  domainPrompt?: string;
  userCount?: number;
  description?: string;
  settings?: DomainSettings;
  companyInfo?: DomainCompanyInfo;
}
```

#### AFTER:
```typescript
interface Domain {
  // ... existing fields ...
  
  // 🆕 PUBLIC AGENT (One per domain)
  publicAgentId?: string;              // ID of the domain's public agent
  publicAgentConfig?: {
    title: string;                     // e.g., "Salfa Corp Assistant"
    description?: string;              // What this agent does
    systemPrompt?: string;             // Domain-specific prompt
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    contextSourceIds?: string[];       // Domain-wide context
    icon?: string;                     // Custom icon/avatar
    tags?: string[];                   // ['official', 'general', 'support']
  };
  
  // 🆕 DEFAULT AGENT SETTINGS
  domainDefaultAgentConfig?: {
    enabled: boolean;                  // Allow default agent in this domain
    inheritOrgPrompt: boolean;         // Combine with org prompt
    customPrompt?: string;             // Domain-specific additions
  };
}
```

---

### 4. User Schema (EXTENDED)

#### BEFORE:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  domain: string;
  organizationId?: string;
  createdAt: Date;
  // ... other fields
}
```

#### AFTER:
```typescript
interface User {
  // ... existing fields ...
  
  // 🆕 DEFAULT AGENT PREFERENCES
  defaultAgentPreferences?: {
    useDefaultAgent: boolean;          // User opted into default agent
    customSystemPrompt?: string;       // User-specific customizations
    preferredModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    autoSelectLastUsedAgent?: boolean; // Auto-select last agent instead of overlay
  };
  
  // 🆕 AGENT RECOMMENDATIONS
  agentRecommendations?: {
    lastCalculatedAt?: Date;           // When recommendations were last updated
    topAgents?: Array<{                // Cached top 3 agents for this user
      agentId: string;
      score: number;
      reasons: string[];
    }>;
  };
}
```

---

## 🎨 UI COMPONENTS

### Component 1: AgentSelectionOverlay

**New Component:** `src/components/AgentSelectionOverlay.tsx`

```typescript
interface AgentSelectionOverlayProps {
  userId: string;
  userEmail: string;
  userDomain: string;
  organizationId?: string;
  userRole: UserRole;
  
  // Available agents to show
  recommendedAgents: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    model: string;
    tags?: string[];
    usageCount?: number;
    lastUsedAt?: Date;
    recommendationScore?: number;
  }>;
  
  // Default agent option
  defaultAgent?: {
    title: string;
    description: string;
    systemPrompt: string;
    model: string;
  };
  
  // Public domain agent
  domainPublicAgent?: {
    id: string;
    title: string;
    description: string;
    icon?: string;
  };
  
  // Callbacks
  onSelectAgent: (agentId: string) => Promise<void>;
  onSelectDefaultAgent: () => Promise<void>;
  onDismiss?: () => void;
}
```

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                   OVERLAY (semi-transparent)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         🤖 Select an Agent to Get Started            │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  │ 🏢 M001      │  │ 📦 S001      │  │ ⚠️  SSOMA     │ │
│  │  │ Legal Asst.  │  │ Warehouse    │  │ Safety       │ │
│  │  │              │  │ Management   │  │ Expert       │ │
│  │  │ Used 15x     │  │ Used 8x      │  │ Used 3x      │ │
│  │  │ [Select]     │  │ [Select]     │  │ [Select]     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────────┐ │
│  │  │ ✨ New Conversation (Default Agent)             │ │
│  │  │                                                  │ │
│  │  │ General purpose assistant with your org context │ │
│  │  │ Learns from your interactions                   │ │
│  │  │                                                  │ │
│  │  │ [Start New Conversation]                         │ │
│  │  └──────────────────────────────────────────────────┘ │
│  │                                                      │  │
│  │  📚 View All Agents (127 available)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Component 2: DefaultAgentManager

**New Service:** `src/lib/default-agent.ts`

```typescript
/**
 * Default Agent Manager
 * 
 * Handles creation and management of default agents at org/domain/user level
 */

export interface DefaultAgentConfig {
  scope: 'organization' | 'domain' | 'user';
  userId: string;
  userEmail: string;
  domain: string;
  organizationId?: string;
  
  // Configuration
  systemPrompt?: string;
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  contextSourceIds?: string[];
  userMemoryEnabled?: boolean;
}

export async function getOrCreateDefaultAgent(
  config: DefaultAgentConfig
): Promise<string> {
  // Implementation
}

export async function updateUserMemoryProfile(
  userId: string,
  updates: Partial<UserMemoryProfile>
): Promise<void> {
  // Implementation
}

export async function getAgentRecommendations(
  userId: string,
  domain: string,
  limit?: number
): Promise<AgentRecommendation[]> {
  // Implementation
}
```

---

## 🔒 ROLE-BASED EXPERIENCES

### SuperAdmin Experience

**What They See:**

```
┌─────────────────────────────────────────────────────────────┐
│                   🔧 SuperAdmin View                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Select an Agent (All Organizations)          │  │
│  │                                                      │  │
│  │  Recommended for You (Any Org):                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  │ M001 (Salfa) │  │ S001 (Salfa) │  │ TestAgent    │ │
│  │  │ [Select]     │  │ [Select]     │  │ [Select]     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │
│  │                                                      │  │
│  │  🏢 Organization Defaults:                           │  │
│  │  - Salfa Corp Default Agent                          │  │
│  │  - GetAI Factory Default Agent                       │  │
│  │  - [Any Org] Default Agent                           │  │
│  │                                                      │  │
│  │  ✨ Personal Default Agent                           │  │
│  │  (Your superadmin assistant with cross-org context)  │  │
│  │  [Start Conversation]                                │  │
│  │                                                      │  │
│  │  📊 View All Agents (All Orgs: 500+)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✅ See agents from ALL organizations
- ✅ Access ANY default agent (org/domain/user level)
- ✅ Impersonate users to test their agent selection
- ✅ Configure default agent settings globally
- ✅ View all public domain agents across orgs
- ✅ Create/edit/delete any agent

---

### Admin Experience

**What They See:**

```
┌─────────────────────────────────────────────────────────────┐
│                   🏢 Admin View (Salfa Corp)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Select an Agent (Your Organization)          │  │
│  │                                                      │  │
│  │  Recommended for You (Salfa Corp):                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  │ M001         │  │ S001         │  │ SSOMA        │ │
│  │  │ [Select]     │  │ [Select]     │  │ [Select]     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │
│  │                                                      │  │
│  │  🌐 Domain Public Agents:                            │  │
│  │  - salfagestion.cl Official Agent                    │  │
│  │  - maqsa.cl Operations Agent                         │  │
│  │  - salfa.cl Construction Agent                       │  │
│  │                                                      │  │
│  │  ✨ Salfa Corp Default Agent                         │  │
│  │  (Organization-wide assistant)                       │  │
│  │  [Start Conversation]                                │  │
│  │                                                      │  │
│  │  📊 View All Agents (Salfa Corp: 127)                │  │
│  │  🔧 Configure Default Agent Settings                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✅ See all agents in their organization
- ✅ Access organization default agent
- ✅ Access all domain public agents in their org
- ✅ Configure org-level default agent settings
- ✅ Manage public agents for their domains
- ✅ View analytics for default agent usage
- ❌ Cannot see agents from other organizations

---

### User Experience (Regular User)

**What They See:**

```
┌─────────────────────────────────────────────────────────────┐
│                   💬 User View (@salfagestion.cl)           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Select an Agent to Get Started               │  │
│  │                                                      │  │
│  │  Recommended for You:                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  │ M001         │  │ S001         │  │ Cartola      │ │
│  │  │ Legal Asst.  │  │ Warehouse    │  │ Finance      │ │
│  │  │ Used 15x ⭐  │  │ Used 8x      │  │ Used 5x      │ │
│  │  │ [Select]     │  │ [Select]     │  │ [Select]     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │
│  │                                                      │  │
│  │  🌐 Salfa Gestion Assistant                          │  │
│  │  Your domain's official assistant                    │  │
│  │  [Select]                                            │  │
│  │                                                      │  │
│  │  ✨ New Conversation                                 │  │
│  │  General purpose assistant with your context         │  │
│  │  Remembers your preferences and topics               │  │
│  │  [Start New Conversation]                            │  │
│  │                                                      │  │
│  │  📚 View All Available Agents (45 available)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✅ See agents shared with them
- ✅ See agents shared with their domain
- ✅ See public agents for their domain
- ✅ Access user-scoped default agent (learns from their usage)
- ✅ Access domain default agent
- ✅ Access organization default agent (fallback)
- ✅ Personalized recommendations based on usage
- ❌ Cannot see private agents from other users
- ❌ Cannot see agents from other domains (unless shared)

---

### Supervisor Experience

**What They See:**

```
┌─────────────────────────────────────────────────────────────┐
│                   👁️ Supervisor View (@salfagestion.cl)     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Select an Agent (Review Context)             │  │
│  │                                                      │  │
│  │  🎯 Agents Under Review:                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  │ M001 v2.1    │  │ S002 Draft   │  │ SSOMA L2 📝  │ │
│  │  │ In Review    │  │ Needs Approval│ │ Pending     │ │
│  │  │ [Review]     │  │ [Review]     │  │ [Review]     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │
│  │                                                      │  │
│  │  ✅ Approved Agents (Recent):                        │  │
│  │  - M001 v2.0 (✓ Approved Nov 10)                     │  │
│  │  - Cartola v1.5 (✓ Approved Nov 8)                   │  │
│  │                                                      │  │
│  │  ✨ Supervisor Default Agent                         │  │
│  │  (Review and evaluation assistant)                   │  │
│  │  [Start Conversation]                                │  │
│  │                                                      │  │
│  │  📊 View All Agents for Review (12 pending)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✅ See all agents in review queue for their domain
- ✅ See all agents they supervise
- ✅ Access supervisor-specific default agent
- ✅ View agent evaluation history
- ✅ Personalized recommendations for review tasks
- ✅ See domain public agents
- ❌ Cannot see agents outside their supervision scope

---

### Expert/Evaluator Experience

**What They See:**

```
┌─────────────────────────────────────────────────────────────┐
│                   🎓 Expert View (@salfagestion.cl)         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Select an Agent (Expert Context)             │  │
│  │                                                      │  │
│  │  🔬 Agents to Evaluate:                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  │ M001 v2.1    │  │ SSOMA Draft  │  │ S003 Update  │ │
│  │  │ Awaiting     │  │ Assigned to  │  │ Requested    │ │
│  │  │ Feedback     │  │ You 🎯       │  │ Review       │ │
│  │  │ [Evaluate]   │  │ [Evaluate]   │  │ [Evaluate]   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │
│  │                                                      │  │
│  │  ⭐ Your Expert Contributions:                       │  │
│  │  - M001 v2.0 (✓ Certified Nov 10)                    │  │
│  │  - Cartola v1.5 (✓ Certified Nov 8)                  │  │
│  │  - S001 v3.2 (📝 In Progress)                        │  │
│  │                                                      │  │
│  │  ✨ Expert Default Agent                             │  │
│  │  (Evaluation and certification assistant)            │  │
│  │  [Start Conversation]                                │  │
│  │                                                      │  │
│  │  📊 View All Agents for Evaluation (8 pending)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✅ See agents assigned for evaluation
- ✅ See agents they've certified
- ✅ Access expert-specific default agent
- ✅ View evaluation queue
- ✅ Personalized recommendations based on expertise
- ✅ See domain public agents
- ❌ Cannot see agents not assigned to them

---

## 🔄 IMPLEMENTATION PHASES

### Phase 1: Data Schema Extensions (Week 1)

**Tasks:**
1. ✅ Extend `Conversation` interface with default agent fields
2. ✅ Extend `Organization` interface with default agent config
3. ✅ Extend `Domain` interface with public agent config
4. ✅ Extend `User` interface with preferences
5. ✅ Create migration script (optional fields, no breaking changes)
6. ✅ Update Firestore security rules for new fields

**Deliverables:**
- Updated TypeScript interfaces
- Migration documentation
- Firestore rules updated
- Backward compatibility verified

---

### Phase 2: Default Agent Manager Service (Week 1-2)

**Tasks:**
1. ✅ Create `src/lib/default-agent.ts`
2. ✅ Implement `getOrCreateDefaultAgent()`
3. ✅ Implement `updateUserMemoryProfile()`
4. ✅ Implement `getAgentRecommendations()`
5. ✅ Create API endpoints:
   - `POST /api/default-agent` - Get or create default agent
   - `GET /api/agent-recommendations` - Get personalized recommendations
   - `PATCH /api/users/[id]/memory` - Update user memory profile

**Deliverables:**
- Default agent service library
- API endpoints functional
- Unit tests written
- Documentation complete

---

### Phase 3: Public Domain Agents (Week 2)

**Tasks:**
1. ✅ Create `src/lib/domain-public-agent.ts`
2. ✅ Implement domain public agent creation
3. ✅ Add domain admin UI for configuring public agent
4. ✅ Update agent visibility logic to show public agents
5. ✅ Create API endpoints:
   - `POST /api/domains/[id]/public-agent` - Create/update public agent
   - `GET /api/domains/[id]/public-agent` - Get public agent

**Deliverables:**
- Public agent per domain functional
- Admin UI for configuration
- Visibility rules enforced
- Documentation complete

---

### Phase 4: Agent Recommendation Engine (Week 2-3)

**Tasks:**
1. ✅ Create `src/lib/agent-recommendations.ts`
2. ✅ Implement usage-based algorithm
3. ✅ Implement collaborative filtering (optional)
4. ✅ Add caching for performance
5. ✅ Create background job to update recommendations daily
6. ✅ Add analytics tracking for recommendation clicks

**Deliverables:**
- Recommendation algorithm functional
- Performance optimized (cached)
- Analytics tracked
- Documentation complete

---

### Phase 5: Agent Selection Overlay UI (Week 3)

**Tasks:**
1. ✅ Create `src/components/AgentSelectionOverlay.tsx`
2. ✅ Design responsive card layout
3. ✅ Implement agent selection logic
4. ✅ Add default agent option
5. ✅ Add domain public agent display
6. ✅ Integrate with `ChatInterfaceWorking.tsx`
7. ✅ Add keyboard navigation (Esc to dismiss, Enter to select)
8. ✅ Add animations (fade in/out)

**Deliverables:**
- AgentSelectionOverlay component complete
- Responsive design verified
- Accessibility tested
- Animations smooth

---

### Phase 6: Role-Based Experiences (Week 3-4)

**Tasks:**
1. ✅ Implement SuperAdmin view logic
2. ✅ Implement Admin view logic
3. ✅ Implement User view logic
4. ✅ Implement Supervisor view logic
5. ✅ Implement Expert view logic
6. ✅ Create role-specific recommendation filters
7. ✅ Test each role thoroughly

**Deliverables:**
- All 5 role experiences functional
- Agent visibility correct per role
- Recommendations personalized per role
- Documentation with examples

---

### Phase 7: User Memory System (Week 4)

**Tasks:**
1. ✅ Implement user memory tracking
2. ✅ Create memory profile updates on each conversation
3. ✅ Add user preferences UI
4. ✅ Implement privacy controls (opt-out)
5. ✅ Add memory profile visualization
6. ✅ Test personalization effectiveness

**Deliverables:**
- User memory tracking functional
- Privacy controls in place
- Personalization working
- Documentation complete

---

### Phase 8: Testing & Refinement (Week 4-5)

**Tasks:**
1. ✅ Unit tests for all new services
2. ✅ Integration tests for API endpoints
3. ✅ E2E tests for overlay UI
4. ✅ Performance testing (overlay load time < 500ms)
5. ✅ Security testing (role permissions)
6. ✅ Accessibility testing
7. ✅ User acceptance testing

**Deliverables:**
- Test coverage > 80%
- All tests passing
- Performance targets met
- Security verified
- Accessibility compliant (WCAG 2.1 AA)

---

### Phase 9: Documentation & Training (Week 5)

**Tasks:**
1. ✅ Complete user documentation
2. ✅ Create admin guide for default agent config
3. ✅ Create video tutorials
4. ✅ Update help center
5. ✅ Create changelog entry
6. ✅ Prepare internal training materials

**Deliverables:**
- User documentation complete
- Admin guide published
- Training materials ready
- Help center updated

---

### Phase 10: Production Deployment (Week 5)

**Tasks:**
1. ✅ Deploy to staging environment
2. ✅ Run smoke tests
3. ✅ Monitor performance metrics
4. ✅ Deploy to production (phased rollout)
5. ✅ Monitor error rates
6. ✅ Gather user feedback
7. ✅ Iterate based on feedback

**Deliverables:**
- Feature live in production
- Metrics monitored
- User feedback collected
- Iteration plan ready

---

## 📈 SUCCESS METRICS

### User Experience Metrics

**Primary Metrics:**
- **Overlay Interaction Rate:** % of users who interact with overlay vs dismiss
  - Target: > 80% interaction rate
- **Agent Selection Time:** Average time to select an agent
  - Target: < 5 seconds
- **Default Agent Usage:** % of new conversations using default agent
  - Target: 30-40% (indicates clear value)
- **Recommendation Click-Through:** % of recommended agents that get selected
  - Target: > 60% (indicates good recommendations)

**Secondary Metrics:**
- **User Satisfaction:** Post-selection survey score
  - Target: > 4.5/5
- **Return to Overlay:** How often users change their agent mid-session
  - Target: < 10% (indicates good first selection)
- **Memory Profile Accuracy:** User agreement with learned preferences
  - Target: > 80% accuracy

---

### Technical Performance Metrics

**Performance:**
- **Overlay Load Time:** Time from no-agent to overlay display
  - Target: < 500ms
- **Recommendation Calculation:** Time to generate 3 recommendations
  - Target: < 200ms (cached), < 2s (fresh)
- **Default Agent Creation:** Time to create/load default agent
  - Target: < 1s

**Reliability:**
- **Error Rate:** % of failed agent selections
  - Target: < 0.1%
- **Fallback Success:** When recommendations fail, overlay still shows
  - Target: 100% (graceful degradation)

---

### Business Impact Metrics

**Adoption:**
- **Feature Awareness:** % of users who see overlay at least once
  - Target: 100% (all new sessions)
- **Default Agent Adoption:** % of active users with default agent conversations
  - Target: > 50% within 30 days
- **Public Agent Usage:** % of users who try domain public agent
  - Target: > 30% within 30 days

**Engagement:**
- **Session Length:** Average session time after agent selection
  - Target: Increase by 20% vs baseline
- **Messages Per Session:** Average messages after agent selection
  - Target: Increase by 15% vs baseline
- **Agent Discovery:** # of unique agents tried per user
  - Target: Increase by 30% vs baseline

---

## 🔒 SECURITY & PRIVACY

### Security Considerations

**Agent Visibility:**
- ✅ Enforce role-based access control (RBAC) at database level
- ✅ Validate user permissions before showing agents in overlay
- ✅ Prevent direct API access to agents user shouldn't see
- ✅ Log all agent selection attempts for audit

**User Memory:**
- ✅ Encrypt user memory profiles at rest
- ✅ Allow users to opt-out of memory tracking
- ✅ Provide UI to view/edit/delete memory profile
- ✅ Auto-expire memory data after 90 days of inactivity

**Default Agent:**
- ✅ Isolate default agent conversations by user
- ✅ Prevent cross-user memory leakage
- ✅ Enforce domain boundaries (no cross-domain defaults)
- ✅ Audit log for all default agent config changes

---

### Privacy Requirements

**Data Minimization:**
- Only store necessary memory profile fields
- Aggregate data for recommendations (no raw messages)
- Delete inactive memory profiles after 90 days

**User Control:**
- ✅ Opt-out option in user settings
- ✅ View memory profile in settings
- ✅ Edit memory profile preferences
- ✅ Delete memory profile entirely
- ✅ Export memory profile data (GDPR compliance)

**Transparency:**
- ✅ Clear explanation of how memory works
- ✅ Show why each agent was recommended
- ✅ Explain what data is collected
- ✅ Privacy policy link in overlay

---

## 🎓 USER EDUCATION

### Onboarding Flow

**First-Time User:**

```
1. User logs in for first time
   ↓
2. Welcome tooltip appears:
   "Choose an agent to start chatting! We'll show you some recommendations."
   ↓
3. User sees overlay with:
   - 3 popular agents (global recommendations)
   - Default agent option (explained clearly)
   - "Learn more" link
   ↓
4. User selects agent
   ↓
5. Success tooltip:
   "Great! Next time, we'll personalize recommendations based on your usage."
   ↓
6. Overlay dismisses, chat ready
```

---

### Help Content

**In-Overlay Help:**

```
❓ What are these agents?

Each agent is a specialized AI assistant with unique knowledge and capabilities.

• M001: Legal & territorial regulations
• S001: Warehouse management & inventory
• SSOMA: Safety & occupational health

✨ New Conversation: General purpose assistant that learns from you

🌐 [Domain] Assistant: Your organization's official assistant

📚 View All: See all 127 available agents
```

**User Settings Help:**

```
🧠 User Memory

Your default agent learns from your conversations to provide better assistance:

• Preferred topics (e.g., "legal", "operations")
• Communication style (e.g., "formal", "technical")
• Common questions
• Preferred language

You can turn this off anytime in Settings > Privacy.
```

---

## 🚀 ROLLOUT PLAN

### Phased Rollout Strategy

**Phase 1: Internal Testing (Week 1)**
- Enable for 5 internal users (dev team)
- Gather feedback on UX
- Fix critical bugs
- Verify performance

**Phase 2: Beta Group (Week 2)**
- Enable for 20 beta users (power users)
- Monitor usage metrics
- Collect qualitative feedback
- Iterate on design

**Phase 3: Domain Rollout (Week 3)**
- Enable for one domain (@salfagestion.cl)
- Monitor error rates
- Adjust recommendation algorithm
- Optimize performance

**Phase 4: Organization Rollout (Week 4)**
- Enable for entire Salfa Corp organization
- Monitor at scale (100+ users)
- Fine-tune recommendations
- Address scalability issues

**Phase 5: General Availability (Week 5)**
- Enable for all users
- Announce feature publicly
- Publish documentation
- Offer training sessions

---

### Rollback Plan

**If Critical Issues Arise:**

1. **Disable Overlay (Soft Rollback)**
   ```typescript
   // Feature flag in environment
   ENABLE_AGENT_SELECTION_OVERLAY=false
   ```
   - Overlay hidden, users go directly to chat
   - Agents still selectable from sidebar
   - No data loss

2. **Revert to Previous Behavior (Hard Rollback)**
   ```bash
   git revert <commit-hash>
   gcloud run deploy --image <previous-image>
   ```
   - Complete rollback to pre-overlay version
   - Restore previous UI behavior
   - Maintain data integrity

3. **Hotfix Deployment**
   - Fix critical bug in < 2 hours
   - Deploy emergency patch
   - Monitor recovery

---

## 📝 ACCEPTANCE CRITERIA

### Functional Requirements

- [ ] Overlay appears when no agent is selected
- [ ] Overlay shows 3 recommended agents (personalized when possible)
- [ ] Overlay shows default agent option
- [ ] Overlay shows domain public agent (if exists)
- [ ] Agent selection creates/loads agent successfully
- [ ] Default agent inherits org/domain/user context
- [ ] User memory profiles update after each conversation
- [ ] Recommendations improve over time
- [ ] All roles see appropriate agents (RBAC enforced)
- [ ] Overlay dismisses after selection
- [ ] Keyboard navigation works (Esc, Tab, Enter)
- [ ] Animations are smooth (no jank)
- [ ] Performance targets met (< 500ms load)
- [ ] Error handling graceful (fallback to empty state)
- [ ] Mobile responsive design works

### Non-Functional Requirements

- [ ] Test coverage > 80%
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] Performance: Overlay load < 500ms
- [ ] Performance: Recommendation calc < 200ms (cached)
- [ ] Security: RBAC enforced at DB level
- [ ] Privacy: User memory opt-out functional
- [ ] Privacy: Memory profile viewable/editable/deletable
- [ ] Documentation: User guide complete
- [ ] Documentation: Admin guide complete
- [ ] Documentation: API docs complete

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 2 Enhancements (Post-Launch)

**Smart Agent Routing:**
- Analyze user message before showing overlay
- Pre-select best agent based on message content
- Example: "How do I return this item?" → Auto-suggest Return Policy Agent

**Voice-Based Selection:**
- "Hey Salfa, connect me with the legal assistant"
- Voice command to select agent

**Agent Search:**
- Search bar in overlay
- Fuzzy search by name, description, tags
- Auto-complete suggestions

**Agent Preview:**
- Hover over agent card to see preview
- Show sample questions
- Show context sources assigned

**Collaborative Filtering:**
- "Users like you also used these agents"
- Learn from similar users' choices
- Improve recommendations across organization

**Agent Ratings:**
- Users rate agents after conversation (1-5 stars)
- Show average ratings in overlay
- Use ratings to improve recommendations

**Recently Used Section:**
- Quick access to last 3 agents used
- One-click to resume last conversation

**Folders Integration:**
- Show agents organized by folder
- Filter by folder in overlay
- Create agent from template

---

## 📚 REFERENCES

**Related Documentation:**
- `docs/AGENT_CONVERSATION_ARCHITECTURE_2025-10-22.md` - Agent/chat architecture
- `docs/DOMAIN_SHARING_MODEL_2025-10-21.md` - Agent sharing model
- `.cursor/rules/agents.mdc` - Agent architecture rules
- `.cursor/rules/organizations.mdc` - Organization structure
- `.cursor/rules/userpersonas.mdc` - User roles and permissions

**API Endpoints:**
- `GET /api/conversations` - List user conversations/agents
- `POST /api/conversations` - Create new conversation/agent
- `GET /api/agent-recommendations` - Get personalized recommendations (NEW)
- `POST /api/default-agent` - Get or create default agent (NEW)
- `GET /api/domains/[id]/public-agent` - Get domain public agent (NEW)

**Libraries:**
- `src/lib/firestore.ts` - Firestore operations
- `src/lib/permissions.ts` - Role-based permissions
- `src/lib/domains.ts` - Domain management
- `src/lib/default-agent.ts` - Default agent manager (NEW)
- `src/lib/agent-recommendations.ts` - Recommendation engine (NEW)

---

**Version:** 1.0.0  
**Last Updated:** November 16, 2025  
**Status:** ✅ Design Complete - Ready for Implementation  
**Next Phase:** Implementation - Phase 1 (Data Schema Extensions)

