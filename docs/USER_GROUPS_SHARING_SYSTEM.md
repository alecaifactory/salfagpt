# Sistema de Grupos y Compartir Agentes - Flow Platform

**Fecha**: 2025-10-21  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado

---

## 🎯 Objetivo

Permitir a los administradores organizar usuarios en grupos y compartir agentes (conversaciones) con múltiples usuarios o grupos simultáneamente, facilitando la colaboración y el control de acceso.

---

## 🏗️ Arquitectura

### Colecciones de Firestore

#### 1. `groups`

```typescript
interface Group {
  id: string;                       // Document ID
  name: string;                     // Nombre del grupo
  description?: string;             // Descripción opcional
  type: 'department' | 'team' | 'project' | 'custom';
  members: string[];                // Array de user IDs - SOLO rol 'user'
  createdBy: string;                // User ID del creador
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  maxAccessLevel: 'view' | 'use';   // NUNCA 'admin'
  source?: 'localhost' | 'production';
}
```

**⚠️ RESTRICCIONES CRÍTICAS**:
- ✅ Solo usuarios con rol `'user'` pueden ser miembros
- ❌ Usuarios con roles elevados (expert, admin, etc.) NO pueden agregarse
- ✅ `maxAccessLevel` puede ser `'view'` o `'use'` solamente
- ❌ Los grupos NUNCA pueden tener acceso `'admin'` a agentes

**Ejemplos**:
- `name: "Equipo de Ventas"`, `type: "team"`, `maxAccessLevel: "use"`
- `name: "Departamento Legal"`, `type: "department"`, `maxAccessLevel: "use"`
- `name: "Proyecto Minería 2025"`, `type: "project"`, `maxAccessLevel: "view"`

**Índices requeridos**:
```
- createdAt DESC
- members array-contains, isActive ASC
```

---

#### 2. `agent_shares`

```typescript
interface AgentShare {
  id: string;                       // Document ID
  agentId: string;                  // Conversation ID del agente compartido
  ownerId: string;                  // User ID del propietario original
  sharedWith: Array<{
    type: 'user' | 'group';
    id: string;                     // User ID o Group ID
  }>;
  accessLevel: 'view' | 'edit' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;                 // Opcional: fecha de expiración
  source?: 'localhost' | 'production';
}
```

**Niveles de Acceso**:
- **`view`**: Solo ver mensajes, no puede enviar nuevos
- **`edit`**: Ver y enviar mensajes, usar el agente
- **`admin`**: Control total (editar, compartir, eliminar)

**Índices requeridos**:
```
- agentId ASC
- ownerId ASC, createdAt DESC
```

---

## 📡 API Endpoints

### Grupos

#### `GET /api/groups`
Obtener todos los grupos (admin only)

**Response**:
```json
{
  "groups": [
    {
      "id": "group-123",
      "name": "Equipo de Ventas",
      "type": "team",
      "members": ["user-1", "user-2"],
      "createdBy": "admin-id",
      "createdAt": "2025-10-21T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/groups`
Crear un nuevo grupo

**Request**:
```json
{
  "name": "Equipo de Ventas",
  "description": "Equipo responsable de ventas",
  "type": "team",
  "createdBy": "admin-user-id",
  "members": ["user-1", "user-2"]
}
```

**Response**:
```json
{
  "group": {
    "id": "group-123",
    "name": "Equipo de Ventas",
    ...
  }
}
```

---

#### `GET /api/groups/:id`
Obtener un grupo específico

**Response**:
```json
{
  "group": {
    "id": "group-123",
    "name": "Equipo de Ventas",
    "members": ["user-1", "user-2"],
    ...
  }
}
```

---

#### `PUT /api/groups/:id`
Actualizar un grupo

**Request**:
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "type": "department"
}
```

---

#### `DELETE /api/groups/:id`
Eliminar un grupo

**Nota**: Los shares existentes se mantienen, solo se elimina el grupo.

---

#### `POST /api/groups/:id/members`
Agregar miembro a un grupo

**Request**:
```json
{
  "userId": "user-3"
}
```

---

#### `DELETE /api/groups/:id/members?userId={userId}`
Remover miembro de un grupo

---

### Compartir Agentes

#### `GET /api/agents/:id/share`
Obtener todos los shares de un agente

**Response**:
```json
{
  "shares": [
    {
      "id": "share-123",
      "agentId": "agent-456",
      "ownerId": "user-1",
      "sharedWith": [
        { "type": "group", "id": "group-123" },
        { "type": "user", "id": "user-2" }
      ],
      "accessLevel": "view",
      "createdAt": "2025-10-21T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/agents/:id/share`
Compartir un agente

**Request**:
```json
{
  "ownerId": "user-1",
  "sharedWith": [
    { "type": "group", "id": "group-123" },
    { "type": "user", "id": "user-2" }
  ],
  "accessLevel": "view",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

---

#### `PUT /api/agents/:id/share`
Actualizar un share existente

**Request**:
```json
{
  "shareId": "share-123",
  "updates": {
    "accessLevel": "edit",
    "expiresAt": "2026-01-31T23:59:59Z"
  }
}
```

---

#### `DELETE /api/agents/:id/share?shareId={shareId}`
Revocar un share

---

#### `GET /api/agents/shared?userId={userId}`
Obtener todos los agentes compartidos con un usuario

**Response**:
```json
{
  "agents": [
    {
      "id": "agent-456",
      "title": "Agente Legal",
      "userId": "user-1",
      "isShared": true,
      ...
    }
  ]
}
```

---

## 🎨 Componentes UI

### 1. GroupManagementPanel

**Ubicación**: `src/components/GroupManagementPanel.tsx`

**Props**:
```typescript
interface GroupManagementPanelProps {
  currentUser: User;
  onClose: () => void;
}
```

**Funcionalidades**:
- ✅ Ver lista de todos los grupos
- ✅ Crear nuevo grupo
- ✅ Editar grupo (nombre, descripción, tipo)
- ✅ Eliminar grupo
- ✅ Ver miembros de cada grupo
- ✅ Agregar miembros a grupo
- ✅ Remover miembros de grupo
- ✅ Buscar grupos
- ✅ Filtrar por tipo

**Layout**:
```
┌──────────────────────────────────────────┐
│  Gestión de Grupos                   [X]│
├─────────────────┬────────────────────────┤
│                 │                        │
│  GRUPOS (50%)   │  DETALLES (50%)        │
│                 │                        │
│  [Buscar...]    │  Grupo Seleccionado    │
│  [Crear Grupo]  │  - Nombre              │
│                 │  - Descripción         │
│  • Ventas       │  - Tipo                │
│  • Legal        │  - Miembros            │
│  • Minería      │    • User 1 [X]        │
│                 │    • User 2 [X]        │
│                 │  [+ Agregar Miembro]   │
│                 │                        │
└─────────────────┴────────────────────────┘
```

---

### 2. AgentSharingModal

**Ubicación**: `src/components/AgentSharingModal.tsx`

**Props**:
```typescript
interface AgentSharingModalProps {
  agent: Conversation;
  currentUser: User;
  onClose: () => void;
  onShareUpdated?: () => void;
}
```

**Funcionalidades**:
- ✅ Compartir con grupos
- ✅ Compartir con usuarios individuales
- ✅ Seleccionar nivel de acceso (view/edit/admin)
- ✅ Establecer fecha de expiración (opcional)
- ✅ Ver shares existentes
- ✅ Revocar shares
- ✅ Buscar grupos/usuarios

**Layout**:
```
┌──────────────────────────────────────────┐
│  Compartir Agente: {título}          [X]│
├─────────────────┬────────────────────────┤
│                 │                        │
│  COMPARTIR      │  ACCESOS COMPARTIDOS   │
│                 │                        │
│  [Grupos/Users] │  • Grupo Ventas        │
│                 │    Solo ver            │
│  [Buscar...]    │    [X Revocar]         │
│                 │                        │
│  ☐ Ventas       │  • User: María         │
│  ☐ Legal        │    Editar              │
│  ☑ Minería      │    [X Revocar]         │
│                 │                        │
│  Nivel:         │                        │
│  ◉ Solo ver     │                        │
│  ○ Editar       │                        │
│  ○ Admin        │                        │
│                 │                        │
│  [📅 Expira]    │                        │
│                 │                        │
│  [Compartir]    │                        │
└─────────────────┴────────────────────────┘
```

---

## 🔄 Flujo de Uso

### Caso 1: Admin crea grupo y comparte agente

```
1. Admin abre Panel de Administración
   ↓
2. Click en tab "Grupos"
   ↓
3. Click "Gestionar Grupos"
   ↓
4. Click "Crear Grupo"
   ↓
5. Completa form:
   - Nombre: "Equipo Legal"
   - Tipo: "team"
   - Miembros: Selecciona 3 usuarios
   ↓
6. Click "Crear Grupo"
   ↓
7. Grupo creado y visible en lista ✅
   ↓
8. Admin vuelve a lista de agentes
   ↓
9. Hover sobre agente → Click botón "Compartir" (Share2 icon)
   ↓
10. Modal de compartir se abre
   ↓
11. Selecciona tab "Grupos"
   ↓
12. Busca "Legal"
   ↓
13. Marca checkbox "Equipo Legal"
   ↓
14. Selecciona nivel: "Editar"
   ↓
15. (Opcional) Establece expiración
   ↓
16. Click "Compartir Agente"
   ↓
17. Share creado en Firestore
   ↓
18. Los 3 usuarios del grupo ahora ven el agente ✅
```

---

### Caso 2: Usuario ve agente compartido

```
1. User A (miembro de "Equipo Legal") hace login
   ↓
2. Sistema carga:
   - Agentes propios
   - Agentes compartidos vía grupos
   - Agentes compartidos directamente
   ↓
3. En lista de agentes, User A ve:
   - "Mi Agente Personal" (propio)
   - "Agente Legal" [Compartido] (del grupo)
   ↓
4. Click en "Agente Legal"
   ↓
5. Sistema verifica permiso:
   - User A está en "Equipo Legal" ✅
   - Nivel de acceso: "edit" ✅
   ↓
6. Agente se carga normalmente
   ↓
7. User A puede:
   - ✅ Ver mensajes
   - ✅ Enviar mensajes (porque tiene "edit")
   - ❌ Compartir (no tiene "admin")
   - ❌ Eliminar (no tiene "admin")
```

---

## 🔐 Control de Acceso

### Verificación de Permisos

**Función**: `userHasAccessToAgent(userId, agentId)`

**Lógica**:
```typescript
1. ¿Usuario es dueño? → { hasAccess: true, accessLevel: 'admin' }
2. Si no, buscar shares del agente
3. Para cada share:
   a. ¿Está expirado? → Skip
   b. ¿Compartido directamente con user? → Return access
   c. ¿Usuario está en grupo compartido? → Return access
4. Si no hay match → { hasAccess: false }
```

**Ejemplo**:
```typescript
const access = await userHasAccessToAgent('user-123', 'agent-456');

if (!access.hasAccess) {
  return { error: 'No tienes acceso a este agente' };
}

if (access.accessLevel === 'view') {
  // Solo lectura
} else if (access.accessLevel === 'edit') {
  // Lectura y escritura
} else if (access.accessLevel === 'admin') {
  // Control total
}
```

---

### Niveles de Acceso

| Nivel | Ver Mensajes | Enviar Mensajes | Editar Config | Compartir | Eliminar | Permitido Para |
|------|-------------|----------------|--------------|----------|----------|----------------|
| **view** | ✅ | ❌ | ❌ | ❌ | ❌ | Grupos, Usuarios |
| **use** | ✅ | ✅ | ❌ | ❌ | ❌ | Grupos, Usuarios |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | **Solo Usuarios Individuales** |

**IMPORTANTE**:
- ⚠️ **Grupos NUNCA pueden tener nivel 'admin'**
- ✅ Grupos solo pueden tener: 'view' o 'use'
- ✅ Para dar 'admin', comparte con usuarios individuales
- ⚠️ Los grupos NO pueden elevar permisos de sus miembros

---

## 🎨 UI/UX

### AdminPanel - Tab de Grupos

**Ubicación**: Panel de Administración → Tab "Grupos"

**Vista**:
```
┌──────────────────────────────────────────┐
│  [Usuarios] [Grupos]                     │
│                                          │
│  👥 Gestión de Grupos                    │
│                                          │
│  Crea y gestiona grupos de usuarios      │
│  para compartir agentes de forma         │
│  organizada.                             │
│                                          │
│  [Abrir Gestión de Grupos]              │
└──────────────────────────────────────────┘
```

---

### Botón de Compartir en Agentes

**Ubicación**: Lista de agentes (sidebar izquierdo)

**Apariencia**:
- Icono: Share2 (verde)
- Visible: Solo en hover
- Solo para agentes propios (no compartidos)
- Tooltip: "Compartir Agente"

**Acción**:
- Click → Abre `AgentSharingModal`

---

### Badge de "Compartido"

**Ubicación**: Al lado del nombre del agente

**Apariencia**:
```html
<span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] rounded-full font-semibold">
  Compartido
</span>
```

**Visible**: Solo en agentes que fueron compartidos CON el usuario actual

---

## 🔄 Flujos Completos

### Flujo 1: Crear Grupo y Compartir Agente

```bash
# 1. Admin crea grupo
POST /api/groups
{
  "name": "Equipo Legal",
  "type": "team",
  "createdBy": "admin-123",
  "members": ["user-1", "user-2", "user-3"]
}

# 2. Admin comparte agente con grupo
POST /api/agents/agent-456/share
{
  "ownerId": "admin-123",
  "sharedWith": [
    { "type": "group", "id": "group-legal" }
  ],
  "accessLevel": "edit"
}

# 3. User-1 carga sus agentes
GET /api/conversations?userId=user-1
→ Retorna agentes propios

GET /api/agents/shared?userId=user-1
→ Retorna agentes compartidos (incluyendo agent-456)

# 4. User-1 ve agente compartido en su lista ✅
```

---

### Flujo 2: Usuario Intenta Acceder a Agente

```typescript
// Frontend: User-1 click en agente compartido
onClick={() => setCurrentConversation('agent-456')}

// Backend verifica acceso
const access = await userHasAccessToAgent('user-1', 'agent-456');

if (access.hasAccess) {
  // Cargar mensajes
  const messages = await getMessages('agent-456');
  
  // UI muestra botones según accessLevel
  if (access.accessLevel === 'view') {
    // Deshabilitar input de enviar mensaje
  } else if (access.accessLevel === 'edit') {
    // Habilitar enviar mensaje
  } else if (access.accessLevel === 'admin') {
    // Habilitar todo
  }
}
```

---

## 📊 Escenarios de Uso

### Escenario 1: Departamento Legal

**Configuración**:
- Grupo: "Departamento Legal"
- Miembros: 5 abogados
- Agente compartido: "Asistente Legal"
- Nivel de acceso: "edit"

**Resultado**:
- Los 5 abogados pueden usar el agente
- Pueden enviar mensajes y obtener respuestas
- No pueden cambiar configuración del agente
- Solo el creador puede compartir con otros

---

### Escenario 2: Proyecto Temporal

**Configuración**:
- Grupo: "Proyecto Minería Q1 2025"
- Miembros: 8 personas (ingenieros, gerentes)
- Agente compartido: "Agente Minería"
- Nivel de acceso: "view"
- Expiración: 2025-03-31

**Resultado**:
- 8 personas pueden VER el agente y sus respuestas
- No pueden enviar mensajes (solo lectura)
- Acceso expira automáticamente al final del Q1
- Útil para compartir conocimiento sin permitir modificación

---

### Escenario 3: Consultor Externo

**Configuración**:
- Compartir directamente con: usuario "consultor@external.com"
- Agente: "Análisis Financiero"
- Nivel de acceso: "view"
- Expiración: En 30 días

**Resultado**:
- Consultor puede ver el agente y respuestas
- No puede modificar nada
- Acceso temporal (se revoca automáticamente)
- No necesita estar en un grupo

---

## 🔒 Seguridad

### Firestore Security Rules

```javascript
// Groups collection
match /groups/{groupId} {
  // Admins pueden leer todos los grupos
  allow read: if isAuthenticated() && isAdmin();
  
  // Miembros pueden leer su grupo
  allow read: if isAuthenticated() && 
              request.auth.uid in resource.data.members;
  
  // Solo admins pueden crear/modificar grupos
  allow create, update, delete: if isAuthenticated() && isAdmin();
}

// Agent shares collection
match /agent_shares/{shareId} {
  // Owners pueden leer/modificar sus shares
  allow read, update, delete: if isAuthenticated() && 
                                resource.data.ownerId == request.auth.uid;
  
  // Owners pueden crear shares
  allow create: if isAuthenticated() && 
                request.resource.data.ownerId == request.auth.uid;
  
  // Usuarios compartidos pueden leer
  allow read: if isAuthenticated() && (
    request.auth.uid in resource.data.sharedWith.map(t => t.id) ||
    isInSharedGroup(request.auth.uid, resource.data.sharedWith)
  );
}
```

---

## 📈 Métricas y Monitoreo

### Métricas por Grupo

```typescript
interface GroupMetrics {
  groupId: string;
  groupName: string;
  memberCount: number;
  sharedAgentsCount: number;      // Cuántos agentes se comparten con este grupo
  totalMessagesFromGroup: number; // Total de mensajes de miembros
  averageUsagePerMember: number;  // Promedio de uso
}
```

### Métricas por Agente Compartido

```typescript
interface SharedAgentMetrics {
  agentId: string;
  agentName: string;
  ownerId: string;
  shareCount: number;              // Cuántas veces se compartió
  uniqueUsersWithAccess: number;   // Usuarios con acceso (vía grupos + directo)
  totalMessagesFromShared: number; // Mensajes de usuarios compartidos
  mostActiveUser: string;          // Usuario más activo con acceso
}
```

---

## 🚀 Mejoras Futuras

### Corto Plazo (1-2 meses)

- [ ] Agregar modal mejorado para agregar miembros (en lugar de prompt)
- [ ] Permitir editar shares existentes (cambiar nivel de acceso)
- [ ] Notificaciones cuando se comparte un agente
- [ ] Historial de cambios en shares
- [ ] Búsqueda avanzada con filtros

### Mediano Plazo (3-6 meses)

- [ ] Roles dentro de grupos (admin de grupo, miembro)
- [ ] Grupos anidados (subgrupos)
- [ ] Templates de grupos (departamentos predefinidos)
- [ ] Invitaciones por email para usuarios externos
- [ ] Aprobación de acceso (request access flow)

### Largo Plazo (6-12 meses)

- [ ] Auditoría completa de accesos
- [ ] Compartir carpetas completas
- [ ] Compartir fuentes de contexto
- [ ] Marketplace de agentes públicos
- [ ] Transferencia de ownership

---

## 🧪 Testing

### Test 1: Crear Grupo

```bash
# Como admin
1. Login como admin@getaifactory.com
2. Abrir Panel Admin
3. Click tab "Grupos"
4. Click "Gestionar Grupos"
5. Click "Crear Grupo"
6. Completar:
   - Nombre: "Test Team"
   - Tipo: "team"
   - Miembros: Seleccionar 2 usuarios
7. Click "Crear Grupo"
8. Verificar grupo aparece en lista ✅
```

---

### Test 2: Compartir Agente con Grupo

```bash
# Como admin
1. En lista de agentes, hover sobre un agente
2. Click icono "Compartir" (Share2)
3. Modal se abre
4. Tab "Grupos" seleccionado
5. Buscar "Test Team"
6. Marcar checkbox
7. Seleccionar nivel "Editar"
8. Click "Compartir Agente"
9. Verificar share aparece en "Accesos Compartidos" ✅
```

---

### Test 3: Usuario Recibe Agente Compartido

```bash
# Como usuario miembro del grupo
1. Login como user del grupo "Test Team"
2. Sistema carga agentes propios
3. Sistema carga agentes compartidos vía grupos
4. Ver agente compartido con badge "Compartido" ✅
5. Click en agente compartido
6. Agente se carga normalmente ✅
7. Puede enviar mensajes (nivel "edit") ✅
8. NO puede ver botón "Compartir" (no es owner) ✅
```

---

### Test 4: Verificar Expiración

```bash
# Como admin
1. Compartir agente con expiración en 1 minuto
2. Usuario puede acceder inmediatamente ✅
3. Esperar 2 minutos
4. Usuario intenta acceder
5. Sistema verifica expiración
6. Acceso denegado ✅
7. Share no aparece en lista de usuario ✅
```

---

## 🐛 Troubleshooting

### Issue 1: Usuario no ve agente compartido

**Diagnóstico**:
```typescript
// 1. Verificar que share existe
const shares = await getAgentShares('agent-id');
console.log('Shares:', shares);

// 2. Verificar que usuario está en grupo
const userGroups = await getUserGroups('user-id');
console.log('User groups:', userGroups);

// 3. Verificar lógica de carga
const sharedAgents = await getSharedAgents('user-id');
console.log('Shared agents:', sharedAgents);
```

**Soluciones**:
- Verificar que `isActive: true` en grupo
- Verificar que share no está expirado
- Verificar que userId está en array de miembros

---

### Issue 2: Grupo no se puede eliminar

**Causa**: Puede haber shares activos referenciando el grupo

**Solución**:
```typescript
// Opción A: Advertir al admin
"Este grupo tiene shares activos. ¿Eliminar de todas formas?"

// Opción B: Limpiar shares primero
const shares = await getAllShares();
const groupShares = shares.filter(s => 
  s.sharedWith.some(t => t.type === 'group' && t.id === groupId)
);

// Remover grupo de sharedWith
for (const share of groupShares) {
  const updatedSharedWith = share.sharedWith.filter(
    t => !(t.type === 'group' && t.id === groupId)
  );
  
  if (updatedSharedWith.length === 0) {
    // Eliminar share completo
    await deleteAgentShare(share.id);
  } else {
    // Actualizar share
    await updateAgentShare(share.id, { sharedWith: updatedSharedWith });
  }
}

// Ahora sí eliminar grupo
await deleteGroup(groupId);
```

---

## 📚 Referencias

### Código

**Backend**:
- `src/lib/firestore.ts` - Funciones CRUD para grupos y shares
- `src/pages/api/groups/` - API endpoints de grupos
- `src/pages/api/agents/[id]/share.ts` - API de compartir agentes
- `src/pages/api/agents/shared.ts` - API de agentes compartidos

**Frontend**:
- `src/components/GroupManagementPanel.tsx` - Gestión de grupos
- `src/components/AgentSharingModal.tsx` - Compartir agentes
- `src/components/AdminPanel.tsx` - Integración en admin
- `src/components/ChatInterfaceWorking.tsx` - Botón compartir y carga de agentes compartidos

### Documentación

- `.cursor/rules/data.mdc` - Esquema de datos
- `.cursor/rules/privacy.mdc` - Consideraciones de privacidad
- `.cursor/rules/userpersonas.mdc` - Roles y permisos
- `.cursor/rules/firestore.mdc` - Operaciones de base de datos

---

## ✅ Checklist de Implementación

### Backend ✅

- [x] Interface `Group` en firestore.ts
- [x] Interface `AgentShare` en firestore.ts
- [x] Constante `COLLECTIONS.AGENT_SHARES`
- [x] Función `createGroup()`
- [x] Función `getAllGroups()`
- [x] Función `getUserGroups()`
- [x] Función `updateGroup()`
- [x] Función `addGroupMember()`
- [x] Función `removeGroupMember()`
- [x] Función `deleteGroup()`
- [x] Función `shareAgent()`
- [x] Función `getAgentShares()`
- [x] Función `getSharedAgents()`
- [x] Función `userHasAccessToAgent()`
- [x] Función `updateAgentShare()`
- [x] Función `deleteAgentShare()`

### API Endpoints ✅

- [x] `GET /api/groups`
- [x] `POST /api/groups`
- [x] `GET /api/groups/:id`
- [x] `PUT /api/groups/:id`
- [x] `DELETE /api/groups/:id`
- [x] `POST /api/groups/:id/members`
- [x] `DELETE /api/groups/:id/members`
- [x] `GET /api/agents/:id/share`
- [x] `POST /api/agents/:id/share`
- [x] `PUT /api/agents/:id/share`
- [x] `DELETE /api/agents/:id/share`
- [x] `GET /api/agents/shared`

### Frontend ✅

- [x] Componente `GroupManagementPanel`
- [x] Componente `AgentSharingModal`
- [x] Integración en `AdminPanel` (tab de grupos)
- [x] Botón compartir en lista de agentes
- [x] Badge "Compartido" para agentes recibidos
- [x] Carga de agentes compartidos en `loadConversations()`
- [x] Estado `showAgentSharingModal`
- [x] Estado `agentToShare`
- [x] Import de `Share2` icon
- [x] Import de `AgentSharingModal`

### Seguridad (Pendiente) ⚠️

- [ ] Firestore Security Rules para `groups`
- [ ] Firestore Security Rules para `agent_shares`
- [ ] Validación de ownership en API endpoints
- [ ] Rate limiting para compartir
- [ ] Auditoría de cambios en shares

### Testing (Pendiente) ⚠️

- [ ] Test: Crear grupo
- [ ] Test: Agregar/remover miembros
- [ ] Test: Compartir agente con grupo
- [ ] Test: Compartir agente con usuario
- [ ] Test: Usuario ve agente compartido
- [ ] Test: Verificar niveles de acceso
- [ ] Test: Expiración de shares
- [ ] Test: Revocar shares

---

## 🎯 Próximos Pasos

### Inmediatos

1. **Deploy de Firestore Security Rules**: Proteger collections `groups` y `agent_shares`
2. **Testing Manual**: Verificar todos los flujos
3. **Documentar en UI**: Agregar tooltips explicativos
4. **Feedback de Usuario**: Obtener input de uso real

### Esta Semana

1. Agregar notificaciones cuando se comparte un agente
2. Mejorar modal de agregar miembros (sin prompt)
3. Agregar búsqueda en lista de shares existentes
4. Permitir editar shares existentes

### Este Mes

1. Dashboard de analytics de shares
2. Auditoría completa de accesos
3. Exportar/importar grupos
4. Templates de grupos comunes

---

## 📝 Notas Técnicas

### Rendimiento

**Optimización de Queries**:
- `getSharedAgents()` hace múltiples queries (grupos del usuario + shares + agentes)
- Para 100 usuarios con 10 grupos cada uno: ~300 queries
- **Solución**: Implementar caching o índices compuestos

**Caching Recomendado**:
```typescript
// Cache user groups por 5 minutos
const userGroupsCache = new Map<string, { groups: Group[]; timestamp: number }>();

export async function getUserGroupsCached(userId: string): Promise<Group[]> {
  const cached = userGroupsCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
    return cached.groups;
  }
  
  const groups = await getUserGroups(userId);
  userGroupsCache.set(userId, { groups, timestamp: now });
  return groups;
}
```

### Escalabilidad

**Límites Actuales**:
- Grupos por usuario: Ilimitado
- Miembros por grupo: Ilimitado (pero query lenta con >100)
- Shares por agente: Ilimitado
- Usuarios por share: Ilimitado

**Límites Recomendados** (para UX):
- Máximo 50 miembros por grupo (UI)
- Máximo 20 shares por agente (UI)
- Máximo 10 targets por share (backend validation)

---

## ✨ Características Destacadas

### 1. Compartir Múltiple

Puedes compartir un agente con múltiples grupos y usuarios en una sola operación:

```typescript
sharedWith: [
  { type: 'group', id: 'legal-team' },
  { type: 'group', id: 'management' },
  { type: 'user', id: 'external-consultant' }
]
```

### 2. Herencia de Permisos

Si un usuario está en múltiples grupos con acceso al mismo agente, se usa el nivel MÁS ALTO:

```
User A está en:
- Grupo Legal (accessLevel: 'view')
- Grupo Admins (accessLevel: 'admin')

→ User A tiene accessLevel: 'admin' ✅
```

### 3. Expiración Automática

Los shares con `expiresAt` se verifican automáticamente:

```typescript
if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
  // Share expirado, skip
}
```

---

## 🎓 Lecciones Aprendidas

### Durante Implementación

1. **Separar grupos de shares**: Grupos son entidades independientes, no mezcladas con permisos
2. **Array de targets**: `sharedWith` como array permite flexibilidad
3. **Type discriminator**: `{ type: 'user' | 'group', id: string }` es claro
4. **isActive flag**: Soft delete para grupos
5. **Badge visual**: "Compartido" indica origen claro

### Decisiones de Diseño

**¿Por qué no usar roles para compartir?**
- Roles son globales (admin, user, etc.)
- Shares son específicos por agente
- Más flexible y granular

**¿Por qué expiración opcional?**
- Algunos shares son permanentes (departamentos)
- Otros son temporales (proyectos, consultores)
- Flexibilidad según caso de uso

**¿Por qué 3 niveles de acceso?**
- `view`: Consulta sin modificación
- `edit`: Uso normal
- `admin`: Delegación completa
- Cubre 95% de casos de uso

---

**Última Actualización**: 2025-10-21  
**Autor**: Alec  
**Estado**: ✅ Implementación Completa  
**Versión**: 1.0.0

---

**Siguiente**: Testing completo y deployment de Security Rules

