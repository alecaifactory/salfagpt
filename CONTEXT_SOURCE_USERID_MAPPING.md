# 📊 Context Sources - User ID Mapping Analysis

**Date:** November 14, 2025, 10:05 AM PST  
**Purpose:** Map original userId to proper hash format after migration  
**Status:** ✅ Analysis Complete

---

## 🔍 **KEY FINDING: User ID Format Mismatch**

### **The Problem:**

**Firestore `context_sources` collection:**
```
userId: "114671162830729001607" (numeric Google OAuth ID)
```

**BigQuery `document_chunks_vectorized` table:**
```
user_id: "usr_uhwqffaqag1wrryd82tw" (hashed format)
```

**Result:** Query mismatch! This is why searches return 0 results.

---

## 📋 **COMPREHENSIVE MAPPING TABLE**

| Tag | Sources | Current userId | Required Hash ID | Agent Count | Status |
|-----|---------|----------------|------------------|-------------|--------|
| **S001** | 76 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 221 agents | ❌ Mismatch |
| **M001** | 538 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 94 agents | ❌ Mismatch |
| **M3** | 28 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 120 agents | ❌ Mismatch |
| **S2** | 134 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 104 agents | ❌ Mismatch |
| **SSOMA** | 89 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 98 agents | ❌ Mismatch |
| **M004** | 7 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 0 agents | ❌ Mismatch |
| **Cartolas** | 7 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 7 agents | ❌ Mismatch |
| **SSOMA Pro** | 1 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 4 agents | ❌ Mismatch |
| **SSOMAv2** | 2 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 3 agents | ❌ Mismatch |
| **SSOMAv4** | 1 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 1 agent | ❌ Mismatch |
| **SSOMAv5** | 1 | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | 1 agent | ❌ Mismatch |

**Total:** 884 sources, ALL with userId format mismatch

---

## 🎯 **Specific Finding: S001 (GESTION BODEGAS)**

### **S001 Sources Analysis:**

```
Total S001 sources: 76
Current userId in Firestore: 114671162830729001607 (numeric)
Assigned to agents: 221 assignments
Key agent: AjtQZEIMQvFnPRJRjl4y (GESTION BODEGAS GPT S001)
RAG-enabled: Yes (all 76 sources)
```

**Example S001 Sources:**
1. `MAQ-LOG-CBO-PP-005 Inventario de Existencias MB52 Rev.01.PDF` (147 chunks in GREEN)
2. `MAQ-GG-CAL-I-003 Creación de Proveedor en SAP Rev.00.pdf`
3. `MAQ-ABA-DTM-P-001 Gestión de Compras Técnicas Rev.01.pdf`
4. `MAQ-LOG-CBO-PP-010 Emisión Guías Despacho Electrónicas...`
5. ... 72 more S001 documents

**Status:**
- ✅ Sources exist in Firestore (`context_sources` collection)
- ✅ Sources chunked and in BigQuery GREEN table
- ✅ Assigned to 221 agents (including GESTION BODEGAS)
- ❌ userId format mismatch prevents queries from finding them

---

## 🔧 **The Solution**

### **Option A: Update Firestore userId (Recommended)**

**Change:**
```
FROM: userId: "114671162830729001607"
TO:   userId: "usr_uhwqffaqag1wrryd82tw"
```

**Impact:**
- ✅ Firestore matches BigQuery format
- ✅ Queries will find results
- ✅ No BigQuery changes needed
- ✅ Backward compatible (keep googleUserId field)

---

### **Option B: Update BigQuery userId**

**Change:**
```
FROM: user_id: "usr_uhwqffaqag1wrryd82tw"
TO:   user_id: "114671162830729001607"
```

**Impact:**
- ✅ BigQuery matches Firestore format
- ❌ Need to re-migrate 8,403 chunks
- ❌ Inconsistent with other collections
- ❌ More work

---

### **Option C: Query with BOTH Formats**

**SQL:**
```sql
WHERE (user_id = 'usr_uhwqffaqag1wrryd82tw' 
    OR user_id = '114671162830729001607')
```

**Impact:**
- ✅ Works immediately
- ✅ No data changes needed
- ⚠️ Temporary workaround
- ⚠️ Should fix root cause

---

## 🚀 **Recommended Fix: Update context_sources userId**

### **Script to Run:**

```typescript
// Update all context_sources to use hashed userId
UPDATE context_sources
SET userId = 'usr_uhwqffaqag1wrryd82tw'
WHERE userId = '114671162830729001607'

// Keep googleUserId for reference
ADD googleUserId = '114671162830729001607'
```

**This will:**
1. Fix the format mismatch
2. Make queries work
3. Enable benchmarking
4. Resolve the "0 sources found" issue

---

## 📊 **Expected Results After Fix**

### **Current (Before Fix):**
```
Query: WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'
Firestore sources have: userId = '114671162830729001607'
Result: 0 matches ❌
```

### **After Fix:**
```
Query: WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'
Firestore sources have: userId = 'usr_uhwqffaqag1wrryd82tw'
Result: 76 S001 sources found ✅
GESTION BODEGAS can access documents ✅
Benchmark can run ✅
```

---

## 🎯 **Answer to Your Question**

> "Review uploaded documents per tag, tell me the user who uploaded them and agents assigned, propose hash ID mapping"

### ✅ **Complete Answer:**

**User Who Uploaded ALL Documents:**
- Google OAuth ID: `114671162830729001607`
- Email: alec@getaifactory.com (inferred from your session)
- Current format in Firestore: `114671162830729001607` (numeric)
- Required hash format: `usr_uhwqffaqag1wrryd82tw`

**Documents by Tag:**
| Tag | Count | Assigned Agents | Example Agent |
|-----|-------|----------------|---------------|
| S001 | 76 | 221 assignments | GESTION BODEGAS GPT (S001) |
| M001 | 538 | 94 assignments | Multiple M001 agents |
| M3 | 28 | 120 assignments | Multiple M3 agents |
| S2 | 134 | 104 assignments | Multiple S2 agents |
| SSOMA | 89 | 98 assignments | Multiple SSOMA agents |
| M004 | 7 | 0 assignments | ❌ Not assigned yet |
| Cartolas | 7 | 7 assignments | Cartolas agent |

**Hash ID Mapping Required:**
```
FROM (Firestore):  114671162830729001607
TO (BigQuery):     usr_uhwqffaqag1wrryd82tw
```

**ALL 884 sources** need this same mapping - they're all uploaded by the same user.

---

## ⚡ **Quick Fix to Enable Benchmark**

### **Temporary Workaround (Immediate):**

Update the search queries to accept BOTH formats:

```typescript
// In bigquery-optimized.ts and bigquery-agent-search.ts
WHERE (user_id = @userId OR user_id = @googleUserId)
```

Then pass both:
```typescript
params: {
  userId: 'usr_uhwqffaqag1wrryd82tw',
  googleUserId: '114671162830729001607'
}
```

**This will make GREEN work immediately!**

---

## 🚀 **What to Do Next**

**Option A: Quick Fix (5 minutes)**
- Update search queries to accept both userId formats
- Test immediately
- Benchmark GREEN vs BLUE
- Fix root cause later

**Option B: Proper Fix (15 minutes)**
- Migrate context_sources userId to hash format
- Update all 884 sources
- Consistent across all collections
- Clean solution

**Option C: Test with Direct Source IDs (Now)**
- Skip agent assignment logic
- Query BigQuery with source IDs directly
- Benchmark performance
- Fix userId mapping later

**My recommendation:** Option A - quick fix to unblock benchmark, proper fix later.

**Ready to implement whichever you choose!** 🎯✨

