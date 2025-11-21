/**
 * Check Actual Similarity Calculations
 * 
 * Directly queries BigQuery/Firestore to show REAL similarity scores
 */

import { generateEmbedding, cosineSimilarity } from '../src/lib/embeddings.js';
import { firestore } from '../src/lib/firestore.js';

async function checkActualSimilarities() {
  console.log('🔍 Checking ACTUAL Similarity Calculations\n');
  console.log('='.repeat(80));
  
  const agentId = 'KfoKcDrb6pMnduAiLlrD'; // MAQSA Mantenimiento S2
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const testQuery = "¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?";
  
  try {
    // 1. Generate query embedding
    console.log('\n1️⃣  Generating query embedding...');
    console.log(`   Query: "${testQuery}"`);
    
    const startEmbed = Date.now();
    const queryEmbedding = await generateEmbedding(testQuery);
    const embedTime = Date.now() - startEmbed;
    
    console.log(`   ✅ Generated in ${embedTime}ms`);
    console.log(`   Dimensions: ${queryEmbedding.length}`);
    console.log(`   First 5 values: [${queryEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // Check if semantic or deterministic
    const avgAbsValue = queryEmbedding.reduce((sum, v) => sum + Math.abs(v), 0) / queryEmbedding.length;
    const embeddingType = avgAbsValue < 0.01 
      ? '⚠️ DETERMINISTIC (hash-based - NOT semantic)'
      : '✅ SEMANTIC (real embeddings from Gemini)';
    
    console.log(`   Type: ${embeddingType}`);
    console.log(`   Avg abs value: ${avgAbsValue.toFixed(6)}`);
    
    if (avgAbsValue < 0.01) {
      console.log('\n   🚨 PROBLEM IDENTIFIED: Using deterministic embeddings!');
      console.log('      This explains why similarities are always low or 50%');
      console.log('      Deterministic embeddings cannot capture semantic meaning');
      return;
    }
    
    // 2. Find chunks for this agent
    console.log('\n2️⃣  Finding chunks for agent...');
    
    // First get context sources for this agent
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agentId)
      .limit(10)
      .get();
    
    if (sourcesSnapshot.empty) {
      console.log('   ⚠️ No context sources assigned to this agent');
      console.log('      Agent needs documents uploaded');
      return;
    }
    
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    console.log(`   ✅ Found ${sourceIds.length} context sources`);
    sourcesSnapshot.docs.forEach(doc => {
      console.log(`      - ${doc.data().name}`);
    });
    
    // Get chunks
    console.log('\n3️⃣  Loading document chunks...');
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('userId', '==', userId)
      .where('sourceId', 'in', sourceIds.slice(0, 10))
      .limit(50) // Sample of 50 chunks
      .get();
    
    if (chunksSnapshot.empty) {
      console.log('   ❌ NO CHUNKS FOUND!');
      console.log('      Documents are not indexed for RAG');
      console.log('      Run: npm run index:documents');
      return;
    }
    
    console.log(`   ✅ Found ${chunksSnapshot.size} chunks to test`);
    
    // 3. Calculate similarities
    console.log('\n4️⃣  Calculating similarities...\n');
    
    const results: Array<{
      sourceId: string;
      chunkIndex: number;
      similarity: number;
      preview: string;
    }> = [];
    
    for (const doc of chunksSnapshot.docs) {
      const data = doc.data();
      const chunkEmbedding = data.embedding as number[];
      
      if (!chunkEmbedding || chunkEmbedding.length !== queryEmbedding.length) {
        console.log(`   ⚠️ Chunk ${data.chunkIndex}: Invalid embedding`);
        continue;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      const preview = (data.text || data.textPreview || '').substring(0, 150);
      
      results.push({
        sourceId: data.sourceId,
        chunkIndex: data.chunkIndex,
        similarity,
        preview
      });
    }
    
    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Show top 10
    console.log('   📊 Top 10 Similar Chunks:\n');
    
    results.slice(0, 10).forEach((result, index) => {
      const simPercent = (result.similarity * 100).toFixed(1);
      const quality = result.similarity >= 0.8 ? '🟢 EXCELLENT' : 
                     result.similarity >= 0.7 ? '🟢 GOOD' :
                     result.similarity >= 0.6 ? '🟡 MODERATE' :
                     result.similarity >= 0.5 ? '🟠 LOW' : '🔴 VERY LOW';
      
      const meetsThreshold = result.similarity >= 0.7 ? '✅ PASSES' : '❌ FILTERED';
      
      console.log(`   ${index + 1}. Chunk #${result.chunkIndex} - ${simPercent}% ${quality} ${meetsThreshold}`);
      console.log(`      Source: ${result.sourceId}`);
      console.log(`      Text: "${result.preview}..."`);
      console.log();
    });
    
    // 5. Statistics
    console.log('=' .repeat(80));
    console.log('\n5️⃣  STATISTICS:\n');
    
    const similarities = results.map(r => r.similarity);
    const avg = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const max = Math.max(...similarities);
    const min = Math.min(...similarities);
    
    const above70 = results.filter(r => r.similarity >= 0.7).length;
    const above60 = results.filter(r => r.similarity >= 0.6).length;
    const above50 = results.filter(r => r.similarity >= 0.5).length;
    
    console.log(`   Total chunks tested: ${results.length}`);
    console.log(`   Average similarity: ${(avg * 100).toFixed(1)}%`);
    console.log(`   Max similarity: ${(max * 100).toFixed(1)}%`);
    console.log(`   Min similarity: ${(min * 100).toFixed(1)}%`);
    console.log(`   Range: ${((max - min) * 100).toFixed(1)}%`);
    console.log();
    console.log(`   Chunks ≥70% (would be used): ${above70} (${((above70/results.length)*100).toFixed(1)}%)`);
    console.log(`   Chunks ≥60%: ${above60} (${((above60/results.length)*100).toFixed(1)}%)`);
    console.log(`   Chunks ≥50%: ${above50} (${((above50/results.length)*100).toFixed(1)}%)`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 DIAGNOSIS:\n');
    
    if (above70 === 0) {
      console.log('🚨 NO CHUNKS MEET 70% THRESHOLD');
      console.log(`   Best match: ${(max * 100).toFixed(1)}%`);
      console.log('   \n   This explains why you see:');
      console.log('   - API returns 0 references');
      console.log('   - AI should inform about no relevant docs');
      console.log('   - Should provide admin contact');
      console.log('\n   TWO POSSIBILITIES:');
      console.log('   a) ✅ WORKING AS INTENDED - Query is too general, docs are specific');
      console.log('      Solution: More specific query OR lower threshold');
      console.log('   b) ⚠️ EMBEDDINGS ISSUE - Semantic matching not working well');
      console.log('      Solution: Check if using Gemini embeddings or deterministic fallback');
      
    } else {
      console.log(`✅ FOUND ${above70} CHUNKS WITH ≥70% SIMILARITY`);
      console.log('   These SHOULD appear as references in API response');
      console.log('   If they do not, there may be a bug in reference building');
    }
    
    // Check embedding quality
    console.log('\n📊 EMBEDDING QUALITY CHECK:\n');
    
    if (avgAbsValue >= 0.01) {
      console.log('   ✅ Embeddings appear to be SEMANTIC (Gemini)');
      console.log('      Values are in expected range for neural embeddings');
    } else {
      console.log('   ⚠️ Embeddings appear to be DETERMINISTIC (hash-based)');
      console.log('      This would explain poor semantic matching');
      console.log('      Check if GOOGLE_AI_API_KEY is configured');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
  
  process.exit(0);
}

checkActualSimilarities();






