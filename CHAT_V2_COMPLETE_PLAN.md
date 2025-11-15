# Chat V2 - Plan Completo de Construcción

## 📊 Estado Actual (Final de Sesión)

### ✅ Completado:
1. **UserID Migration** - 925 docs migrados, 100% hash format
2. **Optimizaciones en develop branch** - Cache, coordinated loading, UI improvements
3. **Chat V2 Foundation** - Store, hooks, structure ready
4. **Branch creado** - refactor/chat-v2-2025-11-15

### ⚠️ Situación:
- **develop branch:** Tiene todas las optimizaciones funcionando
- **chat-v2 branch:** Tiene V2 foundation pero wrapper falló
- **Optimizaciones** necesitan estar EN V2 para funcionar

## 🎯 Solución Recomendada

### Opción A: Merge develop → chat-v2 (RECOMENDADO)
```bash
git checkout refactor/chat-v2-2025-11-15
git merge develop
# Resolver conflictos si hay
git push
```

Esto trae TODAS las optimizaciones al branch V2.

### Opción B: Seguir en develop (MÁS SIMPLE)
```bash
git checkout develop
git pull
```

El branch develop YA tiene:
- ✅ Coordinated loading
- ✅ Cache 30s
- ✅ Referencias optimizadas
- ✅ UI colapsable
- ✅ Textarea mejorado
- ✅ Todo funcionando

## 🏗️ Para Construir V2 Completo (Próxima Sesión)

### Fase 1: Merge optimizations (30 min)
```bash
cd /Users/alec/salfagpt
git checkout refactor/chat-v2-2025-11-15
git merge develop
```

### Fase 2: Construir componentes (4 horas)

#### 2.1 Sidebar (1 hora)
```typescript
// src/components/chat-v2/sidebar/AgentsList.tsx
- Fetch conversations from API
- Filter agents (isAgent === true)
- Display with click handlers
- Connect to store.selectAgent()

// src/components/chat-v2/sidebar/ChatSidebar.tsx
- Integrate AgentsList
- Add FoldersList
- Add HistorialList
- Collapsible sections
```

#### 2.2 Messages (1.5 horas)
```typescript
// src/components/chat-v2/messages/MessagesArea.tsx
- Load messages for selected agent
- Display MessageBubble for each
- Handle streaming
- Show references
- Auto-scroll

// src/components/chat-v2/messages/MessageBubble.tsx
- Render user vs assistant
- MessageRenderer integration
- Reference badges
- Copy button
```

#### 2.3 Input (1.5 horas)
```typescript
// src/components/chat-v2/input/ChatInput.tsx
- Textarea with Shift+Enter
- Send button
- Integrate ContextBar
- Integrate SampleQuestions
- Handle sendMessage

// src/components/chat-v2/input/ContextBar.tsx
- Show stats from agentData
- Collapsible
- Click to expand context panel

// src/components/chat-v2/input/SampleQuestions.tsx
- Use agentData.sampleQuestions
- Carousel with prev/next
- Click to fill input
- Collapsible
```

## 📋 Checklist de Componentes Necesarios

### Core (Ya tiene)
- [x] ChatStore.ts
- [x] types.ts
- [x] sampleQuestions.ts
- [x] useCoordinatedLoad.ts

### Sidebar (Falta)
- [ ] ChatSidebar.tsx (150 lines)
- [ ] AgentsList.tsx (100 lines)
- [ ] FoldersList.tsx (80 lines)
- [ ] HistorialList.tsx (80 lines)

### Messages (Falta)
- [ ] MessagesArea.tsx (120 lines)
- [ ] MessageBubble.tsx (80 lines)
- [ ] EmptyState.tsx (40 lines)
- [ ] StreamingIndicator.tsx (40 lines)

### Input (Falta)
- [ ] ChatInput.tsx (150 lines)
- [ ] ContextBar.tsx (80 lines)
- [ ] SampleQuestions.tsx (120 lines)
- [ ] InputField.tsx (60 lines)

### Hooks (Parcialmente)
- [x] useCoordinatedLoad.ts
- [ ] useMessages.ts (100 lines)
- [ ] useSendMessage.ts (150 lines)

## 💡 Mi Recomendación

Dado que tenemos ~580k tokens restantes y cada componente es ~100 líneas:

**Puedo construir todos los componentes ahora PERO:**
- Necesitaremos multiple context windows
- O podemos construir incrementalmente en próximas sesiones

**O mejor:**
1. Trabaja en `develop` branch (tiene todas las optimizaciones)
2. Cuando quieras V2, retomamos desde aquí
3. V2 foundation está lista, solo faltan componentes

## 🎬 ¿Qué Prefieres?

A) Continuar construyendo V2 ahora (4-6 horas, múltiples context windows)
B) Cambiar a develop branch y usar V1 optimizado (funcionando ya)
C) Pausar aquí y retomar V2 en próxima sesión

**Mi recomendación:** Opción B - usa develop branch con optimizaciones, y retomamos V2 cuando tengas tiempo dedicado.

¿Qué prefieres?
