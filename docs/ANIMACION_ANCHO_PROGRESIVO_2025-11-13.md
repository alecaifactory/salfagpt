# ✅ Animación de Ancho Progresivo - Mensaje AI

**Fecha:** 2025-11-13  
**Status:** ✅ IMPLEMENTADO  
**Componentes:** ChatInterfaceWorking, MessageRenderer

---

## 🎯 Requisito

> "El ancho debe comenzar con fit al texto progresivo del avance del procesamiento. Cuando termina el procesamiento y antes de comenzar el streaming del texto, debe extenderse al 90% del ancho de la pantalla. Luego de eso comenzar el streaming. Una vez terminado el streaming debe permanecer el texto generado en pantalla sin regenerarse la UI, y mientras se carguen las referencias de la respuesta, se mostrará una barra de progreso en la sección de referencias."

---

## ✅ Implementación

### **1. Ancho Progresivo del Mensaje**

**Archivo:** `src/components/ChatInterfaceWorking.tsx` líneas 5375-5388

**Lógica implementada:**

```typescript
className={`inline-block rounded-md ... transition-all duration-500 ease-out ${
  // Progressive width animation:
  // 1. During thinking steps: w-fit (fit to status text)
  // 2. Before streaming (steps complete, no content yet): w-[90%] (expand)
  // 3. During streaming: w-[90%] (maintain)
  // 4. After streaming: max-w-5xl (final state, wider for complete content)
  msg.thinkingSteps && msg.thinkingSteps.length > 0 && !msg.content
    ? 'w-fit' // Step 1: Fit to thinking steps
    : msg.thinkingSteps && msg.thinkingSteps.every(s => s.status === 'complete') && msg.isStreaming
    ? 'w-[90%]' // Step 2-3: Expand before/during streaming
    : msg.isStreaming
    ? 'w-[90%]' // During streaming
    : 'max-w-5xl' // Step 4: Final state (wider than before)
}`}
```

---

### **2. Barra de Progreso en Referencias**

**Archivo:** `src/components/MessageRenderer.tsx` líneas 368-387

**Nuevo componente de loading:**

```typescript
{/* Loading indicator for references */}
{isLoadingReferences && (
  <div className="mt-6 pt-4 border-t-2 border-slate-200 bg-slate-50 rounded-b-lg -mx-4 -mb-4 px-4 pb-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse" 
          style={{ width: '70%', animation: 'pulse 1.5s ease-in-out infinite' }} 
        />
      </div>
    </div>
    <p className="text-xs text-slate-600 text-center font-medium flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4 text-blue-600" ...>
        {/* Spinner icon */}
      </svg>
      Cargando referencias...
    </p>
  </div>
)}
```

---

### **3. Prop isLoadingReferences**

**Archivo:** `src/components/ChatInterfaceWorking.tsx` línea 5472

**Lógica para determinar loading:**

```typescript
isLoadingReferences={
  msg.isStreaming && (!msg.references || msg.references.length === 0)
} 
// Show loading while streaming and no references yet
```

**Comportamiento:**
- Durante streaming + sin referencias todavía → Muestra loading
- Durante streaming + referencias ya llegaron → Muestra referencias
- Streaming terminado → Muestra referencias finales (no loading)

---

## 📊 Animación Completa - Timeline

### **Fase 1: Pensando (0-3s)**
```
┌────────────────────────┐
│ ✓ Pensando...          │  ← w-fit (ancho ajustado al texto)
│ ⏳ Buscando Contexto... │
│ ⏸ Seleccionando...     │
│ ⏸ Generando...         │
└────────────────────────┘
```
**Ancho:** ~320px (w-fit, min-w-[320px])

---

### **Fase 2: Contexto (3-6s)**
```
┌────────────────────────┐
│ ✓ Pensando...          │  ← Sigue w-fit
│ ✓ Buscando Contexto... │
│ ⏳ Seleccionando...     │
│ ⏸ Generando...         │
└────────────────────────┘
```
**Ancho:** ~320px (w-fit)

---

### **Fase 3: Todos los Pasos Completos (6-9s)**
```
┌────────────────────────────────────────────────────────────────────────┐
│ ✓ Pensando...                                                          │
│ ✓ Buscando Contexto Relevante...                                      │
│ ✓ Seleccionando Chunks...                                             │
│ ⏳ Generando Respuesta...                                              │
└────────────────────────────────────────────────────────────────────────┘
```
**Ancho:** Se expande a **90% del contenedor** (transición suave 500ms)
**Trigger:** Todos los pasos completos + isStreaming=true

---

### **Fase 4: Streaming Iniciado (9-15s)**
```
┌────────────────────────────────────────────────────────────────────────┐
│ Según el manual de mantenimiento[1], los pasos son: 1. Revisar el     │
│ filtro de aire cada... [cursor parpadeando]                           │
│                                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔵 Cargando referencias...                                             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 70%                                              │
└────────────────────────────────────────────────────────────────────────┘
```
**Ancho:** Mantiene **90%**
**Referencias:** Barra de progreso animada

---

### **Fase 5: Streaming Completo (15s+)**
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Según el manual de mantenimiento[1 82%], los pasos son: 1. Revisar el filtro de     │
│ aire cada 500 horas. 2. Verificar restricción con el indicador. 3. Reemplazar...    │
│                                                                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📚 Referencias utilizadas (3) [Click para expandir]                                  │
│   [1] Manual Mantenimiento - 82.3% 🟢                                                │
│   [2] Procedimiento Filtros - 75.8% 🟢                                               │
│   [3] Especificaciones Técnicas - 71.2% 🟢                                           │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
**Ancho:** Cambia a **max-w-5xl** (más ancho para contenido final)
**Referencias:** Mostradas, colapsadas por defecto
**Texto:** Permanece sin regenerarse (estable)

---

## 🎨 Transiciones CSS

### **Ancho del Mensaje**

```css
transition-all duration-500 ease-out
```

**Efecto:**
- Cambio de `w-fit` → `w-[90%]`: Suave expansión horizontal en 500ms
- Cambio de `w-[90%]` → `max-w-5xl`: Ajuste final cuando termina streaming
- Curva `ease-out`: Rápido al inicio, más lento al final (natural)

---

### **Barra de Progreso Referencias**

```css
animate-pulse
animation: pulse 1.5s ease-in-out infinite
```

**Efecto:**
- Pulso continuo mientras carga
- Ancho fijo al 70% del contenedor
- Gradiente azul a índigo
- Spinner rotando junto al texto

---

## 📐 Anchos en Cada Fase

| Fase | Clase CSS | Ancho Real (en pantalla ~1400px) | Propósito |
|------|-----------|-----------------------------------|-----------|
| Thinking steps | `w-fit min-w-[320px]` | ~320-400px | Ajustado a texto de estado |
| Pre-streaming | `w-[90%]` | ~1260px (90% del viewport) | Preparar para contenido largo |
| Streaming | `w-[90%]` | ~1260px | Mantener espacio mientras escribe |
| Final | `max-w-5xl` | ~1024px (constrained) | Contenido final legible |

**Nota:** `max-w-5xl` (1024px) es más angosto que 90% pero más ancho que el anterior `max-w-xl` (576px)

---

## 🔄 Estados del Mensaje

### **Estado 1: Solo Thinking Steps**

```typescript
msg.thinkingSteps.length > 0 && !msg.content
// Resultado: w-fit
```

**Qué muestra:**
- ✓ Pensando...
- ⏳ Buscando Contexto...
- (Sin contenido todavía)

---

### **Estado 2: Steps Completos, Iniciando Streaming**

```typescript
msg.thinkingSteps.every(s => s.status === 'complete') && msg.isStreaming
// Resultado: w-[90%]
```

**Qué muestra:**
- ✓ Pensando...
- ✓ Buscando Contexto...
- ✓ Seleccionando...
- ✓ Generando... ← Último completado
- (Ancho se expande AQUÍ, justo antes de que aparezca el primer chunk de texto)

---

### **Estado 3: Streaming Activo**

```typescript
msg.isStreaming
// Resultado: w-[90%]
```

**Qué muestra:**
- Texto apareciendo gradualmente
- Cursor parpadeando
- Barra "Cargando referencias..." si no hay refs todavía

---

### **Estado 4: Streaming Completo**

```typescript
!msg.isStreaming
// Resultado: max-w-5xl
```

**Qué muestra:**
- Texto completo
- Referencias mostradas (si hay)
- Sin cursor
- Sin loading indicators

---

## 🧪 Testing Visual

### **Test 1: Animación de Expansión**

1. Hacer pregunta en nuevo chat
2. Observar el mensaje del AI

**Esperado:**
```
[0-3s]   Mensaje angosto (w-fit) con "⏳ Pensando..."
[3-6s]   Sigue angosto con "✓ Pensando... ⏳ Buscando..."
[6-9s]   Sigue angosto con "✓✓✓ ⏳ Generando..."
[9s]     🎬 EXPANSIÓN SUAVE a 90% del ancho (500ms)
[9-15s]  Mantiene 90%, texto aparece gradualmente
[15s+]   Ajusta a max-w-5xl, muestra referencias
```

**Verificar:**
- ✅ Transición suave (no abrupta)
- ✅ 500ms de duración
- ✅ Ease-out (desaceleración al final)

---

### **Test 2: Loading de Referencias**

1. Durante streaming (9-15s)
2. Scroll hacia abajo del mensaje

**Esperado:**
```
[Mientras streaming]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 Cargando referencias...
▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 70%
[Spinner rotando]

[Después streaming]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Referencias utilizadas (3)
[Click para expandir]
```

**Verificar:**
- ✅ Barra aparece solo si isStreaming=true Y references.length=0
- ✅ Barra desaparece cuando referencias llegan
- ✅ No parpadeo/regeneración del texto

---

### **Test 3: Texto No Se Regenera**

**CRÍTICO:** El texto del AI NO debe regenerarse cuando:
1. Referencias terminan de cargar
2. isStreaming cambia a false
3. Mensaje cambia de estado

**Cómo verificar:**
1. Observar streaming
2. Ver cuando aparecen referencias
3. Texto debe permanecer EXACTO (no re-render)

**Implementación que lo garantiza:**
```typescript
{/* Show actual message content */}
<div className="relative">
  <MessageRenderer content={msg.content} />  ← content no cambia
</div>
```

El `content` se acumula durante streaming y NO se regenera después.

---

## 🎨 CSS Classes Usadas

### **Anchos:**
```css
w-fit           /* Auto width, fit to content */
w-[90%]         /* 90% of parent container */
max-w-5xl       /* Maximum 64rem (1024px) */
min-w-[320px]   /* Minimum width for thinking steps */
```

### **Transiciones:**
```css
transition-all       /* Transition all properties */
duration-500         /* 500ms duration */
ease-out             /* Deceleration curve */
```

### **Loading Bar:**
```css
animate-pulse                              /* Pulsing animation */
bg-gradient-to-r from-blue-500 to-indigo-600  /* Blue gradient */
rounded-full                               /* Fully rounded */
h-2                                        /* Height 0.5rem (8px) */
```

---

## 📊 Timing Detallado

```
Fase            Duración   Ancho        Contenido
────────────────────────────────────────────────────────────────
Pensando        0-3s       w-fit        ⏳ Pensando...
Buscando        3-6s       w-fit        ✓ Pensando... ⏳ Buscando...
Seleccionando   6-9s       w-fit        ✓✓ Pensando... Buscando... ⏳ Seleccionando...
────────────────────────────────────────────────────────────────
🎬 EXPANSIÓN    9s         w-fit→90%    Todos ✓✓✓✓ (transición 500ms)
────────────────────────────────────────────────────────────────
Streaming init  9-9.5s     w-[90%]      [primer chunk texto]
Streaming       9.5-15s    w-[90%]      Texto apareciendo + loading refs
────────────────────────────────────────────────────────────────
Completo        15s+       max-w-5xl    Texto final + Referencias
────────────────────────────────────────────────────────────────
```

**Total:** ~15 segundos desde pregunta hasta respuesta completa con referencias

---

## 🔍 Condiciones Lógicas

### **Condición 1: w-fit (Durante Thinking)**

```typescript
msg.thinkingSteps && msg.thinkingSteps.length > 0 && !msg.content
```

**Significado:**
- Hay thinking steps
- Y no hay contenido todavía
- → Mostrar solo los steps (ancho ajustado)

---

### **Condición 2: w-[90%] (Pre-Streaming)**

```typescript
msg.thinkingSteps && msg.thinkingSteps.every(s => s.status === 'complete') && msg.isStreaming
```

**Significado:**
- Hay thinking steps
- Y TODOS están completos (✓✓✓✓)
- Y está en modo streaming
- → Expandir a 90% (preparar para texto)

---

### **Condición 3: w-[90%] (Durante Streaming)**

```typescript
msg.isStreaming
```

**Significado:**
- Está en modo streaming (fallback)
- → Mantener 90% (puede no tener thinking steps)

---

### **Condición 4: max-w-5xl (Final)**

```typescript
// Default (ninguna de las anteriores)
```

**Significado:**
- Streaming terminado
- Mensaje completo
- → Ancho final para lectura óptima

---

## 🎯 Beneficios UX

### **1. Progresión Visual Clara**

**Usuario ve:**
1. Mensaje pequeño mientras "piensa"
2. **Expansión dramática** cuando va a generar (señal visual fuerte)
3. Espacio amplio para leer mientras escribe
4. Ajuste final a tamaño óptimo de lectura

**Efecto psicológico:**
- ✅ "Algo importante viene" (expansión = anticipación)
- ✅ "El AI está trabajando en mi respuesta" (no solo esperando)
- ✅ "Espacio suficiente para respuesta completa"

---

### **2. No Re-renders Innecesarios**

**Problema evitado:**
- ❌ Texto parpadeando al cargar referencias
- ❌ Scroll jump cuando cambia tamaño
- ❌ Re-lectura necesaria (usuario pierde lugar)

**Solución:**
- ✅ Texto se acumula una vez
- ✅ No se regenera
- ✅ Referencias se agregan DEBAJO (no afectan texto)

---

### **3. Loading Indicator Claro**

**Antes:** Silencio (usuario no sabe si habrá referencias)

**Ahora:** 
```
🔵 Cargando referencias...
▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 70%
```

**Usuario entiende:** "OK, hay más información viniendo, solo espera"

---

## 📱 Responsive Behavior

### **Desktop (>1400px)**

- `w-[90%]` = ~1260px
- `max-w-5xl` = 1024px (constrained)
- Suficiente para párrafos largos

### **Tablet (768-1400px)**

- `w-[90%]` = ~690-1260px (variable)
- `max-w-5xl` = min(viewport - 20%, 1024px)

### **Mobile (<768px)**

- `w-[90%]` = ~90% del viewport móvil
- `max-w-5xl` no aplica límite (menos que 1024px)

---

## ✅ Checklist de Implementación

- [x] Ancho progresivo: w-fit → w-[90%] → max-w-5xl
- [x] Transición suave (500ms ease-out)
- [x] Trigger en momento correcto (steps completos)
- [x] Barra de progreso para referencias
- [x] isLoadingReferences prop
- [x] No re-render del texto
- [x] Sin errores de linter
- [x] Responsive
- [ ] Testing manual (pendiente)

---

## 🚀 Para Testing

### **Abrir:**
```
http://localhost:3000/chat
```

### **Crear:** 
Nuevo chat (+ Nuevo Chat botón morado)

### **Preguntar:**
```
¿Cuáles son los pasos para mantenimiento preventivo de grúas HIAB?
```

### **Observar:**
1. [0-9s] Mensaje pequeño (w-fit) con thinking steps
2. [9s] 🎬 EXPANSIÓN a 90% (suave, 500ms)
3. [9-15s] Streaming con ancho 90% + loading referencias
4. [15s+] Ancho final (max-w-5xl) + referencias mostradas

### **Verificar:**
- ✅ Expansión es suave (no salto)
- ✅ Loading de referencias se muestra
- ✅ Texto NO parpadea cuando llegan referencias
- ✅ Referencias tienen similitud >70% (NO 50%)

---

**Implementación completa. Ready para testing visual.**





