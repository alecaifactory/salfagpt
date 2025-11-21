/**
 * Direct BigQuery Similarity Test
 * 
 * Calculates REAL similarities directly in BigQuery
 */

import { BigQuery } from '@google-cloud/bigquery';
import fetch from 'node-fetch';

const PROJECT_ID = 'salfagpt';
const DATASET_ID = 'flow_analytics';
const TABLE_ID = 'document_embeddings';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

async function testDirectSimilarity() {
  console.log('🔍 Direct BigQuery Similarity Test\n');
  console.log('='.repeat(80));
  
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const testQuery = "¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?";
  
  try {
    // 1. Generate query embedding using Gemini
    console.log('\n1️⃣  Generating query embedding with Gemini...');
    console.log(`   Query: "${testQuery}"`);
    
    const API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!API_KEY) {
      console.log('   ❌ GOOGLE_AI_API_KEY not set');
      return;
    }
    
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: testQuery }] },
          taskType: 'RETRIEVAL_QUERY',
          outputDimensionality: 768,
        })
      }
    );
    
    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.embedding?.values;
    
    if (!queryEmbedding) {
      console.log('   ❌ Failed to generate embedding');
      console.log('   Response:', JSON.stringify(embeddingData).substring(0, 200));
      return;
    }
    
    console.log(`   ✅ Generated embedding: ${queryEmbedding.length} dimensions`);
    
    // 2. Query BigQuery with similarity calculation
    console.log('\n2️⃣  Querying BigQuery with cosine similarity...');
    
    const sqlQuery = `
      WITH similarities AS (
        SELECT 
          chunk_id,
          source_id,
          chunk_index,
          text_preview,
          -- Cosine similarity calculated in SQL
          (
            SELECT SUM(a * b) / (
              SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
              SQRT((SELECT SUM(b * b) FROM UNNEST(@queryEmbedding) AS b))
            )
            FROM UNNEST(embedding) AS a WITH OFFSET pos
            JOIN UNNEST(@queryEmbedding) AS b WITH OFFSET pos2
              ON pos = pos2
          ) AS similarity
        FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
        WHERE user_id = @userId
      )
      SELECT 
        chunk_id,
        source_id,
        chunk_index,
        text_preview,
        similarity,
        CASE 
          WHEN similarity >= 0.8 THEN '🟢 EXCELLENT'
          WHEN similarity >= 0.7 THEN '🟢 GOOD'
          WHEN similarity >= 0.6 THEN '🟡 MODERATE'
          WHEN similarity >= 0.5 THEN '🟠 LOW'
          ELSE '🔴 VERY LOW'
        END as quality
      FROM similarities
      ORDER BY similarity DESC
      LIMIT 20
    `;
    
    const [rows] = await bigquery.query({
      query: sqlQuery,
      params: {
        userId,
        queryEmbedding
      }
    });
    
    console.log(`   ✅ Retrieved ${rows.length} chunks with similarities\n`);
    
    // 3. Display results
    console.log('3️⃣  TOP 20 CHUNKS BY SIMILARITY:\n');
    console.log('─'.repeat(80));
    
    rows.forEach((row, index) => {
      const simPercent = (row.similarity * 100).toFixed(1);
      const meetsThreshold = row.similarity >= 0.7 ? '✅ PASSES 70%' : '❌ FILTERED';
      
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${simPercent.padStart(5, ' ')}% ${row.quality} ${meetsThreshold}`);
      console.log(`    Chunk #${row.chunk_index} | Source: ${row.source_id.substring(0, 20)}...`);
      console.log(`    "${row.text_preview?.substring(0, 100)}..."`);
      console.log();
    });
    
    // 4. Statistics
    console.log('='.repeat(80));
    console.log('\n4️⃣  STATISTICS:\n');
    
    const similarities = rows.map(r => r.similarity);
    const avg = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const max = Math.max(...similarities);
    const min = Math.min(...similarities);
    
    const above70 = rows.filter(r => r.similarity >= 0.7).length;
    const above60 = rows.filter(r => r.similarity >= 0.6).length;
    const above50 = rows.filter(r => r.similarity >= 0.5).length;
    
    console.log(`   Total chunks: ${rows.length}`);
    console.log(`   Average similarity: ${(avg * 100).toFixed(1)}%`);
    console.log(`   Max similarity: ${(max * 100).toFixed(1)}%`);
    console.log(`   Min similarity: ${(min * 100).toFixed(1)}%`);
    console.log(`   Range: ${((max - min) * 100).toFixed(1)}%`);
    console.log();
    console.log(`   Chunks ≥70%: ${above70} (${((above70/rows.length)*100).toFixed(1)}%)`);
    console.log(`   Chunks ≥60%: ${above60} (${((above60/rows.length)*100).toFixed(1)}%)`);
    console.log(`   Chunks ≥50%: ${above50} (${((above50/rows.length)*100).toFixed(1)}%)`);
    
    console.log('\n='.repeat(80));
    console.log('\n🎯 DIAGNOSIS:\n');
    
    if (above70 === 0) {
      console.log('⚠️ NO CHUNKS MEET 70% THRESHOLD FOR THIS QUERY');
      console.log(`   Best match: ${(max * 100).toFixed(1)}%`);
      console.log('\n   This means:');
      console.log('   - ✅ Code is working correctly (enforcing 70% threshold)');
      console.log('   - ⚠️ Documents do not contain specific info about this query');
      console.log('   - ✅ AI should inform user (no relevant docs) + admin contact');
      console.log('\n   OPTIONS:');
      console.log('   a) This query is too general for the available documents');
      console.log('   b) Lower threshold to 60% to catch moderate-relevance chunks');
      console.log('   c) Add more specific documents about Cummins filters');
      
    } else {
      console.log(`✅ ${above70} CHUNKS MEET 70% THRESHOLD`);
      console.log('   These should appear as references in API response!');
      console.log('   If not appearing, check:');
      console.log('   - Reference building logic');
      console.log('   - Source ID filtering');
      console.log('   - Agent assignment');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
  }
}

testDirectSimilarity();






