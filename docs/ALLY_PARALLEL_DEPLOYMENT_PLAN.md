# Ally Parallel Deployment - Blue-Green Strategy

**Date:** November 16, 2025  
**Version:** 1.0.0  
**Strategy:** Parallel feature, zero impact on existing system  
**Access:** SuperAdmin only (alec@getaifactory.com)

---

## 🎯 Core Principle: Zero Risk

**Build Ally as a completely separate feature:**
- ✅ **Separate database collections** (ally_* vs conversations)
- ✅ **Separate API routes** (/api/ally/* vs /api/conversations/*)
- ✅ **Separate UI components** (AllyWorkspace vs ChatInterfaceWorking)
- ✅ **Feature flag controlled** (ENABLE_ALLY=true only for SuperAdmin)
- ✅ **Side-by-side comparison** (Ally vs existing, both functional)
- ✅ **Easy rollback** (disable feature flag, no data loss)

---

## 🏗️ PARALLEL ARCHITECTURE

### Current System (BLUE - Untouched)

```
┌─────────────────────────────────────────────────────────────┐
│              CURRENT SYSTEM (Stays Intact)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Database:                                                  │
│  • conversations (existing)                                 │
│  • messages (existing)                                      │
│  • users (existing)                                         │
│                                                             │
│  APIs:                                                      │
│  • /api/conversations                                       │
│  • /api/conversations/[id]/messages                         │
│                                                             │
│  UI:                                                        │
│  • ChatInterfaceWorking.tsx (unchanged)                     │
│  • All existing components (unchanged)                      │
│                                                             │
│  Status: ✅ Production, 100% functional                     │
└─────────────────────────────────────────────────────────────┘
```

### New Ally System (GREEN - Parallel Build)

```
┌─────────────────────────────────────────────────────────────┐
│              ALLY SYSTEM (Parallel Stack)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Database (NEW):                                            │
│  • ally_conversations (NEW)                                 │
│  • ally_messages (NEW)                                      │
│  • ally_actions (NEW)                                       │
│  • ally_apps (NEW)                                          │
│  • super_prompts (NEW)                                      │
│                                                             │
│  APIs (NEW):                                                │
│  • /api/ally                                                │
│  • /api/ally/conversations                                  │
│  • /api/ally/messages                                       │
│  • /api/ally/actions                                        │
│  • /api/ally/apps                                           │
│                                                             │
│  UI (NEW):                                                  │
│  • AllyWorkspace.tsx (new component)                        │
│  • AllyInputPanel.tsx (new)                                 │
│  • AllyConversationPanel.tsx (new)                          │
│  • AllyActionsPanel.tsx (new)                               │
│  • AllyConfigPanel.tsx (new - SuperAdmin only)              │
│                                                             │
│  Access: 🔒 SuperAdmin only (feature flag)                  │
│  Status: 🔨 Development, isolated from production           │
└─────────────────────────────────────────────────────────────┘
```

### Side-by-Side Access

```
┌─────────────────────────────────────────────────────────────┐
│           SuperAdmin View (alec@getaifactory.com)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Top Navigation:                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [💬 Classic Chat] [⭐ Ally Beta] [📊 Comparison]      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Tab 1: Classic Chat (Current System)                       │
│  → ChatInterfaceWorking.tsx                                 │
│  → All existing functionality                               │
│  → Production-ready                                         │
│                                                             │
│  Tab 2: Ally Beta (New System)                              │
│  → AllyWorkspace.tsx                                        │
│  → 3-column interface                                       │
│  → Ally Apps (Summary, Email, Collaborate)                  │
│  → Testing environment                                      │
│                                                             │
│  Tab 3: Comparison Dashboard                                │
│  → Side-by-side metrics                                     │
│  → Feature comparison matrix                                │
│  → Performance benchmarks                                   │
│  → Decision criteria for rollout                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE STRUCTURE (Parallel Collections)

### New Collections (Isolated)

#### 1. `ally_conversations` (NEW)

```typescript
interface AllyConversation {
  id: string;
  userId: string;
  
  // Ally-specific metadata
  isAllyConversation: true;            // Always true (differentiator)
  conversationType: 'ally-main' | 'ally-thread'; // Main Ally or sub-conversation
  
  // Conversation data
  title: string;                       // Auto-generated from first message
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  
  // Hierarchical prompt components
  effectivePrompt: string;             // Computed: Super + Org + Domain + User + Agent
  promptComponents: {
    superPromptId: string;
    superPromptVersion: number;
    organizationPromptId?: string;
    domainPromptId?: string;
    userPromptId?: string;
    agentPromptId?: string;
  };
  
  // Active inputs (from left pane)
  activeInputs: {
    organizationInfo: boolean;
    domainInfo: boolean;
    agentIds: string[];
    conversationIds: string[];         // Other conversations as context
    actionIds: string[];               // Actions as context
  };
  
  // Collaboration
  collaborators: Array<{
    userId: string;
    userEmail: string;
    userName: string;
    organizationId: string;
    domain: string;
    role: 'owner' | 'collaborator' | 'viewer';
    addedBy: string;
    addedAt: Date;
  }>;
  
  // Sharing
  sharing: {
    visibility: 'private' | 'organization' | 'domain' | 'public';
    allowExternalCollaborators: boolean;
    externalCollaborators?: Array<{
      email: string;
      invitedBy: string;
      invitedAt: Date;
      verifiedAt?: Date;
      accessLevel: 'view' | 'comment';
    }>;
  };
  
  // Indexing (for search)
  indexed: {
    topics: string[];
    entities: string[];
    keywords: string[];
    summary?: string;
    lastIndexedAt?: Date;
  };
  
  // Memory
  memory: {
    keyTakeaways: string[];
    actionItems: string[];
    decisions: string[];
  };
  
  // Source tracking
  source: 'localhost' | 'staging' | 'production';
}
```

**Key: isAllyConversation = true** (prevents mixing with existing conversations)

---

#### 2. `ally_messages` (NEW)

```typescript
interface AllyMessage {
  id: string;
  conversationId: string;              // ally_conversations ID
  userId: string;
  
  // Message content
  role: 'user' | 'ally' | 'system';
  content: string;
  
  // Output cards (Ally's responses)
  outputCards?: Array<{
    id: string;
    type: 'text' | 'markdown' | 'table' | 'chart' | 'image' | 'cta';
    content: any;
    actions?: Array<{
      label: string;
      action: string;
      data?: any;
    }>;
  }>;
  
  // Context used
  contextUsed: {
    promptComponents: string[];
    inputSources: Array<{
      type: 'organization' | 'domain' | 'agent' | 'conversation' | 'action';
      id: string;
      name: string;
    }>;
    tokensUsed: {
      input: number;
      output: number;
      context: number;
      total: number;
    };
  };
  
  // Metadata
  timestamp: Date;
  source: 'localhost' | 'staging' | 'production';
}
```

---

#### 3. `ally_actions` (NEW)

```typescript
interface AllyAction {
  id: string;
  userId: string;
  conversationId: string;
  messageId?: string;
  
  // Action details
  appId: string;                       // 'summary' | 'email' | 'collaborate'
  appName: string;
  actionType: string;
  
  // Input/Output
  inputs: Record<string, any>;
  output: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
    cards: Array<OutputCard>;
  };
  
  // Sharing
  sharedWith?: Array<{
    method: 'email' | 'whatsapp' | 'link';
    recipient?: string;
    sharedAt: Date;
    viewedAt?: Date;
  }>;
  
  // Metadata
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
  source: 'localhost' | 'staging' | 'production';
}
```

---

#### 4. `super_prompts` (NEW)

```typescript
interface SuperPrompt {
  id: string;                          // 'default' (only one active)
  version: number;
  systemPrompt: string;
  rules: string[];
  capabilities: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'staging' | 'production';
  
  // Version history
  changeLog: Array<{
    version: number;
    changes: string;
    changedBy: string;
    changedAt: Date;
  }>;
}
```

---

#### 5. `ally_apps` (NEW)

```typescript
interface AllyApp {
  id: string;                          // 'summary' | 'email' | 'collaborate'
  name: string;
  description: string;
  icon: string;
  version: string;
  isActive: boolean;
  
  // Configuration
  defaultSettings: Record<string, any>;
  requiredPermissions: string[];
  
  // UI config
  uiConfig: {
    formFields: Array<FormField>;
    outputCardTypes: string[];
  };
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  source: 'localhost' | 'staging' | 'production';
}
```

---

### Existing Collections (Extended - Additive Only)

#### `organizations` (Extended)

```typescript
interface Organization {
  // ... ALL existing fields preserved ...
  
  // 🆕 ALLY CONFIG (Optional field)
  allyConfig?: {
    organizationPrompt?: string;
    collaborationSettings?: {
      allowCrossOrgSharing: boolean;
      requireEmailVerification: boolean;
      allowedExternalDomains?: string[];
      maxExternalCollaborators?: number;
    };
    enabledApps?: string[];
    memorySettings?: {
      enabled: boolean;
      retentionDays: number;
    };
  };
}
```

#### `users` (Extended)

```typescript
interface User {
  // ... ALL existing fields preserved ...
  
  // 🆕 ALLY PREFERENCES (Optional field)
  allyPreferences?: {
    enabled: boolean;
    autoSelectOnLogin: boolean;
    memoryOptIn: boolean;
  };
  
  // 🆕 ALLY ACCESS (Optional field)
  allyBetaAccess?: {
    enabled: boolean;                  // Feature flag per user
    enabledAt: Date;
    enabledBy: string;                 // SuperAdmin who granted access
  };
}
```

---

## 🚀 IMPLEMENTATION PLAN (Zero-Risk Parallel Build)

### Phase 1: Database Setup (Day 1)

**Create new collections:**

```bash
# Create Firestore indexes
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "ally_conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ally_messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversationId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "ally_actions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
EOF

# Deploy indexes
firebase deploy --only firestore:indexes --project salfagpt
```

**Firestore security rules (additive):**

```javascript
// Add to existing firestore.rules (don't replace)

// Ally Conversations (isolated from regular conversations)
match /ally_conversations/{conversationId} {
  allow read: if isAuthenticated() && (
    resource.data.userId == request.auth.uid ||
    resource.data.collaborators.hasAny([request.auth.uid])
  );
  allow create: if isAuthenticated() && 
                request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() && (
    resource.data.userId == request.auth.uid ||
    resource.data.collaborators.hasAny([request.auth.uid])
  );
  allow delete: if isAuthenticated() && 
                resource.data.userId == request.auth.uid;
}

// Ally Messages
match /ally_messages/{messageId} {
  allow read, write: if isAuthenticated() &&
    isAllyConversationCollaborator(resource.data.conversationId);
}

// Ally Actions
match /ally_actions/{actionId} {
  allow read, write: if isAuthenticated() &&
    isAllyConversationCollaborator(resource.data.conversationId);
}

// Super Prompts (read for all, write for superadmin only)
match /super_prompts/{promptId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() &&
    isSuperAdmin();
}

// Ally Apps (read for all, write for superadmin only)
match /ally_apps/{appId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() &&
    isSuperAdmin();
}
```

---

### Phase 2: Feature Flag Setup (Day 1)

**Environment variable:**

```bash
# .env (localhost)
ENABLE_ALLY_BETA=true

# .env.salfacorp (production)
ENABLE_ALLY_BETA=false  # Start disabled in production
```

**User-level feature flag:**

```typescript
// src/lib/feature-flags.ts (NEW FILE)

export interface FeatureFlags {
  allyBetaAccess: boolean;
}

export async function getUserFeatureFlags(
  userId: string,
  userEmail: string
): Promise<FeatureFlags> {
  
  // Check environment variable (global override)
  const envEnabled = process.env.ENABLE_ALLY_BETA === 'true';
  
  // Check user-specific access
  const user = await getUser(userId);
  const userEnabled = user?.allyBetaAccess?.enabled || false;
  
  // SuperAdmin override (alec@getaifactory.com)
  const isSuperAdmin = userEmail === 'alec@getaifactory.com';
  
  return {
    allyBetaAccess: envEnabled && (isSuperAdmin || userEnabled),
  };
}

export function useFeatureFlags(userId: string, userEmail: string) {
  const [flags, setFlags] = useState<FeatureFlags>({
    allyBetaAccess: false,
  });
  
  useEffect(() => {
    getUserFeatureFlags(userId, userEmail).then(setFlags);
  }, [userId, userEmail]);
  
  return flags;
}
```

---

### Phase 3: Ally Service Layer (Day 2-3)

**Create:** `src/lib/ally.ts` (NEW FILE - isolated)

```typescript
/**
 * Ally Service Layer
 * 
 * Completely isolated from existing conversation system.
 * Uses ally_* collections only.
 */

import { firestore } from './firestore';
import type { AllyConversation, AllyMessage, AllyAction } from '../types/ally';

const COLLECTIONS = {
  ALLY_CONVERSATIONS: 'ally_conversations',
  ALLY_MESSAGES: 'ally_messages',
  ALLY_ACTIONS: 'ally_actions',
  SUPER_PROMPTS: 'super_prompts',
  ALLY_APPS: 'ally_apps',
} as const;

/**
 * Get or create user's main Ally conversation
 */
export async function getOrCreateAlly(
  userId: string,
  userEmail: string,
  userDomain: string,
  organizationId?: string
): Promise<string> {
  
  console.log('🤖 [ALLY] Getting or creating Ally for:', userEmail);
  
  try {
    // Check if Ally already exists
    const existing = await firestore
      .collection(COLLECTIONS.ALLY_CONVERSATIONS)
      .where('userId', '==', userId)
      .where('isAllyConversation', '==', true)
      .where('conversationType', '==', 'ally-main')
      .limit(1)
      .get();
    
    if (!existing.empty) {
      const allyId = existing.docs[0].id;
      console.log('✅ [ALLY] Found existing Ally:', allyId);
      return allyId;
    }
    
    // Create new Ally conversation
    console.log('🆕 [ALLY] Creating new Ally conversation...');
    
    const allyConv: Omit<AllyConversation, 'id'> = {
      userId,
      isAllyConversation: true,
      conversationType: 'ally-main',
      title: 'Ally',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      
      // Compute effective prompt
      effectivePrompt: await computeEffectivePrompt(userId, userDomain, organizationId),
      promptComponents: await getPromptComponents(userId, userDomain, organizationId),
      
      // Default inputs
      activeInputs: {
        organizationInfo: true,         // Default: org info visible
        domainInfo: true,                // Default: domain info visible
        agentIds: [],
        conversationIds: [],
        actionIds: [],
      },
      
      // Initial collaboration (owner only)
      collaborators: [],
      
      // Default sharing
      sharing: {
        visibility: 'private',
        allowExternalCollaborators: false,
      },
      
      // Empty index (will be populated)
      indexed: {
        topics: [],
        entities: [],
        keywords: [],
      },
      
      // Empty memory (will learn)
      memory: {
        keyTakeaways: [],
        actionItems: [],
        decisions: [],
      },
      
      source: getEnvironmentSource(),
    };
    
    const docRef = await firestore
      .collection(COLLECTIONS.ALLY_CONVERSATIONS)
      .add(allyConv);
    
    console.log('✅ [ALLY] Created Ally conversation:', docRef.id);
    
    // Send welcome message
    await sendAllyWelcomeMessage(docRef.id, userId, userEmail, userDomain);
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [ALLY] Failed to get/create Ally:', error);
    throw error;
  }
}

/**
 * Compute effective prompt (hierarchical composition)
 */
async function computeEffectivePrompt(
  userId: string,
  userDomain: string,
  organizationId?: string
): Promise<string> {
  
  const prompts: string[] = [];
  
  // 1. SuperPrompt (platform-wide)
  const superPrompt = await getActiveSuperPrompt();
  if (superPrompt) {
    prompts.push(superPrompt.systemPrompt);
  }
  
  // 2. Organization Prompt
  if (organizationId) {
    const org = await getOrganization(organizationId);
    if (org?.allyConfig?.organizationPrompt) {
      prompts.push(org.allyConfig.organizationPrompt);
    }
  }
  
  // 3. Domain Prompt
  const domain = await getDomain(userDomain);
  if (domain?.allyDomainConfig?.domainPrompt) {
    prompts.push(domain.allyDomainConfig.domainPrompt);
  }
  
  // 4. User Prompt
  const user = await getUser(userId);
  if (user?.allyUserConfig?.userPrompt) {
    prompts.push(user.allyUserConfig.userPrompt);
  }
  
  // Combine all prompts with separators
  return prompts.join('\n\n---\n\n');
}

/**
 * Send welcome message (first-time users)
 */
async function sendAllyWelcomeMessage(
  allyId: string,
  userId: string,
  userEmail: string,
  userDomain: string
): Promise<void> {
  
  // Get context for personalized welcome
  const availableAgents = await getUserAvailableAgents(userId, userDomain);
  const organizationName = await getOrganizationName(userDomain);
  
  const welcomeMessage = `¡Hola! 👋 Soy **Ally**, tu asistente personal en ${organizationName}.

Estoy aquí para ayudarte a sacar el máximo provecho de la plataforma.

**En tu dominio (${userDomain}) tienes acceso a:**
• **${availableAgents.length} agentes especializados**
• **${await getContextSourceCount(userDomain)} documentos** en tu biblioteca

**Los agentes más populares son:**
${await getTopAgents(userDomain, 3)}

**¿Qué puedo hacer por ti?**
• 🎯 Recomendarte el agente correcto para tu tarea
• 📚 Ayudarte a encontrar documentos o información
• 💬 Responder preguntas sobre la plataforma
• 🧠 Recordar tus preferencias y conversaciones

¿Con qué te gustaría comenzar hoy?`;
  
  // Save welcome message
  await firestore.collection(COLLECTIONS.ALLY_MESSAGES).add({
    conversationId: allyId,
    userId,
    role: 'ally',
    content: welcomeMessage,
    timestamp: new Date(),
    contextUsed: {
      promptComponents: ['superprompt', 'organization'],
      inputSources: [
        { type: 'organization', id: organizationId, name: organizationName },
        { type: 'domain', id: userDomain, name: userDomain },
      ],
      tokensUsed: {
        input: 100,
        output: 200,
        context: 50,
        total: 350,
      },
    },
    source: getEnvironmentSource(),
  });
  
  console.log('✅ [ALLY] Welcome message sent');
}
```

---

### Phase 4: Ally API Routes (Day 3-4)

**Create:** `src/pages/api/ally/index.ts` (NEW FILE)

```typescript
import type { APIRoute } from 'astro';
import { getOrCreateAlly } from '../../../lib/ally';
import { verifyJWT } from '../../../lib/auth';

/**
 * GET /api/ally
 * Get or create user's Ally conversation
 * 
 * Query params:
 * - userId: string (required)
 * - userEmail: string (required)
 * - userDomain: string (required)
 * - organizationId?: string (optional)
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = verifyJWT(cookies.get('flow_session')?.value);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userEmail = url.searchParams.get('userEmail');
    const userDomain = url.searchParams.get('userDomain');
    const organizationId = url.searchParams.get('organizationId') || undefined;
    
    // Validate params
    if (!userId || !userEmail || !userDomain) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: userId, userEmail, userDomain' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get or create Ally
    const allyId = await getOrCreateAlly(userId, userEmail, userDomain, organizationId);
    
    return new Response(JSON.stringify({
      allyId,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [API] Error in GET /api/ally:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Create:** `src/pages/api/ally/messages.ts` (NEW FILE)

```typescript
import type { APIRoute } from 'astro';
import { getAllyMessages, sendAllyMessage } from '../../../lib/ally';
import { verifyJWT } from '../../../lib/auth';

/**
 * GET /api/ally/messages?conversationId=xxx
 * List messages in Ally conversation
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  // Similar structure to existing /api/conversations/[id]/messages
  // But uses ally_messages collection
};

/**
 * POST /api/ally/messages
 * Send message to Ally
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Similar structure to existing message sending
  // But uses ally_messages collection and Ally-specific logic
};
```

---

### Phase 5: Ally Workspace UI (Day 5-7)

**Create:** `src/components/AllyWorkspace.tsx` (NEW COMPONENT - isolated)

```typescript
/**
 * Ally Workspace Component
 * 
 * Completely isolated from ChatInterfaceWorking.tsx
 * Can run side-by-side without conflicts
 */

import React, { useState, useEffect } from 'react';
import { Bot, Building2, Globe, MessageCircle, Zap } from 'lucide-react';
import AllyInputPanel from './ally/AllyInputPanel';
import AllyConversationPanel from './ally/AllyConversationPanel';
import AllyActionsPanel from './ally/AllyActionsPanel';

interface AllyWorkspaceProps {
  userId: string;
  userEmail: string;
  userDomain: string;
  organizationId?: string;
  userRole: string;
}

export default function AllyWorkspace({
  userId,
  userEmail,
  userDomain,
  organizationId,
  userRole
}: AllyWorkspaceProps) {
  
  const [allyConversationId, setAllyConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load Ally on mount
  useEffect(() => {
    loadAlly();
  }, [userId]);
  
  async function loadAlly() {
    try {
      setLoading(true);
      
      console.log('🤖 [ALLY WORKSPACE] Loading Ally...');
      
      const response = await fetch(
        `/api/ally?userId=${userId}&userEmail=${encodeURIComponent(userEmail)}&userDomain=${userDomain}&organizationId=${organizationId || ''}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setAllyConversationId(data.allyId);
      
      console.log('✅ [ALLY WORKSPACE] Ally loaded:', data.allyId);
      
    } catch (error) {
      console.error('❌ [ALLY WORKSPACE] Failed to load Ally:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Bot className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-semibold text-slate-900">Loading Ally...</p>
          <p className="text-sm text-slate-600">Your personal assistant is starting up</p>
        </div>
      </div>
    );
  }
  
  if (!allyConversationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900">Failed to load Ally</p>
          <button
            onClick={loadAlly}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left: Inputs (280px) */}
      <AllyInputPanel
        userId={userId}
        userDomain={userDomain}
        organizationId={organizationId}
        conversationId={allyConversationId}
      />
      
      {/* Middle: Conversation (flex-grow) */}
      <AllyConversationPanel
        conversationId={allyConversationId}
        userId={userId}
      />
      
      {/* Right: Actions (320px, collapsible) */}
      <AllyActionsPanel
        conversationId={allyConversationId}
        userId={userId}
      />
    </div>
  );
}
```

---

### Phase 6: Access Toggle in Main UI (Day 7)

**Update:** `src/components/ChatInterfaceWorking.tsx` (MINIMAL CHANGE)

```typescript
// At top of component (around line 320)
interface ChatInterfaceWorkingProps {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
}

function ChatInterfaceWorkingComponent({ userId, userEmail, userName, userRole }: ChatInterfaceWorkingProps) {
  
  // 🆕 ALLY BETA ACCESS (NEW STATE)
  const [allyBetaAccess, setAllyBetaAccess] = useState(false);
  const [showAllyWorkspace, setShowAllyWorkspace] = useState(false);
  
  // Check if user has Ally beta access
  useEffect(() => {
    checkAllyBetaAccess();
  }, [userId, userEmail]);
  
  async function checkAllyBetaAccess() {
    try {
      // Only check if SuperAdmin
      if (userEmail !== 'alec@getaifactory.com') {
        setAllyBetaAccess(false);
        return;
      }
      
      const response = await fetch(`/api/feature-flags?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAllyBetaAccess(data.allyBetaAccess || false);
      }
    } catch (error) {
      console.error('Error checking Ally access:', error);
    }
  }
  
  // ... rest of existing code unchanged ...
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* 🆕 ALLY BETA TOGGLE (only visible to SuperAdmin) */}
      {allyBetaAccess && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setShowAllyWorkspace(false)}
            className={`px-4 py-2 rounded-lg transition-all ${
              !showAllyWorkspace 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            💬 Classic Chat
          </button>
          
          <button
            onClick={() => setShowAllyWorkspace(true)}
            className={`px-4 py-2 rounded-lg transition-all ${
              showAllyWorkspace 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            ⭐ Ally Beta
          </button>
        </div>
      )}
      
      {/* Show either Classic Chat OR Ally Workspace */}
      {showAllyWorkspace && allyBetaAccess ? (
        <AllyWorkspace
          userId={userId}
          userEmail={userEmail}
          userDomain={userDomain}
          organizationId={organizationId}
          userRole={userRole}
        />
      ) : (
        /* EXISTING CHAT INTERFACE - UNCHANGED */
        <div className="flex flex-1">
          {/* ... all existing code unchanged ... */}
        </div>
      )}
    </div>
  );
}
```

**Impact on existing code:** **~30 lines added**, **0 lines modified**, **0 lines deleted**

---

### Phase 7: Comparison Dashboard (Day 8-10)

**Create:** `src/components/AllyComparisonDashboard.tsx` (NEW COMPONENT)

```typescript
/**
 * Ally Comparison Dashboard
 * 
 * Shows side-by-side metrics comparing:
 * - Classic Chat (existing system)
 * - Ally Beta (new system)
 */

interface ComparisonMetrics {
  classic: {
    conversationCount: number;
    messageCount: number;
    avgTimeToFirstMessage: number;
    avgSessionLength: number;
    agentDiscoveryRate: number;
    userSatisfaction: number;
  };
  
  ally: {
    conversationCount: number;
    messageCount: number;
    avgTimeToFirstMessage: number;
    avgSessionLength: number;
    agentDiscoveryRate: number;
    userSatisfaction: number;
    
    // Ally-specific metrics
    appUsageCount: number;
    collaborationCount: number;
    promptEffectiveness: number;
  };
}

export default function AllyComparisonDashboard({ userId }: { userId: string }) {
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);
  
  // Load comparison metrics
  useEffect(() => {
    loadMetrics();
  }, [userId]);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        📊 Ally Beta vs Classic Chat Comparison
      </h1>
      
      {/* Side-by-side comparison table */}
      <div className="grid grid-cols-3 gap-6">
        <div className="text-center font-semibold text-slate-700">
          Metric
        </div>
        <div className="text-center font-semibold text-slate-700">
          💬 Classic Chat
        </div>
        <div className="text-center font-semibold text-blue-700">
          ⭐ Ally Beta
        </div>
        
        {/* Metrics rows */}
        <ComparisonRow
          metric="Time to First Message"
          classic={metrics?.classic.avgTimeToFirstMessage}
          ally={metrics?.ally.avgTimeToFirstMessage}
          unit="seconds"
          lowerIsBetter
        />
        
        <ComparisonRow
          metric="Agent Discovery Rate"
          classic={metrics?.classic.agentDiscoveryRate}
          ally={metrics?.ally.agentDiscoveryRate}
          unit="agents/user"
          higherIsBetter
        />
        
        {/* ... more metrics ... */}
      </div>
      
      {/* Recommendation */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📈 Preliminary Results
        </h3>
        <p className="text-sm text-blue-800">
          Based on {metrics?.ally.conversationCount || 0} Ally conversations vs {metrics?.classic.conversationCount || 0} classic conversations:
        </p>
        
        <ul className="mt-3 space-y-2 text-sm text-blue-900">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Ally shows {calculateImprovement(metrics)}% improvement in time to first message
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Ally users discover {calculateAgentDiscoveryImprovement(metrics)}% more agents
          </li>
          {/* ... more insights ... */}
        </ul>
        
        <div className="mt-6 flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Enable for Beta Group (10 users)
          </button>
          <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
            Export Full Report
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 SUPERADMIN ACCESS CONTROL

### User-Level Feature Flag

```typescript
// Grant Ally beta access to SuperAdmin
await firestore.collection('users').doc('114671162830729001607').update({
  allyBetaAccess: {
    enabled: true,
    enabledAt: new Date(),
    enabledBy: 'system', // Auto-enabled for SuperAdmin
  }
});
```

### UI Access Control

```typescript
// In ChatInterfaceWorking.tsx

// Only show toggle if user has access
{allyBetaAccess && (
  <div className="fixed top-4 right-4 z-50 flex gap-2 bg-white rounded-lg shadow-lg p-1 border border-slate-200">
    <button
      onClick={() => setShowAllyWorkspace(false)}
      className={`px-4 py-2 rounded-lg transition-all ${
        !showAllyWorkspace 
          ? 'bg-slate-900 text-white' 
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      💬 Classic Chat
    </button>
    
    <button
      onClick={() => setShowAllyWorkspace(true)}
      className={`px-4 py-2 rounded-lg transition-all ${
        showAllyWorkspace 
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-2">
        <Bot className="w-4 h-4" />
        <span>Ally Beta</span>
        <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full font-bold">
          NEW
        </span>
      </span>
    </button>
  </div>
)}
```

---

## 📋 IMPLEMENTATION CHECKLIST (Step-by-Step)

### Day 1: Database & Feature Flag ✅
- [ ] Create Firestore indexes for ally_* collections
- [ ] Add ally_* security rules (additive to firestore.rules)
- [ ] Deploy indexes and rules to staging
- [ ] Create `src/lib/feature-flags.ts`
- [ ] Create `src/pages/api/feature-flags.ts`
- [ ] Grant beta access to alec@getaifactory.com
- [ ] Test: Feature flag API returns correct value

**Verification:**
```bash
# Check feature flag
curl "http://localhost:3000/api/feature-flags?userId=114671162830729001607"
# Expected: { "allyBetaAccess": true }
```

---

### Day 2-3: Ally Service Layer ✅
- [ ] Create `src/lib/ally.ts` (isolated service)
- [ ] Implement `getOrCreateAlly()` function
- [ ] Implement `computeEffectivePrompt()` function
- [ ] Implement `sendAllyWelcomeMessage()` function
- [ ] Create unit tests for Ally service
- [ ] Test: Can create Ally conversation

**Verification:**
```bash
# Create Ally via API
curl -X GET "http://localhost:3000/api/ally?userId=114671162830729001607&userEmail=alec@getaifactory.com&userDomain=getaifactory.com"
# Expected: { "allyId": "...", "success": true }

# Check in Firestore
# Should see 1 document in ally_conversations with isAllyConversation: true
```

---

### Day 3-4: Ally API Routes ✅
- [ ] Create `src/pages/api/ally/index.ts`
- [ ] Create `src/pages/api/ally/messages.ts`
- [ ] Create `src/pages/api/ally/actions.ts`
- [ ] Implement authentication and authorization
- [ ] Create integration tests for APIs
- [ ] Test: Can send/receive messages via API

**Verification:**
```bash
# Send message to Ally
curl -X POST "http://localhost:3000/api/ally/messages" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"...","userId":"...","message":"Hello Ally"}'
# Expected: { "success": true, "message": {...} }
```

---

### Day 5-7: Ally Workspace UI ✅
- [ ] Create `src/components/AllyWorkspace.tsx`
- [ ] Create `src/components/ally/AllyInputPanel.tsx`
- [ ] Create `src/components/ally/AllyConversationPanel.tsx`
- [ ] Create `src/components/ally/AllyActionsPanel.tsx`
- [ ] Implement responsive 3-column layout
- [ ] Add input selection logic
- [ ] Add message sending/receiving
- [ ] Test: Workspace renders correctly

**Verification:**
```bash
# Open Ally workspace in browser
# http://localhost:3000/chat
# Toggle to "Ally Beta"
# Should see 3-column layout
# Should see Ally welcome message
```

---

### Day 8-10: Ally Apps (Basic) ✅
- [ ] Create `src/components/ally/apps/SummaryApp.tsx`
- [ ] Create `src/components/ally/apps/EmailApp.tsx`
- [ ] Create `src/components/ally/apps/CollaborateApp.tsx`
- [ ] Implement app expansion in right pane
- [ ] Create output card components
- [ ] Test: Apps generate outputs correctly

**Verification:**
```bash
# Use Summary app in Ally
# Should generate summary card + CTA card
# Should save to ally_actions collection
# Should appear in Action History (left pane)
```

---

### Day 11-12: SuperAdmin Config Panel ✅
- [ ] Create `src/components/admin/AllyConfigPanel.tsx`
- [ ] Create SuperPrompt editor tab
- [ ] Create Organizations config tab
- [ ] Create Apps management tab
- [ ] Add to "GESTIÓN DE AGENTES" section (only for SuperAdmin)
- [ ] Test: Can edit SuperPrompt and see it apply

**Verification:**
```bash
# Open GESTIÓN DE AGENTES
# Should see "⭐ Ally" option (only for alec@getaifactory.com)
# Edit SuperPrompt
# Start new Ally conversation
# Should use updated SuperPrompt
```

---

### Day 13-14: Testing & Metrics ✅
- [ ] Create comparison dashboard
- [ ] Track usage metrics (Ally vs Classic)
- [ ] Performance testing (Ally load time, message response time)
- [ ] Security testing (isolation, cross-org sharing)
- [ ] Document comparison results
- [ ] Test: Metrics show improvement

**Verification:**
```bash
# Use both systems for 1 week
# Compare metrics
# Document findings
# Make go/no-go decision
```

---

## 📊 COMPARISON METRICS TO TRACK

### Performance Metrics

| Metric | Classic Chat | Ally Beta | Target |
|--------|--------------|-----------|--------|
| **Initial load time** | ? | ? | < 2s |
| **Time to first message** | ? | ? | < 3s |
| **Message response time** | ? | ? | < 2s |
| **App action time** | N/A | ? | < 3s |
| **Search time (1000 convos)** | N/A | ? | < 500ms |

### Usage Metrics

| Metric | Classic Chat | Ally Beta | Target |
|--------|--------------|-----------|--------|
| **Conversations created** | ? | ? | Same or more |
| **Messages per conversation** | ? | ? | +20% |
| **Agents discovered** | ? | ? | +100% |
| **Collaboration rate** | ? | ? | +500% |
| **Return rate (7-day)** | ? | ? | +30 points |

### User Experience Metrics

| Metric | Classic Chat | Ally Beta | Target |
|--------|--------------|-----------|--------|
| **Time to first productive conversation** | ? | ? | -50% |
| **User satisfaction (subjective)** | ? | ? | Higher |
| **Learning curve (subjective)** | ? | ? | Easier |
| **Feature discovery** | ? | ? | +200% |

---

## 🔒 SECURITY VERIFICATION

### Isolation Tests

**Test 1: Database Isolation**
```bash
# Create Ally conversation
# Check Firestore: ally_conversations collection
# Verify: Does NOT appear in conversations collection ✅

# Create classic conversation
# Check Firestore: conversations collection
# Verify: Does NOT appear in ally_conversations collection ✅
```

**Test 2: API Isolation**
```bash
# Call /api/conversations
# Verify: Does NOT return Ally conversations ✅

# Call /api/ally/conversations (when implemented)
# Verify: Does NOT return classic conversations ✅
```

**Test 3: UI Isolation**
```bash
# In Classic Chat tab
# Verify: Ally conversations do NOT appear in chat list ✅
# Verify: Cannot access Ally features ✅

# In Ally Beta tab
# Verify: Classic conversations do NOT appear in Ally ✅
# Verify: Separate namespace ✅
```

**Test 4: Access Control**
```bash
# Login as regular user (not alec@)
# Verify: No "Ally Beta" toggle visible ✅
# Verify: Cannot access /api/ally/* endpoints (403 Forbidden) ✅

# Login as SuperAdmin (alec@)
# Verify: "Ally Beta" toggle visible ✅
# Verify: Can access Ally workspace ✅
```

---

## 🎯 SUCCESS CRITERIA FOR GO/NO-GO DECISION

### Must-Have (Go Criteria)

After 1-2 weeks of testing with alec@getaifactory.com:

1. **Performance:**
   - [ ] Ally loads in < 2s
   - [ ] Messages send/receive in < 2s
   - [ ] Apps execute in < 3s
   - [ ] Search works in < 500ms

2. **Functionality:**
   - [ ] All 3 columns work correctly
   - [ ] Prompt hierarchy applies correctly
   - [ ] Ally Apps (Summary, Email, Collaborate) work
   - [ ] Output cards render correctly
   - [ ] Conversation history updates

3. **Security:**
   - [ ] Complete isolation from classic system
   - [ ] No data leakage
   - [ ] Firestore rules enforce permissions
   - [ ] Cross-org sharing validation works

4. **User Experience:**
   - [ ] SuperAdmin finds Ally intuitive
   - [ ] Ally provides value over classic chat
   - [ ] No major bugs or crashes
   - [ ] Comparison metrics show improvement

### Nice-to-Have (Bonus Criteria)

- [ ] Ally responds faster than classic chat
- [ ] Ally discovers more agents
- [ ] Ally Apps provide clear value
- [ ] SuperAdmin prefers Ally over classic

### Show-Stopper (No-Go Criteria)

- [ ] Critical bugs or crashes
- [ ] Data loss or corruption
- [ ] Security vulnerabilities
- [ ] Performance significantly worse than classic
- [ ] SuperAdmin cannot accomplish tasks they could in classic

---

## 🚀 ROLLOUT PLAN (If Successful)

### Phase 1: SuperAdmin Only (Weeks 1-2)
- **Access:** alec@getaifactory.com only
- **Purpose:** Validate core functionality
- **Success criteria:** All must-haves met

### Phase 2: Beta Group (Weeks 3-4)
- **Access:** 5-10 selected users (admins, experts)
- **Purpose:** Test with diverse use cases
- **Success criteria:** Positive feedback, no show-stoppers

### Phase 3: Domain Rollout (Weeks 5-6)
- **Access:** One domain (@getaifactory.com)
- **Purpose:** Test at small scale
- **Success criteria:** Metrics show improvement

### Phase 4: Organization Rollout (Weeks 7-8)
- **Access:** Entire Salfa Corp org (150+ users)
- **Purpose:** Test at production scale
- **Success criteria:** Handles load, metrics positive

### Phase 5: General Availability (Week 9+)
- **Access:** All users
- **Purpose:** Full production deployment
- **Classic Chat:** Remains available as fallback (for 90 days)

### Phase 6: Deprecation (Week 22+)
- **Classic Chat:** Deprecated after 90 days of GA
- **Migration:** Force users to Ally (if successful)
- **Rollback:** Keep classic code in repo for 1 year

---

## 🔄 ROLLBACK PLAN

### If Issues Arise

**Level 1: Disable Ally for User**
```typescript
await firestore.collection('users').doc(userId).update({
  'allyBetaAccess.enabled': false,
});
// User sees only Classic Chat
```

**Level 2: Disable Ally Globally**
```bash
# Update environment variable
ENABLE_ALLY_BETA=false

# Redeploy
npm run build
gcloud run deploy
```

**Level 3: Remove Ally Toggle from UI**
```typescript
// Comment out Ally toggle in ChatInterfaceWorking.tsx
// {allyBetaAccess && ( ... )}  ← Comment this out
```

**Level 4: Archive Ally Code (Nuclear Option)**
```bash
# Move all Ally code to archive branch
git checkout -b archive/ally-beta-$(date +%Y%m%d)
git mv src/components/AllyWorkspace.tsx archive/
git mv src/lib/ally.ts archive/
git mv src/pages/api/ally archive/
git commit -m "Archive Ally beta code"
git push origin archive/ally-beta-$(date +%Y%m%d)

# Restore main branch without Ally
git checkout main
```

**Data preservation:** All ally_* collections remain in Firestore (can restore anytime)

---

## 📁 FILE STRUCTURE (Parallel Stacks)

```
src/
├── components/
│   ├── ChatInterfaceWorking.tsx           ← UNCHANGED (Classic Chat)
│   ├── AllyWorkspace.tsx                  ← NEW (Ally Beta)
│   │
│   ├── ally/                              ← NEW DIRECTORY (Ally components)
│   │   ├── AllyInputPanel.tsx
│   │   ├── AllyConversationPanel.tsx
│   │   ├── AllyActionsPanel.tsx
│   │   ├── AllyOutputCard.tsx
│   │   ├── apps/
│   │   │   ├── SummaryApp.tsx
│   │   │   ├── EmailApp.tsx
│   │   │   └── CollaborateApp.tsx
│   │   └── admin/
│   │       └── AllyConfigPanel.tsx
│   │
│   └── AllyComparisonDashboard.tsx        ← NEW (Metrics comparison)
│
├── lib/
│   ├── firestore.ts                       ← UNCHANGED (existing DB ops)
│   ├── ally.ts                            ← NEW (Ally DB ops)
│   ├── ally-prompts.ts                    ← NEW (Prompt composition)
│   ├── ally-apps.ts                       ← NEW (App management)
│   ├── ally-search.ts                     ← NEW (Vector search)
│   └── feature-flags.ts                   ← NEW (Feature flags)
│
├── pages/
│   ├── api/
│   │   ├── conversations/                 ← UNCHANGED (Classic APIs)
│   │   │   └── [id]/messages.ts
│   │   │
│   │   └── ally/                          ← NEW DIRECTORY (Ally APIs)
│   │       ├── index.ts                   # GET/POST /api/ally
│   │       ├── conversations.ts           # Ally conversations
│   │       ├── messages.ts                # Ally messages
│   │       ├── actions.ts                 # Ally actions
│   │       ├── apps/
│   │       │   ├── summary.ts
│   │       │   ├── email.ts
│   │       │   └── collaborate.ts
│   │       └── config/
│   │           ├── superprompt.ts         # SuperPrompt management
│   │           └── organizations.ts       # Org-level config
│   │
│   └── chat.astro                         ← MINIMAL CHANGE (add toggle)
│
└── types/
    ├── conversation.ts                    ← UNCHANGED
    ├── ally.ts                            ← NEW (Ally types)
    └── feature-flags.ts                   ← NEW
```

**Impact:**
- **New files:** ~25 files
- **Modified files:** 2 files (ChatInterfaceWorking.tsx, chat.astro)
- **Deleted files:** 0 files
- **Lines changed in existing files:** < 50 lines
- **Risk:** Zero (all isolated)

---

## 🧪 TESTING STRATEGY

### SuperAdmin Testing (Week 1-2)

**Test Plan for alec@getaifactory.com:**

#### Day 1-3: Core Functionality
```
Test 1: Ally Creation
- [ ] Login as SuperAdmin
- [ ] Toggle to "Ally Beta"
- [ ] Verify Ally conversation auto-created
- [ ] Verify welcome message appears
- [ ] Verify can send messages to Ally
- [ ] Verify Ally responds correctly

Test 2: Prompt Hierarchy
- [ ] Configure SuperPrompt in Ally Config panel
- [ ] Configure Organization prompt (GetAI Factory)
- [ ] Verify effective prompt combines both
- [ ] Send test message
- [ ] Verify Ally follows both prompts

Test 3: Input Selection
- [ ] Select organization info in left pane
- [ ] Verify Ally has access to org context
- [ ] Deselect organization info
- [ ] Verify Ally no longer uses org context
- [ ] Select specific agent (M001)
- [ ] Verify Ally can reference M001's knowledge
```

#### Day 4-7: Apps & Actions
```
Test 4: Summary App
- [ ] Click "Summary" in right pane
- [ ] Request summary of M001 usage
- [ ] Verify summary card appears
- [ ] Verify CTA buttons work (Email, Share)
- [ ] Verify action saved to Action History

Test 5: Email App
- [ ] Click "Email" in right pane
- [ ] Compose email to team
- [ ] Verify email preview card appears
- [ ] Verify can send/schedule/save draft
- [ ] Verify email sent successfully

Test 6: Collaborate App
- [ ] Click "Collaborate" in right pane
- [ ] Invite user to conversation
- [ ] Verify invite sent (email/WhatsApp)
- [ ] Verify collaborator added to conversation
- [ ] Verify collaborator can view conversation
```

#### Day 8-14: Advanced Features
```
Test 7: Conversation History as Input
- [ ] Have 3 conversations with Ally
- [ ] In 4th conversation, select previous conversations as input
- [ ] Ask Ally to reference previous conversations
- [ ] Verify Ally can access and reference them

Test 8: Action History as Input
- [ ] Generate 2 summaries (actions)
- [ ] In new conversation, select actions as input
- [ ] Ask Ally to compare summaries
- [ ] Verify Ally can access and compare

Test 9: Cross-Organization Sharing
- [ ] Configure Salfa Corp to allow cross-org sharing
- [ ] Create conversation in Salfa Corp
- [ ] Invite external user (test@external.com)
- [ ] Verify invite sent with verification
- [ ] Verify external user can access (after verification)

Test 10: Performance
- [ ] Create 50 Ally conversations
- [ ] Measure load time
- [ ] Measure search time
- [ ] Verify < 2s load, < 500ms search
```

---

## 📊 COMPARISON DASHBOARD (Metrics)

### Metrics to Collect

**Week 1 (SuperAdmin only):**
```json
{
  "classic": {
    "conversationCount": 15,
    "messageCount": 234,
    "avgTimeToFirstMessage": 45,      // seconds
    "avgSessionLength": 480,           // seconds
    "agentDiscoveryRate": 2.3,
    "userSatisfaction": 4.0
  },
  
  "ally": {
    "conversationCount": 12,
    "messageCount": 189,
    "avgTimeToFirstMessage": 18,       // -60% (IMPROVEMENT)
    "avgSessionLength": 720,            // +50% (IMPROVEMENT)
    "agentDiscoveryRate": 5.1,         // +122% (IMPROVEMENT)
    "userSatisfaction": 4.8,            // +20% (IMPROVEMENT)
    
    "appUsageCount": 23,
    "collaborationCount": 5,
    "promptEffectiveness": 0.92
  },
  
  "improvement": {
    "timeToFirstMessage": "-60%",
    "sessionLength": "+50%",
    "agentDiscovery": "+122%",
    "satisfaction": "+20%"
  },
  
  "verdict": "GO - Ally shows significant improvements across all metrics"
}
```

---

## ✅ GO/NO-GO DECISION CRITERIA

### GO Decision (Proceed to Beta Group)

**All of these must be true:**
- ✅ No critical bugs
- ✅ Performance targets met
- ✅ SuperAdmin satisfaction > 4.5/5
- ✅ At least 2 out of 4 key metrics improved
- ✅ No security vulnerabilities
- ✅ Data isolation verified

**Key Metrics to Beat:**
1. Time to first message: Must be < Classic Chat
2. Agent discovery: Must be > Classic Chat
3. User satisfaction: Must be > 4.0/5
4. Session length: Must be > Classic Chat OR equal with higher efficiency

### NO-GO Decision (Pause or Pivot)

**Any of these trigger pause:**
- ❌ Critical bugs preventing usage
- ❌ Performance worse than classic
- ❌ SuperAdmin cannot accomplish basic tasks
- ❌ Data loss or corruption
- ❌ Security vulnerabilities found

**Pivot Options:**
- Simplify Ally (remove apps, keep core chat)
- Fix critical issues and re-test
- Abandon Ally, enhance classic chat instead

---

## 📝 IMPLEMENTATION SUMMARY

### What Gets Built (Parallel Stack)

**New Code:**
- ~25 new files
- ~5,000 lines of new code
- 5 new Firestore collections
- 8 new API endpoints
- 1 new UI workspace

**Modified Code:**
- 2 files modified (ChatInterfaceWorking.tsx, chat.astro)
- ~50 lines added total
- 0 lines deleted
- 0 breaking changes

**Testing Required:**
- Unit tests: Ally service layer
- Integration tests: Ally APIs
- E2E tests: Ally workspace
- Security tests: Isolation validation
- Performance tests: Load time, search time

**Timeline:**
- Development: 2 weeks
- SuperAdmin testing: 1-2 weeks
- Go/No-Go decision: End of week 4
- Beta rollout (if GO): Weeks 5-8
- General availability (if successful): Week 9

---

## 🎯 IMMEDIATE NEXT STEPS

**Step 1: Create Feature Flag (30 minutes)**
- [ ] Create `src/lib/feature-flags.ts`
- [ ] Create `src/pages/api/feature-flags.ts`
- [ ] Grant beta access to alec@getaifactory.com
- [ ] Test API returns correct flag

**Step 2: Create Database Collections (1 hour)**
- [ ] Add ally_* indexes to firestore.indexes.json
- [ ] Add ally_* security rules to firestore.rules
- [ ] Deploy to Firestore
- [ ] Verify collections accessible

**Step 3: Create Ally Service (4-6 hours)**
- [ ] Create `src/lib/ally.ts`
- [ ] Implement `getOrCreateAlly()`
- [ ] Implement `computeEffectivePrompt()`
- [ ] Test in isolation

**Step 4: Create Ally API (4-6 hours)**
- [ ] Create `src/pages/api/ally/index.ts`
- [ ] Implement GET (get Ally)
- [ ] Test with curl
- [ ] Verify returns Ally conversation ID

**Step 5: Add UI Toggle (1 hour)**
- [ ] Add toggle to ChatInterfaceWorking.tsx
- [ ] Test toggle appears for SuperAdmin
- [ ] Test toggle hidden for regular users

**Total for MVP:** ~2-3 days to working prototype

---

## 🌟 CONCLUSION

This parallel deployment strategy ensures:

✅ **Zero risk** to existing system  
✅ **Complete isolation** (separate DB, API, UI)  
✅ **Easy rollback** (disable feature flag)  
✅ **Data-driven decision** (compare metrics)  
✅ **Controlled access** (SuperAdmin only initially)  
✅ **Side-by-side comparison** (toggle between systems)  
✅ **No pressure** (keep both systems as long as needed)  

**Ready to start?** I can begin with Step 1 (Feature Flag) immediately! 🚀

---

**Version:** 1.0.0  
**Last Updated:** November 16, 2025  
**Status:** ✅ Plan Complete - Ready to Implement  
**Risk Level:** Zero (parallel build, isolated)  
**Access:** SuperAdmin only (alec@getaifactory.com)  
**Timeline:** 2-3 days to working prototype, 2 weeks to full beta

