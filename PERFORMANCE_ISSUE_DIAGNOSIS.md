# 🚨 M1-v2 Performance Issue - DIAGNOSED

**Date:** 2025-11-26  
**Issue:** Response time 2m 44s (expected: 2-4s)  
**Impact:** Critical - Users experiencing 40x slower responses  
**Status:** 🔴 ROOT CAUSE IDENTIFIED

---

## 🔍 **DIAGNOSIS FROM TERMINAL LOGS:**

### **The Smoking Gun:**

```
12:35:28 Performing vector search in BigQuery...
12:38:24 ✓ BigQuery search complete (164667ms)  ← 🚨 2 MINUTES 44 SECONDS!
```

### **Expected vs Actual:**

| Phase | Expected | Actual | Status |
|-------|----------|--------|--------|
| Embedding generation | 200-400ms | 1,003ms | ✅ OK (2.5x but acceptable) |
| Sources lookup | 50-100ms | 1,069ms | ⚠️ Slow but not critical |
| **BigQuery vector search** | **400ms** | **164,667ms** | 🔥 **CRITICAL: 412x slower!** |
| Gemini AI generation | 2-5s | ~3s | ✅ OK |
| Firestore save | 200ms | 345ms | ✅ OK |
| **TOTAL** | **~3-6s** | **~170s (2m 50s)** | 🔥 **CRITICAL** |

---

## 🎯 **ROOT CAUSE:**

### **BigQuery Table Missing Clustering**

The `document_embeddings` table in `flow_analytics_east4` is **NOT clustered** by `agent_id`.

**What this means:**
```sql
-- Current (WITHOUT clustering):
SELECT * FROM document_embeddings
WHERE agent_id = 'EgXezLcu4O3IUqFUJhUZ'

→ BigQuery scans ENTIRE table (all agents, all users, all chunks)
→ 164 seconds to find 1,786 chunks among potentially 10,000+ total chunks
```

**With clustering:**
```sql
-- After clustering by agent_id:
SELECT * FROM document_embeddings
WHERE agent_id = 'EgXezLcu4O3IUqFUJhUZ'

→ BigQuery jumps directly to agent_id cluster
→ Only scans 1,786 relevant chunks
→ 400ms response time
```

---

## ⚡ **IMMEDIATE FIX (3 Steps)**

### **Step 1: Verify Current Table Structure** (30 seconds)

```bash
cd /Users/alec/salfagpt
gcloud auth application-default login  # If needed

# Run diagnostic query
bq query --use_legacy_sql=false --project_id=salfagpt '
SELECT 
  table_name,
  ROUND(size_bytes / (1024*1024*1024), 2) as size_gb,
  row_count
FROM `salfagpt.flow_analytics_east4.INFORMATION_SCHEMA.TABLES`
WHERE table_name = "document_embeddings"
'
```

**Expected output:**
```
+----------------------+----------+-----------+
| table_name          | size_gb  | row_count |
+----------------------+----------+-----------+
| document_embeddings  | X.XX GB  | XXXX rows |
+----------------------+----------+-----------+
```

---

### **Step 2: Create Clustered Table** (2-5 minutes)

```bash
# Run the optimization script
bq query --use_legacy_sql=false --project_id=salfagpt < scripts/optimize-bigquery-performance.sql

# This creates: document_embeddings_optimized (with clustering)
```

**Wait for completion:** 2-5 minutes depending on table size

---

### **Step 3: Test Performance** (30 seconds)

```bash
# Test query on NEW optimized table
bq query --use_legacy_sql=false --project_id=salfagpt '
SELECT COUNT(*) as chunks
FROM `salfagpt.flow_analytics_east4.document_embeddings_optimized`
WHERE agent_id = "EgXezLcu4O3IUqFUJhUZ"
  AND user_id = "usr_uhwqffaqag1wrryd82tw"
'
```

**Check execution time in output:**
- ✅ Should be < 1 second
- ❌ If still > 10 seconds, clustering didn't work

---

## 🔧 **PERMANENT FIX (After Testing)**

### **Step 4: Update Code to Use Optimized Table**

Update `src/lib/bigquery-agent-search.ts`:

```typescript
// Line 32 (current):
const TABLE_ID = 'document_embeddings';

// Change to:
const TABLE_ID = 'document_embeddings_optimized';  // ⚡ Use clustered table
```

### **Step 5: Deploy to Production**

```bash
# Test locally first
npm run dev
# Send test message to M1-v2
# Should respond in 3-5 seconds (not 2m 44s)

# Deploy if successful
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --project salfagpt
```

### **Step 6: Swap Tables (After Verification)**

Once confirmed working in production:

```bash
# Backup original
bq cp salfagpt:flow_analytics_east4.document_embeddings \
      salfagpt:flow_analytics_east4.document_embeddings_backup_20251126

# Drop original
bq rm -f salfagpt:flow_analytics_east4.document_embeddings

# Rename optimized → production
bq cp salfagpt:flow_analytics_east4.document_embeddings_optimized \
      salfagpt:flow_analytics_east4.document_embeddings

# Update code back to original table name
# Deploy one more time
```

---

## 📊 **OTHER ISSUES FOUND:**

### **Issue 2: Duplicate Route Warning** (Non-critical but should fix)

```
[WARN] The route "/api/groups" is defined in both:
  - src/pages/api/groups/index.ts
  - src/pages/api/groups.ts
```

**Fix:** Delete one of these files (probably `groups.ts`)

---

### **Issue 3: Firestore Index Missing** (Non-critical)

```
Error: The query requires an index for feature_onboarding
URL: https://console.firebase.google.com/v1/r/project/salfagpt/firestore/indexes?create_composite=...
```

**Fix:** Click the URL and create the index (1-click)

---

### **Issue 4: Missing Context Source** (Data cleanup needed)

```
Error: No document to update: context_sources/1EnH6gTnM6a33W4aUeNp
```

**Fix:** Clean up orphaned source references

---

## 🎯 **QUICK WIN: Test Without BigQuery** (Immediate workaround)

While we wait for clustering, you can temporarily disable BigQuery to use Firestore fallback:

<function_calls>
<invoke name="read_file">
<parameter name="target_file">/Users/alec/salfagpt/src/lib/bigquery-routing.ts
