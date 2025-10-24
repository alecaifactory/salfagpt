import { firestore } from '../src/lib/firestore';

async function findSSOMAContent() {
  console.log('🔍 Searching SSOMA-P-004 chunks for "riesgo más grave"...\n');
  
  // Get all chunks for SSOMA-P-004
  const chunks = await firestore
    .collection('document_chunks')
    .where('sourceName', '==', 'SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO REV.2.PDF')
    .orderBy('chunkIndex', 'asc')
    .get();
  
  console.log(`📦 Total chunks: ${chunks.size}\n`);
  
  const searchTerms = [
    'riesgo más grave',
    'evento de riesgo',
    'Riesgos Críticos Operacionales',
    'Manual de Estándares SSOMA'
  ];
  
  const matchingChunks: number[] = [];
  const topRetrieved = [0, 51, 14, 48, 11, 5, 42, 17, 54, 26];
  
  chunks.docs.forEach(doc => {
    const data = doc.data() as any;
    const text = data.text || '';
    const chunkIndex = data.chunkIndex;
    
    const matches: string[] = [];
    searchTerms.forEach(term => {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        matches.push(term);
      }
    });
    
    if (matches.length > 0) {
      matchingChunks.push(chunkIndex);
      const wasRetrieved = topRetrieved.includes(chunkIndex);
      
      console.log(`${wasRetrieved ? '✅' : '⚠️ '} Chunk #${chunkIndex} ${wasRetrieved ? '(RETRIEVED)' : '(NOT retrieved)'}`);
      console.log(`   Terms: ${matches.join(', ')}`);
      console.log(`   Tokens: ${data.metadata?.tokenCount || 'N/A'}`);
      console.log(`   Preview: ${text.substring(0, 120)}...\n`);
    }
  });
  
  console.log(`\n📊 Analysis:`);
  console.log(`   Total chunks: ${chunks.size}`);
  console.log(`   Chunks with search terms: ${matchingChunks.length}`);
  console.log(`   Indices with content: ${matchingChunks.join(', ')}`);
  console.log(`\n🎯 RAG Retrieved (top 10): ${topRetrieved.join(', ')}`);
  
  const missing = matchingChunks.filter(c => !topRetrieved.includes(c));
  if (missing.length > 0) {
    console.log(`\n❌ MISSING from top 10: ${missing.join(', ')}`);
    console.log(`   These chunks have the content but weren't retrieved!`);
  } else {
    console.log(`\n✅ All content chunks were retrieved!`);
  }
  
  process.exit(0);
}

findSSOMAContent().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

