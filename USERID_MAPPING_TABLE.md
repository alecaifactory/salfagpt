# 📋 User ID Mapping Table - Complete Analysis

**Generated:** November 14, 2025, 10:05 AM PST  
**Purpose:** Map context sources to correct userId format for BigQuery compatibility

---

## 🎯 **EXECUTIVE SUMMARY**

### **The Core Issue:**

```
Firestore context_sources:  userId = "114671162830729001607" (numeric)
BigQuery chunks:            user_id = "usr_uhwqffaqag1wrryd82tw" (hashed)
Result:                     MISMATCH → 0 results found ❌
```

**Fix:** Update Firestore OR modify queries to handle both formats

---

## 📊 **MASTER MAPPING TABLE**

### **Single User - All Documents:**

| Original userId (Firestore) | Required Hash ID (BigQuery) | User Email | Google ID |
|----------------------------|----------------------------|------------|-----------|
| `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | alec@getaifactory.com | 114671162830729001607 |

**All 884 sources** uploaded by this single user require the same mapping.

---

## 📋 **DOCUMENTS BY TAG**

### **S001 - GESTION BODEGAS (76 sources)**

| Source ID | Document Name | Current userId | Required Hash | Assigned Agents | Status |
|-----------|--------------|----------------|---------------|----------------|--------|
| `9y08VbHvCu9Vvy6UgzKN` | MAQ-LOG-CBO-PP-005 Inventario MB52 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 221 | ❌ Mismatch |
| `0SueXFxB6CIKQqykkb0R` | MAQ-GG-CAL-I-003 Creación Proveedor SAP | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 221 | ❌ Mismatch |
| `7pPIwc3t7S442VJN31vf` | MAQ-ABA-DTM-P-001 Gestión Compras | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 221 | ❌ Mismatch |
| `7qPnJnVebWRhcM6hNQaF` | MAQ-LOG-CBO-PP-010 Guías Despacho | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 221 | ❌ Mismatch |
| `AtddS3CRBhlr2wW5N5h0` | MAQ-LOG-CT-PP-006 Solicitud Transporte | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 221 | ❌ Mismatch |
| ... | (71 more S001 sources) | Same | Same | 221 avg | Same |

**S001 Total:** 76 sources, 221 agent assignments, ALL need userId update

**Key Agent:** `AjtQZEIMQvFnPRJRjl4y` (GESTION BODEGAS GPT S001) ✅

---

### **M001 - NORMATIVA (538 sources)**

| Source ID | Document Name | Current userId | Required Hash | Assigned Agents | Status |
|-----------|--------------|----------------|---------------|----------------|--------|
| `01tZhW7t56mwSrd8Aqrm` | Cir95-modificada-por-DDU-390 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 94 | ❌ Mismatch |
| `02QBBSUiF9HqISeJcOdE` | DDU-ESP-071-07 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 94 | ❌ Mismatch |
| `09e2HJTqmLAPMrwNMjFE` | DDU-ESPECIFICA-50-CIR.782 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 94 | ❌ Mismatch |
| ... | (535 more M001 sources) | Same | Same | 94 avg | Same |

**M001 Total:** 538 sources, 94 agent assignments avg, ALL need userId update

---

### **S2 - EQUIPOS (134 sources)**

| Source ID | Document Name | Current userId | Required Hash | Assigned Agents | Status |
|-----------|--------------|----------------|---------------|----------------|--------|
| `0ZkdxJqk3vozcOniOjWX` | Control semanal grúas HIAB | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 104 | ❌ Mismatch |
| `12Rcnt0HHePxPlaR82Tt` | Tabla Carga AK-3008 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 104 | ❌ Mismatch |
| ... | (132 more S2 sources) | Same | Same | 104 avg | Same |

**S2 Total:** 134 sources, 104 agent assignments avg, ALL need userId update

---

### **SSOMA - SEGURIDAD (89 sources)**

| Source ID | Document Name | Current userId | Required Hash | Assigned Agents | Status |
|-----------|--------------|----------------|---------------|----------------|--------|
| `1OFK4FhsgajT6zznXkCe` | SSOMA-ME-RCO-08 ENERGIA ELECTRICA | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 98 | ❌ Mismatch |
| `52JJmvi4zA0sxqTOtYD4` | SSOMA-P-002 ENTRENAMIENTO | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 95 | ❌ Mismatch |
| ... | (87 more SSOMA sources) | Same | Same | 96 avg | Same |

**SSOMA Total:** 89 sources, 98 agent assignments avg, ALL need userId update

---

### **M3 - PROCEDIMIENTOS (28 sources)**

| Source ID | Document Name | Current userId | Required Hash | Assigned Agents | Status |
|-----------|--------------|----------------|---------------|----------------|--------|
| `0wKs54A12DqZcTsXil8R` | GOP-P-PCO-2.2 TRAZABILIDAD | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 120 | ❌ Mismatch |
| `1C5bK59K3VmCfgzDGfKw` | GOP-P-PCO-2 ELABORACION DOCUMENTOS | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 120 | ❌ Mismatch |
| `3KXsBmyYTjif5SkEA6cv` | MAQ-LOG-CBO-P-001 GESTION BODEGAS | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 120 | ❌ Mismatch |
| ... | (25 more M3 sources) | Same | Same | 120 avg | Same |

**M3 Total:** 28 sources, 120 agent assignments avg, ALL need userId update

---

## 🔑 **USER IDENTIFICATION**

### **The Single User:**

```
Google OAuth ID:    114671162830729001607
Email:              alec@getaifactory.com (you!)
Current Format:     114671162830729001607 (in context_sources)
Required Format:    usr_uhwqffaqag1wrryd82tw (in BigQuery chunks)
Hash Algorithm:     SHA-256 based (from generateUserId function)
```

**All documents uploaded by:** You (alec@getaifactory.com)

---

## 🎯 **AGENT ASSIGNMENT SUMMARY**

### **By Tag:**

| Tag | Total Sources | Total Assignments | Agents per Source (Avg) | Key Agent Example |
|-----|--------------|-------------------|------------------------|-------------------|
| **S001** | 76 | 16,823 | 221 | GESTION BODEGAS (AjtQZEIMQvFnPRJRjl4y) |
| **M001** | 538 | 50,574 | 94 | Multiple NORMATIVA agents |
| **S2** | 134 | 12,168 | 104 | Multiple EQUIPOS agents |
| **SSOMA** | 89 | 7,257 | 98 | Multiple SSOMA agents |
| **M3** | 28 | 3,360 | 120 | Multiple PROCEDIMIENTOS agents |
| **M004** | 7 | 0 | 0 | ❌ Not assigned to any agents |
| **Cartolas** | 7 | 7 | 1 | Cartolas agent |
| **Other** | 5 | 9 | 1-4 | Various |

**Total:** 884 sources, 90,198 total agent assignments

**Note:** Many sources assigned to 90-220 agents each (bulk assignment pattern)

---

## ⚡ **IMMEDIATE ACTION REQUIRED**

### **To Enable Benchmark with GESTION BODEGAS:**

**Option A: Quick Fix Queries (5 min) - RECOMMENDED**

Update search functions to accept both formats:

```typescript
// In bigquery-optimized.ts
WHERE (user_id = @userId OR user_id = @googleUserId)

// Pass both formats
params: {
  userId: 'usr_uhwqffaqag1wrryd82tw',
  googleUserId: '114671162830729001607'
}
```

**Result:** Works immediately, can benchmark now

---

**Option B: Fix Firestore Data (30 min)**

Run migration to update all 884 sources:

```typescript
UPDATE context_sources
SET userId = 'usr_uhwqffaqag1wrryd82tw',
    googleUserId = '114671162830729001607'  // Keep for reference
WHERE userId = '114671162830729001607'
```

**Result:** Permanent fix, all future queries work

---

## 🚀 **Ready to Benchmark After Fix**

### **With S001 Sources Accessible:**

**GESTION BODEGAS agent will have:**
- ✅ 76 S001 sources available
- ✅ ~4,000+ chunks to search (estimated)
- ✅ Can test query: "¿Procedimiento inventario MB52?"
- ✅ Measure time-to-first-token
- ✅ Compare GREEN vs BLUE
- ✅ Get real performance data

**Expected performance:**
- GREEN: <2s (consistent)
- BLUE: 400ms OR 120s (fallback lottery)

---

## 💬 **What Should We Do?**

**A)** "Quick fix queries" → Update to accept both formats (5 min) → Benchmark now

**B)** "Fix Firestore data" → Migrate userId format (30 min) → Permanent solution

**C)** "Show me the script" → I'll create migration script

**D)** "Just test with source IDs" → Bypass assignment, test directly

**Ready to fix this and run the benchmark you requested!** 🎯✨

