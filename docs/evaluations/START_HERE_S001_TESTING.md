# 🎯 START HERE - S001 Testing

**Last Updated:** 2025-10-29  
**Status:** Ready for manual testing

---

## ⚡ Quick Start (3 steps)

### 1. Open Browser
```
http://localhost:3000/chat
```
Login with: `alec@getaifactory.com` (Google OAuth)

### 2. Select Agent
Click: **"GESTION BODEGAS GPT (S001)"**

### 3. Open These 2 Files

**In one tab:** `S001_QUESTIONS_COPY_PASTE.md`  
→ Copy questions from here

**In another tab:** `S001_TESTING_CHECKLIST_2025-10-29.md`  
→ Track progress here

---

## 📚 All Testing Documents

### For Testing (Use These)
1. **S001_QUESTIONS_COPY_PASTE.md** ⭐ MAIN
   - 66 questions ready to copy
   - Organized by priority
   - Use this while testing

2. **S001_TESTING_CHECKLIST_2025-10-29.md** ⭐ TRACKING
   - Checkbox format
   - Progress tracking
   - Quick notation

### For Reference (Read If Needed)
3. **S001_TESTING_GUIDE_2025-10-29.md**
   - Complete methodology
   - Full documentation templates
   - Detailed instructions

4. **S001_TESTING_SUMMARY.md**
   - Overview and stats
   - Expected results
   - FAQs

5. **test-s001-questions.ts**
   - Analysis script
   - Run: `npx tsx test-s001-questions.ts`

---

## 🎯 Recommended Testing Plan

### PHASE 1: Critical Questions (30 mins) ⭐ START HERE
Test these 9 questions first:

1. ¿Dónde busco los códigos de materiales?
2. ¿Cómo hago una pedido de convenio?
3. ¿Cuál es el calendario de inventarios para el PEP?
4. ¿Cómo genero una guía de despacho?
5. ¿Qué es una ST?
6. ¿Qué es una SIM?
7. ¿Cómo puedo generar una guía de despacho?
8. ¿Cómo se realiza un traspaso de bodega?
9. ¿Cómo encuentro un Procedimiento, Instructivo o Paso a Paso?

**Why:** Most important warehouse operations  
**Expected:** 8.5-9.5/10 average, 0 phantom refs

---

### PHASE 2: High Priority Sample (45 mins)
Test 15 more questions from HIGH priority list

**Total after Phase 2:** 24 questions (36% coverage)  
**Time:** 75 mins total

---

### PHASE 3: Complete (Optional)
Test remaining 42 questions if desired

---

## ✅ Per-Question Checklist (2-3 mins each)

1. Click "+ Nuevo Chat" (fresh context)
2. Copy question from `S001_QUESTIONS_COPY_PASTE.md`
3. Paste and send
4. Wait 30-60s for response
5. Click "📚 Referencias utilizadas [N]"
6. Check: No phantom refs (numbers ≤ badges)
7. Rate 1-10
8. Note in checklist

**Quick format:**
```
Q001 | 9/10 | Refs: 5 | Phantoms: NO | Good SAP guidance
```

---

## 🎯 What to Verify

### Each Response Should Have:
- ✅ Complete answer to question
- ✅ SAP transaction codes (if applicable)
- ✅ Step-by-step procedure (if applicable)
- ✅ Document references (PP-XXX, I-XXX)
- ✅ Useful for warehouse specialist
- ✅ NO phantom refs

### Reference Panel Should Show:
- ✅ Reference count matches badges
- ✅ All refs have similarity % (75-85%)
- ✅ Document names are real (not invented)
- ✅ Preview text is relevant

---

## 📊 Expected Performance

Based on Q004 (10/10):

- **Average Quality:** 8.5-9.5/10
- **Phantom Refs:** 0 (system fixed)
- **Strong Categories:**
  - Procedimientos SAP (9-10/10)
  - Códigos y Catálogos (8-9/10)
  - Gestión Combustible (9-10/10)

---

## 🚨 What to Flag

**If you see:**
- ❌ Phantom refs (numbers > total badges)
- ❌ Quality < 7/10
- ❌ Empty or vague responses
- ❌ Wrong SAP procedures
- ❌ Invented document references

**Then:**
- 🚩 Flag for detailed review
- 📝 Create full documentation
- 🔍 May indicate system issue

---

## 📁 Where to Save Results

### Quick Notes (During Testing)
Update checklist file directly:
`S001_TESTING_CHECKLIST_2025-10-29.md`

### Full Documentation (For Critical/Issues)
Create individual files:
`docs/evaluations/evaluations/EVAL-S001-2025-10-29-v1/responses/Q0XX-response.md`

### Final Summary (After All Testing)
Update metadata:
`docs/evaluations/evaluations/EVAL-S001-2025-10-29-v1/metadata.json`

---

## 🎯 Success Criteria

### Minimum (30 questions in 90 mins):
- [x] All 9 CRITICAL tested
- [x] 15+ HIGH tested
- [x] Average ≥ 8.5/10
- [x] 0 phantom refs
- [x] Representative coverage achieved

### Ideal (66 questions in 3-4 hours):
- [x] Complete coverage
- [x] All categories validated
- [x] Pattern analysis done
- [x] Ready for expert review

---

## 🚀 Start Testing Now!

**You have everything you need:**
- ✅ Questions prepared
- ✅ Checklists ready
- ✅ Templates created
- ✅ Success criteria defined
- ✅ Testing URL: http://localhost:3000/chat

**Next action:**
1. Complete Google OAuth login (password prompt)
2. Select S001 agent
3. Open S001_QUESTIONS_COPY_PASTE.md
4. Start with Question 1

---

## ⏱️ Time Estimates

- **Critical only (9):** 25-30 mins
- **Critical + High sample (24):** 70-80 mins
- **Representative sample (30):** 90 mins
- **Full evaluation (66):** 3-4 hours

---

## 📞 Need Help?

All details are in:
- `S001_TESTING_GUIDE_2025-10-29.md` (comprehensive)
- `S001_TESTING_SUMMARY.md` (overview)

---

🎯 **You're ready! Start testing the 9 CRITICAL questions!** 🚀

**Current browser status:** OAuth password prompt  
**Next:** Enter password → access chat → start testing

