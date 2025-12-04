import { GoogleGenAI } from "@google/genai";

// Use docs format - no apiKey in constructor
const ai = new GoogleGenAI({});

console.log('🧪 Testing EXACT format from official docs\n');
console.log('API Key from env (last 4):', process.env.GOOGLE_AI_API_KEY?.slice(-4) || 'NOT SET');
console.log('='.repeat(60));

// Test 1: Streaming (exact docs format)
console.log('\n🌊 Test 1: Streaming with docs format');
try {
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "How does AI work?",  // Simple string like docs
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
    console.log(`   Chunk ${count}: "${text}"`);
  }

  console.log(`\n   Total: ${count} chunks`);
  console.log(`   Full text (${fullText.length} chars): "${fullText}"`);
  
  if (count > 0) {
    console.log('   ✅ STREAMING WORKS with docs format!');
  } else {
    console.log('   ❌ Still empty');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log(`   Stack:`, error.stack?.substring(0, 500));
}

await new Promise(r => setTimeout(r, 1000));

// Test 2: Spanish with docs format
console.log('\n\n🇪🇸 Test 2: Spanish with docs format');
try {
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "¿Cómo funciona la inteligencia artificial?",
  });

  let count = 0;
  let fullText = '';
  
  for await (const chunk of stream) {
    count++;
    const text = chunk.text || '';
    fullText += text;
  }

  console.log(`   Total: ${count} chunks`);
  console.log(`   Full text: "${fullText.substring(0, 100)}..."`);
  
  if (count > 0) {
    console.log('   ✅ Spanish streaming works!');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 1000));

// Test 3: With system instruction
console.log('\n\n⚙️ Test 3: Streaming with system instruction');
try {
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "Explica mantenimiento de camiones",
    config: {
      systemInstruction: "Eres un experto en mantenimiento industrial.",
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

  console.log(`   Total: ${count} chunks`);
  console.log(`   Text: "${fullText.substring(0, 100)}..."`);
  
  if (count > 0) {
    console.log('   ✅ System instruction + streaming works!');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE');
console.log('='.repeat(60));

process.exit(0);



