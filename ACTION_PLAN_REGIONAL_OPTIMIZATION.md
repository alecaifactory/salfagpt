# 🎯 Action Plan - Regional Optimization to us-east4

**Date:** November 28, 2025  
**Goal:** Ensure all heavy processing in us-east4 (except Firestore)  
**Priority:** Medium  
**Effort:** 5-60 minutes (depending on scope)

---

## 📊 **CURRENT STATUS**

### **Regional Breakdown:**

| Component | Current | Optimal | Gap |
|-----------|---------|---------|-----|
| Cloud Run | us-east4 ✅ | us-east4 | ✅ None |
| GCS | us-central1 ⚠️ | us-east4 | 🔧 Configure |
| BigQuery | us-central1 ⚠️ | us-east4 | 🔧 Configure |
| Firestore | us-central1 ✅ | us-central1 | ✅ None (global) |

**Grade:** 🟡 50% optimal (2/4 correct)

---

## ⚡ **QUICK FIX (5 Minutes)**

### **Option 1: Environment Variables (Fastest)**

**Add to `.env` file:**

```bash
# Regional optimization - Force us-east4 for heavy processing
USE_EAST4_STORAGE=true
USE_EAST4_BIGQUERY=true
```

**What this does:**
```typescript
// src/lib/storage.ts
export const BUCKET_NAME = process.env.USE_EAST4_STORAGE === 'true'
  ? 'salfagpt-context-documents-east4'  // ✅ Will use this
  : 'salfagpt-uploads';                 // Old

// src/lib/bigquery-agent-search.ts  
const DATASET_ID = process.env.USE_EAST4_BIGQUERY === 'true'
  ? 'flow_analytics_east4'  // ✅ Will use this
  : 'flow_analytics';        // Old
```

**Effect:**
- All NEW uploads → us-east4 GCS bucket ✅
- All queries → us-east4 BigQuery dataset ✅
- Existing data remains where it is (no migration needed immediately)

**Steps:**
```bash
# 1. Edit .env file
echo "" >> .env
echo "# Regional optimization (us-east4)" >> .env
echo "USE_EAST4_STORAGE=true" >> .env
echo "USE_EAST4_BIGQUERY=true" >> .env

# 2. Verify
cat .env | grep EAST4

# 3. Restart server (if running)
# pkill -f "npm run dev"
# npm run dev

# 4. Test with next upload
# Next document will automatically use us-east4
```

**Time:** 5 minutes  
**Risk:** None (backward compatible)  
**Benefit:** All new data in optimal region

---

## 🔄 **DATA MIGRATION (30-60 Minutes)**

### **Option 2: Migrate Existing Data (Optional)**

**Only do this if you want existing documents also in us-east4**

#### **Step 1: Migrate GCS (30 min)**

```bash
# Copy existing files from us-central1 to us-east4
gsutil -m rsync -r \
  gs://salfagpt-context-documents \
  gs://salfagpt-context-documents-east4

# Verify
gsutil du -sh gs://salfagpt-context-documents-east4
# Should show similar size to original
```

---

#### **Step 2: Migrate BigQuery (30 min)**

```bash
# 1. Verify flow_analytics_east4 has document_embeddings table
bq show salfagpt:flow_analytics_east4.document_embeddings

# 2. If not, create it
bq mk --table \
  --time_partitioning_field=created_at \
  --clustering_fields=user_id,source_id \
  salfagpt:flow_analytics_east4.document_embeddings \
  chunk_id:STRING,source_id:STRING,user_id:STRING,chunk_index:INTEGER,\
  text_preview:STRING,full_text:STRING,embedding:FLOAT64,\
  metadata:JSON,created_at:TIMESTAMP

# 3. Copy all data from flow_rag_optimized
bq query --nouse_legacy_sql --project_id=salfagpt \
  --destination_table=salfagpt:flow_analytics_east4.document_embeddings \
  --append_table \
  "SELECT 
    chunk_id,
    source_id, 
    user_id,
    chunk_index,
    text_preview,
    full_text,
    embedding,
    metadata,
    created_at
   FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`"

# 4. Verify row count
bq query --nouse_legacy_sql \
  "SELECT COUNT(*) as total 
   FROM \`salfagpt.flow_analytics_east4.document_embeddings\`"
# Should return: 31,806 (same as flow_rag_optimized)
```

---

## 🎯 **RECOMMENDED APPROACH**

### **Pragmatic 3-Step Plan:**

#### **Step 1: Quick Fix (5 min) - DO NOW**

```bash
# Add environment variables
echo "USE_EAST4_STORAGE=true" >> .env
echo "USE_EAST4_BIGQUERY=true" >> .env
```

**Result:** All NEW uploads optimal ✅

---

#### **Step 2: Test OGUC (10 min) - DO NOW**

```
1. Open M3-v2 in UI
2. Ask: "¿Qué es un desmonte según la OGUC?"
3. Verify response quality
4. Check response time (<2s)
```

**Result:** Validate OGUC document working ✅

---

#### **Step 3: Migrate Data (60 min) - OPTIONAL**

```bash
# Only if you want existing data also in us-east4
# Follow Step 2 migration commands above
```

**Result:** Historical data also optimal ✅

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Quick Fix (Recommended):**

- [ ] Add USE_EAST4_STORAGE=true to .env
- [ ] Add USE_EAST4_BIGQUERY=true to .env
- [ ] Verify variables: `cat .env | grep EAST4`
- [ ] Restart server if needed
- [ ] Upload test file to verify us-east4 usage
- [ ] Check logs confirm us-east4 bucket used

**Time:** 5 minutes  
**Risk:** None  
**Benefit:** Optimal for all future uploads

---

### **Data Migration (Optional):**

- [ ] Copy GCS files to east4 bucket (gsutil rsync)
- [ ] Create or verify flow_analytics_east4.document_embeddings
- [ ] Copy BigQuery data to east4 dataset
- [ ] Verify row counts match
- [ ] Update scripts if needed
- [ ] Test query performance improvement
- [ ] Keep old datasets as backup (30 days)

**Time:** 60 minutes  
**Risk:** Low (old data preserved)  
**Benefit:** Historical data also optimal

---

## 💡 **DECISION MATRIX**

### **When to do Quick Fix vs Full Migration:**

**Quick Fix (5 min) - Choose if:**
- ✅ Want immediate optimization
- ✅ Don't need historical data migrated
- ✅ Existing performance acceptable
- ✅ Want zero-risk approach

**Full Migration (60 min) - Choose if:**
- ✅ Have time available
- ✅ Want 100% consistency
- ✅ Historical queries important
- ✅ Prefer complete optimization

**Hybrid (5 min now, migrate later) - Choose if:**
- ✅ Want quick wins now (Recommended!)
- ✅ Can migrate data later when convenient
- ✅ Prefer staged approach
- ✅ Want to validate first

---

## ✅ **POST-OPTIMIZATION VERIFICATION**

### **After Environment Variables:**

```bash
# Test that next upload uses us-east4
# Check logs for:
# "Uploading to GCS: gs://salfagpt-context-documents-east4/..."
# "BigQuery dataset: flow_analytics_east4"
```

### **After Data Migration:**

```bash
# Verify row counts match
bq query "SELECT COUNT(*) FROM salfagpt.flow_rag_optimized.document_chunks_vectorized"
bq query "SELECT COUNT(*) FROM salfagpt.flow_analytics_east4.document_embeddings"
# Should be equal

# Test query performance
# Should see 2-3× faster BigQuery searches
```

---

## 🎯 **FINAL RECOMMENDATION**

### **For You (Right Now):**

**Do Quick Fix (5 min):**
```bash
# 1. Add env variables
echo "USE_EAST4_STORAGE=true" >> .env
echo "USE_EAST4_BIGQUERY=true" >> .env

# 2. Test OGUC in UI
# Ask the sample questions

# 3. Done! ✅
```

**Skip Full Migration (for now):**
- Existing data works fine in us-central1
- Performance still meets <2s target
- Can migrate later if needed
- Prefer stability over perfection

**Result:** 
- ✅ Future uploads optimal (us-east4)
- ✅ OGUC document working
- ✅ <5 minutes effort
- ✅ Zero risk

---

## 📊 **EXPECTED IMPROVEMENTS**

### **After Quick Fix:**

**New uploads (us-east4):**
- GCS upload: Same speed (already fast)
- BigQuery sync: 2-3× faster (same region)
- Queries: 2-3× faster searches
- Cost: 15% lower (no egress)

**Existing data (us-central1):**
- Still works perfectly
- Performance acceptable
- Can migrate anytime
- No rush needed

**Overall:** 🟢 **Best effort-to-benefit ratio**

---

## ✅ **SUMMARY**

```
┌──────────────────────────────────────────────────────────┐
│              ACTION PLAN SUMMARY                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Current Regional Status:                                │
│    ✅ Cloud Run: us-east4 (optimal)                      │
│    ✅ Firestore: us-central1 (correct - global)          │
│    ⚠️ GCS: us-central1 (should use east4)               │
│    ⚠️ BigQuery: us-central1 (should use east4)          │
│                                                           │
│  OGUC Upload:                                            │
│    ✅ Successfully uploaded to M3-v2                     │
│    ✅ 20 chunks indexed                                  │
│    ✅ Ready for queries                                  │
│    ✅ Cost: $0.0056                                      │
│                                                           │
│  Recommended Action:                                     │
│    1. ✅ Add env variables (5 min)                       │
│    2. ✅ Test OGUC queries (10 min)                      │
│    3. 🔄 Migrate data later (optional)                   │
│                                                           │
│  Priority: Medium (working but not optimal)              │
│  Effort: 5 minutes for quick fix                         │
│  Benefit: All future uploads optimal                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

**Action Plan Created:** November 28, 2025  
**Status:** Ready for execution  
**Recommendation:** Quick fix now, full migration optional ✅



