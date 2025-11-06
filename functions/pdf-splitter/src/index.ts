/**
 * PDF Splitter Cloud Function
 * 
 * Splits large PDFs into 20MB chunks without quality loss
 * Deployed to: us-central1
 * Max file size: 500MB
 */

import { PDFDocument } from 'pdf-lib';
import { Storage } from '@google-cloud/storage';
import type { Request, Response } from '@google-cloud/functions-framework';
import * as functions from '@google-cloud/functions-framework';

const storage = new Storage();
const OUTPUT_BUCKET = 'salfagpt-tool-outputs';

interface SplitPDFRequest {
  inputFileUrl: string;      // gs://bucket/path/file.pdf
  chunkSizeMB?: number;      // Target chunk size (default: 20)
  userId: string;            // For output path organization
  executionId: string;       // Unique execution ID
}

interface ChunkOutput {
  url: string;               // Signed URL to download chunk
  fileName: string;          // chunk-001.pdf
  sizeMB: number;            // Actual chunk size
  pageRange: string;         // "1-45"
  pageCount: number;         // Number of pages in chunk
}

interface SplitPDFResponse {
  success: boolean;
  executionId: string;
  chunks?: ChunkOutput[];
  metadata?: {
    totalChunks: number;
    totalPages: number;
    avgChunkSizeMB: number;
    processingTimeMs: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Main Cloud Function entry point
 */
functions.http('splitPDF', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }
    });
    return;
  }
  
  try {
    const { 
      inputFileUrl, 
      chunkSizeMB = 20, 
      userId, 
      executionId 
    }: SplitPDFRequest = req.body;
    
    // Validate inputs
    if (!inputFileUrl || !userId || !executionId) {
      res.status(400).json({
        success: false,
        error: { 
          message: 'Missing required fields: inputFileUrl, userId, executionId', 
          code: 'INVALID_INPUT' 
        }
      });
      return;
    }
    
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ 🔪 PDF SPLITTER CLOUD FUNCTION                 │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📥 Input: ${inputFileUrl}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🆔 Execution: ${executionId}`);
    console.log(`📏 Chunk size: ${chunkSizeMB} MB\n`);
    
    // Download PDF from GCS
    console.log('⬇️  Downloading PDF from GCS...');
    const downloadStart = Date.now();
    const inputBucket = inputFileUrl.replace('gs://', '').split('/')[0];
    const inputPath = inputFileUrl.replace(`gs://${inputBucket}/`, '');
    
    const [pdfBuffer] = await storage
      .bucket(inputBucket)
      .file(inputPath)
      .download();
    
    const downloadTime = Date.now() - downloadStart;
    const fileSizeMB = pdfBuffer.length / 1024 / 1024;
    console.log(`✅ Downloaded ${fileSizeMB.toFixed(2)} MB in ${downloadTime}ms\n`);
    
    // Load PDF
    console.log('📄 Loading PDF document...');
    const loadStart = Date.now();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    console.log(`✅ Loaded ${totalPages} pages in ${Date.now() - loadStart}ms\n`);
    
    // Calculate chunking strategy
    const avgPageSizeBytes = pdfBuffer.length / totalPages;
    const targetChunkSizeBytes = chunkSizeMB * 1024 * 1024;
    const pagesPerChunk = Math.max(1, Math.floor(targetChunkSizeBytes / avgPageSizeBytes));
    
    console.log(`📦 Chunking strategy:`);
    console.log(`   Average page size: ${(avgPageSizeBytes / 1024).toFixed(1)} KB`);
    console.log(`   Pages per chunk: ${pagesPerChunk}`);
    console.log(`   Expected chunks: ${Math.ceil(totalPages / pagesPerChunk)}\n`);
    
    // Split into chunks
    const chunks: ChunkOutput[] = [];
    
    for (let startPage = 0; startPage < totalPages; startPage += pagesPerChunk) {
      const endPage = Math.min(startPage + pagesPerChunk, totalPages);
      const chunkNum = chunks.length + 1;
      
      console.log(`🔄 Creating chunk ${chunkNum}...`);
      const chunkStart = Date.now();
      
      // Create new PDF with page range
      const chunkPdf = await PDFDocument.create();
      const pageIndices = Array.from(
        { length: endPage - startPage }, 
        (_, i) => startPage + i
      );
      const copiedPages = await chunkPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => chunkPdf.addPage(page));
      
      // Save chunk
      const chunkBytes = await chunkPdf.save();
      const chunkSizeMB = chunkBytes.length / 1024 / 1024;
      
      // Upload to GCS
      const chunkFileName = `chunk-${String(chunkNum).padStart(3, '0')}.pdf`;
      const outputPath = `tool-outputs/${userId}/${executionId}/${chunkFileName}`;
      
      const outputFile = storage.bucket(OUTPUT_BUCKET).file(outputPath);
      await outputFile.save(Buffer.from(chunkBytes), {
        contentType: 'application/pdf',
        metadata: {
          originalFile: inputFileUrl,
          pageRange: `${startPage + 1}-${endPage}`,
          totalPages: totalPages.toString(),
          chunkNumber: chunkNum.toString()
        }
      });
      
      // Generate signed URL (expires in 7 days)
      const [signedUrl] = await outputFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      
      chunks.push({
        url: signedUrl,
        fileName: chunkFileName,
        sizeMB: parseFloat(chunkSizeMB.toFixed(2)),
        pageRange: `${startPage + 1}-${endPage}`,
        pageCount: endPage - startPage
      });
      
      const chunkTime = Date.now() - chunkStart;
      console.log(`   ✅ Chunk ${chunkNum}: ${chunkSizeMB.toFixed(2)} MB, ${chunkTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│ ✅ PDF SPLITTING COMPLETED                      │');
    console.log('└─────────────────────────────────────────────────┘');
    console.log(`📊 Results:`);
    console.log(`   Total chunks: ${chunks.length}`);
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Avg chunk size: ${(chunks.reduce((sum, c) => sum + c.sizeMB, 0) / chunks.length).toFixed(2)} MB`);
    console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s\n`);
    
    // Return response
    const response: SplitPDFResponse = {
      success: true,
      executionId,
      chunks,
      metadata: {
        totalChunks: chunks.length,
        totalPages,
        avgChunkSizeMB: parseFloat((chunks.reduce((sum, c) => sum + c.sizeMB, 0) / chunks.length).toFixed(2)),
        processingTimeMs: totalTime
      }
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ PDF splitting failed:', error);
    
    const errorResponse: SplitPDFResponse = {
      success: false,
      executionId: req.body?.executionId || 'unknown',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'PROCESSING_FAILED'
      }
    };
    
    res.status(500).json(errorResponse);
  }
});





