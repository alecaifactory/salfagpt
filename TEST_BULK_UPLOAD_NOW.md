# ✅ Test Bulk Upload Improvements - NOW

## 🎯 What to Test

### Test 1: Progressive Progress Bar

**Steps:**
1. Open http://localhost:3000/chat
2. Login as `alec@getaifactory.com`
3. Click **Context Management** (bottom-left menu)
4. Drop a PDF file in the upload zone
5. **Watch the progress bar carefully**

**What you should see:**
```
Progress evolves smoothly through these stages:
  5% → 10% → 20% → 35% → 50% → 65% → 80% → 90% → 100%

Not the old way:
  10% → 70% → 100% (sudden jumps)
```

**Success criteria:**
- ✅ Progress bar moves smoothly
- ✅ Each stage is visible (not instant jumps)
- ✅ You can see it progressing
- ✅ Reaches 100% at completion

---

### Test 2: Model Selection

**Steps:**
1. In Context Management
2. Drop/select 1+ PDF files
3. **Upload staging area appears**
4. **Look for model picker below tags input**

**What you should see:**

```
┌─────────────────────────────────────────────┐
│  AI Model for Extraction                    │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐         │
│  │ ⚡ Flash     │  │ ✨ Pro       │         │
│  │ ⭕ Selected  │  │ ○            │         │
│  │ Rápido y     │  │ Máxima       │         │
│  │ económico    │  │ precisión    │         │
│  │ 94% más      │  │ Mayor        │         │
│  │ barato       │  │ calidad      │         │
│  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

**Success criteria:**
- ✅ Flash is selected by default (green border)
- ✅ Can click Pro to switch (turns purple)
- ✅ Can click back to Flash
- ✅ Visual feedback on selection

---

### Test 3: Model in Upload Queue

**Steps:**
1. After selecting model (Flash or Pro)
2. Click "Upload Files"
3. **Look at upload queue items**

**What you should see:**

**With Flash:**
```
┌─────────────────────────────────────────────┐
│ ⏳ Manual-Ordenanzas.pdf                    │
├─────────────────────────────────────────────┤
│ [████████░░░░░░░░░░░░] 40%                  │
├─────────────────────────────────────────────┤
│ ⚡ Flash    LEGAL-1                         │
│  ↑ Green badge                              │
└─────────────────────────────────────────────┘
```

**With Pro:**
```
┌─────────────────────────────────────────────┐
│ ⏳ Manual-Ordenanzas.pdf                    │
├─────────────────────────────────────────────┤
│ [████████░░░░░░░░░░░░] 40%                  │
├─────────────────────────────────────────────┤
│ ✨ Pro    LEGAL-1                           │
│  ↑ Purple badge                             │
└─────────────────────────────────────────────┘
```

**Success criteria:**
- ✅ Model badge appears in queue item
- ✅ Flash = ⚡ with green styling
- ✅ Pro = ✨ with purple styling
- ✅ Badge appears next to tags

---

### Test 4: Complete Flow

**Full test:**
1. Select 2 PDFs
2. Choose **Pro** model
3. Add tags: `TEST-001, BULK-UPLOAD`
4. Click "Upload Files"
5. Watch progress bars evolve smoothly
6. Verify both show ✨ Pro badge
7. Wait for completion
8. Check both are in "All Context Sources"
9. Click one to see details
10. Verify metadata shows `gemini-2.5-pro`

**Success criteria:**
- ✅ Both files uploaded successfully
- ✅ Both used Pro model
- ✅ Both have tags TEST-001, BULK-UPLOAD
- ✅ Both show ✨ Pro badge in queue
- ✅ Metadata confirms model used

---

## 🎨 Visual Changes Summary

### NEW: Model Picker in Staging Area

**Location:** Below tags input, above Upload Files button

**Design:**
- 2-column grid
- Radio button style selection
- Green = Flash (selected)
- Purple = Pro (selected)
- Hover effects
- Clear labels and descriptions

### IMPROVED: Progress Bar

**Old behavior:**
```
10% ────────────────► 70% ────────────────► 100%
    Big jump              Big jump
```

**New behavior:**
```
5% ─► 10% ─► 20% ─► 35% ─► 50% ─► 65% ─► 80% ─► 90% ─► 100%
   Small  Small  Small  Small  Small  Small  Small  Small
   step   step   step   step   step   step   step   step
```

### NEW: Model Badge in Queue

**Flash:**
```
⚡ Flash
```
- Green background
- Green text
- Small badge next to tags

**Pro:**
```
✨ Pro
```
- Purple background
- Purple text
- Small badge next to tags

---

## 🐛 Known Issues

**None** - This is a purely additive feature:
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ No existing features affected

---

## ✅ Quick Verification

**Visual check:**
1. See model picker? ✓
2. Flash selected by default? ✓
3. Can switch to Pro? ✓
4. Progress bar smoother? ✓
5. Model badge in queue? ✓

**Functional check:**
1. Upload with Flash works? ✓
2. Upload with Pro works? ✓
3. Metadata saves model? ✓
4. Progress reaches 100%? ✓

---

## 🎯 Expected User Experience

### Before
- "Why is progress jumping around?"
- "Can't tell if it's stuck"
- "No control over extraction model"
- "All uploads use expensive Pro model"

### After
- ✅ "Progress is smooth and clear"
- ✅ "I can see each stage happening"
- ✅ "I can choose Flash for simple docs"
- ✅ "I can choose Pro for complex docs"
- ✅ "I can see which model was used"

---

**Ready to test!** 🚀

Open: http://localhost:3000/chat

