import { firestore } from '../src/lib/firestore';

async function check() {
  const snapshot = await firestore
    .collection('context_sources')
    .where('metadata.uploadedVia', '==', 'cli')
    .get();

  console.log('📊 Documentos CLI:', snapshot.size);

  let needsReprocessing = 0;
  const docsToProcess: string[] = [];
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const ragEmbeddings = data.metadata?.ragEmbeddings || 0;
    
    if (ragEmbeddings === 0) {
      console.log('⚠️  Sin embeddings:', data.name, '(ID:', doc.id + ')');
      needsReprocessing++;
      docsToProcess.push(doc.id);
    }
  });

  console.log('\n📊 Total sin embeddings:', needsReprocessing);
  
  if (needsReprocessing > 0) {
    console.log('\n💡 Para re-procesar, ejecuta:');
    docsToProcess.forEach(id => {
      console.log(`   npx tsx scripts/reprocess-embeddings.ts --source-id=${id}`);
    });
  }
  
  process.exit(0);
}

check();

