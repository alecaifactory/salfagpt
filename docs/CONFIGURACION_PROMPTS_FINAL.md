# 📋 Configuración Final de Prompts - Organization & Domain

## 🎯 Configuración Aprobada

### Organization Prompts

| Organization | Prompt | Usuarios Afectados |
|--------------|--------|-------------------|
| **AI Factory** | "Eres el asistente de AI Factory." | alec@getaifactory.com |
| **Salfa Corp** | "Eres el asistente del Grupo Salfacorp." | sorellanac@salfagestion.cl<br>usuarios @salfagestion.cl<br>usuarios @salfa.cl<br>usuarios @maqsa.cl |

---

### Domain Prompts (Dinámico por Agente)

**Regla:** El "domain prompt" es el **Agent Prompt** del agente activo.

**Excepción para SuperAdmin:**
- Cuando SuperAdmin (@getaifactory.com) usa agentes de **otra organización** (ej: Salfa Corp)
- Usa el Organization Prompt + Agent Prompt de esa organización
- Esto permite debuggear viendo exactamente lo que usuarios de esa org ven

---

## 📊 Tabla Completa de Aplicación de Prompts

### Caso 1: alec@getaifactory.com (SuperAdmin)

#### Usando Ally (Propio)
```
SuperPrompt: ✅ Ally Platform-Wide (~4,500 chars)
Organization: "Eres el asistente de AI Factory."
Agent/Domain: Ally agent prompt
```
**Total:** ~5,000 chars (~1,250 tokens)

#### Usando M001 (Salfa Corp Agent)
```
SuperPrompt: ❌ No (es agente, no Ally)
Organization: "Eres el asistente del Grupo Salfacorp." ← USA SALFA, NO AI FACTORY
Agent/Domain: M001 Legal Territorial prompt
```
**Total:** ~1,000 chars (~250 tokens)

**Beneficio:** Alec ve EXACTAMENTE lo que usuarios de Salfa Corp ven.

---

### Caso 2: sorellanac@salfagestion.cl (Admin)

#### Usando Ally
```
SuperPrompt: ✅ Ally Platform-Wide
Organization: "Eres el asistente del Grupo Salfacorp."
Agent/Domain: Ally agent prompt
```
**Total:** ~5,500 chars (~1,375 tokens)

#### Usando M001
```
SuperPrompt: ❌ No
Organization: "Eres el asistente del Grupo Salfacorp."
Agent/Domain: M001 Legal Territorial prompt
```
**Total:** ~1,000 chars (~250 tokens)

---

### Caso 3: usuario@salfagestion.cl (User)

#### Usando Ally
```
SuperPrompt: ✅ Ally Platform-Wide
Organization: "Eres el asistente del Grupo Salfacorp."
Agent/Domain: Ally agent prompt
```

#### Usando M003
```
SuperPrompt: ❌ No
Organization: "Eres el asistente del Grupo Salfacorp."
Agent/Domain: M003 Mantenimiento prompt
```

---

## 🏗️ Lógica de Combinación

### Para Conversación con Ally:
```typescript
function buildAllyPrompt(user, agentId) {
  const prompts = [];
  
  // 1. SuperPrompt (platform-wide)
  prompts.push(getAllySuperPrompt());
  
  // 2. Organization Prompt
  if (user.organizationId === 'ai-factory') {
    prompts.push("Eres el asistente de AI Factory.");
  } else if (user.organizationId === 'salfa-corp') {
    prompts.push("Eres el asistente del Grupo Salfacorp.");
  }
  
  // 3. Ally Agent Prompt
  prompts.push(getAllyAgentPrompt());
  
  return prompts.join('\n\n---\n\n');
}
```

---

### Para Conversación con Agente Regular (M001, M003, etc.):
```typescript
function buildAgentPrompt(user, agentId) {
  const prompts = [];
  
  // 1. NO SuperPrompt (solo para Ally)
  
  // 2. Organization Prompt
  const agent = getAgent(agentId);
  const agentOrgId = agent.organizationId;
  
  if (agentOrgId === 'ai-factory') {
    prompts.push("Eres el asistente de AI Factory.");
  } else if (agentOrgId === 'salfa-corp') {
    prompts.push("Eres el asistente del Grupo Salfacorp.");
  }
  
  // 3. Agent Prompt (M001, M003, etc.)
  prompts.push(getAgentPrompt(agentId));
  
  return prompts.join('\n\n---\n\n');
}
```

---

### Regla Especial para SuperAdmin:
```typescript
// Cuando SuperAdmin usa agente de OTRA organización
if (user.role === 'superadmin' && agent.organizationId !== user.organizationId) {
  // Usa organization prompt del AGENTE, no del usuario
  organizationPrompt = getOrganizationPrompt(agent.organizationId);
  
  // Ejemplo:
  // alec@getaifactory.com usa M001 (de Salfa Corp)
  // → Usa "Eres el asistente del Grupo Salfacorp." (del agente)
  // → NO usa "Eres el asistente de AI Factory." (del usuario)
}
```

---

## 📦 Implementación - Script de Configuración

### Crear: `scripts/configure-organization-prompts.ts`

```typescript
#!/usr/bin/env -S npx tsx
import { firestore } from '../src/lib/firestore';

async function configureOrganizationPrompts() {
  console.log('🏢 Configuring Organization Prompts...\n');
  
  // 1. AI Factory
  console.log('1️⃣  Configuring AI Factory...');
  const aiFactoryRef = firestore.collection('organizations').doc('ai-factory');
  const aiFactoryDoc = await aiFactoryRef.get();
  
  if (!aiFactoryDoc.exists) {
    // Create AI Factory org
    await aiFactoryRef.set({
      id: 'ai-factory',
      name: 'AI Factory',
      slug: 'ai-factory',
      domains: ['getaifactory.com'],
      primaryDomain: 'getaifactory.com',
      isEnabled: true,
      tenant: {
        type: 'saas',
        gcpProjectId: 'salfagpt',
        region: 'us-east4'
      },
      allyConfig: {
        organizationPrompt: 'Eres el asistente de AI Factory.',
        enableHistory: true,
        historyLimit: 10,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'alec@getaifactory.com',
      source: 'script'
    });
    console.log('   ✅ AI Factory created');
  } else {
    // Update existing
    await aiFactoryRef.update({
      allyConfig: {
        organizationPrompt: 'Eres el asistente de AI Factory.',
        enableHistory: true,
        historyLimit: 10,
      },
      updatedAt: new Date()
    });
    console.log('   ✅ AI Factory updated');
  }
  
  // 2. Salfa Corp
  console.log('\n2️⃣  Configuring Salfa Corp...');
  const salfaRef = firestore.collection('organizations').doc('salfa-corp');
  const salfaDoc = await salfaRef.get();
  
  if (!salfaDoc.exists) {
    console.error('   ❌ Salfa Corp not found! Create it first.');
    return;
  }
  
  await salfaRef.update({
    allyConfig: {
      organizationPrompt: 'Eres el asistente del Grupo Salfacorp.',
      enableHistory: true,
      historyLimit: 10,
    },
    updatedAt: new Date()
  });
  console.log('   ✅ Salfa Corp updated');
  
  console.log('\n✅ Organization prompts configured!\n');
  console.log('Summary:');
  console.log('  - AI Factory: "Eres el asistente de AI Factory."');
  console.log('  - Salfa Corp: "Eres el asistente del Grupo Salfacorp."');
  console.log('\nNext: Test Ally conversations in each organization');
  
  process.exit(0);
}

configureOrganizationPrompts();
```

---

## 🧪 Testing Plan

### Test 1: AI Factory (alec@getaifactory.com)

**Ally Conversation:**
```
Expected Prompt:
  SuperPrompt: Ally Platform
  Organization: "Eres el asistente de AI Factory."
  Agent: Ally prompt
  
Total: ~5,000 chars
Response: Ally responde con contexto de AI Factory
```

**M001 Conversation (Salfa Corp Agent):**
```
Expected Prompt:
  Organization: "Eres el asistente del Grupo Salfacorp." ← SALFA, not AI Factory
  Agent: M001 Legal prompt
  
Total: ~1,000 chars
Response: M001 responde como si fuera usuario de Salfa
```

---

### Test 2: Salfa Corp User (@salfagestion.cl)

**Ally Conversation:**
```
Expected Prompt:
  SuperPrompt: Ally Platform
  Organization: "Eres el asistente del Grupo Salfacorp."
  Agent: Ally prompt
  
Total: ~5,500 chars
```

**M001 Conversation:**
```
Expected Prompt:
  Organization: "Eres el asistente del Grupo Salfacorp."
  Agent: M001 Legal prompt
  
Total: ~1,000 chars
```

---

## 🚀 Comandos para Implementar

### Paso 1: Configurar Organization Prompts

```bash
# Crear el script
# (El contenido está arriba en este documento)

# Ejecutar
npx tsx scripts/configure-organization-prompts.ts
```

**Output Esperado:**
```
🏢 Configuring Organization Prompts...

1️⃣  Configuring AI Factory...
   ✅ AI Factory created/updated

2️⃣  Configuring Salfa Corp...
   ✅ Salfa Corp updated

✅ Organization prompts configured!

Summary:
  - AI Factory: "Eres el asistente de AI Factory."
  - Salfa Corp: "Eres el asistente del Grupo Salfacorp."
```

---

### Paso 2: Verificar en UI

```bash
# Hard reload
Cmd + Shift + R

# Test:
1. Ally conversation → Send "Hi"
2. Verifica thinking steps: "Ally está revisando tus memorias..."
3. Domain dropdown → Ver 3 dominios para Salfa Corp
```

---

### Paso 3: Commit

```bash
git add .
git commit -m "feat: Organization prompts & domain dropdown fix

✅ Organization Prompts:
- AI Factory: 'Eres el asistente de AI Factory.'
- Salfa Corp: 'Eres el asistente del Grupo Salfacorp.'

✅ Domain Dropdown:
- Now shows ALL organization domains
- Not just domains with sources
- Example: Salfa Corp shows 3 domains (was showing only 1)

✅ SuperAdmin Rule:
- When using agents from other orgs
- Uses that org's prompts (not own org)
- Enables accurate debugging

Files:
- src/pages/api/context-sources/by-organization.ts
- src/components/ContextManagementDashboard.tsx
- scripts/configure-organization-prompts.ts (new)

Backward Compatible: Yes
Database Changes: organization.allyConfig.organizationPrompt"
```

---

## 📋 Resumen de Decisiones

### ✅ Aprobado:

1. **Organization Prompt - AI Factory:** "Eres el asistente de AI Factory."
2. **Organization Prompt - Salfa Corp:** "Eres el asistente del Grupo Salfacorp."
3. **Domain Prompt:** Dinámico = Agent Prompt del agente activo
4. **SuperAdmin Rule:** Usa prompts de la org del agente, no de su propia org

---

## 🎯 Próximos Pasos

1. **Ahora mismo:**
   - Hard reload (Cmd+Shift+R)
   - Verifica domain dropdown muestra 3 dominios

2. **Cuando estés listo:**
   - Ejecuta script de configuración de prompts
   - Test Ally en ambas organizaciones
   - Verifica que SuperAdmin ve contexto correcto

3. **Opcional (futuro):**
   - Configurar prompts específicos por agente (M001, M003, etc.)
   - Agregar más organizaciones
   - Personalizar Ally por dominio

---

**¿Quieres que cree el script ahora y lo ejecute para configurar los organization prompts?** 🚀


