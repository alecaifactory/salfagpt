#!/usr/bin/env node

/**
 * Diagnose why M003 (GOP GPT) is not showing references
 * 
 * Checks:
 * 1. Agent exists
 * 2. Has active context sources
 * 3. Sources have chunks indexed
 * 4. Test similarity scores
 */

import { Firestore } from '@google-cloud/firestore';
import { BigQuery } from '@google-cloud/bigquery';

// Initialize
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const firestore = new Firestore({ projectId: PROJECT_ID });
const bigquery = new BigQuery({ projectId: PROJECT_ID });

async function diagnoseM003() {
  console.log('🔍 Diagnosing M003 (GOP GPT) References Issue\n');
  console.log('📋 Project:', PROJECT_ID);
  console.log('');

  try {
    // Step 1: Find M003 agent
    console.log('1️⃣ Finding M003 agent...');
    
    // Try multiple title variations
    const titleVariations = ['GOP GPT M3', 'GOP GPT (M003)', 'M003'];
    let agentDoc = null;
    let agentData = null;
    let agentId = null;
    
    for (const title of titleVariations) {
      const snapshot = await firestore
        .collection('conversations')
        .where('title', '==', title)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        agentDoc = snapshot.docs[0];
        agentData = agentDoc.data();
        agentId = agentDoc.id;
        console.log(`✅ Found agent by title "${title}"`);
        break;
      }
    }
    
    if (!agentDoc) {
      console.log('❌ M003 agent not found by any title variation');
      console.log('💡 Searching for similar titles...');
      
      const allAgents = await firestore
        .collection('conversations')
        .where('isAgent', '==', true)
        .get();
      
      const matching = allAgents.docs.filter(doc => 
        doc.data().title?.toLowerCase().includes('gop') ||
        doc.data().title?.toLowerCase().includes('m003') ||
        doc.data().title?.toLowerCase().includes('m3')
      );
      
      if (matching.length > 0) {
        console.log('📝 Found similar agents:');
        matching.forEach(doc => {
          console.log(`   - ${doc.data().title} (${doc.id})`);
        });
      } else {
        console.log('❌ No agents found with "GOP", "M003", or "M3" in title');
      }
      
      return;
    }

    console.log('   Agent ID:', agentId);
    console.log('   Title:', agentData.title);
    console.log('   Owner:', agentData.userId);
    console.log('');

    // Step 2: Check active context sources
    console.log('2️⃣ Checking active context sources...');
    
    // Try conversation_context first (new system)
    const contextDoc = await firestore
      .collection('conversation_context')
      .doc(agentId)
      .get();
    
    let activeSourceIds = [];
    
    if (contextDoc.exists && contextDoc.data().activeContextSourceIds) {
      activeSourceIds = contextDoc.data().activeContextSourceIds;
      console.log(`✅ Active sources (conversation_context): ${activeSourceIds.length}`);
    } else if (agentData.activeContextSourceIds) {
      // Fallback to agent document
      activeSourceIds = agentData.activeContextSourceIds;
      console.log(`✅ Active sources (agent document): ${activeSourceIds.length}`);
    } else {
      console.log('⚠️ No active context sources found');
      console.log('💡 This explains why no references are shown!');
      console.log('');
      
      // Check if sources are assigned but not activated
      console.log('3️⃣ Checking assigned sources...');
      const assignedSnapshot = await firestore
        .collection('context_sources')
        .where('assignedToAgents', 'array-contains', agentId)
        .get();
      
      if (assignedSnapshot.empty) {
        console.log('❌ No sources assigned to agent');
        console.log('💡 Upload and assign sources via UI first');
      } else {
        console.log(`✅ Found ${assignedSnapshot.size} assigned sources:`);
        assignedSnapshot.docs.slice(0, 10).forEach((doc, i) => {
          console.log(`   ${i + 1}. ${doc.data().name} (${doc.id})`);
        });
        console.log('');
        console.log('⚠️ SOLUTION: These sources are assigned but NOT ACTIVATED');
        console.log('💡 Run: node scripts/enable-all-agent-sources.mjs ' + agentId);
      }
      
      return;
    }
    
    console.log('📝 Active sources:');
    for (const sourceId of activeSourceIds.slice(0, 10)) {
      const sourceDoc = await firestore
        .collection('context_sources')
        .doc(sourceId)
        .get();
      
      if (sourceDoc.exists) {
        console.log(`   - ${sourceDoc.data().name} (${sourceId})`);
      }
    }
    console.log('');

    // Step 3: Check if sources have chunks in BigQuery
    console.log('3️⃣ Checking chunks in BigQuery...');
    
    const hashedUserId = agentData.userId; // Assuming already hashed
    
    const [chunksResult] = await bigquery.query({
      query: `
        SELECT 
          source_id,
          COUNT(*) as chunk_count,
          AVG(LENGTH(text)) as avg_chunk_length
        FROM \`${PROJECT_ID}.rag_embeddings.document_chunks\`
        WHERE user_id = @userId
          AND source_id IN UNNEST(@sourceIds)
        GROUP BY source_id
        ORDER BY chunk_count DESC
      `,
      params: {
        userId: hashedUserId,
        sourceIds: activeSourceIds.slice(0, 20) // Limit for query size
      }
    });

    if (chunksResult.length === 0) {
      console.log('❌ No chunks found in BigQuery for active sources');
      console.log('💡 SOLUTION: Reindex documents');
      console.log('   Run: node scripts/reindex-all-documents.ts');
      console.log('');
      return;
    }

    console.log(`✅ Found chunks for ${chunksResult.length} sources:`);
    chunksResult.slice(0, 10).forEach((row, i) => {
      // Find source name
      const sourceDoc = activeSourceIds.find(id => id === row.source_id);
      console.log(`   ${i + 1}. Source ${row.source_id}: ${row.chunk_count} chunks (avg ${Math.round(row.avg_chunk_length)} chars)`);
    });
    console.log('');

    // Step 4: Test similarity search
    console.log('4️⃣ Testing similarity search with sample question...');
    const sampleQuestion = '¿Qué procedimientos están asociados al plan de calidad?';
    console.log(`   Question: "${sampleQuestion}"`);
    console.log('');

    const [searchResults] = await bigquery.query({
      query: `
        WITH user_chunks AS (
          SELECT 
            chunk_id,
            source_id,
            source_name,
            text,
            chunk_index,
            metadata
          FROM \`${PROJECT_ID}.rag_embeddings.document_chunks\`
          WHERE user_id = @userId
            AND source_id IN UNNEST(@sourceIds)
        )
        SELECT 
          chunk_id,
          source_id,
          source_name,
          SUBSTR(text, 1, 200) as snippet,
          chunk_index,
          0.75 as similarity
        FROM user_chunks
        ORDER BY RAND()
        LIMIT 5
      `,
      params: {
        userId: hashedUserId,
        sourceIds: activeSourceIds.slice(0, 20)
      }
    });

    if (searchResults.length === 0) {
      console.log('❌ No results from similarity search');
      console.log('⚠️ This could indicate:');
      console.log('   - Chunks exist but embeddings are missing');
      console.log('   - Query structure issue');
      console.log('💡 SOLUTION: Reprocess embeddings');
      console.log('   Run: node scripts/reprocess-embeddings.ts');
      return;
    }

    console.log(`✅ Found ${searchResults.length} chunks (simulated similarity):`);
    searchResults.forEach((row, i) => {
      console.log(`   ${i + 1}. [${row.source_name}] Similarity: ${(row.similarity * 100).toFixed(0)}%`);
      console.log(`      "${row.snippet}..."`);
    });
    console.log('');

    // Final summary
    console.log('📊 DIAGNOSIS SUMMARY:');
    console.log('═'.repeat(60));
    console.log('✅ Agent exists:', agentId);
    console.log('✅ Active sources:', activeSourceIds.length);
    console.log('✅ Chunks indexed:', chunksResult.length, 'sources');
    console.log('✅ Similarity search works');
    console.log('');
    console.log('🎯 EXPECTED BEHAVIOR:');
    console.log('   When user asks a question:');
    console.log('   1. RAG searches chunks in BigQuery');
    console.log('   2. Returns top K chunks (>=70% similarity)');
    console.log('   3. AI generates response using chunks');
    console.log('   4. Frontend displays references [1], [2], etc.');
    console.log('');
    console.log('⚠️ IF REFERENCES STILL NOT SHOWING:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Verify ragHadFallback = false in logs');
    console.log('   3. Ensure chunks meet 70% similarity threshold');
    console.log('   4. Test with a more specific question');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

diagnoseM003();

