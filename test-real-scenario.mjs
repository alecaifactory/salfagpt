import { GoogleGenAI } from '@google/genai';

const NEW_KEY = 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0';
const genAI = new GoogleGenAI({ apiKey: NEW_KEY });

console.log('🎯 Testing REAL scenario: RAG + System Prompt + Streaming\n');

// Simulate real RAG context (in English first)
const ragContext = `
# Maintenance Manual - Scania P450
## Oil Change Interval
The hydraulic oil should be changed every 500 operating hours or 6 months, whichever comes first.
Recommended oil: Shell Tellus S2 M 46 or equivalent.
`;

// Test 1: English everything
console.log('Test 1: All in English');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: `Context:\n${ragContext}\n\nQuestion: How often to change hydraulic oil?` }] }
    ],
    config: {
      systemInstruction: 'You are a maintenance assistant. Answer based on the provided context.',
      maxOutputTokens: 100
    }
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
  }

  console.log(`   Chunks: ${count}`);
  console.log(`   Response (${fullText.length} chars): "${fullText.substring(0, 150)}..."`);
  
  if (count > 0) {
    console.log('   ✅ English works!');
  } else {
    console.log('   ❌ Empty response');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 1000));

// Test 2: Spanish question, English context
const ragContextES = `
# Manual de Mantenimiento - Scania P450
## Intervalo de Cambio de Aceite
El aceite hidráulico debe cambiarse cada 500 horas de operación o 6 meses, lo que ocurra primero.
Aceite recomendado: Shell Tellus S2 M 46 o equivalente.
`;

console.log('\n\nTest 2: Spanish question + context');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: `Contexto:\n${ragContextES}\n\nPregunta: ¿Cada cuántas horas cambiar aceite hidráulico?` }] }
    ],
    config: {
      systemInstruction: 'Eres un asistente de mantenimiento. Responde según el contexto proporcionado.',
      maxOutputTokens: 100
    }
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
  }

  console.log(`   Chunks: ${count}`);
  console.log(`   Response (${fullText.length} chars): "${fullText.substring(0, 150)}..."`);
  
  if (count > 0) {
    console.log('   ✅ Spanish works!');
  } else {
    console.log('   ❌ Empty response');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 1000));

// Test 3: Try WITHOUT system instruction (Spanish)
console.log('\n\nTest 3: Spanish WITHOUT system instruction');
try {
  const stream = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: 'Cuéntame sobre los elefantes en 20 palabras' }] }
    ],
    config: {
      maxOutputTokens: 100
    }
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
  }

  console.log(`   Chunks: ${count}`);
  console.log(`   Response (${fullText.length} chars): "${fullText}"`);
  
  if (count > 0) {
    console.log('   ✅ Works without system instruction!');
  } else {
    console.log('   ❌ Still empty');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE - Analyzing patterns...');
console.log('='.repeat(60));

process.exit(0);



