
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
const SOURCE_ID = '35MjyhJLJ6oJQQ5OUpkI'; // From logs
const MODEL = 'gemini-2.5-flash';

async function runTest() {
  console.log('🚀 Starting S2-v2 End-to-End Test with Gemini 2.5 Flash');
  console.log(`📄 Target File: ${path.basename(TARGET_FILE)}`);
  console.log(`🤖 Model: ${MODEL}`);
  
  // 1. Extraction
  console.log('\n---------------------------------------------------');
  console.log('[1/5] 📥 EXTRACTING TEXT');
  console.log('---------------------------------------------------');
  console.log('   1. Reading file from disk...');
  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`   ❌ File not found: ${TARGET_FILE}`);
    process.exit(1);
  }
  
  console.log('   2. Sending to Gemini API (this may take a minute)...');
  const extraction = await extractDocument(TARGET_FILE, MODEL);
  
  if (!extraction.success) {
    console.error('   ❌ Extraction failed!');
    console.error(`   Error details: ${extraction.error}`);
    process.exit(1);
  }
  
  if (extraction.extractedText.length < 100) {
    console.error('   ❌ Extraction returned empty or too short text (<100 chars)');
    console.error('   This usually means the PDF is scanned (image-only) and OCR failed.');
    process.exit(1);
  }
  
  console.log(`   ✅ Success! Extracted ${extraction.charactersExtracted.toLocaleString()} characters.`);
  
  // 2. Save to Firestore
  console.log('\n---------------------------------------------------');
  console.log('[2/5] 💾 UPDATING FIRESTORE SOURCE');
  console.log('---------------------------------------------------');
  try {
    console.log(`   1. Updating document ${SOURCE_ID}...`);
    await firestore.collection('context_sources').doc(SOURCE_ID).update({
      extractedData: extraction.extractedText,
      extractionModel: MODEL,
      lastProcessedAt: new Date().toISOString(),
      status: 'active'
    });
    console.log('   ✅ Firestore source updated successfully.');
  } catch (e: any) {
    console.error('   ❌ Firestore update failed:', e.message);
    // Continue anyway for testing
  }
  
  // 3. Chunking
  console.log('\n---------------------------------------------------');
  console.log('[3/5] ✂️  CHUNKING TEXT');
  console.log('---------------------------------------------------');
  console.log('   1. Splitting text into chunks (500 tokens, 50 overlap)...');
  const chunks = chunkText(extraction.extractedText, 500, 50);
  console.log(`   ✅ Generated ${chunks.length} chunks.`);
  
  // 4. Embedding & Indexing
  console.log('\n---------------------------------------------------');
  console.log('[4/5] 🧠 EMBEDDING & INDEXING');
  console.log('---------------------------------------------------');
  
  // Delete existing chunks first
  console.log('   1. Cleaning up old chunks...');
  const existingChunks = await firestore.collection('document_chunks')
    .where('sourceId', '==', SOURCE_ID)
    .get();
    
  if (!existingChunks.empty) {
    const batch = firestore.batch();
    existingChunks.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`      Deleted ${existingChunks.size} old chunks from Firestore.`);
  } else {
    console.log('      No old chunks found.');
  }
  
  // Process new chunks
  console.log(`   2. Processing ${chunks.length} chunks...`);
  let processed = 0;
  let failed = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const chunkId = `${SOURCE_ID}_chunk_${i}`;
    const progress = Math.round(((i + 1) / chunks.length) * 100);
    
    process.stdout.write(`      [${progress}%] Processing chunk ${i+1}/${chunks.length}... `);
    
    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunkText);
      
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
        metadata: { source: path.basename(TARGET_FILE) },
        created_at: new Date().toISOString(),
      };

      await bigquery
        .dataset('flow_rag_optimized')
        .table('document_chunks_vectorized')
        .insert([row]);
        
      process.stdout.write('✅ OK\n');
      processed++;
    } catch (e: any) {
      process.stdout.write('❌ FAIL\n');
      console.error(`      Error: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`   ✅ Completed: ${processed} success, ${failed} failed.`);
  
  // Wait for BQ availability
  console.log('\n   ⏳ Waiting 10s for BigQuery streaming buffer...');
  await new Promise(r => setTimeout(r, 10000));
  
  // 5. Validation & RAG
  console.log('\n---------------------------------------------------');
  console.log('[5/5] 🔍 VALIDATING RAG & ANSWERING');
  console.log('---------------------------------------------------');
  
  const questions = [
    "¿Cuáles son las advertencias de seguridad principales?",
    "¿Cómo se opera el sistema de extensión?",
    "¿Qué mantenimiento requiere el sistema hidráulico?"
  ];
  
  for (const query of questions) {
    console.log(`\n   ❓ Question: "${query}"`);
    
    // Search
    try {
        const results = await searchByAgentOptimized(USER_ID, AGENT_ID, query, { topK: 3 });
        
        console.log(`      Found ${results.length} references.`);
        results.forEach((r, idx) => {
          console.log(`      Ref ${idx+1}: [${(r.similarity*100).toFixed(1)}%] ...${r.text.substring(0, 60).replace(/\n/g, ' ')}...`);
        });
        
        if (results.length > 0) {
          // Generate Answer
          console.log('      🤖 Generating answer...');
          const context = results.map(r => r.text).join('\n\n---\n\n');
          const prompt = `Eres un experto en maquinaria. Usa el siguiente contexto para responder la pregunta del usuario. Si no encuentras la respuesta en el contexto, dilo.
          
          CONTEXTO:
          ${context}
          
          PREGUNTA: ${query}
          
          RESPUESTA:`;
          
          const answer = await genAI.models.generateContent({
            model: MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          
          const answerText = answer.response.text();
          console.log(`      📝 Answer:\n      "${answerText.replace(/\n/g, '\n      ')}"`);
        } else {
          console.log('      ❌ No context found, skipping generation.');
        }
    } catch (e: any) {
        console.error(`      ❌ Error searching: ${e.message}`);
    }
  }
  
  console.log('\n✅ Test Complete!');
  process.exit(0);
}

runTest().catch(console.error);

