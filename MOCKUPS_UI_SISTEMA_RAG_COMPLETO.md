# 🎨 Mockups UI - Sistema RAG Completo

**Visualización exacta de todas las interfaces implementadas**

---

## 1️⃣ Panel de Contexto - Vista Principal

**Ubicación:** Click botón "Contexto" arriba del input

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Desglose del Contexto                                   11.3% usado ✅ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────┬─────────────────┬─────────────────┐                │
│ │ Total Tokens    │ Disponible      │ Capacidad       │                │
│ │ 113,171         │ 886,829         │ 1000K           │                │
│ └─────────────────┴─────────────────┴─────────────────┘                │
│                                                                         │
│ ───────────────────────────────────────────────────────────────────    │
│                                                                         │
│ System Prompt                                        ~102 tokens        │
│ ┌─────────────────────────────────────────────────────────────────┐    │
│ │ Eres un asistente de IA útil, preciso y amigable...            │    │
│ └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ Historial de Conversación                    2 mensajes • ~54 tokens   │
│ ┌─────────────────────────────────────────────────────────────────┐    │
│ │ 👤 Usuario: hola                                                │    │
│ │ 🤖 Asistente: ¡Hola! 👋 ¡Es genial verte por aquí!...         │    │
│ └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ ───────────────────────────────────────────────────────────────────    │
│                                                                         │
│ Fuentes de Contexto              1 activas • ~113,014 tokens 📊        │
│                                                                         │
│ RAG: [✓ Todos RAG] [✗ Todos Full-Text]  ← Botones bulk               │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐    │
│ │ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf                              │    │
│ │ 🌐 PUBLIC  ✓ Validado  🔍 100 chunks                           │    │
│ │                                                                 │    │
│ │ Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok  ← Toggle individual    │    │
│ │                                                                 │    │
│ │ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN --- Ministerio de        │    │
│ │   Vivienda y Urbanismo. 101 --- # TABLA DE...                  │    │
│ └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ [Cerrar Panel]                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Cuando Click "✓ Todos RAG"

**Todos los documentos cambian a RAG:**

```
Fuentes de Contexto              1 activas • ~2,657 tokens 📊  ← Baja!

RAG: [✓ Todos RAG ●] [✗ Todos Full-Text]

┌─────────────────────────────────────────────────────────────────┐
│ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf                              │
│ 🌐 PUBLIC  ✓ Validado  🔍 100 chunks                           │
│                                                                 │
│ Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok  ← Verde activo         │
│                                                                 │
│ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN...                        │
└─────────────────────────────────────────────────────────────────┘

💰 Total tokens reducido: 113,014 → 2,657 (98% ahorro)
```

---

## 3️⃣ Cuando Click "✗ Todos Full-Text"

**Todos los documentos cambian a Full-Text:**

```
Fuentes de Contexto              1 activas • ~113,014 tokens 📊  ← Sube!

RAG: [✓ Todos RAG] [✗ Todos Full-Text ●]

┌─────────────────────────────────────────────────────────────────┐
│ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf                              │
│ 🌐 PUBLIC  ✓ Validado  🔍 100 chunks                           │
│                                                                 │
│ Modo: [📝 Full ●] [🔍 RAG]  ~113,014tok  ← Azul activo        │
│                                                                 │
│ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN...                        │
└─────────────────────────────────────────────────────────────────┘

💰 Usando documento completo (sin ahorro)
```

---

## 4️⃣ Con Múltiples Documentos (Modo Mixto)

```
Fuentes de Contexto              3 activas • ~17,500 tokens 📊

RAG: [✓ Todos RAG] [✗ Todos Full-Text]

┌─────────────────────────────────────────────────────────────────┐
│ 📄 Doc-Pequeño.pdf (10 páginas)                                 │
│ ✨ Flash                                                        │
│                                                                 │
│ Modo: [📝 Full ●] [🔍 RAG]  ~10,000tok  ← Usuario elige Full  │
│                                                                 │
│ Contenido del documento pequeño...                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf (100 páginas)                │
│ 🌐 PUBLIC  ✓ Validado  🔍 100 chunks                           │
│                                                                 │
│ Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok  ← RAG activo           │
│                                                                 │
│ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN...                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📄 Budget-2025.pdf (50 páginas)                                 │
│ ✨ Pro  🔍 50 chunks                                            │
│                                                                 │
│ Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok  ← RAG activo           │
│                                                                 │
│ Budget fiscal year 2025...                                      │
└─────────────────────────────────────────────────────────────────┘

Cálculo mixto:
• Doc1 (Full):  10,000 tokens
• Doc2 (RAG):    2,500 tokens
• Doc3 (RAG):    2,500 tokens
─────────────────────────────────
Total:          15,000 tokens

vs Todo Full-Text: 163,000 tokens
Ahorro: 91% ✨
```

---

## 5️⃣ Sidebar Izquierdo (Simplificado)

```
┌────────────────────────────────────┐
│ SALFAGPT 🔄                        │
├────────────────────────────────────┤
│                                    │
│ [+ Nuevo Agente]                   │
│                                    │
│ ☐ New Conversation                 │
│ ☐ IRD                              │
│ ☑ Nuevo Agente        ← Actual     │
│                                    │
│ 📦 Archivados (99)  ▼              │
│                                    │
├────────────────────────────────────┤
│                                    │
│ Fuentes de Contexto   [+ Agregar]  │
│                                    │
│ ┌────────────────────────────────┐ │
│ │📄 ANEXOS-Manu...         [🟢]│ │
│ │PDF  ✨Flash  🔍RAG             │ │
│ │💰 $0.902                       │ │
│ │📊 2,177,805 tokens             │ │
│ │                                │ │
│ │🔍 Habilitar RAG               │ │ ← Si no tiene RAG
│ │   (optimizar búsqueda)        │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │📄 SOC 2 eBook.pdf        [⚪]│ │
│ │PDF  ✨Pro  🌐PUBLIC            │ │
│ └────────────────────────────────┘ │
│                                    │
│ 1 activas    2 fuentes totales     │
│                                    │
└────────────────────────────────────┘
```

---

## 6️⃣ Chat con Query Attribution (Futuro)

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Usuario:                                                     │
│ ¿Cuáles son los requisitos de participación ciudadana?          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Asistente:                                                   │
│                                                                 │
│ Los requisitos de participación ciudadana incluyen[1]:          │
│                                                                 │
│ 1. Convocatoria pública con mínimo 30 días de anticipación      │
│ 2. Información completa sobre el proyecto[2]                    │
│ 3. Mecanismos de consulta accesibles                            │
│                                                                 │
│ ───────────────────────────────────────────────────────────     │
│                                                                 │
│ 🔍 Contexto Usado (RAG):                                        │
│                                                                 │
│ [1] ANEXOS-Manual (Chunk 23, 89% relevante)                     │
│     "La participación ciudadana requiere convocatoria..."       │
│     → Click para ver en documento                               │
│                                                                 │
│ [2] ANEXOS-Manual (Chunk 45, 84% relevante)                     │
│     "Información del proyecto debe incluir..."                  │
│     → Click para ver en documento                               │
│                                                                 │
│ 💰 Tokens: 2,487 (ahorro: 110,527 vs full-text)                │
│                                                                 │
│ ⭐ ¿Cómo estuvo esta respuesta?                                 │
│ [😞] [😐] [😊] [😄] [😍]  ← CSAT widget                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7️⃣ Admin - RAG Configuration Panel

**User Menu → "Configuración RAG"**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Configuración RAG del Sistema                                [X]│
│ Administrador • Configuración global de búsqueda vectorial          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [⚙️ Configuración] [📊 Estadísticas] [🔧 Mantenimiento]             │
│  ─────────────────                                                  │
│                                                                     │
│ Sistema RAG Global                                      [🟢 ON]     │
│ Activa/desactiva RAG para todos los usuarios                        │
│                                                                     │
│ 🔍 Configuración de Búsqueda                                        │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Chunks a Recuperar (Top K):        [5]                        │   │
│ │ Tamaño de Chunk:                   [500 tokens ▼]             │   │
│ │ Similaridad Mínima:                [0.5]                      │   │
│ │ Overlap entre Chunks:              [50]                       │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ⚡ Configuración de Rendimiento                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Tamaño de Batch:                   [5]                        │   │
│ │ Máx. Chunks por Documento:         [1000]                     │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ 💰 Control de Costos                                                │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Máx. Embeddings por Día:           [100000]                   │   │
│ │ Umbral de Alerta:                  [80000]                    │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                           [Cancelar]  [Guardar Configuración]      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8️⃣ Admin - Estadísticas Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Configuración RAG del Sistema                                [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [Configuración] [📊 Estadísticas] [Mantenimiento]                   │
│                  ─────────────────                                  │
│                                                                     │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐      │
│ │ 💾 Database  │ ✓ Sources    │ 🔍 Searches  │ 💰 Saved     │      │
│ │              │              │              │              │      │
│ │   15,234     │  187/234     │   12,456     │  $734.50     │      │
│ │ Total Chunks │ Con RAG (80%)│  Búsquedas   │  Este mes    │      │
│ └──────────────┴──────────────┴──────────────┴──────────────┘      │
│                                                                     │
│ Métricas de Rendimiento                                             │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Tiempo Búsqueda Promedio: 234ms           ✓ Excelente       │   │
│ │ Similaridad Promedio:     76.3%           ✓ Buena calidad   │   │
│ │ Tasa de Fallback:         5.2%            ✓ Óptimo          │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Ahorro de Tokens                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Total Ahorrado: 47,234,567 tokens                            │   │
│ │                                                              │   │
│ │ ████████████████████████████████████████████████████ 95%     │   │
│ │                                                              │   │
│ │ 💰 Ahorro Estimado:                                          │   │
│ │ • Flash Model: $3,543.45                                     │   │
│ │ • Pro Model:   $59,043.21                                    │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9️⃣ Extraction Preview Modal

**Después de upload, click en documento:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 👁️ Vista Previa de Extracción                                  [X]│
│ ANEXOS-Manual-EAE-IPT-MINVU.pdf                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ✅ Calidad de Extracción: 95%                                       │
│ Excelente extracción - Listo para usar                              │
│                                                                     │
│ 48,234 caracteres  •  45.2s  •  ✨ Flash                           │
│                                                                     │
│ [📄 Markdown] [📝 Texto Crudo] [🎨 ASCII Visual] [📊 Estructura]   │
│  ───────────                                                        │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN                        │    │
│ │                                                              │    │
│ │ Ministerio de Vivienda y Urbanismo                           │    │
│ │                                                              │    │
│ │ ## Tabla de Contenidos                                       │    │
│ │                                                              │    │
│ │ | Sección | Página | Descripción        |                   │    │
│ │ |---------|--------|---------------------|                   │    │
│ │ | 1.1     | 5      | Introducción        |                   │    │
│ │ | 1.2     | 12     | Marco Regulatorio   |                   │    │
│ │                                                              │    │
│ │ ## Gráfico de Participación                                  │    │
│ │                                                              │    │
│ │ **Descripción:** Evolución anual de participación 2020-2024  │    │
│ │                                                              │    │
│ │ **Visual ASCII:**                                            │    │
│ │ ```                                                          │    │
│ │  100% ┤                               ╭──╮                   │    │
│ │   75% ┤                       ╭──╮    │24│                   │    │
│ │   50% ┤           ╭──╮        │23│    │██│                   │    │
│ │   25% ┤   ╭──╮    │21│        │██│    │██│                   │    │
│ │    0% └───┴20┴────┴──┴────────┴──┴────┴──┴───                │    │
│ │ ```                                                          │    │
│ │                                                              │    │
│ │ ... (resto del documento)                                    │    │
│ └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ [🔄 Re-extraer con Pro]  [🔍 Habilitar RAG]  [✓ Aprobar y Usar]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔟 CSAT Rating Widget

**Después de cada respuesta del AI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Asistente:                                                   │
│ Los requisitos incluyen convocatoria pública, información...    │
└─────────────────────────────────────────────────────────────────┘

⭐ ¿Cómo estuvo esta respuesta?
[☆] [☆] [☆] [☆] [☆]  ← Estrellas clickables

─────────────────────────────────────────────

Cuando usuario da 4 o 5 estrellas:

⭐ ¿Cómo estuvo esta respuesta?
[★] [★] [★] [★] [☆]  4/5

✓ ¡Gracias por tu feedback!

─────────────────────────────────────────────

Cuando usuario da 1-3 estrellas (expandible):

⭐ ¿Cómo estuvo esta respuesta?
[★] [★] [★] [☆] [☆]  3/5  [🔽 Detallar]

Expandido:

┌─────────────────────────────────────────┐
│ Calificación Detallada                  │
│                                         │
│ 🎯 Precisión:     [★★★★★]              │
│ 📍 Relevancia:    [★★★☆☆]              │
│ ⚡ Velocidad:     [★★★★☆]              │
│ ✓ Completitud:    [★★★☆☆]              │
│                                         │
│ 💬 Comentario:                          │
│ ┌─────────────────────────────────────┐ │
│ │ Faltó mencionar el artículo 5.3... │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Enviar Calificación]                   │
└─────────────────────────────────────────┘
```

---

## 1️⃣1️⃣ Cost Breakdown Dashboard

**User Menu → Analytics → Cost Breakdown**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 💰 Análisis de Costos                                           [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Período: [7 días] [30 días ●] [Todo el tiempo]                     │
│                                                                     │
│ ┌──────────────┬──────────────┬──────────────┐                     │
│ │ 📈 Costo     │ 💰 Ahorrado  │ 📊 ROI       │                     │
│ │   Total      │   (RAG)      │   Promedio   │                     │
│ │              │              │              │                     │
│ │   $0.42      │   $58.23     │   126.3x     │                     │
│ └──────────────┴──────────────┴──────────────┘                     │
│                                                                     │
│ Breakdown por Documento:                                            │
│                                                                     │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Documento                    Queries  Costo   Ahorrado  ROI  │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ 📄 ANEXOS-Manual...              47  $0.21   $29.12   138x   │   │
│ │    Extracción: $0.036  •  Embeddings: $0.005                 │   │
│ │                                                              │   │
│ │ 📄 Budget-2025.pdf                34  $0.15   $19.87   132x   │   │
│ │    Extracción: $0.028  •  Embeddings: $0.004                 │   │
│ │                                                              │   │
│ │ 📄 SOC-2-eBook.pdf                12  $0.06    $9.24   154x   │   │
│ │    Extracción: $0.018  •  Embeddings: $0.002                 │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Total ahorrado: $58.23  •  Total gastado: $0.42                     │
│                                                          [Cerrar]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣2️⃣ Real-Time RAG Dashboard

**User Menu → Configuración RAG → Tab Estadísticas**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Monitor RAG en Tiempo Real                  🟢 Auto-refresh [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Últimos 5 Minutos:                                                  │
│                                                                     │
│ ┌──────────────┬──────────────┬──────────────┐                     │
│ │ 🔍 Queries   │ ⚡ Latencia  │ 💰 Ahorrado  │                     │
│ │              │   Promedio   │              │                     │
│ │      12      │    234ms     │   $0.71      │                     │
│ │ 11 con RAG   │ 76% simil.   │ 567K tokens  │                     │
│ └──────────────┴──────────────┴──────────────┘                     │
│                                                                     │
│ Activo Ahora:                                                       │
│ 🔵 3 queries en progreso                                            │
│                                                                     │
│ Salud del Sistema:                                                  │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ✅ Vertex AI API          Activo                             │   │
│ │ ✅ Firestore Chunks       15,234 chunks                       │   │
│ │ ✅ Latencia               234ms  (Excelente)                  │   │
│ │ ✅ Tasa de Error          0.2%   (Excelente)                  │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣3️⃣ Optimization Suggestions

**Agent Config → Tab Optimización**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 💡 Sugerencias de Optimización                                  [X]│
│ Basadas en análisis de CSAT y patrones de uso                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │ 🔴 CRÍTICA • Confianza: 94% • +0.6 CSAT                      │    │
│ │                                                              │    │
│ │ Problema:                                                     │    │
│ │ 35% de interacciones usan fallback a full-text porque        │    │
│ │ min_similarity=0.5 es muy estricto                           │    │
│ │                                                              │    │
│ │ Sugerencia:                                                   │    │
│ │ ┌────────────────────────────────────────────────────────┐   │    │
│ │ │ Cambiar min_similarity: 0.5 → 0.4                      │   │    │
│ │ │                                                        │   │    │
│ │ │ Impacto esperado:                                      │   │    │
│ │ │ • CSAT:      4.2 → 4.8 (+0.6) ⭐                        │   │    │
│ │ │ • Costo:     $0.006 → $0.007 (+17%)                    │   │    │
│ │ │ • Velocidad: 3.1s → 2.2s (más rápido)                  │   │    │
│ │ │ • Fallback:  35% → 5%                                  │   │    │
│ │ │                                                        │   │    │
│ │ │ Basado en: 18 casos similares (83% éxito)              │   │    │
│ │ └────────────────────────────────────────────────────────┘   │    │
│ │                                                              │    │
│ │ [✅ Aplicar Ahora] [🧪 Probar A/B] [❌ Rechazar]             │    │
│ └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │ 🟡 ALTA • Confianza: 78% • +0.3 CSAT                         │    │
│ │                                                              │    │
│ │ Sugerencia: Aumentar topK de 5 → 7                          │    │
│ │ Para queries de análisis de tendencias                        │    │
│ │                                                              │    │
│ │ [✅ Aplicar] [🧪 Probar] [❌ Rechazar]                       │    │
│ └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣4️⃣ Context Management - Upload Queue

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Context Management                                           [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Upload Queue (1)                                                    │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐    │
│ │ ⟳ DDU-ESP-019-07.pdf                        15.3s           │    │
│ │ ████████████████████░░░░░░░░░░░░░░░░░░░                      │    │
│ │ Extracting...                                          60%   │    │
│ │                                                              │    │
│ │ ✨ Flash  TEST2                                              │    │
│ └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ ───────────────────────────────────────────────────────────────    │
│                                                                     │
│ All Context Sources (8)                  [Select All] [Refresh]    │
│                                                                     │
│ ☐ 📄 CIR181.pdf                                                     │
│   Uploaded by: alec@getaifactory.com                                │
│   1 agent(s) using this                                             │
│   Testing                                                           │
│                                                                     │
│ ☐ 📄 Cir189.pdf                                                     │
│   ...                                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumen Visual

**Lo que está implementado y funcionará:**

1. ✅ **Panel de Contexto** - Toggle RAG/Full por documento + bulk
2. ✅ **Cálculo en tiempo real** - Tokens mixtos según selección
3. ✅ **Progress bar mejorado** - Con tiempo elapsed (15.3s)
4. ✅ **Extraction preview** - Con markdown y ASCII visuals
5. ✅ **Admin panels** - Configuration, Stats, Maintenance
6. ✅ **CSAT widget** - Rating después de respuestas
7. ✅ **Cost breakdown** - ROI por documento
8. ✅ **Real-time monitor** - Performance en vivo
9. ✅ **Optimization suggestions** - Auto-generated basado en CSAT

---

## 📋 Para Ver los Controles RAG

**Tu documento necesita RAG habilitado primero:**

1. Abre Console del browser (F12)
2. Pega script de `HABILITAR_RAG_DOCUMENTO_ACTUAL.md`
3. Ejecuta
4. Espera 30s
5. Refresh
6. ¡Verás todos los controles!

---

**¿Quieres que ejecute el script para habilitar RAG en tu documento ANEXOS?** 🚀
