import { extractWithFileAPI } from '../src/lib/gemini-file-upload.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import * as fs from 'fs';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Operaciones Scania P450 B 8x4.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; 
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function testFileAPI() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   EXTRACT LARGE PDF WITH GEMINI FILE API (NO PDF-LIB)        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  const fileStats = fs.statSync(TEST_FILE);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  
  console.log(`📄 File: ${fileName}`);
  console.log(`📊 Size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`🔑 Method: Gemini File API (Upload → Process → Extract)`);
  console.log(`🤖 Model: gemini-2.5-pro`);
  console.log(`📌 Max tokens: 100,000 (full content)\n`);
  console.log('═'.repeat(70) + '\n');
  
  try {
    // 1. EXTRACT WITH FILE API
    console.log('📥 [1/5] EXTRACTING WITH FILE API');
    console.log('─'.repeat(70));
    
    const pdfBuffer = fs.readFileSync(TEST_FILE);
    
    const extraction = await extractWithFileAPI(pdfBuffer, {
      fileName: fileName,
      model: 'gemini-2.5-pro',
      maxOutputTokens: 100000 // Request maximum output for complete extraction
    });
    
    console.log(`\n   ✅ EXTRACTED:`);
    console.log(`      Chars: ${extraction.text.length.toLocaleString()}`);
    console.log(`      Time: ${extraction.extractionTime.toFixed(1)}s`);
    console.log(`      Cost: $${extraction.metadata.cost.toFixed(4)}`);
    
    // 2. QUALITY CHECK
    console.log('\n📊 [2/5] CONTENT QUALITY');
    console.log('─'.repeat(70));
    
    const keywords = {
      'aceite': (extraction.text.toLowerCase().match(/aceite/g) || []).length,
      'filtro': (extraction.text.toLowerCase().match(/filtro/g) || []).length,
      'mantenimiento': (extraction.text.toLowerCase().match(/mantenimiento/g) || []).length,
      'hidráulico': (extraction.text.toLowerCase().match(/hidráulico/g) || []).length,
      'horas': (extraction.text.toLowerCase().match(/\d{3,4}\s*horas/g) || []).length,
    };
    
    console.log('   Keywords:');
    Object.entries(keywords).forEach(([kw, count]) => {
      const status = count > 10 ? '✅' : count > 0 ? '⚠️' : '❌';
      console.log(`      ${kw.padEnd(15)}: ${count.toString().padStart(4)} ${status}`);
    });
    
    const total = Object.values(keywords).reduce((a, b) => a + b, 0);
    
    console.log(`\n   Total keywords: ${total} ${total > 50 ? '✅ EXCELLENT' : total > 20 ? '✅ GOOD' : total > 5 ? '⚠️  LIMITED' : '❌ TOC ONLY'}`);
    
    // Show sample
    console.log('\n   📝 Sample (chars 20000-20500):');
    console.log('   ' + extraction.text.substring(20000, 20500).substring(0, 500));
    
    // 3. SAVE TO FIRESTORE
    console.log('\n\n💾 [3/5] SAVING TO FIRESTORE');
    console.log('─'.repeat(70));
    
    const existingSnapshot = await firestore.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('metadata.originalFileName', '==', fileName)
      .limit(1)
      .get();
    
    let sourceId: string;
    
    if (!existingSnapshot.empty) {
      sourceId = existingSnapshot.docs[0].id;
      await firestore.collection('context_sources').doc(sourceId).update({
        extractedData: extraction.text,
        extractionModel: 'gemini-2.5-pro',
        status: 'active',
        'metadata.extractionMethod': 'gemini-file-api',
        'metadata.extractionDate': new Date(),
        'metadata.charactersExtracted': extraction.text.length,
        'metadata.tokensEstimate': Math.ceil(extraction.text.length / 4),
        'metadata.extractionTime': extraction.extractionTime,
        'metadata.extractionCost': extraction.metadata.cost
      });
      console.log(`   ✅ Updated source: ${sourceId}`);
    } else {
      const sourceRef = await firestore.collection('context_sources').add({
        userId: USER_ID,
        name: fileName,
        type: 'pdf',
        status: 'active',
        assignedToAgents: [AGENT_ID],
        extractedData: extraction.text,
        extractionModel: 'gemini-2.5-pro',
        addedAt: new Date(),
        metadata: {
          originalFileName: fileName,
          extractionMethod: 'gemini-file-api',
          extractionDate: new Date(),
          charactersExtracted: extraction.text.length,
          tokensEstimate: Math.ceil(extraction.text.length / 4),
          extractionTime: extraction.extractionTime,
          extractionCost: extraction.metadata.cost
        }
      });
      sourceId = sourceRef.id;
      console.log(`   ✅ Created source: ${sourceId}`);
    }
    
    // 4. CHUNK & INDEX
    if (total < 5) {
      console.log('\n⚠️  Skipping chunking - content is TOC only');
      process.exit(1);
    }
    
    console.log('\n✂️  [4/5] CHUNKING & INDEXING');
    console.log('─'.repeat(70));
    
    const chunks = chunkText(extraction.text, 500, 50);
    console.log(`   ✅ ${chunks.length} chunks\n`);
    
    // Clean old
    const oldChunks = await firestore.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    if (!oldChunks.empty) {
      const batch = firestore.batch();
      oldChunks.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   🗑️  Cleaned ${oldChunks.size} old chunks`);
    }
    
    let indexed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${sourceId}_chunk_${i}`;
      
      if (i % 20 === 0 || i === chunks.length - 1) {
        process.stdout.write(`   [${((i+1)/chunks.length*100).toFixed(0)}%] ${i+1}/${chunks.length}...\r`);
      }
      
      try {
        const embedding = await generateEmbedding(chunk.text);
        
        await firestore.collection('document_chunks').doc(chunkId).set({
          sourceId: sourceId,
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
        
        await bigquery.dataset('flow_rag_optimized').table('document_chunks_vectorized').insert([{
          chunk_id: chunkId,
          source_id: sourceId,
          user_id: USER_ID,
          chunk_index: i,
          text_preview: chunk.text.substring(0, 500),
          full_text: chunk.text,
          embedding: embedding,
          metadata: JSON.stringify({ source: fileName }),
          created_at: new Date().toISOString()
        }]);
        
        indexed++;
      } catch (e: any) {
        console.error(`\n   ⚠️  Chunk ${i}: ${e.message}`);
      }
    }
    
    console.log(`\n   ✅ Indexed ${indexed}/${chunks.length}\n`);
    
    // 5. TEST
    console.log('🔍 [5/5] TESTING RAG');
    console.log('═'.repeat(70) + '\n');
    
    console.log('⏳ Waiting 10s for BigQuery buffer...\n');
    await new Promise(r => setTimeout(r, 10000));
    
    const questions = [
      "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un SCANIA P450?",
      "¿Qué filtros se cambian en una mantención de 2000 horas?",
      "¿Cuál es el procedimiento de mantenimiento del sistema de frenos?"
    ];
    
    const { searchByAgentOptimized } = await import('../src/lib/bigquery-optimized.js');
    
    for (const q of questions) {
      console.log(`❓ "${q}"`);
      
      const results = await searchByAgentOptimized(USER_ID, AGENT_ID, q, { topK: 3, minSimilarity: 0.6 });
      
      if (results.length > 0) {
        console.log(`   ✅ ${results.length} refs (Top: ${(results[0].similarity*100).toFixed(1)}%)`);
        results.forEach((r, idx) => {
          console.log(`   ${idx+1}. [${(r.similarity*100).toFixed(1)}%] ${r.source_name.substring(0, 40)}... chunk ${r.chunk_index}`);
        });
      } else {
        console.log(`   ❌ No results`);
      }
      console.log('');
    }
    
    console.log('═'.repeat(70));
    console.log(`✅ SUCCESS: File API extraction works for large PDFs!`);
    console.log(`   Text: ${extraction.text.length.toLocaleString()} chars`);
    console.log(`   Keywords: ${total}`);
    console.log(`   Chunks: ${indexed}`);
    console.log('═'.repeat(70));
    
    process.exit(0);
    
  } catch (e: any) {
    console.error('\n❌ FAILED:', e.message);
    process.exit(1);
  }
}

testFileAPI().catch(e => {
  console.error('\n❌ FATAL:', e);
  process.exit(1);
});

