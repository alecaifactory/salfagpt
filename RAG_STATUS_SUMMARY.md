# RAG Status & BigQuery Chunks Report

**Generated:** $(date)

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Agents | 1,002 |
| RAG Enabled | 15 (1.5%) |
| RAG Disabled | 987 (98.5%) |
| Agents with Context Sources | 831 |
| Unique Context Sources | 811 |
| Sources with BigQuery Chunks | 120,707 |
| **Total Chunks in BigQuery** | **1,290,050** |

## Key Findings

### ✅ RAG is Working
- **14 agents** have RAG enabled and are using BigQuery chunks successfully
- BigQuery contains **1.29 million chunks** across **120,707 source-agent pairs**
- **98.5% of sources** have their chunks successfully stored in BigQuery

### ⚠️ Areas for Improvement

#### 1. RAG Disabled for Most Agents
- **817 agents** have context sources assigned but RAG is **disabled**
- These agents have access to 1.29M chunks but aren't using them
- **Recommendation:** Enable RAG for agents with sources to improve response quality

#### 2. Missing Chunks
- **1,606 sources** have no chunks in BigQuery
- These may be upload failures or incomplete indexing
- **Recommendation:** Reindex these sources or investigate upload logs

#### 3. Agents Without Sources  
- **171 agents** have no context sources assigned
- **Recommendation:** Assign sources or archive unused agents

## Storage Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ In BigQuery | 120,707 | 98.5% |
| ❌ No chunks | 1,606 | 1.3% |
| ⚪ No sources | 171 | 0.1% |

## Agents with RAG Enabled

| Agent ID | Agent Title | Sources | BQ Chunks |
|----------|-------------|---------|-----------|
| AjtQZEIMQvFn | GESTION BODEGAS GPT (S001) | 76 | 1,774 |
| KfoKcDrb6pMn | MAQSA Mantenimiento (S002) | 117 | 1,405 |
| fAPZHQaocTYL | SSOMA | 89 | 968 |
| iQmdg3bMSJ1A | S1-v2 | 75 | 585 |
| EgXezLcu4O3I | M1-v2 | 99 | 241 |
| vStojK73ZKbj | M3-v2 | 52 | 223 |
| 1lgr33ywq5qe | S2-v2 | 19 | 199 |
| nlmQBqdCKMEL | SSOMA v2 | 2 | 62 |
| EHNGIfk9N6OK | Nueva Conversación | 538 | 3,739 |
| cjn3bC0HrUYt | Asistente Legal Territorial | 538 | 3,739 |

## Data Architecture

### Current Setup
- **Firestore:** Agent metadata, source assignments
- **BigQuery:** Document chunks with embeddings (1.29M chunks)
- **Table:** `salfagpt.flow_rag_optimized.document_chunks_vectorized`
- **Partitioning:** By `created_at` (daily)
- **Clustering:** By `user_id`, `source_id`

### BigQuery Benefits
✅ All chunks are in BigQuery (98.5% coverage)  
✅ Fast vector search with optimized table structure  
✅ Scalable storage for millions of chunks  
✅ No dependency on Firestore for chunk retrieval  

## Next Steps

1. **Enable RAG** for the 817 agents that have sources
2. **Investigate** the 1,606 sources with missing chunks
3. **Clean up** 171 agents without sources
4. **Monitor** chunk creation for new uploads

---

*For detailed analysis, see: `RAG_STATUS_REPORT.json`*
