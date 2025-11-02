# Feedback → Roadmap Integration - Complete Flow

**Feature:** Todos los tickets de feedback aparecen automáticamente en Roadmap  
**Date:** 2025-10-30  
**Impact:** Priorización data-driven del backlog

---

## 🎯 Flujo Completo: Feedback → Backlog → Roadmap

```
Usuario da feedback
    ↓
Ticket creado en feedback_tickets
    ↓
Ticket con metadata completa:
  ✅ userDomain (getaifactory.com)
  ✅ reportedByEmail (alec@getaifactory.com)
  ✅ reportedByRole (admin/expert/user)
  ✅ feedbackSource (expert/user)
  ✅ category (bug/feature/ui/performance/etc)
  ✅ priority (high/medium/low)
  ✅ lane ('backlog' inicial)
  ✅ originalFeedback (rating, comment, screenshots)
    ↓
Aparece en Roadmap automáticamente:
  📋 Lane: Backlog
  🏷️ Tags: Tipo, Dominio, Rol
  📊 Info: Email, Rating, Category
    ↓
SuperAdmin puede:
  • Ver todos los tickets
  • Filtrar por dominio
  • Priorizar por rol (expert > user)
  • Mover a roadmap/development
  • Asignar a sprints
```

---

## 📊 Ticket Metadata para Priorización

### Información del Usuario:

```typescript
{
  // ✅ Identificación
  reportedBy: "114671162830729001607",
  reportedByEmail: "alec@getaifactory.com",
  reportedByRole: "admin", // admin | expert | user
  userDomain: "getaifactory.com",
  
  // ✅ Para filtrar en roadmap
  feedbackSource: "expert", // expert | user
  
  // ✅ Para ponderación
  npsScore: 8,  // Si expert
  csatScore: 4, // Si expert
  userStars: 4, // Si user
}
```

### Categorización Automática:

```typescript
{
  category: "content-quality", // Auto-detectado
  priority: "medium",           // Por rating
  userImpact: "medium",         // Por feedback type
  
  // Categorías posibles:
  // - bug (errors, fallas)
  // - performance (lento, demora)
  // - ui-improvement (interfaz, diseño)
  // - feature-request (agregar, funcionalidad)
  // - content-quality (respuesta, contexto, pdf)
  // - agent-behavior (agente, comportamiento)
  // - other (default)
}
```

### Roadmap Integration:

```typescript
{
  lane: "backlog", // Siempre inicia aquí
  status: "new",
  estimatedEffort: "m",
  upvotes: 0,
  shares: 0,
}
```

---

## 🎨 Vista en Roadmap/Backlog

### Card en Backlog Lane:

```
┌────────────────────────────────────────────────┐
│ Mejorar respuestas sobre PDFs                  │
│                                                │
│ 👤 alec@getaifactory.com                       │
│ 🏢 getaifactory.com                            │
│                                                │
│ [👑 Experto] [⚠️ P2] [📝 Content Quality]     │
│ [ACEPTABLE] [NPS: 8/10] [CSAT: 4/5]           │
│                                                │
│ 📸 1 captura • 3 anotaciones                   │
│ ⏱️ Hace 2 horas                                │
└────────────────────────────────────────────────┘
```

### Tags de Identificación:

**User Role Badge:**
```
👑 Experto (Purple)    - High weight in prioritization
⭐ Usuario (Violet)    - Standard weight
🔧 Admin (Blue)        - System feedback
```

**Feedback Source:**
```
Expert → Purple theme, higher priority weight
User → Violet-yellow theme, standard weight
```

**Domain Badge:**
```
🏢 getaifactory.com    - Primary domain
🏢 client.com          - Client domain
🏢 demo.com            - Demo domain
```

**Category Badge:**
```
🐛 Bug
✨ Feature Request
🎨 UI Improvement
⚡ Performance
🔒 Security
📝 Content Quality
🤖 Agent Behavior
🎯 Context Accuracy
📌 Other
```

---

## 📋 Roadmap Display Format

### Backlog Lane (Inicial):

```
┌─────────────────────────────────────────────────────────┐
│ 📋 Backlog (4)                                          │
│ Feedback pendiente                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Mejorar formato de respuestas del agente          │  │
│ │                                                   │  │
│ │ 👤 alec@getaifactory.com  🏢 getaifactory.com    │  │
│ │                                                   │  │
│ │ [👑 Experto] [🟡 P2: Medio] [📝 Content Quality] │  │
│ │ [ACEPTABLE] [NPS: 8] [CSAT: 4]                   │  │
│ │                                                   │  │
│ │ 💬 "Respuesta correcta pero podría mejorar..."   │  │
│ │ 📸 1 captura con 3 anotaciones                   │  │
│ │ ⏱️ Hace 1 hora                                    │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ UI muy lenta en mobile                            │  │
│ │                                                   │  │
│ │ 👤 user@demo.com  🏢 demo.com                    │  │
│ │                                                   │  │
│ │ [⭐ Usuario] [🔴 P0: Crítico] [⚡ Performance]    │  │
│ │ [2/5 ⭐] (Mala)                                   │  │
│ │                                                   │  │
│ │ 💬 "Aplicación inutilizable en iPhone"           │  │
│ │ 📸 2 capturas                                     │  │
│ │ ⏱️ Hace 30 min                                    │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Priorización Inteligente

### Factores de Peso:

```typescript
Priority Weight = 
  Base Priority (P0=4, P1=3, P2=2, P3=1)
  × User Role Weight (Expert=1.5, Admin=1.3, User=1.0)
  × Rating Weight (Inaceptable/1-2⭐=1.5, Aceptable/3⭐=1.0, Sobresaliente/4-5⭐=0.8)
  × Domain Weight (Primary=1.2, Client=1.0, Demo=0.8)
```

### Ejemplo de Cálculo:

**Ticket A: Expert, Inaceptable, P1, Primary Domain**
```
Priority = 3 × 1.5 × 1.5 × 1.2 = 8.1
→ Alta prioridad absoluta
```

**Ticket B: User, 3⭐, P2, Demo Domain**
```
Priority = 2 × 1.0 × 1.0 × 0.8 = 1.6
→ Baja prioridad relativa
```

### Sort Order en Backlog:

```
1. Expert + Inaceptable + P0  (Score: 12.0)
2. Expert + Inaceptable + P1  (Score: 9.0)
3. Admin + P0                 (Score: 5.2)
4. Expert + Aceptable + P1    (Score: 4.5)
5. User + 2⭐ + P1            (Score: 4.5)
6. User + 3⭐ + P2            (Score: 2.0)
7. Expert + Sobresaliente + P3 (Score: 1.2)
```

---

## 🏷️ Tags Completos

### Tag System:

```
┌──────────────────────────────────────────────┐
│ Ticket Title                                 │
│                                              │
│ 👤 user@email.com  🏢 company.com           │
│                                              │
│ Tags Row 1: User & Feedback Info             │
│ [👑 Experto] [ACEPTABLE] [NPS: 8] [CSAT: 4] │
│                                              │
│ Tags Row 2: Ticket Classification            │
│ [🔴 P0: Crítico] [🐛 Bug] [🔥 High Impact]  │
│                                              │
│ Tags Row 3: Technical Details                │
│ [⏱️ Esfuerzo: M] [📅 Hace 2h] [🎯 S1]      │
└──────────────────────────────────────────────┘
```

### Badge Color Coding:

**User Role:**
```
👑 Experto     → bg-purple-100 text-purple-700
⭐ Usuario     → bg-violet-100 text-violet-700
🔧 Admin       → bg-blue-100 text-blue-700
🌟 SuperAdmin  → bg-indigo-100 text-indigo-700
```

**Rating (Expert):**
```
INACEPTABLE    → bg-red-600 text-white
ACEPTABLE      → bg-yellow-600 text-white
SOBRESALIENTE  → bg-purple-600 text-white
```

**Rating (User):**
```
1-2⭐ (Mala)   → bg-red-100 text-red-700
3⭐ (Regular)  → bg-yellow-100 text-yellow-700
4-5⭐ (Buena)  → bg-violet-100 text-violet-700
```

**Category:**
```
🐛 Bug              → bg-red-100 text-red-700
✨ Feature Request  → bg-blue-100 text-blue-700
🎨 UI Improvement   → bg-purple-100 text-purple-700
⚡ Performance      → bg-yellow-100 text-yellow-700
📝 Content Quality  → bg-green-100 text-green-700
```

---

## 📊 Card Structure in Roadmap

### Collapsed Card (List View):

```
┌────────────────────────────────────────────────┐
│ Título del feedback                            │
│ ──────────────────────────────────────────────│
│ 👤 user@email.com        🏢 company.com        │
│                                                │
│ [👑 Experto] [ACEPTABLE] [NPS: 8] [CSAT: 4]   │
│ [⚠️ P1] [📝 Content] [⏱️ M] [📅 Hace 1h]      │
│                                                │
│ 📸 2 capturas • 💬 "Comentario..."             │
└────────────────────────────────────────────────┘
```

### Expanded Card (Detail View):

```
┌────────────────────────────────────────────────┐
│ ▼ Mejorar respuestas sobre contexto PDF       │
│                                                │
│ 👤 alec@getaifactory.com                       │
│ 🏢 getaifactory.com                            │
│ 🎯 Agente: GESTION BODEGAS GPT (S001)         │
│                                                │
│ ━━━ Feedback Original ━━━                     │
│ [👑 Experto] [ACEPTABLE]                       │
│ NPS: 8/10 (😊 Pasivo)                         │
│ CSAT: 4/5 (⭐⭐⭐⭐)                            │
│                                                │
│ 📋 Notas:                                      │
│ "Respuesta correcta pero debería incluir       │
│  más ejemplos específicos del caso SAP..."     │
│                                                │
│ 📸 Capturas (1):                               │
│ [Screenshot con UI completa]                   │
│ • Círculo marca sección sin ejemplos          │
│ • Texto: "Faltan casos de uso"                │
│                                                │
│ 🤖 Análisis AI:                                │
│ "Experto señala que response sobre SAP no      │
│  incluye ejemplos prácticos. Sugiere agregar   │
│  casos de uso comunes y screenshots de UI."    │
│                                                │
│ ━━━ Impacto en KPIs ━━━                       │
│ CSAT: 4/5 actual → 4.5/5 objetivo             │
│ NPS: 8/10 actual → 9+/10 objetivo             │
│ Impacto usuarios: 50+ usuarios del agente S001│
│                                                │
│ ━━━ Acciones ━━━                              │
│ [Mover a → Roadmap]                            │
│ [Asignar → Sprint 43]                          │
│ [Prioridad → P1]                               │
└────────────────────────────────────────────────┘
```

---

## 🔄 Estados del Ticket en Roadmap

```
1. BACKLOG (Inicial)
   ├─ Todos los feedbacks entran aquí
   ├─ Se revisan y priorizan
   └─ Badge: [📋 Backlog]
       ↓
2. ROADMAP (Planificado)
   ├─ Priorizados para implementación
   ├─ Asignados a quarter/sprint
   └─ Badge: [🎯 Roadmap Q4 2025]
       ↓
3. IN DEVELOPMENT (En desarrollo)
   ├─ Developer asignado
   ├─ Trabajo activo
   └─ Badge: [🔨 En Desarrollo]
       ↓
4. EXPERT REVIEW (Revisión técnica)
   ├─ Code review completado
   ├─ Esperando validación experta
   └─ Badge: [👁️ Expert Review]
       ↓
5. PRODUCTION (Desplegado)
   ├─ Implementado en producción
   ├─ Disponible para usuarios
   └─ Badge: [✅ Production v1.2.3]
```

---

## 🎯 Filtros en Roadmap

### Por Dominio:

```
[Todos] [getaifactory.com] [client.com] [demo.com]

Permite ver feedback por empresa/cliente
```

### Por Tipo de Usuario:

```
[Todos] [👑 Expertos] [⭐ Usuarios] [🔧 Admins]

Priorizar feedback de expertos primero
```

### Por Categoría:

```
[Todos] [🐛 Bugs] [✨ Features] [📝 Content] [⚡ Performance]

Agrupar por tipo de trabajo
```

### Por Rating:

```
[Todos] [Crítico: Inaceptable/1-2⭐] [Medio: Aceptable/3⭐] [Positivo: Sobresaliente/4-5⭐]

Priorizar feedback negativo
```

---

## 📊 Dashboard View

### SuperAdmin ve en Roadmap:

```
Roadmap Flow (getaifactory.com)

┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ 📋 Backlog  │ 🎯 Roadmap  │ 🔨 In Dev   │ 👁️ Review   │ ✅ Production│
│     4       │     2       │     1       │     1       │      8      │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│             │             │             │             │             │
│ [Card 1]    │ [Card A]    │ [Card X]    │ [Card P]    │ [Card M]    │
│ 👑 Expert   │ 👑 Expert   │ ⭐ User     │ 👑 Expert   │ 👑 Expert   │
│ Inaceptable │ Aceptable   │ 2⭐         │ Sobresalie. │ Aceptable   │
│ P1 High     │ P2 Medium   │ P0 Critical │ P3 Low      │ Done        │
│             │             │             │             │             │
│ [Card 2]    │ [Card B]    │             │             │ [Card N]    │
│ ⭐ User     │ ⭐ User     │             │             │ ⭐ User     │
│ 3⭐         │ 4⭐         │             │             │ 5⭐         │
│ P2 Medium   │ P3 Low      │             │             │ Done        │
│             │             │             │             │             │
│ [Card 3]    │             │             │             │ [Card O]    │
│ 🔧 Admin    │             │             │             │ 👑 Expert   │
│ P1          │             │             │             │ Done        │
│             │             │             │             │             │
│ [Card 4]    │             │             │             │ ...más      │
│ ⭐ User     │             │             │             │             │
│ 2⭐         │             │             │             │             │
│ P1          │             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🔍 Información Completa por Ticket

Cada card en roadmap muestra:

### Header:
```
📋 Título (generado del comentario o rating)
```

### User Info:
```
👤 Email del usuario
🏢 Dominio de la empresa
🎯 Agente donde dio feedback
```

### Feedback Details:
```
[👑 Experto] o [⭐ Usuario]
[Rating: ACEPTABLE] o [3/5 ⭐]
[NPS: 8/10] [CSAT: 4/5] (si experto)
```

### Classification:
```
[Prioridad: P0/P1/P2/P3]
[Categoría: Bug/Feature/UI/etc]
[Impacto: High/Medium/Low]
[Esfuerzo: XS/S/M/L/XL]
```

### Content:
```
💬 Comentario/Notas (preview)
📸 N capturas con X anotaciones
🤖 Análisis AI (si disponible)
```

### Metadata:
```
⏱️ Timestamp relativo (Hace 2h)
📅 Fecha exacta (30/10/2025)
🔄 Última actualización
```

---

## 🚀 Workflow: Feedback → Implementation

```
PASO 1: Usuario da feedback
   ↓
   Ticket aparece en BACKLOG
   Con toda la metadata
   
PASO 2: SuperAdmin revisa en Roadmap
   ↓
   Ve:
   • Todos los tickets
   • Filtrados por dominio
   • Ordenados por prioridad
   • Info completa (email, rol, rating, screenshots)
   
PASO 3: Prioriza
   ↓
   • Drag & drop a ROADMAP lane
   • Asigna a Sprint 43
   • Asigna a Q4 2025
   
PASO 4: Developer toma ticket
   ↓
   • Move a IN DEVELOPMENT
   • Implementa mejora
   
PASO 5: Expert Review
   ↓
   • Valida que resuelve el feedback
   • Verifica calidad
   
PASO 6: Production
   ↓
   • Deploy
   • Usuario original ve en "Mi Feedback": ✅ Implementado
   • Ciclo completo cerrado
```

---

## ✅ Datos Guardados en Firestore

```typescript
feedback_tickets/{ticketId}:
{
  // Identity
  id: "ticket-abc123",
  feedbackId: "feedback-xyz789",
  
  // User (para priorización)
  reportedBy: "user-id",
  reportedByEmail: "alec@getaifactory.com",  // ✅ Email visible
  reportedByRole: "admin",                    // ✅ Rol para peso
  userDomain: "getaifactory.com",             // ✅ Dominio filtrable
  
  // Content
  title: "Mejorar respuestas sobre PDFs",     // ✅ Título descriptivo
  description: "Notas completas...",
  
  // Categorization (para filtros)
  category: "content-quality",                // ✅ Categoría auto-detectada
  feedbackSource: "expert",                   // ✅ Tipo de feedback
  priority: "medium",
  lane: "backlog",                            // ✅ Lane inicial
  
  // Original feedback
  originalFeedback: {
    type: "expert",
    rating: "aceptable",
    comment: "...",
    screenshots: [...],
  },
  
  // Scores
  npsScore: 8,
  csatScore: 4,
  
  // Roadmap
  status: "new",
  userImpact: "medium",
  estimatedEffort: "m",
  upvotes: 0,
  shares: 0,
}
```

---

## 🎯 Beneficios

### Para Priorización:

1. **Ver origen:**
   - Email del usuario
   - Dominio de la empresa
   - Rol (expert/user/admin)

2. **Clasificar:**
   - Categoría auto-detectada
   - Rating explícito
   - Scores NPS/CSAT

3. **Decidir:**
   - Expert feedback = mayor peso
   - Feedback negativo = mayor urgencia
   - Screenshots = evidencia visual

### Para Tracking:

1. **Usuario ve:** Su ticket en "Mi Feedback"
2. **SuperAdmin ve:** Mismo ticket en Roadmap
3. **Sincronización:** Cambios en roadmap → reflejados en "Mi Feedback"

---

## ✅ Integration Checklist

- [x] Tickets guardan userDomain
- [x] Tickets guardan reportedByEmail
- [x] Tickets guardan reportedByRole
- [x] Tickets guardan feedbackSource (expert/user)
- [x] Tickets guardan category (auto-detectada)
- [x] Tickets guardan lane ('backlog' inicial)
- [x] Tickets incluyen originalFeedback completo
- [x] Tickets incluyen NPS/CSAT scores
- [ ] Roadmap carga tickets automáticamente
- [ ] Tags muestran toda la metadata
- [ ] Filtros funcionan por dominio/rol/categoría

---

**Status:** ✅ Backend updated with complete metadata  
**Next:** Verify tickets appear in Roadmap with all tags  
**Test:** Send feedback → Check Roadmap → See ticket with user info

🎯 **Ahora el feedback tiene integración completa con priorización data-driven!**




