/**
 * Setup Optimized BigQuery Vector Search (Blue-Green Deployment)
 * 
 * Creates NEW optimized BigQuery setup WITHOUT touching current one
 * 
 * Strategy:
 * - Current (BLUE): flow_analytics.document_embeddings (keep running)
 * - New (GREEN): flow_rag_optimized.document_chunks_vectorized (test thoroughly)
 * - Feature flag: USE_OPTIMIZED_BIGQUERY controls which is used
 * 
 * Usage:
 *   npx tsx scripts/setup-bigquery-optimized.ts [--dry-run]
 */

import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const NEW_DATASET = 'flow_rag_optimized';
const NEW_TABLE = 'document_chunks_vectorized';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

interface SetupStats {
  datasetCreated: boolean;
  tableCreated: boolean;
  vectorIndexCreated: boolean;
  errors: string[];
}

async function setupOptimizedBigQuery(dryRun = false): Promise<SetupStats> {
  const stats: SetupStats = {
    datasetCreated: false,
    tableCreated: false,
    vectorIndexCreated: false,
    errors: []
  };

  console.log('🚀 BigQuery Optimized Setup (Blue-Green Deployment)');
  console.log('=' + '='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`New Dataset: ${NEW_DATASET}`);
  console.log(`New Table: ${NEW_TABLE}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  try {
    // Step 1: Create dataset if doesn't exist
    console.log('📊 Step 1: Creating dataset...');
    
    if (dryRun) {
      console.log('  [DRY RUN] Would create dataset: flow_rag_optimized');
    } else {
      try {
        const dataset = bigquery.dataset(NEW_DATASET);
        const [exists] = await dataset.exists();
        
        if (!exists) {
          await bigquery.createDataset(NEW_DATASET, {
            location: 'us-central1', // Same as Firestore
            description: 'Optimized RAG vector search dataset (Green deployment)',
          });
          console.log('  ✅ Dataset created: flow_rag_optimized');
          stats.datasetCreated = true;
        } else {
          console.log('  ℹ️ Dataset already exists: flow_rag_optimized');
          stats.datasetCreated = true;
        }
      } catch (error) {
        const errMsg = `Failed to create dataset: ${error}`;
        console.error(`  ❌ ${errMsg}`);
        stats.errors.push(errMsg);
      }
    }

    // Step 2: Create table with optimized schema
    console.log('');
    console.log('📋 Step 2: Creating table...');
    
    const tableSchema = {
      fields: [
        { name: 'chunk_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique chunk identifier' },
        { name: 'source_id', type: 'STRING', mode: 'REQUIRED', description: 'Source document ID' },
        { name: 'user_id', type: 'STRING', mode: 'REQUIRED', description: 'Owner (hashed format)' },
        { name: 'chunk_index', type: 'INTEGER', mode: 'REQUIRED', description: 'Position in document' },
        { name: 'text_preview', type: 'STRING', mode: 'NULLABLE', description: 'First 500 chars' },
        { name: 'full_text', type: 'STRING', mode: 'REQUIRED', description: 'Complete chunk text' },
        { name: 'embedding', type: 'FLOAT64', mode: 'REPEATED', description: '768-dimensional vector' },
        { name: 'metadata', type: 'JSON', mode: 'NULLABLE', description: 'Chunk metadata' },
        { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Creation timestamp' },
      ]
    };

    if (dryRun) {
      console.log('  [DRY RUN] Would create table with schema:');
      console.log(JSON.stringify(tableSchema, null, 2));
    } else {
      try {
        const table = bigquery.dataset(NEW_DATASET).table(NEW_TABLE);
        const [exists] = await table.exists();
        
        if (!exists) {
          await table.create({
            schema: tableSchema,
            timePartitioning: {
              type: 'DAY',
              field: 'created_at',
              expirationMs: null, // No auto-deletion
            },
            clustering: {
              fields: ['user_id', 'source_id'], // Fast filtering
            },
            description: 'Optimized document chunks with embeddings for vector search',
          });
          
          console.log('  ✅ Table created: document_chunks_vectorized');
          console.log('     Schema: chunk_id, source_id, user_id, chunk_index, text_preview, full_text, embedding, metadata');
          console.log('     Partitioning: By created_at (daily)');
          console.log('     Clustering: By user_id, source_id');
          stats.tableCreated = true;
        } else {
          console.log('  ℹ️ Table already exists: document_chunks_vectorized');
          stats.tableCreated = true;
        }
      } catch (error) {
        const errMsg = `Failed to create table: ${error}`;
        console.error(`  ❌ ${errMsg}`);
        stats.errors.push(errMsg);
      }
    }

    // Step 3: Create vector index for fast similarity search
    console.log('');
    console.log('🔍 Step 3: Creating vector index (optional - improves first-query speed)...');
    
    // Note: Vector indexes in BigQuery are currently in preview and may not be available
    // The cosine similarity calculation in SQL works without it, just slower on first query
    
    if (dryRun) {
      console.log('  [DRY RUN] Would attempt to create vector index on embedding column');
      console.log('  Note: Vector indexes improve cold-start performance');
    } else {
      console.log('  ℹ️ Vector index creation via API not yet supported');
      console.log('     Manual creation command:');
      console.log('');
      console.log('     bq query --use_legacy_sql=false --project_id=salfagpt "');
      console.log('       CREATE VECTOR INDEX IF NOT EXISTS embedding_idx');
      console.log(`       ON \`${PROJECT_ID}.${NEW_DATASET}.${NEW_TABLE}\`(embedding)`);
      console.log('       OPTIONS(');
      console.log('         distance_type = "COSINE",');
      console.log('         index_type = "IVF"');
      console.log('       )');
      console.log('     "');
      console.log('');
      console.log('  ⚠️ Run this manually after migration completes');
      stats.vectorIndexCreated = false;
    }

    // Summary
    console.log('');
    console.log('✅ Setup Summary');
    console.log('=' + '='.repeat(60));
    console.log(`Dataset created: ${stats.datasetCreated ? '✅' : '❌'}`);
    console.log(`Table created: ${stats.tableCreated ? '✅' : '❌'}`);
    console.log(`Vector index: ${stats.vectorIndexCreated ? '✅' : '⚠️ Manual step required'}`);
    
    if (stats.errors.length > 0) {
      console.log('');
      console.log('❌ Errors encountered:');
      stats.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (!dryRun && stats.datasetCreated && stats.tableCreated) {
      console.log('');
      console.log('🎉 Setup complete! Next steps:');
      console.log('');
      console.log('1. Run migration:');
      console.log('   npx tsx scripts/migrate-to-bigquery-optimized.ts --dry-run');
      console.log('   npx tsx scripts/migrate-to-bigquery-optimized.ts');
      console.log('');
      console.log('2. (Optional) Create vector index manually (see command above)');
      console.log('');
      console.log('3. Test the new setup:');
      console.log('   export USE_OPTIMIZED_BIGQUERY=true');
      console.log('   npm run dev');
      console.log('');
      console.log('4. If tests pass, update .env:');
      console.log('   USE_OPTIMIZED_BIGQUERY=true');
      console.log('');
      console.log('5. Deploy to production');
    }

    return stats;

  } catch (error) {
    console.error('');
    console.error('💥 Setup failed!');
    console.error(error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run setup
setupOptimizedBigQuery(dryRun)
  .then(stats => {
    console.log('');
    console.log('🏁 Setup script completed!');
    process.exit(stats.errors.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('');
    console.error('💥 Setup script failed!');
    process.exit(1);
  });

