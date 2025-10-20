import { firestore } from '../src/lib/firestore';

async function audit() {
  console.log('🔍 Auditando TODOS los documentos CLI\n');
  
  const sources = await firestore
    .collection('context_sources')
    .where('metadata.uploadedVia', '==', 'cli')
    .get();
  
  console.log(`📊 Total documentos CLI: ${sources.size}\n`);
  
  let ready = 0;
  let notReady = 0;
  const needsReprocessing: string[] = [];
  
  for (const doc of sources.docs) {
    const data = doc.data();
    const docId = doc.id;
    const name = data.name;
    
    // Check if has chunks
    const chunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', docId)
      .get();
    
    const hasChunks = chunks.size > 0;
    const ragEnabled = data.ragEnabled === true;
    const ragEmbeddings = data.metadata?.ragEmbeddings || 0;
    
    if (hasChunks && ragEnabled && ragEmbeddings > 0) {
      console.log(`✅ ${name}`);
      console.log(`   ID: ${docId}`);
      console.log(`   Chunks: ${chunks.size}, ragEnabled: true, ragEmbeddings: ${ragEmbeddings}`);
      ready++;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   ID: ${docId}`);
      console.log(`   Chunks: ${chunks.size}, ragEnabled: ${ragEnabled}, ragEmbeddings: ${ragEmbeddings}`);
      console.log(`   → Necesita re-procesamiento`);
      notReady++;
      needsReprocessing.push(docId);
    }
    console.log('');
  }
  
  console.log('\n📊 RESUMEN');
  console.log('==========');
  console.log(`✅ Listos: ${ready}`);
  console.log(`❌ No listos: ${notReady}`);
  
  if (needsReprocessing.length > 0) {
    console.log('\n💡 Documentos que necesitan re-procesamiento:');
    needsReprocessing.forEach(id => {
      console.log(`   npx tsx scripts/reprocess-embeddings.ts --source-id=${id}`);
    });
    
    console.log('\n💡 O ejecuta batch:');
    console.log('   npx tsx scripts/batch-reprocess-all-embeddings.ts');
  }
  
  process.exit(0);
}

audit();

