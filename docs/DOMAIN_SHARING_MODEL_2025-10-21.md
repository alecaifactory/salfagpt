# 🏗️ Modelo de Compartición por Dominio - Arquitectura Definitiva

**Fecha:** 2025-10-21  
**Estado:** 📋 DISEÑO APROBADO  
**Próximo:** Implementación

---

## 🎯 Modelo de Compartición Definido

### Regla de Oro
> **"Agentes son privados por usuario. Todo lo demás es compartido por dominio."**

---

## 📦 Recursos por Tipo

### 1. AGENTES (Privados por Usuario)

**Modelo:**
```typescript
Agent/Conversation {
  id: string;
  userId: string;        // Dueño/creador
  domain: string;        // Dominio del creador
  isAgent: true;
  visibility: 'private'; // Por defecto
  
  // Compartición opcional
  sharedWith: ShareTarget[];
}

ShareTarget {
  type: 'user' | 'group';
  id: string;           // userId o groupId
  domain: string;       // MUST match agent.domain
  accessLevel: 'view' | 'edit' | 'admin';
  sharedAt: Date;
  sharedBy: string;     // userId del que compartió
}
```

**Reglas:**
- ✅ Creado por usuario individual
- ✅ Privado por defecto (solo creador lo ve)
- ✅ Puede compartirse con usuarios del MISMO dominio
- ✅ Puede compartirse con grupos del MISMO dominio
- ❌ NO puede compartirse con otro dominio
- ❌ Admin NO puede forzar compartición cross-domain

**Flujo de Compartición:**
```
1. Usuario crea agente → private
2. Usuario abre configuración de agente
3. Click "Compartir"
4. Modal muestra:
   - Usuarios del mismo dominio
   - Grupos del mismo dominio
5. Usuario selecciona destinatarios
6. Selecciona nivel de acceso (view/edit/admin)
7. Click "Compartir"
   → sharedWith actualizado
   → Usuarios/grupos reciben acceso
```

---

### 2. CONTEXTOS / FUENTES DE CONTEXTO (Compartidos por Dominio)

**Modelo:**
```typescript
ContextSource {
  id: string;
  userId: string;        // Creador original (para auditoría)
  domain: string;        // Dominio al que pertenece
  visibility: 'domain';  // Visible para todo el dominio
  
  // Compartición adicional (opcional)
  sharedWith?: ShareTarget[];
  
  // Permisos
  permissions: {
    canView: 'all_domain' | 'specific';    // Por defecto: all_domain
    canEdit: 'creator' | 'group' | 'all_domain';
    canDelete: 'creator' | 'admin';
    canShare: 'creator' | 'admin';
  };
}
```

**Reglas:**
- ✅ Creado por usuario pero pertenece al dominio
- ✅ Visible para TODOS los usuarios del dominio
- ✅ Puede compartirse con usuarios específicos (mismo dominio)
- ✅ Puede compartirse con grupos (mismo dominio)
- ❌ NO cross-domain sharing
- ✅ Permisos configurables (quién puede editar/eliminar)

**Filtrado:**
```typescript
// Obtener contextos del dominio del usuario
async function getContextSources(userId: string) {
  const user = await getUser(userId);
  const userDomain = getDomainFromEmail(user.email);
  
  // Todos los contextos del dominio
  const snapshot = await firestore
    .collection('context_sources')
    .where('domain', '==', userDomain)
    .orderBy('addedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data());
}
```

---

### 3. CONVERSACIONES (Compartidas por Dominio)

**Modelo:**
```typescript
Conversation {
  id: string;
  userId: string;        // Creador
  domain: string;        // Dominio
  isAgent: false;        // Es conversación, no agente
  agentId?: string;      // Agente asociado (si aplica)
  visibility: 'domain';  // Todos en dominio
  
  // Compartición adicional
  sharedWith?: ShareTarget[];
}
```

**Reglas:**
- ✅ Visible para todos en el dominio
- ✅ Compartición adicional opcional
- ❌ No cross-domain

---

### 4. CONFIGURACIONES (Por Dominio)

**Modelo:**
```typescript
DomainConfiguration {
  id: string;            // domainId
  domain: string;
  
  // Configuraciones globales del dominio
  defaultModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  defaultSystemPrompt: string;
  allowedModels: string[];
  
  // Features habilitadas
  features: {
    canCreateAgents: boolean;
    canUploadContext: boolean;
    canShareAgents: boolean;
    maxAgentsPerUser: number;
    maxContextSources: number;
  };
}

UserConfiguration {
  id: string;
  userId: string;
  domain: string;
  
  // Override personal (opcional)
  preferredModel?: string;
  customSystemPrompt?: string;
}
```

**Jerarquía:**
```
Usuario usa: User Config → Domain Config → System Default
```

---

## 👥 Sistema de Grupos

### Modelo de Grupos

**Colección: `groups`**
```typescript
Group {
  id: string;
  name: string;          // ej: "Equipo de Ventas"
  domain: string;        // ej: "getaifactory.com"
  description?: string;
  
  // Miembros
  members: string[];     // userIds del mismo dominio
  
  // Permisos del grupo
  permissions: {
    canCreateAgents: boolean;
    canUploadContext: boolean;
    canValidateContext: boolean;
    // ...más permisos
  };
  
  // Metadata
  createdBy: string;     // Admin que creó el grupo
  createdAt: Date;
  updatedAt: Date;
}
```

**Reglas de Grupos:**
- ✅ Creados por admin
- ✅ Solo usuarios del MISMO dominio pueden ser miembros
- ✅ Grupos NO pueden tener miembros cross-domain
- ✅ Un usuario puede estar en múltiples grupos
- ✅ Permisos de grupo se suman a permisos de usuario

---

### Uso de Grupos en Compartición

**Ejemplo: Compartir Agente con Grupo**
```typescript
// Admin crea grupo
Group {
  id: "grupo-ventas-001",
  name: "Equipo de Ventas",
  domain: "getaifactory.com",
  members: [
    "usuario1@getaifactory.com",
    "usuario2@getaifactory.com",
    "usuario3@getaifactory.com"
  ]
}

// Usuario comparte agente con grupo
Agent {
  id: "agente-001",
  userId: "alec@getaifactory.com",
  domain: "getaifactory.com",
  sharedWith: [
    {
      type: 'group',
      id: 'grupo-ventas-001',
      domain: 'getaifactory.com',
      accessLevel: 'view'
    }
  ]
}

// Resultado:
// - usuario1, usuario2, usuario3 pueden VER el agente
// - Solo pueden ver (no editar)
// - Agente sigue siendo del creador original
```

---

## 🔒 Validaciones de Seguridad

### Validación 1: Compartición Solo Dentro del Dominio

```typescript
async function shareAgent(
  agentId: string,
  targetUserId: string,
  shareLevel: 'view' | 'edit' | 'admin'
) {
  // 1. Get agent
  const agent = await getAgent(agentId);
  
  // 2. Get target user
  const targetUser = await getUser(targetUserId);
  
  // 3. CRITICAL: Verify same domain
  const targetDomain = getDomainFromEmail(targetUser.email);
  
  if (agent.domain !== targetDomain) {
    throw new Error('Cannot share outside of domain');
  }
  
  // 4. Add to sharedWith
  await updateAgent(agentId, {
    sharedWith: [
      ...agent.sharedWith,
      {
        type: 'user',
        id: targetUserId,
        domain: targetDomain,
        accessLevel: shareLevel,
        sharedAt: new Date(),
        sharedBy: currentUser.id,
      }
    ]
  });
}
```

---

### Validación 2: Grupos Solo Dentro del Dominio

```typescript
async function createGroup(
  name: string,
  domain: string,
  memberEmails: string[]
) {
  // Verify all members are from same domain
  for (const email of memberEmails) {
    const memberDomain = getDomainFromEmail(email);
    
    if (memberDomain !== domain) {
      throw new Error(`Cannot add ${email} - different domain (${memberDomain} vs ${domain})`);
    }
  }
  
  // Create group
  const group = await firestore.collection('groups').add({
    name,
    domain,
    members: memberEmails,
    createdAt: new Date(),
  });
  
  return group;
}
```

---

## 📊 Matriz de Recursos

| Recurso | Filtrado Por | Compartición | Cross-Domain |
|---------|--------------|--------------|--------------|
| **Agentes** | userId | Usuario/Grupo en mismo dominio | ❌ NO |
| **Contextos** | domain | Usuario/Grupo en mismo dominio | ❌ NO |
| **Conversaciones** | domain | Usuario/Grupo en mismo dominio | ❌ NO |
| **Configuraciones** | domain | N/A (herencia) | ❌ NO |
| **Grupos** | domain | N/A (asignación directa) | ❌ NO |

---

## 🔄 Flujos de Datos

### Flujo 1: Usuario Crea Agente

```
1. Usuario A (alec@getaifactory.com) crea agente
   ↓
2. Agente creado con:
   - userId: alec@getaifactory.com
   - domain: getaifactory.com
   - visibility: private
   - sharedWith: []
   ↓
3. Solo Usuario A lo ve inicialmente
   ↓
4. Usuario A puede compartir con:
   - Usuario B (hello@getaifactory.com) ✅ mismo dominio
   - Grupo "Ventas" (getaifactory.com) ✅ mismo dominio
   - Usuario C (user@salfacloud.cl) ❌ diferente dominio
```

---

### Flujo 2: Usuario Sube Contexto

```
1. Usuario A (alec@getaifactory.com) sube PDF
   ↓
2. Contexto creado con:
   - userId: alec@getaifactory.com (creador)
   - domain: getaifactory.com
   - visibility: domain
   ↓
3. TODOS en getaifactory.com lo ven automáticamente:
   - Usuario A ✅
   - Usuario B (hello@getaifactory.com) ✅
   - Usuario C de otro dominio ❌
```

---

### Flujo 3: Admin Crea Grupo

```
1. Admin crea grupo "Equipo Marketing"
   ↓
2. Grupo creado con:
   - name: "Equipo Marketing"
   - domain: getaifactory.com
   - members: [user1@getaifactory.com, user2@getaifactory.com]
   ↓
3. Admin intenta agregar user@salfacloud.cl
   ↓
4. Sistema valida: ❌ Dominio diferente
   ↓
5. Error: "Cannot add user from different domain"
```

---

## 🗄️ Cambios en Schema de Firestore

### Colecciones a Modificar

#### 1. `conversations`
```typescript
// ANTES
{
  userId: string;  // Filtrado actual
}

// DESPUÉS
{
  userId: string;       // Creador (para agentes privados)
  domain: string;       // Dominio del creador
  isAgent: boolean;     // true = privado, false = dominio
  
  // Para agentes
  sharedWith?: ShareTarget[];
}
```

#### 2. `context_sources`
```typescript
// ANTES
{
  userId: string;
}

// DESPUÉS
{
  userId: string;       // Creador original (auditoría)
  domain: string;       // Dominio (filtrado principal)
  visibility: 'domain'; // Todos en dominio lo ven
  
  // Compartición adicional (opcional)
  sharedWith?: ShareTarget[];
  
  permissions: {
    canView: 'all_domain' | 'specific';
    canEdit: 'creator' | 'admin' | 'group';
    canDelete: 'creator' | 'admin';
  };
}
```

#### 3. `messages`
```typescript
// ANTES
{
  conversationId: string;
  userId: string;
}

// DESPUÉS
{
  conversationId: string;
  userId: string;
  domain: string;  // Heredado de conversación
}
```

#### 4. `groups` (NUEVA)
```typescript
Group {
  id: string;
  name: string;
  domain: string;           // 🔒 CRITICAL: Solo un dominio
  description?: string;
  
  members: string[];        // userIds (MUST be same domain)
  
  permissions: {
    canCreateAgents: boolean;
    canUploadContext: boolean;
    canValidateContext: boolean;
    canShareAgents: boolean;
  };
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 5. `agent_shares` (NUEVA)
```typescript
AgentShare {
  id: string;
  agentId: string;
  ownerId: string;          // Creador del agente
  ownerDomain: string;      // Dominio del creador
  
  sharedWith: ShareTarget[];
  
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;         // Compartición temporal
}
```

---

## 🔍 Queries Modificados

### ANTES (Filtrado por userId)

```typescript
// Conversaciones
.where('userId', '==', userId)

// Contextos
.where('userId', '==', userId)

// Mensajes
.where('conversationId', '==', conversationId)
```

### DESPUÉS (Filtrado por domain para recursos compartidos)

```typescript
// AGENTES (privados) - Filtrado por userId + shared
async function getAgentsForUser(userId: string) {
  const user = await getUser(userId);
  const userDomain = getDomainFromEmail(user.email);
  
  // 1. Agentes propios
  const ownAgents = await firestore
    .collection('conversations')
    .where('userId', '==', userId)
    .where('isAgent', '==', true)
    .get();
  
  // 2. Agentes compartidos con el usuario
  const sharedDirect = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .where('sharedWith', 'array-contains', {
      type: 'user',
      id: userId,
      domain: userDomain
    })
    .get();
  
  // 3. Agentes compartidos con grupos del usuario
  const userGroups = await getUserGroups(userId);
  const sharedViaGroups = []; // Query por cada grupo
  
  // Merge all
  return [...ownAgents.docs, ...sharedDirect.docs, ...sharedViaGroups];
}

// CONTEXTOS (compartidos) - Filtrado por domain
async function getContextSources(userId: string) {
  const user = await getUser(userId);
  const userDomain = getDomainFromEmail(user.email);
  
  // Todos los contextos del dominio
  const snapshot = await firestore
    .collection('context_sources')
    .where('domain', '==', userDomain)
    .orderBy('addedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data());
}

// CONVERSACIONES (compartidas) - Filtrado por domain
async function getConversations(userId: string) {
  const user = await getUser(userId);
  const userDomain = getDomainFromEmail(user.email);
  
  // Todas las conversaciones del dominio (no agentes)
  const snapshot = await firestore
    .collection('conversations')
    .where('domain', '==', userDomain)
    .where('isAgent', '==', false) // Excluir agentes
    .orderBy('lastMessageAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data());
}
```

---

## 🚨 Validaciones de Seguridad

### Validación 1: Compartición Solo Dentro de Dominio

```typescript
function validateShareTarget(
  ownerDomain: string,
  targetEmail: string
): boolean {
  const targetDomain = getDomainFromEmail(targetEmail);
  
  if (ownerDomain !== targetDomain) {
    throw new Error(
      `Cannot share: ${targetEmail} is from ${targetDomain}, ` +
      `but resource is from ${ownerDomain}`
    );
  }
  
  return true;
}
```

---

### Validación 2: Grupos Solo del Mismo Dominio

```typescript
function validateGroupMembers(
  groupDomain: string,
  memberEmails: string[]
): boolean {
  for (const email of memberEmails) {
    const memberDomain = getDomainFromEmail(email);
    
    if (memberDomain !== groupDomain) {
      throw new Error(
        `Cannot add ${email}: member domain (${memberDomain}) ` +
        `does not match group domain (${groupDomain})`
      );
    }
  }
  
  return true;
}
```

---

### Validación 3: Admin No Puede Forzar Cross-Domain

```typescript
async function shareAgentAsAdmin(
  adminId: string,
  agentId: string,
  targetUserId: string
) {
  // Get admin and agent
  const admin = await getUser(adminId);
  const agent = await getAgent(agentId);
  const targetUser = await getUser(targetUserId);
  
  // Extract domains
  const agentDomain = agent.domain;
  const targetDomain = getDomainFromEmail(targetUser.email);
  
  // 🔒 CRITICAL: Even admins cannot share cross-domain
  if (agentDomain !== targetDomain) {
    throw new Error(
      'Admin cannot share cross-domain. ' +
      `Agent domain: ${agentDomain}, Target domain: ${targetDomain}`
    );
  }
  
  // Share within domain
  await shareAgent(agentId, targetUserId, 'view');
}
```

---

## 📋 Plan de Implementación

### Fase 1: Migración de Schema (Additive)

**Paso 1:** Agregar campo `domain` a colecciones existentes
```typescript
// Script de migración
async function addDomainToExistingDocuments() {
  // Para cada conversación
  const conversations = await firestore.collection('conversations').get();
  for (const doc of conversations.docs) {
    const data = doc.data();
    const user = await getUser(data.userId);
    const domain = getDomainFromEmail(user.email);
    
    await doc.ref.update({
      domain,
      isAgent: data.isAgent ?? true, // Default: es agente
    });
  }
  
  // Para cada context_source
  const sources = await firestore.collection('context_sources').get();
  for (const doc of sources.docs) {
    const data = doc.data();
    const user = await getUser(data.userId);
    const domain = getDomainFromEmail(user.email);
    
    await doc.ref.update({
      domain,
      visibility: 'domain',
    });
  }
}
```

---

### Fase 2: Implementar Grupos

**Paso 1:** Crear colección `groups`
**Paso 2:** Crear API endpoints de grupos
**Paso 3:** Crear UI de gestión de grupos (admin)

---

### Fase 3: Implementar Compartición de Agentes

**Paso 1:** Agregar `sharedWith` a agentes
**Paso 2:** Crear UI de compartición
**Paso 3:** Modificar queries para incluir agentes compartidos

---

### Fase 4: Modificar Queries de Contextos/Conversaciones

**Paso 1:** Cambiar filtrado de `userId` a `domain`
**Paso 2:** Actualizar UI para mostrar "recursos del dominio"
**Paso 3:** Testing exhaustivo

---

## ⚠️ Consideraciones de Migración

### Usuarios Existentes

**Datos actuales:**
- Conversaciones: filtradas por userId
- Contextos: filtrados por userId
- Cada usuario ve SOLO sus datos

**Después de migración:**
- Conversaciones: filtradas por domain (todos en dominio las ven)
- Contextos: filtrados por domain (todos en dominio los ven)
- Agentes: filtrados por userId + compartición

**Impacto:**
- ⚠️ Usuarios del mismo dominio verán datos de otros usuarios
- ⚠️ Posible confusión si no se comunica bien
- ✅ Pero es el comportamiento deseado (compartición por dominio)

---

## 🎯 Ejemplo Completo

### Escenario: getaifactory.com con 3 usuarios

**Usuarios:**
- Alec (alec@getaifactory.com) - Admin
- Hello (hello@getaifactory.com) - User  
- Test (test@getaifactory.com) - User

---

**Alec crea:**
- Agente "Marketing Bot" (privado)
- Contexto "Producto X" (dominio)
- Conversación "Plan Q1" (dominio)

**Estado inicial:**
```
Agentes:
├─ Marketing Bot (Alec) 
│  └─ Solo Alec lo ve ✅

Contextos del dominio:
├─ Producto X (por Alec)
│  └─ Alec, Hello, Test lo ven ✅

Conversaciones del dominio:
├─ Plan Q1 (por Alec)
│  └─ Alec, Hello, Test la ven ✅
```

---

**Alec comparte "Marketing Bot" con Hello:**
```
Agentes:
├─ Marketing Bot (Alec)
│  ├─ Alec lo ve ✅
│  ├─ Hello lo ve ✅ (compartido)
│  └─ Test NO lo ve ❌
```

---

**Admin crea Grupo "Marketing Team" con [Hello, Test]:**
```
Grupos:
└─ Marketing Team (getaifactory.com)
   └─ members: [Hello, Test]
```

---

**Alec comparte "Marketing Bot" con grupo "Marketing Team":**
```
Agentes:
├─ Marketing Bot (Alec)
│  ├─ Alec lo ve ✅ (dueño)
│  ├─ Hello lo ve ✅ (grupo)
│  └─ Test lo ve ✅ (grupo)
```

---

**Usuario de otro dominio:**
```
Usuario D (user@salfacloud.cl):
├─ NO ve Marketing Bot ❌
├─ NO ve Producto X ❌
├─ NO ve Plan Q1 ❌
└─ Ve solo recursos de salfacloud.cl
```

---

## ✅ Confirmación del Modelo

**Este es el modelo correcto según tu descripción:**

### Por Usuario (Privado)
- ✅ **Agentes** - Privados por defecto, compartición opcional

### Por Dominio (Compartido)
- ✅ **Contextos** - Todos en dominio los ven
- ✅ **Fuentes de Contexto** - Todos en dominio las ven  
- ✅ **Conversaciones** - Todos en dominio las ven
- ✅ **Configuraciones** - Por dominio

### Compartición
- ✅ Solo dentro del mismo dominio
- ✅ Por usuario específico
- ✅ Por grupo (admin crea grupos)
- ❌ NO cross-domain (ni usuario ni admin)

---

## 🚀 ¿Procedo con la Implementación?

**Confirma si este modelo es correcto:**

1. ✅ Agentes privados por usuario (con compartición intra-dominio)
2. ✅ Contextos/Conversaciones compartidos por dominio automáticamente
3. ✅ Grupos por dominio (admin crea, asigna usuarios)
4. ✅ Compartición solo intra-dominio (nunca cross-domain)
5. ✅ Admin NO puede compartir fuera del dominio

**Si es correcto, procedo a implementar todas las fases descritas arriba.**

