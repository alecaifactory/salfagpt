# 🏢 Flujo Completo Multi-Dominio - Expert Review

**Fecha:** 2025-11-10  
**Commit:** e567467  
**Status:** ✅ Sistema Jerárquico Completo

---

## 🎯 Arquitectura Jerárquica

```
SUPERADMIN (alec@getaifactory.com)
  │
  ├─ Asigna Dominios a Admins
  │  │
  │  ├─ Admin A (alec@getaifactory.com)
  │  │   └─ Dominios: [getaifactory.com, maqsa.cl, empresa.cl]
  │  │
  │  ├─ Admin B (admin@otraempresa.com)
  │  │   └─ Dominios: [otraempresa.com]
  │  │
  │  └─ Admin C (admin@cliente.cl)
  │      └─ Dominios: [cliente.cl]
  │
  └─ Cada Admin configura SUS dominios
      │
      ├─ getaifactory.com
      │   ├─ Supervisores: [usuario1, usuario2]
      │   └─ Especialistas: [experto1, experto2]
      │
      ├─ maqsa.cl
      │   ├─ Supervisores: [supervisor_maqsa]
      │   └─ Especialistas: [especialista_maqsa]
      │
      └─ empresa.cl
          ├─ Supervisores: [supervisor_empresa]
          └─ Especialistas: [especialista_empresa]
```

---

## 🔄 PASO 1: SuperAdmin Asigna Dominios

### ¿Quién? SuperAdmin (alec@getaifactory.com)

### ¿Dónde? Menu → 🛡️ Asignar Dominios (NUEVO)

### Acciones:

```
1. Login como SuperAdmin
2. Click avatar (bottom-left)
3. Menu EVALUACIONES
4. Click "🛡️ Asignar Dominios" (primera opción)

Modal abre: "Asignación de Dominios a Admins"

5. Click "Asignar Dominios a Admin"

6. Formulario morado aparece:
   
   a) Seleccionar Admin:
      [v] Alec Dickinson (alec@getaifactory.com)
          Admin B (admin@otraempresa.com)
          Admin C (admin@cliente.cl)
   
   b) Seleccionar Dominios (checkboxes):
      ✅ getaifactory.com
      ✅ maqsa.cl
      ✅ empresa.cl
      ☐ otraempresa.com
      ☐ cliente.cl
   
   c) Click "Asignar Dominios"

7. Admin aparece en lista con sus dominios:
   
   ┌────────────────────────────────────┐
   │ 👤 Alec Dickinson                  │
   │    alec@getaifactory.com           │
   │    🏢 3 dominios                   │
   ├────────────────────────────────────┤
   │ Dominios Asignados:                │
   │ [getaifactory.com] ❌              │
   │ [maqsa.cl] ❌                      │
   │ [empresa.cl] ❌                    │
   └────────────────────────────────────┘
   
8. Repetir para otros admins
```

### Resultado:
- ✅ alec@getaifactory.com puede gestionar 3 dominios
- ✅ Otros admins solo ven sus dominios asignados
- ✅ Guardado en Firestore: `domain_admin_assignments`

---

## 🔄 PASO 2: Admin Configura SU Dominio

### ¿Quién? Admin (alec@getaifactory.com con 3 dominios asignados)

### ¿Dónde? Menu → ⚙️ Config. Evaluación

### Acciones:

```
1. Login como alec@getaifactory.com (admin)
2. Menu → Config. Evaluación

Modal abre con SELECTOR DE DOMINIO:

┌─────────────────────────────────────┐
│ Configuración de Evaluación         │
│ Configuración Global - Multi-Dominio│
├─────────────────────────────────────┤
│ 1️⃣ Seleccionar Dominio              │
│ ┌─────────────────────────────────┐ │
│ │ [v] getaifactory.com            │ │
│ │     maqsa.cl                    │ │
│ │     empresa.cl                  │ │
│ └─────────────────────────────────┘ │
│ (Solo dominios asignados por        │
│  SuperAdmin aparecen)               │
└─────────────────────────────────────┘

3. Seleccionar: getaifactory.com

4. Sistema carga:
   - Config de getaifactory.com
   - Usuarios con acceso a agentes de getaifactory.com

5. Tab "Expertos & Especialistas"

6. Agregar Supervisor:
   - Click "Agregar Supervisor"
   - Dropdown muestra SOLO usuarios con:
     a) Acceso a agentes compartidos de getaifactory.com
     b) Rol: admin o supervisor
   
   Ejemplo:
   [v] Juan Pérez (juan@maqsa.cl) - admin - 5 agentes compartidos
       María García (maria@getaifactory.com) - supervisor - 10 agentes
   
7. Seleccionar Juan Pérez
8. Click "Agregar"
9. Juan aparece en Supervisores de getaifactory.com

10. Cambiar selector a: maqsa.cl

11. Sistema carga:
    - Config de maqsa.cl
    - Usuarios con acceso a agentes de maqsa.cl

12. Agregar diferentes supervisores para maqsa.cl

13. Guardar Configuración
```

### Resultado:
- ✅ getaifactory.com tiene sus propios supervisores
- ✅ maqsa.cl tiene supervisores diferentes
- ✅ empresa.cl puede tener otros supervisores
- ✅ Cada dominio independiente

---

## 🔍 Ejemplo Concreto: Tu Caso

### Setup Actual:

**SuperAdmin:** alec@getaifactory.com
**Quieres:** Asignar alecdickinson@gmail.com como supervisor de getaifactory.com

### PASO 1A: SuperAdmin Asigna Dominios a Alec

```
Como: alec@getaifactory.com (superadmin)

1. Menu → 🛡️ Asignar Dominios
2. Click "Asignar Dominios a Admin"
3. Seleccionar Admin: Alec Dickinson (alec@getaifactory.com)
4. Marcar dominios:
   ✅ getaifactory.com
   ✅ maqsa.cl
   ✅ empresa.cl
5. Click "Asignar Dominios"

Resultado:
- alec@getaifactory.com ahora puede gestionar 3 dominios
```

### PASO 1B: Compartir Agentes con alecdickinson@gmail.com

```
Como: alec@getaifactory.com

Para cada agente de getaifactory.com:
1. Abrir agente
2. Click 🔗 Compartir
3. Agregar: alecdickinson@gmail.com
4. Acceso: edit
5. Guardar

Repetir para 5-10 agentes

Resultado:
- alecdickinson@gmail.com tiene acceso a agentes de getaifactory.com
```

### PASO 2: Asignar alecdickinson como Supervisor

```
Como: alec@getaifactory.com

1. Menu → ⚙️ Config. Evaluación
2. Selector de dominio muestra:
   - getaifactory.com ✅ (asignado en Step 1A)
   - maqsa.cl ✅
   - empresa.cl ✅
   
3. Seleccionar: getaifactory.com

4. Click "Agregar Supervisor"

5. Dropdown AHORA muestra:
   ✅ Alec Dickinson (alecdickinson@gmail.com) - admin - 8 agentes compartidos
   
   (Aparece porque tiene agentes compartidos de getaifactory.com)

6. Seleccionar alecdickinson
7. Click "Agregar"
8. Aparece en Supervisores (1)
9. Guardar Configuración
```

### PASO 3: Validar Como Supervisor

```
Como: alecdickinson@gmail.com

1. Login
2. Menu EVALUACIONES aparece
3. Panel Supervisor
4. Ve interacciones de:
   - Solo los 8 agentes compartidos de getaifactory.com
   - No ve agentes de maqsa.cl (no está configurado como supervisor allí)
   - No ve agentes no compartidos
5. Puede evaluar
```

---

## 📊 Jerarquía de Datos

### Firestore Collections:

#### 1. domain_admin_assignments
```typescript
Document ID: alec_getaifactory_com
{
  adminUserId: "alec_getaifactory_com",
  adminEmail: "alec@getaifactory.com",
  adminName: "Alec Dickinson",
  assignedDomains: [
    "getaifactory.com",
    "maqsa.cl",
    "empresa.cl"
  ],
  assignedBy: "114671162830729001607", // SuperAdmin
  assignedAt: Timestamp,
  isActive: true,
  permissions: {
    canConfigureExperts: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canShareAgents: true
  }
}
```

#### 2. domain_review_config
```typescript
// Separate config per domain

Document ID: getaifactory.com
{
  domainName: "getaifactory.com",
  supervisors: [
    {
      userId: "alecdickinson_gmail_com",
      userEmail: "alecdickinson@gmail.com",
      name: "Alec Dickinson",
      assignedAt: Timestamp,
      activeAssignments: 0
    }
  ],
  specialists: [...],
  // ... resto de config
}

Document ID: maqsa.cl
{
  domainName: "maqsa.cl",
  supervisors: [
    // Different supervisors for maqsa.cl
  ],
  specialists: [...],
  // ... different config
}
```

#### 3. agent_sharing
```typescript
{
  agentId: "agent-123",
  ownerId: "owner_getaifactory_com",
  sharedWith: [
    {
      userId: "alecdickinson_gmail_com",
      userEmail: "alecdickinson@gmail.com",
      accessLevel: "edit",
      sharedAt: Timestamp
    }
  ]
}
```

---

## 🎯 Flujo Completo End-to-End

### Escenario: 3 Dominios, 1 SuperAdmin, 1 Admin External

**Actors:**
- SuperAdmin: alec@getaifactory.com (owns 3 domains)
- External Admin: alecdickinson@gmail.com (will supervise)
- Users: Various in each domain

### Timeline:

#### T0: Initial Setup (SuperAdmin)
```
SuperAdmin:
1. ✅ Creates agents in getaifactory.com (65 agents)
2. ✅ Creates agents in maqsa.cl (20 agents)
3. ✅ Creates agents in empresa.cl (15 agents)
```

#### T1: Domain Assignment (SuperAdmin)
```
SuperAdmin → Asignar Dominios:
1. Assign to alec@getaifactory.com:
   - getaifactory.com
   - maqsa.cl
   - empresa.cl
   
Result:
- alec@getaifactory.com can now manage all 3 domains
```

#### T2: Share Agents (Admin)
```
Admin (alec@getaifactory.com):
1. Share 8 agents from getaifactory.com with alecdickinson@gmail.com
2. Share 3 agents from maqsa.cl with supervisor_maqsa@empresa.com
3. Share 5 agents from empresa.cl with experto@consultora.cl

Result:
- alecdickinson@gmail.com: 8 agents from getaifactory.com
- supervisor_maqsa@empresa.com: 3 agents from maqsa.cl
- experto@consultora.cl: 5 agents from empresa.cl
```

#### T3: Configure Experts per Domain (Admin)
```
Admin → Config. Evaluación:

Domain: getaifactory.com
- Supervisor: alecdickinson@gmail.com (8 agentes)
- Especialista: expert1@gmail.com (5 agentes) - Specialty: "Productos"

Domain: maqsa.cl
- Supervisor: supervisor_maqsa@empresa.com (3 agentes)
- Especialista: expert2@maqsa.cl (2 agentes) - Specialty: "Técnico"

Domain: empresa.cl
- Supervisor: admin@empresa.cl (own domain)
- Especialista: experto@consultora.cl (5 agentes) - Specialty: "Ventas"

Save each domain configuration separately
```

#### T4: Runtime - User Interaction (Any Domain)
```
User in getaifactory.com:
1. Sends message to agent
2. Gives ⭐⭐ rating (low)
3. System detects (≤ threshold)

System:
4. Checks domain: getaifactory.com
5. Loads supervisors for getaifactory.com
6. Shows in alecdickinson@gmail.com's Panel Supervisor

alecdickinson@gmail.com:
7. Sees interaction
8. Evaluates as "mejorable"
9. System auto-assigns to Especialista with "Productos" specialty
10. Expert reviews and proposes correction
11. Admin approves
12. System applies to getaifactory.com agents only
```

---

## 🎨 UI Para SuperAdmin

### Menu EVALUACIONES (SuperAdmin):

```
┌─────────────────────────────────┐
│ EVALUACIONES                    │
├─────────────────────────────────┤
│ 🛡️ Asignar Dominios      ← NEW!│
│ ⚙️ Config. Evaluación           │
│ 📊 Dashboard Calidad            │
└─────────────────────────────────┘
```

### Panel "Asignar Dominios":

```
┌──────────────────────────────────────────┐
│ 🛡️ Asignación de Dominios a Admins      │
│    SuperAdmin - Configuración Multi      │
├──────────────────────────────────────────┤
│ ℹ️ Paso 1: Asigna dominios a cada Admin│
│   Luego, cada Admin podrá configurar    │
│   supervisores solo para sus dominios   │
├──────────────────────────────────────────┤
│                                          │
│ [+ Asignar Dominios a Admin]            │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ 👤 Alec Dickinson            3 dom  ││
│ │    alec@getaifactory.com            ││
│ ├──────────────────────────────────────┤│
│ │ Dominios Asignados:                 ││
│ │ [getaifactory.com] ❌               ││
│ │ [maqsa.cl] ❌                       ││
│ │ [empresa.cl] ❌                     ││
│ └──────────────────────────────────────┘│
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ 👤 Admin B                   1 dom  ││
│ │    admin@otraempresa.com            ││
│ ├──────────────────────────────────────┤│
│ │ Dominios Asignados:                 ││
│ │ [otraempresa.com] ❌                ││
│ └──────────────────────────────────────┘│
│                                          │
├──────────────────────────────────────────┤
│ Una vez asignados, los admins podrán    │
│ configurar expertos                     │
│                              [Cerrar]   │
└──────────────────────────────────────────┘
```

---

## 🎨 UI Para Admin

### Panel "Config. Evaluación" (Admin con dominios asignados):

```
┌──────────────────────────────────────────┐
│ ⚙️ Configuración de Evaluación          │
│   Configuración Global - Multi-Dominio  │
├──────────────────────────────────────────┤
│ 1️⃣ Seleccionar Dominio                  │
│ ┌──────────────────────────────────────┐│
│ │ [v] getaifactory.com                 ││
│ │     maqsa.cl                         ││
│ │     empresa.cl                       ││
│ └──────────────────────────────────────┘│
│ (Solo dominios asignados por SuperAdmin)│
├──────────────────────────────────────────┤
│ [Expertos] [Umbrales] [Auto] [Metas]    │
├──────────────────────────────────────────┤
│ Supervisores (0)    [Agregar Supervisor]│
│                                          │
│ Dropdown muestra:                        │
│ - Usuarios con shared access DE         │
│   getaifactory.com solamente            │
│ - No muestra usuarios sin acceso        │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🔐 Lógica de Filtrado

### Para alecdickinson@gmail.com aparecer en dropdown:

```
Checklist:
✅ 1. Usuario existe en sistema
✅ 2. Usuario tiene rol: admin o supervisor
✅ 3. Usuario está activo (isActive: true)
✅ 4. SuperAdmin asignó dominio(s) a admin configurador
✅ 5. Admin seleccionó el dominio correcto
✅ 6. Agentes del dominio fueron compartidos con alecdickinson
✅ 7. agent_sharing tiene registros válidos
✅ 8. alecdickinson no está ya asignado como supervisor

Query:
1. Get agents owned by users @getaifactory.com
2. Get agent_sharing where agentId in [those agents]
3. Extract sharedWith user IDs
4. Filter: role = admin or supervisor
5. Filter: not already assigned
6. Count shared agents per user
7. Return: name, email, role, sharedAgentCount
```

---

## 📋 Checklist Completo de Configuración

### Para SuperAdmin (PASO 1):

- [ ] Login como superadmin
- [ ] Menu → Asignar Dominios
- [ ] Click "Asignar Dominios a Admin"
- [ ] Seleccionar admin: alec@getaifactory.com
- [ ] Marcar dominios a asignar:
  - [ ] getaifactory.com
  - [ ] maqsa.cl
  - [ ] empresa.cl
- [ ] Click "Asignar Dominios"
- [ ] Admin aparece en lista con dominios
- [ ] Repetir para otros admins si necesario

### Para Admin (PASO 2):

- [ ] Login como admin con dominios asignados
- [ ] Menu → Config. Evaluación
- [ ] Selector muestra solo dominios asignados
- [ ] Seleccionar dominio: getaifactory.com
- [ ] Click "Agregar Supervisor"
- [ ] Dropdown muestra usuarios con shared access
- [ ] Seleccionar supervisor
- [ ] Click "Agregar"
- [ ] Supervisor aparece en lista
- [ ] Click "Agregar Especialista"
- [ ] Seleccionar especialista
- [ ] Completar specialty y dominios
- [ ] Click "Agregar"
- [ ] Especialista aparece
- [ ] Click "Guardar Configuración"
- [ ] Cambiar a otro dominio (ej: maqsa.cl)
- [ ] Repetir configuración para ese dominio
- [ ] Cada dominio se guarda independientemente

### Pre-Requisitos:

- [ ] Agentes existen en cada dominio
- [ ] Agentes compartidos con evaluadores externos
- [ ] Usuarios tienen roles apropiados
- [ ] domain_admin_assignments configurado

---

## 🐛 Troubleshooting

### "alecdickinson@gmail.com no aparece en dropdown"

**Check 1: SuperAdmin asignó dominios?**
```
1. Como SuperAdmin → Asignar Dominios
2. Ver si alec@getaifactory.com tiene dominios asignados
3. Si no: Asignar getaifactory.com primero
```

**Check 2: Dominio correcto seleccionado?**
```
1. En Config. Evaluación
2. Selector de dominio debe mostrar: getaifactory.com
3. Debe estar seleccionado
```

**Check 3: Agentes compartidos?**
```
1. Abrir agentes de getaifactory.com
2. Verificar tienen badge "🔗 Compartido"
3. Ver lista de compartidos incluye: alecdickinson@gmail.com
4. Si no: Compartir agentes primero
```

**Check 4: API Response**
```javascript
// En browser console:
fetch('/api/users/with-domain-access?domain=getaifactory.com')
  .then(r => r.json())
  .then(console.log);

// Should show:
[{
  id: "alecdickinson_gmail_com",
  email: "alecdickinson@gmail.com",
  name: "Alec Dickinson",
  role: "admin",
  sharedAgentCount: 8 // > 0 is key!
}]
```

---

## 🎊 Flujo Completo Funcional

```
SUPERADMIN
  ↓
🛡️ Asignar Dominios
  ├─ Asigna getaifactory.com a alec@getaifactory.com
  ├─ Asigna maqsa.cl a alec@getaifactory.com
  └─ Asigna empresa.cl a alec@getaifactory.com
  
ADMIN (alec@getaifactory.com)
  ↓
Comparte Agentes
  ├─ 8 agentes de getaifactory.com → alecdickinson@gmail.com
  ├─ 3 agentes de maqsa.cl → supervisor_maqsa
  └─ 5 agentes de empresa.cl → experto_empresa
  
ADMIN (alec@getaifactory.com)
  ↓
⚙️ Config. Evaluación
  ├─ Selecciona: getaifactory.com
  │   ├─ Agregar Supervisor: alecdickinson@gmail.com (8 agentes)
  │   └─ Agregar Especialista: expert1 (5 agentes)
  ├─ Selecciona: maqsa.cl
  │   ├─ Agregar Supervisor: supervisor_maqsa (3 agentes)
  │   └─ Agregar Especialista: expert2 (2 agentes)
  └─ Selecciona: empresa.cl
      ├─ Agregar Supervisor: admin_empresa (owner)
      └─ Agregar Especialista: experto_empresa (5 agentes)

RUNTIME
  ↓
Usuario en getaifactory.com → Rating bajo
  ↓
Sistema detecta → Asigna a supervisor de getaifactory.com
  ↓
alecdickinson@gmail.com ve en Panel
  ↓
Solo ve agentes de getaifactory.com (los 8 compartidos)
  ↓
Evalúa → Auto-asigna a especialista
  ↓
Sistema aplica corrección
  ↓
Analytics por dominio se actualizan
```

---

## 🚀 Próximos Pasos Para Ti

### Ahora Mismo (Refresh página):

```bash
# 1. Refresh browser
Cmd + Shift + R

# 2. Como SuperAdmin → Asignar Dominios
Menu → 🛡️ Asignar Dominios (NUEVO - primera opción)

# 3. Asignar a ti mismo:
Admin: alec@getaifactory.com
Dominios: 
  ✅ getaifactory.com
  ✅ maqsa.cl (si existe)
  ✅ empresa.cl (si existe)
Click "Asignar Dominios"

# 4. Verificar apareces en lista con 3 dominios

# 5. Cerrar modal

# 6. Menu → Config. Evaluación
Ahora selector muestra TUS dominios asignados

# 7. Seleccionar: getaifactory.com

# 8. Agregar Supervisor
Dropdown muestra usuarios con shared access de getaifactory.com

# 9. Si alecdickinson aparece → Asignar
# 10. Si no aparece → Compartir agentes primero
```

---

## ✅ Sistema Completamente Implementado

```
COMMITS: 6 en esta sesión
FILES: 18 nuevos/modificados
LINES: +3,170 código/docs

ARQUITECTURA:
✅ Multi-domain hierarchy
✅ SuperAdmin → Admins → Domains → Experts
✅ Domain-specific configuration
✅ Shared agent access verification
✅ Security at every level
✅ Complete isolation between domains

APIs:
✅ /api/expert-review/domain-assignments
✅ /api/expert-review/assign-domains
✅ /api/expert-review/remove-domain
✅ /api/expert-review/admin-domains
✅ /api/users/with-domain-access

UI:
✅ SuperAdminDomainAssignment panel
✅ Domain selector in DomainConfigPanel
✅ Menu item "Asignar Dominios"
✅ Proper domain filtering everywhere

READY: Full testing and production! 🚀
```

---

**El sistema ahora tiene la jerarquía completa:**
1. SuperAdmin asigna dominios a Admins
2. Admins configuran expertos para SUS dominios
3. Expertos solo ven agentes con acceso compartido
4. Complete multi-tenant support! ✅

