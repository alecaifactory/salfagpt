/**
 * Test Real Similarity Scores
 * 
 * Makes actual API call to agent and shows exact similarity calculations
 */

async function testRealSimilarity() {
  console.log('🧪 Testing Real Similarity with Actual API Call\n');
  console.log('='.repeat(80));
  
  // Test configuration
  const agentId = 'KfoKcDrb6pMnduAiLlrD'; // MAQSA Mantenimiento S2
  const userId = 'usr_uhwqffaqag1wrryd82tw'; // alec@getaifactory.com
  const userEmail = 'alec@getaifactory.com';
  
  // Test query - specific question about Cummins maintenance
  const testQuery = "¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?";
  
  console.log('\n📋 Test Configuration:');
  console.log(`  Agent: ${agentId} (MAQSA Mantenimiento S2)`);
  console.log(`  User: ${userId}`);
  console.log(`  Query: "${testQuery}"`);
  console.log(`  Threshold: 70% (0.7)`);
  console.log('\n' + '='.repeat(80));
  
  try {
    console.log('\n🚀 Sending request to API...\n');
    
    const response = await fetch(`http://localhost:3000/api/conversations/${agentId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userEmail,
        message: testQuery,
        model: 'gemini-2.5-flash',
        systemPrompt: 'Eres un asistente técnico experto en mantenimiento de equipos. Responde de forma clara y precisa.',
        useAgentSearch: true,
        ragEnabled: true,
        ragTopK: 10,
        ragMinSimilarity: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ Response received!\n');
    console.log('='.repeat(80));
    
    // Extract RAG configuration
    const ragConfig = data.ragConfiguration || {};
    const references = data.message?.references || [];
    const aiResponseRaw = data.message?.content || '';
    const aiResponse = typeof aiResponseRaw === 'string' 
      ? aiResponseRaw 
      : aiResponseRaw?.text || JSON.stringify(aiResponseRaw);
    
    console.log('\n📊 RAG CONFIGURATION:');
    console.log('─'.repeat(80));
    console.log(`  Enabled: ${ragConfig.enabled}`);
    console.log(`  Actually Used: ${ragConfig.actuallyUsed}`);
    console.log(`  Had Fallback: ${ragConfig.hadFallback}`);
    console.log(`  TopK: ${ragConfig.topK}`);
    console.log(`  Min Similarity: ${ragConfig.minSimilarity} (${(ragConfig.minSimilarity * 100).toFixed(0)}%)`);
    
    if (ragConfig.stats) {
      console.log(`\n  📈 RAG Stats:`);
      console.log(`    Total Chunks: ${ragConfig.stats.totalChunks}`);
      console.log(`    Total Tokens: ${ragConfig.stats.totalTokens}`);
      console.log(`    Average Similarity: ${(ragConfig.stats.avgSimilarity * 100).toFixed(1)}%`);
      console.log(`    Sources Used: ${ragConfig.stats.sources?.length || 0}`);
    }
    
    console.log('\n📚 REFERENCES RETURNED:');
    console.log('─'.repeat(80));
    console.log(`  Count: ${references.length}`);
    
    if (references.length === 0) {
      console.log('\n  ⚠️ NO REFERENCES - This means:');
      console.log('    - No chunks found with similarity ≥70%');
      console.log('    - AI should inform user and provide admin contact');
      console.log('    - Check AI response below for admin email mention');
    } else {
      console.log('\n  Reference Details:\n');
      
      references.forEach((ref: any, index: number) => {
        const simPercent = ref.similarity !== undefined ? (ref.similarity * 100).toFixed(1) : 'N/A';
        const quality = ref.similarity >= 0.8 ? '🟢 EXCELLENT' : 
                       ref.similarity >= 0.7 ? '🟢 GOOD' :
                       ref.similarity >= 0.6 ? '🟡 MODERATE' :
                       ref.similarity >= 0.5 ? '🟠 LOW' : '🔴 VERY LOW';
        
        console.log(`  [${ref.id}] ${ref.sourceName}`);
        console.log(`      Similarity: ${simPercent}% ${quality}`);
        console.log(`      Chunk Index: ${ref.chunkIndex}`);
        console.log(`      Snippet: "${ref.snippet?.substring(0, 100)}..."`);
        console.log(`      Is Full Document: ${ref.metadata?.isFullDocument || false}`);
        
        if (ref.similarity === 0.5 && ref.metadata?.isFullDocument) {
          console.log(`      ⚠️ WARNING: This is the HARDCODED FALLBACK (50%)`);
          console.log(`         Not real similarity - used full document`);
        }
        
        console.log();
      });
      
      // Analyze similarity distribution
      const similarities = references
        .filter((r: any) => r.similarity !== undefined)
        .map((r: any) => r.similarity);
      
      if (similarities.length > 0) {
        const allSame = similarities.every((s: number) => Math.abs(s - similarities[0]) < 0.001);
        const all50 = similarities.every((s: number) => Math.abs(s - 0.5) < 0.001);
        
        console.log('  📊 Similarity Analysis:');
        console.log(`    Min: ${(Math.min(...similarities) * 100).toFixed(1)}%`);
        console.log(`    Max: ${(Math.max(...similarities) * 100).toFixed(1)}%`);
        console.log(`    Avg: ${(similarities.reduce((a: number, b: number) => a + b, 0) / similarities.length * 100).toFixed(1)}%`);
        console.log(`    Range: ${((Math.max(...similarities) - Math.min(...similarities)) * 100).toFixed(1)}%`);
        
        if (allSame) {
          console.log(`\n    ⚠️ ALL SIMILARITIES ARE IDENTICAL: ${(similarities[0] * 100).toFixed(1)}%`);
          if (all50) {
            console.log(`    🚨 PROBLEM: All are 50% - This is the FALLBACK VALUE`);
            console.log(`       RAG is not finding chunks above threshold`);
          }
        } else {
          console.log(`\n    ✅ SIMILARITIES VARY - Real semantic matching working`);
        }
      }
    }
    
    console.log('\n💬 AI RESPONSE (First 500 chars):');
    console.log('─'.repeat(80));
    console.log(aiResponse.substring(0, 500));
    if (aiResponse.length > 500) {
      console.log('...\n(truncated, full response is ' + aiResponse.length + ' chars)');
    }
    console.log();
    
    // Check for admin contact in response
    if (aiResponse.includes('@') && aiResponse.includes('administrador')) {
      console.log('\n✅ ADMIN CONTACT FOUND IN RESPONSE');
      console.log('   The no-relevant-docs flow is working!');
      
      // Extract email
      const emailMatch = aiResponse.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        console.log(`   Admin email mentioned: ${emailMatch[0]}`);
      }
    }
    
    // Check for Roadmap mention
    if (aiResponse.toLowerCase().includes('roadmap')) {
      console.log('\n✅ ROADMAP MENTIONED IN RESPONSE');
      console.log('   Feedback encouragement is working!');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 CONCLUSION:\n');
    
    if (references.length === 0) {
      console.log('❌ NO REFERENCES FOUND');
      console.log('   Either:');
      console.log('   a) No chunks exist for this agent (need indexing)');
      console.log('   b) All chunks have similarity <70% (working as intended)');
      console.log('\n   Check AI response - should mention admin contact + Roadmap');
      
    } else if (references.some((r: any) => r.similarity === 0.5)) {
      console.log('🟠 FALLBACK DETECTED (50% values)');
      console.log('   Some references are using the hardcoded fallback');
      console.log('   This means RAG did not find chunks above threshold');
      
    } else if (references.every((r: any) => r.similarity >= 0.7)) {
      console.log('✅ ALL REFERENCES ARE HIGH QUALITY (≥70%)');
      console.log('   Threshold is working correctly!');
      console.log('   Semantic matching is functioning!');
      
    } else {
      console.log('⚠️ MIXED QUALITY REFERENCES');
      console.log('   Some refs are below 70% threshold');
      console.log('   This should not happen with new code');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
  }
}

// Run test
testRealSimilarity();

