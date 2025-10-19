# 🎛️ Plan de Integración: Toggle RAG en UI

**Objetivo:** Control total de RAG desde UI en 2 lugares clave

---

## 📍 Lugares para Toggle RAG

### 1. Configuración del Agente ⭐ (Por Agente)

**Ubicación:** AgentConfigurationModal o User Settings por agente

**Toggle:**
```
🔍 Búsqueda Vectorial (RAG)          [🟢 ON]

Cuando activado:
• Busca solo fragmentos relevantes
• 95% menos tokens
• Respuestas 2x más rápidas

Cuando desactivado:
• Usa documento completo
• Máximo contexto
• Sin búsqueda vectorial
```

**Comportamiento:**
- Por defecto: ON (optimizado)
- Usuario puede toggle OFF para usar full-text
- Se guarda en agent_config
- Aplica a todas las queries de ese agente

---

### 2. Panel de Contexto ⭐ (Por Documento)

**Ubicación:** En cada fuente de contexto en sidebar

**Toggle por documento:**
```
📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf

[Toggle ON/OFF]  ← Habilitar/deshabilitar

Cuando ON:
✅ Activo en conversación
🔍 Modo: RAG (si chunks disponibles)
   Tokens: ~2,500

Cuando OFF:
❌ No se usa en queries
```

**NUEVO - Modo RAG por documento:**
```
📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf  [Toggle ON]

🔍 Modo de Contexto:
   ○ Full-Text (todo el documento - 113K tokens)
   ● RAG (solo fragmentos relevantes - ~2.5K tokens)

[⚙️ Settings]
```

---

## 🎯 Implementación Sugerida

### Opción A: Toggle Simple en Source Card

**Modificar:** `ContextManager.tsx` o donde se muestran las sources

**Agregar:**
```tsx
{/* RAG Mode Toggle */}
{source.ragEnabled && (
  <div className="mt-2 flex items-center justify-between text-xs">
    <span className="text-slate-600">Modo:</span>
    <div className="flex gap-1">
      <button
        onClick={() => setSourceRAGMode(source.id, 'full-text')}
        className={`px-2 py-1 rounded ${
          source.ragMode === 'full-text'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        Full-Text
      </button>
      <button
        onClick={() => setSourceRAGMode(source.id, 'rag')}
        className={`px-2 py-1 rounded ${
          source.ragMode === 'rag'
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        🔍 RAG
      </button>
    </div>
  </div>
)}

{!source.ragEnabled && (
  <button
    onClick={() => enableRAGForSource(source.id)}
    className="mt-2 w-full px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
  >
    🔍 Habilitar RAG para este documento
  </button>
)}
```

---

### Opción B: En Agent Configuration

**Agregar nueva sección en AgentConfigurationModal:**

```tsx
{/* RAG Configuration */}
<div className="space-y-3">
  <h3 className="font-semibold text-slate-700">
    🔍 Búsqueda Vectorial (RAG)
  </h3>
  
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
    <div>
      <p className="text-sm font-medium">Habilitar RAG</p>
      <p className="text-xs text-slate-600">
        Buscar fragmentos relevantes en vez de enviar documento completo
      </p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={config.ragEnabled !== false}
        onChange={(e) => setConfig({...config, ragEnabled: e.target.checked})}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-slate-200 peer-checked:bg-green-600 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
    </label>
  </div>
  
  {config.ragEnabled !== false && (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <label className="text-slate-600">Top K Chunks</label>
        <select 
          value={config.ragTopK || 5}
          onChange={(e) => setConfig({...config, ragTopK: parseInt(e.target.value)})}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="3">3 (Preciso)</option>
          <option value="5">5 (Balanceado)</option>
          <option value="7">7 (Completo)</option>
          <option value="10">10 (Amplio)</option>
        </select>
      </div>
      
      <div>
        <label className="text-slate-600">Similaridad Mín.</label>
        <select
          value={config.ragMinSimilarity || 0.5}
          onChange={(e) => setConfig({...config, ragMinSimilarity: parseFloat(e.target.value)})}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="0.3">30% (Permisivo)</option>
          <option value="0.5">50% (Balanceado)</option>
          <option value="0.7">70% (Estricto)</option>
        </select>
      </div>
    </div>
  )}
</div>
```

---

## 🎯 Control Granular Perfecto

### Nivel 1: Global (Usuario)
```
Settings → RAG Enabled: ON/OFF
Aplica a todos los agentes por default
```

### Nivel 2: Por Agente (Agente específico)
```
Agent Config → RAG Settings:
• Enabled: ON/OFF
• TopK: 5
• Min Similarity: 0.5

Sobrescribe global para este agente
```

### Nivel 3: Por Documento (Documento específico)
```
Source Card → Modo:
○ Full-Text (113K tokens)
● RAG (2.5K tokens)

Control fino por documento en este agente
```

---

## 🔄 Flujo de Decisión

```
User hace query
     │
     ▼
¿RAG enabled en Agent Config?
     │
   ┌─┴─┐
  NO  YES
   │   │
   │   ▼
   │ ¿Document tiene chunks?
   │   │
   │ ┌─┴─┐
   │ NO YES
   │  │  │
   │  │  ▼
   │  │ ¿Document mode = RAG?
   │  │  │
   │  │┌─┴─┐
   │  │NO YES
   │  ││  │
   └──┴┴──┤
         │
         ▼
      ¿Usar?
    ┌────┴────┐
Full-Text   RAG
    │        │
    ▼        ▼
  113K     2.5K
  tokens   tokens
```

---

## 📝 Interfaz Propuesta

```typescript
// En AgentConfiguration
interface AgentConfiguration {
  // ... existing fields
  
  // RAG Settings
  ragEnabled?: boolean;          // Enable RAG for this agent
  ragTopK?: number;             // Chunks to retrieve (default: 5)
  ragMinSimilarity?: number;    // Min similarity (default: 0.5)
  ragFallbackToFullText?: boolean; // Auto-fallback (default: true)
}

// En ContextSource (per-document control)
interface ContextSource {
  // ... existing fields
  
  // Per-agent RAG mode
  ragMode?: {
    [agentId: string]: 'rag' | 'full-text';
  };
}
```

---

## 🎨 UI Mockup

### En Sidebar de Contexto:

```
Fuentes de Contexto           1 activa

┌─────────────────────────────────────┐
│ 📄 ANEXOS-Manual-EAE-IPT-MINVU.pdf │
│                                     │
│ [🟢 Enabled]  ✓ RAG: 100 chunks    │
│                                     │
│ Modo para este agente:              │
│ ┌─────────────┬─────────────┐       │
│ │ 📝 Full     │ 🔍 RAG      │       │
│ │  113K tok   │  2.5K tok ● │       │
│ │             │  (Activo)   │       │
│ └─────────────┴─────────────┘       │
│                                     │
│ Extracto: GOBIERNO DE CHILE...      │
│                                     │
│ [⚙️ Settings]                       │
└─────────────────────────────────────┘
```

**Benefit:** Control por documento Y por agente

---

**¿Implemento esto ahora?** 

Agregaría:
1. Toggle RAG en AgentConfigurationModal
2. Selector Full-Text vs RAG en source cards
3. Persistencia en Firestore
4. UI indicators

**~1 hora de implementación**

**¿Procedo?** 🚀

