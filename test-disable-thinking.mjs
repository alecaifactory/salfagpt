import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || 'AIzaSyA8nlIbdDm8Man1rM0X1yWKgyaO6lQHax0'
});

console.log('🧠 Testing with THINKING DISABLED (thinkingBudget: 0)\n');
console.log('API Key (last 4):', process.env.GOOGLE_AI_API_KEY?.slice(-4) || 'Hax0');
console.log('='.repeat(60));

// Test 1: Non-streaming with thinking disabled
console.log('\n📝 Test 1: Non-streaming with thinkingBudget: 0');
try {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "¿Cada cuántas horas se cambia el aceite hidráulico en un camión?",
    config: {
      systemInstruction: "Eres un experto en mantenimiento de maquinaria pesada.",
      maxOutputTokens: 100,
      thinkingConfig: {
        thinkingBudget: 0  // Disable thinking
      }
    }
  });

  const text = result.text || '';
  console.log(`   Response (${text.length} chars): "${text}"`);
  
  if (text.length > 0) {
    console.log('   ✅ Non-streaming works with thinking disabled!');
  } else {
    console.log('   ❌ Still empty');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

await new Promise(r => setTimeout(r, 1000));

// Test 2: Streaming with thinking disabled
console.log('\n\n🌊 Test 2: STREAMING with thinkingBudget: 0');
try {
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "¿Cómo funciona un motor diesel?",
    config: {
      systemInstruction: "Responde de forma breve y clara.",
      maxOutputTokens: 100,
      thinkingConfig: {
        thinkingBudget: 0  // Disable thinking
      }
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

  console.log(`\n   Total: ${count} chunks`);
  console.log(`   Full text (${fullText.length} chars): "${fullText.substring(0, 100)}..."`);
  
  if (count > 0) {
    console.log('   🎉 STREAMING WORKS with thinking disabled!');
  } else {
    console.log('   ❌ Streaming still returns 0 chunks (403 permission issue)');
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  if (error.status === 403) {
    console.log('   💡 Confirmed: API key lacks streaming permissions');
  }
}

console.log('\n' + '='.repeat(60));
console.log('CONCLUSION:');
console.log('If test 1 works but test 2 fails → Use non-streaming workaround');
console.log('='.repeat(60));

process.exit(0);



