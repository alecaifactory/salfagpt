import { extractDocument } from '../cli/lib/extraction.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Mantenimiento Periodico Scania L P G R y S.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; // S2-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const SOURCE_ID = '4SoCKjWn1aj0oWQamsOk'; // Existing source to update

async function updateScaniaAndTest() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   UPDATE SCANIA MANUAL & TEST RAG                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  
  console.log(`📄 File: ${fileName}`);
  console.log(`🔑 Source ID: ${SOURCE_ID}`);
  console.log(`🤖 Model: gemini-2.5-pro\n`);
  console.log('═'.repeat(70) + '\n');
  
  try {
    // 1. EXTRACT
    console.log('📥 [1/6] EXTRACTING WITH GEMINI 2.5 PRO');
    console.log('─'.repeat(70));
    
    const extraction = await extractDocument(TEST_FILE, 'gemini-2.5-pro');
    
    if (!extraction.success || extraction.extractedText.length < 10000) {
      throw new Error(`Extraction failed or too short: ${extraction.extractedText.length} chars`);
    }
    
    console.log(`   ✅ ${extraction.extractedText.length.toLocaleString()} chars extracted`);
    console.log(`   ⏱️  ${extraction.duration.toFixed(1)}s`);
    console.log(`   💰 $${extraction.estimatedCost.toFixed(6)}\n`);
    
    // 2. UPDATE FIRESTORE
    console.log('💾 [2/6] UPDATING FIRESTORE SOURCE');
    console.log('─'.repeat(70));
    
    await firestore.collection('context_sources').doc(SOURCE_ID).update({
      extractedData: extraction.extractedText,
      extractionModel: 'gemini-2.5-pro',
      status: 'active',
      'metadata.extractionDate': new Date(),
      'metadata.charactersExtracted': extraction.extractedText.length,
      'metadata.tokensEstimate': extraction.tokensEstimate,
      'metadata.extractionTime': extraction.duration,
      'metadata.extractionCost': extraction.estimatedCost
    });
    
    console.log(`   ✅ Source ${SOURCE_ID} updated with ${extraction.extractedText.length.toLocaleString()} chars\n`);
    
    // 3. CHUNK
    console.log('✂️  [3/6] CHUNKING FOR RAG');
    console.log('─'.repeat(70));
    
    const chunks = chunkText(extraction.extractedText, 500, 50);
    console.log(`   ✅ ${chunks.length} text chunks generated\n`);
    
    // 4. CLEAN OLD CHUNKS
    console.log('🧹 [4/6] CLEANING OLD CHUNKS');
    console.log('─'.repeat(70));
    
    const oldChunks = await firestore.collection('document_chunks')
      .where('sourceId', '==', SOURCE_ID)
      .get();
    
    if (!oldChunks.empty) {
      console.log(`   🗑️  Deleting ${oldChunks.size} old chunks...`);
      const batch = firestore.batch();
      oldChunks.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✅ Cleaned\n`);
    } else {
      console.log(`   ℹ️  No old chunks\n`);
    }
    
    // 5. EMBED & INDEX
    console.log('🧠 [5/6] EMBEDDING & INDEXING');
    console.log('─'.repeat(70));
    
    let indexed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${SOURCE_ID}_chunk_${i}`;
      
      if (i % 10 === 0 || i === chunks.length - 1) {
        const pct = ((i + 1) / chunks.length * 100).toFixed(0);
        process.stdout.write(`   [${pct}%] Embedding chunk ${i+1}/${chunks.length}...\r`);
      }
      
      try {
        const embedding = await generateEmbedding(chunk.text);
        
        // Firestore
        await firestore.collection('document_chunks').doc(chunkId).set({
          sourceId: SOURCE_ID,
          userId: USER_ID,
          chunkIndex: i,
          text: chunk.text,
          embedding: embedding,
          metadata: {
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount
          },
          createdAt: new Date()
        });
        
        // BigQuery
        await bigquery.dataset('flow_rag_optimized').table('document_chunks_vectorized').insert([{
          chunk_id: chunkId,
          source_id: SOURCE_ID,
          user_id: USER_ID,
          chunk_index: i,
          text_preview: chunk.text.substring(0, 500),
          full_text: chunk.text,
          embedding: embedding,
          metadata: JSON.stringify({
            source: fileName,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount
          }),
          created_at: new Date().toISOString()
        }]);
        
        indexed++;
      } catch (e: any) {
        console.error(`\n   ⚠️  Chunk ${i} failed: ${e.message}`);
      }
    }
    
    console.log(`\n   ✅ ${indexed}/${chunks.length} chunks indexed\n`);
    
    // 6. WAIT & TEST
    console.log('⏳ Waiting 10s for BigQuery...\n');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('🔍 [6/6] TESTING RAG');
    console.log('═'.repeat(70) + '\n');
    
    const questions = [
      "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un camión pluma SCANIA P450?",
      "¿Qué filtros se deben cambiar en una mantención de 2000 horas para un SCANIA?",
      "¿Cuál es el procedimiento de mantenimiento del sistema de frenos en un SCANIA?"
    ];
    
    const { searchByAgentOptimized } = await import('../src/lib/bigquery-optimized.js');
    
    let passed = 0;
    
    for (const question of questions) {
      console.log(`❓ "${question}"`);
      
      try {
        const results = await searchByAgentOptimized(
          USER_ID,
          AGENT_ID,
          question,
          { topK: 3, minSimilarity: 0.5 }
        );
        
        if (results.length === 0) {
          console.log(`   ❌ No results\n`);
          continue;
        }
        
        const topSim = results[0].similarity;
        console.log(`   ✅ ${results.length} chunks found (Top: ${(topSim*100).toFixed(1)}%)`);
        
        results.slice(0, 3).forEach((r, idx) => {
          console.log(`   ${idx+1}. [${(r.similarity*100).toFixed(1)}%] ${r.source_name} (chunk ${r.chunk_index})`);
          console.log(`      ${r.text.substring(0, 100).replace(/\n/g, ' ')}...`);
        });
        
        if (topSim > 0.6) passed++;
        console.log('');
        
      } catch (e: any) {
        console.log(`   ❌ Error: ${e.message}\n`);
      }
    }
    
    console.log('═'.repeat(70));
    console.log(`✅ TEST COMPLETE: ${passed}/3 questions passed (>60% similarity)`);
    console.log('═'.repeat(70));
    console.log(`Updated source: ${SOURCE_ID}`);
    console.log(`Chars: ${extraction.extractedText.length.toLocaleString()}`);
    console.log(`Chunks: ${indexed}`);
    console.log('═'.repeat(70));
    
    process.exit(passed === 3 ? 0 : 1);
    
  } catch (e: any) {
    console.error('\n❌ FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

updateScaniaAndTest().catch(e => {
  console.error('\n❌ FATAL:', e);
  process.exit(1);
});



