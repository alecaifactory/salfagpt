# 🚀 Parallel Upload Limits & Strategy

**Date:** November 25, 2025

---

## 🔍 **API RATE LIMITS**

### Gemini API (Extraction)
- **Concurrent requests:** 60 requests/minute (free tier)
- **Recommended parallel:** 10-15 concurrent for safety
- **Our use:** gemini-2.5-flash (extraction)

### Google Cloud Storage (Upload)
- **Concurrent uploads:** No hard limit
- **Recommended:** 20-50 concurrent
- **Network limited:** By your bandwidth

### Firestore (Database)
- **Concurrent writes:** 10,000/second (no issue)
- **Batch operations:** 500 operations per batch
- **No bottleneck** for our use case

### Embedding API (text-embedding-004)
- **Concurrent requests:** 60 requests/minute (free tier)
- **Recommended parallel:** 10-15 concurrent
- **Batch size:** 100 chunks per request (already optimized)

### BigQuery (Insert)
- **Concurrent inserts:** No hard limit
- **Batch size:** 500 rows recommended (already optimized)
- **No bottleneck**

---

## 🎯 **RECOMMENDED PARALLEL STRATEGY**

### Conservative: 10 files in parallel
- **Why:** Stays well under Gemini API limits (60/min)
- **Speed:** 6× faster than sequential
- **Risk:** Low (easy to debug)
- **Best for:** First run, testing

### Aggressive: 20 files in parallel
- **Why:** Maximizes throughput while safe
- **Speed:** 12× faster than sequential
- **Risk:** Moderate (may hit rate limits occasionally)
- **Best for:** Production, batch uploads

### Maximum: 30 files in parallel
- **Why:** Near API limit (60/min with 2min/file = 30 concurrent)
- **Speed:** 18× faster than sequential
- **Risk:** Higher (will hit rate limits, need retry logic)
- **Best for:** Emergency bulk uploads with monitoring

---

## ✅ **RECOMMENDED: 15 PARALLEL**

**Sweet spot:**
- Under API limits (60/min ÷ 15 = 4 files/min = safe)
- Fast (15× speedup vs sequential)
- Reliable (room for retry)
- Manageable (good error visibility)

**For 62 files:**
```
Sequential: 62 files × 60s = 62 minutes
Parallel (15): 62 files ÷ 15 = 5 batches × 60s = ~6-8 minutes ⚡
```

**Speedup: 8-10× faster!** 🚀

---

## 🔧 **IMPLEMENTATION STRATEGY**

### Batch Parallel Processing

```typescript
const PARALLEL_UPLOADS = 15; // Concurrent files

// Process in batches
for (let i = 0; i < files.length; i += PARALLEL_UPLOADS) {
  const batch = files.slice(i, i + PARALLEL_UPLOADS);
  
  // Process this batch in parallel
  const results = await Promise.allSettled(
    batch.map(file => uploadSingleFile(file, config))
  );
  
  // Log results
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ File ${i + idx + 1}: Success`);
    } else {
      console.error(`❌ File ${i + idx + 1}: Failed -`, result.reason);
    }
  });
}
```

**Benefits:**
- ✅ Controlled parallelism (15 at a time)
- ✅ Clear batch boundaries
- ✅ Good error handling per batch
- ✅ Progress visibility per batch

---

**Implementing now with 15 parallel uploads...**


