import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const ADMIN_EMAIL = 'alec@getaifactory.com';
const BASE_URL = 'http://localhost:3000';

const firestore = new Firestore({
  projectId: PROJECT_ID
});

async function getAdminUserId() {
  console.log('🔍 Buscando userId de admin:', ADMIN_EMAIL);
  
  const users = await firestore.collection('users')
    .where('email', '==', ADMIN_EMAIL)
    .limit(1)
    .get();
  
  if (!users.empty) {
    const userId = users.docs[0].id;
    console.log('   ✅ Usuario encontrado:', userId);
    return userId;
  }
  
  // Try alternate ID format
  const userId = '114671162830729001607'; // Your known ID
  console.log('   ℹ️ Usando ID conocido:', userId);
  return userId;
}

async function reindexAgentDocs(agentId, agentTitle, userId) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔄 Re-indexando: ${agentTitle}`);
  console.log(`   Agent ID: ${agentId}`);
  console.log(`   User ID: ${userId}`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Find documents assigned to this agent
  const sources = await firestore.collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(`📄 Documentos asignados: ${sources.size}\n`);
  
  if (sources.empty) {
    console.log(`⚠️ No hay documentos asignados`);
    console.log(`   Este agente no mostrará referencias porque no tiene documentos\n`);
    return {
      agentId,
      agentTitle,
      documentsFound: 0,
      documentsReindexed: 0,
      documentsFailed: 0,
      results: []
    };
  }
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let totalChunksFiltered = 0;
  let totalChunksCreated = 0;
  
  let docIndex = 0;
  
  for (const sourceDoc of sources.docs) {
    docIndex++;
    const sourceId = sourceDoc.id;
    const sourceData = sourceDoc.data();
    
    console.log(`   [${docIndex}/${sources.size}] ${sourceData.name}`);
    console.log(`      ID: ${sourceId}`);
    
    if (!sourceData.extractedData) {
      console.log(`      ⚠️ Sin extractedData - saltando\n`);
      results.push({
        sourceId,
        sourceName: sourceData.name,
        success: false,
        error: 'No extracted data'
      });
      errorCount++;
      continue;
    }
    
    console.log(`      Tamaño: ${sourceData.extractedData.length.toLocaleString()} chars`);
    console.log(`      🔄 Re-indexando...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/context-sources/${sourceId}/enable-rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId, // ✅ Admin userId
          forceReindex: true,
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`      ❌ Error ${response.status}\n`);
        results.push({
          sourceId,
          sourceName: sourceData.name,
          success: false,
          error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`
        });
        errorCount++;
        continue;
      }
      
      const data = await response.json();
      
      const chunksFiltered = data.chunksFiltered || 0;
      const chunksTotal = data.chunksCount || 0;
      const chunksUseful = chunksTotal - chunksFiltered;
      const filterRate = chunksTotal > 0 ? ((chunksFiltered / chunksTotal) * 100).toFixed(1) : 0;
      
      totalChunksCreated += chunksTotal;
      totalChunksFiltered += chunksFiltered;
      
      console.log(`      ✅ Completado!`);
      console.log(`         📊 Chunks: ${chunksTotal}`);
      console.log(`         🗑️ Basura: ${chunksFiltered} (${filterRate}%)`);
      console.log(`         ✅ Útiles: ${chunksUseful} (${(100 - parseFloat(filterRate)).toFixed(1)}%)`);
      console.log(`         ⏱️ ${data.indexingTime || 'N/A'}ms\n`);
      
      results.push({
        sourceId,
        sourceName: sourceData.name,
        success: true,
        chunksCount: chunksTotal,
        chunksFiltered: chunksFiltered,
        chunksUseful: chunksUseful,
        indexingTime: data.indexingTime
      });
      
      successCount++;
      
    } catch (error) {
      console.log(`      ❌ Error: ${error.message}\n`);
      results.push({
        sourceId,
        sourceName: sourceData.name,
        success: false,
        error: error.message
      });
      errorCount++;
    }
  }
  
  return {
    agentId,
    agentTitle,
    documentsFound: sources.size,
    documentsReindexed: successCount,
    documentsFailed: errorCount,
    totalChunksCreated,
    totalChunksFiltered,
    totalChunksUseful: totalChunksCreated - totalChunksFiltered,
    results
  };
}

async function main() {
  console.log('🚀 Re-indexando S001 y M001 con userId de admin\n');
  console.log(`   Admin: ${ADMIN_EMAIL}`);
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Base URL: ${BASE_URL}\n`);
  
  // Get admin userId
  const userId = await getAdminUserId();
  console.log();
  
  // Find agents
  console.log('🔍 Buscando agentes S001 y M001...\n');
  
  const allConvs = await firestore.collection('conversations').get();
  
  const agents = [];
  
  allConvs.docs.forEach(doc => {
    const title = doc.data().title || '';
    
    if (title.includes('S001') || 
        title.includes('BODEGAS') ||
        title.toLowerCase().includes('gestion bodegas') ||
        title.includes('M001') ||
        title.includes('Legal Territorial') ||
        title.includes('RDI')) {
      
      agents.push({
        id: doc.id,
        title: title
      });
      
      console.log(`   ✅ ${title}`);
      console.log(`      ID: ${doc.id}\n`);
    }
  });
  
  if (agents.length === 0) {
    console.log('❌ No se encontraron agentes S001 o M001');
    process.exit(1);
  }
  
  console.log(`🎯 ${agents.length} agentes encontrados\n`);
  
  // Re-index each agent
  const allResults = [];
  
  for (const agent of agents) {
    const result = await reindexAgentDocs(agent.id, agent.title, userId);
    allResults.push(result);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 RE-INDEXING COMPLETO');
  console.log('='.repeat(70));
  console.log();
  
  console.log('📊 Resumen Global:\n');
  
  allResults.forEach(r => {
    console.log(`   ${r.agentTitle}:`);
    console.log(`      Documentos: ${r.documentsFound}`);
    console.log(`      Re-indexados: ${r.documentsReindexed}`);
    console.log(`      Errores: ${r.documentsFailed}`);
    
    if (r.totalChunksCreated > 0) {
      const filterRate = ((r.totalChunksFiltered / r.totalChunksCreated) * 100).toFixed(1);
      console.log(`      Total chunks: ${r.totalChunksCreated}`);
      console.log(`      Basura filtrada: ${r.totalChunksFiltered} (${filterRate}%)`);
      console.log(`      Chunks útiles: ${r.totalChunksUseful} (${(100 - parseFloat(filterRate)).toFixed(1)}%)`);
    }
    console.log();
  });
  
  const totalDocsProcessed = allResults.reduce((sum, r) => sum + r.documentsReindexed, 0);
  const totalChunksFiltered = allResults.reduce((sum, r) => sum + (r.totalChunksFiltered || 0), 0);
  const totalChunksCreated = allResults.reduce((sum, r) => sum + (r.totalChunksCreated || 0), 0);
  
  console.log('📈 Totales:');
  console.log(`   Documentos re-indexados: ${totalDocsProcessed}`);
  console.log(`   Chunks totales: ${totalChunksCreated}`);
  console.log(`   Basura eliminada: ${totalChunksFiltered}`);
  console.log(`   Mejora en calidad: ${totalChunksCreated > 0 ? ((totalChunksFiltered / totalChunksCreated) * 100).toFixed(1) : 0}% menos basura\n`);
  
  console.log('📝 Próximos pasos:');
  console.log('   1. Testing M1: "¿Qué es un OGUC?"');
  console.log('   2. Verificar fragmentos útiles (no "INTRODUCCIÓN...")');
  console.log('   3. Verificar referencias clickeables funcionan');
  console.log('   4. Reportar a Sebastian\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

