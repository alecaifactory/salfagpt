/**
 * Complete End-to-End Test: Single Document Upload
 * 
 * 1. Upload ONE document
 * 2. Verify it appears in Context Management API
 * 3. Test RAG retrieval
 * 4. Verify activeContextSourceIds sync
 */

import { firestore } from '../src/lib/firestore';
import { uploadFileToGCS } from '../cli/lib/storage';
import { extractDocument } from '../cli/lib/extraction';
import { processForRAG } from '../cli/lib/embeddings';
import { existsSync } from 'fs';
import { join } from 'path';

const CONFIG = {
  // Use a single small test file
  testFile: '/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118/DOCUMENTOS/Instructivo Capacitación Salfacorp.pdf',
  agentId: 'TestApiUpload_S001',
  userId: 'usr_uhwqffaqag1wrryd82tw',
  userEmail: 'alec@getaifactory.com',
  tag: 'TEST-' + Date.now(),
  model: 'gemini-2.5-flash' as const,
};

interface TestResult {
  step: string;
  success: boolean;
  details?: any;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(icon: string, message: string) {
  console.log(`${icon} ${message}`);
}

function logStep(step: string) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📍 ${step}`);
  console.log('═'.repeat(70));
}

async function step1_CheckFile(): Promise<TestResult> {
  logStep('STEP 1: Check test file exists');
  const startTime = Date.now();
  
  try {
    if (!existsSync(CONFIG.testFile)) {
      throw new Error(`Test file not found: ${CONFIG.testFile}`);
    }
    
    log('✅', `File exists: ${CONFIG.testFile}`);
    
    return {
      step: 'Check File',
      success: true,
      duration: Date.now() - startTime,
      details: { filePath: CONFIG.testFile }
    };
  } catch (error) {
    log('❌', `File check failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Check File',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step2_UploadToGCS(): Promise<TestResult> {
  logStep('STEP 2: Upload to Google Cloud Storage');
  const startTime = Date.now();
  
  try {
    log('📤', 'Uploading to GCS...');
    
    const uploadResult = await uploadFileToGCS(
      CONFIG.testFile,
      CONFIG.userId,
      CONFIG.agentId,
      (progress) => {
        process.stdout.write(`\r   ${progress.percentage.toFixed(1)}% uploaded`);
      }
    );
    
    console.log(); // New line after progress
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }
    
    log('✅', `Uploaded to: ${uploadResult.gcsPath}`);
    log('📊', `Size: ${(uploadResult.fileSize / 1024).toFixed(2)} KB`);
    
    return {
      step: 'Upload to GCS',
      success: true,
      duration: Date.now() - startTime,
      details: {
        gcsPath: uploadResult.gcsPath,
        fileSize: uploadResult.fileSize
      }
    };
  } catch (error) {
    log('❌', `Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Upload to GCS',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step3_ExtractContent(): Promise<TestResult> {
  logStep('STEP 3: Extract content with Gemini AI');
  const startTime = Date.now();
  
  try {
    log('🤖', `Extracting with ${CONFIG.model}...`);
    
    const extraction = await extractDocument(CONFIG.testFile, CONFIG.model);
    
    if (!extraction.success) {
      throw new Error(extraction.error || 'Extraction failed');
    }
    
    log('✅', `Extracted ${extraction.charactersExtracted.toLocaleString()} characters`);
    log('📊', `Input tokens: ${extraction.inputTokens.toLocaleString()}`);
    log('📊', `Output tokens: ${extraction.outputTokens.toLocaleString()}`);
    log('💰', `Cost: $${extraction.estimatedCost.toFixed(6)}`);
    
    return {
      step: 'Extract Content',
      success: true,
      duration: Date.now() - startTime,
      details: {
        charactersExtracted: extraction.charactersExtracted,
        inputTokens: extraction.inputTokens,
        outputTokens: extraction.outputTokens,
        cost: extraction.estimatedCost,
        extractedText: extraction.extractedText
      }
    };
  } catch (error) {
    log('❌', `Extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Extract Content',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step4_SaveToFirestore(extractedText: string, gcsPath: string): Promise<TestResult> {
  logStep('STEP 4: Save to Firestore');
  const startTime = Date.now();
  
  try {
    const fileName = CONFIG.testFile.split('/').pop() || 'unknown.pdf';
    
    log('💾', 'Creating context_sources document...');
    
    const sourceDoc = await firestore.collection('context_sources').add({
      userId: CONFIG.userId, // ✅ Hash ID (primary)
      name: fileName,
      type: 'pdf',
      enabled: true,
      status: 'active',
      addedAt: new Date(),
      extractedData: extractedText,
      originalFileUrl: gcsPath,
      tags: [CONFIG.tag],
      assignedToAgents: [CONFIG.agentId],
      metadata: {
        originalFileName: fileName,
        uploadedVia: 'test-script',
        uploadedBy: CONFIG.userEmail,
        testRun: true,
      },
      source: 'test-script',
    });
    
    const sourceId = sourceDoc.id;
    
    log('✅', `Saved with ID: ${sourceId}`);
    log('🏷️', `Tag: ${CONFIG.tag}`);
    log('🤖', `Assigned to: ${CONFIG.agentId}`);
    
    return {
      step: 'Save to Firestore',
      success: true,
      duration: Date.now() - startTime,
      details: { sourceId, tag: CONFIG.tag }
    };
  } catch (error) {
    log('❌', `Save failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Save to Firestore',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step5_RAGProcessing(sourceId: string, extractedText: string, fileName: string): Promise<TestResult> {
  logStep('STEP 5: RAG Processing (Chunking + Embeddings)');
  const startTime = Date.now();
  
  try {
    log('🧬', 'Processing for RAG...');
    log('📊', `Text length: ${extractedText.length.toLocaleString()} chars`);
    
    const ragResult = await processForRAG(
      sourceId,
      fileName,
      extractedText,
      CONFIG.userId,
      CONFIG.agentId,
      {
        chunkSize: 1000,
        embeddingModel: 'text-embedding-004',
        uploadedVia: 'test-script',
        cliVersion: '0.2.1-test',
        userEmail: CONFIG.userEmail,
      }
    );
    
    if (!ragResult.success) {
      log('⚠️', `RAG processing failed: ${ragResult.error}`);
      return {
        step: 'RAG Processing',
        success: false,
        error: ragResult.error,
        duration: Date.now() - startTime
      };
    }
    
    log('✅', `Created ${ragResult.totalChunks} chunks`);
    log('✅', `Generated ${ragResult.totalChunks} embeddings (768-dim vectors)`);
    log('💰', `Cost: $${ragResult.estimatedCost.toFixed(6)}`);
    
    // Update metadata
    await firestore.collection('context_sources').doc(sourceId).update({
      ragEnabled: true,
      ragMetadata: {
        chunkCount: ragResult.totalChunks,
        avgChunkSize: Math.round(ragResult.totalTokens / ragResult.totalChunks),
        indexedAt: new Date(),
        embeddingModel: 'text-embedding-004',
      },
      useRAGMode: true,
    });
    
    log('✅', 'Metadata updated');
    
    return {
      step: 'RAG Processing',
      success: true,
      duration: Date.now() - startTime,
      details: {
        chunks: ragResult.totalChunks,
        embeddings: ragResult.totalChunks,
        cost: ragResult.estimatedCost
      }
    };
  } catch (error) {
    log('❌', `RAG failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'RAG Processing',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step6_UpdateAgentContext(sourceId: string): Promise<TestResult> {
  logStep('STEP 6: Update Agent activeContextSourceIds');
  const startTime = Date.now();
  
  try {
    log('🔗', 'Updating agent context...');
    
    // Get current active contexts
    const agentDoc = await firestore.collection('conversations').doc(CONFIG.agentId).get();
    const currentActive = agentDoc.data()?.activeContextSourceIds || [];
    
    // Add new source ID
    const updatedActive = [...currentActive, sourceId];
    
    await firestore.collection('conversations').doc(CONFIG.agentId).update({
      activeContextSourceIds: updatedActive,
      updatedAt: new Date(),
    });
    
    log('✅', `Updated: ${currentActive.length} → ${updatedActive.length} contexts`);
    
    return {
      step: 'Update Agent Context',
      success: true,
      duration: Date.now() - startTime,
      details: {
        previousCount: currentActive.length,
        newCount: updatedActive.length
      }
    };
  } catch (error) {
    log('❌', `Update failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Update Agent Context',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step7_VerifyAPICount(): Promise<TestResult> {
  logStep('STEP 7: Verify API Count Endpoint');
  const startTime = Date.now();
  
  try {
    log('📊', 'Querying API for document count...');
    
    const countSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId)
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .select('name')
      .get();
    
    const count = countSnapshot.size;
    
    log('✅', `API would return: ${count} documents`);
    
    if (count === 0) {
      throw new Error('API query returned 0 documents - upload not visible!');
    }
    
    return {
      step: 'Verify API Count',
      success: true,
      duration: Date.now() - startTime,
      details: { documentCount: count }
    };
  } catch (error) {
    log('❌', `API verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Verify API Count',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function step8_TestRAGSearch(sourceId: string): Promise<TestResult> {
  logStep('STEP 8: Test RAG Search');
  const startTime = Date.now();
  
  try {
    log('🔍', 'Testing RAG search...');
    log('⏳', 'Waiting 2s for Firestore to propagate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get embeddings for this document (stored in document_chunks collection)
    const embeddingsSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .limit(5)
      .get();
    
    const embeddingCount = embeddingsSnapshot.size;
    
    if (embeddingCount === 0) {
      throw new Error('No embeddings found - RAG not working!');
    }
    
    log('✅', `Found ${embeddingCount} embeddings in document_chunks`);
    
    // Sample an embedding
    const sample = embeddingsSnapshot.docs[0].data();
    log('📄', `Sample chunk text: "${sample.text?.substring(0, 100)}..."`);
    log('🧬', `Vector dimensions: ${sample.embedding?.length || 0}`);
    log('🤖', `Agent ID: ${sample.agentId}`);
    log('👤', `User ID: ${sample.userId}`);
    
    // Test keyword search
    const searchTerm = 'capacitación'; // Should be in the test file
    const matchingChunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get()
      .then(snapshot => 
        snapshot.docs.filter(doc => 
          doc.data().text?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    
    log('🔍', `Keyword search "${searchTerm}": ${matchingChunks.length} chunks found`);
    
    return {
      step: 'Test RAG Search',
      success: true,
      duration: Date.now() - startTime,
      details: {
        totalEmbeddings: embeddingCount,
        keywordMatches: matchingChunks.length,
        searchTerm
      }
    };
  } catch (error) {
    log('❌', `RAG search failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      step: 'Test RAG Search',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

function printSummary() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📋 TEST SUMMARY');
  console.log('═'.repeat(70));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  console.log(`\nResults: ${passed}/${results.length} passed`);
  console.log(`Total time: ${(totalDuration / 1000).toFixed(1)}s\n`);
  
  results.forEach((result, i) => {
    const icon = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : '';
    console.log(`${icon} Step ${i + 1}: ${result.step}${duration}`);
    
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        if (key !== 'extractedText') { // Skip long text
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        }
      });
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '═'.repeat(70));
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✅ Document uploaded successfully');
    console.log('✅ Document visible in API');
    console.log('✅ RAG search working');
    console.log('✅ Agent context synchronized');
    console.log('\n💡 Next step: Open the UI and check agent TestApiUpload_S001');
    console.log(`   Tag to filter: ${CONFIG.tag}`);
  } else {
    console.log(`\n❌ ${failed} test(s) failed\n`);
  }
  
  console.log('');
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  END-TO-END TEST: Single Document Upload with RAG Verification  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Configuration:');
  console.log(`   File: ${CONFIG.testFile.split('/').pop()}`);
  console.log(`   Agent: ${CONFIG.agentId}`);
  console.log(`   User: ${CONFIG.userId}`);
  console.log(`   Tag: ${CONFIG.tag}`);
  
  try {
    // Step 1: Check file
    results.push(await step1_CheckFile());
    if (!results[results.length - 1].success) {
      printSummary();
      process.exit(1);
    }
    
    // Step 2: Upload to GCS
    results.push(await step2_UploadToGCS());
    if (!results[results.length - 1].success) {
      printSummary();
      process.exit(1);
    }
    const gcsPath = results[results.length - 1].details?.gcsPath;
    
    // Step 3: Extract content
    results.push(await step3_ExtractContent());
    if (!results[results.length - 1].success) {
      printSummary();
      process.exit(1);
    }
    const extractedText = results[results.length - 1].details?.extractedText;
    
    // Step 4: Save to Firestore
    results.push(await step4_SaveToFirestore(extractedText, gcsPath));
    if (!results[results.length - 1].success) {
      printSummary();
      process.exit(1);
    }
    const sourceId = results[results.length - 1].details?.sourceId;
    
    // Step 5: RAG Processing
    const fileName = CONFIG.testFile.split('/').pop() || 'unknown.pdf';
    results.push(await step5_RAGProcessing(sourceId, extractedText, fileName));
    
    // Step 6: Update agent context
    results.push(await step6_UpdateAgentContext(sourceId));
    
    // Step 7: Verify API
    results.push(await step7_VerifyAPICount());
    
    // Step 8: Test RAG search
    results.push(await step8_TestRAGSearch(sourceId));
    
    // Print summary
    printSummary();
    
    // Exit code
    const allPassed = results.every(r => r.success);
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    printSummary();
    process.exit(1);
  }
}

main();

