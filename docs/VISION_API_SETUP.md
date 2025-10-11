# ⚠️ DEPRECATED: Vision API Setup

## Migration Notice

**This document is deprecated.** Flow now uses **Gemini AI** for document extraction instead of Google Cloud Vision API.

### Why We Migrated

- ✅ **Native PDF processing** - Gemini can process PDFs directly
- ✅ **Model selection** - Choose between speed and accuracy
- ✅ **Better structure understanding** - Gemini understands document layout
- ✅ **Simpler setup** - Only requires API key, no service account
- ✅ **Consistent SDK** - Use same SDK for all AI features

### New Documentation

Please refer to:
- **[Gemini PDF Extraction Guide](./GEMINI_PDF_EXTRACTION.md)** - Complete setup and usage

### Migration Steps

If you were using Vision API:

1. **Remove old dependency:**
   ```bash
   npm uninstall @google-cloud/vision
   ```

2. **Add Gemini API key to `.env`:**
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Code changes are already applied** - No action needed

### What Changed

**Old Implementation (Vision API):**
- Required: Google Cloud service account
- Setup: Complex IAM permissions
- Service: Google Cloud Vision API
- Processing: OCR-based text extraction

**New Implementation (Gemini AI):**
- Required: Gemini API key
- Setup: Add to `.env` file
- Service: Gemini AI
- Processing: Intelligent document understanding

---

**Last Updated:** January 11, 2025  
**Status:** DEPRECATED - Use Gemini AI instead  
**New Docs:** [GEMINI_PDF_EXTRACTION.md](./GEMINI_PDF_EXTRACTION.md)
