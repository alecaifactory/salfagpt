import { firestore } from '../src/lib/firestore';

async function check() {
  const chunks = await firestore
    .collection('document_chunks')
    .where('sourceId', '==', 'PkCTQ9dpkcOEAmqZTFjc')
    .get();
  
  console.log('📦 Chunks para Cir32.pdf:', chunks.size);
  
  if (chunks.size > 0) {
    const first = chunks.docs[0].data();
    console.log('✅ Sample chunk:');
    console.log('  - sourceId:', first.sourceId);
    console.log('  - chunkIndex:', first.chunkIndex);
    console.log('  - text length:', first.text?.length || 0);
    console.log('  - embedding dims:', first.embedding?.length || 0);
    console.log('  - tokenCount:', first.metadata?.tokenCount);
  }
  
  process.exit(0);
}
check();

