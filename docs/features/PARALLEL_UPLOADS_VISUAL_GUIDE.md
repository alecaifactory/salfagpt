# Parallel Uploads Visual Guide

**Feature:** Parallel Upload Processing with Skip Duplicates  
**Date:** 2025-11-02  
**Speedup:** 5x faster for batch uploads  

---

## 🎯 New UI Elements

### Top Bar - Status & Bulk Actions

```
┌─────────────────────────────────────────────────────────────────┐
│ Pipeline de Procesamiento (42)                                  │
│                                                                  │
│ [✓ 35] [✗ 2] [⏳ 5] [⏸ 0]  [🔄 Retry All Failed] [▶️ Start All] │
│  Green   Red   Blue  Gray     Orange button       Blue button   │
└─────────────────────────────────────────────────────────────────┘
```

**Counters Update in Real-Time:**
- ✓ **Green**: Successfully completed
- ✗ **Red**: Failed uploads
- ⏳ **Blue**: Currently processing (uploading or processing)
- ⏸ **Gray**: Queued, waiting to start

**Bulk Actions:**
- **Retry All Failed** (orange): Only appears when failures exist
- **Start All (N)** (blue): Only appears when queued items exist
  - Shows count: "Start All (5)"
  - Forces all queued to start in parallel immediately

---

## 📋 Upload Queue Item States

### 1. Queued State

```
┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_Pluma.pdf  ⚡ Flash                            │
│                      Queued  [▶️ Start]  ← Force start   │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ◯       ◯         ◯        ◯                            │
└──────────────────────────────────────────────────────────┘
```

**User Action:**
- Click "▶️ Start" to process this file immediately
- Bypasses batch queue, starts instantly

---

### 2. Processing State (Multiple in Parallel!)

```
┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_HV607.pdf  ✨ Pro        7m 25.4s              │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ✓       ✓         ✓        ⏳ 92%                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_Iveco.pdf  ⚡ Flash       7m 26.2s             │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ✓       ✓         ✓        ⏳ 92%                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_HIAB.pdf  ⚡ Flash         7m 38.0s            │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ✓       ✓         ✓        ⏳ 92%                       │
└──────────────────────────────────────────────────────────┘

... 2 more files processing ...
```

**All 5 progress bars move simultaneously!** ⚡

---

### 3. Completed State

```
┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_200C.pdf  ⚡ Flash        ✓ 8m 27.5s           │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ✓       ✓         ✓        ✓                            │
├──────────────────────────────────────────────────────────┤
│           👁️ Click para ver detalles completos          │
└──────────────────────────────────────────────────────────┘
```

**User Action:**
- Click card to select source and view details
- Auto-scrolls to source in main list

---

### 4. Failed State

```
┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_Failed.pdf  ✨ Pro         5m 9.9s  [🔄 Retry]│
├──────────────────────────────────────────────────────────┤
│ ❌ Error en procesamiento                                │
│ Upload failed: Connection timeout                        │
└──────────────────────────────────────────────────────────┘
```

**User Actions:**
- Click "🔄 Retry" to re-process this single file
- Or use "Retry All Failed" at top to retry all

---

### 5. Completed with Warning

```
┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_NoEmbed.pdf  ⚡ Flash      ✓ 8m 15.2s          │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ✓       ✓         ✓        ⚠️                           │
├──────────────────────────────────────────────────────────┤
│ ⚠️ Completado con advertencia                            │
│ RAG indexing failed: Timeout. Document saved in          │
│ full-text mode.                                          │
└──────────────────────────────────────────────────────────┘
```

**Meaning:**
- File uploaded successfully
- Extraction successful
- RAG indexing failed (not critical)
- Document available in full-text search mode
- Can manually trigger RAG later

---

## 🔄 Duplicate Handling Dialog

### Enhanced Dialog (4 Options)

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️   Duplicate Files Detected                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  7 files already exist:                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ • Manual_Partes_Hiab_288.pdf                    │   │
│  │ • Manual_Operacion_Hiab_422.pdf                 │   │
│  │ • Manual_Partes_Pluma_377.pdf                   │   │
│  │ • Manual_Partes_BL211.pdf                       │   │
│  │ • Manual_Operacion_211.pdf                      │   │
│  │ • Manual_Hiab_166B.pdf                          │   │
│  │ • Manual_Duo_HiDuo.pdf                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⏭️  Skip duplicates (recommended)             │ ← PRIMARY
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔄  Replace with new version                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📋  Keep both (add -v7)                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Cancel upload                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Tip: Skipping duplicates will only upload new      │
│  files, saving time and avoiding re-processing.         │
└─────────────────────────────────────────────────────────┘
```

**Option Outcomes:**

| Option | Action | Files Processed | Time Impact |
|--------|--------|-----------------|-------------|
| **Skip** | Upload only new files | 5 new | 75% faster ✅ |
| Replace | Delete 7 + upload 12 | 12 total | Same as all |
| Keep Both | Rename 7 + upload 12 | 12 total | Same as all |
| Cancel | Nothing | 0 | Upload aborted |

---

## 🚀 Usage Scenarios

### Scenario 1: Fresh Bulk Upload (No Duplicates)

**Action:** Upload 10 new PDFs

**Result:**
```
🚀 Processing batch 1/2: 5 files in parallel
   Files: File1.pdf, File2.pdf, File3.pdf, File4.pdf, File5.pdf
   
   [All 5 progress bars moving...]
   
✅ Batch 1/2 complete (30s)

🚀 Processing batch 2/2: 5 files in parallel
   Files: File6.pdf, File7.pdf, File8.pdf, File9.pdf, File10.pdf
   
   [All 5 progress bars moving...]
   
✅ Batch 2/2 complete (30s)
✅ All uploads complete! Success: 10, Failed: 0
```

**Total Time:** ~60 seconds (vs 300s serial) ✅

---

### Scenario 2: Update Batch (Many Duplicates)

**Action:** Upload 50 PDFs (40 already exist, 10 new)

**Dialog:** "40 files already exist"

**User clicks:** "⏭️ Skip duplicates"

**Result:**
```
⏭️ Skipping 40 duplicate file(s)
📤 Uploading 10 file(s)

🚀 Processing batch 1/2: 5 files in parallel
✅ Batch 1/2 complete (30s)

🚀 Processing batch 2/2: 5 files in parallel  
✅ Batch 2/2 complete (30s)

✅ All uploads complete! Success: 10, Failed: 0
```

**Total Time:** ~60 seconds (vs 1500s for all 50) ✅  
**Time Saved:** 1440 seconds (24 minutes!) 🚀

---

### Scenario 3: Priority Upload (Force Start)

**Initial State:**
- Files 1-5: Processing (started automatically)
- Files 6-20: Queued

**User realizes File 15 is urgent**

**Action:** Click "▶️ Start" on File 15

**Result:**
```
⚡ Force starting upload for: File15-URGENT.pdf

[File 15 immediately starts processing]
[Now 6 files processing in parallel]

Status counters update:
⏳ 6  ← Was 5
⏸ 14  ← Was 15
```

**File 15 completes in ~30s instead of waiting 3+ minutes!**

---

### Scenario 4: Recover from Failures

**Initial State:**
- 35 completed
- 5 failed
- 2 processing

**User Action 1:** Click "Retry All Failed" at top

**Result:**
```
🔄 Retrying 5 failed uploads
🚀 Processing batch 1/1: 5 files in parallel

[All 5 retry in parallel]

✅ Batch 1/1 complete
✅ All uploads complete! Success: 4, Failed: 1
```

**User Action 2:** Click "🔄 Retry" on remaining failed file

**Result:**
```
🔄 Retrying 1 failed upload
🚀 Processing batch 1/1: 1 files in parallel

✅ Success!
✅ All uploads complete! Success: 40, Failed: 0
```

---

## 📊 Performance Comparison

### Serial Processing (Old)

```
Time ──────────────────────────────────────────────▶

File 1: ████████████ (30s)
File 2:             ████████████ (30s)
File 3:                         ████████████ (30s)
File 4:                                     ████████████ (30s)
File 5:                                                 ████████████ (30s)

Total: 150 seconds for 5 files
```

---

### Parallel Processing (New) ✅

```
Time ───────────▶

File 1: ████████████ (30s)
File 2: ████████████ (30s)
File 3: ████████████ (30s)
File 4: ████████████ (30s)
File 5: ████████████ (30s)

Total: 30 seconds for 5 files (5x faster!)
```

---

## 🎮 User Controls Summary

**At Queue Level:**
- **Start All** - Force all queued to start in parallel
- **Retry All Failed** - Retry all failed uploads

**Per-File:**
- **Start** (queued) - Force start this file now
- **Retry** (failed) - Retry this single file

**At Upload Time:**
- **Skip duplicates** - Don't re-upload existing files
- **Replace** - Delete old + upload new
- **Keep both** - Version suffix (-v1, -v2, etc.)
- **Cancel** - Abort upload

---

## 💡 Pro Tips

**Tip 1: Use Skip for Incremental Updates**
- Re-upload entire folder
- Click "Skip duplicates"  
- Only new/modified files process
- Saves 80-90% time ✅

**Tip 2: Force Start Urgent Files**
- Upload large batch
- Identify urgent file in queue
- Click "Start" to process immediately
- Don't wait for batch to complete

**Tip 3: Let it Run**
- Upload 50 files
- All process automatically in batches of 5
- Watch progress in real-time
- No babysitting needed ✅

**Tip 4: Bulk Retry on Network Issues**
- Network hiccup causes 10 failures
- Click "Retry All Failed" once
- All retry in parallel
- Fast recovery ✅

---

## 🐛 Known Issues & Warnings

### Issue: Files Stuck at 92%

**Symptom:**
- Progress reaches 92% in Embed stage
- Stops moving
- No error displayed

**Cause:**
- RAG indexing timed out or failed silently
- Backend completed but no response

**NEW Solution:**
- Files now show **warning message** if RAG fails
- Document is still saved (full-text mode)
- Can manually trigger RAG later
- Progress completes to 100% with warning badge

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│ 📄 Manual_NoRAG.pdf  ⚡ Flash        ✓ 8m 15.2s          │
├──────────────────────────────────────────────────────────┤
│ Upload → Extract → Chunk → Embed                         │
│  ✓       ✓         ✓        ⚠️                           │
├──────────────────────────────────────────────────────────┤
│ ⚠️ Completado con advertencia                            │
│ RAG indexing failed: Timeout. Document saved in          │
│ full-text mode.                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Common Workflows

### Workflow 1: Daily Manual Updates
```
1. Receive 5 updated manuals from engineering
2. Upload all 5 via drag-and-drop
3. All 5 process in parallel automatically
4. Wait ~30 seconds
5. All complete, ready to use in agents ✅
```

### Workflow 2: Monthly Full Refresh
```
1. Export all 50 manuals from document system
2. Upload entire folder to Flow
3. Dialog: "40 files already exist"
4. Click: "Skip duplicates"
5. Only 10 new files process (~60s)
6. Done! 24 minutes saved ✅
```

### Workflow 3: Urgent Document Addition
```
1. Batch upload 20 files in progress
2. Critical document arrives
3. Drag-drop critical document
4. It enters queue as File 21
5. Click "Start" on File 21
6. Processes immediately
7. Available in 30s (not 10 minutes later) ✅
```

---

## 📈 Expected Performance

### Small Batch (5 files)
- **Serial:** 150s
- **Parallel:** 30s
- **Speedup:** 5x

### Medium Batch (20 files)
- **Serial:** 600s (10m)
- **Parallel:** 120s (2m)
- **Speedup:** 5x

### Large Batch (50 files)
- **Serial:** 1500s (25m)
- **Parallel:** 300s (5m)
- **Speedup:** 5x

### With Skip (20 files, 15 duplicates)
- **Serial all:** 600s (10m)
- **Parallel with skip:** 30s (5 new only)
- **Speedup:** 20x ⚡

---

## ✅ Success Indicators

**Upload is working well if you see:**
- ✅ Multiple progress bars moving simultaneously
- ✅ Batch completion logs in console
- ✅ Status counters updating in real-time
- ✅ Files complete in ~30s each (not 150s total)
- ✅ Skip duplicates saves massive time
- ✅ Force start works immediately

**Issues to watch for:**
- ⚠️ All files stuck at 92% → RAG backend issue
- ⚠️ All uploads fail → API authentication issue
- ⚠️ Files stuck at 5% → Network/upload issue
- ⚠️ No parallel processing → Check console for errors

---

**The new system is live! Test by uploading a batch of PDFs and watch them process in parallel.** 🚀

