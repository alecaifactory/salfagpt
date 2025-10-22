# Plan de Migración: Conversaciones Legacy → Agentes

**Fecha:** 21 de Octubre, 2025  
**Problema:** Conversaciones antiguas sin campo `isAgent` aparecen en lista de agentes  
**Solución:** Migración de datos + filtro mejorado

---

## 🎯 Problema Identificado

### Situación Actual

En Firestore existen 3 tipos de conversaciones:

```typescript
// TIPO 1: Agentes explícitos (nuevos)
{
  id: "new-agent-123",
  title: "Agente M001",
  isAgent: true,        // ✅ Explícito
  agentId: undefined
}

// TIPO 2: Chats explícitos (nuevos)
{
  id: "chat-456",
  title: "Chat - Aprendizaje",
  isAgent: false,       // ✅ Explícito
  agentId: "agent-123"
}

// TIPO 3: Conversaciones legacy (antiguas) ⚠️
{
  id: "legacy-789",
  title: "Hola",        // ← Aparece en la imagen
  isAgent: undefined,   // ❌ Campo no existe
  agentId: undefined
}
```

### Comportamiento Actual

**En el código (línea 827 de ChatInterfaceWorking.tsx):**
```typescript
isAgent: conv.isAgent !== false, // Default to true for backward compatibility
```

**Resultado:**
- `isAgent: true` → Se trata como agente ✅
- `isAgent: false` → Se trata como chat ✅
- `isAgent: undefined` → Se trata como agente ✅ (backward compatibility)

**Problema:**
- TODAS las conversaciones legacy (Hola, Test, Aprendizaje, Resumen) aparecen como "agentes"
- Son conversaciones antiguas que probablemente NO deberían gestionarse como agentes
- Confunde al usuario

---

## 🔧 Soluciones Propuestas

### Opción A: Migración Automática (Recomendada) ⭐

**Qué hace:**
1. Script marca todas las conversaciones legacy como `isAgent: true` en Firestore
2. Usuario puede después convertir algunas en chats si lo desea
3. Mantiene backward compatibility completa

**Pros:**
- ✅ No rompe nada
- ✅ Datos explícitos en Firestore
- ✅ Filtros futuros serán más simples
- ✅ Una sola vez

**Contras:**
- ⚠️ Conversaciones legacy se quedan como agentes (aunque quizás no deberían)
- ⚠️ Usuario debe limpiar manualmente si quiere

**Ejecución:**
```bash
# Dry run (ver qué se migraría)
node scripts/migrate-conversations-to-agents.mjs --dry-run --user-id=114671162830729001607

# Aplicar migración
node scripts/migrate-conversations-to-agents.mjs --user-id=114671162830729001607
```

---

### Opción B: Filtro Estricto (Más Agresivo)

**Qué hace:**
1. Cambiar filtro para SOLO mostrar `isAgent === true` (explícito)
2. Conversaciones legacy NO aparecen hasta que se marquen explícitamente

**Código:**
```typescript
const agents = conversations.filter(conv => conv.isAgent === true);
```

**Pros:**
- ✅ Lista limpia inmediatamente
- ✅ Solo agentes explícitos
- ✅ No need migration

**Contras:**
- ❌ Conversaciones legacy desaparecen de la UI
- ❌ Usuario pierde acceso hasta migrar
- ❌ Rompe experiencia existente

**NO RECOMENDADO** para producción con usuarios activos.

---

### Opción C: UI para Marcar Conversaciones (Gradual)

**Qué hace:**
1. Mostrar badge "Legacy" en conversaciones sin `isAgent`
2. Botón "Convertir a Agente" o "Convertir a Chat"
3. Usuario decide caso por caso

**Pros:**
- ✅ Control granular
- ✅ Usuario decide
- ✅ No pérdida de datos

**Contras:**
- ⚠️ Requiere trabajo de UI
- ⚠️ Usuario debe hacer trabajo manual
- ⚠️ Más complejo

---

## ✅ Recomendación

### Enfoque Híbrido (Mejor de ambos mundos)

**Fase 1: Migración Automática (Ahora)**

Ejecutar script para marcar todas las conversaciones legacy como `isAgent: true`:

```bash
node scripts/migrate-conversations-to-agents.mjs --user-id=114671162830729001607
```

**Resultado:**
- Todas las conversaciones existentes se marcan como agentes
- Mantiene backward compatibility
- Datos explícitos en Firestore

**Fase 2: Usuario Organiza (Después)**

Dar al usuario herramientas para reorganizar:

1. **Opción A:** Convertir agente en chat
   - Si el usuario ve que "Hola" debería ser un chat bajo otro agente
   - Botón "Convertir a Chat" → Asigna agentId, cambia isAgent a false

2. **Opción B:** Eliminar conversaciones innecesarias
   - Si "Test" fue solo una prueba
   - Botón eliminar

3. **Opción C:** Crear estructura nueva
   - Crear nuevos agentes organizados
   - Crear chats bajo esos agentes
   - Migrar gradualmente

---

## 📋 Script de Migración

### Uso

```bash
# Ver qué se migraría (DRY RUN)
node scripts/migrate-conversations-to-agents.mjs --dry-run

# Migrar usuario específico
node scripts/migrate-conversations-to-agents.mjs --user-id=114671162830729001607

# Migrar TODOS los usuarios (¡cuidado!)
node scripts/migrate-conversations-to-agents.mjs
```

### Qué Hace el Script

1. ✅ Busca conversaciones con `isAgent: undefined`
2. ✅ Las marca como `isAgent: true`
3. ✅ Actualiza `updatedAt` timestamp
4. ✅ Procesa en batches de 500 (límite de Firestore)
5. ✅ Muestra progreso y resumen

### Qué NO Hace

- ❌ No modifica conversaciones que ya tienen `isAgent` definido
- ❌ No elimina datos
- ❌ No cambia estructura
- ❌ No afecta mensajes o contexto

---

## 🔍 Verificación Post-Migración

### Antes de Migrar

```bash
# Verificar estado actual
node scripts/check-isagent-field.mjs
```

**Esperado:**
```
Con campo isAgent: 0
Sin campo isAgent (legacy): 67
```

### Después de Migrar

```bash
# Verificar migración
node scripts/check-isagent-field.mjs
```

**Esperado:**
```
Con campo isAgent: 67
  • isAgent: true (agentes): 67
  • isAgent: false (chats): 0
Sin campo isAgent (legacy): 0
```

### En la UI

**Antes:**
- Context Management muestra todas las conversaciones
- Mix de "agentes" y "legacy"

**Después:**
- Context Management muestra solo agentes explícitos
- Todas las conversaciones legacy ahora marcadas como agentes
- Lista clara y explícita

---

## 🚨 Precauciones

### Antes de Ejecutar

1. ✅ **Backup de Firestore**
   ```bash
   gcloud firestore export gs://backup-bucket/$(date +%Y%m%d)
   ```

2. ✅ **Dry run primero**
   ```bash
   node scripts/migrate-conversations-to-agents.mjs --dry-run
   ```

3. ✅ **Probar con un usuario**
   ```bash
   node scripts/migrate-conversations-to-agents.mjs --user-id=TEST_USER_ID
   ```

4. ✅ **Verificar resultado**
   - Revisar en UI
   - Verificar en Firestore Console
   - Probar funcionalidad

### Si Algo Sale Mal

**Rollback:**
```bash
# Restaurar del backup
gcloud firestore import gs://backup-bucket/20251021
```

**O manualmente:**
- Ir a Firestore Console
- Buscar conversaciones con `isAgent: true` que deberían ser chats
- Cambiar manualmente a `isAgent: false` y añadir `agentId`

---

## 🎯 Estrategia Recomendada para Tu Caso

Basándome en la imagen que mostraste:

### Paso 1: Identificar qué conversaciones son agentes reales

Mirando la imagen, veo:
- ☑️ **Test** - Seleccionado, probablemente un agente real
- ☐ **Hola** - Probablemente una conversación de prueba
- ☐ **Aprendizaje** - Probablemente debería ser un chat bajo un agente
- ☐ **Resumen** - Similar

### Paso 2: Ejecutar migración

```bash
# Migrar TODO a agentes primero (mantiene backward compat)
node scripts/migrate-conversations-to-agents.mjs --user-id=114671162830729001607
```

### Paso 3: Reorganizar manualmente en la UI

Después de la migración, en la UI:

1. **Identificar agentes que quieres mantener:**
   - "Test" → Quedas como agente
   - Otros agentes importantes

2. **Convertir conversaciones en chats** (feature futuro):
   - "Hola" → Convertir a chat bajo agente "Test"
   - "Aprendizaje" → Convertir a chat bajo agente correspondiente

3. **Eliminar conversaciones innecesarias:**
   - Conversaciones de prueba antiguas
   - Duplicados

---

## 🔮 Features Futuros

### 1. Botón "Convertir a Chat"

En cada conversación que está marcada como agente, añadir opción:

```
Conversación: "Hola"
[ Convertir a Chat ]

Modal:
  "Convertir 'Hola' en chat bajo qué agente?"
  □ Agente M001
  □ Agente Support
  □ Test
  
  [Convertir]
```

**Acción:**
- Actualiza: `isAgent: false`
- Actualiza: `agentId: <selected-agent-id>`
- Mueve a sección "Chats"

### 2. Botón "Convertir a Agente"

En chats, opción para promover a agente independiente:

```
Chat: "Consultas avanzadas"
[ Promover a Agente ]

Modal:
  "Esto creará un nuevo agente independiente con su propia configuración."
  
  Nuevo nombre: [____________________]
  
  ☑️ Copiar contexto del agente padre
  ☑️ Copiar configuración del agente padre
  
  [Crear Agente]
```

---

## 📊 Análisis de Tu Caso

Basándome en la imagen (mostrando "Hola", "Test", "Aprendizaje", "Resumen"):

### Conversaciones Visibles

| Nombre | Probable Tipo | Acción Sugerida |
|--------|---------------|-----------------|
| Test | Agente | Mantener como agente |
| Hola | Chat de prueba | ¿Convertir a chat o eliminar? |
| Aprendizaje | Chat temático | Convertir a chat bajo agente |
| Resumen | Chat temático | Convertir a chat bajo agente |

### Plan de Acción

1. **Ahora (Automático):**
   - Ejecutar migración → Todas marcadas como `isAgent: true`
   - Todas aparecen en Context Management

2. **Después (Manual):**
   - Decidir cuáles son agentes reales
   - Reorganizar las demás

---

## ✅ Resumen

**Problema:**  
Conversaciones legacy (sin `isAgent`) aparecen como agentes

**Solución:**  
Migración → Marcar explícitamente como `isAgent: true`

**Beneficios:**
- ✅ Backward compatibility total
- ✅ Datos explícitos y claros
- ✅ Filtros futuros más simples
- ✅ Base para features de reorganización

**Próximo Paso:**  
Ejecutar: `node scripts/migrate-conversations-to-agents.mjs --user-id=TU_USER_ID`

---

**Estado:** 📋 Plan Definido  
**Script:** ✅ Creado  
**Testing:** ⏳ Pendiente (requiere auth)  
**Deploy:** ⏳ Después de testing

