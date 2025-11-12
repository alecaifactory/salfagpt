# Nueva Funcionalidad: Tabla de Accesos Individuales con Historial

**Fecha:** 2025-11-12  
**Feature:** Gestión granular de accesos compartidos  
**Status:** 🔧 Backend completo, UI pendiente integración

---

## 🎯 **Objetivo**

Cambiar de vista de "shares agrupados" a "usuarios individuales" con:
1. Tabla con información completa de cada usuario
2. Poder revocar usuario por usuario (no todo el share)
3. Historial de accesos revocados
4. Trazabilidad completa (quién otorgó, quién revocó, cuándo)

---

## ✅ **Lo Que Se Implementó**

### **1. Modelo de Datos Actualizado**

**Archivo:** `src/lib/firestore.ts`

**Interface AgentShare (actualizada):**

```typescript
export interface AgentShare {
  id: string;
  agentId: string;
  ownerId: string;
  sharedWith: Array<{...}>;  // Existente
  accessLevel: 'view' | 'use' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  
  // 🆕 NUEVO: Historial de accesos individuales
  individualAccess?: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    domain: string;
    organizationId?: string;
    organizationName?: string;
    accessLevel: 'view' | 'use' | 'admin';
    grantedBy: string;           // userId del admin
    grantedByEmail: string;       // Email del admin
    grantedAt: Date;
    revokedBy?: string;           // userId del admin que revocó
    revokedByEmail?: string;      // Email del admin que revocó
    revokedAt?: Date;
    isActive: boolean;            // true = activo, false = revocado
  }>;
}
```

---

### **2. Funciones de Backend**

**Archivo:** `src/lib/firestore.ts`

#### **`getAgentIndividualAccess(agentId: string)`**

**Propósito:** Obtener lista plana de todos los usuarios con acceso (activos + revocados)

**Retorna:**
```typescript
Array<{
  userId: string;
  userEmail: string;
  userName: string;
  domain: string;
  organizationId: string | null;
  organizationName: string;
  accessLevel: 'view' | 'use' | 'admin';
  grantedBy: string;
  grantedByEmail: string;
  grantedAt: Date;
  shareId: string;
  revokedBy?: string;
  revokedByEmail?: string;
  revokedAt?: Date;
  isActive: boolean;
}>
```

**Lógica:**
1. Obtiene todos los shares del agente
2. Por cada share, itera `sharedWith`
3. Para cada usuario, resuelve datos completos (nombre, org, domain)
4. Agrega accesos activos desde `sharedWith`
5. Agrega accesos revocados desde `individualAccess`
6. Ordena: Activos primero, luego revocados

---

#### **`revokeIndividualAccess(shareId, userEmail, revokedBy, revokedByEmail)`**

**Propósito:** Revocar acceso de UN usuario específico (no todo el share)

**Lógica:**
1. Encuentra el share por ID
2. Encuentra el usuario en `sharedWith` por email
3. Crea registro de revocación con metadata completa
4. Elimina usuario de `sharedWith`
5. Agrega registro a `individualAccess` con `isActive: false`
6. Actualiza share en Firestore

**Audit Trail:**
- Quién otorgó el acceso originalmente
- Cuándo se otorgó
- Quién revocó el acceso
- Cuándo se revocó
- Nivel de acceso que tenía

---

### **3. API Endpoints**

#### **GET `/api/agents/:id/individual-access`**

**Archivo:** `src/pages/api/agents/[id]/individual-access.ts`

**Retorna:**
```json
{
  "access": [
    {
      "userId": "usr_...",
      "userEmail": "user@domain.com",
      "userName": "Usuario Nombre",
      "domain": "domain.com",
      "organizationName": "Salfa Corp",
      "accessLevel": "use",
      "grantedByEmail": "admin@domain.com",
      "grantedAt": "2025-11-12T...",
      "shareId": "share_...",
      "isActive": true
    },
    // ... más usuarios
  ]
}
```

---

#### **DELETE `/api/agents/:id/revoke-individual-access?userEmail=xxx&shareId=yyy`**

**Archivo:** `src/pages/api/agents/[id]/revoke-individual-access.ts`

**Parámetros:**
- `userEmail`: Email del usuario a revocar
- `shareId`: ID del share donde está el usuario

**Retorna:**
```json
{
  "success": true,
  "message": "Access revoked for user@domain.com"
}
```

**Validación:**
- Requiere autenticación (session cookie)
- Solo owner o SuperAdmin pueden revocar

---

### **4. Componente de UI**

**Archivo:** `src/components/AgentAccessTable.tsx` (NUEVO)

**Features:**
- ✅ Tabla con 8 columnas (según pedido)
- ✅ Sorting por cualquier columna (click en header)
- ✅ Indicadores visuales (↑↓ para sort)
- ✅ Botón de revocar por usuario
- ✅ Sección separada para accesos revocados (historial)
- ✅ Hover effects
- ✅ Colores diferenciados (activos verde, revocados gris)

**Columnas:**
1. **Nombre** - Nombre del usuario (sortable)
2. **Email** - Email completo (sortable, monospace)
3. **Organización** - Nombre de org (sortable)
4. **Dominio** - Domain badge (sortable)
5. **Nivel** - Badge de acceso (view/use/admin)
6. **Otorgado por** - Email del admin que compartió
7. **Fecha** - Fecha de compartición (sortable)
8. **Acción** - Botón X para revocar

**Historial (Tabla Inferior):**
- Usuarios que tuvieron acceso pero ya no
- Nombre tachado (line-through)
- Quién revocó y cuándo
- Opacidad reducida para diferencial

---

## 📊 **Formato Visual de la Tabla**

### **Usuarios Activos:**

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ Usuarios Activos (7)                                                                  │
├───────────────────────────────────────────────────────────────────────────────────────┤
│ Nombre ↓  │ Email                    │ Org        │ Dom    │ Nivel │ Por      │ Fecha │ X │
├───────────┼──────────────────────────┼────────────┼────────┼───────┼──────────┼───────┼───┤
│ Felipe    │ fcerda@construct...      │ Salfa Corp │ const. │ Usar  │ alec@... │ 11/12 │ X │
│ Cerda     │                          │            │        │       │          │       │   │
├───────────┼──────────────────────────┼────────────┼────────┼───────┼──────────┼───────┼───┤
│ Daniel    │ dortega@novatec.cl       │ -          │ novatec│ Usar  │ alec@... │ 11/4  │ X │
│ Ortega    │                          │            │        │       │          │       │   │
└───────────┴──────────────────────────┴────────────┴────────┴───────┴──────────┴───────┴───┘
```

### **Historial Revocados:**

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 📜 Historial - Accesos Revocados (2)                                      │
├───────────────────────────────────────────────────────────────────────────┤
│ Nombre      │ Email              │ Nivel │ Revocado por   │ Fecha Rev. │
├─────────────┼────────────────────┼───────┼────────────────┼────────────┤
│ Juan Pérez  │ jperez@domain.com  │ usar  │ alec@...       │ 11/10/2025 │
│ (tachado)   │                    │       │                │            │
└─────────────┴────────────────────┴───────┴────────────────┴────────────┘
```

---

## 🔄 **Flujo de Revocación Individual**

### **Antes (Problemático):**

```
1. Ver shares agrupados
2. Revocar TODO el share (todos los usuarios)
3. Perder historial de quién tenía acceso
4. No saber cuándo ni quién revocó
```

### **Ahora (Mejorado):**

```
1. Ver CADA usuario en una fila
2. Click X en la fila del usuario específico
3. Confirmar: "¿Revocar acceso para [Nombre]?"
4. Usuario se mueve de tabla "Activos" a "Revocados"
5. Historial queda registrado:
   - Quién otorgó acceso
   - Cuándo se otorgó
   - Quién revocó
   - Cuándo se revocó
6. Otros usuarios del mismo share NO afectados
```

---

## 🧪 **Testing**

### **Test 1: Cargar Accesos Individuales**

```bash
# Ejecutar después de implementar en UI
curl "http://localhost:3000/api/agents/5aNwSMgff2BRKrrVRypF/individual-access"

# Esperado:
{
  "access": [
    {
      "userId": "usr_a7l7qm5xfib2zt7lvq0l",
      "userEmail": "fcerda@constructorasalfa.cl",
      "userName": "Felipe Cerda",
      "domain": "constructorasalfa.cl",
      "organizationName": "Salfa Corp",
      "accessLevel": "use",
      "grantedByEmail": "alec@getaifactory.com",
      "grantedAt": "2025-11-12...",
      "shareId": "ymWa9nEgtpzo5gv6Z80q",
      "isActive": true
    },
    // ... 6 usuarios más
  ]
}
```

---

### **Test 2: Revocar Acceso Individual**

```bash
# Revocar fcerda
curl -X DELETE "http://localhost:3000/api/agents/5aNwSMgff2BRKrrVRypF/revoke-individual-access?userEmail=fcerda@constructorasalfa.cl&shareId=ymWa9nEgtpzo5gv6Z80q"

# Esperado:
{
  "success": true,
  "message": "Access revoked for fcerda@constructorasalfa.cl"
}

# Verificar en Firestore:
- Share ymWa9nEgtpzo5gv6Z80q:
  - sharedWith: 5 usuarios (sin fcerda)
  - individualAccess: 1 registro (fcerda con isActive: false)
```

---

## 📋 **Próximos Pasos**

### **Para Completar la Integración:**

1. **Integrar AgentAccessTable en AgentSharingModal:**
   - Reemplazar sección "Existing Shares (Right)"
   - Usar `<AgentAccessTable />` component
   - Pasar props: `activeAccess`, `revokedAccess`, `onRevokeAccess`

2. **Cargar datos en modal:**
   - En `loadData()` hacer fetch a `/api/agents/:id/individual-access`
   - Setear `individualAccess` state
   - Separar en `activeAccess` y `revokedAccess`

3. **Testing en UI:**
   - Abrir modal de compartir
   - Ver tabla de usuarios
   - Click en columnas para ordenar
   - Revocar un usuario
   - Verificar aparece en historial

---

## 🔒 **Seguridad & Auditoria**

### **Trazabilidad Completa:**

Cada acceso (activo o revocado) registra:
- ✅ Quién tiene/tuvo acceso (userId, email, nombre)
- ✅ A qué organización pertenece
- ✅ Qué nivel de acceso tiene/tenía
- ✅ Quién le otorgó el acceso (admin email)
- ✅ Cuándo se otorgó
- ✅ Si fue revocado: quién lo hizo y cuándo

### **Compliance:**

Esto permite:
- Auditorías de acceso
- Reportes de "quién accedió cuándo"
- Investigaciones de seguridad
- Cumplimiento regulatorio

---

## 📊 **Datos de Ejemplo**

### **Share Actual (ymWa9nEgtpzo5gv6Z80q):**

**sharedWith (6 usuarios activos):**
1. fcerda@constructorasalfa.cl
2. fdiazt@salfagestion.cl
3. sorellanac@salfagestion.cl
4. nfarias@salfagestion.cl
5-6. 2 usuarios sin email (legacy)

**Después de revocar fcerda:**

**sharedWith (5 usuarios):** 
- Los 5 restantes

**individualAccess (1 registro):**
```json
{
  "userEmail": "fcerda@constructorasalfa.cl",
  "userName": "Felipe Cerda",
  "domain": "constructorasalfa.cl",
  "organizationName": "Salfa Corp",
  "accessLevel": "use",
  "grantedByEmail": "alec@getaifactory.com",
  "grantedAt": "2025-11-12T11:44:28Z",
  "revokedByEmail": "alec@getaifactory.com",
  "revokedAt": "2025-11-12T14:35:00Z",
  "isActive": false
}
```

---

## 🎨 **Diseño de UI**

### **Tabla Activos:**

**Features:**
- Background blanco
- Hover verde claro (bg-green-50)
- Headers clickables para sort
- Indicador de sort (↑↓) en columna activa
- Botón X rojo para revocar
- Badges para nivel de acceso y dominio

**Responsive:**
- Scroll horizontal si no caben columnas
- Headers sticky al scroll vertical
- Altura máxima con overflow

### **Tabla Historial:**

**Features:**
- Background gris claro
- Opacidad 70% para diferencial
- Nombres tachados (line-through)
- Sin botones de acción (solo lectura)
- Colapsa si no hay revocados

---

## 🚀 **Implementación Pendiente**

### **En AgentSharingModal.tsx:**

**1. Agregar estados:**
```typescript
const [individualAccess, setIndividualAccess] = useState<Array<any>>([]);
const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'domain' | 'org'>('date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

**2. Cargar datos:**
```typescript
// En loadData():
const accessRes = await fetch(`/api/agents/${agent.id}/individual-access`);
if (accessRes.ok) {
  const accessData = await accessRes.json();
  setIndividualAccess(accessData.access || []);
}
```

**3. Separar activos/revocados:**
```typescript
const activeAccess = individualAccess.filter(a => a.isActive);
const revokedAccess = individualAccess.filter(a => !a.isActive);
```

**4. Reemplazar render:**
```typescript
{/* Reemplazar cards con tabla */}
<AgentAccessTable
  activeAccess={activeAccess}
  revokedAccess={revokedAccess}
  onRevokeAccess={handleRevokeIndividualAccess}
/>
```

**5. Función de revocación:**
```typescript
async function handleRevokeIndividualAccess(
  userEmail: string,
  shareId: string,
  userName: string
) {
  // Ya implementada (líneas 359-387)
}
```

---

## ✅ **Estado Actual**

### **Completado:**
- ✅ Modelo de datos (AgentShare con individualAccess)
- ✅ Función backend getAgentIndividualAccess()
- ✅ Función backend revokeIndividualAccess()
- ✅ API GET individual-access
- ✅ API DELETE revoke-individual-access
- ✅ Componente AgentAccessTable.tsx
- ✅ Índices de Firestore

### **Pendiente:**
- ⏳ Integrar AgentAccessTable en AgentSharingModal
- ⏳ Testing en UI
- ⏳ Migrar shares existentes a formato individualAccess

---

## 🔄 **Migración de Datos Existentes**

Los shares actuales solo tienen `sharedWith`. Para poblar `individualAccess` con historial:

**Opción 1: Lazy migration**
- Primera vez que se revoca un usuario, se crea individualAccess
- No requiere script de migración
- Historial se construye gradualmente

**Opción 2: Script de migración**
- Recorrer todos los agent_shares
- Por cada share, crear individualAccess para usuarios en sharedWith
- Marca todos como `isActive: true`
- `grantedBy` = ownerId del share
- `grantedAt` = createdAt del share

**Recomendación:** Opción 1 (lazy) es suficiente

---

## 📚 **Archivos Creados/Modificados**

1. **src/lib/firestore.ts** - 2 funciones nuevas, interface actualizada
2. **src/pages/api/agents/[id]/individual-access.ts** - NUEVO endpoint GET
3. **src/pages/api/agents/[id]/revoke-individual-access.ts** - NUEVO endpoint DELETE
4. **src/components/AgentAccessTable.tsx** - NUEVO componente tabla
5. **firestore.indexes.json** - Índices para agent_shares (ya agregados)

---

**Status:** 🔧 Backend 100% listo, UI 50% lista  
**Backward Compatible:** Sí (individualAccess es opcional)  
**Breaking Changes:** Ninguno  
**Next Step:** Integrar tabla en modal

