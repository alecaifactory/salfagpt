import { firestore } from '../src/lib/firestore.js';

const AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye'; // S1-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

const TEST_QUERIES = [
  {
    id: 1,
    query: 'Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C',
    expectedResult: 'Debería encontrar información sobre filtros de grúa Sany'
  },
  {
    id: 2,
    query: 'Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados',
    expectedResult: 'Debería encontrar información sobre frenos desgastados'
  },
  {
    id: 3,
    query: 'Cuanto torque se le debe suminstrar a las ruedas del camion tolva 10163090 TCBY-56 y cual es el procedimiento correcto',
    expectedResult: 'Debería encontrar especificaciones de torque'
  },
  {
    id: 4,
    query: 'Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450 B 6x4',
    expectedResult: 'Debería encontrar información sobre cambio de aceite hidráulico'
  }
];

interface TestResult {
  queryId: number;
  query: string;
  responseTime: number;
  ragUsed: boolean;
  chunksFound: number;
  bigQueryUsed: boolean;
  responsePreview: string;
  sources: any[];
  error?: string;
}

async function testQuery(query: string, queryId: number): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🔍 Testing Query #${queryId}...`);
    console.log(`   Pregunta: "${query.substring(0, 80)}..."`);
    
    // Import the RAG search function
    const { searchRelevantChunks } = await import('../src/lib/rag-search.js');
    
    // Test RAG search directly
    console.log(`   🔍 Ejecutando búsqueda RAG...`);
    const ragStartTime = Date.now();
    
    const chunks = await searchRelevantChunks(USER_ID, query, {
      topK: 8,
      minSimilarity: 0.25
    });
    
    const ragTime = Date.now() - ragStartTime;
    const totalTime = Date.now() - startTime;
    
    console.log(`   ✅ Búsqueda completada en ${ragTime}ms`);
    console.log(`   📊 Chunks encontrados: ${chunks.length}`);
    
    if (chunks.length > 0) {
      console.log(`   📚 Top chunk similarity: ${(chunks[0].similarity * 100).toFixed(1)}%`);
      console.log(`   📄 Source: ${chunks[0].sourceFileName || chunks[0].sourceId}`);
    }
    
    // Extract sources
    const sources = chunks.map(chunk => ({
      sourceId: chunk.sourceId,
      fileName: chunk.sourceFileName,
      similarity: chunk.similarity,
      preview: chunk.text.substring(0, 100)
    }));
    
    return {
      queryId,
      query,
      responseTime: totalTime,
      ragUsed: chunks.length > 0,
      chunksFound: chunks.length,
      bigQueryUsed: chunks.length > 0, // If chunks found, BigQuery was used
      responsePreview: chunks.length > 0 ? chunks[0].text.substring(0, 200) : 'No context found',
      sources: sources.slice(0, 3), // Top 3 sources
      error: undefined
    };
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`   ❌ Error: ${error.message}`);
    
    return {
      queryId,
      query,
      responseTime: totalTime,
      ragUsed: false,
      chunksFound: 0,
      bigQueryUsed: false,
      responsePreview: '',
      sources: [],
      error: error.message
    };
  }
}

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TEST RAG - S1-v2 (iQmdg3bMSJ1AdqqlFpye)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check if RAG is enabled
  console.log('📋 Verificando configuración del agente...');
  const agentDoc = await firestore.collection('conversations').doc(AGENT_ID).get();
  const agentData = agentDoc.data();
  const ragEnabled = agentData?.ragSearch?.enabled || false;
  
  console.log(`   RAG Enabled: ${ragEnabled ? '✅ SÍ' : '❌ NO'}`);
  
  if (!ragEnabled) {
    console.log('\n⚠️  WARNING: RAG está deshabilitado. Los resultados mostrarán que BigQuery no se usa.\n');
  }
  
  const results: TestResult[] = [];
  
  // Run tests sequentially
  for (const testCase of TEST_QUERIES) {
    const result = await testQuery(testCase.query, testCase.id);
    results.push(result);
    
    // Wait a bit between queries
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('| Query | Tiempo (ms) | RAG | Chunks | BigQuery | Error |');
  console.log('|-------|-------------|-----|--------|----------|-------|');
  
  for (const result of results) {
    const timeStr = result.responseTime.toString().padEnd(11);
    const ragStr = result.ragUsed ? '✅' : '❌';
    const chunksStr = result.chunksFound.toString().padEnd(6);
    const bqStr = result.bigQueryUsed ? '✅' : '❌';
    const errorStr = result.error ? '❌' : '✅';
    
    console.log(`| #${result.queryId}    | ${timeStr} | ${ragStr}  | ${chunksStr} | ${bqStr}       | ${errorStr}    |`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 ESTADÍSTICAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const totalChunks = results.reduce((sum, r) => sum + r.chunksFound, 0);
  const ragUsedCount = results.filter(r => r.ragUsed).length;
  const errorsCount = results.filter(r => r.error).length;
  
  console.log(`   Tiempo promedio de respuesta: ${avgTime.toFixed(0)}ms`);
  console.log(`   Queries con RAG: ${ragUsedCount}/${results.length}`);
  console.log(`   Total chunks recuperados: ${totalChunks}`);
  console.log(`   Chunks promedio por query: ${(totalChunks / results.length).toFixed(1)}`);
  console.log(`   Errores: ${errorsCount}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📚 DETALLES POR QUERY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  for (const result of results) {
    console.log(`\n🔍 Query #${result.queryId}: "${result.query.substring(0, 60)}..."`);
    console.log(`─────────────────────────────────────────────────────────`);
    console.log(`   Tiempo: ${result.responseTime}ms`);
    console.log(`   RAG usado: ${result.ragUsed ? '✅ Sí' : '❌ No'}`);
    console.log(`   Chunks encontrados: ${result.chunksFound}`);
    console.log(`   BigQuery usado: ${result.bigQueryUsed ? '✅ Sí' : '❌ No'}`);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    
    if (result.sources.length > 0) {
      console.log(`\n   📄 Top Sources:`);
      for (let i = 0; i < result.sources.length; i++) {
        const source = result.sources[i];
        console.log(`      ${i + 1}. ${source.fileName || source.sourceId} (${(source.similarity * 100).toFixed(1)}%)`);
        console.log(`         "${source.preview}..."`);
      }
    } else {
      console.log(`\n   ⚠️  No se encontraron chunks relevantes`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST COMPLETADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Save results to file
  const fs = await import('fs');
  const reportPath = '/tmp/s1v2-rag-test-results.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    agentId: AGENT_ID,
    ragEnabled,
    results,
    stats: {
      avgTime,
      ragUsedCount,
      totalChunks,
      errorsCount
    }
  }, null, 2));
  
  console.log(`📄 Resultados guardados en: ${reportPath}\n`);
}

runTests().catch(console.error);


