# 📚 Índice de Prompts - M1-v2 y M3-v2

**Propósito:** Guía rápida para continuar con los agentes pendientes.

---

## 🎯 **ESTADO ACTUAL:**

```
Completado:   S2-v2 ✅, S1-v2 ✅, M1-v2 ✅  (3/4 agentes)
Pendiente:    M3-v2 ⏳                      (1/4 agente)

Chunks:       ~17,500 indexados
Costo:        ~$0.28
Tiempo:       ~7 horas
Progreso:     75%
```

---

## 📁 **ARCHIVOS PARA M1-v2:**

### **Si M1-v2 NO está completado aún:**

**Opción rápida:**
- `PROMPT_M1V2_SIMPLE.txt` - Prompt compacto (30 seg)

**Opción completa:**
- `PROMPT_CONTINUE_M1V2.md` - Prompt + contexto técnico (3 min)

**Referencia:**
- `READY_FOR_M1V2.md` - Estado y próximos pasos
- `INDEX_ARCHIVOS_M1V2.md` - Índice archivos M1

---

## 📁 **ARCHIVOS PARA M3-v2:**

### **Si M3-v2 es el próximo (M1 ya completado):**

**Opción rápida (RECOMENDADO):**
- `PROMPT_M3V2_SIMPLE.txt` - Prompt compacto (30 seg)

**Opción completa:**
- `PROMPT_CONTINUE_M3V2.md` - Prompt + contexto técnico (3 min)

**Referencia:**
- `READY_FOR_M3V2.md` - Estado y próximos pasos
- Scripts base: `scripts/process-m1v2-chunks.mjs` (mejor template)

---

## 🚀 **DECISION TREE:**

```
¿Qué agente sigue?
│
├─ M1-v2 (si no está completado)
│  │
│  ├─ Rápido:   Usa PROMPT_M1V2_SIMPLE.txt
│  └─ Completo: Usa PROMPT_CONTINUE_M1V2.md
│
└─ M3-v2 (si M1-v2 ya está listo)
   │
   ├─ Rápido:   Usa PROMPT_M3V2_SIMPLE.txt
   └─ Completo: Usa PROMPT_CONTINUE_M3V2.md
```

---

## 📊 **COMPARACIÓN DE ARCHIVOS:**

### **Prompts Simples (Recomendados):**

| Archivo | Agente | Tamaño | Tiempo lectura | Uso |
|---------|--------|--------|----------------|-----|
| PROMPT_M1V2_SIMPLE.txt | M1-v2 | ~100 líneas | 30 seg | Copiar/pegar rápido |
| PROMPT_M3V2_SIMPLE.txt | M3-v2 | ~100 líneas | 30 seg | Copiar/pegar rápido |

**Ventajas:**
- ✅ Ultra rápido
- ✅ Solo lo esencial
- ✅ Prompt listo para copiar
- ✅ Info técnica mínima necesaria

---

### **Prompts Completos (Para referencia):**

| Archivo | Agente | Tamaño | Tiempo lectura | Uso |
|---------|--------|--------|----------------|-----|
| PROMPT_CONTINUE_M1V2.md | M1-v2 | ~850 líneas | 3-5 min | Contexto completo |
| PROMPT_CONTINUE_M3V2.md | M3-v2 | ~600 líneas | 2-3 min | Contexto completo |

**Ventajas:**
- ✅ Contexto técnico completo
- ✅ Troubleshooting incluido
- ✅ Comandos detallados
- ✅ Configuración exhaustiva

---

## 🎯 **RECOMENDACIÓN POR ESCENARIO:**

### **Escenario 1: Continuar rápidamente con M1-v2**
```
1. Abre: PROMPT_M1V2_SIMPLE.txt
2. Copia prompt
3. Pega en nueva conversación
4. Agrega: Agent ID, carpeta, ficha
5. ¡Listo!
```

### **Escenario 2: Continuar rápidamente con M3-v2 (si M1 listo)**
```
1. Abre: PROMPT_M3V2_SIMPLE.txt
2. Copia prompt
3. Pega en nueva conversación
4. Agrega: Agent ID, carpeta, ficha
5. ¡Listo! (ÚLTIMO AGENTE)
```

### **Escenario 3: Necesito entender contexto técnico**
```
1. Lee: PROMPT_CONTINUE_M[1|3]V2.md (según agente)
2. Revisa sección "ARQUITECTURA TÉCNICA"
3. Revisa "PROCESO PROBADO"
4. Copia prompt de sección final
```

### **Escenario 4: Ver progreso general**
```
1. Abre: AGENTS_PROGRESS_2025-11-22.md
2. Ve métricas consolidadas
3. Decide qué agente sigue
4. Usa prompt correspondiente
```

---

## 📊 **ESTIMACIONES FINALES:**

### **Si falta M1-v2 + M3-v2:**
- Tiempo: ~2-3h
- Costo: ~$0.065
- Chunks: ~6,500 nuevos
- Total final: ~20,000 chunks

### **Si solo falta M3-v2:**
- Tiempo: ~45min-1h
- Costo: ~$0.025
- Chunks: ~2,500 nuevos
- Total final: ~20,000 chunks

---

## 🔧 **INFORMACIÓN TÉCNICA (CONSTANTE):**

### **BigQuery (NO CAMBIAR):**
```javascript
Project: 'salfagpt'
Dataset: 'flow_analytics'
Table: 'document_embeddings'
Schema: 9 campos backward compatible
```

### **User (CONSTANTE):**
```javascript
USER_ID: 'usr_uhwqffaqag1wrryd82tw'
Email: 'alec@salfacloud.cl'
```

### **Embeddings:**
```javascript
Model: 'text-embedding-004' (Gemini)
Dimensions: 768
API: src/lib/embeddings.js
```

---

## ✅ **CHECKLIST RÁPIDO:**

### **Para M1-v2 (si falta):**
- [ ] Abrir PROMPT_M1V2_SIMPLE.txt
- [ ] Copiar prompt
- [ ] Agregar: Agent ID, carpeta, ficha
- [ ] Pegar en nueva conversación
- [ ] Esperar resultado (1-2h)

### **Para M3-v2 (último agente):**
- [ ] Abrir PROMPT_M3V2_SIMPLE.txt
- [ ] Copiar prompt
- [ ] Agregar: Agent ID, carpeta, ficha
- [ ] Pegar en nueva conversación
- [ ] Esperar resultado (45min-1h)
- [ ] **Sistema completo 4/4 agentes** ✅

---

## 🎯 **ARCHIVOS POR AGENTE:**

### **M1-v2:**
```
Prompts:
├── PROMPT_M1V2_SIMPLE.txt         ⭐ Rápido
└── PROMPT_CONTINUE_M1V2.md         Completo

Soporte:
├── READY_FOR_M1V2.md               Estado
└── INDEX_ARCHIVOS_M1V2.md          Índice

Scripts base:
└── scripts/process-s1v2-chunks.mjs ⭐ Template
```

### **M3-v2:**
```
Prompts:
├── PROMPT_M3V2_SIMPLE.txt         ⭐ Rápido
└── PROMPT_CONTINUE_M3V2.md         Completo

Soporte:
└── READY_FOR_M3V2.md               Estado

Scripts base:
└── scripts/process-m1v2-chunks.mjs ⭐ Template
```

---

## 🔍 **BÚSQUEDA RÁPIDA:**

### **¿Qué agente sigue?**

**Verifica en terminal:**
```bash
# Ver estado de M1-v2
ls -1 M001_*.md 2>/dev/null && echo "✅ M1-v2 completado" || echo "⏳ M1-v2 pendiente"

# Ver scripts M1
ls -1 scripts/*m1v2*.mjs 2>/dev/null | wc -l
```

**Si M1-v2 tiene reportes:** Usar prompts M3-v2  
**Si M1-v2 NO tiene reportes:** Usar prompts M1-v2

---

## 📋 **INFORMACIÓN NECESARIA:**

### **Para M1-v2 O M3-v2 (según cuál sigue):**

```
INFORMACIÓN [M1/M3]-v2:
- Agent ID: [id] o "buscar por nombre: [nombre]"
- Carpeta: upload-queue/[M001/M003]-20251118
- Docs estimados: [número] o "verificar"
- Ficha asistente: [JSON] o "usar genérica"
```

---

## 🚀 **PRÓXIMO RESULTADO:**

### **Al completar agente pendiente:**

**Si completas M1-v2:**
- ✅ 3/4 agentes listos
- ⏳ Falta M3-v2 (usar PROMPT_M3V2_SIMPLE.txt)
- ~75% del sistema completo

**Si completas M3-v2:**
- ✅ 4/4 agentes listos
- ✅ Sistema RAG completo
- ✅ ~20,000 chunks indexados
- ✅ Listo para producción
- ✅ **MISIÓN CUMPLIDA** 🎉

---

## 📚 **ARCHIVOS DE REFERENCIA GENERAL:**

### **Estado del sistema:**
- `AGENTS_PROGRESS_2025-11-22.md` - Progreso consolidado
- `SESSION_ACHIEVEMENTS_2025-11-22.md` - Logros sesión S1-v2

### **Ejemplos completados:**
- `S2_DEPLOYMENT_SUCCESS.md` - Ejemplo S2-v2 (más viejo)
- `S1_DEPLOYMENT_SUCCESS.md` - Ejemplo S1-v2 (más reciente)
- `M1_DEPLOYMENT_SUCCESS.md` - Ejemplo M1-v2 (si existe)

### **Handoffs originales:**
- `CONTEXT_HANDOFF_S1_M1_M3.md` - Handoff original
- `CONTEXT_HANDOFF_M1_M3.md` - Handoff M1 y M3

---

## ✅ **RESUMEN ULTRA-COMPACTO:**

```
COMPLETADO: S2-v2, S1-v2, [M1-v2?]
PENDIENTE:  [M1-v2?], M3-v2
PROCESO:    Copiar scripts → Adaptar → Ejecutar
TIEMPO:     45min-2h (según agente)
COSTO:      ~$0.025-0.04
ARCHIVOS:   PROMPT_[M1|M3]V2_SIMPLE.txt
RESULTADO:  Sistema completo 4/4 ✅
```

---

## 🎯 **ACCIÓN INMEDIATA:**

**Opción A - M1-v2 pendiente:**
1. Abre `PROMPT_M1V2_SIMPLE.txt`
2. Sigue instrucciones

**Opción B - Solo M3-v2 pendiente:**
1. Abre `PROMPT_M3V2_SIMPLE.txt`
2. Sigue instrucciones

**Resultado:** Sistema completo en 1-2h más ✅

---

**ARCHIVOS PRINCIPALES:**
- `PROMPT_M1V2_SIMPLE.txt` - Para M1
- `PROMPT_M3V2_SIMPLE.txt` - Para M3 ⭐

**ELIGE EL QUE CORRESPONDA Y CONTINÚA** 🚀




