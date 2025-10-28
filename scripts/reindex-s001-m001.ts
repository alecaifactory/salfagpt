/**
 * Re-index documents for S001 and M001 agents
 * Applies new garbage chunk filter
 */

const BASE_URL = 'http://localhost:3000';

const AGENTS = [
  {
    name: 'GESTION BODEGAS GPT (S001)',
    searchTitle: 'GESTION BODEGAS GPT (S001)',
  },
  {
    name: 'Asistente Legal Territorial RDI (M001)',
    searchTitle: 'Asistente Legal Territorial RDI (M001)',
  }
];

async function findAgentId(title: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/conversations?userId=114671162830729001607`);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch conversations');
      return null;
    }
    
    const data = await response.json();
    
    // Search in all groups
    for (const group of data.groups || []) {
      for (const conv of group.conversations || []) {
        if (conv.title === title || conv.title?.includes(title.split(' ')[0])) {
          return conv.id;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding agent:', error);
    return null;
  }
}

async function reindexAgent(agentName: string, agentId: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Re-indexando: ${agentName}`);
  console.log(`   ID: ${agentId}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reindex-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId,
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status}: ${errorText}\n`);
      return { success: false, error: errorText };
    }
    
    const data = await response.json();
    
    console.log(`✅ Re-indexing completo!`);
    console.log(`   Documentos encontrados: ${data.documentsFound || 0}`);
    console.log(`   Documentos re-indexados: ${data.documentsReindexed || 0}`);
    console.log(`   Documentos con error: ${data.documentsFailed || 0}\n`);
    
    if (data.results && data.results.length > 0) {
      console.log(`📊 Detalle por documento:\n`);
      data.results.forEach((result: any) => {
        if (result.success) {
          console.log(`   ✅ ${result.sourceName}`);
          console.log(`      Chunks: ${result.chunksCount || 'N/A'}`);
          console.log(`      Basura filtrada: ${result.chunksFiltered || 0}`);
          console.log(`      Útiles: ${(result.chunksCount || 0) - (result.chunksFiltered || 0)}`);
        } else {
          console.log(`   ❌ ${result.sourceName}`);
          console.log(`      Error: ${result.error}`);
        }
        console.log();
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Re-indexando documentos de S001 y M001...\n');
  console.log('   Aplicando filtro de basura (garbage chunks)');
  console.log('   Base URL:', BASE_URL);
  console.log();
  
  const results = [];
  
  for (const agent of AGENTS) {
    // Find agent ID
    console.log(`🔍 Buscando agente: ${agent.name}...`);
    const agentId = await findAgentId(agent.searchTitle);
    
    if (!agentId) {
      console.log(`   ❌ No encontrado\n`);
      results.push({
        agent: agent.name,
        success: false,
        error: 'Agent not found'
      });
      continue;
    }
    
    console.log(`   ✅ Encontrado: ${agentId}\n`);
    
    // Re-index
    const result = await reindexAgent(agent.name, agentId);
    results.push({
      agent: agent.name,
      agentId,
      ...result
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 PROCESO COMPLETO');
  console.log('='.repeat(60));
  console.log();
  
  console.log('📊 Resumen:\n');
  results.forEach(r => {
    if (r.success) {
      console.log(`   ✅ ${r.agent}`);
      console.log(`      Docs re-indexados: ${r.documentsReindexed || 0}`);
    } else {
      console.log(`   ❌ ${r.agent}`);
      console.log(`      Error: ${r.error}`);
    }
    console.log();
  });
  
  console.log('📝 Próximos pasos:');
  console.log('   1. Probar en M1: "¿Qué es un OGUC?"');
  console.log('   2. Verificar fragmentos útiles (no basura)');
  console.log('   3. Probar en S1 (si tiene docs asignados)');
  console.log('   4. Reportar a Sebastian para testing\n');
}

main();

