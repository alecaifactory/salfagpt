import { GoogleGenAI } from '@google/genai';

// Hardcode the new key for this test
const NEW_KEY = 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0';

const genAI = new GoogleGenAI({ apiKey: NEW_KEY });

console.log('🧪 Testing NEW API Key (ends in ...ax0)\n');
console.log('='.repeat(60));

// Test Non-streaming
console.log('\n📝 Test: Non-streaming generateContent()...');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Di "hola" en una palabra' }] }],
    config: { maxOutputTokens: 10 }
  });

  const text = result.text || '';
  console.log('✅ SUCCESS! Non-streaming works!');
  console.log('   Response:', text);
  console.log('   Length:', text.length, 'chars');
} catch (error) {
  console.log('❌ Non-streaming failed');
  console.log('   Error:', error.message);
  console.log('   Code:', error.status);
  process.exit(1);
}

// Test Streaming
console.log('\n🌊 Test: Streaming generateContentStream()...');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Di "hola" en una palabra' }] }],
    config: { maxOutputTokens: 10 }
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
    console.log(`   Chunk ${count}:`, text);
  }

  if (count > 0) {
    console.log('✅ SUCCESS! Streaming works!');
    console.log('   Total chunks:', count);
    console.log('   Full text:', fullText);
  } else {
    console.log('❌ Streaming returned 0 chunks');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Streaming failed');
  console.log('   Error:', error.message);
  console.log('   Code:', error.status);
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 ALL TESTS PASSED! API key is working correctly!');
console.log('='.repeat(60));

process.exit(0);



