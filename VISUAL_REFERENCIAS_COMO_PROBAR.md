# 📸 Guía Visual: Cómo Probar Referencias a Documentos

---

## 🎬 PASO 1: Prepara el Contexto

```
┌──────────────────────────────────────────────────┐
│ SALFAGPT                                    [⚙️] │
├──────────────────────────────────────────────────┤
│                                                  │
│ [+ Nuevo Agente]                                 │
│                                                  │
│ □ Asistente Legal Territorial RDI               │
│                                                  │
│ ─────────────────────────────────────────────── │
│                                                  │
│ Fuentes de Contexto         [+ Agregar]         │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │ 📄 DDU 181 CIRCULAR ORD. N°... 🟢       │◄───── IMPORTANTE
│ │ $0,025 • 70,136 tokens       [⚙️][🗑️]  │    Toggle VERDE
│ │ Aquí está el contenido...                │    = Activo
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │ 📄 Clr189.pdf              🟢            │◄───── IMPORTANTE
│ │ $0,014 • 38,646 tokens     [⚙️][🗑️]     │    Toggle VERDE
│ │ Aquí está el contenido...                │    = Activo
│ └──────────────────────────────────────────┘    │
│                                                  │
│ 3 activas                    3 fuentes totales  │
└──────────────────────────────────────────────────┘
```

**✅ VERIFICA:** Al menos 1 toggle debe estar VERDE (activo)

---

## 🎬 PASO 2: Haz Pregunta Específica

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                ÁREA DE CHAT                             │
│                                                         │
│                [Vacía - Sin mensajes]                   │
│                                                         │
│                                                         │
│                                                         │
│ ────────────────────────────────────────────────────── │
│                                                         │
│ ┌─────────────────────────────────────────────┐        │
│ │ ¿Qué dice el documento sobre               │◄──── ESCRIBE
│ │ distanciamientos en construcciones         │     PREGUNTA
│ │ subterráneas?                               │     ESPECÍFICA
│ └─────────────────────────────────────────────┘        │
│                                           [Enviar]      │
│                                                         │
│ Flow puede cometer errores. Verifica la información    │
│ importante.                                             │
└─────────────────────────────────────────────────────────┘
```

**Click "Enviar"**

---

## 🎬 PASO 3: VE LA RESPUESTA CON REFERENCIAS

```
┌─────────────────────────────────────────────────────────┐
│ Usuario:                                      hace 1 seg│
│ ¿Qué dice el documento sobre distanciamientos en       │
│ construcciones subterráneas?                            │
│ ────────────────────────────────────────────────────── │
│                                                         │
│ SalfaGPT:                                     41.8s     │
│                                                         │
│ De acuerdo a la normativa vigente y los documentos     │
│ proporcionados, los problemas que un proyecto          │
│ inmobiliario puede enfrentar cuando un Plan            │
│ Regulador Comunal (PRC) establece distanciamientos    │
│ o zonas inexcavadas en subterráneos son de índole     │
│ normativa, técnica y de gestión.                       │
│                                                         │
│ A continuación, se detalla un análisis técnico de la   │
│ situación, fundamentado en la Ordenanza General de     │
│ Urbanismo y Construcciones (OGUC) y las circulares     │
│ DDU pertinentes. El documento `soc 2 eBook.pdf` no    │
│ es pertinente para esta consulta, ya que trata sobre   │
│ certificaciones de seguridad de la información y no    │
│ sobre normativa urbanística chilena.                   │
│                                                         │
│ Análisis Normativo y Problemas Derivados              │
│                                                         │
│ El principal conflicto surge de la tensión entre la    │
│ necesidad del proyecto de maximizar la superficie      │
│ construida en subterráneo (generalmente para           │
│ estacionamientos y bodegas) y las restricciones        │
│ impuestas por el Instrumento de Planificación         │
│ Territorial (IPT) local.                               │
│                                                         │
│ 1. Obligatoriedad de Cumplir con el Plan              │
│    Regulador Comunal (PRC)                             │
│                                                         │
│ El problema fundamental es que las disposiciones del   │
│ PRC son de cumplimiento obligatorio. La Circular       │
│ DDU 189[1] es explícita al respecto, al analizar la   │◄── MIRA AQUÍ
│ modificación del artículo 2.6.3. de la OGUC[2].       │    Referencias
│                                                         │    Clicables
│ • Fundamento: La DDU 189, en su punto 3, señala que   │    en azul
│   la normativa actual, orientada a dar mayor           │
│   autonomía a las municipalidades, establece que       │
│   "las construcciones en subterráneo deben cumplir     │
│   con las disposiciones sobre distanciamientos o       │
│   zonas inexcavables, que hayan sido establecidas      │
│   en el Plan Regulador Comunal".                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**✅ VERIFICA:** 
- Números `[1]` `[2]` aparecen en **AZUL**
- Son **SUPERSCRIPT** (más pequeños, arriba)
- Cursor se convierte en **pointer** al hacer hover

---

## 🎬 PASO 4: CLICK EN [1]

```
┌────────────────────────┬────────────────────────────────┐
│ SalfaGPT:              │ ✨ REFERENCIA [1]              │◄──┐
│                        │ ────────────────────────────── │   │
│ ...La Circular         │ 📄 DDU 181 CIRCULAR ORD. N°... │   │
│ DDU 189[1] es explícita│ Página 1                       │   │ PANEL
│ al respecto...         │                                │   │ DERECHO
│                        │ ══════════════════════════════ │   │ APARECE
│ ...autonomía a las     │                                │   │
│ municipalidades[2].    │ Extracto del documento:        │   │
│                        │                                │   │
│                        │ ...establece que               │   │
│                        │                                │   │
│                        │ ╔════════════════════════════╗ │   │
│                        │ ║ las construcciones en      ║ │   │
│                        │ ║ subterráneo deben cumplir  ║ │◄──┘
│                        │ ║ con las disposiciones sobre║ │ SNIPPET
│                        │ ║ distanciamientos o zonas   ║ │ DESTACADO
│                        │ ║ inexcavables               ║ │ EN AMARILLO
│                        │ ╚════════════════════════════╝ │
│                        │                                │
│                        │ que hayan sido establecidas en │
│                        │ el Plan Regulador Comunal...   │
│                        │                                │
│                        │ ────────────────────────────── │
│                        │                                │
│                        │ 💡 Nota: Este extracto fue     │
│                        │ usado por el AI para generar   │
│                        │ la respuesta.                  │
│                        │                                │
│                        │ [Ver documento completo →]     │
│                        │                                │
│                        │ ────────────────────────────── │
│                        │ Presiona ESC o click afuera    │
│                        │                           [X]  │
└────────────────────────┴────────────────────────────────┘
     ▲                            ▲
     │                            │
  Click afuera                 Click X
  para cerrar                  para cerrar
```

**✅ VERIFICA:**
- Panel aparece a la derecha
- Header muestra "Referencia [1]" + nombre del documento
- Snippet en amarillo es legible
- Contexto gris es visible pero distinguible
- Botón "Ver documento completo" presente

---

## 🎬 PASO 5: CIERRA EL PANEL

### Opción A: Presiona ESC
```
┌────────────────────────┬────────────────────────┐
│ SalfaGPT:              │ REFERENCIA [1]         │
│                        │                        │
│ ...DDU 189[1]...       │ Panel visible          │
│                        │                        │
└────────────────────────┴────────────────────────┘
                ↓
           Presiona ESC
                ↓
┌──────────────────────────────────────────────────┐
│ SalfaGPT:                                        │
│                                                  │
│ ...DDU 189[1]...                                 │
│                                                  │
│ [Panel cerrado - vuelve a vista normal]          │
└──────────────────────────────────────────────────┘
```

### Opción B: Click en el Fondo Oscuro
```
┌────────────────────────┬────────────────────────┐
│ [Fondo oscuro]         │ REFERENCIA [1]         │◄─ Click aquí
│     ◄────────          │                        │  en el fondo
│  Click aquí            │ Panel visible          │  oscuro
│                        │                        │
└────────────────────────┴────────────────────────┘
                ↓
          Panel cierra
```

### Opción C: Click en X
```
┌────────────────────────┬────────────────────────┐
│ SalfaGPT:              │ REFERENCIA [1]    [X]  │◄─ Click aquí
│                        │                        │  en la X
│ ...DDU 189[1]...       │ Panel visible          │
│                        │                        │
└────────────────────────┴────────────────────────┘
                ↓
          Panel cierra
```

---

## 🎬 PASO 6: PRUEBA MÚLTIPLES REFERENCIAS

```
┌─────────────────────────────────────────────────────────┐
│ SalfaGPT:                                               │
│                                                         │
│ El artículo 2.6.3 de la OGUC[1] establece que las      │
│ construcciones subterráneas deben respetar             │
│ distanciamientos del PRC[2]. Además, la DDU 189[3]     │
│ aclara que esto incluye zonas inexcavables[4].         │
│                                                         │
│ [Tienes 4 referencias para explorar]                    │
└─────────────────────────────────────────────────────────┘

Click en [1] → Ve OGUC
Cierra panel

Click en [2] → Ve PRC  
Cierra panel

Click en [3] → Ve DDU 189
Cierra panel

Click en [4] → Ve zonas inexcavables
```

**✅ VERIFICA:**
- Cada click muestra DIFERENTE snippet
- Panel se actualiza con nueva información
- Cerrar y abrir funciona fluido

---

## 🔍 Debugging Visual

### ¿Dónde Buscar en DevTools?

```
F12 (Abrir DevTools)
  ↓
Console Tab
  ↓
Busca estos logs:

✅ "REFERENCIAS encontradas: 2"
   → Referencias fueron parseadas del AI

✅ "Enhanced references: [{id:1, sourceId: 'abc'...}]"
   → Referencias tienen metadata completo

❌ "Failed to parse references"
   → Hay problema con el JSON del AI

❌ "matchingSource not found"
   → Backend no encuentra el documento
```

### React DevTools

```
Components Tab
  ↓
Busca: MessageRenderer
  ↓
Props:
  - content: "...texto con [1]..."
  - references: [{id: 1, snippet: "..."}, ...]  ◄── DEBE ESTAR
  ↓
Si 'references' está vacío:
  → Problema en API endpoint
  → Revisa response JSON en Network tab
```

---

## 📸 Screenshots Esperados

### ANTES (Sin referencias)
```
┌─────────────────────────────────────┐
│ Las construcciones deben cumplir    │
│ con distanciamientos según PRC.     │
│                                     │
│ [Sin forma de verificar fuente]     │
└─────────────────────────────────────┘
```

### AHORA (Con referencias)
```
┌─────────────────────────────────────┐
│ Las construcciones deben cumplir    │
│ con distanciamientos[1] según PRC.  │
│                                     │
│ [1] = Click para ver fuente exacta  │
└─────────────────────────────────────┘
              ↓
        Panel aparece →
```

### Panel Abierto
```
┌─────────────────┬───────────────────────────┐
│ Respuesta       │ ✨ REFERENCIA [1]         │
│                 │ DDU 181 CIRCULAR          │
│ ...cumplir con  │                           │
│ distanciamientos│ 📄 Página 1               │
│ [1]...          │                           │
│                 │ Extracto:                 │
│                 │ ...establece que          │
│                 │                           │
│                 │ ▼ DESTACADO EN AMARILLO ▼ │
│                 │ las construcciones en     │
│                 │ subterráneo deben cumplir │
│                 │ con las disposiciones...  │
│                 │ ▲ FIN DESTACADO ▲         │
│                 │                           │
│                 │ que hayan sido...         │
│                 │                           │
│                 │ [Ver documento →]         │
└─────────────────┴───────────────────────────┘
```

---

## ✅ Checklist Visual

### Referencias en el Texto
```
[1] [2] [3]
 ↓   ↓   ↓
 └───┴───┴── Deben ser:
             - Azules
             - Superscript (pequeños, arriba)
             - Clicables (cursor pointer al hover)
             - Con hover effect (más oscuro)
```

### Panel Derecho
```
Cuando está abierto:
┌─────────────────────────┐
│ Header con:             │
│ - Icono documento       │
│ - "Referencia [N]"      │
│ - Nombre del documento  │
│ - Botón X               │
├─────────────────────────┤
│ Ubicación:              │
│ - Página N              │
│ - Sección (si existe)   │
├─────────────────────────┤
│ Extracto:               │
│ - Contexto antes (gris) │
│ - SNIPPET (amarillo)    │◄── DESTACADO
│ - Contexto después (gris)│
├─────────────────────────┤
│ Nota informativa        │
├─────────────────────────┤
│ [Ver documento →]       │
├─────────────────────────┤
│ Footer: ESC instrucciones│
└─────────────────────────┘
```

---

## 🎯 Casos de Prueba

### Test 1: Referencia Única
```
Pregunta: "¿Qué dice sobre distanciamientos?"
Esperado: Texto con [1]
Acción: Click [1] → Panel abre
```

### Test 2: Múltiples Referencias
```
Pregunta: "Explica distanciamientos y zonas inexcavables"
Esperado: Texto con [1][2][3]
Acción: Click cada uno → Diferente snippet
```

### Test 3: Referencias en Lista
```
Pregunta: "Dame 3 puntos sobre normativa"
Esperado:
1. Punto uno[1]
2. Punto dos[2]
3. Punto tres[3]

Acción: Click cada [N] → Panel abre
```

### Test 4: Sin Referencias
```
Pregunta: "Hola, ¿cómo estás?"
Esperado: Respuesta normal SIN [1][2]
Acción: No hay referencias para click
```

---

## 🐛 Troubleshooting Visual

### Problema: No veo `[1]` en la respuesta

```
MALO:
┌─────────────────────────────────┐
│ Las construcciones deben...     │
│ [Sin números, sin referencias]  │
└─────────────────────────────────┘

BUENO:
┌─────────────────────────────────┐
│ Las construcciones deben[1]...  │◄── Números presentes
│ según DDU 189[2]...             │
└─────────────────────────────────┘
```

**Fix:** Verifica contexto activo, haz pregunta más específica

### Problema: `[1]` existe pero no es clicable

```
MALO:
[1] ← Texto negro, no clickable

BUENO:
[1] ← Azul, superscript, cursor pointer
 ↑
hover muestra mano
```

**Fix:** Revisa console para errores React

### Problema: Panel no se abre

```
Click en [1]
    ↓
[Nada pasa]

Esperado:
Click en [1]
    ↓
Panel derecho aparece ✅
```

**Fix:** Revisa `msg.references` en DevTools

---

## 🎉 Éxito Visual

### Todo Funcionando Correctamente
```
1. Referencias inline:        [1][2] en azul ✅
2. Click abre panel:          Panel derecho ✅
3. Snippet destacado:         Amarillo ✅
4. Contexto visible:          Gris ✅
5. Cerrar con ESC:            Panel cierra ✅
6. Ver documento completo:    Modal abre ✅
```

**Captura screenshot cuando todo funcione y comparte! 📸**

---

## 📍 Ubicación en UI

```
LAYOUT COMPLETO:

┌──────────┬─────────────────────────┬──────────────┐
│          │                         │              │
│ Sidebar  │      Chat Area          │ [Panel]      │
│ Izquierdo│                         │ Referencias  │
│          │                         │ (On-demand)  │
│ Agentes  │ Usuario: Pregunta       │              │
│ Context  │                         │ Aparece solo │
│ Sources  │ AI: Respuesta con [1]   │ al hacer     │
│          │                         │ click en [1] │
│          │ [Input]                 │              │
│          │                         │              │
└──────────┴─────────────────────────┴──────────────┘
```

---

**Tiempo estimado de testing:** 2-3 minutos  
**Resultado esperado:** Sistema funcionando, referencias clicables, panel informativo ✅

**Próximo paso:** PROBAR AHORA → Abre http://localhost:3000/chat

