# 🔧 BigQuery Agent Filter Fix - Quick Reference

**Issue:** S2-v2 slow (5-10s responses)  
**Cause:** Missing agent_id filter  
**Solution:** Blue-Green deployment  
**Risk:** ZERO  
**Time:** 3 hrs today + 2 hrs tomorrow

---

## 🎯 **THE PROBLEM**

```
S2-v2 queries scan 60,992 chunks (ALL agents)
Should scan only 1,974 chunks (S2-v2 only)
Result: 5-10 second responses ⚠️
Target: <2 second responses ✅
```

---

## 🛡️ **THE SOLUTION (ZERO RISK)**

```
Blue-Green Deployment:

BLUE (old table):
  ✅ Never modified
  ✅ Always available
  ✅ Slow but stable

GREEN (new table):
  ✅ Built separately
  ✅ Has agent_id column
  ✅ Fast queries

Switch:
  ✅ Feature flag (instant rollback)
  ✅ Gradual rollout (safe)
  ✅ 30-second rollback if issues
```

---

## 📋 **THE PLAN**

### **Today (3 hours):**

```
1. Create table v2             (5 min)
2. Migrate data               (1-2 hours)
3. Update code                (30 min)
4. Test localhost             (30 min)
```

### **Tomorrow (2 hours):**

```
1. Deploy with flag OFF       (10 min)
2. Beta test (you only)       (30 min)
3. Enable for all            (1 min)
4. Monitor                   (1 hour)
```

### **Day 3-4:**

```
1. Monitor passively         (48 hours)
2. Validate success
```

---

## 🔑 **QUICK START (NEW CONVERSATION)**

```
Fix BigQuery slow queries for S2-v2.

Problem: 5-10s responses (scans 60,992 chunks)
Solution: Add agent_id filter (scan only 1,974 chunks)
Strategy: Blue-Green (zero risk, 30s rollback)

Steps:
1. CREATE TABLE document_embeddings_v2 (with agent_id)
2. Migrate 60,992 chunks with agent_id added
3. Update code with feature flag
4. Test localhost (all agents)
5. Deploy gradual (beta → all)

Timeline: 3 hrs today, 2 hrs tomorrow
Result: <2s queries (30× faster)

Use: CONTINUATION_PROMPT_BIGQUERY_AGENT_FILTER_FIX.md
```

---

## ⚡ **ROLLBACK (IF NEEDED)**

```bash
# Instant rollback (30 seconds):
gcloud run services update cr-salfagpt-ai-ft-prod \
  --update-env-vars="USE_BIGQUERY_V2=false" \
  --region us-east4

# Done! Back to old table (slow but working)
```

---

## ✅ **SUCCESS CRITERIA**

```
All agents: <2 seconds ✅
Errors: 0 ✅
Users happy: Yes ✅
Cost: 30× lower ✅
```

---

## 📞 **FULL DETAILS**

**Complete plan:** `CONTINUATION_PROMPT_BIGQUERY_AGENT_FILTER_FIX.md`  
**Diagnosis:** `S2V2_PERFORMANCE_DIAGNOSTIC.md`  
**Agent IDs:** `AGENT_IDS_VERIFIED.md`

---

**Risk:** ⬇️ ZERO  
**Confidence:** ⭐⭐⭐⭐⭐  
**Ready:** ✅ YES


