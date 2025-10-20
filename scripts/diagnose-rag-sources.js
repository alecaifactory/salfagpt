// Diagnose RAG state for all context sources
import { firestore } from '../src/lib/firestore.js';

async function diagnoseRAGSources() {
  console.log('🔍 Diagnosticando estado RAG de todas las fuentes...\n');

  // Get all context sources
  const sourcesSnapshot = await firestore
    .collection('context_sources')
    .limit(50)
    .get();

  console.log(`📊 Total fuentes encontradas: ${sourcesSnapshot.size}\n`);

  let sourcesWithRAGFlag = 0;
  let sourcesWithChunks = 0;
  let sourcesInconsistent = 0;

  for (const sourceDoc of sourcesSnapshot.docs) {
    const sourceData = sourceDoc.data();
    const sourceName = sourceData.name || 'Unknown';
    const ragEnabled = sourceData.ragEnabled || false;
    
    // Check if chunks exist
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceDoc.id)
      .limit(1)
      .get();
    
    const hasChunks = chunksSnapshot.size > 0;
    
    // Check for inconsistency
    const isInconsistent = (ragEnabled && !hasChunks) || (!ragEnabled && hasChunks);
    
    if (ragEnabled) sourcesWithRAGFlag++;
    if (hasChunks) sourcesWithChunks++;
    if (isInconsistent) sourcesInconsistent++;
    
    const status = 
      ragEnabled && hasChunks ? '✅ OK' :
      !ragEnabled && !hasChunks ? '⚪ Sin RAG' :
      ragEnabled && !hasChunks ? '❌ INCONSISTENTE (flag ON, sin chunks)' :
      '⚠️  INCONSISTENTE (chunks existen, flag OFF)';
    
    console.log(`${status} ${sourceName}`);
    console.log(`  ID: ${sourceDoc.id}`);
    console.log(`  ragEnabled: ${ragEnabled}`);
    console.log(`  Has chunks: ${hasChunks}`);
    
    if (hasChunks) {
      const allChunks = await firestore
        .collection('document_chunks')
        .where('sourceId', '==', sourceDoc.id)
        .get();
      console.log(`  Chunks count: ${allChunks.size}`);
      
      if (allChunks.size > 0) {
        const firstChunk = allChunks.docs[0].data();
        console.log(`  Has embeddings: ${!!firstChunk.embedding}`);
        console.log(`  Embedding dimensions: ${firstChunk.embedding?.length || 0}`);
      }
    }
    
    if (isInconsistent) {
      console.log(`  🔧 ACCIÓN REQUERIDA:`);
      if (ragEnabled && !hasChunks) {
        console.log(`     - Marcar ragEnabled = false (no hay chunks)`);
        console.log(`     - O hacer chunking/embedding`);
      } else {
        console.log(`     - Marcar ragEnabled = true (chunks existen)`);
      }
    }
    
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📈 Resumen:`);
  console.log(`   Total fuentes: ${sourcesSnapshot.size}`);
  console.log(`   Con ragEnabled=true: ${sourcesWithRAGFlag}`);
  console.log(`   Con chunks en DB: ${sourcesWithChunks}`);
  console.log(`   Inconsistentes: ${sourcesInconsistent}`);
  console.log('');

  if (sourcesInconsistent > 0) {
    console.log('⚠️  Hay fuentes inconsistentes que necesitan corrección');
    console.log('');
    console.log('Opciones:');
    console.log('  1. Re-indexar manualmente cada fuente');
    console.log('  2. Ejecutar script de auto-corrección (próximamente)');
  }

  process.exit(0);
}

diagnoseRAGSources().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

