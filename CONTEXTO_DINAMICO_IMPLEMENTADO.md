# ✅ Contexto Dinámico - Actualización en Tiempo Real

**Implementado:** Cálculo de contexto que refleja modo RAG por documento  
**Actualización:** Instantánea al cambiar modos

---

## 🎯 Lo Implementado

### 1. Cálculo Inteligente de Tokens

**Función mejorada:**
```typescript
calculateContextUsage() {
  // Por cada fuente activa:
  if (source.useRAGMode && source.ragEnabled) {
    tokens += ~2,500;  // RAG mode
  } else {
    tokens += fullDocumentTokens;  // Full-text
  }
  
  // Suma: system + history + context (mixto)
  return { total, ragSources, fullTextSources, savings };
}
```

**Se actualiza cuando:**
- Cambias modo bulk (Todos RAG / Todos Full)
- Cambias modo por documento (Full ↔ RAG)
- Activas/desactivas fuentes
- ¡Instantáneamente!

---

### 2. Desglose Detallado (NUEVO)

**En panel de contexto verás:**

```
📊 Desglose Detallado

System Prompt:                102 tokens
Historial (2 mensajes):        54 tokens
─────────────────────────────────────────
Contexto de Fuentes:  [1 RAG]  2,500 tokens
                                   ↑
                            Verde = RAG activo

💰 Ahorro vs Full-Text: -110,514 tokens (98%)
```

**Cuando cambias a Full-Text:**
```
📊 Desglose Detallado

System Prompt:                102 tokens
Historial (2 mensajes):        54 tokens
─────────────────────────────────────────
Contexto de Fuentes:  [1 Full]  113,014 tokens
                                    ↑
                             Azul = Full-Text

(Sin ahorro - usando documento completo)
```

---

## 🔄 Actualización Inmediata

### Ejemplo en Acción:

**Estado Inicial (RAG):**
```
Total Tokens: 2,656
Contexto:     2,500 (RAG)
Porcentaje:   0.3%  ← Verde
```

**Click "📝 Full-Text" en documento:**
```
Total Tokens: 113,170  ← Actualiza INMEDIATAMENTE
Contexto:     113,014 (Full)
Porcentaje:   11.3%  ← Amarillo
```

**Click "🔍 RAG" de vuelta:**
```
Total Tokens: 2,656  ← Vuelve a bajar
Contexto:     2,500 (RAG)
Porcentaje:   0.3%  ← Verde
```

**Sin hacer query - ves el impacto antes de preguntar** ✅

---

## 📊 Desglose Completo Mostrado

### Con RAG Activo:

```
Desglose del Contexto                    0.3% usado  ← Verde

Total Tokens:     2,656
Disponible:     997,344
Capacidad:       1000K

📊 Desglose Detallado:
• System Prompt:              102 tokens
• Historial (2 mensajes):      54 tokens
• Contexto de Fuentes: [1 RAG] 2,500 tokens

💰 Ahorro vs Full-Text: -110,514 tokens (98%)
```

---

### Con Full-Text Activo:

```
Desglose del Contexto                   11.3% usado  ← Amarillo

Total Tokens:   113,170
Disponible:     886,830
Capacidad:       1000K

📊 Desglose Detallado:
• System Prompt:                102 tokens
• Historial (2 mensajes):        54 tokens
• Contexto de Fuentes: [1 Full] 113,014 tokens

(Sin ahorro - documento completo usado)
```

---

### Con Modo Mixto (Múltiples Docs):

```
Desglose del Contexto                    1.5% usado  ← Verde

Total Tokens:    15,156
Disponible:     984,844
Capacidad:       1000K

📊 Desglose Detallado:
• System Prompt:                     102 tokens
• Historial (2 mensajes):             54 tokens
• Contexto: [1 RAG] [1 Full]       15,000 tokens
  ├─ Doc1 (RAG):    2,500 tokens
  └─ Doc2 (Full):  12,500 tokens

💰 Ahorro vs Full-Text: -110,000 tokens (88%)
```

---

## 🎯 Beneficio para Optimización

**Ahora puedes:**

1. **Experimentar antes de preguntar:**
   - Click Full → ve impacto (11.3%)
   - Click RAG → ve ahorro (0.3%)
   - Decide cuál usar

2. **Optimizar configuración:**
   - Ve qué combinación da mejor %
   - Balancea completitud vs eficiencia
   - Optimiza por tipo de query

3. **Analizar después:**
   - Logs muestran qué configuración se usó
   - CSAT correlaciona con modo usado
   - Aprende qué funciona mejor

---

## 🚀 Lo Que Verás al Refresh

**Header del panel:**
- % que refleja modo actual
- Verde si <5% (RAG)
- Amarillo si 5-50% (mixto)
- Rojo si >50% (full-text)

**Desglose detallado:**
- Badges: "1 RAG" o "1 Full"
- Tokens por componente
- Ahorro calculado
- Todo en tiempo real

---

**Refresh y cambia modos - verás % actualizarse instantáneamente!** 🎯✨

**El sistema ahora te muestra EXACTAMENTE qué usará antes de hacer la query!** ⚡

