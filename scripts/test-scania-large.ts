/**
 * Test Script: Scania P450 Manual Extraction (13MB)
 * 
 * Purpose: Validate large PDF extraction with new File API REST method
 * File: Manual de Operaciones Scania P450 B 8x4.pdf (13.32 MB)
 * Expected: >100K characters with technical content
 * 
 * Created: 2025-11-21
 */

import { extractLargePDF, validateExtraction } from '../cli/lib/large-pdf-extractor.js';
import { storeExtractedText } from '../cli/lib/firestore-chunked-storage.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { statSync, existsSync } from 'fs';
import { basename } from 'path';

// Initialize Firebase
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();

// Configuration
const TARGET_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Operaciones Scania P450 B 8x4.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const MODEL = 'gemini-2.5-flash';

// Expected keywords for Scania manual
const EXPECTED_KEYWORDS = [
  'aceite',
  'filtro', 
  'mantenimiento',
  'presión',
  'seguridad',
  'motor',
  'refrigerante',
  'freno'
];

async function runScaniaTest() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     SCANIA P450 MANUAL EXTRACTION TEST (13MB PDF)             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Verify file exists
  if (!existsSync(TARGET_FILE)) {
    console.error('❌ FATAL: File not found!');
    console.error('   Path:', TARGET_FILE);
    process.exit(1);
  }
  
  console.log('✅ File found');
  console.log('   Path:', TARGET_FILE);
  
  const fileSizeMB = statSync(TARGET_FILE).size / (1024 * 1024);
  console.log('   Size:', fileSizeMB.toFixed(2), 'MB');
  
  // Step 1: Extract using new large PDF method
  console.log('\n📥 [1/3] EXTRACTING WITH FILE API...\n');
  
  const extraction = await extractLargePDF(TARGET_FILE, {
    model: MODEL,
    maxChunkSizeMB: 45,  // Safety margin under 50MB limit
    maxOutputTokensPerChunk: 65000
  });
  
  if (!extraction.success) {
    console.error('\n❌ FATAL: Extraction failed!');
    console.error('   Error:', extraction.error);
    process.exit(1);
  }
  
  console.log('\n📊 EXTRACTION RESULTS:');
  console.log(`   ✅ Success: ${extraction.success}`);
  console.log(`   📝 Characters: ${extraction.charactersExtracted.toLocaleString()}`);
  console.log(`   🎯 Tokens: ${extraction.tokensEstimate.toLocaleString()}`);
  console.log(`   💰 Cost: $${extraction.totalCost.toFixed(4)}`);
  console.log(`   ⏱️  Duration: ${(extraction.duration / 1000).toFixed(1)}s`);
  console.log(`   🧩 Chunks: ${extraction.chunksProcessed}`);
  if (extraction.totalPages) {
    console.log(`   📄 Pages: ${extraction.totalPages}`);
  }
  
  // Step 2: Validate quality
  console.log('\n🔍 [2/3] VALIDATING EXTRACTION QUALITY...\n');
  
  const validation = validateExtraction(extraction.extractedText, EXPECTED_KEYWORDS);
  
  console.log('📊 VALIDATION RESULTS:');
  console.log(`   Score: ${validation.score}/100`);
  console.log(`   Passed: ${validation.passed ? '✅ YES' : '❌ NO'}`);
  console.log('\n   Details:');
  validation.details.forEach(detail => {
    console.log(`   ${detail}`);
  });
  
  if (!validation.passed) {
    console.error('\n⚠️  WARNING: Validation failed (score < 70)');
    console.error('   This might indicate incomplete extraction');
  }
  
  // Step 3: Save to Firestore
  console.log('\n💾 [3/3] SAVING TO FIRESTORE...');
  
  try {
    // Find or create source document
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('assignedToAgents', 'array-contains', AGENT_ID)
      .get();
    
    let sourceId: string;
    
    // Check if we already have this document
    const existingSource = sourcesSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.name?.includes('Scania P450') || 
             data.metadata?.originalFileName?.includes('Scania P450');
    });
    
    if (existingSource) {
      sourceId = existingSource.id;
      console.log(`   📝 Updating existing source: ${sourceId}`);
      
      // Build metadata object, filtering out undefined values
      const metadata: Record<string, any> = {
        ...existingSource.data().metadata,
        extractionMethod: 'file-api-rest',
        extractionDate: new Date().toISOString(),
        extractionTime: extraction.duration,
        charactersExtracted: extraction.charactersExtracted,
        tokensEstimate: extraction.tokensEstimate,
        totalCost: extraction.totalCost,
        chunksProcessed: extraction.chunksProcessed,
        validationScore: validation.score
      };
      
      // Only add totalPages if it exists
      if (extraction.totalPages !== undefined) {
        metadata.totalPages = extraction.totalPages;
      }
      
      // Update basic fields first
      await firestore.collection('context_sources').doc(sourceId).update({
        extractionModel: MODEL,
        lastProcessedAt: new Date().toISOString(),
        status: 'active',
      });
      
      // Store extracted text (handles >1MB automatically with chunking)
      await storeExtractedText(sourceId, extraction.extractedText, metadata);
      
    } else {
      console.log('   📝 Creating new source...');
      
      // Build metadata object, filtering out undefined values
      const metadata: Record<string, any> = {
        originalFileName: basename(TARGET_FILE),
        originalFileSize: statSync(TARGET_FILE).size,
        extractionMethod: 'file-api-rest',
        extractionDate: new Date().toISOString(),
        extractionTime: extraction.duration,
        charactersExtracted: extraction.charactersExtracted,
        tokensEstimate: extraction.tokensEstimate,
        totalCost: extraction.totalCost,
        chunksProcessed: extraction.chunksProcessed,
        validationScore: validation.score
      };
      
      // Only add totalPages if it exists
      if (extraction.totalPages !== undefined) {
        metadata.totalPages = extraction.totalPages;
      }
      
      // Create source document first (without extractedData)
      const newSource = await firestore.collection('context_sources').add({
        userId: USER_ID,
        assignedToAgents: [AGENT_ID],
        name: 'Manual de Operaciones Scania P450 B 8x4',
        type: 'pdf',
        extractionModel: MODEL,
        status: 'active',
        addedAt: new Date().toISOString(),
        lastProcessedAt: new Date().toISOString(),
      });
      
      sourceId = newSource.id;
      
      // Store extracted text (handles >1MB automatically with chunking)
      await storeExtractedText(firestore, sourceId, extraction.extractedText, metadata);
    }
    
    console.log(`✅ Saved to Firestore: ${sourceId}`);
    
  } catch (firestoreError) {
    console.error('❌ Firestore save failed:', firestoreError);
    throw firestoreError;
  }
  
  // Final summary
  console.log('\n' + '═'.repeat(60));
  
  if (validation.passed) {
    console.log('✅✅✅ TEST PASSED!');
    console.log(`   Scania manual extracted successfully`);
    console.log(`   ${extraction.charactersExtracted.toLocaleString()} characters`);
    console.log(`   Quality score: ${validation.score}/100`);
    console.log(`   Cost: $${extraction.totalCost.toFixed(4)}`);
  } else {
    console.log('⚠️  TEST COMPLETED WITH WARNINGS');
    console.log(`   Extraction succeeded but quality score low: ${validation.score}/100`);
    console.log(`   Review extraction manually`);
  }
  
  console.log('═'.repeat(60));
  
  process.exit(validation.passed ? 0 : 1);
}

// Run test
runScaniaTest().catch(error => {
  console.error('\n❌ CRITICAL FAILURE:', error);
  console.error('\n💡 Debug info:');
  console.error('   - Check GOOGLE_AI_API_KEY is set in .env');
  console.error('   - Verify file path is correct');
  console.error('   - Check Python3 and PyPDF2 are installed');
  console.error('   - Review error message above for details');
  process.exit(1);
});

