# M003 References Fix - 2025-11-13

## 🎯 Issue

**Agent:** GOP GPT (M003)  
**Agent ID:** 5aNwSMgff2BRKrrVRypF  
**Problem:** AI provides responses but NO reference badges [1], [2], [3] are shown

**Example Question:**
> "¿Qué procedimiento debo seguir para controlar la portería?"

**Response:** Provided detailed answer mentioning "Responsabilidades en Portería" document, but **no clickable references**.

---

## 🔍 Root Cause

**Similarity Threshold Too High (70%)**

The RAG system was configured with a **70% minimum similarity threshold**:

```typescript
// Before (too strict)
const ragMinSimilarity = body.ragMinSimilarity || 0.7;
```

**What happened:**
1. User aske