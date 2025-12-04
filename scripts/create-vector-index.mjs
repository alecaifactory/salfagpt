#!/usr/bin/env node

/**
 * Crear vector index en BigQuery para acelerar búsquedas
 */

import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({ projectId: 'salfagpt' });

async function createVectorIndex() {
  console.log('🔧 Creando vector index en BigQuery...\n');
  console.log('Table: flow_analytics.document_embeddings');
  console.log('Index type: IVF (Inverted File Index)');
  console.log('Distance: COSINE');
  console.log('Lists: 1000\n');
  
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
    console.log('⏳ Ejecutando (esto puede tomar 10-30 minutos)...\n');
    
    const [job] = await bigquery.createQueryJob({
      query,
      location: 'us-east4' // Ajustar según región de tu dataset
    });
    
    console.log(`Job iniciado: ${job.id}\n`);
    
    // Wait for completion
    const [rows] = await job.getQueryResults();
    
    console.log('✅ Vector index creado exitosamente!\n');
    console.log('Mejora esperada:');
    console.log('  Antes: 60s por búsqueda');
    console.log('  Después: 2-5s por búsqueda ⚡');
    console.log('  Ganancia: 12-30x más rápido\n');
    
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ El índice ya existe - no es necesario crearlo\n');
      return;
    }
    
    console.error('❌ Error creando índice:', error.message);
    console.log('\nAlternativa: Crear desde GCP Console');
    console.log('1. Ir a BigQuery > flow_analytics > document_embeddings');
    console.log('2. Click "Create Index"');
    console.log('3. Seleccionar columna: embedding');
    console.log('4. Type: VECTOR, Distance: COSINE, Index: IVF\n');
    
    throw error;
  }
}

createVectorIndex()
  .then(() => {
    console.log('✅ Listo para usar!');
    console.log('Test: npx tsx scripts/test-s2v2-rag-optimized.mjs\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nError:', err.message);
    process.exit(1);
  });




