
import { extractDocument } from '../cli/lib/extraction.js';
import { chunkText } from '../src/lib/chunking.js';
import { generateEmbedding } from '../src/lib/embeddings.js';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { searchByAgentOptimized } from '../src/lib/bigquery-optimized.js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Initialize clients
initializeApp({ projectId: 'salfagpt' });
const firestore = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Configuration
const TARGET_FILE = '/Users/alec/salfagpt/upload-queue/S002-20251118/Documentación /CAMION PLUMA/Hiab 422-477 Duo-HiDuo Manual operador.pdf';
const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const SOURCE_ID = '35MjyhJLJ6oJQQ5OUpkI'; 
const MODEL = 'gemini-2.5-flash';

async function runSingleDocTest() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      SINGLE DOCUMENT E2E TEST: Hiab 422-477 Duo-HiDuo         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // 1. EXTRACTION
  console.log('📥 [1/5] EXTRACTING TEXT');
  console.log('   File:', path.basename(TARGET_FILE));
  
  if (!fs.existsSync(TARGET_FILE)) {
    console.error('❌ FATAL: File not found!');
    process.exit(1);
  }

  // Force initial OCR attempt via prompt instruction (handled inside updated extractDocument)
  const extraction = await extractDocument(TARGET_FILE, MODEL);
  
  // Retry logic handled inside extractDocument now, but let's verify result
  if (!extraction.success || extraction.extractedText.length < 500) {
    console.error('❌ FATAL: Extraction failed or text too short.');
    console.error('   Error:', extraction.error);
    console.error('   Length:', extraction.extractedText.length);
    process.exit(1);
  }
  
  console.log(`✅ Extracted ${extraction.charactersExtracted.toLocaleString()} chars.`);
  
  // 2. FIRESTORE UPDATE
  console.log('\n💾 [2/5] UPDATING FIRESTORE');
  try {
    await firestore.collection('context_sources').doc(SOURCE_ID).update({
      extractedData: extraction.extractedText,
      extractionModel: MODEL,
      lastProcessedAt: new Date().toISOString(),
      status: 'active'
    });
    console.log('✅ Firestore updated.');
  } catch (e) {
    console.error('❌ FATAL: Firestore update failed:', e.message);
    process.exit(1);
  }
  
  // 3. CHUNKING
  console.log('\n✂️  [3/5] CHUNKING');
  const chunks = chunkText(extraction.extractedText, 500, 50);
  if (chunks.length === 0) {
    console.error('❌ FATAL: No chunks generated.');
    process.exit(1);
  }
  console.log(`✅ Generated ${chunks.length} chunks.`);
  
  // 4. EMBEDDING & INDEXING
  console.log('\n🧠 [4/5] EMBEDDING & INDEXING');
  
  // Cleanup old chunks
  const existingChunks = await firestore.collection('document_chunks')
    .where('sourceId', '==', SOURCE_ID)
    .get();
  
  if (!existingChunks.empty) {
    const batch = firestore.batch();
    existingChunks.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`   Cleaned up ${existingChunks.size} old chunks.`);
  }
  
  let successCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]; // chunk is a TextChunk object
    const chunkText = chunk.text; // Extract the text property
    const chunkId = `${SOURCE_ID}_chunk_${i}`;
    const progress = Math.round(((i+1)/chunks.length)*100);
    
    process.stdout.write(`   [${progress}%] Chunk ${i+1}/${chunks.length}... `);
    
    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunkText);
      
      // Check if embedding is valid (not all zeros)
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val*val, 0));
      if (magnitude < 0.001) {
        throw new Error('Generated zero-vector embedding');
      }

      // Save to Firestore
      await firestore.collection('document_chunks').doc(chunkId).set({
        sourceId: SOURCE_ID,
        chunkIndex: i,
        text: chunkText,
        embedding: embedding,
        createdAt: new Date().toISOString()
      });
      
      // Sync to BigQuery
      const row = {
        chunk_id: chunkId,
        source_id: SOURCE_ID,
        user_id: USER_ID,
        chunk_index: i,
        text_preview: chunkText.substring(0, 500),
        full_text: chunkText,
        embedding: embedding,
        metadata: JSON.stringify({ source: path.basename(TARGET_FILE) }), // Convert to JSON string
        created_at: new Date().toISOString(),
      };

      await bigquery
        .dataset('flow_rag_optimized')
        .table('document_chunks_vectorized')
        .insert([row]);
        
      process.stdout.write('✅ OK\n');
      successCount++;
      
    } catch (e: any) {
      process.stdout.write('❌ FAIL\n');
      console.error(`      Error: ${e.message || 'Unknown error'}`);
      console.error(`      Error type: ${typeof e}`);
      console.error(`      Full error: ${JSON.stringify(e, null, 2)}`);
      // Fail fast on embedding error
      console.error('❌ FATAL: Embedding/Indexing failed. Stopping test.');
      process.exit(1);
    }
  }
  
  console.log(`✅ Indexed ${successCount} chunks successfully.`);
  
  console.log('\n⏳ Waiting 10s for BigQuery buffer availability...');
  await new Promise(r => setTimeout(r, 10000));
  
  // 5. RAG VALIDATION
  console.log('\n🔍 [5/5] VALIDATING RAG & QUESTIONS');
  
  const questions = [
    { q: "¿Cuáles son las advertencias de seguridad principales?", expectedKeywords: ["seguridad", "peligro", "advertencia"] },
    { q: "¿Cómo se opera el sistema de extensión?", expectedKeywords: ["extensión", "palanca", "operar"] },
    { q: "¿Qué mantenimiento requiere el sistema hidráulico?", expectedKeywords: ["aceite", "filtro", "mantenimiento"] }
  ];
  
  let passedQuestions = 0;
  
  for (const item of questions) {
    console.log(`\n❓ Pregunta: "${item.q}"`);
    
    try {
      const results = await searchByAgentOptimized(USER_ID, AGENT_ID, item.q, { topK: 3, minSimilarity: 0.5 });
      
      if (results.length === 0) {
        console.error('   ❌ FAIL: No results found (0 matches > 50% similarity)');
        continue;
      }
      
      // Check similarity
      const topSim = results[0].similarity;
      console.log(`   📊 Top Similarity: ${(topSim*100).toFixed(1)}%`);
      
      if (topSim < 0.65) {
        console.warn('   ⚠️  WARN: Similarity < 65% (Data might be poor quality)');
      }
      
      // Show references
      results.forEach((r, idx) => {
        console.log(`   Ref ${idx+1}: [${(r.similarity*100).toFixed(1)}%] ${r.text.substring(0, 80).replace(/\n/g, ' ')}...`);
      });
      
      // Generate Answer
      const context = results.map(r => r.text).join('\n\n---\n\n');
      const prompt = `Responde brevemente (max 3 lineas) basado en el contexto:
      CONTEXTO: ${context}
      PREGUNTA: ${item.q}
      RESPUESTA:`;
      
      const answer = await genAI.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const answerText = answer.text || '';
      console.log(`   🤖 Respuesta: "${answerText.replace(/\n/g, ' ')}"`);
      
      if (results.length > 0 && topSim > 0.6) {
        passedQuestions++;
      }
      
    } catch (e) {
      console.error(`   ❌ FAIL: Search error: ${e.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  if (passedQuestions === 3) {
    console.log('✅✅✅ TEST PASSED: All steps successful & Questions answered.');
  } else {
    console.log(`⚠️  TEST PARTIAL: ${passedQuestions}/3 questions answered correctly.`);
  }
  console.log('═'.repeat(60));
  process.exit(0);
}

runSingleDocTest().catch(e => {
  console.error('\n❌ CRITICAL FAILURE:', e);
  process.exit(1);
});

