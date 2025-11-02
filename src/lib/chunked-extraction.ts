/**
 * Chunked PDF Extraction - For Large Files >20MB
 * 
 * Splits large PDFs into smaller PDF SECTIONS (by page ranges),
 * processes each section with Gemini, then combines the results.
 * 
 * TERMINOLOGY:
 * - PDF Sections: Physical splits of the PDF by page ranges (~15MB, ~100 pages each)
 * - Text Chunks: Semantic splits for RAG/embedding (happens later, ~2000 tokens each)
 * 
 * Use case: Files too large for Gemini inline data API (>20MB)
 * Method: Split PDF by page ranges → extract each section → combine text
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
  totalPdfSections: number; // ✅ RENAMED: PDF sections (not text chunks)
  totalPages: number;
  extractionTime: number;
  method: 'chunked-gemini';
  pdfSections: Array<{ // ✅ RENAMED: PDF sections
    sectionNumber: number;
    pageRange: string;
    textLength: number;
    extractionTime: number;
  }>;
}

/**
 * Extract text from large PDF by splitting into PDF SECTIONS
 * 
 * Strategy:
 * 1. Split PDF into sections of ~10-15MB each (by page ranges)
 * 2. Process each PDF section with Gemini (in parallel batches of 5)
 * 3. Combine extracted text from all sections
 * 4. Report progress for each section
 * 
 * NOTE: This creates PDF SECTIONS, not text chunks.
 * Text chunking for RAG happens later (in enable-rag API).
 * 
 * @param pdfBuffer - Full PDF as Buffer
 * @param options - Extraction options
 * @param onProgress - Progress callback (section, total, message)
 */
export async function extractTextChunked(
  pdfBuffer: Buffer,
  options: {
    model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    sectionSizeMB?: number; // ✅ RENAMED: Target size per PDF section
    onProgress?: (progress: { 
      section: number; // ✅ RENAMED: PDF section number
      total: number; 
      message: string;
      percentage: number;
    }) => void;
  } = {}
): Promise<ChunkedExtractionResult> {
  const startTime = Date.now();
  const model = options.model || 'gemini-2.5-pro'; // Use Pro for better quality
  const targetSectionSizeMB = options.sectionSizeMB || 12; // ✅ OPTIMIZED: 12MB PDF sections (faster, more sections)
  const onProgress = options.onProgress || (() => {});
  
  const fileSizeBytes = pdfBuffer.length;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
  
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│ 📄 PDF SECTION EXTRACTION - LARGE FILE         │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`📄 PDF size: ${fileSizeMB} MB`);
  console.log(`🔪 Target section size: ${targetSectionSizeMB} MB`);
  console.log(`🤖 Model: ${model}`);
  console.log(`🔄 Method: Split into PDF sections → Extract → Combine`);
  console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}\n`);
  
  try {
    // ✅ STEP 1: Split PDF into sections using pdf-lib
    console.log('🔄 Step 1: Loading PDF and analyzing structure...');
    onProgress({ section: 0, total: 1, message: 'Analyzing PDF structure...', percentage: 5 });
    
    // Import pdf-lib dynamically (install if needed: npm install pdf-lib)
    const { PDFDocument } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    console.log(`📄 Total pages: ${totalPages}`);
    
    // ✅ Calculate PDF section sizes
    const targetSectionSizeBytes = targetSectionSizeMB * 1024 * 1024;
    const estimatedBytesPerPage = fileSizeBytes / totalPages;
    const pagesPerSection = Math.max(1, Math.floor(targetSectionSizeBytes / estimatedBytesPerPage));
    const totalSections = Math.ceil(totalPages / pagesPerSection);
    
    console.log(`📊 Estimated ${estimatedBytesPerPage.toFixed(0)} bytes/page`);
    console.log(`📄 Creating ${totalSections} PDF sections of ~${pagesPerSection} pages each`);
    console.log(`🔄 Will process in batches of 5 sections (parallel)\n`);
    
    const extractedSections: Array<{
      sectionNumber: number;
      pageRange: string;
      text: string;
      extractionTime: number;
    }> = [];
    
    // ✅ OPTIMIZED: Process PDF sections in PARALLEL batches (15 at a time - optimal balance)
    const MAX_PARALLEL_SECTIONS = 15; // Process 15 PDF sections simultaneously (3x faster, near rate limit max)
    
    for (let batchStart = 0; batchStart < totalSections; batchStart += MAX_PARALLEL_SECTIONS) {
      const batchEnd = Math.min(batchStart + MAX_PARALLEL_SECTIONS, totalSections);
      const batchSize = batchEnd - batchStart;
      const batchNum = Math.floor(batchStart / MAX_PARALLEL_SECTIONS) + 1;
      const totalBatches = Math.ceil(totalSections / MAX_PARALLEL_SECTIONS);
      
      console.log(`\n🚀 Processing batch ${batchNum}/${totalBatches}: PDF sections ${batchStart + 1}-${batchEnd} (${batchSize} in parallel)`);
      
      // Process this batch in parallel
      const batchPromises = [];
      
      for (let sectionIndex = batchStart; sectionIndex < batchEnd; sectionIndex++) {
        const sectionStartPage = sectionIndex * pagesPerSection;
        const sectionEndPage = Math.min((sectionIndex + 1) * pagesPerSection, totalPages);
        const pageRange = `${sectionStartPage + 1}-${sectionEndPage}`;
        
        const sectionPercentage = 10 + (sectionIndex / totalSections) * 80; // 10-90%
        
        // Create promise for this PDF section
        const sectionPromise = (async () => {
          console.log(`  📄 PDF Section ${sectionIndex + 1}/${totalSections}: Pages ${pageRange}`);
          
          onProgress({ 
            section: sectionIndex + 1, 
            total: totalSections, 
            message: `Extracting PDF section ${sectionIndex + 1}/${totalSections} (pages ${pageRange})`,
            percentage: sectionPercentage
          });
          
          const sectionStartTime = Date.now();
          
          try {
            // Create sub-document with this page range
            const sectionDoc = await PDFDocument.create();
            const copiedPages = await sectionDoc.copyPages(
              pdfDoc, 
              Array.from({ length: sectionEndPage - sectionStartPage }, (_, i) => sectionStartPage + i)
            );
            
            copiedPages.forEach(page => sectionDoc.addPage(page));
            
            const sectionBytes = await sectionDoc.save();
            const sectionSizeMB = (sectionBytes.length / (1024 * 1024)).toFixed(2);
            
            console.log(`    📄 Section ${sectionIndex + 1}: ${sectionSizeMB} MB (${copiedPages.length} pages) → Sending to ${model}...`);
            
            // Convert to base64
            const base64Data = Buffer.from(sectionBytes).toString('base64');
            
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
            const sectionTime = Date.now() - sectionStartTime;
            
            console.log(`    ✅ Section ${sectionIndex + 1}: Extracted ${extractedText.length} characters in ${(sectionTime / 1000).toFixed(1)}s`);
            
            return {
              sectionNumber: sectionIndex + 1,
              pageRange,
              text: extractedText,
              extractionTime: sectionTime,
            };
            
          } catch (error) {
            console.error(`    ❌ Section ${sectionIndex + 1} failed:`, error);
            
            // Return error placeholder
            return {
              sectionNumber: sectionIndex + 1,
              pageRange,
              text: `[Error extracting pages ${pageRange}: ${error instanceof Error ? error.message : 'Unknown error'}]`,
              extractionTime: Date.now() - sectionStartTime,
            };
          }
        })();
        
        batchPromises.push(sectionPromise);
      }
      
      // ✅ PARALLEL: Wait for all PDF sections in this batch to complete
      console.log(`  ⏳ Processing ${batchSize} PDF sections in parallel...`);
      const batchResults = await Promise.all(batchPromises);
      extractedSections.push(...batchResults);
      
      console.log(`  ✅ Batch ${batchNum}/${totalBatches} complete!`);
    }
    
    // ✅ STEP 3: Combine all PDF sections
    console.log('\n🔄 Step 3: Combining extracted PDF sections...');
    onProgress({ 
      section: totalSections, 
      total: totalSections, 
      message: 'Combining extracted text from all sections...', 
      percentage: 95 
    });
    
    const combinedText = extractedSections
      .map((section, idx) => {
        // Add page range markers for reference
        const header = idx === 0 ? '' : `\n\n--- PDF Section ${section.sectionNumber}: Pages ${section.pageRange} ---\n\n`;
        return header + section.text;
      })
      .join('');
    
    const extractionTime = Date.now() - startTime;
    
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ✅ PDF SECTION EXTRACTION SUCCESSFUL            │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📊 Results:`);
    console.log(`   Total PDF sections: ${totalSections}`);
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Combined text: ${combinedText.length.toLocaleString()} characters`);
    console.log(`   Success rate: ${extractedSections.filter(s => !s.text.includes('[Error')).length}/${totalSections}`);
    console.log(`⏱️  Total time: ${(extractionTime / 1000).toFixed(2)}s`);
    console.log(`💰 Est. cost: $${estimateSectionExtractionCost(totalSections, model).toFixed(4)}\n`);
    
    onProgress({ 
      section: totalSections, 
      total: totalSections, 
      message: 'PDF section extraction complete!', 
      percentage: 100 
    });
    
    return {
      text: combinedText,
      totalPdfSections: totalSections,
      totalPages,
      extractionTime,
      method: 'chunked-gemini',
      pdfSections: extractedSections.map(s => ({
        sectionNumber: s.sectionNumber,
        pageRange: s.pageRange,
        textLength: s.text.length,
        extractionTime: s.extractionTime,
      })),
    };
    
  } catch (error) {
    console.error('❌ Chunked extraction failed:', error);
    throw new Error(`Chunked extraction error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Estimate cost for PDF section extraction
 */
function estimateSectionExtractionCost(sections: number, model: string): number {
  const inputTokensPerSection = 1000; // Estimated
  const outputTokensPerSection = 32000; // Avg for dense extraction
  
  if (model === 'gemini-2.5-pro') {
    return sections * ((inputTokensPerSection / 1000000 * 1.25) + (outputTokensPerSection / 1000000 * 5.00));
  } else {
    return sections * ((inputTokensPerSection / 1000000 * 0.075) + (outputTokensPerSection / 1000000 * 0.30));
  }
}

/**
 * Check if file should use PDF section extraction (vs single request)
 */
export function shouldUseChunkedExtraction(fileSizeBytes: number): boolean {
  const geminiInlineLimit = 20 * 1024 * 1024; // 20MB Gemini inline limit
  return fileSizeBytes > geminiInlineLimit;
}

