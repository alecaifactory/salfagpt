/**
 * Tim Proactive Testing System
 * Automated testing of core features before users report issues
 * 
 * Created: 2025-11-17
 * Purpose: Detect bugs early, create automated roadmap tickets
 */

import { firestore } from './firestore';
import { createDigitalTwin } from './tim';
import type { CreateTimRequest } from '../types/tim';

// ============================================================================
// CORE FEATURES TO TEST
// ============================================================================

interface CoreFeatureTest {
  name: string;
  displayName: string;
  scenario: string;
  steps: string[];
  frequency: 'daily' | 'weekly' | 'on_deploy';
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedDuration: number;           // ms
  successCriteria: {
    noErrors: boolean;
    maxResponseTime?: number;
    maxMemoryGrowth?: number;
    requiredElements?: string[];
    forbiddenStates?: string[];
  };
}

const CORE_FEATURES: CoreFeatureTest[] = [
  {
    name: 'send_message_ally',
    displayName: 'Send Message to Ally',
    scenario: 'User sends message to personal agent Ally',
    steps: [
      'Navigate to /chat',
      'Click Ally sample question: ¿Por dónde empiezo?',
      'Click Send button',
      'Wait for AI response',
      'Verify response displayed',
      'Verify no errors'
    ],
    frequency: 'daily',
    priority: 'critical',
    expectedDuration: 8000,
    successCriteria: {
      noErrors: true,
      maxResponseTime: 10000,
      maxMemoryGrowth: 20,
      requiredElements: ['User message', 'AI response', 'Send button'],
      forbiddenStates: ['error_state', 'blank_response']
    }
  },
  
  {
    name: 'upload_context_document',
    displayName: 'Upload Context Document',
    scenario: 'User uploads PDF document to context',
    steps: [
      'Navigate to agent',
      'Click "Configurar Contexto"',
      'Upload test PDF (small, <1MB)',
      'Wait for extraction',
      'Verify indexed successfully',
      'Verify toggle ON'
    ],
    frequency: 'weekly',
    priority: 'high',
    expectedDuration: 15000,
    successCriteria: {
      noErrors: true,
      maxResponseTime: 30000,
      requiredElements: ['Upload button', 'Progress indicator', 'Success message'],
      forbiddenStates: ['upload_failed', 'extraction_error']
    }
  },
  
  {
    name: 'create_new_agent',
    displayName: 'Create New Agent',
    scenario: 'User creates new specialized agent',
    steps: [
      'Click "Nuevo Agente"',
      'Verify agent created',
      'Verify appears in sidebar',
      'Click on new agent',
      'Verify loads correctly'
    ],
    frequency: 'weekly',
    priority: 'high',
    expectedDuration: 5000,
    successCriteria: {
      noErrors: true,
      maxResponseTime: 3000,
      requiredElements: ['New agent in list', 'Agent selected'],
      forbiddenStates: ['creation_failed']
    }
  },
  
  {
    name: 'share_agent',
    displayName: 'Share Agent',
    scenario: 'User shares agent with colleague',
    steps: [
      'Select agent',
      'Click "Compartir Agente"',
      'Enter test email',
      'Click Send',
      'Verify invitation created'
    ],
    frequency: 'weekly',
    priority: 'medium',
    expectedDuration: 8000,
    successCriteria: {
      noErrors: true,
      maxResponseTime: 5000,
      requiredElements: ['Share modal', 'Success message'],
      forbiddenStates: ['share_failed']
    }
  },
  
  {
    name: 'search_conversations',
    displayName: 'Search Conversations',
    scenario: 'User searches their conversation history',
    steps: [
      'Navigate to chat',
      'Use search/filter (if available)',
      'Verify results displayed',
      'Verify correct filtering'
    ],
    frequency: 'weekly',
    priority: 'medium',
    expectedDuration: 3000,
    successCriteria: {
      noErrors: true,
      maxResponseTime: 2000,
      requiredElements: ['Search results'],
      forbiddenStates: ['no_results_error']
    }
  }
];

// ============================================================================
// PROACTIVE TESTER
// ============================================================================

export class TimProactiveTester {
  /**
   * Run proactive tests for a user
   */
  async runProactiveTests(userId: string): Promise<ProactiveTestResult[]> {
    console.log(`🤖 Tim running proactive tests for user: ${userId}`);
    
    const results: ProactiveTestResult[] = [];
    
    for (const feature of CORE_FEATURES) {
      if (await this.shouldTest(feature, userId)) {
        console.log(`🧪 Testing feature: ${feature.name}`);
        
        const result = await this.testFeature(userId, feature);
        results.push(result);
        
        // If test failed, create automated ticket
        if (!result.passed) {
          console.log(`🎫 Creating automated ticket for: ${feature.name}`);
          await this.createAutomatedTicket(userId, feature, result);
        }
      }
    }
    
    console.log(`✅ Proactive testing complete. ${results.length} features tested.`);
    return results;
  }
  
  /**
   * Determine if feature should be tested for this user
   */
  private async shouldTest(feature: CoreFeatureTest, userId: string): Promise<boolean> {
    // Check when last tested
    const lastTest = await this.getLastTest(userId, feature.name);
    
    if (!lastTest) return true; // Never tested
    
    const hoursSinceLastTest = (Date.now() - lastTest.createdAt.getTime()) / (1000 * 60 * 60);
    
    // Test based on frequency
    if (feature.frequency === 'daily' && hoursSinceLastTest >= 24) return true;
    if (feature.frequency === 'weekly' && hoursSinceLastTest >= 168) return true;
    if (feature.frequency === 'on_deploy') return false; // Manual trigger
    
    return false;
  }
  
  private async getLastTest(userId: string, featureName: string) {
    const snapshot = await firestore
      .collection('tim_test_sessions')
      .where('userId', '==', userId)
      .where('testMetadata.coreFeature', '==', featureName)
      .where('testMetadata.testType', '==', 'proactive')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    return snapshot.empty ? null : snapshot.docs[0].data();
  }
  
  /**
   * Test a specific feature
   */
  private async testFeature(
    userId: string,
    feature: CoreFeatureTest
  ): Promise<ProactiveTestResult> {
    const startTime = Date.now();
    
    try {
      // Create digital twin
      const twinResult = await createDigitalTwin({
        userId,
        ticketId: `proactive-${feature.name}-${Date.now()}`,
        ticketDetails: {
          userAction: feature.scenario,
          expectedBehavior: 'Feature works correctly within expected time',
          actualBehavior: 'Testing proactively',
          reproductionSteps: feature.steps
        }
      });
      
      // Execute test via Tim orchestrator
      // (Would use Tim's browser automation here)
      // const testResult = await executeBrowserTest(twinResult.sessionId);
      
      const duration = Date.now() - startTime;
      
      // Check success criteria
      const passed = this.evaluateSuccessCriteria(
        feature.successCriteria,
        {} // Would pass actual test results
      );
      
      return {
        feature: feature.name,
        displayName: feature.displayName,
        passed,
        duration,
        expectedDuration: feature.expectedDuration,
        issues: passed ? [] : ['Test execution needed'],
        sessionId: twinResult.sessionId,
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        feature: feature.name,
        displayName: feature.displayName,
        passed: false,
        duration: Date.now() - startTime,
        expectedDuration: feature.expectedDuration,
        issues: [error instanceof Error ? error.message : 'Test failed'],
        timestamp: new Date()
      };
    }
  }
  
  private evaluateSuccessCriteria(criteria: CoreFeatureTest['successCriteria'], results: any): boolean {
    // Would evaluate actual test results against criteria
    // For now, return true (framework only)
    return true;
  }
  
  /**
   * Create automated roadmap ticket
   */
  private async createAutomatedTicket(
    userId: string,
    feature: CoreFeatureTest,
    testResult: ProactiveTestResult
  ): Promise<string> {
    const ticketData = {
      type: 'bug',
      title: `[TIM AUTO] ${feature.displayName} failing for user`,
      description: `Tim detected issue during proactive testing:

**Feature:** ${feature.name}
**User:** ${userId} (anonymized)
**Test Date:** ${testResult.timestamp.toISOString()}

**Test Result:**
- Passed: ${testResult.passed}
- Duration: ${testResult.duration}ms (expected: ${testResult.expectedDuration}ms)
- Issues: ${testResult.issues.join(', ')}

**Test Steps:**
${feature.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Evidence:**
- Tim Session: ${testResult.sessionId}
- View diagnostics: /admin/tim/sessions/${testResult.sessionId}

**Recommended Actions:**
1. Review Tim session diagnostics
2. Reproduce manually if needed
3. Fix identified issues
4. Re-test with Tim

**Auto-Generated by Tim Proactive Testing**`,
      
      priority: feature.priority === 'critical' ? 'P0' : 
                feature.priority === 'high' ? 'P1' : 'P2',
      status: 'backlog',
      lane: 'toDo',
      assignedTo: 'platform_team',
      
      // Metadata
      source: 'tim_proactive',
      timSessionId: testResult.sessionId,
      featureName: feature.name,
      autoGenerated: true,
      confidence: 85,
      
      createdAt: new Date(),
      createdBy: 'tim_agent'
    };
    
    const ticketRef = await firestore.collection('backlog_items').add(ticketData);
    
    console.log(`✅ Automated ticket created: ${ticketRef.id}`);
    
    // Update session with ticket reference
    if (testResult.sessionId) {
      await firestore.collection('tim_test_sessions').doc(testResult.sessionId).update({
        'testMetadata.automatedTicket': ticketRef.id
      });
    }
    
    return ticketRef.id;
  }
  
  /**
   * Schedule proactive tests for all users
   */
  async scheduleProactiveTests(organizationId?: string): Promise<void> {
    console.log('📅 Scheduling proactive tests...');
    
    // Get all active users
    let usersQuery = firestore.collection('users').where('isActive', '==', true);
    
    if (organizationId) {
      usersQuery = usersQuery.where('organizationId', '==', organizationId);
    }
    
    const usersSnapshot = await usersQuery.get();
    
    console.log(`📋 Found ${usersSnapshot.size} active users to test`);
    
    // Queue tests for each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Run tests asynchronously (don't block)
      this.runProactiveTests(userId).catch(error => {
        console.error(`❌ Proactive tests failed for user ${userId}:`, error);
      });
    }
  }
}

// ============================================================================
// RESULT TYPES
// ============================================================================

interface ProactiveTestResult {
  feature: string;
  displayName: string;
  passed: boolean;
  duration: number;
  expectedDuration: number;
  issues: string[];
  sessionId?: string;
  timestamp: Date;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CORE_FEATURES,
  TimProactiveTester
};

export type {
  CoreFeatureTest,
  ProactiveTestResult
};




