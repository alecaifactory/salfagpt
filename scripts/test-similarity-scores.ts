/**
 * Test Script: Verify Actual Similarity Scores
 * 
 * Purpose: Determine if 50% is real similarity or fallback
 * 
 * Run: npx tsx scripts/test-similarity-scores.ts
 */

import { firestore } from '../src/lib/firestore.js';
import { generateEmbedding, cosineSimilarity } from '../src/lib/embeddings.js';

async function testSimilarityScores() {
  console.log('🔍 Testing Similarity Scores\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get a sample agent with documents
    console.log('\n1️⃣  Finding agent with documents...');
    const agentsSnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', '114671162830729001607') // Admin user
      .limit(1)
      .get();
    
    if (agentsSnapshot.empty) {
      console.log('❌ No agents found');
      return;
    }
    
    const agentId = agentsSnapshot.docs[0].id;
    const agentName = agentsSnapshot.docs[0].data().title;
    console.log(`✅ Testing with agent: ${agentName} (${agentId})`);
    
    // 2. Get document chunks for this agent
    console.log('\n2️⃣  Loading document chunks...');
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('userId', '==', '114671162830729001607')
      .limit(5) // Just test with 5 chunks
      .get();
    
    if (chunksSnapshot.empty) {
      console.log('❌ No chunks found - documents may not be indexed');
      console.log('💡 Run: npm run index:documents to create chunks');
      return;
    }
    
    console.log(`✅ Found ${chunksSnapshot.size} chunks to test`);
    
    // 3. Test with a real query
    console.log('\n3️⃣  Testing similarity with real query...');
    const testQuery = "¿Cuáles son los pasos para mantenimiento preventivo?";
    console.log(`Query: "${testQuery}"`);
    
    // Generate query embedding
    console.log('\n   Generating query embedding...');
    const startEmbed = Date.now();
    const queryEmbedding = await generateEmbedding(testQuery);
    const embedTime = Date.now() - startEmbed;
    
    console.log(`   ✅ Generated embedding in ${embedTime}ms`);
    console.log(`   Embedding type: ${queryEmbedding.length === 768 ? 'Gemini Semantic (768D)' : 'Unknown'}`);
    console.log(`   First 3 values: [${queryEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // Check if values look semantic or deterministic
    const avgValue = queryEmbedding.reduce((sum, v) => sum + Math.abs(v), 0) / queryEmbedding.length;
    const embeddingType = avgValue < 0.01 
      ? '⚠️ DETERMINISTIC (values too small - likely hash-based)'
      : '✅ SEMANTIC (values look real)';
    console.log(`   Analysis: ${embeddingType} (avg abs value: ${avgValue.toFixed(6)})`);
    
    // 4. Calculate similarity for each chunk
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
      
      if (!chunkEmbedding || chunkEmbedding.length !== 768) {
        console.log(`   ⚠️  Chunk ${data.chunkIndex} has invalid embedding`);
        continue;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      const preview = (data.text || '').substring(0, 100);
      
      results.push({
        sourceId: data.sourceId,
        chunkIndex: data.chunkIndex,
        similarity,
        preview
      });
      
      const similarityPercent = (similarity * 100).toFixed(1);
      const color = similarity >= 0.8 ? '🟢' : 
                    similarity >= 0.6 ? '🟡' : 
                    similarity >= 0.4 ? '🟠' : '🔴';
      
      console.log(`   ${color} Chunk #${data.chunkIndex}: ${similarityPercent}%`);
      console.log(`      Source: ${data.sourceId}`);
      console.log(`      Text: "${preview}..."`);
      console.log();
    }
    
    // 5. Analyze results
    console.log('=' .repeat(60));
    console.log('\n5️⃣  Analysis:\n');
    
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const maxSimilarity = Math.max(...results.map(r => r.similarity));
    const minSimilarity = Math.min(...results.map(r => r.similarity));
    
    console.log(`Average Similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log(`Max Similarity: ${(maxSimilarity * 100).toFixed(1)}%`);
    console.log(`Min Similarity: ${(minSimilarity * 100).toFixed(1)}%`);
    console.log(`Range: ${((maxSimilarity - minSimilarity) * 100).toFixed(1)}%`);
    
    // Determine if 50% is real or fallback
    console.log('\n📊 Diagnosis:\n');
    
    if (maxSimilarity < 0.3) {
      console.log('🚨 ISSUE CONFIRMED: All similarities are very low (<30%)');
      console.log('   This suggests:');
      console.log('   - Embeddings might be deterministic (hash-based)');
      console.log('   - OR documents are truly unrelated to query');
      console.log('   - RAG would fallback to full documents with 50% default');
    } else if (results.some(r => Math.abs(r.similarity - 0.5) < 0.01)) {
      console.log('🚨 ISSUE CONFIRMED: Found exact 50.0% scores');
      console.log('   This is the HARDCODED FALLBACK value');
      console.log('   RAG search is NOT finding relevant chunks');
    } else {
      console.log('✅ WORKING CORRECTLY: Similarities vary (not all 50%)');
      console.log('   Real semantic matching is working');
      console.log('   If users see 50%, it means those specific queries had no good matches');
    }
    
    // 6. Recommendations
    console.log('\n💡 Recommendations:\n');
    
    if (avgSimilarity < 0.4) {
      console.log('1. Lower minSimilarity threshold from 0.6 → 0.4');
      console.log('   Current: 60% is too strict for real queries');
      console.log('   Better: 40% catches more relevant docs');
    }
    
    if (embeddingType.includes('DETERMINISTIC')) {
      console.log('2. Verify Gemini embeddings API is being used:');
      console.log('   - Check logs for "Generated SEMANTIC embedding"');
      console.log('   - If missing, check GOOGLE_AI_API_KEY in .env');
      console.log('   - Re-index documents with: npm run index:documents');
    }
    
    console.log('3. Monitor RAG logs for "No chunks above similarity threshold"');
    console.log('   This confirms when fallback to 50% is triggered');
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
  }
  
  process.exit(0);
}

testSimilarityScores().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

