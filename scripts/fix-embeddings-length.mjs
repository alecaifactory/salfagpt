#!/usr/bin/env node

/**
 * Normalizar embeddings a 768 dimensiones
 * Rellenar con ceros los que sean más cortos
 */

import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });

async function fixEmbeddings() {
  console.log('🔧 NORMALIZANDO EMBEDDINGS A 768 DIMENSIONES\n');
  console.log('═'.repeat(70));
  console.log('Tabla: flow_analytics_east4.document_embeddings');
  console.log('Objetivo: Todos los embeddings con exactamente 768 dims');
  console.log('═'.repeat(70) + '\n');
  
  // Check current state
  console.log('📊 Verificando estado actual...\n');
  
  const checkQuery = `
    SELECT 
      ARRAY_LENGTH(embedding) as dims,
      COUNT(*) as count
    FROM \`salfagpt.flow_analytics_east4.document_embeddings\`
    GROUP BY dims
    ORDER BY dims
  `;
  
  const [rows] = await bq.query({
    query: checkQuery,
    location: 'us-east4'
  });
  
  console.log('Distribución actual:');
  rows.forEach(r => {
    console.log(\`  \${r.dims} dims: \${r.count} chunks\`);
  });
  
  const needsFix = rows.filter(r => r.dims !== 768);
  
  if (needsFix.length === 0) {
    console.log(\`\n✅ Todos los embeddings ya tienen 768 dims!\n\`);
    return;
  }
  
  console.log(\`\n⚠️ Encontrados \${needsFix.reduce((sum, r) => sum + r.count, 0)} chunks con dims != 768\`);
  console.log('');
  
  // Fix strategy: Pad with zeros
  console.log('🔧 Estrategia: Rellenar con ceros hasta 768 dims\n');
  
  const fixQuery = \`
    CREATE OR REPLACE TABLE \\\`salfagpt.flow_analytics_east4.document_embeddings_fixed\\\` AS
    SELECT 
      chunk_id,
      source_id,
      user_id,
      chunk_index,
      text_preview,
      full_text,
      -- Normalizar embedding a 768 dims
      ARRAY_CONCAT(
        embedding,
        -- Agregar ceros si es menor a 768
        GENERATE_ARRAY(0.0, 0.0, 768 - ARRAY_LENGTH(embedding))
      ) as embedding,
      metadata,
      created_at
    FROM \\\`salfagpt.flow_analytics_east4.document_embeddings\\\`
  \`;
  
  console.log('⏳ Creando tabla normalizada...');
  console.log('   (Esto tomará 2-5 minutos)\n');
  
  const [job] = await bq.createQueryJob({
    query: fixQuery,
    location: 'us-east4'
  });
  
  await job.getQueryResults();
  
  console.log('✅ Tabla normalizada creada: document_embeddings_fixed\n');
  
  // Verify
  console.log('🔍 Verificando normalización...\n');
  
  const verifyQuery = \`
    SELECT 
      ARRAY_LENGTH(embedding) as dims,
      COUNT(*) as count
    FROM \\\`salfagpt.flow_analytics_east4.document_embeddings_fixed\\\`
    GROUP BY dims
  \`;
  
  const [verifyRows] = await bq.query({
    query: verifyQuery,
    location: 'us-east4'
  });
  
  console.log('Distribución después:');
  verifyRows.forEach(r => {
    console.log(\`  \${r.dims} dims: \${r.count} chunks\`);
  });
  
  if (verifyRows.length === 1 && verifyRows[0].dims === 768) {
    console.log(\`\n✅ Todos normalizados a 768 dims!\n\`);
    
    // Replace original table
    console.log('🔄 Reemplazando tabla original...\n');
    
    const replaceQuery = \`
      DROP TABLE \\\`salfagpt.flow_analytics_east4.document_embeddings\\\`;
      ALTER TABLE \\\`salfagpt.flow_analytics_east4.document_embeddings_fixed\\\`
      RENAME TO document_embeddings;
    \`;
    
    console.log('⚠️ Para reemplazar, ejecuta manualmente en BigQuery Console:');
    console.log('');
    console.log('1. DROP TABLE \`salfagpt.flow_analytics_east4.document_embeddings\`;');
    console.log('2. ALTER TABLE \`salfagpt.flow_analytics_east4.document_embeddings_fixed\`');
    console.log('   RENAME TO document_embeddings;');
    console.log('');
    
  } else {
    console.log(\`\n⚠️ Aún hay variación en dimensiones\n\`);
  }
  
  console.log('═'.repeat(70));
  console.log('📋 Próximos pasos:\n');
  console.log('1. Verificar tabla _fixed tiene 768 dims');
  console.log('2. Reemplazar tabla original');
  console.log('3. Crear vector index IVF');
  console.log('4. Probar búsqueda (debería ser <300ms)');
  console.log('═'.repeat(70) + '\n');
}

fixEmbeddings()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
"
