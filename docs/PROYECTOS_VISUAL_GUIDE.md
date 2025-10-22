# 📁 Guía Visual: Organización de Chats en Proyectos

**Fecha**: 21 de Octubre, 2025

---

## 🎯 Comportamiento Esperado

### Vista Inicial

```
┌─────────────────────────────────────┐
│ 🤖 Agentes                    [3]  │
│   ├─ M001 - Ventas           ⚙️ ✏️ │
│   ├─ M002 - Marketing        ⚙️ ✏️ │
│   └─ M003 - Operaciones      ⚙️ ✏️ │
├─────────────────────────────────────┤
│ 📁 Proyectos                  [3]  │
│   ├─ Ventas                   ✏️ ❌ │
│   ├─ Marketing                ✏️ ❌ │
│   └─ Operaciones              ✏️ ❌ │
├─────────────────────────────────────┤
│ 💬 Chats                      [5]  │
│   ├─ Chat 1                   ✏️ 📦 │
│   ├─ Chat 2                   ✏️ 📦 │
│   ├─ Chat 3                   ✏️ 📦 │
│   ├─ Chat 4                   ✏️ 📦 │
│   └─ Chat 5                   ✏️ 📦 │
└─────────────────────────────────────┘
```

---

## 🎬 Escenario 1: Arrastrar Chat a Proyecto

### Paso 1: Inicio del Arrastre

```
Usuario agarra "Chat 1" en sección Chats
         ↓
     [Arrastrando]
         ↓
  Cursor cambia (grab)
```

### Paso 2: Hover sobre Proyecto

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────┐  │
│   │ ✅ Ventas (zona verde)      │  │ ← Fondo verde indica drop válido
│   └─────────────────────────────┘  │
│   ├─ Marketing                ✏️ ❌ │
│   └─ Operaciones              ✏️ ❌ │
└─────────────────────────────────────┘
```

### Paso 3: Soltar Chat

```
Usuario suelta el chat
         ↓
  API: moveChatToFolder(chatId, folderId)
         ↓
  Estado actualizado
```

### Paso 4: Resultado

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▼ Ventas              [1] ✏️ ❌ │ ← Auto-expandido
│   │   └─ 💬 Chat 1        ✏️ ❌    │ ← Chat ahora aquí
│   └─────────────────────────────────┘
│   ├─ Marketing                ✏️ ❌ │
│   └─ Operaciones              ✏️ ❌ │
├─────────────────────────────────────┤
│ 💬 Chats                      [4]  │ ← Contador reducido
│   ├─ Chat 2                   ✏️ 📦 │
│   ├─ Chat 3                   ✏️ 📦 │
│   ├─ Chat 4                   ✏️ 📦 │
│   └─ Chat 5                   ✏️ 📦 │
│   ❌ Chat 1 (ya NO aparece aquí)   │ ← Removido de Chats
└─────────────────────────────────────┘
```

---

## 🎬 Escenario 2: Expandir y Colapsar Proyecto

### Estado Colapsado

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▶ Ventas              [3] ✏️ ❌ │ ← Flecha derecha (▶)
│   └─────────────────────────────────┘
│   ├─ Marketing                ✏️ ❌ │
│   └─ Operaciones              ✏️ ❌ │
└─────────────────────────────────────┘
```

**Chats ocultos**, solo se ve:
- Nombre del proyecto
- Contador de chats (3)
- Botones de acción

---

### Click en Proyecto

```
Usuario hace click en "Ventas"
         ↓
  toggleExpandedFolder(folderId)
         ↓
  expandedFolders.add(folderId)
         ↓
  Transición suave (150ms)
```

---

### Estado Expandido

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▼ Ventas              [3] ✏️ ❌ │ ← Flecha abajo (▼)
│   │   ├─ 💬 Chat 1        ✏️ ❌    │ ← Chats visibles
│   │   ├─ 💬 Chat 2        ✏️ ❌    │
│   │   └─ 💬 Chat 3        ✏️ ❌    │
│   └─────────────────────────────────┘
│   ├─ Marketing                ✏️ ❌ │
│   └─ Operaciones              ✏️ ❌ │
└─────────────────────────────────────┘
```

**Chats visibles**, mostrando:
- Icono de mensaje
- Título del chat
- Tag del agente asociado
- Fecha de último mensaje
- Botones de editar y quitar

---

## 🎬 Escenario 3: Múltiples Proyectos Expandidos

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▼ Ventas              [2] ✏️ ❌ │
│   │   ├─ 💬 Lead ABC      ✏️ ❌    │
│   │   └─ 💬 Follow-up XYZ ✏️ ❌    │
│   └─────────────────────────────────┘
│   
│   ┌─────────────────────────────────┐
│   │ ▼ Marketing           [3] ✏️ ❌ │
│   │   ├─ 💬 Campaña Q4    ✏️ ❌    │
│   │   ├─ 💬 Social Media  ✏️ ❌    │
│   │   └─ 💬 Email blast   ✏️ ❌    │
│   └─────────────────────────────────┘
│   
│   ┌─────────────────────────────────┐
│   │ ▶ Operaciones         [1] ✏️ ❌ │ ← Colapsado
│   └─────────────────────────────────┘
└─────────────────────────────────────┘
```

**Beneficio**: Vista rápida de todos los proyectos activos y sus chats.

---

## 🎬 Escenario 4: Quitar Chat de Proyecto

### Antes de Quitar

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▼ Ventas              [2] ✏️ ❌ │
│   │   ├─ 💬 Chat 1        ✏️ ❌    │ ← Este chat
│   │   └─ 💬 Chat 2        ✏️ ❌    │
│   └─────────────────────────────────┘
├─────────────────────────────────────┤
│ 💬 Chats                      [3]  │
│   ├─ Chat 3                   ✏️ 📦 │
│   ├─ Chat 4                   ✏️ 📦 │
│   └─ Chat 5                   ✏️ 📦 │
└─────────────────────────────────────┘
```

---

### Acción: Hover y Click [❌]

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▼ Ventas              [2] ✏️ ❌ │
│   │   ├─ 💬 Chat 1  [✏️] [❌]      │ ← Botones visibles
│   │   │                    ↑        │
│   │   │             Click aquí      │
│   │   └─ 💬 Chat 2        ✏️ ❌    │
│   └─────────────────────────────────┘
```

---

### Después de Quitar

```
┌─────────────────────────────────────┐
│ 📁 Proyectos                  [3]  │
│   ┌─────────────────────────────────┐
│   │ ▼ Ventas              [1] ✏️ ❌ │ ← Contador actualizado
│   │   └─ 💬 Chat 2        ✏️ ❌    │ ← Solo queda Chat 2
│   └─────────────────────────────────┘
├─────────────────────────────────────┤
│ 💬 Chats                      [4]  │ ← Contador incrementado
│   ├─ Chat 1                   ✏️ 📦 │ ← Chat 1 de vuelta aquí
│   ├─ Chat 3                   ✏️ 📦 │
│   ├─ Chat 4                   ✏️ 📦 │
│   └─ Chat 5                   ✏️ 📦 │
└─────────────────────────────────────┘
```

---

## 🎨 Estados Visuales

### Proyecto Colapsado

```css
▶ Ventas [3] ✏️ ❌
```

**Elementos**:
- ▶ Flecha derecha (indica colapsado)
- Nombre del proyecto
- [3] Badge con contador
- ✏️ Editar (visible al hover)
- ❌ Eliminar (visible al hover)

---

### Proyecto Expandido

```css
▼ Ventas [3] ✏️ ❌
  ├─ 💬 Chat 1 [Agente: M001] ✏️ ❌
  ├─ 💬 Chat 2 [Agente: M001] ✏️ ❌
  └─ 💬 Chat 3 [Agente: M002] ✏️ ❌
```

**Elementos Adicionales**:
- ▼ Flecha abajo (rotada 90°, indica expandido)
- Lista de chats indentada
- Cada chat con su tag de agente
- Cada chat con botones de acción

---

### Proyecto Vacío Expandido

```css
▼ Marketing [0] ✏️ ❌
  └─ Arrastra chats aquí
```

**Mensaje**: Indica visualmente que el proyecto puede recibir chats.

---

### Durante Drag & Drop

```css
📁 Proyectos
  ┌───────────────────────────────┐
  │ ✅ Ventas [fondo verde]       │ ← Zona activa
  └───────────────────────────────┘
  ├─ Marketing
  └─ Operaciones
```

**Feedback Visual**:
- Fondo verde (`bg-green-100`)
- Borde verde (`border-green-400`)
- Indica zona de drop válida

---

## 🔄 Flujo de Datos

### Drag & Drop Flow

```
┌────────────────────────────────────────────────┐
│ 1. Usuario arrastra Chat 1 desde Chats        │
│    → e.dataTransfer.setData('chatId', id)     │
└────────────┬───────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ 2. Hover sobre Proyecto "Ventas"              │
│    → onDragOver: Fondo verde                  │
└────────────┬───────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ 3. Usuario suelta el chat                     │
│    → onDrop: getData('chatId')                │
└────────────┬───────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ 4. moveChatToFolder(chatId, folderId)         │
│    → API: PUT /api/conversations/:id          │
│    → Body: { folderId: 'folder-123' }         │
└────────────┬───────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ 5. Firestore actualizado                      │
│    → conversations/chat-1:                     │
│      { folderId: 'folder-123' }                │
└────────────┬───────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ 6. Estado local actualizado                   │
│    → setConversations(updated)                │
│    → setExpandedFolders(add folderId)         │
└────────────┬───────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────┐
│ 7. UI re-renderiza                            │
│    → Chat 1 aparece en Proyecto "Ventas"      │
│    → Chat 1 NO aparece en sección "Chats"     │
│    → Proyecto "Ventas" auto-expandido         │
│    → Contador actualizado: [1]                │
└────────────────────────────────────────────────┘
```

---

## 🎨 Detalles de Diseño

### Jerarquía Visual

```
📁 Proyectos (Nivel 1)
  ├─ 📂 Proyecto (Nivel 2)
  │   ├─ 💬 Chat (Nivel 3)
  │   │   └─ 🏷️ Tag Agente (Nivel 4)
  │   └─ 💬 Chat (Nivel 3)
  └─ 📂 Proyecto (Nivel 2)
```

**Indentación**:
- Nivel 1: 0px
- Nivel 2: 8px (px-2)
- Nivel 3: 16px (adicional)
- Nivel 4: 24px (dentro del chat)

---

### Colores por Estado

```
Estado Normal:
  Folder Header:  bg-slate-50
  Chat Normal:    bg-white

Estado Hover:
  Folder Header:  bg-green-50
  Chat Hover:     bg-slate-50

Estado Drag Over:
  Folder Header:  bg-green-100 + border-green-400

Estado Selected:
  Chat Selected:  bg-purple-50 + border-purple-200
```

---

### Badges y Tags

```
Contador Proyecto:  [3]  → bg-green-100, text-green-700
Tag de Agente:      [Agente: M001]  → bg-blue-100, text-blue-700
Estado Vacío:       "Arrastra aquí"  → text-slate-500
```

---

## 🧪 Tests de Interacción

### Test 1: Drag & Drop Simple

```
DADO:  Chat "Cotización ABC" en sección Chats
       Proyecto "Ventas" existe
CUANDO: Arrastro chat a proyecto
ENTONCES:
  ✅ Proyecto se ilumina de verde al hover
  ✅ Al soltar, chat aparece bajo proyecto
  ✅ Proyecto se expande automáticamente
  ✅ Chat NO aparece en sección Chats
  ✅ Contador de proyecto muestra 1
  ✅ Contador de Chats se reduce en 1
```

---

### Test 2: Colapsar y Expandir

```
DADO:  Proyecto "Marketing" expandido con 3 chats
CUANDO: Click en nombre del proyecto
ENTONCES:
  ✅ Chats se ocultan con transición suave
  ✅ Flecha cambia de ▼ a ▶
  ✅ Contador sigue mostrando [3]
  
CUANDO: Click nuevamente en el proyecto
ENTONCES:
  ✅ Chats vuelven a aparecer
  ✅ Flecha cambia de ▶ a ▼
  ✅ Mismos chats en mismo orden
```

---

### Test 3: Quitar de Proyecto

```
DADO:  Chat "Lead XYZ" en proyecto "Ventas"
       Proyecto "Ventas" expandido
CUANDO: Hover sobre chat y click botón [❌]
ENTONCES:
  ✅ Chat desaparece del proyecto
  ✅ Contador de proyecto: [3] → [2]
  ✅ Chat aparece en sección Chats
  ✅ Contador de Chats incrementa
  ✅ Chat mantiene su título y mensajes
```

---

### Test 4: Proyecto Vacío

```
DADO:  Proyecto "Backlog" sin chats
CUANDO: Expandir el proyecto
ENTONCES:
  ✅ Mensaje "Arrastra chats aquí" visible
  ✅ Fondo blanco (no gris)
  ✅ Texto centrado y en gris claro
  
CUANDO: Arrastrar chat al proyecto vacío
ENTONCES:
  ✅ Mensaje desaparece
  ✅ Chat se muestra en su lugar
  ✅ Contador: [0] → [1]
```

---

### Test 5: Múltiples Chats

```
DADO:  5 chats en sección Chats
       Proyecto "Q4" vacío
CUANDO: Arrastro los 5 chats al proyecto (uno por uno)
ENTONCES:
  ✅ Cada chat aparece bajo proyecto
  ✅ Contador incrementa: [0]→[1]→[2]→[3]→[4]→[5]
  ✅ Sección Chats queda vacía
  ✅ Mensaje "No hay chats sin proyecto"
```

---

## 📊 Comparación de UX

### ANTES

**Problemas**:
- ❌ No se veían los chats dentro de proyectos
- ❌ Chats aparecían duplicados (proyecto + Chats)
- ❌ No había jerarquía visual
- ❌ Contador de proyecto no reflejaba contenido
- ❌ Difícil encontrar chat específico en proyecto

**Experiencia**:
```
"¿Dónde están los chats del proyecto Ventas?"
"Tengo que recordar que Chat 1 está en Ventas"
"¿Por qué Chat 1 aparece dos veces?"
```

---

### DESPUÉS

**Soluciones**:
- ✅ Jerarquía clara: Proyecto → Chats
- ✅ Chats solo aparecen una vez
- ✅ Expandir/colapsar para organizar vista
- ✅ Contador preciso y actualizado
- ✅ Fácil navegación dentro de proyectos

**Experiencia**:
```
"Click en 'Ventas' → veo todos los chats de ventas"
"Colapso 'Marketing' para enfocarme en 'Ventas'"
"Arrastro chat nuevo a 'Q4' → se organiza solo"
```

---

## 🎯 Beneficios de la Implementación

### Para Usuarios

1. **Organización Clara**
   - Jerarquía visual de 3 niveles
   - Fácil encontrar chats por proyecto
   - Vista limpia y ordenada

2. **Flexibilidad**
   - Colapsar proyectos inactivos
   - Expandir proyectos activos
   - Reorganizar fácilmente con drag & drop

3. **Eficiencia**
   - Menos scrolling para encontrar chats
   - Vista rápida de todos los proyectos
   - Contadores actualizados en tiempo real

---

### Para el Sistema

1. **Consistencia**
   - Un chat, una ubicación visible
   - Sin duplicación en UI
   - Sincronización frontend ↔ backend

2. **Escalabilidad**
   - Soporta N proyectos
   - Soporta M chats por proyecto
   - Performance no degradada

3. **Mantenibilidad**
   - Código modular y reutilizable
   - Estado manejado con React hooks
   - TypeScript para type safety

---

## 🚀 Próximas Mejoras Posibles

### Corto Plazo

- [ ] Persistir estado de expansión en localStorage
- [ ] Animación más suave al expandir/colapsar
- [ ] Drag & drop entre proyectos (sin pasar por Chats)

### Mediano Plazo

- [ ] Reordenar chats dentro de proyectos (drag & drop vertical)
- [ ] Multiselección de chats para mover varios a la vez
- [ ] Búsqueda de chats dentro de proyectos

### Largo Plazo

- [ ] Subproyectos (jerarquía de 4 niveles)
- [ ] Colores personalizados por proyecto
- [ ] Estadísticas por proyecto (# mensajes, tokens usados, etc.)

---

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **Set<string> para expandedFolders**
   - Más eficiente que array
   - Métodos `.has()`, `.add()`, `.delete()` más claros

2. **Auto-expansión al soltar**
   - Mejora feedback visual inmediato
   - Usuario ve confirmación de acción

3. **Filtro `!c.folderId`**
   - Chats en proyectos NO aparecen en Chats
   - Evita duplicación visual
   - Más limpio y organizado

4. **Empty state informativo**
   - "Arrastra chats aquí" cuando proyecto vacío
   - "No hay chats sin proyecto" cuando todos organizados
   - Guía al usuario sobre qué hacer

---

## 🎓 Lecciones

### Qué Funcionó Bien

1. **Reutilización de Componentes**
   - Chat card igual en Proyectos y Chats
   - Misma lógica de edición y acciones

2. **Estado Reactivo**
   - Cambios en `conversations` actualizan contadores
   - Filtros reactivos se recalculan automáticamente

3. **Drag & Drop Nativo**
   - HTML5 Drag & Drop API simple y efectiva
   - No requiere librerías externas

### Qué Mejorar

1. **Estado de Expansión**
   - Actualmente se pierde al refrescar
   - Considerar localStorage para persistir

2. **Animaciones**
   - Podrían ser más suaves con Framer Motion
   - Transiciones de entrada/salida de chats

---

**Creado**: 2025-10-21  
**Versión**: 1.0.0  
**Status**: ✅ Listo para Testing Manual

