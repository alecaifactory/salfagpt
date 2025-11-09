/**
 * Stella Chat API Helpers
 * 
 * Helper functions for enhanced Stella chat system.
 */

import { firestore } from '../../../lib/firestore';
import { DEFAULT_STELLA_CONFIG } from '../../../types/stella-config';

const STELLA_SYSTEM_PROMPT = `# Stella - AI Product Agent

## Tu Identidad
Eres Stella, una agente de producto con IA que ayuda a usuarios a documentar feedback de manera estructurada y efectiva.`;

/**
 * Load Stella configuration with fallback to default
 */
export async function loadStellaConfiguration() {
  try {
    const configDoc = await firestore
      .collection('stella_configuration')
      .doc('stella-config')
      .get();
    
    if (!configDoc.exists) {
      console.log('ℹ️ Using default Stella configuration');
      return {
        organizationId: 'default-org',
        organizationPrompt: DEFAULT_STELLA_CONFIG.organizationPrompt,
        stellaRolePrompt: DEFAULT_STELLA_CONFIG.stellaRolePrompt,
        privacyConfig: DEFAULT_STELLA_CONFIG.privacyConfig,
        aiConfig: DEFAULT_STELLA_CONFIG.aiConfig,
        contextSources: DEFAULT_STELLA_CONFIG.contextSources,
      };
    }
    
    return configDoc.data();
  } catch (error) {
    console.error('Error loading Stella config:', error);
    return {
      organizationId: 'default-org',
      organizationPrompt: '',
      stellaRolePrompt: STELLA_SYSTEM_PROMPT,
      privacyConfig: {
        hashUserIds: true,
        redactEmails: true,
        encryptStrategicInfo: false,
        auditTrail: true,
        piiDetection: true,
      },
      aiConfig: {
        model: 'gemini-2.5-flash' as const,
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
      contextSources: {
        roadmap: true,
        userStories: true,
        bugs: true,
        featureRequests: true,
        performanceMetrics: false,
        userSatisfaction: false,
        agentPerformance: false,
        domainPrompts: false,
        agentPrompts: false,
        infrastructure: true,
      },
    };
  }
}

/**
 * Log Stella interaction for audit
 */
export async function logStellaInteraction(data: {
  hashedUserId: string;
  sessionId: string;
  category: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  piiDetected: boolean;
  responseTime: number;
}) {
  try {
    await firestore.collection('stella_audit_log').add({
      ...data,
      totalTokens: data.inputTokens + data.outputTokens,
      timestamp: new Date(),
      source: process.env.NODE_ENV === 'production' ? 'production' : 'localhost',
    });
  } catch (error) {
    console.warn('⚠️ Failed to log Stella interaction (non-critical):', error);
  }
}

