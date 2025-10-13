# 🧪 Testing Completo con Múltiples Usuarios

## ✅ Sistema Completo de Testing Implementado

He creado un sistema completo de datos de prueba con **5 tipos de usuarios** y múltiples escenarios para testing exhaustivo.

---

## 👥 Usuarios Disponibles

| # | Usuario | ID | Email | Rol | Conversaciones | Descripción |
|---|---------|-----|-------|-----|----------------|-------------|
| 1 | **Admin Demo** | `admin_demo` | admin@demo.com | admin | 4 | Acceso completo, gestión usuarios, config sistema |
| 2 | **Expert Demo** | `expert_demo` | expert@demo.com | expert | 3 | Validación de contexto y agentes, analytics |
| 3 | **Usuario Estándar** | `user_standard` | user@demo.com | user | 3 | Uso básico, chat, workflows simples |
| 4 | **Power User** | `power_user` | poweruser@demo.com | user | 8 | Múltiples agentes, config avanzada, uso intensivo |
| 5 | **Usuario Nuevo** | `new_user` | newuser@demo.com | user | 1 | Primera vez, onboarding, sin historial |

---

## 🚀 Inicio Rápido (3 comandos)

### 1. Crear Datos de Prueba (Localhost)
```bash
npm run seed:complete
```

**Output esperado:**
```
🌱 Iniciando seeding COMPLETO de datos de prueba
═══════════════════════════════════════════════════════════

👤 Creando datos para: admin_demo (admin)
   ✅ User Settings: gemini-2.5-pro
   ✅ Conversación 1: Sistema: Configuración inicial
   ✅ Conversación 2: Sistema: Análisis de datos
   ...

✅ ¡Seeding COMPLETO exitoso!

📊 RESUMEN GENERAL:
   - Ambiente: localhost
   - Usuarios creados: 5
   - Conversaciones: 19
   - Workflows configurados: 14
   - Usage Logs: 28+
```

---

### 2. Verificar Datos
```bash
npm run verify:users
```

**Output esperado:**
```
🔍 Verificando TODOS los tipos de usuarios

👤 Verificando: admin_demo (admin)
   ✅ User Settings encontrado
   ✅ Modelo correcto: gemini-2.5-pro
   ✅ Campo 'source' presente: localhost
   ✅ Conversaciones: 4
   ✅ Workflows: 4
   ✅ Usage Logs: 9 registros

...

📊 RESUMEN FINAL:
   ✅ Verificaciones exitosas: 30
   ❌ Errores encontrados: 0

✨ ¡Todos los usuarios tienen datos correctos!
```

---

### 3. Iniciar Servidor
```bash
npm run dev
```

Abre: http://localhost:3000/chat

---

## 🧪 Casos de Prueba por Usuario

### 1. Admin Demo (`admin_demo`)

**Login:** admin@demo.com

**Probar:**
```
✅ Ver dashboard de usuarios
✅ Impersonar otro usuario (user_standard)
✅ Volver a vista admin
✅ Validar context sources
✅ Acceder a analytics globales
✅ Configurar sistema
✅ Ver 4 conversaciones
✅ Modelo: Gemini 2.5 Pro
✅ 4 workflows avanzados
```

**Permisos que debe tener:**
- ✅ Gestión de usuarios
- ✅ Impersonación
- ✅ Config del sistema
- ✅ Analytics globales
- ✅ Validación completa

**Permisos que NO debe tener:**
- (Ninguno - admin tiene todos)

---

### 2. Expert Demo (`expert_demo`)

**Login:** expert@demo.com

**Probar:**
```
✅ Ver context sources propios
✅ Validar sources (marcar "✓ Validado")
✅ Ver analytics propios
✅ Configurar workflows avanzados
✅ Ver 3 conversaciones
✅ Modelo: Gemini 2.5 Pro
✅ Temperature: 0.3 (más determinista)
❌ NO puede ver usuarios
❌ NO puede acceder a config sistema
```

**Permisos que debe tener:**
- ✅ Validación de contexto
- ✅ Validación de agentes
- ✅ Analytics propios
- ✅ Config avanzada

**Permisos que NO debe tener:**
- ❌ Gestión de usuarios
- ❌ Config del sistema
- ❌ Analytics globales

---

### 3. Usuario Estándar (`user_standard`)

**Login:** user@demo.com

**Probar:**
```
✅ Crear conversaciones
✅ Chat básico
✅ Agregar context sources
✅ Workflows básicos
✅ Ver 3 conversaciones
✅ Modelo: Gemini 2.5 Flash
❌ NO puede validar
❌ NO acceso a analytics
❌ NO gestión de usuarios
```

**Permisos que debe tener:**
- ✅ Crear conversaciones
- ✅ Usar contexto
- ✅ Workflows básicos

**Permisos que NO debe tener:**
- ❌ Validación
- ❌ Analytics
- ❌ Gestión de usuarios
- ❌ Config del sistema

---

### 4. Power User (`power_user`)

**Login:** poweruser@demo.com

**Probar:**
```
✅ Ver 8 conversaciones
✅ Cambiar rápidamente entre agentes
✅ Cada agente mantiene su config
✅ Config avanzada por agente
✅ Uso intensivo de mensajes
✅ Importación/exportación masiva
✅ Modelo: Gemini 2.5 Flash
❌ NO puede validar
❌ NO acceso a analytics globales
```

**Escenarios únicos:**
- ✅ Múltiples agentes simultáneos
- ✅ Cambio rápido entre agentes
- ✅ Diferentes configs por agente
- ✅ Uso intensivo del sistema

---

### 5. Usuario Nuevo (`new_user`)

**Login:** newuser@demo.com

**Probar:**
```
✅ Ver interfaz vacía/limpia
✅ Crear primera conversación
✅ Primer mensaje
✅ Onboarding experience
✅ Configuración inicial
✅ Solo 1 conversación
❌ NO tiene configuración previa
❌ NO tiene historial
```

**Escenarios únicos:**
- ✅ Primera vez en el sistema
- ✅ Onboarding
- ✅ Sin historial previo
- ✅ Configuración por defecto

---

## 📊 Datos Creados por Usuario

### Admin Demo (4 conv, 4 workflows)
- 32 mensajes (8 por conversación)
- 3 context sources activos
- 9 usage logs
- Workflows: PDF, CSV, Web, API
- Modelo preferido: Pro

### Expert Demo (3 conv, 4 workflows)
- 18 mensajes (6 por conversación)
- 2 context sources activos
- 6 usage logs
- Workflows: PDF, CSV, Web, API
- Modelo preferido: Pro

### User Standard (3 conv, 2 workflows)
- 12 mensajes (4 por conversación)
- 1 context source activo
- 2 usage logs
- Workflows: PDF, CSV
- Modelo preferido: Flash

### Power User (8 conv, 2 workflows)
- 40 mensajes (5 por conversación promedio)
- 1 context source activo
- 9 usage logs
- Workflows: PDF, CSV
- Modelo preferido: Flash

### New User (1 conv, 2 workflows)
- 0 mensajes (nuevo)
- 1 context source activo
- 2 usage logs
- Workflows: PDF, CSV
- Modelo preferido: Flash

---

## 🌍 Ambientes

### Localhost (Default)
```bash
npm run seed:complete
```
Crea datos con `source: "localhost"`

### Production
```bash
npm run seed:complete:prod
```
Crea datos con `source: "production"`

### Ver por Ambiente en Firestore

**Filtrar Localhost:**
```javascript
source == "localhost"
```

**Filtrar Production:**
```javascript
source == "production"
```

---

## 🔗 URLs Útiles

### Firestore Console Principal:
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
```

### Colecciones por Tipo:

**User Settings:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fuser_settings
```
Buscar: `admin_demo`, `expert_demo`, `user_standard`, `power_user`, `new_user`

**Conversaciones:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fconversations
```
Filtrar por `userId` para ver conversaciones de cada usuario

**Agent Configs:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fagent_configs
```
Deberías ver ~19 documentos (total de conversaciones)

**Workflow Configs:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fworkflow_configs
```
Deberías ver ~14 documentos (workflows por usuario)

**Usage Logs:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fusage_logs
```
Deberías ver 28+ documentos

---

## 🔍 Verificación Detallada

### Verificar Todo:
```bash
npm run verify:users
```

### Verificar Usuario Específico:
```bash
# Editar scripts/verify-all-users.ts
# Comentar usuarios que no quieres verificar
npx tsx scripts/verify-all-users.ts
```

### Verificar en Firestore Console:

1. **User Settings:** Debe haber 5 documentos
2. **Conversaciones:** Debe haber 19 documentos total
3. **Agent Configs:** Debe haber 19 documentos (1 por conversación)
4. **Workflow Configs:** Debe haber 14 documentos
5. **Usage Logs:** Debe haber 28+ documentos
6. **Cada documento debe tener:** `source: "localhost"` o `"production"`

---

## 🧪 Matriz de Testing

| Caso de Prueba | Admin | Expert | User | Power | New |
|----------------|-------|--------|------|-------|-----|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Múltiples conversaciones | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cambiar entre agentes | ✅ | ✅ | ✅ | ✅ | ❌ |
| User settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agent config | ✅ | ✅ | ✅ | ✅ | ✅ |
| Config avanzada | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver sources propios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver sources otros | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Validar sources | ✅ | ✅ | ❌ | ❌ | ❌ |
| Workflows básicos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workflows avanzados | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics propios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics globales | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestión usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impersonación | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📝 Checklist de Testing

### Para Cada Usuario:

```
□ Login exitoso
□ User settings cargados de Firestore
□ Conversaciones visibles
□ Cambio entre agentes funciona
□ Cada agente mantiene su config
□ Context sources activos correctos
□ Workflows disponibles correctos
□ Permisos correctos según rol
□ NO puede hacer lo que no debería
□ Recargar página mantiene estado
```

---

## 🎯 Flujos de Testing Completos

### Flujo 1: Admin → Impersonación → User
```
1. Login como admin_demo
2. Ver 4 conversaciones
3. Ir a gestión de usuarios
4. Impersonar user_standard
5. Ahora ver como usuario estándar (3 conv)
6. Crear conversación como usuario
7. Volver a admin
8. Verificar que conversación se creó
```

### Flujo 2: Expert → Validación
```
1. Login como expert_demo
2. Ver 3 conversaciones
3. Ir a context sources
4. Abrir source sin validar
5. Revisar contenido
6. Marcar como "✓ Validado"
7. Ver en Firestore que se marcó
```

### Flujo 3: Power → Múltiples Agentes
```
1. Login como power_user
2. Ver 8 conversaciones
3. Cambiar entre varias
4. Enviar mensaje en cada una
5. Verificar que cada una responde con su config
6. Cambiar config de una
7. Verificar que otras NO cambian
```

### Flujo 4: New → Onboarding
```
1. Login como new_user
2. Ver interfaz casi vacía (1 conv)
3. Crear primera conversación real
4. Configurar preferencias
5. Agregar primer context source
6. Enviar primer mensaje
7. Ver respuesta
```

---

## 💡 Tips de Testing

1. **Siempre verifica en Firestore Console** después de cada acción importante
2. **Usa diferentes navegadores** para simular múltiples usuarios simultáneos
3. **Recarga la página** frecuentemente para verificar persistencia
4. **Compara** comportamiento entre usuarios con diferentes roles
5. **Documenta** cualquier comportamiento inesperado

---

## 📚 Documentación Adicional

- `docs/TIPOS_USUARIOS_TESTING.md` - Detalle completo de cada tipo de usuario
- `FIRESTORE_PERSISTENCE_SYSTEM.md` - Arquitectura técnica del sistema
- `PERSISTENCIA_COMPLETA_RESUMEN.md` - Resumen ejecutivo

---

## 🚀 ¡Empezar Ahora!

```bash
# 1. Crear datos
npm run seed:complete

# 2. Verificar
npm run verify:users

# 3. Probar
npm run dev
```

**¡Sistema completo de testing con 5 tipos de usuarios listo para usar!** 🎉

