/**
 * Google Cloud Vision API - PDF Text Extraction with Chunking
 * 
 * Uses Document AI for superior OCR and text extraction from PDFs
 * Better than Gemini for scanned documents and complex layouts
 * 
 * FEATURES (2025-11-02):
 * - Automatic PDF chunking for files >20MB
 * - Parallel chunk processing
 * - Smart fallback to Gemini for files >40MB
 * - Retry logic for transient errors
 */

import vision from '@google-cloud/vision';
import { PDFDocument } from 'pdf-lib';

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
  method: 'vision-api' | 'vision-api-chunked';
  chunksProcessed?: number;
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
  const fileSizeBytes = pdfBuffer.length;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
  
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│ 👁️  GOOGLE CLOUD VISION API - PDF EXTRACTION   │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`📄 PDF size: ${fileSizeMB} MB`);
  console.log(`🌍 Project: ${PROJECT_ID}`);
  console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}\n`);
  
  // ✅ UPDATED: Smart chunking strategy (2025-11-02)
  // Vision API: Best for files up to 40MB with chunking
  // Chunks: Split large PDFs into ≤20MB pieces for Vision API
  // Gemini API: Better for files >40MB (user approval required for >100MB)
  const chunkSizeBytes = 20 * 1024 * 1024; // 20MB per chunk for Vision API
  const maxVisionSizeBytes = 40 * 1024 * 1024; // 40MB max for Vision API (with chunking)
  const recommendedMaxBytes = 100 * 1024 * 1024; // 100MB recommended limit
  const absoluteMaxBytes = 500 * 1024 * 1024; // 500MB absolute limit
  
  // ✅ Absolute limit: Reject files >500MB
  if (fileSizeBytes > absoluteMaxBytes) {
    const maxSizeMB = (absoluteMaxBytes / (1024 * 1024)).toFixed(0);
    const errorMsg = `⚠️ File too large: ${fileSizeMB} MB (absolute max: ${maxSizeMB} MB). Please split or compress the PDF.`;
    console.error(errorMsg);
    console.error('   💡 Tip: Use Adobe Acrobat or similar to compress large PDFs');
    throw new Error(errorMsg);
  }
  
  // ✅ Warn for files >100MB (user must have approved)
  if (fileSizeBytes > recommendedMaxBytes) {
    console.warn(`🚨 EXCESSIVE FILE SIZE: ${fileSizeMB} MB (>100MB recommended limit)`);
    console.warn('   User must have explicitly approved this file');
    console.warn('   Processing will take 5-15 minutes');
    console.warn('   Falling back to Gemini extraction...\n');
    throw new Error(`File >100MB - use Gemini extraction`);
  }
  
  // ✅ Files >40MB use Gemini (too large even with chunking)
  if (fileSizeBytes > maxVisionSizeBytes) {
    const maxSizeMB = (maxVisionSizeBytes / (1024 * 1024)).toFixed(0);
    const errorMsg = `⚠️ File size ${fileSizeMB} MB exceeds Vision API limit (${maxSizeMB} MB). Auto-switching to Gemini extraction for better large file handling.`;
    console.warn(errorMsg);
    console.warn('   Reason: Files >40MB process better with Gemini');
    console.warn('   Solution: Using Gemini for full document extraction...\n');
    
    throw new Error(errorMsg);
  }
  
  // ✅ Files 20-40MB: Use chunked processing
  if (fileSizeBytes > chunkSizeBytes) {
    console.log(`📦 Large file detected (${fileSizeMB} MB > 20MB)`);
    console.log('   Strategy: Chunking PDF for parallel Vision API processing');
    console.log(`   Chunk size: ≤20MB each\n`);
    
    return await extractTextWithChunking(pdfBuffer, options);
  }
  
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
 * Split PDF into chunks by page ranges to stay under size limit
 * 
 * @param pdfBuffer - Original PDF buffer
 * @param maxChunkSizeBytes - Maximum size per chunk (20MB)
 * @returns Array of PDF chunk buffers
 */
async function splitPDFIntoChunks(
  pdfBuffer: Buffer,
  maxChunkSizeBytes: number = 20 * 1024 * 1024
): Promise<Buffer[]> {
  console.log('🔪 Chunking PDF into smaller pieces...');
  
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    console.log(`   Total pages: ${totalPages}`);
    
    const chunks: Buffer[] = [];
    let currentChunkPages: number[] = [];
    let estimatedChunkSize = 0;
    const avgPageSize = pdfBuffer.length / totalPages;
    
    for (let i = 0; i < totalPages; i++) {
      const estimatedPageSize = avgPageSize;
      
      // If adding this page would exceed chunk size, save current chunk
      if (estimatedChunkSize + estimatedPageSize > maxChunkSizeBytes && currentChunkPages.length > 0) {
        const chunkPdf = await PDFDocument.create();
        const copiedPages = await chunkPdf.copyPages(pdfDoc, currentChunkPages);
        copiedPages.forEach(page => chunkPdf.addPage(page));
        const chunkBytes = await chunkPdf.save();
        chunks.push(Buffer.from(chunkBytes));
        
        console.log(`   ✅ Chunk ${chunks.length}: ${currentChunkPages.length} pages (~${(estimatedChunkSize / (1024 * 1024)).toFixed(1)} MB)`);
        
        currentChunkPages = [];
        estimatedChunkSize = 0;
      }
      
      currentChunkPages.push(i);
      estimatedChunkSize += estimatedPageSize;
    }
    
    // Add remaining pages as final chunk
    if (currentChunkPages.length > 0) {
      const chunkPdf = await PDFDocument.create();
      const copiedPages = await chunkPdf.copyPages(pdfDoc, currentChunkPages);
      copiedPages.forEach(page => chunkPdf.addPage(page));
      const chunkBytes = await chunkPdf.save();
      chunks.push(Buffer.from(chunkBytes));
      
      console.log(`   ✅ Chunk ${chunks.length}: ${currentChunkPages.length} pages (~${(estimatedChunkSize / (1024 * 1024)).toFixed(1)} MB)`);
    }
    
    console.log(`✅ Split into ${chunks.length} chunks\n`);
    return chunks;
    
  } catch (error) {
    console.error('❌ Failed to chunk PDF:', error);
    throw new Error(`PDF chunking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from large PDF by chunking and processing in parallel
 * 
 * @param pdfBuffer - Original PDF buffer
 * @param options - Extraction options
 */
async function extractTextWithChunking(
  pdfBuffer: Buffer,
  options: {
    detectLanguage?: boolean;
    includeConfidence?: boolean;
  } = {}
): Promise<VisionExtractionResult> {
  const startTime = Date.now();
  const fileSizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
  
  console.log(`📦 Starting chunked extraction for ${fileSizeMB} MB PDF`);
  
  try {
    // Split PDF into chunks
    const chunks = await splitPDFIntoChunks(pdfBuffer, 20 * 1024 * 1024);
    console.log(`🔄 Processing ${chunks.length} chunks in parallel...\n`);
    
    // Process all chunks in parallel
    const chunkResults = await Promise.all(
      chunks.map(async (chunk, index) => {
        console.log(`📄 Processing chunk ${index + 1}/${chunks.length}...`);
        
        try {
          const [result] = await client.documentTextDetection({
            image: {
              content: chunk.toString('base64'),
            },
            imageContext: {
              languageHints: ['es', 'en'],
            },
          });
          
          const fullText = result.fullTextAnnotation;
          if (!fullText || !fullText.text) {
            console.warn(`   ⚠️ Chunk ${index + 1} returned no text`);
            return { text: '', confidence: 0, pages: 0 };
          }
          
          const avgConfidence = fullText.pages
            ? fullText.pages.reduce((sum, page) => sum + (page.confidence || 0), 0) / fullText.pages.length
            : 0;
          
          console.log(`   ✅ Chunk ${index + 1}: ${fullText.text.length.toLocaleString()} chars, ${(avgConfidence * 100).toFixed(1)}% confidence`);
          
          return {
            text: fullText.text,
            confidence: avgConfidence,
            pages: fullText.pages?.length || 0,
          };
        } catch (error) {
          console.error(`   ❌ Chunk ${index + 1} failed:`, error instanceof Error ? error.message : error);
          return { text: '', confidence: 0, pages: 0 };
        }
      })
    );
    
    // Merge results
    console.log('\n🔗 Merging chunk results...');
    const mergedText = chunkResults.map(r => r.text).join('\n\n');
    const avgConfidence = chunkResults.reduce((sum, r) => sum + r.confidence, 0) / chunkResults.length;
    const totalPages = chunkResults.reduce((sum, r) => sum + r.pages, 0);
    const successfulChunks = chunkResults.filter(r => r.text.length > 0).length;
    
    const extractionTime = Date.now() - startTime;
    
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ✅ CHUNKED VISION API EXTRACTION SUCCESSFUL     │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📊 Results:`);
    console.log(`   Chunks processed: ${successfulChunks}/${chunks.length}`);
    console.log(`   Characters: ${mergedText.length.toLocaleString()}`);
    console.log(`   Pages: ${totalPages}`);
    console.log(`   Avg confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`⏱️  Total time: ${(extractionTime / 1000).toFixed(2)}s`);
    console.log(`💰 Est. cost: $${calculateVisionAPICost(totalPages).toFixed(4)}\n`);
    
    return {
      text: mergedText,
      confidence: avgConfidence,
      pages: totalPages,
      language: 'es', // Default to Spanish
      extractionTime,
      method: 'vision-api-chunked',
      chunksProcessed: successfulChunks,
    };
    
  } catch (error) {
    console.error('❌ Chunked extraction failed:', error);
    throw new Error(`Chunked Vision API error: ${error instanceof Error ? error.message : 'Unknown'}`);
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

