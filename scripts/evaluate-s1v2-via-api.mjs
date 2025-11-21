#!/usr/bin/env node

/**
 * Evaluate S1-v2 agent via direct API calls
 * Tests questions and analyzes responses automatically
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const BASE_URL = 'http://localhost:3000';
const AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye'; // S1-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // dundurraga (agent owner)

// Test questions from evaluation
const TEST_QUESTIONS = [
  {
    id: 1,
    question: '¿Cómo hago un pedido de convenio?',
    expectedKeyInfo: ['ME21N', 'ZCON', 'tipo de pedido', 'convenio'],
    criticalErrors: ['ME51N', 'ZBOL', 'día 15'],
    context: 'Usuario pregunta sobre proceso de pedidos de convenio en SAP'
  },
  {
    id: 2,
    question: '¿Cuándo debo enviar el informe de consumo de petróleo?',
    expectedKeyInfo: ['4to día hábil', 'ZMM_IE', 'mes siguiente', 'Petróleo Diésel'],
    criticalErrors: [],
    context: 'Usuario pregunta sobre plazo de entrega del informe de consumo'
  }
];

/**
 * Call messages-stream API directly (bypass auth)
 */
async function sendQuestion(question, testNum) {
  const conversationId = `eval-test-${testNum}-${Date.now()}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${testNum}: ${question.question}`);
  console.log('='.repeat(80));
  console.log(`Context: ${question.context}`);
  console.log(`Conversation ID: ${conversationId}`);
  
  try {
    console.log('\n📤 Sending question via API...');
    const startTime = Date.now();
    
    // Call API endpoint directly
    const url = `${BASE_URL}/api/conversations/${conversationId}/messages-stream`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        userId: USER_ID,
        message: question.question,
        agentId: AGENT_ID,
        useAgentSearch: true,
        activeSourceIds: [], // Use all agent sources
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ API Error (${response.status}):`);
      console.error(errorText.substring(0, 500));
      return null;
    }
    
    // Parse streaming response
    console.log('📥 Receiving streaming response...');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    let fullResponse = '';
    let references = [];
    let chunks = [];
    let ragStats = null;
    let fragmentMapping = [];
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      
      try {
        const jsonStr = line.substring(6).trim();
        if (!jsonStr) continue;
        
        const data = JSON.parse(jsonStr);
        
        if (data.type === 'chunk') {
          fullResponse += data.content;
          process.stdout.write('.'); // Progress indicator
        } else if (data.type === 'references') {
          references = data.references || [];
        } else if (data.type === 'chunks') {
          chunks = data.chunks || [];
        } else if (data.type === 'fragmentMapping') {
          fragmentMapping = data.mapping || [];
        } else if (data.type === 'complete') {
          ragStats = data.ragConfiguration;
        } else if (data.type === 'status') {
          // Status updates
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    const responseTime = Date.now() - startTime;
    console.log('\n✅ Response received\n');
    
    return {
      question: question.question,
      response: fullResponse,
      references,
      chunks,
      fragmentMapping,
      ragStats,
      responseTime,
      expectedKeyInfo: question.expectedKeyInfo,
      criticalErrors: question.criticalErrors
    };
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return null;
  }
}

/**
 * Analyze response content
 */
function analyzeContent(result) {
  console.log('📊 CONTENT ANALYSIS');
  console.log('─'.repeat(80));
  
  const response = result.response.toUpperCase();
  
  // Check for expected key information
  const foundKeyInfo = result.expectedKeyInfo.filter(key => 
    response.includes(key.toUpperCase())
  );
  
  const missingKeyInfo = result.expectedKeyInfo.filter(key => 
    !response.includes(key.toUpperCase())
  );
  
  console.log(`\n✅ Expected Information Found (${foundKeyInfo.length}/${result.expectedKeyInfo.length}):`);
  foundKeyInfo.forEach(key => {
    console.log(`   ✓ "${key}"`);
  });
  
  if (missingKeyInfo.length > 0) {
    console.log(`\n❌ Missing Key Information (${missingKeyInfo.length}):`);
    missingKeyInfo.forEach(key => {
      console.log(`   ✗ "${key}"`);
    });
  }
  
  // Check for critical errors
  const foundErrors = result.criticalErrors.filter(error => 
    response.includes(error.toUpperCase())
  );
  
  if (foundErrors.length > 0) {
    console.log(`\n🚨 CRITICAL ERRORS FOUND (${foundErrors.length}):`);
    foundErrors.forEach(error => {
      console.log(`   ⚠️  "${error}" - INCORRECT INFORMATION!`);
    });
  }
  
  return { foundKeyInfo, missingKeyInfo, foundErrors };
}

/**
 * Analyze response format
 */
function analyzeFormat(response) {
  console.log('\n📋 FORMAT ANALYSIS');
  console.log('─'.repeat(80));
  
  const hasMarkdownBold = /\*\*[^*]+\*\*/.test(response);
  const hasMarkdownList = /\n\s*[-*]\s+/.test(response);
  const hasNumberedList = /\n\s*\d+\.\s+/.test(response);
  const hasSections = /\n\n/.test(response);
  const wordCount = response.split(/\s+/).length;
  
  console.log(`   Bold text (** **):        ${hasMarkdownBold ? '✅' : '❌'}`);
  console.log(`   Bullet points (- or *):   ${hasMarkdownList ? '✅' : '❌'}`);
  console.log(`   Numbered lists (1. 2.):   ${hasNumberedList ? '✅' : '❌'}`);
  console.log(`   Paragraph breaks:         ${hasSections ? '✅' : '❌'}`);
  console.log(`   Word count:               ${wordCount} words`);
  
  // Check if it's a "wall of text"
  const avgWordsPerParagraph = hasSections 
    ? wordCount / response.split('\n\n').length 
    : wordCount;
  
  const isWallOfText = avgWordsPerParagraph > 100;
  
  if (isWallOfText) {
    console.log(`   ⚠️  Wall of text detected (${avgWordsPerParagraph.toFixed(0)} words/paragraph)`);
  }
  
  return {
    hasMarkdownBold,
    hasMarkdownList,
    hasNumberedList,
    hasSections,
    wordCount,
    isWallOfText
  };
}

/**
 * Analyze RAG usage
 */
function analyzeRAG(result) {
  console.log('\n🔍 RAG ANALYSIS');
  console.log('─'.repeat(80));
  
  console.log(`   RAG Enabled:     ${result.ragStats?.enabled ? '✅' : '❌'}`);
  console.log(`   RAG Used:        ${result.ragStats?.actuallyUsed ? '✅' : '❌'}`);
  console.log(`   References:      ${result.references.length}`);
  console.log(`   Chunks:          ${result.chunks.length}`);
  console.log(`   Fragment Maps:   ${result.fragmentMapping.length}`);
  
  if (result.references.length > 0) {
    console.log('\n📚 REFERENCES:');
    result.references.forEach((ref, idx) => {
      console.log(`   [${idx + 1}] ${ref.sourceName}`);
      console.log(`       Similarity: ${(ref.similarity * 100).toFixed(1)}%`);
      console.log(`       Chunk: #${ref.chunkIndex + 1}`);
    });
  } else {
    console.log('   ⚠️  NO REFERENCES FOUND');
  }
  
  return {
    ragEnabled: result.ragStats?.enabled || false,
    ragUsed: result.ragStats?.actuallyUsed || false,
    referencesCount: result.references.length,
    chunksCount: result.chunks.length
  };
}

/**
 * Calculate overall score
 */
function calculateScore(contentAnalysis, formatAnalysis, ragAnalysis) {
  console.log('\n🎯 OVERALL SCORE');
  console.log('─'.repeat(80));
  
  let score = 'Sobresaliente';
  let reasoning = [];
  let recommendation = 5;
  let satisfaction = 5;
  
  // Content checks
  if (contentAnalysis.foundErrors.length > 0) {
    score = 'Inaceptable';
    recommendation = 1;
    satisfaction = 1;
    reasoning.push(`Contiene ${contentAnalysis.foundErrors.length} error(es) crítico(s)`);
  } else if (contentAnalysis.missingKeyInfo.length > 0) {
    if (contentAnalysis.missingKeyInfo.length > 1) {
      score = 'Inaceptable';
      recommendation = 2;
      satisfaction = 2;
      reasoning.push(`Falta información crítica: ${contentAnalysis.missingKeyInfo.join(', ')}`);
    } else {
      score = 'Aceptable';
      recommendation = 3;
      satisfaction = 3;
      reasoning.push(`Falta 1 dato clave: ${contentAnalysis.missingKeyInfo[0]}`);
    }
  }
  
  // Format checks (only downgrade if already Sobresaliente)
  if (score === 'Sobresaliente' && formatAnalysis.isWallOfText) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('Formato difícil de leer (muro de texto)');
  }
  
  if (score === 'Sobresaliente' && !formatAnalysis.hasMarkdownBold && !formatAnalysis.hasMarkdownList) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('Falta estructura (sin negritas ni listas)');
  }
  
  // RAG checks (critical for Sobresaliente)
  if (score === 'Sobresaliente' && !ragAnalysis.ragUsed) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('RAG no utilizado (respuesta genérica)');
  }
  
  if (score === 'Sobresaliente' && ragAnalysis.referencesCount === 0) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('No muestra referencias');
  }
  
  // Perfect score
  if (score === 'Sobresaliente' && reasoning.length === 0) {
    reasoning.push('Información completa, formato excelente, RAG usado, referencias mostradas');
  }
  
  console.log(`   Calificación:         ${score}`);
  console.log(`   Recomendación (1-5):  ${recommendation}`);
  console.log(`   Satisfacción (1-5):   ${satisfaction}`);
  console.log(`\n   Razonamiento:`);
  reasoning.forEach(r => console.log(`   • ${r}`));
  
  return { score, recommendation, satisfaction, reasoning };
}

/**
 * Display full response
 */
function displayResponse(result) {
  console.log('\n📝 FULL RESPONSE');
  console.log('─'.repeat(80));
  console.log(result.response);
  console.log('─'.repeat(80));
  console.log(`Length: ${result.response.length} characters`);
  console.log(`Time: ${result.responseTime}ms (${(result.responseTime / 1000).toFixed(1)}s)`);
}

/**
 * Main evaluation function
 */
async function evaluateAgent() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         S1-V2 AGENT EVALUATION - AUTOMATED TEST SUITE         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Agent ID: ${AGENT_ID}`);
  console.log(`User ID:  ${USER_ID}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tests:    ${TEST_QUESTIONS.length}`);
  console.log('');
  
  const results = [];
  
  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const question = TEST_QUESTIONS[i];
    const result = await sendQuestion(question, i + 1);
    
    if (!result) {
      console.log('⚠️  Skipping evaluation due to API error\n');
      continue;
    }
    
    // Display response
    displayResponse(result);
    
    // Analyze
    const contentAnalysis = analyzeContent(result);
    const formatAnalysis = analyzeFormat(result.response);
    const ragAnalysis = analyzeRAG(result);
    const scoreData = calculateScore(contentAnalysis, formatAnalysis, ragAnalysis);
    
    results.push({
      testNum: i + 1,
      question: question.question,
      response: result.response,
      responseTime: result.responseTime,
      contentAnalysis,
      formatAnalysis,
      ragAnalysis,
      scoreData
    });
    
    // Delay between tests
    if (i < TEST_QUESTIONS.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary report
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                      EVALUATION SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  results.forEach(r => {
    console.log(`\nTEST ${r.testNum}: ${r.question}`);
    console.log('─'.repeat(80));
    console.log(`  Calificación:     ${r.scoreData.score}`);
    console.log(`  Recomendación:    ${r.scoreData.recommendation}/5`);
    console.log(`  Satisfacción:     ${r.scoreData.satisfaction}/5`);
    console.log(`  Tiempo:           ${(r.responseTime / 1000).toFixed(1)}s`);
    console.log(`  Referencias:      ${r.ragAnalysis.referencesCount}`);
    console.log(`  Información:      ${r.contentAnalysis.foundKeyInfo.length}/${r.contentAnalysis.foundKeyInfo.length + r.contentAnalysis.missingKeyInfo.length}`);
    if (r.contentAnalysis.foundErrors.length > 0) {
      console.log(`  🚨 Errores:       ${r.contentAnalysis.foundErrors.length}`);
    }
    console.log(`  Razonamiento:     ${r.scoreData.reasoning[0]}`);
  });
  
  // Overall stats
  const avgRecommendation = results.reduce((sum, r) => sum + r.scoreData.recommendation, 0) / results.length;
  const avgSatisfaction = results.reduce((sum, r) => sum + r.scoreData.satisfaction, 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const avgReferences = results.reduce((sum, r) => sum + r.ragAnalysis.referencesCount, 0) / results.length;
  
  console.log('\n');
  console.log('─'.repeat(80));
  console.log('OVERALL STATISTICS:');
  console.log('─'.repeat(80));
  console.log(`  Average Recommendation: ${avgRecommendation.toFixed(1)}/5`);
  console.log(`  Average Satisfaction:   ${avgSatisfaction.toFixed(1)}/5`);
  console.log(`  Average Response Time:  ${(avgTime / 1000).toFixed(1)}s`);
  console.log(`  Average References:     ${avgReferences.toFixed(1)}`);
  console.log('');
  
  const sobresalienteCount = results.filter(r => r.scoreData.score === 'Sobresaliente').length;
  const aceptableCount = results.filter(r => r.scoreData.score === 'Aceptable').length;
  const inaceptableCount = results.filter(r => r.scoreData.score === 'Inaceptable').length;
  
  console.log(`  Sobresaliente:  ${sobresalienteCount}/${results.length}`);
  console.log(`  Aceptable:      ${aceptableCount}/${results.length}`);
  console.log(`  Inaceptable:    ${inaceptableCount}/${results.length}`);
  console.log('');
  console.log('═'.repeat(80));
}

// Run evaluation
evaluateAgent().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

