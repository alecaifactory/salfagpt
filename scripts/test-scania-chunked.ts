import { extractTextChunked } from '../src/lib/chunked-extraction.js';
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

const TEST_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /Segunda Carga de Documentos - 07-11-25/scania/Manual de Mantenimiento Periodico Scania L P G R y S.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi'; // S2-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const MODEL: 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-pro'; // Use Pro for better content extraction

async function testScaniaChunked() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SCANIA MANUAL - CHUNKED EXTRACTION (PDF SPLITTING)    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const fileName = TEST_FILE.split('/').pop()!;
  const fileStats = fs.statSync(TEST_FILE);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  
  console.log(`📄 File: ${fileName}`);
  console.log(`📊 Size: ${fileSizeMB.toFixed(2)} MB`);
  console.log(`🤖 Model: ${MODEL}`);
  console.log(`🔪 Method: PDF Section Extraction (Split → Extract → Combine)\n`);
  console.log('═'.repeat(70) + '\n');
  
  const stats = {
    chunked: 0,
    indexed: 0
  };
  
  try {
    // 1. EXTRACTION with PDF splitting
    console.log('📥 [1/5] EXTRACTION (WITH PDF SPLITTING)');
    console.log('─'.repeat(70));
    
    const pdfBuffer = fs.readFileSync(TEST_FILE);
    
    const extraction = await extractTextChunked(pdfBuffer, {
      model: MODEL,
      sectionSizeMB: 12, // 12MB sections
      userId: USER_ID,
      fileName: fileName,
      onProgress: (p) => {
        console.log(`   📄 Section ${p.section}/${p.total} (${p.percentage.toFixed(0)}%): ${p.message}`);
      }
    });
    
    console.log('\n   ✅ EXTRACTION COMPLETE:');
    console.log(`      Total text: ${extraction.text.length.toLocaleString()} chars`);
    console.log(`      PDF sections: ${extraction.totalPdfSections}`);
    console.log(`      Total pages: ${extraction.totalPages}`);
    console.log(`      Time: ${extraction.extractionTime.toFixed(1)}s`);
    console.log(`      Method: ${extraction.method}`);
    
    if (extraction.text.length < 10000) {
      console.warn(`      ⚠️  WARNING: Text seems short (${extraction.text.length} chars)`);
      console.warn(`      This might indicate extraction quality issues.`);
    }
    
    // Show preview
    console.log('\n   📝 Preview (first 500 chars):');
    console.log('   ┌─────────────────────────────────────────────┐');
    console.log('   ' + extraction.text.substring(0, 500).replace(/\n/g, '\n   '));
    console.log('   └─────────────────────────────────────────────┘\n');
    
    // 2. UPDATE FIRESTORE
    console.log('💾 [2/5] UPDATING FIRESTORE');
    console.log('─'.repeat(70));
    
    // Check if source exists
    const existingSnapshot = await firestore.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('metadata.originalFileName', '==', fileName)
      .limit(1)
      .get();
    
    let sourceId: string;
    
    if (!existingSnapshot.empty) {
      // Update existing
      sourceId = existingSnapshot.docs[0].id;
      await firestore.collection('context_sources').doc(sourceId).update({
        extractedData: extraction.text,
        extractionModel: MODEL,
        status: 'active',
        metadata: {
          originalFileName: fileName,
          extractionDate: new Date(),
          charactersExtracted: extraction.text.length,
          tokensEstimate: Math.ceil(extraction.text.length / 4),
          extractionTime: extraction.extractionTime,
          extractionMethod: 'chunked-pdf-sections',
          totalPdfSections: extraction.totalPdfSections,
          totalPages: extraction.totalPages
        }
      });
      console.log(`   ✅ Updated existing source: ${sourceId}\n`);
    } else {
      // Create new
      const sourceRef = await firestore.collection('context_sources').add({
        userId: USER_ID,
        name: fileName,
        type: 'pdf',
        status: 'active',
        assignedToAgents: [AGENT_ID],
        extractedData: extraction.text,
        extractionModel: MODEL,
        addedAt: new Date(),
        metadata: {
          originalFileName: fileName,
          extractionDate: new Date(),
          charactersExtracted: extraction.text.length,
          tokensEstimate: Math.ceil(extraction.text.length / 4),
          extractionTime: extraction.extractionTime,
          extractionMethod: 'chunked-pdf-sections',
          totalPdfSections: extraction.totalPdfSections,
          totalPages: extraction.totalPages
        }
      });
      sourceId = sourceRef.id;
      console.log(`   ✅ Created source: ${sourceId}\n`);
    }
    
    // 3. CHUNK TEXT (RAG chunks, not PDF sections)
    console.log('✂️  [3/5] CHUNKING TEXT FOR RAG');
    console.log('─'.repeat(70));
    
    const textChunks = chunkText(extraction.text, 500, 50);
    console.log(`   ✅ Generated ${textChunks.length} text chunks for RAG.\n`);
    
    stats.chunked += textChunks.length;
    
    // 4. CLEAN OLD CHUNKS
    console.log('🧹 [4/5] CLEANING OLD CHUNKS');
    console.log('─'.repeat(70));
    
    const oldChunksSnapshot = await firestore.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    if (!oldChunksSnapshot.empty) {
      console.log(`   🗑️  Deleting ${oldChunksSnapshot.size} old chunks...`);
      const batch = firestore.batch();
      oldChunksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✅ Old chunks cleaned.\n`);
    } else {
      console.log(`   ℹ️  No old chunks to clean.\n`);
    }
    
    // 5. EMBED & INDEX
    console.log('🧠 [5/5] EMBEDDING & INDEXING');
    console.log('─'.repeat(70));
    
    let indexed = 0;
    let failed = 0;
    
    for (let ci = 0; ci < textChunks.length; ci++) {
      const chunk = textChunks[ci];
      const chunkId = `${sourceId}_chunk_${ci}`;
      
      // Progress indicator
      if (ci % 10 === 0 || ci === textChunks.length - 1) {
        const pct = ((ci + 1) / textChunks.length * 100).toFixed(0);
        process.stdout.write(`   [${pct}%] Chunk ${ci+1}/${textChunks.length}...\r`);
      }
      
      try {
        const embedding = await generateEmbedding(chunk.text);
        
        // Save to Firestore
        await firestore.collection('document_chunks').doc(chunkId).set({
          sourceId: sourceId,
          userId: USER_ID,
          chunkIndex: ci,
          text: chunk.text,
          embedding: embedding,
          metadata: {
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount
          },
          createdAt: new Date()
        });
        
        // Sync to BigQuery
        await bigquery.dataset('flow_rag_optimized').table('document_chunks_vectorized').insert([{
          chunk_id: chunkId,
          source_id: sourceId,
          user_id: USER_ID,
          chunk_index: ci,
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
        console.error(`\n      ⚠️  Chunk ${ci} failed: ${e.message}`);
        failed++;
      }
    }
    
    console.log(`\n   ✅ Indexed ${indexed}/${textChunks.length} chunks. Failed: ${failed}\n`);
    
    stats.indexed += indexed;
    
    // 6. WAIT FOR BIGQUERY BUFFER
    console.log('⏳ Waiting 10s for BigQuery buffer availability...\n');
    await new Promise(r => setTimeout(r, 10000));
    
    // 7. VALIDATE WITH RAG QUESTIONS
    console.log('🔍 [VALIDATION] TESTING RAG WITH QUESTIONS');
    console.log('═'.repeat(70) + '\n');
    
    const questions = [
      "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un camión pluma SCANIA P450 B 6x4?",
      "¿Qué filtros se deben cambiar en una mantención de 2000 horas para un SCANIA?",
      "¿Cuál es el procedimiento de mantenimiento del sistema de frenos en un SCANIA?"
    ];
    
    const { searchByAgentOptimized } = await import('../src/lib/bigquery-optimized.js');
    
    for (const question of questions) {
      console.log(`❓ Pregunta: "${question}"`);
      
      try {
        const results = await searchByAgentOptimized(
          USER_ID,
          AGENT_ID,
          question,
          { topK: 5, minSimilarity: 0.5 }
        );
        
        if (results.length === 0) {
          console.log(`   ❌ No results found\n`);
          continue;
        }
        
        const topSim = results[0].similarity;
        console.log(`   ✅ Found ${results.length} chunks (Top: ${(topSim*100).toFixed(1)}%)`);
        
        // Show top 3 results
        results.slice(0, 3).forEach((r, idx) => {
          console.log(`   ${idx+1}. [${(r.similarity*100).toFixed(1)}%] ${r.source_name} (chunk ${r.chunk_index})`);
          console.log(`      Preview: ${r.text.substring(0, 120).replace(/\n/g, ' ')}...`);
        });
        
        console.log('');
        
      } catch (e: any) {
        console.error(`   ❌ Search failed: ${e.message}\n`);
      }
    }
    
    // SUMMARY
    console.log('═'.repeat(70));
    console.log('✅ TEST COMPLETE');
    console.log('═'.repeat(70));
    console.log(`Extracted: ${extraction.text.length.toLocaleString()} chars`);
    console.log(`PDF Sections: ${extraction.totalPdfSections}`);
    console.log(`Text Chunks: ${textChunks.length}`);
    console.log(`Indexed: ${indexed}/${textChunks.length}`);
    console.log(`Method: PDF Section Extraction (${extraction.totalPdfSections} sections processed)`);
    console.log('═'.repeat(70));
    
    process.exit(0);
    
  } catch (e: any) {
    console.error('\n❌ TEST FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

testScaniaChunked().catch(e => {
  console.error('\n❌ FATAL ERROR:', e);
  process.exit(1);
});

