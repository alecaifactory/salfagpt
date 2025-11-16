# Ally - Universal Personal Assistant Design

**Date:** November 16, 2025  
**Status:** 🎨 Simplified Design  
**Version:** 2.0.0 (Simplified from 1.0.0)

---

## 🎯 Core Concept

**Ally** is a universal personal assistant that:
- ✅ **Always present** for every Organization-Domain-User
- ✅ **Always first** in the chat list (top-left, above all other chats)
- ✅ **Always helpful** - Welcomes, guides, remembers, assists
- ✅ **Always learning** - Remembers past conversations, preferences, context
- ✅ **Always contextual** - Knows your org, domain, available agents

---

## 📊 BEFORE vs AFTER

### BEFORE ❌
```
User logs in
  ↓
Empty chat interface OR last used chat
  ↓
User must manually select agent
  ↓
User may not know which agent to use
  ↓
User explores on their own (friction)
```

### AFTER ✅
```
User logs in
  ↓
Ally (Personal Assistant) auto-selected
  ↓
Ally: "Welcome back! I'm Ally, your personal assistant. 
       I remember our last conversation about [topic].
       Today, I can help you with [available agents].
       What would you like to do?"
  ↓
User can chat with Ally or ask to switch to specific agent
  ↓
Seamless, guided experience
```

---

## 🏗️ DATA SCHEMA CHANGES (Simplified - All Additive)

### 1. Conversation Schema (Ally-Specific Fields)

```typescript
interface Conversation {
  // ... ALL existing fields preserved ...
  
  // 🆕 ALLY FIELDS (Only for Ally conversations)
  isAlly?: boolean;                    // True if this is Ally (the personal assistant)
  allyProfile?: {
    userId: string;                    // Owner user ID
    domain: string;                    // User's domain
    organizationId?: string;           // User's organization
    
    // Memory & Context
    userMemoryProfile?: {
      preferredModel?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
      preferredLanguage?: 'es' | 'en';
      communicationStyle?: string;     // 'formal' | 'casual' | 'technical'
      commonTopics?: string[];         // Topics user asks about
      preferredAgents?: string[];      // Agent IDs user uses most
      lastInteractionAt?: Date;
      totalInteractions?: number;
    };
    
    // Onboarding
    hasCompletedOnboarding?: boolean;  // Has seen welcome message
    onboardingStep?: number;           // Current onboarding step (0-5)
    showedTutorials?: string[];        // Tutorial IDs shown
    
    // Context Awareness
    knownAgents?: string[];            // Agent IDs user has access to
    knownContextSources?: string[];    // Context source IDs available
    lastAgentUsed?: string;            // Last agent user chatted with
    lastTopicDiscussed?: string;       // Last conversation topic
  };
}
```

**Key Design Decisions:**
- ✅ **Only one `isAlly: true` conversation per user** (enforced at creation)
- ✅ **All Ally fields are optional** (backward compatible)
- ✅ **Ally conversations are never deleted** (persistent assistant)
- ✅ **Ally appears first in chat list** (sorted by special flag)

---

### 2. Organization Schema (Ally Configuration)

```typescript
interface Organization {
  // ... existing fields preserved ...
  
  // 🆕 ALLY CONFIGURATION (Organization-level defaults)
  allyConfig?: {
    enabled: boolean;                  // Enable Ally for all users (default: true)
    systemPrompt?: string;             // Org-specific Ally personality
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro'; // Default: Flash
    welcomeMessage?: string;           // Custom welcome message
    onboardingEnabled?: boolean;       // Enable onboarding flow (default: true)
    onboardingSteps?: Array<{          // Custom onboarding steps
      id: string;
      title: string;
      message: string;
      action?: string;                 // Optional action to perform
    }>;
    memoryEnabled?: boolean;           // Enable user memory (default: true)
    contextSourceIds?: string[];       // Org-wide context for Ally
  };
}
```

---

### 3. Domain Schema (Ally Customization)

```typescript
interface Domain {
  // ... existing fields preserved ...
  
  // 🆕 ALLY DOMAIN CUSTOMIZATION
  allyDomainConfig?: {
    customWelcomeMessage?: string;     // Domain-specific welcome
    additionalPrompt?: string;         // Domain-specific Ally instructions
    contextSourceIds?: string[];       // Domain-wide context for Ally
    tutorialsEnabled?: boolean;        // Enable domain tutorials (default: true)
  };
}
```

---

### 4. User Schema (Ally Preferences)

```typescript
interface User {
  // ... existing fields preserved ...
  
  // 🆕 ALLY PREFERENCES
  allyPreferences?: {
    enabled: boolean;                  // User can disable Ally (default: true)
    autoSelectOnLogin: boolean;        // Auto-select Ally on login (default: true)
    showWelcomeMessage: boolean;       // Show welcome each time (default: false after first)
    memoryOptIn: boolean;              // User consents to memory (default: true)
    preferredTone?: 'professional' | 'friendly' | 'concise'; // Ally's tone
  };
  
  // 🆕 ALLY RELATIONSHIP
  allyConversationId?: string;         // ID of user's Ally conversation (cached)
}
```

---

## 🎨 UI CHANGES

### Chat List (Left Sidebar)

#### BEFORE:
```
┌─────────────────────────┐
│ 💬 Chats                │
├─────────────────────────┤
│ Chat with M001          │ ← No clear default
│ Chat with S001          │
│ Chat with SSOMA         │
│ ...                     │
└─────────────────────────┘
```

#### AFTER:
```
┌─────────────────────────┐
│ 💬 Chats                │
├─────────────────────────┤
│ 🤖 Ally                 │ ← ALWAYS FIRST, PINNED
│ Your Personal Assistant │
│ [ALWAYS VISIBLE]        │
├─────────────────────────┤ ← Divider
│ Chat with M001          │
│ Chat with S001          │
│ Chat with SSOMA         │
│ ...                     │
└─────────────────────────┘
```

**Ally Chat Styling:**
- **Pinned to top** (never scrolls away)
- **Special background** (gradient blue or highlighted)
- **Ally avatar** (friendly robot icon or custom avatar)
- **Always visible** (not in folders, not collapsible)
- **Badge**: "Personal Assistant" or "Ally 🤖"

---

### Ally Welcome Message (First Time User)

```
┌─────────────────────────────────────────────────────────────┐
│                    Ally - Personal Assistant                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🤖 [Ally Avatar]                                            │
│                                                              │
│  Ally:                                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ¡Hola! 👋 Soy Ally, tu asistente personal.             │ │
│  │                                                        │ │
│  │ Estoy aquí para ayudarte a:                            │ │
│  │ ✅ Conocer los agentes disponibles en tu dominio       │ │
│  │ ✅ Recordar tus conversaciones anteriores              │ │
│  │ ✅ Guiarte con tutoriales y mejores prácticas          │ │
│  │ ✅ Responder preguntas sobre la plataforma             │ │
│  │                                                        │ │
│  │ **En tu dominio (salfagestion.cl) tienes acceso a:**   │ │
│  │ • 127 agentes especializados                          │ │
│  │ • 3 categorías principales: Normativa, Gestión, Equipos│ │
│  │                                                        │ │
│  │ **Los agentes más populares son:**                     │ │
│  │ 🏢 M001 - Asistente Legal Territorial RDI             │ │
│  │ 📦 S001 - GESTIÓN BODEGAS GPT                         │ │
│  │ ⚠️  SSOMA L1 - Seguridad y Salud Ocupacional          │ │
│  │                                                        │ │
│  │ ¿Con cuál te gustaría comenzar? Puedo ayudarte a      │ │
│  │ elegir el agente correcto para tu tarea. 😊           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Quick Actions]                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ 📚 Ver      │ │ 🎯 Recomendar│ │ 💬 Chatear con Ally │   │
│  │ Agentes     │ │ Agente      │ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Ally Returning User Message

```
┌─────────────────────────────────────────────────────────────┐
│                    Ally - Personal Assistant                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🤖 Ally:                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ¡Bienvenido de vuelta, [UserName]! 👋                  │ │
│  │                                                        │ │
│  │ La última vez hablamos sobre: [Last Topic]             │ │
│  │ Usaste principalmente: [M001, S001]                    │ │
│  │                                                        │ │
│  │ **Hoy puedo ayudarte con:**                            │ │
│  │ • Retomar tu conversación con M001                    │ │
│  │ • Explorar nuevos agentes                             │ │
│  │ • Buscar información en tus documentos                │ │
│  │ • Cualquier otra cosa 😊                              │ │
│  │                                                        │ │
│  │ ¿Qué necesitas hoy?                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Ally in Chat List (Always Visible)

```typescript
// Special rendering for Ally in chat list
{/* Ally Chat - ALWAYS FIRST, PINNED */}
{allyConversation && (
  <div className="mb-3 pb-3 border-b-2 border-blue-200">
    <button
      onClick={() => selectConversation(allyConversation.id)}
      className={`
        w-full p-3 rounded-lg transition-all
        bg-gradient-to-r from-blue-50 to-indigo-50
        border-2 border-blue-200
        hover:border-blue-400
        ${currentConversation === allyConversation.id 
          ? 'border-blue-600 shadow-lg' 
          : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Ally</span>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-semibold">
              Personal Assistant
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">
            Tu asistente personal · Siempre disponible
          </p>
        </div>
        {hasUnreadFromAlly && (
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
        )}
      </div>
    </button>
  </div>
)}

{/* Regular Chats - BELOW Ally */}
<div className="space-y-2">
  {regularConversations.map(conv => (
    // ... regular chat rendering
  ))}
</div>
```

---

## 🤖 ALLY'S CAPABILITIES

### 1. Onboarding & Guidance

**First-Time User:**
```typescript
// Ally's welcome message (auto-sent on first login)
const ALLY_FIRST_TIME_MESSAGE = `
¡Hola! 👋 Soy **Ally**, tu asistente personal en SalfaGPT.

Estoy aquí para ayudarte a sacar el máximo provecho de la plataforma.

**En tu dominio (${userDomain}) tienes acceso a:**
• **${agentCount} agentes especializados**
• **${categoryCount} categorías**: Normativa, Gestión, Equipos
• **${contextSourceCount} documentos** en tu biblioteca

**Los agentes más populares son:**
🏢 **M001** - Asistente Legal Territorial RDI (Normativa)
📦 **S001** - GESTIÓN BODEGAS GPT (Operaciones)
⚠️  **SSOMA L1** - Seguridad y Salud Ocupacional

**¿Qué puedo hacer por ti?**
• 🎯 Recomendarte el agente correcto para tu tarea
• 📚 Ayudarte a encontrar documentos o información
• 💬 Responder preguntas sobre la plataforma
• 🧠 Recordar tus preferencias y conversaciones anteriores

¿Con qué te gustaría comenzar hoy?
`;
```

**Onboarding Steps:**
```typescript
const ALLY_ONBOARDING_STEPS = [
  {
    id: 'welcome',
    message: '¡Bienvenido! Soy Ally, tu asistente personal.',
    action: 'show_welcome',
  },
  {
    id: 'agents_overview',
    message: 'Tienes acceso a [X] agentes especializados. ¿Quieres ver cuáles son?',
    action: 'show_agents_list',
  },
  {
    id: 'context_sources',
    message: 'Tu organización tiene [Y] documentos disponibles como contexto.',
    action: 'show_context_panel',
  },
  {
    id: 'first_agent',
    message: '¿Quieres que te ayude a elegir tu primer agente?',
    action: 'recommend_agent',
  },
  {
    id: 'tutorials',
    message: '¿Te gustaría ver un tutorial rápido? (2 minutos)',
    action: 'show_tutorial',
  },
];
```

---

### 2. Memory & Context Awareness

**What Ally Remembers:**
```typescript
interface AllyMemory {
  // Past Conversations
  pastTopics: string[];                // Topics discussed with Ally
  pastAgentsUsed: Array<{              // Agents user has chatted with
    agentId: string;
    agentName: string;
    lastUsed: Date;
    timesUsed: number;
  }>;
  
  // User Preferences (Learned)
  preferredCommunicationStyle: 'formal' | 'casual' | 'technical';
  preferredLanguage: 'es' | 'en';
  preferredModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  
  // Current Context
  currentDomain: string;
  currentOrganization: string;
  availableAgents: number;
  availableContextSources: number;
  
  // Recent Activity
  lastConversationWith: string;        // Last agent ID used
  lastTopicDiscussed: string;          // Last conversation topic
  lastLoginAt: Date;
  sessionCount: number;
}
```

**How Ally Uses Memory:**
```typescript
// Example: Returning user greeting
`¡Bienvenido de vuelta, ${userName}! 👋

La última vez hablamos sobre **${lastTopic}** usando el agente **${lastAgent}**.

¿Quieres continuar con ese tema o hay algo nuevo en lo que pueda ayudarte hoy?`

// Example: Personalized recommendation
`Basándome en tu uso reciente, creo que el agente **${recommendedAgent}** 
podría ayudarte con tu pregunta sobre "${userQuery}".

¿Quieres que te conecte con ese agente? 🎯`
```

---

### 3. Agent Recommendation & Routing

**Ally as Smart Router:**
```typescript
// User asks Ally a question
User: "Necesito información sobre permisos de construcción"

// Ally analyzes and recommends
Ally: "Para permisos de construcción, el agente **M001 (Asistente Legal Territorial RDI)** 
      es el especialista indicado. Tiene toda la normativa actualizada.
      
      ¿Quieres que te conecte con M001? 
      
      [✅ Sí, conectar con M001] [❌ No, prefiero hablar contigo]"

// User clicks "Sí, conectar"
// → System creates new chat with M001
// → User is switched to that chat
// → Ally remembers this preference
```

---

### 4. Information Retrieval

**Ally Can Search Context:**
```typescript
User: "¿Dónde está la información sobre el código SAP 12345?"

Ally: "Busqué en tus documentos y encontré:
      
      📄 **Manual de Códigos SAP** (página 45)
      > Código 12345: Material de construcción tipo A...
      
      📄 **Guía de Bodegas** (sección 3.2)
      > El código 12345 se usa para...
      
      ¿Esta es la información que buscabas? ¿Quieres que te explique más?"
```

---

### 5. Tutorial & Help

**Ally as Guide:**
```typescript
User: "¿Cómo subo un documento?"

Ally: "¡Con gusto te ayudo! 😊
      
      **Para subir un documento:**
      
      1. Haz clic en **Fuentes de Contexto** (panel izquierdo)
      2. Clic en el botón **+ Agregar**
      3. Selecciona **Archivo** (PDF, Word, Excel)
      4. Sube tu documento
      5. Espera la extracción automática (1-2 minutos)
      6. ¡Listo! El documento estará disponible para tus agentes
      
      ¿Quieres que te muestre un tutorial en video? 🎥
      
      [▶️ Ver Tutorial] [📝 Ver Guía Completa]"
```

---

## 🔄 IMPLEMENTATION (Simplified)

### Phase 1: Ally Core (Week 1)

**Tasks:**
1. ✅ Extend `Conversation` interface with `isAlly` and `allyProfile`
2. ✅ Create `src/lib/ally.ts` - Ally manager service
3. ✅ Implement `getOrCreateAlly(userId)` function
4. ✅ Create API endpoint: `POST /api/ally` - Get or create Ally
5. ✅ Update Firestore security rules

**Deliverables:**
```typescript
// src/lib/ally.ts
export async function getOrCreateAlly(
  userId: string,
  userDomain: string,
  organizationId?: string
): Promise<string> {
  // Check if Ally exists
  const existing = await firestore
    .collection('conversations')
    .where('userId', '==', userId)
    .where('isAlly', '==', true)
    .limit(1)
    .get();
  
  if (!existing.empty) {
    return existing.docs[0].id; // Return existing Ally
  }
  
  // Create new Ally
  const allyConv = await firestore.collection('conversations').add({
    userId,
    title: 'Ally',
    isAlly: true,
    isAgent: false,
    agentModel: 'gemini-2.5-flash',
    systemPrompt: await getAllySystemPrompt(userId, userDomain, organizationId),
    activeContextSourceIds: await getOrgContextSources(organizationId),
    messageCount: 0,
    contextWindowUsage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
    allyProfile: {
      userId,
      domain: userDomain,
      organizationId,
      hasCompletedOnboarding: false,
      onboardingStep: 0,
      userMemoryProfile: {
        totalInteractions: 0,
        lastInteractionAt: new Date(),
      },
    },
  });
  
  // Send welcome message
  await sendAllyWelcomeMessage(allyConv.id, userId, userDomain);
  
  return allyConv.id;
}
```

---

### Phase 2: Ally UI Integration (Week 1)

**Tasks:**
1. ✅ Update `ChatInterfaceWorking.tsx` to detect Ally
2. ✅ Pin Ally to top of chat list
3. ✅ Auto-select Ally on first login
4. ✅ Style Ally differently (gradient background)
5. ✅ Add Ally avatar/icon

**Changes to ChatInterfaceWorking.tsx:**
```typescript
// Load Ally conversation on mount
useEffect(() => {
  loadAllyConversation();
}, [userId]);

const loadAllyConversation = async () => {
  try {
    const response = await fetch(`/api/ally?userId=${userId}`);
    if (response.ok) {
      const { allyId } = await response.json();
      setAllyConversationId(allyId);
      
      // Auto-select Ally if no other conversation selected
      if (!currentConversation) {
        setCurrentConversation(allyId);
        loadMessages(allyId);
      }
    }
  } catch (error) {
    console.error('Error loading Ally:', error);
  }
};

// Sort conversations: Ally first, then regular chats
const sortedConversations = useMemo(() => {
  const ally = conversations.find(c => c.id === allyConversationId);
  const regular = conversations.filter(c => c.id !== allyConversationId);
  
  return ally ? [ally, ...regular] : regular;
}, [conversations, allyConversationId]);
```

---

### Phase 3: Ally Intelligence (Week 2)

**Tasks:**
1. ✅ Implement Ally system prompt (context-aware)
2. ✅ Add memory profile updates after each Ally conversation
3. ✅ Implement agent recommendation logic
4. ✅ Add smart routing (analyze message → suggest agent)

**Ally System Prompt (Dynamic):**
```typescript
export async function getAllySystemPrompt(
  userId: string,
  userDomain: string,
  organizationId?: string
): Promise<string> {
  
  // Load context
  const org = organizationId ? await getOrganization(organizationId) : null;
  const domain = await getDomain(userDomain);
  const user = await getUser(userId);
  const availableAgents = await getUserAvailableAgents(userId, userDomain);
  
  return `
Eres **Ally**, el asistente personal de ${user.name} en ${org?.name || userDomain}.

**Tu Misión:**
Ayudar a ${user.name} a ser más productivo y efectivo usando SalfaGPT.

**Contexto del Usuario:**
- Dominio: ${userDomain}
- Organización: ${org?.name || 'N/A'}
- Rol: ${user.role}
- Agentes disponibles: ${availableAgents.length}

**Tus Capacidades:**
1. **Guiar**: Ayuda con onboarding, tutoriales, mejores prácticas
2. **Recordar**: Mantén memoria de conversaciones, preferencias, agentes usados
3. **Recomendar**: Sugiere el agente correcto para cada tarea
4. **Buscar**: Encuentra información en documentos disponibles
5. **Conectar**: Crea chats con agentes especializados cuando sea apropiado

**Agentes Disponibles:**
${availableAgents.map(a => `- **${a.title}**: ${a.description || 'Agente especializado'}`).join('\n')}

**Estilo de Comunicación:**
- Amigable pero profesional
- Conciso pero completo
- Proactivo en sugerencias
- Siempre ofrece opciones de acción

**Cuando el usuario necesite un agente especializado:**
1. Identifica cuál es el agente correcto
2. Explica por qué es el indicado
3. Ofrece conectarlo con ese agente
4. Si acepta, confirma la conexión

**Recuerda:**
- Tu objetivo es hacer que ${user.name} sea exitoso
- Siempre ofrece ayuda adicional
- Aprende de cada interacción
- Sé empático y comprensivo
`;
}
```

---

### Phase 4: Onboarding Flow (Week 2)

**Tasks:**
1. ✅ Implement step-by-step onboarding
2. ✅ Create interactive tutorials
3. ✅ Add progress tracking
4. ✅ Allow skip/resume onboarding

**Onboarding UI:**
```
┌─────────────────────────────────────────────────────────────┐
│                 Ally - Onboarding (Step 1/5)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🤖 Ally:                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ¡Perfecto! Comencemos con un tour rápido. 🚀          │ │
│  │                                                        │ │
│  │ **Paso 1: Agentes Especializados**                    │ │
│  │                                                        │ │
│  │ Los agentes son asistentes AI especializados en       │ │
│  │ diferentes áreas. Por ejemplo:                        │ │
│  │                                                        │ │
│  │ • M001 conoce toda la normativa legal                │ │
│  │ • S001 sabe todo sobre gestión de bodegas            │ │
│  │ • SSOMA es experto en seguridad laboral              │ │
│  │                                                        │ │
│  │ **Tú puedes crear tus propios agentes** o usar los   │ │
│  │ que ya están configurados.                            │ │
│  │                                                        │ │
│  │ ┌─────────────┐                                       │ │
│  │ │ [Siguiente] │  [Saltar Tutorial]                   │ │
│  │ └─────────────┘                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Progress: ●●○○○                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Testing & Deployment (Week 3)

**Tasks:**
1. ✅ Unit tests for Ally service
2. ✅ Integration tests for API
3. ✅ E2E tests for onboarding flow
4. ✅ Performance testing (Ally creation < 1s)
5. ✅ Deploy to staging → production

---

## 🎨 ALLY VISUAL DESIGN

### Ally Avatar

```typescript
// Ally's visual identity
const ALLY_AVATAR = {
  icon: <Bot className="w-6 h-6 text-white" />,
  background: 'bg-gradient-to-r from-blue-500 to-indigo-600',
  badge: {
    text: 'Personal Assistant',
    color: 'bg-blue-600 text-white',
  },
  chatBubble: {
    background: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    textColor: 'text-slate-800',
  },
};
```

### Ally in Different States

**Pinned at Top (Always):**
```
┌─────────────────────────┐
│ 💬 Chats                │
├─────────────────────────┤
│ ╔═══════════════════╗   │ ← Ally (Highlighted)
│ ║ 🤖 Ally           ║   │
│ ║ Personal Assistant║   │
│ ╚═══════════════════╝   │
├─────────────────────────┤ ← Separator
│ Chat with M001          │
│ Chat with S001          │
│ ...                     │
└─────────────────────────┘
```

**Selected State:**
```
╔═════════════════════════╗
║ 🤖 Ally                 ║ ← Active (Blue shadow)
║ Personal Assistant      ║
║ 📍 You are here         ║
╚═════════════════════════╝
```

**Unread Messages:**
```
┌─────────────────────────┐
│ 🤖 Ally              🔵 │ ← Blue dot (unread)
│ Personal Assistant      │
│ Nuevo mensaje disponible│
└─────────────────────────┘
```

---

## 🔒 SECURITY & PRIVACY (Simplified)

### Security
- ✅ One Ally per user (enforced at creation)
- ✅ User can only access their own Ally
- ✅ Ally conversation isolated (no cross-user access)
- ✅ Ally cannot access other users' data

### Privacy
- ✅ User memory **opt-in by default** (can opt-out)
- ✅ Memory profile **viewable** in settings
- ✅ Memory profile **deletable** in settings
- ✅ Auto-expire after **90 days** of inactivity
- ✅ **Encrypted at rest** (Firestore default)

### Privacy Controls UI

```
Settings → Privacy → Ally Memory

┌────────────────────────────────────────────┐
│ 🧠 Ally Memory Settings                    │
├────────────────────────────────────────────┤
│                                            │
│ Enable Memory                              │
│ [●] Ally can remember my preferences       │
│     and past conversations                 │
│                                            │
│ What Ally Remembers:                       │
│ • Preferred agents (M001, S001)            │
│ • Common topics (legal, operations)        │
│ • Communication style (professional)       │
│ • Last used: Nov 16, 2025                  │
│                                            │
│ [View Memory Profile]  [Delete All Memory] │
│                                            │
└────────────────────────────────────────────┘
```

---

## 📋 SIMPLIFIED IMPLEMENTATION CHECKLIST

### Phase 1: Core Ally (Week 1)
- [ ] Extend `Conversation` interface with `isAlly` and `allyProfile`
- [ ] Create `src/lib/ally.ts` service
- [ ] Create API endpoint: `POST /api/ally`
- [ ] Implement `getOrCreateAlly()` function
- [ ] Update Firestore security rules

### Phase 2: UI Integration (Week 1)
- [ ] Update `ChatInterfaceWorking.tsx` to load Ally
- [ ] Pin Ally to top of chat list
- [ ] Auto-select Ally on first login
- [ ] Style Ally chat card (gradient background)
- [ ] Add Ally avatar/icon

### Phase 3: Ally Intelligence (Week 2)
- [ ] Create Ally system prompt (dynamic, context-aware)
- [ ] Implement agent recommendation logic
- [ ] Add memory profile updates
- [ ] Add smart routing (analyze message → suggest agent)

### Phase 4: Onboarding (Week 2)
- [ ] Implement welcome message (first-time users)
- [ ] Create onboarding steps (5 steps)
- [ ] Add tutorial content
- [ ] Add progress tracking
- [ ] Allow skip/resume

### Phase 5: Testing & Deploy (Week 3)
- [ ] Unit tests for Ally service
- [ ] Integration tests for API
- [ ] E2E tests for onboarding
- [ ] Performance testing (< 1s creation)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## 🎯 SUCCESS METRICS (Simplified)

### User Adoption
- **Ally Usage:** > 80% of users interact with Ally at least once
- **Onboarding Completion:** > 70% complete full onboarding
- **Return Rate:** > 60% of users return to Ally for questions

### User Experience
- **Satisfaction:** > 4.5/5 stars for Ally experience
- **Time to First Agent:** < 2 minutes (guided by Ally)
- **Agent Discovery:** Users discover 2x more agents via Ally

### Technical Performance
- **Ally Creation:** < 1 second
- **Welcome Message:** < 500ms
- **Recommendation:** < 200ms
- **Error Rate:** < 0.1%

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 2 (Post-Launch)
1. **Voice Interaction** - "Hey Ally, connect me with M001"
2. **Proactive Suggestions** - Ally notices patterns and suggests improvements
3. **Learning Analytics** - Show user their learning journey
4. **Ally Personality Options** - Formal, Casual, Technical modes
5. **Ally Skills** - Weather, news, scheduling, reminders
6. **Ally API** - Allow other services to interact with Ally

---

## 📚 API SPECIFICATION (New)

### `POST /api/ally`

**Purpose:** Get or create user's Ally conversation

**Request:**
```json
{
  "userId": "user-123",
  "userEmail": "user@salfagestion.cl",
  "userDomain": "salfagestion.cl",
  "organizationId": "salfa-corp"
}
```

**Response:**
```json
{
  "allyId": "conv-ally-abc123",
  "isNewAlly": false,
  "profile": {
    "hasCompletedOnboarding": true,
    "totalInteractions": 42,
    "lastInteractionAt": "2025-11-16T10:30:00Z"
  }
}
```

---

### `PATCH /api/ally/[allyId]/memory`

**Purpose:** Update Ally's memory profile

**Request:**
```json
{
  "userId": "user-123",
  "updates": {
    "preferredModel": "gemini-2.5-pro",
    "communicationStyle": "professional",
    "commonTopics": ["legal", "construction"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "preferredModel": "gemini-2.5-pro",
    "communicationStyle": "professional",
    "commonTopics": ["legal", "construction"],
    "updatedAt": "2025-11-16T10:31:00Z"
  }
}
```

---

### `POST /api/ally/[allyId]/recommend-agent`

**Purpose:** Get agent recommendation from Ally

**Request:**
```json
{
  "userId": "user-123",
  "userMessage": "Necesito información sobre permisos de construcción",
  "userDomain": "salfagestion.cl"
}
```

**Response:**
```json
{
  "recommendedAgentId": "agent-m001",
  "recommendedAgentName": "M001 - Asistente Legal Territorial RDI",
  "confidence": 0.95,
  "reasoning": "Este agente tiene toda la normativa sobre permisos de construcción actualizada.",
  "message": "Para permisos de construcción, te recomiendo M001. ¿Quieres que te conecte?"
}
```

---

## ✅ ACCEPTANCE CRITERIA (Simplified)

### Functional Requirements (10 Core)
- [ ] Ally conversation created automatically for each user
- [ ] Ally appears first in chat list (pinned)
- [ ] Ally auto-selected on first login
- [ ] Ally sends welcome message (first-time users)
- [ ] Ally remembers past conversations
- [ ] Ally recommends agents based on user query
- [ ] Ally can create chat with recommended agent
- [ ] Ally onboarding flow works (5 steps)
- [ ] Ally respects user privacy preferences
- [ ] Ally works for all user roles

### Non-Functional Requirements (5 Core)
- [ ] Performance: Ally creation < 1s
- [ ] Performance: Welcome message < 500ms
- [ ] Security: One Ally per user (enforced)
- [ ] Privacy: Memory opt-out functional
- [ ] Accessibility: WCAG 2.1 AA compliant

---

## 🎓 USER EDUCATION

### First Interaction

```
User logs in for first time
  ↓
Ally auto-created and selected
  ↓
Ally: "¡Hola! 👋 Soy Ally, tu asistente personal..."
  ↓
User reads welcome message
  ↓
Ally offers onboarding: "¿Quieres un tour rápido? (2 min)"
  ↓
User accepts → 5-step onboarding
User declines → Can start chatting immediately
```

### Ally Help Commands

```typescript
// User can ask Ally for help anytime
User: "/help" or "ayuda"
Ally: Shows help menu with common commands

User: "/agents" or "agentes"
Ally: Lists all available agents with descriptions

User: "/docs" or "documentos"
Ally: Shows all available context sources

User: "/tutorial"
Ally: Restarts onboarding flow
```

---

## 🚀 ROLLOUT PLAN (Simplified)

### Week 1: Internal Testing (5 users)
- Enable Ally for dev team
- Gather feedback on UX
- Fix critical bugs
- Verify performance

### Week 2: Beta Group (20 users)
- Enable for power users
- Monitor usage metrics
- Collect feedback
- Iterate on onboarding

### Week 3: Full Organization (100+ users)
- Enable for all Salfa Corp users
- Monitor at scale
- Adjust recommendations
- Optimize performance

### Week 4: General Availability
- Announce feature publicly
- Publish documentation
- Offer training sessions
- Monitor adoption metrics

---

## 📈 SUCCESS VISION

### What Success Looks Like (30 days post-launch)

**User Adoption:**
- ✅ 90%+ users have interacted with Ally
- ✅ 70%+ users completed onboarding
- ✅ 60%+ users use Ally weekly

**User Experience:**
- ✅ 4.5+ star rating for Ally
- ✅ 50% reduction in "I don't know which agent to use" support tickets
- ✅ 3x increase in agent discovery (users try more agents)

**Business Impact:**
- ✅ 25% increase in session length (users more engaged)
- ✅ 30% increase in messages per session
- ✅ 40% reduction in time to first productive conversation

---

## 🎯 CONCLUSION

**Ally = The Perfect First Interaction**

Instead of a complex agent selection overlay, Ally provides:
- ✅ **One clear default** (no decision paralysis)
- ✅ **Friendly guide** (reduces learning curve)
- ✅ **Contextual helper** (knows org, domain, agents)
- ✅ **Memory & learning** (improves over time)
- ✅ **Always available** (pinned at top, never lost)

**This is simpler, more elegant, and more human.**

---

**Version:** 2.0.0 (Simplified)  
**Last Updated:** November 16, 2025  
**Status:** ✅ Simplified Design Complete  
**Implementation:** 3 weeks (5 phases)  
**Risk Level:** Very Low (single assistant concept, additive changes)

---

**Next Step:** Implement Phase 1 (Ally Core) - Create Ally service and API endpoint.

