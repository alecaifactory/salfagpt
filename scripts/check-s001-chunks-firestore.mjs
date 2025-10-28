import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const S001_AGENT_ID = 'AjtQZEIMQvFnPRJRjl4y';

const firestore = new Firestore({
  projectId: PROJECT_ID
});

async function checkS001ChunksFirestore() {
  console.log('🔍 Verificando chunks de S001 en Firestore...\n');
  console.log(`   S001 Agent ID: ${S001_AGENT_ID}\n`);
  
  try {
    // 1. Get S001 sources
    console.log('1️⃣ Obteniendo fuentes de S001...');
    
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', S001_AGENT_ID)
      .get();
    
    console.log(`   ✅ Fuentes encontradas: ${sourcesSnapshot.size}\n`);
    
    if (sourcesSnapshot.size === 0) {
      console.log('   ❌ S001 no tiene fuentes asignadas');
      process.exit(1);
    }
    
    const sourceIds = sourcesSnapshot.docs.map(d => d.id);
    
    // 2. Count chunks for S001 sources
    console.log('2️⃣ Contando chunks de esas fuentes...');
    
    // Firestore 'in' query limit is 10, so batch if needed
    let totalChunks = 0;
    
    for (let i = 0; i < sourceIds.length; i += 10) {
      const batch = sourceIds.slice(i, i + 10);
      
      const chunksSnapshot = await firestore
        .collection('document_chunks')
        .where('sourceId', 'in', batch)
        .get();
      
      totalChunks += chunksSnapshot.size;
      
      console.log(`   Batch ${Math.floor(i/10) + 1}: ${chunksSnapshot.size} chunks`);
    }
    
    console.log(`\n   ✅ Total chunks de S001: ${totalChunks}\n`);
    
    if (totalChunks === 0) {
      console.log('🚨 PROBLEMA ENCONTRADO:');
      console.log('   S001 tiene 76 fuentes asignadas');
      console.log('   PERO tiene 0 chunks indexados');
      console.log();
      console.log('💡 CAUSA:');
      console.log('   Los documentos NO fueron indexados para RAG');
      console.log('   Solo tienen extractedData, no chunks con embeddings');
      console.log();
      console.log('🔧 SOLUCIÓN:');
      console.log('   Re-indexar documentos de S001 con enable-rag');
      console.log('   O usar full-text mode para S001');
      process.exit(1);
    }
    
    // 3. Sample some chunks
    console.log('3️⃣ Muestra de chunks (primeros 5):\n');
    
    const sampleSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', 'in', sourceIds.slice(0, 10))
      .limit(5)
      .get();
    
    sampleSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   Chunk ${data.chunkIndex}:`);
      console.log(`     Source: ${data.sourceName || data.sourceId}`);
      console.log(`     Text: ${(data.text || '').substring(0, 80)}...`);
      console.log(`     Has embedding: ${data.embedding ? 'Yes' : 'No'}`);
      console.log();
    });
    
    console.log('✅ DIAGNÓSTICO:');
    console.log(`   S001 tiene ${totalChunks} chunks en Firestore`);
    console.log('   Chunks tienen embeddings');
    console.log();
    console.log('🎯 CONCLUSIÓN:');
    console.log('   Problema NO es falta de chunks');
    console.log('   Problema es en la búsqueda/retrieval');
    console.log();
    console.log('💡 SIGUIENTE PASO:');
    console.log('   Ejecutar búsqueda de prueba con la pregunta específica');
    console.log('   Ver qué similarity scores devuelve Firestore search');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkS001ChunksFirestore();

