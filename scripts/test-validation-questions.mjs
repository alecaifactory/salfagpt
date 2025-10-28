import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const BASE_URL = 'http://localhost:3000';
const USER_ID = 'alec_getaifactory_com';

const firestore = new Firestore({
  projectId: PROJECT_ID
});

// Validation questions
const VALIDATION_TESTS = [
  {
    agent: 'M001',
    agentSearch: 'Legal Territorial',
    question: '¿Qué es un OGUC?',
    checkFor: {
      noHallucination: true, // No [7] si solo hay 5
      noGarbage: true,       // No "INTRODUCCIÓN ..."
      usefulFragments: true,  // 4-5 de 5 útiles
    }
  },
  {
    agent: 'S001',
    agentSearch: 'BODEGAS',
    question: '¿Cómo genero el informe de consumo de petróleo?',
    checkFor: {
      hasReferences: true,    // Muestra referencias
      specificSteps: true,    // Da pasos concretos
      usesContent: true,      // No solo "consulta doc X"
    }
  }
];

async function findAgent(searchTerm) {
  const allConvs = await firestore.collection('conversations').get();
  
  for (const doc of allConvs.docs) {
    const title = doc.data().title || '';
    if (title.includes(searchTerm)) {
      return { id: doc.id, title };
    }
  }
  
  return null;
}

async function askQuestion(agentId, question) {
  console.log(`   🔄 Enviando pregunta via API...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${agentId}/messages-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        message: question,
        model: 'gemini-2.0-flash-exp',
        systemPrompt: 'Eres un asistente experto. Responde de manera clara y precisa basándote en los documentos proporcionados.',
      })
    });
    
    if (!response.ok) {
      console.log(`   ❌ Error HTTP ${response.status}`);
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 200)}`);
      return { error: `HTTP ${response.status}` };
    }
    
    // Parse streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let fullResponse = '';
    let references = [];
    let thinkingSteps = null;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              fullResponse += data.content;
            } else if (data.type === 'thinking') {
              thinkingSteps = data.steps;
            } else if (data.type === 'complete') {
              references = data.references || [];
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
    
    return {
      response: fullResponse,
      references,
      thinkingSteps
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

function evaluateResponse(result, checks) {
  const response = result.response || '';
  const refs = result.references || [];
  
  const evaluation = {
    passed: true,
    details: {}
  };
  
  // Check for hallucination
  if (checks.noHallucination) {
    const refNumbers = refs.map((r, i) => i + 1);
    const maxValidRef = Math.max(...refNumbers, 0);
    
    // Find any reference numbers in response that are > maxValidRef
    const refMatches = response.match(/\[(\d+)\]/g) || [];
    const usedRefs = refMatches.map(m => parseInt(m.match(/\d+/)[0]));
    const invalidRefs = usedRefs.filter(n => n > maxValidRef);
    
    evaluation.details.noHallucination = {
      passed: invalidRefs.length === 0,
      maxValid: maxValidRef,
      invalid: invalidRefs
    };
    
    if (invalidRefs.length > 0) {
      evaluation.passed = false;
    }
  }
  
  // Check for garbage fragments
  if (checks.noGarbage) {
    let garbageCount = 0;
    
    for (const ref of refs) {
      const text = ref.snippet || ref.fullText || '';
      
      if (text.match(/^1\.\s+INTRODUCCIÓN\s*\.{5,}/) ||
          text.match(/^página\s+\d+\s+de\s+\d+$/i) ||
          text.length < 50) {
        garbageCount++;
      }
    }
    
    const garbageRate = refs.length > 0 ? garbageCount / refs.length : 0;
    
    evaluation.details.noGarbage = {
      passed: garbageRate < 0.2, // <20% garbage acceptable
      garbageCount,
      totalRefs: refs.length,
      garbageRate: (garbageRate * 100).toFixed(1) + '%'
    };
    
    if (garbageRate >= 0.2) {
      evaluation.passed = false;
    }
  }
  
  // Check for useful fragments
  if (checks.usefulFragments) {
    const usefulCount = refs.filter(ref => {
      const text = ref.snippet || ref.fullText || '';
      return text.length >= 50 && 
             !text.match(/^1\.\s+INTRODUCCIÓN/) &&
             !text.match(/^página\s+\d+/i);
    }).length;
    
    const usefulRate = refs.length > 0 ? usefulCount / refs.length : 0;
    
    evaluation.details.usefulFragments = {
      passed: usefulRate >= 0.8, // >=80% useful
      usefulCount,
      totalRefs: refs.length,
      usefulRate: (usefulRate * 100).toFixed(1) + '%'
    };
    
    if (usefulRate < 0.8) {
      evaluation.passed = false;
    }
  }
  
  // Check for references
  if (checks.hasReferences) {
    evaluation.details.hasReferences = {
      passed: refs.length > 0,
      count: refs.length
    };
    
    if (refs.length === 0) {
      evaluation.passed = false;
    }
  }
  
  // Check for specific steps
  if (checks.specificSteps) {
    const hasSteps = response.match(/\d+\.\s+/g) || 
                     response.includes('paso') ||
                     response.includes('actividad') ||
                     response.includes('responsable');
    
    evaluation.details.specificSteps = {
      passed: hasSteps !== null,
      hasNumberedSteps: (response.match(/\d+\.\s+/g) || []).length > 0
    };
    
    if (!hasSteps) {
      evaluation.passed = false;
    }
  }
  
  // Check uses content (not just mentions)
  if (checks.usesContent) {
    const justMentions = response.includes('consulta el instructivo') ||
                         response.includes('deberás buscar') ||
                         response.includes('no se encuentra incluido');
    
    evaluation.details.usesContent = {
      passed: !justMentions && response.length > 200,
      responseLength: response.length,
      justMentions
    };
    
    if (justMentions) {
      evaluation.passed = false;
    }
  }
  
  return evaluation;
}

async function main() {
  console.log('🧪 VALIDACIÓN POST RE-INDEXING\n');
  console.log('   Testing 2 preguntas clave reportadas por Sebastian');
  console.log('   Validando fixes FB-002 y FB-003\n');
  
  const results = [];
  
  for (const test of VALIDATION_TESTS) {
    console.log(`${'='.repeat(70)}`);
    console.log(`📝 Test: ${test.agent} - "${test.question}"`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Find agent
    console.log(`🔍 Buscando agente ${test.agent}...`);
    const agent = await findAgent(test.agentSearch);
    
    if (!agent) {
      console.log(`   ❌ No encontrado\n`);
      continue;
    }
    
    console.log(`   ✅ ${agent.title} (${agent.id})\n`);
    
    // Ask question
    console.log(`❓ Pregunta: "${test.question}"`);
    const answer = await askQuestion(agent.id, test.question);
    
    if (answer.error) {
      console.log(`   ❌ Error: ${answer.error}\n`);
      continue;
    }
    
    console.log(`\n📝 Respuesta (primeros 300 chars):`);
    console.log(`   ${answer.response.substring(0, 300)}...\n`);
    
    console.log(`📚 Referencias: ${answer.references.length}`);
    if (answer.references.length > 0) {
      answer.references.slice(0, 5).forEach((ref, i) => {
        const snippet = (ref.snippet || ref.fullText || '').substring(0, 80);
        console.log(`   [${i+1}] ${ref.sourceName}: ${snippet}...`);
      });
    }
    console.log();
    
    // Evaluate
    console.log(`🔍 Evaluando calidad...`);
    const evaluation = evaluateResponse(answer, test.checkFor);
    
    console.log(`\n📊 Resultados de Evaluación:\n`);
    
    for (const [check, result] of Object.entries(evaluation.details)) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`   ${icon} ${check}:`, result.passed ? 'PASS' : 'FAIL');
      
      if (check === 'noHallucination' && result.invalid?.length > 0) {
        console.log(`      Refs inválidas encontradas: [${result.invalid.join('][')}]`);
      }
      if (check === 'noGarbage') {
        console.log(`      Basura: ${result.garbageCount}/${result.totalRefs} (${result.garbageRate})`);
      }
      if (check === 'usefulFragments') {
        console.log(`      Útiles: ${result.usefulCount}/${result.totalRefs} (${result.usefulRate})`);
      }
    }
    
    console.log(`\n🎯 Resultado General: ${evaluation.passed ? '✅ PASS' : '❌ FAIL'}\n`);
    
    results.push({
      agent: test.agent,
      question: test.question,
      response: answer.response,
      references: answer.references,
      evaluation,
      passed: evaluation.passed
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE VALIDACIÓN');
  console.log('='.repeat(70));
  console.log();
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`   Tests ejecutados: ${totalCount}`);
  console.log(`   ✅ Pasados: ${passedCount}`);
  console.log(`   ❌ Fallados: ${totalCount - passedCount}`);
  console.log(`   📈 Tasa de éxito: ${(passedCount/totalCount*100).toFixed(1)}%\n`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ✅ VALIDACIÓN EXITOSA');
    console.log('   Todos los fixes funcionan correctamente');
    console.log('   Listo para evaluación masiva\n');
  } else {
    console.log('⚠️ VALIDACIÓN PARCIAL');
    console.log('   Algunos tests fallaron - revisar detalles arriba');
    console.log('   Considerar más fixes antes de evaluación masiva\n');
  }
  
  // Save results
  const { writeFileSync, mkdirSync, existsSync } = await import('fs');
  const dir = 'bulk_evaluation';
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(
    `${dir}/validation_results.json`,
    JSON.stringify(results, null, 2)
  );
  
  console.log(`💾 Resultados guardados: ${dir}/validation_results.json\n`);
  
  process.exit(passedCount === totalCount ? 0 : 1);
}

main();

