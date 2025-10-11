# 🔐 Sistema de Gestión de Usuarios y Administración

## 📋 Resumen Ejecutivo

Sistema completo de gestión de usuarios con **13 roles granulares** y **16 permisos diferentes** para Context y Agent management. Incluye panel de administración, APIs REST, y script de seeding para usuarios demo.

---

## 🎯 Roles y Permisos

### Tipos de Roles

| Rol | Descripción | Permisos Principales |
|-----|-------------|---------------------|
| `admin` | Administrador completo | Todos los permisos |
| `expert` | Experto con acceso amplio | Crear, editar, revisar, aprobar |
| `user` | Usuario básico sin permisos especiales | Solo visualización |
| `context_signoff` | Aprueba contextos | Revisar y aprobar contextos |
| `agent_signoff` | Aprueba agentes | Revisar y aprobar agentes |
| `context_reviewer` | Revisa contextos | Revisar contextos |
| `agent_reviewer` | Revisa agentes | Revisar agentes |
| `context_creator` | Crea contextos | Crear y editar contextos |
| `agent_creator` | Crea agentes | Crear y editar agentes |
| `context_collaborator` | Colabora en contextos | Editar y compartir contextos |
| `agent_collaborator` | Colabora en agentes | Editar y compartir agentes |
| `context_owner` | Dueño de contextos | Control total de contextos |
| `agent_owner` | Dueño de agentes | Control total de agentes |

### Matriz de Permisos

| Permiso | admin | expert | context_owner | agent_owner | context_signoff | otros |
|---------|-------|--------|---------------|-------------|-----------------|-------|
| `canManageUsers` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canManageSystem` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `canCreateContext` | ✅ | ✅ | ✅ | ❌ | ❌ | varies |
| `canEditContext` | ✅ | ✅ | ✅ | ❌ | ❌ | varies |
| `canDeleteContext` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `canReviewContext` | ✅ | ✅ | ✅ | ❌ | ✅ | varies |
| `canSignOffContext` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `canShareContext` | ✅ | ✅ | ✅ | ❌ | ❌ | varies |
| `canCreateAgent` | ✅ | ✅ | ❌ | ✅ | ❌ | varies |
| `canEditAgent` | ✅ | ✅ | ❌ | ✅ | ❌ | varies |
| `canDeleteAgent` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `canReviewAgent` | ✅ | ✅ | ❌ | ✅ | ❌ | varies |
| `canSignOffAgent` | ✅ | ✅ | ❌ | ✅ | ❌ | varies |
| `canShareAgent` | ✅ | ✅ | ❌ | ✅ | ❌ | varies |
| `canCollaborate` | ✅ | ✅ | ✅ | ✅ | ❌ | varies |
| `canViewAnalytics` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🚀 Inicio Rápido

### 1. Crear Usuarios Demo (Producción)

**Requisito**: Firestore debe estar configurado en producción.

```bash
# Asegurar que GOOGLE_CLOUD_PROJECT y credenciales estén configuradas
export GOOGLE_CLOUD_PROJECT=ocr-kaufmann-legal
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Ejecutar seeding
npm run seed:users
```

**Output esperado:**
```
🌱 Starting user seeding...

✅ Created alec@getaifactory.com - admin
✅ Created admin@demo.com - admin
✅ Created expert@demo.com - expert
...

📊 Seeding Summary:
   ✅ Created: 14
   ⏭️  Skipped: 0
   ❌ Errors: 0
   📝 Total: 14

✨ Seeding complete!
```

### 2. Acceder al Panel de Administración

```
URL: https://your-domain.com/admin
o
URL: http://localhost:3000/admin (local)
```

**Requisito**: Usuario debe ser `admin` role.

### 3. Gestionar Usuarios desde UI

En `/admin`:
- ✅ Ver lista de usuarios con avatares
- ✅ Filtrar por rol y estado
- ✅ Cambiar rol con dropdown inline
- ✅ Activar/desactivar usuarios con toggle
- ✅ Eliminar usuarios (con confirmación)
- ✅ Ver última fecha de acceso

---

## 📦 Estructura del Sistema

### Archivos Creados

```
src/
├── types/
│   └── users.ts                    # Tipos, roles, permisos
├── lib/
│   └── firestore.ts                # Funciones CRUD de usuarios (agregadas)
├── pages/
│   ├── admin.astro                 # Página de administración
│   └── api/
│       └── admin/
│           └── users.ts            # API REST para usuarios
└── components/
    └── AdminPanel.tsx              # Componente React del panel

scripts/
└── seed-users.ts                   # Script de seeding

package.json                        # Agregado "seed:users" script
```

### Firestore Collection

**Collection**: `users`

**Document ID**: Email con `@` y `.` reemplazados por `_`  
Ejemplo: `alec@getaifactory.com` → `alec_getaifactory_com`

**Schema**:
```typescript
{
  email: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  company: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  avatarUrl?: string;
}
```

---

## 🔌 API Reference

### Base URL
```
/api/admin/users
```

### Endpoints

#### GET - Listar Usuarios
```http
GET /api/admin/users?userId={adminUserId}
GET /api/admin/users?userId={adminUserId}&checkId={specificUserId}
```

**Requiere**: `userId` debe ser admin

**Response**:
```json
[
  {
    "id": "alec_getaifactory_com",
    "email": "alec@getaifactory.com",
    "name": "Alec Dickinson",
    "role": "admin",
    "permissions": { ... },
    "company": "AI Factory LLC",
    "department": "Engineering",
    "isActive": true,
    "createdAt": "2025-10-11T...",
    "updatedAt": "2025-10-11T..."
  }
]
```

#### POST - Crear Usuario
```http
POST /api/admin/users
Content-Type: application/json

{
  "userId": "alec_getaifactory_com",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user",
  "company": "Company Name",
  "department": "Optional Department"
}
```

**Response**: Created user object

#### PUT - Actualizar Usuario
```http
PUT /api/admin/users
Content-Type: application/json

{
  "userId": "alec_getaifactory_com",
  "targetUserId": "user_to_update",
  "updates": {
    "name": "New Name",
    "department": "New Department"
  }
}
```

#### PATCH - Cambiar Rol o Estado
```http
PATCH /api/admin/users
Content-Type: application/json

{
  "userId": "alec_getaifactory_com",
  "targetUserId": "user_to_update",
  "action": "updateRole",  // or "setActive"
  "value": "expert"        // or true/false for setActive
}
```

#### DELETE - Eliminar Usuario
```http
DELETE /api/admin/users?userId={adminUserId}&targetUserId={userToDelete}
```

**Restricción**: No puedes eliminarte a ti mismo

---

## 💻 Uso Programático

### Crear Usuario

```typescript
import { createUser } from '../lib/firestore';

const newUser = await createUser(
  'user@example.com',
  'User Name',
  'context_creator',
  'Company Name',
  'Department'  // opcional
);
```

### Verificar si es Admin

```typescript
import { isUserAdmin } from '../lib/firestore';

const isAdmin = await isUserAdmin('alec_getaifactory_com');
if (isAdmin) {
  // Permitir operación administrativa
}
```

### Actualizar Rol

```typescript
import { updateUserRole } from '../lib/firestore';

await updateUserRole('user_id', 'expert');
// Automáticamente actualiza permisos según el rol
```

### Obtener Usuario

```typescript
import { getUserByEmail, getUserById } from '../lib/firestore';

const user = await getUserByEmail('alec@getaifactory.com');
// o
const user = await getUserById('alec_getaifactory_com');

if (user) {
  console.log(user.permissions.canManageUsers); // true/false
}
```

---

## 🛡️ Seguridad

### Protecciones Implementadas

1. **Verificación de Admin**: Todas las operaciones verifican que el usuario requestor sea admin
2. **Auto-Protección**: No puedes eliminar o desactivar tu propia cuenta
3. **Validación de Campos**: Campos requeridos validados en API
4. **Manejo de Errores**: Try-catch completo con mensajes descriptivos
5. **TypeScript Strict**: Tipos estrictos para prevenir errores

### Middleware Recomendado

```typescript
// middleware/auth.ts (TODO: Implementar)
export async function requireAdmin(userId: string) {
  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function requirePermission(
  userId: string, 
  permission: keyof UserPermissions
) {
  const user = await getUserById(userId);
  if (!user || !user.permissions[permission]) {
    throw new Error(`Unauthorized: Missing permission ${permission}`);
  }
}
```

---

## 🎨 UI/UX del Admin Panel

### Features

- ✅ **Avatares Coloridos**: Iniciales del nombre en círculos con gradiente
- ✅ **Filtros Dinámicos**: Por rol y estado (activo/inactivo)
- ✅ **Edición Inline**: Cambiar rol directamente desde la tabla
- ✅ **Toggle Estados**: Click para activar/desactivar
- ✅ **Confirmación de Eliminación**: Alert antes de borrar
- ✅ **Badges de Rol**: Colores diferentes por tipo de rol
- ✅ **Responsive**: Funciona en desktop y tablet
- ✅ **Loading States**: Spinner mientras carga datos

### Colores de Roles

```typescript
admin → Rojo (bg-red-100 text-red-800)
expert → Púrpura (bg-purple-100 text-purple-800)
*_owner → Azul (bg-blue-100 text-blue-800)
*_signoff → Verde (bg-green-100 text-green-800)
*_reviewer → Amarillo (bg-yellow-100 text-yellow-800)
*_creator → Índigo (bg-indigo-100 text-indigo-800)
*_collaborator → Rosa (bg-pink-100 text-pink-800)
user → Gris (bg-gray-100 text-gray-800)
```

---

## 📊 Usuarios Demo Creados

Al ejecutar `npm run seed:users`, se crean 14 usuarios:

| Email | Rol | Departamento |
|-------|-----|--------------|
| alec@getaifactory.com | admin | Engineering |
| admin@demo.com | admin | Administration |
| expert@demo.com | expert | Operations |
| user@demo.com | user | General |
| context_signoff@demo.com | context_signoff | Quality Assurance |
| agent_signoff@demo.com | agent_signoff | Quality Assurance |
| context_reviewer@demo.com | context_reviewer | Review |
| agent_reviewer@demo.com | agent_reviewer | Review |
| context_creator@demo.com | context_creator | Content |
| agent_creator@demo.com | agent_creator | Content |
| context_collaborator@demo.com | context_collaborator | Collaboration |
| agent_collaborator@demo.com | agent_collaborator | Collaboration |
| context_owner@demo.com | context_owner | Management |
| agent_owner@demo.com | agent_owner | Management |

Todos los usuarios tienen:
- `company: 'Demo Company'` (excepto alec)
- `isActive: true`
- Permisos asignados automáticamente según su rol

---

## 🔄 Flujos de Trabajo

### Crear Nuevo Usuario

1. Admin accede a `/admin`
2. Click en "Crear Usuario"
3. Completa formulario (email, nombre, rol, empresa)
4. Submit
5. Usuario creado con permisos automáticos
6. Aparece en lista de usuarios

### Cambiar Rol de Usuario

1. Admin accede a `/admin`
2. Localiza usuario en tabla
3. Click en dropdown de rol
4. Selecciona nuevo rol
5. Permisos se actualizan automáticamente

### Desactivar Usuario

1. Admin accede a `/admin`
2. Localiza usuario
3. Click en badge de estado (Activo/Inactivo)
4. Usuario desactivado (no puede acceder al sistema)

### Eliminar Usuario

1. Admin accede a `/admin`
2. Click en botón "Eliminar"
3. Confirma en alert dialog
4. Usuario eliminado de Firestore

---

## 🚀 Deployment

### Producción (Cloud Run)

```bash
# 1. Asegurar que variables de entorno estén configuradas
GOOGLE_CLOUD_PROJECT=ocr-kaufmann-legal
GOOGLE_APPLICATION_CREDENTIALS=/secrets/service-account.json

# 2. Deploy aplicación
gcloud run deploy openflow ...

# 3. SSH a Cloud Run instance o ejecutar localmente con credenciales prod
npm run seed:users

# 4. Verificar usuarios en Firestore console
https://console.cloud.google.com/firestore/data
```

### Desarrollo Local

Como Firestore no está configurado localmente, el panel de admin mostrará error. Para testear:

1. **Opción A**: Configurar Firestore Emulator
```bash
firebase emulators:start --only firestore
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run seed:users
```

2. **Opción B**: Usar credenciales de producción (con cuidado)
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/prod-credentials.json
npm run seed:users
```

---

## 📝 TODOs Futuros

- [ ] Sistema de autenticación real (OAuth, JWT)
- [ ] Integrar userId del session actual en lugar de hardcoded
- [ ] Middleware de autorización en API routes
- [ ] Audit log de cambios en usuarios
- [ ] Búsqueda y paginación en admin panel
- [ ] Export usuarios a CSV
- [ ] Bulk operations (activar/desactivar múltiples)
- [ ] Password reset flow
- [ ] Email notifications on user creation
- [ ] 2FA/MFA support

---

## 🐛 Troubleshooting

### Error: "Firestore not configured"

**Solución**: Configurar credenciales de GCP
```bash
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Error: "Unauthorized"

**Causa**: Usuario no es admin  
**Solución**: Verificar que el userId en la request sea de un usuario con rol `admin`

### Error: "Cannot delete your own account"

**Causa**: Intentando auto-eliminarse  
**Solución**: Usa otra cuenta admin para eliminar

### Usuarios no aparecen en /admin

**Causa**: Firestore no configurado o no hay conexión  
**Solución**: Verificar logs del navegador y configuración de Firestore

---

## 📚 Referencias

- **Tipos**: `src/types/users.ts`
- **Funciones**: `src/lib/firestore.ts` (líneas 451-640)
- **API**: `src/pages/api/admin/users.ts`
- **UI**: `src/components/AdminPanel.tsx`
- **Seeding**: `scripts/seed-users.ts`

---

**Última actualización**: 11 de octubre de 2025  
**Versión**: 1.0.0  
**Autor**: OpenFlow Team

