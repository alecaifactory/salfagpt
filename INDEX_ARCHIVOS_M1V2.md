# 📚 Índice de Archivos - Configuración M1-v2

**Propósito:** Guía rápida de qué archivo leer y para qué.

---

## 🔥 **ARCHIVOS CRÍTICOS (Lee en este orden):**

### **1. PROMPT_CONTINUE_M1V2.md** ⭐ MÁS IMPORTANTE
**Qué contiene:**
- Contexto completo de S2-v2 y S1-v2
- Prompt listo para copiar/pegar en nueva conversación
- Proceso paso a paso para M1-v2
- Comandos exactos a ejecutar
- Información técnica esencial

**Cuándo leer:** PRIMERO - Al iniciar nueva conversación

---

### **2. READY_FOR_M1V2.md**
**Qué contiene:**
- Estado actual del sistema (2/4 agentes)
- Qué información necesito para M1-v2
- Timeline estimado
- Resultados esperados

**Cuándo leer:** SEGUNDO - Para entender estado actual

---

### **3. CONTEXT_HANDOFF_M1_M3.md**
**Qué contiene:**
- Proceso detallado para M1-v2 y M3-v2
- Comandos de búsqueda/reemplazo
- Métricas esperadas
- Troubleshooting

**Cuándo leer:** TERCERO - Para detalles técnicos

---

## 📖 **ARCHIVOS DE REFERENCIA:**

### **4. S1_DEPLOYMENT_SUCCESS.md**
**Qué contiene:**
- Resumen completo de S1-v2
- Comparación con S2-v2
- Evaluaciones RAG ejecutadas
- Scripts creados

**Cuándo leer:** Para ver ejemplo de lo que acabamos de hacer

---

### **5. AGENTS_PROGRESS_2025-11-22.md**
**Qué contiene:**
- Estado general de los 4 agentes
- Progreso acumulado (50%)
- Métricas consolidadas
- Próximos pasos

**Cuándo leer:** Para vista panorámica del sistema

---

### **6. SESSION_ACHIEVEMENTS_2025-11-22.md**
**Qué contiene:**
- Logros de esta sesión
- Métricas de performance
- Lecciones aprendidas
- Archivos generados

**Cuándo leer:** Para entender qué se logró hoy

---

## 🔧 **SCRIPTS BASE (Templates para M1-v2):**

### **7. scripts/check-s001-status.mjs**
**Qué hace:**
- Analiza todos los docs en carpeta
- Verifica status en Firestore
- Verifica chunks en BigQuery
- Genera tabla completa

**Cómo usar:** Copiar a `check-m001-status.mjs` y adaptar IDs

---

### **8. scripts/assign-all-s001-to-s1v2.mjs**
**Qué hace:**
- Asigna todos los sources al agente
- Crea agent_sources en Firestore
- Actualiza activeContextSourceIds
- Verifica asignación

**Cómo usar:** Copiar a `assign-all-m001-to-m1v2.mjs` y adaptar IDs

---

### **9. scripts/process-s1v2-chunks.mjs** ⭐ MEJOR TEMPLATE
**Qué hace:**
- Procesa sources en batches
- Genera chunks (500 words)
- Crea embeddings semánticos (768 dims)
- Guarda en BigQuery
- Manejo robusto de errores

**Cómo usar:** Copiar a `process-m1v2-chunks.mjs` y adaptar IDs

---

### **10. scripts/test-s1v2-evaluation.mjs**
**Qué hace:**
- Ejecuta evaluaciones RAG
- Mide similarity
- Verifica referencias
- Genera reporte

**Cómo usar:** Copiar a `test-m1v2-evaluation.mjs`, adaptar IDs y agregar preguntas M1-v2

---

## 📊 **REPORTES GENERADOS (Referencias):**

### **11. S001_STATUS_REPORT.md**
- Tabla completa de 80 documentos
- Estado por categoría
- Acciones requeridas

### **12. S001_COMPLETION_SUMMARY.md**
- Resumen ejecutivo completo
- Métricas detalladas
- Comparación con S2-v2
- Lecciones aprendidas

### **13. S1V2_VISUAL_SUMMARY.txt**
- Resumen visual con ASCII art
- Fácil de leer rápidamente

---

## 🎯 **USO POR ESCENARIO:**

### **Escenario 1: Nueva conversación para continuar con M1-v2**
**Lee en orden:**
1. PROMPT_CONTINUE_M1V2.md (copia prompt)
2. Pega en nueva conversación
3. Agrega info M1-v2
4. El asistente hará el resto

---

### **Escenario 2: Entender qué se hizo con S1-v2**
**Lee en orden:**
1. S1_DEPLOYMENT_SUCCESS.md (resumen)
2. S001_COMPLETION_SUMMARY.md (detalles)
3. S001_STATUS_REPORT.md (tabla completa)

---

### **Escenario 3: Replicar proceso para M1-v2 manualmente**
**Lee en orden:**
1. CONTEXT_HANDOFF_M1_M3.md (proceso completo)
2. Scripts base en scripts/ (templates)
3. Ejecutar comandos paso a paso

---

### **Escenario 4: Ver progreso general del sistema**
**Lee en orden:**
1. AGENTS_PROGRESS_2025-11-22.md (estado general)
2. SESSION_ACHIEVEMENTS_2025-11-22.md (logros)

---

## 🔍 **BÚSQUEDA RÁPIDA:**

### **¿Necesitas...?**

**Agent IDs:**
- S2-v2: `1lgr33ywq5qed67sqCYi`
- S1-v2: `iQmdg3bMSJ1AdqqlFpye`
- M1-v2: Buscar en Firestore (ver PROMPT_CONTINUE_M1V2.md)
- M3-v2: Buscar en Firestore

**User ID:**
- Constante: `usr_uhwqffaqag1wrryd82tw` (alec@salfacloud.cl)

**BigQuery Config:**
- Project: salfagpt
- Dataset: flow_analytics
- Table: document_embeddings

**Carpetas:**
- S002: upload-queue/S002-20251118 ✅
- S001: upload-queue/S001-20251118 ✅
- M001: upload-queue/M001-20251118 ⏳
- M003: upload-queue/M003-20251118 ⏳

**Scripts:**
- Análisis: scripts/check-[code]-status.mjs
- Asignación: scripts/assign-all-[code]-to-[agent].mjs
- Procesamiento: scripts/process-[agent]-chunks.mjs
- Testing: scripts/test-[agent]-evaluation.mjs

---

## ⚡ **ATAJOS:**

### **Para iniciar M1-v2 rápidamente:**

```bash
# 1. Buscar agent ID
npx tsx scripts/find-m1-agent.mjs  # (si existe)

# 2. Copiar scripts
for f in find-s1-agent check-s001-status assign-all-s001-to-s1v2 process-s1v2-chunks test-s1v2-evaluation; do
  src="scripts/${f/s001/m001}"
  src="${src/s1v2/m1v2}"
  src="${src/-s1-/-m1-}"
  cp "scripts/${f}.mjs" "$src.mjs"
done

# 3. Adaptar IDs (hacer manualmente en cada archivo)

# 4. Ejecutar
npx tsx scripts/check-m001-status.mjs
npx tsx scripts/assign-all-m001-to-m1v2.mjs
nohup npx tsx scripts/process-m1v2-chunks.mjs > /tmp/m1v2-chunks.log 2>&1 &
npx tsx scripts/test-m1v2-evaluation.mjs
```

---

## 📋 **CHECKLIST DE ARCHIVOS:**

### **Archivos que YA EXISTEN (listos para usar):**

- [x] ✅ PROMPT_CONTINUE_M1V2.md
- [x] ✅ READY_FOR_M1V2.md
- [x] ✅ CONTEXT_HANDOFF_M1_M3.md
- [x] ✅ S1_DEPLOYMENT_SUCCESS.md
- [x] ✅ AGENTS_PROGRESS_2025-11-22.md
- [x] ✅ SESSION_ACHIEVEMENTS_2025-11-22.md
- [x] ✅ scripts/check-s001-status.mjs
- [x] ✅ scripts/assign-all-s001-to-s1v2.mjs
- [x] ✅ scripts/process-s1v2-chunks.mjs
- [x] ✅ scripts/test-s1v2-evaluation.mjs

### **Archivos que se CREARÁN para M1-v2:**

- [ ] ⏳ scripts/find-m1-agent.mjs
- [ ] ⏳ scripts/check-m001-status.mjs
- [ ] ⏳ scripts/assign-all-m001-to-m1v2.mjs
- [ ] ⏳ scripts/process-m1v2-chunks.mjs
- [ ] ⏳ scripts/test-m1v2-evaluation.mjs
- [ ] ⏳ M001_STATUS_REPORT.md
- [ ] ⏳ M001_COMPLETION_SUMMARY.md
- [ ] ⏳ M1_DEPLOYMENT_SUCCESS.md

---

## 🎯 **RESUMEN ULTRA-RÁPIDO:**

**Qué leer:**
1. `PROMPT_CONTINUE_M1V2.md` → Copia prompt → Pega en nueva conversación

**Qué proporcionar:**
- Agent ID M1-v2 (o nombre)
- Carpeta docs M001
- Ficha asistente (opcional)

**Qué obtendrás:**
- M1-v2 configurado en 1-2h
- RAG funcional >70%
- Scripts documentados
- Reportes completos

**Después:**
- M3-v2 (mismo proceso)
- Sistema completo 4/4 agentes ✅

---

**ARCHIVO PRINCIPAL:** `PROMPT_CONTINUE_M1V2.md` 🔥

Lee ese archivo para continuar sin perder contexto.

---

**Generado:** 2025-11-22T19:35:00.000Z




