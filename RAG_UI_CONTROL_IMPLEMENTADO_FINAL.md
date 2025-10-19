# ✅ Control RAG en UI - IMPLEMENTADO

**Ubicación:** Sidebar izquierdo, arriba de Fuentes de Contexto  
**Visibilidad:** Siempre visible cuando hay documentos activos

---

## 🎯 Lo Que Se Ve Ahora

### En Tu Sidebar (Refresh browser)

```
Fuentes de Contexto    [+ Agregar]    1 activas
─────────────────────────────────────────────────

⚙️ Modo de Búsqueda

┌────────────────────────────────────────────┐
│ Modo Actual: 🔍 RAG Optimizado             │
│                                            │
│ [📝 Documento Completo]  [🔍 RAG Optim.●] │
│   113,015 tokens          ~2,500 tokens   │
│                                            │
│ 💰 Ahorro Estimado por Query:              │
│ • Tokens: -110,515 (98%)                   │
│ • Costo:  -$0.138 (98%)                    │
│ • Velocidad: -2.4s (57% faster)            │
└────────────────────────────────────────────┘

─────────────────────────────────────────────────

📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf  [🟢 ON]
   PDF  ✨Flash  🔍RAG
```

---

## 🔄 Comportamiento

### Click en "📝 Documento Completo"

**Inmediatamente:**
- Modo cambia a Full-Text
- Panel muestra: "113,015 tokens" (todo)
- Sin ahorro mostrado
- Siguiente query enviará documento completo

**Uso:** Cuando necesitas TODO el contexto

---

### Click en "🔍 RAG Optimizado"

**Inmediatamente:**
- Modo cambia a RAG
- Panel muestra ahorro: "98% ahorro"
- Verde con stats
- Siguiente query usará búsqueda vectorial

**Uso:** Queries específicas (default)

---

## 📊 Ahorro en Tiempo Real

**El panel calcula y muestra:**

```typescript
// Ejemplo con tu documento actual:
Full-Text: 113,015 tokens
RAG:        ~2,500 tokens (5 chunks × 500 tokens)
─────────────────────────
Ahorro:    110,515 tokens (98%)

Cost Full: $0.141 (Pro) o $0.008 (Flash)
Cost RAG:  $0.003
─────────────────────────
Ahorro:    $0.138 o $0.005

Speed Full: ~4.2s
Speed RAG:  ~1.8s
─────────────────────────
Ahorro:     2.4s (57% faster)
```

**Todo visible antes de hacer la query** ✅

---

## 🎯 Estado Persistente

**Por agente:**
```typescript
// Se guarda en localStorage:
localStorage.setItem('rag_mode_agent_ABC', 'rag');

// Al cambiar de agente, se carga su preferencia
// Agente A: puede usar RAG
// Agente B: puede usar Full-Text
// Cada uno independiente
```

---

## ✅ Para Ver Funcionando

**1. Refresh browser** (Ctrl+R)

**2. Verás el nuevo panel** arriba de fuentes

**3. Toggle entre modos** y ve el cálculo de ahorro

**4. Haz query** y verifica que usa el modo seleccionado

---

## 🚀 Siguiente Paso

**Para que RAG realmente funcione:**

Necesitas habilitar RAG para tu documento:

```bash
# Opción A: Via browser console (más simple)
# Abre console (F12) y pega:

const response = await fetch('/api/context-sources/TU_SOURCE_ID/enable-rag', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'TU_USER_ID',
    chunkSize: 500
  })
});
const data = await response.json();
console.log(data);
```

**O puedo crear un botón "Enable RAG" que se muestra en el panel cuando detecta que el documento no tiene RAG aún**

---

**¿Refresh el browser y me dices si ves el panel de control RAG?** 🎨

