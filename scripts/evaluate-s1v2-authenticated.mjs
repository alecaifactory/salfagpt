#!/usr/bin/env node

/**
 * Evaluate S1-v2 agent via API with proper authentication
 * Creates a real session and tests like a real user
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const BASE_URL = 'http://localhost:3000';
const AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye'; // S1-v2
const USER_EMAIL = 'alec@getaifactory.com';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Create a valid session token
 */
function createSessionToken(userId, email) {
  const payload = {
    id: userId,
    email: email,
    role: 'superadmin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Test questions
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
 * Get agent's active source IDs
 */
async function getAgentActiveSourceIds(agentId) {
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  const activeIds = agentDoc.data()?.activeContextSourceIds || [];
  return activeIds;
}

/**
 * Send authenticated request
 */
async function sendAuthenticatedQuestion(question, testNum, sessionToken, activeSourceIds) {
  const conversationId = `eval-test-${testNum}-${Date.now()}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${testNum}: ${question.question}`);
  console.log('='.repeat(80));
  console.log(`Context: ${question.context}`);
  console.log(`Conversation ID: ${conversationId}`);
  
  try {
    console.log('\n📤 Sending authenticated question via API...');
    console.log(`   User: ${USER_EMAIL} (${USER_ID})`);
    console.log(`   Agent: S1-v2 (${AGENT_ID})`);
    console.log(`   Active Sources: ${activeSourceIds.length}`);
    
    const startTime = Date.now();
    
    const url = `${BASE_URL}/api/conversations/${conversationId}/messages-stream`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}` // Add session cookie
      },
      body: JSON.stringify({
        conversationId,
        userId: USER_ID,
        message: question.question,
        agentId: AGENT_ID,
        useAgentSearch: true,
        activeSourceIds: activeSourceIds, // ✅ Pass explicit source IDs
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
    let statusUpdates = [];
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      
      try {
        const jsonStr = line.substring(6).trim();
        if (!jsonStr) continue;
        
        const data = JSON.parse(jsonStr);
        
        if (data.type === 'chunk') {
          fullResponse += data.content;
          process.stdout.write('.'); // Progress
        } else if (data.type === 'references') {
          references = data.references || [];
          console.log(`\n   📚 References received: ${references.length}`);
        } else if (data.type === 'chunks') {
          chunks = data.chunks || [];
        } else if (data.type === 'fragmentMapping') {
          fragmentMapping = data.mapping || [];
        } else if (data.type === 'complete') {
          ragStats = data.ragConfiguration;
        } else if (data.type === 'status') {
          statusUpdates.push(data);
          if (data.step === 'searching' && data.status === 'active') {
            console.log(`\n   🔍 RAG search started...`);
          }
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
      statusUpdates,
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
 * Analyze response
 */
function analyzeResponse(result) {
  // Content analysis
  const response = result.response.toUpperCase();
  const foundKeyInfo = result.expectedKeyInfo.filter(key => response.includes(key.toUpperCase()));
  const missingKeyInfo = result.expectedKeyInfo.filter(key => !response.includes(key.toUpperCase()));
  const foundErrors = result.criticalErrors.filter(error => response.includes(error.toUpperCase()));
  
  // Format analysis
  const hasMarkdownBold = /\*\*[^*]+\*\*/.test(result.response);
  const hasMarkdownList = /\n\s*[-*]\s+/.test(result.response);
  const hasNumberedList = /\n\s*\d+\.\s+/.test(result.response);
  const hasSections = /\n\n/.test(result.response);
  const wordCount = result.response.split(/\s+/).length;
  const avgWordsPerParagraph = hasSections ? wordCount / result.response.split('\n\n').length : wordCount;
  const isWallOfText = avgWordsPerParagraph > 100;
  
  // RAG analysis
  const ragEnabled = result.ragStats?.enabled || false;
  const ragUsed = result.ragStats?.actuallyUsed || false;
  const referencesCount = result.references.length;
  
  // Calculate score
  let score = 'Sobresaliente';
  let reasoning = [];
  let recommendation = 5;
  let satisfaction = 5;
  
  if (foundErrors.length > 0) {
    score = 'Inaceptable';
    recommendation = 1;
    satisfaction = 1;
    reasoning.push(`Contiene ${foundErrors.length} error(es) crítico(s): ${foundErrors.join(', ')}`);
  } else if (missingKeyInfo.length > 1) {
    score = 'Inaceptable';
    recommendation = 2;
    satisfaction = 2;
    reasoning.push(`Falta información crítica: ${missingKeyInfo.join(', ')}`);
  } else if (missingKeyInfo.length === 1) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push(`Falta 1 dato clave: ${missingKeyInfo[0]}`);
  }
  
  if (score === 'Sobresaliente' && isWallOfText) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('Formato difícil de leer (muro de texto)');
  }
  
  if (score === 'Sobresaliente' && !ragUsed) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('RAG no utilizado (respuesta genérica)');
  }
  
  if (score === 'Sobresaliente' && referencesCount === 0) {
    score = 'Aceptable';
    recommendation = 3;
    satisfaction = 3;
    reasoning.push('No muestra referencias');
  }
  
  if (score === 'Sobresaliente' && reasoning.length === 0) {
    reasoning.push('Información completa, formato excelente, RAG usado, referencias mostradas');
  }
  
  return {
    foundKeyInfo,
    missingKeyInfo,
    foundErrors,
    hasMarkdownBold,
    hasMarkdownList,
    hasNumberedList,
    hasSections,
    wordCount,
    isWallOfText,
    ragEnabled,
    ragUsed,
    referencesCount,
    score,
    recommendation,
    satisfaction,
    reasoning
  };
}

/**
 * Display detailed report
 */
function displayReport(result, analysis) {
  console.log('\n📝 FULL RESPONSE');
  console.log('─'.repeat(80));
  console.log(result.response);
  console.log('─'.repeat(80));
  console.log(`Length: ${result.response.length} chars | Time: ${(result.responseTime/1000).toFixed(1)}s\n`);
  
  console.log('📊 CONTENT ANALYSIS');
  console.log('─'.repeat(80));
  console.log(`✅ Key Info Found: ${analysis.foundKeyInfo.length}/${result.expectedKeyInfo.length}`);
  analysis.foundKeyInfo.forEach(k => console.log(`   ✓ "${k}"`));
  if (analysis.missingKeyInfo.length > 0) {
    console.log(`❌ Missing: ${analysis.missingKeyInfo.length}`);
    analysis.missingKeyInfo.forEach(k => console.log(`   ✗ "${k}"`));
  }
  if (analysis.foundErrors.length > 0) {
    console.log(`🚨 ERRORS: ${analysis.foundErrors.length}`);
    analysis.foundErrors.forEach(e => console.log(`   ⚠️  "${e}"`));
  }
  
  console.log('\n📋 FORMAT ANALYSIS');
  console.log('─'.repeat(80));
  console.log(`   Bold: ${analysis.hasMarkdownBold ? '✅' : '❌'} | Lists: ${analysis.hasMarkdownList ? '✅' : '❌'} | Sections: ${analysis.hasSections ? '✅' : '❌'}`);
  console.log(`   Words: ${analysis.wordCount} | Wall of text: ${analysis.isWallOfText ? '⚠️  YES' : '✅ NO'}`);
  
  console.log('\n🔍 RAG ANALYSIS');
  console.log('─'.repeat(80));
  console.log(`   Enabled: ${analysis.ragEnabled ? '✅' : '❌'} | Used: ${analysis.ragUsed ? '✅' : '❌'} | References: ${analysis.referencesCount}`);
  
  if (result.references.length > 0) {
    console.log('\n📚 REFERENCES:');
    result.references.forEach((ref, idx) => {
      console.log(`   [${idx+1}] ${ref.sourceName} (${(ref.similarity*100).toFixed(1)}%)`);
    });
  }
  
  console.log('\n🎯 EVALUATION');
  console.log('─'.repeat(80));
  console.log(`   Calificación:     ${analysis.score}`);
  console.log(`   Recomendación:    ${analysis.recommendation}/5`);
  console.log(`   Satisfacción:     ${analysis.satisfaction}/5`);
  console.log(`   Razonamiento:     ${analysis.reasoning.join('; ')}`);
}

/**
 * Main evaluation
 */
async function runEvaluation() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║    S1-V2 AGENT EVALUATION - AUTHENTICATED API TEST SUITE      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Agent:    S1-v2 (${AGENT_ID})`);
  console.log(`User:     ${USER_EMAIL} (${USER_ID})`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tests:    ${TEST_QUESTIONS.length}\n`);
  
  // Create session token
  console.log('🔐 Creating session token...');
  const sessionToken = createSessionToken(USER_ID, USER_EMAIL);
  console.log('✅ Session created\n');
  
  // Get agent's active source IDs
  console.log('📚 Loading agent sources...');
  const activeSourceIds = await getAgentActiveSourceIds(AGENT_ID);
  console.log(`✅ Loaded ${activeSourceIds.length} active sources\n`);
  
  const results = [];
  
  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const question = TEST_QUESTIONS[i];
    const result = await sendAuthenticatedQuestion(question, i + 1, sessionToken, activeSourceIds);
    
    if (!result) {
      console.log('⚠️  Skipping due to error\n');
      continue;
    }
    
    const analysis = analyzeResponse(result);
    displayReport(result, analysis);
    
    results.push({ result, analysis });
    
    if (i < TEST_QUESTIONS.length - 1) {
      console.log('\n⏳ Waiting 5 seconds...\n');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  // Summary
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                      EVALUATION SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  results.forEach(({ result, analysis }, idx) => {
    console.log(`TEST ${idx + 1}: ${result.question}`);
    console.log(`  Score: ${analysis.score} | Rec: ${analysis.recommendation}/5 | Sat: ${analysis.satisfaction}/5`);
    console.log(`  Time: ${(result.responseTime/1000).toFixed(1)}s | Refs: ${analysis.referencesCount} | Info: ${analysis.foundKeyInfo.length}/${result.expectedKeyInfo.length}`);
    console.log(`  Reason: ${analysis.reasoning[0]}\n`);
  });
  
  const avgRec = results.reduce((s, r) => s + r.analysis.recommendation, 0) / results.length;
  const avgSat = results.reduce((s, r) => s + r.analysis.satisfaction, 0) / results.length;
  const avgTime = results.reduce((s, r) => s + r.result.responseTime, 0) / results.length;
  const avgRefs = results.reduce((s, r) => s + r.analysis.referencesCount, 0) / results.length;
  
  console.log('OVERALL STATS:');
  console.log(`  Avg Recommendation: ${avgRec.toFixed(1)}/5`);
  console.log(`  Avg Satisfaction:   ${avgSat.toFixed(1)}/5`);
  console.log(`  Avg Response Time:  ${(avgTime/1000).toFixed(1)}s`);
  console.log(`  Avg References:     ${avgRefs.toFixed(1)}\n`);
  
  const scores = results.map(r => r.analysis.score);
  console.log(`  Sobresaliente: ${scores.filter(s => s === 'Sobresaliente').length}/${results.length}`);
  console.log(`  Aceptable:     ${scores.filter(s => s === 'Aceptable').length}/${results.length}`);
  console.log(`  Inaceptable:   ${scores.filter(s => s === 'Inaceptable').length}/${results.length}`);
  console.log('\n' + '═'.repeat(80));
}

runEvaluation().catch(err => {
  console.error('\n❌ Fatal:', err);
  process.exit(1);
});

