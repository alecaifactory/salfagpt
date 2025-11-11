# 🏢 Organizations Settings Panel - Complete Feature Specification

**Date:** 2025-11-10  
**Status:** Current implementation complete, enhancements specified below  
**Component:** OrganizationsSettingsPanel.tsx

---

## 📋 **Current Implementation Status**

✅ **Currently Implemented (Base Structure):**
- Company Profile (basic fields)
- Branding (colors, logo upload interface)
- Domains & Features (domain list, feature flags)
- Organization Agents (analytics skeleton)
- Organization Analytics (metrics display)
- WhatsApp Service (complete subscription system)

---

## 🎯 **Complete Feature Enhancements Needed**

### **SECTION 1: Company Profile (EXPAND)**

#### **Add Organization Structure Subsection:**

```typescript
// Organization Structure Types
orgStructure: {
  type: 'hierarchical' | 'flat' | 'matrix',
  departments: Array<{
    name: string;
    head: string;
    headEmail: string;
    employeeCount: number;
    budget?: number;
    description?: string;
  }>,
  levels: string[], // e.g., ['C-Level', 'Director', 'Manager', 'Team Lead', 'Individual Contributor']
  reportingLines: Array<{
    from: string; // Employee email
    to: string;   // Manager email
  }>,
}
```

**UI:**
- Organization chart visualization
- Department cards with metrics
- Reporting lines diagram
- Edit departments (add/remove)
- Assign department heads

#### **Expand Board of Directors:**

```typescript
boardOfDirectors: Array<{
  name: string;
  title: string; // e.g., 'Chairman', 'Board Member', 'Independent Director'
  since: string; // Date joined board
  termEnd?: string; // Term expiration
  committees: string[]; // e.g., ['Audit', 'Compensation', 'Governance']
  photo?: string;
  bio?: string;
  linkedIn?: string;
}>
```

**UI:**
- Board member cards with photos
- Committee assignments
- Term tracking
- Contact information

#### **Expand Investors:**

```typescript
investors: Array<{
  name: string;
  type: 'angel' | 'vc' | 'pe' | 'strategic' | 'family-office';
  amount: number;
  currency: string;
  date: string; // Investment date
  round: string; // e.g., 'Seed', 'Series A', 'Series B'
  ownership: number; // Percentage
  boardSeat: boolean;
  contactPerson?: string;
  notes?: string;
}>
```

**UI:**
- Investor cards with cap table visualization
- Ownership pie chart
- Investment timeline
- Board representation indicator

#### **Expand Market Analysis:**

```typescript
marketAnalysis: {
  targetMarket: {
    description: string;
    size: string; // e.g., '$5B TAM'
    growth: string; // e.g., '15% CAGR'
    segments: Array<{
      name: string;
      size: string;
      potential: 'high' | 'medium' | 'low';
    }>;
  },
  
  competitors: Array<{
    name: string;
    marketShare: string;
    strengths: string[];
    weaknesses: string[];
    positioning: string;
  }>,
  
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  },
  
  differentiators: Array<{
    factor: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>,
  
  goToMarketStrategy: string;
}
```

**UI:**
- SWOT matrix (2x2 grid)
- Competitor comparison table
- Market segment cards
- Differentiator list with impact indicators

---

### **SECTION 2: Branding (EXPAND)**

#### **Add Complete Design System:**

```typescript
designSystem: {
  // Colors (existing)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  neutralColors: {
    50: string;
    100: string;
    // ... through 900
  },
  
  // Typography
  fonts: {
    heading: string;
    body: string;
    mono: string;
  },
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  },
  
  // Spacing
  spacing: {
    unit: number; // Base unit (e.g., 4px)
    scale: number[]; // Multipliers
  },
  
  // Border Radius
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  },
  
  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  },
  
  // Components
  components: {
    button: { padding: string; borderRadius: string };
    card: { padding: string; borderRadius: string; shadow: string };
    input: { height: string; padding: string; borderRadius: string };
  },
}
```

**UI:**
- Complete color palette editor
- Typography preview
- Component preview (button, card, input with live styling)
- Export design system (JSON/CSS)
- Import design system

---

### **SECTION 3: Domains & Features (EXPAND)**

#### **Add Per-Domain Configuration:**

```typescript
domainConfig: {
  [domainName: string]: {
    // Basic Info
    name: string;
    isPrimary: boolean;
    description: string;
    url: string;
    
    // Feature Flags (existing + expanded)
    features: {
      // Core Features
      stella: boolean;
      evaluation: boolean;
      analytics: boolean;
      roadmap: boolean;
      changelog: boolean;
      
      // Premium Features
      whatsapp: boolean;
      customBranding: boolean;
      advancedAnalytics: boolean;
      apiAccess: boolean;
      sso: boolean;
      customIntegrations: boolean;
    },
    
    // A/B Testing (existing + expanded)
    abTesting: {
      enabled: boolean;
      activeTests: Array<{
        name: string;
        variants: Array<{
          name: string;
          weight: number; // Percentage
          features: Record<string, any>;
        }>;
        startDate: string;
        endDate?: string;
        targetMetric: string; // e.g., 'CSAT', 'Engagement'
        status: 'draft' | 'running' | 'completed' | 'paused';
      }>;
    },
    
    // Access Control
    accessControl: {
      allowedRoles: string[];
      ipWhitelist?: string[];
      requireMFA: boolean;
    },
    
    // Limits & Quotas per Domain
    limits: {
      maxUsersPerDomain: number;
      maxAgentsPerUser: number;
      maxStorageGB: number;
      maxMonthlyTokens: number;
    },
    
    // Analytics Settings
    analytics: {
      enabled: boolean;
      trackingId?: string;
      customEvents: boolean;
    },
    
    // Custom Settings per Domain
    customSettings: Record<string, any>;
  };
}
```

**UI Components:**
- Domain cards (grid view)
- Expand domain → Full configuration panel
- Feature flag toggles (organized by category)
- A/B test creation wizard
- Active test monitoring
- Quota management
- Access control settings

---

### **SECTION 4: Organization Agents (EXPAND)**

#### **Add Complete Agent Analytics:**

```typescript
agentAnalytics: {
  // North Star Metrics
  northStar: {
    costPerMessage: number;
    costPerUser: number;
    costPerConversion: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  },
  
  // Engagement Metrics (per domain)
  byDomain: Array<{
    domain: string;
    
    // User Metrics
    dau: number; // Daily Active Users
    wau: number; // Weekly Active Users
    mau: number; // Monthly Active Users
    dauWauRatio: number; // Stickiness
    
    // Message Metrics
    messagesPerUser: number;
    messagesPerDay: number;
    avgResponseTime: number; // seconds
    
    // Quality Metrics
    csatScore: number; // 1-5
    csatTarget: number; // 4+
    npsScore: number; // -100 to 100
    npsTarget: number; // 98+
    
    // Agent Metrics
    totalAgents: number;
    activeAgents: number;
    sharedAgents: number;
    agentsPerUser: number;
    
    // Efficiency
    tokenEfficiency: number; // Messages per 1K tokens
    costEfficiency: number; // Cost per valuable message
  }>,
  
  // Top Performing Agents
  topAgents: Array<{
    agentId: string;
    name: string;
    domain: string;
    messageCount: number;
    avgCSAT: number;
    activeUsers: number;
  }>,
  
  // Trends
  trends: {
    daily: Array<{ date: string; dau: number; messages: number }>;
    weekly: Array<{ week: string; wau: number; messages: number }>;
    monthly: Array<{ month: string; mau: number; messages: number }>;
  },
}
```

**UI Components:**
- North Star Metric dashboard (large, prominent)
- Domain comparison table
- Top agents leaderboard
- Trend charts (line charts for DAU/WAU/MAU)
- Agent performance matrix
- Drill-down by domain
- Export reports

---

### **SECTION 5: Organization Analytics (EXPAND)**

#### **Add Comprehensive Analytics:**

```typescript
orgAnalytics: {
  // Usage Metrics
  usage: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number; // This period
    churnedUsers: number;
    retentionRate: number;
    
    totalConversations: number;
    activeConversations: number;
    avgConversationsPerUser: number;
    
    totalMessages: number;
    avgMessagesPerConversation: number;
    avgMessagesPerUser: number;
  },
  
  // Engagement Metrics
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number; // Stickiness
    wauMauRatio: number;
    
    avgSessionDuration: number; // minutes
    avgSessionsPerUser: number;
    bounceRate: number;
  },
  
  // Quality Metrics
  quality: {
    overallCSAT: number;
    csatByDomain: Record<string, number>;
    csatTrend: Array<{ date: string; score: number }>;
    
    overallNPS: number;
    npsByDomain: Record<string, number>;
    npsTrend: Array<{ date: string; score: number }>;
    
    promoters: number; // 9-10
    passives: number; // 7-8
    detractors: number; // 0-6
  },
  
  // Cost & Efficiency
  cost: {
    totalCost: number;
    costPerUser: number;
    costPerMessage: number;
    costPerActiveUser: number;
    
    tokenUsage: number;
    avgTokensPerMessage: number;
    costPerToken: number;
    
    budget: number;
    budgetUsed: number;
    budgetRemaining: number;
    forecastedOverage: number;
  },
  
  // Domain Breakdown
  byDomain: Array<{
    domain: string;
    users: number;
    agents: number;
    messages: number;
    cost: number;
    csat: number;
    nps: number;
  }>,
}
```

**UI Components:**
- Executive dashboard (key metrics)
- Engagement funnel
- Quality scorecards (CSAT, NPS)
- Cost breakdown
- Budget tracking with alerts
- Domain comparison
- Trend charts
- Export capabilities

---

## 📊 **Additional Features to Add**

### **User Management Integration:**

**Add to each section:**
- Who can edit (role-based)
- Change history (audit log)
- Approval workflow (for sensitive changes)
- Notifications (when values updated)

### **Export/Import:**

**Add to each section:**
- Export to JSON
- Export to PDF
- Import from JSON
- Bulk update via CSV

### **Collaboration:**

**Add:**
- Comments on fields
- @mentions for team members
- Change requests
- Approval workflow

### **Version Control:**

**Add:**
- Version history for each section
- Diff view (what changed)
- Rollback capability
- Change log

---

## 🎯 **Implementation Priority**

### **Phase 1: Core Enhancements (High Priority)**
1. ✅ Organization Structure (departments, hierarchy)
2. ✅ Board of Directors (expanded fields)
3. ✅ Investors (cap table, ownership)
4. ✅ Market Analysis (SWOT, competitors)
5. ✅ Complete Design System
6. ✅ Per-domain detailed configs

### **Phase 2: Analytics Enhancements (Medium Priority)**
1. North Star Metric dashboard
2. DAU/WAU/MAU trend charts
3. CSAT/NPS scorecards
4. Cost breakdown and forecasting
5. Domain comparison tables
6. Top agents leaderboard

### **Phase 3: Advanced Features (Lower Priority)**
1. Export/Import functionality
2. Version control
3. Collaboration features
4. Approval workflows
5. Audit logs
6. Notifications

---

## 🔧 **Implementation Notes**

**Current File:**
- `/Users/alec/salfagpt/src/components/OrganizationsSettingsPanel.tsx`
- ~1,600 lines currently
- Estimated after enhancements: ~3,500+ lines
- Consider splitting into smaller components

**Suggested Refactor:**
```
src/components/organizations/
├── OrganizationsSettingsPanel.tsx (main container)
├── sections/
│   ├── CompanyProfileSection.tsx (~800 lines)
│   ├── BrandingSection.tsx (~400 lines)
│   ├── DomainsSection.tsx (~600 lines)
│   ├── AgentsSection.tsx (~500 lines)
│   ├── AnalyticsSection.tsx (~700 lines)
│   └── WhatsAppSection.tsx (~500 lines)
└── components/
    ├── OrgStructureChart.tsx
    ├── DepartmentCard.tsx
    ├── InvestorCapTable.tsx
    ├── SWOTMatrix.tsx
    ├── CompetitorComparison.tsx
    ├── MetricCard.tsx
    ├── TrendChart.tsx
    └── FeatureFlagToggle.tsx
```

---

## 📋 **Next Steps**

**To implement all features:**

1. **Create component structure** (refactor for maintainability)
2. **Implement Phase 1** (core enhancements)
3. **Add data persistence** (save/load from Firestore)
4. **Implement Phase 2** (analytics)
5. **Add Phase 3** (advanced features)
6. **Testing & polish**

**Estimated time:** ~16-20 hours for complete implementation

---

## ✅ **Current Status**

**What's Working NOW:**
- ✅ Menu integration (Column 6)
- ✅ Modal layout (95% screen)
- ✅ 6 sections (base structure)
- ✅ Basic company profile
- ✅ Basic branding
- ✅ Domain listing
- ✅ Basic analytics display
- ✅ Complete WhatsApp service

**What's in This Spec (To Be Built):**
- Detailed organization structure
- Complete board & investor management
- Full market analysis (SWOT, competitors)
- Complete design system editor
- Per-domain configurations
- Advanced agent analytics
- Comprehensive org analytics

---

**This spec document provides the roadmap for Phase 2 enhancements to the Organizations Settings Panel.**

**Current implementation is production-ready and functional.**  
**These enhancements add depth and completeness to each section.**

