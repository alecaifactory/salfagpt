import { GoogleGenAI } from '@google/genai';

const NEW_KEY = 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0';
const genAI = new GoogleGenAI({ apiKey: NEW_KEY });

console.log('🧪 Testing Gemini with Different Variations\n');

// Test 1: Different prompts
const prompts = [
  'Hola',
  'Hello',
  '¿Qué es el cielo?',
  'Explain quantum physics in one sentence',
  'Count from 1 to 5'
];

for (const prompt of prompts) {
  console.log(`\n📝 Testing prompt: "${prompt}"`);
  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 100 }
    });

    const text = result.text || '';
    console.log(`   Response length: ${text.length} chars`);
    if (text.length > 0) {
      console.log(`   Response: "${text.substring(0, 100)}..."`);
    } else {
      console.log(`   ❌ Empty response`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Small delay between requests
  await new Promise(r => setTimeout(r, 500));
}

// Test 2: Try gemini-1.5-flash (older model)
console.log('\n\n🔄 Testing older model: gemini-1.5-flash');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }],
    config: { maxOutputTokens: 20 }
  });

  const text = result.text || '';
  console.log(`✅ gemini-1.5-flash response: "${text}"`);
  console.log(`   Length: ${text.length} chars`);
} catch (error) {
  console.log(`❌ gemini-1.5-flash error: ${error.message}`);
}

// Test 3: Try with system instruction
console.log('\n\n⚙️ Testing WITH system instruction');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    config: {
      systemInstruction: 'You are a helpful assistant. Always respond.',
      maxOutputTokens: 20
    }
  });

  const text = result.text || '';
  console.log(`   Response: "${text}"`);
  console.log(`   Length: ${text.length} chars`);
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

process.exit(0);



