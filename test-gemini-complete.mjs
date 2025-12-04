import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY 
});

console.log('🧪 COMPREHENSIVE Gemini API Test\n');
console.log('API Key (last 4 chars):', process.env.GOOGLE_AI_API_KEY?.slice(-4) || 'NOT SET');
console.log('='.repeat(60));

// Test 1: Embeddings (we know this works)
console.log('\n📊 Test 1: Embeddings (baseline)...');
try {
  const embeddingResult = await genAI.models.embedContent({
    model: 'text-embedding-004',
    content: 'test'
  });
  console.log('✅ Embeddings work!');
  console.log('   Embedding dimensions:', embeddingResult.embedding?.values?.length || 0);
} catch (error) {
  console.log('❌ Embeddings failed:', error.message);
}

// Test 2: Non-streaming generation
console.log('\n📝 Test 2: Non-streaming generateContent()...');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Di "hola" en una palabra' }] }],
    config: { maxOutputTokens: 5 }
  });

  const text = result.text || '';
  console.log('✅ Non-streaming works!');
  console.log('   Response:', text);
  console.log('   Length:', text.length, 'chars');
} catch (error) {
  console.log('❌ Non-streaming failed');
  console.log('   Error:', error.message);
  console.log('   Code:', error.status);
}

// Test 3: Streaming generation
console.log('\n🌊 Test 3: Streaming generateContentStream()...');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Di "hola" en una palabra' }] }],
    config: { maxOutputTokens: 5 }
  });

  console.log('✅ Stream object received');
  
  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
    console.log(`   Chunk ${count}:`, text);
  }

  if (count > 0) {
    console.log('✅ Streaming works!');
    console.log('   Total chunks:', count);
    console.log('   Full text:', fullText);
  } else {
    console.log('❌ Streaming returned 0 chunks (done: true immediately)');
  }
} catch (error) {
  console.log('❌ Streaming failed');
  console.log('   Error:', error.message);
  console.log('   Code:', error.status);
}

console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY:');
console.log('   Embeddings: Check above');
console.log('   Non-streaming: Check above');
console.log('   Streaming: Check above');
console.log('='.repeat(60));

process.exit(0);



