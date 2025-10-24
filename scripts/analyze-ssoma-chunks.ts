import { firestore } from '../src/lib/firestore';

async function analyzeChunks() {
  console.log('🔍 Analizando chunks de SSOMA-P-004...\n');
  
  // Get the most recent SSOMA source
  const sources = await firestore
    .collection('context_sources')
    .where('name', '==', 'SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO REV.2.PDF')
    .get();
  
  console.log(`📄 Found ${sources.size} SSOMA sources\n`);
  
  // Use the most recent one
  let newestSource: any = null;
  let newestTime = 0;
  
  sources.docs.forEach(doc => {
    const data = doc.data();
    const addedAt = data.addedAt?.toDate?.()?.getTime() || 0;
    if (addedAt > newestTime) {
      newestTime = addedAt;
      newestSource = { id: doc.id, ...data };
    }
  });
  
  if (!newestSource) {
    console.log('❌ No SSOMA source found');
    process.exit(1);
  }
  
  console.log('📄 Analyzing newest source:');
  console.log(`   ID: ${newestSource.id}`);
  console.log(`   Added: ${new Date(newestTime).toLocaleString()}`);
  console.log(`   RAG Enabled: ${newestSource.ragEnabled}`);
  console.log(`   Chunks: ${newestSource.ragMetadata?.totalChunks || 0}\n`);
  
  // Get all chunks
  const chunks = await firestore
    .collection('document_chunks')
    .where('sourceId', '==', newestSource.id)
    .get();
  
  console.log(`📦 Total chunks in DB: ${chunks.size}\n`);
  
  // Search for target content
  const searchTerms = {
    'riesgo más grave': 0,
    'evento de riesgo': 0,
    'Riesgos Críticos Operacionales': 0,
    'Manual de Estándares SSOMA': 0,
    'SSOMA-ME': 0,
    'todos los Peligros': 0,
  };
  
  const topRetrieved = [29, 0, 71, 48, 49, 10, 27, 19, 14, 70]; // From logs
  const matchingChunks: any[] = [];
  
  chunks.docs.forEach(doc => {
    const data = doc.data() as any;
    const text = data.text || '';
    const idx = data.chunkIndex;
    
    let matches: string[] = [];
    Object.keys(searchTerms).forEach(term => {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        matches.push(term);
        searchTerms[term as keyof typeof searchTerms]++;
      }
    });
    
    if (matches.length > 0) {
      const wasRetrieved = topRetrieved.includes(idx);
      matchingChunks.push({
        index: idx,
        matches,
        retrieved: wasRetrieved,
        tokenCount: data.metadata?.tokenCount || 0,
        preview: text.substring(0, 200)
      });
    }
  });
  
  // Sort by chunk index
  matchingChunks.sort((a, b) => a.index - b.index);
  
  console.log('🎯 Chunks with search terms:\n');
  matchingChunks.forEach(chunk => {
    const symbol = chunk.retrieved ? '✅' : '❌';
    console.log(`${symbol} Chunk #${chunk.index} ${chunk.retrieved ? '(RETRIEVED)' : '(MISSED)'}`);
    console.log(`   Terms: ${chunk.matches.join(', ')}`);
    console.log(`   Tokens: ${chunk.tokenCount}`);
    console.log(`   Preview: ${chunk.preview}...\n`);
  });
  
  console.log('\n📊 Summary:');
  console.log(`   Total chunks: ${chunks.size}`);
  console.log(`   Chunks with search terms: ${matchingChunks.length}`);
  console.log(`   Retrieved in top 10: ${matchingChunks.filter(c => c.retrieved).length}`);
  console.log(`   Missed: ${matchingChunks.filter(c => !c.retrieved).length}`);
  
  console.log('\n📈 Term distribution:');
  Object.entries(searchTerms).forEach(([term, count]) => {
    console.log(`   "${term}": ${count} chunks`);
  });
  
  const missedChunks = matchingChunks.filter(c => !c.retrieved);
  if (missedChunks.length > 0) {
    console.log('\n❌ MISSED chunks with content:');
    missedChunks.forEach(c => {
      console.log(`   Chunk #${c.index}: ${c.matches.join(', ')}`);
    });
  }
  
  console.log('\n🎯 Top 10 retrieved: ', topRetrieved.join(', '));
  console.log('   Chunk indices with matches: ', matchingChunks.map(c => c.index).join(', '));
  
  process.exit(0);
}

analyzeChunks().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

