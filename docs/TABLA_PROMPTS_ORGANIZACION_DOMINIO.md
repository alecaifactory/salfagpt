# 📊 Tabla de Prompts: Organization y Domain

## 🎯 Estructura Propuesta

Basado en tus requerimientos:

1. **Organization Prompt para Salfa Corp:** "Eres el asistente del Grupo Salfacorp."
2. **Domain Prompt:** Usa el prompt del agente activo (M001, M003, S001, etc.)
3. **SuperAdmin en org != getaifactory.com:** Usa domain prompt del agente

---

## 📋 Tabla Completa de Prompts por Usuario

| Usuario | Email | Rol | Org | Domain | Organization Prompt | Domain Prompt (Dinámico por Agente) | SuperPrompt |
|---------|-------|-----|-----|--------|---------------------|--------------------------------------|-------------|
| **Alec Dickinson** | alec@getaifactory.com | SuperAdmin | AI Factory | getaifactory.com | *(No configurado)* | **Dinámico:** Si usa agente en org != AI Factory → usa prompt de ese agente | ✅ Ally Platform (4.5k chars) |
| **Sebastian Orellana** | sorellanac@salfagestion.cl | Admin | Salfa Corp | salfagestion.cl | "Eres el asistente del Grupo Salfacorp." | **Ally:** Ally prompt<br>**M001:** Legal Territorial prompt<br>**M003:** Mantenimiento prompt | ✅ Ally Platform |
| **Usuario Salfa** | usuario@salfagestion.cl | User | Salfa Corp | salfagestion.cl | "Eres el asistente del Grupo Salfacorp." | **Según agente activo:**<br>M001, M003, S001, etc. | ✅ Ally Platform |
| **Usuario MAQSA** | usuario@maqsa.cl | User | Salfa Corp | maqsa.cl | "Eres el asistente del Grupo Salfacorp." | **Según agente activo:**<br>M003, S002 (mantenimiento) | ✅ Ally Platform |
| **Usuario Salfa (general)** | usuario@salfa.cl | User | Salfa Corp | salfa.cl | "Eres el asistente del Grupo Salfacorp." | **Según agente activo:**<br>Cualquier agente Salfa | ✅ Ally Platform |

---

## 🏗️ Estructura de Prompts por Agente

### Cuando Usuario Usa ALLY:

```
SuperPrompt (Platform)
  ↓
Organization Prompt: "Eres el asistente del Grupo Salfacorp."
  ↓
Domain Prompt: [Ally-specific prompt]
  = "Soy Ally, tu asistente personal en Flow.
     Te ayudo a navegar la plataforma, recomendar agentes,
     y gestionar tus conversaciones."
```

---

### Cuando Usuario Usa M001 (Legal Territorial):

```
SuperPrompt (Platform) [Solo si es Ally conversation]
  ↓
Organization Prompt: "Eres el asistente del Grupo Salfacorp."
  ↓
Agent Prompt (M001): 
  = "Soy el Asistente Legal Territorial RDI (M001).
     Especializado en:
     - Normativa de construcción y edificación
     - Permisos municipales
     - Regulaciones territoriales
     - Interpretación de LGUC
     
     Fuentes de conocimiento:
     - Ley General de Urbanismo y Construcciones
     - Ordenanzas municipales
     - Planes reguladores
     
     Respondo con referencias a documentos [1], [2], [3]."
```

---

### Cuando Usuario Usa M003 (Mantenimiento MAQSA):

```
SuperPrompt (Platform) [Solo si es Ally conversation]
  ↓
Organization Prompt: "Eres el asistente del Grupo Salfacorp."
  ↓
Agent Prompt (M003):
  = "Soy el Asistente de Mantenimiento MAQSA (M003).
     Especializado en:
     - Mantenimiento preventivo y correctivo
     - Procedimientos técnicos de equipos
     - Diagnóstico de fallas
     - Órdenes de trabajo
     
     Fuentes de conocimiento:
     - Manuales de equipos
     - Procedimientos de mantenimiento
     - Protocolos SSOMA
     
     Respondo con referencias a documentos [1], [2], [3]."
```

---

### Cuando Usuario Usa S001 (Gestión de Bodegas):

```
SuperPrompt (Platform) [Solo si es Ally conversation]
  ↓
Organization Prompt: "Eres el asistente del Grupo Salfacorp."
  ↓
Agent Prompt (S001):
  = "Soy el Asistente de Gestión de Bodegas (S001).
     Especializado en:
     - Control de inventarios
     - Logística de almacenamiento
     - Gestión de stock
     - Movimientos de materiales
     
     Fuentes de conocimiento:
     - Procedimientos de bodega
     - Sistemas de inventario
     - Protocolos de almacenaje
     
     Respondo con referencias a documentos [1], [2], [3]."
```

---

## 🔑 Regla Especial para SuperAdmin

### Caso: Alec (alec@getaifactory.com) usando agentes de Salfa Corp

**Cuando Alec usa agentes de organizaciones externas:**

```
SI usuario.role === 'superadmin' && agente.organizationId !== 'getaifactory.com':
  
  Organization Prompt: [De la org del agente]
    Ejemplo: "Eres el asistente del Grupo Salfacorp."
  
  Domain Prompt: [Prompt del agente activo]
    Ejemplo (si usa M001): Prompt de Legal Territorial
    Ejemplo (si usa M003): Prompt de Mantenimiento
  
  SuperPrompt: [Solo si es conversación con Ally]
    Si usa Ally → SuperPrompt Ally
    Si usa M001 → NO SuperPrompt (solo org + agent)
```

**Resultado:**
- SuperAdmin ve el contexto de la organización que está gestionando
- Usa los mismos prompts que usuarios de esa org
- Puede debuggear y verificar comportamiento exacto

---

## 📊 Matriz de Aplicación de Prompts

| Agente Activo | SuperPrompt | Organization | Domain/Agent | Total Layers |
|---------------|-------------|--------------|--------------|--------------|
| **Ally** | ✅ Ally Platform | ✅ "Asistente Grupo Salfacorp" | ✅ Ally-specific | 3 |
| **M001** | ❌ No (es agente) | ✅ "Asistente Grupo Salfacorp" | ✅ Legal Territorial | 2 |
| **M003** | ❌ No (es agente) | ✅ "Asistente Grupo Salfacorp" | ✅ Mantenimiento | 2 |
| **S001** | ❌ No (es agente) | ✅ "Asistente Grupo Salfacorp" | ✅ Gestión Bodegas | 2 |
| **S002** | ❌ No (es agente) | ✅ "Asistente Grupo Salfacorp" | ✅ Mantenimiento | 2 |
| **SSOMA L1** | ❌ No (es agente) | ✅ "Asistente Grupo Salfacorp" | ✅ Seguridad SSOMA | 2 |
| **KAMKE L2** | ❌ No (es agente) | ✅ "Asistente Grupo Salfacorp" | ✅ Gestión Proyectos | 2 |

---

## 🔍 Ejemplos Concretos

### Ejemplo 1: Usuario Regular (@salfagestion.cl) usa M001

**Prompt Combinado:**
```
=== ORGANIZATION PROMPT ===
Eres el asistente del Grupo Salfacorp.

=== AGENT PROMPT (M001 - Legal Territorial) ===
Soy el Asistente Legal Territorial RDI (M001).
Especializado en:
- Normativa de construcción...
[prompt completo de M001]
```

**Tokens:** ~2,000

---

### Ejemplo 2: Usuario Regular (@salfagestion.cl) usa Ally

**Prompt Combinado:**
```
=== SUPER PROMPT (Platform) ===
Eres **Ally**, el asistente personal de IA...
[SuperPrompt completo]

=== ORGANIZATION PROMPT ===
Eres el asistente del Grupo Salfacorp.

=== DOMAIN PROMPT (Ally-specific) ===
Contexto para Ally en salfagestion.cl:
- Usuarios de Gestión Territorial
- Agentes disponibles: M001, M003, S001
- Expertise en normativas de construcción
```

**Tokens:** ~6,000

---

### Ejemplo 3: SuperAdmin (alec@getaifactory.com) usa M001 de Salfa Corp

**Aplicación de Regla Especial:**
```
IF alec@getaifactory.com USA agente de org != AI Factory:
  
  Organization Prompt: "Eres el asistente del Grupo Salfacorp."
  Agent Prompt: [Prompt de M001]
  SuperPrompt: NO (es agente, no Ally)
```

**Resultado:** Alec ve **exactamente** lo mismo que un usuario de Salfa Corp vería.

**Tokens:** ~2,000

---

## 📦 Implementación Propuesta

### Configuración en Firestore:

#### 1. Organization: `salfa-corp`

```javascript
{
  id: 'salfa-corp',
  name: 'Salfa Corp',
  domains: ['salfagestion.cl', 'salfa.cl', 'maqsa.cl'],
  primaryDomain: 'salfagestion.cl',
  
  // ✅ NUEVO: Organization Prompt simple
  allyConfig: {
    organizationPrompt: 'Eres el asistente del Grupo Salfacorp.'
  }
}
```

---

#### 2. Agent Prompts (ya configurados)

Cada agente tiene su propio `agentPrompt`:

- **M001:** Prompt de Legal Territorial
- **M003:** Prompt de Mantenimiento
- **S001:** Prompt de Gestión de Bodegas
- **S002:** Prompt de Mantenimiento
- **SSOMA L1:** Prompt de Seguridad
- **KAMKE L2:** Prompt de Gestión

---

#### 3. Ally Agent (agente especial)

```javascript
{
  id: 'ally-agent-id',
  title: 'Ally',
  isAlly: true,
  agentPrompt: `Soy Ally, tu asistente personal.
  
Te ayudo a:
- Navegar la plataforma Flow
- Recomendar el agente correcto para tu consulta
- Gestionar tus conversaciones
- Entender funcionalidades

NO soy un agente técnico especializado.
Para preguntas técnicas, te redirijo al agente apropiado (M001, M003, etc.).`
}
```

---

## 🎯 Lógica de Combinación de Prompts

### Para Ally:
```typescript
if (agentId === allyConversationId || conversation.isAlly) {
  // Ally conversation
  return combinedPrompt = [
    SuperPrompt,           // Platform-wide Ally guidance
    OrganizationPrompt,    // "Eres el asistente del Grupo Salfacorp"
    AllyAgentPrompt        // Ally-specific behavior
  ].filter(Boolean).join('\n\n');
}
```

### Para Agentes Regulares (M001, M003, etc.):
```typescript
else {
  // Regular agent conversation
  return combinedPrompt = [
    OrganizationPrompt,    // "Eres el asistente del Grupo Salfacorp"
    AgentPrompt            // Agent-specific (M001, M003, etc.)
  ].filter(Boolean).join('\n\n');
  
  // NO SuperPrompt para agentes regulares
}
```

---

## 🚀 Script de Implementación

Déjame crear un script que configure todo esto:

```typescript
// scripts/configure-prompts-salfa-corp.ts

// 1. Update Salfa Corp organization
await firestore.collection('organizations').doc('salfa-corp').update({
  allyConfig: {
    organizationPrompt: 'Eres el asistente del Grupo Salfacorp.',
    promptEnabled: true,
  }
});

// 2. Update Ally agent with specific prompt
await firestore.collection('conversations').doc(allyAgentId).update({
  agentPrompt: `Soy Ally, tu asistente personal en Flow...`
});

// 3. Ensure M001, M003, etc. have their agent prompts
// (Ya están configurados)
```

---

## 📈 Impacto por Usuario

### Usuario: alec@getaifactory.com (SuperAdmin)

| Usa Agente | Org Prompt | Domain/Agent Prompt | SuperPrompt | Total |
|------------|------------|---------------------|-------------|-------|
| **Ally** | ❌ N/A | Ally | ✅ Platform | 2 layers |
| **M001** (Salfa) | ✅ "Asistente Grupo Salfacorp" | Legal Territorial | ❌ No | 2 layers |
| **M003** (Salfa) | ✅ "Asistente Grupo Salfacorp" | Mantenimiento MAQSA | ❌ No | 2 layers |

**Efecto:** Cuando Alec usa agentes de Salfa Corp, ve contexto de Salfa Corp.

---

### Usuario: sorellanac@salfagestion.cl (Admin)

| Usa Agente | Org Prompt | Domain/Agent Prompt | SuperPrompt | Total |
|------------|------------|---------------------|-------------|-------|
| **Ally** | ✅ "Asistente Grupo Salfacorp" | Ally | ✅ Platform | 3 layers |
| **M001** | ✅ "Asistente Grupo Salfacorp" | Legal Territorial | ❌ No | 2 layers |
| **M003** | ✅ "Asistente Grupo Salfacorp" | Mantenimiento MAQSA | ❌ No | 2 layers |

**Efecto:** Siempre ve "Eres el asistente del Grupo Salfacorp" + prompt del agente.

---

### Usuario: usuario@salfagestion.cl (User)

| Usa Agente | Org Prompt | Domain/Agent Prompt | SuperPrompt | Total |
|------------|------------|---------------------|-------------|-------|
| **Ally** | ✅ "Asistente Grupo Salfacorp" | Ally prompt | ✅ Platform | 3 layers |
| **M001** | ✅ "Asistente Grupo Salfacorp" | M001 Legal | ❌ No | 2 layers |

**Efecto:** Experiencia consistente con contexto de Salfa Corp.

---

## 🎨 Prompts Específicos por Agente

### Ally (Personal Assistant)

```
Soy Ally, tu asistente personal en Flow.

ESPECIALIDADES:
- Guía sobre la plataforma
- Recomendación de agentes
- Gestión de conversaciones
- Onboarding de usuarios

RECORDAR:
- Últimas 10 mensajes de la conversación actual
- Organization prompt del usuario
- Domain del usuario

ESTILO:
- Amigable y conciso
- Recomendar agentes apropiados
- No responder preguntas técnicas (redirigir)
```

---

### M001 - Legal Territorial RDI

```
Soy el Asistente Legal Territorial RDI (M001).

ESPECIALIDADES:
- Normativa de construcción
- Permisos de edificación
- Regulaciones territoriales
- LGUC y ordenanzas municipales

FUENTES:
- Documentos legales subidos
- Ley General de Urbanismo
- Ordenanzas específicas

ESTILO:
- Técnico y preciso
- Citar siempre fuentes [1], [2]
- Recomendar validación con experto legal
```

---

### M003 - Mantenimiento MAQSA

```
Soy el Asistente de Mantenimiento MAQSA (M003).

ESPECIALIDADES:
- Mantenimiento de maquinaria pesada
- Procedimientos técnicos
- Diagnóstico de fallas
- Protocolos SSOMA

FUENTES:
- Manuales de equipos
- Procedimientos de mantenimiento
- Órdenes de trabajo

ESTILO:
- Técnico y detallado
- Paso a paso para procedimientos
- Citar documentos [1], [2]
```

---

### S001 - Gestión de Bodegas

```
Soy el Asistente de Gestión de Bodegas (S001).

ESPECIALIDADES:
- Control de inventarios
- Logística de almacenamiento
- Movimientos de stock
- Procedimientos de bodega

FUENTES:
- Procedimientos de inventario
- Sistemas de gestión
- Protocolos de almacenaje

ESTILO:
- Operacional y práctico
- Procedimientos claros
- Citar fuentes [1], [2]
```

---

## 🔄 Flujo de Aplicación

### Cuando Usuario Envía Mensaje:

```javascript
// 1. Detectar tipo de conversación
const isAllyConversation = conversation.isAlly || conversation.agentId === allyId;

// 2. Si es Ally → 3 layers
if (isAllyConversation) {
  prompts = [
    getSuperPrompt(),                    // Platform-wide
    getOrganizationPrompt(user.org),     // "Asistente Grupo Salfacorp"
    getAllyAgentPrompt()                 // Ally-specific
  ];
}

// 3. Si es agente regular → 2 layers
else {
  prompts = [
    getOrganizationPrompt(user.org),     // "Asistente Grupo Salfacorp"
    getAgentPrompt(agentId)              // M001, M003, etc.
  ];
}

// 4. Combinar
const finalPrompt = prompts.filter(Boolean).join('\n\n---\n\n');
```

---

## 🎯 Casos de Uso

### Caso 1: Usuario de Salfa pregunta a Ally sobre plataforma

**Prompt Final:**
1. SuperPrompt: Ally Platform (~4,500 chars)
2. Organization: "Eres el asistente del Grupo Salfacorp." (~50 chars)
3. Ally Agent: "Soy Ally, tu asistente personal..." (~500 chars)

**Total:** ~5,050 chars (~1,263 tokens)

**Respuesta:** Ally responde con contexto de Salfa Corp y conocimiento de plataforma.

---

### Caso 2: Usuario de Salfa pregunta a M001 sobre permisos

**Prompt Final:**
1. Organization: "Eres el asistente del Grupo Salfacorp." (~50 chars)
2. M001 Agent: "Soy el Asistente Legal..." (~800 chars)

**Total:** ~850 chars (~213 tokens)

**Respuesta:** M001 responde como experto legal con contexto de Salfa Corp.

---

### Caso 3: SuperAdmin (Alec) usa M001 para debug

**Aplicación de Regla:**
- Alec está en org "AI Factory"
- M001 está en org "Salfa Corp"
- Por lo tanto: Usa prompts de Salfa Corp

**Prompt Final:**
1. Organization: "Eres el asistente del Grupo Salfacorp."
2. M001 Agent: "Soy el Asistente Legal..."

**Total:** ~850 chars

**Beneficio:** Alec ve EXACTAMENTE lo que usuarios de Salfa ven.

---

## 📂 Archivos a Crear/Modificar

### 1. Configurar Organization Prompt
```bash
# Script nuevo
npx tsx scripts/update-salfa-corp-org-prompt.ts
```

### 2. Configurar Prompts de Agentes
```bash
# Ya están en agent_configs collection
# Solo verificar que existan
```

### 3. Configurar Ally Agent Prompt
```bash
# Actualizar conversación de Ally con agentPrompt
```

---

## ✅ Próximos Pasos

¿Quieres que implemente esto?

**Necesitaría:**

1. **Crear script:** `scripts/configure-salfa-corp-prompts.ts`
   - Update organization prompt: "Eres el asistente del Grupo Salfacorp."
   - Update Ally
   - Verify agent prompts exist

2. **Modificar lógica de combinación** en `messages-stream.ts`
   - SuperPrompt solo para Ally
   - Organization prompt para todos
   - Agent prompt según agente activo

3. **Agregar regla de SuperAdmin**
   - Si superadmin usa agente de otra org → usa prompts de esa org

---

**¿Procedo con la implementación?** 🚀

O prefieres revisar primero los prompts específicos de cada agente antes de implementar.

