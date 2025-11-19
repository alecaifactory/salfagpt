import { firestore } from '../src/lib/firestore';

async function main() {
  const sourceId = 'lq4azuIAE6lCRTxSbOEW';
  
  console.log(`\nChecking embeddings for: ${sourceId}\n`);
  
  // Check document_embeddings
  const embeddings = await firestore
    .collection('document_embeddings')
    .where('sourceId', '==', sourceId)
    .get();
  
  console.log(`📊 document_embeddings: ${embeddings.size} docs`);
  
  // Check document_chunks
  const chunks = await firestore
    .collection('document_chunks')
    .where('sourceId', '==', sourceId)
    .get();
  
  console.log(`📦 document_chunks: ${chunks.size} docs\n`);
  
  if (embeddings.size > 0) {
    const sample = embeddings.docs[0].data();
    console.log('✅ document_embeddings sample:');
    console.log(`  Text preview: "${sample.text?.substring(0, 100)}..."`);
    console.log(`  Vector dimensions: ${sample.embedding?.length}`);
    console.log(`  Agent ID: ${sample.agentId}`);
    console.log(`  User ID: ${sample.userId}`);
  }
  
  if (chunks.size > 0) {
    const sample = chunks.docs[0].data();
    console.log('\n✅ document_chunks sample:');
    console.log(`  Text preview: "${sample.text?.substring(0, 100)}..."`);
    console.log(`  Vector dimensions: ${sample.embedding?.length}`);
    console.log(`  Agent ID: ${sample.agentId}`);
    console.log(`  User ID: ${sample.userId}`);
  }
  
  if (embeddings.size === 0 && chunks.size === 0) {
    console.log('❌ No embeddings OR chunks found!');
    console.log('\nThis could mean:');
    console.log('1. Embeddings are still being written (wait a few seconds)');
    console.log('2. RAG processing failed silently');
    console.log('3. Wrong sourceId');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

