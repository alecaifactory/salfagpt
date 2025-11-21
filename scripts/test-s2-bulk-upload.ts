/**
 * Bulk Upload Test for S2-v2 Agent
 * 
 * Purpose: Validate large PDF extraction with all documents in queue
 * Agent: S2-v2 (1lgr33ywq5qed67sqCYi)
 * Queue: /Users/alec/salfagpt/upload-queue/S002-20251118
 * 
 * Created: 2025-11-21
 */

import { extractLargePDF, validateExtraction } from '../cli/lib/large-pdf-extractor.js';
import { extractDocument } from '../cli/lib/extraction.js';
import { storeExtractedText } from '../cli/lib/firestore-chunked-storage.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { readdir } from 'fs/promises';

// Initialize Firebase
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();

// Configuration
const QUEUE_DIR = '/Users/alec/salfagpt/upload-queue/S002-20251118';
const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const MODEL = 'gemini-2.5-flash';

// Thresholds
const LARGE_FILE_THRESHOLD_MB = 10;  // Use File API for files >10MB
const MAX_FILE_SIZE_MB = 2000;       // Skip files >2GB

interface ProcessResult {
  file: string;
  sizeMB: number;
  method: 'inline' | 'file-api' | 'skipped';
  success: boolean;
  characters: number;
  tokens: number;
  cost: number;
  duration: number;
  qualityScore?: number;
  error?: string;
}

/**
 * Recursively find all PDF files in directory
 */
async function findAllPDFs(dir: string): Promise<string[]> {
  const pdfs: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subPdfs = await findAllPDFs(fullPath);
        pdfs.push(...subPdfs);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.pdf') {
        pdfs.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read directory ${dir}:`, error);
  }
  
  return pdfs;
}

/**
 * Process a single PDF file
 */
async function processPDF(
  filePath: string,
  index: number,
  total: number
): Promise<ProcessResult> {
  const fileName = basename(filePath);
  const stats = statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📄 [${index}/${total}] ${fileName}`);
  console.log(`   Size: ${sizeMB.toFixed(2)}MB`);
  
  // Check if too large
  if (sizeMB > MAX_FILE_SIZE_MB) {
    console.log(`⚠️  SKIPPED: File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    return {
      file: fileName,
      sizeMB,
      method: 'skipped',
      success: false,
      characters: 0,
      tokens: 0,
      cost: 0,
      duration: 0,
      error: `File too large (${sizeMB.toFixed(2)}MB > ${MAX_FILE_SIZE_MB}MB)`
    };
  }
  
  const startTime = Date.now();
  
  try {
    // Choose extraction method based on size
    let extractedText = '';
    let totalCost = 0;
    let method: 'inline' | 'file-api' = 'inline';
    
    if (sizeMB > LARGE_FILE_THRESHOLD_MB) {
      // Use File API for large files
      console.log(`   📤 Using File API (size > ${LARGE_FILE_THRESHOLD_MB}MB)`);
      method = 'file-api';
      
      const result = await extractLargePDF(filePath, {
        model: MODEL,
        maxChunkSizeMB: 45,
        maxOutputTokensPerChunk: 65000
      });
      
      if (!result.success) {
        throw new Error(result.error || 'File API extraction failed');
      }
      
      extractedText = result.extractedText;
      totalCost = result.totalCost;
      
    } else {
      // Use inline data for small files (faster)
      console.log(`   💾 Using inline data (size < ${LARGE_FILE_THRESHOLD_MB}MB)`);
      method = 'inline';
      
      const result = await extractDocument(filePath, MODEL);
      
      if (!result.success) {
        throw new Error(result.error || 'Inline extraction failed');
      }
      
      extractedText = result.extractedText;
      totalCost = result.estimatedCost;
    }
    
    // Validate extraction
    const validation = validateExtraction(extractedText);
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Extracted: ${extractedText.length.toLocaleString()} chars`);
    console.log(`   📊 Quality: ${validation.score}/100 ${validation.passed ? '✅' : '⚠️'}`);
    console.log(`   💰 Cost: $${totalCost.toFixed(4)}`);
    console.log(`   ⏱️  Time: ${(duration / 1000).toFixed(1)}s`);
    
    // Save to Firestore (with chunked storage for large texts)
    console.log('   💾 Saving to Firestore...');
    
    const metadata: Record<string, any> = {
      originalFileName: fileName,
      originalFileSize: stats.size,
      extractionMethod: method === 'file-api' ? 'file-api-rest' : 'inline-data',
      extractionDate: new Date().toISOString(),
      extractionTime: duration,
      charactersExtracted: extractedText.length,
      tokensEstimate: Math.ceil(extractedText.length / 4),
      totalCost: totalCost,
      validationScore: validation.score,
      model: MODEL
    };
    
    // Create source document first (without extractedData yet)
    const newSource = await firestore.collection('context_sources').add({
      userId: USER_ID,
      assignedToAgents: [AGENT_ID],
      name: fileName.replace('.pdf', ''),
      type: 'pdf',
      extractionModel: MODEL,
      status: 'active',
      addedAt: new Date().toISOString(),
      lastProcessedAt: new Date().toISOString(),
      // Don't include extractedData yet - will be added by storeExtractedText
    });
    
    const sourceId = newSource.id;
    
    // Store extracted text (handles chunking if >1MB)
    await storeExtractedText(firestore, sourceId, extractedText, metadata);
    
    console.log(`   ✅ Saved: ${sourceId}`);
    
    return {
      file: fileName,
      sizeMB,
      method,
      success: true,
      characters: extractedText.length,
      tokens: Math.ceil(extractedText.length / 4),
      cost: totalCost,
      duration,
      qualityScore: validation.score
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`   ❌ FAILED: ${errorMessage}`);
    
    return {
      file: fileName,
      sizeMB,
      method: sizeMB > LARGE_FILE_THRESHOLD_MB ? 'file-api' : 'inline',
      success: false,
      characters: 0,
      tokens: 0,
      cost: 0,
      duration,
      error: errorMessage
    };
  }
}

/**
 * Main test function
 */
async function runBulkUploadTest() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        BULK UPLOAD TEST: S2-v2 All Documents                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📁 Queue directory: ${QUEUE_DIR}`);
  console.log(`🤖 Agent: S2-v2 (${AGENT_ID})`);
  console.log(`👤 User: ${USER_ID}`);
  console.log(`🎯 Model: ${MODEL}\n`);
  
  // Check directory exists
  if (!existsSync(QUEUE_DIR)) {
    console.error('❌ FATAL: Queue directory not found!');
    console.error(`   Path: ${QUEUE_DIR}`);
    process.exit(1);
  }
  
  // Find all PDFs recursively
  console.log('🔍 Scanning for PDF files...\n');
  const pdfFiles = await findAllPDFs(QUEUE_DIR);
  
  if (pdfFiles.length === 0) {
    console.error('❌ No PDF files found in queue directory');
    process.exit(1);
  }
  
  console.log(`✅ Found ${pdfFiles.length} PDF files\n`);
  
  // Sort by size (smallest first for quick wins)
  pdfFiles.sort((a, b) => {
    const sizeA = statSync(a).size;
    const sizeB = statSync(b).size;
    return sizeA - sizeB;
  });
  
  // Preview files
  console.log('📋 Files to process:\n');
  pdfFiles.forEach((file, idx) => {
    const sizeMB = statSync(file).size / (1024 * 1024);
    const method = sizeMB > LARGE_FILE_THRESHOLD_MB ? 'File API' : 'Inline';
    console.log(`   ${idx + 1}. ${basename(file).substring(0, 50).padEnd(50)} ${sizeMB.toFixed(2).padStart(8)}MB  [${method}]`);
  });
  
  console.log(`\n⏳ Starting processing...\n`);
  
  // Process all PDFs
  const results: ProcessResult[] = [];
  
  for (let i = 0; i < pdfFiles.length; i++) {
    const result = await processPDF(pdfFiles[i], i + 1, pdfFiles.length);
    results.push(result);
    
    // Brief pause between files to avoid rate limits
    if (i < pdfFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    BULK UPLOAD SUMMARY                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success && r.method !== 'skipped');
  const skipped = results.filter(r => r.method === 'skipped');
  
  console.log(`📊 OVERALL RESULTS:`);
  console.log(`   Total files: ${results.length}`);
  console.log(`   ✅ Successful: ${successful.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log(`   ⏭️  Skipped: ${skipped.length}\n`);
  
  if (successful.length > 0) {
    const totalChars = successful.reduce((sum, r) => sum + r.characters, 0);
    const totalTokens = successful.reduce((sum, r) => sum + r.tokens, 0);
    const totalCost = successful.reduce((sum, r) => sum + r.cost, 0);
    const totalDuration = successful.reduce((sum, r) => sum + r.duration, 0);
    const avgQuality = successful.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / successful.length;
    
    console.log(`📈 AGGREGATED METRICS:`);
    console.log(`   Total characters: ${totalChars.toLocaleString()}`);
    console.log(`   Total tokens: ${totalTokens.toLocaleString()}`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   Total time: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`   Avg quality: ${avgQuality.toFixed(1)}/100\n`);
    
    console.log(`💰 COST BREAKDOWN:`);
    console.log(`   File API calls: ${successful.filter(r => r.method === 'file-api').length}`);
    console.log(`   Inline calls: ${successful.filter(r => r.method === 'inline').length}\n`);
  }
  
  // Detailed results table
  console.log('📋 DETAILED RESULTS:\n');
  console.log('File'.padEnd(50) + 'Size'.padStart(10) + 'Method'.padStart(12) + 'Chars'.padStart(10) + 'Quality'.padStart(10) + 'Status'.padStart(10));
  console.log('─'.repeat(102));
  
  results.forEach(r => {
    const status = r.success ? '✅ OK' : (r.method === 'skipped' ? '⏭️ SKIP' : '❌ FAIL');
    const quality = r.qualityScore ? `${r.qualityScore}/100` : '-';
    const chars = r.success ? r.characters.toLocaleString() : '-';
    
    console.log(
      r.file.substring(0, 48).padEnd(50) +
      `${r.sizeMB.toFixed(2)}MB`.padStart(10) +
      r.method.padStart(12) +
      chars.padStart(10) +
      quality.padStart(10) +
      status.padStart(10)
    );
  });
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED FILES:\n');
    failed.forEach(r => {
      console.log(`   ${r.file}`);
      console.log(`   Error: ${r.error}\n`);
    });
  }
  
  // Final status
  console.log('\n' + '═'.repeat(70));
  
  const successRate = (successful.length / (results.length - skipped.length)) * 100;
  
  if (failed.length === 0 && successful.length > 0) {
    console.log('✅✅✅ ALL FILES PROCESSED SUCCESSFULLY!');
    console.log(`   ${successful.length} documents indexed for S2-v2`);
  } else if (successRate >= 80) {
    console.log(`⚠️  PARTIAL SUCCESS: ${successRate.toFixed(1)}% success rate`);
    console.log(`   ${successful.length} succeeded, ${failed.length} failed`);
  } else {
    console.log(`❌ BULK UPLOAD FAILED: Only ${successRate.toFixed(1)}% success rate`);
  }
  
  console.log('═'.repeat(70));
  
  process.exit(failed.length === 0 ? 0 : 1);
}

// Run bulk upload test
runBulkUploadTest().catch(error => {
  console.error('\n❌ CRITICAL FAILURE:', error);
  console.error('\n💡 Debug info:');
  console.error('   - Check queue directory exists');
  console.error('   - Verify GOOGLE_AI_API_KEY is set');
  console.error('   - Check Firestore connectivity');
  console.error('   - Review error message above');
  process.exit(1);
});

