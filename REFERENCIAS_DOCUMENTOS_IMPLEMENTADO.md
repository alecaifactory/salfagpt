# 🔗 Sistema de Referencias a Documentos - Implementado

**Fecha:** 2025-10-16  
**Estado:** ✅ Implementado y listo para probar  

---

## 🎯 Qué Se Implementó

Un sistema de referencias inline que permite al AI citar documentos fuente de manera académica, generando confianza y trazabilidad completa.

### Características Principales

1. **Referencias Numeradas Inline**: `[1]`, `[2]`, etc. en las respuestas del AI
2. **Panel Derecho Detallado**: Muestra el snippet exacto usado + contexto
3. **Trazabilidad Completa**: Ubicación precisa (página, sección)
4. **UX Simple**: Click en referencia → Panel aparece, ESC o click afuera → Panel cierra
5. **Ver Documento Completo**: Botón para abrir modal con documento completo

---

## 🏗️ Arquitectura

### Backend (Gemini AI)

**Modificado:** `src/lib/gemini.ts`

- ✅ Nuevo system prompt cuando hay contexto activo
- ✅ Instrucciones al AI para incluir referencias numeradas
- ✅ Parser de JSON para extraer referencias de la respuesta
- ✅ Interface `SourceReference` para TypeScript

**Formato de Respuesta del AI:**
```
Las construcciones en subterráneo deben cumplir con distanciamientos[1]. 
La DDU 189 establece zonas inexcavables[2].

REFERENCIAS:
```json
{
  "references": [
    {
      "id": 1,
      "snippet": "las construcciones en subterráneo deben cumplir con las disposiciones sobre distanciamientos",
      "context": {
        "before": "establece que",
        "after": "o zonas inexcavables que hayan sido establecidas"
      }
    },
    {
      "id": 2,
      "snippet": "las zonas inexcavables están clarificadas en el artículo 2.6.3 de la OGUC"
    }
  ]
}
```
```

### API Endpoint

**Modificado:** `src/pages/api/conversations/[id]/messages.ts`

- ✅ Recibe referencias de `generateAIResponse()`
- ✅ Enriquece referencias con metadata de las fuentes (sourceId, sourceName)
- ✅ Incluye referencias en la respuesta JSON

### Frontend Components

**Nuevo:** `src/components/ReferencePanel.tsx`

- Panel derecho que se abre al hacer click en una referencia
- Muestra snippet destacado en amarillo
- Contexto antes/después en gris
- Botón para ver documento completo
- Cierra con ESC, click afuera, o botón X

**Modificado:** `src/components/MessageRenderer.tsx`

- ✅ Procesa referencias inline `[1]`, `[2]` en párrafos
- ✅ Convierte números en botones clicables (superscript)
- ✅ Maneja estado del panel de referencia seleccionado
- ✅ Integra `ReferencePanel` cuando hay referencia activa

**Modificado:** `src/components/ChatInterfaceWorking.tsx`

- ✅ Interface `Message` incluye campo `references`
- ✅ Almacena referencias cuando llega respuesta del API
- ✅ Pasa referencias a `MessageRenderer`

---

## 🎨 Ejemplo Visual

```
┌────────────────────────────────────┬──────────────────────────┐
│ RESPUESTA DEL AI                   │ [Panel oculto por defecto]│
│                                    │                          │
│ Las construcciones en subterráneo  │                          │
│ deben cumplir con                  │                          │
│ distanciamientos[1].               │                          │
│                                    │                          │
│ La DDU 189 establece zonas         │                          │
│ inexcavables[2].                   │                          │
│                                    │                          │
│ [1] y [2] son botones clicables    │                          │
└────────────────────────────────────┴──────────────────────────┘

USUARIO HACE CLICK EN [1]:

┌────────────────────────────┬───────────────────────────────┐
│ RESPUESTA DEL AI           │ ✨ REFERENCIA [1]            │
│                            │ ──────────────────────────────│
│ Las construcciones en      │ 📄 DDU 181 CIRCULAR ORD.     │
│ subterráneo deben cumplir  │ Página 1                     │
│ con distanciamientos[1].   │                              │
│                            │ ════════════════════════════ │
│ La DDU 189 establece zonas │                              │
│ inexcavables[2].           │ Extracto del documento:      │
│                            │                              │
│                            │ ...establece que             │
│                            │                              │
│                            │ ╔══════════════════════════╗ │
│                            │ ║ las construcciones en    ║ │
│                            │ ║ subterráneo deben cumplir║ │
│                            │ ║ con las disposiciones    ║ │
│                            │ ║ sobre distanciamientos   ║ │
│                            │ ╚══════════════════════════╝ │
│                            │                              │
│                            │ o zonas inexcavables...      │
│                            │                              │
│                            │ ─────────────────────────────│
│                            │ [Ver documento completo →]   │
│                            │                              │
│ ESC o click afuera cierra  │ [X] cerrar                   │
└────────────────────────────┴───────────────────────────────┘
```

---

## 🧪 Cómo Probarlo

### Paso 1: Preparar Contexto

1. Abre el chat en `http://localhost:3000/chat`
2. Asegúrate de tener al menos 1 PDF activo en "Fuentes de Contexto"
3. Verifica que el toggle esté **VERDE** (activado)

### Paso 2: Hacer Pregunta Específica

Haz una pregunta que requiera citar el documento:

```
"¿Qué dice el documento sobre distanciamientos en construcciones subterráneas?"
```

### Paso 3: Verificar Respuesta con Referencias

El AI debería responder con referencias numeradas:

```
Según el documento[1], las construcciones en subterráneo deben cumplir 
con distanciamientos o zonas inexcavables establecidas en el PRC[2].

REFERENCIAS:
[Se procesa automáticamente en el backend]
```

### Paso 4: Interactuar con Referencias

1. **Click en [1]**: Panel derecho aparece con snippet destacado
2. **Leer el extracto**: Texto en amarillo = cita exacta
3. **Ver contexto**: Texto gris antes/después para entender contexto completo
4. **Cerrar panel**: 
   - Presiona ESC
   - Click en el backdrop (fondo oscuro)
   - Click en el botón X
5. **Ver documento completo**: Click en "Ver documento completo"

### Paso 5: Verificar Múltiples Referencias

Haz otra pregunta más compleja:

```
"Explica las obligaciones del PRC según DDU 189 y menciona también lo que dice sobre la OGUC"
```

Debería incluir referencias [1], [2], [3], etc. - Click en cada una para ver diferentes extractos.

---

## ✅ Checklist de Verificación

### Funcionalidad Básica
- [ ] AI incluye referencias numeradas inline en respuestas
- [ ] Referencias son clicables (botones azules en superscript)
- [ ] Click abre panel derecho
- [ ] Panel muestra snippet destacado en amarillo
- [ ] Panel muestra contexto antes/después en gris

### Interacción del Panel
- [ ] ESC cierra el panel
- [ ] Click en backdrop cierra el panel
- [ ] Click en X cierra el panel
- [ ] Click en "Ver documento completo" abre modal de fuente
- [ ] Panel es responsive (se adapta a móvil)

### Edge Cases
- [ ] Mensaje sin referencias: No aparecen botones, todo normal
- [ ] Referencias sin sourceId: Panel funciona pero sin link a documento
- [ ] Múltiples referencias en mismo párrafo: Todas clicables
- [ ] Referencias en listas o headings: Funciona correctamente

### Visual
- [ ] Referencias son visualmente distinguibles (azul, superscript)
- [ ] Hover en referencia muestra cursor pointer
- [ ] Panel tiene sombra y se ve profesional
- [ ] Snippet destacado es legible (amarillo no muy brillante)
- [ ] Contexto (gris) es suficientemente visible

---

## 🎨 Detalles de Implementación

### TypeScript Interfaces

```typescript
// src/lib/gemini.ts
export interface SourceReference {
  id: number;
  sourceId: string;
  sourceName: string;
  snippet: string;
  context?: {
    before?: string;
    after?: string;
  };
  location?: {
    page?: number;
    section?: string;
  };
}

export interface GenerateResponse {
  content: MessageContent;
  tokenCount: number;
  contextSections: ContextSection[];
  references?: SourceReference[]; // NEW
}
```

### Componente ReferencePanel

**Props:**
- `reference: SourceReference` - La referencia a mostrar
- `onClose: () => void` - Función para cerrar el panel
- `onViewFullDocument?: (sourceId: string) => void` - Abrir documento completo

**Características:**
- Fixed position right panel (width: 384px / w-96)
- z-index: 50 (encima de todo menos modals)
- Backdrop con blur
- Auto-focus en cerrar con ESC
- Sticky header y footer

### MessageRenderer

**Nuevas Props:**
- `references?: SourceReference[]` - Array de referencias del mensaje

**Lógica:**
- Función `processReferences()` parsea texto y reemplaza `[1]` con botones
- Estado local para `selectedReference`
- Renderiza `ReferencePanel` cuando hay referencia seleccionada

---

## 🔧 Mejoras Futuras (Opcionales)

### Corto Plazo
- [ ] Agregar número de página en snippet (si está disponible)
- [ ] Mostrar preview del documento en el panel
- [ ] Animación de apertura/cierre del panel
- [ ] Soporte para múltiples snippets en misma referencia

### Mediano Plazo
- [ ] Guardar referencias en Firestore con mensajes
- [ ] Analytics: Qué referencias se hacen click más
- [ ] Exportar conversación con referencias
- [ ] Validar calidad de referencias (expert review)

### Largo Plazo
- [ ] Referencias cruzadas entre documentos
- [ ] Grafo de conocimiento basado en referencias
- [ ] Sugerencias automáticas de fuentes relacionadas
- [ ] Citation export (BibTeX, APA, etc.)

---

## 🚨 Troubleshooting

### Las referencias no aparecen

**Causa:** El AI no está incluyendo referencias en la respuesta

**Solución:**
1. Verifica que hay contexto activo (toggles verdes)
2. Haz una pregunta más específica que requiera citar
3. Revisa console logs para ver si `references` viene en el response

### El panel no se abre

**Causa:** Referencias no tienen metadata completo

**Solución:**
1. Revisa console: `data.references` debe tener valores
2. Verifica que `matchingSource` encuentra el documento

### Panel se ve raro en móvil

**Solución:**
- Agregar breakpoint responsive para ancho en móvil
- Convertir a modal fullscreen en <768px

---

## 📊 Impacto Esperado

### Confianza del Usuario
- **Antes:** "¿De dónde sacó eso el AI?" 🤔
- **Ahora:** "Ah, está citando el artículo 2.6.3 de la DDU 189" ✅

### Trazabilidad
- **Antes:** Respuesta sin fuentes verificables
- **Ahora:** Cada afirmación tiene cita exacta del documento

### Validación de Expertos
- **Antes:** Experto debe buscar manualmente en documentos
- **Ahora:** Experto hace click en [1] y ve extracto exacto

---

## ✅ Listo para Probar

**Archivos Modificados:**
1. ✅ `src/lib/gemini.ts` - System prompt + parsing
2. ✅ `src/pages/api/conversations/[id]/messages.ts` - API endpoint
3. ✅ `src/components/ReferencePanel.tsx` - Nuevo componente
4. ✅ `src/components/MessageRenderer.tsx` - Referencias inline
5. ✅ `src/components/ChatInterfaceWorking.tsx` - Interface + estado

**Type Checking:** ✅ 0 errores

**Próximo Paso:** Probar en el browser con documentos reales

---

## 🎓 Lecciones Aprendidas

1. **Simple es mejor**: Snippet + contexto es más claro que highlighting complejo
2. **Estándar académico**: Referencias numeradas `[1]` son universalmente entendidas
3. **Progressive disclosure**: Panel solo cuando se necesita, no siempre visible
4. **Confianza = Trazabilidad**: Mostrar exactamente qué texto se usó

---

**Implementado por:** Cursor AI  
**Tiempo:** ~10 minutos  
**Complejidad:** Media  
**Impacto:** Alto (genera confianza y trazabilidad)

