#!/usr/bin/env node

/**
 * Migrar chunks de us-central1 a us-east4
 * Para mejor performance (misma región que Cloud Run)
 */

import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });

async function migrate() {
  console.log('🚀 MIGRACIÓN A US-EAST4\n');
  console.log('═'.repeat(70));
  console.log('Source: flow_analytics.document_embeddings (us-central1)');
  console.log('Target: flow_data.document_embeddings (us-east4)');
  console.log('═'.repeat(70) + '\n');
  
  // Step 1: Create table in flow_data
  console.log('📋 Paso 1: Creando tabla en flow_data (us-east4)...\n');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`salfagpt.flow_data.document_embeddings\`
    (
      chunk_id STRING NOT NULL,
      source_id STRING NOT NULL,
      user_id STRING NOT NULL,
      chunk_index INT64 NOT NULL,
      text_preview STRING,
      full_text STRING,
      embedding ARRAY<FLOAT64>,
      metadata JSON,
      created_at TIMESTAMP
    )
    PARTITION BY DATE(created_at)
    CLUSTER BY user_id, source_id
    OPTIONS(
      description='Document chunks with embeddings for RAG - us-east4'
    )
  `;
  
  try {
    const [job1] = await bq.createQueryJob({
      query: createTableQuery,
      location: 'us-east4'
    });
    
    await job1.getQueryResults();
    console.log('✅ Tabla creada en flow_data\n');
    
  } catch (error) {
    if (error.message?.includes('Already Exists')) {
      console.log('ℹ️ Tabla ya existe en flow_data\n');
    } else {
      throw error;
    }
  }
  
  // Step 2: Copy data
  console.log('📦 Paso 2: Copiando chunks (esto puede tomar 5-15 minutos)...\n');
  
  const copyQuery = `
    INSERT INTO \`salfagpt.flow_data.document_embeddings\`
    SELECT * FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE TRUE
  `;
  
  try {
    const [job2] = await bq.createQueryJob({
      query: copyQuery,
      location: 'us-east4'
    });
    
    console.log(`Job iniciado: ${job2.id}\n`);
    console.log('⏳ Copiando datos...');
    
    const [rows] = await job2.getQueryResults();
    
    console.log('✅ Datos copiados exitosamente\n');
    
    // Verify
    console.log('🔍 Verificando...');
    const countQuery = `
      SELECT COUNT(*) as count
      FROM \`salfagpt.flow_data.document_embeddings\`
    `;
    
    const [countJob] = await bq.createQueryJob({
      query: countQuery,
      location: 'us-east4'
    });
    
    const [countRows] = await countJob.getQueryResults();
    const count = countRows[0].count;
    
    console.log(`✅ Chunks en flow_data: ${count}\n`);
    
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ Datos ya copiados\n');
    } else {
      throw error;
    }
  }
  
  // Step 3: Create vector index
  console.log('📊 Paso 3: Creando vector index (10-30 minutos)...\n');
  
  const indexQuery = `
    CREATE VECTOR INDEX IF NOT EXISTS embedding_cosine_idx
    ON \`salfagpt.flow_data.document_embeddings\`(embedding)
    OPTIONS(
      distance_type = 'COSINE',
      index_type = 'IVF',
      ivf_options = '{"num_lists": 1000}'
    )
  `;
  
  try {
    const [job3] = await bq.createQueryJob({
      query: indexQuery,
      location: 'us-east4'
    });
    
    console.log(`Job iniciado: ${job3.id}\n`);
    console.log('⏳ Creando índice vectorial...');
    console.log('   (Puedes continuar, verificar después)\n');
    
    // Don't wait for index - it takes 20-30 minutes
    console.log('ℹ️ Índice en construcción (background)');
    console.log('   Verificar en ~30 minutos\n');
    
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ Índice ya existe\n');
    } else {
      console.log('⚠️ Error creando índice:', error.message);
      console.log('   Búsqueda funcionará sin índice (solo más lenta)\n');
    }
  }
  
  // Summary
  console.log('═'.repeat(70));
  console.log('✅ MIGRACIÓN COMPLETA\n');
  console.log('Dataset: flow_data (us-east4) ✅');
  console.log('Tabla: document_embeddings');
  console.log('Chunks: Copiados');
  console.log('Índice: En construcción\n');
  console.log('📋 Próximos pasos:');
  console.log('1. Actualizar código: DATASET_ID = "flow_data"');
  console.log('2. Probar RAG: npx tsx scripts/test-s2v2-rag-optimized.mjs');
  console.log('3. Verificar tiempo < 500ms');
  console.log('═'.repeat(70) + '\n');
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  });




