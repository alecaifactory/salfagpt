# Sistema de Feedback - UI Before & After (ASCII)

**Fecha:** 2025-10-29  
**Feature:** User & Expert Feedback System

---

## 📱 ANTES - Sin Sistema de Feedback

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Usuario:                                                        [📋] │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ¿Cuál es la política de devoluciones de Salfa?                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ SalfaGPT:                                                          [📋] │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  La política de devoluciones de Salfa permite devolver productos       │   │
│  │  en un plazo de 30 días desde la compra. Los productos deben estar     │   │
│  │  en su empaque original y sin uso...                                   │   │
│  │                                                                         │   │
│  │  [Ver documento: Manual de Políticas]                                  │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                  ↑                                              │
│                                  │                                              │
│                    ❌ NO HAY FORMA DE DAR FEEDBACK                             │
│                    ❌ NO SE CAPTURA SATISFACCIÓN                               │
│                    ❌ NO SE MEJORA CALIDAD                                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Escribe tu mensaje...                                             [📤] │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 DESPUÉS - Con Sistema de Feedback Completo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Usuario:                                                        [📋] │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ¿Cuál es la política de devoluciones de Salfa?                        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ SalfaGPT:                                                          [📋] │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  La política de devoluciones de Salfa permite devolver productos       │   │
│  │  en un plazo de 30 días desde la compra. Los productos deben estar     │   │
│  │  en su empaque original y sin uso...                                   │   │
│  │                                                                         │   │
│  │  [Ver documento: Manual de Políticas]                                  │   │
│  │                                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ ✨ NUEVO: Sistema de Feedback                                          │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  ¿Te fue útil esta respuesta?                                          │   │
│  │                                                                         │   │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐              │   │
│  │  │ 👑 Experto       │  │ ⭐ Calificar                   │              │   │
│  │  │  (Purple)        │  │  (Violet-Yellow Gradient)      │              │   │
│  │  └──────────────────┘  └────────────────────────────────┘              │   │
│  │   Solo Admin/Expert      Todos los usuarios                            │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                  ↑                                              │
│                    ✅ FEEDBACK INMEDIATO                                       │
│                    ✅ CAPTURAS CON ANOTACIONES                                 │
│                    ✅ TICKETS AUTOMÁTICOS                                      │
│                    ✅ MEJORA CONTINUA                                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Escribe tu mensaje...                                             [📤] │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 MODAL: Feedback Experto (Purple Theme)

```
                    ┌────────────────────────────────────────────────┐
                    │ 👑 Feedback Experto                       [✕] │
                    │ Evaluación de calidad profesional              │
                    ├────────────────────────────────────────────────┤
                    │                                                │
                    │ Calificación General *                         │
                    │ ┌─────────────┬─────────────┬─────────────┐   │
                    │ │     ❌      │     ✔️      │     ⭐      │   │
                    │ │ Inaceptable │  Aceptable  │Sobresaliente│   │
                    │ │  (Red-500)  │ (Yellow-500)│(Purple-500) │   │
                    │ │ Corrección  │  Estándares │ NPS>98      │   │
                    │ │  inmediata  │   básicos   │ CSAT 4+     │   │
                    │ └─────────────┴─────────────┴─────────────┘   │
                    │                                                │
                    │ NPS Score (0-10)                               │
                    │ ¿Qué tan probable es que recomiendes?          │
                    │ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐           │
                    │ │0 │1 │2 │3 │4 │5 │6 │7 │8 │9 │10│           │
                    │ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘           │
                    │ Nada probable ←───────────→ Muy probable       │
                    │                                                │
                    │ CSAT Score (1-5)                               │
                    │ ¿Qué tan satisfecho estás?                     │
                    │ ┌────┬────┬────┬────┬────┐                    │
                    │ │ 1  │ 2  │ 3  │ 4  │ 5  │                    │
                    │ └────┴────┴────┴────┴────┘                    │
                    │ Muy insatisfecho ←──→ Muy satisfecho           │
                    │                                                │
                    │ Notas de Evaluación                            │
                    │ ┌────────────────────────────────────────────┐ │
                    │ │ Detalla tu evaluación:                     │ │
                    │ │ • ¿Qué funciona bien?                      │ │
                    │ │ • ¿Qué debe mejorar?                       │ │
                    │ │ • Recomendaciones específicas...           │ │
                    │ │                                            │ │
                    │ │                                            │ │
                    │ └────────────────────────────────────────────┘ │
                    │                                                │
                    │ Capturas de Pantalla con Anotaciones           │
                    │ Señala problemas o elementos específicos       │
                    │                                                │
                    │ ┌────────────────────────────────────────────┐ │
                    │ │          [📷 Capturar Pantalla]            │ │
                    │ └────────────────────────────────────────────┘ │
                    │                                                │
                    │ Captura 1 (3 anotaciones)                      │
                    │ ┌────────────────────────────────────────────┐ │
                    │ │ [Screenshot con círculos, flechas, texto]  │ │
                    │ │        (Imagen anotada)                    │ │
                    │ └────────────────────────────────────────────┘ │
                    │                                                │
                    ├────────────────────────────────────────────────┤
                    │ Tu feedback ayuda a mejorar la calidad         │
                    │                                                │
                    │            [Cancelar]  [📤 Enviar Feedback]    │
                    └────────────────────────────────────────────────┘
```

---

## 🎨 MODAL: Feedback Usuario (Violet-Yellow Theme)

```
                    ┌────────────────────────────────────────────────┐
                    │ ⭐ Tu Opinión Importa                     [✕] │
                    │ Ayúdanos a mejorar                             │
                    │ (Gradient: Violet → Yellow)                    │
                    ├────────────────────────────────────────────────┤
                    │                                                │
                    │ ¿Qué te pareció esta respuesta? *              │
                    │                                                │
                    │         ★    ★    ★    ★    ★                  │
                    │        (0)  (1)  (2)  (3)  (4)  (5)            │
                    │                                                │
                    │    Hover para ver:                             │
                    │    0: Sin calificar                            │
                    │    1: Muy mala                                 │
                    │    2: Mala                                     │
                    │    3: Regular                                  │
                    │    4: Buena                                    │
                    │    5: Excelente                                │
                    │                                                │
                    │ Comentario (Opcional)                          │
                    │ ┌────────────────────────────────────────────┐ │
                    │ │ Cuéntanos más sobre tu experiencia...      │ │
                    │ │                                            │ │
                    │ │                                            │ │
                    │ └────────────────────────────────────────────┘ │
                    │                                                │
                    │ Capturas de Pantalla (Opcional)                │
                    │                                                │
                    │ ┌────────────────────────────────────────────┐ │
                    │ │            [📷 Capturar]                   │ │
                    │ └────────────────────────────────────────────┘ │
                    │                                                │
                    │ Captura 1 (2 anotaciones)                      │
                    │ ┌────────────────────────────────────────────┐ │
                    │ │ [Screenshot anotado]                       │ │
                    │ └────────────────────────────────────────────┘ │
                    │                                                │
                    ├────────────────────────────────────────────────┤
                    │ Gracias por ayudarnos a mejorar                │
                    │                                                │
                    │                  [Cancelar]  [📤 Enviar]       │
                    └────────────────────────────────────────────────┘
```

---

## 🎨 HERRAMIENTA: Screenshot Annotator (Pantalla Completa)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Anotar Captura                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ Herramientas:  [⭕] [▭] [➡️] [T]  │  Colores: [🟣] [🟡] [🔴] [🔵] [🟢]            │
│                                   │                                                 │
│               [Deshacer] [Limpiar Todo]           [Cancelar] [✔ Confirmar]         │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                          ┌─────────────────────────────────┐                       │
│                          │                                 │                       │
│                          │      [CAPTURA DE PANTALLA]      │                       │
│                          │                                 │                       │
│                          │    ⭕ ← Círculo dibujado       │                       │
│                          │       alrededor de botón        │                       │
│                          │                                 │                       │
│                          │    ▭ ← Rectángulo señalando    │                       │
│                          │       sección problemática      │                       │
│                          │                                 │                       │
│                          │    ➡️ ← Flecha apuntando a     │                       │
│                          │        elemento específico      │                       │
│                          │                                 │                       │
│                          │    📝 "Este botón no funciona"  │                       │
│                          │        ← Anotación de texto     │                       │
│                          │                                 │                       │
│                          └─────────────────────────────────┘                       │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Instrucciones:                                                                      │
│ • ⭕ Círculo: Click y arrastra  • ▭ Rectángulo: Click y arrastra                  │
│ • ➡️ Flecha: Inicio → Fin      • 📝 Texto: Click para posicionar                 │
│                                                                                     │
│              Selecciona herramienta y dibuja sobre la imagen                        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DASHBOARD: Backlog de Feedback (SuperAdmin)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 📋 Backlog de Feedback                                         [🔄 Actualizar]     │
│ Gestiona y prioriza mejoras del sistema                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐                          │
│ │  Total   │  Nuevos  │En Progreso│Completados│Críticos │                          │
│ │   42     │    12    │     8     │    20     │   2     │                          │
│ │ (Slate)  │ (Blue)   │ (Yellow)  │ (Green)   │  (Red)  │                          │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘                          │
│                                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ 🔍 [Buscar...]  │ [Estado ▾] │ [Prioridad ▾] │ [Categoría ▾]              │   │
│ │                                                                             │   │
│ │ Ordenar: [Prioridad] [Fecha] [Impacto]        12 de 42 tickets             │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ ▶ Mejorar tiempo de respuesta en consultas técnicas                        │   │
│ │                                                                             │   │
│ │   [🆕 Nuevo] [⚡ P0: Crítico] [🐛 Bug] [👑 Experto] [🔴 Impact: High]      │   │
│ │   [⏱️ Esfuerzo: M] [📅 2025-10-29] [👤 alec@getaifactory.com]             │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ ▼ Respuestas incompletas en contexto de PDFs                               │   │
│ │                                                                             │   │
│ │   [👁️ Triaged] [⚠️ P1: Alto] [📝 Content Quality] [⭐ Usuario]            │   │
│ │   [💪 Impact: Medium] [⏱️ Esfuerzo: L] [📅 2025-10-28]                    │   │
│ │                                                                             │   │
│ │   ├─ Descripción                                                           │   │
│ │   │  Las respuestas no incluyen información completa de PDFs...            │   │
│ │   │                                                                         │   │
│ │   ├─ Feedback Original                                                     │   │
│ │   │  ┌──────────────────────────────────────────┐                          │   │
│ │   │  │ ⭐ Usuario: 2/5 estrellas                │                          │   │
│ │   │  │ "No encontró info del PDF que subí"      │                          │   │
│ │   │  └──────────────────────────────────────────┘                          │   │
│ │   │                                                                         │   │
│ │   ├─ Análisis AI                                                           │   │
│ │   │  ┌──────────────────────────────────────────┐                          │   │
│ │   │  │ El usuario señala que la extracción de   │                          │   │
│ │   │  │ PDFs no es completa. Posible issue en    │                          │   │
│ │   │  │ chunking o embeddings de RAG.            │                          │   │
│ │   │  │                                          │                          │   │
│ │   │  │ Acciones Recomendadas:                   │                          │   │
│ │   │  │ • Revisar configuración RAG chunks       │                          │   │
│ │   │  │ • Aumentar topK de 5 a 10                │                          │   │
│ │   │  │ • Mejorar similarity threshold           │                          │   │
│ │   │  └──────────────────────────────────────────┘                          │   │
│ │   │                                                                         │   │
│ │   ├─ Capturas (1)                                                          │   │
│ │   │  ┌──────────────┬──────────────┐                                       │   │
│ │   │  │[Screenshot 1]│[Screenshot 2]│                                       │   │
│ │   │  │ 3 anotaciones│ 1 anotación  │                                       │   │
│ │   │  └──────────────┴──────────────┘                                       │   │
│ │   │                                                                         │   │
│ │   └─ Acciones                                                              │   │
│ │      [Estado ▾] [Prioridad ▾]                    [Ver Feedback Original]   │   │
│ │                                                                             │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ ▶ Agregar gráficos de analytics en dashboard                               │   │
│ │   [📊 Priorizado] [📌 P2: Medio] [✨ Feature Request] [👑 Experto]        │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 USER MENU - Con Nueva Opción

### ANTES:
```
┌─────────────────────────┐
│ 👤 Alec                 │
│ alec@getaifactory.com   │
├─────────────────────────┤
│ ⚙️  Configuración       │
│ 👥 Gestión de Usuarios  │
│ 🎯 RAG Configuration    │
│ 🚪 Cerrar Sesión        │
└─────────────────────────┘
```

### DESPUÉS:
```
┌─────────────────────────┐
│ 👤 Alec                 │
│ alec@getaifactory.com   │
├─────────────────────────┤
│ ⚙️  Configuración       │
│ 👥 Gestión de Usuarios  │
│ 📋 Backlog de Feedback  │ ← ✨ NUEVO
│     (Violet icon)       │
│ 🎯 RAG Configuration    │
│ 🚪 Cerrar Sesión        │
└─────────────────────────┘
```

---

## 🔄 FLUJO COMPLETO: De Feedback a Ticket

```
PASO 1: Usuario interactúa con agente
┌──────────────────────────────────┐
│ Usuario: "¿Política devoluciones?"│
│ Agente: "30 días, empaque..."    │
└──────────────────────────────────┘
            ↓
            
PASO 2: Usuario da feedback
┌──────────────────────────────────┐
│ Click [⭐ Calificar]             │
│                                  │
│ Modal abre:                      │
│ • Selecciona 2 estrellas (mala)  │
│ • Comenta: "No mencionó costos"  │
│ • Captura screenshot             │
│   - Círculo rojo en sección      │
│   - Texto: "Falta esta info"     │
│ • Click Enviar                   │
└──────────────────────────────────┘
            ↓
            
PASO 3: Sistema procesa (Backend)
┌──────────────────────────────────┐
│ 1. Guarda en message_feedback    │
│ 2. Gemini analiza screenshot:    │
│    "Usuario señala que falta     │
│     información de costos de     │
│     devolución en la respuesta"  │
│ 3. Gemini genera ticket:         │
│    Title: "Agregar costos a      │
│            políticas devolución" │
│    Category: content-quality     │
│    Priority: high (P1)           │
│    Impact: medium                │
│    Effort: s (1-4h)              │
│    Actions:                      │
│    • Actualizar prompt sistema   │
│    • Incluir tabla de costos     │
│    • Verificar contexto PDF      │
│ 4. Guarda en feedback_tickets    │
└──────────────────────────────────┘
            ↓
            
PASO 4: SuperAdmin ve en backlog
┌──────────────────────────────────┐
│ 📋 Backlog de Feedback           │
│                                  │
│ [🆕 Nuevo] [⚠️ P1] [📝 Content]  │
│ Agregar costos a políticas...    │
│                                  │
│ Click para expandir ▼            │
│ • Ve feedback original (2⭐)     │
│ • Ve screenshot anotado          │
│ • Ve análisis AI                 │
│ • Ve acciones sugeridas          │
│                                  │
│ Actualiza:                       │
│ Status: In Progress              │
│ Asigna: Sprint 42                │
│ Roadmap: Q4 2025                 │
└──────────────────────────────────┘
            ↓
            
PASO 5: Ticket se resuelve
┌──────────────────────────────────┐
│ Developer implementa mejora      │
│ Prompt actualizado ✅            │
│ Tabla de costos agregada ✅      │
│ Testing completo ✅              │
│                                  │
│ Status → Done                    │
│ resolvedAt: 2025-11-05           │
└──────────────────────────────────┘
            ↓
            
PASO 6: Usuario ve mejora
┌──────────────────────────────────┐
│ Usuario pregunta de nuevo:       │
│ "¿Política devoluciones?"        │
│                                  │
│ Agente ahora responde:           │
│ "30 días, empaque original.      │
│  COSTOS:                         │
│  • Envío: Gratis                 │
│  • Reembolso: 100%               │
│  • Procesamiento: 5-7 días"      │
│                                  │
│ Usuario da 5⭐!                  │
└──────────────────────────────────┘
```

---

## 📈 COMPARACIÓN: Antes vs Después

### ANTES (Sin Feedback)

```
Usuario → Respuesta → ❓ ¿Útil? → 🤷 No sabemos
                                   │
                                   └─→ Sin datos
                                       Sin mejoras
                                       Sin priorización
```

### DESPUÉS (Con Feedback)

```
Usuario → Respuesta → ⭐ Rating → 💾 Guardado
                         │            │
                         │            ├─→ 📊 Métricas
                         │            │    (NPS, CSAT)
                         │            │
                         │            ├─→ 🤖 AI Analiza
                         │            │    (Screenshot)
                         │            │
                         │            └─→ 🎫 Ticket
                         │                 (Backlog)
                         │                    │
                         ↓                    ↓
                    📈 Analytics         🛠️ Mejora
                    (Tendencias)         (Priorizada)
                         │                    │
                         └────────┬───────────┘
                                  ↓
                            🚀 Producto Mejor
                            ✨ Usuarios Felices
```

---

## 🎨 ESTADOS VISUALES

### Botones de Feedback en Mensaje

#### Estado Normal (No hover):
```
┌──────────────────────────────────────────────────┐
│ ¿Te fue útil esta respuesta?                    │
│                                                  │
│ ┌─────────────┐  ┌──────────────────────────┐   │
│ │ 👑 Experto  │  │ ⭐ Calificar             │   │
│ │             │  │                          │   │
│ │ bg-purple   │  │ bg-gradient(violet→yellow│   │
│ │ -100        │  │ -100)                    │   │
│ └─────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

#### Estado Hover:
```
┌──────────────────────────────────────────────────┐
│ ¿Te fue útil esta respuesta?                    │
│                                                  │
│ ┌─────────────┐  ┌──────────────────────────┐   │
│ │ 👑 Experto  │  │ ⭐ Calificar             │   │
│ │   ←hover    │  │                          │   │
│ │ bg-purple   │  │ bg-gradient(violet→yellow│   │
│ │ -200 ⚡     │  │ -100)                    │   │
│ │ (Más oscuro)│  │                          │   │
│ └─────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Rating Visual (Expert Modal)

#### Inaceptable Seleccionado:
```
┌──────────────┬──────────────┬──────────────┐
│      ❌      │     ✔️      │      ⭐      │
│  Inaceptable │  Aceptable   │Sobresaliente │
│ ┌──────────┐ │              │              │
│ │bg-red-50 │ │ bg-slate-100 │ bg-slate-100 │
│ │border-red│ │ border-slate │ border-slate │
│ │ring-red  │ │              │              │
│ │ SELECTED │ │              │              │
│ └──────────┘ │              │              │
└──────────────┴──────────────┴──────────────┘
```

### Star Rating (User Modal)

#### 3 Estrellas Hover:
```
  ★        ★        ★        ☆        ☆
(0)      (1)      (2)      (3)      (4)      (5)
 │        │        │        │        │        │
Red      Red      Red    Yellow   Empty    Empty
Filled   Filled   Filled  Hover   
                          ↑
                    "Regular"
                    (Tooltip)
```

#### 5 Estrellas Seleccionado:
```
  ★        ★        ★        ★        ★        
(0)      (1)      (2)      (3)      (4)      (5)
 │        │        │        │        │        │
Violet   Violet   Violet  Violet   Violet
Filled   Filled   Filled  Filled   Filled
                                             ↑
                                       "Excelente"
                                       SELECTED
```

---

## 🎫 TICKET CARD: Estados

### Collapsed (Vista Lista):
```
┌────────────────────────────────────────────────────────┐
│ ▶ Mejorar respuestas sobre contexto PDF               │
│                                                        │
│ [🆕 Nuevo] [⚡ P0] [🐛 Bug] [👑 Experto] [🔴 High]   │
│ [⏱️ M] [📅 29/10] [👤 alec@...]                      │
└────────────────────────────────────────────────────────┘
```

### Expanded (Vista Detalle):
```
┌────────────────────────────────────────────────────────┐
│ ▼ Mejorar respuestas sobre contexto PDF               │
│                                                        │
│ [🆕 Nuevo] [⚡ P0] [🐛 Bug] [👑 Experto] [🔴 High]   │
│ [⏱️ M] [📅 29/10] [👤 alec@...]                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Descripción                                            │
│ ┌────────────────────────────────────────────────┐    │
│ │ Las respuestas no incluyen toda la información │    │
│ │ disponible en los PDFs del contexto...         │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ Feedback Original                                      │
│ ┌────────────────────────────────────────────────┐    │
│ │ 👑 Experto: Inaceptable                        │    │
│ │ "Respuesta incompleta, no usa todo el PDF"     │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ Análisis AI                                            │
│ ┌────────────────────────────────────────────────┐    │
│ │ Issue en procesamiento RAG. El sistema no      │    │
│ │ está recuperando todos los chunks relevantes.  │    │
│ │                                                │    │
│ │ Acciones Recomendadas:                         │    │
│ │ • Revisar topK parameter (actual: 5)           │    │
│ │ • Ajustar minSimilarity (actual: 0.3)          │    │
│ │ • Verificar chunking strategy                  │    │
│ │ • Test con PDFs largos                         │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ Capturas (2)                                           │
│ ┌─────────────┬─────────────┐                         │
│ │[Screenshot1]│[Screenshot2]│                         │
│ │  ⭕ círculo │  ➡️ flecha  │                         │
│ │  📝 texto   │  📝 texto   │                         │
│ └─────────────┴─────────────┘                         │
│                                                        │
│ [Estado ▾ In Progress] [Prioridad ▾] [Ver Original]   │
└────────────────────────────────────────────────────────┘
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (>1024px):
```
┌───────────┬─────────────────────────┬────────┐
│ Sidebar   │   Chat + Feedback       │ Panel  │
│           │                         │        │
│ Agentes   │   Mensaje Usuario       │ Flows  │
│ Contexto  │   Mensaje Agente        │        │
│ User Menu │   [Feedback Buttons] ✨ │        │
│           │                         │        │
└───────────┴─────────────────────────┴────────┘
```

### Tablet (768-1023px):
```
┌───────────┬─────────────────────────┐
│ Sidebar   │   Chat + Feedback       │
│           │                         │
│ (280px)   │   [Feedback Buttons] ✨ │
│           │                         │
└───────────┴─────────────────────────┘
```

### Mobile (<768px):
```
┌─────────────────────────┐
│   Chat (Full width)     │
│                         │
│   [Feedback Buttons] ✨ │
│   (Stack vertical)      │
│                         │
│   [👑 Experto]          │
│   [⭐ Calificar]        │
│                         │
└─────────────────────────┘
```

---

## 🎨 SCREENSHOT ANNOTATOR: Herramientas

### Toolbar:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Anotar Captura                                                          │
│                                                                         │
│ Herramientas:                                                           │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐  │  Colores: ⬤ ⬤ ⬤ ⬤ ⬤                       │
│ │ ⭕│ │ ▭ │ │➡️ │ │ T │  │            Purple Yellow Red Blue Green    │
│ └───┘ └───┘ └───┘ └───┘  │                                             │
│  Círculo Rect Arrow Text  │  [Deshacer] [Limpiar]  [Cancelar] [✔]      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Canvas con Anotaciones:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                  ⭕ ← Círculo Purple                                    │
│                  alrededor de elemento                                  │
│                                                                         │
│            ▭───────────────────▭                                        │
│            │  Rectángulo Red   │                                        │
│            │  señala sección   │                                        │
│            ▭───────────────────▭                                        │
│                                                                         │
│                           ➡️ Flecha Blue                               │
│                          apunta aquí                                    │
│                                                                         │
│            📝 "Este botón no responde" ← Texto Yellow                  │
│                                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💫 ANIMACIONES Y ESTADOS

### Loading (Submit Feedback):
```
┌──────────────────────┐
│  ⏳ Enviando...      │
│                      │
│   ◐ Spinning         │
│                      │
│ [Button Disabled]    │
└──────────────────────┘
```

### Success:
```
┌──────────────────────────────────┐
│  ✅ Feedback enviado             │
│                                  │
│  Ticket creado: ticket-abc123    │
│                                  │
│  [Cerrar]                        │
└──────────────────────────────────┘
```

### Error:
```
┌──────────────────────────────────┐
│  ❌ Error al enviar              │
│                                  │
│  Por favor intenta nuevamente    │
│                                  │
│  [Reintentar] [Cerrar]           │
└──────────────────────────────────┘
```

---

## 🎯 DIFERENCIAS CLAVE

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| **Feedback** | ❌ No existe | ✅ Dual system (Expert + User) |
| **Capturas** | ❌ No hay | ✅ Screenshot annotator con 4 tools |
| **AI Analysis** | ❌ No aplica | ✅ Gemini analiza screenshots |
| **Tickets** | ❌ Manual | ✅ Auto-generados por AI |
| **Backlog** | ❌ No visible | ✅ Dashboard completo con filtros |
| **Priorización** | ❌ Ad-hoc | ✅ AI-sugerida basada en feedback |
| **Métricas** | ❌ No tracking | ✅ NPS, CSAT, Quality Score |
| **Mejora continua** | ❌ Reactiva | ✅ Data-driven, proactiva |

---

## 🚀 RESULTADO FINAL

### Vista Completa del Chat con Feedback:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                                    │
│ │ Sidebar  │  ┌──────────────────────────────────────────────────────────┐     │
│ │          │  │ 👤 Usuario:                                         [📋] │     │
│ │ Agentes  │  ├──────────────────────────────────────────────────────────┤     │
│ │ • Agent1 │  │ ¿Cuál es tu función principal?                          │     │
│ │ • Agent2 │  └──────────────────────────────────────────────────────────┘     │
│ │          │                                                                    │
│ │ Context  │  ┌──────────────────────────────────────────────────────────┐     │
│ │ 📄 PDF1  │  │ SalfaGPT:                                           [📋] │     │
│ │ 📊 CSV1  │  ├──────────────────────────────────────────────────────────┤     │
│ │          │  │ Soy un asistente de Salfa Corp especializado en...      │     │
│ │ User     │  │                                                          │     │
│ │ 👤 Alec  │  │ Mis funciones principales son:                           │     │
│ │ ──────── │  │ 1. Responder consultas técnicas                          │     │
│ │ Settings │  │ 2. Procesar documentos                                   │     │
│ │ Users    │  │ 3. Generar reportes                                      │     │
│ │ ✨Backlog│  │                                                          │     │
│ │          │  ├──────────────────────────────────────────────────────────┤     │
│ └──────────┘  │ ✨ ¿Te fue útil esta respuesta?                         │     │
│               │                                                          │     │
│               │ ┌─────────────┐  ┌────────────────────────────────┐     │     │
│               │ │👑 Experto   │  │⭐ Calificar                    │     │     │
│               │ └─────────────┘  └────────────────────────────────┘     │     │
│               └──────────────────────────────────────────────────────────┘     │
│                                                                                 │
│               ┌──────────────────────────────────────────────────────────┐     │
│               │ [Escribir mensaje...]                              [📤] │     │
│               └──────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘

BENEFICIOS:
✅ Feedback visible e inmediato
✅ No interrumpe el flujo de conversación
✅ Diferenciación clara Expert vs User
✅ Accesible con un click
✅ Professional y pulido
```

---

## 📊 BACKLOG DASHBOARD: Vista Completa

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 📋 Backlog de Feedback                                    [🔄 Actualizar]       │
│ Gestiona y prioriza mejoras del sistema                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌──────────┬──────────┬────────────┬────────────┬──────────┐                   │
│ │  Total   │  Nuevos  │En Progreso │Completados │ Críticos │                   │
│ │          │          │            │            │          │                   │
│ │    42    │    12    │     8      │     20     │    2     │                   │
│ │          │  (Blue)  │  (Yellow)  │  (Green)   │  (Red)   │                   │
│ └──────────┴──────────┴────────────┴────────────┴──────────┘                   │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐     │
│ │ 🔍 [Buscar tickets...] │ [Estado ▾] │ [Prioridad ▾] │ [Categoría ▾]   │     │
│ │                                                                         │     │
│ │ Ordenar: ⦿ Prioridad  ○ Fecha  ○ Impacto             12 de 42 tickets │     │
│ └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐     │
│ │ ▶ Mejorar tiempo de respuesta en consultas técnicas                    │     │
│ │                                                                         │     │
│ │ [🆕 Nuevo] [⚡ P0: Crítico] [🐛 Bug] [👑 Experto]                      │     │
│ │ [🔴 Impact: High] [⏱️ M] [📅 29/10/2025] [👤 alec@getai...]           │     │
│ └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐     │
│ │ ▼ PDFs no incluyen toda la info en respuestas                          │     │
│ │                                                                         │     │
│ │ [👁️ Triaged] [⚠️ P1: Alto] [📝 Content] [⭐ Usuario]                  │     │
│ │ [🟠 Impact: Medium] [⏱️ L] [📅 28/10/2025]                             │     │
│ ├─────────────────────────────────────────────────────────────────────────┤     │
│ │                                                                         │     │
│ │ ━━━ Descripción ━━━                                                    │     │
│ │ Usuario reporta que las respuestas no incluyen toda la información...  │     │
│ │                                                                         │     │
│ │ ━━━ Feedback Original ━━━                                              │     │
│ │ ┌─────────────────────────────────────────┐                            │     │
│ │ │ ⭐ Usuario: 2/5 estrellas                │                            │     │
│ │ │ "No encontró info del PDF que subí"      │                            │     │
│ │ └─────────────────────────────────────────┘                            │     │
│ │                                                                         │     │
│ │ ━━━ Análisis AI ━━━                                                    │     │
│ │ ┌─────────────────────────────────────────┐                            │     │
│ │ │ Issue en RAG chunking. Aumentar topK.    │                            │     │
│ │ │                                          │                            │     │
│ │ │ Acciones:                                │                            │     │
│ │ │ • Revisar RAG config                     │                            │     │
│ │ │ • Aumentar topK de 5 a 10                │                            │     │
│ │ │ • Mejorar similarity threshold           │                            │     │
│ │ └─────────────────────────────────────────┘                            │     │
│ │                                                                         │     │
│ │ ━━━ Capturas (2) ━━━                                                   │     │
│ │ ┌──────────────┬──────────────┐                                        │     │
│ │ │[Screenshot 1]│[Screenshot 2]│                                        │     │
│ │ │ 3 anotaciones│ 1 anotación  │                                        │     │
│ │ └──────────────┴──────────────┘                                        │     │
│ │                                                                         │     │
│ │ [Estado ▾ Triaged] [Prioridad ▾ P1]          [Ver Feedback Original]  │     │
│ └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐     │
│ │ ▶ UI muy lenta en mobile                                                │     │
│ │ [⏱️ In Progress] [🔥 P0] [⚡ Performance] [👑 Experto]                 │     │
│ └─────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 COMPARACIÓN LADO A LADO

```
╔═══════════════════════════════╦═══════════════════════════════╗
║           ANTES               ║          DESPUÉS              ║
║    (Sin Feedback)             ║    (Con Feedback)             ║
╠═══════════════════════════════╬═══════════════════════════════╣
║                               ║                               ║
║ ┌───────────────────────────┐ ║ ┌───────────────────────────┐ ║
║ │ SalfaGPT:            [📋]│ ║ │ SalfaGPT:            [📋]│ ║
║ ├───────────────────────────┤ ║ ├───────────────────────────┤ ║
║ │ Respuesta del agente...   │ ║ │ Respuesta del agente...   │ ║
║ │                           │ ║ │                           │ ║
║ │ (Markdown content)        │ ║ │ (Markdown content)        │ ║
║ │                           │ ║ │                           │ ║
║ └───────────────────────────┘ ║ ├───────────────────────────┤ ║
║                               ║ │ ¿Te fue útil?             │ ║
║      ❌ FIN DEL MENSAJE       ║ │                           │ ║
║      ❌ No feedback           ║ │ [👑 Experto] [⭐ Calificar│ ║
║      ❌ No mejora             ║ └───────────────────────────┘ ║
║                               ║        ↓                      ║
║                               ║   ✅ Feedback                 ║
║                               ║   ✅ Screenshots              ║
║                               ║   ✅ AI Analysis              ║
║                               ║   ✅ Tickets                  ║
║                               ║   ✅ Mejora continua          ║
╚═══════════════════════════════╩═══════════════════════════════╝
```

---

## 📐 DIMENSIONES Y ESPACIADO

### Botones de Feedback:
```
┌─────────────┐  ←  4px gap  →  ┌──────────────────────────┐
│👑 Experto   │                  │⭐ Calificar              │
│             │                  │                          │
│ 96px width  │                  │ 112px width              │
│ 32px height │                  │ 32px height              │
│ px-3 py-1.5 │                  │ px-3 py-1.5              │
│ text-xs     │                  │ text-xs                  │
└─────────────┘                  └──────────────────────────┘
```

### Modals:
```
Expert Modal:         User Modal:
max-w-3xl (768px)    max-w-2xl (672px)
max-h-90vh           max-h-90vh
p-6 (24px padding)   p-6 (24px padding)
```

### Screenshot Annotator:
```
Full screen (100vw x 100vh)
Toolbar: h-16 (64px)
Canvas: flex-1 (remaining space)
Footer help: h-12 (48px)
```

---

## 🎨 PALETA DE COLORES COMPLETA

### Expert Theme (Purple):
```
Background:  purple-50   #faf5ff
Border:      purple-200  #e9d5ff
Primary:     purple-600  #9333ea
Hover:       purple-700  #7e22ce
Text:        purple-900  #581c87
```

### User Theme (Violet-Yellow Gradient):
```
Violet:      violet-600  #7c3aed
Yellow:      yellow-600  #ca8a04
Background:  gradient from violet-50 to yellow-50
Text:        gradient from violet-700 to yellow-700
```

### Rating Colors:
```
Negative:    red-500     #ef4444
Neutral:     yellow-500  #eab308
Positive:    purple-500  #a855f7 (expert)
            violet-500  #8b5cf6 (user)
```

---

## ✨ ESTADOS INTERACTIVOS

### Expert Rating Buttons:

#### Sin seleccionar:
```
┌─────────────┐
│     ❌      │
│ Inaceptable │
│             │
│ border-     │
│ slate-200   │
│ bg-white    │
└─────────────┘
```

#### Hover:
```
┌─────────────┐
│     ❌      │
│ Inaceptable │
│   ⚡hover   │
│ border-     │
│ red-300     │
│ bg-red-50   │
└─────────────┘
```

#### Seleccionado:
```
┌─────────────┐
│     ❌      │
│ Inaceptable │
│  ✨SELECTED │
│ border-     │
│ red-500     │
│ bg-red-50   │
│ ring-2      │
│ ring-red-200│
└─────────────┘
```

---

## 🎬 ANIMACIÓN: Proceso de Feedback

```
Frame 1: Mensaje del agente aparece
┌──────────────────────┐
│ SalfaGPT:            │
│ Respuesta...         │
│                      │
│ [Generando...]       │  ← Sin botones durante streaming
└──────────────────────┘

        ↓ (500ms)

Frame 2: Streaming completa
┌──────────────────────┐
│ SalfaGPT:            │
│ Respuesta completa   │
│ ━━━━━━━━━━━━━━━━━━━ │
│ ¿Te fue útil? ✨     │  ← Botones aparecen
│ [👑] [⭐]            │     (Fade in 200ms)
└──────────────────────┘

        ↓ Click [⭐]

Frame 3: Modal abre
     ┌────────────────┐
     │ ⭐ Tu Opinión  │  ← Slide in from bottom
     │ Importa        │     (300ms animation)
     ├────────────────┤
     │ ★ ★ ★ ★ ★      │
     │                │
     │ [Comentario]   │
     └────────────────┘

        ↓ Selecciona 4★

Frame 4: Stars filled
     ┌────────────────┐
     │ ⭐ Tu Opinión  │
     │ Importa        │
     ├────────────────┤
     │ ★ ★ ★ ★ ☆      │  ← Fill animation
     │ (Violets)      │     (150ms each)
     │ [Comentario]   │
     └────────────────┘

        ↓ Click Enviar

Frame 5: Submitting
     ┌────────────────┐
     │ ⏳ Enviando... │  ← Loading spinner
     │                │     (Button disabled)
     │  ◐ Spinning    │
     └────────────────┘

        ↓ (1-2 segundos)

Frame 6: Success
     ┌────────────────┐
     │ ✅ Enviado     │  ← Check animation
     │                │     (Scale bounce)
     │ Ticket: abc123 │
     └────────────────┘
           ↓
     Auto-close 2s
```

---

## 🎯 RESUMEN VISUAL

**ANTES:**
- Conversación sin feedback
- No hay forma de mejorar
- Calidad estática

**DESPUÉS:**
- Botones de feedback en cada respuesta
- 2 tipos: Expert (purple) y User (gradient)
- Screenshot tool con 4 herramientas de dibujo
- AI analiza y genera tickets
- Backlog dashboard completo
- Mejora continua data-driven

**Impacto Visual:**
- ✨ Profesional y pulido
- 🎨 Temas visuales diferenciados
- ⚡ Interacciones fluidas
- 📊 Dashboard comprehensivo
- 🚀 Experience mejorada 10x

---

**¿Quieres ver alguna sección en más detalle?**

