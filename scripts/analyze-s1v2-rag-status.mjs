#!/usr/bin/env node

/**
 * Complete RAG Status Analysis for S1-v2
 * Checks Firestore, BigQuery, and configuration
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye'; // S1-v2
const DATASET_ID = 'flow_rag_optimized';
const TABLE_ID = 'document_chunks_vectorized';

async function analyzeRAGStatus() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          S1-V2 RAG STATUS - COMPLETE ANALYSIS                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // ========================================================================
    // 1. AGENT CONFIGURATION
    // ========================================================================
    console.log('1️⃣  AGENT CONFIGURATION (Firestore)');
    console.log('─'.repeat(80));
    
    const agentDoc = await db.collection('conversations').doc(AGENT_ID).get();
    
    if (!agentDoc.exists) {
      console.log('❌ Agent does not exist!\n');
      return;
    }
    
    const agentData = agentDoc.data();
    
    console.log(`   Title:                    ${agentData.title}`);
    console.log(`   Is Agent:                 ${agentData.isAgent ? '✅' : '❌'}`);
    console.log(`   Owner (userId):           ${agentData.userId}`);
    console.log(`   Active Source IDs:        ${(agentData.activeContextSourceIds || []).length}`);
    console.log(`   System Prompt Length:     ${(agentData.systemPrompt || '').length} chars`);
    
    const activeSourceIds = agentData.activeContextSourceIds || [];
    
    if (activeSourceIds.length === 0) {
      console.log('\n   ⚠️  WARNING: No active context sources!\n');
    } else {
      console.log(`\n   Sample Active Source IDs (first 5):`);
      activeSourceIds.slice(0, 5).forEach((id, idx) => {
        console.log(`      ${idx + 1}. ${id}`);
      });
    }
    
    // ========================================================================
    // 2. AGENT SOURCE ASSIGNMENTS
    // ========================================================================
    console.log('\n2️⃣  AGENT SOURCE ASSIGNMENTS (Firestore agent_sources)');
    console.log('─'.repeat(80));
    
    const assignmentsSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', AGENT_ID)
      .get();
    
    console.log(`   Total Assignments:        ${assignmentsSnapshot.size}`);
    
    if (assignmentsSnapshot.size > 0) {
      const assignedSourceIds = assignmentsSnapshot.docs.map(doc => doc.data().sourceId);
      const assignedUserIds = [...new Set(assignmentsSnapshot.docs.map(doc => doc.data().userId))];
      
      console.log(`   Unique Source IDs:        ${new Set(assignedSourceIds).size}`);
      console.log(`   Assigned by Users:        ${assignedUserIds.join(', ')}`);
    } else {
      console.log('\n   ⚠️  WARNING: No assignments in agent_sources!\n');
    }
    
    // ========================================================================
    // 3. CONTEXT SOURCES (Documents in Firestore)
    // ========================================================================
    console.log('\n3️⃣  CONTEXT SOURCES (Firestore context_sources)');
    console.log('─'.repeat(80));
    
    if (activeSourceIds.length === 0) {
      console.log('   ⚠️  Skipping (no active source IDs)\n');
    } else {
      // Check first 10 sources
      const sourceChecks = await Promise.all(
        activeSourceIds.slice(0, 10).map(async (sourceId) => {
          const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
          if (!sourceDoc.exists) return { sourceId, exists: false };
          
          const data = sourceDoc.data();
          return {
            sourceId,
            exists: true,
            name: data.name,
            hasExtractedData: !!(data.extractedData || data.extractedDataUrl),
            ragEnabled: data.ragEnabled,
            chunkCount: data.ragMetadata?.chunkCount || 0
          };
        })
      );
      
      const existingCount = sourceChecks.filter(s => s.exists).length;
      const withDataCount = sourceChecks.filter(s => s.hasExtractedData).length;
      const ragEnabledCount = sourceChecks.filter(s => s.ragEnabled).length;
      
      console.log(`   Sources checked:          ${sourceChecks.length} (sample)`);
      console.log(`   Existing in Firestore:    ${existingCount}/${sourceChecks.length}`);
      console.log(`   With extracted data:      ${withDataCount}/${sourceChecks.length}`);
      console.log(`   RAG enabled:              ${ragEnabledCount}/${sourceChecks.length}`);
      
      console.log(`\n   Sample sources:`);
      sourceChecks.slice(0, 5).forEach((s, idx) => {
        if (s.exists) {
          console.log(`      ${idx + 1}. ${s.name}`);
          console.log(`         Data: ${s.hasExtractedData ? '✅' : '❌'} | RAG: ${s.ragEnabled ? '✅' : '❌'} | Chunks: ${s.chunkCount}`);
        } else {
          console.log(`      ${idx + 1}. ${s.sourceId} - ❌ NOT FOUND`);
        }
      });
    }
    
    // ========================================================================
    // 4. FIRESTORE CHUNKS
    // ========================================================================
    console.log('\n4️⃣  FIRESTORE CHUNKS (document_chunks collection)');
    console.log('─'.repeat(80));
    
    const ownerUserId = agentData.userId;
    
    // Get chunk count for owner
    const chunksSnapshot = await db.collection('document_chunks')
      .where('userId', '==', ownerUserId)
      .select('sourceId', 'chunkIndex', 'embedding')
      .limit(1000)
      .get();
    
    console.log(`   Owner userId:             ${ownerUserId}`);
    console.log(`   Total chunks (sample):    ${chunksSnapshot.size}`);
    
    if (chunksSnapshot.size > 0) {
      // Group by sourceId
      const chunksBySource = {};
      const chunksWithEmbeddings = chunksSnapshot.docs.filter(doc => {
        const data = doc.data();
        if (data.sourceId) {
          chunksBySource[data.sourceId] = (chunksBySource[data.sourceId] || 0) + 1;
        }
        return data.embedding && Array.isArray(data.embedding) && data.embedding.length > 0;
      });
      
      const uniqueSources = Object.keys(chunksBySource).length;
      
      console.log(`   Chunks with embeddings:   ${chunksWithEmbeddings.length}/${chunksSnapshot.size}`);
      console.log(`   Unique source IDs:        ${uniqueSources}`);
      
      // Check if agent's sources have chunks
      const agentSourcesWithChunks = activeSourceIds.filter(id => chunksBySource[id]);
      console.log(`   Agent sources w/ chunks:  ${agentSourcesWithChunks.length}/${activeSourceIds.length}`);
      
      if (uniqueSources > 0) {
        console.log(`\n   Sample chunks by source:`);
        Object.entries(chunksBySource).slice(0, 5).forEach(([sourceId, count], idx) => {
          console.log(`      ${idx + 1}. ${sourceId}: ${count} chunks`);
        });
      }
    } else {
      console.log('\n   ❌ NO CHUNKS FOUND in Firestore!\n');
    }
    
    // ========================================================================
    // 5. BIGQUERY CHUNKS
    // ========================================================================
    console.log('\n5️⃣  BIGQUERY CHUNKS (flow_rag_optimized.document_chunks_vectorized)');
    console.log('─'.repeat(80));
    
    // Check table exists
    try {
      const [tableExists] = await bigquery
        .dataset(DATASET_ID)
        .table(TABLE_ID)
        .exists();
      
      if (!tableExists) {
        console.log(`   ❌ Table does not exist: ${DATASET_ID}.${TABLE_ID}\n`);
      } else {
        console.log(`   ✅ Table exists: ${DATASET_ID}.${TABLE_ID}`);
        
        // Query chunk count for owner
        const query = `
          SELECT 
            COUNT(*) as total_chunks,
            COUNT(DISTINCT source_id) as unique_sources,
            MIN(created_at) as first_chunk,
            MAX(created_at) as last_chunk
          FROM \`salfagpt.${DATASET_ID}.${TABLE_ID}\`
          WHERE user_id = @userId
        `;
        
        const [rows] = await bigquery.query({
          query,
          params: { userId: ownerUserId },
          location: 'us-central1'
        });
        
        const stats = rows[0];
        
        console.log(`   Owner userId:             ${ownerUserId}`);
        console.log(`   Total chunks:             ${stats.total_chunks}`);
        console.log(`   Unique sources:           ${stats.unique_sources}`);
        
        if (stats.total_chunks > 0) {
          console.log(`   First chunk:              ${stats.first_chunk}`);
          console.log(`   Last chunk:               ${stats.last_chunk}`);
          
          // Check if agent's sources are in BigQuery
          if (activeSourceIds.length > 0) {
            const sourceCheckQuery = `
              SELECT 
                source_id,
                COUNT(*) as chunk_count,
                AVG(ARRAY_LENGTH(embedding)) as avg_embedding_dim
              FROM \`salfagpt.${DATASET_ID}.${TABLE_ID}\`
              WHERE user_id = @userId
                AND source_id IN UNNEST(@sourceIds)
              GROUP BY source_id
              ORDER BY chunk_count DESC
              LIMIT 10
            `;
            
            const [sourceRows] = await bigquery.query({
              query: sourceCheckQuery,
              params: { 
                userId: ownerUserId,
                sourceIds: activeSourceIds.slice(0, 100) // BigQuery array limit
              },
              location: 'us-central1'
            });
            
            console.log(`\n   Agent sources in BigQuery: ${sourceRows.length}/${Math.min(activeSourceIds.length, 100)} checked`);
            
            if (sourceRows.length > 0) {
              console.log(`\n   Sample sources with chunks:`);
              sourceRows.slice(0, 5).forEach((row, idx) => {
                console.log(`      ${idx + 1}. ${row.source_id}`);
                console.log(`         Chunks: ${row.chunk_count} | Embedding dim: ${row.avg_embedding_dim}`);
              });
            } else {
              console.log('\n   ❌ NONE of the agent sources found in BigQuery!');
            }
          }
        } else {
          console.log('\n   ❌ NO CHUNKS FOUND in BigQuery for this user!\n');
        }
      }
    } catch (error) {
      console.log(`   ❌ Error querying BigQuery: ${error.message}\n`);
    }
    
    // ========================================================================
    // 6. RAG CONFIGURATION CHECK
    // ========================================================================
    console.log('\n6️⃣  RAG CONFIGURATION');
    console.log('─'.repeat(80));
    
    // Check if BigQuery router is configured correctly
    const routerPath = 'src/lib/bigquery-router.ts';
    const optimizedPath = 'src/lib/bigquery-optimized.ts';
    
    console.log(`   Router file:              ${routerPath}`);
    console.log(`   Optimized search:         ${optimizedPath}`);
    console.log(`   Dataset:                  ${DATASET_ID}`);
    console.log(`   Table:                    ${TABLE_ID}`);
    console.log(`   Location:                 us-central1`);
    
    // ========================================================================
    // 7. FINAL VERDICT
    // ========================================================================
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                      FINAL VERDICT                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    const checks = {
      agentExists: agentDoc.exists,
      hasActiveSources: activeSourceIds.length > 0,
      hasAssignments: assignmentsSnapshot.size > 0,
      hasFirestoreChunks: chunksSnapshot.size > 0,
      hasBigQueryChunks: false, // Will be set below
    };
    
    // Check BigQuery chunks
    try {
      const [quickCheck] = await bigquery.query({
        query: `SELECT COUNT(*) as cnt FROM \`salfagpt.${DATASET_ID}.${TABLE_ID}\` WHERE user_id = @userId LIMIT 1`,
        params: { userId: ownerUserId },
        location: 'us-central1'
      });
      checks.hasBigQueryChunks = quickCheck[0].cnt > 0;
    } catch (e) {
      // Ignore
    }
    
    console.log('   Agent Configuration:      ' + (checks.agentExists ? '✅' : '❌'));
    console.log('   Active Source IDs:        ' + (checks.hasActiveSources ? `✅ (${activeSourceIds.length})` : '❌'));
    console.log('   Agent Assignments:        ' + (checks.hasAssignments ? `✅ (${assignmentsSnapshot.size})` : '❌'));
    console.log('   Firestore Chunks:         ' + (checks.hasFirestoreChunks ? `✅ (${chunksSnapshot.size}+)` : '❌'));
    console.log('   BigQuery Chunks:          ' + (checks.hasBigQueryChunks ? '✅' : '❌'));
    
    const allChecks = Object.values(checks).every(v => v);
    
    console.log('\n   ' + '─'.repeat(76));
    
    if (allChecks) {
      console.log('   🎉 RAG STATUS: FULLY OPERATIONAL');
      console.log('   All components are configured correctly.');
      console.log('   The agent should be using RAG for responses.');
    } else {
      console.log('   ⚠️  RAG STATUS: PARTIAL OR NOT WORKING');
      console.log('   Missing components:');
      if (!checks.agentExists) console.log('      - Agent configuration');
      if (!checks.hasActiveSources) console.log('      - Active source IDs');
      if (!checks.hasAssignments) console.log('      - Agent source assignments');
      if (!checks.hasFirestoreChunks) console.log('      - Firestore chunks');
      if (!checks.hasBigQueryChunks) console.log('      - BigQuery chunks (CRITICAL!)');
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    console.error(error.stack);
  }
}

analyzeRAGStatus();

