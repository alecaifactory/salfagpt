# 🎯 Sistema Completo de Optimización basado en CSAT

**Fecha:** 18 de Octubre, 2025  
**Visión:** Sistema auto-optimizable mediante feedback de usuarios

---

## 🌟 Arquitectura Completa - Ciclo de Mejora Continua

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CICLO DE OPTIMIZACIÓN CONTINUA                        │
└─────────────────────────────────────────────────────────────────────────┘

1. INTERACCIÓN
   Usuario pregunta → Agente responde
      ↓
2. TRACKING COMPLETO
   Captura TODO: contexto, RAG, config, costos
      ↓
3. FEEDBACK (CSAT)
   Usuario califica: 😞 😐 😊 😄 😍 (1-5 estrellas)
      ↓
4. ANÁLISIS
   Correlación: CSAT vs configuración RAG
      ↓
5. EVALS (Evaluaciones Automáticas)
   Sistema detecta patrones de bajo/alto CSAT
      ↓
6. SUGERENCIAS
   "Aumentar topK de 5 a 7 puede mejorar CSAT en 15%"
      ↓
7. DECISIÓN DEL USUARIO
   ¿Aplicar sugerencia? → Sí/No/Probar
      ↓
8. A/B TESTING
   Probar nueva config con subset de usuarios
      ↓
9. VALIDACIÓN
   ¿Mejoró CSAT? → Sí: Aplicar a todos | No: Revertir
      ↓
10. ITERACIÓN
    Sistema aprende y mejora continuamente
```

---

## 📊 Modelo de Datos Completo

### 1. Interacción con Tracking Completo

```typescript
// Collection: agent_interactions (NEW)

interface AgentInteraction {
  id: string;
  timestamp: Date;
  
  // Participantes
  conversationId: string;           // Cual agente
  userId: string;                   // Cual usuario
  userRole: 'usuario' | 'experto' | 'admin' | 'evaluador_contexto' | 'evaluador_agente';
  
  // Query
  userMessage: string;
  aiResponse: string;
  responseTime: number;             // ms
  
  // Configuración del Agente
  agentConfig: {
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    systemPrompt: string;
    temperature: number;
    version: string;                // "v1.2.3" para tracking de versiones
  };
  
  // Contexto Utilizado
  contextUsage: {
    sourcesActive: Array<{
      sourceId: string;
      sourceName: string;
      mode: 'full-text' | 'rag';    // Como se usó
      
      // Si full-text:
      tokensUsed?: number;           // Todo el documento
      
      // Si RAG:
      ragDetails?: {
        chunksRetrieved: number;
        chunkIndices: number[];      // Cuales chunks: [23, 45, 67]
        similarities: number[];       // Relevancia: [0.89, 0.84, 0.79]
        tokensUsed: number;           // Solo chunks relevantes
        tokensSaved: number;          // vs full-text
        searchTime: number;           // ms
        ragConfig: {
          topK: number;               // 5
          chunkSize: number;          // 500
          overlap: number;            // 50
          minSimilarity: number;      // 0.5
          embeddingModel: string;     // "text-embedding-004"
        };
      };
    }>;
    
    totalContextTokens: number;
    contextCost: number;              // $ for context
  };
  
  // Tokens y Costos
  tokenStats: {
    inputTokens: number;              // System + history + context + query
    outputTokens: number;             // Response
    total: number;
    breakdown: {
      systemPrompt: number;
      conversationHistory: number;
      contextFromSources: number;
      userQuery: number;
      aiResponse: number;
    };
    cost: {
      input: number;                  // $
      output: number;                 // $
      total: number;                  // $
    };
  };
  
  // CSAT (Feedback del Usuario)
  csat: {
    score: 1 | 2 | 3 | 4 | 5 | null; // null = no evaluado aún
    ratedAt?: Date;
    comment?: string;
    categories?: {
      accuracy: 1 | 2 | 3 | 4 | 5;   // Precisión de la respuesta
      relevance: 1 | 2 | 3 | 4 | 5;  // Relevancia del contexto
      speed: 1 | 2 | 3 | 4 | 5;      // Velocidad de respuesta
      completeness: 1 | 2 | 3 | 4 | 5; // Completitud
    };
  };
  
  // Metadata para análisis
  metadata: {
    wasRAGUsed: boolean;
    ragHitRate: number;               // % de sources que usaron RAG
    avgChunkRelevance: number;        // Avg similarity
    hadFallback: boolean;             // RAG failed → full-text
    qualityScore: number;             // Auto-calculated
  };
}
```

---

### 2. Análisis de Calidad por Configuración

```typescript
// Collection: rag_config_performance (NEW)

interface RAGConfigPerformance {
  id: string;
  
  // Configuración evaluada
  config: {
    topK: number;
    chunkSize: number;
    overlap: number;
    minSimilarity: number;
    model: string;
  };
  
  // Métricas de rendimiento
  metrics: {
    totalInteractions: number;
    avgCSAT: number;                  // Promedio CSAT con esta config
    csatDistribution: {
      score1: number;                 // Cuantas interacciones con CSAT 1
      score2: number;
      score3: number;
      score4: number;
      score5: number;
    };
    avgRelevance: number;             // Avg chunk similarity
    avgTokensSaved: number;           // Avg tokens ahorrados
    avgResponseTime: number;          // Avg response time
    avgCost: number;                  // Avg cost per interaction
  };
  
  // Correlaciones descubiertas
  insights: Array<{
    finding: string;
    confidence: number;               // 0-1
    suggestion: string;
    expectedImprovement: number;      // % CSAT improvement
  }>;
  
  // Comparación con otras configs
  comparison: {
    betterThan: string[];             // IDs de configs peores
    worseThan: string[];              // IDs de configs mejores
    rank: number;                     // Ranking general
  };
}
```

---

### 3. Sugerencias de Mejora (Sistema de Evals)

```typescript
// Collection: agent_improvement_suggestions (NEW)

interface AgentImprovementSuggestion {
  id: string;
  createdAt: Date;
  
  // Agente objetivo
  conversationId: string;
  agentName: string;
  currentVersion: string;           // "v1.0.0"
  
  // Análisis que generó la sugerencia
  analysis: {
    interactionsAnalyzed: number;   // 100 últimas interacciones
    avgCSAT: number;                // 3.2/5 (subóptimo)
    lowCSATRate: number;            // 35% con CSAT ≤3
    
    // Patrones detectados
    patterns: Array<{
      pattern: string;              // "RAG retrieves irrelevant chunks"
      occurrences: number;          // 23 veces
      avgCSATWhenOccurs: number;    // 2.1/5 (muy bajo!)
      impact: 'high' | 'medium' | 'low';
    }>;
  };
  
  // Sugerencias específicas
  suggestions: Array<{
    type: 'rag_config' | 'system_prompt' | 'model' | 'context_sources';
    priority: 'critical' | 'high' | 'medium' | 'low';
    
    current: any;                   // Config actual
    proposed: any;                  // Config propuesta
    
    reasoning: string;
    expectedImpact: {
      csatImprovement: number;      // +0.8 points
      costChange: number;           // +$0.05 per query (aceptable)
      speedChange: number;          // -0.3s (más rápido)
    };
    
    confidence: number;             // 0-1 (0.87 = 87% confianza)
    basedOnData: {
      similarCases: number;         // 12 casos similares
      successRate: number;          // 83% de éxito en esos casos
    };
  }>;
  
  // Estado de la sugerencia
  status: 'pending' | 'testing' | 'approved' | 'rejected' | 'implemented';
  userDecision?: {
    decision: 'apply' | 'test' | 'reject';
    decidedBy: string;
    decidedAt: Date;
    notes?: string;
  };
  
  // Si se está probando (A/B test)
  abTest?: {
    startedAt: Date;
    configA: any;                   // Config original
    configB: any;                   // Config propuesta
    samplingRate: number;           // 0.2 = 20% de queries
    results: {
      interactionsA: number;
      interactionsB: number;
      csatA: number;
      csatB: number;
      winner: 'A' | 'B' | 'inconclusive';
      confidence: number;
    };
  };
}
```

---

## 🎨 UI Completa - Sección de Contexto del Agente

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🤖 Configuración del Agente: Sales Analyst                         [X] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ [⚙️ Config] [💬 Interacciones] [📊 Analytics] [🎯 Optimización]        │
│             ───────────────                                             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Historial de Interacciones (234 total)              CSAT: 4.2/5 ⭐⭐⭐⭐│
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ #234 • hace 5 minutos • Usuario: alec@getaifactory.com   😄 4/5  │  │
│ │                                                                   │  │
│ │ 👤 P: "¿Cuáles fueron las ventas de Q4?"                          │  │
│ │                                                                   │  │
│ │ 🤖 R: "Las ventas de Q4 fueron $175K, representando..."          │  │
│ │                                                                   │  │
│ │ ┌─────────────────────────────────────────────────────────────┐  │  │
│ │ │ 🔍 Contexto Utilizado:                                      │  │  │
│ │ │                                                             │  │  │
│ │ │ Modo: RAG Search ✨                                         │  │  │
│ │ │                                                             │  │  │
│ │ │ 📄 Sales_Report_Q4.pdf                                      │  │  │
│ │ │ ├─ Chunk 23 (89% relevante, 487 tokens)                    │  │  │
│ │ │ │  "Q4 sales reached $175K..."                             │  │  │
│ │ │ │  [Ver en documento] [Ver chunk completo]                 │  │  │
│ │ │ │                                                           │  │  │
│ │ │ ├─ Chunk 45 (84% relevante, 502 tokens)                    │  │  │
│ │ │ │  "ASCII Chart: Q4 bar shows..."                          │  │  │
│ │ │ │  [Ver en documento]                                      │  │  │
│ │ │ │                                                           │  │  │
│ │ │ ├─ Chunk 67 (79% relevante, 495 tokens)                    │  │  │
│ │ │ │  "Revenue breakdown table..."                            │  │  │
│ │ │ │  [Ver en documento]                                      │  │  │
│ │ │ │                                                           │  │  │
│ │ │ ├─ Chunk 12 (71% relevante, 478 tokens)                    │  │  │
│ │ │ └─ Chunk 89 (68% relevante, 512 tokens)                    │  │  │
│ │ │                                                             │  │  │
│ │ │ Total chunks: 5 de 100 disponibles (5%)                    │  │  │
│ │ │ Total tokens: 2,474                                        │  │  │
│ │ │ vs Full-text: 50,000 tokens                                │  │  │
│ │ │ Ahorro: 95.1%                                              │  │  │
│ │ │                                                             │  │  │
│ │ │ Config RAG usada:                                           │  │  │
│ │ │ • TopK: 5                                                   │  │  │
│ │ │ • Chunk size: 500 tokens                                    │  │  │
│ │ │ • Overlap: 50 tokens                                        │  │  │
│ │ │ • Min similarity: 0.5                                       │  │  │
│ │ │ • Embedding model: text-embedding-004                       │  │  │
│ │ └─────────────────────────────────────────────────────────────┘  │  │
│ │                                                                   │  │
│ │ ┌─────────────────────────────────────────────────────────────┐  │  │
│ │ │ 💰 Costos de esta Interacción:                              │  │  │
│ │ │                                                             │  │  │
│ │ │ Input:                                                      │  │  │
│ │ │ ├─ System prompt: 102 tokens ($0.00001)                    │  │  │
│ │ │ ├─ History: 600 tokens ($0.00008)                          │  │  │
│ │ │ ├─ Context (RAG): 2,474 tokens ($0.00309)                  │  │  │
│ │ │ └─ User query: 12 tokens ($0.00000)                        │  │  │
│ │ │ Total input: 3,188 tokens ($0.00318)                       │  │  │
│ │ │                                                             │  │  │
│ │ │ Output:                                                     │  │  │
│ │ │ └─ AI response: 523 tokens ($0.00261)                      │  │  │
│ │ │                                                             │  │  │
│ │ │ Total: $0.00579                                             │  │  │
│ │ │                                                             │  │  │
│ │ │ vs sin RAG: $0.0625 (50K tokens context)                   │  │  │
│ │ │ Ahorro: $0.05671 (91%)                                      │  │  │
│ │ └─────────────────────────────────────────────────────────────┘  │  │
│ │                                                                   │  │
│ │ ┌─────────────────────────────────────────────────────────────┐  │  │
│ │ │ 😄 CSAT de Usuario: 4/5                                     │  │  │
│ │ │                                                             │  │  │
│ │ │ Categorías:                                                 │  │  │
│ │ │ • Precisión:      ⭐⭐⭐⭐⭐ 5/5                               │  │  │
│ │ │ • Relevancia:     ⭐⭐⭐⭐☆ 4/5                               │  │  │
│ │ │ • Velocidad:      ⭐⭐⭐⭐☆ 4/5                               │  │  │
│ │ │ • Completitud:    ⭐⭐⭐⭐☆ 4/5                               │  │  │
│ │ │                                                             │  │  │
│ │ │ Comentario: "Respuesta rápida y precisa, pero podría       │  │  │
│ │ │             incluir más contexto sobre tendencias"          │  │  │
│ │ └─────────────────────────────────────────────────────────────┘  │  │
│ │                                                                   │  │
│ │ [📋 Ver Detalles Completos] [🔄 Regenerar Respuesta]             │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ #233 • hace 10 minutos • Experto: expert@demo.com      😐 3/5    │  │
│ │                                                                   │  │
│ │ 👤 P: "¿Análisis de márgenes de ganancia?"                        │  │
│ │                                                                   │  │
│ │ 🤖 R: "Los márgenes promediaron 44%..."                          │  │
│ │                                                                   │  │
│ │ 🔍 Contexto: Full-Text (RAG no encontró chunks relevantes)       │  │
│ │ 📄 Sales_Report_Q4.pdf - 50,000 tokens (completo)                │  │
│ │                                                                   │  │
│ │ 💰 Costo: $0.0625                                                 │  │
│ │                                                                   │  │
│ │ 😐 CSAT: 3/5                                                      │  │
│ │ Comentario: "Respuesta correcta pero lenta. Mucho contexto        │  │
│ │             innecesario enviado."                                 │  │
│ │                                                                   │  │
│ │ ⚠️ Sistema detectó: Baja relevancia → Fallback innecesario       │  │
│ │ 💡 Sugerencia: Bajar min_similarity de 0.5 a 0.4                 │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│ ... (232 interacciones más)                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│ Tab: "Optimización" (NUEVO)                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 🎯 Sistema de Optimización Automática                                  │
│                                                                         │
│ Última análisis: hace 5 minutos                                         │
│ Interacciones analizadas: 234                                           │
│ CSAT promedio: 4.2/5 ⭐⭐⭐⭐☆                                            │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 💡 Sugerencias de Mejora (3 pendientes)                             │ │
│ │                                                                     │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐│ │
│ │ │ 🔴 CRÍTICA • Confianza: 94% • Impacto estimado: +0.6 CSAT      ││ │
│ │ │                                                                 ││ │
│ │ │ Problema detectado:                                             ││ │
│ │ │ 12 interacciones (35% de CSAT bajo) usaron fallback a full-text││ │
│ │ │ porque min_similarity=0.5 era demasiado estricto               ││ │
│ │ │                                                                 ││ │
│ │ │ Patrón:                                                         ││ │
│ │ │ • Queries complejas → No chunks >50% similarity                ││ │
│ │ │ • Sistema usa 50K tokens (full-text)                           ││ │
│ │ │ • Respuesta lenta (4.2s)                                       ││ │
│ │ │ → Usuario frustra → CSAT 2-3/5                                 ││ │
│ │ │                                                                 ││ │
│ │ │ Sugerencia:                                                     ││ │
│ │ │ ┌───────────────────────────────────────────────────────────┐  ││ │
│ │ │ │ Cambiar: min_similarity de 0.5 → 0.4                      │  ││ │
│ │ │ │                                                           │  ││ │
│ │ │ │ Razón:                                                    │  ││ │
│ │ │ │ • Permitir chunks con 40-50% relevancia                   │  ││ │
│ │ │ │ • Aún relevantes, más permisivo                           │  ││ │
│ │ │ │ • Reduce fallbacks de 35% a 5%                            │  ││ │
│ │ │ │                                                           │  ││ │
│ │ │ │ Impacto esperado:                                         │  ││ │
│ │ │ │ • CSAT: 4.2 → 4.8 (+0.6)                                  │  ││ │
│ │ │ │ • Costo: $0.006 → $0.007 (+17% aceptable)                 │  ││ │
│ │ │ │ • Velocidad: 3.1s → 2.2s (más rápido)                     │  ││ │
│ │ │ │ • Fallback rate: 35% → 5%                                 │  ││ │
│ │ │ │                                                           │  ││ │
│ │ │ │ Basado en: 18 casos similares (83% éxito)                 │  ││ │
│ │ │ └───────────────────────────────────────────────────────────┘  ││ │
│ │ │                                                                 ││ │
│ │ │ Decisión:                                                       ││ │
│ │ │ [✅ Aplicar Ahora] [🧪 Probar (A/B test)] [❌ Rechazar]        ││ │
│ │ └─────────────────────────────────────────────────────────────────┘│ │
│ │                                                                     │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐│ │
│ │ │ 🟡 ALTA • Confianza: 78% • Impacto estimado: +0.3 CSAT         ││ │
│ │ │                                                                 ││ │
│ │ │ Problema: Queries sobre tendencias tienen CSAT 3.5/5            ││ │
│ │ │                                                                 ││ │
│ │ │ Sugerencia: Aumentar topK de 5 → 7                             ││ │
│ │ │ • Más contexto para análisis complejos                          ││ │
│ │ │ • +$0.002 costo, +0.3s tiempo                                   ││ │
│ │ │ • CSAT esperado: 3.5 → 3.8                                      ││ │
│ │ │                                                                 ││ │
│ │ │ [✅ Aplicar] [🧪 Probar] [❌ Rechazar]                         ││ │
│ │ └─────────────────────────────────────────────────────────────────┘│ │
│ │                                                                     │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐│ │
│ │ │ 🟢 BAJA • Confianza: 65% • Impacto estimado: +0.1 CSAT         ││ │
│ │ │                                                                 ││ │
│ │ │ Sugerencia: Agregar documento "Budget_2025.pdf" a contexto      ││ │
│ │ │ • 8 queries mencionaron presupuesto                             ││ │
│ │ │ • CSAT fue 3/5 (sin contexto relevante)                         ││ │
│ │ │ • Mejora esperada con documento: 3.0 → 3.8                      ││ │
│ │ │                                                                 ││ │
│ │ │ [➕ Agregar Documento] [❌ Ignorar]                             ││ │
│ │ └─────────────────────────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                         │
│ Analytics Tab:                                                          │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Análisis de Calidad por Configuración                           │ │
│ │                                                                     │ │
│ │ CSAT por Modo de Contexto:                                          │ │
│ │                                                                     │ │
│ │   5.0 ┤                                                              │ │
│ │   4.5 ┤         ╭────────────────────────────────  RAG (4.6/5)     │ │
│ │   4.0 ┤  ╭──────┤                                                   │ │
│ │   3.5 ┤──┤      │                                                   │ │
│ │   3.0 ┤  │      ╰────────────  Full-Text (3.2/5)                    │ │
│ │   2.5 └──┴──────┴───────────────────────────────────                │ │
│ │       Oct Oct   Oct                                                 │ │
│ │       10  15    18 (RAG habilitado)                                 │ │
│ │                                                                     │ │
│ │ Correlación Config RAG ↔ CSAT:                                      │ │
│ │                                                                     │ │
│ │ TopK vs CSAT:                                                        │ │
│ │ • TopK=3:  CSAT 3.8 (contexto insuficiente)                         │ │
│ │ • TopK=5:  CSAT 4.6 ✅ ÓPTIMO                                       │ │
│ │ • TopK=7:  CSAT 4.5 (contexto excesivo, más lento)                  │ │
│ │ • TopK=10: CSAT 4.2 (demasiado lento)                               │ │
│ │                                                                     │ │
│ │ Chunk Size vs CSAT:                                                  │ │
│ │ • 250 tokens:  CSAT 4.0 (muy fragmentado)                           │ │
│ │ • 500 tokens:  CSAT 4.6 ✅ ÓPTIMO                                   │ │
│ │ • 750 tokens:  CSAT 4.4 (chunks muy grandes)                        │ │
│ │ • 1000 tokens: CSAT 4.1 (pierde precisión)                          │ │
│ │                                                                     │ │
│ │ Min Similarity vs CSAT:                                              │ │
│ │ • 0.3: CSAT 3.9 (chunks poco relevantes incluidos)                  │ │
│ │ • 0.4: CSAT 4.5 ✅ MEJOR                                            │ │
│ │ • 0.5: CSAT 4.2 (actual - muchos fallbacks)                         │ │
│ │ • 0.6: CSAT 3.8 (muy estricto, pocos resultados)                    │ │
│ │                                                                     │ │
│ │ 💡 Configuración Óptima Detectada:                                  │ │
│ │ ┌───────────────────────────────────────────────────────────────┐  │ │
│ │ │ • TopK: 5 (actual) ✓                                          │  │ │
│ │ │ • Chunk size: 500 (actual) ✓                                  │  │ │
│ │ │ • Min similarity: 0.4 (propuesta) ← Cambiar de 0.5            │  │ │
│ │ │ • Overlap: 50 (actual) ✓                                      │  │ │
│ │ │                                                               │  │ │
│ │ │ CSAT esperado: 4.2 → 4.8 (+0.6)                               │  │ │
│ │ │ Confianza: 94%                                                │  │ │
│ │ │                                                               │  │ │
│ │ │ [🚀 Aplicar Configuración Óptima]                             │  │ │
│ │ └───────────────────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo Completo de Optimización

```
┌───────────────────────────────────────────────────────────────────────┐
│                    OPTIMIZACIÓN BASADA EN CSAT                         │
└───────────────────────────────────────────────────────────────────────┘

Semana 1: Recopilación de Datos
├─ 234 interacciones con este agente
├─ Usuarios califican cada respuesta (CSAT)
├─ Sistema registra TODO: contexto, RAG, costos
└─ Base de datos completa para análisis

Semana 2: Análisis Automático
├─ Sistema correlaciona CSAT con configuraciones
├─ Detecta: min_similarity=0.5 causa fallbacks
├─ Fallbacks → CSAT bajo (3/5)
├─ RAG exitoso → CSAT alto (4-5/5)
└─ Genera sugerencia: Bajar a 0.4

Semana 3: A/B Testing
├─ 80% queries: Config actual (min_similarity=0.5)
├─ 20% queries: Config propuesta (min_similarity=0.4)
├─ Tracking paralelo de CSAT
└─ Después de 50 queries con cada config:
   ├─ Config A (0.5): CSAT 4.2, Fallback 35%
   └─ Config B (0.4): CSAT 4.8, Fallback 5% ← GANADOR

Semana 4: Aplicación
├─ Config B gana con 94% confianza
├─ Admin aprueba cambio
├─ Sistema aplica min_similarity=0.4 a todos
└─ Nuevo baseline: CSAT 4.8/5

Semana 5: Monitoreo
├─ CSAT se mantiene en 4.8/5 ✓
├─ Fallback rate bajó a 5% ✓
├─ Usuarios más satisfechos ✓
└─ Sistema busca siguiente optimización

Iteración continua para mantener y mejorar CSAT
```

---

## 📋 Interfaces de API Necesarias

### 1. Registrar Interacción con Tracking Completo

**POST /api/agent-interactions**

```typescript
{
  conversationId: string,
  userId: string,
  userRole: string,
  userMessage: string,
  aiResponse: string,
  agentConfig: { model, systemPrompt, version },
  contextUsage: {
    sources: [{
      sourceId, mode, ragDetails?, tokens, cost
    }]
  },
  tokenStats: { input, output, breakdown, cost }
}

Response: { interactionId: string }
```

---

### 2. Registrar CSAT

**POST /api/agent-interactions/:id/csat**

```typescript
{
  score: 1 | 2 | 3 | 4 | 5,
  categories: {
    accuracy: number,
    relevance: number,
    speed: number,
    completeness: number
  },
  comment?: string
}

Response: { success: true }
```

---

### 3. Obtener Análisis de Optimización

**GET /api/agents/:id/optimization-analysis**

```typescript
Response: {
  currentCSAT: number,
  interactionsAnalyzed: number,
  suggestions: [{
    type, priority, current, proposed,
    expectedImpact, confidence, reasoning
  }],
  configPerformance: [{
    config, avgCSAT, metrics
  }]
}
```

---

### 4. Aplicar Sugerencia

**POST /api/agents/:id/apply-suggestion**

```typescript
{
  suggestionId: string,
  mode: 'apply' | 'test' | 'reject',
  abTestConfig?: {
    samplingRate: 0.2,  // 20% of queries
    duration: 7  // days
  }
}

Response: {
  success: true,
  newConfig: { ... },
  abTestId?: string
}
```

---

## 🎯 ¿Qué Más Agregar?

**Tu visión es COMPLETA.** Lo que describiste cubre:

✅ **Trazabilidad completa** (quien, qué, cuándo, cómo)  
✅ **Análisis de calidad** (CSAT por configuración)  
✅ **Optimización automática** (sugerencias basadas en datos)  
✅ **Control del usuario** (aprobar/rechazar cambios)  
✅ **Iteración continua** (mejora constante)

**Mis sugerencias adicionales:**

1. ✅ **Versionado de agentes** (v1.0, v1.1, v2.0)
2. ✅ **Rollback automático** (si CSAT baja, volver a versión anterior)
3. ✅ **Benchmarking** (comparar agentes entre sí)
4. ✅ **Alertas proactivas** (CSAT <3.5 → notificar admin)
5. ✅ **Exportar reportes** (PDF con análisis completo)

---

## 🚀 Plan de Implementación

**Quieres que implemente esto ahora?**

**Fase 1 (2-3 horas):**
1. Enhanced Gemini extraction (ASCII visuals)
2. Extraction preview modal
3. Enable RAG endpoint
4. Interaction tracking con CSAT

**Fase 2 (2-3 horas):**
5. Traceability dashboard
6. Query attribution en chat
7. Optimization analysis
8. Suggestion system

**Fase 3 (2-3 horas):**
9. A/B testing framework
10. Auto-optimization
11. Reporting dashboard

**Total: ~8 horas para sistema completo de clase mundial**

---

**¿Empiezo con Fase 1 ahora?** 🚀✨
