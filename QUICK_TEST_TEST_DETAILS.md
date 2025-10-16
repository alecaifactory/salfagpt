# 🧪 Quick Test - Test Details View

**Feature:** Detailed test results display in Agent Evaluation Dashboard

---

## ✅ Testing Steps

### 1. Navigate to Evaluations
```
URL: http://localhost:3000/chat
Login: expert@demo.com (or any admin/expert account)
Click: User menu (bottom left)
Click: "Evaluaciones de Agentes"
```

### 2. Run an Evaluation
```
Click: Any agent's "Evaluar Agente" button
Review: Pre-check screen
Click: "Iniciar Evaluación"
Wait: Progress bar completes (15 tests)
```

### 3. View Results Summary
```
See:
✅ Agente APROBADO (or ⚠️ Requiere Mejoras)
Score: 92% (Umbral: 85%)

Cards showing:
- 13 Tests Aprobados (87%)
- 2 Tests Fallidos (13%)
- 15 Total Ejecutados

Criteria bars:
- Precision: 95%
- Clarity: 93%
- Completeness: 90%
- Speed: 88%
```

### 4. **NEW ⭐ View Test Details**
```
Click: "Ver Detalles de Tests" button (blue border)

Should see:
✅ Header: "📋 Detalle de Tests - [Agent Name]"
✅ Summary stats (4 cards):
   - Aprobados: 13 (87%)
   - Fallidos: 2 (13%)
   - Tiempo Promedio: ~1000ms
   - Score Promedio: 92%

✅ Results by Category (4 boxes):
   - Conocimiento Técnico: 100%
   - Coherencia: 75%
   - Precisión Factual: 100%
   - Velocidad: 75%

✅ Individual test cards (15 total):
   - Each shows: Test #, Category, Score, Pass/Fail badge
   - Blue background for passed
   - Red background for failed
```

### 5. **Expand a Test**
```
Click: Any test card to expand

Should see complete details:
✅ INPUT DEL TEST: (question in gray box)
✅ SALIDA ESPERADA: (expected output in gray box)
✅ SALIDA REAL DEL AGENTE: (actual output in colored box)
✅ DESGLOSE POR CRITERIO: (4 bars in 2x2 grid)
   - Precisión: XX%
   - Claridad: XX%
   - Completitud: XX%
   - Velocidad: XX%
✅ EVALUACIÓN: (feedback message in colored box)
✅ Metadata:
   - Ejecutado: timestamp
   - Evaluado por: email
   - Tiempo Ejecución: XXXms

Each section clearly labeled with icons
Passed tests = blue theme
Failed tests = red theme
```

### 6. **Test Multiple Expansions**
```
Expand: Test #1 (passed) - should show green/blue theme
Expand: Test #14 (failed) - should show red theme
Collapse: Test #1
Verify: Smooth expand/collapse animation
```

### 7. **Test Export**
```
Click: "Exportar Resultados" button

Should:
✅ Download file: evaluacion-{agentName}-{timestamp}.json
✅ File contains array of 15 test objects
✅ Each object has all fields:
   - id, testNumber, category
   - input, expectedOutput, actualOutput
   - passed, score, executionTime
   - criteriaScores (4 criteria)
   - feedback, timestamp, evaluatedBy
```

### 8. **Navigation**
```
Click: "← Volver a Resumen" (top or bottom)
Verify: Returns to results summary view
Verify: Can click "Ver Detalles de Tests" again
Verify: Data persists (same test results shown)
```

---

## 🎯 What to Look For

### ✅ Expected Behavior

**Layout:**
- Clean, professional design
- Clear visual hierarchy
- Proper spacing and alignment
- Readable text sizes

**Interaction:**
- Smooth expand/collapse
- Clear hover states
- Responsive click areas
- Fast navigation

**Data Display:**
- All 15 tests present
- Scores accurate (passed: 90-100%, failed: 60-80%)
- Categories distributed evenly
- Timestamps sequential
- Execution times realistic (800-1200ms)

**Color Coding:**
- Passed = Blue theme (consistent)
- Failed = Red theme (consistent)
- Clear visual distinction
- Good contrast for readability

---

### ❌ Issues to Watch For

**Visual:**
- Layout breaking or overlapping
- Text truncation or overflow
- Colors not matching theme
- Icons missing or misaligned

**Functional:**
- Expand/collapse not working
- Export not downloading
- Navigation not working
- Data not showing

**Data:**
- Missing test fields
- Incorrect scores
- Wrong pass/fail status
- Timestamps out of order

---

## 📊 Expected Test Distribution

**15 Tests Total:**
- ✅ Passed: 13 tests (87%)
- ❌ Failed: 2 tests (13%)

**By Category:**
- Conocimiento Técnico: 3/3 passed (100%)
- Coherencia: 3/4 passed (75%)
- Precisión Factual: 4/4 passed (100%)
- Velocidad: 3/4 passed (75%)

**Scores:**
- Passed tests: 90-100%
- Failed tests: 60-80%
- Overall average: 92%

---

## 🚀 Server Status

**Dev Server:** ✅ Running on http://localhost:3000  
**Process ID:** 22143  
**Ready for Testing:** YES

---

## 📸 Visual Preview

### Test Details View Structure
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Detalle de Tests - Agente Name    [← Volver]        │
│ Resultados individuales de 15 tests ejecutados         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────┬─────────┬─────────┬─────────┐              │
│ │ ✅ 13   │ ❌ 2    │ ⏱️ 1000ms│ 📊 92% │ Summary Stats│
│ └─────────┴─────────┴─────────┴─────────┘              │
│                                                         │
│ 📊 Resultados por Categoría                            │
│ ┌─────────┬─────────┬─────────┬─────────┐              │
│ │Tech:100%│Coher:75%│Prec:100%│Vel:75% │              │
│ └─────────┴─────────┴─────────┴─────────┘              │
│                                                         │
│ 🔍 Resultados Individuales (15 tests)                  │
│ ┌─────────────────────────────────────────┐  Scrollable│
│ │ ✅ Test #1 - Conocimiento   [95%] [PASÓ]│            │
│ │    (Click to expand)                     │            │
│ ├─────────────────────────────────────────┤            │
│ │ ✅ Test #2 - Coherencia     [92%] [PASÓ]│            │
│ ├─────────────────────────────────────────┤            │
│ │ ✅ Test #3 - Precisión      [94%] [PASÓ]│            │
│ ├─────────────────────────────────────────┤            │
│ │ ... (12 more tests)                      │            │
│ ├─────────────────────────────────────────┤            │
│ │ ❌ Test #14 - Velocidad     [65%] [FALLÓ]│            │
│ │    (Click to expand)                     │            │
│ └─────────────────────────────────────────┘            │
│                                                         │
│ 📈 Resumen de Rendimiento                              │
│ ┌───────────────────────────────────────────┐          │
│ │ Tiempo Total: 15.2s                       │          │
│ │ Mejor Categoría: Conocimiento Técnico     │          │
│ │ Tests que Requieren Atención: 2           │          │
│ └───────────────────────────────────────────┘          │
│                                                         │
│ [← Volver] ────────────────── [📤 Exportar Resultados] │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 Success Indicators

When everything works correctly, you should be able to:

1. ✅ **Navigate** smoothly between Results Summary ↔ Test Details
2. ✅ **See all 15 tests** in the individual results section
3. ✅ **Expand any test** to see complete details
4. ✅ **Read all test fields** clearly (input, expected, actual, scores, feedback)
5. ✅ **Understand** why each test passed or failed
6. ✅ **Export** complete test data as JSON
7. ✅ **Identify** which categories need improvement
8. ✅ **View** performance summary with actionable insights

---

## 💡 Tips for Testing

1. **Test with passed tests:** Expand several passed tests to verify blue theme consistency
2. **Test with failed tests:** Expand failed tests to verify red theme and feedback clarity
3. **Test scrolling:** With 15 tests, the list should scroll smoothly (max-height: 400px)
4. **Test export:** Open the downloaded JSON to verify data integrity
5. **Test navigation:** Switch back and forth multiple times to verify state persistence

---

**Ready to Test!** 🚀

Open http://localhost:3000/chat and follow the steps above.

Report any issues or visual inconsistencies for immediate fixing.

