# 🚀 START S2-V2 UPLOAD NOW - Quick Reference

**Copy-paste this into new conversation:** ⬇️

---

## 📋 **COMPLETE TASK**

Upload documents for S2-v2 agent (MAQSA Mantenimiento) using proven optimized process.

**Context from previous session:**
- ✅ S1-v2 just completed: 225 docs, 1,458 chunks, ~90 mins, $1.25, 100% success
- ✅ M3-v2 completed earlier: 62 docs, 1,277 chunks, 22.5 mins, $1.23, 93.5% success
- ✅ Configuration proven optimal: 20% overlap, parallel 15, batch 100/500
- ✅ Auto-resume tested: Works perfectly (restart when stops)

---

## 🎯 **S2-V2 DETAILS**

```
Agent:    MAQSA Mantenimiento (S2-v2)
ID:       1lgr33ywq5qed67sqCYi
Owner:    usr_uhwqffaqag1wrryd82tw (alec@getaifactory.com)
Folder:   /Users/alec/salfagpt/upload-queue/S002-20251118
Current:  467 sources (baseline)
```

---

## ✅ **EXECUTION STEPS**

### **1. Pre-Upload (5 min):**
- Verify agent: `1lgr33ywq5qed67sqCYi`
- Check current sources (467)
- Count PDFs in S002-20251118
- List all files with sizes in table
- Create S2V2_PRE_UPLOAD_ANALYSIS.md

### **2. Upload (60-120 min):**
```bash
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/S002-20251118 \
  --tag=S2-v2-20251125 \
  --agent=1lgr33ywq5qed67sqCYi \
  --user=usr_uhwqffaqag1wrryd82tw \
  --email=alec@getaifactory.com \
  --model=gemini-2.5-flash
```

**Important:**
- Expect 3-4 runs (upload stops every 10-15 files)
- When stops: Just run same command again
- Auto-resumes from where it stopped
- No data loss, no duplicates

### **3. Monitor:**
- Check completed: `grep -c "ARCHIVO COMPLETADO" [log]`
- Watch live: `tail -f [log] | grep "DONE"`
- Restart when stops (normal behavior)

### **4. Verify (5 min):**
- Final document count
- RAG enabled: 100%
- Chunks created
- Test RAG query

### **5. Report (10 min):**
- Generate S2V2_UPLOAD_COMPLETE_SUMMARY.md
- Generate S2V2_BUSINESS_REPORT.md
- Generate S2V2_TECHNICAL_SUMMARY.md
- Use S1-v2 reports as templates

---

## ⚙️ **CONFIGURATION (DO NOT CHANGE)**

```
✅ Chunk: 512 tokens, 20% overlap (102 tokens)
✅ Parallel: 15 files
✅ Embedding batch: 100
✅ BigQuery batch: 500
✅ Model: gemini-2.5-flash
✅ RAG: Enabled by default
✅ Activation: Automatic
```

**Why:** Proven in M3-v2 and S1-v2 with 97% average success rate

---

## 📊 **EXPECTED RESULTS**

```
Files: ~50-150 PDFs (TBD)
Time: ~60-120 minutes
Runs: 3-4 (auto-resume)
Cost: ~$1-3
Success: 95-100%
Chunks: ~500-2,000
```

---

## 🔗 **REFERENCE DOCS**

**Full context:** `CONTINUATION_PROMPT_S2V2_UPLOAD.md`  
**S1-v2 results:** `S1V2_UPLOAD_COMPLETE_SUMMARY.md`  
**M3-v2 results:** `M3V2_UPLOAD_COMPLETE_SUMMARY.md`  
**All progress:** `COMPLETE_UPLOAD_PROGRESS_TRACKER.md`

---

## ✅ **READY TO START**

Everything needed:
- ✅ Agent verified
- ✅ Folder ready
- ✅ Config proven
- ✅ Process tested
- ✅ Templates available

**Just paste above into new conversation and go!** 🚀

