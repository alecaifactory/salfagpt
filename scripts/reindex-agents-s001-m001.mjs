import { Firestore } from '@google-cloud/firestore';
import { execSync } from 'child_process';
import path from 'path';

const firestore = new Firestore({
  projectId: 'gen-lang-client-0986191192'
});

const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  CONTEXT_SOURCES: 'context_sources',
};

/**
 * Re-index documents for S001 and M001 agents
 * Applies new garbage chunk filter
 */

async function reindexAgents() {
  console.log('🔄 Re-indexando documentos para S001 y M001...\n');
  
  try {
    // 1. Find agents S001 and M001
    const agents = await firestore.collection(COLLECTIONS.CONVERSATIONS)
      .where('title', 'in', [
        'GESTION BODEGAS GPT (S001)',
        'Asistente Legal Territorial RDI (M001)'
      ])
      .get();
    
    if (agents.empty) {
      console.log('⚠️ No se encontraron los agentes S001 o M001');
      console.log('   Buscando por patrón...\n');
      
      const allConvs = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
      const matches = allConvs.docs.filter(doc => {
        const title = doc.data().title || '';
        return title.includes('S001') || 
               title.includes('M001') || 
               title.includes('BODEGAS') ||
               title.includes('Legal Territorial');
      });
      
      if (matches.length > 0) {
        console.log('📝 Agentes encontrados:');
        matches.forEach(doc => {
          console.log(`   - ${doc.data().title} (ID: ${doc.id})`);
        });
        console.log();
      } else {
        console.log('❌ No se encontraron agentes similares');
        process.exit(1);
      }
    }
    
    const agentsList = agents.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      userId: doc.data().userId
    }));
    
    console.log(`✅ Encontrados ${agentsList.length} agentes:\n`);
    agentsList.forEach(agent => {
      console.log(`   📌 ${agent.title}`);
      console.log(`      ID: ${agent.id}\n`);
    });
    
    // 2. For each agent, find and re-index their documents
    for (const agent of agentsList) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Procesando: ${agent.title}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Find documents assigned to this agent
      const sources = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('assignedToAgents', 'array-contains', agent.id)
        .get();
      
      if (sources.empty) {
        console.log(`⚠️ No hay documentos asignados a ${agent.title}`);
        console.log(`   Nota: Esto explica por qué no muestra referencias\n`);
        continue;
      }
      
      console.log(`📄 Documentos encontrados: ${sources.size}\n`);
      
      // Re-index each document
      for (const sourceDoc of sources.docs) {
        const sourceId = sourceDoc.id;
        const sourceData = sourceDoc.data();
        
        console.log(`   📄 ${sourceData.name}`);
        console.log(`      ID: ${sourceId}`);
        console.log(`      Tipo: ${sourceData.type}`);
        console.log(`      Tamaño: ${(sourceData.extractedData?.length || 0).toLocaleString()} chars`);
        
        // Check if has extracted data
        if (!sourceData.extractedData) {
          console.log(`      ⚠️ No tiene extractedData - saltando\n`);
          continue;
        }
        
        // Re-index via API
        try {
          console.log(`      🔄 Re-indexando...`);
          
          const response = await fetch('http://localhost:3000/api/context-sources/' + sourceId + '/enable-rag', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              forceReindex: true, // Force re-index even if already indexed
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`      ❌ Error ${response.status}: ${errorText}\n`);
            continue;
          }
          
          const data = await response.json();
          
          console.log(`      ✅ Re-indexado exitosamente!`);
          console.log(`         Chunks creados: ${data.chunksCount || 'N/A'}`);
          console.log(`         Chunks filtrados: ${data.chunksFiltered || 0} (basura)`);
          console.log(`         Chunks útiles: ${(data.chunksCount || 0) - (data.chunksFiltered || 0)}`);
          console.log(`         Tiempo: ${data.indexingTime || 'N/A'}ms\n`);
          
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}\n`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Re-indexing completo!');
    console.log('='.repeat(60));
    console.log();
    console.log('📊 Próximos pasos:');
    console.log('   1. Probar pregunta en M1: "¿Qué es un OGUC?"');
    console.log('   2. Verificar fragmentos son útiles (no "INTRODUCCIÓN...")');
    console.log('   3. Probar pregunta en S1 (si tiene docs)');
    console.log('   4. Reportar resultados\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

reindexAgents();

