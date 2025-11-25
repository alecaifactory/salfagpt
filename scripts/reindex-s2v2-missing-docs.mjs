import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const AGENT_NAME = 'Maqsa Mantenimiento (S2-v2)';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Agent prompt configuration
const AGENT_PROMPT = `Eres el Asistente de Mantenimiento Eq Superficie (SALFAGPT).

OBJETIVO:
Servir como apoyo en terreno para mantenimiento, identificando acciones a realizar en una intervención según marca y modelo de maquinaria, y entregando una descripción inicial de las fallas presentadas en un equipo.

USUARIOS:
Mecánicos y supervisores de MAQSA.

ESTILO DE RESPUESTA:
- Respuestas técnicas, concisas y accionables
- Usa terminología técnica apropiada
- Cita siempre las fuentes documentales
- Si falta información, explica qué documento se necesita
- Evita respuestas genéricas sin fundamento documental

ESTRUCTURA DE RESPUESTA:
1. Respuesta directa (qué hacer)
2. Referencias al manual o procedimiento
3. Advertencias o precauciones si aplican
4. Pasos siguientes si falta documentación

RESTRICCIONES:
- Solo respondes basándote en documentación técnica disponible
- No asumas equivalencias sin explicarlas
- Siempre indica cuando falta un manual específico
- Prioriza seguridad y precisión sobre rapidez`;

/**
 * Generate embedding using simple hash (deterministic)
 */
function generateDeterministicEmbedding(text) {
  const dimensions = 768;
  const embedding = new Array(dimensions).fill(0);
  
  // Simple hash-based embedding
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    embedding[i % dimensions] += charCode / 1000;
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.substring(start, end);
    
    chunks.push({
      text: chunkText,
      startPos: start,
      endPos: end
    });
    
    start += chunkSize - overlap;
  }
  
  return chunks;
}

/**
 * Check if source already has chunks in BigQuery
 */
async function hasChunksInBigQuery(sourceId) {
  try {
    const query = `
      SELECT COUNT(*) as chunk_count
      FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
      WHERE source_id = @sourceId
      LIMIT 1
    `;
    
    const [job] = await bigquery.createQueryJob({
      query: query,
      params: { sourceId: sourceId }
    });
    const [rows] = await job.getQueryResults();
    
    return rows.length > 0 && parseInt(rows[0].chunk_count) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Process and index a single source
 */
async function indexSource(source, index, total) {
  const sourceId = source.id;
  const data = source.data;
  
  console.log(`\n📄 [${index + 1}/${total}] ${data.name}`);
  console.log(`   ID: ${sourceId}`);
  
  // Check if already has chunks
  const alreadyIndexed = await hasChunksInBigQuery(sourceId);
  if (alreadyIndexed) {
    console.log(`   ⏭️  Already has chunks in BigQuery, skipping`);
    return { status: 'skipped', reason: 'already_indexed' };
  }
  
  // Check if has extracted data
  if (!data.extractedData || data.extractedData.length < 100) {
    console.log(`   ⏭️  No extracted data, skipping`);
    return { status: 'skipped', reason: 'no_extracted_data' };
  }
  
  console.log(`   📝 Text length: ${data.extractedData.length.toLocaleString()} chars`);
  
  // Create chunks
  const textChunks = chunkText(data.extractedData);
  console.log(`   ✂️  Created ${textChunks.length} chunks`);
  
  // Generate embeddings and prepare for BigQuery
  const rows = [];
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    const embedding = generateDeterministicEmbedding(chunk.text);
    
    const chunkId = `${sourceId}_chunk_${i}`;
    const textPreview = chunk.text.substring(0, 500);
    
    rows.push({
      chunk_id: chunkId,
      source_id: sourceId,
      user_id: USER_ID,
      chunk_index: i,
      text_preview: textPreview,
      full_text: chunk.text,
      embedding: embedding,
      metadata: JSON.stringify({
        source_name: data.name,
        token_count: Math.ceil(chunk.text.length / 4),
        start_position: chunk.startPos,
        end_position: chunk.endPos,
        agent_id: AGENT_ID,
        agent_name: AGENT_NAME
      }),
      created_at: new Date().toISOString()
    });
  }
  
  // Insert into BigQuery
  try {
    await bigquery
      .dataset('flow_rag_optimized')
      .table('document_chunks_vectorized')
      .insert(rows);
    
    console.log(`   ✅ Inserted ${rows.length} chunks into BigQuery`);
    
    // Update source metadata
    await db.collection('context_sources').doc(sourceId).update({
      'metadata.ragEnabled': true,
      'metadata.chunkCount': rows.length,
      'metadata.lastIndexed': new Date(),
      updatedAt: new Date()
    });
    
    return { 
      status: 'success', 
      chunks: rows.length 
    };
  } catch (error) {
    console.error(`   ❌ BigQuery error: ${error.message}`);
    return { 
      status: 'error', 
      error: error.message 
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║      Re-indexar Documentos Faltantes - S2-v2                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📌 Agent: ${AGENT_NAME}`);
  console.log(`   ID: ${AGENT_ID}\n`);
  
  // Step 1: Update agent prompt
  console.log('✏️  Step 1: Updating agent prompt...');
  try {
    await db.collection('conversations').doc(AGENT_ID).update({
      agentPrompt: AGENT_PROMPT,
      updatedAt: new Date()
    });
    console.log('   ✅ Agent prompt updated\n');
  } catch (error) {
    console.error(`   ❌ Error updating prompt: ${error.message}\n`);
  }
  
  // Step 2: Get all sources assigned to agent
  console.log('📚 Step 2: Loading assigned sources...');
  const sourcesSnapshot = await db
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', AGENT_ID)
    .get();
  
  console.log(`   Found ${sourcesSnapshot.size} sources assigned to agent\n`);
  
  const sources = sourcesSnapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));
  
  // Step 3: Check which ones need indexing
  console.log('🔍 Step 3: Identifying sources without chunks...');
  
  let needsIndexing = 0;
  let alreadyIndexed = 0;
  
  for (const source of sources.slice(0, 50)) { // Check first 50 for speed
    const hasChunks = await hasChunksInBigQuery(source.id);
    if (hasChunks) {
      alreadyIndexed++;
    } else {
      needsIndexing++;
    }
  }
  
  console.log(`   Sample check (first 50):`);
  console.log(`   Already indexed: ${alreadyIndexed}`);
  console.log(`   Need indexing: ${needsIndexing}\n`);
  
  // Estimate total
  const estimatedNeedIndexing = Math.round((needsIndexing / 50) * sources.length);
  console.log(`   📊 Estimated total needing indexing: ~${estimatedNeedIndexing}/${sources.length}\n`);
  
  // Step 4: Process sources without chunks
  console.log('🔄 Step 4: Indexing sources without chunks...\n');
  console.log('   Note: This may take a while. Processing in batches...\n');
  
  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
    totalChunks: 0
  };
  
  for (let i = 0; i < sources.length; i++) {
    const result = await indexSource(sources[i], i, sources.length);
    
    if (result.status === 'success') {
      results.success++;
      results.totalChunks += result.chunks;
    } else if (result.status === 'skipped') {
      results.skipped++;
    } else if (result.status === 'error') {
      results.errors++;
    }
    
    // Progress update every 10 docs
    if ((i + 1) % 10 === 0) {
      console.log(`\n   📊 Progress: ${i + 1}/${sources.length} processed`);
      console.log(`      Success: ${results.success} | Skipped: ${results.skipped} | Errors: ${results.errors}`);
    }
  }
  
  // Final summary
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    INDEXING SUMMARY                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Results:`);
  console.log(`   Total sources processed: ${sources.length}`);
  console.log(`   ✅ Successfully indexed: ${results.success}`);
  console.log(`   ⏭️  Skipped (already indexed): ${results.skipped}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log(`   📦 Total chunks created: ${results.totalChunks.toLocaleString()}\n`);
  
  console.log(`✨ S2-v2 re-indexing complete!\n`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

