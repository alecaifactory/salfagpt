/**
 * Google Cloud Document AI - High-Precision PDF Processing
 * 
 * Uses Document AI OCR Processor to:
 * - Extract text with layout preservation
 * - Detect and parse tables
 * - Identify diagrams and charts
 * - Maintain semantic structure
 * 
 * Superior to simple text extraction for:
 * - Complex tables (preserves rows/columns)
 * - Diagrams (identifies components)
 * - Forms (preserves structure)
 * - Multi-column layouts
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const LOCATION = process.env.DOCUMENT_AI_LOCATION || 'us';
const PROCESSOR_ID = process.env.DOCUMENT_AI_PROCESSOR_ID;

// Initialize Document AI client
const client = new DocumentProcessorServiceClient();

console.log('📄 Google Cloud Document AI initialized');
console.log(`  Project: ${PROJECT_ID}`);
console.log(`  Location: ${LOCATION}`);
console.log(`  Processor: ${PROCESSOR_ID || 'NOT CONFIGURED'}`);

export interface DocumentAIPage {
  pageNumber: number;
  paragraphs: Array<{
    text: string;
    confidence: number;
  }>;
  tables: Array<{
    headerRows: string[][];
    bodyRows: string[][];
  }>;
  blocks: Array<{
    text: string;
    blockType: string;
  }>;
}

export interface DocumentAIResult {
  text: string; // Full text
  pages: DocumentAIPage[];
  tables: number; // Count of tables
  confidence: number; // Average confidence
  extractionTime: number;
  method: 'document-ai';
}

/**
 * Extract structured content from PDF using Document AI
 * 
 * @param pdfBuffer - PDF file as Buffer
 * @param processorId - Optional override for processor ID
 */
export async function extractWithDocumentAI(
  pdfBuffer: Buffer,
  processorId?: string
): Promise<DocumentAIResult> {
  const startTime = Date.now();
  
  console.log('\n┌─────────────────────────────────────────────────┐');
  console.log('│ 📄 DOCUMENT AI - STRUCTURED PDF EXTRACTION      │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`📎 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🌍 Project: ${PROJECT_ID}`);
  console.log(`📍 Location: ${LOCATION}`);
  console.log(`⏱️  Started: ${new Date().toLocaleTimeString()}\n`);
  
  // Validate processor ID
  const effectiveProcessorId = processorId || PROCESSOR_ID;
  if (!effectiveProcessorId) {
    throw new Error(
      'Document AI Processor ID not configured. ' +
      'Set DOCUMENT_AI_PROCESSOR_ID in .env or pass as parameter'
    );
  }
  
  try {
    console.log('🔄 Step 1/4: Encoding PDF to base64...');
    const base64Start = Date.now();
    const encodedFile = pdfBuffer.toString('base64');
    console.log(`✅ Encoded in ${Date.now() - base64Start}ms\n`);
    
    console.log('🔄 Step 2/4: Calling Document AI OCR Processor...');
    console.log(`   Processor: projects/${PROJECT_ID}/locations/${LOCATION}/processors/${effectiveProcessorId}`);
    
    // Build processor name
    const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${effectiveProcessorId}`;
    
    // Call Document AI
    const apiCallStart = Date.now();
    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: encodedFile,
        mimeType: 'application/pdf',
      },
    });
    
    const apiCallTime = Date.now() - apiCallStart;
    console.log(`✅ Document AI responded in ${(apiCallTime / 1000).toFixed(2)}s\n`);
    
    if (!result.document) {
      throw new Error('Document AI returned no document data');
    }
    
    console.log('🔄 Step 3/4: Parsing structured data...');
    const parseStart = Date.now();
    
    const document = result.document;
    const pages: DocumentAIPage[] = [];
    let fullText = document.text || '';
    let totalTables = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    // Process each page
    if (document.pages) {
      for (const page of document.pages) {
        const pageData: DocumentAIPage = {
          pageNumber: pages.length + 1,
          paragraphs: [],
          tables: [],
          blocks: [],
        };
        
        // Extract paragraphs
        if (page.paragraphs) {
          for (const para of page.paragraphs) {
            if (para.layout?.textAnchor?.textSegments) {
              const paraText = extractText(para.layout.textAnchor.textSegments, fullText);
              const confidence = para.layout.confidence || 0;
              
              pageData.paragraphs.push({
                text: paraText,
                confidence,
              });
              
              totalConfidence += confidence;
              confidenceCount++;
            }
          }
        }
        
        // Extract tables ⭐ CRITICAL FOR SSOMA
        if (page.tables) {
          for (const table of page.tables) {
            const tableData = parseTable(table, fullText);
            pageData.tables.push(tableData);
            totalTables++;
          }
        }
        
        // Extract blocks (for diagrams)
        if (page.blocks) {
          for (const block of page.blocks) {
            if (block.layout?.textAnchor?.textSegments) {
              const blockText = extractText(block.layout.textAnchor.textSegments, fullText);
              pageData.blocks.push({
                text: blockText,
                blockType: 'block',
              });
            }
          }
        }
        
        pages.push(pageData);
      }
    }
    
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const parseTime = Date.now() - parseStart;
    console.log(`✅ Parsed in ${parseTime}ms\n`);
    
    console.log('🔄 Step 4/4: Compiling results...');
    const extractionTime = Date.now() - startTime;
    
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ ✅ DOCUMENT AI EXTRACTION SUCCESSFUL            │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📊 Results:`);
    console.log(`   Characters: ${fullText.length.toLocaleString()}`);
    console.log(`   Pages: ${pages.length}`);
    console.log(`   Tables: ${totalTables}`);
    console.log(`   Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`⏱️  Total time: ${(extractionTime / 1000).toFixed(2)}s`);
    console.log(`💰 Est. cost: $${calculateDocumentAICost(pages.length).toFixed(4)}\n`);
    
    return {
      text: fullText,
      pages,
      tables: totalTables,
      confidence: avgConfidence,
      extractionTime,
      method: 'document-ai',
    };
    
  } catch (error) {
    console.error('❌ Document AI extraction failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('NOT_FOUND') || error.message.includes('Processor')) {
        throw new Error(
          `Document AI Processor not found. ` +
          `Create one at: https://console.cloud.google.com/ai/document-ai/processors?project=${PROJECT_ID}`
        );
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error(
          `Document AI permission denied. ` +
          `Grant 'Document AI API User' role to service account.`
        );
      }
    }
    
    throw error;
  }
}

/**
 * Helper: Extract text from text segments
 */
function extractText(
  segments: Array<{ startIndex?: string | number; endIndex?: string | number }>,
  fullText: string
): string {
  if (!segments || segments.length === 0) return '';
  
  const parts: string[] = [];
  for (const segment of segments) {
    const start = typeof segment.startIndex === 'string' 
      ? parseInt(segment.startIndex, 10) 
      : (segment.startIndex || 0);
    const end = typeof segment.endIndex === 'string'
      ? parseInt(segment.endIndex, 10)
      : (segment.endIndex || fullText.length);
    
    parts.push(fullText.substring(start, end));
  }
  
  return parts.join('').trim();
}

/**
 * Helper: Parse table into structured data
 * ⭐ CRITICAL: Preserves table structure
 */
function parseTable(table: any, fullText: string): {
  headerRows: string[][];
  bodyRows: string[][];
} {
  const headerRows: string[][] = [];
  const bodyRows: string[][] = [];
  
  if (!table.headerRows) {
    // No header distinction, treat all as body
    if (table.bodyRows) {
      for (const row of table.bodyRows) {
        const cells: string[] = [];
        if (row.cells) {
          for (const cell of row.cells) {
            if (cell.layout?.textAnchor?.textSegments) {
              const cellText = extractText(cell.layout.textAnchor.textSegments, fullText);
              cells.push(cellText);
            }
          }
        }
        bodyRows.push(cells);
      }
    }
  } else {
    // Process header rows
    for (const row of table.headerRows) {
      const cells: string[] = [];
      if (row.cells) {
        for (const cell of row.cells) {
          if (cell.layout?.textAnchor?.textSegments) {
            const cellText = extractText(cell.layout.textAnchor.textSegments, fullText);
            cells.push(cellText);
          }
        }
      }
      headerRows.push(cells);
    }
    
    // Process body rows
    if (table.bodyRows) {
      for (const row of table.bodyRows) {
        const cells: string[] = [];
        if (row.cells) {
          for (const cell of row.cells) {
            if (cell.layout?.textAnchor?.textSegments) {
              const cellText = extractText(cell.layout.textAnchor.textSegments, fullText);
              cells.push(cellText);
            }
          }
        }
        bodyRows.push(cells);
      }
    }
  }
  
  return { headerRows, bodyRows };
}

/**
 * Calculate Document AI processing cost
 * Pricing: $1.50 per 1000 pages
 */
export function calculateDocumentAICost(pages: number): number {
  return (pages / 1000) * 1.50;
}

/**
 * Extract with retry logic
 */
export async function extractWithDocumentAIRetry(
  pdfBuffer: Buffer,
  maxRetries: number = 2
): Promise<DocumentAIResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Document AI attempt ${attempt}/${maxRetries}...`);
      return await extractWithDocumentAI(pdfBuffer);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s exponential backoff
        console.log(`  Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Document AI extraction failed after retries');
}

