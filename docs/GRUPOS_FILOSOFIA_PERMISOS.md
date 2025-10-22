# Filosofía de Permisos: Grupos vs Roles Individuales

**Fecha**: 2025-10-21  
**Versión**: 1.0.0

---

## 🎯 Principio Fundamental

> **Los grupos NO pueden elevar permisos. Solo organizan acceso.**

Los grupos son una herramienta de **organización y compartir**, **NO** de **escalamiento de privilegios**.

---

## 🔐 Jerarquía de Permisos

### Nivel 1: Roles Individuales (Más Alto)

Los usuarios tienen roles asignados individualmente:

```
admin > expert > context_signoff > agent_signoff > ... > user
```

**Estos roles determinan**:
- ✅ Qué puede hacer en el sistema
- ✅ Qué funciones tiene acceso
- ✅ Qué puede administrar

**Ejemplos**:
- **Admin**: Puede gestionar usuarios, ver analytics, todo
- **Expert**: Puede certificar contexto/agentes
- **User**: Puede crear agentes y usar contexto

---

### Nivel 2: Grupos (Solo Organización)

Los grupos son **contenedores** para facilitar compartir:

```typescript
Group {
  name: "Equipo Legal"
  members: ["user-1", "user-2", "user-3"] // Solo usuarios con rol 'user'
  maxAccessLevel: "use" // Nunca "admin"
}
```

**Los grupos SOLO pueden**:
- ✅ Facilitar compartir agentes con múltiples usuarios
- ✅ Organizar usuarios por departamento/equipo
- ✅ Recibir acceso "view" o "use" a agentes

**Los grupos NO pueden**:
- ❌ Elevar el rol de un usuario (user → expert)
- ❌ Dar permisos administrativos
- ❌ Contener usuarios con roles elevados (expert, admin, etc.)
- ❌ Tener nivel de acceso "admin" a agentes

---

### Nivel 3: Shares (Acceso a Recursos Específicos)

Los shares dan acceso a agentes específicos:

```typescript
AgentShare {
  agentId: "agent-legal"
  sharedWith: [
    { type: "group", id: "equipo-legal" }
  ]
  accessLevel: "use" // view | use (para grupos)
}
```

**Restricciones por tipo**:

| Target | Niveles Permitidos | Razón |
|--------|-------------------|-------|
| **Grupo** | `view`, `use` | Grupos no pueden administrar |
| **Usuario individual (rol 'user')** | `view`, `use`, `admin`* | *Con advertencia |
| **Usuario individual (rol 'expert'+)** | `view`, `use`, `admin` | OK, ya tiene permisos |

---

## 📊 Matriz de Permisos

### Acceso a Agentes por Rol + Share

```
┌──────────────┬──────────┬──────────┬──────────┐
│ Rol Usuario  │ view     │ use      │ admin    │
├──────────────┼──────────┼──────────┼──────────┤
│ user         │ Ver      │ Usar     │ Usar*    │
│ expert       │ Ver      │ Usar     │ Admin    │
│ admin        │ Ver      │ Usar     │ Admin    │
└──────────────┴──────────┴──────────┴──────────┘

* Usuario con rol 'user' recibe share 'admin':
  - Sistema muestra WARNING
  - Usuario puede administrar ESE agente
  - NO cambia su rol global (sigue siendo 'user')
  - NO puede administrar otros agentes
  - NO puede acceder a funciones de admin general
```

---

## 🚫 Casos NO Permitidos

### ❌ Caso 1: Grupo con Usuario Expert

```typescript
// RECHAZADO ❌
createGroup("Legal Team", "team", "admin-id", [
  "user-1",    // rol: user ✅
  "expert-2"   // rol: expert ❌ NO PERMITIDO
])

// Error: "Los grupos solo pueden contener usuarios con rol 'user'"
```

**Por qué**: Un expert ya tiene permisos elevados. No necesita estar en un grupo. Si necesita acceso a un agente, comparte directamente.

---

### ❌ Caso 2: Share Admin a Grupo

```typescript
// RECHAZADO ❌
shareAgent("agent-123", "owner-id", [
  { type: "group", id: "legal-team" }
], "admin") // ❌ NO PERMITIDO

// Error: "Los grupos no pueden tener nivel de acceso 'admin'"
```

**Por qué**: Los grupos organizan usuarios básicos. Dar admin a un grupo sería elevar permisos de todos los miembros.

---

### ❌ Caso 3: Agregar Expert a Grupo Existente

```typescript
// RECHAZADO ❌
addGroupMember("legal-team", "expert-user-id")

// Error: "Solo usuarios con rol 'user' pueden agregarse a grupos.
//         María Pérez tiene rol 'expert' que tiene permisos elevados."
```

**Por qué**: Mantener grupos homogéneos (solo 'user' role) simplifica la gestión de permisos.

---

## ✅ Casos Permitidos

### ✅ Caso 1: Grupo con Usuarios Básicos

```typescript
// PERMITIDO ✅
createGroup("Ventas Team", "team", "admin-id", [
  "user-1", // rol: user ✅
  "user-2", // rol: user ✅
  "user-3"  // rol: user ✅
])

// Success: Grupo creado
```

**Resultado**: Grupo homogéneo, fácil de administrar.

---

### ✅ Caso 2: Share Use a Grupo

```typescript
// PERMITIDO ✅
shareAgent("agent-ventas", "owner-id", [
  { type: "group", id: "ventas-team" }
], "use")

// Success: Grupo puede usar el agente
```

**Resultado**: Los 3 usuarios pueden usar el agente normalmente.

---

### ✅ Caso 3: Share Admin a Expert Individual

```typescript
// PERMITIDO ✅ (sin warning)
shareAgent("agent-legal", "owner-id", [
  { type: "user", id: "expert-lawyer" } // rol: expert
], "admin")

// Success: Expert puede administrar este agente
```

**Resultado**: Expert puede administrar el agente compartido. Tiene sentido porque ya tiene permisos elevados.

---

### ✅ Caso 4: Share Admin a User Individual

```typescript
// PERMITIDO ✅ (CON WARNING)
shareAgent("agent-especial", "owner-id", [
  { type: "user", id: "user-juan" } // rol: user
], "admin")

// Warning: "Compartiendo con nivel 'admin' a usuarios con rol 'user': Juan."
// Success: Share creado
```

**Resultado**: 
- Juan puede administrar ESE agente específico
- Juan NO se convierte en admin general
- Es una delegación de administración específica al agente

---

## 🧠 Filosofía de Diseño

### ¿Por Qué Esta Restricción?

#### 1. Seguridad
- Grupos pueden crecer (agregar miembros)
- Si grupo tiene acceso "admin", nuevos miembros heredan admin
- Riesgo de escalamiento accidental de permisos

#### 2. Claridad
- Roles individuales = permisos del sistema
- Grupos = organización y acceso compartido
- Separación clara de conceptos

#### 3. Control
- Admin puede compartir con grupo: "use" (seguro)
- Admin puede compartir con expert individual: "admin" (confianza)
- Decisión consciente por target

---

## 🎯 Casos de Uso Reales

### Caso: Departamento Legal (10 personas)

**Configuración**:
```
Grupo "Legal"
- 8 abogados junior (rol: user) ✅
- 1 abogado senior (rol: expert) ❌ NO en grupo
- 1 jefe legal (rol: admin) ❌ NO en grupo
```

**Shares**:
```
Agente "Asistente Legal"
├─ Grupo "Legal" → use ✅
│  (8 abogados junior pueden usar)
├─ Expert individual → admin ✅
│  (abogado senior puede administrar)
└─ Admin individual → admin ✅
   (jefe legal puede administrar)
```

**Resultado**:
- 8 juniors usan el agente (sin admin)
- 1 senior administra (por rol expert)
- 1 jefe administra (por rol admin)
- Separación clara de responsabilidades

---

### Caso: Proyecto Temporal (15 personas)

**Configuración**:
```
Grupo "Proyecto Minería Q1"
- 12 ingenieros (rol: user) ✅
- 2 gerentes (rol: expert) ❌ NO en grupo
- 1 director (rol: admin) ❌ NO en grupo
```

**Shares**:
```
Agente "Análisis Minería"
├─ Grupo "Proyecto Q1" → use (exp: 2025-03-31) ✅
│  (12 ingenieros usan temporalmente)
├─ Gerente 1 (individual) → admin ✅
├─ Gerente 2 (individual) → admin ✅
└─ Director (individual) → admin ✅
```

**Resultado**:
- Mayoría (ingenieros) en grupo con acceso temporal
- Líderes con acceso individual permanente
- Expiración automática para equipo base

---

## 📋 Validaciones Implementadas

### Backend (firestore.ts)

#### `createGroup()`
```typescript
// Valida que todos los miembros iniciales tengan rol 'user'
if (member.role !== 'user') {
  throw Error("Solo usuarios con rol 'user' pueden agregarse")
}
```

#### `addGroupMember()`
```typescript
// Valida cada miembro agregado
const user = await getUserById(userId);
if (user.role !== 'user') {
  throw Error("Solo rol 'user' permitido en grupos")
}
```

#### `shareAgent()`
```typescript
// Valida nivel de acceso para grupos
if (hasGroups && accessLevel === 'admin') {
  throw Error("Grupos no pueden tener nivel 'admin'")
}

// Warning para usuarios 'user' con nivel admin
if (user.role === 'user' && accessLevel === 'admin') {
  console.warn("Cuidado: Dando admin a usuario básico")
}
```

---

### Frontend (UI)

#### GroupManagementPanel
```typescript
// Filtra lista de usuarios
allUsers.filter(u => u.role === 'user')
// Solo muestra usuarios básicos

// Mensaje informativo
"ℹ️ Solo usuarios con rol 'user' pueden agregarse a grupos"
```

#### AgentSharingModal
```typescript
// Deshabilita botón "Admin" cuando shareType === 'group'
<button disabled={!isAdminAllowed}>
  Admin
</button>

// Mensaje de advertencia
"⚠️ Los grupos solo pueden tener acceso 'Ver' o 'Usar'"
```

---

## 🎓 Preguntas Frecuentes

### P: ¿Por qué no puedo agregar un expert a un grupo?

**R**: Los experts ya tienen permisos elevados (pueden certificar contexto/agentes). No necesitan estar en grupos. Los grupos son para organizar usuarios básicos que solo necesitan acceso a agentes específicos.

Si un expert necesita acceso a un agente, **comparte directamente** con él.

---

### P: ¿Qué pasa si doy "admin" a un usuario con rol 'user'?

**R**: El sistema muestra un WARNING pero lo permite. Ese usuario puede:
- ✅ Administrar ESE agente específico (compartido)
- ❌ NO se convierte en admin general
- ❌ NO puede administrar otros agentes
- ❌ NO puede acceder a funciones de admin del sistema

Es una **delegación específica**, no un cambio de rol.

---

### P: ¿Puedo compartir un agente con un grupo Y con usuarios individuales a la vez?

**R**: Sí! Un solo share puede tener:
```typescript
sharedWith: [
  { type: "group", id: "team-ventas" },    // 8 usuarios
  { type: "user", id: "expert-maria" },    // 1 expert
  { type: "user", id: "admin-carlos" }     // 1 admin
]
accessLevel: "use" // Se aplica a TODOS (grupo + individuales)
```

**Nota**: Si quieres diferentes niveles, crea múltiples shares:
- Share 1: Grupo → use
- Share 2: Expert → admin

---

### P: ¿Qué pasa si elimino un usuario que está en grupos?

**R**: El usuario se elimina del sistema, pero su ID permanece en los grupos hasta que se limpie manualmente. 

**Recomendación**: Antes de eliminar usuario:
1. Ver sus grupos
2. Removerlo de grupos primero
3. Luego eliminarlo

(Futuro: Auto-cleanup)

---

## 🛡️ Seguridad

### Firestore Security Rules

```javascript
match /groups/{groupId} {
  // Solo admins pueden crear/modificar grupos
  allow create, update, delete: if isAdmin();
  
  // Miembros pueden leer su grupo
  allow read: if isGroupMember(groupId) || isAdmin();
}

match /agent_shares/{shareId} {
  // Solo owner puede crear shares para su agente
  allow create: if resource.data.ownerId == request.auth.uid;
  
  // No se puede compartir con nivel 'admin' a grupos (validado en backend)
}
```

---

### Backend Validation

**Múltiples capas**:
1. **createGroup()**: Valida miembros iniciales son 'user'
2. **addGroupMember()**: Valida cada miembro agregado es 'user'
3. **shareAgent()**: Valida nivel no es 'admin' si hay grupos
4. **UI**: Filtra/deshabilita opciones inválidas

---

## 📈 Ejemplos de Configuración

### Configuración Recomendada ✅

```
USUARIOS:
├─ Carlos (admin) - Sin grupo
├─ María (expert) - Sin grupo
├─ Pedro (context_signoff) - Sin grupo
├─ Ana (user) - En grupo "Ventas"
├─ Luis (user) - En grupo "Ventas"
├─ Rosa (user) - En grupo "Ventas"
├─ Juan (user) - En grupo "Legal"
└─ Sofía (user) - En grupo "Legal"

GRUPOS:
├─ Ventas (3 miembros: Ana, Luis, Rosa)
└─ Legal (2 miembros: Juan, Sofía)

SHARES:
Agente "Asistente Ventas"
├─ Grupo Ventas → use (3 usuarios básicos)
└─ María (expert) → admin (administra)

Agente "Asistente Legal"  
├─ Grupo Legal → use (2 usuarios básicos)
└─ Pedro (context_signoff) → admin (certifica)
```

**Beneficios**:
- Usuarios básicos organizados en grupos
- Expertos/admins con acceso individual y admin
- Control granular
- Escalable

---

### Configuración NO Recomendada ❌

```
GRUPOS:
├─ Super Team
│   ├─ Carlos (admin) ❌
│   ├─ María (expert) ❌
│   └─ Ana (user) ✅
```

**Problemas**:
- Sistema rechazará agregar Carlos y María
- Mezcla roles elevados con básicos
- Confusión sobre quién puede hacer qué

---

## 🔄 Migración de Enfoque Antiguo

### Si pensabas usar grupos para permisos:

**Antiguo enfoque** (incorrecto):
```
Grupo "Admins" con rol "admin" → Todos los miembros son admin
```

**Nuevo enfoque** (correcto):
```
Usuarios individuales con rol "admin" → Cada uno es admin por sí mismo
Grupos solo para compartir acceso a recursos
```

**Ventaja del nuevo enfoque**:
- Permisos explícitos por usuario
- Auditoría clara (quién hizo qué)
- No hay escalamiento accidental
- Roles no cambian por pertenecer a grupo

---

## 📚 Documentación Relacionada

- `docs/USER_GROUPS_SHARING_SYSTEM.md` - Arquitectura completa
- `docs/GRUPOS_USUARIOS_QUICK_START.md` - Guía de uso
- `.cursor/rules/userpersonas.mdc` - Definición de roles
- `.cursor/rules/privacy.mdc` - Seguridad y aislamiento

---

## ✅ Checklist de Validación

Antes de dar acceso a un grupo, verifica:

- [ ] ¿Todos los miembros tienen rol 'user'?
- [ ] ¿El nivel de acceso es 'view' o 'use'? (NO 'admin')
- [ ] ¿El grupo tiene un propósito claro?
- [ ] ¿La expiración está configurada correctamente?
- [ ] ¿Los miembros realmente necesitan este acceso?

---

**Principio final**: 

> Los grupos son para **facilitar**, no para **escalar**.
> 
> Si alguien necesita permisos elevados, dáselo **individualmente**.

---

**Última Actualización**: 2025-10-21  
**Autor**: Alec  
**Estado**: ✅ Implementado y Validado

