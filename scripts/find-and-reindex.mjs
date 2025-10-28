import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';

const firestore = new Firestore({
  projectId: PROJECT_ID
});

async function findAndReindexAgents() {
  console.log('🔍 Buscando agentes S001 y M001...\n');
  
  try {
    // Get ALL conversations
    const allConvs = await firestore.collection('conversations').get();
    
    console.log(`📋 Total conversations: ${allConvs.size}`);
    console.log('\n🔎 Buscando S001 y M001...\n');
    
    const targetAgents = [];
    
    allConvs.docs.forEach(doc => {
      const title = doc.data().title || '';
      
      // Look for S001 or M001 patterns
      if (title.includes('S001') || 
          title.includes('BODEGAS') ||
          title.toLowerCase().includes('gestion') ||
          title.includes('M001') ||
          title.includes('Legal') ||
          title.includes('Territorial')) {
        
        targetAgents.push({
          id: doc.id,
          title: title,
          userId: doc.data().userId
        });
        
        console.log(`✅ Encontrado: ${title}`);
        console.log(`   ID: ${doc.id}\n`);
      }
    });
    
    if (targetAgents.length === 0) {
      console.log('❌ No se encontraron agentes S001 o M001');
      console.log('\n📝 Todas las conversaciones disponibles:');
      allConvs.docs.slice(0, 20).forEach(doc => {
        console.log(`   - ${doc.data().title || 'Untitled'} (${doc.id})`);
      });
      process.exit(1);
    }
    
    console.log(`\n🎯 ${targetAgents.length} agentes objetivo encontrados\n`);
    
    // Now re-index each one
    for (const agent of targetAgents) {
      console.log(`${'='.repeat(70)}`);
      console.log(`🔄 Procesando: ${agent.title}`);
      console.log(`${'='.repeat(70)}\n`);
      
      // Find documents assigned to this agent
      const sources = await firestore.collection('context_sources')
        .where('assignedToAgents', 'array-contains', agent.id)
        .get();
      
      console.log(`📄 Documentos asignados: ${sources.size}`);
      
      if (sources.empty) {
        console.log(`⚠️ No hay documentos asignados a este agente`);
        console.log(`   Esto explica por qué no muestra referencias\n`);
        continue;
      }
      
      console.log();
      
      // Re-index each document
      for (const sourceDoc of sources.docs) {
        const sourceId = sourceDoc.id;
        const sourceData = sourceDoc.data();
        
        console.log(`   📄 ${sourceData.name}`);
        console.log(`      ID: ${sourceId}`);
        
        if (!sourceData.extractedData) {
          console.log(`      ⚠️ No extractedData - saltando\n`);
          continue;
        }
        
        console.log(`      Tamaño: ${sourceData.extractedData.length.toLocaleString()} chars`);
        
        // Call re-index API
        try {
          console.log(`      🔄 Re-indexando...`);
          
          const response = await fetch('http://localhost:3000/api/context-sources/' + sourceId + '/enable-rag', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              forceReindex: true,
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`      ❌ Error ${response.status}: ${errorText.substring(0, 100)}\n`);
            continue;
          }
          
          const data = await response.json();
          
          const chunksFiltered = data.chunksFiltered || 0;
          const chunksTotal = data.chunksCount || 0;
          const chunksUseful = chunksTotal - chunksFiltered;
          const filterRate = chunksTotal > 0 ? ((chunksFiltered / chunksTotal) * 100).toFixed(1) : 0;
          
          console.log(`      ✅ Re-indexado!`);
          console.log(`         📊 Chunks totales: ${chunksTotal}`);
          console.log(`         🗑️ Basura filtrada: ${chunksFiltered} (${filterRate}%)`);
          console.log(`         ✅ Útiles: ${chunksUseful} (${(100 - filterRate).toFixed(1)}%)`);
          console.log(`         ⏱️ Tiempo: ${data.indexingTime || 'N/A'}ms\n`);
          
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}\n`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 RE-INDEXING COMPLETO');
    console.log('='.repeat(70));
    console.log();
    
    console.log('📊 Resumen:');
    console.log(`   Agentes procesados: ${targetAgents.length}`);
    console.log();
    
    console.log('📝 Próximos pasos:');
    console.log('   1. Testing en M1: "¿Qué es un OGUC?"');
    console.log('   2. Verificar fragmentos útiles (no "INTRODUCCIÓN...")');
    console.log('   3. Testing en S1 (si tiene docs)');
    console.log('   4. Reportar resultados a Sebastian\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

findAndReindexAgents();

