# 👥 Tipos de Usuarios para Testing - Flow

## 🎯 Propósito

Este documento describe los **5 tipos de usuarios** creados para testing con diferentes roles, permisos y escenarios de uso.

---

## 📊 Resumen de Usuarios

| Usuario | ID | Email | Rol | Conversaciones | Escenarios |
|---------|-----|-------|-----|----------------|------------|
| **Admin Demo** | `admin_demo` | admin@demo.com | admin | 4 | Acceso completo, gestión de usuarios, config del sistema |
| **Expert Demo** | `expert_demo` | expert@demo.com | expert | 3 | Validación de contexto, validación de agentes, analytics |
| **Usuario Estándar** | `user_standard` | user@demo.com | user | 3 | Chat básico, uso de contexto, workflows simples |
| **Power User** | `power_user` | poweruser@demo.com | user | 8 | Múltiples agentes, config avanzada, uso intensivo |
| **Usuario Nuevo** | `new_user` | newuser@demo.com | user | 1 | Primera vez, onboarding |

---

## 👤 Perfiles Detallados

### 1. Admin Demo (`admin_demo`)

**Rol:** Administrador del sistema

**Permisos:**
- ✅ Acceso completo al sistema
- ✅ Gestión de usuarios
- ✅ Configuración del sistema
- ✅ Acceso a analytics globales
- ✅ Validación de contenido
- ✅ Impersonación de usuarios

**User Settings:**
```typescript
{
  preferredModel: 'gemini-2.5-pro',
  systemPrompt: 'Eres un asistente administrativo con acceso completo al sistema. Proporciona respuestas detalladas y técnicas.',
  language: 'es'
}
```

**Conversaciones:**
- 4 conversaciones con diferentes enfoques
- Mezcla de modelos Flash y Pro
- Mensajes de ejemplo (8 por conversación)

**Workflows Configurados:**
- ✅ Extracción PDF (avanzada)
- ✅ Análisis CSV
- ✅ Scraping Web
- ✅ Integración API

**Agent Configs:**
- Modelo: Gemini 2.5 Pro
- Temperature: 0.7
- Max Tokens: 16384

**Context Sources:**
- admin-docs-1
- system-config-1
- user-manual-1

**Usage Logs:**
- Create conversation
- Send message
- Add context source
- Change model
- Configure workflow
- Validate source
- Bulk import
- Export data
- API integration

**Casos de Prueba:**
```
✅ Login como admin
✅ Ver todos los usuarios
✅ Impersonar otro usuario
✅ Acceder a analytics globales
✅ Validar sources de otros usuarios
✅ Configurar sistema
✅ Exportar datos
```

---

### 2. Expert Demo (`expert_demo`)

**Rol:** Experto en validación

**Permisos:**
- ✅ Validación de contexto
- ✅ Validación de agentes
- ✅ Acceso a analytics (propio)
- ✅ Configuración avanzada
- ⚠️ NO gestión de usuarios
- ⚠️ NO config del sistema

**User Settings:**
```typescript
{
  preferredModel: 'gemini-2.5-pro',
  systemPrompt: 'Eres un experto en validación de contenido. Analiza cuidadosamente y proporciona feedback constructivo.',
  language: 'es'
}
```

**Conversaciones:**
- 3 conversaciones enfocadas en validación
- Uso de Gemini Pro para precisión
- Mensajes de ejemplo (6 por conversación)

**Workflows Configurados:**
- ✅ Extracción PDF (avanzada)
- ✅ Análisis CSV
- ✅ Scraping Web
- ✅ Integración API

**Agent Configs:**
- Modelo: Gemini 2.5 Pro
- Temperature: 0.3 (más determinista)
- Max Tokens: 8192

**Context Sources:**
- validation-guide-1
- quality-standards-1

**Usage Logs:**
- Create conversation
- Send message
- Add context source
- Change model
- Configure workflow
- Validate source

**Casos de Prueba:**
```
✅ Login como expert
✅ Ver sources propios
✅ Validar context sources
✅ Marcar como "✓ Validado"
✅ Ver analytics propios
✅ Configurar workflows avanzados
❌ NO puede ver usuarios
❌ NO puede acceder a config del sistema
```

---

### 3. Usuario Estándar (`user_standard`)

**Rol:** Usuario regular

**Permisos:**
- ✅ Crear conversaciones
- ✅ Usar contexto
- ✅ Workflows básicos
- ⚠️ NO validación
- ⚠️ NO analytics
- ⚠️ NO gestión de usuarios

**User Settings:**
```typescript
{
  preferredModel: 'gemini-2.5-flash',
  systemPrompt: 'Eres un asistente útil y amigable. Responde de manera clara y concisa.',
  language: 'es'
}
```

**Conversaciones:**
- 3 conversaciones de uso típico
- Uso de Gemini Flash (económico)
- Mensajes de ejemplo (4 por conversación)

**Workflows Configurados:**
- ✅ Extracción PDF (básica)
- ✅ Análisis CSV

**Agent Configs:**
- Modelo: Gemini 2.5 Flash
- Temperature: 0.7
- Max Tokens: 8192

**Context Sources:**
- getting-started-1

**Usage Logs:**
- Create conversation
- Send message

**Casos de Prueba:**
```
✅ Login como user
✅ Crear conversaciones
✅ Chat básico
✅ Agregar context sources
✅ Workflows básicos
❌ NO puede validar
❌ NO acceso a analytics
❌ NO gestión de usuarios
```

---

### 4. Power User (`power_user`)

**Rol:** Usuario avanzado

**Permisos:**
- ✅ Crear muchas conversaciones
- ✅ Configuración avanzada
- ✅ Uso intensivo
- ✅ Workflows básicos
- ⚠️ NO validación
- ⚠️ NO analytics globales

**User Settings:**
```typescript
{
  preferredModel: 'gemini-2.5-flash',
  systemPrompt: 'Eres un asistente útil y amigable. Responde de manera clara y concisa.',
  language: 'es'
}
```

**Conversaciones:**
- 8 conversaciones (múltiples agentes)
- Mezcla de modelos según necesidad
- Mensajes de ejemplo (4-7 por conversación)

**Workflows Configurados:**
- ✅ Extracción PDF
- ✅ Análisis CSV

**Agent Configs:**
- Modelo: Gemini 2.5 Flash (mayormente)
- Temperature: 0.7
- Max Tokens: 8192
- Configuraciones variadas por agente

**Context Sources:**
- getting-started-1

**Usage Logs:**
- Create conversation (múltiples)
- Send message (muchos)
- Add context source
- Change model
- Configure workflow
- Bulk import
- Export data

**Casos de Prueba:**
```
✅ Login como power user
✅ Múltiples conversaciones activas
✅ Cambiar entre agentes rápidamente
✅ Diferentes configs por agente
✅ Uso intensivo de mensajes
✅ Importación masiva
✅ Exportación de datos
❌ NO puede validar
❌ NO acceso a analytics globales
```

---

### 5. Usuario Nuevo (`new_user`)

**Rol:** Usuario sin experiencia previa

**Permisos:**
- ✅ Crear primera conversación
- ✅ Chat básico
- ⚠️ Config mínima

**User Settings:**
```typescript
{
  preferredModel: 'gemini-2.5-flash',
  systemPrompt: 'Eres un asistente útil y amigable. Responde de manera clara y concisa.',
  language: 'es'
}
```

**Conversaciones:**
- 1 conversación (primera vez)
- Sin mensajes (onboarding)

**Workflows Configurados:**
- ✅ Extracción PDF (básica)
- ✅ Análisis CSV

**Agent Configs:**
- Modelo: Gemini 2.5 Flash
- Temperature: 0.7
- Max Tokens: 8192

**Context Sources:**
- getting-started-1

**Usage Logs:**
- Create conversation
- Send message

**Casos de Prueba:**
```
✅ Login como new user
✅ Ver interfaz vacía/limpia
✅ Crear primera conversación
✅ Onboarding experience
✅ Agregar primer context source
✅ Primer mensaje
❌ NO tiene configuración previa
❌ NO tiene historial
```

---

## 🧪 Matriz de Casos de Prueba

| Caso de Prueba | Admin | Expert | User | Power | New |
|----------------|-------|--------|------|-------|-----|
| **Autenticación** |
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| Session persistence | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Conversaciones** |
| Crear conversación | ✅ | ✅ | ✅ | ✅ | ✅ |
| Múltiples conversaciones | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cambiar entre agentes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mantener estado por agente | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Configuración** |
| User settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agent config | ✅ | ✅ | ✅ | ✅ | ✅ |
| Config avanzada | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Context** |
| Ver sources propios | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver sources de otros | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Validar sources | ✅ | ✅ | ❌ | ❌ | ❌ |
| Agregar sources | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Workflows** |
| Workflows básicos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Workflows avanzados | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configurar workflow | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| **Analytics** |
| Ver analytics propios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver analytics globales | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin** |
| Gestión de usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impersonación | ✅ | ❌ | ❌ | ❌ | ❌ |
| Config del sistema | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔗 Datos en Firestore

### Ver Todos Los Usuarios:

```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fuser_settings
```

**Documentos esperados:**
- `admin_demo`
- `expert_demo`
- `user_standard`
- `power_user`
- `new_user`

### Filtrar por Source:

**Localhost:**
```javascript
source == "localhost"
```

**Production:**
```javascript
source == "production"
```

---

## 🚀 Cómo Usar

### Crear Datos para Localhost:
```bash
npm run seed:complete
# o
npx tsx scripts/seed-complete-test-data.ts localhost
```

### Crear Datos para Production:
```bash
npx tsx scripts/seed-complete-test-data.ts production
```

### Verificar Datos:
```bash
npm run verify:persistence
```

---

## 🧪 Flujos de Testing Recomendados

### Flujo 1: Admin Completo
```
1. Login como admin_demo
2. Ver dashboard de usuarios
3. Impersonar user_standard
4. Crear conversación como user
5. Volver a admin
6. Validar context source
7. Ver analytics globales
```

### Flujo 2: Expert Validación
```
1. Login como expert_demo
2. Ver lista de context sources
3. Abrir source sin validar
4. Revisar contenido extraído
5. Marcar como "✓ Validado"
6. Ver analytics propios
```

### Flujo 3: Usuario Estándar
```
1. Login como user_standard
2. Crear nueva conversación
3. Agregar context source
4. Enviar mensaje usando contexto
5. Ver respuesta del AI
6. Cambiar configuración
```

### Flujo 4: Power User
```
1. Login como power_user
2. Ver 8 conversaciones existentes
3. Cambiar entre agentes
4. Verificar que cada uno mantiene su config
5. Crear nueva conversación
6. Importar múltiples sources
```

### Flujo 5: Usuario Nuevo
```
1. Login como new_user
2. Ver interfaz vacía
3. Tutorial/onboarding (si existe)
4. Crear primera conversación
5. Primer mensaje
6. Configuración inicial
```

---

## 📊 Estadísticas de Datos Creados

### Por Usuario:

| Usuario | Conversations | Workflows | Messages | Context Sources | Usage Logs |
|---------|--------------|-----------|----------|----------------|------------|
| admin_demo | 4 | 4 | 32 (8×4) | 3 | 9 |
| expert_demo | 3 | 4 | 18 (6×3) | 2 | 6 |
| user_standard | 3 | 2 | 12 (4×3) | 1 | 2 |
| power_user | 8 | 2 | 40 (5×8) | 1 | 9 |
| new_user | 1 | 2 | 0 | 1 | 2 |

### Totales:
- **Usuarios:** 5
- **Conversaciones:** 19
- **Workflows:** 14
- **Mensajes:** 102
- **Context Sources:** 8
- **Usage Logs:** 28

---

## 🔍 Verificación por Usuario

Para cada usuario, verificar:

```bash
# User Settings
✅ Documento en user_settings
✅ Campo source presente
✅ preferredModel correcto según rol

# Agent Configs
✅ N documentos en agent_configs (N = num conversaciones)
✅ Cada uno con conversationId único
✅ Model apropiado según rol

# Workflow Configs
✅ Documentos en workflow_configs
✅ Config apropiada según rol

# Conversation Context
✅ Documentos en conversation_context
✅ activeContextSourceIds apropiados

# Usage Logs
✅ Logs en usage_logs
✅ Acciones apropiadas según escenarios
```

---

**¡Sistema completo de testing con 5 tipos de usuarios y múltiples escenarios!** 🚀

