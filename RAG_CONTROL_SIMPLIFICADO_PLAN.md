# 🎯 Control RAG Simplificado - Un Solo Lugar

**Ubicación:** Panel de Contexto (debajo del chatbot)  
**Nivel:** Por agente (cada agente decide si usa RAG o no)

---

## 🎨 Diseño Propuesto

### Ubicación: Justo Arriba de "Fuentes de Contexto"

```
┌─────────────────────────────────────────────────────────────┐
│ Fuentes de Contexto                              1 activas  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚙️ Modo de Búsqueda para Este Agente                        │
│                                                             │
│ ┌─────────────────────┬─────────────────────┐              │
│ │ 📝 Documento        │ 🔍 RAG (Optimizado) │              │
│ │    Completo         │    Búsqueda         │              │
│ ├─────────────────────┼─────────────────────┤              │
│ │ • Todo el contexto  │ • Solo relevante    │              │
│ │ • 113,015 tokens    │ • ~2,500 tokens     │              │
│ │ • Completo          │ • 95% ahorro ✨     │              │
│ │ • Más lento         │ • 2x más rápido     │              │
│ │                     │                     │              │
│ │    [Seleccionar]    │    [● Activo]       │              │
│ └─────────────────────┴─────────────────────┘              │
│                                                             │
│ 💡 Ahorro estimado: ~110,515 tokens por query               │
│    Costo: $0.065 → $0.003 (95% más barato)                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf          [🟢 Activo]    │
│ PDF  ✨Flash  🔍RAG                                         │
│ # ANEXO 1 ESTRATEGIA DE PARTICIPACIÓN...                    │
│                                                             │
│ 📄 SOC 2 eBook.pdf                          [⚪ Inactivo]  │
│ PDF  ✨Pro  🌐PUBLIC                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Comportamiento

### Cuando RAG está ACTIVO (default)

**Lo que pasa:**
```
Usuario pregunta: "¿Qué dice sobre X?"
     ↓
Sistema:
1. Busca en chunks del documento (vector search)
2. Encuentra top 5 más relevantes
3. Envía solo esos 5 chunks (~2.5K tokens)
4. Respuesta rápida y precisa

Ahorro mostrado en tiempo real:
• Tokens usados: 2,487
• vs Full-Text: 113,015  
• Ahorro: 110,528 tokens (98%)
• Costo: $0.003 vs $0.141
```

### Cuando FULL-TEXT está ACTIVO

**Lo que pasa:**
```
Usuario pregunta: "¿Qué dice sobre X?"
     ↓
Sistema:
1. Envía documento completo
2. Todo el contexto disponible (113K tokens)
3. Respuesta exhaustiva

Sin ahorro:
• Tokens usados: 113,015
• Modo completo (0% ahorro)
• Costo: $0.141
```

---

## 📊 Vista Previa Interactiva

### Panel de Control RAG (NUEVO)

```
Modo de Búsqueda: Este Agente
┌───────────────────────────────────────────────────────┐
│                                                       │
│ Documentos activos: 1                                 │
│ Total contexto disponible: 113,015 tokens             │
│                                                       │
│ Modo actual: 🔍 RAG (Búsqueda Optimizada)            │
│                                                       │
│ ┌──────────────────────────────────────────────────┐  │
│ │                                                  │  │
│ │  Ahorro con RAG:                                 │  │
│ │                                                  │  │
│ │  ████████████████████████████████████░░░░ 98%    │  │
│ │                                                  │  │
│ │  Tokens por query:                               │  │
│ │  • Con RAG:      2,487 tokens    ✅              │  │
│ │  • Sin RAG:    113,015 tokens                    │  │
│ │  • Ahorras:    110,528 tokens                    │  │
│ │                                                  │  │
│ │  Costo por query:                                │  │
│ │  • Con RAG:      $0.003          ✅              │  │
│ │  • Sin RAG:      $0.141                          │  │
│ │  • Ahorras:      $0.138 (98%)                    │  │
│ │                                                  │  │
│ │  Velocidad estimada:                             │  │
│ │  • Con RAG:      ~1.8s           ⚡              │  │
│ │  • Sin RAG:      ~4.2s                           │  │
│ │                                                  │  │
│ └──────────────────────────────────────────────────┘  │
│                                                       │
│ [Cambiar a Full-Text]                                 │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 🎯 Implementación

**Ubicación exacta:**
- En `ChatInterfaceWorking.tsx`
- Sección del sidebar izquierdo
- Justo ARRIBA de `<ContextManager>`
- Debajo de "Fuentes de Contexto" header

**Componente nuevo:**
```tsx
<RAGModeControl
  agentId={currentConversation}
  sources={contextSources.filter(s => s.enabled)}
  currentMode={agentRAGMode}
  onModeChange={(mode) => setAgentRAGMode(mode)}
  showSavings={true}
/>
```

**Estado a agregar:**
```typescript
const [agentRAGMode, setAgentRAGMode] = useState<'full-text' | 'rag'>('rag');
```

**Cálculo de ahorro en tiempo real:**
```typescript
const totalTokensFullText = contextSources
  .filter(s => s.enabled)
  .reduce((sum, s) => sum + Math.floor((s.extractedData?.length || 0) / 4), 0);

const totalTokensRAG = contextSources
  .filter(s => s.enabled && s.ragEnabled)
  .reduce((sum, s) => sum + ((s.ragMetadata?.totalChunks || 0) * 25), 0);

const savings = totalTokensFullText - totalTokensRAG;
const savingsPercent = (savings / totalTokensFullText) * 100;
```

---

## 🎨 Mockup Visual Mejorado

```
Fuentes de Contexto    [+ Agregar]    1 activas
─────────────────────────────────────────────────

⚙️ Búsqueda para Este Agente

Modo Actual: 🔍 RAG Optimizado

┌────────────────────────────────────────────┐
│ 💰 Ahorro por Query:                       │
│                                            │
│ 113,015 tok ████████████░░ 2,487 tok      │
│ (Full-Text)     98% ahorro    (RAG)       │
│                                            │
│ $0.141      →      $0.003                  │
│                                            │
│ [🔍 RAG Activo]  [📝 Cambiar a Full-Text] │
└────────────────────────────────────────────┘

─────────────────────────────────────────────────

📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf  [🟢 ON]
   PDF  ✨Flash  🔍RAG  
   # ANEXO 1 ESTRATEGIA DE...
   
📄 SOC 2 eBook.pdf                  [⚪ OFF]
   PDF  ✨Pro  🌐PUBLIC
```

**Beneficios:**
- ✅ Un solo lugar para configurar
- ✅ Ahorro visible en tiempo real
- ✅ Simple (RAG ON/OFF)
- ✅ Efecto inmediato
- ✅ Por agente (cada uno puede ser diferente)

---

**¿Implemento este diseño simplificado ahora?** 

Crearía:
1. `RAGModeControl.tsx` component
2. Integration en ChatInterfaceWorking
3. Cálculo de ahorro en tiempo real
4. Estado persistente por agente

**~45 minutos** 🚀

