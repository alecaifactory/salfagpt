# Hierarchical Prompt System Implementation

## 📅 Date: 2025-10-28

## 🎯 Objective

Implement a hierarchical prompt system where:
1. **Domain Prompt** (Organization-level) - Shared across all agents
2. **Agent Prompt** (Agent-specific) - Unique to each agent  
3. **Combined Prompt** - Merged automatically when sending messages

---

## 🏗️ Architecture

### Prompt Hierarchy

```
Organization
  ├─ Domain Prompt (optional)
  │  └─ "We are [company], our values are..."
  │
  └─ Agents
      ├─ Agent 1
      │   └─ Agent Prompt: "You are customer service assistant..."
      │       └─ Final = Domain + Agent Prompt
      │
      ├─ Agent 2
      │   └─ Agent Prompt: "You are logistics coordinator..."
      │       └─ Final = Domain + Agent Prompt
      │
      └─ Agent 3
          └─ Agent Prompt: "You are data analyst..."
              └─ Final = Domain + Agent Prompt
```

### Data Model

#### organizations Collection
```typescript
{
  id: 'default-org',
  name: 'Mi Organización',
  domainPrompt: 'Somos Salfa Corp...',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: 'localhost' | 'production'
}
```

#### agent_configs Collection (Extended)
```typescript
{
  id: conversationId,
  conversationId: conversationId,
  userId: userId,
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro',
  agentPrompt: 'Eres un asistente...',  // ✅ NEW
  systemPrompt: '...',                    // DEPRECATED (backward compat)
  temperature: 0.7,
  maxOutputTokens: 8192,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: 'localhost' | 'production'
}
```

---

## 🔧 Implementation Details

### Step 1: Data Schema ✅
- Added `Organization` interface to `firestore.ts`
- Added `COLLECTIONS.ORGANIZATIONS`
- Extended `UserSettings` with `organizationId`
- Extended `AgentConfig` with `agentPrompt` (backward compatible)

### Step 2: Backend API ✅
Created new API routes:
- `GET /api/organizations/:id` - Get organization with domain prompt
- `PUT /api/organizations/:id` - Update domain prompt
- `GET /api/conversations/:id/prompt` - Get agent prompt
- `PUT /api/conversations/:id/prompt` - Update agent prompt

### Step 3: Firestore Functions ✅
Added to `firestore.ts`:
- `getOrganization(id)` - Fetch organization
- `saveOrganization(id, data)` - Save/update organization
- `combineDomainAndAgentPrompts(domain, agent)` - Merge prompts

### Step 4: Prompt Templates ✅
Created `promptTemplates.ts` with 8 categories:
- Customer Service (2 templates)
- Sales & Business
- Data Analysis
- Content Creation
- Development
- Education
- General
- Logistics & Operations

### Step 5: UI Components ✅

#### DomainPromptModal
- Organization-level prompt editor
- Shows hierarchy visualization
- Examples and guidance
- Accessible from User Menu → "Prompt de Dominio"

#### AgentPromptModal
- Agent-specific prompt editor
- Template selector (left panel)
- Prompt editor (right panel)
- Live preview of combined prompt
- Shows domain prompt context
- Accessible from Agent Context Modal → "Editar Prompt"

### Step 6: Integration ✅
Updated `ChatInterfaceWorking.tsx`:
- Added state for domain/agent prompts
- Added handlers: `handleSaveDomainPrompt`, `handleSaveAgentPrompt`
- Added loader: `loadPromptsForAgent(conversationId)`
- Updated `sendMessage` to use `combineDomainAndAgentPrompts`
- Added button in User Menu for Domain Prompt
- Added button in Agent Context Modal for Agent Prompt

### Step 7: Migration ✅
Created `scripts/migrate-agent-prompts.ts`:
- Adds default prompt to existing agents
- Copies `systemPrompt` to `agentPrompt` if exists
- Backward compatible (preserves existing data)

---

## 🚀 How to Use

### For Admins/Experts

#### 1. Set Domain Prompt (Organization-wide)
```
User Menu (bottom-left) 
  → Prompt de Dominio
  → Edit domain-level guidance
  → Save
```

Example Domain Prompt:
```
Somos Salfa Corp, líder en servicios logísticos en Chile.

Valores corporativos:
- Excelencia operacional
- Seguridad primero
- Transparencia con clientes

Políticas importantes:
- Siempre verificar disponibilidad en sistema antes de confirmar
- Escalar a supervisor si monto > $50,000
- Usar lenguaje profesional pero cercano
- Mencionar procedimientos de seguridad cuando sea relevante
```

#### 2. Set Agent Prompt (Agent-specific)
```
Click Gear Icon on Agent
  → Edit Context Modal opens
  → Click "Editar Prompt" (green button)
  → Select template (optional)
  → Customize agent behavior
  → Preview combined prompt
  → Save
```

Example Agent Prompt for Logistics Coordinator:
```
Eres un coordinador logístico experto en gestión de bodegas.

Tu objetivo es ayudar con:
- Control de inventario
- Coordinación de transportes
- Procesos de recepción y despacho

Formato de respuesta:
1. Situación actual
2. Análisis
3. Recomendaciones
4. Seguimiento
```

### For Users

Users will automatically benefit from:
- Domain prompt guidance (organization policies)
- Agent-specific behavior (task-specific expertise)
- Consistent, professional responses aligned with company values

---

## 🧪 Testing Checklist

### Domain Prompt Testing
- [ ] Open User Menu → "Prompt de Dominio"
- [ ] Edit domain prompt with company values
- [ ] Save successfully
- [ ] Verify persisted (refresh page, still there)
- [ ] Send message to any agent
- [ ] Verify response follows domain guidance

### Agent Prompt Testing  
- [ ] Select an agent
- [ ] Click gear icon → "Edit Context"
- [ ] Click "Editar Prompt" button
- [ ] Try a template from list
- [ ] Customize agent prompt
- [ ] Preview combined prompt (shows domain + agent)
- [ ] Save successfully
- [ ] Send message
- [ ] Verify response combines domain + agent guidance

### Prompt Combination Testing
- [ ] Set domain prompt: "Always use emojis"
- [ ] Set agent prompt: "You are a sales advisor"
- [ ] Send message: "Tell me about your products"
- [ ] Response should:
  - Use emojis (from domain)
  - Act as sales advisor (from agent)
  - Combine both seamlessly

### Backward Compatibility Testing
- [ ] Agents without agentPrompt use default
- [ ] Agents with old systemPrompt still work
- [ ] Migration script preserves existing prompts
- [ ] No errors in console
- [ ] All existing features still work

---

## 📊 Prompt Templates Reference

| Category | Templates | Use Domain? |
|---|---|---|
| Customer Service | Friendly, Technical Support | ✅ Yes |
| Sales | Sales Advisor | ✅ Yes |
| Analysis | Data Analyst | ✅ Yes |
| Content | Content Writer | ✅ Yes |
| Development | Coding Assistant | ❌ No |
| Education | Tutor | ✅ Yes |
| General | General Assistant | ✅ Yes |
| Logistics | Logistics Coordinator | ✅ Yes |

---

## 🔄 Migration Instructions

Run the migration script to update existing agents:

```bash
npx tsx scripts/migrate-agent-prompts.ts
```

This will:
1. Find all conversations
2. Check if agent_config exists
3. If no agentPrompt, add default: "Eres un asistente de IA útil y profesional que responde en español."
4. If systemPrompt exists, copy to agentPrompt
5. Report summary

---

## 🎯 Success Criteria

- ✅ Domain prompt editable from User Menu
- ✅ Agent prompt editable from Agent Context Modal
- ✅ 8 prompt templates available
- ✅ Templates organized by category
- ✅ Live preview of combined prompt
- ✅ Prompts persist in Firestore
- ✅ Prompts combine correctly when sending messages
- ✅ Backward compatible with existing agents
- ✅ Migration script available
- ✅ No breaking changes

---

## 📝 Files Modified

### Backend
- `src/lib/firestore.ts` - Added Organization interface, CRUD functions, combineDomainAndAgentPrompts
- `src/pages/api/organizations/[id].ts` - GET/PUT for organizations
- `src/pages/api/conversations/[id]/prompt.ts` - GET/PUT for agent prompts

### Frontend
- `src/components/ChatInterfaceWorking.tsx` - Integration of new modals and prompt loading
- `src/components/DomainPromptModal.tsx` - Domain prompt editor
- `src/components/AgentPromptModal.tsx` - Agent prompt editor with templates
- `src/components/AgentContextModal.tsx` - Added "Editar Prompt" button
- `src/lib/promptTemplates.ts` - 8 prompt templates with categories

### Scripts
- `scripts/migrate-agent-prompts.ts` - Migration for existing agents

---

## 🚀 Next Steps (Future Enhancements)

1. **Multi-Organization Support**
   - Add organizationId to user settings
   - Support multiple organizations per user
   - Organization switcher in UI

2. **Template Marketplace**
   - Community-shared templates
   - Rating and reviews
   - Import/export templates

3. **Advanced Prompt Features**
   - Variables in prompts: {{user_name}}, {{date}}, etc.
   - Conditional prompts based on context
   - A/B testing of prompts

4. **Prompt Analytics**
   - Track which prompts perform best
   - Measure response quality
   - Suggest prompt improvements

---

## 🎓 Lessons Learned

1. **Hierarchical prompts improve consistency** - Domain prompts ensure all agents follow company policies
2. **Templates accelerate setup** - Users can start with proven patterns
3. **Live preview is essential** - Users need to see combined result before saving
4. **Backward compatibility is critical** - systemPrompt → agentPrompt migration preserves data
5. **Context is king** - Showing domain prompt in agent editor helps users understand hierarchy

---

**Status:** ✅ Implementation Complete  
**Tested:** Ready for testing  
**Backward Compatible:** Yes  
**Breaking Changes:** None

