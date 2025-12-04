import { GoogleGenAI } from '@google/genai';

const NEW_KEY = 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0';
const genAI = new GoogleGenAI({ apiKey: NEW_KEY });

console.log('📝 Testing SIMPLE content format (string instead of array)\n');

// Test 1: String format (simplest possible)
console.log('Test 1: Simple string format - English');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What is the capital of France?',  // Simple string
    config: { maxOutputTokens: 50 }
  });

  const text = result.text || '';
  console.log(`   Response: "${text}"`);
  console.log(`   ✅ Length: ${text.length} chars`);
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 500));

// Test 2: String format - Spanish
console.log('\n\nTest 2: Simple string format - Spanish');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: '¿Cuál es la capital de Francia?',  // Simple string in Spanish
    config: { maxOutputTokens: 50 }
  });

  const text = result.text || '';
  console.log(`   Response: "${text}"`);
  console.log(`   Length: ${text.length} chars`);
  
  if (text.length > 0) {
    console.log('   ✅ Spanish works with simple format!');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 500));

// Test 3: STREAMING with simple string
console.log('\n\nTest 3: STREAMING with simple string format');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: 'Cuenta del 1 al 5',  // Simple string
    config: { maxOutputTokens: 20 }
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
    console.log(`   Chunk ${count}: "${text}"`);
  }

  console.log(`   Total: ${count} chunks`);
  if (count > 0) {
    console.log('   ✅ Streaming works with simple string!');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

process.exit(0);



