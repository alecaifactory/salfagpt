# 🚀 TEST NOW - Context Upload with Pricing Display

**Server Status:** ✅ Running on http://localhost:3000  
**Model:** Gemini 2.5 Pro (best quality)  
**Feature:** Token usage + Cost tracking

---

## ⚡ Quick Test (2 Minutes)

### Step 1: Open Browser
```
http://localhost:3000
```

### Step 2: Login
Click "Continuar con Google"

### Step 3: Select Agent
Choose existing or click "+ Nuevo Agente"

### Step 4: Upload Document
1. In left sidebar, find "Fuentes de Contexto"
2. Click "+ Agregar"
3. Select "Archivo"
4. Choose a PDF (start small, <5MB)
5. Verify model: **gemini-2.5-pro** ✓ (already selected)
6. Click "Agregar Fuente"

### Step 5: Watch Console
You should see:
```
📤 Uploading file: [name] ([size] MB) with model: gemini-2.5-pro
✅ Text extracted: [n] characters in [time]ms using gemini-2.5-pro
📊 Token usage: [input] input + [output] output = [total] total
💰 Cost: $[total] (Input: $[input], Output: $[output])
✅ Fuente guardada en Firestore: [id]
```

### Step 6: Check UI
**In Sidebar:**
- Source appears with toggle ON (green)
- Preview: First ~120 characters
- **NEW:** 💰 $0.0XXX • X,XXX tokens

**Click on Source:**
- Detail modal opens
- **NEW:** "📊 Uso de Tokens y Costo" section
- Shows: Input tokens, Output tokens, Total, Cost

### Step 7: Ask Question
```
Type: "¿Qué información contiene este documento?"
```
Verify AI uses the document content in response.

---

## ✅ What to Verify

### Token Display
- [ ] Input tokens shown (blue number)
- [ ] Output tokens shown (green number)
- [ ] Total tokens shown (black number)
- [ ] All formatted with commas (e.g., 12,450)

### Cost Display
- [ ] Total cost shown (purple, e.g., $0.0685)
- [ ] Input cost shown in breakdown
- [ ] Output cost shown in breakdown
- [ ] Formatted correctly ($0.XXXX)

### Calculation Accuracy
- [ ] Token count reasonable for file size
- [ ] Cost matches official pricing
- [ ] Breakdown adds up to total

---

## 💰 Expected Costs

### By File Size
| File Size | Approx Tokens | Pro Cost | Flash Cost |
|-----------|---------------|----------|------------|
| **<1 MB** | ~5,000 | $0.02 | $0.01 |
| **1-5 MB** | ~20,000 | $0.10 | $0.02 |
| **5-10 MB** | ~50,000 | $0.40 | $0.10 |

**Official Pricing:** https://ai.google.dev/gemini-api/docs/pricing

---

## 🚨 If Something Looks Wrong

### Token Count = 0
**Cause:** API didn't return token counts  
**Fix:** Check console for extraction errors

### Cost = $0.000
**Cause:** No tokens calculated  
**Fix:** Verify extraction succeeded

### Very High Cost
**Cause:** Large document or tiered pricing (>200k input tokens)  
**Expected:** Pro charges more for large prompts
**Solution:** Use Flash for large documents

### No Display in UI
**Cause:** Metadata not saved  
**Fix:** Check console for Firestore save error

---

## 📊 Cost Examples (Real Pricing)

### Example 1: Resume (3 pages)
```
Input: 3,428 tokens × $1.25/1M = $0.0043
Output: 1,842 tokens × $10.00/1M = $0.0184
TOTAL: $0.0227
```

### Example 2: Contract (15 pages)
```
Input: 18,234 tokens × $1.25/1M = $0.0228
Output: 10,562 tokens × $10.00/1M = $0.1056
TOTAL: $0.1284
```

### Example 3: Manual (50 pages)
```
Input: 68,450 tokens × $1.25/1M = $0.0856
Output: 42,183 tokens × $10.00/1M = $0.4218
TOTAL: $0.5074
```

---

## 🎯 Success = All These ✅

- [ ] File uploads successfully
- [ ] Console shows token usage
- [ ] Console shows cost breakdown
- [ ] Sidebar shows: 💰 $X.XXXX • X,XXX tokens
- [ ] Modal shows: Token Usage & Cost section
- [ ] Input tokens displayed
- [ ] Output tokens displayed
- [ ] Total cost displayed
- [ ] Can ask questions about document
- [ ] AI uses document in responses

---

## 🔧 Quick Checks

### Is server running?
```bash
curl http://localhost:3000
# Should return HTML (HTTP 200)
```

### Check console
Press F12 in browser → Console tab

### Check Network
Press F12 in browser → Network tab → Filter: XHR

---

## 🎉 Ready!

**Server:** ✅ http://localhost:3000  
**Code:** ✅ Compiled successfully  
**Features:** ✅ All implemented  
**Pricing:** ✅ Official data verified  

**→ Go upload a document and see the magic! 🚀**

---

**Next:** After successful test, I can commit changes if you approve.

