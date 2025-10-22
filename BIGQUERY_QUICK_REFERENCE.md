# BigQuery Vector Search - Quick Reference

**Status:** ✅ ACTIVE in SALFACORP  
**Performance:** 6x faster than Firestore  
**Fallback:** Automatic if BigQuery fails

---

## 📊 Current Stats

```bash
# Check chunk count
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT COUNT(*) as chunks FROM \`salfagpt.flow_analytics.document_embeddings\`"
# Result: 3,021 chunks

# Check user distribution  
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT user_id, COUNT(*) as chunks FROM \`salfagpt.flow_analytics.document_embeddings\` GROUP BY user_id"
```

---

## 🚀 How It Works

### Automatic Strategy

```
Message sent → Try BigQuery first → Success? Use results : Fall back to Firestore
```

**Code location:** `src/lib/rag-search-optimized.ts`

### Search Performance

| Method | Time | Notes |
|--------|------|-------|
| BigQuery (cold) | 30-60s | First query only |
| BigQuery (warm) | ~400ms | ⚡ 6x faster |
| Firestore (fallback) | ~2,600ms | Always works |

---

## 🧪 Test Commands

### Test Vector Search
```bash
npx tsx scripts/test-bigquery-vector-search.ts
```

### Backfill Chunks (if needed)
```bash
npx tsx scripts/backfill-bigquery.ts
```

### Check BigQuery Data
```bash
# Total chunks
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT COUNT(*) FROM \`salfagpt.flow_analytics.document_embeddings\`"

# Sample data
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT chunk_id, source_id, chunk_index, 
          ARRAY_LENGTH(embedding) as embedding_dims,
          JSON_EXTRACT_SCALAR(metadata, '$.tokenCount') as tokens
   FROM \`salfagpt.flow_analytics.document_embeddings\` LIMIT 5"
```

---

## 🔧 Files Changed

1. **`config/environments.ts`**
   - Fallback: `gen-lang-client-0986191192` → `salfagpt`

2. **`src/lib/bigquery-vector-search.ts`**
   - Fixed: Metadata JSON serialization
   - Added: CURRENT_PROJECT_ID consistency
   - Added: Debug logging

---

## ✅ Verification

```bash
# 1. Check BigQuery has data
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT COUNT(*) FROM \`salfagpt.flow_analytics.document_embeddings\`"
# Expected: 3000+ chunks

# 2. Test vector search
npx tsx scripts/test-bigquery-vector-search.ts
# Expected: Returns 5 results with high similarity

# 3. Test in chat
# Send message with RAG enabled
# Check logs for "BigQuery search succeeded"
```

---

## 🎯 What's Enabled

- ✅ BigQuery vector search (primary)
- ✅ Firestore vector search (fallback)
- ✅ Automatic sync on new uploads
- ✅ User isolation (filters by user_id)
- ✅ Source filtering (filters by activeSourceIds)
- ✅ JSON metadata storage
- ✅ Performance logging

---

## 🚨 If Issues Occur

### BigQuery fails
**What happens:** Automatic fallback to Firestore  
**User impact:** None (transparent)  
**Performance:** Slower but works

### Sync fails
**What happens:** Logged as warning  
**User impact:** None (Firestore has data)  
**Fix:** Check logs, re-run backfill if needed

### Project ID wrong
**What happens:** Query fails, falls back  
**Fix:** Check .env has `GOOGLE_CLOUD_PROJECT=salfagpt`

---

**Last Updated:** October 22, 2025  
**Project:** salfagpt (SALFACORP)  
**Chunks in BigQuery:** 3,021  
**Status:** ✅ PRODUCTION READY

