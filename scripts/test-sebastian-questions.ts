/**
 * Test Sebastian's exact questions on S1 and M1
 * Evaluate quality of responses and references
 */

const BASE_URL = 'http://localhost:3000';

// Sebastian's questions for S1
const S1_QUESTIONS = [
  "¿Cómo se hace una Solped?",
  "¿Cómo genero el informe de consumo de petróleo?",
  "¿Qué es una ST?",
  "¿Cómo solicito una capacitación de bodega fácil (BF)?",
];

// Sebastian's questions for M1
const M1_QUESTIONS = [
  "¿Qué es un OGUC?",
  "¿Me puedes decir la diferencia entre un Loteo DFL2 y un Loteo con Construcción Simultánea?",
  "¿Cuál es la diferencia entre condominio tipo a y tipo b?",
];

interface TestResult {
  agentId: string;
  agentName: string;
  question: string;
  response: string;
  references: any[];
  hasValidReferences: boolean;
  hasGarbageFragments: boolean;
  responseQuality: 'poor' | 'fair' | 'good' | 'excellent';
  issues: string[];
}

async function findAgent(searchTerm: string): Promise<{ id: string; name: string } | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/conversations?userId=114671162830729001607`);
    
    if (!response.ok) {
      console.error(`   API Error ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    for (const group of data.groups || []) {
      for (const conv of group.conversations || []) {
        const title = conv.title || '';
        // More flexible matching
        if (title.includes(searchTerm) ||
            (searchTerm === 'S001' && (title.includes('BODEGAS') || title.includes('S001'))) ||
            (searchTerm === 'M001' && (title.includes('Legal') || title.includes('M001') || title.includes('RDI')))) {
          return { id: conv.id, name: title };
        }
      }
    }
    
    console.log(`   No match for "${searchTerm}" in ${data.groups?.length || 0} groups`);
    return null;
  } catch (error) {
    console.error('   Error finding agent:', error.message);
    return null;
  }
}

async function askQuestion(agentId: string, question: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${agentId}/messages-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '114671162830729001607',
        message: question,
        model: 'gemini-2.0-flash-exp',
        systemPrompt: 'Eres un asistente experto. Responde de manera clara y precisa.',
      })
    });
    
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    
    // Parse streaming response
    const reader = response.body?.getReader();
    if (!reader) return { error: 'No reader' };
    
    let fullResponse = '';
    let references = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const text = new TextDecoder().decode(value);
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              fullResponse += data.content;
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
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

function evaluateResponse(result: any, question: string): TestResult['responseQuality'] {
  const response = result.response || '';
  const refs = result.references || [];
  
  // Check if response is relevant
  const hasContent = response.length > 100;
  const hasReferences = refs.length > 0;
  const notGeneric = !response.includes('no tengo información') && 
                     !response.includes('no está disponible');
  
  if (!hasContent) return 'poor';
  if (!notGeneric) return 'fair';
  if (hasReferences && hasContent) return 'excellent';
  if (hasContent && notGeneric) return 'good';
  
  return 'fair';
}

function checkGarbageFragments(references: any[]): boolean {
  if (!references || references.length === 0) return false;
  
  let garbageCount = 0;
  
  for (const ref of references) {
    const text = ref.snippet || ref.fullText || '';
    
    // Check for garbage patterns
    if (text.match(/^1\.\s+INTRODUCCIÓN\s*\.{5,}/) ||
        text.match(/^página\s+\d+\s+de\s+\d+$/i) ||
        text.length < 50) {
      garbageCount++;
    }
  }
  
  return (garbageCount / references.length) > 0.5; // >50% garbage
}

async function testAgent(
  agentName: string,
  questions: string[]
): Promise<TestResult[]> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing: ${agentName}`);
  console.log(`${'='.repeat(70)}\n`);
  
  // Find agent
  console.log(`🔍 Buscando agente...`);
  const agent = await findAgent(agentName);
  
  if (!agent) {
    console.log(`❌ Agente no encontrado`);
    return [];
  }
  
  console.log(`✅ Encontrado: ${agent.name} (${agent.id})\n`);
  
  const results: TestResult[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`📝 [${i + 1}/${questions.length}] ${question}`);
    
    const answer = await askQuestion(agent.id, question);
    
    if (answer.error) {
      console.log(`   ❌ Error: ${answer.error}\n`);
      continue;
    }
    
    const hasRefs = (answer.references || []).length > 0;
    const hasGarbage = checkGarbageFragments(answer.references);
    const quality = evaluateResponse(answer, question);
    
    const issues = [];
    if (!hasRefs) issues.push('No references');
    if (hasGarbage) issues.push('Garbage fragments');
    if (quality === 'poor') issues.push('Poor response quality');
    
    console.log(`   ✅ Respuesta: ${answer.response?.substring(0, 100)}...`);
    console.log(`   📚 Referencias: ${answer.references?.length || 0}`);
    console.log(`   🎯 Calidad: ${quality}`);
    if (issues.length > 0) {
      console.log(`   ⚠️ Issues: ${issues.join(', ')}`);
    }
    console.log();
    
    results.push({
      agentId: agent.id,
      agentName: agent.name,
      question,
      response: answer.response || '',
      references: answer.references || [],
      hasValidReferences: hasRefs,
      hasGarbageFragments: hasGarbage,
      responseQuality: quality,
      issues,
    });
  }
  
  return results;
}

async function main() {
  console.log('🚀 Evaluación de Calidad - Feedback Sebastian\n');
  console.log('   Testing preguntas específicas reportadas');
  console.log('   Evaluando calidad de respuestas y referencias\n');
  
  // Test S1
  const s1Results = await testAgent('S001', S1_QUESTIONS);
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test M1
  const m1Results = await testAgent('M001', M1_QUESTIONS);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE EVALUACIÓN');
  console.log('='.repeat(70));
  console.log();
  
  const allResults = [...s1Results, ...m1Results];
  
  console.log('📈 Métricas Globales:\n');
  
  const excellentCount = allResults.filter(r => r.responseQuality === 'excellent').length;
  const goodCount = allResults.filter(r => r.responseQuality === 'good').length;
  const fairCount = allResults.filter(r => r.responseQuality === 'fair').length;
  const poorCount = allResults.filter(r => r.responseQuality === 'poor').length;
  
  console.log(`   Excellent: ${excellentCount} (${(excellentCount/allResults.length*100).toFixed(1)}%)`);
  console.log(`   Good: ${goodCount} (${(goodCount/allResults.length*100).toFixed(1)}%)`);
  console.log(`   Fair: ${fairCount} (${(fairCount/allResults.length*100).toFixed(1)}%)`);
  console.log(`   Poor: ${poorCount} (${(poorCount/allResults.length*100).toFixed(1)}%)`);
  console.log();
  
  const withRefs = allResults.filter(r => r.hasValidReferences).length;
  const withGarbage = allResults.filter(r => r.hasGarbageFragments).length;
  
  console.log(`   Con referencias: ${withRefs}/${allResults.length}`);
  console.log(`   Con basura: ${withGarbage}/${allResults.length}`);
  console.log();
  
  console.log('📊 Por Agente:\n');
  
  const s1Excellent = s1Results.filter(r => r.responseQuality === 'excellent').length;
  const m1Excellent = m1Results.filter(r => r.responseQuality === 'excellent').length;
  
  console.log(`   S1: ${s1Excellent}/${s1Results.length} excellent`);
  console.log(`   M1: ${m1Excellent}/${m1Results.length} excellent`);
  console.log();
  
  console.log('🎯 ¿Listos para producción?');
  const acceptableRate = (excellentCount + goodCount) / allResults.length;
  
  if (acceptableRate >= 0.7) {
    console.log(`   ✅ SÍ - ${(acceptableRate * 100).toFixed(1)}% calidad aceptable`);
  } else {
    console.log(`   ❌ NO - Solo ${(acceptableRate * 100).toFixed(1)}% calidad aceptable`);
    console.log(`   🎯 Objetivo: ≥70% excellent+good`);
  }
  
  // Save results to JSON
  const { writeFileSync, mkdirSync, existsSync } = await import('fs');
  const resultsDir = 'bulk_evaluation';
  
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  
  writeFileSync(
    `${resultsDir}/sebastian_test_results.json`,
    JSON.stringify(allResults, null, 2)
  );
  
  console.log(`\n💾 Resultados guardados en: ${resultsDir}/sebastian_test_results.json`);
  
  process.exit(0);
}

main();

