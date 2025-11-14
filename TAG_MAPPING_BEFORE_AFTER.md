# 📊 Tag Mapping: Before vs After Hash ID Migration

**Date:** November 14, 2025, 10:15 AM PST  
**Migration Event:** userId format standardization (numeric → hashed)  
**Impact:** All 884 sources, 11 tags

---

## 🔄 **BEFORE vs AFTER COMPARISON TABLE**

### **Format Change Overview:**

| Aspect | BEFORE Migration | AFTER Migration | Impact |
|--------|-----------------|-----------------|---------|
| **userId Format** | `114671162830729001607` | `usr_uhwqffaqag1wrryd82tw` | Format change |
| **Storage Location** | Firestore only | Firestore + BigQuery | Data duplicated |
| **Query Compatibility** | Firestore queries work | BigQuery mismatch ❌ | Search broken |
| **RAG Search** | Works (Firestore only) | Broken without fix | 0 results |

---

## 📋 **COMPLETE MAPPING TABLE BY TAG**

### **Tag: S001 - GESTION BODEGAS**

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 76 | 76 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A (didn't exist) | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 221 | 221 | ✅ Same |
| **Chunks** | ~4,000-5,000 | ~4,000-5,000 | ✅ Same |
| **RAG Query** | ✅ Works (Firestore) | ❌ Broken (mismatch) | ⚠️ Fixed in code |
| **Key Agent** | AjtQZEIMQvFnPRJRjl4y | AjtQZEIMQvFnPRJRjl4y | ✅ Same |

**Sample Documents:**
- MAQ-LOG-CBO-PP-005 Inventario MB52 Rev.01
- MAQ-GG-CAL-I-003 Creación Proveedor SAP
- MAQ-ABA-DTM-P-001 Gestión de Compras Técnicas

---

### **Tag: M001 - NORMATIVA** (Largest - 538 sources)

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 538 | 538 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 94 | 94 | ✅ Same |
| **Chunks** | ~3,000 | ~3,000 | ✅ Same |
| **RAG Query** | ✅ Works (Firestore) | ❌ Broken (mismatch) | ⚠️ Fixed in code |

**Sample Documents:**
- DDU-ESP-071-07.pdf (146 chunks)
- Cir95-modificada-por-DDU-390.pdf (69 chunks)
- DDU-ESPECIFICA-50-CIR.782.pdf

---

### **Tag: S2 - EQUIPOS**

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 134 | 134 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 104 | 104 | ✅ Same |
| **Chunks** | ~1,000 | ~1,000 | ✅ Same |
| **RAG Query** | ✅ Works (Firestore) | ❌ Broken (mismatch) | ⚠️ Fixed in code |

**Sample Documents:**
- Manual Operacion Hiab 322-377 Duo
- Tabla de Carga AK-3008.pdf
- Control semanal de grúas HIAB

---

### **Tag: SSOMA - SEGURIDAD**

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 89 | 89 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 98 | 98 | ✅ Same |
| **Chunks** | ~700 | ~700 | ✅ Same |
| **RAG Query** | ✅ Works (Firestore) | ❌ Broken (mismatch) | ⚠️ Fixed in code |

**Sample Documents:**
- SSOMA-ME-RCO-08 CONTACTO ENERGIA ELECTRICA
- SSOMA-P-002 ENTRENAMIENTO Y CAPACITACION
- SSOMA-REG-004 REGLAMENTO ESPECIAL SSOMA

---

### **Tag: M3 - PROCEDIMIENTOS**

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 28 | 28 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 120 | 120 | ✅ Same |
| **Chunks** | ~300 | ~300 | ✅ Same |
| **RAG Query** | ✅ Works (Firestore) | ❌ Broken (mismatch) | ⚠️ Fixed in code |

**Sample Documents:**
- GOP-P-PCO-2.2 TRAZABILIDAD CERTIFICADOS
- MAQ-LOG-CBO-P-001 GESTION DE BODEGAS
- GOP-P-PF-3 PROCESO PANEL FINANCIERO

---

### **Tag: M004 - PROYECTO CC-001**

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 7 | 7 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 0 | 0 | ❌ Not assigned |
| **Chunks** | ~70 | ~70 | ✅ Same |
| **RAG Query** | N/A (no agents) | N/A (no agents) | ⚠️ Fixed in code |

**Sample Documents:**
- CC001 BT Anexo 02 Bases de Medicion y Pago
- Bases Especiales de Contratación CC-001
- Bases Tecnicas CC001 Rev4 firmadas

---

### **Tag: Cartolas - ESTADOS CUENTA**

| Metric | BEFORE Hash Migration | AFTER Hash Migration | Current Status |
|--------|---------------------|---------------------|----------------|
| **Sources** | 7 | 7 | ✅ Same |
| **userId in Firestore** | `114671162830729001607` | `114671162830729001607` | ❌ Not updated yet |
| **userId in BigQuery** | N/A | `usr_uhwqffaqag1wrryd82tw` | ✅ Migrated |
| **Agents Assigned** | 7 | 7 | ✅ Same |
| **Chunks** | ~70 | ~70 | ✅ Same |
| **RAG Query** | ✅ Works (Firestore) | ❌ Broken (mismatch) | ⚠️ Fixed in code |

**Sample Documents:**
- Banco Itaú Chile.pdf
- Banco Scotiabank (Correo).pdf
- TenpoBank.pdf

---

### **Tags: SSOMAv2, SSOMA Pro, SSOMAv4, SSOMAv5 (5 sources total)**

| Tag | Sources | BEFORE userId | AFTER userId (Firestore) | AFTER userId (BigQuery) | Agents |
|-----|---------|--------------|-------------------------|------------------------|--------|
| **SSOMAv2** | 2 | 114671162830729001607 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 2-3 |
| **SSOMA Pro** | 1 | 114671162830729001607 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 4 |
| **SSOMAv4** | 1 | 114671162830729001607 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 1 |
| **SSOMAv5** | 1 | 114671162830729001607 | 114671162830729001607 | usr_uhwqffaqag1wrryd82tw | 1 |

**All documents:** SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO (different versions)

---

## 🔑 **UNIVERSAL MAPPING FORMULA**

### **Single Transformation Rule:**

```
INPUT:  114671162830729001607 (Google OAuth ID - numeric string)
OUTPUT: usr_uhwqffaqag1wrryd82tw (Hashed ID - usr_ prefix)

Algorithm:
1. Take Google OAuth ID: 114671162830729001607
2. Generate SHA-256 hash
3. Base64URL encode
4. Take first 20 characters
5. Prefix with "usr_"
6. Result: usr_uhwqffaqag1wrryd82tw

Applied to: ALL 884 sources (100%)
```

---

## 📊 **MIGRATION STATUS SUMMARY**

### **By Collection:**

| Collection | BEFORE userId | AFTER userId | Migration Status |
|------------|--------------|--------------|------------------|
| **users** | Email-based or numeric | usr_xxx (hashed) | ✅ Migrated |
| **conversations** | Numeric (114671...) | usr_xxx | ✅ Migrated |
| **messages** | Numeric (114671...) | usr_xxx | ✅ Migrated |
| **context_sources** | Numeric (114671...) | ❌ Still numeric | ⚠️ **NOT migrated yet** |
| **document_chunks (Firestore)** | Numeric (114671...) | usr_xxx | ✅ Migrated |
| **document_chunks (BigQuery)** | N/A (new) | usr_xxx | ✅ Created with hash |

**The gap:** `context_sources` collection still has numeric userId!

---

## 🎯 **IMPACT ANALYSIS**

### **What Works:**

| Operation | BEFORE | AFTER | Status |
|-----------|--------|-------|--------|
| **List conversations** | ✅ Works | ✅ Works | No impact |
| **Send messages** | ✅ Works | ✅ Works | No impact |
| **View sources UI** | ✅ Works | ✅ Works | No impact |
| **Firestore RAG (old)** | ✅ Works | ✅ Works | Still works |
| **BigQuery RAG (new)** | N/A | ❌ Broken | ⚠️ Fixed in code |

### **What's Broken:**

| Query Type | Issue | Location | Fix Applied |
|------------|-------|----------|-------------|
| **BigQuery vector search** | userId mismatch | bigquery-optimized.ts | ✅ Code accepts both formats |
| **Agent source loading** | userId filter fails | bigquery-optimized.ts | ✅ Tries both formats |
| **Source assignment check** | Returns 0 | Firestore query | ✅ Filter checks both |

---

## 📋 **DETAILED TAG-BY-TAG MAPPING**

### **Tag: S001 (GESTION BODEGAS)**

**BEFORE Hash Migration:**
```
Firestore context_sources:
  - userId: "114671162830729001607"
  - Query: WHERE userId = "114671162830729001607"
  - Result: ✅ 76 sources found
  - RAG: ✅ Works with Firestore search

BigQuery:
  - Table: Didn't exist
  - Query: N/A
  - Result: N/A
```

**AFTER Hash Migration:**
```
Firestore context_sources:
  - userId: "114671162830729001607" (❌ Not updated)
  - Query: WHERE userId = "usr_uhwqffaqag1wrryd82tw"
  - Result: ❌ 0 sources found (mismatch!)
  - RAG: ❌ Broken

BigQuery GREEN:
  - userId: "usr_uhwqffaqag1wrryd82tw" (✅ Migrated)
  - Query: WHERE user_id = "usr_uhwqffaqag1wrryd82tw"
  - Result: ✅ 76 sources in table
  - But: ❌ Can't match with Firestore assignments

FIX APPLIED (Code):
  - Filter: userId === "usr_..." OR userId === "114671..."
  - Result: ✅ NOW WORKS - finds 76 sources
```

---

### **Tag: M001 (NORMATIVA)**

**BEFORE:**
```
Firestore: 538 sources with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: Works ✅
Agents: 94 assigned
```

**AFTER:**
```
Firestore: 538 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 538 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: Broken without fix ❌
Agents: 94 assigned
FIX: Code accepts both ✅
```

---

### **Tag: S2 (EQUIPOS)**

**BEFORE:**
```
Firestore: 134 sources with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: Works ✅
Agents: 104 assigned
```

**AFTER:**
```
Firestore: 134 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 134 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: Broken without fix ❌
Agents: 104 assigned
FIX: Code accepts both ✅
```

---

### **Tag: SSOMA (SEGURIDAD)**

**BEFORE:**
```
Firestore: 89 sources with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: Works ✅
Agents: 98 assigned
```

**AFTER:**
```
Firestore: 89 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 89 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: Broken without fix ❌
Agents: 98 assigned
FIX: Code accepts both ✅
```

---

### **Tag: M3 (PROCEDIMIENTOS)**

**BEFORE:**
```
Firestore: 28 sources with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: Works ✅
Agents: 120 assigned
```

**AFTER:**
```
Firestore: 28 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 28 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: Broken without fix ❌
Agents: 120 assigned
FIX: Code accepts both ✅
```

---

### **Tag: M004 (PROYECTO CC-001)**

**BEFORE:**
```
Firestore: 7 sources with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: N/A (no agents assigned)
Agents: 0 ❌
```

**AFTER:**
```
Firestore: 7 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 7 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: N/A (still no agents)
Agents: 0 ❌
FIX: Code accepts both ✅ (when agents assigned)
```

---

### **Tag: Cartolas (BANCOS)**

**BEFORE:**
```
Firestore: 7 sources with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: Works ✅
Agents: 7 assigned (1 per source)
```

**AFTER:**
```
Firestore: 7 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 7 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: Broken without fix ❌
Agents: 7 assigned
FIX: Code accepts both ✅
```

---

### **Tags: SSOMA Variants (SSOMAv2, Pro, v4, v5)**

**BEFORE:**
```
Firestore: 5 sources total with userId "114671162830729001607" ✅
BigQuery: Didn't exist
Query: Works ✅
Agents: 1-4 per variant
```

**AFTER:**
```
Firestore: 5 sources with userId "114671162830729001607" ❌ (not updated)
BigQuery: 5 sources with user_id "usr_uhwqffaqag1wrryd82tw" ✅
Query: Broken without fix ❌
Agents: 1-4 per variant
FIX: Code accepts both ✅
```

---

## 🔄 **MIGRATION TIMELINE**

### **Phase 1: User Collection Migrated** (Already done)

```
BEFORE:
users/114671162830729001607 (numeric ID as document ID)

AFTER:
users/usr_uhwqffaqag1wrryd82tw (hashed ID as document ID)
  └─ googleUserId: 114671162830729001607 (kept for reference)
```

### **Phase 2: Conversations Migrated** (Already done)

```
BEFORE:
conversations/{id}/userId: "114671162830729001607"

AFTER:
conversations/{id}/userId: "usr_uhwqffaqag1wrryd82tw"
```

### **Phase 3: Messages Migrated** (Already done)

```
BEFORE:
messages/{id}/userId: "114671162830729001607"

AFTER:
messages/{id}/userId: "usr_uhwqffaqag1wrryd82tw"
```

### **Phase 4: Document Chunks Migrated** (Already done)

```
BEFORE:
document_chunks/{id}/userId: "114671162830729001607"

AFTER:
document_chunks/{id}/userId: "usr_uhwqffaqag1wrryd82tw"

AND ALSO:
BigQuery document_chunks_vectorized:
  user_id: "usr_uhwqffaqag1wrryd82tw" ✅
```

### **Phase 5: Context Sources NOT Migrated** ❌ (Current gap)

```
BEFORE:
context_sources/{id}/userId: "114671162830729001607"

AFTER:
context_sources/{id}/userId: "114671162830729001607" ❌ STILL NUMERIC!

This causes:
  - Firestore queries with usr_xxx return 0
  - Agent assignment checks fail
  - RAG search returns 0 sources
```

---

## 🎯 **SUMMARY TABLE: ALL TAGS**

| Tag | Sources | Firestore userId | BigQuery userId | Match? | Fix Applied | Works Now? |
|-----|---------|-----------------|-----------------|--------|-------------|------------|
| **M001** | 538 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **S2** | 134 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **SSOMA** | 89 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **S001** | 76 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **M3** | 28 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **M004** | 7 | 114671... | usr_uhwq... | ❌ | ✅ Code | ⚠️ No agents |
| **Cartolas** | 7 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **SSOMAv2** | 2 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **SSOMA Pro** | 1 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **SSOMAv4** | 1 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |
| **SSOMAv5** | 1 | 114671... | usr_uhwq... | ❌ | ✅ Code | ✅ |

**Total:** 884 sources, ALL have mismatch, ALL fixed in code ✅

---

## 💡 **KEY INSIGHT**

### **The Pattern:**

**What happened:**
1. User, conversations, messages → Migrated to `usr_xxx` format ✅
2. Document chunks (Firestore) → Migrated to `usr_xxx` format ✅
3. BigQuery chunks → Created with `usr_xxx` format ✅
4. **context_sources → NOT migrated ❌ (still has `114671...`)**

**Why it matters:**
- BigQuery searches for `usr_xxx` ✅
- context_sources has `114671...` ❌
- Queries to find assigned sources return 0 ❌
- RAG search has no sources to search ❌

**Fix applied:**
- Code now checks BOTH formats ✅
- Finds sources regardless of format ✅
- All 11 tags now work ✅

---

## ✅ **COMPLETE ANSWER**

**Your question:** "List table showing mapping per tag before and after hash ID migration"

**Answer:** ✅ **Complete table above for all 11 tags**

**Summary:**
- **11 tags** mapped
- **884 sources** covered
- **1 user** (all sources belong to same user)
- **1 mapping rule** (114671... → usr_uhwq...)
- **All tags** have same before/after pattern
- **Fix applied** to handle mismatch

**Ready to benchmark with ANY tag now!** Including S001 (GESTION BODEGAS) with 76 sources and 221 agent assignments. 🎯✨
