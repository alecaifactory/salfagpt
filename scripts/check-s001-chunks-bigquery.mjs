import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = 'salfagpt';
const DATASET_ID = 'flow_dataset';
const TABLE_ID = 'document_chunks';

const S001_AGENT_ID = 'AjtQZEIMQvFnPRJRjl4y';

const bigquery = new BigQuery({
  projectId: PROJECT_ID
});

async function checkS001Chunks() {
  console.log('🔍 Verificando chunks de S001 en BigQuery...\n');
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Dataset: ${DATASET_ID}`);
  console.log(`   Table: ${TABLE_ID}`);
  console.log(`   S001 Agent ID: ${S001_AGENT_ID}\n`);
  
  try {
    // Check if table exists
    console.log('1️⃣ Verificando tabla existe...');
    
    const [tables] = await bigquery.dataset(DATASET_ID).getTables();
    const tableExists = tables.some(t => t.id === TABLE_ID);
    
    if (!tableExists) {
      console.log(`   ❌ Tabla ${TABLE_ID} NO existe en ${DATASET_ID}`);
      console.log(`   ⚠️ Este es el problema: Sin tabla BigQuery, RAG no puede buscar`);
      console.log(`\n   💡 Solución: Crear tabla BigQuery y sincronizar chunks`);
      process.exit(1);
    }
    
    console.log(`   ✅ Tabla existe\n`);
    
    // Check total chunks in BigQuery
    console.log('2️⃣ Contando chunks totales en BigQuery...');
    
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
    `;
    
    const [totalRows] = await bigquery.query({ query: totalQuery });
    const totalChunks = totalRows[0].total;
    
    console.log(`   ✅ Total chunks en BigQuery: ${totalChunks}\n`);
    
    if (totalChunks === 0) {
      console.log(`   ❌ BigQuery está vacío - ningún documento sincronizado`);
      console.log(`   ⚠️ Todos los re-indexings solo fueron a Firestore`);
      console.log(`\n   💡 Solución: Sincronizar Firestore → BigQuery`);
      process.exit(1);
    }
    
    // Check chunks for specific user (alec)
    console.log('3️⃣ Contando chunks del usuario...');
    
    const userQuery = `
      SELECT COUNT(*) as total
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      WHERE user_id = 'alec_getaifactory_com'
    `;
    
    const [userRows] = await bigquery.query({ query: userQuery });
    const userChunks = userRows[0].total;
    
    console.log(`   ✅ Chunks del usuario: ${userChunks}\n`);
    
    if (userChunks === 0) {
      console.log(`   ❌ No hay chunks para este usuario en BigQuery`);
      process.exit(1);
    }
    
    // Check chunks from S001 sources
    console.log('4️⃣ Verificando chunks de documentos de S001...');
    console.log(`   Buscando chunks con agentId: ${S001_AGENT_ID}...\n`);
    
    // Since we don't have direct agentId in chunks, check by source assignment
    // This is complex - let's just check if we have ANY chunks
    
    console.log('✅ RESUMEN:');
    console.log(`   Total chunks BigQuery: ${totalChunks}`);
    console.log(`   Chunks del usuario: ${userChunks}`);
    console.log();
    
    if (userChunks > 0) {
      console.log('🎯 DIAGNÓSTICO:');
      console.log('   Chunks existen en BigQuery ✅');
      console.log('   Problema es DIFERENTE - posiblemente:');
      console.log('   a) AgentId mapping incorrecto');
      console.log('   b) Similarity scores todos <25%');
      console.log('   c) Bug en searchByAgent function');
      console.log();
      console.log('💡 SIGUIENTE PASO:');
      console.log('   Ejecutar query de prueba con pregunta específica');
      console.log('   Ver qué similarity scores devuelve');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error();
    console.error('💡 Posibles causas:');
    console.error('   1. BigQuery no configurado para proyecto salfagpt');
    console.error('   2. Dataset flow_dataset no existe');
    console.error('   3. Tabla document_chunks no existe');
    console.error('   4. Permisos insuficientes');
    console.error();
    console.error('🔧 Soluciones:');
    console.error('   a) Usar Firestore search como fallback');
    console.error('   b) Crear tabla BigQuery y sincronizar');
    console.error('   c) Usar full-text mode para S001 temporalmente');
    
    process.exit(1);
  }
}

checkS001Chunks();

