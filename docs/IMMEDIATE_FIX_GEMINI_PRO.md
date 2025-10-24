# ✅ Immediate Fix: Use Gemini Pro for SSOMA

## 🎯 Decision

**Switch to Gemini Pro** (not Vision API) because:

1. ✅ User confirmed PDF has native text (not scanned)
2. ✅ Gemini Pro can handle multi-page PDFs
3. ✅ Vision API `documentTextDetection` is for single images, not multi-page PDFs
4. ✅ For multi-page PDFs, need Document AI (more complex setup)

---

## 📝 Current Status

**Applied in commit e294353:**
- Using `gemini-2.5-pro` (not Flash)
- Using `extractionMethod: 'gemini'`
- This should extract complete text

---

## 🧪 **Test Now:**

1. Upload SSOMA-P-004
2. Should use Gemini Pro
3. Should extract complete text
4. Should chunk into ~88 chunks of 1000 tokens
5. Should find "riesgo más grave" in search

---

## 📊 **Why Gemini Pro will work:**

- Pro model: 2M context window (vs 1M for Flash)
- Better at structured documents
- Handles tables better
- More accurate OCR
- $1.20 cost (vs $0.28 Flash) but worth it for quality

---

**Status:** Ready to test with Gemini Pro  
**Next:** Upload SSOMA-P-004 and verify extraction quality

