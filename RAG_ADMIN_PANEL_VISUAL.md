# 🎨 RAG Admin Panel - Visual Guide

**For:** Administrators (`alec@getaifactory.com`)  
**Access:** User Menu → "Configuración RAG"

---

## 📍 How to Access

```
Step 1: Click your name (bottom-left)
┌────────────────────────────────────┐
│ [Avatar] Alec                      │
│          alec@getaifactory.com     │
│                                    │
│ [Gestión de Usuarios]              │
│ ────────────────────────           │
│ [Configuración RAG] ← NEW!         │
│ ────────────────────────           │
│ [Gestión de Proveedores]           │
│ [Gestión de Dominios]              │
│ ────────────────────────           │
│ [Configuración]                    │
│ [Cerrar Sesión]                    │
└────────────────────────────────────┘

Step 2: Click "Configuración RAG"
```

---

## 🎛️ Admin Panel - Full View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Configuración RAG del Sistema                                       [X]│
│  Administrador • Configuración global de búsqueda vectorial                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [⚙️ Configuración] │ [📊 Estadísticas] │ [🔧 Mantenimiento]               │
│   ─────────────────                                                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Sistema RAG Global                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Activa/desactiva RAG para todos los usuarios del sistema   [🟢 ON] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  🔍 Configuración de Búsqueda                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Chunks a Recuperar (Top K)    Tamaño de Chunk (tokens)            │   │
│  │  [5]                            ┌──────────────────┐               │   │
│  │  Valor por defecto: 5-7         │ ○  250 (Pequeño) │               │   │
│  │  (balanceado)                   │ ●  500 (Balanced)│               │   │
│  │                                 │ ○  750 (Grande)  │               │   │
│  │  Similaridad Mínima             │ ○ 1000 (Muy gde)│               │   │
│  │  [0.5]                          └──────────────────┘               │   │
│  │  0.5 = 50% similar o más                                           │   │
│  │                                                                     │   │
│  │  Overlap entre Chunks (tokens)                                     │   │
│  │  [50]                                                               │   │
│  │  Contexto compartido entre chunks                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ⚡ Configuración de Rendimiento                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Tamaño de Batch                Máx. Chunks por Documento          │   │
│  │  [5]                             [1000]                             │   │
│  │  Embeddings por lote             Límite de seguridad                │   │
│  │  (5 recomendado)                                                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  💰 Control de Costos                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Máx. Embeddings por Día         Umbral de Alerta                  │   │
│  │  [100000]                        [80000]                            │   │
│  │  Límite diario de generación     Alerta al alcanzar este límite    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ✓ Configuración de Calidad                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Fallback Automático                                      [🟢 ON]  │   │
│  │  Usar documentos completos si RAG no encuentra resultados          │   │
│  │                                                                     │   │
│  │  Umbral para Fallback                                              │   │
│  │  [0.3]                                                              │   │
│  │  Si mejor resultado < 0.3, usar documento completo                 │   │
│  │                                                                     │   │
│  │  Búsqueda Híbrida (Experimental)                          [OFF]    │   │
│  │  Combinar búsqueda vectorial con búsqueda por palabras clave       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [🔄 Actualizar]                              [Cancelar] [Guardar Config]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Statistics Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Configuración RAG del Sistema                                       [X]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Configuración] │ [📊 Estadísticas] │ [Mantenimiento]                      │
│                     ──────────────────                                      │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Resumen General                                                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐             │
│  │  💾 Database │ ✓ Sources    │ 🔍 Searches  │ 💰 Saved     │             │
│  │              │              │              │              │             │
│  │   15,234     │  187/234     │   12,456     │  $734.50     │             │
│  │  Total Chunks│ Con RAG (80%)│  Búsquedas   │  Este mes    │             │
│  └──────────────┴──────────────┴──────────────┴──────────────┘             │
│                                                                             │
│  Métricas de Rendimiento                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Tiempo Búsqueda Promedio          Similaridad Promedio            │   │
│  │  234ms                              76.3%                           │   │
│  │  ✓ Excelente                        ✓ Buena calidad                │   │
│  │                                                                     │   │
│  │  Tasa de Fallback                                                  │   │
│  │  5.2%                                                               │   │
│  │  ✓ Óptimo (< 10%)                                                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Ahorro de Tokens                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Total Ahorrado: 47,234,567 tokens                                 │   │
│  │                                                                     │   │
│  │  ████████████████████████████████████████████████████████ 95%      │   │
│  │                                                                     │   │
│  │  95% de reducción promedio                                         │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ 💰 Ahorro Estimado                                           │  │   │
│  │  │                                                              │  │   │
│  │  │  Flash Model: $3,543.45       Pro Model: $59,043.21          │  │   │
│  │  │  (basado en tokens ahorrados)                                │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [🔄 Actualizar Estadísticas]                                    [Cerrar]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Maintenance Tab

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Configuración RAG del Sistema                                       [X]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Configuración] │ [Estadísticas] │ [🔧 Mantenimiento]                      │
│                                      ──────────────────                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Estado del Sistema                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ✅ Vertex AI API          Activo                                   │   │
│  │     Embedding generation service                                   │   │
│  │                                                                     │   │
│  │  ✅ Firestore Chunks       15,234 chunks                            │   │
│  │     document_chunks collection                                     │   │
│  │                                                                     │   │
│  │  ✓  Tasa de Fallback       5.2%                                    │   │
│  │     Búsquedas que usan documento completo                          │   │
│  │                                                                     │   │
│  │  ✓  Latencia de búsqueda   234ms                                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Operaciones en Lote                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🔄 Re-indexar Todos los Documentos                    [47 pend.]  │   │
│  │  Regenera embeddings para todos los documentos sin RAG              │   │
│  │                                                      [Re-indexar]   │   │
│  │                                                                     │   │
│  │  ──────────────────────────────────────────────────────────────    │   │
│  │                                                                     │   │
│  │  💾 Limpiar Caché                                                   │   │
│  │  Elimina chunks de documentos eliminados                            │   │
│  │                                                      [Limpiar]      │   │
│  │                                                                     │   │
│  │  ──────────────────────────────────────────────────────────────    │   │
│  │                                                                     │   │
│  │  ⚙️ Optimizar Índices                                               │   │
│  │  Reorganiza chunks para mejor rendimiento                           │   │
│  │                                                      [Optimizar]    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Health Checks                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ✅ Vertex AI API disponible                                        │   │
│  │  ✅ Firestore indexes configurados                                  │   │
│  │  ✅ Service account con permisos                                    │   │
│  │  ✅ Latencia de búsqueda: 234ms                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [🔄 Actualizar]                                  [Cancelar] [Guardar]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Configuration Options Explained

### Tab 1: Configuración

#### Sistema RAG Global
**Toggle:** ON/OFF  
**Purpose:** Master switch for entire RAG system  
**Impact:** Disabling stops all RAG operations system-wide

---

#### Configuración de Búsqueda

**Top K (Chunks a Recuperar)**
- **Range:** 1-50
- **Default:** 5
- **Recommended:** 5-7 (balanceado)

| Value | Use Case | Token Usage |
|-------|----------|-------------|
| 3-5 | Specific questions | ~1,500-2,500 tokens |
| 5-7 | Balanced (recommended) | ~2,500-3,500 tokens |
| 10-15 | Complex questions | ~5,000-7,500 tokens |
| 20+ | Summary/overview | ~10,000+ tokens |

---

**Tamaño de Chunk**
- **Options:** 250, 500, 750, 1000 tokens
- **Default:** 500
- **Recommended:** 500 (balanced)

| Size | Pros | Cons | Best For |
|------|------|------|----------|
| 250 | More precise | Less context | Factual lookups |
| 500 | Balanced | - | Most use cases ✅ |
| 750 | More context | Less precise | Technical docs |
| 1000 | Full context | Too broad | Summaries |

---

**Similaridad Mínima**
- **Range:** 0.0-1.0
- **Default:** 0.5
- **Recommended:** 0.5-0.7

| Value | Meaning | Fallback Rate |
|-------|---------|---------------|
| 0.3 | Very permissive | Low |
| 0.5 | Balanced ✅ | Medium |
| 0.7 | Strict | High |
| 0.9 | Very strict | Very high |

---

**Overlap entre Chunks**
- **Range:** 0-200 tokens
- **Default:** 50
- **Recommended:** 50

**Why overlap?**
- Prevents losing context at chunk boundaries
- Important phrases split across chunks won't be missed

---

#### Configuración de Rendimiento

**Tamaño de Batch**
- **Range:** 1-20
- **Default:** 5
- **Recommended:** 5

Controls parallel embedding generation:
- Lower (1-3): Slower, safer for rate limits
- Medium (5): Balanced ✅
- Higher (10+): Faster, risk of rate limiting

---

**Máx. Chunks por Documento**
- **Range:** 10-10,000
- **Default:** 1,000
- **Recommended:** 1,000

Safety limit to prevent:
- Runaway indexing
- Excessive costs
- Storage overflow

---

#### Control de Costos

**Máx. Embeddings por Día**
- **Default:** 100,000
- **Impact:** Caps daily embedding generation

**Calculation:**
- 100,000 embeddings = ~200 documents @ 500 chunks each
- Cost: ~$5 per day max

---

**Umbral de Alerta**
- **Default:** 80,000 (80% of daily limit)
- **Purpose:** Email/notification when approaching limit

---

#### Configuración de Calidad

**Fallback Automático**
- **Default:** ON
- **Purpose:** Use full document if RAG finds no results

**Recommended:** Keep ON for best UX

---

**Umbral para Fallback**
- **Default:** 0.3
- **Purpose:** If best chunk < 0.3 similarity, use full document

**Recommendation:** Keep at 0.3

---

**Búsqueda Híbrida (Experimental)**
- **Default:** OFF
- **Purpose:** Combine vector search + keyword search
- **Status:** Future enhancement

---

## 📊 Statistics Interpretation

### Overview Stats

**Total Chunks**
- Shows total chunks indexed across all documents
- **Good:** Growing over time as documents added
- **Warning:** Sudden drops (deleted sources)

**Fuentes con RAG**
- Shows what % of sources have RAG enabled
- **Target:** >80%
- **Action if low:** Consider bulk re-indexing

**Total Búsquedas**
- Count of RAG searches performed
- **Good:** High and growing (RAG being used)
- **Warning:** Low (RAG may not be working)

**Ahorrado**
- Dollar amount saved vs full-document approach
- **Expected:** $50-100/month for Pro model users

---

### Performance Metrics

**Tiempo Búsqueda Promedio**
- **Excellent:** <300ms
- **Good:** 300-500ms
- **Warning:** >500ms (may need optimization)

**Similaridad Promedio**
- **Excellent:** >70%
- **Good:** 60-70%
- **Warning:** <60% (quality may be low)

**Tasa de Fallback**
- **Excellent:** <5%
- **Good:** 5-10%
- **Warning:** >10% (RAG not finding results)

---

## 🔧 Maintenance Operations

### Re-indexar Todos los Documentos

**When to use:**
- After changing default chunk size
- After adjusting overlap settings
- To enable RAG for old documents

**Process:**
1. Click "Re-indexar"
2. Confirm action
3. Documents queued for background processing
4. Check Firestore for `ragReindexQueued: true`

**Time:** 30-60 seconds per document

---

### Limpiar Caché

**When to use:**
- Orphaned chunks (from deleted sources)
- Storage cleanup
- Performance optimization

**What it does:**
- Finds chunks with no corresponding source
- Deletes orphaned chunks
- Frees up Firestore storage

---

### Optimizar Índices

**When to use:**
- Performance degradation
- After bulk re-indexing
- Monthly maintenance

**What it does:**
- (Future) Reorganizes chunks
- (Future) Rebuilds search indexes
- (Future) Compacts embeddings

---

## 🎨 Visual Indicators

### When RAG is Active (User View)

**Context Panel:**
```
┌──────────────────────────────────────┐
│ 🔍 Búsqueda Vectorial Activa         │
│                                      │
│ 5 fragmentos relevantes de 234 total│
│ Ahorro: 95.2% de tokens              │
│                                      │
│ Fuentes:                             │
│ • Document.pdf (3 chunks, 89% rel)   │
│ • Manual.pdf (2 chunks, 78% rel)     │
└──────────────────────────────────────┘
```

**Context Logs:**
```
┌────┬──────┬───────┬────────┬─────────┐
│ #  │ Time │ Model │ Input  │   RAG   │
├────┼──────┼───────┼────────┼─────────┤
│ 1  │14:32 │ Flash │ 52.5K  │    -    │ ← Without RAG
│ 2  │14:35 │ Flash │  2.8K  │ ✓ 5 ch  │ ← With RAG
└────┴──────┴───────┴────────┴─────────┘
                                ↑
                         Green badge: RAG used
                         Shows chunk count
```

---

## 💡 Admin Best Practices

### DO's ✅

1. **Start with defaults**
   - Optimized for 90% of use cases
   - Only tune if you see issues

2. **Monitor statistics weekly**
   - Check fallback rate
   - Verify savings are real
   - Watch for anomalies

3. **Tune based on data**
   - High fallback? → Lower similarity threshold
   - Slow search? → Reduce max chunks
   - Poor quality? → Increase topK

4. **Enable fallback**
   - Ensures system always works
   - Better UX than failing

5. **Set cost alerts**
   - Get notified before limits
   - Prevent runaway costs

---

### DON'Ts ❌

1. **Don't disable globally without testing**
   - Massive efficiency loss
   - Test per-user first

2. **Don't set topK too low** (<3)
   - May miss important context
   - Incomplete answers

3. **Don't set similarity too high** (>0.8)
   - Nothing will match
   - Constant fallback

4. **Don't ignore fallback rate**
   - >20% means RAG not working well
   - Investigate and tune

5. **Don't forget to re-index** after changing chunk size
   - Old chunks use old settings
   - Results will be inconsistent

---

## 📈 Monitoring Dashboard (Future)

### Metrics to Track

**Daily:**
- RAG searches performed
- Average search time
- Fallback rate
- Cost savings

**Weekly:**
- Documents indexed
- Token reduction %
- User satisfaction
- System health

**Monthly:**
- Total cost savings
- Performance trends
- Capacity planning
- Optimization opportunities

---

## 🎯 Quick Reference

### Common Admin Tasks

**View system status:**
- Open RAG panel → Stats tab

**Change default settings:**
- Config tab → Modify values → Save

**Re-index old documents:**
- Maintenance tab → Re-indexar Todos

**Check cost savings:**
- Stats tab → Ahorro section

**Verify RAG is working:**
- Stats tab → Check total searches > 0

---

## 🚀 Ready to Use!

### For Admins

1. **First time:** Review default config (probably fine)
2. **Weekly:** Check statistics tab
3. **Monthly:** Run maintenance operations
4. **As needed:** Tune settings based on metrics

### For Users

**Nothing to do!** RAG works automatically:
- Upload document → Auto-indexed
- Ask question → Auto-searched
- Get benefits → Automatic

**Optional:** Disable in personal settings if preferred

---

**Admin Panel Location:** User Menu → "Configuración RAG" 🎛️

**Remember:** Default settings are optimized. Only change if you see issues! ✅

