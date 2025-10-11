import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const DATASET_ID = process.env.BIGQUERY_DATASET || 'openflow_dataset';

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

async function setupBigQuery() {
  console.log('🚀 Setting up BigQuery...\n');

  try {
    // Create dataset
    const dataset = bigquery.dataset(DATASET_ID);
    const [datasetExists] = await dataset.exists();
    
    if (!datasetExists) {
      await bigquery.createDataset(DATASET_ID, {
        location: 'US',
      });
      console.log(`✅ Dataset ${DATASET_ID} created successfully`);
    } else {
      console.log(`ℹ️  Dataset ${DATASET_ID} already exists`);
    }

    // Create user_sessions table
    const sessionsSchema = [
      { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'session_data', type: 'STRING', mode: 'REQUIRED' },
      { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    ];

    const sessionsTable = dataset.table('user_sessions');
    const [sessionsExists] = await sessionsTable.exists();
    
    if (!sessionsExists) {
      await dataset.createTable('user_sessions', { 
        schema: sessionsSchema,
        timePartitioning: {
          type: 'DAY',
          field: 'created_at',
        },
      });
      console.log('✅ Table user_sessions created successfully');
    } else {
      console.log('ℹ️  Table user_sessions already exists');
    }

    // Create chat_messages table
    const messagesSchema = [
      { name: 'user_id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'message', type: 'STRING', mode: 'REQUIRED' },
      { name: 'role', type: 'STRING', mode: 'REQUIRED' },
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
    ];

    const messagesTable = dataset.table('chat_messages');
    const [messagesExists] = await messagesTable.exists();
    
    if (!messagesExists) {
      await dataset.createTable('chat_messages', { 
        schema: messagesSchema,
        timePartitioning: {
          type: 'DAY',
          field: 'timestamp',
        },
      });
      console.log('✅ Table chat_messages created successfully');
    } else {
      console.log('ℹ️  Table chat_messages already exists');
    }

    console.log('\n✨ BigQuery setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up BigQuery:', error);
    process.exit(1);
  }
}

setupBigQuery();

