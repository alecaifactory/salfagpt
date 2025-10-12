# Gemini AI PDF Extraction Setup

## Overview

Flow uses **Gemini AI** for intelligent document extraction from PDFs and images. Unlike traditional OCR services, Gemini AI:

- ✅ **Natively processes PDFs** - No need for PDF parsing libraries
- ✅ **Understands document structure** - Maintains formatting, headers, tables
- ✅ **Works with images** - Built-in OCR capabilities
- ✅ **Supports multiple models** - Choose between `gemini-2.5-flash` (fast, cheap) and `gemini-2.5-pro` (advanced, accurate)
- ✅ **Extracts complete text** - Not just OCR, but intelligent text extraction

## Architecture

```
User uploads PDF → Frontend (workflowExtractors.ts)
                     ↓
                  FormData with:
                   • file (PDF/image)
                   • model (gemini-2.5-flash/pro)
                     ↓
              API: /api/extract-document.ts
                     ↓
              Gemini AI API (via @google/genai)
                     ↓
              Extracted text with metadata
                     ↓
              Context Source with extracted data
```

## Configuration

### Environment Variables

**Required:**
- `GEMINI_API_KEY` - Your Gemini API key from Google AI Studio

**Optional:**
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID (for observability logs)

### Local Development Setup

1. **Get Gemini API Key:**
   ```bash
   # Visit: https://aistudio.google.com/app/apikey
   # Create a new API key
   ```

2. **Add to `.env` file:**
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Verify Setup:**
   ```bash
   # Start development server
   npm run dev
   
   # Upload a PDF through the UI
   # Check console for:
   # ✅ Gemini AI client initialized
   # 📄 Extracting text from: document.pdf using gemini-2.5-flash
   # ✅ Text extracted: 12345 characters in 2500ms using gemini-2.5-flash
   ```

### GCP Production Setup

1. **Enable Gemini API:**
   ```bash
   # The Gemini API is already enabled if you have a valid API key
   # No additional GCP service needs to be enabled
   ```

2. **Set Environment Variable in Cloud Run:**
   ```bash
   gcloud run services update flow-production \
     --update-env-vars GEMINI_API_KEY=your-api-key-here \
     --region us-central1
   ```

3. **Verify in Production:**
   ```bash
   # Check logs
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=flow-production" \
     --limit 50 \
     --format json \
     | grep "Gemini AI"
   ```

## Code Implementation

### API Endpoint (`src/pages/api/extract-document.ts`)

```typescript
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client
const geminiClient = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// Extract text from PDF
const result = await geminiClient.models.generateContent({
  model: 'gemini-2.5-flash', // or 'gemini-2.5-pro'
  contents: [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        {
          text: 'Extrae TODO el texto de este documento de manera estructurada.',
        },
      ],
    },
  ],
  config: {
    temperature: 0.1, // Low temp for accurate extraction
    maxOutputTokens: 8192,
  },
});
```

### Frontend (`src/lib/workflowExtractors.ts`)

```typescript
export async function extractPdfText(
  file: File, 
  config?: WorkflowConfig
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', config?.model || 'gemini-2.5-flash');

  const response = await fetch('/api/extract-document', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  return result.text;
}
```

## Model Selection

### Gemini 2.5 Flash (Default)
- **Speed:** ⚡ Fast (1-3 seconds)
- **Cost:** 💰 $0.000075 per 1K input tokens
- **Best for:** Standard documents, quick previews
- **Accuracy:** ✅ High (95%+)

### Gemini 2.5 Pro (Advanced)
- **Speed:** 🐢 Slower (3-8 seconds)
- **Cost:** 💰💰 $0.00125 per 1K input tokens (~17x more expensive)
- **Best for:** Complex layouts, tables, critical documents
- **Accuracy:** ✅✅ Very High (98%+)

**Recommendation:** Always try Flash first, only upgrade to Pro if needed.

## Supported File Types

- ✅ `application/pdf` - PDF documents
- ✅ `image/png` - PNG images
- ✅ `image/jpeg` - JPEG images
- ✅ `image/jpg` - JPG images

**Max file size:** 50 MB

## Error Handling

### Common Errors

**1. GEMINI_API_KEY not configured**
```
Error: GEMINI_API_KEY not configured
Solution: Add GEMINI_API_KEY to .env file
```

**2. File too large**
```
Error: File too large. Maximum size: 50MB
Solution: Compress PDF or split into multiple files
```

**3. Invalid file type**
```
Error: Invalid file type. Supported: PDF, PNG, JPEG
Solution: Convert file to supported format
```

**4. No text found**
```
Warning: No text found in document
Possible causes:
- Document is empty
- Document contains only images (try Gemini Pro)
- Document is corrupted
```

## Debugging

### Enable Verbose Logging

**Backend (`src/pages/api/extract-document.ts`):**
```typescript
console.log(`📄 Extracting text from: ${file.name} using ${model}`);
console.log(`✅ Text extracted: ${extractedText.length} characters in ${extractionTime}ms`);
```

**Frontend (`src/lib/workflowExtractors.ts`):**
```typescript
console.log('Starting PDF extraction with config:', config);
console.log('Extraction result:', result);
```

### Check Logs

**Local Development:**
```bash
# Terminal output shows all logs
npm run dev
```

**Production:**
```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 100 \
  --format json
```

## Performance Optimization

### 1. Model Selection
- Use `gemini-2.5-flash` by default
- Only upgrade to `pro` for complex documents

### 2. File Size
- Compress PDFs before upload
- Remove unnecessary images
- Target < 5MB for best performance

### 3. Caching
- Cache extracted text in Firestore
- Reuse extracted data across conversations
- Set `maxOutputLength` in config to truncate long documents

### 4. Parallel Processing
- Extract multiple documents in parallel
- Use separate API calls for each file
- Monitor token usage to avoid rate limits

## Cost Estimation

### Example Scenarios

**Scenario 1: 10-page PDF (standard text)**
- Input tokens: ~8,000
- Model: gemini-2.5-flash
- Cost: $0.60 per 1,000 extractions
- Time: ~2 seconds

**Scenario 2: 10-page PDF (complex tables)**
- Input tokens: ~8,000
- Model: gemini-2.5-pro
- Cost: $10.00 per 1,000 extractions
- Time: ~5 seconds

**Monthly estimates for 1,000 users:**
- 10 PDFs/user/month: $6,000 (Flash) or $100,000 (Pro)
- **Recommendation:** Flash for 90%+ of documents

## Migration from Vision API

If you previously used Google Cloud Vision API:

### What Changed

**Before (Vision API):**
```typescript
import { ImageAnnotatorClient } from '@google-cloud/vision';

const [result] = await client.documentTextDetection({
  image: { content: buffer },
});

const text = result.fullTextAnnotation?.text;
```

**After (Gemini AI):**
```typescript
import { GoogleGenAI } from '@google/genai';

const result = await client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ inlineData: { ... } }] }],
});

const text = result.text;
```

### Benefits of Migration

- ✅ **Better accuracy** - Gemini understands document structure
- ✅ **Faster setup** - No GCP service account needed
- ✅ **Model selection** - Choose speed vs. accuracy
- ✅ **Simpler code** - One SDK for all AI features
- ✅ **Better error handling** - Consistent API patterns

## Troubleshooting

### Issue: Extraction fails silently

**Check:**
1. API key is valid: `echo $GEMINI_API_KEY`
2. File type is supported: `file --mime-type document.pdf`
3. File size < 50MB: `ls -lh document.pdf`
4. Network connectivity to Gemini API

### Issue: Extracted text is incomplete

**Solutions:**
1. Try `gemini-2.5-pro` instead of `flash`
2. Increase `maxOutputTokens` in config
3. Check if PDF is corrupted
4. Verify PDF is not password-protected

### Issue: Extraction is too slow

**Solutions:**
1. Use `gemini-2.5-flash` instead of `pro`
2. Reduce file size by compressing PDF
3. Set `maxOutputLength` to limit output
4. Check network latency to Gemini API

## Testing

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
open http://localhost:3000/chat

# 3. Click "Agregar Fuente de Contexto"
# 4. Select "PDF con Texto"
# 5. Upload a test PDF
# 6. Verify extraction in console and UI
```

### Production Testing

```bash
# Test API endpoint directly
curl -X POST https://flow-production-xxxx.run.app/api/extract-document \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.pdf" \
  -F "model=gemini-2.5-flash"
```

## Related Documentation

- [Gemini API Usage Rules](../.cursor/rules/gemini-api-usage.mdc)
- [Workflow Extractors Implementation](../src/lib/workflowExtractors.ts)
- [Extract Document API](../src/pages/api/extract-document.ts)
- [Gemini AI Official Docs](https://ai.google.dev/docs)

---

**Last Updated:** January 11, 2025  
**Migration:** Replaced Google Cloud Vision API with Gemini AI  
**Benefit:** Native PDF processing with model selection

