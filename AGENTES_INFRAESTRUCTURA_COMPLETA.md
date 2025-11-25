# 📊 Infraestructura Completa - 4 Agentes

**Fecha:** 24 noviembre 2025  
**Proyecto:** salfagpt

---

## 📋 **TABLA COMPARATIVA:**

| Componente | S1-v2 | S2-v2 | M1-v2 | M3-v2 | Región |
|------------|-------|-------|-------|-------|--------|
| **Nombre Agente** | Gestión Bodegas | Maqsa Mantenimiento | Asistente Legal Territorial RDI | GOP GPT | - |
| **Agent ID** | iQmdg3bMSJ1AdqqlFpye | 1lgr33ywq5qed67sqCYi | EgXezLcu4O3IUqFUJhUZ | vStojK73ZKbjNsEnqANJ | - |
| **Usuario creador** | usr_uhwqffaqag1wrryd82tw | usr_uhwqffaqag1wrryd82tw | usr_uhwqffaqag1wrryd82tw | usr_uhwqffaqag1wrryd82tw | - |
| **Dataset BigQuery (RAG)** | flow_analytics_east4 | flow_analytics_east4 | flow_analytics_east4 | flow_analytics_east4 | **us-east4** ✅ |
| **Región Dataset** | us-east4 | us-east4 | us-east4 | us-east4 | **us-east4** ✅ |
| **Chunks en Dataset** | ~60,992 | ~60,992 | ~60,992 | ~60,992 | - |
| **Firestore (Metadata)** | conversations | conversations | conversations | conversations | Global |
| **Región Firestore** | Multi-region | Multi-region | Multi-region | Multi-region | **Global** ✅ |
| **Cloud Storage (Docs)** | salfagpt-context-documents | salfagpt-context-documents | salfagpt-context-documents | salfagpt-context-documents | us-central1 ⚠️ |
| **Región Cloud Storage** | us-central1 | us-central1 | us-central1 | us-central1 | **Pendiente migrar** |

---

## 🎯 **DETALLES POR AGENTE:**

### **1. Gestión Bodegas (S1-v2)**

```
Nombre: Gestión Bodegas (S1-v2)
Agent ID: iQmdg3bMSJ1AdqqlFpye
Usuario: usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)

RAG:
  Dataset: flow_analytics_east4
  Región: us-east4 ✅
  Chunks: ~60,992 (compartidos con otros usuarios)
  Sources asignados: 75
  Chunks filtrados: ~1,200 (solo S1-v2)

Firestore:
  Collection: conversations
  Region: Global (multi-region)
  Path: conversations/iQmdg3bMSJ1AdqqlFpye

Cloud Storage:
  Bucket: salfagpt-context-documents
  Región: us-central1 ⚠️
  Path: usr_uhwqffaqag1wrryd82tw/iQmdg3bMSJ1AdqqlFpye/
```

---

### **2. Maqsa Mantenimiento (S2-v2)**

```
Nombre: Maqsa Mantenimiento (S2-v2)
Agent ID: 1lgr33ywq5qed67sqCYi
Usuario: usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)

RAG:
  Dataset: flow_analytics_east4
  Región: us-east4 ✅
  Chunks: ~60,992 (compartidos)
  Sources asignados: 467
  Chunks filtrados: ~20,100 (solo S2-v2)

Firestore:
  Collection: conversations
  Region: Global (multi-region)
  Path: conversations/1lgr33ywq5qed67sqCYi

Cloud Storage:
  Bucket: salfagpt-context-documents
  Región: us-central1 ⚠️
  Path: usr_uhwqffaqag1wrryd82tw/1lgr33ywq5qed67sqCYi/
  Archivos: ~305 PDFs (95% de 321 docs)
```

---

### **3. Asistente Legal Territorial RDI (M1-v2)**

```
Nombre: Asistente Legal Territorial RDI (M1-v2)
Agent ID: EgXezLcu4O3IUqFUJhUZ
Usuario: usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)

RAG:
  Dataset: flow_analytics_east4
  Región: us-east4 ✅
  Chunks: ~60,992 (compartidos)
  Sources asignados: 0 ⚠️ (requiere fix)
  Chunks filtrados: ~10,000 (estimado)

Firestore:
  Collection: conversations
  Region: Global (multi-region)
  Path: conversations/EgXezLcu4O3IUqFUJhUZ

Cloud Storage:
  Bucket: salfagpt-context-documents
  Región: us-central1 ⚠️
  Path: usr_uhwqffaqag1wrryd82tw/EgXezLcu4O3IUqFUJhUZ/
```

---

### **4. GOP GPT (M3-v2)**

```
Nombre: GOP GPT (M3-v2)
Agent ID: vStojK73ZKbjNsEnqANJ
Usuario: usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)

RAG:
  Dataset: flow_analytics_east4
  Región: us-east4 ✅
  Chunks: ~60,992 (compartidos)
  Sources asignados: 52
  Chunks filtrados: ~12,000 (solo M3-v2)

Firestore:
  Collection: conversations
  Region: Global (multi-region)
  Path: conversations/vStojK73ZKbjNsEnqANJ

Cloud Storage:
  Bucket: salfagpt-context-documents
  Región: us-central1 ⚠️
  Path: usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/
```

---

## 🌍 **ARQUITECTURA GLOBAL:**

### **Por Región:**

**us-east4 (Óptimo - Todo junto):** ✅
- Cloud Run: cr-salfagpt-ai-ft-prod
- BigQuery: flow_analytics_east4.document_embeddings
- GCS Backups: salfagpt-backups

**us-central1 (Legacy - A migrar):** ⚠️
- GCS: salfagpt-context-documents (PDFs originales)
- GCS: salfagpt-uploads
- BigQuery: flow_analytics (BLUE - deprecated)

**Global:**
- Firestore: conversations, context_sources, agent_sources

---

## ⚠️ **PENDIENTES:**

1. **M1-v2:** Crear asignaciones en agent_sources (0 actualmente)
2. **Cloud Storage:** Migrar de us-central1 a us-east4 (305 archivos S2-v2)
3. **Vector Index:** Crear en flow_analytics_east4 (mejora 2x velocidad)

---

## ✅ **YA COMPLETADO:**

1. ✅ BigQuery migrado a us-east4 (61,565 chunks)
2. ✅ Código actualizado con feature flag
3. ✅ Todos los agentes usan mismo dataset
4. ✅ S2-v2 completamente funcional

---

**Todos los agentes usan flow_analytics_east4 (us-east4) para RAG** ✅
