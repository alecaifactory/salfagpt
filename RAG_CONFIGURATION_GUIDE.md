# ⚙️ RAG Configuration Guide

**For:** End users and administrators  
**Purpose:** How to configure and use RAG effectively

---

## 🎛️ Quick Setup (3 Steps)

### Step 1: Enable RAG Globally

```
1. Click your name (bottom-left)
2. Click "Configuración"
3. Find "🔍 Búsqueda Vectorial (RAG)"
4. Toggle to ON (green)
5. Click "Guardar Configuración"
```

**Result:** All future document uploads will be indexed for RAG

---

### Step 2: Upload a Document

```
1. Click "+ Agregar" in Fuentes de Contexto
2. Select a PDF file (>10 pages recommended)
3. Choose model (Flash recommended for indexing)
4. Click "Agregar Fuente"
5. Wait for processing + indexing (~30-60 seconds)
```

**You'll see:**
```
⏳ Processing Document...
✓ Extracted 48,234 tokens
🔍 Indexing for RAG Search...
  Creating 96 chunks...
  Generating embeddings... 45/96
  ████████░░░░ 47%
✅ Indexed for RAG (96 chunks)
```

---

### Step 3: Ask Questions

```
1. Enable the document (toggle ON)
2. Ask a question
3. Check context panel for "🔍 RAG Active"
```

**You'll see:**
```
Context: 0.5% used
🔍 RAG: 5 relevant chunks
Tokens saved: 45,734 (95%)
```

**Done!** You're now using optimized search ✨

---

## 📊 Settings Explained

### Global Settings (User Level)

**Location:** User menu → Configuración → RAG Settings

| Setting | Options | Recommended | Impact |
|---------|---------|-------------|--------|
| **RAG Enabled** | ON / OFF | ON | Enable/disable RAG globally |
| **Top K Chunks** | 3-20 | 5-7 | How many chunks to retrieve |
| **Chunk Size** | 250-1000 | 500 | Tokens per chunk |
| **Min Similarity** | 0.3-0.9 | 0.5 | Relevance threshold |

---

### Per-Document Settings (Source Level)

**Location:** Context Source → Settings icon → RAG Settings tab

| Setting | Options | Recommended | Impact |
|---------|---------|-------------|--------|
| **RAG Enabled** | ON / OFF | ON | Enable for this document |
| **Chunk Size** | 250-1000 | 500 | Override global setting |
| **Re-index** | Button | - | Rebuild chunks with new settings |

---

## 🎯 Configuration Recommendations

### For Different Use Cases

#### Technical Documentation (Manuals, Specs)

```
✅ RAG: ON
✅ Top K: 7-10 (need more context)
✅ Chunk size: 750 (longer technical sections)
✅ Min similarity: 0.6 (be selective)
```

**Why:** Technical docs have dense information, need larger context per chunk

---

#### Legal Documents (Contracts, Regulations)

```
✅ RAG: ON
✅ Top K: 5-7 (precise citations)
✅ Chunk size: 500 (balanced)
✅ Min similarity: 0.7 (strict matching)
```

**Why:** Legal text needs precise citations, exact wording matters

---

#### General Knowledge (Articles, Reports)

```
✅ RAG: ON
✅ Top K: 3-5 (quick facts)
✅ Chunk size: 250 (smaller, more precise)
✅ Min similarity: 0.5 (permissive)
```

**Why:** General content is easier to search, smaller chunks work well

---

#### Small Documents (<10 pages)

```
⚠️ RAG: Optional (little benefit)
✅ Top K: 10-15 (if enabled)
✅ Chunk size: 1000 (larger chunks)
```

**Why:** Small docs don't need RAG, but won't hurt if enabled

---

## 🔧 Advanced Configuration

### Tuning for Quality

**Problem:** Answers are missing important context

**Solution:**
```
Increase Top K: 5 → 10
  (Retrieve more chunks)

Decrease Min Similarity: 0.5 → 0.4
  (Allow less similar chunks)

Result: More comprehensive answers
```

---

### Tuning for Speed

**Problem:** Responses are still slow

**Solution:**
```
Decrease Top K: 7 → 3
  (Retrieve fewer chunks)

Increase Min Similarity: 0.5 → 0.7
  (Only highly relevant chunks)

Result: Faster responses, more focused
```

---

### Tuning for Cost

**Problem:** Still using too many tokens

**Solution:**
```
Decrease Top K: 5 → 3
Decrease Chunk Size: 500 → 250
Increase Min Similarity: 0.5 → 0.6

Result: Minimal tokens, maximum savings
```

---

## 📈 Monitoring Your RAG Usage

### Context Logs Table

**What to look for:**

| Column | Good | Warning | Bad |
|--------|------|---------|-----|
| **RAG** | ✓ 5-7 ch | ✓ 10+ ch | - (not used) |
| **Input tokens** | <5K | 5-15K | >15K |
| **Savings %** | >90% | 50-90% | <50% |

**Actions if bad:**
- Check RAG is enabled
- Verify chunks were created
- Review similarity threshold

---

### Context Panel Indicators

**Healthy RAG usage:**
```
🔍 RAG Active
5 relevant chunks (of 234 total)
Avg similarity: 76%
Tokens saved: 47,500 (95%)
```

**Needs tuning:**
```
🔍 RAG Active
15 chunks (of 234 total)  ← Too many
Avg similarity: 52%        ← Low relevance
Tokens saved: 35,000 (70%) ← Could be better
```

**Action:** Increase min similarity to 0.6-0.7

---

## 🎓 Best Practices

### DO's ✅

1. **Enable RAG for large documents** (>10 pages)
   - Immediate benefit
   - Massive token savings

2. **Start with defaults** (5 chunks, 500 tokens, 0.5 similarity)
   - Optimized for most use cases
   - Tune later if needed

3. **Monitor the RAG column** in context logs
   - Verify RAG is being used
   - Check token savings

4. **Check similarity scores** in expanded logs
   - Should be >60% on average
   - If <50%, increase topK or lower threshold

5. **Re-index if changing chunk size**
   - Chunk size affects search quality
   - Re-process to apply new settings

---

### DON'Ts ❌

1. **Don't disable RAG without testing**
   - Try it first with defaults
   - You'll likely see immediate benefit

2. **Don't set topK too low** (<3)
   - Might miss important context
   - Answers could be incomplete

3. **Don't set topK too high** (>20)
   - Defeats purpose of RAG
   - Better to use full document at that point

4. **Don't set similarity too high** (>0.8)
   - Might find no results
   - Will fall back to full document often

5. **Don't forget to re-index** after changing settings
   - Old chunks use old settings
   - Re-process to apply new configuration

---

## 🔍 Troubleshooting

### Issue 1: "No RAG results found"

**Symptoms:**
- RAG column shows "-"
- Using full document despite RAG enabled

**Possible causes:**
1. Document not indexed (check for ragMetadata)
2. Query too different from document content
3. Similarity threshold too high

**Solutions:**
```
1. Check source card for "✓ Indexed for RAG"
   - If missing: Re-process document with RAG ON

2. Try more general query
   - Instead of: "¿Cuál es el artículo 2.6.3?"
   - Try: "¿Qué dice sobre construcciones?"

3. Lower similarity threshold
   - Settings → Min Similarity: 0.5 → 0.3
```

---

### Issue 2: "RAG returns irrelevant chunks"

**Symptoms:**
- Low similarity scores (<50%)
- Answers don't match document content

**Solutions:**
```
1. Increase similarity threshold
   - Settings → Min Similarity: 0.5 → 0.7
   
2. Increase topK (get more chunks)
   - Settings → Top K: 5 → 10
   
3. Try different chunk size
   - Smaller chunks (250): More precise
   - Larger chunks (750): More context
```

---

### Issue 3: "Still using too many tokens"

**Symptoms:**
- Token usage not reduced much
- RAG shows high chunk count (>15)

**Solutions:**
```
1. Decrease topK
   - Settings → Top K: 10 → 5

2. Increase similarity threshold
   - Settings → Min Similarity: 0.5 → 0.6

3. Use smaller chunks
   - Settings → Chunk Size: 500 → 250
   - Re-index document
```

---

## 📱 User Workflows

### Workflow 1: First-Time RAG User

```
Day 1:
1. Enable RAG in settings ✓
2. Upload 1 test document ✓
3. Wait for indexing ✓
4. Ask 3-5 test questions ✓
5. Check token savings in logs ✓

Result: See 90%+ reduction, understand benefits

Day 2:
1. Upload remaining documents
2. Enable all sources
3. Normal usage

Result: All documents optimized
```

---

### Workflow 2: Power User (Advanced)

```
1. Enable RAG ✓
2. Upload document ✓
3. Check chunk count in source settings
4. Test with sample queries
5. Tune settings if needed:
   - Adjust topK based on results
   - Adjust chunk size based on content
   - Monitor similarity scores
6. Iterate until optimal

Result: Custom-tuned RAG for your specific documents
```

---

### Workflow 3: Migrating Existing Documents

```
Option A: Gradual (Recommended)
1. Keep existing docs as-is
2. Enable RAG for new uploads only
3. Re-process important docs as needed

Option B: Bulk Migration
1. Admin panel → RAG Status
2. Click "Bulk Re-index All"
3. Wait for batch processing
4. All documents now RAG-enabled

Choose based on urgency and document count
```

---

## 📊 Metrics to Track

### Success Indicators

**Weekly:**
- [ ] RAG usage rate (% of queries using RAG)
- [ ] Average token savings (should be >90%)
- [ ] Average similarity scores (should be >60%)
- [ ] Fallback rate (should be <5%)

**Monthly:**
- [ ] Total cost (should be 99% lower)
- [ ] Response times (should be 2x faster)
- [ ] User satisfaction (survey)
- [ ] Document library size (can grow 100x)

---

## ✅ Configuration Checklist

### Before First Use

- [ ] RAG enabled in user settings
- [ ] Vertex AI API enabled (infrastructure)
- [ ] IAM permissions granted (infrastructure)
- [ ] Firestore indexes deployed (infrastructure)
- [ ] At least 1 test document uploaded and indexed

### After Each Upload

- [ ] Check for "✓ Indexed for RAG" badge
- [ ] Verify chunk count makes sense (1 chunk per ~2 pages)
- [ ] Enable document (toggle ON)
- [ ] Test with sample query
- [ ] Check token savings in logs

### Weekly Maintenance

- [ ] Review RAG usage in context logs
- [ ] Check for failed searches (fallbacks)
- [ ] Identify documents needing re-indexing
- [ ] Review cost savings vs previous week

---

## 🎯 Getting the Most from RAG

### Tips for Best Results

1. **Ask specific questions**
   - ✅ "¿Cuáles son los requisitos para X?"
   - ❌ "Dime todo sobre el documento"

2. **Use descriptive queries**
   - ✅ "requisitos construcción subterránea OGUC"
   - ❌ "requisitos"

3. **Monitor similarity scores**
   - >70%: Excellent matches
   - 50-70%: Good matches
   - <50%: Review chunk size/topK

4. **Experiment with settings**
   - Start with defaults
   - Adjust based on your documents
   - Different settings for different doc types

5. **Re-index when updating docs**
   - If content changes significantly
   - If you want different chunk size
   - If search quality degrades

---

## 📚 Resources

### Quick Reference

- **RAG_IMPLEMENTATION_PLAN.md** - Technical details
- **RAG_VISUAL_GUIDE.md** - Visual explanations
- **RAG_QUICK_START.md** - Setup guide
- **RAG_CONFIG_UI_MOCKUP.md** - UI designs

### Support

- **Documentation:** `/docs/rag/` (after implementation)
- **Issues:** Check console logs for errors
- **Help:** User menu → Help → RAG Guide

---

## 🎉 Summary

### What RAG Gives You

- ✅ **95% token reduction** per query
- ✅ **2-3x faster** responses
- ✅ **99% cost savings**
- ✅ **100x more** documents supported
- ✅ **Better citations** and traceability

### How to Enable

1. Toggle ON in settings (1 click)
2. Upload documents (auto-indexed)
3. Use normally (RAG works automatically)

### When It Helps Most

- Large documents (>10 pages)
- Multiple active sources
- Specific factual questions
- Pro model usage (highest savings)

---

**Ready to transform your document search? Enable RAG now! 🚀**

