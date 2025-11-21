#!/usr/bin/env node

/**
 * Test S1-v2 agent with evaluation questions
 * Simulates user questions and captures responses for evaluation
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye'; // S1-v2

// Test questions from evaluation
const TEST_QUESTIONS = [
  {
    id: 1,
    question: '¿Cómo hago un pedido de convenio?',
    expectedKeyInfo: [
      'ME21N',
      'ZCON',
      'tipo de pedido'
    ],
    criticalErrors: [
      'ME51N', // Wrong transaction
      'ZBOL',  // Wrong type
      'día 15' // False deadline
    ]
  },
  {
    id: 3,
    question: '¿Cuándo debo enviar el informe de consumo de petróleo?',
    expectedKeyInfo: [
      '4to día hábil',
      'ZMM_IE',
      'mes siguiente',
      'Petróleo Diésel'
    ],
    criticalErrors: []
  }
];

async function testQuestion(question, testNum) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${testNum}: ${question.question}`);
  console.log('='.repeat(80));
  
  try {
    // Create a temporary conversation for testing
    const conversationId = `test-${Date.now()}`;
    
    console.log('\n📤 Sending question to S1-v2...');
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=your-session-cookie' // Note: This won't work without auth
      },
      body: JSON.stringify({
        message: question.question,
        agentId: AGENT_ID,
        useAgentSearch: true,
        activeSourceIds: [], // Will use all agent sources
      })
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      const errorText = await response.text();
      console.error('Error:', errorText.substring(0, 200));
      return null;
    }
    
    // Parse streaming response
    const text = await response.text();
    const lines = text.split('\n');
    
    let fullResponse = '';
    let references = [];
    let chunks = [];
    let ragStats = null;
    
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      
      try {
        const data = JSON.parse(line.substring(6));
        
        if (data.type === 'chunk') {
          fullResponse += data.content;
        } else if (data.type === 'references') {
          references = data.references || [];
        } else if (data.type === 'chunks') {
          chunks = data.chunks || [];
        } else if (data.type === 'complete') {
          ragStats = data.ragConfiguration;
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    // Evaluation
    console.log('\n📝 RESPONSE:');
    console.log('-'.repeat(80));
    console.log(fullResponse);
    console.log('-'.repeat(80));
    
    console.log('\n📊 METADATA:');
    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Response length: ${fullResponse.length} chars`);
    console.log(`   References: ${references.length}`);
    console.log(`   Chunks used: ${chunks.length}`);
    console.log(`   RAG enabled: ${ragStats?.enabled || false}`);
    console.log(`   RAG used: ${ragStats?.actuallyUsed || false}`);
    
    if (references.length > 0) {
      console.log('\n📚 REFERENCES:');
      references.forEach((ref, idx) => {
        console.log(`   [${idx + 1}] ${ref.sourceName} (similarity: ${(ref.similarity * 100).toFixed(1)}%)`);
      });
    }
    
    // Content Evaluation
    console.log('\n✅ CONTENT EVALUATION:');
    
    // Check for expected key information
    const foundKeyInfo = question.expectedKeyInfo.filter(key => 
      fullResponse.toUpperCase().includes(key.toUpperCase())
    );
    
    console.log(`   Expected info found: ${foundKeyInfo.length}/${question.expectedKeyInfo.length}`);
    foundKeyInfo.forEach(key => {
      console.log(`      ✅ "${key}"`);
    });
    
    const missingKeyInfo = question.expectedKeyInfo.filter(key => 
      !fullResponse.toUpperCase().includes(key.toUpperCase())
    );
    
    if (missingKeyInfo.length > 0) {
      console.log(`   Missing info: ${missingKeyInfo.length}`);
      missingKeyInfo.forEach(key => {
        console.log(`      ❌ "${key}"`);
      });
    }
    
    // Check for critical errors
    const foundErrors = question.criticalErrors.filter(error => 
      fullResponse.toUpperCase().includes(error.toUpperCase())
    );
    
    if (foundErrors.length > 0) {
      console.log(`\n   ⚠️  CRITICAL ERRORS FOUND: ${foundErrors.length}`);
      foundErrors.forEach(error => {
        console.log(`      🚨 "${error}" (WRONG INFORMATION)`);
      });
    }
    
    // Format Evaluation
    console.log('\n📋 FORMAT EVALUATION:');
    
    const hasMarkdownBold = /\*\*/.test(fullResponse);
    const hasMarkdownList = /\n\s*[\*\-]\s+/.test(fullResponse);
    const hasBrTags = /<br>/.test(fullResponse);
    const hasLineBreaks = /\n\n/.test(fullResponse);
    
    console.log(`   Has bold text: ${hasMarkdownBold || hasBrTags ? '✅' : '❌'}`);
    console.log(`   Has bullet points: ${hasMarkdownList ? '✅' : '❌'}`);
    console.log(`   Has structure: ${hasLineBreaks || hasBrTags ? '✅' : '❌'}`);
    
    const isWallOfText = fullResponse.length > 200 && !hasLineBreaks && !hasMarkdownList;
    if (isWallOfText) {
      console.log(`   ⚠️  Warning: Response is a "wall of text" (hard to read)`);
    }
    
    // Overall Score
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    let score = 'Sobresaliente';
    let reasoning = [];
    
    // Content checks
    if (foundErrors.length > 0) {
      score = 'Inaceptable';
      reasoning.push(`Contains ${foundErrors.length} critical error(s)`);
    } else if (missingKeyInfo.length > 0) {
      score = 'Aceptable';
      reasoning.push(`Missing ${missingKeyInfo.length} key piece(s) of information`);
    }
    
    // Format checks
    if (isWallOfText && score === 'Sobresaliente') {
      score = 'Aceptable';
      reasoning.push('Format is difficult to read (wall of text)');
    }
    
    // RAG checks
    if (!ragStats?.actuallyUsed && score === 'Sobresaliente') {
      score = 'Aceptable';
      reasoning.push('RAG was not used (may be generic response)');
    }
    
    if (references.length === 0 && score === 'Sobresaliente') {
      score = 'Aceptable';
      reasoning.push('No references provided');
    }
    
    if (score === 'Sobresaliente' && reasoning.length === 0) {
      reasoning.push('Complete information, good format, RAG used, references shown');
    }
    
    console.log(`   Rating: ${score}`);
    console.log(`   Reasoning: ${reasoning.join('; ')}`);
    
    return {
      question: question.question,
      response: fullResponse,
      references,
      responseTime,
      score,
      reasoning: reasoning.join('; '),
      foundKeyInfo,
      missingKeyInfo,
      foundErrors
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🧪 S1-v2 AGENT EVALUATION TEST SUITE');
  console.log('=====================================\n');
  console.log(`Agent ID: ${AGENT_ID}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test questions: ${TEST_QUESTIONS.length}\n`);
  
  console.log('⚠️  NOTE: This test requires a valid session cookie.');
  console.log('         Manual browser testing recommended for authenticated endpoints.\n');
  
  const results = [];
  
  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const result = await testQuestion(TEST_QUESTIONS[i], i + 1);
    if (result) {
      results.push(result);
    }
    
    // Delay between tests
    if (i < TEST_QUESTIONS.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.question}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   Time: ${result.responseTime}ms`);
    console.log(`   References: ${result.references.length}`);
    console.log(`   Key info: ${result.foundKeyInfo.length}/${result.foundKeyInfo.length + result.missingKeyInfo.length}`);
    if (result.foundErrors.length > 0) {
      console.log(`   ⚠️  Errors: ${result.foundErrors.length}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
}

runAllTests();

