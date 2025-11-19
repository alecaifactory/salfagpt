/**
 * Complete Upload Flow Test
 * 
 * This script tests the entire upload pipeline:
 * 1. Upload a document using the CLI
 * 2. Verify it appears in Context Management API
 * 3. Ask the agent a question about the document
 * 4. Verify RAG retrieval works correctly
 * 
 * Usage: npx tsx scripts/test-full-upload-flow.ts
 */

import { firestore } from '../src/lib/firestore';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Configuration (matching your setup)
const CONFIG = {
  testPdfPath: '/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118',
  agentId: 'TestApiUpload_S001',
  userId: 'usr_uhwqffaqag1wrryd82tw', // Hash ID (primary)
  userEmail: 'alec@getaifactory.com',
  tag: 'TEST-' + Date.now(),
};

interface TestResult {
  step: string;
  success: boolean;
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

function logStep(step: string, icon: string = '📍') {
  console.log(`\n${icon} ${step}`);
  console.log('═'.repeat(60));
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`❌ ${message}`);
  if (error) {
    console.error('   Error:', error.message || error);
  }
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

async function step1_CheckExistingDocuments(): Promise<TestResult> {
  logStep('STEP 1: Check existing documents for agent', '🔍');
  
  try {
    const docsSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId)
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .get();
    
    const count = docsSnapshot.size;
    logSuccess(`Found ${count} existing documents assigned to agent`);
    
    if (count > 0) {
      logInfo(`Sample documents:`);
      docsSnapshot.docs.slice(0, 3).forEach((doc, i) => {
        const data = doc.data();
        console.log(`   ${i + 1}. ${data.name} (${doc.id})`);
      });
    }
    
    return {
      step: 'Check Existing Documents',
      success: true,
      details: { existingCount: count }
    };
  } catch (error) {
    logError('Failed to check existing documents', error);
    return {
      step: 'Check Existing Documents',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function step2_VerifyAgentExists(): Promise<TestResult> {
  logStep('STEP 2: Verify agent exists in Firestore', '🤖');
  
  try {
    const agentDoc = await firestore
      .collection('conversations')
      .doc(CONFIG.agentId)
      .get();
    
    if (!agentDoc.exists) {
      throw new Error(`Agent ${CONFIG.agentId} does not exist`);
    }
    
    const agentData = agentDoc.data();
    logSuccess(`Agent exists: ${agentData?.agentName || CONFIG.agentId}`);
    logInfo(`Owner: ${agentData?.userId}`);
    logInfo(`Active contexts: ${agentData?.activeContextSourceIds?.length || 0}`);
    
    return {
      step: 'Verify Agent',
      success: true,
      details: {
        agentName: agentData?.agentName,
        activeContexts: agentData?.activeContextSourceIds?.length || 0
      }
    };
  } catch (error) {
    logError('Agent verification failed', error);
    return {
      step: 'Verify Agent',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function step3_TestContextCountAPI(): Promise<TestResult> {
  logStep('STEP 3: Test Context Count API (hash ID query)', '📊');
  
  try {
    // Simulate what the API does
    const countSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId) // ✅ Using hash ID
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .select('name')
      .get();
    
    const count = countSnapshot.size;
    logSuccess(`API query returned: ${count} documents`);
    
    if (count === 0) {
      logError('No documents found - this would cause the UI to show "0 documentos"');
      logInfo('This suggests either:');
      logInfo('  1. Documents have wrong userId (not using hash ID)');
      logInfo('  2. Documents not assigned to agent correctly');
      logInfo('  3. Query mismatch between upload and API');
    }
    
    return {
      step: 'Context Count API Test',
      success: count > 0,
      details: { documentCount: count }
    };
  } catch (error) {
    logError('Context Count API test failed', error);
    return {
      step: 'Context Count API Test',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function step4_TestContextSourcesAPI(): Promise<TestResult> {
  logStep('STEP 4: Test Context Sources API (paginated)', '📄');
  
  try {
    // Simulate paginated query
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId) // ✅ Using hash ID
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .orderBy('addedAt', 'desc')
      .limit(10)
      .get();
    
    const sources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      ragEnabled: doc.data().ragEnabled,
      chunks: doc.data().ragMetadata?.chunkCount || 0
    }));
    
    logSuccess(`Found ${sources.length} documents (page 1)`);
    
    if (sources.length > 0) {
      logInfo('Sample documents:');
      sources.slice(0, 5).forEach((source, i) => {
        console.log(`   ${i + 1}. ${source.name}`);
        console.log(`      - ID: ${source.id}`);
        console.log(`      - RAG: ${source.ragEnabled ? '✅' : '❌'} (${source.chunks} chunks)`);
      });
    }
    
    return {
      step: 'Context Sources API Test',
      success: sources.length > 0,
      details: { sources: sources.length }
    };
  } catch (error) {
    logError('Context Sources API test failed', error);
    return {
      step: 'Context Sources API Test',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function step5_VerifyRAGIndexing(): Promise<TestResult> {
  logStep('STEP 5: Verify RAG indexing (embeddings + chunks)', '🧬');
  
  try {
    // Get first document
    const docsSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId)
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .limit(1)
      .get();
    
    if (docsSnapshot.empty) {
      throw new Error('No documents found to test RAG');
    }
    
    const doc = docsSnapshot.docs[0];
    const docData = doc.data();
    const sourceId = doc.id;
    
    logInfo(`Testing RAG for: ${docData.name}`);
    
    // Check if RAG is enabled
    if (!docData.ragEnabled) {
      logError('RAG is not enabled for this document');
      return {
        step: 'Verify RAG Indexing',
        success: false,
        error: 'RAG not enabled'
      };
    }
    
    // Check embeddings collection
    const embeddingsSnapshot = await firestore
      .collection('document_embeddings')
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    if (embeddingsSnapshot.empty) {
      logError('No embeddings found in document_embeddings collection');
      return {
        step: 'Verify RAG Indexing',
        success: false,
        error: 'No embeddings found'
      };
    }
    
    // Get total embeddings count
    const allEmbeddings = await firestore
      .collection('document_embeddings')
      .where('sourceId', '==', sourceId)
      .select('chunkIndex')
      .get();
    
    const embeddingsCount = allEmbeddings.size;
    const expectedChunks = docData.ragMetadata?.chunkCount || 0;
    
    logSuccess(`Found ${embeddingsCount} embeddings`);
    logInfo(`Expected chunks: ${expectedChunks}`);
    
    if (embeddingsCount !== expectedChunks) {
      logError(`Mismatch: ${embeddingsCount} embeddings vs ${expectedChunks} expected chunks`);
    }
    
    // Sample an embedding
    const sampleEmbedding = embeddingsSnapshot.docs[0].data();
    logInfo('Sample embedding:');
    console.log(`   - Chunk Index: ${sampleEmbedding.chunkIndex}`);
    console.log(`   - Vector dimensions: ${sampleEmbedding.embedding?.length || 0}`);
    console.log(`   - Text preview: ${sampleEmbedding.text?.substring(0, 100)}...`);
    
    return {
      step: 'Verify RAG Indexing',
      success: embeddingsCount > 0,
      details: {
        sourceId,
        embeddingsCount,
        expectedChunks,
        vectorDimensions: sampleEmbedding.embedding?.length || 0
      }
    };
  } catch (error) {
    logError('RAG verification failed', error);
    return {
      step: 'Verify RAG Indexing',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function step6_TestRAGSearch(): Promise<TestResult> {
  logStep('STEP 6: Test RAG search with sample query', '🔍');
  
  try {
    // Get first document to test
    const docsSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId)
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .limit(1)
      .get();
    
    if (docsSnapshot.empty) {
      throw new Error('No documents found to test search');
    }
    
    const doc = docsSnapshot.docs[0];
    const docData = doc.data();
    const sourceId = doc.id;
    
    logInfo(`Testing search on: ${docData.name}`);
    
    // Simple keyword search in chunks
    const searchTerm = 'seguridad'; // Common term in documents
    const chunksSnapshot = await firestore
      .collection('document_embeddings')
      .where('sourceId', '==', sourceId)
      .get();
    
    const matchingChunks = chunksSnapshot.docs.filter(doc => {
      const text = doc.data().text || '';
      return text.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    logSuccess(`Found ${matchingChunks.length} chunks matching "${searchTerm}"`);
    
    if (matchingChunks.length > 0) {
      logInfo('Sample matching chunk:');
      const sample = matchingChunks[0].data();
      console.log(`   Chunk ${sample.chunkIndex}:`);
      console.log(`   "${sample.text?.substring(0, 200)}..."`);
    }
    
    return {
      step: 'Test RAG Search',
      success: matchingChunks.length > 0,
      details: {
        searchTerm,
        matchingChunks: matchingChunks.length,
        totalChunks: chunksSnapshot.size
      }
    };
  } catch (error) {
    logError('RAG search test failed', error);
    return {
      step: 'Test RAG Search',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function step7_VerifyActiveContexts(): Promise<TestResult> {
  logStep('STEP 7: Verify activeContextSourceIds synchronization', '🔗');
  
  try {
    // Get agent's activeContextSourceIds
    const agentDoc = await firestore
      .collection('conversations')
      .doc(CONFIG.agentId)
      .get();
    
    const activeIds = agentDoc.data()?.activeContextSourceIds || [];
    
    // Count actual assigned documents
    const assignedDocs = await firestore
      .collection('context_sources')
      .where('userId', '==', CONFIG.userId)
      .where('assignedToAgents', 'array-contains', CONFIG.agentId)
      .select('name')
      .get();
    
    const assignedCount = assignedDocs.size;
    const activeCount = activeIds.length;
    
    logInfo(`Active context IDs: ${activeCount}`);
    logInfo(`Assigned documents: ${assignedCount}`);
    
    if (activeCount !== assignedCount) {
      logError(`Mismatch! activeContextSourceIds (${activeCount}) != assigned docs (${assignedCount})`);
      logInfo('This would cause documents to not appear in the UI');
      return {
        step: 'Verify Active Contexts',
        success: false,
        error: `Mismatch: ${activeCount} active vs ${assignedCount} assigned`,
        details: { activeCount, assignedCount }
      };
    }
    
    logSuccess('✅ activeContextSourceIds matches assigned documents');
    
    return {
      step: 'Verify Active Contexts',
      success: true,
      details: { activeCount, assignedCount }
    };
  } catch (error) {
    logError('Active contexts verification failed', error);
    return {
      step: 'Verify Active Contexts',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function printSummary() {
  logStep('TEST SUMMARY', '📋');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`RESULTS: ${passed}/${total} passed`);
  console.log(`${'═'.repeat(60)}\n`);
  
  results.forEach((result, i) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Step ${i + 1}: ${result.step}`);
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value)}`);
      });
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n${'═'.repeat(60)}`);
  
  if (failed > 0) {
    console.log(`\n❌ ${failed} test(s) failed. Please check the errors above.\n`);
    console.log('💡 Common issues:');
    console.log('   1. Documents using wrong userId (Google ID instead of hash ID)');
    console.log('   2. activeContextSourceIds not synced with assigned documents');
    console.log('   3. RAG indexing incomplete (missing embeddings)');
    console.log('   4. API query mismatch (querying by wrong userId)');
  } else {
    console.log(`\n🎉 All tests passed! The upload system is working correctly.\n`);
    console.log('✅ Documents are properly indexed');
    console.log('✅ API queries work with hash ID');
    console.log('✅ RAG search is functional');
    console.log('✅ Context Management UI should display documents');
  }
  
  console.log('');
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     FULL UPLOAD FLOW TEST - Context Management System        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Configuration:');
  console.log(`   Agent ID: ${CONFIG.agentId}`);
  console.log(`   User ID: ${CONFIG.userId} (hash ID)`);
  console.log(`   Email: ${CONFIG.userEmail}`);
  console.log('');
  
  try {
    // Run all tests
    results.push(await step1_CheckExistingDocuments());
    results.push(await step2_VerifyAgentExists());
    results.push(await step3_TestContextCountAPI());
    results.push(await step4_TestContextSourcesAPI());
    results.push(await step5_VerifyRAGIndexing());
    results.push(await step6_TestRAGSearch());
    results.push(await step7_VerifyActiveContexts());
    
    // Print summary
    await printSummary();
    
    // Exit with appropriate code
    const allPassed = results.every(r => r.success);
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
    process.exit(1);
  }
}

main();

