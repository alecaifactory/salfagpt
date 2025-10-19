# ✅ Control RAG por Documento - FINAL

**Ubicación:** Panel "Desglose del Contexto" → Sección "Fuentes de Contexto"  
**Control:** Por documento individual + bulk actions  
**Cálculo:** Tokens mixtos en tiempo real

---

## 🎨 Lo Que Verás (Refresh Browser)

```
Desglose del Contexto                    11.3% usado

Total Tokens: 113,171
Disponible:   886,829
Capacidad:    1000K

─────────────────────────────────────────────────

Fuentes de Contexto    1 activas • ~2,657 tokens

RAG: [✓ Todos RAG] [✗ Todos Full-Text]  ← Bulk actions

┌──────────────────────────────────────────────┐
│ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf          │
│ 🌐 PUBLIC  ✓ Validado  🔍 100 chunks        │
│                                             │
│ Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok      │ ← Per doc
│                                             │
│ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN...    │
└──────────────────────────────────────────────┘
```

---

## 🔄 Funcionalidad

### Bulk Actions (Arriba)

**"✓ Todos RAG":**
- Activa RAG para TODOS los docs que lo tienen disponible
- Tokens bajan a ~2,500 por doc
- Cálculo actualiza automáticamente

**"✗ Todos Full-Text":**
- Desactiva RAG para TODOS
- Usa contexto completo
- Tokens suben al máximo

---

### Control Individual (Por Documento)

**Cada documento tiene:**

**Si tiene RAG habilitado:**
```
Modo: [📝 Full] [🔍 RAG ●]  ~2,500tok

Click Full  → ~113,015 tokens para este doc
Click RAG   → ~2,500 tokens para este doc
```

**Si NO tiene RAG:**
```
(Solo muestra el contenido, siempre full-text)
```

---

## 📊 Cálculo Inteligente

### Ejemplo con 3 Documentos

```
Doc 1: 10 páginas   (10K tokens)   RAG: No disponible
Doc 2: 50 páginas   (50K tokens)   RAG: Disponible
Doc 3: 100 páginas  (100K tokens)  RAG: Disponible

Configuración Usuario:
Doc 1: N/A (siempre full-text)     → 10,000 tokens
Doc 2: 🔍 RAG                       → 2,500 tokens
Doc 3: 📝 Full-Text                 → 100,000 tokens
─────────────────────────────────────────────────
Total mostrado:                      112,500 tokens

vs Todo Full-Text:                   160,000 tokens
Ahorro:                              47,500 tokens (30%)
```

**Header actualiza automáticamente:** "~112,500 tokens"

---

## 🎯 Casos de Uso

### Caso 1: Máxima Optimización

**Config:**
- Todos los docs con RAG: 🔍 RAG

**Resultado:**
- Doc1: ~2,500 tokens
- Doc2: ~2,500 tokens
- Doc3: ~2,500 tokens
- **Total: ~7,500 tokens**
- **Ahorro: 95%** ✨

**Cuándo:** Preguntas específicas, búsquedas

---

### Caso 2: Análisis Completo

**Config:**
- Todos: 📝 Full-Text

**Resultado:**
- Doc1: 10,000 tokens
- Doc2: 50,000 tokens
- Doc3: 100,000 tokens
- **Total: 160,000 tokens**
- **Sin ahorro (contexto completo)**

**Cuándo:** Resúmenes, análisis exhaustivos

---

### Caso 3: Híbrido Inteligente

**Config:**
- Doc pequeño: 📝 Full (quiero todo)
- Docs grandes: 🔍 RAG (optimizar)

**Resultado:**
- Doc1 (10 pág): 10,000 tokens (full)
- Doc2 (50 pág): 2,500 tokens (RAG)
- Doc3 (100 pág): 2,500 tokens (RAG)
- **Total: 15,000 tokens**
- **Ahorro: 91%**

**Cuándo:** Balance perfecto entre completitud y eficiencia

---

## ✅ Implementado

**UI:**
- ✅ Bulk actions: "Todos RAG" / "Todos Full-Text"
- ✅ Toggle per document: [📝 Full] [🔍 RAG]
- ✅ Token estimate por modo
- ✅ Badge 🔍 si tiene RAG

**Lógica:**
- ✅ Cálculo mixto de tokens
- ✅ State por documento (useRAGMode)
- ✅ Actualización en tiempo real
- ✅ Tokens en header reflejan combinación

---

## 🚀 Próximo Paso

**Refresh browser** (Ctrl+R)

**Verás:**
1. Sección "Fuentes de Contexto"
2. Botones: "✓ Todos RAG" / "✗ Todos Full-Text"
3. Por cada doc: Toggle individual
4. Tokens actualizándose según selección

**Prueba:**
- Click "✓ Todos RAG" → tokens bajan a ~2,500
- Click "✗ Todos Full-Text" → tokens suben a ~113,015
- Toggle individual → tokens ajustan por doc

---

**¡Control granular completo!** 🎯✨

**Refresh y verás el sistema funcionando!** 🚀

