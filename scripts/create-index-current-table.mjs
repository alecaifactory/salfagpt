#!/usr/bin/env node

/**
 * Crear vector index en tabla actual (us-central1)
 * SIN mover datos - mejora inmediata
 */

import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });

async function createIndex() {
  console.log('🔧 CREANDO VECTOR INDEX\n');
  console.log('═'.repeat(70));
  console.log('Tabla: flow_analytics.document_embeddings');
  console.log('Región: us-central1 (donde está la tabla)');
  console.log('Columna: embedding (768 dims)');
  console.log('═'.repeat(70) + '\n');
  
  const query = `
    CREATE VECTOR INDEX IF NOT EXISTS embedding_cosine_idx
    ON \`salfagpt.flow_analytics.document_embeddings\`(embedding)
    OPTIONS(
      distance_type = 'COSINE',
      index_type = 'IVF',
      ivf_options = '{"num_lists": 1000}'
    )
  `;
  
  try {
    console.log('📝 Creando índice vectorial...');
    console.log('   Index type: IVF (Inverted File Index)');
    console.log('   Distance: COSINE');
    console.log('   Lists: 1000\n');
    
    console.log('⏳ Iniciando job (10-30 minutos)...\n');
    
    const [job] = await bq.createQueryJob({
      query,
      location: 'us-central1'  // ✅ Misma región que la tabla
    });
    
    console.log(`✅ Job iniciado: ${job.id}\n`);
    console.log('ℹ️ El índice se construirá en background');
    console.log('   No bloquea queries actuales');
    console.log('   Tiempo estimado: 10-30 minutos\n');
    
    console.log('📊 Mejora esperada:');
    console.log('   Actual: 600-800ms');
    console.log('   Con índice: 300-400ms ⚡');
    console.log('   Ganancia: 2x más rápido\n');
    
    console.log('✅ Puedes continuar usando el sistema');
    console.log('   El índice mejorará queries progresivamente\n');
    
  } catch (error) {
    const msg = error.message || String(error);
    
    if (msg.includes('already exists')) {
      console.log('✅ El índice ya existe!\n');
      console.log('📊 Performance debería ser óptima');
      console.log('   Búsquedas: ~300-400ms\n');
      return;
    }
    
    if (msg.includes('VECTOR INDEX') && msg.includes('not supported')) {
      console.log('⚠️ Vector indexes no disponibles en este proyecto\n');
      console.log('Alternativas:');
      console.log('1. ✅ Tabla ya tiene clustering (user_id, source_id)');
      console.log('2. ✅ Partitioning por fecha');
      console.log('3. ✅ Búsqueda actual es buena (600ms)');
      console.log('4. ⚡ Podemos optimizar query (usar APPROX functions)\n');
      return;
    }
    
    console.error('❌ Error:', msg);
    console.log('\n💡 Crear manualmente:');
    console.log('1. GCP Console > BigQuery');
    console.log('2. flow_analytics > document_embeddings');
    console.log('3. Pestaña Detalles > Crear índice vectorial');
    console.log('4. Columna: embedding, Tipo: VECTOR, Distance: COSINE\n');
    
    throw error;
  }
}

createIndex()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch(err => {
    process.exit(1);
  });

