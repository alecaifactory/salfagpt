// Check if there are indexed chunks for RAG
import { firestore } from '../src/lib/firestore.js';

async function checkChunks() {
  console.log('🔍 Buscando chunks indexados...\n');

  const chunksSnapshot = await firestore
    .collection('document_chunks')
    .limit(5)
    .get();

  console.log('📊 Total chunks:', chunksSnapshot.size);
  console.log('');
  
  if (chunksSnapshot.size === 0) {
    console.log('⚠️  NO HAY CHUNKS INDEXADOS');
    console.log('');
    console.log('Esto significa que ningún documento ha sido procesado para RAG.');
    console.log('');
    console.log('✅ Para habilitar referencias:');
    console.log('  1. Sube un documento (PDF, Word, Excel)');
    console.log('  2. Espera a que termine el procesamiento');
    console.log('  3. Verifica que diga "RAG: Habilitado"');
    console.log('  4. Envía un mensaje nuevo');
    console.log('  5. Verás referencias con similitud y chunks!');
  } else {
    console.log('✅ HAY CHUNKS INDEXADOS - RAG puede generar referencias\n');
    
    chunksSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Chunk ${index + 1}:`);
      console.log('  Source ID:', data.sourceId);
      console.log('  Chunk #:', data.chunkIndex);
      console.log('  Has embedding:', !!data.embedding);
      console.log('  Embedding dimensions:', data.embedding?.length || 0);
      console.log('  Text preview:', data.text?.substring(0, 60) + '...');
      console.log('');
    });
    
    // Get source names
    const sourceIds = [...new Set(chunksSnapshot.docs.map(d => d.data().sourceId))];
    console.log(`📚 Chunks de ${sourceIds.size} fuentes diferentes`);
    console.log('');
    
    // Check each source
    for (const sourceId of sourceIds) {
      const sourceDoc = await firestore.collection('context_sources').doc(sourceId).get();
      if (sourceDoc.exists) {
        const sourceData = sourceDoc.data();
        console.log(`  ✓ ${sourceData.name} (${sourceId})`);
      }
    }
  }

  process.exit(0);
}

checkChunks().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

