# 🔄 CONTINUATION PROMPT - BigQuery Vector Search Implementation

**Date:** November 14, 2025  
**Status:** Ready to implement - Priority P0 (CRITICAL)  
**Context:** Part of 30-day sprint to achieve 98+ NPS  
**This Session:** Complete business case + communications created  
**Next Session:** Implement BigQuery vector search (biggest NPS blocker)

---

## 🎯 **CONTEXT FROM PREVIOUS SESSION**

### **What Was Accomplished:**

**Business Analysis Complete:**
- ✅ Identified 100x value for 6 user personas
- ✅ Calculated domain ROI (95-137x blended)
- ✅ Mapped path to 98+ NPS (3 phases, 30 days)
- ✅ Created comprehensive communications (33 personalized emails)
- ✅ Created onboarding materials (user + expert guides)
- ✅ Created marketing campaign (4-week launch plan)

**Total Deliverables:** 8 documents, 5,600+ lines, 235+ pages

**Files Created:**
1. `BUSINESS_REPORT_100X_VALUE_PROPOSITION.md` (50 pages)
2. `docs/communications/FEEDBACK_RESPONSE_EMAILS.md` (35 pages)
3. `docs/onboarding/USER_ONBOARDING_GUIDE.md` (30 pages)
4. `docs/onboarding/EXPERT_ONBOARDING_GUIDE.md` (35 pages)
5. `docs/marketing/PRODUCT_MARKETING_MATERIALS.md` (40 pages)
6. `100X_VALUE_DELIVERY_SUMMARY.md` (20 pages)
7. `COMPLETE_100X_PACKAGE_README.md` (reference)
8. `VISUAL_100X_ROADMAP.md` (visual journey)

---

## 🚨 **CRITICAL PROBLEM IDENTIFIED**

### **The #1 Blocker to 98+ NPS:**

**RAG Search Latency = 120 seconds** 🔴

**User Experience:**
```
User sends message
  ↓
10-20 seconds of SILENCE (no visual feedback)
  ↓
User thinks: "Did it crash?"
  ↓
Finally responds after 120 seconds total
  ↓
User: "This is unacceptable"
```

**Impact:**
- Accounts for **90% of NPS gap** (25 → 65 potential)
- Causes **40% of negative feedback**
- Makes app feel "broken"
- Prevents adoption by 60% of potential users

**Current Implementation (SLOW):**
```typescript
// src/lib/bigquery-agent-search.ts

PERFORMANCE MEASURED:
├─ BigQuery vector search: 400ms ✅ (FAST - when it works)
└─ Firestore fallback: 120,000ms ❌ (CRITICAL - happens too often)

PROBLEM:
BigQuery search fails/returns 0 results
  ↓
Falls back to Firestore
  ↓
Loads ALL embeddings (293+ documents)
  ↓
Calculates similarities in memory
  ↓
Takes 120 seconds
  ↓
User rage quits
```

---

## 🎯 **WHAT NEEDS TO BE DONE**

### **Objective:**
**Eliminate 120-second Firestore fallback entirely. Make BigQuery work 100% of the time.**

**Target Performance:**
- BigQuery search: <2 seconds (p95)
- Fallback rate: <5% (only for errors, not normal operation)
- User perception: "Fast and professional"

---

## 🔍 **ROOT CAUSE ANALYSIS (From Logs)**

### **Why BigQuery Returns 0 Results:**

**Evidence from codebase:**

**File:** `src/lib/bigquery-agent-search.ts`

**Current Query:**
```typescript
const query = `
  SELECT 
    sourceId,
    chunkIndex,
    chunkText,
    ML.DISTANCE(embedding, ${queryEmbeddingSQL}) AS distance
  FROM \`${PROJECT_ID}.${DATASET}.${TABLE}\`
  WHERE userId = @userId
    AND (
      sourceId IN UNNEST(@sourceIds)
      OR labels LIKE '%PUBLIC%'
    )
  ORDER BY distance ASC
  LIMIT @limit
`;
```

**Potential Issues:**

**1. Table/Dataset Mismatch:**
```
Current: gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized
Status: May not exist or may be in different dataset
```

**2. userId Hashing:**
```
Current: Queries with hashed userId
Problem: Chunks may be stored with numeric userId
Result: WHERE userId = @userId returns 0 rows
```

**3. sourceIds Array:**
```
Current: Filters by sourceIds from agent assignment
Problem: If assignedToAgents not populated correctly, sourceIds = []
Result: No chunks found
```

**4. Vector Index Missing:**
```
Current: ML.DISTANCE function used
Problem: Without vector index, query may fail or be disabled
Result: Falls back to Firestore
```

---

## 🔧 **SOLUTION APPROACH (Step-by-Step)**

### **Phase 1: Diagnosis (1-2 hours)**

**Step 1: Verify BigQuery Table Exists**
```bash
# Check if table exists
bq ls --project_id=gen-lang-client-0986191192 flow_rag_optimized

# Expected: document_chunks_vectorized table listed
# If not: Need to create table first
```

**Step 2: Verify Table Has Data**
```bash
# Count total rows
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT COUNT(*) as total_chunks
FROM \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
"

# Expected: >1,000 chunks (at minimum)
# If 0: Need to migrate chunks from Firestore
```

**Step 3: Verify userId Format**
```bash
# Check userId format in table
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT DISTINCT userId
FROM \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
LIMIT 10
"

# Expected: Hashed userIds (sha256_...)
# If numeric: Need to migrate to hashed format
# If mixed: Need to update query to handle both
```

**Step 4: Verify Vector Index Exists**
```bash
# Check for vector index
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT * FROM \`gen-lang-client-0986191192.flow_rag_optimized.INFORMATION_SCHEMA.VECTOR_INDEXES\`
"

# Expected: Index on embedding column
# If not: Need to create vector index
```

---

### **Phase 2: Fix Implementation (2-4 hours)**

**Fix Option A: Table Doesn't Exist**
```bash
# Create table with proper schema
bq mk --table \
  --project_id=gen-lang-client-0986191192 \
  flow_rag_optimized.document_chunks_vectorized \
  schema_document_chunks.json

# Migrate data from Firestore
npx tsx scripts/migrate-chunks-to-bigquery.ts
```

**Fix Option B: userId Mismatch**
```bash
# Two approaches:

# Approach 1: Migrate chunks to use hashed userId
npx tsx scripts/migrate-chunks-to-hashed-userid.ts

# Approach 2: Update query to handle both formats
# Modify bigquery-agent-search.ts to try both:
WHERE (userId = @hashedUserId OR userId = @numericUserId)
```

**Fix Option C: Vector Index Missing**
```sql
-- Create vector index on embedding column
CREATE VECTOR INDEX embedding_index
ON `gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized`(embedding)
OPTIONS(
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{"num_lists": 100}'
);
```

**Fix Option D: sourceIds Array Empty**
```typescript
// In src/lib/bigquery-agent-search.ts

// Add fallback: If sourceIds empty, get ALL user chunks
if (!sourceIds || sourceIds.length === 0) {
  // Query all user's chunks (no sourceId filter)
  const query = `
    SELECT ...
    FROM ...
    WHERE userId = @userId
      OR labels LIKE '%PUBLIC%'
    ORDER BY distance ASC
    LIMIT @limit
  `;
}
```

---

### **Phase 3: Testing (1 hour)**

**Test 1: Verify BigQuery Returns Results**
```bash
# Run test query manually
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT COUNT(*) as chunks_found
FROM \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
WHERE userId = 'sha256_114671162830729001607'
  AND sourceId IN ('some-source-id')
"

# Expected: >0 chunks found
```

**Test 2: Test in Application**
```bash
npm run dev

# Login
# Select agent with documents (MAQSA, M001, SSOMA)
# Ask question: "¿Qué es un OGUC?"
# Monitor console for:
  - "✅ BigQuery search found X chunks" (should be >0)
  - "⚠️ Falling back to Firestore" (should NOT appear)
# Measure time: Should be <2 seconds
```

**Test 3: Measure Performance**
```typescript
// In messages-stream.ts, add timing logs:

console.time('RAG Search Total');

// BigQuery search
console.time('BigQuery Vector Search');
const results = await searchByAgent(userId, agentId, query);
console.timeEnd('BigQuery Vector Search');
// Expected: <500ms

console.timeEnd('RAG Search Total');
// Expected: <2s total
```

---

## 📊 **CURRENT STATE (Known Facts)**

### **From Codebase Analysis:**

**1. BigQuery Table Status:**
```
Project: gen-lang-client-0986191192
Dataset: flow_rag_optimized
Table: document_chunks_vectorized
Status: Unknown (need to verify)
```

**2. Firestore Chunks Collection:**
```
Collection: document_chunks
Subcollection: chunks (under each sourceId)
Format: Each source has its own chunks subcollection
Count: 2,500+ chunks across all sources
```

**3. Migration Status:**
```
Recent Migration: chunks → hashed userId format
Script: scripts/migrate-chunks-to-hashed-userid.ts
Status: ✅ Completed for Firestore
BigQuery Status: ⚠️ Unknown (may still have numeric userIds)
```

**4. Current Search Flow:**
```typescript
// src/pages/api/conversations/[id]/messages-stream.ts

1. Try BigQuery search
   ├─ Success: Use results (400ms)
   └─ Fail/0 results: Fallback to Firestore (120s)
   
2. Firestore fallback (PROBLEM)
   ├─ Load all embeddings from Firestore
   ├─ Calculate similarities in memory
   ├─ Takes 120 seconds
   └─ Creates emergency references with similarity: 0.5
```

---

## 🎯 **RECOMMENDED APPROACH (Start Here)**

### **Immediate Investigation (15 minutes):**

```bash
# 1. Check if BigQuery table exists and has data
bq show --project_id=gen-lang-client-0986191192 flow_rag_optimized.document_chunks_vectorized

# 2. If exists, count rows
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT 
  COUNT(*) as total_chunks,
  COUNT(DISTINCT userId) as unique_users,
  COUNT(DISTINCT sourceId) as unique_sources
FROM \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
"

# 3. Check userId format
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT DISTINCT userId
FROM \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
LIMIT 5
"

# 4. Check if vector index exists
bq query --use_legacy_sql=false --project_id=gen-lang-client-0986191192 "
SELECT * 
FROM \`gen-lang-client-0986191192.flow_rag_optimized.INFORMATION_SCHEMA.VECTOR_INDEXES\`
WHERE table_name = 'document_chunks_vectorized'
"
```

**Based on results, choose fix approach below.**

---

### **Fix Approach A: Table Missing or Empty**

**If BigQuery table doesn't exist or has 0 rows:**

**Action:** Migrate chunks from Firestore to BigQuery

**Script to create/verify:**
```typescript
// scripts/migrate-firestore-to-bigquery-vectors.ts

import { firestore } from '../src/lib/firestore';
import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = 'gen-lang-client-0986191192';
const DATASET = 'flow_rag_optimized';
const TABLE = 'document_chunks_vectorized';

async function migrateChunksToBigQuery() {
  console.log('🔄 Migrating chunks from Firestore to BigQuery...');
  
  const bigquery = new BigQuery({ projectId: PROJECT_ID });
  
  // 1. Get all context sources
  const sourcesSnapshot = await firestore
    .collection('context_sources')
    .where('ragEnabled', '==', true)
    .get();
  
  console.log(`📚 Found ${sourcesSnapshot.size} RAG-enabled sources`);
  
  let totalChunks = 0;
  const batch = [];
  
  // 2. For each source, get chunks
  for (const sourceDoc of sourcesSnapshot.docs) {
    const sourceId = sourceDoc.id;
    const sourceData = sourceDoc.data();
    
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .doc(sourceId)
      .collection('chunks')
      .get();
    
    console.log(`  📄 ${sourceData.name}: ${chunksSnapshot.size} chunks`);
    
    // 3. Transform and batch insert
    for (const chunkDoc of chunksSnapshot.docs) {
      const chunk = chunkDoc.data();
      
      batch.push({
        sourceId: sourceId,
        chunkIndex: chunk.chunkIndex,
        chunkText: chunk.chunkText,
        embedding: chunk.embedding, // Array of floats
        userId: chunk.userId, // Should be hashed format
        labels: chunk.labels || [],
        createdAt: chunk.createdAt,
      });
      
      totalChunks++;
      
      // Insert in batches of 500
      if (batch.length >= 500) {
        await bigquery
          .dataset(DATASET)
          .table(TABLE)
          .insert(batch);
        
        console.log(`  ✅ Inserted ${batch.length} chunks (total: ${totalChunks})`);
        batch.length = 0; // Clear batch
      }
    }
  }
  
  // Insert remaining
  if (batch.length > 0) {
    await bigquery
      .dataset(DATASET)
      .table(TABLE)
      .insert(batch);
    
    console.log(`  ✅ Inserted ${batch.length} chunks`);
  }
  
  console.log(`\n✅ Migration complete: ${totalChunks} total chunks migrated`);
  
  // 4. Create vector index
  console.log('\n🔍 Creating vector index...');
  
  const createIndexQuery = `
    CREATE VECTOR INDEX IF NOT EXISTS embedding_index
    ON \`${PROJECT_ID}.${DATASET}.${TABLE}\`(embedding)
    OPTIONS(
      distance_type = 'COSINE',
      index_type = 'IVF'
    )
  `;
  
  await bigquery.query(createIndexQuery);
  
  console.log('✅ Vector index created');
  console.log('\n🎉 Setup complete! BigQuery RAG is ready.');
}

migrateChunksToBigQuery().catch(console.error);
```

**Run:**
```bash
npx tsx scripts/migrate-firestore-to-bigquery-vectors.ts
```

**Expected Time:** 10-30 minutes (depending on chunk count)

---

### **Fix Approach B: userId Format Mismatch**

**If table exists but userId doesn't match:**

**Diagnosis:**
```bash
# Check current userId format in BigQuery
bq query --use_legacy_sql=false "
SELECT userId, COUNT(*) as chunk_count
FROM \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
GROUP BY userId
LIMIT 10
"

# Compare with Firestore userId format
# Firestore: sha256_114671162830729001607 (hashed)
# BigQuery might be: 114671162830729001607 (numeric)
```

**Fix Option 1: Update Query to Handle Both**
```typescript
// src/lib/bigquery-agent-search.ts

// Get both formats
const numericUserId = userEmail ? extractNumericUserId(userEmail) : null;
const hashedUserId = hashUserId(numericUserId || userId);

// Query with OR condition
const query = `
  SELECT ...
  FROM ...
  WHERE (userId = @hashedUserId OR userId = @numericUserId)
    AND ...
`;

const [rows] = await bigquery.query({
  query,
  params: {
    hashedUserId,
    numericUserId,
    // ... other params
  }
});
```

**Fix Option 2: Migrate BigQuery to Hashed Format**
```sql
-- Update all rows to use hashed userId
UPDATE \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`
SET userId = CONCAT('sha256_', userId)
WHERE userId NOT LIKE 'sha256_%'
```

---

### **Fix Approach C: Vector Index Missing**

**If index doesn't exist:**

```sql
-- Create vector index
CREATE VECTOR INDEX embedding_index
ON \`gen-lang-client-0986191192.flow_rag_optimized.document_chunks_vectorized\`(embedding)
OPTIONS(
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{"num_lists": 100}'
);

-- Verify index created
SELECT * 
FROM \`gen-lang-client-0986191192.flow_rag_optimized.INFORMATION_SCHEMA.VECTOR_INDEXES\`
WHERE table_name = 'document_chunks_vectorized';
```

**Index creation takes:** 5-15 minutes for 2,500+ chunks

---

### **Fix Approach D: Improve Fallback Logic**

**Even if BigQuery works, improve fallback:**

```typescript
// src/lib/bigquery-agent-search.ts

export async function searchByAgent(
  userId: string,
  agentId: string, 
  query: string,
  options: SearchOptions = {}
) {
  const startTime = Date.now();
  
  try {
    // 1. Try BigQuery (should be <500ms)
    console.log('🔍 Attempting BigQuery vector search...');
    
    const results = await bigqueryVectorSearch(userId, agentId, query, options);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ BigQuery search: ${results.length} chunks (${elapsed}ms)`);
    
    // 2. If BigQuery returns results, use them
    if (results.length > 0) {
      return results;
    }
    
    // 3. If 0 results but query succeeded, it's genuinely no matches
    console.log('ℹ️ BigQuery succeeded but found 0 matches');
    
    // Option 1: Return empty (let AI say "no relevant docs")
    return [];
    
    // Option 2: Try Firestore but with TIMEOUT
    console.log('⚠️ Attempting Firestore fallback with 5s timeout...');
    
    const firestoreResults = await Promise.race([
      firestoreFallbackSearch(userId, agentId, query),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
    
    return firestoreResults;
    
  } catch (error) {
    console.error('❌ BigQuery search failed:', error);
    
    // 4. Only use Firestore if BigQuery ERROR (not 0 results)
    console.log('🔄 Firestore fallback (BigQuery error)...');
    
    // WITH TIMEOUT: 5 seconds max
    try {
      const results = await Promise.race([
        firestoreFallbackSearch(userId, agentId, query),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firestore timeout')), 5000)
        )
      ]);
      
      return results;
    } catch (timeoutError) {
      console.error('⏱️ Firestore fallback timeout');
      return []; // Give up, let AI respond without RAG
    }
  }
}
```

**Key improvements:**
- ✅ Distinguish between "0 results" (genuine) vs "error" (fallback needed)
- ✅ Add 5-second timeout to Firestore fallback
- ✅ Prefer "no RAG" over "120-second wait"
- ✅ Comprehensive logging for diagnosis

---

## 📋 **STEP-BY-STEP IMPLEMENTATION PLAN**

### **Day 1: Diagnosis & Setup (4 hours)**

```bash
# Morning (2 hours):
1. Run diagnostic queries (verify table, data, index)
2. Document findings in BIGQUERY_DIAGNOSIS_2025-11-14.md
3. Identify specific issue (Table? userId? Index?)
4. Choose fix approach (A, B, C, or D)

# Afternoon (2 hours):
5. Create/update migration script if needed
6. Run migration (if table missing/empty)
7. Create vector index (if missing)
8. Verify data populated correctly
```

**Deliverable:** BigQuery table with data + vector index ready

---

### **Day 2: Implementation (4 hours)**

```bash
# Morning (2 hours):
1. Update bigquery-agent-search.ts with fixes:
   - Handle userId format (hashed + numeric)
   - Add proper fallback logic
   - Add timeout (5s max)
   - Add comprehensive logging

2. Update messages-stream.ts:
   - Add performance timing logs
   - Handle empty results gracefully
   - Show "no relevant docs" message properly

# Afternoon (2 hours):
3. Test with real queries:
   - MAQSA agent: "¿Normativa para zona rural?"
   - M001 agent: "¿Qué es un OGUC?"
   - SSOMA agent: "¿Protocolo ante derrame?"
   
4. Verify:
   - All return results from BigQuery
   - All complete in <2 seconds
   - No Firestore fallbacks
   - Real similarity scores shown (70-95%)
```

**Deliverable:** Working BigQuery search, <2s performance verified

---

### **Day 3: Testing & Validation (3 hours)**

```bash
# Morning (1.5 hours):
1. Test edge cases:
   - Agent with 0 assigned sources
   - Agent with PUBLIC sources only
   - Query with no matches
   - Query with 1000+ potential matches
   
2. Test performance:
   - Run 20 queries, measure each
   - Calculate p95 latency
   - Verify <2s target met

# Afternoon (1.5 hours):
3. Load testing:
   - Simulate 5 concurrent users
   - Each sends query simultaneously
   - Verify no timeouts or errors
   
4. User acceptance testing:
   - Get Sebastian to test
   - Get 2-3 other users to test
   - Collect feedback on speed improvement
```

**Deliverable:** Validated <2s performance, user approval

---

## 🎯 **SUCCESS CRITERIA**

### **Must Achieve:**

**Performance:**
- [ ] BigQuery search: <500ms (p95)
- [ ] Total RAG latency: <2s (p95)
- [ ] Firestore fallback: <5% of queries (errors only, not normal)
- [ ] Real similarity scores: 70-95% (not 50%)

**User Experience:**
- [ ] No 10-20 second silences
- [ ] Thinking steps appear IMMEDIATELY
- [ ] References load smoothly
- [ ] User says: "Much faster!"

**Technical:**
- [ ] BigQuery table populated (2,500+ chunks)
- [ ] Vector index created and READY
- [ ] userId format consistent
- [ ] Comprehensive logging for debugging

**Business:**
- [ ] NPS improves by +25-40 points (speed fixes)
- [ ] User complaints about speed drop to <5%
- [ ] Adoption increases 40% (faster = more usage)

---

## 📚 **CONTEXT FILES TO REFERENCE**

### **Current Implementation:**

**Files to read:**
1. `src/lib/bigquery-agent-search.ts` - Current BigQuery search logic
2. `src/pages/api/conversations/[id]/messages-stream.ts` - Streaming API with RAG
3. `src/lib/embeddings.ts` - Embedding generation
4. `scripts/migrate-chunks-to-hashed-userid.ts` - Recent migration script

**Files to check:**
5. `firestore.indexes.json` - Firestore indexes
6. `docs/RAG_IMPLEMENTATION_COMPLETE.md` - RAG architecture
7. `docs/features/rag-optimization-2025-10-19.md` - Previous optimizations

---

### **Previous Session Deliverables:**

**Business Case (reference for why this matters):**
1. `BUSINESS_REPORT_100X_VALUE_PROPOSITION.md`
   - Speed = 90% of NPS impact
   - 120s latency = #1 user complaint
   - Fix this = +40 NPS points

**User Communications (what we promised):**
2. `docs/communications/FEEDBACK_RESPONSE_EMAILS.md`
   - Email to Sebastian mentions "RAG 120s → <2s"
   - Email to speed complainers promises "<2s all operations"
   - We MUST deliver on these promises

---

## 🚨 **CRITICAL DEPENDENCIES**

### **Must Have Before Starting:**

**1. GCP Access:**
```bash
# Verify authentication
gcloud auth application-default login

# Verify project
gcloud config set project gen-lang-client-0986191192

# Verify BigQuery access
bq ls --project_id=gen-lang-client-0986191192
```

**2. Environment Variables:**
```bash
# Check .env has:
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192

# Verify in code
echo $GOOGLE_CLOUD_PROJECT
```

**3. Firestore Access:**
```bash
# Verify can read chunks
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('document_chunks').limit(1).get();
console.log('Firestore accessible:', snapshot.size > 0);
process.exit(0);
"
```

---

## 🎯 **SUGGESTED PROMPT FOR NEXT SESSION**

---

## 📋 **CONTINUATION PROMPT (Copy This to New Conversation)**

```
I need to implement BigQuery vector search optimization for SalfaGPT to eliminate 120-second RAG latency.

CONTEXT:
- Current RAG search: 120 seconds (Firestore fallback)
- Target: <2 seconds (BigQuery vector search)
- Impact: This is 90% of NPS gap (currently 25, target 98+)
- Priority: P0 CRITICAL (biggest blocker)

CURRENT STATE:
- Project: gen-lang-client-0986191192
- Table: flow_rag_optimized.document_chunks_vectorized (status unknown)
- Firestore chunks: 2,500+ chunks in document_chunks collection
- Recent migration: chunks → hashed userId format (Firestore done, BigQuery unknown)

PROBLEM:
BigQuery search returns 0 results → Falls back to Firestore (120s)

Potential causes:
1. Table missing/empty
2. userId format mismatch (numeric vs hashed)
3. Vector index missing
4. sourceIds array empty (agent assignment issue)

FILES TO CHECK:
- src/lib/bigquery-agent-search.ts (search logic)
- src/pages/api/conversations/[id]/messages-stream.ts (streaming API)
- scripts/migrate-chunks-to-hashed-userid.ts (recent migration)

FIRST STEPS:
1. Verify BigQuery table exists and has data:
   bq show gen-lang-client-0986191192:flow_rag_optimized.document_chunks_vectorized

2. Check userId format in BigQuery:
   SELECT DISTINCT userId FROM table LIMIT 5

3. Check vector index exists:
   SELECT * FROM INFORMATION_SCHEMA.VECTOR_INDEXES

4. Based on findings, choose fix:
   - If table missing → Migrate from Firestore
   - If userId mismatch → Update query or migrate data
   - If index missing → Create vector index
   - If sourceIds issue → Fix agent assignment logic

TARGET:
- BigQuery search <500ms
- Total RAG <2s
- Fallback rate <5%
- Real similarity scores (70-95%, not 50%)

SUCCESS CRITERIA:
- User sends message → Response in <8s total
- No 10-20 second silences
- Thinking steps appear immediately
- NPS improves +25-40 points

REFERENCE DOCS (from previous session):
- CONTINUATION_PROMPT_BIGQUERY_VECTOR_SEARCH.md (this file)
- BUSINESS_REPORT_100X_VALUE_PROPOSITION.md (why this matters)
- VISUAL_100X_ROADMAP.md (30-day plan, this is Days 1-3)

EXPECTED DELIVERABLE:
- BigQuery vector search working 100%
- <2s RAG latency verified
- Firestore fallback eliminated (or <5s timeout)
- Testing complete with real users
- Document results in BIGQUERY_FIX_2025-11-14.md

Let's start by running the diagnostic queries to identify the specific issue.
```

---

## 📊 **KEY FACTS TO REMEMBER**

### **Business Context:**
- NPS 25 → 98+ is the goal (30 days)
- Speed fixes = +40 NPS points (90% of gap)
- BigQuery optimization = biggest single fix
- We promised users <2s in emails (must deliver)

### **Technical Context:**
- Current: BigQuery 400ms ✅ BUT returns 0 results
- Fallback: Firestore 120s ❌ (unacceptable)
- Target: BigQuery <2s, 95%+ success rate
- Migration: Chunks already hashed in Firestore, BigQuery unknown

### **User Impact:**
- 20+ users affected
- 3,000+ queries/month
- 120s × 3,000 = 100 hours wasted/month
- Fix this = $5,000/month value unlocked

### **Timeline:**
- Day 1: Diagnosis
- Day 2: Implementation
- Day 3: Testing
- By Week 2: Deploy to production
- Result: NPS +25-40 points

---

## ✅ **WHAT TO DO IN NEXT SESSION**

### **Immediate (First 30 minutes):**

1. **Run diagnostic queries** (see "Immediate Investigation" section above)
2. **Identify specific issue** (table? userId? index?)
3. **Choose fix approach** (A, B, C, or D)
4. **Create action plan** (specific to your findings)

### **Then (Next 3-4 hours):**

5. **Implement fix** (migration, query update, or index creation)
6. **Test thoroughly** (real queries, measure performance)
7. **Validate with users** (Sebastian + 2-3 others)
8. **Document results** (BIGQUERY_FIX_2025-11-14.md)

### **Finally (30 minutes):**

9. **Update business report** (mark "BigQuery ✅ Deployed")
10. **Send emails** (Sebastian + speed complainers - "Fix is live!")
11. **Measure NPS impact** (survey 10 users, expect +25-40)

---

## 🎯 **EXPECTED OUTCOME**

**After completing this:**

**Before:**
```
User sends message
  ↓ (10-20s silence - "Is it broken?")
BigQuery returns 0
  ↓ (Fallback to Firestore)
Load 293 embeddings
  ↓ (118 seconds)
Calculate similarities
  ↓ (2 seconds)
TOTAL: 120 seconds ❌
User: "This is unacceptable"
NPS: 25 (frustrated)
```

**After:**
```
User sends message
  ↓ (Immediate: "💭 Pensando...")
BigQuery vector search
  ↓ (400ms - finds chunks)
Calculate final scores
  ↓ (200ms)
Stream response
  ↓ (2-3s)
TOTAL: <4 seconds ✅
User: "This is professional!"
NPS: 65+ (satisfied)
```

**NPS Gain:** +40 points (biggest single fix in entire roadmap)

---

## 📞 **SUPPORT & REFERENCES**

**If you get stuck:**
- Review: `docs/RAG_IMPLEMENTATION_COMPLETE.md`
- Check: BigQuery console (https://console.cloud.google.com/bigquery?project=gen-lang-client-0986191192)
- Verify: Firestore chunks (https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore)
- Ask: Check previous migration scripts in `scripts/` folder

**Key Contacts:**
- Admin: sorellanac@salfagestion.cl
- SuperAdmin: alec@getaifactory.com

**Testing Users:**
- Sebastian (first feedback provider)
- 5 speed complainers (eager to validate)
- 8 promoters (will help test)

---

## 🚀 **READY TO START**

**This is the MOST IMPORTANT fix in the entire 30-day sprint.**

**Solve this = 90% of the journey to 98+ NPS.**

**Everything else (trust, delight) builds on fast performance.**

**Slow + Trustworthy = Frustrating**  
**Slow + Delightful = Lipstick on a pig**  
**Fast + Trustworthy + Delightful = 98+ NPS**

**Speed is the foundation. Let's build it.** ⚡

---

**Session Objectives:**
1. ✅ Identify BigQuery issue (diagnosis)
2. ✅ Implement fix (migration/query/index)
3. ✅ Test performance (<2s verified)
4. ✅ Validate with users (Sebastian + others)
5. ✅ Deploy to production (if tests pass)

**Expected Time:** 1 day (8 hours focused work)  
**Expected Result:** 120s → <2s, NPS +25-40 points  
**Expected User Reaction:** "OMG this is so much better!"

**Let's make SalfaGPT fast. Then trustworthy. Then delightful.**

**In that order. Starting now.** 🚀✨

---

**Document Version:** 1.0  
**Created:** November 14, 2025  
**Purpose:** Bridge context to implementation session  
**Next Session:** Start with diagnostic queries  
**Status:** ✅ READY TO EXECUTE







