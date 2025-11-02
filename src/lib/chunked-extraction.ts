/**
 * Chunked PDF Extraction - For Large Files >20MB
 * 
 * Splits large PDFs into smaller chunks, processes each with Gemini,
 * then combines the results.
 * 
 * Use case: Files too large for Gemini inline data API (>20MB)
 * Method: Split PDF by page ranges, extract each chunk, combine
 */

import { GoogleGenAI } from '@google/genai';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || '' 
});

export interface ChunkedExtractionResult {
  text: string;
  totalChunks: number;
  totalPages: number;
  extractionTime: number;
  method: 'chunked-gemini';
  chunks: Array<{
    chunkNumber: number;
    pageRange: string;
    textLength: number;
    extractionTime: number;
  }>;
}

/**
 * Extract text from large PDF by splitting into chunks
 * 
 * Strategy:
 * 1. Split PDF into chunks of ~10-15MB each
 * 2. Process each chunk with Gemini
 * 3. Combine extracted text
 * 4. Report progress for each chunk
 * 
 * @param pdfBuffer - Full PDF as Buffer
 * @param options - Extraction options
 * @param onProgress - Progress callback (chunk, total, message)
 */
export async function extractTextChunked(
  pdfBuffer: Buffer,
  options: {
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    chunkSizeMB?: number; // Target size per chunk
    onProgress?: (progress: { 
      chunk: number; 
      total: number; 
      message: string;
      percentage: number;
    }) => void;
  } = {}
): Promise<ChunkedExtractionResult> {
  const startTime = Date.now();
  const model = options.model || 'gemini-2.5-pro'; // Use Pro for better quality
  const targetChunkSizeMB = options.chunkSizeMB || 15; // 15MB chunks
  const onProgress = options.onProgress || (() => {});
  
  const fileSizeBytes = pdfBuffer.length;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
  
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│ 📦 CHUNKED EXTRACTION - LARGE FILE PROCESSING   │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`📄 PDF size: ${fileSizeMB} MB`);
  console.log(`🔪 Target chunk size: ${targetChunkSizeMB} MB`);
  console.log(`🤖 Model: ${model}`);
  console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}\n`);
  
  try {
    // ✅ STEP 1: Split PDF into chunks using pdf-lib
    console.log('🔄 Step 1: Loading PDF and analyzing structure...');
    onProgress({ chunk: 0, total: 1, message: 'Analyzing PDF structure...', percentage: 5 });
    
    // Import pdf-lib dynamically (install if needed: npm install pdf-lib)
    const { PDFDocument } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    console.log(`📄 Total pages: ${totalPages}`);
    
    // Calculate chunk sizes
    const targetChunkSizeBytes = targetChunkSizeMB * 1024 * 1024;
    const estimatedBytesPerPage = fileSizeBytes / totalPages;
    const pagesPerChunk = Math.max(1, Math.floor(targetChunkSizeBytes / estimatedBytesPerPage));
    const totalChunks = Math.ceil(totalPages / pagesPerChunk);
    
    console.log(`📊 Estimated ${estimatedBytesPerPage.toFixed(0)} bytes/page`);
    console.log(`📦 Creating ${totalChunks} chunks of ~${pagesPerChunk} pages each\n`);
    
    const extractedChunks: Array<{
      chunkNumber: number;
      pageRange: string;
      text: string;
      extractionTime: number;
    }> = [];
    
    // ✅ STEP 2: Process each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunkStartPage = chunkIndex * pagesPerChunk;
      const chunkEndPage = Math.min((chunkIndex + 1) * pagesPerChunk, totalPages);
      const pageRange = `${chunkStartPage + 1}-${chunkEndPage}`;
      
      console.log(`\n🔄 Processing chunk ${chunkIndex + 1}/${totalChunks}: Pages ${pageRange}`);
      
      const chunkPercentage = 10 + (chunkIndex / totalChunks) * 80; // 10-90%
      onProgress({ 
        chunk: chunkIndex + 1, 
        total: totalChunks, 
        message: `Extracting chunk ${chunkIndex + 1}/${totalChunks} (pages ${pageRange})`,
        percentage: chunkPercentage
      });
      
      const chunkStartTime = Date.now();
      
      try {
        // Create sub-document with this page range
        const chunkDoc = await PDFDocument.create();
        const copiedPages = await chunkDoc.copyPages(
          pdfDoc, 
          Array.from({ length: chunkEndPage - chunkStartPage }, (_, i) => chunkStartPage + i)
        );
        
        copiedPages.forEach(page => chunkDoc.addPage(page));
        
        const chunkBytes = await chunkDoc.save();
        const chunkSizeMB = (chunkBytes.length / (1024 * 1024)).toFixed(2);
        
        console.log(`  📄 Chunk size: ${chunkSizeMB} MB (${copiedPages.length} pages)`);
        console.log(`  🤖 Sending to ${model}...`);
        
        // Convert to base64
        const base64Data = Buffer.from(chunkBytes).toString('base64');
        
        // Extract text with Gemini
        const result = await genAI.models.generateContent({
          model: model,
          contents: [
            {
              role: 'user',
              parts: [
                { 
                  inlineData: { 
                    mimeType: 'application/pdf', 
                    data: base64Data 
                  } 
                },
                { 
                  text: `Extract ALL text from this PDF document section (pages ${pageRange}). 
                  
Include:
- All text content
- Table data (in markdown format)
- Section headers and structure
- Technical specifications
- Any important details

Output: Plain text with clear structure using markdown headings where appropriate.

DO NOT summarize. Extract the COMPLETE text.` 
                }
              ]
            }
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 65536, // Max for complete extraction
          }
        });
        
        const extractedText = result.text || '';
        const chunkTime = Date.now() - chunkStartTime;
        
        console.log(`  ✅ Extracted ${extractedText.length} characters in ${(chunkTime / 1000).toFixed(1)}s`);
        
        extractedChunks.push({
          chunkNumber: chunkIndex + 1,
          pageRange,
          text: extractedText,
          extractionTime: chunkTime,
        });
        
      } catch (error) {
        console.error(`  ❌ Failed to process chunk ${chunkIndex + 1}:`, error);
        
        // Add error placeholder to maintain chunk order
        extractedChunks.push({
          chunkNumber: chunkIndex + 1,
          pageRange,
          text: `[Error extracting pages ${pageRange}: ${error instanceof Error ? error.message : 'Unknown error'}]`,
          extractionTime: Date.now() - chunkStartTime,
        });
      }
    }
    
    // ✅ STEP 3: Combine all chunks
    console.log('\n🔄 Step 3: Combining extracted chunks...');
    onProgress({ 
      chunk: totalChunks, 
      total: totalChunks, 
      message: 'Combining extracted text...', 
      percentage: 95 
    });
    
    const combinedText = extractedChunks
      .map((chunk, idx) => {
        // Add page range markers for reference
        const header = idx === 0 ? '' : `\n\n--- Pages ${chunk.pageRange} ---\n\n`;
        return header + chunk.text;
      })
      .join('');
    
    const extractionTime = Date.now() - startTime;
    
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ✅ CHUNKED EXTRACTION SUCCESSFUL                │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📊 Results:`);
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Combined text: ${combinedText.length.toLocaleString()} characters`);
    console.log(`   Success rate: ${extractedChunks.filter(c => !c.text.includes('[Error')).length}/${totalChunks}`);
    console.log(`⏱️  Total time: ${(extractionTime / 1000).toFixed(2)}s`);
    console.log(`💰 Est. cost: $${estimateChunkedCost(totalChunks, model).toFixed(4)}\n`);
    
    onProgress({ 
      chunk: totalChunks, 
      total: totalChunks, 
      message: 'Extraction complete!', 
      percentage: 100 
    });
    
    return {
      text: combinedText,
      totalChunks,
      totalPages,
      extractionTime,
      method: 'chunked-gemini',
      chunks: extractedChunks.map(c => ({
        chunkNumber: c.chunkNumber,
        pageRange: c.pageRange,
        textLength: c.text.length,
        extractionTime: c.extractionTime,
      })),
    };
    
  } catch (error) {
    console.error('❌ Chunked extraction failed:', error);
    throw new Error(`Chunked extraction error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Estimate cost for chunked extraction
 */
function estimateChunkedCost(chunks: number, model: string): number {
  const inputTokensPerChunk = 1000; // Estimated
  const outputTokensPerChunk = 32000; // Avg for dense extraction
  
  if (model === 'gemini-2.5-pro') {
    return chunks * ((inputTokensPerChunk / 1000000 * 1.25) + (outputTokensPerChunk / 1000000 * 5.00));
  } else {
    return chunks * ((inputTokensPerChunk / 1000000 * 0.075) + (outputTokensPerChunk / 1000000 * 0.30));
  }
}

/**
 * Check if file should use chunked extraction
 */
export function shouldUseChunkedExtraction(fileSizeBytes: number): boolean {
  const geminiInlineLimit = 20 * 1024 * 1024; // 20MB Gemini inline limit
  return fileSizeBytes > geminiInlineLimit;
}

