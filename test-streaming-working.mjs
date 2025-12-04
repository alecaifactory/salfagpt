import { GoogleGenAI } from '@google/genai';

const NEW_KEY = 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0';
const genAI = new GoogleGenAI({ apiKey: NEW_KEY });

console.log('🌊 Testing STREAMING with prompts that work\n');

// Test streaming with simple prompts
const prompts = [
  'Hola',
  'Hello',
  'Count from 1 to 10'
];

for (const prompt of prompts) {
  console.log(`\n📝 Streaming prompt: "${prompt}"`);
  try {
    const stream = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 50 }
    });

    let count = 0;
    let fullText = '';
    
    for await (const chunk of stream) {
      count++;
      const text = chunk.text || '';
      fullText += text;
      console.log(`   Chunk ${count}: "${text}"`);
    }

    console.log(`   ✅ Total chunks: ${count}, Full text: "${fullText}"`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  await new Promise(r => setTimeout(r, 500));
}

console.log('\n' + '='.repeat(60));
console.log('✅ STREAMING TEST COMPLETE');
console.log('='.repeat(60));

process.exit(0);



