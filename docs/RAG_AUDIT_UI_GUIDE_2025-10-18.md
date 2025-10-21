# 🎨 Guía Visual de Auditoría RAG

**Fecha:** 18 de Octubre, 2025  
**Para:** Usuario Final

---

## 🎯 Qué Verás en la Interfaz

### 1. Tabla de Logs con Modo RAG

**Ubicación:** Context Panel → Log de Contexto por Interacción

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 📊 Log de Contexto por Interacción         3 interacciones registradas         │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ Hora  │ Pregunta      │ Modelo│ Modo     │ Input │ Output│ Total │ Disp. │Uso%│
│───────┼───────────────┼───────┼──────────┼───────┼───────┼───────┼───────┼────│
│ 14:23 │ ¿Cuál es...   │ Flash │ 🔍 RAG   │ 2,656 │  543  │ 3,199 │ 996K  │0.3%│
│       │               │       │  verde   │       │       │       │       │    │
│───────┼───────────────┼───────┼──────────┼───────┼───────┼───────┼───────┼────│
│ 14:25 │ Resume todo   │ Flash │ ⚠️ Full  │113,170│  987  │114,157│ 885K  │11.4│
│       │               │       │ amarillo │       │       │       │       │    │
│───────┼───────────────┼───────┼──────────┼───────┼───────┼───────┼───────┼────│
│ 14:27 │ Explica más   │ Flash │ 📝 Full  │113,245│  654  │113,899│ 886K  │11.4│
│       │               │       │  azul    │       │       │       │       │    │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Interpretación:**

**Fila 1 (Verde):**
- ✅ **RAG usado exitosamente**
- ✅ Solo 2,656 tokens totales (incluye 1,500 de RAG chunks)
- ✅ Hover muestra: "RAG usado: 3 chunks, 87% similaridad"

**Fila 2 (Amarillo):**
- ⚠️ **RAG intentado pero cayó a Full-Text**
- ⚠️ 113,170 tokens totales (documento completo)
- ⚠️ Hover muestra: "RAG intentado pero sin resultados, cayó a Full-Text"

**Fila 3 (Azul):**
- 📝 **Full-Text directo** (RAG deshabilitado)
- 📝 113,245 tokens totales (documento completo)
- 📝 Hover muestra: "Full-Text (RAG deshabilitado)"

---

### 2. Detalles Expandibles

**Click en:** "Ver detalles completos de cada interacción"

```
┌─────────────────────────────────────────────────────────────────┐
│ #1 - 14:23:45                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Pregunta: ¿Cuál es el artículo 5.3.2?                          │
│ Modelo: gemini-2.5-flash                                        │
│ System Prompt: Eres un asistente útil...                       │
│                                                                 │
│ Fuentes activas:                                                │
│ • 🔍 ANEXOS-Manual-EAE-IPT-MINVU.pdf (1,500 tokens)            │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🔍 Configuración RAG:                                     │  │
│ │                                                           │  │
│ │ Habilitado: Sí                                            │  │
│ │ Realmente usado: Sí ✓                                     │  │
│ │ Chunks usados: 3                                          │  │
│ │ Tokens RAG: 1,500                                         │  │
│ │ Similaridad promedio: 87.3%                               │  │
│ │ TopK: 5                                                   │  │
│ │ Min Similaridad: 0.5                                      │  │
│ │                                                           │  │
│ │ Por documento:                                            │  │
│ │ • ANEXOS-Manual-EAE-IPT-MINVU.pdf: 3 chunks, 1,500 tokens │  │
│ │   - Chunk 45: Artículo 5.3.2... (92% similar)            │  │
│ │   - Chunk 46: Disposiciones... (88% similar)              │  │
│ │   - Chunk 47: Excepciones... (85% similar)                │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Respuesta: El artículo 5.3.2 establece que...                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Ejemplo con Fallback

```
┌─────────────────────────────────────────────────────────────────┐
│ #2 - 14:25:12                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Pregunta: Resume todo el contenido del manual                  │
│                                                                 │
│ Fuentes activas:                                                │
│ • 📝 ANEXOS-Manual-EAE-IPT-MINVU.pdf (113,014 tokens)          │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🔍 Configuración RAG:                                     │  │
│ │                                                           │  │
│ │ Habilitado: Sí                                            │  │
│ │ Realmente usado: No (fallback)                            │  │
│ │                                                           │  │
│ │ ⚠️ Fallback: RAG no encontró chunks relevantes,          │  │
│ │    usó documentos completos                               │  │
│ │                                                           │  │
│ │ Configuración intentada:                                  │  │
│ │ TopK: 5                                                   │  │
│ │ Min Similaridad: 0.5                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Respuesta: El manual completo contiene...                      │
└─────────────────────────────────────────────────────────────────┘
```

**Interpretación:**
- ⚠️ RAG intentó buscar chunks
- ⚠️ Ningún chunk tuvo >50% similaridad
- ⚠️ Sistema cayó a Full-Text automáticamente
- ⚠️ Usuario sabe exactamente qué pasó

---

## 🔍 Cómo Interpretar los Badges

### 🔍 RAG (Verde) - Éxito Total

**Significado:**
- ✅ RAG habilitado
- ✅ RAG ejecutado
- ✅ Chunks relevantes encontrados
- ✅ Solo chunks enviados a AI

**Cuándo verlo:**
- Preguntas específicas ("¿Qué dice artículo X?")
- Búsquedas puntuales
- Keywords claros

**Beneficios:**
- 💰 Ahorro masivo de tokens (95-98%)
- ⚡ Respuestas más rápidas
- 🎯 Contexto ultra-relevante

### ⚠️ Full (Amarillo) - Fallback

**Significado:**
- ✅ RAG habilitado
- ⚠️ RAG intentado
- ❌ Sin chunks relevantes
- 📝 Cayó a Full-Text

**Cuándo verlo:**
- Preguntas genéricas ("Resume todo")
- Query sin keywords del documento
- Umbral de similaridad muy alto

**Qué hacer:**
- 🔧 Bajar `minSimilarity` (de 0.5 a 0.3)
- 🔧 Aumentar `topK` (de 5 a 10)
- 🔧 Reformular pregunta con keywords

### 📝 Full (Azul) - Directo

**Significado:**
- ❌ RAG deshabilitado
- 📝 Full-Text por elección
- 📝 Documento completo enviado

**Cuándo verlo:**
- Usuario desactivó RAG (switch "Full-Text")
- Documentos pequeños (<10 pág)
- Necesidad de contexto completo

**Cuándo usar:**
- 📖 Análisis exhaustivo
- 📋 Resúmenes completos
- 🔬 Búsqueda en todo el documento

---

## 📊 Gráfico de Decisión

```
┌─────────────────────────────────────────────────────────┐
│ ¿Qué modo usar?                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Pregunta específica?                                   │
│  (artículo X, sección Y, ¿qué dice sobre Z?)            │
│         ↓                                               │
│    ✅ RAG                                               │
│    Ahorro: 95-98%                                       │
│    Tokens: ~2,500                                       │
│                                                         │
│  Pregunta genérica?                                     │
│  (resume, explica todo, qué contiene)                   │
│         ↓                                               │
│    📝 Full-Text                                         │
│    Contexto completo                                    │
│    Tokens: ~113,000                                     │
│                                                         │
│  Análisis comparativo?                                  │
│  (compara sección A con B)                              │
│         ↓                                               │
│    🔍 RAG primero                                       │
│    Si no funciona → Full                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Tips de Uso

### Optimizar Configuración RAG

**Si ves muchos fallbacks (⚠️):**

1. **Baja minSimilarity:**
   ```
   De: 0.5 → A: 0.3
   ```
   Más chunks recuperados, menos fallbacks

2. **Sube topK:**
   ```
   De: 5 → A: 10
   ```
   Más opciones de chunks

3. **Re-indexa documento:**
   - Settings → Re-extraer
   - Chunks mejor divididos

### Interpretar Tokens

**Tokens Input totales:**
```
2,656 tokens =
  102 (system prompt) +
  54 (historial) +
  2,500 (RAG context) +
  0 (mensaje usuario)
```

**Si RAG:**
```
Context: 2,500 tokens = 3 chunks × ~500 tokens/chunk
Ahorro: 113,014 - 2,500 = 110,514 tokens (98%)
```

**Si Full-Text:**
```
Context: 113,014 tokens = Documento completo
Ahorro: 0 (necesario para query genérica)
```

---

## 📈 Métricas de Efectividad

### RAG Funcionando Bien

**Indicadores:**
- ✅ >80% de queries usan RAG (verde)
- ✅ <20% fallbacks (amarillo)
- ✅ Similaridad promedio >70%
- ✅ Ahorro promedio >90%

**Ejemplo:**
```
10 interacciones:
- 8 con 🔍 RAG (80%)
- 2 con ⚠️ Full (20%)
Promedio tokens: 5,000 vs 113,000 (96% ahorro)
```

### RAG Necesita Ajuste

**Indicadores:**
- ⚠️ <50% queries usan RAG
- ⚠️ >50% fallbacks
- ⚠️ Similaridad promedio <50%
- ⚠️ Ahorro <50%

**Ejemplo:**
```
10 interacciones:
- 3 con 🔍 RAG (30%)
- 7 con ⚠️ Full (70%)
Promedio tokens: 80,000 (bajo ahorro)

Acción: Ajustar minSimilarity de 0.5 a 0.3
```

---

## 🧪 Testing Paso a Paso

### Test Completo de Auditoría

**Paso 1: Preparación**
```bash
1. Abre http://localhost:3000/chat
2. Selecciona un agente
3. Asegura que tenga 1 documento con RAG habilitado
```

**Paso 2: RAG Exitoso**
```bash
1. Pregunta específica: "¿Qué dice el artículo 5.3.2?"
2. Envía mensaje
3. Espera respuesta
4. Abre Context Panel
5. Verifica en tabla:
   - Modo: 🔍 RAG (verde)
   - Tokens: ~2,500
```

**Paso 3: Verificar Detalles**
```bash
1. Click "Ver detalles completos"
2. Busca sección "🔍 Configuración RAG:"
3. Verifica:
   - Habilitado: Sí
   - Usado: Sí ✓
   - Chunks: 3
   - Similaridad: 87.3%
   - Desglose por documento
```

**Paso 4: Test Fallback**
```bash
1. Pregunta genérica: "Resume todo el contenido"
2. Envía mensaje
3. Verifica:
   - Modo: ⚠️ Full (amarillo)
   - Tokens: ~113,000
   - Detalles: "RAG intentado pero sin resultados"
```

**Paso 5: Test Full-Text**
```bash
1. Cambia a modo Full-Text (switch en fuentes)
2. Pregunta: "Explica en detalle"
3. Verifica:
   - Modo: 📝 Full (azul)
   - Tokens: ~113,000
   - Sin sección RAG (porque disabled)
```

---

## 📊 Dashboard de Auditoría (Futuro)

### Métricas Sugeridas

**Panel: Efectividad RAG**

```
┌─────────────────────────────────────────────┐
│ Últimas 30 días                             │
├─────────────────────────────────────────────┤
│                                             │
│ Total Interacciones:        156             │
│                                             │
│ RAG Exitoso (🔍):          124 (79%)        │
│ RAG Fallback (⚠️):          18 (12%)        │
│ Full-Text (📝):             14 (9%)         │
│                                             │
│ Ahorro Promedio:           94.2%            │
│ Similaridad Promedio:      85.7%            │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Gráfico de barras:                      │ │
│ │ █████████████████████ RAG (79%)         │ │
│ │ ████ Fallback (12%)                     │ │
│ │ ██ Full (9%)                            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Top Documentos:                             │
│ 1. Manual EAE: 87% RAG success             │
│ 2. CV Tomás: 95% RAG success               │
│ 3. Contrato: 62% RAG success ⚠️            │
│    Sugerencia: Re-indexar con chunks más   │
│    pequeños                                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Optimización de Configuración

**Situación:**
- Documento: Manual técnico de 200 páginas
- Problema: 60% fallbacks (⚠️)
- Configuración actual: topK=5, minSimilarity=0.5

**Análisis de logs:**
```
Últimas 10 queries:
- 4 con RAG (40%)
- 6 con Fallback (60%)

Similaridades cuando funciona:
- 52%, 54%, 51%, 53%

Problema: Umbral 0.5 muy alto (justo en el límite)
```

**Solución:**
```
1. Bajar minSimilarity a 0.4
2. Re-testear con 10 queries
3. Verificar en logs nueva tasa de éxito

Resultado esperado:
- 80% con RAG
- 20% con Fallback
```

### Caso 2: Detección de Documento Mal Indexado

**Situación:**
- Documento: CV de candidato
- Problema: 100% fallbacks (⚠️)
- Configuración: topK=5, minSimilarity=0.5

**Análisis de logs:**
```
Todas las queries caen a fallback:
- "¿Experiencia laboral?"  → ⚠️ Full
- "¿Educación?"            → ⚠️ Full
- "¿Habilidades?"          → ⚠️ Full

Logs backend:
⚠️ No chunks found - documents may not be indexed for RAG
```

**Problema:** Documento no tiene chunks indexados

**Solución:**
```
1. Settings del documento
2. Re-extraer con RAG habilitado
3. Verificar "🔍 100 chunks" aparece
4. Re-testear queries

Resultado esperado:
- 90% con RAG ✅
```

### Caso 3: Validación de Ahorro

**Situación:**
- Cliente paga por tokens
- Necesita verificar ahorro RAG

**Logs muestran:**
```
Mes anterior (Full-Text):
- Total tokens input: 11,301,500
- Costo: $847.61 USD

Mes actual (RAG):
- Total tokens input: 250,000
- Costo: $18.75 USD

Ahorro verificado: $828.86 USD (97.8%)
```

**Verificación en UI:**
```
# Por cada log:
- Full-Text: 113,015 tokens
- RAG: 2,500 tokens
- Ahorro por query: 110,515 tokens (97.8%)

# 100 queries/mes:
- Full: 11.3M tokens
- RAG: 250K tokens
- Ahorro: 11M tokens (97.8%)
```

---

## 📱 Responsive & Accesibilidad

### Mobile View

```
┌────────────────────────┐
│ Log de Contexto        │
├────────────────────────┤
│ 14:23 │ 🔍 RAG │ 2.6K │
│ 14:25 │ ⚠️ Full│113K  │
│ 14:27 │ 📝 Full│113K  │
│                        │
│ [Ver Detalles]         │
└────────────────────────┘
```

**Optimizaciones:**
- Columnas condensadas
- Scroll horizontal si necesario
- Tooltips funcionan en touch

### Accesibilidad

**Screen readers:**
- Modo RAG: "Retrieval Augmented Generation usado, 3 chunks, 87% similaridad"
- Modo Full: "Contexto completo usado, RAG deshabilitado"
- Fallback: "Alerta: RAG intentado sin éxito, usó contexto completo"

---

## ✅ Checklist de Usuario

Para verificar que auditoría RAG funciona:

### Visual
- [ ] Columna "Modo" visible en tabla
- [ ] Badges con colores correctos (verde/amarillo/azul)
- [ ] Tooltips informativos al hover
- [ ] Detalles expandibles funcionan

### Funcional
- [ ] Modo RAG muestra ~2,500 tokens
- [ ] Modo Full muestra ~113,000 tokens
- [ ] Fallback detectado y mostrado
- [ ] Configuración visible en detalles

### Datos
- [ ] Tokens coinciden con modo usado
- [ ] Desglose por documento presente
- [ ] Similaridad mostrada si RAG
- [ ] TopK y minSimilarity visibles

---

## 🚀 Conclusión

**Ahora tienes:**

✅ **Visibilidad Total:**
- Ves qué modo se usó en cada interacción
- Entiendes por qué se usó ese modo
- Verificas tokens son correctos

✅ **Control Total:**
- Ajustas configuración basado en datos reales
- Optimizas para tu caso de uso
- Reduces costos efectivamente

✅ **Confianza Total:**
- Auditoría completa de cada query
- Tokens verificables
- Sin sorpresas en facturación

---

**Para Soporte:**

Si tienes dudas:
1. Revisa este documento
2. Verifica logs de consola (backend)
3. Compara con ejemplos aquí
4. Contacta soporte con screenshot de log

---

**Documentación Relacionada:**
- `RAG_AUDIT_TRAIL_2025-10-18.md` - Detalles técnicos completos
- `RAG_TOKENS_VERIFICATION_IMPROVEMENTS_2025-10-18.md` - Cambios implementados
- `CONTROL_RAG_GRANULAR_COMPLETO.md` - Control RAG por documento

---

**Última Actualización:** 2025-10-18  
**Versión:** 1.0  
**Estado:** ✅ Producción









