# 📊 Infraestructura 4 Agentes - Tabla Completa

**Proyecto:** salfagpt  
**Usuario:** usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)

---

## 🤖 **AGENTE 1: Gestión Bodegas (S1-v2)**

| Aspecto | Valor |
|---------|-------|
| **Nombre** | Gestión Bodegas (S1-v2) |
| **ID Agente** | iQmdg3bMSJ1AdqqlFpye |
| **Usuario creador** | usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl) |
| **Dataset BigQuery (RAG)** | flow_analytics_east4 |
| **Región Dataset** | us-east4 ✅ |
| **Chunks en Dataset** | 60,992 (total usuario, ~1,200 filtrados para S1) |
| **Firestore** | conversations, context_sources, agent_sources |
| **Región Firestore** | Global (multi-region) |
| **Cloud Storage** | salfagpt-context-documents |
| **Región Cloud Storage** | us-central1 ⚠️ |
| **Sources asignados** | 75 |

---

## 🤖 **AGENTE 2: Maqsa Mantenimiento (S2-v2)**

| Aspecto | Valor |
|---------|-------|
| **Nombre** | Maqsa Mantenimiento (S2-v2) |
| **ID Agente** | 1lgr33ywq5qed67sqCYi |
| **Usuario creador** | usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl) |
| **Dataset BigQuery (RAG)** | flow_analytics_east4 |
| **Región Dataset** | us-east4 ✅ |
| **Chunks en Dataset** | 60,992 (total usuario, ~20,100 filtrados para S2) |
| **Firestore** | conversations, context_sources, agent_sources |
| **Región Firestore** | Global (multi-region) |
| **Cloud Storage** | salfagpt-context-documents |
| **Región Cloud Storage** | us-central1 ⚠️ |
| **Sources asignados** | 467 |
| **Docs S002** | 321 documentos |

---

## 🤖 **AGENTE 3: Asistente Legal Territorial (M1-v2)**

| Aspecto | Valor |
|---------|-------|
| **Nombre** | Asistente Legal Territorial RDI (M1-v2) |
| **ID Agente** | EgXezLcu4O3IUqFUJhUZ |
| **Usuario creador** | usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl) |
| **Dataset BigQuery (RAG)** | flow_analytics_east4 |
| **Región Dataset** | us-east4 ✅ |
| **Chunks en Dataset** | 60,992 (total usuario, ~10,000 filtrados para M1) |
| **Firestore** | conversations, context_sources, agent_sources |
| **Región Firestore** | Global (multi-region) |
| **Cloud Storage** | salfagpt-context-documents |
| **Región Cloud Storage** | us-central1 ⚠️ |
| **Sources asignados** | 2,188 (activos: 623) |

---

## 🤖 **AGENTE 4: GOP GPT (M3-v2)**

| Aspecto | Valor |
|---------|-------|
| **Nombre** | GOP GPT (M3-v2) |
| **ID Agente** | vStojK73ZKbjNsEnqANJ |
| **Usuario creador** | usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl) |
| **Dataset BigQuery (RAG)** | flow_analytics_east4 |
| **Región Dataset** | us-east4 ✅ |
| **Chunks en Dataset** | 60,992 (total usuario, ~12,000 filtrados para M3) |
| **Firestore** | conversations, context_sources, agent_sources |
| **Región Firestore** | Global (multi-region) |
| **Cloud Storage** | salfagpt-context-documents |
| **Región Cloud Storage** | us-central1 ⚠️ |
| **Sources asignados** | 2,188 (activos: 52) |

---

## 🌍 **RESUMEN POR REGIÓN:**

### **us-east4 (Cloud Run + BigQuery):** ✅ ÓPTIMO

```
✅ Cloud Run: cr-salfagpt-ai-ft-prod
✅ BigQuery: flow_analytics_east4.document_embeddings
✅ Chunks: 61,565
✅ Todos los 4 agentes usan este dataset
```

**Beneficio:** Latencia mínima (misma región)

---

### **us-central1 (Cloud Storage):** ⚠️ PENDIENTE

```
⚠️ GCS: salfagpt-context-documents
⚠️ PDFs originales: ~305 archivos
⚠️ Cross-region con Cloud Run
```

**Impacto:** +100ms al cargar PDFs  
**Solución:** Migrar a us-east4 (próximo paso)

---

### **Global (Firestore):** ✅ ÓPTIMO

```
✅ Metadata agentes: conversations
✅ Documentos: context_sources
✅ Asignaciones: agent_sources
```

**Beneficio:** Multi-región, siempre rápido

---

## 📊 **RESUMEN EJECUTIVO:**

**Dataset BigQuery (RAG):**
- ✅ Todos usan: `flow_analytics_east4` (us-east4)
- ✅ Migrado exitosamente
- ✅ 61,565 chunks totales
- ✅ Compartido entre 4 agentes (filtrado por source_id)

**Firestore:**
- ✅ Global para todos
- ✅ Metadata y asignaciones

**Cloud Storage:**
- ⚠️ us-central1 (pendiente migrar)
- ✅ Funciona pero cross-region

---

**3/4 componentes en región óptima** ✅  
**Próximo:** Migrar GCS a us-east4




