# 🧪 Test de Referencias a Documentos - AHORA

**Objetivo:** Verificar que el sistema de referencias funciona correctamente

---

## ✅ Pre-requisitos

1. Servidor corriendo: `npm run dev`
2. Al menos 1 PDF activo en Fuentes de Contexto
3. Browser abierto en `http://localhost:3000/chat`

---

## 🎯 Test Rápido (2 minutos)

### 1. Verifica Contexto Activo

En el sidebar izquierdo, bajo "Fuentes de Contexto":
- ✅ Al menos 1 fuente debe tener toggle **VERDE** (activado)
- ✅ Ejemplo: "DDU 181 CIRCULAR ORD. N°..." debe estar activo

### 2. Haz Pregunta Específica

En el input, escribe:

```
¿Qué dice el documento sobre distanciamientos en construcciones subterráneas?
```

Presiona Enter o click "Enviar"

### 3. Verifica la Respuesta

**Espera ver:**
- Respuesta normal del AI (texto bien formateado)
- Números entre corchetes: `[1]`, `[2]` que son **clicables**
- Los números en azul, superscript, como links

**Ejemplo esperado:**
```
Las construcciones en subterráneo deben cumplir con distanciamientos[1].
Según la DDU 189[2], las zonas inexcavables están definidas en el PRC.
```

### 4. Haz Click en [1]

**Debe aparecer:**
- ✅ Panel derecho (width: ~400px)
- ✅ Header con "Referencia [1]" y nombre del documento
- ✅ Snippet destacado en **amarillo**
- ✅ Contexto antes/después en **gris**
- ✅ Botón "Ver documento completo" al final

**Ejemplo esperado:**
```
┌─────────────────────────────────┐
│ ✨ REFERENCIA [1]               │
│ DDU 181 CIRCULAR ORD. N°...     │
├─────────────────────────────────┤
│                                 │
│ 📄 Página 1                     │
│                                 │
│ Extracto del documento:         │
│                                 │
│ ...establece que                │
│                                 │
│ ┌─────────────────────────────┐│
│ │las construcciones en        ││
│ │subterráneo deben cumplir    ││
│ │con las disposiciones sobre  ││
│ │distanciamientos             ││
│ └─────────────────────────────┘│
│                                 │
│ o zonas inexcavables...         │
│                                 │
│ [Ver documento completo →]      │
│                                 │
│ ESC o click afuera para cerrar  │
└─────────────────────────────────┘
```

### 5. Cierra el Panel

**3 formas de cerrar:**
1. Presiona `ESC` → Panel desaparece
2. Click en el fondo oscuro (backdrop) → Panel desaparece
3. Click en el botón X (arriba derecha) → Panel desaparece

### 6. Prueba Otra Referencia

- Click en `[2]` si existe
- Debe mostrar DIFERENTE snippet
- Panel se actualiza con nueva información

---

## ❌ Si Algo No Funciona

### No veo referencias `[1]`, `[2]` en la respuesta

**Debug:**
1. Abre DevTools → Console
2. Busca: `console.log` con "references"
3. Verifica que el AI está generando la sección "REFERENCIAS:"

**Si no hay referencias:**
- El AI puede no estar usando los documentos
- Intenta pregunta más específica
- Verifica que el contexto está activo (toggle verde)

### Los números `[1]` no son clicables

**Debug:**
1. Inspecciona elemento (click derecho → Inspect)
2. Verifica que `[1]` es un `<button>`, no texto plano
3. Revisa console para errores de React

**Si no son botones:**
- Problema en `MessageRenderer.processReferences()`
- Revisa que `msg.references` tiene datos

### El panel no se abre al hacer click

**Debug:**
1. Verifica en console: `selectedReference` debe tener valor
2. Revisa que `ReferencePanel` se está renderizando
3. Busca errores de import

**Si panel no aparece:**
- Problema con estado React
- Revisa import de `ReferencePanel.tsx`

---

## 📸 Screenshots Esperados

### Vista Normal (sin panel)
```
┌────────────────────────────────────────────────────┐
│ SalfaGPT:                                          │
│                                                    │
│ Las construcciones en subterráneo deben cumplir   │
│ con distanciamientos[1]. La DDU 189[2] establece  │
│ zonas inexcavables que deben respetarse.          │
│                                                    │
│ [1] y [2] son azules y clicables                  │
└────────────────────────────────────────────────────┘
```

### Vista con Panel Abierto
```
┌──────────────────────────┬─────────────────────────────┐
│ SalfaGPT:                │ REFERENCIA [1]              │
│                          │ ────────────────────────────│
│ Las construcciones en    │ 📄 DDU 181 CIRCULAR         │
│ subterráneo deben cumplir│                             │
│ con distanciamientos[1]. │ Extracto:                   │
│                          │ ...establece que            │
│ La DDU 189[2] establece  │ [TEXTO DESTACADO EN AMARILLO]│
│ zonas inexcavables.      │ ...o zonas inexcavables     │
│                          │                             │
│                          │ [Ver documento completo →]  │
└──────────────────────────┴─────────────────────────────┘
```

---

## ✅ Criterios de Éxito

1. ✅ Referencias aparecen como números azules clicables
2. ✅ Click abre panel derecho
3. ✅ Panel muestra snippet destacado
4. ✅ ESC cierra el panel
5. ✅ Click afuera cierra el panel
6. ✅ Múltiples referencias funcionan independientemente
7. ✅ "Ver documento completo" abre modal de fuente

---

**Si todos los criterios pasan: SISTEMA FUNCIONANDO ✅**

**Si alguno falla: Reporta en console logs y screenshots**

