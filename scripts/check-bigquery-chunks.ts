/**
 * Check BigQuery Chunks
 * 
 * Verifies if chunks exist in BigQuery and what similarities they produce
 */

import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding, cosineSimilarity } from '../src/lib/embeddings.js';

async function checkBigQueryChunks() {
  console.log('🔍 Checking BigQuery Chunks\n');
  console.log('='.repeat(80));
  
  const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
  const DATASET_ID = 'flow_dataset';
  const TABLE_ID = 'document_chunks';
  
  console.log(`\n📊 Configuration:`);
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Dataset: ${DATASET_ID}`);
  console.log(`   Table: ${TABLE_ID}`);
  
  const bigquery = new BigQuery({ projectId: PROJECT_ID });
  
  const agentId = 'KfoKcDrb6pMnduAiLlrD';
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const testQuery = "¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?";
  
  try {
    // 1. Check if table exists
    console.log('\n1️⃣  Checking if table exists...');
    const [exists] = await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .exists();
    
    if (!exists) {
      console.log('   ❌ Table does not exist!');
      console.log(`      ${PROJECT_ID}.${DATASET_ID}.${TABLE_ID} not found`);
      console.log('      This explains why RAG always returns 0 chunks');
      return;
    }
    
    console.log('   ✅ Table exists');
    
    // 2. Count total chunks
    console.log('\n2️⃣  Counting chunks...');
    const countQuery = `
      SELECT COUNT(*) as total
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
    `;
    
    const [countRows] = await bigquery.query({ query: countQuery });
    const totalChunks = countRows[0]?.total || 0;
    
    console.log(`   Total chunks in table: ${totalChunks}`);
    
    if (totalChunks === 0) {
      console.log('   ❌ No chunks in BigQuery!');
      console.log('      Table exists but is empty');
      console.log('      Need to run indexing/sync to BigQuery');
      return;
    }
    
    // 3. Count chunks for this user
    console.log('\n3️⃣  Counting chunks for user...');
    const userCountQuery = `
      SELECT COUNT(*) as total
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      WHERE user_id = @userId
    `;
    
    const [userRows] = await bigquery.query({
      query: userCountQuery,
      params: { userId }
    });
    
    const userChunks = userRows[0]?.total || 0;
    console.log(`   Chunks for user ${userId}: ${userChunks}`);
    
    if (userChunks === 0) {
      console.log('   ❌ No chunks for this user!');
      console.log('      User has no indexed documents in BigQuery');
      return;
    }
    
    // 4. Get sample chunks and calculate REAL similarities
    console.log('\n4️⃣  Getting sample chunks and calculating similarities...');
    console.log(`   Query: "${testQuery}"`);
    
    const queryEmbedding = await generateEmbedding(testQuery);
    console.log(`   ✅ Query embedding generated (${queryEmbedding.length} dims)`);
    
    // Get sample chunks
    const sampleQuery = `
      SELECT 
        chunk_id,
        source_id,
        chunk_index,
        text_preview,
        embedding
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      WHERE user_id = @userId
      LIMIT 20
    `;
    
    const [sampleRows] = await bigquery.query({
      query: sampleQuery,
      params: { userId }
    });
    
    console.log(`   ✅ Retrieved ${sampleRows.length} sample chunks`);
    
    // Calculate similarities
    console.log('\n   📊 REAL Similarity Calculations:\n');
    
    const results = sampleRows.map((row: any) => {
      const chunkEmbedding = row.embedding;
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      return {
        chunk_id: row.chunk_id,
        source_id: row.source_id,
        chunk_index: row.chunk_index,
        text_preview: row.text_preview,
        similarity
      };
    });
    
    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Show top 10
    results.slice(0, 10).forEach((result, index) => {
      const simPercent = (result.similarity * 100).toFixed(1);
      const quality = result.similarity >= 0.8 ? '🟢 EXCELLENT' : 
                     result.similarity >= 0.7 ? '🟢 GOOD' :
                     result.similarity >= 0.6 ? '🟡 MODERATE' :
                     result.similarity >= 0.5 ? '🟠 LOW' : '🔴 VERY LOW';
      
      const meetsThreshold = result.similarity >= 0.7 ? '✅ PASSES 70%' : '❌ FILTERED';
      
      console.log(`   ${index + 1}. Chunk #${result.chunk_index}: ${simPercent}% ${quality} ${meetsThreshold}`);
      console.log(`      Source: ${result.source_id}`);
      console.log(`      Preview: "${result.text_preview?.substring(0, 80)}..."`);
      console.log();
    });
    
    // Statistics
    console.log('='.repeat(80));
    console.log('\n5️⃣  STATISTICS:\n');
    
    const similarities = results.map(r => r.similarity);
    const avg = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const max = Math.max(...similarities);
    const min = Math.min(...similarities);
    
    const above70 = results.filter(r => r.similarity >= 0.7).length;
    const above60 = results.filter(r => r.similarity >= 0.6).length;
    const above50 = results.filter(r => r.similarity >= 0.5).length;
    
    console.log(`   Chunks tested: ${results.length}`);
    console.log(`   Average similarity: ${(avg * 100).toFixed(1)}%`);
    console.log(`   Max similarity: ${(max * 100).toFixed(1)}%`);
    console.log(`   Min similarity: ${(min * 100).toFixed(1)}%`);
    console.log(`   Range: ${((max - min) * 100).toFixed(1)}%`);
    console.log();
    console.log(`   Chunks ≥70% (would pass): ${above70} (${((above70/results.length)*100).toFixed(1)}%)`);
    console.log(`   Chunks ≥60%: ${above60} (${((above60/results.length)*100).toFixed(1)}%)`);
    console.log(`   Chunks ≥50%: ${above50} (${((above50/results.length)*100).toFixed(1)}%)`);
    
    // Check if all are same
    const allSame = similarities.every(s => Math.abs(s - similarities[0]) < 0.001);
    const all50 = similarities.every(s => Math.abs(s - 0.5) < 0.001);
    
    console.log('\n='.repeat(80));
    console.log('\n🎯 DIAGNOSIS:\n');
    
    if (allSame) {
      console.log(`🚨 ALL SIMILARITIES ARE IDENTICAL: ${(similarities[0] * 100).toFixed(1)}%`);
      if (all50) {
        console.log('   This is the FALLBACK VALUE (50%)');
        console.log('   Problem: NOT using BigQuery similarities');
      } else {
        console.log('   This is suspicious - real similarities should vary');
      }
    } else {
      console.log('✅ SIMILARITIES VARY - Semantic matching is working!');
      console.log(`   Range from ${(min * 100).toFixed(1)}% to ${(max * 100).toFixed(1)}%`);
    }
    
    if (above70 === 0) {
      console.log('\n⚠️ NO CHUNKS MEET 70% THRESHOLD');
      console.log('   With current threshold:');
      console.log('   - 0 references would be shown');
      console.log('   - AI should inform user about no relevant docs');
      console.log('   - Should provide admin contact');
      console.log('\n   OPTIONS:');
      console.log('   a) This is correct - documents do not contain specific info about this query');
      console.log('   b) Lower threshold to 60% to include moderate-relevance chunks');
      console.log('   c) Add more specific documents about this topic');
    } else {
      console.log(`\n✅ ${above70} CHUNKS WOULD BE USED AS REFERENCES`);
      console.log('   These should appear in the API response');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
  
  process.exit(0);
}

checkBigQueryChunks();

