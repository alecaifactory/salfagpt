/**
 * Google Cloud Vision API - PDF Text Extraction
 * 
 * Uses Document AI for superior OCR and text extraction from PDFs
 * Better than Gemini for scanned documents and complex layouts
 */

import vision from '@google-cloud/vision';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';

// Initialize Vision API client
const client = new vision.ImageAnnotatorClient({
  projectId: PROJECT_ID,
});

console.log('👁️ Google Cloud Vision API initialized');
console.log(`  Project: ${PROJECT_ID}`);

export interface VisionExtractionResult {
  text: string;
  confidence: number;
  pages: number;
  language: string;
  extractionTime: number;
  method: 'vision-api';
}

/**
 * Extract text from PDF using Google Cloud Vision API
 * 
 * Superior to Gemini for:
 * - Scanned PDFs (OCR)
 * - Complex layouts
 * - Tables and forms
 * - Multi-language documents
 * 
 * @param pdfBuffer - PDF file as Buffer
 * @param options - Extraction options
 */
export async function extractTextWithVisionAPI(
  pdfBuffer: Buffer,
  options: {
    detectLanguage?: boolean;
    includeConfidence?: boolean;
  } = {}
): Promise<VisionExtractionResult> {
  const startTime = Date.now();
  
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│ 👁️  GOOGLE CLOUD VISION API - PDF EXTRACTION   │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`📄 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🌍 Project: ${PROJECT_ID}`);
  console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}\n`);
  
  try {
    console.log('🔄 Step 1/3: Encoding PDF to base64...');
    const base64Start = Date.now();
    const base64Data = pdfBuffer.toString('base64');
    console.log(`✅ Encoded in ${Date.now() - base64Start}ms\n`);
    
    console.log('🔄 Step 2/3: Calling Vision API...');
    console.log('   Endpoint: Cloud Vision Document Text Detection');
    console.log('   Language hints: Spanish (es), English (en)');
    
    // Use document text detection (optimized for dense text)
    const apiCallStart = Date.now();
    const [result] = await client.documentTextDetection({
      image: {
        content: pdfBuffer.toString('base64'),
      },
      imageContext: {
        languageHints: ['es', 'en'], // Spanish and English
      },
    });
    
    const apiCallTime = Date.now() - apiCallStart;
    console.log(`✅ Vision API responded in ${apiCallTime}ms\n`);
    
    console.log('🔄 Step 3/3: Processing response...');
    const fullText = result.fullTextAnnotation;
    
    if (!fullText || !fullText.text) {
      console.warn('⚠️ Vision API returned no text');
      console.warn('   Possible reasons:');
      console.warn('   - PDF is image-only (try with OCR)');
      console.warn('   - File is corrupted');
      console.warn('   - API quota exceeded');
      return {
        text: '',
        confidence: 0,
        pages: 0,
        language: 'unknown',
        extractionTime: Date.now() - startTime,
        method: 'vision-api',
      };
    }
    
    // Calculate average confidence
    const avgConfidence = fullText.pages
      ? fullText.pages.reduce((sum, page) => sum + (page.confidence || 0), 0) / fullText.pages.length
      : 0;
    
    // Detect language
    const detectedLanguage = result.textAnnotations?.[0]?.locale || 'es';
    
    // Count words for validation
    const wordCount = fullText.text.split(/\s+/).filter(w => w.length > 0).length;
    
    const extractionTime = Date.now() - startTime;
    
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ✅ VISION API EXTRACTION SUCCESSFUL             │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📊 Results:`);
    console.log(`   Characters: ${fullText.text.length.toLocaleString()}`);
    console.log(`   Words: ${wordCount.toLocaleString()}`);
    console.log(`   Pages: ${fullText.pages?.length || 1}`);
    console.log(`   Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`   Language: ${detectedLanguage}`);
    console.log(`⏱️  Total time: ${(extractionTime / 1000).toFixed(2)}s`);
    console.log(`💰 Est. cost: $${calculateVisionAPICost(fullText.pages?.length || 1).toFixed(4)}\n`);
    
    return {
      text: fullText.text,
      confidence: avgConfidence,
      pages: fullText.pages?.length || 1,
      language: detectedLanguage,
      extractionTime,
      method: 'vision-api',
    };
    
  } catch (error) {
    console.error('❌ Vision API extraction failed:', error);
    throw new Error(`Vision API error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Extract text from PDF with retry logic
 */
export async function extractTextWithVisionAPIRetry(
  pdfBuffer: Buffer,
  maxRetries: number = 2
): Promise<VisionExtractionResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`👁️ Vision API attempt ${attempt}/${maxRetries}...`);
      return await extractTextWithVisionAPI(pdfBuffer);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // Exponential backoff
        console.log(`  Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Vision API extraction failed after retries');
}

/**
 * Calculate cost for Vision API
 * Pricing: $1.50 per 1000 pages
 */
export function calculateVisionAPICost(pages: number): number {
  return (pages / 1000) * 1.50;
}

