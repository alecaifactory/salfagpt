#!/usr/bin/env node

/**
 * Migración BigQuery: us-central1 → us-east4
 * Blue-Green deployment para cero downtime
 */

import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });

const BLUE_DATASET = 'flow_analytics';
const BLUE_TABLE = 'document_embeddings';
const GREEN_DATASET = 'flow_analytics_east4';
const GREEN_TABLE = 'document_embeddings';

async function migrate() {
  console.log('🚀 MIGRACIÓN BIGQUERY: us-central1 → us-east4\n');
  console.log('═'.repeat(70));
  console.log('Strategy: Blue-Green Deployment');
  console.log('BLUE: flow_analytics.document_embeddings (us-central1)');
  console.log('GREEN: flow_analytics_east4.document_embeddings (us-east4)');
  console.log('═'.repeat(70) + '\n');
  
  try {
    // STEP 1: Create GREEN dataset
    console.log('📦 STEP 1: Creating GREEN dataset (us-east4)...\n');
    
    try {
      const [dataset] = await bq.createDataset(GREEN_DATASET, {
        location: 'us-east4',
        description: 'RAG embeddings - us-east4 (GREEN deployment)'
      });
      console.log('✅ Dataset created: flow_analytics_east4\n');
    } catch (error) {
      if (error.message?.includes('Already Exists')) {
        console.log('ℹ️ Dataset already exists\n');
      } else {
        throw error;
      }
    }
    
    // STEP 2: Create GREEN table
    console.log('📋 STEP 2: Creating GREEN table...\n');
    
    const tableSchema = {
      schema: {
        fields: [
          { name: 'chunk_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'source_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'chunk_index', type: 'INTEGER', mode: 'REQUIRED' },
          { name: 'text_preview', type: 'STRING', mode: 'NULLABLE' },
          { name: 'full_text', type: 'STRING', mode: 'NULLABLE' },
          { name: 'embedding', type: 'FLOAT64', mode: 'REPEATED' },
          { name: 'metadata', type: 'JSON', mode: 'NULLABLE' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'NULLABLE' }
        ]
      },
      timePartitioning: {
        type: 'DAY',
        field: 'created_at'
      },
      clustering: {
        fields: ['user_id', 'source_id']
      },
      location: 'us-east4'
    };
    
    try {
      const greenTable = bq.dataset(GREEN_DATASET).table(GREEN_TABLE);
      await greenTable.create(tableSchema);
      console.log('✅ Table created with partitioning and clustering\n');
    } catch (error) {
      if (error.message?.includes('Already Exists')) {
        console.log('ℹ️ Table already exists\n');
      } else {
        throw error;
      }
    }
    
    // STEP 3: Copy data (Export/Import for cross-region)
    console.log('📥 STEP 3: Copying data to GREEN (1-2 hours)...\n');
    console.log('Using Export/Import strategy for cross-region copy:\n');
    
    const exportPath = 'gs://salfagpt-backups-us/migration-to-east4';
    
    // 3a. Export BLUE
    console.log('  3a. Exporting from BLUE (us-central1)...');
    const blueTable = bq.dataset(BLUE_DATASET).table(BLUE_TABLE);
    
    const [exportJob] = await blueTable.extract(\`\${exportPath}/data-*.avro\`, {
      format: 'AVRO',
      location: 'us-central1'
    });
    
    console.log(\`     Job: \${exportJob.id}\`);
    console.log('     Waiting for export...');
    
    await exportJob.promise();
    console.log('     ✅ Export complete\n');
    
    // 3b. Import to GREEN
    console.log('  3b. Importing to GREEN (us-east4)...');
    const greenTable = bq.dataset(GREEN_DATASET).table(GREEN_TABLE);
    
    const [importJob] = await greenTable.load(\`\${exportPath}/data-*.avro\`, {
      sourceFormat: 'AVRO',
      location: 'us-east4',
      writeDisposition: 'WRITE_TRUNCATE'
    });
    
    console.log(\`     Job: \${importJob.id}\`);
    console.log('     Waiting for import...');
    
    await importJob.promise();
    console.log('     ✅ Import complete\n');
    
    // STEP 4: Verify data
    console.log('🔍 STEP 4: Verifying data integrity...\n');
    
    const verifyQuery = \`
      SELECT 
        'BLUE (us-central1)' as source,
        COUNT(*) as chunks,
        COUNT(DISTINCT source_id) as sources,
        COUNTIF(embedding IS NOT NULL) as with_embeddings
      FROM \\\`salfagpt.\${BLUE_DATASET}.\${BLUE_TABLE}\\\`
      UNION ALL
      SELECT 
        'GREEN (us-east4)' as source,
        COUNT(*) as chunks,
        COUNT(DISTINCT source_id) as sources,
        COUNTIF(embedding IS NOT NULL) as with_embeddings
      FROM \\\`salfagpt.\${GREEN_DATASET}.\${GREEN_TABLE}\\\`
    \`;
    
    const [rows] = await bq.query({
      query: verifyQuery,
      location: 'us-east4'
    });
    
    console.log('Comparison:');
    rows.forEach(row => {
      console.log(\`  \${row.source}:\`);
      console.log(\`    Chunks: \${row.chunks}\`);
      console.log(\`    Sources: \${row.sources}\`);
      console.log(\`    With embeddings: \${row.with_embeddings}\`);
    });
    
    const blueChunks = rows[0].chunks;
    const greenChunks = rows[1].chunks;
    
    if (blueChunks !== greenChunks) {
      throw new Error(\`Data mismatch! BLUE: \${blueChunks}, GREEN: \${greenChunks}\`);
    }
    
    console.log(\`\n✅ Data verification passed: \${greenChunks} chunks copied\n\`);
    
    // STEP 5: Create vector index
    console.log('📊 STEP 5: Creating vector index on GREEN (background)...\n');
    
    const indexQuery = \`
      CREATE VECTOR INDEX IF NOT EXISTS embedding_cosine_idx
      ON \\\`salfagpt.\${GREEN_DATASET}.\${GREEN_TABLE}\\\`(embedding)
      OPTIONS(
        distance_type = 'COSINE',
        index_type = 'IVF',
        ivf_options = '{\"num_lists\": 1000}'
      )
    \`;
    
    try {
      const [indexJob] = await bq.createQueryJob({
        query: indexQuery,
        location: 'us-east4'
      });
      
      console.log(\`✅ Vector index job started: \${indexJob.id}\`);
      console.log('   Building in background (20-30 minutes)');
      console.log('   Queries will work immediately, index will accelerate progressively\n');
    } catch (error) {
      if (error.message?.includes('not supported')) {
        console.log('⚠️ Vector indexes not available - queries will work without index\n');
      } else {
        console.log(\`⚠️ Index creation deferred: \${error.message}\n\`);
      }
    }
    
    // Summary
    console.log('═'.repeat(70));
    console.log('✅ MIGRATION COMPLETE!\n');
    console.log('GREEN is ready:');
    console.log(\`  Dataset: flow_analytics_east4 (us-east4)\`);
    console.log(\`  Table: document_embeddings\`);
    console.log(\`  Chunks: \${greenChunks}\`);
    console.log(\`  Location: us-east4 ✅\`);
    console.log(\`  Index: Building (background)\n\`);
    console.log('📋 Next steps:');
    console.log('  1. Update code: DATASET_ID = \"flow_analytics_east4\"');
    console.log('  2. Test localhost');
    console.log('  3. Deploy to production');
    console.log('  4. Monitor 24h');
    console.log('  5. Cleanup BLUE after 30 days');
    console.log('═'.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔙 BLUE is still intact and operational');
    console.log('   No changes were made to production\n');
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration aborted');
    process.exit(1);
  });
