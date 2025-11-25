#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });

const S2V2_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const QUERY = "Cada cuantas horas cambiar aceite Scania P450";
const DATASET = process.env.USE_EAST4_BIGQUERY === 'true' ? 'flow_analytics_east4' : 'flow_analytics';
const LOCATION = DATASET.includes('east4') ? 'us-east4' : 'us-central1';

async function benchmark() {
  console.log('🔬 BENCHMARK RAG\n');
  console.log('Dataset:', DATASET, '(', LOCATION, ')');
  console.log('Query:', QUERY, '\n');
  
  const totalStart = Date.now();
  
  // Phase 1: Sources
  console.log('1️⃣ Get sources...');
  const t1 = Date.now();
  const agentDoc = await db.collection('conversations').doc(S2V2_ID).get();
  const sourceIds = agentDoc.data()?.activeContextSourceIds || [];
  console.log('✅', sourceIds.length, 'sources (', Date.now() - t1, 'ms)\n');
  
  // Phase 2: Embedding  
  console.log('2️⃣ Generate embedding...');
  const t2 = Date.now();
  const emb = await generateEmbedding(QUERY);
  console.log('✅ 768 dims (', Date.now() - t2, 'ms)\n');
  
  // Phase 3: Search
  console.log('3️⃣ BigQuery search...');
  const t3 = Date.now();
  
  const query = 'SELECT COUNT(*) as count FROM `salfagpt.' + DATASET + '.document_embeddings` WHERE user_id = @userId AND source_id IN UNNEST(@sourceIds)';
  
  const [rows] = await bq.query({
    query,
    params: { userId: USER_ID, sourceIds },
    location: LOCATION
  });
  
  console.log('✅ Search complete (', Date.now() - t3, 'ms)');
  console.log('   Chunks available:', rows[0].count, '\n');
  
  const total = Date.now() - totalStart;
  
  console.log('═'.repeat(50));
  console.log('TOTAL:', total, 'ms');
  console.log('With Gemini (~3s):', total + 3000, 'ms');
  console.log('═'.repeat(50), '\n');
  
  console.log('💡 UI took 30s - Difference:', 30000 - (total + 3000), 'ms');
}

benchmark()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
