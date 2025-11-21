/**
 * Large PDF Extractor
 * 
 * Purpose: Extract text from PDFs of any size (10MB-500MB)
 * Strategy:
 *   1. Upload PDF to Gemini File API (supports up to 2GB)
 *   2. Extract text using REST API
 *   3. No splitting needed - Gemini handles large files natively
 * 
 * Created: 2025-11-21
 * Status: Production Ready
 */

import { readFile } from 'fs/promises';
import { uploadFileToGemini, waitForFileActive, extractTextFromFile, deleteGeminiFile } from './gemini-file-api-rest.js';
import { splitPDFIfNeeded } from './pdf-splitter-node.js';
import path from 'path';
import { existsSync } from 'fs';

export interface LargePDFExtractionResult {
  success: boolean;
  extractedText: string;
  charactersExtracted: number;
  tokensEstimate: number;
  model: string;
  totalCost: number;
  duration: number;
  chunksProcessed: number;
  totalPages?: number;
  error?: string;
}

/**
 * Extract text from large PDF (handles splitting automatically)
 */
export async function extractLargePDF(
  filePath: string,
  options: {
    model?: 'gemini-2.5-pro' | 'gemini-2.5-flash';
    maxChunkSizeMB?: number;
    maxOutputTokensPerChunk?: number;
  } = {}
): Promise<LargePDFExtractionResult> {
  const startTime = Date.now();
  const {
    model = 'gemini-2.5-flash',
    maxChunkSizeMB = 45,
    maxOutputTokensPerChunk = 65000
  } = options;
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           LARGE PDF EXTRACTION WITH FILE API                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📄 File: ${path.basename(filePath)}`);
  console.log(`🤖 Model: ${model}`);
  console.log(`📊 Max chunk size: ${maxChunkSizeMB}MB`);
  
  try {
    // Check file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileSizeMB = (await readFile(filePath)).length / (1024 * 1024);
    console.log(`📏 Original size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Step 1: Check if split needed
    console.log('\n✂️  [1/4] CHECKING IF SPLIT NEEDED...');
    
    const splitResult = await splitPDFIfNeeded(filePath, maxChunkSizeMB);
    
    if (!splitResult.success) {
      throw new Error(splitResult.error || 'PDF check failed');
    }
    
    const chunkFiles = splitResult.chunkFiles;
    const splitRequired = splitResult.splitRequired;
    
    console.log(`✅ Processing ${chunkFiles.length} file(s)`)
    
    // Step 2: Upload chunks to Gemini
    console.log('\n📤 [2/4] UPLOADING TO GEMINI...');
    
    const uploadedFiles: Array<{ uri: string; name: string; chunkPath: string }> = [];
    
    for (let i = 0; i < chunkFiles.length; i++) {
      const chunkPath = chunkFiles[i];
      const chunkNum = i + 1;
      
      console.log(`   [${chunkNum}/${chunkFiles.length}] Uploading ${path.basename(chunkPath)}...`);
      
      try {
        const uploaded = await uploadFileToGemini(chunkPath);
        
        // Wait for ACTIVE state
        await waitForFileActive(uploaded.fileName, 120); // 2 min timeout
        
        uploadedFiles.push({
          uri: uploaded.fileUri,
          name: uploaded.fileName,
          chunkPath: chunkPath
        });
        
        console.log(`   ✅ Uploaded and ready: ${uploaded.fileName}`);
        
      } catch (uploadError) {
        console.error(`   ❌ Upload failed for chunk ${chunkNum}:`, uploadError);
        throw uploadError;
      }
    }
    
    console.log(`✅ All ${uploadedFiles.length} chunks uploaded`);
    
    // Step 3: Extract text from each chunk
    console.log('\n📖 [3/4] EXTRACTING TEXT...');
    
    const extractedChunks: string[] = [];
    let totalCost = 0;
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const uploaded = uploadedFiles[i];
      const chunkNum = i + 1;
      
      console.log(`   [${chunkNum}/${uploadedFiles.length}] Extracting from ${path.basename(uploaded.chunkPath)}...`);
      
      try {
        const extraction = await extractTextFromFile(uploaded.uri, {
          model,
          maxOutputTokens: maxOutputTokensPerChunk
        });
        
        extractedChunks.push(extraction.text);
        totalCost += extraction.cost;
        
        console.log(`   ✅ Extracted ${extraction.text.length.toLocaleString()} chars`);
        
      } catch (extractError) {
        console.error(`   ❌ Extraction failed for chunk ${chunkNum}:`, extractError);
        throw extractError;
      }
    }
    
    console.log(`✅ Extracted from all ${extractedChunks.length} chunks`);
    
    // Step 4: Combine results
    console.log('\n🔗 [4/4] COMBINING RESULTS...');
    
    const combinedText = extractedChunks.join('\n\n---\n\n');
    const charactersExtracted = combinedText.length;
    const tokensEstimate = Math.ceil(charactersExtracted / 4);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Combined text: ${charactersExtracted.toLocaleString()} characters`);
    console.log(`📊 Estimated tokens: ${tokensEstimate.toLocaleString()}`);
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`⏱️  Total duration: ${(duration / 1000).toFixed(1)}s`);
    
    // Cleanup: Delete uploaded files from Gemini
    console.log('\n🗑️  Cleaning up uploaded files...');
    for (const uploaded of uploadedFiles) {
      try {
        await deleteGeminiFile(uploaded.name);
      } catch (deleteError) {
        console.warn(`   ⚠️  Could not delete ${uploaded.name} (will expire in 48h)`);
      }
    }
    
    // No local chunk cleanup needed (we don't create local chunks)
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ LARGE PDF EXTRACTION COMPLETE');
    console.log('═'.repeat(60));
    
    return {
      success: true,
      extractedText: combinedText,
      charactersExtracted,
      tokensEstimate,
      model,
      totalCost,
      duration,
      chunksProcessed: uploadedFiles.length,
      totalPages: undefined
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('\n❌ LARGE PDF EXTRACTION FAILED');
    console.error(`   Error: ${errorMessage}`);
    console.error(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    
    return {
      success: false,
      extractedText: '',
      charactersExtracted: 0,
      tokensEstimate: 0,
      model,
      totalCost: 0,
      duration,
      chunksProcessed: 0,
      error: errorMessage
    };
  }
}

/**
 * Validate extraction quality
 */
export function validateExtraction(
  extractedText: string,
  expectedKeywords: string[] = ['aceite', 'filtro', 'mantenimiento', 'presión', 'seguridad']
): {
  passed: boolean;
  score: number;
  details: string[];
} {
  const details: string[] = [];
  let score = 0;
  
  // Check 1: Minimum length (should be substantial)
  if (extractedText.length > 100000) {
    score += 30;
    details.push(`✅ Length: ${extractedText.length.toLocaleString()} chars (>100K)`);
  } else if (extractedText.length > 50000) {
    score += 15;
    details.push(`⚠️  Length: ${extractedText.length.toLocaleString()} chars (50K-100K)`);
  } else {
    details.push(`❌ Length: ${extractedText.length.toLocaleString()} chars (<50K - too short)`);
  }
  
  // Check 2: Keyword coverage
  const keywordCounts: Record<string, number> = {};
  const textLower = extractedText.toLowerCase();
  
  for (const keyword of expectedKeywords) {
    const count = (textLower.match(new RegExp(keyword, 'gi')) || []).length;
    keywordCounts[keyword] = count;
    
    if (count > 50) {
      score += 14;
      details.push(`✅ Keyword "${keyword}": ${count} mentions`);
    } else if (count > 20) {
      score += 7;
      details.push(`⚠️  Keyword "${keyword}": ${count} mentions`);
    } else {
      details.push(`❌ Keyword "${keyword}": ${count} mentions (too few)`);
    }
  }
  
  // Check 3: Structure (has sections)
  const hasSections = /#{1,3}\s+\w+/.test(extractedText) || /\n\n[A-Z].+\n/.test(extractedText);
  if (hasSections) {
    score += 20;
    details.push('✅ Document has clear structure/sections');
  } else {
    details.push('❌ Document lacks clear structure');
  }
  
  // Check 4: Not just TOC (has procedural content)
  const hasProcedures = /paso|procedimiento|instrucciones|advertencia|precaución/i.test(extractedText);
  if (hasProcedures) {
    score += 20;
    details.push('✅ Contains procedural content (not just TOC)');
  } else {
    details.push('❌ Lacks procedural content (might be just TOC)');
  }
  
  const passed = score >= 70;
  
  return {
    passed,
    score,
    details
  };
}

