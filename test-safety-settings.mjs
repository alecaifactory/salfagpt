import { GoogleGenAI } from '@google/genai';

const NEW_KEY = 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0';
const genAI = new GoogleGenAI({ apiKey: NEW_KEY });

console.log('🛡️ Testing with Safety Settings Adjusted\n');

// Test with PERMISSIVE safety settings
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE'
  }
];

// Test 1: Spanish question with permissive settings
console.log('Test 1: Spanish with BLOCK_NONE safety');
try {
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: '¿Qué es el cielo?' }] }],
    config: {
      maxOutputTokens: 100,
      safetySettings: safetySettings
    }
  });

  const text = result.text || '';
  console.log(`   Response (${text.length} chars): "${text}"`);
  
  if (text.length > 0) {
    console.log('   ✅ Safety settings fixed it!');
  } else {
    console.log('   ❌ Still empty');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 1000));

// Test 2: Complex prompt with context
const ragContext = `
# Manual de Mantenimiento - Scania P450
El aceite hidráulico debe cambiarse cada 500 horas de operación.
`;

console.log('\n\nTest 2: RAG context with safety settings');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: `Contexto:\n${ragContext}\n\nPregunta: ¿Cada cuántas horas?` }] }
    ],
    config: {
      systemInstruction: 'Responde basándote en el contexto.',
      maxOutputTokens: 50,
      safetySettings: safetySettings
    }
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
    console.log(`   Chunk ${count}: "${text}"`);
  }

  console.log(`   Total: ${count} chunks, Text: "${fullText}"`);
  
  if (count > 0) {
    console.log('   ✅ RAG with safety settings works!');
  } else {
    console.log('   ❌ Still empty');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('SAFETY SETTINGS TEST COMPLETE');
console.log('='.repeat(60));

process.exit(0);



