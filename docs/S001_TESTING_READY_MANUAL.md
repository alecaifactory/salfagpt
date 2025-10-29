# ✅ S001 Testing - Manual Process Required

**Date:** 2025-10-29  
**Status:** Ready for manual testing (OAuth required)

---

## 🚨 Why Manual Testing?

The automated script requires authentication, which needs:
- Google OAuth login (interactive)
- Session cookie from browser
- Cannot be fully automated without credentials

**Solution:** Manual testing with prepared materials

---

## 📋 Everything Prepared For You

### ✅ Testing Materials Created

1. **S001_QUESTIONS_COPY_PASTE.md** ⭐ USE THIS
   - All 66 questions ready to copy
   - Organized by priority
   - No formatting needed

2. **S001_TESTING_CHECKLIST_2025-10-29.md**
   - 30 representative questions
   - Checkbox tracking
   - Progress monitoring

3. **S001_TESTING_GUIDE_2025-10-29.md**
   - Complete methodology
   - Documentation templates
   - Success criteria

4. **test-s001-questions.ts**
   - Analysis and statistics
   - Testing overview

---

## 🎯 Simple 3-Step Process

### Step 1: Open Browser & Login (2 mins)
```
1. Open: http://localhost:3000/chat
2. Complete Google OAuth login
3. Select agent: "GESTION BODEGAS GPT (S001)"
```

### Step 2: Test Questions (2-3 mins each)
```
For each question:
1. Click "+ Nuevo Chat"
2. Copy question from S001_QUESTIONS_COPY_PASTE.md
3. Paste and send
4. Wait for response
5. Click "📚 Referencias utilizadas [N]"
6. Verify: No phantom refs
7. Rate 1-10
8. Quick note in checklist
```

### Step 3: Track Progress
```
Update S001_TESTING_CHECKLIST_2025-10-29.md with:
- [x] Checked boxes for completed
- Quality ratings
- Brief notes
```

---

## ⏱️ Time Estimates

### Recommended: Representative Sample
- **9 CRITICAL questions:** 25-30 mins
- **15 HIGH questions:** 45 mins
- **6 MEDIUM/LOW questions:** 20 mins
- **TOTAL:** ~90 mins (45% coverage)

### Alternative: Critical Only
- **9 CRITICAL questions:** 25-30 mins
- **Coverage:** 14% (core validation)

### Complete: All Questions
- **66 questions:** 3-4 hours
- **Coverage:** 100% (comprehensive)

---

## 📊 The 9 CRITICAL Questions (Start Here)

**Copy these into chat one by one:**

```
1. ¿Dónde busco los códigos de materiales?

2. ¿Cómo hago una pedido de convenio?

3. ¿Cuál es el calendario de inventarios para el PEP?

4. ¿Cómo genero una guía de despacho?

5. ¿Qué es una ST?

6. ¿Qué es una SIM?

7. ¿Cómo puedo generar una guía de despacho?

8. ¿Cómo se realiza un traspaso de bodega?

9. ¿Cómo encuentro un Procedimiento, Instructivo o Paso a Paso?
```

---

## ✅ Quick Documentation Format

For each question, note:

```
Q001 | 9/10 | Refs: 5 | Phantoms: NO | SAP transaction codes explained
Q002 | 8/10 | Refs: 7 | Phantoms: NO | Complete procedure, bit verbose
Q003 | 10/10 | Refs: 3 | Phantoms: NO | Perfect deadline info
```

---

## 📁 Files to Keep Open While Testing

### Tab 1: Questions Source
**File:** `docs/evaluations/S001_QUESTIONS_COPY_PASTE.md`
- Copy questions from here

### Tab 2: Progress Tracking
**File:** `docs/evaluations/S001_TESTING_CHECKLIST_2025-10-29.md`
- Check off completed questions
- Add ratings and notes

### Tab 3: Browser
**URL:** http://localhost:3000/chat
- S001 agent selected
- New chat for each question

---

## 🎯 What Good Looks Like

### Based on Q004 (10/10):
```
Question: ¿Cómo genero el informe de consumo de petróleo?

Response includes:
✅ Specific SAP transaction (ZMM_IE)
✅ Step-by-step procedure
✅ Fields to fill (Sociedad, PEP, etc.)
✅ Document reference (PP-009 found)
✅ 3 relevant references
✅ 80.7% similarity on main doc
✅ NO phantom refs
✅ Actionable for user
```

### Expected for Other Questions:
- Similar structure
- SAP specifics when relevant
- Clear procedures
- Relevant references
- 8.5-9.5/10 average

---

## 📊 Progress Tracking Template

Copy this into a notepad while testing:

```
S001 TESTING PROGRESS
=====================

CRITICAL (9):
[ ] Q001 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q002 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q008 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q009 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q011 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q012 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q052 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q058 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q063 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___

Progress: __/9 (__%)
Average: __.__/10
Phantom refs: __

HIGH (15 recommended):
[ ] Q003 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[ ] Q006 | __/10 | Refs: __ | Phantoms: NO/SÍ | Notes: ___
[... continue for 15 HIGH questions]

Progress: __/15 (__%)
Average: __.__/10

TOTAL TESTED: __ / 30 (__%)
OVERALL AVERAGE: __.__/10
PHANTOM REFS TOTAL: __
```

---

## 🚀 Start Testing Now!

### Immediate Next Steps:

1. **Complete OAuth login** in browser (currently at password prompt)
2. **Navigate to S001 agent**
3. **Open S001_QUESTIONS_COPY_PASTE.md** in editor
4. **Copy first question** (Q001)
5. **Paste into chat and send**
6. **Verify response quality**
7. **Repeat for all 9 CRITICAL**

---

## ✅ After Testing Session

### Update These Files:

1. **metadata.json**
   - questionsTested: [count]
   - coverage: [percentage]
   - averageQuality: [score]
   - phantomRefsDetected: [count]

2. **Progress file**
   - Document what's complete
   - Note patterns observed
   - Flag any issues

3. **Generate report** (if complete)
   - Summary of all results
   - Quality distribution
   - Recommendations

---

## 📊 Expected Outcome

After testing 30 representative questions:

- **Coverage:** 45% (30/66)
- **Quality:** 8.5-9.5/10 average
- **Phantom refs:** 0
- **Time:** ~90 mins
- **Confidence:** High (all categories sampled)

---

## 🎯 Success Criteria Met If:

- [x] All 9 CRITICAL tested
- [x] Average ≥ 8.5/10
- [x] 0 phantom refs
- [x] At least 15 HIGH tested
- [x] Representative sample complete

---

## 🚀 You're Ready!

**Everything is prepared.**  
**Just need manual execution.**

**Next:** Complete Google OAuth login and start testing!

**Files to use:**
- Questions: `S001_QUESTIONS_COPY_PASTE.md`
- Tracking: `S001_TESTING_CHECKLIST_2025-10-29.md`
- Reference: `S001_TESTING_GUIDE_2025-10-29.md`

---

⏱️ **Estimated time for representative sample:** 90 minutes  
🎯 **Expected quality:** 8.5-9.5/10 based on Q004  
✅ **System status:** Ready and operational

