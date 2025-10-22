# Cambios en Sistema de Permisos para Grupos

**Fecha**: 2025-10-21  
**Versión**: 2.0.0 (Actualización)  
**Estado**: ✅ Implementado

---

## 🎯 Cambio Principal

> **Los grupos ahora SOLO pueden contener usuarios con rol 'user' y NUNCA pueden tener acceso 'admin' a agentes.**

---

## ❌ Antes (Incorrecto)

### Concepto Erróneo
```
Grupos podían tener cualquier usuario:
- user ✅
- expert ✅ 
- admin ✅

Grupos podían tener cualquier nivel:
- view ✅
- edit ✅
- admin ✅ ← PROBLEMA
```

### Problema
- ⚠️ Grupos con acceso admin podían elevar permisos
- ⚠️ Agregar miembro = dar admin accidental
- ⚠️ Expert en grupo perdía individualidad

---

## ✅ Ahora (Correcto)

### Concepto Correcto
```
Grupos SOLO pueden contener:
- user ✅
- expert ❌ → Compartir individualmente
- admin ❌ → Compartir individualmente

Grupos SOLO pueden tener niveles:
- view ✅
- use ✅
- admin ❌ → Solo usuarios individuales
```

### Ventajas
- ✅ No hay escalamiento de permisos
- ✅ Grupos homogéneos (solo usuarios básicos)
- ✅ Permisos elevados son siempre individuales
- ✅ Claridad en responsabilidades

---

## 🔄 Cambios Específicos

### 1. Interface `Group`

**Agregado**:
```typescript
maxAccessLevel: 'view' | 'use'; // NUNCA 'admin'
```

**Comentarios**:
```typescript
// IMPORTANT: Groups are for sharing access, NOT for elevating permissions
// Groups inherit the LOWEST permission level of their members
members: string[]; // User IDs - can only be 'user' role
```

---

### 2. Interface `AgentShare`

**Cambio**:
```typescript
// Antes:
accessLevel: 'view' | 'edit' | 'admin';

// Ahora:
accessLevel: 'view' | 'use' | 'admin'; // 'edit' → 'use' for clarity
```

**Comentarios**:
```typescript
// IMPORTANT: Access levels are restricted:
// - Groups can only have 'view' or 'use' (never 'admin')
// - Individual users can have any level IF their role permits
// - Users with 'user' role: max 'use' (warning if 'admin')
// - Users with 'expert'+ role: max 'admin'
```

---

### 3. Función `createGroup()`

**Agregado**:
```typescript
// Parámetro
maxAccessLevel: 'view' | 'use' = 'use'

// Validación
if (nonUserRoleMembers.length > 0) {
  throw new Error(
    `Los grupos solo pueden contener usuarios con rol 'user'. ` +
    `Los siguientes tienen roles elevados: ${names}`
  );
}
```

---

### 4. Función `addGroupMember()`

**Agregado**:
```typescript
// Validación estricta
const user = await getUserById(userId);

if (user.role !== 'user') {
  throw new Error(
    `Solo usuarios con rol 'user' pueden agregarse a grupos. ` +
    `${user.name} tiene rol '${user.role}' que tiene permisos elevados.`
  );
}
```

---

### 5. Función `shareAgent()`

**Agregado**:
```typescript
// Validación para grupos
const hasGroups = sharedWith.some(t => t.type === 'group');

if (hasGroups && accessLevel === 'admin') {
  throw new Error(
    'Los grupos no pueden tener nivel de acceso "admin". ' +
    'Solo "view" o "use" están permitidos.'
  );
}

// Warning para usuarios 'user' con admin
if (basicUsers.length > 0 && accessLevel === 'admin') {
  console.warn(`⚠️ Compartiendo admin a usuarios básicos: ${names}`);
}
```

---

### 6. UI Components

**GroupManagementPanel**:
```typescript
// Filtrar solo usuarios 'user'
allUsers.filter(user => user.role === 'user')

// Mensaje informativo
"ℹ️ Solo usuarios con rol 'user' pueden agregarse a grupos.
 Los grupos NO pueden elevar permisos."
```

**AgentSharingModal**:
```typescript
// Deshabilitar admin para grupos
const isAdminAllowed = shareType === 'user';

<button disabled={!isAdminAllowed}>Admin</button>

// Warning message
"⚠️ Los grupos solo pueden tener acceso 'Ver' o 'Usar'.
 Para acceso 'Admin', comparte con usuarios individuales."

// Auto-reset cuando cambia a grupo
useEffect(() => {
  if (shareType === 'group' && accessLevel === 'admin') {
    setAccessLevel('use');
  }
}, [shareType]);
```

---

## 📋 Validaciones Implementadas

### Backend (4 validaciones)

1. ✅ **createGroup**: Valida miembros iniciales
2. ✅ **addGroupMember**: Valida cada nuevo miembro
3. ✅ **shareAgent**: Valida nivel para grupos
4. ✅ **shareAgent**: Warning para usuarios básicos con admin

### Frontend (3 validaciones)

1. ✅ **GroupManagementPanel**: Filtra lista a solo 'user'
2. ✅ **AgentSharingModal**: Deshabilita botón admin para grupos
3. ✅ **AgentSharingModal**: Auto-reset nivel al cambiar tipo

---

## 🎓 Filosofía

### Principios Clave

1. **Grupos = Organización, NO Elevación**
   - Grupos facilitan compartir
   - Grupos NO dan permisos nuevos

2. **Permisos Individuales = Explícitos**
   - Cada usuario tiene su rol
   - Rol NO cambia por estar en grupo

3. **Separación de Conceptos**
   - Rol = Qué puedes hacer en el sistema
   - Grupo = Con quién compartes acceso
   - Share = Qué recursos específicos accedes

4. **Mínimo Privilegio por Defecto**
   - Grupos empiezan con `maxAccessLevel: 'use'`
   - Shares empiezan con `accessLevel: 'view'`
   - Escalar solo cuando necesario

---

## 🔍 Ejemplos Comparativos

### Ejemplo 1: Departamento Legal

**INCORRECTO** ❌:
```
Grupo "Legal" con:
- 5 abogados junior (user)
- 1 abogado senior (expert) ← NO PERMITIDO
- 1 jefe legal (admin) ← NO PERMITIDO

Share: Grupo Legal → admin ← NO PERMITIDO
```

**CORRECTO** ✅:
```
Grupo "Legal" con:
- 5 abogados junior (user) ✅

Shares:
- Grupo Legal → use ✅
- Abogado senior (individual) → admin ✅
- Jefe legal (individual) → admin ✅
```

---

### Ejemplo 2: Proyecto Temporal

**INCORRECTO** ❌:
```
Grupo "Proyecto Q1" con:
- 10 ingenieros (user)
- 2 gerentes (expert) ← NO PERMITIDO

Share: Grupo → admin ← NO PERMITIDO
```

**CORRECTO** ✅:
```
Grupo "Proyecto Q1" con:
- 10 ingenieros (user) ✅

Shares:
- Grupo Proyecto Q1 → use (exp: 2025-03-31) ✅
- Gerente 1 (individual) → admin ✅
- Gerente 2 (individual) → admin ✅
```

---

## ⚡ Migración para Usuarios Existentes

Si ya creaste grupos con usuarios elevados:

### Paso 1: Revisar Grupos
```
Admin Panel → Grupos → Ver cada grupo
```

### Paso 2: Identificar Miembros No Válidos
```
Grupo X tiene:
- Ana (user) ✅
- Carlos (expert) ❌ → Remover
```

### Paso 3: Remover Usuarios Elevados
```
Click ➖ al lado del usuario
Sistema permite remoción ✅
```

### Paso 4: Compartir Individualmente
```
Agente Y:
- Agregar share individual para Carlos (expert) → admin
```

---

## 📞 Errores Comunes

### Error 1: "Solo usuarios con rol 'user' pueden agregarse"

**Situación**: Intentas agregar expert a grupo

**Solución**: 
1. Comparte el agente directamente con el expert
2. Dale nivel "admin" individual
3. No uses grupos para usuarios con permisos elevados

---

### Error 2: "Grupos no pueden tener nivel 'admin'"

**Situación**: Intentas compartir agente con grupo y nivel admin

**Solución**:
1. Cambia nivel a "use" para el grupo
2. Comparte individualmente con usuarios que necesiten admin
3. Usa 2 shares separados: grupo (use) + individuales (admin)

---

### Error 3: No puedo seleccionar "Admin" en modal

**Situación**: Botón Admin está deshabilitado

**Razón**: Estás compartiendo con grupo (tab "Grupos")

**Solución**:
1. Cambia a tab "Usuarios"
2. Selecciona usuario individual
3. Ahora puedes seleccionar "Admin" ✅

---

## ✅ Checklist de Validación

Antes de crear grupo:
- [ ] ¿Todos los miembros tienen rol 'user'?
- [ ] ¿Hay usuarios con roles elevados? → Compartir individualmente
- [ ] ¿El maxAccessLevel es correcto? ('view' o 'use')

Antes de compartir con grupo:
- [ ] ¿El nivel es 'view' o 'use'? (NO 'admin')
- [ ] ¿Hay usuarios que necesiten admin? → Share individual adicional
- [ ] ¿La expiración es correcta?

---

## 📚 Documentación Relacionada

- `docs/GRUPOS_FILOSOFIA_PERMISOS.md` - Filosofía completa ⭐
- `docs/USER_GROUPS_SHARING_SYSTEM.md` - Arquitectura técnica
- `docs/GRUPOS_USUARIOS_QUICK_START.md` - Guía de uso
- `.cursor/rules/userpersonas.mdc` - Definición de roles
- `.cursor/rules/privacy.mdc` - Seguridad

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────────────┐
│         SISTEMA DE PERMISOS                 │
├─────────────────────────────────────────────┤
│                                             │
│  ROLES INDIVIDUALES (Sistema)               │
│  ├─ admin → Permisos totales               │
│  ├─ expert → Certificación                 │
│  └─ user → Uso básico                      │
│                                             │
│  ↓ NO SE MEZCLA CON ↓                       │
│                                             │
│  GRUPOS (Organización)                      │
│  ├─ Solo miembros 'user'                   │
│  ├─ maxAccessLevel: 'view' | 'use'         │
│  └─ NO pueden tener 'admin'                │
│                                             │
│  ↓ FACILITA ↓                               │
│                                             │
│  SHARES (Acceso a Recursos)                 │
│  ├─ A grupos: 'view' | 'use'               │
│  ├─ A individuales: 'view' | 'use' | 'admin'│
│  └─ Validación por target type              │
│                                             │
└─────────────────────────────────────────────┘
```

---

**Última Actualización**: 2025-10-21  
**Autor**: Alec  
**Breaking Changes**: ✅ Sí (validaciones estrictas)  
**Backward Compatible**: ⚠️ Parcial (grupos existentes deben limpiarse)

---

## ✨ Resultado Final

Sistema de permisos **seguro**, **claro** y **escalable** que:

✅ Previene escalamiento accidental de permisos  
✅ Mantiene roles individuales como fuente de verdad  
✅ Usa grupos solo para organización  
✅ Permite delegación controlada (shares individuales)  
✅ Fácil de entender y auditar

