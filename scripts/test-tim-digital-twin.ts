#!/usr/bin/env tsx
/**
 * Tim Digital Twin Testing Script
 * Tests Tim's ability to create digital twins and test scenarios
 * 
 * Usage: npm run test:tim
 */

import { 
  createDigitalTwin, 
  anonymizeEmail, 
  anonymizeName,
  redactPII 
} from '../src/lib/tim';
import type { CreateTimRequest } from '../src/types/tim';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

const TEST_SCENARIOS: CreateTimRequest[] = [
  // Scenario 1: Message Send Failure
  {
    userId: 'usr_g14stel2ccwsl0eafp60', // user@demo.com
    ticketId: 'TIM-TEST-001',
    ticketDetails: {
      userAction: 'User typed "Hello" and clicked Send button',
      expectedBehavior: 'Message should be sent and AI should respond',
      actualBehavior: 'Error appeared: "Failed to send message"',
      reproductionSteps: [
        'Login to http://localhost:3000/chat as user@demo.com',
        'Click on existing agent "Chat General"',
        'Type message: "Hello, can you help me?"',
        'Click Send button',
        'Observe error message in UI'
      ]
    }
  },
  
  // Scenario 2: Context Source Upload Issue
  {
    userId: 'usr_d51z4oimxwijhqz1wo7n', // power_user@demo.com
    ticketId: 'TIM-TEST-002',
    ticketDetails: {
      userAction: 'Attempted to upload a PDF document',
      expectedBehavior: 'PDF should be processed and added to context sources',
      actualBehavior: 'Upload stuck at "Processing..." indefinitely',
      reproductionSteps: [
        'Login to http://localhost:3000/chat as poweruser@demo.com',
        'Open any agent',
        'Click "Agregar Fuente" in context panel',
        'Select "Archivo" option',
        'Upload a PDF file (test.pdf)',
        'Observe progress indicator stuck'
      ]
    }
  },
  
  // Scenario 3: Agent Creation Success Path
  {
    userId: 'usr_criv06hp5i99zof1uxzz', // expert@demo.com (using as new user)
    ticketId: 'TIM-TEST-003',
    ticketDetails: {
      userAction: 'Created a new agent',
      expectedBehavior: 'Agent should be created and appear in sidebar',
      actualBehavior: 'Agent created successfully (testing happy path)',
      reproductionSteps: [
        'Login to http://localhost:3000/chat as newuser@demo.com',
        'Click "+ Nuevo Agente" button',
        'Verify new agent appears in sidebar',
        'Verify agent is selected',
        'Send a test message to confirm it works'
      ]
    }
  },
  
  // Scenario 4: Model Switch Test
  {
    userId: 'usr_ygbwzh8jsdjwbqs0lwwv', // admin@demo.com
    ticketId: 'TIM-TEST-004',
    ticketDetails: {
      userAction: 'Switched from Flash to Pro model',
      expectedBehavior: 'Model should switch and next message uses Pro',
      actualBehavior: 'Model switch appears to work but still using Flash',
      reproductionSteps: [
        'Login to http://localhost:3000/chat as admin@demo.com',
        'Open existing conversation',
        'Click model selector dropdown',
        'Select "Gemini 2.5 Pro"',
        'Send a message',
        'Check response metadata to verify model used'
      ]
    }
  },
  
  // Scenario 5: Context Search Performance
  {
    userId: 'usr_d51z4oimxwijhqz1wo7n', // power_user@demo.com
    ticketId: 'TIM-TEST-005',
    ticketDetails: {
      userAction: 'Searched for documents in context panel',
      expectedBehavior: 'Search results appear within 2 seconds',
      actualBehavior: 'Search takes 10+ seconds with many documents',
      reproductionSteps: [
        'Login to http://localhost:3000/chat as poweruser@demo.com',
        'Open agent with 50+ context sources',
        'Type search query in context search box',
        'Measure time until results appear',
        'Observe slow performance with loading spinner'
      ]
    }
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function printHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70) + '\n');
}

function printScenario(scenario: CreateTimRequest, index: number) {
  console.log(`📋 Scenario ${index + 1}: ${scenario.ticketId}`);
  console.log(`   User: ${scenario.userId}`);
  console.log(`   Issue: ${scenario.ticketDetails.actualBehavior}`);
  console.log('');
}

function printResult(result: any) {
  console.log(`✅ Digital Twin Created!`);
  console.log(`   Twin ID: ${result.digitalTwinId}`);
  console.log(`   Session ID: ${result.sessionId}`);
  console.log(`   Compliance Score: ${result.complianceScore}% ${result.complianceScore >= 98 ? '✅' : '❌'}`);
  console.log(`   Status: ${result.status}`);
  console.log('');
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function testTimDigitalTwin() {
  printHeader('🤖 TIM - Digital Twin Testing Agent');
  
  console.log('Tim (Together Imagine More) creates privacy-safe digital twins');
  console.log('to reproduce user issues automatically.\n');
  
  // Test 1: Privacy Functions
  printHeader('🔐 Test 1: Privacy & Anonymization');
  
  const testEmail = 'alec@getaifactory.com';
  const testName = 'Alec Johnson';
  const testText = 'Contact me at alec@getaifactory.com or call 555-123-4567';
  
  console.log('Original Email:', testEmail);
  console.log('Anonymized:    ', anonymizeEmail(testEmail));
  console.log('');
  
  console.log('Original Name:', testName);
  console.log('Anonymized:   ', anonymizeName(testName));
  console.log('');
  
  console.log('Original Text:', testText);
  console.log('Redacted PII: ', redactPII(testText));
  console.log('');
  
  // Test 2: Create Digital Twins
  printHeader('🧪 Test 2: Creating Digital Twins');
  
  console.log(`Creating ${TEST_SCENARIOS.length} digital twins for test scenarios...\n`);
  
  const results = [];
  
  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    printScenario(scenario, i);
    
    try {
      const result = await createDigitalTwin(scenario);
      printResult(result);
      results.push({ scenario, result, success: true });
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('');
      results.push({ scenario, error, success: false });
    }
  }
  
  // Summary
  printHeader('📊 Summary');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Scenarios: ${TEST_SCENARIOS.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');
  
  if (successful > 0) {
    console.log('📋 Digital Twins Created:');
    results
      .filter(r => r.success)
      .forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.result.digitalTwinId}`);
        console.log(`      → Compliance: ${r.result.complianceScore}%`);
      });
    console.log('');
  }
  
  // Next Steps
  printHeader('🎯 Next Steps');
  
  console.log('To view Tim sessions in the admin panel:');
  console.log('1. Visit http://localhost:3000/admin');
  console.log('2. Navigate to "Tim Sessions" tab');
  console.log('3. Review digital twins and test results');
  console.log('');
  
  console.log('To execute a Tim test with browser automation:');
  console.log('1. Use MCP browser tools via Cursor');
  console.log('2. Ask: "Execute Tim digital twin test for TIM-TEST-001"');
  console.log('3. Tim will reproduce the issue and capture diagnostics');
  console.log('');
  
  console.log('To query Tim sessions via API:');
  console.log('GET /api/tim/my-sessions');
  console.log('GET /api/tim/sessions/[id]');
  console.log('');
  
  printHeader('✅ Tim Testing Complete!');
  
  process.exit(successful === TEST_SCENARIOS.length ? 0 : 1);
}

// ============================================================================
// RUN TESTS
// ============================================================================

// Auto-run when executed directly
testTimDigitalTwin().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { testTimDigitalTwin };

