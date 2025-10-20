import { firestore } from '../src/lib/firestore';

async function check() {
  const docId = 'QLkYR6DClmOJY1tQkjBc'; // Cir-231.pdf from screenshot
  
  console.log('🔍 Verificando documento:', docId);
  console.log('Archivo: Cir-231.pdf\n');
  
  // 1. Check context_sources
  const sourceDoc = await firestore.collection('context_sources').doc(docId).get();
  
  if (sourceDoc.exists) {
    const data = sourceDoc.data();
    console.log('📄 Context Source:');
    console.log('  name:', data?.name);
    console.log('  ragEnabled:', data?.ragEnabled);
    console.log('  ragChunks:', data?.metadata?.ragChunks);
    console.log('  ragEmbeddings:', data?.metadata?.ragEmbeddings);
    console.log('  ragProcessedAt:', data?.metadata?.ragProcessedAt);
    console.log('');
  }
  
  // 2. Check document_chunks
  const chunksSnapshot = await firestore
    .collection('document_chunks')
    .where('sourceId', '==', docId)
    .get();
  
  console.log('📦 Document Chunks:');
  console.log('  Total chunks:', chunksSnapshot.size);
  
  if (chunksSnapshot.size > 0) {
    const firstChunk = chunksSnapshot.docs[0].data();
    console.log('  ✅ Chunk 1:');
    console.log('    - sourceId:', firstChunk.sourceId);
    console.log('    - chunkIndex:', firstChunk.chunkIndex);
    console.log('    - text length:', firstChunk.text?.length);
    console.log('    - embedding dims:', firstChunk.embedding?.length);
    console.log('    - tokenCount:', firstChunk.metadata?.tokenCount);
  } else {
    console.log('  ❌ No hay chunks guardados');
  }
  
  console.log('');
  console.log('💡 Para que aparezca como indexado en UI:');
  console.log('   1. ragEnabled debe ser true');
  console.log('   2. metadata.ragEmbeddings debe ser > 0');
  console.log('   3. Debe haber chunks en document_chunks collection');
  
  process.exit(0);
}

check();

